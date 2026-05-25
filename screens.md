# FitPulseBot Screen Inventory

This document lists every user-facing screen, child screen, popup, drawer, and modal state currently present in the React app.

## Summary

Total app-owned screens/states: **49**

- Top-level app pages: **7**
- Auth child screens: **3**
- Onboarding child screens: **4**
- User dashboard tab screens: **12**
- User dashboard child screens/popups: **14**
- Admin dashboard tab screens: **7**
- Admin child screens/popups: **2**

External/browser-owned dialogs are noted separately because they are triggered by the app but not rendered as React screens.

## Top-Level App Pages

| # | Screen | Source | Purpose |
|---|---|---|---|
| 1 | Landing Page | `src/pages/LandingPage.tsx` | Public marketing/home page for features, pricing, testimonials, FAQ, roadmap, and calls to sign in or get started. |
| 2 | Auth Page | `src/pages/AuthPage.tsx` | Entry page that hosts sign in, create account, and forgot password modes. |
| 3 | Onboarding Flow | `src/pages/OnboardingFlow.tsx` | First-time setup flow after registration. |
| 4 | User Dashboard | `src/pages/Dashboard.tsx` | Main authenticated user shell with sidebar navigation and tab content. |
| 5 | Admin Dashboard | `src/pages/AdminDashboard.tsx` | Main authenticated admin shell with admin navigation and tab content. |
| 6 | Privacy Policy | `src/pages/PrivacyPolicy.tsx` | Static privacy policy page. |
| 7 | Terms of Service | `src/pages/TermsOfService.tsx` | Static terms of service page. |

## Auth Child Screens

| # | Screen | Source | Purpose |
|---|---|---|---|
| 8 | Sign In | `src/pages/AuthPage.tsx` | Login form for email/username and password, with optional Google sign-in. |
| 9 | Create Account | `src/pages/AuthPage.tsx` | Registration form with password confirmation and terms acceptance. |
| 10 | Forgot Password | `src/pages/AuthPage.tsx` | Password reset request screen that sends a reset link to the entered email. |

## Onboarding Child Screens

| # | Screen | Source | Purpose |
|---|---|---|---|
| 11 | Onboarding: Profile | `src/pages/OnboardingFlow.tsx` | Collects name, age, weight, height, and gender. |
| 12 | Onboarding: Goals | `src/pages/OnboardingFlow.tsx` | Lets the user select health goals such as weight loss, muscle gain, sleep, hydration, and nutrition. |
| 13 | Onboarding: Activity | `src/pages/OnboardingFlow.tsx` | Lets the user choose their current activity level. |
| 14 | Onboarding: Done | `src/pages/OnboardingFlow.tsx` | Confirmation screen summarizing selected goals, activity, and plan before entering the dashboard. |

## User Dashboard Tab Screens

| # | Screen | Source | Purpose |
|---|---|---|---|
| 15 | Dashboard Home | `src/components/DashboardHome.tsx` | Overview of current health metrics and quick dashboard summary. |
| 16 | Activity | `src/components/ActivityLog.tsx` | Tracks workouts, duration, calories, distance, history, and activity charts. |
| 17 | Nutrition | `src/components/NutritionLog.tsx` | Tracks meals, calories, macros, nutrition history, and 7-day macro averages. |
| 18 | Hydration | `src/components/HydrationLog.tsx` | Tracks drink intake, hydration progress, history, and 7-day water average. |
| 19 | Sleep | `src/components/SleepLog.tsx` | Tracks sleep duration, sleep history, and 7-day sleep average. |
| 20 | Weight | `src/components/WeightLog.tsx` | Tracks weight logs, trends, history, and 30-day average. |
| 21 | Reports | `src/components/ReportsPage.tsx` | Shows health report analytics by selectable time period. |
| 22 | Profile | `src/components/UserProfilePage.tsx` | Manages profile details, profile image, personal information, health targets, and AI-generated goals. |
| 23 | Reminders | `src/components/NotificationsPage.tsx` | Lets users enable or disable notification/reminder preferences. |
| 24 | Support | `src/components/SupportPage.tsx` | Lists support tickets and allows ticket creation, replies, and closing tickets. |
| 25 | Messages | `src/components/MessagesPage.tsx` | Displays admin/system messages and marks messages as read. |
| 26 | Settings | `src/components/SettingsPageFull.tsx` | Manages account details, theme, subscription, payment history, app version, and sign out. |

