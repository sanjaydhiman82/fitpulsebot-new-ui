import React, { useCallback, useState, useEffect } from 'react';
import { useApp } from '../App';
import {
  LayoutDashboard, Users, BarChart2, Settings, LogOut,
  Sun, Moon, Menu, X, RefreshCw, TrendingUp,
  Shield, Activity, MessageSquare, Zap, DollarSign,
  Crown, Clock, Building2,
  Database, CreditCard, FlaskConical, Download, Search, Trash2, ChevronUp, ChevronRight,
  Check, Eye, Lock, Palette, Bell, Tag, BrainCircuit
} from 'lucide-react';
import { API_ORIGIN, api, apiFetch } from '../api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend, LineChart, Line } from 'recharts';
import styles from './AdminDashboard.module.css';
import SuperAdminDashboard from './SuperAdminDashboard';
import AdminLabelManagement from '../components/AdminLabelManagement';
import AdminReminderManagement from '../components/AdminReminderManagement';

type AdminTab = 'overview' | 'onboarding' | 'organizations' | 'app-functions' | 'users' | 'ai-costs' | 'reports' | 'plans' | 'labels' | 'reminders' | 'broadcast' | 'mock-data' | 'settings';

const NAV: { id: AdminTab; icon: any; label: string }[] = [
  { id: 'overview',  icon: LayoutDashboard, label: 'Dashboard'  },
  { id: 'onboarding', icon: Settings, label: 'Setup' },
  { id: 'organizations', icon: Building2, label: 'Organizations' },
  { id: 'app-functions', icon: Database, label: 'App Function' },
  { id: 'plans',     icon: CreditCard,     label: 'Plans'     },
  { id: 'labels',    icon: Tag,            label: 'Labels'    },
  { id: 'mock-data', icon: Database,        label: 'Mock Data' },
  { id: 'users',     icon: Users,          label: 'Users'     },
  { id: 'reminders', icon: Bell,           label: 'Reminders' },
  { id: 'broadcast', icon: MessageSquare,  label: 'Broadcast' },
  { id: 'reports',   icon: BarChart2,      label: 'Reports'   },
  { id: 'ai-costs',  icon: BrainCircuit,   label: 'AI Costs'  },
  { id: 'settings',  icon: Settings,       label: 'Settings'  },
];

const NAV_GROUPS: { title?: string; items: AdminTab[] }[] = [
  { items: ['overview'] },
  { title: 'Configuration', items: ['onboarding', 'organizations', 'app-functions', 'plans', 'labels', 'mock-data'] },
  { title: 'Operations', items: ['users', 'reminders', 'broadcast'] },
  { title: 'Analytics', items: ['reports', 'ai-costs'] },
  { title: 'System', items: ['settings'] },
];

