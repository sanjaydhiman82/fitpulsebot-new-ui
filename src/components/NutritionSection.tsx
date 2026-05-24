import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { api } from '../api';
import { RangeId, getRangeDates, fmtLabel } from '../utils/dateRange';
import s from './sections.module.css';

interface Props { range: RangeId; }

const MACROS = [
  { key: 'calories', label: 'Calories', color: '#e53e3e', unit: 'kcal' },
  { key: 'protein',  label: 'Protein',  color: '#5bc8e0', unit: 'g'    },
  { key: 'carbs',    label: 'Carbs',    color: '#d97706', unit: 'g'    },
  { key: 'fat',      label: 'Fats',     color: '#9f7aea', unit: 'g'    },
];

const CustomTip = ({ active, payload, label }: any) =>
  active && payload?.length ? (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', fontSize:12 }}>
      <p style={{ color:'var(--text-muted)', marginBottom:4 }}>{label}</p>
      {payload.map((p: any) => <p key={p.name} style={{ color: p.color, fontWeight:700 }}>{p.name}: {Math.round(p.value)}</p>)}
    </div>
  ) : null;

export default function NutritionSection({ range }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'calories'|'macros'>('calories');

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
    { name: 'Protein',  value: Math.round(totals.protein), color: '#5bc8e0' },
    { name: 'Carbs',    value: Math.round(totals.carbs),   color: '#d97706' },
    { name: 'Fats',     value: Math.round(totals.fat),     color: '#9f7aea' },
    { name: 'Fiber',    value: Math.round(totals.fiber),   color: '#3dbf96' },
  ].filter(d => d.value > 0);

  const chartData = trend.map((t: any) => ({
    day: fmtLabel(t.date, range),
    Calories: Math.round(t.calories),
    Protein: Math.round(t.protein),
    Carbs: Math.round(t.carbs),
    Fat: Math.round(t.fat),
  }));

  return (
    <div className={s.section}>
      <div className={s.grid4}>
        {MACROS.map(m => {
          const total = Math.round(totals[m.key === 'calories' ? 'calories' : m.key === 'fat' ? 'fat' : m.key] || 0);
          const avg = Math.round(avgPerDay[m.key === 'calories' ? 'calories' : m.key === 'fat' ? 'fat' : m.key] || 0);
          const goal = m.key === 'calories' ? goals.calConsumeGoal : m.key === 'protein' ? 80 : m.key === 'carbs' ? 260 : 70;
          const pct = days === 1 ? Math.min(100, Math.round(total/goal*100)) : Math.min(100, Math.round(avg/goal*100));
          return (
            <div className={s.statCard} key={m.key}>
              <div className={s.statLabel}>{m.label}</div>
              <div className={s.statValue} style={{ color: m.color }}>{days === 1 ? total : avg} <span className={s.statUnit}>{m.unit}</span></div>
              <div className={s.statSub}>{days > 1 ? `avg/day · total ${total.toLocaleString()}` : `of ${goal} ${m.unit}`}</div>
              <div className={s.statBar}><div className={s.statBarFill} style={{ width:`${pct}%`, background: m.color }} /></div>
            </div>
          );
        })}
      </div>

      <div className={s.grid2}>
        <div className={s.card}>
          <div className={s.cardHeader}>
            <span className={s.cardTitle}>Macro split</span>
            <span className={s.cardSub}>{period.days > 1 ? `${period.days} days` : 'Today'}</span>
          </div>
          <div className={s.legendRow}>
            {donutData.map(d => <span key={d.name} className={s.legendItem}><span className={s.legendDot} style={{ background: d.color }} />{d.name} {d.value}g</span>)}
          </div>
          <div className={s.chartBox} style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={(v: any) => `${v}g`} contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, fontSize:12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={s.card}>
          <div className={s.cardHeader}>
            <span className={s.cardTitle}>{range === 'today' ? 'Today vs goal' : 'Daily avg vs goal'}</span>
          </div>
          {['Calories','Protein','Carbs','Fat'].map((label, i) => {
            const keys = ['calories','protein','carbs','fat'];
            const colors = ['#e53e3e','#5bc8e0','#d97706','#9f7aea'];
            const goals2 = [goals.calConsumeGoal, 80, 260, 70];
            const units = ['kcal','g','g','g'];
            const val = Math.round(days === 1 ? (totals[keys[i]] || 0) : (avgPerDay[keys[i]] || 0));
            const pct = Math.min(100, Math.round(val/goals2[i]*100));
            return (
              <div className={s.barRow} key={label}>
                <div className={s.barRowHead}>
                  <span className={s.barRowLabel} style={{ color: colors[i] }}>{label}</span>
                  <span className={s.barRowVal}>{val} / {goals2[i]} {units[i]}</span>
                </div>
                <div className={s.barTrack}><div className={s.barFill} style={{ width:`${pct}%`, background: colors[i] }} /></div>
              </div>
            );
          })}
        </div>
      </div>

      {chartData.length > 1 && (
        <div className={s.card}>
          <div className={s.cardHeader}><span className={s.cardTitle}>Calorie trend</span><span className={s.cardSub}>{period.days} days</span></div>
          <div className={s.chartBox} style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={14}>
                <XAxis dataKey="day" tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} width={38} />
                <Tooltip content={<CustomTip />} />
                <Bar dataKey="Calories" radius={[4,4,0,0]}>
                  {chartData.map((_: any, i: number) => <Cell key={i} fill={i === chartData.length - 1 ? '#e53e3e' : '#e53e3e66'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
