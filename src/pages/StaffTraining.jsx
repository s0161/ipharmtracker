import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import { useUser } from '../contexts/UserContext'
import { generateId, formatDate } from '../utils/helpers'
import { downloadCsv } from '../utils/exportCsv'
import { logAudit } from '../utils/auditLog'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/ConfirmDialog'
import { getStaffInitials } from '../utils/rotationManager'
import SkeletonLoader from '../components/SkeletonLoader'

// ─── Constants ───────────────────────────────────────────────────

const CATEGORIES = {
  gphc_regulatory:         { label: 'GPhC & Regulatory',        color: 'var(--ec-cat-purple)', bg: 'var(--ec-cat-purple-bg)', icon: '⚖️' },
  dispensing_clinical:     { label: 'Dispensing & Clinical',     color: 'var(--ec-info)', bg: 'var(--ec-info-bg)',  icon: '💊' },
  health_safety:           { label: 'Health & Safety',           color: 'var(--ec-warn)', bg: 'var(--ec-warn-bg)',  icon: '🛡️' },
  safeguarding_governance: { label: 'Safeguarding & Governance', color: 'var(--ec-em)', bg: 'var(--ec-em-bg)',   icon: '👥' },
  operational:             { label: 'Operational',               color: 'var(--ec-cat-teal)', bg: 'var(--ec-cat-teal-bg)',   icon: '⚙️' },
}

const STATUS_COLORS = {
  pending:     { label: 'Pending',     color: 'var(--ec-warn)', bg: 'var(--ec-warn-bg)', ring: 'var(--ec-warn-border)' },
  in_progress: { label: 'In Progress', color: 'var(--ec-info)', bg: 'var(--ec-info-bg)',  ring: 'var(--ec-info-border)' },
  complete:    { label: 'Complete',    color: 'var(--ec-em)', bg: 'var(--ec-em-bg)',   ring: 'var(--ec-em-border)' },
  overdue:     { label: 'Overdue',     color: 'var(--ec-crit)', bg: 'var(--ec-crit-bg)',   ring: 'var(--ec-crit-border)' },
}

const STATUS_CYCLE = ['pending', 'in_progress', 'complete']

