# Dashboard Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the pharmacy dashboard to surface critical compliance issues prominently, segment the action counter, add compliance score cards, restyle quick-nav tiles, improve kanban card type distinction, and enhance the My Day sidebar.

**Architecture:** Extract internal components from the 1,488-line `Dashboard.jsx` monolith into `src/components/dashboard/`. Dashboard becomes a data orchestrator (~400-500 lines) that fetches via existing `useSupabase` hooks and passes props to focused child components. My Day panel stays inline (coupled to dashboard state).

**Tech Stack:** React 18, Vite 5, CSS (no preprocessor — all styles in `src/index.css`), existing `useSupabase` hook, existing `useUser` context.

**Design doc:** `docs/plans/2026-03-02-dashboard-redesign-design.md`

---

## Task 1: Scaffold Component Directory + Barrel Export

**Files:**
- Create: `src/components/dashboard/index.js`

**Step 1: Create the barrel file**

```js
export { default as AlertBanner } from './AlertBanner'
export { default as ActionCounter } from './ActionCounter'
export { default as ComplianceCards } from './ComplianceCards'
export { default as QuickLinks } from './QuickLinks'
export { default as KanbanBoard } from './KanbanBoard'
export { default as KanbanCard } from './KanbanCard'
export { default as CompletionModal } from './CompletionModal'
export { default as ProgressRing } from './ProgressRing'
```

**Step 2: Verify directory exists**

Run: `ls src/components/dashboard/`
Expected: `index.js`

**Step 3: Commit**

```bash
git add src/components/dashboard/index.js
git commit -m "chore: scaffold dashboard component directory with barrel export"
```

---

## Task 2: Extract ProgressRing Component

**Files:**
- Create: `src/components/dashboard/ProgressRing.jsx`
- Modify: `src/pages/Dashboard.jsx` (lines 119-139 — remove `ProgressRing` function, add import)

**Step 1: Create ProgressRing.jsx**

Extract the `ProgressRing` function (Dashboard.jsx lines 120-139) into its own file. It also needs the `scoreColor` helper (lines 20-24). Include `scoreColor` as a local function inside the file — it's small and avoids a circular dependency.

```jsx
import { useState, useEffect } from 'react'

function scoreColor(pct) {
  if (pct > 80) return 'var(--success)'
  if (pct >= 50) return 'var(--warning)'
  return 'var(--danger)'
}

export default function ProgressRing({ pct, size = 56, strokeWidth = 5 }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const [offset, setOffset] = useState(circumference)

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (pct / 100) * circumference)
    }, 100)
    return () => clearTimeout(timer)
  }, [pct, circumference])

  return (
    <svg className="progress-ring" width={size} height={size}>
      <circle className="progress-ring-bg" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} fill="none" stroke="var(--border)" />
      <circle className="progress-ring-fill" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} fill="none" stroke={scoreColor(pct)} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" className="progress-ring-text" fill={scoreColor(pct)}>{pct}%</text>
    </svg>
  )
}
```

**Step 2: Update Dashboard.jsx**

- Delete the `ProgressRing` function definition (lines 119-139)
- Add import: `import { ProgressRing } from '../components/dashboard'`
- Keep the `scoreColor` function in Dashboard.jsx — it's used elsewhere (AnimatedBar, etc.)

**Step 3: Verify build**

Run: `npx vite build 2>&1 | tail -5`
Expected: `✓ built in` with no errors

**Step 4: Commit**

```bash
git add src/components/dashboard/ProgressRing.jsx src/pages/Dashboard.jsx
git commit -m "refactor: extract ProgressRing into dashboard components"
```

---

## Task 3: Extract CompletionModal Component

**Files:**
- Create: `src/components/dashboard/CompletionModal.jsx`
- Modify: `src/pages/Dashboard.jsx` (lines 183-230 — remove `CompletionModal` function + `ALL_STAFF` constant)

**Step 1: Create CompletionModal.jsx**

Extract `CompletionModal` (lines 184-230) and the `ALL_STAFF` array (lines 178-181) it depends on.

```jsx
import { useState, useEffect } from 'react'
import Modal from '../Modal'

const ALL_STAFF = [
  'Moniba Jamil', 'Umama Khan', 'Sadaf Subhani', 'Salma Shakoor',
  'Urooj Khan', 'Shain Nawaz', 'Marian Hadaway', 'Jamila Adwan', 'Amjid Shakoor',
]

export default function CompletionModal({ open, taskName, assignedTo, onSubmit, onClose }) {
  // ... exact copy of existing function body from lines 185-229
}
```

Note: The import for `Modal` uses `'../Modal'` because the new file is at `src/components/dashboard/CompletionModal.jsx` and `Modal.jsx` is at `src/components/Modal.jsx`.

**Step 2: Update Dashboard.jsx**

- Delete `ALL_STAFF` (lines 178-181) and `CompletionModal` function (lines 183-230)
- Add import: `import { CompletionModal } from '../components/dashboard'`
- Remove the `Modal` import from Dashboard.jsx if no other usage exists (verify first — search for `<Modal` in the file)

**Step 3: Verify build**

Run: `npx vite build 2>&1 | tail -5`
Expected: `✓ built in` with no errors

