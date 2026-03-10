-- ═══════════════════════════════════════════════════════════
-- MHRA Recalls — Create tables
-- Run in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- Alert acknowledgements (one row per staff per alert)
CREATE TABLE IF NOT EXISTS mhra_alert_acknowledgements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id TEXT NOT NULL,
  alert_title TEXT NOT NULL,
  acknowledged_by TEXT NOT NULL,
  acknowledged_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  action_taken TEXT CHECK (action_taken IN (
    'Not Stocked', 'Stock Checked', 'Stock Quarantined',
    'Stock Returned', 'Patients Notified', 'No Action Required'
  )),
  UNIQUE (alert_id, acknowledged_by)
);

-- Alert flags (staff can flag alerts for attention)
CREATE TABLE IF NOT EXISTS mhra_alert_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id TEXT NOT NULL,
  alert_title TEXT NOT NULL,
  flagged_by TEXT NOT NULL,
  flagged_at TIMESTAMPTZ DEFAULT now(),
  reason TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT
);

-- RLS — match existing anon-key pattern
ALTER TABLE mhra_alert_acknowledgements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for mhra_alert_acknowledgements" ON mhra_alert_acknowledgements;
CREATE POLICY "Allow all for mhra_alert_acknowledgements" ON mhra_alert_acknowledgements FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE mhra_alert_flags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for mhra_alert_flags" ON mhra_alert_flags;
CREATE POLICY "Allow all for mhra_alert_flags" ON mhra_alert_flags FOR ALL USING (true) WITH CHECK (true);
