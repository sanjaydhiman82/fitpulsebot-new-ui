import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { useApp } from '../App';
import { RefreshCw, CheckCheck } from 'lucide-react';
import styles from './LogPage.module.css';

interface MessagesPageProps {
  onMessageRead?: () => void;
}

export default function MessagesPage({ onMessageRead }: MessagesPageProps) {
  const { user } = useApp();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true); setError('');
    try {
      const data = await api.messages.getUserMessages(user.userId);
      const arr = Array.isArray(data) ? data : [];
      arr.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setMessages(arr);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id: string) => {
    try {
      await api.messages.markRead(id);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
      onMessageRead?.();
    } catch {}
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.pageTitle}>Messages {unreadCount > 0 && <span style={{ fontSize: 14, padding: '2px 8px', borderRadius: 99, background: 'var(--accent)', color: '#fff', marginLeft: 8 }}>{unreadCount} new</span>}</h2>
          <p className={styles.pageDesc}>Your inbox from FitPulseBot</p>
        </div>
        <button className={styles.refreshBtn} onClick={load}><RefreshCw size={14} className={loading ? styles.spinning : ''} /></button>
      </div>
      {error && <div className={styles.errorBanner}>{error}</div>}
      {loading && <div className={styles.loadingRow}>Loading messages…</div>}
      {!loading && messages.length === 0 && <div className={styles.emptyRow}>No messages yet.</div>}

      <div className={styles.logList}>
        {messages.map((m: any) => (
          <div key={m.id} className={styles.logItem} style={{ background: m.is_read ? 'var(--bg-card)' : 'var(--accent-light)', borderColor: m.is_read ? 'var(--border)' : 'var(--border-strong)' }}>
            <div style={{ fontSize: 24 }}>{m.is_read ? '📩' : '📬'}</div>
            <div style={{ flex: 1 }}>
              <div className={styles.logName} style={{ color: m.is_read ? 'var(--text-primary)' : 'var(--accent)' }}>{m.message}</div>
              <div className={styles.logMeta}>{new Date(m.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            {!m.is_read && (
              <button className={styles.saveBtn} style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => markRead(m.id)}>
                <CheckCheck size={13} /> Read
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
