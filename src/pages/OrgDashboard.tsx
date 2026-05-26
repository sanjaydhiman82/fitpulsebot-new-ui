import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../App';
import PortalLayout, {
  StatCard, SectionHeader, PrimaryBtn, OutlineBtn, StatusBadge,
  Modal, FormField, inputStyle, DataTable, GRID4,
} from '../components/PortalLayout';
import { api } from '../api';
import {
  LayoutDashboard, GitBranch, Palette, Users, Plus, Edit2,
  Trash2, RefreshCw, Loader, CheckCircle2, TicketCheck,
} from 'lucide-react';

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

// ─── Branding Editor ─────────────────────────────────────
function BrandingEditor({ orgId }: { orgId: string }) {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.org.getBranding(orgId).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [orgId]);

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setData((p: any) => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    setSaving(true); setSaved(false);
    try { await api.org.putBranding(orgId, data); setSaved(true); setTimeout(() => setSaved(false), 2500); }
    catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}><Loader size={20} /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Organization Branding</h2>
        <PrimaryBtn onClick={save} loading={saving}>
          {saving ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : saved ? <CheckCircle2 size={13} /> : null}
          {saved ? 'Saved!' : 'Save Branding'}
        </PrimaryBtn>
      </div>

      {/* Preview */}
      <div style={{
        padding: 24, borderRadius: 16, background: data.primaryColor || 'var(--accent)',
        border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16,
      }}>
        {data.logoUrl ? (
          <img src={data.logoUrl} alt="Logo" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', background: '#fff' }} />
        ) : (
          <div style={{ width: 56, height: 56, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#fff' }}>
            {data.appName?.[0] || 'G'}
          </div>
        )}
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{data.appName || 'Your Gym'}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Branding Preview</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FormField label="App / Gym Name">
          <input style={inputStyle} value={data.appName || ''} onChange={f('appName')} placeholder="My Gym Name" />
        </FormField>
        <FormField label="Custom Domain">
          <input style={inputStyle} value={data.customDomain || ''} onChange={f('customDomain')} placeholder="gym.example.com" />
        </FormField>
        <FormField label="Logo URL">
          <input style={inputStyle} value={data.logoUrl || ''} onChange={f('logoUrl')} placeholder="https://cdn.example.com/logo.png" />
        </FormField>
        <FormField label="Login Banner URL">
          <input style={inputStyle} value={data.loginBannerUrl || ''} onChange={f('loginBannerUrl')} placeholder="https://cdn.example.com/banner.png" />
        </FormField>
      </div>

      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12 }}>Brand Colors</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { key: 'primaryColor', label: 'Primary' },
            { key: 'secondaryColor', label: 'Secondary' },
            { key: 'accentColor', label: 'Accent' },
          ].map(({ key, label }) => (
            <FormField key={key} label={label}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="color" value={data[key] || '#2563EB'} onChange={f(key)} style={{ width: 40, height: 38, borderRadius: 8, border: 'none', padding: 2, cursor: 'pointer' }} />
                <input style={{ ...inputStyle, flex: 1 }} value={data[key] || ''} onChange={f(key)} placeholder="#2563EB" />
              </div>
            </FormField>
          ))}
        </div>
      </div>
    </div>
  );
}

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
      )}

      {activeTab === 'branding' && orgId && <BrandingEditor orgId={orgId} />}

      <BranchModal
        open={modalOpen} onClose={() => setModalOpen(false)}
        orgId={orgId} branch={editBranch}
        onSaved={loadBranches}
      />
    </PortalLayout>
  );
}
