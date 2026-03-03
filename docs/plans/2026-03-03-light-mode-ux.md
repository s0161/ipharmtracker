# Light Mode, FAB, Error Boundary, Audit Trail & Compliance Report — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a polished light mode theme, floating action button for quick RP tasks, error boundary for crash resilience, an audit trail page, and a print-ready compliance report.

**Architecture:** Convert hardcoded Tailwind `ec-*` colours to CSS custom properties so `[data-theme="light"]` overrides work automatically. Add new pages (AuditLog, ComplianceReport) following existing patterns. FAB is a new Dashboard sub-component sharing existing RP state. ErrorBoundary wraps AuthedApp.

**Tech Stack:** React 18, Tailwind CSS v3 (existing), Supabase (existing), CSS custom properties for theming

---

### Task 1: Convert Tailwind ec-* colours to CSS custom properties

**Files:**
- Modify: `src/index.css` (lines 24-57 dark vars, lines 60-87 light vars)
- Modify: `tailwind.config.js` (lines 6-35 colors)

**Context:** Currently `tailwind.config.js` defines `ec-bg: '#0a0a0a'` as static values. Tailwind classes like `bg-ec-bg` always resolve to `#0a0a0a` regardless of theme. We need to make them reference CSS variables so `[data-theme="light"]` overrides take effect.

**Step 1: Add ec-* CSS custom properties to `:root` in index.css**

In `src/index.css`, add these variables inside the existing `:root` block (after line 56), before the closing `}`:

```css
  /* Emerald Command token variables */
  --ec-bg: #0a0a0a;
  --ec-sidebar: #070707;
  --ec-card: rgba(255,255,255,0.025);
  --ec-card-hover: rgba(255,255,255,0.045);
  --ec-border: rgba(255,255,255,0.06);
  --ec-div: rgba(255,255,255,0.04);
  --ec-t1: #e4e4e7;
  --ec-t2: rgba(255,255,255,0.5);
  --ec-t3: rgba(255,255,255,0.25);
  --ec-t4: rgba(255,255,255,0.15);
  --ec-t5: rgba(255,255,255,0.08);
  --ec-em: #10b981;
  --ec-em-dark: #059669;
  --ec-em-faint: rgba(16,185,129,0.06);
  --ec-warn: #f59e0b;
  --ec-warn-light: #fcd34d;
  --ec-warn-faint: rgba(245,158,11,0.08);
  --ec-crit: #ef4444;
  --ec-crit-light: #fca5a5;
  --ec-crit-faint: rgba(239,68,68,0.06);
  --ec-info: #6366f1;
  --ec-info-light: #a5b4fc;
  --ec-z6: #52525b;
```

**Step 2: Add light mode overrides to `[data-theme="light"]` block in index.css**

Inside the existing `[data-theme="light"]` block (after line 86), add:

```css
  /* Emerald Command light overrides */
  --ec-bg: #f8fafc;
  --ec-sidebar: #ffffff;
  --ec-card: #ffffff;
  --ec-card-hover: #f8fafc;
  --ec-border: #e2e8f0;
  --ec-div: #f1f5f9;
  --ec-t1: #0f172a;
  --ec-t2: #475569;
  --ec-t3: #94a3b8;
  --ec-t4: #cbd5e1;
  --ec-t5: #e2e8f0;
  --ec-em: #059669;
  --ec-em-dark: #047857;
  --ec-em-faint: rgba(5,150,105,0.06);
  --ec-warn: #d97706;
  --ec-warn-light: #b45309;
  --ec-warn-faint: rgba(217,119,6,0.08);
  --ec-crit: #dc2626;
  --ec-crit-light: #b91c1c;
  --ec-crit-faint: rgba(220,38,38,0.06);
  --ec-info: #4f46e5;
  --ec-info-light: #4338ca;
  --ec-z6: #64748b;
```

Also update the existing light mode `--primary` to emerald (currently blue):
```css
  --primary: #059669;
  --primary-dark: #047857;
  --primary-light: #10b981;
  --primary-fade: rgba(5, 150, 105, 0.08);
  --accent: #10b981;
  --accent-light: #34d399;
  --success: #059669;
  --success-bg: rgba(5, 150, 105, 0.1);
```

**Step 3: Update tailwind.config.js colours to use CSS vars**

Replace the `colors.ec` object in `tailwind.config.js` (lines 7-35) with:

```javascript
ec: {
  bg: 'var(--ec-bg)',
  sidebar: 'var(--ec-sidebar)',
  card: 'var(--ec-card)',
  'card-hover': 'var(--ec-card-hover)',
  border: 'var(--ec-border)',
  div: 'var(--ec-div)',
  t1: 'var(--ec-t1)',
  t2: 'var(--ec-t2)',
  t3: 'var(--ec-t3)',
  t4: 'var(--ec-t4)',
  t5: 'var(--ec-t5)',
  em: 'var(--ec-em)',
  'em-dark': 'var(--ec-em-dark)',
  'em-faint': 'var(--ec-em-faint)',
  warn: 'var(--ec-warn)',
  'warn-light': 'var(--ec-warn-light)',
  'warn-faint': 'var(--ec-warn-faint)',
  crit: 'var(--ec-crit)',
  'crit-light': 'var(--ec-crit-light)',
  'crit-faint': 'var(--ec-crit-faint)',
  info: 'var(--ec-info)',
  'info-light': 'var(--ec-info-light)',
  high: 'var(--ec-crit)',
  medium: 'var(--ec-warn)',
  low: 'var(--ec-em)',
  z6: 'var(--ec-z6)',
  z9: '#18181b',
},
```

**Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds. All Tailwind classes now reference CSS variables.

**Step 5: Commit**

```bash
git add src/index.css tailwind.config.js
git commit -m "feat: convert ec-* palette to CSS custom properties for theme support"
```

---

### Task 2: Fix hardcoded dark colours in Sidebar

**Files:**
- Modify: `src/components/Sidebar.jsx`

**Context:** Sidebar uses hardcoded dark values: `bg-ec-sidebar` (now variable, good), but also inline styles like `background: 'linear-gradient(135deg, #10b981, #059669)'` and Tailwind classes like `bg-white/[0.06]`, `text-[#a1a1aa]`, `bg-black/75` which don't respond to light mode. Also icon colours are hardcoded `#52525b` and `#e4e4e7`.

**Step 1: Fix inline gradient styles to use CSS variables**

In `Sidebar.jsx`, replace the emerald gradient edge (lines 94-97):
```jsx
style={{ background: 'linear-gradient(to bottom, var(--ec-em) 0%, rgba(16,185,129,0.2) 40%, transparent 100%)' }}
```

Replace the emerald radial glow (lines 99-102):
```jsx
style={{ background: 'radial-gradient(ellipse at 0% 0%, rgba(16,185,129,0.04), transparent 70%)' }}
```
This is subtle enough for both themes — leave as-is or reduce opacity slightly.

Replace brand logo gradient (lines 108-111):
```jsx
style={{
  background: 'linear-gradient(135deg, var(--ec-em), var(--ec-em-dark))',
  boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
}}
```

Replace user avatar gradient (lines 198-200):
```jsx
style={{
  background: 'linear-gradient(135deg, var(--ec-em), var(--ec-em-dark))',
  boxShadow: '0 2px 8px rgba(16,185,129,0.2)',
}}
```

**Step 2: Fix hardcoded Tailwind class colours**

The `aside` element (line 88): `bg-ec-sidebar` is now variable — good.

Mobile overlay (line 82): Change `bg-black/75` to use a theme-aware class:
```jsx
className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[49] lg:hidden"
```
(Black overlay works for both themes — reduce to 50%)

Active nav state (line 151): `bg-white/[0.06]` — for light mode this should be `bg-black/[0.04]`. Use CSS variable approach:
```jsx
// Replace the isActive ternary (lines 150-154) with:
${isActive
  ? 'font-semibold'
  : 'font-normal'
}
```
And add a style prop for the background:
```jsx
style={isActive ? {
  backgroundColor: 'var(--bg-card)',
  color: 'var(--text)',
  boxShadow: 'var(--shadow)',
} : {
  color: 'var(--text-muted)',
}}
```

Hover state: `hover:bg-white/[0.03]` — change to:
```jsx
hover:bg-ec-card
```

Icon colours (line 159): Replace hardcoded `#e4e4e7` and `#52525b`:
```jsx
<NI name={item.icon} color={isActive ? 'var(--text)' : 'var(--text-muted)'} />
```

Theme toggle icon (line 188):
```jsx
<NI name={theme === 'dark' ? 'sun' : 'moon'} color="var(--text-muted)" />
```

Theme toggle button (lines 181-190): Change `text-ec-z6` and hover classes to use variable-aware classes:
```jsx
className="... bg-transparent text-ec-z6 hover:bg-ec-card hover:text-ec-t2 ..."
```

**Step 3: Add light mode shadow to sidebar**

Add to `src/index.css` inside `[data-theme="light"]`:
```css
[data-theme="light"] aside {
  box-shadow: 1px 0 0 #e2e8f0, 2px 0 8px rgba(0,0,0,0.04);
}
```

**Step 4: Verify**

Run: `npm run dev`
Toggle light mode via sidebar button. Sidebar should have white background, readable text, emerald logo, proper active states.

**Step 5: Commit**

```bash
git add src/components/Sidebar.jsx src/index.css
git commit -m "feat: make sidebar fully light-mode responsive"
```

---

### Task 3: Fix hardcoded dark colours across Dashboard components

**Files:**
- Modify: `src/pages/Dashboard.jsx`
- Modify: `src/components/dashboard/StickyKeys.jsx`
- Modify: `src/components/dashboard/NotificationBell.jsx`
- Modify: `src/components/dashboard/RPPresenceBar.jsx`
- Modify: `src/components/dashboard/ShiftChecklist.jsx`
- Modify: `src/components/dashboard/ComplianceHealth.jsx`
- Modify: `src/components/dashboard/AccPanel.jsx`
- Modify: `src/components/dashboard/TaskRow.jsx`
- Modify: `src/components/dashboard/TodoSection.jsx`
- Modify: `src/components/dashboard/AlertBanner.jsx`

**Context:** Dashboard and its sub-components use many hardcoded dark-specific values: `rgba(255,255,255,...)` for backgrounds/borders, `#0a0a0a` for gradients, `rgba(0,0,0,...)` for shadows. These need to use CSS variables or theme-aware classes.

**Step 1: Dashboard.jsx hardcoded values**

Search and replace these patterns:

