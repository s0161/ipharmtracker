# iPharmTracker Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Commit recent work, clean up orphaned localStorage, add loading spinners, add real-time sync across devices, and add a shared-password login gate.

**Architecture:** Client-side password gate in App.jsx wrapping all routes. Loading states via the existing `useSupabase` hook's `loading` return value. Real-time sync via Supabase Realtime `postgres_changes` channel inside `useSupabase`. localStorage cleanup as a standalone utility.

**Tech Stack:** React 18, React Router 6, Supabase JS v2, Vite 5

---

### Task 1: Commit recent changes

**Files:**
- Modified: `src/main.jsx` (HashRouter)
- Modified: `src/hooks/useSupabase.js` (error logging)
- Modified: `src/pages/Settings.jsx` (backend status)
- Modified: `src/utils/seed.js` (Supabase seeding)

**Step 1: Commit**

```bash
git add src/main.jsx src/hooks/useSupabase.js src/pages/Settings.jsx src/utils/seed.js
git commit -m "Fix Vercel 404 (HashRouter), add error logging, backend status, Supabase seeding"
```

---

### Task 2: Clear orphaned localStorage keys

**Files:**
- Modify: `src/utils/seed.js`

**Step 1: Add cleanup function**

At the top of `seed.js`, add and export a `cleanupOldLocalStorage()` function that removes all orphaned `ipd_*` keys (except `ipd_seeded_v10`):

```js
export function cleanupOldLocalStorage() {
  const keysToRemove = [
    'ipd_staff', 'ipd_tasks', 'ipd_cleaning',
    'ipd_documents', 'ipd_staff_training', 'ipd_safeguarding',
    'ipd_seeded', 'ipd_seeded_v2', 'ipd_seeded_v3',
    'ipd_seeded_v4', 'ipd_seeded_v5', 'ipd_seeded_v6',
    'ipd_seeded_v7', 'ipd_seeded_v8', 'ipd_seeded_v9',
  ]
  keysToRemove.forEach((k) => localStorage.removeItem(k))
}
```

Remove the `localStorage.removeItem` block from inside `seedIfNeeded()` since cleanup now happens independently.

**Step 2: Call cleanup from main.jsx**

In `src/main.jsx`, import and call `cleanupOldLocalStorage()` before render:

```js
import { seedIfNeeded } from './utils/seed'
import { cleanupOldLocalStorage } from './utils/seed'

cleanupOldLocalStorage()
seedIfNeeded()
```

**Step 3: Verify build**

```bash
npx vite build
```

**Step 4: Commit**

```bash
git add src/utils/seed.js src/main.jsx
git commit -m "Clean up orphaned localStorage keys from pre-Supabase era"
```

---

### Task 3: Add loading states to all pages

**Files:**
- Modify: `src/pages/Dashboard.jsx`
- Modify: `src/pages/TrainingLogs.jsx`
- Modify: `src/pages/CleaningRota.jsx`
- Modify: `src/pages/DocumentTracker.jsx`
- Modify: `src/pages/StaffTraining.jsx`
- Modify: `src/pages/SafeguardingTraining.jsx`
- Modify: `src/index.css`

**Step 1: Add spinner CSS**

Add to the bottom of `src/index.css`:

```css
/* Loading spinner */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
  color: var(--text-secondary);
  gap: 0.75rem;
  font-size: 0.95rem;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2.5px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

**Step 2: Update each page to use loading state**

For every page that calls `useSupabase`, destructure the 3rd value and add an early return. Pattern:

```jsx
const [data, setData, loading] = useSupabase('table_name', [])

