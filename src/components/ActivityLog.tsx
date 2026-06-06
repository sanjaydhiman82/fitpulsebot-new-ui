import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Activity, RefreshCw, PenLine, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { api } from '../api';
import DateFilter, { dateWithCurrentTime, displayDate, formatLocalDate } from './DateFilter';
import ImageUploadLogger from './ImageUploadLogger';
import styles from './LogPage.module.css';
import dropdowns from '../config/dropdowns.json';

type Mode = 'manual' | 'ai';
const EXERCISE_TYPES = dropdowns.activity.exerciseTypes;
const PIE_COLORS = dropdowns.charts.pieColors;

export default function ActivityLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [chart, setChart] = useState<any[]>([]);
  const [form, setForm] = useState({ activityType: 'Running', durationMin: '', caloriesBurned: '', distanceKm: '' });
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState<Mode>('manual');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [date, setDate] = useState(formatLocalDate(new Date()));

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setLogs((await api.activity.list(date)) || []); }
    catch (e: any) { setError(e.message); }
    setLoading(false);
  }, [date]);

  const loadChart = useCallback(async () => {
    try {
      const ac = await api.dashboard.activityChart(7);
      if (Array.isArray(ac?.data)) {
        setChart(ac.data.map((item: any) => ({
          day: new Date(item.date).toLocaleDateString('en', { weekday: 'short' }),
          calories: item.caloriesBurned || 0,
        })));
      } else if (ac?.labels) {
        const cals = ac.series?.find((s: any) => s.name?.toLowerCase().includes('calori'))?.data || [];
        setChart(ac.labels.map((d: string, i: number) => ({
          day: new Date(d).toLocaleDateString('en', { weekday: 'short' }),
          calories: cals[i] || 0,
        })));
      } else {
        setChart([]);
      }
    } catch { setChart([]); }
  }, []);

  useEffect(() => { load(); loadChart(); }, [load, loadChart]);

  const addLog = async () => {
    if (!form.durationMin) return;
    setSaving(true); setError('');
    try {
      const res = await api.activity.create({
        activityType: form.activityType,
        durationMin: parseInt(form.durationMin),
        caloriesBurned: form.caloriesBurned ? parseInt(form.caloriesBurned) : null,
        distanceKm: form.distanceKm ? parseFloat(form.distanceKm) : null,
        datetime: dateWithCurrentTime(date),
      });
      setLogs(prev => [res, ...prev]);
      setForm({ activityType: 'Running', durationMin: '', caloriesBurned: '', distanceKm: '' });
      setShowForm(false);
    } catch (e: any) { setError(e.message); }
    setSaving(false);
  };

  const deleteLog = async (log: any) => {
    try { await api.activity.delete(log.userId); setLogs(prev => prev.filter(l => l.id !== log.id)); }
    catch (e: any) { setError(e.message); }
  };

  const onAiSuccess = (data: any) => { setLogs(prev => [data, ...prev]); setShowForm(false); };

  const activityTypeData = Object.values(
    logs.reduce((acc: Record<string, any>, log) => {
      const name = log.activityType || 'Other';
      if (!acc[name]) acc[name] = { name, value: 0, calories: 0 };
      acc[name].value += Number(log.durationMin || 0);
      acc[name].calories += Number(log.caloriesBurned || 0);
      return acc;
    }, {})
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div><h2 className={styles.pageTitle}>Activity Log</h2><p className={styles.pageDesc}>Track your workouts and physical activities</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={styles.refreshBtn} onClick={() => { load(); loadChart(); }}><RefreshCw size={14} className={loading ? styles.spinning : ''} /></button>
          <button className={styles.addBtn} onClick={() => setShowForm(v => !v)}><Plus size={16} /> Log Activity</button>
        </div>
      </div>

      <DateFilter date={date} onChange={setDate} />
      {error && <div className={styles.errorBanner}>{error}</div>}

      {showForm && (
        <div className={`${styles.formCard} ${styles.formModal}`}>
          <div className={styles.formModalHeader}>
            <div>
              <div className={styles.formModalEyebrow}>Add log</div>
              <h3 className={styles.formModalTitle}>Log Activity</h3>
            </div>
          </div>
          <ModeToggle mode={mode} onChange={setMode} />
          {mode === 'manual' ? (
            <>
              <div className={styles.formGrid} style={{ marginTop: 18 }}>
                <div className={styles.field}><label>Activity Type</label><select value={form.activityType} onChange={e => setForm({ ...form, activityType: e.target.value })}>{EXERCISE_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
                <div className={styles.field}><label>Duration (min)</label><input type="number" placeholder="30" value={form.durationMin} onChange={e => setForm({ ...form, durationMin: e.target.value })} /></div>
                <div className={styles.field}><label>Calories Burned</label><input type="number" placeholder="250" value={form.caloriesBurned} onChange={e => setForm({ ...form, caloriesBurned: e.target.value })} /></div>
                <div className={styles.field}><label>Distance (km)</label><input type="number" step="0.1" placeholder="5.0" value={form.distanceKm} onChange={e => setForm({ ...form, distanceKm: e.target.value })} /></div>
              </div>
              <div className={styles.formActions}>
                <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
                <button className={styles.saveBtn} onClick={addLog} disabled={saving}>{saving ? 'Saving...' : 'Save Activity'}</button>
              </div>
            </>
          ) : (
            <div style={{ marginTop: 16 }}>
              <ImageUploadLogger
                endpoint="activity-log"
                hint="Photo of your workout, organization session, run tracker or sport activity"
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

      <div className={styles.chartsRow2}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}><span className={styles.chartTitle}>Calories Burned This Week</span></div>
          {chart.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chart} barSize={20}>
                <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13 }} />
                <Bar dataKey="calories" name="Calories" radius={[5,5,0,0]}>
                  {chart.map((_, i) => <Cell key={i} fill={i === chart.length-1 ? '#3dbf96' : '#3dbf9640'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No weekly calorie data yet</div>
          )}
        </div>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}><span className={styles.chartTitle}>Activity Type Breakdown</span><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{displayDate(date)}</span></div>
          {activityTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={activityTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={70} paddingAngle={3}>
                  {activityTypeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text-primary)' }} formatter={(v: any, _n: any, item: any) => [`${v} min · ${item.payload.calories} kcal`, item.payload.name]} />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No activity types for this date</div>
          )}
        </div>
      </div>

      {loading && <div className={styles.loadingRow}>Loading...</div>}
      <div className={styles.logList}>
        {logs.length === 0 && !loading && <div className={styles.emptyRow}>No activities logged for {displayDate(date)}. Hit "Log Activity" to start!</div>}
        {logs.map((log, i) => (
          <div key={log.id || i} className={styles.logItem}>
            <div className={styles.logIcon}><Activity size={18} color="var(--accent)" /></div>
            <div style={{ flex: 1 }}>
              <div className={styles.logName}>{log.activityType}</div>
              <div className={styles.logMeta}>{log.durationMin} min {log.distanceKm ? `· ${log.distanceKm} km` : ''}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className={styles.logCal} style={{ color: 'var(--danger)' }}>-{log.caloriesBurned || 0} kcal</div>
              <div className={styles.logTime}>{log.activityDatetime ? new Date(log.activityDatetime).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }) : ''}</div>
            </div>
            <button className={styles.deleteBtn} onClick={() => deleteLog(log)}><Trash2 size={14} /></button>
          </div>
        ))}
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
