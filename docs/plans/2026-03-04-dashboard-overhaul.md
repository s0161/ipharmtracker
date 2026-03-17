# Dashboard Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the Dashboard from a flat list of cards into a data-rich command center with drill-downs, heatmap, RP timeline, daily progress bar, and merged task schedule.

**Architecture:** Remove the separate ShiftChecklist (redundant with Today accordion). Add three new visualization components (DailyProgressBar, ComplianceHeatmap, RPTimeline). Add drill-down expansion to ComplianceHealth tiles. Enhance AccPanel's Today variant with time-sensitive/anytime grouping. All data sources already exist — no Supabase changes needed.

**Tech Stack:** React 18, Tailwind CSS v3, existing `useSupabase` hook, localStorage `ipd_score_history`

---

### Task 1: Create DailyProgressBar Component

**Files:**
- Create: `src/components/dashboard/DailyProgressBar.jsx`

**What it does:** A horizontal progress bar in the header showing daily task completion. Replaces the lone ProgressRing as the primary "how am I doing today" signal.

**Step 1: Create the component**

```jsx
// src/components/dashboard/DailyProgressBar.jsx
// Props: { done, total, overdue, dueToday }
// Renders:
//   - Fraction text: "7 of 12 tasks complete"
//   - Animated fill bar (emerald when >80%, amber 50-80%, red <50%)
//   - Percentage label at right
//   - Bar should animate from 0 to target width on mount (CSS transition)
//   - If all done, show emerald glow effect
```

The component should be ~40-50 lines. Use Tailwind classes. The bar fill should use `transition-all duration-700 ease-out` with a 300ms delay so it animates after the page loads.

Color logic: `done/total >= 0.8 → ec-em`, `>= 0.5 → ec-warn`, `< 0.5 → ec-crit`.

**Step 2: Verify it renders**

Import into Dashboard.jsx temporarily, pass hardcoded props, check it renders in `npm run dev`.

**Step 3: Commit**

```bash
git add src/components/dashboard/DailyProgressBar.jsx
git commit -m "feat(dashboard): add DailyProgressBar component"
```

---

### Task 2: Create ComplianceHeatmap Component

**Files:**
- Create: `src/components/dashboard/ComplianceHeatmap.jsx`

**What it does:** A GitHub-style 30-day heatmap grid showing daily overall compliance scores. Data comes from `localStorage('ipd_score_history')` which stores `{ "2026-03-03": { documents: 80, training: 100, cleaning: 60, safeguarding: 100 }, ... }`.

**Step 1: Create the component**

```jsx
// src/components/dashboard/ComplianceHeatmap.jsx
// Props: { scoreHistory, todayScore }
// - scoreHistory: array of [dateStr, { documents, training, cleaning, safeguarding }] sorted by date
// - todayScore: number (current overall %)
//
// Renders:
//   - Title: "30-Day Compliance" with small info text
//   - Grid of 30 cells (5 rows x 6 cols or 6 rows x 5 cols)
//   - Each cell = one day, most recent at bottom-right
//   - Cell color: score >= 80 → emerald shades, 50-80 → amber shades, <50 → red shades
//   - Empty days (no data) → ec-div color
//   - Hover state: show tooltip with date + score
//   - Use CSS grid: `grid-cols-6 gap-1`
//   - Cell size: 14x14px rounded-[3px]
```

Build the 30-day array by iterating from 29 days ago to today. For each day, look up the score in the history object. Calculate overall as average of the 4 sub-scores. Today's score should use the live `todayScore` prop.

Color mapping for cells (use inline style):
- `>= 90`: `rgba(16,185,129, 0.7)`
- `>= 80`: `rgba(16,185,129, 0.45)`
- `>= 60`: `rgba(245,158,11, 0.45)`
- `>= 40`: `rgba(245,158,11, 0.25)`
- `< 40`: `rgba(239,68,68, 0.45)`
- No data: `var(--ec-div)`

Tooltip: Use a `useState(hoveredDay)` + absolute positioned div. Show date in "3 Mar" format + score + "%" or "No data".

