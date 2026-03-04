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

const TYPES = ['Near Miss', 'Dispensing Error', 'Complaint', 'Other']
const SEVERITIES = ['Low', 'Medium', 'High']
const emptyForm = {
  type: '',
  description: '',
  severity: 'Low',
  date: new Date().toISOString().slice(0, 10),
  reportedBy: '',
  actionTaken: '',
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

const typeBadge = (type) => {
  const cls =
    type === 'Near Miss'
      ? 'bg-ec-warn/10 text-ec-warn'
      : type === 'Dispensing Error'
        ? 'bg-ec-crit/10 text-ec-crit-light'
        : type === 'Complaint'
          ? 'bg-ec-info/10 text-ec-info-light'
          : 'bg-ec-border text-ec-t2'
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {type}
    </span>
  )
}

export default function Incidents() {
  const [incidents, setIncidents, loading] = useSupabase('incidents', [])
  const [staffMembers] = useSupabase('staff_members', [], { valueField: 'name' })
  const showToast = useToast()
  const { user } = useUser()
  const { confirm, ConfirmDialog } = useConfirm()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [filterType, setFilterType] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('')
  const [search, setSearch] = useState('')
  const [formErrors, setFormErrors] = useState({})

  const openAdd = () => {
    setForm(emptyForm)
    setEditingId(null)
    setFormErrors({})
    setModalOpen(true)
  }

  const openEdit = (inc) => {
    setForm({
      type: inc.type || '',
      description: inc.description || '',
      severity: inc.severity || 'Low',
      date: inc.date || '',
      reportedBy: inc.reportedBy || '',
      actionTaken: inc.actionTaken || '',
    })
    setEditingId(inc.id)
    setFormErrors({})
    setModalOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errors = {}
    if (!form.type) errors.type = 'Type is required'
    if (!form.description) errors.description = 'Description is required'
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    setFormErrors({})

    if (editingId) {
      setIncidents(
        incidents.map((inc) =>
          inc.id === editingId ? { ...inc, ...form } : inc
        )
      )
      logAudit('Updated incident', form.type, 'Incidents', user?.name)
      showToast('Incident updated')
    } else {
      setIncidents([
        ...incidents,
        { id: generateId(), ...form, createdAt: new Date().toISOString() },
      ])
      logAudit('Created incident', form.type, 'Incidents', user?.name)
      showToast('Incident recorded')
    }
    setModalOpen(false)
  }

  const handleDelete = async (inc) => {
    const ok = await confirm({
      title: 'Delete incident?',
      message: 'Are you sure you want to delete this incident? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    })
    if (!ok) return
    setIncidents(incidents.filter((i) => i.id !== inc.id))
    logAudit('Deleted incident', inc.type, 'Incidents', user?.name)
    showToast('Incident deleted', 'info')
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
      'Type',
      'Severity',
      'Description',
      'Reported By',
      'Action Taken',
    ]
    const rows = sorted.map((inc) => [
      inc.date || '',
      inc.type || '',
      inc.severity || '',
      inc.description || '',
      inc.reportedBy || '',
      inc.actionTaken || '',
    ])
    downloadCsv('incidents', headers, rows)
  }

  const renderForm = () => (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-ec-t2 mb-1 block">
            Type *
          </label>
          <select
            className={formErrors.type ? inputErrorClass : inputClass}
            value={form.type}
            onChange={update('type')}
            required
          >
            <option value="">Select type...</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {formErrors.type && (
            <p className="text-xs text-red-500 mt-1">{formErrors.type}</p>
          )}
        </div>
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
            Reported By
          </label>
          {staffMembers.length === 0 ? (
            <input
              type="text"
              className={inputClass}
              placeholder="Enter name"
              value={form.reportedBy}
              onChange={update('reportedBy')}
            />
          ) : (
            <select
              className={inputClass}
              value={form.reportedBy}
              onChange={update('reportedBy')}
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
          placeholder="Describe the incident..."
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
          Action Taken
        </label>
        <textarea
          className={inputClass + ' resize-none'}
          placeholder="What action was taken?"
          value={form.actionTaken}
          onChange={update('actionTaken')}
          rows={3}
        />
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
          {editingId ? 'Save Changes' : 'Record Incident'}
        </button>
      </div>
    </form>
  )

  if (loading) {
    return <SkeletonLoader variant="table" />
  }

  const filtered = incidents.filter((inc) => {
    if (filterType && inc.type !== filterType) return false
    if (filterSeverity && inc.severity !== filterSeverity) return false
    if (search) {
      const q = search.toLowerCase()
      const matchDesc = (inc.description || '').toLowerCase().includes(q)
      const matchReported = (inc.reportedBy || '').toLowerCase().includes(q)
      if (!matchDesc && !matchReported) return false
    }
    return true
  })

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
  )

  if (incidents.length === 0) {
    return (
      <div>
        <p className="text-sm text-ec-t3 mb-2">
          Record and track pharmacy incidents, complaints, and near misses.
        </p>
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <button
            className="px-4 py-2 bg-ec-em text-white font-semibold rounded-lg text-sm border-none cursor-pointer hover:bg-ec-em-dark transition-colors flex items-center gap-1.5 font-sans"
            onClick={openAdd}
          >
            + Add Incident
          </button>
        </div>
        <EmptyState
          icon={<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>}
          title="No incidents recorded"
          description="Incidents will appear here once logged. Use the button above to record one."
        />
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Record Incident"
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
        Record and track pharmacy incidents, complaints, and near misses.
      </p>

      <div className="flex items-center gap-2 flex-wrap mb-4">
        <PageActions onDownloadCsv={handleCsvDownload} />
        <select
          className="bg-ec-card border border-ec-border rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors font-sans"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">All Types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          className="bg-ec-card border border-ec-border rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors font-sans"
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
        >
          <option value="">All Severities</option>
          {SEVERITIES.map((s) => (
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
          + Add Incident
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-10 text-ec-t3 text-sm">
          <p>No incidents match the current filters.</p>
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
                  Type
                </th>
                <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">
                  Severity
                </th>
                <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">
                  Description
                </th>
                <th className="hidden md:table-cell text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">
                  Reported By
                </th>
                <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((inc) => (
                <tr key={inc.id}>
                  <td className="px-4 py-2.5 text-ec-t1 border-b border-ec-div">
                    {formatDate(inc.date)}
                  </td>
                  <td className="px-4 py-2.5 border-b border-ec-div">
                    {typeBadge(inc.type)}
                  </td>
                  <td className="px-4 py-2.5 border-b border-ec-div">
                    {severityBadge(inc.severity)}
                  </td>
                  <td className="px-4 py-2.5 text-ec-t1 border-b border-ec-div max-w-[250px] truncate">
                    {(inc.description || '').length > 60
                      ? inc.description.slice(0, 60) + '...'
                      : inc.description || ''}
                  </td>
                  <td className="hidden md:table-cell px-4 py-2.5 text-ec-t1 border-b border-ec-div">
                    {inc.reportedBy || '\u2014'}
                  </td>
                  <td className="px-4 py-2.5 border-b border-ec-div">
                    <div className="flex gap-1">
                      <button
                        className="px-2.5 py-1 bg-ec-card-hover text-ec-t2 rounded-lg text-xs border border-ec-border cursor-pointer hover:bg-ec-t5 hover:text-ec-t1 transition-colors font-sans"
                        onClick={() => openEdit(inc)}
                      >
                        Edit
                      </button>
                      <button
                        className="px-2.5 py-1 bg-ec-crit/10 text-ec-crit-light rounded-lg text-xs border border-ec-crit/20 cursor-pointer hover:bg-ec-crit/20 transition-colors font-sans"
                        onClick={() => handleDelete(inc)}
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
        title={editingId ? 'Edit Incident' : 'Record Incident'}
      >
        {renderForm()}
      </Modal>
      {ConfirmDialog}
    </div>
  )
}
