import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Droplets, Activity, UtensilsCrossed, Moon, Flame, Trophy } from 'lucide-react';
import { api } from '../api';
import { RangeId, getRangeDates, pctColor } from '../utils/dateRange';
import { useCountUp } from '../utils/useCountUp';
import s from './sections.module.css';

interface Props { range: RangeId; }

const GOAL_META = [
  { key:'water',      label:'Water',      Icon: Droplets,        color:'#2d6fd6' },
  { key:'calBurn',    label:'Cal Burned', Icon: Activity,        color:'#e53e3e' },
  { key:'meals',      label:'Meals',      Icon: UtensilsCrossed, color:'#3dbf96' },
  { key:'sleep',      label:'Sleep',      Icon: Moon,            color:'#7f77dd' },
  { key:'calConsume', label:'Nutrition',  Icon: Flame,           color:'#d97706' },
  { key:'allGoals',   label:'All Goals',  Icon: Trophy,          color:'#f59e0b' },
];

function AnimNum({ val }: { val: number }) {
  const n = useCountUp(val);
  return <span className={s.animNum}>{Math.round(n)}</span>;
}

function SvgRadar({ data }: { data: { label: string; pct: number; color: string }[] }) {
  const cx = 110; const cy = 110; const r = 82;
  const n = data.length;
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;

  const rings = [0.25, 0.5, 0.75, 1].map(scale =>
    data.map((_, i) => {
      const a = angle(i);
      return `${(cx + r * scale * Math.cos(a)).toFixed(1)},${(cy + r * scale * Math.sin(a)).toFixed(1)}`;
    }).join(' ')
  );

  const spokes = data.map((_, i) => {
    const a = angle(i);
    return { x2: cx + r * Math.cos(a), y2: cy + r * Math.sin(a) };
  });

  const polygon = data.map((d, i) => {
    const a = angle(i); const ratio = (d.pct || 0) / 100;
    return `${(cx + r * ratio * Math.cos(a)).toFixed(1)},${(cy + r * ratio * Math.sin(a)).toFixed(1)}`;
  }).join(' ');

  const labels = data.map((d, i) => {
    const a = angle(i); const off = 20;
    return { x: cx + (r + off) * Math.cos(a), y: cy + (r + off) * Math.sin(a), ...d };
  });

  return (
    <svg viewBox="0 0 220 220" width="100%" height="220" aria-label="Goal completion radar chart">
      {rings.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke="var(--border)" strokeWidth={0.8}
          strokeDasharray={i < 3 ? '3 3' : undefined} />
      ))}
      {spokes.map((sp, i) => (
        <line key={i} x1={cx} y1={cy} x2={sp.x2} y2={sp.y2} stroke="var(--border)" strokeWidth={0.8} />
      ))}
      <polygon points={polygon} fill="var(--accent)" fillOpacity={0.2}
        stroke="var(--accent)" strokeWidth={2.5} strokeLinejoin="round"
        className={s.radarPolygon} />
      {data.map((d, i) => {
        const a = angle(i); const ratio = (d.pct || 0) / 100;
        return (
          <circle key={i}
            cx={cx + r * ratio * Math.cos(a)} cy={cy + r * ratio * Math.sin(a)}
            r={5} fill={d.color} stroke="var(--bg-card)" strokeWidth={2}
            style={{ transition: 'all 700ms ease', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,.2))' }}
          />
        );
      })}
      {labels.map((l, i) => (
        <g key={i}>
          <text x={l.x} y={l.y - 6} textAnchor="middle" fontSize={10} fill="var(--text-muted)" fontWeight={600}>{l.label}</text>
          <text x={l.x} y={l.y + 8} textAnchor="middle" fontSize={11} fill={l.color} fontWeight={800}>{l.pct}%</text>
        </g>
      ))}
      <circle cx={cx} cy={cy} r={3} fill="var(--accent)" opacity={0.5} />
    </svg>
  );
}

export default function GoalsSection({ range }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { from, to } = getRangeDates(range);
      setData(await api.dashboard.sectionGoals(from, to));
    } catch { setData(null); } finally { setLoading(false); }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className={s.loading}><RefreshCw size={16} className={s.spinning} style={{ marginRight:8 }} />Computing goals…</div>;
  if (!data) return <div className={s.empty}>No goals data.</div>;

  const { completion, period } = data;

  const radarData = GOAL_META.filter(m => m.key !== 'allGoals').map(m => ({
    label: m.label,
    pct: completion[m.key]?.pct || 0,
    color: m.color,
  }));

  const allGoals = completion['allGoals'] || { met: 0, total: period.days, pct: 0 };

  return (
    <div className={s.section} key={range}>

      {/* ── All goals met highlight ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 18px',
        background: allGoals.pct >= 50
          ? 'linear-gradient(135deg, rgba(61,191,150,.15), rgba(61,191,150,.05))'
          : 'var(--metric-bg)',
        border: `1px solid ${allGoals.pct >= 50 ? 'var(--border-strong)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-xl)',
      }}>
        <Trophy size={28} color="#f59e0b" />
        <div>
          <div style={{ fontSize:24, fontWeight:800, color:'var(--text-primary)', letterSpacing:'-0.03em', lineHeight:1 }}>
            <AnimNum val={allGoals.met} />
            <span style={{ fontSize:14, fontWeight:500, color:'var(--text-muted)' }}> / {allGoals.total} days</span>
          </div>
          <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:3 }}>All goals met</div>
        </div>
        <div style={{ marginLeft:'auto' }}>
          <span className={`${s.badge} ${allGoals.pct >= 50 ? s.badgeGreen : s.badgeAmber}`}>
            {allGoals.pct}%
          </span>
        </div>
      </div>

      {/* ── Goal grid + radar side by side ── */}
      <div className={s.grid2}>
        <div className={s.card}>
          <div className={s.cardHeader}>
            <span className={s.cardTitle}>Completion by goal</span>
            <span className={s.cardSub}>{period.days} day{period.days > 1 ? 's' : ''}</span>
          </div>
          <div className={s.goalGrid}>
            {GOAL_META.map(({ key, label, Icon, color }) => {
              const c = completion[key] || { met: 0, total: period.days, pct: 0 };
              return (
                <div className={s.goalCell} key={key}>
                  <div className={s.goalCellLabel}>
                    <Icon size={11} style={{ marginRight:3, verticalAlign:'middle' }} />{label}
                  </div>
                  <div className={s.goalCellVal} style={{ color: pctColor(c.pct) }}>
                    <AnimNum val={c.met} />
                    <span style={{ fontSize:13, fontWeight:500, color:'var(--text-muted)' }}>/{c.total}</span>
                  </div>
                  <div className={s.statBar}>
                    <div className={s.statBarFill} style={{ width:`${c.pct}%`, background: color }} />
                  </div>
                  <div className={s.goalCellSub}>{c.pct}%</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={s.card}>
          <div className={s.cardHeader}><span className={s.cardTitle}>Goal radar</span></div>
          <SvgRadar data={radarData} />
        </div>
      </div>

    </div>
  );
}
