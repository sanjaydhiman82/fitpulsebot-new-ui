/**
 * SessionGuard — monitors token expiry, shows a "Stay logged in?" dialog
 * with a countdown. User can extend session or log out.
 *
 * Architecture:
 *  - apiFetch fires a custom DOM event 'fitpulse:session-expired' on 401
 *  - SessionGuard listens, shows the modal, calls /api/v1/auth/refresh if user stays
 *  - On success: new token stored everywhere, all pending requests retry automatically
 *  - On decline / timeout: logout() called
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LogOut, RefreshCw, ShieldAlert } from 'lucide-react';
import { useApp } from '../App';
import { apiFetch } from '../api';

const COUNTDOWN_SECONDS = 60;

export const SESSION_EXPIRED_EVENT = 'fitpulse:session-expired';

// Global promise that resolves when the user makes a choice
// Prevents stacking multiple dialogs if 401s fire simultaneously
let activeResolution: ((stayed: boolean) => void) | null = null;

export function triggerSessionExpired(): Promise<boolean> {
  if (activeResolution) {
    // Dialog already open — return the same promise
    return new Promise(resolve => {
      const original = activeResolution!;
      activeResolution = (stayed) => { original(stayed); resolve(stayed); };
    });
  }
  const promise = new Promise<boolean>(resolve => {
    activeResolution = resolve;
  });
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  return promise;
}

export default function SessionGuard() {
  const { user, setUser, logout } = useApp();
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [refreshing, setRefreshing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const doLogout = useCallback(() => {
    stopTimer();
    setVisible(false);
    if (activeResolution) { activeResolution(false); activeResolution = null; }
    logout();
  }, [logout]);

  const doStay = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    stopTimer();
    try {
      const data = await apiFetch('/auth/refresh', { method: 'POST' });
      const newToken: string = data.accessToken;

      // Persist new token
      localStorage.setItem('fitpulse_token', newToken);

      // Update app context user object
      if (user) {
        setUser({ ...user, token: newToken });
      }

      setVisible(false);
      if (activeResolution) { activeResolution(true); activeResolution = null; }
    } catch {
      // Refresh failed — force logout
      doLogout();
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, user, setUser, doLogout]);

  // Listen for session-expired events
  useEffect(() => {
    const handler = () => {
      if (visible) return; // already showing
      setCountdown(COUNTDOWN_SECONDS);
      setVisible(true);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, handler);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handler);
  }, [visible]);

  // Countdown timer
  useEffect(() => {
    if (!visible) return;
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { doLogout(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return stopTimer;
  }, [visible, doLogout]);

  if (!visible) return null;

  const pct = (countdown / COUNTDOWN_SECONDS) * 100;
  const urgency = countdown <= 15;

  return (
    <>
      {/* Backdrop */}
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)', zIndex: 9998,
      }} />

      {/* Dialog */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999,
        width: 'min(420px, 90vw)',
        background: 'var(--bg-card)',
        border: `1.5px solid ${urgency ? 'rgba(239,68,68,0.5)' : 'var(--border-strong)'}`,
        borderRadius: 20,
        padding: '32px 28px 24px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        display: 'flex', flexDirection: 'column', gap: 20,
        animation: 'sessionSlideIn 0.25s ease',
      }}>

        {/* Icon + heading */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: urgency ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.12)',
            border: `1.5px solid ${urgency ? 'rgba(239,68,68,0.35)' : 'rgba(99,102,241,0.35)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ShieldAlert size={26} color={urgency ? '#ef4444' : '#818cf8'} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Your session is expiring
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 5, lineHeight: 1.5 }}>
              You'll be logged out automatically for security.<br />
              Do you want to stay logged in?
            </div>
          </div>
        </div>

        {/* Countdown ring */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <svg width="90" height="90" viewBox="0 0 90 90">
            <circle cx="45" cy="45" r="38" fill="none"
              stroke="var(--border)" strokeWidth="7" />
            <circle cx="45" cy="45" r="38" fill="none"
              stroke={urgency ? '#ef4444' : '#818cf8'} strokeWidth="7"
              strokeDasharray={`${2 * Math.PI * 38}`}
              strokeDashoffset={`${2 * Math.PI * 38 * (1 - pct / 100)}`}
              strokeLinecap="round"
              transform="rotate(-90 45 45)"
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
            />
            <text x="45" y="49" textAnchor="middle"
              fill={urgency ? '#ef4444' : 'var(--text-primary)'}
              fontSize="22" fontWeight="800" fontFamily="inherit">
              {countdown}
            </text>
          </svg>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
            seconds remaining
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={doLogout}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '11px 0', borderRadius: 12,
              border: '1.5px solid var(--border)', background: 'transparent',
              color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
          >
            <LogOut size={15} /> Log out
          </button>
          <button
            onClick={doStay}
            disabled={refreshing}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '11px 0', borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              border: 'none', color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: refreshing ? 'not-allowed' : 'pointer',
              opacity: refreshing ? 0.75 : 1, transition: 'all 0.2s',
              boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
            }}
          >
            <RefreshCw size={15} className={refreshing ? 'session-spin' : ''} />
            {refreshing ? 'Refreshing…' : 'Stay logged in'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes sessionSlideIn {
          from { opacity: 0; transform: translate(-50%, -48%); }
          to   { opacity: 1; transform: translate(-50%, -50%); }
        }
        .session-spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
