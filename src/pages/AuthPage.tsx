import React, { useState } from 'react';
import { useApp } from '../App';
import { Sun, Moon, ArrowLeft, Eye, EyeOff, ArrowRight, Check, Mail } from 'lucide-react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { api } from '../api';
import { normalizeProfileImageUrl } from '../profileImageUrl';
import styles from './AuthPage.module.css';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

// Custom themed Google button — uses useGoogleLogin hook so we control all styling
function GoogleButton({ mode, onSuccess, onError, loading }: {
  mode: 'login' | 'signup';
  onSuccess: (tokenResponse: any) => void;
  onError: () => void;
  loading: boolean;
}) {
  const login = useGoogleLogin({
    onSuccess,
    onError,
    flow: 'implicit',
  });

  return (
    <button
      type="button"
      className={styles.googleBtn}
      onClick={() => login()}
      disabled={loading}
    >
      <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
        <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.85l6.08-6.08C34.42 3.05 29.5 1 24 1 14.72 1 6.83 6.48 3.18 14.3l7.1 5.52C12.02 13.73 17.56 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.52 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.7c-.55 2.97-2.22 5.48-4.73 7.17l7.26 5.63C43.39 37.36 46.52 31.36 46.52 24.5z"/>
        <path fill="#FBBC05" d="M10.28 28.22A14.6 14.6 0 0 1 9.5 24c0-1.47.25-2.9.68-4.22l-7.1-5.52A23.94 23.94 0 0 0 0 24c0 3.86.92 7.51 2.54 10.73l7.74-6.51z"/>
        <path fill="#34A853" d="M24 47c5.5 0 10.12-1.82 13.48-4.95l-7.26-5.63c-1.82 1.22-4.15 1.94-6.22 1.94-6.44 0-11.98-4.23-13.72-9.94l-7.74 6.51C6.83 41.52 14.72 47 24 47z"/>
        <path fill="none" d="M0 0h48v48H0z"/>
      </svg>
      {mode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}
    </button>
  );
}

