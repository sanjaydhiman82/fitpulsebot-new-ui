import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Activity, Droplets, Flame, Scale, Brain, ChevronRight, Zap, RefreshCw, UtensilsCrossed, Route, Trophy } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { DashTab } from '../pages/Dashboard';
import { api } from '../api';
import { useApp } from '../App';
import styles from './DashboardHome.module.css';
import dropdowns from '../config/dropdowns.json';

const TIME_RANGES = dropdowns.dashboard.timeRanges as Array<{
  id: 'day' | 'week' | 'month' | '3month' | 'year';
  label: string;
  days: number;
  aliases: string[];
}>;
type TimeRange = typeof TIME_RANGES[number]['id'];

const RANGE_BY_ID = TIME_RANGES.reduce((acc, range) => ({ ...acc, [range.id]: range }), {} as Record<TimeRange, typeof TIME_RANGES[number]>);

function getRangeValue(values: any, range: TimeRange) {
  if (!values || typeof values !== 'object') return undefined;
  const config = RANGE_BY_ID[range];
  for (const key of config.aliases) {
    if (values[key] !== undefined) return values[key];
  }
  return undefined;
}

function formatDate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getRangeDates(range: TimeRange) {
  const days = RANGE_BY_ID[range].days;
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return formatDate(d);
  });
}

function counterValue(item: any, range: TimeRange) {
  const rangeValue = getRangeValue(item.values, range);
  const fallbackDay = getRangeValue(item.values, 'day');
  const raw = rangeValue ?? item.value ?? item.total ?? item.count ?? fallbackDay ?? 0;
  if (raw && typeof raw === 'object') {
    return raw.value ?? raw.amountMl ?? raw.waterIntake?.value ?? 0;
  }
  return raw;
}

function counterMeta(title: string) {
  const key = title.toLowerCase();
  if (key.includes('protein')) return { icon: UtensilsCrossed, color: '#5bc8e0', tab: 'nutrition' as DashTab };
  if (key.includes('water')) return { icon: Droplets, color: '#2d6fd6', tab: 'hydration' as DashTab };
  if (key.includes('burned') || key.includes('active')) return { icon: Activity, color: '#e53e3e', tab: 'activity' as DashTab };
  if (key.includes('distance')) return { icon: Route, color: '#ed8936', tab: 'activity' as DashTab };
  if (key.includes('weight')) return { icon: Scale, color: '#9f7aea', tab: 'weight' as DashTab };
  if (key.includes('goal')) return { icon: Trophy, color: '#f59e0b', tab: 'reports' as DashTab };
  return { icon: Flame, color: '#3dbf96', tab: 'nutrition' as DashTab };
}

function formatCounterValue(value: any) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value ?? '—';
  if (Number.isInteger(n)) return n.toLocaleString();
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

const GOAL_ITEMS = [
  { key: 'waterStatus', label: 'Water', icon: Droplets, color: '#2d6fd6', tab: 'hydration' as DashTab },
  { key: 'calBurnStatus', label: 'Calories Burned', icon: Activity, color: '#e53e3e', tab: 'activity' as DashTab },
  { key: 'mealsStatus', label: 'Meals', icon: UtensilsCrossed, color: '#3dbf96', tab: 'nutrition' as DashTab },
  { key: 'sleepStatus', label: 'Sleep', icon: Trophy, color: '#9f7aea', tab: 'sleep' as DashTab },
  { key: 'calConsumeStatus', label: 'Calories Consumed', icon: Flame, color: '#f59e0b', tab: 'nutrition' as DashTab },
];

function isComplete(status: any) {
  return String(status || '').toLowerCase() === 'completed';
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
      {payload.map((p: any) => <p key={p.name} style={{ color: p.color || 'var(--accent)', fontWeight: 600 }}>{p.name}: {p.value}</p>)}
    </div>
  );
  return null;
};

