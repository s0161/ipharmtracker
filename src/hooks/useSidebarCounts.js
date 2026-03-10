import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getTrafficLight, getTaskStatus } from '../utils/helpers'

function emptyCounts() {
  return {
    '/documents': { red: 0, amber: 0 },
    '/staff-training': { red: 0, amber: 0 },

    '/cleaning': { red: 0, amber: 0 },
    '/temperature': { red: 0, amber: 0 },
    '/my-tasks': { red: 0, amber: 0 },
    '/safeguarding': { red: 0, amber: 0 },
    '/sop-library': { red: 0, amber: 0 },
  }
}

async function fetchCounts() {
  const counts = emptyCounts()
  const prefs = JSON.parse(localStorage.getItem('ipd_notification_prefs') || '{}')

  let docsRes, staffRes, tasksRes, entriesRes, tempRes, staffTasksRes, sgConcernsRes, sopsRes
  try {
    ;[docsRes, staffRes, tasksRes, entriesRes, tempRes, staffTasksRes, sgConcernsRes, sopsRes] = await Promise.all([
      supabase.from('documents').select('expiry_date'),
      supabase.from('staff_training').select('status, target_date'),
      supabase.from('cleaning_tasks').select('name, frequency'),
      supabase.from('cleaning_entries').select('task_name, date_time'),
      supabase.from('fridge_temperature_logs').select('date'),
      supabase.from('staff_tasks').select('status, due_date'),
      supabase.from('safeguarding_concerns').select('status'),
      supabase.from('sops').select('review_date'),
    ])
  } catch (e) {
    console.error('Failed to fetch sidebar counts:', e)
    return counts
  }

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

  // Staff tasks: pending/overdue count
  if (staffTasksRes.data) {
    const todayStr = new Date().toISOString().slice(0, 10)
    staffTasksRes.data.forEach((t) => {
      if (t.status !== 'done') {
        if (t.due_date && t.due_date < todayStr) {
          counts['/my-tasks'].red++
        } else {
          counts['/my-tasks'].amber++
        }
      }
    })
  }

  // Safeguarding concerns: open = amber, escalated = red
  if (sgConcernsRes.data) {
    sgConcernsRes.data.forEach((c) => {
      if (c.status === 'open') counts['/safeguarding'].amber++
      if (c.status === 'referred') counts['/safeguarding'].red++
    })
  }

  // SOP review dates: overdue = red, within 90 days = amber
  if (sopsRes.data) {
    const todayStr = new Date().toISOString().slice(0, 10)
    sopsRes.data.forEach((s) => {
      if (!s.review_date) return
      if (s.review_date < todayStr) {
        counts['/sop-library'].red++
      } else {
        const diffMs = new Date(s.review_date) - new Date(todayStr)
        const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
        if (days <= 90) counts['/sop-library'].amber++
      }
    })
  }

  // Zero out counts for disabled notification categories
  if (prefs.documentExpiry === false) counts['/documents'] = { red: 0, amber: 0 }
  if (prefs.trainingOverdue === false) counts['/staff-training'] = { red: 0, amber: 0 }

  if (prefs.cleaningOverdue === false) counts['/cleaning'] = { red: 0, amber: 0 }
  if (prefs.temperatureMissing === false) counts['/temperature'] = { red: 0, amber: 0 }
  if (prefs.safeguardingDue === false) counts['/safeguarding'] = { red: 0, amber: 0 }

  return counts
}

export function useSidebarCounts() {
  const [counts, setCounts] = useState(emptyCounts)

  useEffect(() => {
    fetchCounts().then(setCounts).catch(() => {})
    const id = setInterval(() => fetchCounts().then(setCounts).catch(() => {}), 30000)
    return () => clearInterval(id)
  }, [])

  return counts
}
