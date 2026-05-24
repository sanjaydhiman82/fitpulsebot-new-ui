import React, { useEffect, useState, useCallback } from 'react';
import { Droplets, Flame, Zap, Moon, Activity, Brain, RefreshCw, UtensilsCrossed, Route } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '../api';
import { RangeId } from '../utils/dateRange';
import s from './sections.module.css';

interface Props { range: RangeId; }

function Ring({ pct, color, size = 100, stroke = 9 }: { pct: number; color: string; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition: 'stroke-dashoffset 700ms ease' }} />
    </svg>
  );
}

function BarRow({ label, icon: Icon, color, val, goal, unit, pct }: any) {
  return (
    <div className={s.barRow}>
      <div className={s.barRowHead}>
        <span className={s.barRowLabel}><Icon size={13} color={color} />{label}</span>
        <span className={s.barRowVal}>{val} / {goal} {unit}</span>
      </div>
      <div className={s.barTrack}><div className={s.barFill} style={{ width: `${pct}%`, background: color }} /></div>
    </div>
  );
}

const MEAL_ICONS: Record<string, string> = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' };

export default function TodaySection({ range }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date();
      const d = range === 'today' ? `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}` : undefined;
      const res = await api.dashboard.sectionToday(d);
      setData(res);
    } catch { setData(null); } finally { setLoading(false); }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className={s.loading}><RefreshCw size={16} className={s.spinning} style={{ marginRight: 8 }} />Loading today's data…</div>;
  if (!data) return <div className={s.empty}>No data for today.</div>;

  const { ringPct, streak, bars, goals, netCalories, meals, activity } = data;
  const isToday = range === 'today';

  // Hourly calorie breakdown for mini bar chart (mock until backend adds hourly)
  const mealChartData = ['Breakfast','Lunch','Dinner','Snack'].map(m => ({
    name: m.slice(0,3),
    cal: meals?.filter((x: any) => x.mealType?.toLowerCase() === m.toLowerCase())
              .reduce((a: number, x: any) => a + (x.calories || 0), 0) || 0,
  }));

  return (
    <div className={s.section}>
      {streak > 0 && (
        <div className={s.streakBanner}>
          <div><Zap size={28} color="var(--warning)" /></div>
          <div>
            <div className={s.streakNum}>{streak}-day</div>
            <div className={s.streakLabel}>Streak 🔥</div>
            <div className={s.streakSub}>Keep logging every day!</div>
          </div>
        </div>
      )}

      <div className={s.card}>
        <div className={s.cardHeader}>
          <span className={s.cardTitle}>{isToday ? "Today's Progress" : "Period Overview"}</span>
          <button onClick={load} style={{ color: 'var(--text-muted)', padding: 4, borderRadius: 8, border: '1px solid var(--border)', display:'flex', alignItems:'center' }}>
            <RefreshCw size={13} />
          </button>
        </div>
        <div className={s.ringWrap}>
          <div className={s.ringCenter}>
            <Ring pct={ringPct} color="var(--accent)" size={110} stroke={10} />
            <div className={s.ringLabel}>
              <span className={s.ringPct}>{ringPct}%</span>
              <span className={s.ringSubText}>done</span>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <BarRow label="Water"       icon={Droplets} color="#2d6fd6" val={bars.waterMl}  goal={goals.waterGoalMl}      unit="ml"   pct={bars.waterPct}   />
            <BarRow label="Calories in" icon={Flame}    color="#e53e3e" val={Math.round(bars.calIn)}   goal={goals.calConsumeGoal}   unit="kcal" pct={bars.calInPct}   />
            <BarRow label="Protein"     icon={UtensilsCrossed} color="#d53f8c" val={Math.round(bars.protein)}  goal={80}                     unit="g"    pct={bars.proteinPct} />
            <div className={s.divider} />
            <BarRow label="Sleep"       icon={Moon}     color="#7f77dd" val={bars.sleepHrs}  goal={goals.sleepGoalHrs}    unit="h"    pct={bars.sleepPct}   />
            <BarRow label="Cal burned"  icon={Activity} color="#d97706" val={bars.calBurn}   goal={goals.calBurnGoal}     unit="kcal" pct={bars.calBurnPct} />
          </div>
        </div>
      </div>

      <div className={s.grid2}>
        <div className={s.card}>
          <div className={s.cardHeader}><span className={s.cardTitle}>Calorie Balance</span></div>
          <div className={s.grid2} style={{ marginBottom: 12 }}>
            <div className={s.statCard}>
              <div className={s.statLabel}>Consumed</div>
              <div className={s.statValue} style={{ color: '#e53e3e' }}>{Math.round(bars.calIn)} <span className={s.statUnit}>kcal</span></div>
            </div>
            <div className={s.statCard}>
              <div className={s.statLabel}>Burned</div>
              <div className={s.statValue} style={{ color: 'var(--accent)' }}>{bars.calBurn} <span className={s.statUnit}>kcal</span></div>
            </div>
          </div>
          <div style={{ background: netCalories > 0 ? 'rgba(229,62,62,.08)' : 'var(--accent-light)', border: `1px solid ${netCalories > 0 ? 'rgba(229,62,62,.2)' : 'var(--border-strong)'}`, borderRadius: 'var(--radius-lg)', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Net {netCalories > 0 ? 'surplus' : 'deficit'}</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: netCalories > 0 ? 'var(--danger)' : 'var(--accent)' }}>{netCalories > 0 ? '+' : ''}{Math.round(netCalories)} kcal</span>
          </div>
        </div>

        <div className={s.card}>
          <div className={s.cardHeader}><span className={s.cardTitle}>Activity Summary</span></div>
          <div className={s.grid2} style={{ marginBottom: 8 }}>
            <div className={s.statCard}>
              <div className={s.statLabel}>Active</div>
              <div className={s.statValue}>{activity.activeMin} <span className={s.statUnit}>min</span></div>
            </div>
            <div className={s.statCard}>
              <div className={s.statLabel}>Distance</div>
              <div className={s.statValue}>{activity.distanceKm} <span className={s.statUnit}>km</span></div>
            </div>
          </div>
          <div className={s.statCard} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className={s.statLabel}>Sleep last night</div>
              <div className={s.statValue} style={{ color: '#7f77dd' }}>{bars.sleepHrs} <span className={s.statUnit}>h</span></div>
            </div>
            <span className={`${s.badge} ${bars.sleepPct >= 80 ? s.badgeGreen : bars.sleepPct >= 50 ? s.badgeAmber : s.badgeDanger}`}>
              {bars.sleepPct >= 80 ? '✓ Good' : bars.sleepPct >= 50 ? 'Low' : 'Poor'}
            </span>
          </div>
        </div>
      </div>

      {meals && meals.length > 0 && (
        <div className={s.card}>
          <div className={s.cardHeader}>
            <span className={s.cardTitle}>Meals Logged</span>
            <span className={s.cardSub}>{meals.length} item{meals.length > 1 ? 's' : ''}</span>
          </div>
          <div className={s.grid2} style={{ marginBottom: 14 }}>
            {mealChartData.map((m, i) => (
              <div key={m.name} className={s.statCard}>
                <div className={s.statLabel}>{['Breakfast','Lunch','Dinner','Snack'][i]}</div>
                <div className={s.statValue} style={{ fontSize: 20, color: m.cal > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {m.cal > 0 ? `${Math.round(m.cal)}` : '—'} {m.cal > 0 && <span className={s.statUnit}>kcal</span>}
                </div>
              </div>
            ))}
          </div>
          {meals.slice(0,5).map((meal: any, i: number) => (
            <div className={s.listItem} key={i}>
              <div className={s.listLeft}>
                <div className={s.listIcon} style={{ background: 'var(--metric-bg)', fontSize: 16 }}>{MEAL_ICONS[meal.mealType?.toLowerCase()] || '🍽️'}</div>
                <div>
                  <div className={s.listTitle}>{meal.foodName}</div>
                  <div className={s.listSub}>{meal.mealType}</div>
                </div>
              </div>
              <div className={s.listRight}>
                <div className={s.listVal}>{Math.round(meal.calories)} kcal</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
