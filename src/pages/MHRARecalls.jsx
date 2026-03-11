import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useToast } from '../components/Toast'
import { useUser } from '../contexts/UserContext'
import { useRecallsData } from '../hooks/useRecallsData'
import { isElevatedRole } from '../utils/taskEngine'
import { ALERT_TYPES, CLASSIFICATIONS, DATE_RANGES } from '../data/recallData'
import ClassificationBanner from '../components/recalls/ClassificationBanner'
import AcknowledgementSummary from '../components/recalls/AcknowledgementSummary'
import AlertCard from '../components/recalls/AlertCard'
import AlertDetailPanel from '../components/recalls/AlertDetailPanel'

const PAGE_SIZE = 25
const FILTER_TABS = ['All', 'Unreviewed', 'Flagged']

// ─── Loading Skeleton ───
function CardSkeleton() {
  return (
    <div className="bg-ec-card border border-ec-border rounded-xl p-4 animate-pulse">
      <div className="flex gap-1.5 mb-2">
        <div className="h-4 w-14 bg-ec-border rounded-full" />
        <div className="h-4 w-16 bg-ec-border rounded-full" />
      </div>
      <div className="h-4 w-3/4 bg-ec-border rounded mb-2" />
      <div className="h-3 w-24 bg-ec-border rounded mb-2" />
      <div className="h-3 w-full bg-ec-border rounded mb-3" />
      <div className="flex gap-2">
        <div className="flex-1 h-7 bg-ec-border rounded-lg" />
        <div className="flex-1 h-7 bg-ec-border rounded-lg" />
      </div>
    </div>
  )
}

