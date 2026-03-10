import { useState, useEffect, useCallback, useMemo } from 'react'
import { XMLParser } from 'fast-xml-parser'
import { supabase } from '../lib/supabase'
import { useSupabase } from './useSupabase'
import { getRelevanceTag } from '../data/recallData'

const ATOM_URL = 'https://www.gov.uk/drug-device-alerts.atom'
const SEARCH_URL =
  'https://www.gov.uk/api/search.json?filter_organisations=medicines-and-healthcare-products-regulatory-agency&count=50&start=0'

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
})

// ── Classify alert from title (Arabic numerals: "Class 2 Medicines Recall") ──
function classifyAlert(title) {
  const t = (title || '').toLowerCase()
  if (t.includes('class 1')) return 'Class 1'
  if (t.includes('class 2')) return 'Class 2'
  if (t.includes('class 3')) return 'Class 3'
  if (t.includes('class 4')) return 'Class 4'
  return 'N/A'
}

// ── Detect category from title text ──
function detectAlertType(title) {
  const t = (title || '').toLowerCase()
  if (t.includes('medicines recall') || t.includes('medicines defect') || /class [1-4]/.test(t))
    return 'Medicine Recalls'
  if (t.includes('field safety notice') || t.includes('device safety'))
    return 'Device Alerts'
  if (t.includes('safety roundup') || t.includes('safety update'))
    return 'Drug Safety Updates'
  return 'News'
}

// ── Detect category from search API format field + title, returns null for noise ──
const NOISE_FORMATS = new Set([
  'finder', 'organisation', 'corporate_report', 'guidance',
  'detailed_guide', 'html_publication', 'document_collection',
])

function detectAlertTypeFromFormat(format, title) {
  if (NOISE_FORMATS.has(format)) return null
  if (format === 'drug_safety_update') return 'Drug Safety Updates'
  if (format === 'medical_safety_alert') return detectAlertType(title)
  if (format === 'press_release' || format === 'news_story') return 'News'
  return detectAlertType(title)
}

// ── Parse GOV.UK Atom feed entries ──
function parseAtomEntries(xml) {
  try {
    const parsed = xmlParser.parse(xml)
    const entries = parsed?.feed?.entry
    if (!entries) return []
    const list = Array.isArray(entries) ? entries : [entries]

    return list.map((e) => {
      const title = e.title || ''
      const url =
        (Array.isArray(e.link) ? e.link[0]?.['@_href'] : e.link?.['@_href']) || ''
      const fullUrl = url.startsWith('http') ? url : `https://www.gov.uk${url}`
      return {
        id: fullUrl,
        title,
        published: e.published || e.updated || '',
        updated: e.updated || '',
        summary: (e.summary || e.content || '').replace(/<[^>]+>/g, '').trim(),
        url: fullUrl,
        alertType: detectAlertType(title),
        classification: classifyAlert(title),
        relevance: getRelevanceTag(title, e.summary || ''),
      }
    })
  } catch {
    return []
  }
}

// ── Parse GOV.UK search API results (filters noise formats) ──
function parseSearchResults(json) {
  try {
    const results = json?.results || []
    const mapped = []
    for (const r of results) {
      const title = r.title || ''
      const alertType = detectAlertTypeFromFormat(r.format, title)
      if (alertType === null) continue // skip noise (finder, org pages, etc.)
      const url = r.link ? `https://www.gov.uk${r.link}` : ''
      mapped.push({
        id: url,
        title,
        published: r.public_timestamp || '',
        updated: r.public_timestamp || '',
        summary: (r.description || '').trim(),
        url,
        alertType,
        classification: classifyAlert(title),
        relevance: getRelevanceTag(title, r.description || ''),
      })
    }
    return mapped
  } catch {
    return []
  }
}

// ── Deduplicate by URL ──
function deduplicateAlerts(alerts) {
  const seen = new Map()
  for (const a of alerts) {
    if (a.url && !seen.has(a.url)) seen.set(a.url, a)
  }
  return [...seen.values()].sort(
    (a, b) => new Date(b.published) - new Date(a.published)
  )
}

