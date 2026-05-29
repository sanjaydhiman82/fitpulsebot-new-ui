import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, RefreshCw, PenLine, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { api } from '../api';
import DateFilter, { dateWithCurrentTime, displayDate, formatLocalDate } from './DateFilter';
import ImageUploadLogger from './ImageUploadLogger';
import styles from './LogPage.module.css';

type Mode = 'manual' | 'ai';

export default function SleepLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [form, setForm] = useState({ sleepTimeHr: '', datetime: new Date().toISOString().slice(0, 10) });
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState<Mode>('manual');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [date, setDate] = useState(formatLocalDate(new Date()));
  const [avg7Day, setAvg7Day] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await api.sleep.list(date);
      const arr = Array.isArray(data) ? data : [];
      arr.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setLogs(arr);
    }
    catch (e: any) { setError(e.message); }
    setLoading(false);
  }, [date]);

  const loadAverage = useCallback(async () => {
    try {
      const res = await api.sleep.getAverage(7);
      console.log('Sleep average API response:', res);
      // Handle various response formats: { averageSleepHr: 4.67 }, { averageSleepHours: 7.5 }, { average: 7.5 }
      const avg = res?.averageSleepHr ?? res?.averageSleepHours ?? res?.average ?? res?.avg ?? null;
      setAvg7Day(typeof avg === 'number' ? avg : null);
    } catch (e) { console.error('Failed to load sleep average:', e); setAvg7Day(null); }
  }, []);

  useEffect(() => { load(); loadAverage(); }, [load, loadAverage]);

  const addLog = async () => {
    if (!form.sleepTimeHr) return;
    setSaving(true); setError('');
    try {
      const res = await api.sleep.create({ sleepTimeHr: Math.round(Number(form.sleepTimeHr)), datetime: dateWithCurrentTime(form.datetime) });
      setLogs(prev => [res, ...prev]);
      setForm({ sleepTimeHr: '', datetime: date });
      setShowForm(false);
    } catch (e: any) { setError(e.message); }
    setSaving(false);
  };

  const deleteLog = async (id: string) => {
    try { await api.sleep.delete(id); setLogs(prev => prev.filter(l => l.id !== id)); }
    catch (e: any) { setError(e.message); }
  };

  const onAiSuccess = (data: any) => { setLogs(prev => [data, ...prev]); setShowForm(false); };

  const chartData = [...logs].reverse().slice(-7).map(l => ({
    day: l.createdAt ? new Date(l.createdAt).toLocaleDateString('en', { weekday: 'short' }) : '?',
    sleep: l.sleepTimeHr || 0,
  }));
  const avgDisplay = avg7Day !== null ? avg7Day.toFixed(1) : '—';

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div><h2 className={styles.pageTitle}>Sleep Tracker</h2><p className={styles.pageDesc}>Monitor sleep patterns and quality</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={styles.refreshBtn} onClick={() => { load(); loadAverage(); }}><RefreshCw size={14} className={loading ? styles.spinning : ''} /></button>
          <button className={styles.addBtn} onClick={() => setShowForm(v => !v)}><Plus size={16} /> Log Sleep</button>
        </div>
      </div>

      <DateFilter date={date} onChange={(next) => { setDate(next); setForm(prev => ({ ...prev, datetime: next })); }} />
      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.summaryRow}>
        <div className={styles.sumCard}><div className={styles.sumLabel}>Last Night</div><div className={styles.sumValue} style={{ color: '#9f7aea' }}>{logs[0]?.sleepTimeHr || '—'}<span className={styles.sumUnit}>h</span></div></div>
        <div className={styles.sumCard}><div className={styles.sumLabel}>7-Day Avg</div><div className={styles.sumValue} style={{ color: '#3dbf96' }}>{avgDisplay}<span className={styles.sumUnit}>h</span></div></div>
        <div className={styles.sumCard}><div className={styles.sumLabel}>Goal</div><div className={styles.sumValue} style={{ color: '#5bc8e0' }}>8<span className={styles.sumUnit}>h</span></div></div>
        <div className={styles.sumCard}><div className={styles.sumLabel}>Entries</div><div className={styles.sumValue}>{logs.length}</div></div>
      </div>

      {showForm && (
        <div className={`${styles.formCard} ${styles.formModal}`}>
          <div className={styles.formModalHeader}>
            <div>
              <div className={styles.formModalEyebrow}>Add log</div>
              <h3 className={styles.formModalTitle}>Log Sleep</h3>
            </div>
          </div>
          {/* Mode toggle */}
          <ModeToggle mode={mode} onChange={setMode} />

          {mode === 'manual' ? (
            <>
              <div className={styles.formGrid} style={{ marginTop: 18 }}>
                <div className={styles.field}><label>Sleep Duration (hours)</label><input type="number" step="1" min="0" max="24" placeholder="8" value={form.sleepTimeHr} onChange={e => setForm({ ...form, sleepTimeHr: e.target.value })} /></div>
                <div className={styles.field}><label>Date</label><input type="date" value={form.datetime} onChange={e => setForm({ ...form, datetime: e.target.value })} /></div>
              </div>
              <div className={styles.formActions}>
                <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
                <button className={styles.saveBtn} onClick={addLog} disabled={saving}>{saving ? 'Saving…' : 'Save Sleep'}</button>
              </div>
            </>
          ) : (
            <div style={{ marginTop: 16 }}>
              <ImageUploadLogger
                endpoint="user/sleep"
                hint="Screenshot of your sleep tracker or fitness band app"
                onSuccess={onAiSuccess}
                onError={setError}
              />
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {chartData.length > 0 && (
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}><span className={styles.chartTitle}>Sleep Duration</span><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Goal: 8h</span></div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barSize={20}>
              <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide domain={[0, 10]} />
              <ReferenceLine y={8} stroke="var(--accent)" strokeDasharray="4 4" strokeWidth={1.5} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13 }} formatter={(v: any) => [`${v}h`, 'Sleep']} />
              <Bar dataKey="sleep" radius={[5,5,0,0]}>
                {chartData.map((d, i) => <Cell key={i} fill={d.sleep >= 8 ? '#9f7aea' : d.sleep >= 7 ? '#9f7aea80' : '#ef444460'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {loading && <div className={styles.loadingRow}>Loading…</div>}
      <div className={styles.logList}>
        {!loading && logs.length === 0 && <div className={styles.emptyRow}>No sleep logs for {displayDate(date)}. Start tracking tonight!</div>}
        {logs.map((l, i) => (
          <div key={l.id || i} className={styles.logItem}>
            <span style={{ fontSize: 24 }}>😴</span>
            <div style={{ flex: 1 }}>
              <div className={styles.logName}>{l.sleepTimeHr ? `${l.sleepTimeHr}h sleep` : '—'}</div>
              <div className={styles.logMeta}>{l.createdAt ? new Date(l.createdAt).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }) : ''}</div>
            </div>
            <button className={styles.deleteBtn} onClick={() => deleteLog(l.id)}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
      <button
        onClick={() => onChange('manual')}
        style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          padding: '9px 0', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 700,
          border: mode === 'manual' ? '2px solid var(--accent)' : '2px solid var(--border)',
          background: mode === 'manual' ? 'var(--accent-light)' : 'transparent',
          color: mode === 'manual' ? 'var(--accent)' : 'var(--text-secondary)',
          transition: 'all 0.2s',
        }}
      >
        <PenLine size={14} /> Manual
      </button>
      <button
        onClick={() => onChange('ai')}
        style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          padding: '9px 0', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 700,
          border: mode === 'ai' ? '2px solid #818cf8' : '2px solid var(--border)',
          background: mode === 'ai' ? 'rgba(99,102,241,.1)' : 'transparent',
          color: mode === 'ai' ? '#818cf8' : 'var(--text-secondary)',
          transition: 'all 0.2s',
        }}
      >
        <Sparkles size={14} /> AI Vision
      </button>
    </div>
  );
}
