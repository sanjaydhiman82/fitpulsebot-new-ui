import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../App';
import PortalLayout, {
  SectionHeader, PrimaryBtn, OutlineBtn, StatusBadge,
  Modal, FormField, inputStyle, DataTable,
} from '../components/PortalLayout';
import BranchDetailPanel from '../components/BranchDetailPanel';
import { api } from '../api';
import {
  LayoutDashboard, GitBranch, Palette, Users, Plus, Edit2,
  Trash2, RefreshCw, Loader, TicketCheck, Eye,
  IndianRupee, UserCheck, Building2, CalendarCheck, TrendingUp,
  CreditCard, AlertTriangle, Bell, Dumbbell, Salad, Ruler,
  MessageSquare, FileText, Trophy,
} from 'lucide-react';
import AdvancedBrandingEditor from '../components/AdvancedBrandingEditor';
import { BrandingProvider } from '../contexts/BrandingContext';
import { LabelProvider, useLabels } from '../contexts/LabelContext';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { id: 'branches', label: 'Branches', icon: <GitBranch size={16} /> },
  { id: 'branding', label: 'Branding', icon: <Palette size={16} /> },
];

const field = (row: any, camel: string, snake: string) => row?.[camel] ?? row?.[snake];
const addressText = (address: any) => {
  if (!address) return '';
  if (typeof address === 'string') return address;
  return [address.line1, address.city, address.state, address.country, address.pincode].filter(Boolean).join(', ');
};
const num = (v: any) => Number.isFinite(Number(v)) ? Number(v) : 0;
const money = (v: any) => `₹${Math.round(num(v)).toLocaleString('en-IN')}`;

function MiniBars({ data, color = '#22c55e', height = 120 }: { data: any[]; color?: string; height?: number }) {
  const max = Math.max(...data.map(d => num(d.value)), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height }}>
      {data.map((d, i) => {
        const h = Math.max(6, Math.round((num(d.value) / max) * (height - 24)));
        return (
          <div key={i} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color }}>{Math.round(num(d.value))}{color === '#22c55e' ? '%' : ''}</div>
            <div style={{ height: h, background: color, borderRadius: '5px 5px 0 0', marginTop: 4 }} />
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 5 }}>{d.label}</div>
          </div>
        );
      })}
    </div>
  );
}

function Donut({ pct, label, sub, color = '#22c55e', size = 132 }: { pct: number; label: string; sub: string; color?: string; size?: number }) {
  const r = (size - 18) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--metric-bg)" strokeWidth={18} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={18} strokeLinecap="round" strokeDasharray={`${c * pct / 100} ${c}`} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 900 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</div>
      </div>
    </div>
  );
}

// BrandingEditor replaced by AdvancedBrandingEditor

