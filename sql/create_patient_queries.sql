-- Patient Queries & Owing Log table
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)

create table if not exists patient_queries (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id text not null default 'FED07',

  -- Patient
  patient_name text not null,
  patient_dob date,
  patient_phone text,
  nhs_number text,

  -- Query details
  query_type text not null,
  -- values: 'owing', 'callback', 'gp_query', 'hospital_query', 'patient_query', 'other'

  priority text not null default 'normal',
  -- values: 'urgent', 'high', 'normal', 'low'

  subject text not null,
  description text,
  medication text,

  -- Status
  status text not null default 'open',
  -- values: 'open', 'in_progress', 'awaiting_response', 'resolved', 'cancelled'

  -- Assignment & ownership
  created_by uuid,
  assigned_to uuid,

  -- Resolution
  resolved_at timestamptz,
  resolved_by uuid,
  resolution_notes text,

  -- Follow-up
  follow_up_date date,
  contact_attempted_at timestamptz,
  contact_attempt_count int default 0,

  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table patient_queries enable row level security;

create policy "pharmacy_access" on patient_queries
  for all using (pharmacy_id = 'FED07');
