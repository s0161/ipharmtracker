import { useState } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import { generateId, formatDate } from '../utils/helpers'
import { downloadCsv } from '../utils/exportCsv'
import { logAudit } from '../utils/auditLog'
import { useToast } from '../components/Toast'
import { useUser } from '../contexts/UserContext'
import Modal from '../components/Modal'
import PageActions from '../components/PageActions'
import { useConfirm } from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import SkeletonLoader from '../components/SkeletonLoader'

const CATEGORIES = [
  'Dispensing Error',
  'Wrong Patient',
  'Wrong Drug',
  'Wrong Strength',
  'Wrong Quantity',
  'Wrong Label',
  'Wrong Directions',
  'Other',
]
const STATUSES = ['Open', 'Action Taken', 'Resolved']
const SEVERITIES = ['Low', 'Medium', 'High']

const emptyForm = {
  date: new Date().toISOString().slice(0, 10),
  description: '',
  whoInvolved: '',
  category: '',
  severity: 'Low',
  rootCause: '',
  learningAction: '',
  actionTakenBy: '',
  actionDate: '',
  status: 'Open',
}

const inputClass =
  'w-full bg-ec-card border border-ec-border rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors font-sans'

const inputErrorClass =
  'w-full bg-ec-card border border-red-500 rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-500/20 transition-colors font-sans'

const severityBadge = (sev) => {
  const cls =
    sev === 'High'
      ? 'bg-ec-crit/10 text-ec-crit-light'
      : sev === 'Medium'
        ? 'bg-ec-warn/10 text-ec-warn'
        : 'bg-ec-em/10 text-ec-em'
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {sev}
    </span>
  )
}

const categoryBadge = (cat) => {
  const cls =
    cat === 'Wrong Drug' || cat === 'Wrong Patient'
      ? 'bg-ec-crit/10 text-ec-crit-light'
      : cat === 'Dispensing Error'
        ? 'bg-ec-warn/10 text-ec-warn'
        : 'bg-ec-border text-ec-t2'
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {cat}
    </span>
  )
}

const statusBadge = (status) => {
  const cls =
    status === 'Open'
      ? 'bg-ec-crit/10 text-ec-crit-light'
      : status === 'Action Taken'
        ? 'bg-ec-warn/10 text-ec-warn'
        : 'bg-ec-em/10 text-ec-em'
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {status}
    </span>
  )
}