// ─── Branch Form ─────────────────────────────────────────
function BranchModal({ open, onClose, orgId, branch, onSaved }: {
  open: boolean; onClose: () => void; orgId: string; branch?: any; onSaved: () => void;
}) {
  const editing = !!branch;
  const [form, setForm] = useState({ name: '', code: '', contactEmail: '', contactPhone: '', city: '', line1: '', state: '', pincode: '', mgrEmail: '', mgrFirst: '', mgrLast: '', mgrPw: 'TempPassword@123' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (branch) setForm(f => ({
      ...f,
      name: branch.name,
      code: branch.code,
      contactEmail: field(branch, 'contactEmail', 'contact_email') || '',
      contactPhone: field(branch, 'contactPhone', 'contact_phone') || '',
      line1: branch.address?.line1 || '',
      city: branch.address?.city || '',
      state: branch.address?.state || '',
      pincode: branch.address?.pincode || '',
      mgrEmail: field(branch, 'managerUserName', 'manager_user_name') || '',
      mgrFirst: '',
      mgrLast: '',
      mgrPw: 'TempPassword@123',
    }));
    else setForm({ name: '', code: '', contactEmail: '', contactPhone: '', city: '', line1: '', state: '', pincode: '', mgrEmail: '', mgrFirst: '', mgrLast: '', mgrPw: 'TempPassword@123' });
    setErr('');
  }, [branch, open]);

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    setErr(''); setLoading(true);
    try {
      if (editing) {
        const payload: any = {
          name: form.name,
          contactEmail: form.contactEmail,
          contactPhone: form.contactPhone,
          status: branch.status,
          timezone: 'Asia/Kolkata',
          address: { line1: form.line1, city: form.city, state: form.state, country: 'IN', pincode: form.pincode },
        };
        const currentManager = field(branch, 'managerUserName', 'manager_user_name') || '';
        if (form.mgrEmail && (form.mgrEmail !== currentManager || form.mgrFirst || form.mgrLast)) {
          payload.managerUser = {
            userName: form.mgrEmail,
            firstName: form.mgrFirst,
            lastName: form.mgrLast,
            phone: '',
            temporaryPassword: form.mgrPw || 'TempPassword@123',
            sendWelcome: true,
          };
        }
        await api.branch.update(branch.id, payload);
      } else {
        await api.org.createBranch(orgId, {
          branch: { name: form.name, code: form.code, contactEmail: form.contactEmail, contactPhone: form.contactPhone, timezone: 'Asia/Kolkata', address: { line1: form.line1, city: form.city, state: form.state, country: 'IN', pincode: form.pincode } },
          managerUser: { userName: form.mgrEmail, firstName: form.mgrFirst, lastName: form.mgrLast, phone: '', temporaryPassword: form.mgrPw, sendWelcome: true },
        });
      }
      onSaved(); onClose();
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Branch' : 'New Branch'} width={540}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FormField label="Branch Name" required><input style={inputStyle} value={form.name} onChange={f('name')} placeholder="Indiranagar" /></FormField>
        {!editing && <FormField label="Code" required><input style={inputStyle} value={form.code} onChange={f('code')} placeholder="IND" /></FormField>}
        <FormField label="Contact Email"><input style={inputStyle} value={form.contactEmail} onChange={f('contactEmail')} /></FormField>
        <FormField label="Contact Phone"><input style={inputStyle} value={form.contactPhone} onChange={f('contactPhone')} /></FormField>
        <FormField label="Address"><input style={inputStyle} value={form.line1} onChange={f('line1')} placeholder="100 Feet Road" /></FormField>
        <FormField label="City"><input style={inputStyle} value={form.city} onChange={f('city')} placeholder="Bengaluru" /></FormField>
      </div>
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>Branch Manager Account</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Manager Email" required={!editing}><input style={inputStyle} value={form.mgrEmail} onChange={f('mgrEmail')} placeholder="manager@example.com" /></FormField>
          <FormField label="First Name"><input style={inputStyle} value={form.mgrFirst} onChange={f('mgrFirst')} /></FormField>
          <FormField label="Last Name"><input style={inputStyle} value={form.mgrLast} onChange={f('mgrLast')} /></FormField>
          <FormField label={editing ? 'Temp Password (new manager)' : 'Temp Password'}><input style={inputStyle} value={form.mgrPw} onChange={f('mgrPw')} /></FormField>
        </div>
        {editing && <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 8 }}>Change the manager email to assign an existing or new branch manager to this branch.</div>}
      </div>
      {err && <p style={{ color: 'var(--danger)', fontSize: 12 }}>{err}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <OutlineBtn onClick={onClose}>Cancel</OutlineBtn>
        <PrimaryBtn onClick={submit} loading={loading}>{editing ? 'Save' : 'Create Branch'}</PrimaryBtn>
      </div>
    </Modal>
  );
}

