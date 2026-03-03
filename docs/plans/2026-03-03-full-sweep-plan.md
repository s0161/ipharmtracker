# Full Sweep: Fix Broken Features + GPhC Compliance — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 7 half-built features and add 4 new GPhC compliance features to make iPharmTracker the most complete UK pharmacy compliance tracker.

**Architecture:** Each task is a self-contained change. Fixes come first (audit trail is prerequisite for new pages). New features layer on top. All data flows through `useSupabase` hook. New Supabase tables need RLS policies. All UI uses Emerald Command Tailwind theme.

**Tech Stack:** React 18, Vite 5, Supabase (anon key), Tailwind CSS v3 with `ec-*` namespace, HashRouter

**Shared Patterns (reference for all tasks):**
- Input class: `"w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors font-sans"`
- Card: `className="rounded-2xl p-5" style={{ backgroundColor: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}`
- Primary button: `"px-4 py-2 bg-ec-em text-white font-semibold rounded-lg text-sm border-none cursor-pointer hover:bg-ec-em-dark transition-colors font-sans"`
- Ghost button: `"px-3 py-1.5 bg-white/[0.05] text-ec-t2 rounded-lg text-xs border border-white/[0.06] cursor-pointer hover:bg-white/[0.08] transition-colors font-sans"`
- Danger button: `"px-2.5 py-1 bg-ec-crit/10 text-ec-crit-light rounded-lg text-xs border border-ec-crit/20 cursor-pointer hover:bg-ec-crit/20 transition-colors font-sans"`
- Table header: `"text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-white/[0.06]"`
- Table cell: `"px-4 py-2.5 text-ec-t1 border-b border-white/[0.04]"`
- Status badges: green `"bg-ec-em/10 text-ec-em"`, amber `"bg-ec-warn/10 text-ec-warn"`, red `"bg-ec-crit/10 text-ec-crit-light"`, indigo `"bg-ec-info/10 text-ec-info-light"`
- Loading state: `<div className="flex items-center justify-center py-20 text-sm text-ec-t3">Loading…</div>`
- Page description: `<p className="text-sm text-ec-t3 mb-2">...</p>`

---

### Task 1: Audit Trail Utility

Create a shared utility that logs CRUD actions to the `audit_log` Supabase table. This is a prerequisite for all subsequent tasks — every page that does CRUD should call this.

**Files:**
- Create: `src/utils/auditLog.js`

**Supabase table** (already exists — `audit_log` with columns: id, timestamp, action, item, user, page, created_at)

**Implementation:**

Create `src/utils/auditLog.js`:
```js
import { supabase } from '../lib/supabase'

export async function logAudit(action, item, page, userName) {
  try {
    await supabase.from('audit_log').insert({
      timestamp: new Date().toISOString(),
      action,
      item,
      user: userName || 'System',
      page,
    })
  } catch (e) {
    console.warn('Audit log failed:', e)
  }
}
```

Parameters:
- `action`: string — `'Created'` | `'Updated'` | `'Deleted'`
- `item`: string — human-readable description, e.g. `"Document: Fire Risk Assessment"` or `"Temperature: 4.5°C"`
- `page`: string — page name, e.g. `'Documents'`, `'Temperature Log'`, `'Settings'`
- `userName`: string — from `useUser().user.name`

The function is fire-and-forget (no await needed at call site). Failures are silently logged to console.

**Verification:**
- `npm run build` passes
- Import works: `import { logAudit } from '../utils/auditLog'`

**Commit:** `feat: add shared audit trail logging utility`

---

### Task 2: Wire Audit Trail Into All Existing CRUD Pages

Add `logAudit()` calls to every page that creates, updates, or deletes records. Import `useUser` to get the current user name.

**Files to modify:**
- `src/pages/DocumentTracker.jsx` — add/edit/delete documents
- `src/pages/StaffTraining.jsx` — add/edit/delete + status cycle
- `src/pages/SafeguardingTraining.jsx` — add/edit/delete + signed-off toggle
- `src/pages/TrainingLogs.jsx` — add/edit/delete
- `src/pages/CleaningRota.jsx` — add/edit/delete
- `src/pages/TemperatureLog.jsx` — add/delete
- `src/pages/RPLog.jsx` — checklist changes (auto-save)
- `src/pages/MyTasks.jsx` — task completion + assigned task creation/completion
- `src/pages/Settings.jsx` — staff add/remove/PIN change, topic add/remove, task add/remove/frequency change, clear data, delete duplicates
- `src/components/IncidentQuickAdd.jsx` — incident creation

**Pattern for each page:**

1. Add imports at top:
```js
import { logAudit } from '../utils/auditLog'
import { useUser } from '../contexts/UserContext'
```

2. Inside the component function, get user:
```js
const { user } = useUser()
```

3. After each successful CRUD operation, call:
```js
// After create:
logAudit('Created', `Document: ${form.documentName}`, 'Documents', user?.name)

// After update:
logAudit('Updated', `Document: ${form.documentName}`, 'Documents', user?.name)

// After delete:
logAudit('Deleted', `Document: ${name}`, 'Documents', user?.name)
```

