import React, { useState, useEffect, useCallback } from 'react';
import PortalLayout, {
  StatCard, SectionHeader, PrimaryBtn, OutlineBtn, StatusBadge,
  Modal, FormField, inputStyle, DataTable, GRID4,
} from '../components/PortalLayout';
import { api } from '../api';
import {
  LayoutDashboard, Building2, GitBranch, Plus, Edit2, Trash2,
  Users, RefreshCw, Search, Loader, CheckCircle2, Mail, Phone, MapPin,
  ChevronUp, ChevronRight,
} from 'lucide-react';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { id: 'organizations', label: 'Organizations', icon: <Building2 size={16} /> },
];

// ─── Types ───────────────────────────────────────────────
interface Org {
  id: string; name: string; code: string; status: string;
  ownerUserName?: string; owner_user_name?: string;
  contactEmail?: string; contact_email?: string;
  contactPhone?: string; contact_phone?: string;
  address?: any;
  branchCount?: number; branch_count?: number;
  memberCount?: number; member_count?: number;
  resourceCount?: number; resource_count?: number;
  createdAt?: string; created_at?: string;
}

const field = (row: any, camel: string, snake: string) => row?.[camel] ?? row?.[snake];
const addressText = (address: any) => {
  if (!address) return '';
  if (typeof address === 'string') return address;
  return [address.line1, address.city, address.state, address.country, address.pincode].filter(Boolean).join(', ');
};
const orgControlStyle: React.CSSProperties = {
  ...inputStyle,
  height: 46,
  minHeight: 46,
  paddingTop: 0,
  paddingBottom: 0,
};

// ─── Org Form Modal ──────────────────────────────────────
function OrgFormModal({ open, onClose, org, onSaved }: {
  open: boolean; onClose: () => void; org?: Org | null; onSaved: () => void;
}) {
  const editing = !!org;
  const [form, setForm] = useState({
    orgName: '', orgCode: '', contactEmail: '', contactPhone: '',
    line1: '', city: '', state: '', country: 'IN', pincode: '',
    adminEmail: '', adminFirst: '', adminLast: '', adminPhone: '', adminPw: 'TempPassword@123',
    sendWelcome: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (org) {
      const address = org.address || {};
      setForm(f => ({
        ...f,
        orgName: org.name,
        orgCode: org.code,
        contactEmail: field(org, 'contactEmail', 'contact_email') || '',
        contactPhone: field(org, 'contactPhone', 'contact_phone') || '',
        line1: address.line1 || '',
        city: address.city || '',
        state: address.state || '',
        country: address.country || 'IN',
        pincode: address.pincode || '',
      }));
    } else {
      setForm({ orgName: '', orgCode: '', contactEmail: '', contactPhone: '', line1: '', city: '', state: '', country: 'IN', pincode: '', adminEmail: '', adminFirst: '', adminLast: '', adminPhone: '', adminPw: 'TempPassword@123', sendWelcome: true });
    }
    setError('');
  }, [org, open]);

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      if (editing) {
        await api.superAdmin.updateOrg(org!.id, {
          name: form.orgName, contactEmail: form.contactEmail, contactPhone: form.contactPhone, status: org!.status,
          address: { line1: form.line1, city: form.city, state: form.state, country: form.country, pincode: form.pincode },
        });
      } else {
        await api.superAdmin.createOrg({
          organization: { name: form.orgName, code: form.orgCode, contactEmail: form.contactEmail, contactPhone: form.contactPhone, address: { line1: form.line1, city: form.city, state: form.state, country: form.country, pincode: form.pincode } },
          adminUser: { userName: form.adminEmail, firstName: form.adminFirst, lastName: form.adminLast, phone: form.adminPhone, temporaryPassword: form.adminPw, sendWelcome: form.sendWelcome },
        });
      }
      onSaved(); onClose();
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Organization' : 'New Organization'} width={580}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FormField label="Org Name" required>
          <input style={inputStyle} value={form.orgName} onChange={f('orgName')} placeholder="FitPulse Organization" />
        </FormField>
        {!editing && (
          <FormField label="Org Code" required>
            <input style={inputStyle} value={form.orgCode} onChange={f('orgCode')} placeholder="FITPULSE" />
          </FormField>
        )}
        <FormField label="Contact Email">
          <input style={inputStyle} value={form.contactEmail} onChange={f('contactEmail')} placeholder="contact@organization.com" />
        </FormField>
        <FormField label="Contact Phone">
          <input style={inputStyle} value={form.contactPhone} onChange={f('contactPhone')} placeholder="+919999999999" />
        </FormField>
        <FormField label="Address Line 1">
          <input style={inputStyle} value={form.line1} onChange={f('line1')} placeholder="Main Road" />
        </FormField>
        <FormField label="City">
          <input style={inputStyle} value={form.city} onChange={f('city')} placeholder="Bengaluru" />
        </FormField>
        <FormField label="State">
          <input style={inputStyle} value={form.state} onChange={f('state')} placeholder="KA" />
        </FormField>
        <FormField label="Pincode">
          <input style={inputStyle} value={form.pincode} onChange={f('pincode')} placeholder="560001" />
        </FormField>
      </div>

      {!editing && (
        <>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Organization Admin Account
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FormField label="Admin Email" required>
                <input style={inputStyle} value={form.adminEmail} onChange={f('adminEmail')} placeholder="admin@organization.com" />
              </FormField>
              <FormField label="Admin Phone">
                <input style={inputStyle} value={form.adminPhone} onChange={f('adminPhone')} placeholder="+919999999998" />
              </FormField>
              <FormField label="First Name">
                <input style={inputStyle} value={form.adminFirst} onChange={f('adminFirst')} placeholder="Org" />
              </FormField>
              <FormField label="Last Name">
                <input style={inputStyle} value={form.adminLast} onChange={f('adminLast')} placeholder="Admin" />
              </FormField>
              <FormField label="Temp Password">
                <input style={inputStyle} value={form.adminPw} onChange={f('adminPw')} />
              </FormField>
            </div>
          </div>
        </>
      )}

      {error && <p style={{ color: 'var(--danger)', fontSize: 12, margin: 0 }}>{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <OutlineBtn onClick={onClose}>Cancel</OutlineBtn>
        <PrimaryBtn onClick={submit} loading={loading}>
          {loading && <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} />}
          {editing ? 'Save Changes' : 'Create Organization'}
        </PrimaryBtn>
      </div>
    </Modal>
  );
}