// 30 training modules — hardcoded catalog (no DB table needed)
const TRAINING_MODULES = [
  { id: 1,  name: 'GPhC Standards of Conduct',        category: 'gphc_regulatory',     mandatory: true,  renewalMonths: 12, applicableRoles: ['superintendent','manager','pharmacist','technician','dispenser'] },
  { id: 2,  name: 'Responsible Pharmacist Obligations', category: 'gphc_regulatory',     mandatory: true,  renewalMonths: 12, applicableRoles: ['superintendent','pharmacist'] },
  { id: 3,  name: 'CPD & Revalidation Requirements',   category: 'gphc_regulatory',     mandatory: true,  renewalMonths: 12, applicableRoles: ['superintendent','pharmacist','technician'] },
  { id: 4,  name: 'Controlled Drugs — Legal Framework', category: 'gphc_regulatory',     mandatory: true,  renewalMonths: 12, applicableRoles: ['superintendent','pharmacist','technician','dispenser'] },
  { id: 5,  name: 'Prescription Validity & Exemptions', category: 'gphc_regulatory',     mandatory: true,  renewalMonths: 12, applicableRoles: ['superintendent','pharmacist','technician','dispenser'] },
  { id: 6,  name: 'Clinical Governance & Audit',        category: 'gphc_regulatory',     mandatory: false, renewalMonths: 24, applicableRoles: ['superintendent','manager','pharmacist'] },
  { id: 7,  name: 'Dispensing Accuracy & Checking',     category: 'dispensing_clinical', mandatory: true,  renewalMonths: 12, applicableRoles: ['superintendent','pharmacist','technician','dispenser'] },
  { id: 8,  name: 'Near Miss & Error Reporting',        category: 'dispensing_clinical', mandatory: true,  renewalMonths: 12, applicableRoles: ['superintendent','manager','pharmacist','technician','dispenser'] },
  { id: 9,  name: 'MDS / Blister Pack Preparation',     category: 'dispensing_clinical', mandatory: false, renewalMonths: 12, applicableRoles: ['technician','dispenser'] },
  { id: 10, name: 'Methadone & Supervised Consumption', category: 'dispensing_clinical', mandatory: true,  renewalMonths: 12, applicableRoles: ['superintendent','pharmacist','technician','dispenser'] },
  { id: 11, name: 'Fridge & Cold Chain Management',     category: 'dispensing_clinical', mandatory: true,  renewalMonths: 12, applicableRoles: ['superintendent','pharmacist','technician','dispenser','stock_assistant'] },
  { id: 12, name: 'Medicines Optimisation',             category: 'dispensing_clinical', mandatory: false, renewalMonths: 24, applicableRoles: ['superintendent','pharmacist','technician'] },
  { id: 13, name: 'Fire Safety Awareness',              category: 'health_safety',       mandatory: true,  renewalMonths: 12, applicableRoles: ['superintendent','manager','pharmacist','technician','dispenser','stock_assistant','driver','aca','staff'] },
  { id: 14, name: 'Health & Safety Induction',          category: 'health_safety',       mandatory: true,  renewalMonths: null, applicableRoles: ['superintendent','manager','pharmacist','technician','dispenser','stock_assistant','driver','aca','staff'] },
  { id: 15, name: 'Manual Handling',                    category: 'health_safety',       mandatory: true,  renewalMonths: 24, applicableRoles: ['dispenser','stock_assistant','driver'] },
  { id: 16, name: 'COSHH Awareness',                    category: 'health_safety',       mandatory: false, renewalMonths: 24, applicableRoles: ['superintendent','manager','pharmacist','technician','dispenser','stock_assistant'] },
  { id: 17, name: 'First Aid Awareness',                category: 'health_safety',       mandatory: false, renewalMonths: 36, applicableRoles: ['superintendent','manager','pharmacist','technician','dispenser'] },
  { id: 18, name: 'Lone Working',                       category: 'health_safety',       mandatory: true,  renewalMonths: 12, applicableRoles: ['superintendent','pharmacist','technician','dispenser'] },
  { id: 19, name: 'Safeguarding Adults — Level 1',      category: 'safeguarding_governance', mandatory: true,  renewalMonths: 24, applicableRoles: ['superintendent','manager','pharmacist','technician','dispenser','stock_assistant','driver','aca','staff'] },
  { id: 20, name: 'Safeguarding Children — Level 1',    category: 'safeguarding_governance', mandatory: true,  renewalMonths: 24, applicableRoles: ['superintendent','manager','pharmacist','technician','dispenser','stock_assistant','driver','aca','staff'] },
  { id: 21, name: 'Safeguarding — Level 3 (Pharmacist)',category: 'safeguarding_governance', mandatory: true,  renewalMonths: 12, applicableRoles: ['superintendent','pharmacist'] },
  { id: 22, name: 'Information Governance & GDPR',      category: 'safeguarding_governance', mandatory: true,  renewalMonths: 12, applicableRoles: ['superintendent','manager','pharmacist','technician','dispenser','stock_assistant','driver','aca','staff'] },
  { id: 23, name: 'Equality, Diversity & Inclusion',    category: 'safeguarding_governance', mandatory: true,  renewalMonths: 24, applicableRoles: ['superintendent','manager','pharmacist','technician','dispenser','stock_assistant','driver','aca','staff'] },
  { id: 24, name: 'Complaints Handling Procedure',      category: 'safeguarding_governance', mandatory: false, renewalMonths: 12, applicableRoles: ['superintendent','manager','pharmacist','technician','dispenser'] },
  { id: 25, name: 'Delivery & Transport Procedures',    category: 'operational',         mandatory: true,  renewalMonths: 12, applicableRoles: ['driver'] },
  { id: 26, name: 'Stock Management & Ordering',        category: 'operational',         mandatory: false, renewalMonths: 12, applicableRoles: ['manager','dispenser','stock_assistant'] },
  { id: 27, name: 'Customer Service & Communication',   category: 'operational',         mandatory: false, renewalMonths: 24, applicableRoles: ['superintendent','manager','pharmacist','technician','dispenser','stock_assistant','aca','staff'] },
  { id: 28, name: 'Confidential Waste Procedures',      category: 'operational',         mandatory: true,  renewalMonths: 12, applicableRoles: ['superintendent','manager','pharmacist','technician','dispenser'] },
  { id: 29, name: 'IT Systems & PMR Training',          category: 'operational',         mandatory: false, renewalMonths: null, applicableRoles: ['superintendent','manager','pharmacist','technician','dispenser'] },
  { id: 30, name: 'Emergency Procedures & Business Continuity', category: 'operational', mandatory: true,  renewalMonths: 24, applicableRoles: ['superintendent','manager','pharmacist','technician','dispenser','stock_assistant','driver','aca','staff'] },
]