**Step 4: Commit**

```bash
git add src/components/dashboard/CompletionModal.jsx src/pages/Dashboard.jsx
git commit -m "refactor: extract CompletionModal into dashboard components"
```

---

## Task 4: Extract KanbanCard Component

**Files:**
- Create: `src/components/dashboard/KanbanCard.jsx`
- Modify: `src/pages/Dashboard.jsx` (lines 232-326 — remove `KanbanCard` function)

**Step 1: Create KanbanCard.jsx**

Extract `KanbanCard` (lines 232-326). It depends on `getStaffInitials` which is already imported at the top of Dashboard.jsx.

```jsx
import { getStaffInitials } from '../../utils/rotationManager'

export default function KanbanCard({ card, onOpenCompletion, expandedRpCard, setExpandedRpCard, rpChecklist, onToggleRpItem }) {
  // ... exact copy of existing function body from lines 233-325
}
```

**Step 2: Update Dashboard.jsx**

- Delete `KanbanCard` function (lines 232-326)
- Add to import: `import { KanbanCard, CompletionModal } from '../components/dashboard'`

**Step 3: Verify build**

Run: `npx vite build 2>&1 | tail -5`
Expected: `✓ built in` with no errors

**Step 4: Commit**

```bash
git add src/components/dashboard/KanbanCard.jsx src/pages/Dashboard.jsx
git commit -m "refactor: extract KanbanCard into dashboard components"
```

---

## Task 5: Create AlertBanner Component

**Files:**
- Create: `src/components/dashboard/AlertBanner.jsx`
- Modify: `src/index.css` — add AlertBanner styles

**Step 1: Create AlertBanner.jsx**

This is a new component. It receives an array of `alerts` objects, each with `{ label, score, subtitle, nav }`.

```jsx
import { useNavigate } from 'react-router-dom'

export default function AlertBanner({ alerts }) {
  const navigate = useNavigate()
  if (!alerts || alerts.length === 0) return null

  return (
    <div className="alert-banner">
      {alerts.map((alert, i) => (
        <div key={i} className="alert-banner-item">
          <div className="alert-banner-left">
            <span className="alert-banner-dot" />
            <span className="alert-banner-msg">
              <strong>{alert.label}</strong> is at <strong>{alert.score}%</strong> — {alert.subtitle}
            </span>
          </div>
          <button className="alert-banner-action" onClick={() => navigate(alert.nav)}>
            Review {alert.label} &rarr;
          </button>
        </div>
      ))}
    </div>
  )
}
```

**Step 2: Add CSS to src/index.css**

Add below the existing `/* === Dashboard: Top Bar === */` section (around line 607), or create a new section before it:

```css
/* === Dashboard: Alert Banner === */
@keyframes slideDown {
  from { transform: translateY(-100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes alertPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.alert-banner {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  animation: slideDown 400ms ease-out;
}

.alert-banner-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: color-mix(in srgb, var(--danger) 8%, var(--bg-card));
  border: 1px solid color-mix(in srgb, var(--danger) 20%, var(--border));
  border-radius: var(--radius);
}

.alert-banner-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
}

.alert-banner-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--danger);
  flex-shrink: 0;
  animation: alertPulse 2s ease-in-out infinite;
}

.alert-banner-msg {
  font-size: 0.82rem;
  color: var(--text);
}

.alert-banner-action {
  background: none;
  border: 1px solid color-mix(in srgb, var(--danger) 30%, var(--border));
  color: var(--danger);
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.3rem 0.7rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--transition), border-color var(--transition);
}

.alert-banner-action:hover {
  background: color-mix(in srgb, var(--danger) 12%, transparent);
  border-color: var(--danger);
}

@media (max-width: 640px) {
  .alert-banner-item { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
}
```

**Step 3: Verify build**

Run: `npx vite build 2>&1 | tail -5`
Expected: `✓ built in` with no errors

**Step 4: Commit**

```bash
git add src/components/dashboard/AlertBanner.jsx src/index.css
git commit -m "feat: add AlertBanner component for critical compliance alerts"
```

---

## Task 6: Create ActionCounter Component

**Files:**
- Create: `src/components/dashboard/ActionCounter.jsx`
- Modify: `src/index.css` — add ActionCounter styles

**Step 1: Create ActionCounter.jsx**

Replaces the single "504 actions needed" badge. Receives `overdue`, `dueToday`, `upcoming` counts and an `onToggleOutstanding` callback.

```jsx
export default function ActionCounter({ overdue, dueToday, upcoming, onToggleOutstanding }) {
  const total = overdue + dueToday + upcoming
  if (total === 0) {
    return (
      <div className="action-counter">
        <span className="action-counter-clear">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          All Clear
        </span>
      </div>
    )
  }

  return (
    <button className="action-counter" onClick={onToggleOutstanding}>
      {overdue > 0 && (
        <span className="action-counter-seg action-counter-seg--overdue">
          <span className="action-counter-num">{overdue}</span>
          <span className="action-counter-label">Overdue</span>
        </span>
      )}
      {dueToday > 0 && (
        <span className="action-counter-seg action-counter-seg--today">
          <span className="action-counter-num">{dueToday}</span>
          <span className="action-counter-label">Due Today</span>
        </span>
      )}
      {upcoming > 0 && (
        <span className="action-counter-seg action-counter-seg--upcoming">
          <span className="action-counter-num">{upcoming}</span>
          <span className="action-counter-label">Upcoming</span>
        </span>
      )}
    </button>
  )
}
```

