/*
  Training & Competency — Full training management system
  Matrix view (staff × training items), personal records, expiring alerts,
  and training library. Uses training_logs table for records, hardcoded
  TRAINING_ITEMS for the required curriculum.

  Supabase table: training_logs
  Fields: id, staff_name, date_completed, topic, trainer_name,
          delivery_method, duration, outcome, certificate_expiry,
          renewal_date, notes, created_at
*/

import { useState, useMemo, useCallback, useRef } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import { useUser } from '../contexts/UserContext'
import { logAudit } from '../utils/auditLog'
import { generateId, formatDate } from '../utils/helpers'
import { isElevatedRole } from '../utils/taskEngine'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/ConfirmDialog'
import { downloadCsv } from '../utils/exportCsv'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import SkeletonLoader from '../components/SkeletonLoader'

// Inter font loaded via index.html

const sans = { fontFamily: "'Inter', sans-serif" }
const mono = { fontFamily: "'DM Mono', monospace" }

// ═══════════════════════════════════════════════════════════
//  TRAINING ITEMS — Master curriculum (19 items, 4 categories)
// ═══════════════════════════════════════════════════════════
const TRAINING_ITEMS = [
  // MANDATORY
  { id: 'safeguarding-adults', name: 'Safeguarding Adults — Level 1', category: 'mandatory', requiredRoles: ['all'], renewalMonths: 24, evidenceRequired: true, isMandatory: true },
  { id: 'safeguarding-children', name: 'Safeguarding Children — Level 1', category: 'mandatory', requiredRoles: ['all'], renewalMonths: 24, evidenceRequired: true, isMandatory: true },
  { id: 'gdpr', name: 'Information Governance / GDPR', category: 'mandatory', requiredRoles: ['all'], renewalMonths: 12, evidenceRequired: true, isMandatory: true },
  { id: 'fire-safety', name: 'Fire Safety Awareness', category: 'mandatory', requiredRoles: ['all'], renewalMonths: 12, evidenceRequired: true, isMandatory: true },
  { id: 'health-safety', name: 'Health & Safety Induction', category: 'mandatory', requiredRoles: ['all'], renewalMonths: null, evidenceRequired: true, isMandatory: true },
  { id: 'lone-working', name: 'Lone Working Awareness', category: 'mandatory', requiredRoles: ['all'], renewalMonths: 12, evidenceRequired: false, isMandatory: true },
  { id: 'equality-diversity', name: 'Equality & Diversity', category: 'mandatory', requiredRoles: ['all'], renewalMonths: 24, evidenceRequired: true, isMandatory: true },

  // DISPENSING
  { id: 'dispensing-accuracy', name: 'Dispensing Accuracy Checks', category: 'dispensing', requiredRoles: ['superintendent', 'pharmacist', 'technician', 'dispenser'], renewalMonths: 12, evidenceRequired: true, isMandatory: true },
  { id: 'cd-handling', name: 'Controlled Drugs Handling', category: 'dispensing', requiredRoles: ['superintendent', 'pharmacist', 'technician', 'dispenser'], renewalMonths: 12, evidenceRequired: true, isMandatory: true },
  { id: 'near-miss', name: 'Near Miss & Incident Reporting', category: 'dispensing', requiredRoles: ['all'], renewalMonths: 12, evidenceRequired: false, isMandatory: true },
  { id: 'prescription-validation', name: 'Prescription Validation', category: 'dispensing', requiredRoles: ['superintendent', 'pharmacist', 'technician'], renewalMonths: 12, evidenceRequired: true, isMandatory: true },
  { id: 'mds-blister', name: 'MDS / Blister Pack Preparation', category: 'dispensing', requiredRoles: ['technician', 'dispenser'], renewalMonths: 12, evidenceRequired: true, isMandatory: false },
  { id: 'methadone', name: 'Methadone / Supervised Consumption', category: 'dispensing', requiredRoles: ['superintendent', 'pharmacist', 'technician'], renewalMonths: 12, evidenceRequired: true, isMandatory: false },

  // ADMIN
  { id: 'gdpr-admin', name: 'GDPR for Administrative Staff', category: 'admin', requiredRoles: ['manager'], renewalMonths: 12, evidenceRequired: true, isMandatory: true },
  { id: 'complaints', name: 'Complaints Handling Procedure', category: 'admin', requiredRoles: ['superintendent', 'manager', 'pharmacist'], renewalMonths: 12, evidenceRequired: false, isMandatory: true },
  { id: 'confidential-waste', name: 'Confidential Waste Procedure', category: 'admin', requiredRoles: ['superintendent', 'manager', 'technician'], renewalMonths: 12, evidenceRequired: false, isMandatory: true },

  // SUPERINTENDENT
  { id: 'gphc-cpd', name: 'GPhC CPD Requirements', category: 'superintendent', requiredRoles: ['superintendent', 'pharmacist'], renewalMonths: 12, evidenceRequired: true, isMandatory: true },
  { id: 'rp-obligations', name: 'Responsible Pharmacist Obligations', category: 'superintendent', requiredRoles: ['superintendent', 'pharmacist'], renewalMonths: 12, evidenceRequired: true, isMandatory: true },
  { id: 'clinical-governance', name: 'Clinical Governance Updates', category: 'superintendent', requiredRoles: ['superintendent', 'pharmacist'], renewalMonths: 12, evidenceRequired: true, isMandatory: true },
]

