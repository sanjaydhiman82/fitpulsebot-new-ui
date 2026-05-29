import React, { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts';
import styles from './LogPage.module.css';
import { api, getUserId } from '../api';

// ── Period config ──────────────────────────────────────────────────────────
type PeriodKey = 'weekly' | 'monthly' | '3months' | '6months' | '1year';
const PERIODS: { key: PeriodKey; label: string; days: number }[] = [
  { key: 'weekly',  label: 'Weekly',   days: 7   },
  { key: 'monthly', label: 'Monthly',  days: 30  },
  { key: '3months', label: '3 Months', days: 90  },
  { key: '6months', label: '6 Months', days: 180 },
  { key: '1year',   label: '1 Year',   days: 365 },
];

// ── State shape ────────────────────────────────────────────────────────────
interface ReportState {
  // Weight trend (from /dashboard/charts/weight)
  weightSeries: { date: string; weight: number; movingAvg: number }[];
  startWeight:  number | null;
  latestWeight: number | null;
  weightChangeKg: number | null;
  // Activity (from /dashboard/charts/activity)
  activitySeries: { date: string; activeMinutes: number; caloriesBurned: number }[];
  totalActiveDays: number;
  avgCalBurned: number;
  // Food averages (from /food-intake/average)
  avgCalIn:    number;
  avgProteinG: number;
  avgCarbsG:   number;
  avgFatG:     number;
  proteinPct:  number;
  carbsPct:    number;
  fatPct:      number;
  // Water avg (from /water-intake/average) — averageVolumeMl
  avgWaterL:   number;
  // Sleep avg (from /user/sleep/average) — averageSleepHr
  avgSleepHr:  number;
  // Goal (from /user/goal/:userId) — weightTarget
  goalWeight:  number | null;
}

const EMPTY: ReportState = {
  weightSeries: [], startWeight: null, latestWeight: null, weightChangeKg: null,
  activitySeries: [], totalActiveDays: 0, avgCalBurned: 0,
  avgCalIn: 0, avgProteinG: 0, avgCarbsG: 0, avgFatG: 0,
  proteinPct: 30, carbsPct: 45, fatPct: 25,
  avgWaterL: 0, avgSleepHr: 0, goalWeight: null,
};

// ── Helpers ────────────────────────────────────────────────────────────────
function fmt1(n: number) { return n.toFixed(1); }
function fmtInt(n: number) { return Math.round(n).toLocaleString(); }

function macroPercents(proteinG: number, carbsG: number, fatG: number) {
  const total = proteinG * 4 + carbsG * 4 + fatG * 9;
  if (total === 0) return { proteinPct: 30, carbsPct: 45, fatPct: 25 };
  const p = Math.round((proteinG * 4 / total) * 100);
  const c = Math.round((carbsG  * 4 / total) * 100);
  const f = 100 - p - c;
  return { proteinPct: p, carbsPct: c, fatPct: Math.max(0, f) };
}

// ── Sub-components ─────────────────────────────────────────────────────────
function KpiCard({ label, value, unit, sub, subColor = 'var(--accent)' }: any) {
  return (
    <div className={styles.sumCard}>
      <div className={styles.sumLabel}>{label}</div>
      <div className={styles.sumValue}>
        {value}{unit && <span className={styles.sumUnit}> {unit}</span>}
      </div>
      {sub && <div style={{ fontSize: 12, fontWeight: 600, color: subColor, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function MiniBar({ label, actual, goal, unit, color }: any) {
  const pct = Math.min(100, goal > 0 ? Math.round((actual / goal) * 100) : 0);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
          {typeof actual === 'number' ? (Number.isInteger(actual) ? actual : fmt1(actual)) : actual}
          {unit && <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}> / {goal} {unit}</span>}
        </span>
      </div>
      <div className={styles.sumTrack}>
        <div className={styles.sumFill} style={{ width: pct + '%', background: color }} />
      </div>
      <div className={styles.sumGoal}>{pct}% of goal {pct >= 80 ? '✓' : '— needs attention'}</div>
    </div>
  );
}

const MACRO_COLORS = ['#818cf8', '#34d399', '#f59e0b'];
function MacroDonut({ p, c, f }: { p: number; c: number; f: number }) {
  const data = [
    { name: `Protein ${p}%`, value: p },
    { name: `Carbs ${c}%`,   value: c },
    { name: `Fat ${f}%`,     value: f },
  ];
  return (
    <ResponsiveContainer width="100%" height={185}>
      <PieChart>
        <Pie data={data} cx="50%" cy="48%" innerRadius={46} outerRadius={70}
          dataKey="value" paddingAngle={3}>
          {data.map((_, i) => <Cell key={i} fill={MACRO_COLORS[i]} />)}
        </Pie>
        <Tooltip formatter={(v: any) => `${v}%`}
          contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13 }} />
        <Legend iconType="square" iconSize={10}
          wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function ChartTip({ active, payload, label, unit = '' }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 4, margin: '0 0 4px' }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color, fontWeight: 700, margin: '2px 0' }}>{p.name}: {p.value}{unit}</p>
      ))}
    </div>
  );
}

