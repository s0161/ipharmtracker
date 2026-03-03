# Full App Restyle — Emerald Command Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restyle all 11 remaining pages + shared components to match the Emerald Command dark theme so the entire app looks premium and cohesive.

**Architecture:** Page-by-page conversion from old CSS class names to Tailwind `ec-*` utilities. Each page keeps its exact functionality — only JSX className attributes and inline styles change. Shared components (Modal, Toast) are restyled first since they're used everywhere.

**Tech Stack:** React, Tailwind CSS v3 (already configured with `ec-*` palette), existing `useSupabase` hook, existing component structure.

**Key Pattern Reference:** All pages use these Tailwind patterns:
- Page wrapper: no wrapper class needed (Layout provides dark bg)
- Cards/sections: `bg-white/[0.025] border border-white/[0.06] rounded-2xl p-5`
- Tables: `w-full` with `border-b border-white/[0.04]` rows, `text-ec-t1` text, `hover:bg-white/[0.03]` rows
- Inputs: `w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-ec-t1 placeholder:text-ec-t3 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors`
- Select: same as input
- Buttons primary: `px-4 py-2 bg-ec-em text-white font-semibold rounded-lg text-sm border-none cursor-pointer hover:bg-ec-em-dark transition-colors`
- Buttons ghost: `px-3 py-1.5 bg-white/[0.05] text-ec-t2 rounded-lg text-sm border border-white/[0.06] cursor-pointer hover:bg-white/[0.08] hover:text-ec-t1 transition-colors`
- Buttons danger: `px-3 py-1.5 bg-ec-crit/10 text-ec-crit-light rounded-lg text-sm border border-ec-crit/20 cursor-pointer hover:bg-ec-crit/20 transition-colors`
- Labels: `text-xs font-semibold text-ec-t2 mb-1 block`
- Status badges: green `bg-ec-em/10 text-ec-em px-2 py-0.5 rounded-full text-xs font-semibold`, amber `bg-ec-warn/10 text-ec-warn`, red `bg-ec-crit/10 text-ec-crit-light`
- Empty states: `text-center py-12 text-ec-t3 text-sm`
- Page descriptions: `text-sm text-ec-t3 mb-4`
- Section titles: `text-base font-bold text-ec-t1 mb-3`
- Dividers: `border-t border-white/[0.04]`
- Form actions row: `flex justify-end gap-2 mt-4`
- Form group: `mb-4` or `space-y-4`
- Form row (side-by-side): `grid grid-cols-2 gap-4`
- Summary cards: `bg-white/[0.025] border border-white/[0.06] rounded-xl p-4 text-center cursor-pointer hover:bg-white/[0.04] transition-colors`
- Filter bar: `flex flex-wrap gap-2 items-center mb-4`
- Search input: same input pattern with search icon absolutely positioned

---

### Task 1: Restyle Modal.jsx

**Files:**
- Modify: `src/components/Modal.jsx`

**Step 1: Rewrite Modal with Tailwind**

Replace entire JSX. Keep the same props (`open`, `onClose`, `title`, `children`) and the same overlay-click-to-close + body overflow logic.

```jsx
import { useEffect, useRef } from 'react'

export default function Modal({ open, onClose, title, children }) {
  const overlayRef = useRef()

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6 ec-fadeup"
        style={{
          backgroundColor: '#141414',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-ec-t1">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/[0.05] text-ec-t3 hover:bg-white/[0.1] hover:text-ec-t1 transition-colors border-none cursor-pointer"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  )
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: passes

**Step 3: Commit**

```bash
git add src/components/Modal.jsx
git commit -m "style: restyle Modal with Emerald Command dark theme"
```

---

### Task 2: Restyle Toast.jsx

**Files:**
- Modify: `src/components/Toast.jsx`

**Step 1: Rewrite Toast with Tailwind**

Keep the same context/hook pattern. Only change the JSX rendering. Toast container: fixed bottom-right. Toast items: dark glassmorphic pills with colored left border.

```jsx
// Toast container className:
"fixed bottom-4 right-4 z-[100] flex flex-col gap-2"

