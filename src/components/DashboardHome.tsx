import React, { useState } from 'react';
import { DashTab } from '../pages/Dashboard';
import { useApp } from '../App';
import { RANGES, RangeId } from '../utils/dateRange';
import TodaySection     from './TodaySection';
import styles from './DashboardHome.module.css';

export default function DashboardHome(_props: { setTab: (t: DashTab) => void }) {
  const { user } = useApp();
  const [range, setRange] = useState<RangeId>('today');

  const today = new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' });
  const hour  = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name  = user?.firstName?.trim() || 'there';

  return (
    <div className={styles.page}>

      {/* ── Greeting + Range filter ── */}
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

      <TodaySection range={range} />

    </div>
  );
}
