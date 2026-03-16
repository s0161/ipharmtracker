import { useMemo } from 'react'
import { useSupabase } from './useSupabase'

const CATEGORY_COLOURS = {
  document: 'grey',
  training: 'purple',
  appraisal: 'blue',
  temperature: 'grey',
  cleaning: 'teal',
  patient_query: 'orange',
  mhra: 'red',
  cd_check: 'grey',
  near_miss: 'grey',
  other: 'grey',
}

function dateOnly(d) {
  if (!d) return null
  const parsed = new Date(d)
  if (isNaN(parsed)) return null
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
}

function todayDate() {
  const n = new Date()
  return new Date(n.getFullYear(), n.getMonth(), n.getDate())
}

function daysDiff(a, b) {
  return Math.round((a - b) / (1000 * 60 * 60 * 24))
}

function getStatus(date, completed) {
  if (completed) return 'done'
  if (!date) return 'upcoming'
  const today = todayDate()
  const diff = daysDiff(date, today)
  if (diff < 0) return 'overdue'
  if (diff === 0) return 'due_today'
  if (diff <= 7) return 'due_soon'
  return 'upcoming'
}

function getColour(status, category) {
  if (status === 'done') return 'green'
  if (status === 'overdue') return 'red'
  if (status === 'due_today' || status === 'due_soon') return 'amber'
  return CATEGORY_COLOURS[category] || 'grey'
}

