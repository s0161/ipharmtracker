-- ═══════════════════════════════════════════════════════════
-- Induction System — Create tables
-- Run in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- Induction modules (the learning content)
CREATE TABLE IF NOT EXISTS induction_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  content JSONB DEFAULT '{"sections":[]}'::jsonb,
  estimated_minutes INT DEFAULT 10,
  is_mandatory BOOLEAN DEFAULT true,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Completion tracking (one row per staff per module)
CREATE TABLE IF NOT EXISTS induction_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES induction_modules(id) ON DELETE CASCADE,
  staff_name TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now(),
  score INT,
  UNIQUE (module_id, staff_name)
);

-- Quiz answer tracking
CREATE TABLE IF NOT EXISTS induction_quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES induction_modules(id) ON DELETE CASCADE,
  staff_name TEXT NOT NULL,
  question_index INT NOT NULL,
  selected_answer INT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT now()
);

-- RLS — match existing anon-key pattern
ALTER TABLE induction_modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for induction_modules" ON induction_modules;
CREATE POLICY "Allow all for induction_modules" ON induction_modules FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE induction_completions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for induction_completions" ON induction_completions;
CREATE POLICY "Allow all for induction_completions" ON induction_completions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE induction_quiz_answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for induction_quiz_answers" ON induction_quiz_answers;
CREATE POLICY "Allow all for induction_quiz_answers" ON induction_quiz_answers FOR ALL USING (true) WITH CHECK (true);