**Specific wiring per page:**

| Page | Create | Update | Delete |
|---|---|---|---|
| DocumentTracker | `handleSubmit` when `!editingId` | `handleSubmit` when `editingId` | `handleDelete` |
| StaffTraining | `handleSubmit` when `!editingId` | `handleSubmit` when `editingId` + `cycleStatus` | `handleDelete` |
| SafeguardingTraining | `handleSubmit` when `!editingId` | `handleSubmit` when `editingId` + `toggleSignedOff` | `handleDelete` |
| TrainingLogs | `handleSubmit` when `!editingId` | `handleSubmit` when `editingId` | `handleDelete` |
| CleaningRota | `handleSubmit` when `!editingId` | `handleSubmit` when `editingId` | `handleDelete` |
| TemperatureLog | `handleSubmit` | — | `handleDelete` |
| RPLog | — | auto-save `useEffect` (log once per date change, not every debounce) | — |
| MyTasks | task toggle (`handleToggle`) | assigned task toggle | — |
| Settings/StaffManager | `handleAdd` | `handlePinSave`, `handleManagerToggle` | `handleRemove` |
| Settings/TaskManager | `handleAdd` | frequency change | `handleRemove` |
| Settings/ListManager | `handleAdd` | — | `handleRemove` |
| Settings (data) | — | — | `clearAllData`, `deleteDuplicates` |
| IncidentQuickAdd | `handleSubmit` | — | — |

**Important:** For RPLog, do NOT log every debounced auto-save. Instead, only log audit on the first save for a new date (when `!editingId` transitions to having an `editingId`).

**Important:** `IncidentQuickAdd.jsx` does not currently have access to `useUser()`. Add the import and access `user` inside the component.

**Verification:**
- `npm run build` passes
- Go to Settings → Audit Trail section. Create a document, edit a training record, delete a temp reading. The audit trail table should show all 3 actions with correct user name, timestamp, and page.

**Commit:** `feat: wire audit trail into all CRUD pages`

---

### Task 3: Score History + Real Sparklines

Make the Dashboard write compliance scores to localStorage daily so sparklines and trend arrows show real data.

**Files:**
- Modify: `src/pages/Dashboard.jsx`

**Current state:** Lines 163–183 read from `localStorage['ipd_score_history']` but nothing writes to it.

**Implementation:**

After the score computation block (after line 161 where `overallScore` is calculated), add a `useEffect` that writes today's scores:

```js
// Write score history once per day
useEffect(() => {
  if (docsLoading) return
  const key = 'ipd_score_history'
  const todayKey = new Date().toISOString().slice(0, 10)
  try {
    const history = JSON.parse(localStorage.getItem(key) || '{}')
    if (!history[todayKey]) {
      history[todayKey] = {
        documents: Math.round(docScore),
        training: Math.round(staffScore),
        cleaning: Math.round(cleaningScore),
        safeguarding: Math.round(sgScore),
      }
      // Prune entries older than 30 days
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 30)
      const cutoffStr = cutoff.toISOString().slice(0, 10)
      Object.keys(history).forEach(k => {
        if (k < cutoffStr) delete history[k]
      })
      localStorage.setItem(key, JSON.stringify(history))
    }
  } catch (e) {
    console.warn('Score history write failed:', e)
  }
}, [docsLoading, docScore, staffScore, cleaningScore, sgScore])
```

**Where to place:** After the existing `useMemo` blocks that compute scores (around line 162), add this as a new `useEffect`.