**Step 2: Add CSS to src/index.css**

```css
/* === Dashboard: Action Counter === */
.action-counter {
  display: flex;
  align-items: center;
  gap: 0;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0;
  cursor: pointer;
  transition: box-shadow var(--transition);
  overflow: hidden;
}

.action-counter:hover {
  box-shadow: var(--shadow-md);
}

.action-counter-clear {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 0.8rem;
  color: var(--success);
  font-size: 0.75rem;
  font-weight: 600;
}

.action-counter-seg {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.4rem 0.8rem;
  border-right: 1px solid var(--border);
}

.action-counter-seg:last-child { border-right: none; }

.action-counter-num {
  font-family: 'JetBrains Mono', 'SF Mono', monospace;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.2;
}

.action-counter-label {
  font-size: 0.58rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.action-counter-seg--overdue .action-counter-num { color: var(--danger); }
.action-counter-seg--overdue .action-counter-label { color: var(--danger); }
.action-counter-seg--today .action-counter-num { color: var(--warning); }
.action-counter-seg--today .action-counter-label { color: var(--warning); }
.action-counter-seg--upcoming .action-counter-num { color: var(--text-muted); }
.action-counter-seg--upcoming .action-counter-label { color: var(--text-muted); }
```

**Step 3: Verify build**

Run: `npx vite build 2>&1 | tail -5`

**Step 4: Commit**

```bash
git add src/components/dashboard/ActionCounter.jsx src/index.css
git commit -m "feat: add segmented ActionCounter component"
```

---

## Task 7: Create ComplianceCards Component

**Files:**
- Create: `src/components/dashboard/ComplianceCards.jsx`
- Modify: `src/index.css` — add ComplianceCards styles

**Step 1: Create ComplianceCards.jsx**

Receives an array of compliance area objects. Each has `{ label, score, subtitle, trend, nav }`.

```jsx
import { useNavigate } from 'react-router-dom'

function cardTier(score) {
  if (score < 25) return 'critical'
  if (score <= 70) return 'warning'
  return 'healthy'
}

function scoreColor(score) {
  if (score < 25) return 'var(--danger)'
  if (score <= 70) return 'var(--warning)'
  return 'var(--success)'
}

export default function ComplianceCards({ areas }) {
  const navigate = useNavigate()

  return (
    <div className="compliance-cards">
      {areas.map(area => {
        const tier = cardTier(area.score)
        return (
          <button
            key={area.label}
            className={`compliance-card compliance-card--${tier}`}
            onClick={() => navigate(area.nav)}
          >
            <div className="compliance-card-top">
              <span className="compliance-card-label">{area.label}</span>
              {area.trend && (
                <span className={`compliance-card-trend compliance-card-trend--${area.trend.direction}`}>
                  {area.trend.direction === 'up' ? '↑' : '↓'} {Math.abs(area.trend.value)}%
                </span>
              )}
            </div>
            <span className="compliance-card-score" style={{ color: scoreColor(area.score) }}>
              {area.score}%
            </span>
            <span className="compliance-card-subtitle">{area.subtitle}</span>
            <div className="compliance-card-bar">
              <div
                className="compliance-card-bar-fill"
                style={{ width: `${area.score}%`, background: scoreColor(area.score) }}
              />
            </div>
          </button>
        )
      })}
    </div>
  )
}
```

**Step 2: Add CSS to src/index.css**

```css
/* === Dashboard: Compliance Cards === */
.compliance-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.compliance-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-left: 3px solid var(--border);
  border-radius: var(--radius);
  padding: 1rem;
  cursor: pointer;
  text-align: left;
  transition: transform var(--transition), box-shadow var(--transition);
  animation: fadeIn 400ms ease;
}

.compliance-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.compliance-card--critical {
  border-left-color: var(--danger);
  background: color-mix(in srgb, var(--danger) 5%, var(--bg-card));
}

.compliance-card--warning {
  border-left-color: var(--warning);
  background: color-mix(in srgb, var(--warning) 4%, var(--bg-card));
}

.compliance-card--healthy {
  border-left-color: var(--success);
}

.compliance-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.3rem;
}

.compliance-card-label {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

.compliance-card-trend {
  font-size: 0.62rem;
  font-weight: 700;
  font-family: 'JetBrains Mono', 'SF Mono', monospace;
}

.compliance-card-trend--up { color: var(--success); }
.compliance-card-trend--down { color: var(--danger); }

.compliance-card-score {
  font-family: 'JetBrains Mono', 'SF Mono', monospace;
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.2;
  display: block;
}

.compliance-card-subtitle {
  font-size: 0.7rem;
  color: var(--text-secondary);
  display: block;
  margin-top: 0.15rem;
  margin-bottom: 0.5rem;
}

.compliance-card-bar {
  height: 4px;
  background: color-mix(in srgb, var(--border) 60%, transparent);
  border-radius: 2px;
  overflow: hidden;
}

.compliance-card-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 800ms ease-out;
}

@media (max-width: 900px) {
  .compliance-cards { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 480px) {
  .compliance-cards { grid-template-columns: 1fr; }
}
```

