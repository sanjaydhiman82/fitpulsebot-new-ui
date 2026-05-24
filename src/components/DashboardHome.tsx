import React, { useState } from 'react';
import { Droplets, Flame, Activity, Moon, Scale, Target, Zap, CreditCard } from 'lucide-react';
import { DashTab } from '../pages/Dashboard';
import { useApp } from '../App';
import { RANGES, RangeId } from '../utils/dateRange';
import AICoachSection   from './AICoachSection';
import AccountSection   from './AccountSection';
import TodaySection     from './TodaySection';
import NutritionSection from './NutritionSection';
import HydrationSection from './HydrationSection';
import ActivitySection  from './ActivitySection';
import SleepSection     from './SleepSection';
import WeightSection    from './WeightSection';
import GoalsSection     from './GoalsSection';
import styles from './DashboardHome.module.css';

export default function DashboardHome({ setTab }: { setTab: (t: DashTab) => void }) {
  const { user } = useApp();
  const [range, setRange] = useState<RangeId>('today');

  const today = new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' });
  const hour  = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name  = user?.firstName?.trim() || 'there';

  const HEALTH_SECTIONS = [
    { id:'today',     label:'Today',     icon: Zap,       color:'var(--accent)', tab:'home'      as DashTab },
    { id:'nutrition', label:'Nutrition', icon: Flame,     color:'#e53e3e',       tab:'nutrition' as DashTab },
    { id:'hydration', label:'Hydration', icon: Droplets,  color:'#2d6fd6',       tab:'hydration' as DashTab },
    { id:'activity',  label:'Activity',  icon: Activity,  color:'#d97706',       tab:'activity'  as DashTab },
    { id:'sleep',     label:'Sleep',     icon: Moon,      color:'#7f77dd',       tab:'sleep'     as DashTab },
    { id:'weight',    label:'Weight',    icon: Scale,     color:'#9f7aea',       tab:'weight'    as DashTab },
    { id:'goals',     label:'Goals',     icon: Target,    color:'#f59e0b',       tab:'reports'   as DashTab },
  ] as const;

  return (
    <div className={styles.page}>

      {/* ── Greeting ── */}
      <div className={styles.greeting}>
        <div>
          <h2 className={styles.greetTitle}>{greet}, {name}! 👋</h2>
          <p className={styles.greetDate}>{today}</p>
        </div>
        <div className={styles.rangeRow}>
          {RANGES.map(r => (
            <button key={r.id} type="button"
              className={`${styles.rangeBtn} ${range === r.id ? styles.rangeBtnActive : ''}`}
              onClick={() => setRange(r.id)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── AI Coach insight — always at top ── */}
      <AICoachSection />

      {/* ── Health sections stacked ── */}
      {HEALTH_SECTIONS.map(({ id, label, icon: Icon, color, tab }) => (
        <div key={id}>
          {id !== 'today' && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, marginTop:4 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:28, height:28, borderRadius:'var(--radius-sm)', background:`${color}22`, border:`1px solid ${color}44`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon size={14} color={color} />
                </div>
                <span style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.07em' }}>
                  {label}
                </span>
              </div>
              <button onClick={() => setTab(tab)} style={{ fontSize:12, color:'var(--accent)', fontWeight:600, display:'flex', alignItems:'center', gap:3 }}>
                See all →
              </button>
            </div>
          )}

          {id === 'today'     && <TodaySection     range={range} />}
          {id === 'nutrition' && <NutritionSection range={range} />}
          {id === 'hydration' && <HydrationSection range={range} />}
          {id === 'activity'  && <ActivitySection  range={range} />}
          {id === 'sleep'     && <SleepSection     range={range} />}
          {id === 'weight'    && <WeightSection    range={range} />}
          {id === 'goals'     && <GoalsSection     range={range} />}

          <div style={{ height:1, background:'var(--border)', margin:'24px 0 20px' }} />
        </div>
      ))}

      {/* ── Account / Meta — always at bottom ── */}
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
          <div style={{ width:28, height:28, borderRadius:'var(--radius-sm)', background:'rgba(159,122,234,.15)', border:'1px solid rgba(159,122,234,.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <CreditCard size={14} color="#9f7aea" />
          </div>
          <span style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.07em' }}>
            Account
          </span>
        </div>
        <AccountSection setTab={setTab} />
      </div>

    </div>
  );
}
