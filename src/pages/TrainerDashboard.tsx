import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../App';
import PortalLayout, {
  StatCard, SectionHeader, PrimaryBtn, OutlineBtn, StatusBadge,
  Modal, FormField, inputStyle, DataTable, GRID4, GRID2,
} from '../components/PortalLayout';
import { api } from '../api';
import {
  LayoutDashboard, Users, Dumbbell, Salad, TrendingUp, Ruler,
  Plus, Edit2, Trash2, RefreshCw, Loader, Search, ArrowLeft,
  CheckCircle2, Target, Scale, Activity, CalendarCheck,
  ChevronRight, X,
} from 'lucide-react';

// ─── NAV ─────────────────────────────────────────────────
const NAV = [
  { id: 'dashboard', label: 'Dashboard',    icon: <LayoutDashboard size={16} /> },
  { id: 'members',   label: 'My Members',   icon: <Users size={16} /> },
  { id: 'workouts',  label: 'Workouts',     icon: <Dumbbell size={16} /> },
  { id: 'diets',     label: 'Diet Plans',   icon: <Salad size={16} /> },
  { id: 'progress',  label: 'Progress',     icon: <TrendingUp size={16} /> },
];

// ─── Workout Form Modal ───────────────────────────────────
function WorkoutFormModal({ open, onClose, memberId, orgId, branchId, onSaved }: {
  open: boolean; onClose: () => void; memberId: string;
  orgId: string; branchId: string; onSaved: () => void;
}) {
  const initExercise = () => ({ exerciseName: '', category: 'CARDIO', sets: 3, reps: 12, durationMin: 0, restSeconds: 60, sequenceNo: 1, notes: '' });
  const [form, setForm] = useState({
    title: '', goal: 'FAT_LOSS', level: 'BEGINNER',
    startDate: '', endDate: '', exercises: [initExercise()],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm({ title: '', goal: 'FAT_LOSS', level: 'BEGINNER', startDate: '', endDate: '', exercises: [initExercise()] });
      setError('');
    }
  }, [open]);

  const fMain = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const fEx = (i: number, k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => {
      const exercises = [...p.exercises];
      exercises[i] = { ...exercises[i], [k]: e.target.value };
      return { ...p, exercises };
    });

  const addEx = () => setForm(p => ({ ...p, exercises: [...p.exercises, { ...initExercise(), sequenceNo: p.exercises.length + 1 }] }));
  const removeEx = (i: number) => setForm(p => ({ ...p, exercises: p.exercises.filter((_, idx) => idx !== i) }));

  const submit = async () => {
    if (!form.title) { setError('Title is required.'); return; }
    setError(''); setLoading(true);
    try {
      await api.trainer.createWorkout(memberId, {
        organizationId: orgId, branchId, createdByType: 'TRAINER',
        ...form,
        exercises: form.exercises.map((e, i) => ({ ...e, sequenceNo: i + 1, sets: Number(e.sets), reps: Number(e.reps), durationMin: Number(e.durationMin), restSeconds: Number(e.restSeconds) })),
      });
      onSaved(); onClose();
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Workout Plan" width={680}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FormField label="Title" required>
          <input style={inputStyle} value={form.title} onChange={fMain('title')} placeholder="Fat Loss Beginner Plan" />
        </FormField>
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
        <FormField label="Start Date">
          <input type="date" style={inputStyle} value={form.startDate} onChange={fMain('startDate')} />
        </FormField>
        <FormField label="End Date">
          <input type="date" style={inputStyle} value={form.endDate} onChange={fMain('endDate')} />
        </FormField>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', margin: 0 }}>Exercises</p>
          <OutlineBtn onClick={addEx} style={{ fontSize: 11, padding: '5px 10px' }}><Plus size={12} /> Add Exercise</OutlineBtn>
        </div>
        {form.exercises.map((ex, i) => (
          <div key={i} style={{ background: 'var(--bg-base)', borderRadius: 12, padding: 14, marginBottom: 10, border: '1px solid var(--border)', position: 'relative' }}>
            <button onClick={() => removeEx(i)} style={{ position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', background: 'rgba(229,62,62,0.08)', border: '1px solid rgba(229,62,62,0.2)' }}><X size={11} /></button>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 10 }}>
              <FormField label="Exercise Name">
                <input style={inputStyle} value={ex.exerciseName} onChange={fEx(i, 'exerciseName')} placeholder="Treadmill Walk" />
              </FormField>
              <FormField label="Category">
                <select style={inputStyle} value={ex.category} onChange={fEx(i, 'category')}>
                  {['CARDIO','STRENGTH','FLEXIBILITY','HIIT','YOGA'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormField>
              <FormField label="Sets"><input type="number" style={inputStyle} value={ex.sets} onChange={fEx(i, 'sets')} /></FormField>
              <FormField label="Reps"><input type="number" style={inputStyle} value={ex.reps} onChange={fEx(i, 'reps')} /></FormField>
              <FormField label="Duration (min)"><input type="number" style={inputStyle} value={ex.durationMin} onChange={fEx(i, 'durationMin')} /></FormField>
              <FormField label="Rest (sec)"><input type="number" style={inputStyle} value={ex.restSeconds} onChange={fEx(i, 'restSeconds')} /></FormField>
            </div>
          </div>
        ))}
      </div>

      {error && <p style={{ color: 'var(--danger)', fontSize: 12, margin: 0 }}>{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <OutlineBtn onClick={onClose}>Cancel</OutlineBtn>
        <PrimaryBtn onClick={submit} loading={loading}>
          {loading && <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} />}
          Create Plan
        </PrimaryBtn>
      </div>
    </Modal>
  );
}

// ─── Diet Plan Form Modal ─────────────────────────────────
function DietPlanModal({ open, onClose, memberId, orgId, branchId, onSaved }: {
  open: boolean; onClose: () => void; memberId: string;
  orgId: string; branchId: string; onSaved: () => void;
}) {
  const initItem = () => ({ mealType: 'breakfast', foodName: '', quantity: 1, servingUnit: 'serving', calories: 0, proteinG: 0, carbsG: 0, fatG: 0, sequenceNo: 1, notes: '' });
  const [form, setForm] = useState({
    title: '', goal: 'FAT_LOSS', calorieTarget: 2000, proteinTargetG: 120,
    startDate: '', endDate: '', items: [initItem()],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) { setForm({ title: '', goal: 'FAT_LOSS', calorieTarget: 2000, proteinTargetG: 120, startDate: '', endDate: '', items: [initItem()] }); setError(''); }
  }, [open]);

  const fMain = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const fItem = (i: number, k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => { const items = [...p.items]; items[i] = { ...items[i], [k]: e.target.value }; return { ...p, items }; });

  const addItem = () => setForm(p => ({ ...p, items: [...p.items, { ...initItem(), sequenceNo: p.items.length + 1 }] }));
  const removeItem = (i: number) => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));

  const submit = async () => {
    if (!form.title) { setError('Title is required.'); return; }
    setError(''); setLoading(true);
    try {
      await api.trainer.createDietPlan(memberId, {
        organizationId: orgId, branchId, createdByType: 'TRAINER',
        ...form, calorieTarget: Number(form.calorieTarget), proteinTargetG: Number(form.proteinTargetG),
        items: form.items.map((item, i) => ({ ...item, sequenceNo: i + 1, quantity: Number(item.quantity), calories: Number(item.calories), proteinG: Number(item.proteinG), carbsG: Number(item.carbsG), fatG: Number(item.fatG) })),
      });
      onSaved(); onClose();
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Diet Plan" width={680}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FormField label="Title" required><input style={inputStyle} value={form.title} onChange={fMain('title')} placeholder="High Protein Fat Loss" /></FormField>
        <FormField label="Goal">
          <select style={inputStyle} value={form.goal} onChange={fMain('goal')}>
            {['FAT_LOSS','MUSCLE_GAIN','MAINTENANCE','DIABETIC','KETO'].map(g => <option key={g} value={g}>{g.replace('_',' ')}</option>)}
          </select>
        </FormField>
        <FormField label="Calorie Target (kcal)"><input type="number" style={inputStyle} value={form.calorieTarget} onChange={fMain('calorieTarget')} /></FormField>
        <FormField label="Protein Target (g)"><input type="number" style={inputStyle} value={form.proteinTargetG} onChange={fMain('proteinTargetG')} /></FormField>
        <FormField label="Start Date"><input type="date" style={inputStyle} value={form.startDate} onChange={fMain('startDate')} /></FormField>
        <FormField label="End Date"><input type="date" style={inputStyle} value={form.endDate} onChange={fMain('endDate')} /></FormField>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', margin: 0 }}>Meal Items</p>
          <OutlineBtn onClick={addItem} style={{ fontSize: 11, padding: '5px 10px' }}><Plus size={12} /> Add Item</OutlineBtn>
        </div>
        {form.items.map((item, i) => (
          <div key={i} style={{ background: 'var(--bg-base)', borderRadius: 12, padding: 14, marginBottom: 10, border: '1px solid var(--border)', position: 'relative' }}>
            <button onClick={() => removeItem(i)} style={{ position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', background: 'rgba(229,62,62,0.08)', border: '1px solid rgba(229,62,62,0.2)' }}><X size={11} /></button>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 10 }}>
              <FormField label="Meal Type">
                <select style={inputStyle} value={item.mealType} onChange={fItem(i, 'mealType')}>
                  {['breakfast','lunch','dinner','snack','pre_workout','post_workout'].map(m => <option key={m} value={m}>{m.replace('_',' ')}</option>)}
                </select>
              </FormField>
              <FormField label="Food Name"><input style={inputStyle} value={item.foodName} onChange={fItem(i, 'foodName')} placeholder="Oats with whey" /></FormField>
              <FormField label="Qty"><input type="number" style={inputStyle} value={item.quantity} onChange={fItem(i, 'quantity')} /></FormField>
              <FormField label="Unit"><input style={inputStyle} value={item.servingUnit} onChange={fItem(i, 'servingUnit')} placeholder="bowl" /></FormField>
              <FormField label="Calories"><input type="number" style={inputStyle} value={item.calories} onChange={fItem(i, 'calories')} /></FormField>
              <FormField label="Protein (g)"><input type="number" style={inputStyle} value={item.proteinG} onChange={fItem(i, 'proteinG')} /></FormField>
              <FormField label="Carbs (g)"><input type="number" style={inputStyle} value={item.carbsG} onChange={fItem(i, 'carbsG')} /></FormField>
              <FormField label="Fat (g)"><input type="number" style={inputStyle} value={item.fatG} onChange={fItem(i, 'fatG')} /></FormField>
            </div>
          </div>
        ))}
      </div>

      {error && <p style={{ color: 'var(--danger)', fontSize: 12, margin: 0 }}>{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <OutlineBtn onClick={onClose}>Cancel</OutlineBtn>
        <PrimaryBtn onClick={submit} loading={loading}>
          {loading && <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} />}
          Create Diet Plan
        </PrimaryBtn>
      </div>
    </Modal>
  );
}

// ─── Measurement Form Modal ───────────────────────────────
function MeasurementModal({ open, onClose, memberId, onSaved }: {
  open: boolean; onClose: () => void; memberId: string; onSaved: () => void;
}) {
  const [form, setForm] = useState({ measurementDate: new Date().toISOString().split('T')[0], chestCm: '', waistCm: '', hipCm: '', armCm: '', thighCm: '', bodyFatPercent: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) { setForm({ measurementDate: new Date().toISOString().split('T')[0], chestCm: '', waistCm: '', hipCm: '', armCm: '', thighCm: '', bodyFatPercent: '', notes: '' }); setError(''); }
  }, [open]);

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
      <FormField label="Measurement Date">
        <input type="date" style={inputStyle} value={form.measurementDate} onChange={f('measurementDate')} />
      </FormField>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <FormField label="Chest (cm)"><input type="number" style={inputStyle} value={form.chestCm} onChange={f('chestCm')} placeholder="100" /></FormField>
        <FormField label="Waist (cm)"><input type="number" style={inputStyle} value={form.waistCm} onChange={f('waistCm')} placeholder="86" /></FormField>
        <FormField label="Hip (cm)"><input type="number" style={inputStyle} value={form.hipCm} onChange={f('hipCm')} placeholder="96" /></FormField>
        <FormField label="Arm (cm)"><input type="number" style={inputStyle} value={form.armCm} onChange={f('armCm')} placeholder="34" /></FormField>
        <FormField label="Thigh (cm)"><input type="number" style={inputStyle} value={form.thighCm} onChange={f('thighCm')} placeholder="55" /></FormField>
        <FormField label="Body Fat %"><input type="number" style={inputStyle} value={form.bodyFatPercent} onChange={f('bodyFatPercent')} placeholder="22" /></FormField>
      </div>
      <FormField label="Notes">
        <input style={inputStyle} value={form.notes} onChange={f('notes')} placeholder="Visible improvement..." />
      </FormField>
      {error && <p style={{ color: 'var(--danger)', fontSize: 12, margin: 0 }}>{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <OutlineBtn onClick={onClose}>Cancel</OutlineBtn>
        <PrimaryBtn onClick={submit} loading={loading}>
          {loading && <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} />}
          Save Measurement
        </PrimaryBtn>
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
  const [dietModal, setDietModal] = useState(false);
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

  const sections: { id: typeof activeSection; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <TrendingUp size={14} /> },
    { id: 'workouts', label: `Workouts (${workouts.length})`, icon: <Dumbbell size={14} /> },
    { id: 'diets', label: `Diets (${dietPlans.length})`, icon: <Salad size={14} /> },
    { id: 'measurements', label: `Measurements (${measurements.length})`, icon: <Ruler size={14} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <OutlineBtn onClick={onBack} style={{ padding: '8px 12px' }}><ArrowLeft size={14} /> Back</OutlineBtn>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#0ea5e933,#0ea5e966)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#0ea5e9' }}>
            {(member.firstName || member.userName || '?')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>{member.firstName} {member.lastName}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{member.userName}</div>
          </div>
          {analytics.status && <StatusBadge status={analytics.status} />}
        </div>
      </div>

      {/* Section Tabs */}
      <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
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
          {/* OVERVIEW */}
          {activeSection === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
                <StatCard label="Current Weight" value={wt.currentWeightKg ? `${wt.currentWeightKg} kg` : '—'} icon={<Scale size={18} />} color="#0ea5e9" />
                <StatCard label="Weight Change" value={wt.changeKg ? `${wt.changeKg > 0 ? '+' : ''}${wt.changeKg} kg` : '—'} icon={<TrendingUp size={18} />} color={wt.changeKg < 0 ? 'var(--accent)' : 'var(--danger)'} />
                <StatCard label="Days Present" value={att.present || 0} icon={<CalendarCheck size={18} />} color="var(--accent)" />
                <StatCard label="Days Absent" value={att.absent || 0} icon={<Activity size={18} />} color="var(--danger)" />
              </div>

              {/* Weight Progress Bar */}
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
                    const done  = Math.abs(wt.startWeightKg - wt.currentWeightKg);
                    const pct   = Math.min(100, Math.round((done / total) * 100)) || 0;
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

              {/* Latest Measurements */}
              {latest.measurementDate && (
                <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 20, border: '1px solid var(--border)' }}>
                  <SectionHeader title={`Latest Measurements — ${latest.measurementDate}`} />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10 }}>
                    {[
                      { label: 'Chest', value: latest.chestCm, unit: 'cm' },
                      { label: 'Waist', value: latest.waistCm, unit: 'cm' },
                      { label: 'Hip', value: latest.hipCm, unit: 'cm' },
                      { label: 'Body Fat', value: latest.bodyFatPercent, unit: '%' },
                    ].filter(m => m.value != null).map(m => (
                      <div key={m.label} style={{ background: 'var(--bg-base)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--border)', textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)' }}>{m.value}<span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 2 }}>{m.unit}</span></div>
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

          {/* WORKOUTS */}
          {activeSection === 'workouts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <PrimaryBtn onClick={() => setWorkoutModal(true)}><Plus size={14} /> New Workout Plan</PrimaryBtn>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
                {workouts.map(w => (
                  <div key={w.id} style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 18, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14 }}>{w.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{w.goal?.replace('_',' ')} · {w.level}</div>
                      </div>
                      <StatusBadge status={w.status} />
                    </div>
                    <div style={{ marginTop: 10, display: 'flex', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                      <span>📅 {w.startDate} → {w.endDate || 'Ongoing'}</span>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 10, color: 'var(--text-muted)' }}>By: {w.createdByType}</div>
                    <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                      <button onClick={() => api.trainer.deleteWorkout(w.id).then(loadAll)} style={{
                        fontSize: 11, padding: '5px 10px', borderRadius: 7, color: 'var(--danger)',
                        background: 'rgba(229,62,62,0.08)', border: '1px solid rgba(229,62,62,0.2)',
                      }}>Remove</button>
                    </div>
                  </div>
                ))}
                {workouts.length === 0 && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                    <Dumbbell size={36} style={{ opacity: 0.3, marginBottom: 10 }} />
                    <p>No workout plans yet. Create one for this member.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DIETS */}
          {activeSection === 'diets' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <PrimaryBtn onClick={() => setDietModal(true)}><Plus size={14} /> New Diet Plan</PrimaryBtn>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
                {dietPlans.map(d => (
                  <div key={d.id} style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 18, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14 }}>{d.title}</div>
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
                    <p>No diet plans yet. Create one for this member.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MEASUREMENTS */}
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
      <DietPlanModal open={dietModal} onClose={() => setDietModal(false)} memberId={member.userId} orgId={orgId} branchId={branchId} onSaved={loadAll} />
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
      setMembers(d.members || []);
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
          {filtered.map(m => (
            <div key={m.userId}
              onClick={() => onSelectMember(m)}
              style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 18, border: '1px solid var(--border)', cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(61,191,150,0.12)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#0ea5e933,#0ea5e966)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#0ea5e9', flexShrink: 0 }}>
                  {(m.firstName || m.userName || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{m.firstName} {m.lastName}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.userName}</div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {m.progressStatus && <StatusBadge status={m.progressStatus} />}
                    {m.attendance?.lastStatus && (
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--metric-bg)', padding: '2px 8px', borderRadius: 20 }}>
                        Last: {m.attendance.lastStatus}
                      </span>
                    )}
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

  const loadDashboard = useCallback(() => {
    setLoadingDash(true);
    api.trainer.getDashboard().then(setDashData).catch(() => {}).finally(() => setLoadingDash(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') loadDashboard();
  }, [activeTab, loadDashboard]);

  const handleSelectMember = (m: any) => {
    setSelectedMember(m);
    setActiveTab('progress');
  };

  const schedToday = dashData?.todaySchedule || [];
  const ps = dashData?.progressSummary || {};

  return (
    <PortalLayout
      title="FitPulseBot" subtitle="Trainer Portal"
      accentColor="#f59e0b"
      navItems={NAV} activeTab={activeTab} onTabChange={(tab) => { if (tab !== 'progress') setSelectedMember(null); setActiveTab(tab); }}
      roleBadge="TRAINER" roleBadgeColor="#f59e0b"
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
                {/* Today's Schedule */}
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

                {/* Progress Summary */}
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

      {/* MEMBERS */}
      {activeTab === 'members' && (
        <MembersTab orgId={orgId} branchId={branchId} onSelectMember={handleSelectMember} />
      )}

      {/* WORKOUTS */}
      {activeTab === 'workouts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Workout Plans</h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>Select a member from "My Members" to manage their workout plans.</p>
          </div>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 32, border: '1px solid var(--border)', textAlign: 'center' }}>
            <Dumbbell size={40} style={{ color: '#f59e0b', opacity: 0.5, marginBottom: 12 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Go to <strong>My Members</strong>, select a member, then navigate to the <strong>Workouts</strong> tab to create and manage plans.</p>
            <PrimaryBtn onClick={() => setActiveTab('members')} style={{ margin: '16px auto 0' }}>
              <Users size={14} /> Go to My Members
            </PrimaryBtn>
          </div>
        </div>
      )}

      {/* DIETS */}
      {activeTab === 'diets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Diet Plans</h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>Select a member from "My Members" to manage their diet plans.</p>
          </div>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 32, border: '1px solid var(--border)', textAlign: 'center' }}>
            <Salad size={40} style={{ color: '#f59e0b', opacity: 0.5, marginBottom: 12 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Go to <strong>My Members</strong>, select a member, then navigate to the <strong>Diets</strong> tab to create and manage plans.</p>
            <PrimaryBtn onClick={() => setActiveTab('members')} style={{ margin: '16px auto 0' }}>
              <Users size={14} /> Go to My Members
            </PrimaryBtn>
          </div>
        </div>
      )}

      {/* PROGRESS */}
      {activeTab === 'progress' && (
        selectedMember ? (
          <MemberProgressPanel
            member={selectedMember}
            orgId={orgId}
            branchId={branchId}
            onBack={() => { setSelectedMember(null); setActiveTab('members'); }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Progress Tracking</h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>Select a member to view their full progress dashboard.</p>
            </div>
            <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 32, border: '1px solid var(--border)', textAlign: 'center' }}>
              <TrendingUp size={40} style={{ color: '#f59e0b', opacity: 0.5, marginBottom: 12 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Click any member card to open their full progress dashboard with weight tracking, measurements, workouts, and diet plans.</p>
              <PrimaryBtn onClick={() => setActiveTab('members')} style={{ margin: '16px auto 0' }}>
                <Users size={14} /> Select a Member
              </PrimaryBtn>
            </div>
          </div>
        )
      )}
    </PortalLayout>
  );
}