function EmptyChart({ msg }: { msg: string }) {
  return <div className={styles.emptyRow}>{msg}</div>;
}

// ── AI insights builder ────────────────────────────────────────────────────
function buildInsights(s: ReportState): { color: string; text: React.ReactElement }[] {
  const out: { color: string; text: React.ReactElement }[] = [];

  // Weight
  if (s.weightChangeKg !== null) {
    const lost = s.weightChangeKg < 0;
    out.push({ color: lost ? '#10b981' : '#f59e0b', text: <>
      <strong>{lost ? 'Great weight progress!' : 'Weight is trending up.'}</strong>{' '}
      You've {lost ? 'lost' : 'gained'} {Math.abs(s.weightChangeKg)} kg. {lost ? 'Keep it up!' : 'Review your calorie balance.'}
    </> });
  }

  // Calorie balance
  const deficit = s.avgCalIn > 0 ? s.avgCalIn - s.avgCalBurned : null;
  if (deficit !== null) {
    out.push({ color: deficit < 0 ? '#10b981' : '#ef4444', text: <>
      <strong>{deficit < 0 ? 'Calorie deficit on track.' : 'Calorie surplus detected.'}</strong>{' '}
      Average net {deficit < 0 ? `deficit of ${fmtInt(Math.abs(deficit))} kcal/day` : `surplus of ${fmtInt(deficit)} kcal/day`}.
      {deficit < 0 ? ' Consistent with fat loss.' : ' Consider increasing activity.'}
    </> });
  }

  // Water
  out.push(s.avgWaterL >= 2.0
    ? { color: '#3b82f6', text: <><strong>Hydration is solid!</strong> Averaging {fmt1(s.avgWaterL)}L/day — above the 2L minimum.</> }
    : { color: '#f59e0b', text: <><strong>Hydration needs attention.</strong> Avg {fmt1(s.avgWaterL)}L/day is below the 2.5L goal. Try hourly reminders.</> }
  );

  // Sleep
  out.push(s.avgSleepHr >= 7
    ? { color: '#8b5cf6', text: <><strong>Sleep quality is good.</strong> Averaging {fmt1(s.avgSleepHr)} hrs — meeting the 7-8hr recovery target.</> }
    : { color: '#8b5cf6', text: <><strong>Sleep is below target.</strong> Averaging {fmt1(s.avgSleepHr)} hrs. Poor sleep raises cortisol and slows fat loss.</> }
  );

  // Protein
  if (s.proteinPct < 25) {
    out.push({ color: '#ec4899', text: <>
      <strong>Protein is low ({s.proteinPct}% of calories).</strong> Aim for ≥ 30% to preserve muscle in a deficit. Add eggs, paneer, or dal to meals.
    </> });
  }

  return out;
}