const MODULE_BY_NAME = Object.fromEntries(TRAINING_MODULES.map(m => [m.name, m]))

const inputClass = "bg-ec-card border border-ec-border rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors font-sans"
const btnSecondary = "px-3 py-1.5 bg-ec-card-hover text-ec-t2 rounded-lg text-xs border border-ec-border cursor-pointer hover:bg-ec-t5 hover:text-ec-t1 transition-colors font-sans"

// ─── Helpers ─────────────────────────────────────────────────────

function addMonths(dateStr, months) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function daysUntil(dateStr) {
  if (!dateStr) return Infinity
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  return Math.floor((target - now) / (1000 * 60 * 60 * 24))
}

function dbToRecord(row) {
  const mod = MODULE_BY_NAME[row.trainingItem] || null
  const parts = (row.role || '').split('|')
  const category = parts[0] || mod?.category || 'operational'
  const expiryDate = parts[1] || null
  return {
    id: row.id,
    staffId: row.staffName,
    moduleName: row.trainingItem,
    moduleId: mod?.id || 0,
    category,
    status: row.status,
    completedDate: row.targetDate || null,
    expiryDate,
  }
}

function recordToDb(rec) {
  return {
    id: rec.id,
    staffName: rec.staffId,
    trainingItem: rec.moduleName,
    targetDate: rec.completedDate || '',
    status: rec.status,
    role: `${rec.category}|${rec.expiryDate || ''}`,
  }
}

// ─── Main Component ──────────────────────────────────────────────