// Toast item:
"flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm cursor-pointer ec-fadeup"
// with style for each type:
// success: { bg: '#141414', borderLeft: '3px solid #10b981', color: '#e4e4e7' }
// error: { bg: '#141414', borderLeft: '3px solid #ef4444', color: '#fca5a5' }
// info: { bg: '#141414', borderLeft: '3px solid #6366f1', color: '#a5b4fc' }
// Icon colors: success=#10b981, error=#ef4444, info=#6366f1
```

**Step 2: Verify build**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/components/Toast.jsx
git commit -m "style: restyle Toast with dark glassmorphic design"
```

---

### Task 3: Restyle PageActions.jsx

**Files:**
- Modify: `src/components/PageActions.jsx`

**Step 1: Replace CSS classes with Tailwind**

```jsx
export default function PageActions({ onDownloadCsv }) {
  return (
    <div className="flex gap-2 no-print">
      <button className="px-3 py-1.5 bg-white/[0.05] text-ec-t2 rounded-lg text-xs border border-white/[0.06] cursor-pointer hover:bg-white/[0.08] hover:text-ec-t1 transition-colors flex items-center gap-1.5 font-sans" onClick={onDownloadCsv}>
        {/* same SVG */}
        CSV
      </button>
      <button className="px-3 py-1.5 bg-white/[0.05] text-ec-t2 rounded-lg text-xs border border-white/[0.06] cursor-pointer hover:bg-white/[0.08] hover:text-ec-t1 transition-colors flex items-center gap-1.5 font-sans" onClick={() => window.print()}>
        {/* same SVG */}
        Print
      </button>
    </div>
  )
}
```

**Step 2: Verify + Commit**

```bash
git add src/components/PageActions.jsx
git commit -m "style: restyle PageActions with Tailwind"
```

---

### Task 4: Restyle Login.jsx

**Files:**
- Modify: `src/pages/Login.jsx`

**Step 1: Rewrite Login with premium dark card**

Full-screen dark background with centered glassmorphic card. Emerald gradient logo square. Keep exact same auth logic.

The login card: centered vertically/horizontally, max-w-sm, dark card with border, emerald gradient iPD logo, title, subtitle, password input with emerald focus ring, emerald login button, red error text.

**Step 2: Verify + Commit**

```bash
git add src/pages/Login.jsx
git commit -m "style: premium dark login screen"
```

---

### Task 5: Restyle PinSelect.jsx

**Files:**
- Modify: `src/pages/PinSelect.jsx`

**Step 1: Rewrite PinSelect with dark theme**

Three views to restyle:
1. Loading: dark bg + emerald spinner text
2. Staff grid: dark bg, emerald logo, staff buttons as glassmorphic cards with avatar circles (emerald gradient bg), manager badge
3. PIN entry: dark bg, back button, large avatar, emerald-filled PIN dots, dark numpad buttons with hover

Keep all keyboard/touch handlers unchanged. Only change className values and inline styles.

**Step 2: Verify + Commit**

```bash
git add src/pages/PinSelect.jsx
git commit -m "style: premium dark PIN selection screen"
```

---

### Task 6: Restyle MyTasks.jsx

**Files:**
- Modify: `src/pages/MyTasks.jsx`

**Step 1: Rewrite JSX with Tailwind classes**

Replace all `my-tasks-*`, `team-*`, `assign-*` class names with Tailwind utilities:
- Header: greeting in `text-lg font-bold text-ec-t1`, date in `text-sm text-ec-t3`
- Task list: dark card, task items with checkbox (emerald when done), task name, frequency badge
- Team grid (manager): dark cards per staff with avatar, name, progress fraction or checkmark
- Assign button: emerald primary style
- Assign modal form: uses restyled Modal + Tailwind input/select/button patterns

**UX Fix:** Change greeting cutoff from 18:00 to 17:00 to match Dashboard.

**Step 2: Verify + Commit**

```bash
git add src/pages/MyTasks.jsx
git commit -m "style: restyle MyTasks with Emerald Command theme"
```

---

### Task 7: Restyle RPLog.jsx

**Files:**
- Modify: `src/pages/RPLog.jsx`

**Step 1: Rewrite JSX with Tailwind classes**

