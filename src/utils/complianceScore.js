import {
  getTrafficLight,
  getTaskStatus,
  getSafeguardingStatus,
  DEFAULT_CLEANING_TASKS,
} from './helpers'

/**
 * Calculate compliance scores from live Supabase data.
 *
 * @param {Object} data
 * @param {Array} data.documents          - documents table rows
 * @param {Array} data.staffTraining      - staff_training table rows
 * @param {Array} data.cleaningEntries    - cleaning_entries table rows
 * @param {Array} data.safeguardingRecords - safeguarding_records table rows
 * @param {Array} [data.cleaningTasks]    - cleaning_tasks table rows (falls back to DEFAULT_CLEANING_TASKS)
 *
 * @returns {{ documents: number, training: number, cleaning: number, safeguarding: number, overall: number }}
 */
export function calculateComplianceScores({
  documents = [],
  staffTraining = [],
  cleaningEntries = [],
  safeguardingRecords = [],
  cleaningTasks = [],
}) {
  // ── Documents: green / total ──
  const docTotal = documents.length || 1
  const docGreen = documents.filter(d => getTrafficLight(d.expiryDate) === 'green').length
  const docScore = Math.round((docGreen / docTotal) * 100)

  // ── Training: complete / total ──
  const trainTotal = staffTraining.length || 1
  const trainComplete = staffTraining.filter(t => t.status === 'Complete').length
  const trainingScore = Math.round((trainComplete / trainTotal) * 100)

  // ── Cleaning: done+upcoming / total (deduped by task name) ──
  const tasksToCheck = cleaningTasks.length > 0 ? cleaningTasks : DEFAULT_CLEANING_TASKS
  const seen = new Set()
  const uniqueTasks = tasksToCheck.filter(t => {
    if (seen.has(t.name)) return false
    seen.add(t.name)
    return true
  })
  const cleanTotal = uniqueTasks.length || 1
  const cleanGood = uniqueTasks.filter(t => {
    const status = getTaskStatus(t.name, t.frequency, cleaningEntries)
    return status === 'done' || status === 'upcoming'
  }).length
  const cleaningScore = Math.round((cleanGood / cleanTotal) * 100)

  // ── Safeguarding: current / total ──
  const sgTotal = safeguardingRecords.length || 1
  const sgCurrent = safeguardingRecords.filter(r => getSafeguardingStatus(r.trainingDate) === 'current').length
  const safeguardingScore = Math.round((sgCurrent / sgTotal) * 100)

  // ── Overall: average of 4 ──
  const overall = Math.round((docScore + trainingScore + cleaningScore + safeguardingScore) / 4)

  return {
    documents: docScore,
    training: trainingScore,
    cleaning: cleaningScore,
    safeguarding: safeguardingScore,
    overall,
  }
}

/**
 * Get detailed breakdown counts for each category.
 */
export function getComplianceDetails({
  documents = [],
  staffTraining = [],
  cleaningEntries = [],
  safeguardingRecords = [],
  cleaningTasks = [],
}) {
  const tasksToCheck = cleaningTasks.length > 0 ? cleaningTasks : DEFAULT_CLEANING_TASKS
  const seen = new Set()
  const uniqueTasks = tasksToCheck.filter(t => {
    if (seen.has(t.name)) return false
    seen.add(t.name)
    return true
  })

  return {
    documents: {
      total: documents.length,
      green: documents.filter(d => getTrafficLight(d.expiryDate) === 'green').length,
      amber: documents.filter(d => getTrafficLight(d.expiryDate) === 'amber').length,
      red: documents.filter(d => getTrafficLight(d.expiryDate) === 'red').length,
    },
    training: {
      total: staffTraining.length,
      complete: staffTraining.filter(t => t.status === 'Complete').length,
      outstanding: staffTraining.filter(t => t.status !== 'Complete').length,
    },
    cleaning: {
      total: uniqueTasks.length,
      done: uniqueTasks.filter(t => {
        const s = getTaskStatus(t.name, t.frequency, cleaningEntries)
        return s === 'done' || s === 'upcoming'
      }).length,
      overdue: uniqueTasks.filter(t => getTaskStatus(t.name, t.frequency, cleaningEntries) === 'overdue').length,
    },
    safeguarding: {
      total: safeguardingRecords.length,
      current: safeguardingRecords.filter(r => getSafeguardingStatus(r.trainingDate) === 'current').length,
      dueSoon: safeguardingRecords.filter(r => getSafeguardingStatus(r.trainingDate) === 'due-soon').length,
      overdue: safeguardingRecords.filter(r => getSafeguardingStatus(r.trainingDate) === 'overdue').length,
    },
  }
}