export default function StaffTraining() {
  const { user } = useUser()
  const [rawRecords, setRawRecords, recordsLoading] = useSupabase('staff_training', [])
  const [staffMembers] = useSupabase('staff_members', [])
  const showToast = useToast()
  const { confirm, ConfirmDialog } = useConfirm()

  const [tab, setTab] = useState('Library')
  const [selectedStaff, setSelectedStaff] = useState('')
  const [expandedModule, setExpandedModule] = useState(null)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterMandatory, setFilterMandatory] = useState('')
  const [search, setSearch] = useState('')

  const generatedRef = useRef(false)
  const modules = TRAINING_MODULES

  const staffNames = useMemo(() => {
    if (!staffMembers.length) return []
    return staffMembers
      .filter(s => typeof s === 'object' && s.name)
      .map(s => s.name)
      .sort()
  }, [staffMembers])

  const records = useMemo(() => rawRecords.map(dbToRecord), [rawRecords])

  const effectiveRecords = useMemo(() => {
    const today = todayStr()
    return records.map(r => {
      if (r.status === 'complete' && r.expiryDate && r.expiryDate < today) {
        return { ...r, status: 'overdue' }
      }
      return r
    })
  }, [records])

  const staffProgress = useMemo(() => {
    const map = {}
    effectiveRecords.forEach(r => {
      if (!map[r.staffId]) map[r.staffId] = { total: 0, complete: 0, overdue: 0 }
      map[r.staffId].total++
      if (r.status === 'complete') map[r.staffId].complete++
      if (r.status === 'overdue') map[r.staffId].overdue++
    })
    return staffNames.map(name => {
      const data = map[name] || { total: 0, complete: 0, overdue: 0 }
      const pct = data.total > 0 ? Math.round((data.complete / data.total) * 100) : 0
      return { name, ...data, pct }
    })
  }, [effectiveRecords, staffNames])

  const stats = useMemo(() => {
    const s = { pending: 0, in_progress: 0, complete: 0, overdue: 0 }
    effectiveRecords.forEach(r => { s[r.status] = (s[r.status] || 0) + 1 })
    return s
  }, [effectiveRecords])

  useEffect(() => {
    if (recordsLoading || generatedRef.current || !staffNames.length) return

    const existingKeys = new Set(rawRecords.map(r => `${r.staffName}|${r.trainingItem}`))
    const toAdd = []

    for (const staff of staffNames) {
      const staffObj = staffMembers.find(s => typeof s === 'object' && s.name === staff)
      const role = staffObj?.role || 'staff'

      for (const mod of modules) {
        const key = `${staff}|${mod.name}`
        if (existingKeys.has(key)) continue

        const roles = mod.applicableRoles || []
        if (roles.length > 0 && !roles.includes(role)) continue

        toAdd.push({
          id: generateId(),
          staffName: staff,
          trainingItem: mod.name,
          targetDate: '',
          status: 'pending',
          role: `${mod.category}|`,
        })
      }
    }

    generatedRef.current = true
    if (toAdd.length > 0) {
      setRawRecords([...rawRecords, ...toAdd])
    }
  }, [recordsLoading, staffNames, staffMembers]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Actions ─────────────────────────────────────────────────

  const updateRecord = useCallback((recordId, updates) => {
    setRawRecords(rawRecords.map(r => {
      if (r.id !== recordId) return r
      const rec = dbToRecord(r)
      const merged = { ...rec, ...updates }
      return recordToDb(merged)
    }))
  }, [rawRecords, setRawRecords])

  const cycleStatus = useCallback((recordId) => {
    const raw = rawRecords.find(r => r.id === recordId)
    if (!raw) return

    const rec = dbToRecord(raw)
    const currentStatus = rec.status === 'overdue' ? 'complete' : rec.status
    const idx = STATUS_CYCLE.indexOf(currentStatus)
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]

    const mod = MODULE_BY_NAME[rec.moduleName]
    const renewalMonths = mod?.renewalMonths

    let updates = { status: next }
    if (next === 'complete') {
      const today = todayStr()
      updates.completedDate = today
      updates.expiryDate = renewalMonths ? addMonths(today, renewalMonths) : null
    } else if (next === 'pending') {
      updates.completedDate = null
      updates.expiryDate = null
    }

    updateRecord(recordId, updates)
    logAudit('Updated', `Training: ${rec.moduleName} for ${rec.staffId} → ${next}`, 'Staff Training', user?.name)
  }, [rawRecords, updateRecord, user])

  const handleCsvDownload = useCallback(() => {
    const headers = ['Staff', 'Module', 'Category', 'Mandatory', 'Status', 'Completed', 'Expiry']
    const rows = effectiveRecords.map(r => {
      const mod = MODULE_BY_NAME[r.moduleName]
      const cat = CATEGORIES[r.category]?.label || r.category
      return [
        r.staffId,
        r.moduleName,
        cat,
        mod?.mandatory ? 'Yes' : 'No',
        STATUS_COLORS[r.status]?.label || r.status,
        r.completedDate || '',
        r.expiryDate || 'No expiry',
      ]
    })
    downloadCsv('staff-training', headers, rows)
    showToast('CSV downloaded')
  }, [effectiveRecords, showToast])

  // ─── Loading guard (AFTER all hooks) ──────────────────────────

  if (recordsLoading) {
    return <SkeletonLoader variant="table" />
  }

  // ─── Render ───────────────────────────────────────────────────

  return (
    <div className="max-w-[1400px]">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-5">
        <div>
          <h2 className="text-lg font-bold text-ec-t1 mb-0.5">Staff Training</h2>
          <p className="text-sm text-ec-t3">
            {modules.length} modules across {staffNames.length} staff members
          </p>
        </div>
        <button className={btnSecondary} onClick={handleCsvDownload}>
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </span>
        </button>
      </div>

      {/* ① Compliance Cards */}
      <ComplianceCards
        staffProgress={staffProgress}
        onSelect={(name) => {
          setSelectedStaff(name)
          setTab('By Staff')
        }}
      />

      {/* Status summary strip */}
      <div className="flex items-center gap-4 mb-4 px-3 py-2 rounded-lg bg-ec-card border border-ec-border">
        {Object.entries(STATUS_COLORS).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.color }} />
            <span className="text-xs text-ec-t2 font-medium">{stats[key] || 0}</span>
            <span className="text-xs text-ec-t3">{cfg.label}</span>
          </div>
        ))}
        <span className="text-ec-t3 text-xs">|</span>
        <span className="text-xs text-ec-t2 font-semibold">{effectiveRecords.length} total records</span>
      </div>

      {/* Tab Bar */}
      <TabBar tab={tab} setTab={setTab} />

      {/* Active View */}
      {tab === 'Library' && (
        <LibraryView
          modules={modules}
          effectiveRecords={effectiveRecords}
          staffNames={staffNames}
          expandedModule={expandedModule}
          setExpandedModule={setExpandedModule}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          filterMandatory={filterMandatory}
          setFilterMandatory={setFilterMandatory}
          search={search}
          setSearch={setSearch}
          cycleStatus={cycleStatus}
          stats={stats}
        />
      )}

      {tab === 'Matrix' && (
        <MatrixView
          modules={modules}
          effectiveRecords={effectiveRecords}
          staffNames={staffNames}
          cycleStatus={cycleStatus}
        />
      )}

      {tab === 'By Staff' && (
        <ByStaffView
          modules={modules}
          effectiveRecords={effectiveRecords}
          staffNames={staffNames}
          staffProgress={staffProgress}
          selectedStaff={selectedStaff}
          setSelectedStaff={setSelectedStaff}
          cycleStatus={cycleStatus}
        />
      )}

      {ConfirmDialog}
    </div>
  )
}

