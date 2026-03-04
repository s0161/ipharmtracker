# Comprehensive Improvements Design — iPharmTracker

> **For Claude:** Reference document for future improvement work. Not an implementation plan — use this to scope individual features.

**Goal:** Catalog all identified improvements across competitor analysis, GPhC regulatory requirements, modern SaaS UX patterns, and a full codebase audit.

**Research Sources:** Smartpharmacy, PharmOutcomes, RxWeb, Titan PMR, Linear, Notion, Asana, Monday.com, GPhC Standards for Registered Pharmacies, RP Regulations 2008, Misuse of Drugs Regulations 2001.

---

## A. Missing Regulatory Features (GPhC gaps)

| # | Feature | What & Why | Competitors |
|---|---------|-----------|-------------|
| 1 | **Controlled Drugs Register** | Digital CD register with running balance, receipt/supply entries, witness signatures, destruction logs. Legal requirement under Misuse of Drugs Regulations 2001. | Titan, RxWeb, Smartpharmacy |
| 2 | **SOP Library with Version Control** | Store SOPs with versions, review dates, and staff read-receipt tracking. GPhC Principle 1 requires written, accessible, current SOPs. | Smartpharmacy |
| 3 | **Self-Inspection Checklists** | GPhC 5 Principles mapped to actionable checklists with evidence linking. Inspectors look for self-assessment evidence. | Smartpharmacy, RxWeb |
| 4 | **Risk Assessment Templates** | Lone working, fire, COSHH, sharps — scored with review dates. GPhC Principle 1 requires risk management. | Smartpharmacy |
| 5 | **RP Handover Records** | Formal handover between RPs with both signing. RP Regulations 2008 require handover records. Currently missing GPhC registration number in RP logs. | Titan, RxWeb |
| 6 | **PGD/PSD Authorization Tracking** | Track which staff are authorized under which Patient Group Directions, with expiry dates. | RxWeb |
| 7 | **Temperature Excursion Handling** | When temp is outside 2-8°C, force an action log: quarantine stock, contact superintendent, document resolution. Currently only shows a warning. | Smartpharmacy |
| 8 | **Corrective Action Plans** | Incidents/near-misses should generate formal corrective actions with owners, deadlines, status tracking — not just free-text "action taken." | Smartpharmacy |

---

## B. Reporting & Compliance Output

| # | Feature | What & Why |
|---|---------|-----------|
| 9 | **PDF Report Generation** | One-click PDF of compliance status for GPhC inspectors. CSV is not inspector-friendly. Use `jspdf` + `jspdf-autotable`. Include: pharmacy header, overall score, document status table, training matrix, cleaning summary, RP coverage, incidents. |
| 10 | **GPhC Inspection Readiness Dashboard** | Composite score card mapping to the 10 things inspectors check: RP records, SOPs, temperature logs, cleaning, training, safeguarding, CD register, incident records, risk assessments, patient safety culture. |
| 11 | **Staff Competency Matrix** | Visual grid (staff x required competencies) color-coded by completion status. Smartpharmacy's most praised feature. |
| 12 | **Compliance Score Breakdown Drill-Down** | Click a compliance tile → see exactly which items are dragging the score down (which documents expired, which staff have incomplete training, which cleaning tasks overdue). |
| 13 | **Comparative Reports** | This month vs. last month, this week vs. same week last year. Show improvement trajectory. |
| 14 | **Report Templates** | Pre-built: Monthly Compliance Summary, GPhC Inspection Prep, Staff Training Matrix, Incident Analysis, RP Coverage Report. |

---

## C. Dashboard & Data Visualization

| # | Feature | What & Why |
|---|---------|-----------|
| 15 | **Compliance Calendar Heatmap** | GitHub-style 30/90-day heatmap of daily scores. Each cell colored by score. Data already exists in `ipd_score_history`. |
| 16 | **RP Coverage Timeline** | Horizontal bar showing RP on-duty sessions as colored blocks, with gaps highlighted in red. Data exists in `todayRp.sessions`. |
| 17 | **Task Completion Stacked Bar Chart** | Daily/weekly bars split into: completed on time (green), completed late (amber), not completed (red). |
| 18 | **Calendar View of Tasks** | Monthly calendar showing which tasks are due/done on which days. Color-coded by completion status. Click a day for details. |
| 19 | **Near-Miss-to-Incident Ratio** | Track this metric — a high ratio indicates good reporting culture (positive indicator for GPhC). |
| 20 | **Days Since Last Incident** | Streak counter on dashboard — visible safety culture metric. |
| 21 | **Raw Fractions on Compliance Tiles** | Show "7/8 current" alongside the percentage. Percentages alone are misleading with small counts. |
| 22 | **Target Markers on Progress Rings** | Add a "target" line at 80% threshold on ProgressRing — shows where the green zone begins. |