Replace all `rp-*`, `page-*`, `form-*`, `table` class names:
- Sticky date banner: dark with emerald/red status indicator
- Form section: dark card with date picker, RP name, completion progress bar
- Checklist groups: section headers with counter, checkbox items with emerald checked state
- Notes textarea, save button
- History table: dark rows, completion badge (green when 100%, amber otherwise)

**UX Fix:** Auto-save — replace manual save button with auto-save on each toggle/change. Use a debounced effect that saves after 500ms of no changes.

**Step 2: Verify + Commit**

```bash
git add src/pages/RPLog.jsx
git commit -m "style: restyle RPLog with Emerald Command theme + auto-save"
```

---

### Task 8: Restyle CleaningRota.jsx

**Files:**
- Modify: `src/pages/CleaningRota.jsx`

**Step 1: Rewrite JSX with Tailwind classes**

Replace all `page-*`, `table`, `form-*`, `result-badge`, `action-btns` class names:
- Page header with description + actions
- Table: dark rows, result badge (Pass=green, Action Taken=amber)
- Modal form: Tailwind inputs, selects, buttons
- Empty state: centered text

**Step 2: Verify + Commit**

```bash
git add src/pages/CleaningRota.jsx
git commit -m "style: restyle CleaningRota with Emerald Command theme"
```

---

### Task 9: Restyle DocumentTracker.jsx

**Files:**
- Modify: `src/pages/DocumentTracker.jsx`

**Step 1: Rewrite JSX with Tailwind classes**

Replace all `doc-alert-*`, `traffic-*`, `page-*`, `table`, `form-*` class names:
- Alert banner: dark card with red/amber dot indicators per doc
- Category filter: Tailwind select
- Table: status dot (green/amber/red), document name bold, category badge, dates, notes
- Modal form: Tailwind inputs

**Step 2: Verify + Commit**

```bash
git add src/pages/DocumentTracker.jsx
git commit -m "style: restyle DocumentTracker with Emerald Command theme"
```

---

### Task 10: Restyle StaffTraining.jsx

**Files:**
- Modify: `src/pages/StaffTraining.jsx`

**Step 1: Rewrite JSX with Tailwind classes**

Replace all `training-*`, `progress-*`, `search-*`, `status-badge-*`, `table` class names:
- Summary cards: 3 cards (Pending amber, In Progress blue, Complete green) with counts
- Staff progress bars: dark cards with emerald fill bar
- Filter bar: search input + 3 select dropdowns + clear button
- Table: sortable headers, status badge buttons (click to cycle), action buttons
- Modal form

**Step 2: Verify + Commit**

```bash
git add src/pages/StaffTraining.jsx
git commit -m "style: restyle StaffTraining with Emerald Command theme"
```

---

### Task 11: Restyle SafeguardingTraining.jsx

**Files:**
- Modify: `src/pages/SafeguardingTraining.jsx`

**Step 1: Rewrite JSX with Tailwind classes**

Replace all `sg-*`, `training-row-*`, `signed-badge-*`, `traffic-dot-*`, `table` class names:
- Summary banner: 4 stat items (Trained, Current green, Due Soon amber, Overdue red)
- Table: staff name, job title, dates, signed-off toggle button, status with colored dot
- Reference docs: collapsible section (add `useState` for open/closed), doc cards in grid

**Step 2: Verify + Commit**

```bash
git add src/pages/SafeguardingTraining.jsx
git commit -m "style: restyle SafeguardingTraining with Emerald Command theme"
```

---

### Task 12: Restyle TemperatureLog.jsx

**Files:**
- Modify: `src/pages/TemperatureLog.jsx`

**Step 1: Rewrite JSX with Tailwind classes**

Replace all `temp-*`, `alert-banner-*`, `page-*`, `form-*`, `table` class names:
- Warning banner (no reading today): dark card with amber left border + warning icon
- Form: dark card with date/time/temp/loggedBy/notes inputs in grid layout
- Table: date bold, time, temperature with colored indicator (green in-range, red out-of-range with warning icon)
- Out-of-range rows: subtle red background tint `bg-ec-crit/[0.04]`

**Step 2: Verify + Commit**

```bash
git add src/pages/TemperatureLog.jsx
git commit -m "style: restyle TemperatureLog with Emerald Command theme"
```

---

### Task 13: Restyle TrainingLogs.jsx

**Files:**
- Modify: `src/pages/TrainingLogs.jsx`

