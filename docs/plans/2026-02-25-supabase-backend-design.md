# Supabase Backend Design

## Goal
Replace localStorage with Supabase so data syncs across all devices.

## Approach
Create a `useSupabase` hook mirroring the `useLocalStorage` API. Page components swap one import — minimal changes.

## Supabase Config
- URL: `https://auclhdhyyyyuupoccpsx.supabase.co`
- No authentication — open access via anon key
- RLS disabled on all tables

## Database Tables

| Table | Columns |
|-------|---------|
| documents | id, document_name, category, owner, issue_date, expiry_date, notes, created_at |
| training_logs | id, staff_name, date_completed, topic, trainer_name, certificate_expiry, notes, created_at |
| cleaning_entries | id, task_name, date_time, staff_member, result, notes, created_at |
| cleaning_tasks | id, name, frequency |
| staff_members | id, name |
| training_topics | id, name |
| safeguarding_records | id, staff_name, job_title, training_date, delivered_by, training_method, handbook_version, signed_off, created_at |
| staff_training | id, staff_name, role, training_item, target_date, status |

## Files
- CREATE: `src/lib/supabase.js`, `src/hooks/useSupabase.js`
- MODIFY: All pages/components using `useLocalStorage` → `useSupabase`
- MODIFY: `useSidebarCounts.js` → read from Supabase
- MODIFY: `dataManager.js` → export/import via Supabase
- INSTALL: `@supabase/supabase-js`

## Key Mapping (camelCase ↔ snake_case)
The hook handles conversion: components keep using camelCase (e.g. `staffName`), database uses snake_case (e.g. `staff_name`).
