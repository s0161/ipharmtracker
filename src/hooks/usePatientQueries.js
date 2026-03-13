import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { supabase } from '../lib/supabase'

function toCamel(obj) {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    out[k.replace(/_([a-z])/g, (_, ch) => ch.toUpperCase())] = v
  }
  return out
}

function toSnake(obj) {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    out[k.replace(/[A-Z]/g, ch => '_' + ch.toLowerCase())] = v
  }
  return out
}

const TABLE = 'patient_queries'
const PHARMACY_ID = 'FED07'

export function usePatientQueries() {
  const [queries, setQueries] = useState([])
  const [loading, setLoading] = useState(true)
  const channelRef = useRef(null)

  const fetch = useCallback(async () => {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('pharmacy_id', PHARMACY_ID)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[usePatientQueries] Fetch failed:', error.message)
      return
    }
    setQueries((data || []).map(toCamel))
  }, [])

  useEffect(() => {
    fetch().then(() => setLoading(false))

    channelRef.current = supabase
      .channel('patient-queries-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => {
        fetch()
      })
      .subscribe()

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [fetch])

  const insert = useCallback(async (record) => {
    const row = toSnake({ ...record, pharmacyId: PHARMACY_ID })
    const { error } = await supabase.from(TABLE).insert(row)
    if (error) {
      console.error('[usePatientQueries] Insert failed:', error.message)
      throw error
    }
    await fetch()
  }, [fetch])

  const update = useCallback(async (id, changes) => {
    const row = toSnake(changes)
    row.updated_at = new Date().toISOString()
    const { error } = await supabase.from(TABLE).update(row).eq('id', id)
    if (error) {
      console.error('[usePatientQueries] Update failed:', error.message)
      throw error
    }
    await fetch()
  }, [fetch])

  const logContactAttempt = useCallback(async (id, currentCount) => {
    const { error } = await supabase
      .from(TABLE)
      .update({
        contact_attempt_count: (currentCount || 0) + 1,
        contact_attempted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    if (error) {
      console.error('[usePatientQueries] Contact attempt failed:', error.message)
      throw error
    }
    await fetch()
  }, [fetch])

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return {
      urgent: queries.filter(q => (q.priority || '').toLowerCase() === 'urgent' && q.status !== 'resolved' && q.status !== 'cancelled').length,
      open: queries.filter(q => q.status === 'open').length,
      awaiting: queries.filter(q => q.status === 'awaiting_response').length,
      resolvedToday: queries.filter(q => q.status === 'resolved' && q.resolvedAt && q.resolvedAt.startsWith(today)).length,
    }
  }, [queries])

  return { queries, loading, stats, insert, update, logContactAttempt, refresh: fetch }
}
