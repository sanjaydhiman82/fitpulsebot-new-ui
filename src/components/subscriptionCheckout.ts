import { api } from '../api';
import { AuthUser } from '../App';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, any>) => { open: () => void };
  }
}

const RAZORPAY_CHECKOUT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

export function getPlanAmountPaise(plan: any): number {
  const raw = plan?.priceNum ?? plan?.amount ?? plan?.price;
  if (typeof raw === 'number') {
    return raw > 1000 ? Math.round(raw) : Math.round(raw * 100);
  }

  const cleaned = String(raw ?? '').replace(/,/g, '').match(/\d+(\.\d+)?/);
  const rupees = cleaned ? Number(cleaned[0]) : 0;
  return Math.round(rupees * 100);
}

function getBilling(user: AuthUser, profile?: any) {
  const name = [profile?.firstName ?? user.firstName, profile?.lastName ?? user.lastName]
    .filter(Boolean)
    .join(' ')
    .trim() || user.userName || 'FitPulseBot User';
  const email = profile?.email || (user.userName?.includes('@') ? user.userName : `${user.userName || user.userId}@fitpulsebot.fit`);

  return {
    name,
    email,
    city: profile?.city || '',
    state: profile?.state || '',
    country: profile?.country || 'India',
    postal_code: profile?.postal_code || '',
    address: profile?.address || '',
  };
}

function loadRazorpayScript(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise(resolve => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_CHECKOUT_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(true), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = RAZORPAY_CHECKOUT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function ensureRazorpayCheckoutAvailable() {
  const key = process.env.REACT_APP_RAZORPAY_KEY_ID;
  if (!key) {
    throw new Error('Razorpay key is not configured. Set REACT_APP_RAZORPAY_KEY_ID before creating subscription orders.');
  }

  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    throw new Error('Unable to load Razorpay checkout. Check network access and ad/script blockers.');
  }
}

interface SubscriptionOrderOptions {
  amountPaise?: number;
  durationMonths?: number;
  discountPercent?: number;
}

export async function createSubscriptionOrder(planName: string, plan: any, user: AuthUser, profile?: any, options: SubscriptionOrderOptions = {}) {
  const amount = options.amountPaise ?? getPlanAmountPaise(plan);
  if (!amount || amount <= 0) {
    throw new Error(`Unable to determine price for ${planName}.`);
  }

  return api.subscription.createOrder({
    userId: user.userId,
    amount,
    currency: 'INR',
    receipt: `FPB-${Date.now()}`,
    partial_payment: false,
    notes: {
      planName,
      durationMonths: options.durationMonths ?? 1,
      discountPercent: options.discountPercent ?? 0,
    },
    billing: getBilling(user, profile),
    items: [{ code: planName, qty: options.durationMonths ?? 1 }],
  });
}

interface CheckoutCallbacks {
  onSuccess?: (verification: any) => void | Promise<void>;
  onDismiss?: () => void;
}

export async function openRazorpayCheckout(order: any, user: AuthUser, planName: string, callbacks: CheckoutCallbacks = {}) {
  await ensureRazorpayCheckoutAvailable();
  const key = process.env.REACT_APP_RAZORPAY_KEY_ID as string;
  const orderId = order.id || order.order_id || order.orderId;
  if (!orderId) {
    throw new Error('Razorpay order id was not returned by the backend.');
  }
  const Razorpay = window.Razorpay;
  if (!Razorpay) {
    throw new Error('Unable to initialize Razorpay checkout.');
  }

  const checkout = new Razorpay({
    key,
    amount: order.amount,
    currency: order.currency || 'INR',
    name: 'FitPulseBot',
    description: `${planName} subscription`,
    order_id: orderId,
    prefill: {
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.userName,
      email: user.userName?.includes('@') ? user.userName : undefined,
    },
    theme: { color: '#3dbf96' },
    handler: async (response: any) => {
      const verification = await api.subscription.verifyPayment({
        userId: user.userId,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        amount_paid: order.amount,
      });
      await callbacks.onSuccess?.(verification);
    },
    modal: {
      ondismiss: callbacks.onDismiss,
    },
  });
  checkout.open();
  return { opened: true };
}
