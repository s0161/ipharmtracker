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

const expiryBadgeClass = (status) => {
  const base = "px-2 py-0.5 rounded-full text-xs font-semibold"
  switch (status) {
    case 'green': return `${base} bg-ec-em/10 text-ec-em`
    case 'amber': return `${base} bg-ec-warn/10 text-ec-warn`
    case 'red': return `${base} bg-ec-crit/10 text-ec-crit-light`
    default: return base
  }
}

const inputClass = "w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors font-sans"

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
    return <div className="flex items-center justify-center py-20 text-sm text-ec-t3">Loading…</div>
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
      <div>
        <p className="text-sm text-ec-t3 mb-2">
          Record and track staff training activities, certifications, and compliance.
        </p>
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <PageActions onDownloadCsv={handleCsvDownload} />
          <button className="px-4 py-2 bg-ec-em text-white font-semibold rounded-lg text-sm border-none cursor-pointer hover:bg-ec-em-dark transition-colors flex items-center gap-1.5 font-sans" onClick={openAdd}>
            + Add Entry
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
          <span className="text-2xl font-bold text-ec-em block">{totalLogs}</span>
          <span className="text-xs text-ec-t3 mt-1 block">Total Records</span>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
          <span className="text-2xl font-bold text-ec-info block">{thisMonthCount}</span>
          <span className="text-xs text-ec-t3 mt-1 block">This Month</span>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <span className="text-2xl font-bold text-ec-warn block">{expiringSoon}</span>
          <span className="text-xs text-ec-t3 mt-1 block">Expiring / Expired</span>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
          <span className="text-2xl font-bold text-ec-em block">{staffTrained}</span>
          <span className="text-xs text-ec-t3 mt-1 block">Staff Trained</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ec-t3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg pl-9 pr-3 py-2 text-sm text-ec-t1 placeholder:text-ec-t3 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors font-sans"
            placeholder="Search staff, topic, or trainer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors font-sans" value={filterStaff} onChange={(e) => setFilterStaff(e.target.value)}>
          <option value="">All Staff</option>
          {uniqueStaff.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors font-sans" value={filterTopic} onChange={(e) => setFilterTopic(e.target.value)}>
          <option value="">All Topics</option>
          {uniqueTopics.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {(filterStaff || filterTopic || search) && (
          <button className="px-3 py-1.5 bg-white/[0.05] text-ec-t2 rounded-lg text-xs border border-white/[0.06] cursor-pointer hover:bg-white/[0.08] hover:text-ec-t1 transition-colors font-sans" onClick={() => { setFilterStaff(''); setFilterTopic(''); setSearch('') }}>
            Clear All
          </button>
        )}
      </div>

      <p className="text-xs text-ec-t3 mb-2">
        Showing {sorted.length} of {logs.length} entries
      </p>

      {sorted.length === 0 ? (
        <div className="text-center py-10 text-ec-t3 text-sm">
          <p>
            {logs.length === 0
              ? 'No training logs yet. Add your first entry to get started.'
              : 'No entries match your filters.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-white/[0.06]">Staff Member</th>
                <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-white/[0.06]">Date Completed</th>
                <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-white/[0.06]">Topic</th>
                <th className="hidden md:table-cell text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-white/[0.06]">Trainer</th>
                <th className="hidden md:table-cell text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-white/[0.06]">Cert. Expiry</th>
                <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-white/[0.06]">Status</th>
                <th className="hidden md:table-cell text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-white/[0.06]">Notes</th>
                <th className="hidden md:table-cell text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-white/[0.06]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((log) => {
                const status = getExpiryStatus(log.certificateExpiry)
                return (
                  <SwipeRow key={log.id} onEdit={() => openEdit(log)} onDelete={() => handleDelete(log.id)}>
                    <td className="px-4 py-2.5 text-ec-t1 border-b border-white/[0.04]">{log.staffName}</td>
                    <td className="px-4 py-2.5 text-ec-t1 border-b border-white/[0.04]">{formatDate(log.dateCompleted)}</td>
                    <td className="px-4 py-2.5 text-ec-t1 border-b border-white/[0.04]">{log.topic}</td>
                    <td className="hidden md:table-cell px-4 py-2.5 text-ec-t1 border-b border-white/[0.04]">{log.trainerName || '—'}</td>
                    <td className="hidden md:table-cell px-4 py-2.5 text-ec-t1 border-b border-white/[0.04]">{formatDate(log.certificateExpiry)}</td>
                    <td className="px-4 py-2.5 text-ec-t1 border-b border-white/[0.04]">
                      {status !== 'none' ? (
                        <span className={expiryBadgeClass(status)}>
                          {getExpiryLabel(status)}
                        </span>
                      ) : (
                        <span className="text-ec-t3">—</span>
                      )}
                    </td>
                    <td className="hidden md:table-cell px-4 py-2.5 text-ec-t3 border-b border-white/[0.04] max-w-[200px] truncate">{log.notes || '—'}</td>
                    <td className="hidden md:table-cell px-4 py-2.5 text-ec-t1 border-b border-white/[0.04]">
                      <div className="flex gap-1">
                        <button
                          className="px-2.5 py-1 bg-white/[0.05] text-ec-t2 rounded-lg text-xs border border-white/[0.06] cursor-pointer hover:bg-white/[0.08] hover:text-ec-t1 transition-colors font-sans"
                          onClick={() => openEdit(log)}
                        >
                          Edit
                        </button>
                        <button
                          className="px-2.5 py-1 bg-ec-crit/10 text-ec-crit-light rounded-lg text-xs border border-ec-crit/20 cursor-pointer hover:bg-ec-crit/20 transition-colors font-sans"
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
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs font-semibold text-ec-t2 mb-1 block">Staff Member *</label>
            {staffMembers.length === 0 ? (
              <p className="text-xs text-ec-t3 mt-1">
                No staff members configured.{' '}
                <a href="/settings" className="text-ec-em hover:underline">Add them in Settings</a>.
              </p>
            ) : (
              <select
                className={inputClass}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-ec-t2 mb-1 block">Date Completed *</label>
              <input
                type="date"
                className={inputClass}
                value={form.dateCompleted}
                onChange={update('dateCompleted')}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ec-t2 mb-1 block">Duration</label>
              <input
                type="text"
                className={inputClass}
                placeholder="e.g. 2 hours"
                value={form.duration}
                onChange={update('duration')}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-ec-t2 mb-1 block">Training Topic *</label>
            {topics.length === 0 ? (
              <input
                type="text"
                className={inputClass}
                placeholder="Enter training topic..."
                value={form.topic}
                onChange={update('topic')}
                required
              />
            ) : (
              <select
                className={inputClass}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-ec-t2 mb-1 block">Trainer Name</label>
              <input
                type="text"
                className={inputClass}
                placeholder="e.g. Amjid Shakoor"
                value={form.trainerName}
                onChange={update('trainerName')}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ec-t2 mb-1 block">Delivery Method</label>
              <select
                className={inputClass}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-ec-t2 mb-1 block">Outcome</label>
              <select
                className={inputClass}
                value={form.outcome}
                onChange={update('outcome')}
              >
                <option value="">Select...</option>
                {OUTCOMES.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-ec-t2 mb-1 block">Certificate Expiry</label>
              <input
                type="date"
                className={inputClass}
                value={form.certificateExpiry}
                onChange={update('certificateExpiry')}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-ec-t2 mb-1 block">Renewal Date</label>
            <input
              type="date"
              className={inputClass}
              value={form.renewalDate}
              onChange={update('renewalDate')}
            />
            <p className="text-xs text-ec-t3 mt-1">When this training needs to be renewed.</p>
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
            <button type="submit" className="px-4 py-2 bg-ec-em text-white font-semibold rounded-lg text-sm border-none cursor-pointer hover:bg-ec-em-dark transition-colors font-sans">
              {editingId ? 'Save Changes' : 'Add Entry'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
