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
import Modal from '../components/Modal'
import PageActions from '../components/PageActions'

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
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [filterCategory, setFilterCategory] = useState('')

  if (loading) {
    return <div className="loading-container"><div className="spinner" />Loading…</div>
  }

  const filtered = filterCategory
    ? documents.filter((d) => d.category === filterCategory)
    : documents

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
    } else {
      setDocuments([
        ...documents,
        { id: generateId(), ...form, createdAt: new Date().toISOString() },
      ])
    }
    setModalOpen(false)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      setDocuments(documents.filter((d) => d.id !== id))
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

  return (
    <div>
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((doc) => {
                const status = getTrafficLight(doc.expiryDate)
                return (
                  <tr key={doc.id}>
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
                    <td>
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
                  </tr>
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