---

## D. Productivity & Navigation

| # | Feature | What & Why |
|---|---------|-----------|
| 23 | **Command Palette (Cmd+K)** | Navigation + quick actions + search in one modal. "Log temperature", "Sign in RP", "Go to cleaning", "Add document". Fuzzy matching. `GlobalSearch` component is close but needs modal overlay UX. |
| 24 | **Keyboard Shortcuts** | Extend existing sidebar hints: `Alt+D` Dashboard, `Alt+R` RP Log, `Alt+N` New incident, `Alt+/` show shortcut help overlay. |
| 25 | **Bulk Operations** | Select multiple cleaning tasks → "Mark all as done." Checkbox column + floating action bar (Asana pattern). |
| 26 | **Task Templates** | Saveable templates: "Deep Clean Template", "Inspection Prep Checklist", "New Staff Onboarding." Pre-fill task sets. |
| 27 | **Quick-Add Enhancement** | Extend FAB with radial menu: log temp, record cleaning, add action item, report incident. Show most urgent action first. |
| 28 | **Settings Page Tabs** | Split monolithic Settings.jsx (~800 lines) into tabbed sections: General, Staff, Tasks, Notifications, Data, About. |
| 29 | **Inline Table Editing** | Click a cell to edit in-place (useful for incident status updates, cleaning notes). |
| 30 | **Advanced Table Features** | Multi-column sorting, column-level filters, grouping (e.g., cleaning entries by date or staff), row selection for batch ops. |

---

## E. Communication & Collaboration

| # | Feature | What & Why |
|---|---------|-----------|
| 31 | **Shift Handover Notes** | Outgoing staff writes handover note (pending prescriptions, fridge alarm, patient callbacks). Incoming person sees it prominently on Dashboard. New `shift_handover` Supabase table. |
| 32 | **Activity Feed** | Timeline of recent actions from `audit_log`: "Salma completed Sharps bin check", "Amjid signed in as RP", "System: Document expires in 14 days." |
| 33 | **Assignment Notifications** | When manager assigns a task, show badge/indicator on assignee's Dashboard on next login. |
| 34 | **@Mentions in Notes** | Support `@StaffName` in cleaning notes, incident descriptions, action items. Highlight in UI. |

---

## F. Onboarding & Content

| # | Feature | What & Why |
|---|---------|-----------|
| 35 | **Setup Wizard (First Login)** | Multi-step onboarding: Pharmacy Profile → Staff Setup → Add First Documents → Confirm RP. Track via localStorage flag. |
| 36 | **Tooltip Tour** | Lightweight tour highlighting Dashboard elements on first visit: RP bar, compliance tiles, task checklist, FAB. |
| 37 | **Section Help Text** | Info icon next to section headers with regulatory context: "GPhC Principle 3 requires premises to be clean." |
| 38 | **Smart Tooltips on Scores** | 100% = "Excellent", 80-99% = "Good — minor items need attention", <50% = "Critical — GPhC compliance at risk." |
| 39 | **Quick Reference Cards** | Emergency contacts (GPhC, MHRA, NHS 111), inspection arrival procedure, temperature excursion SOP, CD discrepancy procedure. |
| 40 | **Task Descriptions/SOPs** | Brief SOP text on cleaning tasks: "Counter tops: Clean with antibacterial spray and disposable cloth." Show on expand/hover. |
| 41 | **Regulatory Deadline Reminders** | Auto-calculate: GPhC annual renewal, DBS renewal (3-year), safeguarding refresher (3-year), fire risk assessment (annual). |

---

## G. Gamification & Engagement

| # | Feature | What & Why |
|---|---------|-----------|
| 42 | **Achievement Badges** | "Temperature Pro" (30 days), "Clean Sweep" (all tasks in day), "RP Champion" (zero gaps/month), "Incident Free" (60 days). |
| 43 | **Team Leaderboard** | Weekly task completion ranking. Positive framing ("recognition" not "ranking"). Show top 3 + current user. |
| 44 | **Weekly Summary Digest** | "Your Week in Review" card on Monday: tasks completed, streak, best day, compliance trend, new badges. |
| 45 | **Milestone Celebrations** | Extend confetti to: 7-day streak, 30-day streak, first 100% score. Different intensities. |
| 46 | **Daily Challenge** | Rotating challenge: "Complete all time-sensitive tasks before deadline" → badge progress. |

---

## H. Accessibility (WCAG 2.1 AA)

