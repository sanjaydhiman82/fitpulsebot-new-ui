import React, { useState, createContext, useContext, useEffect } from 'react';
import './index.css';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import OnboardingFlow from './pages/OnboardingFlow';
import AuthPage from './pages/AuthPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import SessionGuard from './components/SessionGuard';
import { LogOut, X } from 'lucide-react';
import { normalizeProfileImageUrl } from './profileImageUrl';

export type Theme = 'light' | 'dark';
export type Page = 'landing' | 'onboarding' | 'dashboard' | 'admin' | 'auth' | 'privacy' | 'terms';

export interface AuthUser {
  userId: string;
  userName: string;
  token: string;
  role: 'user' | 'admin';
  firstName?: string;
  lastName?: string;
  plan?: string;
  avatarUrl?: string;
}

interface AppCtx {
  theme: Theme; toggleTheme: () => void;
  page: Page; setPage: (p: Page) => void;
  user: AuthUser | null;
  setUser: (u: AuthUser | null) => void;
  logout: () => void;
  requestLogout: () => void;
}

export const AppContext = createContext<AppCtx>({} as AppCtx);
export const useApp = () => useContext(AppContext);

const STORAGE_KEYS = ['fitpulse_token', 'fitpulse_userId', 'fitpulse_userName', 'fitpulse_role'];

function loadStoredUser(): AuthUser | null {
  const token    = localStorage.getItem('fitpulse_token');
  const userId   = localStorage.getItem('fitpulse_userId');
  const userName = localStorage.getItem('fitpulse_userName');
  const role     = localStorage.getItem('fitpulse_role') as 'user' | 'admin' | null;
  if (token && userId && userName) {
    return { token, userId, userName, role: role || 'user' };
  }
  return null;
}

function persistUser(u: AuthUser) {
  localStorage.setItem('fitpulse_token',    u.token);
  localStorage.setItem('fitpulse_userId',   u.userId);
  localStorage.setItem('fitpulse_userName', u.userName);
  localStorage.setItem('fitpulse_role',     u.role);
}

function clearUser() {
  STORAGE_KEYS.forEach(k => localStorage.removeItem(k));
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('fitpulse_theme') as Theme) || 'dark'
  );
  const [page, setPage] = useState<Page>('landing');
  const [user, setUserState] = useState<AuthUser | null>(loadStoredUser);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  // On mount: if we have a stored session, route to the right page
  useEffect(() => {
    const stored = loadStoredUser();
    if (stored) {
      setUserState(stored);
      setPage(stored.role === 'admin' ? 'admin' : 'dashboard');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('fitpulse_theme', next);
  };

  const setUser = (u: AuthUser | null) => {
    // Always clear stale data first so no cross-user bleed
    clearUser();
    const normalizedUser = u ? { ...u, avatarUrl: normalizeProfileImageUrl(u.avatarUrl) || undefined } : null;
    setUserState(normalizedUser);
    if (normalizedUser) persistUser(normalizedUser);
  };

  const logout = () => {
    setLogoutConfirmOpen(false);
    clearUser();
    setUserState(null);
    setPage('landing');
  };

  const requestLogout = () => {
    setLogoutConfirmOpen(true);
  };

  return (
    <AppContext.Provider value={{ theme, toggleTheme, page, setPage, user, setUser, logout, requestLogout }}>
      <div data-theme={theme} style={{ minHeight: '100vh' }}>
        {page === 'landing'    && <LandingPage />}
        {page === 'auth'       && <AuthPage />}
        {page === 'onboarding' && <OnboardingFlow />}
        {page === 'dashboard'  && <Dashboard />}
        {page === 'admin'      && <AdminDashboard />}
        {page === 'privacy'    && <PrivacyPolicy />}
        {page === 'terms'      && <TermsOfService />}
        <SessionGuard />
        {logoutConfirmOpen && (
          <div
            role="presentation"
            onClick={() => setLogoutConfirmOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
              background: 'rgba(0,0,0,.62)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="logout-confirm-title"
              onClick={e => e.stopPropagation()}
              style={{
                width: 'min(420px, 100%)',
                background: 'var(--bg-card)',
                border: '1.5px solid var(--border-strong)',
                borderRadius: 18,
                padding: 22,
                boxShadow: 'var(--shadow-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(229,62,62,.13)',
                    border: '1px solid rgba(229,62,62,.28)',
                    color: 'var(--danger)',
                    flexShrink: 0,
                  }}>
                    <LogOut size={21} />
                  </div>
                  <div>
                    <h2 id="logout-confirm-title" style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)' }}>
                      Sign out?
                    </h2>
                    <p style={{ margin: '5px 0 0', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      Are you sure you want to log out of the application?
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLogoutConfirmOpen(false)}
                  aria-label="Cancel sign out"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    background: 'var(--metric-bg)',
                    border: '1px solid var(--border)',
                    flexShrink: 0,
                  }}
                >
                  <X size={17} />
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setLogoutConfirmOpen(false)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 10,
                    border: '1.5px solid var(--border)',
                    color: 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={logout}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 10,
                    background: 'var(--danger)',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: 13,
                    boxShadow: '0 8px 22px rgba(229,62,62,.22)',
                  }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppContext.Provider>
  );
}