// ─── ① ComplianceCards ───────────────────────────────────────────

function ComplianceCards({ staffProgress, onSelect }) {
  if (staffProgress.length === 0) return null
  return (
    <div className="mb-5">
      <h3 className="text-xs font-semibold text-ec-t3 uppercase tracking-wider mb-2.5">Staff Compliance</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
        {staffProgress.map(sp => {
          const barColor = sp.pct >= 80 ? 'var(--ec-em)' : sp.pct >= 50 ? 'var(--ec-warn)' : 'var(--ec-crit)'
          return (
            <div
              key={sp.name}
              className="rounded-xl p-3 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
              style={{ backgroundColor: 'var(--ec-card)', border: '1px solid var(--ec-border)' }}
              onClick={() => onSelect(sp.name)}
            >
              <div className="flex items-center gap-2.5 mb-2.5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: barColor }}
                >
                  {getStaffInitials(sp.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ec-t1 font-semibold truncate leading-tight">{sp.name}</p>
                  <p className="text-[11px] text-ec-t3 mt-0.5">{sp.complete}/{sp.total} modules</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-ec-border overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${sp.pct}%`, backgroundColor: barColor }}
                  />
                </div>
                <span className="text-xs font-bold tabular-nums min-w-[32px] text-right" style={{ color: barColor }}>{sp.pct}%</span>
              </div>
              {sp.overdue > 0 && (
                <div className="flex items-center gap-1 mt-2 px-1.5 py-0.5 rounded bg-ec-crit-faint w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-ec-crit" />
                  <span className="text-[10px] font-semibold text-ec-crit">{sp.overdue} overdue</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── TabBar ──────────────────────────────────────────────────────

function TabBar({ tab, setTab }) {
  const tabs = ['Library', 'Matrix', 'By Staff']
  return (
    <div className="flex gap-1 mb-5 bg-ec-card rounded-lg p-1 border border-ec-border w-fit">
      {tabs.map(t => (
        <button
          key={t}
          className={`px-5 py-1.5 rounded-md text-sm font-medium transition-all border-none cursor-pointer font-sans ${
            tab === t
              ? 'bg-ec-em text-white shadow-sm'
              : 'bg-transparent text-ec-t2 hover:text-ec-t1 hover:bg-ec-card-hover'
          }`}
          onClick={() => setTab(t)}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

// ─── ② LibraryView ───────────────────────────────────────────────

function LibraryView({
  modules, effectiveRecords, staffNames, expandedModule, setExpandedModule,
  filterCategory, setFilterCategory, filterMandatory, setFilterMandatory,
  search, setSearch, cycleStatus, stats,
}) {
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return modules.filter(m => {
      if (filterCategory && m.category !== filterCategory) return false
      if (filterMandatory === 'yes' && !m.mandatory) return false
      if (filterMandatory === 'no' && m.mandatory) return false
      if (q && !m.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [modules, filterCategory, filterMandatory, search])

  const grouped = useMemo(() => {
    const g = {}
    for (const cat of Object.keys(CATEGORIES)) g[cat] = []
    filtered.forEach(m => {
      if (g[m.category]) g[m.category].push(m)
    })
    return g
  }, [filtered])

  return (
    <div>
      {/* ② Consolidated filter bar */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="relative w-56">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ec-t3" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className={inputClass + ' w-full pl-9'}
            placeholder="Search modules..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className={inputClass + ' w-auto'} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {Object.entries(CATEGORIES).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select className={inputClass + ' w-auto'} value={filterMandatory} onChange={e => setFilterMandatory(e.target.value)}>
          <option value="">All Types</option>
          <option value="yes">Mandatory</option>
          <option value="no">Optional</option>
        </select>
        {(filterCategory || filterMandatory || search) && (
          <button className={btnSecondary} onClick={() => { setFilterCategory(''); setFilterMandatory(''); setSearch('') }}>
            Clear
          </button>
        )}
      </div>

      {/* ⑦ Summary bar */}
      <div className="flex items-center gap-3 mb-5 text-xs text-ec-t3">
        <span className="font-semibold text-ec-t2">{filtered.length} modules</span>
        <span>·</span>
        <span className="text-ec-em font-medium">{stats.complete || 0} complete</span>
        <span>·</span>
        <span className="text-ec-crit font-medium">{stats.overdue || 0} overdue</span>
      </div>

      {/* ③ Grouped modules with accent border */}
      {Object.entries(grouped).map(([catKey, mods]) => {
        if (mods.length === 0) return null
        const cat = CATEGORIES[catKey]
        return (
          <div key={catKey} className="mb-6">
            <div className="flex items-center gap-2.5 mb-2 pl-3 border-l-[3px]" style={{ borderColor: cat.color }}>
              <span className="text-base">{cat.icon}</span>
              <h3 className="text-sm font-bold text-ec-t1">{cat.label}</h3>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: cat.color }}
              >
                {mods.length}
              </span>
            </div>
            <div className="space-y-1">
              {mods.map(mod => (
                <ModuleRow
                  key={mod.id}
                  mod={mod}
                  catColor={cat.color}
                  expanded={expandedModule === mod.id}
                  onToggle={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
                  effectiveRecords={effectiveRecords}
                  staffNames={staffNames}
                  cycleStatus={cycleStatus}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── ④⑤⑥ ModuleRow ──────────────────────────────────────────────

function ModuleRow({ mod, catColor, expanded, onToggle, effectiveRecords, staffNames, cycleStatus }) {
  const moduleRecords = effectiveRecords.filter(r => r.moduleName === mod.name)

  return (
    <div
      className="rounded-lg border border-ec-border overflow-hidden transition-colors"
      style={{ backgroundColor: 'var(--ec-card)' }}
    >
      {/* ④ Full row clickable, hover green, tighter padding, bigger chevron */}
      <button
        className="w-full flex items-center justify-between px-4 py-2 text-left bg-transparent border-none cursor-pointer font-sans hover:bg-[var(--ec-em-bg)] transition-colors group"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <svg
            className="flex-shrink-0 text-ec-t3 transition-transform group-hover:text-ec-t1"
            style={{ transform: expanded ? 'rotate(90deg)' : 'none' }}
            width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="text-sm font-medium text-ec-t1 truncate">{mod.name}</span>
          {/* ⑤ Mandatory badge — red for urgency */}
          {mod.mandatory && (
            <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-ec-crit-light text-ec-crit">
              REQUIRED
            </span>
          )}
          {mod.renewalMonths && (
            <span className="text-[10px] text-ec-t3 hidden sm:inline">{mod.renewalMonths}mo</span>
          )}
        </div>
        {/* ⑥ Coloured status dots per staff */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-3">
          {moduleRecords.map(rec => {
            const sc = STATUS_COLORS[rec.status] || STATUS_COLORS.pending
            return (
              <span
                key={rec.id}
                className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform hover:scale-150"
                style={{ backgroundColor: sc.color }}
                title={`${rec.staffId}: ${sc.label}`}
              />
            )
          })}
        </div>
      </button>

      {expanded && (
        <ModuleExpander
          mod={mod}
          moduleRecords={moduleRecords}
          cycleStatus={cycleStatus}
        />
      )}
    </div>
  )
}

// ─── ⑧ ModuleExpander — card grid layout ─────────────────────────

function ModuleExpander({ mod, moduleRecords, cycleStatus }) {
  if (moduleRecords.length === 0) {
    return (
      <div className="border-t border-ec-div px-4 py-4 text-center">
        <span className="text-xs text-ec-t3">No staff assigned to this module</span>
      </div>
    )
  }

  return (
    <div className="border-t border-ec-div bg-[var(--ec-card-hover)] px-4 py-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        {moduleRecords.map(rec => {
          const sc = STATUS_COLORS[rec.status] || STATUS_COLORS.pending
          return (
            <div
              key={rec.id}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-ec-card border border-ec-border transition-colors hover:border-ec-em/30"
            >
              {/* Staff avatar */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                style={{ backgroundColor: sc.color }}
              >
                {getStaffInitials(rec.staffId)}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-ec-t1 truncate">{rec.staffId}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {rec.completedDate ? (
                    <span className="text-[10px] text-ec-t3">{formatDate(rec.completedDate)}</span>
                  ) : (
                    <span className="text-[10px] text-ec-t3">Not started</span>
                  )}
                  {rec.expiryDate && (
                    <ExpiryLabel expiryDate={rec.expiryDate} renewalMonths={mod.renewalMonths} />
                  )}
                </div>
              </div>
              {/* Status badge */}
              <StatusBadge status={rec.status} onClick={() => cycleStatus(rec.id)} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── ⑨ MatrixView — sticky headers, alternating rows ─────────────

function MatrixView({ modules, effectiveRecords, staffNames, cycleStatus }) {
  const grouped = useMemo(() => {
    const g = {}
    for (const cat of Object.keys(CATEGORIES)) g[cat] = []
    modules.forEach(m => {
      if (g[m.category]) g[m.category].push(m)
    })
    return g
  }, [modules])

  const lookup = useMemo(() => {
    const map = {}
    effectiveRecords.forEach(r => {
      map[`${r.moduleName}|${r.staffId}`] = r
    })
    return map
  }, [effectiveRecords])

  let rowIdx = 0

  return (
    <div className="overflow-x-auto rounded-xl border border-ec-border">
      <table className="text-xs" style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
        <thead>
          {/* ⑨ Sticky column headers */}
          <tr className="sticky top-0 z-20 bg-ec-card shadow-sm">
            <th className="sticky left-0 z-30 bg-ec-card text-left px-3 py-2.5 text-xs font-semibold text-ec-t3 border-b border-ec-border min-w-[200px]">
              Module
            </th>
            {staffNames.map(name => (
              <th key={name} className="px-2 py-2.5 text-center text-xs font-semibold text-ec-t3 border-b border-ec-border min-w-[56px]" title={name}>
                <span className="block">{getStaffInitials(name)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(grouped).map(([catKey, mods]) => {
            if (mods.length === 0) return null
            const cat = CATEGORIES[catKey]
            return [
              <tr key={`cat-${catKey}`}>
                <td
                  colSpan={staffNames.length + 1}
                  className="px-3 py-1.5 text-xs font-bold border-b border-ec-border"
                  style={{ color: cat.color, backgroundColor: cat.bg }}
                >
                  {cat.icon} {cat.label}
                </td>
              </tr>,
              ...mods.map(mod => {
                const isEven = rowIdx++ % 2 === 0
                return (
                  <tr key={mod.id} className={isEven ? 'bg-ec-card' : 'bg-[var(--ec-card-hover)]'}>
                    {/* ⑨ Alternating row bg, sticky name col */}
                    <td className={`sticky left-0 z-10 px-3 py-1.5 text-ec-t1 border-b border-ec-div font-medium ${isEven ? 'bg-ec-card' : 'bg-[var(--ec-card-hover)]'}`}>
                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-[180px]">{mod.name}</span>
                        {mod.mandatory && (
                          <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-ec-crit" title="Required" />
                        )}
                      </div>
                    </td>
                    {staffNames.map(staff => {
                      const rec = lookup[`${mod.name}|${staff}`]
                      if (!rec) return <td key={staff} className="px-2 py-1.5 text-center border-b border-ec-div"><span className="text-ec-t3">—</span></td>
                      const sc = STATUS_COLORS[rec.status] || STATUS_COLORS.pending
                      return (
                        <td key={staff} className="px-2 py-1.5 text-center border-b border-ec-div">
                          <button
                            className="w-6 h-6 rounded-full border-none cursor-pointer mx-auto block transition-transform hover:scale-125"
                            style={{ backgroundColor: sc.bg, border: `2px solid ${sc.color}` }}
                            title={`${staff}: ${sc.label} — Click to cycle`}
                            onClick={() => cycleStatus(rec.id)}
                          >
                            {rec.status === 'complete' && (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={sc.color} strokeWidth="3" className="mx-auto">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                            {rec.status === 'overdue' && (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={sc.color} strokeWidth="3" className="mx-auto">
                                <line x1="12" y1="8" x2="12" y2="13" /><circle cx="12" cy="16" r="1" fill={sc.color} />
                              </svg>
                            )}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                )
              }),
            ]
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── ⑩ ByStaffView — prominent compliance bar ───────────────────

function ByStaffView({
  modules, effectiveRecords, staffNames, staffProgress,
  selectedStaff, setSelectedStaff, cycleStatus,
}) {
  const staff = selectedStaff || staffNames[0] || ''
  const sp = staffProgress.find(s => s.name === staff)
  const staffRecords = effectiveRecords.filter(r => r.staffId === staff)

  const grouped = useMemo(() => {
    const g = {}
    for (const cat of Object.keys(CATEGORIES)) g[cat] = []
    staffRecords.forEach(r => {
      if (g[r.category]) g[r.category].push(r)
    })
    return g
  }, [staffRecords])

  const barColor = sp ? (sp.pct >= 80 ? 'var(--ec-em)' : sp.pct >= 50 ? 'var(--ec-warn)' : 'var(--ec-crit)') : 'var(--ec-t3)'

  return (
    <div>
      {/* Staff selector */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <select
          className={inputClass + ' w-auto font-semibold'}
          value={staff}
          onChange={e => setSelectedStaff(e.target.value)}
        >
          {staffNames.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {/* ⑩ Prominent compliance card */}
      {sp && (
        <div className="rounded-xl p-4 mb-5 border border-ec-border" style={{ backgroundColor: 'var(--ec-card)' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm"
                style={{ backgroundColor: barColor }}
              >
                {getStaffInitials(staff)}
              </div>
              <div>
                <h3 className="text-base font-bold text-ec-t1">{staff}</h3>
                <p className="text-xs text-ec-t3">{sp.complete} of {sp.total} modules complete</p>
              </div>
            </div>
            <span className="text-2xl font-bold tabular-nums" style={{ color: barColor }}>{sp.pct}%</span>
          </div>
          <div className="h-3 rounded-full bg-ec-border overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${sp.pct}%`, backgroundColor: barColor }} />
          </div>
          {sp.overdue > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-2 h-2 rounded-full bg-ec-crit" />
              <span className="text-xs font-semibold text-ec-crit">{sp.overdue} overdue module{sp.overdue > 1 ? 's' : ''} — action required</span>
            </div>
          )}
        </div>
      )}

      {/* Modules grouped by category with accent borders */}
      {Object.entries(grouped).map(([catKey, recs]) => {
        if (recs.length === 0) return null
        const cat = CATEGORIES[catKey]
        return (
          <div key={catKey} className="mb-5">
            <div className="flex items-center gap-2.5 mb-2 pl-3 border-l-[3px]" style={{ borderColor: cat.color }}>
              <span className="text-base">{cat.icon}</span>
              <h3 className="text-sm font-bold text-ec-t1">{cat.label}</h3>
            </div>
            <div className="space-y-1">
              {recs.map(rec => {
                const mod = MODULE_BY_NAME[rec.moduleName]
                return (
                  <div
                    key={rec.id}
                    className="flex items-center gap-3 px-4 py-2 rounded-lg border border-ec-border hover:bg-[var(--ec-em-bg)] transition-colors"
                    style={{ backgroundColor: 'var(--ec-card)' }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-ec-t1 font-medium truncate">{rec.moduleName}</span>
                        {mod?.mandatory && (
                          <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-ec-crit-light text-ec-crit">
                            REQUIRED
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px] text-ec-t3">
                          {rec.completedDate ? `Completed: ${formatDate(rec.completedDate)}` : 'Not started'}
                        </span>
                        <ExpiryLabel expiryDate={rec.expiryDate} renewalMonths={mod?.renewalMonths} />
                      </div>
                    </div>
                    <StatusBadge status={rec.status} onClick={() => cycleStatus(rec.id)} />
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {staffRecords.length === 0 && (
        <p className="text-sm text-ec-t3 text-center py-8">No training modules assigned to {staff}</p>
      )}
    </div>
  )
}

// ─── Shared Sub-Components ───────────────────────────────────────

function StatusBadge({ status, onClick }) {
  const sc = STATUS_COLORS[status] || STATUS_COLORS.pending
  return (
    <button
      className="px-2.5 py-1 rounded-full text-[11px] font-semibold border-none cursor-pointer transition-all font-sans hover:opacity-80 flex-shrink-0"
      style={{ backgroundColor: sc.bg, color: sc.color }}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      title="Click to cycle status"
    >
      {sc.label}
    </button>
  )
}

function ExpiryLabel({ expiryDate, renewalMonths }) {
  if (!renewalMonths && !expiryDate) {
    return <span className="text-[10px] text-ec-t3">No expiry</span>
  }
  if (!expiryDate) {
    return <span className="text-[10px] text-ec-t3">—</span>
  }

  const days = daysUntil(expiryDate)
  if (days < 0) {
    return <span className="text-[10px] font-semibold text-ec-crit">Expired {formatDate(expiryDate)}</span>
  }
  if (days <= 28) {
    return <span className="text-[10px] font-semibold text-ec-warn">Expires {formatDate(expiryDate)}</span>
  }
  return <span className="text-[10px] text-ec-t3">{formatDate(expiryDate)}</span>
}