**Step 3: Verify build**

Run: `npx vite build 2>&1 | tail -5`

**Step 4: Commit**

```bash
git add src/components/dashboard/ComplianceCards.jsx src/index.css
git commit -m "feat: add ComplianceCards component with colour-coded tiers"
```

---

## Task 8: Create QuickLinks Component

**Files:**
- Create: `src/components/dashboard/QuickLinks.jsx`
- Modify: `src/index.css` — add QuickLinks styles

**Step 1: Create QuickLinks.jsx**

Receives an array of link objects: `{ key, icon, title, subtitle, nav }`. Icons are JSX SVG elements (reuse existing `TILE_ICONS`).

```jsx
import { useNavigate } from 'react-router-dom'

export default function QuickLinks({ links }) {
  const navigate = useNavigate()

  return (
    <div className="quick-links">
      {links.map(link => (
        <button
          key={link.key}
          className="quick-link"
          onClick={() => navigate(link.nav)}
        >
          <span className="quick-link-icon">{link.icon}</span>
          <div className="quick-link-text">
            <span className="quick-link-title">{link.title}</span>
            <span className="quick-link-subtitle">{link.subtitle}</span>
          </div>
          <span className="quick-link-arrow">&rarr;</span>
        </button>
      ))}
    </div>
  )
}
```

**Step 2: Add CSS to src/index.css**

```css
/* === Dashboard: Quick Links === */
.quick-links {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.quick-link {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  text-align: left;
  transition: transform var(--transition), box-shadow var(--transition), border-color var(--transition);
}

.quick-link:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary);
}

.quick-link-icon {
  flex-shrink: 0;
  color: var(--primary);
  display: flex;
  align-items: center;
}

.quick-link-icon svg {
  width: 22px;
  height: 22px;
}

.quick-link-text {
  flex: 1;
  min-width: 0;
}

.quick-link-title {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text);
}

.quick-link-subtitle {
  display: block;
  font-size: 0.68rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.quick-link-arrow {
  color: var(--text-muted);
  font-size: 0.8rem;
  transition: transform var(--transition);
}

.quick-link:hover .quick-link-arrow {
  transform: translateX(3px);
}

@media (max-width: 768px) {
  .quick-links { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 480px) {
  .quick-links { grid-template-columns: 1fr; }
}
```

**Step 3: Verify build**

Run: `npx vite build 2>&1 | tail -5`

**Step 4: Commit**

```bash
git add src/components/dashboard/QuickLinks.jsx src/index.css
git commit -m "feat: add QuickLinks navigation grid component"
```

---

## Task 9: Create KanbanBoard Component

**Files:**
- Create: `src/components/dashboard/KanbanBoard.jsx`
- Modify: `src/index.css` — add column scrolling styles

**Step 1: Create KanbanBoard.jsx**

This extracts the kanban board rendering (Dashboard.jsx lines ~956-1041) into a component. It receives `columns`, `mobileTab`, and all callback/state props.

