-- ═══════════════════════════════════════════════════
-- ALERTS SYSTEM — Tables for unified alert centre
-- ═══════════════════════════════════════════════════

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type    TEXT NOT NULL,  -- SOP_REVIEW | SOP_ACK | INDUCTION | APPRAISAL_DUE | APPRAISAL_ACK | APPRAISAL_GOAL | GPHC_EXPIRY | DBS_EXPIRY | TRAINING_EXPIRY | MHRA_RECALL | MHRA_FLAG | FRIDGE_TEMP | PROBATION
  severity      TEXT NOT NULL DEFAULT 'MEDIUM',  -- CRITICAL | HIGH | MEDIUM | LOW
  status        TEXT NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | ACKNOWLEDGED | RESOLVED | SNOOZED | DISMISSED
  title         TEXT NOT NULL,
  description   TEXT,
  source_table  TEXT,           -- e.g. 'sops', 'documents', 'appraisals'
  source_id     TEXT,           -- the ID of the record that triggered this alert
  assigned_to   TEXT,           -- staff member name (matches staff_members.name)
  due_date      DATE,
  snoozed_until TIMESTAMPTZ,
  resolved_by   TEXT,           -- staff member name
  resolved_at   TIMESTAMPTZ,
  resolution_note TEXT,
  auto_generated BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Alert acknowledgements
CREATE TABLE IF NOT EXISTS alert_acknowledgements (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id         UUID REFERENCES alerts(id) ON DELETE CASCADE,
  acknowledged_by  TEXT NOT NULL,  -- staff member name
  acknowledged_at  TIMESTAMPTZ DEFAULT NOW(),
  note             TEXT
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_source ON alerts(alert_type, source_id);
CREATE INDEX IF NOT EXISTS idx_alert_acks_alert ON alert_acknowledgements(alert_id);

-- RLS
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_acknowledgements ENABLE ROW LEVEL SECURITY;

-- Allow all (anon key access — matches existing project pattern)
CREATE POLICY "Allow all on alerts" ON alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on alert_acknowledgements" ON alert_acknowledgements FOR ALL USING (true) WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE alert_acknowledgements;
