import { useState } from 'react'
import Modal from '../Modal'

const QUERY_TYPES = [
  { label: 'Owing', value: 'owing' },
  { label: 'Callback', value: 'callback' },
  { label: 'GP Query', value: 'gp_query' },
  { label: 'Hospital Query', value: 'hospital_query' },
  { label: 'Patient Query', value: 'patient_query' },
  { label: 'Other', value: 'other' },
]

const PRIORITIES = [
  { label: 'Urgent', value: 'urgent' },
  { label: 'High', value: 'high' },
  { label: 'Normal', value: 'normal' },
  { label: 'Low', value: 'low' },
]

const inputClass = 'w-full px-3 py-2 rounded-lg border border-ec-border bg-ec-card text-sm text-ec-t1 outline-none focus:ring-2 focus:ring-[#0073e6]/30'
const labelClass = 'block text-[11px] font-semibold text-ec-t3 uppercase tracking-wider mb-1.5'

export default function QueryModal({ open, onClose, onSubmit, staff, userId }) {
  const [form, setForm] = useState({
    patientName: '',
    patientDob: '',
    patientPhone: '',
    nhsNumber: '',
    queryType: 'owing',
    priority: 'normal',
    subject: '',
    medication: '',
    description: '',
    assignedTo: '',
    followUpDate: '',
  })
  const [saving, setSaving] = useState(false)

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.patientName.trim() || !form.subject.trim()) return
    setSaving(true)
    try {
      await onSubmit({
        ...form,
        patientDob: form.patientDob || null,
        assignedTo: form.assignedTo || null,
        followUpDate: form.followUpDate || null,
        createdBy: userId || null,
      })
      setForm({
        patientName: '', patientDob: '', patientPhone: '', nhsNumber: '',
        queryType: 'owing', priority: 'normal', subject: '', medication: '',
        description: '', assignedTo: '', followUpDate: '',
      })
      onClose()
    } catch {
      // error handled in hook
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Log New Query" wide>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Patient section */}
        <div>
          <div className="text-xs font-bold text-ec-t1 mb-3 uppercase tracking-wider">Patient</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Patient Name *</label>
              <input type="text" required value={form.patientName} onChange={e => set('patientName', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Date of Birth</label>
              <input type="date" value={form.patientDob} onChange={e => set('patientDob', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Phone Number</label>
              <input type="tel" value={form.patientPhone} onChange={e => set('patientPhone', e.target.value)} className={inputClass} placeholder="07..." />
            </div>
            <div>
              <label className={labelClass}>NHS Number</label>
              <input type="text" value={form.nhsNumber} onChange={e => set('nhsNumber', e.target.value)} className={inputClass} placeholder="000 000 0000" />
            </div>
          </div>
        </div>

        {/* Query section */}
        <div>
          <div className="text-xs font-bold text-ec-t1 mb-3 uppercase tracking-wider">Query Details</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Query Type *</label>
              <select value={form.queryType} onChange={e => set('queryType', e.target.value)} className={inputClass}>
                {QUERY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Priority *</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)} className={inputClass}>
                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-3">
            <label className={labelClass}>Subject * <span className="font-normal text-ec-t4">({form.subject.length}/100)</span></label>
            <input
              type="text"
              required
              maxLength={100}
              value={form.subject}
              onChange={e => set('subject', e.target.value)}
              className={inputClass}
              placeholder='e.g. "Metformin 500mg owing x28"'
            />
          </div>
          <div className="mt-3">
            <label className={labelClass}>Medication</label>
            <input type="text" value={form.medication} onChange={e => set('medication', e.target.value)} className={inputClass} placeholder="Drug name + strength + quantity" />
          </div>
          <div className="mt-3">
            <label className={labelClass}>Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} className={inputClass} placeholder="Full details, notes, context..." />
          </div>
        </div>

        {/* Assignment section */}
        <div>
          <div className="text-xs font-bold text-ec-t1 mb-3 uppercase tracking-wider">Assignment</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Assigned To</label>
              <select value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)} className={inputClass}>
                <option value="">— Unassigned —</option>
                {(staff || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Follow-up Date</label>
              <input type="date" value={form.followUpDate} onChange={e => set('followUpDate', e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="text-sm text-ec-t3 hover:text-ec-t1 cursor-pointer bg-transparent border-none">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !form.patientName.trim() || !form.subject.trim()}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white border-none cursor-pointer disabled:opacity-50 transition shadow-sm"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
          >
            {saving ? 'Saving...' : 'Log Query'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
