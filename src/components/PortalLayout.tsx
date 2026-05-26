import React, { useState } from 'react';
import { useApp } from '../App';
import {
  LayoutDashboard, Building2, GitBranch, Users, UserCheck,
  CalendarCheck, TicketCheck, Dumbbell, Salad, TrendingUp,
  Palette, LogOut, Menu, X, ChevronRight, Bell, Sun, Moon,
  Shield, Ruler
} from 'lucide-react';

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
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.5)' }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: 260,
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, bottom: 0, left: 0,
        zIndex: 300,
        transform: sidebarOpen ? 'translateX(0)' : undefined,
        transition: 'transform 0.25s ease',
      }} className="portal-sidebar">
        {/* Logo area */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {logoUrl ? (
              <img src={logoUrl} alt={title} style={{
                width: 36, height: 36, borderRadius: 10, objectFit: 'cover',
                background: 'var(--bg-card)', border: '1px solid var(--border)', flexShrink: 0,
              }} onError={e => (e.currentTarget.style.display = 'none')} />
            ) : (
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `linear-gradient(135deg, ${accentColor}, var(--accent-3))`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 900, color: '#fff', flexShrink: 0,
              }}>{title[0] || 'F'}</div>
            )}
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{subtitle}</div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="portal-close-btn" style={{
              marginLeft: 'auto', display: 'none', width: 28, height: 28, borderRadius: 8,
              alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
              background: 'var(--metric-bg)',
            }}>
              <X size={15} />
            </button>
          </div>
          {roleBadge && (
            <div style={{
              marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
              background: `${roleBadgeColor}22`, color: roleBadgeColor, letterSpacing: 0.5,
            }}>
              <Shield size={9} /> {roleBadge}
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 12px' }}>
          {navItems.map(item => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { onTabChange(item.id); setSidebarOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10, marginBottom: 2,
                  background: active ? `${accentColor}22` : 'transparent',
                  color: active ? accentColor : 'var(--text-secondary)',
                  fontWeight: active ? 700 : 500, fontSize: 13,
                  border: active ? `1px solid ${accentColor}44` : '1px solid transparent',
                  textAlign: 'left', transition: 'all 0.15s ease',
                  cursor: 'pointer',
                }}
              >
                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge ? (
                  <span style={{
                    background: 'var(--danger)', color: '#fff', borderRadius: 20,
                    fontSize: 10, fontWeight: 800, padding: '1px 6px', minWidth: 18, textAlign: 'center',
                  }}>{item.badge}</span>
                ) : active && <ChevronRight size={13} />}
              </button>
            );
          })}
        </nav>

        {/* User footer */}
        <div style={{ padding: '12px 12px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: 'var(--metric-bg)' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, ${accentColor}, var(--accent-3))`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, color: '#fff',
            }}>{initials || 'U'}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.userName}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button onClick={toggleTheme} style={{
              flex: 1, padding: '8px', borderRadius: 8, fontSize: 11, fontWeight: 600,
              color: 'var(--text-muted)', background: 'var(--metric-bg)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}>
              {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
            <button onClick={requestLogout} style={{
              flex: 1, padding: '8px', borderRadius: 8, fontSize: 11, fontWeight: 600,
              color: 'var(--danger)', background: 'rgba(229,62,62,0.08)', border: '1px solid rgba(229,62,62,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}>
              <LogOut size={13} /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: 260, minWidth: 0 }} className="portal-main">
        {/* Top bar */}
        <header style={{
          height: 60, background: 'var(--nav-bg)', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', padding: '0 24px', gap: 14,
          position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(12px)',
        }}>
          <button onClick={() => setSidebarOpen(true)} className="portal-menu-btn" style={{
            display: 'none', width: 36, height: 36, borderRadius: 10,
            alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
            background: 'var(--metric-bg)', border: '1px solid var(--border)',
          }}>
            <Menu size={17} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
              {navItems.find(n => n.id === activeTab)?.label || title}
            </div>
          </div>
          <button style={{
            width: 36, height: 36, borderRadius: 10, display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
            background: 'var(--metric-bg)', border: '1px solid var(--border)',
          }}>
            <Bell size={15} />
          </button>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .portal-sidebar { transform: translateX(-100%); }
          .portal-main { margin-left: 0 !important; }
          .portal-menu-btn { display: flex !important; }
          .portal-close-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

// Shared UI building blocks
export function StatCard({ label, value, sub, icon, color = 'var(--accent)', trend }: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; color?: string; trend?: { value: number; label: string };
}) {
  return (
    <div style={{
      background: 'var(--bg-card)', borderRadius: 16, padding: '20px',
      border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, background: `${color}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color,
        }}>{icon}</div>
        {trend && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
            background: trend.value >= 0 ? 'rgba(61,191,150,0.15)' : 'rgba(229,62,62,0.15)',
            color: trend.value >= 0 ? 'var(--accent)' : 'var(--danger)',
          }}>{trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}</span>
        )}
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
      {action}
    </div>
  );
}

export function PrimaryBtn({ children, onClick, loading, danger, style: s }: {
  children: React.ReactNode; onClick?: () => void;
  loading?: boolean; danger?: boolean; style?: React.CSSProperties;
}) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      padding: '10px 18px', borderRadius: 10, fontWeight: 700, fontSize: 13,
      background: danger ? 'var(--danger)' : 'linear-gradient(135deg, var(--accent), var(--accent-3))',
      color: '#fff', border: 'none', cursor: loading ? 'wait' : 'pointer',
      opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6,
      boxShadow: danger ? '0 4px 14px rgba(229,62,62,0.25)' : 'var(--shadow-accent)',
      transition: 'all 0.15s', ...s,
    }}>
      {children}
    </button>
  );
}

export function OutlineBtn({ children, onClick, style: s }: {
  children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties;
}) {
  return (
    <button onClick={onClick} style={{
      padding: '9px 16px', borderRadius: 10, fontWeight: 600, fontSize: 13,
      background: 'transparent', color: 'var(--text-secondary)', border: '1.5px solid var(--border)',
      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s', ...s,
    }}>
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
    <span style={{
      padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
      background: s.bg, color: s.color, textTransform: 'capitalize',
    }}>{status}</span>
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
      style={{
        position: 'fixed', inset: 0, zIndex: 2000, display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 20,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: `min(${width}px, 100%)`, background: 'var(--bg-card)',
          border: '1.5px solid var(--border-strong)', borderRadius: 20,
          padding: 24, boxShadow: 'var(--shadow-lg)', maxHeight: '90vh',
          overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>{title}</h3>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
            background: 'var(--metric-bg)', border: '1px solid var(--border)',
          }}><X size={15} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function FormField({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
        {label}{required && <span style={{ color: 'var(--danger)' }}> *</span>}
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
    <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: 'var(--metric-bg)' }}>
            {columns.map(c => (
              <th key={c.key} style={{
                padding: '12px 16px', textAlign: 'left', fontWeight: 700,
                color: 'var(--text-muted)', fontSize: 11, whiteSpace: 'nowrap',
                borderBottom: '1px solid var(--border)',
              }}>{c.label.toUpperCase()}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{
                padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13,
              }}>{emptyMsg}</td>
            </tr>
          ) : rows.map((row, i) => (
            <tr key={i} style={{
              borderBottom: '1px solid var(--border)',
              background: i % 2 === 0 ? 'transparent' : 'var(--bg-subtle)',
            }}>
              {columns.map(c => (
                <td key={c.key} style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
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
