# CD Register — Full Feature Design

**Date**: 2026-03-10
**Status**: Approved

## Overview

Replace the static CD Register preview page with a fully functional Controlled Drugs register backed by Supabase. Covers Schedule 2 and Schedule 3 drugs only (no Schedule 4 or 5).

## Features

### 1. Register (main tab)
- Table of all CD entries: date, drug, formulation, strength, qty, direction (In/Out/Destruction), patient, prescriber, witness, running balance, staff
- Filter by drug name, schedule (2/3), date range
- Sort by date (newest first default)
- Running balance calculated per drug (auto-computed from In/Out/Destruction entries)
- "+ Add Entry" button opens modal form
- Drug selected from predefined catalogue (with option to add custom)

### 2. Balance Check (tab)
- Lists each active drug with its current register balance
- Staff enters physical count for each drug
- System flags discrepancies (physical ≠ register)
- Records: who checked, who witnessed, timestamp, notes
- "All OK" shortcut when all counts match
- History of past balance checks viewable

### 3. Destruction (tab)
- Record witnessed CD destruction
- Fields: drug, quantity, reason, method, witness 1, witness 2, authorised by, date, notes
- Creates a corresponding register entry (direction = "destruction", deducts from balance)
- History of past destructions viewable

## Supabase Tables

### `cd_drugs` — Drug catalogue
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text | e.g. "Morphine Sulfate" |
| schedule | int | 2 or 3 |
| formulation | text | e.g. "Tablets", "Solution" |
| strength | text | e.g. "10mg", "10mg/5ml" |
| is_active | bool | default true |
| created_at | timestamptz | |

### `cd_register` — Main register entries
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| drug_id | uuid FK→cd_drugs | |
| date | date | Entry date |
| quantity | int | Amount in/out |
| direction | text | "in", "out", or "destruction" |
| patient | text | Patient name (nullable, "—" for receipts) |
| prescriber | text | Prescriber name |
| witnessed_by | text | Witness name |
| balance | int | Running balance after this entry |
| staff_member | text | Who made the entry |
| notes | text | Optional |
| created_at | timestamptz | |

### `cd_balance_checks` — Balance verification records
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| drug_id | uuid FK→cd_drugs | |
| register_balance | int | Balance per register |
| physical_count | int | Actual count |
| discrepancy | bool | physical ≠ register |
| checked_by | text | Staff who counted |
| witnessed_by | text | Witness |
| checked_at | timestamptz | |
| notes | text | Optional |

### `cd_destructions` — Destruction records
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| drug_id | uuid FK→cd_drugs | |
| quantity | int | Amount destroyed |
| reason | text | Why destroyed |
| method | text | How destroyed |
| witness_1 | text | First witness |
| witness_2 | text | Second witness |
| authorised_by | text | Who authorised |
| destroyed_at | timestamptz | |
| register_entry_id | uuid FK→cd_register | Linked register deduction |
| notes | text | Optional |

## Predefined Drug Catalogue (seed data)

Schedule 2:
- Morphine Sulfate — Tablets 10mg, 20mg, 30mg
- Morphine Sulfate — Oral Solution 10mg/5ml
- Oxycodone — Capsules 5mg, 10mg, 20mg
- Fentanyl — Patches 12mcg/hr, 25mcg/hr, 50mcg/hr, 75mcg/hr
- Methylphenidate — Tablets 10mg, 20mg
- Methadone — Oral Solution 1mg/ml
- Diamorphine — Powder for injection 5mg, 10mg

Schedule 3:
- Midazolam — Solution 10mg/5ml
- Tramadol — Capsules 50mg
- Pregabalin — Capsules 75mg, 150mg, 300mg
- Buprenorphine — Patches 5mcg/hr, 10mcg/hr, 20mcg/hr
- Temazepam — Tablets 10mg, 20mg

## UI Structure

```
src/pages/CDRegister.jsx          — Main orchestrator (tabs, state)
src/components/cdregister/
  RegisterTab.jsx                 — Entry table + filters
  BalanceCheckTab.jsx             — Balance check workflow
  DestructionTab.jsx              — Destruction records
  AddEntryModal.jsx               — Add/edit register entry form
  DrugSelect.jsx                  — Drug picker (predefined + custom)
  BalanceCheckModal.jsx           — Run a balance check
  DestructionModal.jsx            — Record a destruction
```

## Design Rules
- Emerald Mint theme, same as rest of app
- Mobile-responsive table (horizontal scroll on small screens)
- Schedule badge colours: S2 = red, S3 = orange
- Direction badges: In = emerald, Out = amber, Destruction = red
- Witness field required on all entries (legal requirement)
- Balance auto-calculated, not manually entered
- Remove "Preview"/"Coming Soon" badges and dummy data watermarks
- Remove sidebar "soon" badge

## Access Control
- All staff can view the register
- Only elevated roles (superintendent, pharmacist, manager) can add entries, run balance checks, and record destructions
- Matches existing `isElevatedRole()` pattern from taskEngine.js