**Step 2: Commit**

```bash
git add src/components/dashboard/ComplianceHeatmap.jsx
git commit -m "feat(dashboard): add 30-day ComplianceHeatmap component"
```

---

### Task 3: Create RPTimeline Component

**Files:**
- Create: `src/components/dashboard/RPTimeline.jsx`

**What it does:** A horizontal timeline bar showing RP coverage through the day. Green blocks = RP signed in. Red gaps = no RP. Uses data from `todayRp.sessions`.

**Step 1: Create the component**

```jsx
// src/components/dashboard/RPTimeline.jsx
// Props: { sessions, rpName, pharmacyHours }
// - sessions: array of { start: "09:00", end: "13:30" | "ongoing", name, dur }
// - rpName: string
// - pharmacyHours: { open: "09:00", close: "18:00" } (default)
//
// Renders:
//   - Section header: "RP Coverage Today"
//   - Horizontal bar spanning pharmacy open→close hours
//   - Hour markers at bottom (9, 10, 11, ... 18)
//   - Green filled blocks for each session
//   - Red/empty gaps between sessions
//   - Current time indicator (thin white line) if within hours
//   - Coverage summary: "6h 30m covered · 1h 30m gap"
//   - If no sessions: show full red bar with "No RP coverage recorded"
```

Implementation approach:
- Bar is a `relative` div with `h-3 rounded-full bg-ec-div` (the track)
- Sessions are `absolute` positioned divs inside, with `left` and `width` calculated as percentages of total pharmacy hours
- Convert "HH:MM" strings to minutes-since-midnight for calculation
- Gaps are implicitly the uncovered areas (the track background shows through)
- Current time marker: thin `w-px h-5 bg-ec-t1` absolutely positioned

Hour labels below the bar: flex row with `justify-between`, show every hour from open to close.

**Step 2: Commit**

```bash
git add src/components/dashboard/RPTimeline.jsx
git commit -m "feat(dashboard): add RPTimeline coverage bar component"
```

---

### Task 4: Add Drill-Down to ComplianceHealth

**Files:**
- Modify: `src/components/dashboard/ComplianceHealth.jsx`

**What it does:** When a user clicks a compliance tile, it expands to show the specific items dragging the score down. Click again to collapse.

**Step 1: Add drill-down data to props**

Update the `areas` prop shape in Dashboard.jsx to include drill-down items:

