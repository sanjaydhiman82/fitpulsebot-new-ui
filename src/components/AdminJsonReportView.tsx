import React, { useEffect, useMemo, useState } from 'react';
import { Bell, Calendar, CheckCircle2, Download, Filter, Home, Menu, Users, X } from 'lucide-react';
import { api } from '../api';
import styles from './LogPage.module.css';

const panel: React.CSSProperties = {
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

function MiniLine({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const pts = values.map((v, i) => `${(i / Math.max(values.length - 1, 1)) * 100},${36 - ((v - min) / Math.max(max - min, 1)) * 30}`).join(' ');
  return <svg viewBox="0 0 100 40" style={{ width: '100%', height: 42 }}><polyline points={pts} fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function Chart({ chart }: { chart: any }) {
  if (chart.type === 'bar') {
    const bars = chart.bars || [];
    const max = Math.max(...bars.map((b: any) => Number(b.value)), 1);
    return (
      <div style={{ height: 230, display: 'flex', alignItems: 'end', gap: 14, paddingTop: 12 }}>
        {bars.map((b: any) => <div key={b.label} style={{ flex: 1, textAlign: 'center' }}><div style={{ height: `${Math.max(12, Number(b.value) / max * 180)}px`, borderRadius: 8, background: chart.color || '#22c55e', boxShadow: `0 0 18px ${chart.color || '#22c55e'}55` }} /><div style={{ color: '#9fb4d1', fontSize: 11, marginTop: 8 }}>{b.label}</div></div>)}
      </div>
    );
  }
  const points = chart.points || ((chart.labels || []).map((label: string, i: number) => ({ label, value: chart.series?.[0]?.data?.[i] ?? 0 })));
  const vals = points.map((p: any) => Number(p.value ?? p));
  if (!vals.length) {
    return <div style={{ height: 230, display: 'grid', placeItems: 'center', color: '#9fb4d1' }}>No chart data available</div>;
  }
  const max = Math.max(...vals, 1);
  const min = Math.min(...vals, 0);
  const pts = vals.map((v: number, i: number) => `${30 + (i / Math.max(vals.length - 1, 1)) * 520},${180 - ((v - min) / Math.max(max - min, 1)) * 140}`).join(' ');
  return <svg viewBox="0 0 580 210" style={{ width: '100%', height: 230 }}>{[0,1,2,3,4].map(i => <line key={i} x1="30" x2="550" y1={40+i*35} y2={40+i*35} stroke="rgba(148,163,184,.18)" />)}<polygon points={`30,190 ${pts} 550,190`} fill={chart.color || '#22c55e'} opacity=".15" /><polyline points={pts} fill="none" stroke={chart.color || '#22c55e'} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function Donut({ donut }: { donut: any }) {
  let offset = 0;
  const c = 2 * Math.PI * 42;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '145px 1fr', gap: 16, alignItems: 'center' }}>
      <div style={{ position: 'relative', width: 145, height: 145 }}>
        <svg viewBox="0 0 100 100" style={{ width: 145, height: 145, transform: 'rotate(-90deg)' }}>
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(148,163,184,.18)" strokeWidth="12" />
          {(donut.segments || []).map((s: any) => {
            const len = c * (Number(s.percent) / 100);
            const node = <circle key={s.label} cx="50" cy="50" r="42" fill="none" stroke={s.color} strokeWidth="12" strokeDasharray={`${len} ${c}`} strokeDashoffset={-offset} />;
            offset += len;
            return node;
          })}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}><div><div style={{ color: '#9fb4d1', fontSize: 12 }}>Total</div><strong style={{ fontSize: 22 }}>{donut.total}</strong></div></div>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>{(donut.segments || []).map((s: any) => <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12 }}><span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: s.color, marginRight: 8 }} />{s.label}</span><strong>{s.value}</strong></div>)}</div>
    </div>
  );
}