**Verification:**
- `npm run build` passes
- Open Dashboard. Open browser devtools → Application → localStorage → `ipd_score_history`. Should see today's date as a key with 4 score values.
- Sparklines in ComplianceHealth should show at least 1 data point (they need 2+ to render a line, so after 2 days they'll draw).

**Commit:** `feat: persist daily compliance scores for sparkline trends`

---

### Task 4: Real RP Sessions

Replace hardcoded RP sign-in state and times with actual data from `rp_log`.

**Files:**
- Modify: `src/pages/Dashboard.jsx`
- Modify: `src/components/dashboard/RPPresenceBar.jsx`

**Dashboard.jsx changes:**

1. Replace hardcoded initial state (line 74):
```js
// OLD: const [rpSignedIn, setRpSignedIn] = useState(true)
// NEW:
const [rpSignedIn, setRpSignedIn] = useState(false)
```

2. Add a `useEffect` to derive RP state from `rp_log` (after `todayRp` is computed, around line 136):
```js
useEffect(() => {
  if (!todayRp) {
    setRpSignedIn(false)
    return
  }
  const sessions = todayRp.sessions || []
  if (sessions.length === 0) {
    setRpSignedIn(false)
    return
  }
  const lastSession = sessions[sessions.length - 1]
  setRpSignedIn(!!lastSession.signInAt && !lastSession.signOutAt)
}, [todayRp])
```

3. Compute real sign-in time from sessions:
```js
const rpSignInTime = useMemo(() => {
  if (!todayRp) return null
  const sessions = todayRp.sessions || []
  const lastSession = sessions[sessions.length - 1]
  if (!lastSession?.signInAt) return null
  return new Date(lastSession.signInAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}, [todayRp])
```

4. Replace the hardcoded `rpSignInTime="09:02"` prop (line 490) with the computed value:
```jsx
rpSignInTime={rpSignInTime}
```

5. Also compute last sign-out time for RPPresenceBar:
```js
const rpLastSignOut = useMemo(() => {
  if (!todayRp) return null
  const sessions = todayRp.sessions || []
  for (let i = sessions.length - 1; i >= 0; i--) {
    if (sessions[i].signOutAt) {
      return new Date(sessions[i].signOutAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    }
  }
  return null
}, [todayRp])
```

Pass to RPPresenceBar:
```jsx
rpLastSignOut={rpLastSignOut}
```

**RPPresenceBar.jsx changes:**

1. Add `rpLastSignOut` to props.
2. Replace hardcoded "13:15" (line ~72) with `rpLastSignOut || '—'`.
3. In the elapsed timer calculation (lines 33–46), handle `rpSignInTime` being `null` — if null, show "—" instead of computing elapsed.

**Verification:**
- `npm run build` passes
- Dashboard loads with RP showing "Not signed in" (no session today)
- Click "Sign In" → RP bar shows current time, elapsed timer ticks
- Click "Sign Out" → RP bar shows "Last: [name] out at [real time]"
- Refresh page → state persists correctly from `rp_log`

**Commit:** `feat: derive RP session state from actual rp_log data`

---

### Task 5: Streak Calculation

Compute actual consecutive days of cleaning task completion instead of hardcoded 7.

**Files:**
- Modify: `src/pages/Dashboard.jsx`

**Implementation:**

Add a `useMemo` that computes streak from `cleaningEntries`:

```js
const streakDays = useMemo(() => {
  if (!cleaningEntries.length) return 0
  const entryDates = new Set(cleaningEntries.map(e => {
    // Normalize dateTime to just date
    const dt = e.dateTime || e.date || ''
    return dt.slice(0, 10)
  }))

  let streak = 0
  const d = new Date()
  // Start from yesterday if no entries today
  if (!entryDates.has(d.toISOString().slice(0, 10))) {
    d.setDate(d.getDate() - 1)
  }

  while (entryDates.has(d.toISOString().slice(0, 10))) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}, [cleaningEntries])
```

Replace hardcoded `streakDays={7}` (line ~518) with `streakDays={streakDays}`.

**Verification:**
- `npm run build` passes
- Dashboard shows real streak count (likely 0 or 1 depending on today's entries)
- Complete a cleaning task → streak updates

**Commit:** `feat: compute real cleaning streak from entries`

---

### Task 6: Action Items Full CRUD

Make dashboard todos persist completion to Supabase and add create/delete UI.

**Files:**
- Modify: `src/pages/Dashboard.jsx`
- Modify: `src/components/dashboard/TodoSection.jsx`

**Dashboard.jsx changes:**

1. Change `actionItems` from read-only to read-write:
```js
// OLD: const [actionItems] = useSupabase('action_items', [...])
// NEW:
const [actionItems, setActionItems] = useSupabase('action_items', [])
```
Remove the hardcoded 4-item fallback default array (lines 65–69). The seed data already provides these.

2. Replace session-only `checkedTodo` Set with Supabase-backed completion:

Remove `const [checkedTodo, setCheckedTodo] = useState(new Set())` and the `handleToggleTodo` that manipulates the Set.

Replace with:
```js
const handleToggleTodo = (id) => {
  const item = actionItems.find(a => a.id === id)
  if (!item) return
  setActionItems(actionItems.map(a =>
    a.id === id ? { ...a, completed: !a.completed, completedAt: !a.completed ? new Date().toISOString() : null } : a
  ))
  logAudit(item.completed ? 'Updated' : 'Updated', `Action item: ${item.title} → ${item.completed ? 'reopened' : 'completed'}`, 'Dashboard', user?.name)
}
```

3. Add create handler:
```js
const handleAddTodo = (title, dueDate) => {
  const newItem = {
    id: generateId(),
    title,
    dueDate: dueDate || null,
    completed: false,
    createdAt: new Date().toISOString(),
  }
  setActionItems([...actionItems, newItem])
  logAudit('Created', `Action item: ${title}`, 'Dashboard', user?.name)
}
```

4. Add delete handler:
```js
const handleDeleteTodo = (id) => {
  const item = actionItems.find(a => a.id === id)
  setActionItems(actionItems.filter(a => a.id !== id))
  if (item) logAudit('Deleted', `Action item: ${item.title}`, 'Dashboard', user?.name)
}
```

5. Update `todos` computation to filter completed items (hide if completed more than 24h ago):
```js
const todos = useMemo(() => {
  const now = Date.now()
  return actionItems
    .filter(a => {
      if (!a.completed) return true
      // Show completed items for 24 hours
      if (a.completedAt) {
        return (now - new Date(a.completedAt).getTime()) < 86400000
      }
      return false
    })
    .map(a => ({
      id: a.id,
      title: a.title,
      days: a.dueDate ? Math.ceil((new Date(a.dueDate) - new Date()) / 86400000) + 'd' : null,
      completed: !!a.completed,
    }))
}, [actionItems])
```

6. Pass new props to TodoSection:
```jsx
<TodoSection
  todos={todos}
  onToggle={handleToggleTodo}
  onAdd={handleAddTodo}
  onDelete={handleDeleteTodo}
  mob={mob}
/>
```

**TodoSection.jsx changes:**

1. Update props: remove `checkedTodo`, add `onAdd`, `onDelete`. Use `todo.completed` instead of `checkedTodo.has(todo.id)`.

2. Add inline "Add Task" form (title input + optional due date + add button) at the bottom of the section.

3. Add delete button (small X) on each todo item.

4. Style the add form with the shared input/button patterns.

**Verification:**
- `npm run build` passes
- Check a todo → refresh page → still checked (persisted)
- Click "Add Task" → enter title → appears in list
- Delete a todo → gone after refresh
- Completed items disappear after 24 hours

**Commit:** `feat: full CRUD action items with Supabase persistence`

---

### Task 7: Notification Preferences Wiring

Make the Settings notification toggles actually control what's shown in the Dashboard bell and sidebar badges.

**Files:**
- Modify: `src/components/dashboard/NotificationBell.jsx` (or `src/pages/Dashboard.jsx` where notifications are built)
- Modify: `src/hooks/useSidebarCounts.js`

**Dashboard.jsx changes (notification building):**

The notifications are built in a `useMemo` around lines 215–223. Wrap each notification in a preference check:

```js
const notifications = useMemo(() => {
  const prefs = JSON.parse(localStorage.getItem('ipd_notification_prefs') || '{}')
  const notifs = []

  if (prefs.cleaningOverdue !== false && cleaningScore === 0) {
    notifs.push({ id: 'n1', type: 'critical', title: 'Cleaning at 0%', desc: '...', time: 'Today' })
  }
  if (prefs.temperatureMissing !== false && !tempLoggedToday) {
    notifs.push({ id: 'n2', type: 'warning', title: 'Temperature log due', desc: '...', time: 'Today' })
  }
  // Keep GPhC notification always (it's not a preference category)
  notifs.push({ id: 'n3', type: 'warning', title: 'GPhC inspection due', desc: '...', time: '14 months' })
  if (prefs.trainingOverdue !== false && staffScore === 100) {
    notifs.push({ id: 'n4', type: 'info', title: 'Training complete', desc: '...', time: 'Today' })
  }
  if (prefs.documentExpiry !== false && docScore === 100) {
    notifs.push({ id: 'n5', type: 'info', title: 'Documents updated', desc: '...', time: 'Today' })
  }
  return notifs
}, [cleaningScore, staffScore, docScore, tempLoggedToday])
```

Note: defaults are `!== false` so existing users see all notifications (prefs default to empty object).

**useSidebarCounts.js changes:**

Read `localStorage['ipd_notification_prefs']` at the top of the hook. Before returning the counts object, zero out counts for disabled categories:

```js
const prefs = JSON.parse(localStorage.getItem('ipd_notification_prefs') || '{}')

// Inside the hook, after computing counts:
if (prefs.documentExpiry === false) counts['/documents'] = { red: 0, amber: 0 }
if (prefs.trainingOverdue === false) counts['/staff-training'] = { red: 0, amber: 0 }
if (prefs.safeguardingDue === false) counts['/safeguarding'] = { red: 0, amber: 0 }
if (prefs.cleaningOverdue === false) counts['/cleaning'] = { red: 0, amber: 0 }
if (prefs.temperatureMissing === false) counts['/temperature'] = { red: 0, amber: 0 }
```

**Verification:**
- `npm run build` passes
- Go to Settings → disable "Document expiry alerts" → go to Dashboard → document notification should NOT appear in bell
- Sidebar badge for Documents should disappear
- Re-enable → badge and notification return

**Commit:** `feat: wire notification preferences to bell and sidebar badges`

---

### Task 8: Incidents Page

Create a new page to view, edit, search, and delete incidents.

**Files:**
- Create: `src/pages/Incidents.jsx`
- Modify: `src/App.jsx` — add route
- Modify: `src/components/Sidebar.jsx` — add nav item

**Supabase table** (already exists: `incidents` with columns: id, type, description, severity, date, created_at)

**Incidents.jsx implementation:**

```jsx
import { useState } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import { generateId, formatDate } from '../utils/helpers'
import { useToast } from '../components/Toast'
import { useUser } from '../contexts/UserContext'
import { logAudit } from '../utils/auditLog'
import Modal from '../components/Modal'
import PageActions from '../components/PageActions'
import { downloadCsv } from '../utils/exportCsv'

const TYPES = ['Near Miss', 'Dispensing Error', 'Complaint', 'Other']
const SEVERITIES = ['Low', 'Medium', 'High']

const inputClass = "w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors font-sans"

const emptyForm = {
  type: '',
  description: '',
  severity: 'Low',
  date: new Date().toISOString().slice(0, 10),
  reportedBy: '',
  actionTaken: '',
}
```

**Features:**
- Filter bar: type dropdown + severity dropdown + text search
- Table: Date, Type, Severity (badge), Description (truncated), Reported By, Actions
- Severity badges: Low = green pill, Medium = amber pill, High = red pill
- Add/Edit modal with fields: Type (dropdown), Date, Severity (dropdown), Reported By (staff dropdown), Description (textarea), Action Taken (textarea)
- Delete with confirm dialog
- CSV export
- PageActions component for download button
- `useUser` for audit trail
- Deduplication not needed (incidents are unique)

**Badge helpers:**
```js
const severityBadge = (sev) => {
  const cls = sev === 'High' ? 'bg-ec-crit/10 text-ec-crit-light' :
              sev === 'Medium' ? 'bg-ec-warn/10 text-ec-warn' :
              'bg-ec-em/10 text-ec-em'
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{sev}</span>
}

const typeBadge = (type) => {
  const cls = type === 'Near Miss' ? 'bg-ec-warn/10 text-ec-warn' :
              type === 'Dispensing Error' ? 'bg-ec-crit/10 text-ec-crit-light' :
              type === 'Complaint' ? 'bg-ec-info/10 text-ec-info-light' :
              'bg-white/[0.06] text-ec-t2'
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{type}</span>
}
```

**App.jsx changes:**
```jsx
import Incidents from './pages/Incidents'
// In routes:
<Route path="/incidents" element={<Incidents />} />
```

**Sidebar.jsx changes:**
Add to the RECORDS section array (after Documents):
```js
{ to: '/incidents', label: 'Incidents', icon: /* alert-triangle SVG */ }
```

Also add the `incidents` table to `useSidebarCounts` if desired (count High severity incidents from last 7 days as red badges). But this is optional — incidents don't have an "overdue" concept.

**Verification:**
- `npm run build` passes
- Navigate to `/incidents` — page loads with empty state
- Use the floating IncidentQuickAdd button to log an incident → appears in the Incidents table
- Edit, delete, filter, CSV export all work
- Sidebar shows "Incidents" link in RECORDS section

**Commit:** `feat: add Incidents page with full CRUD and filtering`

---

### Task 9: Near-Miss Log Page

Create a dedicated near-miss log with learning actions — the key GPhC "learning culture" evidence.

**Files:**
- Create: `src/pages/NearMissLog.jsx`
- Modify: `src/App.jsx` — add route
- Modify: `src/components/Sidebar.jsx` — add nav item
- Modify: `src/utils/seed.js` — bump version, add `near_misses` table to delete list

**New Supabase table** (must be created manually in Supabase dashboard or via SQL):
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
ALTER TABLE near_misses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon full access" ON near_misses FOR ALL USING (true) WITH CHECK (true);
```

**Categories:** `['Dispensing Error', 'Wrong Patient', 'Wrong Drug', 'Wrong Strength', 'Wrong Quantity', 'Wrong Label', 'Wrong Directions', 'Other']`

**Status workflow:** Open → Action Taken → Resolved

**NearMissLog.jsx implementation:**

Structure:
1. **3 summary stat cards** at top:
   - Total This Month (count where date is current month)
   - Resolved % (resolved / total * 100)
   - Open Items (count where status !== 'Resolved')

2. **Filter bar:** category dropdown + status dropdown + text search

3. **Table:** Date, Category (badge), Severity (badge), Description (truncated), Status (badge), Actions
   - Status badges: Open = red, Action Taken = amber, Resolved = green
   - Click a row to expand learning action details below

4. **Add/Edit modal:**
   - Date, Category (dropdown), Severity (Low/Medium/High), Who Involved (staff dropdown), Description (textarea)
   - Root Cause (textarea) — what went wrong
   - Learning Action (textarea) — what was changed to prevent recurrence
   - Action Taken By (staff dropdown)
   - Action Date
   - Status (dropdown: Open/Action Taken/Resolved)

5. **CSV export**, **Delete with confirm**, **PageActions**

**Stat card style:**
```jsx
<div className="grid grid-cols-3 gap-4 mb-6">
  <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
    <div className="text-2xl font-bold text-ec-t1">{monthTotal}</div>
    <div className="text-xs text-ec-t3 mt-1">This Month</div>
  </div>
  {/* ... */}
</div>
```

**App.jsx:** Add `import NearMissLog from './pages/NearMissLog'` and route `<Route path="/near-misses" element={<NearMissLog />} />`.

**Sidebar.jsx:** Add to COMPLIANCE section:
```js
{ to: '/near-misses', label: 'Near Misses', icon: /* shield-alert SVG */ }
```

**seed.js:** Bump `SEED_KEY` to `'ipd_seeded_v24'`. Add `'near_misses'` to the delete-before-seed list (line ~451). No initial seed data for near misses (start empty).

**Verification:**
- `npm run build` passes
- Navigate to `/near-misses` — page loads with empty state
- Add a near miss: fill all fields → appears in table with "Open" badge
- Edit: change status to "Action Taken", add root cause + learning action → badge turns amber
- Edit: change status to "Resolved" → badge turns green
- Summary cards update correctly
- CSV export includes all fields
- Sidebar shows "Near Misses" in COMPLIANCE section

**Commit:** `feat: add Near-Miss Log page with learning actions workflow`

---

### Task 10: Document Tracker Categories + Seed Data

Expand Document Tracker categories and seed additional GPhC-required documents.

**Files:**
- Modify: `src/utils/helpers.js` — add categories
- Modify: `src/utils/seed.js` — add new document entries, bump version

**helpers.js changes:**

Update the `CATEGORIES` array (line ~61):
```js
export const CATEGORIES = [
  'Registration', 'Insurance', 'Staff', 'SOP', 'Contract',
  'Training', 'Policy', 'Certificate', 'Risk Assessment',
  'DBS Check', 'MHRA Alert', 'Other'
]
```
Add `'DBS Check'` and `'MHRA Alert'` to the existing array.

**seed.js changes:**

Bump `SEED_KEY` to `'ipd_seeded_v25'` (or continue from v24 if Task 9 already bumped it — use the latest).

Add to the `documents` seed array:

```js
// Risk Assessments (Fire Risk already exists)
{ id: generateId(), document_name: 'COSHH Assessment', category: 'Risk Assessment', owner: 'Amjid Shakoor', issue_date: '2025-06-01', expiry_date: '2027-06-01', notes: 'Hazardous substances assessment', created_at: new Date().toISOString() },
{ id: generateId(), document_name: 'Lone Working Assessment', category: 'Risk Assessment', owner: 'Amjid Shakoor', issue_date: '2025-06-01', expiry_date: '2027-06-01', notes: '', created_at: new Date().toISOString() },
{ id: generateId(), document_name: 'Manual Handling Assessment', category: 'Risk Assessment', owner: 'Salma Shakoor', issue_date: '2025-06-01', expiry_date: '2027-06-01', notes: '', created_at: new Date().toISOString() },

// DBS Checks (one per staff member, 3-year cycle)
{ id: generateId(), document_name: 'DBS Check — Amjid Shakoor', category: 'DBS Check', owner: 'Amjid Shakoor', issue_date: '2024-01-15', expiry_date: '2027-01-15', notes: 'Enhanced DBS', created_at: new Date().toISOString() },
{ id: generateId(), document_name: 'DBS Check — Salma Shakoor', category: 'DBS Check', owner: 'Salma Shakoor', issue_date: '2024-02-01', expiry_date: '2027-02-01', notes: 'Enhanced DBS', created_at: new Date().toISOString() },
{ id: generateId(), document_name: 'DBS Check — Moniba Jamil', category: 'DBS Check', owner: 'Moniba Jamil', issue_date: '2024-03-01', expiry_date: '2027-03-01', notes: 'Enhanced DBS', created_at: new Date().toISOString() },
{ id: generateId(), document_name: 'DBS Check — Umama Khan', category: 'DBS Check', owner: 'Umama Khan', issue_date: '2024-03-15', expiry_date: '2027-03-15', notes: 'Enhanced DBS', created_at: new Date().toISOString() },
{ id: generateId(), document_name: 'DBS Check — Jamila Adwan', category: 'DBS Check', owner: 'Jamila Adwan', issue_date: '2024-04-01', expiry_date: '2027-04-01', notes: 'Enhanced DBS', created_at: new Date().toISOString() },
```

Add DBS checks for all 13 staff members. MHRA Alerts start empty (logged as-needed).

**Verification:**
- `npm run build` passes
- Clear localStorage `ipd_seeded_v24` (or latest) to trigger re-seed
- Refresh app → Documents page shows new Risk Assessment and DBS Check entries
- Filter by "DBS Check" category → shows all staff DBS records
- Filter by "MHRA Alert" → empty (as expected)
- Traffic lights work correctly (DBS checks are green with 2027 expiry dates)

**Commit:** `feat: add DBS Check and MHRA Alert document categories with seed data`

---

### Task 11: Pharmacy Config

Make pharmacy details editable and stored in Supabase, replacing all hardcoded values.

**Files:**
- Create: `src/hooks/usePharmacyConfig.js`
- Modify: `src/pages/Settings.jsx` — editable Pharmacy Details
- Modify: `src/pages/Dashboard.jsx` — use config for pharmacy badge + footer
- Modify: `src/components/dashboard/RPPresenceBar.jsx` — use config for RP name
- Modify: `src/pages/RPLog.jsx` — use config for RP name
- Modify: `src/components/Sidebar.jsx` — use config for brand name
- Modify: `src/utils/seed.js` — seed pharmacy_config

**New Supabase table:**
```sql
CREATE TABLE pharmacy_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_name TEXT DEFAULT 'My Pharmacy',
  address TEXT DEFAULT '',
  superintendent TEXT DEFAULT '',
  rp_name TEXT DEFAULT '',
  gphc_number TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE pharmacy_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon full access" ON pharmacy_config FOR ALL USING (true) WITH CHECK (true);
```

**usePharmacyConfig.js:**
```js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const DEFAULT_CONFIG = {
  pharmacyName: 'My Pharmacy',
  address: '',
  superintendent: '',
  rpName: '',
  gphcNumber: '',
  phone: '',
  email: '',
}

export function usePharmacyConfig() {
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('pharmacy_config').select('*').limit(1)
      if (data && data.length > 0) {
        const row = data[0]
        setConfig({
          id: row.id,
          pharmacyName: row.pharmacy_name || DEFAULT_CONFIG.pharmacyName,
          address: row.address || '',
          superintendent: row.superintendent || '',
          rpName: row.rp_name || '',
          gphcNumber: row.gphc_number || '',
          phone: row.phone || '',
          email: row.email || '',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  const updateConfig = async (updates) => {
    const merged = { ...config, ...updates }
    setConfig(merged)
    const snake = {
      pharmacy_name: merged.pharmacyName,
      address: merged.address,
      superintendent: merged.superintendent,
      rp_name: merged.rpName,
      gphc_number: merged.gphcNumber,
      phone: merged.phone,
      email: merged.email,
      updated_at: new Date().toISOString(),
    }
    if (config.id) {
      await supabase.from('pharmacy_config').update(snake).eq('id', config.id)
    } else {
      const { data } = await supabase.from('pharmacy_config').insert(snake).select()
      if (data?.[0]) setConfig(prev => ({ ...prev, id: data[0].id }))
    }
  }

  return [config, updateConfig, loading]
}
```

**Settings.jsx changes:**

Replace the hardcoded `PHARMACY_DETAILS` object and read-only display with:

1. Import `usePharmacyConfig`:
```js
import { usePharmacyConfig } from '../hooks/usePharmacyConfig'
```

2. In the component:
```js
const [pharmacyConfig, updatePharmacyConfig] = usePharmacyConfig()
const [pharmacyForm, setPharmacyForm] = useState(null)
```

3. When `pharmacyConfig` loads, init form:
```js
useEffect(() => {
  if (pharmacyConfig) setPharmacyForm({ ...pharmacyConfig })
}, [pharmacyConfig.id])
```

4. Replace read-only display with editable inputs (pharmacy name, address, superintendent, RP name, GPhC number, phone, email) + Save button that calls `updatePharmacyConfig(pharmacyForm)`.

**Dashboard.jsx changes:**
- Import `usePharmacyConfig`
- Replace `"FED07"` badge with `config.gphcNumber || 'FED07'`
- Replace footer `"iPharmacy Direct"` with `config.pharmacyName`
- Replace `getRPAssignee()` fallback with `config.rpName` for RP presence bar

**RPPresenceBar.jsx:** Already receives `rpName` as prop — no change needed if Dashboard passes the right value.

**RPLog.jsx changes:**
- Import `usePharmacyConfig`
- Replace hardcoded `'Amjid Shakoor'` default RP name with `config.rpName`

**Sidebar.jsx changes:**
- Import `usePharmacyConfig`
- Replace hardcoded `"iPharmacy Direct"` brand text with `config.pharmacyName`
- Replace `"IPD"` logo text with first letters of pharmacy name (e.g. `config.pharmacyName.split(' ').map(w => w[0]).join('').slice(0, 3)`)

**seed.js changes:**
Add `pharmacy_config` seed:
```js
await supabase.from('pharmacy_config').delete().neq('id', '00000000-0000-0000-0000-000000000000')
await supabase.from('pharmacy_config').insert({
  pharmacy_name: 'iPharmacy Direct',
  address: 'Manchester, UK',
  superintendent: 'Amjid Shakoor',
  rp_name: 'Amjid Shakoor',
  gphc_number: 'FED07',
  phone: '',
  email: '',
})
```

**Verification:**
- `npm run build` passes
- Settings → Pharmacy Details shows editable fields with current values
- Change pharmacy name to "Test Pharmacy" → Save → Sidebar brand updates → Dashboard footer updates
- Change GPhC number → Dashboard badge updates
- Change RP name → Dashboard RP bar shows new name → RPLog shows new default name

**Commit:** `feat: editable pharmacy config replacing all hardcoded values`

---

### Task 12: Temperature Chart

Add an SVG trend chart to the Temperature Log page showing 14-day temperature history.

**Files:**
- Create: `src/components/TemperatureChart.jsx`
- Modify: `src/pages/TemperatureLog.jsx` — add chart above table

**TemperatureChart.jsx:**

```jsx
export default function TemperatureChart({ readings, minRange = 2, maxRange = 8 }) {
  // readings: [{ date, temperature }] sorted by date ascending
  if (readings.length < 2) return null

  const W = 600, H = 180, PAD = { t: 20, r: 20, b: 30, l: 40 }
  const plotW = W - PAD.l - PAD.r
  const plotH = H - PAD.t - PAD.b

  // Y axis: from 0 to max(maxRange + 2, max reading + 1)
  const temps = readings.map(r => r.temperature)
  const yMin = Math.min(0, Math.min(...temps) - 1)
  const yMax = Math.max(maxRange + 2, Math.max(...temps) + 1)

  const toX = (i) => PAD.l + (i / (readings.length - 1)) * plotW
  const toY = (t) => PAD.t + plotH - ((t - yMin) / (yMax - yMin)) * plotH

  const points = readings.map((r, i) => `${toX(i)},${toY(r.temperature)}`)

  // Safe range band
  const bandTop = toY(maxRange)
  const bandBot = toY(minRange)

  return (
    <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <h3 className="text-sm font-bold text-ec-t1 mb-3">14-Day Temperature Trend</h3>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 180 }}>
        {/* Safe range band */}
        <rect x={PAD.l} y={bandTop} width={plotW} height={bandBot - bandTop}
          fill="rgba(16,185,129,0.06)" />

        {/* Range lines */}
        <line x1={PAD.l} y1={toY(minRange)} x2={W - PAD.r} y2={toY(minRange)}
          stroke="rgba(16,185,129,0.3)" strokeDasharray="4,4" strokeWidth="1" />
        <line x1={PAD.l} y1={toY(maxRange)} x2={W - PAD.r} y2={toY(maxRange)}
          stroke="rgba(16,185,129,0.3)" strokeDasharray="4,4" strokeWidth="1" />

        {/* Range labels */}
        <text x={PAD.l - 5} y={toY(minRange) + 4} textAnchor="end" fill="rgba(16,185,129,0.5)" fontSize="10">{minRange}°</text>
        <text x={PAD.l - 5} y={toY(maxRange) + 4} textAnchor="end" fill="rgba(16,185,129,0.5)" fontSize="10">{maxRange}°</text>

        {/* Line */}
        <polyline points={points.join(' ')} fill="none" stroke="#10b981" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots */}
        {readings.map((r, i) => {
          const inRange = r.temperature >= minRange && r.temperature <= maxRange
          return (
            <circle key={i} cx={toX(i)} cy={toY(r.temperature)} r="3.5"
              fill={inRange ? '#10b981' : '#ef4444'}
              stroke={inRange ? '#059669' : '#dc2626'} strokeWidth="1.5" />
          )
        })}

        {/* Date labels (first and last) */}
        <text x={PAD.l} y={H - 5} textAnchor="start" fill="rgba(255,255,255,0.25)" fontSize="10">
          {readings[0].date}
        </text>
        <text x={W - PAD.r} y={H - 5} textAnchor="end" fill="rgba(255,255,255,0.25)" fontSize="10">
          {readings[readings.length - 1].date}
        </text>
      </svg>
    </div>
  )
}
```

**TemperatureLog.jsx changes:**

1. Import: `import TemperatureChart from '../components/TemperatureChart'`

2. Compute chart data (after `sorted` is defined):
```js
const chartData = useMemo(() => {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 14)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  // Get readings from last 14 days, one per day (average if multiple)
  const byDate = {}
  logs.forEach(l => {
    if (l.date >= cutoffStr) {
      if (!byDate[l.date]) byDate[l.date] = []
      byDate[l.date].push(parseFloat(l.temperature))
    }
  })

  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, temps]) => ({
      date,
      temperature: temps.reduce((a, b) => a + b, 0) / temps.length,
    }))
}, [logs])
```

3. Render chart between the form and the table (add `import { useMemo } from 'react'` if not already imported):
```jsx
<TemperatureChart readings={chartData} minRange={IN_RANGE_MIN} maxRange={IN_RANGE_MAX} />
```

**Verification:**
- `npm run build` passes
- Temperature Log page shows chart above the table
- Green band between 2°C and 8°C dashed lines
- Dots are green (in range) or red (out of range)
- With 0-1 readings, chart doesn't render (returns null)
- Responsive: chart scales down on mobile

**Commit:** `feat: add 14-day temperature trend chart with safe range band`

---

## Execution Order Summary

| Task | Description | Dependencies |
|---|---|---|
| 1 | Audit trail utility | None |
| 2 | Wire audit trail into all pages | Task 1 |
| 3 | Score history persistence | None |
| 4 | Real RP sessions | None |
| 5 | Streak calculation | None |
| 6 | Action items CRUD | Task 1 (for audit) |
| 7 | Notification prefs wiring | None |
| 8 | Incidents page | Task 1 (for audit) |
| 9 | Near-miss log page | Task 1 (for audit) |
| 10 | Document categories + seed | None |
| 11 | Pharmacy config | None |
| 12 | Temperature chart | None |

**Parallelizable groups:**
- Batch 1: Tasks 1 (audit utility — prerequisite)
- Batch 2: Tasks 2, 3, 4, 5 (fixes that touch existing files — some overlap in Dashboard.jsx)
- Batch 3: Tasks 6, 7 (more Dashboard fixes)
- Batch 4: Tasks 8, 9 (new pages — independent of each other)
- Batch 5: Tasks 10, 11, 12 (enhancements — independent of each other)

**New Supabase tables required before implementation:**
1. `near_misses` — Task 9
2. `pharmacy_config` — Task 11

These must be created in the Supabase dashboard before running those tasks.
