import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useApp } from '../App';
import { DashTab } from '../pages/Dashboard';
import { Check, CreditCard, RefreshCw, ExternalLink } from 'lucide-react';
import { createSubscriptionOrder, ensureRazorpayCheckoutAvailable, openRazorpayCheckout } from './subscriptionCheckout';
import styles from './LogPage.module.css';
import sStyles from './SubscriptionPage.module.css';

const PLAN_ORDER = ['Start', 'Pro', 'Elite'];
const PLAN_COLORS: Record<string, string> = { Start: '#3dbf96', Pro: '#5bc8e0', Elite: '#9f7aea' };

export default function SubscriptionPage({ setTab }: { setTab: (t: DashTab) => void }) {
  const { user } = useApp();
  const [plans, setPlans] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    if (!user) return;
    setLoading(true); setError('');
    try {
      const [plansRes, subRes, ordersRes] = await Promise.all([
        api.subscription.getPlans().catch(() => null),
        api.subscription.getUserSubscription(user.userId).catch(() => null),
        api.subscription.getUserOrders(user.userId).catch(() => []),
      ]);
      const planList = plansRes?.plans || (Array.isArray(plansRes) ? plansRes : []);
      setPlans(planList);
      setSubscription(subRes?.subscription || subRes || null);
      setOrders(Array.isArray(ordersRes) ? ordersRes : []);
      api.profile.get().then(setProfile).catch(() => null);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const currentPlan = subscription?.plan || user?.plan || 'Start';
  const currentIdx = PLAN_ORDER.findIndex(p => p.toLowerCase() === currentPlan.toLowerCase());
  const upgradePlans = PLAN_ORDER.filter((_, i) => i > currentIdx);

  const handleUpgrade = async (planName: string) => {
    if (!user) return;
    const plan = plans.find(p => p.name?.toLowerCase() === planName.toLowerCase());
    if (!plan) { setError('Plan not found'); return; }
    setError('');
    try {
      await ensureRazorpayCheckoutAvailable();
      const order = await createSubscriptionOrder(planName, plan, user, profile);
      const checkout = await openRazorpayCheckout(order, user, planName, {
        onSuccess: async (verification) => {
          if (verification?.success === false) {
            setError('Payment verification failed. Please contact support with your payment id.');
            return;
          }
          setSuccess(
            verification?.email_error
              ? `${planName} payment successful. Your subscription is active, but invoice email failed: ${verification.email_error}`
              : `${planName} payment successful. Your subscription is active.`
          );
          await load();
        },
        onDismiss: () => setError('Payment window closed. Your plan will update only after successful payment.'),
      });
      if (!checkout.opened) setError(`Razorpay checkout did not open for ${planName}.`);
    } catch (e: any) { setError(e.message); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div><h2 className={styles.pageTitle}>Subscription</h2><p className={styles.pageDesc}>Manage your plan and billing</p></div>
        <button className={styles.refreshBtn} onClick={load}><RefreshCw size={14} className={loading ? styles.spinning : ''} /></button>
      </div>
      {error && <div className={styles.errorBanner}>{error}</div>}
      {success && (
        <div style={{ padding: '11px 14px', background: 'rgba(61,191,150,.12)', border: '1px solid rgba(61,191,150,.3)', borderRadius: 12, color: 'var(--accent)', fontSize: 13, fontWeight: 700 }}>
          {success}
        </div>
      )}

      {/* Current plan */}
      <div className={sStyles.currentCard}>
        <div className={sStyles.currentLabel}>Current Plan</div>
        <div className={sStyles.currentName} style={{ color: PLAN_COLORS[currentPlan] || 'var(--accent)' }}>{currentPlan}</div>
        {subscription?.end_date && <div className={sStyles.currentSub}>Active until {new Date(subscription.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>}
        {subscription?.active === false && <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 4 }}>Subscription inactive</div>}
      </div>

      {/* Upgrade options */}
      {upgradePlans.length > 0 && (
        <div className={styles.formCard}>
          <h3 className={styles.formTitle}>Upgrade Your Plan</h3>
          <div className={sStyles.planGrid}>
            {upgradePlans.map(planName => {
              const planData = plans.find(p => p.name?.toLowerCase() === planName.toLowerCase());
              const price = planData?.priceLabel || planData?.price || '—';
              const features: string[] = planData?.features || [];
              return (
                <div key={planName} className={sStyles.planCard} style={{ borderColor: PLAN_COLORS[planName] + '60' }}>
                  <div className={sStyles.planName} style={{ color: PLAN_COLORS[planName] }}>{planName}</div>
                  <div className={sStyles.planPrice}>{price}<span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}>/mo</span></div>
                  {features.length > 0 && (
                    <ul className={sStyles.planFeatures}>
                      {features.slice(0, 5).map((f: string, i: number) => (
                        <li key={i}><Check size={12} style={{ color: PLAN_COLORS[planName], flexShrink: 0 }} />{f}</li>
                      ))}
                    </ul>
                  )}
                  <button className={styles.addBtn} style={{ width: '100%', justifyContent: 'center', background: PLAN_COLORS[planName] }} onClick={() => handleUpgrade(planName)}>
                    Upgrade to {planName}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Order history */}
      {orders.length > 0 && (
        <div className={styles.formCard}>
          <h3 className={styles.formTitle}>Order History</h3>
          <div className={styles.logList}>
            {orders.map((o: any, i: number) => (
              <div key={o.id || i} className={styles.logItem}>
                <CreditCard size={18} color="var(--accent)" />
                <div style={{ flex: 1 }}>
                  <div className={styles.logName}>{o.planName || o.plan || 'Subscription'}</div>
                  <div className={styles.logMeta}>{o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : ''}</div>
                </div>
                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>₹{((o.amount || 0) / 100).toFixed(0)}</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: o.status === 'paid' ? 'rgba(61,191,150,.15)' : 'var(--metric-bg)', color: o.status === 'paid' ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 600 }}>{o.status || 'pending'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
