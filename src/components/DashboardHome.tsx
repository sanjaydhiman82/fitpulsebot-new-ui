import React, { useState } from 'react';
import { Droplets, Flame, Activity, Moon, Scale, BarChart2, Target, Zap, Brain } from 'lucide-react';
import { DashTab } from '../pages/Dashboard';
import { useApp } from '../App';
import { RANGES, RangeId } from '../utils/dateRange';
import TodaySection    from './TodaySection';
import NutritionSection from './NutritionSection';
import HydrationSection from './HydrationSection';
import ActivitySection  from './ActivitySection';
import SleepSection     from './SleepSection';
import WeightSection    from './WeightSection';
import GoalsSection     from './GoalsSection';
import styles from './DashboardHome.module.css';
import s from './sections.module.css';

export default function DashboardHome({ setTab }: { setTab: (t: DashTab) => void }) {
  const { user } = useApp();
  const [range, setRange] = useState<RangeId>('today');

  const today = new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' });
  const hour  = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name  = user?.firstName || user?.userName?.split('@')[0] || 'there';

  const SECTIONS = [
    { id:'today',      icon: Zap,       color:'var(--accent)',  label:'Today',      tab:'home'      as DashTab },
    { id:'nutrition',  icon: Flame,     color:'#e53e3e',        label:'Nutrition',  tab:'nutrition' as DashTab },
    { id:'hydration',  icon: Droplets,  color:'#2d6fd6',        label:'Hydration',  tab:'hydration' as DashTab },
    { id:'activity',   icon: Activity,  color:'#d97706',        label:'Activity',   tab:'activity'  as DashTab },
    { id:'sleep',      icon: Moon,      color:'#7f77dd',        label:'Sleep',      tab:'sleep'     as DashTab },
    { id:'weight',     icon: Scale,     color:'#9f7aea',        label:'Weight',     tab:'weight'    as DashTab },
    { id:'goals',      icon: Target,    color:'#f59e0b',        label:'Goals',      tab:'reports'   as DashTab },
  ] as const;

  type SectionId = typeof SECTIONS[number]['id'];
  const [activeSection, setActiveSection] = useState<SectionId>('today');

  return (
    <div className={styles.page}>
      <div className={styles.greeting}>
        <div>
          <h2 className={styles.greetTitle}>{greet}, {name}! 👋</h2>
          <p className={styles.greetDate}>{today}</p>
        </div>
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

      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {SECTIONS.map(sec => {
          const Icon = sec.icon;
          const active = activeSection === sec.id;
          return (
            <button key={sec.id} type="button" onClick={() => setActiveSection(sec.id)}
              style={{
                display:'flex', alignItems:'center', gap:7, padding:'8px 14px',
                borderRadius:'var(--radius-full)',
                background: active ? sec.color : 'var(--bg-input)',
                color: active ? '#fff' : 'var(--text-secondary)',
                border: `1.5px solid ${active ? sec.color : 'var(--border)'}`,
                fontSize:13, fontWeight:700, transition:'all var(--transition)',
              }}>
              <Icon size={14} />
              {sec.label}
            </button>
          );
        })}
      </div>

      <div>
        {activeSection === 'today'     && <TodaySection     range={range} />}
        {activeSection === 'nutrition' && <NutritionSection range={range} />}
        {activeSection === 'hydration' && <HydrationSection range={range} />}
        {activeSection === 'activity'  && <ActivitySection  range={range} />}
        {activeSection === 'sleep'     && <SleepSection     range={range} />}
        {activeSection === 'weight'    && <WeightSection    range={range} />}
        {activeSection === 'goals'     && <GoalsSection     range={range} />}
      </div>
    </div>
  );
}
