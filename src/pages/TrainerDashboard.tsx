import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../App';
import PortalLayout, {
  StatCard, SectionHeader, PrimaryBtn, OutlineBtn, StatusBadge,
  Modal, FormField, inputStyle, DataTable, GRID4, GRID2,
} from '../components/PortalLayout';
import { api } from '../api';
import { normalizeProfileImageUrl } from '../profileImageUrl';
import {
  LayoutDashboard, Users, Dumbbell, Salad, TrendingUp, Ruler,
  Plus, RefreshCw, Loader, Search, ArrowLeft,
  Target, Scale, Activity, CalendarCheck,
  ChevronRight, X, Sparkles, Zap, Brain, AlertTriangle,
  CheckCircle, Clock, BarChart3, Flame, Apple, Beef,
  AlertCircle, ChevronDown, ChevronUp, Bot, Lightbulb,
} from 'lucide-react';
import { BrandingProvider, useBranding } from '../contexts/BrandingContext';

// ─── NAV ─────────────────────────────────────────────────
const NAV = [
  { id: 'dashboard',  label: 'Dashboard',         icon: <LayoutDashboard size={16} /> },
  { id: 'members',    label: 'My Members',         icon: <Users size={16} /> },
  { id: 'workouts',   label: 'Workouts',           icon: <Dumbbell size={16} /> },
  { id: 'diets',      label: 'Diet Plans',         icon: <Salad size={16} /> },
  { id: 'plateau',    label: 'Plateau AI',         icon: <Brain size={16} /> },
  { id: 'progress',   label: 'Progress',           icon: <TrendingUp size={16} /> },
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

// ─── Member Progress Panel ────────────────────────────────
function MemberProgressPanel({ member, orgId, branchId, onBack }: {
  member: any; orgId: string; branchId: string; onBack: () => void;
}) {
  const [progress, setProgress] = useState<any>(null);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [dietPlans, setDietPlans] = useState<any[]>([]);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'overview'|'workouts'|'diets'|'measurements'>('overview');
  const [workoutModal, setWorkoutModal] = useState(false);
  const [aiWorkoutModal, setAiWorkoutModal] = useState(false);
  const [dietModal, setDietModal] = useState(false);
  const [aiDietModal, setAiDietModal] = useState(false);
  const [measurementModal, setMeasurementModal] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [prog, w, d, m] = await Promise.all([
        api.trainer.getMemberProgress(member.userId),
        api.trainer.listWorkouts(member.userId),
        api.trainer.listDietPlans(member.userId),
        api.trainer.getMeasurements(member.userId),
      ]);
      setProgress(prog);
      setWorkouts(w.workouts || []);
      setDietPlans(d.dietPlans || []);
      setMeasurements(m.measurements || []);
    } catch (e) {}
    finally { setLoading(false); }
  }, [member.userId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const wt = progress?.weightTracking || {};
  const att = progress?.attendanceSummary || {};
  const latest = progress?.bodyMeasurements?.latest || {};
  const analytics = progress?.progressAnalytics || {};

  const sections = [
    { id: 'overview' as const, label: 'Overview', icon: <TrendingUp size={14} /> },
    { id: 'workouts' as const, label: `Workouts (${workouts.length})`, icon: <Dumbbell size={14} /> },
    { id: 'diets' as const, label: `Diets (${dietPlans.length})`, icon: <Salad size={14} /> },
    { id: 'measurements' as const, label: `Measurements (${measurements.length})`, icon: <Ruler size={14} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <OutlineBtn onClick={onBack} style={{ padding: '8px 12px' }}><ArrowLeft size={14} /> Back</OutlineBtn>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {member.avatarUrl ? (
            <img src={member.avatarUrl} alt={memberName(member)} style={{ width: 48, height: 48, borderRadius: 14, objectFit: 'cover', background: 'var(--metric-bg)', border: '1px solid var(--border)' }} onError={e => (e.currentTarget.style.display = 'none')} />
          ) : (
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#0ea5e933,#0ea5e966)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#0ea5e9' }}>
              {memberName(member)[0].toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>{memberName(member)}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{member.userName}</div>
          </div>
          {analytics.status && <StatusBadge status={analytics.status} />}
        </div>
      </div>

      {/* Section Tabs */}
      <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--border)' }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
            padding: '9px 14px', borderRadius: '10px 10px 0 0', fontSize: 12, fontWeight: 700,
            background: activeSection === s.id ? 'var(--bg-card)' : 'transparent',
            color: activeSection === s.id ? 'var(--accent)' : 'var(--text-muted)',
            border: activeSection === s.id ? '1px solid var(--border)' : '1px solid transparent',
            borderBottom: activeSection === s.id ? '1px solid var(--bg-card)' : '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 6, marginBottom: -1,
          }}>{s.icon}{s.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Loader size={22} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)' }} /></div>
      ) : (
        <>
          {activeSection === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
                <StatCard label="Current Weight" value={wt.currentWeightKg ? `${wt.currentWeightKg} kg` : '—'} icon={<Scale size={18} />} color="#0ea5e9" />
                <StatCard label="Weight Change" value={wt.changeKg ? `${wt.changeKg > 0 ? '+' : ''}${wt.changeKg} kg` : '—'} icon={<TrendingUp size={18} />} color={wt.changeKg < 0 ? 'var(--accent)' : 'var(--danger)'} />
                <StatCard label="Days Present" value={att.present || 0} icon={<CalendarCheck size={18} />} color="var(--accent)" />
                <StatCard label="Days Absent" value={att.absent || 0} icon={<Activity size={18} />} color="var(--danger)" />
              </div>
              {wt.startWeightKg && wt.targetWeightKg && wt.currentWeightKg && (
                <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 20, border: '1px solid var(--border)' }}>
                  <SectionHeader title="Weight Progress" />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                    <span>Start: {wt.startWeightKg} kg</span>
                    <span>Current: <strong style={{ color: 'var(--text-primary)' }}>{wt.currentWeightKg} kg</strong></span>
                    <span>Target: {wt.targetWeightKg} kg</span>
                  </div>
                  {(() => {
                    const total = Math.abs(wt.startWeightKg - wt.targetWeightKg);
                    const done = Math.abs(wt.startWeightKg - wt.currentWeightKg);
                    const pct = Math.min(100, Math.round((done / total) * 100)) || 0;
                    return (
                      <div>
                        <div style={{ height: 10, borderRadius: 20, background: 'var(--metric-bg)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, borderRadius: 20, background: 'linear-gradient(90deg,var(--accent),var(--accent-3))', transition: 'width 0.5s' }} />
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, marginTop: 6, textAlign: 'right' }}>{pct}% toward goal</div>
                      </div>
                    );
                  })()}
                </div>
              )}
              {latest.measurementDate && (
                <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 20, border: '1px solid var(--border)' }}>
                  <SectionHeader title={`Latest Measurements — ${latest.measurementDate}`} />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10 }}>
                    {[{ label: 'Chest', value: latest.chestCm, unit: 'cm' }, { label: 'Waist', value: latest.waistCm, unit: 'cm' }, { label: 'Hip', value: latest.hipCm, unit: 'cm' }, { label: 'Body Fat', value: latest.bodyFatPercent, unit: '%' }]
                      .filter(m => m.value != null).map(m => (
                        <div key={m.label} style={{ background: 'var(--bg-base)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--border)', textAlign: 'center' }}>
                          <div style={{ fontSize: 18, fontWeight: 900 }}>{m.value}<span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 2 }}>{m.unit}</span></div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{m.label}</div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              {analytics.notes && (
                <div style={{ background: 'rgba(61,191,150,0.08)', borderRadius: 12, padding: '14px 18px', border: '1px solid var(--accent)33', fontSize: 13, color: 'var(--text-secondary)' }}>
                  💡 {analytics.notes}
                </div>
              )}
            </div>
          )}

          {activeSection === 'workouts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Action Buttons with AI prominently featured */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
                <OutlineBtn onClick={() => setWorkoutModal(true)} style={{ fontSize: 12 }}><Plus size={13} /> Manual Plan</OutlineBtn>
                <PrimaryBtn onClick={() => setAiWorkoutModal(true)} style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', fontSize: 12 }}>
                  <Sparkles size={13} /> AI Generate Plan
                </PrimaryBtn>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
                {workouts.map(w => (
                  <div key={w.id} style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 18, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
                          {w.title}
                          {w.createdByType === 'AI' && <AIBadge />}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{w.goal?.replace('_',' ')} · {w.level}</div>
                      </div>
                      <StatusBadge status={w.status} />
                    </div>
                    <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>📅 {w.startDate} → {w.endDate || 'Ongoing'}</div>
                    <div style={{ marginTop: 12 }}>
                      <button onClick={() => api.trainer.deleteWorkout(w.id).then(loadAll)} style={{ fontSize: 11, padding: '5px 10px', borderRadius: 7, color: 'var(--danger)', background: 'rgba(229,62,62,0.08)', border: '1px solid rgba(229,62,62,0.2)' }}>Remove</button>
                    </div>
                  </div>
                ))}
                {workouts.length === 0 && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                    <Dumbbell size={36} style={{ opacity: 0.3, marginBottom: 10 }} />
                    <p>No workout plans yet. Use AI Generate or create one manually.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'diets' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
                <OutlineBtn onClick={() => setDietModal(true)} style={{ fontSize: 12 }}><Plus size={13} /> Manual Plan</OutlineBtn>
                <PrimaryBtn onClick={() => setAiDietModal(true)} style={{ background: 'linear-gradient(135deg,#059669,#10b981)', fontSize: 12 }}>
                  <Sparkles size={13} /> AI Generate Diet
                </PrimaryBtn>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
                {dietPlans.map(d => (
                  <div key={d.id} style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 18, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
                          {d.title}
                          {d.createdByType === 'AI' && <AIBadge />}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{d.goal?.replace('_',' ')}</div>
                      </div>
                      <StatusBadge status={d.status} />
                    </div>
                    <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      {[{ label: 'Calories', value: `${d.calorieTarget} kcal` }, { label: 'Protein', value: `${d.proteinTargetG}g` }].map(m => (
                        <div key={m.label} style={{ background: 'var(--bg-base)', borderRadius: 8, padding: '8px 10px' }}>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{m.value}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>📅 {d.startDate} → {d.endDate || 'Ongoing'}</div>
                    <div style={{ marginTop: 12 }}>
                      <button onClick={() => api.trainer.deleteDietPlan(d.id).then(loadAll)} style={{ fontSize: 11, padding: '5px 10px', borderRadius: 7, color: 'var(--danger)', background: 'rgba(229,62,62,0.08)', border: '1px solid rgba(229,62,62,0.2)' }}>Remove</button>
                    </div>
                  </div>
                ))}
                {dietPlans.length === 0 && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                    <Salad size={36} style={{ opacity: 0.3, marginBottom: 10 }} />
                    <p>No diet plans yet. Use AI Generate or create one manually.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'measurements' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <PrimaryBtn onClick={() => setMeasurementModal(true)}><Plus size={14} /> Add Measurement</PrimaryBtn>
              </div>
              <DataTable
                columns={[
                  { key: 'measurementDate', label: 'Date' },
                  { key: 'chestCm', label: 'Chest', render: r => r.chestCm ? `${r.chestCm} cm` : '—' },
                  { key: 'waistCm', label: 'Waist', render: r => r.waistCm ? `${r.waistCm} cm` : '—' },
                  { key: 'hipCm', label: 'Hip', render: r => r.hipCm ? `${r.hipCm} cm` : '—' },
                  { key: 'armCm', label: 'Arm', render: r => r.armCm ? `${r.armCm} cm` : '—' },
                  { key: 'thighCm', label: 'Thigh', render: r => r.thighCm ? `${r.thighCm} cm` : '—' },
                  { key: 'bodyFatPercent', label: 'Body Fat', render: r => r.bodyFatPercent ? `${r.bodyFatPercent}%` : '—' },
                  { key: 'notes', label: 'Notes', render: r => <span style={{ color: 'var(--text-muted)' }}>{r.notes || '—'}</span> },
                ]}
                rows={measurements}
                emptyMsg="No measurements recorded yet."
              />
            </div>
          )}
        </>
      )}

      <WorkoutFormModal open={workoutModal} onClose={() => setWorkoutModal(false)} memberId={member.userId} orgId={orgId} branchId={branchId} onSaved={loadAll} />
      <AIWorkoutGeneratorModal open={aiWorkoutModal} onClose={() => setAiWorkoutModal(false)} memberId={member.userId} orgId={orgId} branchId={branchId} onSaved={loadAll} />
      <DietPlanModal open={dietModal} onClose={() => setDietModal(false)} memberId={member.userId} orgId={orgId} branchId={branchId} onSaved={loadAll} />
      <AIDietGeneratorModal open={aiDietModal} onClose={() => setAiDietModal(false)} memberId={member.userId} orgId={orgId} branchId={branchId} onSaved={loadAll} />
      <MeasurementModal open={measurementModal} onClose={() => setMeasurementModal(false)} memberId={member.userId} onSaved={loadAll} />
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
    if (activeTab === 'dashboard') loadDashboard();
    if (activeTab === 'plateau' && allMembers.length === 0) loadMembers();
  }, [activeTab, loadDashboard, loadMembers, allMembers.length]);

  const handleSelectMember = (m: any) => {
    setSelectedMember(m);
    setActiveTab('progress');
  };

  return (
    <BrandingProvider orgId={orgId} branchId={branchId}>
    <TrainerPortalContent
      orgId={orgId} branchId={branchId}
      user={user} activeTab={activeTab} setActiveTab={setActiveTab}
      dashData={dashData} loadingDash={loadingDash}
      selectedMember={selectedMember} setSelectedMember={setSelectedMember}
      allMembers={allMembers} handleSelectMember={handleSelectMember}
    />
    </BrandingProvider>
  );
}

