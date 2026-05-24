# FitPulseBot — Product Document
> Last updated: May 2026 · Version reflects current codebase state

---

## Overview

FitPulseBot is a full-stack AI-powered health and fitness tracking SaaS. It helps individuals achieve their wellness goals through intelligent monitoring, personalized insights, and proactive reminders. Built with React + TypeScript (frontend) and FastAPI + PostgreSQL on AWS (backend), it combines GPT-4o vision AI with an intuitive dashboard experience.

**Live URL:** https://fitpulsebot.fit  
**Contact:** info@fitpulsebot.fit

---

## Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript (Create React App) |
| Routing | Single-page app via `AppContext` page state (`landing`, `auth`, `onboarding`, `dashboard`, `admin`) |
| Charts | Recharts (AreaChart, BarChart, ReferenceLine) |
| Icons | Lucide React |
| Auth | Google OAuth (`@react-oauth/google`) + email/password |
| State | React Context (`AppContext`) + localStorage persistence |
| API | Centralized `apiFetch` with auto Bearer token injection, 401 refresh flow, 90s timeout |
| Payments | Razorpay (Indian market) via `subscriptionCheckout.ts` |
| Theme | CSS variables, dark/light toggle, persisted to localStorage |

### Backend (AWS ap-south-1)
| Layer | Technology |
|---|---|
| API | FastAPI (Python 3.13) + Uvicorn/Gunicorn |
| Database | PostgreSQL on AWS RDS (psycopg2 raw SQL, no ORM) |
| Compute | EC2 t4g.micro (`fitpulsebot`) |
| Payments | Razorpay SDK + HMAC-SHA256 verify; Lambda (`razorpay-api`) |
| File Storage | AWS S3 (boto3) — profile images |
| AI | OpenAI GPT-4o vision (5 endpoints, externalized `prompt/*.txt` files) |
| Auth | JWT (python-jose, HS256) — 7-day expiry, refresh via `SessionGuard` |
| Email | SMTP Gmail SSL port 465, branded HTML templates |
| Push | Firebase Admin SDK (FCM tokens stored in `users.push_id`) |
| MCP Server | `mcp>=1.0.0` — HTTP (`POST /api/v1/mcp`) + stdio mode |

**Backend repo:** `/Users/sanjay82/Documents/All-development/fitpulsebot-website/FitPulseBot-backend`  
**Backend product doc:** `backend-product.md` in that repo

---

## Application Pages & Routing

```
/ (landing)  →  /auth  →  /onboarding  →  /dashboard  (user)
                                        →  /admin       (admin role)
```

### Pages
- **LandingPage** — Marketing, FAQ, pricing, CTA buttons
- **AuthPage** — Login / Register / Google OAuth / Forgot+Reset password
- **OnboardingFlow** — Multi-step: name/age/weight/height/gender → goal selection → activity level → AI plan generation
- **Dashboard** — Main app shell with sidebar nav + topbar
- **AdminDashboard** — Full admin control panel
- **PrivacyPolicy / TermsOfService** — Static legal pages

---

## Dashboard — Navigation Tabs

| Tab | Component | Description |
|---|---|---|
| home | `DashboardHome` | Overview: greeting, streak, AI insight, metric cards, goal completion, activity chart, weight chart |
| activity | `ActivityLog` | Log physical activities; duration, distance, cal burned, active minutes |
| nutrition | `NutritionLog` | Log meals; macros (cal, protein, carbs, fats, fiber, sugar, sodium); AI vision mode |
| hydration | `HydrationLog` | Water intake by drink type and container volume |
| sleep | `SleepLog` | Sleep duration and quality logs |
| weight | `WeightLog` | Weight entries with trend/moving average chart |
| reports | `ReportsPage` | Health metrics + period-over-period comparison with date range filter |
| profile | `UserProfilePage` | Edit name/age/weight/height/gender, avatar upload, AI goal wizard |
| notifications | `NotificationsPage` | Manage reminder types by plan |
| support | `SupportPage` | Create/view support tickets with message thread |
| messages | `MessagesPage` | Admin broadcast messages + unread badge count in topbar |
| settings | `SettingsPageFull` | Subscription plan, preferences, account settings merged view |

---

## DashboardHome — Detail

**Time ranges:** Day / Week / Month / 3 Months / Year (driven by `dropdowns.json`)