export function useComplianceCalendar() {
  const [documents,, loadingDocs] = useSupabase('documents', [])
  const [staffTraining,, loadingST] = useSupabase('staff_training', [])
  const [trainingTopics,, loadingTT] = useSupabase('training_topics', [])
  const [appraisals,, loadingAp] = useSupabase('appraisals', [])
  const [fridgeLogs,, loadingFridge] = useSupabase('fridge_temperature_logs', [])
  const [cleaningEntries,, loadingCE] = useSupabase('cleaning_entries', [])
  const [cleaningTasks,, loadingCT] = useSupabase('cleaning_tasks', [])
  const [patientQueries,, loadingPQ] = useSupabase('patient_queries', [])
  const [mhraFlags,, loadingMH] = useSupabase('mhra_alert_flags', [])
  const [actionItems,, loadingAI] = useSupabase('action_items', [])
  const [nearMisses,, loadingNM] = useSupabase('near_misses', [])

  const loading = loadingDocs || loadingST || loadingTT || loadingAp ||
    loadingFridge || loadingCE || loadingCT || loadingPQ || loadingMH || loadingAI || loadingNM

  const events = useMemo(() => {
    const result = []

    // Documents — expiry dates
    for (const doc of documents) {
      const date = dateOnly(doc.expiryDate)
      if (!date) continue
      result.push({
        id: `doc-${doc.id}`,
        date,
        title: doc.name || doc.documentName || 'Document',
        category: 'document',
        status: getStatus(date, false),
        colour: getColour(getStatus(date, false), 'document'),
        detail: `Expires ${date.toLocaleDateString('en-GB')}`,
        linkTo: '#/documents',
      })
    }

    // Staff training — due dates
    const topicMap = new Map(trainingTopics.map(t => [t.id, t.name || t.topicName]))
    for (const st of staffTraining) {
      const date = dateOnly(st.dueDate || st.nextDue)
      if (!date) continue
      const completed = !!st.completedAt || !!st.completedDate
      const status = getStatus(date, completed)
      result.push({
        id: `train-${st.id}`,
        date,
        title: topicMap.get(st.topicId) || st.topicName || 'Training',
        category: 'training',
        status,
        colour: getColour(status, 'training'),
        detail: st.staffName ? `${st.staffName}` : 'Staff training',
        linkTo: '#/training',
      })
    }

    // Appraisals — next due
    for (const ap of appraisals) {
      const date = dateOnly(ap.nextDue || ap.dueDate)
      if (!date) continue
      const completed = !!ap.completedAt
      const status = getStatus(date, completed)
      result.push({
        id: `appr-${ap.id}`,
        date,
        title: ap.staffName ? `${ap.staffName} Appraisal` : 'Appraisal',
        category: 'appraisal',
        status,
        colour: getColour(status, 'appraisal'),
        detail: completed ? 'Completed' : `Due ${date.toLocaleDateString('en-GB')}`,
        linkTo: '#/appraisals',
      })
    }

    // Fridge temperature logs
    for (const fl of fridgeLogs) {
      const date = dateOnly(fl.createdAt || fl.date)
      if (!date) continue
      result.push({
        id: `temp-${fl.id}`,
        date,
        title: fl.fridgeName ? `${fl.fridgeName} Temp` : 'Temp Check',
        category: 'temperature',
        status: 'done',
        colour: 'green',
        detail: fl.temperature ? `${fl.temperature}°C` : 'Recorded',
        linkTo: '#/temperature',
      })
    }

    // Cleaning entries
    const taskMap = new Map(cleaningTasks.map(t => [t.id, t.name || t.taskName]))
    for (const ce of cleaningEntries) {
      const date = dateOnly(ce.createdAt || ce.date)
      if (!date) continue
      result.push({
        id: `clean-${ce.id}`,
        date,
        title: taskMap.get(ce.taskId) || ce.taskName || 'Cleaning',
        category: 'cleaning',
        status: 'done',
        colour: 'green',
        detail: ce.completedBy || 'Completed',
        linkTo: '#/cleaning',
      })
    }

    // Patient queries
    for (const pq of patientQueries) {
      const date = dateOnly(pq.createdAt || pq.date)
      if (!date) continue
      const completed = !!pq.resolvedAt || pq.status === 'resolved'
      const status = getStatus(date, completed)
      result.push({
        id: `pq-${pq.id}`,
        date,
        title: pq.patientName ? `Query: ${pq.patientName}` : 'Patient Query',
        category: 'patient_query',
        status,
        colour: getColour(status, 'patient_query'),
        detail: pq.description || pq.query || 'Patient query',
        linkTo: '#/patient-queries',
      })
    }

    // MHRA alerts
    for (const mh of mhraFlags) {
      const date = dateOnly(mh.createdAt || mh.date)
      if (!date) continue
      const completed = !!mh.resolvedAt || mh.status === 'resolved'
      const status = getStatus(date, completed)
      result.push({
        id: `mhra-${mh.id}`,
        date,
        title: mh.drugName || mh.title || 'MHRA Alert',
        category: 'mhra',
        status,
        colour: getColour(status, 'mhra'),
        detail: mh.description || 'MHRA recall/alert',
        linkTo: '#/mhra-recalls',
      })
    }

    // Action items (CD checks)
    for (const ai of actionItems) {
      const date = dateOnly(ai.createdAt || ai.dueDate)
      if (!date) continue
      const isCD = /cd|controlled/i.test(ai.category || ai.title || '')
      const completed = !!ai.completedAt || ai.status === 'completed'
      const status = getStatus(date, completed)
      result.push({
        id: `act-${ai.id}`,
        date,
        title: ai.title || ai.description || 'Action Item',
        category: isCD ? 'cd_check' : 'other',
        status,
        colour: getColour(status, isCD ? 'cd_check' : 'other'),
        detail: ai.description || '',
        linkTo: isCD ? '#/cd-register' : '#/alerts',
      })
    }

    // Near misses
    for (const nm of nearMisses) {
      const date = dateOnly(nm.createdAt || nm.date)
      if (!date) continue
      result.push({
        id: `nm-${nm.id}`,
        date,
        title: nm.title || nm.description || 'Near Miss',
        category: 'near_miss',
        status: 'done',
        colour: getColour('done', 'near_miss'),
        detail: nm.description || 'Near miss recorded',
        linkTo: '#/near-misses',
      })
    }

    // Sort by date ascending
    result.sort((a, b) => a.date - b.date)
    return result
  }, [documents, staffTraining, trainingTopics, appraisals, fridgeLogs,
      cleaningEntries, cleaningTasks, patientQueries, mhraFlags, actionItems, nearMisses])

  return { events, loading, error: null }
}
