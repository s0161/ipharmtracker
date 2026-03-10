# CD Register Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the static CD Register preview with a fully functional Schedule 2 + 3 Controlled Drugs register backed by Supabase, including entry management, balance checking, and destruction records.

**Architecture:** Three-tab page (Register, Balance Check, Destruction) with a shared drug catalogue. Each tab has its own Supabase table. The main orchestrator (`CDRegister.jsx`) manages tab state and delegates to tab components in `src/components/cdregister/`. Uses `useSupabase` hook for data, `useUser` for access control, and `isElevatedRole()` for write permissions.

**Tech Stack:** React 18, Supabase (anon key), Tailwind CSS, existing `useSupabase` hook, `generateId()` from helpers.

---

### Task 1: Create Supabase Tables (SQL)

**Files:**
- Create: `create-cd-tables.sql`

**Step 1: Write the SQL migration file**

```sql
-- Run this in Supabase Dashboard > SQL Editor
-- Creates the 4 CD Register tables

-- 1. cd_drugs — Predefined drug catalogue (Schedule 2 & 3 only)
CREATE TABLE IF NOT EXISTS cd_drugs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  schedule INT NOT NULL DEFAULT 2,
  formulation TEXT DEFAULT '',
  strength TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. cd_register — Main register entries
CREATE TABLE IF NOT EXISTS cd_register (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  drug_id UUID REFERENCES cd_drugs(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  quantity INT NOT NULL DEFAULT 0,
  direction TEXT NOT NULL DEFAULT 'in',
  patient TEXT DEFAULT '',
  prescriber TEXT DEFAULT '',
  witnessed_by TEXT DEFAULT '',
  balance INT NOT NULL DEFAULT 0,
  staff_member TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. cd_balance_checks — Balance verification records
CREATE TABLE IF NOT EXISTS cd_balance_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  drug_id UUID REFERENCES cd_drugs(id),
  register_balance INT NOT NULL DEFAULT 0,
  physical_count INT NOT NULL DEFAULT 0,
  discrepancy BOOLEAN DEFAULT false,
  checked_by TEXT DEFAULT '',
  witnessed_by TEXT DEFAULT '',
  checked_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT DEFAULT ''
);

-- 4. cd_destructions — Destruction records
CREATE TABLE IF NOT EXISTS cd_destructions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  drug_id UUID REFERENCES cd_drugs(id),
  quantity INT NOT NULL DEFAULT 0,
  reason TEXT DEFAULT '',
  method TEXT DEFAULT '',
  witness_1 TEXT DEFAULT '',
  witness_2 TEXT DEFAULT '',
  authorised_by TEXT DEFAULT '',
  destroyed_at TIMESTAMPTZ DEFAULT now(),
  register_entry_id UUID REFERENCES cd_register(id),
  notes TEXT DEFAULT ''
);

-- Enable RLS with open access (matching existing tables)
ALTER TABLE cd_drugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cd_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE cd_balance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cd_destructions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access" ON cd_drugs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON cd_register FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON cd_balance_checks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON cd_destructions FOR ALL USING (true) WITH CHECK (true);
```

**Step 2: Run the SQL in Supabase Dashboard**

Go to Supabase Dashboard → SQL Editor → paste and run the SQL above.

**Step 3: Commit**

```bash
git add create-cd-tables.sql
git commit -m "feat(cd): add SQL migration for CD Register tables"
```

---

### Task 2: Seed CD Drug Catalogue + Sample Register Data

**Files:**
- Modify: `src/utils/seed.js`

**Step 1: Add CD seed data to `seedIfNeeded()`**

After the `safeguardingReferrals` array and before the `signpostingResources` array (around line 600), add:

```javascript
  // ─── CD Drug Catalogue (Schedule 2 & 3) ───
  const cdDrugs = [
    // Schedule 2
    { id: generateId(), name: 'Morphine Sulfate', schedule: 2, formulation: 'Tablets', strength: '10mg', is_active: true },
    { id: generateId(), name: 'Morphine Sulfate', schedule: 2, formulation: 'Tablets', strength: '20mg', is_active: true },
    { id: generateId(), name: 'Morphine Sulfate', schedule: 2, formulation: 'Tablets', strength: '30mg', is_active: true },
    { id: generateId(), name: 'Morphine Sulfate', schedule: 2, formulation: 'Oral Solution', strength: '10mg/5ml', is_active: true },
    { id: generateId(), name: 'Oxycodone', schedule: 2, formulation: 'Capsules', strength: '5mg', is_active: true },
    { id: generateId(), name: 'Oxycodone', schedule: 2, formulation: 'Capsules', strength: '10mg', is_active: true },
    { id: generateId(), name: 'Oxycodone', schedule: 2, formulation: 'Capsules', strength: '20mg', is_active: true },
    { id: generateId(), name: 'Fentanyl', schedule: 2, formulation: 'Patches', strength: '12mcg/hr', is_active: true },
    { id: generateId(), name: 'Fentanyl', schedule: 2, formulation: 'Patches', strength: '25mcg/hr', is_active: true },
    { id: generateId(), name: 'Fentanyl', schedule: 2, formulation: 'Patches', strength: '50mcg/hr', is_active: true },
    { id: generateId(), name: 'Fentanyl', schedule: 2, formulation: 'Patches', strength: '75mcg/hr', is_active: true },
    { id: generateId(), name: 'Methylphenidate', schedule: 2, formulation: 'Tablets', strength: '10mg', is_active: true },
    { id: generateId(), name: 'Methylphenidate', schedule: 2, formulation: 'Tablets', strength: '20mg', is_active: true },
    { id: generateId(), name: 'Methadone', schedule: 2, formulation: 'Oral Solution', strength: '1mg/ml', is_active: true },
    { id: generateId(), name: 'Diamorphine', schedule: 2, formulation: 'Powder for Injection', strength: '5mg', is_active: true },
    { id: generateId(), name: 'Diamorphine', schedule: 2, formulation: 'Powder for Injection', strength: '10mg', is_active: true },
    // Schedule 3
    { id: generateId(), name: 'Midazolam', schedule: 3, formulation: 'Solution', strength: '10mg/5ml', is_active: true },
    { id: generateId(), name: 'Tramadol', schedule: 3, formulation: 'Capsules', strength: '50mg', is_active: true },
    { id: generateId(), name: 'Pregabalin', schedule: 3, formulation: 'Capsules', strength: '75mg', is_active: true },
    { id: generateId(), name: 'Pregabalin', schedule: 3, formulation: 'Capsules', strength: '150mg', is_active: true },
    { id: generateId(), name: 'Pregabalin', schedule: 3, formulation: 'Capsules', strength: '300mg', is_active: true },
    { id: generateId(), name: 'Buprenorphine', schedule: 3, formulation: 'Patches', strength: '5mcg/hr', is_active: true },
    { id: generateId(), name: 'Buprenorphine', schedule: 3, formulation: 'Patches', strength: '10mcg/hr', is_active: true },
    { id: generateId(), name: 'Buprenorphine', schedule: 3, formulation: 'Patches', strength: '20mcg/hr', is_active: true },
    { id: generateId(), name: 'Temazepam', schedule: 3, formulation: 'Tablets', strength: '10mg', is_active: true },
    { id: generateId(), name: 'Temazepam', schedule: 3, formulation: 'Tablets', strength: '20mg', is_active: true },
  ]

  // Sample CD register entries (references cdDrugs by index for id)
  const cdRegisterEntries = [
    { id: generateId(), drug_id: cdDrugs[0].id, date: dayStr(-5), quantity: 30, direction: 'in', patient: '', prescriber: 'Dr. Patel', witnessed_by: 'Salma Shakoor', balance: 30, staff_member: 'Amjid Shakoor', notes: 'New stock received' },
    { id: generateId(), drug_id: cdDrugs[0].id, date: dayStr(-4), quantity: 10, direction: 'out', patient: 'J. Smith', prescriber: 'Dr. Patel', witnessed_by: 'Moniba Jamil', balance: 20, staff_member: 'Amjid Shakoor', notes: '' },
    { id: generateId(), drug_id: cdDrugs[4].id, date: dayStr(-4), quantity: 56, direction: 'in', patient: '', prescriber: 'Dr. Hassan', witnessed_by: 'Umama Khan', balance: 56, staff_member: 'Salma Shakoor', notes: '' },
    { id: generateId(), drug_id: cdDrugs[7].id, date: dayStr(-3), quantity: 5, direction: 'in', patient: '', prescriber: 'Dr. Ali', witnessed_by: 'Sadaf Subhani', balance: 5, staff_member: 'Amjid Shakoor', notes: '' },
    { id: generateId(), drug_id: cdDrugs[16].id, date: dayStr(-3), quantity: 10, direction: 'in', patient: '', prescriber: 'Dr. Khan', witnessed_by: 'Shain Nawaz', balance: 10, staff_member: 'Amjid Shakoor', notes: '' },
    { id: generateId(), drug_id: cdDrugs[17].id, date: dayStr(-2), quantity: 100, direction: 'in', patient: '', prescriber: 'Dr. Hassan', witnessed_by: 'Salma Shakoor', balance: 100, staff_member: 'Moniba Jamil', notes: '' },
    { id: generateId(), drug_id: cdDrugs[11].id, date: dayStr(-2), quantity: 30, direction: 'out', patient: 'S. Williams', prescriber: 'Dr. Patel', witnessed_by: 'Umama Khan', balance: 70, staff_member: 'Amjid Shakoor', notes: '' },
    { id: generateId(), drug_id: cdDrugs[18].id, date: dayStr(-1), quantity: 56, direction: 'in', patient: '', prescriber: 'Dr. Khan', witnessed_by: 'Moniba Jamil', balance: 56, staff_member: 'Salma Shakoor', notes: '' },
  ]

  // Sample CD balance checks
  const cdBalanceChecks = [
    { id: generateId(), drug_id: cdDrugs[0].id, register_balance: 20, physical_count: 20, discrepancy: false, checked_by: 'Amjid Shakoor', witnessed_by: 'Salma Shakoor', checked_at: new Date(dayStr(-1) + 'T09:00:00').toISOString(), notes: '' },
    { id: generateId(), drug_id: cdDrugs[4].id, register_balance: 56, physical_count: 56, discrepancy: false, checked_by: 'Amjid Shakoor', witnessed_by: 'Salma Shakoor', checked_at: new Date(dayStr(-1) + 'T09:05:00').toISOString(), notes: '' },
    { id: generateId(), drug_id: cdDrugs[7].id, register_balance: 5, physical_count: 5, discrepancy: false, checked_by: 'Amjid Shakoor', witnessed_by: 'Salma Shakoor', checked_at: new Date(dayStr(-1) + 'T09:10:00').toISOString(), notes: '' },
  ]
```

**Step 2: Add delete + insert calls for the new tables**

In the `Promise.allSettled` delete block (around line 661), add:

```javascript
    delFilter(supabase.from('cd_destructions').delete()),
    delFilter(supabase.from('cd_balance_checks').delete()),
    delFilter(supabase.from('cd_register').delete()),
    delFilter(supabase.from('cd_drugs').delete()),
```

In the inserts array (around line 684), add:

```javascript
    supabase.from('cd_drugs').insert(cdDrugs),
    supabase.from('cd_register').insert(cdRegisterEntries),
    supabase.from('cd_balance_checks').insert(cdBalanceChecks),
```

**Step 3: Bump seed version**

Change `SEED_KEY` from `'ipd_seeded_v35'` to `'ipd_seeded_v36'` and add `'ipd_seeded_v35'` to the `ORPHANED_KEYS` array.

**Step 4: Commit**

```bash
git add src/utils/seed.js
git commit -m "feat(cd): seed CD drug catalogue and sample register data"
```

---

### Task 3: Create `useCDData` Hook

**Files:**
- Create: `src/hooks/useCDData.js`

**Step 1: Write the hook**

This hook fetches all CD data (drugs, register entries, balance checks, destructions) and provides CRUD actions. It uses the raw `supabase` client (not `useSupabase`) because we need joins and computed balances.

