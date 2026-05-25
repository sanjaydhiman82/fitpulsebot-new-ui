# FitPulseBot API List

Generated from the FastAPI route decorators under `app/api`.

| Sno | api | purpose | use_ai | ai_nodel | Used by Frontend |
| --- | --- | --- | --- | --- | --- |
| 1 | `POST /api/ai/v1/activity-log` | AI activity logging from image | Yes | gpt-4o | Yes |
| 2 | `GET /api/ai/v1/dashboard/insight` | Dashboard insight | Yes | gpt-4o | Yes |
| 3 | `POST /api/ai/v1/food-intake` | AI food intake logging from image | Yes | gpt-4o | Yes |
| 4 | `POST /api/ai/v1/user/sleep` | AI sleep logging from tracker image | Yes | gpt-4o | Yes |
| 5 | `POST /api/ai/v1/water-intake` | AI water intake logging from image | Yes | gpt-4o | Yes |
| 6 | `POST /api/ai/v1/weight-log` | AI weight logging from scale image | Yes | gpt-4o | Yes |
| 7 | `GET /api/v1/activity-log` | Get activity logs for user | No | - | Yes |
| 8 | `POST /api/v1/activity-log` | Create activity log | No | - | Yes |
| 9 | `DELETE /api/v1/activity-log/{user_id}` | Delete activity logs for user | No | - | Yes |
| 10 | `GET /api/v1/admin/plan-limits` | List all plan limits (admin) | No | - | Yes |
| 11 | `POST /api/v1/admin/plan-limits` | Create a plan limit (admin) | No | - | Yes |
| 12 | `DELETE /api/v1/admin/plan-limits/{limit_id}` | Delete a plan limit (admin) | No | - | Yes |
| 13 | `PATCH /api/v1/admin/plan-limits/{limit_id}` | Update a plan limit (admin) | No | - | Yes |
| 14 | `GET /api/v1/admin/plans` | List all plans (admin) | No | - | Yes |
| 15 | `POST /api/v1/admin/plans` | Create a plan (admin) | No | - | Yes |
| 16 | `DELETE /api/v1/admin/plans/{plan_name}` | Delete a plan (admin) | No | - | Yes |
| 17 | `PATCH /api/v1/admin/plans/{plan_name}` | Update a plan (admin) | No | - | Yes |
| 18 | `GET /api/v1/admin/schema/{table_name}` | Inspect table columns (admin) | No | - | Yes |
| 19 | `GET /api/v1/ai-credit-score` | List AI credit records | No | - | Yes |
| 20 | `POST /api/v1/ai-credit-score` | Create AI credit record | No | - | No |
| 21 | `GET /api/v1/ai-credit-score/{userId}` | Get AI credit records by user | No | - | Yes |
| 22 | `GET /api/v1/appcost` | Get all app cost logs | No | - | Yes |
| 23 | `POST /api/v1/appcost` | Log app cost | No | - | No |
| 24 | `GET /api/v1/appcost/user/{userId}` | Get app cost logs by user ID | No | - | No |
| 25 | `GET /api/v1/appcost/{id}` | Get app cost log by numeric ID or user UUID | No | - | No |
| 26 | `POST /api/v1/auth/refresh` | Refresh access token | No | - | Yes |
| 27 | `GET /api/v1/dashboard/charts/activity` | Get activity chart | No | - | Yes |
| 28 | `GET /api/v1/dashboard/charts/weight` | Get weight chart | No | - | Yes |
| 29 | `GET /api/v1/dashboard/counters/{userId}` | Get dashboard counters | No | - | No |
| 30 | `GET /api/v1/dashboard/goal` | Get dashboard goal | No | - | No |
| 31 | `GET /api/v1/dashboard/section/activity` | Section activity | No | - | Yes |
| 32 | `GET /api/v1/dashboard/section/goals` | Section goals | No | - | Yes |
| 33 | `GET /api/v1/dashboard/section/hydration` | Section hydration | No | - | Yes |
| 34 | `GET /api/v1/dashboard/section/nutrition` | Section nutrition | No | - | Yes |
| 35 | `GET /api/v1/dashboard/section/sleep` | Section sleep | No | - | Yes |
| 36 | `GET /api/v1/dashboard/section/today` | Section today | No | - | Yes |
| 37 | `GET /api/v1/dashboard/section/weight` | Section weight | No | - | Yes |
| 38 | `GET /api/v1/debug/user-schema-request` | Debug user schema request | No | - | No |
| 39 | `GET /api/v1/debug/user-schema-response` | Debug user schema response | No | - | No |
| 40 | `POST /api/v1/email` | Send email for user | No | - | No |
| 41 | `GET /api/v1/email/config` | Get email config | No | - | No |
| 42 | `POST /api/v1/file/upload` | Upload a file via webhook in JSON base64 format | No | - | No |
| 43 | `GET /api/v1/food-intake` | Get food intakes for user | No | - | Yes |
| 44 | `POST /api/v1/food-intake` | Create food intake | No | - | Yes |
| 45 | `POST /api/v1/food-intake-ai` | Create food intake using AI-style payload | Yes | Internal AI parser | No |
| 46 | `GET /api/v1/food-intake/average` | Get average food intake for last N days | No | - | Yes |
| 47 | `DELETE /api/v1/food-intake/{entry_id}` | Delete food intake | No | - | Yes |
| 48 | `GET /api/v1/food-intake/{entry_id}` | Get food intake | No | - | No |
| 49 | `POST /api/v1/login` | User login | No | - | Yes |
| 50 | `POST /api/v1/login/google` | Google OAuth login | No | - | Yes |
| 51 | `POST /api/v1/mcp` | MCP JSON-RPC endpoint | No | - | No |
| 52 | `GET /api/v1/mcp/health` | MCP HTTP health check | No | - | No |
| 53 | `GET /api/v1/mcp/resources` | List MCP HTTP resources | No | - | No |
| 54 | `POST /api/v1/mcp/resources/read` | Read MCP HTTP resource | No | - | No |
| 55 | `GET /api/v1/mcp/tools` | List MCP HTTP tools | No | - | No |
| 56 | `POST /api/v1/mcp/tools/call` | Call MCP HTTP tool | No | - | No |
| 57 | `GET /api/v1/messages` | Get conversation | No | - | Yes |
| 58 | `POST /api/v1/messages` | Send message | No | - | Yes |
| 59 | `DELETE /api/v1/messages/{message_id}` | Delete message | No | - | No |
| 60 | `PATCH /api/v1/messages/{message_id}` | Update message | No | - | No |
| 61 | `PATCH /api/v1/messages/{message_id}/read` | Mark message read | No | - | Yes |
| 62 | `POST /api/v1/notification/email` | Send an email to a user | No | - | No |
| 63 | `GET /api/v1/notifications` | Get notification types | No | - | Yes |
| 64 | `POST /api/v1/Order` | Create Razorpay order | No | - | No |
| 65 | `POST /api/v1/order` | Create Razorpay order | No | - | Yes |
| 66 | `POST /api/v1/order/invoice` | Generate and email invoice PDF | No | - | No |
| 67 | `POST /api/v1/order/verify` | Verify Razorpay payment | No | - | Yes |
| 68 | `GET /api/v1/order/{ordId}` | Get order | No | - | No |
| 69 | `GET /api/v1/plans` | Get plans | No | - | Yes |
| 70 | `GET /api/v1/profile` | Get user profile | No | - | Yes |
| 71 | `POST /api/v1/profile` | Update user profile | No | - | Yes |
| 72 | `POST /api/v1/profile/pic` | Upload profile picture | No | - | Yes |
| 73 | `GET /api/v1/profile/{userid}` | Get user profile by ID | No | - | No |
| 74 | `GET /api/v1/profileinfo/{user_id}` | Get user profile info | No | - | No |
| 75 | `GET /api/v1/report/health-compare` | Get health compare report | No | - | No |
| 76 | `GET /api/v1/report/health-metrics` | Get daily health metrics report | No | - | No |
| 77 | `GET /api/v1/report/test` | Test report router registration | No | - | No |
| 78 | `GET /api/v1/support/tickets` | List user support tickets | No | - | Yes |
| 79 | `POST /api/v1/support/tickets` | Create support ticket | No | - | Yes |
| 80 | `GET /api/v1/support/tickets/{ticketId}` | Get ticket details | No | - | Yes |
| 81 | `POST /api/v1/support/tickets/{ticketId}/close` | Close support ticket | No | - | Yes |
| 82 | `POST /api/v1/support/tickets/{ticketId}/messages` | Add message to support ticket | No | - | Yes |
| 83 | `DELETE /api/v1/user` | Delete user account | No | - | No |
| 84 | `GET /api/v1/user` | Get current user | No | - | No |
| 85 | `POST /api/v1/user` | Register a new user | No | - | Yes |
| 86 | `PUT /api/v1/user` | Update user details | No | - | No |
| 87 | `GET /api/v1/user/carrier/{carrierId}` | Get user by carrier | No | - | No |
| 88 | `GET /api/v1/user/credit/{userId}` | Get user credit summary | No | - | Yes |
| 89 | `GET /api/v1/user/credit/{userId}/breakdown` | Get per-feature credit breakdown for a user | No | - | Yes |
| 90 | `POST /api/v1/user/forgot/password` | Forgot password | No | - | Yes |
| 91 | `POST /api/v1/user/goal/ai` | Generate user goal with AI knowledgebase | Yes | External AI knowledgebase | Yes |
| 92 | `GET /api/v1/user/goal/{userId}` | Get user goal | No | - | Yes |
| 93 | `GET /api/v1/user/messages/{userId}` | Get user messages | No | - | Yes |
| 94 | `DELETE /api/v1/user/notification` | Delete user notification | No | - | Yes |
| 95 | `POST /api/v1/user/notification` | Create user notification | No | - | Yes |
| 96 | `GET /api/v1/user/notification/{userId}` | Get user notifications | No | - | Yes |
| 97 | `GET /api/v1/user/order/summary/{userID}` | Get user order summary | No | - | Yes |
| 98 | `GET /api/v1/user/order/{userID}` | Get user orders | No | - | Yes |
| 99 | `POST /api/v1/user/preferences` | Create user preferences | No | - | No |
| 100 | `GET /api/v1/user/preferences/{userId}` | Get user preferences | No | - | No |
| 101 | `POST /api/v1/user/push` | Register push ID | No | - | No |
| 102 | `POST /api/v1/user/push/test` | Test push notification | No | - | No |
| 103 | `POST /api/v1/user/reset/password` | Reset password | No | - | Yes |
| 104 | `GET /api/v1/user/sleep` | Get user sleep | No | - | Yes |
| 105 | `POST /api/v1/user/sleep` | Create user sleep | No | - | Yes |
| 106 | `GET /api/v1/user/sleep/average` | Get average sleep for last N days | No | - | Yes |
| 107 | `DELETE /api/v1/user/sleep/{id}` | Delete user sleep | No | - | Yes |
| 108 | `GET /api/v1/user/subscription/{userID}` | Get latest user subscription | No | - | Yes |
| 109 | `GET /api/v1/users` | List all users | No | - | Yes |
| 110 | `PATCH /api/v1/users/{user_id}/status` | Update user status | No | - | Yes |
| 111 | `GET /api/v1/water-intake` | Get water intakes for user | No | - | Yes |
| 112 | `POST /api/v1/water-intake` | Create water intake | No | - | Yes |
| 113 | `GET /api/v1/water-intake/average` | Get average water intake for last N days | No | - | Yes |
| 114 | `DELETE /api/v1/water-intake/{entry_id}` | Delete water intake | No | - | Yes |
| 115 | `GET /api/v1/weight-log` | Get weight logs for user | No | - | Yes |
| 116 | `POST /api/v1/weight-log` | Create weight log | No | - | Yes |
| 117 | `GET /api/v1/weight-log/average` | Get average weight for last N days | No | - | Yes |
| 118 | `DELETE /api/v1/weight-log/{id}` | Delete weight logs for user | No | - | Yes |
