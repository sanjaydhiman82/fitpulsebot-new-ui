import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell, Calendar, CheckCircle2, Download, Filter, Home, Menu, Users,
  ClipboardList, X, Star, UserCheck,
} from 'lucide-react';
import { api } from '../api';
import styles from './LogPage.module.css';

const card = {
  background: 'linear-gradient(180deg, rgba(15,34,66,.96), rgba(8,22,45,.96))',
  border: '1px solid rgba(83,119,177,.35)',
  borderRadius: 12,
  boxShadow: '0 16px 40px rgba(0,0,0,.22)',
};

function displayValue(value: any): React.ReactNode {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value.label) return String(value.label);
  if (value.from || value.to) return [value.from, value.to].filter(Boolean).join(' - ');
  return JSON.stringify(value);
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const pts = values.map((v, i) => `${(i / Math.max(values.length - 1, 1)) * 100},${34 - ((v - min) / Math.max(max - min, 1)) * 28}`).join(' ');
  return <svg viewBox="0 0 100 36" style={{ width: '100%', height: 38 }}><polyline points={pts} fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function LineChart({ points, color = '#22c55e' }: { points: any[]; color?: string }) {
  const values = points.map(p => Number(p.value ?? p));
  if (!values.length) return <div style={{ height: 210, display: 'grid', placeItems: 'center', color: '#9fb4d1' }}>No chart data available</div>;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const pts = values.map((v, i) => `${30 + (i / Math.max(values.length - 1, 1)) * 520},${180 - ((v - min) / Math.max(max - min, 1)) * 140}`).join(' ');
  const fillPts = `30,190 ${pts} 550,190`;
  return (
    <svg viewBox="0 0 580 210" style={{ width: '100%', height: 210 }}>
      {[0, 1, 2, 3, 4].map(i => <line key={i} x1="30" x2="550" y1={40 + i * 35} y2={40 + i * 35} stroke="rgba(148,163,184,.18)" />)}
      <polygon points={fillPts} fill={color} opacity=".16" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      {values.map((_, i) => i % 2 === 0 && <text key={i} x={30 + (i / Math.max(values.length - 1, 1)) * 520} y="205" fill="#9fb4d1" fontSize="12" textAnchor="middle">{points[i].label || ''}</text>)}
    </svg>
  );
}

function Donut({ total, segments }: { total: string; segments: any[] }) {
  let offset = 25;
  const circumference = 2 * Math.PI * 42;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 18, alignItems: 'center' }}>
      <div style={{ position: 'relative', width: 150, height: 150 }}>
        <svg viewBox="0 0 100 100" style={{ width: 150, height: 150, transform: 'rotate(-90deg)' }}>
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(148,163,184,.18)" strokeWidth="12" />
          {segments.map(seg => {
            const len = circumference * (Number(seg.percent) / 100 || Number(String(seg.percent).replace('%', '')) / 100);
            const node = <circle key={seg.label} cx="50" cy="50" r="42" fill="none" stroke={seg.color} strokeWidth="12" strokeDasharray={`${len} ${circumference}`} strokeDashoffset={-offset} />;
            offset += len;
            return node;
          })}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
          <div><div style={{ color: '#9fb4d1', fontSize: 12 }}>Total</div><div style={{ fontSize: 25, fontWeight: 900 }}>{total}</div></div>
        </div>
      </div>
      <div style={{ display: 'grid', gap: 9 }}>
        {segments.map(s => <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13 }}><span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: s.color, marginRight: 8 }} />{s.label}</span><strong>{s.value} {s.percent && `(${s.percent})`}</strong></div>)}
      </div>
    </div>
  );
}

function Gauge({ item }: { item: any }) {
  const pct = Math.max(0, Math.min(100, Number(item.percent)));
  return (
    <div style={{ ...card, padding: 18 }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>{item.label}</h3>
      <div style={{ position: 'relative', width: 190, height: 105, margin: '0 auto' }}>
        <svg viewBox="0 0 200 110" style={{ width: 190 }}>
          <path d="M25 95 A75 75 0 0 1 175 95" fill="none" stroke="rgba(148,163,184,.2)" strokeWidth="16" />
          <path d="M25 95 A75 75 0 0 1 175 95" fill="none" stroke={item.color} strokeWidth="16" strokeDasharray={`${pct * 2.35} 235`} strokeLinecap="round" />
        </svg>
        <div style={{ position: 'absolute', inset: '34px 0 0', textAlign: 'center' }}><div style={{ fontSize: 30, fontWeight: 900 }}>{pct}%</div><div>{item.status}</div></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 12 }}>
        <div style={{ border: `1px solid ${item.color}66`, background: `${item.color}18`, borderRadius: 8, padding: 12, textAlign: 'center' }}><div>{item.status}</div><strong style={{ fontSize: 22 }}>{item.completed}</strong></div>
        <div style={{ border: '1px solid rgba(59,130,246,.35)', background: 'rgba(59,130,246,.12)', borderRadius: 8, padding: 12, textAlign: 'center' }}><div>Assigned</div><strong style={{ fontSize: 22 }}>{item.assigned}</strong></div>
      </div>
    </div>
  );
}

