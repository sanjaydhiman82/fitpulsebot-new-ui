import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './LogPage.module.css';

export function formatLocalDate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function offsetDate(base: string, days: number): string {
  const d = new Date(`${base}T00:00:00`);
  d.setDate(d.getDate() + days);
  return formatLocalDate(d);
}

export function displayDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  const today = formatLocalDate(new Date());
  const yesterday = offsetDate(today, -1);
  if (iso === today) return 'Today';
  if (iso === yesterday) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function dateWithCurrentTime(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const now = new Date();
  return new Date(y, m - 1, d, now.getHours(), now.getMinutes()).toISOString();
}

export default function DateFilter({ date, onChange }: { date: string; onChange: (date: string) => void }) {
  const today = formatLocalDate(new Date());
  const isFuture = date >= today;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button className={styles.refreshBtn} onClick={() => onChange(offsetDate(date, -1))} title="Previous day">
        <ChevronLeft size={16} />
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
          {displayDate(date)}
        </span>
        <input
          type="date"
          value={date}
          max={today}
          onChange={e => onChange(e.target.value)}
          style={{ width: 'auto', padding: '6px 10px', fontSize: 13 }}
        />
      </div>
      <button className={styles.refreshBtn} onClick={() => onChange(offsetDate(date, 1))} disabled={isFuture} title="Next day">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
