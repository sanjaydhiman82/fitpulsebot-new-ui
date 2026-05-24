import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Lightbulb } from 'lucide-react';
import { api } from '../api';
import s from './sections.module.css';

const FOCUS_COLORS: Record<string, string> = {
  nutrition: '#e53e3e',
  sleep:     '#7f77dd',
  hydration: '#2d6fd6',
  activity:  '#d97706',
  weight:    '#9f7aea',
  great:     'var(--accent)',
};
const FOCUS_BG: Record<string, string> = {
  nutrition: 'rgba(229,62,62,.1)',
  sleep:     'rgba(127,119,221,.1)',
  hydration: 'rgba(45,111,214,.1)',
  activity:  'rgba(217,119,6,.1)',
  weight:    'rgba(159,122,234,.1)',
  great:     'var(--accent-light)',
};

export default function AICoachSection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.aiCoach.insight();
      setData(res);
    } catch (e: any) {
      setError(e?.message || 'Could not load insight');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 18px',
      background: 'var(--accent-light)', border: '1px solid var(--border-strong)',
      borderRadius: 'var(--radius-xl)',
    }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid var(--border-strong)' }}>
        <img src="/coach.png" alt="AI Coach" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
      </div>
      <RefreshCw size={14} className={s.spinning} color="var(--accent)" />
      <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>
        AI Coach is thinking…
      </span>
    </div>
  );

  if (error || !data) return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px',
      background: 'var(--metric-bg)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)',
    }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, opacity: 0.5 }}>
        <img src="/coach.png" alt="AI Coach" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
        AI Coach unavailable right now.
      </span>
    </div>
  );

  const focus = data.focus || 'great';
  const color = FOCUS_COLORS[focus] || 'var(--accent)';
  const bg    = FOCUS_BG[focus]    || 'var(--accent-light)';

  return (
    <div style={{
      display: 'flex', gap: 14, padding: '16px 20px',
      background: bg, border: `1px solid ${color}44`,
      borderRadius: 'var(--radius-xl)',
      animation: 'fadeUp 400ms cubic-bezier(.22,.68,0,1.2) both',
    }}>
      {/* Coach avatar */}
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        border: `2px solid ${color}55`,
        overflow: 'hidden', flexShrink: 0,
        boxShadow: `0 0 0 3px ${color}22`,
      }}>
        <img
          src="/coach.png"
          alt="AI Coach"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.09em' }}>
            AI Coach
          </span>
          {data.cached && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)', padding: '1px 6px', background: 'var(--metric-bg)', borderRadius: 4, border: '1px solid var(--border)' }}>
              cached
            </span>
          )}
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.5, marginBottom: 6 }}>
          {data.insight}
        </p>
        {data.action && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <Lightbulb size={13} color={color} style={{ marginTop: 1, flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.action}
            </p>
          </div>
        )}
      </div>

      {/* Refresh button */}
      <button
        onClick={load}
        title="Refresh insight"
        style={{
          color: 'var(--text-muted)', padding: 6, borderRadius: 8,
          border: '1px solid var(--border)', display: 'flex', alignItems: 'center',
          alignSelf: 'flex-start', flexShrink: 0,
        }}
      >
        <RefreshCw size={12} />
      </button>
    </div>
  );
}