| # | Feature | What & Why |
|---|---------|-----------|
| 47 | **ARIA Roles on Custom Checkboxes** | TodoSection and TaskRow use `<div>` as checkboxes — need `role="checkbox"`, `aria-checked`, `tabIndex`, keyboard handlers. |
| 48 | **Color Contrast Audit** | Verify `text-ec-t3` and `text-ec-t4` meet 4.5:1 against all backgrounds. |
| 49 | **Don't Rely on Color Alone** | Traffic lights need icons alongside colors: checkmark for green, warning triangle for amber, X for red. |
| 50 | **Visible Focus Rings** | Increase to `focus:ring-2`. Add global `*:focus-visible` style. |
| 51 | **Skip-to-Content Link** | First element in Layout: hidden link that appears on Tab, jumps to `#main-content`. |
| 52 | **Screen Reader Live Regions** | `aria-live="polite"` for compliance score changes, task completion counts, notification count. |
| 53 | **Reduced Motion** | `@media (prefers-reduced-motion: reduce)` — disable all `ec-*` animations. CSS-only change. |
| 54 | **Touch Target Sizes** | Task row checkboxes at 20px are below 44px minimum. Increase visual+clickable area. |
| 55 | **Landmark Roles** | Sidebar `<nav aria-label="Main navigation">`, `<main>`, notification panel `role="dialog"`. |

---

## I. Performance & Technical

| # | Feature | What & Why |
|---|---------|-----------|
| 56 | **PWA Support** | `vite-plugin-pwa` + `manifest.json`. iPad kiosk install, offline access, push notifications. |
| 57 | **Code Splitting** | `React.lazy()` + `Suspense` per page. Current 641KB single bundle exceeds recommended limits. |
| 58 | **Push Notifications** | Service Worker for: RP not signed in, temperature not logged by 10am, document expired. |
| 59 | **Pull-to-Refresh** | Mobile: pull down to re-sync Supabase data. |
| 60 | **SWR Caching** | Cache Supabase data in localStorage, show immediately, refresh in background. |
| 61 | **Real-time Subscriptions** | Supabase Realtime for `rp_log`, `assigned_tasks`, `cleaning_entries`. |

---

## J. Theme & Design

| # | Feature | What & Why |
|---|---------|-----------|
| 62 | **Light Mode Completion** | `useTheme` hook exists but light mode not functional. Add system preference detection (Light/Dark/System). |
| 63 | **Print Stylesheet** | `@media print` CSS for compliance reports, RP logs, audit trail. |
| 64 | **Theme Transition Animation** | Smooth `transition: background-color 0.3s, color 0.3s` on theme switch. |
| 65 | **Responsive Table → Card Layout** | On mobile, convert data tables to stacked cards instead of horizontal scroll. |
| 66 | **Bento Grid Dashboard** | Dynamic sizing — critical items expand, green items condense. |

---

## K. User Roles & Security

| # | Feature | What & Why |
|---|---------|-----------|
| 67 | **Superintendent Role** | View all data, access all reports, cannot be deleted. |
| 68 | **Locum RP Role** | Temporary access, can sign in as RP, cannot modify settings. Auto-expires. |
| 69 | **View-Only/Inspector Role** | Read-only for GPhC inspectors. Time-limited. |
| 70 | **Proper Authentication** | Replace shared password "iPD2026" with individual credentials. |
| 71 | **Session Timeout** | Auto-logout after 30min inactivity. Important for shared pharmacy terminals. |
| 72 | **Audit Trail for Auth Events** | Log login/logout/PIN changes. Currently only logs data changes. |

---

## L. Data Management

| # | Feature | What & Why |
|---|---------|-----------|
| 73 | **CSV Import** | Bulk import staff, documents, training records. Useful for onboarding/migration. |
| 74 | **Data Retention Policy** | Banner when records exceed retention period. Auto-archive old data. |
| 75 | **Backup Scheduling** | Automated daily/weekly JSON backup. Currently manual-only. |
| 76 | **Multi-Branch Support** | Superintendent view across multiple pharmacies with comparative scoring. |

---

## Priority Matrix

### Tier 1: Quick Wins, High Impact
- #9 PDF Report Generation
- #53 Reduced Motion (CSS only)
- #47 ARIA roles on checkboxes
- #21 Raw fractions on compliance tiles
- #28 Settings page tabs
- #10 GPhC Inspection Readiness score
- #51 Skip-to-content link
- #12 Compliance drill-down

### Tier 2: Medium Effort, High Value
- #23 Command Palette (Cmd+K)
- #31 Shift Handover Notes
- #15 Compliance Calendar Heatmap
- #56 PWA Support
- #57 Code Splitting
- #7 Temperature Excursion Handling
- #62 Light Mode Completion
- #35 Setup Wizard

### Tier 3: Larger Features
- #1 Controlled Drugs Register
- #2 SOP Library
- #3 Self-Inspection Checklists
- #11 Staff Competency Matrix
- #70 Proper Authentication
