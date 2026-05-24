import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Activity, Route } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, PieChart, Pie } from 'recharts';
import { api } from '../api';
import { RangeId, getRangeDates, fmtLabel } from '../utils/dateRange';
import { useCountUp } from '../utils/useCountUp';
import s from './sections.module.css';
interface Props { range: RangeId; }

const CustomTip = ({ active, payload, label }: any) =>
  active && payload?.length ? <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', fontSize:12 }}><p style={{ color:'var(--text-muted)', marginBottom:4 }}>{label}</p>{payload.map((p: any) => <p key={p.name} style={{ color:p.color, fontWeight:700 }}>{p.name}: {p.value}</p>)}</div> : null;

const ACTIVITY_ICONS: Record<string, string> = { running:'🏃', walking:'🚶', cycling:'🚴', gym:'💪', yoga:'🧘', swimming:'🏊', default:'⚡' };
const ACT_COLORS = ['#e53e3e','#3dbf96','#2d6fd6','#d97706','#9f7aea','#5bc8e0'];

function AnimNum({ val, dec = 0 }: { val: number; dec?: number }) {
  const n = useCountUp(val);
  return <span className={s.animNum}>{dec > 0 ? n.toFixed(dec) : Math.round(n)}</span>;
}

export default function ActivitySection({ range }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try { const { from, to } = getRangeDates(range); setData(await api.dashboard.sectionActivity(from, to)); }
    catch { setData(null); } finally { setLoading(false); }
  }, [range]);
  useEffect(() => { load(); }, [load]);
  if (loading) return <div className={s.loading}><RefreshCw size={16} className={s.spinning} style={{ marginRight:8 }} />Loading activity…</div>;
  if (!data) return <div className={s.empty}>No activity data.</div>;

  const { totals, avgPerDay, trend, workouts, byType, goals, pct, period } = data;
  const chartData = trend.map((t: any) => ({ day: fmtLabel(t.date, range), 'Cal Burned': t.calBurn, 'Active Min': t.activeMin }));
  const donutData = Object.entries(byType || {}).map(([k, v]) => ({ name: k, value: v as number })).filter(d => d.value > 0);

  return (
    <div className={s.section} key={range}>
      <div className={s.grid4}>
        {[
          { label: 'Cal Burned', val: period.days===1 ? totals.calBurn : avgPerDay.calBurn, unit:'kcal', color:'#e53e3e', total: totals.calBurn, goal: goals.calBurnGoal },
          { label: 'Active Min', val: period.days===1 ? totals.activeMin : avgPerDay.activeMin, unit:'min', color:'var(--accent)', total: totals.activeMin, goal: 60 },
          { label: 'Distance', val: period.days===1 ? totals.distanceKm : avgPerDay.distanceKm, unit:'km', color:'#2d6fd6', total: totals.distanceKm, goal: 10 },
          { label: period.days===1 ? 'Workouts' : 'Total Sessions', val: workouts?.length || 0, unit:'', color:'#9f7aea', total: workouts?.length || 0, goal: period.days },
        ].map(({ label, val, unit, color, total, goal }) => {
          const p = Math.min(100, Math.round((Number(val)||0) / goal * 100));
          return (
            <div className={s.statCard} key={label}>
              <div className={s.statLabel}>{label}</div>
              <div className={s.statValue} style={{ color }}>
                <AnimNum val={Number(period.days > 1 && label !== 'Total Sessions' ? val : total)} dec={unit === 'km' ? 1 : 0} />
                {' '}<span className={s.statUnit}>{unit}</span>
              </div>
              {period.days > 1 && label !== 'Total Sessions' && <div className={s.statSub}>avg/day · total {total}</div>}
              <div className={s.statBar}><div className={s.statBarFill} style={{ width:`${p}%`, background: color }} /></div>
            </div>
          );
        })}
      </div>

      {chartData.length > 0 && (
        <div className={s.grid2}>
          <div className={s.card}>
            <div className={s.cardHeader}><span className={s.cardTitle}>Calories burned</span><span className={s.cardSub}>{period.days} days</span></div>
            <div className={s.chartBox} style={{ height:170 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={14}>
                  <XAxis dataKey="day" tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} width={36} />
                  <Tooltip content={<CustomTip />} />
                  <Bar dataKey="Cal Burned" radius={[4,4,0,0]} isAnimationActive animationBegin={0} animationDuration={800}>
                    {chartData.map((_: any, i: number) => <Cell key={i} fill={i===chartData.length-1 ? '#e53e3e' : '#e53e3e66'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {donutData.length > 0 ? (
            <div className={s.card}>
              <div className={s.cardHeader}><span className={s.cardTitle}>By activity type</span></div>
              <div className={s.legendRow}>{donutData.map((d,i) => <span key={d.name} className={s.legendItem}><span className={s.legendDot} style={{ background:ACT_COLORS[i%ACT_COLORS.length] }} />{d.name} {d.value} kcal</span>)}</div>
              <div className={s.chartBox} style={{ height:150 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={donutData} cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={3} dataKey="value" isAnimationActive animationBegin={0} animationDuration={900}>{donutData.map((_,i)=><Cell key={i} fill={ACT_COLORS[i%ACT_COLORS.length]} />)}</Pie><Tooltip formatter={(v: any) => `${v} kcal`} contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, fontSize:12 }} /></PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className={s.card}>
              <div className={s.cardHeader}><span className={s.cardTitle}>Active minutes</span></div>
              <div className={s.chartBox} style={{ height:170 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs><linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/><stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/></linearGradient></defs>
                    <XAxis dataKey="day" tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip content={<CustomTip />} />
                    <Area type="monotone" dataKey="Active Min" stroke="var(--accent)" strokeWidth={2} fill="url(#actGrad)" dot={false} isAnimationActive animationBegin={0} animationDuration={900} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {workouts && workouts.length > 0 && (
        <div className={s.card}>
          <div className={s.cardHeader}><span className={s.cardTitle}>Recent workouts</span><span className={s.cardSub}>{workouts.length} sessions</span></div>
          {workouts.slice(0,5).map((w: any, i: number) => (
            <div className={s.listItem} key={i}>
              <div className={s.listLeft}>
                <div className={s.listIcon} style={{ background:'var(--metric-bg)', fontSize:16 }}>{ACTIVITY_ICONS[w.type?.toLowerCase()] || ACTIVITY_ICONS.default}</div>
                <div><div className={s.listTitle} style={{ textTransform:'capitalize' }}>{w.type}</div><div className={s.listSub}>{w.durationMin} min · {w.distanceKm > 0 ? `${w.distanceKm} km` : 'indoor'}</div></div>
              </div>
              <div className={s.listRight}>
                <div className={s.listVal} style={{ color:'#e53e3e' }}>{w.calBurn} kcal</div>
                <div className={s.listMeta}>{new Date(w.datetime).toLocaleDateString('en', { month:'short', day:'numeric' })}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
