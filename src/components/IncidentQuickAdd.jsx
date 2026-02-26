import { useState } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import { generateId } from '../utils/helpers'
import { useToast } from './Toast'
import Modal from './Modal'

const TYPES = ['Near Miss', 'Dispensing Error', 'Complaint', 'Other']
const SEVERITIES = ['Low', 'Medium', 'High']

const emptyForm = {
  type: '',
  description: '',
  severity: 'Low',
  date: new Date().toISOString().slice(0, 10),
}

export default function IncidentQuickAdd() {
  const [incidents, setIncidents] = useSupabase('incidents', [])
  const showToast = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.type || !form.description) return

    setIncidents([...incidents, {
      id: generateId(),
      ...form,
      createdAt: new Date().toISOString(),
    }])
    showToast('Incident reported successfully')
    setForm(emptyForm)
    setOpen(false)
  }

  return (
    <>
      <button
        className="fab-incident no-print"
        onClick={() => setOpen(true)}
        title="Report Incident"
        aria-label="Report Incident"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="24" height="24">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Report Incident">
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Type *</label>
            <select className="input" value={form.type} onChange={update('type')} required>
              <option value="">Select type...</option>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Description *</label>
            <textarea
              className="input input--textarea"
              placeholder="Describe what happened..."
              value={form.description}
              onChange={update('description')}
              rows={3}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="label">Severity</label>
              <select className="input" value={form.severity} onChange={update('severity')}>
                {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Date</label>
              <input type="date" className="input" value={form.date} onChange={update('date')} />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn--ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn--primary">Submit Report</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