export default function AuthPage() {
  const { setPage, setUser, toggleTheme, theme } = useApp();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [form, setForm] = useState({ userName: '', password: '', confirm: '', terms: false });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const logoSrc = '/coach.png';

  const f = (k: string) => (e: any) =>
    setForm(prev => ({ ...prev, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const doLogin = async (userName: string, password: string) => {
    const res = await api.auth.login(userName, password);
    const role: 'user' | 'admin' = res.role === 'admin' ? 'admin' : 'user';
    setUser({
      userId: res.userId, userName: res.userName, token: res.accessToken,
      role, firstName: res.firstName, lastName: res.lastName,
      plan: res.plan, avatarUrl: normalizeProfileImageUrl(res.avatarUrl),
    });
    setPage(role === 'admin' ? 'admin' : 'dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setInfo('');
    if (mode === 'forgot') {
      setLoading(true);
      try {
        await api.auth.forgotPassword(form.userName);
        setInfo('If that email exists, a reset link has been sent. Check your inbox.');
        setMode('login');
      } catch (err: any) { setError(err.message); }
      setLoading(false);
      return;
    }
    if (mode === 'signup') {
      if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
      if (!form.terms) { setError('Please accept the terms to continue'); return; }
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await doLogin(form.userName, form.password);
      } else {
        await api.auth.register(form.userName, form.password, form.terms);
        await doLogin(form.userName, form.password);
        setPage('onboarding');
      }
    } catch (err: any) { setError(err.message || 'Something went wrong. Please try again.'); }
    setLoading(false);
  };

  const handleGoogleSuccess = async (tokenResponse: any) => {
    setError(''); setLoading(true);
    try {
      const res = await api.auth.googleLogin(tokenResponse.access_token);
      const role: 'user' | 'admin' = res.role === 'admin' ? 'admin' : 'user';
      setUser({ userId: res.userId, userName: res.userName, token: res.accessToken, role, firstName: res.firstName, lastName: res.lastName, plan: res.plan, avatarUrl: normalizeProfileImageUrl(res.avatarUrl) });
      setPage(role === 'admin' ? 'admin' : 'dashboard');
    } catch (err: any) { setError(err.message || 'Google login failed'); }
    setLoading(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => setPage('landing')}><ArrowLeft size={16} /> Back</button>
        <div className={styles.logo}>
          <img src={logoSrc} alt="FitPulseBot" className={styles.logoImg} onError={e => (e.currentTarget.style.display='none')} />
        </div>
        <button className="theme-btn" onClick={toggleTheme}>{theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}</button>
      </div>

      <div className={styles.container}>
        <div className={styles.card}>
          {/* Tabs */}
          {mode !== 'forgot' && (
            <div className={styles.tabs}>
              <button className={`${styles.tab} ${mode === 'login' ? styles.tabActive : ''}`} onClick={() => { setMode('login'); setError(''); setInfo(''); }}>Sign In</button>
              <button className={`${styles.tab} ${mode === 'signup' ? styles.tabActive : ''}`} onClick={() => { setMode('signup'); setError(''); setInfo(''); }}>Create Account</button>
            </div>
          )}

          <div className={styles.cardBody}>
            {mode === 'forgot' ? (
              <>
                <div className={styles.forgotIcon}><Mail size={28} color="var(--accent)" /></div>
                <h2 className={styles.title}>Forgot Password</h2>
                <p className={styles.subtitle}>Enter your email and we'll send a reset link.</p>
              </>
            ) : (
              <>
                <h2 className={styles.title}>{mode === 'login' ? 'Welcome back!' : 'Start your journey'}</h2>
                <p className={styles.subtitle}>{mode === 'login' ? 'Sign in to continue your health journey.' : 'Create a free account — no credit card needed.'}</p>
              </>
            )}

            {error && <div className={styles.errorBanner}>{error}</div>}
            {info && <div className={styles.infoBanner}>{info}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label>{mode === 'forgot' ? 'Email Address' : 'Email / Username'}</label>
                <input placeholder={mode === 'forgot' ? 'you@example.com' : 'you@example.com'} value={form.userName} onChange={f('userName')} required autoComplete="username" />
              </div>

              {mode !== 'forgot' && (
                <div className={styles.field}>
                  <label>Password</label>
                  <div className={styles.pwWrap}>
                    <input type={showPw ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={f('password')} required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
                    <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(v => !v)}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'signup' && (
                <>
                  <div className={styles.field}>
                    <label>Confirm Password</label>
                    <input type={showPw ? 'text' : 'password'} placeholder="••••••••" value={form.confirm} onChange={f('confirm')} required />
                  </div>
                  <label className={styles.checkLabel}>
                    <div className={`${styles.checkbox} ${form.terms ? styles.checkboxActive : ''}`} onClick={() => setForm(p => ({ ...p, terms: !p.terms }))}>
                      {form.terms && <Check size={11} color="#fff" />}
                    </div>
                    <span>I agree to the <a href="#" className={styles.link}>Terms</a> and <a href="#" className={styles.link}>Privacy Policy</a></span>
                  </label>
                </>
              )}

              {mode === 'login' && (
                <div className={styles.forgotRow}>
                  <button type="button" className={styles.link} style={{ background: 'none', fontSize: 13 }} onClick={() => { setMode('forgot'); setError(''); setInfo(''); }}>Forgot password?</button>
                </div>
              )}

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading && <span className={styles.spinner} />}
                {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                {!loading && <ArrowRight size={15} />}
              </button>

              {mode === 'forgot' && (
                <button type="button" className={styles.demoBtn} onClick={() => { setMode('login'); setError(''); setInfo(''); }}>
                  ← Back to Sign In
                </button>
              )}
            </form>

            {mode !== 'forgot' && (
              <>
                <div className={styles.divider}><span>or</span></div>
                {GOOGLE_CLIENT_ID ? (
                  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                    <GoogleButton
                      mode={mode as 'login' | 'signup'}
                      onSuccess={handleGoogleSuccess}
                      onError={() => setError('Google login failed')}
                      loading={loading}
                    />
                  </GoogleOAuthProvider>
                ) : (
                  <div className={styles.googleNote}>Set REACT_APP_GOOGLE_CLIENT_ID to enable Google sign-in</div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Side promo */}
        <div className={styles.promo}>
          <div className={styles.promoTag}>✓ Free to start</div>
          <h2 className={styles.promoTitle}>Your AI health companion awaits</h2>
          <div className={styles.promoFeatures}>
            {['Activity & workout tracking','AI-powered nutrition insights','Smart hydration reminders','Sleep quality monitoring','Weight trend analysis','Personalised health reports','Support ticket system','Subscription management'].map((feat, i) => (
              <div key={i} className={styles.promoFeature}><Check size={14} className={styles.promoCheck} />{feat}</div>
            ))}
          </div>
          <div className={styles.promoStats}>
            <div className={styles.promoStat}><span>50K+</span>users</div>
            <div className={styles.promoStat}><span>4.9★</span>rated</div>
            <div className={styles.promoStat}><span>98%</span>goals met</div>
          </div>
        </div>
      </div>
    </div>
  );
}
