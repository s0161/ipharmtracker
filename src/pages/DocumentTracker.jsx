import { useState } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import { logAudit } from '../utils/auditLog'
import { useUser } from '../contexts/UserContext'
import {
  generateId,
  formatDate,
  getTrafficLight,
  getTrafficLightLabel,
  CATEGORIES,
} from '../utils/helpers'
import { downloadCsv } from '../utils/exportCsv'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'
import PageActions from '../components/PageActions'
import SwipeRow from '../components/SwipeRow'

const emptyForm = {
  documentName: '',
  category: '',
  owner: '',
  issueDate: '',
  expiryDate: '',
  notes: '',
}

const statusColors = { green: '#10b981', amber: '#f59e0b', red: '#ef4444' }
const statusBg = { green: 'rgba(16,185,129,0.1)', amber: 'rgba(245,158,11,0.1)', red: 'rgba(239,68,68,0.1)' }

const inputClass = "w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors font-sans"

export default function DocumentTracker() {
  const { user } = useUser()
  const [documents, setDocuments, loading] = useSupabase('documents', [])
  const [staffMembers] = useSupabase('staff_members', [], { valueField: 'name' })
  const showToast = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [filterCategory, setFilterCategory] = useState('')

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-sm text-ec-t3">Loading…</div>
  }

  // Deduplicate by document name (keep most recent by createdAt)
  const uniqueDocs = (() => {
    const map = new Map()
    documents.forEach(d => {
      const existing = map.get(d.documentName)
      if (!existing || new Date(d.createdAt) > new Date(existing.createdAt)) {
        map.set(d.documentName, d)
      }
    })
    return [...map.values()]
  })()

  const filtered = filterCategory
    ? uniqueDocs.filter((d) => d.category === filterCategory)
    : uniqueDocs

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  )

  const openAdd = () => {
    setForm(emptyForm)
    setEditingId(null)
    setModalOpen(true)
  }

  const openEdit = (doc) => {
    setForm({
      documentName: doc.documentName,
      category: doc.category,
      owner: doc.owner,
      issueDate: doc.issueDate,
      expiryDate: doc.expiryDate,
      notes: doc.notes,
    })
    setEditingId(doc.id)
    setModalOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.documentName || !form.category) return

    if (editingId) {
      setDocuments(
        documents.map((d) => (d.id === editingId ? { ...d, ...form } : d))
      )
      logAudit('Updated', `Document: ${form.documentName}`, 'Documents', user?.name)
      showToast('Document updated')
    } else {
      setDocuments([
        ...documents,
        { id: generateId(), ...form, createdAt: new Date().toISOString() },
      ])
      logAudit('Created', `Document: ${form.documentName}`, 'Documents', user?.name)
      showToast('Document added')
    }
    setModalOpen(false)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      const doc = documents.find((d) => d.id === id)
      setDocuments(documents.filter((d) => d.id !== id))
      logAudit('Deleted', `Document: ${doc?.documentName || id}`, 'Documents', user?.name)
      showToast('Document deleted', 'info')
    }
  }

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleCsvDownload = () => {
    const headers = ['Status', 'Document Name', 'Category', 'Owner', 'Issue Date', 'Expiry / Review', 'Notes']
    const rows = sorted.map((d) => [
      getTrafficLightLabel(getTrafficLight(d.expiryDate)),
      d.documentName,
      d.category,
      d.owner || '',
      d.issueDate || '',
      d.expiryDate || '',
      d.notes || '',
    ])
    downloadCsv('documents', headers, rows)
  }

  // Expiry alert: documents expiring within 30 days or already expired
  const alertDocs = uniqueDocs.filter(d => {
    const tl = getTrafficLight(d.expiryDate)
    return tl === 'red' || tl === 'amber'
  }).map(d => {
    const tl = getTrafficLight(d.expiryDate)
    const exp = d.expiryDate ? new Date(d.expiryDate + 'T00:00:00') : null
    const today = new Date()
    today.setHours(0,0,0,0)
    const daysLeft = exp ? Math.ceil((exp - today) / (1000 * 60 * 60 * 24)) : null
    return { ...d, trafficLight: tl, daysLeft }
  })

  return (
    <div>
      {/* Document Expiry Alerts */}
      {alertDocs.length > 0 && (
        <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="text-sm font-bold text-ec-t1 flex items-center gap-2 mb-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Document Expiry Alerts
          </h3>
          <div className="space-y-2">
            {alertDocs.map(d => (
              <div
                key={d.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg"
                style={{ backgroundColor: d.trafficLight === 'red' ? 'rgba(239,68,68,0.04)' : 'rgba(245,158,11,0.04)' }}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: d.trafficLight === 'red' ? '#ef4444' : '#f59e0b' }}
                />
                <span className="text-sm text-ec-t1 font-medium flex-1">{d.documentName}</span>
                <span className="text-xs text-ec-t3 tabular-nums">
                  {d.daysLeft !== null
                    ? d.daysLeft < 0 ? `Expired ${Math.abs(d.daysLeft)} days ago` : `${d.daysLeft} days remaining`
                    : 'No date set'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-sm text-ec-t3 mb-2">
          Track documents, registrations, and renewals. Status updates
          automatically based on expiry dates.
        </p>
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <PageActions onDownloadCsv={handleCsvDownload} />
          <select
            className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors font-sans"
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
          <button className="px-4 py-2 bg-ec-em text-white font-semibold rounded-lg text-sm border-none cursor-pointer hover:bg-ec-em-dark transition-colors flex items-center gap-1.5 font-sans" onClick={openAdd}>
            + Add Document
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-10 text-ec-t3 text-sm">
          <p>
            {filterCategory
              ? `No documents in "${filterCategory}" category.`
              : 'No documents yet. Add your first document to get started.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-white/[0.06]">Status</th>
                <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-white/[0.06]">Document Name</th>
                <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-white/[0.06]">Category</th>
                <th className="hidden md:table-cell text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-white/[0.06]">Owner</th>
                <th className="hidden md:table-cell text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-white/[0.06]">Issue Date</th>
                <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-white/[0.06]">Expiry / Review</th>
                <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-white/[0.06]">Notes</th>
                <th className="hidden md:table-cell text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-white/[0.06]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((doc) => {
                const status = getTrafficLight(doc.expiryDate)
                return (
                  <SwipeRow key={doc.id} onEdit={() => openEdit(doc)} onDelete={() => handleDelete(doc.id)}>
                    <td className="px-4 py-2.5 border-b border-white/[0.04]">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: statusBg[status], color: statusColors[status] }}
                        title={getTrafficLightLabel(status)}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColors[status] }} />
                        {getTrafficLightLabel(status)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-ec-t1 font-medium border-b border-white/[0.04]">{doc.documentName}</td>
                    <td className="px-4 py-2.5 text-ec-t1 border-b border-white/[0.04]">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-white/[0.06] text-ec-t2">{doc.category}</span>
                    </td>
                    <td className="hidden md:table-cell px-4 py-2.5 text-ec-t1 border-b border-white/[0.04]">{doc.owner || '—'}</td>
                    <td className="hidden md:table-cell px-4 py-2.5 text-ec-t1 border-b border-white/[0.04]">{formatDate(doc.issueDate)}</td>
                    <td className="px-4 py-2.5 text-ec-t1 border-b border-white/[0.04]">{formatDate(doc.expiryDate)}</td>
                    <td className="px-4 py-2.5 text-ec-t3 border-b border-white/[0.04] max-w-[200px] truncate">{doc.notes || '—'}</td>
                    <td className="hidden md:table-cell px-4 py-2.5 text-ec-t1 border-b border-white/[0.04]">
                      <div className="flex gap-1">
                        <button
                          className="px-2.5 py-1 bg-white/[0.05] text-ec-t2 rounded-lg text-xs border border-white/[0.06] cursor-pointer hover:bg-white/[0.08] hover:text-ec-t1 transition-colors font-sans"
                          onClick={() => openEdit(doc)}
                        >
                          Edit
                        </button>
                        <button
                          className="px-2.5 py-1 bg-ec-crit/10 text-ec-crit-light rounded-lg text-xs border border-ec-crit/20 cursor-pointer hover:bg-ec-crit/20 transition-colors font-sans"
                          onClick={() => handleDelete(doc.id)}
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
        title={editingId ? 'Edit Document' : 'Add Document'}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs font-semibold text-ec-t2 mb-1 block">Document Name *</label>
            <input
              type="text"
              className={inputClass}
              placeholder="e.g. GPhC Registration"
              value={form.documentName}
              onChange={update('documentName')}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-ec-t2 mb-1 block">Category *</label>
            <select
              className={inputClass}
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
          </div>

          <div>
            <label className="text-xs font-semibold text-ec-t2 mb-1 block">Owner / Responsible Person</label>
            {staffMembers.length === 0 ? (
              <input
                type="text"
                className={inputClass}
                placeholder="Enter name or add staff in Settings"
                value={form.owner}
                onChange={update('owner')}
              />
            ) : (
              <select
                className={inputClass}
                value={form.owner}
                onChange={update('owner')}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-ec-t2 mb-1 block">Issue Date</label>
              <input
                type="date"
                className={inputClass}
                value={form.issueDate}
                onChange={update('issueDate')}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ec-t2 mb-1 block">Expiry / Review Date</label>
              <input
                type="date"
                className={inputClass}
                value={form.expiryDate}
                onChange={update('expiryDate')}
              />
              <p className="text-xs text-ec-t3 mt-1">
                Leave blank to flag as red (no date set).
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-ec-t2 mb-1 block">Notes</label>
            <textarea
              className={inputClass + " resize-none"}
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
              {editingId ? 'Save Changes' : 'Add Document'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
