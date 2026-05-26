# FitPulseBot Application Test Cases

Tester viewpoint: execute from the UI screens, using browser devtools only to confirm API/network errors when needed.

## 0. Smoke Test Gate

Smoke tests verify that the application is healthy enough to begin full functional testing. If any smoke test fails, stop detailed testing, log the blocker, and fix/redeploy before continuing.

| ID | Test Case | Steps | Expected Result |
| --- | --- | --- | --- |
| SMOKE-001 | Application opens | Open production/local app URL. | Landing page loads within acceptable time; no blank screen or fatal console error. |
| SMOKE-002 | Backend is reachable | From UI, trigger a simple data load such as Staff Login organization dropdown. | API responds; UI does not remain stuck on loading. |
| SMOKE-003 | Staff organizations load | Open Staff Login / Management Portal. | Organization dropdown shows at least one active organization. |
| SMOKE-004 | Staff branches load | Select an organization in Staff Login. | Branch dropdown shows active branches for that organization. |
| SMOKE-005 | Member login works | Login with a valid member account. | Member Dashboard opens and main navigation is visible. |
| SMOKE-006 | Organization admin login works | Login through Staff Login as Organization Admin. | Organization Portal opens and dashboard cards load. |
| SMOKE-007 | Branch manager login works | Login through Staff Login as Branch Manager. | Branch Dashboard opens for the selected branch. |
| SMOKE-008 | Trainer login works | Login through Staff Login as Trainer. | Trainer Dashboard opens and assigned member area loads. |
| SMOKE-009 | Core branch detail opens | Organization Portal > Branches > click View on a saved branch. | Branch detail panel opens with branch info and related sections. |
| SMOKE-010 | Core AI helper responds | Trainer Dashboard > run Macro Calculator with valid data. | Macro targets are returned; no 500/error toast. |
| SMOKE-011 | Logout works | Logout from any logged-in role. | Session clears and app returns to public/login state. |

## Test Data And Roles

Use valid seeded accounts or create/reset accounts before testing.

| Role | Portal / Screen | Expected Landing After Login |
| --- | --- | --- |
| Public visitor | Landing page | Landing |
| Member | User login | Member Dashboard |
| Super Admin | User login | Super Admin Dashboard |
| Organization Admin | Staff Login > Organization Admin | Organization Portal |
| Branch Manager | Staff Login > Branch Manager | Branch Dashboard |
| Trainer | Staff Login > Trainer / Coach | Trainer Dashboard |

Core branch data expected:

- At least 1 active organization.
- At least 1 active branch under that organization.
- At least 1 active branch manager, trainer, and member for branch-related tests.

## 1. Public Landing Page

| ID | Test Case | Steps | Expected Result |
| --- | --- | --- | --- |
| PUB-001 | Landing page loads | Open app URL. | Landing page loads without console crash; main marketing content, CTA buttons, and navigation are visible. |
| PUB-002 | Navigate to user sign in | Click user sign-in/login CTA. | User authentication screen opens. |
| PUB-003 | Navigate to staff login | Click staff/organization portal CTA if available. | Staff Login / FitPulseBot Management Portal opens. |
| PUB-004 | Privacy page | Open Privacy link. | Privacy page displays and Back returns to landing. |
| PUB-005 | Terms page | Open Terms link. | Terms page displays and Back returns to landing. |
| PUB-006 | Theme persistence | Toggle light/dark theme, refresh page. | Selected theme remains after refresh. |
| PUB-007 | Invalid direct protected access | Clear local storage, try to open protected dashboard by URL/state if possible. | User is redirected to landing/login or protected content is not shown. |

## 2. User Authentication

