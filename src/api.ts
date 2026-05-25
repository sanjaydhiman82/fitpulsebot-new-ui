const API_ORIGIN = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
const BASE = `${API_ORIGIN.replace(/\/$/, '')}/api/v1`;
const AI_BASE = `${API_ORIGIN.replace(/\/$/, '')}/api/ai/v1`;

// ── Token helpers ────────────────────────────────────────
export function getToken(): string | null {
  return localStorage.getItem('fitpulse_token');
}
export function getUserId(): string | null {
  return localStorage.getItem('fitpulse_userId');
}

// ── Core fetch — auto-injects current Bearer token ───────
// Internal flag so we only show the session dialog once at a time
let _sessionDialogPromise: Promise<boolean> | null = null;

export async function apiFetch(
  path: string,
  options: RequestInit & { timeoutMs?: number; skipAuth?: boolean; _isRetry?: boolean } = {}
): Promise<any> {
  const { timeoutMs = 90000, skipAuth = false, headers, _isRetry = false, ...rest } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // Always read token fresh from localStorage so it reflects the current logged-in user
    const token = getToken();
    const mergedHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      ...(!skipAuth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers as any || {}),
    };
    const url = path.startsWith('http') ? path : `${BASE}${path}`;
    const res = await fetch(url, { ...rest, headers: mergedHeaders, signal: controller.signal });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));

      // ── 401: token expired — show session dialog, retry once if user stays ──
      if (res.status === 401 && !skipAuth && !_isRetry) {
        clearTimeout(timer);
        // Lazily import to avoid circular deps
        const { triggerSessionExpired } = await import('./components/SessionGuard');
        if (!_sessionDialogPromise) {
          _sessionDialogPromise = triggerSessionExpired().finally(() => {
            _sessionDialogPromise = null;
          });
        }
        const stayed = await _sessionDialogPromise;
        if (stayed) {
          // Token was refreshed by SessionGuard — retry this request once
          return apiFetch(path, { ...options, _isRetry: true });
        }
        throw new Error('Session expired. Please log in again.');
      }

      throw new Error(err?.detail || err?.message || `HTTP ${res.status}`);
    }
    if (res.status === 204) return {};
    return res.json();
  } catch (e: any) {
    if (e?.name === 'AbortError') throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s`);
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

// ── AI multipart fetch (image upload) ───────────────────
export async function apiAiUpload(endpoint: string, formData: FormData): Promise<any> {
  const token = getToken();
  const res = await fetch(`${AI_BASE}/${endpoint}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail || err?.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── API surface ──────────────────────────────────────────
export const api = {

  auth: {
    login: (userName: string, password: string) =>
      apiFetch('/login', { method: 'POST', body: JSON.stringify({ userName, password }), skipAuth: true }),
    register: (userName: string, password: string, termsAccepted: boolean) =>
      apiFetch('/user', { method: 'POST', body: JSON.stringify({ userName, password, termsAccepted, plan: 'Start', signupSrc: 'site' }), skipAuth: true }),
    googleLogin: (credential: string) =>
      apiFetch('/login/google', { method: 'POST', body: JSON.stringify({ credential }), skipAuth: true }),
    forgotPassword: (email: string) =>
      apiFetch('/user/forgot/password', { method: 'POST', body: JSON.stringify({ email }), skipAuth: true }),
    resetPassword: (email: string, token: string, password: string) =>
      apiFetch('/user/reset/password', { method: 'POST', body: JSON.stringify({ email, token, password }), skipAuth: true }),
    getUser: () => apiFetch('/user'),
  },

  profile: {
    get: () => apiFetch('/profile'),
    update: (data: any) => apiFetch('/profile', { method: 'POST', body: JSON.stringify(data) }),
    uploadPic: (data: { userId: string; fileName: string; contentType: string; fileData: string }) =>
      apiFetch('/profile/pic', { method: 'POST', body: JSON.stringify(data) }),
    getGoals: (userId: string) => apiFetch(`/user/goal/${userId}`),
    generateGoalsAI: (data: any) => apiFetch('/user/goal/ai', { method: 'POST', body: JSON.stringify(data) }),
    updatePreferences: (data: any) => apiFetch('/user/preferences', { method: 'POST', body: JSON.stringify(data) }),
  },

  activity: {
    list: (date?: string) => {
      const q = new URLSearchParams({ userId: getUserId()! });
      if (date) q.set('date', date);
      return apiFetch(`/activity-log?${q}`);
    },
    create: (data: any) =>
      apiFetch('/activity-log', { method: 'POST', body: JSON.stringify({ ...data, userId: getUserId() }) }),
    delete: (id: string) => apiFetch(`/activity-log/${id}`, { method: 'DELETE' }),
  },

  food: {
    list: (logDate?: string) => {
      const q = new URLSearchParams({ userId: getUserId()! });
      if (logDate) q.set('logDate', logDate);
      return apiFetch(`/food-intake?${q}`);
    },
    create: (data: any) =>
      apiFetch('/food-intake', { method: 'POST', body: JSON.stringify({ ...data, userId: getUserId() }) }),
    createAI: (data: any) =>
      apiFetch('/food-intake-ai', { method: 'POST', body: JSON.stringify({ ...data, userId: getUserId() }) }),
    delete: (id: string) => apiFetch(`/food-intake/${id}`, { method: 'DELETE' }),
    getAverage: (days = 7) => apiFetch(`/food-intake/average?userId=${getUserId()}&days=${days}`),
  },

  water: {
    list: (date?: string) => {
      const q = new URLSearchParams({ userId: getUserId()! });
      if (date) q.set('date', date);
      return apiFetch(`/water-intake?${q}`);
    },
    create: (data: any) =>
      apiFetch('/water-intake', { method: 'POST', body: JSON.stringify({ ...data, userId: getUserId() }) }),
    delete: (id: string) => apiFetch(`/water-intake/${id}`, { method: 'DELETE' }),
    getAverage: (days = 7) => apiFetch(`/water-intake/average?userId=${getUserId()}&days=${days}`),
  },

  weight: {
    list: (date?: string) => {
      const q = new URLSearchParams({ userId: getUserId()! });
      if (date) q.set('date', date);
      return apiFetch(`/weight-log?${q}`);
    },
    create: (data: any) =>
      apiFetch('/weight-log', { method: 'POST', body: JSON.stringify({ ...data, userId: getUserId() }) }),
    delete: (id: string) => apiFetch(`/weight-log/${id}`, { method: 'DELETE' }),
    getAverage: (days = 30) => apiFetch(`/weight-log/average?userId=${getUserId()}&days=${days}`),
  },

  sleep: {
    list: (date?: string) => {
      const q = new URLSearchParams({ userId: getUserId()! });
      if (date) q.set('date', date);
      return apiFetch(`/user/sleep?${q}`);
    },
    create: (data: any) =>
      apiFetch('/user/sleep', { method: 'POST', body: JSON.stringify({ ...data, userId: getUserId() }) }),
    delete: (id: string) => apiFetch(`/user/sleep/${id}`, { method: 'DELETE' }),
    getAverage: (days = 7) => apiFetch(`/user/sleep/average?userId=${getUserId()}&days=${days}`),
  },

  dashboard: {
    counters: (startDate?: string, endDate?: string) => {
      const q = new URLSearchParams();
      if (startDate) q.set('start', startDate);
      if (endDate) q.set('end', endDate);
      const qs = q.toString();
      return apiFetch(`/dashboard/counters/${getUserId()}${qs ? '?' + qs : ''}`);
    },
    weightChart: (days = 30, goalWeight = 75) =>
      apiFetch(`/dashboard/charts/weight?userId=${getUserId()}&days=${days}&goalWeight=${goalWeight}&_=${Date.now()}`),
    activityChart: (days = 30) =>
      apiFetch(`/dashboard/charts/activity?userId=${getUserId()}&days=${days}&_=${Date.now()}`),
    goals: (date?: string, userId = getUserId()) => {
      const q = new URLSearchParams();
      if (userId) q.set('userId', userId);
      if (date) q.set('date', date);
      return apiFetch(`/dashboard/goal${q.toString() ? '?' + q.toString() : ''}`);
    },
    goalsRange: (fromDate: string, toDate: string, userId = getUserId()) => {
      const q = new URLSearchParams();
      if (userId) q.set('userId', userId);
      q.set('fromDate', fromDate);
      q.set('toDate', toDate);
      return apiFetch(`/dashboard/goal?${q.toString()}`);
    },
    // ── Section APIs ──────────────────────────────────────────────
    sectionToday: (date?: string) => {
      const q = new URLSearchParams({ userId: getUserId()! });
      if (date) q.set('date', date);
      return apiFetch(`/dashboard/section/today?${q}`);
    },
    sectionNutrition: (from?: string, to?: string) => {
      const q = new URLSearchParams({ userId: getUserId()! });
      if (from) q.set('from', from); if (to) q.set('to', to);
      return apiFetch(`/dashboard/section/nutrition?${q}`);
    },
    sectionHydration: (from?: string, to?: string) => {
      const q = new URLSearchParams({ userId: getUserId()! });
      if (from) q.set('from', from); if (to) q.set('to', to);
      return apiFetch(`/dashboard/section/hydration?${q}`);
    },
    sectionActivity: (from?: string, to?: string) => {
      const q = new URLSearchParams({ userId: getUserId()! });
      if (from) q.set('from', from); if (to) q.set('to', to);
      return apiFetch(`/dashboard/section/activity?${q}`);
    },
    sectionSleep: (from?: string, to?: string) => {
      const q = new URLSearchParams({ userId: getUserId()! });
      if (from) q.set('from', from); if (to) q.set('to', to);
      return apiFetch(`/dashboard/section/sleep?${q}`);
    },
    sectionWeight: (from?: string, to?: string) => {
      const q = new URLSearchParams({ userId: getUserId()! });
      if (from) q.set('from', from); if (to) q.set('to', to);
      return apiFetch(`/dashboard/section/weight?${q}`);
    },
    sectionGoals: (from?: string, to?: string) => {
      const q = new URLSearchParams({ userId: getUserId()! });
      if (from) q.set('from', from); if (to) q.set('to', to);
      return apiFetch(`/dashboard/section/goals?${q}`);
    },
  },
  aiCoach: {
    insight: () => {
      const q = new URLSearchParams({ userId: getUserId()! });
      // Use full URL — this is under /api/ai/v1, not /api/v1
      const url = `${API_ORIGIN.replace(/\/$/, '')}/api/ai/v1/dashboard/insight?${q}`;
      return apiFetch(url);
    },
  },

  reports: {
    healthMetrics: (startDate: string, endDate: string) =>
      apiFetch(`/report/health-metrics?userId=${getUserId()}&startDate=${startDate}&endDate=${endDate}`),
    healthCompare: (p1s: string, p1e: string, p2s: string, p2e: string) =>
      apiFetch(`/report/health-compare?userId=${getUserId()}&period1Start=${p1s}&period1End=${p1e}&period2Start=${p2s}&period2End=${p2e}`),
  },

  notifications: {
    getTypes: (plan: string) => apiFetch(`/notifications?plan=${plan}`),
    getUserNotifications: (userId: string) => apiFetch(`/user/notification/${userId}`),
    saveNotifications: (userId: string, codes: string[]) =>
      Promise.all(codes.map(code =>
        apiFetch('/user/notification', { method: 'POST', body: JSON.stringify({ userId, notificationCode: code }) })
      )),
    deleteNotification: (userId: string, code: string) =>
      apiFetch('/user/notification', { method: 'DELETE', body: JSON.stringify({ userId, notificationCode: code }) }),
  },

  subscription: {
    getPlans: () => apiFetch('/plans', { skipAuth: true }),
    getUserSubscription: (userId: string) => apiFetch(`/user/subscription/${userId}`),
    createOrder: (data: any) => apiFetch('/order', { method: 'POST', body: JSON.stringify(data) }),
    verifyPayment: (data: any) => apiFetch('/order/verify', { method: 'POST', body: JSON.stringify(data) }),
    getUserOrders: (userId: string) => apiFetch(`/user/order/${userId}`),
    getOrderSummary: (userId: string) => apiFetch(`/user/order/summary/${userId}`),
    getAppCosts: () => apiFetch('/appcost', { skipAuth: true }),
    getCreditScore: (userId: string) => apiFetch(`/ai-credit-score/${userId}`),
    getUserCredit: (userId: string) => apiFetch(`/user/credit/${userId}`),
  },

  support: {
    createTicket: (data: any) =>
      apiFetch('/support/tickets', { method: 'POST', body: JSON.stringify(data) }),
    getTickets: (userId: string) => apiFetch(`/support/tickets?userId=${userId}`),
    getTicket: (id: string) => apiFetch(`/support/tickets/${id}`),
    addMessage: (ticketId: string, data: any) =>
      apiFetch(`/support/tickets/${ticketId}/messages`, { method: 'POST', body: JSON.stringify(data) }),
    closeTicket: (ticketId: string, userId: string) =>
      apiFetch(`/support/tickets/${ticketId}/close`, { method: 'POST', body: JSON.stringify({ userId }) }),
  },

  messages: {
    getUserMessages: (userId: string) => apiFetch(`/user/messages/${userId}`),
    markRead: (messageId: string) =>
      apiFetch(`/messages/${messageId}/read`, { method: 'PATCH', body: JSON.stringify({ is_read: true }) }),
    send: (data: any) => apiFetch('/messages', { method: 'POST', body: JSON.stringify(data) }),
  },

  // ── Admin ── (token auto-injected from current session)
  admin: {
    listUsers: (params: {
      page?: number;
      pageSize?: number;
      role?: string;
      plan?: string;
      status?: string;
    } = {}) => {
      const q = new URLSearchParams();
      if (params.page)     q.set('page',     String(params.page));
      if (params.pageSize) q.set('pageSize', String(params.pageSize));
      if (params.role)     q.set('role',     params.role);
      if (params.plan)     q.set('plan',     params.plan);
      if (params.status)   q.set('status',   params.status);
      return apiFetch(`/users?${q.toString()}`);
    },
    // AI cost logs — all entries, ordered newest first
    getAppCostLogs: () => apiFetch('/appcost'),
    getAppCostLog: (id: number) => apiFetch(`/appcost/${id}`),
    logAppCost: (data: {
      analysisType: string; analysisOutcome: string;
      inputToken: number; outputToken: number;
      chargesInDollar: number; chargesInRs: number;
      userId: string; credit: number;
    }) => apiFetch('/appcost', { method: 'POST', body: JSON.stringify(data) }),
    // AI credit records (per-user credit usage)
    listAICredits: () => apiFetch('/ai-credit-score'),
    getUserCredits: (userId: string) => apiFetch(`/ai-credit-score/${userId}`),
    createAICredit: (userId: string, action: string, credit: number) =>
      apiFetch('/ai-credit-score', { method: 'POST', body: JSON.stringify({ userId, action, credit }) }),
    getUserCreditBalance: (userId: string) => apiFetch(`/user/credit/${userId}`),
    getUserCreditBreakdown: (userId: string) => apiFetch(`/user/credit/${userId}/breakdown`),
    updateUserStatus: (userId: string, status: 'active' | 'inactive' | 'banned') =>
      apiFetch(`/users/${userId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  },

  plans: {
    list: () => apiFetch('/admin/plans'),
    create: (data: any) => apiFetch('/admin/plans', { method: 'POST', body: JSON.stringify(data) }),
    update: (name: string, data: any) => apiFetch(`/admin/plans/${encodeURIComponent(name)}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (name: string) => apiFetch(`/admin/plans/${encodeURIComponent(name)}`, { method: 'DELETE' }),
    schema: () => apiFetch('/admin/schema/plan'),
  },

  planLimits: {
    list: (planName?: string) => apiFetch(`/admin/plan-limits${planName ? `?plan_name=${encodeURIComponent(planName)}` : ''}`),
    create: (data: any) => apiFetch('/admin/plan-limits', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => apiFetch(`/admin/plan-limits/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch(`/admin/plan-limits/${id}`, { method: 'DELETE' }),
    schema: () => apiFetch('/admin/schema/plan_limits'),
  },
};
