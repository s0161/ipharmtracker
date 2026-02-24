import { useState, useEffect } from 'react'
import { getTrafficLight, getSafeguardingStatus } from '../utils/helpers'

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || []
  } catch {
    return []
  }
}

function computeCounts() {
  // Documents: red = expired/no date, amber = within 30 days
  const docs = readJson('ipd_documents')
  const docStatuses = docs.map((d) => getTrafficLight(d.expiryDate))
  const docsRed = docStatuses.filter((s) => s === 'red').length
  const docsAmber = docStatuses.filter((s) => s === 'amber').length

  // Staff Training: red = pending count
  const staffTraining = readJson('ipd_staff_training')
  const staffPending = staffTraining.filter((e) => e.status === 'Pending').length

  // Safeguarding: red = overdue, amber = due soon
  const safeguarding = readJson('ipd_safeguarding')
  const sgStatuses = safeguarding.map((r) => getSafeguardingStatus(r.trainingDate))
  const sgOverdue = sgStatuses.filter((s) => s === 'overdue').length
  const sgDueSoon = sgStatuses.filter((s) => s === 'due-soon').length

  return {
    '/documents': { red: docsRed, amber: docsAmber },
    '/staff-training': { red: staffPending, amber: 0 },
    '/safeguarding': { red: sgOverdue, amber: sgDueSoon },
  }
}

export function useSidebarCounts() {
  const [counts, setCounts] = useState(computeCounts)

  useEffect(() => {
    const id = setInterval(() => setCounts(computeCounts()), 5000)
    return () => clearInterval(id)
  }, [])

  return counts
}