| ID | Test Case | Steps | Expected Result |
| --- | --- | --- | --- |
| AUTH-001 | User login with valid credentials | Open User Login, enter valid member username/password, submit. | Login succeeds; member dashboard opens; token/user data is stored. |
| AUTH-002 | User login with wrong password | Enter valid username and wrong password. | Login fails; clear error message is shown; no dashboard access. |
| AUTH-003 | User login with unknown username | Enter unknown username and any password. | Login fails with invalid credentials; no token stored. |
| AUTH-004 | Empty login form validation | Submit without username/password. | Required field validation prevents submit or shows validation errors. |
| AUTH-005 | User registration valid | Open create account, enter valid username/password, accept terms, submit. | Account is created; user can sign in. |
| AUTH-006 | Registration password mismatch | Enter different password and confirm password. | Registration blocked with password mismatch error. |
| AUTH-007 | Registration without terms | Fill form but do not accept terms. | Registration blocked; terms acceptance error shown. |
| AUTH-008 | Duplicate username registration | Try registering an existing username. | API/UI shows duplicate/existing user error. |
| AUTH-009 | Forgot password valid email | Open forgot password, enter registered email. | Success message appears; reset email is requested. |
| AUTH-010 | Forgot password invalid email | Enter invalid/unregistered email. | Error message appears; no reset success state. |
| AUTH-011 | Reset password valid token | Open reset URL with valid token/email, enter matching new passwords. | Password is changed; user can login with new password. |
| AUTH-012 | Reset password invalid token | Open reset URL with invalid/expired token. | Reset fails with error; password remains unchanged. |
| AUTH-013 | Logout confirmation cancel | Click logout, cancel dialog. | User remains logged in on same screen. |
| AUTH-014 | Logout confirmation accept | Click logout, confirm. | Session clears; app returns to landing/login. |
| AUTH-015 | Session expired flow | Use expired/invalid token then perform API action. | Session expired dialog appears; user can re-login or is logged out. |

## 3. Staff Login / FitPulseBot Management Portal

| ID | Test Case | Steps | Expected Result |
| --- | --- | --- | --- |
| STAFF-001 | Staff login page loads | Open Staff Login / Management Portal. | Login mode cards for Organization Admin, Branch Manager, Trainer are visible. |
| STAFF-002 | Organization dropdown loads | Select Organization Admin mode. | Organization dropdown stops showing "Loading organizations..." and lists active organizations. |
| STAFF-003 | Branch dropdown loads | Select Branch Manager or Trainer mode, select organization. | Branch dropdown lists active branches for selected organization. |
| STAFF-004 | No organization selected | Try continue/login without selecting organization. | UI shows "Select an organization first" or equivalent; cannot proceed. |
| STAFF-005 | No branch selected for branch/trainer | Select branch/trainer mode and organization only; continue. | UI shows "Select a branch"; cannot proceed. |
| STAFF-006 | Valid org admin login | Select org, enter org admin username/password, submit. | Login succeeds and Organization Portal opens. |
| STAFF-007 | Valid branch manager login | Select org and branch, enter branch manager credentials. | Login succeeds and Branch Dashboard opens. |
| STAFF-008 | Valid trainer login | Select org and branch, enter trainer credentials. | Login succeeds and Trainer Dashboard opens. |
| STAFF-009 | Role mismatch login | Select Trainer mode but login with branch manager account. | Login is rejected or redirects only to correct role; trainer dashboard is not exposed. |
| STAFF-010 | Wrong staff password | Select correct org/branch, enter wrong password. | Login fails with clear error. |
| STAFF-011 | Back to user login | Click switch to regular user login. | User login screen opens. |
| STAFF-012 | API failure for organizations | Stop backend or block organization endpoint, reload staff login. | UI shows a recoverable error or remains safe; no blank crash. |

## 4. Member Dashboard

