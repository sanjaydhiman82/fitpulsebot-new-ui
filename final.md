
# 1. SUPER ADMIN (Platform Owner)
Able to add/edit/delete organization (use existing signup functionality to create new user of type admin), send 
information to new user
if Org available then Able to add/edit/delete Branch (use existing signup functionality to create new user of type 
BRANCH_MANAGER), send
information to new user

### 2. Organization
New page for organization management login
Organization Dashboard
Able to do branding of organization
Able to add/edit/delete Branch (use existing signup functionality to create new user of type BRANCH_MANAGER), send 
information to new user
Manage branding

### 3. Branch
New page for Branch management login (user select Org>Branch) and branding
Onboard and manage user [use table org_user(org,branch,userid,type {MEMBER/TRAINER})]
Onboard and manage trainer  [use table org_user(org,branch,userid,type {MEMBER/TRAINER})]
Assign trainer to user [use table org_user_trainer(org,branch,user)]
Attendance management
Support and Feedback dashbaord
# 4. TRAINER / COACH
## Purpose
Handles workouts, diets, and member fitness transformations.
## Mandatory Screens
New page for Branch management login (user select Org>Branch)
### 1. Trainer Dashboard
- Assigned members 
- Today's sessions
- Pending plans
- Progress summary
### 2. Assigned Members List
- Assigned members
- Attendance
- Goals
- Progress status
### 3. Create Workout Plan
- Exercise selection
- Workout scheduling [use table user_workout(id,workput_id,user...)]
- Goal-based Workout plans  [use table workout(id,created_by{SELF/AI/TRAINER},user...)]

### 4. Assign Workout/Diet
- Assign diet plans  [use table diet_plan(id,created_by{SELF/AI/TRAINER},user...)]

### 5. Progress Tracking Dashboard by Member
- Weight tracking
- Transformation tracking
- Body measurements
- Progress analytics