import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../App';
import PortalLayout, {
  StatCard, SectionHeader, PrimaryBtn, OutlineBtn, StatusBadge,
  Modal, FormField, inputStyle, DataTable, GRID4,
} from '../components/PortalLayout';
import BranchDetailPanel from '../components/BranchDetailPanel';
import { api } from '../api';
import {
  LayoutDashboard, GitBranch, Palette, Users, Plus, Edit2,
  Trash2, RefreshCw, Loader, CheckCircle2, TicketCheck, Eye,
} from 'lucide-react';
import AdvancedBrandingEditor from '../components/AdvancedBrandingEditor';
import { BrandingProvider } from '../contexts/BrandingContext';

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
    }));
    else setForm({ name: '', code: '', contactEmail: '', contactPhone: '', city: '', line1: '', state: '', pincode: '', mgrEmail: '', mgrFirst: '', mgrLast: '', mgrPw: 'TempPassword@123' });
    setErr('');
  }, [branch, open]);

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    setErr(''); setLoading(true);
    try {
      if (editing) {
        await api.branch.update(branch.id, { name: form.name, contactEmail: form.contactEmail, contactPhone: form.contactPhone, status: branch.status, timezone: 'Asia/Kolkata', address: { line1: form.line1, city: form.city, state: form.state, country: 'IN', pincode: form.pincode } });
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
      {!editing && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>Branch Manager Account</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormField label="Manager Email" required><input style={inputStyle} value={form.mgrEmail} onChange={f('mgrEmail')} /></FormField>
            <FormField label="First Name"><input style={inputStyle} value={form.mgrFirst} onChange={f('mgrFirst')} /></FormField>
            <FormField label="Last Name"><input style={inputStyle} value={form.mgrLast} onChange={f('mgrLast')} /></FormField>
            <FormField label="Temp Password"><input style={inputStyle} value={form.mgrPw} onChange={f('mgrPw')} /></FormField>
          </div>
        </div>
      )}
      {err && <p style={{ color: 'var(--danger)', fontSize: 12 }}>{err}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <OutlineBtn onClick={onClose}>Cancel</OutlineBtn>
        <PrimaryBtn onClick={submit} loading={loading}>{editing ? 'Save' : 'Create Branch'}</PrimaryBtn>
      </div>
    </Modal>
  );
}

// ─── Org Dashboard ───────────────────────────────────────
export default function OrgDashboard() {
  const { user } = useApp();
  const orgId = user?.organizationId || '';
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dash, setDash] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editBranch, setEditBranch] = useState<any>(null);
  const [detailBranch, setDetailBranch] = useState<any>(null);
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

  const deleteBranch = async (b: any) => {
    if (!window.confirm(`Deactivate branch "${b.name}"?`)) return;
    await api.branch.delete(b.id);
    loadBranches();
  };

  const counts = dash?.counts || {};
  const stats = [
    { label: 'Branches', value: counts.branches || 0, icon: <GitBranch size={18} />, color: '#0ea5e9' },
    { label: 'Members', value: counts.members || 0, icon: <Users size={18} />, color: 'var(--accent)' },
    { label: 'Trainers', value: counts.trainers || 0, icon: <Users size={18} />, color: '#f59e0b' },
    { label: 'Open Tickets', value: counts.openSupportTickets || 0, icon: <TicketCheck size={18} />, color: 'var(--danger)' },
  ];

  return (
    <PortalLayout
      title="Organization Portal" subtitle="Admin Dashboard"
      accentColor="#0ea5e9"
      navItems={NAV} activeTab={activeTab} onTabChange={setActiveTab}
      roleBadge="ORG ADMIN" roleBadgeColor="#0ea5e9"
    >
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px' }}>Organization Overview</h2>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>Today's summary across all branches</p>
          </div>
          <div style={GRID4}>{stats.map((s, i) => <StatCard key={i} {...s} />)}</div>

          {dash?.attendanceToday && (
            <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 20, border: '1px solid var(--border)' }}>
              <SectionHeader title="Today's Attendance" />
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                {[
                  { label: 'Present', value: dash.attendanceToday.present, color: 'var(--accent)' },
                  { label: 'Absent', value: dash.attendanceToday.absent, color: 'var(--danger)' },
                  { label: 'Late', value: dash.attendanceToday.late, color: 'var(--warning)' },
                ].map(a => (
                  <div key={a.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 32, fontWeight: 900, color: a.color }}>{a.value}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dash?.recentBranches && (
            <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 20, border: '1px solid var(--border)' }}>
              <SectionHeader title="Recent Branches" />
              <DataTable
                columns={[
                  { key: 'name', label: 'Branch' },
                  { key: 'memberCount', label: 'Members', render: r => field(r, 'memberCount', 'member_count') || 0 },
                  { key: 'trainerCount', label: 'Trainers', render: r => field(r, 'trainerCount', 'trainer_count') || 0 },
                ]}
                rows={dash.recentBranches}
              />
            </div>
          )}
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
        <BrandingProvider orgId={orgId}>
          <AdvancedBrandingEditor orgId={orgId} isOrg={true} />
        </BrandingProvider>
      )}

      <BranchModal
        open={modalOpen} onClose={() => setModalOpen(false)}
        orgId={orgId} branch={editBranch}
        onSaved={loadBranches}
      />
    </PortalLayout>
  );
}
