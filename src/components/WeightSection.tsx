import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';
import { api } from '../api';
import { RangeId, getRangeDates, fmtLabel } from '../utils/dateRange';
import s from './sections.module.css';
interface Props { range: RangeId; }

const CustomTip = ({ active, payload, label }: any) =>
  active && payload?.length ? <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', fontSize:12 }}><p style={{ color:'var(--text-muted)', marginBottom:4 }}>{label}</p>{payload.map((p: any) => <p key={p.name} style={{ color:p.color, fontWeight:700 }}>{p.name}: {p.value} kg</p>)}</div> : null;

function bmiCategory(bmi: number) {
  if (bmi < 18.5) return { label:'Underweight', cls: 'badgeBlue' as const };
  if (bmi < 25)   return { label:'Normal',      cls: 'badgeGreen' as const };
  if (bmi < 30)   return { label:'Overweight',  cls: 'badgeAmber' as const };
  return { label:'Obese', cls: 'badgeDanger' as const };
}

export default function WeightSection({ range }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try { const { from, to } = getRangeDates(range); setData(await api.dashboard.sectionWeight(from, to)); }
    catch { setData(null); } finally { setLoading(false); }
  }, [range]);
  useEffect(() => { load(); }, [load]);
  if (loading) return <div className={s.loading}><RefreshCw size={16} className={s.spinning} style={{ marginRight:8 }} />Loading weight…</div>;
  if (!data || !data.summary?.latest) return <div className={s.empty}>No weight data logged.</div>;

  const { summary, trend, period } = data;
  const chartData = trend.map((t: any) => ({ day: fmtLabel(t.date, range), Weight: t.weight, Avg: t.movingAvg }));
  const yMin = Math.min(...trend.map((t: any) => t.weight)) - 1;
  const yMax = Math.max(...trend.map((t: any) => t.weight)) + 1;
  const bmi = summary.bmi;
  const bmiCat = bmi ? bmiCategory(bmi) : null;
  const changeColor = summary.changeKg > 0 ? 'var(--danger)' : summary.changeKg < 0 ? 'var(--accent)' : 'var(--text-muted)';

  return (
    <div className={s.section}>
      <div className={s.grid4}>
        <div className={s.statCard}>
          <div className={s.statLabel}>Latest</div>
          <div className={s.statValue}>{summary.latest} <span className={s.statUnit}>kg</span></div>
          <div className={s.statSub} style={{ color: changeColor, fontWeight:700 }}>
            {summary.changeKg > 0 ? '+' : ''}{summary.changeKg} kg vs start
          </div>
        </div>
        <div className={s.statCard}>
          <div className={s.statLabel}>{period.days<=7?'Week':'Period'} avg</div>
          <div className={s.statValue}>{summary.avg30} <span className={s.statUnit}>kg</span></div>
        </div>
        <div className={s.statCard}>
          <div className={s.statLabel}>Target</div>
          <div className={s.statValue} style={{ color:'var(--accent)' }}>{summary.targetWeight} <span className={s.statUnit}>kg</span></div>
          <div className={s.statSub}>{Math.abs(summary.latest - summary.targetWeight).toFixed(1)} kg to go</div>
        </div>
        <div className={s.statCard}>
          <div className={s.statLabel}>BMI</div>
          <div className={s.statValue}>{bmi ?? '—'}</div>
          {bmiCat && <span className={`${s.badge} ${s[bmiCat.cls]}`} style={{ marginTop:4, fontSize:10 }}>{bmiCat.label}</span>}
        </div>
      </div>

      {chartData.length > 1 && (
        <div className={s.card}>
          <div className={s.cardHeader}>
            <span className={s.cardTitle}>Weight trend</span>
            <span className={s.cardSub}>
              {summary.latest} kg · {summary.changeKg > 0 ? '+' : ''}{summary.changeKg} kg
            </span>
          </div>
          <div className={s.legendRow}>
            <span className={s.legendItem}><span className={s.legendDot} style={{ background:'#9f7aea' }} />Weight</span>
            <span className={s.legendItem}><span className={s.legendDot} style={{ background:'var(--accent)', borderRadius:0, height:2, width:16 }} />7-day avg</span>
            {summary.targetWeight && <span className={s.legendItem}><span className={s.legendDot} style={{ background:'var(--brand-teal)', borderRadius:0, height:2, width:16 }} />Target</span>}
          </div>
          <div className={s.chartBox} style={{ height:240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9f7aea" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#9f7aea" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[yMin, yMax]} tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} width={40} tickFormatter={v => `${v}kg`} />
                {summary.targetWeight && <ReferenceLine y={summary.targetWeight} stroke="var(--brand-teal)" strokeDasharray="5 4" strokeWidth={1.5} />}
                <Tooltip content={<CustomTip />} />
                <Area type="monotone" dataKey="Weight" stroke="#9f7aea" strokeWidth={2.5} fill="url(#wGrad)" dot={{ fill:'#9f7aea', r:3 }} />
                <Area type="monotone" dataKey="Avg" stroke="var(--accent)" strokeWidth={2} fill="transparent" dot={false} connectNulls />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
