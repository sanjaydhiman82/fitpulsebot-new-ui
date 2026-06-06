import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { useApp } from '../App';
import { normalizeProfileImageUrl } from '../profileImageUrl';
import {
  Camera, Save, RefreshCw, Sparkles, PenLine,
  Flame, Droplets, BedDouble, Footprints, Scale,
  ChevronRight, CheckCircle2, Loader2,
} from 'lucide-react';
import styles from './LogPage.module.css';
import pStyles from './UserProfilePage.module.css';

const ACTIVITY_LEVELS = ['sedentary','light','moderate','vigorous','very_vigorous'];
const ACTIVITY_LABELS: Record<string,string> = {
  sedentary:     'Sedentary (little/no exercise)',
  light:         'Light (1–3 days/week)',
  moderate:      'Moderate (3–5 days/week)',
  vigorous:      'Vigorous (6–7 days/week)',
  very_vigorous: 'Very Vigorous (athlete level)',
};
const GENDERS = ['male','female','other','prefer_not_to_say'];
const TARGET_UNITS = ['weeks','months'];

type GoalMode = 'manual' | 'ai';
type AiStep = 'form' | 'loading' | 'done';

function getAvatarUrl(value: any): string {
  if (!value) return '';
  if (typeof value === 'string') return normalizeProfileImageUrl(value);
  return normalizeProfileImageUrl(value.fileUrl || value.url || value.avatarUrl || '');
}

