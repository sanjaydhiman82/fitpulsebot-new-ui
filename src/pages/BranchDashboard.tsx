import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../App';
import PortalLayout, {
  StatCard, SectionHeader, PrimaryBtn, OutlineBtn, StatusBadge,
  Modal, FormField, inputStyle, DataTable, GRID4, GRID2,
} from '../components/PortalLayout';
import { api } from '../api';
import {
  LayoutDashboard, Users, UserCheck, CalendarCheck, TicketCheck,
  Palette, Plus, Edit2, Trash2, RefreshCw, Loader, Search,
  UserPlus, Link, Unlink, CheckCircle2, XCircle, Clock, AlertCircle,
} from 'lucide-react';

// ─── NAV ─────────────────────────────────────────────────
const NAV = [
  { id: 'dashboard',   label: 'Dashboard',     icon: <LayoutDashboard size={16} /> },
  { id: 'members',     label: 'Members',        icon: <Users size={16} /> },
  { id: 'trainers',    label: 'Trainers',       icon: <UserCheck size={16} /> },
  { id: 'assignments', label: 'Assignments',    icon: <Link size={16} /> },
  { id: 'attendance',  label: 'Attendance',     icon: <CalendarCheck size={16} /> },
  { id: 'support',     label: 'Support',        icon: <TicketCheck size={16} /> },
  { id: 'branding',    label: 'Branding',       icon: <Palette size={16} /> },
];

// ─── Helpers ──────────────────────────────────────────────
function today() { return new Date().toISOString().split('T')[0]; }

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
            <option key={m.userId} value={m.userId}>{m.firstName} {m.lastName} ({m.userName})</option>
          ))}
        </select>
      </FormField>
      <FormField label="Trainer" required>
        <select style={inputStyle} value={trainerId} onChange={e => setTrainerId(e.target.value)}>
          <option value="">Select trainer...</option>
          {trainers.map(t => (
            <option key={t.userId} value={t.userId}>{t.firstName} {t.lastName} ({t.userName})</option>
          ))}
        </select>
      </FormField>
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

// ─── Branch Branding Editor ───────────────────────────────
function BranchBrandingEditor({ branchId }: { branchId: string }) {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.branch.getBranding(branchId).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [branchId]);

  const save = async () => {
    setSaving(true);
    try {
      await api.branch.putBranding(branchId, {
        logoUrl: data.logoUrl, primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor, accentColor: data.accentColor,
        loginBannerUrl: data.loginBannerUrl, metadata: data.metadata || {},
      });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setData((p: any) => ({ ...p, [k]: e.target.value }));

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}><Loader size={22} style={{ animation: 'spin 1s linear infinite' }} /></div>;

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, border: '1px solid var(--border)' }}>
      {data.source === 'organization' && (
        <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--warning)' }}>
          ⚡ Showing inherited Organization branding. Any changes here will create branch-specific branding.
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 16 }}>
        <FormField label="Logo URL">
          <input style={inputStyle} value={data.logoUrl || ''} onChange={f('logoUrl')} placeholder="https://cdn.example.com/logo.png" />
        </FormField>
        <FormField label="Login Banner URL">
          <input style={inputStyle} value={data.loginBannerUrl || ''} onChange={f('loginBannerUrl')} placeholder="https://cdn.example.com/banner.png" />
        </FormField>
        <FormField label="Primary Color">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="color" style={{ width: 44, height: 40, borderRadius: 8, border: '1px solid var(--border)', padding: 2, cursor: 'pointer', background: 'transparent' }} value={data.primaryColor || '#2563EB'} onChange={f('primaryColor')} />
            <input style={{ ...inputStyle, flex: 1 }} value={data.primaryColor || ''} onChange={f('primaryColor')} placeholder="#2563EB" />
          </div>
        </FormField>
        <FormField label="Accent Color">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="color" style={{ width: 44, height: 40, borderRadius: 8, border: '1px solid var(--border)', padding: 2, cursor: 'pointer', background: 'transparent' }} value={data.accentColor || '#22C55E'} onChange={f('accentColor')} />
            <input style={{ ...inputStyle, flex: 1 }} value={data.accentColor || ''} onChange={f('accentColor')} placeholder="#22C55E" />
          </div>
        </FormField>
      </div>
      {data.logoUrl && (
        <div style={{ marginTop: 16, padding: 16, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-base)', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 8px' }}>Logo Preview</p>
          <img src={data.logoUrl} alt="Logo" style={{ maxHeight: 60, maxWidth: 200, objectFit: 'contain' }} onError={e => (e.currentTarget.style.display = 'none')} />
        </div>
      )}
      <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        {saved && <span style={{ fontSize: 12, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={13} /> Saved!</span>}
        <PrimaryBtn onClick={save} loading={saving}>
          {saving && <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} />}
          Save Branding
        </PrimaryBtn>
      </div>
    </div>
  );
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 16 }}>
          {users.map(u => (
            <div key={u.userId} style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 18, border: '1px solid var(--border)', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: type === 'MEMBER' ? 'linear-gradient(135deg,#0ea5e933,#0ea5e966)' : 'linear-gradient(135deg,#f59e0b33,#f59e0b66)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 17, fontWeight: 900,
                color: type === 'MEMBER' ? '#0ea5e9' : '#f59e0b',
              }}>{(u.firstName || u.userName || '?')[0].toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{u.firstName} {u.lastName}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{u.userName}</div>
                {u.phone && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{u.phone}</div>}
                <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
                  <StatusBadge status={u.status} />
                  {u.assignedTrainer && (
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--metric-bg)', padding: '2px 8px', borderRadius: 20 }}>
                      Trainer: {u.assignedTrainer.firstName}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => deactivate(u.userId)} style={{
                width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--danger)', background: 'rgba(229,62,62,0.08)', border: '1px solid rgba(229,62,62,0.2)',
              }}><Trash2 size={13} /></button>
            </div>
          ))}
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