| ID | Test Case | Steps | Expected Result |
| --- | --- | --- | --- |
| MEM-001 | Dashboard overview loads | Login as member. | Dashboard loads with cards/sections for health tracking. |
| MEM-002 | Today section data | Open Today tab/section. | Today metrics load; missing data shows zero/empty state, not crash. |
| MEM-003 | Activity log list | Open Activity. | Existing activity logs list by date. |
| MEM-004 | Add activity valid | Add activity with type, duration, calories/date. | Entry is saved and appears in list/dashboard. |
| MEM-005 | Add activity invalid | Submit missing duration/type or invalid numeric value. | Validation error; no bad entry saved. |
| MEM-006 | Delete activity | Delete an existing activity entry. | Entry is removed and totals update. |
| MEM-007 | AI activity image valid | Upload valid activity image if available. | AI parses/logs activity or returns structured result; app cost/credit updates if applicable. |
| MEM-008 | AI activity image no key/error | Trigger AI endpoint with missing key/server error. | User sees understandable failure; UI does not hang indefinitely. |
| MEM-009 | Food list | Open Nutrition. | Food logs load; empty state works. |
| MEM-010 | Add food manual valid | Add meal with calories/protein/carbs/fat. | Meal saved and nutrition summaries update. |
| MEM-011 | Add food invalid macros | Enter negative calories or invalid number. | Validation blocks or API error shown; no bad entry saved. |
| MEM-012 | AI food image valid | Upload meal image. | Food/macros detected and log saved/previewed. |
| MEM-013 | Delete food | Delete a food entry. | Entry disappears and averages update. |
| MEM-014 | Water list | Open Hydration. | Water entries and average load. |
| MEM-015 | Add water valid | Add valid ml amount. | Water entry saved and today total updates. |
| MEM-016 | Add water invalid | Add zero/negative/very high invalid amount. | Validation error or API rejection. |
| MEM-017 | Sleep list | Open Sleep. | Sleep entries and average load. |
| MEM-018 | Add sleep valid | Add valid sleep hours. | Sleep entry saved and dashboard updates. |
| MEM-019 | Add sleep invalid | Add negative or impossible sleep hours. | Validation error or API rejection. |
| MEM-020 | Weight list/chart | Open Weight. | Weight entries and chart load. |
| MEM-021 | Add weight valid | Add valid weight. | Entry saved; chart includes new point. |
| MEM-022 | Add weight invalid | Add negative/blank/non-number weight. | Validation error; no entry saved. |
| MEM-023 | Reports health metrics | Open Reports with valid date range. | Report loads with metrics/charts. |
| MEM-024 | Reports invalid date range | Select end date before start date. | UI prevents request or shows error. |
| MEM-025 | Profile view | Open Profile. | Profile details and goals load. |
| MEM-026 | Profile update valid | Edit height/weight/name/goals and save. | Save succeeds and persisted data displays after refresh. |
| MEM-027 | Profile update invalid | Enter invalid height/weight/date. | Validation error; previous data remains. |
| MEM-028 | Profile picture upload valid | Upload valid image. | Image uploads and avatar displays. |
| MEM-029 | Profile picture invalid file | Upload non-image/large file. | Upload fails gracefully with message. |
| MEM-030 | Reminders list | Open Reminders. | Notification options load for user plan. |
| MEM-031 | Save reminders | Toggle notification settings and save. | Settings persist after refresh. |
| MEM-032 | Support ticket create | Open Support, create ticket with subject/description. | Ticket created and appears in list. |
| MEM-033 | Support ticket missing subject | Submit blank subject/description. | Validation blocks creation. |
| MEM-034 | Support ticket detail/message | Open ticket, add message. | Message appears in conversation. |
| MEM-035 | Messages list | Open Messages. | Messages load, unread/read status visible. |
| MEM-036 | Mark message read | Open or mark unread message. | Message read status updates. |
| MEM-037 | Settings page | Open Settings, change available settings. | Values save or correct placeholder state displays. |

## 5. Super Admin Dashboard

