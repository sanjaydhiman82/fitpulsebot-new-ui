import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Camera, Dumbbell, HeartPulse, Loader2, Plus, Ruler, Trash2, UserRound, ClipboardList, TestTube2 } from 'lucide-react';
import { api } from '../api';
import styles from './DashboardHome.module.css';
import BioMarkersPage from './BioMarkersPage';

const fmt = (v: any) => v == null || v === '' ? '-' : String(v);
const dateOnly = (v: any) => v ? String(v).slice(0, 10) : '';

const SECTIONS = [
  { id: 'body-composition', key: 'bodyComposition', title: 'Body Composition', icon: <UserRound size={16} /> },
  { id: 'body-measurements', key: 'bodyMeasurements', title: 'Body Measurements', icon: <Ruler size={16} /> },
  { id: 'conditions', key: 'memberConditions', title: 'Client Condition', icon: <HeartPulse size={16} /> },
  { id: 'health-logs', key: 'healthLogs', title: 'Vitals', icon: <HeartPulse size={16} /> },
  { id: 'injuries', key: 'injuryLogs', title: 'Injury Logs', icon: <ClipboardList size={16} /> },
  { id: 'lifestyle', key: 'lifestyleLogs', title: 'Lifestyle', icon: <UserRound size={16} /> },
  { id: 'progress-photos', key: 'progressPhotos', title: 'Progress Photos', icon: <Camera size={16} /> },
  { id: 'resource-notes', key: 'trainerNotes', title: 'Resource Notes', icon: <ClipboardList size={16} />, readOnly: true },
  { id: 'workouts', key: 'workouts', title: 'Workouts', icon: <Dumbbell size={16} /> },
  { id: 'biomarkers', key: 'biomarkers', title: 'Biomarks', icon: <TestTube2 size={16} />, readOnly: true },
];

function buildPayload(section: string, form: any) {
  if (section === 'body-composition') return { measuredAt: form.date ? `${form.date}T00:00:00` : undefined, weightKg: Number(form.weightKg) || undefined, bodyFatPercent: Number(form.bodyFatPercent) || undefined, muscleMassKg: Number(form.muscleMassKg) || undefined, notes: form.notes };
  if (section === 'body-measurements') return { measurementDate: form.date || new Date().toISOString().slice(0, 10), chestCm: Number(form.chestCm) || undefined, waistCm: Number(form.waistCm) || undefined, hipCm: Number(form.hipCm) || undefined, armCm: Number(form.armCm) || undefined, thighCm: Number(form.thighCm) || undefined, bodyFatPercent: Number(form.bodyFatPercent) || undefined, notes: form.notes };
  if (section === 'conditions') return { name: form.name, severity: form.severity, status: form.status || 'active', notes: form.notes };
  if (section === 'health-logs') return { recordedAt: form.date ? `${form.date}T00:00:00` : undefined, systolicBp: Number(form.systolicBp) || undefined, diastolicBp: Number(form.diastolicBp) || undefined, restingHeartRateBpm: Number(form.restingHeartRateBpm) || undefined, sleepHours: Number(form.sleepHours) || undefined, stressLevel: form.stressLevel, energyLevel: form.energyLevel, notes: form.notes };
  if (section === 'injuries') return { bodyPart: form.bodyPart, description: form.description, severity: form.severity, status: form.status || 'active', notes: form.notes };
  if (section === 'lifestyle') return { occupation: form.occupation, workingHours: form.workingHours, sleepTime: form.sleepTime, smoking: form.smoking, alcohol: form.alcohol, metadata: { dietPreference: form.dietPreference } };
  if (section === 'progress-photos') return { photoDate: form.date || new Date().toISOString().slice(0, 10), viewType: form.viewType || 'front', fileUrl: form.fileUrl, weightKg: Number(form.weightKg) || undefined, bodyFatPercent: Number(form.bodyFatPercent) || undefined, notes: form.notes };
  if (section === 'workouts') return { title: form.title, goal: form.goal, level: form.level, startDate: form.date || undefined, exercises: form.exerciseName ? [{ exerciseName: form.exerciseName, sets: Number(form.sets) || undefined, reps: Number(form.reps) || undefined }] : [] };
  return form;
}

