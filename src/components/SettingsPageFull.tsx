import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../App';
import { api } from '../api';
import { Check, CreditCard, Download, History, RefreshCw, X, Zap } from 'lucide-react';
import { createSubscriptionOrder, ensureRazorpayCheckoutAvailable, getPlanAmountPaise, openRazorpayCheckout } from './subscriptionCheckout';
import styles from './LogPage.module.css';
import sStyles from './SubscriptionPage.module.css';
import siteVersion from '../config/site-version.json';

const PLAN_ORDER = ['Start', 'Pro', 'Elite'];
const PLAN_COLORS: Record<string, string> = { Start: '#3dbf96', Pro: '#5bc8e0', Elite: '#9f7aea' };
const DURATION_OPTIONS = [
  { months: 1, discount: 0 },
  { months: 3, discount: 2 },
  { months: 6, discount: 5 },
  { months: 12, discount: 8 },
  { months: 24, discount: 10 },
];

const toTitle = (value: string) => value
  .replace(/[_-]/g, ' ')
  .replace(/\b\w/g, char => char.toUpperCase());

const getPlanCredit = (plan: any) => Number(plan?.credit ?? plan?.credits ?? plan?.ai_credit ?? plan?.aiCredits ?? 0);

const getLimitPlanName = (limit: any) => String(limit?.plan_name ?? limit?.plan ?? '').toLowerCase();

const getLimitLabel = (limit: any) => {
  const raw = limit?.feature_key ?? limit?.limit_key ?? limit?.key ?? limit?.feature ?? limit?.name ?? 'Limit';
  return toTitle(String(raw));
};

const getLimitValue = (limit: any) => {
  const value = limit?.limit_value ?? limit?.max_value ?? limit?.value ?? limit?.amount;
  if (value === true) return 'Included';
  if (value === false) return 'Not included';
  if (value === null || value === undefined || value === '') return 'Unlimited';
  return String(value);
};

