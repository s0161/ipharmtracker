import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
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
  gphc_regulatory:         { label: 'GPhC & Regulatory',        color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', icon: '⚖️' },
  dispensing_clinical:     { label: 'Dispensing & Clinical',     color: '#3b82f6', bg: 'rgba(59,130,246,0.08)',  icon: '💊' },
  health_safety:           { label: 'Health & Safety',           color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  icon: '🛡️' },
  safeguarding_governance: { label: 'Safeguarding & Governance', color: '#059669', bg: 'rgba(5,150,105,0.08)',   icon: '👥' },
  operational:             { label: 'Operational',               color: '#06b6d4', bg: 'rgba(6,182,212,0.08)',   icon: '⚙️' },
}

const STATUS_COLORS = {
  pending:     { label: 'Pending',     color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', ring: 'rgba(245,158,11,0.25)' },
  in_progress: { label: 'In Progress', color: '#3b82f6', bg: 'rgba(59,130,246,0.10)',  ring: 'rgba(59,130,246,0.25)' },
  complete:    { label: 'Complete',    color: '#059669', bg: 'rgba(5,150,105,0.10)',   ring: 'rgba(5,150,105,0.25)' },
  overdue:     { label: 'Overdue',     color: '#ef4444', bg: 'rgba(239,68,68,0.10)',   ring: 'rgba(239,68,68,0.25)' },
}

const STATUS_CYCLE = ['pending', 'in_progress', 'complete']

const inputClass = "w-full bg-ec-card border border-ec-border rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors font-sans"
const btnPrimary = "px-4 py-2 bg-ec-em text-white font-semibold rounded-lg text-sm border-none cursor-pointer hover:bg-ec-em-dark transition-colors font-sans"
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

// ─── Main Component ──────────────────────────────────────────────

export default function StaffTraining() {
  const { user } = useUser()
  const [modules, , modulesLoading] = useSupabase('training_modules', [])
  const [records, setRecords, recordsLoading] = useSupabase('staff_training_records', [])
  const [staffMembers] = useSupabase('staff_members', [])
  const showToast = useToast()
  const { confirm, ConfirmDialog } = useConfirm()

  const [tab, setTab] = useState('Library')
  const [selectedStaff, setSelectedStaff] = useState('')
  const [expandedModule, setExpandedModule] = useState(null)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterMandatory, setFilterMandatory] = useState('')
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(null)

  const generatedRef = useRef(false)
  const loading = modulesLoading || recordsLoading

  // Staff name list
  const staffNames = useMemo(() => {
    if (!staffMembers.length) return []
    return staffMembers
      .filter(s => typeof s === 'object' && s.name)
      .map(s => s.name)
      .sort()
  }, [staffMembers])

  // Derive effective records — override expired complete → overdue
  const effectiveRecords = useMemo(() => {
    const today = todayStr()
    return records.map(r => {
      if (r.status === 'complete' && r.expiryDate && r.expiryDate < today) {
        return { ...r, status: 'overdue' }
      }
      return r
    })
  }, [records])

  // Staff progress — compliance % per staff
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

  // Overall stats
  const stats = useMemo(() => {
    const s = { pending: 0, in_progress: 0, complete: 0, overdue: 0 }
    effectiveRecords.forEach(r => { s[r.status] = (s[r.status] || 0) + 1 })
    return s
  }, [effectiveRecords])

  // Auto-generate pending records for staff x module combos that don't exist
  useEffect(() => {
    if (loading || generatedRef.current || !modules.length || !staffNames.length) return

    const existingKeys = new Set(records.map(r => `${r.staffId}|${r.moduleId}`))
    const toAdd = []

    for (const staff of staffNames) {
      // Get staff role from staffMembers
      const staffObj = staffMembers.find(s => typeof s === 'object' && s.name === staff)
      const role = staffObj?.role || 'staff'

      for (const mod of modules) {
        const key = `${staff}|${mod.id}`
        if (existingKeys.has(key)) continue

        // Check if module applies to this role
        const roles = mod.applicableRoles || []
        if (roles.length > 0 && !roles.includes(role)) continue

        toAdd.push({
          id: generateId(),
          staffId: staff,
          moduleId: mod.id,
          moduleName: mod.name,
          category: mod.category,
          status: 'pending',
          completedDate: null,
          expiryDate: null,
          evidenceFileName: null,
          evidenceFilePath: null,
        })
      }
    }

    if (toAdd.length > 0) {
      generatedRef.current = true
      setRecords([...records, ...toAdd])
    } else {
      generatedRef.current = true
    }
  }, [loading, modules, staffNames, staffMembers]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Actions ─────────────────────────────────────────────────

  const cycleStatus = useCallback((recordId) => {
    const rec = records.find(r => r.id === recordId)
    if (!rec) return

    const currentStatus = rec.status === 'overdue' ? 'complete' : rec.status
    const idx = STATUS_CYCLE.indexOf(currentStatus)
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]

    // Find the module for renewal info
    const mod = modules.find(m => m.id === rec.moduleId)
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

    setRecords(records.map(r => r.id === recordId ? { ...r, ...updates } : r))
    logAudit('Updated', `Training: ${rec.moduleName} for ${rec.staffId} → ${next}`, 'Staff Training', user?.name)
  }, [records, modules, setRecords, user])

  const handleUpload = useCallback(async (recordId, file) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      showToast('File must be under 10MB', 'error')
      return
    }

    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowed.includes(file.type)) {
      showToast('Only PDF, JPG, PNG, DOC files accepted', 'error')
      return
    }

    const rec = records.find(r => r.id === recordId)
    if (!rec) return

    setUploading(recordId)
    const ext = file.name.split('.').pop()
    const safeName = rec.staffId.replace(/\s+/g, '-').toLowerCase()
    const path = `${safeName}/${rec.moduleId}-${Date.now()}.${ext}`

    const { error } = await supabase.storage.from('training-evidence').upload(path, file)
    if (error) {
      showToast('Upload failed: ' + error.message, 'error')
      setUploading(null)
      return
    }

    const { data: urlData } = supabase.storage.from('training-evidence').getPublicUrl(path)

    setRecords(records.map(r =>
      r.id === recordId
        ? { ...r, evidenceFileName: file.name, evidenceFilePath: urlData.publicUrl }
        : r
    ))
    showToast('Evidence uploaded')
    logAudit('Uploaded', `Evidence for ${rec.moduleName} — ${rec.staffId}`, 'Staff Training', user?.name)
    setUploading(null)
  }, [records, setRecords, showToast, user])

  const handleDeleteEvidence = useCallback(async (recordId) => {
    const rec = records.find(r => r.id === recordId)
    if (!rec?.evidenceFilePath) return

    const ok = await confirm({
      title: 'Remove evidence?',
      message: `Remove "${rec.evidenceFileName}" from ${rec.staffId}?`,
      confirmLabel: 'Remove',
      variant: 'danger',
    })
    if (!ok) return

    setRecords(records.map(r =>
      r.id === recordId ? { ...r, evidenceFileName: null, evidenceFilePath: null } : r
    ))
    showToast('Evidence removed', 'info')
  }, [records, setRecords, confirm, showToast])

  const handleCsvDownload = useCallback(() => {
    const headers = ['Staff', 'Module', 'Category', 'Mandatory', 'Status', 'Completed', 'Expiry', 'Evidence']
    const rows = effectiveRecords.map(r => {
      const mod = modules.find(m => m.id === r.moduleId)
      const cat = CATEGORIES[r.category]?.label || r.category
      return [
        r.staffId,
        r.moduleName,
        cat,
        mod?.mandatory ? 'Yes' : 'No',
        STATUS_COLORS[r.status]?.label || r.status,
        r.completedDate || '',
        r.expiryDate || 'No expiry',
        r.evidenceFileName || '',
      ]
    })
    downloadCsv('staff-training', headers, rows)
    showToast('CSV downloaded')
  }, [effectiveRecords, modules, showToast])

  // ─── Loading guard (AFTER all hooks) ──────────────────────────

  if (loading) {
    return <SkeletonLoader variant="table" />
  }

  // ─── Render ───────────────────────────────────────────────────

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <p className="text-sm text-ec-t3">
          Training compliance tracker — {modules.length} modules across {staffNames.length} staff
        </p>
        <button className={btnSecondary} onClick={handleCsvDownload}>
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {Object.entries(STATUS_COLORS).map(([key, cfg]) => (
          <div
            key={key}
            className="rounded-xl p-3 text-center transition-colors cursor-default"
            style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.ring}` }}
          >
            <span className="text-2xl font-bold block" style={{ color: cfg.color }}>{stats[key] || 0}</span>
            <span className="text-xs text-ec-t3 mt-0.5 block">{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* Compliance Cards */}
      <ComplianceCards
        staffProgress={staffProgress}
        onSelect={(name) => {
          setSelectedStaff(name)
          setTab('By Staff')
        }}
      />

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
          handleUpload={handleUpload}
          handleDeleteEvidence={handleDeleteEvidence}
          uploading={uploading}
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
          handleUpload={handleUpload}
          handleDeleteEvidence={handleDeleteEvidence}
          uploading={uploading}
        />
      )}

      {ConfirmDialog}
    </div>
  )
}

// ─── ComplianceCards ─────────────────────────────────────────────

function ComplianceCards({ staffProgress, onSelect }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-ec-t1 mb-3">Staff Compliance</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {staffProgress.map(sp => {
          const barColor = sp.pct >= 80 ? '#059669' : sp.pct >= 50 ? '#f59e0b' : '#ef4444'
          return (
            <div
              key={sp.name}
              className="rounded-xl p-3 cursor-pointer transition-all hover:shadow-md"
              style={{ backgroundColor: 'var(--ec-card)', border: '1px solid var(--ec-border)' }}
              onClick={() => onSelect(sp.name)}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: barColor }}
                >
                  {getStaffInitials(sp.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-ec-t1 font-medium truncate">{sp.name}</p>
                  <p className="text-xs text-ec-t3">{sp.complete}/{sp.total}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-ec-border overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${sp.pct}%`, backgroundColor: barColor }}
                  />
                </div>
                <span className="text-xs font-semibold tabular-nums" style={{ color: barColor }}>{sp.pct}%</span>
              </div>
              {sp.overdue > 0 && (
                <p className="text-xs mt-1.5" style={{ color: '#ef4444' }}>
                  {sp.overdue} overdue
                </p>
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
    <div className="flex gap-1 mb-4 bg-ec-card rounded-lg p-1 border border-ec-border w-fit">
      {tabs.map(t => (
        <button
          key={t}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors border-none cursor-pointer font-sans ${
            tab === t
              ? 'bg-ec-em text-white'
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

// ─── LibraryView ─────────────────────────────────────────────────

function LibraryView({
  modules, effectiveRecords, staffNames, expandedModule, setExpandedModule,
  filterCategory, setFilterCategory, filterMandatory, setFilterMandatory,
  search, setSearch, cycleStatus, handleUpload, handleDeleteEvidence, uploading,
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
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ec-t3" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="w-full bg-ec-card border border-ec-border rounded-lg pl-9 pr-3 py-2 text-sm text-ec-t1 placeholder:text-ec-t3 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors font-sans"
            placeholder="Search modules..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className={inputClass + ' !w-auto'} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {Object.entries(CATEGORIES).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select className={inputClass + ' !w-auto'} value={filterMandatory} onChange={e => setFilterMandatory(e.target.value)}>
          <option value="">All</option>
          <option value="yes">Mandatory</option>
          <option value="no">Optional</option>
        </select>
        {(filterCategory || filterMandatory || search) && (
          <button className={btnSecondary} onClick={() => { setFilterCategory(''); setFilterMandatory(''); setSearch('') }}>
            Clear
          </button>
        )}
      </div>

      {/* Grouped modules */}
      {Object.entries(grouped).map(([catKey, mods]) => {
        if (mods.length === 0) return null
        const cat = CATEGORIES[catKey]
        return (
          <div key={catKey} className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <span>{cat.icon}</span>
              <h3 className="text-sm font-bold" style={{ color: cat.color }}>{cat.label}</h3>
              <span className="text-xs text-ec-t3">({mods.length})</span>
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
                  handleUpload={handleUpload}
                  handleDeleteEvidence={handleDeleteEvidence}
                  uploading={uploading}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── ModuleRow ───────────────────────────────────────────────────

function ModuleRow({
  mod, catColor, expanded, onToggle, effectiveRecords, staffNames,
  cycleStatus, handleUpload, handleDeleteEvidence, uploading,
}) {
  const moduleRecords = effectiveRecords.filter(r => r.moduleId === mod.id)
  const completeCount = moduleRecords.filter(r => r.status === 'complete').length
  const overdueCount = moduleRecords.filter(r => r.status === 'overdue').length

  return (
    <div
      className="rounded-lg border border-ec-border overflow-hidden transition-colors"
      style={{ backgroundColor: 'var(--ec-card)' }}
    >
      <button
        className="w-full flex items-center justify-between px-4 py-2.5 text-left bg-transparent border-none cursor-pointer font-sans"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 min-w-0">
          <svg
            className="flex-shrink-0 text-ec-t3 transition-transform"
            style={{ transform: expanded ? 'rotate(90deg)' : 'none' }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="text-sm font-medium text-ec-t1 truncate">{mod.name}</span>
          {mod.mandatory && (
            <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold text-white" style={{ backgroundColor: catColor }}>
              MANDATORY
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-2">
          {mod.renewalMonths && (
            <span className="text-xs text-ec-t3">{mod.renewalMonths}mo renewal</span>
          )}
          <span className="text-xs text-ec-t3">{completeCount}/{moduleRecords.length}</span>
          {overdueCount > 0 && (
            <span className="text-xs font-semibold" style={{ color: '#ef4444' }}>{overdueCount} overdue</span>
          )}
        </div>
      </button>

      {expanded && (
        <ModuleExpander
          mod={mod}
          moduleRecords={moduleRecords}
          staffNames={staffNames}
          cycleStatus={cycleStatus}
          handleUpload={handleUpload}
          handleDeleteEvidence={handleDeleteEvidence}
          uploading={uploading}
        />
      )}
    </div>
  )
}

// ─── ModuleExpander ──────────────────────────────────────────────

function ModuleExpander({ mod, moduleRecords, staffNames, cycleStatus, handleUpload, handleDeleteEvidence, uploading }) {
  return (
    <div className="border-t border-ec-div px-4 py-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th className="text-left text-xs font-semibold text-ec-t3 px-3 py-1.5">Staff</th>
              <th className="text-left text-xs font-semibold text-ec-t3 px-3 py-1.5">Status</th>
              <th className="text-left text-xs font-semibold text-ec-t3 px-3 py-1.5 hidden sm:table-cell">Completed</th>
              <th className="text-left text-xs font-semibold text-ec-t3 px-3 py-1.5 hidden sm:table-cell">Expiry</th>
              <th className="text-left text-xs font-semibold text-ec-t3 px-3 py-1.5">Evidence</th>
            </tr>
          </thead>
          <tbody>
            {moduleRecords.map(rec => (
              <tr key={rec.id} className="hover:bg-ec-card-hover transition-colors">
                <td className="px-3 py-2 text-ec-t1 font-medium">{rec.staffId}</td>
                <td className="px-3 py-2">
                  <StatusBadge status={rec.status} onClick={() => cycleStatus(rec.id)} />
                </td>
                <td className="px-3 py-2 text-ec-t2 text-xs hidden sm:table-cell">
                  {rec.completedDate ? formatDate(rec.completedDate) : '—'}
                </td>
                <td className="px-3 py-2 text-xs hidden sm:table-cell">
                  <ExpiryLabel expiryDate={rec.expiryDate} renewalMonths={mod.renewalMonths} />
                </td>
                <td className="px-3 py-2">
                  <EvidenceUploader
                    recordId={rec.id}
                    evidenceFileName={rec.evidenceFileName}
                    evidenceFilePath={rec.evidenceFilePath}
                    onUpload={handleUpload}
                    onDelete={handleDeleteEvidence}
                    uploading={uploading === rec.id}
                  />
                </td>
              </tr>
            ))}
            {moduleRecords.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-4 text-ec-t3 text-xs text-center">No staff assigned to this module</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── MatrixView ──────────────────────────────────────────────────

function MatrixView({ modules, effectiveRecords, staffNames, cycleStatus }) {
  // Group modules by category
  const grouped = useMemo(() => {
    const g = {}
    for (const cat of Object.keys(CATEGORIES)) g[cat] = []
    modules.forEach(m => {
      if (g[m.category]) g[m.category].push(m)
    })
    return g
  }, [modules])

  // Build lookup: moduleId+staffId → record
  const lookup = useMemo(() => {
    const map = {}
    effectiveRecords.forEach(r => {
      map[`${r.moduleId}|${r.staffId}`] = r
    })
    return map
  }, [effectiveRecords])

  return (
    <div className="overflow-x-auto rounded-xl border border-ec-border">
      <table className="text-xs" style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-ec-card text-left px-3 py-2 text-xs font-semibold text-ec-t3 border-b border-ec-border min-w-[200px]">
              Module
            </th>
            {staffNames.map(name => (
              <th key={name} className="px-2 py-2 text-center text-xs font-semibold text-ec-t3 border-b border-ec-border min-w-[60px]">
                <span className="block truncate max-w-[60px]" title={name}>{getStaffInitials(name)}</span>
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
              ...mods.map(mod => (
                <tr key={mod.id} className="hover:bg-ec-card-hover transition-colors">
                  <td className="sticky left-0 z-10 bg-ec-card px-3 py-1.5 text-ec-t1 border-b border-ec-div font-medium">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate max-w-[180px]">{mod.name}</span>
                      {mod.mandatory && (
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} title="Mandatory" />
                      )}
                    </div>
                  </td>
                  {staffNames.map(staff => {
                    const rec = lookup[`${mod.id}|${staff}`]
                    if (!rec) return <td key={staff} className="px-2 py-1.5 text-center border-b border-ec-div">—</td>
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
                              <line x1="12" y1="8" x2="12" y2="12" /><circle cx="12" cy="16" r="0.5" fill={sc.color} />
                            </svg>
                          )}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              )),
            ]
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── ByStaffView ─────────────────────────────────────────────────

function ByStaffView({
  modules, effectiveRecords, staffNames, staffProgress,
  selectedStaff, setSelectedStaff, cycleStatus,
  handleUpload, handleDeleteEvidence, uploading,
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

  const barColor = sp ? (sp.pct >= 80 ? '#059669' : sp.pct >= 50 ? '#f59e0b' : '#ef4444') : '#94a3b8'

  return (
    <div>
      {/* Staff selector */}
      <div className="flex items-center gap-3 mb-4">
        <select
          className={inputClass + ' !w-auto'}
          value={staff}
          onChange={e => setSelectedStaff(e.target.value)}
        >
          {staffNames.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        {sp && (
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 rounded-full bg-ec-border overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${sp.pct}%`, backgroundColor: barColor }} />
            </div>
            <span className="text-sm font-bold tabular-nums" style={{ color: barColor }}>{sp.pct}%</span>
            <span className="text-xs text-ec-t3">({sp.complete}/{sp.total} complete)</span>
          </div>
        )}
      </div>

      {/* Modules grouped by category */}
      {Object.entries(grouped).map(([catKey, recs]) => {
        if (recs.length === 0) return null
        const cat = CATEGORIES[catKey]
        return (
          <div key={catKey} className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <span>{cat.icon}</span>
              <h3 className="text-sm font-bold" style={{ color: cat.color }}>{cat.label}</h3>
            </div>
            <div className="space-y-1">
              {recs.map(rec => {
                const mod = modules.find(m => m.id === rec.moduleId)
                return (
                  <div
                    key={rec.id}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-ec-border"
                    style={{ backgroundColor: 'var(--ec-card)' }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-ec-t1 font-medium truncate">{rec.moduleName}</span>
                        {mod?.mandatory && (
                          <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold text-white" style={{ backgroundColor: cat.color }}>
                            MANDATORY
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-ec-t3">
                          {rec.completedDate ? `Completed: ${formatDate(rec.completedDate)}` : 'Not completed'}
                        </span>
                        <ExpiryLabel expiryDate={rec.expiryDate} renewalMonths={mod?.renewalMonths} />
                      </div>
                    </div>

                    <StatusBadge status={rec.status} onClick={() => cycleStatus(rec.id)} />

                    <EvidenceUploader
                      recordId={rec.id}
                      evidenceFileName={rec.evidenceFileName}
                      evidenceFilePath={rec.evidenceFilePath}
                      onUpload={handleUpload}
                      onDelete={handleDeleteEvidence}
                      uploading={uploading === rec.id}
                    />
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
      className="px-2.5 py-1 rounded-full text-xs font-semibold border-none cursor-pointer transition-colors font-sans"
      style={{ backgroundColor: sc.bg, color: sc.color }}
      onClick={onClick}
      title="Click to cycle status"
    >
      {sc.label}
    </button>
  )
}

function ExpiryLabel({ expiryDate, renewalMonths }) {
  if (!renewalMonths && !expiryDate) {
    return <span className="text-xs text-ec-t3">No expiry</span>
  }
  if (!expiryDate) {
    return <span className="text-xs text-ec-t3">—</span>
  }

  const days = daysUntil(expiryDate)
  if (days < 0) {
    return <span className="text-xs font-semibold" style={{ color: '#ef4444' }}>Expired {formatDate(expiryDate)}</span>
  }
  if (days <= 28) {
    return <span className="text-xs font-semibold" style={{ color: '#f59e0b' }}>Expires {formatDate(expiryDate)}</span>
  }
  return <span className="text-xs text-ec-t3">{formatDate(expiryDate)}</span>
}

function EvidenceUploader({ recordId, evidenceFileName, evidenceFilePath, onUpload, onDelete, uploading }) {
  const fileRef = useRef(null)

  if (evidenceFilePath) {
    return (
      <div className="flex items-center gap-1.5">
        <a
          href={evidenceFilePath}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-ec-em hover:underline truncate max-w-[100px]"
          title={evidenceFileName}
        >
          {evidenceFileName}
        </a>
        <button
          className="text-ec-t3 hover:text-ec-crit transition-colors border-none bg-transparent cursor-pointer p-0"
          onClick={() => onDelete(recordId)}
          title="Remove evidence"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        className="hidden"
        onChange={e => {
          if (e.target.files[0]) onUpload(recordId, e.target.files[0])
          e.target.value = ''
        }}
      />
      <button
        className={`${btnSecondary} text-[11px] px-2 py-1 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? (
          <span className="flex items-center gap-1">
            <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeDasharray="56" strokeDashoffset="14" />
            </svg>
            Uploading...
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Upload
          </span>
        )}
      </button>
    </div>
  )
}
