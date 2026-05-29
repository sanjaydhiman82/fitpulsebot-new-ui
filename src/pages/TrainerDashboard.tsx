import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../App';
import PortalLayout, {
  SectionHeader, PrimaryBtn, OutlineBtn, StatusBadge,
  Modal, FormField, inputStyle,
} from '../components/PortalLayout';
import { api } from '../api';
import { normalizeProfileImageUrl } from '../profileImageUrl';
import {
  LayoutDashboard, Users, Dumbbell, Salad, TrendingUp, Ruler,
  Plus, RefreshCw, Loader, Search, ArrowLeft,
  Target, Activity, CalendarCheck,
  ChevronRight, X, Sparkles, Zap, Brain, AlertTriangle,
  CheckCircle, Flame,
  AlertCircle, ChevronDown, ChevronUp, Bot, Lightbulb,
  Heart, Camera, FileText, Star, Edit2,
  BookOpen, MessageSquare, TestTube2,
} from 'lucide-react';
import { BrandingProvider, useBranding } from '../contexts/BrandingContext';
import { LabelProvider, useLabels } from '../contexts/LabelContext';
import BioMarkersPage from '../components/BioMarkersPage';
import MyReportsPage from '../components/MyReportsPage';

// ─── NAV ─────────────────────────────────────────────────
const NAV = [
  { id: 'dashboard',  label: 'Dashboard',         icon: <LayoutDashboard size={16} /> },
  { id: 'members',    label: 'My Members',         icon: <Users size={16} /> },
  { id: 'workouts',   label: 'Workouts',           icon: <Dumbbell size={16} /> },
  { id: 'diets',      label: 'Diet Plans',         icon: <Salad size={16} /> },
  { id: 'plateau',    label: 'Plateau AI',         icon: <Brain size={16} /> },
  { id: 'progress',   label: 'Progress',           icon: <TrendingUp size={16} /> },
  { id: 'reports',    label: 'My Reports',         icon: <FileText size={16} /> },
];

const field = (row: any, camel: string, snake: string) => row?.[camel] ?? row?.[snake];
const normalizeMember = (m: any) => ({
  ...m,
  userId: field(m, 'userId', 'user_id'),
  firstName: field(m, 'firstName', 'first_name') || '',
  lastName: field(m, 'lastName', 'last_name') || '',
  userName: field(m, 'userName', 'user_name') || '',
  avatarUrl: normalizeProfileImageUrl(field(m, 'avatarUrl', 'avatar_url')),
  progressStatus: field(m, 'progressStatus', 'progress_status'),
  activeWorkoutPlanId: field(m, 'activeWorkoutPlanId', 'active_workout_plan_id'),
  activeDietPlanId: field(m, 'activeDietPlanId', 'active_diet_plan_id'),
});
const memberName = (m: any) => `${m.firstName || ''} ${m.lastName || ''}`.trim() || m.userName || 'Unnamed member';
const isNum = (v: any) => typeof v === 'number' && Number.isFinite(v);
const asNum = (v: any): number | undefined => {
  if (isNum(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};
const formatMetric = (value: any, empty = '—') => {
  const n = asNum(value);
  if (n !== undefined) return n.toLocaleString();
  return value ?? empty;
};
const formatChange = (value: any, suffix: string) => {
  const n = asNum(value);
  if (n === undefined) return 'No comparison data';
  return `${n > 0 ? '+' : ''}${n}${suffix}`;
};
const safePct = (value: any) => Math.max(0, Math.min(100, Math.round(asNum(value) ?? 0)));
const nonEmptyArray = (value: any): any[] => Array.isArray(value) ? value.filter(Boolean) : [];

// ─── Shared AI badge ──────────────────────────────────────
function AIBadge({ label = 'AI Generated' }: { label?: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: 'linear-gradient(135deg, rgba(139,92,246,0.18), rgba(59,130,246,0.18))',
      border: '1px solid rgba(139,92,246,0.35)', borderRadius: 20,
      fontSize: 10, fontWeight: 700, color: '#a78bfa', padding: '2px 8px',
    }}>
      <Sparkles size={9} />{label}
    </span>
  );
}