export default function DashboardHome({ setTab }: { setTab: (t: DashTab) => void }) {
  const { user } = useApp();
  const loadIdRef = useRef(0);
  const [range, setRange] = useState<TimeRange>('week');
  const [counters, setCounters] = useState<any>(null);
  const [counterItems, setCounterItems] = useState<any[]>([]);
  const [goalItems, setGoalItems] = useState<any[]>([]);
  const [activityChart, setActivityChart] = useState<any[]>([]);
  const [weightChart, setWeightChart] = useState<any[]>([]);
  const [weightSummary, setWeightSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const load = useCallback(async (r: TimeRange) => {
    const loadId = ++loadIdRef.current;
    setLoading(true);
    setActivityChart([]);
    setWeightChart([]);
    setWeightSummary(null);
    const rangeConfig = RANGE_BY_ID[r];
    try {
      const goalDates = getRangeDates(r);
      const [c, ac, wc, goalsData] = await Promise.all([
        api.dashboard.counters().catch(() => null),
        api.dashboard.activityChart(rangeConfig.days).catch(() => null),
        api.dashboard.weightChart(rangeConfig.days).catch(() => null),
        api.dashboard.goalsRange(goalDates[0], goalDates[goalDates.length - 1]).catch(() => null),
      ]);
      if (loadId !== loadIdRef.current) return;
      
      // Handle goals data - it should be an array of goal objects for the date range
      const goalsArray = Array.isArray(goalsData) ? goalsData : [];
      setGoalItems(GOAL_ITEMS.map(goal => {
        const completed = goalsArray.filter((result: any) => isComplete(result?.[goal.key])).length;
        return { ...goal, completed, total: goalsArray.length || goalDates.length };
      }));
      if (loadId !== loadIdRef.current) return;
      // Parse counters: API returns { counters: [...] }
      if (c?.counters) {
        setCounterItems(c.counters);
        setCounters({ streak: c.streak, insight: c.insight });
      } else {
        setCounterItems([]);
        setCounters(c);
      }
      if (Array.isArray(ac?.data)) {
        setActivityChart(ac.data.map((item: any) => ({
          day: new Date(item.date).toLocaleDateString('en', rangeConfig.days > 31 ? { month: 'short', day: 'numeric' } : { weekday: 'short' }),
          caloriesBurned: item.caloriesBurned || 0,
          activeMinutes: item.activeMinutes || 0,
        })));
      } else if (ac?.labels) {
        const cals = ac.series?.find((s: any) => s.name?.toLowerCase().includes('calori'))?.data || [];
        const mins = ac.series?.find((s: any) => s.name?.toLowerCase().includes('minute') || s.name?.toLowerCase().includes('active'))?.data || [];
        setActivityChart(ac.labels.map((d: string, i: number) => ({
          day: new Date(d).toLocaleDateString('en', { weekday: 'short' }),
          caloriesBurned: cals[i] || 0,
          activeMinutes: mins[i] || 0,
        })));
      } else {
        setActivityChart([]);
      }
      if (Array.isArray(wc?.data)) {
        setWeightChart(wc.data.map((item: any) => ({
          day: new Date(item.date).toLocaleDateString('en', rangeConfig.days > 31 ? { month: 'short', day: 'numeric' } : { weekday: 'short' }),
          weight: item.weight,
          movingAvg: item.movingAvg,
        })));
        setWeightSummary({
          ...wc.summary,
          targetWeight: wc.goal?.targetWeight,
          goalEnabled: wc.goal?.enabled,
        });
      } else if (wc?.labels) {
        const weights = wc.series?.find((s: any) => s.name?.toLowerCase().includes('weight'))?.data || [];
        setWeightChart(wc.labels.map((d: string, i: number) => ({
          day: new Date(d).toLocaleDateString('en', rangeConfig.days > 31 ? { month: 'short', day: 'numeric' } : { weekday: 'short' }),
          weight: weights[i] || null,
        })).filter((d: any) => d.weight));
        setWeightSummary(null);
      } else {
        setWeightChart([]);
        setWeightSummary(null);
      }
    } catch {
      if (loadId === loadIdRef.current) {
        setActivityChart([]);
        setWeightChart([]);
        setWeightSummary(null);
      }
    } finally {
      if (loadId === loadIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => { load(range); }, [range, load]);

  const c = counters || {};

  return (
    <div className={styles.page}>
      {/* Header row */}
      <div className={styles.greeting}>
        <div>
          <h2 className={styles.greetTitle}>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.firstName || user?.userName?.split('@')[0] || 'there'}! 👋</h2>
          <p className={styles.greetDate}>{today}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {c.streak > 0 && <div className={styles.streakBadge}><Zap size={13} /> {c.streak}-day streak</div>}
          <button onClick={() => load(range)} style={{ color: 'var(--text-muted)', padding: 6, borderRadius: 8, border: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}><RefreshCw size={14} className={loading ? styles.spinning : ''} /></button>
        </div>
      </div>

      {/* Time range selector */}
      <div className={styles.rangeRow}>
        {TIME_RANGES.map(r => (
          <button key={r.id} type="button" className={`${styles.rangeBtn} ${range === r.id ? styles.rangeBtnActive : ''}`} onClick={() => setRange(r.id)}>
            {r.label}
          </button>
        ))}
      </div>

      {/* AI insight */}
      {c.insight && (
        <div className={styles.aiBanner}>
          <div className={styles.aiBannerIcon}><Brain size={18} color="var(--accent)" /></div>
          <div className={styles.aiBannerContent}>
            <div className={styles.aiBannerTitle}>AI Insight</div>
            <div className={styles.aiBannerText}>{c.insight}</div>
          </div>
        </div>
      )}

      {/* Metric cards */}
      <div className={styles.metricsGrid}>
        {counterItems.map(item => {
          const meta = counterMeta(item.title || '');
          const value = counterValue(item, range);
          return (
            <MetricCard
              key={item.id || item.title}
              icon={meta.icon}
              label={item.title}
              value={formatCounterValue(value)}
              unit={item.unit || ''}
              pct={100}
              color={meta.color}
              onClick={() => setTab(meta.tab)}
            />
          );
        })}
      </div>

      {goalItems.length > 0 && (
        <div className={styles.chartCard} key={`activity-${range}`}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Goal Completion ({RANGE_BY_ID[range].label})</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{RANGE_BY_ID[range].days} day window</span>
          </div>
          <div className={styles.metricsGrid}>
            {goalItems.map(goal => {
              const pct = goal.total ? Math.round((goal.completed / goal.total) * 100) : 0;
              return (
                <MetricCard
                  key={goal.key}
                  icon={goal.icon}
                  label={goal.label}
                  value={`${goal.completed}/${goal.total}`}
                  unit="days completed"
                  pct={pct}
                  color={goal.color}
                  onClick={() => setTab(goal.tab)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className={styles.chartsRow}>
        <div className={styles.chartCard} key={`weight-${range}`}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Activity Calories Burned ({RANGE_BY_ID[range].label})</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{RANGE_BY_ID[range].days} day window</span>
          </div>
          {activityChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={activityChart} barSize={18}>
                <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="caloriesBurned" name="Calories Burned" radius={[5, 5, 0, 0]}>
                  {activityChart.map((_, i) => <Cell key={i} fill={i === activityChart.length - 1 ? '#e53e3e' : '#e53e3e66'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className={styles.emptyChart}>No activity calorie data for this range.</div>
          )}
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Weight Trend ({RANGE_BY_ID[range].label})</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {weightSummary?.latestWeight != null ? `Latest ${weightSummary.latestWeight} kg` : `${RANGE_BY_ID[range].days} day window`}
              {weightSummary?.changeKg != null ? ` · ${weightSummary.changeKg > 0 ? '+' : ''}${Number(weightSummary.changeKg).toFixed(2)} kg` : ''}
            </span>
          </div>
          {weightChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={weightChart}>
                <defs>
                  <linearGradient id="weightGradDash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9f7aea" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#9f7aea" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={40} domain={['dataMin - 1', 'dataMax + 1']} />
                {weightSummary?.goalEnabled && weightSummary?.targetWeight != null && (
                  <ReferenceLine y={weightSummary.targetWeight} stroke="#5bc8e0" strokeDasharray="4 4" strokeWidth={1.5} />
                )}
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="weight" name="Weight" stroke="#9f7aea" strokeWidth={2.5} fill="url(#weightGradDash)" dot={{ fill: '#9f7aea', r: 3 }} />
                <Area type="monotone" dataKey="movingAvg" name="Moving Avg" stroke="#3dbf96" strokeWidth={2} fill="transparent" dot={false} connectNulls />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className={styles.emptyChart}>No weight entries for this range.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, unit, pct, color, onClick }: any) {
  return (
    <div className={styles.metricCard} onClick={onClick} style={{ '--card-accent': color } as any}>
      <div className={styles.metricTop}>
        <div className={styles.metricIcon} style={{ background: color + '18', border: `1px solid ${color}30` }}><Icon size={18} color={color} /></div>
        <span className={styles.metricLabel}>{label}</span>
        <ChevronRight size={14} className={styles.metricArrow} />
      </div>
      <div className={styles.metricValue}>{value}</div>
      <div className={styles.metricUnit}>{unit}</div>
      <div className={styles.metricTrack}><div className={styles.metricFill} style={{ width: `${Math.min(pct, 100)}%`, background: color }} /></div>
      <span className={styles.metricPct} style={{ color }}>{pct}%</span>
    </div>
  );
}
