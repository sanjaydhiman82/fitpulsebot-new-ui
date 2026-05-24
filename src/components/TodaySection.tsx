import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Droplets, Flame, Moon, Activity, ChevronRight, Sparkles, Map, UtensilsCrossed } from 'lucide-react';
import { api } from '../api';
import { RangeId } from '../utils/dateRange';
import { useCountUp } from '../utils/useCountUp';

interface Props { range: RangeId; }

/* ─── Sparkline ─────────────────────────────────────────────── */
function Sparkline({ values, color, height = 40 }: { values: number[]; color: string; height?: number }) {
  if (!values.length) return null;
  const w = 160; const h = height;
  const min = Math.min(...values); const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * w,
    h - ((v - min) / range) * (h * 0.8) - h * 0.1,
  ]);
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x1, y1] = pts[i - 1]; const [x2, y2] = pts[i];
    const cx = (x1 + x2) / 2;
    d += ` C ${cx} ${y1} ${cx} ${y2} ${x2} ${y2}`;
  }
  const fillPts = [...pts, [w, h], [0, h]].map(p => p.join(',')).join(' ');
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display:'block' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill={`url(#sg-${color.replace('#','')})`} />
      <path d={d} stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

/* ─── Animated number ────────────────────────────────────────── */
function AN({ val, dec = 0 }: { val: number; dec?: number }) {
  const n = useCountUp(val, 900);
  return <>{dec > 0 ? n.toFixed(dec) : Math.round(n)}</>;
}

/* ─── Ring SVG ───────────────────────────────────────────────── */
function Ring({ pct, color, size, stroke, children }: { pct:number; color:string|string[]; size:number; stroke:number; children?:React.ReactNode }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  const gradId = `ring-${size}-${stroke}`;
  const isGrad = Array.isArray(color);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink:0 }}>
      {isGrad && (
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={(color as string[])[0]}/>
            <stop offset="100%" stopColor={(color as string[])[1]}/>
          </linearGradient>
        </defs>
      )}
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={isGrad ? `url(#${gradId})` : (color as string)}
        strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition:'stroke-dashoffset 900ms cubic-bezier(.4,0,.2,1)' }}/>
      {children}
    </svg>
  );
}