**Data loaded in parallel on mount + range change:**
1. `api.dashboard.counters()` → metric counter cards + streak + AI insight
2. `api.dashboard.activityChart(days)` → BarChart (Calories Burned)
3. `api.dashboard.weightChart(days)` → AreaChart (Weight + Moving Avg + Target reference line)
4. `api.dashboard.goalsRange(from, to)` → Goal completion grid (Water, Cal Burned, Meals, Sleep, Cal Consumed)

**Metric cards** (from API `counters` array): icon/color/tab auto-resolved by metric title keywords.

**Goal completion grid**: shows `completed / total days` with color-coded MetricCard for each goal type.

**AI Insight banner**: shown when `counters.insight` is returned from backend.

**Streak badge**: shown when `counters.streak > 0`.

---

## Today's Progress Card (Home Screen — Planned/In Design)

A consolidated card showing overall daily progress with:
- **Left:** Large circular ring (full 360°, single color) with overall `%` done in center
- **Right:** 5 labeled progress bars with current/goal values:
  1. 💧 Water — `800 / 2000 ml`
  2. 🔥 Calories in — `122 / 1800 kcal`
  3. 💪 Protein — `11 / 80 g`
  4. 🌙 Sleep — `5.7 / 8 h`
  5. ⚡ Cal burned — `100 / 500 kcal`
- Subtle divider separating nutrition metrics from sleep/activity metrics
- `...` overflow menu top-right
- Ring % = average completion across all 5 metrics

> Design reference: see chat session May 2026 for mockups and widget prototypes.

---

## API Surface (`src/api.ts`)

All calls go through `apiFetch(path, options)` which:
- Reads Bearer token fresh from localStorage on every call
- Handles 401 → triggers `SessionGuard` dialog → retries once if user stays
- AbortController with 90s timeout

### Namespaces

| Namespace | Key Endpoints |
|---|---|
| `api.auth` | login, register, googleLogin, forgotPassword, resetPassword, getUser |
| `api.profile` | get, update, uploadPic, getGoals, generateGoalsAI, updatePreferences |
| `api.activity` | list (by date), create, delete |
| `api.food` | list (by logDate), create, createAI (GPT-4o vision), delete, getAverage |
| `api.water` | list, create, delete, getAverage |
| `api.weight` | list, create, delete, getAverage |
| `api.sleep` | list, create, delete, getAverage |
| `api.dashboard` | counters, weightChart, activityChart, goals, goalsRange |
| `api.reports` | healthMetrics, healthCompare |
| `api.notifications` | getTypes (by plan), getUserNotifications, saveNotifications, deleteNotification |
| `api.subscription` | getPlans, getUserSubscription, createOrder, verifyPayment, getUserOrders, getUserCredit |
| `api.support` | createTicket, getTickets, getTicket, addMessage, closeTicket |
| `api.messages` | getUserMessages, markRead, send |
| `api.admin` | listUsers (paged + filtered), getAppCostLogs, logAppCost, listAICredits, getUserCredits, getUserCreditBalance, updateUserStatus |
| `api.plans` | list, create, update, delete, schema |
| `api.planLimits` | list, create, update, delete, schema |

---

## AI Features (GPT-4o)

| Feature | Endpoint / Location | Description |
|---|---|---|
| Food image recognition | `api.food.createAI` → `POST /food-intake-ai` | Upload meal photo → GPT-4o returns macros → auto-logged |
| AI goal wizard | `api.profile.generateGoalsAI` → `POST /user/goal/ai` | Generates personalized calorie/macro/water/sleep goals from user profile |
| AI insight | `api.dashboard.counters` → insight field | Daily contextual health tip shown on DashboardHome |
| AI nutrition tips | Per-plan feature | Tailored meal suggestions |
| AI cost tracking | `api.admin.getAppCostLogs` / `logAppCost` | Every AI call logged with tokens, cost ($ and ₹), credit deducted |

**AI Credit system:** Each user has an allocated credit balance. Every GPT-4o call deducts from it. Balance shown in topbar (`Sparkles` icon + amount). Admins can view per-user credit usage.

---

## Authentication & Session

- **Google OAuth** via `@react-oauth/google` credential flow → `POST /login/google`
- **Email/password** login + registration with terms acceptance
- **Forgot/reset password** flow with token
- **JWT** stored in localStorage (`fitpulse_token`, `fitpulse_userId`, `fitpulse_userName`, `fitpulse_role`)
- **SessionGuard component:** monitors token expiry, shows modal dialog, attempts refresh, retries last failed request — or logs user out
- **Role-based routing:** `role === 'admin'` → AdminDashboard, else Dashboard
- **Logout confirm dialog:** triggered by `requestLogout()`, requires explicit confirmation before clearing session