| ID | Test Case | Steps | Expected Result |
| --- | --- | --- | --- |
| SA-001 | Super admin dashboard loads | Login as super admin. | Dashboard overview loads counts and organization summary. |
| SA-002 | Organization list | Open Organizations tab. | Organizations list with name/code/counts/status. |
| SA-003 | Create organization valid | Create org with admin user and temp password. | Organization created; admin user linked; appears in list. |
| SA-004 | Create organization duplicate code | Use an existing org code. | API/UI rejects duplicate; no duplicate row. |
| SA-005 | Create organization missing required | Omit org name/code/admin username/password. | Validation error; no org created. |
| SA-006 | Edit organization valid | Edit contact/address/status. | Changes save and persist. |
| SA-007 | Deactivate organization | Delete/deactivate org. | Status becomes inactive; dependent data remains safe. |
| SA-008 | Search organizations | Search by name/code. | Matching orgs displayed; no-match empty state shown. |
| SA-009 | Open branches sub-panel | Click Branches for an organization. | Branches for selected organization load. |
| SA-010 | Create branch valid | Add branch with manager account. | Branch and branch manager are created. |
| SA-011 | Edit branch valid | Edit branch contact/address. | Branch row updates. |
| SA-012 | Deactivate branch | Delete/deactivate branch. | Branch status updates; hard delete does not occur. |
| SA-013 | Access control | Try super admin pages as normal member. | Super admin data is not accessible. |

## 6. Organization Portal

| ID | Test Case | Steps | Expected Result |
| --- | --- | --- | --- |
| ORG-001 | Organization portal loads | Login as organization admin. | Organization Portal dashboard loads summary cards. |
| ORG-002 | Dashboard counts | View dashboard. | Branch/member/trainer/ticket counts match backend values. |
| ORG-003 | Attendance summary | View Today Attendance widget. | Present/absent/late counts display or empty safely. |
| ORG-004 | Recent branches | View dashboard recent branches. | Recent branch table shows branch rows. |
| ORG-005 | Branch list loads | Open Branches tab. | Saved branch records display. |
| ORG-006 | View branch detail | Click View icon on saved branch. | Branch detail panel opens with branch info, members, trainers, assignments, attendance, and support sections. |
| ORG-007 | Branch detail back | Click Back from branch detail. | Returns to branch list without re-login. |
| ORG-008 | Branch detail refresh | Click Refresh in branch detail. | Data reloads and remains on detail page. |
| ORG-009 | Branch detail empty data | Open branch with no members/trainers/tickets. | Empty-state messages display in each table. |
| ORG-010 | Create branch valid | Click New Branch, enter valid branch and manager details. | Branch appears in list; manager user is created. |
| ORG-011 | Create branch missing manager email | Submit new branch without manager email. | Validation/API error shown; branch not created. |
| ORG-012 | Create branch duplicate code | Use existing branch code in same org. | Duplicate error shown; no duplicate branch. |
| ORG-013 | Edit branch | Click edit icon, update contact/phone/address. | Changes save and display in list/detail. |
| ORG-014 | Deactivate branch | Click delete icon and confirm. | Branch becomes inactive or disappears depending filter; data is not hard deleted. |
| ORG-015 | Cancel branch deactivate | Click delete then cancel confirmation. | Branch remains unchanged. |
| ORG-016 | Organization branding load | Open Branding tab. | Current branding loads or blank/default values show. |
| ORG-017 | Save branding valid | Update colors/logo/app name and save. | Success state appears; values persist after refresh. |
| ORG-018 | Invalid branding URL | Enter malformed logo/banner URL. | Save either accepts text safely or image preview fails gracefully; no crash. |
| ORG-019 | Unauthorized org admin action | Use org admin token for another org/branch if possible. | Access denied or no data leakage. |

## 7. Branch Manager Dashboard