function fieldsFor(section: string) {
  if (section === 'body-composition') return [['date','Date','date'], ['weightKg','Weight kg'], ['bodyFatPercent','Body fat %'], ['muscleMassKg','Muscle mass kg'], ['notes','Notes']];
  if (section === 'body-measurements') return [['date','Date','date'], ['chestCm','Chest cm'], ['waistCm','Waist cm'], ['hipCm','Hip cm'], ['armCm','Arm cm'], ['thighCm','Thigh cm'], ['bodyFatPercent','Body fat %'], ['notes','Notes']];
  if (section === 'conditions') return [['name','Condition'], ['severity','Severity'], ['status','Status'], ['notes','Notes']];
  if (section === 'health-logs') return [['date','Date','date'], ['systolicBp','Systolic BP'], ['diastolicBp','Diastolic BP'], ['restingHeartRateBpm','Resting HR'], ['sleepHours','Sleep hours'], ['stressLevel','Stress'], ['energyLevel','Energy'], ['notes','Notes']];
  if (section === 'injuries') return [['bodyPart','Body part'], ['description','Description'], ['severity','Severity'], ['status','Status'], ['notes','Notes']];
  if (section === 'lifestyle') return [['occupation','Occupation'], ['workingHours','Working hours'], ['sleepTime','Sleep time'], ['smoking','Smoking'], ['alcohol','Alcohol'], ['dietPreference','Diet preference']];
  if (section === 'progress-photos') return [['date','Date','date'], ['viewType','View type'], ['fileUrl','Photo URL'], ['weightKg','Weight kg'], ['bodyFatPercent','Body fat %'], ['notes','Notes']];
  return [['title','Workout title'], ['goal','Goal'], ['level','Level'], ['date','Start date','date'], ['exerciseName','Exercise'], ['sets','Sets'], ['reps','Reps']];
}

function latestText(section: string, rows: any[]) {
  const r = rows[0] || {};
  if (!rows.length) return 'No entry yet';
  if (section === 'body-composition') return `${fmt(r.weight_kg)} kg, ${fmt(r.body_fat_percent)}% BF, ${fmt(r.muscle_mass_kg)} kg muscle`;
  if (section === 'body-measurements') return `Chest ${fmt(r.chest_cm)}, Waist ${fmt(r.waist_cm)}, Hips ${fmt(r.hip_cm)}`;
  if (section === 'conditions') return `${fmt(r.name)} (${fmt(r.status)})`;
  if (section === 'health-logs') return `Sleep ${fmt(r.sleep_hours)} hrs, HR ${fmt(r.resting_heart_rate_bpm)}, BP ${fmt(r.systolic_bp)}/${fmt(r.diastolic_bp)}`;
  if (section === 'injuries') return `${fmt(r.body_part)} - ${fmt(r.description)}`;
  if (section === 'lifestyle') return `${fmt(r.occupation)}, Smoking: ${fmt(r.smoking)}, Alcohol: ${fmt(r.alcohol)}`;
  if (section === 'progress-photos') return `${rows.length} photos`;
  if (section === 'resource-notes') return fmt(r.body || r.title);
  return fmt(r.title);
}

