-- ═══════════════════════════════════════════════════════════
-- SOP System Migration — Add columns to existing sops table
-- Run in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- Drop the old 'summary' column (replaced by 'description')
ALTER TABLE sops DROP COLUMN IF EXISTS summary;
ALTER TABLE sops DROP COLUMN IF EXISTS owner;

-- Add new text/JSONB columns for full SOP data
ALTER TABLE sops ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE sops ADD COLUMN IF NOT EXISTS scope TEXT;
ALTER TABLE sops ADD COLUMN IF NOT EXISTS roles JSONB DEFAULT '[]'::jsonb;
ALTER TABLE sops ADD COLUMN IF NOT EXISTS key_points JSONB DEFAULT '[]'::jsonb;
ALTER TABLE sops ADD COLUMN IF NOT EXISTS ref_documents JSONB DEFAULT '[]'::jsonb;
ALTER TABLE sops ADD COLUMN IF NOT EXISTS related_sops JSONB DEFAULT '[]'::jsonb;
ALTER TABLE sops ADD COLUMN IF NOT EXISTS author TEXT;
ALTER TABLE sops ADD COLUMN IF NOT EXISTS approved_by TEXT;
ALTER TABLE sops ADD COLUMN IF NOT EXISTS responsibilities JSONB DEFAULT '{}'::jsonb;
ALTER TABLE sops ADD COLUMN IF NOT EXISTS revision_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE sops ADD COLUMN IF NOT EXISTS training_requirements JSONB DEFAULT '[]'::jsonb;
ALTER TABLE sops ADD COLUMN IF NOT EXISTS monitoring TEXT;
ALTER TABLE sops ADD COLUMN IF NOT EXISTS risk_assessment JSONB DEFAULT '[]'::jsonb;
ALTER TABLE sops ADD COLUMN IF NOT EXISTS escalation TEXT;
ALTER TABLE sops ADD COLUMN IF NOT EXISTS review_triggers JSONB DEFAULT '[]'::jsonb;
ALTER TABLE sops ADD COLUMN IF NOT EXISTS appendices JSONB DEFAULT '[]'::jsonb;
ALTER TABLE sops ADD COLUMN IF NOT EXISTS risk_level TEXT CHECK (risk_level IN ('Low', 'Medium', 'High', 'Critical'));
ALTER TABLE sops ADD COLUMN IF NOT EXISTS flagged_for_review BOOLEAN DEFAULT false;
ALTER TABLE sops ADD COLUMN IF NOT EXISTS flag_reason TEXT;
ALTER TABLE sops ADD COLUMN IF NOT EXISTS acked INTEGER DEFAULT 0;

-- Ensure sop_acknowledgements has the right structure
ALTER TABLE sop_acknowledgements ADD COLUMN IF NOT EXISTS acknowledged_by TEXT;
ALTER TABLE sop_acknowledgements ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE sop_acknowledgements ADD COLUMN IF NOT EXISTS sop_id UUID REFERENCES sops(id);

-- Allow anonymous access (matches existing RLS pattern)
ALTER TABLE sops ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for sops" ON sops;
CREATE POLICY "Allow all for sops" ON sops FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE sop_acknowledgements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for sop_acknowledgements" ON sop_acknowledgements;
CREATE POLICY "Allow all for sop_acknowledgements" ON sop_acknowledgements FOR ALL USING (true) WITH CHECK (true);
