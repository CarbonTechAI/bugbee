✅ 
✅ 
�� 
�� 
# RecruitBee QA Testing Guide 
## Zero-to-Expert: Complete Testing Guide for First-Time QA Testers 
**Project**: RecruitBee - Multi-Tenant Recruiting Platform **Audience**: QA Testers (No Prior QA Experience Required!) **Test Environment**: Staging (Safe Testing Environment) **Expected Time**: First run: ~5-6 hours | Subsequent runs: ~3-4 hours **Maintenance**: <1 hour/week 
--- 

##  
 What You'll Learn 

By the end of this guide, you will be able to: 
1.  
 Set up your own test environment from scratch 2.  
 Create test users with proper permissions 
3. Test every feature in RecruitBee like a professional QA engineer 4. Find bugs BEFORE they reach production 
5. Document bugs clearly for developers 
**Don't worry if you've never done QA testing before!** This guide explains  EVERYTHING step-by-step. 
--- 

##  
 Table of Contents 

1. [QA Testing 101 - What is QA?](#qa-testing-101) 
2. [Environment Setup - Your Testing Workspace](#environment-setup) 3. [WrkrBee Admin Tutorial - Creating Test Users](#wrkrbee-admin-tutorial) 4. [Test User Setup - Building Your Test Team](#test-user-setup) 5. [Testing Workflows - Step-by-Step Test Cases](#testing-workflows) 6. [What to Look For - Visual Checkpoints](#visual-checkpoints) 7. [Reporting Bugs - How to Document Issues](#reporting-bugs) 8. [QA Best Practices - Tips for Success](#qa-best-practices) 
--- 
## QA Testing 101 
### What is QA Testing?
**QA = Quality Assurance**. Your job is to find bugs BEFORE real users experience  them. 
**Think of yourself as a detective**: 
-  You test features to see if they work correctly 
-  You look for bugs (things that don't work as expected) 
-  You document what you find so developers can fix it 
-  You verify the fixes work 
### Why Manual Testing Matters 
Even with automated tests, **human testing catches things computers miss**: -  Confusing user interfaces 
- Broken workflows that "technically work" but feel wrong 
- Error messages that don't make sense 
- Mobile responsive issues 
- Real-world edge cases 
### The Testing Mindset 
**Your goal**: Break things on purpose (in staging!) so they DON'T break in  production. 
**Ask yourself**: 
- "What happens if I click this button twice?" 
- "What if I leave a required field empty?" 
- "What if I'm on a phone instead of a computer?" 
- "Can I see data I shouldn't have access to?" 
**Remember**: Every bug you find is a SUCCESS! 
--- 
## Environment Setup 
### Step 1: Access Requirements 
**You Need**: 
1.  **Staging access**: Login credentials (ask your team lead) 2.  **Browser**: Chrome or Edge (recommended for testing) 3. **Phone**: Your personal phone for SMS testing 
4. **Calendar**: Personal Google Calendar for integration testing 5. **Notepad**: For recording test results (or use this document)
**URLs You'll Use**: 
| URL | Purpose | 
|-----|---------| 
| `https://app.wrkrbee.ai` | Main login page | 
| `https://recruit.wrkrbee.ai` | RecruitBee module | 
| `https://reception.wrkrbee.ai` | ReceptionBee module (admin panel) | | `https://retain.wrkrbee.ai` | RetentionBee module (if testing multi-module) | 
--- 
### Step 2: Browser Setup 
**Open Chrome/Edge and set up your testing environment**: 
#### 2a. Open Developer Tools (IMPORTANT!) 
These tools help you find bugs: 
1. **Open Chrome DevTools**: 
 - Mac: `Cmd + Option + I` 
 - Windows: `F12` or `Ctrl + Shift + I` 
2. **You should see**: 
 - **Console** tab (shows errors in red) 
 - **Network** tab (shows API requests) 
 - **Application** tab (shows cookies/storage) 
**Leave DevTools open during ALL testing!** 
#### 2b. What Each Tab Does (Beginner's Guide) 
| Tab | What It Shows | When To Use It | 
|-----|--------------|----------------| 
| **Console** | JavaScript errors (red text) | After EVERY action - if you see red  errors, it's a bug! | 
| **Network** | API calls to the server | When testing saves, loads, or webhooks | | **Application** | Cookies and session data | When testing login/logout | 
**Visual Guide**: 
``` 
Chrome DevTools (bottom of browser): 
┌─────────────────────────────────────┐ │ Elements │ Console │ Network │ ... │ ← Tabs
├─────────────────────────────────────┤ │ Error: Cannot read property... │ ← Red text = BUG! 
│ Warning: Deprecated function... │ ← Yellow = Warning 
│ Info: API call successful │ ← Blue = Info 
└─────────────────────────────────────┘ ``` 
--- 
### Step 3: Test Credentials (Provided by Team) 
**You'll receive**: 
- Email: `[your-email]@stage.com` 
- Password: `[staging-password]` 
- Admin access: `carbon@stage.com` (for creating test users) **Important**: NEVER use real user credentials for testing! 
--- 
## WrkrBee Admin Tutorial 
### What is WrkrBee Admin? 
**WrkrBee Admin** is the control panel for managing: 
-  Users (employees, admins, franchisees) 
-  Organizations (locations like "Phoenix Office") 
-  Settings (calendars, SMS templates, etc.) 
-  Permissions (who can access which modules) 
**Where to Find It**: ReceptionBee module (`https://reception.wrkrbee.ai`) --- 
### Tutorial: Creating Your First Test User 
**Why Create Test Users?** 
Instead of using existing users (which could affect real data), you'll create a clean  set of test users with specific roles. 
--- 
#### Step 1: Login to WrkrBee Admin
1. Navigate to `https://app.wrkrbee.ai/login` 
2. Login with admin credentials: `carbon@stage.com` 
3. You'll see a **Module Selector** (tiles for each module) 
4. Click **ReceptionBee** tile 
**What You Should See**: 
``` 
┌────────────────────────────────┐ │ Select a Module │ 
│ │ 
│ ┌──────┐ ┌──────┐ ┌──────┐ │ 
│ │ │ │ │ │ │ │ 
│ │ Recep│ │ Recru│ │ Retain│ │ ← Click ReceptionBee 
│ │ tion │ │ it │ │ tion │ │ 
│ └──────┘ └──────┘ └──────┘ │ 
└────────────────────────────────┘ ``` 
--- 
#### Step 2: Navigate to Team Management 
1. In ReceptionBee, click **Settings** (gear icon, top-right) 
2. Click **Team** tab (left sidebar) 
3. You'll see a list of existing users 
**What You Should See**: 
``` 
Settings > Team 
┌────────────────────────────────────── ──┐ 
│ + Add New User [Button]│ ← Click this 
├────────────────────────────────────── ──┤ 
│ Name Email Role │ 
│ Alex Kilgo alex@... Admin │ 
│ Wes Dobias wes@... Employee │ 
└────────────────────────────────────── ──┘ 
``` 
---
#### Step 3: Create a Single-Module Employee 
**Scenario**: This user will ONLY access RecruitBee (for testing single-module  workflows). 
1. Click **+ Add New User** 
2. Fill in the form: 
| Field | Value | Why | 
|-------|-------|-----| 
| **First Name** | QA | Easy to identify test users | 
| **Last Name** | SingleModule | Describes their role | 
| **Email** | `qa.single@stage.com` | Unique staging email | 
| **Role** | Employee | Not an admin | 
| **Assigned Organizations** | Comfort Keepers Florence | Single location only | | **Module Access** |  RecruitBee ONLY | Uncheck ReceptionBee, RetentionBee  | 
3. Click **Save** 
4. **Important**: Copy the invite link sent to email (or check staging email inbox) 
**Expected Result**: 
-  User appears in team list 
- Invite email sent (check staging inbox) 
- User has RecruitBee tile ONLY (not multiple modules) 
--- 
#### Step 4: Create a Multi-Module Employee 
**Scenario**: This user will access BOTH RecruitBee and ReceptionBee (for  testing module switching). 
1. Click **+ Add New User** again 
2. Fill in the form: 
| Field | Value | 
|-------|-------| 
| **First Name** | QA | 
| **Last Name** | MultiModule | 
| **Email** | `qa.multi@stage.com` | 
| **Role** | Employee | 
| **Assigned Organizations** | Carbon Technology Staging |
| **Module Access** |  RecruitBee +  ReceptionBee | 
3. Click **Save** 
**Expected Result**: 
-  User appears in team list 
- Login will show module selector (2 tiles) 
--- 
#### Step 5: Create an Admin/Franchisee User 
**Scenario**: This user will manage multiple locations (for testing admin features). 
1. Click **+ Add New User** 
2. Fill in the form: 
| Field | Value | 
|-------|-------| 
| **First Name** | QA | 
| **Last Name** | Admin | 
| **Email** | `qa.admin@stage.com` | 
| **Role** | Admin (or Franchisee Admin) | 
| **Assigned Organizations** | Hoodz Phoenix + Hoodz Tucson | | **Module Access** |  All modules | 
| **Permissions** | Can manage users, settings, cross-location access | 3. Click **Save** 
**Expected Result**: 
-  User can see multiple locations in organization dropdown - Can access admin-only features (user management, settings) 
--- 
#### Step 6: Connect Test User Calendars (CRITICAL!) 
**Why?** Live interview booking requires users to have Google Calendar or  Microsoft Outlook connected. 
**For EACH test user you created**: 
1. **Logout** from admin account 
2. **Login** as test user (e.g., `qa.single@stage.com`)
3. Navigate to **Settings → Calendar** 
4. Click **Connect Google Calendar** 
5. **OAuth Flow**: 
 - Use your PERSONAL Google account (not production!) 
 - Grant calendar access permissions 
 - You'll be redirected back to RecruitBee 
6. **Verify**: 
 - Status shows **"Connected"** (green badge) 
 - Calendar email displays your Gmail address 
 - Token expiration shows a future date 
**Repeat for**: 
- `qa.single@stage.com`  
- `qa.multi@stage.com`  
- `qa.admin@stage.com`  
**Visual Checkpoint**: 
``` 
Settings > Calendar 
┌────────────────────────────────────┐ │ Calendar Integration │ 
│ Status: Connected  │ ← Must show "Connected" │ Email: your-gmail@gmail.com │ 
│ Expires: Dec 25, 2025 3:00 PM │ ← Future date 
│ Provider: Google Calendar │ 
└────────────────────────────────────┘ ``` 
--- 
### Step 7: Set a Default Recruiter (Optional but Recommended) 
**What is a Default Recruiter?** 
When a candidate books a live interview, the system needs to know which  recruiter's calendar to use. The default recruiter is the "fallback" calendar. 
**To Set Default Recruiter**: 
1. Login as admin (`carbon@stage.com`) 
2. Navigate to ReceptionBee → Settings → Team 
3. Find `qa.single@stage.com` user 
4. Click **Edit** 
5. Find **"Default Recruiter for Organizations"** section 
6. Check the box for **Comfort Keepers Florence**
7. Click **Save** 
**Expected Result**: 
-  User is now the default recruiter for CK Florence 
- When candidates book interviews, they'll use this user's calendar (if no one  else is assigned) 
**Visual Checkpoint**: 
``` 
Edit User: qa.single@stage.com 
┌────────────────────────────────────── ┐ 
│ Default Recruiter for Organizations │ 
│ ☑ Comfort Keepers Florence │ ← Check this 
│ ☐ Hoodz Phoenix │ 
│ ☐ Hoodz Tucson │ 
└────────────────────────────────────── ┘ 
``` 
--- 
## Test User Setup 
### Your Test User Roster 
After completing the WrkrBee Admin tutorial, you should have: 
| Email | Role | Organizations | Modules | Calendar | Use For | 
|-------|------|--------------|---------|----------|---------| 
| `qa.single@stage.com` | Employee | CK Florence (1) | RecruitBee only |  Connected | Single-module workflows | 
| `qa.multi@stage.com` | Employee | Carbon Tech (1) | RecruitBee + ReceptionBee  |  Connected | Multi-module testing | 
| `qa.admin@stage.com` | Admin | Hoodz Phoenix + Tucson (2) | All modules |  Connected | Admin features, multi-location | 
**Verification Checklist**: 
- [ ] All 3 users created in WrkrBee Admin 
- [ ] All 3 users have calendars connected 
- [ ] `qa.single@stage.com` set as default recruiter for CK Florence - [ ] Invite emails received (or invite links copied) 
- [ ] Test login for each user succeeds
--- 
### Create Test Applications (Your Test Data) 
**Why?** You need candidate applications to test the recruiting workflow. #### Option 1: Use Existing Test Data 
Staging already has ~192 test applications. You can use these for quick testing. 
**To Find Them**: 
1. Login as `qa.single@stage.com` 
2. Navigate to **Applications → New Applications** 
3. You'll see existing test candidates 
#### Option 2: Create Your Own Test Application 
**For full control over test data**, create a fresh application: 
1. **Get a Job Posting Link**: 
 - Login as `qa.single@stage.com` 
 - Navigate to **Jobs → Job Postings** 
 - Click any active job 
 - Copy the **Public Job Link** (e.g., `https://recruit.wrkrbee.ai/jobs/caregiver phoenix`) 
2. **Open Incognito Window**: 
 - Mac: `Cmd + Shift + N` 
 - Windows: `Ctrl + Shift + N` 
3. **Apply as a Candidate**: 
 - Paste the job link 
 - Fill out the application form: 
 - **First Name**: Test 
 - **Last Name**: Candidate 
 - **Email**: `testcandidate1@stage.com` (use YOUR email for SMS testing!)  - **Phone**: Your personal phone number (for SMS testing)  - **Location**: Select location 
 - Submit application 
4. **Verify Application Created**: 
 - Go back to RecruitBee (logged in as recruiter) 
 - Navigate to **Applications → New Applications**
 - You should see "Test Candidate" in the list 
**Repeat this 2-3 times** to create multiple test applications for different  scenarios. 
--- 
## Testing Workflows 
Now that you have test users and test data, let's start testing! --- 
## Test Scenario 1: SINGLE-MODULE EMPLOYEE 
**User**: `qa.single@stage.com` 
**Expected Behavior**: After login, lands directly on RecruitBee (NO module  selector) 
--- 
### Test 1.1: Login Flow 
**What We're Testing**: Single-module users skip the module selector. 
**Steps**: 
1. **Logout** if logged in (click your avatar → Logout) 
2. Navigate to `https://app.wrkrbee.ai/login` 
3. Enter credentials: 
 - Email: `qa.single@stage.com` 
 - Password: [staging password] 
4. Click **Login** 
5. **Observe where you land** 
**Expected Results** : 
-  Redirects to `https://recruit.wrkrbee.ai/admin` (RecruitBee dashboard) - NO module selector shown (goes straight to RecruitBee) - Header shows "RecruitBee" logo 
- User avatar in top-right shows `qa.single@stage.com` - Browser console has ZERO red errors 
**Visual Checkpoint**: 
``` 
After Login:
┌────────────────────────────────────┐ │ RecruitBee  Comfort Keepers │ ← Header shows org name │ qa.single@... │ ← Your user avatar 
├────────────────────────────────────┤ │ Dashboard │ 
│ [Statistics cards] │ 
│ [Recent applications] │ 
└────────────────────────────────────┘ ``` 
**Failure Scenarios** : 
-  Shows module selector → **BUG** (single-module user should skip selector) - Redirects to `app.wrkrbee.ai` → **BUG** (auth failure) 
- Console shows red error: "Module not found" → **CRITICAL BUG** (module  ID mismatch) 
**How to Check Console**: 
1. Open DevTools (F12) 
2. Click **Console** tab 
3. Look for red text (errors) 
4. **Screenshot any errors** for bug report 
--- 
### Test 1.2: Full Recruiting Workflow (CRITICAL PATH) 
**What We're Testing**: The complete journey from application → hire. 
**Time**: ~30 minutes 
**Priority**: CRITICAL (if this fails, recruiting stops!) 
--- 
#### Step 1: Review a New Application 
**Steps**: 
1. Navigate to **Applications → New Applications** 
2. Click on any application (or your "Test Candidate" from earlier) 3. Review the application detail page 
**Expected Results** : 
-  Application details load: 
 - Candidate name 
 - Email address
 - Phone number 
 - Location (e.g., "Phoenix, AZ") 
-  Resume displays (if uploaded) 
- Application questions show candidate's responses 
- Status shows "New" (or current status) 
- **ONLY shows candidates from YOUR organization** (multi-tenant check!) 
**Visual Checkpoint**: 
``` 
Application Detail Page: 
┌────────────────────────────────────── ┐ 
│ Test Candidate │ 
│ testcandidate1@stage.com │ 
│ (555) 123-4567 │ 
│ Status: [New ▼] ← Dropdown │ 
├────────────────────────────────────── ┤ 
│ Resume: [PDF preview] │ 
│ Application Questions: │ 
│ Q: Why do you want this job? │ 
│ A: [Candidate's response] │ 
└────────────────────────────────────── ┘ 
``` 
**Multi-Tenant Security Check** (IMPORTANT!): 
1. Open **Browser Console** (F12) 
2. Find the application ID in the URL: 
 - URL: `https://recruit.wrkrbee.ai/admin/applications/abc-123-xyz`  - Application ID: `abc-123-xyz` 
3. Run this query in **Supabase SQL Editor** (ask dev team for access): 
```sql 
SELECT organization_id, first_name, last_name 
FROM applications 
WHERE id = 'abc-123-xyz'; -- Replace with actual ID 
``` 
4. **Verify**: `organization_id` matches CK Florence's organization ID **Why This Matters**: If you can see applications from OTHER organizations, it's a 
**CRITICAL SECURITY BUG**! 
--- 
#### Step 2: Move Candidate to Pre-Interview 
**Steps**: 
1. From the application detail page, find the **Status dropdown** 2. Click the dropdown (currently shows "New") 
3. Select **"Pre-Interview"** 
4. Confirm the change (if prompted) 
**Expected Results** : 
-  Status changes to "Pre-Interview" (dropdown updates) - Success toast notification appears (green popup) 
- **SMS sent to candidate** with pre-interview scheduling link - Activity log shows the status change with YOUR user_id - No console errors (check DevTools) 
**Visual Checkpoint**: 
``` 
Status Dropdown: 
┌────────────────────┐ 
│ Status: [Pre-Inter▼│ ← Changed from "New" 
└────────────────────┘ 
Toast Notification (top-right): 
┌────────────────────────────────┐ │ Status updated successfully │ ← Green popup 
└────────────────────────────────┘ ``` 
**SMS Verification** (If using your phone): 
-  SMS received within 30 seconds 
- SMS shows correct company name: **"Comfort Keepers"** (NOT "CK  Florence" or "Organization_...") 
-  SMS includes scheduling link: `https://recruit.wrkrbee.ai/schedule/pre interview/[id]` 
**To Test SMS Template**: 
1. Navigate to **Settings → SMS Templates** 
2. Find "Pre-Interview" template 
3. Verify `{{company_name}}` variable shows "Comfort Keepers" (corporate  brand)
--- 
#### Step 3: Act as the Candidate - Book Pre-Interview 
**Role Switch**: You are now the CANDIDATE (not the recruiter). 
**Steps**: 
1. **Open Incognito Window** (Cmd+Shift+N or Ctrl+Shift+N) 
2. Paste the scheduling link from SMS (or manually navigate to it) 3. **Booking Page**: 
 - Select an available date (weekdays only) 
 - Choose a time slot 
 - Confirm your phone number 
4. Click **"Book Interview"** 
**Expected Results** : 
-  Booking page loads (no login required - it's a public route!) - Calendar shows available dates: 
 - Weekdays only (Mon-Fri) 
 - Grayed out weekends 
- Time slots load from recruiter's Google Calendar 
 - Shows actual available times (e.g., 9:00 AM, 10:00 AM, 2:00 PM)  - If no slots → Check calendar routing (see troubleshooting) 
-  Company name shows **"Comfort Keepers"** (corporate brand) - Phone confirmation step works 
- Success page shows confirmation message 
- **Calendar event created** on recruiter's Google Calendar 
**Visual Checkpoint**: 
``` 
Booking Page (Candidate View): 
┌────────────────────────────────────── ┐ 
│ Schedule Your Pre-Interview │ 
│ Comfort Keepers │ ← Corporate brand name 
├────────────────────────────────────── ┤ 
│ Select a Date: │ 
│ [Calendar widget - weekdays enabled] │ 
│ │ 
│ Available Times: │ 
│ ○ 9:00 AM ○ 10:00 AM ○ 2:00 PM │ ← From Google Calendar │ │
│ [Continue →] │ 
└────────────────────────────────────── ┘ 
``` 
**Verify Calendar Event Created**: 
1. Open YOUR Google Calendar (the one you connected for  
`qa.single@stage.com`) 
2. Navigate to the date you selected 
3. **You should see**: 
 -  Event title: "Pre-Interview: Test Candidate" 
 - Time matches what you booked 
 - Event description includes candidate details 
**Failure Scenarios** : 
-  "No available times" → **BUG**: Calendar routing failed OR calendar tokens  expired 
-  Wrong company name (shows "CK Florence" or "Organization") → **BUG**:  Corporate brand utility not working 
-  Calendar error → **BUG**: Check `integrations` table for active calendar **Troubleshooting "No Available Times"**: 
1. Check if calendar is connected: 
 - Login as `qa.single@stage.com` 
 - Go to Settings → Calendar 
 - Verify status: "Connected"  
2. Check calendar tokens (ask dev for Supabase access): 
```sql 
SELECT user_id, service_username, expires_at, is_active 
FROM integrations 
WHERE integration_type IN ('google_calendar', 'microsoft_graph')  AND is_active = true; 
``` 
3. Verify `expires_at` is in the future (not expired) 
--- 
#### Step 4: Voice Interview Simulation (Optional - Requires n8n) 
**Note**: This step requires n8n workflow to be active. If not available, skip to  Step 5.
**What Happens Automatically**: 
1. At the scheduled pre-interview time, **Retell.ai** calls the candidate 2. Candidate answers pre-recorded voice questions (AI interviewer) 3. Retell transcribes responses → n8n → Supabase database 
**Expected Results** (Check in RecruitBee after interview): -  Application status auto-updates to "Interviewed" - Voice transcript appears in application detail 
- Interview completion timestamp recorded 
**Manual Alternative** (if voice system unavailable): 
1. Login as recruiter 
2. Open application 
3. Manually change status to "Interviewed" 
4. Add notes: "Voice interview completed (manual simulation)" --- 
#### Step 5: Move Candidate to Live Interview 
**Steps**: 
1. Review the voice interview transcript (or skip if manual) 2. Decide the candidate qualifies for a live interview 
3. Click **Status dropdown** 
4. Select **"Live Interview"** 
5. Confirm 
**Expected Results** : 
-  Status changes to "Live Interview" 
- **SMS sent to candidate** with live interview scheduling link - Activity log updated 
- No backwards move confirmation (moving forward doesn't warn) 
**Visual Checkpoint**: 
``` 
Status Dropdown: 
┌───────────────────┐ 
│ Status: [Live Int▼│ ← Changed from "Pre-Interview" 
└───────────────────┘ 
``` 
---
#### Step 6: Act as Candidate - Book Live Interview (CRITICAL!) 
**This is the MOST CRITICAL test** - Live interview booking failures are the #1  production issue! 
**Role Switch**: You are the CANDIDATE again. 
**Steps**: 
1. **Open Incognito Window** 
2. Paste the live interview scheduling link from SMS 
3. **3-Step Wizard**: 
 - **Step 1: Select Date** - Choose available weekday 
 - **Step 2: Choose Time** - Select from recruiter's calendar slots  - **Step 3: Confirm Details** - Verify phone and interview location 4. Click **"Book Interview"** 
**Expected Results** : 
**Booking Page**: 
-  3-step wizard displays correctly (progress bar shows Step 1 → 2 → 3) -  **Step 1**: Weekdays only enabled (Mon-Fri) 
- **Step 2**: Time slots load from recruiter's real Google Calendar - **Step 3**: Interview location shows **FULL ADDRESS**: 
 - Example: **"123 Main St, Suite 100, Florence, AZ, 85132"** 
 - Should match `location_settings` for this candidate's location -  Success page confirms booking 
**Visual Checkpoint (Step 3)**: 
``` 
Step 3: Confirm Details 
┌────────────────────────────────────── ┐ 
│ Interview Location: │ 
│ 123 Main St, Suite 100 │ ← Full address 
│ Florence, AZ, 85132 │ ← City, State, ZIP 
│ │ 
│ Phone: (555) 123-4567 │ 
│ Date: Monday, Dec 23, 2025 │ 
│ Time: 2:00 PM │ 
│ │ 
│ [← Back] [Book Interview →] │ 
└────────────────────────────────────── ┘
``` 
**Verify Google Calendar Event** (CRITICAL): 
1. Open YOUR Google Calendar (recruiter's calendar) 
2. Find the event for the booked date/time 
3. **Check Event Details**: 
 -  Event title: **"Interview: Test Candidate - [Job Title]"** 
 - Location field shows **FULL ADDRESS** (clickable → Google Maps)  - Description includes: 
 - Candidate name 
 - Position 
 - Phone number 
 - Interview location 
 - "This is an in-person interview" 
 -  **NO Google Meet link** (disabled for in-person interviews)  - Attendees include candidate's email 
 - Reminders: 
 - Email reminder (1 day before) 
 - Popup reminder (30 min before) 
**Visual Checkpoint (Google Calendar Event)**: 
``` 
Google Calendar Event: 
┌────────────────────────────────────── ┐ 
│ Interview: Test Candidate - Caregiver│ ← Title 
│ │ 
│ When: Mon, Dec 23, 2:00 PM - 3:00 PM│ 
│ │ 
│ Where: 123 Main St, Suite 100, │ ← Full address (clickable) │ Florence, AZ, 85132 │ 
│ │ 
│ Description: │ 
│ Candidate: Test Candidate │ 
│ Position: Caregiver │ 
│ Phone: (555) 123-4567 │ 
│ This is an in-person interview │ ← Confirms no video link 
│ │ 
│ Guests: testcandidate1@stage.com │ ← Candidate added 
│ │ 
│ Reminders: │ 
│ - Email (1 day before) │ 
│ - Popup (30 min before) │
└────────────────────────────────────── ┘ 
``` 
**Failure Scenarios** : 
-  "No available times" → **CRITICAL BUG**: Calendar routing wrong OR tokens  expired 
-  "Address not configured" → **BUG**: Location settings missing - Wrong address shown → **BUG**: Using wrong location lookup (org instead  of location_id) 
-  Google Meet link appears → **BUG**: Event creation passing wrong  parameters 
**Troubleshooting Calendar Routing**: 
Calendar routing uses a **3-tier priority system**: 
1. **Priority 1: Claimed User** - If application is "claimed" by a specific user → Use  their calendar 
2. **Priority 2: Default Recruiter** - If no claimed user → Use default recruiter's  calendar 
3. **Priority 3: Organization-Based** - If no default recruiter → Use first available  calendar 
**To Check Which Calendar Was Used**: 
Open **Browser Network Tab** during booking: 
1. F12 → Network tab 
2. Filter: `book-interview` 
3. Click on the request 
4. Check **Response** JSON: 
```json 
{ 
 "userId": "abc-123", 
 "priority": "default_recruiter", ← Which tier was used 
 "reason": "Default recruiter for organization", 
 "calendarEmail": "qa.single@stage.com" 
} 
``` 
**If Priority is Wrong**: 
Run this SQL query to debug:
```sql 
-- Check calendar routing for this application 
SELECT 
 a.id as application_id, 
 a.claimed_by_user_id, -- Priority 1 
 a.organization_id, 
 -- Check if default recruiter exists (Priority 2) 
 (SELECT user_id FROM module_user_settings 
 WHERE organization_id = a.organization_id 
 AND module_id = 'recruitbee' 
 AND settings->'default_recruiter_for_orgs' ? a.organization_id::text  LIMIT 1) as default_recruiter_user_id, 
 -- Check org calendars (Priority 3) 
 (SELECT jsonb_agg(jsonb_build_object('user_id', user_id, 'email',  service_username)) 
 FROM integrations 
 WHERE organization_id = a.organization_id 
 AND integration_type IN ('google_calendar', 'microsoft_graph')  AND is_active = true) as available_calendars 
FROM applications a 
WHERE a.id = 'abc-123'; -- Replace with actual ID 
``` 
--- 
### Test 1.3: Multi-Tenant Security Check (CRITICAL!) 
**What We're Testing**: Users can ONLY see data from their own organization. 
**Steps**: 
1. Login as `qa.single@stage.com` (CK Florence user) 
2. Navigate to **Applications** list 
3. **Count how many applications you see** (write this down) 4. Open **Browser Console** (F12) 
5. Try to access another org's application: 
```javascript 
// Get an application ID from Hoodz (different org) 
// Ask dev team for a Hoodz application ID, or: 
// Run this SQL: SELECT id FROM applications WHERE organization_id = '[hoodz org-id]' LIMIT 1;
// Try to fetch it via API: 
fetch('https://recruit.wrkrbee.ai/api/recruitment/applications/[hoodz-app-id]', {  credentials: 'include' 
}).then(r => r.json()).then(console.log) 
``` 
**Expected Results** : 
-  API returns **403 Forbidden** OR **404 Not Found** 
- Console shows error (not application data!) 
- Applications list shows ONLY CK Florence candidates 
- Cannot view/edit/delete applications from other organizations 
**Failure Scenario** : 
-  Console shows application data from Hoodz → **CRITICAL SECURITY BUG**! -  Applications list shows candidates from multiple orgs → **CRITICAL  SECURITY BUG**! 
**If This Fails**: STOP TESTING and immediately report to dev team. This is a data  leak vulnerability! 
--- 
## Test Scenario 2: MULTI-MODULE EMPLOYEE 
**User**: `qa.multi@stage.com` 
**Expected Behavior**: Sees module selector after login, can switch between  modules 
--- 
### Test 2.1: Login Flow - Module Selector 
**What We're Testing**: Multi-module users see the module selector. 
**Steps**: 
1. **Logout** if logged in 
2. Navigate to `https://app.wrkrbee.ai/login` 
3. Login as `qa.multi@stage.com` 
4. **Observe landing page** 
**Expected Results** : 
-  Redirects to `https://app.wrkrbee.ai/select-module` 
- Module selector shows tiles for:
 - RecruitBee (if has access) 
 - ReceptionBee (if has access) 
-  Each tile shows module icon + description 
- Clicking **RecruitBee** → Redirects to `https://recruit.wrkrbee.ai/admin` 
**Visual Checkpoint**: 
``` 
Module Selector: 
┌────────────────────────────────────┐ │ Select a Module │ 
│ │ 
│ ┌──────────┐ ┌──────────┐ │ 
│ │ │ │ │ │ 
│ │ Reception│ │ Recruit │ │ ← Click to enter 
│ │ Bee │ │ Bee │ │ 
│ │ │ │ │ │ 
│ │ Manage │ │ Hiring │ │ 
│ │ calls │ │ workflow │ │ 
│ └──────────┘ └──────────┘ │ 
└────────────────────────────────────┘ ``` 
**Failure Scenarios** : 
-  Skips module selector, goes directly to one module → **BUG**: Module  access check broken 
-  Module tile missing → **BUG**: Permissions not set correctly - Console error: "Module ID 'recruit' not found" → **CRITICAL BUG**: Using  short form instead of 'recruitbee' 
--- 
### Test 2.2: Cross-Module Navigation 
**What We're Testing**: Switching between modules preserves session (no re login). 
**Steps**: 
1. Login as `qa.multi@stage.com` 
2. Select **RecruitBee** → Access dashboard 
3. **Switch Modules**: 
 - Option A: Navigate to main menu → Click "Switch Module"  - Option B: Go directly to `https://app.wrkrbee.ai` 
4. Select **ReceptionBee** → Access dashboard 
5. Switch back to **RecruitBee**
**Expected Results** : 
-  Session persists (no re-login required!) 
- Each module shows correct data for active organization - Navigation between modules takes **< 2 seconds** 
- No console errors during switch 
- Cookie `wrkrbee-auth` remains valid 
**To Verify Session Cookie**: 
1. F12 → **Application** tab (Chrome DevTools) 
2. Left sidebar: **Cookies** → `https://app.wrkrbee.ai` 
3. Find cookie: `wrkrbee-auth` 
4. **Check**: 
 -  Expires: Shows future date (~8 hours from login) 
 - HttpOnly: true 
 - Secure: true 
--- 
### Test 2.3: Repeat Recruiting Workflow 
**Steps**: Repeat **Test Scenario 1.2** (Full Recruiting Workflow) as  `qa.multi@stage.com`. 
**Additional Validation**: 
-  Can access recruiting workflow while having multiple modules - Calendar routing works (uses default recruiter if configured) - SMS/Email show correct corporate brand 
- Switching modules mid-workflow doesn't break state --- 
## Test Scenario 3: ADMIN/FRANCHISEE USER 
**User**: `qa.admin@stage.com` 
**Organizations**: Hoodz Phoenix + Hoodz Tucson (multi-location) **Expected Behavior**: Can manage users, settings, cross-location features 
--- 
### Test 3.1: Organization Switching 
**What We're Testing**: Multi-location admins can switch between locations.
**Steps**: 
1. Login as `qa.admin@stage.com` 
2. Select RecruitBee module 
3. **Top-right header** shows current organization (e.g., "Hoodz Phoenix") 4. Click **organization dropdown** 
5. Select **"Hoodz Tucson"** 
**Expected Results** : 
-  Dropdown shows all managed locations (Phoenix, Tucson) - Switching updates active organization immediately 
- **Applications list refreshes** with Tucson's data 
- Job postings refresh with Tucson's jobs 
- Settings tabs load Tucson's settings 
- No data leak (cannot see Phoenix candidates when viewing Tucson) 
**Visual Checkpoint**: 
``` 
Header: 
┌────────────────────────────────────┐ │ RecruitBee [Hoodz Phoenix ▼] │ ← Click dropdown 
│ qa.admin@...  │ 
└────────────────────────────────────┘ 
Dropdown Opens: 
┌────────────────────┐ 
│ ☑ Hoodz Phoenix │ ← Currently selected 
│ ○ Hoodz Tucson │ ← Click to switch 
└────────────────────┘ 
``` 
**After Switching to Tucson**: 
-  Header shows "Hoodz Tucson" 
- Applications list shows ONLY Tucson candidates 
- Job postings show ONLY Tucson jobs 
**Multi-Tenant Check** (Run in SQL Editor): 
```sql 
-- After switching to Tucson 
SELECT organization_id, COUNT(*) 
FROM applications 
WHERE organization_id = '[tucson-org-id]' 
GROUP BY organization_id;
-- Should show ONLY Tucson applications 
``` 
--- 
### Test 3.2: User Management (Admin Features) 
**What We're Testing**: Admins can add/edit/delete users. **Note**: User management is primarily in **ReceptionBee Admin Panel**. 
**Steps**: 
1. Login as `qa.admin@stage.com` 
2. Go to **ReceptionBee** module 
3. Navigate to **Settings → Team** 
4. Click **+ Add New User** 
**Add User Test**: 
1. Fill in form: 
 - First Name: Test 
 - Last Name: Employee 
 - Email: `test.employee@stage.com` 
 - Role: Employee 
 - Assigned Organizations: Hoodz Phoenix 
 - Module Access: RecruitBee 
2. Click **Save** 
**Expected Results** : 
-  User appears in team list 
- Invite email sent (check staging inbox) 
- User can login with invite link 
**Edit User Test**: 
1. Find the user you just created 
2. Click **Edit** 
3. Change role to "Admin" 
4. Click **Save** 
**Expected Results** : 
-  Changes save immediately 
- User's role updates in team list 
**Deactivate User Test**:
1. Find the user 
2. Click **Edit** 
3. Toggle **Active** to OFF 
4. Click **Save** 
5. Try to login as that user 
**Expected Results** : 
-  User marked inactive in team list 
- Login fails with error: "Account deactivated" 
--- 
### Test 3.3: Settings Management 
**What We're Testing**: Settings persist after save. 
--- 
#### Settings → SMS Templates 
**Steps**: 
1. Navigate to **Settings → SMS Templates** 
2. Find **"Pre-Interview"** template 
3. Edit the template: 
 - Add text: "Looking forward to meeting you!" 
 - Use variables: `{{company_name}}`, `{{candidate_name}}` 4. Click **Save** 
5. Click **"Send Test SMS"** 
6. Enter your phone number 
7. Check your phone 
**Expected Results** : 
-  Template saves successfully 
- Test SMS received 
- Variables replaced correctly: 
 - `{{company_name}}` → "Hoodz" (or "Hoodz of Greater Phoenix")  - `{{candidate_name}}` → "Test" (or your test candidate name) -  Custom text appears in SMS 
**Important**: Company name should show **corporate brand** ("Hoodz"), NOT  location name ("Hoodz of Greater Phoenix"). 
---
#### Settings → Location Settings (Multi-Location) 
**What We're Testing**: Multi-location orgs show dropdown, single-location orgs  don't. 
**Test A: Multi-Location Org (Hoodz)** 
**Steps**: 
1. Login as `qa.admin@stage.com` 
2. Navigate to **Settings → Location Settings** 
**Expected Results** : 
-  **Dropdown appears** with all locations: 
 - "Hoodz of Greater Phoenix" 
 - "Hoodz of Tucson" 
- Select location → Form loads with that location's settings - Edit address fields (e.g., change street address) 
- Click **Save** 
- Switch locations → Form updates with new location's data - Previous changes persist (refresh page to verify) 
**Visual Checkpoint**: 
``` 
Location Settings: 
┌────────────────────────────────────┐ │ Select Location: │ 
│ [Hoodz of Greater Phoenix ▼] │ ← Dropdown shown 
├────────────────────────────────────┤ │ Interview Address: │ 
│ Street: [1220 W Alameda Dr] │ 
│ Suite: [Suite 105] │ 
│ City: [Tempe] │ 
│ State: [AZ] │ 
│ ZIP: [85282] │ 
│ │ 
│ [Save] │ 
└────────────────────────────────────┘ ``` 
**Test B: Single-Location Org (CK Florence)** 
**Steps**: 
1. Logout
2. Login as `qa.single@stage.com` (CK Florence - single location) 3. Navigate to **Settings → Location Settings** 
**Expected Results** : 
-  **NO dropdown shown** 
- Form loads immediately with organization's single location - Edit address → Saves directly 
**Visual Checkpoint**: 
``` 
Location Settings (Single-Location): 
┌────────────────────────────────────┐ │ Interview Address: │ ← No dropdown! 
│ Street: [123 Main St] │ 
│ Suite: [Suite 100] │ 
│ City: [Florence] │ 
│ State: [AZ] │ 
│ ZIP: [85132] │ 
│ │ 
│ [Save] │ 
└────────────────────────────────────┘ ``` 
--- 
### Test 3.4: Job Posting Duplication & Multi-Location 
**What We're Testing**: Duplicate a job and assign to different location. **Priority**: HIGH (tests multi-location workflows) 
--- 
#### Step 1: Duplicate Job Within Same Location 
**Steps**: 
1. Login as `qa.admin@stage.com` 
2. Navigate to **Jobs → Job Postings** 
3. Select any active job posting (e.g., "Caregiver - Phoenix") 4. Click **"Duplicate"** button (3-dot menu or action button) 5. Wait for success message 
**Expected Results** : 
-  Success toast: **"Job posting and X application questions duplicated 
successfully"** 
-  Redirects to edit page of duplicated job 
- Job title shows: **"Caregiver - Phoenix (Copy)"** 
- Slug auto-generated: `caregiver-phoenix-copy` (or `-copy-2` if already  exists) 
- All fields copied: 
 - Job description 
 - Requirements 
 - Voice interview questions 
 - Application questions 
-  Same organization as original (Phoenix) 
- Status: **Draft** (not published) 
**Visual Checkpoint**: 
``` 
Edit Job Posting: 
┌────────────────────────────────────┐ │ Job Title: Caregiver - Phoenix (Copy)│ ← "(Copy)" added 
│ Slug: caregiver-phoenix-copy │ ← Auto-generated 
│ Status: [Draft ▼] │ ← Not published 
│ │ 
│ Job Description: │ 
│ [Same as original] │ 
│ │ 
│ Application Questions: 5 │ ← Copied from original 
└────────────────────────────────────┘ ``` 
**Failure Scenario** : 
-  Warning toast (red): **"Job posting created successfully, but application  questions failed to duplicate: [ERROR]"** 
 - This means `job_questions` INSERT failed 
 - Check console for full error details 
 - **Workaround**: Manually add questions in job edit page 
--- 
#### Step 2: Change Job Location (Multi-Location Only) 
**Setup**: Use the duplicated job from Step 1. 
**Steps**: 
1. On the job edit page, find **"Organization"** or **"Location"** dropdown 2. Change from **"Hoodz of Greater Phoenix"** → **"Hoodz of Tucson"**
3. Click **Save** 
**Expected Results** : 
-  Organization dropdown shows all franchise locations (Phoenix, Tucson) - **If job has 0 applicants** → Dropdown is editable  
-  **If job has 1+ applicants** → Dropdown is LOCKED (shows badge: "Cannot  change - X applicants") 
-  Save succeeds 
- Job now appears in **Tucson's job list** (not Phoenix) 
- Application questions migrated to new organization_id 
**Critical Migration Check** (Run in SQL Editor): 
```sql 
-- Verify job AND questions migrated together 
SELECT 
 jp.id as job_id, 
 jp.title, 
 jp.organization_id as job_org_id, 
 jq.id as question_id, 
 jq.question_text, 
 jq.organization_id as question_org_id 
FROM job_postings jp 
LEFT JOIN job_questions jq ON jq.job_posting_id = jp.id 
WHERE jp.id = 'abc-123'; -- Replace with duplicated job ID 
-- CRITICAL: job_org_id MUST MATCH question_org_id 
-- If mismatch → Bug #3 (questions disappear after location change) ``` 
**Why This Matters**: If `job_org_id` doesn't match `question_org_id`,  application questions will disappear when candidates apply! 
--- 
#### Step 3: Delete Job Posting (Franchise-Wide Access) 
**What We're Testing**: Franchise admins can delete jobs from ANY franchise  location. 
**Steps**: 
1. Stay logged in as `qa.admin@stage.com` (Hoodz admin, home org: Phoenix) 2. Navigate to **Jobs → All Jobs** 
3. Filter by **Tucson** (or just scroll to find Tucson jobs) 
4. Try to delete the Tucson job you created in Step 2
**Expected Results** : 
-  Phoenix admin CAN see Tucson jobs (franchise-wide access) - Delete button available 
- **If job has 0 applicants** → Delete succeeds 
- **If job has 1+ applicants** → Delete blocked with error:  - **"Cannot delete job with X applications. Please archive instead."** -  Cascade deletes related records: 
 - `job_questions` (application questions) 
 - `job_intelligence` (AI-generated data) 
 - `landing_page_content` (job page content) 
**Failure Scenarios** : 
-  Delete button hangs/spins indefinitely → **BUG** (Bug #4, fixed Dec 20,  2025) 
-  403 Forbidden → **BUG**: Franchise access check broken --- 
## Visual Checkpoints 
### What to Look For During Testing 
**Good UI ( PASS)**: 
- Buttons have hover states (change color when you hover) 
- Loading states show spinners (not frozen) 
- Success messages appear as green toasts (top-right) 
- Forms have validation (red text for errors) 
- Tables load with data (not empty) 
- Dates formatted correctly (e.g., "Dec 23, 2025" not "2025-12-23T00:00:00Z") 
**Bad UI ( FAIL - Report as Bug)**: 
- Buttons don't respond to clicks 
- Page freezes (spinner spins forever) 
- Error messages are unclear (e.g., "Error: undefined") 
- Forms allow invalid data (e.g., negative phone numbers) 
- Tables show raw JSON objects 
- Dates show as timestamps 
--- 
### Browser Console Errors (How to Read Them) 
**Open Console**: F12 → Console tab
**Error Types**: 
| Color | Type | Severity | Action | 
|-------|------|----------|--------| 
|  Red | Error | HIGH | Screenshot and report | 
|  Yellow | Warning | LOW | Note but may be okay | 
|  Blue | Info | N/A | Ignore (informational) | 
**Example Error**: 
``` 
 Uncaught TypeError: Cannot read property 'id' of undefined  at ApplicationDetail.tsx:42 
``` 
**What This Means**: 
- Error type: `TypeError` 
- Problem: Trying to access `.id` on something that doesn't exist - File: `ApplicationDetail.tsx` 
- Line: 42 
**Your Action**: Screenshot this and include in bug report! --- 
### Network Tab (How to Check API Calls) 
**Open Network Tab**: F12 → Network tab 
**When to Check**: 
- After clicking "Save" buttons 
- After status changes 
- After loading pages 
**What to Look For**: 
| Status | Color | Meaning | Action | 
|--------|-------|---------|--------| 
| 200 | Green | Success |  PASS | 
| 201 | Green | Created |  PASS | 
| 400 | Red | Bad Request |  Report (form validation issue) | | 403 | Red | Forbidden |  Report (permission issue) | | 404 | Red | Not Found |  Report (broken link or deleted resource) | | 500 | Red | Server Error |  Report (backend bug) |
**Example Network Request**: 
``` 
POST /api/recruitment/applications/123/status 
Status: 200 OK 
Response: { "success": true, "status": "pre-interview" } ``` 
**This is GOOD**  - API call succeeded! 
**Example Failed Request**: 
``` 
POST /api/recruitment/applications/123/status 
Status: 500 Internal Server Error 
Response: { "error": "Database connection failed" } ``` 
**This is BAD**  - Screenshot and report! 
--- 
## Reporting Bugs 
### Bug Report Template 
When you find a bug, use this template: 
```markdown 
## Bug Report: [Short Description] 
**Test Case**: [Which test from this guide] 
**Severity**: CRITICAL / HIGH / MEDIUM / LOW **Found By**: [Your Name] 
**Date**: [Today's date] 
### Steps to Reproduce 
1. Login as qa.single@stage.com 
2. Navigate to Applications 
3. Click on application ID abc-123 
4. Click status dropdown 
5. Select "Pre-Interview" 
### Expected Result 
Status changes to "Pre-Interview" and SMS sent to candidate.
### Actual Result 
Status dropdown freezes. No SMS sent. Browser console shows error: "TypeError: Cannot read property 'id' of undefined" 
### Screenshots 
[Paste screenshot of error] 
### Console Errors 
``` 
 Uncaught TypeError: Cannot read property 'id' of undefined  at ApplicationDetail.tsx:42 
``` 
### Network Requests 
[Paste failed API response if applicable] 
### Additional Info 
- Browser: Chrome 120 
- OS: macOS 14 
- User: qa.single@stage.com 
- Organization: Comfort Keepers Florence 
``` 
--- 
### Severity Levels 
| Severity | When to Use | Examples | 
|----------|-------------|----------| 
| **CRITICAL** | Blocks all users, data leak, security vulnerability | Multi-tenant  data leak, authentication broken, production crash | 
| **HIGH** | Breaks major feature for some users | Live interview booking fails,  calendar routing wrong, SMS not sent | 
| **MEDIUM** | Feature partially works, workaround available | UI glitch, slow  performance, confusing error message | 
| **LOW** | Minor issue, doesn't block work | Typo in text, cosmetic UI issue, nice to-have feature | 
**If Unsure**: Mark as HIGH and let dev team re-prioritize. 
--- 
## QA Best Practices
### Before You Start Testing 
**Checklist**: 
- [ ] Browser DevTools open (F12) 
- [ ] Notepad ready for recording bugs 
- [ ] Phone nearby for SMS testing 
- [ ] Logged in as correct test user 
- [ ] Test data created (applications, jobs, etc.) 
--- 
### During Testing 
**Tips**: 
1. **Test one thing at a time** - Don't skip around 
2. **Check console after EVERY action** - Red errors = bugs 3. **Take screenshots immediately** - Don't wait until later 4. **Try to break things** - Click buttons twice, submit empty forms, etc. 5. **Test like a real user** - If it confuses you, it'll confuse users 
**Common Mistakes to Avoid**: 
-  Skipping console checks (you'll miss errors!) 
- Testing too fast (slow down, observe results) 
- Not recording bugs immediately (you'll forget details!) - Using production instead of staging (NEVER test in production!) 
--- 
### After Testing 
**Checklist**: 
- [ ] All test cases marked Pass/Fail in test results table - [ ] All bugs reported using bug template 
- [ ] Screenshots attached to bug reports 
- [ ] Test data cleaned up (or left for next test run) 
- [ ] Summary sent to team (e.g., "Completed QA run, found 3 bugs") --- 
## Test Execution Tracking 
### Test Results Template
Copy this table and fill it out as you test: 
| Test Case | Status | Notes | Severity | Assignee | 
|-----------|--------|-------|----------|----------| 
| 1.1 Single-Module Login |  Not Started | | | | 
| 1.2 Full Recruiting Workflow |  Not Started | | | | 
| 1.3 Multi-Tenant Security |  Not Started | | | | 
| 2.1 Multi-Module Login |  Not Started | | | | 
| 2.2 Cross-Module Navigation |  Not Started | | | | 
| 2.3 Recruiting Workflow (Multi) |  Not Started | | | | 
| 3.1 Organization Switching |  Not Started | | | | 
| 3.2 User Management |  Not Started | | | | 
| 3.3 Settings Management |  Not Started | | | | 
| 3.4 Job Duplication |  Not Started | | | | 
**Status Legend**: 
-  Not Started 
-  In Progress 
-  Pass 
-  Pass with Warnings 
-  Fail 
**Example Filled Out**: 
| Test Case | Status | Notes | Severity | Assignee | 
|-----------|--------|-------|----------|----------| 
| 1.1 Single-Module Login |  Pass | All checks passed | | | 
| 1.2 Full Recruiting Workflow |  Fail | SMS not sent at Step 2 | HIGH | Dev Team | | 1.3 Multi-Tenant Security |  Pass | | | | 
--- 
## Success Criteria 
**You're done testing when**: 
-  All test cases attempted (even if some fail) 
- All bugs documented with screenshots 
- Test results table filled out 
- Summary report sent to team 
**Don't aim for perfection!** Finding bugs is SUCCESS, not failure.  ---RecruitBee QA Testing GuideZero-to-Expert: Complete Testing Guide for First-Time QA Testers

Project: RecruitBee - Multi-Tenant Recruiting Platform
Audience: QA Testers (No Prior QA Experience Required!)
Test Environment: Staging (Safe Testing Environment)
Expected Time: First run: ~5-6 hours | Subsequent runs: ~3-4 hours
Maintenance: <1 hour/week-----What You'll Learn

By the end of this guide, you will be able to:
Set up your own test environment from scratch
Create test users with proper permissions
Test every feature in RecruitBee like a professional QA engineer
Find bugs BEFORE they reach production
Document bugs clearly for developers
Don't worry if you've never done QA testing before! This guide explains EVERYTHING step-by-step.-----Table of Contents
QA Testing 101 - What is QA?
Environment Setup - Your Testing Workspace
WrkrBee Admin Tutorial - Creating Test Users
Test User Setup - Building Your Test Team
Testing Workflows - Step-by-Step Test Cases
What to Look For - Visual Checkpoints
Reporting Bugs - How to Document Issues
QA Best Practices - Tips for Success
-----QA Testing 101What is QA Testing?

QA = Quality Assurance. Your job is to find bugs BEFORE real users experience them.

Think of yourself as a detective:
You test features to see if they work correctly
You look for bugs (things that don't work as expected)
You document what you find so developers can fix it
You verify the fixes work
Why Manual Testing Matters

Even with automated tests, human testing catches things computers miss:
Confusing user interfaces
Broken workflows that "technically work" but feel wrong
Error messages that don't make sense
Mobile responsive issues
Real-world edge cases
The Testing Mindset

Your goal: Break things on purpose (in staging!) so they DON'T break in production.

Ask yourself:
"What happens if I click this button twice?"
"What if I leave a required field empty?"
"What if I'm on a phone instead of a computer?"
"Can I see data I shouldn't have access to?"
Remember: Every bug you find is a SUCCESS!-----Environment SetupStep 1: Access Requirements

You Need:
Staging access: Login credentials (ask your team lead)
Browser: Chrome or Edge (recommended for testing)
Phone: Your personal phone for SMS testing
Calendar: Personal Google Calendar for integration testing
Notepad: For recording test results (or use this document)
URLs You'll Use:
URL
Purpose
[https://app.wrkrbee.ai](https://app.wrkrbee.ai)
Main login page
[https://recruit.wrkrbee.ai](https://recruit.wrkrbee.ai)
RecruitBee module
[https://reception.wrkrbee.ai](https://reception.wrkrbee.ai)
ReceptionBee module (admin panel)
[https://retain.wrkrbee.ai](https://retain.wrkrbee.ai)
RetentionBee module (if testing multi-module)

-----Step 2: Browser Setup

Open Chrome/Edge and set up your testing environment:2a. Open Developer Tools (IMPORTANT!)

These tools help you find bugs:
Open Chrome DevTools:
Mac: Cmd + Option + I
Windows: F12 or Ctrl + Shift + I
You should see:
Console tab (shows errors in red)
Network tab (shows API requests)
Application tab (shows cookies/storage)
Leave DevTools open during ALL testing!2b. What Each Tab Does (Beginner's Guide)
Tab
What It Shows
When To Use It
Console
JavaScript errors (red text)
After EVERY action - if you see red errors, it's a bug!
Network
API calls to the server
When testing saves, loads, or webhooks
Application
Cookies and session data
When testing login/logout

Visual Guide:
Chrome DevTools (bottom of browser):
┌─────────────────────────────────────┐
│ Elements │ Console │ Network │ ... │ ← Tabs
├─────────────────────────────────────┤
│ Error: Cannot read property... │ ← Red text = BUG!
│ Warning: Deprecated function... │ ← Yellow = Warning
│ Info: API call successful │ ← Blue = Info
└─────────────────────────────────────┘
-----Step 3: Test Credentials (Provided by Team)

You'll receive:
Email: [your-email]@stage.com
Password: [staging-password]
Admin access: carbon@stage.com (for creating test users)
Important: NEVER use real user credentials for testing!
-----WrkrBee Admin TutorialWhat is WrkrBee Admin?

WrkrBee Admin is the control panel for managing:
Users (employees, admins, franchisees)
Organizations (locations like "Phoenix Office")
Settings (calendars, SMS templates, etc.)
Permissions (who can access which modules)
Where to Find It: ReceptionBee module ([https://reception.wrkrbee.ai](https://reception.wrkrbee.ai))-----Tutorial: Creating Your First Test User

Why Create Test Users?
Instead of using existing users (which could affect real data), you'll create a clean set of test users with specific roles.-----Step 1: Login to WrkrBee Admin
Navigate to [https://app.wrkrbee.ai/login](https://app.wrkrbee.ai/login)
Login with admin credentials: carbon@stage.com
You'll see a Module Selector (tiles for each module)
Click ReceptionBee tile
What You Should See:
┌────────────────────────────────┐
│ Select a Module │
│ │
│ ┌──────┐ ┌──────┐ ┌──────┐ │
│ │ │ │ │ │ │ │
│ │ Recep│ │ Recru│ │ Retain│ │ ← Click ReceptionBee
│ │ tion │ │ it │ │ tion │ │
│ └──────┘ └──────┘ └──────┘ │
└────────────────────────────────┘
-----Step 2: Navigate to Team Management
In ReceptionBee, click Settings (gear icon, top-right)
Click Team tab (left sidebar)
You'll see a list of existing users
What You Should See:
Settings > Team
┌─────────────────────────────────────────┐
│ + Add New User [Button] │ ← Click this
├─────────────────────────────────────────┤
│ Name Email Role │
│ Alex Kilgo alex@... Admin │
│ Wes Dobias wes@... Employee │
└─────────────────────────────────────────┘
-----Step 3: Create a Single-Module Employee

Scenario: This user will ONLY access RecruitBee (for testing single-module workflows).
Click + Add New User
Fill in the form:
Field
Value
Why
First Name
QA
Easy to identify test users
Last Name
SingleModule
Describes their role
Email
qa.single@stage.com
Unique staging email
Role
Employee
Not an admin
Assigned Organizations
Comfort Keepers Florence
Single location only
Module Access
RecruitBee ONLY
Uncheck ReceptionBee, RetentionBee

Click Save
Important: Copy the invite link sent to email (or check staging email inbox)
Expected Result:
User appears in team list
Invite email sent (check staging inbox)
User has RecruitBee tile ONLY (not multiple modules)
-----Step 4: Create a Multi-Module Employee

Scenario: This user will access BOTH RecruitBee and ReceptionBee (for testing module switching).
Click + Add New User again
Fill in the form:
Field
Value
First Name
QA
Last Name
MultiModule
Email
qa.multi@stage.com
Role
Employee
Assigned Organizations
Carbon Technology Staging
Module Access
RecruitBee + ReceptionBee

Click Save
Expected Result:
User appears in team list
Login will show module selector (2 tiles)
-----Step 5: Create an Admin/Franchisee User

Scenario: This user will manage multiple locations (for testing admin features).
Click + Add New User
Fill in the form:
Field
Value
First Name
QA
Last Name
Admin
Email
qa.admin@stage.com
Role
Admin (or Franchisee Admin)
Assigned Organizations
Hoodz Phoenix + Hoodz Tucson
Module Access
All modules
Permissions
Can manage users, settings, cross-location access
3. Click Save



Expected Result:
User can see multiple locations in organization dropdown
Can access admin-only features (user management, settings)
-----Step 6: Connect Test User Calendars (CRITICAL!)

Why? Live interview booking requires users to have Google Calendar or Microsoft Outlook connected.

For EACH test user you created:
Logout from admin account
Login as test user (e.g., qa.single@stage.com)
Navigate to Settings → Calendar
Click Connect Google Calendar
OAuth Flow:
Use your PERSONAL Google account (not production!)
Grant calendar access permissions
You'll be redirected back to RecruitBee
Verify:
Status shows "Connected" (green badge)
Calendar email displays your Gmail address
Token expiration shows a future date
Repeat for:
qa.single@stage.com
qa.multi@stage.com
qa.admin@stage.com
Visual Checkpoint:
Settings > Calendar
┌────────────────────────────────────┐
│ Calendar Integration │
│ Status: Connected │ ← Must show "Connected"
│ Email: your-gmail@gmail.com │
│ Expires: Dec 25, 2025 3:00 PM │ ← Future date
│ Provider: Google Calendar │
└────────────────────────────────────┘
-----Step 7: Set a Default Recruiter (Optional but Recommended)

What is a Default Recruiter?
When a candidate books a live interview, the system needs to know which recruiter's calendar to use. The default recruiter is the "fallback" calendar.

To Set Default Recruiter:
Login as admin (carbon@stage.com)
Navigate to ReceptionBee → Settings → Team
Find qa.single@stage.com user
Click Edit
Find "Default Recruiter for Organizations" section
Check the box for Comfort Keepers Florence
Click Save
Expected Result:
User is now the default recruiter for CK Florence
When candidates book interviews, they'll use this user's calendar (if no one else is assigned)
Visual Checkpoint:
Edit User: qa.single@stage.com
┌────────────────────────────────────── ┐
│ Default Recruiter for Organizations │
│ ☑ Comfort Keepers Florence │ ← Check this
│ ☐ Hoodz Phoenix │
│ ☐ Hoodz Tucson │
└────────────────────────────────────── ┘
-----Test User SetupYour Test User Roster

After completing the WrkrBee Admin tutorial, you should have:
Email
Role
Organizations
Modules
Calendar
Use For
qa.single@stage.com
 Employee
CK Florence (1)
RecruitBee only
 Connected
Single-module workflows
qa.multi@stage.com
 Employee
Carbon Tech (1)
RecruitBee + ReceptionBee
 Connected
Multi-module testing
qa.admin@stage.com
 Admin
Hoodz Phoenix + Tucson (2)
All modules
 Connected
Admin features, multi-location

Verification Checklist:
All 3 users created in WrkrBee Admin
All 3 users have calendars connected
qa.single@stage.com set as default recruiter for CK Florence
Invite emails received (or invite links copied)
Test login for each user succeeds
-----Create Test Applications (Your Test Data)

Why? You need candidate applications to test the recruiting workflow.Option 1: Use Existing Test Data

Staging already has ~192 test applications. You can use these for quick testing.

To Find Them:
Login as qa.single@stage.com
Navigate to Applications → New Applications
You'll see existing test candidates
Option 2: Create Your Own Test Application

For full control over test data, create a fresh application:
Get a Job Posting Link:
Login as qa.single@stage.com
Navigate to Jobs → Job Postings
Click any active job
Copy the Public Job Link (e.g., [https://recruit.wrkrbee.ai/jobs/caregiver-phoenix](https://recruit.wrkrbee.ai/jobs/caregiver-phoenix))
Open Incognito Window:
Mac: Cmd + Shift + N
Windows: Ctrl + Shift + N
Apply as a Candidate:
Paste the job link
Fill out the application form:
First Name: Test
Last Name: Candidate
Email: testcandidate1@stage.com (use YOUR email for SMS testing!)
Phone: Your personal phone number (for SMS testing)
Location: Select location
Submit application
Verify Application Created:
Go back to RecruitBee (logged in as recruiter)
Navigate to Applications → New Applications
You should see "Test Candidate" in the list
Repeat this 2-3 times to create multiple test applications for different scenarios.-----Testing Workflows

Now that you have test users and test data, let's start testing!-----Test Scenario 1: SINGLE-MODULE EMPLOYEE

User: qa.single@stage.com
Expected Behavior: After login, lands directly on RecruitBee (NO module selector)-----Test 1.1: Login Flow

What We're Testing: Single-module users skip the module selector.

Steps:
Logout if logged in (click your avatar → Logout)
Navigate to [https://app.wrkrbee.ai/login](https://app.wrkrbee.ai/login)
Enter credentials:
Email: qa.single@stage.com
Password: [staging password]
Click Login
Observe where you land
Expected Results:
Redirects to [https://recruit.wrkrbee.ai/admin](https://recruit.wrkrbee.ai/admin) (RecruitBee dashboard)
NO module selector shown (goes straight to RecruitBee)
Header shows "RecruitBee" logo
User avatar in top-right shows qa.single@stage.com
Browser console has ZERO red errors
Visual Checkpoint:
After Login:
┌────────────────────────────────────┐
│ RecruitBee Comfort Keepers │ ← Header shows org name
│ qa.single@... │ ← Your user avatar
├────────────────────────────────────┤
│ Dashboard │
│ [Statistics cards] │
│ [Recent applications] │
└────────────────────────────────────┘
Failure Scenarios:
Shows module selector → BUG (single-module user should skip selector)
Redirects to app.wrkrbee.ai → BUG (auth failure)
Console shows red error: "Module not found" → CRITICAL BUG (module ID mismatch)
How to Check Console:
Open DevTools (F12)
Click Console tab
Look for red text (errors)
Screenshot any errors for bug report
-----Test 1.2: Full Recruiting Workflow (CRITICAL PATH)

What We're Testing: The complete journey from application → hire.

Time: ~30 minutes
Priority: CRITICAL (if this fails, recruiting stops!)-----Step 1: Review a New Application

Steps:
Navigate to Applications → New Applications
Click on any application (or your "Test Candidate" from earlier)
Review the application detail page
Expected Results:
Application details load:
Candidate name
Email address
Phone number
Location (e.g., "Phoenix, AZ")
Resume displays (if uploaded)
Application questions show candidate's responses
Status shows "New" (or current status)
ONLY shows candidates from YOUR organization (multi-tenant check!)
Visual Checkpoint:
Application Detail Page:
┌────────────────────────────────────── ┐
│ Test Candidate │
│ testcandidate1@stage.com │
│ (555) 123-4567 │
│ Status: [New ▼] ← Dropdown │
├────────────────────────────────────── ┤
│ Resume: [PDF preview] │
│ Application Questions: │
│ Q: Why do you want this job? │
│ A: [Candidate's response] │
└────────────────────────────────────── ┘
Multi-Tenant Security Check (IMPORTANT!):
Open Browser Console (F12)
Find the application ID in the URL:
URL: [https://recruit.wrkrbee.ai/admin/applications/abc-123-xyz](https://recruit.wrkrbee.ai/admin/applications/abc-123-xyz)
Application ID: abc-123-xyz
Run this query in Supabase SQL Editor (ask dev team for access):
SELECT organization_id, first_name, last_name
FROM applications
WHERE id = 'abc-123-xyz'; *-- Replace with actual ID*
Verify: organization_id matches CK Florence's organization ID
Why This Matters: If you can see applications from OTHER organizations, it's a CRITICAL SECURITY BUG!
-----Step 2: Move Candidate to Pre-Interview

Steps:
From the application detail page, find the Status dropdown
Click the dropdown (currently shows "New")
Select "Pre-Interview"
Confirm the change (if prompted)
Expected Results:
Status changes to "Pre-Interview" (dropdown updates)
Success toast notification appears (green popup)
SMS sent to candidate with pre-interview scheduling link
Activity log shows the status change with YOUR user_id
No console errors (check DevTools)
Visual Checkpoint:
Status Dropdown:
┌────────────────────┐
│ Status: [Pre-Inter▼│ ← Changed from "New"
└────────────────────┘
Toast Notification (top-right):
┌────────────────────────────────┐
│ Status updated successfully │ ← Green popup
└────────────────────────────────┘
SMS Verification (If using your phone):
SMS received within 30 seconds
SMS shows correct company name: "Comfort Keepers" (NOT "CK Florence" or "Organization_...")
SMS includes scheduling link: [https://recruit.wrkrbee.ai/schedule/pre-interview/](https://recruit.wrkrbee.ai/schedule/pre-interview/)[id]
To Test SMS Template:
Navigate to Settings → SMS Templates
Find "Pre-Interview" template
Verify {{company_name}} variable shows "Comfort Keepers" (corporate brand)
-----Step 3: Act as the Candidate - Book Pre-Interview

Role Switch: You are now the CANDIDATE (not the recruiter).

Steps:
Open Incognito Window (Cmd+Shift+N or Ctrl+Shift+N)
Paste the scheduling link from SMS (or manually navigate to it)
Booking Page:
Select an available date (weekdays only)
Choose a time slot
Confirm your phone number
Click "Book Interview"
Expected Results:
Booking page loads (no login required - it's a public route!)
Calendar shows available dates:
Weekdays only (Mon-Fri)
Grayed out weekends
Time slots load from recruiter's Google Calendar
Shows actual available times (e.g., 9:00 AM, 10:00 AM, 2:00 PM)
If no slots → Check calendar routing (see troubleshooting)
Company name shows "Comfort Keepers" (corporate brand)
Phone confirmation step works
Success page shows confirmation message
Calendar event created on recruiter's Google Calendar
Visual Checkpoint:
Booking Page (Candidate View):
┌────────────────────────────────────── ┐
│ Schedule Your Pre-Interview │
│ Comfort Keepers │ ← Corporate brand name
├────────────────────────────────────── ┤
│ Select a Date: │
│ [Calendar widget - weekdays enabled] │
│ │
│ Available Times: │
│ ○ 9:00 AM ○ 10:00 AM ○ 2:00 PM │ ← From Google Calendar
│ │
│ [Continue →] │
└────────────────────────────────────── ┘
Verify Calendar Event Created:
Open YOUR Google Calendar (the one you connected for qa.single@stage.com)
Navigate to the date you selected
You should see:
Event title: "Pre-Interview: Test Candidate"
Time matches what you booked
Event description includes candidate details
Failure Scenarios:
"No available times" → BUG: Calendar routing failed OR calendar tokens expired
Wrong company name (shows "CK Florence" or "Organization") → BUG: Corporate brand utility not working
Calendar error → BUG: Check integrations table for active calendar
Troubleshooting "No Available Times":
Check if calendar is connected:
Login as qa.single@stage.com
Go to Settings → Calendar
Verify status: "Connected"
Check calendar tokens (ask dev for Supabase access):
SELECT user_id, service_username, expires_at, is_active
FROM integrations
WHERE integration_type IN ('google_calendar', 'microsoft_graph')
AND is_active = true;
Verify expires_at is in the future (not expired)
-----Step 4: Voice Interview Simulation (Optional - Requires n8n)

Note: This step requires n8n workflow to be active. If not available, skip to Step 5.

What Happens Automatically:
At the scheduled pre-interview time, Retell.ai calls the candidate
Candidate answers pre-recorded voice questions (AI interviewer)
Retell transcribes responses → n8n → Supabase database
Expected Results (Check in RecruitBee after interview):
Application status auto-updates to "Interviewed"
Voice transcript appears in application detail
Interview completion timestamp recorded
Manual Alternative (if voice system unavailable):
Login as recruiter
Open application
Manually change status to "Interviewed"
Add notes: "Voice interview completed (manual simulation)"
-----Step 5: Move Candidate to Live Interview

Steps:
Review the voice interview transcript (or skip if manual)
Decide the candidate qualifies for a live interview
Click Status dropdown
Select "Live Interview"
Confirm
Expected Results:
Status changes to "Live Interview"
SMS sent to candidate with live interview scheduling link
Activity log updated
No backwards move confirmation (moving forward doesn't warn)
Visual Checkpoint:
Status Dropdown:
┌───────────────────┐
│ Status: [Live Int▼│ ← Changed from "Pre-Interview"
└───────────────────┘
-----Step 6: Act as Candidate - Book Live Interview (CRITICAL!)

This is the MOST CRITICAL test - Live interview booking failures are the #1 production issue!

Role Switch: You are the CANDIDATE again.

Steps:
Open Incognito Window
Paste the live interview scheduling link from SMS
3-Step Wizard:
Step 1: Select Date - Choose available weekday
Step 2: Choose Time - Select from recruiter's calendar slots
Step 3: Confirm Details - Verify phone and interview location
Click "Book Interview"
Expected Results:
Booking Page:
3-step wizard displays correctly (progress bar shows Step 1 → 2 → 3)
Step 1: Weekdays only enabled (Mon-Fri)
Step 2: Time slots load from recruiter's real Google Calendar
Step 3: Interview location shows FULL ADDRESS:
Example: "123 Main St, Suite 100, Florence, AZ, 85132"
Should match location_settings for this candidate's location
Success page confirms booking
Visual Checkpoint (Step 3):
Step 3: Confirm Details
┌────────────────────────────────────── ┐
│ Interview Location: │
│ 123 Main St, Suite 100 │ ← Full address
│ Florence, AZ, 85132 │ ← City, State, ZIP
│ │
│ Phone: (555) 123-4567 │
│ Date: Monday, Dec 23, 2025 │
│ Time: 2:00 PM │
│ │
│ [← Back] [Book Interview →] │
└────────────────────────────────────── ┘
Verify Google Calendar Event (CRITICAL):
Open YOUR Google Calendar (recruiter's calendar)
Find the event for the booked date/time
Check Event Details:
Event title: "Interview: Test Candidate - [Job Title]"
Location field shows FULL ADDRESS (clickable → Google Maps)
Description includes:
Candidate name
Position
Phone number
Interview location
"This is an in-person interview"
NO Google Meet link (disabled for in-person interviews)
Attendees include candidate's email
Reminders:
Email reminder (1 day before)
Popup reminder (30 min before)
Visual Checkpoint (Google Calendar Event):
Google Calendar Event:
┌────────────────────────────────────── ┐
│ Interview: Test Candidate - Caregiver│ ← Title
│ │
│ When: Mon, Dec 23, 2:00 PM - 3:00 PM│
│ │
│ Where: 123 Main St, Suite 100, │ ← Full address (clickable)
│ Florence, AZ, 85132 │
│ │
│ Description: │
│ Candidate: Test Candidate │
│ Position: Caregiver │
│ Phone: (555) 123-4567 │
│ This is an in-person interview │ ← Confirms no video link
│ │
│ Guests: testcandidate1@stage.com │ ← Candidate added
│ │
│ Reminders: │
│ - Email (1 day before) │
│ - Popup (30 min before) │
└────────────────────────────────────── ┘
Failure Scenarios:
"No available times" → CRITICAL BUG: Calendar routing wrong OR tokens expired
"Address not configured" → BUG: Location settings missing
Wrong address shown → BUG: Using wrong location lookup (org instead of location_id)
Google Meet link appears → BUG: Event creation passing wrong parameters
Troubleshooting Calendar Routing:

Calendar routing uses a 3-tier priority system:
Priority 1: Claimed User - If application is "claimed" by a specific user → Use their calendar
Priority 2: Default Recruiter - If no claimed user → Use default recruiter's calendar
Priority 3: Organization-Based - If no default recruiter → Use first available calendar
To Check Which Calendar Was Used:
Open Browser Network Tab during booking:
F12 → Network tab
Filter: book-interview
Click on the request
Check Response JSON:
{
  "userId": "abc-123",
  "priority": "default_recruiter", ← Which tier was used
  "reason": "Default recruiter for organization",
  "calendarEmail": "qa.single@stage.com"
}
If Priority is Wrong:
Run this SQL query to debug:
*-- Check calendar routing for this application*
SELECT
  a.id as application_id,
  a.claimed_by_user_id, *-- Priority 1*
  a.organization_id,
  *-- Check if default recruiter exists (Priority 2)*
  (SELECT user_id FROM module_user_settings
   WHERE organization_id = a.organization_id
   AND module_id = 'recruitbee'
   AND settings->'default_recruiter_for_orgs' ? a.organization_id::text
   LIMIT 1) as default_recruiter_user_id,
  *-- Check org calendars (Priority 3)*
  (SELECT jsonb_agg(jsonb_build_object('user_id', user_id, 'email', service_username))
   FROM integrations
   WHERE organization_id = a.organization_id
   AND integration_type IN ('google_calendar', 'microsoft_graph')
   AND is_active = true) as available_calendars
FROM applications a
WHERE a.id = 'abc-123'; *-- Replace with actual ID*
-----Test 1.3: Multi-Tenant Security Check (CRITICAL!)

What We're Testing: Users can ONLY see data from their own organization.

Steps:
Login as qa.single@stage.com (CK Florence user)
Navigate to Applications list
Count how many applications you see (write this down)
Open Browser Console (F12)
Try to access another org's application:
*// Get an application ID from Hoodz (different org)*
*// Ask dev team for a Hoodz application ID, or:*
*// Run this SQL: SELECT id FROM applications WHERE organization_id = '[hoodz-org-id]' LIMIT 1;*
*// Try to fetch it via API:*
fetch('https://recruit.wrkrbee.ai/api/recruitment/applications/[hoodz-app-id]', {
  credentials: 'include'
}).then(r => r.json()).then(console.log)
Expected Results:
API returns 403 Forbidden OR 404 Not Found
Console shows error (not application data!)
Applications list shows ONLY CK Florence candidates
Cannot view/edit/delete applications from other organizations
Failure Scenario:
Console shows application data from Hoodz → CRITICAL SECURITY BUG!
Applications list shows candidates from multiple orgs → CRITICAL SECURITY BUG!
If This Fails: STOP TESTING and immediately report to dev team. This is a data leak vulnerability!-----Test Scenario 2: MULTI-MODULE EMPLOYEE

User: qa.multi@stage.com
Expected Behavior: Sees module selector after login, can switch between modules-----Test 2.1: Login Flow - Module Selector

What We're Testing: Multi-module users see the module selector.

Steps:
Logout if logged in
Navigate to [https://app.wrkrbee.ai/login](https://app.wrkrbee.ai/login)
Login as qa.multi@stage.com
Observe landing page
Expected Results:
Redirects to [https://app.wrkrbee.ai/select-module](https://app.wrkrbee.ai/select-module)
Module selector shows tiles for:
RecruitBee (if has access)
ReceptionBee (if has access)
Each tile shows module icon + description
Clicking RecruitBee → Redirects to [https://recruit.wrkrbee.ai/admin](https://recruit.wrkrbee.ai/admin)
Visual Checkpoint:
Module Selector:
┌────────────────────────────────────┐
│ Select a Module │
│ │
│ ┌──────────┐ ┌──────────┐ │
│ │ │ │ │ │
│ │ Reception│ │ Recruit │ │ ← Click to enter
│ │ Bee │ │ Bee │ │
│ │ │ │ │ │
│ │ Manage │ │ Hiring │ │
│ │ calls │ │ workflow │ │
│ └──────────┘ └──────────┘ │
└────────────────────────────────────┘
Failure Scenarios:
Skips module selector, goes directly to one module → BUG: Module access check broken
Module tile missing → BUG: Permissions not set correctly
Console error: "Module ID 'recruit' not found" → CRITICAL BUG: Using short form instead of 'recruitbee'
-----Test 2.2: Cross-Module Navigation

What We're Testing: Switching between modules preserves session (no re-login).

Steps:
Login as qa.multi@stage.com
Select RecruitBee → Access dashboard
Switch Modules:
Option A: Navigate to main menu → Click "Switch Module"
Option B: Go directly to [https://app.wrkrbee.ai](https://app.wrkrbee.ai)
Select ReceptionBee → Access dashboard
Switch back to RecruitBee
Expected Results:
Session persists (no re-login required!)
Each module shows correct data for active organization
Navigation between modules takes < 2 seconds
No console errors during switch
Cookie wrkrbee-auth remains valid
To Verify Session Cookie:
F12 → Application tab (Chrome DevTools)
Left sidebar: Cookies → [https://app.wrkrbee.ai](https://app.wrkrbee.ai)
Find cookie: wrkrbee-auth
Check:
Expires: Shows future date (~8 hours from login)
HttpOnly: true
Secure: true
-----Test 2.3: Repeat Recruiting Workflow

Steps: Repeat Test Scenario 1.2 (Full Recruiting Workflow) as qa.multi@stage.com.

Additional Validation:
Can access recruiting workflow while having multiple modules
Calendar routing works (uses default recruiter if configured)
SMS/Email show correct corporate brand
Switching modules mid-workflow doesn't break state
-----Test Scenario 3: ADMIN/FRANCHISEE USER

User: qa.admin@stage.com
Organizations: Hoodz Phoenix + Hoodz Tucson (multi-location)
Expected Behavior: Can manage users, settings, cross-location features-----Test 3.1: Organization Switching

What We're Testing: Multi-location admins can switch between locations.

Steps:
Login as qa.admin@stage.com
Select RecruitBee module
Top-right header shows current organization (e.g., "Hoodz Phoenix")
Click organization dropdown
Select "Hoodz Tucson"
Expected Results:
Dropdown shows all managed locations (Phoenix, Tucson)
Switching updates active organization immediately
Applications list refreshes with Tucson's data
Job postings refresh with Tucson's jobs
Settings tabs load Tucson's settings
No data leak (cannot see Phoenix candidates when viewing Tucson)
Visual Checkpoint:
Header:
┌────────────────────────────────────┐
│ RecruitBee [Hoodz Phoenix ▼] │ ← Click dropdown
│ qa.admin@... │
└────────────────────────────────────┘
Dropdown Opens:
┌────────────────────┐
│ ☑ Hoodz Phoenix │ ← Currently selected
│ ○ Hoodz Tucson │ ← Click to switch
└────────────────────┘
After Switching to Tucson:
Header shows "Hoodz Tucson"
Applications list shows ONLY Tucson candidates
Job postings show ONLY Tucson jobs
Multi-Tenant Check (Run in SQL Editor):
*-- After switching to Tucson*
SELECT organization_id, COUNT(*)
FROM applications
WHERE organization_id = '[tucson-org-id]'
GROUP BY organization_id;
*-- Should show ONLY Tucson applications*
-----Test 3.2: User Management (Admin Features)

What We're Testing: Admins can add/edit/delete users.
Note: User management is primarily in ReceptionBee Admin Panel.

Steps:
Login as qa.admin@stage.com
Go to ReceptionBee module
Navigate to Settings → Team
Click + Add New User
Add User Test:
Fill in form:
First Name: Test
Last Name: Employee
Email: test.employee@stage.com
Role: Employee
Assigned Organizations: Hoodz Phoenix
Module Access: RecruitBee
Click Save
Expected Results:
User appears in team list
Invite email sent (check staging inbox)
User can login with invite link
Edit User Test:
Find the user you just created
Click Edit
Change role to "Admin"
Click Save
Expected Results:
Changes save immediately
User's role updates in team list
Deactivate User Test:
Find the user
Click Edit
Toggle Active to OFF
Click Save
Try to login as that user
Expected Results:
User marked inactive in team list
Login fails with error: "Account deactivated"
-----Test 3.3: Settings Management

What We're Testing: Settings persist after save.-----Settings → SMS Templates

Steps:
Navigate to Settings → SMS Templates
Find "Pre-Interview" template
Edit the template:
Add text: "Looking forward to meeting you!"
Use variables: {{company_name}}, {{candidate_name}}
Click Save
Click "Send Test SMS"
Enter your phone number
Check your phone
Expected Results:
Template saves successfully
Test SMS received
Variables replaced correctly:
{{company_name}} → "Hoodz" (or "Hoodz of Greater Phoenix")
{{candidate_name}} → "Test" (or your test candidate name)
Custom text appears in SMS
Important: Company name should show corporate brand ("Hoodz"), NOT location name ("Hoodz of Greater Phoenix").-----Settings → Location Settings (Multi-Location)

What We're Testing: Multi-location orgs show dropdown, single-location orgs don't.

Test A: Multi-Location Org (Hoodz)
Steps:
Login as qa.admin@stage.com
Navigate to Settings → Location Settings
Expected Results:
Dropdown appears with all locations:
"Hoodz of Greater Phoenix"
"Hoodz of Tucson"
Select location → Form loads with that location's settings
Edit address fields (e.g., change street address)
Click Save
Switch locations → Form updates with new location's data
Previous changes persist (refresh page to verify)
Visual Checkpoint:
Location Settings:
┌────────────────────────────────────┐
│ Select Location: │
│ [Hoodz of Greater Phoenix ▼] │ ← Dropdown shown
├────────────────────────────────────┤
│ Interview Address: │
│ Street: [1220 W Alameda Dr] │
│ Suite: [Suite 105] │
│ City: [Tempe] │
│ State: [AZ] │
│ ZIP: [85282] │
│ │
│ [Save] │
└────────────────────────────────────┘
Test B: Single-Location Org (CK Florence)
Steps:
Logout
Login as qa.single@stage.com (CK Florence - single location)
Navigate to Settings → Location Settings
Expected Results:
NO dropdown shown
Form loads immediately with organization's single location
Edit address → Saves directly
Visual Checkpoint:
Location Settings (Single-Location):
┌────────────────────────────────────┐
│ Interview Address: │ ← No dropdown!
│ Street: [123 Main St] │
│ Suite: [Suite 100] │
│ City: [Florence] │
│ State: [AZ] │
│ ZIP: [85132] │
│ │
│ [Save] │
└────────────────────────────────────┘
-----Test 3.4: Job Posting Duplication & Multi-Location

What We're Testing: Duplicate a job and assign to different location.
Priority: HIGH (tests multi-location workflows)-----Step 1: Duplicate Job Within Same Location

Steps:
Login as qa.admin@stage.com
Navigate to Jobs → Job Postings
Select any active job posting (e.g., "Caregiver - Phoenix")
Click "Duplicate" button (3-dot menu or action button)
Wait for success message
Expected Results:
Success toast: "Job posting and X application questions duplicated successfully"
Redirects to edit page of duplicated job
Job title shows: "Caregiver - Phoenix (Copy)"
Slug auto-generated: caregiver-phoenix-copy (or -copy-2 if already exists)
All fields copied:
Job description
Requirements
Voice interview questions
Application questions
Same organization as original (Phoenix)
Status: Draft (not published)
Visual Checkpoint:
Edit Job Posting:
┌────────────────────────────────────┐
│ Job Title: Caregiver - Phoenix (Copy)│ ← "(Copy)" added
│ Slug: caregiver-phoenix-copy │ ← Auto-generated
│ Status: [Draft ▼] │ ← Not published
│ │
│ Job Description: │
│ [Same as original] │
│ │
│ Application Questions: 5 │ ← Copied from original
└────────────────────────────────────┘
Failure Scenario:
Warning toast (red): "Job posting created successfully, but application questions failed to duplicate: [ERROR]"
This means job_questions INSERT failed
Check console for full error details
Workaround: Manually add questions in job edit page
-----Step 2: Change Job Location (Multi-Location Only)

Setup: Use the duplicated job from Step 1.

Steps:
On the job edit page, find "Organization" or "Location" dropdown
Change from "Hoodz of Greater Phoenix" → "Hoodz of Tucson"
Click Save
Expected Results:
Organization dropdown shows all franchise locations (Phoenix, Tucson)
If job has 0 applicants → Dropdown is editable
If job has 1+ applicants → Dropdown is LOCKED (shows badge: "Cannot change - X applicants")
Save succeeds
Job now appears in Tucson's job list (not Phoenix)
Application questions migrated to new organization_id
Critical Migration Check (Run in SQL Editor):
*-- Verify job AND questions migrated together*
SELECT
  jp.id as job_id,
  jp.title,
  jp.organization_id as job_org_id,
  jq.id as question_id,
  jq.question_text,
  jq.organization_id as question_org_id
FROM job_postings jp
LEFT JOIN job_questions jq ON jq.job_posting_id = jp.id
WHERE jp.id = 'abc-123'; *-- Replace with duplicated job ID*
*-- CRITICAL: job_org_id MUST MATCH question_org_id*
*-- If mismatch → Bug #3 (questions disappear after location change)*
Why This Matters: If job_org_id doesn't match question_org_id, application questions will disappear when candidates apply!-----Step 3: Delete Job Posting (Franchise-Wide Access)

What We're Testing: Franchise admins can delete jobs from ANY franchise location.

Steps:
Stay logged in as qa.admin@stage.com (Hoodz admin, home org: Phoenix)
Navigate to Jobs → All Jobs
Filter by Tucson (or just scroll to find Tucson jobs)
Try to delete the Tucson job you created in Step 2
Expected Results:
Phoenix admin CAN see Tucson jobs (franchise-wide access)
Delete button available
If job has 0 applicants → Delete succeeds
If job has 1+ applicants → Delete blocked with error:
"Cannot delete job with X applications. Please archive instead."
Cascade deletes related records:
job_questions (application questions)
job_intelligence (AI-generated data)
landing_page_content (job page content)
Failure Scenarios:
Delete button hangs/spins indefinitely → BUG (Bug #4, fixed Dec 20, 2025)
403 Forbidden → BUG: Franchise access check broken
-----Visual CheckpointsWhat to Look For During Testing

Good UI ( PASS):
Buttons have hover states (change color when you hover)
Loading states show spinners (not frozen)
Success messages appear as green toasts (top-right)
Forms have validation (red text for errors)
Tables load with data (not empty)
Dates formatted correctly (e.g., "Dec 23, 2025" not "2025-12-23 T00:00:00Z")
Bad UI ( FAIL - Report as Bug):
Buttons don't respond to clicks
Page freezes (spinner spins forever)
Error messages are unclear (e.g., "Error: undefined")
Forms allow invalid data (e.g., negative phone numbers)
Tables show raw JSON objects
Dates show as timestamps
-----Browser Console Errors (How to Read Them)

Open Console: F12 → Console tab

Error Types:
Color
Type
Severity
Action
Red
Error
HIGH
Screenshot and report
Yellow
Warning
LOW
Note but may be okay
Blue
Info
N/A
Ignore (informational)

Example Error:
 Uncaught TypeError: Cannot read property 'id' of undefined
 at ApplicationDetail.tsx:42
What This Means:
Error type: TypeError
Problem: Trying to access .id on something that doesn't exist
File: ApplicationDetail.tsx
Line: 42
Your Action: Screenshot this and include in bug report!-----Network Tab (How to Check API Calls)

Open Network Tab: F12 → Network tab

When to Check:
After clicking "Save" buttons
After status changes
After loading pages
What to Look For:
Status
Color
Meaning
Action
200
 Green
Success
 PASS
201
 Green
Created
 PASS
400
 Red
Bad Request
 Report (form validation issue)
403
 Red
Forbidden
 Report (permission issue)
404
 Red
Not Found
 Report (broken link or deleted resource)
500
 Red
Server Error
 Report (backend bug)

Example Network Request:
POST /api/recruitment/applications/123/status
Status: 200 OK
Response: { "success": true, "status": "pre-interview" }
This is GOOD - API call succeeded!

Example Failed Request:
POST /api/recruitment/applications/123/status
Status: 500 Internal Server Error
Response: { "error": "Database connection failed" }
This is BAD - Screenshot and report!-----Reporting BugsBug Report Template

When you find a bug, use this template:
## Bug Report: [Short Description]

**Test Case**: [Which test from this guide]
**Severity**: CRITICAL / HIGH / MEDIUM / LOW
**Found By**: [Your Name]
**Date**: [Today's date]

### Steps to Reproduce

1. Login as qa.single@stage.com
2. Navigate to Applications
3. Click on application ID abc-123
4. Click status dropdown
5. Select "Pre-Interview"

### Expected Result

Status changes to "Pre-Interview" and SMS sent to candidate.

### Actual Result

Status dropdown freezes. No SMS sent. Browser console shows error: "TypeError: Cannot read property 'id' of undefined"

### Screenshots

[Paste screenshot of error]

### Console Errors
Uncaught TypeError: Cannot read property 'id' of undefined
at ApplicationDetail.tsx:42

### Network Requests

[Paste failed API response if applicable]

### Additional Info

- Browser: Chrome 120
- OS: macOS 14
- User: qa.single@stage.com
- Organization: Comfort Keepers Florence
-----Severity Levels
Severity
When to Use
Examples
CRITICAL
Blocks all users, data leak, security vulnerability
Multi-tenant data leak, authentication broken, production crash
HIGH
Breaks major feature for some users
Live interview booking fails, calendar routing wrong, SMS not sent
MEDIUM
Feature partially works, workaround available
UI glitch, slow performance, confusing error message
LOW
Minor issue, doesn't block work
Typo in text, cosmetic UI issue, nice-to-have feature

If Unsure: Mark as HIGH and let dev team re-prioritize.-----QA Best PracticesBefore You Start Testing

Checklist:
Browser DevTools open (F12)
Notepad ready for recording bugs
Phone nearby for SMS testing
Logged in as correct test user
Test data created (applications, jobs, etc.)
-----During Testing

Tips:
Test one thing at a time - Don't skip around
Check console after EVERY action - Red errors = bugs
Take screenshots immediately - Don't wait until later
Try to break things - Click buttons twice, submit empty forms, etc.
Test like a real user - If it confuses you, it'll confuse users
Common Mistakes to Avoid:
Skipping console checks (you'll miss errors!)
Testing too fast (slow down, observe results)
Not recording bugs immediately (you'll forget details!)
Using production instead of staging (NEVER test in production!)
-----After Testing

Checklist:
All test cases marked Pass/Fail in test results table
All bugs reported using bug template
Screenshots attached to bug reports
Test data cleaned up (or left for next test run)
Summary sent to team (e.g., "Completed QA run, found 3 bugs")
-----Test Execution TrackingTest Results Template

Copy this table and fill it out as you test:
Test Case
Status
Notes
Severity
Assignee
1.1 Single-Module Login
 Not Started






1.2 Full Recruiting Workflow
 Not Started






1.3 Multi-Tenant Security
 Not Started






2.1 Multi-Module Login
 Not Started






2.2 Cross-Module Navigation
 Not Started






2.3 Recruiting Workflow (Multi)
 Not Started






3.1 Organization Switching
 Not Started






3.2 User Management
 Not Started






3.3 Settings Management
 Not Started






3.4 Job Duplication
 Not Started







Status Legend:
Not Started
In Progress
Pass
Pass with Warnings
Fail

Test Case
Status
Notes
Severity
Assignee
1.1 Single-Module Login
 Pass
All checks passed




1.2 Full Recruiting Workflow
 Fail
SMS not sent at Step 2
HIGH
Dev Team
1.3 Multi-Tenant Security
 Pass







Example Filled Out:-----Success Criteria

You're done testing when:
All test cases attempted (even if some fail)
All bugs documented with screenshots
Test results table filled out
Summary report sent to team
Don't aim for perfection! Finding bugs is SUCCESS, not failure.-----

