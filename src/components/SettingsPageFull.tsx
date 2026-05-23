import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import { api } from '../api';
import { CreditCard, Download, History, RefreshCw, X, Zap } from 'lucide-react';
import { createSubscriptionOrder, ensureRazorpayCheckoutAvailable, openRazorpayCheckout } from './subscriptionCheckout';
import styles from './LogPage.module.css';
import siteVersion from '../config/site-version.json';

const PLAN_ORDER = ['Start', 'Pro', 'Elite'];
const PLAN_COLORS: Record<string, string> = { Start: '#3dbf96', Pro: '#5bc8e0', Elite: '#9f7aea' };

export default function SettingsPageFull() {
  const { user, toggleTheme, theme, requestLogout } = useApp();

  // Subscription state
  const [plans, setPlans] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState('');
  const [upgrading, setUpgrading] = useState('');
  const [toast, setToast] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyOrders, setHistoryOrders] = useState<any[]>([]);
  const [historyError, setHistoryError] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadSub = async () => {
    if (!user) return;
    setSubLoading(true); setSubError('');
    try {
      const [plansRes, subRes, ordersRes] = await Promise.all([
        api.subscription.getPlans().catch(() => null),
        api.subscription.getUserSubscription(user.userId).catch(() => null),
        api.subscription.getUserOrders(user.userId).catch(() => []),
      ]);
      setPlans(plansRes?.plans || (Array.isArray(plansRes) ? plansRes : []));
      setSubscription(subRes?.subscription || subRes || null);
      setOrders(Array.isArray(ordersRes) ? ordersRes : []);
      api.profile.get().then(setProfile).catch(() => null);
    } catch (e: any) { setSubError(e.message); }
    setSubLoading(false);
  };

  useEffect(() => { loadSub(); }, [user]);

  const currentPlan = subscription?.plan || user?.plan || 'Start';
  const currentIdx = PLAN_ORDER.findIndex(p => p.toLowerCase() === currentPlan.toLowerCase());
  const upgradePlans = PLAN_ORDER.filter((_, i) => i > currentIdx);

  const handleUpgrade = async (planName: string) => {
    if (!user) return;
    setSubError('');
    const plan = plans.find(p => p.name?.toLowerCase() === planName.toLowerCase());
    if (!plan) { setSubError(`Plan "${planName}" not found. Refresh and try again.`); return; }
    setUpgrading(planName);
    try {
      await ensureRazorpayCheckoutAvailable();
      const order = await createSubscriptionOrder(planName, plan, user, profile);
      const checkout = await openRazorpayCheckout(order, user, planName, {
        onSuccess: async (verification) => {
          if (verification?.success === false) {
            setSubError('Payment verification failed. Please contact support with your payment id.');
            return;
          }
          setPaymentSuccess(
            verification?.email_error
              ? `${planName} payment successful. Your subscription is active, but invoice email failed: ${verification.email_error}`
              : `${planName} payment successful. Your subscription is active.`
          );
          showToast(`${planName} payment successful.`);
          await loadSub();
        },
        onDismiss: () => {
          showToast('Payment window closed. Your plan will update only after successful payment.');
        },
      });
      if (checkout.opened) {
        showToast(`Upgrade to ${planName} initiated. Complete payment to activate.`);
      }
    } catch (e: any) { setSubError(e.message); }
    setUpgrading('');
  };

  const loadHistory = async () => {
    if (!user) return;
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const res = await api.subscription.getOrderSummary(user.userId);
      setHistoryOrders(Array.isArray(res?.orders) ? res.orders : []);
    } catch (e: any) {
      setHistoryError(e.message || 'Unable to load subscription history.');
    }
    setHistoryLoading(false);
  };

  const exportHistory = () => {
    const headers = ['Order ID', 'Receipt', 'Status', 'Amount Paid', 'Currency', 'Created At', 'Payment ID'];
    const rows = historyOrders.map(o => [
      o.order_id || '',
      o.receipt || '',
      o.status || '',
      o.amount_paid ?? 0,
      o.currency || '',
      o.created_at || '',
      o.payment_id || '',
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscription-history-${user?.userId || 'user'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div><h2 className={styles.pageTitle}>Settings</h2><p className={styles.pageDesc}>Account, subscription &amp; preferences</p></div>
        <button className={styles.refreshBtn} onClick={loadSub} title="Refresh subscription">
          <RefreshCw size={14} className={subLoading ? styles.spinning : ''} />
        </button>
      </div>

      {toast && (
        <div style={{ padding: '11px 14px', background: 'rgba(61,191,150,.12)', border: '1px solid rgba(61,191,150,.3)', borderRadius: 12, color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>
          {toast}
        </div>
      )}

      {paymentSuccess && (
        <div style={{ padding: '14px 16px', background: 'rgba(61,191,150,.14)', border: '1.5px solid rgba(61,191,150,.34)', borderRadius: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent)' }}>Payment successful</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{paymentSuccess}</div>
          </div>
          <button className={styles.refreshBtn} onClick={() => setPaymentSuccess('')} title="Close">
            <X size={15} />
          </button>
        </div>
      )}

      {/* ── Account ── */}
      <div className={styles.formCard}>
        <h3 className={styles.formTitle}>Account</h3>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Row label="Username" value={user?.userName || '—'} />
          <Row label="Name" value={[user?.firstName, user?.lastName].filter(Boolean).join(' ') || '—'} />
          <Row
            label="Appearance"
            value={theme === 'dark' ? 'Dark mode' : 'Light mode'}
            action={
              <button className={styles.saveBtn} style={{ padding: '7px 14px', fontSize: 12 }} onClick={toggleTheme}>
                Switch
              </button>
            }
            noBorder
          />
        </div>
      </div>

      {/* ── Subscription ── */}
      <div className={styles.formCard}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
          <h3 className={styles.formTitle} style={{ marginBottom: 0 }}>Subscription</h3>
          <button className={styles.refreshBtn} onClick={loadHistory} title="Subscription history">
            <History size={15} />
          </button>
        </div>

        {subError && <div className={styles.errorBanner} style={{ marginBottom: 14 }}>{subError}</div>}

        {/* Current plan pill */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--metric-bg)', borderRadius: 12, marginBottom: 14, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Zap size={16} color={PLAN_COLORS[currentPlan] || 'var(--accent)'} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                {currentPlan} Plan
                <span style={{ marginLeft: 8, fontSize: 11, padding: '2px 8px', borderRadius: 99, background: (PLAN_COLORS[currentPlan] || 'var(--accent)') + '20', color: PLAN_COLORS[currentPlan] || 'var(--accent)', fontWeight: 700 }}>
                  Active
                </span>
              </div>
              {subscription?.end_date && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Renews {new Date(subscription.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upgrade options — compact inline rows */}
        {upgradePlans.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {upgradePlans.map(planName => {
              const planData = plans.find(p => p.name?.toLowerCase() === planName.toLowerCase());
              const price = planData?.priceLabel || planData?.price || '';
              const color = PLAN_COLORS[planName];
              return (
                <div key={planName} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: `1px solid ${color}40`, borderRadius: 12, background: color + '08', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color }}>{planName}</div>
                    {price && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{price}/mo</div>}
                  </div>
                  <button
                    onClick={() => handleUpgrade(planName)}
                    disabled={upgrading === planName}
                    style={{ padding: '7px 16px', background: color, color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 700, flexShrink: 0, opacity: upgrading === planName ? 0.7 : 1 }}
                  >
                    {upgrading === planName ? 'Processing…' : `Upgrade →`}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Order history — compact */}
        {orders.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Order History</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {orders.map((o: any, i: number) => (
                <div key={o.id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'var(--metric-bg)', borderRadius: 10, fontSize: 13, border: '1px solid var(--border)' }}>
                  <CreditCard size={14} color="var(--accent)" style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1, fontWeight: 600, color: 'var(--text-primary)' }}>{o.planName || o.plan || 'Subscription'}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent)' }}>₹{((o.amount || 0) / 100).toFixed(0)}</span>
                  <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: o.status === 'paid' ? 'rgba(61,191,150,.15)' : 'var(--metric-bg)', color: o.status === 'paid' ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 700, border: '1px solid var(--border)' }}>
                    {o.status || 'pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Application ── */}
      <div className={styles.formCard}>
        <h3 className={styles.formTitle}>Application</h3>
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 14 }}>
          <Row label="Version" value={`v${siteVersion.version}`} noBorder />
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
          Your data is safely stored. You can sign back in anytime.
        </p>
        <button
          style={{ padding: '10px 20px', background: 'var(--danger)', color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: 13, transition: 'all 200ms' }}
          onClick={requestLogout}
        >
          Sign Out
        </button>
      </div>

      {historyOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: 'min(920px, 100%)', maxHeight: '82vh', overflow: 'hidden', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Subscription History</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{historyOrders.length} orders</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className={styles.saveBtn} style={{ padding: '8px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }} onClick={exportHistory} disabled={!historyOrders.length}>
                  <Download size={14} /> Export
                </button>
                <button className={styles.refreshBtn} onClick={() => setHistoryOpen(false)} title="Close">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div style={{ padding: 18, overflow: 'auto' }}>
              {historyError && <div className={styles.errorBanner} style={{ marginBottom: 12 }}>{historyError}</div>}
              {historyLoading && <div className={styles.loadingRow}>Loading subscription history...</div>}
              {!historyLoading && historyOrders.length === 0 && !historyError && (
                <div className={styles.emptyRow}>No subscription history found.</div>
              )}
              {!historyLoading && historyOrders.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {historyOrders.map((o, i) => (
                    <div key={o.id || i} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr .8fr .8fr', gap: 12, alignItems: 'center', padding: '12px 14px', background: 'var(--metric-bg)', border: '1px solid var(--border)', borderRadius: 12 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{o.order_id || 'Order'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{o.receipt || o.id}</div>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {o.created_at ? new Date(o.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent)' }}>
                        {o.currency || 'INR'} {Number(o.amount_paid || 0).toLocaleString()}
                      </div>
                      <div style={{ justifySelf: 'end', fontSize: 11, padding: '3px 9px', borderRadius: 99, background: String(o.status).toUpperCase() === 'PAID' ? 'rgba(61,191,150,.15)' : 'var(--bg-card)', color: String(o.status).toUpperCase() === 'PAID' ? 'var(--accent)' : 'var(--text-muted)', border: '1px solid var(--border)', fontWeight: 800 }}>
                        {o.status || '—'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, action, noBorder }: { label: string; value: string; action?: React.ReactNode; noBorder?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: noBorder ? 'none' : '1px solid var(--border)', gap: 12 }}>
      <div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{value}</div>
      </div>
      {action}
    </div>
  );
}