export default function AdminJsonReportView({
  reportKey,
  audience = 'user',
  onClose,
  initialData,
}: {
  reportKey: string;
  audience?: 'user' | 'admin' | 'resource';
  onClose: () => void;
  initialData?: any;
}) {
  const [data, setData] = useState<any>(initialData || null);
  const [error, setError] = useState('');
  const grid = useMemo(() => ({ display: 'grid', gap: 14 }), []);
  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setError('');
      return;
    }
    setData(null);
    setError('');
    api.reports.render(reportKey, audience)
      .then((res: any) => setData(res.payload || res))
      .catch((e: any) => setError(e.message || 'Unable to load report.'));
  }, [reportKey, audience, initialData]);
  if (error) return <div style={{ padding: 40, color: '#fff', background: '#061225' }}><button onClick={onClose} style={btn}><X size={17} />Back</button><div style={{ marginTop: 18, color: '#fca5a5' }}>{error}</div></div>;
  if (!data) return <div style={{ padding: 40, color: '#fff', background: '#061225' }}>Loading report...</div>;
  return (
    <div style={{ background: '#061225', color: '#f8fbff', minHeight: '100%', display: 'grid', gridTemplateColumns: '1fr', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <aside style={{ display: 'none', borderRight: '1px solid rgba(83,119,177,.28)', padding: 18, background: 'linear-gradient(180deg,#07182f,#071224)', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}><div style={{ width: 38, height: 38, borderRadius: 10, background: '#12d47b', display: 'grid', placeItems: 'center', color: '#062015' }}><Home size={20} /></div><div><div style={{ fontSize: 20, fontWeight: 900 }}>FitPulseBot</div><div style={{ color: '#9fb4d1', fontSize: 11 }}>Your Health, Our Priority</div></div></div>
        <div style={{ ...panel, padding: 12, marginBottom: 16 }}><strong>Sanjay Dhiman</strong><div style={{ color: '#c084fc', fontSize: 12, fontWeight: 800 }}>Branch Admin</div></div>
        {['Dashboard','Clients','Attendance','Memberships','Payments','Resources','Workouts','Diet Plans','Reports','Leads','Settings'].map(n => <div key={n} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', borderRadius: 9, color: n === 'Reports' ? '#c084fc' : '#d9e6f7', background: n === 'Reports' ? 'rgba(124,58,237,.22)' : 'transparent', fontWeight: 700, fontSize: 13 }}><Users size={14} />{n}</div>)}
      </aside>
      <main style={{ padding: 18, paddingTop: 82 }}>
        <header className={styles.responsiveReportHeader} style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 3, minHeight: 66, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, padding: '10px 18px', background: 'rgba(6,18,37,.98)', borderBottom: '1px solid rgba(83,119,177,.32)', backdropFilter: 'blur(12px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
            <button onClick={onClose} style={{ ...btn, flexShrink: 0 }}><X size={17} />Back</button>
            <Menu style={{ flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <h1 style={{ margin: 0, fontSize: 24, whiteSpace: 'normal', lineHeight: 1.15 }}>{data.title}</h1>
              <div style={{ color: '#9fb4d1', fontSize: 13, whiteSpace: 'normal' }}>{data.subtitle}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}><button style={btn}><Calendar size={15} />{displayValue(data.dateRange)}</button><button style={btn}><Filter size={15} />Filter</button><button style={{ ...btn, background: '#4c1d95', borderColor: '#7c3aed' }}><Download size={15} />Export</button><Bell size={18} /></div>
        </header>
        <section className={styles.responsiveStatsGrid} style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min((data.kpis || []).length, 5)}, 1fr)`, gap: 12, marginBottom: 14 }}>
          {(data.kpis || []).map((k: any) => <div key={k.label} style={{ ...panel, padding: 14 }}><div style={{ color: '#9fb4d1', fontSize: 12, fontWeight: 800 }}>{displayValue(k.label)}</div><div style={{ fontSize: 24, fontWeight: 900, margin: '5px 0' }}>{displayValue(k.value)} {displayValue(k.unit)}</div><div style={{ color: '#22c55e', fontSize: 12 }}>{k.change ? `↑ ${displayValue(k.change)}` : ''}</div><MiniLine values={k.series || [1,2,3]} color={k.color || '#22c55e'} /></div>)}
        </section>
        <section className={styles.responsiveTwoCol} style={{ ...grid, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          {(data.charts || []).map((ch: any) => <div key={ch.title} style={{ ...panel, padding: 16 }}><h3 style={{ margin: '0 0 10px' }}>{ch.title}</h3><Chart chart={ch} /></div>)}
          {(data.donuts || []).map((d: any) => <div key={d.title} style={{ ...panel, padding: 16 }}><h3 style={{ margin: '0 0 14px' }}>{d.title}</h3><Donut donut={d} /></div>)}
          {(data.tables || []).map((t: any) => <div key={t.title} style={{ ...panel, padding: 16 }}><h3 style={{ margin: '0 0 12px' }}>{displayValue(t.title)}</h3><div className={styles.scrollTable}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}><thead><tr>{(t.columns || []).map((c: string) => <th key={c} style={{ color: '#9fb4d1', textAlign: 'left', padding: '7px 6px', borderBottom: '1px solid rgba(148,163,184,.2)' }}>{displayValue(c)}</th>)}</tr></thead><tbody>{(t.rows || []).map((r: any[], idx: number) => <tr key={idx}>{r.map((cell, i) => <td key={i} style={{ padding: '7px 6px', borderBottom: '1px solid rgba(148,163,184,.12)' }}>{displayValue(cell)}</td>)}</tr>)}</tbody></table></div></div>)}
        </section>
        <section style={{ ...panel, padding: 16, marginTop: 14 }}>
          <h3 style={{ margin: '0 0 12px' }}>Recommended Actions</h3>
          <div className={styles.responsiveTwoCol} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>{((data.recommendedActions || data.tables?.[0]?.rows?.map((r: any[]) => r[0]) || []) as string[]).slice(0, 4).map(a => <div key={a} style={{ color: '#d9e6f7' }}><CheckCircle2 size={15} color="#86efac" /> {a}</div>)}</div>
        </section>
      </main>
    </div>
  );
}

const btn: React.CSSProperties = { height: 38, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 13px', borderRadius: 8, border: '1px solid rgba(83,119,177,.45)', background: 'rgba(9,22,45,.8)', color: '#f8fbff', fontWeight: 800 };
