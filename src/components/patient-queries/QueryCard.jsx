import Avatar from '../Avatar'

const PRIORITY_BORDER = {
  urgent: '3px solid #ef4444',
  high:   '3px solid #f59e0b',
  normal: '3px solid #0073e6',
  low:    '3px solid #8898aa',
}

const PRIORITY_BADGE = {
  urgent: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'URGENT' },
  high:   { bg: '#fffbeb', color: '#d97706', border: '#fde68a', label: 'HIGH' },
  normal: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', label: 'NORMAL' },
  low:    { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0', label: 'LOW' },
}

const TYPE_BADGE = {
  owing:          { emoji: '💊', label: 'Owing', bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  callback:       { emoji: '📞', label: 'Callback', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  gp_query:       { emoji: '🏥', label: 'GP Query', bg: '#faf5ff', color: '#7c3aed', border: '#ddd6fe' },
  hospital_query: { emoji: '🏨', label: 'Hospital', bg: '#eef2ff', color: '#4338ca', border: '#c7d2fe' },
  patient_query:  { emoji: '👤', label: 'Patient', bg: '#f0fdfa', color: '#0d9488', border: '#99f6e4' },
  other:          { emoji: '📋', label: 'Other', bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' },
}

const STATUS_BADGE = {
  open:               { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', label: 'Open' },
  in_progress:        { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'In Progress' },
  awaiting_response:  { color: '#7c3aed', bg: '#faf5ff', border: '#ddd6fe', label: 'Awaiting Response' },
  resolved:           { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', label: 'Resolved' },
  cancelled:          { color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', label: 'Cancelled' },
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function formatDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'))
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function QueryCard({ query, onClick, staffMap }) {
  const pri = (query.priority || 'normal').toLowerCase()
  const priStyle = PRIORITY_BADGE[pri] || PRIORITY_BADGE.normal
  const typeStyle = TYPE_BADGE[query.queryType] || TYPE_BADGE.other
  const statusStyle = STATUS_BADGE[query.status] || STATUS_BADGE.open
  const isUrgent = pri === 'urgent'
  const assigneeName = query.assignedTo && staffMap?.[query.assignedTo]

  return (
    <div
      onClick={onClick}
      className="rounded-xl border border-ec-div overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer"
      style={{
        borderLeft: PRIORITY_BORDER[pri] || '3px solid #e3e8ef',
        background: isUrgent ? 'linear-gradient(135deg, #fff8f8 0%, #ffffff 100%)' : 'var(--ec-card-solid, #fff)',
        boxShadow: '0 1px 4px rgba(5,150,105,0.06)',
      }}
    >
      <div className="px-4 py-3.5">
        {/* Row 1: Badges */}
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <span
            className="text-[9px] font-bold px-1.5 py-px rounded tracking-wide uppercase"
            style={{ backgroundColor: priStyle.bg, color: priStyle.color, border: `1px solid ${priStyle.border}` }}
          >
            {priStyle.label}
          </span>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: typeStyle.bg, color: typeStyle.color, border: `1px solid ${typeStyle.border}` }}
          >
            {typeStyle.emoji} {typeStyle.label}
          </span>
          <span className="ml-auto" />
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}` }}
          >
            {statusStyle.label}
          </span>
        </div>

        {/* Row 2: Patient info */}
        <div className="flex items-center gap-2 text-[11px] text-ec-t3 mb-1.5">
          <span className="font-medium text-ec-t2">{query.patientName}</span>
          {query.patientDob && (
            <>
              <span>·</span>
              <span>DOB: {formatDate(query.patientDob)}</span>
            </>
          )}
          {query.patientPhone && (
            <>
              <span>·</span>
              <span>📞 {query.patientPhone}</span>
            </>
          )}
        </div>

        {/* Row 3: Subject */}
        <div className="text-[13px] font-semibold text-ec-t1 mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>
          {query.subject}
        </div>

        {/* Row 4: Medication */}
        {query.medication && (
          <div className="text-[11px] text-ec-t2 mb-1">
            <span className="text-ec-t3">Medication:</span> {query.medication}
          </div>
        )}

        {/* Row 5: Description excerpt */}
        {query.description && (
          <p className="text-[11px] text-ec-t3 leading-relaxed m-0 mb-2 line-clamp-2">{query.description}</p>
        )}

        {/* Footer */}
        <div className="flex items-center gap-3 pt-2" style={{ borderTop: '1px solid var(--ec-div)' }}>
          {assigneeName ? (
            <div className="flex items-center gap-1.5">
              <Avatar name={assigneeName} size={20} />
              <span className="text-[10px] text-ec-t2 font-medium">{assigneeName}</span>
            </div>
          ) : (
            <span className="text-[10px] text-ec-t3 italic">Unassigned</span>
          )}
          {query.followUpDate && (
            <span className="text-[10px] text-ec-t3">
              Follow-up: <span className="font-medium text-ec-t2">{formatDate(query.followUpDate)}</span>
            </span>
          )}
          <span className="ml-auto text-[10px] text-ec-t3">{timeAgo(query.createdAt)}</span>
        </div>
      </div>
    </div>
  )
}
