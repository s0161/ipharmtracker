import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'

const SEV_BADGE = {
  CRITICAL: 'bg-ec-crit/10 text-ec-crit',
  HIGH: 'bg-ec-warn/10 text-ec-warn',
  MEDIUM: 'bg-ec-warn/10 text-ec-warn',
  LOW: 'bg-ec-bg text-ec-t3',
}

const STATUS_BADGE = {
  ACTIVE: 'bg-ec-em/10 text-ec-em',
  ACKNOWLEDGED: 'bg-ec-info/10 text-blue-500',
  SNOOZED: 'bg-violet-500/10 text-violet-500',
  RESOLVED: 'bg-ec-bg text-ec-t3',
  DISMISSED: 'bg-ec-bg text-ec-t3',
}

// Map source_table to route
const SOURCE_ROUTES = {
  sops: '/sop-library',
  sop_acknowledgements: '/sop-library',
  induction_modules: '/induction',
  induction_completions: '/induction',
  appraisals: '/appraisals',
  appraisal_goals: '/appraisals',
  staff_members: '/staff-directory',
  documents: '/documents',
  mhra_alert_acknowledgements: '/mhra-recalls',
  mhra_alert_flags: '/mhra-recalls',
  fridge_temperature_logs: '/temperature',
}

const SNOOZE_OPTIONS = [
  { label: '24 hours', hours: 24 },
  { label: '3 days', hours: 72 },
  { label: '7 days', hours: 168 },
  { label: '14 days', hours: 336 },
]

