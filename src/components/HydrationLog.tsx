import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, RefreshCw, PenLine, Sparkles } from 'lucide-react';
import { api } from '../api';
import DateFilter, { dateWithCurrentTime, displayDate, formatLocalDate } from './DateFilter';
import ImageUploadLogger from './ImageUploadLogger';
import styles from './LogPage.module.css';
import dropdowns from '../config/dropdowns.json';

type Mode = 'manual' | 'ai';

const DRINK_TYPES = dropdowns.hydration.drinkTypes;
const QUICK_ML = dropdowns.hydration.quickMl;

function getAmountMl(log: any) { return Number(log.amountMl ?? log.waterIntake?.value ?? 0); }
function getLogId(log: any) { return log.id || log.entryId; }
function getLogTime(log: any) { return log.logDatetime || log.createdAt; }

export default function HydrationLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState(DRINK_TYPES[0]);
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState<Mode>('manual');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [date, setDate] = useState(formatLocalDate(new Date()));
  const [avg7Day, setAvg7Day] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setLogs((await api.water.list(date)) || []); }
    catch (e: any) { setError(e.message); }
    setLoading(false);
  }, [date]);

  const loadAverage = useCallback(async () => {
    try {
      const res = await api.water.getAverage(7);
      console.log('Water average API response:', res);
      const avg = res?.averageWaterMl ?? res?.averageWater ?? res?.avg ?? res?.avgWaterMl ?? res?.avgWater ?? null;
      setAvg7Day(typeof avg === 'number' ? avg : null);
    } catch (e) { console.error('Failed to load water average:', e); setAvg7Day(null); }
  }, []);

  useEffect(() => { load(); loadAverage(); }, [load, loadAverage]);

  const totalMl = logs.reduce((a, l) => a + getAmountMl(l), 0);
  const goalMl = 2500;
  const pct = Math.min(Math.round((totalMl / goalMl) * 100), 100);

  const addLog = async (amountMl: number) => {
    setSaving(true); setError('');
    try {
      const res = await api.water.create({ drinkType: selectedType.name, waterIntake: { value: amountMl, unit: 'ml' }, logDatetime: dateWithCurrentTime(date) });
      setLogs(prev => [res, ...prev]);
      setShowForm(false);
    } catch (e: any) { setError(e.message); }
    setSaving(false);
  };

  const deleteLog = async (id: string) => {
    try { await api.water.delete(id); setLogs(prev => prev.filter(l => l.id !== id)); }
    catch (e: any) { setError(e.message); }
  };

  const onAiSuccess = (data: any) => { setLogs(prev => [data, ...prev]); setShowForm(false); };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div><h2 className={styles.pageTitle}>Hydration Monitor</h2><p className={styles.pageDesc}>Stay hydrated throughout the day</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={styles.refreshBtn} onClick={() => { load(); loadAverage(); }}><RefreshCw size={14} className={loading ? styles.spinning : ''} /></button>
          <button className={styles.addBtn} onClick={() => setShowForm(v => !v)}><Plus size={16} /> Log Drink</button>
        </div>
      </div>
      <DateFilter date={date} onChange={setDate} />
      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.summaryRow}>
        <div className={styles.sumCard}><div className={styles.sumLabel}>Today</div><div className={styles.sumValue} style={{ color: '#5bc8e0' }}>{totalMl}<span className={styles.sumUnit}>ml</span></div></div>
        <div className={styles.sumCard}><div className={styles.sumLabel}>7-Day Avg</div><div className={styles.sumValue} style={{ color: '#3dbf96' }}>{avg7Day !== null ? avg7Day.toFixed(0) : '—'}<span className={styles.sumUnit}>ml</span></div></div>
        <div className={styles.sumCard}><div className={styles.sumLabel}>Goal</div><div className={styles.sumValue}>{goalMl}<span className={styles.sumUnit}>ml</span></div></div>
      </div>

      <div className={styles.hydrationHero}>
        <div>
          <svg viewBox="0 0 120 120" width="150" height="150">
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" strokeWidth="8" />
            <circle cx="60" cy="60" r="52" fill="none" stroke="#5bc8e0" strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 52}`}
              strokeDashoffset={`${2 * Math.PI * 52 * (1 - pct / 100)}`}
              strokeLinecap="round" transform="rotate(-90 60 60)" style={{ transition: '1s ease' }} />
            <text x="50%" y="45%" textAnchor="middle" fill="var(--text-primary)" fontSize="20" fontWeight="800" fontFamily="Plus Jakarta Sans">{(totalMl / 1000).toFixed(1)}L</text>
            <text x="50%" y="62%" textAnchor="middle" fill="var(--text-muted)" fontSize="10" fontFamily="Plus Jakarta Sans">{pct}% of goal</text>
          </svg>
        </div>
        <div className={styles.hydrationStats}>
          <div className={styles.hydrationStat}><span className={styles.hydrationStatVal} style={{ color: '#5bc8e0' }}>{totalMl}ml</span><span>consumed</span></div>
          <div className={styles.hydrationStat}><span className={styles.hydrationStatVal}>{goalMl - totalMl}ml</span><span>remaining</span></div>
          <div className={styles.hydrationStat}><span className={styles.hydrationStatVal}>{logs.length}</span><span>drinks logged</span></div>
        </div>
      </div>

      {showForm && (
        <div className={styles.formCard}>
          <ModeToggle mode={mode} onChange={setMode} />

          {mode === 'manual' ? (
            <div style={{ marginTop: 16 }}>
              <div className={styles.drinkTypes}>
                {DRINK_TYPES.map(d => (
                  <button key={d.name} className={`${styles.drinkBtn} ${selectedType.name === d.name ? styles.drinkActive : ''}`}
                    style={{ '--dc': d.color } as any} onClick={() => setSelectedType(d)}>
                    <span style={{ fontSize: 20 }}>{d.icon}</span><span>{d.name}</span>
                  </button>
                ))}
              </div>
              <div className={styles.amountBtns}>
                {QUICK_ML.map(a => <button key={a} className={styles.amountBtn} onClick={() => addLog(a)} disabled={saving}>{a}ml</button>)}
              </div>
              <div className={styles.formActions}><button className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button></div>
            </div>
          ) : (
            <div style={{ marginTop: 16 }}>
              <ImageUploadLogger
                endpoint="water-intake"
                hint="Photo of your glass, bottle or drink container"
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

      {loading && <div className={styles.loadingRow}>Loading...</div>}
      <div className={styles.logList}>
        {!loading && logs.length === 0 && <div className={styles.emptyRow}>No drinks logged for {displayDate(date)}. Stay hydrated!</div>}
        {logs.map((l, i) => {
          const dt = DRINK_TYPES.find(d => d.name === l.drinkType) || DRINK_TYPES[0];
          const amountMl = getAmountMl(l);
          const logTime = getLogTime(l);
          return (
            <div key={getLogId(l) || i} className={styles.logItem}>
              <span style={{ fontSize: 24 }}>{dt.icon}</span>
              <div style={{ flex: 1 }}>
                <div className={styles.logName}>{l.drinkType || 'Water'}</div>
                <div className={styles.logTime}>{logTime ? new Date(logTime).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }) : ''}</div>
              </div>
              <span style={{ fontWeight: 700, color: '#5bc8e0' }}>{amountMl}ml</span>
              <button className={styles.deleteBtn} onClick={() => deleteLog(getLogId(l))}><Trash2 size={14} /></button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
      <button onClick={() => onChange('manual')} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'9px 0', borderRadius:'var(--radius-md)', fontSize:13, fontWeight:700, border:mode==='manual'?'2px solid var(--accent)':'2px solid var(--border)', background:mode==='manual'?'var(--accent-light)':'transparent', color:mode==='manual'?'var(--accent)':'var(--text-secondary)', transition:'all 0.2s' }}>
        <PenLine size={14} /> Manual
      </button>
      <button onClick={() => onChange('ai')} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'9px 0', borderRadius:'var(--radius-md)', fontSize:13, fontWeight:700, border:mode==='ai'?'2px solid #818cf8':'2px solid var(--border)', background:mode==='ai'?'rgba(99,102,241,.1)':'transparent', color:mode==='ai'?'#818cf8':'var(--text-secondary)', transition:'all 0.2s' }}>
        <Sparkles size={14} /> AI Vision
      </button>
    </div>
  );
}
