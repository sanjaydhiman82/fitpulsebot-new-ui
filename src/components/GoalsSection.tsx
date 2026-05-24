import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Droplets, Activity, UtensilsCrossed, Moon, Flame, Trophy } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { api } from '../api';
import { RangeId, getRangeDates, pctColor } from '../utils/dateRange';
import s from './sections.module.css';
interface Props { range: RangeId; }

const GOAL_META = [
  { key:'water',      label:'Water',        Icon: Droplets,        color:'#2d6fd6' },
  { key:'calBurn',    label:'Cal Burned',   Icon: Activity,        color:'#e53e3e' },
  { key:'meals',      label:'Meals',        Icon: UtensilsCrossed, color:'var(--accent)' },
  { key:'sleep',      label:'Sleep',        Icon: Moon,            color:'#7f77dd' },
  { key:'calConsume', label:'Nutrition',    Icon: Flame,           color:'#d97706' },
  { key:'allGoals',   label:'All Goals',    Icon: Trophy,          color:'#f59e0b' },
];

export default function GoalsSection({ range }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try { const { from, to } = getRangeDates(range); setData(await api.dashboard.sectionGoals(from, to)); }
    catch { setData(null); } finally { setLoading(false); }
  }, [range]);
  useEffect(() => { load(); }, [load]);
  if (loading) return <div className={s.loading}><RefreshCw size={16} className={s.spinning} style={{ marginRight:8 }} />Computing goals…</div>;
  if (!data) return <div className={s.empty}>No goals data.</div>;

  const { completion, period } = data;
  const radarData = GOAL_META.filter(m => m.key !== 'allGoals').map(m => ({
    subject: m.label,
    A: completion[m.key]?.pct || 0,
    fullMark: 100,
  }));

  return (
    <div className={s.section}>
      <div className={s.grid2}>
        <div className={s.card}>
          <div className={s.cardHeader}><span className={s.cardTitle}>Goal completion</span><span className={s.cardSub}>{period.days} day{period.days>1?'s':''}</span></div>
          <div className={s.goalGrid}>
            {GOAL_META.map(({ key, label, Icon, color }) => {
              const c = completion[key] || { met:0, total: period.days, pct:0 };
              return (
                <div className={s.goalCell} key={key}>
                  <div className={s.goalCellLabel}><Icon size={11} style={{ marginRight:3, verticalAlign:'middle' }} />{label}</div>
                  <div className={s.goalCellVal} style={{ color: pctColor(c.pct) }}>{c.met}/{c.total}</div>
                  <div className={s.statBar}><div className={s.statBarFill} style={{ width:`${c.pct}%`, background: color }} /></div>
                  <div className={s.goalCellSub}>{c.pct}%</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={s.card}>
          <div className={s.cardHeader}><span className={s.cardTitle}>Goal radar</span></div>
          <div className={s.chartBox} style={{ height:240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius={90} data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill:'var(--text-secondary)', fontSize:11 }} />
                <Radar name="Completion %" dataKey="A" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.2} strokeWidth={2} />
                <Tooltip formatter={(v: any) => `${v}%`} contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, fontSize:12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className={s.card}>
        <div className={s.cardHeader}><span className={s.cardTitle}>Goal progress bars</span></div>
        {GOAL_META.map(({ key, label, Icon, color }) => {
          const c = completion[key] || { met:0, total:period.days, pct:0 };
          return (
            <div className={s.barRow} key={key}>
              <div className={s.barRowHead}>
                <span className={s.barRowLabel}><Icon size={13} color={color} />{label}</span>
                <span className={s.barRowVal}>{c.met} of {c.total} days · {c.pct}%</span>
              </div>
              <div className={s.barTrack}><div className={s.barFill} style={{ width:`${c.pct}%`, background: color }} /></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
