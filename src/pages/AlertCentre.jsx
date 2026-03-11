import { useState, useMemo } from 'react'
import { useToast } from '../components/Toast'
import { useUser } from '../contexts/UserContext'
import { useAlertsData } from '../hooks/useAlertsData'
import { isElevatedRole } from '../utils/taskEngine'
import AlertSummaryCards from '../components/alerts/AlertSummaryCards'
import AlertCard from '../components/alerts/AlertCard'
import AlertDetailPanel from '../components/alerts/AlertDetailPanel'

// ─── Filter constants ───
const STATUS_TABS = ['Active', 'Snoozed', 'Resolved', 'Dismissed']
const SOURCE_FILTERS = [
  { label: 'All Sources', value: 'all' },
  { label: 'SOPs', value: 'sops' },
  { label: 'Induction', value: 'induction' },
  { label: 'Appraisals', value: 'appraisals' },
  { label: 'Staff', value: 'staff' },
  { label: 'MHRA', value: 'mhra' },
  { label: 'Fridge', value: 'fridge' },
  { label: 'Care Homes', value: 'carehomes' },
]
const SORT_OPTIONS = [
  { label: 'Newest', fn: (a, b) => new Date(b.created_at) - new Date(a.created_at) },
  { label: 'Oldest', fn: (a, b) => new Date(a.created_at) - new Date(b.created_at) },
  { label: 'Severity', fn: (a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity] },
  { label: 'Due Date', fn: (a, b) => (a.due_date || '9999') > (b.due_date || '9999') ? 1 : -1 },
]
const SEV_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

// Map source filter value to source_table patterns
const SOURCE_MAP = {
  sops: ['sops', 'sop_acknowledgements'],
  induction: ['induction_modules', 'induction_completions'],
  appraisals: ['appraisals', 'appraisal_goals', 'staff_members'],
  staff: ['documents'],
  mhra: ['mhra_alert_acknowledgements', 'mhra_alert_flags'],
  fridge: ['fridge_temperature_logs'],
  carehomes: ['care_homes', 'medication_cycles', 'care_home_deliveries', 'care_home_mar_issues', 'care_home_handover_notes'],
}

