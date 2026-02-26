/*
  Task rotation manager — deterministic assignment per task.

  - Each cleaning task rotates independently across the staff list
  - Daily tasks rotate by day-of-year, weekly by week number, fortnightly by fortnight
  - Robot Maintenance is always Salma Shakoor
  - RP checks are always Amjid Shakoor (only pharmacist)
  - Jamila Adwan is excluded from cleaning rotation
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

// Fixed assignments (not rotated)
const FIXED_ASSIGNMENTS = {
  'Robot Maintenance': 'Salma Shakoor',
}

const RP_PHARMACIST = 'Amjid Shakoor'

function getDayOfYear() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  return Math.floor((now - start) / (1000 * 60 * 60 * 24))
}

function getWeekNumber() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  return Math.ceil((now - start) / (7 * 24 * 60 * 60 * 1000))
}

function getFortnightNumber() {
  return Math.floor(getWeekNumber() / 2)
}

/**
 * Get the assigned staff member for a specific task.
 * Each task gets a unique offset so different tasks go to different people.
 *
 * @param {string} taskName - the cleaning task name
 * @param {string} frequency - 'daily' | 'weekly' | 'fortnightly' | 'monthly'
 * @param {number} taskIndex - position of this task within its frequency group
 */
export function getTaskAssignee(taskName, frequency, taskIndex = 0) {
  // Fixed assignments override rotation
  if (FIXED_ASSIGNMENTS[taskName]) {
    return FIXED_ASSIGNMENTS[taskName]
  }

  // Pick the period counter based on frequency
  let period
  switch (frequency) {
    case 'daily':
      period = getDayOfYear()
      break
    case 'weekly':
      period = getWeekNumber()
      break
    case 'fortnightly':
      period = getFortnightNumber()
      break
    case 'monthly':
      // Rotate monthly by month number
      period = new Date().getMonth()
      break
    default:
      period = getDayOfYear()
  }

  // Offset by taskIndex so each task in the same frequency gets a different person
  const idx = (period + taskIndex) % CLEANING_ROTATION.length
  return CLEANING_ROTATION[idx]
}

export function getRPAssignee() {
  return RP_PHARMACIST
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

export function getRotationList() {
  return CLEANING_ROTATION
}
