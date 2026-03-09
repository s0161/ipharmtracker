import { useState, useMemo, useEffect } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import { generateId, formatDate } from '../utils/helpers'
import { downloadCsv } from '../utils/exportCsv'
import { logAudit } from '../utils/auditLog'
import { useToast } from '../components/Toast'
import { useUser } from '../contexts/UserContext'
import { useConfirm } from '../components/ConfirmDialog'
import PageActions from '../components/PageActions'
import SkeletonLoader from '../components/SkeletonLoader'

// ─── Design Tokens ────────────────────────────────────────────────
const PRIMARY = '#16a34a'

const SEV_COLORS = {
  Low:    { color: '#16a34a', bg: 'rgba(22,163,74,0.10)' },
  Medium: { color: '#d97706', bg: 'rgba(217,119,6,0.10)' },
  High:   { color: '#dc2626', bg: 'rgba(220,38,38,0.10)' },
}

const STATUS_STYLE = {
  Open:           { color: '#dc2626', bg: 'rgba(220,38,38,0.10)', icon: '●' },
  'Action Taken': { color: '#d97706', bg: 'rgba(217,119,6,0.10)', icon: '◐' },
  Resolved:       { color: '#16a34a', bg: 'rgba(22,163,74,0.10)', icon: '✓' },
}

// ─── Constants ────────────────────────────────────────────────────
const CATEGORIES = [
  'Wrong medication dispensed',
  'Wrong dose',
  'Wrong patient',
  'Labelling error',
  'Near miss — controlled drug',
  'Packaging/product issue',
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

// ─── Shared Classes ───────────────────────────────────────────────
const inputClass =
  'w-full bg-white/60 dark:bg-white/5 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-ec-t1 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-gray-400 font-sans'

const inputErrorClass =
  'w-full bg-white/60 dark:bg-white/5 border-2 border-red-400 rounded-lg px-3 py-2.5 text-sm text-ec-t1 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all placeholder:text-gray-400 font-sans'

const selectClass =
  'bg-ec-card border border-ec-border rounded-lg px-3 py-2 text-sm text-ec-t1 font-sans focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all'

// ─── Helpers ──────────────────────────────────────────────────────

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

function parseStaffList(str) {
  if (!str) return []
  return str.split(',').map((s) => s.trim()).filter(Boolean)
}

// ─── Badge Components ─────────────────────────────────────────────

function SeverityBadge({ severity }) {
  const s = SEV_COLORS[severity] || SEV_COLORS.Low
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      <span
        style={{
          width: 6, height: 6, borderRadius: '50%',
          backgroundColor: s.color, display: 'inline-block', flexShrink: 0,
        }}
      />
      {severity}
    </span>
  )
}

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.Open
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {s.icon} {status}
    </span>
  )
}

function CategoryBadge({ category }) {
  const isHighRisk = category === 'Wrong patient' || category === 'Near miss — controlled drug'
  const isMedRisk = category === 'Wrong medication dispensed' || category === 'Wrong dose'
  const color = isHighRisk ? '#dc2626' : isMedRisk ? '#d97706' : '#6b7280'
  const bg = isHighRisk ? 'rgba(220,38,38,0.08)' : isMedRisk ? 'rgba(217,119,6,0.08)' : 'rgba(107,114,128,0.08)'
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: bg, color }}>
      {category}
    </span>
  )
}

// ─── Staff Pill Selector (Multi-Toggle) ───────────────────────────

