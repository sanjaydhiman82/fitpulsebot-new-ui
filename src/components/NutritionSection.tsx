import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts';
import { api } from '../api';
import { RangeId, getRangeDates, fmtLabel } from '../utils/dateRange';
import { useCountUp } from '../utils/useCountUp';
import s from './sections.module.css';

interface Props { range: RangeId; }

const MACROS = [
  { key: 'calories', label: 'Calories', color: '#e53e3e', unit: 'kcal', goal: 0   },
  { key: 'protein',  label: 'Protein',  color: '#5bc8e0', unit: 'g',    goal: 80  },
  { key: 'carbs',    label: 'Carbs',    color: '#d97706', unit: 'g',    goal: 260 },
  { key: 'fat',      label: 'Fats',     color: '#9f7aea', unit: 'g',    goal: 70  },
];

function AnimNum({ val, decimals = 0 }: { val: number; decimals?: number }) {
  const n = useCountUp(val);
  return <span className={s.animNum}>{decimals > 0 ? n.toFixed(decimals) : Math.round(n).toLocaleString()}</span>;
}

const CustomTip = ({ active, payload, label }: any) =>
  active && payload?.length ? (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', fontSize:12 }}>
      <p style={{ color:'var(--text-muted)', marginBottom:4 }}>{label}</p>
      {payload.map((p: any) => <p key={p.name} style={{ color:p.color || '#e53e3e', fontWeight:700 }}>{p.name}: {Math.round(p.value)}</p>)}
    </div>
  ) : null;

export default function NutritionSection({ range }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { from, to } = getRangeDates(range);
      setData(await api.dashboard.sectionNutrition(from, to));
    } catch { setData(null); } finally { setLoading(false); }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className={s.loading}><RefreshCw size={16} className={s.spinning} style={{ marginRight:8 }} />Loading nutrition…</div>;
  if (!data)   return <div className={s.empty}>No nutrition data.</div>;

  const { totals, avgPerDay, trend, goals, period } = data;
  const days = period.days;

  const donutData = [
    { name: 'Protein', value: Math.round(totals.protein), color: '#5bc8e0' },
    { name: 'Carbs',   value: Math.round(totals.carbs),   color: '#d97706' },
    { name: 'Fats',    value: Math.round(totals.fat),     color: '#9f7aea' },
    { name: 'Fiber',   value: Math.round(totals.fiber),   color: '#3dbf96' },
  ].filter(d => d.value > 0);

  const chartData = trend.map((t: any) => ({
    day:      fmtLabel(t.date, range),
    Calories: Math.round(t.calories),
    Protein:  Math.round(t.protein),
  }));

  return (
    <div className={s.section} key={range}>

      {/* ── 4 macro stat cards ── */}
      <div className={s.grid4}>
        {MACROS.map(m => {
          const rawVal = totals[m.key] || 0;
          const displayVal = days === 1 ? rawVal : (avgPerDay[m.key] || 0);
          const goalVal = m.key === 'calories' ? goals.calConsumeGoal : m.goal;
          const pct = goalVal > 0 ? Math.min(100, Math.round(displayVal / goalVal * 100)) : 0;
          return (
            <div className={s.statCard} key={m.key}>
              <div className={s.statLabel}>{m.label}</div>
              <div className={s.statValue} style={{ color: m.color }}>
                <AnimNum val={Math.round(displayVal)} /> <span className={s.statUnit}>{m.unit}</span>
              </div>
              <div className={s.statSub}>
                {days > 1
                  ? `avg/day · total ${Math.round(rawVal).toLocaleString()}`
                  : `${pct}% of ${goalVal} ${m.unit}`}
              </div>
              <div className={s.statBar}>
                <div className={s.statBarFill} style={{ width: `${pct}%`, background: m.color }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Macro donut + calorie trend ── */}
      <div className={s.grid2}>
        <div className={s.card}>
          <div className={s.cardHeader}>
            <span className={s.cardTitle}>Macro split</span>
            <span className={s.cardSub}>{days > 1 ? `${days}-day total` : 'Today'}</span>
          </div>
          <div className={s.legendRow}>
            {donutData.map(d => (
              <span key={d.name} className={s.legendItem}>
                <span className={s.legendDot} style={{ background: d.color }} />
                {d.name} {d.value}g
              </span>
            ))}
          </div>
          <div className={s.chartBox} style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%" cy="50%"
                  innerRadius={52} outerRadius={82}
                  paddingAngle={3} dataKey="value"
                  isAnimationActive
                  animationBegin={0}
                  animationDuration={900}
                >
                  {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip
                  formatter={(v: any) => `${v}g`}
                  contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, fontSize:12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Calorie trend (single-day: show today's macro bars; multi-day: show trend chart) */}
        <div className={s.card}>
          {chartData.length > 1 ? (
            <>
              <div className={s.cardHeader}>
                <span className={s.cardTitle}>Calorie trend</span>
                <span className={s.cardSub}>{days} days</span>
              </div>
              <div className={s.chartBox} style={{ height: 190 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={12} barGap={2}>
                    <XAxis dataKey="day" tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} width={38} />
                    <Tooltip content={<CustomTip />} />
                    <Bar dataKey="Calories" radius={[4,4,0,0]} isAnimationActive animationBegin={0} animationDuration={800}>
                      {chartData.map((_: any, i: number) => (
                        <Cell key={i} fill={i === chartData.length - 1 ? '#e53e3e' : '#e53e3e66'} />
                      ))}
                    </Bar>
                    <Bar dataKey="Protein" radius={[4,4,0,0]} fill="#5bc8e066" isAnimationActive animationBegin={80} animationDuration={800} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <>
              <div className={s.cardHeader}><span className={s.cardTitle}>Macros vs goal</span></div>
              {MACROS.map((m, i) => {
                const val = Math.round(totals[m.key] || 0);
                const goalVal = m.key === 'calories' ? goals.calConsumeGoal : m.goal;
                const pct = goalVal > 0 ? Math.min(100, Math.round(val / goalVal * 100)) : 0;
                return (
                  <div className={s.barRow} key={m.key} style={{ animationDelay: `${i * 60}ms` }}>
                    <div className={s.barRowHead}>
                      <span className={s.barRowLabel} style={{ color: m.color }}>{m.label}</span>
                      <span className={s.barRowVal}>{val} / {goalVal} {m.unit}</span>
                    </div>
                    <div className={s.barTrack}>
                      <div className={s.barFill} style={{ width:`${pct}%`, background: m.color }} />
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

    </div>
  );
}