/* ─── Metric card ────────────────────────────────────────────── */
function MetricCard({ label, value, unit, sub1, sub2, sub2Color, sparkData, color, icon: Icon }:
  { label:string; value:number; unit:string; sub1?:string; sub2?:string; sub2Color?:string; sparkData:number[]; color:string; icon:any }) {
  const n = useCountUp(value, 1000);
  return (
    <div style={{
      background:'var(--bg-card)', border:'1px solid rgba(255,255,255,0.07)',
      borderRadius:16, padding:'18px 18px 0', flex:1, minWidth:0,
      display:'flex', flexDirection:'column', gap:8, overflow:'hidden',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
        <div style={{ width:28, height:28, borderRadius:8, background:`${color}20`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon size={14} color={color}/>
        </div>
        <span style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</span>
      </div>
      <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
        <span style={{ fontSize:36, fontWeight:800, color:color, letterSpacing:'-0.04em', lineHeight:1 }}>
          {unit === 'kcal' && value > 0 ? '+' : ''}{Math.round(n)}
        </span>
        <span style={{ fontSize:14, fontWeight:600, color:'var(--text-muted)' }}>{unit}</span>
      </div>
      {sub1 && <div style={{ fontSize:12, color:'var(--text-muted)' }}>{sub1}</div>}
      {sub2 && <div style={{ fontSize:12, fontWeight:700, color: sub2Color || 'var(--accent)' }}>{sub2}</div>}
      <div style={{ marginTop:4, marginLeft:-18, marginRight:-18 }}>
        <Sparkline values={sparkData} color={color}/>
      </div>
    </div>
  );
}

/* ─── Glass icon row for hydration ──────────────────────────── */
function GlassIcons({ filled, total }: { filled:number; total:number }) {
  return (
    <div style={{ display:'flex', gap:4, marginTop:10 }}>
      {Array.from({ length: total }).map((_, i) => (
        <svg key={i} width="20" height="26" viewBox="0 0 20 26">
          <path d="M3 2 L17 2 L15 22 Q15 24 10 24 Q5 24 5 22 Z"
            fill={i < filled ? '#2d6fd6' : 'rgba(255,255,255,0.08)'}
            stroke={i < filled ? '#5bc8e0' : 'rgba(255,255,255,0.12)'}
            strokeWidth="1"/>
        </svg>
      ))}
    </div>
  );
}

/* ─── Fake sparkline seed (replace with real 7-day data when API provides) ── */
function seedSpark(current: number, count = 7): number[] {
  const pts = [];
  let v = current * 0.6;
  for (let i = 0; i < count; i++) {
    v += (Math.random() - 0.45) * current * 0.25;
    v = Math.max(current * 0.1, Math.min(current * 1.4, v));
    pts.push(i === count - 1 ? current : v);
  }
  return pts;
}

/* ─── Status row (reference style: icon + label + status + chevron) ── */
function StatusRow({ label, status, iconEmoji }: { label:string; status:'good'|'ok'|'bad'; iconEmoji:string }) {
  const cfg = {
    good: { color:'#3dbf96', text:'On Track' },
    ok:   { color:'#d97706', text:'Needs Work' },
    bad:  { color:'#e53e3e', text:'Behind' },
  }[status];
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', background:'rgba(255,255,255,0.04)', borderRadius:12, border:'1px solid rgba(255,255,255,0.07)', cursor:'pointer' }}>
      <span style={{ fontSize:18 }}>{iconEmoji}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', fontWeight:500 }}>{label}</div>
        <div style={{ fontSize:13, fontWeight:800, color:cfg.color, lineHeight:1.3 }}>{cfg.text}</div>
      </div>
      <ChevronRight size={14} color="rgba(255,255,255,0.25)"/>
    </div>
  );
}

/* ─── Score label ────────────────────────────────────────────── */
function scoreLabel(pct: number): string {
  if (pct >= 80) return 'Excellent';
  if (pct >= 65) return 'Good';
  if (pct >= 45) return 'Fair';
  if (pct >= 25) return 'Needs Work';
  return 'Behind';
}

/* ─── AI Rec card ────────────────────────────────────────────── */
function RecCard({ icon, title, desc, btnLabel, btnColor, onClick }:
  { icon:string; title:string; desc:string; btnLabel:string; btnColor:string; onClick?:()=>void }) {
  return (
    <div style={{ background:'var(--bg-card)', border:`1px solid rgba(255,255,255,0.07)`, borderRadius:16, padding:18, display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ width:44, height:44, borderRadius:12, background:`${btnColor}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>{icon}</div>
      <div style={{ fontSize:14, fontWeight:800, color:'var(--text-primary)', letterSpacing:'-0.01em' }}>{title}</div>
      <div style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.6, flex:1 }}>{desc}</div>
      <button onClick={onClick} style={{
        display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        padding:'10px 0', borderRadius:10, border:`1px solid ${btnColor}60`,
        background:`${btnColor}18`, color:btnColor, fontSize:12, fontWeight:700,
        cursor:'pointer', transition:'all 200ms',
      }}>
        {btnLabel} <ChevronRight size={13}/>
      </button>
    </div>
  );
}

/* ─── Meal row ───────────────────────────────────────────────── */
const MEAL_ICONS: Record<string, string> = { breakfast:'🌅', lunch:'☀️', dinner:'🌙', snack:'🍎' };
const MEAL_TIMES: Record<string, string> = { breakfast:'8:00 AM', lunch:'1:00 PM', dinner:'7:30 PM', snack:'4:00 PM' };

function MealRow({ meal, isLast }: { meal:any; isLast:boolean }) {
  const type = (meal.mealType || 'snack').toLowerCase();
  return (
    <div style={{ display:'flex', gap:14, position:'relative' }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:0, width:54 }}>
        <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:500, whiteSpace:'nowrap', paddingTop:14 }}>{MEAL_TIMES[type] || '12:00 PM'}</div>
        <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, marginTop:6 }}>
          {MEAL_ICONS[type] || '🍽️'}
        </div>
        {!isLast && <div style={{ width:1, flex:1, background:'rgba(255,255,255,0.08)', minHeight:20, marginTop:6 }}/>}
      </div>
      <div style={{ flex:1, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'14px 16px', margin:'8px 0', display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:48, height:48, borderRadius:10, background:`rgba(255,255,255,0.06)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>
          {type === 'breakfast' ? '🥣' : type === 'lunch' ? '🥗' : type === 'dinner' ? '🍲' : '🍎'}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)', textTransform:'capitalize', marginBottom:2 }}>{meal.mealType}</div>
          <div style={{ fontSize:12, color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{meal.foodName}</div>
        </div>
        <div style={{ fontSize:16, fontWeight:800, color:'#e53e3e', flexShrink:0 }}>{Math.round(meal.calories)}<span style={{ fontSize:11, fontWeight:500, color:'var(--text-muted)', marginLeft:2 }}>kcal</span></div>
        <ChevronRight size={14} color="var(--text-muted)"/>
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────── */
export default function TodaySection({ range }: Props) {
  const [data, setData]         = useState<any>(null);
  const [insight, setInsight]   = useState<any>(null);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date();
      const d = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
      // Fetch today data + AI insight in parallel
      const [todayRes, insightRes] = await Promise.allSettled([
        api.dashboard.sectionToday(range === 'today' ? d : undefined),
        api.aiCoach.insight(),
      ]);
      if (todayRes.status === 'fulfilled')   setData(todayRes.value);
      if (insightRes.status === 'fulfilled') setInsight(insightRes.value);
    } catch { setData(null); } finally { setLoading(false); }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:200, gap:10, color:'var(--text-muted)', fontSize:13 }}>
      <RefreshCw size={16} style={{ animation:'spin 0.8s linear infinite' }}/> Loading today's data…
    </div>
  );
  if (!data) return <div style={{ minHeight:100, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', fontSize:13, border:'1px dashed var(--border)', borderRadius:16 }}>No data for today.</div>;

  const { ringPct, streak, bars, goals, netCalories, meals, activity } = data;
  const hr = new Date().getHours();
  const name = localStorage.getItem('fitpulse_firstName') || '';

  /* Derived status */
  const actStatus: 'good'|'ok'|'bad' = bars.calBurnPct >= 80 ? 'good' : bars.calBurnPct >= 40 ? 'ok' : 'bad';
  const sleepStatus: 'good'|'ok'|'bad' = bars.sleepPct >= 80 ? 'good' : bars.sleepPct >= 50 ? 'ok' : 'bad';
  const nutStatus: 'good'|'ok'|'bad' = bars.calInPct >= 60 && bars.calInPct <= 105 ? 'good' : bars.calInPct >= 30 ? 'ok' : 'bad';

  /* Macro ring pct */
  const proteinPct = Math.min(100, Math.round((bars.protein || 0) / 80 * 100));
  const carbsPct   = Math.min(100, Math.round((bars.carbs   || 0) / (goals.calConsumeGoal * 0.5 / 4) * 100));
  const fatPct     = Math.min(100, Math.round((bars.fat     || 0) / 70 * 100));
  const macroOverall = Math.min(100, Math.round((proteinPct + carbsPct + fatPct) / 3));

  /* Hydration glasses */
  const hydGoalL = goals.waterGoalMl / 1000;
  const hydActualL = bars.waterMl / 1000;
  const hydPct = bars.waterPct;
  const glassCount = 8;
  const filledGlasses = Math.round((bars.waterMl / goals.waterGoalMl) * glassCount);

  /* AI recs derived from data */
  const recs = [
    bars.proteinPct < 70 && { icon:'🥩', title:'Eat More Protein', desc:`Add ~${Math.round((80 - bars.protein) / 1)}g of protein to meet your daily goal.`, btn:'Suggestions', color:'#3dbf96' },
    bars.waterPct < 80   && { icon:'💧', title:'Hydration Boost', desc:`Drink ~${Math.round((goals.waterGoalMl - bars.waterMl) / 100) * 100}ml more water to hit your goal.`, btn:'Log Water', color:'#2d6fd6' },
    bars.sleepPct < 80   && { icon:'🌙', title:'Improve Sleep', desc:`Aim for ${goals.sleepGoalHrs} hours tonight for better recovery.`, btn:'Sleep Tips', color:'#7f77dd' },
    bars.calBurnPct >= 80 && { icon:'🏃', title:'Stay Active', desc:'Great job! Keep your momentum going tomorrow.', btn:'View Plan', color:'#d97706' },
    bars.calBurnPct < 40 && { icon:'⚡', title:'Move More', desc:`Burn ${goals.calBurnGoal - bars.calBurn} more kcal to hit today's activity goal.`, btn:'Log Activity', color:'#d97706' },
  ].filter(Boolean).slice(0, 4) as any[];

  /* Sparkline seeds */
  const calSpark   = seedSpark(Math.abs(netCalories) || 200);
  const actSpark   = seedSpark(activity.activeMin || 30);
  const distSpark  = seedSpark(activity.distanceKm || 5);
  const sleepSpark = seedSpark(bars.sleepHrs || 5);

  const CARD_STYLE = {
    background:'var(--bg-card)', border:'1px solid rgba(255,255,255,0.07)',
    borderRadius:16, padding:20,
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }} key={range}>

      {/* ── Merged AI Coach Hero ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0d1b2e 0%, #0f1f35 40%, #150d2e 100%)',
        border: '1px solid rgba(61,191,150,0.2)',
        borderRadius: 20, padding: '22px 24px',
        display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background glow blobs */}
        <div style={{ position:'absolute', top:-40, left:-40, width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle, rgba(61,191,150,0.12) 0%, transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-60, right:80, width:260, height:260, borderRadius:'50%', background:'radial-gradient(circle, rgba(127,119,221,0.1) 0%, transparent 70%)', pointerEvents:'none' }}/>

        {/* Coach avatar with glow rings */}
        <div style={{ position:'relative', flexShrink:0 }}>
          <div style={{ position:'absolute', inset:-8, borderRadius:'50%', background:'rgba(61,191,150,0.08)', border:'1.5px solid rgba(61,191,150,0.2)' }}/>
          <div style={{ position:'absolute', inset:-18, borderRadius:'50%', background:'rgba(61,191,150,0.04)', border:'1px solid rgba(61,191,150,0.1)' }}/>
          <img src="/coach.png" alt="AI Coach" style={{ width:90, height:90, borderRadius:'50%', objectFit:'cover', position:'relative', zIndex:1, border:'2px solid rgba(61,191,150,0.3)' }}/>
        </div>

        {/* Insight content */}
        <div style={{ flex:1, minWidth:220, zIndex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8 }}>
            <Sparkles size={11} color="#3dbf96"/>
            <span style={{ fontSize:10, fontWeight:700, color:'#3dbf96', textTransform:'uppercase', letterSpacing:'0.12em' }}>AI Coach</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:8 }}>
            <span style={{ fontSize:18, fontWeight:800, color:'#fff', letterSpacing:'-0.02em' }}>
              {hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Great effort today'}{name ? `, ${name}` : ''}! 💪
            </span>
            {streak > 0 && (
              <span style={{ fontSize:11, fontWeight:700, background:'rgba(217,119,6,0.25)', color:'#f59e0b', padding:'4px 12px', borderRadius:99, border:'1px solid rgba(217,119,6,0.4)', whiteSpace:'nowrap' }}>
                🔥 {streak}-Day Streak
              </span>
            )}
          </div>
          {/* Insight text — GPT-4o if available, else fallback */}
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.65)', lineHeight:1.6, marginBottom: insight?.action ? 10 : 0 }}>
            {insight?.insight || (
              netCalories > 200
                ? `You're ${Math.round(netCalories)} kcal above your goal. Consider a lighter dinner and prioritize sleep to boost recovery.`
                : netCalories < -200
                ? `You're ${Math.round(Math.abs(netCalories))} kcal under goal. Have a nutritious snack to fuel recovery.`
                : `You're right on track today! Keep up the great balance between activity and nutrition.`
            )}
          </p>
          {/* Action tip from GPT-4o */}
          {insight?.action && (
            <div style={{ display:'flex', alignItems:'flex-start', gap:10, background:'rgba(61,191,150,0.1)', border:'1px solid rgba(61,191,150,0.25)', borderRadius:10, padding:'10px 14px' }}>
              <span style={{ fontSize:15, flexShrink:0 }}>💡</span>
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.75)', lineHeight:1.55 }}>{insight.action}</span>
            </div>
          )}
        </div>

        {/* Daily Score ring */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, flexShrink:0, zIndex:1 }}>
          <div style={{ position:'relative' }}>
            <Ring pct={ringPct} color={['#3dbf96','#5bc8e0']} size={110} stroke={10}>
              <text x="55" y="50" textAnchor="middle" fontSize="26" fontWeight="800" fill="white">{ringPct}</text>
              <text x="55" y="66" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.45)">Daily Score</text>
            </Ring>
          </div>
          <div style={{ fontSize:12, fontWeight:700, color: ringPct >= 65 ? '#3dbf96' : ringPct >= 45 ? '#d97706' : '#e53e3e', background: 'rgba(255,255,255,0.06)', padding:'3px 12px', borderRadius:99, border:'1px solid rgba(255,255,255,0.1)' }}>
            {scoreLabel(ringPct)}
          </div>
        </div>

        {/* Status rows */}
        <div style={{ display:'flex', flexDirection:'column', gap:8, minWidth:160, zIndex:1 }}>
          <StatusRow label="Activity"  status={actStatus}   iconEmoji="🔥"/>
          <StatusRow label="Sleep"     status={sleepStatus} iconEmoji="🌙"/>
          <StatusRow label="Nutrition" status={nutStatus}   iconEmoji="🍽️"/>
        </div>
      </div>

      {/* ── 4 Metric cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:12 }}>
        <MetricCard label="Calorie Balance" value={Math.abs(netCalories)} unit="kcal" sub1={`${Math.round(bars.calIn)} consumed / ${bars.calBurn} burned`} sub2={netCalories > 0 ? 'Surplus' : 'Deficit'} sub2Color={netCalories > 0 ? '#e53e3e' : '#3dbf96'} sparkData={calSpark} color="#e53e3e" icon={Flame}/>
        <MetricCard label="Active Time" value={activity.activeMin} unit="min" sub1={`Goal ${goals.calBurnGoal > 0 ? 60 : 60} min`} sub2={bars.calBurnPct >= 100 ? '✓ Goal met' : `${bars.calBurnPct}% of goal`} sub2Color={bars.calBurnPct >= 100 ? '#3dbf96' : '#d97706'} sparkData={actSpark} color="#3dbf96" icon={Activity}/>
        <MetricCard label="Distance" value={activity.distanceKm} unit="km" sub1="Today's total" sub2={activity.distanceKm >= 10 ? '✓ 10km achieved' : `${activity.distanceKm} of 10 km`} sub2Color={activity.distanceKm >= 10 ? '#3dbf96' : '#2d6fd6'} sparkData={distSpark} color="#2d6fd6" icon={Map}/>
        <MetricCard label="Sleep Last Night" value={bars.sleepHrs} unit="h" sub1={`Goal ${goals.sleepGoalHrs}–${goals.sleepGoalHrs + 1} h`} sub2={`↓ ${100 - bars.sleepPct}% vs goal`} sub2Color={bars.sleepPct >= 80 ? '#3dbf96' : '#7f77dd'} sparkData={sleepSpark} color="#7f77dd" icon={Moon}/>
      </div>

      {/* ── Macros + Hydration ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>

        {/* Macros */}
        <div style={CARD_STYLE}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>Macro Nutrients</div>
          <div style={{ display:'flex', gap:20, alignItems:'center' }}>
            <div style={{ position:'relative', flexShrink:0 }}>
              <Ring pct={macroOverall} color={['#e53e3e','#9f7aea']} size={90} stroke={10}>
                <text x="45" y="41" textAnchor="middle" fontSize="18" fontWeight="800" fill="white">{macroOverall}%</text>
                <text x="45" y="54" textAnchor="middle" fontSize="9" fill="#888">of daily goal</text>
              </Ring>
            </div>
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:12 }}>
              {[
                { name:'Protein', val:Math.round(bars.protein||0), goal:80, pct:proteinPct, color:'#e53e3e' },
                { name:'Carbs',   val:Math.round(bars.carbs||0),   goal:260, pct:Math.min(100,Math.round((bars.carbs||0)/260*100)), color:'#2d6fd6' },
                { name:'Fat',     val:Math.round(bars.fat||0),     goal:70,  pct:fatPct,    color:'#9f7aea' },
              ].map(m => (
                <div key={m.name}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                    <span style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)', display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ width:8, height:8, borderRadius:'50%', background:m.color, display:'inline-block'}}/>
                      {m.name}
                    </span>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <span style={{ fontSize:11, color:'var(--text-muted)' }}>{m.val}g / {m.goal}g</span>
                      <span style={{ fontSize:11, fontWeight:800, color:m.color }}>{m.pct}%</span>
                    </div>
                  </div>
                  <div style={{ height:5, background:'rgba(255,255,255,0.07)', borderRadius:99, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${m.pct}%`, background:m.color, borderRadius:99, transition:'width 700ms ease' }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hydration */}
        <div style={CARD_STYLE}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>
            <Droplets size={12} style={{ verticalAlign:'middle', marginRight:5 }} color="#2d6fd6"/>Hydration
          </div>
          <div style={{ display:'flex', gap:20, alignItems:'center' }}>
            <div style={{ position:'relative', flexShrink:0 }}>
              <Ring pct={hydPct} color={['#2d6fd6','#5bc8e0']} size={100} stroke={10}>
                <text x="50" y="44" textAnchor="middle" fontSize="14" fontWeight="800" fill="white">{hydActualL.toFixed(1)} L</text>
                <text x="50" y="57" textAnchor="middle" fontSize="9" fill="#888">of {hydGoalL.toFixed(1)} L</text>
              </Ring>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:36, fontWeight:800, color:'#5bc8e0', letterSpacing:'-0.04em', lineHeight:1 }}>{hydPct}%</div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>Goal {hydGoalL.toFixed(1)} L</div>
              <GlassIcons filled={Math.min(filledGlasses, glassCount)} total={glassCount}/>
            </div>
          </div>
        </div>
      </div>

      {/* ── Meals logged ── */}
      {meals && meals.length > 0 && (
        <div style={CARD_STYLE}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <UtensilsCrossed size={14} color="var(--text-muted)"/>
              <span style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.07em' }}>Meals Logged</span>
            </div>
            <span style={{ fontSize:12, color:'var(--text-muted)' }}>{meals.length} item{meals.length>1?'s':''}</span>
          </div>
          {meals.map((meal: any, i: number) => (
            <MealRow key={i} meal={meal} isLast={i === meals.length - 1}/>
          ))}
        </div>
      )}

      {/* ── AI Recommendations ── */}
      {recs.length > 0 && (
        <div style={CARD_STYLE}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
            <Sparkles size={14} color="#3dbf96"/>
            <span style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.07em' }}>AI Recommendations</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:`repeat(${recs.length},minmax(0,1fr))`, gap:12 }}>
            {recs.map((rec: any, i: number) => (
              <RecCard key={i} icon={rec.icon} title={rec.title} desc={rec.desc} btnLabel={`${rec.btn} →`} btnColor={rec.color}/>
            ))}
          </div>
        </div>
      )}

      {/* ── Footer tagline ── */}
      <div style={{ textAlign:'center', padding:'8px 0', fontSize:13, color:'var(--text-muted)' }}>
        ❤️ <span style={{ color:'var(--accent)', fontWeight:700 }}>Consistency today</span>, Results tomorrow.
      </div>

    </div>
  );
}
