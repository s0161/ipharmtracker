# UX Polish — Form Validation, Empty States, Loading Skeletons & Mobile Fixes

## Overview

Page-by-page UX polish pass addressing form validation, empty states, loading skeletons, and mobile responsiveness across all CRUD pages.

---

## Layer 1: Shared Utilities

### EmptyState Component (`src/components/EmptyState.jsx`)

Reusable "no data" component:
- Icon (SVG, customizable — default: empty box)
- Title (e.g. "No incidents recorded")
- Description (e.g. "Incidents will appear here once logged")
- Optional action button (e.g. "Add First Incident")
- Styled with ec-t3 text, ec-div separator, ec-fadeup animation
- Centered with padding

### SkeletonLoader Component (`src/components/SkeletonLoader.jsx`)

Pulsing placeholder blocks replacing "Loading..." text:
- `variant="cards"` — 2x2 grid of rounded card shapes
- `variant="table"` — header row + 5 data rows
- `variant="list"` — 4 stacked rows
- Uses ec-card background with animate-pulse

### useFormGuard Hook (`src/hooks/useFormGuard.js`)

```js
const { guarded, submitting } = useFormGuard(submitFn, { validate })
```
- Wraps async submit handler
- `validate()` returns `{ field: 'error msg' }` or null
- Sets `submitting = true` during async, prevents double-click
- 500ms debounce to prevent rapid duplicates

---

## Layer 2: Page-by-Page Fixes

### TemperatureLog.jsx
- **Validate:** temp must be numeric; outside 2–8°C shows amber warning
- **Empty state:** "No temperature readings yet" + thermometer icon
- **Skeleton:** table variant

### Incidents.jsx
- **Validate:** type, description, date required
- **Empty state:** "No incidents recorded" + alert icon
- **Skeleton:** table variant
- **Mobile:** table → card layout on small screens

### NearMissLog.jsx
- **Validate:** type, description, date required
- **Empty state:** "No near misses logged" + alert-triangle icon
- **Skeleton:** table variant
- **Mobile:** table → card layout on small screens

### CleaningRota.jsx
- **Validate:** task and staff required, date required
- **Empty state:** "No cleaning entries yet" + clipboard icon
- **Skeleton:** table variant

### DocumentTracker.jsx
- **Validate:** name, category, expiry date required
- **Empty state:** "No documents tracked" + file icon
- **Skeleton:** table variant
- **Mobile:** hide less important columns

### StaffTraining.jsx
- **Validate:** staff name, date, course required
- **Empty state:** "No training records" + book icon
- **Skeleton:** table variant

### SafeguardingTraining.jsx
- **Validate:** staff name, training date required
- **Empty state:** "No safeguarding records" + shield icon
- **Skeleton:** table variant

### TrainingLogs.jsx
- **Validate:** staff, topic, date required
- **Empty state:** "No training logs" + book icon
- **Skeleton:** table variant

### MyTasks.jsx
- **Validate:** task title required when assigning
- **Empty state:** "All caught up!" + checkmark icon (positive framing)
- **Skeleton:** list variant
- **Mobile:** manager grid → single column

### RPLog.jsx
- **Validate:** readonly RP name with helper text "Set in Settings"
- **Empty state:** "No RP sessions today" + shield icon
- **Skeleton:** list variant

### Dashboard.jsx
- Add confirm dialog to handleDeleteTodo
- Null-check rpAssignee with fallback "No RP assigned"
- Validate todo title (non-empty) before add

### Analytics.jsx
- Make SVG chart responsive (viewBox + width="100%" + preserveAspectRatio)
- Add skeleton loader while data loads

---

## Files Created

| File | Description |
|------|-------------|
| `src/components/EmptyState.jsx` | Reusable empty state component |
| `src/components/SkeletonLoader.jsx` | Loading skeleton variants |
| `src/hooks/useFormGuard.js` | Submit guard + validation hook |

## Files Modified

| File | Changes |
|------|---------|
| TemperatureLog.jsx | Validation, empty state, skeleton |
| Incidents.jsx | Validation, empty state, skeleton, mobile cards |
| NearMissLog.jsx | Validation, empty state, skeleton, mobile cards |
| CleaningRota.jsx | Validation, empty state, skeleton |
| DocumentTracker.jsx | Validation, empty state, skeleton, mobile |
| StaffTraining.jsx | Validation, empty state, skeleton |
| SafeguardingTraining.jsx | Validation, empty state, skeleton |
| TrainingLogs.jsx | Validation, empty state, skeleton |
| MyTasks.jsx | Validation, empty state, skeleton, mobile |
| RPLog.jsx | Helper text, empty state, skeleton |
| Dashboard.jsx | Delete confirm, null check, todo validation |
| Analytics.jsx | Responsive chart, skeleton |
