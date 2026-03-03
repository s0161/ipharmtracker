# Light Mode, Dashboard UX & New Features — Design

## Decisions

- **Light mode style:** Clean & clinical (white/light gray, crisp borders, professional)
- **Accent colour:** Keep emerald green (#10b981) in both modes
- **Quick actions:** Floating action button (FAB) with radial fan menu
- **Additional features:** Error boundary, audit trail page, compliance report page

---

## 1. Light Mode Theme

Extend the existing `ec-*` Tailwind tokens via CSS variable overrides under `[data-theme="light"]`. All components already use `ec-t1`, `ec-bg`, etc. — overriding these values makes every Tailwind class automatically adapt.

### Palette

| Token | Dark | Light |
|-------|------|-------|
| `ec-bg` | `#0a0a0a` | `#f8fafc` (slate-50) |
| `ec-sidebar` | `#070707` | `#ffffff` |
| `ec-card` | `rgba(255,255,255,0.025)` | `#ffffff` |
| `ec-border` | `rgba(255,255,255,0.06)` | `#e2e8f0` (slate-200) |
| `ec-div` | `rgba(255,255,255,0.04)` | `#f1f5f9` (slate-100) |
| `ec-t1` | `#e4e4e7` | `#0f172a` (slate-900) |
| `ec-t2` | `rgba(255,255,255,0.5)` | `#475569` (slate-600) |
| `ec-t3` | `rgba(255,255,255,0.25)` | `#94a3b8` (slate-400) |
| `ec-t4` | `rgba(255,255,255,0.15)` | `#cbd5e1` (slate-300) |
| `ec-t5` | `rgba(255,255,255,0.08)` | `#e2e8f0` (slate-200) |
| `ec-em` | `#10b981` | `#059669` (darker emerald for white bg contrast) |
| `ec-em-dark` | `#059669` | `#047857` |
| `ec-em-faint` | `rgba(16,185,129,0.06)` | `rgba(5,150,105,0.06)` |
| `ec-warn` | `#f59e0b` | `#d97706` |
| `ec-crit` | `#ef4444` | `#dc2626` |

### Key visual changes

- White cards with subtle `box-shadow: 0 1px 3px rgba(0,0,0,0.08)` instead of glassmorphism
- Sidebar: white background with a right border `1px solid #e2e8f0`
- Sidebar active state: `bg-slate-100` with dark text (not emerald)
- Sidebar emerald gradient left edge becomes a subtle slate-100 left edge
- Progress rings, sparklines, badges keep emerald accent
- Scroll fade gradient: `#f8fafc → transparent` instead of `#0a0a0a → transparent`
- RP Presence Bar: light card style with emerald accents preserved
- Compliance tiles: white cards with coloured top borders
- AccPanel accordions: white backgrounds, slate borders

### Implementation approach

1. Convert hardcoded Tailwind `ec-*` colours in `tailwind.config.js` to reference CSS custom properties
2. Define `--ec-bg`, `--ec-t1`, etc. in `:root` (dark values) and `[data-theme="light"]` (light values)
3. Update `tailwind.config.js` colors to use `var(--ec-bg)` etc.
4. Fix inline styles throughout components that use hardcoded `rgba(255,255,255,...)` values
5. Audit every component for hardcoded dark-specific colours (e.g., `bg-[rgba(15,15,15,0.95)]` tooltips)

---

## 2. Floating Action Button (FAB)

### Structure

A 56px emerald circle fixed at bottom-right (24px inset). Tapping expands a fan of 5 action buttons upward.

### Actions

| # | Action | Icon | Behaviour |
|---|--------|------|-----------|
| 1 | RP Sign In/Out | shield | Toggles RP presence, label changes dynamically |
| 2 | Log Fridge Temp | thermometer | Opens inline number input with submit |
| 3 | CD Check | pill/check | One-tap mark done, shows timestamp |
| 4 | RP Notice | clipboard | One-tap mark done, shows timestamp |
| 5 | Open/Close | door | One-tap mark done, shows timestamp |

### Interactions

- **Expand:** Buttons fan upward with staggered 50ms delays, `scale(0) → scale(1)` with spring easing
- **Backdrop:** Semi-transparent dark overlay when expanded (click to dismiss)
- **Completed state:** Green checkmark replaces icon, button becomes muted/disabled
- **Fridge temp:** Inline input appears next to the button, Enter or checkmark submits
- **Mobile:** Same position, buttons stack straight up instead of arc
- **State sharing:** Reads/writes same `keys` state + RP checklist as Dashboard — actions in FAB reflect in RP bar and vice versa

### Files

- `src/components/dashboard/FloatingActionButton.jsx` — new component
- `src/pages/Dashboard.jsx` — render FAB, pass shared state

---

## 3. Error Boundary

### Structure

Single `ErrorBoundary` class component wrapping `<AuthedApp />` in `App.jsx`.

### Error screen

- iPD logo (emerald gradient square)
- "Something went wrong" heading
- Error message in a subtle code block (collapsed by default, expandable)
- "Refresh page" button — calls `window.location.reload()`
- "Clear data & retry" button — clears `localStorage`, reloads (nuclear option for corrupted state)
- Works in both dark and light mode (uses inline styles, not Tailwind)

### Files

- `src/components/ErrorBoundary.jsx` — new component
- `src/App.jsx` — wrap AuthedApp with ErrorBoundary

---

## 4. Audit Trail Page

### Route

`/audit-log` — added to SYSTEM section in sidebar (between Settings and Light Mode toggle)

### Data source

`audit_log` Supabase table, already populated by `logAudit(action, description, category, userName)` calls throughout the app.

### Layout

- Matches existing table styling from RP Log / Incidents (dark cards in dark mode, white cards in light mode)
- **Columns:** Timestamp, Action (Created/Updated/Deleted), Description, Category, User
- **Filters row:** Date range (two date inputs), category dropdown, user dropdown, free-text search
- **Sort:** Newest first default, clickable column headers
- **Pagination:** Show 50 per page with prev/next
- **Export:** CSV download button in PageActions component

### Files

- `src/pages/AuditLog.jsx` — new page
- `src/App.jsx` — add route
- `src/components/Sidebar.jsx` — add nav item in SYSTEM section

---

## 5. Compliance Report Page

### Route

`/compliance-report` — added to COMPLIANCE section in sidebar

### Layout (screen view)

Single-page summary designed for printing:

1. **Header:** Pharmacy name, address, GPhC number, report date, iPD logo
2. **Overall score:** Large percentage with colour indicator
3. **4 compliance cards:** Documents, Training, Cleaning, Safeguarding — each with score %, status text, and item count
4. **RP log summary:** Days covered in last 30 days, any gap days listed
5. **Document status table:** Name, category, expiry date, traffic light badge
6. **Footer:** "Generated by iPharmacy Direct Compliance Tracker"

### Print behaviour

- "Print Report" button at top triggers `window.print()`
- `@media print` CSS: hides sidebar, nav, FAB, scroll fade
- Forces white background regardless of current theme
- Adds page margins, header repetition on multi-page
- Compact table styling for paper

### Files

- `src/pages/ComplianceReport.jsx` — new page
- `src/App.jsx` — add route
- `src/components/Sidebar.jsx` — add nav item in COMPLIANCE section
- `src/index.css` — add `@media print` rules