```jsx
import { useState } from 'react'
import KanbanCard from './KanbanCard'

export default function KanbanBoard({
  columns, mobileTab, setMobileTab,
  expandedRpCard, setExpandedRpCard,
  rpChecklist, onToggleRpItem,
  onOpenCompletion, onMarkAllDone,
  completedAccordion, setCompletedAccordion,
  collapsedCols, setCollapsedCols,
  searchTerm,
  onTouchStart, onTouchEnd,
}) {
  const colProgress = (cards) => {
    const done = cards.filter(c => c.status === 'done').length
    return { done, total: cards.length }
  }

  const splitCards = (cards) => {
    const active = cards.filter(c => c.status !== 'done')
    const completed = cards.filter(c => c.status === 'done')
    return { active, completed }
  }

  return (
    <div className="kanban-board no-print" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {columns.map(col => {
        const prog = colProgress(col.allCards)
        const allDone = prog.total > 0 && prog.done === prog.total
        const { active, completed } = splitCards(col.cards)
        const accordionOpen = !!completedAccordion[col.key]
        const isCollapsed = !!collapsedCols[col.key]
        return (
          <div key={col.key} className={`kanban-column ${mobileTab === col.key ? 'kanban-column--mobile-active' : ''} ${isCollapsed ? 'kanban-column--collapsed' : ''}`}>
            <div className="kanban-column-header kanban-column-header--sticky" onClick={() => setCollapsedCols(prev => ({ ...prev, [col.key]: !prev[col.key] }))} style={{ cursor: 'pointer' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" className={`kanban-collapse-chevron ${isCollapsed ? 'kanban-collapse-chevron--closed' : ''}`}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
              <span className="kanban-column-title">{col.title}</span>
              <span className="kanban-column-count">{prog.done}/{prog.total}</span>
              {!allDone && prog.total > 0 && !isCollapsed && (
                <button className="kanban-markall-btn" onClick={(e) => { e.stopPropagation(); onMarkAllDone(col.allCards) }} title="Mark all done">
                  &#10003; All
                </button>
              )}
            </div>
            <div className="kanban-col-progress">
              <div className="kanban-col-progress-fill" style={{
                width: prog.total > 0 ? `${(prog.done / prog.total) * 100}%` : '0%',
                background: allDone ? 'var(--success)' : prog.done > 0 ? 'var(--warning)' : 'var(--border)',
              }} />
            </div>
            {!isCollapsed && <div className="kanban-cards">
              {allDone ? (
                <div className="kanban-all-done">
                  <svg className="kanban-all-done-icon" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" width="32" height="32">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span className="kanban-all-done-text">All done!</span>
                </div>
              ) : active.length === 0 && completed.length === 0 ? (
                <p className="kanban-empty">{searchTerm ? 'No matches' : 'No tasks'}</p>
              ) : (
                <>
                  {active.map(card => (
                    <KanbanCard
                      key={card.id}
                      card={card}
                      onOpenCompletion={onOpenCompletion}
                      expandedRpCard={expandedRpCard}
                      setExpandedRpCard={setExpandedRpCard}
                      rpChecklist={rpChecklist}
                      onToggleRpItem={onToggleRpItem}
                    />
                  ))}
                </>
              )}
              {completed.length > 0 && !allDone && (
                <div className="kanban-completed-accordion">
                  <button
                    className="kanban-completed-toggle"
                    onClick={() => setCompletedAccordion(prev => ({ ...prev, [col.key]: !prev[col.key] }))}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" width="14" height="14">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Completed ({completed.length})
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" className={`kanban-accordion-chevron ${accordionOpen ? 'kanban-accordion-chevron--open' : ''}`}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {accordionOpen && completed.map(card => (
                    <KanbanCard
                      key={card.id}
                      card={card}
                      onOpenCompletion={onOpenCompletion}
                      expandedRpCard={expandedRpCard}
                      setExpandedRpCard={setExpandedRpCard}
                      rpChecklist={rpChecklist}
                      onToggleRpItem={onToggleRpItem}
                    />
                  ))}
                </div>
              )}
            </div>}
          </div>
        )
      })}
    </div>
  )
}
```

**Step 2: Add column scrolling CSS**

Add to existing kanban styles in `src/index.css`:

```css
.kanban-cards {
  max-height: 480px;
  overflow-y: auto;
}
```

Only add this if `max-height` is not already set on `.kanban-cards`. Check first — search for `.kanban-cards {` in the CSS file.

**Step 3: Verify build**

Run: `npx vite build 2>&1 | tail -5`

**Step 4: Commit**

```bash
git add src/components/dashboard/KanbanBoard.jsx src/index.css
git commit -m "refactor: extract KanbanBoard into dashboard components"
```

---

## Task 10: Improve KanbanCard — Type Distinction + Urgency

**Files:**
- Modify: `src/components/dashboard/KanbanCard.jsx`
- Modify: `src/index.css` — add urgency styles

**Step 1: Add urgency computation to KanbanCard**

In KanbanCard.jsx, enhance the `borderClass` logic to include urgency based on `card.dueTime`:

```jsx
// Add urgency computation after existing borderClass logic
function getUrgencyClass(card) {
  if (card.status === 'done') return ''
  if (!card.dueTime) return ''
  const [h, m] = card.dueTime.split(':').map(Number)
  const now = new Date()
  const dueMinutes = h * 60 + m
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  if (nowMinutes >= dueMinutes) return 'kanban-card--urgent-overdue'
  if (dueMinutes - nowMinutes <= 60) return 'kanban-card--urgent-soon'
  return ''
}
```

Apply `getUrgencyClass(card)` as an additional class on the card div alongside `borderClass`.

**Step 2: Add CSS urgency modifiers**

```css
/* Urgency highlighting on kanban cards */
.kanban-card--urgent-overdue {
  border-left: 3px solid var(--danger) !important;
}

.kanban-card--urgent-overdue .kanban-card-due-time {
  color: var(--danger);
  font-weight: 700;
}

.kanban-card--urgent-soon {
  border-left: 3px solid var(--warning) !important;
}

.kanban-card--urgent-soon .kanban-card-due-time {
  color: var(--warning);
  font-weight: 700;
}
```

Note: The RP card blue border (`kanban-card--rp`) and blue badge (`kanban-card-pill--rp`) already exist in the CSS. Verify by checking for `.kanban-card--rp` — it should have `border-left-color: var(--info)` or similar. If not present, add:

```css
.kanban-card--rp { border-left-color: var(--info); }
.kanban-card-pill--rp { background: color-mix(in srgb, var(--info) 15%, transparent); color: var(--info); }
```

**Step 3: Verify build**

Run: `npx vite build 2>&1 | tail -5`

**Step 4: Commit**

```bash
git add src/components/dashboard/KanbanCard.jsx src/index.css
git commit -m "feat: add urgency highlighting and type distinction to KanbanCard"
```

---

## Task 11: Wire New Components into Dashboard.jsx

**Files:**
- Modify: `src/pages/Dashboard.jsx` — major restructure of the render section