export default function AlertCentre() {
  const showToast = useToast()
  const { user } = useUser()
  const {
    alerts, acksByAlert, loading, refreshing, stats,
    refresh, acknowledge, resolve, snooze, dismiss,
  } = useAlertsData()

  const canManage = isElevatedRole(user?.role)

  // ─── State ───
  const [severityFilter, setSeverityFilter] = useState(null)
  const [statusTab, setStatusTab] = useState('Active')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [sortIdx, setSortIdx] = useState(0)
  const [selectedAlert, setSelectedAlert] = useState(null)

  // ─── Filtered + sorted ───
  const filtered = useMemo(() => {
    const statusMap = {
      Active: 'ACTIVE',
      Snoozed: 'SNOOZED',
      Resolved: 'RESOLVED',
      Dismissed: 'DISMISSED',
    }

    return alerts
      .filter(a => {
        // Status tab
        if (a.status !== statusMap[statusTab]) return false
        // Severity
        if (severityFilter && a.severity !== severityFilter) return false
        // Source
        if (sourceFilter !== 'all') {
          const tables = SOURCE_MAP[sourceFilter] || []
          if (!tables.includes(a.source_table)) return false
        }
        return true
      })
      .sort(SORT_OPTIONS[sortIdx].fn)
  }, [alerts, statusTab, severityFilter, sourceFilter, sortIdx])

  // ─── Handlers ───
  const handleResolve = async (alertId, note) => {
    if (!user?.name) return
    await resolve(alertId, user.name, note)
    showToast('Alert resolved', 'success')
    setSelectedAlert(null)
  }

  const handleSnooze = async (alertId, hours) => {
    await snooze(alertId, hours)
    showToast(`Alert snoozed for ${hours >= 24 ? Math.round(hours / 24) + ' days' : hours + ' hours'}`, 'success')
    setSelectedAlert(null)
  }

  const handleDismiss = async (alertId) => {
    await dismiss(alertId)
    showToast('Alert dismissed', 'success')
    setSelectedAlert(null)
  }

  const handleRefresh = async () => {
    await refresh()
    showToast('Alerts refreshed', 'success')
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 ec-fadeup">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-ec-t1 m-0">Alert Centre</h1>
            {stats.total > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {stats.total} active
              </span>
            )}
          </div>
          <p className="text-sm text-ec-t3 mt-1 mb-0">
            Unified compliance alerts across all systems
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white border-none cursor-pointer hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
        >
          {refreshing ? (
            <span className="inline-flex items-center gap-1.5">
              <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
              </svg>
              Generating...
            </span>
          ) : 'Refresh Alerts'}
        </button>
      </div>

      {/* Summary cards */}
      <AlertSummaryCards
        stats={stats}
        activeSeverity={severityFilter}
        onSeverityClick={(sev) => { setSeverityFilter(sev); setStatusTab('Active') }}
      />

      {/* Status tabs */}
      <div className="flex gap-0 border-b border-ec-border mb-4 overflow-x-auto">
        {STATUS_TABS.map(tab => {
          const active = statusTab === tab
          return (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={`relative px-4 py-2.5 text-xs font-medium whitespace-nowrap border-none cursor-pointer transition-colors bg-transparent
                ${active ? 'text-emerald-600' : 'text-ec-t3 hover:text-ec-t1'}`}
            >
              {tab}
              {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-t-full" />}
            </button>
          )
        })}
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap mb-4">
        <select
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg border border-ec-border bg-ec-card text-xs text-ec-t1 outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
        >
          {SOURCE_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>

        <select
          value={sortIdx}
          onChange={e => setSortIdx(Number(e.target.value))}
          className="px-2.5 py-1.5 rounded-lg border border-ec-border bg-ec-card text-xs text-ec-t1 outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
        >
          {SORT_OPTIONS.map((o, i) => <option key={o.label} value={i}>Sort: {o.label}</option>)}
        </select>

        {(severityFilter || sourceFilter !== 'all') && (
          <button
            onClick={() => { setSeverityFilter(null); setSourceFilter('all') }}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-ec-t3 border border-ec-border cursor-pointer hover:bg-ec-card-hover transition bg-transparent"
          >
            Clear filters
          </button>
        )}

        <span className="ml-auto text-xs text-ec-t3 self-center">
          {filtered.length} alert{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-ec-card border border-ec-border rounded-xl p-4 animate-pulse">
              <div className="flex gap-1.5 mb-2">
                <div className="h-4 w-14 bg-ec-border rounded-full" />
                <div className="h-4 w-16 bg-ec-border rounded-full" />
              </div>
              <div className="h-4 w-3/4 bg-ec-border rounded mb-2" />
              <div className="h-3 w-full bg-ec-border rounded mb-3" />
              <div className="flex gap-2">
                <div className="h-7 w-20 bg-ec-border rounded-lg" />
                <div className="h-7 w-16 bg-ec-border rounded-lg" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 mx-auto text-ec-t4 mb-3">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 12 15 16 10" />
            </svg>
            <div className="text-sm font-medium text-ec-t2 mb-1">
              {statusTab === 'Active' ? 'No active alerts' : `No ${statusTab.toLowerCase()} alerts`}
            </div>
            <div className="text-xs text-ec-t3">
              {statusTab === 'Active' ? 'All compliance areas are up to date' : 'Try changing the filter'}
            </div>
          </div>
        ) : (
          filtered.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onViewDetails={setSelectedAlert}
              onResolve={handleResolve}
              onSnooze={handleSnooze}
              onDismiss={handleDismiss}
            />
          ))
        )}
      </div>

      {/* Detail panel */}
      {selectedAlert && (
        <AlertDetailPanel
          alert={selectedAlert}
          acks={acksByAlert[selectedAlert.id] || []}
          user={user}
          onClose={() => setSelectedAlert(null)}
          onResolve={handleResolve}
          onSnooze={handleSnooze}
          onDismiss={handleDismiss}
        />
      )}
    </div>
  )
}
