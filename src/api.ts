import { hideGlobalApiSpinner, showGlobalApiSpinner } from './components/GlobalApiSpinner';

export const API_ORIGIN = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const BASE = `${API_ORIGIN.replace(/\/$/, '')}/api/v1`;
const AI_BASE = `${API_ORIGIN.replace(/\/$/, '')}/api/ai/v1`;

type ApiSpinnerOptions = {
  showSpinner?: boolean;
  spinnerLabel?: string;
  spinnerDelayMs?: number;
};

function startDelayedSpinner(options: ApiSpinnerOptions = {}) {
  const { showSpinner = true, spinnerLabel = 'Loading data...', spinnerDelayMs = 550 } = options;
  let shown = false;
  const timer = showSpinner
    ? setTimeout(() => {
        shown = true;
        showGlobalApiSpinner(spinnerLabel);
      }, spinnerDelayMs)
    : undefined;

  return () => {
    if (timer) clearTimeout(timer);
    if (shown) hideGlobalApiSpinner();
  };
}

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
  options: RequestInit & { timeoutMs?: number; skipAuth?: boolean; _isRetry?: boolean } & ApiSpinnerOptions = {}
): Promise<any> {
  const {
    timeoutMs = 90000,
    skipAuth = false,
    headers,
    _isRetry = false,
    showSpinner,
    spinnerLabel,
    spinnerDelayMs,
    ...rest
  } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const stopSpinner = startDelayedSpinner({ showSpinner, spinnerLabel, spinnerDelayMs });
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

      const detail = err?.detail || err?.message;
      throw new Error(typeof detail === 'string' ? detail : detail ? JSON.stringify(detail) : `HTTP ${res.status}`);
    }
    if (res.status === 204) return {};
    return res.json();
  } catch (e: any) {
    if (e?.name === 'AbortError') throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s`);
    throw e;
  } finally {
    clearTimeout(timer);
    stopSpinner();
  }
}

// ── AI JSON fetch ─────────────────────────────────────
export async function apiFetchAI(path: string, options: RequestInit & { skipAuth?: boolean } & ApiSpinnerOptions = {}): Promise<any> {
  const { skipAuth = false, headers, showSpinner, spinnerLabel, spinnerDelayMs, ...rest } = options;
  const stopSpinner = startDelayedSpinner({ showSpinner, spinnerLabel: spinnerLabel || 'Loading AI data...', spinnerDelayMs });
  const token = getToken();
  try {
    const res = await fetch(`${AI_BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(!skipAuth && token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers as any || {}),
      },
      ...rest,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const detail = err?.detail || err?.message;
      throw new Error(typeof detail === 'string' ? detail : detail ? JSON.stringify(detail) : `HTTP ${res.status}`);
    }
    if (res.status === 204) return {};
    return res.json();
  } finally {
    stopSpinner();
  }
}