| Find | Replace With | Notes |
|------|-------------|-------|
| `bg-[rgba(15,15,15,0.95)]` (tooltips) | `bg-ec-sidebar` | Tooltip background |
| `border-white/[0.08]` (tooltips) | `border-ec-border` | Already a variable |
| `shadow-[0_8px_24px_rgba(0,0,0,0.6)]` | `shadow-lg` | Use Tailwind built-in |
| `bg-white/[0.03]` | `bg-ec-card` | Card backgrounds |
| `bg-white/[0.06]` | Style `backgroundColor: 'var(--bg-card)'` | Active backgrounds |
| `border-white/[0.06]` | `border-ec-border` | All borders |
| `rgba(255,255,255,0.04)` in styles | `var(--ec-div)` | Divider colour |
| `rgba(255,255,255,0.06)` in styles | `var(--ec-border)` | Border colour |
| `#0a0a0a` in scroll fade gradient | `var(--ec-bg)` | Scroll fade |

The scroll fade (line ~718):
```jsx
style={{
  left: mob ? 0 : 220,
  background: `linear-gradient(to top, var(--ec-bg), transparent)`,
  opacity: scrollFade ? 1 : 0,
}}
```

**Step 2: StickyKeys.jsx hardcoded values**

Replace inline styles (lines 52-58):
```jsx
style={{
  minWidth: mob ? 'calc(33% - 8px)' : 0,
  height: 58,
  cursor: st?.d ? 'default' : 'pointer',
  border: `1px solid ${st?.d ? 'rgba(16,185,129,0.15)' : 'var(--ec-border)'}`,
  backgroundColor: st?.d ? 'var(--ec-em-faint)' : 'var(--ec-card)',
  boxShadow: st?.d
    ? '0 0 12px rgba(16,185,129,0.06)'
    : 'var(--shadow)',
  transform: pr ? 'scale(0.95)' : jc ? 'scale(1.02)' : 'scale(1)',
  transitionTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)',
}}
```

Fridge input (line 76): Replace `bg-white/[0.06]` and `border-white/10`:
```jsx
className="w-11 px-1 py-0.5 rounded-[5px] border border-ec-border bg-ec-card text-ec-t1 text-xs text-center outline-none font-sans"
```

**Step 3: Fix remaining sub-components**

For each file, search for `rgba(255,255,255` and `rgba(0,0,0` in inline styles, and replace with the equivalent `var(--ec-*)` variable. Also replace any `#0a0a0a`, `#070707`, `#e4e4e7` hardcoded values.

Key replacements across all files:
- `rgba(255,255,255,0.025)` → `var(--ec-card)`
- `rgba(255,255,255,0.06)` → `var(--ec-border)`
- `rgba(255,255,255,0.04)` → `var(--ec-div)`
- `rgba(255,255,255,0.5)` → `var(--ec-t2)`
- `rgba(255,255,255,0.25)` → `var(--ec-t3)`
- `#0a0a0a` → `var(--ec-bg)`
- `#e4e4e7` → `var(--ec-t1)`

**Step 4: Verify**

Run: `npm run dev`
Toggle between dark and light mode. All Dashboard sections should have proper contrast and readability in both modes.

**Step 5: Commit**

```bash
git add src/pages/Dashboard.jsx src/components/dashboard/
git commit -m "feat: make all dashboard components light-mode responsive"
```

---

### Task 4: Fix hardcoded colours in remaining pages

**Files:**
- Modify: `src/components/Layout.jsx`
- Modify: `src/pages/Login.jsx`
- Modify: `src/pages/PinSelect.jsx`
- Modify: All other page files that use hardcoded dark colours

**Context:** Layout.jsx, Login.jsx, and several other pages use inline styles with `#0a0a0a`, `rgba(255,255,255,...)` etc. These need the same treatment.

**Step 1: Layout.jsx**

Replace background gradients that reference `#0a0a0a` or dark-specific colours with `var(--ec-bg)`.

**Step 2: Login.jsx**

Line 36: `style={{ backgroundColor: '#0a0a0a' }}` → `style={{ backgroundColor: 'var(--ec-bg)' }}`

Card background (line 41): `backgroundColor: 'rgba(255,255,255,0.025)'` → `backgroundColor: 'var(--ec-card)'`

Card border: `border: '1px solid rgba(255,255,255,0.08)'` → `border: '1px solid var(--ec-border)'`

Card shadow: Use `var(--shadow-lg)`

Input styles: Replace `bg-white/[0.04]` with `bg-ec-card`, `border-white/[0.06]` with `border-ec-border`

**Step 3: PinSelect.jsx**

Apply same pattern — replace hardcoded dark values with CSS variables. The existing `[data-theme="light"] .pin-staff-btn` CSS in index.css already handles some of this, but check for inline styles.

**Step 4: Other pages**

Grep all `.jsx` files for `rgba(255,255,255` and `#0a0a0a` in inline styles. Fix each occurrence. Key pages to check:
- `RPLog.jsx` — form cards use `rgba(255,255,255,0.025)` backgrounds
- `DocumentTracker.jsx` — table borders
- `Settings.jsx` — form sections
- `TemperatureLog.jsx`, `Incidents.jsx`, `NearMissLog.jsx` — same patterns

**Step 5: Verify**

Run: `npm run dev`
Navigate to every page in light mode. Check for:
- Dark backgrounds that should be white
- White text on white backgrounds (invisible text)
- Dark borders that should be light gray
- Emerald accent is `#059669` (readable on white)

**Step 6: Commit**