export default function PartnerBranchProfile({ branchId }: { branchId: string }) {
  const [data, setData] = useState<any>(null);
  const [active, setActive] = useState(SECTIONS[0].id);
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [manualWorkoutId, setManualWorkoutId] = useState<string | null>(null);
  const [workoutLog, setWorkoutLog] = useState<any>({});
  const [createWorkoutMode, setCreateWorkoutMode] = useState<'manual' | 'ai' | null>(null);
  const [selfWorkout, setSelfWorkout] = useState<any>({ title: '', goal: 'FAT_LOSS', level: 'BEGINNER', exerciseName: '', sets: 3, reps: 12, durationMin: 0 });
  const [aiWorkout, setAiWorkout] = useState<any>({ goal: 'FAT_LOSS', level: 'BEGINNER', durationWeeks: 4, daysPerWeek: 4, sessionMinutes: 60, equipment: 'dumbbells,treadmill,machines', preferences: '' });

  const load = useCallback(() => {
    setLoading(true);
    api.partner.profile(branchId).then(setData).catch((e: any) => setError(e.message)).finally(() => setLoading(false));
  }, [branchId]);
  useEffect(() => { load(); }, [load]);

  const section = SECTIONS.find(s => s.id === active)!;
  const rows = useMemo(() => data?.[section.key] || [], [data, section.key]);
  const summary = data?.summary || {};
  const header = data?.memberHeader || {};

  const add = async () => {
    setSaving(true);
    try {
      await api.partner.add(branchId, active, buildPayload(active, form));
      setForm({});
      load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };
  const del = async (id: string) => {
    await api.partner.delete(branchId, active, id);
    load();
  };
  const markAllDone = async (workout: any) => {
    setSaving(true); setError('');
    try {
      const todaySchedule = (workout.schedule || []).find((s: any) => dateOnly(s.scheduled_date) === new Date().toISOString().slice(0, 10));
      await api.partner.workoutAllDone(branchId, { workoutId: workout.id, userWorkoutId: todaySchedule?.id, notes: 'All done for today.' });
      load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };
  const saveManualWorkout = async (workout: any) => {
    setSaving(true); setError('');
    try {
      const log = workoutLog[workout.id] || {};
      const todaySchedule = (workout.schedule || []).find((s: any) => dateOnly(s.scheduled_date) === new Date().toISOString().slice(0, 10));
      await api.partner.addWorkoutSession(branchId, {
        workoutId: workout.id,
        userWorkoutId: todaySchedule?.id,
        durationMin: Number(log.durationMin) || undefined,
        caloriesBurned: Number(log.caloriesBurned) || undefined,
        rating: Number(log.rating) || undefined,
        notes: log.notes,
        exercises: (workout.exercises || []).map((ex: any) => ({
          workoutExerciseId: ex.id,
          exerciseName: ex.exercise_name,
          setsCompleted: Number(log[`sets_${ex.id}`]) || ex.sets || undefined,
          targetSets: ex.sets || undefined,
          repsCompleted: Number(log[`reps_${ex.id}`]) || (typeof ex.reps === 'number' ? ex.reps : undefined),
          targetReps: ex.reps != null ? String(ex.reps) : undefined,
          status: log[`status_${ex.id}`] || 'completed',
          notes: log[`notes_${ex.id}`],
        })),
      });
      setManualWorkoutId(null);
      setWorkoutLog((p: any) => ({ ...p, [workout.id]: {} }));
      load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };
  const createSelfWorkout = async () => {
    if (!selfWorkout.title || !selfWorkout.exerciseName) { setError('Workout title and exercise are required.'); return; }
    setSaving(true); setError('');
    try {
      await api.partner.add(branchId, 'workouts', {
        title: selfWorkout.title,
        goal: selfWorkout.goal,
        level: selfWorkout.level,
        startDate: new Date().toISOString().slice(0, 10),
        exercises: [{
          exerciseName: selfWorkout.exerciseName,
          sets: Number(selfWorkout.sets) || undefined,
          reps: Number(selfWorkout.reps) || undefined,
          durationMin: Number(selfWorkout.durationMin) || undefined,
          sequenceNo: 1,
        }],
      });
      setSelfWorkout({ title: '', goal: 'FAT_LOSS', level: 'BEGINNER', exerciseName: '', sets: 3, reps: 12, durationMin: 0 });
      setCreateWorkoutMode(null);
      load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };
  const generateSelfWorkout = async () => {
    setSaving(true); setError('');
    try {
      const memberId = localStorage.getItem('fitpulse_userId');
      const generated = await api.ai.generateWorkout({
        memberId,
        organizationId: data?.membership?.organization_id,
        branchId,
        goal: aiWorkout.goal,
        level: aiWorkout.level,
        durationWeeks: Number(aiWorkout.durationWeeks),
        daysPerWeek: Number(aiWorkout.daysPerWeek),
        sessionMinutes: Number(aiWorkout.sessionMinutes),
        equipment: String(aiWorkout.equipment || '').split(',').map((s: string) => s.trim()).filter(Boolean),
        preferences: String(aiWorkout.preferences || '').split(',').map((s: string) => s.trim()).filter(Boolean),
        includeSchedule: true,
        save: false,
      });
      await api.partner.add(branchId, 'workouts', generated.workout);
      setCreateWorkoutMode(null);
      load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  if (loading && !data) return <div style={{ padding: 40, textAlign: 'center' }}><Loader2 className={styles.spinning} /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 18 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>{header.first_name || 'Client'} {header.last_name || ''}</h2>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>{data?.membership?.organization_name} · {data?.membership?.branch_name}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginTop: 16 }}>
          {[['Weight', summary.currentWeightKg], ['Body Fat %', summary.bodyFatPercent], ['Muscle Mass', summary.muscleMassKg], ['Sleep', summary.sleepHours], ['Height', summary.heightCm]].map(([l,v]) => (
            <div key={l} style={{ background: 'var(--metric-bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 12 }}><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l}</div><strong>{fmt(v)}</strong></div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 8 }}>
        {SECTIONS.map(s => <button key={s.id} onClick={() => { setActive(s.id); setForm({}); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 12px', borderRadius: 8, whiteSpace: 'nowrap', color: active === s.id ? 'var(--accent)' : 'var(--text-secondary)', background: active === s.id ? 'var(--accent-light)' : 'transparent', fontWeight: 800 }}>{s.icon}{s.title}</button>)}
      </div>
      {error && <div style={{ color: 'var(--danger)' }}>{error}</div>}
      {active === 'biomarkers' ? <BioMarkersPage /> : <>
      {active === 'workouts' ? <WorkoutMemberLogger
        workouts={rows}
        saving={saving}
        manualWorkoutId={manualWorkoutId}
        setManualWorkoutId={setManualWorkoutId}
        workoutLog={workoutLog}
        setWorkoutLog={setWorkoutLog}
        createWorkoutMode={createWorkoutMode}
        setCreateWorkoutMode={setCreateWorkoutMode}
        selfWorkout={selfWorkout}
        setSelfWorkout={setSelfWorkout}
        aiWorkout={aiWorkout}
        setAiWorkout={setAiWorkout}
        createSelfWorkout={createSelfWorkout}
        generateSelfWorkout={generateSelfWorkout}
        markAllDone={markAllDone}
        saveManualWorkout={saveManualWorkout}
      /> : <>
      {!section.readOnly && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>Add {section.title}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10 }}>
            {fieldsFor(active).map(([k,l,t]: any) => <input key={k} type={t || 'text'} placeholder={l} value={form[k] || ''} onChange={e => setForm((p: any) => ({ ...p, [k]: e.target.value }))} style={{ minHeight: 40, border: '1px solid var(--border)', borderRadius: 8, padding: '0 10px', background: 'var(--bg-input)', color: 'var(--text-primary)' }} />)}
          </div>
          <button onClick={add} disabled={saving} style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 8, background: 'var(--accent)', color: '#fff', fontWeight: 800 }}>{saving ? <Loader2 size={14} className={styles.spinning} /> : <Plus size={14} />} Add</button>
        </div>
      )}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>{section.title}</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          {rows.map((r: any) => <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '140px 1fr auto', gap: 10, alignItems: 'center', padding: 10, borderRadius: 8, background: 'var(--metric-bg)', border: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{dateOnly(r.measured_at || r.measurement_date || r.recorded_at || r.photo_date || r.created_at || r.start_date)}</span>
            <span>{latestText(active, [r])}</span>
            {!section.readOnly && <button onClick={() => del(r.id)} style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4 }}><Trash2 size={13} /> Delete</button>}
          </div>)}
          {!rows.length && <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No records yet.</div>}
        </div>
      </div>
      </>}
      </>}
    </div>
  );
}

function WorkoutMemberLogger({ workouts, saving, manualWorkoutId, setManualWorkoutId, workoutLog, setWorkoutLog, createWorkoutMode, setCreateWorkoutMode, selfWorkout, setSelfWorkout, aiWorkout, setAiWorkout, createSelfWorkout, generateSelfWorkout, markAllDone, saveManualWorkout }: any) {
  const today = new Date().toISOString().slice(0, 10);
  const setLog = (workoutId: string, key: string, value: any) => setWorkoutLog((p: any) => ({ ...p, [workoutId]: { ...(p[workoutId] || {}), [key]: value } }));
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>Assigned Workouts</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>Log workouts assigned by your resource, or create your own workout manually or with AI.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setCreateWorkoutMode(createWorkoutMode === 'manual' ? null : 'manual')} style={{ padding: '9px 12px', borderRadius: 8, background: 'var(--accent-light)', color: 'var(--accent)', fontWeight: 900 }}>Manual Workout</button>
            <button onClick={() => setCreateWorkoutMode(createWorkoutMode === 'ai' ? null : 'ai')} style={{ padding: '9px 12px', borderRadius: 8, background: 'linear-gradient(135deg,#7c3aed,#2563eb)', color: '#fff', fontWeight: 900 }}>AI Workout</button>
          </div>
        </div>
      </div>
      {createWorkoutMode === 'manual' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, display: 'grid', gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Create Manual Workout</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10 }}>
            <input placeholder="Workout title" value={selfWorkout.title || ''} onChange={e => setSelfWorkout((p: any) => ({ ...p, title: e.target.value }))} style={workoutInputStyle} />
            <select value={selfWorkout.goal} onChange={e => setSelfWorkout((p: any) => ({ ...p, goal: e.target.value }))} style={workoutInputStyle}>{['FAT_LOSS','MUSCLE_GAIN','STRENGTH','GENERAL_FITNESS','RECOMP'].map(g => <option key={g}>{g}</option>)}</select>
            <select value={selfWorkout.level} onChange={e => setSelfWorkout((p: any) => ({ ...p, level: e.target.value }))} style={workoutInputStyle}>{['BEGINNER','INTERMEDIATE','ADVANCED'].map(l => <option key={l}>{l}</option>)}</select>
            <input placeholder="Exercise name" value={selfWorkout.exerciseName || ''} onChange={e => setSelfWorkout((p: any) => ({ ...p, exerciseName: e.target.value }))} style={workoutInputStyle} />
            <input placeholder="Sets" type="number" value={selfWorkout.sets || ''} onChange={e => setSelfWorkout((p: any) => ({ ...p, sets: e.target.value }))} style={workoutInputStyle} />
            <input placeholder="Reps" type="number" value={selfWorkout.reps || ''} onChange={e => setSelfWorkout((p: any) => ({ ...p, reps: e.target.value }))} style={workoutInputStyle} />
            <input placeholder="Duration min" type="number" value={selfWorkout.durationMin || ''} onChange={e => setSelfWorkout((p: any) => ({ ...p, durationMin: e.target.value }))} style={workoutInputStyle} />
          </div>
          <button disabled={saving} onClick={createSelfWorkout} style={{ justifySelf: 'start', padding: '9px 14px', borderRadius: 8, background: 'var(--accent)', color: '#fff', fontWeight: 900 }}>Create Workout</button>
        </div>
      )}
      {createWorkoutMode === 'ai' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, display: 'grid', gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Generate AI Workout</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10 }}>
            <select value={aiWorkout.goal} onChange={e => setAiWorkout((p: any) => ({ ...p, goal: e.target.value }))} style={workoutInputStyle}>{['FAT_LOSS','MUSCLE_GAIN','STRENGTH','GENERAL_FITNESS','RECOMP'].map(g => <option key={g}>{g}</option>)}</select>
            <select value={aiWorkout.level} onChange={e => setAiWorkout((p: any) => ({ ...p, level: e.target.value }))} style={workoutInputStyle}>{['BEGINNER','INTERMEDIATE','ADVANCED'].map(l => <option key={l}>{l}</option>)}</select>
            <input placeholder="Weeks" type="number" value={aiWorkout.durationWeeks} onChange={e => setAiWorkout((p: any) => ({ ...p, durationWeeks: e.target.value }))} style={workoutInputStyle} />
            <input placeholder="Days/week" type="number" value={aiWorkout.daysPerWeek} onChange={e => setAiWorkout((p: any) => ({ ...p, daysPerWeek: e.target.value }))} style={workoutInputStyle} />
            <input placeholder="Session minutes" type="number" value={aiWorkout.sessionMinutes} onChange={e => setAiWorkout((p: any) => ({ ...p, sessionMinutes: e.target.value }))} style={workoutInputStyle} />
            <input placeholder="Equipment comma separated" value={aiWorkout.equipment || ''} onChange={e => setAiWorkout((p: any) => ({ ...p, equipment: e.target.value }))} style={workoutInputStyle} />
            <input placeholder="Preferences" value={aiWorkout.preferences || ''} onChange={e => setAiWorkout((p: any) => ({ ...p, preferences: e.target.value }))} style={workoutInputStyle} />
          </div>
          <button disabled={saving} onClick={generateSelfWorkout} style={{ justifySelf: 'start', padding: '9px 14px', borderRadius: 8, background: 'linear-gradient(135deg,#7c3aed,#2563eb)', color: '#fff', fontWeight: 900 }}>{saving ? 'Generating...' : 'Generate & Save'}</button>
        </div>
      )}
      {workouts.map((w: any) => {
        const exercises = w.exercises || [];
        const todaySchedule = (w.schedule || []).find((s: any) => dateOnly(s.scheduled_date) === today);
        const manual = manualWorkoutId === w.id;
        return (
          <div key={w.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17 }}>{w.title}</h3>
                <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>{w.goal || 'Workout'} · {w.level || 'Any level'} · {w.created_by_type === 'RESOURCE' ? 'Resource assigned' : 'Self plan'}</p>
                <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 12 }}>Sessions logged: {w.sessions_count || 0}{w.last_completed_at ? ` · Last: ${dateOnly(w.last_completed_at)}` : ''}{todaySchedule ? ` · Scheduled today` : ''}</p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button disabled={saving} onClick={() => markAllDone(w)} style={{ padding: '9px 12px', borderRadius: 8, background: 'var(--success)', color: '#fff', fontWeight: 900 }}>All Done Today</button>
                <button disabled={saving} onClick={() => setManualWorkoutId(manual ? null : w.id)} style={{ padding: '9px 12px', borderRadius: 8, background: 'var(--accent-light)', color: 'var(--accent)', fontWeight: 900 }}>{manual ? 'Close Manual' : 'Manual Log'}</button>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {exercises.map((ex: any) => <div key={ex.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, padding: 10, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--metric-bg)' }}>
                <span style={{ fontWeight: 800 }}>{ex.exercise_name}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{fmt(ex.sets)} sets · {fmt(ex.reps)} reps</span>
              </div>)}
              {!exercises.length && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No exercise details saved for this workout.</div>}
            </div>
            {manual && (
              <div style={{ display: 'grid', gap: 10, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10 }}>
                  <input placeholder="Duration min" type="number" value={workoutLog[w.id]?.durationMin || ''} onChange={e => setLog(w.id, 'durationMin', e.target.value)} style={workoutInputStyle} />
                  <input placeholder="Calories burned" type="number" value={workoutLog[w.id]?.caloriesBurned || ''} onChange={e => setLog(w.id, 'caloriesBurned', e.target.value)} style={workoutInputStyle} />
                  <input placeholder="Rating 1-10" type="number" min={1} max={10} value={workoutLog[w.id]?.rating || ''} onChange={e => setLog(w.id, 'rating', e.target.value)} style={workoutInputStyle} />
                  <input placeholder="Session notes" value={workoutLog[w.id]?.notes || ''} onChange={e => setLog(w.id, 'notes', e.target.value)} style={workoutInputStyle} />
                </div>
                {exercises.map((ex: any) => <div key={ex.id} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 1fr', gap: 8, alignItems: 'center' }}>
                  <strong>{ex.exercise_name}</strong>
                  <input placeholder="Sets" type="number" value={workoutLog[w.id]?.[`sets_${ex.id}`] || ''} onChange={e => setLog(w.id, `sets_${ex.id}`, e.target.value)} style={workoutInputStyle} />
                  <input placeholder="Reps" type="number" value={workoutLog[w.id]?.[`reps_${ex.id}`] || ''} onChange={e => setLog(w.id, `reps_${ex.id}`, e.target.value)} style={workoutInputStyle} />
                  <input placeholder="Exercise notes" value={workoutLog[w.id]?.[`notes_${ex.id}`] || ''} onChange={e => setLog(w.id, `notes_${ex.id}`, e.target.value)} style={workoutInputStyle} />
                </div>)}
                <button disabled={saving} onClick={() => saveManualWorkout(w)} style={{ justifySelf: 'start', padding: '9px 14px', borderRadius: 8, background: 'var(--accent)', color: '#fff', fontWeight: 900 }}>Save Workout Log</button>
              </div>
            )}
          </div>
        );
      })}
      {!workouts.length && <div style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)', borderRadius: 12, padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>No workouts assigned yet. Create a manual workout or generate one with AI to get started.</div>}
    </div>
  );
}

const workoutInputStyle: React.CSSProperties = { minHeight: 40, border: '1px solid var(--border)', borderRadius: 8, padding: '0 10px', background: 'var(--bg-input)', color: 'var(--text-primary)' };
