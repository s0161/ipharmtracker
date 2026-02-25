import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

const TABLES = {
  documents: { fields: ['documentName', 'category', 'owner'], label: 'Documents', route: '/documents' },
  staff_members: { fields: ['name'], label: 'Staff', route: '/settings' },
  cleaning_entries: { fields: ['taskName', 'staffMember'], label: 'Cleaning', route: '/cleaning' },
  training_logs: { fields: ['staffName', 'topic', 'trainerName'], label: 'Training', route: '/training' },
  staff_training: { fields: ['staffName', 'trainingItem', 'role'], label: 'Staff Training', route: '/staff-training' },
}

export function useGlobalSearch() {
  const [cache, setCache] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const fetchedRef = useRef(false)

  const fetchAll = useCallback(async () => {
    if (fetchedRef.current) return
    fetchedRef.current = true
    setLoading(true)
    const data = {}
    for (const [table, config] of Object.entries(TABLES)) {
      const { data: rows } = await supabase.from(table).select('*')
      data[table] = (rows || []).map(row => ({
        ...row,
        _table: table,
        _label: config.label,
        _route: config.route,
        _searchText: config.fields.map(f => row[f] || '').join(' ').toLowerCase(),
      }))
    }
    setCache(data)
    setLoading(false)
  }, [])

  const search = useCallback((query) => {
    if (!cache || !query.trim()) {
      setResults([])
      return
    }
    const q = query.toLowerCase().trim()
    const matches = []
    for (const rows of Object.values(cache)) {
      for (const row of rows) {
        if (row._searchText.includes(q)) {
          matches.push(row)
        }
      }
    }
    setResults(matches.slice(0, 20))
  }, [cache])

  return { results, search, fetchAll, loading, cache }
}
