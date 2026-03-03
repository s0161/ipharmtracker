# Full Sweep: Fix Broken Features + Add GPhC Compliance Features

## Goal

Make iPharmTracker the most complete UK pharmacy compliance tracker on the market by fixing all half-built features and adding missing GPhC inspection compliance areas.

## Scope

**7 fixes** to existing broken/half-built features + **4 new features** for GPhC compliance gaps.

### User Decisions

- CD register: Skip (handled by PMR system)
- SOP tracking: Skip (handled elsewhere)
- Near-miss log: Dedicated page with learning actions
- Risk assessments, DBS, MHRA: Track via Document Tracker categories
- Pharmacy details: Editable in Settings, stored in Supabase
- Approach: Fix-first, then extend

---

## Part A: Fix Broken Features

### 1. Audit Trail

**Problem:** `audit_log` table exists and Settings displays it, but nothing writes to it.

**Solution:**
- Create `src/utils/auditLog.js` exporting `logAudit(action, item, page)`
- Insert to `audit_log` table: timestamp, action (Created/Updated/Deleted), item description, user name (from UserContext), page name
- Wire into every CRUD page: DocumentTracker, StaffTraining, SafeguardingTraining, TrainingLogs, CleaningRota, TemperatureLog, Settings (staff/tasks/topics), RPLog, MyTasks, Incidents, NearMissLog
- Direct Supabase insert per action (low volume, no batching needed)

### 2. Score History

**Problem:** Dashboard reads `ipd_score_history` from localStorage for sparklines/trends but nothing writes to it.

