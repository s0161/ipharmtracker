-- ══════════════════════════════════════════════════════════
-- Care Homes Management Tables
-- Run this in the Supabase SQL Editor
-- ══════════════════════════════════════════════════════════

-- 1. care_homes
CREATE TABLE IF NOT EXISTS care_homes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  contact_person TEXT,
  patient_count INTEGER DEFAULT 0,
  cycle_day INTEGER CHECK (cycle_day >= 1 AND cycle_day <= 28),
  delivery_method TEXT DEFAULT 'Delivery' CHECK (delivery_method IN ('Delivery', 'Collection')),
  notes TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. care_home_patients
CREATE TABLE IF NOT EXISTS care_home_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_home_id UUID REFERENCES care_homes(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  room_number TEXT,
  medication_count INTEGER DEFAULT 0,
  pack_type TEXT DEFAULT 'Blister' CHECK (pack_type IN ('Blister', 'MDS', 'Dosette')),
  allergies TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. medication_cycles
CREATE TABLE IF NOT EXISTS medication_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_home_id UUID REFERENCES care_homes(id) ON DELETE CASCADE,
  cycle_month TEXT NOT NULL, -- YYYY-MM
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Checking', 'Ready', 'Dispatched', 'Delivered')),
  patient_count INTEGER DEFAULT 0,
  items_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  checked_by TEXT,
  dispatched_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. cycle_patient_items
CREATE TABLE IF NOT EXISTS cycle_patient_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID REFERENCES medication_cycles(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES care_home_patients(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Dispensed', 'Checked', 'Problem')),
  item_count INTEGER DEFAULT 0,
  problem_note TEXT,
  checked_by TEXT,
  dispensed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. care_home_deliveries
CREATE TABLE IF NOT EXISTS care_home_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_home_id UUID REFERENCES care_homes(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES medication_cycles(id) ON DELETE SET NULL,
  delivery_date DATE,
  delivery_time TEXT,
  delivered_by TEXT,
  received_by TEXT,
  signature_confirmed BOOLEAN DEFAULT false,
  items_count INTEGER DEFAULT 0,
  notes TEXT,
  delivery_type TEXT DEFAULT 'Scheduled' CHECK (delivery_type IN ('Scheduled', 'Emergency', 'Ad-hoc')),
  status TEXT DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'In Transit', 'Delivered', 'Failed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. care_home_handover_notes
CREATE TABLE IF NOT EXISTS care_home_handover_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_home_id UUID REFERENCES care_homes(id) ON DELETE CASCADE,
  note_date DATE DEFAULT CURRENT_DATE,
  note_type TEXT DEFAULT 'General' CHECK (note_type IN ('General', 'Medication Change', 'Clinical', 'Urgent')),
  priority TEXT DEFAULT 'Normal' CHECK (priority IN ('Normal', 'High', 'Urgent')),
  content TEXT NOT NULL,
  created_by TEXT,
  acknowledged_by TEXT,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. care_home_mar_issues
CREATE TABLE IF NOT EXISTS care_home_mar_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_home_id UUID REFERENCES care_homes(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES care_home_patients(id) ON DELETE SET NULL,
  issue_date DATE DEFAULT CURRENT_DATE,
  issue_type TEXT DEFAULT 'Other' CHECK (issue_type IN ('Missing Signature', 'Wrong Dose', 'Omission', 'Other')),
  description TEXT,
  severity TEXT DEFAULT 'Medium' CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
  status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'Investigating', 'Resolved')),
  reported_by TEXT,
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Indexes ──
CREATE INDEX IF NOT EXISTS idx_care_home_patients_home ON care_home_patients(care_home_id);
CREATE INDEX IF NOT EXISTS idx_medication_cycles_home ON medication_cycles(care_home_id);
CREATE INDEX IF NOT EXISTS idx_medication_cycles_status ON medication_cycles(status);
CREATE INDEX IF NOT EXISTS idx_cycle_patient_items_cycle ON cycle_patient_items(cycle_id);
CREATE INDEX IF NOT EXISTS idx_care_home_deliveries_home ON care_home_deliveries(care_home_id);
CREATE INDEX IF NOT EXISTS idx_care_home_deliveries_cycle ON care_home_deliveries(cycle_id);
CREATE INDEX IF NOT EXISTS idx_care_home_deliveries_status ON care_home_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_care_home_handover_notes_home ON care_home_handover_notes(care_home_id);
CREATE INDEX IF NOT EXISTS idx_care_home_mar_issues_home ON care_home_mar_issues(care_home_id);
CREATE INDEX IF NOT EXISTS idx_care_home_mar_issues_status ON care_home_mar_issues(status);

-- ── RLS ──
ALTER TABLE care_homes ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_home_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycle_patient_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_home_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_home_handover_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_home_mar_issues ENABLE ROW LEVEL SECURITY;

-- ── Allow-all policies (matches project pattern) ──
CREATE POLICY "Allow all" ON care_homes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON care_home_patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON medication_cycles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON cycle_patient_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON care_home_deliveries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON care_home_handover_notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON care_home_mar_issues FOR ALL USING (true) WITH CHECK (true);
