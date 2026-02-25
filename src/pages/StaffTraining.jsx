import { useState, useMemo } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import { formatDate, generateId } from '../utils/helpers'
import { downloadCsv } from '../utils/exportCsv'
import Modal from '../components/Modal'
import PageActions from '../components/PageActions'

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

export default function StaffTraining() {
  const [entries, setEntries] = useSupabase('staff_training', [])
  const [staffMembers] = useSupabase('staff_members', [], { valueField: 'name' })
  const [filterStaff, setFilterStaff] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('staffName')
  const [sortDir, setSortDir] = useState('asc')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

  // Derive unique staff names and roles for filter dropdowns
  const staffNames = [...new Set(entries.map((e) => e.staffName))].sort()
  const roles = [...new Set(entries.map((e) => e.role))].sort()

  // Filter and search
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return entries.filter((e) => {
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
  }, [entries, filterStaff, filterRole, filterStatus, search])

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
    setEntries(
      entries.map((e) => {
        if (e.id !== id) return e
        const idx = STATUS_CYCLE.indexOf(e.status)
        const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
        return { ...e, status: next }
      })
    )
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
    } else {
      setEntries([...entries, { id: generateId(), ...form }])
    }
    setModalOpen(false)
  }

  const handleDelete = (id) => {
    if (window.confirm('Delete this training item?')) {
      setEntries(entries.filter((e) => e.id !== id))
    }
  }

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  // Summary counts
  const pendingCount = entries.filter((e) => e.status === 'Pending').length
  const inProgressCount = entries.filter((e) => e.status === 'In Progress').length
  const completeCount = entries.filter((e) => e.status === 'Complete').length

  const statusClass = (status) => {
    switch (status) {
      case 'Pending': return 'pending'
      case 'In Progress': return 'inprogress'
      case 'Complete': return 'complete'
      default: return ''
    }
  }

  // Progress per staff member (for the progress bar section)
  const staffProgress = useMemo(() => {
    const map = {}
    entries.forEach((e) => {
      if (!map[e.staffName]) map[e.staffName] = { total: 0, complete: 0, inProgress: 0, role: e.role }
      map[e.staffName].total++
      if (e.status === 'Complete') map[e.staffName].complete++
      if (e.status === 'In Progress') map[e.staffName].inProgress++
    })
    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [entries])

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
      <div className="page-header">
        <p className="page-desc">
          Track required training for all staff. Click a status badge to cycle
          through Pending → In Progress → Complete.
        </p>
        <div className="page-header-actions">
          <PageActions onDownloadCsv={handleCsvDownload} />
          <button className="btn btn--primary" onClick={openAdd}>
            + Add Training
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="training-summary">
        <div
          className={`training-summary-card training-summary-card--pending ${filterStatus === 'Pending' ? 'training-summary-card--selected' : ''}`}
          onClick={() => setFilterStatus(filterStatus === 'Pending' ? '' : 'Pending')}
        >
          <span className="training-summary-num">{pendingCount}</span>
          <span className="training-summary-label">Pending</span>
        </div>
        <div
          className={`training-summary-card training-summary-card--inprogress ${filterStatus === 'In Progress' ? 'training-summary-card--selected' : ''}`}
          onClick={() => setFilterStatus(filterStatus === 'In Progress' ? '' : 'In Progress')}
        >
          <span className="training-summary-num">{inProgressCount}</span>
          <span className="training-summary-label">In Progress</span>
        </div>
        <div
          className={`training-summary-card training-summary-card--complete ${filterStatus === 'Complete' ? 'training-summary-card--selected' : ''}`}
          onClick={() => setFilterStatus(filterStatus === 'Complete' ? '' : 'Complete')}
        >
          <span className="training-summary-num">{completeCount}</span>
          <span className="training-summary-label">Complete</span>
        </div>
      </div>

      {/* Staff Progress Bars */}
      <div className="progress-section">
        <h3 className="progress-section-title">Staff Progress</h3>
        <div className="progress-grid">
          {staffProgress.map((sp) => {
            const pct = sp.total > 0 ? Math.round((sp.complete / sp.total) * 100) : 0
            return (
              <div
                key={sp.name}
                className="progress-item"
                onClick={() => setFilterStaff(filterStaff === sp.name ? '' : sp.name)}
              >
                <div className="progress-item-header">
                  <span className="progress-item-name">{sp.name}</span>
                  <span className="progress-item-pct">{sp.complete}/{sp.total}</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="training-filters">
        <div className="search-box">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="input search-input"
            placeholder="Search staff, role, or training..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input input--inline"
          value={filterStaff}
          onChange={(e) => setFilterStaff(e.target.value)}
        >
          <option value="">All Staff</option>
          {staffNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <select
          className="input input--inline"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="">All Roles</option>
          {roles.map((role) => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
        <select
          className="input input--inline"
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
            className="btn btn--ghost btn--sm"
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
      <p className="results-count">
        Showing {sorted.length} of {entries.length} items
      </p>

      {/* Table */}
      {sorted.length === 0 ? (
        <div className="empty-state-box">
          <p className="empty-state">No training items match your filters.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                {SORT_FIELDS.map((field) => (
                  <th
                    key={field}
                    className={`sortable-th${field === 'role' ? ' mobile-hide' : ''}`}
                    onClick={() => handleSort(field)}
                  >
                    {SORT_LABELS[field]}
                    <span className="sort-indicator">
                      {sortField === field ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''}
                    </span>
                  </th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((entry) => (
                <tr key={entry.id} className={`training-row training-row--${statusClass(entry.status)}`}>
                  <td className="cell-bold">{entry.staffName}</td>
                  <td className="mobile-hide">{entry.role}</td>
                  <td>{entry.trainingItem}</td>
                  <td>{entry.targetDate ? formatDate(entry.targetDate) : 'Ongoing'}</td>
                  <td>
                    <button
                      className={`status-badge status-badge--${statusClass(entry.status)}`}
                      onClick={() => cycleStatus(entry.id)}
                      title="Click to change status"
                    >
                      {entry.status}
                    </button>
                  </td>
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

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Training Item' : 'Add Training Item'}
      >
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Staff Member *</label>
            <select
              className="input"
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

          <div className="form-group">
            <label className="label">Role *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Dispenser, Delivery Driver"
              value={form.role}
              onChange={update('role')}
              required
            />
          </div>

          <div className="form-group">
            <label className="label">Training Item *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Safeguarding Awareness"
              value={form.trainingItem}
              onChange={update('trainingItem')}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label">Target Date</label>
              <input
                type="date"
                className="input"
                value={form.targetDate}
                onChange={update('targetDate')}
              />
              <p className="form-hint">Leave blank for ongoing items.</p>
            </div>

            <div className="form-group">
              <label className="label">Status</label>
              <select
                className="input"
                value={form.status}
                onChange={update('status')}
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Complete">Complete</option>
              </select>
            </div>
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
              {editingId ? 'Save Changes' : 'Add Training'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
