import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, Eye, EyeOff, KeyRound, Moon, Sun } from 'lucide-react';
import { api } from '../api';
import { useApp } from '../App';
import styles from './AuthPage.module.css';

export default function ResetPasswordPage() {
  const { setPage, toggleTheme, theme } = useApp();
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const token = params.get('token') || '';
  const email = params.get('email') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const goToAuth = () => {
    window.history.pushState({}, '', '/');
    setPage('auth');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!token || !email) {
      setError('This reset link is missing required details. Please request a new link.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.auth.resetPassword(email, token, password);
      setInfo('Your password has been changed successfully. You can sign in now.');
      setPassword('');
      setConfirmPassword('');
      setTimeout(goToAuth, 1400);
    } catch (err: any) {
      setError(err?.message || 'Failed to change password. The reset link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={goToAuth}><ArrowLeft size={16} /> Back to Sign In</button>
        <div className={styles.logo}>
          <img src="/coach.png" alt="FitPulseBot" className={styles.logoImg} onError={e => (e.currentTarget.style.display = 'none')} />
          <div>
            <div className={styles.logoName}>FitPulseBot</div>
            <div className={styles.logoTagline}>Stay on Track,Stay in Pulse</div>
          </div>
        </div>
        <button className="theme-btn" onClick={toggleTheme}>{theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}</button>
      </div>

      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.cardBody}>
            <div className={styles.forgotIcon}><KeyRound size={28} color="var(--accent)" /></div>
            <h2 className={styles.title}>Change Password</h2>
            <p className={styles.subtitle}>Enter and confirm your new password for {email || 'your account'}.</p>

            {error && <div className={styles.errorBanner}>{error}</div>}
            {info && <div className={styles.infoBanner}><CheckCircle size={15} /> {info}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label>New Password</label>
                <div className={styles.pwWrap}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(v => !v)}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className={styles.field}>
                <label>Confirm New Password</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading && <span className={styles.spinner} />}
                {loading ? 'Changing password...' : 'Change Password'}
                {!loading && <ArrowRight size={15} />}
              </button>
            </form>
          </div>
        </div>

        <div className={styles.promo}>
          <div className={styles.promoTag}>Secure reset</div>
          <h2 className={styles.promoTitle}>Create a new password and get back on track</h2>
          <div className={styles.promoFeatures}>
            {['Reset links expire after 1 hour', 'Use a password you do not reuse elsewhere', 'Sign in again after changing your password'].map((feat, i) => (
              <div key={i} className={styles.promoFeature}><CheckCircle size={14} className={styles.promoCheck} />{feat}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