This is the big integration task. It touches the render JSX of `Dashboard.jsx` to:
1. Add `AlertBanner` above the topbar
2. Replace the single action badge with `ActionCounter`
3. Add `ComplianceCards` below the topbar
4. Replace the tile grid with `QuickLinks`
5. Replace inline kanban rendering with `KanbanBoard`
6. Remove the compliance footer strip (`AnimatedBar` bars)
7. Remove the `AnimatedBar` function definition (no longer needed)

**Step 1: Update imports at top of Dashboard.jsx**

Replace:
```jsx
import Modal from '../components/Modal'
```

With:
```jsx
import {
  AlertBanner,
  ActionCounter,
  ComplianceCards,
  QuickLinks,
  KanbanBoard,
  KanbanCard,
  CompletionModal,
  ProgressRing,
} from '../components/dashboard'
```

Remove the `Modal` import if it was only used by CompletionModal (which is now extracted).

**Step 2: Remove extracted function definitions**

Delete these from Dashboard.jsx (they now live in separate files):
- `ProgressRing` function (~lines 119-139)
- `AnimatedBar` function (~lines 141-176)
- `ALL_STAFF` constant (~lines 178-181)
- `CompletionModal` function (~lines 183-230)
- `KanbanCard` function (~lines 232-326)

Keep in Dashboard.jsx:
- `scoreColor`, `scoreClass` (used for trend logic)
- `getGreeting`, `isTimePast`
- All RP constants (`RP_DAILY`, `RP_WEEKLY`, etc.)
- `TILE_ICONS` (passed as props to QuickLinks)
- `TASK_DUE_TIMES`, `RP_DAILY_DUE_TIME`

**Step 3: Compute new derived state for AlertBanner and ActionCounter**

Inside the Dashboard function, after the existing `complianceAreas` array (around line 520), add:

```jsx
// Critical alerts (score < 25%)
const criticalAlerts = complianceAreas
  .filter(a => a.score < 25)
  .map(a => {
    let subtitle = ''
    if (a.label === 'Training') subtitle = `${overdueTraining.length} items overdue across all staff`
    else if (a.label === 'Cleaning') subtitle = `${overdueCleaningTasks.length} tasks overdue`
    else if (a.label === 'Documents') subtitle = `${expiredDocs.length} documents expired`
    else subtitle = `${sgDueSoon.length} records need attention`
    return { label: a.label, score: a.score, subtitle, nav: a.nav }
  })

// Segmented action counts
const overdueCount = expiredDocs.length + overdueTraining.length + overdueCleaningTasks.length
  + sgDueSoon.filter(r => getSafeguardingStatus(r.trainingDate) === 'overdue').length
const dueTodayCount = tempMissing + rpMissing + dailyDueCount
const upcomingCount = dueSoon.length
  + sgDueSoon.filter(r => getSafeguardingStatus(r.trainingDate) === 'due-soon').length

// Compliance card data (with subtitles)
const complianceCardData = [
  { label: 'Documents', score: docScore, subtitle: docsExpiring > 0 ? `${docsExpiring} expiring` : 'All current', trend: trends['Documents'] ? { direction: trends['Documents'], value: Math.abs(docScore - (storedScores['Documents'] || docScore)) } : null, nav: '/documents' },
  { label: 'Training', score: staffScore, subtitle: trainingOverdue > 0 ? `${trainingOverdue} overdue` : 'All complete', trend: trends['Training'] ? { direction: trends['Training'], value: Math.abs(staffScore - (storedScores['Training'] || staffScore)) } : null, nav: '/staff-training' },
  { label: 'Cleaning', score: cleaningScore, subtitle: overdueCleaningTasks.length > 0 ? `${overdueCleaningTasks.length} overdue` : 'All clear', trend: trends['Cleaning'] ? { direction: trends['Cleaning'], value: Math.abs(cleaningScore - (storedScores['Cleaning'] || cleaningScore)) } : null, nav: '/cleaning' },
  { label: 'Safeguarding', score: sgScore, subtitle: sgDueSoon.length > 0 ? `${sgDueSoon.length} due soon` : 'All current', trend: trends['Safeguarding'] ? { direction: trends['Safeguarding'], value: Math.abs(sgScore - (storedScores['Safeguarding'] || sgScore)) } : null, nav: '/safeguarding' },
]

// Quick link data
const quickLinks = [
  { key: 'cleaning', icon: TILE_ICONS.cleaning, title: 'Cleaning Rota', subtitle: dailyDueCount > 0 ? `${dailyDueCount} due today` : 'All clear', nav: '/cleaning' },
  { key: 'documents', icon: TILE_ICONS.documents, title: 'Documents', subtitle: docsExpiring > 0 ? `${docsExpiring} expiring` : 'All current', nav: '/documents' },
  { key: 'training', icon: TILE_ICONS.training, title: 'Staff Training', subtitle: trainingOverdue > 0 ? `${trainingOverdue} overdue` : 'Up to date', nav: '/staff-training' },
  { key: 'safeguarding', icon: TILE_ICONS.safeguarding, title: 'Safeguarding', subtitle: `${sgScore}% compliant`, nav: '/safeguarding' },
  { key: 'temperature', icon: TILE_ICONS.temperature, title: 'Temp Log', subtitle: tempLoggedToday ? 'Logged today' : 'Not logged yet', nav: '/temperature' },
  { key: 'rplog', icon: TILE_ICONS.rplog, title: 'RP Log', subtitle: rpComplete ? 'Complete' : `${rpDoneCount}/${allRpItems.length} done`, nav: '/rp-log' },
]
```

