import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import {
  LayoutDashboard, Users, BarChart2, Settings, LogOut,
  Sun, Moon, Menu, X, RefreshCw, TrendingUp,
  Shield, Activity, MessageSquare, Zap, DollarSign,
  UserCheck, UserPlus, Crown, AlertCircle, Clock,
  TrendingDown, Percent, Star, Database, Wifi
} from 'lucide-react';
import { api } from '../api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend } from 'recharts';
import styles from './AdminDashboard.module.css';
import dropdowns from '../config/dropdowns.json';

type AdminTab = 'overview' | 'users' | 'ai-costs' | 'reports' | 'plans' | 'broadcast' | 'settings';

const NAV: { id: AdminTab; icon: any; label: string }[] = [
  { id: 'overview',  icon: LayoutDashboard, label: 'Overview'  },
  { id: 'users',     icon: Users,           label: 'Users'     },
  { id: 'ai-costs',  icon: DollarSign,      label: 'AI Costs'  },
  { id: 'reports',   icon: BarChart2,       label: 'Reports'   },
  { id: 'plans',     icon: Crown,           label: 'Plans'     },
  { id: 'broadcast', icon: MessageSquare,   label: 'Broadcast' },
  { id: 'settings',  icon: Settings,        label: 'Settings'  },
];