export default function BranchPerformanceReportView({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    setError('');
    api.reports.render('branch_performance_dashboard', 'admin')
      .then((res: any) => setData(res.payload || res))
      .catch((e: any) => setError(e.message || 'Unable to load report.'));
  }, []);
  const grid = useMemo(() => ({ display: 'grid', gap: 14 }), []);
  if (error) return <div style={{ padding: 40, color: '#fff' }}><button onClick={onClose} style={topBtn}><X size={18} />Back</button><div style={{ marginTop: 18, color: '#fca5a5' }}>{error}</div></div>;
  if (!data) return <div style={{ padding: 40, color: '#fff' }}>Loading report...</div>;
  const isGenericLive = !data.branchAdmin || !data.revenueTrend;
  if (isGenericLive) {
    return (
      <div style={{ background: '#061225', color: '#f8fbff', minHeight: '100%', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <main style={{ padding: 22, paddingTop: 86 }}>
          <header className={styles.responsiveReportHeader} style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 3, minHeight: 70, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, padding: '10px 22px', background: 'rgba(6,18,37,.98)', borderBottom: '1px solid rgba(83,119,177,.32)', backdropFilter: 'blur(12px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
              <button onClick={onClose} style={{ ...topBtn, flexShrink: 0 }}><X size={18} />Back</button>
              <Menu style={{ flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <h1 style={{ margin: 0, fontSize: 28, whiteSpace: 'normal', lineHeight: 1.12 }}>{displayValue(data.title)}</h1>
                <div style={{ color: '#9fb4d1', fontSize: 13 }}>{displayValue(data.subtitle)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, flexWrap: 'wrap' }}><button style={topBtn}><Calendar size={16} />{displayValue(data.dateRange)}</button><button style={{ ...topBtn, background: '#7c3aed', borderColor: '#7c3aed', color: '#fff' }}><Download size={16} />Export PDF</button></div>
          </header>
          <section className={styles.responsiveStatsGrid} style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min((data.kpis || []).length || 1, 5)}, minmax(160px, 1fr))`, gap: 14, marginBottom: 14 }}>
            {(data.kpis || []).map((k: any) => <div key={k.label} style={{ ...card, padding: 16 }}><div style={{ fontSize: 12, fontWeight: 800, color: '#9fb4d1' }}>{displayValue(k.label)}</div><div style={{ fontSize: 28, fontWeight: 900, marginTop: 8 }}>{displayValue(k.value)} {displayValue(k.unit)}</div></div>)}
          </section>
          <section className={styles.responsiveTwoCol} style={{ ...grid, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            {(data.charts || []).map((chart: any) => <div key={chart.title} style={{ ...card, padding: 18 }}><h3>{displayValue(chart.title)}</h3>{chart.type === 'bar' ? <div style={{ display: 'grid', gap: 10 }}>{(chart.bars || []).map((b: any) => <div key={b.label} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 60px', gap: 10, alignItems: 'center' }}><span>{displayValue(b.label)}</span><span style={{ height: 10, borderRadius: 999, background: '#183456', overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: `${Math.min(Number(b.value) || 0, 100)}%`, background: chart.color || '#8b5cf6' }} /></span><strong>{displayValue(b.value)}</strong></div>)}</div> : <LineChart points={chart.points || []} color={chart.color || '#22c55e'} />}</div>)}
            {(data.tables || []).map((t: any) => <div key={t.title} style={{ ...card, padding: 18 }}><h3>{displayValue(t.title)}</h3><div className={styles.scrollTable}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}><thead><tr>{(t.columns || []).map((c: any) => <th key={String(c)} style={{ textAlign: 'left', color: '#9fb4d1', padding: '8px 6px', borderBottom: '1px solid rgba(148,163,184,.2)' }}>{displayValue(c)}</th>)}</tr></thead><tbody>{(t.rows || []).map((r: any[], idx: number) => <tr key={idx}>{r.map((cell, i) => <td key={i} style={{ padding: '8px 6px', borderBottom: '1px solid rgba(148,163,184,.12)' }}>{displayValue(cell)}</td>)}</tr>)}</tbody></table></div></div>)}
          </section>
          <section style={{ ...card, padding: 18, marginTop: 14 }}>
            <h3>Recommended Actions</h3>
            <div className={styles.responsiveTwoCol} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>{(data.recommendedActions || []).map((a: any) => <div key={String(a)}><CheckCircle2 size={15} color="#86efac" /> {displayValue(a)}</div>)}</div>
          </section>
        </main>
      </div>
    );
  }
  return (
    <div style={{ background: '#061225', color: '#f8fbff', minHeight: '100%', fontFamily: 'Inter, system-ui, sans-serif', display: 'grid', gridTemplateColumns: '1fr' }}>
      <aside style={{ display: 'none', borderRight: '1px solid rgba(83,119,177,.28)', padding: 20, background: 'linear-gradient(180deg,#07182f,#071224)', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}><div style={{ width: 42, height: 42, borderRadius: 12, background: '#12d47b', display: 'grid', placeItems: 'center', color: '#062015' }}><Home /></div><div><div style={{ fontSize: 22, fontWeight: 900 }}>FitPulseBot</div><div style={{ color: '#9fb4d1', fontSize: 12 }}>Your Health, Our Priority</div></div></div>
        <div style={{ ...card, padding: 14, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}><div style={{ width: 58, height: 58, borderRadius: '50%', background: '#1d355b' }} /><div><strong>{data.branchAdmin.name}</strong><div style={{ color: '#22c55e', fontSize: 12, fontWeight: 800 }}>{data.branchAdmin.role}</div></div></div>
        {['Dashboard', 'Clients', 'Attendance', 'Memberships', 'Payments', 'Resources', 'Workouts', 'Diet Plans', 'Reports'].map((n, i) => <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 10, color: n === 'Reports' ? '#22c55e' : '#d9e6f7', background: n === 'Reports' ? 'rgba(34,197,94,.12)' : 'transparent', fontWeight: 800 }}><Users size={17} />{n}</div>)}
      </aside>
      <main style={{ padding: 22, paddingTop: 86 }}>
        <header className={styles.responsiveReportHeader} style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 3, minHeight: 70, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, padding: '10px 22px', background: 'rgba(6,18,37,.98)', borderBottom: '1px solid rgba(83,119,177,.32)', backdropFilter: 'blur(12px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
            <button onClick={onClose} style={{ ...topBtn, flexShrink: 0 }}><X size={18} />Back</button>
            <Menu style={{ flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <h1 style={{ margin: 0, fontSize: 28, whiteSpace: 'normal', lineHeight: 1.12 }}>{data.title}</h1>
              <div style={{ color: '#9fb4d1', fontSize: 13 }}>{data.subtitle}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, flexWrap: 'wrap' }}><button style={topBtn}><Calendar size={16} />{displayValue(data.dateRange)}</button><button style={topBtn}><Filter size={16} />Filter</button><button style={{ ...topBtn, background: '#7c3aed', borderColor: '#7c3aed', color: '#fff' }}><Download size={16} />Export PDF</button><Bell /></div>
        </header>
        <section className={styles.responsiveStatsGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14, marginBottom: 14 }}>
          {data.kpis.map((k: any) => <div key={k.label} style={{ ...card, padding: 16 }}><div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><div style={{ width: 48, height: 48, borderRadius: 12, background: `${k.color || '#22c55e'}33`, color: k.color || '#22c55e', display: 'grid', placeItems: 'center' }}><UserCheck /></div><div><div style={{ fontSize: 12, fontWeight: 800 }}>{displayValue(k.label)}</div><div style={{ fontSize: 25, fontWeight: 900 }}>{displayValue(k.value)} {displayValue(k.unit)}</div><div style={{ color: '#22c55e', fontSize: 12 }}>{k.change ? `↑ ${displayValue(k.change)}` : ''} <span style={{ color: '#d9e6f7' }}>{displayValue(k.changeLabel)}</span></div></div></div><Sparkline values={k.series || [1,2,3]} color={k.color || '#22c55e'} /></div>)}
        </section>
        <section className={styles.responsiveFourCol} style={{ ...grid, gridTemplateColumns: '1.45fr 1.25fr 1fr 1fr' }}>
          <div style={{ ...card, padding: 18 }}><h3>Revenue Trend</h3><div style={{ fontSize: 28, fontWeight: 900 }}>{data.revenueTrend.total} <span style={{ color: '#22c55e', fontSize: 15 }}>↑ {data.revenueTrend.change}</span></div><LineChart points={data.revenueTrend.points} /></div>
          <div style={{ ...card, padding: 18 }}><h3>Clientship Growth</h3><div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.membershipGrowth.length}, 1fr)`, gap: 18, alignItems: 'end', height: 220 }}>{data.membershipGrowth.map((g: any) => <div key={g.label} style={{ textAlign: 'center' }}><div style={{ height: g.newMembers, background: '#22c55e', borderRadius: 8 }} /><div style={{ height: g.expiredMembers * 3, background: '#f43f5e', borderRadius: 8, marginTop: 6 }} /><div style={{ color: '#9fb4d1', fontSize: 12, marginTop: 8 }}>{g.label}</div></div>)}</div></div>
          <div style={{ ...card, padding: 18 }}><h3>Client Status Distribution</h3><Donut total={data.memberStatus.total} segments={data.memberStatus.segments} /></div>
          <div style={{ ...card, padding: 18 }}><h3>Revenue by Category</h3><Donut total={data.revenueByCategory.total} segments={data.revenueByCategory.segments} /></div>
        </section>
        <section className={styles.responsiveFourCol} style={{ ...grid, gridTemplateColumns: '1.4fr 1.35fr 1fr 1fr', marginTop: 14 }}>
          <div style={{ ...card, padding: 18 }}><h3>Attendance Trend</h3><div style={{ color: '#9fb4d1' }}>Average Attendance <strong style={{ color: '#fff', fontSize: 24 }}>{data.attendanceTrend.average}</strong> <span style={{ color: '#22c55e' }}>↑ {data.attendanceTrend.change}</span></div><LineChart points={data.attendanceTrend.points} color="#2490ff" /></div>
          <div style={{ ...card, padding: 18 }}><h3>Top Performing Resources</h3>{data.topResources.map((t: any) => <div key={t.name} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 90px 60px', borderBottom: '1px solid rgba(148,163,184,.14)', padding: '8px 0', fontSize: 13 }}><strong>{t.name}</strong><span>{t.sessions}</span><span>{t.assignedMembers}</span><span style={{ color: '#f59e0b' }}><Star size={13} fill="#f59e0b" /> {t.rating}</span></div>)}</div>
          {data.compliance.map((c: any) => <Gauge key={c.label} item={c} />)}
        </section>
        <section className={styles.responsiveThreeCol} style={{ ...grid, gridTemplateColumns: '1.45fr .75fr 1.85fr', marginTop: 14 }}>
          <div style={{ ...card, padding: 18 }}><h3>Recent Payments</h3>{data.recentPayments.map((p: any) => <div key={`${p.client}${p.paymentDate}`} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr 1.3fr 70px 70px', gap: 8, padding: '7px 0', borderBottom: '1px solid rgba(148,163,184,.12)', fontSize: 12 }}><strong>{p.client}</strong><span>{p.amount}</span><span>{p.category}</span><span>{p.paymentDate}</span><span>{p.method}</span><span style={{ color: '#22c55e', fontWeight: 800 }}>{p.status}</span></div>)}</div>
          <div style={{ ...card, padding: 18 }}><h3>Pending Tasks</h3>{data.pendingTasks.map((t: any) => <div key={t.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid rgba(148,163,184,.12)' }}><span><ClipboardList size={14} /> {t.label}</span><strong style={{ color: '#c084fc' }}>{t.count}</strong></div>)}</div>
          <div style={{ ...card, padding: 18 }}><h3>AI Insights</h3><div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>{data.aiInsights.map((i: any) => <div key={i.label} style={{ border: `1px solid ${i.color}66`, background: `${i.color}22`, borderRadius: 12, padding: 14 }}><div>{i.label}</div><strong style={{ fontSize: 24 }}>{i.value}</strong><div style={{ fontSize: 12 }}>{i.note}</div></div>)}</div><h4>Recommended Actions</h4><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>{data.recommendedActions.map((a: string) => <div key={a}><CheckCircle2 size={15} color="#86efac" /> {a}</div>)}</div></div>
        </section>
      </main>
    </div>
  );
}

const topBtn: React.CSSProperties = { height: 42, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 16px', borderRadius: 8, border: '1px solid rgba(83,119,177,.45)', background: 'rgba(9,22,45,.8)', color: '#f8fbff', fontWeight: 800 };
