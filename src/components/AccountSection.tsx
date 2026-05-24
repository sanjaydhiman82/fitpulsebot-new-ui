import React, { useEffect, useState } from 'react';
import { Sparkles, Crown, MessageCircle, ChevronRight } from 'lucide-react';
import { api, getUserId } from '../api';
import { useApp } from '../App';
import { DashTab } from '../pages/Dashboard';
import { useCountUp } from '../utils/useCountUp';
import s from './sections.module.css';

interface Props { setTab: (t: DashTab) => void; }

function AnimNum({ val, dec = 1 }: { val: number; dec?: number }) {
  const n = useCountUp(val, 1000);
  return <span className={s.animNum}>{n.toFixed(dec)}</span>;
}

export default function AccountSection({ setTab }: Props) {
  const { user } = useApp();
  const [credit, setCredit]   = useState<any>(null);
  const [sub,    setSub]      = useState<any>(null);
  const [msgs,   setMsgs]     = useState<any[]>([]);

  useEffect(() => {
    const uid = getUserId();
    if (!uid) return;
    // Load in parallel — each fails independently
    api.subscription.getUserCredit(uid).then(setCredit).catch(() => {});
    api.subscription.getUserSubscription(uid).then(setSub).catch(() => {});
    api.messages.getUserMessages(uid).then((res: any) => {
      const arr = Array.isArray(res) ? res : res?.messages || [];
      setMsgs(arr);
    }).catch(() => {});
  }, []);

  const unread   = msgs.filter((m: any) => !m.isRead && !m.is_read).length;
  const planName = sub?.plan || user?.plan || 'Start';
  const isElite  = planName === 'Elite';
  const isPro    = planName === 'Pro';

  const allocated  = credit?.allocatedCredit  ?? 0;
  const available  = credit?.availableCredit  ?? 0;
  const usedCredit = Math.max(0, allocated - available);
  const creditPct  = allocated > 0 ? Math.round(available / allocated * 100) : 0;

  const renewDate = sub?.endDate
    ? new Date(sub.endDate).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
    : null;

  const PLAN_PRICE: Record<string, string> = { Start: 'Free', Pro: '₹199/mo', Elite: '₹299/mo' };

  return (
    <div className={s.grid3} key="account">

      {/* AI Credit balance */}
      <div className={s.card} style={{ animation: 'scaleIn 320ms cubic-bezier(.22,.68,0,1.2) both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div className={s.listIcon} style={{ background: 'rgba(159,122,234,.15)', border: '1px solid rgba(159,122,234,.3)' }}>
            <Sparkles size={16} color="#9f7aea" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>AI Credits</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 32, fontWeight: 800, color: '#9f7aea', letterSpacing: '-0.04em', lineHeight: 1 }}>
            {credit ? <AnimNum val={available} /> : '—'}
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            of {allocated > 0 ? Math.round(allocated) : '—'}
          </span>
        </div>
        <div className={s.statBar}>
          <div className={s.statBarFill} style={{ width: `${creditPct}%`, background: '#9f7aea' }} />
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
          {allocated > 0 ? `${Math.round(usedCredit)} credits used this cycle` : 'No subscription found'}
        </p>
      </div>

      {/* Subscription status */}
      <div className={s.card} style={{ animation: 'scaleIn 320ms cubic-bezier(.22,.68,0,1.2) 60ms both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div className={s.listIcon} style={{ background: 'var(--accent-light)', border: '1px solid var(--border-strong)' }}>
            <Crown size={16} color="var(--accent)" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Subscription</span>
        </div>
        <div style={{ marginBottom: 10 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', borderRadius: 'var(--radius-full)',
            background: isElite ? 'rgba(217,119,6,.15)' : isPro ? 'var(--accent-light)' : 'var(--metric-bg)',
            border: `1px solid ${isElite ? 'rgba(217,119,6,.4)' : isPro ? 'var(--border-strong)' : 'var(--border)'}`,
            fontSize: 12, fontWeight: 700,
            color: isElite ? 'var(--warning)' : isPro ? 'var(--accent)' : 'var(--text-secondary)',
          }}>
            {isElite && <span>⭐</span>}{planName} Plan
          </span>
        </div>
        {renewDate && (
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
            Renews {renewDate}
          </p>
        )}
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          {PLAN_PRICE[planName] || 'Free'}
        </p>
        {!isElite && (
          <button
            onClick={() => setTab('settings')}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--border)', fontSize: 12, fontWeight: 700,
              color: 'var(--text-primary)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 4, transition: 'all var(--transition)',
            }}
          >
            Upgrade to {isPro ? 'Elite' : 'Pro'} <ChevronRight size={13} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className={s.card} style={{ animation: 'scaleIn 320ms cubic-bezier(.22,.68,0,1.2) 120ms both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div className={s.listIcon} style={{ background: 'rgba(229,62,62,.1)', border: '1px solid rgba(229,62,62,.25)' }}>
            <MessageCircle size={16} color="#e53e3e" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Messages</span>
          {unread > 0 && (
            <span style={{
              marginLeft: 'auto', background: '#e53e3e', color: '#fff',
              borderRadius: 'var(--radius-full)', padding: '2px 8px', fontSize: 11, fontWeight: 700,
            }}>
              {unread}
            </span>
          )}
        </div>
        {msgs.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No messages yet.</p>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 30, fontWeight: 800, color: unread > 0 ? '#e53e3e' : 'var(--text-muted)', letterSpacing: '-0.04em', lineHeight: 1 }}>
                <AnimNum val={unread} dec={0} />
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>unread</span>
            </div>
            {msgs.slice(0, 2).map((m: any, i: number) => (
              <div className={s.listItem} key={i} style={{ padding: '6px 0' }}>
                <span style={{
                  fontSize: 12, color: m.isRead || m.is_read ? 'var(--text-muted)' : 'var(--text-secondary)',
                  fontWeight: m.isRead || m.is_read ? 400 : 600,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {m.subject || m.message?.slice(0, 50) || 'Message'}
                </span>
              </div>
            ))}
          </>
        )}
        <button
          onClick={() => setTab('messages')}
          style={{
            marginTop: 10, fontSize: 12, color: 'var(--accent)', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 3,
          }}
        >
          View all <ChevronRight size={12} />
        </button>
      </div>

    </div>
  );
}
