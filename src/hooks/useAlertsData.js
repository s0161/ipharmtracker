import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { generateAlerts } from '../utils/alertEngine'

// ═══════════════════════════════════════════════════
// useAlertsData — Unified alert centre data hook
// ═══════════════════════════════════════════════════

export function useAlertsData() {
  const [alerts, setAlerts] = useState([])
  const [acknowledgements, setAcknowledgements] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // ── Fetch alerts from DB ──
  const fetchAlerts = useCallback(async () => {
    const [alertsRes, acksRes] = await Promise.all([
      supabase.from('alerts').select('*').order('created_at', { ascending: false }),
      supabase.from('alert_acknowledgements').select('*'),
    ])
    if (alertsRes.data) setAlerts(alertsRes.data)
    if (acksRes.data) setAcknowledgements(acksRes.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAlerts()

    // Realtime subscription
    const channel = supabase
      .channel('alerts-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => fetchAlerts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alert_acknowledgements' }, () => fetchAlerts())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchAlerts])

  // ── Refresh: re-generate alerts then re-fetch ──
  const refresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await generateAlerts()
      await fetchAlerts()
    } catch (err) {
      console.error('[useAlertsData] Refresh error:', err)
    }
    setRefreshing(false)
  }, [fetchAlerts])

  // ── Acknowledge ──
  const acknowledge = useCallback(async (alertId, staffName, note) => {
    await supabase.from('alert_acknowledgements').insert({
      alert_id: alertId,
      acknowledged_by: staffName,
      acknowledged_at: new Date().toISOString(),
      note: note || null,
    })
    await supabase.from('alerts').update({
      status: 'ACKNOWLEDGED',
      updated_at: new Date().toISOString(),
    }).eq('id', alertId)
  }, [])

  // ── Resolve ──
  const resolve = useCallback(async (alertId, staffName, note) => {
    await supabase.from('alerts').update({
      status: 'RESOLVED',
      resolved_by: staffName,
      resolved_at: new Date().toISOString(),
      resolution_note: note || null,
      updated_at: new Date().toISOString(),
    }).eq('id', alertId)
  }, [])

  // ── Snooze ──
  const snooze = useCallback(async (alertId, hours) => {
    const until = new Date(Date.now() + hours * 3600000).toISOString()
    await supabase.from('alerts').update({
      status: 'SNOOZED',
      snoozed_until: until,
      updated_at: new Date().toISOString(),
    }).eq('id', alertId)
  }, [])

  // ── Dismiss ──
  const dismiss = useCallback(async (alertId) => {
    await supabase.from('alerts').update({
      status: 'DISMISSED',
      updated_at: new Date().toISOString(),
    }).eq('id', alertId)
  }, [])

  // ── Stats ──
  const stats = useMemo(() => {
    const active = alerts.filter(a => a.status === 'ACTIVE')
    return {
      critical: active.filter(a => a.severity === 'CRITICAL').length,
      high: active.filter(a => a.severity === 'HIGH').length,
      medium: active.filter(a => a.severity === 'MEDIUM').length,
      low: active.filter(a => a.severity === 'LOW').length,
      total: active.length,
      snoozed: alerts.filter(a => a.status === 'SNOOZED').length,
      resolved: alerts.filter(a => a.status === 'RESOLVED').length,
    }
  }, [alerts])

  // Map of alert_id -> acknowledgements
  const acksByAlert = useMemo(() => {
    const map = {}
    for (const a of acknowledgements) {
      if (!map[a.alert_id]) map[a.alert_id] = []
      map[a.alert_id].push(a)
    }
    return map
  }, [acknowledgements])

  return {
    alerts,
    acknowledgements,
    acksByAlert,
    loading,
    refreshing,
    stats,
    refresh,
    acknowledge,
    resolve,
    snooze,
    dismiss,
  }
}
