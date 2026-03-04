import { useState, useMemo } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import { logAudit } from '../utils/auditLog'
import { useUser } from '../contexts/UserContext'
import { formatDate, generateId } from '../utils/helpers'
import { downloadCsv } from '../utils/exportCsv'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'
import PageActions from '../components/PageActions'
import SwipeRow from '../components/SwipeRow'
import { useConfirm } from '../components/ConfirmDialog'

const STATUS_CYCLE = ['Pending', 'In Progress', 'Complete']

const SORT_FIELDS = ['staffName', 'role', 'trainingItem', 'targetDate', 'status']
const SORT_LABELS = {
  staffName: 'Staff Name',
  role: 'Role',
  trainingItem: 'Training Item',
  targetDate: 'Target Date',
  status: 'Status',
}

const emptyForm = {
  staffName: '',
  role: '',
  trainingItem: '',
  targetDate: '',
  status: 'Pending',
}

const statusBadgeClass = (status) => {
  const base = "px-2.5 py-0.5 rounded-full text-xs font-semibold border-none cursor-pointer transition-colors font-sans"
  switch (status) {
    case 'Pending': return `${base} bg-ec-warn/10 text-ec-warn hover:bg-ec-warn/20`
    case 'In Progress': return `${base} bg-ec-info/10 text-ec-info-light hover:bg-ec-info/20`
    case 'Complete': return `${base} bg-ec-em/10 text-ec-em hover:bg-ec-em/20`
    default: return base
  }
}

const inputClass = "w-full bg-ec-card border border-ec-border rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors font-sans"