```js
// In Dashboard.jsx, update complianceAreas to include:
{
  label: 'DOCUMENTS',
  pct: docScore,
  // ... existing fields ...
  drilldown: documents
    .filter(d => getTrafficLight(d.expiryDate) !== 'green')
    .map(d => ({
      name: d.name || d.title,
      status: getTrafficLight(d.expiryDate), // 'amber' or 'red'
      detail: d.expiryDate ? `Expires ${new Date(d.expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : 'No expiry set',
    })),
  total: documents.length,
  current: greenCount,
}
```

Similar patterns for Training (incomplete items), Cleaning (overdue tasks), Safeguarding (non-current records).

**Step 2: Modify ComplianceHealth.jsx**

Add an `expandedTile` state (index or null). On tile click, toggle expansion. Below the tile's sparkline, render a collapsible list:

```jsx
// Inside each tile, after the Sparkline:
{expandedTile === i && c.drilldown?.length > 0 && (
  <div className="w-full mt-2 pt-2 border-t border-ec-div">
    {c.drilldown.slice(0, 5).map((item, j) => (
      <div key={j} className="flex items-center gap-1.5 py-1 text-[10px]">
        <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'red' ? 'bg-ec-crit' : 'bg-ec-warn'}`} />
        <span className="text-ec-t2 flex-1 truncate">{item.name}</span>
        <span className="text-ec-t3">{item.detail}</span>
      </div>
    ))}
    {c.drilldown.length > 5 && (
      <div className="text-[10px] text-ec-t3 mt-1">+{c.drilldown.length - 5} more</div>
    )}
  </div>
)}
```

Add a fraction display on each tile: show `"{current}/{total} current"` below the label.

Tile click handler: `onClick={() => setExpandedTile(expandedTile === i ? null : i)}` with `cursor-pointer`.

The expanded area should animate with `max-height` + `opacity` transitions (same pattern as AccPanel).

**Step 3: Commit**

```bash
git add src/components/dashboard/ComplianceHealth.jsx src/pages/Dashboard.jsx
git commit -m "feat(dashboard): add compliance tile drill-down with failing items"
```

---

### Task 5: Enhance AccPanel Today Variant

**Files:**
- Modify: `src/components/dashboard/AccPanel.jsx`

**What it does:** When `isToday` is true, the AccPanel should split tasks into TIME-SENSITIVE (tasks with `.time`) and ANYTIME groups, matching the layout that ShiftChecklist currently provides. Also add the streak footer.

**Step 1: Update AccPanel props and rendering**

Add `streakDays` prop. When `isToday`:

```jsx
// Inside the collapsible body, when isToday:
const timeSensitive = tasks.filter(t => t.time)
const anytime = tasks.filter(t => !t.time)

// Render TIME-SENSITIVE group header (red dot + label) + tasks
// Then divider
// Then ANYTIME group header (gray dot + label) + tasks
// Then streak footer: "🔥 {streakDays} days fully completed"
```

Copy the group header styling from ShiftChecklist.jsx:
- TIME-SENSITIVE: `text-[9px] font-bold text-ec-crit tracking-[1.2px] uppercase` with red dot
- ANYTIME: `text-[9px] font-bold text-ec-t3 tracking-[1.2px] uppercase` with gray dot

When NOT `isToday`, render tasks as a flat list (current behavior).

**Step 2: Commit**

```bash
git add src/components/dashboard/AccPanel.jsx
git commit -m "feat(dashboard): add time-sensitive/anytime grouping to Today accordion"
```

---

### Task 6: Restructure Dashboard.jsx

**Files:**
- Modify: `src/pages/Dashboard.jsx`

**What it does:** Remove ShiftChecklist, add new components, restructure the layout.

**Step 1: Update imports**

Remove `ShiftChecklist` from the import. Add:

```js
import DailyProgressBar from '../components/dashboard/DailyProgressBar'
import ComplianceHeatmap from '../components/dashboard/ComplianceHeatmap'
import RPTimeline from '../components/dashboard/RPTimeline'
```

Also update the barrel export in `src/components/dashboard/index.js` to add the three new components.

**Step 2: Compute daily progress data**

After the existing task building section, add:

```js
// Daily progress (all frequencies combined for today)
const totalDailyTasks = todayTasks.length
const completedDailyTasks = todayTasks.filter(t => checked.has(t.id)).length
```

These already exist as `todayChecked` and `todayTasks.length` — reuse them.

**Step 3: Build drill-down data for compliance areas**

Update the `complianceAreas` array to include `drilldown`, `total`, and `current` fields for each area:

- **Documents:** Filter documents where `getTrafficLight(d.expiryDate) !== 'green'`, map to `{ name, status, detail }`
- **Training:** Filter `staffTraining` where `status !== 'Complete'`, map to `{ name: staffName + ' - ' + topic, status: 'amber', detail: status }`
- **Cleaning:** Use `overdueCleaningTasks`, map to `{ name: taskName, status: 'red', detail: 'Overdue' }`
- **Safeguarding:** Filter `safeguarding` where status isn't 'current', map to `{ name: staffName, status, detail: trainingDate }`

**Step 4: Restructure the JSX layout**

Replace the current render with:

```
1. Confetti (unchanged)
2. HEADER — Restructured:
   - Left: Greeting + date/time (unchanged)
   - Center: DailyProgressBar (new)
   - Right: Overdue + Due Today + NotificationBell + GPhC badge (moved from own row)
3. RP PRESENCE BAR (unchanged)
4. TWO-COLUMN STRIP — Changed:
   - Left (60%): ComplianceHealth with drill-down
   - Right (40%): ComplianceHeatmap (replaces duplicate shift checklist spot)
5. RP TIMELINE (new full-width section)
6. ALERT BANNER (unchanged)
7. TASK SCHEDULE with merged Today (pass streakDays to AccPanel)
8. TO DO (unchanged)
9. FOOTER (unchanged)
10. FAB + scroll fade (unchanged)
```

Remove: The `<ShiftChecklist ... />` JSX block and all its props (the `hovCard`/`onHoverCard` for 'shift' can be removed).

Remove: The Analytics Summary `<Link>` section (the heatmap replaces it).

**Step 5: Pass streakDays to AccPanel Today**

```jsx
<AccPanel
  id="today" title="Today" tasks={todayTasks} isToday
  open={acc.today} onToggle={() => setAcc(p => ({ ...p, today: !p.today }))}
  checked={checked} onToggleCheck={toggleCheck} justChecked={justChecked}
  rpSubChecks={rpSubChecks} onToggleRpSub={toggleRpSub}
  expandedNote={expandedNote} onToggleNote={toggleNote}
  expandedSubchecks={expandedSubchecks} onToggleSubchecks={toggleSubchecks}
  streakDays={streakDays}
/>
```

**Step 6: Wire RPTimeline**

Place between the compliance strip and alert banner:

```jsx
<RPTimeline
  sessions={sessions}
  rpName={rpAssignee}
/>
```

**Step 7: Wire ComplianceHeatmap**

In the two-column strip (right column):

```jsx
<ComplianceHeatmap
  scoreHistory={scoreHistoryEntries}
  todayScore={overallScore}
/>
```

**Step 8: Commit**

```bash
git add src/pages/Dashboard.jsx src/components/dashboard/index.js
git commit -m "feat(dashboard): restructure layout with heatmap, timeline, progress bar, drill-downs"
```

---

### Task 7: Update Exports, Verify Build, Polish

**Files:**
- Modify: `src/components/dashboard/index.js`

**Step 1: Update barrel exports**

Add three new exports:

```js
export { default as DailyProgressBar } from './DailyProgressBar'
export { default as ComplianceHeatmap } from './ComplianceHeatmap'
export { default as RPTimeline } from './RPTimeline'
```

**Step 2: Run build**

```bash
npm run build
```

Fix any errors.

**Step 3: Visual verification in dev**

```bash
npm run dev
```

Check:
- [ ] DailyProgressBar animates from 0 to target
- [ ] ComplianceHeatmap shows 30 cells with color coding
- [ ] Heatmap hover tooltips show date + score
- [ ] RPTimeline shows sessions as green blocks
- [ ] RPTimeline shows current time indicator
- [ ] Compliance tiles are clickable → drill-down expands
- [ ] Drill-down shows failing items with status dots
- [ ] Today accordion has TIME-SENSITIVE / ANYTIME groups
- [ ] Streak footer shows in Today accordion
- [ ] ShiftChecklist is fully removed (no duplicate task display)
- [ ] Analytics link is removed (replaced by heatmap)
- [ ] No console errors
- [ ] Mobile responsive (columns stack, heatmap wraps)

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(dashboard): complete overhaul with data-rich visualizations"
```

---

## Summary

| # | Task | Files | Lines (est.) |
|---|------|-------|-------------|
| 1 | DailyProgressBar | Create 1 | ~50 |
| 2 | ComplianceHeatmap | Create 1 | ~90 |
| 3 | RPTimeline | Create 1 | ~80 |
| 4 | ComplianceHealth drill-down | Modify 1 | ~60 added |
| 5 | AccPanel Today enhancement | Modify 1 | ~30 added |
| 6 | Dashboard.jsx restructure | Modify 2 | ~80 changed |
| 7 | Exports + verify | Modify 1 | ~5 |

**Total: ~400 lines added/changed across 7 files**
**Net effect: ~130 lines removed (ShiftChecklist wiring), ~400 lines added = ~270 net new lines**
