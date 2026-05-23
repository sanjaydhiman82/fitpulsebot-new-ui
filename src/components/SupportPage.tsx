import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useApp } from '../App';
import { Plus, RefreshCw, ChevronDown, ChevronUp, Send, X } from 'lucide-react';
import styles from './LogPage.module.css';
import sStyles from './SupportPage.module.css';

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const CATEGORIES = ['Technical Issue','Billing Question','Feature Request','Account Problem','Data Sync Issue','Bug Report','General Inquiry','Other'];
const STATUS_COLORS: Record<string, string> = { open: '#3dbf96', 'in-progress': '#f59e0b', resolved: '#5bc8e0', closed: '#94a3b8' };
const PRIORITY_COLORS: Record<string, string> = { urgent: '#fc8181', high: '#f97316', medium: '#f59e0b', low: '#3dbf96' };

export default function SupportPage() {
  const { user } = useApp();
  const [tickets, setTickets] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [ticketDetail, setTicketDetail] = useState<Record<string, any>>({});
  const [form, setForm] = useState({ subject: '', description: '', category: 'Technical Issue', priority: 'medium' });
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const openCount = tickets.filter(t => String(t.status || '').toLowerCase() === 'open').length;
  const inProgressCount = tickets.filter(t => ['in-progress', 'in_progress', 'pending'].includes(String(t.status || '').toLowerCase())).length;
  const resolvedCount = tickets.filter(t => ['resolved', 'closed'].includes(String(t.status || '').toLowerCase())).length;
  const latestTicket = tickets
    .filter(t => t.createdAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  const load = async () => {
    if (!user) return;
    setLoading(true); setError('');
    try {
      const data = await api.support.getTickets(user.userId);
      // API returns array of { id, subject, status, createdAt }
      setTickets(Array.isArray(data) ? data : (data?.tickets || []));
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const loadDetail = async (ticketId: string) => {
    try {
      const d = await api.support.getTicket(ticketId);
      setTicketDetail(prev => ({ ...prev, [ticketId]: d }));
    } catch {}
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (!ticketDetail[id]) loadDetail(id);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      await api.support.createTicket({ userId: user.userId, ...form });
      setForm({ subject: '', description: '', category: 'Technical Issue', priority: 'medium' });
      setShowForm(false);
      setSuccess('Ticket created successfully!');
      setTimeout(() => setSuccess(''), 3000);
      load();
    } catch (e: any) { setError(e.message); }
    setSaving(false);
  };

  const handleReply = async (ticketId: string) => {
    const msg = replyText[ticketId]?.trim();
    if (!msg || !user) return;
    try {
      await api.support.addMessage(ticketId, { senderId: user.userId, message: msg });
      setReplyText(prev => ({ ...prev, [ticketId]: '' }));
      loadDetail(ticketId);
    } catch (e: any) { setError(e.message); }
  };

  const handleClose = async (ticketId: string) => {
    if (!user) return;
    try {
      await api.support.closeTicket(ticketId, user.userId);
      load();
      setExpandedId(null);
    } catch (e: any) { setError(e.message); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div><h2 className={styles.pageTitle}>Support</h2><p className={styles.pageDesc}>Get help and track your tickets</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={styles.refreshBtn} onClick={load}><RefreshCw size={14} className={loading ? styles.spinning : ''} /></button>
          <button className={styles.addBtn} onClick={() => setShowForm(v => !v)}><Plus size={15} /> New Ticket</button>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}
      {success && <div className={sStyles.successBanner}>{success}</div>}

      <div className={styles.summaryRow}>
        <CounterCard label="Total Tickets" value={tickets.length} color="#5bc8e0" />
        <CounterCard label="Open" value={openCount} color="#3dbf96" />
        <CounterCard label="In Progress" value={inProgressCount} color="#f59e0b" />
        <CounterCard label="Resolved" value={resolvedCount} color="#9f7aea" />
        <CounterCard
          label="Latest"
          value={latestTicket?.createdAt ? new Date(latestTicket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
          color="#ed8936"
        />
      </div>

      {/* Create form */}
      {showForm && (
        <div className={styles.formCard}>
          <h3 className={styles.formTitle}>Create Support Ticket</h3>
          <form onSubmit={handleCreate}>
            <div className={styles.formGrid}>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label>Subject</label>
                <input placeholder="Describe your issue briefly" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required />
              </div>
              <div className={styles.field}>
                <label>Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label>Priority</label>
                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label>Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={4} placeholder="Please describe your issue in detail..." required style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div className={styles.formActions}>
              <button type="button" className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className={styles.saveBtn} disabled={saving}>{saving ? 'Creating…' : 'Create Ticket'}</button>
            </div>
          </form>
        </div>
      )}

      {loading && <div className={styles.loadingRow}>Loading tickets…</div>}
      {!loading && tickets.length === 0 && !showForm && (
        <div className={styles.emptyRow}>
          No support tickets yet.<br />
          <button className={styles.addBtn} style={{ marginTop: 12 }} onClick={() => setShowForm(true)}><Plus size={14} /> Create your first ticket</button>
        </div>
      )}

      {/* Ticket list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tickets.map((t: any) => {
          const detail = ticketDetail[t.id];
          const isOpen = expandedId === t.id;
          const statusColor = STATUS_COLORS[t.status] || '#94a3b8';
          const priorityColor = PRIORITY_COLORS[t.priority] || '#94a3b8';

          return (
            <div key={t.id} className={sStyles.ticketCard}>
              {/* Ticket header row */}
              <div className={sStyles.ticketHeader} onClick={() => toggleExpand(t.id)}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span className={sStyles.ticketSubject}>{t.subject}</span>
                    <span className={sStyles.badge} style={{ background: statusColor + '20', color: statusColor }}>
                      {t.status}
                    </span>
                    {t.priority && (
                      <span className={sStyles.badge} style={{ background: priorityColor + '20', color: priorityColor }}>
                        {t.priority}
                      </span>
                    )}
                  </div>
                  <div className={sStyles.ticketMeta}>
                    {t.category && <span>{t.category}</span>}
                    {t.createdAt && <span>{new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                  </div>
                </div>
                <button className={sStyles.expandBtn}>
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div className={sStyles.ticketBody}>
                  {detail ? (
                    <>
                      {detail.description && (
                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
                          {detail.description}
                        </p>
                      )}

                      {/* Messages */}
                      {detail.messages?.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                          {detail.messages.map((m: any, i: number) => (
                            <div key={i} className={sStyles.message} style={{ alignSelf: m.isFromSupport ? 'flex-start' : 'flex-end' }}>
                              <div className={sStyles.messageLabel}>{m.isFromSupport ? '🎧 Support' : '👤 You'}</div>
                              <div className={sStyles.messageBubble} style={{ background: m.isFromSupport ? 'var(--accent-light)' : 'var(--metric-bg)', borderColor: m.isFromSupport ? 'var(--border-strong)' : 'var(--border)' }}>
                                {m.message}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {detail.messages?.length === 0 && (
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14, fontStyle: 'italic' }}>No messages yet.</p>
                      )}

                      {/* Reply + close */}
                      {t.status !== 'closed' && t.status !== 'resolved' && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input
                            style={{ flex: 1 }}
                            placeholder="Reply to this ticket…"
                            value={replyText[t.id] || ''}
                            onChange={e => setReplyText(prev => ({ ...prev, [t.id]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && handleReply(t.id)}
                          />
                          <button className={styles.saveBtn} style={{ padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => handleReply(t.id)}>
                            <Send size={13} /> Send
                          </button>
                          <button className={styles.cancelBtn} style={{ padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => handleClose(t.id)}>
                            <X size={13} /> Close
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className={styles.loadingRow}>Loading ticket details…</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CounterCard({ label, value, color }: { label: string; value: React.ReactNode; color: string }) {
  return (
    <div className={styles.sumCard}>
      <div className={styles.sumLabel}>{label}</div>
      <div className={styles.sumValue} style={{ color }}>{value}</div>
    </div>
  );
}
