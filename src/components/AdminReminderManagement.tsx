import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, RefreshCw } from 'lucide-react';
import { api } from '../api';
import styles from './LogPage.module.css';

const inputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 40,
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--bg-input)',
  color: 'var(--text-primary)',
  padding: '0 10px',
};

export default function AdminReminderManagement() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [organizationId, setOrganizationId] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.superAdmin.listOrgs({ pageSize: 200 })
      .then(d => setOrgs(d.organizations || []))
      .catch((e: any) => setMessage(e.message || 'Unable to load organizations.'));
  }, []);

  const load = useCallback(async () => {
    if (!organizationId) { setRows([]); return; }
    setLoading(true); setMessage('');
    try {
      const data = await api.reminders.orgList(organizationId);
      setRows(data.reminders || []);
    } catch (e: any) {
      setMessage(e.message || 'Unable to load reminders.');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => { load(); }, [load]);

  const visibleRows = useMemo(() => rows.filter(r => filter === 'all' || r.recipient_type === filter), [rows, filter]);

  async function toggle(row: any) {
    if (!organizationId) return;
    setMessage('');
    try {
      if (row.assigned && row.org_reminder_id) {
        await api.reminders.removeFromOrg(organizationId, row.org_reminder_id);
      } else {
        await api.reminders.assignToOrg(organizationId, { reminderCatalogId: row.reminder_catalog_id, isActive: true });
      }
      await load();
    } catch (e: any) {
      setMessage(e.message || 'Unable to update reminder.');
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.pageTitle}>Organization Reminders</h2>
          <p className={styles.pageDesc}>Assign reminder catalog items to organizations. Users only see reminders assigned to their organization.</p>
        </div>
        <button className={styles.refreshBtn} onClick={load} disabled={loading}><RefreshCw size={15} className={loading ? styles.spinning : ''} /></button>
      </div>

      {message && <div className={styles.errorBanner}>{message}</div>}

      <div className={styles.formCard}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) 220px', gap: 12 }}>
          <label>
            <div className={styles.label}>Organization</div>
            <select style={inputStyle} value={organizationId} onChange={e => setOrganizationId(e.target.value)}>
              <option value="">Select organization...</option>
              {orgs.map((o: any) => <option key={o.id} value={o.id}>{o.name || o.code}</option>)}
            </select>
          </label>
          <label>
            <div className={styles.label}>Recipient</div>
            <select style={inputStyle} value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="member">Member</option>
              <option value="resource">Resource / Trainer</option>
              <option value="branch">Branch Admin</option>
              <option value="system">System</option>
            </select>
          </label>
        </div>
      </div>

      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <div>
            <div className={styles.chartTitle}>Reminder Catalog</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>{visibleRows.length} reminder definitions</div>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 880 }}>
            <thead>
              <tr>{['Code', 'Reminder', 'Recipient', 'Channels', 'Frequency', 'Assigned'].map(h => <th key={h} style={{ textAlign: 'left', padding: '11px 10px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 12 }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {visibleRows.map((r: any) => (
                <tr key={r.reminder_catalog_id}>
                  <td style={{ padding: '12px 10px', borderBottom: '1px solid var(--border)', fontWeight: 800 }}>{r.reminder_code}</td>
                  <td style={{ padding: '12px 10px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <Bell size={17} color="var(--accent)" />
                      <div><strong>{r.title}</strong><div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 3 }}>{r.purpose}</div></div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 10px', borderBottom: '1px solid var(--border)', textTransform: 'capitalize' }}>{r.recipient_type}</td>
                  <td style={{ padding: '12px 10px', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{(r.channels || []).join(', ')}</td>
                  <td style={{ padding: '12px 10px', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{r.frequency || '-'}</td>
                  <td style={{ padding: '12px 10px', borderBottom: '1px solid var(--border)' }}>
                    <button className={r.assigned ? styles.secondaryBtn : styles.primaryBtn} onClick={() => toggle(r)} disabled={!organizationId}>
                      {r.assigned ? 'Unassign' : 'Assign'}
                    </button>
                  </td>
                </tr>
              ))}
              {!visibleRows.length && <tr><td colSpan={6} className={styles.emptyRow}>{organizationId ? 'No reminders found.' : 'Select an organization to manage reminders.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