```javascript
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { generateId } from '../utils/helpers'

export function useCDData() {
  const [drugs, setDrugs] = useState([])
  const [entries, setEntries] = useState([])
  const [balanceChecks, setBalanceChecks] = useState([])
  const [destructions, setDestructions] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [drugsRes, entriesRes, checksRes, destRes] = await Promise.all([
      supabase.from('cd_drugs').select('*').order('schedule').order('name'),
      supabase.from('cd_register').select('*').order('date', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('cd_balance_checks').select('*').order('checked_at', { ascending: false }),
      supabase.from('cd_destructions').select('*').order('destroyed_at', { ascending: false }),
    ])
    if (drugsRes.data) setDrugs(drugsRes.data)
    if (entriesRes.data) setEntries(entriesRes.data)
    if (checksRes.data) setBalanceChecks(checksRes.data)
    if (destRes.data) setDestructions(destRes.data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Get current balance for a drug (from latest register entry)
  const getBalance = useCallback((drugId) => {
    const drugEntries = entries.filter(e => e.drug_id === drugId)
    if (drugEntries.length === 0) return 0
    return drugEntries[0].balance // entries sorted newest first
  }, [entries])

  // Add a register entry (in or out)
  const addEntry = useCallback(async (entry) => {
    const currentBalance = getBalance(entry.drug_id)
    const newBalance = entry.direction === 'in'
      ? currentBalance + entry.quantity
      : currentBalance - entry.quantity

    const row = {
      id: generateId(),
      ...entry,
      balance: newBalance,
      created_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('cd_register').insert(row)
    if (!error) await fetchAll()
    return { error, balance: newBalance }
  }, [getBalance, fetchAll])

  // Add a destruction record + linked register entry
  const addDestruction = useCallback(async (destruction) => {
    const currentBalance = getBalance(destruction.drug_id)
    const newBalance = currentBalance - destruction.quantity

    const registerId = generateId()
    const registerEntry = {
      id: registerId,
      drug_id: destruction.drug_id,
      date: new Date().toISOString().slice(0, 10),
      quantity: destruction.quantity,
      direction: 'destruction',
      patient: '',
      prescriber: '',
      witnessed_by: destruction.witness_1,
      balance: newBalance,
      staff_member: destruction.authorised_by,
      notes: `Destruction: ${destruction.reason}`,
      created_at: new Date().toISOString(),
    }

    const destructionRow = {
      id: generateId(),
      ...destruction,
      register_entry_id: registerId,
      destroyed_at: new Date().toISOString(),
    }

    const [regRes, destRes] = await Promise.all([
      supabase.from('cd_register').insert(registerEntry),
      supabase.from('cd_destructions').insert(destructionRow),
    ])
    if (!regRes.error && !destRes.error) await fetchAll()
    return { error: regRes.error || destRes.error }
  }, [getBalance, fetchAll])

  // Save a balance check
  const addBalanceCheck = useCallback(async (check) => {
    const row = {
      id: generateId(),
      ...check,
      discrepancy: check.physical_count !== check.register_balance,
      checked_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('cd_balance_checks').insert(row)
    if (!error) await fetchAll()
    return { error }
  }, [fetchAll])

  // Add a custom drug to the catalogue
  const addDrug = useCallback(async (drug) => {
    const row = { id: generateId(), ...drug, is_active: true, created_at: new Date().toISOString() }
    const { error } = await supabase.from('cd_drugs').insert(row)
    if (!error) await fetchAll()
    return { error }
  }, [fetchAll])

  return {
    drugs, entries, balanceChecks, destructions, loading,
    getBalance, addEntry, addDestruction, addBalanceCheck, addDrug, refetch: fetchAll,
  }
}
```

**Step 2: Commit**

```bash
git add src/hooks/useCDData.js
git commit -m "feat(cd): add useCDData hook for CD Register CRUD"
```

---

### Task 4: Create DrugSelect Component

**Files:**
- Create: `src/components/cdregister/DrugSelect.jsx`

**Step 1: Write the component**

A searchable dropdown that shows predefined drugs grouped by schedule, with an "Add Custom Drug" option at the bottom.

```jsx
import { useState, useRef, useEffect } from 'react'

export default function DrugSelect({ drugs, value, onChange, onAddDrug }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = drugs.find(d => d.id === value)
  const filtered = drugs.filter(d =>
    d.is_active && (!search || `${d.name} ${d.formulation} ${d.strength}`.toLowerCase().includes(search.toLowerCase()))
  )
  const s2 = filtered.filter(d => d.schedule === 2)
  const s3 = filtered.filter(d => d.schedule === 3)

  const drugLabel = (d) => `${d.name} — ${d.formulation} ${d.strength}`

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full px-3 py-2 rounded-lg border border-ec-border bg-ec-card text-sm text-left text-ec-t1 cursor-pointer hover:border-emerald-400 transition flex items-center justify-between">
        <span className={selected ? 'text-ec-t1' : 'text-ec-t3'}>
          {selected ? drugLabel(selected) : 'Select drug...'}
        </span>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-ec-t3">
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-ec-card border border-ec-border rounded-xl shadow-lg max-h-64 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-ec-border">
            <input type="text" placeholder="Search drugs..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-ec-border bg-ec-card text-sm text-ec-t1 placeholder:text-ec-t3 outline-none focus:ring-2 focus:ring-emerald-500/30"
              autoFocus />
          </div>
          <div className="overflow-y-auto flex-1">
            {s2.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-[10px] font-bold text-red-500 uppercase tracking-wide bg-red-500/5">Schedule 2</div>
                {s2.map(d => (
                  <button key={d.id} type="button" onClick={() => { onChange(d.id); setOpen(false); setSearch('') }}
                    className={`w-full px-3 py-2 text-left text-sm border-none cursor-pointer transition hover:bg-emerald-500/5
                      ${d.id === value ? 'bg-emerald-500/10 text-emerald-700 font-medium' : 'bg-transparent text-ec-t1'}`}>
                    {drugLabel(d)}
                  </button>
                ))}
              </>
            )}
            {s3.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-[10px] font-bold text-orange-500 uppercase tracking-wide bg-orange-500/5">Schedule 3</div>
                {s3.map(d => (
                  <button key={d.id} type="button" onClick={() => { onChange(d.id); setOpen(false); setSearch('') }}
                    className={`w-full px-3 py-2 text-left text-sm border-none cursor-pointer transition hover:bg-emerald-500/5
                      ${d.id === value ? 'bg-emerald-500/10 text-emerald-700 font-medium' : 'bg-transparent text-ec-t1'}`}>
                    {drugLabel(d)}
                  </button>
                ))}
              </>
            )}
            {s2.length === 0 && s3.length === 0 && (
              <div className="px-3 py-4 text-sm text-ec-t3 text-center">No drugs match "{search}"</div>
            )}
          </div>
          {onAddDrug && (
            <button type="button" onClick={() => { onAddDrug(); setOpen(false) }}
              className="w-full px-3 py-2 text-sm font-medium text-emerald-600 bg-emerald-500/5 border-t border-ec-border cursor-pointer hover:bg-emerald-500/10 transition border-x-0 border-b-0">
              + Add Custom Drug
            </button>
          )}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/cdregister/DrugSelect.jsx
git commit -m "feat(cd): add DrugSelect searchable dropdown component"
```

