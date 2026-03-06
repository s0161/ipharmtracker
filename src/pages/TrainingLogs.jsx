/*
  Training Logs — Full training manager
  Records completed training, tracks compliance (expiring/overdue certs),
  and supports scheduling future training via future-dated entries.

  Supabase table: training_logs
  Fields: id, staff_name, date_completed, topic, trainer_name,
          delivery_method, duration, outcome, certificate_expiry,
          renewal_date, notes, created_at
*/

import { useState, useMemo, useCallback } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import { useUser } from '../contexts/UserContext'
import { logAudit } from '../utils/auditLog'
import { generateId, formatDate, getTrafficLight } from '../utils/helpers'
import { isElevatedRole } from '../utils/taskEngine'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/ConfirmDialog'
import { downloadCsv } from '../utils/exportCsv'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import SkeletonLoader from '../components/SkeletonLoader'
import PageActions from '../components/PageActions'

// ── Font injection ──
if (!document.getElementById('tl-fonts')) {
  const fl = document.createElement('link')
  fl.id = 'tl-fonts'
  fl.rel = 'stylesheet'
  fl.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap'
  document.head.appendChild(fl)
}

const sans = { fontFamily: "'DM Sans', sans-serif" }
const mono = { fontFamily: "'DM Mono', monospace" }
const card = {
  background: 'var(--bg-card)', borderRadius: 12,
  padding: '14px 16px', border: '1px solid var(--border-card)',
  boxShadow: 'var(--shadow-card)', marginBottom: 12,
}
const selectStyle = {
  fontSize: 11, padding: '4px 8px', borderRadius: 6,
  border: '1px solid var(--border-card)', background: 'var(--bg-card)',
  color: 'var(--text-secondary)', outline: 'none', cursor: 'pointer',
  ...sans,
}

const DELIVERY_METHODS = ['Classroom', 'Online', 'On-the-job', 'Self-study']
const OUTCOMES = ['Pass', 'Attended', 'Certificate Issued']
const STATUS_FILTERS = ['All', 'Completed', 'Scheduled', 'Expiring', 'Expired']

// ── Helpers ──
function getToday() {
  return new Date().toISOString().slice(0, 10)
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24))
}

function deriveStatus(record) {
  const today = getToday()
  // Future date with no outcome = scheduled
  if (record.dateCompleted > today && (!record.outcome || record.outcome === '')) {
    return 'scheduled'
  }
  // Has cert expiry
  if (record.certificateExpiry) {
    const days = daysUntil(record.certificateExpiry)
    if (days !== null && days < 0) return 'expired'
    if (days !== null && days <= 30) return 'expiring'
  }
  return 'completed'
}

const STATUS_STYLES = {
  completed:  { bg: '#f0fdf4', color: '#059669', border: '#6ee7b7', label: 'Completed' },
  scheduled:  { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', label: 'Scheduled' },
  expiring:   { bg: '#fffbeb', color: '#d97706', border: '#fde68a', label: 'Expiring' },
  expired:    { bg: '#fef2f2', color: '#ef4444', border: '#fca5a5', label: 'Expired' },
}

// ── Section Header (left-border accent) ──
function SectionHeader({ accent, icon, title, right }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 12px', marginBottom: 12,
      borderLeft: `3px solid ${accent}`, borderRadius: 4,
      background: `${accent}08`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ ...sans, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</span>
      </div>
      {right && <div>{right}</div>}
    </div>
  )
}

// ── Status Pill ──
function StatusPill({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.completed
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  )
}