export default function SettingsPageFull() {
  const { user, toggleTheme, theme, requestLogout } = useApp();

  // Subscription state
  const [plans, setPlans] = useState<any[]>([]);
  const [planLimits, setPlanLimits] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [credit, setCredit] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState('');
  const [upgrading, setUpgrading] = useState('');
  const [toast, setToast] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState('');
  const [planPopupOpen, setPlanPopupOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [selectedMonths, setSelectedMonths] = useState(1);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyOrders, setHistoryOrders] = useState<any[]>([]);
  const [historyError, setHistoryError] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadSub = useCallback(async () => {
    if (!user) return;
    setSubLoading(true); setSubError('');
    try {
      const [plansRes, limitsRes, subRes, ordersRes, creditRes] = await Promise.all([
        api.subscription.getPlans().catch(() => null),
        api.planLimits.list().catch(() => null),
        api.subscription.getUserSubscription(user.userId).catch(() => null),
        api.subscription.getUserOrders(user.userId).catch(() => []),
        api.subscription.getUserCredit(user.userId).catch(() => null),
      ]);
      setPlans(plansRes?.plans || (Array.isArray(plansRes) ? plansRes : []));
      setPlanLimits(limitsRes?.plan_limits || (Array.isArray(limitsRes) ? limitsRes : []));
      setSubscription(subRes?.subscription || subRes || null);
      setOrders(Array.isArray(ordersRes) ? ordersRes : []);
      setCredit(creditRes);
      api.profile.get().then(setProfile).catch(() => null);
    } catch (e: any) { setSubError(e.message); }
    setSubLoading(false);
  }, [user]);

  useEffect(() => { loadSub(); }, [loadSub]);

  const currentPlan = subscription?.plan || user?.plan || 'Start';
  const currentIdx = PLAN_ORDER.findIndex(p => p.toLowerCase() === currentPlan.toLowerCase());
  const upgradePlans = PLAN_ORDER.filter((_, i) => i > currentIdx);
  const payablePlans = PLAN_ORDER.filter(planName => plans.some(p => p.name?.toLowerCase() === planName.toLowerCase()));
  const selectedPlanData = plans.find(p => p.name?.toLowerCase() === selectedPlan.toLowerCase());
  const selectedDuration = DURATION_OPTIONS.find(option => option.months === selectedMonths) || DURATION_OPTIONS[0];
  const monthlyAmount = selectedPlanData ? getPlanAmountPaise(selectedPlanData) : 0;
  const subtotalAmount = monthlyAmount * selectedDuration.months;
  const totalAmount = Math.round(subtotalAmount * (1 - selectedDuration.discount / 100));
  const savingsAmount = subtotalAmount - totalAmount;
  const currentAvailableCredit = credit?.availableCredit ?? 0;
  const selectedMonthlyCredit = getPlanCredit(selectedPlanData);
  const selectedDurationCredit = selectedMonthlyCredit * selectedDuration.months;

  const openPlanPopup = () => {
    const firstUpgrade = upgradePlans.find(planName => plans.some(p => p.name?.toLowerCase() === planName.toLowerCase()));
    const fallback = payablePlans.find(planName => planName.toLowerCase() !== 'start') || payablePlans[0] || currentPlan;
    setSelectedPlan(firstUpgrade || fallback);
    setSelectedMonths(1);
    setPlanPopupOpen(true);
  };

  const handleUpgrade = async (planName: string, months = 1) => {
    if (!user) return;
    setSubError('');
    const plan = plans.find(p => p.name?.toLowerCase() === planName.toLowerCase());
    if (!plan) { setSubError(`Plan "${planName}" not found. Refresh and try again.`); return; }
    const duration = DURATION_OPTIONS.find(option => option.months === months) || DURATION_OPTIONS[0];
    const baseAmount = getPlanAmountPaise(plan);
    const amountPaise = Math.round(baseAmount * duration.months * (1 - duration.discount / 100));
    setUpgrading(planName);
    try {
      await ensureRazorpayCheckoutAvailable();
      const order = await createSubscriptionOrder(planName, plan, user, profile, {
        amountPaise,
        durationMonths: duration.months,
        discountPercent: duration.discount,
      });
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
          setPlanPopupOpen(false);
          await loadSub();
        },
        onDismiss: () => {
          showToast('Payment window closed. Your plan will update only after successful payment.');
        },
      });
      if (checkout.opened) {
        showToast(`${planName} ${duration.months}-month payment initiated. Complete payment to activate.`);
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

        <button className={styles.addBtn} style={{ justifyContent: 'center', width: '100%' }} onClick={openPlanPopup}>
          View Plans &amp; Pay
        </button>

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

      {planPopupOpen && (
        <div className={sStyles.planModalOverlay}>
          <div className={sStyles.planModalPanel}>
            <div className={sStyles.planModalHeader}>
              <div>
                <div className={sStyles.currentLabel}>Subscription Plans</div>
                <div className={sStyles.planModalTitle}>Choose a plan and duration</div>
              </div>
              <div className={sStyles.planModalHeaderActions}>
                <div className={sStyles.creditSummary}>
                  <Zap size={15} />
                  <div>
                    <span>{selectedDurationCredit.toLocaleString('en-IN')}</span>
                    <small>
                      {selectedMonthlyCredit.toLocaleString('en-IN')} credits x {selectedDuration.months} mo
                      {currentAvailableCredit > 0 ? `, ${currentAvailableCredit.toLocaleString('en-IN')} available now` : ''}
                    </small>
                  </div>
                </div>
                <button className={styles.refreshBtn} onClick={() => setPlanPopupOpen(false)} title="Close">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className={sStyles.planModalBody}>
              <div className={sStyles.planGrid}>
                {payablePlans.map(planName => {
                  const planData = plans.find(p => p.name?.toLowerCase() === planName.toLowerCase());
                  const color = PLAN_COLORS[planName] || 'var(--accent)';
                  const features: string[] = Array.isArray(planData?.features) ? planData.features : [];
                  const limits = planLimits.filter(limit => getLimitPlanName(limit) === planName.toLowerCase());
                  const isCurrent = planName.toLowerCase() === currentPlan.toLowerCase();
                  const planIdx = PLAN_ORDER.findIndex(p => p.toLowerCase() === planName.toLowerCase());
                  const isUnavailable = planIdx <= currentIdx;
                  const isSelected = planName === selectedPlan;
                  const amount = planData ? getPlanAmountPaise(planData) : 0;
                  return (
                    <button
                      key={planName}
                      className={`${sStyles.planCard} ${isSelected ? sStyles.planCardSelected : ''} ${isUnavailable ? sStyles.planCardUnavailable : ''}`}
                      style={{ borderColor: isSelected || isCurrent ? color : undefined }}
                      disabled={isUnavailable}
                      onClick={() => setSelectedPlan(planName)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                        <div className={sStyles.planName} style={{ color }}>{planName}</div>
                        {isCurrent && <span className={sStyles.currentBadge}>Current</span>}
                      </div>
                      <div className={sStyles.planPrice}>
                        {amount > 0 ? `₹${(amount / 100).toFixed(0)}` : 'Free'}
                        {amount > 0 && <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}>/mo</span>}
                      </div>
                      <div className={sStyles.planCreditLine}>
                        {getPlanCredit(planData).toLocaleString('en-IN')} credits/month
                      </div>
                      {limits.length > 0 && (
                        <div className={sStyles.planLimits}>
                          {limits.slice(0, 4).map((limit, i) => (
                            <div key={limit.id || `${planName}-limit-${i}`}>
                              <span>{getLimitLabel(limit)}</span>
                              <strong>{getLimitValue(limit)}</strong>
                            </div>
                          ))}
                        </div>
                      )}
                      {features.length > 0 && (
                        <ul className={sStyles.planFeatures}>
                          {features.slice(0, 4).map((feature, i) => (
                            <li key={i}><Check size={12} style={{ color, flexShrink: 0 }} />{feature}</li>
                          ))}
                        </ul>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className={sStyles.durationPanel}>
                <div className={sStyles.durationTitle}>Billing duration</div>
                <div className={sStyles.durationGrid}>
                  {DURATION_OPTIONS.map(option => (
                    <button
                      key={option.months}
                      className={`${sStyles.durationOption} ${selectedMonths === option.months ? sStyles.durationOptionSelected : ''}`}
                      onClick={() => setSelectedMonths(option.months)}
                    >
                      <span>{option.months} month{option.months > 1 ? 's' : ''}</span>
                      <strong>{option.discount ? `${option.discount}% off` : 'No discount'}</strong>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={sStyles.planModalFooter}>
              <div>
                <div className={sStyles.checkoutTotal}>₹{(totalAmount / 100).toLocaleString('en-IN')}</div>
                <div className={sStyles.checkoutMeta}>
                  {selectedPlan || 'Plan'} for {selectedMonths} month{selectedMonths > 1 ? 's' : ''}
                  {savingsAmount > 0 ? `, saving ₹${(savingsAmount / 100).toLocaleString('en-IN')}` : ''}
                </div>
              </div>
              <button
                className={styles.addBtn}
                style={{ justifyContent: 'center', minWidth: 170, opacity: upgrading === selectedPlan || !totalAmount ? 0.65 : 1 }}
                disabled={upgrading === selectedPlan || !totalAmount}
                onClick={() => handleUpgrade(selectedPlan, selectedMonths)}
              >
                {upgrading === selectedPlan ? 'Processing...' : 'Payment'}
              </button>
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
