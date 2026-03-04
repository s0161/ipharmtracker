# Analytics Dashboard & App Polish — Design

## Decisions

- **Analytics location:** Summary widget on Dashboard + dedicated `/analytics` page
- **Audience:** Both managers and GPhC inspectors
- **Time range:** 30 days
- **Charts:** SVG-based (no external library), reuse existing Sparkline patterns
- **Polish scope:** Fix hardcoded content, mobile nav gaps, missing page titles, styled confirm dialogs

---

## 1. Analytics — Dashboard Summary Widget

A compact card between Compliance Health and Alert Banner showing a mini 7-day compliance trend sparkline with current score and "View Analytics →" link.

- Reads from `ipd_score_history` localStorage (already persisted daily by Dashboard)
- Shows overall score trend using existing `<Sparkline>` component
- Links to `/analytics` page

---

## 2. Analytics Page (`/analytics`)

### Sections

1. **Overall Compliance Trend** — 30-day line chart (SVG), 4 category lines (Documents, Training, Cleaning, Safeguarding) + overall average. Colour-coded: green/amber/red per category.

2. **Snapshot Cards** — 4 cards showing current score, 30-day average, trend arrow (up/down/flat), and mini sparkline per category.

3. **Staff Activity Summary** — Table showing each staff member's completed tasks (last 30 days), completion rate, and last active date. Data from `cleaning_entries` grouped by `completed_by`.

4. **Risk Indicators** — Highlight items needing attention: documents expiring within 30 days, overdue training, gaps in RP coverage. Colour-coded badges.

5. **Export** — "Export CSV" button for the compliance data.

### Data Sources

| Section | Table(s) |
|---------|----------|
| Compliance trend | `ipd_score_history` (localStorage) |
| Document scores | `documents` (expiry dates) |
| Training scores | `staff_training` |
| Cleaning scores | `cleaning_entries` |
| Safeguarding | `safeguarding_records` |
| Staff activity | `cleaning_entries` (completed_by) |
| Risk items | `documents` (expiry), `staff_training`, `rp_log` |

---

## 3. Polish Items

### 3a. Fix Hardcoded Content

- **Dashboard L279**: Remove hardcoded "Last inspection was 14 months ago" GPhC notification — make it dynamic from pharmacy config or remove entirely
- **Dashboard L292**: Remove hardcoded fallback RP session "09:02" — show empty state instead

### 3b. Layout.jsx Missing Page Titles

Add to `titles` map:
- `/incidents` → "Incidents"
- `/near-misses` → "Near Miss Log"
- `/compliance-report` → "Compliance Report"
- `/audit-log` → "Audit Log"
- `/analytics` → "Analytics"

### 3c. Mobile Bottom Nav

Add a "More" button that shows a slide-up sheet with all remaining pages, rather than cramming more icons into the bottom bar.

### 3d. Styled Confirm Dialogs

Replace all 10 `window.confirm()` calls with a reusable `<ConfirmDialog>` component that matches the app theme. Uses React portal, dark/light mode compatible.

### 3e. AuditLog Pagination

Add proper pagination (50 per page) to the Audit Log page instead of showing first 100 entries.

---

## Files

| File | Action |
|------|--------|
| `src/pages/Analytics.jsx` | **Create** — full analytics page |
| `src/pages/Dashboard.jsx` | **Edit** — add summary widget, fix hardcoded content |
| `src/components/Layout.jsx` | **Edit** — add page titles, mobile "More" menu |
| `src/components/ConfirmDialog.jsx` | **Create** — styled confirmation modal |
| `src/components/Sidebar.jsx` | **Edit** — add Analytics nav item |
| `src/App.jsx` | **Edit** — add /analytics route |
| 10 page files | **Edit** — replace window.confirm() with ConfirmDialog |
| `src/pages/AuditLog.jsx` | **Edit** — add pagination |
