-- ═══════════════════════════════════════════════════════════
-- Staff Appraisals System — Create tables
-- Run in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- Main appraisal records
CREATE TABLE IF NOT EXISTS appraisals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_name TEXT NOT NULL,
  conducted_by TEXT NOT NULL,
  appraisal_date DATE NOT NULL,
  appraisal_type TEXT NOT NULL CHECK (appraisal_type IN ('Annual', '6-Month', 'Probation Review', 'Performance Improvement', 'Ad Hoc')),
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Completed', 'Acknowledged', 'Archived')),
  overall_rating INT CHECK (overall_rating BETWEEN 1 AND 5),
  summary TEXT,
  strengths TEXT,
  areas_for_development TEXT,
  staff_comments TEXT,
  staff_acknowledged BOOLEAN DEFAULT false,
  staff_acknowledged_at TIMESTAMPTZ,
  next_appraisal_date DATE,
  is_confidential BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Goals set during an appraisal
CREATE TABLE IF NOT EXISTS appraisal_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appraisal_id UUID REFERENCES appraisals(id) ON DELETE CASCADE,
  goal_text TEXT NOT NULL,
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'Not Started' CHECK (status IN ('Not Started', 'In Progress', 'Completed', 'Carried Over')),
  progress_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Competency ratings per appraisal
CREATE TABLE IF NOT EXISTS appraisal_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appraisal_id UUID REFERENCES appraisals(id) ON DELETE CASCADE,
  competency TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Action items from an appraisal
CREATE TABLE IF NOT EXISTS appraisal_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appraisal_id UUID REFERENCES appraisals(id) ON DELETE CASCADE,
  action_text TEXT NOT NULL,
  owner TEXT,
  due_date DATE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reusable appraisal templates
CREATE TABLE IF NOT EXISTS appraisal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  appraisal_type TEXT NOT NULL,
  competencies JSONB DEFAULT '[]'::jsonb,
  suggested_goals JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Peer feedback requests
CREATE TABLE IF NOT EXISTS peer_feedback_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appraisal_id UUID REFERENCES appraisals(id) ON DELETE CASCADE,
  requested_from TEXT NOT NULL,
  submitted BOOLEAN DEFAULT false,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Peer feedback responses (anonymous)
CREATE TABLE IF NOT EXISTS peer_feedback_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES peer_feedback_requests(id) ON DELETE CASCADE,
  question_index INT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS — match existing anon-key pattern
ALTER TABLE appraisals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for appraisals" ON appraisals;
CREATE POLICY "Allow all for appraisals" ON appraisals FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE appraisal_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for appraisal_goals" ON appraisal_goals;
CREATE POLICY "Allow all for appraisal_goals" ON appraisal_goals FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE appraisal_ratings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for appraisal_ratings" ON appraisal_ratings;
CREATE POLICY "Allow all for appraisal_ratings" ON appraisal_ratings FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE appraisal_actions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for appraisal_actions" ON appraisal_actions;
CREATE POLICY "Allow all for appraisal_actions" ON appraisal_actions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE appraisal_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for appraisal_templates" ON appraisal_templates;
CREATE POLICY "Allow all for appraisal_templates" ON appraisal_templates FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE peer_feedback_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for peer_feedback_requests" ON peer_feedback_requests;
CREATE POLICY "Allow all for peer_feedback_requests" ON peer_feedback_requests FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE peer_feedback_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for peer_feedback_responses" ON peer_feedback_responses;
CREATE POLICY "Allow all for peer_feedback_responses" ON peer_feedback_responses FOR ALL USING (true) WITH CHECK (true);