export default function AdminDashboard() {
  const { user, toggleTheme, theme, requestLogout } = useApp();
  const [tab, setTab] = useState<AdminTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const logoSrc = '/coach.png';

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
        <div className={styles.sidebarTop}>
          <div className={styles.logo}>
            <img src={logoSrc} alt="" className={styles.logoImg} onError={e => (e.currentTarget.style.display = 'none')} />
            <div>
              <div className={styles.logoName}>FitPulseBot</div>
              <div className={styles.adminBadge} style={{ marginTop: 2 }}>Admin Panel</div>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={() => setSidebarOpen(false)}><X size={18} /></button>
        </div>

        <div className={styles.adminInfo}>
          <div className={styles.adminAvatar}><Shield size={18} color="#fff" /></div>
          <div>
            <div className={styles.adminName}>{user?.firstName || user?.userName || 'Admin'}</div>
            <div className={styles.adminRole}>Administrator</div>
          </div>
        </div>

        <nav className={styles.nav}>
          {NAV_GROUPS.map((group, index) => (
            <div key={group.title || `main-${index}`} className={styles.navGroup}>
              {group.title && <div className={styles.navGroupTitle}>{group.title}</div>}
              {group.items.map(id => {
                const n = NAV.find(item => item.id === id)!;
                return (
                  <button key={n.id} className={`${styles.navItem} ${tab === n.id ? styles.navActive : ''}`}
                    onClick={() => { setTab(n.id); setSidebarOpen(false); }}>
                    <n.icon size={16} /><span>{n.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <button className={styles.navItem} onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button className={styles.navItem} onClick={requestLogout}>
            <LogOut size={16} /><span>Sign Out</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <main className={styles.main}>
        <header className={styles.topbar}>
          <button className={styles.menuBtn} onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <div className={styles.topbarBrand}>
            <img src={logoSrc} alt="FitPulseBot" className={styles.topbarLogoImg} onError={e => (e.currentTarget.style.display = 'none')} />
            <div>
              <div className={styles.topbarLogoName}>FitPulseBot</div>
              <div className={styles.topbarLogoTagline}>Stay on Track,Stay in Pulse</div>
            </div>
          </div>
          <h1 className={styles.pageTitle}>{NAV.find(n => n.id === tab)?.label}</h1>
          <div className={styles.topbarRight}>
            <div className={styles.adminChip}><Shield size={12} /> Admin</div>
            <div className={styles.avatarSm}>{(user?.userName || 'A').charAt(0).toUpperCase()}</div>
          </div>
        </header>

        <div className={styles.content}>
          {tab === 'overview'  && <AdminOverview />}
          {tab === 'onboarding' && <AdminOnboarding />}
          {tab === 'organizations' && (
            <div className="admin-org-embed">
              <SuperAdminDashboard embedded />
              <style>{`
                .admin-org-embed .portal-sidebar { display: none !important; }
                .admin-org-embed .portal-main { margin-left: 0 !important; }
                .admin-org-embed .portal-main > header { display: none !important; }
                .admin-org-embed .portal-main > main { padding: 0 !important; }
              `}</style>
            </div>
          )}
          {tab === 'users'     && <AdminUsers />}
          {tab === 'app-functions' && <AdminAppFunctions />}
          {tab === 'ai-costs'  && <AdminAICosts />}
          {tab === 'reports'   && <AdminReports />}
          {tab === 'plans'     && <AdminPlans />}
          {tab === 'labels'    && <AdminLabelManagement />}
          {tab === 'reminders' && <AdminReminderManagement />}
          {tab === 'broadcast' && <AdminBroadcast />}
          {tab === 'mock-data' && <AdminMockData />}
          {tab === 'settings'  && <AdminSettings />}
        </div>
      </main>
    </div>
  );
}

/* ── Onboarding ── */
function AdminOnboarding() {
  const [step, setStep] = useState(0);
  const [orgId, setOrgId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [industries, setIndustries] = useState<Array<{ slug: string; name: string }>>([]);
  const [industry, setIndustry] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [orgForm, setOrgForm] = useState({
    name: '', code: '', contactEmail: '', contactPhone: '', line1: '', city: '', state: '', pincode: '',
    adminEmail: '', adminFirst: '', adminLast: '', adminPhone: '', adminPw: 'TempPassword@123',
  });
  const [branchForm, setBranchForm] = useState({
    name: '', code: '', contactEmail: '', contactPhone: '', line1: '', city: '', state: '', pincode: '',
    mgrEmail: '', mgrFirst: '', mgrLast: '', mgrPw: 'TempPassword@123',
  });
  const [branding, setBranding] = useState({ appName: 'FitPulseBot', primaryColor: '#3dbf96', secondaryColor: '#5bc8e0', accentColor: '#9f7aea', logoUrl: '' });

  const loadOrgs = async () => {
    const data = await api.superAdmin.listOrgs({ page: 1, pageSize: 100 });
    setOrganizations(Array.isArray(data.organizations) ? data.organizations : []);
  };
  const loadBranches = useCallback(async (id = orgId) => {
    if (!id) { setBranches([]); return; }
    const data = await api.org.listBranches(id, { page: 1, pageSize: 100 });
    setBranches(Array.isArray(data.branches) ? data.branches : []);
  }, [orgId]);

  useEffect(() => {
    Promise.all([loadOrgs(), apiFetch('/mock-data/industries')])
      .then(([, industryData]) => {
        const list = Array.isArray(industryData?.industries) ? industryData.industries : [];
        setIndustries(list);
        setIndustry(prev => prev || list[0]?.slug || '');
      })
    .catch((e: any) => setMessage(e?.message || 'Unable to load set up data.'));
  }, []);
  useEffect(() => { loadBranches(orgId).catch(() => setBranches([])); }, [orgId, loadBranches]);

  const mark = (id: string) => setCompleted(prev => ({ ...prev, [id]: true }));
  const selectedOrg = organizations.find(o => o.id === orgId);
  const selectedBranch = branches.find(b => b.id === branchId);
  const selectedIndustry = industries.find(i => i.slug === industry);

  const createOrganization = async () => {
    if (!orgForm.name || !orgForm.code || !orgForm.adminEmail) { setMessage('Organization name, code, and admin email are required.'); return; }
    setBusy('organization'); setMessage('');
    try {
      const created = await api.superAdmin.createOrg({
        organization: {
          name: orgForm.name,
          code: orgForm.code,
          contactEmail: orgForm.contactEmail,
          contactPhone: orgForm.contactPhone,
          address: { line1: orgForm.line1, city: orgForm.city, state: orgForm.state, country: 'IN', pincode: orgForm.pincode },
        },
        adminUser: {
          userName: orgForm.adminEmail,
          firstName: orgForm.adminFirst || orgForm.name,
          lastName: orgForm.adminLast,
          phone: orgForm.adminPhone,
          temporaryPassword: orgForm.adminPw,
          sendWelcome: true,
        },
      });
      await loadOrgs();
      const newId = created?.organization?.id || created?.id;
      if (newId) setOrgId(newId);
      mark('organization'); setStep(1); setMessage('Organization saved.');
    } catch (e: any) { setMessage(e?.message || 'Unable to create organization.'); }
    finally { setBusy(''); }
  };

  const createBranch = async () => {
    if (!orgId) { setMessage('Select or create an organization first.'); return; }
    if (!branchForm.name || !branchForm.code || !branchForm.mgrEmail) { setMessage('Branch name, code, and manager email are required.'); return; }
    setBusy('branches'); setMessage('');
    try {
      const created = await api.org.createBranch(orgId, {
        branch: {
          name: branchForm.name,
          code: branchForm.code,
          contactEmail: branchForm.contactEmail,
          contactPhone: branchForm.contactPhone,
          timezone: 'Asia/Kolkata',
          address: { line1: branchForm.line1, city: branchForm.city, state: branchForm.state, country: 'IN', pincode: branchForm.pincode },
        },
        managerUser: {
          userName: branchForm.mgrEmail,
          firstName: branchForm.mgrFirst || branchForm.name,
          lastName: branchForm.mgrLast,
          phone: '',
          temporaryPassword: branchForm.mgrPw,
          sendWelcome: true,
        },
      });
      await loadBranches(orgId);
      const newId = created?.branch?.id || created?.id;
      if (newId) setBranchId(newId);
      mark('branches'); setStep(2); setMessage('Branch saved.');
    } catch (e: any) { setMessage(e?.message || 'Unable to create branch.'); }
    finally { setBusy(''); }
  };

  const importLabels = async () => {
    if (!orgId || !industry) { setMessage('Select organization and industry first.'); return; }
    setBusy('labels'); setMessage('');
    try {
      const result = await api.labels.importMockIndustry(industry, { organizationId: orgId, branchId: branchId || undefined, locale: 'en' });
      mark('labels'); setStep(3); setMessage(`Imported ${result.imported || 0} labels.`);
    } catch (e: any) { setMessage(e?.message || 'Unable to import labels.'); }
    finally { setBusy(''); }
  };

  const saveBranding = async () => {
    if (!orgId) { setMessage('Select or create an organization first.'); return; }
    setBusy('branding'); setMessage('');
    try {
      await api.org.putBranding(orgId, {
        appName: branding.appName,
        logoUrl: branding.logoUrl,
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor,
        accentColor: branding.accentColor,
      });
      mark('branding'); setStep(4); setMessage('Branding saved.');
    } catch (e: any) { setMessage(e?.message || 'Unable to save branding.'); }
    finally { setBusy(''); }
  };

  const seedMockData = async () => {
    if (!orgId || !industry) { setMessage('Select organization and industry first.'); return; }
    setBusy('mockData'); setMessage('');
    try {
      await apiFetch(`/mock-data/${encodeURIComponent(industry)}/seed`, {
        method: 'POST',
        timeoutMs: 120000,
        body: JSON.stringify({ organizationId: orgId }),
      });
      mark('mockData'); setStep(5); setMessage('Mock data generated.');
    } catch (e: any) { setMessage(e?.message || 'Unable to generate mock data.'); }
    finally { setBusy(''); }
  };

  const publish = () => {
    mark('review'); mark('publish'); setStep(7); setMessage('Set up marked as published.');
  };

  const steps = [
    { id: 'organization', title: 'Organization', desc: 'Create organization details', icon: Building2 },
    { id: 'branches', title: 'Branches', desc: 'Add branches under organization', icon: Building2 },
    { id: 'labels', title: 'Labels', desc: 'Add platform labels & language', icon: Database },
    { id: 'branding', title: 'Branding', desc: 'Upload logo, colors & theme', icon: Palette },
    { id: 'mockData', title: 'Mock Data', desc: 'Generate demo data', icon: FlaskConical },
    { id: 'accessControl', title: 'Access Control', desc: 'Assign portal access', icon: Shield },
    { id: 'review', title: 'Review', desc: 'Review all information', icon: Eye },
    { id: 'publish', title: 'Publish', desc: 'Publish to live system', icon: Lock },
  ];
  const current = steps[step] || steps[0];

  const input = { minHeight: 46, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', padding: '0 12px', fontWeight: 700, width: '100%' } as React.CSSProperties;
  const label = (text: string, child: React.ReactNode) => <label style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 12, fontWeight: 800, color: 'var(--text-muted)' }}>{text}{child}</label>;
  const grid = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(180px, 1fr))', gap: 14 } as React.CSSProperties;
  const primary = { height: 44, borderRadius: 10, padding: '0 18px', background: 'var(--accent)', color: '#fff', fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: 8 } as React.CSSProperties;

  return (
    <div className={styles.page}>
      <div className={styles.rowBetween} style={{ alignItems: 'flex-start' }}>
        <div>
          <div className={styles.sectionTitle} style={{ fontSize: 28 }}>Set Up</div>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)' }}>Complete each step to set up your organization using existing admin APIs.</p>
        </div>
        <button style={{ ...primary, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} onClick={() => window.open('/organization-login', '_blank')}>
          Preview Portal <Eye size={16} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${steps.length}, 1fr)`, gap: 8, alignItems: 'start' }}>
        {steps.map((s, i) => {
          const done = !!completed[s.id];
          const active = i === step;
          return (
            <button key={s.id} onClick={() => setStep(i)} style={{ color: 'var(--text-primary)', textAlign: 'center' }}>
              <div style={{ height: 4, background: i <= step ? 'var(--accent)' : 'var(--border)', marginBottom: 10 }} />
              <div style={{ width: 42, height: 42, borderRadius: '50%', margin: '0 auto 8px', display: 'grid', placeItems: 'center', fontWeight: 900, background: done ? 'var(--accent)' : active ? '#7c3aed' : 'var(--metric-bg)', color: '#fff' }}>
                {done ? <Check size={20} /> : i + 1}
              </div>
              <div style={{ fontSize: 13, fontWeight: 900 }}>{s.title}</div>
              {s.id === 'accessControl' && <div style={{ margin: '9px auto 0', width: 'fit-content', padding: '4px 12px', borderRadius: 8, background: 'var(--accent)', color: '#fff', fontSize: 11, fontWeight: 900 }}>New</div>}
            </button>
          );
        })}
      </div>

      {message && <div className={message.toLowerCase().includes('unable') || message.toLowerCase().includes('required') ? styles.errorBanner : styles.infoCard} style={{ padding: 12 }}>{message}</div>}

      <div className={styles.infoCard}>
        <div className={styles.infoTitle}>Setup Progress</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(120px, 1fr))', gap: 12, marginBottom: 18 }}>
          {steps.map((s, i) => {
            const Icon = s.icon;
            const done = !!completed[s.id];
            const active = i === step;
            return (
              <button key={s.id} onClick={() => setStep(i)} style={{ textAlign: 'left', borderRadius: 14, border: active ? '1px solid #7c3aed' : '1px solid var(--border)', background: active ? 'rgba(124,58,237,.18)' : 'var(--metric-bg)', padding: 16, color: 'var(--text-primary)' }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: done ? 'var(--accent)' : 'rgba(159,122,234,.25)', display: 'grid', placeItems: 'center', marginBottom: 12 }}>{done ? <Check size={18} /> : <Icon size={18} />}</div>
                <div style={{ fontWeight: 900 }}>{s.title}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 5, minHeight: 34 }}>{s.desc}</div>
                <div style={{ color: done ? 'var(--accent)' : active ? '#a78bfa' : 'var(--text-muted)', fontWeight: 900, marginTop: 12 }}>{done ? 'Completed' : active ? 'In Progress' : 'Pending'}</div>
              </button>
            );
          })}
        </div>

        {current.id === 'organization' && (
          <div style={grid}>
            {label('Existing Organization', <select style={input} value={orgId} onChange={e => { setOrgId(e.target.value); if (e.target.value) mark('organization'); }}><option value="">Create new organization</option>{organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select>)}
            {label('Organization Name', <input style={input} value={orgForm.name} onChange={e => setOrgForm(p => ({ ...p, name: e.target.value }))} />)}
            {label('Organization Code', <input style={input} value={orgForm.code} onChange={e => setOrgForm(p => ({ ...p, code: e.target.value }))} />)}
            {label('Contact Email', <input style={input} value={orgForm.contactEmail} onChange={e => setOrgForm(p => ({ ...p, contactEmail: e.target.value }))} />)}
            {label('Contact Phone', <input style={input} value={orgForm.contactPhone} onChange={e => setOrgForm(p => ({ ...p, contactPhone: e.target.value }))} />)}
            {label('Address', <input style={input} value={orgForm.line1} onChange={e => setOrgForm(p => ({ ...p, line1: e.target.value }))} />)}
            {label('City', <input style={input} value={orgForm.city} onChange={e => setOrgForm(p => ({ ...p, city: e.target.value }))} />)}
            {label('State', <input style={input} value={orgForm.state} onChange={e => setOrgForm(p => ({ ...p, state: e.target.value }))} />)}
            {label('Pincode', <input style={input} value={orgForm.pincode} onChange={e => setOrgForm(p => ({ ...p, pincode: e.target.value }))} />)}
            {label('Admin Email', <input style={input} value={orgForm.adminEmail} onChange={e => setOrgForm(p => ({ ...p, adminEmail: e.target.value }))} />)}
            {label('Admin First Name', <input style={input} value={orgForm.adminFirst} onChange={e => setOrgForm(p => ({ ...p, adminFirst: e.target.value }))} />)}
            {label('Admin Last Name', <input style={input} value={orgForm.adminLast} onChange={e => setOrgForm(p => ({ ...p, adminLast: e.target.value }))} />)}
            <button style={primary} onClick={createOrganization} disabled={busy === 'organization'}>{busy === 'organization' ? 'Saving...' : 'Save Organization'}</button>
          </div>
        )}

        {current.id === 'branches' && (
          <div style={grid}>
            {label('Organization', <select style={input} value={orgId} onChange={e => setOrgId(e.target.value)}><option value="">Select organization</option>{organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select>)}
            {label('Existing Branch', <select style={input} value={branchId} onChange={e => { setBranchId(e.target.value); if (e.target.value) mark('branches'); }}><option value="">Create new branch</option>{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>)}
            {label('Branch Name', <input style={input} value={branchForm.name} onChange={e => setBranchForm(p => ({ ...p, name: e.target.value }))} />)}
            {label('Branch Code', <input style={input} value={branchForm.code} onChange={e => setBranchForm(p => ({ ...p, code: e.target.value }))} />)}
            {label('Contact Email', <input style={input} value={branchForm.contactEmail} onChange={e => setBranchForm(p => ({ ...p, contactEmail: e.target.value }))} />)}
            {label('Contact Phone', <input style={input} value={branchForm.contactPhone} onChange={e => setBranchForm(p => ({ ...p, contactPhone: e.target.value }))} />)}
            {label('Address', <input style={input} value={branchForm.line1} onChange={e => setBranchForm(p => ({ ...p, line1: e.target.value }))} />)}
            {label('City', <input style={input} value={branchForm.city} onChange={e => setBranchForm(p => ({ ...p, city: e.target.value }))} />)}
            {label('Manager Email', <input style={input} value={branchForm.mgrEmail} onChange={e => setBranchForm(p => ({ ...p, mgrEmail: e.target.value }))} />)}
            <button style={primary} onClick={createBranch} disabled={busy === 'branches'}>{busy === 'branches' ? 'Saving...' : 'Save Branch'}</button>
          </div>
        )}

        {current.id === 'labels' && (
          <div style={grid}>
            {label('Organization', <select style={input} value={orgId} onChange={e => setOrgId(e.target.value)}><option value="">Select organization</option>{organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select>)}
            {label('Branch', <select style={input} value={branchId} onChange={e => setBranchId(e.target.value)}><option value="">Organization level</option>{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>)}
            {label('Industry', <select style={input} value={industry} onChange={e => setIndustry(e.target.value)}>{industries.map(i => <option key={i.slug} value={i.slug}>{i.name}</option>)}</select>)}
            <button style={primary} onClick={importLabels} disabled={busy === 'labels'}>{busy === 'labels' ? 'Importing...' : 'Import Labels'}</button>
          </div>
        )}

        {current.id === 'branding' && (
          <div style={grid}>
            {label('App Name', <input style={input} value={branding.appName} onChange={e => setBranding(p => ({ ...p, appName: e.target.value }))} />)}
            {label('Logo URL', <input style={input} value={branding.logoUrl} onChange={e => setBranding(p => ({ ...p, logoUrl: e.target.value }))} />)}
            {label('Primary Color', <input style={input} type="color" value={branding.primaryColor} onChange={e => setBranding(p => ({ ...p, primaryColor: e.target.value }))} />)}
            {label('Secondary Color', <input style={input} type="color" value={branding.secondaryColor} onChange={e => setBranding(p => ({ ...p, secondaryColor: e.target.value }))} />)}
            {label('Accent Color', <input style={input} type="color" value={branding.accentColor} onChange={e => setBranding(p => ({ ...p, accentColor: e.target.value }))} />)}
            <button style={primary} onClick={saveBranding} disabled={busy === 'branding'}>{busy === 'branding' ? 'Saving...' : 'Save Branding'}</button>
          </div>
        )}

        {current.id === 'mockData' && (
          <div style={grid}>
            {label('Organization', <select style={input} value={orgId} onChange={e => setOrgId(e.target.value)}><option value="">Select organization</option>{organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select>)}
            {label('Industry', <select style={input} value={industry} onChange={e => setIndustry(e.target.value)}>{industries.map(i => <option key={i.slug} value={i.slug}>{i.name}</option>)}</select>)}
            <button style={primary} onClick={seedMockData} disabled={busy === 'mockData'}>{busy === 'mockData' ? 'Generating...' : 'Generate Mock Data'}</button>
          </div>
        )}

        {current.id === 'accessControl' && (
          <div>
            {!orgId && (
              <div className={styles.errorBanner} style={{ marginBottom: 14 }}>
                Select or create an organization before assigning access control.
              </div>
            )}
            <AdminAppFunctions
              embedded
              fixedOrganizationId={orgId}
              onActivity={() => {
                mark('accessControl');
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
              <button
                style={primary}
                onClick={() => {
                  mark('accessControl');
                  setStep(6);
                }}
                disabled={!orgId}
              >
                Continue to Review
              </button>
            </div>
          </div>
        )}

        {(current.id === 'review' || current.id === 'publish') && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(220px, 1fr))', gap: 14 }}>
            <div className={styles.statCard}><div className={styles.statLabel}>Organization</div><div className={styles.statValue} style={{ fontSize: 18 }}>{selectedOrg?.name || orgForm.name || 'Not selected'}</div></div>
            <div className={styles.statCard}><div className={styles.statLabel}>Branch</div><div className={styles.statValue} style={{ fontSize: 18 }}>{selectedBranch?.name || branchForm.name || 'Organization level'}</div></div>
            <div className={styles.statCard}><div className={styles.statLabel}>Industry</div><div className={styles.statValue} style={{ fontSize: 18 }}>{selectedIndustry?.name || 'Not selected'}</div></div>
            <div className={styles.statCard}><div className={styles.statLabel}>Branding</div><div className={styles.statValue} style={{ fontSize: 18 }}>{branding.appName}</div></div>
            <button style={primary} onClick={() => { mark('review'); setStep(7); }}>Mark Review Complete</button>
            <button style={{ ...primary, background: '#7c3aed' }} onClick={publish}>Publish</button>
          </div>
        )}

        <div style={{ marginTop: 18, padding: 14, borderRadius: 12, border: '1px solid rgba(91,200,224,.35)', background: 'rgba(37,99,235,.12)', color: 'var(--text-secondary)', fontSize: 13 }}>
          All actions use existing organization, branch, label, branding, mock-data, and app-function access APIs. Publish marks this set up workflow complete.
        </div>
      </div>
    </div>
  );
}

/* ── App Function ── */
function AdminAppFunctions({
  embedded = false,
  fixedOrganizationId = '',
  onActivity,
}: {
  embedded?: boolean;
  fixedOrganizationId?: string;
  onActivity?: () => void;
} = {}) {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [organizationId, setOrganizationId] = useState('');
  const [functions, setFunctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.superAdmin.listOrgs({ page: 1, pageSize: 100 })
      .then((data: any) => {
        const list = Array.isArray(data.organizations) ? data.organizations : [];
        setOrganizations(list);
        setOrganizationId(prev => fixedOrganizationId || prev || (embedded ? '' : list[0]?.id || ''));
      })
      .catch((e: any) => setMessage(e?.message || 'Unable to load organizations.'));
  }, [embedded, fixedOrganizationId]);

  useEffect(() => {
    if (fixedOrganizationId) setOrganizationId(fixedOrganizationId);
  }, [fixedOrganizationId]);

  const load = useCallback(() => {
    if (!organizationId) { setFunctions([]); return; }
    setLoading(true);
    api.appFunctions.orgList(organizationId)
      .then((data: any) => setFunctions(Array.isArray(data.functions) ? data.functions : []))
      .catch((e: any) => setMessage(e?.message || 'Unable to load app functions.'))
      .finally(() => setLoading(false));
  }, [organizationId]);

  useEffect(() => { load(); }, [load]);

  const setVisible = async (row: any, visible: boolean) => {
    if (!organizationId) { setMessage('Select organization first.'); return; }
    const id = Number(row.app_function_id);
    setBusyId(id);
    setMessage('');
    try {
      await api.appFunctions.setForOrg(organizationId, { appFunctionId: id, visibleOnUi: visible });
      setFunctions(prev => prev.map(item => Number(item.app_function_id) === id ? { ...item, visible_on_ui: visible } : item));
      setMessage(`${visible ? 'Assigned' : 'Withdrawn'} ${row.function}.`);
      onActivity?.();
    } catch (e: any) {
      setMessage(e?.message || 'Unable to update app function.');
    } finally {
      setBusyId(null);
    }
  };

  const selectedOrg = organizations.find(o => o.id === organizationId);
  const visibleRows = functions.filter(row => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [row.screen, row.function].some(v => String(v || '').toLowerCase().includes(q));
  });
  const assignedCount = functions.filter(row => row.visible_on_ui).length;
  const input = { minHeight: 46, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', padding: '0 12px', fontWeight: 700, width: '100%' } as React.CSSProperties;

  const content = (
    <>
      <div className={styles.rowBetween} style={{ alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: embedded ? 14 : undefined }}>
        <div>
          <div className={styles.sectionTitle}>{embedded ? 'Access Control' : 'App Function'}</div>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
            Assign app functions to organizations. Assign sets <code>visible_on_ui=true</code>; withdraw sets it false and hides that screen or section.
          </p>
        </div>
        <button className={styles.refreshBtn} onClick={load} title="Refresh"><RefreshCw size={15} className={loading ? styles.spinning : ''} /></button>
      </div>

      {message && <div className={message.toLowerCase().includes('unable') ? styles.errorBanner : styles.infoCard} style={{ padding: 12 }}>{message}</div>}

      <div className={styles.directoryPanel}>
        <div className={styles.filterGrid} style={{ gridTemplateColumns: 'minmax(260px, 1.2fr) minmax(220px, 1fr) repeat(2, minmax(140px, .5fr))' }}>
          <label className={styles.filterField}>
            <span>Organization</span>
            <select style={input} value={organizationId} onChange={e => setOrganizationId(e.target.value)} disabled={!!fixedOrganizationId}>
              <option value="">Select organization</option>
              {organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
            </select>
          </label>
          <label className={styles.filterField}>
            <span>Search</span>
            <input style={input} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search screen/function..." />
          </label>
          <div className={styles.statCard} style={{ padding: 12 }}>
            <div className={styles.statLabel}>Assigned</div>
            <div className={styles.statValue}>{assignedCount}</div>
          </div>
          <div className={styles.statCard} style={{ padding: 12 }}>
            <div className={styles.statLabel}>Total</div>
            <div className={styles.statValue}>{functions.length}</div>
          </div>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
          Organization ID: <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{organizationId || '-'}</span>
          {selectedOrg?.name ? <span> · {selectedOrg.name}</span> : null}
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Screen</th>
                <th>Function</th>
                <th>AI</th>
                <th>Visible on UI</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} className={styles.loadingRow}>Loading app functions...</td></tr>}
              {!loading && visibleRows.length === 0 && <tr><td colSpan={5} className={styles.loadingRow}>No app functions found.</td></tr>}
              {!loading && visibleRows.map(row => {
                const assigned = !!row.visible_on_ui;
                const id = Number(row.app_function_id);
                return (
                  <tr key={id}>
                    <td style={{ fontWeight: 800 }}>{row.screen}</td>
                    <td>{row.function}</td>
                    <td><span className={styles.roleBadge} style={{ color: row.is_ai ? '#9f7aea' : 'var(--text-muted)', background: row.is_ai ? 'rgba(159,122,234,.16)' : 'var(--metric-bg)' }}>{row.is_ai ? 'Yes' : 'No'}</span></td>
                    <td><span className={styles.roleBadge} style={{ color: assigned ? 'var(--accent)' : 'var(--text-muted)', background: assigned ? 'rgba(61,191,150,.14)' : 'var(--metric-bg)' }}>{assigned ? 'Visible' : 'Hidden'}</span></td>
                    <td>
                      <button
                        className={assigned ? styles.clearFiltersBtn : styles.exportUsersBtn}
                        disabled={busyId === id}
                        onClick={() => setVisible(row, !assigned)}
                      >
                        {busyId === id ? 'Saving...' : assigned ? 'Withdraw' : 'Assign'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  return embedded ? <div>{content}</div> : <div className={styles.page}>{content}</div>;
}

/* ── Mock Data ── */
function AdminMockData() {
  const [industries, setIndustries] = useState<Array<{ slug: string; name: string; organizationId?: string }>>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [targetOrganizationId, setTargetOrganizationId] = useState('');
  const [savedOperations, setSavedOperations] = useState<any[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState('organization');
  const [busyAction, setBusyAction] = useState<'seed' | 'revoke' | 'revert' | `saved:${string}` | null>(null);
  const [result, setResult] = useState<any>(null);
  const [selectedOperationId, setSelectedOperationId] = useState('');
  const [error, setError] = useState('');
  const [mockTab, setMockTab] = useState<'generate' | 'saved'>('saved');
  const [savedSearch, setSavedSearch] = useState('');
  const [expandedMockBranches, setExpandedMockBranches] = useState<Record<string, boolean>>({});

  const loadSavedOperations = async () => {
    const data = await apiFetch('/mock-data/saved');
    const list = Array.isArray(data?.operations) ? data.operations : [];
    setSavedOperations(list);
    return list;
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([apiFetch('/mock-data/industries'), loadSavedOperations(), api.superAdmin.listOrgs({ page: 1, pageSize: 200 })])
      .then(([data, _ops, orgData]) => {
        if (cancelled) return;
        const list = Array.isArray(data?.industries) ? data.industries : [];
        setIndustries(list);
        setOrganizations(Array.isArray(orgData?.organizations) ? orgData.organizations : []);
        setSelectedIndustry(prev => (list.length && !list.some((item: any) => item.slug === prev) ? list[0].slug : prev));
      })
      .catch((e: any) => {
        if (!cancelled) setError(e?.message || 'Unable to load mock industries.');
      });
    return () => { cancelled = true; };
  }, []);

  const runAction = async (action: 'seed' | 'revoke' | 'revert') => {
    setBusyAction(action);
    setError('');
    setResult(null);
    try {
      const path = `/mock-data/${encodeURIComponent(selectedIndustry)}/${action}`;
      const data = await apiFetch(path, {
        method: 'POST',
        timeoutMs: 120000,
        body: action === 'seed' && targetOrganizationId ? JSON.stringify({ organizationId: targetOrganizationId }) : undefined,
      });
      setResult(data);
      const operations = await loadSavedOperations();
      if (data?.operation?.id) setSelectedOperationId(data.operation.id);
      else if (operations[0]?.id) setSelectedOperationId(operations[0].id);
    } catch (e: any) {
      setError(e?.message || 'Mock data action failed.');
    } finally {
      setBusyAction(null);
    }
  };

  const revokeSavedOperation = async (operationId: string) => {
    setBusyAction(`saved:${operationId}`);
    setError('');
    try {
      const data = await apiFetch(`/mock-data/saved/${encodeURIComponent(operationId)}/revoke`, { method: 'POST', timeoutMs: 120000 });
      setResult(data);
      setSelectedOperationId('');
      await loadSavedOperations();
    } catch (e: any) {
      setError(e?.message || 'Unable to revoke saved mock operation.');
    } finally {
      setBusyAction(null);
    }
  };

  const selectedSavedOperation = savedOperations.find((item) => item.id === selectedOperationId) || null;
  const exportOperationTxt = (operation: any) => {
    const savedSummary = operation.summary || {};
    const savedOrg = savedSummary.organization || {};
    const savedBranches = Array.isArray(savedSummary.branches) ? savedSummary.branches : [];
    const savedUsers = Array.isArray(savedSummary.users) ? savedSummary.users : [];
    const lines = [
      'Mock Data Operation',
      '===================',
      `Industry: ${operation.industry_name || operation.industry_slug || '-'}`,
      `Slug: ${operation.industry_slug || '-'}`,
      `Status: ${operation.status || '-'}`,
      `Organization: ${savedOrg.name || operation.organization_id || '-'}`,
      `Organization ID: ${operation.organization_id || savedOrg.id || '-'}`,
      `Created: ${operation.created_at ? new Date(operation.created_at).toLocaleString() : '-'}`,
      `Updated: ${operation.updated_at ? new Date(operation.updated_at).toLocaleString() : '-'}`,
      '',
      'Branches',
      '--------',
      ...(savedBranches.length ? savedBranches.map((b: any, i: number) => `${i + 1}. ${b.name || '-'} (${b.code || b.id || '-'})`) : ['No branches']),
      '',
      'Users',
      '-----',
      ...(savedUsers.length ? savedUsers.map((u: any, i: number) => {
        const name = u.name || u.fullName || [u.first_name, u.last_name].filter(Boolean).join(' ') || '-';
        return `${i + 1}. ${name} | ${u.user_name || u.userName || u.username || '-'} | ${u.email || u.contact_email || u.contactEmail || '-'} | ${u.org_type || u.role || '-'} | Branch: ${u.branch_id || u.branchName || u.branch || '-'}`;
      }) : ['No users']),
      '',
      'Raw Summary',
      '-----------',
      JSON.stringify(savedSummary, null, 2),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mock-data-${operation.industry_slug || 'operation'}-${String(operation.id || '').slice(0, 8)}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };
  const detailSource = result || selectedSavedOperation;
  const org = detailSource?.organization;
  const summary = detailSource?.action === 'revoked' || detailSource?.action === 'reverted'
    ? detailSource?.removed
    : detailSource?.summary || detailSource;
  const summaryOrg = summary?.organization || org;
  const branches = Array.isArray(summary?.branches) ? summary.branches : [];
  const users = Array.isArray(summary?.users) ? summary.users : [];
  const labelImport = detailSource?.labelImport || detailSource?.label_import;
  const successMessage = result
    ? result.message || (
      result.action === 'seeded'
        ? `Mock organization industry data created: ${summaryOrg?.name || 'organization'} with ${branches.length} branch(es) and ${users.length} user(s).`
        : result.action === 'revoked'
          ? `Mock organization industry data revoked. Removed ${branches.length} branch(es) and ${users.length} user(s).`
          : result.action === 'reverted'
            ? `Mock organization industry changes reverted. Removed ${branches.length} branch(es) and ${users.length} user(s).`
            : 'Mock data operation completed.'
    )
    : '';
  const selectedIndustryName = industries.find(i => i.slug === selectedIndustry)?.name || 'Organization';
  const operationTitle = detailSource?.industry_name || detailSource?.industry || selectedIndustryName;
  const filteredOperations = savedOperations.filter((operation) => {
    if (operation.status !== 'ACTIVE') return false;
    const summary = operation.summary || {};
    const org = summary.organization || {};
    const q = savedSearch.trim().toLowerCase();
    if (!q) return true;
    return [
      operation.industry_name,
      operation.industry_slug,
      operation.organization_id,
      org.name,
      org.code,
      org.id,
    ].filter(Boolean).some((value) => String(value).toLowerCase().includes(q));
  });
  const roleBadgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 8px',
    borderRadius: 6,
    color: 'var(--accent)',
    background: 'rgba(61,191,150,.14)',
    fontSize: 11,
    fontWeight: 900,
    textTransform: 'uppercase',
  };

  return (
    <div className={styles.page}>
      <div className={styles.rowBetween}>
        <div>
          <div className={styles.sectionTitle}>Mock Data</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Create or revoke demo organization, branches, staff, and users for supported industries.
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Password: Password123$</div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}
      {successMessage && (
        <div style={{ padding: '11px 14px', borderRadius: 12, fontSize: 13, fontWeight: 700, background: 'rgba(61,191,150,.1)', border: '1px solid rgba(61,191,150,.3)', color: 'var(--accent)' }}>
          {successMessage}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {[
          ['generate', 'Generate Mock Data', FlaskConical],
          ['saved', 'Previously Saved Mock Data', Building2],
        ].map(([id, label, Icon]: any) => (
          <button
            key={id}
            type="button"
            onClick={() => setMockTab(id)}
            style={{
              minHeight: 46,
              padding: '0 22px',
              borderRadius: 10,
              border: `1px solid ${mockTab === id ? 'rgba(61,191,150,.45)' : 'var(--border)'}`,
              background: mockTab === id ? 'linear-gradient(135deg, rgba(61,191,150,.28), rgba(61,191,150,.14))' : 'var(--bg-card)',
              color: mockTab === id ? '#fff' : 'var(--text-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 14,
              fontWeight: 900,
            }}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {mockTab === 'generate' && (
        <>
      <div className={styles.infoCard}>
        <div className={styles.infoTitle}>{selectedIndustryName} Mock Data</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1fr) minmax(240px, 1fr) auto', gap: 14, alignItems: 'end', marginTop: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Industry</label>
            <select
              value={selectedIndustry}
              onChange={(e) => { setSelectedIndustry(e.target.value); setResult(null); setError(''); }}
              disabled={!!busyAction || industries.length === 0}
            >
              {industries.length === 0 ? (
                <option value="organization">Organization</option>
              ) : industries.map((industry) => (
                <option key={industry.slug} value={industry.slug}>{industry.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Assign to Organization</label>
            <select
              value={targetOrganizationId}
              onChange={(e) => setTargetOrganizationId(e.target.value)}
              disabled={!!busyAction}
            >
              <option value="">Create mock organization from seed</option>
              {organizations.map((org: any) => (
                <option key={org.id} value={org.id}>{org.name || org.code || org.id}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => runAction('seed')}
            disabled={!!busyAction}
            style={{ minHeight: 58, padding: '0 22px', borderRadius: 14, background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 900, opacity: busyAction ? .65 : 1, whiteSpace: 'nowrap' }}
          >
            {busyAction === 'seed' ? 'Creating...' : `Mock ${selectedIndustryName} Data`}
          </button>
        </div>
      </div>

      {(summaryOrg || branches.length || users.length) && (
        <div className={styles.infoCard}>
          <div className={styles.infoTitle}>{detailSource?.status ? 'Saved Operation Information' : result?.action === 'seeded' ? 'Saved Operation Information' : 'Removed Operation Information'}</div>
          {detailSource?.id && (
            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-muted)' }}>
              <span>{operationTitle}</span>
              <span>{detailSource.status}</span>
              <span>{detailSource.created_at ? new Date(detailSource.created_at).toLocaleString() : ''}</span>
            </div>
          )}
          {summaryOrg && (
            <div style={{ marginTop: 12, fontSize: 14 }}>
              <strong>{summaryOrg.name}</strong>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{summaryOrg.code || summaryOrg.id}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{summaryOrg.contact_email || summaryOrg.contactEmail || ''}</div>
            </div>
          )}
          {labelImport && (
            <div style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: 12 }}>
              Labels: {labelImport.imported ?? 0} imported
              {Array.isArray(labelImport.namespaces) && labelImport.namespaces.length ? ` (${labelImport.namespaces.join(', ')})` : ''}
            </div>
          )}
          {branches.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Branches</div>
              <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                {branches.map((b: any) => (
                  <div key={b.id || b.name} style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 10 }}>
                    <strong>{b.name}</strong>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{b.code || b.id}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {users.length > 0 && (
            <div style={{ marginTop: 18, overflowX: 'auto' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Users</div>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Branch</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u.id || u.user_name || u.userName || u.username}>
                      <td>{u.name || u.fullName || [u.first_name, u.last_name].filter(Boolean).join(' ') || '—'}</td>
                      <td>{u.user_name || u.userName || u.username || '—'}</td>
                      <td>{u.email || u.contact_email || u.contactEmail || '—'}</td>
                      <td>{u.org_type || u.role || '—'}</td>
                      <td>{u.branch_id || u.branchName || u.branch || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
        </>
      )}

      {mockTab === 'saved' && <div className={styles.infoCard}>
        <div className={styles.rowBetween} style={{ alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div className={styles.infoTitle}>Previously Saved Mock Data</div>
            <div style={{ marginTop: 4, color: 'var(--text-muted)', fontSize: 12 }}>
              View and manage previously generated mock organizations, branches and users.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                value={savedSearch}
                onChange={(e) => setSavedSearch(e.target.value)}
                placeholder="Search organizations..."
                style={{ width: 260, height: 42, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', padding: '0 14px 0 38px', fontSize: 13 }}
              />
            </div>
            <button
              type="button"
              onClick={() => loadSavedOperations().catch((e: any) => setError(e?.message || 'Unable to refresh saved operations.'))}
              disabled={!!busyAction}
              style={{ height: 42, padding: '0 16px', borderRadius: 10, background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)', fontSize: 13, fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>
        {filteredOperations.length === 0 ? (
          <div style={{ marginTop: 14, color: 'var(--text-muted)', fontSize: 13 }}>No saved mock operations yet.</div>
        ) : (
          <div style={{ marginTop: 22, display: 'grid', gap: 16 }}>
            {filteredOperations.map((operation, index) => {
              const savedSummary = operation.summary || {};
              const savedOrg = savedSummary.organization || {};
              const savedBranches = Array.isArray(savedSummary.branches) ? savedSummary.branches : [];
              const savedUsers = Array.isArray(savedSummary.users) ? savedSummary.users : [];
              const isSelected = operation.id === selectedOperationId;
              const isBusy = busyAction === `saved:${operation.id}`;
              const orgName = savedOrg.name || operation.industry_name || 'Mock Organization';
              const orgCode = savedOrg.code || savedOrg.id || operation.organization_id || '—';
              return (
                <div key={operation.id} style={{ border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', background: 'linear-gradient(135deg, var(--bg-surface), rgba(91,200,224,.035))', boxShadow: '0 12px 28px rgba(0,0,0,.12)' }}>
                  <div style={{ padding: 16, display: 'grid', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center', minWidth: 0 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 9, background: 'rgba(159,122,234,.22)', color: '#9f7aea', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <Building2 size={22} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: 16, color: 'var(--text-primary)' }}>{index + 1}. {orgName}</strong>
                          <span style={{ padding: '3px 10px', borderRadius: 99, background: 'rgba(61,191,150,.14)', color: 'var(--accent)', fontSize: 11, fontWeight: 900 }}>{operation.status || 'ACTIVE'}</span>
                        </div>
                        <div style={{ marginTop: 5, color: 'var(--text-muted)', fontSize: 12 }}>
                          Organization ID: {orgCode} <span style={{ opacity: .55, margin: '0 7px' }}>•</span> Created On: {operation.created_at ? new Date(operation.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <span style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 13 }}>{savedBranches.length} Branches</span>
                      <span style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 13 }}>{savedUsers.length} Users</span>
                      <button type="button" onClick={() => revokeSavedOperation(operation.id)} disabled={operation.status !== 'ACTIVE' || !!busyAction} style={{ height: 38, padding: '0 16px', borderRadius: 8, background: 'rgba(239,68,68,.08)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,.55)', fontSize: 13, fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: 8, opacity: operation.status !== 'ACTIVE' || busyAction ? .55 : 1 }}>
                        <Trash2 size={14} /> {isBusy ? 'Revoking...' : 'Revoke Mock Data'}
                      </button>
                      <button type="button" onClick={() => exportOperationTxt(operation)} style={{ width: 38, height: 38, borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text-secondary)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center' }} title="Export .txt">
                        <Download size={14} />
                      </button>
                      <button type="button" onClick={() => { setSelectedOperationId(isSelected ? '' : operation.id); setResult(null); }} style={{ width: 38, height: 38, borderRadius: 8, background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center' }}>
                        {isSelected ? <ChevronUp size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </div>
                  </div>

                  {isSelected && (
                    <>
                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8 }}>Organization Details</div>
                        <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                          <table className={styles.table}>
                            <thead><tr><th>Type</th><th>Name</th><th>ID</th><th>Role</th></tr></thead>
                            <tbody>
                              <tr>
                                <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Building2 size={15} /> Organization</span></td>
                                <td>{orgName}</td>
                                <td>{orgCode}</td>
                                <td><span style={roleBadgeStyle}>Organization Admin</span></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div style={{ overflowX: 'auto' }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8 }}>Branches ({savedBranches.length})</div>
                        <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                          <table className={styles.table}>
                            <thead><tr><th>Branch Name</th><th>Branch ID</th><th>Role</th><th>Users</th><th>Resources</th><th /></tr></thead>
                            <tbody>
                              {savedBranches.flatMap((b: any) => {
                                const branchKeys = [b.id, b.branch_id, b.branchId, b.code, b.name].filter(Boolean).map((value) => String(value).toLowerCase());
                                const branchUsers = savedUsers.filter((u: any) => {
                                  const userBranchKeys = [u.branch_id, u.branchId, u.branch, u.branchName, u.branch_code, u.branchCode].filter(Boolean).map((value) => String(value).toLowerCase());
                                  return userBranchKeys.some((key) => branchKeys.includes(key));
                                });
                                const resources = branchUsers.filter((u: any) => String(u.org_type || u.role || '').toUpperCase().includes('RESOURCE')).length;
                                const clients = branchUsers.filter((u: any) => String(u.org_type || u.role || '').toUpperCase().includes('CLIENT')).length;
                                const branchId = b.id || b.branch_id || b.branchId || b.code || b.name;
                                const userRows = branchUsers.length ? branchUsers : [];
                                const branchExpandKey = `${operation.id}:${branchId}`;
                                const branchExpanded = !!expandedMockBranches[branchExpandKey];
                                return [
                                  <tr key={`${branchId}-branch`}>
                                    <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Building2 size={15} /> {b.name || 'Branch'}</span></td>
                                    <td>{b.code || branchId}</td>
                                    <td><span style={roleBadgeStyle}>Branch Manager</span></td>
                                    <td>{clients || branchUsers.length} Users</td>
                                    <td>{resources} Resources</td>
                                    <td style={{ textAlign: 'right' }}>
                                      <button
                                        type="button"
                                        onClick={() => setExpandedMockBranches(prev => ({ ...prev, [branchExpandKey]: !prev[branchExpandKey] }))}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 9px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-secondary)', fontSize: 11, fontWeight: 900 }}
                                      >
                                        {branchExpanded ? 'Hide Users' : 'Show Users'} {branchExpanded ? <ChevronUp size={14} /> : <ChevronRight size={14} />}
                                      </button>
                                    </td>
                                  </tr>,
                                  branchExpanded ? <tr key={`${branchId}-users`}>
                                    <td colSpan={6} style={{ background: 'rgba(255,255,255,.018)', padding: 0 }}>
                                      <div style={{ padding: '12px 18px 14px 42px' }}>
                                        <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Branch Users</div>
                                        {userRows.length ? (
                                          <div style={{ border: '1px solid var(--border)', borderRadius: 9, overflow: 'hidden' }}>
                                            <table className={styles.table}>
                                              <thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th></tr></thead>
                                              <tbody>
                                                {userRows.map((u: any) => {
                                                  const name = u.name || u.fullName || [u.first_name, u.last_name].filter(Boolean).join(' ') || '—';
                                                  return (
                                                    <tr key={u.id || u.user_name || u.userName || u.username}>
                                                      <td>{name}</td>
                                                      <td>{u.user_name || u.userName || u.username || '—'}</td>
                                                      <td>{u.email || u.contact_email || u.contactEmail || '—'}</td>
                                                      <td>{u.phone || u.contact_phone || u.contactPhone || '—'}</td>
                                                      <td><span style={roleBadgeStyle}>{u.org_type || u.role || '—'}</span></td>
                                                      <td>{u.status || '—'}</td>
                                                    </tr>
                                                  );
                                                })}
                                              </tbody>
                                            </table>
                                          </div>
                                        ) : (
                                          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No users saved for this branch.</div>
                                        )}
                                      </div>
                                    </td>
                                  </tr> : null,
                                ].filter(Boolean);
                              })}
                              {!savedBranches.length && <tr><td colSpan={6} className={styles.loadingRow}>No branches saved.</td></tr>}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>}
    </div>
  );
}

/* ── Overview ── */
function AdminOverview() {
  const [users, setUsers]     = useState<any[]>([]);
  const [logs, setLogs]       = useState<any[]>([]);
  const [orgs, setOrgs]       = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [rangeDays, setRangeDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError('');
      try {
        const [costLogsRes, orgsRes] = await Promise.all([
          api.admin.getAppCostLogs().catch(() => []),
          api.superAdmin.listOrgs({ page: 1, pageSize: 100 }).catch(() => ({ organizations: [] })),
        ]);
        setLogs(Array.isArray(costLogsRes) ? costLogsRes : []);
        setOrgs(Array.isArray(orgsRes?.organizations) ? orgsRes.organizations : []);
      } catch (e: any) {
        setError(e.message || 'Unable to load overview data.');
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true); setError('');
      try {
        const pageSize = 100;
        const params = { page: 1, pageSize, ...(selectedOrg ? { organizationId: selectedOrg } : {}) };
        const firstUsersRes = await api.admin.listUsers(params);
        const firstUsers = Array.isArray(firstUsersRes?.users) ? firstUsersRes.users : [];
        const total = Number(firstUsersRes?.total || firstUsers.length);
        const totalPages = Math.ceil(total / pageSize);
        const morePages = totalPages > 1
          ? await Promise.all(Array.from({ length: totalPages - 1 }, (_, i) =>
              api.admin.listUsers({ page: i + 2, pageSize, ...(selectedOrg ? { organizationId: selectedOrg } : {}) }).catch(() => ({ users: [] }))
            ))
          : [];
        setUsers([
          ...firstUsers,
          ...morePages.flatMap((r: any) => Array.isArray(r?.users) ? r.users : []),
        ]);
      } catch (e: any) {
        setError(e.message || 'Unable to load overview users.');
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, [selectedOrg]);

  const now       = Date.now();
  const dayMs     = 86400000;
  const rangeMs   = rangeDays * dayMs;
  const rangeLabel = rangeDays === 1 ? '1 Day' : rangeDays < 30 ? `${rangeDays} Days` : rangeDays === 30 ? '1 Month' : rangeDays === 90 ? '3 Months' : '6 Months';
  const userIds = new Set(users.map((u: any) => String(u.id || u.userId || u.user_id)).filter(Boolean));
  const scopedLogs = selectedOrg
    ? logs.filter((l: any) => userIds.has(String(l.userId || l.user_id || l.user?.id || '')))
    : logs;
  const rangeLogs = scopedLogs.filter((l: any) => l.createdAt && now - new Date(l.createdAt).getTime() < rangeMs);

  // ── User counters ──
  const totalUsers    = users.length;
  const totalOrgs     = orgs.length;
  const activeOrgs    = orgs.filter(o => o.status === 'active').length;
  const activeUsers   = users.filter(u => u.status === 'active').length;
  const inactiveUsers = users.filter(u => u.status !== 'active').length;
  const paidUsers     = users.filter(u => ['Pro', 'Elite'].includes(u.plan)).length;
  const eliteUsers    = users.filter(u => u.plan === 'Elite').length;
  const proUsers      = users.filter(u => u.plan === 'Pro').length;
  const freeUsers     = users.filter(u => u.plan === 'Start' || !u.plan).length;
  const newUsers7d    = users.filter(u => u.createdAt && now - new Date(u.createdAt).getTime() < rangeMs).length;
  const convRate      = totalUsers > 0 ? ((paidUsers / totalUsers) * 100).toFixed(1) : '0';
  const activeRate    = totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : '0';

  // ── AI / cost counters ──
  const aiSpend7d      = rangeLogs.reduce((a, l) => a + (l.chargesInRs || 0), 0);
  const totalTokens    = rangeLogs.reduce((a, l) => a + (l.inputToken || 0) + (l.outputToken || 0), 0);
  const avgCostPerCall = rangeLogs.length ? (rangeLogs.reduce((a, l) => a + (l.chargesInRs || 0), 0) / rangeLogs.length) : 0;
  const visibleOrgs = selectedOrg ? orgs.filter((o: any) => o.id === selectedOrg) : orgs;
  const orgHealthRows = visibleOrgs.slice(0, 6).map((org: any) => {
    const clients = org.memberCount ?? org.member_count ?? 0;
    const resources = org.resourceCount ?? org.resource_count ?? 0;
    const branches = org.branchCount ?? org.branch_count ?? 0;
    const score = Math.min(100, Math.round((org.status === 'active' ? 45 : 10) + Math.min(clients, 40) + Math.min(branches * 5, 15)));
    return { ...org, clients, resources, branches, score };
  });

  // ── Daily signups for selected range ──
  const signupByDay: Record<string, number> = {};
  const chartDays = Math.min(rangeDays, 30);
  for (let i = chartDays - 1; i >= 0; i--) {
    const d = new Date(now - i * dayMs);
    signupByDay[d.toISOString().slice(5, 10)] = 0;
  }
  users.forEach(u => {
    if (!u.createdAt) return;
    const key = new Date(u.createdAt).toISOString().slice(5, 10);
    if (key in signupByDay) signupByDay[key]++;
  });
  const signupTrend = Object.entries(signupByDay).map(([date, count]) => ({ date, count }));
  const growthTrend = signupTrend.map((point, index) => {
    const denom = Math.max(signupTrend.length, 1);
    const pointDate = now - (signupTrend.length - 1 - index) * dayMs;
    const logsToPoint = rangeLogs.filter((l: any) => l.createdAt && new Date(l.createdAt).getTime() <= pointDate);
    return {
      date: point.date,
      users: users.filter(u => u.createdAt && new Date(u.createdAt).getTime() <= pointDate).length,
      aiCalls: logsToPoint.length || Math.round((rangeLogs.length / denom) * (index + 1)),
      revenue: Number((logsToPoint.reduce((a, l) => a + (l.chargesInRs || 0), 0) || ((aiSpend7d / denom) * (index + 1))).toFixed(2)),
    };
  });
  const sparkTrend = growthTrend.map((point, index) => ({
    date: point.date,
    organizations: Math.max(0, totalOrgs - 6 + index),
    activeUsers: Math.max(0, activeUsers - 18 + index * 3),
    revenue: point.revenue,
    aiUsage: point.aiCalls,
  }));

  // ── Recently joined users (last 5) ──
  const recentUsers = [...users]
    .filter(u => u.createdAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const planDonut = [
    { name: 'Start Plan', value: freeUsers, color: '#3dbf96' },
    { name: 'Pro Plan', value: proUsers, color: '#2f80ed' },
    { name: 'Elite Plan', value: eliteUsers, color: '#f59e0b' },
  ].filter(item => item.value > 0);

  const tt = { contentStyle: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, color: 'var(--text-primary)' } };

  // ── Counter cards config ──
  const primaryCards = [
    { label: 'Organizations', value: totalOrgs.toLocaleString(), icon: Building2, color: '#3dbf96', sub: 'Total Organizations', foot: `${Math.max(activeOrgs, 0)} active`, trendKey: 'organizations' },
    { label: 'Active Users', value: activeUsers.toLocaleString(), icon: Users, color: '#2f80ed', sub: 'Active Users', foot: `${activeRate}% of total users`, trendKey: 'activeUsers' },
    { label: `Revenue (${rangeLabel})`, value: `₹${aiSpend7d.toFixed(2)}`, icon: DollarSign, color: '#9f7aea', sub: 'Total Revenue', foot: `₹${aiSpend7d.toFixed(2)} in selected range`, trendKey: 'revenue' },
    { label: `AI Usage (${rangeLabel})`, value: rangeLogs.length.toLocaleString(), icon: Activity, color: '#f59e0b', sub: 'AI Calls', foot: `${totalTokens > 1000 ? `${(totalTokens / 1000).toFixed(1)}k` : totalTokens} Tokens Used`, trendKey: 'aiUsage' },
  ];
  const dateRange = (() => {
    const end = new Date(now);
    const start = new Date(now - (rangeDays - 1) * dayMs);
    const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    return `${start.toLocaleDateString('en-IN', opts)} – ${end.toLocaleDateString('en-IN', opts)}`;
  })();

  return (
    <div className={styles.page}>
      <div className={styles.rowBetween} style={{ alignItems: 'flex-start', gap: 16 }}>
        <div>
          <div className={styles.sectionTitle}>Overview</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>Real-time overview of your platform performance</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <select value={selectedOrg} onChange={(e) => setSelectedOrg(e.target.value)} style={{ width: 210, minHeight: 42, fontSize: 13, fontWeight: 800 }}>
            <option value="">All Organizations</option>
            {orgs.map((org: any) => <option key={org.id} value={org.id}>{org.name}</option>)}
          </select>
          {[
            ['1D', 1],
            ['7D', 7],
            ['1M', 30],
            ['3M', 90],
            ['6M', 180],
          ].map(([range, days]) => (
            <button key={range} type="button" onClick={() => setRangeDays(Number(days))} style={{ minWidth: 46, height: 40, borderRadius: 10, border: '1px solid var(--border)', background: rangeDays === days ? 'linear-gradient(135deg, rgba(61,191,150,.85), rgba(61,191,150,.42))' : 'var(--bg-card)', color: rangeDays === days ? '#fff' : 'var(--text-secondary)', fontWeight: 800 }}>
              {range}
            </button>
          ))}
          <button type="button" style={{ width: 42, height: 40, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-secondary)', display: 'grid', placeItems: 'center' }}>
            <Clock size={16} />
          </button>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.35 }}>
            <strong style={{ color: 'var(--text-primary)' }}>{rangeLabel}</strong><br />{dateRange}
          </div>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* Primary counters */}
      <div className={styles.statsGrid}>
        {primaryCards.map(c => (
          <div key={c.label} className={styles.statCard} style={{ minHeight: 150, position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
              <div className={styles.statIcon} style={{ background: c.color + '20', width: 48, height: 48, borderRadius: '50%' }}>
                <c.icon size={22} color={c.color} />
              </div>
              <div>
                <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 800 }}>{c.label}</div>
                <div className={styles.statValue} style={{ color: 'var(--text-primary)', fontSize: 28, marginTop: 10 }}>{loading ? '…' : c.value}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.sub}</div>
                <div style={{ fontSize: 12, color: c.color, marginTop: 14, fontWeight: 800 }}>{c.foot}</div>
              </div>
            </div>
            <div style={{ position: 'absolute', right: 14, bottom: 14, width: 118, height: 54, opacity: .95 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkTrend}>
                  <defs>
                    <linearGradient id={`spark-${c.trendKey}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c.color} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={c.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey={c.trendKey} stroke={c.color} strokeWidth={2} fill={`url(#spark-${c.trendKey})`} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 16 }}>
          <div className={styles.infoCard}>
            <div className={styles.rowBetween} style={{ marginBottom: 12 }}>
              <div className={styles.infoTitle} style={{ marginBottom: 0 }}>Growth Overview</div>
              <select value={rangeDays} onChange={(e) => setRangeDays(Number(e.target.value))} style={{ minHeight: 36, width: 110, fontSize: 12, fontWeight: 800 }}>
                <option value={1}>1 Day</option>
                <option value={7}>7 Days</option>
                <option value={30}>1 Month</option>
                <option value={90}>3 Months</option>
                <option value={180}>6 Months</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 22, marginBottom: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <span style={{ color: '#3dbf96', fontWeight: 800 }}>● Users</span>
              <span style={{ color: '#2f80ed', fontWeight: 800 }}>● AI Calls</span>
              <span style={{ color: '#f59e0b', fontWeight: 800 }}>● Revenue (₹)</span>
            </div>
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={growthTrend}>
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#f59e0b', fontSize: 11, fontWeight: 800 }} axisLine={false} tickLine={false} />
                <Tooltip {...tt} />
                <Line yAxisId="left" type="monotone" dataKey="users" stroke="#3dbf96" strokeWidth={2.4} dot={{ r: 3 }} />
                <Line yAxisId="left" type="monotone" dataKey="aiCalls" stroke="#2f80ed" strokeWidth={2.4} dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2.4} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.rowBetween}>
              <div className={styles.infoTitle} style={{ marginBottom: 0 }}>Organization Health</div>
              <button style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 900 }}>View All</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className={styles.table}>
                <thead><tr><th>Organization</th><th>Users</th><th>Active %</th><th>AI Calls</th><th>Revenue</th><th>Health</th></tr></thead>
                <tbody>
                  {orgHealthRows.map((o: any) => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 700 }}>{o.name}</td>
                      <td>{o.clients}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <strong style={{ color: o.score >= 75 ? 'var(--accent)' : o.score >= 50 ? '#f59e0b' : 'var(--danger)' }}>{o.score}%</strong>
                          <span style={{ width: 72, height: 6, borderRadius: 99, background: 'rgba(255,255,255,.06)', overflow: 'hidden' }}>
                            <span style={{ display: 'block', width: `${o.score}%`, height: '100%', background: o.score >= 75 ? 'var(--accent)' : o.score >= 50 ? '#f59e0b' : 'var(--danger)' }} />
                          </span>
                        </div>
                      </td>
                      <td>{Math.round(rangeLogs.length / Math.max(visibleOrgs.length, 1))}</td>
                      <td>₹{(aiSpend7d / Math.max(totalOrgs, 1)).toFixed(2)}</td>
                      <td>
                        <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 99, fontWeight: 800, color: o.score >= 75 ? 'var(--accent)' : o.score >= 50 ? '#f59e0b' : 'var(--danger)', background: o.score >= 75 ? 'rgba(61,191,150,.13)' : o.score >= 50 ? 'rgba(245,158,11,.13)' : 'rgba(239,68,68,.12)' }}>
                          {o.score >= 75 ? 'Healthy' : o.score >= 50 ? 'Attention' : 'At Risk'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {orgHealthRows.length > 0 && (
                    <tr>
                      <td style={{ fontWeight: 900 }}>Total</td>
                      <td style={{ fontWeight: 900 }}>{totalUsers}</td>
                      <td style={{ fontWeight: 900 }}>{activeRate}%</td>
                      <td style={{ fontWeight: 900 }}>{rangeLogs.length}</td>
                      <td style={{ fontWeight: 900 }}>₹{aiSpend7d.toFixed(2)}</td>
                      <td />
                    </tr>
                  )}
                  {!orgHealthRows.length && <tr><td colSpan={6} style={{ color: 'var(--text-muted)' }}>No organizations found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: '.78fr 1.05fr .95fr', gap: 16 }}>
          <div className={styles.infoCard} style={{ flex: 1 }}>
            <div className={styles.infoTitle}>Plan Distribution</div>
            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 18, alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={planDonut.length ? planDonut : [{ name: 'No Users', value: 1, color: '#25384a' }]} innerRadius={54} outerRadius={78} paddingAngle={2} dataKey="value">
                    {(planDonut.length ? planDonut : [{ color: '#25384a' }]).map((entry: any, index: number) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip {...tt} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'grid', gap: 12 }}>
                {planDonut.map((item) => (
                  <div key={item.name} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}><b style={{ color: item.color, marginRight: 8 }}>●</b>{item.name}</span>
                    <strong>{item.value} ({totalUsers ? ((item.value / totalUsers) * 100).toFixed(1) : '0'}%)</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.infoCard} style={{ flex: 1 }}>
            <div className={styles.infoTitle}>Conversion & Engagement</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(120px, 1fr))', gap: 12 }}>
              {[
                { label: 'Conversion Rate', value: `${convRate}%`, sub: 'Users upgraded', color: '#9f7aea', foot: '↑ 12.4% vs previous 7 days' },
                { label: 'Active Rate', value: `${activeRate}%`, sub: 'Users are active', color: '#3dbf96', foot: '↑ 5.1% vs previous 7 days' },
                { label: 'Inactive Users', value: inactiveUsers.toLocaleString(), sub: inactiveUsers ? 'Needs attention' : 'No inactive users', color: inactiveUsers ? '#e53e3e' : '#3dbf96', foot: inactiveUsers ? 'Review engagement' : 'Great Engagement!' },
              ].map(item => (
                <div key={item.label} style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 14, minHeight: 120 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 800 }}>{item.label}</div>
                  <div style={{ color: 'var(--text-primary)', fontSize: 26, fontWeight: 900, marginTop: 10 }}>{item.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.sub}</div>
                  <div style={{ fontSize: 11, color: item.color, marginTop: 14, fontWeight: 800 }}>{item.foot}</div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.infoCard} style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div className={styles.statIcon} style={{ background: 'rgba(159,122,234,.18)' }}><Zap size={20} color="#9f7aea" /></div>
              <div className={styles.infoTitle} style={{ marginBottom: 0 }}>AI Cost Analytics <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>({rangeLabel})</span></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                ['AI Spend', `₹${aiSpend7d.toFixed(2)}`],
                ['AI Calls', rangeLogs.length.toLocaleString()],
                ['Tokens Used', `${totalTokens > 1000 ? `${(totalTokens / 1000).toFixed(1)}k` : totalTokens}`],
                ['Cost / Call', `₹${avgCostPerCall.toFixed(2)}`],
                ['Cost / User', `₹${(aiSpend7d / Math.max(totalUsers, 1)).toFixed(2)}`],
              ].map(([label, value]) => (
                <div key={label} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 800 }}>{label}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', marginTop: 6 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recently joined */}
      {!loading && recentUsers.length > 0 && (
        <div className={styles.chartsRow}>
        <div className={styles.infoCard}>
          <div className={styles.infoTitle} style={{ marginBottom: 14 }}>Recent Activity</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {recentUsers.map((u, i) => (
              <div key={u.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0',
                borderBottom: i < recentUsers.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: `hsl(${(u.userName?.charCodeAt(0) || 0) * 37 % 360}, 60%, 50%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0,
                }}>
                  {(u.userName || '?').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.userName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                    {u.signupSrc || u.signup_src || 'site'} · {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </div>
                </div>
                <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 99, fontWeight: 700, flexShrink: 0,
                  color: u.plan === 'Elite' ? '#f59e0b' : u.plan === 'Pro' ? '#3dbf96' : 'var(--text-muted)',
                  background: u.plan === 'Elite' ? '#f59e0b18' : u.plan === 'Pro' ? '#3dbf9618' : 'var(--metric-bg)',
                  border: '1px solid var(--border)',
                }}>
                  {u.plan || 'Start'}
                </span>
                <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 99, fontWeight: 700, flexShrink: 0,
                  color: u.status === 'active' ? 'var(--accent)' : 'var(--text-muted)',
                  background: u.status === 'active' ? 'rgba(61,191,150,.12)' : 'var(--metric-bg)',
                  border: '1px solid var(--border)',
                }}>
                  {u.status || 'active'}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.infoCard}>
          <div className={styles.infoTitle} style={{ marginBottom: 14 }}>Alerts & Insights</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              inactiveUsers ? `${inactiveUsers} inactive users need re-engagement` : 'Great: 100% of visible users are active',
              rangeLogs.length === 0 ? `No AI usage in the selected ${rangeLabel.toLowerCase()}` : `${rangeLogs.length} AI calls in the selected ${rangeLabel.toLowerCase()}`,
              newUsers7d ? `${newUsers7d} new users joined this week` : 'No new users joined this week',
              activeOrgs < totalOrgs ? `${totalOrgs - activeOrgs} organizations are not active` : 'All organizations are active',
            ].map((msg, i) => (
              <div key={msg} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: i === 0 && inactiveUsers ? 'rgba(239,68,68,.16)' : 'rgba(61,191,150,.16)', color: i === 0 && inactiveUsers ? 'var(--danger)' : 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>{i + 1}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{msg}</div>
              </div>
            ))}
          </div>
        </div>
        </div>
      )}
    </div>
  );
}

/* ── Users ── */
function AdminUsers() {
  const { user: adminUser } = useApp();
  const [users, setUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [filterRole, setFilterRole] = useState('');
  const [filterOrg, setFilterOrg] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [creditUser, setCreditUser] = useState<{ id: string; name: string } | null>(null);

  // Load ALL users once for charts, paginated users for table
  const loadAll = async () => {
    try {
      const first = await api.admin.listUsers({ page: 1, pageSize: 100 });
      const all = Array.isArray(first?.users) ? [...first.users] : [];
      const totalCount = Number(first?.total || all.length);
      const pages = Math.ceil(totalCount / 100);
      if (pages > 1) {
        const more = await Promise.all(
          Array.from({ length: pages - 1 }, (_, i) =>
            api.admin.listUsers({ page: i + 2, pageSize: 100 }).catch(() => ({ users: [] }))
          )
        );
        more.forEach((r: any) => all.push(...(r?.users || [])));
      }
      setAllUsers(all);
    } catch (_) {}
  };

  const loadOrganizations = async () => {
    try {
      const pageSize = 200;
      const first = await api.superAdmin.listOrgs({ page: 1, pageSize });
      const all = Array.isArray(first?.organizations) ? [...first.organizations] : [];
      const totalCount = Number(first?.total || all.length);
      const pages = Math.ceil(totalCount / pageSize);
      if (pages > 1) {
        const more = await Promise.all(
          Array.from({ length: pages - 1 }, (_, i) =>
            api.superAdmin.listOrgs({ page: i + 2, pageSize }).catch(() => ({ organizations: [] }))
          )
        );
        more.forEach((res: any) => all.push(...(res?.organizations || [])));
      }
      setOrganizations(all);
    } catch (_) {
      setOrganizations([]);
    }
  };

  const load = async (p = page) => {
    setLoading(true); setError('');
    try {
      const res = await api.admin.listUsers({
        page: p, pageSize,
        ...(filterOrg    ? { organizationId: filterOrg } : {}),
        ...(filterBranch ? { branchId: filterBranch }    : {}),
        ...(filterRole   ? { role: filterRole, type: filterRole } : {}),
        ...(filterPlan   ? { plan: filterPlan }          : {}),
        ...(filterStatus ? { status: filterStatus }      : {}),
      });
      setUsers(res.users || []);
      setTotal(res.total || 0);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  useEffect(() => { loadAll(); loadOrganizations(); }, []);
  useEffect(() => {
    setFilterBranch('');
    setBranches([]);
    if (!filterOrg) return;
    setLoadingBranches(true);
    api.org.listBranches(filterOrg, { page: 1, pageSize: 200 })
      .then(res => setBranches(Array.isArray(res?.branches) ? res.branches : []))
      .catch(() => setBranches([]))
      .finally(() => setLoadingBranches(false));
  }, [filterOrg]);
  useEffect(() => { load(1); setPage(1); }, [filterOrg, filterBranch, filterRole, filterPlan, filterStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPages = Math.ceil(total / pageSize);
  const handlePage = (p: number) => { setPage(p); load(p); };

  // ── Status toggle ──
  const handleStatusChange = async (userId: string, newStatus: 'active' | 'inactive' | 'banned') => {
    setActioningId(userId); setActionMsg('');
    try {
      await api.admin.updateUserStatus(userId, newStatus);
      setActionMsg(`User ${newStatus === 'active' ? 'activated' : newStatus === 'banned' ? 'banned' : 'deactivated'} successfully.`);
      // Optimistically update local state
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (e: any) {
      setActionMsg(`Error: ${e.message}`);
    }
    setActioningId(null);
    setTimeout(() => setActionMsg(''), 4000);
  };

  const PLANS    = ['', 'Start', 'Pro', 'Elite'];
  const STATUSES = ['', 'active', 'inactive', 'suspended', 'banned'];
  const roleLabel = (role: string) => role
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
  const roleOptions = Array.from(new Set([
    ...allUsers.map(u => u.role).filter(Boolean),
    'CLIENT', 'RESOURCE', 'BRANCH_MANAGER', 'ORGANIZATION_ADMIN', 'SUPER_ADMIN',
  ])).sort();
  const activeFilterCount = [filterOrg, filterBranch, filterRole, filterPlan, filterStatus].filter(Boolean).length;
  const currentUserFilters = () => ({
    ...(filterOrg    ? { organizationId: filterOrg } : {}),
    ...(filterBranch ? { branchId: filterBranch }    : {}),
    ...(filterRole   ? { role: filterRole, type: filterRole } : {}),
    ...(filterPlan   ? { plan: filterPlan }          : {}),
    ...(filterStatus ? { status: filterStatus }      : {}),
  });
  const excelCell = (value: any) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const userField = (u: any, keys: string[]) => keys.map(k => u?.[k]).find(v => v !== undefined && v !== null && v !== '') || '';
  const orgNameForUser = (u: any) => {
    const direct = userField(u, ['organizationName', 'organization_name', 'orgName', 'org_name', 'organization']);
    if (direct) return direct;
    const id = userField(u, ['organizationId', 'organization_id', 'orgId', 'org_id']);
    return organizations.find(org => org.id === id)?.name || id || '';
  };
  const branchNameForUser = (u: any) => {
    const direct = userField(u, ['branchName', 'branch_name', 'branch']);
    if (direct) return direct;
    const id = userField(u, ['branchId', 'branch_id']);
    return branches.find(branch => branch.id === id)?.name || id || '';
  };
  const clearFilters = () => {
    setFilterOrg('');
    setFilterBranch('');
    setFilterRole('');
    setFilterPlan('');
    setFilterStatus('');
  };
  const exportFilteredUsers = async () => {
    setExporting(true);
    setError('');
    try {
      const first = await api.admin.listUsers({ page: 1, pageSize: 500, ...currentUserFilters() });
      const rows = Array.isArray(first?.users) ? [...first.users] : [];
      const exportTotal = Number(first?.total || rows.length);
      const pages = Math.ceil(exportTotal / 500);
      if (pages > 1) {
        const more = await Promise.all(
          Array.from({ length: pages - 1 }, (_, i) =>
            api.admin.listUsers({ page: i + 2, pageSize: 500, ...currentUserFilters() }).catch(() => ({ users: [] }))
          )
        );
        more.forEach((res: any) => rows.push(...(res?.users || [])));
      }
      const headings = ['Username', 'Organization', 'Branch', 'Type', 'Plan', 'Status', 'Created'];
      const body = rows.map(u => [
        u.userName || u.email || '',
        orgNameForUser(u),
        branchNameForUser(u),
        u.role ? roleLabel(u.role) : '',
        u.plan || '',
        u.status || '',
        u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
      ]);
      const html = `<!doctype html><html><head><meta charset="utf-8" /></head><body><table><thead><tr>${headings.map(h => `<th>${excelCell(h)}</th>`).join('')}</tr></thead><tbody>${body.map(row => `<tr>${row.map(cell => `<td>${excelCell(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`;
      const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `filtered-users-${stamp}.xls`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message || 'Unable to export filtered users.');
    } finally {
      setExporting(false);
    }
  };

  // ── Chart data derived from allUsers ──
  const PIE_COLORS = ['#3dbf96', '#5bc8e0', '#9f7aea', '#ed8936', '#e53e3e', '#f59e0b'];

  const planData = ['Start', 'Pro', 'Elite'].map(plan => ({
    name: plan,
    value: allUsers.filter(u => u.plan === plan).length,
  })).filter(d => d.value > 0);

  const roleData = roleOptions.map(role => ({
    name: roleLabel(role),
    value: allUsers.filter(u => u.role === role).length,
  })).filter(d => d.value > 0);

  const statusData = ['active', 'inactive', 'suspended', 'banned'].map(s => ({
    name: s.charAt(0).toUpperCase() + s.slice(1),
    value: allUsers.filter(u => u.status === s).length,
  })).filter(d => d.value > 0);

  const srcData = ['site', 'google', 'telegram'].map(s => ({
    name: s.charAt(0).toUpperCase() + s.slice(1),
    value: allUsers.filter(u => u.signupSrc === s || u.signup_src === s).length,
  })).filter(d => d.value > 0);

  // New users per week (last 8 weeks)
  const weeklyMap: Record<string, number> = {};
  allUsers.forEach(u => {
    if (!u.createdAt) return;
    const d = new Date(u.createdAt);
    const week = `W${getWeekNumber(d)} '${String(d.getFullYear()).slice(2)}`;
    weeklyMap[week] = (weeklyMap[week] || 0) + 1;
  });
  const weeklyData = Object.entries(weeklyMap).slice(-8).map(([week, count]) => ({ week, count }));

  const tt = { contentStyle: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, color: 'var(--text-primary)' } };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    if (percent < 0.06) return null;
    const RADIAN = Math.PI / 180;
    const r = innerRadius + (outerRadius - innerRadius) * 0.55;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.rowBetween}>
        <div>
          <div className={styles.sectionTitle}>Client Management</div>
          {allUsers.length > 0 && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{allUsers.length} total users</div>}
        </div>
        <button className={styles.refreshBtn} onClick={() => { loadAll(); load(page); }}>
          <RefreshCw size={14} className={loading ? styles.spinning : ''} />
        </button>
      </div>

      {/* ── Pie charts row ── */}
      {allUsers.length > 0 && (
        <div className={styles.clientChartsRow}>

          {/* Plan distribution */}
          <div className={styles.infoCard} style={{ flex: 1, minWidth: 200 }}>
            <div className={styles.infoTitle}>Plan Distribution</div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={planData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={68} paddingAngle={3} labelLine={false} label={renderCustomLabel}>
                  {planData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip {...tt} formatter={(v: any, name: any) => [v, name]} />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Status distribution */}
          <div className={styles.infoCard} style={{ flex: 1, minWidth: 200 }}>
            <div className={styles.infoTitle}>Client Status</div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={68} paddingAngle={3} labelLine={false} label={renderCustomLabel}>
                  {statusData.map((_, i) => <Cell key={i} fill={['#3dbf96', '#ed8936', '#e53e3e', '#9f7aea'][i % 4]} />)}
                </Pie>
                <Tooltip {...tt} />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Signup source */}
          <div className={styles.infoCard} style={{ flex: 1, minWidth: 200 }}>
            <div className={styles.infoTitle}>Signup Source</div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={srcData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={68} paddingAngle={3} labelLine={false} label={renderCustomLabel}>
                  {srcData.map((_, i) => <Cell key={i} fill={['#5bc8e0', '#3dbf96', '#9f7aea'][i % 3]} />)}
                </Pie>
                <Tooltip {...tt} />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Role distribution */}
          <div className={styles.infoCard} style={{ flex: 1, minWidth: 200 }}>
            <div className={styles.infoTitle}>Role Breakdown</div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={68} paddingAngle={3} labelLine={false} label={renderCustomLabel}>
                  {roleData.map((_, i) => <Cell key={i} fill={['#3dbf96', '#9f7aea'][i % 2]} />)}
                </Pie>
                <Tooltip {...tt} />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

        </div>
      )}

      {/* Weekly signups bar chart */}
      {weeklyData.length > 1 && (
        <div className={styles.infoCard}>
          <div className={styles.infoTitle}>Weekly New Signups</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weeklyData} barSize={28}>
              <XAxis dataKey="week" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip {...tt} formatter={(v: any) => [v, 'New Users']} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {weeklyData.map((_, i) => <Cell key={i} fill={i === weeklyData.length - 1 ? '#3dbf96' : '#5bc8e040'} stroke={i === weeklyData.length - 1 ? '#3dbf96' : '#5bc8e0'} strokeWidth={1} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className={styles.directoryPanel}>
        {/* Filters */}
        <div className={styles.filterPanel}>
          <div className={styles.filterHeader}>
            <div>
              <div className={styles.filterTitle}>Client Directory Filters</div>
              <div className={styles.filterSubtitle}>Refine users by organization, branch, type, plan, and status.</div>
            </div>
            {activeFilterCount > 0 && (
              <button type="button" className={styles.clearFiltersBtn} onClick={clearFilters}>
                Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
              </button>
            )}
            <button type="button" className={styles.exportUsersBtn} onClick={exportFilteredUsers} disabled={exporting || loading}>
              <Download size={13} />
              {exporting ? 'Exporting...' : 'Export Excel'}
            </button>
          </div>
          <div className={styles.filterGrid}>
            <label className={styles.filterField}>
              <span>Organization</span>
              <select value={filterOrg} onChange={e => setFilterOrg(e.target.value)}>
                <option value="">All Organizations</option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>{org.name || org.code || org.id}</option>
                ))}
              </select>
            </label>
            <label className={styles.filterField}>
              <span>Branch</span>
              <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} disabled={!filterOrg || loadingBranches}>
                <option value="">{filterOrg ? (loadingBranches ? 'Loading branches...' : 'All Branches') : 'Select organization first'}</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.name || branch.code || branch.id}</option>
                ))}
              </select>
            </label>
            <label className={styles.filterField}>
              <span>Type</span>
              <select value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                <option value="">All Types</option>
                {roleOptions.map(role => (
                  <option key={role} value={role}>{roleLabel(role)}</option>
                ))}
              </select>
            </label>
            <label className={styles.filterField}>
              <span>Plan</span>
              <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)}>
                {PLANS.map(p => <option key={p} value={p}>{p || 'All Plans'}</option>)}
              </select>
            </label>
            <label className={styles.filterField}>
              <span>Status</span>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{s ? roleLabel(s) : 'All Statuses'}</option>)}
              </select>
            </label>
          </div>
        </div>

        {actionMsg && (
          <div style={{
            padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
            background: actionMsg.startsWith('Error') ? 'rgba(239,68,68,.1)' : 'rgba(61,191,150,.1)',
            border: `1px solid ${actionMsg.startsWith('Error') ? 'rgba(239,68,68,.3)' : 'rgba(61,191,150,.3)'}`,
            color: actionMsg.startsWith('Error') ? 'var(--danger)' : 'var(--accent)',
          }}>{actionMsg}</div>
        )}

        {error && <div className={styles.errorBanner}>{error}</div>}
        {loading && <div className={styles.loadingRow}>Loading users…</div>}

        {/* Table */}
        {!loading && users.length > 0 && (
          <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => {
                const isSelf   = u.id === adminUser?.userId;
                const isActive = u.status === 'active';
                const isBanned = u.status === 'banned';
                const busy     = actioningId === u.id;
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.userName}</div>
                      {u.id && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' }}>{u.id.slice(0, 18)}…</div>}
                    </td>
                    <td>
                      <span className={styles.roleBadge} style={{
                        color: u.role === 'admin' ? '#9f7aea' : 'var(--accent)',
                        background: (u.role === 'admin' ? '#9f7aea' : 'var(--accent)') + '18',
                      }}>
                        {u.role ? roleLabel(u.role) : '—'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{u.plan || '—'}</td>
                    <td>
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 700,
                        color: isActive ? 'var(--accent)' : isBanned ? 'var(--danger)' : 'var(--text-muted)',
                        background: isActive ? 'rgba(61,191,150,.15)' : isBanned ? 'rgba(239,68,68,.12)' : 'var(--metric-bg)',
                        border: '1px solid var(--border)',
                      }}>
                        {u.status || '—'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setCreditUser({ id: u.id, name: u.userName || u.email || 'User' })}
                          className={styles.creditActionBtn}
                          title={`View credits for ${u.userName || 'user'}`}
                        >
                          <CreditCard size={13} />
                          Credits
                        </button>
                        {isSelf ? (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>You</span>
                        ) : (
                          <>
                          {/* Activate */}
                          {!isActive && (
                            <button
                              disabled={busy}
                              onClick={() => handleStatusChange(u.id, 'active')}
                              style={{
                                padding: '4px 11px', borderRadius: 7, fontSize: 11, fontWeight: 700,
                                background: busy ? 'var(--bg-input)' : 'rgba(61,191,150,.15)',
                                color: busy ? 'var(--text-muted)' : 'var(--accent)',
                                border: '1px solid rgba(61,191,150,.35)',
                                cursor: busy ? 'not-allowed' : 'pointer',
                                whiteSpace: 'nowrap', transition: 'all 150ms',
                              }}
                            >
                              {busy ? '…' : '✓ Activate'}
                            </button>
                          )}
                          {/* Deactivate */}
                          {isActive && (
                            <button
                              disabled={busy}
                              onClick={() => handleStatusChange(u.id, 'inactive')}
                              style={{
                                padding: '4px 11px', borderRadius: 7, fontSize: 11, fontWeight: 700,
                                background: busy ? 'var(--bg-input)' : 'rgba(245,158,11,.12)',
                                color: busy ? 'var(--text-muted)' : '#f59e0b',
                                border: '1px solid rgba(245,158,11,.3)',
                                cursor: busy ? 'not-allowed' : 'pointer',
                                whiteSpace: 'nowrap', transition: 'all 150ms',
                              }}
                            >
                              {busy ? '…' : '⏸ Deactivate'}
                            </button>
                          )}
                          {/* Ban */}
                          {!isBanned && (
                            <button
                              disabled={busy}
                              onClick={() => {
                                if (window.confirm(`Ban user "${u.userName}"? They won't be able to log in.`)) {
                                  handleStatusChange(u.id, 'banned');
                                }
                              }}
                              style={{
                                padding: '4px 11px', borderRadius: 7, fontSize: 11, fontWeight: 700,
                                background: busy ? 'var(--bg-input)' : 'rgba(239,68,68,.1)',
                                color: busy ? 'var(--text-muted)' : 'var(--danger)',
                                border: '1px solid rgba(239,68,68,.25)',
                                cursor: busy ? 'not-allowed' : 'pointer',
                                whiteSpace: 'nowrap', transition: 'all 150ms',
                              }}
                            >
                              {busy ? '…' : '⛔ Ban'}
                            </button>
                          )}
                          {/* Unban (if banned) */}
                          {isBanned && (
                            <button
                              disabled={busy}
                              onClick={() => handleStatusChange(u.id, 'active')}
                              style={{
                                padding: '4px 11px', borderRadius: 7, fontSize: 11, fontWeight: 700,
                                background: busy ? 'var(--bg-input)' : 'rgba(61,191,150,.15)',
                                color: busy ? 'var(--text-muted)' : 'var(--accent)',
                                border: '1px solid rgba(61,191,150,.35)',
                                cursor: busy ? 'not-allowed' : 'pointer',
                                whiteSpace: 'nowrap', transition: 'all 150ms',
                              }}
                            >
                              {busy ? '…' : '↩ Unban'}
                            </button>
                          )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}

        {!loading && users.length === 0 && !error && (
          <div className={styles.emptyCard}>
            <Users size={32} color="var(--text-muted)" />
            <div style={{ marginTop: 10, color: 'var(--text-muted)', fontSize: 14 }}>No users found for the selected filters.</div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => handlePage(page - 1)} disabled={page <= 1}
            style={{ padding: '7px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, opacity: page <= 1 ? 0.4 : 1, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>
            ← Prev
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const p = i + 1;
            return (
              <button key={p} onClick={() => handlePage(p)}
                style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid var(--border)', background: page === p ? 'var(--accent)' : 'var(--bg-input)', color: page === p ? '#fff' : 'var(--text-primary)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                {p}
              </button>
            );
          })}
          {totalPages > 7 && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>… {totalPages}</span>}
          <button onClick={() => handlePage(page + 1)} disabled={page >= totalPages}
            style={{ padding: '7px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, opacity: page >= totalPages ? 0.4 : 1, cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}>
            Next →
          </button>
          </div>
        )}
      </div>
      {/* Credit Usage Drawer */}
      {creditUser && (
        <UserCreditDrawer userId={creditUser.id} userName={creditUser.name} onClose={() => setCreditUser(null)} />
      )}
    </div>
  );
}


/* ── UserCreditDrawer ── */
function UserCreditDrawer({ userId, userName, onClose }: { userId: string; userName: string; onClose: () => void }) {
  const [logs, setLogs]       = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [breakdown, setBreakdown] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [sortDesc, setSortDesc]     = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [creditLogsRes, allCostLogsRes, creditRes, breakdownRes] = await Promise.all([
          api.admin.getUserCredits(userId).catch(() => []),
          api.admin.getAppCostLogs().catch(() => []),
          api.admin.getUserCreditBalance(userId).catch(() => null),
          api.admin.getUserCreditBreakdown(userId).catch(() => null),
        ]);

        const aiCreditLogs = (Array.isArray(creditLogsRes) ? creditLogsRes : []).map((l: any) => ({
          ...l,
          analysisType: l.action || 'AI-CREDIT',
          analysisOutcome: l.action || 'Credit used',
          createdAt: l.usedAt || l.createdAt,
          inputToken: 0,
          outputToken: 0,
          chargesInRs: 0,
          source: 'credit',
        }));

        const costLogs = (Array.isArray(allCostLogsRes) ? allCostLogsRes : [])
          .filter((l: any) => String(l.userId) === String(userId))
          .map((l: any) => ({ ...l, source: 'cost' }));

        const seen = new Set<string>();
        const userLogs = [...aiCreditLogs, ...costLogs].filter((l: any) => {
          const key = `${l.source}-${l.id ?? ''}-${l.createdAt ?? l.usedAt ?? ''}-${l.credit ?? ''}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        setLogs(userLogs);
        setSummary(creditRes?.data ?? creditRes);
        setBreakdown(breakdownRes?.data ?? breakdownRes);
      } catch {}
      setLoading(false);
    };
    load();
  }, [userId]);

  const TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
    'IMAGE-ANALYSIS':   { label: 'Image Analysis', color: '#5bc8e0', bg: 'rgba(91,200,224,.12)' },
    'AI-COACH-INSIGHT': { label: 'Coach Insight',  color: '#9f7aea', bg: 'rgba(159,122,234,.12)' },
    'AI-CREDIT':        { label: 'AI Credit',      color: '#3dbf96', bg: 'rgba(61,191,150,.12)' },
  };
  const getMeta = (t: string) => TYPE_META[t] ?? { label: t, color: 'var(--text-muted)', bg: 'var(--metric-bg)' };

  const allTypes = Array.from(new Set(logs.map((l: any) => l.analysisType).filter(Boolean)));

  const filtered = logs
    .filter((l: any) => typeFilter === 'ALL' || l.analysisType === typeFilter)
    .sort((a: any, b: any) => sortDesc
      ? new Date(b.createdAt || b.usedAt).getTime() - new Date(a.createdAt || a.usedAt).getTime()
      : new Date(a.createdAt || a.usedAt).getTime() - new Date(b.createdAt || b.usedAt).getTime()
    );

  const totalCredit = filtered.reduce((s: number, l: any) => s + (l.credit || 0), 0);
  const totalRs     = filtered.reduce((s: number, l: any) => s + (l.chargesInRs || 0), 0);
  const totalIn     = filtered.reduce((s: number, l: any) => s + (l.inputToken || 0), 0);
  const totalOut    = filtered.reduce((s: number, l: any) => s + (l.outputToken || 0), 0);
  const breakdownItems = Array.isArray(breakdown?.items) ? breakdown.items : [];
  const breakdownCredit = breakdownItems.reduce((s: number, item: any) => s + (Number(item.creditUsed) || 0), 0);
  const summaryAllocated = Number(summary?.allocatedCredit);
  const summaryAvailable = Number(summary?.availableCredit);
  const breakdownAllocated = Number(breakdown?.allocatedCredit);
  const breakdownAvailable = Number(breakdown?.availableCredit);
  const allocatedCredit = Number.isFinite(summaryAllocated) && summaryAllocated > 0 ? summaryAllocated : Number.isFinite(breakdownAllocated) ? breakdownAllocated : 0;
  const availableCredit = Number.isFinite(summaryAvailable) ? summaryAvailable : Number.isFinite(breakdownAvailable) ? breakdownAvailable : 0;
  const summaryUsedCredit = Math.max(0, allocatedCredit - availableCredit);
  const consolidatedUsedCredit = Number(breakdown?.usedCredit) > 0 ? Number(breakdown.usedCredit) : breakdownCredit || summaryUsedCredit;
  const consolidatedCalls = Number(breakdown?.totalCalls) || breakdownItems.reduce((s: number, item: any) => s + (Number(item.calls) || 0), 0);
  const consolidatedRs = Number(breakdown?.totalChargesInRs) || breakdownItems.reduce((s: number, item: any) => s + (Number(item.chargesInRs) || 0), 0);

  const usedCredit  = +consolidatedUsedCredit.toFixed(4);
  const usedPct     = allocatedCredit > 0
    ? Math.min(100, Math.round((usedCredit / allocatedCredit) * 100))
    : 0;

  const barColor = usedPct >= 90 ? '#e53e3e' : usedPct >= 60 ? '#ed8936' : '#3dbf96';

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000 }}
      />
      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(680px, 100vw)',
        background: 'var(--bg-card)', borderLeft: '1px solid var(--border)',
        zIndex: 1001, display: 'flex', flexDirection: 'column', overflowY: 'auto',
        boxShadow: '-8px 0 32px rgba(0,0,0,.25)',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>💳 Credit Usage</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{userName}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20, lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {loading && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>}

          {!loading && (
            <>
              {/* Summary cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {[
                  { label: 'Allocated',  value: allocatedCredit.toFixed(2), color: '#5bc8e0' },
                  { label: 'Used',       value: usedCredit.toFixed(2), color: '#ed8936' },
                  { label: 'Remaining',  value: availableCredit.toFixed(2), color: '#3dbf96' },
                  { label: 'AI Calls',   value: String(consolidatedCalls || logs.length || 0), color: '#9f7aea' },
                ].map(c => (
                  <div key={c.label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: c.color }}>{c.value}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginTop: 2 }}>{c.label}</div>
                  </div>
                ))}
              </div>

              {/* Usage bar */}
              {allocatedCredit > 0 && (
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                    <span>{usedCredit?.toFixed(2)} used ({usedPct}%)</span>
                    <span>{availableCredit.toFixed(2)} remaining</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--metric-bg)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${usedPct}%`, background: barColor, borderRadius: 99, transition: 'width .6s' }} />
                  </div>
                </div>
              )}

              {breakdownItems.length > 0 && (
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>Consolidated Credit Spent</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#ed8936' }}>
                      {consolidatedUsedCredit.toFixed(2)} credits · ₹{consolidatedRs.toFixed(4)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {breakdownItems.map((item: any) => (
                      <div key={item.analysisType} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, alignItems: 'center', fontSize: 12 }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{item.label || getMeta(item.analysisType).label}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{item.calls || 0} calls</span>
                        <span style={{ color: '#ed8936', fontWeight: 800 }}>{Number(item.creditUsed || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Filters */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 12 }}>
                  <option value="ALL">All Types</option>
                  {allTypes.map((t: any) => <option key={t} value={t}>{getMeta(t).label}</option>)}
                </select>
                <button onClick={() => setSortDesc(s => !s)}
                  style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 12, cursor: 'pointer' }}>
                  {sortDesc ? '↓ Newest' : '↑ Oldest'}
                </button>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                  {filtered.length} records · ₹{totalRs.toFixed(4)} · {totalCredit.toFixed(2)} credits
                </span>
              </div>

              {/* Table */}
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0', fontSize: 13 }}>No AI credit transactions found</div>
              ) : (
                <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-surface)' }}>
                        {['Date & Time', 'AI Feature', 'Action', 'Tokens', 'Credit', 'Cost (₹)'].map(h => (
                          <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((l: any, i: number) => {
                        const meta = getMeta(l.analysisType);
                        return (
                          <tr key={l.id ?? i} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '8px 12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                              {l.createdAt || l.usedAt ? new Date(l.createdAt || l.usedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, color: meta.color, background: meta.bg }}>{meta.label}</span>
                            </td>
                            <td style={{ padding: '8px 12px', color: 'var(--text-secondary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.analysisOutcome}>{l.analysisOutcome || '—'}</td>
                            <td style={{ padding: '8px 12px', color: 'var(--text-muted)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                              {(l.inputToken || 0).toLocaleString()} / {(l.outputToken || 0).toLocaleString()}
                            </td>
                            <td style={{ padding: '8px 12px', fontWeight: 700, color: '#ed8936', textAlign: 'right' }}>{(l.credit || 0).toFixed(2)}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>₹{(l.chargesInRs || 0).toFixed(4)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: 'var(--bg-surface)', fontWeight: 800 }}>
                        <td colSpan={3} style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: 11 }}>Total ({filtered.length} rows)</td>
                        <td style={{ padding: '8px 12px', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 11, whiteSpace: 'nowrap' }}>{totalIn.toLocaleString()} / {totalOut.toLocaleString()}</td>
                        <td style={{ padding: '8px 12px', color: '#ed8936', textAlign: 'right' }}>{totalCredit.toFixed(2)}</td>
                        <td style={{ padding: '8px 12px', color: '#3dbf96', textAlign: 'right' }}>₹{totalRs.toFixed(4)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date as any) - (yearStart as any)) / 86400000 + 1) / 7);
}

/* ── AI Costs ── */
function AdminAICosts() {
  const today = new Date().toISOString().slice(0, 10);

  const [allLogs, setAllLogs]       = useState<any[]>([]);
  const [allCredits, setAllCredits] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [orgUsers, setOrgUsers] = useState<any[]>([]);
  const [loadingOrgUsers, setLoadingOrgUsers] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [innerTab, setInnerTab]     = useState<'logs' | 'credits'>('logs');
  const [search, setSearch]         = useState('');

  // ── Date range filters ──
  const [preset, setPreset]     = useState<'today' | '7d' | '30d' | 'custom'>('30d');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Compute effective from/to from preset
  const getRange = () => {
    const now = new Date();
    const iso  = (d: Date) => d.toISOString().slice(0, 10);
    if (preset === 'today')  return { from: today,                          to: today };
    if (preset === '7d')     return { from: iso(new Date(now.getTime() - 6 * 86400000)), to: today };
    if (preset === '30d')    return { from: iso(new Date(now.getTime() - 29 * 86400000)), to: today };
    return { from: dateFrom, to: dateTo };
  };

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [logsRes, creditsRes] = await Promise.all([
        api.admin.getAppCostLogs().catch(() => []),
        api.admin.listAICredits().catch(() => []),
      ]);
      setAllLogs(Array.isArray(logsRes) ? logsRes : []);
      setAllCredits(Array.isArray(creditsRes) ? creditsRes : []);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const loadOrganizations = async () => {
    try {
      const pageSize = 200;
      const first = await api.superAdmin.listOrgs({ page: 1, pageSize });
      const all = Array.isArray(first?.organizations) ? [...first.organizations] : [];
      const totalCount = Number(first?.total || all.length);
      const pages = Math.ceil(totalCount / pageSize);
      if (pages > 1) {
        const more = await Promise.all(
          Array.from({ length: pages - 1 }, (_, i) =>
            api.superAdmin.listOrgs({ page: i + 2, pageSize }).catch(() => ({ organizations: [] }))
          )
        );
        more.forEach((res: any) => all.push(...(res?.organizations || [])));
      }
      setOrganizations(all);
    } catch (_) {
      setOrganizations([]);
    }
  };

  const loadOrgUsers = async (organizationId: string) => {
    if (!organizationId) {
      setOrgUsers([]);
      return;
    }
    setOrgUsers([]);
    setLoadingOrgUsers(true);
    try {
      const pageSize = 500;
      const first = await api.admin.listUsers({ page: 1, pageSize, organizationId });
      const all = Array.isArray(first?.users) ? [...first.users] : [];
      const totalCount = Number(first?.total || all.length);
      const pages = Math.ceil(totalCount / pageSize);
      if (pages > 1) {
        const more = await Promise.all(
          Array.from({ length: pages - 1 }, (_, i) =>
            api.admin.listUsers({ page: i + 2, pageSize, organizationId }).catch(() => ({ users: [] }))
          )
        );
        more.forEach((res: any) => all.push(...(res?.users || [])));
      }
      setOrgUsers(all);
    } catch (_) {
      setOrgUsers([]);
    } finally {
      setLoadingOrgUsers(false);
    }
  };

  useEffect(() => { load(); loadOrganizations(); }, []);
  useEffect(() => { loadOrgUsers(selectedOrg); }, [selectedOrg]);

  // ── Apply date + type + search filters ──
  const { from, to } = getRange();
  const val = (row: any, ...keys: string[]) => {
    for (const key of keys) {
      if (row?.[key] !== undefined && row?.[key] !== null) return row[key];
    }
    return undefined;
  };
  const userIdOf = (row: any) => String(val(row, 'userId', 'user_id', 'userid') || '');
  const createdAtOf = (row: any) => val(row, 'createdAt', 'created_at', 'createdat');
  const usedAtOf = (row: any) => val(row, 'usedAt', 'used_at', 'createdAt', 'created_at');
  const analysisTypeOf = (row: any) => String(val(row, 'analysisType', 'analysis_type', 'analysistype') || '');
  const analysisOutcomeOf = (row: any) => String(val(row, 'analysisOutcome', 'analysis_outcome', 'analysisoutcome') || '');
  const num = (row: any, ...keys: string[]) => Number(val(row, ...keys) || 0);

  const inRange = (dateStr: any) => {
    if (!dateStr) return false;
    const d = String(dateStr).slice(0, 10);
    if (from && d < from) return false;
    if (to   && d > to)   return false;
    return true;
  };

  const orgUserIds = new Set(orgUsers.map(u => String(u.id || u.userId || u.user_id)).filter(Boolean));
  const selectedOrgName = organizations.find(o => o.id === selectedOrg)?.name || 'All Organizations';
  const orgScopedLogs = selectedOrg ? allLogs.filter(l => orgUserIds.has(userIdOf(l))) : allLogs;
  const orgScopedCredits = selectedOrg ? allCredits.filter(l => orgUserIds.has(userIdOf(l))) : allCredits;

  const logs = orgScopedLogs.filter(l => {
    if (!inRange(createdAtOf(l))) return false;
    if (typeFilter && analysisTypeOf(l) !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        analysisTypeOf(l).toLowerCase().includes(q) ||
        analysisOutcomeOf(l).toLowerCase().includes(q) ||
        userIdOf(l).toLowerCase().includes(q)
      );
    }
    return true;
  });

  const credits = orgScopedCredits.filter(l => inRange(usedAtOf(l)));

  // ── All unique analysis types for filter dropdown ──
  const allTypes = Array.from(new Set(orgScopedLogs.map(l => analysisTypeOf(l)).filter(Boolean))).sort();

  // ── Aggregates from filtered logs ──
  const totalRs      = logs.reduce((a, l) => a + num(l, 'chargesInRs', 'charges_in_rs', 'chargesinrs'), 0);
  const totalUsd     = logs.reduce((a, l) => a + num(l, 'chargesInDollar', 'charges_in_dollar', 'chargesindollar'), 0);
  const totalIn      = logs.reduce((a, l) => a + num(l, 'inputToken', 'input_token', 'inputtoken'), 0);
  const totalOut     = logs.reduce((a, l) => a + num(l, 'outputToken', 'output_token', 'outputtoken'), 0);
  const totalCred    = logs.reduce((a, l) => a + num(l, 'credit'), 0);
  const avgCost      = logs.length ? totalRs / logs.length : 0;

  // ── Per-type breakdown (filtered) ──
  const byType: Record<string, { count: number; rs: number; usd: number; tokens: number }> = {};
  logs.forEach(l => {
    const t = analysisTypeOf(l) || 'Unknown';
    if (!byType[t]) byType[t] = { count: 0, rs: 0, usd: 0, tokens: 0 };
    byType[t].count++;
    byType[t].rs     += num(l, 'chargesInRs', 'charges_in_rs', 'chargesinrs');
    byType[t].usd    += num(l, 'chargesInDollar', 'charges_in_dollar', 'chargesindollar');
    byType[t].tokens += num(l, 'inputToken', 'input_token', 'inputtoken') + num(l, 'outputToken', 'output_token', 'outputtoken');
  });
  const typeData = Object.entries(byType)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.rs - a.rs);

  // ── Daily cost trend within selected range ──
  const dailyMap: Record<string, { rs: number; calls: number }> = {};
  if (from && to) {
    let cur = new Date(from);
    const end = new Date(to);
    while (cur <= end) {
      dailyMap[cur.toISOString().slice(0, 10)] = { rs: 0, calls: 0 };
      cur = new Date(cur.getTime() + 86400000);
    }
  }
  logs.forEach(l => {
    const d = String(createdAtOf(l) || '').slice(0, 10);
    if (d && dailyMap[d] !== undefined) {
      dailyMap[d].rs    += num(l, 'chargesInRs', 'charges_in_rs', 'chargesinrs');
      dailyMap[d].calls += 1;
    }
  });
  const dailyData = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date: date.slice(5), rs: +v.rs.toFixed(4), calls: v.calls }));

  // ── Per-user cost (filtered) ──
  const byUser: Record<string, { count: number; rs: number }> = {};
  logs.forEach(l => {
    const rawUserId = userIdOf(l);
    const u = rawUserId ? `${rawUserId.slice(0, 10)}…` : 'Unknown';
    if (!byUser[u]) byUser[u] = { count: 0, rs: 0 };
    byUser[u].count++;
    byUser[u].rs += num(l, 'chargesInRs', 'charges_in_rs', 'chargesinrs');
  });
  const userData = Object.entries(byUser)
    .map(([userId, v]) => ({ userId, ...v }))
    .sort((a, b) => b.rs - a.rs)
    .slice(0, 10);

  const PIE_COLORS = ['#3dbf96', '#5bc8e0', '#9f7aea', '#ed8936', '#e53e3e', '#f59e0b'];
  const tt = { contentStyle: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, color: 'var(--text-primary)' } };

  const btnStyle = (active: boolean) => ({
    height: 46, minHeight: 46, padding: '0 15px', borderRadius: 10, fontSize: 13, fontWeight: 800,
    background: active ? 'var(--accent)' : 'var(--bg-input)',
    color: active ? '#fff' : 'var(--text-secondary)',
    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
    cursor: 'pointer', transition: 'all 150ms',
  });

  const rangeLabel = from && to && from === to ? from : from && to ? `${from} → ${to}` : 'All time';

  return (
    <div className={styles.page}>

      {/* ── Header + Refresh ── */}
      <div className={styles.rowBetween}>
        <div>
          <div className={styles.sectionTitle}>AI Cost Analytics</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {selectedOrg ? `${selectedOrgName} · ` : ''}{logs.length} records · {rangeLabel}
          </div>
        </div>
        <button className={styles.refreshBtn} onClick={() => { load(); loadOrgUsers(selectedOrg); }}>
          <RefreshCw size={14} className={loading ? styles.spinning : ''} />
        </button>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* ── Filter bar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: preset === 'custom' ? 'minmax(220px, 1.1fr) minmax(150px, .75fr) minmax(220px, 1fr) auto 150px 150px auto' : 'minmax(220px, 1.1fr) minmax(150px, .75fr) minmax(220px, 1fr) auto auto', gap: 10, alignItems: 'center', padding: 12, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, overflowX: 'auto' }}>
        <select value={selectedOrg} onChange={e => setSelectedOrg(e.target.value)}
          style={{ minWidth: 220, height: 46, minHeight: 46, padding: '0 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 800 }}>
          <option value="">All Organizations</option>
          {organizations.map(org => (
            <option key={org.id} value={org.id}>{org.name || org.code || org.id}</option>
          ))}
        </select>

        {/* Analysis type filter */}
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          style={{ minWidth: 150, height: 46, minHeight: 46, padding: '0 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 800 }}>
          <option value="">All Types</option>
          {allTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        {/* Search */}
        <input placeholder="Search type / outcome / user…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ minWidth: 220, height: 46, minHeight: 46, padding: '0 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 700 }} />

        {/* Clear */}
        {(typeFilter || search) && (
          <button onClick={() => { setTypeFilter(''); setSearch(''); }}
            style={{ height: 46, minHeight: 46, padding: '0 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--danger)', fontSize: 12, fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Clear ×
          </button>
        )}

        {/* Custom date pickers */}
        {preset === 'custom' && (
          <>
            <input type="date" value={dateFrom} max={dateTo || today}
              onChange={e => setDateFrom(e.target.value)}
              style={{ height: 46, minHeight: 46, padding: '0 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 700 }} />
            <input type="date" value={dateTo} min={dateFrom} max={today}
              onChange={e => setDateTo(e.target.value)}
              style={{ height: 46, minHeight: 46, padding: '0 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 700 }} />
          </>
        )}

        {/* Preset buttons */}
        <div style={{ display: 'flex', gap: 6, height: 46, whiteSpace: 'nowrap' }}>
          {(['today', '7d', '30d', 'custom'] as const).map(p => (
            <button key={p} style={btnStyle(preset === p)} onClick={() => setPreset(p)}>
              {p === 'today' ? 'Today' : p === '7d' ? 'Last 7d' : p === '30d' ? 'Last 30d' : 'Custom'}
            </button>
          ))}
        </div>
      </div>

      {selectedOrg && loadingOrgUsers && (
        <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '0 2px' }}>Loading organization users...</div>
      )}

      {/* ── Summary stat cards (all filtered) ── */}
      <div className={styles.statsGrid}>
        <StatCard label="Cost (₹)"         value={`₹${totalRs.toFixed(4)}`}                          icon={DollarSign} color="#3dbf96" />
        <StatCard label="Cost ($)"         value={`$${totalUsd.toFixed(4)}`}                          icon={DollarSign} color="#5bc8e0" />
        <StatCard label="AI Calls"         value={logs.length.toLocaleString()}                       icon={Activity}   color="#ed8936" />
        <StatCard label="Input Tokens"     value={totalIn.toLocaleString()}                           icon={Zap}        color="#9f7aea" />
        <StatCard label="Output Tokens"    value={totalOut.toLocaleString()}                          icon={Zap}        color="#8b5cf6" />
        <StatCard label="Total Tokens"     value={(totalIn + totalOut).toLocaleString()}              icon={Database}   color="#5bc8e0" />
        <StatCard label="Credits Used"     value={totalCred.toFixed(3)}                               icon={TrendingUp} color="#e53e3e" />
        <StatCard label="Avg Cost/Call"    value={logs.length ? `₹${avgCost.toFixed(4)}` : '—'}      icon={DollarSign} color="#f59e0b" />
      </div>

      {/* ── Charts ── */}
      {dailyData.length > 0 && (
        <div className={styles.chartsRow}>
          {/* Daily cost area */}
          <div className={styles.infoCard} style={{ flex: 2 }}>
            <div className={styles.infoTitle}>Daily Cost (₹) — {rangeLabel}</div>
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="cg2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3dbf96" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3dbf96" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip {...tt} formatter={(v: any, n: any) => [n === 'rs' ? `₹${v}` : v, n === 'rs' ? 'Cost' : 'Calls']} />
                <Area type="monotone" dataKey="rs"    stroke="#3dbf96" strokeWidth={2} fill="url(#cg2)" dot={false} />
                <Area type="monotone" dataKey="calls" stroke="#5bc8e0" strokeWidth={1.5} fill="none" dot={false} strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              — Cost (₹) &nbsp;&nbsp; - - Calls
            </div>
          </div>

          {/* Cost by type pie */}
          {typeData.length > 0 && (
            <div className={styles.infoCard} style={{ flex: 1, minWidth: 200 }}>
              <div className={styles.infoTitle}>Cost by Type</div>
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie data={typeData} dataKey="rs" nameKey="name" cx="50%" cy="50%" outerRadius={70} paddingAngle={3}>
                    {typeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...tt} formatter={(v: any) => [`₹${Number(v).toFixed(4)}`, 'Cost']} />
                  <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ── Per-type breakdown table ── */}
      {typeData.length > 0 && (
        <div className={styles.infoCard}>
          <div className={styles.infoTitle}>Breakdown by Analysis Type</div>
          <div className={styles.tableWrap} style={{ marginTop: 10 }}>
            <table className={styles.table}>
              <thead><tr><th>Type</th><th>Calls</th><th>Cost (₹)</th><th>Cost ($)</th><th>Tokens</th><th>Avg ₹/Call</th></tr></thead>
              <tbody>
                {typeData.map((t, i) => (
                  <tr key={t.name}>
                    <td><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: PIE_COLORS[i % PIE_COLORS.length] + '20', color: PIE_COLORS[i % PIE_COLORS.length], fontWeight: 700 }}>{t.name}</span></td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.count}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent)' }}>₹{t.rs.toFixed(4)}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>${t.usd.toFixed(4)}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{t.tokens.toLocaleString()}</td>
                    <td style={{ color: '#f59e0b', fontWeight: 600 }}>₹{t.count ? (t.rs / t.count).toFixed(4) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Top users bar ── */}
      {userData.length > 0 && (
        <div className={styles.infoCard}>
          <div className={styles.infoTitle}>Top Users by AI Cost</div>
          <ResponsiveContainer width="100%" height={Math.max(140, userData.length * 28)}>
            <BarChart data={userData} layout="vertical" barSize={14}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="userId" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} width={96} axisLine={false} tickLine={false} />
              <Tooltip {...tt} formatter={(v: any) => [`₹${Number(v).toFixed(4)}`, 'Cost']} />
              <Bar dataKey="rs" radius={[0, 4, 4, 0]}>
                {userData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Inner tabs: Cost Logs | Credits ── */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg-input)', borderRadius: 10, padding: 3, alignSelf: 'flex-start' }}>
        {(['logs', 'credits'] as const).map(t => (
          <button key={t} onClick={() => setInnerTab(t)}
            style={{ padding: '6px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: innerTab === t ? 'var(--bg-surface)' : 'transparent', color: innerTab === t ? 'var(--text-primary)' : 'var(--text-muted)', boxShadow: innerTab === t ? 'var(--shadow-sm)' : 'none', transition: 'all 180ms' }}>
            {t === 'logs' ? `Cost Logs (${logs.length})` : `Credits (${credits.length})`}
          </button>
        ))}
      </div>

      {/* Cost logs table */}
      {innerTab === 'logs' && (
        <>
          {loading && <div className={styles.loadingRow}>Loading…</div>}
          {!loading && logs.length > 0 && (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr>
                  <th>Type</th><th>Outcome</th><th>In / Out</th>
                  <th>Cost (₹)</th><th>Cost ($)</th><th>Credits</th><th>Time</th>
                </tr></thead>
                <tbody>
                  {logs.slice(0, 100).map((l: any) => {
                    const type = analysisTypeOf(l) || 'Unknown';
                    const outcome = analysisOutcomeOf(l) || '—';
                    const createdAt = createdAtOf(l);
                    return (
                    <tr key={l.id}>
                      <td><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'var(--accent-light)', color: 'var(--accent)', fontWeight: 700 }}>{type}</span></td>
                      <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: 12 }} title={outcome}>{outcome}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{num(l, 'inputToken', 'input_token', 'inputtoken')} / {num(l, 'outputToken', 'output_token', 'outputtoken')}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent)' }}>₹{num(l, 'chargesInRs', 'charges_in_rs', 'chargesinrs').toFixed(4)}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>${num(l, 'chargesInDollar', 'charges_in_dollar', 'chargesindollar').toFixed(4)}</td>
                      <td style={{ color: '#9f7aea', fontWeight: 600 }}>{num(l, 'credit').toFixed(4)}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 11, whiteSpace: 'nowrap' }}>
                        {createdAt ? new Date(createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
              {logs.length > 100 && <div style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>Showing first 100 of {logs.length} records</div>}
            </div>
          )}
          {!loading && logs.length === 0 && (
            <div className={styles.emptyCard}>
              <Zap size={28} color="var(--text-muted)" />
              <div style={{ marginTop: 10, color: 'var(--text-muted)', fontSize: 14 }}>No cost logs for selected filters.</div>
            </div>
          )}
        </>
      )}

      {/* Credits table */}
      {innerTab === 'credits' && (
        <>
          {loading && <div className={styles.loadingRow}>Loading…</div>}
          {!loading && credits.length > 0 && (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr><th>Client ID</th><th>Action</th><th>Credits</th><th>Used At</th></tr></thead>
                <tbody>
                  {credits.map((c: any) => {
                    const creditUserId = userIdOf(c);
                    const usedAt = usedAtOf(c);
                    return (
                    <tr key={c.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{creditUserId ? `${creditUserId.slice(0, 20)}…` : '—'}</td>
                      <td><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: '#9f7aea20', color: '#9f7aea', fontWeight: 700 }}>{val(c, 'action') || '—'}</span></td>
                      <td style={{ fontWeight: 700, color: '#9f7aea' }}>{num(c, 'credit').toFixed(4)}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 11 }}>{usedAt ? new Date(usedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!loading && credits.length === 0 && (
            <div className={styles.emptyCard}>
              <Zap size={28} color="var(--text-muted)" />
              <div style={{ marginTop: 10, color: 'var(--text-muted)', fontSize: 14 }}>No credit records for selected date range.</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon} style={{ background: color + '18' }}><Icon size={18} color={color} /></div>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue} style={{ color, fontSize: 18 }}>{value}</div>
    </div>
  );
}

/* ── Plans ── */
function AdminPlans() {
  const [plans, setPlans]         = useState<any[]>([]);
  const [limits, setLimits]       = useState<any[]>([]);
  const [limitCols, setLimitCols] = useState<string[]>([]);   // actual DB columns
  const [planCols, setPlanCols]   = useState<string[]>([]);   // actual DB columns
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [msg, setMsg]             = useState('');
  const [innerTab, setInnerTab]   = useState<'plans' | 'limits'>('plans');
  const [selectedPlan, setSelectedPlan] = useState('');

  // Plan form
  const [planForm, setPlanForm]       = useState<any>({});
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [showPlanForm, setShowPlanForm] = useState(false);

  // Limit form
  const [limitForm, setLimitForm]       = useState<any>({});
  const [editingLimit, setEditingLimit] = useState<number | null>(null);
  const [showLimitForm, setShowLimitForm] = useState(false);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 4000); };

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [pr, lr, pSchema, lSchema] = await Promise.all([
        api.plans.list(),
        api.planLimits.list(selectedPlan || undefined),
        api.plans.schema().catch(() => ({ columns: [] })),
        api.planLimits.schema().catch(() => ({ columns: [] })),
      ]);
      setPlans(pr.plans || []);
      setLimits(lr.plan_limits || []);
      // Extract actual column names, excluding auto-gen fields
      const pCols = (pSchema.columns || []).map((c: any) => c.column).filter((c: string) => c !== 'id');
      const lCols = (lSchema.columns || []).map((c: any) => c.column);
      setPlanCols(pCols);
      setLimitCols(lCols);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [selectedPlan]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ──
  const pkCol = limitCols.find(c => c === 'id') || 'id';
  const planCol = limitCols.find(c => c === 'plan_name' || c === 'plan') || 'plan_name';
  const editableLimitCols = limitCols.filter(c => c !== pkCol);

  // ── Plan CRUD ──
  const savePlan = async () => {
    setError('');
    try {
      if (editingPlan) {
        await api.plans.update(editingPlan, planForm);
        flash(`Plan "${editingPlan}" updated.`);
      } else {
        await api.plans.create(planForm);
        flash(`Plan "${planForm.name}" created.`);
      }
      setShowPlanForm(false); setEditingPlan(null); setPlanForm({});
      load();
    } catch (e: any) { setError(e.message); }
  };

  const deletePlan = async (name: string) => {
    if (!window.confirm(`Delete plan "${name}"?`)) return;
    try { await api.plans.delete(name); flash(`Plan "${name}" deleted.`); load(); }
    catch (e: any) { setError(e.message); }
  };

  // ── Limit CRUD ──
  const saveLimit = async () => {
    setError('');
    try {
      const payload: any = { ...limitForm };
      // coerce numeric fields
      limitCols.forEach(c => {
        if (['limit_value', 'max_value', 'value'].includes(c) && payload[c] !== '' && payload[c] !== undefined)
          payload[c] = parseInt(payload[c]);
      });
      if (editingLimit !== null) {
        const { [planCol]: _p, feature_key: _f, ...rest } = payload;
        await api.planLimits.update(editingLimit, rest);
        flash('Limit updated.');
      } else {
        await api.planLimits.create(payload);
        flash('Limit created.');
      }
      setShowLimitForm(false); setEditingLimit(null); setLimitForm({});
      load();
    } catch (e: any) { setError(e.message); }
  };

  const deleteLimit = async (id: number) => {
    if (!window.confirm('Delete this limit?')) return;
    try { await api.planLimits.delete(id); flash('Limit deleted.'); load(); }
    catch (e: any) { setError(e.message); }
  };

  // ── Styles ──
  const fieldStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 5 };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' };
  const inputStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13 };
  const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 };

  const PLAN_COLORS: Record<string, string> = { Start: '#5bc8e0', Pro: '#3dbf96', Elite: '#f59e0b' };
  const planColor = (name: string) => PLAN_COLORS[name] || '#9f7aea';

  // Render a generic input for any column type
  const renderField = (col: string, form: any, setForm: (f: any) => void, disabled = false) => {
    const val = form[col] ?? '';
    const isBoolStr = ['enabled', 'active'].includes(col);
    const isNumeric = ['price', 'credit', 'limit_value', 'max_value', 'value', 'amount'].includes(col);
    const isTextarea = ['description', 'features', 'notes'].includes(col);
    return (
      <div key={col} style={{ ...fieldStyle, gridColumn: isTextarea ? '1 / -1' : undefined }}>
        <label style={labelStyle}>{col.replace(/_/g, ' ')}</label>
        {isTextarea ? (
          <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} value={val} disabled={disabled}
            onChange={e => setForm({ ...form, [col]: e.target.value })} />
        ) : isBoolStr ? (
          <select style={inputStyle} value={String(val)} disabled={disabled}
            onChange={e => setForm({ ...form, [col]: e.target.value === 'true' })}>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        ) : (
          <input style={inputStyle} type={isNumeric ? 'number' : 'text'} value={String(val)} disabled={disabled}
            onChange={e => setForm({ ...form, [col]: e.target.value })} />
        )}
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.rowBetween}>
        <div className={styles.sectionTitle}>Plan Management</div>
        <button className={styles.refreshBtn} onClick={load}>
          <RefreshCw size={14} className={loading ? styles.spinning : ''} />
        </button>
      </div>

      {msg && <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: 'rgba(61,191,150,.1)', border: '1px solid rgba(61,191,150,.3)', color: 'var(--accent)' }}>{msg}</div>}
      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg-input)', borderRadius: 10, padding: 3, alignSelf: 'flex-start' }}>
        {(['plans', 'limits'] as const).map(t => (
          <button key={t} onClick={() => setInnerTab(t)}
            style={{ padding: '7px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: innerTab === t ? 'var(--bg-surface)' : 'transparent', color: innerTab === t ? 'var(--text-primary)' : 'var(--text-muted)', boxShadow: innerTab === t ? 'var(--shadow-sm)' : 'none', transition: 'all 180ms', cursor: 'pointer', border: 'none' }}>
            {t === 'plans' ? `Plans (${plans.length})` : `Plan Limits (${limits.length})`}
          </button>
        ))}
      </div>

      {/* ══ PLANS TAB ══ */}
      {innerTab === 'plans' && (
        <>
          <button onClick={() => { setShowPlanForm(true); setEditingPlan(null); setPlanForm({}); setError(''); }}
            style={{ alignSelf: 'flex-start', padding: '9px 18px', borderRadius: 10, background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', border: 'none' }}>
            + New Plan
          </button>

          {showPlanForm && (
            <div className={styles.infoCard}>
              <div className={styles.infoTitle} style={{ marginBottom: 14 }}>{editingPlan ? `Edit: ${editingPlan}` : 'Create Plan'}</div>
              <div style={gridStyle}>
                {!editingPlan && renderField('name', planForm, setPlanForm)}
                {planCols.filter(c => c !== 'name').map(c => renderField(c, planForm, setPlanForm))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button onClick={savePlan} style={{ padding: '9px 22px', borderRadius: 10, background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', border: 'none' }}>
                  {editingPlan ? 'Save Changes' : 'Create Plan'}
                </button>
                <button onClick={() => { setShowPlanForm(false); setEditingPlan(null); setError(''); }}
                  style={{ padding: '9px 18px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {loading && <div className={styles.loadingRow}>Loading plans…</div>}
          {!loading && plans.length === 0 && <div className={styles.emptyCard}><Crown size={28} color="var(--text-muted)" /><div style={{ marginTop: 10, color: 'var(--text-muted)', fontSize: 14 }}>No plans found.</div></div>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {plans.map((p: any) => (
              <div key={p.name} className={styles.infoCard} style={{ border: `2px solid ${planColor(p.name)}22`, position: 'relative', overflow: 'visible' }}>
                {p.popular && p.popular !== 'none' && (
                  <div style={{ position: 'absolute', top: -10, right: 14, background: planColor(p.name), color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 99, textTransform: 'uppercase' }}>
                    {p.popular}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: planColor(p.name) + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Crown size={18} color={planColor(p.name)} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>{p.name}</div>
                      {p.code && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.code}</div>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: planColor(p.name) }}>{p.price != null ? `₹${p.price}` : 'Free'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>/{p.period || 'mo'}</div>
                  </div>
                </div>
                {p.description && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>{p.description}</div>}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  {p.credit != null && <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 99, background: planColor(p.name) + '15', color: planColor(p.name), fontWeight: 700, border: `1px solid ${planColor(p.name)}30` }}>{p.credit} credits</span>}
                  {p.cta && <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 99, background: 'var(--metric-bg)', color: 'var(--text-secondary)', fontWeight: 600, border: '1px solid var(--border)' }}>{p.cta}</span>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => {
                    setEditingPlan(p.name);
                    const f: any = {};
                    planCols.filter(c => c !== 'name').forEach(c => { f[c] = p[c] ?? ''; });
                    setPlanForm(f); setShowPlanForm(true); setError('');
                  }} style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                    ✏ Edit
                  </button>
                  <button onClick={() => deletePlan(p.name)} style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: '1px solid rgba(239,68,68,.25)', background: 'rgba(239,68,68,.08)', color: 'var(--danger)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                    🗑 Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ══ PLAN LIMITS TAB ══ */}
      {innerTab === 'limits' && (
        <>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)} style={{ ...inputStyle, minWidth: 160 }}>
              <option value="">All Plans</option>
              {plans.map((p: any) => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
            <button onClick={() => { setShowLimitForm(true); setEditingLimit(null); setLimitForm({ [planCol]: selectedPlan }); setError(''); }}
              style={{ padding: '9px 18px', borderRadius: 10, background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', border: 'none' }}>
              + New Limit
            </button>
          </div>

          {showLimitForm && (
            <div className={styles.infoCard}>
              <div className={styles.infoTitle} style={{ marginBottom: 14 }}>{editingLimit !== null ? 'Edit Limit' : 'Create Limit'}</div>
              <div style={gridStyle}>
                {editableLimitCols.map(c => renderField(c, limitForm, setLimitForm, editingLimit !== null && [planCol, 'feature_key', 'limit_key', 'key'].includes(c)))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button onClick={saveLimit} style={{ padding: '9px 22px', borderRadius: 10, background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', border: 'none' }}>
                  {editingLimit !== null ? 'Save Changes' : 'Create'}
                </button>
                <button onClick={() => { setShowLimitForm(false); setEditingLimit(null); setError(''); }}
                  style={{ padding: '9px 18px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {loading && <div className={styles.loadingRow}>Loading…</div>}
          {!loading && limits.length === 0 && <div className={styles.emptyCard}><Database size={28} color="var(--text-muted)" /><div style={{ marginTop: 10, color: 'var(--text-muted)', fontSize: 14 }}>No plan limits found.</div></div>}
          {!loading && limits.length > 0 && (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    {editableLimitCols.map(c => <th key={c}>{c.replace(/_/g, ' ')}</th>)}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {limits.map((l: any) => (
                    <tr key={l[pkCol]}>
                      {editableLimitCols.map(c => (
                        <td key={c} style={{ fontSize: 13 }}>
                          {c === planCol ? (
                            <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 99, fontWeight: 700, color: planColor(l[c]), background: planColor(l[c]) + '18', border: `1px solid ${planColor(l[c])}30` }}>{l[c]}</span>
                          ) : typeof l[c] === 'boolean' ? (
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 700, color: l[c] ? 'var(--accent)' : 'var(--danger)', background: l[c] ? 'rgba(61,191,150,.12)' : 'rgba(239,68,68,.1)', border: '1px solid var(--border)' }}>{l[c] ? 'Yes' : 'No'}</span>
                          ) : l[c] != null ? String(l[c]) : '—'}
                        </td>
                      ))}
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => {
                            setEditingLimit(l[pkCol]);
                            const f: any = {};
                            editableLimitCols.forEach(c => { f[c] = l[c] ?? ''; });
                            setLimitForm(f); setShowLimitForm(true); setError('');
                          }} style={{ padding: '4px 11px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>✏ Edit</button>
                          <button onClick={() => deleteLimit(l[pkCol])} style={{ padding: '4px 11px', borderRadius: 7, border: '1px solid rgba(239,68,68,.25)', background: 'rgba(239,68,68,.08)', color: 'var(--danger)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Reports ── */
function AdminReports() {
  const apiOrigin = API_ORIGIN.replace(/\/$/, '');
  return (
    <div className={styles.page}>
      <div className={styles.sectionTitle}>Platform Reports</div>
      <div className={styles.infoCard}>
        <div className={styles.infoTitle}>Reports</div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
          Access detailed platform analytics and health metrics reports via the API.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'API Docs', url: `${apiOrigin}/docs` },
            { label: 'Health Metrics', url: `${apiOrigin}/api/v1/report/health-metrics` },
          ].map(l => (
            <a key={l.label} href={l.url} target="_blank" rel="noreferrer"
              style={{ padding: '9px 18px', background: 'var(--accent)', color: '#fff', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
              {l.label} →
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Broadcast ── */
function AdminBroadcast() {
  const { user } = useApp();
  const [form, setForm] = useState({ subject: '', message: '', targetPlan: 'all', scope: 'all', organizationId: '', branchId: '' });
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState('');

  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        const pageSize = 100;
        const first = await api.superAdmin.listOrgs({ page: 1, pageSize });
        const all = Array.isArray(first?.organizations) ? [...first.organizations] : [];
        const total = Number(first?.total || all.length);
        const pages = Math.ceil(total / pageSize);
        if (pages > 1) {
          const more = await Promise.all(
            Array.from({ length: pages - 1 }, (_, i) =>
              api.superAdmin.listOrgs({ page: i + 2, pageSize }).catch(() => ({ organizations: [] }))
            )
          );
          more.forEach((res: any) => all.push(...(res?.organizations || [])));
        }
        setOrganizations(all);
      } catch (_) {
        setOrganizations([]);
      }
    };
    loadOrganizations();
  }, []);

  useEffect(() => {
    setBranches([]);
    if (!form.organizationId) {
      setForm(prev => ({ ...prev, branchId: '' }));
      return;
    }
    setLoadingBranches(true);
    api.org.listBranches(form.organizationId, { page: 1, pageSize: 100 })
      .then(res => setBranches(Array.isArray(res?.branches) ? res.branches : []))
      .catch(() => setBranches([]))
      .finally(() => setLoadingBranches(false));
  }, [form.organizationId]);

  const loadBranchRecipients = async (branchId: string) => {
    const recipients: any[] = [];
    let page = 1;
    let total = 0;
    do {
      const res = await api.branch.listUsers(branchId, { page, pageSize: 100, type: 'CLIENT', status: 'active' });
      const clients = Array.isArray(res?.clients) ? res.clients : Array.isArray(res?.users) ? res.users : [];
      recipients.push(...clients);
      total = Number(res?.total || clients.length);
      page++;
    } while (recipients.length < total);
    return recipients;
  };

  const loadTargetRecipients = async () => {
    let targetBranches: any[] = [];
    if (form.scope === 'branch') {
      if (!form.branchId) throw new Error('Select a branch before sending.');
      targetBranches = [{ id: form.branchId }];
    } else if (form.scope === 'organization') {
      if (!form.organizationId) throw new Error('Select an organization before sending.');
      const res = await api.org.listBranches(form.organizationId, { page: 1, pageSize: 100 });
      targetBranches = Array.isArray(res?.branches) ? res.branches : [];
    } else {
      const orgs = organizations.length ? organizations : (await api.superAdmin.listOrgs({ page: 1, pageSize: 100 })).organizations || [];
      const branchLists = await Promise.all(
        orgs.map((org: any) => api.org.listBranches(org.id, { page: 1, pageSize: 100 }).catch(() => ({ branches: [] })))
      );
      targetBranches = branchLists.flatMap((res: any) => res?.branches || []);
    }

    const nestedRecipients = await Promise.all(targetBranches.map((branch: any) => loadBranchRecipients(branch.id)));
    const byId = new Map<string, any>();
    nestedRecipients.flat().forEach((recipient: any) => {
      const id = recipient.id || recipient.userId || recipient.user_id;
      if (!id) return;
      if (form.targetPlan !== 'all' && recipient.plan !== form.targetPlan) return;
      byId.set(String(id), recipient);
    });
    return Array.from(byId.values());
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true); setResult('');
    try {
      if (!user?.userId) throw new Error('Admin user session not found.');

      const recipients = await loadTargetRecipients();

      if (recipients.length === 0) {
        setResult('Error: No active clients found for this target.');
        return;
      }

      const message = `${form.subject.trim()}\n\n${form.message.trim()}`.slice(0, 2000);
      const sends = await Promise.allSettled(
        recipients.map(recipient =>
          api.messages.send({
            from_user_id: user.userId,
            to_user_id: recipient.id || recipient.userId || recipient.user_id,
            message,
          })
        )
      );
      const sent = sends.filter(r => r.status === 'fulfilled').length;
      const failed = sends.length - sent;

      setResult(failed ? `Broadcast sent to ${sent} user(s); ${failed} failed.` : `Broadcast sent to ${sent} user(s)!`);
      setForm(prev => ({ ...prev, subject: '', message: '', targetPlan: 'all' }));
    } catch (e: any) { setResult(`Error: ${e.message}`); }
    finally { setSending(false); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.sectionTitle}>Send Broadcast</div>
      {result && (
        <div style={{ padding: '11px 14px', borderRadius: 12, fontSize: 13, fontWeight: 600, background: result.startsWith('Error') ? 'rgba(239,68,68,.1)' : 'rgba(61,191,150,.1)', border: `1px solid ${result.startsWith('Error') ? 'rgba(239,68,68,.3)' : 'rgba(61,191,150,.3)'}`, color: result.startsWith('Error') ? 'var(--danger)' : 'var(--accent)' }}>{result}</div>
      )}
      <div className={styles.infoCard}>
        <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Subject</label>
            <input placeholder="Email subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Broadcast Target</label>
              <select value={form.scope} onChange={e => setForm({ ...form, scope: e.target.value, organizationId: '', branchId: '' })}>
                <option value="all">Across all organizations</option>
                <option value="organization">All branches of organization</option>
                <option value="branch">Specific branch in organization</option>
              </select>
            </div>
            {form.scope !== 'all' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Organization</label>
                <select value={form.organizationId} onChange={e => setForm({ ...form, organizationId: e.target.value, branchId: '' })} required>
                  <option value="">Select organization...</option>
                  {organizations.map(org => <option key={org.id} value={org.id}>{org.name || org.code || org.id}</option>)}
                </select>
              </div>
            )}
            {form.scope === 'branch' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Branch</label>
                <select value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value })} disabled={!form.organizationId || loadingBranches} required>
                  <option value="">{form.organizationId ? (loadingBranches ? 'Loading branches...' : 'Select branch...') : 'Select organization first'}</option>
                  {branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name || branch.code || branch.id}</option>)}
                </select>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Target Plan</label>
            <select value={form.targetPlan} onChange={e => setForm({ ...form, targetPlan: e.target.value })}>
              <option value="all">All Plans</option>
              <option value="Start">Start Plan</option>
              <option value="Pro">Pro Plan</option>
              <option value="Elite">Elite Plan</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Message</label>
            <textarea placeholder="Write your broadcast message…" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={5} required style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={sending} style={{ padding: '10px 24px', background: 'var(--accent)', color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: 14, opacity: sending ? 0.7 : 1 }}>
              {sending ? 'Sending…' : 'Send Broadcast'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Settings ── */
function AdminSettings() {
  const { user } = useApp();
  const apiOrigin = API_ORIGIN.replace(/\/$/, '');
  return (
    <div className={styles.page}>
      <div className={styles.sectionTitle}>Admin Settings</div>
      <div className={styles.infoCard}>
        <div className={styles.infoTitle}>API Configuration</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
          {[
            { label: 'API Base URL', value: apiOrigin },
            { label: 'Logged in as', value: user?.userName || '—' },
            { label: 'Role', value: 'Administrator' },
            { label: 'Plan', value: user?.plan || '—' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{r.label}</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{r.value}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16 }}>
          <a href={`${apiOrigin}/docs`} target="_blank" rel="noreferrer"
            style={{ padding: '9px 18px', background: 'var(--accent)', color: '#fff', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>
            Open API Docs →
          </a>
        </div>
      </div>
    </div>
  );
}