**Step 1: Rewrite JSX with Tailwind classes**

Replace all `training-summary-*`, `training-filters-*`, `search-*`, `status-badge-*`, `table` class names:
- Stats row: 4 summary cards (Total Records, This Month, Expiring, Staff Trained)
- Filter bar: search input + staff dropdown + topic dropdown + clear button
- Results count: `text-xs text-ec-t3`
- Table: staff, date, topic, trainer, cert expiry, status badge, notes, actions
- Modal form: comprehensive with delivery method, outcome, dates

**Step 2: Verify + Commit**

```bash
git add src/pages/TrainingLogs.jsx
git commit -m "style: restyle TrainingLogs with Emerald Command theme"
```

---

### Task 14: Restyle Settings.jsx

**Files:**
- Modify: `src/pages/Settings.jsx`

**Step 1: Rewrite JSX with Tailwind classes**

Replace all `settings-*`, `data-mgmt-*`, `table` class names. Settings has multiple sub-components:

- **StaffManager**: dark card, add form with input+button, staff list items with name, manager toggle (emerald checkbox), PIN edit inline, remove button
- **ListManager**: dark card, add form, item list with remove
- **TaskManager**: dark card, add form with frequency dropdown, task list with frequency selector + remove
- **Pharmacy Details**: dark card, 2x2 grid of label/value pairs
- **Notification Preferences**: dark card, checkbox toggles with labels
- **Data Management**: dark card, backend status dot, export/import/clear buttons, delete duplicates button
- **Weekly Report**: dark card, generate button
- **Audit Trail**: dark card, toggle button, dark table when visible
- **Logout**: separated with top border

Each section: `bg-white/[0.025] border border-white/[0.06] rounded-2xl p-5 mb-4`
Section titles: `text-base font-bold text-ec-t1 mb-1`
Section descriptions: `text-sm text-ec-t3 mb-4`

**UX Fix:** Data clear already has 2-step confirmation (two `window.confirm`). That's sufficient.

**Step 2: Verify + Commit**

```bash
git add src/pages/Settings.jsx
git commit -m "style: restyle Settings with Emerald Command theme"
```

---

### Task 15: Cleanup + Final Verification

**Files:**
- Delete: `src/pages/DashboardStage1.jsx`
- Modify: `src/App.jsx` (remove DashboardStage1 route if any)

**Step 1: Delete legacy file**

```bash
rm src/pages/DashboardStage1.jsx
```

**Step 2: Final build verification**

Run: `npm run build`
Expected: passes with no errors

**Step 3: Visual spot-check list**

Navigate each route and verify:
- [ ] Login: dark bg, glassmorphic card, emerald logo
- [ ] PinSelect: dark bg, staff cards, emerald avatar dots, dark numpad
- [ ] Dashboard: already done
- [ ] MyTasks: dark cards, emerald checkmarks, team grid
- [ ] RPLog: dark card, emerald checkmarks, auto-saves
- [ ] CleaningRota: dark table, pass/fail badges
- [ ] DocumentTracker: dark table, traffic light dots
- [ ] StaffTraining: summary cards, progress bars, status badges
- [ ] SafeguardingTraining: summary banner, collapsible docs
- [ ] TemperatureLog: form + table, out-of-range red highlight
- [ ] TrainingLogs: stats + filter bar + table
- [ ] Settings: all sections dark, buttons styled
- [ ] Modal: dark glassmorphic overlay (test from any page with add button)
- [ ] Toast: dark pill with colored left border (test by adding/saving anything)

**Step 4: Final commit + deploy**

```bash
git add -A
git commit -m "chore: remove legacy DashboardStage1"
```

---

## Execution Batches

**Batch 1 (Tasks 1-3):** Modal, Toast, PageActions — shared components, quick wins
**Batch 2 (Tasks 4-5):** Login, PinSelect — first impression screens
**Batch 3 (Tasks 6-8):** MyTasks, RPLog, CleaningRota — daily workflow pages
**Batch 4 (Tasks 9-11):** DocumentTracker, StaffTraining, SafeguardingTraining — compliance pages
**Batch 5 (Tasks 12-15):** TemperatureLog, TrainingLogs, Settings, cleanup — final pages + verification
