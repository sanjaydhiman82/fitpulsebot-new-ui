import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Droplets, Activity, UtensilsCrossed, Moon, Flame, Trophy } from 'lucide-react';
import { api } from '../api';
import { RangeId, getRangeDates, pctColor } from '../utils/dateRange';
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

// Pure SVG radar — no Recharts dependency, no type issues
function SvgRadar({ data }: { data: { label: string; pct: number; color: string }[] }) {
  const cx = 110; const cy = 110; const r = 85;
  const n = data.length;
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;

  // Grid rings at 25%, 50%, 75%, 100%
  const rings = [0.25, 0.5, 0.75, 1].map(scale => {
    const pts = data.map((_, i) => {
      const a = angle(i);
      return `${cx + r * scale * Math.cos(a)},${cy + r * scale * Math.sin(a)}`;
    }).join(' ');
    return pts;
  });

  // Spoke lines
  const spokes = data.map((_, i) => {
    const a = angle(i);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });

  // Data polygon
  const polygon = data.map((d, i) => {
    const a = angle(i);
    const ratio = d.pct / 100;
    return `${cx + r * ratio * Math.cos(a)},${cy + r * ratio * Math.sin(a)}`;
  }).join(' ');

  // Labels
  const labels = data.map((d, i) => {
    const a = angle(i);
    const offset = 18;
    return {
      x: cx + (r + offset) * Math.cos(a),
      y: cy + (r + offset) * Math.sin(a),
      label: d.label,
      pct: d.pct,
      color: d.color,
    };
  });

  return (
    <svg viewBox="0 0 220 220" width="100%" height="220">
      {/* Grid rings */}
      {rings.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke="var(--border)" strokeWidth={0.8} strokeDasharray={i < 3 ? '3 3' : undefined} />
      ))}
      {/* Spokes */}
      {spokes.map((pt, i) => (
        <line key={i} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="var(--border)" strokeWidth={0.8} />
      ))}
      {/* Data fill */}
      <polygon points={polygon} fill="var(--accent)" fillOpacity={0.18} stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" />
      {/* Data dots */}
      {data.map((d, i) => {
        const a = angle(i);
        const ratio = d.pct / 100;
        return <circle key={i} cx={cx + r * ratio * Math.cos(a)} cy={cy + r * ratio * Math.sin(a)} r={4} fill={d.color} stroke="var(--bg-card)" strokeWidth={1.5} />;
      })}
      {/* Labels */}
      {labels.map((l, i) => (
        <g key={i}>
          <text x={l.x} y={l.y - 5} textAnchor="middle" fontSize={10} fill="var(--text-muted)" fontWeight={600}>{l.label}</text>
          <text x={l.x} y={l.y + 8} textAnchor="middle" fontSize={11} fill={l.color} fontWeight={800}>{l.pct}%</text>
        </g>
      ))}
      {/* Center ring label */}
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={10} fill="var(--text-muted)">100%</text>
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

  if (loading) return <div className={s.loading}><RefreshCw size={16} className={s.spinning} style={{ marginRight: 8 }} />Computing goals…</div>;
  if (!data) return <div className={s.empty}>No goals data.</div>;

  const { completion, period } = data;

  const radarData = GOAL_META.filter(m => m.key !== 'allGoals').map(m => ({
    label: m.label,
    pct: completion[m.key]?.pct || 0,
    color: m.color,
  }));

  return (
    <div className={s.section}>
      <div className={s.grid2}>
        <div className={s.card}>
          <div className={s.cardHeader}>
            <span className={s.cardTitle}>Goal completion</span>
            <span className={s.cardSub}>{period.days} day{period.days > 1 ? 's' : ''}</span>
          </div>
          <div className={s.goalGrid}>
            {GOAL_META.map(({ key, label, Icon, color }) => {
              const c = completion[key] || { met: 0, total: period.days, pct: 0 };
              return (
                <div className={s.goalCell} key={key}>
                  <div className={s.goalCellLabel}>
                    <Icon size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                    {label}
                  </div>
                  <div className={s.goalCellVal} style={{ color: pctColor(c.pct) }}>
                    {c.met}/{c.total}
                  </div>
                  <div className={s.statBar}>
                    <div className={s.statBarFill} style={{ width: `${c.pct}%`, background: color }} />
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

      <div className={s.card}>
        <div className={s.cardHeader}><span className={s.cardTitle}>Goal progress bars</span></div>
        {GOAL_META.map(({ key, label, Icon, color }) => {
          const c = completion[key] || { met: 0, total: period.days, pct: 0 };
          return (
            <div className={s.barRow} key={key}>
              <div className={s.barRowHead}>
                <span className={s.barRowLabel}><Icon size={13} color={color} />{label}</span>
                <span className={s.barRowVal}>{c.met} of {c.total} days · {c.pct}%</span>
              </div>
              <div className={s.barTrack}>
                <div className={s.barFill} style={{ width: `${c.pct}%`, background: color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