| ID | Test Case | Steps | Expected Result |
| --- | --- | --- | --- |
| BR-001 | Branch dashboard loads | Login as branch manager. | Branch Dashboard opens for assigned branch. |
| BR-002 | No assigned branch | Login branch manager without branchId. | Safe message: no branch assigned/contact admin. |
| BR-003 | Dashboard branch info | View dashboard. | Branch name, code, timezone, phone, city display. |
| BR-004 | Dashboard stats | View stat cards. | Members, active members, trainers, tickets display. |
| BR-005 | Members list | Open Members tab. | Members display with profile summary/status. |
| BR-006 | Search members | Search by member name/email. | Matching members display; no-match empty state. |
| BR-007 | Onboard member valid | Click Onboard Member, fill user info/temp password. | Member created and appears in list. |
| BR-008 | Onboard member duplicate | Use existing email/username. | Duplicate error; no duplicate user. |
| BR-009 | Deactivate member | Click deactivate on member. | Member status becomes inactive/removed from active list. |
| BR-010 | Trainers list | Open Trainers tab. | Trainers display with status/profile data. |
| BR-011 | Onboard trainer valid | Add trainer with temp password. | Trainer created and appears. |
| BR-012 | Onboard trainer invalid | Missing username or short temp password. | Validation/API error shown. |
| BR-013 | Assign trainer valid | Open Assignments, assign trainer to member. | Assignment row appears. |
| BR-014 | Assign trainer missing selections | Submit without trainer or member. | UI shows "Please select both member and trainer." |
| BR-015 | Duplicate assignment | Assign same trainer/member again. | API rejects duplicate or UI keeps one assignment. |
| BR-016 | Remove assignment | Click remove assignment. | Assignment becomes inactive/removed. |
| BR-017 | Attendance list | Open Attendance tab. | Attendance rows for selected date display. |
| BR-018 | Mark attendance present | Select member/date/status present and save. | Attendance row created/updated. |
| BR-019 | Mark attendance duplicate date | Mark same member/date twice. | Existing row updates or duplicate is rejected clearly. |
| BR-020 | Attendance filter date | Change date filter. | Table updates for selected date. |
| BR-021 | Support tickets | Open Support tab. | Branch support tickets display. |
| BR-022 | Support empty state | Branch with no tickets. | Empty table message, no crash. |
| BR-023 | Branch branding load/save | Open Branding, edit logo/colors/banner, save. | Branding persists and sidebar/header update. |
| BR-024 | Access other branch | Try manually using another branchId via API/local storage. | Backend denies or UI does not expose unauthorized branch data. |

## 8. Trainer Dashboard

| ID | Test Case | Steps | Expected Result |
| --- | --- | --- | --- |
| TR-001 | Trainer dashboard loads | Login as trainer. | Trainer Dashboard opens with assigned member summary. |
| TR-002 | My Members list | Open My Members. | Assigned members display; unassigned members not shown. |
| TR-003 | Member detail open | Open a member detail. | Progress, workouts, diet plans, measurements sections load. |
| TR-004 | Member progress | Open Progress tab/section. | Weight/attendance/body data displays or empty state. |
| TR-005 | Create manual workout | Create workout plan with exercises/schedule. | Workout saved and appears under member. |
| TR-006 | Manual workout missing title | Submit without title. | Validation/API error; no workout saved. |
| TR-007 | Edit workout | Update workout title/exercises. | Changes persist. |
| TR-008 | Delete workout | Remove workout. | Workout becomes inactive/removed from active list. |
| TR-009 | AI workout generate valid | Use AI Workout Generator with member, goal, level, days/week. | Generated draft displays exercises/schedule/metadata. |
| TR-010 | AI workout save | Generate with save or save generated plan. | Workout is stored and appears in member workouts. |
| TR-011 | AI workout missing member | Try generate without selecting member. | UI blocks with clear error. |
| TR-012 | Workout templates | Load goal/level template options. | Templates display for selected goal/level. |
| TR-013 | Create manual diet | Create diet plan with calorie/protein targets/items. | Diet plan saved and appears. |
| TR-014 | Diet invalid target | Enter negative calories/protein. | Validation/API error. |
| TR-015 | AI macro calculator | Enter height/weight/age/activity/goal. | Macro targets calculate and display. |
| TR-016 | Macro invalid input | Enter impossible age/weight/height. | Validation error; no result. |
| TR-017 | AI diet generate valid | Generate diet with type, budget, cuisine, targets. | Diet plan draft displays meals and daily totals. |
| TR-018 | AI diet save | Save generated diet plan. | Diet plan stored and appears under member. |
| TR-019 | Meal alternatives | Request alternatives for a meal. | Alternative meals display with calories/macros. |
| TR-020 | Plateau dashboard valid | Open Plateau AI, select member, run dashboard. | Alerts, scores, trends, and suggestions display. |
| TR-021 | Plateau no data | Run plateau for member with no logs. | Low/empty scores shown; no crash. |
| TR-022 | Plateau optimize | Generate optimization plan. | Workout/diet/recovery suggestions display. |
| TR-023 | Measurements add valid | Add body measurement for member. | Measurement saved and visible. |
| TR-024 | Measurement invalid | Enter negative measurement/body fat >100. | Validation/API error. |
| TR-025 | Unauthorized member access | Trainer tries member not assigned. | Access denied or member data not shown. |