export default function AdminDashboard() {
  const { user, toggleTheme, theme, requestLogout } = useApp();
  const [tab, setTab] = useState<AdminTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const logoSrc = theme === 'dark' ? '/logo2.png' : '/logo.png';

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
        <div className={styles.sidebarTop}>
          <div className={styles.logo}>
            <img src={logoSrc} alt="" className={styles.logoImg} onError={e => (e.currentTarget.style.display = 'none')} />
            <div>
              <div className={styles.adminBadge}>Admin Panel</div>
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
          {NAV.map(n => (
            <button key={n.id} className={`${styles.navItem} ${tab === n.id ? styles.navActive : ''}`}
              onClick={() => { setTab(n.id); setSidebarOpen(false); }}>
              <n.icon size={16} /><span>{n.label}</span>
            </button>
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
          <h1 className={styles.pageTitle}>{NAV.find(n => n.id === tab)?.label}</h1>
          <div className={styles.topbarRight}>
            <div className={styles.adminChip}><Shield size={12} /> Admin</div>
            <div className={styles.avatarSm}>{(user?.userName || 'A').charAt(0).toUpperCase()}</div>
          </div>
        </header>

        <div className={styles.content}>
          {tab === 'overview'  && <AdminOverview />}
          {tab === 'users'     && <AdminUsers />}
          {tab === 'ai-costs'  && <AdminAICosts />}
          {tab === 'reports'   && <AdminReports />}
          {tab === 'plans'     && <AdminPlans />}
          {tab === 'broadcast' && <AdminBroadcast />}
          {tab === 'settings'  && <AdminSettings />}
        </div>
      </main>
    </div>
  );
}

/* ── Overview ── */
function AdminOverview() {
  const [users, setUsers]     = useState<any[]>([]);
  const [logs, setLogs]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError('');
      try {
        const [firstUsersRes, costLogsRes] = await Promise.all([
          api.admin.listUsers({ page: 1, pageSize: 100 }),
          api.admin.getAppCostLogs().catch(() => []),
        ]);
        const firstUsers  = Array.isArray(firstUsersRes?.users) ? firstUsersRes.users : [];
        const totalUsers  = Number(firstUsersRes?.total || firstUsers.length);
        const totalPages  = Math.ceil(totalUsers / 100);
        const morePages   = totalPages > 1
          ? await Promise.all(Array.from({ length: totalPages - 1 }, (_, i) =>
              api.admin.listUsers({ page: i + 2, pageSize: 100 }).catch(() => ({ users: [] }))
            ))
          : [];
        const allUsers = [
          ...firstUsers,
          ...morePages.flatMap((r: any) => Array.isArray(r?.users) ? r.users : []),
        ];
        setUsers(allUsers);
        setLogs(Array.isArray(costLogsRes) ? costLogsRes : []);
      } catch (e: any) {
        setError(e.message || 'Unable to load overview data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const now       = Date.now();
  const dayMs     = 86400000;
  const weekMs    = 7 * dayMs;
  const monthMs   = 30 * dayMs;

  // ── User counters ──
  const totalUsers    = users.length;
  const activeUsers   = users.filter(u => u.status === 'active').length;
  const inactiveUsers = users.filter(u => u.status !== 'active').length;
  const paidUsers     = users.filter(u => ['Pro', 'Elite'].includes(u.plan)).length;
  const eliteUsers    = users.filter(u => u.plan === 'Elite').length;
  const proUsers      = users.filter(u => u.plan === 'Pro').length;
  const freeUsers     = users.filter(u => u.plan === 'Start' || !u.plan).length;
  const newUsers7d    = users.filter(u => u.createdAt && now - new Date(u.createdAt).getTime() < weekMs).length;
  const newUsers30d   = users.filter(u => u.createdAt && now - new Date(u.createdAt).getTime() < monthMs).length;
  const googleUsers   = users.filter(u => u.signupSrc === 'google' || u.signup_src === 'google').length;
  const adminCount    = users.filter(u => u.role === 'admin').length;
  const convRate      = totalUsers > 0 ? ((paidUsers / totalUsers) * 100).toFixed(1) : '0';
  const activeRate    = totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : '0';

  // ── AI / cost counters ──
  const monthLogs      = logs.filter(l => l.createdAt && now - new Date(l.createdAt).getTime() < monthMs);
  const weekLogs       = logs.filter(l => l.createdAt && now - new Date(l.createdAt).getTime() < weekMs);
  const dayLogs        = logs.filter(l => l.createdAt && now - new Date(l.createdAt).getTime() < dayMs);
  const aiSpend30d     = monthLogs.reduce((a, l) => a + (l.chargesInRs || 0), 0);
  const aiSpend7d      = weekLogs.reduce((a, l) => a + (l.chargesInRs || 0), 0);
  const totalTokens    = logs.reduce((a, l) => a + (l.inputToken || 0) + (l.outputToken || 0), 0);
  const totalCredits   = logs.reduce((a, l) => a + (l.credit || 0), 0);
  const avgCostPerCall = logs.length ? (logs.reduce((a, l) => a + (l.chargesInRs || 0), 0) / logs.length) : 0;

  // ── Daily signups (last 14 days) for area chart ──
  const signupByDay: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * dayMs);
    signupByDay[d.toISOString().slice(5, 10)] = 0;
  }
  users.forEach(u => {
    if (!u.createdAt) return;
    const key = new Date(u.createdAt).toISOString().slice(5, 10);
    if (key in signupByDay) signupByDay[key]++;
  });
  const signupTrend = Object.entries(signupByDay).map(([date, count]) => ({ date, count }));

  // ── Daily AI calls trend (last 14 days) ──
  const callsByDay: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * dayMs);
    callsByDay[d.toISOString().slice(5, 10)] = 0;
  }
  logs.forEach(l => {
    if (!l.createdAt) return;
    const key = new Date(l.createdAt).toISOString().slice(5, 10);
    if (key in callsByDay) callsByDay[key]++;
  });
  const callsTrend = Object.entries(callsByDay).map(([date, count]) => ({ date, count }));

  // ── Recently joined users (last 5) ──
  const recentUsers = [...users]
    .filter(u => u.createdAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  // ── Plan breakdown bar data ──
  const planBar = [
    { name: 'Start', value: freeUsers,  color: '#5bc8e0' },
    { name: 'Pro',   value: proUsers,   color: '#3dbf96' },
    { name: 'Elite', value: eliteUsers, color: '#f59e0b' },
  ];

  const tt = { contentStyle: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, color: 'var(--text-primary)' } };

  // ── Counter cards config ──
  const primaryCards = [
    { label: 'Total Users',      value: totalUsers.toLocaleString(),      icon: Users,       color: '#5bc8e0' },
    { label: 'Active Users',     value: activeUsers.toLocaleString(),     icon: UserCheck,   color: '#3dbf96' },
    { label: 'Paid Members',     value: paidUsers.toLocaleString(),       icon: Crown,       color: '#f59e0b' },
    { label: 'New This Week',    value: newUsers7d.toLocaleString(),      icon: UserPlus,    color: '#9f7aea' },
    { label: 'New This Month',   value: newUsers30d.toLocaleString(),     icon: TrendingUp,  color: '#ed8936' },
    { label: 'Google Signups',   value: googleUsers.toLocaleString(),     icon: Wifi,        color: '#4285F4' },
    { label: 'AI Calls 24h',     value: dayLogs.length.toLocaleString(),  icon: Activity,    color: '#ed8936' },
    { label: 'AI Spend 30d',     value: `₹${aiSpend30d.toFixed(2)}`,     icon: DollarSign,  color: '#e53e3e' },
  ];

  const secondaryCards = [
    { label: 'Elite Plan',       value: eliteUsers.toLocaleString(),      icon: Star,        color: '#f59e0b' },
    { label: 'Pro Plan',         value: proUsers.toLocaleString(),        icon: Crown,       color: '#3dbf96' },
    { label: 'Free Plan',        value: freeUsers.toLocaleString(),       icon: Users,       color: '#5bc8e0' },
    { label: 'Inactive Users',   value: inactiveUsers.toLocaleString(),   icon: TrendingDown,color: '#e53e3e' },
    { label: 'Conversion Rate',  value: `${convRate}%`,                   icon: Percent,     color: '#9f7aea' },
    { label: 'Active Rate',      value: `${activeRate}%`,                 icon: UserCheck,   color: '#3dbf96' },
    { label: 'Total AI Calls',   value: logs.length.toLocaleString(),     icon: Database,    color: '#8b5cf6' },
    { label: 'Total Tokens',     value: totalTokens > 1000 ? `${(totalTokens / 1000).toFixed(1)}k` : totalTokens.toString(), icon: Zap, color: '#ed8936' },
    { label: 'AI Spend 7d',      value: `₹${aiSpend7d.toFixed(2)}`,      icon: DollarSign,  color: '#e53e3e' },
    { label: 'Avg Cost/Call',    value: `₹${avgCostPerCall.toFixed(4)}`,  icon: TrendingUp,  color: '#f59e0b' },
    { label: 'Credits Used',     value: totalCredits.toFixed(1),          icon: Zap,         color: '#8b5cf6' },
    { label: 'Admin Users',      value: adminCount.toLocaleString(),      icon: Shield,      color: error ? '#e53e3e' : '#3dbf96' },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.rowBetween}>
        <div className={styles.sectionTitle}>System Overview</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {loading ? 'Loading…' : `${totalUsers} users · ${logs.length} AI calls`}
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* Primary counters */}
      <div className={styles.statsGrid}>
        {primaryCards.map(c => (
          <div key={c.label} className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: c.color + '18' }}>
              <c.icon size={20} color={c.color} />
            </div>
            <div className={styles.statLabel}>{c.label}</div>
            <div className={styles.statValue} style={{ color: c.color }}>{loading ? '…' : c.value}</div>
          </div>
        ))}
      </div>

      {/* Trend charts */}
      {!loading && (
        <div className={styles.chartsRow}>
          {/* Signup trend */}
          <div className={styles.infoCard} style={{ flex: 1 }}>
            <div className={styles.infoTitle}>Daily Signups — Last 14 Days</div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={signupTrend}>
                <defs>
                  <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#5bc8e0" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#5bc8e0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide allowDecimals={false} />
                <Tooltip {...tt} formatter={(v: any) => [v, 'Signups']} />
                <Area type="monotone" dataKey="count" stroke="#5bc8e0" strokeWidth={2} fill="url(#signupGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* AI calls trend */}
          <div className={styles.infoCard} style={{ flex: 1 }}>
            <div className={styles.infoTitle}>Daily AI Calls — Last 14 Days</div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={callsTrend}>
                <defs>
                  <linearGradient id="callsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3dbf96" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3dbf96" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide allowDecimals={false} />
                <Tooltip {...tt} formatter={(v: any) => [v, 'AI Calls']} />
                <Area type="monotone" dataKey="count" stroke="#3dbf96" strokeWidth={2} fill="url(#callsGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Plan breakdown bar */}
          <div className={styles.infoCard} style={{ flex: 1, minWidth: 160 }}>
            <div className={styles.infoTitle}>Plan Breakdown</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={planBar} barSize={36}>
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide allowDecimals={false} />
                <Tooltip {...tt} formatter={(v: any) => [v, 'Users']} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {planBar.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Secondary counters */}
      {!loading && (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>
            Detailed Metrics
          </div>
          <div className={styles.statsGrid}>
            {secondaryCards.map(c => (
              <div key={c.label} className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: c.color + '14' }}>
                  <c.icon size={18} color={c.color} />
                </div>
                <div className={styles.statLabel}>{c.label}</div>
                <div className={styles.statValue} style={{ color: c.color, fontSize: 20 }}>{c.value}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Recently joined */}
      {!loading && recentUsers.length > 0 && (
        <div className={styles.infoCard}>
          <div className={styles.infoTitle} style={{ marginBottom: 14 }}>Recently Joined Users</div>
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
  const [filterPlan, setFilterPlan] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [actioningId, setActioningId] = useState<string | null>(null);

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

  const load = async (p = page) => {
    setLoading(true); setError('');
    try {
      const res = await api.admin.listUsers({
        page: p, pageSize,
        ...(filterRole   ? { role: filterRole }     : {}),
        ...(filterPlan   ? { plan: filterPlan }     : {}),
        ...(filterStatus ? { status: filterStatus } : {}),
      });
      setUsers(res.users || []);
      setTotal(res.total || 0);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { load(1); setPage(1); }, [filterRole, filterPlan, filterStatus]);

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
  const ROLES    = ['', 'user', 'admin'];
  const STATUSES = ['', 'active', 'inactive', 'suspended'];

  // ── Chart data derived from allUsers ──
  const PIE_COLORS = ['#3dbf96', '#5bc8e0', '#9f7aea', '#ed8936', '#e53e3e', '#f59e0b'];

  const planData = ['Start', 'Pro', 'Elite'].map(plan => ({
    name: plan,
    value: allUsers.filter(u => u.plan === plan).length,
  })).filter(d => d.value > 0);

  const roleData = ['user', 'admin'].map(role => ({
    name: role.charAt(0).toUpperCase() + role.slice(1),
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
          <div className={styles.sectionTitle}>User Management</div>
          {allUsers.length > 0 && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{allUsers.length} total users</div>}
        </div>
        <button className={styles.refreshBtn} onClick={() => { loadAll(); load(page); }}>
          <RefreshCw size={14} className={loading ? styles.spinning : ''} />
        </button>
      </div>

      {/* ── Pie charts row ── */}
      {allUsers.length > 0 && (
        <div className={styles.chartsRow}>

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
            <div className={styles.infoTitle}>User Status</div>
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

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {ROLES.map(r => <option key={r} value={r}>{r ? `Role: ${r}` : 'All Roles'}</option>)}
        </select>
        <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {PLANS.map(p => <option key={p} value={p}>{p ? `Plan: ${p}` : 'All Plans'}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {STATUSES.map(s => <option key={s} value={s}>{s ? `Status: ${s}` : 'All Statuses'}</option>)}
        </select>
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
                        {u.role || '—'}
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
                      {isSelf ? (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>You</span>
                      ) : (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap' }}>
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
                        </div>
                      )}
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

  useEffect(() => { load(); }, []);

  // ── Apply date + type + search filters ──
  const { from, to } = getRange();

  const inRange = (dateStr: string) => {
    if (!dateStr) return false;
    const d = dateStr.slice(0, 10);
    if (from && d < from) return false;
    if (to   && d > to)   return false;
    return true;
  };

  const logs = allLogs.filter(l => {
    if (!inRange(l.createdAt)) return false;
    if (typeFilter && l.analysisType !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.analysisType?.toLowerCase().includes(q) ||
        l.analysisOutcome?.toLowerCase().includes(q) ||
        l.userId?.includes(q)
      );
    }
    return true;
  });

  const credits = allCredits.filter(l => inRange(l.usedAt || l.createdAt));

  // ── All unique analysis types for filter dropdown ──
  const allTypes = Array.from(new Set(allLogs.map(l => l.analysisType).filter(Boolean))).sort();

  // ── Aggregates from filtered logs ──
  const totalRs      = logs.reduce((a, l) => a + (l.chargesInRs     || 0), 0);
  const totalUsd     = logs.reduce((a, l) => a + (l.chargesInDollar || 0), 0);
  const totalIn      = logs.reduce((a, l) => a + (l.inputToken      || 0), 0);
  const totalOut     = logs.reduce((a, l) => a + (l.outputToken     || 0), 0);
  const totalCred    = logs.reduce((a, l) => a + (l.credit          || 0), 0);
  const avgCost      = logs.length ? totalRs / logs.length : 0;

  // ── Per-type breakdown (filtered) ──
  const byType: Record<string, { count: number; rs: number; tokens: number }> = {};
  logs.forEach(l => {
    const t = l.analysisType || 'Unknown';
    if (!byType[t]) byType[t] = { count: 0, rs: 0, tokens: 0 };
    byType[t].count++;
    byType[t].rs     += l.chargesInRs || 0;
    byType[t].tokens += (l.inputToken || 0) + (l.outputToken || 0);
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
    const d = l.createdAt?.slice(0, 10);
    if (d && dailyMap[d] !== undefined) {
      dailyMap[d].rs    += l.chargesInRs || 0;
      dailyMap[d].calls += 1;
    }
  });
  const dailyData = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date: date.slice(5), rs: +v.rs.toFixed(4), calls: v.calls }));

  // ── Per-user cost (filtered) ──
  const byUser: Record<string, { count: number; rs: number }> = {};
  logs.forEach(l => {
    const u = l.userId?.slice(0, 10) + '…' || 'Unknown';
    if (!byUser[u]) byUser[u] = { count: 0, rs: 0 };
    byUser[u].count++;
    byUser[u].rs += l.chargesInRs || 0;
  });
  const userData = Object.entries(byUser)
    .map(([userId, v]) => ({ userId, ...v }))
    .sort((a, b) => b.rs - a.rs)
    .slice(0, 10);

  const PIE_COLORS = ['#3dbf96', '#5bc8e0', '#9f7aea', '#ed8936', '#e53e3e', '#f59e0b'];
  const tt = { contentStyle: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, color: 'var(--text-primary)' } };

  const btnStyle = (active: boolean) => ({
    padding: '7px 16px', borderRadius: 9, fontSize: 13, fontWeight: 700,
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
            {logs.length} records · {rangeLabel}
          </div>
        </div>
        <button className={styles.refreshBtn} onClick={load}>
          <RefreshCw size={14} className={loading ? styles.spinning : ''} />
        </button>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* ── Filter bar ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14 }}>
        {/* Preset buttons */}
        <div style={{ display: 'flex', gap: 6 }}>
          {(['today', '7d', '30d', 'custom'] as const).map(p => (
            <button key={p} style={btnStyle(preset === p)} onClick={() => setPreset(p)}>
              {p === 'today' ? 'Today' : p === '7d' ? 'Last 7d' : p === '30d' ? 'Last 30d' : 'Custom'}
            </button>
          ))}
        </div>

        {/* Custom date pickers */}
        {preset === 'custom' && (
          <>
            <input type="date" value={dateFrom} max={dateTo || today}
              onChange={e => setDateFrom(e.target.value)}
              style={{ padding: '7px 10px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13 }} />
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>→</span>
            <input type="date" value={dateTo} min={dateFrom} max={today}
              onChange={e => setDateTo(e.target.value)}
              style={{ padding: '7px 10px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13 }} />
          </>
        )}

        {/* Analysis type filter */}
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>
          <option value="">All Types</option>
          {allTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        {/* Search */}
        <input placeholder="Search type / outcome / user…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 160, padding: '7px 12px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13 }} />

        {/* Clear */}
        {(typeFilter || search) && (
          <button onClick={() => { setTypeFilter(''); setSearch(''); }}
            style={{ padding: '7px 12px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--danger)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            Clear ×
          </button>
        )}
      </div>

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
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>—</td>
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
                  {logs.slice(0, 100).map((l: any) => (
                    <tr key={l.id}>
                      <td><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'var(--accent-light)', color: 'var(--accent)', fontWeight: 700 }}>{l.analysisType}</span></td>
                      <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: 12 }} title={l.analysisOutcome}>{l.analysisOutcome}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{l.inputToken} / {l.outputToken}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent)' }}>₹{(l.chargesInRs || 0).toFixed(4)}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>${(l.chargesInDollar || 0).toFixed(4)}</td>
                      <td style={{ color: '#9f7aea', fontWeight: 600 }}>{(l.credit || 0).toFixed(4)}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 11, whiteSpace: 'nowrap' }}>
                        {l.createdAt ? new Date(l.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                    </tr>
                  ))}
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
                <thead><tr><th>User ID</th><th>Action</th><th>Credits</th><th>Used At</th></tr></thead>
                <tbody>
                  {credits.map((c: any) => (
                    <tr key={c.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{c.userId?.slice(0, 20)}…</td>
                      <td><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: '#9f7aea20', color: '#9f7aea', fontWeight: 700 }}>{c.action}</span></td>
                      <td style={{ fontWeight: 700, color: '#9f7aea' }}>{c.credit}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 11 }}>{(c.usedAt || c.createdAt) ? new Date(c.usedAt || c.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    </tr>
                  ))}
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

  useEffect(() => { load(); }, [selectedPlan]);

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
    const isBoolean = ['enabled', 'active', 'is_active', 'popular'].includes(col) && typeof val === 'boolean';
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
            { label: 'API Docs', url: 'http://localhost:8000/docs' },
            { label: 'Health Metrics', url: 'http://localhost:8000/api/v1/report/health-metrics' },
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
  const [form, setForm] = useState({ subject: '', message: '', targetPlan: 'all' });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true); setResult('');
    try {
      if (!user?.userId) throw new Error('Admin user session not found.');

      const recipients: any[] = [];
      let page = 1;
      let total = 0;
      do {
        const res = await api.admin.listUsers({
          page,
          pageSize: 100,
          plan: form.targetPlan === 'all' ? undefined : form.targetPlan,
          role: 'user',
          status: 'active',
        });
        const users = Array.isArray(res?.users) ? res.users : [];
        recipients.push(...users);
        total = Number(res?.total || users.length);
        page++;
      } while (recipients.length < total);

      if (recipients.length === 0) {
        setResult('Error: No active users found for this target plan.');
        return;
      }

      const message = `${form.subject.trim()}\n\n${form.message.trim()}`.slice(0, 2000);
      const sends = await Promise.allSettled(
        recipients.map(recipient =>
          api.messages.send({
            from_user_id: user.userId,
            to_user_id: recipient.id,
            message,
          })
        )
      );
      const sent = sends.filter(r => r.status === 'fulfilled').length;
      const failed = sends.length - sent;

      setResult(failed ? `Broadcast sent to ${sent} user(s); ${failed} failed.` : `Broadcast sent to ${sent} user(s)!`);
      setForm({ subject: '', message: '', targetPlan: 'all' });
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Target Plan</label>
            <select value={form.targetPlan} onChange={e => setForm({ ...form, targetPlan: e.target.value })}>
              <option value="all">All Users</option>
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
  return (
    <div className={styles.page}>
      <div className={styles.sectionTitle}>Admin Settings</div>
      <div className={styles.infoCard}>
        <div className={styles.infoTitle}>API Configuration</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
          {[
            { label: 'API Base URL', value: 'http://localhost:8000' },
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
          <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer"
            style={{ padding: '9px 18px', background: 'var(--accent)', color: '#fff', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>
            Open API Docs →
          </a>
        </div>
      </div>
    </div>
  );
}
