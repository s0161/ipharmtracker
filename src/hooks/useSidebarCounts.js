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
    '/appraisals': { red: 0, amber: 0 },
    '/mhra-recalls': { red: 0, amber: 0 },
    '/alerts': { red: 0, amber: 0 },
    '/care-homes': { red: 0, amber: 0 },
  }
}

async function fetchCounts() {
  const counts = emptyCounts()
  const prefs = JSON.parse(localStorage.getItem('ipd_notification_prefs') || '{}')

  let docsRes, staffRes, tasksRes, entriesRes, tempRes, staffTasksRes, sgConcernsRes
  try {
    ;[docsRes, staffRes, tasksRes, entriesRes, tempRes, staffTasksRes, sgConcernsRes] = await Promise.all([
      supabase.from('documents').select('expiry_date'),
      supabase.from('staff_training').select('status, target_date'),
      supabase.from('cleaning_tasks').select('name, frequency'),
      supabase.from('cleaning_entries').select('task_name, date_time'),
      supabase.from('fridge_temperature_logs').select('date'),
      supabase.from('staff_tasks').select('status, due_date'),
      supabase.from('safeguarding_concerns').select('status'),
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

  // Zero out counts for disabled notification categories
  if (prefs.documentExpiry === false) counts['/documents'] = { red: 0, amber: 0 }
  if (prefs.trainingOverdue === false) counts['/staff-training'] = { red: 0, amber: 0 }

  if (prefs.cleaningOverdue === false) counts['/cleaning'] = { red: 0, amber: 0 }
  if (prefs.temperatureMissing === false) counts['/temperature'] = { red: 0, amber: 0 }
  if (prefs.safeguardingDue === false) counts['/safeguarding'] = { red: 0, amber: 0 }

  // Appraisals overdue: check months since last appraisal per staff
  try {
    const [apprRes, staffMembersRes] = await Promise.all([
      supabase.from('appraisals').select('staff_name, appraisal_date, status'),
      supabase.from('staff_members').select('name'),
    ])
    if (apprRes.data && staffMembersRes.data) {
      const staffNames = staffMembersRes.data.map(s => s.name).filter(Boolean)
      const now = Date.now()
      staffNames.forEach(name => {
        const staffApprs = (apprRes.data || [])
          .filter(a => a.staff_name === name && a.status !== 'Archived')
          .sort((a, b) => new Date(b.appraisal_date) - new Date(a.appraisal_date))
        if (staffApprs.length === 0) {
          counts['/appraisals'].amber++
        } else {
          const months = Math.floor((now - new Date(staffApprs[0].appraisal_date)) / (1000 * 60 * 60 * 24 * 30.44))
          if (months >= 13) counts['/appraisals'].red++
          else if (months >= 11) counts['/appraisals'].amber++
        }
      })
    }
  } catch (e) {
    // Appraisal tables may not exist yet — graceful degradation
  }

  // MHRA Recalls: count unresolved flags as badge
  try {
    const [flagsRes] = await Promise.all([
      supabase.from('mhra_alert_flags').select('resolved'),
    ])
    if (flagsRes.data) {
      flagsRes.data.forEach(f => {
        if (!f.resolved) counts['/mhra-recalls'].amber++
      })
    }
  } catch (e) {
    // MHRA tables may not exist yet — graceful degradation
  }

  // Alerts: count CRITICAL (red) + HIGH (amber) active alerts
  try {
    const alertsRes = await supabase.from('alerts').select('severity').eq('status', 'ACTIVE')
    if (alertsRes.data) {
      alertsRes.data.forEach(a => {
        if (a.severity === 'CRITICAL') counts['/alerts'].red++
        else if (a.severity === 'HIGH') counts['/alerts'].amber++
      })
    }
  } catch (e) {
    // Alerts table may not exist yet — graceful degradation
  }

  // Care Homes: open MAR issues (Critical/High = red, Medium = amber), overdue cycles = red
  try {
    const [marRes, cyclesRes] = await Promise.all([
      supabase.from('care_home_mar_issues').select('severity, status'),
      supabase.from('medication_cycles').select('status, cycle_month'),
    ])
    if (marRes.data) {
      marRes.data.forEach(i => {
        if (i.status === 'Resolved') return
        if (i.severity === 'Critical' || i.severity === 'High') counts['/care-homes'].red++
        else if (i.severity === 'Medium') counts['/care-homes'].amber++
      })
    }
    if (cyclesRes.data) {
      const currentMonth = new Date().toISOString().slice(0, 7)
      cyclesRes.data.forEach(c => {
        if (c.cycle_month < currentMonth && c.status !== 'Delivered') {
          counts['/care-homes'].red++
        }
      })
    }
  } catch (e) {
    // Care home tables may not exist yet — graceful degradation
  }

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
