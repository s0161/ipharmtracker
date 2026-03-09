-- ============================================================
-- Staff Training Module — SQL Migration
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Training Modules (catalog of 30 modules)
CREATE TABLE IF NOT EXISTS training_modules (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  mandatory BOOLEAN DEFAULT false,
  renewal_months INT,
  applicable_roles TEXT[] DEFAULT '{}'
);

ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to training_modules" ON training_modules FOR ALL USING (true) WITH CHECK (true);

-- 2. Staff Training Records (per-staff per-module tracking)
CREATE TABLE IF NOT EXISTS staff_training_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id TEXT NOT NULL,
  module_id INT REFERENCES training_modules(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  completed_date DATE,
  expiry_date DATE,
  evidence_file_name TEXT,
  evidence_file_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE staff_training_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to staff_training_records" ON staff_training_records FOR ALL USING (true) WITH CHECK (true);

-- 3. Storage bucket for training evidence
INSERT INTO storage.buckets (id, name, public) VALUES ('training-evidence', 'training-evidence', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow anon insert training-evidence" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'training-evidence');
CREATE POLICY "Allow anon select training-evidence" ON storage.objects FOR SELECT USING (bucket_id = 'training-evidence');
CREATE POLICY "Allow anon delete training-evidence" ON storage.objects FOR DELETE USING (bucket_id = 'training-evidence');

-- 4. Seed 30 training modules across 5 categories
INSERT INTO training_modules (name, category, mandatory, renewal_months, applicable_roles) VALUES
  -- GPhC & Regulatory (6)
  ('GPhC Standards of Conduct', 'gphc_regulatory', true, 12, '{superintendent,manager,pharmacist,technician,dispenser}'),
  ('Responsible Pharmacist Obligations', 'gphc_regulatory', true, 12, '{superintendent,pharmacist}'),
  ('CPD & Revalidation Requirements', 'gphc_regulatory', true, 12, '{superintendent,pharmacist,technician}'),
  ('Controlled Drugs — Legal Framework', 'gphc_regulatory', true, 12, '{superintendent,pharmacist,technician,dispenser}'),
  ('Prescription Validity & Exemptions', 'gphc_regulatory', true, 12, '{superintendent,pharmacist,technician,dispenser}'),
  ('Clinical Governance & Audit', 'gphc_regulatory', false, 24, '{superintendent,manager,pharmacist}'),

  -- Dispensing & Clinical (6)
  ('Dispensing Accuracy & Checking', 'dispensing_clinical', true, 12, '{superintendent,pharmacist,technician,dispenser}'),
  ('Near Miss & Error Reporting', 'dispensing_clinical', true, 12, '{superintendent,manager,pharmacist,technician,dispenser}'),
  ('MDS / Blister Pack Preparation', 'dispensing_clinical', false, 12, '{technician,dispenser}'),
  ('Methadone & Supervised Consumption', 'dispensing_clinical', true, 12, '{superintendent,pharmacist,technician,dispenser}'),
  ('Fridge & Cold Chain Management', 'dispensing_clinical', true, 12, '{superintendent,pharmacist,technician,dispenser,stock_assistant}'),
  ('Medicines Optimisation', 'dispensing_clinical', false, 24, '{superintendent,pharmacist,technician}'),

  -- Health & Safety (6)
  ('Fire Safety Awareness', 'health_safety', true, 12, '{superintendent,manager,pharmacist,technician,dispenser,stock_assistant,driver,aca,staff}'),
  ('Health & Safety Induction', 'health_safety', true, NULL, '{superintendent,manager,pharmacist,technician,dispenser,stock_assistant,driver,aca,staff}'),
  ('Manual Handling', 'health_safety', true, 24, '{dispenser,stock_assistant,driver}'),
  ('COSHH Awareness', 'health_safety', false, 24, '{superintendent,manager,pharmacist,technician,dispenser,stock_assistant}'),
  ('First Aid Awareness', 'health_safety', false, 36, '{superintendent,manager,pharmacist,technician,dispenser}'),
  ('Lone Working', 'health_safety', true, 12, '{superintendent,pharmacist,technician,dispenser}'),

  -- Safeguarding & Governance (6)
  ('Safeguarding Adults — Level 1', 'safeguarding_governance', true, 24, '{superintendent,manager,pharmacist,technician,dispenser,stock_assistant,driver,aca,staff}'),
  ('Safeguarding Children — Level 1', 'safeguarding_governance', true, 24, '{superintendent,manager,pharmacist,technician,dispenser,stock_assistant,driver,aca,staff}'),
  ('Safeguarding — Level 3 (Pharmacist)', 'safeguarding_governance', true, 12, '{superintendent,pharmacist}'),
  ('Information Governance & GDPR', 'safeguarding_governance', true, 12, '{superintendent,manager,pharmacist,technician,dispenser,stock_assistant,driver,aca,staff}'),
  ('Equality, Diversity & Inclusion', 'safeguarding_governance', true, 24, '{superintendent,manager,pharmacist,technician,dispenser,stock_assistant,driver,aca,staff}'),
  ('Complaints Handling Procedure', 'safeguarding_governance', false, 12, '{superintendent,manager,pharmacist,technician,dispenser}'),

  -- Operational & Role-Specific (6)
  ('Delivery & Transport Procedures', 'operational', true, 12, '{driver}'),
  ('Stock Management & Ordering', 'operational', false, 12, '{manager,dispenser,stock_assistant}'),
  ('Customer Service & Communication', 'operational', false, 24, '{superintendent,manager,pharmacist,technician,dispenser,stock_assistant,aca,staff}'),
  ('Confidential Waste Procedures', 'operational', true, 12, '{superintendent,manager,pharmacist,technician,dispenser}'),
  ('IT Systems & PMR Training', 'operational', false, NULL, '{superintendent,manager,pharmacist,technician,dispenser}'),
  ('Emergency Procedures & Business Continuity', 'operational', true, 24, '{superintendent,manager,pharmacist,technician,dispenser,stock_assistant,driver,aca,staff}');
