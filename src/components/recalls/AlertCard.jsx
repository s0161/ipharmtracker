import { useState } from 'react'
import { CLASS_STYLES, TYPE_STYLES, ACTION_TYPES } from '../../data/recallData'

export default function AlertCard({ alert, acks, flags, isAckedByMe, onViewDetails, onAcknowledge }) {
  const [actionTaken, setActionTaken] = useState('Stock Checked')
  const [note, setNote] = useState('')
  const [showQuickAck, setShowQuickAck] = useState(false)

  const hasAnyAck = acks.length > 0
  const hasActiveFlag = flags.some(f => !f.resolved)

  const handleQuickAck = () => {
    onAcknowledge(alert.id, alert.title, actionTaken, note)
    setShowQuickAck(false)
    setNote('')
  }

  return (
    <div className="bg-ec-card border border-ec-border rounded-xl p-4 relative overflow-hidden group hover:shadow-md transition-shadow">
      {/* Badges row */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CLASS_STYLES[alert.classification] || CLASS_STYLES['N/A']}`}>
          {alert.classification}
        </span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_STYLES[alert.alertType] || TYPE_STYLES['Other']}`}>
          {alert.alertType}
        </span>
        {alert.relevance === 'relevant' && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
            Likely relevant <span className="font-normal opacity-60">(auto)</span>
          </span>
        )}
        {alert.relevance === 'low' && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-500">
            Low relevance <span className="font-normal opacity-60">(auto)</span>
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-ec-t1 m-0 mb-1.5 leading-snug line-clamp-2">
        {alert.title}
      </h3>

      {/* Date */}
      <div className="text-[11px] text-ec-t3 mb-2" title={alert.published ? new Date(alert.published).toLocaleString('en-GB') : ''}>
        {formatRelativeDate(alert.published)}
      </div>

      {/* Summary */}
      <p className="text-xs text-ec-t2 m-0 mb-3 line-clamp-2 leading-relaxed">
        {alert.summary || 'No summary available'}
      </p>

      {/* Status indicators */}
      <div className="flex items-center gap-2 mb-3">
        {hasAnyAck && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Reviewed ({acks.length})
          </span>
        )}
        {hasActiveFlag && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
            </svg>
            Flagged
          </span>
        )}
        {isAckedByMe && (
          <span className="text-[10px] font-medium text-emerald-500 ml-auto">You reviewed</span>
        )}
      </div>

      {/* Quick acknowledge */}
      {showQuickAck ? (
        <div className="space-y-2 mb-2">
          <select
            value={actionTaken}
            onChange={e => setActionTaken(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-ec-border bg-ec-card text-xs text-ec-t1 outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            {ACTION_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Optional note..."
            className="w-full px-2.5 py-1.5 rounded-lg border border-ec-border bg-ec-card text-xs text-ec-t1 placeholder:text-ec-t3 outline-none focus:ring-2 focus:ring-emerald-500/30"
            onKeyDown={e => { if (e.key === 'Enter') handleQuickAck() }}
          />
          <div className="flex gap-2">
            <button onClick={handleQuickAck}
              className="flex-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-600 text-white border-none cursor-pointer hover:bg-emerald-700 transition">
              Submit
            </button>
            <button onClick={() => setShowQuickAck(false)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-transparent text-ec-t3 border border-ec-border cursor-pointer hover:bg-ec-card-hover transition">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button onClick={() => onViewDetails(alert)}
            className="flex-1 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-ec-card text-ec-t2 border border-ec-border cursor-pointer hover:bg-ec-card-hover transition">
            View Details
          </button>
          <button onClick={() => setShowQuickAck(true)}
            className="flex-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-600 text-white border-none cursor-pointer hover:bg-emerald-700 transition">
            Acknowledge
          </button>
        </div>
      )}
    </div>
  )
}

function formatRelativeDate(dateStr) {
  if (!dateStr) return 'Unknown date'
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  const now = new Date()
  const diffMs = now - d
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
