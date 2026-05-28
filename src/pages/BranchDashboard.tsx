import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../App';
import PortalLayout, {
  StatCard, SectionHeader, PrimaryBtn, OutlineBtn, StatusBadge,
  Modal, FormField, inputStyle, DataTable, GRID4, GRID2,
} from '../components/PortalLayout';
import { api } from '../api';
import { normalizeProfileImageUrl } from '../profileImageUrl';
import {
  LayoutDashboard, Users, UserCheck, CalendarCheck, TicketCheck,
  Palette, Trash2, RefreshCw, Loader, Search,
  UserPlus, Link, Unlink, CheckCircle2, XCircle, Clock, AlertCircle,
  TrendingUp, CreditCard, Bell, Star, Plus,
} from 'lucide-react';
import AdvancedBrandingEditor from '../components/AdvancedBrandingEditor';
import { BrandingProvider, useBranding } from '../contexts/BrandingContext';

// ─── NAV ─────────────────────────────────────────────────
const NAV = [
  { id: 'dashboard',   label: 'Dashboard',     icon: <LayoutDashboard size={16} /> },
  { id: 'onboard',     label: 'Onboard Member', icon: <UserPlus size={16} /> },
  { id: 'members',     label: 'Members',        icon: <Users size={16} /> },
  { id: 'trainers',    label: 'Trainers',       icon: <UserCheck size={16} /> },
  { id: 'assignments', label: 'Assignments',    icon: <Link size={16} /> },
  { id: 'attendance',  label: 'Attendance',     icon: <CalendarCheck size={16} /> },
  { id: 'support',     label: 'Support',        icon: <TicketCheck size={16} /> },
  { id: 'branding',    label: 'Branding',       icon: <Palette size={16} /> },
];

// ─── Helpers ──────────────────────────────────────────────
function today() { return new Date().toISOString().split('T')[0]; }
const brandingField = (row: any, camel: string, snake: string) => row?.[camel] ?? row?.[snake];
const rowField = (row: any, camel: string, snake: string) => row?.[camel] ?? row?.[snake];
const normalizeBranding = (row: any = {}) => ({
  ...row,
  appName: brandingField(row, 'appName', 'app_name'),
  logoUrl: brandingField(row, 'logoUrl', 'logo_url'),
  primaryColor: brandingField(row, 'primaryColor', 'primary_color'),
  secondaryColor: brandingField(row, 'secondaryColor', 'secondary_color'),
  accentColor: brandingField(row, 'accentColor', 'accent_color'),
  loginBannerUrl: brandingField(row, 'loginBannerUrl', 'login_banner_url'),
});

function BranchAvatar({ src, name, tone = 'member' }: { src?: string; name: string; tone?: 'member' | 'trainer' | 'join' }) {
  const [failed, setFailed] = useState(false);
  const fallbackBg = tone === 'trainer'
    ? 'linear-gradient(135deg,#f59e0b33,#f59e0b66)'
    : tone === 'join'
      ? 'linear-gradient(135deg,#22c55e33,#0ea5e966)'
      : 'linear-gradient(135deg,#0ea5e933,#0ea5e966)';
  const fallbackColor = tone === 'trainer' ? '#f59e0b' : tone === 'join' ? '#22c55e' : '#0ea5e9';
  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: 56, height: 56, borderRadius: 14, flexShrink: 0, objectFit: 'cover', background: 'var(--metric-bg)', border: '1px solid var(--border)' }}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div style={{ width: 56, height: 56, borderRadius: 14, flexShrink: 0, background: fallbackBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: fallbackColor }}>
      {(name || 'U')[0].toUpperCase()}
    </div>
  );
}