**Solution:**
- After computing the 4 compliance scores in Dashboard.jsx, append today's scores to `ipd_score_history`
- Format: `{ [YYYY-MM-DD]: { documents: N, training: N, cleaning: N, safeguarding: N } }`
- Write once per day (skip if today's key exists)
- Keep last 30 days, prune older entries
- Sparklines and trend arrows will start working automatically

### 3. RP Sessions

**Problem:** `rpSignedIn` defaults to `true`, sign-in time "09:02" hardcoded.

**Solution:**
- On Dashboard mount, check today's `rp_log` for `signInTime`/`signOutTime` fields
- Sign In writes `signInTime: new Date().toISOString()` to today's entry
- Sign Out writes `signOutTime: new Date().toISOString()`
- Elapsed timer computes from real `signInTime`
- No entry today → shows "Not signed in"

### 4. Streak Calculation

**Problem:** `streakDays={7}` always hardcoded.

**Solution:**
- Compute from `cleaning_entries`: count consecutive days backwards from today/yesterday where at least one entry exists
- Pass real number to ShiftChecklist
- If no entries today, streak counts from yesterday

### 5. Action Items

**Problem:** Dashboard reads `action_items` but completion is session-only. No create/delete UI.

**Solution:**
- Use `useSupabase('action_items')` for full CRUD
- Checking a todo writes `completed: true` + `completedAt` to Supabase
- Add "Add Task" button: title, due date, assignee
- Add delete (button on desktop, swipe on mobile)
- Completed items show struck-through for the day, hidden after 24h

### 6. Notification Preferences

**Problem:** 5 toggles in Settings saved to localStorage but never checked anywhere.

**Solution:**
- In NotificationBell, read prefs before building notifications array
- Skip disabled categories: document expiry, training overdue, cleaning overdue, safeguarding due, temperature reminders
- Apply same filtering to sidebar badge counts in `useSidebarCounts`

### 7. Incidents Page

**Problem:** IncidentQuickAdd saves to `incidents` table but there's no page to view/manage them.

**Solution:**
- New page: `src/pages/Incidents.jsx` at `/incidents`
- Sidebar: add under RECORDS section
- Table: Type, Date, Description, Severity, Reported By, Actions
- Filter by type (Near Miss/Dispensing Error/Complaint/Other) and severity
- Edit modal, delete with confirm, CSV export
- Severity badges: Low (green), Medium (amber), High (red)
- IncidentQuickAdd floating button stays as quick entry point
- Emerald Command theme styling

---

## Part B: New GPhC Compliance Features

### 8. Near-Miss Log

GPhC inspectors specifically look for evidence of a "learning culture" — recording near misses AND documenting what was learned and changed.

**New page:** `src/pages/NearMissLog.jsx` at `/near-misses`
**Sidebar:** add under COMPLIANCE section

**New Supabase table:**
```sql
CREATE TABLE near_misses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  who_involved TEXT,
  category TEXT,
  severity TEXT DEFAULT 'Low',
  root_cause TEXT,
  learning_action TEXT,
  action_taken_by TEXT,
  action_date DATE,
  status TEXT DEFAULT 'Open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Categories:** Dispensing Error, Wrong Patient, Wrong Drug, Wrong Strength, Wrong Quantity, Wrong Label, Wrong Directions, Other

**Workflow:** Log → Add root cause + learning action → Mark resolved
**Status:** Open → Action Taken → Resolved

**UI:**
- 3 summary stat cards: Total This Month, Resolved %, Avg Resolution Time
- Full CRUD table with status badges (Open=red, Action Taken=amber, Resolved=green)
- Expandable learning action section per row
- CSV export

### 9. Document Tracker Categories

Expand the Document Tracker to cover more GPhC inspection areas via categories.

**Changes:**
- Add "DBS Check" to category dropdown
- Add "MHRA Alert" to category dropdown
- Seed additional entries:
  - DBS Checks: one per staff member, 3-year expiry cycle
  - MHRA Alerts: empty (logged as needed)
  - Risk Assessments: COSHH Assessment, Lone Working Assessment, Manual Handling Assessment (Fire Risk already exists)
- No code changes to DocumentTracker.jsx — it handles all categories generically

### 10. Pharmacy Config

Make pharmacy details editable so the app works for any pharmacy, not just iPharmacy Direct.

**New Supabase table:**
```sql
CREATE TABLE pharmacy_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_name TEXT DEFAULT 'My Pharmacy',
  address TEXT,
  superintendent TEXT,
  rp_name TEXT,
  gphc_number TEXT,
  phone TEXT,
  email TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**New hook:** `usePharmacyConfig()` — reads the single-row config, caches it

**Changes:**
- Settings: make Pharmacy Details section editable with Save button
- Dashboard: replace hardcoded "FED07" with `config.gphc_number`
- Dashboard RPPresenceBar: replace hardcoded RP name with `config.rp_name`
- RPLog: replace hardcoded "Amjid Shakoor" with `config.rp_name`
- Seed with current iPharmacy Direct values

### 11. Temperature Chart

Add visual trend chart to the Temperature Log page.

**Design:**
- Inline SVG line chart above the table
- Show last 14 days of readings as connected dots
- Horizontal dashed lines at 2°C and 8°C (safe range)
- Out-of-range points in red, in-range in emerald
- Responsive: smaller view on mobile
- No chart library — same SVG approach as dashboard sparklines

---

## Execution Order

1. Audit trail utility (prerequisite for all pages)
2. Score history (Dashboard fix)
3. RP sessions (Dashboard fix)
4. Streak calculation (Dashboard fix)
5. Action items (Dashboard fix)
6. Notification preferences (Dashboard + Sidebar fix)
7. Incidents page (new page)
8. Near-miss log (new page)
9. Document Tracker categories + seed data
10. Pharmacy config (new table + hook + Settings + Dashboard + RPLog)
11. Temperature chart (enhancement)

## New Supabase Tables

- `near_misses` — near-miss log entries with learning actions
- `pharmacy_config` — single-row pharmacy identity/details

## New Files

- `src/utils/auditLog.js` — shared audit logging utility
- `src/hooks/usePharmacyConfig.js` — pharmacy config hook
- `src/pages/Incidents.jsx` — incidents list page
- `src/pages/NearMissLog.jsx` — near-miss log with learning actions
- `src/components/TemperatureChart.jsx` — SVG trend chart

## Modified Files

- `src/pages/Dashboard.jsx` — score history, RP sessions, streak, action items, notification prefs
- `src/components/dashboard/ShiftChecklist.jsx` — real streak
- `src/components/dashboard/RPPresenceBar.jsx` — real sessions + config RP name
- `src/components/dashboard/NotificationBell.jsx` — filter by prefs
- `src/components/dashboard/TodoSection.jsx` — full CRUD action items
- `src/pages/TemperatureLog.jsx` — add chart
- `src/pages/RPLog.jsx` — config RP name
- `src/pages/Settings.jsx` — editable pharmacy details
- `src/components/Sidebar.jsx` — add Incidents + Near Misses nav, filter badge counts by prefs
- `src/App.jsx` — add routes for Incidents + NearMissLog
- `src/utils/seed.js` — new document entries, pharmacy_config seed
- All CRUD pages — add `logAudit()` calls

## Verification

- [ ] `npm run build` passes
- [ ] Audit trail populates when creating/editing/deleting records
- [ ] Sparklines show real trend data after first score write
- [ ] RP sign-in/out times are real, elapsed timer ticks from actual sign-in
- [ ] Streak counts consecutive days of cleaning entries
- [ ] Action items persist completion to Supabase
- [ ] Disabling a notification pref hides that category from bell + sidebar badge
- [ ] Incidents page shows all logged incidents with CRUD
- [ ] Near-miss log records near misses with learning actions
- [ ] Document Tracker shows DBS Check and MHRA Alert categories
- [ ] Pharmacy details editable in Settings, reflected in Dashboard header and RP bar
- [ ] Temperature chart shows 14-day trend with safe range lines
- [ ] All new/modified pages styled in Emerald Command theme
- [ ] Mobile responsive on all new pages
