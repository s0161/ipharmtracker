import { useState } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import { formatDate, generateId, getSafeguardingStatus, getRefresherDate } from '../utils/helpers'
import { downloadCsv } from '../utils/exportCsv'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'
import PageActions from '../components/PageActions'

const STATUS_LABELS = {
  current: 'Current',
  'due-soon': 'Due Soon',
  overdue: 'Overdue',
}

const REFERENCE_DOCS = [
  { name: 'Safeguarding Policy', version: 'v1.0 January 2026', review: 'Review January 2027' },
  { name: 'Staff Training Handbook', version: 'v1.0 January 2026', review: 'Review January 2027' },
  { name: 'Trainer Delivery Guide', version: 'v1.0 January 2026', review: 'Review January 2027' },
  { name: 'Safeguarding Awareness Poster', version: 'January 2026', review: 'Review January 2027' },
]

const emptyForm = {
  staffName: '',
  jobTitle: '',
  trainingDate: '',
  deliveredBy: 'Amjid Shakoor — Superintendent Pharmacist',
  trainingMethod: 'Internal — Level 1 Awareness',
  handbookVersion: 'v1.0 January 2026',
  signedOff: false,
}

export default function SafeguardingTraining() {
  const [records, setRecords, loading] = useSupabase('safeguarding_records', [])
  const [staffMembers] = useSupabase('staff_members', [], { valueField: 'name' })
  const showToast = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

  if (loading) {
    return <div className="loading-container"><div className="spinner" />Loading…</div>
  }

  const sorted = [...records].sort((a, b) => a.staffName.localeCompare(b.staffName))

  // Summary
  const totalTrained = records.filter((r) => r.trainingDate).length
  const currentCount = records.filter((r) => getSafeguardingStatus(r.trainingDate) === 'current').length
  const dueSoonCount = records.filter((r) => getSafeguardingStatus(r.trainingDate) === 'due-soon').length
  const overdueCount = records.filter((r) => getSafeguardingStatus(r.trainingDate) === 'overdue').length

  const toggleSignedOff = (id) => {
    setRecords(records.map((r) => (r.id === id ? { ...r, signedOff: !r.signedOff } : r)))
  }

  const openAdd = () => {
    setForm(emptyForm)
    setEditingId(null)
    setModalOpen(true)
  }

  const openEdit = (record) => {
    setForm({
      staffName: record.staffName,
      jobTitle: record.jobTitle,
      trainingDate: record.trainingDate,
      deliveredBy: record.deliveredBy,
      trainingMethod: record.trainingMethod,
      handbookVersion: record.handbookVersion,
      signedOff: record.signedOff,
    })
    setEditingId(record.id)
    setModalOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.staffName || !form.jobTitle) return

    if (editingId) {
      setRecords(records.map((r) => (r.id === editingId ? { ...r, ...form } : r)))
      showToast('Safeguarding record updated')
    } else {
      setRecords([...records, { id: generateId(), ...form }])
      showToast('Safeguarding record added')
    }
    setModalOpen(false)
  }

  const handleDelete = (id) => {
    if (window.confirm('Delete this safeguarding record?')) {
      setRecords(records.filter((r) => r.id !== id))
      showToast('Record deleted', 'info')
    }
  }

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleCsvDownload = () => {
    const headers = ['Staff Name', 'Job Title', 'Training Date', 'Delivered By', 'Method', 'Handbook', 'Signed Off', 'Next Refresher', 'Status']
    const rows = sorted.map((r) => [
      r.staffName,
      r.jobTitle,
      r.trainingDate || '',
      r.deliveredBy,
      r.trainingMethod,
      r.handbookVersion,
      r.signedOff ? 'Yes' : 'No',
      getRefresherDate(r.trainingDate) || '',
      getSafeguardingStatus(r.trainingDate),
    ])
    downloadCsv('safeguarding-training', headers, rows)
  }

  return (
    <div>
      <div className="page-header">
        <p className="page-desc">
          Safeguarding training records for iPharmacy Direct, Ashton-under-Lyne.
          Safeguarding Lead: <strong>Amjid Shakoor</strong> (Superintendent Pharmacist).
        </p>
        <div className="page-header-actions">
          <PageActions onDownloadCsv={handleCsvDownload} />
          <button className="btn btn--primary" onClick={openAdd}>
            + Add Record
          </button>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="sg-banner">
        <div className="sg-banner-item">
          <span className="sg-banner-num">{totalTrained}</span>
          <span className="sg-banner-label">Staff Trained</span>
        </div>
        <div className="sg-banner-divider" />
        <div className="sg-banner-item sg-banner-item--current">
          <span className="sg-banner-num">{currentCount}</span>
          <span className="sg-banner-label">Current</span>
        </div>
        <div className="sg-banner-divider" />
        <div className="sg-banner-item sg-banner-item--due">
          <span className="sg-banner-num">{dueSoonCount}</span>
          <span className="sg-banner-label">Due Soon</span>
        </div>
        <div className="sg-banner-divider" />
        <div className="sg-banner-item sg-banner-item--overdue">
          <span className="sg-banner-num">{overdueCount}</span>
          <span className="sg-banner-label">Overdue</span>
        </div>
      </div>

      {/* Training Records Table */}
      {sorted.length === 0 ? (
        <div className="empty-state-box">
          <p className="empty-state">No safeguarding records yet. Add your first record.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Staff Name</th>
                <th>Job Title</th>
                <th>Training Date</th>
                <th className="mobile-hide">Delivered By</th>
                <th className="mobile-hide">Method</th>
                <th className="mobile-hide">Handbook</th>
                <th>Signed Off</th>
                <th>Next Refresher</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((record) => {
                const status = getSafeguardingStatus(record.trainingDate)
                const refresher = getRefresherDate(record.trainingDate)
                return (
                  <tr key={record.id} className={`training-row training-row--${status === 'current' ? 'complete' : status === 'due-soon' ? 'inprogress' : 'pending'}`}>
                    <td className="cell-bold">{record.staffName}</td>
                    <td>{record.jobTitle}</td>
                    <td>{formatDate(record.trainingDate)}</td>
                    <td className="cell-notes mobile-hide">{record.deliveredBy}</td>
                    <td className="cell-notes mobile-hide">{record.trainingMethod}</td>
                    <td className="cell-notes mobile-hide">{record.handbookVersion}</td>
                    <td>
                      <button
                        className={`signed-badge ${record.signedOff ? 'signed-badge--yes' : 'signed-badge--no'}`}
                        onClick={() => toggleSignedOff(record.id)}
                        title="Click to toggle"
                      >
                        {record.signedOff ? 'Yes' : 'No'}
                      </button>
                    </td>
                    <td>{refresher ? formatDate(refresher) : '—'}</td>
                    <td>
                      <span className={`sg-status sg-status--${status}`}>
                        <span className={`traffic-dot traffic-dot--${status === 'current' ? 'green' : status === 'due-soon' ? 'amber' : 'red'}`} />
                        {STATUS_LABELS[status]}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="btn btn--ghost btn--sm" onClick={() => openEdit(record)}>
                          Edit
                        </button>
                        <button className="btn btn--ghost btn--sm btn--danger" onClick={() => handleDelete(record.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Reference Documents */}
      <div className="sg-docs">
        <h2 className="sg-docs-title">Reference Documents</h2>
        <p className="sg-docs-sub">Safeguarding Lead: Amjid Shakoor — Superintendent Pharmacist, iPharmacy Direct, Ashton-under-Lyne</p>
        <div className="sg-docs-grid">
          {REFERENCE_DOCS.map((doc) => (
            <div key={doc.name} className="sg-doc-card">
              <div className="sg-doc-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div className="sg-doc-info">
                <span className="sg-doc-name">{doc.name}</span>
                <span className="sg-doc-version">{doc.version}</span>
                <span className="sg-doc-review">{doc.review}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Safeguarding Record' : 'Add Safeguarding Record'}
      >
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Staff Name *</label>
            <select
              className="input"
              value={form.staffName}
              onChange={update('staffName')}
              required
            >
              <option value="">Select staff member...</option>
              {staffMembers.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="label">Job Title *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Dispenser"
              value={form.jobTitle}
              onChange={update('jobTitle')}
              required
            />
          </div>

          <div className="form-group">
            <label className="label">Training Date</label>
            <input
              type="date"
              className="input"
              value={form.trainingDate}
              onChange={update('trainingDate')}
            />
          </div>

          <div className="form-group">
            <label className="label">Delivered By</label>
            <input
              type="text"
              className="input"
              value={form.deliveredBy}
              onChange={update('deliveredBy')}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label">Training Method</label>
              <input
                type="text"
                className="input"
                value={form.trainingMethod}
                onChange={update('trainingMethod')}
              />
            </div>
            <div className="form-group">
              <label className="label">Handbook Version</label>
              <input
                type="text"
                className="input"
                value={form.handbookVersion}
                onChange={update('handbookVersion')}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">
              <input
                type="checkbox"
                checked={form.signedOff}
                onChange={(e) => setForm({ ...form, signedOff: e.target.checked })}
                style={{ marginRight: '0.5rem' }}
              />
              Signed Off
            </label>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn--ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary">
              {editingId ? 'Save Changes' : 'Add Record'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