export default function AlertDetailPanel({ alert, acks, user, onClose, onResolve, onSnooze, onDismiss }) {
  const backdropRef = useRef()
  const navigate = useNavigate()
  const [resolveNote, setResolveNote] = useState('')
  const [showResolve, setShowResolve] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  if (!alert) return null
  const isActive = alert.status === 'ACTIVE'

  const handleResolve = () => {
    onResolve(alert.id, resolveNote)
    setResolveNote('')
    setShowResolve(false)
  }

  const handleViewSource = () => {
    const route = SOURCE_ROUTES[alert.source_table]
    if (route) {
      onClose()
      navigate(route)
    }
  }

  return createPortal(
    <div
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose() }}
      className="fixed inset-0 z-50 flex justify-end"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-2xl h-full flex flex-col"
        style={{
          backgroundColor: 'var(--ec-card-solid, #fff)',
          borderLeft: '1px solid var(--ec-border, #d1fae5)',
          boxShadow: '-8px 0 30px rgba(0,0,0,0.15)',
          animation: 'slideInRight 0.25s ease-out',
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b shrink-0" style={{ borderColor: 'var(--ec-border)' }}>
          <div className="flex items-center gap-3">
            <button onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-ec-t3 hover:text-ec-t1 hover:bg-ec-card-hover transition-colors border-none cursor-pointer bg-transparent"
              aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SEV_BADGE[alert.severity]}`}>
                  {alert.severity}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[alert.status]}`}>
                  {alert.status}
                </span>
              </div>
              <h2 className="text-base font-bold text-ec-t1 m-0 leading-snug">{alert.title}</h2>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Details */}
          <section>
            <SectionLabel>Alert Details</SectionLabel>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <MetaCard label="Type" value={alert.alert_type?.replace(/_/g, ' ')} />
              <MetaCard label="Source" value={alert.source_table?.replace(/_/g, ' ') || '—'} />
              {alert.assigned_to && <MetaCard label="Assigned To" value={alert.assigned_to} />}
              {alert.due_date && <MetaCard label="Due Date" value={fmtDate(alert.due_date)} />}
              <MetaCard label="Created" value={fmtDate(alert.created_at)} />
              {alert.snoozed_until && <MetaCard label="Snoozed Until" value={fmtDate(alert.snoozed_until)} />}
            </div>
            <div className="p-3 rounded-xl border border-ec-border bg-ec-bg">
              <p className="text-sm text-ec-t1 leading-relaxed m-0">{alert.description || 'No description'}</p>
            </div>
          </section>

          <hr className="border-ec-border m-0" />

          {/* Timeline */}
          <section>
            <SectionLabel>Timeline</SectionLabel>
            <div className="space-y-2">
              <TimelineItem date={alert.created_at} text="Alert generated" icon="create" />
              {(acks || []).map(a => (
                <TimelineItem key={a.id} date={a.acknowledged_at} text={`Acknowledged by ${a.acknowledged_by}${a.note ? ` — ${a.note}` : ''}`} icon="ack" />
              ))}
              {alert.resolved_at && (
                <TimelineItem date={alert.resolved_at} text={`Resolved by ${alert.resolved_by || 'System'}${alert.resolution_note ? ` — ${alert.resolution_note}` : ''}`} icon="resolve" />
              )}
            </div>
          </section>

          <hr className="border-ec-border m-0" />

          {/* Resolution form */}
          {isActive && (
            <section>
              <SectionLabel>Actions</SectionLabel>
              {showResolve ? (
                <div className="space-y-2">
                  <textarea
                    value={resolveNote}
                    onChange={e => setResolveNote(e.target.value)}
                    placeholder="Resolution note..."
                    rows={3}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-ec-border bg-ec-card text-xs text-ec-t1 placeholder:text-ec-t3 outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleResolve}
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white border-none cursor-pointer hover:bg-emerald-700 transition">
                      Confirm Resolve
                    </button>
                    <button onClick={() => setShowResolve(false)}
                      className="px-4 py-2 rounded-lg text-xs font-medium bg-transparent text-ec-t3 border border-ec-border cursor-pointer hover:bg-ec-card-hover transition">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setShowResolve(true)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white border-none cursor-pointer hover:bg-emerald-700 transition">
                    Resolve
                  </button>
                  {SNOOZE_OPTIONS.map(o => (
                    <button key={o.hours} onClick={() => onSnooze(alert.id, o.hours)}
                      className="px-3 py-2 rounded-lg text-[11px] font-medium bg-violet-500/10 text-violet-600 border border-violet-400/20 cursor-pointer hover:bg-violet-500/20 transition">
                      Snooze {o.label}
                    </button>
                  ))}
                  {alert.severity === 'LOW' && (
                    <button onClick={() => onDismiss(alert.id)}
                      className="px-3 py-2 rounded-lg text-[11px] font-medium bg-transparent text-ec-t3 border border-ec-border cursor-pointer hover:bg-ec-card-hover transition">
                      Dismiss
                    </button>
                  )}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t shrink-0" style={{ borderColor: 'var(--ec-border)' }}>
          {alert.source_table && (
            <button onClick={handleViewSource}
              className="px-4 py-2.5 rounded-xl text-sm font-medium bg-transparent text-ec-em border border-ec-border cursor-pointer hover:bg-ec-card-hover transition inline-flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              View Source
            </button>
          )}
          <div className="flex-1" />
          <button onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium bg-transparent text-ec-t2 border border-ec-border cursor-pointer hover:bg-ec-card-hover transition">
            Close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0.8; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>,
    document.body
  )
}

// ─── Helpers ───
function SectionLabel({ children }) {
  return <h3 className="text-[11px] font-bold text-ec-t3 uppercase tracking-widest mb-2">{children}</h3>
}

function MetaCard({ label, value }) {
  return (
    <div className="bg-ec-card-hover rounded-xl p-3">
      <div className="text-[10px] font-bold text-ec-t3 uppercase tracking-wider">{label}</div>
      <div className="text-sm font-semibold text-ec-t1 mt-0.5 capitalize">{value}</div>
    </div>
  )
}

function TimelineItem({ date, text, icon }) {
  const colors = { create: 'bg-ec-info', ack: 'bg-ec-em', resolve: 'bg-ec-t3' }
  return (
    <div className="flex gap-3 items-start">
      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${colors[icon] || 'bg-ec-t3'}`} />
      <div className="min-w-0">
        <div className="text-xs text-ec-t1">{text}</div>
        <div className="text-[10px] text-ec-t3">{fmtDate(date)}</div>
      </div>
    </div>
  )
}

function fmtDate(d) {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt)) return d
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
