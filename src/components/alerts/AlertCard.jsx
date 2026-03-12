import { useState } from 'react'

// ─── Severity styling ───
const SEV = {
  CRITICAL: { border: 'border-l-red-500', bg: 'bg-ec-crit/5', badge: 'bg-ec-crit/10 text-ec-crit' },
  HIGH: { border: 'border-l-amber-500', bg: 'bg-ec-warn/5', badge: 'bg-ec-warn/10 text-ec-warn' },
  MEDIUM: { border: 'border-l-yellow-400', bg: 'bg-yellow-400/5', badge: 'bg-ec-warn/10 text-ec-warn' },
  LOW: { border: 'border-l-slate-500', bg: 'bg-slate-800/[0.04]', badge: 'bg-ec-bg text-ec-t3' },
}

const STATUS_BADGE = {
  ACTIVE: 'bg-ec-em/10 text-ec-em',
  ACKNOWLEDGED: 'bg-ec-info/10 text-blue-500',
  SNOOZED: 'bg-violet-500/10 text-violet-500',
  RESOLVED: 'bg-ec-bg text-ec-t3',
  DISMISSED: 'bg-ec-bg text-ec-t3',
}

const SOURCE_LABELS = {
  sops: 'SOP Library',
  sop_acknowledgements: 'SOP Library',
  induction_modules: 'Induction',
  induction_completions: 'Induction',
  appraisals: 'Appraisals',
  appraisal_goals: 'Appraisals',
  staff_members: 'Staff',
  documents: 'Renewals',
  mhra_alert_acknowledgements: 'MHRA Recalls',
  mhra_alert_flags: 'MHRA Recalls',
  fridge_temperature_logs: 'Fridge Temp',
}

const SNOOZE_OPTIONS = [
  { label: '24 hours', hours: 24 },
  { label: '3 days', hours: 72 },
  { label: '7 days', hours: 168 },
  { label: '14 days', hours: 336 },
]

export default function AlertCard({ alert, onViewDetails, onResolve, onSnooze, onDismiss }) {
  const [showResolve, setShowResolve] = useState(false)
  const [showSnooze, setShowSnooze] = useState(false)
  const [resolveNote, setResolveNote] = useState('')

  const sev = SEV[alert.severity] || SEV.LOW
  const source = SOURCE_LABELS[alert.source_table] || alert.source_table || 'System'
  const isActive = alert.status === 'ACTIVE'

  // Days overdue calculation
  const daysInfo = (() => {
    if (!alert.due_date) return null
    const diff = Math.floor((new Date() - new Date(alert.due_date)) / 86400000)
    if (diff > 0) return { text: `${diff}d overdue`, cls: 'text-ec-crit' }
    if (diff === 0) return { text: 'Due today', cls: 'text-ec-warn' }
    return { text: `${Math.abs(diff)}d remaining`, cls: 'text-ec-t3' }
  })()

  const handleResolve = () => {
    onResolve(alert.id, resolveNote)
    setShowResolve(false)
    setResolveNote('')
  }

  return (
    <div className={`rounded-xl border border-ec-border border-l-[3px] ${sev.border} ${sev.bg} p-4 transition-shadow hover:shadow-md`}>
      {/* Top badges row */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sev.badge}`}>
          {alert.severity}
        </span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[alert.status] || ''}`}>
          {alert.status}
        </span>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-ec-card text-ec-t3 border border-ec-border">
          {source}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-ec-t1 m-0 mb-1 leading-snug">{alert.title}</h3>

      {/* Description */}
      <p className="text-xs text-ec-t2 m-0 mb-2 leading-relaxed line-clamp-2">{alert.description}</p>

      {/* Meta row */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        {alert.assigned_to && (
          <span className="text-[11px] text-ec-t3">
            <span className="font-medium text-ec-t2">{alert.assigned_to}</span>
          </span>
        )}
        {daysInfo && (
          <span className={`text-[11px] font-medium ${daysInfo.cls}`}>{daysInfo.text}</span>
        )}
        {alert.status === 'SNOOZED' && alert.snoozed_until && (
          <span className="text-[11px] text-violet-500">
            Until {new Date(alert.snoozed_until).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>

      {/* Inline resolve form */}
      {showResolve && (
        <div className="space-y-2 mb-3">
          <textarea
            value={resolveNote}
            onChange={e => setResolveNote(e.target.value)}
            placeholder="Resolution note (optional)..."
            rows={2}
            className="w-full px-2.5 py-1.5 rounded-lg border border-ec-border bg-ec-card text-xs text-ec-t1 placeholder:text-ec-t3 outline-none focus:ring-2 focus:ring-ec-em/30 resize-none"
          />
          <div className="flex gap-2">
            <button onClick={handleResolve}
              className="flex-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-ec-em-dark text-white border-none cursor-pointer hover:bg-ec-em-dark transition">
              Confirm Resolve
            </button>
            <button onClick={() => setShowResolve(false)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-transparent text-ec-t3 border border-ec-border cursor-pointer hover:bg-ec-card-hover transition">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Snooze dropdown */}
      {showSnooze && (
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {SNOOZE_OPTIONS.map(o => (
            <button key={o.hours} onClick={() => { onSnooze(alert.id, o.hours); setShowSnooze(false) }}
              className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-violet-500/10 text-violet-600 border border-violet-400/20 cursor-pointer hover:bg-violet-500/20 transition">
              {o.label}
            </button>
          ))}
          <button onClick={() => setShowSnooze(false)}
            className="px-2.5 py-1 rounded-lg text-[10px] font-medium text-ec-t3 border border-ec-border cursor-pointer hover:bg-ec-card-hover transition bg-transparent">
            Cancel
          </button>
        </div>
      )}

      {/* Actions */}
      {!showResolve && !showSnooze && (
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => onViewDetails(alert)}
            className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-ec-card text-ec-t2 border border-ec-border cursor-pointer hover:bg-ec-card-hover transition">
            View Details
          </button>
          {isActive && (
            <>
              <button onClick={() => setShowResolve(true)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-ec-em-dark text-white border-none cursor-pointer hover:bg-ec-em-dark transition">
                Resolve
              </button>
              <button onClick={() => setShowSnooze(true)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-violet-500/10 text-violet-600 border border-violet-400/20 cursor-pointer hover:bg-violet-500/20 transition">
                Snooze
              </button>
              {alert.severity === 'LOW' && (
                <button onClick={() => onDismiss(alert.id)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-transparent text-ec-t3 border border-ec-border cursor-pointer hover:bg-ec-card-hover transition">
                  Dismiss
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
