/*
  Task rotation manager — deterministic daily assignment.

  Supabase table (optional, for manual overrides):

  CREATE TABLE task_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    task_type TEXT NOT NULL,       -- 'cleaning' | 'rp'
    assigned_to TEXT NOT NULL,
    completed_by TEXT,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "anon full access" ON task_assignments FOR ALL USING (true) WITH CHECK (true);
*/

const CLEANING_ROTATION = [
  'Moniba Jamil',
  'Umama Khan',
  'Sadaf Subhani',
  'Salma Shakoor',
  'Urooj Khan',
  'Shain Nawaz',
  'Marian Hadaway',
]

const RP_ROTATION = [
  'Amjid Shakoor',
  'Jamila Adwan',
]

function getDayOfYear() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  return Math.floor((now - start) / (1000 * 60 * 60 * 24))
}

export function getTodaysCleaningStaff() {
  return CLEANING_ROTATION[getDayOfYear() % CLEANING_ROTATION.length]
}

export function getTodaysRP() {
  return RP_ROTATION[getDayOfYear() % RP_ROTATION.length]
}

export function getStaffInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getRotationList(type) {
  return type === 'rp' ? RP_ROTATION : CLEANING_ROTATION
}