// ─── AI Workout Generator Modal ───────────────────────────
function AIWorkoutGeneratorModal({ open, onClose, memberId, orgId, branchId, onSaved }: {
  open: boolean; onClose: () => void; memberId: string;
  orgId: string; branchId: string; onSaved: () => void;
}) {
  const [step, setStep] = useState<'config'|'generated'|'saving'>('config');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState<any>(null);
  const [form, setForm] = useState({
    goal: 'FAT_LOSS', level: 'BEGINNER', durationWeeks: 4, daysPerWeek: 5,
    sessionMinutes: 60, equipment: ['dumbbells','treadmill','machines'],
    injuries: '', preferences: 'indian_gym,morning_sessions', includeSchedule: true,
  });

  useEffect(() => { if (open) { setStep('config'); setGenerated(null); setError(''); } }, [open]);

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  const generate = async () => {
    setError(''); setLoading(true);
    try {
      const res = await api.ai.generateWorkout({
        memberId, organizationId: orgId, branchId,
        goal: form.goal, level: form.level,
        durationWeeks: Number(form.durationWeeks),
        daysPerWeek: Number(form.daysPerWeek),
        sessionMinutes: Number(form.sessionMinutes),
        equipment: form.equipment,
        injuries: form.injuries ? form.injuries.split(',').map(s => s.trim()) : [],
        preferences: form.preferences ? form.preferences.split(',').map(s => s.trim()) : [],
        includeSchedule: form.includeSchedule,
        save: false,
      });
      setGenerated(res);
      setStep('generated');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const saveWorkout = async () => {
    if (!generated?.workout) return;
    setLoading(true); setStep('saving');
    try {
      await api.trainer.createWorkout(memberId, {
        organizationId: orgId, branchId,
        createdByType: 'AI',
        ...generated.workout,
      });
      onSaved(); onClose();
    } catch (e: any) { setError(e.message); setStep('generated'); }
    finally { setLoading(false); }
  };

  const EQUIPMENT_OPTIONS = ['dumbbells','barbell','treadmill','machines','kettlebell','cables','bodyweight','resistance_bands'];
  const toggleEquip = (e: string) => setForm(p => ({
    ...p,
    equipment: p.equipment.includes(e) ? p.equipment.filter(x => x !== e) : [...p.equipment, e],
  }));

  return (
    <Modal open={open} onClose={onClose} title="" width={720}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={20} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 900 }}>AI Workout Generator</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {step === 'config' ? 'Configure preferences and let AI build the perfect plan' :
             step === 'generated' ? 'Review your AI-generated workout plan' : 'Saving to member profile…'}
          </div>
        </div>
        {step === 'generated' && <AIBadge />}
      </div>

      {step === 'config' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }}>
            <FormField label="Goal">
              <select style={inputStyle} value={form.goal} onChange={f('goal')}>
                {['FAT_LOSS','MUSCLE_GAIN','MAINTENANCE','ENDURANCE','STRENGTH'].map(g => <option key={g} value={g}>{g.replace(/_/g,' ')}</option>)}
              </select>
            </FormField>
            <FormField label="Level">
              <select style={inputStyle} value={form.level} onChange={f('level')}>
                {['BEGINNER','INTERMEDIATE','ADVANCED'].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </FormField>
            <FormField label="Duration (weeks)">
              <input type="number" style={inputStyle} value={form.durationWeeks} onChange={f('durationWeeks')} min={1} max={52} />
            </FormField>
            <FormField label="Days / Week">
              <input type="number" style={inputStyle} value={form.daysPerWeek} onChange={f('daysPerWeek')} min={2} max={7} />
            </FormField>
            <FormField label="Session (minutes)">
              <input type="number" style={inputStyle} value={form.sessionMinutes} onChange={f('sessionMinutes')} min={20} max={180} />
            </FormField>
          </div>

          <FormField label="Available Equipment">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              {EQUIPMENT_OPTIONS.map(eq => (
                <button key={eq} onClick={() => toggleEquip(eq)} style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: form.equipment.includes(eq) ? 'rgba(139,92,246,0.18)' : 'var(--metric-bg)',
                  color: form.equipment.includes(eq) ? '#a78bfa' : 'var(--text-muted)',
                  border: form.equipment.includes(eq) ? '1px solid rgba(139,92,246,0.4)' : '1px solid var(--border)',
                  transition: 'all 0.15s',
                }}>
                  {eq.replace(/_/g,' ')}
                </button>
              ))}
            </div>
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
            <FormField label="Injuries / Limitations">
              <input style={inputStyle} value={form.injuries} onChange={f('injuries')} placeholder="lower_back_pain, knee_injury" />
            </FormField>
            <FormField label="Preferences">
              <input style={inputStyle} value={form.preferences} onChange={f('preferences')} placeholder="indian_gym, morning_sessions" />
            </FormField>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, padding: '12px 14px', background: 'rgba(139,92,246,0.06)', borderRadius: 10, border: '1px solid rgba(139,92,246,0.15)' }}>
            <input type="checkbox" id="incSched" checked={form.includeSchedule} onChange={f('includeSchedule')} />
            <label htmlFor="incSched" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Include progressive weekly schedule
            </label>
          </div>

          {error && <p style={{ color: 'var(--danger)', fontSize: 12, margin: '10px 0 0' }}>{error}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <OutlineBtn onClick={onClose}>Cancel</OutlineBtn>
            <PrimaryBtn onClick={generate} loading={loading} style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', minWidth: 160 }}>
              {loading ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</> : <><Sparkles size={14} /> Generate with AI</>}
            </PrimaryBtn>
          </div>
        </>
      )}

      {(step === 'generated' || step === 'saving') && generated?.workout && (
        <>
          {/* Plan Overview */}
          <div style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(59,130,246,0.08))', borderRadius: 14, padding: 20, border: '1px solid rgba(139,92,246,0.2)', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 4 }}>{generated.workout.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{generated.workout.goal?.replace(/_/g,' ')} · {generated.workout.level}</div>
              </div>
              <AIBadge />
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { label: 'Start', val: generated.workout.startDate || '—' },
                { label: 'End', val: generated.workout.endDate || '—' },
                { label: 'Progressive Overload', val: generated.workout.metadata?.progressiveOverload ? '✓ Yes' : 'No' },
                { label: 'Recovery Aware', val: generated.workout.metadata?.recoveryAware ? '✓ Yes' : 'No' },
              ].map(m => (
                <div key={m.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', fontSize: 11 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{m.label}: </span>
                  <strong style={{ color: 'var(--text-primary)' }}>{m.val}</strong>
                </div>
              ))}
            </div>
            {generated.workout.metadata?.notes && (
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-secondary)', padding: '8px 12px', background: 'rgba(61,191,150,0.07)', borderRadius: 8, borderLeft: '3px solid var(--accent)' }}>
                💡 {generated.workout.metadata.notes}
              </div>
            )}
          </div>

          {/* Source context used */}
          {generated.sourceContext && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              {Object.entries(generated.sourceContext).filter(([,v]) => v).map(([k]) => (
                <span key={k} style={{ fontSize: 10, padding: '3px 9px', borderRadius: 20, background: 'rgba(61,191,150,0.1)', color: 'var(--accent)', border: '1px solid rgba(61,191,150,0.2)', fontWeight: 600 }}>
                  <CheckCircle size={9} style={{ marginRight: 3 }} />{k.replace('used','').replace(/([A-Z])/g,' $1').trim()}
                </span>
              ))}
            </div>
          )}

          {/* Exercises preview */}
          {generated.workout.exercises?.length > 0 && (
            <div style={{ maxHeight: 240, overflowY: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
              {generated.workout.exercises.map((ex: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: i < generated.workout.exercises.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#a78bfa', flexShrink: 0 }}>{i+1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{ex.exerciseName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ex.category} · {ex.sets}×{ex.reps} · Rest {ex.restSeconds}s</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && <p style={{ color: 'var(--danger)', fontSize: 12, margin: '10px 0 0' }}>{error}</p>}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 20 }}>
            <OutlineBtn onClick={() => setStep('config')} style={{ fontSize: 12 }}>← Regenerate</OutlineBtn>
            <div style={{ display: 'flex', gap: 10 }}>
              <OutlineBtn onClick={onClose}>Discard</OutlineBtn>
              <PrimaryBtn onClick={saveWorkout} loading={loading} style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', minWidth: 140 }}>
                {loading ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : <><CheckCircle size={14} /> Assign to Member</>}
              </PrimaryBtn>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}

// ─── Macro Calculator Panel ──────────────────────────────
function MacroCalculatorPanel({ memberId, onMacrosCalculated }: {
  memberId: string;
  onMacrosCalculated: (macros: any) => void;
}) {
  const [form, setForm] = useState({ goal: 'FAT_LOSS', heightCm: 170, weightKg: 75, age: 28, gender: 'male', activityLevel: 'moderate', targetRate: 'standard' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const calculate = async () => {
    setError(''); setLoading(true);
    try {
      const res = await api.ai.calculateMacros({ memberId, ...form, heightCm: Number(form.heightCm), weightKg: Number(form.weightKg), age: Number(form.age) });
      setResult(res);
      onMacrosCalculated(res);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(239,68,68,0.04))', borderRadius: 14, padding: 18, border: '1px solid rgba(245,158,11,0.2)', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Brain size={16} color="#f59e0b" />
        <span style={{ fontWeight: 800, fontSize: 14 }}>AI Macro Calculator</span>
        <AIBadge label="Powered by AI" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px,1fr))', gap: 10, marginBottom: 12 }}>
        <FormField label="Goal">
          <select style={inputStyle} value={form.goal} onChange={f('goal')}>
            {['FAT_LOSS','MUSCLE_GAIN','MAINTENANCE','ENDURANCE'].map(g => <option key={g} value={g}>{g.replace(/_/g,' ')}</option>)}
          </select>
        </FormField>
        <FormField label="Height (cm)">
          <input type="number" style={inputStyle} value={form.heightCm} onChange={f('heightCm')} />
        </FormField>
        <FormField label="Weight (kg)">
          <input type="number" style={inputStyle} value={form.weightKg} onChange={f('weightKg')} />
        </FormField>
        <FormField label="Age">
          <input type="number" style={inputStyle} value={form.age} onChange={f('age')} />
        </FormField>
        <FormField label="Gender">
          <select style={inputStyle} value={form.gender} onChange={f('gender')}>
            <option value="male">Male</option><option value="female">Female</option>
          </select>
        </FormField>
        <FormField label="Activity">
          <select style={inputStyle} value={form.activityLevel} onChange={f('activityLevel')}>
            {['sedentary','light','moderate','active','very_active'].map(a => <option key={a} value={a}>{a.replace('_',' ')}</option>)}
          </select>
        </FormField>
      </div>
      {error && <p style={{ color: 'var(--danger)', fontSize: 11, margin: '0 0 8px' }}>{error}</p>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <OutlineBtn onClick={calculate} style={{ fontSize: 12, padding: '7px 16px' }}>
          {loading ? <><Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> Calculating…</> : <><Brain size={12} /> Calculate Macros</>}
        </OutlineBtn>
        {result && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { label: 'Calories', val: result.calorieTarget, unit: 'kcal', color: '#f59e0b' },
              { label: 'Protein', val: result.proteinTargetG, unit: 'g', color: '#22c55e' },
              { label: 'Carbs', val: result.carbsTargetG, unit: 'g', color: '#3b82f6' },
              { label: 'Fat', val: result.fatTargetG, unit: 'g', color: '#f97316' },
            ].map(m => (
              <div key={m.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: m.color }}>{m.val}<span style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 1 }}>{m.unit}</span></div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {result?.explanation && (
        <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-secondary)', padding: '6px 10px', background: 'rgba(61,191,150,0.07)', borderRadius: 7, borderLeft: '2px solid var(--accent)' }}>
          💡 {result.explanation}
        </div>
      )}
    </div>
  );
}

// ─── AI Diet Generator Modal ──────────────────────────────
function AIDietGeneratorModal({ open, onClose, memberId, orgId, branchId, onSaved }: {
  open: boolean; onClose: () => void; memberId: string;
  orgId: string; branchId: string; onSaved: () => void;
}) {
  const [step, setStep] = useState<'config'|'generated'|'saving'>('config');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState<any>(null);
  const [form, setForm] = useState({
    goal: 'FAT_LOSS', dietType: 'VEGETARIAN', budget: 'MEDIUM', cuisine: 'INDIAN',
    calorieTarget: 1900, proteinTargetG: 120, mealsPerDay: 5,
    allergies: '', avoidFoods: '',
  });

  useEffect(() => { if (open) { setStep('config'); setGenerated(null); setError(''); } }, [open]);

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const handleMacros = (macros: any) => {
    if (macros?.calorieTarget) setForm(p => ({ ...p, calorieTarget: macros.calorieTarget, proteinTargetG: macros.proteinTargetG || p.proteinTargetG }));
  };

  const generate = async () => {
    setError(''); setLoading(true);
    try {
      const res = await api.ai.generateDietPlan({
        memberId, organizationId: orgId, branchId,
        goal: form.goal, dietType: form.dietType, budget: form.budget, cuisine: form.cuisine,
        calorieTarget: Number(form.calorieTarget), proteinTargetG: Number(form.proteinTargetG),
        mealsPerDay: Number(form.mealsPerDay),
        allergies: form.allergies ? form.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
        avoidFoods: form.avoidFoods ? form.avoidFoods.split(',').map(s => s.trim()).filter(Boolean) : [],
        save: false,
      });
      setGenerated(res);
      setStep('generated');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const saveDiet = async () => {
    if (!generated?.dietPlan) return;
    setLoading(true); setStep('saving');
    try {
      await api.trainer.createDietPlan(memberId, {
        organizationId: orgId, branchId, createdByType: 'AI',
        ...generated.dietPlan,
      });
      onSaved(); onClose();
    } catch (e: any) { setError(e.message); setStep('generated'); }
    finally { setLoading(false); }
  };

  const MEAL_TYPES_BY_COUNT: Record<number, string[]> = {
    3: ['Breakfast','Lunch','Dinner'],
    4: ['Breakfast','Lunch','Evening Snack','Dinner'],
    5: ['Breakfast','Mid-Morning','Lunch','Evening Snack','Dinner'],
    6: ['Breakfast','Mid-Morning','Lunch','Pre-Workout','Dinner','Post-Workout'],
  };

  return (
    <Modal open={open} onClose={onClose} title="" width={760}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,#059669,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Salad size={20} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 900 }}>AI Diet Plan Generator</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {step === 'config' ? 'Personalized Indian nutrition plans with macro tracking' : 'Review your AI-generated diet plan'}
          </div>
        </div>
        {step === 'generated' && <AIBadge label="AI Generated" />}
      </div>

      {step === 'config' && (
        <>
          {/* Macro Calculator */}
          <MacroCalculatorPanel memberId={memberId} onMacrosCalculated={handleMacros} />

          {/* Diet Config */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px,1fr))', gap: 14, marginBottom: 14 }}>
            <FormField label="Goal">
              <select style={inputStyle} value={form.goal} onChange={f('goal')}>
                {['FAT_LOSS','MUSCLE_GAIN','MAINTENANCE','DIABETIC','KETO'].map(g => <option key={g} value={g}>{g.replace(/_/g,' ')}</option>)}
              </select>
            </FormField>
            <FormField label="Diet Type">
              <select style={inputStyle} value={form.dietType} onChange={f('dietType')}>
                {['VEGETARIAN','NON_VEG','VEGAN','EGGETARIAN','KETO','DIABETIC'].map(d => <option key={d} value={d}>{d.replace(/_/g,' ')}</option>)}
              </select>
            </FormField>
            <FormField label="Budget">
              <select style={inputStyle} value={form.budget} onChange={f('budget')}>
                {['LOW','MEDIUM','HIGH'].map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </FormField>
            <FormField label="Cuisine">
              <select style={inputStyle} value={form.cuisine} onChange={f('cuisine')}>
                {['INDIAN','SOUTH_INDIAN','NORTH_INDIAN','CONTINENTAL','MIXED'].map(c => <option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}
              </select>
            </FormField>
            <FormField label="Calorie Target">
              <input type="number" style={inputStyle} value={form.calorieTarget} onChange={f('calorieTarget')} />
            </FormField>
            <FormField label="Protein (g)">
              <input type="number" style={inputStyle} value={form.proteinTargetG} onChange={f('proteinTargetG')} />
            </FormField>
            <FormField label="Meals / Day">
              <select style={inputStyle} value={form.mealsPerDay} onChange={f('mealsPerDay')}>
                {[3,4,5,6].map(n => <option key={n} value={n}>{n} meals</option>)}
              </select>
            </FormField>
          </div>

          {/* Meals preview chips */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            {(MEAL_TYPES_BY_COUNT[Number(form.mealsPerDay)] || []).map((m, i) => (
              <span key={m} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)', fontWeight: 600 }}>
                {i+1}. {m}
              </span>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormField label="Allergies (comma-separated)">
              <input style={inputStyle} value={form.allergies} onChange={f('allergies')} placeholder="peanuts, dairy" />
            </FormField>
            <FormField label="Foods to Avoid">
              <input style={inputStyle} value={form.avoidFoods} onChange={f('avoidFoods')} placeholder="soy, refined sugar" />
            </FormField>
          </div>

          {error && <p style={{ color: 'var(--danger)', fontSize: 12, margin: '10px 0 0' }}>{error}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <OutlineBtn onClick={onClose}>Cancel</OutlineBtn>
            <PrimaryBtn onClick={generate} loading={loading} style={{ background: 'linear-gradient(135deg,#059669,#10b981)', minWidth: 160 }}>
              {loading ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</> : <><Sparkles size={14} /> Generate Diet Plan</>}
            </PrimaryBtn>
          </div>
        </>
      )}

      {(step === 'generated' || step === 'saving') && generated?.dietPlan && (
        <>
          {/* Plan header */}
          <div style={{ background: 'linear-gradient(135deg, rgba(5,150,105,0.08), rgba(16,185,129,0.06))', borderRadius: 14, padding: 20, border: '1px solid rgba(16,185,129,0.2)', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 4 }}>{generated.dietPlan.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{generated.dietPlan.goal?.replace(/_/g,' ')} · {generated.dietPlan.metadata?.dietType} · {generated.dietPlan.metadata?.cuisine}</div>
              </div>
              <AIBadge />
            </div>
            {/* Macro totals */}
            {generated.dailyTotals && (
              <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[
                  { label: 'Calories', val: generated.dailyTotals.calories, unit: 'kcal', color: '#f59e0b' },
                  { label: 'Protein', val: generated.dailyTotals.proteinG, unit: 'g', color: '#22c55e' },
                  { label: 'Carbs', val: generated.dailyTotals.carbsG, unit: 'g', color: '#3b82f6' },
                  { label: 'Fat', val: generated.dailyTotals.fatG, unit: 'g', color: '#f97316' },
                ].map(m => (
                  <div key={m.label} style={{ flex: '1 1 80px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: m.color }}>{m.val}<span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 2 }}>{m.unit}</span></div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Meal items */}
          {generated.dietPlan.items?.length > 0 && (
            <div style={{ maxHeight: 260, overflowY: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
              {generated.dietPlan.items.map((item: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: i < generated.dietPlan.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(16,185,129,0.1)', color: '#10b981', fontWeight: 600, whiteSpace: 'nowrap' }}>{item.mealType}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{item.foodName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.quantity} {item.servingUnit} · {item.calories} kcal · P: {item.proteinG}g</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && <p style={{ color: 'var(--danger)', fontSize: 12, margin: '10px 0 0' }}>{error}</p>}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 20 }}>
            <OutlineBtn onClick={() => setStep('config')} style={{ fontSize: 12 }}>← Regenerate</OutlineBtn>
            <div style={{ display: 'flex', gap: 10 }}>
              <OutlineBtn onClick={onClose}>Discard</OutlineBtn>
              <PrimaryBtn onClick={saveDiet} loading={loading} style={{ background: 'linear-gradient(135deg,#059669,#10b981)', minWidth: 140 }}>
                {loading ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : <><CheckCircle size={14} /> Assign to Member</>}
              </PrimaryBtn>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}

// ─── Plateau Detection Dashboard ────────────────────────
function PlateauDashboard({ members, orgId, branchId }: {
  members: any[]; orgId: string; branchId: string;
}) {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [optResult, setOptResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [expandedSection, setExpandedSection] = useState<string|null>('alerts');

  const analyze = async () => {
    if (!selectedMemberId) return;
    setError(''); setLoading(true); setData(null); setOptResult(null);
    try {
      const res = await api.ai.getPlateauDashboard(selectedMemberId, { organizationId: orgId, branchId, days });
      setData(res);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const optimize = async () => {
    if (!data || !selectedMemberId) return;
    setOptimizing(true); setOptResult(null);
    try {
      const res = await api.ai.optimizePlateau(selectedMemberId, {
        organizationId: orgId, branchId, days,
        focus: data.alerts?.map((a: any) => a.type) || [],
        saveChanges: false,
      });
      setOptResult(res);
    } catch (e: any) { setError(e.message); }
    finally { setOptimizing(false); }
  };

  const SEVERITY_COLORS: Record<string, string> = {
    high: '#ef4444', medium: '#f59e0b', low: '#22c55e',
  };
  const SEVERITY_BG: Record<string, string> = {
    high: 'rgba(239,68,68,0.08)', medium: 'rgba(245,158,11,0.08)', low: 'rgba(34,197,94,0.08)',
  };
  const SCORE_COLOR = (score: number) => score >= 70 ? '#22c55e' : score >= 45 ? '#f59e0b' : '#ef4444';

  const ScoreRing = ({ score, label }: { score: number; label: string }) => {
    const c = SCORE_COLOR(score);
    const pct = Math.min(100, score);
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto' }}>
          <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="36" cy="36" r="28" fill="none" stroke="var(--border)" strokeWidth="6" />
            <circle cx="36" cy="36" r="28" fill="none" stroke={c} strokeWidth="6"
              strokeDasharray={`${2*Math.PI*28 * pct/100} ${2*Math.PI*28}`} strokeLinecap="round" />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: c }}>{score}</div>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, fontWeight: 600 }}>{label}</div>
      </div>
    );
  };

  const ExpandableSection = ({ id, title, icon, count, children }: any) => (
    <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
      <button onClick={() => setExpandedSection(expandedSection === id ? null : id)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {icon}
          <span style={{ fontWeight: 800, fontSize: 14 }}>{title}</span>
          {count > 0 && <span style={{ fontSize: 10, background: 'var(--metric-bg)', padding: '2px 8px', borderRadius: 20, color: 'var(--text-muted)', fontWeight: 600 }}>{count}</span>}
        </div>
        {expandedSection === id ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
      </button>
      {expandedSection === id && <div style={{ padding: '0 18px 16px' }}>{children}</div>}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={18} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Plateau Detection AI</h2>
              <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: 12 }}>Identify why members stall and get AI-powered corrective actions</p>
            </div>
          </div>
        </div>
        <AIBadge label="AI Analysis" />
      </div>

      {/* Member Selector */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 18, border: '1px solid var(--border)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 220px' }}>
          <FormField label="Select Member">
            <select style={inputStyle} value={selectedMemberId} onChange={e => setSelectedMemberId(e.target.value)}>
              <option value="">— Choose a member —</option>
              {members.map(m => <option key={m.userId} value={m.userId}>{memberName(m)}</option>)}
            </select>
          </FormField>
        </div>
        <FormField label="Analysis Period">
          <select style={inputStyle} value={days} onChange={e => setDays(Number(e.target.value))}>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </FormField>
        <PrimaryBtn onClick={analyze} loading={loading} style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', minWidth: 150, marginBottom: 2 }}>
          {loading ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing…</> : <><Brain size={14} /> Run Analysis</>}
        </PrimaryBtn>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#ef4444' }}>
          <AlertCircle size={14} style={{ marginRight: 6 }} />{error}
        </div>
      )}

      {data && (
        <>
          {/* Score Cards */}
          <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.07), rgba(139,92,246,0.05))', borderRadius: 16, padding: 24, border: '1px solid rgba(99,102,241,0.2)' }}>
            <SectionHeader title="Health Scores" />
            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 16, marginTop: 8 }}>
              {data.scores && <>
                <ScoreRing score={data.scores.dietComplianceScore} label="Diet Compliance" />
                <ScoreRing score={data.scores.recoveryScore} label="Recovery" />
                <ScoreRing score={data.scores.trainingConsistencyScore} label="Training" />
                <ScoreRing score={data.scores.plateauRiskScore} label="Plateau Risk" />
              </>}
            </div>
          </div>

          {/* Alerts */}
          <ExpandableSection id="alerts" title="Active Alerts" icon={<AlertTriangle size={16} color="#f59e0b" />} count={data.alerts?.length || 0}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(data.alerts || []).length === 0 && (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>
                  <CheckCircle size={24} style={{ color: '#22c55e', marginBottom: 8 }} /><br/>No plateau alerts — member is progressing well!
                </div>
              )}
              {(data.alerts || []).map((alert: any, i: number) => (
                <div key={i} style={{ padding: '14px 16px', borderRadius: 12, background: SEVERITY_BG[alert.severity] || 'var(--bg-base)', border: `1px solid ${SEVERITY_COLORS[alert.severity] || 'var(--border)'}33` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <AlertTriangle size={14} color={SEVERITY_COLORS[alert.severity]} />
                    <span style={{ fontWeight: 800, fontSize: 13 }}>{alert.title}</span>
                    <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 20, background: SEVERITY_COLORS[alert.severity] + '22', color: SEVERITY_COLORS[alert.severity], fontWeight: 700, textTransform: 'uppercase' }}>{alert.severity}</span>
                  </div>
                  {alert.evidence && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {Object.entries(alert.evidence).map(([k, v]) => (
                        <span key={k} style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--metric-bg)', padding: '2px 8px', borderRadius: 20 }}>
                          {k.replace(/([A-Z])/g,' $1').trim()}: <strong>{String(v)}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ExpandableSection>

          {/* AI Suggestions */}
          <ExpandableSection id="suggestions" title="AI Recommendations" icon={<Lightbulb size={16} color="#a78bfa" />} count={data.suggestions?.length || 0}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(data.suggestions || []).map((s: any, i: number) => (
                <div key={i} style={{ padding: '14px 16px', borderRadius: 12, background: 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(99,102,241,0.04))', border: '1px solid rgba(139,92,246,0.18)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <Sparkles size={13} color="#a78bfa" />
                    <span style={{ fontWeight: 800, fontSize: 13 }}>{s.text}</span>
                    <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 20, background: 'rgba(139,92,246,0.15)', color: '#a78bfa', fontWeight: 700, textTransform: 'uppercase' }}>{s.priority}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.reason}</div>
                </div>
              ))}
            </div>
          </ExpandableSection>

          {/* Generate Optimization Plan */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 20, border: '1px solid var(--border)', textAlign: 'center' }}>
            <Bot size={32} style={{ color: '#6366f1', marginBottom: 10 }} />
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>Generate Full Optimization Plan</div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px', maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>
              AI will create a personalized workout + diet + recovery plan to break through the plateau.
            </p>
            <PrimaryBtn onClick={optimize} loading={optimizing} style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              {optimizing ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Generating Plan…</> : <><Zap size={14} /> Generate Optimization Plan</>}
            </PrimaryBtn>
          </div>

          {/* Optimization Result */}
          {optResult?.optimizationPlan && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { key: 'workoutSuggestions', label: 'Workout Changes', icon: <Dumbbell size={15} color="#3b82f6" />, color: '#3b82f6' },
                { key: 'dietSuggestions', label: 'Diet Changes', icon: <Salad size={15} color="#10b981" />, color: '#10b981' },
                { key: 'recoverySuggestions', label: 'Recovery Advice', icon: <Activity size={15} color="#f59e0b" />, color: '#f59e0b' },
              ].map(section => {
                const items = optResult.optimizationPlan[section.key] || [];
                if (!items.length) return null;
                return (
                  <div key={section.key} style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 18, border: `1px solid ${section.color}33` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      {section.icon}
                      <span style={{ fontWeight: 800, fontSize: 14, color: section.color }}>{section.label}</span>
                    </div>
                    {items.map((item: any, i: number) => (
                      <div key={i} style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--bg-base)', marginBottom: 8, borderLeft: `3px solid ${section.color}` }}>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{item.change}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Expected: {item.expectedImpact}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {!data && !loading && (
        <div style={{ textAlign: 'center', padding: 64, background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)' }}>
          <Brain size={48} style={{ color: '#6366f1', opacity: 0.4, marginBottom: 14 }} />
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Select a Member to Analyze</div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 380, margin: '0 auto' }}>
            Choose a member and click Run Analysis to detect plateaus, stagnation patterns, and get AI-powered corrective suggestions.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Manual Workout Form Modal ────────────────────────────
function WorkoutFormModal({ open, onClose, memberId, orgId, branchId, onSaved }: {
  open: boolean; onClose: () => void; memberId: string;
  orgId: string; branchId: string; onSaved: () => void;
}) {
  const initExercise = () => ({ exerciseName: '', category: 'CARDIO', sets: 3, reps: 12, durationMin: 0, restSeconds: 60, sequenceNo: 1, notes: '' });
  const [form, setForm] = useState({ title: '', goal: 'FAT_LOSS', level: 'BEGINNER', startDate: '', endDate: '', exercises: [initExercise()] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (open) { setForm({ title: '', goal: 'FAT_LOSS', level: 'BEGINNER', startDate: '', endDate: '', exercises: [initExercise()] }); setError(''); } }, [open]);

  const fMain = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(p => ({ ...p, [k]: e.target.value }));
  const fEx = (i: number, k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => { const exercises = [...p.exercises]; exercises[i] = { ...exercises[i], [k]: e.target.value }; return { ...p, exercises }; });

  const addEx = () => setForm(p => ({ ...p, exercises: [...p.exercises, { ...initExercise(), sequenceNo: p.exercises.length + 1 }] }));
  const removeEx = (i: number) => setForm(p => ({ ...p, exercises: p.exercises.filter((_, idx) => idx !== i) }));

  const submit = async () => {
    if (!form.title) { setError('Title is required.'); return; }
    setError(''); setLoading(true);
    try {
      await api.trainer.createWorkout(memberId, {
        organizationId: orgId, branchId, createdByType: 'TRAINER', ...form,
        exercises: form.exercises.map((e, i) => ({ ...e, sequenceNo: i + 1, sets: Number(e.sets), reps: Number(e.reps), durationMin: Number(e.durationMin), restSeconds: Number(e.restSeconds) })),
      });
      onSaved(); onClose();
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Workout Plan (Manual)" width={680}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FormField label="Title" required><input style={inputStyle} value={form.title} onChange={fMain('title')} placeholder="Fat Loss Beginner Plan" /></FormField>
        <FormField label="Goal">
          <select style={inputStyle} value={form.goal} onChange={fMain('goal')}>
            {['FAT_LOSS','MUSCLE_GAIN','MAINTENANCE','ENDURANCE','STRENGTH'].map(g => <option key={g} value={g}>{g.replace('_',' ')}</option>)}
          </select>
        </FormField>
        <FormField label="Level">
          <select style={inputStyle} value={form.level} onChange={fMain('level')}>
            {['BEGINNER','INTERMEDIATE','ADVANCED'].map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </FormField>
        <FormField label="Start Date"><input type="date" style={inputStyle} value={form.startDate} onChange={fMain('startDate')} /></FormField>
        <FormField label="End Date"><input type="date" style={inputStyle} value={form.endDate} onChange={fMain('endDate')} /></FormField>
      </div>
      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', margin: 0 }}>Exercises</p>
          <OutlineBtn onClick={addEx} style={{ fontSize: 11, padding: '5px 10px' }}><Plus size={12} /> Add Exercise</OutlineBtn>
        </div>
        {form.exercises.map((ex, i) => (
          <div key={i} style={{ background: 'var(--bg-base)', borderRadius: 12, padding: 14, marginBottom: 10, border: '1px solid var(--border)', position: 'relative' }}>
            <button onClick={() => removeEx(i)} style={{ position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', background: 'rgba(229,62,62,0.08)', border: '1px solid rgba(229,62,62,0.2)' }}><X size={11} /></button>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 10 }}>
              <FormField label="Exercise Name"><input style={inputStyle} value={ex.exerciseName} onChange={fEx(i,'exerciseName')} placeholder="Treadmill Walk" /></FormField>
              <FormField label="Category">
                <select style={inputStyle} value={ex.category} onChange={fEx(i,'category')}>
                  {['CARDIO','STRENGTH','FLEXIBILITY','HIIT','YOGA'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormField>
              <FormField label="Sets"><input type="number" style={inputStyle} value={ex.sets} onChange={fEx(i,'sets')} /></FormField>
              <FormField label="Reps"><input type="number" style={inputStyle} value={ex.reps} onChange={fEx(i,'reps')} /></FormField>
              <FormField label="Duration (min)"><input type="number" style={inputStyle} value={ex.durationMin} onChange={fEx(i,'durationMin')} /></FormField>
              <FormField label="Rest (sec)"><input type="number" style={inputStyle} value={ex.restSeconds} onChange={fEx(i,'restSeconds')} /></FormField>
            </div>
          </div>
        ))}
      </div>
      {error && <p style={{ color: 'var(--danger)', fontSize: 12, margin: 0 }}>{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <OutlineBtn onClick={onClose}>Cancel</OutlineBtn>
        <PrimaryBtn onClick={submit} loading={loading}>Create Plan</PrimaryBtn>
      </div>
    </Modal>
  );
}

// ─── Manual Diet Plan Modal ────────────────────────────────
function DietPlanModal({ open, onClose, memberId, orgId, branchId, onSaved }: {
  open: boolean; onClose: () => void; memberId: string;
  orgId: string; branchId: string; onSaved: () => void;
}) {
  const initItem = () => ({ mealType: 'breakfast', foodName: '', quantity: 1, servingUnit: 'serving', calories: 0, proteinG: 0, carbsG: 0, fatG: 0, sequenceNo: 1, notes: '' });
  const [form, setForm] = useState({ title: '', goal: 'FAT_LOSS', calorieTarget: 2000, proteinTargetG: 120, startDate: '', endDate: '', items: [initItem()] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (open) { setForm({ title: '', goal: 'FAT_LOSS', calorieTarget: 2000, proteinTargetG: 120, startDate: '', endDate: '', items: [initItem()] }); setError(''); } }, [open]);

  const fMain = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(p => ({ ...p, [k]: e.target.value }));
  const fItem = (i: number, k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => { const items = [...p.items]; items[i] = { ...items[i], [k]: e.target.value }; return { ...p, items }; });

  const addItem = () => setForm(p => ({ ...p, items: [...p.items, { ...initItem(), sequenceNo: p.items.length + 1 }] }));
  const removeItem = (i: number) => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));

  const submit = async () => {
    if (!form.title) { setError('Title is required.'); return; }
    setError(''); setLoading(true);
    try {
      await api.trainer.createDietPlan(memberId, {
        organizationId: orgId, branchId, createdByType: 'TRAINER', ...form,
        calorieTarget: Number(form.calorieTarget), proteinTargetG: Number(form.proteinTargetG),
        items: form.items.map((item, i) => ({ ...item, sequenceNo: i + 1, quantity: Number(item.quantity), calories: Number(item.calories), proteinG: Number(item.proteinG), carbsG: Number(item.carbsG), fatG: Number(item.fatG) })),
      });
      onSaved(); onClose();
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Diet Plan (Manual)" width={680}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FormField label="Title" required><input style={inputStyle} value={form.title} onChange={fMain('title')} placeholder="High Protein Fat Loss" /></FormField>
        <FormField label="Goal">
          <select style={inputStyle} value={form.goal} onChange={fMain('goal')}>
            {['FAT_LOSS','MUSCLE_GAIN','MAINTENANCE','DIABETIC','KETO'].map(g => <option key={g} value={g}>{g.replace('_',' ')}</option>)}
          </select>
        </FormField>
        <FormField label="Calorie Target"><input type="number" style={inputStyle} value={form.calorieTarget} onChange={fMain('calorieTarget')} /></FormField>
        <FormField label="Protein Target (g)"><input type="number" style={inputStyle} value={form.proteinTargetG} onChange={fMain('proteinTargetG')} /></FormField>
        <FormField label="Start Date"><input type="date" style={inputStyle} value={form.startDate} onChange={fMain('startDate')} /></FormField>
        <FormField label="End Date"><input type="date" style={inputStyle} value={form.endDate} onChange={fMain('endDate')} /></FormField>
      </div>
      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', margin: 0 }}>Meal Items</p>
          <OutlineBtn onClick={addItem} style={{ fontSize: 11, padding: '5px 10px' }}><Plus size={12} /> Add Item</OutlineBtn>
        </div>
        {form.items.map((item, i) => (
          <div key={i} style={{ background: 'var(--bg-base)', borderRadius: 12, padding: 14, marginBottom: 10, border: '1px solid var(--border)', position: 'relative' }}>
            <button onClick={() => removeItem(i)} style={{ position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', background: 'rgba(229,62,62,0.08)', border: '1px solid rgba(229,62,62,0.2)' }}><X size={11} /></button>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 10 }}>
              <FormField label="Meal Type">
                <select style={inputStyle} value={item.mealType} onChange={fItem(i,'mealType')}>
                  {['breakfast','lunch','dinner','snack','pre_workout','post_workout'].map(m => <option key={m} value={m}>{m.replace('_',' ')}</option>)}
                </select>
              </FormField>
              <FormField label="Food Name"><input style={inputStyle} value={item.foodName} onChange={fItem(i,'foodName')} placeholder="Oats with whey" /></FormField>
              <FormField label="Qty"><input type="number" style={inputStyle} value={item.quantity} onChange={fItem(i,'quantity')} /></FormField>
              <FormField label="Unit"><input style={inputStyle} value={item.servingUnit} onChange={fItem(i,'servingUnit')} placeholder="bowl" /></FormField>
              <FormField label="Calories"><input type="number" style={inputStyle} value={item.calories} onChange={fItem(i,'calories')} /></FormField>
              <FormField label="Protein (g)"><input type="number" style={inputStyle} value={item.proteinG} onChange={fItem(i,'proteinG')} /></FormField>
              <FormField label="Carbs (g)"><input type="number" style={inputStyle} value={item.carbsG} onChange={fItem(i,'carbsG')} /></FormField>
              <FormField label="Fat (g)"><input type="number" style={inputStyle} value={item.fatG} onChange={fItem(i,'fatG')} /></FormField>
            </div>
          </div>
        ))}
      </div>
      {error && <p style={{ color: 'var(--danger)', fontSize: 12, margin: 0 }}>{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <OutlineBtn onClick={onClose}>Cancel</OutlineBtn>
        <PrimaryBtn onClick={submit} loading={loading}>Create Diet Plan</PrimaryBtn>
      </div>
    </Modal>
  );
}

// ─── Measurement Modal ─────────────────────────────────────
function MeasurementModal({ open, onClose, memberId, onSaved }: {
  open: boolean; onClose: () => void; memberId: string; onSaved: () => void;
}) {
  const [form, setForm] = useState({ measurementDate: new Date().toISOString().split('T')[0], chestCm: '', waistCm: '', hipCm: '', armCm: '', thighCm: '', bodyFatPercent: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (open) { setForm({ measurementDate: new Date().toISOString().split('T')[0], chestCm: '', waistCm: '', hipCm: '', armCm: '', thighCm: '', bodyFatPercent: '', notes: '' }); setError(''); } }, [open]);

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    setError(''); setLoading(true);
    try {
      const payload: any = { measurementDate: form.measurementDate, notes: form.notes };
      if (form.chestCm) payload.chestCm = Number(form.chestCm);
      if (form.waistCm) payload.waistCm = Number(form.waistCm);
      if (form.hipCm) payload.hipCm = Number(form.hipCm);
      if (form.armCm) payload.armCm = Number(form.armCm);
      if (form.thighCm) payload.thighCm = Number(form.thighCm);
      if (form.bodyFatPercent) payload.bodyFatPercent = Number(form.bodyFatPercent);
      await api.trainer.addMeasurement(memberId, payload);
      onSaved(); onClose();
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Body Measurement" width={520}>
      <FormField label="Measurement Date"><input type="date" style={inputStyle} value={form.measurementDate} onChange={f('measurementDate')} /></FormField>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <FormField label="Chest (cm)"><input type="number" style={inputStyle} value={form.chestCm} onChange={f('chestCm')} placeholder="100" /></FormField>
        <FormField label="Waist (cm)"><input type="number" style={inputStyle} value={form.waistCm} onChange={f('waistCm')} placeholder="86" /></FormField>
        <FormField label="Hip (cm)"><input type="number" style={inputStyle} value={form.hipCm} onChange={f('hipCm')} placeholder="96" /></FormField>
        <FormField label="Arm (cm)"><input type="number" style={inputStyle} value={form.armCm} onChange={f('armCm')} placeholder="34" /></FormField>
        <FormField label="Thigh (cm)"><input type="number" style={inputStyle} value={form.thighCm} onChange={f('thighCm')} placeholder="55" /></FormField>
        <FormField label="Body Fat %"><input type="number" style={inputStyle} value={form.bodyFatPercent} onChange={f('bodyFatPercent')} placeholder="22" /></FormField>
      </div>
      <FormField label="Notes"><input style={inputStyle} value={form.notes} onChange={f('notes')} placeholder="Visible improvement..." /></FormField>
      {error && <p style={{ color: 'var(--danger)', fontSize: 12, margin: 0 }}>{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <OutlineBtn onClick={onClose}>Cancel</OutlineBtn>
        <PrimaryBtn onClick={submit} loading={loading}>Save Measurement</PrimaryBtn>
      </div>
    </Modal>
  );
}

// ─── Animated Sparkline SVG ──────────────────────────────
function Sparkline({ data, color = '#22c55e', height = 40, width = 120 }: { data: number[]; color?: string; height?: number; width?: number }) {
  const [drawn, setDrawn] = React.useState(false);
  React.useEffect(() => { const t = setTimeout(() => setDrawn(true), 80); return () => clearTimeout(t); }, []);
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 6) - 3;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
        style={{ strokeDasharray: drawn ? 'none' : 1000, strokeDashoffset: drawn ? 0 : 1000, transition: 'stroke-dashoffset 0.8s ease' }} />
    </svg>
  );
}

// ─── Animated Bar Chart ───────────────────────────────────
function AnimatedBars({ data, height = 120 }: { data: { label: string; value: number; color?: string }[]; height?: number }) {
  const [progress, setProgress] = React.useState(0);
  React.useEffect(() => {
    let frame = 0;
    const total = 30;
    const tick = () => { frame++; setProgress(Math.min(frame / total, 1)); if (frame < total) requestAnimationFrame(tick); };
    const t = setTimeout(() => requestAnimationFrame(tick), 100);
    return () => clearTimeout(t);
  }, []);
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height }}>
      {data.map((d, i) => {
        const barH = Math.round((d.value / max) * (height - 24) * progress);
        const clr = d.color || (d.value >= 85 ? '#22c55e' : d.value >= 70 ? '#f59e0b' : '#ef4444');
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: clr }}>{d.value}%</span>
            <div style={{ width: '100%', height: barH, background: clr, borderRadius: '4px 4px 0 0', transition: 'height 0.6s cubic-bezier(.4,0,.2,1)', minHeight: 2 }} />
            <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Animated Donut ──────────────────────────────────────
function AnimatedDonut({ pct, size = 120, strokeWidth = 14, color = '#22c55e', label, sublabel }: { pct: number; size?: number; strokeWidth?: number; color?: string; label?: string; sublabel?: string }) {
  const [p, setP] = React.useState(0);
  React.useEffect(() => { const t = setTimeout(() => setP(pct), 100); return () => clearTimeout(t); }, [pct]);
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--metric-bg)" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={`${circ * p / 100} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {label && <div style={{ fontSize: size * 0.2, fontWeight: 900, lineHeight: 1 }}>{label}</div>}
        {sublabel && <div style={{ fontSize: size * 0.1, color: 'var(--text-muted)', marginTop: 2 }}>{sublabel}</div>}
      </div>
    </div>
  );
}

// ─── Multi-line progress chart ────────────────────────────
function ProgressLineChart({ data }: { data: { labels: string[]; weight: number[]; bodyFat: number[]; muscle: number[] } }) {
  const [drawn, setDrawn] = React.useState(false);
  React.useEffect(() => { const t = setTimeout(() => setDrawn(true), 150); return () => clearTimeout(t); }, []);
  const W = 360, H = 160;
  const labels = data.labels || [];
  const n = Math.max(data.weight.length, data.bodyFat.length, data.muscle.length, 1);

  const scaleY = (arr: number[], idx: number, minY: number, maxY: number) => {
    if (!arr[idx] && arr[idx] !== 0) return H / 2;
    return H - 10 - ((arr[idx] - minY) / (maxY - minY || 1)) * (H - 20);
  };
  const path = (arr: number[], minY: number, maxY: number) =>
    arr.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i / (n - 1)) * (W - 20) + 10},${scaleY(arr, i, minY, maxY)}`).join(' ');

  const wMin = Math.min(...data.weight) - 2, wMax = Math.max(...data.weight) + 2;
  const bfMin = Math.min(...data.bodyFat) - 2, bfMax = Math.max(...data.bodyFat) + 2;
  const mMin = Math.min(...data.muscle) - 1, mMax = Math.max(...data.muscle) + 1;

  const lines = [
    { pts: data.weight, min: wMin, max: wMax, color: '#f59e0b', label: 'Weight (kg)' },
    { pts: data.bodyFat, min: bfMin, max: bfMax, color: '#ef4444', label: 'Body Fat %' },
    { pts: data.muscle, min: mMin, max: mMax, color: '#3b82f6', label: 'Muscle Mass (kg)' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: 14, marginBottom: 10, flexWrap: 'wrap' }}>
        {lines.map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
            <div style={{ width: 24, height: 3, borderRadius: 4, background: l.color }} />
            <span style={{ color: 'var(--text-secondary)' }}>{l.label}</span>
          </div>
        ))}
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        {[0, 1, 2, 3, 4].map(i => (
          <line key={i} x1="10" y1={10 + i * (H - 20) / 4} x2={W - 10} y2={10 + i * (H - 20) / 4}
            stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4,4" />
        ))}
        {lines.map(l => {
          const d = path(l.pts, l.min, l.max);
          return (
            <path key={l.label} d={d} fill="none" stroke={l.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
              style={{ strokeDasharray: drawn ? 'none' : 2000, strokeDashoffset: drawn ? 0 : 2000, transition: 'stroke-dashoffset 1.2s ease' }} />
          );
        })}
        {labels.map((lbl, i) => (
          <text key={lbl} x={(i / (n - 1)) * (W - 20) + 10} y={H + 4} fontSize="9" fill="var(--text-muted)" textAnchor="middle">{lbl}</text>
        ))}
      </svg>
    </div>
  );
}

// ─── Trainer Dashboard Home ───────────────────────────────
function TrainerDashboardHome({ user, dashData, loadingDash, allMembers, onSelectMember, onTabChange, onRefresh }: {
  user: any; dashData: any; loadingDash: boolean; allMembers: any[];
  onSelectMember: (m: any) => void; onTabChange: (t: string) => void; onRefresh: () => void;
}) {
  const today = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

  const ps = dashData?.progressSummary || {};
  const schedToday: any[] = dashData?.todaySchedule || [];
  const alerts: any[] = dashData?.alerts || dashData?.todoAlerts || [];
  const recentActs: any[] = dashData?.recentActivities || [];
  const aiInsights: any[] = dashData?.aiInsights || [];

  const progressChartData = dashData?.progressChart || null;
  const hasProgressChart = progressChartData
    && nonEmptyArray(progressChartData.labels).length > 0
    && ['weight', 'bodyFat', 'muscle'].some(k => nonEmptyArray(progressChartData[k]).length > 0);
  const workoutWeekly: any[] = nonEmptyArray(dashData?.workoutWeekly);
  const attPct = safePct(dashData?.attendancePct ?? ps.attendancePct);
  const workoutCompletionRate = safePct(dashData?.workoutCompletionRate ?? dashData?.completionRate);
  const totalMembers = asNum(dashData?.assignedMembers ?? dashData?.totalMembers) ?? allMembers.length;
  const statusRows = nonEmptyArray(dashData?.memberStatusOverview).map((r: any) => {
    const count = asNum(r.count) ?? 0;
    return {
      label: r.status || 'Unknown',
      value: count,
      pct: totalMembers ? Math.round((count / totalMembers) * 100) : 0,
      color: r.status === 'Active' ? '#4ade80' : r.status === 'Inactive' ? '#fbbf24' : r.status === 'On Hold' ? '#3b82f6' : '#ef4444',
    };
  });
  const topPerformers = nonEmptyArray(dashData?.topPerformingMembers);
  const todaySummary = dashData?.todaySummary || {};

  if (loadingDash) return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <Loader size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
      <div style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: 13 }}>Loading dashboard…</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── Greeting bar ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px' }}>
            Good Morning, {user?.firstName || 'Trainer'}!
          </h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>
            Here's what's happening with your members today.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px' }}>{today}</span>
          <button onClick={onRefresh} style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* ── Top KPI cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
        {[
          { label: 'Total Members',      value: totalMembers || '—', sub: formatChange(ps.newThisMonth, ' this month'), color: '#8b5cf6', icon: <Users size={20} />, sparkData: dashData?.memberSparkline || [] },
          { label: 'Active Members',     value: dashData?.activeMembers ?? '—', sub: 'last 30 days', color: '#65a30d', icon: <Activity size={20} />, sparkData: dashData?.attendanceSparkline || [] },
          { label: "Today's Sessions",   value: dashData?.todaySessions ?? schedToday.length ?? '—', sub: formatChange(dashData?.sessionChange, ' vs yesterday'), color: '#3b82f6', icon: <CalendarCheck size={20} />, sparkData: dashData?.sessionSparkline || [] },
          { label: 'Calories Burned',    value: formatMetric(dashData?.totalCaloriesBurned), sub: 'last 7 days', color: '#f97316', icon: <Flame size={20} />, sparkData: dashData?.caloriesSparkline || [] },
          { label: 'Goal Completion',    value: dashData?.goalCompletionPct != null ? `${Math.round(asNum(dashData.goalCompletionPct) ?? 0)}%` : '—', sub: 'members near target', color: '#06b6d4', icon: <Target size={20} />, sparkData: dashData?.workoutSparkline || [] },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-card)', borderRadius: 14, padding: '16px 18px', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}18`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
              {nonEmptyArray(s.sparkData).length > 1 ? <Sparkline data={s.sparkData} color={s.color} height={32} width={80} /> : null}
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
            <div style={{ fontSize: 10, color: 'var(--accent)', marginTop: 3, fontWeight: 700 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Row 2: Members Overview + Progress Chart + Alerts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr 0.75fr', gap: 14 }}>
        {/* Member Status Overview */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontWeight: 800, fontSize: 14 }}>Member Status Overview</span>
            <button onClick={() => onTabChange('members')} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>View All</button>
          </div>
          <div style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 20, minHeight: 255 }}>
            <AnimatedDonut
              pct={safePct(dashData?.activeMembers && totalMembers ? (dashData.activeMembers / totalMembers) * 100 : 0)}
              size={150}
              strokeWidth={18}
              color="#4ade80"
              label={String(totalMembers || 0)}
              sublabel="Total Members"
            />
            <div style={{ flex: 1 }}>
              {(statusRows.length ? statusRows : [{ label: 'Active', value: dashData?.activeMembers || 0, pct: safePct(dashData?.activeMembers && totalMembers ? (dashData.activeMembers / totalMembers) * 100 : 0), color: '#4ade80' }]).map((r: any) => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13, fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: r.color, display: 'inline-block' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{r.label}</span>
                  </div>
                  <strong>{r.value} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({r.pct}%)</span></strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Progress Overview Chart */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontWeight: 800, fontSize: 14 }}>Progress Overview</span>
            <select style={{ ...inputStyle, fontSize: 11, padding: '4px 8px', width: 'auto' }}>
              <option>This Month</option><option>Last Month</option><option>Last 3 Months</option>
            </select>
          </div>
          {hasProgressChart ? <ProgressLineChart data={progressChartData} /> : (
            <div style={{ height: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12, border: '1px dashed var(--border)', borderRadius: 12 }}>
              No progress chart data yet.
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 14 }}>
            {[
              { label: 'Avg Weight', value: dashData?.avgWeight != null ? `${dashData.avgWeight} kg` : '—', change: formatChange(dashData?.avgWeightChange, ' kg'), color: '#f59e0b' },
              { label: 'Avg Body Fat', value: dashData?.avgBodyFat != null ? `${dashData.avgBodyFat}%` : '—', change: formatChange(dashData?.avgBodyFatChange, '%'), color: '#ef4444' },
              { label: 'Avg Muscle', value: dashData?.avgMuscle != null ? `${dashData.avgMuscle} kg` : '—', change: formatChange(dashData?.avgMuscleChange, ' kg'), color: '#3b82f6' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', padding: '10px 8px', background: 'var(--bg-base)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, marginTop: 2 }}>{s.change}</div>
              </div>
            ))}
          </div>
        </div>

        {/* To Do & Alerts */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 800, fontSize: 14 }}>To Do & Alerts</div>
          <div style={{ padding: '6px 0' }}>
            {alerts.length > 0 ? alerts.slice(0, 5).map((a: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--metric-bg)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <div style={{ width: 32, height: 32, borderRadius: 9, background: `${a.color || '#f59e0b'}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{a.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{a.desc}</div>
                </div>
                <ChevronRight size={13} color="var(--text-muted)" />
              </div>
            )) : <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No alerts from the database.</div>}
          </div>
          <div style={{ padding: '10px 14px' }}>
            <button style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>View All Alerts</button>
          </div>
        </div>
      </div>

      {/* ── Row 3: Attendance + Workout Completion + Upcoming + Distribution ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14 }}>
        {/* Attendance Summary */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontWeight: 800, fontSize: 14 }}>Attendance Summary</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--metric-bg)', padding: '3px 8px', borderRadius: 20, border: '1px solid var(--border)' }}>This Week</span>
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <AnimatedDonut pct={attPct} size={110} strokeWidth={12} color="#22c55e" label={`${attPct}%`} sublabel="Overall" />
            <div style={{ flex: 1 }}>
              {[
                { label: 'Present',  value: dashData?.attendancePresent  ?? 0, pct: attPct, color: '#22c55e' },
                { label: 'Partial',  value: dashData?.attendancePartial  ?? 0, pct: safePct(dashData?.attendancePartialPct), color: '#f59e0b' },
                { label: 'Absent',   value: dashData?.attendanceAbsent   ?? 0, pct: safePct(dashData?.attendanceAbsentPct), color: '#ef4444' },
                { label: 'No Plan',  value: dashData?.attendanceNoPlan   ?? 0, pct: safePct(dashData?.attendanceNoPlanPct), color: 'var(--text-muted)' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7, fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{r.label}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: r.color }}>{r.value} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({r.pct}%)</span></span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: 'var(--accent)', fontWeight: 700 }}>{formatChange(dashData?.attendanceVsLastWeek, '% vs last week')}</div>
        </div>

        {/* Workout Completion */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontWeight: 800, fontSize: 14 }}>Workout Completion</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--metric-bg)', padding: '3px 8px', borderRadius: 20, border: '1px solid var(--border)' }}>This Week</span>
          </div>
          {workoutWeekly.length > 0 ? <AnimatedBars data={workoutWeekly} height={110} /> : (
            <div style={{ height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12, border: '1px dashed var(--border)', borderRadius: 12 }}>
              No weekly workout data.
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
            <div style={{ background: 'var(--bg-base)', borderRadius: 10, padding: '9px 12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)' }}>{dashData?.totalWorkoutsCompleted ?? 0} / {dashData?.totalWorkoutsPlanned ?? 0}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Total Workouts</div>
            </div>
            <div style={{ background: 'var(--bg-base)', borderRadius: 10, padding: '9px 12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#22c55e' }}>{dashData?.workoutCompletionRate != null || dashData?.completionRate != null ? `${workoutCompletionRate}%` : '—'} <span style={{ fontSize: 10, color: 'var(--accent)' }}>{formatChange(dashData?.workoutVsLastWeek, '%')}</span></div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Completion Rate</div>
            </div>
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontWeight: 800, fontSize: 14 }}>Upcoming Sessions</span>
            <button onClick={() => onTabChange('members')} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>View Calendar</button>
          </div>
          {schedToday.length > 0 ? schedToday.slice(0,5).map((s: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent)', minWidth: 72 }}>{s.scheduledDate ? String(s.scheduledDate).slice(5) : ''} {s.scheduledTime || s.time || '—'}</span>
              {s.avatarUrl
                ? <img src={s.avatarUrl} alt="" style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} onError={e => (e.currentTarget.style.display='none')} />
                : <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--metric-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: 'var(--text-muted)', flexShrink: 0 }}>{(s.memberName||'M')[0]}</div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.memberName || s.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.workoutType || 'Training'}</div>
              </div>
              <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 20, fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0,
                background: s.category === 'Strength' ? 'rgba(139,92,246,0.15)' : s.category === 'Fat Loss' ? 'rgba(245,158,11,0.15)' : s.category === 'Muscle Gain' ? 'rgba(59,130,246,0.15)' : 'rgba(34,197,94,0.15)',
                color: s.category === 'Strength' ? '#a78bfa' : s.category === 'Fat Loss' ? '#f59e0b' : s.category === 'Muscle Gain' ? '#60a5fa' : '#22c55e',
              }}>{s.category || 'Training'}</span>
            </div>
          )) : <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No upcoming sessions from the database.</div>}
          <div style={{ padding: '10px 14px' }}>
            <button onClick={() => onTabChange('members')} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>View All Sessions</button>
          </div>
        </div>

        {/* Top Performing Members */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', padding: 18 }}>
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 14 }}>Top Performing Members</div>
          {topPerformers.length > 0 ? topPerformers.slice(0, 5).map((m: any, i: number) => {
            const name = `${m.firstName || ''} ${m.lastName || ''}`.trim() || m.userName || 'Member';
            return (
              <div key={m.userId || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < Math.min(topPerformers.length, 5) - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: i < 3 ? '#f59e0b' : 'var(--metric-bg)', color: i < 3 ? '#111827' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900 }}>{i + 1}</span>
                {m.avatarUrl ? <img src={normalizeProfileImageUrl(m.avatarUrl) || ''} alt="" style={{ width: 32, height: 32, borderRadius: 9, objectFit: 'cover' }} /> : <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--metric-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>{name[0]}</div>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.metric}</div>
                </div>
                <div style={{ color: '#4ade80', fontWeight: 900, fontSize: 12 }}>{m.value > 0 ? '+' : ''}{m.value} kg</div>
              </div>
            );
          }) : <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No performer data yet.</div>}
        </div>
      </div>

      {/* ── Row 4: AI Insights + Recent Activities + Quick Actions ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        {/* AI Insights */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: 7, background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={12} color="#fff" />
              </div>
              <span style={{ fontWeight: 800, fontSize: 14 }}>AI Insights</span>
              <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 20, background: 'rgba(139,92,246,0.15)', color: '#a78bfa', fontWeight: 700 }}>✦</span>
            </div>
            <button onClick={() => onTabChange('plateau')} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>View All Insights</button>
          </div>
          <div style={{ padding: '8px 0' }}>
            {aiInsights.length > 0 ? aiInsights.slice(0, 4).map((ins: any, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{ins.icon || '💡'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{ins.text || ins.message || ins.body}</div>
              </div>
            )) : <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No AI insights from the database.</div>}
          </div>
        </div>

        {/* Recent Activities */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', fontWeight: 800, fontSize: 14, borderBottom: '1px solid var(--border)' }}>Recent Activities</div>
          {recentActs.length > 0 ? recentActs.slice(0,5).map((act: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: '1px solid var(--border)' }}>
              {act.avatarUrl
                ? <img src={act.avatarUrl} alt="" style={{ width: 32, height: 32, borderRadius: 9, objectFit: 'cover', flexShrink: 0 }} onError={e => (e.currentTarget.style.display='none')} />
                : <div style={{ width: 32, height: 32, borderRadius: 9, background: `${act.color||'var(--accent)'}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: act.color||'var(--accent)', flexShrink: 0 }}>{(act.memberName||'M')[0]}</div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <strong>{act.memberName || act.member}</strong> {act.action || act.text}
                </div>
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>{act.time || act.timeAgo}</span>
            </div>
          )) : <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No recent activity from the database.</div>}
        </div>

        {/* Today's Summary */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', padding: 18 }}>
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 14 }}>Today's Summary</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { icon: <CheckCircle size={15} />, label: 'Sessions Completed', value: todaySummary.sessionsCompleted ?? 0, color: '#3b82f6' },
              { icon: <Users size={15} />, label: 'New Members', value: todaySummary.newMembers ?? 0, color: '#65a30d' },
              { icon: <Salad size={15} />, label: 'Diet Plans Assigned', value: todaySummary.dietPlansAssigned ?? 0, color: '#f59e0b' },
              { icon: <Ruler size={15} />, label: 'Measurements Taken', value: todaySummary.measurementsTaken ?? 0, color: '#06b6d4' },
              { icon: <Camera size={15} />, label: 'Progress Photos Added', value: todaySummary.progressPhotosAdded ?? 0, color: '#a855f7' },
              { icon: <MessageSquare size={15} />, label: 'Unread Messages', value: todaySummary.unreadMessages ?? dashData?.unreadMessages ?? 0, color: '#0ea5e9' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 10, background: `${item.color}10`, border: `1px solid ${item.color}25` }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `${item.color}18`, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.2 }}>{item.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)' }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}


// ─── Shared mini helpers ──────────────────────────────────
function ProgressBar({ pct, color = 'var(--accent)' }: { pct: number; color?: string }) {
  return (
    <div style={{ height: 8, borderRadius: 20, background: 'var(--metric-bg)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, borderRadius: 20, background: color, transition: 'width 0.5s' }} />
    </div>
  );
}

function RingProgress({ pct, label, size = 80, color = 'var(--accent)' }: { pct: number; label?: string; size?: number; color?: string }) {
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={size * 0.085} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size * 0.085}
            strokeDasharray={`${circ * Math.min(1, pct/100)} ${circ}`} strokeLinecap="round" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.2, fontWeight: 900, color }}>{pct}%</div>
      </div>
      {label && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{label}</div>}
    </div>
  );
}

// ─── Add Note Modal ───────────────────────────────────────
function AddNoteModal({ open, onClose, memberId, onSaved }: {
  open: boolean; onClose: () => void; memberId: string; onSaved: () => void;
}) {
  const [form, setForm] = useState({ title: '', body: '', category: 'General', priority: 'Low', isImportant: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (open) { setForm({ title: '', body: '', category: 'General', priority: 'Low', isImportant: false }); setError(''); } }, [open]);
  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));
  const submit = async () => {
    if (!form.title || !form.body) { setError('Title and note body are required.'); return; }
    setError(''); setLoading(true);
    try { await api.trainer.createNote(memberId, form); onSaved(); onClose(); }
    catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Add Note" width={540}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <FormField label="Title" required><input style={inputStyle} value={form.title} onChange={f('title')} placeholder="Lower back discomfort" /></FormField>
        <FormField label="Category">
          <select style={inputStyle} value={form.category} onChange={f('category')}>
            {['General','Nutrition','Performance','Injury / Pain','Personal','Other'].map(c => <option key={c}>{c}</option>)}
          </select>
        </FormField>
        <FormField label="Priority">
          <select style={inputStyle} value={form.priority} onChange={f('priority')}>
            {['High','Medium','Low','No Priority'].map(p => <option key={p}>{p}</option>)}
          </select>
        </FormField>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 20 }}>
          <input type="checkbox" id="impNote" checked={form.isImportant} onChange={f('isImportant')} />
          <label htmlFor="impNote" style={{ fontSize: 13 }}>Mark as Important</label>
        </div>
      </div>
      <FormField label="Note Body" required>
        <textarea style={{ ...inputStyle, minHeight: 90, resize: 'vertical' } as any} value={form.body} onChange={f('body')} placeholder="Add your observation here..." />
      </FormField>
      {error && <p style={{ color: 'var(--danger)', fontSize: 12, margin: '4px 0' }}>{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
        <OutlineBtn onClick={onClose}>Cancel</OutlineBtn>
        <PrimaryBtn onClick={submit} loading={loading}>Save Note</PrimaryBtn>
      </div>
    </Modal>
  );
}


// ─── Member Progress Panel (9 tabs) ──────────────────────
type ProgressTab = 'overview'|'workouts'|'biomarkers'|'diet'|'measurements'|'body-composition'|'health'|'attendance'|'photos'|'notes';

function MemberProgressPanel({ member, orgId, branchId, onBack }: {
  member: any; orgId: string; branchId: string; onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<ProgressTab>('overview');
  const [tabData, setTabData] = useState<Record<string, any>>({});
  const [tabLoading, setTabLoading] = useState<Record<string, boolean>>({});
  const [workoutModal, setWorkoutModal] = useState(false);
  const [aiWorkoutModal, setAiWorkoutModal] = useState(false);
  const [dietModal, setDietModal] = useState(false);
  const [aiDietModal, setAiDietModal] = useState(false);
  const [measurementModal, setMeasurementModal] = useState(false);
  const [noteModal, setNoteModal] = useState(false);
  const [noteSearch, setNoteSearch] = useState('');
  const [noteType, setNoteType] = useState('All Types');
  const [noteCat, setNoteCat] = useState('All Categories');
  const [notePri, setNotePri] = useState('All Priorities');

  const TABS: { id: ProgressTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <TrendingUp size={13} /> },
    { id: 'workouts', label: 'Workouts', icon: <Dumbbell size={13} /> },
    { id: 'biomarkers', label: 'Biomarks', icon: <TestTube2 size={13} /> },
    { id: 'diet', label: 'Diet', icon: <Salad size={13} /> },
    { id: 'measurements', label: 'Measurements', icon: <Ruler size={13} /> },
    { id: 'body-composition', label: 'Body Composition', icon: <Activity size={13} /> },
    { id: 'health', label: 'Vitals', icon: <Heart size={13} /> },
    { id: 'attendance', label: 'Attendance', icon: <CalendarCheck size={13} /> },
    { id: 'photos', label: 'Progress Photos', icon: <Camera size={13} /> },
    { id: 'notes', label: 'Notes', icon: <FileText size={13} /> },
  ];

  const loadTab = useCallback(async (tab: ProgressTab) => {
    if (tabData[tab] !== undefined || tabLoading[tab]) return;
    setTabLoading(p => ({ ...p, [tab]: true }));
    try {
      let data: any = {};
      if (tab === 'overview') data = await api.trainer.getProgressOverview(member.userId).catch(() => api.trainer.getMemberProgress(member.userId).catch(() => ({})));
      else if (tab === 'workouts') data = await api.trainer.getProgressWorkouts(member.userId).catch(() => api.trainer.listWorkouts(member.userId).catch(() => ({})));
      else if (tab === 'biomarkers') data = {};
      else if (tab === 'diet') data = await api.trainer.getProgressDiet(member.userId).catch(() => api.trainer.listDietPlans(member.userId).catch(() => ({})));
      else if (tab === 'measurements') data = await api.trainer.getProgressMeasurements(member.userId).catch(() => api.trainer.getMeasurements(member.userId).catch(() => ({})));
      else if (tab === 'body-composition') data = await api.trainer.getProgressBodyComposition(member.userId).catch(() => ({}));
      else if (tab === 'health') data = await api.trainer.getProgressHealth(member.userId).catch(() => ({}));
      else if (tab === 'attendance') data = await api.trainer.getProgressAttendance(member.userId).catch(() => ({}));
      else if (tab === 'photos') data = await api.trainer.getProgressPhotos(member.userId).catch(() => ({}));
      else if (tab === 'notes') data = await api.trainer.getProgressNotes(member.userId).catch(() => ({}));
      setTabData(p => ({ ...p, [tab]: data || {} }));
    } catch { setTabData(p => ({ ...p, [tab]: {} })); }
    finally { setTabLoading(p => ({ ...p, [tab]: false })); }
  }, [member.userId, tabData, tabLoading]);

  const reloadTab = useCallback((tab: ProgressTab) => {
    setTabData(p => { const n = { ...p }; delete n[tab]; return n; });
    setTabLoading(p => ({ ...p, [tab]: false }));
  }, []);

  useEffect(() => { loadTab(activeTab); }, [activeTab, loadTab]);

  const d = tabData[activeTab] || {};
  const isLoading = !!tabLoading[activeTab];
  const catColor: Record<string,string> = { 'Injury / Pain':'#ef4444', Performance:'#3b82f6', Nutrition:'#22c55e', General:'#6366f1', Personal:'#f59e0b', Other:'#a78bfa' };
  const priColor: Record<string,string> = { High:'#ef4444', Medium:'#f59e0b', Low:'#22c55e', 'No Priority':'var(--text-muted)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Member header */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '16px 20px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <button onClick={onBack} style={{ display:'flex',alignItems:'center',gap:6,fontSize:12,fontWeight:700,color:'var(--text-muted)',background:'var(--metric-bg)',border:'1px solid var(--border)',borderRadius:8,padding:'6px 12px',cursor:'pointer' }}>
            <ArrowLeft size={13} /> Back
          </button>
          {member.avatarUrl
            ? <img src={member.avatarUrl} alt="" style={{ width:52,height:52,borderRadius:14,objectFit:'cover',border:'1px solid var(--border)' }} onError={e=>(e.currentTarget.style.display='none')} />
            : <div style={{ width:52,height:52,borderRadius:14,background:'linear-gradient(135deg,#0ea5e933,#0ea5e966)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:900,color:'#0ea5e9',flexShrink:0 }}>{(memberName(member)[0]||'M').toUpperCase()}</div>
          }
          <div style={{ flex:1 }}>
            <div style={{ display:'flex',alignItems:'center',gap:10,flexWrap:'wrap' }}>
              <span style={{ fontSize:18,fontWeight:900 }}>{memberName(member)}</span>
              <span style={{ fontSize:10,padding:'2px 8px',borderRadius:20,background:'rgba(245,158,11,0.15)',color:'#f59e0b',fontWeight:700,border:'1px solid rgba(245,158,11,0.3)' }}>Premium Member</span>
            </div>
            <div style={{ fontSize:12,color:'var(--text-muted)',marginTop:2 }}>{member.userName}{member.email?` · ${member.email}`:''}</div>
          </div>
          <div style={{ display:'flex',gap:20,flexWrap:'wrap' }}>
            {[{label:'Goal',value:member.goal||'Fat Loss'},{label:'Trainer',value:member.trainerName||'—'},{label:'Package',value:member.package||'—'}].map(info=>(
              <div key={info.label} style={{ textAlign:'center' }}>
                <div style={{ fontSize:10,color:'var(--text-muted)',marginBottom:2 }}>{info.label}</div>
                <div style={{ fontSize:13,fontWeight:700 }}>{info.value}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display:'flex',gap:2,marginTop:16,overflowX:'auto',paddingBottom:1 }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{
              display:'flex',alignItems:'center',gap:5,padding:'8px 13px',
              borderRadius:'8px 8px 0 0',fontSize:12,fontWeight:700,whiteSpace:'nowrap',
              background:activeTab===t.id?'var(--bg-base)':'transparent',
              color:activeTab===t.id?'var(--accent)':'var(--text-muted)',
              border:activeTab===t.id?'1px solid var(--border)':'1px solid transparent',
              borderBottom:activeTab===t.id?'2px solid var(--accent)':'1px solid var(--border)',
              cursor:'pointer',marginBottom:-1,
            }}>{t.icon}{t.label}</button>
          ))}
        </div>
      </div>

      {/* Tab content area */}
      <div style={{ background:'var(--bg-base)',borderRadius:'0 0 16px 16px',border:'1px solid var(--border)',borderTop:'none',padding:20,minHeight:400 }}>
        {isLoading
          ? <div style={{ textAlign:'center',padding:64 }}><Loader size={24} style={{ animation:'spin 1s linear infinite',color:'var(--text-muted)' }} /></div>
          : <>
            {activeTab==='overview' && <MPOverview d={d} onGoNotes={()=>setActiveTab('notes')} />}
            {activeTab==='workouts' && <MPWorkouts d={d} onManual={()=>setWorkoutModal(true)} onAI={()=>setAiWorkoutModal(true)} onDeleted={()=>reloadTab('workouts')} />}
            {activeTab==='biomarkers' && <BioMarkersPage memberId={member.userId} readOnly />}
            {activeTab==='diet' && <MPDiet d={d} onManual={()=>setDietModal(true)} onAI={()=>setAiDietModal(true)} onDeleted={()=>reloadTab('diet')} />}
            {activeTab==='measurements' && <MPMeasurements d={d} onAdd={()=>setMeasurementModal(true)} />}
            {activeTab==='body-composition' && <MPBodyComp d={d} />}
            {activeTab==='health' && <MPHealth d={d} />}
            {activeTab==='attendance' && <MPAttendance d={d} />}
            {activeTab==='photos' && <MPPhotos d={d} />}
            {activeTab==='notes' && <MPNotes d={d} memberId={member.userId}
              search={noteSearch} setSearch={setNoteSearch}
              typeFilter={noteType} setTypeFilter={setNoteType}
              catFilter={noteCat} setCatFilter={setNoteCat}
              priFilter={notePri} setPriFilter={setNotePri}
              catColor={catColor} priColor={priColor}
              onAdd={()=>setNoteModal(true)} onReload={()=>reloadTab('notes')} />}
          </>
        }
      </div>

      <WorkoutFormModal open={workoutModal} onClose={()=>setWorkoutModal(false)} memberId={member.userId} orgId={orgId} branchId={branchId} onSaved={()=>reloadTab('workouts')} />
      <AIWorkoutGeneratorModal open={aiWorkoutModal} onClose={()=>setAiWorkoutModal(false)} memberId={member.userId} orgId={orgId} branchId={branchId} onSaved={()=>reloadTab('workouts')} />
      <DietPlanModal open={dietModal} onClose={()=>setDietModal(false)} memberId={member.userId} orgId={orgId} branchId={branchId} onSaved={()=>reloadTab('diet')} />
      <AIDietGeneratorModal open={aiDietModal} onClose={()=>setAiDietModal(false)} memberId={member.userId} orgId={orgId} branchId={branchId} onSaved={()=>reloadTab('diet')} />
      <MeasurementModal open={measurementModal} onClose={()=>setMeasurementModal(false)} memberId={member.userId} onSaved={()=>reloadTab('measurements')} />
      <AddNoteModal open={noteModal} onClose={()=>setNoteModal(false)} memberId={member.userId} onSaved={()=>reloadTab('notes')} />
    </div>
  );
}


// ─── MP Overview ─────────────────────────────────────────
function MPOverview({ d, onGoNotes }: { d: any; onGoNotes: () => void }) {
  const wt = d.weightTracking || {};
  const ws = d.workoutSummary || {};
  const da = d.dietAdherence || {};
  const health = d.healthOverview || {};
  const meas = d.recentMeasurements || {};
  const lifestyle = d.lifestyle || {};
  const tn = d.trainerNotes || {};
  const analytics = d.progressAnalytics || {};
  const total = Math.abs((wt.startWeightKg||0)-(wt.targetWeightKg||0));
  const done  = Math.abs((wt.startWeightKg||0)-(wt.currentWeightKg||0));
  const pct = total>0 ? Math.min(100,Math.round((done/total)*100)) : 0;

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
      {/* 6 metric cards */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(145px,1fr))',gap:10 }}>
        {[
          { label:'Current Weight', value:wt.currentWeightKg, unit:'kg', color:'#0ea5e9', sub:wt.changeKg!=null?`${wt.changeKg>0?'+':''}${wt.changeKg} kg vs last month`:undefined, sc:(wt.changeKg||0)<0?'var(--accent)':'var(--danger)' },
          { label:'Body Fat %', value:d.bodyFatPercent??wt.bodyFatPercent, unit:'%', color:'#f59e0b', sub:d.bodyFatChange!=null?`${d.bodyFatChange>0?'+':''}${d.bodyFatChange}% vs last month`:undefined, sc:(d.bodyFatChange||0)<0?'var(--accent)':'var(--danger)' },
          { label:'Muscle Mass', value:d.muscleMassKg??wt.muscleKg, unit:'kg', color:'#22c55e', sub:d.muscleChange!=null?`+${d.muscleChange} kg vs last month`:undefined, sc:'var(--accent)' },
          { label:'BMI', value:d.bmi??wt.bmi, unit:'', color:'#6366f1', sub:d.bmiStatus??wt.bmiStatus },
          { label:'Water Intake', value:d.waterIntakeLiters, unit:'L', color:'#06b6d4', sub:d.waterStatus },
          { label:'Daily Steps', value:d.dailySteps, unit:'', color:'#a78bfa', sub:d.stepsStatus },
        ].map(m=>(
          <div key={m.label} style={{ background:'var(--bg-card)',borderRadius:12,padding:'14px 16px',border:'1px solid var(--border)' }}>
            <div style={{ fontSize:12,color:'var(--text-muted)',marginBottom:4 }}>{m.label}</div>
            <div style={{ fontSize:22,fontWeight:900,color:m.color }}>{m.value??'—'}<span style={{ fontSize:11,color:'var(--text-muted)',marginLeft:2 }}>{m.unit}</span></div>
            {m.sub&&<div style={{ fontSize:10,color:(m as any).sc||'var(--text-muted)',marginTop:3 }}>{m.sub}</div>}
          </div>
        ))}
      </div>

      {/* Goal / Workout / Diet row */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14 }}>
        <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)' }}>
          <div style={{ fontWeight:800,fontSize:14,marginBottom:4 }}>Goal Progress</div>
          <div style={{ fontSize:11,color:'var(--text-muted)',marginBottom:14 }}>Target: {wt.targetWeightKg||'—'} kg</div>
          <div style={{ display:'flex',gap:16,alignItems:'center' }}>
            <RingProgress pct={pct} size={80} color="#f59e0b" />
            <div style={{ flex:1,fontSize:12,color:'var(--text-muted)' }}>
              <div>Start: <strong>{wt.startWeightKg||'—'} kg</strong></div>
              <div style={{ marginTop:4 }}>Current: <strong style={{ color:'var(--text-primary)' }}>{wt.currentWeightKg||'—'} kg</strong></div>
              <div style={{ marginTop:4 }}>Target: <strong>{wt.targetWeightKg||'—'} kg</strong></div>
            </div>
          </div>
        </div>
        <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)' }}>
          <div style={{ fontWeight:800,fontSize:14,marginBottom:14 }}>Workout Summary</div>
          {[{label:'This Week',value:ws.thisWeek,suf:'/ 6'},{label:'This Month',value:ws.thisMonth,suf:'/ 24'},{label:'Last 30 Days',value:ws.last30Days,suf:'/ 30'},{label:'Total Workouts',value:ws.total}].map(r=>(
            <div key={r.label} style={{ display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--border)',fontSize:13 }}>
              <span style={{ color:'var(--text-secondary)' }}>{r.label}</span>
              <span style={{ fontWeight:800,color:'var(--accent)' }}>{r.value??'—'}{r.suf?<span style={{ color:'var(--text-muted)',fontWeight:400 }}> {r.suf}</span>:null}</span>
            </div>
          ))}
        </div>
        <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)' }}>
          <div style={{ fontWeight:800,fontSize:14,marginBottom:10 }}>Diet Adherence</div>
          <div style={{ display:'flex',gap:14,alignItems:'center',marginBottom:10 }}>
            <RingProgress pct={da.adherencePercent||0} size={60} color="#22c55e" />
            <div style={{ fontSize:12,color:'var(--text-muted)' }}>{da.status||'N/A'}</div>
          </div>
          {[{label:'This Week',value:da.thisWeek,suf:'/ 7 Days'},{label:'This Month',value:da.thisMonth,suf:'/ 24 Days'},{label:'Calories Avg',value:da.avgCalories,suf:'kcal'}].map(r=>(
            <div key={r.label} style={{ display:'flex',justifyContent:'space-between',padding:'5px 0',fontSize:12 }}>
              <span style={{ color:'var(--text-secondary)' }}>{r.label}</span>
              <span style={{ fontWeight:700,color:'var(--accent)' }}>{r.value??'—'} <span style={{ color:'var(--text-muted)',fontWeight:400 }}>{r.suf}</span></span>
            </div>
          ))}
        </div>
      </div>

      {/* Health / Measurements / Conditions / Notes row */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:14 }}>
        <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)' }}>
          <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>Health Overview</div>
          {[
            { icon:'🫀',label:'Blood Pressure',value:health.bloodPressure||'—',status:health.bpStatus },
            { icon:'❤️',label:'Resting HR',value:health.restingHR?`${health.restingHR} bpm`:'—',status:health.hrStatus },
            { icon:'🌙',label:'Sleep (Avg)',value:health.sleepAvgHrs?`${health.sleepAvgHrs} hrs`:'—',status:health.sleepStatus },
            { icon:'⚡',label:'Stress Level',value:health.stressLevel||'—',status:health.stressStatus },
            { icon:'🔋',label:'Energy Level',value:health.energyLevel||'—' },
          ].map(r=>(
            <div key={r.label} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--border)',fontSize:11 }}>
              <span style={{ color:'var(--text-secondary)' }}>{r.icon} {r.label}</span>
              <span style={{ fontWeight:700 }}>{r.value}{(r as any).status&&<span style={{ marginLeft:5,fontSize:10,color:(r as any).status==='Normal'||(r as any).status==='Good'?'var(--accent)':'#f59e0b' }}>{(r as any).status}</span>}</span>
            </div>
          ))}
        </div>

        <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)' }}>
          <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>Recent Measurements</div>
          {['Chest','Waist','Hips','Right Arm','Left Arm','Right Thigh','Left Thigh'].map(label=>{
            const key=label.toLowerCase().replace(/ /g,'');
            const val=(meas as any)[key+'Cm']??(meas as any)[label];
            const change=(meas as any)[key+'Change'];
            return (
              <div key={label} style={{ display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid var(--border)',fontSize:11 }}>
                <span style={{ color:'var(--text-secondary)' }}>{label}</span>
                <div style={{ display:'flex',gap:8 }}>
                  <span style={{ fontWeight:700 }}>{val!=null?`${val} cm`:'—'}</span>
                  {change!=null&&<span style={{ color:change<0?'var(--accent)':'#f59e0b',fontWeight:800 }}>{change>0?'+':''}{change}</span>}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)',display:'flex',flexDirection:'column',gap:12 }}>
          <div>
            <div style={{ fontWeight:800,fontSize:12,marginBottom:6,display:'flex',alignItems:'center',gap:5 }}><Heart size={12} color="#ef4444"/> Health Conditions</div>
            <div style={{ fontSize:11,color:'var(--text-muted)' }}>{(d.healthConditions||[]).map((c:any)=>typeof c==='string'?c:c.name||c.condition||String(c)).join(', ')||'No Major Conditions'}</div>
          </div>
          <div>
            <div style={{ fontWeight:800,fontSize:12,marginBottom:6 }}>⚠️ Injury / Pain</div>
            <div style={{ fontSize:11,color:'var(--text-muted)' }}>{(d.injuries||[]).map((i:any)=>typeof i==='string'?i:(i.description||i.area||i.name||String(i))).join(', ')||'None reported'}</div>
          </div>
          <div>
            <div style={{ fontWeight:800,fontSize:12,marginBottom:6 }}>💊 Supplements</div>
            {(d.supplements||[]).length>0?(d.supplements||[]).map((s:any,i:number)=><div key={i} style={{ fontSize:11,color:'var(--text-muted)',marginBottom:2 }}>• {typeof s==='string'?s:s.name||s.supplement||JSON.stringify(s)}</div>):<div style={{ fontSize:11,color:'var(--text-muted)' }}>None listed</div>}
          </div>
        </div>

        <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)',display:'flex',flexDirection:'column',gap:10 }}>
          <div style={{ fontWeight:800,fontSize:14 }}>Trainer Notes</div>
          <div style={{ fontSize:12,color:'var(--text-secondary)',flex:1 }}>{tn.body||tn.text||analytics.notes||'No recent notes.'}</div>
          {tn.nextReview&&<div style={{ fontSize:11,color:'var(--text-muted)' }}>Next review: {tn.nextReview}</div>}
          <OutlineBtn onClick={onGoNotes} style={{ fontSize:11,padding:'5px 10px' }}><Edit2 size={11}/> Edit Note</OutlineBtn>
        </div>
      </div>

      {Object.keys(lifestyle).length>0&&(
        <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)' }}>
          <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>Lifestyle</div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:10 }}>
            {Object.entries(lifestyle).map(([k,v])=>(
              <div key={k} style={{ background:'var(--bg-base)',borderRadius:10,padding:'10px 12px' }}>
                <div style={{ fontSize:10,color:'var(--text-muted)',marginBottom:2,textTransform:'capitalize' }}>{k.replace(/([A-Z])/g,' $1').trim()}</div>
                <div style={{ fontSize:13,fontWeight:700 }}>{String(v)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


// ─── MP Workouts ──────────────────────────────────────────
function MPWorkouts({ d, onManual, onAI, onDeleted }: { d:any; onManual:()=>void; onAI:()=>void; onDeleted:()=>void }) {
  const m = d.metrics||{}; const program = d.currentProgram||{}; const exercises = d.exercises||[]; const workouts = d.workouts||[]; const compliance = d.compliance||{}; const highlights = d.performanceHighlights||{};
  return (
    <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
      <div style={{ display:'flex',justifyContent:'flex-end',gap:10 }}>
        <OutlineBtn onClick={onManual} style={{ fontSize:12 }}><Plus size={13}/> Manual Plan</OutlineBtn>
        <PrimaryBtn onClick={onAI} style={{ background:'linear-gradient(135deg,#7c3aed,#3b82f6)',fontSize:12 }}><Sparkles size={13}/> AI Generate Plan</PrimaryBtn>
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(145px,1fr))',gap:10 }}>
        {[
          { label:'Total Workouts', value:m.totalWorkouts??workouts.length, color:'#0ea5e9', sub:m.thisMonthWorkouts!=null?`This Month: ${m.thisMonthWorkouts}`:undefined },
          { label:'Completed', value:m.completionRate!=null?`${m.completionRate}%`:'—', color:'#22c55e', sub:m.completedWorkouts!=null?`${m.completedWorkouts} Workouts`:undefined },
          { label:'Total Volume', value:m.totalVolumeKg, unit:'kg', color:'#f97316', sub:'This Month' },
          { label:'Total Duration', value:m.totalDurationMin!=null?`${Math.floor(m.totalDurationMin/60)}h ${m.totalDurationMin%60}m`:'—', color:'#8b5cf6', sub:'This Month' },
          { label:'Avg Intensity', value:m.avgIntensity!=null?`${m.avgIntensity}%`:'—', color:'#f59e0b', sub:m.intensityLabel },
          { label:'Calories Burned', value:m.caloriesBurned, unit:'kcal', color:'#ef4444', sub:'This Month' },
        ].map(c=>(
          <div key={c.label} style={{ background:'var(--bg-card)',borderRadius:12,padding:'14px 16px',border:'1px solid var(--border)' }}>
            <div style={{ fontSize:12,color:'var(--text-muted)',marginBottom:4 }}>{c.label}</div>
            <div style={{ fontSize:20,fontWeight:900,color:c.color }}>{c.value??'—'}<span style={{ fontSize:10,color:'var(--text-muted)',marginLeft:2 }}>{(c as any).unit}</span></div>
            {c.sub&&<div style={{ fontSize:10,color:'var(--text-muted)',marginTop:3 }}>{c.sub}</div>}
          </div>
        ))}
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'260px 1fr',gap:14 }}>
        <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)' }}>
          <div style={{ fontWeight:800,fontSize:14,marginBottom:10 }}>Current Program</div>
          {program.title?(
            <>
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:8 }}>
                <span style={{ fontWeight:800,fontSize:15 }}>{program.title}</span>
                <span style={{ fontSize:10,padding:'2px 8px',borderRadius:20,background:'rgba(34,197,94,0.1)',color:'#22c55e',fontWeight:700 }}>Active</span>
              </div>
              <div style={{ fontSize:11,color:'var(--text-muted)',marginBottom:10 }}>
                {program.startDate&&<div>Started {program.startDate}</div>}
                {program.durationWeeks&&<div>{program.durationWeeks} Weeks Program</div>}
              </div>
              {program.description&&<div style={{ fontSize:11,color:'var(--text-secondary)',marginBottom:12,padding:'7px 10px',background:'var(--bg-base)',borderRadius:8 }}>{program.description}</div>}
              {(program.weeks||[]).map((w:any,i:number)=>(
                <div key={i} style={{ display:'flex',alignItems:'center',gap:10,marginBottom:6,fontSize:12 }}>
                  <div style={{ width:9,height:9,borderRadius:'50%',background:w.status==='Completed'?'var(--accent)':w.status==='In Progress'?'#f59e0b':'var(--border)',flexShrink:0 }}/>
                  <div style={{ flex:1 }}><div style={{ fontWeight:700 }}>{w.label}</div>{w.dates&&<div style={{ fontSize:10,color:'var(--text-muted)' }}>{w.dates}</div>}</div>
                  <span style={{ fontSize:10,color:w.status==='Completed'?'var(--accent)':w.status==='In Progress'?'#f59e0b':'var(--text-muted)',fontWeight:700 }}>{w.status}</span>
                </div>
              ))}
            </>
          ):<div style={{ textAlign:'center',padding:24,color:'var(--text-muted)',fontSize:12 }}>No active program</div>}
        </div>
        <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)' }}>
          {exercises.length>0?(
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
                <thead><tr style={{ borderBottom:'2px solid var(--border)' }}>
                  {['Exercise','Sets','Reps','Weight','Rest','Status'].map(h=><th key={h} style={{ padding:'8px 10px',textAlign:'left',color:'var(--text-muted)',fontWeight:700,fontSize:11 }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {exercises.map((ex:any,i:number)=>(
                    <tr key={i} style={{ borderBottom:'1px solid var(--border)' }}>
                      <td style={{ padding:'10px',fontWeight:700 }}>{ex.exerciseName||ex.name}</td>
                      <td style={{ padding:'10px',color:'var(--text-muted)' }}>{ex.sets}</td>
                      <td style={{ padding:'10px',color:'var(--text-muted)' }}>{ex.reps}</td>
                      <td style={{ padding:'10px',color:'var(--text-muted)' }}>{ex.weightKg?`${ex.weightKg} kg`:'—'}</td>
                      <td style={{ padding:'10px',color:'var(--text-muted)' }}>{ex.restSeconds?`${ex.restSeconds}s`:'—'}</td>
                      <td style={{ padding:'10px' }}><span style={{ fontSize:10,padding:'2px 8px',borderRadius:20,background:ex.status==='Completed'?'rgba(34,197,94,0.1)':'var(--metric-bg)',color:ex.status==='Completed'?'#22c55e':'var(--text-muted)',fontWeight:700 }}>{ex.status||'—'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ):workouts.length>0?(
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:12 }}>
              {workouts.map((w:any)=>(
                <div key={w.id} style={{ background:'var(--bg-base)',borderRadius:12,padding:14,border:'1px solid var(--border)' }}>
                  <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:6,flexWrap:'wrap' }}>
                    <span style={{ fontWeight:800,fontSize:13 }}>{w.title}</span>
                    {w.createdByType==='AI'&&<AIBadge/>}
                  </div>
                  <div style={{ fontSize:11,color:'var(--text-muted)' }}>{w.goal?.replace('_',' ')} · {w.level}</div>
                  <div style={{ marginTop:8,display:'flex',gap:8,justifyContent:'space-between',alignItems:'center' }}>
                    <StatusBadge status={w.status}/>
                    <button onClick={()=>api.trainer.deleteWorkout(w.id).then(onDeleted)} style={{ fontSize:10,padding:'3px 8px',borderRadius:6,color:'var(--danger)',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.15)',cursor:'pointer' }}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          ):(
            <div style={{ textAlign:'center',padding:48,color:'var(--text-muted)' }}>
              <Dumbbell size={36} style={{ opacity:0.3,marginBottom:10 }}/>
              <p>No workout plans yet. Use AI Generate or create one manually.</p>
            </div>
          )}
        </div>
      </div>
      {(highlights.heaviestLift||compliance.completedWorkouts)&&(
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14 }}>
          {highlights.heaviestLift&&(
            <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)' }}>
              <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>Performance Highlights</div>
              {[['🏋️','Heaviest Lift',highlights.heaviestLift],['🔁','Max Reps',highlights.maxReps],['⏱️','Longest Workout',highlights.longestWorkout],['📊','Best Volume Day',highlights.bestVolumeDay]].map(([icon,label,val])=>(
                <div key={label as string} style={{ display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--border)',fontSize:12 }}>
                  <span style={{ color:'var(--text-secondary)' }}>{icon} {label}</span>
                  <span style={{ fontWeight:800 }}>{val as string||'—'}</span>
                </div>
              ))}
            </div>
          )}
          {compliance.completedWorkouts&&(
            <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)' }}>
              <div style={{ fontWeight:800,fontSize:14,marginBottom:14 }}>Workout Compliance</div>
              <div style={{ display:'flex',gap:16,alignItems:'center' }}>
                <RingProgress pct={compliance.compliancePct||0} size={72} color="#22c55e"/>
                <div style={{ flex:1 }}>
                  {[['Completed Workouts',compliance.completedWorkouts,'var(--accent)'],['Missed Workouts',compliance.missedWorkouts,'var(--danger)'],['Rescheduled',compliance.rescheduled,'#f59e0b']].map(([label,val,color])=>(
                    <div key={label as string} style={{ display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:12 }}>
                      <span style={{ color:'var(--text-secondary)' }}>{label}</span>
                      <span style={{ fontWeight:800,color:color as string }}>{val as number??'—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// ─── MP Diet ──────────────────────────────────────────────
function MPDiet({ d, onManual, onAI, onDeleted }: { d:any; onManual:()=>void; onAI:()=>void; onDeleted:()=>void }) {
  const ov=d.overview||{}; const mealPlan=d.todayMealPlan||d.mealPlan||[]; const nutrition=d.nutritionSummary||{}; const hydration=d.hydration||{}; const adherence=d.dietAdherence||d.adherence||{}; const notes=d.dietNotes||d.notes||{}; const dietPlans=d.dietPlans||[];
  return (
    <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
      <div style={{ display:'flex',justifyContent:'flex-end',gap:10 }}>
        <OutlineBtn onClick={onManual} style={{ fontSize:12 }}><Plus size={13}/> Manual Plan</OutlineBtn>
        <PrimaryBtn onClick={onAI} style={{ background:'linear-gradient(135deg,#059669,#10b981)',fontSize:12 }}><Sparkles size={13}/> AI Generate Diet</PrimaryBtn>
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:10 }}>
        {[
          { label:'Daily Calories', value:ov.calories, unit:'kcal', sub:`Target: ${ov.calorieTarget??'—'} kcal`, color:'#f59e0b' },
          { label:'Protein', value:ov.protein!=null?`${ov.protein}g`:'—', sub:`Target: ${ov.proteinTarget??'—'}g`, color:'#22c55e' },
          { label:'Carbs', value:ov.carbs!=null?`${ov.carbs}g`:'—', sub:`Target: ${ov.carbsTarget??'—'}g`, color:'#3b82f6' },
          { label:'Fats', value:ov.fat!=null?`${ov.fat}g`:'—', sub:`Target: ${ov.fatTarget??'—'}g`, color:'#f97316' },
          { label:'Water Intake', value:hydration.liters!=null?`${hydration.liters}L`:'—', sub:`Target: ${hydration.target??'—'}L`, color:'#06b6d4' },
          { label:'Meals', value:adherence.completedMeals!=null?`${adherence.completedMeals}/${adherence.totalMeals??'—'}`:'—', sub:'Completed', color:'#a78bfa' },
        ].map(c=>(
          <div key={c.label} style={{ background:'var(--bg-card)',borderRadius:12,padding:'14px 16px',border:'1px solid var(--border)' }}>
            <div style={{ fontSize:12,color:'var(--text-muted)',marginBottom:4 }}>{c.label}</div>
            <div style={{ fontSize:18,fontWeight:900,color:c.color }}>{c.value??'—'}</div>
            <div style={{ fontSize:10,color:'var(--text-muted)',marginTop:3 }}>{c.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14 }}>
        <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)' }}>
          <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>Today's Meal Plan</div>
          {mealPlan.length>0?mealPlan.map((meal:any,i:number)=>(
            <div key={i} style={{ display:'flex',alignItems:'center',gap:12,padding:'9px 0',borderBottom:i<mealPlan.length-1?'1px solid var(--border)':'none',fontSize:12 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700 }}>{meal.mealType||meal.label}</div>
                <div style={{ color:'var(--text-muted)',fontSize:11 }}>{meal.foodName||meal.description}</div>
              </div>
              <span style={{ fontSize:10,padding:'2px 8px',borderRadius:20,background:meal.status==='Completed'?'rgba(34,197,94,0.1)':'var(--metric-bg)',color:meal.status==='Completed'?'#22c55e':'#f59e0b',fontWeight:700 }}>{meal.status||'Pending'}</span>
            </div>
          )):dietPlans.length>0?dietPlans.map((dp:any)=>(
            <div key={dp.id} style={{ background:'var(--bg-base)',borderRadius:10,padding:12,border:'1px solid var(--border)',marginBottom:8 }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                <div style={{ fontWeight:700,fontSize:13 }}>{dp.title}</div>
                <button onClick={()=>api.trainer.deleteDietPlan(dp.id).then(onDeleted)} style={{ fontSize:10,color:'var(--danger)',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.15)',borderRadius:6,padding:'3px 8px',cursor:'pointer' }}>Remove</button>
              </div>
              <div style={{ fontSize:11,color:'var(--text-muted)',marginTop:4 }}>{dp.goal?.replace('_',' ')} · {dp.calorieTarget} kcal</div>
            </div>
          )):(
            <div style={{ textAlign:'center',padding:32,color:'var(--text-muted)',fontSize:12 }}>
              <Salad size={28} style={{ opacity:0.3,marginBottom:8 }}/><br/>No diet plans assigned yet.
            </div>
          )}
        </div>
        <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
          {nutrition.protein!=null&&(
            <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)' }}>
              <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>Macro Targets</div>
              {[{label:'Protein',value:nutrition.protein,target:nutrition.proteinTarget,color:'#6366f1'},{label:'Carbs',value:nutrition.carbs,target:nutrition.carbsTarget,color:'#f59e0b'},{label:'Fats',value:nutrition.fat,target:nutrition.fatTarget,color:'#ef4444'}].map(macro=>{
                const p2=macro.target?Math.round((macro.value/macro.target)*100):0;
                return (
                  <div key={macro.label} style={{ marginBottom:12 }}>
                    <div style={{ display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:5 }}>
                      <span>{macro.label}</span>
                      <span style={{ color:'var(--text-muted)' }}>{macro.value}g / {macro.target}g · <span style={{ color:macro.color,fontWeight:800 }}>{p2}%</span></span>
                    </div>
                    <ProgressBar pct={p2} color={macro.color}/>
                  </div>
                );
              })}
            </div>
          )}
          {adherence.adherencePercent!=null&&(
            <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)' }}>
              <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>Diet Adherence (This Week)</div>
              <div style={{ display:'flex',gap:14,alignItems:'center' }}>
                <RingProgress pct={adherence.adherencePercent} size={64} color="#22c55e"/>
                <div style={{ flex:1,fontSize:12 }}>
                  <div style={{ marginBottom:4 }}>On Plan: <span style={{ fontWeight:800,color:'#22c55e' }}>{adherence.onPlan??'—'} Days</span></div>
                  <div style={{ marginBottom:4 }}>Partial: <span style={{ fontWeight:800,color:'#f59e0b' }}>{adherence.partial??'—'} Day</span></div>
                  <div>Off Plan: <span style={{ fontWeight:800,color:'var(--danger)' }}>{adherence.offPlan??'—'} Day</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {(notes.body||(notes.list&&notes.list.length>0))&&(
        <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)' }}>
          <div style={{ fontWeight:800,fontSize:14,marginBottom:10 }}>Diet Notes</div>
          {(notes.list||[notes.body].filter(Boolean)).map((n:string,i:number)=><div key={i} style={{ fontSize:12,color:'var(--text-secondary)',marginBottom:5 }}>• {n}</div>)}
        </div>
      )}
    </div>
  );
}

// ─── MP Measurements ──────────────────────────────────────
function MPMeasurements({ d, onAdd }: { d:any; onAdd:()=>void }) {
  const ov=d.measurementsOverview||{}; const bodyM:any[]=Array.isArray(d.bodyMeasurements)?d.bodyMeasurements:Array.isArray(d.measurements)?d.measurements:[]; const history=d.measurementHistory||[]; const insights:string[]=d.insights||[];
  return (
    <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
      <div style={{ display:'flex',justifyContent:'flex-end' }}>
        <PrimaryBtn onClick={onAdd}><Plus size={14}/> Add New Measurement</PrimaryBtn>
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:10 }}>
        {[
          { label:'Weight', value:ov.weightKg, unit:'kg', change:ov.weightChange, color:'#0ea5e9' },
          { label:'Body Fat %', value:ov.bodyFatPercent, unit:'%', change:ov.bodyFatChange, color:'#f59e0b' },
          { label:'Muscle Mass', value:ov.muscleMassKg, unit:'kg', change:ov.muscleMassChange, color:'#22c55e' },
          { label:'Waist', value:ov.waistCm, unit:'cm', change:ov.waistChange, color:'#f97316' },
          { label:'Chest', value:ov.chestCm, unit:'cm', change:ov.chestChange, color:'#8b5cf6' },
          { label:'BMI', value:ov.bmi, unit:'', sub:ov.bmiStatus, color:'#06b6d4' },
        ].map(c=>(
          <div key={c.label} style={{ background:'var(--bg-card)',borderRadius:12,padding:'14px 16px',border:'1px solid var(--border)' }}>
            <div style={{ fontSize:12,color:'var(--text-muted)',marginBottom:4 }}>{c.label}</div>
            <div style={{ fontSize:20,fontWeight:900,color:c.color }}>{c.value??'—'}<span style={{ fontSize:10,color:'var(--text-muted)',marginLeft:2 }}>{c.unit}</span></div>
            {(c as any).change!=null&&<div style={{ fontSize:10,fontWeight:700,color:(c as any).change<0?'var(--accent)':'var(--danger)',marginTop:3 }}>{(c as any).change>0?'+':''}{(c as any).change} {c.unit}</div>}
            {(c as any).sub&&<div style={{ fontSize:10,color:'var(--text-muted)',marginTop:3 }}>{(c as any).sub}</div>}
          </div>
        ))}
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'280px 1fr',gap:14 }}>
        <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)' }}>
          <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>Body Measurements (cm)</div>
          {bodyM.length>0?(
            <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
              <thead><tr>{['Part','Last','This','Δ'].map(h=><th key={h} style={{ padding:'6px 8px',textAlign:'left',color:'var(--text-muted)',fontWeight:700,fontSize:11,borderBottom:'2px solid var(--border)' }}>{h}</th>)}</tr></thead>
              <tbody>
                {bodyM.map((r:any,i:number)=>(
                  <tr key={i} style={{ borderBottom:'1px solid var(--border)' }}>
                    <td style={{ padding:'7px 8px',fontWeight:600 }}>{r.part||r.label}</td>
                    <td style={{ padding:'7px 8px',color:'var(--text-muted)' }}>{r.lastMonth??'—'}</td>
                    <td style={{ padding:'7px 8px',fontWeight:700 }}>{r.thisMonth??r.value??'—'}</td>
                    <td style={{ padding:'7px 8px',fontSize:10,fontWeight:800,color:(r.change??0)<0?'var(--accent)':'var(--danger)' }}>{r.change!=null?`${r.change>0?'+':''}${r.change}`:'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ):<div style={{ textAlign:'center',padding:24,color:'var(--text-muted)',fontSize:12 }}>No measurements yet.</div>}
        </div>
        <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
          {history.length>0&&(
            <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)' }}>
              <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>Measurement History</div>
              {history.slice(0,5).map((h:any,i:number)=>(
                <div key={i} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 12px',background:'var(--bg-base)',borderRadius:8,marginBottom:5,fontSize:12 }}>
                  <span style={{ color:'var(--text-muted)' }}>{h.date||h.measurementDate}</span>
                  <span style={{ fontWeight:700 }}>{h.weightKg?`${h.weightKg} kg`:h.value||'—'}</span>
                </div>
              ))}
            </div>
          )}
          {insights.length>0&&(
            <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)' }}>
              <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>Measurement Insights</div>
              {insights.map((ins:string,i:number)=>(
                <div key={i} style={{ display:'flex',gap:10,padding:'7px 0',borderBottom:i<insights.length-1?'1px solid var(--border)':'none',fontSize:12 }}>
                  <CheckCircle size={13} color="var(--accent)" style={{ flexShrink:0 }}/>
                  <span style={{ color:'var(--text-secondary)' }}>{ins}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ─── MP Body Composition ──────────────────────────────────
function MPBodyComp({ d }: { d:any }) {
  const ov=d.overview||{}; const breakdown=d.breakdown||{}; const segmental:any[]=d.segmentalAnalysis||[]; const insights:any[]=d.keyInsights||[];
  if(Object.keys(ov).length===0&&segmental.length===0) return (
    <div style={{ textAlign:'center',padding:64,color:'var(--text-muted)' }}><Activity size={40} style={{ opacity:0.3,marginBottom:12 }}/><p>No body composition data available yet.</p></div>
  );
  return (
    <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(155px,1fr))',gap:10 }}>
        {[
          { label:'Body Fat %', value:ov.bodyFatPercent, unit:'%', change:ov.bodyFatChange, color:'#f59e0b' },
          { label:'Lean Body Mass', value:ov.leanBodyMassKg, unit:'kg', change:ov.leanChange, color:'#22c55e' },
          { label:'Skeletal Muscle', value:ov.skeletalMuscleKg, unit:'kg', change:ov.muscleChange, color:'#3b82f6' },
          { label:'Protein Mass', value:ov.proteinMassKg, unit:'kg', change:ov.proteinChange, color:'#8b5cf6' },
          { label:'Visceral Fat', value:ov.visceralFatLevel, unit:'', change:ov.visceralChange, color:'#ef4444' },
          { label:'Metabolic Age', value:ov.metabolicAge, unit:'Years', change:ov.metabolicAgeChange, color:'#06b6d4' },
        ].map(c=>(
          <div key={c.label} style={{ background:'var(--bg-card)',borderRadius:12,padding:'14px 16px',border:'1px solid var(--border)' }}>
            <div style={{ fontSize:12,color:'var(--text-muted)',marginBottom:4 }}>{c.label}</div>
            <div style={{ fontSize:20,fontWeight:900,color:c.color }}>{c.value??'—'}<span style={{ fontSize:10,color:'var(--text-muted)',marginLeft:2 }}>{c.unit}</span></div>
            {c.change!=null&&<div style={{ fontSize:10,fontWeight:700,color:(c.change as number)<0?'var(--accent)':'var(--danger)',marginTop:3 }}>{(c.change as number)>0?'+':''}{c.change} vs last month</div>}
          </div>
        ))}
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14 }}>
        {Object.keys(breakdown).length>0&&(
          <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)' }}>
            <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>Body Composition Breakdown</div>
            {Object.entries(breakdown).map(([label,v]:any)=>(
              <div key={label} style={{ display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--border)',fontSize:12 }}>
                <span style={{ color:'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontWeight:800 }}>{v?.kg??v} kg {v?.pct&&<span style={{ color:'var(--text-muted)',fontWeight:400 }}>({v.pct}%)</span>}</span>
              </div>
            ))}
          </div>
        )}
        {insights.length>0&&(
          <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)' }}>
            <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>Key Insights</div>
            {insights.map((ins:any,i:number)=>(
              <div key={i} style={{ display:'flex',gap:12,padding:'10px 12px',borderRadius:10,background:'var(--bg-base)',marginBottom:8,border:'1px solid var(--border)' }}>
                <TrendingUp size={14} color="#22c55e" style={{ flexShrink:0,marginTop:2 }}/>
                <div>
                  <div style={{ fontSize:12,fontWeight:700 }}>{typeof ins==='string'?ins:ins.title}</div>
                  {ins.detail&&<div style={{ fontSize:11,color:'var(--text-muted)',marginTop:2 }}>{ins.detail}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {segmental.length>0&&(
        <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)' }}>
          <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>Segmental Analysis</div>
          <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
            <thead><tr>{['Segment','Lean Mass','Fat Mass','Balance'].map(h=><th key={h} style={{ padding:'8px 12px',textAlign:'left',color:'var(--text-muted)',fontWeight:700,fontSize:11,borderBottom:'2px solid var(--border)' }}>{h}</th>)}</tr></thead>
            <tbody>
              {segmental.map((seg:any,i:number)=>(
                <tr key={i} style={{ borderBottom:'1px solid var(--border)' }}>
                  <td style={{ padding:'10px 12px',fontWeight:700 }}>{seg.segment}</td>
                  <td style={{ padding:'10px 12px' }}>{seg.leanMassKg} kg</td>
                  <td style={{ padding:'10px 12px' }}>{seg.fatMassKg} kg</td>
                  <td style={{ padding:'10px 12px' }}><span style={{ fontSize:10,padding:'2px 8px',borderRadius:20,background:'rgba(34,197,94,0.1)',color:'#22c55e',fontWeight:700 }}>{seg.balance||'Balanced'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── MP Health ────────────────────────────────────────────
function MPHealth({ d }: { d:any }) {
  const vitals=d.vitals||{}; const conditions:any[]=d.conditions||[]; const injuries:any[]=d.injuries||[]; const supplements:any[]=d.supplements||[]; const lifestyle=d.lifestyle||{};
  if(Object.keys(vitals).length===0&&conditions.length===0) return (
    <div style={{ textAlign:'center',padding:64,color:'var(--text-muted)' }}><Heart size={40} style={{ opacity:0.3,marginBottom:12 }}/><p>No health data available yet.</p></div>
  );
  return (
    <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
      <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)' }}>
        <div style={{ fontWeight:800,fontSize:14,marginBottom:14 }}>Health Vitals</div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:10 }}>
          {[{icon:'🫀',label:'Blood Pressure',value:vitals.bloodPressure||'—',status:vitals.bpStatus},{icon:'❤️',label:'Resting Heart Rate',value:vitals.restingHR?`${vitals.restingHR} bpm`:'—',status:vitals.hrStatus},{icon:'🌙',label:'Sleep (Avg)',value:vitals.sleepAvg?`${vitals.sleepAvg} hrs`:'—',status:vitals.sleepStatus},{icon:'⚡',label:'Stress Level',value:vitals.stressLevel||'—',status:vitals.stressStatus},{icon:'🔋',label:'Energy Level',value:vitals.energyLevel||'—'},{icon:'📊',label:'Blood Sugar',value:vitals.bloodSugar||'—',status:vitals.bloodSugarStatus}].map(r=>(
            <div key={r.label} style={{ background:'var(--bg-base)',borderRadius:10,padding:'12px 14px',border:'1px solid var(--border)' }}>
              <div style={{ fontSize:18,marginBottom:6 }}>{r.icon}</div>
              <div style={{ fontWeight:700,fontSize:15 }}>{r.value}</div>
              <div style={{ fontSize:11,color:'var(--text-muted)' }}>{r.label}</div>
              {(r as any).status&&<div style={{ fontSize:10,color:(r as any).status==='Normal'||(r as any).status==='Good'?'var(--accent)':'#f59e0b',fontWeight:700,marginTop:4 }}>{(r as any).status}</div>}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14 }}>
        <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)' }}>
          <div style={{ fontWeight:800,fontSize:13,marginBottom:10,display:'flex',alignItems:'center',gap:6 }}><Heart size={13} color="#ef4444"/> Health Conditions</div>
          {conditions.length>0?conditions.map((c:any,i:number)=><div key={i} style={{ padding:'7px 0',borderBottom:'1px solid var(--border)',fontSize:12 }}>• {typeof c==='string'?c:(c.name||c.condition||c.description||JSON.stringify(c))}</div>):<div style={{ fontSize:12,color:'var(--text-muted)' }}>No major conditions</div>}
        </div>
        <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)' }}>
          <div style={{ fontWeight:800,fontSize:13,marginBottom:10 }}>⚠️ Injury / Pain</div>
          {injuries.length>0?injuries.map((inj:any,i:number)=>(
            <div key={i} style={{ padding:'7px 0',borderBottom:'1px solid var(--border)',fontSize:12 }}>
              <div style={{ fontWeight:700 }}>{typeof inj==='string'?inj:(inj.area||inj.name||inj.description||JSON.stringify(inj))}</div>
              {inj.severity&&<div style={{ fontSize:10,color:'#f59e0b' }}>{String(inj.severity)}</div>}
            </div>
          )):<div style={{ fontSize:12,color:'var(--text-muted)' }}>No injuries reported</div>}
        </div>
        <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)' }}>
          <div style={{ fontWeight:800,fontSize:13,marginBottom:10 }}>💊 Supplements</div>
          {supplements.length>0?(
            <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
              {supplements.map((s:any,i:number)=><span key={i} style={{ fontSize:11,padding:'5px 12px',borderRadius:20,background:'rgba(139,92,246,0.1)',color:'#a78bfa',border:'1px solid rgba(139,92,246,0.25)',fontWeight:600 }}>{typeof s==='string'?s:(s.name||s.supplement||s.dosage||JSON.stringify(s))}</span>)}
            </div>
          ):<div style={{ fontSize:12,color:'var(--text-muted)' }}>None listed</div>}
        </div>
      </div>
      {Object.keys(lifestyle).length>0&&(
        <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)' }}>
          <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>Lifestyle</div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:10 }}>
            {Object.entries(lifestyle).map(([k,v])=>(
              <div key={k} style={{ background:'var(--bg-base)',borderRadius:10,padding:'10px 12px' }}>
                <div style={{ fontSize:10,color:'var(--text-muted)',marginBottom:2 }}>{k.replace(/([A-Z])/g,' $1').trim()}</div>
                <div style={{ fontSize:13,fontWeight:700 }}>{String(v)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


// ─── MP Attendance ────────────────────────────────────────
function MPAttendance({ d }: { d:any }) {
  const summary=d.summary||{}; const missed:any[]=d.missedSessions||[]; const insights:any[]=d.insights||[];
  return (
    <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(145px,1fr))',gap:10 }}>
        {[
          { label:'Overall Attendance', value:summary.overallPercent?`${summary.overallPercent}%`:'—', sub:summary.overallStatus, color:'#22c55e' },
          { label:'This Month', value:summary.thisMonthPercent?`${summary.thisMonthPercent}%`:'—', sub:`${summary.thisMonthPresent??'—'}/${summary.thisMonthTotal??'—'} sessions`, color:'#0ea5e9' },
          { label:'This Week', value:summary.thisWeekPercent?`${summary.thisWeekPercent}%`:'—', sub:`${summary.thisWeekPresent??'—'}/${summary.thisWeekTotal??'—'} sessions`, color:'#6366f1' },
          { label:'Current Streak', value:summary.currentStreak?`${summary.currentStreak} Days`:'—', sub:`Best: ${summary.bestStreak??'—'} Days`, color:'#f59e0b' },
          { label:'Total Sessions', value:summary.totalSessions??'—', sub:'Since Joined', color:'var(--accent)' },
          { label:'Average/Week', value:summary.avgPerWeek??'—', sub:'Sessions', color:'#8b5cf6' },
        ].map(c=>(
          <div key={c.label} style={{ background:'var(--bg-card)',borderRadius:12,padding:'14px 16px',border:'1px solid var(--border)' }}>
            <div style={{ fontSize:12,color:'var(--text-muted)',marginBottom:4 }}>{c.label}</div>
            <div style={{ fontSize:20,fontWeight:900,color:c.color }}>{c.value}</div>
            {c.sub&&<div style={{ fontSize:10,color:'var(--text-muted)',marginTop:3 }}>{c.sub}</div>}
          </div>
        ))}
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14 }}>
        <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)' }}>
          <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>Attendance Summary</div>
          <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
            <thead><tr>{['Period','Present','Partial','Absent','No Plan','%'].map(h=><th key={h} style={{ padding:'7px 8px',textAlign:'left',color:'var(--text-muted)',fontWeight:700,fontSize:11,borderBottom:'2px solid var(--border)' }}>{h}</th>)}</tr></thead>
            <tbody>
              {(d.summaryTable||[]).map((row:any,i:number)=>(
                <tr key={i} style={{ borderBottom:'1px solid var(--border)' }}>
                  <td style={{ padding:'8px',fontWeight:700 }}>{row.period}</td>
                  <td style={{ padding:'8px',color:'#22c55e',fontWeight:700 }}>{row.present}</td>
                  <td style={{ padding:'8px',color:'#f59e0b',fontWeight:700 }}>{row.partial}</td>
                  <td style={{ padding:'8px',color:'var(--danger)',fontWeight:700 }}>{row.absent}</td>
                  <td style={{ padding:'8px',color:'var(--text-muted)' }}>{row.noPlan}</td>
                  <td style={{ padding:'8px',color:'var(--accent)',fontWeight:800 }}>{row.percent}%</td>
                </tr>
              ))}
              {(d.summaryTable||[]).length===0&&<tr><td colSpan={6} style={{ padding:'24px',textAlign:'center',color:'var(--text-muted)',fontSize:12 }}>No attendance data yet.</td></tr>}
            </tbody>
          </table>
        </div>
        <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
          {insights.length>0&&(
            <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)' }}>
              <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>Attendance Insights</div>
              {insights.map((ins:any,i:number)=>(
                <div key={i} style={{ display:'flex',gap:10,padding:'8px 0',borderBottom:i<insights.length-1?'1px solid var(--border)':'none',fontSize:12 }}>
                  <CheckCircle size={14} color="var(--accent)" style={{ flexShrink:0,marginTop:2 }}/>
                  <span style={{ color:'var(--text-secondary)' }}>{typeof ins==='string'?ins:ins.text}</span>
                </div>
              ))}
            </div>
          )}
          {missed.length>0&&(
            <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)' }}>
              <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>Missed Sessions</div>
              <table style={{ width:'100%',borderCollapse:'collapse',fontSize:11 }}>
                <thead><tr>{['Date','Day','Reason','Remark'].map(h=><th key={h} style={{ padding:'6px 8px',textAlign:'left',color:'var(--text-muted)',fontWeight:700,borderBottom:'2px solid var(--border)' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {missed.slice(0,6).map((ms:any,i:number)=>(
                    <tr key={i} style={{ borderBottom:'1px solid var(--border)' }}>
                      <td style={{ padding:'7px 8px' }}>{ms.date}</td>
                      <td style={{ padding:'7px 8px',color:'var(--text-muted)' }}>{ms.day}</td>
                      <td style={{ padding:'7px 8px' }}><span style={{ fontSize:10,background:'var(--metric-bg)',padding:'2px 7px',borderRadius:20 }}>{ms.reason}</span></td>
                      <td style={{ padding:'7px 8px',color:'var(--text-muted)',fontSize:10 }}>{ms.remark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MP Photos ────────────────────────────────────────────
function MPPhotos({ d }: { d:any }) {
  const photos:any[]=d.photos||[]; const stats=d.stats||{}; const insights:any[]=d.insights||[];
  return (
    <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
        <div style={{ display:'flex',gap:8 }}>
          {['Front','Side','Back'].map(v=><button key={v} style={{ padding:'6px 14px',borderRadius:8,fontSize:12,fontWeight:700,background:v==='Front'?'var(--accent)':'var(--metric-bg)',color:v==='Front'?'#000':'var(--text-muted)',border:'1px solid var(--border)',cursor:'pointer' }}>{v}</button>)}
        </div>
        <OutlineBtn style={{ fontSize:12 }} onClick={()=>{}}><Camera size={13}/> Upload New Photos</OutlineBtn>
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(145px,1fr))',gap:10 }}>
        {[{label:'Total Photos',value:stats.totalPhotos||photos.length,icon:'📸'},{label:'Tracking Since',value:stats.trackingSince||'—',icon:'📅'},{label:'Days Between',value:stats.avgDaysBetween?`${stats.avgDaysBetween} Days`:'—',icon:'⏱️'},{label:'Latest Photo',value:stats.latestPhotoDate||'—',icon:'🗓️'},{label:'Transformation',value:stats.transformationPercent?`${stats.transformationPercent}%`:'—',icon:'📈'}].map(s=>(
          <div key={s.label} style={{ background:'var(--bg-card)',borderRadius:12,padding:'14px 16px',border:'1px solid var(--border)',textAlign:'center' }}>
            <div style={{ fontSize:22,marginBottom:6 }}>{s.icon}</div>
            <div style={{ fontSize:16,fontWeight:900 }}>{s.value}</div>
            <div style={{ fontSize:11,color:'var(--text-muted)',marginTop:3 }}>{s.label}</div>
          </div>
        ))}
      </div>
      {photos.length>0?(
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12 }}>
          {photos.map((photo:any,i:number)=>(
            <div key={i} style={{ background:'var(--bg-card)',borderRadius:14,overflow:'hidden',border:'1px solid var(--border)',position:'relative' }}>
              {photo.url?<img src={photo.url} alt={photo.date} style={{ width:'100%',height:220,objectFit:'cover',display:'block' }}/>:<div style={{ width:'100%',height:220,background:'var(--metric-bg)',display:'flex',alignItems:'center',justifyContent:'center' }}><Camera size={36} style={{ opacity:0.3 }}/></div>}
              {photo.isLatest&&<span style={{ position:'absolute',top:8,right:8,fontSize:10,padding:'2px 8px',borderRadius:20,background:'var(--accent)',color:'#000',fontWeight:800 }}>Latest</span>}
              <div style={{ padding:12 }}>
                <div style={{ fontSize:12,fontWeight:700 }}>{photo.date}</div>
                <div style={{ display:'flex',gap:12,marginTop:6,fontSize:11,color:'var(--text-muted)' }}>
                  {photo.weightKg&&<span>⚖️ {photo.weightKg} kg</span>}
                  {photo.bodyFatPercent&&<span>📊 {photo.bodyFatPercent}%</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ):(
        <div style={{ textAlign:'center',padding:64,color:'var(--text-muted)' }}>
          <Camera size={40} style={{ opacity:0.3,marginBottom:12 }}/><p>No progress photos yet. Click Upload New Photos to add some.</p>
        </div>
      )}
      {insights.length>0&&(
        <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)' }}>
          <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>Visual Progress Insights</div>
          {insights.map((ins:any,i:number)=>(
            <div key={i} style={{ display:'flex',gap:10,padding:'8px 0',borderBottom:i<insights.length-1?'1px solid var(--border)':'none',fontSize:12 }}>
              <CheckCircle size={14} color="var(--accent)" style={{ flexShrink:0,marginTop:2 }}/>
              <div>
                <div style={{ fontWeight:700 }}>{typeof ins==='string'?ins:ins.title}</div>
                {ins.detail&&<div style={{ fontSize:11,color:'var(--text-muted)',marginTop:2 }}>{ins.detail}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// ─── MP Notes ─────────────────────────────────────────────
function MPNotes({ d, memberId, search, setSearch, typeFilter, setTypeFilter, catFilter, setCatFilter, priFilter, setPriFilter, catColor, priColor, onAdd, onReload }: {
  d:any; memberId:string; search:string; setSearch:(v:string)=>void;
  typeFilter:string; setTypeFilter:(v:string)=>void; catFilter:string; setCatFilter:(v:string)=>void;
  priFilter:string; setPriFilter:(v:string)=>void; catColor:Record<string,string>; priColor:Record<string,string>;
  onAdd:()=>void; onReload:()=>void;
}) {
  const notes:any[] = d.notes||[];
  const ov = d.overview||{};
  const categories = d.categories||{};
  const filtered = notes.filter((n:any)=>{
    if(search && !((n.title||'').toLowerCase().includes(search.toLowerCase())||(n.body||'').toLowerCase().includes(search.toLowerCase()))) return false;
    if(typeFilter!=='All Types' && n.authorType!==typeFilter.toLowerCase()) return false;
    if(catFilter!=='All Categories' && n.category!==catFilter) return false;
    if(priFilter!=='All Priorities' && n.priority!==priFilter) return false;
    return true;
  });
  return (
    <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(145px,1fr))',gap:10 }}>
        {[
          { label:'Total Notes', value:ov.total??notes.length, icon:<FileText size={14} color="#0ea5e9"/> },
          { label:'Trainer Notes', value:ov.trainerNotes??notes.filter((n:any)=>n.authorType==='trainer').length, icon:<Edit2 size={14} color="#f59e0b"/> },
          { label:'Member Notes', value:ov.memberNotes??notes.filter((n:any)=>n.authorType==='member').length, icon:<BookOpen size={14} color="#22c55e"/> },
          { label:'Important Notes', value:ov.importantNotes??notes.filter((n:any)=>n.isImportant).length, icon:<Star size={14} color="#a78bfa"/> },
        ].map(c=>(
          <div key={c.label} style={{ background:'var(--bg-card)',borderRadius:12,padding:'14px 16px',border:'1px solid var(--border)',display:'flex',gap:10,alignItems:'center' }}>
            <div style={{ width:36,height:36,borderRadius:9,background:'var(--metric-bg)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>{c.icon}</div>
            <div><div style={{ fontSize:20,fontWeight:900 }}>{c.value??'—'}</div><div style={{ fontSize:11,color:'var(--text-muted)' }}>{c.label}</div></div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex',gap:10,flexWrap:'wrap',alignItems:'center' }}>
        <div style={{ position:'relative',flex:1,minWidth:200 }}>
          <Search size={13} style={{ position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)' }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search notes..." style={{ ...inputStyle,paddingLeft:30,width:'100%' }}/>
        </div>
        {[{v:typeFilter,s:setTypeFilter,opts:['All Types','Trainer','Member']},{v:catFilter,s:setCatFilter,opts:['All Categories','General','Nutrition','Performance','Injury / Pain','Personal','Other']},{v:priFilter,s:setPriFilter,opts:['All Priorities','High','Medium','Low','No Priority']}].map((f,i)=>(
          <select key={i} value={f.v} onChange={e=>f.s(e.target.value)} style={{ ...inputStyle,minWidth:130 }}>{f.opts.map(o=><option key={o}>{o}</option>)}</select>
        ))}
        <PrimaryBtn onClick={onAdd} style={{ fontSize:12 }}><Plus size={13}/> Add New Note</PrimaryBtn>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 260px',gap:14 }}>
        <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
          {filtered.length>0?filtered.map((note:any,i:number)=>(
            <div key={note.id||i} style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:`1px solid ${note.isImportant?'rgba(245,158,11,0.3)':'var(--border)'}`,position:'relative' }}>
              {note.isImportant&&<Star size={13} style={{ position:'absolute',top:16,right:16,color:'#f59e0b',fill:'#f59e0b' }}/>}
              <div style={{ display:'flex',gap:10,alignItems:'flex-start' }}>
                <div style={{ width:36,height:36,borderRadius:9,background:`${catColor[note.category]||'#6366f1'}15`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                  <FileText size={14} color={catColor[note.category]||'#6366f1'}/>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginBottom:4 }}>
                    <span style={{ fontWeight:800,fontSize:14 }}>{note.title}</span>
                    <span style={{ fontSize:10,padding:'2px 8px',borderRadius:20,background:`${catColor[note.category]||'#6366f1'}15`,color:catColor[note.category]||'#6366f1',fontWeight:700 }}>{note.category}</span>
                  </div>
                  <div style={{ fontSize:12,color:'var(--text-secondary)',marginBottom:8 }}>{note.body}</div>
                  <div style={{ fontSize:11,color:'var(--text-muted)' }}>By {note.authorName||note.author||'—'} · {note.createdAt||note.date||'—'}</div>
                </div>
                {note.priority&&note.priority!=='No Priority'&&<span style={{ fontSize:10,padding:'3px 9px',borderRadius:20,background:`${priColor[note.priority]}15`,color:priColor[note.priority],fontWeight:700,flexShrink:0 }}>{note.priority} Priority</span>}
              </div>
            </div>
          )):(
            <div style={{ textAlign:'center',padding:64,color:'var(--text-muted)' }}>
              <FileText size={40} style={{ opacity:0.3,marginBottom:12 }}/>
              <p>{search||typeFilter!=='All Types'||catFilter!=='All Categories'?'No notes match your filters.':'No notes yet. Add the first one!'}</p>
            </div>
          )}
        </div>
        <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
          <div style={{ background:'var(--bg-card)',borderRadius:14,padding:16,border:'1px solid var(--border)' }}>
            <div style={{ fontWeight:800,fontSize:13,marginBottom:10 }}>Quick Notes</div>
            {(d.quickNotes||[]).map((qn:string,i:number)=><div key={i} style={{ fontSize:11,color:'var(--text-secondary)',marginBottom:5 }}>• {qn}</div>)}
            {(d.quickNotes||[]).length===0&&<div style={{ fontSize:11,color:'var(--text-muted)' }}>No quick notes.</div>}
          </div>
          <div style={{ background:'var(--bg-card)',borderRadius:14,padding:16,border:'1px solid var(--border)' }}>
            <div style={{ fontWeight:800,fontSize:13,marginBottom:10 }}>Note Categories</div>
            {Object.entries(categories).map(([cat,count])=>(
              <div key={cat} style={{ display:'flex',justifyContent:'space-between',padding:'5px 0',fontSize:12,borderBottom:'1px solid var(--border)' }}>
                <span style={{ color:'var(--text-secondary)',display:'flex',alignItems:'center',gap:6 }}>
                  <span style={{ width:8,height:8,borderRadius:'50%',background:catColor[cat]||'#6366f1',display:'inline-block' }}/>{cat}
                </span>
                <span style={{ fontWeight:800 }}>{String(count)}</span>
              </div>
            ))}
          </div>
          <div style={{ background:'rgba(245,158,11,0.05)',borderRadius:14,padding:16,border:'1px solid rgba(245,158,11,0.2)' }}>
            <div style={{ fontWeight:800,fontSize:13,marginBottom:8 }}>💡 Note Tips</div>
            <div style={{ fontSize:11,color:'var(--text-secondary)' }}>Use notes to track observations, member feedback, and actionable steps. Well-documented notes lead to better results.</div>
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── Members Tab ──────────────────────────────────────────
function MembersTab({ orgId, branchId, onSelectMember }: {
  orgId: string; branchId: string; onSelectMember: (m: any) => void;
}) {
  const [members, setMembers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.trainer.listMembers().then(d => {
      setMembers((d.members || []).map(normalizeMember));
      setTotal(d.total || 0);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = search
    ? members.filter(m => `${m.firstName} ${m.lastName} ${m.userName}`.toLowerCase().includes(search.toLowerCase()))
    : members;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Assigned Members</h2>
          <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>{total} members assigned to you</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..."
              style={{ ...inputStyle, paddingLeft: 32, width: 200 }} />
          </div>
          <OutlineBtn onClick={load}><RefreshCw size={13} /></OutlineBtn>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Loader size={22} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)' }} /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 14 }}>
          {filtered.map(m => (
            <div key={m.userId} onClick={() => onSelectMember(m)}
              style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 18, border: '1px solid var(--border)', cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(61,191,150,0.12)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                {m.avatarUrl ? (
                  <img src={m.avatarUrl} alt={memberName(m)} style={{ width: 52, height: 52, borderRadius: 14, objectFit: 'cover', background: 'var(--metric-bg)', border: '1px solid var(--border)', flexShrink: 0 }} onError={e => (e.currentTarget.style.display = 'none')} />
                ) : (
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#0ea5e933,#0ea5e966)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#0ea5e9', flexShrink: 0 }}>
                    {memberName(m)[0].toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{memberName(m)}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{m.userName || '-'}</div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {m.progressStatus && <StatusBadge status={m.progressStatus} />}
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--metric-bg)', padding: '2px 8px', borderRadius: 20 }}>ID: {String(m.userId).slice(0, 8)}</span>
                  </div>
                  {m.goals && (
                    <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      {m.goals.weightTarget && <div style={{ background: 'var(--bg-base)', borderRadius: 8, padding: '6px 10px', fontSize: 11 }}><span style={{ color: 'var(--text-muted)' }}>Target: </span><strong>{m.goals.weightTarget} kg</strong></div>}
                      {m.goals.calorieBurnPerDay && <div style={{ background: 'var(--bg-base)', borderRadius: 8, padding: '6px 10px', fontSize: 11 }}><span style={{ color: 'var(--text-muted)' }}>Burn: </span><strong>{m.goals.calorieBurnPerDay} kcal</strong></div>}
                    </div>
                  )}
                </div>
                <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              <Users size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p>No members assigned yet. Contact your branch manager.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main TrainerDashboard ────────────────────────────────
export default function TrainerDashboard() {
  const { user } = useApp();
  const orgId    = user?.organizationId || '';
  const branchId = user?.branchId       || '';

  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashData, setDashData] = useState<any>(null);
  const [loadingDash, setLoadingDash] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [allMembers, setAllMembers] = useState<any[]>([]);

  const loadDashboard = useCallback(() => {
    setLoadingDash(true);
    api.trainer.getDashboard().then(setDashData).catch(() => {}).finally(() => setLoadingDash(false));
  }, []);

  const loadMembers = useCallback(() => {
    api.trainer.listMembers().then(d => setAllMembers((d.members || []).map(normalizeMember))).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') { loadDashboard(); loadMembers(); }
    if (activeTab === 'plateau' && allMembers.length === 0) loadMembers();
  }, [activeTab, loadDashboard, loadMembers, allMembers.length]);

  const handleSelectMember = (m: any) => {
    setSelectedMember(m);
    setActiveTab('progress');
  };

  return (
    <BrandingProvider orgId={orgId} branchId={branchId}>
      <LabelProvider organizationId={orgId} branchId={branchId}>
        <TrainerPortalContent
          orgId={orgId} branchId={branchId}
          user={user} activeTab={activeTab} setActiveTab={setActiveTab}
          dashData={dashData} loadingDash={loadingDash}
          selectedMember={selectedMember} setSelectedMember={setSelectedMember}
          allMembers={allMembers} handleSelectMember={handleSelectMember}
          onRefreshDashboard={() => { loadDashboard(); loadMembers(); }}
        />
      </LabelProvider>
    </BrandingProvider>
  );
}

// ── Inner portal that can read branding context ──────────────────────────
function TrainerPortalContent({ orgId, branchId, user, activeTab, setActiveTab, dashData, loadingDash, selectedMember, setSelectedMember, allMembers, handleSelectMember, onRefreshDashboard }: any) {
  const { branding } = useBranding();
  const { t } = useLabels();
  const navItems = NAV.map(item => ({ ...item, label: t(`trainer.menu.${item.id}`, item.label) }));

  return (
    <PortalLayout
      title={branding.appName || "FitPulseBot"}
      subtitle={t('trainer.dashboard.title', 'Trainer Portal')}
      accentColor={branding.primaryColor || "#f59e0b"}
      logoUrl={branding.logoUrl}
      navItems={navItems} activeTab={activeTab}
      onTabChange={(tab: string) => { if (tab !== 'progress') setSelectedMember(null); setActiveTab(tab); }}
      roleBadge={t('trainer.role_badge', 'TRAINER')} roleBadgeColor={branding.accentColor || branding.primaryColor || "#f59e0b"}
    >
      {/* DASHBOARD */}
      {activeTab === 'dashboard' && (
        <TrainerDashboardHome
          user={user}
          dashData={dashData}
          loadingDash={loadingDash}
          allMembers={allMembers}
          onSelectMember={handleSelectMember}
          onTabChange={setActiveTab}
          onRefresh={onRefreshDashboard}
        />
      )}

      {activeTab === 'members' && (
        <MembersTab orgId={orgId} branchId={branchId} onSelectMember={handleSelectMember} />
      )}

      {activeTab === 'workouts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Workout Plans</h2>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 32, border: '1px solid var(--border)', textAlign: 'center' }}>
            <Dumbbell size={40} style={{ color: '#f59e0b', opacity: 0.5, marginBottom: 12 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Go to <strong>My Members</strong>, select a member, then use <strong>AI Generate Plan</strong> or create manually.</p>
            <PrimaryBtn onClick={() => setActiveTab('members')} style={{ margin: '16px auto 0' }}><Users size={14} /> Go to My Members</PrimaryBtn>
          </div>
        </div>
      )}

      {activeTab === 'diets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Diet Plans</h2>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 32, border: '1px solid var(--border)', textAlign: 'center' }}>
            <Salad size={40} style={{ color: '#f59e0b', opacity: 0.5, marginBottom: 12 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Go to <strong>My Members</strong>, select a member, then use <strong>AI Generate Diet</strong> or create manually.</p>
            <PrimaryBtn onClick={() => setActiveTab('members')} style={{ margin: '16px auto 0' }}><Users size={14} /> Go to My Members</PrimaryBtn>
          </div>
        </div>
      )}

      {activeTab === 'plateau' && (
        <PlateauDashboard members={allMembers.length ? allMembers : []} orgId={orgId} branchId={branchId} />
      )}

      {activeTab === 'reports' && (
        <MyReportsPage audience="resource" />
      )}

      {activeTab === 'progress' && (
        selectedMember ? (
          <MemberProgressPanel
            member={selectedMember} orgId={orgId} branchId={branchId}
            onBack={() => { setSelectedMember(null); setActiveTab('members'); }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Progress Tracking</h2>
            <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 32, border: '1px solid var(--border)', textAlign: 'center' }}>
              <TrendingUp size={40} style={{ color: '#f59e0b', opacity: 0.5, marginBottom: 12 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Click any member card to open their full progress dashboard.</p>
              <PrimaryBtn onClick={() => setActiveTab('members')} style={{ margin: '16px auto 0' }}><Users size={14} /> Select a Member</PrimaryBtn>
            </div>
          </div>
        )
      )}
    </PortalLayout>
  );
}