// ─── Onboard User Modal ───────────────────────────────────
function OnboardUserModal({ open, onClose, branchId, type, onSaved }: {
  open: boolean; onClose: () => void; branchId: string;
  type: 'MEMBER' | 'TRAINER'; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    userName: '', firstName: '', lastName: '', phone: '',
    temporaryPassword: 'TempPassword@123', sendWelcome: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) { setForm({ userName: '', firstName: '', lastName: '', phone: '', temporaryPassword: 'TempPassword@123', sendWelcome: true }); setError(''); }
  }, [open]);

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    setError(''); setLoading(true);
    try {
      await api.branch.createUser(branchId, { type, user: form });
      onSaved(); onClose();
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Onboard ${type === 'MEMBER' ? 'Member' : 'Trainer'}`} width={520}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FormField label="Email / Username" required>
          <input style={inputStyle} value={form.userName} onChange={f('userName')} placeholder="user@example.com" />
        </FormField>
        <FormField label="Phone">
          <input style={inputStyle} value={form.phone} onChange={f('phone')} placeholder="+919999999999" />
        </FormField>
        <FormField label="First Name">
          <input style={inputStyle} value={form.firstName} onChange={f('firstName')} placeholder="Rahul" />
        </FormField>
        <FormField label="Last Name">
          <input style={inputStyle} value={form.lastName} onChange={f('lastName')} placeholder="Sharma" />
        </FormField>
        <FormField label="Temp Password" required>
          <input style={inputStyle} value={form.temporaryPassword} onChange={f('temporaryPassword')} />
        </FormField>
      </div>
      {error && <p style={{ color: 'var(--danger)', fontSize: 12, margin: 0 }}>{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <OutlineBtn onClick={onClose}>Cancel</OutlineBtn>
        <PrimaryBtn onClick={submit} loading={loading}>
          {loading && <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} />}
          Onboard {type === 'MEMBER' ? 'Member' : 'Trainer'}
        </PrimaryBtn>
      </div>
    </Modal>
  );
}

// ─── Assign Trainer Modal ─────────────────────────────────
function AssignTrainerModal({ open, onClose, branchId, members, trainers, onSaved }: {
  open: boolean; onClose: () => void; branchId: string;
  members: any[]; trainers: any[]; onSaved: () => void;
}) {
  const [memberId, setMemberId] = useState('');
  const [trainerId, setTrainerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (open) { setMemberId(''); setTrainerId(''); setError(''); } }, [open]);

  const optionLabel = (u: any) => {
    const firstName = rowField(u, 'firstName', 'first_name') || '';
    const lastName = rowField(u, 'lastName', 'last_name') || '';
    const userName = rowField(u, 'userName', 'user_name') || '';
    const name = `${firstName} ${lastName}`.trim();
    return name ? `${name} (${userName})` : userName || 'Unnamed user';
  };

  const submit = async () => {
    if (!memberId || !trainerId) { setError('Please select both member and trainer.'); return; }
    setError(''); setLoading(true);
    try {
      await api.branch.createAssignment(branchId, { memberUserId: memberId, trainerUserId: trainerId });
      onSaved(); onClose();
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Assign Trainer to Member" width={440}>
      <FormField label="Member" required>
        <select style={inputStyle} value={memberId} onChange={e => setMemberId(e.target.value)}>
          <option value="">Select member...</option>
          {members.map(m => (
            <option key={rowField(m, 'userId', 'user_id')} value={rowField(m, 'userId', 'user_id')}>{optionLabel(m)}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Trainer" required>
        <select style={inputStyle} value={trainerId} onChange={e => setTrainerId(e.target.value)}>
          <option value="">Select trainer...</option>
          {trainers.map(t => (
            <option key={rowField(t, 'userId', 'user_id')} value={rowField(t, 'userId', 'user_id')}>{optionLabel(t)}</option>
          ))}
        </select>
      </FormField>
      {members.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>No active members found for this branch.</p>}
      {trainers.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>No active trainers found for this branch. Onboard a trainer first.</p>}
      {error && <p style={{ color: 'var(--danger)', fontSize: 12, margin: 0 }}>{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <OutlineBtn onClick={onClose}>Cancel</OutlineBtn>
        <PrimaryBtn onClick={submit} loading={loading}>
          {loading && <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} />}
          Assign
        </PrimaryBtn>
      </div>
    </Modal>
  );
}

// ─── Mark Attendance Modal ────────────────────────────────
function MarkAttendanceModal({ open, onClose, branchId, members, onSaved }: {
  open: boolean; onClose: () => void; branchId: string;
  members: any[]; onSaved: () => void;
}) {
  const [form, setForm] = useState({ userId: '', attendanceDate: today(), checkInAt: '', status: 'PRESENT', notes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) setForm({ userId: '', attendanceDate: today(), checkInAt: '', status: 'PRESENT', notes: '' });
  }, [open]);

  const submit = async () => {
    if (!form.userId) { setError('Please select a member.'); return; }
    setError(''); setLoading(true);
    try {
      await api.branch.markAttendance(branchId, {
        ...form,
        checkInAt: form.checkInAt ? `${form.attendanceDate}T${form.checkInAt}:00Z` : null,
      });
      onSaved(); onClose();
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Mark Attendance" width={480}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FormField label="Member" required>
          <select style={inputStyle} value={form.userId} onChange={e => setForm(p => ({ ...p, userId: e.target.value }))}>
            <option value="">Select member...</option>
            {members.map(m => (
              <option key={m.userId} value={m.userId}>{m.firstName} {m.lastName}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Date">
          <input type="date" style={inputStyle} value={form.attendanceDate}
            onChange={e => setForm(p => ({ ...p, attendanceDate: e.target.value }))} />
        </FormField>
        <FormField label="Check-in Time">
          <input type="time" style={inputStyle} value={form.checkInAt}
            onChange={e => setForm(p => ({ ...p, checkInAt: e.target.value }))} />
        </FormField>
        <FormField label="Status">
          <select style={inputStyle} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
            <option value="LATE">Late</option>
            <option value="EXCUSED">Excused</option>
          </select>
        </FormField>
        <FormField label="Notes">
          <input style={inputStyle} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
        </FormField>
      </div>
      {error && <p style={{ color: 'var(--danger)', fontSize: 12, margin: 0 }}>{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <OutlineBtn onClick={onClose}>Cancel</OutlineBtn>
        <PrimaryBtn onClick={submit} loading={loading}>
          {loading && <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} />}
          Mark Attendance
        </PrimaryBtn>
      </div>
    </Modal>
  );
}

// ─── Branch Branding Editor (Advanced) ─────────────────────────────────
// No nested BrandingProvider - already inside the main one from BranchDashboard
function BranchBrandingEditor({ branchId }: { branchId: string }) {
  return <AdvancedBrandingEditor branchId={branchId} isOrg={false} />;
}

// ─── Users Tab (Members or Trainers) ─────────────────────
function UsersTab({ branchId, type }: { branchId: string; type: 'MEMBER' | 'TRAINER' }) {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.branch.listUsers(branchId, { type, search, pageSize: 50 })
      .then(d => { setUsers(d.users || []); setTotal(d.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [branchId, type, search]);

  useEffect(() => { load(); }, [load]);

  const displayName = (u: any) => {
    const firstName = rowField(u, 'firstName', 'first_name') || '';
    const lastName = rowField(u, 'lastName', 'last_name') || '';
    return `${firstName} ${lastName}`.trim() || rowField(u, 'userName', 'user_name') || 'Unnamed user';
  };

  const formatDate = (value: any) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
  };

  const deactivate = async (userId: string) => {
    if (!window.confirm('Deactivate this user from branch?')) return;
    await api.branch.updateUser(branchId, userId, { status: 'inactive' });
    load();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>{type === 'MEMBER' ? 'Members' : 'Trainers'}</h2>
          <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>{total} total</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${type === 'MEMBER' ? 'members' : 'trainers'}...`}
              style={{ ...inputStyle, paddingLeft: 32, width: 200 }} />
          </div>
          <OutlineBtn onClick={load}><RefreshCw size={13} /></OutlineBtn>
          <PrimaryBtn onClick={() => setModalOpen(true)}>
            <UserPlus size={14} /> Onboard {type === 'MEMBER' ? 'Member' : 'Trainer'}
          </PrimaryBtn>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Loader size={22} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)' }} /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px,1fr))', gap: 16 }}>
          {users.map(u => {
            const userId = rowField(u, 'userId', 'user_id');
            const userName = rowField(u, 'userName', 'user_name');
            const phone = rowField(u, 'phone', 'phone');
            const avatarUrl = normalizeProfileImageUrl(rowField(u, 'avatarUrl', 'avatar_url'));
            const joinedAt = rowField(u, 'joinedAt', 'joined_at');
            const userType = rowField(u, 'type', 'type') || type;
            const name = displayName(u);
            return (
            <div key={userId} style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 18, border: '1px solid var(--border)', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <BranchAvatar src={avatarUrl} name={name} tone={type === 'TRAINER' ? 'trainer' : 'member'} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName || '-'}</div>
                  </div>
                  <StatusBadge status={u.status} />
                </div>
                <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Email', value: userName || '-' },
                    { label: 'Phone', value: phone || '-' },
                    { label: 'Type', value: userType },
                    { label: 'Joined', value: formatDate(joinedAt) },
                  ].map(item => (
                    <div key={item.label} style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  {u.assignedTrainer && (
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--metric-bg)', padding: '2px 8px', borderRadius: 20 }}>
                      Trainer: {rowField(u.assignedTrainer, 'firstName', 'first_name') || u.assignedTrainer.firstName || 'Assigned'}
                    </span>
                  )}
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--metric-bg)', padding: '2px 8px', borderRadius: 20 }}>
                    ID: {String(userId).slice(0, 8)}
                  </span>
                </div>
              </div>
              <button onClick={() => deactivate(userId)} style={{
                width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--danger)', background: 'rgba(229,62,62,0.08)', border: '1px solid rgba(229,62,62,0.2)',
              }}><Trash2 size={13} /></button>
            </div>
          )})}
          {users.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              <Users size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p>No {type === 'MEMBER' ? 'members' : 'trainers'} found. Onboard one to get started.</p>
            </div>
          )}
        </div>
      )}

      <OnboardUserModal
        open={modalOpen} onClose={() => setModalOpen(false)}
        branchId={branchId} type={type} onSaved={load}
      />
    </div>
  );
}