// ═══════════════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════════════
export function useRecallsData() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastFetched, setLastFetched] = useState(null)

  // DB state via useSupabase (reactive)
  const [acknowledgements, setAcknowledgements, acksLoading] = useSupabase(
    'mhra_alert_acknowledgements',
    []
  )
  const [flags, setFlags, flagsLoading] = useSupabase('mhra_alert_flags', [])

  // ── Fetch alerts from GOV.UK ──
  const fetchAlerts = useCallback(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const atomFetch = fetch(ATOM_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`Atom feed: ${r.status}`)
        return r.text()
      })
      .then(parseAtomEntries)
      .catch((e) => {
        console.warn('[useRecallsData] Atom feed error:', e.message)
        return []
      })

    const searchFetch = fetch(SEARCH_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`Search API: ${r.status}`)
        return r.json()
      })
      .then(parseSearchResults)
      .catch((e) => {
        console.warn('[useRecallsData] Search API error:', e.message)
        return []
      })

    Promise.all([atomFetch, searchFetch])
      .then(([atomAlerts, searchAlerts]) => {
        if (cancelled) return
        const combined = deduplicateAlerts([...atomAlerts, ...searchAlerts])
        if (combined.length === 0 && atomAlerts.length === 0 && searchAlerts.length === 0) {
          setError('Unable to fetch alerts from GOV.UK — check your connection and try again.')
        }
        setAlerts(combined)
        setLastFetched(new Date())
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setError('Unable to fetch MHRA alerts. Please try again later.')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const cleanup = fetchAlerts()
    return cleanup
  }, [fetchAlerts])

  // ── Helpers: look up acks/flags for a specific alert ──
  const getAlertAcks = useCallback(
    (alertId) => acknowledgements.filter((a) => a.alertId === alertId),
    [acknowledgements]
  )

  const getAlertFlags = useCallback(
    (alertId) => flags.filter((f) => f.alertId === alertId),
    [flags]
  )

  const isAcknowledgedByUser = useCallback(
    (alertId, staffName) =>
      acknowledgements.some((a) => a.alertId === alertId && a.acknowledgedBy === staffName),
    [acknowledgements]
  )

  // ── Mutations ──
  const acknowledgeAlert = useCallback(
    async (alertId, alertTitle, staffName, actionTaken, notes) => {
      const row = {
        alert_id: alertId,
        alert_title: alertTitle,
        acknowledged_by: staffName,
        action_taken: actionTaken,
        notes: notes || null,
      }
      const { error: err } = await supabase
        .from('mhra_alert_acknowledgements')
        .upsert(row, { onConflict: 'alert_id,acknowledged_by' })
      if (err) console.error('[useRecallsData] Acknowledge error:', err.message)
    },
    []
  )

  const flagAlert = useCallback(
    async (alertId, alertTitle, staffName, reason) => {
      const row = {
        alert_id: alertId,
        alert_title: alertTitle,
        flagged_by: staffName,
        reason: reason || null,
      }
      const { error: err } = await supabase.from('mhra_alert_flags').insert(row)
      if (err) console.error('[useRecallsData] Flag error:', err.message)
    },
    []
  )

  const resolveFlag = useCallback(async (flagId, staffName) => {
    const { error: err } = await supabase
      .from('mhra_alert_flags')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: staffName,
      })
      .eq('id', flagId)
    if (err) console.error('[useRecallsData] Resolve flag error:', err.message)
  }, [])

  // ── Aggregate stats (memoised) ──
  const stats = useMemo(() => {
    const total = alerts.length
    const reviewed = new Set(acknowledgements.map((a) => a.alertId)).size
    const flagged = flags.filter((f) => !f.resolved).length
    const class1 = alerts.filter((a) => a.classification === 'Class 1').length
    return { total, reviewed, unreviewed: total - reviewed, flagged, class1 }
  }, [alerts, acknowledgements, flags])

  return {
    alerts,
    acknowledgements,
    flags,
    loading: loading || acksLoading || flagsLoading,
    error,
    lastFetched,
    stats,
    getAlertAcks,
    getAlertFlags,
    isAcknowledgedByUser,
    acknowledgeAlert,
    flagAlert,
    resolveFlag,
    refresh: fetchAlerts,
  }
}
