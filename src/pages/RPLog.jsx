import { useState, useMemo } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import { generateId, formatDate } from '../utils/helpers'
import { downloadCsv } from '../utils/exportCsv'
import { useToast } from '../components/Toast'
import PageActions from '../components/PageActions'

const DAILY_ITEMS = [
  'RP notice displayed',
  'Controlled drugs checked',
  'Pharmacy opened correctly',
  'Pharmacy closed correctly',
  'Fridge temperature recorded',
]

const WEEKLY_ITEMS = [
  'Pharmacy record up to date',
  'RP absent period recorded (if applicable)',
  'Near-miss log reviewed',
  'Dispensing area clean and tidy',
]

const FORTNIGHTLY_ITEMS = [
  'Date checking completed',
  'Returned medicines destroyed log reviewed',
  'Staff training records reviewed',
  'SOPs reviewed for currency',
]

const ALL_ITEMS = [...DAILY_ITEMS, ...WEEKLY_ITEMS, ...FORTNIGHTLY_ITEMS]

export default function RPLog() {
  const [logs, setLogs, loading] = useSupabase('rp_log', [])
  const [staffMembers] = useSupabase('staff_members', [], { valueField: 'name' })
  const showToast = useToast()

  const today = new Date().toISOString().slice(0, 10)
  const [selectedDate, setSelectedDate] = useState(today)
  const [rpName, setRpName] = useState('')
  const [checklist, setChecklist] = useState({})
  const [notes, setNotes] = useState('')
  const [editingId, setEditingId] = useState(null)

  // Load existing entry when date changes
  const existingEntry = useMemo(() => {
    return logs.find(l => l.date === selectedDate)
  }, [logs, selectedDate])

  // When we find an existing entry, load its data
  useState(() => {
    if (existingEntry) {
      setRpName(existingEntry.rpName || '')
      setChecklist(existingEntry.checklist || {})
      setNotes(existingEntry.notes || '')
      setEditingId(existingEntry.id)
    }
  })

  const loadEntry = (date) => {
    setSelectedDate(date)
    const entry = logs.find(l => l.date === date)
    if (entry) {
      setRpName(entry.rpName || '')
      setChecklist(entry.checklist || {})
      setNotes(entry.notes || '')
      setEditingId(entry.id)
    } else {
      setRpName('')
      setChecklist({})
      setNotes('')
      setEditingId(null)
    }
  }

  const toggleItem = (item) => {
    setChecklist(prev => ({ ...prev, [item]: !prev[item] }))
  }

  const handleSave = () => {
    if (!rpName) return

    const data = {
      date: selectedDate,
      rpName,
      checklist,
      notes,
    }

    if (editingId) {
      setLogs(logs.map(l => (l.id === editingId ? { ...l, ...data } : l)))
      showToast('RP checklist updated')
    } else {
      const id = generateId()
      setLogs([...logs, { id, ...data, createdAt: new Date().toISOString() }])
      setEditingId(id)
      showToast('RP checklist saved')
    }
  }

  if (loading) {
    return <div className="loading-container"><div className="spinner" />Loading…</div>
  }

  const checkedCount = (items) => items.filter(i => checklist[i]).length
  const totalChecked = ALL_ITEMS.filter(i => checklist[i]).length

  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date))

  const handleCsvDownload = () => {
    const headers = ['Date', 'RP Name', 'Completed', 'Total Items', 'Notes']
    const rows = sorted.map(l => {
      const c = l.checklist || {}
      const completed = ALL_ITEMS.filter(i => c[i]).length
      return [l.date, l.rpName, completed, ALL_ITEMS.length, l.notes || '']
    })
    downloadCsv('rp-log', headers, rows)
  }

  const renderChecklist = (title, items, frequency) => (
    <div className="rp-checklist-group">
      <h3 className="rp-checklist-group-title">
        {title}
        <span className="rp-checklist-group-count">
          {checkedCount(items)}/{items.length}
        </span>
      </h3>
      <div className="rp-checklist-items">
        {items.map(item => (
          <label key={item} className={`rp-checklist-item ${checklist[item] ? 'rp-checklist-item--checked' : ''}`}>
            <input
              type="checkbox"
              checked={!!checklist[item]}
              onChange={() => toggleItem(item)}
            />
            <span className="rp-check-icon">
              {checklist[item] ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                </svg>
              )}
            </span>
            <span className="rp-check-label">{item}</span>
          </label>
        ))}
      </div>
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <p className="page-desc">
          Daily Responsible Pharmacist checklist — GPhC compliance requirement.
          Record RP duties and checks for each day.
        </p>
        <div className="page-header-actions">
          <PageActions onDownloadCsv={handleCsvDownload} />
        </div>
      </div>

      {/* Form Section */}
      <div className="rp-form-section">
        <div className="rp-form-header">
          <div className="form-group">
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              value={selectedDate}
              onChange={(e) => loadEntry(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="label">Responsible Pharmacist</label>
            {staffMembers.length > 0 ? (
              <select className="input" value={rpName} onChange={(e) => setRpName(e.target.value)}>
                <option value="">Select RP...</option>
                {staffMembers.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className="input"
                placeholder="Enter RP name..."
                value={rpName}
                onChange={(e) => setRpName(e.target.value)}
              />
            )}
          </div>
        </div>

        <div className="rp-completion-bar">
          <div className="rp-completion-label">
            Completion: {totalChecked}/{ALL_ITEMS.length}
          </div>
          <div className="progress-bar" style={{ flex: 1 }}>
            <div
              className="progress-bar-fill"
              style={{
                width: `${ALL_ITEMS.length > 0 ? (totalChecked / ALL_ITEMS.length) * 100 : 0}%`,
                background: totalChecked === ALL_ITEMS.length
                  ? 'var(--success)'
                  : totalChecked > 0
                    ? 'var(--warning)'
                    : 'var(--border)'
              }}
            />
          </div>
        </div>

        {renderChecklist('Daily Checks', DAILY_ITEMS, 'daily')}
        {renderChecklist('Weekly Checks', WEEKLY_ITEMS, 'weekly')}
        {renderChecklist('Fortnightly Checks', FORTNIGHTLY_ITEMS, 'fortnightly')}

        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label className="label">Notes</label>
          <textarea
            className="input input--textarea"
            placeholder="Any issues, observations, or actions taken..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
          <button
            className="btn btn--primary"
            onClick={handleSave}
            disabled={!rpName}
          >
            {editingId ? 'Update Checklist' : 'Save Checklist'}
          </button>
        </div>
      </div>

      {/* History Table */}
      <h2 className="rp-history-title">Recent Checklists</h2>
      {sorted.length === 0 ? (
        <div className="empty-state-box">
          <p className="empty-state">No RP checklists recorded yet.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>RP Name</th>
                <th>Completion</th>
                <th className="mobile-hide">Notes</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(log => {
                const c = log.checklist || {}
                const completed = ALL_ITEMS.filter(i => c[i]).length
                const pct = Math.round((completed / ALL_ITEMS.length) * 100)
                return (
                  <tr
                    key={log.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => loadEntry(log.date)}
                  >
                    <td className="cell-bold">{formatDate(log.date)}</td>
                    <td>{log.rpName}</td>
                    <td>
                      <span className={`result-badge ${pct === 100 ? 'result-badge--pass' : 'result-badge--action'}`}>
                        {completed}/{ALL_ITEMS.length}
                      </span>
                    </td>
                    <td className="cell-notes mobile-hide">{log.notes || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
