import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getTrafficLight, getSafeguardingStatus } from '../utils/helpers'

function emptyCounts() {
  return {
    '/documents': { red: 0, amber: 0 },
    '/staff-training': { red: 0, amber: 0 },
    '/safeguarding': { red: 0, amber: 0 },
  }
}

async function fetchCounts() {
  const counts = emptyCounts()

  const [docsRes, staffRes, sgRes] = await Promise.all([
    supabase.from('documents').select('expiry_date'),
    supabase.from('staff_training').select('status'),
    supabase.from('safeguarding_records').select('training_date'),
  ])

  if (docsRes.data) {
    docsRes.data.forEach((d) => {
      const status = getTrafficLight(d.expiry_date)
      if (status === 'red') counts['/documents'].red++
      if (status === 'amber') counts['/documents'].amber++
    })
  }

  if (staffRes.data) {
    counts['/staff-training'].red = staffRes.data.filter(
      (e) => e.status === 'Pending'
    ).length
  }

  if (sgRes.data) {
    sgRes.data.forEach((r) => {
      const status = getSafeguardingStatus(r.training_date)
      if (status === 'overdue') counts['/safeguarding'].red++
      if (status === 'due-soon') counts['/safeguarding'].amber++
    })
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
