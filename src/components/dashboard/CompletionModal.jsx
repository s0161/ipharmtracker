import { useState, useEffect } from 'react'
import Modal from '../Modal'

const ALL_STAFF = [
  'Moniba Jamil', 'Umama Khan', 'Sadaf Subhani', 'Salma Shakoor',
  'Urooj Khan', 'Shain Nawaz', 'Marian Hadaway', 'Jamila Adwan', 'Amjid Shakoor',
]

// Completion modal for ticking off tasks
export default function CompletionModal({ open, taskName, assignedTo, onSubmit, onClose, staffList }) {
  const [completedBy, setCompletedBy] = useState(assignedTo || '')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open) {
      setCompletedBy(assignedTo || '')
      setNotes('')
    }
  }, [open, assignedTo])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!completedBy) return
    onSubmit(taskName, completedBy, notes)
  }

  return (
    <Modal open={open} onClose={onClose} title="Complete Task">
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="label">Task</label>
          <input type="text" className="input" value={taskName || ''} readOnly />
        </div>
        <div className="form-group">
          <label className="label">Completed by *</label>
          <select className="input" value={completedBy} onChange={(e) => setCompletedBy(e.target.value)} required>
            <option value="">Select staff...</option>
            {(staffList?.length ? staffList : ALL_STAFF).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="label">Notes</label>
          <textarea className="input input--textarea" placeholder="Optional notes..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>
        <div className="form-group">
          <label className="label">Timestamp</label>
          <input type="text" className="input" value={new Date().toLocaleString('en-GB')} readOnly />
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn--primary btn--complete">Mark Complete</button>
        </div>
      </form>
    </Modal>
  )
}
