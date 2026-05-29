import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Calendar, CheckCircle2, Clock, Download, Eye, FileText, Mail, MoreVertical, RefreshCw, Trash2, X } from 'lucide-react';
import { api, getToken } from '../api';
import styles from './LogPage.module.css';
import BranchPerformanceReportView from './BranchPerformanceReportView';
import AdminJsonReportView from './AdminJsonReportView';

function today(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function fmtDate(value: string) {
  if (!value) return '';
  return new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(value: string) {
  if (!value) return '';
  return new Date(value).toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function reportIconColor(index: number) {
  return ['#8b5cf6', '#22c55e', '#f97316', '#ef4444', '#0ea5e9'][index % 5];
}

function isBranchPerformanceReport(report: any) {
  const key = String(report?.report_key || '').toLowerCase();
  const title = String(report?.title || '').toLowerCase();
  return key === 'branch_performance_dashboard' || key === 'branch_performance_analytics' || title.includes('branch performance');
}

const ADMIN_REPORT_FILES: Record<string, string> = {
  health_transformation: 'health_transformation',
  nutrition_diet_compliance: 'nutrition_diet_compliance',
  workout_performance: 'workout_performance',
  biomarker_blood_health: 'biomarker_blood_health',
  ai_health_insights: 'ai_health_insights',
  member_progress_overview: 'member_progress_overview',
  attendance_engagement: 'attendance_engagement',
  workout_plan_effectiveness: 'workout_plan_effectiveness',
  member_health_risk_alert: 'member_health_risk_alert',
  plateau_ai_analysis: 'plateau_ai_analysis',
  membership_growth: 'membership_growth',
  attendance_capacity_utilization: 'attendance_capacity_utilization',
  trainer_productivity: 'trainer_productivity',
  lead_conversion: 'lead_conversion',
  executive_business_dashboard: 'executive_business_dashboard',
  revenue_analytics: 'revenue_analytics',
  branch_performance_analytics: 'branch_performance_analytics',
  member_retention_churn: 'member_retention_churn',
  organization_health_risk: 'organization_health_risk',
};

function adminReportFile(report: any) {
  const key = String(report?.report_key || '').toLowerCase();
  return ADMIN_REPORT_FILES[key] || '';
}

function daysBetween(from: string, to: string) {
  if (!from || !to) return '';
  const start = new Date(from);
  const end = new Date(to);
  const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  return Number.isFinite(days) && days > 0 ? `${days} Days` : '';
}

function fmtSize(report: any) {
  const bytes = Number(report?.size_bytes || report?.file_size_bytes || 0);
  if (!bytes) return '-';
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

export default function MyReportsPage({ audience = 'user' }: { audience?: 'user' | 'admin' | 'resource' }) {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [reportKey, setReportKey] = useState('');
  const [dateFrom, setDateFrom] = useState(today(-14));
  const [dateTo, setDateTo] = useState(today());
  const [scheduleDays, setScheduleDays] = useState(7);
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [scheduleRangeDays, setScheduleRangeDays] = useState(14);
  const [scheduleEmail, setScheduleEmail] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [branchPerformanceOpen, setBranchPerformanceOpen] = useState(false);
  const [adminReportKeyOpen, setAdminReportKeyOpen] = useState('');
  const [adminReportPayloadOpen, setAdminReportPayloadOpen] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const selectedCatalog = useMemo(() => catalog.find(r => r.report_key === reportKey), [catalog, reportKey]);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const [cat, hist, sched] = await Promise.all([api.reports.catalog(audience), api.reports.list(audience), api.reports.schedules(audience)]);
      const nextCatalog = cat.reports || [];
      setCatalog(nextCatalog);
      setReports(hist.reports || []);
      setSchedules(sched.schedules || []);
      if (!reportKey && nextCatalog[0]) setReportKey(nextCatalog[0].report_key);
    } catch (e: any) {
      setMessage(e.message || 'Unable to load reports.');
    } finally {
      setLoading(false);
    }
  }, [audience, reportKey]);

  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    if (!reportKey) { setMessage('Select a report first.'); return; }
    if (!dateFrom || !dateTo) { setMessage('Select both dates.'); return; }
    setLoading(true);
    setMessage('');
    try {
      const created = await api.reports.generate({ reportKey, dateFrom, dateTo, type: audience });
      setSelected(created);
      setMessage(`${created.title} generated.`);
      await load();
    } catch (e: any) {
      setMessage(e.message || 'Unable to generate report.');
    } finally {
      setLoading(false);
    }
  };

  const createSchedule = async () => {
    if (!reportKey) { setMessage('Select a report first.'); return; }
    setLoading(true);
    setMessage('');
    try {
      await api.reports.schedule({
        reportKey,
        type: audience,
        dateRangeDays: Number(scheduleRangeDays),
        recurrenceDays: Number(scheduleDays),
        runTime: scheduleTime,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
        email: scheduleEmail,
      });
      setMessage('Report schedule saved.');
      await load();
    } catch (e: any) {
      setMessage(e.message || 'Unable to schedule report.');
    } finally {
      setLoading(false);
    }
  };

  const updateScheduleStatus = async (id: string, status: 'ACTIVE' | 'PAUSED') => {
    setLoading(true);
    try {
      await api.reports.updateScheduleStatus(id, status);
      await load();
    } catch (e: any) {
      setMessage(e.message || 'Unable to update schedule.');
    } finally {
      setLoading(false);
    }
  };

  const deleteSchedule = async (id: string) => {
    setLoading(true);
    try {
      await api.reports.deleteSchedule(id);
      await load();
    } catch (e: any) {
      setMessage(e.message || 'Unable to delete schedule.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async (report: any) => {
    try {
      const res = await fetch(api.reports.pdfUrl(report.id), {
        headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
      });
      if (!res.ok) throw new Error('Unable to download PDF.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(report.title || 'fitpulsebot-report').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setMessage(e.message || 'Unable to download PDF.');
    }
  };

  const sendEmail = async (report: any) => {
    setLoading(true);
    try {
      const res = await api.reports.email(report.id);
      setMessage(`Report sent to ${res.email}.`);
      await load();
    } catch (e: any) {
      setMessage(e.message || 'Unable to send report email.');
    } finally {
      setLoading(false);
    }
  };

  const metrics = selected?.payload?.metrics || [];
  const sections = selected?.payload?.sections || [];
  const latestReport = reports[0];
  const popularReports = catalog.slice(0, 7);
  const knownStorage = reports.reduce((sum: number, r: any) => sum + Number(r.size_bytes || r.file_size_bytes || 0), 0);
  const categories = Object.entries(catalog.reduce((acc: Record<string, any[]>, r: any) => {
    const group = r.category || r.type || 'Reports';
    acc[group] = [...(acc[group] || []), r];
    return acc;
  }, {}));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.pageTitle}>My Reports</h2>
          <p className={styles.pageDesc}>Generate and manage your reports.</p>
        </div>
        <button className={styles.refreshBtn} onClick={load} disabled={loading} title="Refresh">
          <RefreshCw size={16} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
        </button>
      </div>

      {message && <div className={styles.errorBanner} style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>{message}</div>}

      <div className={styles.responsiveStatsGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(160px, 1fr))', gap: 14, marginBottom: 18 }}>
        {[
          { label: 'Generated Reports', value: reports.length, sub: 'View all', icon: FileText, color: '#22c55e' },
          { label: 'Scheduled Reports', value: schedules.length, sub: 'View all', icon: Calendar, color: '#3b82f6' },
          { label: 'Last Generated', value: latestReport ? fmtDate(latestReport.created_at) : 'N/A', sub: latestReport?.title || 'No report yet', icon: Clock, color: '#8b5cf6' },
          { label: 'Storage Used', value: knownStorage ? fmtSize({ size_bytes: knownStorage }) : '-', sub: knownStorage ? 'from generated reports' : 'Not reported by API', icon: Activity, color: '#f59e0b' },
        ].map(card => <div key={card.label} className={styles.chartCard} style={{ display: 'flex', alignItems: 'center', gap: 16, minHeight: 104 }}>
          <div style={{ width: 58, height: 58, borderRadius: 12, background: `${card.color}22`, color: card.color, display: 'grid', placeItems: 'center' }}><card.icon size={27} /></div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 800 }}>{card.label}</div>
            <div style={{ fontSize: 25, fontWeight: 900, marginTop: 4 }}>{card.value}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>{card.sub}</div>
          </div>
        </div>)}
      </div>

      <div className={styles.chartCard} style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18 }}>
          <div style={{ width: 42, height: 42, borderRadius: 8, background: 'rgba(34,197,94,.14)', display: 'grid', placeItems: 'center', color: '#22c55e' }}><FileText size={21} /></div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Generate New Report</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Select a report type and date range to generate your personalized report.</div>
          </div>
        </div>
        <div className={styles.responsiveFormGrid} style={{ display: 'grid', gridTemplateColumns: 'minmax(240px,1.4fr) 1fr 1fr auto', gap: 14, alignItems: 'end' }}>
          <label style={{ display: 'grid', gap: 7, color: 'var(--text-secondary)', fontSize: 12 }}>
            Select Report
            <select className={styles.input} value={reportKey} onChange={e => setReportKey(e.target.value)}>
              {catalog.map(r => <option key={r.report_key} value={r.report_key}>{r.title}</option>)}
            </select>
          </label>
          <label style={{ display: 'grid', gap: 7, color: 'var(--text-secondary)', fontSize: 12 }}>
            Date From
            <div style={{ position: 'relative' }}><Calendar size={15} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--text-muted)' }} /><input className={styles.input} style={{ paddingLeft: 36 }} type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
          </label>
          <label style={{ display: 'grid', gap: 7, color: 'var(--text-secondary)', fontSize: 12 }}>
            Date To
            <div style={{ position: 'relative' }}><Calendar size={15} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--text-muted)' }} /><input className={styles.input} style={{ paddingLeft: 36 }} type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
          </label>
          <button className={styles.primaryBtn} onClick={generate} disabled={loading}><FileText size={15} /> Generate Report</button>
        </div>
        <div style={{ marginTop: 14, border: '1px solid rgba(59,130,246,.35)', background: 'rgba(59,130,246,.08)', color: '#7dd3fc', borderRadius: 8, padding: '11px 13px', fontSize: 13 }}>
          Reports are generated from data available in the selected date range. {selectedCatalog?.description || ''}
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 10 }}>Popular Reports</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {popularReports.map((r: any, i: number) => <button key={r.report_key} className={styles.secondaryBtn} onClick={() => setReportKey(r.report_key)} style={{ color: reportKey === r.report_key ? 'var(--accent)' : undefined, borderColor: reportKey === r.report_key ? 'var(--accent)' : undefined }}>
              <FileText size={14} color={reportIconColor(i)} /> {r.title}
            </button>)}
          </div>
        </div>
      </div>

      <div className={styles.responsiveReportShell} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(360px, .95fr)', gap: 16, alignItems: 'start' }}>
      <div>
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <div>
            <div className={styles.chartTitle}>Generated Reports</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>All reports generated by you</div>
          </div>
          <button className={styles.secondaryBtn}>View All</button>
        </div>
        <div className={styles.scrollTable}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr>{['Report Name', 'Date Range', 'Generated On', 'Size', 'Status', 'Actions'].map(h => <th key={h} style={{ textAlign: 'left', padding: '12px 10px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 12 }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {reports.map((r, i) => (
                <tr key={r.id}>
                  <td style={{ padding: '13px 10px', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ display: 'inline-grid', placeItems: 'center', width: 38, height: 38, borderRadius: '50%', background: reportIconColor(i), color: '#fff', flexShrink: 0 }}><FileText size={16} /></span>
                      <button onClick={() => {
                        const key = adminReportFile(r);
                        if (isBranchPerformanceReport(r) && r.report_key !== 'branch_performance_analytics') setBranchPerformanceOpen(true);
                        else if (key) { setAdminReportKeyOpen(key); setAdminReportPayloadOpen(r.payload || null); }
                        else setSelected(r);
                      }} style={{ color: 'inherit', font: 'inherit', fontWeight: 800, textAlign: 'left', padding: 0, background: 'transparent', border: 0, cursor: 'pointer' }}>
                        {r.title}
                        <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 500, marginTop: 3 }}>{r.description || r.report_type || r.type || 'Report'}</div>
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '13px 10px', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{fmtDate(r.date_from)} - {fmtDate(r.date_to)}<div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{daysBetween(r.date_from, r.date_to)}</div></td>
                  <td style={{ padding: '13px 10px', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{fmtDate(r.created_at)}<div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div></td>
                  <td style={{ padding: '13px 10px', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{fmtSize(r)}<div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{r.page_count ? `${r.page_count} pages` : '-'}</div></td>
                  <td style={{ padding: '13px 10px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 9px', borderRadius: 999, border: '1px solid rgba(34,197,94,.3)', background: 'rgba(34,197,94,.1)', color: '#22c55e', fontSize: 12, fontWeight: 800 }}>
                      {r.status || 'Initiated'}
                    </span>
                  </td>
                  <td style={{ padding: '13px 10px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: 7 }}>
                      <button className={styles.iconBtn || styles.secondaryBtn} onClick={() => setSelected(r)} title="View"><Eye size={14} /></button>
                      <button className={styles.iconBtn || styles.secondaryBtn} onClick={() => downloadPdf(r)} title="Download"><Download size={14} /></button>
                      <button className={styles.iconBtn || styles.secondaryBtn} onClick={() => sendEmail(r)} title="Email"><Mail size={14} /></button>
                      <button className={styles.iconBtn || styles.secondaryBtn} title="More"><MoreVertical size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!reports.length && <tr><td colSpan={6} className={styles.emptyRow}>No generated reports yet.</td></tr>}
            </tbody>
          </table>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 14 }}>Showing 1 to {Math.min(reports.length, 6)} of {reports.length} reports</div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 800, marginBottom: 4 }}>Report Categories</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 10 }}>Explore all available report categories</div>
        <div className={styles.responsiveFourCol} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
          {categories.map(([category, items], idx) => <div key={category} className={styles.chartCard} style={{ padding: 14 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}><span style={{ width: 38, height: 38, borderRadius: '50%', background: `${reportIconColor(idx)}22`, display: 'grid', placeItems: 'center', color: reportIconColor(idx) }}><FileText size={18} /></span><div><strong>{category}</strong><div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{(items as any[]).length} Reports</div></div></div>
            <ul style={{ margin: 0, paddingLeft: 16, color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.65 }}>{(items as any[]).slice(0, 5).map((item: any) => <li key={item.report_key}>{item.title}</li>)}</ul>
            <div style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 800, textAlign: 'right' }}>View All</div>
          </div>)}
          {!categories.length && <div className={styles.emptyRow}>No report catalog available.</div>}
        </div>
      </div>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div><div className={styles.chartTitle}>Scheduled Reports</div><div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>Automated recurring reports</div></div>
            <button className={styles.primaryBtn} onClick={createSchedule} disabled={loading}>+ Schedule New Report</button>
          </div>
          <div className={styles.responsiveTwoCol} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <input className={styles.input} type="number" min={1} max={365} value={scheduleDays} onChange={e => setScheduleDays(Number(e.target.value))} title="Recurring days" />
            <input className={styles.input} type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} />
            <input className={styles.input} type="number" min={1} max={365} value={scheduleRangeDays} onChange={e => setScheduleRangeDays(Number(e.target.value))} title="Window days" />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 12 }}><input type="checkbox" checked={scheduleEmail} onChange={e => setScheduleEmail(e.target.checked)} /> Email</label>
          </div>
          <div className={styles.scrollTable}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr>{['Report Name','Frequency','Window','Next Run','Email','Status',''].map(h => <th key={h} style={{ textAlign: 'left', padding: '9px 6px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>{h}</th>)}</tr></thead>
            <tbody>{schedules.slice(0, 4).map((s: any) => <tr key={s.id}>
              <td style={{ padding: '10px 6px', borderBottom: '1px solid var(--border)', fontWeight: 800 }}>{s.title}</td>
              <td style={{ padding: '10px 6px', borderBottom: '1px solid var(--border)' }}>{s.recurrence_days ? `Every ${s.recurrence_days}d` : '-'}</td>
              <td style={{ padding: '10px 6px', borderBottom: '1px solid var(--border)' }}>{s.date_range_days ? `${s.date_range_days} Days` : '-'}</td>
              <td style={{ padding: '10px 6px', borderBottom: '1px solid var(--border)' }}>{fmtDate(s.next_run_at)}<div style={{ color: 'var(--text-muted)' }}>{String(s.run_time || '').slice(0, 5)}</div></td>
              <td style={{ padding: '10px 6px', borderBottom: '1px solid var(--border)' }}><CheckCircle2 size={18} color={(s.delivery_channels || {}).email ? '#22c55e' : 'var(--text-muted)'} /></td>
              <td style={{ padding: '10px 6px', borderBottom: '1px solid var(--border)', color: '#22c55e', fontWeight: 800 }}>{s.status}</td>
              <td style={{ padding: '10px 6px', borderBottom: '1px solid var(--border)' }}><button className={styles.iconBtn || styles.secondaryBtn} onClick={() => updateScheduleStatus(s.id, s.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE')}><MoreVertical size={14} /></button></td>
            </tr>)}
            {!schedules.length && <tr><td colSpan={7} className={styles.emptyRow}>No scheduled reports yet.</td></tr>}</tbody>
          </table>
          </div>
          {schedules.length > 0 && <button className={styles.secondaryBtn} style={{ marginTop: 10 }} onClick={() => deleteSchedule(schedules[0].id)}><Trash2 size={14} /> Delete Latest Schedule</button>}
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}><div><div className={styles.chartTitle}>Recent Activity</div><div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>See what's happening</div></div><button className={styles.secondaryBtn}>View All</button></div>
          <div style={{ display: 'grid', gap: 12 }}>
            {reports.slice(0, 4).map((r: any, i: number) => <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: 10, alignItems: 'start' }}>
              <span style={{ width: 26, height: 26, borderRadius: '50%', background: reportIconColor(i), display: 'grid', placeItems: 'center', color: '#fff' }}><CheckCircle2 size={15} /></span>
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10 }}><strong style={{ fontSize: 13 }}>{r.title} report requested</strong><div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 3 }}>{fmtDateTime(r.created_at)} · {r.status || 'Initiated'}</div></div>
            </div>)}
            {!reports.length && <div className={styles.emptyRow}>No recent activity yet.</div>}
          </div>
        </div>
      </div>
      </div>

      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(5px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setSelected(null)}>
          <div className={styles.chartCard} style={{ width: 'min(760px, 96vw)', maxHeight: '88vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className={styles.chartHeader}>
              <div>
                <div className={styles.pageTitle} style={{ fontSize: 20 }}>{selected.title}</div>
                <div className={styles.pageDesc}>{fmtDate(selected.date_from)} - {fmtDate(selected.date_to)}</div>
              </div>
              <button className={styles.iconBtn || styles.refreshBtn} onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            <div className={styles.summaryRow} style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))' }}>
              {metrics.map((m: any) => (
                <div key={m.label} className={styles.sumCard}>
                  <div className={styles.sumLabel}>{m.label}</div>
                  <div className={styles.sumValue}>{m.value}<span className={styles.sumUnit}> {m.unit || ''}</span></div>
                </div>
              ))}
            </div>
            {sections.map((s: any) => (
              <div key={s.title} style={{ marginTop: 16 }}>
                <div className={styles.chartTitle}>{s.title}</div>
                <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  {(s.items || []).map((item: string, idx: number) => <li key={idx}>{item}</li>)}
                </ul>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button className={styles.secondaryBtn} style={{ color: '#f87171' }} onClick={() => downloadPdf(selected)}><Download size={15} /> Download PDF</button>
              <button className={styles.secondaryBtn} style={{ color: '#38bdf8' }} onClick={() => sendEmail(selected)}><Mail size={15} /> Send as Email</button>
            </div>
          </div>
        </div>
      )}

      {branchPerformanceOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: '#061225', overflow: 'auto' }}>
          <BranchPerformanceReportView onClose={() => setBranchPerformanceOpen(false)} />
        </div>
      )}

      {adminReportKeyOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: '#061225', overflow: 'auto' }}>
          <AdminJsonReportView
            reportKey={adminReportKeyOpen}
            audience={audience}
            initialData={adminReportPayloadOpen}
            onClose={() => { setAdminReportKeyOpen(''); setAdminReportPayloadOpen(null); }}
          />
        </div>
      )}
    </div>
  );
}
