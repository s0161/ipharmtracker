-- Run this in Supabase Dashboard > SQL Editor
-- Creates the 5 missing tables that crash the app

-- 1. action_items (Dashboard todo list)
CREATE TABLE IF NOT EXISTS action_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT DEFAULT '',
  done BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'MED',
  assigned_to TEXT DEFAULT '',
  due_date TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. audit_log (Settings + Audit Log page)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT DEFAULT '',
  detail TEXT DEFAULT '',
  module TEXT DEFAULT '',
  "user" TEXT DEFAULT '',
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- 3. incidents (Incidents page)
CREATE TABLE IF NOT EXISTS incidents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT DEFAULT '',
  description TEXT DEFAULT '',
  severity TEXT DEFAULT 'Low',
  status TEXT DEFAULT 'Open',
  date TEXT DEFAULT '',
  reported_by TEXT DEFAULT '',
  action_taken TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. rp_log (RP Log + Dashboard)
CREATE TABLE IF NOT EXISTS rp_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date TEXT DEFAULT '',
  rp_name TEXT DEFAULT '',
  checklist JSONB DEFAULT '{}',
  notes TEXT DEFAULT '',
  sign_in_time TEXT DEFAULT '',
  sign_out_time TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. task_templates (MyTasks + Settings)
CREATE TABLE IF NOT EXISTS task_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT DEFAULT '',
  category TEXT DEFAULT '',
  frequency TEXT DEFAULT 'daily',
  priority TEXT DEFAULT 'MED',
  roles TEXT[] DEFAULT '{}',
  description TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS with open access (matching existing tables)
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE rp_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access" ON action_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON audit_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON incidents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON rp_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON task_templates FOR ALL USING (true) WITH CHECK (true);
