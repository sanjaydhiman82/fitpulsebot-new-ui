import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, RefreshCw, PenLine, Sparkles } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../api';
import DateFilter, { dateWithCurrentTime, displayDate, formatLocalDate } from './DateFilter';
import ImageUploadLogger from './ImageUploadLogger';
import styles from './LogPage.module.css';

type Mode = 'manual' | 'ai';

export default function WeightLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [form, setForm] = useState({ weightKg: '', logDatetime: new Date().toISOString().slice(0,10) });
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState<Mode>('manual');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [date, setDate] = useState(formatLocalDate(new Date()));
  const [avg30Day, setAvg30Day] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await api.weight.list(date);
      const arr = Array.isArray(data) ? data : [];
      arr.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setLogs(arr);
    }
    catch (e: any) { setError(e.message); }
    setLoading(false);
  }, [date]);

  const loadAverage = useCallback(async () => {
    try {
      const res = await api.weight.getAverage(30);
      console.log('Weight average API response:', res);
      const avg = res?.averageWeightKg ?? res?.averageWeight ?? res?.avg ?? res?.avgWeightKg ?? res?.avgWeight ?? null;
      setAvg30Day(typeof avg === 'number' ? avg : null);
    } catch (e) { console.error('Failed to load weight average:', e); setAvg30Day(null); }
  }, []);

  useEffect(() => { load(); loadAverage(); }, [load, loadAverage]);

  const addLog = async () => {
    if (!form.weightKg) return;
    setSaving(true); setError('');
    try {
      const res = await api.weight.create({ weightKg: parseFloat(form.weightKg), logDatetime: dateWithCurrentTime(form.logDatetime) });
      setLogs(prev => [res, ...prev]);
      setForm({ weightKg: '', logDatetime: date });
      setShowForm(false);
    } catch (e: any) { setError(e.message); }
    setSaving(false);
  };

  const deleteLog = async (id: string) => {
    try { await api.weight.delete(id); setLogs(prev => prev.filter(l => String(l.id) !== String(id))); }
    catch (e: any) { setError(e.message); }
  };

  const onAiSuccess = (data: any) => { setLogs(prev => [data, ...prev]); setShowForm(false); };

  const latest = logs[0]?.weightKg;
  const chartData = [...logs].reverse().slice(-10).map(l => ({
    day: l.createdAt ? new Date(l.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '?',
    weight: parseFloat(l.weightKg) || 0,
  }));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div><h2 className={styles.pageTitle}>Weight Log</h2><p className={styles.pageDesc}>Track your weight journey</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={styles.refreshBtn} onClick={() => { load(); loadAverage(); }}><RefreshCw size={14} className={loading ? styles.spinning : ''} /></button>
          <button className={styles.addBtn} onClick={() => setShowForm(v => !v)}><Plus size={16} /> Log Weight</button>
        </div>
      </div>

      <DateFilter date={date} onChange={(next) => { setDate(next); setForm(p => ({ ...p, logDatetime: next })); }} />
      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.summaryRow}>
        <div className={styles.sumCard}><div className={styles.sumLabel}>Latest</div><div className={styles.sumValue} style={{ color: '#3dbf96' }}>{latest ?? '—'}<span className={styles.sumUnit}>kg</span></div></div>
        <div className={styles.sumCard}><div className={styles.sumLabel}>30-Day Avg</div><div className={styles.sumValue} style={{ color: '#5bc8e0' }}>{avg30Day !== null ? avg30Day.toFixed(1) : '—'}<span className={styles.sumUnit}>kg</span></div></div>
        <div className={styles.sumCard}><div className={styles.sumLabel}>Change</div>
          <div className={styles.sumValue} style={{ color: logs.length >= 2 && logs[0].weightKg < logs[logs.length-1].weightKg ? '#3dbf96' : '#ef4444' }}>
            {logs.length >= 2 ? (logs[0].weightKg - logs[logs.length-1].weightKg).toFixed(1) : '—'}<span className={styles.sumUnit}>kg</span>
          </div>
        </div>
      </div>

      {showForm && (
        <div className={`${styles.formCard} ${styles.formModal}`}>
          <div className={styles.formModalHeader}>
            <div>
              <div className={styles.formModalEyebrow}>Add log</div>
              <h3 className={styles.formModalTitle}>Log Weight</h3>
            </div>
          </div>
          <ModeToggle mode={mode} onChange={setMode} />
          {mode === 'manual' ? (
            <>
              <div className={styles.formGrid} style={{ marginTop: 18 }}>
                <div className={styles.field}><label>Weight (kg)</label><input type="number" step="0.1" placeholder="70.5" value={form.weightKg} onChange={e => setForm({ ...form, weightKg: e.target.value })} /></div>
                <div className={styles.field}><label>Date</label><input type="date" value={form.logDatetime} onChange={e => setForm({ ...form, logDatetime: e.target.value })} /></div>
              </div>
              <div className={styles.formActions}>
                <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
                <button className={styles.saveBtn} onClick={addLog} disabled={saving}>{saving ? 'Saving…' : 'Save Weight'}</button>
              </div>
            </>
          ) : (
            <div style={{ marginTop: 16 }}>
              <ImageUploadLogger
                endpoint="weight-log"
                hint="Photo of your weighing scale display"
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

      {chartData.length > 1 && (
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}><span className={styles.chartTitle}>Weight Trend</span></div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3dbf96" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3dbf96" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13 }} formatter={(v: any) => [`${v} kg`, 'Weight']} />
              <Area type="monotone" dataKey="weight" stroke="#3dbf96" strokeWidth={2.5} fill="url(#wGrad)" dot={{ r: 4, fill: '#3dbf96' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {loading && <div className={styles.loadingRow}>Loading…</div>}
      <div className={styles.logList}>
        {!loading && logs.length === 0 && <div className={styles.emptyRow}>No weight logs for {displayDate(date)}.</div>}
        {logs.map((l, i) => (
          <div key={l.id || i} className={styles.logItem}>
            <span style={{ fontSize: 24 }}>⚖️</span>
            <div style={{ flex: 1 }}>
              <div className={styles.logName}>{parseFloat(l.weightKg).toFixed(1)} kg</div>
              <div className={styles.logMeta}>{l.createdAt ? new Date(l.createdAt).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }) : ''}</div>
            </div>
            <button className={styles.deleteBtn} onClick={() => deleteLog(String(l.id))}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
      <button onClick={() => onChange('manual')} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'9px 0', borderRadius:'var(--radius-md)', fontSize:13, fontWeight:700, border: mode==='manual'?'2px solid var(--accent)':'2px solid var(--border)', background:mode==='manual'?'var(--accent-light)':'transparent', color:mode==='manual'?'var(--accent)':'var(--text-secondary)', transition:'all 0.2s' }}>
        <PenLine size={14} /> Manual
      </button>
      <button onClick={() => onChange('ai')} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'9px 0', borderRadius:'var(--radius-md)', fontSize:13, fontWeight:700, border:mode==='ai'?'2px solid #818cf8':'2px solid var(--border)', background:mode==='ai'?'rgba(99,102,241,.1)':'transparent', color:mode==='ai'?'#818cf8':'var(--text-secondary)', transition:'all 0.2s' }}>
        <Sparkles size={14} /> AI Vision
      </button>
    </div>
  );
}