**Step 4: Restructure the render JSX**

Replace the return statement's body. The new order is:

```jsx
return (
  <div className="dashboard">
    {/* === CRITICAL ALERTS === */}
    <AlertBanner alerts={criticalAlerts} />

    {/* === TOP BAR === */}
    <div className="dash-topbar no-print">
      <div className="dash-topbar-left">
        {/* ... existing greeting + date + clock ... */}
      </div>
      <div className="dash-topbar-center">
        <ActionCounter
          overdue={overdueCount}
          dueToday={dueTodayCount}
          upcoming={upcomingCount}
          onToggleOutstanding={() => setShowOutstanding(!showOutstanding)}
        />
      </div>
      <div className="dash-topbar-right">
        {/* ... existing synced timestamp + ProgressRing + print btn ... */}
      </div>
    </div>

    {/* === PRIORITIES STRIP === */}
    {/* ... keep existing activePriorities rendering ... */}

    <div className="dash-body">
      <div className="dash-main-col">

        {/* === COMPLIANCE CARDS === */}
        <ComplianceCards areas={complianceCardData} />

        {/* === QUICK LINKS === */}
        <QuickLinks links={quickLinks} />

        {/* === SEARCH BAR === */}
        {/* ... keep existing search bar ... */}

        {/* === MOBILE TAB BAR === */}
        {/* ... keep existing tab bar ... */}

        {/* === KANBAN BOARD === */}
        <KanbanBoard
          columns={columns}
          mobileTab={mobileTab}
          setMobileTab={setMobileTab}
          expandedRpCard={expandedRpCard}
          setExpandedRpCard={setExpandedRpCard}
          rpChecklist={rpChecklist}
          onToggleRpItem={handleToggleRpItem}
          onOpenCompletion={handleOpenCompletion}
          onMarkAllDone={handleMarkAllDone}
          completedAccordion={completedAccordion}
          setCompletedAccordion={setCompletedAccordion}
          collapsedCols={collapsedCols}
          setCollapsedCols={setCollapsedCols}
          searchTerm={searchTerm}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />

        {/* REMOVE: compliance footer strip (was <AnimatedBar> bars) */}

      </div>{/* end dash-main-col */}

      {/* ... keep existing panel overlay + aside (My Day) ... */}
    </div>

    {/* ... keep existing outstanding section, print section, CompletionModal ... */}
  </div>
)
```

Key deletions:
- Remove the `<div className="dash-tiles">` tile grid rendering (replaced by QuickLinks)
- Remove the `<div className="compliance-strip">` footer (replaced by ComplianceCards)
- Remove inline kanban rendering (replaced by KanbanBoard component)

**Step 5: Verify build**

Run: `npx vite build 2>&1 | tail -5`
Expected: `✓ built in` with no errors

**Step 6: Verify in browser**

Run: `npx vite dev` and open `http://localhost:5173`
Check:
- Alert banner appears if any score < 25%
- Segmented action counters show in topbar
- Compliance cards show 4-column grid with correct colours
- Quick links show 2×3 grid
- Kanban board renders with RP blue borders and urgency highlighting
- My Day panel still works

**Step 7: Commit**

```bash
git add src/pages/Dashboard.jsx
git commit -m "feat: wire redesigned components into Dashboard layout"
```

---

## Task 12: Enhance My Day Panel — Team Grid + User Subtitle

**Files:**
- Modify: `src/pages/Dashboard.jsx` — My Day panel header + team section
- Modify: `src/index.css` — team grid styles

**Step 1: Update panel header**

In the My Day panel header, add the user's full name as a subtitle:

```jsx
<div className="dash-panel-header">
  <div>
    <span className="dash-panel-title">My Day</span>
    {user && <span className="dash-panel-subtitle">{user.name}</span>}
  </div>
  <button className="dash-panel-close" onClick={() => setPanelOpen(false)}>&times;</button>
</div>
```

**Step 2: Update team section to grid**

Replace the team strip horizontal scroll with a grid layout. In the team section of the panel:

```jsx
{user?.isManager && teamProgress.length > 0 && (
  <div className="dash-panel-section">
    <div className="dash-team-grid">
      <span className="dash-team-grid-label">Team Progress</span>
      <div className="dash-team-grid-items">
        {teamProgress.map((p) => (
          <div key={p.name} className={`dash-team-member ${p.allDone ? 'dash-team-member--done' : ''}`}>
            <span className="dash-team-member-avatar">{getStaffInitials(p.name)}</span>
            <span className="dash-team-member-name">{p.name.split(' ')[0]}</span>
            {p.total > 0 && (
              <span className="dash-team-member-count">{p.done}/{p.total}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
)}
```

**Step 3: Add CSS**

