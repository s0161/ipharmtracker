# Dashboard Redesign — Design Document

## Decisions

- **Theme**: Both light and dark — use existing CSS variable system, no hardcoded colours
- **File structure**: Extract components into `src/components/dashboard/`
- **Quick links**: Keep one-line status subtitles (navigation-focused but informative)
- **Layout order**: Alerts → Actions → Compliance → Quick Links → Kanban + Sidebar

## Architecture

### Component Extraction

```
src/components/dashboard/
├── AlertBanner.jsx        — Critical compliance alerts (score < 25%)
├── ActionCounter.jsx      — Segmented overdue/today/upcoming + completion ring
├── ComplianceCards.jsx    — 4-card grid with scores, trends, progress bars
├── QuickLinks.jsx         — 2×3 navigation cards with one-line status
├── KanbanBoard.jsx        — 4-column task board (moved from Dashboard)
├── KanbanCard.jsx         — Individual task card (extracted)
├── CompletionModal.jsx    — Task completion dialog (extracted)
├── ProgressRing.jsx       — SVG completion ring (extracted)
└── index.js               — Barrel export
```

`Dashboard.jsx` becomes a ~400-500 line data orchestrator: fetches via existing hooks, computes derived state, passes props down.

The My Day side panel stays inline in Dashboard.jsx (tightly coupled to dashboard state for task toggling).

### Layout

```
┌──────────────────────────────────────────────────────────┐
│ [AlertBanner]  Critical alerts — red-tinted, pulsing dot │
├──────────────────────────────────────────────────────────┤
│ [TopBar]  Greeting + clock + [ActionCounter] + ring      │
├──────────────────────────────────────────────────────────┤
│ [ComplianceCards]  Documents | Training | Cleaning | SG  │
├──────────────────────────────────────────────────────────┤
│ [QuickLinks]  Cleaning | Docs | Training | SG | Temp | RP│
├───────────────────────────────────┬──────────────────────┤
│ [KanbanBoard]                     │ [My Day Panel]       │
│  Today | Weekly | Fortnightly |   │  My Tasks            │
│  Monthly                          │  RP Quick Log        │
│                                   │  To Do               │
│                                   │  Team (managers)     │
└───────────────────────────────────┴──────────────────────┘
```

Removed: compliance footer bars (replaced by ComplianceCards above kanban).

## Components

### 1. AlertBanner

- Full-width, slides down with `@keyframes slideDown`
- Background: `color-mix(in srgb, var(--danger) 8%, var(--bg-card))`
- Left: pulsing red dot (CSS animation) + bold message (e.g. "Staff Training is at 0% — 483 items overdue")
- Right: "Review Training →" link button navigating to relevant page
- Stacks vertically for multiple alerts
- Trigger: any compliance area score < 25%
- Auto-dismiss: disappears when score rises above 25%

### 2. ActionCounter

Replaces "504 actions needed" badge in existing topbar. Three segmented counters:

- **Overdue** (red): items past due date
- **Due Today** (amber): items due today
- **Upcoming** (muted): items due within 7 days

ProgressRing stays adjacent, colour graduates: red < 30%, amber 30-70%, green > 70%.

### 3. ComplianceCards

4-column grid (2-col tablet, 1-col mobile). Each card:

- Dark card, 16px padding, `var(--radius)` corners
- Top: uppercase label (12px, `--text-secondary`) + trend arrow (↑/↓ with %)
- Center: large monospace score (28px), colour-coded by health
- Bottom: subtitle text (e.g. "483 overdue") + thin 4px progress bar
- Critical tinting: score < 25% → `border-left: 3px solid var(--danger)` + danger-tinted bg; 25-70% → amber border; > 70% → standard

Trends use existing `localStorage` weekly scores logic.

### 4. QuickLinks

2×3 grid (3-col tablet, 2-col mobile). Each card:

- Dark card, small coloured icon (24px SVG), title, one-line status subtitle
- Hover: `translateY(-2px)` + `border-color` highlight
- No gradients or progress bars
- Status examples: "2 due today", "Not logged yet", "3/14 done"

### 5. KanbanBoard Improvements

**Card type distinction:**
- RP Check cards: `border-left: 3px solid var(--info)` (blue), blue "RP Check" badge
- Cleaning cards: standard with green badge

**Urgency highlighting:**
- Past deadline: `border-left: 3px solid var(--danger)`, red deadline text
- Within 60 min: `border-left: 3px solid var(--warning)`, amber deadline text

**Weekly column scrolling:** `max-height: 480px; overflow-y: auto` on `.kanban-cards` for columns with > 8 items.

### 6. My Day Panel Improvements

- Header: "My Day" + user's full name as subtitle
- My Tasks: keep as-is (checkboxes + progress bar)
- RP Quick Log: keep as-is (added in previous session)
- To Do: keep as-is (consolidated in panel)
- Team section: expand from horizontal chips to grid — coloured circle with initials, first name below, progress count below name. 3-4 column grid layout.

### 7. Remove Duplicated To Do

Verify no To Do rendering exists in main content area outside the panel. Recent commit `d688ccf` likely already handled this.

## CSS Approach

- All styles in `src/index.css` under comment headers (existing pattern)
- Use existing CSS variables — no hardcoded colours
- New variable: `--mono-font: 'JetBrains Mono', 'SF Mono', monospace`
- Both themes work via variable system
- New animations: `@keyframes slideDown` for AlertBanner
- Existing: `fadeIn`, `tileProgressGrow`

## Colour Semantics

| Meaning | Variable | Used for |
|---------|----------|----------|
| Critical/overdue | `--danger` | Alerts, overdue badges, scores < 25% |
| Warning/due today | `--warning` | Due-today badges, scores 25-70% |
| Healthy/complete | `--success` | Done states, scores > 70% |
| RP checks | `--info` | RP card borders and badges |
| Secondary text | `--text-secondary` | Metadata, upcoming counts |