// ─── Assignments Tab ──────────────────────────────────────
function AssignmentsTab({ branchId }: { branchId: string }) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.branch.listAssignments(branchId, { pageSize: 100 }),
      api.branch.listUsers(branchId, { type: 'MEMBER', pageSize: 100 }),
      api.branch.listUsers(branchId, { type: 'TRAINER', pageSize: 100 }),
    ]).then(([a, m, t]) => {
      setAssignments(a.assignments || []);
      setMembers(m.users || []);
      setTrainers(t.users || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [branchId]);

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
        <div style={{ display: 'flex', gap: 10 }}>
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

  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashData, setDashData] = useState<any>(null);
  const [branchInfo, setBranchInfo] = useState<any>(null);
  const [loadingDash, setLoadingDash] = useState(false);

  const loadDashboard = useCallback(() => {
    if (!orgId) return;
    setLoadingDash(true);
    Promise.all([
      api.org.getDashboard(orgId).catch(() => null),
      branchId ? api.branch.get(branchId).catch(() => null) : Promise.resolve(null),
    ]).then(([dash, branch]) => {
      setDashData(dash);
      setBranchInfo(branch);
    }).finally(() => setLoadingDash(false));
  }, [orgId, branchId]);

  useEffect(() => { if (activeTab === 'dashboard') loadDashboard(); }, [activeTab, loadDashboard]);

  const counts = dashData?.counts || {};
  const todayAtt = dashData?.attendanceToday || {};

  return (
    <PortalLayout
      title={branchInfo?.name || 'Branch'}
      subtitle="Branch Manager"
      accentColor="#0ea5e9"
      navItems={NAV} activeTab={activeTab} onTabChange={setActiveTab}
      roleBadge="BRANCH MANAGER" roleBadgeColor="#0ea5e9"
    >
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px' }}>
              {branchInfo ? branchInfo.name : 'Branch'} — Overview
            </h2>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>
              {branchInfo?.address?.city} · {branchInfo?.contactEmail}
            </p>
          </div>

          {loadingDash ? (
            <div style={{ textAlign: 'center', padding: 48 }}><Loader size={22} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)' }} /></div>
          ) : (
            <>
              <div style={GRID4}>
                <StatCard label="Total Members" value={counts.members || 0} icon={<Users size={18} />} color="#0ea5e9" />
                <StatCard label="Active Members" value={counts.activeMembers || 0} icon={<CheckCircle2 size={18} />} color="var(--accent)" />
                <StatCard label="Trainers" value={counts.trainers || 0} icon={<UserCheck size={18} />} color="#f59e0b" />
                <StatCard label="Open Tickets" value={counts.openSupportTickets || 0} icon={<TicketCheck size={18} />} color="var(--danger)" />
              </div>

              <div style={GRID2}>
                <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, border: '1px solid var(--border)' }}>
                  <SectionHeader title="Today's Attendance" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 4 }}>
                    {[
                      { label: 'Present', value: todayAtt.present || 0, color: 'var(--accent)', icon: <CheckCircle2 size={15} /> },
                      { label: 'Absent',  value: todayAtt.absent  || 0, color: 'var(--danger)', icon: <XCircle size={15} /> },
                      { label: 'Late',    value: todayAtt.late    || 0, color: 'var(--warning)', icon: <Clock size={15} /> },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: 'center', padding: '14px 0', borderRadius: 12, background: `${s.color}11`, border: `1px solid ${s.color}33` }}>
                        <div style={{ color: s.color, marginBottom: 6 }}>{s.icon}</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, border: '1px solid var(--border)' }}>
                  <SectionHeader title="Branch Info" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { label: 'Code', value: branchInfo?.code },
                      { label: 'Status', value: branchInfo?.status },
                      { label: 'Timezone', value: branchInfo?.timezone },
                      { label: 'Phone', value: branchInfo?.contactPhone },
                      { label: 'City', value: branchInfo?.address?.city },
                    ].map(item => item.value && (
                      <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

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