function StaffPillSelector({ staffMembers, selected, onChange, label }) {
  const selectedList = parseStaffList(selected)

  const toggle = (name) => {
    const current = new Set(selectedList)
    if (current.has(name)) current.delete(name)
    else current.add(name)
    onChange([...current].join(', '))
  }

  if (staffMembers.length === 0) {
    return (
      <input
        type="text"
        className={inputClass}
        placeholder={`Enter ${label.toLowerCase()}...`}
        value={selected}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }

  return (
    <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white/60 dark:bg-white/5 min-h-[44px]">
      {staffMembers.map((name) => {
        const isActive = selectedList.includes(name)
        return (
          <button
            key={name}
            type="button"
            onClick={() => toggle(name)}
            className="px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border-none"
            style={{
              backgroundColor: isActive ? PRIMARY : 'rgba(107,114,128,0.08)',
              color: isActive ? '#fff' : 'var(--ec-t2)',
            }}
          >
            {getInitials(name)} {name.split(' ')[0]}
          </button>
        )
      })}
    </div>
  )
}

// ─── Custom Modal (avoids shared Modal.jsx dark-green bg) ─────────

function NearMissModal({ open, onClose, title, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden ec-fadeup"
        style={{
          backgroundColor: 'var(--ec-card)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          border: '1px solid var(--ec-border)',
        }}
      >
        {/* Green header bar */}
        <div className="flex items-center justify-between px-6 py-4" style={{ backgroundColor: PRIMARY }}>
          <h2 className="text-base font-bold text-white">{title}</h2>
          <button
            className="w-7 h-7 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all border-none cursor-pointer"
            style={{ backgroundColor: 'transparent' }}
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────

function StatCard({ icon, value, label, accent }) {
  return (
    <div
      className="rounded-xl p-4 transition-all hover:shadow-md"
      style={{
        backgroundColor: 'var(--ec-card)',
        border: '1px solid var(--ec-border)',
        borderLeft: `3px solid ${accent || PRIMARY}`,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
          style={{ backgroundColor: `${accent || PRIMARY}12`, color: accent || PRIMARY }}
        >
          {icon}
        </div>
        <div>
          <div className="text-2xl font-bold text-ec-t1">{value}</div>
          <div className="text-xs text-ec-t3 font-medium">{label}</div>
        </div>
      </div>
    </div>
  )
}

// ─── Detail Field ─────────────────────────────────────────────────

function DetailField({ label, value }) {
  return (
    <div>
      <span className="text-xs font-semibold text-ec-t3 uppercase tracking-wide">{label}</span>
      <p className="text-sm text-ec-t1 mt-1">{value || '\u2014'}</p>
    </div>
  )
}

// ─── Near Miss Card ───────────────────────────────────────────────

function NearMissCard({ entry, expanded, onToggle, onEdit, onDelete }) {
  const sev = SEV_COLORS[entry.severity] || SEV_COLORS.Low
  const involved = parseStaffList(entry.whoInvolved)

  return (
    <div
      className="rounded-xl overflow-hidden transition-all hover:shadow-md cursor-pointer group"
      style={{
        backgroundColor: 'var(--ec-card)',
        border: '1px solid var(--ec-border)',
        borderLeft: `4px solid ${sev.color}`,
      }}
      onClick={onToggle}
    >
      {/* Card header */}
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Top row: date + badges */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-xs text-ec-t3 font-medium">{formatDate(entry.date)}</span>
              <CategoryBadge category={entry.category} />
              <SeverityBadge severity={entry.severity} />
              <StatusBadge status={entry.status} />
            </div>

            {/* Description */}
            <p className="text-sm text-ec-t1 leading-relaxed">
              {expanded
                ? entry.description
                : (entry.description || '').length > 120
                  ? entry.description.slice(0, 120) + '...'
                  : entry.description || ''}
            </p>

            {/* Staff pills + root cause hint */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {involved.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: 'rgba(22,163,74,0.08)', color: PRIMARY }}
                >
                  <span
                    className="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: PRIMARY, color: '#fff' }}
                  >
                    {getInitials(name).charAt(0)}
                  </span>
                  {name.split(' ')[0]}
                </span>
              ))}
              {entry.rootCause && !expanded && (
                <span className="text-xs text-ec-t3 italic truncate max-w-[200px]">
                  Root cause: {entry.rootCause}
                </span>
              )}
            </div>
          </div>

          {/* Expand chevron */}
          <svg
            className="w-5 h-5 text-ec-t3 group-hover:text-ec-t1 transition-all flex-shrink-0 mt-1"
            style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Expanded detail panel */}
      {expanded && (
        <div
          className="px-4 pb-4 pt-3 border-t"
          style={{ borderColor: 'var(--ec-border)', backgroundColor: 'var(--ec-bg)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailField label="Root Cause" value={entry.rootCause} />
            <DetailField label="Learning Action" value={entry.learningAction} />
            <DetailField label="Action Taken By" value={entry.actionTakenBy} />
            <DetailField label="Action Date" value={formatDate(entry.actionDate)} />
          </div>

          <div className="flex items-center gap-2 mt-4 pt-3 border-t" style={{ borderColor: 'var(--ec-border)' }}>
            <button
              className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all border border-ec-border text-ec-t2 hover:text-ec-t1 font-sans"
              style={{ backgroundColor: 'var(--ec-card)' }}
              onClick={() => onEdit(entry)}
            >
              Edit
            </button>
            <button
              className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all border font-sans"
              style={{ borderColor: 'rgba(220,38,38,0.2)', backgroundColor: 'rgba(220,38,38,0.05)', color: '#dc2626' }}
              onClick={() => onDelete(entry)}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
//  Main Component
// ═══════════════════════════════════════════════════════════════════

export default function NearMissLog() {
  // ─── Data hooks (UNTOUCHED) ─────────────────────────────────────
  const [entries, setEntries, loading] = useSupabase('near_misses', [])
  const [staffMembers] = useSupabase('staff_members', [], { valueField: 'name' })
  const showToast = useToast()
  const { user } = useUser()
  const { confirm, ConfirmDialog } = useConfirm()

  // ─── UI State ───────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [formErrors, setFormErrors] = useState({})
  const [page, setPage] = useState(1)
  const PER_PAGE = 20

  // ─── Handlers (logic UNTOUCHED) ─────────────────────────────────

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
    if (formErrors[field]) setFormErrors({ ...formErrors, [field]: undefined })
  }

  const updateDirect = (field, value) => {
    setForm({ ...form, [field]: value })
    if (formErrors[field]) setFormErrors({ ...formErrors, [field]: undefined })
  }

  // ─── Computed Stats ─────────────────────────────────────────────

  const stats = useMemo(() => {
    const now = new Date()
    const thisMonth = entries.filter((e) => {
      if (!e.date) return false
      const d = new Date(e.date + 'T00:00:00')
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    return {
      total: entries.length,
      highSeverity: entries.filter((e) => e.severity === 'High').length,
      thisMonth: thisMonth.length,
      resolved: entries.filter((e) => e.status === 'Resolved').length,
    }
  }, [entries])

  // ─── Filtering + Sorting + Pagination ───────────────────────────

  const { sorted, totalPages, displayed, safePage } = useMemo(() => {
    const filtered = entries.filter((e) => {
      if (filterCategory && e.category !== filterCategory) return false
      if (filterStatus && e.status !== filterStatus) return false
      if (filterSeverity && e.severity !== filterSeverity) return false
      if (filterDateFrom && e.date < filterDateFrom) return false
      if (filterDateTo && e.date > filterDateTo) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !(e.description || '').toLowerCase().includes(q) &&
          !(e.whoInvolved || '').toLowerCase().includes(q) &&
          !(e.rootCause || '').toLowerCase().includes(q)
        ) return false
      }
      return true
    })
    const s = [...filtered].sort(
      (a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
    )
    const tp = Math.max(1, Math.ceil(s.length / PER_PAGE))
    const sp = Math.min(page, tp)
    return {
      sorted: s,
      totalPages: tp,
      displayed: s.slice((sp - 1) * PER_PAGE, sp * PER_PAGE),
      safePage: sp,
    }
  }, [entries, filterCategory, filterStatus, filterSeverity, filterDateFrom, filterDateTo, search, page])

  const handleCsvDownload = () => {
    const headers = [
      'Date', 'Category', 'Severity', 'Description', 'Who Involved',
      'Root Cause', 'Learning Action', 'Action Taken By', 'Action Date', 'Status',
    ]
    const rows = sorted.map((e) => [
      e.date || '', e.category || '', e.severity || '', e.description || '',
      e.whoInvolved || '', e.rootCause || '', e.learningAction || '',
      e.actionTakenBy || '', e.actionDate || '', e.status || '',
    ])
    downloadCsv('near-misses', headers, rows)
  }

  const hasActiveFilters =
    filterCategory || filterStatus || filterSeverity || filterDateFrom || filterDateTo || search

  const clearFilters = () => {
    setFilterCategory('')
    setFilterStatus('')
    setFilterSeverity('')
    setFilterDateFrom('')
    setFilterDateTo('')
    setSearch('')
    setPage(1)
  }

  // ─── Loading Guard ──────────────────────────────────────────────
  if (loading) return <SkeletonLoader variant="table" />

  // ═══════════════════════════════════════════════════════════════
  //  Render
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-ec-t3">
          Track near misses, identify root causes, and record learning actions.
        </p>
        <button
          className="px-4 py-2.5 rounded-xl text-sm font-bold text-white border-none cursor-pointer transition-all hover:shadow-lg flex items-center gap-2 font-sans"
          style={{ backgroundColor: PRIMARY, boxShadow: `0 2px 8px ${PRIMARY}40` }}
          onClick={openAdd}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Record Near Miss
        </button>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon="⚠️" value={stats.total} label="Total Near Misses" accent={PRIMARY} />
        <StatCard icon="🔴" value={stats.highSeverity} label="High Severity" accent="#dc2626" />
        <StatCard icon="📅" value={stats.thisMonth} label="This Month" accent="#3b82f6" />
        <StatCard icon="✓" value={stats.resolved} label="Resolved" accent={PRIMARY} />
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search with icon */}
        <div className="relative flex-1 min-w-[180px] max-w-[280px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ec-t3 pointer-events-none"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="w-full bg-ec-card border border-ec-border rounded-lg pl-9 pr-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans"
            placeholder="Search..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select className={selectClass} value={filterSeverity} onChange={(e) => { setFilterSeverity(e.target.value); setPage(1) }}>
          <option value="">All Severities</option>
          {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className={selectClass} value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1) }}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className={selectClass} value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}>
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input
          type="date"
          className={selectClass}
          value={filterDateFrom}
          onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1) }}
          title="From date"
        />
        <input
          type="date"
          className={selectClass}
          value={filterDateTo}
          onChange={(e) => { setFilterDateTo(e.target.value); setPage(1) }}
          title="To date"
        />
        {hasActiveFilters && (
          <button
            className="px-3 py-2 text-xs font-semibold text-ec-t3 hover:text-ec-t1 cursor-pointer border-none bg-transparent transition-colors font-sans"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        )}
        <PageActions onDownloadCsv={handleCsvDownload} />
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-ec-t3 font-medium">
          {sorted.length} {sorted.length === 1 ? 'result' : 'results'}
          {hasActiveFilters ? ` (filtered from ${entries.length})` : ''}
        </span>
      </div>

      {/* Card List / Empty States */}
      {entries.length === 0 ? (
        <div
          className="text-center py-16 rounded-2xl"
          style={{ backgroundColor: 'var(--ec-card)', border: '1px solid var(--ec-border)' }}
        >
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="text-lg font-bold text-ec-t1 mb-2">No near misses logged</h3>
          <p className="text-sm text-ec-t3 mb-6 max-w-md mx-auto">
            Near miss reports will appear here. Recording near misses helps prevent future incidents and improves patient safety.
          </p>
          <button
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white border-none cursor-pointer transition-all hover:shadow-lg font-sans"
            style={{ backgroundColor: PRIMARY }}
            onClick={openAdd}
          >
            Record First Near Miss
          </button>
        </div>
      ) : sorted.length === 0 ? (
        <div
          className="text-center py-12 rounded-2xl"
          style={{ backgroundColor: 'var(--ec-card)', border: '1px solid var(--ec-border)' }}
        >
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-sm text-ec-t3">No near misses match the current filters.</p>
          <button
            className="mt-3 text-sm font-semibold cursor-pointer border-none bg-transparent transition-colors font-sans"
            style={{ color: PRIMARY }}
            onClick={clearFilters}
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((entry) => (
            <NearMissCard
              key={entry.id}
              entry={entry}
              expanded={expandedId === entry.id}
              onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {sorted.length > PER_PAGE && (
        <div className="flex justify-between items-center">
          <button
            className={`px-4 py-2 rounded-lg bg-ec-card border border-ec-border text-ec-t1 text-sm font-sans transition-colors ${
              safePage <= 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-ec-card-hover cursor-pointer'
            }`}
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Previous
          </button>
          <span className="text-sm text-ec-t2">
            {(safePage - 1) * PER_PAGE + 1}–{Math.min(safePage * PER_PAGE, sorted.length)} of {sorted.length}
          </span>
          <button
            className={`px-4 py-2 rounded-lg bg-ec-card border border-ec-border text-ec-t1 text-sm font-sans transition-colors ${
              safePage >= totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-ec-card-hover cursor-pointer'
            }`}
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next →
          </button>
        </div>
      )}

      {/* ─── Add/Edit Modal ──────────────────────────────────────── */}
      <NearMissModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Near Miss' : 'Record Near Miss'}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Date + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-ec-t2 mb-1.5 block">Date *</label>
              <input type="date" className={inputClass} value={form.date} onChange={update('date')} required />
            </div>
            <div>
              <label className="text-xs font-semibold text-ec-t2 mb-1.5 block">Category *</label>
              <select
                className={formErrors.category ? inputErrorClass : inputClass}
                value={form.category}
                onChange={update('category')}
                required
              >
                <option value="">Select category...</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {formErrors.category && <p className="text-xs text-red-500 mt-1">{formErrors.category}</p>}
            </div>
          </div>

          {/* Severity (toggle buttons) + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-ec-t2 mb-1.5 block">Severity *</label>
              <div className="flex gap-2">
                {SEVERITIES.map((s) => {
                  const sc = SEV_COLORS[s]
                  const active = form.severity === s
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => updateDirect('severity', s)}
                      className="flex-1 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all border-2"
                      style={{
                        backgroundColor: active ? sc.bg : 'transparent',
                        borderColor: active ? sc.color : 'var(--ec-border)',
                        color: active ? sc.color : 'var(--ec-t3)',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-block', width: 6, height: 6,
                          borderRadius: '50%', backgroundColor: sc.color, marginRight: 4,
                        }}
                      />
                      {s}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-ec-t2 mb-1.5 block">Status</label>
              <select className={inputClass} value={form.status} onChange={update('status')}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Description (full-width) */}
          <div>
            <label className="text-xs font-semibold text-ec-t2 mb-1.5 block">Description *</label>
            <textarea
              className={(formErrors.description ? inputErrorClass : inputClass) + ' resize-none'}
              placeholder="Describe the near miss in detail..."
              value={form.description}
              onChange={update('description')}
              rows={3}
              required
            />
            {formErrors.description && <p className="text-xs text-red-500 mt-1">{formErrors.description}</p>}
          </div>

          {/* Who Involved (pill selector) */}
          <div>
            <label className="text-xs font-semibold text-ec-t2 mb-1.5 block">Who Involved</label>
            <StaffPillSelector
              staffMembers={staffMembers}
              selected={form.whoInvolved}
              onChange={(val) => updateDirect('whoInvolved', val)}
              label="Who Involved"
            />
          </div>

          {/* Root Cause (full-width) */}
          <div>
            <label className="text-xs font-semibold text-ec-t2 mb-1.5 block">Root Cause</label>
            <textarea
              className={inputClass + ' resize-none'}
              placeholder="What caused this near miss?"
              value={form.rootCause}
              onChange={update('rootCause')}
              rows={2}
            />
          </div>

          {/* Learning Action (full-width) */}
          <div>
            <label className="text-xs font-semibold text-ec-t2 mb-1.5 block">Learning Action</label>
            <textarea
              className={inputClass + ' resize-none'}
              placeholder="What was learned? What changes were made?"
              value={form.learningAction}
              onChange={update('learningAction')}
              rows={2}
            />
          </div>

          {/* Action Taken By + Action Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-ec-t2 mb-1.5 block">Action Taken By</label>
              {staffMembers.length === 0 ? (
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Enter name"
                  value={form.actionTakenBy}
                  onChange={update('actionTakenBy')}
                />
              ) : (
                <select className={inputClass} value={form.actionTakenBy} onChange={update('actionTakenBy')}>
                  <option value="">Select person...</option>
                  {staffMembers.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-ec-t2 mb-1.5 block">Action Date</label>
              <input type="date" className={inputClass} value={form.actionDate} onChange={update('actionDate')} />
            </div>
          </div>

          {/* Full-width submit button */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl text-sm font-bold text-white border-none cursor-pointer transition-all hover:shadow-lg font-sans"
            style={{ backgroundColor: PRIMARY, boxShadow: `0 2px 8px ${PRIMARY}40` }}
          >
            {editingId ? 'Save Changes' : 'Record Near Miss'}
          </button>
        </form>
      </NearMissModal>

      {ConfirmDialog}
    </div>
  )
}
