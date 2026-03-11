-- ══════════════════════════════════════════════════════════
-- Care Homes — Add pharmacy_id, contacts & flags tables
-- Run AFTER create-care-homes-tables.sql
-- ══════════════════════════════════════════════════════════

-- Add new columns to care_homes
ALTER TABLE care_homes ADD COLUMN IF NOT EXISTS pharmacy_id TEXT NOT NULL DEFAULT 'FED07';
ALTER TABLE care_homes ADD COLUMN IF NOT EXISTS cqc_registration TEXT;
ALTER TABLE care_homes ADD COLUMN IF NOT EXISTS resident_count INTEGER;
ALTER TABLE care_homes ADD COLUMN IF NOT EXISTS delivery_days TEXT[];
ALTER TABLE care_homes ADD COLUMN IF NOT EXISTS delivery_slot TEXT;
ALTER TABLE care_homes ADD COLUMN IF NOT EXISTS pharmacist_lead TEXT DEFAULT 'Amjid Shakoor';

-- Care home contacts
CREATE TABLE IF NOT EXISTS care_home_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_home_id UUID REFERENCES care_homes(id) ON DELETE CASCADE,
  pharmacy_id TEXT NOT NULL DEFAULT 'FED07',
  role TEXT,
  name TEXT,
  phone TEXT,
  email TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Care home status flags
CREATE TABLE IF NOT EXISTS care_home_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_home_id UUID REFERENCES care_homes(id) ON DELETE CASCADE,
  pharmacy_id TEXT NOT NULL DEFAULT 'FED07',
  flag_type TEXT,
  flag_label TEXT,
  severity TEXT DEFAULT 'info',
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_care_home_contacts_home ON care_home_contacts(care_home_id);
CREATE INDEX IF NOT EXISTS idx_care_home_flags_home ON care_home_flags(care_home_id);
CREATE INDEX IF NOT EXISTS idx_care_homes_pharmacy ON care_homes(pharmacy_id);

-- RLS
ALTER TABLE care_home_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_home_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON care_home_contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON care_home_flags FOR ALL USING (true) WITH CHECK (true);
