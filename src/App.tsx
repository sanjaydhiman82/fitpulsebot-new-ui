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
import GlobalApiSpinner from './components/GlobalApiSpinner';
import { LogOut, X } from 'lucide-react';
import { normalizeProfileImageUrl } from './profileImageUrl';
import OrgAuthPage from './pages/OrgAuthPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import OrgDashboard from './pages/OrgDashboard';
import BranchDashboard from './pages/BranchDashboard';
import ResourceDashboard from './pages/ResourceDashboard';
import ResetPasswordPage from './pages/ResetPasswordPage';

export type Theme = 'light' | 'dark';
export type Page =
  | 'landing' | 'onboarding' | 'dashboard' | 'admin' | 'auth' | 'privacy' | 'terms'
  | 'org-auth' | 'super-admin' | 'org-dashboard' | 'branch-dashboard' | 'resource-dashboard'
  | 'reset-password';

export type UserRole = 'user' | 'admin' | 'SUPER_ADMIN' | 'ORGANIZATION_ADMIN' | 'BRANCH_MANAGER' | 'RESOURCE' | 'CLIENT';

export interface AuthUser {
  userId: string;
  userName: string;
  token: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  plan?: string;
  avatarUrl?: string;
  organizationId?: string;
  branchId?: string;
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

const STORAGE_KEYS = [
  'fitpulse_token',
  'fitpulse_userId',
  'fitpulse_userName',
  'fitpulse_role',
  'fitpulse_firstName',
  'fitpulse_lastName',
  'fitpulse_plan',
  'fitpulse_avatarUrl',
  'fitpulse_organizationId',
  'fitpulse_branchId',
];

function loadStoredUser(): AuthUser | null {
  const token    = localStorage.getItem('fitpulse_token');
  const userId   = localStorage.getItem('fitpulse_userId');
  const userName = localStorage.getItem('fitpulse_userName');
  const role     = localStorage.getItem('fitpulse_role') as UserRole | null;
  const firstName = localStorage.getItem('fitpulse_firstName') || undefined;
  const lastName  = localStorage.getItem('fitpulse_lastName') || undefined;
  const plan      = localStorage.getItem('fitpulse_plan') || undefined;
  const avatarUrl = normalizeProfileImageUrl(localStorage.getItem('fitpulse_avatarUrl')) || undefined;
  const organizationId = localStorage.getItem('fitpulse_organizationId') || undefined;
  const branchId = localStorage.getItem('fitpulse_branchId') || undefined;
  if (token && userId && userName) {
    return { token, userId, userName, role: role || 'user', firstName, lastName, plan, avatarUrl, organizationId, branchId };
  }
  return null;
}

function persistUser(u: AuthUser) {
  localStorage.setItem('fitpulse_token',    u.token);
  localStorage.setItem('fitpulse_userId',   u.userId);
  localStorage.setItem('fitpulse_userName', u.userName);
  localStorage.setItem('fitpulse_role',     u.role);
  if (u.firstName) localStorage.setItem('fitpulse_firstName', u.firstName);
  if (u.lastName) localStorage.setItem('fitpulse_lastName', u.lastName);
  if (u.plan) localStorage.setItem('fitpulse_plan', u.plan);
  if (u.avatarUrl) localStorage.setItem('fitpulse_avatarUrl', u.avatarUrl);
  if (u.organizationId) localStorage.setItem('fitpulse_organizationId', u.organizationId);
  if (u.branchId) localStorage.setItem('fitpulse_branchId', u.branchId);
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

  useEffect(() => {
    if (window.location.pathname === '/reset-password') {
      setPage('reset-password');
    }
  }, []);

  // On mount: if we have a stored session, route to the right page
  useEffect(() => {
    if (window.location.pathname === '/reset-password') return;
    const stored = loadStoredUser();
    if (stored) {
      setUserState(stored);
      const role = stored.role;
      if (role === 'admin') setPage('admin');
      else if (role === 'SUPER_ADMIN') setPage('super-admin');
      else if (role === 'ORGANIZATION_ADMIN') setPage('org-dashboard');
      else if (role === 'BRANCH_MANAGER') setPage('branch-dashboard');
      else if (role === 'RESOURCE') setPage('resource-dashboard');
      else setPage('dashboard');
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
        {page === 'landing'           && <LandingPage />}
        {page === 'auth'              && <AuthPage />}
        {page === 'org-auth'          && <OrgAuthPage />}
        {page === 'onboarding'        && <OnboardingFlow />}
        {page === 'dashboard'         && <Dashboard />}
        {page === 'admin'             && <AdminDashboard />}
        {page === 'super-admin'       && <SuperAdminDashboard />}
        {page === 'org-dashboard'     && <OrgDashboard />}
        {page === 'branch-dashboard'  && <BranchDashboard />}
        {page === 'resource-dashboard' && <ResourceDashboard />}
        {page === 'privacy'           && <PrivacyPolicy />}
        {page === 'terms'             && <TermsOfService />}
        {page === 'reset-password'    && <ResetPasswordPage />}
        <SessionGuard />
        <GlobalApiSpinner />
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
