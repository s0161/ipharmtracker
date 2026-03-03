import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSupabase } from '../hooks/useSupabase'
import { logAudit } from '../utils/auditLog'
import { useUser } from '../contexts/UserContext'
import { generateId, formatDateTime, DEFAULT_CLEANING_TASKS } from '../utils/helpers'
import { downloadCsv } from '../utils/exportCsv'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'
import PageActions from '../components/PageActions'
import SwipeRow from '../components/SwipeRow'

const emptyForm = {
  taskName: '',
  customTask: '',
  dateTime: '',
  staffMember: '',
  result: '',
  notes: '',
}

const inputClass =
  'w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors font-sans'

export default function CleaningRota() {
  const { user } = useUser()
  const [entries, setEntries, loading] = useSupabase('cleaning_entries', [])
  const [staffMembers] = useSupabase('staff_members', [], { valueField: 'name' })
  const [cleaningTasks] = useSupabase('cleaning_tasks', DEFAULT_CLEANING_TASKS)
  const showToast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    if (searchParams.get('add') === 'true' && !loading) {
      setForm({ ...emptyForm, dateTime: new Date().toISOString().slice(0, 16) })
      setEditingId(null)
      setModalOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [loading, searchParams, setSearchParams])

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-sm text-ec-t3">Loading…</div>
  }

  const taskNames = cleaningTasks.map((t) => t.name)

  // Deduplicate by task+dateTime (keep most recent by createdAt)
  const deduped = (() => {
    const map = new Map()
    entries.forEach(e => {
      const key = `${e.taskName}|${e.dateTime}`
      const existing = map.get(key)
      if (!existing || new Date(e.createdAt) > new Date(existing.createdAt)) {
        map.set(key, e)
      }
    })
    return [...map.values()]
  })()

  const sorted = [...deduped].sort(
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
      logAudit('Updated', `Cleaning: ${taskName}`, 'Cleaning Rota', user?.name)
      showToast('Cleaning entry updated')
    } else {
      setEntries([
        ...entries,
        { id: generateId(), ...data, createdAt: new Date().toISOString() },
      ])
      logAudit('Created', `Cleaning: ${taskName}`, 'Cleaning Rota', user?.name)
      showToast('Cleaning entry added')
    }
    setModalOpen(false)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      const entry = entries.find((e) => e.id === id)
      setEntries(entries.filter((e) => e.id !== id))
      logAudit('Deleted', `Cleaning: ${entry?.taskName}`, 'Cleaning Rota', user?.name)
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

  function resultBadgeClass(result) {
    if (result === 'Pass') {
      return 'inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-ec-em/10 text-ec-em'
    }
    return 'inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-ec-warn/10 text-ec-warn'
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-ec-t3 mb-2">
          Log cleaning activities and task completion for compliance auditing.
        </p>
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <PageActions onDownloadCsv={handleCsvDownload} />
          <button
            className="px-4 py-2 bg-ec-em text-white font-semibold rounded-lg text-sm border-none cursor-pointer hover:bg-ec-em-dark transition-colors flex items-center gap-1.5 font-sans"
            onClick={openAdd}
          >
            + Add Entry
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-10 text-ec-t3 text-sm">
          No cleaning entries yet. Add your first entry to get started.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-white/[0.06]">Task</th>
                <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-white/[0.06]">Date / Time</th>
                <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-white/[0.06]">Staff Member</th>
                <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-white/[0.06]">Result</th>
                <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-white/[0.06]">Notes</th>
                <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-white/[0.06] hidden md:table-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((entry) => (
                <SwipeRow key={entry.id} onEdit={() => openEdit(entry)} onDelete={() => handleDelete(entry.id)}>
                  <td className="px-4 py-2.5 text-ec-t1 border-b border-white/[0.04] font-medium">{entry.taskName}</td>
                  <td className="px-4 py-2.5 text-ec-t1 border-b border-white/[0.04]">{formatDateTime(entry.dateTime)}</td>
                  <td className="px-4 py-2.5 text-ec-t1 border-b border-white/[0.04]">{entry.staffMember}</td>
                  <td className="px-4 py-2.5 text-ec-t1 border-b border-white/[0.04]">
                    <span className={resultBadgeClass(entry.result)}>
                      {entry.result}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-ec-t3 border-b border-white/[0.04] max-w-[200px] truncate">{entry.notes || '—'}</td>
                  <td className="px-4 py-2.5 text-ec-t1 border-b border-white/[0.04] hidden md:table-cell">
                    <div className="flex gap-1">
                      <button
                        className="px-2.5 py-1 bg-white/[0.05] text-ec-t2 rounded-lg text-xs border border-white/[0.06] cursor-pointer hover:bg-white/[0.08] hover:text-ec-t1 transition-colors font-sans"
                        onClick={() => openEdit(entry)}
                      >
                        Edit
                      </button>
                      <button
                        className="px-2.5 py-1 bg-ec-crit/10 text-ec-crit-light rounded-lg text-xs border border-ec-crit/20 cursor-pointer hover:bg-ec-crit/20 transition-colors font-sans"
                        onClick={() => handleDelete(entry.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </SwipeRow>
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
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs font-semibold text-ec-t2 mb-1 block">Task *</label>
            <select
              className={inputClass}
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
            <div>
              <label className="text-xs font-semibold text-ec-t2 mb-1 block">Custom Task Name *</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Enter task name..."
                value={form.customTask}
                onChange={update('customTask')}
                required
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-ec-t2 mb-1 block">Date / Time *</label>
            <input
              type="datetime-local"
              className={inputClass}
              value={form.dateTime}
              onChange={update('dateTime')}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-ec-t2 mb-1 block">Staff Member *</label>
            {staffMembers.length === 0 ? (
              <p className="text-xs text-ec-t3 mt-1">
                No staff members configured.{' '}
                <a href="/settings">Add them in Settings</a>.
              </p>
            ) : (
              <select
                className={inputClass}
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

          <div>
            <label className="text-xs font-semibold text-ec-t2 mb-1 block">Result *</label>
            <select
              className={inputClass}
              value={form.result}
              onChange={update('result')}
              required
            >
              <option value="">Select result...</option>
              <option value="Pass">Pass</option>
              <option value="Action Taken">Action Taken</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-ec-t2 mb-1 block">Notes</label>
            <textarea
              className={`${inputClass} resize-none`}
              placeholder="Optional notes..."
              value={form.notes}
              onChange={update('notes')}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-white/[0.04]">
            <button
              type="button"
              className="px-4 py-2 bg-white/[0.05] text-ec-t2 rounded-lg text-sm border border-white/[0.06] cursor-pointer hover:bg-white/[0.08] transition-colors font-sans"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-ec-em text-white font-semibold rounded-lg text-sm border-none cursor-pointer hover:bg-ec-em-dark transition-colors font-sans"
            >
              {editingId ? 'Save Changes' : 'Add Entry'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
