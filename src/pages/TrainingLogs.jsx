import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSupabase } from '../hooks/useSupabase'
import { generateId, formatDate, getTrafficLight } from '../utils/helpers'
import { downloadCsv } from '../utils/exportCsv'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'
import PageActions from '../components/PageActions'
import SwipeRow from '../components/SwipeRow'

const DELIVERY_METHODS = ['Classroom', 'Online', 'On-the-job', 'Self-study', 'External Provider', 'Workshop']
const OUTCOMES = ['Pass', 'Fail', 'Attended', 'Certificate Issued', 'Refresher Needed']

const emptyForm = {
  staffName: '',
  dateCompleted: '',
  topic: '',
  trainerName: '',
  deliveryMethod: '',
  duration: '',
  outcome: '',
  certificateExpiry: '',
  renewalDate: '',
  notes: '',
}

function getExpiryStatus(certificateExpiry) {
  if (!certificateExpiry) return 'none'
  return getTrafficLight(certificateExpiry)
}

function getExpiryLabel(status) {
  switch (status) {
    case 'red': return 'Expired'
    case 'amber': return 'Expiring Soon'
    case 'green': return 'Valid'
    default: return '—'
  }
}

export default function TrainingLogs() {
  const [logs, setLogs, loading] = useSupabase('training_logs', [])
  const [staffMembers] = useSupabase('staff_members', [], { valueField: 'name' })
  const [topics] = useSupabase('training_topics', [], { valueField: 'name' })
  const showToast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [filterStaff, setFilterStaff] = useState('')
  const [filterTopic, setFilterTopic] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (searchParams.get('add') === 'true' && !loading) {
      setForm(emptyForm)
      setEditingId(null)
      setModalOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [loading, searchParams, setSearchParams])

  if (loading) {
    return <div className="loading-container"><div className="spinner" />Loading…</div>
  }

  // Stats
  const thisMonth = new Date().toISOString().slice(0, 7)
  const totalLogs = logs.length
  const thisMonthCount = logs.filter(l => (l.dateCompleted || '').startsWith(thisMonth)).length
  const expiringSoon = logs.filter(l => {
    const s = getExpiryStatus(l.certificateExpiry)
    return s === 'red' || s === 'amber'
  }).length
  const staffTrained = new Set(logs.map(l => l.staffName)).size

  // Filter
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return logs.filter(l => {
      if (filterStaff && l.staffName !== filterStaff) return false
      if (filterTopic && l.topic !== filterTopic) return false
      if (q && !l.staffName.toLowerCase().includes(q) && !l.topic.toLowerCase().includes(q) && !(l.trainerName || '').toLowerCase().includes(q)) return false
      return true
    })
  }, [logs, filterStaff, filterTopic, search])

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  )

  const uniqueStaff = [...new Set(logs.map(l => l.staffName))].sort()
  const uniqueTopics = [...new Set(logs.map(l => l.topic))].sort()

  const openAdd = () => {
    setForm(emptyForm)
    setEditingId(null)
    setModalOpen(true)
  }

  const openEdit = (log) => {
    setForm({
      staffName: log.staffName,
      dateCompleted: log.dateCompleted,
      topic: log.topic,
      trainerName: log.trainerName,
      deliveryMethod: log.deliveryMethod || '',
      duration: log.duration || '',
      outcome: log.outcome || '',
      certificateExpiry: log.certificateExpiry,
      renewalDate: log.renewalDate || '',
      notes: log.notes,
    })
    setEditingId(log.id)
    setModalOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.staffName || !form.dateCompleted || !form.topic) return

    if (editingId) {
      setLogs(
        logs.map((l) =>
          l.id === editingId ? { ...l, ...form } : l
        )
      )
      showToast('Training log updated')
    } else {
      setLogs([
        ...logs,
        { id: generateId(), ...form, createdAt: new Date().toISOString() },
      ])
      showToast('Training log added')
    }
    setModalOpen(false)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      setLogs(logs.filter((l) => l.id !== id))
      showToast('Entry deleted', 'info')
    }
  }

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleCsvDownload = () => {
    const headers = ['Staff Member', 'Date Completed', 'Topic', 'Trainer', 'Delivery Method', 'Duration', 'Outcome', 'Cert. Expiry', 'Renewal Date', 'Status', 'Notes']
    const rows = sorted.map((l) => [
      l.staffName,
      l.dateCompleted || '',
      l.topic,
      l.trainerName || '',
      l.deliveryMethod || '',
      l.duration || '',
      l.outcome || '',
      l.certificateExpiry || '',
      l.renewalDate || '',
      getExpiryLabel(getExpiryStatus(l.certificateExpiry)),
      l.notes || '',
    ])
    downloadCsv('training-logs', headers, rows)
  }

  return (
    <div>
      <div className="page-header">
        <p className="page-desc">
          Record and track staff training activities, certifications, and compliance.
        </p>
        <div className="page-header-actions">
          <PageActions onDownloadCsv={handleCsvDownload} />
          <button className="btn btn--primary" onClick={openAdd}>
            + Add Entry
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="training-summary">
        <div className="training-summary-card training-summary-card--complete">
          <span className="training-summary-num">{totalLogs}</span>
          <span className="training-summary-label">Total Records</span>
        </div>
        <div className="training-summary-card training-summary-card--inprogress">
          <span className="training-summary-num">{thisMonthCount}</span>
          <span className="training-summary-label">This Month</span>
        </div>
        <div className="training-summary-card training-summary-card--pending">
          <span className="training-summary-num">{expiringSoon}</span>
          <span className="training-summary-label">Expiring / Expired</span>
        </div>
        <div className="training-summary-card training-summary-card--complete">
          <span className="training-summary-num">{staffTrained}</span>
          <span className="training-summary-label">Staff Trained</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="training-filters">
        <div className="search-box">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="input search-input"
            placeholder="Search staff, topic, or trainer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input input--inline" value={filterStaff} onChange={(e) => setFilterStaff(e.target.value)}>
          <option value="">All Staff</option>
          {uniqueStaff.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input input--inline" value={filterTopic} onChange={(e) => setFilterTopic(e.target.value)}>
          <option value="">All Topics</option>
          {uniqueTopics.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {(filterStaff || filterTopic || search) && (
          <button className="btn btn--ghost btn--sm" onClick={() => { setFilterStaff(''); setFilterTopic(''); setSearch('') }}>
            Clear All
          </button>
        )}
      </div>

      <p className="results-count">
        Showing {sorted.length} of {logs.length} entries
      </p>

      {sorted.length === 0 ? (
        <div className="empty-state-box">
          <p className="empty-state">
            {logs.length === 0
              ? 'No training logs yet. Add your first entry to get started.'
              : 'No entries match your filters.'}
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Date Completed</th>
                <th>Topic</th>
                <th className="mobile-hide">Trainer</th>
                <th className="mobile-hide">Cert. Expiry</th>
                <th>Status</th>
                <th className="mobile-hide">Notes</th>
                <th className="mobile-hide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((log) => {
                const status = getExpiryStatus(log.certificateExpiry)
                return (
                  <SwipeRow key={log.id} onEdit={() => openEdit(log)} onDelete={() => handleDelete(log.id)}>
                    <td>{log.staffName}</td>
                    <td>{formatDate(log.dateCompleted)}</td>
                    <td>{log.topic}</td>
                    <td className="mobile-hide">{log.trainerName || '—'}</td>
                    <td className="mobile-hide">{formatDate(log.certificateExpiry)}</td>
                    <td>
                      {status !== 'none' ? (
                        <span className={`status-badge status-badge--${status === 'green' ? 'complete' : status === 'amber' ? 'inprogress' : 'pending'}`}>
                          {getExpiryLabel(status)}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="cell-notes mobile-hide">{log.notes || '—'}</td>
                    <td className="mobile-hide">
                      <div className="action-btns">
                        <button
                          className="btn btn--ghost btn--sm"
                          onClick={() => openEdit(log)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn--ghost btn--sm btn--danger"
                          onClick={() => handleDelete(log.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </SwipeRow>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Training Log' : 'Add Training Log'}
      >
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Staff Member *</label>
            {staffMembers.length === 0 ? (
              <p className="form-hint">
                No staff members configured.{' '}
                <a href="/settings">Add them in Settings</a>.
              </p>
            ) : (
              <select
                className="input"
                value={form.staffName}
                onChange={update('staffName')}
                required
              >
                <option value="">Select staff member...</option>
                {staffMembers.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label">Date Completed *</label>
              <input
                type="date"
                className="input"
                value={form.dateCompleted}
                onChange={update('dateCompleted')}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Duration</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. 2 hours"
                value={form.duration}
                onChange={update('duration')}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Training Topic *</label>
            {topics.length === 0 ? (
              <input
                type="text"
                className="input"
                placeholder="Enter training topic..."
                value={form.topic}
                onChange={update('topic')}
                required
              />
            ) : (
              <select
                className="input"
                value={form.topic}
                onChange={update('topic')}
                required
              >
                <option value="">Select topic...</option>
                {topics.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label">Trainer Name</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Amjid Shakoor"
                value={form.trainerName}
                onChange={update('trainerName')}
              />
            </div>
            <div className="form-group">
              <label className="label">Delivery Method</label>
              <select
                className="input"
                value={form.deliveryMethod}
                onChange={update('deliveryMethod')}
              >
                <option value="">Select...</option>
                {DELIVERY_METHODS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label">Outcome</label>
              <select
                className="input"
                value={form.outcome}
                onChange={update('outcome')}
              >
                <option value="">Select...</option>
                {OUTCOMES.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Certificate Expiry</label>
              <input
                type="date"
                className="input"
                value={form.certificateExpiry}
                onChange={update('certificateExpiry')}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Renewal Date</label>
            <input
              type="date"
              className="input"
              value={form.renewalDate}
              onChange={update('renewalDate')}
            />
            <p className="form-hint">When this training needs to be renewed.</p>
          </div>

          <div className="form-group">
            <label className="label">Notes</label>
            <textarea
              className="input input--textarea"
              placeholder="Optional notes..."
              value={form.notes}
              onChange={update('notes')}
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn--primary">
              {editingId ? 'Save Changes' : 'Add Entry'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
