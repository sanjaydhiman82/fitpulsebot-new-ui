import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft, CalendarCheck, CheckCircle2, Link,
  Loader, RefreshCw, TicketCheck, UserCheck, Users,
} from 'lucide-react';
import {
  DataTable, GRID4, OutlineBtn, SectionHeader, StatCard, StatusBadge,
} from './PortalLayout';
import { api } from '../api';

const rowField = (row: any, camel: string, snake: string) => row?.[camel] ?? row?.[snake];

const displayName = (row: any) => {
  const firstName = rowField(row, 'firstName', 'first_name') || row?.firstName || '';
  const lastName = rowField(row, 'lastName', 'last_name') || row?.lastName || '';
  const userName = rowField(row, 'userName', 'user_name') || row?.userName || '';
  return `${firstName} ${lastName}`.trim() || userName || 'Unnamed user';
};

const addressText = (address: any) => {
  if (!address) return '-';
  if (typeof address === 'string') return address;
  return [address.line1, address.city, address.state, address.country, address.pincode].filter(Boolean).join(', ') || '-';
};

const formatDate = (value: any) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
};

const userSummary = (rows: any[]) => rows.map(user => ({
  ...user,
  displayName: displayName(user),
  userName: rowField(user, 'userName', 'user_name') || '-',
  phone: rowField(user, 'phone', 'phone') || '-',
  joinedAt: rowField(user, 'joinedAt', 'joined_at'),
}));

export default function BranchDetailPanel({
  branchId,
  branch: initialBranch,
  onBack,
  title = 'Branch Detail',
}: {
  branchId: string;
  branch?: any;
  onBack?: () => void;
  title?: string;
}) {
  const [branch, setBranch] = useState<any>(initialBranch || null);
  const [members, setMembers] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!branchId) return;
    setLoading(true);
    setError('');
    Promise.all([
      api.branch.get(branchId).catch(() => initialBranch || null),
      api.branch.listUsers(branchId, { type: 'MEMBER', pageSize: 100 }).catch(() => ({ users: [] })),
      api.branch.listUsers(branchId, { type: 'TRAINER', pageSize: 100 }).catch(() => ({ users: [] })),
      api.branch.listAssignments(branchId, { pageSize: 100 }).catch(() => ({ assignments: [] })),
      api.branch.getAttendance(branchId, { pageSize: 20 }).catch(() => ({ attendance: [] })),
      api.branch.getSupportTickets(branchId).catch(() => ({ tickets: [] })),
    ])
      .then(([branchData, memberData, trainerData, assignmentData, attendanceData, ticketData]) => {
        setBranch(branchData || initialBranch || null);
        setMembers(userSummary(memberData.users || []));
        setTrainers(userSummary(trainerData.users || []));
        setAssignments(assignmentData.assignments || []);
        setAttendance(attendanceData.attendance || []);
        setTickets(ticketData.tickets || []);
      })
      .catch((e: any) => setError(e.message || 'Failed to load branch detail.'))
      .finally(() => setLoading(false));
  }, [branchId, initialBranch]);

  useEffect(() => { load(); }, [load]);

  const activeMembers = members.filter(m => m.status === 'active').length;
  const activeTrainers = trainers.filter(t => t.status === 'active').length;
  const openTickets = tickets.filter(t => ['open', 'pending', 'new'].includes(String(t.status || '').toLowerCase())).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {onBack && (
            <OutlineBtn onClick={onBack} style={{ padding: '9px 11px' }}>
              <ArrowLeft size={14} /> Back
            </OutlineBtn>
          )}
          <div>
            <h2 style={{ fontSize: 21, fontWeight: 900, margin: 0 }}>{branch?.name || title}</h2>
            <p style={{ margin: '3px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
              {branch?.code || 'Branch'} · {addressText(branch?.address)}
            </p>
          </div>
        </div>
        <OutlineBtn onClick={load}>
          <RefreshCw size={13} /> Refresh
        </OutlineBtn>
      </div>

      {error && (
        <div style={{ color: 'var(--danger)', background: 'rgba(229,62,62,0.08)', border: '1px solid rgba(229,62,62,0.2)', borderRadius: 12, padding: 12, fontSize: 13 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 64, color: 'var(--text-muted)' }}>
          <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <>
          <div style={GRID4}>
            <StatCard label="Members" value={members.length} sub={`${activeMembers} active`} icon={<Users size={18} />} color="#0ea5e9" />
            <StatCard label="Trainers" value={trainers.length} sub={`${activeTrainers} active`} icon={<UserCheck size={18} />} color="#f59e0b" />
            <StatCard label="Assignments" value={assignments.length} icon={<Link size={18} />} color="var(--accent)" />
            <StatCard label="Open Tickets" value={openTickets} icon={<TicketCheck size={18} />} color="var(--danger)" />
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
            <SectionHeader title="Branch Information" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {[
                { label: 'Status', value: branch?.status, badge: true },
                { label: 'Contact Email', value: rowField(branch, 'contactEmail', 'contact_email') },
                { label: 'Contact Phone', value: rowField(branch, 'contactPhone', 'contact_phone') },
                { label: 'Manager', value: rowField(branch, 'managerUserName', 'manager_user_name') },
                { label: 'Timezone', value: branch?.timezone },
                { label: 'Created', value: formatDate(rowField(branch, 'createdAt', 'created_at')) },
              ].map(item => (
                <div key={item.label} style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>{item.label}</div>
                  <div style={{ marginTop: 5, fontSize: 13, color: 'var(--text-primary)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.badge && item.value ? <StatusBadge status={item.value} /> : item.value || '-'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 18 }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
              <SectionHeader title="Trainers" />
              <DataTable
                rows={trainers}
                emptyMsg="No trainers found for this branch."
                columns={[
                  { key: 'displayName', label: 'Trainer' },
                  { key: 'userName', label: 'Username' },
                  { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
                ]}
              />
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
              <SectionHeader title="Members" />
              <DataTable
                rows={members.slice(0, 10)}
                emptyMsg="No members found for this branch."
                columns={[
                  { key: 'displayName', label: 'Member' },
                  { key: 'userName', label: 'Username' },
                  { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
                ]}
              />
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
            <SectionHeader title="Trainer Assignments" />
            <DataTable
              rows={assignments}
              emptyMsg="No trainer assignments found."
              columns={[
                { key: 'member', label: 'Member', render: r => displayName(r.member || {}) },
                { key: 'trainer', label: 'Trainer', render: r => displayName(r.trainer || {}) },
                { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
                { key: 'assignedAt', label: 'Assigned', render: r => formatDate(rowField(r, 'assignedAt', 'assigned_at')) },
              ]}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 18 }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
              <SectionHeader title="Recent Attendance" action={<CalendarCheck size={15} color="var(--text-muted)" />} />
              <DataTable
                rows={attendance}
                emptyMsg="No attendance records found."
                columns={[
                  { key: 'attendanceDate', label: 'Date', render: r => formatDate(rowField(r, 'attendanceDate', 'attendance_date')) },
                  { key: 'userName', label: 'User', render: r => rowField(r, 'userName', 'user_name') || r.user_id || '-' },
                  { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
                ]}
              />
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
              <SectionHeader title="Support Tickets" action={<CheckCircle2 size={15} color="var(--text-muted)" />} />
              <DataTable
                rows={tickets}
                emptyMsg="No support tickets found."
                columns={[
                  { key: 'subject', label: 'Subject', render: r => r.subject || '-' },
                  { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status || 'open'} /> },
                  { key: 'createdAt', label: 'Created', render: r => formatDate(rowField(r, 'createdAt', 'created_at')) },
                ]}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
