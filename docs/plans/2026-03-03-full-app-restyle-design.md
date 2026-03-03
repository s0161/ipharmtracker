# Full App Restyle — Emerald Command Visual Consistency

**Date:** 2026-03-03
**Goal:** Restyle all 11 remaining pages + shared components to match the Emerald Command dark theme, creating a cohesive premium UX suitable for selling to pharmacies.

## Approach

Page-by-page restyle: convert old CSS classes to Tailwind `ec-*` utilities, apply consistent card/table/form/modal patterns from Dashboard, fix minor UX issues per page.

## Shared Visual Patterns

- **Page header:** 13px bold `text-ec-t1`, optional stats/actions right-aligned
- **Cards:** `bg-white/[0.025] border border-ec-border rounded-2xl p-5`, hover lift
- **Tables:** Rows with `border-b border-ec-div`, hover `bg-white/[0.03]`
- **Forms:** Inputs `bg-white/[0.04] border-ec-border text-ec-t1`, emerald focus ring
- **Modals:** `bg-[#141414] border-ec-border rounded-2xl`, dark overlay with backdrop-blur
- **Status badges:** Green (current/pass), Amber (due soon), Red (overdue/fail) pills
- **Buttons:** Primary = emerald, Secondary = `bg-white/[0.05]`, Destructive = red
- **Empty states:** Centered icon + `text-ec-t3` message

## Pages

| # | Page | UX Fix |
|---|------|--------|
| 1 | Login | — |
| 2 | PinSelect | — |
| 3 | MyTasks | Greeting time → 17:00 cutoff |
| 4 | RPLog | Auto-save on toggle |
| 5 | CleaningRota | Pass/fail visual indicators |
| 6 | DocumentTracker | Expiry status badge colors |
| 7 | StaffTraining | Status badge colors |
| 8 | SafeguardingTraining | Collapsible reference docs |
| 9 | TemperatureLog | Out-of-range warning highlight |
| 10 | TrainingLogs | Stats row styling |
| 11 | Settings | Multi-step data clear confirmation |

## Also

- Restyle Modal.jsx and Toast.jsx (shared components)
- Delete DashboardStage1.jsx (legacy)

## Execution Batches

1. Login + PinSelect (first impressions)
2. Modal + Toast (shared, used by many pages)
3. MyTasks + RPLog + CleaningRota (daily workflow)
4. DocumentTracker + StaffTraining + SafeguardingTraining + TrainingLogs (compliance)
5. TemperatureLog + Settings + cleanup

## Verification

- `npm run build` passes
- Every page uses dark charcoal bg, emerald accents only on success states
- No old CSS class styling visible
- Mobile responsive on all pages
- Light/dark theme toggle works