// ─── Member Join Requests ────────────────────────────────
function MemberRequestsTab({ branchId, onAccepted }: { branchId: string; onAccepted?: () => void }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('Initiated');
  const [loading, setLoading] = useState(false);
  const [acceptingId, setAcceptingId] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    api.branch.listMemberRequests(branchId, { status, pageSize: 100 })
      .then(d => { setRequests(d.requests || []); setTotal(d.total || 0); })
      .catch((e: any) => setError(e.message || 'Failed to load member requests.'))
      .finally(() => setLoading(false));
  }, [branchId, status]);

  useEffect(() => { load(); }, [load]);

  const displayName = (r: any) => {
    const firstName = rowField(r, 'firstName', 'first_name') || '';
    const lastName = rowField(r, 'lastName', 'last_name') || '';
    return `${firstName} ${lastName}`.trim() || rowField(r, 'userName', 'user_name') || 'Unnamed member';
  };
  const formatDate = (value: any) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
  };
  const accept = async (requestId: string) => {
    setAcceptingId(requestId);
    setError('');
    try {
      await api.branch.acceptMemberRequest(branchId, requestId);
      await load();
      onAccepted?.();
    } catch (e: any) {
      setError(e.message || 'Failed to accept member request.');
    } finally {
      setAcceptingId('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Onboard Member</h2>
          <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>{total} {status.toLowerCase()} request{total === 1 ? '' : 's'}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...inputStyle, width: 150 }}>
            <option value="Initiated">Initiated</option>
            <option value="Accepted">Accepted</option>
          </select>
          <OutlineBtn onClick={load}><RefreshCw size={13} /></OutlineBtn>
        </div>
      </div>

      {error && <div style={{ color: 'var(--danger)', background: 'rgba(229,62,62,0.08)', border: '1px solid rgba(229,62,62,0.2)', borderRadius: 10, padding: 12, fontSize: 13 }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Loader size={22} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)' }} /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px,1fr))', gap: 16 }}>
          {requests.map(r => {
            const requestId = rowField(r, 'requestId', 'request_id');
            const userName = rowField(r, 'userName', 'user_name');
            const phone = rowField(r, 'phone', 'phone');
            const email = rowField(r, 'email', 'email') || userName;
            const avatarUrl = normalizeProfileImageUrl(rowField(r, 'avatarUrl', 'avatar_url'));
            const name = displayName(r);
            const existingStatus = rowField(r, 'existingMemberStatus', 'existing_member_status');
            return (
              <div key={requestId} style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 18, border: '1px solid var(--border)', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <BranchAvatar src={avatarUrl} name={name} tone="join" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email || '-'}</div>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      { label: 'Request ID', value: requestId },
                      { label: 'Phone', value: phone || '-' },
                      { label: 'Requested', value: formatDate(rowField(r, 'createdAt', 'created_at')) },
                      { label: 'Existing', value: existingStatus || 'No' },
                    ].map(item => (
                      <div key={item.label} style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>{item.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                  {r.status === 'Initiated' && (
                    <div style={{ marginTop: 14 }}>
                      <PrimaryBtn onClick={() => accept(requestId)} loading={acceptingId === requestId}>
                        {acceptingId === requestId ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={14} />}
                        Accept
                      </PrimaryBtn>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {requests.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              <UserPlus size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p>No {status.toLowerCase()} member requests for this branch.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Assignments Tab ──────────────────────────────────────
function AssignmentsTab({ branchId }: { branchId: string }) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [trainerFilter, setTrainerFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.branch.listAssignments(branchId, { pageSize: 100, ...(trainerFilter ? { trainerUserId: trainerFilter } : {}) }),
      api.branch.listUsers(branchId, { type: 'MEMBER', pageSize: 100 }),
      api.branch.listUsers(branchId, { type: 'TRAINER', pageSize: 100 }),
    ]).then(([a, m, t]) => {
      setAssignments(a.assignments || []);
      setMembers(m.users || []);
      setTrainers(t.users || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [branchId, trainerFilter]);

  useEffect(() => { load(); }, [load]);

  const remove = async (id: string) => {
    if (!window.confirm('Remove this trainer assignment?')) return;
    await api.branch.deleteAssignment(branchId, id);
    load();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Trainer Assignments</h2>
          <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>{assignments.length} active assignments</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <select
            value={trainerFilter}
            onChange={e => setTrainerFilter(e.target.value)}
            style={{ ...inputStyle, width: 220 }}
            aria-label="Filter assignments by trainer"
          >
            <option value="">All trainers</option>
            {trainers.map(t => {
              const trainerId = rowField(t, 'userId', 'user_id');
              const firstName = rowField(t, 'firstName', 'first_name') || '';
              const lastName = rowField(t, 'lastName', 'last_name') || '';
              const userName = rowField(t, 'userName', 'user_name') || '';
              const name = `${firstName} ${lastName}`.trim();
              return <option key={trainerId} value={trainerId}>{name || userName}</option>;
            })}
          </select>
          <OutlineBtn onClick={load}><RefreshCw size={13} /></OutlineBtn>
          <PrimaryBtn onClick={() => setModalOpen(true)}>
            <Link size={14} /> Assign Trainer
          </PrimaryBtn>
        </div>
      </div>

      <DataTable
        columns={[
          { key: 'member', label: 'Member', render: r => <span style={{ fontWeight: 600 }}>{r.member?.firstName} {r.member?.lastName}</span> },
          { key: 'trainer', label: 'Trainer', render: r => <span>{r.trainer?.firstName} {r.trainer?.lastName}</span> },
          { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
          { key: 'assignedAt', label: 'Assigned', render: r => r.assignedAt ? new Date(r.assignedAt).toLocaleDateString() : '—' },
          { key: 'actions', label: '', render: r => (
            <button onClick={() => remove(r.id)} style={{
              width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--danger)', background: 'rgba(229,62,62,0.08)', border: '1px solid rgba(229,62,62,0.2)',
            }}><Unlink size={12} /></button>
          )},
        ]}
        rows={loading ? [] : assignments}
        emptyMsg={loading ? 'Loading...' : 'No assignments yet. Assign a trainer to a member.'}
      />

      <AssignTrainerModal
        open={modalOpen} onClose={() => setModalOpen(false)}
        branchId={branchId} members={members} trainers={trainers} onSaved={load}
      />
    </div>
  );
}

// ─── Attendance Tab ───────────────────────────────────────
function AttendanceTab({ branchId }: { branchId: string }) {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterDate, setFilterDate] = useState(today());
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.branch.getAttendance(branchId, { date: filterDate, pageSize: 100 }),
      api.branch.listUsers(branchId, { type: 'MEMBER', pageSize: 200 }),
    ]).then(([a, m]) => {
      setAttendance(a.attendance || []);
      setMembers(m.users || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [branchId, filterDate]);

  useEffect(() => { load(); }, [load]);

  const stats = {
    present: attendance.filter(a => a.status === 'PRESENT').length,
    absent:  attendance.filter(a => a.status === 'ABSENT').length,
    late:    attendance.filter(a => a.status === 'LATE').length,
    excused: attendance.filter(a => a.status === 'EXCUSED').length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Attendance</h2>
          <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>{attendance.length} records for {filterDate}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input type="date" style={{ ...inputStyle, width: 160 }} value={filterDate} onChange={e => setFilterDate(e.target.value)} />
          <OutlineBtn onClick={load}><RefreshCw size={13} /></OutlineBtn>
          <PrimaryBtn onClick={() => setModalOpen(true)}>
            <CheckCircle2 size={14} /> Mark Attendance
          </PrimaryBtn>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 12 }}>
        {[
          { label: 'Present', value: stats.present, color: 'var(--accent)', icon: <CheckCircle2 size={16} /> },
          { label: 'Absent',  value: stats.absent,  color: 'var(--danger)', icon: <XCircle size={16} /> },
          { label: 'Late',    value: stats.late,    color: 'var(--warning)', icon: <Clock size={16} /> },
          { label: 'Excused', value: stats.excused, color: 'var(--info)', icon: <AlertCircle size={16} /> },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-card)', borderRadius: 14, padding: '16px 20px', border: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <DataTable
        columns={[
          { key: 'firstName', label: 'Name', render: r => <span style={{ fontWeight: 600 }}>{r.firstName} {r.lastName}</span> },
          { key: 'userName', label: 'Email' },
          { key: 'attendanceDate', label: 'Date' },
          { key: 'checkInAt', label: 'Check-in', render: r => r.checkInAt ? new Date(r.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—' },
          { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
          { key: 'notes', label: 'Notes', render: r => <span style={{ color: 'var(--text-muted)' }}>{r.notes || '—'}</span> },
        ]}
        rows={loading ? [] : attendance}
        emptyMsg={loading ? 'Loading...' : 'No attendance records for this date.'}
      />

      <MarkAttendanceModal
        open={modalOpen} onClose={() => setModalOpen(false)}
        branchId={branchId} members={members} onSaved={load}
      />
    </div>
  );
}

// ─── Support Tab ──────────────────────────────────────────
function SupportTab({ branchId }: { branchId: string }) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.branch.getSupportTickets(branchId).then(d => setTickets(d.tickets || [])).catch(() => {}).finally(() => setLoading(false));
  }, [branchId]);

  useEffect(() => { load(); }, [load]);

  const open = tickets.filter(t => t.status === 'open').length;
  const inProgress = tickets.filter(t => t.status === 'in_progress').length;
  const closed = tickets.filter(t => t.status === 'closed').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Support & Feedback</h2>
          <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>{tickets.length} total tickets</p>
        </div>
        <OutlineBtn onClick={load}><RefreshCw size={13} /></OutlineBtn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 12 }}>
        {[
          { label: 'Open', value: open, color: 'var(--danger)' },
          { label: 'In Progress', value: inProgress, color: 'var(--warning)' },
          { label: 'Closed', value: closed, color: 'var(--accent)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-card)', borderRadius: 14, padding: '16px 20px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <DataTable
        columns={[
          { key: 'userName', label: 'User' },
          { key: 'subject', label: 'Subject', render: r => <span style={{ fontWeight: 600 }}>{r.subject}</span> },
          { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
          { key: 'createdAt', label: 'Created', render: r => new Date(r.createdAt).toLocaleDateString() },
          { key: 'updatedAt', label: 'Updated', render: r => new Date(r.updatedAt).toLocaleDateString() },
        ]}
        rows={loading ? [] : tickets}
        emptyMsg={loading ? 'Loading...' : 'No support tickets found.'}
      />
    </div>
  );
}

// ─── Main BranchDashboard ─────────────────────────────────
export default function BranchDashboard() {
  const { user } = useApp();
  const branchId = user?.branchId || '';
  const orgId    = user?.organizationId || '';
  return (
    <BrandingProvider branchId={branchId} orgId={orgId}>
      <BranchDashboardInner branchId={branchId} orgId={orgId} />
    </BrandingProvider>
  );
}

function BranchDashboardInner({ branchId, orgId }: { branchId: string; orgId: string }) {
  const { branding } = useBranding();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashData, setDashData] = useState<any>(null);
  const [branchInfo, setBranchInfo] = useState<any>(null);
  const [loadingDash, setLoadingDash] = useState(false);

  const loadDashboard = useCallback(() => {
    if (!branchId) return;
    setLoadingDash(true);
    Promise.all([
      api.branch.getDashboard(branchId).catch(() => null),
      api.branch.get(branchId).catch(() => null),
    ]).then(([branchDash, branch]) => {
      setDashData(branchDash || null);
      setBranchInfo(branch);
    }).finally(() => setLoadingDash(false));
  }, [branchId]);

  useEffect(() => { if (activeTab === 'dashboard') loadDashboard(); }, [activeTab, loadDashboard]);

  const counts = dashData?.counts || {};
  const todayAtt = dashData?.attendanceToday || {};

  return (
    <PortalLayout
      title={branding.appName || branchInfo?.name || 'Branch'}
      subtitle="Branch Manager"
      accentColor={branding.primaryColor || '#0ea5e9'}
      logoUrl={branding.logoUrl}
      navItems={NAV} activeTab={activeTab} onTabChange={setActiveTab}
      roleBadge="BRANCH MANAGER" roleBadgeColor={branding.accentColor || branding.primaryColor || '#0ea5e9'}
    >
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Greeting */}
          <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12 }}>
            <div>
              <h2 style={{ fontSize:22,fontWeight:900,margin:'0 0 4px' }}>
                Good Morning, Manager! 👋
              </h2>
              <p style={{ margin:0,color:'var(--text-muted)',fontSize:13 }}>
                Here's the overview of {branchInfo?.name||'your branch'}{branchInfo?.address?.city?` — ${branchInfo.address.city}`:''}
              </p>
            </div>
            <PrimaryBtn onClick={loadDashboard} style={{ fontSize:12 }}><Plus size={13}/> New Enquiry</PrimaryBtn>
          </div>

          {loadingDash ? (
            <div style={{ textAlign:'center',padding:48 }}><Loader size={22} style={{ animation:'spin 1s linear infinite',color:'var(--text-muted)' }}/></div>
          ) : (() => {
            const counts = dashData?.counts||{}; const todayAtt = dashData?.attendanceToday||{}; const revenue = dashData?.revenue||{}; const schedule:any[] = dashData?.todaySchedule||[]; const leads = dashData?.leads||{}; const payments = dashData?.payments||{}; const topTrainers:any[] = dashData?.topTrainers||[]; const expiring:any[] = dashData?.membershipExpiry||[]; const notifications:any[] = dashData?.recentNotifications||[]; const snapshot = dashData?.branchSnapshot||{};
            return (
              <>
                {/* 6 top stat cards */}
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:12 }}>
                  {[
                    { label:'Total Members', value:counts.members??0, sub:`+${counts.newMembersMonth??0} this month`, color:'#0ea5e9', icon:<Users size={18}/> },
                    { label:'New Members', value:counts.newMembersMonth??0, sub:`+${counts.newMembersMonthChange??0} this month`, color:'var(--accent)', icon:<UserPlus size={18}/> },
                    { label:'Active Memberships', value:counts.activeMemberships??counts.activeMembers??0, sub:`${counts.activePct??'84.6'}% of total`, color:'#8b5cf6', icon:<CheckCircle2 size={18}/> },
                    { label:'Revenue (This Month)', value:revenue.thisMonth?`₹${Number(revenue.thisMonth).toLocaleString('en-IN')}`:'—', sub:revenue.revenueChange?`+${revenue.revenueChange}% vs last month`:undefined, color:'#f59e0b', icon:<CreditCard size={18}/> },
                    { label:'Pending Payments', value:payments.pending?`₹${Number(payments.pending).toLocaleString('en-IN')}`:'—', sub:`${payments.pendingCount??0} members`, color:'var(--danger)', icon:<Bell size={18}/> },
                    { label:'Check-Ins Today', value:counts.checkInsToday??todayAtt.present??0, sub:'View details', color:'#22c55e', icon:<CalendarCheck size={18}/> },
                  ].map(s=>(
                    <div key={s.label} style={{ background:'var(--bg-card)',borderRadius:14,padding:'16px 18px',border:'1px solid var(--border)' }}>
                      <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:10 }}>
                        <div style={{ width:36,height:36,borderRadius:10,background:`${s.color}15`,display:'flex',alignItems:'center',justifyContent:'center',color:s.color }}>{s.icon}</div>
                        <span style={{ fontSize:11,color:'var(--text-muted)',fontWeight:600 }}>{s.label}</span>
                      </div>
                      <div style={{ fontSize:22,fontWeight:900,color:s.color }}>{s.value}</div>
                      {s.sub&&<div style={{ fontSize:10,color:'var(--text-muted)',marginTop:4 }}>{s.sub}</div>}
                    </div>
                  ))}
                </div>

                {/* Check-in Overview + Membership Overview + Revenue Overview */}
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14 }}>
                  <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)' }}>
                    <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>Check-In Overview</div>
                    <div style={{ fontSize:32,fontWeight:900,marginBottom:4 }}>{counts.checkInsToday??todayAtt.present??0}</div>
                    <div style={{ fontSize:12,color:'var(--text-muted)',marginBottom:14 }}>Total Check-Ins</div>
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8 }}>
                      {[{label:'Member',value:todayAtt.memberCheckins??counts.memberCheckIns??'—',color:'#22c55e'},{label:'Staff',value:todayAtt.staffCheckins??counts.staffCheckIns??'—',color:'#0ea5e9'},{label:'Guest',value:todayAtt.guestCheckins??counts.guestCheckIns??'—',color:'#a78bfa'}].map(c=>(
                        <div key={c.label} style={{ textAlign:'center',padding:'10px 0',borderRadius:10,background:'var(--bg-base)',border:'1px solid var(--border)' }}>
                          <div style={{ fontSize:18,fontWeight:900,color:c.color }}>{c.value}</div>
                          <div style={{ fontSize:10,color:'var(--text-muted)',marginTop:2 }}>{c.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)' }}>
                    <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>Membership Overview</div>
                    <div style={{ display:'flex',gap:16,alignItems:'center' }}>
                      <div style={{ position:'relative',width:80,height:80,flexShrink:0 }}>
                        <svg width="80" height="80" style={{ transform:'rotate(-90deg)' }}>
                          <circle cx="40" cy="40" r="30" fill="none" stroke="var(--border)" strokeWidth="8"/>
                          <circle cx="40" cy="40" r="30" fill="none" stroke="#22c55e" strokeWidth="8" strokeDasharray={`${2*Math.PI*30*0.846} ${2*Math.PI*30}`} strokeLinecap="round"/>
                        </svg>
                        <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:900 }}>{counts.members??0}</div>
                      </div>
                      <div style={{ flex:1,fontSize:12 }}>
                        {[{label:'Active',value:counts.activeMembers??counts.activeMemberships??0,color:'#22c55e'},{label:'Expiring Soon',value:counts.expiringSoon??0,color:'#f59e0b'},{label:'On Hold',value:counts.onHold??0,color:'#0ea5e9'},{label:'Expired',value:counts.expired??0,color:'var(--danger)'}].map(r=>(
                          <div key={r.label} style={{ display:'flex',justifyContent:'space-between',padding:'3px 0',borderBottom:'1px solid var(--border)' }}>
                            <span style={{ color:'var(--text-secondary)',display:'flex',alignItems:'center',gap:5 }}><span style={{ width:7,height:7,borderRadius:'50%',background:r.color,display:'inline-block' }}/>{r.label}</span>
                            <span style={{ fontWeight:800,color:r.color }}>{r.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)' }}>
                    <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>Revenue Overview</div>
                    <div style={{ fontSize:26,fontWeight:900,color:'#22c55e',marginBottom:4 }}>{revenue.thisMonth?`₹${Number(revenue.thisMonth).toLocaleString('en-IN')}`:'—'}</div>
                    {revenue.revenueChange&&<div style={{ fontSize:11,color:'var(--accent)',marginBottom:14 }}>+{revenue.revenueChange}% vs last month</div>}
                    {[{label:'Membership Fees',value:revenue.membershipFees,pct:71},{label:'PT & Classes',value:revenue.ptClasses,pct:16},{label:'Other Income',value:revenue.otherIncome,pct:13}].map(r=>(
                      <div key={r.label} style={{ marginBottom:8 }}>
                        <div style={{ display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:3 }}>
                          <span style={{ color:'var(--text-secondary)' }}>{r.label}</span>
                          <span style={{ fontWeight:700 }}>{r.value?`₹${Number(r.value).toLocaleString('en-IN')}`:'—'} <span style={{ color:'var(--text-muted)' }}>({r.pct}%)</span></span>
                        </div>
                        <div style={{ height:4,borderRadius:20,background:'var(--metric-bg)',overflow:'hidden' }}><div style={{ height:'100%',width:`${r.pct}%`,borderRadius:20,background:'#8b5cf6' }}/></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Today's Schedule + Leads + Payments + Top Trainers */}
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:14 }}>
                  <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)' }}>
                    <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>Today's Schedule</div>
                    {schedule.length>0?schedule.slice(0,4).map((s:any,i:number)=>(
                      <div key={i} style={{ display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:i<Math.min(schedule.length,4)-1?'1px solid var(--border)':'none' }}>
                        <div style={{ width:44,height:44,borderRadius:10,background:'rgba(139,92,246,0.1)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                          <div style={{ fontSize:10,fontWeight:800,color:'#a78bfa' }}>{s.startTime||'—'}</div>
                        </div>
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ fontWeight:700,fontSize:12,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{s.className||s.name||'Session'}</div>
                          <div style={{ fontSize:10,color:'var(--text-muted)' }}>{s.trainerName||'—'}</div>
                        </div>
                        <span style={{ fontSize:9,padding:'2px 6px',borderRadius:20,background:s.status==='Completed'?'rgba(34,197,94,0.1)':s.status==='Ongoing'?'rgba(245,158,11,0.1)':'rgba(99,102,241,0.1)',color:s.status==='Completed'?'#22c55e':s.status==='Ongoing'?'#f59e0b':'#6366f1',fontWeight:700 }}>{s.status||'Upcoming'}</span>
                      </div>
                    )):<div style={{ textAlign:'center',padding:24,color:'var(--text-muted)',fontSize:12 }}>No sessions today</div>}
                  </div>

                  <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)' }}>
                    <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>Leads & Enquiries</div>
                    {[{label:'New Leads',value:leads.newLeads,change:leads.newLeadsChange},{label:'Contacted',value:leads.contacted,change:leads.contactedChange},{label:'Converted',value:leads.converted,change:leads.convertedChange}].map(r=>(
                      <div key={r.label} style={{ display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border)',fontSize:13 }}>
                        <span style={{ color:'var(--text-secondary)' }}>{r.label}</span>
                        <span style={{ fontWeight:800 }}>{r.value??'—'} {r.change!=null&&<span style={{ fontSize:10,color:'var(--accent)' }}>+{r.change}</span>}</span>
                      </div>
                    ))}
                    {leads.conversionRate!=null&&<div style={{ marginTop:10,padding:'8px 12px',background:'rgba(34,197,94,0.07)',borderRadius:8,fontSize:12,display:'flex',justifyContent:'space-between' }}><span style={{ color:'var(--text-secondary)' }}>Conversion Rate</span><span style={{ fontWeight:800,color:'var(--accent)' }}>{leads.conversionRate}%</span></div>}
                  </div>

                  <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)' }}>
                    <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>Payments Summary</div>
                    {[{label:'Total Collected',value:payments.total,color:'var(--accent)'},{label:'Online Payments',value:payments.online,pct:payments.onlinePct},{label:'Cash Payments',value:payments.cash,pct:payments.cashPct},{label:'Pending',value:payments.pending,color:'var(--danger)'}].map(r=>(
                      <div key={r.label} style={{ display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--border)',fontSize:12 }}>
                        <span style={{ color:'var(--text-secondary)' }}>{r.label}</span>
                        <span style={{ fontWeight:800,color:(r as any).color||'var(--text-primary)' }}>{r.value?`₹${Number(r.value).toLocaleString('en-IN')}`:'—'}{(r as any).pct&&<span style={{ fontSize:10,color:'var(--text-muted)',fontWeight:400 }}> {(r as any).pct}%</span>}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)' }}>
                    <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>Top Performing Trainers</div>
                    {topTrainers.length>0?topTrainers.slice(0,4).map((t:any,i:number)=>(
                      <div key={i} style={{ display:'flex',alignItems:'center',gap:10,padding:'7px 0',borderBottom:i<3?'1px solid var(--border)':'none',fontSize:12 }}>
                        <div style={{ width:32,height:32,borderRadius:10,background:'linear-gradient(135deg,#0ea5e933,#0ea5e966)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:900,color:'#0ea5e9',flexShrink:0 }}>{(t.name||t.firstName||'T')[0].toUpperCase()}</div>
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{t.name||`${t.firstName||''} ${t.lastName||''}`.trim()}</div>
                          <div style={{ fontSize:10,color:'var(--text-muted)' }}>{t.specialty||t.type||'Trainer'}</div>
                        </div>
                        <div style={{ textAlign:'right',flexShrink:0 }}>
                          <div style={{ fontSize:11,fontWeight:800 }}>{t.sessions} Sessions</div>
                          <div style={{ display:'flex',alignItems:'center',gap:2,justifyContent:'flex-end' }}><Star size={10} color="#f59e0b" fill="#f59e0b"/><span style={{ fontSize:10,color:'#f59e0b',fontWeight:700 }}>{t.rating}</span></div>
                        </div>
                      </div>
                    )):<div style={{ textAlign:'center',padding:24,color:'var(--text-muted)',fontSize:12 }}>No trainer data yet.</div>}
                  </div>
                </div>

                {/* Membership Expiry + Notifications */}
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14 }}>
                  <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)' }}>
                    <div style={{ fontWeight:800,fontSize:14,marginBottom:12,display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                      Membership Expiry Alert
                      <button style={{ fontSize:11,color:'var(--accent)',background:'none',border:'none',cursor:'pointer',fontWeight:700 }}>View All</button>
                    </div>
                    {expiring.length>0?expiring.slice(0,5).map((m:any,i:number)=>(
                      <div key={i} style={{ display:'flex',alignItems:'center',gap:12,padding:'8px 0',borderBottom:i<Math.min(expiring.length,5)-1?'1px solid var(--border)':'none',fontSize:12 }}>
                        <div style={{ width:32,height:32,borderRadius:9,background:'rgba(239,68,68,0.1)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--danger)',flexShrink:0 }}><Clock size={14}/></div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700 }}>{m.name||m.memberName||'Member'}</div>
                          <div style={{ fontSize:10,color:'var(--text-muted)' }}>Expires {m.expiresIn||m.expiryDate||'soon'}</div>
                        </div>
                        <span style={{ fontSize:10,padding:'2px 8px',borderRadius:20,background:'rgba(239,68,68,0.1)',color:'var(--danger)',fontWeight:700 }}>Expiring</span>
                      </div>
                    )):<div style={{ textAlign:'center',padding:24,color:'var(--text-muted)',fontSize:12 }}>No expiring memberships.</div>}
                  </div>

                  <div style={{ background:'var(--bg-card)',borderRadius:14,padding:18,border:'1px solid var(--border)' }}>
                    <div style={{ fontWeight:800,fontSize:14,marginBottom:12,display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                      Recent Notifications
                      <button style={{ fontSize:11,color:'var(--accent)',background:'none',border:'none',cursor:'pointer',fontWeight:700 }}>View All</button>
                    </div>
                    {notifications.length>0?notifications.slice(0,5).map((n:any,i:number)=>(
                      <div key={i} style={{ display:'flex',alignItems:'flex-start',gap:10,padding:'8px 0',borderBottom:i<Math.min(notifications.length,5)-1?'1px solid var(--border)':'none',fontSize:12 }}>
                        <div style={{ width:30,height:30,borderRadius:8,background:'rgba(99,102,241,0.1)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}><Bell size={12} color="#6366f1"/></div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:600 }}>{n.message||n.text||'Notification'}</div>
                          <div style={{ fontSize:10,color:'var(--text-muted)',marginTop:2 }}>{n.time||n.createdAt||'—'}</div>
                        </div>
                      </div>
                    )):<div style={{ textAlign:'center',padding:24,color:'var(--text-muted)',fontSize:12 }}>No notifications.</div>}
                  </div>
                </div>

                {/* Branch Snapshot */}
                <div style={{ background:'var(--bg-card)',borderRadius:14,padding:20,border:'1px solid var(--border)' }}>
                  <div style={{ fontWeight:800,fontSize:14,marginBottom:14 }}>Branch Snapshot</div>
                  <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:12 }}>
                    {[
                      { label:'Total Members', value:snapshot.totalMembers??counts.members??0, change:snapshot.totalMembersChange, color:'#0ea5e9', icon:<Users size={14}/> },
                      { label:'Active Members', value:snapshot.activeMembers??counts.activeMembers??0, change:snapshot.activeMembersChange, color:'var(--accent)', icon:<CheckCircle2 size={14}/> },
                      { label:'New Members', value:snapshot.newMembers??counts.newMembersMonth??0, change:snapshot.newMembersChange, color:'#22c55e', icon:<UserPlus size={14}/> },
                      { label:'Avg Daily Check-Ins', value:snapshot.avgDailyCheckins??counts.avgDailyCheckins??0, change:snapshot.checkinChange, color:'#8b5cf6', icon:<CalendarCheck size={14}/> },
                      { label:'Gross Revenue', value:snapshot.grossRevenue?`₹${Number(snapshot.grossRevenue).toLocaleString('en-IN')}`:revenue.thisMonth?`₹${Number(revenue.thisMonth).toLocaleString('en-IN')}`:'—', change:snapshot.revenueChange, color:'#f59e0b', icon:<CreditCard size={14}/> },
                      { label:'Retention Rate', value:snapshot.retentionRate?`${snapshot.retentionRate}%`:counts.retentionRate?`${counts.retentionRate}%`:'—', change:snapshot.retentionChange, color:'#06b6d4', icon:<TrendingUp size={14}/> },
                      { label:'Occupancy (Peak)', value:snapshot.peakOccupancy?`${snapshot.peakOccupancy}%`:'—', change:undefined, color:'#ef4444', icon:<Star size={14}/> },
                    ].map(s=>(
                      <div key={s.label} style={{ background:'var(--bg-base)',borderRadius:12,padding:'14px 16px',border:'1px solid var(--border)' }}>
                        <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:8 }}>
                          <div style={{ width:28,height:28,borderRadius:8,background:`${s.color}15`,display:'flex',alignItems:'center',justifyContent:'center',color:s.color }}>{s.icon}</div>
                          <span style={{ fontSize:11,color:'var(--text-muted)',fontWeight:600 }}>{s.label}</span>
                        </div>
                        <div style={{ fontSize:20,fontWeight:900,color:s.color }}>{s.value}</div>
                        {s.change!=null&&<div style={{ fontSize:10,color:'var(--accent)',marginTop:3 }}>+{s.change} this month</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {activeTab === 'onboard'     && branchId && <MemberRequestsTab branchId={branchId} onAccepted={loadDashboard} />}
      {activeTab === 'members'     && branchId && <UsersTab branchId={branchId} type="MEMBER" />}
      {activeTab === 'trainers'    && branchId && <UsersTab branchId={branchId} type="TRAINER" />}
      {activeTab === 'assignments' && branchId && <AssignmentsTab branchId={branchId} />}
      {activeTab === 'attendance'  && branchId && <AttendanceTab branchId={branchId} />}
      {activeTab === 'support'     && branchId && <SupportTab branchId={branchId} />}
      {activeTab === 'branding'    && branchId && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Branch Branding</h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>Customize how your branch appears to members</p>
          </div>
          <BranchBrandingEditor branchId={branchId} />
        </div>
      )}

      {!branchId && (
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
          <AlertCircle size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p>No branch assigned to your account. Please contact your organization admin.</p>
        </div>
      )}
    </PortalLayout>
  );
}
