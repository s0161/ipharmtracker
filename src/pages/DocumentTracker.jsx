import { useState } from 'react'
import { useSupabase } from '../hooks/useSupabase'
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

export default function DocumentTracker() {
  const [documents, setDocuments, loading] = useSupabase('documents', [])
  const [staffMembers] = useSupabase('staff_members', [], { valueField: 'name' })
  const showToast = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [filterCategory, setFilterCategory] = useState('')

  if (loading) {
    return <div className="loading-container"><div className="spinner" />Loading…</div>
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
      showToast('Document updated')
    } else {
      setDocuments([
        ...documents,
        { id: generateId(), ...form, createdAt: new Date().toISOString() },
      ])
      showToast('Document added')
    }
    setModalOpen(false)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      setDocuments(documents.filter((d) => d.id !== id))
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
        <div className="doc-alert-banner">
          <h3 className="doc-alert-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Document Expiry Alerts
          </h3>
          <div className="doc-alert-list">
            {alertDocs.map(d => (
              <div key={d.id} className={`doc-alert-item doc-alert-item--${d.trafficLight}`}>
                <span className={`doc-alert-dot doc-alert-dot--${d.trafficLight}`} />
                <span className="doc-alert-name">{d.documentName}</span>
                <span className="doc-alert-days">
                  {d.daysLeft !== null
                    ? d.daysLeft < 0 ? `Expired ${Math.abs(d.daysLeft)} days ago` : `${d.daysLeft} days remaining`
                    : 'No date set'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="page-header">
        <p className="page-desc">
          Track documents, registrations, and renewals. Status updates
          automatically based on expiry dates.
        </p>
        <div className="page-header-actions">
          <PageActions onDownloadCsv={handleCsvDownload} />
          <select
            className="input input--inline"
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
          <button className="btn btn--primary" onClick={openAdd}>
            + Add Document
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="empty-state-box">
          <p className="empty-state">
            {filterCategory
              ? `No documents in "${filterCategory}" category.`
              : 'No documents yet. Add your first document to get started.'}
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Document Name</th>
                <th>Category</th>
                <th className="mobile-hide">Owner</th>
                <th className="mobile-hide">Issue Date</th>
                <th>Expiry / Review</th>
                <th>Notes</th>
                <th className="mobile-hide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((doc) => {
                const status = getTrafficLight(doc.expiryDate)
                return (
                  <SwipeRow key={doc.id} onEdit={() => openEdit(doc)} onDelete={() => handleDelete(doc.id)}>
                    <td>
                      <span
                        className={`traffic-light traffic-light--${status}`}
                        title={getTrafficLightLabel(status)}
                      >
                        <span className={`traffic-dot traffic-dot--${status}`} />
                        <span className="traffic-label">
                          {getTrafficLightLabel(status)}
                        </span>
                      </span>
                    </td>
                    <td className="cell-bold">{doc.documentName}</td>
                    <td>
                      <span className="badge">{doc.category}</span>
                    </td>
                    <td className="mobile-hide">{doc.owner || '—'}</td>
                    <td className="mobile-hide">{formatDate(doc.issueDate)}</td>
                    <td>{formatDate(doc.expiryDate)}</td>
                    <td className="cell-notes">{doc.notes || '—'}</td>
                    <td className="mobile-hide">
                      <div className="action-btns">
                        <button
                          className="btn btn--ghost btn--sm"
                          onClick={() => openEdit(doc)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn--ghost btn--sm btn--danger"
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
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Document Name *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. GPhC Registration"
              value={form.documentName}
              onChange={update('documentName')}
              required
            />
          </div>

          <div className="form-group">
            <label className="label">Category *</label>
            <select
              className="input"
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

          <div className="form-group">
            <label className="label">Owner / Responsible Person</label>
            {staffMembers.length === 0 ? (
              <input
                type="text"
                className="input"
                placeholder="Enter name or add staff in Settings"
                value={form.owner}
                onChange={update('owner')}
              />
            ) : (
              <select
                className="input"
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

          <div className="form-row">
            <div className="form-group">
              <label className="label">Issue Date</label>
              <input
                type="date"
                className="input"
                value={form.issueDate}
                onChange={update('issueDate')}
              />
            </div>
            <div className="form-group">
              <label className="label">Expiry / Review Date</label>
              <input
                type="date"
                className="input"
                value={form.expiryDate}
                onChange={update('expiryDate')}
              />
              <p className="form-hint">
                Leave blank to flag as red (no date set).
              </p>
            </div>
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
              {editingId ? 'Save Changes' : 'Add Document'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
