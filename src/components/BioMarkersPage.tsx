import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarCheck, Download, Eye, FileText, Plus, RefreshCw, Trash2, UploadCloud } from 'lucide-react';
import { api } from '../api';
import styles from './LogPage.module.css';

const panel: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-xl)',
  padding: 18,
  boxShadow: 'var(--shadow-sm)',
};
const labelStyle: React.CSSProperties = { fontSize: 12, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em' };
const inputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 40,
  padding: '0 12px',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--bg-input)',
  color: 'var(--text-primary)',
};
const statusColors: Record<string, string> = {
  Normal: '#61d13c',
  Borderline: '#f6b31c',
  High: '#ef4444',
  Low: '#3b82f6',
  Critical: '#b91c1c',
  Good: '#61d13c',
  Average: '#f6b31c',
  'Needs Attention': '#ef4444',
};

function safeDate(value?: string) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function statusBadge(status?: string) {
  const color = statusColors[status || ''] || 'var(--accent)';
  return <span style={{ color, background: `${color}22`, border: `1px solid ${color}33`, borderRadius: 6, padding: '4px 8px', fontSize: 12, fontWeight: 800 }}>{status || 'Review'}</span>;
}

export default function BioMarkersPage({ memberId, readOnly = false }: { memberId?: string; readOnly?: boolean } = {}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ reportType: 'Blood', labName: '', reportDate: new Date().toISOString().slice(0, 10) });
  const [file, setFile] = useState<File | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const request = memberId ? api.biomarkers.getForTrainerMember(memberId) : api.biomarkers.get();
    request
      .then(setData)
      .catch((e: any) => setError(e.message || 'Unable to load biomarkers.'))
      .finally(() => setLoading(false));
  }, [memberId]);

  useEffect(load, [load]);

  const latest = data?.latestReport;
  const previous = data?.previousReport;
  const latestValues = data?.latestValues || [];
  const reports = data?.reports || [];
  const summary = data?.summary || {};
  const comparison = (data?.comparison || []).filter((c: any) => c.latest !== null || c.previous !== null).slice(0, 6);
  const nextTestDate = useMemo(() => {
    if (!latest?.report_date && !latest?.created_at) return '-';
    const d = new Date(latest.report_date || latest.created_at);
    d.setMonth(d.getMonth() + 3);
    return safeDate(d.toISOString());
  }, [latest]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError('Choose a report image or PDF first.'); return; }
    setSaving(true); setError('');
    try {
      const result = await api.biomarkers.upload({ ...form, file });
      setData(result);
      setFile(null);
    } catch (err: any) {
      setError(err.message || 'Upload failed.');
    } finally {
      setSaving(false);
    }
  };

  const deleteReport = async (id: string) => {
    if (!window.confirm('Delete this report and extracted values?')) return;
    await api.biomarkers.deleteReport(id);
    load();
  };

  const insights = latest?.insights || [];
  const recommendations = latest?.recommendations || [];
  const score = Number(latest?.health_score || 0);
  const scoreColor = score >= 90 ? '#61d13c' : score >= 75 ? '#3dbf96' : score >= 60 ? '#f6b31c' : score >= 40 ? '#fb923c' : '#ef4444';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, color: 'var(--text-primary)' }}>
      {saving && <ReportUploadOverlay />}
      {!readOnly && <form onSubmit={submit} className={styles.responsiveFormGrid} style={{ ...panel, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(160px, 1fr)) auto', gap: 12, alignItems: 'end' }}>
        <div style={{ display: 'grid', gap: 7 }}>
          <span style={labelStyle}>Report Type</span>
          <select style={inputStyle} value={form.reportType} onChange={e => setForm({ ...form, reportType: e.target.value })}>
            {['Blood', 'Urine', 'CBC', 'Lipid Profile', 'Thyroid', 'Liver Function', 'Kidney Function', 'Diabetes', 'Vitamins', 'Hormones'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gap: 7 }}>
          <span style={labelStyle}>Lab Name</span>
          <input style={inputStyle} value={form.labName} onChange={e => setForm({ ...form, labName: e.target.value })} placeholder="Thyrocare, Dr Lal..." />
        </div>
        <div style={{ display: 'grid', gap: 7 }}>
          <span style={labelStyle}>Report Date</span>
          <input style={inputStyle} type="date" value={form.reportDate} onChange={e => setForm({ ...form, reportDate: e.target.value })} />
        </div>
        <div style={{ display: 'grid', gap: 7 }}>
          <span style={labelStyle}>Report File</span>
          <input style={{ ...inputStyle, paddingTop: 8 }} type="file" accept="image/*,.pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
        </div>
        <button disabled={saving} style={{ minHeight: 40, padding: '0 16px', borderRadius: 'var(--radius-md)', background: 'var(--accent)', color: '#fff', fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {saving ? <RefreshCw size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <UploadCloud size={16} />} {saving ? 'Analyzing' : 'Upload'}
        </button>
        {error && <div style={{ gridColumn: '1 / -1', color: 'var(--danger)', fontWeight: 800 }}>{error}</div>}
      </form>}

      {loading ? <div style={panel}>Loading BioMarkers...</div> : (
        <>
          <div className={styles.responsiveFourCol} style={{ display: 'grid', gridTemplateColumns: '1.5fr .8fr 2fr .9fr', gap: 14 }}>
            <div style={panel}>
              <h3 style={{ margin: '0 0 18px', fontSize: 18 }}>{latest?.report_type || 'Blood'} Report Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {['Normal', 'Borderline', 'High', 'Low', 'Critical'].map(s => <div key={s} style={{ padding: 16, border: `1px solid ${(statusColors[s] || '#999')}33`, borderRadius: 8, background: `${statusColors[s]}14` }}>
                  <div style={{ color: statusColors[s], fontWeight: 900 }}>{s}</div>
                  <div style={{ fontSize: 26, fontWeight: 900 }}>{summary[s] || 0}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Markers</div>
                </div>)}
              </div>
            </div>
            <div style={{ ...panel, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 8%, ${scoreColor}20, transparent 58%)`, pointerEvents: 'none' }} />
              <h3 style={{ margin: '0 0 18px', fontSize: 18, position: 'relative' }}>Overall Health Score</h3>
              <div style={{ width: 154, height: 154, margin: '0 auto 14px', borderRadius: '50%', display: 'grid', placeItems: 'center', background: `conic-gradient(${scoreColor} ${score * 3.6}deg, rgba(148,163,184,0.18) 0deg)`, boxShadow: `0 0 34px ${scoreColor}22`, position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 10, borderRadius: '50%', background: 'linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0))' }} />
                <div style={{ width: 112, height: 112, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                  <strong style={{ fontSize: 42, fontWeight: 950, color: scoreColor, letterSpacing: 0 }}>{score}</strong>
                  <span style={{ marginTop: 5, fontSize: 13, color: 'var(--text-muted)', fontWeight: 800 }}>/100</span>
                </div>
              </div>
              <div style={{ position: 'relative', display: 'grid', gap: 9, justifyItems: 'center' }}>
                {statusBadge(latest?.status || 'No Report')}
                {latest?.health_summary && <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.45, maxWidth: 220 }}>{latest.health_summary}</p>}
              </div>
            </div>
            <div style={panel}>
              <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>Report Comparison</h3>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12, color: 'var(--text-muted)', fontSize: 12 }}>
                <span><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 99, background: 'var(--text-muted)', marginRight: 6 }} />Previous {previous ? `(${safeDate(previous.report_date || previous.created_at)})` : ''}</span>
                <span><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 99, background: 'var(--accent)', marginRight: 6 }} />Latest {latest ? `(${safeDate(latest.report_date || latest.created_at)})` : ''}</span>
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
                {comparison.length ? comparison.map((c: any) => {
                  const max = Math.max(Number(c.latest || 0), Number(c.previous || 0), 1);
                  return <div key={c.parameter} className={styles.responsiveThreeCol} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 80px', gap: 10, alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{c.parameter}</span>
                    <div style={{ display: 'grid', gap: 4 }}>
                      <div style={{ width: c.previous == null ? 0 : `${Math.max(4, Number(c.previous || 0) / max * 100)}%`, height: 10, background: 'var(--text-muted)', borderRadius: 99 }} />
                      <div style={{ width: `${Math.max(4, Number(c.latest || 0) / max * 100)}%`, height: 10, background: 'var(--accent)', borderRadius: 99 }} />
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'right' }}>{c.previous ?? '-'} {'->'} {c.latest} {c.unit || ''}</span>
                  </div>;
                }) : <div style={{ color: 'var(--text-muted)' }}>Upload at least two reports with numeric values to compare trends.</div>}
              </div>
            </div>
            <div style={panel}>
              <h3 style={{ margin: '0 0 18px', fontSize: 18 }}>Next Recommended Test</h3>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 22 }}>
                <CalendarCheck color="var(--accent)" />
                <div><div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Suggested Date</div><strong>{nextTestDate}</strong></div>
              </div>
              <button style={{ width: '100%', minHeight: 40, borderRadius: 8, background: 'var(--accent-light)', color: 'var(--accent)', fontWeight: 900 }}>Set Reminder</button>
            </div>
          </div>

          <div className={styles.responsiveTwoCol} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14 }}>
            <div style={panel}>
              <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>All Reports</h3>
              <div className={styles.scrollTable}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead><tr>{['Report Date', 'Lab Name', 'Report File', 'Health Score', 'Status', 'Action'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 8px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {reports.map((r: any) => <tr key={r.id}>
                      <td style={{ padding: 8, borderBottom: '1px solid var(--border)' }}>{safeDate(r.report_date || r.created_at)}</td>
                      <td style={{ padding: 8, borderBottom: '1px solid var(--border)' }}>{r.lab_name || '-'}</td>
                      <td style={{ padding: 8, borderBottom: '1px solid var(--border)', color: 'var(--accent)' }}><FileText size={14} /> {r.file_name || 'Report'}</td>
                      <td style={{ padding: 8, borderBottom: '1px solid var(--border)' }}><strong style={{ color: 'var(--success)' }}>{r.health_score || 0}</strong> / 100</td>
                      <td style={{ padding: 8, borderBottom: '1px solid var(--border)' }}>{statusBadge(r.status)}</td>
                      <td style={{ padding: 8, borderBottom: '1px solid var(--border)' }}>
                        <button title="View" style={{ color: 'var(--accent)', marginRight: 8 }}><Eye size={15} /></button>
                        <button title="Download" style={{ color: 'var(--accent)', marginRight: 8 }}><Download size={15} /></button>
                        {!readOnly && <button title="Delete" onClick={() => deleteReport(r.id)} style={{ color: 'var(--danger)' }}><Trash2 size={15} /></button>}
                      </td>
                    </tr>)}
                    {!reports.length && <tr><td colSpan={6} style={{ padding: 24, color: 'var(--text-muted)', textAlign: 'center' }}>No biomarker reports uploaded yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={panel}>
              <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>Latest Report Highlights</h3>
              <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>Report Date: {safeDate(latest?.report_date || latest?.created_at)} {latest?.lab_name ? `- Lab: ${latest.lab_name}` : ''}</div>
              <div className={styles.scrollTable}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead><tr>{['Parameter', 'Result', 'Reference Range', 'Status', 'Insight'].map(h => <th key={h} style={{ textAlign: 'left', padding: '9px 6px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{h}</th>)}</tr></thead>
                  <tbody>{latestValues.map((v: any) => <tr key={v.id}>
                    <td style={{ padding: 6, borderBottom: '1px solid var(--border)' }}>{v.parameter_name}</td>
                    <td style={{ padding: 6, borderBottom: '1px solid var(--border)' }}>{v.value ?? v.value_text ?? '-'} {v.unit || ''}</td>
                    <td style={{ padding: 6, borderBottom: '1px solid var(--border)' }}>{v.reference_range || '-'}</td>
                    <td style={{ padding: 6, borderBottom: '1px solid var(--border)' }}>{statusBadge(v.status)}</td>
                    <td style={{ padding: 6, borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{v.short_insight || v.recommended_action || '-'}</td>
                  </tr>)}</tbody>
                </table>
              </div>
            </div>
          </div>

          <div className={styles.responsiveThreeCol} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <InfoList title="Insights" items={insights} icon={<AlertTriangle size={16} color="var(--success)" />} />
            <InfoList title="Recommendations" items={recommendations} icon={<Plus size={16} color="var(--success)" />} />
            <InfoList title="Trainer Insights" items={latest?.trainer_friendly_insights || []} icon={<FileText size={16} color="var(--accent)" />} />
          </div>
          <div className={styles.responsiveThreeCol} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <InfoList title="Critical Findings" items={(latest?.critical_findings || []).map((f: any) => `${f.name}: ${f.value}${f.referenceRange ? ` (${f.referenceRange})` : ''} - ${f.reason || f.status}`)} icon={<AlertTriangle size={16} color="var(--danger)" />} />
            <InfoList title="Follow-Up Tests" items={(latest?.follow_up_tests || []).map((f: any) => `${f.test}: ${f.reason}`)} icon={<CalendarCheck size={16} color="var(--accent)" />} />
            <InfoList title="AI Feedback" items={[latest?.health_summary, latest?.doctor_review_suggested ? 'Doctor review is suggested for this report.' : '', latest?.ai_feedback].filter(Boolean)} icon={<FileText size={16} color="var(--accent)" />} />
          </div>
        </>
      )}
    </div>
  );
}

function InfoList({ title, items, icon }: { title: string; items: string[]; icon: React.ReactNode }) {
  return <div style={panel}>
    <h3 style={{ margin: '0 0 14px', fontSize: 18 }}>{title}</h3>
    <div style={{ display: 'grid', gap: 10 }}>
      {items.length ? items.map((item, i) => <div key={i} style={{ display: 'flex', gap: 10, color: 'var(--text-secondary)', lineHeight: 1.45 }}>{icon}<span>{item}</span></div>) : <div style={{ color: 'var(--text-muted)' }}>No saved information yet.</div>}
    </div>
  </div>;
}

function ReportUploadOverlay() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading report"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        background: 'rgba(3, 10, 20, 0.58)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        color: 'var(--text-muted)',
        textAlign: 'center',
      }}
    >
      <div style={{ position: 'relative', width: 168, height: 168, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: -10, borderRadius: 36, background: 'rgba(61,191,150,0.08)', border: '1px solid rgba(91,200,224,0.18)' }} />
        <img
          src="/coach.png"
          alt="FitPulseBot"
          style={{ width: 152, height: 152, objectFit: 'cover', borderRadius: 32, border: '2px solid rgba(61,191,150,0.35)', boxShadow: '0 16px 44px rgba(61,191,150,0.22)', position: 'relative', zIndex: 1 }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--brand-teal)', fontSize: 20, fontWeight: 800 }}>
        <RefreshCw size={20} style={{ animation: 'spin 0.8s linear infinite' }} /> Loading report...
      </div>
      <div style={{ maxWidth: 360, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5 }}>
        Extracting biomarkers, insights, recommendations, and AI feedback from your report.
      </div>
    </div>
  );
}