export default function UserProfilePage() {
  const { user, setUser } = useApp();

  const [form, setForm] = useState({
    firstName:'', lastName:'', email:'', phone:'', bio:'',
    dob:'', gender:'male', heightCm:'', weightKg:'',
    calorieTarget:'', waterTargetMl:'2500', sleepHrs:'',
    stepGoal:'10000', targetWeightKg:'', targetSleepHrs:'8',
    activityIntensity:'moderate',
  });

  // AI wizard fields
  const [aiForm, setAiForm] = useState({
    targetWeightKg: '',
    targetTimeValue: '3',
    targetTimeUnit: 'months',
    activityIntensity: 'moderate',
  });

  const [goalMode, setGoalMode] = useState<GoalMode>('manual');
  const [aiStep,   setAiStep]   = useState<AiStep>('form');
  const [aiError,  setAiError]  = useState('');

  const [loading,   setLoading]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const p = await api.profile.get();
      setAvatarUrl(getAvatarUrl(p.avatarUrl) || getAvatarUrl(user?.avatarUrl));
      setForm({
        firstName: p.firstName||'', lastName: p.lastName||'',
        email: p.email||'', phone: p.phone||'', bio: p.bio||'',
        dob: p.dob||'', gender: p.gender||'male',
        heightCm:  p.heightCm  ? String(p.heightCm)  : '',
        weightKg:  p.weightKg  ? String(p.weightKg)  : '',
        calorieTarget: p.goals?.caloriesConsumePerDay ? String(p.goals.caloriesConsumePerDay) : '',
        waterTargetMl: p.goals?.waterLitersPerDay     ? String(Math.round(Number(p.goals.waterLitersPerDay)*1000)) : '2500',
        sleepHrs:       p.goals?.sleepHrsTarget     ? String(p.goals.sleepHrsTarget)    : '',
        stepGoal:       p.goals?.stepGoal           ? String(p.goals.stepGoal)          : '10000',
        targetWeightKg: p.goals?.weightTarget       ? String(p.goals.weightTarget)      : '',
        targetSleepHrs: p.goals?.targetSleepHrs     ? String(p.goals.targetSleepHrs)   : '8',
        activityIntensity: p.goals?.activityIntensity || 'moderate',
      });
    } catch(e:any){ setError(e.message); }
    setLoading(false);
  }, [user?.avatarUrl]);

  useEffect(()=>{ load(); },[load]);

  const f = (k:string) => (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(prev=>({...prev,[k]:e.target.value}));

  const af = (k:string) => (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) =>
    setAiForm(prev=>({...prev,[k]:e.target.value}));

  const handleSave = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      await api.profile.update({
        avatarUrl: normalizeProfileImageUrl(avatarUrl)||null,
        firstName: form.firstName||null, lastName: form.lastName||null,
        email: form.email||'', phone: form.phone||null,
        bio: form.bio||'', dob: form.dob||null,
        gender: form.gender||null,
        heightCm: form.heightCm ? parseInt(form.heightCm) : null,
        weightKg: form.weightKg ? parseInt(form.weightKg) : null,
        goals: {
          calorieBurnPerDay:     null,
          caloriesConsumePerDay: form.calorieTarget   ? parseInt(form.calorieTarget)         : null,
          waterLitersPerDay:     form.waterTargetMl   ? parseInt(form.waterTargetMl)/1000    : null,
          weightTarget:          form.targetWeightKg  ? Math.round(parseFloat(form.targetWeightKg)) : null,
          sleepHrsTarget:        form.targetSleepHrs  ? parseFloat(form.targetSleepHrs)      : null,
          activityIntensity:     form.activityIntensity,
          targetTimeValue:       null,
          targetTimeUnit:        'days',
        },
      });
      setSuccess('Profile saved successfully!');
      setTimeout(()=>setSuccess(''),3000);
    } catch(e:any){ setError(e.message); }
    setSaving(false);
  };

  const handleImageUpload = async (e:React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(!file||!user?.userId) return;
    setUploading(true); setError(''); setSuccess('');
    try {
      const fileData = await new Promise<string>((resolve,reject)=>{
        const reader = new FileReader();
        reader.onload  = ()=>resolve(String(reader.result).split(',')[1]||'');
        reader.onerror = ()=>reject(new Error('Unable to read selected image.'));
        reader.readAsDataURL(file);
      });
      const ext = file.name.split('.').pop()||'jpg';
      const res = await api.profile.uploadPic({
        userId: user.userId,
        fileName: `${crypto.randomUUID()}.${ext}`,
        contentType: file.type||'image/jpeg', fileData,
      });
      const uploadedUrl = getAvatarUrl(res);
      setAvatarUrl(uploadedUrl);
      setUser({...user, avatarUrl: uploadedUrl});
      setSuccess('Profile image uploaded!');
      setTimeout(()=>setSuccess(''),3000);
    } catch(err:any){ setError(err.message||'Unable to upload profile image.'); }
    setUploading(false); e.target.value='';
  };

  // ── AI goal generation ──────────────────────────────────
  const handleGenerateGoals = async () => {
    const { heightCm, weightKg, gender, dob } = form;
    if(!heightCm||!weightKg||!aiForm.targetWeightKg){
      setAiError('Please fill in Height, Current Weight, and Target Weight first.'); return;
    }
    setAiError(''); setAiStep('loading');
    try {
      // Build the task string the backend expects:
      // Sex|Age|Height|Weight|Committed Activity|Target weight|Target Duration
      let age = '';
      if(dob){ const d=new Date(dob); age=String(Math.floor((Date.now()-d.getTime())/(365.25*24*3600*1000))); }
      const task = [
        gender||'male', age||'?', `${heightCm}cm`,
        `${weightKg}kg`, ACTIVITY_LABELS[aiForm.activityIntensity]||aiForm.activityIntensity,
        `${aiForm.targetWeightKg}kg`,
        `${aiForm.targetTimeValue} ${aiForm.targetTimeUnit}`,
      ].join('|');

      const res = await api.profile.generateGoalsAI({
        userId:             user?.userId,
        task,
        activityIntensity:  aiForm.activityIntensity,
        targetTime:         parseInt(aiForm.targetTimeValue)||3,
        targetTimeCategory: aiForm.targetTimeUnit,
      });

      // Auto-fill manual fields from AI response
      setForm(prev=>({
        ...prev,
        calorieTarget:     res.caloriesConsumePerDay  ? String(res.caloriesConsumePerDay)              : prev.calorieTarget,
        waterTargetMl:     res.waterLitersPerDay      ? String(Math.round(res.waterLitersPerDay*1000)) : prev.waterTargetMl,
        targetSleepHrs:    res.sleepHrsTarget         ? String(res.sleepHrsTarget)                     : prev.targetSleepHrs,
        targetWeightKg:    res.weightTarget            ? String(res.weightTarget)                       : prev.targetWeightKg,
        activityIntensity: aiForm.activityIntensity,
      }));
      setAiStep('done');
    } catch(e:any){ setAiError(e.message||'AI generation failed.'); setAiStep('form'); }
  };

  const resetAiWizard = () => { setAiStep('form'); setAiError(''); };

  // ── Goal cards (display only) ───────────────────────────
  const goalCards = [
    { icon: <Flame size={16}/>,      label:'Calories/day', value: form.calorieTarget,  unit:'kcal', color:'#ed8936', field:'calorieTarget' },
    { icon: <Droplets size={16}/>,   label:'Water/day',    value: String(parseInt(form.waterTargetMl||'0')), unit:'ml', color:'#5bc8e0', field:'waterTargetMl' },
    { icon: <BedDouble size={16}/>,  label:'Sleep target', value: form.targetSleepHrs, unit:'hrs',  color:'#9f7aea', field:'targetSleepHrs' },
    { icon: <Scale size={16}/>,      label:'Target weight',value: form.targetWeightKg, unit:'kg',   color:'#3dbf96', field:'targetWeightKg' },
    { icon: <Footprints size={16}/>, label:'Steps/day',    value: form.stepGoal,       unit:'steps',color:'#f59e0b', field:'stepGoal' },
  ];

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.pageTitle}>Client Profile</h2>
          <p className={styles.pageDesc}>Manage your personal information and health goals</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className={styles.refreshBtn} onClick={load}>
            <RefreshCw size={14} className={loading?styles.spinning:''} />
          </button>
          <button className={styles.addBtn} onClick={handleSave} disabled={saving}>
            <Save size={15}/>{saving?'Saving…':'Save Profile'}
          </button>
        </div>
      </div>

      {error   && <div className={styles.errorBanner}>{error}</div>}
      {success && <div className={pStyles.successBanner}>{success}</div>}

      {/* ── Profile image ── */}
      <div className={styles.formCard}>
        <h3 className={styles.formTitle}>Profile Image</h3>
        <div style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
          <div style={{width:88,height:88,borderRadius:'50%',overflow:'hidden',background:'var(--metric-bg)',border:'2px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--accent)',fontSize:30,fontWeight:800}}>
            {avatarUrl
              ? <img src={avatarUrl} alt="Profile" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              : (user?.userName||'U').charAt(0).toUpperCase()}
          </div>
          <div style={{flex:1,minWidth:220}}>
            <div style={{fontSize:13,color:'var(--text-secondary)',marginBottom:10}}>Upload a JPG or PNG profile image.</div>
            <label className={styles.addBtn} style={{display:'inline-flex',width:'auto',opacity:uploading?0.7:1,cursor:uploading?'not-allowed':'pointer'}}>
              <Camera size={15}/>{uploading?'Uploading...':'Upload Image'}
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageUpload} disabled={uploading} style={{display:'none'}}/>
            </label>
          </div>
        </div>
      </div>

      {/* ── Personal info ── */}
      <div className={styles.formCard}>
        <h3 className={styles.formTitle}>Personal Information</h3>
        <div className={styles.formGrid}>
          <div className={styles.field}><label>First Name</label><input value={form.firstName} onChange={f('firstName')} placeholder="Sanjay"/></div>
          <div className={styles.field}><label>Last Name</label><input value={form.lastName} onChange={f('lastName')} placeholder="Dhiman"/></div>
          <div className={styles.field}><label>Email</label><input type="email" value={form.email} onChange={f('email')} placeholder="you@example.com"/></div>
          <div className={styles.field}><label>Phone</label><input value={form.phone} onChange={f('phone')} placeholder="+91 98765 43210"/></div>
          <div className={styles.field}><label>Date of Birth</label><input type="date" value={form.dob} onChange={f('dob')}/></div>
          <div className={styles.field}><label>Gender</label>
            <select value={form.gender} onChange={f('gender')}>
              {GENDERS.map(g=><option key={g} value={g}>{g.replace('_',' ')}</option>)}
            </select>
          </div>
          <div className={styles.field}><label>Height (cm)</label><input type="number" value={form.heightCm} onChange={f('heightCm')} placeholder="175"/></div>
          <div className={styles.field}><label>Current Weight (kg)</label><input type="number" step="0.1" value={form.weightKg} onChange={f('weightKg')} placeholder="72"/></div>
          <div className={`${styles.field} ${styles.fieldFull}`}><label>Bio</label>
            <input value={form.bio} onChange={f('bio')} placeholder="Tell us about yourself..."/>
          </div>
        </div>
      </div>

      {/* ── Daily Goals ── */}
      <div className={styles.formCard}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18,flexWrap:'wrap',gap:10}}>
          <div>
            <h3 className={styles.formTitle} style={{marginBottom:3}}>Daily Goals</h3>
            <p style={{fontSize:13,color:'var(--text-muted)',fontWeight:500}}>Set manually or let AI calculate based on your body profile</p>
          </div>
          {/* Mode toggle */}
          <div style={{display:'flex',gap:6,background:'var(--bg-input)',borderRadius:'var(--radius-md)',padding:4}}>
            {(['manual','ai'] as GoalMode[]).map(m=>(
              <button key={m} onClick={()=>{ setGoalMode(m); if(m==='ai') resetAiWizard(); }}
                style={{display:'flex',alignItems:'center',gap:6,padding:'7px 16px',borderRadius:'var(--radius-sm)',fontSize:13,fontWeight:700,border:'none',transition:'all 0.2s',
                  background: goalMode===m?(m==='ai'?'linear-gradient(135deg,#6366f1,#a855f7)':'var(--bg-surface)'):'transparent',
                  color: goalMode===m?( m==='ai'?'#fff':'var(--text-primary)'):'var(--text-muted)',
                  boxShadow: goalMode===m?'var(--shadow-sm)':'none',
                }}>
                {m==='ai'?<Sparkles size={13}/>:<PenLine size={13}/>}
                {m==='ai'?'AI Generate':'Manual'}
              </button>
            ))}
          </div>
        </div>

        {/* Current goal summary cards */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:10,marginBottom:22}}>
          {goalCards.map(c=>(
            <div key={c.field} style={{background:'var(--metric-bg)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'12px 14px'}}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6,color:c.color}}>{c.icon}<span style={{fontSize:11,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.06em'}}>{c.label}</span></div>
              <div style={{fontSize:20,fontWeight:800,color:c.value?c.color:'var(--text-muted)',letterSpacing:'-0.03em'}}>
                {c.value||'—'}<span style={{fontSize:11,fontWeight:500,color:'var(--text-muted)',marginLeft:2}}>{c.value?c.unit:''}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── MANUAL mode ── */}
        {goalMode==='manual' && (
          <div className={styles.formGrid}>
            <div className={styles.field}><label>Calorie Target (kcal/day)</label><input type="number" value={form.calorieTarget} onChange={f('calorieTarget')} placeholder="2200"/></div>
            <div className={styles.field}><label>Water Target (ml/day)</label><input type="number" value={form.waterTargetMl} onChange={f('waterTargetMl')} placeholder="2500"/></div>
            <div className={styles.field}><label>Sleep Target (hrs)</label><input type="number" step="0.5" value={form.targetSleepHrs} onChange={f('targetSleepHrs')} placeholder="8"/></div>
            <div className={styles.field}><label>Step Goal (steps/day)</label><input type="number" value={form.stepGoal} onChange={f('stepGoal')} placeholder="10000"/></div>
            <div className={styles.field}><label>Target Weight (kg)</label><input type="number" step="0.1" value={form.targetWeightKg} onChange={f('targetWeightKg')} placeholder="70"/></div>
            <div className={styles.field}><label>Activity Level</label>
              <select value={form.activityIntensity} onChange={f('activityIntensity')}>
                {ACTIVITY_LEVELS.map(a=><option key={a} value={a}>{ACTIVITY_LABELS[a]}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* ── AI mode ── */}
        {goalMode==='ai' && (
          <div className={pStyles.aiGoalPanel}>
            {aiStep==='form' && (
              <>
                <div className={pStyles.aiPanelHeader}>
                  <div className={pStyles.aiPanelIcon}><Sparkles size={18}/></div>
                  <div>
                    <div className={pStyles.aiPanelTitle}>AI Goal Generator</div>
                    <div className={pStyles.aiPanelSub}>Our AI nutritionist will calculate personalised daily targets based on your body profile and fitness goal.</div>
                  </div>
                </div>

                <div className={pStyles.aiChecklist}>
                  {[
                    { ok: !!form.heightCm && !!form.weightKg, label:'Height & current weight (from Personal Info above)' },
                    { ok: !!form.gender,  label:'Gender' },
                    { ok: !!form.dob,     label:'Date of birth (for age calculation)' },
                  ].map((item,i)=>(
                    <div key={i} className={pStyles.aiCheckItem} style={{color:item.ok?'var(--accent)':'var(--text-muted)'}}>
                      <CheckCircle2 size={15} style={{flexShrink:0,opacity:item.ok?1:0.35}}/>
                      <span style={{fontSize:13}}>{item.label}</span>
                    </div>
                  ))}
                </div>

                <div className={styles.formGrid} style={{marginTop:16}}>
                  <div className={styles.field}>
                    <label>Target Weight (kg)</label>
                    <input type="number" step="0.1" placeholder="e.g. 70" value={aiForm.targetWeightKg} onChange={af('targetWeightKg')}/>
                  </div>
                  <div className={styles.field}>
                    <label>Activity Level</label>
                    <select value={aiForm.activityIntensity} onChange={af('activityIntensity')}>
                      {ACTIVITY_LEVELS.map(a=><option key={a} value={a}>{ACTIVITY_LABELS[a]}</option>)}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label>Target Duration</label>
                    <input type="number" min="1" max="52" value={aiForm.targetTimeValue} onChange={af('targetTimeValue')} placeholder="3"/>
                  </div>
                  <div className={styles.field}>
                    <label>Duration Unit</label>
                    <select value={aiForm.targetTimeUnit} onChange={af('targetTimeUnit')}>
                      {TARGET_UNITS.map(u=><option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                {aiError && <div className={styles.errorBanner} style={{marginTop:12}}>{aiError}</div>}

                <button className={pStyles.aiGenerateBtn} onClick={handleGenerateGoals}>
                  <Sparkles size={15}/> Generate My Goals with AI
                  <ChevronRight size={15}/>
                </button>
              </>
            )}

            {aiStep==='loading' && (
              <div className={pStyles.aiLoading}>
                <Loader2 size={36} className={pStyles.aiSpinner}/>
                <div className={pStyles.aiLoadingTitle}>AI is calculating your goals…</div>
                <div className={pStyles.aiLoadingSub}>Analysing your body profile, activity level and target timeline with our AI nutritionist.</div>
              </div>
            )}

            {aiStep==='done' && (
              <div className={pStyles.aiDone}>
                <div className={pStyles.aiDoneIcon}><CheckCircle2 size={32} color="#3dbf96"/></div>
                <div className={pStyles.aiDoneTitle}>Goals Generated!</div>
                <div className={pStyles.aiDoneSub}>Your personalised daily targets have been calculated and filled in above. Click <strong>Save Profile</strong> to persist them.</div>
                <div style={{display:'flex',gap:10,marginTop:16,flexWrap:'wrap'}}>
                  <button className={pStyles.aiRetryBtn} onClick={resetAiWizard}>Regenerate</button>
                  <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                    <Save size={14}/>{saving?'Saving…':'Save Profile'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
