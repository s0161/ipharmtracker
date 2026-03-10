-- SOP Library tables
-- Run in Supabase Dashboard → SQL Editor

-- 1. SOPs table
CREATE TABLE IF NOT EXISTS sops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  effective_date DATE NOT NULL,
  review_date DATE NOT NULL,
  owner TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. SOP Acknowledgements table
CREATE TABLE IF NOT EXISTS sop_acknowledgements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_id UUID NOT NULL REFERENCES sops(id) ON DELETE CASCADE,
  acknowledged_by TEXT NOT NULL,
  acknowledged_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(sop_id, acknowledged_by)
);

-- RLS: open access (matches all other tables)
ALTER TABLE sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_acknowledgements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access on sops" ON sops
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access on sop_acknowledgements" ON sop_acknowledgements
  FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE sops;
ALTER PUBLICATION supabase_realtime ADD TABLE sop_acknowledgements;
