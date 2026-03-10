import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useSupabase } from './useSupabase'

function toCamelKey(str) {
  return str.replace(/_([a-z])/g, (_, ch) => ch.toUpperCase())
}

function toCamel(obj) {
  const out = {}
  for (const [k, v] of Object.entries(obj)) out[toCamelKey(k)] = v
  return out
}

export function useSOPData(user) {
  const [sops, , sopsLoading] = useSupabase('sops', [])
  const [staffMembers, , staffLoading] = useSupabase('staff_members', [], { valueField: 'name' })
  const [acks, setAcks] = useState([])
  const [acksLoading, setAcksLoading] = useState(true)

  // Fetch acknowledgements
  useEffect(() => {
    supabase.from('sop_acknowledgements').select('*')
      .then(({ data, error }) => {
        if (!error && data) setAcks(data.map(toCamel))
        setAcksLoading(false)
      })
      .catch(() => setAcksLoading(false))

    const channel = supabase
      .channel('sop-acks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sop_acknowledgements' }, () => {
        supabase.from('sop_acknowledgements').select('*')
          .then(({ data, error }) => {
            if (!error && data) setAcks(data.map(toCamel))
          })
          .catch(() => {})
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  // Derived: acks grouped by SOP id
  const acksBySopId = useMemo(() => {
    const map = {}
    acks.forEach(a => {
      if (!map[a.sopId]) map[a.sopId] = []
      map[a.sopId].push({ acknowledgedBy: a.acknowledgedBy, acknowledgedAt: a.acknowledgedAt })
    })
    return map
  }, [acks])

  // Derived: set of SOP ids the current user has acknowledged
  const myAckedIds = useMemo(() => {
    if (!user?.name) return new Set()
    return new Set(acks.filter(a => a.acknowledgedBy === user.name).map(a => a.sopId))
  }, [acks, user?.name])

  // Sorted staff names
  const staffNames = useMemo(() => [...staffMembers].sort(), [staffMembers])

  // Acknowledge action with optimistic update
  const acknowledge = useCallback(async (sopId) => {
    if (!user?.name) return

    const optimistic = {
      id: crypto.randomUUID(),
      sopId,
      acknowledgedBy: user.name,
      acknowledgedAt: new Date().toISOString(),
    }
    setAcks(prev => [...prev, optimistic])

    const { error } = await supabase.from('sop_acknowledgements').insert({
      sop_id: sopId,
      acknowledged_by: user.name,
    })

    if (error) {
      console.error('[useSOPData] Acknowledge failed:', error.message)
      setAcks(prev => prev.filter(a => a.id !== optimistic.id))
      throw error
    }
  }, [user?.name])

  return {
    sops,
    staffMembers,
    acksBySopId,
    myAckedIds,
    staffNames,
    loading: sopsLoading || staffLoading || acksLoading,
    acknowledge,
  }
}