## 9. Platform Admin Dashboard

| ID | Test Case | Steps | Expected Result |
| --- | --- | --- | --- |
| ADM-001 | Admin dashboard loads | Login as admin. | Admin overview loads. |
| ADM-002 | Users tab | Open Users. | User table loads with filters/pagination. |
| ADM-003 | Filter users by role/status/plan | Apply filters. | Table updates correctly. |
| ADM-004 | Update user status | Change user status active/inactive/banned. | Status persists and access behavior changes accordingly. |
| ADM-005 | AI Costs tab | Open AI Costs. | AI logs and spend summary display. |
| ADM-006 | AI cost detail | Open cost/log detail if available. | Token/cost/user details display. |
| ADM-007 | Reports tab | Open Reports. | Reports screen loads without crash. |
| ADM-008 | Plans list | Open Plans. | Plan records display. |
| ADM-009 | Create/update plan | Add/edit plan data. | Plan saved and reflected in list. |
| ADM-010 | Delete plan with dependencies | Try deleting active plan. | Safe rejection or clear confirmation; no broken users. |
| ADM-011 | Plan limits list | Open/inspect plan limits. | Limits display and can be edited with valid values. |
| ADM-012 | Broadcast message valid | Send broadcast if screen supports it. | Message/notification is created/sent. |
| ADM-013 | Broadcast missing content | Submit empty broadcast. | Validation error. |
| ADM-014 | Settings | Open Settings. | System info/settings display. |
| ADM-015 | Non-admin access | Login as member and try admin functions via UI/API. | Access denied. |

## 10. API Error And Network Handling From Screens

| ID | Test Case | Steps | Expected Result |
| --- | --- | --- | --- |
| NET-001 | Backend unavailable | Stop backend and open any data screen. | UI shows loading failure or safe empty state; no permanent spinner where possible. |
| NET-002 | Slow response | Throttle network to Slow 3G and load branch/member screens. | Loading indicators appear; UI remains usable. |
| NET-003 | Request timeout | Force timeout or block endpoint. | Timeout message appears; retry works after restoring network. |
| NET-004 | 500 server error | Trigger known failing endpoint or mock 500. | Error message shown; no data corruption. |
| NET-005 | 401 unauthorized | Clear token while on protected screen and perform action. | Session expired/login flow appears. |
| NET-006 | 403 forbidden | Use valid token without permission for branch/org/member. | Access denied message or no data leak. |
| NET-007 | 404 missing record | Open deleted/nonexistent branch/member/workout. | Not found/empty message shown. |
| NET-008 | Malformed API response | Backend returns missing fields/nulls. | UI renders fallback values such as "-" and does not crash. |

## 11. Security And Role Access