// ── AI multipart fetch (image upload) ───────────────────
export async function apiAiUpload(endpoint: string, formData: FormData, options: ApiSpinnerOptions = {}): Promise<any> {
  const stopSpinner = startDelayedSpinner({ ...options, spinnerLabel: options.spinnerLabel || 'Uploading data...' });
  const token = getToken();
  try {
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
  } finally {
    stopSpinner();
  }
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

  reports: {
    catalog: (type: 'user' | 'admin' | 'resource' = 'user') => apiFetch(`/reports/catalog?type=${encodeURIComponent(type)}`),
    list: (type: 'user' | 'admin' | 'resource' = 'user') => apiFetch(`/reports/my?type=${encodeURIComponent(type)}`),
    render: (reportKey: string, type: 'user' | 'admin' | 'resource' = 'user') =>
      apiFetch(`/reports/render/${encodeURIComponent(reportKey)}?type=${encodeURIComponent(type)}`),
    generate: (data: { reportKey: string; dateFrom: string; dateTo: string; type?: 'user' | 'admin' | 'resource' }) =>
      apiFetch('/reports/my', { method: 'POST', body: JSON.stringify(data) }),
    schedules: (type: 'user' | 'admin' | 'resource' = 'user') => apiFetch(`/reports/schedules?type=${encodeURIComponent(type)}`),
    schedule: (data: { reportKey: string; type?: 'user' | 'admin' | 'resource'; dateRangeDays: number; recurrenceDays: number; runTime: string; timezone?: string; email?: boolean }) =>
      apiFetch('/reports/schedules', { method: 'POST', body: JSON.stringify(data) }),
    updateScheduleStatus: (id: string, status: 'ACTIVE' | 'PAUSED') =>
      apiFetch(`/reports/schedules/${encodeURIComponent(id)}?status=${encodeURIComponent(status)}`, { method: 'PATCH' }),
    deleteSchedule: (id: string) => apiFetch(`/reports/schedules/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    get: (id: string) => apiFetch(`/reports/my/${encodeURIComponent(id)}`),
    email: (id: string) => apiFetch(`/reports/my/${encodeURIComponent(id)}/email`, { method: 'POST' }),
    pdfUrl: (id: string) => `${BASE}/reports/my/${encodeURIComponent(id)}/pdf`,
    healthMetrics: (startDate: string, endDate: string) =>
      apiFetch(`/report/health-metrics?userId=${getUserId()}&startDate=${startDate}&endDate=${endDate}`),
    healthCompare: (p1s: string, p1e: string, p2s: string, p2e: string) =>
      apiFetch(`/report/health-compare?userId=${getUserId()}&period1Start=${p1s}&period1End=${p1e}&period2Start=${p2s}&period2End=${p2e}`),
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
  gymJoin: {
    listRequests: () => apiFetch('/client/organization-requests'),
    createRequest: (data: { organizationId: string; branchId: string }) =>
      apiFetch('/client/organization-requests', { method: 'POST', body: JSON.stringify(data) }),
  },
  partner: {
    branches: () => apiFetch('/client/partner-branches'),
    profile: (branchId: string) => apiFetch(`/client/partner-branches/${branchId}/profile`),
    add: (branchId: string, section: string, data: any) => apiFetch(`/client/partner-branches/${branchId}/${section}`, { method: 'POST', body: JSON.stringify(data) }),
    addWorkoutSession: (branchId: string, data: any) => apiFetch(`/client/partner-branches/${branchId}/workout-sessions`, { method: 'POST', body: JSON.stringify(data) }),
    workoutAllDone: (branchId: string, data: { workoutId: string; userWorkoutId?: string; notes?: string; rating?: number }) =>
      apiFetch(`/client/partner-branches/${branchId}/workouts/all-done`, { method: 'POST', body: JSON.stringify(data) }),
    delete: (branchId: string, section: string, itemId: string) => apiFetch(`/client/partner-branches/${branchId}/${section}/${itemId}`, { method: 'DELETE' }),
  },
  biomarkers: {
    get: () => apiFetch('/client/biomarkers'),
    getForTrainerMember: (memberId: string) => apiFetch(`/resource/clients/${memberId}/biomarkers`),
    upload: async (data: { reportType: string; labName?: string; reportDate?: string; file: File }) => {
      const form = new FormData();
      form.set('reportType', data.reportType || 'Blood');
      if (data.labName) form.set('labName', data.labName);
      if (data.reportDate) form.set('reportDate', data.reportDate);
      form.set('file', data.file);
      const token = getToken();
      const res = await fetch(`${BASE}/client/biomarkers/reports`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || err?.message || `HTTP ${res.status}`);
      }
      return res.json();
    },
    deleteReport: (reportId: string) => apiFetch(`/client/biomarkers/reports/${reportId}`, { method: 'DELETE' }),
  },
  aiCoach: {
    insight: () => {
      const q = new URLSearchParams({ userId: getUserId()! });
      // Use full URL — this is under /api/ai/v1, not /api/v1
      const url = `${API_ORIGIN.replace(/\/$/, '')}/api/ai/v1/dashboard/insight?${q}`;
      return apiFetch(url);
    },
    healthAgent: (data: any) =>
      apiFetchAI('/health-agent', {
        method: 'POST',
        body: JSON.stringify({ ...data, userId: data.userId || getUserId() }),
        showSpinner: false,
      }),
  },

  notifications: {
    getTypes: (plan: string) => apiFetch(`/notifications?plan=${plan}`),
    getUserNotifications: (userId: string) => apiFetch(`/client/notifications/${userId}`),
    saveNotifications: (userId: string, codes: string[]) =>
      Promise.all(codes.map(code =>
        apiFetch('/client/notifications', { method: 'POST', body: JSON.stringify({ clientId: userId, notificationCode: code }) })
      )),
    deleteNotification: (userId: string, code: string) =>
      apiFetch('/client/notifications', { method: 'DELETE', body: JSON.stringify({ clientId: userId, notificationCode: code }) }),
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
      type?: string;
      plan?: string;
      status?: string;
      organizationId?: string;
      branchId?: string;
    } = {}) => {
      const q = new URLSearchParams();
      if (params.page)     q.set('page',     String(params.page));
      if (params.pageSize) q.set('pageSize', String(params.pageSize));
      if (params.role)     q.set('role',     params.role);
      if (params.type)     q.set('type',     params.type);
      if (params.plan)     q.set('plan',     params.plan);
      if (params.status)   q.set('status',   params.status);
      if (params.organizationId) q.set('organizationId', params.organizationId);
      if (params.branchId)       q.set('branchId',       params.branchId);
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

  // ── Super Admin ───────────────────────────────────────
  superAdmin: {
    listOrgs: (params: { search?: string; page?: number; pageSize?: number; status?: string } = {}) => {
      const q = new URLSearchParams();
      if (params.search)   q.set('search',   params.search);
      if (params.page)     q.set('page',     String(params.page));
      if (params.pageSize) q.set('pageSize', String(Math.min(params.pageSize, 100)));
      if (params.status)   q.set('status',   params.status);
      return apiFetch(`/admin/organizations?${q}`);
    },
    createOrg: (data: any) => apiFetch('/admin/organizations', { method: 'POST', body: JSON.stringify(data) }),
    getOrg: (orgId: string) => apiFetch(`/admin/organizations/${orgId}`),
    updateOrg: (orgId: string, data: any) => apiFetch(`/admin/organizations/${orgId}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteOrg: (orgId: string) => apiFetch(`/admin/organizations/${orgId}`, { method: 'DELETE' }),
  },

  // ── Organization ──────────────────────────────────────
  org: {
    getDashboard: (orgId: string) => apiFetch(`/organizations/${orgId}/dashboard`),
    getBranding: (orgId: string) => apiFetch(`/organizations/${orgId}/branding`),
    putBranding: (orgId: string, data: any) => apiFetch(`/organizations/${orgId}/branding`, { method: 'PUT', body: JSON.stringify(data) }),
    listBranches: (orgId: string, params: { search?: string; page?: number; pageSize?: number; status?: string } = {}) => {
      const q = new URLSearchParams();
      if (params.search)   q.set('search',   params.search);
      if (params.page)     q.set('page',     String(params.page));
      if (params.pageSize) q.set('pageSize', String(Math.min(params.pageSize, 100)));
      if (params.status)   q.set('status',   params.status);
      return apiFetch(`/organizations/${orgId}/branches?${q}`);
    },
    createBranch: (orgId: string, data: any) => apiFetch(`/organizations/${orgId}/branches`, { method: 'POST', body: JSON.stringify(data) }),
    publicOrgs: () => apiFetch('/organizations/public', { skipAuth: true }),
    publicBranches: (orgId: string) => apiFetch(`/organizations/${orgId}/branches/public`, { skipAuth: true }),
  },

  // ── Branch ────────────────────────────────────────────
  branch: {
    get: (branchId: string) => apiFetch(`/branches/${branchId}`),
    update: (branchId: string, data: any) => apiFetch(`/branches/${branchId}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (branchId: string) => apiFetch(`/branches/${branchId}`, { method: 'DELETE' }),
    getBranding: (branchId: string) => apiFetch(`/branches/${branchId}/branding`),
    putBranding: (branchId: string, data: any) => apiFetch(`/branches/${branchId}/branding`, { method: 'PUT', body: JSON.stringify(data) }),
    listUsers: (branchId: string, params: { type?: string; search?: string; page?: number; pageSize?: number; status?: string } = {}) => {
      const q = new URLSearchParams();
      if (params.type)     q.set('type',     params.type);
      if (params.search)   q.set('search',   params.search);
      if (params.page)     q.set('page',     String(params.page));
      if (params.pageSize) q.set('pageSize', String(params.pageSize));
      if (params.status)   q.set('status',   params.status);
      return apiFetch(`/branches/${branchId}/clients?${q}`);
    },
    createUser: (branchId: string, data: any) => apiFetch(`/branches/${branchId}/clients`, { method: 'POST', body: JSON.stringify(data) }),
    updateUser: (branchId: string, userId: string, data: any) => apiFetch(`/branches/${branchId}/clients/${userId}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteUser: (branchId: string, userId: string) => apiFetch(`/branches/${branchId}/clients/${userId}`, { method: 'DELETE' }),
    listAssignments: (branchId: string, params: any = {}) => {
      const q = new URLSearchParams(params);
      return apiFetch(`/branches/${branchId}/resource-assignments?${q}`);
    },
    createAssignment: (branchId: string, data: any) => apiFetch(`/branches/${branchId}/resource-assignments`, { method: 'POST', body: JSON.stringify(data) }),
    deleteAssignment: (branchId: string, assignmentId: string) => apiFetch(`/branches/${branchId}/resource-assignments/${assignmentId}`, { method: 'DELETE' }),
    getAttendance: (branchId: string, params: any = {}) => {
      const q = new URLSearchParams(params);
      return apiFetch(`/branches/${branchId}/attendance?${q}`);
    },
    markAttendance: (branchId: string, data: any) => apiFetch(`/branches/${branchId}/attendance`, { method: 'POST', body: JSON.stringify(data) }),
    updateAttendance: (branchId: string, attendanceId: string, data: any) => apiFetch(`/branches/${branchId}/attendance/${attendanceId}`, { method: 'PATCH', body: JSON.stringify(data) }),
    getSupportTickets: (branchId: string) => apiFetch(`/branches/${branchId}/support/tickets`),
    listMemberRequests: (branchId: string, params: { status?: string; page?: number; pageSize?: number } = {}) => {
      const q = new URLSearchParams();
      if (params.status) q.set('status', params.status);
      if (params.page) q.set('page', String(params.page));
      if (params.pageSize) q.set('pageSize', String(params.pageSize));
      return apiFetch(`/branches/${branchId}/client-requests?${q}`);
    },
    acceptMemberRequest: (branchId: string, requestId: string) =>
      apiFetch(`/branches/${branchId}/client-requests/${requestId}/accept`, { method: 'POST' }),
    getDashboard: (branchId: string, params: any = {}) => {
      const q = new URLSearchParams(params);
      return apiFetch(`/branches/${branchId}/dashboard?${q}`);
    },
  },

  labels: {
    get: (params: { organizationId?: string; branchId?: string; locale?: string; namespace?: string } = {}) => {
      const q = new URLSearchParams();
      if (params.organizationId) q.set('organizationId', params.organizationId);
      if (params.branchId) q.set('branchId', params.branchId);
      if (params.locale) q.set('locale', params.locale);
      if (params.namespace) q.set('namespace', params.namespace);
      return apiFetch(`/ui-labels?${q}`);
    },
    manage: (params: { organizationId?: string; branchId?: string; locale?: string; namespace?: string } = {}) => {
      const q = new URLSearchParams();
      if (params.organizationId) q.set('organizationId', params.organizationId);
      if (params.branchId) q.set('branchId', params.branchId);
      if (params.locale) q.set('locale', params.locale);
      if (params.namespace) q.set('namespace', params.namespace);
      return apiFetch(`/ui-labels/manage?${q}`);
    },
    upsert: (data: any) => apiFetch('/ui-labels', { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/ui-labels/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    importJson: (data: any) => apiFetch('/ui-labels/import', { method: 'POST', body: JSON.stringify(data) }),
    importMockIndustry: (industrySlug: string, params: { organizationId: string; branchId?: string; locale?: string }) => {
      const q = new URLSearchParams();
      q.set('organizationId', params.organizationId);
      if (params.branchId) q.set('branchId', params.branchId);
      if (params.locale) q.set('locale', params.locale);
      return apiFetch(`/ui-labels/import/mock/${encodeURIComponent(industrySlug)}?${q}`, { method: 'POST' });
    },
    exportJson: (params: { organizationId?: string; branchId?: string; locale?: string; namespace?: string } = {}) => {
      const q = new URLSearchParams();
      if (params.organizationId) q.set('organizationId', params.organizationId);
      if (params.branchId) q.set('branchId', params.branchId);
      if (params.locale) q.set('locale', params.locale);
      if (params.namespace) q.set('namespace', params.namespace);
      return apiFetch(`/ui-labels/export?${q}`);
    },
    listSavedExports: () => apiFetch('/ui-labels/exports'),
    saveExport: (data: { name: string; description?: string; payload: any }) =>
      apiFetch('/ui-labels/exports', { method: 'POST', body: JSON.stringify(data) }),
    getSavedExport: (name: string) => apiFetch(`/ui-labels/exports/${encodeURIComponent(name)}`),
    deleteSavedExport: (name: string) => apiFetch(`/ui-labels/exports/${encodeURIComponent(name)}`, { method: 'DELETE' }),
  },

  reminders: {
    catalog: (recipientType?: 'client' | 'resource' | 'branch' | 'system') =>
      apiFetch(`/admin/reminders/catalog${recipientType ? `?recipientType=${encodeURIComponent(recipientType)}` : ''}`),
    orgList: (organizationId: string) => apiFetch(`/admin/organizations/${encodeURIComponent(organizationId)}/reminders`),
    assignToOrg: (organizationId: string, data: { reminderCatalogId: string; isActive?: boolean }) =>
      apiFetch(`/admin/organizations/${encodeURIComponent(organizationId)}/reminders`, { method: 'PUT', body: JSON.stringify(data) }),
    removeFromOrg: (organizationId: string, orgReminderId: string) =>
      apiFetch(`/admin/organizations/${encodeURIComponent(organizationId)}/reminders/${encodeURIComponent(orgReminderId)}`, { method: 'DELETE' }),
    mine: (organizationId?: string) =>
      apiFetch(`/reminders/my${organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : ''}`),
    saveMine: (orgReminderId: string, data: { isOptedIn: boolean; channels?: Record<string, any> }) =>
      apiFetch(`/reminders/my/${encodeURIComponent(orgReminderId)}`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  appFunctions: {
    list: () => apiFetch('/admin/app-functions'),
    orgList: (organizationId: string) => apiFetch(`/admin/organizations/${encodeURIComponent(organizationId)}/app-functions`),
    visibleForOrg: (organizationId: string) => apiFetch(`/organizations/${encodeURIComponent(organizationId)}/app-functions/visible`),
    setForOrg: (organizationId: string, data: { appFunctionId: number; visibleOnUi: boolean }) =>
      apiFetch(`/admin/organizations/${encodeURIComponent(organizationId)}/app-functions`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  // ── Resource ──────────────────────────────────────────
  resource: {
    getDashboard: () => apiFetch('/resource/dashboard'),
    listMembers: () => apiFetch('/resource/clients'),
    getMemberProgress: (memberId: string) => apiFetch(`/resource/clients/${memberId}/progress`),
    createWorkout: (memberId: string, data: any) => apiFetch(`/resource/clients/${memberId}/workouts`, { method: 'POST', body: JSON.stringify(data) }),
    listWorkouts: (memberId: string) => apiFetch(`/resource/clients/${memberId}/workouts`),
    getWorkout: (workoutId: string) => apiFetch(`/workouts/${workoutId}`),
    updateWorkout: (workoutId: string, data: any) => apiFetch(`/workouts/${workoutId}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteWorkout: (workoutId: string) => apiFetch(`/workouts/${workoutId}`, { method: 'DELETE' }),
    scheduleWorkout: (workoutId: string, data: any) => apiFetch(`/workouts/${workoutId}/schedule`, { method: 'POST', body: JSON.stringify(data) }),
    createDietPlan: (memberId: string, data: any) => apiFetch(`/resource/clients/${memberId}/diet-plans`, { method: 'POST', body: JSON.stringify(data) }),
    listDietPlans: (memberId: string, params: any = {}) => {
      const q = new URLSearchParams(params);
      return apiFetch(`/resource/clients/${memberId}/diet-plans?${q}`);
    },
    getDietPlan: (dietPlanId: string) => apiFetch(`/diet-plans/${dietPlanId}`),
    updateDietPlan: (dietPlanId: string, data: any) => apiFetch(`/diet-plans/${dietPlanId}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteDietPlan: (dietPlanId: string) => apiFetch(`/diet-plans/${dietPlanId}`, { method: 'DELETE' }),
    getMeasurements: (memberId: string, params: any = {}) => {
      const q = new URLSearchParams(params);
      return apiFetch(`/clients/${memberId}/measurements?${q}`);
    },
    addMeasurement: (memberId: string, data: any) => apiFetch(`/clients/${memberId}/measurements`, { method: 'POST', body: JSON.stringify(data) }),
    getNutritionSummary: (memberId: string, days = 7) => apiFetch(`/clients/${memberId}/nutrition-summary?days=${days}`),
    // ── New progress screen APIs ──
    getProgressOverview: (memberId: string, params: any = {}) => {
      const q = new URLSearchParams(params);
      return apiFetch(`/resource/clients/${memberId}/progress/overview?${q}`);
    },
    getProgressWorkouts: (memberId: string, params: any = {}) => {
      const q = new URLSearchParams(params);
      return apiFetch(`/resource/clients/${memberId}/progress/workouts?${q}`);
    },
    getProgressDiet: (memberId: string, params: any = {}) => {
      const q = new URLSearchParams(params);
      return apiFetch(`/resource/clients/${memberId}/progress/diet?${q}`);
    },
    getProgressMeasurements: (memberId: string, params: any = {}) => {
      const q = new URLSearchParams(params);
      return apiFetch(`/resource/clients/${memberId}/progress/measurements?${q}`);
    },
    getProgressBodyComposition: (memberId: string, params: any = {}) => {
      const q = new URLSearchParams(params);
      return apiFetch(`/resource/clients/${memberId}/progress/body-composition?${q}`);
    },
    getProgressHealth: (memberId: string, params: any = {}) => {
      const q = new URLSearchParams(params);
      return apiFetch(`/resource/clients/${memberId}/progress/health?${q}`);
    },
    getProgressAttendance: (memberId: string, params: any = {}) => {
      const q = new URLSearchParams(params);
      return apiFetch(`/resource/clients/${memberId}/progress/attendance?${q}`);
    },
    getProgressPhotos: (memberId: string, params: any = {}) => {
      const q = new URLSearchParams(params);
      return apiFetch(`/resource/clients/${memberId}/progress/photos?${q}`);
    },
    getProgressNotes: (memberId: string, params: any = {}) => {
      const q = new URLSearchParams(params);
      return apiFetch(`/resource/clients/${memberId}/progress/notes?${q}`);
    },
    getMemberBiomarkers: (memberId: string) => apiFetch(`/resource/clients/${memberId}/biomarkers`),
    createNote: (memberId: string, data: any) => apiFetch(`/resource/clients/${memberId}/notes`, { method: 'POST', body: JSON.stringify(data) }),
    updateNote: (memberId: string, noteId: string, data: any) => apiFetch(`/resource/clients/${memberId}/notes/${noteId}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteNote: (memberId: string, noteId: string) => apiFetch(`/resource/clients/${memberId}/notes/${noteId}`, { method: 'DELETE' }),
    addBodyComposition: (memberId: string, data: any) => apiFetch(`/resource/clients/${memberId}/body-composition`, { method: 'POST', body: JSON.stringify(data) }),
    addProgressPhoto: (memberId: string, data: any) => apiFetch(`/resource/clients/${memberId}/progress/photos`, { method: 'POST', body: JSON.stringify(data) }),
    addHealthLog: (memberId: string, data: any) => apiFetch(`/resource/clients/${memberId}/health-logs`, { method: 'POST', body: JSON.stringify(data) }),
    getHeader: (memberId: string) => apiFetch(`/resource/clients/${memberId}/header`),
  },

  // ── AI ────────────────────────────────────────────────
  ai: {
    generateWorkout: (data: any) => apiFetchAI('/workouts/generate', { method: 'POST', body: JSON.stringify(data) }),
    getWorkoutTemplates: (params: { goal?: string; level?: string; daysPerWeek?: number } = {}) => {
      const q = new URLSearchParams();
      if (params.goal) q.set('goal', params.goal);
      if (params.level) q.set('level', params.level);
      if (params.daysPerWeek) q.set('daysPerWeek', String(params.daysPerWeek));
      return apiFetchAI(`/workouts/templates?${q}`);
    },
    optimizeWorkout: (workoutId: string, data: any) => apiFetchAI(`/workouts/${workoutId}/optimize`, { method: 'POST', body: JSON.stringify(data) }),
    generateDietPlan: (data: any) => apiFetchAI('/diet-plans/generate', { method: 'POST', body: JSON.stringify(data) }),
    calculateMacros: (data: any) => apiFetchAI('/diet-plans/macro-calculator', { method: 'POST', body: JSON.stringify(data) }),
    getMealAlternatives: (data: any) => apiFetchAI('/diet-plans/meal-alternatives', { method: 'POST', body: JSON.stringify(data) }),
    getPlateauDashboard: (memberId: string, params: { organizationId?: string; branchId?: string; days?: number } = {}) => {
      const q = new URLSearchParams();
      if (params.organizationId) q.set('organizationId', params.organizationId);
      if (params.branchId) q.set('branchId', params.branchId);
      if (params.days) q.set('days', String(params.days));
      return apiFetchAI(`/clients/${memberId}/plateau-dashboard?${q}`);
    },
    optimizePlateau: (memberId: string, data: any) => apiFetchAI(`/clients/${memberId}/plateau-optimize`, { method: 'POST', body: JSON.stringify(data) }),
  },
};