function QuickUserModal({ open, onClose, orgId, branches, type, onSaved }: {
  open: boolean; onClose: () => void; orgId: string; branches: any[]; type: 'MEMBER' | 'TRAINER'; onSaved: () => void;
}) {
  const [form, setForm] = useState({ branchId: '', userName: '', firstName: '', lastName: '', phone: '', temporaryPassword: 'TempPassword@123' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (open) {
      setForm({ branchId: branches[0]?.id || '', userName: '', firstName: '', lastName: '', phone: '', temporaryPassword: 'TempPassword@123' });
      setErr('');
    }
  }, [open, branches]);

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    if (!form.branchId) { setErr('Select a branch first.'); return; }
    if (!form.userName) { setErr('Email / username is required.'); return; }
    setErr(''); setLoading(true);
    try {
      await api.branch.createUser(form.branchId, {
        type,
        user: {
          userName: form.userName,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          temporaryPassword: form.temporaryPassword,
          sendWelcome: true,
        },
      });
      onSaved(); onClose();
    } catch (e: any) { setErr(e.message || `Failed to add ${type.toLowerCase()}.`); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Add ${type === 'MEMBER' ? 'Member' : 'Trainer'}`} width={540}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FormField label="Branch" required>
          <select style={inputStyle} value={form.branchId} onChange={f('branchId')}>
            <option value="">Select branch...</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </FormField>
        <FormField label="Email / Username" required><input style={inputStyle} value={form.userName} onChange={f('userName')} /></FormField>
        <FormField label="First Name"><input style={inputStyle} value={form.firstName} onChange={f('firstName')} /></FormField>
        <FormField label="Last Name"><input style={inputStyle} value={form.lastName} onChange={f('lastName')} /></FormField>
        <FormField label="Phone"><input style={inputStyle} value={form.phone} onChange={f('phone')} /></FormField>
        <FormField label="Temp Password"><input style={inputStyle} value={form.temporaryPassword} onChange={f('temporaryPassword')} /></FormField>
      </div>
      {err && <p style={{ color: 'var(--danger)', fontSize: 12 }}>{err}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <OutlineBtn onClick={onClose}>Cancel</OutlineBtn>
        <PrimaryBtn onClick={submit} loading={loading}>Add {type === 'MEMBER' ? 'Member' : 'Trainer'}</PrimaryBtn>
      </div>
    </Modal>
  );
}

function QuickMessageModal({ open, onClose, branches, currentUserId }: {
  open: boolean; onClose: () => void; branches: any[]; currentUserId?: string;
}) {
  const [branchId, setBranchId] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [toUserId, setToUserId] = useState('');
  const [message, setMessage] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (open) {
      setBranchId(branches[0]?.id || '');
      setToUserId('');
      setMessage('');
      setErr('');
    }
  }, [open, branches]);

  useEffect(() => {
    if (!open || !branchId) { setUsers([]); return; }
    setLoadingUsers(true);
    Promise.all([
      api.branch.listUsers(branchId, { type: 'MEMBER', pageSize: 100 }),
      api.branch.listUsers(branchId, { type: 'TRAINER', pageSize: 100 }),
    ]).then(([m, t]) => setUsers([...(m.users || []), ...(t.users || [])]))
      .catch((e: any) => setErr(e.message || 'Failed to load branch users.'))
      .finally(() => setLoadingUsers(false));
  }, [open, branchId]);

  const userLabel = (u: any) => {
    const firstName = field(u, 'firstName', 'first_name') || '';
    const lastName = field(u, 'lastName', 'last_name') || '';
    const userName = field(u, 'userName', 'user_name') || '';
    return `${firstName} ${lastName}`.trim() || userName || 'Unnamed user';
  };

  const submit = async () => {
    if (!currentUserId) { setErr('Current user id is missing.'); return; }
    if (!toUserId) { setErr('Select a recipient.'); return; }
    if (!message.trim()) { setErr('Message is required.'); return; }
    setErr(''); setSending(true);
    try {
      await api.messages.send({ from_user_id: currentUserId, to_user_id: toUserId, message: message.trim() });
      onClose();
    } catch (e: any) { setErr(e.message || 'Failed to send message.'); }
    finally { setSending(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Send Message" width={520}>
      <FormField label="Branch" required>
        <select style={inputStyle} value={branchId} onChange={e => setBranchId(e.target.value)}>
          <option value="">Select branch...</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </FormField>
      <FormField label="Recipient" required>
        <select style={inputStyle} value={toUserId} onChange={e => setToUserId(e.target.value)} disabled={loadingUsers}>
          <option value="">{loadingUsers ? 'Loading users...' : 'Select recipient...'}</option>
          {users.map(u => <option key={field(u, 'userId', 'user_id')} value={field(u, 'userId', 'user_id')}>{userLabel(u)}</option>)}
        </select>
      </FormField>
      <FormField label="Message" required>
        <textarea style={{ ...inputStyle, minHeight: 110, resize: 'vertical' }} value={message} onChange={e => setMessage(e.target.value)} />
      </FormField>
      {err && <p style={{ color: 'var(--danger)', fontSize: 12 }}>{err}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <OutlineBtn onClick={onClose}>Cancel</OutlineBtn>
        <PrimaryBtn onClick={submit} loading={sending}>Send Message</PrimaryBtn>
      </div>
    </Modal>
  );
}

// ─── Org Dashboard ───────────────────────────────────────
export default function OrgDashboard() {
  const { user } = useApp();
  const orgId = user?.organizationId || '';
  return (
    <BrandingProvider orgId={orgId}>
      <LabelProvider organizationId={orgId}>
        <OrgDashboardInner orgId={orgId} />
      </LabelProvider>
    </BrandingProvider>
  );
}

function OrgDashboardInner({ orgId }: { orgId: string }) {
  const { user } = useApp();
  const { t } = useLabels();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dash, setDash] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editBranch, setEditBranch] = useState<any>(null);
  const [detailBranch, setDetailBranch] = useState<any>(null);
  const [quickUserType, setQuickUserType] = useState<'MEMBER' | 'TRAINER' | null>(null);
  const [messageOpen, setMessageOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const loadDash = useCallback(() => {
    if (!orgId) return;
    api.org.getDashboard(orgId).then(setDash).catch(() => {});
  }, [orgId]);

  const loadBranches = useCallback(() => {
    if (!orgId) return;
    setLoading(true);
    api.org.listBranches(orgId, { pageSize: 50 }).then(d => setBranches(d.branches || [])).finally(() => setLoading(false));
  }, [orgId]);

  useEffect(() => { loadDash(); }, [loadDash]);
  useEffect(() => { if (activeTab === 'branches') loadBranches(); }, [activeTab, loadBranches]);
  useEffect(() => { if (activeTab !== 'branches') setDetailBranch(null); }, [activeTab]);

  const ensureBranches = useCallback(async () => {
    if (branches.length) return branches;
    if (!orgId) return [];
    const data = await api.org.listBranches(orgId, { pageSize: 100 });
    const next = data.branches || [];
    setBranches(next);
    return next;
  }, [branches, orgId]);

  const handleQuickAction = async (label: string) => {
    if (label === 'Add Branch') {
      setEditBranch(null);
      setModalOpen(true);
      return;
    }
    if (label === 'Add Trainer' || label === 'Add Member') {
      const next = await ensureBranches();
      if (!next.length) {
        setNotice('Create a branch before adding members or trainers.');
        return;
      }
      setQuickUserType(label === 'Add Trainer' ? 'TRAINER' : 'MEMBER');
      return;
    }
    if (label === 'Reports') {
      window.print();
      return;
    }
    if (label === 'Message') {
      const next = await ensureBranches();
      if (!next.length) {
        setNotice('Create a branch before sending messages.');
        return;
      }
      setMessageOpen(true);
      return;
    }
    if (label === 'Create Plan') {
      setNotice('Plan/package management is not available in the organization portal yet. Use the platform Admin Plans screen for global plans.');
    }
  };

  const deleteBranch = async (b: any) => {
    if (!window.confirm(`Deactivate branch "${b.name}"?`)) return;
    await api.branch.delete(b.id);
    loadBranches();
  };

  const counts = dash?.counts || {};
  const kpis = dash?.kpis || {};
  const membershipStatuses: any[] = dash?.membershipOverview?.statuses || [];
  const memberTotal = num(kpis.totalMembers ?? counts.members);
  const activeMembers = num(kpis.activeMembers ?? counts.activeMembers);
  const membershipPct = memberTotal ? Math.round((activeMembers / memberTotal) * 100) : 0;
  const ticketStatuses = dash?.supportTickets?.statuses || {};
  const pending = dash?.pendingTasks || {};
  const navItems = NAV.map(item => ({
    ...item,
    label: t(`org.menu.${item.id}`, item.label),
  }));

  return (
    <PortalLayout
      title={t('org.portal.title', 'Organization Portal')} subtitle={t('org.dashboard.title', 'Admin Dashboard')}
      accentColor="#0ea5e9"
      navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab}
      roleBadge="ORG ADMIN" roleBadgeColor="#0ea5e9"
    >
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px' }}>{t('org.dashboard.title', 'Admin Dashboard')}</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>{t('org.dashboard.subtitle', 'Overview of your organization performance')}</p>
            </div>
            <OutlineBtn onClick={loadDash}><RefreshCw size={13} /> Refresh</OutlineBtn>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 10 }}>
            {[
              { label: 'Total Revenue (This Month)', value: money(kpis.totalRevenueMonth), icon: <IndianRupee size={20} />, color: '#8b5cf6', sub: `${kpis.revenueGrowthPercent || 0}% vs last month` },
              { label: 'Total Members', value: kpis.totalMembers ?? counts.members ?? 0, icon: <Users size={20} />, color: '#3b82f6', sub: 'All active records' },
              { label: 'Active Members', value: kpis.activeMembers ?? counts.activeMembers ?? 0, icon: <UserCheck size={20} />, color: '#65a30d', sub: `${membershipPct}% engaged` },
              { label: 'Total Trainers', value: kpis.totalTrainers ?? counts.trainers ?? 0, icon: <Dumbbell size={20} />, color: '#f97316', sub: 'Active trainers' },
              { label: 'Total Branches', value: kpis.totalBranches ?? counts.branches ?? 0, icon: <Building2 size={20} />, color: '#0ea5e9', sub: 'No change' },
              { label: 'Check-ins Today', value: kpis.checkinsToday ?? counts.checkinsToday ?? 0, icon: <CalendarCheck size={20} />, color: '#14b8a6', sub: 'Across branches' },
            ].map(card => (
              <div key={card.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: `${card.color}18`, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>{card.icon}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{card.label}</div>
                <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>{card.value}</div>
                <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 800, marginTop: 4 }}>↑ {card.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.85fr 0.95fr', gap: 12 }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 18 }}>
              <SectionHeader title="Revenue Overview" />
              <MiniBars data={dash?.revenueOverview || []} color="#8b5cf6" height={150} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 14 }}>
                {[
                  ['Total Revenue', money(kpis.totalRevenueMonth)],
                  ['Collection', money(dash?.financeSummary?.totalCollection)],
                  ['Pending Payments', money(dash?.financeSummary?.pendingPayments)],
                ].map(([l, v]) => <div key={l} style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 8, padding: 10 }}><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l}</div><strong>{v}</strong></div>)}
              </div>
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 18 }}>
              <SectionHeader title="Membership Overview" />
              <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
                <Donut pct={membershipPct} label={String(memberTotal)} sub="Total Members" />
                <div style={{ flex: 1 }}>
                  {membershipStatuses.map((s, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '7px 0' }}><span style={{ color: 'var(--text-secondary)' }}>{s.status}</span><strong>{s.count}</strong></div>)}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12, textAlign: 'center' }}>
                <div><div style={{ fontSize: 18, fontWeight: 900 }}>{dash?.membershipOverview?.newMembers || 0}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>New Members</div></div>
                <div><div style={{ fontSize: 18, fontWeight: 900 }}>{dash?.membershipOverview?.cancelledMembers || 0}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cancelled Members</div></div>
              </div>
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 18 }}>
              <SectionHeader title="Membership Status" />
              {membershipStatuses.map((s, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}><span>{s.status}</span><strong>{s.count}</strong></div>)}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}><span>Total Members</span><strong style={{ fontSize: 20 }}>{memberTotal}</strong></div>
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 18 }}>
              <SectionHeader title="Top Performing Branches" />
              {(dash?.topBranches || []).map((b: any, i: number) => <div key={b.branchId || i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}><span><strong>{i + 1}.</strong> {b.name}</span><strong>{money(b.revenue)}</strong></div>)}
              <OutlineBtn onClick={() => setActiveTab('branches')} style={{ width: '100%', marginTop: 12 }}>View All Branches</OutlineBtn>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.8fr 0.95fr', gap: 12 }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 18 }}>
              <SectionHeader title="Attendance Overview" />
              <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
                <Donut pct={num(dash?.attendanceOverview?.percent)} label={`${Math.round(num(dash?.attendanceOverview?.percent))}%`} sub="Overall" color="#65a30d" />
                <div style={{ flex: 1 }}><MiniBars data={dash?.attendanceOverview?.weekly || []} color="#65a30d" height={120} /></div>
              </div>
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 18 }}>
              <SectionHeader title="New Registrations" />
              <div style={{ fontSize: 28, fontWeight: 900 }}>{dash?.membershipOverview?.newMembers || 0}</div>
              <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 800, marginBottom: 10 }}>New members this month</div>
              <MiniBars data={dash?.newRegistrations || []} color="#8b5cf6" height={120} />
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 18 }}>
              <SectionHeader title="Revenue by Branch" />
              {(dash?.revenueByBranch || []).slice(0, 5).map((b: any, i: number) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}><span>{b.label}</span><strong>{money(b.value)}</strong></div>)}
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 18 }}>
              <SectionHeader title="Recent Transactions" />
              {(dash?.recentTransactions || []).slice(0, 6).map((t: any, i: number) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}><span>{t.memberName}<div style={{ color: 'var(--text-muted)', fontSize: 10 }}>{t.status}</div></span><strong>{money(t.amount)}</strong></div>)}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.85fr 0.85fr 0.85fr', gap: 12 }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 18 }}>
              <SectionHeader title="Top Performing Trainers" />
              {(dash?.topTrainers || []).map((t: any, i: number) => <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 100px 50px', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}><span>{t.trainerName}</span><span>{t.sessions}</span><span>{money(t.revenue)}</span><strong>{t.rating} ★</strong></div>)}
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 18 }}>
              <SectionHeader title="Pending Tasks" />
              {[
                ['Trainer Approvals', pending.trainerApprovals, <Users size={14} />],
                ['Membership Approvals', pending.membershipApprovals, <CreditCard size={14} />],
                ['Diet Plan Reviews', pending.dietPlanReviews, <Salad size={14} />],
                ['Measurement Reviews', pending.measurementReviews, <Ruler size={14} />],
                ['Support Tickets', pending.supportTickets, <TicketCheck size={14} />],
              ].map(([l, v, icon]: any) => <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}><span style={{ display: 'flex', gap: 8 }}>{icon}{l}</span><strong>{v || 0}</strong></div>)}
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 18 }}>
              <SectionHeader title="Support Tickets" />
              <Donut pct={num(dash?.supportTickets?.open) + num(dash?.supportTickets?.resolved) ? Math.round(num(dash?.supportTickets?.resolved) * 100 / (num(dash?.supportTickets?.open) + num(dash?.supportTickets?.resolved))) : 0} label={String(Object.values(ticketStatuses).reduce((a: any, b: any) => a + num(b), 0))} sub="Total Tickets" color="#f97316" />
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 18 }}>
              <SectionHeader title="Quick Actions" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[
                  [<Building2 size={18} />, 'Add Branch'], [<Users size={18} />, 'Add Trainer'], [<UserCheck size={18} />, 'Add Member'],
                  [<CreditCard size={18} />, 'Create Plan'], [<FileText size={18} />, 'Reports'], [<MessageSquare size={18} />, 'Message'],
                ].map(([icon, label]: any) => (
                  <button
                    key={label}
                    onClick={() => handleQuickAction(label)}
                    style={{ minHeight: 66, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', fontSize: 11 }}
                  >
                    {icon}{label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 18 }}>
            <SectionHeader title="Key Insights" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16 }}>
              {[
                [<TrendingUp size={18} />, 'Revenue Growth', `${dash?.keyInsights?.revenueGrowthPercent || 0}% compared to last month.`],
                [<Users size={18} />, 'Member Engagement', `${dash?.keyInsights?.memberEngagementPercent || 0}% members are active.`],
                [<AlertTriangle size={18} />, 'Attendance Alert', `${Math.round(num(dash?.attendanceOverview?.percent))}% attendance this week.`],
                [<Bell size={18} />, 'Pending Reviews', `${dash?.keyInsights?.pendingReviews || 0} reviews are pending.`],
                [<Trophy size={18} />, 'Top Branch', dash?.keyInsights?.topBranch?.name ? `${dash.keyInsights.topBranch.name} is top branch.` : 'No branch revenue yet.'],
              ].map(([icon, title, body]: any) => <div key={title} style={{ display: 'flex', gap: 12, alignItems: 'center' }}><div style={{ color: 'var(--accent)' }}>{icon}</div><div><div style={{ fontSize: 12, fontWeight: 900 }}>{title}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{body}</div></div></div>)}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'branches' && (
        detailBranch ? (
          <BranchDetailPanel
            branchId={detailBranch.id}
            branch={detailBranch}
            title="Branch Detail"
            onBack={() => setDetailBranch(null)}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Branches</h2>
              <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>{branches.length} total</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <OutlineBtn onClick={loadBranches}><RefreshCw size={13} /></OutlineBtn>
              <PrimaryBtn onClick={() => { setEditBranch(null); setModalOpen(true); }}>
                <Plus size={14} /> New Branch
              </PrimaryBtn>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}><Loader size={20} style={{ animation: 'spin 1s linear infinite' }} /></div>
          ) : (
            <DataTable
              columns={[
                {
                  key: 'name', label: 'Branch', render: r => (
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.code}</div>
                    </div>
                  )
                },
                {
                  key: 'contact', label: 'Contact', render: r => (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                      <div>{field(r, 'contactEmail', 'contact_email') || '-'}</div>
                      <div>{field(r, 'contactPhone', 'contact_phone') || '-'}</div>
                    </div>
                  )
                },
                { key: 'address', label: 'Address', render: r => <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{addressText(r.address) || '-'}</span> },
                { key: 'managerUserName', label: 'Manager', render: r => field(r, 'managerUserName', 'manager_user_name') || '-' },
                { key: 'memberCount', label: 'Members', render: r => field(r, 'memberCount', 'member_count') || 0 },
                { key: 'trainerCount', label: 'Trainers', render: r => field(r, 'trainerCount', 'trainer_count') || 0 },
                { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
                {
                  key: 'actions', label: 'Actions', render: r => (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => setDetailBranch(r)}
                        aria-label={`View ${r.name}`}
                        title="View branch details"
                        style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9', background: 'rgba(14,165,233,0.1)', border: 'none', cursor: 'pointer' }}
                      ><Eye size={12} /></button>
                      <button onClick={() => { setEditBranch(r); setModalOpen(true); }} style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', background: 'var(--accent-light)', border: 'none', cursor: 'pointer' }}><Edit2 size={12} /></button>
                      <button onClick={() => deleteBranch(r)} style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', background: 'rgba(229,62,62,0.08)', border: 'none', cursor: 'pointer' }}><Trash2 size={12} /></button>
                    </div>
                  )
                },
              ]}
              rows={branches}
            />
          )}
        </div>
        )
      )}

      {activeTab === 'branding' && orgId && (
        <AdvancedBrandingEditor orgId={orgId} isOrg={true} />
      )}
      <BranchModal
        open={modalOpen} onClose={() => setModalOpen(false)}
        orgId={orgId} branch={editBranch}
        onSaved={() => { loadBranches(); loadDash(); }}
      />
      <QuickUserModal
        open={!!quickUserType}
        onClose={() => setQuickUserType(null)}
        orgId={orgId}
        branches={branches}
        type={quickUserType || 'MEMBER'}
        onSaved={() => { loadBranches(); loadDash(); }}
      />
      <QuickMessageModal
        open={messageOpen}
        onClose={() => setMessageOpen(false)}
        branches={branches}
        currentUserId={user?.userId}
      />
      <Modal open={!!notice} onClose={() => setNotice('')} title="Quick Action" width={420}>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5 }}>{notice}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <PrimaryBtn onClick={() => setNotice('')}>OK</PrimaryBtn>
        </div>
      </Modal>
    </PortalLayout>
  );
}