// ─── Branches sub-panel ──────────────────────────────────
function BranchesPanel({ orgId }: { orgId: string; orgName?: string }) {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editBranch, setEditBranch] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', code: '', contactEmail: '', contactPhone: '', line1: '', city: '', state: '', pincode: '', mgrEmail: '', mgrFirst: '', mgrLast: '', mgrPw: 'TempPassword@123' });
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.org.listBranches(orgId).then(d => setBranches(d.branches || [])).finally(() => setLoading(false));
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

  const openCreate = () => {
    setEditBranch(null);
    setForm({ name: '', code: '', contactEmail: '', contactPhone: '', line1: '', city: '', state: '', pincode: '', mgrEmail: '', mgrFirst: '', mgrLast: '', mgrPw: 'TempPassword@123' });
    setShowForm(true);
    setErr('');
  };

  const openEdit = (branch: any) => {
    setEditBranch(branch);
    setForm({
      name: branch.name || '',
      code: branch.code || '',
      contactEmail: field(branch, 'contactEmail', 'contact_email') || '',
      contactPhone: field(branch, 'contactPhone', 'contact_phone') || '',
      line1: branch.address?.line1 || '',
      city: branch.address?.city || '',
      state: branch.address?.state || '',
      pincode: branch.address?.pincode || '',
      mgrEmail: '',
      mgrFirst: '',
      mgrLast: '',
      mgrPw: 'TempPassword@123',
    });
    setShowForm(true);
    setErr('');
  };

  const submit = async () => {
    setErr('');
    try {
      if (editBranch) {
        await api.branch.update(editBranch.id, {
          name: form.name,
          contactEmail: form.contactEmail,
          contactPhone: form.contactPhone,
          status: editBranch.status,
          timezone: 'Asia/Kolkata',
          address: { line1: form.line1, city: form.city, state: form.state, country: 'IN', pincode: form.pincode },
        });
      } else {
        await api.org.createBranch(orgId, {
          branch: { name: form.name, code: form.code, contactEmail: form.contactEmail, contactPhone: form.contactPhone, timezone: 'Asia/Kolkata', address: { line1: form.line1, city: form.city, state: form.state, country: 'IN', pincode: form.pincode } },
          managerUser: { userName: form.mgrEmail, firstName: form.mgrFirst, lastName: form.mgrLast, phone: '', temporaryPassword: form.mgrPw, sendWelcome: true },
        });
      }
      setShowForm(false); setEditBranch(null); load();
    } catch (e: any) { setErr(e.message); }
  };

  const deleteBranch = async (branch: any) => {
    if (!window.confirm(`Deactivate branch "${branch.name}"?`)) return;
    await api.branch.delete(branch.id);
    load();
  };

  return (
    <div>
      <SectionHeader title={`Branches (${branches.length})`} action={
        <PrimaryBtn onClick={showForm ? () => setShowForm(false) : openCreate} style={{ padding: '7px 14px', fontSize: 12 }}>
          <Plus size={13} /> Add Branch
        </PrimaryBtn>
      } />

      {showForm && (
        <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 20, border: '1px solid var(--border)', marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 12 }}>
            <FormField label="Branch Name" required><input style={inputStyle} value={form.name} onChange={f('name')} placeholder="Indiranagar" /></FormField>
            {!editBranch && <FormField label="Code" required><input style={inputStyle} value={form.code} onChange={f('code')} placeholder="IND" /></FormField>}
            <FormField label="Contact Email"><input style={inputStyle} value={form.contactEmail} onChange={f('contactEmail')} /></FormField>
            <FormField label="Contact Phone"><input style={inputStyle} value={form.contactPhone} onChange={f('contactPhone')} /></FormField>
            <FormField label="Address"><input style={inputStyle} value={form.line1} onChange={f('line1')} /></FormField>
            <FormField label="City"><input style={inputStyle} value={form.city} onChange={f('city')} /></FormField>
            <FormField label="State"><input style={inputStyle} value={form.state} onChange={f('state')} /></FormField>
            <FormField label="Pincode"><input style={inputStyle} value={form.pincode} onChange={f('pincode')} /></FormField>
            {!editBranch && (
              <>
                <FormField label="Manager Email" required><input style={inputStyle} value={form.mgrEmail} onChange={f('mgrEmail')} /></FormField>
                <FormField label="Manager First Name"><input style={inputStyle} value={form.mgrFirst} onChange={f('mgrFirst')} /></FormField>
                <FormField label="Manager Last Name"><input style={inputStyle} value={form.mgrLast} onChange={f('mgrLast')} /></FormField>
              </>
            )}
          </div>
          {err && <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 8 }}>{err}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <OutlineBtn onClick={() => { setShowForm(false); setEditBranch(null); }}>Cancel</OutlineBtn>
            <PrimaryBtn onClick={submit}>{editBranch ? 'Save Branch' : 'Create Branch'}</PrimaryBtn>
          </div>
        </div>
      )}

      <DataTable
        columns={[
          {
            key: 'name', label: 'Branch Name', render: r => (
              <div>
                <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{r.name}</div>
                <div style={{ display: 'inline-flex', marginTop: 4, padding: '2px 7px', borderRadius: 6, background: 'var(--metric-bg)', border: '1px solid var(--border)', fontSize: 10, color: 'var(--text-muted)', fontWeight: 800 }}>{r.code}</div>
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
          { key: 'memberCount', label: 'Clients', render: r => field(r, 'memberCount', 'member_count') || 0 },
          { key: 'resourceCount', label: 'Resources', render: r => field(r, 'resourceCount', 'resource_count') || 0 },
          { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
          {
            key: 'actions', label: 'Actions', render: r => (
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => openEdit(r)} aria-label={`Edit ${r.name}`} style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', background: 'var(--accent-light)', border: '1px solid var(--border)', cursor: 'pointer' }}><Edit2 size={13} /></button>
                <button onClick={() => deleteBranch(r)} aria-label={`Delete ${r.name}`} style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', background: 'rgba(229,62,62,0.08)', border: '1px solid rgba(229,62,62,0.2)', cursor: 'pointer' }}><Trash2 size={13} /></button>
              </div>
            )
          },
        ]}
        rows={loading ? [] : branches}
        emptyMsg={loading ? 'Loading...' : 'No branches yet'}
      />
    </div>
  );
}

