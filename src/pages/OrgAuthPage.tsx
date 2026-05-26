import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import { api } from '../api';
import { Building2, GitBranch, Shield, Eye, EyeOff, ArrowLeft, Loader, ChevronDown } from 'lucide-react';

type LoginMode = 'org' | 'branch' | 'trainer';

// Normalize org/branch objects — backend may return snake_case
const normalizeOrg = (o: any) => ({
  id: o.id || o.organization_id || o.org_id || '',
  name: o.name || o.organization_name || o.org_name || 'Unknown',
  code: o.code || o.org_code || '',
});
const normalizeBranch = (b: any) => ({
  id: b.id || b.branch_id || '',
  name: b.name || b.branch_name || 'Unknown',
  code: b.code || b.branch_code || '',
});

export default function OrgAuthPage() {
  const { setUser, setPage } = useApp();
  const [mode, setMode] = useState<LoginMode>('org');
  const [orgs, setOrgs] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<1 | 2>(1); // 1=select org/branch, 2=login form

  useEffect(() => {
    api.org.publicOrgs().then(d => {
      const raw = d.organizations || d.orgs || d.data || [];
      setOrgs(raw.map(normalizeOrg));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedOrg && mode !== 'org') {
      setBranches([]);
      api.org.publicBranches(selectedOrg).then(d => {
        const raw = d.branches || d.data || [];
        setBranches(raw.map(normalizeBranch));
      }).catch(() => {});
    }
  }, [selectedOrg, mode]);

  const modeConfig = {
    org: { label: 'Organization Admin', icon: <Building2 size={18} />, color: '#6366f1', badge: 'ORGANIZATION_ADMIN' },
    branch: { label: 'Branch Manager', icon: <GitBranch size={18} />, color: '#0ea5e9', badge: 'BRANCH_MANAGER' },
    trainer: { label: 'Trainer / Coach', icon: <Shield size={18} />, color: '#f59e0b', badge: 'TRAINER' },
  };

  const cfg = modeConfig[mode];

  const handleLogin = async () => {
    setError('');
    if (!email || !password) { setError('Email and password required'); return; }
    if (mode !== 'org' && !selectedBranch) { setError('Select a branch'); return; }
    setLoading(true);
    try {
      const payload: any = { userName: email, password };
      if (selectedOrg) payload.organizationId = selectedOrg;
      if (selectedBranch) payload.branchId = selectedBranch;
      const d = await api.auth.login(email, password);
      setUser({
        userId: d.userId, userName: d.userName, token: d.accessToken,
        role: d.role, firstName: d.firstName, lastName: d.lastName,
        plan: d.plan, avatarUrl: d.avatarUrl,
        organizationId: selectedOrg || undefined,
        branchId: selectedBranch || undefined,
      });
      const rolePageMap: Record<string, string> = {
        ORGANIZATION_ADMIN: 'org-dashboard',
        BRANCH_MANAGER: 'branch-dashboard',
        TRAINER: 'trainer-dashboard',
        SUPER_ADMIN: 'super-admin',
        admin: 'super-admin',
      };
      setPage((rolePageMap[d.role] || 'dashboard') as any);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{ width: 'min(480px, 100%)' }}>
        {/* Back to landing */}
        <button onClick={() => setPage('landing')} style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 28,
          fontSize: 13, color: 'var(--text-muted)', fontWeight: 600,
        }}>
          <ArrowLeft size={15} /> Back to Home
        </button>

        {/* Card */}
        <div style={{
          background: 'var(--bg-card)', borderRadius: 24, padding: 32,
          border: '1.5px solid var(--border-strong)', boxShadow: 'var(--shadow-lg)',
        }}>
          {/* Header */}
          <div style={{ marginBottom: 28, textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, margin: '0 auto 14px',
              background: `linear-gradient(135deg, ${cfg.color}33, ${cfg.color}66)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color,
              border: `1.5px solid ${cfg.color}44`,
            }}>{cfg.icon}</div>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 6px', color: 'var(--text-primary)' }}>
              Staff Login
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
              FitPulseBot Management Portal
            </p>
          </div>

          {/* Mode tabs */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6,
            background: 'var(--metric-bg)', borderRadius: 12, padding: 4, marginBottom: 24,
          }}>
            {(Object.entries(modeConfig) as [LoginMode, typeof cfg][]).map(([key, c]) => (
              <button key={key} onClick={() => { setMode(key); setStep(1); setSelectedOrg(''); setSelectedBranch(''); setError(''); }} style={{
                padding: '8px 4px', borderRadius: 9, fontSize: 10, fontWeight: 700,
                background: mode === key ? 'var(--bg-card)' : 'transparent',
                color: mode === key ? c.color : 'var(--text-muted)',
                border: mode === key ? `1.5px solid ${c.color}44` : '1.5px solid transparent',
                boxShadow: mode === key ? 'var(--shadow-sm)' : 'none',
                cursor: 'pointer', transition: 'all 0.15s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}>
                {c.icon}
                <span>{c.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {/* Step 1: Org + Branch selection */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  Select Organization *
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={selectedOrg}
                    onChange={e => { setSelectedOrg(e.target.value); setSelectedBranch(''); }}
                    style={{
                      width: '100%', padding: '11px 40px 11px 14px', borderRadius: 10, fontSize: 14,
                      background: '#1a2d3f', border: '1.5px solid var(--border)',
                      color: '#e8f4fa', appearance: 'none', WebkitAppearance: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="" style={{ background: '#1a2d3f', color: '#83a6b8' }}>— Choose Organization —</option>
                    {orgs.map(o => (
                      <option key={o.id} value={o.id} style={{ background: '#1a2d3f', color: '#e8f4fa' }}>
                        {o.name}{o.code ? ` (${o.code})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  {orgs.length === 0 && (
                    <div style={{ position: 'absolute', right: 36, top: '50%', transform: 'translateY(-50%)' }}>
                      <Loader size={13} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)' }} />
                    </div>
                  )}
                </div>
              </div>

              {mode !== 'org' && selectedOrg && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    Select Branch *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={selectedBranch}
                      onChange={e => setSelectedBranch(e.target.value)}
                      style={{
                        width: '100%', padding: '11px 40px 11px 14px', borderRadius: 10, fontSize: 14,
                        background: '#1a2d3f', border: '1.5px solid var(--border)',
                        color: '#e8f4fa', appearance: 'none', WebkitAppearance: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="" style={{ background: '#1a2d3f', color: '#83a6b8' }}>— Choose Branch —</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id} style={{ background: '#1a2d3f', color: '#e8f4fa' }}>
                          {b.name}{b.code ? ` (${b.code})` : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    {branches.length === 0 && (
                      <div style={{ position: 'absolute', right: 36, top: '50%', transform: 'translateY(-50%)' }}>
                        <Loader size={13} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)' }} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  if (!selectedOrg) { setError('Select an organization first'); return; }
                  if (mode !== 'org' && !selectedBranch) { setError('Select a branch'); return; }
                  setError(''); setStep(2);
                }}
                style={{
                  padding: '12px', borderRadius: 11, fontWeight: 800, fontSize: 14,
                  background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc)`,
                  color: '#fff', border: 'none', cursor: 'pointer',
                }}
              >Continue →</button>

              {/* Helpful status under the button */}
              {orgs.length > 0 && !selectedOrg && (
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>
                  {orgs.length} organization{orgs.length !== 1 ? 's' : ''} available
                </p>
              )}
              {orgs.length === 0 && (
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Loader size={11} style={{ animation: 'spin 1s linear infinite' }} /> Loading organizations…
                </p>
              )}
              {error && <p style={{ color: 'var(--danger)', fontSize: 12, margin: 0, padding: '8px 12px', background: 'rgba(229,62,62,0.08)', borderRadius: 8 }}>{error}</p>}
            </div>
          )}

          {/* Step 2: Login form */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
                borderRadius: 10, background: `${cfg.color}14`, border: `1px solid ${cfg.color}33`,
              }}>
                <div style={{ color: cfg.color }}>{cfg.icon}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{cfg.badge}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {orgs.find(o => o.id === selectedOrg)?.name}
                    {selectedBranch && ` › ${branches.find(b => b.id === selectedBranch)?.name}`}
                  </div>
                </div>
                <button onClick={() => setStep(1)} style={{
                  marginLeft: 'auto', fontSize: 11, color: cfg.color, fontWeight: 700,
                }}>Change</button>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={{
                  width: '100%', padding: '11px 14px', borderRadius: 10, fontSize: 14,
                  background: 'var(--bg-input)', border: '1.5px solid var(--border)', color: 'var(--text-primary)',
                }} />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    placeholder="••••••••"
                    style={{
                      width: '100%', padding: '11px 44px 11px 14px', borderRadius: 10, fontSize: 14,
                      background: 'var(--bg-input)', border: '1.5px solid var(--border)', color: 'var(--text-primary)',
                    }}
                  />
                  <button onClick={() => setShowPw(!showPw)} style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}>{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>
              </div>

              {error && <p style={{ color: 'var(--danger)', fontSize: 12, margin: 0, padding: '8px 12px', background: 'rgba(229,62,62,0.08)', borderRadius: 8 }}>{error}</p>}

              <button onClick={handleLogin} disabled={loading} style={{
                padding: '13px', borderRadius: 11, fontWeight: 800, fontSize: 15,
                background: loading ? 'var(--metric-bg)' : `linear-gradient(135deg, ${cfg.color}, ${cfg.color}bb)`,
                color: loading ? 'var(--text-muted)' : '#fff',
                border: 'none', cursor: loading ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                {loading && <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} />}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          )}

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-muted)' }}>
            Member?{' '}
            <button onClick={() => setPage('auth')} style={{ color: 'var(--accent)', fontWeight: 700 }}>
              Use member login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
