import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Droplets } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, PieChart, Pie } from 'recharts';
import { api } from '../api';
import { RangeId, getRangeDates, fmtLabel } from '../utils/dateRange';
import s from './sections.module.css';
interface Props { range: RangeId; }

const CustomTip = ({ active, payload, label }: any) =>
  active && payload?.length ? <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', fontSize:12 }}><p style={{ color:'var(--text-muted)', marginBottom:4 }}>{label}</p>{payload.map((p: any) => <p key={p.name} style={{ color:'var(--accent)', fontWeight:700 }}>{Math.round(p.value)} ml</p>)}</div> : null;

export default function HydrationSection({ range }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try { const { from, to } = getRangeDates(range); setData(await api.dashboard.sectionHydration(from, to)); }
    catch { setData(null); } finally { setLoading(false); }
  }, [range]);
  useEffect(() => { load(); }, [load]);
  if (loading) return <div className={s.loading}><RefreshCw size={16} className={s.spinning} style={{ marginRight:8 }} />Loading hydration…</div>;
  if (!data) return <div className={s.empty}>No hydration data.</div>;

  const { totalMl, avgMl, goalMl, pct, trend, byType, period } = data;
  const chartData = trend.map((t: any) => ({ day: fmtLabel(t.date, range), ml: t.ml }));
  const donutData = Object.entries(byType || {}).map(([k, v]) => ({ name: k, value: v as number }));
  const DCOLORS = ['#2d6fd6','#3dbf96','#d97706','#e53e3e','#9f7aea','#5bc8e0'];

  return (
    <div className={s.section}>
      <div className={s.grid3}>
        <div className={s.statCard}>
          <div className={s.statLabel}>{period.days === 1 ? 'Today' : 'Total'}</div>
          <div className={s.statValue} style={{ color:'#2d6fd6' }}>{(totalMl/1000).toFixed(1)} <span className={s.statUnit}>L</span></div>
          <div className={s.statBar}><div className={s.statBarFill} style={{ width:`${pct}%`, background:'#2d6fd6' }} /></div>
          <div className={s.statSub}>{pct}% of goal</div>
        </div>
        <div className={s.statCard}>
          <div className={s.statLabel}>{period.days === 1 ? 'Goal' : 'Daily avg'}</div>
          <div className={s.statValue} style={{ color: pct >= 80 ? 'var(--accent)' : 'var(--warning)' }}>
            {period.days === 1 ? (goalMl/1000).toFixed(1) : (avgMl/1000).toFixed(1)} <span className={s.statUnit}>L</span>
          </div>
          <div className={s.statSub}>{period.days === 1 ? 'daily target' : `goal ${(goalMl/1000).toFixed(1)}L`}</div>
        </div>
        <div className={s.statCard}>
          <div className={s.statLabel}>Status</div>
          <div className={s.statValue} style={{ fontSize:18, color: pct >= 80 ? 'var(--accent)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
            {pct >= 80 ? '✓ Goal met' : pct >= 50 ? 'On track' : 'Behind'}
          </div>
          <div className={s.statSub}>{totalMl} ml of {goalMl} ml</div>
        </div>
      </div>

      <div className={s.grid2}>
        {chartData.length > 1 && (
          <div className={s.card}>
            <div className={s.cardHeader}><span className={s.cardTitle}>Daily intake</span><span className={s.cardSub}>{period.days} days</span></div>
            <div className={s.chartBox} style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={14}>
                  <XAxis dataKey="day" tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} width={40} tickFormatter={v => `${(v/1000).toFixed(1)}L`} />
                  <ReferenceLine y={goalMl} stroke="var(--accent)" strokeDasharray="4 3" strokeWidth={1.5} />
                  <Tooltip content={<CustomTip />} />
                  <Bar dataKey="ml" radius={[4,4,0,0]}>
                    {chartData.map((_: any, i: number) => <Cell key={i} fill={i === chartData.length-1 ? '#2d6fd6' : '#2d6fd666'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {donutData.length > 0 && (
          <div className={s.card}>
            <div className={s.cardHeader}><span className={s.cardTitle}>By drink type</span></div>
            <div className={s.legendRow}>{donutData.map((d, i) => <span key={d.name} className={s.legendItem}><span className={s.legendDot} style={{ background:DCOLORS[i%DCOLORS.length] }} />{d.name} {(d.value/1000).toFixed(1)}L</span>)}</div>
            <div className={s.chartBox} style={{ height:160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={donutData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">{donutData.map((_,i)=><Cell key={i} fill={DCOLORS[i%DCOLORS.length]} />)}</Pie><Tooltip formatter={(v: any) => `${(v/1000).toFixed(2)}L`} contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, fontSize:12 }} /></PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
