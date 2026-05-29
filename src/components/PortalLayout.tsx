import React, { useState } from 'react';
import { useApp } from '../App';
import {
  LogOut, Menu, X, ChevronRight, Bell, Sun, Moon, Shield
} from 'lucide-react';
import styles from './PortalLayout.module.css';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface PortalLayoutProps {
  title: string;
  subtitle: string;
  accentColor?: string;
  logoUrl?: string;
  navItems: NavItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  children: React.ReactNode;
  roleBadge?: string;
  roleBadgeColor?: string;
}

export default function PortalLayout({
  title, subtitle, accentColor = 'var(--accent)', logoUrl,
  navItems, activeTab, onTabChange, children,
  roleBadge, roleBadgeColor = 'var(--accent)',
}: PortalLayoutProps) {
  const { theme, toggleTheme, requestLogout, user } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const displayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.userName : '';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className={styles.shell}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className={styles.overlay}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        {/* Logo area */}
        <div className={styles.brandArea}>
          <div className={styles.brandRow}>
            {logoUrl ? (
              <img src={logoUrl} alt={title} className={styles.logo} onError={e => (e.currentTarget.style.display = 'none')} />
            ) : (
              <div className={styles.logoFallback} style={{ background: `linear-gradient(135deg, ${accentColor}, var(--accent-3))` }}>{title[0] || 'F'}</div>
            )}
            <div className={styles.brandText}>
              <div className={styles.brandTitle}>{title}</div>
              <div className={styles.brandSubtitle}>{subtitle}</div>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className={`${styles.iconBtn} ${styles.closeBtn}`}
              aria-label="Close navigation"
            >
              <X size={15} />
            </button>
          </div>
          {roleBadge && (
            <div className={styles.roleBadge} style={{ background: `${roleBadgeColor}22`, color: roleBadgeColor }}>
              <Shield size={13} /> {roleBadge}
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className={styles.nav} aria-label={`${subtitle} navigation`}>
          {navItems.map(item => {
            const active = activeTab === item.id;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => { onTabChange(item.id); setSidebarOpen(false); }}
                className={styles.navItem}
                aria-current={active ? 'page' : undefined}
                style={{
                  background: active ? `${accentColor}22` : 'transparent',
                  color: active ? accentColor : 'var(--text-secondary)',
                  fontWeight: active ? 700 : 500,
                  border: active ? `1px solid ${accentColor}44` : '1px solid transparent',
                }}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
                {item.badge ? (
                  <span className={styles.navBadge}>{item.badge}</span>
                ) : active && <ChevronRight size={13} />}
              </button>
            );
          })}
        </nav>

        {/* User footer */}
        <div className={styles.footer}>
          <div className={styles.userCard}>
            <div className={styles.avatar} style={{ background: `linear-gradient(135deg, ${accentColor}, var(--accent-3))` }}>{initials || 'U'}</div>
            <div className={styles.userMeta}>
              <div className={styles.userName}>{displayName}</div>
              <div className={styles.userSub}>{user?.userName}</div>
            </div>
          </div>
          <div className={styles.footerActions}>
            <button type="button" onClick={toggleTheme} className={styles.footerBtn} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
            <button type="button" onClick={requestLogout} className={`${styles.footerBtn} ${styles.dangerBtn}`}>
              <LogOut size={13} /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={styles.main}>
        {/* Top bar */}
        <header className={styles.topbar}>
          <button type="button" onClick={() => setSidebarOpen(true)} className={`${styles.iconBtn} ${styles.menuBtn}`} aria-label="Open navigation">
            <Menu size={17} />
          </button>
          <div className={styles.topbarTitle}>
            {navItems.find(n => n.id === activeTab)?.label || title}
          </div>
          <button type="button" className={styles.iconBtn} aria-label="Notifications">
            <Bell size={15} />
          </button>
        </header>

        {/* Page content */}
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}

