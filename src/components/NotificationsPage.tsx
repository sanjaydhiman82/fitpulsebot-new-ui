import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { useApp } from '../App';
import { Save, RefreshCw } from 'lucide-react';
import styles from './LogPage.module.css';

export default function NotificationsPage() {
  const { user } = useApp();
  const [allNotifs, setAllNotifs] = useState<any[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true); setError('');
    try {
      const allRes = await api.reminders.mine(user.organizationId).catch(() => ({ reminders: [] }));
      const notifs: any[] = allRes.reminders || [];
      setAllNotifs(notifs);
      const init: Record<string, boolean> = {};
      notifs.forEach((n: any) => { init[n.org_reminder_id] = n.is_opted_in !== false; });
      setSelected(init);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const toggle = (id: string) => setSelected(prev => ({ ...prev, [id]: !prev[id] }));

  const handleSave = async () => {
    if (!user) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      await Promise.all(allNotifs.map(n => api.reminders.saveMine(n.org_reminder_id, { isOptedIn: selected[n.org_reminder_id] !== false })));
      setSuccess('Reminder preferences saved!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) { setError(e.message); }
    setSaving(false);
  };

  // Group by category
  const groups: Record<string, any[]> = {};
  allNotifs.forEach(n => { const cat = n.category || 'General'; (groups[cat] = groups[cat] || []).push(n); });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div><h2 className={styles.pageTitle}>Reminders</h2><p className={styles.pageDesc}>Choose which reminders you want to receive</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={styles.refreshBtn} onClick={load}><RefreshCw size={14} className={loading ? styles.spinning : ''} /></button>
          <button className={styles.addBtn} onClick={handleSave} disabled={saving}><Save size={15} />{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
      {error && <div className={styles.errorBanner}>{error}</div>}
      {success && <div style={{ padding: '11px 14px', background: 'rgba(61,191,150,.1)', border: '1px solid rgba(61,191,150,.3)', borderRadius: 12, color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>{success}</div>}
      {loading && <div className={styles.loadingRow}>Loading reminders…</div>}

      {Object.entries(groups).map(([cat, items]) => (
        <div key={cat} className={styles.formCard}>
          <h3 className={styles.formTitle}>{cat}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map((n: any) => (
              <label key={n.org_reminder_id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, border: `1.5px solid ${selected[n.org_reminder_id] ? 'var(--accent)' : 'var(--border-strong)'}`, background: selected[n.org_reminder_id] ? 'var(--accent)' : 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, transition: 'all 200ms', cursor: 'pointer' }}
                  onClick={() => toggle(n.org_reminder_id)}>
                  {selected[n.org_reminder_id] && <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{n.purpose}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{n.organization_name} · {(n.channels || []).join(', ')} · {n.frequency || 'As configured'}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      ))}

      {!loading && allNotifs.length === 0 && <div className={styles.emptyRow}>No organization reminders assigned to you yet.</div>}
    </div>
  );
}
