import { useState } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import { generateId, formatDateTime, DEFAULT_CLEANING_TASKS } from '../utils/helpers'
import { downloadCsv } from '../utils/exportCsv'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'
import PageActions from '../components/PageActions'

const emptyForm = {
  taskName: '',
  customTask: '',
  dateTime: '',
  staffMember: '',
  result: '',
  notes: '',
}

export default function CleaningRota() {
  const [entries, setEntries, loading] = useSupabase('cleaning_entries', [])
  const [staffMembers] = useSupabase('staff_members', [], { valueField: 'name' })
  const [cleaningTasks] = useSupabase('cleaning_tasks', DEFAULT_CLEANING_TASKS)
  const showToast = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

  if (loading) {
    return <div className="loading-container"><div className="spinner" />Loading…</div>
  }

  const taskNames = cleaningTasks.map((t) => t.name)

  const sorted = [...entries].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  )

  const openAdd = () => {
    setForm({
      ...emptyForm,
      dateTime: new Date().toISOString().slice(0, 16),
    })
    setEditingId(null)
    setModalOpen(true)
  }

  const openEdit = (entry) => {
    const isCustom = !taskNames.includes(entry.taskName) && entry.taskName !== ''
    setForm({
      taskName: isCustom ? '__other__' : entry.taskName,
      customTask: isCustom ? entry.taskName : '',
      dateTime: entry.dateTime,
      staffMember: entry.staffMember,
      result: entry.result,
      notes: entry.notes,
    })
    setEditingId(entry.id)
    setModalOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const taskName =
      form.taskName === '__other__' ? form.customTask.trim() : form.taskName
    if (!taskName || !form.dateTime || !form.staffMember || !form.result) return

    const data = {
      taskName,
      dateTime: form.dateTime,
      staffMember: form.staffMember,
      result: form.result,
      notes: form.notes,
    }

    if (editingId) {
      setEntries(entries.map((e) => (e.id === editingId ? { ...e, ...data } : e)))
      showToast('Cleaning entry updated')
    } else {
      setEntries([
        ...entries,
        { id: generateId(), ...data, createdAt: new Date().toISOString() },
      ])
      showToast('Cleaning entry added')
    }
    setModalOpen(false)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      setEntries(entries.filter((e) => e.id !== id))
      showToast('Entry deleted', 'info')
    }
  }

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleCsvDownload = () => {
    const headers = ['Task', 'Date / Time', 'Staff Member', 'Result', 'Notes']
    const rows = sorted.map((e) => [
      e.taskName,
      e.dateTime || '',
      e.staffMember,
      e.result,
      e.notes || '',
    ])
    downloadCsv('cleaning-rota', headers, rows)
  }

  return (
    <div>
      <div className="page-header">
        <p className="page-desc">
          Log cleaning activities and task completion for compliance auditing.
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
          <p className="empty-state">
            No cleaning entries yet. Add your first entry to get started.
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Date / Time</th>
                <th>Staff Member</th>
                <th>Result</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.taskName}</td>
                  <td>{formatDateTime(entry.dateTime)}</td>
                  <td>{entry.staffMember}</td>
                  <td>
                    <span
                      className={`result-badge result-badge--${entry.result === 'Pass' ? 'pass' : 'action'}`}
                    >
                      {entry.result}
                    </span>
                  </td>
                  <td className="cell-notes">{entry.notes || '—'}</td>
                  <td>
                    <div className="action-btns">
                      <button
                        className="btn btn--ghost btn--sm"
                        onClick={() => openEdit(entry)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn--ghost btn--sm btn--danger"
                        onClick={() => handleDelete(entry.id)}
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
        title={editingId ? 'Edit Cleaning Entry' : 'Add Cleaning Entry'}
      >
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Task *</label>
            <select
              className="input"
              value={form.taskName}
              onChange={update('taskName')}
              required
            >
              <option value="">Select task...</option>
              {cleaningTasks.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
              <option value="__other__">Other (specify)</option>
            </select>
          </div>

          {form.taskName === '__other__' && (
            <div className="form-group">
              <label className="label">Custom Task Name *</label>
              <input
                type="text"
                className="input"
                placeholder="Enter task name..."
                value={form.customTask}
                onChange={update('customTask')}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="label">Date / Time *</label>
            <input
              type="datetime-local"
              className="input"
              value={form.dateTime}
              onChange={update('dateTime')}
              required
            />
          </div>

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
                value={form.staffMember}
                onChange={update('staffMember')}
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
            <label className="label">Result *</label>
            <select
              className="input"
              value={form.result}
              onChange={update('result')}
              required
            >
              <option value="">Select result...</option>
              <option value="Pass">Pass</option>
              <option value="Action Taken">Action Taken</option>
            </select>
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