export default function StaffTraining() {
  const { user } = useUser()
  const [entries, setEntries, loading] = useSupabase('staff_training', [])
  const [staffMembers] = useSupabase('staff_members', [], { valueField: 'name' })
  const showToast = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  const [filterStaff, setFilterStaff] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('staffName')
  const [sortDir, setSortDir] = useState('asc')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-sm text-ec-t3">Loading…</div>
  }

  // Deduplicate: one row per staff per training item (keep most recent by id)
  const uniqueEntries = (() => {
    const map = new Map()
    entries.forEach(e => {
      const key = `${e.staffName}|${e.trainingItem}`
      const existing = map.get(key)
      if (!existing || (e.id > existing.id)) {
        map.set(key, e)
      }
    })
    return [...map.values()]
  })()

  // Derive unique staff names and roles for filter dropdowns
  const staffNames = [...new Set(uniqueEntries.map((e) => e.staffName))].sort()
  const roles = [...new Set(uniqueEntries.map((e) => e.role))].sort()

  // Filter and search
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return uniqueEntries.filter((e) => {
      if (filterStaff && e.staffName !== filterStaff) return false
      if (filterRole && e.role !== filterRole) return false
      if (filterStatus && e.status !== filterStatus) return false
      if (
        q &&
        !e.staffName.toLowerCase().includes(q) &&
        !e.role.toLowerCase().includes(q) &&
        !e.trainingItem.toLowerCase().includes(q)
      )
        return false
      return true
    })
  }, [uniqueEntries, filterStaff, filterRole, filterStatus, search])

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal = a[sortField] || ''
      let bVal = b[sortField] || ''
      const cmp = aVal.localeCompare(bVal)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortField, sortDir])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const cycleStatus = (id) => {
    const entry = entries.find((e) => e.id === id)
    const idx = STATUS_CYCLE.indexOf(entry?.status)
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
    setEntries(
      entries.map((e) => {
        if (e.id !== id) return e
        return { ...e, status: next }
      })
    )
    logAudit('Updated', `Training: ${entry?.trainingItem} for ${entry?.staffName} -> ${next}`, 'Staff Training', user?.name)
  }

  // CRUD
  const openAdd = () => {
    setForm(emptyForm)
    setEditingId(null)
    setModalOpen(true)
  }

  const openEdit = (entry) => {
    setForm({
      staffName: entry.staffName,
      role: entry.role,
      trainingItem: entry.trainingItem,
      targetDate: entry.targetDate,
      status: entry.status,
    })
    setEditingId(entry.id)
    setModalOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.staffName || !form.trainingItem) return

    if (editingId) {
      setEntries(entries.map((e) => (e.id === editingId ? { ...e, ...form } : e)))
      logAudit('Updated', `Training: ${form.trainingItem} for ${form.staffName}`, 'Staff Training', user?.name)
      showToast('Training item updated')
    } else {
      setEntries([...entries, { id: generateId(), ...form }])
      logAudit('Created', `Training: ${form.trainingItem} for ${form.staffName}`, 'Staff Training', user?.name)
      showToast('Training item added')
    }
    setModalOpen(false)
  }

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Delete training item?',
      message: 'Are you sure you want to delete this training item? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    })
    if (!ok) return
    const entry = entries.find((e) => e.id === id)
    setEntries(entries.filter((e) => e.id !== id))
    logAudit('Deleted', `Training: ${entry?.trainingItem} for ${entry?.staffName}`, 'Staff Training', user?.name)
    showToast('Training item deleted', 'info')
  }

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  // Summary counts
  const pendingCount = uniqueEntries.filter((e) => e.status === 'Pending').length
  const inProgressCount = uniqueEntries.filter((e) => e.status === 'In Progress').length
  const completeCount = uniqueEntries.filter((e) => e.status === 'Complete').length

  // Progress per staff member (for the progress bar section)
  const staffProgress = useMemo(() => {
    const map = {}
    uniqueEntries.forEach((e) => {
      if (!map[e.staffName]) map[e.staffName] = { total: 0, complete: 0, inProgress: 0, role: e.role }
      map[e.staffName].total++
      if (e.status === 'Complete') map[e.staffName].complete++
      if (e.status === 'In Progress') map[e.staffName].inProgress++
    })
    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [uniqueEntries])

  const handleCsvDownload = () => {
    const headers = ['Staff Name', 'Role', 'Training Item', 'Target Date', 'Status']
    const rows = sorted.map((e) => [
      e.staffName,
      e.role,
      e.trainingItem,
      e.targetDate || 'Ongoing',
      e.status,
    ])
    downloadCsv('staff-training', headers, rows)
  }

  return (
    <div>
      <div>
        <p className="text-sm text-ec-t3 mb-2">
          Track required training for all staff. Click a status badge to cycle
          through Pending → In Progress → Complete.
        </p>
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <PageActions onDownloadCsv={handleCsvDownload} />
          <button className="px-4 py-2 bg-ec-em text-white font-semibold rounded-lg text-sm border-none cursor-pointer hover:bg-ec-em-dark transition-colors flex items-center gap-1.5 font-sans" onClick={openAdd}>
            + Add Training
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div
          className="rounded-xl p-4 text-center cursor-pointer transition-colors"
          style={{ backgroundColor: 'rgba(245,158,11,0.06)', border: filterStatus === 'Pending' ? '2px solid #f59e0b' : '1px solid rgba(245,158,11,0.15)' }}
          onClick={() => setFilterStatus(filterStatus === 'Pending' ? '' : 'Pending')}
        >
          <span className="text-2xl font-bold block text-ec-warn">{pendingCount}</span>
          <span className="text-xs text-ec-t3 mt-1 block">Pending</span>
        </div>
        <div
          className="rounded-xl p-4 text-center cursor-pointer transition-colors"
          style={{ backgroundColor: 'rgba(99,102,241,0.06)', border: filterStatus === 'In Progress' ? '2px solid #6366f1' : '1px solid rgba(99,102,241,0.15)' }}
          onClick={() => setFilterStatus(filterStatus === 'In Progress' ? '' : 'In Progress')}
        >
          <span className="text-2xl font-bold block text-ec-info">{inProgressCount}</span>
          <span className="text-xs text-ec-t3 mt-1 block">In Progress</span>
        </div>
        <div
          className="rounded-xl p-4 text-center cursor-pointer transition-colors"
          style={{ backgroundColor: 'rgba(16,185,129,0.06)', border: filterStatus === 'Complete' ? '2px solid #10b981' : '1px solid rgba(16,185,129,0.15)' }}
          onClick={() => setFilterStatus(filterStatus === 'Complete' ? '' : 'Complete')}
        >
          <span className="text-2xl font-bold block text-ec-em">{completeCount}</span>
          <span className="text-xs text-ec-t3 mt-1 block">Complete</span>
        </div>
      </div>

      {/* Staff Progress Bars */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-ec-t1 mb-3">Staff Progress</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {staffProgress.map((sp) => {
            const pct = sp.total > 0 ? Math.round((sp.complete / sp.total) * 100) : 0
            return (
              <div
                key={sp.name}
                className="rounded-xl p-3 cursor-pointer transition-colors hover:bg-ec-card"
                style={{ backgroundColor: 'var(--ec-card)', border: '1px solid var(--ec-border)' }}
                onClick={() => setFilterStaff(filterStaff === sp.name ? '' : sp.name)}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-ec-t1 font-medium truncate">{sp.name}</span>
                  <span className="text-xs text-ec-t3 tabular-nums">{sp.complete}/{sp.total}</span>
                </div>
                <div className="h-1.5 rounded-full bg-ec-border overflow-hidden">
                  <div
                    className="h-full rounded-full bg-ec-em transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ec-t3" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="w-full bg-ec-card border border-ec-border rounded-lg pl-9 pr-3 py-2 text-sm text-ec-t1 placeholder:text-ec-t3 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors font-sans"
            placeholder="Search staff, role, or training..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="bg-ec-card border border-ec-border rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors font-sans"
          value={filterStaff}
          onChange={(e) => setFilterStaff(e.target.value)}
        >
          <option value="">All Staff</option>
          {staffNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <select
          className="bg-ec-card border border-ec-border rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors font-sans"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="">All Roles</option>
          {roles.map((role) => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
        <select
          className="bg-ec-card border border-ec-border rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors font-sans"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Complete">Complete</option>
        </select>
        {(filterStaff || filterRole || filterStatus || search) && (
          <button
            className="px-3 py-1.5 bg-ec-card-hover text-ec-t2 rounded-lg text-xs border border-ec-border cursor-pointer hover:bg-ec-t5 hover:text-ec-t1 transition-colors font-sans"
            onClick={() => {
              setFilterStaff('')
              setFilterRole('')
              setFilterStatus('')
              setSearch('')
            }}
          >
            Clear All
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="text-xs text-ec-t3 mb-2">
        Showing {sorted.length} of {uniqueEntries.length} items
      </p>

      {/* Table */}
      {sorted.length === 0 ? (
        <div className="text-center py-10 text-ec-t3 text-sm">No training items match your filters.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--ec-border)' }}>
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {SORT_FIELDS.map((field) => (
                  <th
                    key={field}
                    className={`text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border cursor-pointer hover:text-ec-t2 transition-colors select-none${field === 'role' ? ' hidden md:table-cell' : ''}`}
                    onClick={() => handleSort(field)}
                  >
                    {SORT_LABELS[field]}
                    <span className="ml-1 text-ec-t3">
                      {sortField === field ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''}
                    </span>
                  </th>
                ))}
                <th className="hidden md:table-cell text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border select-none">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((entry) => (
                <SwipeRow key={entry.id} className="hover:bg-ec-card transition-colors" onEdit={() => openEdit(entry)} onDelete={() => handleDelete(entry.id)}>
                  <td className="px-4 py-2.5 text-ec-t1 border-b border-ec-div font-medium">{entry.staffName}</td>
                  <td className="hidden md:table-cell px-4 py-2.5 text-ec-t1 border-b border-ec-div">{entry.role}</td>
                  <td className="px-4 py-2.5 text-ec-t1 border-b border-ec-div">{entry.trainingItem}</td>
                  <td className="px-4 py-2.5 text-ec-t1 border-b border-ec-div">{entry.targetDate ? formatDate(entry.targetDate) : 'Ongoing'}</td>
                  <td className="px-4 py-2.5 text-ec-t1 border-b border-ec-div">
                    <button
                      className={statusBadgeClass(entry.status)}
                      onClick={() => cycleStatus(entry.id)}
                      title="Click to change status"
                    >
                      {entry.status}
                    </button>
                  </td>
                  <td className="hidden md:table-cell px-4 py-2.5 text-ec-t1 border-b border-ec-div">
                    <div className="flex gap-1">
                      <button
                        className="px-2.5 py-1 bg-ec-card-hover text-ec-t2 rounded-lg text-xs border border-ec-border cursor-pointer hover:bg-ec-t5 hover:text-ec-t1 transition-colors font-sans"
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

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Training Item' : 'Add Training Item'}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs font-semibold text-ec-t2 mb-1 block">Staff Member *</label>
            <select
              className={inputClass}
              value={form.staffName}
              onChange={(e) => {
                const name = e.target.value
                // Auto-fill role if staff has existing entries
                const existing = entries.find((en) => en.staffName === name)
                setForm({
                  ...form,
                  staffName: name,
                  role: existing ? existing.role : form.role,
                })
              }}
              required
            >
              <option value="">Select staff member...</option>
              {staffMembers.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-ec-t2 mb-1 block">Role *</label>
            <input
              type="text"
              className={inputClass}
              placeholder="e.g. Dispenser, Delivery Driver"
              value={form.role}
              onChange={update('role')}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-ec-t2 mb-1 block">Training Item *</label>
            <input
              type="text"
              className={inputClass}
              placeholder="e.g. Safeguarding Awareness"
              value={form.trainingItem}
              onChange={update('trainingItem')}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-ec-t2 mb-1 block">Target Date</label>
              <input
                type="date"
                className={inputClass}
                value={form.targetDate}
                onChange={update('targetDate')}
              />
              <p className="text-xs text-ec-t3 mt-1">Leave blank for ongoing items.</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-ec-t2 mb-1 block">Status</label>
              <select
                className={inputClass}
                value={form.status}
                onChange={update('status')}
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Complete">Complete</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-ec-div">
            <button
              type="button"
              className="px-4 py-2 bg-ec-card-hover text-ec-t2 rounded-lg text-sm border border-ec-border cursor-pointer hover:bg-ec-t5 transition-colors font-sans"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-ec-em text-white font-semibold rounded-lg text-sm border-none cursor-pointer hover:bg-ec-em-dark transition-colors font-sans">
              {editingId ? 'Save Changes' : 'Add Training'}
            </button>
          </div>
        </form>
      </Modal>
      {ConfirmDialog}
    </div>
  )
}
