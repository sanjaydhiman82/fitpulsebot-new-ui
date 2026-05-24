import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { api } from '../api';
import { RangeId, getRangeDates, fmtLabel } from '../utils/dateRange';
import s from './sections.module.css';
interface Props { range: RangeId; }

const CustomTip = ({ active, payload, label }: any) =>
  active && payload?.length ? <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', fontSize:12 }}><p style={{ color:'var(--text-muted)', marginBottom:4 }}>{label}</p>{payload.map((p: any) => <p key={p.name} style={{ color:p.color, fontWeight:700 }}>{p.name}: {p.value}h</p>)}</div> : null;

export default function SleepSection({ range }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try { const { from, to } = getRangeDates(range); setData(await api.dashboard.sectionSleep(from, to)); }
    catch { setData(null); } finally { setLoading(false); }
  }, [range]);
  useEffect(() => { load(); }, [load]);
  if (loading) return <div className={s.loading}><RefreshCw size={16} className={s.spinning} style={{ marginRight:8 }} />Loading sleep…</div>;
  if (!data) return <div className={s.empty}>No sleep data logged.</div>;

  const { totalHrs, avgHrs, lastNight, entries, goalHrs, pct, trend, period } = data;
  const chartData = trend.map((t: any) => ({ day: fmtLabel(t.date, range), Sleep: parseFloat(t.hours.toFixed(1)) }));
  const r = 38; const circ = 2*Math.PI*r;
  const offset = circ - (Math.min(pct,100)/100)*circ;

  return (
    <div className={s.section}>
      <div className={s.grid2}>
        <div className={s.card}>
          <div className={s.cardHeader}><span className={s.cardTitle}>Sleep overview</span></div>
          <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:14 }}>
            <div style={{ position:'relative', flexShrink:0 }}>
              <svg width="90" height="90" viewBox="0 0 90 90">
                <circle cx="45" cy="45" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
                <circle cx="45" cy="45" r={r} fill="none" stroke="#7f77dd" strokeWidth="8"
                  strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                  transform="rotate(-90 45 45)" style={{ transition:'stroke-dashoffset 700ms ease' }} />
              </svg>
              <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center' }}>
                <span style={{ fontSize:15, fontWeight:800, color:'var(--text-primary)', display:'block', lineHeight:1 }}>{pct}%</span>
                <span style={{ fontSize:9, color:'var(--text-muted)' }}>goal</span>
              </div>
            </div>
            <div style={{ flex:1 }}>
              <div className={s.grid2}>
                <div><div className={s.statLabel}>Last night</div><div className={s.statValue} style={{ color:'#7f77dd', fontSize:22 }}>{lastNight} <span className={s.statUnit}>h</span></div></div>
                <div><div className={s.statLabel}>{period.days===1 ? 'Goal' : 'Avg/night'}</div><div className={s.statValue} style={{ fontSize:22 }}>{period.days===1 ? goalHrs : avgHrs} <span className={s.statUnit}>h</span></div></div>
              </div>
              <div style={{ marginTop:10 }}>
                <div className={s.statLabel}>Status</div>
                <span className={`${s.badge} ${pct>=90 ? s.badgeGreen : pct>=65 ? s.badgeAmber : s.badgeDanger}`}>
                  {pct>=90 ? '✓ Well rested' : pct>=65 ? 'Slightly low' : '⚠ Sleep deficit'}
                </span>
              </div>
            </div>
          </div>
          <div className={s.grid3}>
            <div className={s.statCard} style={{ textAlign:'center' }}>
              <div className={s.statLabel}>Total</div>
              <div className={s.statValue} style={{ fontSize:18 }}>{totalHrs.toFixed(1)} <span className={s.statUnit}>h</span></div>
            </div>
            <div className={s.statCard} style={{ textAlign:'center' }}>
              <div className={s.statLabel}>Goal</div>
              <div className={s.statValue} style={{ fontSize:18 }}>{goalHrs} <span className={s.statUnit}>h</span></div>
            </div>
            <div className={s.statCard} style={{ textAlign:'center' }}>
              <div className={s.statLabel}>Entries</div>
              <div className={s.statValue} style={{ fontSize:18 }}>{entries}</div>
            </div>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className={s.card}>
            <div className={s.cardHeader}><span className={s.cardTitle}>Sleep trend</span><span className={s.cardSub}>{period.days} nights</span></div>
            <div className={s.chartBox} style={{ height:220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={18}>
                  <XAxis dataKey="day" tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, Math.max(goalHrs+1, 10)]} tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} width={28} tickFormatter={v => `${v}h`} />
                  <ReferenceLine y={goalHrs} stroke="#7f77dd" strokeDasharray="4 3" strokeWidth={1.5} />
                  <Tooltip content={<CustomTip />} />
                  <Bar dataKey="Sleep" radius={[4,4,0,0]}>
                    {chartData.map((d: any, i: number) => <Cell key={i} fill={d.Sleep >= goalHrs ? '#7f77dd' : d.Sleep >= goalHrs*0.75 ? '#9f7aea99' : '#7f77dd44'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className={s.card}><div className={s.empty}>No trend data for this range</div></div>
        )}
      </div>
    </div>
  );
}
