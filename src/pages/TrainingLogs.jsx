import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { generateId, formatDate } from '../utils/helpers'
import { downloadCsv } from '../utils/exportCsv'
import Modal from '../components/Modal'
import PageActions from '../components/PageActions'

const emptyForm = {
  staffName: '',
  dateCompleted: '',
  topic: '',
  trainerName: '',
  certificateExpiry: '',
  notes: '',
}

export default function TrainingLogs() {
  const [logs, setLogs] = useLocalStorage('ipd_training', [])
  const [staffMembers] = useLocalStorage('ipd_staff', [])
  const [topics] = useLocalStorage('ipd_topics', [])
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

  const sorted = [...logs].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  )

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
      certificateExpiry: log.certificateExpiry,
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
    } else {
      setLogs([
        ...logs,
        { id: generateId(), ...form, createdAt: new Date().toISOString() },
      ])
    }
    setModalOpen(false)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      setLogs(logs.filter((l) => l.id !== id))
    }
  }

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleCsvDownload = () => {
    const headers = ['Staff Member', 'Date Completed', 'Topic', 'Trainer', 'Cert. Expiry', 'Notes']
    const rows = sorted.map((l) => [
      l.staffName,
      l.dateCompleted || '',
      l.topic,
      l.trainerName || '',
      l.certificateExpiry || '',
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

      {sorted.length === 0 ? (
        <div className="empty-state-box">
          <p className="empty-state">No training logs yet. Add your first entry to get started.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Date Completed</th>
                <th>Topic</th>
                <th>Trainer</th>
                <th>Cert. Expiry</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((log) => (
                <tr key={log.id}>
                  <td>{log.staffName}</td>
                  <td>{formatDate(log.dateCompleted)}</td>
                  <td>{log.topic}</td>
                  <td>{log.trainerName || '—'}</td>
                  <td>{formatDate(log.certificateExpiry)}</td>
                  <td className="cell-notes">{log.notes || '—'}</td>
                  <td>
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
                </tr>
              ))}
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
            <label className="label">Training Topic *</label>
            {topics.length === 0 ? (
              <p className="form-hint">
                No topics configured.{' '}
                <a href="/settings">Add them in Settings</a>.
              </p>
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

          <div className="form-group">
            <label className="label">Trainer Name</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Jane Smith"
              value={form.trainerName}
              onChange={update('trainerName')}
            />
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
