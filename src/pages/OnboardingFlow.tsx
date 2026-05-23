import React, { useState } from 'react';
import { useApp } from '../App';
import { ArrowLeft, ArrowRight, Check, User, Target, Activity, Sun, Moon } from 'lucide-react';
import { api } from '../api';
import styles from './OnboardingFlow.module.css';

const GOALS = ['Lose Weight', 'Build Muscle', 'Improve Fitness', 'Better Sleep', 'Stay Hydrated', 'Eat Healthier'];
const ACTIVITY_LEVELS = [
  { label: 'Sedentary', desc: 'Little or no exercise', icon: '🛋️' },
  { label: 'Light', desc: '1–3 days/week', icon: '🚶' },
  { label: 'Moderate', desc: '3–5 days/week', icon: '🏃' },
  { label: 'Active', desc: '6–7 days/week', icon: '💪' },
  { label: 'Very Active', desc: 'Athlete level', icon: '🏆' },
];

const STEPS = ['Profile', 'Goals', 'Activity', 'Done'];

export default function OnboardingFlow() {
  const { setPage, toggleTheme, theme } = useApp();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: '', age: '', weight: '', height: '', gender: 'Male' });
  const [goals, setGoals] = useState<string[]>([]);
  const [activity, setActivity] = useState('');
  const logoSrc = theme === 'dark' ? '/logo2.png' : '/logo.png';

  const toggleGoal = (g: string) => setGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  const handleFinish = async () => {
    // Save profile to API (best-effort, don't block navigation)
    try {
      const [firstName, ...rest] = form.name.trim().split(' ');
      await api.profile.update({
        firstName: firstName || null,
        lastName: rest.join(' ') || null,
        heightCm: form.height ? parseInt(form.height) : null,
        weightKg: form.weight ? parseInt(form.weight) : null,
        gender: form.gender,
        email: null, bio: null, dob: null,
        goals: { activityLevel: activity, targets: goals },
      });
    } catch {}
    setPage('dashboard');
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.logo}>
          <img src={logoSrc} alt="FitPulseBot" className={styles.logoImg} onError={e => (e.currentTarget.style.display='none')} />
        </div>
        <button className="theme-btn" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>

      <div className={styles.container}>
        {/* Progress */}
        <div className={styles.progress}>
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`${styles.progressStep} ${i <= step ? styles.progressActive : ''}`}>
                {i < step ? <Check size={12} /> : <span>{i + 1}</span>}
                <span className={styles.progressLabel}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`${styles.progressLine} ${i < step ? styles.lineActive : ''}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* STEP 0 — Profile */}
        {step === 0 && (
          <div className={styles.card}>
            <div className={styles.stepIcon}><User size={28} color="var(--accent)" /></div>
            <h2 className={styles.stepTitle}>Tell us about yourself</h2>
            <p className={styles.stepDesc}>We'll use this to personalise your health plan.</p>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label>Full Name</label>
                <input placeholder="Sanjay Dhiman" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className={styles.field}>
                <label>Age</label>
                <input type="number" placeholder="28" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
              </div>
              <div className={styles.field}>
                <label>Weight (kg)</label>
                <input type="number" placeholder="70" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} />
              </div>
              <div className={styles.field}>
                <label>Height (cm)</label>
                <input type="number" placeholder="175" value={form.height} onChange={e => setForm({ ...form, height: e.target.value })} />
              </div>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label>Gender</label>
                <div className={styles.genderPicker}>
                  {['Male', 'Female', 'Other'].map(g => (
                    <button key={g} className={`${styles.genderBtn} ${form.gender === g ? styles.genderActive : ''}`}
                      onClick={() => setForm({ ...form, gender: g })}>{g}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1 — Goals */}
        {step === 1 && (
          <div className={styles.card}>
            <div className={styles.stepIcon}><Target size={28} color="var(--accent)" /></div>
            <h2 className={styles.stepTitle}>What are your goals?</h2>
            <p className={styles.stepDesc}>Pick all that apply — we'll tailor your experience.</p>
            <div className={styles.goalGrid}>
              {GOALS.map(g => (
                <button key={g} className={`${styles.goalChip} ${goals.includes(g) ? styles.goalActive : ''}`}
                  onClick={() => toggleGoal(g)}>
                  {goals.includes(g) && <Check size={13} />}
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 — Activity */}
        {step === 2 && (
          <div className={styles.card}>
            <div className={styles.stepIcon}><Activity size={28} color="var(--accent)" /></div>
            <h2 className={styles.stepTitle}>Current activity level?</h2>
            <p className={styles.stepDesc}>This helps us calculate your calorie needs accurately.</p>
            <div className={styles.activityList}>
              {ACTIVITY_LEVELS.map(a => (
                <button key={a.label} className={`${styles.activityItem} ${activity === a.label ? styles.activityActive : ''}`}
                  onClick={() => setActivity(a.label)}>
                  <span className={styles.activityIcon}>{a.icon}</span>
                  <div>
                    <div className={styles.activityLabel}>{a.label}</div>
                    <div className={styles.activityDesc}>{a.desc}</div>
                  </div>
                  {activity === a.label && <Check size={16} className={styles.activityCheck} />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3 — Done */}
        {step === 3 && (
          <div className={`${styles.card} ${styles.cardCenter}`}>
            <div className={styles.doneRing}>
              <Check size={36} color="var(--accent)" strokeWidth={2.5} />
            </div>
            <h2 className={styles.stepTitle}>You're all set, {form.name || 'friend'}! 🎉</h2>
            <p className={styles.stepDesc}>Your personalised health plan is ready. Let's start your wellness journey.</p>
            <div className={styles.doneSummary}>
              <div className={styles.doneStat}><span>Goals</span><span>{goals.length} selected</span></div>
              <div className={styles.doneStat}><span>Activity</span><span>{activity || 'Moderate'}</span></div>
              <div className={styles.doneStat}><span>Plan</span><span>Start (Free)</span></div>
            </div>
          </div>
        )}

        {/* Nav Buttons */}
        <div className={styles.navBtns}>
          {step > 0 && (
            <button className={styles.btnBack} onClick={() => setStep(s => s - 1)}>
              <ArrowLeft size={16} /> Back
            </button>
          )}
          {step < 3 && (
            <button className={styles.btnNext} onClick={() => setStep(s => s + 1)}>
              Continue <ArrowRight size={16} />
            </button>
          )}
          {step === 3 && (
            <button className={styles.btnNext} onClick={handleFinish}>
              Go to Dashboard <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