| ID | Test Case | Steps | Expected Result |
| --- | --- | --- | --- |
| SEC-001 | Local storage role tampering | Change `fitpulse_role` from MEMBER to SUPER_ADMIN and refresh. | Backend requests fail; protected data not shown. |
| SEC-002 | Organization ID tampering | Change stored organizationId to another org. | Org dashboard APIs deny access or return no unauthorized data. |
| SEC-003 | Branch ID tampering | Change stored branchId to another branch. | Branch dashboard APIs deny access or return no unauthorized data. |
| SEC-004 | Trainer member tampering | Trainer calls another member detail. | 403 or safe error; data hidden. |
| SEC-005 | XSS input in names/notes | Enter `<script>alert(1)</script>` in name/notes fields. | Text is escaped/displayed safely; script does not run. |
| SEC-006 | SQL-like input | Enter `' OR 1=1 --` in search/login fields. | No expanded results/auth bypass; normal validation/error. |
| SEC-007 | Password masking | Login/password/temp password fields. | Password fields are masked unless explicit show control exists. |
| SEC-008 | Token after logout | Logout then use browser back or API action. | Protected screen/action blocked. |

## 12. Responsive And UX

| ID | Test Case | Steps | Expected Result |
| --- | --- | --- | --- |
| UX-001 | Mobile landing | Open at mobile width. | Layout fits; no overlapping text/buttons. |
| UX-002 | Mobile portal sidebar | Login to portal on mobile, open/close menu. | Sidebar opens with overlay and closes correctly. |
| UX-003 | Tables on mobile | Open Users/Branches/Reports tables on mobile. | Tables scroll horizontally or reflow without clipping critical actions. |
| UX-004 | Modal on mobile | Open branch/user/workout/diet modal. | Modal fits viewport and scrolls; Save/Cancel reachable. |
| UX-005 | Keyboard navigation | Use Tab through login and major forms. | Focus order is logical; buttons/selects reachable. |
| UX-006 | Screen refresh state | Refresh while logged in on each role dashboard. | User stays logged in and routes back to correct dashboard. |
| UX-007 | Browser back behavior | Navigate between tabs/details and use Back where supported. | App does not lose session; detail Back returns to list. |
| UX-008 | Empty states | Test fresh org/branch/member with no data. | Meaningful empty messages appear; no blank panels. |
| UX-009 | Long text handling | Use long branch/member/support names. | Text truncates/wraps professionally; no layout break. |
| UX-010 | Theme all screens | Toggle light/dark and visit all screens. | Colors remain readable; status badges/buttons visible. |

## 13. Data Integrity / Cross-Screen Checks

| ID | Test Case | Steps | Expected Result |
| --- | --- | --- | --- |
| DATA-001 | New branch appears in org dashboard | Create branch, return to dashboard/recent branches. | Branch count and recent branch list update. |
| DATA-002 | New trainer affects counts | Onboard trainer in branch dashboard. | Trainer count updates in branch/org summaries. |
| DATA-003 | New member affects counts | Onboard member. | Member count updates in branch/org/trainer assign screens. |
| DATA-004 | Trainer assignment visible | Assign trainer to member. | Assignment visible in branch assignment table and trainer member list where applicable. |
| DATA-005 | Attendance visible in summaries | Mark attendance. | Attendance tab and dashboard counts reflect status. |
| DATA-006 | Workout visible after AI save | Save AI workout. | Workout appears in member detail/workout list. |
| DATA-007 | Diet visible after AI save | Save AI diet. | Diet appears in member detail/diet list and nutrition summary can use targets. |
| DATA-008 | Measurement visible in progress | Add measurement. | Measurement appears in member detail/progress section. |
| DATA-009 | Support ticket visible to branch | Member creates support ticket. | Branch support dashboard shows the ticket if branch-linked. |
| DATA-010 | Deactivated branch/user impact | Deactivate branch/user. | Related old data remains readable where appropriate, but inactive entity is not selectable as active. |