// ─── Main Super Admin Dashboard ──────────────────────────
export default function SuperAdminDashboard({ embedded = false }: { embedded?: boolean }) {
  const [activeTab, setActiveTab] = useState('organizations');
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editOrg, setEditOrg] = useState<Org | null>(null);
  const [expandedOrgs, setExpandedOrgs] = useState<Record<string, boolean>>({});

  const load = useCallback(() => {
    setLoading(true);
    api.superAdmin.listOrgs({
      search,
      pageSize: 50,
      ...(statusFilter ? { status: statusFilter } : {}),
    })
      .then(d => { setOrgs(d.organizations || []); setTotal(d.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  useEffect(() => { if (activeTab === 'organizations' || activeTab === 'dashboard') load(); }, [activeTab, load]);

  const deleteOrg = async (org: Org) => {
    if (!window.confirm(`Deactivate "${org.name}"?`)) return;
    await api.superAdmin.deleteOrg(org.id);
    load();
  };

  const activeOrgCount = orgs.filter(o => o.status === 'active').length;
  const inactiveOrgCount = Math.max(total - activeOrgCount, 0);
  const totalBranches = orgs.reduce((s, o) => s + (field(o, 'branchCount', 'branch_count') || 0), 0);
  const totalClients = orgs.reduce((s, o) => s + (field(o, 'memberCount', 'member_count') || 0), 0);
  const totalResources = orgs.reduce((s, o) => s + (field(o, 'resourceCount', 'resource_count') || 0), 0);

  const stats = [
    { label: 'Total Organizations', value: total, icon: <Building2 size={18} />, color: '#6366f1' },
    { label: 'Active', value: activeOrgCount, icon: <CheckCircle2 size={18} />, color: 'var(--accent)' },
    { label: 'Total Branches', value: totalBranches, icon: <GitBranch size={18} />, color: '#0ea5e9' },
    { label: 'Total Clients', value: totalClients, icon: <Users size={18} />, color: '#f59e0b' },
  ];
  const orgStats = [
    { label: 'Total Organizations', value: total, icon: <Building2 size={24} />, color: 'var(--accent)', sub: `Active: ${activeOrgCount}    Inactive: ${inactiveOrgCount}` },
    { label: 'Total Branches', value: totalBranches, icon: <GitBranch size={24} />, color: '#8b5cf6', sub: `Active: ${totalBranches}    Inactive: 0` },
    { label: 'Total Clients', value: totalClients, icon: <Users size={24} />, color: '#0ea5e9', sub: 'Across all organizations' },
    { label: 'Total Resources', value: totalResources, icon: <Building2 size={24} />, color: '#f59e0b', sub: 'Across all organizations' },
  ];

  const dashboardContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px' }}>Platform Overview</h2>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>All organizations across the FitPulseBot platform</p>
      </div>
      <div style={GRID4}>
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 20, border: '1px solid var(--border)' }}>
        <SectionHeader title="Recent Organizations" />
        <DataTable
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'code', label: 'Code' },
            { key: 'branchCount', label: 'Branches' },
            { key: 'memberCount', label: 'Clients' },
            { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
          ]}
          rows={orgs.slice(0, 5)}
        />
      </div>
    </div>
  );

  const organizationsContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Organizations</h2>
          <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>Manage all organizations and their branches</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search organizations..."
              style={{ ...orgControlStyle, paddingLeft: 34, width: 260 }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ ...orgControlStyle, width: 190, cursor: 'pointer' }}
            aria-label="Filter organizations by status"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          <OutlineBtn onClick={load} style={{ height: 46, minHeight: 46, width: 46, padding: 0 }}><RefreshCw size={15} /></OutlineBtn>
          <PrimaryBtn onClick={() => { setEditOrg(null); setModalOpen(true); }} style={{ height: 46, minHeight: 46, padding: '0 18px' }}>
            <Plus size={14} /> New Organization
          </PrimaryBtn>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}>
        {orgStats.map((item) => (
          <div key={item.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 22, display: 'flex', alignItems: 'center', gap: 18, minHeight: 118 }}>
            <div style={{ width: 58, height: 58, borderRadius: 16, background: item.color + '22', color: item.color, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{item.icon}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{item.label}</div>
              <div style={{ fontSize: 28, fontWeight: 950, color: 'var(--text-primary)', marginTop: 8 }}>{item.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, whiteSpace: 'pre-wrap' }}>{item.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 34, border: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader size={22} style={{ animation: 'spin 1s linear infinite' }} />
          <div style={{ marginTop: 10, fontSize: 13 }}>Loading organizations...</div>
        </div>
      ) : orgs.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 42, border: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Building2 size={36} style={{ opacity: 0.4, marginBottom: 10 }} />
          <div style={{ fontSize: 14 }}>No organizations found for the selected filters.</div>
        </div>
      ) : (
        orgs.map(org => {
          const contactEmail = field(org, 'contactEmail', 'contact_email') || '-';
          const contactPhone = field(org, 'contactPhone', 'contact_phone') || '-';
          const ownerName = field(org, 'ownerUserName', 'owner_user_name') || '-';
          const branchCount = field(org, 'branchCount', 'branch_count') || 0;
          const memberCount = field(org, 'memberCount', 'member_count') || 0;
          const resourceCount = field(org, 'resourceCount', 'resource_count') || 0;
          const isExpanded = !!expandedOrgs[org.id];

          return (
            <div key={org.id} style={{ background: 'linear-gradient(135deg, var(--bg-card), rgba(91,200,224,.035))', borderRadius: 16, border: '1px solid var(--border)', borderLeft: '4px solid var(--accent)', overflow: 'hidden', boxShadow: '0 14px 36px rgba(0,0,0,.14)' }}>
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', minWidth: 260, flex: 1 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                      background: 'linear-gradient(135deg, #6366f133, #6366f166)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 24, fontWeight: 900, color: '#fff',
                    }}>{(org.name || 'O').charAt(0).toUpperCase()}</div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0, fontSize: 22, fontWeight: 950, color: 'var(--text-primary)' }}>{org.name}</h3>
                        <StatusBadge status={org.status} />
                      </div>
                      <div style={{ marginTop: 5, fontSize: 13, color: 'var(--text-muted)' }}>{org.code} · Admin: {ownerName}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => setExpandedOrgs(prev => ({ ...prev, [org.id]: !prev[org.id] }))} style={{ height: 38, padding: '0 18px', borderRadius: 9, border: '1px solid var(--accent)', color: 'var(--accent)', background: 'rgba(61,191,150,.08)', fontSize: 13, fontWeight: 900 }}>
                      View Details
                    </button>
                    <button onClick={() => { setEditOrg(org); setModalOpen(true); }} aria-label={`Edit ${org.name}`} style={{
                      width: 38, height: 38, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--accent)', background: 'var(--accent-light)', border: '1px solid var(--border)', cursor: 'pointer',
                    }}><Edit2 size={13} /></button>
                    <button onClick={() => deleteOrg(org)} aria-label={`Delete ${org.name}`} style={{
                      width: 38, height: 38, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--danger)', background: 'rgba(229,62,62,0.08)', border: '1px solid rgba(229,62,62,0.2)', cursor: 'pointer',
                    }}><Trash2 size={13} /></button>
                    <button onClick={() => setExpandedOrgs(prev => ({ ...prev, [org.id]: !prev[org.id] }))} aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${org.name}`} style={{
                      width: 38, height: 38, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text-primary)', background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer',
                    }}>{isExpanded ? <ChevronUp size={15} /> : <ChevronRight size={15} />}</button>
                  </div>
                </div>

                {isExpanded && (
                  <>
                <div style={{ display: 'grid', gridTemplateColumns: '1.15fr .95fr 1.4fr .6fr .6fr .7fr', gap: 0, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                  {[
                    ['Email', contactEmail, <Mail size={14} />],
                    ['Phone', contactPhone, <Phone size={14} />],
                    ['Address', addressText(org.address) || '-', <MapPin size={14} />],
                    ['Branches', branchCount, <GitBranch size={14} />],
                    ['Clients', memberCount, <Users size={14} />],
                    ['Resources', resourceCount, <Users size={14} />],
                  ].map(([label, value, icon]) => (
                    <div key={String(label)} style={{ padding: '0 18px', borderRight: label === 'Resources' ? 'none' : '1px solid var(--border)', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 800, color: 'var(--text-muted)' }}>{icon}{label}</div>
                      <div style={{ marginTop: 7, fontSize: 13, lineHeight: 1.35, fontWeight: 750, color: 'var(--text-primary)', overflowWrap: 'anywhere' }}>{value}</div>
                    </div>
                  ))}
                </div>

                <BranchesPanel orgId={org.id} orgName={org.name} />
                  </>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  const modal = (
    <OrgFormModal
      open={modalOpen} onClose={() => setModalOpen(false)}
      org={editOrg} onSaved={load}
    />
  );

  if (embedded) {
    return (
      <>
        {organizationsContent}
        {modal}
      </>
    );
  }

  return (
    <PortalLayout
      title="FitPulseBot" subtitle="Super Admin"
      accentColor="#6366f1"
      navItems={NAV} activeTab={activeTab} onTabChange={setActiveTab}
      roleBadge="SUPER ADMIN" roleBadgeColor="#6366f1"
    >
      {activeTab === 'dashboard' && dashboardContent}
      {activeTab === 'organizations' && organizationsContent}
      {modal}
    </PortalLayout>
  );
}