// ── Inner portal that can read branding context ──────────────────────────
function TrainerPortalContent({ orgId, branchId, user, activeTab, setActiveTab, dashData, loadingDash, selectedMember, setSelectedMember, allMembers, handleSelectMember }: any) {
  const { branding } = useBranding();

  const schedToday = dashData?.todaySchedule || [];
  const ps = dashData?.progressSummary || {};

  return (
    <PortalLayout
      title={branding.appName || "FitPulseBot"}
      subtitle="Trainer Portal"
      accentColor={branding.primaryColor || "#f59e0b"}
      logoUrl={branding.logoUrl}
      navItems={NAV} activeTab={activeTab}
      onTabChange={(tab: string) => { if (tab !== 'progress') setSelectedMember(null); setActiveTab(tab); }}
      roleBadge="TRAINER" roleBadgeColor={branding.accentColor || branding.primaryColor || "#f59e0b"}
    >
      {/* DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px' }}>
              Welcome, {user?.firstName || 'Trainer'} 👋
            </h2>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>Here's your training overview for today</p>
          </div>

          {/* AI Feature highlights */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 12 }}>
            {[
              { label: 'AI Workout Generator', desc: 'Build plans in seconds', color: 'linear-gradient(135deg,#7c3aed,#3b82f6)', icon: <Sparkles size={20} color="#fff" />, tab: 'members' },
              { label: 'AI Diet Planner', desc: 'Indian food, macro-aware', color: 'linear-gradient(135deg,#059669,#10b981)', icon: <Salad size={20} color="#fff" />, tab: 'members' },
              { label: 'Plateau Detection', desc: 'Find why members stall', color: 'linear-gradient(135deg,#6366f1,#8b5cf6)', icon: <Brain size={20} color="#fff" />, tab: 'plateau' },
            ].map(card => (
              <div key={card.label} onClick={() => setActiveTab(card.tab)}
                style={{ background: card.color, borderRadius: 14, padding: '18px 20px', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s', display: 'flex', gap: 14, alignItems: 'center' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {card.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#fff' }}>{card.label}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>{card.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {loadingDash ? (
            <div style={{ textAlign: 'center', padding: 48 }}><Loader size={22} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)' }} /></div>
          ) : (
            <>
              <div style={GRID4}>
                <StatCard label="Assigned Members" value={dashData?.assignedMembers || 0} icon={<Users size={18} />} color="#0ea5e9" />
                <StatCard label="Today's Sessions" value={dashData?.todaySessions || 0} icon={<CalendarCheck size={18} />} color="#f59e0b" />
                <StatCard label="Pending Plans" value={dashData?.pendingPlans || 0} icon={<Target size={18} />} color="var(--danger)" />
                <StatCard label="Improving" value={ps.membersImproving || 0} icon={<TrendingUp size={18} />} color="var(--accent)" />
              </div>

              <div style={GRID2}>
                <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, border: '1px solid var(--border)' }}>
                  <SectionHeader title="Today's Schedule" />
                  {schedToday.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                      <CalendarCheck size={30} style={{ opacity: 0.3, marginBottom: 8 }} />
                      <p style={{ fontSize: 13 }}>No sessions scheduled for today</p>
                    </div>
                  ) : schedToday.map((s: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i < schedToday.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#f59e0b', flexShrink: 0 }}>
                        {s.scheduledTime?.slice(0, 5) || '?'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{s.memberName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Workout session</div>
                      </div>
                      <StatusBadge status={s.status} />
                    </div>
                  ))}
                </div>

                <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, border: '1px solid var(--border)' }}>
                  <SectionHeader title="Progress Summary" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 4 }}>
                    {[
                      { label: 'Members Improving', value: ps.membersImproving || 0, color: 'var(--accent)' },
                      { label: 'Need Attention', value: ps.membersNeedAttention || 0, color: 'var(--danger)' },
                      { label: 'Avg Weight Change', value: ps.avgWeightChangeKg ? `${ps.avgWeightChangeKg} kg` : '—', color: ps.avgWeightChangeKg < 0 ? 'var(--accent)' : 'var(--warning)' },
                    ].map(s => (
                      <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.label}</span>
                        <span style={{ fontSize: 16, fontWeight: 900, color: s.color }}>{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
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
