import React, { useState, useEffect, useCallback } from 'react';
import PortalLayout, {
  StatCard, SectionHeader, PrimaryBtn, OutlineBtn, StatusBadge,
  Modal, FormField, inputStyle, DataTable, GRID4,
} from '../components/PortalLayout';
import { api } from '../api';
import {
  LayoutDashboard, Building2, GitBranch, Plus, Edit2, Trash2,
  Users, RefreshCw, Search, Loader, CheckCircle2,
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
  trainerCount?: number; trainer_count?: number;
  createdAt?: string; created_at?: string;
}

const field = (row: any, camel: string, snake: string) => row?.[camel] ?? row?.[snake];
const addressText = (address: any) => {
  if (!address) return '';
  if (typeof address === 'string') return address;
  return [address.line1, address.city, address.state, address.country, address.pincode].filter(Boolean).join(', ');
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
          <input style={inputStyle} value={form.orgName} onChange={f('orgName')} placeholder="FitPulse Gym" />
        </FormField>
        {!editing && (
          <FormField label="Org Code" required>
            <input style={inputStyle} value={form.orgCode} onChange={f('orgCode')} placeholder="FITPULSE" />
          </FormField>
        )}
        <FormField label="Contact Email">
          <input style={inputStyle} value={form.contactEmail} onChange={f('contactEmail')} placeholder="contact@gym.com" />
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
                <input style={inputStyle} value={form.adminEmail} onChange={f('adminEmail')} placeholder="admin@gym.com" />
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
function BranchesPanel({ orgId, orgName }: { orgId: string; orgName: string }) {
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
      <SectionHeader title={`Branches — ${orgName}`} action={
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
                <button onClick={() => openEdit(r)} aria-label={`Edit ${r.name}`} style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', background: 'var(--accent-light)', border: 'none', cursor: 'pointer' }}><Edit2 size={12} /></button>
                <button onClick={() => deleteBranch(r)} aria-label={`Delete ${r.name}`} style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', background: 'rgba(229,62,62,0.08)', border: 'none', cursor: 'pointer' }}><Trash2 size={12} /></button>
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
export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState('organizations');
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editOrg, setEditOrg] = useState<Org | null>(null);
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.superAdmin.listOrgs({ search, pageSize: 50 })
      .then(d => { setOrgs(d.organizations || []); setTotal(d.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { if (activeTab === 'organizations') load(); }, [activeTab, load]);

  const deleteOrg = async (org: Org) => {
    if (!window.confirm(`Deactivate "${org.name}"?`)) return;
    await api.superAdmin.deleteOrg(org.id);
    load();
  };

  const stats = [
    { label: 'Total Organizations', value: total, icon: <Building2 size={18} />, color: '#6366f1' },
    { label: 'Active', value: orgs.filter(o => o.status === 'active').length, icon: <CheckCircle2 size={18} />, color: 'var(--accent)' },
    { label: 'Total Branches', value: orgs.reduce((s, o) => s + (field(o, 'branchCount', 'branch_count') || 0), 0), icon: <GitBranch size={18} />, color: '#0ea5e9' },
    { label: 'Total Members', value: orgs.reduce((s, o) => s + (field(o, 'memberCount', 'member_count') || 0), 0), icon: <Users size={18} />, color: '#f59e0b' },
  ];

  return (
    <PortalLayout
      title="FitPulseBot" subtitle="Super Admin"
      accentColor="#6366f1"
      navItems={NAV} activeTab={activeTab} onTabChange={setActiveTab}
      roleBadge="SUPER ADMIN" roleBadgeColor="#6366f1"
    >
      {activeTab === 'dashboard' && (
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
                { key: 'memberCount', label: 'Members' },
                { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
              ]}
              rows={orgs.slice(0, 5)}
            />
          </div>
        </div>
      )}

      {activeTab === 'organizations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Organizations</h2>
              <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>{total} total</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search orgs..."
                  style={{ ...inputStyle, paddingLeft: 32, width: 200 }}
                />
              </div>
              <OutlineBtn onClick={load}><RefreshCw size={13} /></OutlineBtn>
              <PrimaryBtn onClick={() => { setEditOrg(null); setModalOpen(true); }}>
                <Plus size={14} /> New Organization
              </PrimaryBtn>
            </div>
          </div>

          {/* Org cards */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}><Loader size={22} style={{ animation: 'spin 1s linear infinite' }} /></div>
          ) : orgs.map(org => (
            <div key={org.id} style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: 'linear-gradient(135deg, #6366f133, #6366f166)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#6366f1',
                }}>{org.name[0]}</div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>{org.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{org.code} · {field(org, 'ownerUserName', 'owner_user_name') || '-'}</div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 7, fontSize: 12, color: 'var(--text-secondary)' }}>
                    <span>{field(org, 'contactEmail', 'contact_email') || 'No contact email'}</span>
                    <span>{field(org, 'contactPhone', 'contact_phone') || 'No phone'}</span>
                  </div>
                  <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>{addressText(org.address) || 'No address saved'}</div>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                  <span><strong>{field(org, 'branchCount', 'branch_count') || 0}</strong> Branches</span>
                  <span><strong>{field(org, 'memberCount', 'member_count') || 0}</strong> Members</span>
                  <span><strong>{field(org, 'trainerCount', 'trainer_count') || 0}</strong> Trainers</span>
                </div>
                <StatusBadge status={org.status} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <OutlineBtn onClick={() => setExpandedOrg(expandedOrg === org.id ? null : org.id)} style={{ fontSize: 11, padding: '6px 12px' }}>
                    <GitBranch size={12} /> Branches
                  </OutlineBtn>
                  <button onClick={() => { setEditOrg(org); setModalOpen(true); }} style={{
                    width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--accent)', background: 'var(--accent-light)', border: '1px solid var(--border)',
                  }}><Edit2 size={13} /></button>
                  <button onClick={() => deleteOrg(org)} style={{
                    width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--danger)', background: 'rgba(229,62,62,0.08)', border: '1px solid rgba(229,62,62,0.2)',
                  }}><Trash2 size={13} /></button>
                </div>
              </div>
              {expandedOrg === org.id && (
                <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ paddingTop: 16 }}>
                    <BranchesPanel orgId={org.id} orgName={org.name} />
                  </div>
                </div>
              )}
            </div>
          ))}

          {!loading && orgs.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              <Building2 size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p>No organizations found. Create one to get started.</p>
            </div>
          )}
        </div>
      )}

      <OrgFormModal
        open={modalOpen} onClose={() => setModalOpen(false)}
        org={editOrg} onSaved={load}
      />
    </PortalLayout>
  );
}