export default function MHRARecalls() {
  const showToast = useToast()
  const { user } = useUser()
  const {
    alerts, acknowledgements, flags, loading, error, lastFetched, stats,
    getAlertAcks, getAlertFlags, isAcknowledgedByUser,
    acknowledgeAlert, flagAlert, resolveFlag, refresh,
  } = useRecallsData()

  // State
  const [search, setSearch] = useState('')
  const [categoryTab, setCategoryTab] = useState('All')
  const [classFilter, setClassFilter] = useState('All')
  const [dateRange, setDateRange] = useState(DATE_RANGES[2]) // 90 days
  const [showFilter, setShowFilter] = useState('All')
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [page, setPage] = useState(0)
  const [showInspection, setShowInspection] = useState(false)

  const canManage = isElevatedRole(user?.role)

  // Filtered + paginated alerts
  // Category counts (for tab badges, computed before other filters)
  const categoryCounts = useMemo(() => {
    const counts = { All: alerts.length }
    for (const a of alerts) {
      counts[a.alertType] = (counts[a.alertType] || 0) + 1
    }
    return counts
  }, [alerts])

  const filtered = useMemo(() => {
    return alerts.filter(a => {
      // Search
      if (search) {
        const q = search.toLowerCase()
        const matches = (a.title || '').toLowerCase().includes(q)
          || (a.summary || '').toLowerCase().includes(q)
        if (!matches) return false
      }
      // Category tab
      if (categoryTab !== 'All' && a.alertType !== categoryTab) return false
      // Classification filter
      if (classFilter !== 'All' && a.classification !== classFilter) return false
      // Date range
      if (dateRange.days !== null) {
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - dateRange.days)
        if (new Date(a.published) < cutoff) return false
      }
      // Show filter
      if (showFilter === 'Unreviewed') {
        const hasAck = acknowledgements.some(ack => ack.alertId === a.id)
        if (hasAck) return false
      }
      if (showFilter === 'Flagged') {
        const hasFlag = flags.some(f => f.alertId === a.id && !f.resolved)
        if (!hasFlag) return false
      }
      return true
    })
  }, [alerts, search, categoryTab, classFilter, dateRange, showFilter, acknowledgements, flags])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // Reset page when filters change
  const handleFilterChange = (setter) => (val) => {
    setter(val)
    setPage(0)
  }

  // Handlers
  const handleAcknowledge = async (alertId, alertTitle, actionTaken, notes) => {
    if (!user?.name) {
      showToast('Please log in to acknowledge alerts', 'error')
      return
    }
    await acknowledgeAlert(alertId, alertTitle, user.name, actionTaken, notes)
    showToast('Alert acknowledged', 'success')
  }

  const handleFlag = async (alertId, alertTitle, reason) => {
    if (!user?.name) {
      showToast('Please log in to flag alerts', 'error')
      return
    }
    await flagAlert(alertId, alertTitle, user.name, reason)
    showToast('Alert flagged for attention', 'success')
  }

  const handleResolveFlag = async (flagId) => {
    if (!user?.name) return
    await resolveFlag(flagId, user.name)
    showToast('Flag resolved', 'success')
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 ec-fadeup">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-ec-t1 m-0">MHRA Recalls</h1>
          </div>
          <p className="text-sm text-ec-t3 mt-1 mb-0">
            Drug &amp; device alerts from GOV.UK — acknowledge, flag &amp; track compliance
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastFetched && (
            <span className="text-[10px] text-ec-t3">
              Updated {lastFetched.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={refresh}
            className="px-3 py-2 rounded-lg text-xs font-medium bg-ec-card text-ec-t2 border border-ec-border cursor-pointer hover:bg-ec-card-hover transition"
            title="Refresh alerts"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            Refresh
          </button>
          {canManage && (
            <button
              onClick={() => setShowInspection(true)}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white border-none cursor-pointer hover:bg-emerald-700 transition shadow-sm"
            >
              Inspection Report
            </button>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-ec-crit/30 bg-ec-crit/10 mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-ec-crit shrink-0">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="text-sm text-ec-crit">{error}</span>
          <button onClick={refresh} className="ml-auto px-3 py-1 rounded-lg text-xs font-medium bg-ec-crit text-white border-none cursor-pointer hover:bg-ec-crit/90 transition">
            Retry
          </button>
        </div>
      )}

      {/* Classification banner */}
      <ClassificationBanner
        alerts={filtered}
        onFilterClass1={() => { handleFilterChange(setClassFilter)('Class 1') }}
      />

      {/* Stat cards */}
      <AcknowledgementSummary stats={stats} />

      {/* Category tabs */}
      <div className="flex gap-0 border-b border-ec-border mb-4 overflow-x-auto">
        {['All', ...ALERT_TYPES].map(tab => {
          const active = categoryTab === tab
          const count = categoryCounts[tab] || 0
          return (
            <button
              key={tab}
              onClick={() => { setCategoryTab(tab); setPage(0) }}
              className={`relative px-4 py-2.5 text-xs font-medium whitespace-nowrap border-none cursor-pointer transition-colors bg-transparent
                ${active
                  ? 'text-ec-em'
                  : 'text-ec-t3 hover:text-ec-t1'
                }`}
            >
              {tab}
              <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-emerald-500/10 text-ec-em' : 'bg-ec-border text-ec-t3'}`}>
                {count}
              </span>
              {active && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-t-full" />
              )}
            </button>
          )
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-3">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ec-t3">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search alerts..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-ec-border bg-ec-card text-sm text-ec-t1 placeholder:text-ec-t3 outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
          />
        </div>

        {/* Show filter tabs */}
        <div className="flex gap-1 flex-wrap">
          {FILTER_TABS.map(tab => (
            <button key={tab} onClick={() => handleFilterChange(setShowFilter)(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border-none cursor-pointer transition-all
                ${showFilter === tab
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-ec-card text-ec-t2 hover:bg-ec-card-hover border border-ec-border'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Filters row */}
      <div className="flex gap-2 flex-wrap mb-4">
        {/* Class filter */}
        <select
          value={classFilter}
          onChange={e => handleFilterChange(setClassFilter)(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg border border-ec-border bg-ec-card text-xs text-ec-t1 outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
        >
          <option value="All">All Classes</option>
          {CLASSIFICATIONS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Date range */}
        <select
          value={dateRange.label}
          onChange={e => handleFilterChange(setDateRange)(DATE_RANGES.find(d => d.label === e.target.value) || DATE_RANGES[2])}
          className="px-2.5 py-1.5 rounded-lg border border-ec-border bg-ec-card text-xs text-ec-t1 outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
        >
          {DATE_RANGES.map(d => <option key={d.label} value={d.label}>{d.label}</option>)}
        </select>

        {/* Reset */}
        {(categoryTab !== 'All' || classFilter !== 'All' || dateRange.label !== 'Last 90 days' || search || showFilter !== 'All') && (
          <button
            onClick={() => {
              setCategoryTab('All'); setClassFilter('All'); setDateRange(DATE_RANGES[2])
              setSearch(''); setShowFilter('All'); setPage(0)
            }}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-ec-t3 border border-ec-border cursor-pointer hover:bg-ec-card-hover transition bg-transparent"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Alert Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
        ) : paginated.length === 0 ? (
          <div className="col-span-full text-center py-12 text-ec-t3 text-sm">
            {error ? 'Unable to load alerts' : 'No alerts match your filters'}
          </div>
        ) : (
          paginated.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              acks={getAlertAcks(alert.id)}
              flags={getAlertFlags(alert.id)}
              isAckedByMe={isAcknowledgedByUser(alert.id, user?.name)}
              onViewDetails={setSelectedAlert}
              onAcknowledge={handleAcknowledge}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-ec-card text-ec-t2 border border-ec-border cursor-pointer hover:bg-ec-card-hover transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-xs text-ec-t3 tabular-nums">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-ec-card text-ec-t2 border border-ec-border cursor-pointer hover:bg-ec-card-hover transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 px-1 text-xs text-ec-t3">
        <span>Showing {paginated.length} of {filtered.length} alerts</span>
      </div>

      {/* Alert Detail Panel */}
      {selectedAlert && (
        <AlertDetailPanel
          alert={selectedAlert}
          acks={getAlertAcks(selectedAlert.id)}
          flags={getAlertFlags(selectedAlert.id)}
          user={user}
          onClose={() => setSelectedAlert(null)}
          onAcknowledge={handleAcknowledge}
          onFlag={handleFlag}
          onResolveFlag={handleResolveFlag}
        />
      )}

      {/* Inspection Report Modal */}
      {showInspection && canManage && (
        <InspectionReport
          alerts={alerts}
          acknowledgements={acknowledgements}
          flags={flags}
          dateRange={dateRange}
          onClose={() => setShowInspection(false)}
        />
      )}
    </div>
  )
}

// ─── Inspection Report (print-ready modal) ───
function InspectionReport({ alerts, acknowledgements, flags, dateRange, onClose }) {
  const class1Alerts = alerts.filter(a => a.classification === 'Class 1')
  const ackAlertIds = new Set(acknowledgements.map(a => a.alertId))
  const unresolvedFlags = flags.filter(f => !f.resolved)

  return createPortalReport(
    <div className="fixed inset-0 z-50 flex items-center justify-center inspection-backdrop" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-ec-card rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col mx-4 inspection-panel">
        {/* Header */}
        <div className="px-6 py-4 border-b border-ec-border shrink-0 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-ec-t1 m-0">MHRA Recalls — Inspection Report</h2>
            <p className="text-xs text-ec-t3 m-0 mt-1">iPharmacy Direct | Generated {new Date().toLocaleDateString('en-GB')}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.print()}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white border-none cursor-pointer hover:bg-emerald-700 transition inspection-print-btn">
              Print Report
            </button>
            <button onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-ec-t3 hover:text-ec-t1 hover:bg-ec-card-hover transition border-none cursor-pointer bg-transparent inspection-close-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 inspection-content">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-ec-card-hover rounded-xl p-3 text-center">
              <div className="text-[10px] font-bold text-ec-t3 uppercase tracking-wider">Date Range</div>
              <div className="text-sm font-bold text-ec-t1 mt-1">{dateRange.label}</div>
            </div>
            <div className="bg-ec-card-hover rounded-xl p-3 text-center">
              <div className="text-[10px] font-bold text-ec-t3 uppercase tracking-wider">Total Alerts</div>
              <div className="text-sm font-bold text-ec-t1 mt-1">{alerts.length}</div>
            </div>
            <div className="bg-ec-card-hover rounded-xl p-3 text-center">
              <div className="text-[10px] font-bold text-ec-t3 uppercase tracking-wider">Reviewed</div>
              <div className="text-sm font-bold text-ec-t1 mt-1">
                {ackAlertIds.size} / {alerts.length}
                <span className="text-ec-t3 font-normal ml-1">
                  ({alerts.length > 0 ? Math.round((ackAlertIds.size / alerts.length) * 100) : 0}%)
                </span>
              </div>
            </div>
          </div>

          {/* Class 1 alerts */}
          {class1Alerts.length > 0 && (
            <section>
              <h3 className="text-[11px] font-bold text-ec-crit uppercase tracking-widest mb-2">Class 1 Alerts ({class1Alerts.length})</h3>
              <div className="overflow-hidden rounded-xl border border-ec-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-ec-card-hover">
                      <th className="text-left text-[10px] font-bold text-ec-t3 uppercase tracking-wider px-3 py-2">Alert</th>
                      <th className="text-left text-[10px] font-bold text-ec-t3 uppercase tracking-wider px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {class1Alerts.map(a => (
                      <tr key={a.id} className="border-t border-ec-border">
                        <td className="px-3 py-2 text-ec-t1 text-xs">{a.title}</td>
                        <td className="px-3 py-2 text-xs">
                          {ackAlertIds.has(a.id)
                            ? <span className="text-ec-em font-semibold">Reviewed</span>
                            : <span className="text-ec-crit font-semibold">Pending</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Unresolved flags */}
          {unresolvedFlags.length > 0 && (
            <section>
              <h3 className="text-[11px] font-bold text-ec-warn uppercase tracking-widest mb-2">Unresolved Flags ({unresolvedFlags.length})</h3>
              <div className="space-y-1">
                {unresolvedFlags.map(f => (
                  <div key={f.id} className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-ec-warn/5 text-xs">
                    <span className="font-medium text-ec-t1">{f.alertTitle}</span>
                    <span className="text-ec-t3 ml-auto">by {f.flaggedBy}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Full ack log */}
          <section>
            <h3 className="text-[11px] font-bold text-ec-t3 uppercase tracking-widest mb-2">Acknowledgement Log</h3>
            {acknowledgements.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-ec-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-ec-card-hover">
                      <th className="text-left text-[10px] font-bold text-ec-t3 uppercase tracking-wider px-3 py-2">Alert</th>
                      <th className="text-left text-[10px] font-bold text-ec-t3 uppercase tracking-wider px-3 py-2">By</th>
                      <th className="text-left text-[10px] font-bold text-ec-t3 uppercase tracking-wider px-3 py-2">Date</th>
                      <th className="text-left text-[10px] font-bold text-ec-t3 uppercase tracking-wider px-3 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {acknowledgements.map(a => (
                      <tr key={a.id} className="border-t border-ec-border">
                        <td className="px-3 py-2 text-ec-t1 text-xs max-w-[200px] truncate">{a.alertTitle}</td>
                        <td className="px-3 py-2 text-ec-t2 text-xs whitespace-nowrap">{a.acknowledgedBy}</td>
                        <td className="px-3 py-2 text-ec-t3 text-xs whitespace-nowrap">
                          {a.acknowledgedAt ? new Date(a.acknowledgedAt).toLocaleDateString('en-GB') : '—'}
                        </td>
                        <td className="px-3 py-2 text-ec-t2 text-xs">{a.actionTaken || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-ec-t3">No acknowledgements recorded yet.</p>
            )}
          </section>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .inspection-panel, .inspection-panel * { visibility: visible; }
          .inspection-panel {
            position: fixed; left: 0; top: 0;
            width: 100% !important; max-width: 100% !important;
            max-height: none !important; height: auto !important;
            box-shadow: none !important; border-radius: 0 !important;
          }
          .inspection-backdrop { background: transparent !important; position: static !important; }
          .inspection-close-btn, .inspection-print-btn { display: none !important; }
          .inspection-content { overflow: visible !important; }
        }
      `}</style>
    </div>
  )
}

function createPortalReport(element) {
  return createPortal(element, document.body)
}
