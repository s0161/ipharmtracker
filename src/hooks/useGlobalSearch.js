import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const PHARMACY_ID = 'FED07'

const TABLE_CONFIG = [
  {
    table: 'staff_members',
    select: 'id, name, role',
    filter: (q) => ({ column: 'name', value: `%${q}%` }),
    hasPharmacyId: true,
    map: (row) => ({
      id: `staff-${row.id}`,
      title: row.name,
      subtitle: row.role || '',
      category: 'Staff',
      emoji: '👤',
      route: '/staff-directory',
    }),
  },
  {
    table: 'patient_queries',
    select: 'id, patient_name, subject, query_type, status',
    filter: (q) => ({ or: `patient_name.ilike.%${q}%,subject.ilike.%${q}%` }),
    hasPharmacyId: true,
    map: (row) => ({
      id: `pq-${row.id}`,
      title: row.patient_name || row.subject || 'Query',
      subtitle: [row.query_type, row.status].filter(Boolean).join(' · '),
      category: 'Patient Queries',
      emoji: '💊',
      route: '/patient-queries',
    }),
  },
  {
    table: 'incidents',
    select: 'id, type, description, severity, status',
    filter: (q) => ({ or: `description.ilike.%${q}%,type.ilike.%${q}%` }),
    hasPharmacyId: false,
    map: (row) => ({
      id: `inc-${row.id}`,
      title: row.type || 'Incident',
      subtitle: [row.severity, row.description?.slice(0, 60)].filter(Boolean).join(' — '),
      category: 'Incidents',
      emoji: '⚠️',
      route: '/incidents',
    }),
  },
  {
    table: 'staff_tasks',
    select: 'id, title, priority, status',
    filter: (q) => ({ column: 'title', value: `%${q}%` }),
    hasPharmacyId: false,
    map: (row) => ({
      id: `task-${row.id}`,
      title: row.title || 'Task',
      subtitle: [row.priority, row.status].filter(Boolean).join(' · '),
      category: 'Tasks',
      emoji: '✔️',
      route: '/my-tasks',
    }),
  },
  {
    table: 'training_logs',
    select: 'id, topic, staff_name, outcome',
    filter: (q) => ({ or: `topic.ilike.%${q}%,staff_name.ilike.%${q}%` }),
    hasPharmacyId: false,
    map: (row) => ({
      id: `train-${row.id}`,
      title: row.topic || 'Training',
      subtitle: [row.staff_name, row.outcome].filter(Boolean).join(' · '),
      category: 'Training',
      emoji: '🎓',
      route: '/training',
    }),
  },
  {
    table: 'documents',
    select: 'id, document_name, category, owner',
    filter: (q) => ({ column: 'document_name', value: `%${q}%` }),
    hasPharmacyId: false,
    map: (row) => ({
      id: `doc-${row.id}`,
      title: row.document_name || 'Document',
      subtitle: [row.category, row.owner].filter(Boolean).join(' · '),
      category: 'Documents',
      emoji: '📄',
      route: '/documents',
    }),
  },
]

async function queryTable(config, query, signal) {
  const { table, select, filter, hasPharmacyId } = config
  const f = filter(query)

  let q = supabase.from(table).select(select)

  if (hasPharmacyId) {
    q = q.eq('pharmacy_id', PHARMACY_ID)
  }

  if (f.or) {
    q = q.or(f.or)
  } else {
    q = q.ilike(f.column, f.value)
  }

  q = q.limit(3)

  const { data, error } = await q.abortSignal(signal)
  if (error) throw error
  return (data || []).map(config.map)
}

export function useGlobalSearch(query) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const abortRef = useRef(null)

  useEffect(() => {
    const trimmed = (query || '').trim()

    if (trimmed.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)

    const timer = setTimeout(async () => {
      // Cancel previous request
      if (abortRef.current) {
        abortRef.current.abort()
      }
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const settled = await Promise.allSettled(
          TABLE_CONFIG.map((cfg) => queryTable(cfg, trimmed, controller.signal))
        )

        // Don't update state if this request was aborted
        if (controller.signal.aborted) return

        const allResults = settled
          .filter((r) => r.status === 'fulfilled')
          .flatMap((r) => r.value)

        setResults(allResults)
      } catch {
        // Aborted or unexpected error — ignore
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }, 280)

    return () => {
      clearTimeout(timer)
    }
  }, [query])

  return { results, loading }
}
