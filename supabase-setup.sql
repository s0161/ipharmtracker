-- iPharmacy Direct: Create all tables

create table documents (
  id uuid primary key default gen_random_uuid(),
  document_name text not null,
  category text not null,
  owner text default '',
  issue_date text default '',
  expiry_date text default '',
  notes text default '',
  created_at timestamptz default now()
);

create table training_logs (
  id uuid primary key default gen_random_uuid(),
  staff_name text not null,
  date_completed text default '',
  topic text not null,
  trainer_name text default '',
  certificate_expiry text default '',
  notes text default '',
  created_at timestamptz default now()
);

create table cleaning_entries (
  id uuid primary key default gen_random_uuid(),
  task_name text not null,
  date_time text default '',
  staff_member text not null,
  result text not null,
  notes text default '',
  created_at timestamptz default now()
);

create table cleaning_tasks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  frequency text not null
);

create table staff_members (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table training_topics (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table safeguarding_records (
  id uuid primary key default gen_random_uuid(),
  staff_name text not null,
  job_title text not null,
  training_date text default '',
  delivered_by text default '',
  training_method text default '',
  handbook_version text default '',
  signed_off boolean default false,
  created_at timestamptz default now()
);

create table staff_training (
  id uuid primary key default gen_random_uuid(),
  staff_name text not null,
  role text default '',
  training_item text not null,
  target_date text default '',
  status text default 'Pending'
);

create table rp_log (
  id uuid primary key default gen_random_uuid(),
  date text not null,
  rp_name text not null,
  checklist jsonb default '{}',
  notes text default '',
  created_at timestamptz default now()
);

-- Disable RLS on all tables (no auth)
alter table documents enable row level security;
create policy "Allow all" on documents for all using (true) with check (true);

alter table training_logs enable row level security;
create policy "Allow all" on training_logs for all using (true) with check (true);

alter table cleaning_entries enable row level security;
create policy "Allow all" on cleaning_entries for all using (true) with check (true);

alter table cleaning_tasks enable row level security;
create policy "Allow all" on cleaning_tasks for all using (true) with check (true);

alter table staff_members enable row level security;
create policy "Allow all" on staff_members for all using (true) with check (true);

alter table training_topics enable row level security;
create policy "Allow all" on training_topics for all using (true) with check (true);

alter table safeguarding_records enable row level security;
create policy "Allow all" on safeguarding_records for all using (true) with check (true);

alter table staff_training enable row level security;
create policy "Allow all" on staff_training for all using (true) with check (true);

alter table rp_log enable row level security;
create policy "Allow all" on rp_log for all using (true) with check (true);