```bash
git add src/
git commit -m "feat: make all pages light-mode responsive"
```

---

### Task 5: Add light mode card shadows and polish

**Files:**
- Modify: `src/index.css`

**Context:** In dark mode, cards use subtle `rgba(255,255,255,0.025)` backgrounds. In light mode, white cards on a light gray background need shadows to define their boundaries.

**Step 1: Add comprehensive light mode card styles**

Add to `src/index.css` after the existing `[data-theme="light"]` blocks:

```css
/* ── Light mode card styles ── */
[data-theme="light"] .rounded-2xl,
[data-theme="light"] .rounded-xl {
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04);
}

[data-theme="light"] table {
  border: 1px solid #e2e8f0;
}

[data-theme="light"] table thead {
  background: #f8fafc;
}

[data-theme="light"] table tbody tr:hover {
  background: #f8fafc;
}

/* Light mode inputs */
[data-theme="light"] input,
[data-theme="light"] textarea,
[data-theme="light"] select {
  background: #ffffff;
  border-color: #e2e8f0;
  color: #0f172a;
}

[data-theme="light"] input::placeholder,
[data-theme="light"] textarea::placeholder {
  color: #94a3b8;
}

/* Light mode badges */
[data-theme="light"] .bg-ec-em\/10 { background: rgba(5,150,105,0.1); }
[data-theme="light"] .bg-ec-warn\/10 { background: rgba(217,119,6,0.1); }
[data-theme="light"] .bg-ec-crit\/10 { background: rgba(220,38,38,0.1); }
```

**Step 2: Verify**

Toggle light mode. Cards should have subtle shadows, tables should have visible borders, inputs should look clean.

**Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat: add light mode card shadows and input polish"
```

---

### Task 6: Create ErrorBoundary component

**Files:**
- Create: `src/components/ErrorBoundary.jsx`
- Modify: `src/App.jsx`

**Step 1: Create ErrorBoundary.jsx**

```jsx
import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, showDetails: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backgroundColor: 'var(--bg, #0a0a0a)',
        fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
      }}>
        <div style={{
          maxWidth: 400,
          textAlign: 'center',
          color: 'var(--text, #e4e4e7)',
        }}>
          {/* iPD logo */}
          <svg viewBox="0 0 40 40" width="48" height="48" style={{ margin: '0 auto 16px' }}>
            <defs>
              <linearGradient id="err-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
            <rect rx="12" width="40" height="40" fill="url(#err-grad)" />
            <text x="20" y="26" textAnchor="middle" fill="white" fontWeight="700" fontSize="13">iPD</text>
          </svg>

          <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>Something went wrong</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary, rgba(255,255,255,0.5))', margin: '0 0 24px' }}>
            An unexpected error occurred. Try refreshing the page.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: '#10b981',
                color: 'white',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Refresh page
            </button>
            <button
              onClick={() => {
                localStorage.clear()
                window.location.reload()
              }}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: '1px solid var(--border, rgba(255,255,255,0.06))',
                backgroundColor: 'transparent',
                color: 'var(--text, #e4e4e7)',
                fontWeight: 500,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Clear data &amp; retry
            </button>
          </div>

          {/* Expandable error details */}
          <button
            onClick={() => this.setState(s => ({ showDetails: !s.showDetails }))}
            style={{
              marginTop: 24,
              background: 'none',
              border: 'none',
              color: 'var(--text-muted, rgba(255,255,255,0.25))',
              fontSize: 12,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            {this.state.showDetails ? 'Hide' : 'Show'} error details
          </button>
          {this.state.showDetails && (
            <pre style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 8,
              backgroundColor: 'var(--bg-secondary, #111)',
              color: 'var(--text-muted, rgba(255,255,255,0.25))',
              fontSize: 11,
              textAlign: 'left',
              overflow: 'auto',
              maxHeight: 200,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      </div>
    )
  }
}
```

**Step 2: Wrap AuthedApp in App.jsx**

In `src/App.jsx`, add import at top:
```jsx
import ErrorBoundary from './components/ErrorBoundary'
```

Wrap the return in the `App` function (lines 54-58):
```jsx
return (
  <UserProvider>
    <ErrorBoundary>
      <AuthedApp />
    </ErrorBoundary>
  </UserProvider>
)
```

**Step 3: Verify**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/components/ErrorBoundary.jsx src/App.jsx
git commit -m "feat: add error boundary to catch and display React crashes"
```

---

### Task 7: Create Floating Action Button component

**Files:**
- Create: `src/components/dashboard/FloatingActionButton.jsx`
- Modify: `src/pages/Dashboard.jsx`

**Step 1: Create FloatingActionButton.jsx**

```jsx
import { useState, useRef, useEffect } from 'react'

const ACTIONS = [
  { id: 'rpToggle', label: 'RP Sign In', labelAlt: 'RP Sign Out', icon: 'shield', color: '#6366f1' },
  { id: 'fridgeTemp', label: 'Fridge Temp', icon: 'therm', color: '#10b981' },
  { id: 'cdCheck', label: 'CD Check', icon: 'pill', color: '#f59e0b' },
  { id: 'rpNotice', label: 'RP Notice', icon: 'clip', color: '#3b82f6' },
  { id: 'opening', label: 'Open/Close', icon: 'door', color: '#8b5cf6' },
]

const icons = {
  shield: (c) => <path d="M12 2L4 6v5c0 5.5 3.5 9 8 11 4.5-2 8-5.5 8-11V6l-8-4z" stroke={c} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  therm: (c) => <path d="M12 4v10a4 4 0 11-4 0V4a2 2 0 114 0z" stroke={c} strokeWidth="1.5" fill="none" />,
  pill: (c) => <><ellipse cx="12" cy="12" rx="5" ry="8" transform="rotate(45 12 12)" stroke={c} strokeWidth="1.5" fill="none" /><line x1="8.5" y1="8.5" x2="15.5" y2="15.5" stroke={c} strokeWidth="1.5" /></>,
  clip: (c) => <><rect x="6" y="3" width="12" height="18" rx="2" stroke={c} strokeWidth="1.5" fill="none" /><path d="M9 3V2h6v1M10 10h4M10 14h6" stroke={c} strokeWidth="1.5" fill="none" /></>,
  door: (c) => <><rect x="4" y="2" width="16" height="20" rx="2" stroke={c} strokeWidth="1.5" fill="none" /><circle cx="15" cy="12" r="1.5" fill={c} /></>,
  check: (c) => <path d="M5 12l4 4L19 7" stroke={c} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
}

export default function FloatingActionButton({
  keys, rpSignedIn, onKeyPress, onRpToggle,
  showFridge, fridgeVal, onFridgeChange, onFridgeSubmit,
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleAction = (id) => {
    if (id === 'rpToggle') {
      onRpToggle()
      setOpen(false)
      return
    }
    onKeyPress(id)
    if (id !== 'fridgeTemp') setOpen(false)
  }

  return (
    <div ref={ref} className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-center gap-3">
      {/* Main FAB button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full border-none cursor-pointer shadow-lg transition-all duration-300 flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, var(--ec-em), var(--ec-em-dark))',
          boxShadow: '0 4px 20px rgba(16,185,129,0.35)',
          transform: open ? 'rotate(45deg)' : 'rotate(0)',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <line x1="12" y1="5" x2="12" y2="19" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <line x1="5" y1="12" x2="19" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* Action buttons */}
      {open && ACTIONS.map((action, i) => {
        const isDone = action.id !== 'rpToggle' && keys[action.id]?.d
        const label = action.id === 'rpToggle'
          ? (rpSignedIn ? action.labelAlt : action.label)
          : action.label
        const isFridge = action.id === 'fridgeTemp' && showFridge

        return (
          <div
            key={action.id}
            className="flex items-center gap-2 ec-fadeup"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            {/* Label */}
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-lg whitespace-nowrap"
              style={{
                backgroundColor: 'var(--ec-card)',
                border: '1px solid var(--ec-border)',
                color: 'var(--ec-t2)',
                boxShadow: 'var(--shadow)',
              }}
            >
              {isDone ? `${label} ✓` : label}
              {isDone && keys[action.id]?.t && (
                <span className="ml-1 text-ec-em">{keys[action.id].t}</span>
              )}
            </span>

            {/* Fridge input */}
            {isFridge && (
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  value={fridgeVal}
                  onChange={e => onFridgeChange(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') onFridgeSubmit() }}
                  placeholder="°C"
                  className="w-12 px-1.5 py-1 rounded-lg border border-ec-border bg-ec-card text-ec-t1 text-xs text-center outline-none font-sans"
                  onClick={e => e.stopPropagation()}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); onFridgeSubmit() }}
                  className="bg-ec-em border-none rounded-lg text-white text-xs px-2 py-1 cursor-pointer font-semibold"
                >
                  ✓
                </button>
              </div>
            )}

            {/* Action circle */}
            <button
              onClick={() => handleAction(action.id)}
              disabled={isDone}
              className="w-11 h-11 rounded-full border-none cursor-pointer transition-all duration-200 flex items-center justify-center"
              style={{
                backgroundColor: isDone ? 'var(--ec-em-faint)' : 'var(--ec-card)',
                border: `1px solid ${isDone ? 'rgba(16,185,129,0.2)' : 'var(--ec-border)'}`,
                boxShadow: 'var(--shadow-md)',
                opacity: isDone ? 0.7 : 1,
                cursor: isDone ? 'default' : 'pointer',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                {isDone ? icons.check('#10b981') : icons[action.icon](action.color)}
              </svg>
            </button>
          </div>
        )
      })}

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 -z-10"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  )
}
```

**Step 2: Wire into Dashboard.jsx**

Add import:
```jsx
import { FloatingActionButton } from '../components/dashboard'
```

Add to barrel export in `src/components/dashboard/index.js`:
```jsx
export { default as FloatingActionButton } from './FloatingActionButton'
```

Render just before the closing `</div>` of the Dashboard return (before the scroll fade div):
```jsx
<FloatingActionButton
  keys={keys}
  rpSignedIn={rpSignedIn}
  onKeyPress={handleKeyPress}
  onRpToggle={handleRpToggle}
  showFridge={showFridge}
  fridgeVal={fridgeVal}
  onFridgeChange={setFridgeVal}
  onFridgeSubmit={submitFridge}
/>
```

**Step 3: Verify**

Run: `npm run dev`
- FAB appears bottom-right as emerald circle with +
- Click expands 5 action buttons upward with stagger animation
- Actions mark done with checkmark
- Fridge action shows inline input
- RP toggle changes label
- Click backdrop or complete action closes menu

**Step 4: Commit**

```bash
git add src/components/dashboard/FloatingActionButton.jsx src/components/dashboard/index.js src/pages/Dashboard.jsx
git commit -m "feat: add floating action button for quick RP tasks"
```

---

### Task 8: Create Audit Trail page

**Files:**
- Create: `src/pages/AuditLog.jsx`
- Modify: `src/App.jsx` (add route)
- Modify: `src/components/Sidebar.jsx` (add nav item)

**Step 1: Create AuditLog.jsx**

```jsx
import { useState, useMemo } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import { downloadCsv } from '../utils/exportCsv'
import PageActions from '../components/PageActions'

export default function AuditLog() {
  const [logs, , loading] = useSupabase('audit_log', [])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const categories = useMemo(() => {
    const set = new Set(logs.map(l => l.page).filter(Boolean))
    return [...set].sort()
  }, [logs])

  const users = useMemo(() => {
    const set = new Set(logs.map(l => l.user).filter(Boolean))
    return [...set].sort()
  }, [logs])

  const filtered = useMemo(() => {
    return logs
      .filter(l => {
        if (search && !l.item?.toLowerCase().includes(search.toLowerCase()) && !l.action?.toLowerCase().includes(search.toLowerCase())) return false
        if (category && l.page !== category) return false
        if (userFilter && l.user !== userFilter) return false
        if (dateFrom && l.timestamp?.slice(0, 10) < dateFrom) return false
        if (dateTo && l.timestamp?.slice(0, 10) > dateTo) return false
        return true
      })
      .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
  }, [logs, search, category, userFilter, dateFrom, dateTo])

  const handleCsvDownload = () => {
    const headers = ['Timestamp', 'Action', 'Description', 'Category', 'User']
    const rows = filtered.map(l => [
      l.timestamp ? new Date(l.timestamp).toLocaleString('en-GB') : '',
      l.action || '',
      l.item || '',
      l.page || '',
      l.user || '',
    ])
    downloadCsv('audit-log', headers, rows)
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-ec-t3 text-sm">Loading…</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-ec-t3 mb-2">
          Full audit trail of all actions taken across the system.
        </p>
        <div className="flex items-center gap-2 mb-4">
          <PageActions onDownloadCsv={handleCsvDownload} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-ec-card border border-ec-border rounded-lg px-3 py-2 text-sm text-ec-t1 placeholder:text-ec-t3 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors font-sans w-48"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-ec-card border border-ec-border rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-ec-em/40 font-sans"
        >
          <option value="">All categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="bg-ec-card border border-ec-border rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-ec-em/40 font-sans"
        >
          <option value="">All users</option>
          {users.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="bg-ec-card border border-ec-border rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-ec-em/40 font-sans"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="bg-ec-card border border-ec-border rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-ec-em/40 font-sans"
        />
      </div>

      {/* Results count */}
      <div className="text-xs text-ec-t3">{filtered.length} entries</div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-ec-t3 text-sm">No audit log entries found.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--ec-border)' }}>
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead className="text-left">
              <tr>
                <th className="text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">Timestamp</th>
                <th className="text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">Action</th>
                <th className="text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">Description</th>
                <th className="text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border hidden md:table-cell">Category</th>
                <th className="text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border hidden md:table-cell">User</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((log, i) => {
                const actionColor = log.action === 'Deleted' ? 'text-ec-crit' : log.action === 'Created' ? 'text-ec-em' : 'text-ec-warn'
                return (
                  <tr key={log.id || i} className="hover:bg-ec-card transition-colors">
                    <td className="px-4 py-2.5 text-ec-t2 border-b border-ec-div text-xs tabular-nums whitespace-nowrap">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className={`px-4 py-2.5 border-b border-ec-div font-semibold text-xs ${actionColor}`}>
                      {log.action}
                    </td>
                    <td className="px-4 py-2.5 text-ec-t1 border-b border-ec-div">{log.item || '—'}</td>
                    <td className="px-4 py-2.5 text-ec-t3 border-b border-ec-div hidden md:table-cell">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-ec-card border border-ec-border">{log.page || '—'}</span>
                    </td>
                    <td className="px-4 py-2.5 text-ec-t2 border-b border-ec-div hidden md:table-cell">{log.user || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Add route in App.jsx**

Add import:
```jsx
import AuditLog from './pages/AuditLog'
```

Add route (after `/settings`):
```jsx
<Route path="/audit-log" element={<AuditLog />} />
```

**Step 3: Add to Sidebar**

In `src/components/Sidebar.jsx`, add a new icon `log` to the `NI` component's `m` object:
```jsx
log: <><path d="M3 3h10a2 2 0 012 2v10a2 2 0 01-2 2H3V3z" {...p} /><path d="M6 7h4M6 10h6" {...p} /></>,
```

Add nav item to the SYSTEM section (after Settings, before the closing `]`):
```jsx
{ to: '/audit-log', label: 'Audit Log', icon: 'log' },
```

**Step 4: Verify**

Run: `npm run dev`
- Navigate to Audit Log via sidebar
- Table shows entries with coloured action badges
- Filters work (search, category, user, date range)
- CSV export downloads

**Step 5: Commit**

```bash
git add src/pages/AuditLog.jsx src/App.jsx src/components/Sidebar.jsx
git commit -m "feat: add audit trail page with filters and CSV export"
```

---

### Task 9: Create Compliance Report page

**Files:**
- Create: `src/pages/ComplianceReport.jsx`
- Modify: `src/App.jsx` (add route)
- Modify: `src/components/Sidebar.jsx` (add nav item)
- Modify: `src/index.css` (add print styles)

**Step 1: Create ComplianceReport.jsx**

```jsx
import { useMemo } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import { usePharmacyConfig } from '../hooks/usePharmacyConfig'
import { getTrafficLight, getSafeguardingStatus, getTaskStatus, DEFAULT_CLEANING_TASKS } from '../utils/helpers'