// ── Main component ─────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [period, setPeriod]   = useState<PeriodKey>('monthly');
  const [state, setState]     = useState<ReportState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const days = PERIODS.find(p => p.key === period)!.days;
  const label = PERIODS.find(p => p.key === period)!.label;

  const loadData = useCallback(async () => {
    setLoading(true); setError('');
    const userId = getUserId()!;
    try {
      // ── Fetch all in parallel — allSettled so one 404 doesn't kill the rest ──
      const [wChart, aChart, foodAvg, waterAvg, sleepAvg, goals] = await Promise.allSettled([
        api.dashboard.weightChart(days, 75),          // /dashboard/charts/weight
        api.dashboard.activityChart(days),             // /dashboard/charts/activity
        api.food.getAverage(days),                     // /food-intake/average → averageCalories, averageProteinG, etc.
        api.water.getAverage(days),                    // /water-intake/average → averageVolumeMl
        api.sleep.getAverage(days),                    // /user/sleep/average → averageSleepHr
        api.profile.getGoals(userId),                  // /user/goal/:userId → weightTarget
      ]);

      // Weight chart  — response: { data: [{date, weight, movingAvg}], summary: {startWeight, latestWeight, changeKg} }
      const wData   = wChart.status === 'fulfilled' ? wChart.value : null;
      const wSeries = wData?.data ?? [];
      const wSummary= wData?.summary ?? null;

      // Activity chart — response: { data: [{date, activeMinutes, caloriesBurned}] }
      const aData    = aChart.status === 'fulfilled' ? aChart.value : null;
      const aSeries  = aData?.data ?? [];
      const activeDays = aSeries.filter((r: any) => r.caloriesBurned > 0).length;
      const totalBurned = aSeries.reduce((sum: number, r: any) => sum + (r.caloriesBurned ?? 0), 0);
      const avgBurned   = aSeries.length > 0 ? Math.round(totalBurned / aSeries.length) : 0;

      // Food avg — response: { averageCalories, averageProteinG, averageCarbsG, averageFatG }
      const food = foodAvg.status === 'fulfilled' ? foodAvg.value : null;
      const avgCalIn   = food?.averageCalories  ?? 0;
      const avgProteinG= food?.averageProteinG  ?? 0;
      const avgCarbsG  = food?.averageCarbsG    ?? 0;
      const avgFatG    = food?.averageFatG      ?? 0;
      const { proteinPct, carbsPct, fatPct } = macroPercents(avgProteinG, avgCarbsG, avgFatG);

      // Water avg — response: { averageVolumeMl }
      const waterMl  = waterAvg.status === 'fulfilled' ? (waterAvg.value?.averageVolumeMl ?? 0) : 0;

      // Sleep avg — response: { averageSleepHr }
      const sleepHr  = sleepAvg.status === 'fulfilled' ? (sleepAvg.value?.averageSleepHr ?? 0) : 0;

      // Goals — response: { weightTarget }
      const goalWt   = goals.status === 'fulfilled' ? (goals.value?.weightTarget ?? null) : null;

      setState({
        weightSeries:   wSeries,
        startWeight:    wSummary?.startWeight  ?? null,
        latestWeight:   wSummary?.latestWeight ?? null,
        weightChangeKg: wSummary?.changeKg     ?? null,
        activitySeries: aSeries,
        totalActiveDays: activeDays,
        avgCalBurned:   avgBurned,
        avgCalIn,
        avgProteinG, avgCarbsG, avgFatG,
        proteinPct, carbsPct, fatPct,
        avgWaterL: +(waterMl / 1000).toFixed(2),
        avgSleepHr: sleepHr,
        goalWeight: goalWt,
      });
    } catch (e: any) {
      setError(e.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Derived display values ─────────────────────────────────────────────
  const axisStyle = { fill: 'var(--text-muted)', fontSize: 11 } as const;
  const tipStyle  = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13 };
  const gridColor = 'var(--border)';
  const tickInterval = (len: number) => days <= 14 ? 0 : Math.max(0, Math.floor(len / 6) - 1);

  const deficit = state.avgCalIn > 0 ? state.avgCalIn - state.avgCalBurned : null;
  const goalPct = state.goalWeight && state.startWeight && state.latestWeight
    ? Math.min(100, Math.max(0, Math.round(
        ((state.startWeight - state.latestWeight) / (state.startWeight - state.goalWeight)) * 100
      )))
    : null;

  const insights = buildInsights(state);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.pageTitle}>360° Health Transformation Report (HTR)</h2>
          <p className={styles.pageDesc}>Complete view of your health, fitness, nutrition, recovery, biomarkers, and transformation journey.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div className={styles.periodTabs}>
            {PERIODS.map(p => (
              <button key={p.key}
                className={`${styles.periodBtn} ${period === p.key ? styles.periodActive : ''}`}
                onClick={() => setPeriod(p.key)}>
                {p.label}
              </button>
            ))}
          </div>
          <button className={styles.refreshBtn} onClick={loadData} title="Refresh" disabled={loading}>
            <span style={{ fontSize: 16, display: 'inline-block', animation: loading ? 'spin 0.8s linear infinite' : 'none' }}>↻</span>
          </button>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}
      {loading && <div className={styles.loadingRow}>Loading {label.toLowerCase()} report…</div>}

      {/* KPI Cards */}
      <div className={styles.summaryRow}>
        <KpiCard label="Current Weight"
          value={state.latestWeight ?? '—'}
          unit={state.latestWeight ? 'kg' : ''}
          sub={state.weightChangeKg !== null
            ? `${state.weightChangeKg > 0 ? '▲' : '▼'} ${Math.abs(state.weightChangeKg)} kg`
            : undefined}
          subColor={state.weightChangeKg !== null && state.weightChangeKg < 0 ? '#10b981' : '#f59e0b'}
        />
        <KpiCard label="Avg Cal Balance"
          value={deficit !== null ? (deficit > 0 ? '+' : '') + fmtInt(deficit) : '—'}
          unit={deficit !== null ? 'kcal' : ''}
          sub={deficit !== null ? (deficit < 0 ? 'Deficit ✓' : 'Surplus — review') : undefined}
          subColor={deficit !== null && deficit < 0 ? '#10b981' : '#ef4444'}
        />
        <KpiCard label="Active Days"
          value={state.totalActiveDays > 0 ? state.totalActiveDays : '—'}
          unit={state.totalActiveDays > 0 ? `/ ${days}` : ''}
          sub={state.totalActiveDays > 0
            ? `${Math.round((state.totalActiveDays / days) * 100)}% activity rate`
            : undefined}
          subColor="#818cf8"
        />
        <KpiCard label="Goal Progress"
          value={goalPct !== null ? goalPct : '—'}
          unit={goalPct !== null ? '%' : ''}
          sub={state.goalWeight ? `Target: ${state.goalWeight} kg` : 'Set a goal weight'}
          subColor="#34d399"
        />
      </div>

      {/* Row 1 — Weight Trend + Activity */}
      <div className={styles.chartsRow2}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Weight Trend</span>
            {state.weightChangeKg !== null && (
              <span style={{ fontSize: 12, fontWeight: 700, color: state.weightChangeKg < 0 ? '#10b981' : '#f59e0b' }}>
                {state.weightChangeKg > 0 ? '▲' : '▼'} {Math.abs(state.weightChangeKg)} kg
              </span>
            )}
          </div>
          {state.weightSeries.length > 0 ? (
            <ResponsiveContainer width="100%" height={195}>
              <AreaChart data={state.weightSeries}>
                <defs>
                  <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#818cf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.4} />
                <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false}
                  interval={tickInterval(state.weightSeries.length)} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false}
                  domain={['auto', 'auto']} tickFormatter={v => v + ' kg'} width={60} />
                <Tooltip content={<ChartTip unit=" kg" />} />
                <Area type="monotone" dataKey="weight" name="Weight"
                  stroke="#818cf8" strokeWidth={2.5} fill="url(#wGrad)" dot={days <= 30} />
                <Area type="monotone" dataKey="movingAvg" name="7-day avg"
                  stroke="#34d399" strokeWidth={1.5} fill="none" strokeDasharray="4 3" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : !loading && <EmptyChart msg="No weight logs found for this period. Log your weight daily for trend data." />}
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Activity — Calories Burned</span>
            <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--text-muted)' }}>
              <span><span style={{ color: '#3b82f6' }}>■</span> kcal</span>
              <span><span style={{ color: '#10b981' }}>■</span> mins</span>
            </div>
          </div>
          {state.activitySeries.length > 0 ? (
            <ResponsiveContainer width="100%" height={195}>
              <BarChart data={state.activitySeries} barSize={days <= 14 ? 12 : 6} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.4} />
                <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false}
                  interval={tickInterval(state.activitySeries.length)} />
                <YAxis yAxisId="cal" tick={axisStyle} axisLine={false} tickLine={false} width={48}
                  tickFormatter={v => v.toLocaleString()} />
                <YAxis yAxisId="min" orientation="right" tick={axisStyle} axisLine={false}
                  tickLine={false} width={36} tickFormatter={v => v + 'm'} />
                <Tooltip contentStyle={tipStyle} />
                <Bar yAxisId="cal" dataKey="caloriesBurned" name="Cal burned"
                  fill="#3b82f6" opacity={0.85} radius={[3,3,0,0]} />
                <Bar yAxisId="min" dataKey="activeMinutes" name="Active mins"
                  fill="#10b981" opacity={0.85} radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : !loading && <EmptyChart msg="No activity logged for this period. Log workouts to see burn data." />}
        </div>
      </div>

      {/* Row 2 — Macro Donut + Goal Attainment bars */}
      <div className={styles.chartsRow2}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Macro Split (avg/day)</span>
            {state.avgCalIn > 0 && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {fmtInt(state.avgCalIn)} kcal avg
              </span>
            )}
          </div>
          {state.avgCalIn > 0
            ? <MacroDonut p={state.proteinPct} c={state.carbsPct} f={state.fatPct} />
            : !loading && <EmptyChart msg="No nutrition data found. Log meals to see macro breakdown." />}
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Goal Attainment</span>
          </div>
          <div style={{ marginTop: 8 }}>
            <MiniBar label="💧 Water"    actual={state.avgWaterL}      goal={2.5} unit="L"    color="#3b82f6" />
            <MiniBar label="😴 Sleep"    actual={state.avgSleepHr}     goal={8}   unit="hrs"  color="#8b5cf6" />
            <MiniBar label="🔥 Activity" actual={state.totalActiveDays} goal={days} unit="days" color="#10b981" />
            {goalPct !== null && (
              <MiniBar label="🎯 Weight Goal" actual={goalPct} goal={100} unit="%" color="#f59e0b" />
            )}
          </div>
        </div>
      </div>

      {/* AI Summary */}
      <div className={styles.aiReportCard}>
        <div style={{ fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-display)',
          marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
          🧠 AI Health Summary — {label}
        </div>
        {insights.length > 0 ? (
          <div className={styles.aiInsights}>
            {insights.map((ins, i) => (
              <div key={i} className={styles.aiInsight} style={{ borderLeftColor: ins.color }}>
                {ins.text}
              </div>
            ))}
          </div>
        ) : !loading && (
          <div className={styles.emptyRow}>Log data across all categories to unlock AI insights.</div>
        )}
      </div>

    </div>
  );
}