export default function NearMissLog() {
  const [entries, setEntries, loading] = useSupabase('near_misses', [])
  const [staffMembers] = useSupabase('staff_members', [], {
    valueField: 'name',
  })
  const showToast = useToast()
  const { user } = useUser()
  const { confirm, ConfirmDialog } = useConfirm()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [formErrors, setFormErrors] = useState({})

  const openAdd = () => {
    setForm(emptyForm)
    setEditingId(null)
    setFormErrors({})
    setModalOpen(true)
  }

  const openEdit = (entry) => {
    setForm({
      date: entry.date || '',
      description: entry.description || '',
      whoInvolved: entry.whoInvolved || '',
      category: entry.category || '',
      severity: entry.severity || 'Low',
      rootCause: entry.rootCause || '',
      learningAction: entry.learningAction || '',
      actionTakenBy: entry.actionTakenBy || '',
      actionDate: entry.actionDate || '',
      status: entry.status || 'Open',
    })
    setEditingId(entry.id)
    setFormErrors({})
    setModalOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errors = {}
    if (!form.category) errors.category = 'Category is required'
    if (!form.description) errors.description = 'Description is required'
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    setFormErrors({})

    if (editingId) {
      setEntries(
        entries.map((entry) =>
          entry.id === editingId ? { ...entry, ...form } : entry
        )
      )
      logAudit('Updated near miss', form.category, 'Near Misses', user?.name)
      showToast('Near miss updated')
    } else {
      setEntries([
        ...entries,
        { id: generateId(), ...form, createdAt: new Date().toISOString() },
      ])
      logAudit('Created near miss', form.category, 'Near Misses', user?.name)
      showToast('Near miss recorded')
    }
    setModalOpen(false)
  }

  const handleDelete = async (entry) => {
    const ok = await confirm({
      title: 'Delete near miss?',
      message: 'Are you sure you want to delete this near miss? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    })
    if (!ok) return
    setEntries(entries.filter((e) => e.id !== entry.id))
    logAudit('Deleted near miss', entry.category, 'Near Misses', user?.name)
    showToast('Near miss deleted', 'info')
  }

  const update = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value })
    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: undefined })
    }
  }

  const handleCsvDownload = () => {
    const headers = [
      'Date',
      'Category',
      'Severity',
      'Description',
      'Who Involved',
      'Root Cause',
      'Learning Action',
      'Action Taken By',
      'Action Date',
      'Status',
    ]
    const rows = sorted.map((e) => [
      e.date || '',
      e.category || '',
      e.severity || '',
      e.description || '',
      e.whoInvolved || '',
      e.rootCause || '',
      e.learningAction || '',
      e.actionTakenBy || '',
      e.actionDate || '',
      e.status || '',
    ])
    downloadCsv('near-misses', headers, rows)
  }

  const renderForm = () => (
    <form
      className="space-y-4 max-h-[70vh] overflow-y-auto"
      onSubmit={handleSubmit}
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-ec-t2 mb-1 block">
            Date *
          </label>
          <input
            type="date"
            className={inputClass}
            value={form.date}
            onChange={update('date')}
            required
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-ec-t2 mb-1 block">
            Category *
          </label>
          <select
            className={formErrors.category ? inputErrorClass : inputClass}
            value={form.category}
            onChange={update('category')}
            required
          >
            <option value="">Select category...</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {formErrors.category && (
            <p className="text-xs text-red-500 mt-1">{formErrors.category}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-ec-t2 mb-1 block">
            Severity *
          </label>
          <select
            className={inputClass}
            value={form.severity}
            onChange={update('severity')}
            required
          >
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-ec-t2 mb-1 block">
            Who Involved
          </label>
          {staffMembers.length === 0 ? (
            <input
              type="text"
              className={inputClass}
              placeholder="Enter name"
              value={form.whoInvolved}
              onChange={update('whoInvolved')}
            />
          ) : (
            <select
              className={inputClass}
              value={form.whoInvolved}
              onChange={update('whoInvolved')}
            >
              <option value="">Select person...</option>
              {staffMembers.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-ec-t2 mb-1 block">
          Description *
        </label>
        <textarea
          className={(formErrors.description ? inputErrorClass : inputClass) + ' resize-none'}
          placeholder="Describe the near miss..."
          value={form.description}
          onChange={update('description')}
          rows={3}
          required
        />
        {formErrors.description && (
          <p className="text-xs text-red-500 mt-1">{formErrors.description}</p>
        )}
      </div>

      <div>
        <label className="text-xs font-semibold text-ec-t2 mb-1 block">
          Root Cause
        </label>
        <textarea
          className={inputClass + ' resize-none'}
          placeholder="What caused this near miss?"
          value={form.rootCause}
          onChange={update('rootCause')}
          rows={2}
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-ec-t2 mb-1 block">
          Learning Action
        </label>
        <textarea
          className={inputClass + ' resize-none'}
          placeholder="What was learned? What changes were made?"
          value={form.learningAction}
          onChange={update('learningAction')}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-ec-t2 mb-1 block">
            Action Taken By
          </label>
          {staffMembers.length === 0 ? (
            <input
              type="text"
              className={inputClass}
              placeholder="Enter name"
              value={form.actionTakenBy}
              onChange={update('actionTakenBy')}
            />
          ) : (
            <select
              className={inputClass}
              value={form.actionTakenBy}
              onChange={update('actionTakenBy')}
            >
              <option value="">Select person...</option>
              {staffMembers.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="text-xs font-semibold text-ec-t2 mb-1 block">
            Action Date
          </label>
          <input
            type="date"
            className={inputClass}
            value={form.actionDate}
            onChange={update('actionDate')}
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-ec-t2 mb-1 block">
          Status
        </label>
        <select
          className={inputClass}
          value={form.status}
          onChange={update('status')}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-ec-div">
        <button
          type="button"
          className="px-4 py-2 bg-ec-card-hover text-ec-t2 rounded-lg text-sm border border-ec-border cursor-pointer hover:bg-ec-t5 transition-colors font-sans"
          onClick={() => setModalOpen(false)}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-ec-em text-white font-semibold rounded-lg text-sm border-none cursor-pointer hover:bg-ec-em-dark transition-colors font-sans"
        >
          {editingId ? 'Save Changes' : 'Record Near Miss'}
        </button>
      </div>
    </form>
  )

  if (loading) {
    return <SkeletonLoader variant="table" />
  }

  // Stats
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const thisMonth = entries.filter((e) => {
    if (!e.date) return false
    const d = new Date(e.date + 'T00:00:00')
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })
  const totalThisMonth = thisMonth.length
  const resolvedCount = entries.filter((e) => e.status === 'Resolved').length
  const resolvedPct =
    entries.length > 0 ? Math.round((resolvedCount / entries.length) * 100) : 0
  const openCount = entries.filter((e) => e.status !== 'Resolved').length

  // Filtering
  const filtered = entries.filter((e) => {
    if (filterCategory && e.category !== filterCategory) return false
    if (filterStatus && e.status !== filterStatus) return false
    if (search) {
      const q = search.toLowerCase()
      const matchDesc = (e.description || '').toLowerCase().includes(q)
      const matchWho = (e.whoInvolved || '').toLowerCase().includes(q)
      const matchRoot = (e.rootCause || '').toLowerCase().includes(q)
      if (!matchDesc && !matchWho && !matchRoot) return false
    }
    return true
  })

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
  )

  if (entries.length === 0) {
    return (
      <div>
        <p className="text-sm text-ec-t3 mb-2">
          Track near misses, identify root causes, and record learning actions.
        </p>
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <button
            className="px-4 py-2 bg-ec-em text-white font-semibold rounded-lg text-sm border-none cursor-pointer hover:bg-ec-em-dark transition-colors flex items-center gap-1.5 font-sans"
            onClick={openAdd}
          >
            + Add Near Miss
          </button>
        </div>
        <EmptyState
          icon={<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>}
          title="No near misses logged"
          description="Near miss reports will appear here. Recording near misses helps prevent future incidents."
        />
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Record Near Miss"
        >
          {renderForm()}
        </Modal>
        {ConfirmDialog}
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm text-ec-t3 mb-2">
        Track near misses, identify root causes, and record learning actions.
      </p>

      {/* Summary stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: 'var(--ec-card)',
            border: '1px solid var(--ec-border)',
          }}
        >
          <div className="text-2xl font-bold text-ec-t1">{totalThisMonth}</div>
          <div className="text-xs text-ec-t3 mt-1">Total This Month</div>
        </div>
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: 'var(--ec-card)',
            border: '1px solid var(--ec-border)',
          }}
        >
          <div className="text-2xl font-bold text-ec-t1">{resolvedPct}%</div>
          <div className="text-xs text-ec-t3 mt-1">Resolved</div>
        </div>
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: 'var(--ec-card)',
            border: '1px solid var(--ec-border)',
          }}
        >
          <div className="text-2xl font-bold text-ec-t1">{openCount}</div>
          <div className="text-xs text-ec-t3 mt-1">Open Items</div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <PageActions onDownloadCsv={handleCsvDownload} />
        <select
          className="bg-ec-card border border-ec-border rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors font-sans"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          className="bg-ec-card border border-ec-border rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors font-sans"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          type="text"
          className="bg-ec-card border border-ec-border rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors font-sans"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className="px-4 py-2 bg-ec-em text-white font-semibold rounded-lg text-sm border-none cursor-pointer hover:bg-ec-em-dark transition-colors flex items-center gap-1.5 font-sans"
          onClick={openAdd}
        >
          + Add Near Miss
        </button>
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <div className="text-center py-10 text-ec-t3 text-sm">
          <p>No near misses match the current filters.</p>
        </div>
      ) : (
        <div
          className="overflow-x-auto rounded-xl"
          style={{ border: '1px solid var(--ec-border)' }}
        >
          <table
            className="w-full text-sm"
            style={{ borderCollapse: 'collapse' }}
          >
            <thead>
              <tr>
                <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">
                  Date
                </th>
                <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">
                  Category
                </th>
                <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">
                  Severity
                </th>
                <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">
                  Description
                </th>
                <th className="hidden md:table-cell text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">
                  Status
                </th>
                <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((entry) => (
                <>
                  <tr
                    key={entry.id}
                    className="cursor-pointer hover:bg-ec-card transition-colors"
                    onClick={() =>
                      setExpandedId(
                        expandedId === entry.id ? null : entry.id
                      )
                    }
                  >
                    <td className="px-4 py-2.5 text-ec-t1 border-b border-ec-div">
                      {formatDate(entry.date)}
                    </td>
                    <td className="px-4 py-2.5 border-b border-ec-div">
                      {categoryBadge(entry.category)}
                    </td>
                    <td className="px-4 py-2.5 border-b border-ec-div">
                      {severityBadge(entry.severity)}
                    </td>
                    <td className="px-4 py-2.5 text-ec-t1 border-b border-ec-div max-w-[250px] truncate">
                      {(entry.description || '').length > 60
                        ? entry.description.slice(0, 60) + '...'
                        : entry.description || ''}
                    </td>
                    <td className="hidden md:table-cell px-4 py-2.5 border-b border-ec-div">
                      {statusBadge(entry.status)}
                    </td>
                    <td className="px-4 py-2.5 border-b border-ec-div">
                      <div
                        className="flex gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="px-2.5 py-1 bg-ec-card-hover text-ec-t2 rounded-lg text-xs border border-ec-border cursor-pointer hover:bg-ec-t5 hover:text-ec-t1 transition-colors font-sans"
                          onClick={() => openEdit(entry)}
                        >
                          Edit
                        </button>
                        <button
                          className="px-2.5 py-1 bg-ec-crit/10 text-ec-crit-light rounded-lg text-xs border border-ec-crit/20 cursor-pointer hover:bg-ec-crit/20 transition-colors font-sans"
                          onClick={() => handleDelete(entry)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === entry.id && (
                    <tr key={entry.id + '-detail'}>
                      <td
                        colSpan={6}
                        className="px-4 py-4 border-b border-ec-div"
                        style={{
                          backgroundColor: 'var(--ec-card)',
                        }}
                      >
                        <div className="pl-4 space-y-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <span className="text-xs font-semibold text-ec-t3">
                                Root Cause
                              </span>
                              <p className="text-sm text-ec-t1 mt-0.5">
                                {entry.rootCause || '\u2014'}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs font-semibold text-ec-t3">
                                Learning Action
                              </span>
                              <p className="text-sm text-ec-t1 mt-0.5">
                                {entry.learningAction || '\u2014'}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs font-semibold text-ec-t3">
                                Action Taken By
                              </span>
                              <p className="text-sm text-ec-t1 mt-0.5">
                                {entry.actionTakenBy || '\u2014'}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs font-semibold text-ec-t3">
                                Action Date
                              </span>
                              <p className="text-sm text-ec-t1 mt-0.5">
                                {formatDate(entry.actionDate)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Near Miss' : 'Record Near Miss'}
      >
        {renderForm()}
      </Modal>
      {ConfirmDialog}
    </div>
  )
}