// ── Expiry indicator ──
function ExpiryBadge({ dateStr }) {
  if (!dateStr) return <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>
  const days = daysUntil(dateStr)
  const light = days < 0 ? 'red' : days <= 30 ? 'amber' : 'green'
  const colors = {
    red:   { bg: '#fef2f2', color: '#ef4444', border: '#fca5a5' },
    amber: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
    green: { bg: '#f0fdf4', color: '#059669', border: '#6ee7b7' },
  }
  const c = colors[light]
  const label = days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : days <= 30 ? `${days}d left` : formatDate(dateStr)
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

// ── Stat Card ──
function StatCard({ icon, label, value, accent }) {
  return (
    <div style={{
      ...card,
      display: 'flex', alignItems: 'center', gap: 10,
      borderLeft: `3px solid ${accent}`, minWidth: 130,
    }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <div>
        <div style={{ ...mono, fontSize: 20, fontWeight: 700, color: accent, lineHeight: 1 }}>{value}</div>
        <div style={{ ...sans, fontSize: 10, color: 'var(--text-muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>{label}</div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════
export default function TrainingLogs() {
  const [logs, setLogs, loading] = useSupabase('training_logs', [])
  const [staff] = useSupabase('staff_members', [], { valueField: 'name' })
  const [topics] = useSupabase('training_topics', [], { valueField: 'name' })
  const { user } = useUser()
  const toast = useToast()
  const { confirm, ConfirmDialog } = useConfirm()

  const elevated = user && isElevatedRole(user.role)

  // ── Filters ──
  const [filterStaff, setFilterStaff] = useState('')
  const [filterTopic, setFilterTopic] = useState('')
  const [filterMethod, setFilterMethod] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('dateCompleted')
  const [sortDir, setSortDir] = useState('desc')

  // ── Modal ──
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const emptyForm = {
    staffName: user?.name || '', dateCompleted: getToday(), topic: '',
    trainerName: '', deliveryMethod: 'Classroom', duration: '',
    outcome: 'Pass', certificateExpiry: '', renewalDate: '', notes: '',
  }
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState({})

  // ── Derived data ──
  const enrichedLogs = useMemo(() =>
    logs.map(r => ({ ...r, _status: deriveStatus(r) })),
    [logs]
  )

  const stats = useMemo(() => {
    const s = { total: enrichedLogs.length, completed: 0, scheduled: 0, expiring: 0, expired: 0 }
    enrichedLogs.forEach(r => { if (s[r._status] !== undefined) s[r._status]++ })
    const uniqueStaff = new Set(enrichedLogs.filter(r => r._status === 'completed').map(r => r.staffName))
    s.staffTrained = uniqueStaff.size
    return s
  }, [enrichedLogs])

  // ── Filter + Sort ──
  const filtered = useMemo(() => {
    let result = enrichedLogs

    if (filterStaff) result = result.filter(r => r.staffName === filterStaff)
    if (filterTopic) result = result.filter(r => r.topic === filterTopic)
    if (filterMethod) result = result.filter(r => r.deliveryMethod === filterMethod)
    if (filterStatus !== 'All') result = result.filter(r => r._status === filterStatus.toLowerCase())
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(r =>
        r.staffName?.toLowerCase().includes(q) ||
        r.topic?.toLowerCase().includes(q) ||
        r.trainerName?.toLowerCase().includes(q) ||
        r.notes?.toLowerCase().includes(q)
      )
    }

    result.sort((a, b) => {
      const av = a[sortField] || ''
      const bv = b[sortField] || ''
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [enrichedLogs, filterStaff, filterTopic, filterMethod, filterStatus, search, sortField, sortDir])

  // ── Get unique values for filter dropdowns ──
  const usedTopics = useMemo(() => [...new Set(logs.map(r => r.topic).filter(Boolean))].sort(), [logs])
  const usedStaff = useMemo(() => [...new Set(logs.map(r => r.staffName).filter(Boolean))].sort(), [logs])

  // ── Sort handler ──
  const handleSort = useCallback((field) => {
    setSortField(prev => {
      if (prev === field) {
        setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        return field
      }
      setSortDir('desc')
      return field
    })
  }, [])

  // ── Form handlers ──
  const openAdd = () => {
    setEditingId(null)
    setForm({ ...emptyForm, staffName: user?.name || '' })
    setFormErrors({})
    setModalOpen(true)
  }

  const openEdit = (record) => {
    setEditingId(record.id)
    setForm({
      staffName: record.staffName || '',
      dateCompleted: record.dateCompleted || '',
      topic: record.topic || '',
      trainerName: record.trainerName || '',
      deliveryMethod: record.deliveryMethod || 'Classroom',
      duration: record.duration || '',
      outcome: record.outcome || '',
      certificateExpiry: record.certificateExpiry || '',
      renewalDate: record.renewalDate || '',
      notes: record.notes || '',
    })
    setFormErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const errs = {}
    if (!form.staffName) errs.staffName = 'Required'
    if (!form.dateCompleted) errs.dateCompleted = 'Required'
    if (!form.topic) errs.topic = 'Required'
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = () => {
    if (!validate()) return

    if (editingId) {
      setLogs(prev => prev.map(r => r.id === editingId ? { ...r, ...form } : r))
      logAudit('training_log_updated', { id: editingId, ...form }, user?.name)
      toast.success('Training record updated')
    } else {
      const newRecord = { id: generateId(), ...form, createdAt: new Date().toISOString() }
      setLogs(prev => [newRecord, ...prev])
      logAudit('training_log_added', newRecord, user?.name)
      toast.success('Training record added')
    }

    setModalOpen(false)
  }

  const handleDelete = async (record) => {
    const ok = await confirm({
      title: 'Delete Training Record',
      message: `Delete "${record.topic}" for ${record.staffName}?`,
    })
    if (!ok) return
    setLogs(prev => prev.filter(r => r.id !== record.id))
    logAudit('training_log_deleted', { id: record.id, topic: record.topic }, user?.name)
    toast.success('Record deleted')
  }

  // ── CSV Export ──
  const handleCsv = () => {
    downloadCsv('training-logs', [
      'Date', 'Staff', 'Topic', 'Trainer', 'Method', 'Duration', 'Outcome',
      'Cert Expiry', 'Renewal Date', 'Status', 'Notes',
    ], filtered.map(r => [
      r.dateCompleted, r.staffName, r.topic, r.trainerName, r.deliveryMethod,
      r.duration, r.outcome, r.certificateExpiry, r.renewalDate,
      STATUS_STYLES[r._status]?.label || '', r.notes,
    ]))
  }

  // ── Clear filters ──
  const clearFilters = () => {
    setFilterStaff('')
    setFilterTopic('')
    setFilterMethod('')
    setFilterStatus('All')
    setSearch('')
  }
  const hasFilters = filterStaff || filterTopic || filterMethod || filterStatus !== 'All' || search

  const today = getToday()
  const dateFormatted = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  // ── Sort icon ──
  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span style={{ opacity: 0.3, fontSize: 9 }}>↕</span>
    return <span style={{ fontSize: 9 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  // ── Table columns ──
  const columns = [
    { key: 'dateCompleted', label: 'Date', w: 90 },
    { key: 'staffName', label: 'Staff', w: 120 },
    { key: 'topic', label: 'Topic', w: 160 },
    { key: 'trainerName', label: 'Trainer', w: 110 },
    { key: 'deliveryMethod', label: 'Method', w: 80 },
    { key: 'duration', label: 'Duration', w: 70 },
    { key: 'outcome', label: 'Outcome', w: 80 },
    { key: 'certificateExpiry', label: 'Cert Expiry', w: 100 },
    { key: '_status', label: 'Status', w: 80 },
  ]

  if (loading) {
    return (
      <div style={{ ...sans, padding: '24px 28px', maxWidth: 1200 }}>
        <SkeletonLoader variant="table" />
      </div>
    )
  }

  return (
    <div style={{ ...sans, padding: '24px 28px', maxWidth: 1200 }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Dashboard / Training Logs</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Training Logs</h1>
          <span style={{ ...mono, fontSize: 13, color: 'var(--text-muted)' }}>{dateFormatted}</span>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 10px' }}>
          Staff training records, compliance tracking &amp; scheduled training
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {elevated && (
            <button
              onClick={openAdd}
              style={{
                ...sans, fontSize: 11, fontWeight: 600, padding: '6px 14px',
                borderRadius: 8, border: 'none', cursor: 'pointer',
                background: '#059669', color: 'white',
              }}
            >
              + Add Record
            </button>
          )}
          <div style={{ flex: 1 }} />
          <PageActions onDownloadCsv={handleCsv} />
        </div>
      </div>

      {/* ── Stats Strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 16 }}>
        <StatCard icon="📋" label="Total Records" value={stats.total} accent="#3b82f6" />
        <StatCard icon="✅" label="Completed" value={stats.completed} accent="#059669" />
        <StatCard icon="📅" label="Scheduled" value={stats.scheduled} accent="#2563eb" />
        <StatCard icon="⚠️" label="Expiring Soon" value={stats.expiring} accent="#d97706" />
        <StatCard icon="🔴" label="Expired" value={stats.expired} accent="#ef4444" />
      </div>

      {/* ── Filters ── */}
      <SectionHeader accent="#6366f1" icon="🔍" title="Filter Records" right={
        hasFilters ? (
          <button onClick={clearFilters} style={{ ...sans, fontSize: 10, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            Clear All
          </button>
        ) : null
      } />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...selectStyle, width: 160, padding: '5px 8px' }}
        />
        <select value={filterStaff} onChange={e => setFilterStaff(e.target.value)} style={selectStyle}>
          <option value="">All Staff</option>
          {usedStaff.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterTopic} onChange={e => setFilterTopic(e.target.value)} style={selectStyle}>
          <option value="">All Topics</option>
          {usedTopics.map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)} style={selectStyle}>
          <option value="">All Methods</option>
          {DELIVERY_METHODS.map(m => <option key={m}>{m}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selectStyle}>
          {STATUS_FILTERS.map(s => <option key={s}>{s}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <span style={{ ...sans, fontSize: 11, color: 'var(--text-muted)' }}>
          Showing {filtered.length} of {enrichedLogs.length}
        </span>
      </div>

      {/* ── Table ── */}
      <SectionHeader accent="#059669" icon="📚" title="Training Records" right={
        <span style={{ ...mono, fontSize: 11, color: '#059669', fontWeight: 600 }}>
          {stats.staffTrained} staff trained
        </span>
      } />

      {filtered.length === 0 ? (
        <EmptyState
          title="No training records"
          description={hasFilters ? 'Try adjusting your filters' : 'Add your first training record to get started'}
          actionLabel={elevated ? '+ Add Record' : undefined}
          onAction={elevated ? openAdd : undefined}
        />
      ) : (
        <div style={{ overflowX: 'auto', marginBottom: 24 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {columns.map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    style={{
                      ...sans, fontSize: 9, fontWeight: 600, color: 'var(--text-muted)',
                      textAlign: 'left', padding: '6px 8px',
                      borderBottom: '1px solid var(--border-card)',
                      textTransform: 'uppercase', letterSpacing: 0.5,
                      cursor: 'pointer', userSelect: 'none',
                      minWidth: col.w,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {col.label} <SortIcon field={col.key} />
                  </th>
                ))}
                {elevated && (
                  <th style={{
                    fontSize: 9, fontWeight: 600, color: 'var(--text-muted)',
                    textAlign: 'right', padding: '6px 8px',
                    borderBottom: '1px solid var(--border-card)',
                    textTransform: 'uppercase', letterSpacing: 0.5, minWidth: 80,
                  }}>
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, idx) => {
                const isScheduled = r._status === 'scheduled'
                return (
                  <tr
                    key={r.id}
                    style={{
                      background: idx % 2 === 1 ? '#f9fffe' : 'transparent',
                      opacity: isScheduled ? 0.75 : 1,
                      transition: 'background 150ms',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0faf4'}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 1 ? '#f9fffe' : 'transparent'}
                  >
                    <td style={{ ...mono, fontSize: 11, padding: '8px 8px', borderBottom: '1px solid var(--border-card)', color: 'var(--text-primary)' }}>
                      {formatDate(r.dateCompleted)}
                    </td>
                    <td style={{ ...sans, fontSize: 12, padding: '8px 8px', borderBottom: '1px solid var(--border-card)', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {r.staffName}
                    </td>
                    <td style={{ ...sans, fontSize: 12, padding: '8px 8px', borderBottom: '1px solid var(--border-card)', color: 'var(--text-primary)' }}>
                      {r.topic}
                    </td>
                    <td style={{ ...sans, fontSize: 11, padding: '8px 8px', borderBottom: '1px solid var(--border-card)', color: 'var(--text-secondary)' }}>
                      {r.trainerName || '—'}
                    </td>
                    <td style={{ ...sans, fontSize: 11, padding: '8px 8px', borderBottom: '1px solid var(--border-card)', color: 'var(--text-secondary)' }}>
                      {r.deliveryMethod || '—'}
                    </td>
                    <td style={{ ...mono, fontSize: 11, padding: '8px 8px', borderBottom: '1px solid var(--border-card)', color: 'var(--text-secondary)' }}>
                      {r.duration || '—'}
                    </td>
                    <td style={{ fontSize: 11, padding: '8px 8px', borderBottom: '1px solid var(--border-card)' }}>
                      {r.outcome ? (
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
                          background: r.outcome === 'Pass' ? '#f0fdf4' : r.outcome === 'Attended' ? '#fffbeb' : '#eff6ff',
                          color: r.outcome === 'Pass' ? '#059669' : r.outcome === 'Attended' ? '#d97706' : '#2563eb',
                          border: `1px solid ${r.outcome === 'Pass' ? '#6ee7b7' : r.outcome === 'Attended' ? '#fde68a' : '#bfdbfe'}`,
                        }}>
                          {r.outcome}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>}
                    </td>
                    <td style={{ fontSize: 11, padding: '8px 8px', borderBottom: '1px solid var(--border-card)' }}>
                      <ExpiryBadge dateStr={r.certificateExpiry} />
                    </td>
                    <td style={{ fontSize: 11, padding: '8px 8px', borderBottom: '1px solid var(--border-card)' }}>
                      <StatusPill status={r._status} />
                    </td>
                    {elevated && (
                      <td style={{ padding: '8px 8px', borderBottom: '1px solid var(--border-card)', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => openEdit(r)}
                          style={{ ...sans, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border-card)', background: 'var(--bg-card)', color: 'var(--text-secondary)', cursor: 'pointer', marginRight: 4 }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(r)}
                          style={{ ...sans, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Training Record' : 'Add Training Record'}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Staff */}
          <div>
            <label style={{ ...sans, fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Staff Member *</label>
            <select
              value={form.staffName}
              onChange={e => setForm(f => ({ ...f, staffName: e.target.value }))}
              style={{ ...selectStyle, width: '100%', padding: '7px 8px', fontSize: 12, borderColor: formErrors.staffName ? '#ef4444' : undefined }}
            >
              <option value="">Select staff...</option>
              {staff.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Date */}
          <div>
            <label style={{ ...sans, fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Date *</label>
            <input
              type="date"
              value={form.dateCompleted}
              onChange={e => setForm(f => ({ ...f, dateCompleted: e.target.value }))}
              style={{ ...selectStyle, width: '100%', padding: '7px 8px', fontSize: 12, borderColor: formErrors.dateCompleted ? '#ef4444' : undefined }}
            />
            {form.dateCompleted > today && (
              <span style={{ fontSize: 9, color: '#2563eb', fontWeight: 600 }}>Future date = Scheduled</span>
            )}
          </div>

          {/* Topic */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ ...sans, fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Topic *</label>
            <select
              value={form.topic}
              onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
              style={{ ...selectStyle, width: '100%', padding: '7px 8px', fontSize: 12, borderColor: formErrors.topic ? '#ef4444' : undefined }}
            >
              <option value="">Select topic...</option>
              {topics.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          {/* Trainer */}
          <div>
            <label style={{ ...sans, fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Trainer</label>
            <input
              type="text"
              value={form.trainerName}
              onChange={e => setForm(f => ({ ...f, trainerName: e.target.value }))}
              placeholder="Trainer name"
              style={{ ...selectStyle, width: '100%', padding: '7px 8px', fontSize: 12 }}
            />
          </div>

          {/* Method */}
          <div>
            <label style={{ ...sans, fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Delivery Method</label>
            <select
              value={form.deliveryMethod}
              onChange={e => setForm(f => ({ ...f, deliveryMethod: e.target.value }))}
              style={{ ...selectStyle, width: '100%', padding: '7px 8px', fontSize: 12 }}
            >
              {DELIVERY_METHODS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>

          {/* Duration */}
          <div>
            <label style={{ ...sans, fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Duration</label>
            <input
              type="text"
              value={form.duration}
              onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
              placeholder="e.g. 2 hours"
              style={{ ...selectStyle, width: '100%', padding: '7px 8px', fontSize: 12 }}
            />
          </div>

          {/* Outcome */}
          <div>
            <label style={{ ...sans, fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Outcome</label>
            <select
              value={form.outcome}
              onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))}
              style={{ ...selectStyle, width: '100%', padding: '7px 8px', fontSize: 12 }}
            >
              <option value="">None (Scheduled)</option>
              {OUTCOMES.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>

          {/* Cert Expiry */}
          <div>
            <label style={{ ...sans, fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Certificate Expiry</label>
            <input
              type="date"
              value={form.certificateExpiry}
              onChange={e => setForm(f => ({ ...f, certificateExpiry: e.target.value }))}
              style={{ ...selectStyle, width: '100%', padding: '7px 8px', fontSize: 12 }}
            />
          </div>

          {/* Renewal Date */}
          <div>
            <label style={{ ...sans, fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Renewal Date</label>
            <input
              type="date"
              value={form.renewalDate}
              onChange={e => setForm(f => ({ ...f, renewalDate: e.target.value }))}
              style={{ ...selectStyle, width: '100%', padding: '7px 8px', fontSize: 12 }}
            />
          </div>

          {/* Notes */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ ...sans, fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              placeholder="Optional notes..."
              style={{ ...selectStyle, width: '100%', padding: '7px 8px', fontSize: 12, resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Save / Cancel */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button
            onClick={() => setModalOpen(false)}
            style={{ ...sans, fontSize: 12, fontWeight: 500, padding: '7px 16px', borderRadius: 8, border: '1px solid var(--border-card)', background: 'var(--bg-card)', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{ ...sans, fontSize: 12, fontWeight: 600, padding: '7px 16px', borderRadius: 8, border: 'none', background: '#059669', color: 'white', cursor: 'pointer' }}
          >
            {editingId ? 'Update' : 'Save'}
          </button>
        </div>
      </Modal>

      {ConfirmDialog}
      {toast.ToastContainer}

      {/* ── Print styles ── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
        }
        @media (max-width: 768px) {
          table { font-size: 10px !important; }
        }
      `}</style>
    </div>
  )
}