const CATEGORIES = [
  { key: 'mandatory', label: 'Mandatory', accent: 'var(--ec-em)', icon: '🛡️' },
  { key: 'dispensing', label: 'Dispensing', accent: 'var(--ec-info)', icon: '💊' },
  { key: 'admin', label: 'Administrative', accent: 'var(--ec-cat-purple)', icon: '📋' },
  { key: 'superintendent', label: 'Superintendent', accent: 'var(--ec-warn)', icon: '⚕️' },
]

const STATUS_CONFIG = {
  complete:    { bg: 'var(--ec-em-bg)', color: 'var(--ec-em)', border: 'var(--ec-em-border)', label: 'Complete', shortLabel: '✓' },
  expiring:    { bg: 'var(--ec-warn-bg)', color: 'var(--ec-warn)', border: 'var(--ec-warn-border)', label: 'Expiring', shortLabel: 'DUE' },
  expired:     { bg: 'var(--ec-crit-bg)', color: 'var(--ec-crit)', border: 'var(--ec-crit-border)', label: 'Overdue', shortLabel: 'OVR' },
  in_progress: { bg: 'var(--ec-info-bg)', color: 'var(--ec-info)', border: 'var(--ec-info-border)', label: 'In Progress', shortLabel: '◐' },
  not_started: { bg: 'var(--ec-card-hover)', color: 'var(--ec-t3)', border: 'var(--ec-t5)', label: 'Not Started', shortLabel: '—' },
  na:          { bg: 'transparent', color: 'var(--ec-t4)', border: 'transparent', label: 'N/A', shortLabel: 'N/A' },
}

const DELIVERY_METHODS = ['Classroom', 'Online', 'On-the-job', 'Self-study']
const OUTCOMES = ['Pass', 'Attended', 'Certificate Issued']

// ═══════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════
function getToday() { return new Date().toISOString().slice(0, 10) }

function daysUntil(dateStr) {
  if (!dateStr) return null
  const now = new Date(); now.setHours(0, 0, 0, 0)
  return Math.ceil((new Date(dateStr + 'T00:00:00') - now) / 86400000)
}

function roleMatchesItem(role, item) {
  if (!role) return false
  if (item.requiredRoles.includes('all')) return true
  return item.requiredRoles.includes(role)
}

function findLatestRecord(logs, staffName, itemName) {
  return logs
    .filter(r => r.staffName === staffName && r.topic === itemName)
    .sort((a, b) => (b.dateCompleted || '').localeCompare(a.dateCompleted || ''))
    [0] || null
}

function deriveStatus(record) {
  if (!record) return 'not_started'
  if (record.outcome && ['Pass', 'Attended', 'Certificate Issued'].includes(record.outcome)) {
    if (record.certificateExpiry) {
      const days = daysUntil(record.certificateExpiry)
      if (days !== null && days < 0) return 'expired'
      if (days !== null && days <= 30) return 'expiring'
    }
    return 'complete'
  }
  if (record.dateCompleted) return 'in_progress'
  return 'not_started'
}

function shortYear(dateStr) {
  if (!dateStr) return ''
  return "'" + dateStr.slice(2, 4)
}

function getInitials(name) {
  return (name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

// ═══════════════════════════════════════════════════════════
//  SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════

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
        <span style={{ ...sans, fontSize: 13, fontWeight: 700, color: 'var(--ec-t1)' }}>{title}</span>
      </div>
      {right && <div>{right}</div>}
    </div>
  )
}