// Near the top of the component, after all hooks:
if (loading) {
  return <div className="loading-container"><div className="spinner" />Loading…</div>
}
```

Pages and their primary hook calls to update:

- **Dashboard.jsx**: Has 6 useSupabase calls. Destructure loading from the first (`documents`), rename to `loading`. Check `loading` before render.
- **TrainingLogs.jsx**: Destructure loading from `logs`. Early return.
- **CleaningRota.jsx**: Destructure loading from `entries`. Early return.
- **DocumentTracker.jsx**: Destructure loading from `documents`. Early return.
- **StaffTraining.jsx**: Destructure loading from `entries`. Early return.
- **SafeguardingTraining.jsx**: Destructure loading from `records`. Early return.
- **Settings.jsx**: Already has backend status indicator; skip loading state (settings load fast and have inline indicators).

**Step 3: Verify build**

```bash
npx vite build
```

**Step 4: Commit**

```bash
git add src/index.css src/pages/Dashboard.jsx src/pages/TrainingLogs.jsx src/pages/CleaningRota.jsx src/pages/DocumentTracker.jsx src/pages/StaffTraining.jsx src/pages/SafeguardingTraining.jsx
git commit -m "Add loading spinners to all data pages"
```

---

### Task 4: Add real-time sync via Supabase Realtime

**Files:**
- Modify: `src/hooks/useSupabase.js`

**Step 1: Add Realtime subscription in useEffect**

Inside the existing `useEffect` in `useSupabase`, after the initial fetch `.then()` block, add a Supabase Realtime subscription:

```js
const channel = supabase
  .channel(`${table}-changes`)
  .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
    // Re-fetch entire table on any change
    supabase.from(table).select('*').then(({ data: rows, error }) => {
      if (error || !rows) return
      const camelRows = rows.map(toCamel)
      dbRef.current = camelRows
      if (valueField) {
        idMapRef.current = Object.fromEntries(
          camelRows.map((r) => [r[valueField], r.id])
        )
        setLocalData(camelRows.map((r) => r[valueField]))
      } else {
        setLocalData(camelRows)
      }
    })
  })
  .subscribe()
```

In the cleanup function, unsubscribe:

```js
return () => {
  cancelled = true
  supabase.removeChannel(channel)
}
```

**Important:** Supabase Realtime requires the Realtime feature to be enabled on the tables in the Supabase dashboard (Database > Replication). If not enabled, subscriptions silently receive nothing — the app still works, just without live updates.

**Step 2: Verify build**

```bash
npx vite build
```

**Step 3: Commit**

```bash
git add src/hooks/useSupabase.js
git commit -m "Add real-time sync across devices via Supabase Realtime"
```

---

### Task 5: Add shared-password login gate

**Files:**
- Create: `src/pages/Login.jsx`
- Modify: `src/App.jsx`
- Modify: `src/pages/Settings.jsx`
- Modify: `src/index.css`

**Step 1: Create Login page**

Create `src/pages/Login.jsx`:

- Single password input + submit button
- On submit, check if password === 'iPD2026'
- If correct, store `{ ts: Date.now() }` in `localStorage` under key `ipd_auth`
- If wrong, show "Incorrect password" error message
- Call an `onLogin` callback prop to notify App.jsx

**Step 2: Add auth check to App.jsx**

In `App.jsx`:

- Add a helper function `isAuthenticated()`:
  - Read `ipd_auth` from localStorage
  - Parse it, check if `ts` exists and is within 30 days (`Date.now() - ts < 30 * 24 * 60 * 60 * 1000`)
  - Return true/false
- Add state: `const [authed, setAuthed] = useState(isAuthenticated())`
- If not authed, render `<Login onLogin={() => setAuthed(true)} />` instead of Layout+Routes

**Step 3: Add logout to Settings**

In `src/pages/Settings.jsx`, add a "Log Out" button at the bottom of the Data Management section:

```jsx
<button className="btn btn--ghost" onClick={() => {
  localStorage.removeItem('ipd_auth')
  window.location.reload()
}}>
  Log Out
</button>
```

**Step 4: Add login page styles**

Add to `src/index.css`:

```css
.login-page { ... }
.login-card { ... }
.login-error { ... }
```

Centered card layout, matches app's existing design variables.

**Step 5: Verify build**

```bash
npx vite build
```

**Step 6: Commit**

```bash
git add src/pages/Login.jsx src/App.jsx src/pages/Settings.jsx src/index.css
git commit -m "Add shared-password login gate with 30-day session"
```

---

### Task 6: Final deploy

**Step 1: Deploy to Vercel**

```bash
vercel --prod
```

**Step 2: Verify on live URL**

- Open https://ipharmtracker.vercel.app — should see login page
- Enter "iPD2026" — should enter app
- Navigate to Settings — green backend status dot
- Reload any page — no 404
- Check console — no errors