---

## Admin Dashboard

| Section | Functionality |
|---|---|
| System Overview | Total users, active users, paid members, new signups; weekly signup bar chart |
| User Management | Paginated user list with role/plan/status filters; activate/deactivate/ban users (`PATCH /users/{id}/status`) |
| AI Cost Analytics | App cost logs with date filter; input/output tokens, cost in $ and ₹ per request |
| Plans Tab | Schema-dynamic CRUD for subscription plans via runtime DB introspection |
| Plan Limits | Per-plan feature limits CRUD |
| Broadcast Messaging | Send messages to users (`api.messages.send`) |
| Analytics Charts | Pie: plan distribution, user status, signup sources, role breakdown |

---

## Subscription Plans

| Plan | Price | Key Features |
|---|---|---|
| **Start** | Free | Basic tracking (activity, water, meals, sleep), standard notifications, essential reports |
| **Pro** | ₹199/mo | All Start + weight tracking, AI nutrition tips, advanced reports, comparative analytics, priority notifications |
| **Elite** | ₹299/mo | All Pro + personal coach notifications, premium support, AI advanced insights, custom health strategies, early access |

**Payment:** Razorpay (India). Order → verify flow. Order history and subscription status tracked per user.

---

## Key Components

| Component | File | Purpose |
|---|---|---|
| `SessionGuard` | `components/SessionGuard.tsx` | JWT expiry detection + refresh + retry |
| `ImageUploadLogger` | `components/ImageUploadLogger.tsx` | AI vision food logging UI (Manual/AI Vision toggle) |
| `DashboardHome` | `components/DashboardHome.tsx` | Main home tab — counters, charts, goals, AI insight |
| `MetricCard` | (inside DashboardHome) | Reusable card: icon, label, value, unit, progress bar, % |
| `DateFilter` | `components/DateFilter.tsx` | Shared date range picker for logs and reports |
| `SubscriptionPage` | `components/SubscriptionPage.tsx` | Plan comparison + Razorpay checkout |
| `SettingsPageFull` | `components/SettingsPageFull.tsx` | Settings + subscription merged view |

---

## Config

- `src/config/dropdowns.json` — Time range definitions (id, label, days, aliases) used across all charts and goal queries
- `src/config/site-version.json` — Site version tracking
- `.env` — `REACT_APP_API_BASE_URL` (defaults to `http://localhost:8000`)
- API base paths: `{origin}/api/v1` (REST) and `{origin}/api/ai/v1` (AI endpoints)

---

## UI/UX Conventions

- **Theme:** Dark default, light mode toggle. CSS variables (`--bg-card`, `--text-primary`, `--accent`, `--border`, `--danger`, etc.)
- **Charts:** Recharts library — AreaChart for weight, BarChart for activity, Cell-based coloring (last bar highlighted)
- **Loading states:** `spinning` CSS class on refresh icon, empty state messages in charts
- **Responsive:** Sidebar collapses to overlay on mobile; hamburger menu button
- **Error handling:** All API calls wrapped in `.catch(() => null)` — graceful degradation with empty states
- **No form tags in React:** All interactions via `onClick`/`onChange` handlers

---

## Known Issues / Open Items

- [ ] **Today's Progress Card** — consolidated ring+bars UI designed (see chat May 2026); pending React component implementation in `DashboardHome.tsx`
- [ ] Timezone mismatch in food intake date filtering (identified in earlier session)
- [ ] 7-day avg water value missing in hydration stats card (API returns empty)

---

## Future Roadmap

- Mobile apps (iOS / Android) — React Native
- Wearable device integration (Apple Watch, Fitbit, Garmin)
- Social features — challenges, leaderboards, friend tracking
- Gamification — badges, streaks (streak already tracked), achievement rewards
- Telehealth integration — share reports with doctors/nutritionists
- Multi-language support (Hindi, regional Indian languages)
- Advanced predictive insights — ML-based health forecasting
- White-label / corporate wellness version

---

## Deployment

- **Frontend:** Built React app in `/build`, deployed to static hosting
- **Backend:** EC2 `fitpulsebot` (t4g.micro, `ap-south-1`), RDS PostgreSQL, Lambda for Razorpay
- **CI/CD:** `.github/workflows/` (GitHub Actions)
- **S3:** Asset storage (profile images, labels)