function ScoreCard({ label, score, items }) {
  const color = score >= 80 ? 'var(--ec-em)' : score >= 50 ? 'var(--ec-warn)' : 'var(--ec-crit)'
  return (
    <div
      className="rounded-xl p-4 flex-1 min-w-[200px]"
      style={{ backgroundColor: 'var(--ec-card)', border: '1px solid var(--ec-border)' }}
    >
      <div className="text-xs font-bold text-ec-t3 uppercase tracking-wider mb-2">{label}</div>
      <div className="text-3xl font-extrabold mb-1" style={{ color }}>{score}%</div>
      <div className="text-xs text-ec-t3">{items}</div>
    </div>
  )
}

export default function ComplianceReport() {
  const [pharmacyConfig] = usePharmacyConfig()
  const [documents] = useSupabase('documents', [])
  const [staffTraining] = useSupabase('staff_training', [])
  const [safeguarding] = useSupabase('safeguarding_records', [])
  const [cleaningTasks] = useSupabase('cleaning_tasks', DEFAULT_CLEANING_TASKS)
  const [cleaningEntries] = useSupabase('cleaning_entries', [])
  const [rpLogs] = useSupabase('rp_log', [])

  // Scores
  const docStatuses = documents.map(d => getTrafficLight(d.expiryDate))
  const greenDocs = docStatuses.filter(s => s === 'green').length
  const docScore = documents.length > 0 ? Math.round((greenDocs / documents.length) * 100) : 100

  const staffScore = staffTraining.length > 0
    ? Math.round((staffTraining.filter(e => e.status === 'Complete').length / staffTraining.length) * 100) : 100

  const seen = new Set()
  const taskStatuses = cleaningTasks.filter(t => {
    if (seen.has(t.name)) return false; seen.add(t.name); return true
  }).map(t => ({ ...t, status: getTaskStatus(t.name, t.frequency, cleaningEntries) }))

  const cleaningUpToDate = taskStatuses.filter(t => t.status === 'done' || t.status === 'upcoming').length
  const cleaningScore = cleaningTasks.length > 0 ? Math.round((cleaningUpToDate / taskStatuses.length) * 100) : 100

  const sgCurrent = safeguarding.filter(r => getSafeguardingStatus(r.trainingDate) === 'current').length
  const sgScore = safeguarding.length > 0 ? Math.round((sgCurrent / safeguarding.length) * 100) : 100

  const overallScore = Math.round((docScore + staffScore + cleaningScore + sgScore) / 4)
  const overallColor = overallScore >= 80 ? 'var(--ec-em)' : overallScore >= 50 ? 'var(--ec-warn)' : 'var(--ec-crit)'

  // RP coverage (last 30 days)
  const rpCoverage = useMemo(() => {
    const days = []
    const d = new Date()
    for (let i = 0; i < 30; i++) {
      days.push(d.toISOString().slice(0, 10))
      d.setDate(d.getDate() - 1)
    }
    const loggedDates = new Set(rpLogs.map(l => l.date))
    const covered = days.filter(day => loggedDates.has(day)).length
    const gaps = days.filter(day => !loggedDates.has(day))
    return { covered, total: 30, gaps }
  }, [rpLogs])

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6 compliance-report">
      {/* Print button (hidden in print) */}
      <div className="flex justify-end no-print">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-lg bg-ec-em text-white font-semibold text-sm border-none cursor-pointer hover:bg-ec-em-dark transition-colors"
        >
          Print Report
        </button>
      </div>

      {/* Header */}
      <div
        className="rounded-xl p-6 text-center"
        style={{ backgroundColor: 'var(--ec-card)', border: '1px solid var(--ec-border)' }}
      >
        <div className="text-lg font-extrabold text-ec-t1">{pharmacyConfig.pharmacyName || 'iPharmacy Direct'}</div>
        {pharmacyConfig.address && <div className="text-sm text-ec-t3 mt-1">{pharmacyConfig.address}</div>}
        <div className="text-xs text-ec-t3 mt-2">
          GPhC: {pharmacyConfig.gphcNumber || '—'} · Superintendent: {pharmacyConfig.superintendent || '—'}
        </div>
        <div className="text-xs text-ec-t2 mt-3 font-semibold">Compliance Report — {today}</div>
      </div>

      {/* Overall score */}
      <div className="text-center py-4">
        <div className="text-6xl font-extrabold" style={{ color: overallColor }}>{overallScore}%</div>
        <div className="text-sm text-ec-t3 mt-1">Overall Compliance Score</div>
      </div>

      {/* 4 score cards */}
      <div className="flex gap-4 flex-wrap">
        <ScoreCard label="Documents" score={docScore} items={`${greenDocs}/${documents.length} current`} />
        <ScoreCard label="Training" score={staffScore} items={`${staffTraining.filter(e => e.status === 'Complete').length}/${staffTraining.length} complete`} />
        <ScoreCard label="Cleaning" score={cleaningScore} items={`${cleaningUpToDate}/${taskStatuses.length} up to date`} />
        <ScoreCard label="Safeguarding" score={sgScore} items={`${sgCurrent}/${safeguarding.length} current`} />
      </div>

      {/* RP Coverage */}
      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: 'var(--ec-card)', border: '1px solid var(--ec-border)' }}
      >
        <h3 className="text-sm font-bold text-ec-t1 mb-3">RP Log Coverage (Last 30 Days)</h3>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl font-extrabold text-ec-t1">{rpCoverage.covered}/{rpCoverage.total}</span>
          <span className="text-xs text-ec-t3">days covered</span>
        </div>
        {rpCoverage.gaps.length > 0 && rpCoverage.gaps.length <= 10 && (
          <div className="text-xs text-ec-warn mt-2">
            Gap days: {rpCoverage.gaps.slice(0, 10).join(', ')}
          </div>
        )}
      </div>

      {/* Document status table */}
      <div>
        <h3 className="text-sm font-bold text-ec-t1 mb-3">Document Status</h3>
        {documents.length === 0 ? (
          <div className="text-sm text-ec-t3">No documents tracked.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--ec-border)' }}>
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
              <thead className="text-left">
                <tr>
                  <th className="text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">Document</th>
                  <th className="text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">Category</th>
                  <th className="text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">Expiry Date</th>
                  <th className="text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">Status</th>
                </tr>
              </thead>
              <tbody>
                {documents.map(doc => {
                  const status = getTrafficLight(doc.expiryDate)
                  const statusLabel = status === 'green' ? 'Current' : status === 'amber' ? 'Expiring Soon' : 'Expired'
                  const statusColor = status === 'green' ? 'text-ec-em' : status === 'amber' ? 'text-ec-warn' : 'text-ec-crit'
                  return (
                    <tr key={doc.id}>
                      <td className="px-4 py-2.5 text-ec-t1 border-b border-ec-div font-medium">{doc.documentName}</td>
                      <td className="px-4 py-2.5 text-ec-t3 border-b border-ec-div">{doc.category || '—'}</td>
                      <td className="px-4 py-2.5 text-ec-t2 border-b border-ec-div tabular-nums">{doc.expiryDate || '—'}</td>
                      <td className={`px-4 py-2.5 border-b border-ec-div font-semibold text-xs ${statusColor}`}>{statusLabel}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-4 border-t border-ec-div text-xs text-ec-t5">
        Generated by iPharmacy Direct Compliance Tracker
      </div>
    </div>
  )
}
```

**Step 2: Add route in App.jsx**

Add import:
```jsx
import ComplianceReport from './pages/ComplianceReport'
```

Add route:
```jsx
<Route path="/compliance-report" element={<ComplianceReport />} />
```

**Step 3: Add to Sidebar**

Add new icon `report` to `NI` component:
```jsx
report: <><rect x="3" y="2" width="10" height="12" rx="1" {...p} /><path d="M6 5h4M6 8h2M11 7v5a2 2 0 01-2 2H5" {...p} /></>,
```

Add nav item to COMPLIANCE section (after Near Misses):
```jsx
{ to: '/compliance-report', label: 'Compliance Report', icon: 'report' },
```

**Step 4: Add print styles to index.css**

Add at the end of `src/index.css`:
```css
/* ── Print styles ── */
@media print {
  body { background: white !important; color: #0f172a !important; }
  .no-print, aside, .main-header, .mobile-bottom-nav,
  [class*="fixed"], nav { display: none !important; }
  main { margin-left: 0 !important; padding: 0 !important; }
  .compliance-report { padding: 20px; }
  .compliance-report * {
    color: #0f172a !important;
    border-color: #e2e8f0 !important;
  }
  .compliance-report [style] {
    background-color: white !important;
    box-shadow: none !important;
  }
  table { border: 1px solid #e2e8f0 !important; }
  td, th { border-bottom-color: #e2e8f0 !important; }
}
```

**Step 5: Verify**

Run: `npm run dev`
- Navigate to Compliance Report via sidebar
- See pharmacy header, overall score, 4 category cards, RP coverage, document table
- Click "Print Report" — print preview shows clean layout without sidebar/nav
- Ctrl+P also produces clean output

**Step 6: Commit**

```bash
git add src/pages/ComplianceReport.jsx src/App.jsx src/components/Sidebar.jsx src/index.css
git commit -m "feat: add print-ready compliance report page"
```

---

### Task 10: Final verification

**Step 1: Build check**

Run: `npm run build`
Expected: No errors, all modules transform.

**Step 2: Light mode verification**

Run: `npm run dev`
Toggle to light mode. Walk through every page:
- [ ] Dashboard: white cards, emerald accents, readable text
- [ ] Sidebar: white bg, right border shadow, emerald logo
- [ ] Login: light background, visible form
- [ ] All tables: visible borders, readable headers
- [ ] FAB: visible circle with proper contrast
- [ ] Notifications dropdown: readable in light mode
- [ ] All other pages: no white-on-white text, no dark artifacts

**Step 3: Dark mode regression**

Toggle back to dark mode. Verify nothing is broken.

**Step 4: New pages**

- [ ] Audit Log: table renders, filters work, CSV exports
- [ ] Compliance Report: scores display, print works cleanly
- [ ] Error Boundary: temporarily add `throw new Error('test')` in Dashboard to verify it catches (then remove)

**Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: light mode polish and final adjustments"
```
