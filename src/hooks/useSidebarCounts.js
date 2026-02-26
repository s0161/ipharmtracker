import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getTrafficLight, getSafeguardingStatus, getTaskStatus } from '../utils/helpers'

function emptyCounts() {
  return {
    '/documents': { red: 0, amber: 0 },
    '/staff-training': { red: 0, amber: 0 },
    '/safeguarding': { red: 0, amber: 0 },
    '/cleaning': { red: 0, amber: 0 },
    '/temperature': { red: 0, amber: 0 },
  }
}

async function fetchCounts() {
  const counts = emptyCounts()

  const [docsRes, staffRes, sgRes, tasksRes, entriesRes, tempRes] = await Promise.all([
    supabase.from('documents').select('expiry_date'),
    supabase.from('staff_training').select('status, target_date'),
    supabase.from('safeguarding_records').select('training_date'),
    supabase.from('cleaning_tasks').select('name, frequency'),
    supabase.from('cleaning_entries').select('task_name, date_time'),
    supabase.from('temperature_logs').select('date'),
  ])

  if (docsRes.data) {
    docsRes.data.forEach((d) => {
      const status = getTrafficLight(d.expiry_date)
      if (status === 'red') counts['/documents'].red++
      if (status === 'amber') counts['/documents'].amber++
    })
  }

  // Staff training: only count genuinely overdue Pending items (past target date)
  if (staffRes.data) {
    const todayStr = new Date().toISOString().slice(0, 10)
    staffRes.data.forEach((e) => {
      if (e.status === 'Pending' && e.target_date && e.target_date < todayStr) {
        counts['/staff-training'].red++
      }
    })
  }

  if (sgRes.data) {
    sgRes.data.forEach((r) => {
      const status = getSafeguardingStatus(r.training_date)
      if (status === 'overdue') counts['/safeguarding'].red++
      if (status === 'due-soon') counts['/safeguarding'].amber++
    })
  }

  // Cleaning overdue count
  if (tasksRes.data && entriesRes.data) {
    const entries = (entriesRes.data || []).map(e => ({
      taskName: e.task_name,
      dateTime: e.date_time,
    }))
    const seen = new Set()
    tasksRes.data.forEach(t => {
      if (seen.has(t.name)) return
      seen.add(t.name)
      const status = getTaskStatus(t.name, t.frequency, entries)
      if (status === 'overdue') counts['/cleaning'].red++
      if (status === 'due') counts['/cleaning'].amber++
    })
  }

  // Temperature: check if logged today
  if (tempRes.data) {
    const todayStr = new Date().toISOString().slice(0, 10)
    const todayLogs = tempRes.data.filter(l => l.date === todayStr)
    if (todayLogs.length === 0) {
      counts['/temperature'].amber = 1
    }
  } else {
    counts['/temperature'].amber = 1
  }

  return counts
}

export function useSidebarCounts() {
  const [counts, setCounts] = useState(emptyCounts)

  useEffect(() => {
    fetchCounts().then(setCounts)
    const id = setInterval(() => fetchCounts().then(setCounts), 30000)
    return () => clearInterval(id)
  }, [])

  return counts
}
