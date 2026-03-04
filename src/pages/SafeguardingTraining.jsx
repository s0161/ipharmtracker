import { useState } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import { logAudit } from '../utils/auditLog'
import { useUser } from '../contexts/UserContext'
import { formatDate, generateId, getSafeguardingStatus, getRefresherDate } from '../utils/helpers'
import { downloadCsv } from '../utils/exportCsv'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'
import PageActions from '../components/PageActions'
import SwipeRow from '../components/SwipeRow'
import { useConfirm } from '../components/ConfirmDialog'

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

const inputClass = "w-full bg-ec-card border border-ec-border rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors font-sans"

const statusStyle = (status) => {
  switch (status) {
    case 'current': return { bg: 'rgba(16,185,129,0.1)', color: 'var(--ec-em)', dot: 'var(--ec-em)' }
    case 'due-soon': return { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', dot: '#f59e0b' }
    case 'overdue': return { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', dot: '#ef4444' }
    default: return { bg: 'transparent', color: 'var(--ec-t1)', dot: 'var(--ec-t1)' }
  }
}

export default function SafeguardingTraining() {
  const { user } = useUser()
  const [records, setRecords, loading] = useSupabase('safeguarding_records', [])
  const [staffMembers] = useSupabase('staff_members', [], { valueField: 'name' })
  const showToast = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [docsOpen, setDocsOpen] = useState(false)

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-sm text-ec-t3">Loading…</div>
  }

  const sorted = [...records].sort((a, b) => a.staffName.localeCompare(b.staffName))

  // Summary
  const totalTrained = records.filter((r) => r.trainingDate).length
  const currentCount = records.filter((r) => getSafeguardingStatus(r.trainingDate) === 'current').length
  const dueSoonCount = records.filter((r) => getSafeguardingStatus(r.trainingDate) === 'due-soon').length
  const overdueCount = records.filter((r) => getSafeguardingStatus(r.trainingDate) === 'overdue').length

  const toggleSignedOff = (id) => {
    const record = records.find((r) => r.id === id)
    const newVal = !record?.signedOff
    setRecords(records.map((r) => (r.id === id ? { ...r, signedOff: newVal } : r)))
    logAudit('Updated', `Safeguarding: ${record?.staffName} signed off -> ${newVal ? 'Yes' : 'No'}`, 'Safeguarding', user?.name)
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
      logAudit('Updated', `Safeguarding: ${form.staffName}`, 'Safeguarding', user?.name)
      showToast('Safeguarding record updated')
    } else {
      setRecords([...records, { id: generateId(), ...form }])
      logAudit('Created', `Safeguarding: ${form.staffName}`, 'Safeguarding', user?.name)
      showToast('Safeguarding record added')
    }
    setModalOpen(false)
  }

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Delete safeguarding record?',
      message: 'Are you sure you want to delete this safeguarding record? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    })
    if (!ok) return
    const record = records.find((r) => r.id === id)
    setRecords(records.filter((r) => r.id !== id))
    logAudit('Deleted', `Safeguarding: ${record?.staffName}`, 'Safeguarding', user?.name)
    showToast('Record deleted', 'info')
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
      <div>
        <p className="text-sm text-ec-t3 mb-2">
          Safeguarding training records for iPharmacy Direct, Ashton-under-Lyne.
          Safeguarding Lead: <strong className="text-ec-t1">Amjid Shakoor</strong> (Superintendent Pharmacist).
        </p>
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <PageActions onDownloadCsv={handleCsvDownload} />
          <button
            className="px-4 py-2 bg-ec-em text-white font-semibold rounded-lg text-sm border-none cursor-pointer hover:bg-ec-em-dark transition-colors flex items-center gap-1.5 font-sans"
            onClick={openAdd}
          >
            + Add Record
          </button>
        </div>
      </div>

      {/* Summary Banner */}
      <div
        className="grid grid-cols-4 gap-px rounded-xl overflow-hidden mb-6"
        style={{ border: '1px solid var(--ec-border)' }}
      >
        <div className="p-4 text-center" style={{ backgroundColor: 'var(--ec-card)' }}>
          <span className="text-2xl font-bold text-ec-t1 block">{totalTrained}</span>
          <span className="text-xs text-ec-t3 mt-1 block">Staff Trained</span>
        </div>
        <div className="p-4 text-center" style={{ backgroundColor: 'var(--ec-card)' }}>
          <span className="text-2xl font-bold text-ec-em block">{currentCount}</span>
          <span className="text-xs text-ec-t3 mt-1 block">Current</span>
        </div>
        <div className="p-4 text-center" style={{ backgroundColor: 'var(--ec-card)' }}>
          <span className="text-2xl font-bold text-ec-warn block">{dueSoonCount}</span>
          <span className="text-xs text-ec-t3 mt-1 block">Due Soon</span>
        </div>
        <div className="p-4 text-center" style={{ backgroundColor: 'var(--ec-card)' }}>
          <span className="text-2xl font-bold text-ec-crit-light block">{overdueCount}</span>
          <span className="text-xs text-ec-t3 mt-1 block">Overdue</span>
        </div>
      </div>

      {/* Training Records Table */}
      {sorted.length === 0 ? (
        <div className="text-center py-10 text-ec-t3 text-sm">
          No safeguarding records yet. Add your first record.
        </div>
      ) : (
        <div
          className="overflow-x-auto rounded-xl"
          style={{ border: '1px solid var(--ec-border)' }}
        >
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">Staff Name</th>
                <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">Job Title</th>
                <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">Training Date</th>
                <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border hidden md:table-cell">Delivered By</th>
                <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border hidden md:table-cell">Method</th>
                <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border hidden md:table-cell">Handbook</th>
                <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">Signed Off</th>
                <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">Next Refresher</th>
                <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">Status</th>
                <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border hidden md:table-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((record) => {
                const status = getSafeguardingStatus(record.trainingDate)
                const refresher = getRefresherDate(record.trainingDate)
                return (
                  <SwipeRow key={record.id} className="hover:bg-ec-card transition-colors" onEdit={() => openEdit(record)} onDelete={() => handleDelete(record.id)}>
                    <td className="px-4 py-2.5 text-ec-t1 border-b border-ec-div font-medium">{record.staffName}</td>
                    <td className="px-4 py-2.5 text-ec-t1 border-b border-ec-div">{record.jobTitle}</td>
                    <td className="px-4 py-2.5 text-ec-t1 border-b border-ec-div">{formatDate(record.trainingDate)}</td>
                    <td className="hidden md:table-cell px-4 py-2.5 text-ec-t3 border-b border-ec-div">{record.deliveredBy}</td>
                    <td className="hidden md:table-cell px-4 py-2.5 text-ec-t3 border-b border-ec-div">{record.trainingMethod}</td>
                    <td className="hidden md:table-cell px-4 py-2.5 text-ec-t3 border-b border-ec-div">{record.handbookVersion}</td>
                    <td className="px-4 py-2.5 text-ec-t1 border-b border-ec-div">
                      <button
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border-none cursor-pointer transition-colors font-sans ${
                          record.signedOff
                            ? 'bg-ec-em/10 text-ec-em hover:bg-ec-em/20'
                            : 'bg-ec-border text-ec-t3 hover:bg-ec-t5'
                        }`}
                        onClick={() => toggleSignedOff(record.id)}
                        title="Click to toggle"
                      >
                        {record.signedOff ? 'Yes' : 'No'}
                      </button>
                    </td>
                    <td className="px-4 py-2.5 text-ec-t1 border-b border-ec-div">{refresher ? formatDate(refresher) : '—'}</td>
                    <td className="px-4 py-2.5 text-ec-t1 border-b border-ec-div">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: statusStyle(status).bg, color: statusStyle(status).color }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusStyle(status).dot }} />
                        {STATUS_LABELS[status]}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-4 py-2.5 text-ec-t1 border-b border-ec-div">
                      <div className="flex gap-1">
                        <button
                          className="px-2.5 py-1 bg-ec-card-hover text-ec-t2 rounded-lg text-xs border border-ec-border cursor-pointer hover:bg-ec-t5 hover:text-ec-t1 transition-colors font-sans"
                          onClick={() => openEdit(record)}
                        >
                          Edit
                        </button>
                        <button
                          className="px-2.5 py-1 bg-ec-crit/10 text-ec-crit-light rounded-lg text-xs border border-ec-crit/20 cursor-pointer hover:bg-ec-crit/20 transition-colors font-sans"
                          onClick={() => handleDelete(record.id)}
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

      {/* Reference Documents — Collapsible */}
      <div className="mt-6 rounded-2xl p-5" style={{ backgroundColor: 'var(--ec-card)', border: '1px solid var(--ec-border)' }}>
        <button
          onClick={() => setDocsOpen(!docsOpen)}
          className="w-full flex items-center justify-between text-sm font-bold text-ec-t1 bg-transparent border-none cursor-pointer p-0 font-sans"
        >
          <span className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            Reference Documents
          </span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            width="16"
            height="16"
            className={`transition-transform duration-200 ${docsOpen ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <p className="text-xs text-ec-t3 mt-1">Safeguarding Lead: Amjid Shakoor — Superintendent Pharmacist</p>
        {docsOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
            {REFERENCE_DOCS.map((doc) => (
              <div key={doc.name} className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--ec-card)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" className="text-ec-t3 shrink-0 mt-0.5">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <div>
                  <span className="text-sm text-ec-t1 font-medium block">{doc.name}</span>
                  <span className="text-xs text-ec-t3 block">{doc.version}</span>
                  <span className="text-xs text-ec-t3 block">{doc.review}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Safeguarding Record' : 'Add Safeguarding Record'}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs font-semibold text-ec-t2 mb-1 block">Staff Name *</label>
            <select
              className={inputClass}
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

          <div>
            <label className="text-xs font-semibold text-ec-t2 mb-1 block">Job Title *</label>
            <input
              type="text"
              className={inputClass}
              placeholder="e.g. Dispenser"
              value={form.jobTitle}
              onChange={update('jobTitle')}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-ec-t2 mb-1 block">Training Date</label>
            <input
              type="date"
              className={inputClass}
              value={form.trainingDate}
              onChange={update('trainingDate')}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-ec-t2 mb-1 block">Delivered By</label>
            <input
              type="text"
              className={inputClass}
              value={form.deliveredBy}
              onChange={update('deliveredBy')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-ec-t2 mb-1 block">Training Method</label>
              <input
                type="text"
                className={inputClass}
                value={form.trainingMethod}
                onChange={update('trainingMethod')}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ec-t2 mb-1 block">Handbook Version</label>
              <input
                type="text"
                className={inputClass}
                value={form.handbookVersion}
                onChange={update('handbookVersion')}
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-ec-t1 cursor-pointer">
              <input
                type="checkbox"
                className="accent-ec-em"
                checked={form.signedOff}
                onChange={(e) => setForm({ ...form, signedOff: e.target.checked })}
              />
              Signed Off
            </label>
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
              {editingId ? 'Save Changes' : 'Add Record'}
            </button>
          </div>
        </form>
      </Modal>
      {ConfirmDialog}
    </div>
  )
}