// Shared UI building blocks
export function StatCard({ label, value, sub, icon, color = 'var(--accent)', trend }: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; color?: string; trend?: { value: number; label: string };
}) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statTop}>
        <div className={styles.statIcon} style={{ background: `${color}22`, color }}>{icon}</div>
        {trend && (
          <span className={`${styles.trend} ${trend.value >= 0 ? styles.trendUp : styles.trendDown}`}>
            {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
          </span>
        )}
      </div>
      <div>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statLabel}>{label}</div>
        {sub && <div className={styles.statSub}>{sub}</div>}
      </div>
    </div>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className={styles.sectionHeader}>
      <h3>{title}</h3>
      {action}
    </div>
  );
}

export function PrimaryBtn({ children, onClick, loading, danger, style: s, type = 'button', ariaLabel }: {
  children: React.ReactNode; onClick?: () => void;
  loading?: boolean; danger?: boolean; style?: React.CSSProperties;
  type?: 'button' | 'submit' | 'reset'; ariaLabel?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      aria-label={ariaLabel}
      className={`${styles.button} ${danger ? styles.dangerPrimary : styles.primaryBtn}`}
      style={s}
    >
      {children}
    </button>
  );
}

export function OutlineBtn({ children, onClick, style: s, type = 'button', ariaLabel }: {
  children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties;
  type?: 'button' | 'submit' | 'reset'; ariaLabel?: string;
}) {
  return (
    <button type={type} onClick={onClick} aria-label={ariaLabel} className={`${styles.button} ${styles.outlineBtn}`} style={s}>
      {children}
    </button>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    active: { bg: 'rgba(61,191,150,0.15)', color: 'var(--accent)' },
    inactive: { bg: 'rgba(161,161,170,0.15)', color: 'var(--text-muted)' },
    banned: { bg: 'rgba(229,62,62,0.15)', color: 'var(--danger)' },
    PRESENT: { bg: 'rgba(61,191,150,0.15)', color: 'var(--accent)' },
    ABSENT: { bg: 'rgba(229,62,62,0.15)', color: 'var(--danger)' },
    LATE: { bg: 'rgba(251,191,36,0.15)', color: 'var(--warning)' },
    EXCUSED: { bg: 'rgba(99,179,237,0.15)', color: 'var(--info)' },
    draft: { bg: 'rgba(161,161,170,0.15)', color: 'var(--text-muted)' },
    scheduled: { bg: 'rgba(99,179,237,0.15)', color: 'var(--info)' },
  };
  const s = map[status] || { bg: 'var(--metric-bg)', color: 'var(--text-muted)' };
  return (
    <span className={styles.badge} style={{ background: s.bg, color: s.color }}>{status}</span>
  );
}

export function Modal({ open, onClose, title, children, width = 520 }: {
  open: boolean; onClose: () => void; title: string;
  children: React.ReactNode; width?: number;
}) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      className={styles.modalOverlay}
      role="presentation"
    >
      <div
        onClick={e => e.stopPropagation()}
        className={styles.modalPanel}
        style={{ '--modal-width': `${width}px` } as React.CSSProperties}
        role="dialog"
        aria-modal="true"
        aria-labelledby="portal-modal-title"
      >
        <div className={styles.modalHeader}>
          <h3 id="portal-modal-title" className={styles.modalTitle}>{title}</h3>
          <button type="button" onClick={onClose} className={styles.iconBtn} aria-label="Close dialog"><X size={15} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function FormField({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>
        {label}{required && <span className={styles.required}> *</span>}
      </label>
      {children}
    </div>
  );
}

export const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 13,
  background: 'var(--bg-input)', border: '1.5px solid var(--border)',
  color: 'var(--text-primary)', outline: 'none',
};

export function DataTable({ columns, rows, emptyMsg = 'No data found' }: {
  columns: { key: string; label: string; render?: (row: any) => React.ReactNode }[];
  rows: any[]; emptyMsg?: string;
}) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map(c => (
              <th key={c.key}>{c.label.toUpperCase()}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={styles.emptyCell}>{emptyMsg}</td>
            </tr>
          ) : rows.map((row, i) => (
            <tr key={i}>
              {columns.map(c => (
                <td key={c.key}>
                  {c.render ? c.render(row) : (row[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const GRID2: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 16 };
export const GRID4: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 16 };