---

### Task 5: Create AddEntryModal Component

**Files:**
- Create: `src/components/cdregister/AddEntryModal.jsx`

**Step 1: Write the modal**

Form for adding a new CD register entry (In or Out). Fields: drug, date, quantity, direction, patient, prescriber, witnessed by. Balance is auto-calculated.

```jsx
import { useState } from 'react'
import DrugSelect from './DrugSelect'

const INITIAL = {
  drug_id: '',
  date: new Date().toISOString().slice(0, 10),
  quantity: '',
  direction: 'in',
  patient: '',
  prescriber: '',
  witnessed_by: '',
  notes: '',
}

export default function AddEntryModal({ drugs, staffList, currentUser, onSave, onClose, onAddDrug }) {
  const [form, setForm] = useState(INITIAL)
  const [saving, setSaving] = useState(false)

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const valid = form.drug_id && form.quantity > 0 && form.witnessed_by
    && (form.direction === 'in' || form.patient)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!valid || saving) return
    setSaving(true)
    await onSave({
      ...form,
      quantity: parseInt(form.quantity, 10),
      staff_member: currentUser,
    })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-ec-card border border-ec-border rounded-2xl shadow-2xl w-full max-w-lg ec-fadeup overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />

        <form onSubmit={handleSubmit} className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-ec-t1 m-0">Add CD Entry</h2>
            <button type="button" onClick={onClose}
              className="bg-transparent border-none text-ec-t3 hover:text-ec-t1 cursor-pointer text-lg transition-colors">✕</button>
          </div>

          {/* Direction toggle */}
          <div className="flex gap-2 mb-4">
            {['in', 'out'].map(dir => (
              <button key={dir} type="button" onClick={() => set('direction', dir)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border-none cursor-pointer transition-all
                  ${form.direction === dir
                    ? dir === 'in' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                    : 'bg-ec-card text-ec-t2 border border-ec-border'}`}>
                {dir === 'in' ? 'Receipt (In)' : 'Supply (Out)'}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {/* Drug */}
            <div>
              <label className="block text-[11px] font-semibold text-ec-t3 uppercase tracking-wide mb-1">Drug *</label>
              <DrugSelect drugs={drugs} value={form.drug_id} onChange={v => set('drug_id', v)} onAddDrug={onAddDrug} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Date */}
              <div>
                <label className="block text-[11px] font-semibold text-ec-t3 uppercase tracking-wide mb-1">Date</label>
                <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-ec-border bg-ec-card text-sm text-ec-t1 outline-none focus:ring-2 focus:ring-emerald-500/30" />
              </div>
              {/* Quantity */}
              <div>
                <label className="block text-[11px] font-semibold text-ec-t3 uppercase tracking-wide mb-1">Quantity *</label>
                <input type="number" min="1" value={form.quantity} onChange={e => set('quantity', e.target.value)} placeholder="0"
                  className="w-full px-3 py-2 rounded-lg border border-ec-border bg-ec-card text-sm text-ec-t1 outline-none focus:ring-2 focus:ring-emerald-500/30 placeholder:text-ec-t3" />
              </div>
            </div>

            {/* Patient (required for Out) */}
            {form.direction === 'out' && (
              <div>
                <label className="block text-[11px] font-semibold text-ec-t3 uppercase tracking-wide mb-1">Patient Name *</label>
                <input type="text" value={form.patient} onChange={e => set('patient', e.target.value)} placeholder="Patient name"
                  className="w-full px-3 py-2 rounded-lg border border-ec-border bg-ec-card text-sm text-ec-t1 outline-none focus:ring-2 focus:ring-emerald-500/30 placeholder:text-ec-t3" />
              </div>
            )}

            {/* Prescriber */}
            <div>
              <label className="block text-[11px] font-semibold text-ec-t3 uppercase tracking-wide mb-1">Prescriber</label>
              <input type="text" value={form.prescriber} onChange={e => set('prescriber', e.target.value)} placeholder="Dr."
                className="w-full px-3 py-2 rounded-lg border border-ec-border bg-ec-card text-sm text-ec-t1 outline-none focus:ring-2 focus:ring-emerald-500/30 placeholder:text-ec-t3" />
            </div>

            {/* Witnessed By */}
            <div>
              <label className="block text-[11px] font-semibold text-ec-t3 uppercase tracking-wide mb-1">Witnessed By *</label>
              <select value={form.witnessed_by} onChange={e => set('witnessed_by', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-ec-border bg-ec-card text-sm text-ec-t1 outline-none focus:ring-2 focus:ring-emerald-500/30">
                <option value="">Select witness...</option>
                {staffList.filter(s => s !== currentUser).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[11px] font-semibold text-ec-t3 uppercase tracking-wide mb-1">Notes</label>
              <input type="text" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional"
                className="w-full px-3 py-2 rounded-lg border border-ec-border bg-ec-card text-sm text-ec-t1 outline-none focus:ring-2 focus:ring-emerald-500/30 placeholder:text-ec-t3" />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-5">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-ec-card text-ec-t2 border border-ec-border cursor-pointer hover:bg-ec-card-hover transition">
              Cancel
            </button>
            <button type="submit" disabled={!valid || saving}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white border-none cursor-pointer hover:bg-emerald-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/cdregister/AddEntryModal.jsx
git commit -m "feat(cd): add AddEntryModal for register entries"
```

---

### Task 6: Create RegisterTab Component

**Files:**
- Create: `src/components/cdregister/RegisterTab.jsx`

**Step 1: Write the component**

The main register table view with search/filter, entry list, and running balances. This replaces the dummy data table from the preview.

```jsx
import { useState } from 'react'

const SCHEDULE_STYLES = {
  2: 'bg-red-500/10 text-red-600 dark:text-red-400',
  3: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
}

const DIR_STYLES = {
  in: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  out: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  destruction: 'bg-red-500/10 text-red-600 dark:text-red-400',
}

const DIR_LABELS = { in: 'In', out: 'Out', destruction: 'Dest.' }

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function RegisterTab({ entries, drugs, onAdd, canEdit }) {
  const [search, setSearch] = useState('')
  const [schedFilter, setSchedFilter] = useState('all')

  const drugMap = Object.fromEntries(drugs.map(d => [d.id, d]))

  const filtered = entries.filter(e => {
    const drug = drugMap[e.drug_id]
    if (!drug) return false
    const matchSearch = !search || drug.name.toLowerCase().includes(search.toLowerCase())
    const matchSched = schedFilter === 'all' || drug.schedule === parseInt(schedFilter)
    return matchSearch && matchSched
  })

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ec-t3">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input type="text" placeholder="Search drugs..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-ec-border bg-ec-card text-sm text-ec-t1 placeholder:text-ec-t3 outline-none focus:ring-2 focus:ring-emerald-500/30 transition" />
        </div>

        <div className="flex gap-1">
          {[{ val: 'all', label: 'All' }, { val: '2', label: 'Schedule 2' }, { val: '3', label: 'Schedule 3' }].map(t => (
            <button key={t.val} onClick={() => setSchedFilter(t.val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border-none cursor-pointer transition-all
                ${schedFilter === t.val ? 'bg-emerald-600 text-white shadow-sm' : 'bg-ec-card text-ec-t2 hover:bg-ec-card-hover'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {canEdit && (
          <button onClick={onAdd}
            className="px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white border-none cursor-pointer hover:bg-emerald-700 transition shadow-sm sm:ml-auto">
            + Add Entry
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-ec-card border border-ec-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-ec-border">
                {['Date', 'Drug Name', 'Sch.', 'Qty', 'Dir.', 'Patient', 'Prescriber', 'Witness', 'Bal.', 'Staff'].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold text-ec-t3 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-ec-t3 text-sm">
                    {entries.length === 0 ? 'No entries yet — add your first CD entry' : 'No entries match your search'}
                  </td>
                </tr>
              ) : filtered.map(entry => {
                const drug = drugMap[entry.drug_id]
                return (
                  <tr key={entry.id} className="border-b border-ec-border last:border-b-0 hover:bg-ec-card-hover transition-colors">
                    <td className="px-4 py-3 text-ec-t2 whitespace-nowrap">{formatDate(entry.date)}</td>
                    <td className="px-4 py-3 font-medium text-ec-t1">
                      <div>{drug?.name || '—'}</div>
                      <div className="text-[11px] text-ec-t3">{drug?.formulation} · {drug?.strength}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SCHEDULE_STYLES[drug?.schedule] || ''}`}>
                        S{drug?.schedule}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ec-t1 font-medium">{entry.quantity}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DIR_STYLES[entry.direction] || ''}`}>
                        {DIR_LABELS[entry.direction] || entry.direction}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ec-t2">{entry.patient || '—'}</td>
                    <td className="px-4 py-3 text-ec-t2">{entry.prescriber || '—'}</td>
                    <td className="px-4 py-3 text-ec-t2">{entry.witnessed_by || '—'}</td>
                    <td className="px-4 py-3 text-ec-t1 font-semibold">{entry.balance}</td>
                    <td className="px-4 py-3 text-ec-t2 whitespace-nowrap">{entry.staff_member}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-ec-border text-xs text-ec-t3">
          <span>Showing {filtered.length} of {entries.length} entries</span>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/cdregister/RegisterTab.jsx
git commit -m "feat(cd): add RegisterTab with search, filter, and entry table"
```

---

### Task 7: Create BalanceCheckTab Component

**Files:**
- Create: `src/components/cdregister/BalanceCheckTab.jsx`

**Step 1: Write the component**

Shows each drug with its register balance, lets staff enter physical count, flags discrepancies, and saves the check.

```jsx
import { useState, useMemo } from 'react'

function formatDateTime(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function BalanceCheckTab({ drugs, getBalance, balanceChecks, staffList, currentUser, onSave, canEdit }) {
  const [checking, setChecking] = useState(false)
  const [counts, setCounts] = useState({})
  const [witness, setWitness] = useState('')
  const [saving, setSaving] = useState(false)

  // Only drugs that have a balance > 0
  const activeDrugs = useMemo(() =>
    drugs.filter(d => d.is_active && getBalance(d.id) > 0),
    [drugs, getBalance]
  )

  const setCount = (drugId, val) => setCounts(prev => ({ ...prev, [drugId]: val }))

  const allFilled = activeDrugs.every(d => counts[d.id] !== undefined && counts[d.id] !== '') && witness

  const handleSaveAll = async () => {
    if (!allFilled || saving) return
    setSaving(true)
    for (const drug of activeDrugs) {
      await onSave({
        drug_id: drug.id,
        register_balance: getBalance(drug.id),
        physical_count: parseInt(counts[drug.id], 10),
        checked_by: currentUser,
        witnessed_by: witness,
        notes: '',
      })
    }
    setSaving(false)
    setChecking(false)
    setCounts({})
    setWitness('')
  }

  const handleAllOk = () => {
    const filled = {}
    activeDrugs.forEach(d => { filled[d.id] = getBalance(d.id).toString() })
    setCounts(filled)
  }

  return (
    <div>
      {!checking ? (
        <>
          {/* Start check button */}
          {canEdit && activeDrugs.length > 0 && (
            <button onClick={() => setChecking(true)}
              className="mb-4 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white border-none cursor-pointer hover:bg-emerald-700 transition shadow-sm">
              Start Balance Check
            </button>
          )}
          {activeDrugs.length === 0 && (
            <div className="text-center py-12 text-ec-t3 text-sm">No drugs with stock to check</div>
          )}

          {/* Past checks */}
          {balanceChecks.length > 0 && (
            <div className="bg-ec-card border border-ec-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-ec-border">
                <h3 className="text-sm font-semibold text-ec-t1 m-0">Recent Balance Checks</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-ec-border">
                      {['Date/Time', 'Drug', 'Register', 'Physical', 'Status', 'Checked By', 'Witness'].map(h => (
                        <th key={h} className="text-left text-[11px] font-semibold text-ec-t3 uppercase tracking-wide px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {balanceChecks.map(c => {
                      const drug = drugs.find(d => d.id === c.drug_id)
                      return (
                        <tr key={c.id} className="border-b border-ec-border last:border-b-0 hover:bg-ec-card-hover transition-colors">
                          <td className="px-4 py-3 text-ec-t2 whitespace-nowrap">{formatDateTime(c.checked_at)}</td>
                          <td className="px-4 py-3 text-ec-t1 font-medium">{drug ? `${drug.name} ${drug.strength}` : '—'}</td>
                          <td className="px-4 py-3 text-ec-t1">{c.register_balance}</td>
                          <td className="px-4 py-3 text-ec-t1">{c.physical_count}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              c.discrepancy ? 'bg-red-500/10 text-red-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                              {c.discrepancy ? 'Discrepancy' : 'OK'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-ec-t2">{c.checked_by}</td>
                          <td className="px-4 py-3 text-ec-t2">{c.witnessed_by}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Active check form */
        <div className="bg-ec-card border border-ec-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-ec-t1 m-0">Balance Check — {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</h3>
            <button onClick={handleAllOk}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 border-none cursor-pointer hover:bg-emerald-500/20 transition">
              All OK (auto-fill)
            </button>
          </div>

          <div className="space-y-3 mb-4">
            {activeDrugs.map(drug => {
              const bal = getBalance(drug.id)
              const count = counts[drug.id] ?? ''
              const mismatch = count !== '' && parseInt(count, 10) !== bal
              return (
                <div key={drug.id} className={`flex items-center gap-3 p-3 rounded-lg border ${mismatch ? 'border-red-400 bg-red-500/5' : 'border-ec-border'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ec-t1 truncate">{drug.name} — {drug.formulation} {drug.strength}</div>
                    <div className="text-xs text-ec-t3">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full mr-1 ${drug.schedule === 2 ? 'bg-red-500/10 text-red-600' : 'bg-orange-500/10 text-orange-600'}`}>S{drug.schedule}</span>
                      Register balance: <span className="font-semibold text-ec-t1">{bal}</span>
                    </div>
                  </div>
                  <input type="number" min="0" value={count} onChange={e => setCount(drug.id, e.target.value)} placeholder="Count"
                    className={`w-24 px-3 py-2 rounded-lg border text-sm text-ec-t1 outline-none focus:ring-2 focus:ring-emerald-500/30 text-center
                      ${mismatch ? 'border-red-400 bg-red-500/5' : 'border-ec-border bg-ec-card'}`} />
                  {mismatch && <span className="text-red-500 text-xs font-bold shrink-0">!</span>}
                </div>
              )
            })}
          </div>

          {/* Witness */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-ec-t3 uppercase tracking-wide mb-1">Witnessed By *</label>
            <select value={witness} onChange={e => setWitness(e.target.value)}
              className="w-full max-w-xs px-3 py-2 rounded-lg border border-ec-border bg-ec-card text-sm text-ec-t1 outline-none focus:ring-2 focus:ring-emerald-500/30">
              <option value="">Select witness...</option>
              {staffList.filter(s => s !== currentUser).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button onClick={() => { setChecking(false); setCounts({}); setWitness('') }}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-ec-card text-ec-t2 border border-ec-border cursor-pointer hover:bg-ec-card-hover transition">
              Cancel
            </button>
            <button onClick={handleSaveAll} disabled={!allFilled || saving}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white border-none cursor-pointer hover:bg-emerald-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? 'Saving...' : 'Save Check'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/cdregister/BalanceCheckTab.jsx
git commit -m "feat(cd): add BalanceCheckTab with physical count workflow"
```

---

### Task 8: Create DestructionTab Component

**Files:**
- Create: `src/components/cdregister/DestructionTab.jsx`

**Step 1: Write the component**

Records witnessed CD destructions with two witnesses, reason, method. Creates linked register entry.

```jsx
import { useState } from 'react'
import DrugSelect from './DrugSelect'

function formatDateTime(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const INITIAL = {
  drug_id: '',
  quantity: '',
  reason: '',
  method: '',
  witness_1: '',
  witness_2: '',
  notes: '',
}

const METHODS = ['Denaturing', 'Incineration', 'Return to supplier', 'Other']
const REASONS = ['Expired stock', 'Patient returned', 'Damaged/contaminated', 'Excess stock', 'Other']

export default function DestructionTab({ drugs, destructions, getBalance, staffList, currentUser, onSave, canEdit }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(INITIAL)
  const [saving, setSaving] = useState(false)

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const selectedDrug = drugs.find(d => d.id === form.drug_id)
  const currentBal = form.drug_id ? getBalance(form.drug_id) : 0
  const qty = parseInt(form.quantity, 10) || 0
  const valid = form.drug_id && qty > 0 && qty <= currentBal && form.reason && form.method
    && form.witness_1 && form.witness_2 && form.witness_1 !== form.witness_2

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!valid || saving) return
    setSaving(true)
    await onSave({
      ...form,
      quantity: qty,
      authorised_by: currentUser,
    })
    setSaving(false)
    setShowForm(false)
    setForm(INITIAL)
  }

  return (
    <div>
      {canEdit && (
        <button onClick={() => setShowForm(true)}
          className="mb-4 px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white border-none cursor-pointer hover:bg-red-700 transition shadow-sm">
          Record Destruction
        </button>
      )}

      {/* Destruction form modal */}
      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-ec-card border border-ec-border rounded-2xl shadow-2xl w-full max-w-lg ec-fadeup overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 to-red-600" />

            <form onSubmit={handleSubmit} className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-ec-t1 m-0">Record CD Destruction</h2>
                <button type="button" onClick={() => setShowForm(false)}
                  className="bg-transparent border-none text-ec-t3 hover:text-ec-t1 cursor-pointer text-lg transition-colors">✕</button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-ec-t3 uppercase tracking-wide mb-1">Drug *</label>
                  <DrugSelect drugs={drugs.filter(d => getBalance(d.id) > 0)} value={form.drug_id} onChange={v => set('drug_id', v)} />
                  {selectedDrug && (
                    <div className="text-xs text-ec-t3 mt-1">Current balance: <span className="font-semibold text-ec-t1">{currentBal}</span></div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-ec-t3 uppercase tracking-wide mb-1">Quantity *</label>
                    <input type="number" min="1" max={currentBal} value={form.quantity} onChange={e => set('quantity', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-ec-border bg-ec-card text-sm text-ec-t1 outline-none focus:ring-2 focus:ring-emerald-500/30" />
                    {qty > currentBal && <div className="text-xs text-red-500 mt-1">Exceeds balance</div>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-ec-t3 uppercase tracking-wide mb-1">Method *</label>
                    <select value={form.method} onChange={e => set('method', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-ec-border bg-ec-card text-sm text-ec-t1 outline-none focus:ring-2 focus:ring-emerald-500/30">
                      <option value="">Select...</option>
                      {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-ec-t3 uppercase tracking-wide mb-1">Reason *</label>
                  <select value={form.reason} onChange={e => set('reason', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-ec-border bg-ec-card text-sm text-ec-t1 outline-none focus:ring-2 focus:ring-emerald-500/30">
                    <option value="">Select...</option>
                    {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-ec-t3 uppercase tracking-wide mb-1">Witness 1 *</label>
                    <select value={form.witness_1} onChange={e => set('witness_1', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-ec-border bg-ec-card text-sm text-ec-t1 outline-none focus:ring-2 focus:ring-emerald-500/30">
                      <option value="">Select...</option>
                      {staffList.filter(s => s !== currentUser && s !== form.witness_2).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-ec-t3 uppercase tracking-wide mb-1">Witness 2 *</label>
                    <select value={form.witness_2} onChange={e => set('witness_2', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-ec-border bg-ec-card text-sm text-ec-t1 outline-none focus:ring-2 focus:ring-emerald-500/30">
                      <option value="">Select...</option>
                      {staffList.filter(s => s !== currentUser && s !== form.witness_1).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-ec-t3 uppercase tracking-wide mb-1">Notes</label>
                  <input type="text" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional"
                    className="w-full px-3 py-2 rounded-lg border border-ec-border bg-ec-card text-sm text-ec-t1 outline-none focus:ring-2 focus:ring-emerald-500/30 placeholder:text-ec-t3" />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-5">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-ec-card text-ec-t2 border border-ec-border cursor-pointer hover:bg-ec-card-hover transition">
                  Cancel
                </button>
                <button type="submit" disabled={!valid || saving}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white border-none cursor-pointer hover:bg-red-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {saving ? 'Saving...' : 'Confirm Destruction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Destruction history */}
      <div className="bg-ec-card border border-ec-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-ec-border">
          <h3 className="text-sm font-semibold text-ec-t1 m-0">Destruction Records</h3>
        </div>
        {destructions.length === 0 ? (
          <div className="text-center py-12 text-ec-t3 text-sm">No destruction records yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-ec-border">
                  {['Date/Time', 'Drug', 'Qty', 'Reason', 'Method', 'Witness 1', 'Witness 2', 'Authorised By'].map(h => (
                    <th key={h} className="text-left text-[11px] font-semibold text-ec-t3 uppercase tracking-wide px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {destructions.map(d => {
                  const drug = drugs.find(dr => dr.id === d.drug_id)
                  return (
                    <tr key={d.id} className="border-b border-ec-border last:border-b-0 hover:bg-ec-card-hover transition-colors">
                      <td className="px-4 py-3 text-ec-t2 whitespace-nowrap">{formatDateTime(d.destroyed_at)}</td>
                      <td className="px-4 py-3 text-ec-t1 font-medium">{drug ? `${drug.name} ${drug.strength}` : '—'}</td>
                      <td className="px-4 py-3 text-ec-t1 font-medium">{d.quantity}</td>
                      <td className="px-4 py-3 text-ec-t2">{d.reason}</td>
                      <td className="px-4 py-3 text-ec-t2">{d.method}</td>
                      <td className="px-4 py-3 text-ec-t2">{d.witness_1}</td>
                      <td className="px-4 py-3 text-ec-t2">{d.witness_2}</td>
                      <td className="px-4 py-3 text-ec-t2">{d.authorised_by}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/cdregister/DestructionTab.jsx
git commit -m "feat(cd): add DestructionTab with witnessed destruction workflow"
```

---

### Task 9: Rewrite CDRegister.jsx Main Page

**Files:**
- Modify: `src/pages/CDRegister.jsx` (full rewrite)

**Step 1: Replace the entire file**

Replace the static preview page with the real three-tab orchestrator. Uses `useCDData` hook, `useUser` for access control, and the three tab components.

```jsx
import { useState } from 'react'
import { useCDData } from '../hooks/useCDData'
import { useUser } from '../contexts/UserContext'
import { useSupabase } from '../hooks/useSupabase'
import { useToast } from '../components/Toast'
import RegisterTab from '../components/cdregister/RegisterTab'
import BalanceCheckTab from '../components/cdregister/BalanceCheckTab'
import DestructionTab from '../components/cdregister/DestructionTab'
import AddEntryModal from '../components/cdregister/AddEntryModal'

const ELEVATED_ROLES = ['superintendent', 'manager', 'pharmacist']
const TABS = ['Register', 'Balance Check', 'Destruction']

export default function CDRegister() {
  const showToast = useToast()
  const { user } = useUser()
  const canEdit = user && ELEVATED_ROLES.includes(user.role)
  const [activeTab, setActiveTab] = useState('Register')
  const [showAddEntry, setShowAddEntry] = useState(false)
  const [showAddDrug, setShowAddDrug] = useState(false)

  const { drugs, entries, balanceChecks, destructions, loading, getBalance, addEntry, addDestruction, addBalanceCheck, addDrug } = useCDData()
  const [staffMembers] = useSupabase('staff_members', [], { valueField: 'name' })

  const handleAddEntry = async (entry) => {
    const { error } = await addEntry(entry)
    if (error) {
      showToast('Failed to save entry', 'error')
    } else {
      showToast('CD entry saved', 'success')
      setShowAddEntry(false)
    }
  }

  const handleAddDestruction = async (destruction) => {
    const { error } = await addDestruction(destruction)
    if (error) {
      showToast('Failed to save destruction', 'error')
    } else {
      showToast('Destruction recorded', 'success')
    }
  }

  const handleBalanceCheck = async (check) => {
    const { error } = await addBalanceCheck(check)
    if (error) {
      showToast('Failed to save check', 'error')
    } else {
      showToast('Balance check saved', 'success')
    }
  }

  const handleAddDrug = async () => {
    const name = prompt('Drug name (e.g. Morphine Sulfate):')
    if (!name) return
    const schedule = prompt('Schedule (2 or 3):')
    if (schedule !== '2' && schedule !== '3') { showToast('Schedule must be 2 or 3', 'error'); return }
    const formulation = prompt('Formulation (e.g. Tablets):')
    const strength = prompt('Strength (e.g. 10mg):')
    if (!formulation || !strength) return
    const { error } = await addDrug({ name, schedule: parseInt(schedule), formulation, strength })
    if (error) showToast('Failed to add drug', 'error')
    else showToast(`${name} added to catalogue`, 'success')
  }

  // Stat cards
  const totalEntries = entries.length
  const activeDrugs = drugs.filter(d => d.is_active && getBalance(d.id) > 0).length
  const lastCheck = balanceChecks.length > 0 ? new Date(balanceChecks[0].checked_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'
  const discrepancies = balanceChecks.filter(c => c.discrepancy).length

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
        <div className="text-center py-20 text-ec-t3">Loading CD Register...</div>
      </div>
    )
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 ec-fadeup">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-ec-t1 m-0">CD Register</h1>
          <p className="text-sm text-ec-t3 mt-1 mb-0">Controlled Drugs register — Schedule 2 &amp; 3</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total Entries', value: totalEntries, color: 'emerald' },
          { label: 'Active Drugs', value: activeDrugs, color: 'blue' },
          { label: 'Discrepancies', value: discrepancies, color: discrepancies > 0 ? 'red' : 'emerald' },
          { label: 'Last Check', value: lastCheck, color: 'emerald' },
        ].map(card => (
          <div key={card.label} className="bg-ec-card border border-ec-border rounded-xl p-4">
            <div className="text-xs text-ec-t3 font-medium">{card.label}</div>
            <div className={`text-xl font-bold mt-0.5 ${
              card.color === 'red' ? 'text-red-600' : card.color === 'blue' ? 'text-blue-600' : 'text-ec-t1'
            }`}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border-none cursor-pointer transition-all
              ${activeTab === tab
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-ec-card text-ec-t2 hover:bg-ec-card-hover'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Register' && (
        <RegisterTab
          entries={entries} drugs={drugs} canEdit={canEdit}
          onAdd={() => setShowAddEntry(true)}
        />
      )}
      {activeTab === 'Balance Check' && (
        <BalanceCheckTab
          drugs={drugs} getBalance={getBalance} balanceChecks={balanceChecks}
          staffList={staffMembers} currentUser={user?.name || ''} canEdit={canEdit}
          onSave={handleBalanceCheck}
        />
      )}
      {activeTab === 'Destruction' && (
        <DestructionTab
          drugs={drugs} destructions={destructions} getBalance={getBalance}
          staffList={staffMembers} currentUser={user?.name || ''} canEdit={canEdit}
          onSave={handleAddDestruction}
        />
      )}

      {/* Add Entry Modal */}
      {showAddEntry && (
        <AddEntryModal
          drugs={drugs} staffList={staffMembers} currentUser={user?.name || ''}
          onSave={handleAddEntry} onClose={() => setShowAddEntry(false)}
          onAddDrug={handleAddDrug}
        />
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/pages/CDRegister.jsx
git commit -m "feat(cd): rewrite CDRegister page with real three-tab UI"
```

---

### Task 10: Remove "Soon" Badge from Sidebar

**Files:**
- Modify: `src/components/Sidebar.jsx:52`

**Step 1: Remove the badge property**

Change line 52 from:
```javascript
      { to: '/cd-register', label: 'CD Register', icon: 'file', badge: 'soon' },
```
to:
```javascript
      { to: '/cd-register', label: 'CD Register', icon: 'file' },
```

**Step 2: Commit**

```bash
git add src/components/Sidebar.jsx
git commit -m "feat(cd): remove 'soon' badge from CD Register sidebar entry"
```

---

### Task 11: Smoke Test the Full Feature

**Step 1: Run dev server**

```bash
npm run dev
```

**Step 2: Verify in browser**

1. Navigate to CD Register in sidebar — should load without "Soon" badge or "Preview" markers
2. Stat cards should show real counts from seed data
3. Register tab: 8 sample entries visible, search and schedule filter work
4. Click "+ Add Entry" — modal opens, drug dropdown shows Schedule 2 & 3 drugs
5. Add a new entry (In), verify balance updates
6. Balance Check tab: "Start Balance Check" shows drugs with stock
7. Click "All OK", select witness, save — check appears in history
8. Destruction tab: "Record Destruction" modal opens, select drug, enter qty, two witnesses, save
9. Verify destruction creates a register entry with direction "destruction"
10. Switch to dark mode — verify all components look correct

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat(cd): complete CD Register with register, balance check, and destruction"
```

---

## Summary of Files

| Action | File |
|--------|------|
| Create | `create-cd-tables.sql` |
| Create | `src/hooks/useCDData.js` |
| Create | `src/components/cdregister/DrugSelect.jsx` |
| Create | `src/components/cdregister/AddEntryModal.jsx` |
| Create | `src/components/cdregister/RegisterTab.jsx` |
| Create | `src/components/cdregister/BalanceCheckTab.jsx` |
| Create | `src/components/cdregister/DestructionTab.jsx` |
| Modify | `src/pages/CDRegister.jsx` (full rewrite) |
| Modify | `src/utils/seed.js` (add CD seed data, bump version) |
| Modify | `src/components/Sidebar.jsx:52` (remove badge) |