function StatCard({ icon, label, value, total, accent, showBar, onClick, active }) {
  const pct = total ? Math.round((value / total) * 100) : 0
  return (
    <div
      onClick={onClick}
      style={{
        background: active ? `${accent}10` : 'var(--ec-card)',
        borderRadius: 12, padding: '14px 16px',
        border: `1px solid ${active ? accent : 'var(--ec-div)'}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 150ms',
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: showBar ? 8 : 0 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...mono, fontSize: 22, fontWeight: 700, color: accent, lineHeight: 1 }}>
            {total !== undefined ? `${value} / ${total}` : value}
          </div>
          <div style={{ ...sans, fontSize: 10, color: 'var(--ec-t2)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
        </div>
      </div>
      {showBar && (
        <div style={{ height: 6, borderRadius: 3, background: 'var(--ec-t5)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 3, background: accent,
            width: `${pct}%`, transition: 'width 600ms ease',
          }} />
        </div>
      )}
    </div>
  )
}

function StatusPill({ status, compact }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.not_started
  return (
    <span style={{
      ...sans, fontSize: compact ? 9 : 10, fontWeight: 600,
      padding: compact ? '1px 5px' : '2px 7px', borderRadius: 20,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap', display: 'inline-block',
    }}>
      {compact ? s.shortLabel : s.label}
    </span>
  )
}

function TabBar({ active, tabs, onChange }) {
  return (
    <div style={{
      display: 'flex', gap: 0, borderBottom: '1px solid var(--ec-div)',
      marginBottom: 16, overflowX: 'auto',
    }}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          style={{
            ...sans, fontSize: 12, fontWeight: active === tab.key ? 600 : 400,
            color: active === tab.key ? 'var(--ec-em)' : 'var(--ec-t2)',
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '10px 16px', whiteSpace: 'nowrap',
            borderBottom: active === tab.key ? '2px solid var(--ec-em)' : '2px solid transparent',
            transition: 'all 150ms',
          }}
        >
          {tab.label}
          {tab.badge > 0 && (
            <span style={{
              ...mono, fontSize: 9, fontWeight: 700,
              padding: '1px 5px', borderRadius: 10, marginLeft: 6,
              background: tab.badgeColor || 'var(--ec-card-hover)', color: tab.badgeTextColor || 'var(--ec-t2)',
            }}>
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ── Matrix Cell ──
function MatrixCell({ status, record, onClick, compact }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.not_started
  if (status === 'na') {
    return (
      <td style={{
        ...sans, fontSize: 10, color: 'var(--ec-t4)', textAlign: 'center',
        padding: '6px 4px', borderBottom: '1px solid var(--ec-card-hover)',
        borderRight: '1px solid var(--ec-card-hover)',
      }}>
        N/A
      </td>
    )
  }

  const year = record?.dateCompleted ? shortYear(record.dateCompleted) : ''
  let cellLabel = s.shortLabel
  if (status === 'complete' && year) cellLabel = `✓ ${year}`
  if (status === 'expired' && record?.certificateExpiry) {
    const d = Math.abs(daysUntil(record.certificateExpiry))
    cellLabel = `${d}d`
  }
  if (status === 'expiring' && record?.certificateExpiry) {
    const d = daysUntil(record.certificateExpiry)
    cellLabel = `${d}d`
  }

  return (
    <td
      onClick={onClick}
      style={{
        textAlign: 'center', padding: '6px 4px', cursor: onClick ? 'pointer' : 'default',
        borderBottom: '1px solid var(--ec-card-hover)', borderRight: '1px solid var(--ec-card-hover)',
        minWidth: 80, height: 44, verticalAlign: 'middle',
      }}
      title={`${s.label}${record?.dateCompleted ? ` — ${formatDate(record.dateCompleted)}` : ''}${record?.certificateExpiry ? ` (exp: ${formatDate(record.certificateExpiry)})` : ''}`}
    >
      <span style={{
        ...mono, fontSize: 10, fontWeight: 600,
        padding: '2px 8px', borderRadius: 12,
        background: s.bg, color: s.color,
        border: `1px solid ${s.border}`,
        display: 'inline-block', minWidth: 32,
      }}>
        {cellLabel}
      </span>
    </td>
  )
}

// ═══════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function TrainingLogs() {
  const [logs, setLogs, loading] = useSupabase('training_logs', [])
  const [staffMembers] = useSupabase('staff_members', [])
  const { user } = useUser()
  const toast = useToast()
  const { confirm, ConfirmDialog } = useConfirm()

  const elevated = user && isElevatedRole(user.role)
  const [activeTab, setActiveTab] = useState('matrix')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterRole, setFilterRole] = useState('')

  const emptyForm = {
    staffName: '', dateCompleted: getToday(), topic: '',
    trainerName: '', deliveryMethod: 'Classroom', duration: '',
    outcome: 'Pass', certificateExpiry: '', renewalDate: '', notes: '',
  }
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState({})

  // ── Active staff sorted by name ──
  const activeStaff = useMemo(() =>
    staffMembers.filter(s => s.name).sort((a, b) => a.name.localeCompare(b.name)),
    [staffMembers]
  )

  // ── Filter staff for matrix by role ──
  const matrixStaff = useMemo(() => {
    if (!filterRole) return activeStaff
    return activeStaff.filter(s => s.role === filterRole)
  }, [activeStaff, filterRole])

  // ── My applicable items ──
  const myItems = useMemo(() =>
    TRAINING_ITEMS.filter(i => roleMatchesItem(user?.role, i)),
    [user?.role]
  )

  // ── My stats ──
  const myStats = useMemo(() => {
    const total = myItems.length
    let complete = 0, inProgress = 0, expiring = 0, expired = 0
    myItems.forEach(item => {
      const record = findLatestRecord(logs, user?.name, item.name)
      const status = deriveStatus(record)
      if (status === 'complete') complete++
      else if (status === 'in_progress') inProgress++
      else if (status === 'expiring') expiring++
      else if (status === 'expired') expired++
    })
    return { total, complete, inProgress, expiring, expired }
  }, [myItems, logs, user?.name])

  // ── Matrix data: items grouped by category, each with per-staff cell status ──
  const matrixData = useMemo(() => {
    return CATEGORIES.map(cat => {
      const items = TRAINING_ITEMS.filter(i => i.category === cat.key)
        .filter(i => {
          if (search) {
            const q = search.toLowerCase()
            return i.name.toLowerCase().includes(q)
          }
          return true
        })
      return {
        ...cat,
        items: items.map(item => ({
          item,
          cells: matrixStaff.map(staff => {
            const applies = roleMatchesItem(staff.role, item)
            if (!applies) return { status: 'na', record: null, staff }
            const record = findLatestRecord(logs, staff.name, item.name)
            const status = deriveStatus(record)
            if (filterStatus && status !== filterStatus) return null
            return { status, record, staff }
          }).filter(Boolean)
        })).filter(row => {
          if (!filterStatus) return true
          return row.cells.some(c => c.status !== 'na')
        })
      }
    }).filter(cat => {
      if (filterCategory && cat.key !== filterCategory) return false
      return cat.items.length > 0
    })
  }, [logs, matrixStaff, search, filterCategory, filterStatus])

  // ── Expiring / overdue records (all staff for elevated, own for others) ──
  const expiringRecords = useMemo(() => {
    const results = []
    const staffToCheck = elevated ? activeStaff : activeStaff.filter(s => s.name === user?.name)

    staffToCheck.forEach(staff => {
      TRAINING_ITEMS.forEach(item => {
        if (!roleMatchesItem(staff.role, item)) return
        const record = findLatestRecord(logs, staff.name, item.name)
        const status = deriveStatus(record)
        if (status === 'expired' || status === 'expiring') {
          const days = record?.certificateExpiry ? daysUntil(record.certificateExpiry) : null
          results.push({ staff, item, record, status, daysLeft: days })
        }
      })
    })

    return results.sort((a, b) => (a.daysLeft || -999) - (b.daysLeft || -999))
  }, [logs, activeStaff, elevated, user?.name])

  // ── My records ──
  const myRecords = useMemo(() => {
    return myItems.map(item => {
      const record = findLatestRecord(logs, user?.name, item.name)
      return { item, record, status: deriveStatus(record) }
    })
  }, [myItems, logs, user?.name])

  // ── Overall matrix stats ──
  const matrixStats = useMemo(() => {
    let total = 0, complete = 0, expired = 0, expiring = 0
    activeStaff.forEach(staff => {
      TRAINING_ITEMS.forEach(item => {
        if (!roleMatchesItem(staff.role, item)) return
        total++
        const record = findLatestRecord(logs, staff.name, item.name)
        const status = deriveStatus(record)
        if (status === 'complete') complete++
        else if (status === 'expired') expired++
        else if (status === 'expiring') expiring++
      })
    })
    return { total, complete, expired, expiring }
  }, [activeStaff, logs])

  // ── Form handlers ──
  const openAdd = useCallback((prefillStaff, prefillTopic) => {
    setEditingId(null)
    const item = prefillTopic ? TRAINING_ITEMS.find(i => i.name === prefillTopic) : null
    const renewalMonths = item?.renewalMonths
    const today = getToday()
    let expiry = ''
    if (renewalMonths) {
      const d = new Date(today + 'T00:00:00')
      d.setMonth(d.getMonth() + renewalMonths)
      expiry = d.toISOString().slice(0, 10)
    }
    setForm({
      staffName: prefillStaff || user?.name || '',
      dateCompleted: today,
      topic: prefillTopic || '',
      trainerName: '',
      deliveryMethod: 'Classroom',
      duration: '',
      outcome: 'Pass',
      certificateExpiry: expiry,
      renewalDate: '',
      notes: '',
    })
    setFormErrors({})
    setModalOpen(true)
  }, [user?.name])

  const openEdit = useCallback((record) => {
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
  }, [])

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
    logAudit('training_log_deleted', { id: record.id }, user?.name)
    toast.success('Record deleted')
  }

  // ── Matrix cell click ──
  const handleCellClick = useCallback((staff, item, record) => {
    if (!elevated && staff.name !== user?.name) return
    if (record) {
      openEdit(record)
    } else {
      openAdd(staff.name, item.name)
    }
  }, [elevated, user?.name, openEdit, openAdd])

  // ── CSV Export ──
  const handleExportMatrix = () => {
    const headers = ['Training Item', 'Category', ...matrixStaff.map(s => s.name)]
    const rows = []
    CATEGORIES.forEach(cat => {
      TRAINING_ITEMS.filter(i => i.category === cat.key).forEach(item => {
        const row = [item.name, cat.label]
        matrixStaff.forEach(staff => {
          if (!roleMatchesItem(staff.role, item)) { row.push('N/A'); return }
          const record = findLatestRecord(logs, staff.name, item.name)
          const status = deriveStatus(record)
          const s = STATUS_CONFIG[status]
          row.push(record?.dateCompleted ? `${s.label} (${formatDate(record.dateCompleted)})` : s.label)
        })
        rows.push(row)
      })
    })
    downloadCsv('training-matrix', headers, rows)
  }

  // ── Clear filters ──
  const clearFilters = () => { setSearch(''); setFilterCategory(''); setFilterStatus(''); setFilterRole('') }
  const hasFilters = search || filterCategory || filterStatus || filterRole

  // ── Tabs config ──
  const tabs = [
    { key: 'matrix', label: 'Matrix' },
    { key: 'my-records', label: 'My Records' },
    { key: 'expiring', label: 'Expiring Soon', badge: expiringRecords.length, badgeColor: 'var(--ec-crit-bg)', badgeTextColor: 'var(--ec-crit)' },
    ...(elevated ? [{ key: 'library', label: 'Training Library' }] : []),
  ]

  const dateFormatted = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const pct = myStats.total ? Math.round((myStats.complete / myStats.total) * 100) : 0

  // ── Unique roles for filter ──
  const usedRoles = useMemo(() => [...new Set(activeStaff.map(s => s.role).filter(Boolean))].sort(), [activeStaff])

  if (loading) {
    return (
      <div style={{ ...sans, padding: '24px 28px', maxWidth: 1400 }}>
        <SkeletonLoader variant="table" />
      </div>
    )
  }

  return (
    <div style={{ ...sans, padding: '24px 28px', maxWidth: 1400 }}>
      {/* ═══ HEADER ═══ */}
      <div className="page-header-panel" style={{ marginBottom: 20, background: 'linear-gradient(135deg, #faf9ff 0%, #f5f3ff 100%)', border: '1.5px solid rgba(99,91,255,0.2)', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 3px rgba(10,37,64,0.08), 0 4px 12px rgba(10,37,64,0.04)' }}>
        <div style={{ fontSize: 11, color: 'var(--ec-t3)', marginBottom: 6 }}>Dashboard / Training</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 4, height: 40, borderRadius: 4, background: 'linear-gradient(180deg, #635bff 0%, #4f46e5 100%)', flexShrink: 0 }} />
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>Training &amp; Competency</h1>
          </div>
          <span style={{ ...mono, fontSize: 13, color: 'var(--ec-t3)' }}>{dateFormatted}</span>
        </div>
        <p style={{ fontSize: 11, color: 'var(--ec-t3)', margin: '0 0 10px' }}>
          Staff training records, compliance matrix &amp; certification tracking
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {elevated && (
            <button
              onClick={() => openAdd('', '')}
              style={{ ...sans, fontSize: 11, fontWeight: 600, padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'var(--ec-em)', color: 'white' }}
            >
              + Add Record
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button
            onClick={handleExportMatrix}
            style={{ ...sans, fontSize: 11, fontWeight: 500, padding: '5px 12px', borderRadius: 7, border: '1px solid var(--ec-div)', background: '#fff', color: 'var(--ec-t2)', cursor: 'pointer' }}
          >
            Export CSV
          </button>
          <button
            onClick={() => window.print()}
            style={{ ...sans, fontSize: 11, fontWeight: 500, padding: '5px 12px', borderRadius: 7, border: '1px solid var(--ec-div)', background: '#fff', color: 'var(--ec-t2)', cursor: 'pointer' }}
          >
            Print
          </button>
        </div>
      </div>

      {/* ═══ STAT CARDS ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 10, marginBottom: 8 }}>
        <StatCard icon="✅" label="Completed" value={myStats.complete} total={myStats.total} accent="var(--ec-em)" showBar />
        <StatCard icon="🔵" label="In Progress" value={myStats.inProgress} accent="var(--ec-info)" />
        <StatCard icon="⚠️" label="Due Soon" value={myStats.expiring} accent="var(--ec-warn)" />
        <StatCard icon="🔴" label="Overdue" value={myStats.expired} accent="var(--ec-crit)" />
      </div>

      {/* Overall progress bar */}
      <div style={{ marginBottom: 20, padding: '10px 14px', background: 'var(--ec-card)', borderRadius: 10, border: '1px solid var(--ec-div)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ ...sans, fontSize: 11, color: 'var(--ec-t2)' }}>Your overall training completion</span>
          <span style={{ ...mono, fontSize: 13, fontWeight: 700, color: 'var(--ec-em)' }}>{pct}%</span>
        </div>
        <div style={{ height: 10, borderRadius: 5, background: 'var(--ec-t5)', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 5, background: 'linear-gradient(90deg, var(--ec-em), var(--ec-em-dark))', width: `${pct}%`, transition: 'width 800ms ease' }} />
        </div>
      </div>

      {/* ═══ TAB BAR ═══ */}
      <TabBar active={activeTab} tabs={tabs} onChange={setActiveTab} />

      {/* ═══ TAB: MATRIX ═══ */}
      {activeTab === 'matrix' && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
            <input
              type="text" placeholder="Search training items..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ ...sans, fontSize: 11, padding: '5px 10px', borderRadius: 6, border: '1px solid var(--ec-div)', background: '#fff', color: 'var(--ec-t1)', outline: 'none', width: 180 }}
            />
            <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ ...sans, fontSize: 11, padding: '5px 8px', borderRadius: 6, border: '1px solid var(--ec-div)', background: '#fff', color: 'var(--ec-t2)', outline: 'none', cursor: 'pointer' }}>
              <option value="">All Roles</option>
              {usedRoles.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ ...sans, fontSize: 11, padding: '5px 8px', borderRadius: 6, border: '1px solid var(--ec-div)', background: '#fff', color: 'var(--ec-t2)', outline: 'none', cursor: 'pointer' }}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...sans, fontSize: 11, padding: '5px 8px', borderRadius: 6, border: '1px solid var(--ec-div)', background: '#fff', color: 'var(--ec-t2)', outline: 'none', cursor: 'pointer' }}>
              <option value="">All Statuses</option>
              <option value="expired">Overdue</option>
              <option value="expiring">Expiring Soon</option>
              <option value="not_started">Not Started</option>
              <option value="complete">Complete</option>
            </select>
            {hasFilters && (
              <button onClick={clearFilters} style={{ ...sans, fontSize: 10, color: 'var(--ec-em)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                Clear All
              </button>
            )}
            <div style={{ flex: 1 }} />
            <span style={{ ...mono, fontSize: 11, color: 'var(--ec-em)', fontWeight: 600 }}>
              {matrixStats.complete}/{matrixStats.total} complete ({matrixStats.total ? Math.round(matrixStats.complete / matrixStats.total * 100) : 0}%)
            </span>
          </div>

          {/* Matrix Table */}
          <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--ec-div)', background: 'var(--ec-card)', marginBottom: 24 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{
                    ...sans, fontSize: 10, fontWeight: 600, color: 'var(--ec-t2)',
                    textAlign: 'left', padding: '10px 12px',
                    background: 'var(--ec-card)', position: 'sticky', left: 0, zIndex: 15,
                    borderBottom: '2px solid var(--ec-div)', borderRight: '2px solid var(--ec-div)',
                    minWidth: 220,
                  }}>
                    TRAINING ITEM
                  </th>
                  {matrixStaff.map(staff => (
                    <th key={staff.name} style={{
                      ...sans, fontSize: 9, fontWeight: 600, color: 'var(--ec-t2)',
                      textAlign: 'center', padding: '8px 6px',
                      background: 'var(--ec-card)', position: 'sticky', top: 0, zIndex: 10,
                      borderBottom: '2px solid var(--ec-div)',
                      minWidth: 80, maxWidth: 100, whiteSpace: 'nowrap',
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', margin: '0 auto 3px',
                        background: 'var(--ec-em-bg)', color: 'var(--ec-em)', fontSize: 10, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {getInitials(staff.name)}
                      </div>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{staff.name?.split(' ')[0]}</div>
                      <div style={{ fontSize: 8, color: 'var(--ec-t3)', textTransform: 'capitalize' }}>{staff.role}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixData.map(cat => (
                  <>
                    {/* Category header row */}
                    <tr key={`cat-${cat.key}`}>
                      <td
                        colSpan={matrixStaff.length + 1}
                        style={{
                          ...sans, fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                          letterSpacing: '0.06em', padding: '8px 12px',
                          background: `${cat.accent}08`, color: cat.accent,
                          borderBottom: `1px solid ${cat.accent}20`,
                          position: 'sticky', left: 0, zIndex: 5,
                        }}
                      >
                        <span style={{ marginRight: 6 }}>{cat.icon}</span>
                        {cat.label}
                        <span style={{ ...mono, fontSize: 9, color: 'var(--ec-t3)', marginLeft: 8, fontWeight: 400 }}>
                          {cat.items.length} items
                        </span>
                      </td>
                    </tr>
                    {/* Item rows */}
                    {cat.items.map(({ item, cells }) => (
                      <tr key={item.id}>
                        <td style={{
                          ...sans, fontSize: 11, fontWeight: 500, color: 'var(--ec-t1)',
                          padding: '6px 12px', background: 'var(--ec-card)',
                          position: 'sticky', left: 0, zIndex: 5,
                          borderBottom: '1px solid var(--ec-card-hover)', borderRight: '2px solid var(--ec-div)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          maxWidth: 220,
                        }}
                          title={item.name}
                        >
                          {item.name}
                          {item.renewalMonths && (
                            <span style={{ ...mono, fontSize: 8, color: 'var(--ec-t3)', marginLeft: 6 }}>
                              {item.renewalMonths === 12 ? 'Annual' : item.renewalMonths === 24 ? '2-yr' : item.renewalMonths === 36 ? '3-yr' : `${item.renewalMonths}m`}
                            </span>
                          )}
                          {!item.renewalMonths && (
                            <span style={{ ...mono, fontSize: 8, color: 'var(--ec-t3)', marginLeft: 6 }}>One-off</span>
                          )}
                        </td>
                        {cells.map((cell, ci) => (
                          <MatrixCell
                            key={ci}
                            status={cell.status}
                            record={cell.record}
                            onClick={() => handleCellClick(cell.staff, item, cell.record)}
                          />
                        ))}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {matrixData.length === 0 && (
            <EmptyState
              title="No items match filters"
              description="Try adjusting your search or filters"
              actionLabel="Clear Filters"
              onAction={clearFilters}
            />
          )}
        </>
      )}

      {/* ═══ TAB: MY RECORDS ═══ */}
      {activeTab === 'my-records' && (
        <>
          <SectionHeader accent="var(--ec-em)" icon="👤" title={`Training Records — ${user?.name || 'You'}`} right={
            <span style={{ ...mono, fontSize: 11, color: 'var(--ec-em)', fontWeight: 600 }}>
              {myStats.complete}/{myStats.total} complete
            </span>
          } />

          {myRecords.length === 0 ? (
            <EmptyState
              title="No training records"
              description="Your manager will assign training items to your profile."
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Training Item', 'Category', 'Status', 'Completed', 'Expiry', 'Outcome', 'Actions'].map(h => (
                      <th key={h} style={{
                        ...sans, fontSize: 9, fontWeight: 600, color: 'var(--ec-t3)',
                        textAlign: 'left', padding: '6px 8px', textTransform: 'uppercase',
                        letterSpacing: 0.5, borderBottom: '1px solid var(--ec-div)',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {myRecords.map(({ item, record, status }) => {
                    const catInfo = CATEGORIES.find(c => c.key === item.category)
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--ec-card-hover)' }}>
                        <td style={{ ...sans, fontSize: 12, fontWeight: 500, padding: '10px 8px', color: 'var(--ec-t1)' }}>
                          {item.name}
                          {item.renewalMonths && (
                            <span style={{ ...mono, fontSize: 8, color: 'var(--ec-t3)', marginLeft: 6 }}>
                              {item.renewalMonths === 12 ? 'Annual' : `${item.renewalMonths}m`}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          <span style={{
                            ...sans, fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                            background: `${catInfo?.accent}10`, color: catInfo?.accent,
                          }}>
                            {catInfo?.label}
                          </span>
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          <StatusPill status={status} />
                        </td>
                        <td style={{ ...mono, fontSize: 11, padding: '10px 8px', color: 'var(--ec-t2)' }}>
                          {record?.dateCompleted ? formatDate(record.dateCompleted) : '—'}
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          {record?.certificateExpiry ? (
                            <div>
                              <div style={{ ...mono, fontSize: 11, color: 'var(--ec-t2)' }}>{formatDate(record.certificateExpiry)}</div>
                              {(() => {
                                const days = daysUntil(record.certificateExpiry)
                                if (days === null) return null
                                const color = days < 0 ? 'var(--ec-crit)' : days <= 30 ? 'var(--ec-warn)' : days <= 60 ? 'var(--ec-warn)' : 'var(--ec-em)'
                                const label = days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`
                                return <div style={{ ...sans, fontSize: 9, color, fontWeight: 600 }}>{label}</div>
                              })()}
                            </div>
                          ) : <span style={{ color: 'var(--ec-t4)', fontSize: 11 }}>—</span>}
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          {record?.outcome ? (
                            <span style={{
                              ...sans, fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
                              background: record.outcome === 'Pass' ? 'var(--ec-em-bg)' : 'var(--ec-info-bg)',
                              color: record.outcome === 'Pass' ? 'var(--ec-em)' : 'var(--ec-info)',
                              border: `1px solid ${record.outcome === 'Pass' ? 'var(--ec-em-border)' : 'var(--ec-info-border)'}`,
                            }}>
                              {record.outcome}
                            </span>
                          ) : <span style={{ color: 'var(--ec-t4)', fontSize: 11 }}>—</span>}
                        </td>
                        <td style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>
                          {record ? (
                            <button
                              onClick={() => openEdit(record)}
                              style={{ ...sans, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6, border: '1px solid var(--ec-div)', background: '#fff', color: 'var(--ec-t2)', cursor: 'pointer' }}
                            >
                              {elevated ? 'Edit' : 'View'}
                            </button>
                          ) : elevated ? (
                            <button
                              onClick={() => openAdd(user?.name, item.name)}
                              style={{ ...sans, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6, border: 'none', background: 'var(--ec-em)', color: '#fff', cursor: 'pointer' }}
                            >
                              Record
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ═══ TAB: EXPIRING SOON ═══ */}
      {activeTab === 'expiring' && (
        <>
          <SectionHeader accent="var(--ec-crit)" icon="⏰" title="Expiring &amp; Overdue Training" right={
            <span style={{ ...mono, fontSize: 11, color: 'var(--ec-crit)', fontWeight: 600 }}>
              {expiringRecords.length} items need attention
            </span>
          } />

          {expiringRecords.length === 0 ? (
            <EmptyState
              title="All clear!"
              description="No training records are expiring or overdue."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {expiringRecords.map((entry, idx) => {
                const { staff, item, record, status, daysLeft } = entry
                const isExpired = status === 'expired'
                return (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--ec-card)', borderRadius: 12, padding: '14px 16px',
                      border: `1px solid ${isExpired ? 'var(--ec-crit-border)' : 'var(--ec-warn-border)'}`,
                      borderLeft: `4px solid ${isExpired ? 'var(--ec-crit)' : 'var(--ec-warn)'}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 16 }}>{isExpired ? '🔴' : '🟡'}</span>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ ...sans, fontSize: 13, fontWeight: 600, color: 'var(--ec-t1)' }}>
                          {item.name}
                          <span style={{ ...sans, fontSize: 11, fontWeight: 400, color: 'var(--ec-t2)', marginLeft: 8 }}>
                            — {staff.name}
                          </span>
                        </div>
                        <div style={{ ...sans, fontSize: 11, color: isExpired ? 'var(--ec-crit)' : 'var(--ec-warn)', marginTop: 2 }}>
                          {isExpired ? `Expired ${Math.abs(daysLeft)} days ago` : `Expires in ${daysLeft} days`}
                          {record?.dateCompleted && (
                            <span style={{ color: 'var(--ec-t3)', marginLeft: 8 }}>
                              Last completed: {formatDate(record.dateCompleted)}
                            </span>
                          )}
                        </div>
                      </div>
                      <StatusPill status={status} />
                      {elevated && (
                        <button
                          onClick={() => record ? openEdit(record) : openAdd(staff.name, item.name)}
                          style={{ ...sans, fontSize: 10, fontWeight: 600, padding: '5px 12px', borderRadius: 7, border: '1px solid var(--ec-div)', background: '#fff', color: 'var(--ec-em)', cursor: 'pointer' }}
                        >
                          Update Record
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ═══ TAB: TRAINING LIBRARY ═══ */}
      {activeTab === 'library' && elevated && (
        <>
          <SectionHeader accent="var(--ec-cat-purple)" icon="📖" title="Training Library" right={
            <span style={{ ...mono, fontSize: 11, color: 'var(--ec-cat-purple)', fontWeight: 600 }}>
              {TRAINING_ITEMS.length} items
            </span>
          } />

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Name', 'Category', 'Required Roles', 'Renewal', 'Evidence', 'Mandatory'].map(h => (
                    <th key={h} style={{
                      ...sans, fontSize: 9, fontWeight: 600, color: 'var(--ec-t3)',
                      textAlign: 'left', padding: '6px 8px', textTransform: 'uppercase',
                      letterSpacing: 0.5, borderBottom: '1px solid var(--ec-div)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TRAINING_ITEMS.map(item => {
                  const catInfo = CATEGORIES.find(c => c.key === item.category)
                  const renewalLabel = !item.renewalMonths ? 'One-off' :
                    item.renewalMonths === 12 ? 'Annual' :
                    item.renewalMonths === 24 ? 'Biennial' :
                    item.renewalMonths === 36 ? '3-yearly' : `${item.renewalMonths}m`
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--ec-card-hover)' }}>
                      <td style={{ ...sans, fontSize: 12, fontWeight: 500, padding: '10px 8px', color: 'var(--ec-t1)' }}>
                        {item.name}
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <span style={{
                          ...sans, fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                          background: `${catInfo?.accent}10`, color: catInfo?.accent,
                        }}>
                          {catInfo?.label}
                        </span>
                      </td>
                      <td style={{ ...sans, fontSize: 10, padding: '10px 8px', color: 'var(--ec-t2)' }}>
                        {item.requiredRoles.includes('all') ? 'All Staff' : item.requiredRoles.map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(', ')}
                      </td>
                      <td style={{ ...mono, fontSize: 11, padding: '10px 8px', color: 'var(--ec-t2)' }}>
                        {renewalLabel}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        {item.evidenceRequired ? (
                          <span style={{ color: 'var(--ec-em)', fontSize: 12 }}>✓</span>
                        ) : (
                          <span style={{ color: 'var(--ec-t4)', fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        {item.isMandatory ? (
                          <span style={{ ...sans, fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: 'var(--ec-crit-bg)', color: 'var(--ec-crit)' }}>Required</span>
                        ) : (
                          <span style={{ ...sans, fontSize: 9, color: 'var(--ec-t3)' }}>Optional</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ═══ MODAL: Add / Edit Record ═══ */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Training Record' : 'Add Training Record'}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Staff */}
          <FormField label="Staff Member *" error={formErrors.staffName}>
            <select
              value={form.staffName}
              onChange={e => setForm(f => ({ ...f, staffName: e.target.value }))}
              style={inputStyle(formErrors.staffName)}
              disabled={!elevated}
            >
              <option value="">Select staff...</option>
              {activeStaff.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          </FormField>

          {/* Date */}
          <FormField label="Completion Date *" error={formErrors.dateCompleted}>
            <input
              type="date"
              value={form.dateCompleted}
              onChange={e => setForm(f => ({ ...f, dateCompleted: e.target.value }))}
              style={inputStyle(formErrors.dateCompleted)}
            />
          </FormField>

          {/* Topic */}
          <FormField label="Training Item *" error={formErrors.topic} span>
            <select
              value={form.topic}
              onChange={e => {
                const item = TRAINING_ITEMS.find(i => i.name === e.target.value)
                const renewalMonths = item?.renewalMonths
                let expiry = ''
                if (renewalMonths && form.dateCompleted) {
                  const d = new Date(form.dateCompleted + 'T00:00:00')
                  d.setMonth(d.getMonth() + renewalMonths)
                  expiry = d.toISOString().slice(0, 10)
                }
                setForm(f => ({ ...f, topic: e.target.value, certificateExpiry: expiry || f.certificateExpiry }))
              }}
              style={inputStyle(formErrors.topic)}
            >
              <option value="">Select training item...</option>
              {TRAINING_ITEMS.map(i => <option key={i.id} value={i.name}>{i.name}</option>)}
            </select>
          </FormField>

          {/* Trainer */}
          <FormField label="Trainer">
            <input
              type="text" placeholder="Trainer name"
              value={form.trainerName}
              onChange={e => setForm(f => ({ ...f, trainerName: e.target.value }))}
              style={inputStyle()}
            />
          </FormField>

          {/* Method */}
          <FormField label="Delivery Method">
            <select value={form.deliveryMethod} onChange={e => setForm(f => ({ ...f, deliveryMethod: e.target.value }))} style={inputStyle()}>
              {DELIVERY_METHODS.map(m => <option key={m}>{m}</option>)}
            </select>
          </FormField>

          {/* Duration */}
          <FormField label="Duration">
            <input
              type="text" placeholder="e.g. 2 hours"
              value={form.duration}
              onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
              style={inputStyle()}
            />
          </FormField>

          {/* Outcome */}
          <FormField label="Outcome">
            <select value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))} style={inputStyle()}>
              <option value="">Not completed yet</option>
              {OUTCOMES.map(o => <option key={o}>{o}</option>)}
            </select>
          </FormField>

          {/* Cert Expiry */}
          <FormField label="Certificate Expiry">
            <input
              type="date"
              value={form.certificateExpiry}
              onChange={e => setForm(f => ({ ...f, certificateExpiry: e.target.value }))}
              style={inputStyle()}
            />
          </FormField>

          {/* Renewal */}
          <FormField label="Renewal Date">
            <input
              type="date"
              value={form.renewalDate}
              onChange={e => setForm(f => ({ ...f, renewalDate: e.target.value }))}
              style={inputStyle()}
            />
          </FormField>

          {/* Notes */}
          <FormField label="Notes" span>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2} placeholder="Optional notes..."
              style={{ ...inputStyle(), resize: 'vertical' }}
            />
          </FormField>
        </div>

        {/* Save / Cancel / Delete */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 16 }}>
          <div>
            {editingId && elevated && (
              <button
                onClick={() => {
                  const record = logs.find(r => r.id === editingId)
                  if (record) { handleDelete(record); setModalOpen(false) }
                }}
                style={{ ...sans, fontSize: 11, fontWeight: 600, padding: '7px 14px', borderRadius: 8, border: '1px solid var(--ec-crit-border)', background: 'var(--ec-crit-bg)', color: 'var(--ec-crit)', cursor: 'pointer' }}
              >
                Delete
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setModalOpen(false)}
              style={{ ...sans, fontSize: 12, fontWeight: 500, padding: '7px 16px', borderRadius: 8, border: '1px solid var(--ec-div)', background: '#fff', color: 'var(--ec-t2)', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{ ...sans, fontSize: 12, fontWeight: 600, padding: '7px 16px', borderRadius: 8, border: 'none', background: 'var(--ec-em)', color: 'white', cursor: 'pointer' }}
            >
              {editingId ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>

      {ConfirmDialog}
      {toast.ToastContainer}

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          button { display: none !important; }
          input, select { display: none !important; }
        }
        @media (max-width: 768px) {
          table { font-size: 10px !important; }
        }
      `}</style>
    </div>
  )
}

// ── Form helpers ──
function FormField({ label, error, span, children }) {
  return (
    <div style={span ? { gridColumn: '1 / -1' } : {}}>
      <label style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600, color: error ? 'var(--ec-crit)' : 'var(--ec-t2)', display: 'block', marginBottom: 4 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function inputStyle(error) {
  return {
    fontFamily: "'Inter', sans-serif", fontSize: 12, width: '100%',
    padding: '7px 8px', borderRadius: 6, outline: 'none', cursor: 'pointer',
    border: `1px solid ${error ? 'var(--ec-crit)' : 'var(--ec-div)'}`,
    background: '#fff', color: 'var(--ec-t1)',
  }
}
