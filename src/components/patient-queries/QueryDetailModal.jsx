import { useState, useEffect } from 'react'
import Modal from '../Modal'
import Avatar from '../Avatar'

const STATUSES = [
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Awaiting Response', value: 'awaiting_response' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Cancelled', value: 'cancelled' },
]

const STATUS_BADGE = {
  open:               { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', label: 'Open' },
  in_progress:        { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'In Progress' },
  awaiting_response:  { color: '#7c3aed', bg: '#faf5ff', border: '#ddd6fe', label: 'Awaiting Response' },
  resolved:           { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', label: 'Resolved' },
  cancelled:          { color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', label: 'Cancelled' },
}

const inputClass = 'w-full px-3 py-2 rounded-lg border border-ec-border bg-ec-card text-sm text-ec-t1 outline-none focus:ring-2 focus:ring-[#0073e6]/30'
const labelClass = 'block text-[11px] font-semibold text-ec-t3 uppercase tracking-wider mb-1.5'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function QueryDetailModal({ query, open, onClose, onUpdate, onLogContact, staffMap, userId }) {
  const [status, setStatus] = useState(query?.status || 'open')
  const [resNotes, setResNotes] = useState(query?.resolutionNotes || '')
  const [saving, setSaving] = useState(false)
  const [contactLogging, setContactLogging] = useState(false)

  useEffect(() => {
    if (query) {
      setStatus(query.status || 'open')
      setResNotes(query.resolutionNotes || '')
    }
  }, [query])

  if (!query) return null

  const statusStyle = STATUS_BADGE[query.status] || STATUS_BADGE.open
  const createdByName = query.createdBy && staffMap?.[query.createdBy]
  const resolvedByName = query.resolvedBy && staffMap?.[query.resolvedBy]
  const assigneeName = query.assignedTo && staffMap?.[query.assignedTo]

  const handleUpdate = async () => {
    setSaving(true)
    try {
      const changes = { status }
      if (status === 'resolved') {
        changes.resolvedAt = new Date().toISOString()
        changes.resolvedBy = userId || null
        changes.resolutionNotes = resNotes
      }
      await onUpdate(query.id, changes)
      onClose()
    } catch {
      // handled in hook
    } finally {
      setSaving(false)
    }
  }

  const handleContact = async () => {
    setContactLogging(true)
    try {
      await onLogContact(query.id, query.contactAttemptCount || 0)
    } catch {
      // handled in hook
    } finally {
      setContactLogging(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Query Details" wide>
      <div className="space-y-5">
        {/* Status bar */}
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}` }}
          >
            {statusStyle.label}
          </span>
          {query.priority && (
            <span className="text-[9px] font-bold px-1.5 py-px rounded tracking-wide uppercase" style={{ color: '#64748b', background: '#f1f5f9' }}>
              {query.priority.toUpperCase()}
            </span>
          )}
        </div>

        {/* Patient info */}
        <div className="p-4 rounded-xl border border-ec-div bg-ec-card">
          <div className="text-[11px] font-bold text-ec-t3 uppercase tracking-wider mb-3">Patient</div>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <div className="text-ec-t3">Name</div>
            <div className="text-ec-t1 font-medium">{query.patientName}</div>
            {query.patientDob && <><div className="text-ec-t3">DOB</div><div className="text-ec-t1">{formatDate(query.patientDob)}</div></>}
            {query.patientPhone && <><div className="text-ec-t3">Phone</div><div className="text-ec-t1 font-mono text-xs">{query.patientPhone}</div></>}
            {query.nhsNumber && <><div className="text-ec-t3">NHS Number</div><div className="text-ec-t1 font-mono text-xs">{query.nhsNumber}</div></>}
          </div>
        </div>

        {/* Query info */}
        <div className="p-4 rounded-xl border border-ec-div bg-ec-card">
          <div className="text-[11px] font-bold text-ec-t3 uppercase tracking-wider mb-3">Query</div>
          <div className="text-[13px] font-semibold text-ec-t1 mb-2">{query.subject}</div>
          {query.medication && (
            <div className="text-xs text-ec-t2 mb-2">
              <span className="text-ec-t3">Medication:</span> {query.medication}
            </div>
          )}
          {query.description && (
            <p className="text-xs text-ec-t2 leading-relaxed m-0">{query.description}</p>
          )}
        </div>

        {/* Assignment */}
        <div className="p-4 rounded-xl border border-ec-div bg-ec-card">
          <div className="text-[11px] font-bold text-ec-t3 uppercase tracking-wider mb-3">Assignment</div>
          <div className="flex items-center gap-2 mb-2">
            {assigneeName ? (
              <>
                <Avatar name={assigneeName} size={24} />
                <span className="text-sm text-ec-t1 font-medium">{assigneeName}</span>
              </>
            ) : (
              <span className="text-sm text-ec-t3 italic">Unassigned</span>
            )}
          </div>
          {query.followUpDate && (
            <div className="text-xs text-ec-t3 mt-1">
              Follow-up: <span className="font-medium text-ec-t2">{formatDate(query.followUpDate)}</span>
            </div>
          )}
        </div>

        {/* Contact attempts */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleContact}
            disabled={contactLogging}
            className="px-4 py-2 rounded-lg text-xs font-semibold border border-ec-border bg-ec-card text-ec-t1 cursor-pointer hover:bg-ec-card-hover transition disabled:opacity-50"
          >
            {contactLogging ? 'Logging...' : '📞 Log Contact Attempt'}
          </button>
          <span className="text-xs text-ec-t3">
            Contacted {query.contactAttemptCount || 0} time{(query.contactAttemptCount || 0) !== 1 ? 's' : ''}
            {query.contactAttemptedAt && (
              <span> · Last: {formatDateTime(query.contactAttemptedAt)}</span>
            )}
          </span>
        </div>

        {/* Status update */}
        <div className="p-4 rounded-xl border border-ec-div bg-ec-card">
          <div className="text-[11px] font-bold text-ec-t3 uppercase tracking-wider mb-3">Update Status</div>
          <select value={status} onChange={e => setStatus(e.target.value)} className={inputClass}>
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          {status === 'resolved' && (
            <div className="mt-3">
              <label className={labelClass}>Resolution Notes *</label>
              <textarea
                value={resNotes}
                onChange={e => setResNotes(e.target.value)}
                rows={3}
                className={inputClass}
                placeholder="How was this resolved?"
              />
            </div>
          )}
        </div>

        {/* Activity */}
        <div className="text-xs text-ec-t3 space-y-1">
          <div>Created: {formatDateTime(query.createdAt)}{createdByName && ` by ${createdByName}`}</div>
          {query.status === 'resolved' && query.resolvedAt && (
            <div>Resolved: {formatDateTime(query.resolvedAt)}{resolvedByName && ` by ${resolvedByName}`}</div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button onClick={onClose} className="text-sm text-ec-t3 hover:text-ec-t1 cursor-pointer bg-transparent border-none">
            Close
          </button>
          <button
            onClick={handleUpdate}
            disabled={saving || (status === 'resolved' && !resNotes.trim())}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white border-none cursor-pointer disabled:opacity-50 transition shadow-sm"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
          >
            {saving ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