```css
/* === Dashboard: Panel subtitle === */
.dash-panel-subtitle {
  display: block;
  font-size: 0.68rem;
  color: var(--text-secondary);
  font-weight: 500;
  margin-top: 0.1rem;
}

/* === Dashboard: Team Grid === */
.dash-team-grid {
  margin-top: 0.5rem;
}

.dash-team-grid-label {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-secondary);
}

.dash-team-grid-items {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.dash-team-member {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  padding: 0.4rem;
  border-radius: var(--radius-sm);
  transition: background var(--transition);
}

.dash-team-member:hover { background: var(--primary-fade); }

.dash-team-member--done { opacity: 0.6; }

.dash-team-member-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary-fade);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 700;
}

.dash-team-member--done .dash-team-member-avatar {
  background: color-mix(in srgb, var(--success) 15%, transparent);
  color: var(--success);
}

.dash-team-member-name {
  font-size: 0.62rem;
  font-weight: 500;
  color: var(--text);
}

.dash-team-member-count {
  font-family: 'JetBrains Mono', 'SF Mono', monospace;
  font-size: 0.58rem;
  font-weight: 600;
  color: var(--text-secondary);
}
```

**Step 4: Verify build**

Run: `npx vite build 2>&1 | tail -5`

**Step 5: Commit**

```bash
git add src/pages/Dashboard.jsx src/index.css
git commit -m "feat: enhance My Day panel with user subtitle and team grid"
```

---

## Task 13: Add Monospace Font Variable + Load JetBrains Mono

**Files:**
- Modify: `index.html` — add Google Fonts link for JetBrains Mono
- Modify: `src/index.css` — add `--mono-font` variable

**Step 1: Add font link to index.html**

In `index.html`, in the `<head>`, after the existing font links, add:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
```

Check if the preconnect line already exists — if so, only add the second link.

**Step 2: Add CSS variable**

In `src/index.css`, add to the `:root` block:

```css
--mono-font: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
```

**Step 3: Update monospace references**

Search for any inline `font-family: 'JetBrains Mono'` in the CSS added by earlier tasks and replace with `font-family: var(--mono-font)`.

**Step 4: Verify build**

Run: `npx vite build 2>&1 | tail -5`

**Step 5: Commit**

```bash
git add index.html src/index.css
git commit -m "chore: add JetBrains Mono font and --mono-font CSS variable"
```

---

## Task 14: Clean Up Unused CSS

**Files:**
- Modify: `src/index.css`

**Step 1: Remove compliance footer strip styles**

The `.compliance-strip` styles are no longer used (the footer bars were replaced by ComplianceCards). Remove:
- `.compliance-strip` and all sub-selectors (`.compliance-strip-item`, `.compliance-strip-top`, `.compliance-strip-score`, `.compliance-strip-label`, `.compliance-strip-bar`, `.compliance-strip-bar-fill`, and their modifiers)

Before deleting, verify with a grep: `grep -r "compliance-strip" src/` — should return 0 results after Task 11 removed the JSX.

**Step 2: Remove old tile gradient styles**

The `.dash-tile` shimmer/gradient/progress styles are no longer used. Remove:
- `.tile--green`, `.tile--blue`, `.tile--purple`, `.tile--teal`, `.tile--orange`, `.tile--rose` if they exist
- `.dash-tile--shimmer` and its `::after` pseudo-element
- `.dash-tile-progress`, `.dash-tile-progress-fill`

Again verify with grep first: `grep -r "dash-tile" src/` — if QuickLinks replaced tiles, these classes should be unreferenced.

**Step 3: Verify build**

Run: `npx vite build 2>&1 | tail -5`

**Step 4: Commit**

```bash
git add src/index.css
git commit -m "chore: remove unused compliance-strip and tile CSS"
```

---

## Task 15: Update Barrel Export + Final Verification

**Files:**
- Modify: `src/components/dashboard/index.js` — ensure all exports are correct

**Step 1: Verify barrel export matches created files**

Run: `ls src/components/dashboard/`
Ensure every `.jsx` file has a matching export line in `index.js`.

**Step 2: Full build verification**

Run: `npx vite build 2>&1 | tail -10`
Expected: `✓ built in` with no errors

**Step 3: Visual verification checklist**

Run: `npx vite dev` and check:
- [ ] Alert banner shows for any score < 25%
- [ ] Alert banner has pulsing red dot and action link
- [ ] Topbar shows segmented Overdue / Due Today / Upcoming counts
- [ ] ProgressRing colour matches: red < 30%, amber 30-70%, green > 70%
- [ ] 4 compliance cards show with correct colour-coded borders and monospace scores
- [ ] Compliance card trends show ↑/↓ when different from last week
- [ ] 2×3 quick link grid navigates to correct pages
- [ ] Quick links show one-line status subtitle
- [ ] Kanban RP cards have blue left border
- [ ] Kanban cards with past-due times have red left border
- [ ] Weekly column scrolls if > 8 items
- [ ] My Day panel shows user's full name
- [ ] Team grid shows first names with avatars
- [ ] No compliance footer bars at bottom
- [ ] No gradient tile cards
- [ ] Dark mode works (all colours via CSS variables)
- [ ] Light mode works
- [ ] Mobile responsive (compliance cards → 2-col, quick links → 2-col)

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete dashboard redesign — alerts, compliance cards, quick links, improved kanban"
```