## User Dashboard Child Screens, Popups, And Drawers

| # | Screen | Source | Purpose |
|---|---|---|---|
| 27 | Mobile Sidebar Overlay | `src/pages/Dashboard.tsx` | Responsive navigation drawer opened from the menu button on smaller screens. |
| 28 | Account Menu Popup | `src/pages/Dashboard.tsx` | Avatar dropdown with Profile and Logout actions. |
| 29 | Logout Confirmation Dialog | `src/App.tsx` | Confirms whether the user wants to sign out before ending the session. |
| 30 | Session Expiry Dialog | `src/components/SessionGuard.tsx` | Security popup with countdown that lets the user refresh the session or log out. |
| 31 | Log Activity Form | `src/components/ActivityLog.tsx` | Child form for adding an activity manually or through AI image analysis. |
| 32 | Log Meal Form | `src/components/NutritionLog.tsx` | Child form for adding a meal manually or through AI image analysis. |
| 33 | Log Drink Form | `src/components/HydrationLog.tsx` | Child form for adding hydration manually or through AI image analysis. |
| 34 | Log Sleep Form | `src/components/SleepLog.tsx` | Child form for adding sleep manually or through AI image analysis. |
| 35 | Log Weight Form | `src/components/WeightLog.tsx` | Child form for adding weight manually or through AI image analysis. |
| 36 | Support Ticket Create Form | `src/components/SupportPage.tsx` | Inline child screen for creating a support ticket with subject, category, priority, and description. |
| 37 | Support Ticket Detail Expanded Screen | `src/components/SupportPage.tsx` | Expanded ticket view showing description, conversation messages, reply input, and close action. |
| 38 | AI Goal Wizard State | `src/components/UserProfilePage.tsx` | Profile child flow for generating daily health goals from user profile and target inputs. |
| 39 | Subscription History Modal | `src/components/SettingsPageFull.tsx` | Modal showing detailed subscription order history with export action. |
| 40 | Subscription Plan Payment Modal | `src/components/SettingsPageFull.tsx` | Modal for choosing an upgrade plan, billing duration, credit amount, and payment total. |

## Admin Dashboard Tab Screens

| # | Screen | Source | Purpose |
|---|---|---|---|
| 41 | Admin Overview | `src/pages/AdminDashboard.tsx` | System metrics dashboard for users, plans, AI usage, spend, signups, and recent users. |
| 42 | Admin Users | `src/pages/AdminDashboard.tsx` | User management screen with filters, user table, status actions, pagination, and user distribution charts. |
| 43 | Admin AI Costs | `src/pages/AdminDashboard.tsx` | Tracks AI usage cost logs, tokens, credits, and cost analytics. |
| 44 | Admin Reports | `src/pages/AdminDashboard.tsx` | Admin reporting area. |
| 45 | Admin Plans | `src/pages/AdminDashboard.tsx` | Manages subscription plan data and plan-related settings. |
| 46 | Admin Broadcast | `src/pages/AdminDashboard.tsx` | Sends broadcast/admin messages to users. |
| 47 | Admin Settings | `src/pages/AdminDashboard.tsx` | Admin settings area. |

## Admin Child Screens, Popups, And Drawers

| # | Screen | Source | Purpose |
|---|---|---|---|
| 48 | Admin Mobile Sidebar Overlay | `src/pages/AdminDashboard.tsx` | Responsive admin navigation drawer opened from the menu button on smaller screens. |
| 49 | User Credit Usage Drawer | `src/pages/AdminDashboard.tsx` | Slide-out drawer showing a selected user's allocated, used, and remaining AI credits, breakdown, filters, and transaction table. |

## External Or Browser-Owned Dialogs

These are part of the user flow but are not app-rendered React screens:

- Razorpay Checkout Window: opened from subscription payment flows in `src/components/SettingsPageFull.tsx` and `src/components/SubscriptionPage.tsx`.
- Browser Confirm Dialog: used before banning a user from the admin user table in `src/pages/AdminDashboard.tsx`.
- File Picker Dialog: opened when uploading a profile image in `src/components/UserProfilePage.tsx`.

## Other Interactive States

These are not counted as separate screens because they expand content within an existing screen:

- Landing mobile menu in `src/pages/LandingPage.tsx`.
- Landing FAQ expanded/collapsed answers in `src/pages/LandingPage.tsx`.
- Dashboard date filters in log/report screens.
- Loading, empty, error, success, and toast states across pages.
