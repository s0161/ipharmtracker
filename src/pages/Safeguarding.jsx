import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useSupabase } from '../hooks/useSupabase'
import { useUser } from '../contexts/UserContext'
import { usePharmacyConfig } from '../hooks/usePharmacyConfig'
import { isElevatedRole } from '../utils/taskEngine'
import { generateId, formatDate } from '../utils/helpers'
import { downloadCsv } from '../utils/exportCsv'
import { logAudit } from '../utils/auditLog'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/ConfirmDialog'
import { getStaffInitials } from '../utils/rotationManager'
import EmptyState from '../components/EmptyState'
import SkeletonLoader from '../components/SkeletonLoader'

// ─── Constants ───
const TABS = ['Concerns', 'Referrals', 'Contacts', 'Signposting', 'Training']

const CONCERN_CATEGORIES = {
  adult_at_risk: { label: 'Adult at Risk', color: 'var(--ec-warn)', bg: 'var(--ec-warn-bg)' },
  child: { label: 'Child Concern', color: 'var(--ec-info)', bg: 'var(--ec-info-bg)' },
  domestic_abuse: { label: 'Domestic Abuse', color: 'var(--ec-cat-purple)', bg: 'var(--ec-cat-purple-bg)' },
  mental_health: { label: 'Mental Health', color: 'var(--ec-cat-teal)', bg: 'var(--ec-cat-teal-bg)' },
  substance_misuse: { label: 'Substance Misuse', color: 'var(--ec-cat-orange)', bg: 'var(--ec-cat-orange-bg)' },
}

const RISK_LEVELS = ['low', 'medium', 'high']
const CONCERN_STATUSES = ['open', 'referred', 'resolved', 'no_further_action']
const REFERRAL_STATUSES = ['pending', 'in_progress', 'completed', 'withdrawn']
const CONSENT_TYPES = [
  { value: 'patient_consent', label: 'Patient Consent Given' },
  { value: 'non_consensual_safeguarding', label: 'Non-Consensual (Safeguarding Override)' },
  { value: 'capacity_assessed', label: 'Capacity Assessed — Best Interest Decision' },
  { value: 'not_applicable', label: 'Not Applicable' },
]

const CONTACT_CATEGORIES = {
  emergency: { label: 'Emergency', color: 'var(--ec-crit)' },
  domestic_abuse: { label: 'Domestic Abuse', color: 'var(--ec-cat-purple)' },
  mental_health: { label: 'Mental Health', color: 'var(--ec-cat-teal)' },
  child_concern: { label: 'Child Concern', color: 'var(--ec-info)' },
  substance_misuse: { label: 'Substance Misuse', color: 'var(--ec-cat-orange)' },
  general: { label: 'General', color: 'var(--ec-t2)' },
}

const SIGNPOSTING_ICONS = {
  domestic_abuse: '💜',
  mental_health: '🧠',
  child_concern: '👶',
  adult_at_risk: '🛡️',
  substance_misuse: '💊',
  general_vulnerability: '🏘️',
}

const STATUS_STYLES = {
  open: { bg: 'var(--ec-warn-bg)', text: 'var(--ec-warn-dark)' },
  referred: { bg: 'var(--ec-info-bg)', text: 'var(--ec-info)' },
  resolved: { bg: 'var(--ec-em-bg)', text: 'var(--ec-em-dark)' },
  no_further_action: { bg: 'var(--ec-card-hover)', text: 'var(--ec-t2)' },
}

const REFERRAL_STATUS_STYLES = {
  pending: { bg: 'var(--ec-warn-bg)', text: 'var(--ec-warn-dark)' },
  in_progress: { bg: 'var(--ec-info-bg)', text: 'var(--ec-info)' },
  completed: { bg: 'var(--ec-em-bg)', text: 'var(--ec-em-dark)' },
  withdrawn: { bg: 'var(--ec-card-hover)', text: 'var(--ec-t2)' },
}

const inputClass =
  'w-full bg-ec-card border border-ec-border rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors font-sans'

const btnPrimary =
  'px-4 py-2 bg-ec-em text-white rounded-lg text-xs font-semibold border-none cursor-pointer hover:bg-ec-em-dark transition-colors'

const btnSecondary =
  'px-4 py-2 bg-ec-card border border-ec-border text-ec-t2 rounded-lg text-xs font-semibold cursor-pointer hover:bg-ec-card-hover transition-colors'

// ─── Drawer Component ───
function Drawer({ open, onClose, title, children }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: open ? 'blur(4px)' : 'none' }}
        onClick={onClose}
      />
      <div
        ref={ref}
        className={`fixed top-0 right-0 h-full z-[61] flex flex-col bg-ec-bg border-l border-ec-div shadow-2xl
          transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          w-full sm:w-[420px]
          ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-ec-div shrink-0">
          <h2 className="text-sm font-bold text-ec-t1">{title}</h2>
          <button onClick={onClose} className="bg-transparent border-none text-ec-t3 cursor-pointer p-1 hover:text-ec-t1 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>
      </div>
    </>
  )
}

// ─── Status/Category Badges ───
function StatusPill({ status, styles }) {
  const s = styles[status] || { bg: 'var(--ec-card-hover)', text: 'var(--ec-t2)' }
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
      style={{ backgroundColor: s.bg, color: s.text }}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

function CategoryDot({ category }) {
  const cat = CONCERN_CATEGORIES[category]
  if (!cat) return null
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ec-t2">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
      {cat.label}
    </span>
  )
}

function MiniAvatar({ name }) {
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[9px] font-bold text-white shrink-0"
      style={{ background: 'linear-gradient(135deg, var(--ec-em), var(--ec-em-dark))' }} title={name}>
      {getStaffInitials(name)}
    </span>
  )
}

// ─── Tab Bar ───
function TabBar({ active, onChange, openCount, pendingCount }) {
  return (
    <div className="flex gap-1 border-b border-ec-div mb-5 overflow-x-auto">
      {TABS.map((tab) => {
        const isActive = active === tab
        const badge = tab === 'Concerns' ? openCount : tab === 'Referrals' ? pendingCount : 0
        return (
          <button key={tab} onClick={() => onChange(tab)}
            className={`px-3 py-2.5 text-xs font-semibold border-none cursor-pointer transition-colors shrink-0
              ${isActive ? 'text-ec-em bg-transparent' : 'text-ec-t3 bg-transparent hover:text-ec-t1'}`}
            style={isActive ? { borderBottom: '2px solid var(--ec-em)' } : {}}>
            <span className="flex items-center gap-1.5">
              {tab}
              {badge > 0 && (
                <span className="px-1.5 py-px rounded-full text-[9px] font-bold bg-ec-warn-faint text-ec-warn-light">{badge}</span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Stat Strip ───
function StatStrip({ openConcerns, pendingReferrals, trainingOverdue, region }) {
  const pills = [
    { label: 'Open Concerns', value: openConcerns, color: openConcerns > 0 ? 'var(--ec-warn)' : 'var(--ec-em)' },
    { label: 'Pending Referrals', value: pendingReferrals, color: pendingReferrals > 0 ? 'var(--ec-info)' : 'var(--ec-em)' },
    { label: 'Training Overdue', value: trainingOverdue, color: trainingOverdue > 0 ? 'var(--ec-crit)' : 'var(--ec-em)' },
    { label: 'Region', value: region || 'National', color: 'var(--ec-t2)', isText: true },
  ]
  return (
    <div className="flex flex-wrap gap-2 mb-5">
      {pills.map((p) => (
        <div key={p.label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-ec-div bg-ec-card">
          <span className="text-[10px] text-ec-t3 font-medium">{p.label}</span>
          <span className="text-xs font-bold" style={{ color: p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Helper: generate next reference ───
function generateRef(prefix, existing) {
  const year = new Date().getFullYear()
  const yearRefs = existing.filter((r) => r.startsWith(`${prefix}-${year}-`))
  const maxNum = yearRefs.reduce((max, r) => {
    const num = parseInt(r.split('-').pop(), 10)
    return isNaN(num) ? max : Math.max(max, num)
  }, 0)
  return `${prefix}-${year}-${String(maxNum + 1).padStart(3, '0')}`
}

// ────────────────────────────────────────────
// MAIN PAGE
// ────────────────────────────────────────────
export default function Safeguarding() {
  const { user } = useUser()
  const toast = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  const [pharmacyConfig] = usePharmacyConfig()
  const elevated = isElevatedRole(user?.role)

  const [concerns, setConcerns, concernsLoading] = useSupabase('safeguarding_concerns', [])
  const [referrals, setReferrals, referralsLoading] = useSupabase('safeguarding_referrals', [])
  const [contacts, , contactsLoading] = useSupabase('safeguarding_contacts', [])
  const [resources, , resourcesLoading] = useSupabase('signposting_resources', [])
  const [trainingLogs, , trainingLogsLoading] = useSupabase('training_logs', [])
  const [staffMembers] = useSupabase('staff_members', [])

  const [tab, setTab] = useState('Concerns')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState(null)

  const openCount = useMemo(() => concerns.filter((c) => c.status === 'open').length, [concerns])
  const pendingRefCount = useMemo(() => referrals.filter((r) => r.status === 'pending').length, [referrals])
  const trainingOverdue = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return trainingLogs.filter((l) =>
      (l.topic?.includes('Safeguarding Adults') || l.topic?.includes('Safeguarding Children')) &&
      l.certificateExpiry && l.certificateExpiry < today
    ).length
  }, [trainingLogs])

  const pharmacyRegion = pharmacyConfig?.region || 'tameside'

  const openDrawer = (mode, data) => { setDrawerMode({ mode, data }); setDrawerOpen(true) }
  const closeDrawer = () => { setDrawerOpen(false); setTimeout(() => setDrawerMode(null), 300) }

  return (
    <div className="max-w-6xl mx-auto">
      {ConfirmDialog}
      <StatStrip openConcerns={openCount} pendingReferrals={pendingRefCount}
        trainingOverdue={trainingOverdue}
        region={pharmacyRegion.charAt(0).toUpperCase() + pharmacyRegion.slice(1)} />
      <TabBar active={tab} onChange={setTab} openCount={openCount} pendingCount={pendingRefCount} />

      {tab === 'Concerns' && <ConcernsTab concerns={concerns} setConcerns={setConcerns} loading={concernsLoading}
        user={user} elevated={elevated} toast={toast} confirm={confirm} openDrawer={openDrawer} />}
      {tab === 'Referrals' && <ReferralsTab referrals={referrals} setReferrals={setReferrals} concerns={concerns}
        contacts={contacts} loading={referralsLoading} user={user} elevated={elevated} toast={toast} openDrawer={openDrawer} />}
      {tab === 'Contacts' && <ContactsTab contacts={contacts} loading={contactsLoading} elevated={elevated}
        pharmacyRegion={pharmacyRegion} openDrawer={openDrawer} />}
      {tab === 'Signposting' && <SignpostingTab resources={resources} contacts={contacts}
        loading={resourcesLoading} pharmacyConfig={pharmacyConfig} />}
      {tab === 'Training' && <TrainingTab trainingLogs={trainingLogs} staffMembers={staffMembers} loading={trainingLogsLoading} />}

      <Drawer open={drawerOpen} onClose={closeDrawer}
        title={drawerMode?.mode === 'new_concern' ? 'Log Concern' :
          drawerMode?.mode === 'edit_concern' ? 'Update Concern' :
          drawerMode?.mode === 'view_concern' ? 'Concern Details' :
          drawerMode?.mode === 'new_referral' ? 'New Referral' :
          drawerMode?.mode === 'edit_referral' ? 'Update Referral' :
          drawerMode?.mode === 'new_contact' ? 'Add Contact' : 'Details'}>
        {drawerMode?.mode === 'new_concern' && <ConcernForm concerns={concerns} setConcerns={setConcerns} user={user} toast={toast} onClose={closeDrawer} />}
        {drawerMode?.mode === 'edit_concern' && <ConcernForm concerns={concerns} setConcerns={setConcerns} user={user} toast={toast} onClose={closeDrawer} existing={drawerMode.data} />}
        {drawerMode?.mode === 'view_concern' && <ConcernDetail concern={drawerMode.data} />}
        {drawerMode?.mode === 'new_referral' && <ReferralForm referrals={referrals} setReferrals={setReferrals} concerns={concerns} contacts={contacts} user={user} toast={toast} onClose={closeDrawer} linkedConcern={drawerMode.data?.linkedConcern} />}
        {drawerMode?.mode === 'edit_referral' && <ReferralForm referrals={referrals} setReferrals={setReferrals} concerns={concerns} contacts={contacts} user={user} toast={toast} onClose={closeDrawer} existing={drawerMode.data} />}
        {drawerMode?.mode === 'new_contact' && <ContactForm contacts={contacts} toast={toast} onClose={closeDrawer} />}
      </Drawer>
    </div>
  )
}

// ────────────────────────────────────────────
// CONCERNS TAB
// ────────────────────────────────────────────
function ConcernsTab({ concerns, setConcerns, loading, user, elevated, toast, confirm, openDrawer }) {
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [searchQ, setSearchQ] = useState('')

  const visible = useMemo(() => {
    let list = [...concerns]
    if (!elevated) list = list.filter((c) => c.reportedBy === user?.name)
    if (filterStatus !== 'all') list = list.filter((c) => c.status === filterStatus)
    if (filterCategory !== 'all') list = list.filter((c) => c.category === filterCategory)
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase()
      list = list.filter((c) => c.concernRef?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q) ||
        c.reportedBy?.toLowerCase().includes(q) || c.patientIdentifier?.toLowerCase().includes(q))
    }
    return list.sort((a, b) => (b.concernDate || '').localeCompare(a.concernDate || ''))
  }, [concerns, elevated, user, filterStatus, filterCategory, searchQ])

  const handleExportCsv = () => {
    downloadCsv('safeguarding-concerns', ['Reference', 'Date', 'Category', 'Patient ID', 'Description', 'Risk', 'Status', 'Reported By'],
      visible.map((c) => [c.concernRef, c.concernDate, c.category, c.patientIdentifier, c.description, c.riskLevel, c.status, c.reportedBy]))
    toast('CSV exported', 'success')
  }

  if (loading) return <SkeletonLoader />

  return (
    <div>
      {!elevated && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg mb-4 text-xs" style={{ backgroundColor: 'var(--ec-warn-bg)', color: 'var(--ec-warn-dark)' }}>
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1.5L1.5 13h13L8 1.5z" /><line x1="8" y1="6" x2="8" y2="9" /><line x1="8" y1="11" x2="8.01" y2="11" /></svg>
          You can only see concerns you have reported. Contact a manager for full access.
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button onClick={() => openDrawer('new_concern')} className={btnPrimary}>+ Log Concern</button>
        {elevated && (
          <>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={inputClass + ' !w-auto !py-1.5 !text-xs'}>
              <option value="all">All Statuses</option>
              {CONCERN_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={inputClass + ' !w-auto !py-1.5 !text-xs'}>
              <option value="all">All Categories</option>
              {Object.entries(CONCERN_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </>
        )}
        <input type="text" placeholder="Search concerns..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
          className={inputClass + ' !w-48 !py-1.5 !text-xs'} />
        <div className="flex-1" />
        {elevated && visible.length > 0 && <button onClick={handleExportCsv} className={btnSecondary}>Export CSV</button>}
      </div>

      {visible.length === 0 ? (
        <EmptyState title="No concerns found"
          description={filterStatus !== 'all' || filterCategory !== 'all' ? 'Try adjusting your filters' : 'Log the first safeguarding concern to get started'}
          actionLabel="+ Log Concern" onAction={() => openDrawer('new_concern')} />
      ) : (
        <div className="space-y-3">
          {visible.map((c) => (
            <ConcernCard key={c.id} concern={c} elevated={elevated}
              onView={() => openDrawer('view_concern', c)} onEdit={() => openDrawer('edit_concern', c)}
              onCreateReferral={() => openDrawer('new_referral', { linkedConcern: c })} />
          ))}
        </div>
      )}
    </div>
  )
}

function ConcernCard({ concern: c, elevated, onView, onEdit, onCreateReferral }) {
  return (
    <div className="bg-ec-card border border-ec-div rounded-xl p-4 ec-fadeup hover:shadow-sm transition-shadow">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-xs font-bold text-ec-t1 font-mono">{c.concernRef}</span>
        <StatusPill status={c.status} styles={STATUS_STYLES} />
        <CategoryDot category={c.category} />
        <span className="text-[10px] text-ec-t3 ml-auto">{formatDate(c.concernDate)}</span>
      </div>
      <p className="text-xs text-ec-t2 mb-2 line-clamp-2">{c.description}</p>
      <div className="flex flex-wrap items-center gap-3 text-[10px] text-ec-t3">
        <span className="flex items-center gap-1"><MiniAvatar name={c.reportedBy} />{c.reportedBy}</span>
        {c.riskLevel === 'high' && <span className="px-1.5 py-0.5 rounded bg-ec-crit-faint text-ec-crit font-bold uppercase text-[9px]">High Risk</span>}
        {c.escalatedToSuperintendent && <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-bold uppercase text-[9px]">Escalated</span>}
        {c.followUpRequired && c.followUpDate && <span>Follow-up: {formatDate(c.followUpDate)}</span>}
      </div>
      <div className="flex gap-2 mt-3 pt-3 border-t border-ec-div">
        <button onClick={onView} className={btnSecondary + ' !py-1 !px-2.5 !text-[10px]'}>View Full</button>
        {elevated && (c.status === 'open' || c.status === 'referred') && (
          <button onClick={onEdit} className={btnSecondary + ' !py-1 !px-2.5 !text-[10px]'}>Update Status</button>
        )}
        {elevated && (c.status === 'open' || c.status === 'referred') && (
          <button onClick={onCreateReferral} className={btnSecondary + ' !py-1 !px-2.5 !text-[10px]'}>Create Referral</button>
        )}
      </div>
    </div>
  )
}

function ConcernDetail({ concern: c }) {
  if (!c) return null
  const fields = [
    ['Reference', c.concernRef], ['Date', formatDate(c.concernDate)], ['Time', c.concernTime || '—'],
    ['Category', CONCERN_CATEGORIES[c.category]?.label || c.category], ['Patient ID', c.patientIdentifier || '—'],
    ['Risk Level', c.riskLevel], ['Status', c.status?.replace(/_/g, ' ')], ['Reported By', c.reportedBy],
  ]
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {fields.map(([k, v]) => (
          <div key={k}>
            <div className="text-[10px] text-ec-t3 uppercase font-bold mb-0.5">{k}</div>
            <div className="text-xs text-ec-t1">{v}</div>
          </div>
        ))}
      </div>
      <div>
        <div className="text-[10px] text-ec-t3 uppercase font-bold mb-1">Description</div>
        <p className="text-xs text-ec-t2 whitespace-pre-wrap">{c.description}</p>
      </div>
      {c.actionTaken && <div>
        <div className="text-[10px] text-ec-t3 uppercase font-bold mb-1">Action Taken</div>
        <p className="text-xs text-ec-t2 whitespace-pre-wrap">{c.actionTaken}</p>
      </div>}
      {c.escalatedToSuperintendent && (
        <div className="px-3 py-2 rounded-lg bg-purple-50 text-purple-800 text-xs">
          Escalated to superintendent {c.escalatedAt ? `on ${formatDate(c.escalatedAt.slice(0, 10))}` : ''}
        </div>
      )}
      {c.followUpRequired && <div>
        <div className="text-[10px] text-ec-t3 uppercase font-bold mb-1">Follow-up</div>
        <p className="text-xs text-ec-t2">{formatDate(c.followUpDate)} — {c.followUpNotes || 'No notes'}</p>
      </div>}
      {c.outcome && <div>
        <div className="text-[10px] text-ec-t3 uppercase font-bold mb-1">Outcome</div>
        <p className="text-xs text-ec-t2 whitespace-pre-wrap">{c.outcome}</p>
      </div>}
    </div>
  )
}

// ─── Concern Form ───
function ConcernForm({ concerns, setConcerns, user, toast, onClose, existing }) {
  const isEdit = !!existing
  const [form, setForm] = useState(() => {
    if (existing) return {
      category: existing.category || '', concernDate: existing.concernDate || '', concernTime: existing.concernTime || '',
      patientIdentifier: existing.patientIdentifier || '', description: existing.description || '',
      actionTaken: existing.actionTaken || '', riskLevel: existing.riskLevel || 'medium', status: existing.status || 'open',
      escalate: existing.escalatedToSuperintendent || false, followUp: existing.followUpRequired || false,
      followUpDate: existing.followUpDate || '', followUpNotes: existing.followUpNotes || '', outcome: existing.outcome || '',
    }
    const now = new Date()
    return { category: '', concernDate: now.toISOString().slice(0, 10), concernTime: now.toTimeString().slice(0, 5),
      patientIdentifier: '', description: '', actionTaken: '', riskLevel: 'medium', status: 'open',
      escalate: false, followUp: false, followUpDate: '', followUpNotes: '', outcome: '' }
  })
  const [errors, setErrors] = useState({})
  const validate = () => {
    const e = {}
    if (!form.category) e.category = true
    if (!form.description.trim()) e.description = true
    if (!form.concernDate) e.concernDate = true
    setErrors(e)
    return Object.keys(e).length === 0
  }
  const handleSave = async () => {
    if (!validate()) return
    if (isEdit) {
      const updated = concerns.map((c) => c.id === existing.id ? {
        ...c, category: form.category, concernDate: form.concernDate, concernTime: form.concernTime,
        patientIdentifier: form.patientIdentifier, description: form.description, actionTaken: form.actionTaken,
        riskLevel: form.riskLevel, status: form.status, escalatedToSuperintendent: form.escalate,
        escalatedAt: form.escalate && !existing.escalatedToSuperintendent ? new Date().toISOString() : existing.escalatedAt || '',
        followUpRequired: form.followUp, followUpDate: form.followUpDate, followUpNotes: form.followUpNotes, outcome: form.outcome,
        closedAt: (form.status === 'resolved' || form.status === 'no_further_action') && !existing.closedAt ? new Date().toISOString().slice(0, 10) : existing.closedAt || '',
        closedBy: (form.status === 'resolved' || form.status === 'no_further_action') && !existing.closedBy ? user?.name : existing.closedBy || '',
      } : c)
      setConcerns(updated)
      logAudit('Updated concern', existing.concernRef, 'Safeguarding', user?.name)
      toast('Concern updated', 'success')
    } else {
      const ref = generateRef('SC', concerns.map((c) => c.concernRef))
      const newConcern = {
        id: generateId(), concernRef: ref, concernDate: form.concernDate, concernTime: form.concernTime,
        category: form.category, patientIdentifier: form.patientIdentifier, description: form.description,
        actionTaken: form.actionTaken, riskLevel: form.riskLevel, status: 'open',
        reportedBy: user?.name || 'Unknown', escalatedToSuperintendent: form.escalate,
        escalatedAt: form.escalate ? new Date().toISOString() : '',
        followUpRequired: form.followUp, followUpDate: form.followUpDate, followUpNotes: form.followUpNotes,
        outcome: '', closedAt: '', closedBy: '',
      }
      setConcerns([...concerns, newConcern])
      logAudit('Logged concern', ref, 'Safeguarding', user?.name)
      if (form.escalate) {
        await supabase.from('staff_tasks').insert({
          id: generateId(), title: `Safeguarding escalation: ${ref}`, priority: 'HIGH', status: 'pending',
          due_date: form.concernDate, assigned_to: 'Amjid Shakoor', assigned_by: user?.name || 'System',
          role_required: 'superintendent',
          notes: `Concern ${ref} (${CONCERN_CATEGORIES[form.category]?.label || form.category}) escalated for superintendent review`,
          created_at: new Date().toISOString(),
        })
      }
      toast(`Concern ${ref} logged`, 'success')
    }
    onClose()
  }
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const errClass = (field) => errors[field] ? inputClass.replace('border-ec-border', 'border-red-500') : inputClass

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-ec-t3 uppercase font-bold block mb-1">Date *</label>
          <input type="date" value={form.concernDate} onChange={(e) => set('concernDate', e.target.value)} className={errClass('concernDate')} />
        </div>
        <div>
          <label className="text-[10px] text-ec-t3 uppercase font-bold block mb-1">Time</label>
          <input type="time" value={form.concernTime} onChange={(e) => set('concernTime', e.target.value)} className={inputClass} />
        </div>
      </div>
      <div>
        <label className="text-[10px] text-ec-t3 uppercase font-bold block mb-1">Category *</label>
        <select value={form.category} onChange={(e) => set('category', e.target.value)} className={errClass('category')}>
          <option value="">Select category...</option>
          {Object.entries(CONCERN_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      <div>
        <label className="text-[10px] text-ec-t3 uppercase font-bold block mb-1">Patient Identifier</label>
        <input type="text" value={form.patientIdentifier} maxLength={20} onChange={(e) => set('patientIdentifier', e.target.value)}
          placeholder="Initials or NHS number only" className={inputClass} />
        <p className="text-[10px] text-ec-t4 mt-0.5">Max 20 chars — initials or NHS number only</p>
      </div>
      <div>
        <label className="text-[10px] text-ec-t3 uppercase font-bold block mb-1">Description *</label>
        <textarea rows={4} value={form.description} onChange={(e) => set('description', e.target.value)}
          placeholder="Record facts only, do not speculate" className={errClass('description')} />
      </div>
      <div>
        <label className="text-[10px] text-ec-t3 uppercase font-bold block mb-1">Action Taken</label>
        <textarea rows={3} value={form.actionTaken} onChange={(e) => set('actionTaken', e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="text-[10px] text-ec-t3 uppercase font-bold block mb-1">Risk Level</label>
        <div className="flex gap-2">
          {RISK_LEVELS.map((r) => (
            <button key={r} onClick={() => set('riskLevel', r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors capitalize
                ${form.riskLevel === r
                  ? r === 'high' ? 'bg-ec-crit-faint border-ec-crit text-ec-crit'
                    : r === 'medium' ? 'bg-ec-warn-faint border-ec-warn text-ec-warn'
                    : 'bg-ec-em-faint border-ec-em text-ec-em'
                  : 'bg-ec-card border-ec-border text-ec-t2 hover:bg-ec-card-hover'}`}>
              {r}
            </button>
          ))}
        </div>
      </div>
      {isEdit && <div>
        <label className="text-[10px] text-ec-t3 uppercase font-bold block mb-1">Status</label>
        <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputClass}>
          {CONCERN_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>}
      {isEdit && (form.status === 'resolved' || form.status === 'no_further_action') && <div>
        <label className="text-[10px] text-ec-t3 uppercase font-bold block mb-1">Outcome</label>
        <textarea rows={3} value={form.outcome} onChange={(e) => set('outcome', e.target.value)} className={inputClass} />
      </div>}
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.escalate} onChange={(e) => set('escalate', e.target.checked)}
          className="w-4 h-4 rounded border-ec-border text-ec-em focus:ring-ec-em" />
        <span className="text-xs text-ec-t2">Escalate to superintendent</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.followUp} onChange={(e) => set('followUp', e.target.checked)}
          className="w-4 h-4 rounded border-ec-border text-ec-em focus:ring-ec-em" />
        <span className="text-xs text-ec-t2">Follow-up required</span>
      </label>
      {form.followUp && <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-ec-t3 uppercase font-bold block mb-1">Follow-up Date</label>
          <input type="date" value={form.followUpDate} onChange={(e) => set('followUpDate', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="text-[10px] text-ec-t3 uppercase font-bold block mb-1">Notes</label>
          <input type="text" value={form.followUpNotes} onChange={(e) => set('followUpNotes', e.target.value)} className={inputClass} />
        </div>
      </div>}
      <div className="flex gap-2 pt-2">
        <button onClick={handleSave} className={btnPrimary}>{isEdit ? 'Update' : 'Log Concern'}</button>
        <button onClick={onClose} className={btnSecondary}>Cancel</button>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────
// REFERRALS TAB
// ────────────────────────────────────────────
function ReferralsTab({ referrals, setReferrals, concerns, contacts, loading, user, elevated, toast, openDrawer }) {
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQ, setSearchQ] = useState('')

  if (!elevated) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ec-t4 mb-3">
          <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
        <h3 className="text-sm font-semibold text-ec-t2 mb-1">Access Restricted</h3>
        <p className="text-xs text-ec-t3 max-w-[280px]">Referral records are only accessible to managers and pharmacists.</p>
      </div>
    )
  }

  const visible = useMemo(() => {
    let list = [...referrals]
    if (filterStatus !== 'all') list = list.filter((r) => r.status === filterStatus)
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase()
      list = list.filter((r) => r.referralRef?.toLowerCase().includes(q) || r.referredTo?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q))
    }
    return list.sort((a, b) => (b.referralDate || '').localeCompare(a.referralDate || ''))
  }, [referrals, filterStatus, searchQ])

  const handleExportCsv = () => {
    downloadCsv('safeguarding-referrals', ['Reference', 'Date', 'Referred To', 'Type', 'Status', 'Patient ID', 'Referred By'],
      visible.map((r) => [r.referralRef, r.referralDate, r.referredTo, r.concernType, r.status, r.patientIdentifier, r.referredBy]))
    toast('CSV exported', 'success')
  }

  if (loading) return <SkeletonLoader />

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button onClick={() => openDrawer('new_referral', {})} className={btnPrimary}>+ New Referral</button>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={inputClass + ' !w-auto !py-1.5 !text-xs'}>
          <option value="all">All Statuses</option>
          {REFERRAL_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <input type="text" placeholder="Search referrals..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)} className={inputClass + ' !w-48 !py-1.5 !text-xs'} />
        <div className="flex-1" />
        {visible.length > 0 && <button onClick={handleExportCsv} className={btnSecondary}>Export CSV</button>}
      </div>
      {visible.length === 0 ? (
        <EmptyState title="No referrals found" description="Create a referral from a concern or start a new one"
          actionLabel="+ New Referral" onAction={() => openDrawer('new_referral', {})} />
      ) : (
        <div className="space-y-3">
          {visible.map((r) => (
            <div key={r.id} className="bg-ec-card border border-ec-div rounded-xl p-4 ec-fadeup">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-bold text-ec-t1 font-mono">{r.referralRef}</span>
                <StatusPill status={r.status} styles={REFERRAL_STATUS_STYLES} />
                <span className="text-[10px] text-ec-t3 ml-auto">{formatDate(r.referralDate)}</span>
              </div>
              <div className="text-xs text-ec-t2 mb-1"><span className="font-semibold">Referred to:</span> {r.referredTo}</div>
              <div className="text-xs text-ec-t2 mb-1"><span className="font-semibold">Type:</span> {CONCERN_CATEGORIES[r.concernType]?.label || r.concernType}</div>
              {r.referenceNumber && <div className="text-[10px] text-ec-t3">Org Ref: {r.referenceNumber}</div>}
              {r.description && <p className="text-xs text-ec-t3 mt-1 line-clamp-2">{r.description}</p>}
              <div className="flex gap-2 mt-3 pt-3 border-t border-ec-div">
                <button onClick={() => openDrawer('edit_referral', r)} className={btnSecondary + ' !py-1 !px-2.5 !text-[10px]'}>Update</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ReferralForm({ referrals, setReferrals, concerns, contacts, user, toast, onClose, existing, linkedConcern }) {
  const isEdit = !!existing
  const openConcerns = concerns.filter((c) => c.status === 'open' || c.status === 'referred')
  const [form, setForm] = useState(() => {
    if (existing) return {
      concernId: existing.concernId || '', referralDate: existing.referralDate || '', referredTo: existing.referredTo || '',
      concernType: existing.concernType || '', patientIdentifier: existing.patientIdentifier || '',
      consentType: existing.consentType || '', consentNotes: existing.consentNotes || '',
      referenceNumber: existing.referenceNumber || '', description: existing.description || '',
      status: existing.status || 'pending', outcome: existing.outcome || '',
      outcomeNotes: existing.outcomeNotes || '', outcomeDate: existing.outcomeDate || '',
    }
    return {
      concernId: linkedConcern?.id || '', referralDate: new Date().toISOString().slice(0, 10),
      referredTo: '', concernType: linkedConcern?.category || '', patientIdentifier: linkedConcern?.patientIdentifier || '',
      consentType: '', consentNotes: '', referenceNumber: '', description: '',
      status: 'pending', outcome: '', outcomeNotes: '', outcomeDate: '',
    }
  })
  const [errors, setErrors] = useState({})
  const handleConcernChange = (id) => {
    const c = concerns.find((x) => x.id === id)
    setForm((f) => ({ ...f, concernId: id, concernType: c?.category || f.concernType, patientIdentifier: c?.patientIdentifier || f.patientIdentifier }))
  }
  const validate = () => {
    const e = {}
    if (!form.referralDate) e.referralDate = true
    if (!form.referredTo.trim()) e.referredTo = true
    if (!form.concernType) e.concernType = true
    setErrors(e)
    return Object.keys(e).length === 0
  }
  const handleSave = async () => {
    if (!validate()) return
    if (isEdit) {
      setReferrals(referrals.map((r) => r.id === existing.id ? { ...r, ...form } : r))
      logAudit('Updated referral', existing.referralRef, 'Safeguarding', user?.name)
      toast('Referral updated', 'success')
    } else {
      const ref = generateRef('REF', referrals.map((r) => r.referralRef))
      setReferrals([...referrals, { id: generateId(), referralRef: ref, ...form, referredBy: user?.name || 'Unknown' }])
      logAudit('Created referral', ref, 'Safeguarding', user?.name)
      toast(`Referral ${ref} created`, 'success')
    }
    onClose()
  }
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const errClass = (field) => errors[field] ? inputClass.replace('border-ec-border', 'border-red-500') : inputClass
  const contactOptions = contacts.filter((c) => c.category === 'emergency' || c.concernTypes?.includes(form.concernType)).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))

  return (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] text-ec-t3 uppercase font-bold block mb-1">Linked Concern (optional)</label>
        <select value={form.concernId} onChange={(e) => handleConcernChange(e.target.value)} className={inputClass}>
          <option value="">None</option>
          {openConcerns.map((c) => <option key={c.id} value={c.id}>{c.concernRef} — {CONCERN_CATEGORIES[c.category]?.label}</option>)}
        </select>
      </div>
      <div>
        <label className="text-[10px] text-ec-t3 uppercase font-bold block mb-1">Referral Date *</label>
        <input type="date" value={form.referralDate} onChange={(e) => set('referralDate', e.target.value)} className={errClass('referralDate')} />
      </div>
      <div>
        <label className="text-[10px] text-ec-t3 uppercase font-bold block mb-1">Referred To *</label>
        <input type="text" list="contact-options" value={form.referredTo} onChange={(e) => set('referredTo', e.target.value)}
          placeholder="Type or select from contacts" className={errClass('referredTo')} />
        <datalist id="contact-options">{contactOptions.map((c) => <option key={c.id} value={c.name} />)}</datalist>
      </div>
      <div>
        <label className="text-[10px] text-ec-t3 uppercase font-bold block mb-1">Concern Type *</label>
        <select value={form.concernType} onChange={(e) => set('concernType', e.target.value)} className={errClass('concernType')}>
          <option value="">Select...</option>
          {Object.entries(CONCERN_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      <div>
        <label className="text-[10px] text-ec-t3 uppercase font-bold block mb-1">Patient Identifier</label>
        <input type="text" value={form.patientIdentifier} maxLength={20} onChange={(e) => set('patientIdentifier', e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="text-[10px] text-ec-t3 uppercase font-bold block mb-1">Consent</label>
        <select value={form.consentType} onChange={(e) => set('consentType', e.target.value)} className={inputClass}>
          <option value="">Select...</option>
          {CONSENT_TYPES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      {form.consentType && <div>
        <label className="text-[10px] text-ec-t3 uppercase font-bold block mb-1">Consent Notes</label>
        <input type="text" value={form.consentNotes} onChange={(e) => set('consentNotes', e.target.value)} className={inputClass} />
      </div>}
      <div>
        <label className="text-[10px] text-ec-t3 uppercase font-bold block mb-1">Reference Number (from receiving org)</label>
        <input type="text" value={form.referenceNumber} onChange={(e) => set('referenceNumber', e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="text-[10px] text-ec-t3 uppercase font-bold block mb-1">Description</label>
        <textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} className={inputClass} />
      </div>
      {isEdit && <>
        <div>
          <label className="text-[10px] text-ec-t3 uppercase font-bold block mb-1">Status</label>
          <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputClass}>
            {REFERRAL_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        {(form.status === 'completed' || form.status === 'withdrawn') && <div className="space-y-3">
          <div>
            <label className="text-[10px] text-ec-t3 uppercase font-bold block mb-1">Outcome</label>
            <input type="text" value={form.outcome} onChange={(e) => set('outcome', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-[10px] text-ec-t3 uppercase font-bold block mb-1">Outcome Notes</label>
            <textarea rows={2} value={form.outcomeNotes} onChange={(e) => set('outcomeNotes', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-[10px] text-ec-t3 uppercase font-bold block mb-1">Outcome Date</label>
            <input type="date" value={form.outcomeDate} onChange={(e) => set('outcomeDate', e.target.value)} className={inputClass} />
          </div>
        </div>}
      </>}
      <div className="flex gap-2 pt-2">
        <button onClick={handleSave} className={btnPrimary}>{isEdit ? 'Update' : 'Create Referral'}</button>
        <button onClick={onClose} className={btnSecondary}>Cancel</button>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────
// CONTACTS TAB
// ────────────────────────────────────────────
function ContactsTab({ contacts, loading, elevated, pharmacyRegion, openDrawer }) {
  const [catFilter, setCatFilter] = useState('all')
  const [searchQ, setSearchQ] = useState('')
  const [copiedId, setCopiedId] = useState(null)

  const filtered = useMemo(() => {
    let list = contacts.filter((c) => c.region === 'national' || c.region === pharmacyRegion || c.isCustom)
    if (catFilter !== 'all') list = list.filter((c) => c.category === catFilter)
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase()
      list = list.filter((c) => c.name?.toLowerCase().includes(q) || c.organisation?.toLowerCase().includes(q) || c.phone?.includes(q))
    }
    return list.sort((a, b) => {
      if (a.isEmergency && !b.isEmergency) return -1
      if (!a.isEmergency && b.isEmergency) return 1
      return (a.sortOrder || 0) - (b.sortOrder || 0)
    })
  }, [contacts, catFilter, searchQ, pharmacyRegion])

  const copyPhone = (id, phone) => { navigator.clipboard.writeText(phone); setCopiedId(id); setTimeout(() => setCopiedId(null), 1500) }

  if (loading) return <SkeletonLoader />

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        <button onClick={() => setCatFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-colors
            ${catFilter === 'all' ? 'bg-ec-em text-white border-ec-em' : 'bg-ec-card border-ec-border text-ec-t2 hover:bg-ec-card-hover'}`}>All</button>
        {Object.entries(CONTACT_CATEGORIES).map(([k, v]) => (
          <button key={k} onClick={() => setCatFilter(k)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-colors flex items-center gap-1.5
              ${catFilter === k ? 'text-white border-transparent' : 'bg-ec-card border-ec-border text-ec-t2 hover:bg-ec-card-hover'}`}
            style={catFilter === k ? { backgroundColor: v.color } : {}}>
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: catFilter === k ? '#fff' : v.color }} />
            {v.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 mb-4">
        <input type="text" placeholder="Search contacts..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)} className={inputClass + ' !w-64 !py-1.5 !text-xs'} />
        <div className="flex-1" />
        <span className="text-[10px] text-ec-t3">Showing: {pharmacyRegion.charAt(0).toUpperCase() + pharmacyRegion.slice(1)} + National</span>
        {elevated && <button onClick={() => openDrawer('new_contact')} className={btnSecondary}>+ Add Contact</button>}
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="No contacts found" description="Try adjusting your filters" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((c) => (
            <div key={c.id} className="bg-ec-card border border-ec-div rounded-xl p-4 ec-fadeup hover:shadow-sm transition-shadow"
              style={c.isEmergency ? { borderLeft: '3px solid var(--ec-crit)' } : {}}>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase text-white"
                  style={{ backgroundColor: CONTACT_CATEGORIES[c.category]?.color || 'var(--ec-t2)' }}>
                  {CONTACT_CATEGORIES[c.category]?.label || c.category}
                </span>
                {c.isEmergency && <span className="px-1.5 py-0.5 rounded bg-ec-crit-faint text-ec-crit font-bold text-[9px]">EMERGENCY</span>}
              </div>
              <h3 className="text-sm font-bold text-ec-t1 mb-0.5">{c.name}</h3>
              {c.organisation && <p className="text-[10px] text-ec-t3 mb-2">{c.organisation}</p>}
              {c.phone && (
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs text-ec-t1 font-mono font-semibold">{c.phone}</span>
                  {c.phoneSecondary && <span className="text-xs text-ec-t3">/ {c.phoneSecondary}</span>}
                  <button onClick={() => copyPhone(c.id, c.phone)}
                    className="bg-transparent border-none text-ec-t3 cursor-pointer p-0.5 hover:text-ec-em transition-colors" title="Copy phone">
                    {copiedId === c.id
                      ? <span className="text-[9px] text-ec-em font-bold">Copied!</span>
                      : <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="5" width="8" height="8" rx="1" /><path d="M3 11V3h8" /></svg>}
                  </button>
                </div>
              )}
              {c.openingHours && <p className="text-[10px] text-ec-t3 mb-1">{c.openingHours}</p>}
              {c.description && <p className="text-[10px] text-ec-t3 mt-2 line-clamp-3">{c.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ContactForm({ contacts, toast, onClose }) {
  const [form, setForm] = useState({
    name: '', organisation: '', phone: '', phoneSecondary: '', email: '', website: '',
    category: '', description: '', openingHours: '', region: 'tameside', isEmergency: false,
  })
  const handleSave = async () => {
    if (!form.name.trim() || !form.category) return
    const { error } = await supabase.from('safeguarding_contacts').insert({
      name: form.name, organisation: form.organisation, phone: form.phone, phone_secondary: form.phoneSecondary,
      email: form.email, website: form.website, category: form.category, concern_types: [],
      description: form.description, opening_hours: form.openingHours, region: form.region,
      is_emergency: form.isEmergency, is_custom: true, sort_order: 99,
    })
    if (error) { toast('Failed to add contact', 'error'); return }
    toast('Contact added', 'success')
    onClose()
  }
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  return (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] text-ec-t3 uppercase font-bold block mb-1">Name *</label>
        <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="text-[10px] text-ec-t3 uppercase font-bold block mb-1">Organisation</label>
        <input type="text" value={form.organisation} onChange={(e) => set('organisation', e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="text-[10px] text-ec-t3 uppercase font-bold block mb-1">Category *</label>
        <select value={form.category} onChange={(e) => set('category', e.target.value)} className={inputClass}>
          <option value="">Select...</option>
          {Object.entries(CONTACT_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-[10px] text-ec-t3 uppercase font-bold block mb-1">Phone</label>
          <input type="text" value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputClass} /></div>
        <div><label className="text-[10px] text-ec-t3 uppercase font-bold block mb-1">Secondary Phone</label>
          <input type="text" value={form.phoneSecondary} onChange={(e) => set('phoneSecondary', e.target.value)} className={inputClass} /></div>
      </div>
      <div>
        <label className="text-[10px] text-ec-t3 uppercase font-bold block mb-1">Opening Hours</label>
        <input type="text" value={form.openingHours} onChange={(e) => set('openingHours', e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="text-[10px] text-ec-t3 uppercase font-bold block mb-1">Description</label>
        <textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} className={inputClass} />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.isEmergency} onChange={(e) => set('isEmergency', e.target.checked)}
          className="w-4 h-4 rounded border-ec-border text-ec-em" />
        <span className="text-xs text-ec-t2">Emergency contact</span>
      </label>
      <div className="flex gap-2 pt-2">
        <button onClick={handleSave} className={btnPrimary}>Add Contact</button>
        <button onClick={onClose} className={btnSecondary}>Cancel</button>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────
// SIGNPOSTING TAB
// ────────────────────────────────────────────
function SignpostingTab({ resources, contacts, loading, pharmacyConfig }) {
  const [selectedCat, setSelectedCat] = useState(null)
  const [includePharmacy, setIncludePharmacy] = useState(true)
  const printRef = useRef(null)

  const resource = useMemo(() => resources.find((r) => r.category === selectedCat), [resources, selectedCat])
  const relatedContacts = useMemo(() => {
    if (!selectedCat) return []
    return contacts.filter((c) => c.concernTypes?.includes(selectedCat) || c.category === selectedCat)
      .sort((a, b) => { if (a.isEmergency && !b.isEmergency) return -1; if (!a.isEmergency && b.isEmergency) return 1; return (a.sortOrder || 0) - (b.sortOrder || 0) })
  }, [contacts, selectedCat])

  const handlePrint = () => {
    const el = printRef.current
    if (!el) return
    const printWin = window.open('', '_blank')
    if (!printWin) return
    const doc = printWin.document
    const style = doc.createElement('style')
    style.textContent = [
      'body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;padding:40px;color:var(--ec-t1);max-width:700px;margin:0 auto}',
      'h1{font-size:20px;border-bottom:2px solid var(--ec-em);padding-bottom:8px}',
      'h2{font-size:14px;color:var(--ec-em);margin-top:24px}',
      'p,li{font-size:12px;line-height:1.6}',
      'blockquote{border-left:3px solid var(--ec-em);padding-left:12px;font-style:italic;color:var(--ec-t1)}',
      '.pharmacy{margin-top:32px;padding-top:16px;border-top:1px solid var(--ec-t4);font-size:11px;color:var(--ec-t2)}',
    ].join('\n')
    doc.head.appendChild(style)
    doc.title = 'Signposting - ' + (resource?.title || '')
    // Clone the printable content (safe — it is our own rendered DOM)
    doc.body.appendChild(el.cloneNode(true))
    if (includePharmacy) {
      const pd = doc.createElement('div')
      pd.className = 'pharmacy'
      const b = doc.createElement('strong')
      b.textContent = pharmacyConfig?.pharmacyName || 'iPharmacy Direct'
      pd.appendChild(b)
      pd.appendChild(doc.createElement('br'))
      pd.appendChild(doc.createTextNode(pharmacyConfig?.address || ''))
      pd.appendChild(doc.createElement('br'))
      pd.appendChild(doc.createTextNode(pharmacyConfig?.phone || ''))
      doc.body.appendChild(pd)
    }
    printWin.print()
  }

  if (loading) return <SkeletonLoader />

  const categories = [
    { key: 'domestic_abuse', label: 'Domestic Abuse' }, { key: 'mental_health', label: 'Mental Health' },
    { key: 'child_concern', label: 'Child Concern' }, { key: 'adult_at_risk', label: 'Adult at Risk' },
    { key: 'substance_misuse', label: 'Substance Misuse' }, { key: 'general_vulnerability', label: 'General Vulnerability' },
  ]

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {categories.map((cat) => (
          <button key={cat.key} onClick={() => setSelectedCat(cat.key === selectedCat ? null : cat.key)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border cursor-pointer transition-all
              ${selectedCat === cat.key ? 'bg-ec-em/10 border-ec-em shadow-sm' : 'bg-ec-card border-ec-div hover:border-ec-em/30 hover:shadow-sm'}`}>
            <span className="text-2xl">{SIGNPOSTING_ICONS[cat.key] || '📋'}</span>
            <span className="text-xs font-semibold text-ec-t1">{cat.label}</span>
          </button>
        ))}
      </div>
      {resource && (
        <div className="bg-ec-card border border-ec-div rounded-xl p-5 ec-fadeup">
          <div ref={printRef}>
            <h1 className="text-base font-bold text-ec-t1 mb-4 flex items-center gap-2">
              <span className="text-xl">{SIGNPOSTING_ICONS[selectedCat]}</span>{resource.title}
            </h1>
            <h2 className="text-xs font-bold text-ec-em uppercase tracking-wide mb-2">About</h2>
            <p className="text-xs text-ec-t2 leading-relaxed mb-4">{resource.plainLanguageIntro}</p>
            <h2 className="text-xs font-bold text-ec-em uppercase tracking-wide mb-2">What to Say</h2>
            <blockquote className="border-l-[3px] border-ec-em pl-3 italic text-xs text-ec-t2 leading-relaxed mb-4">{resource.whatToSay}</blockquote>
            <h2 className="text-xs font-bold text-ec-em uppercase tracking-wide mb-2">Referral Pathway</h2>
            <div className="space-y-1.5 mb-4">
              {(resource.referralPathway || '').split('\n').filter(Boolean).map((line, i) => {
                const isImmediate = line.includes('IMMEDIATE') || line.includes('999')
                const isUrgent = line.includes('URGENT') || line.includes('HIGH RISK') || line.includes('CRISIS')
                return (
                  <div key={i} className="flex items-start gap-2 text-xs text-ec-t2">
                    <span className="shrink-0 mt-px">{isImmediate ? '🔴' : isUrgent ? '🟡' : '🟢'}</span>
                    <span>{line.replace(/^\d+\.\s*/, '')}</span>
                  </div>
                )
              })}
            </div>
            {relatedContacts.length > 0 && <>
              <h2 className="text-xs font-bold text-ec-em uppercase tracking-wide mb-2">Key Contacts</h2>
              <div className="space-y-2">
                {relatedContacts.slice(0, 6).map((c) => (
                  <div key={c.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-ec-div">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-ec-t1">{c.name}</div>
                      {c.organisation && <div className="text-[10px] text-ec-t3">{c.organisation}</div>}
                    </div>
                    {c.phone && <span className="text-xs font-mono font-semibold text-ec-t1 shrink-0">{c.phone}</span>}
                  </div>
                ))}
              </div>
            </>}
          </div>
          <div className="flex items-center gap-3 mt-5 pt-4 border-t border-ec-div">
            <button onClick={handlePrint} className={btnPrimary}>
              <span className="flex items-center gap-1.5">
                <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="4 6 4 1 12 1 12 6" /><path d="M4 12H2a1 1 0 01-1-1V7a1 1 0 011-1h12a1 1 0 011 1v4a1 1 0 01-1 1h-2" /><rect x="4" y="9" width="8" height="6" /></svg>
                Print Resource
              </span>
            </button>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={includePharmacy} onChange={(e) => setIncludePharmacy(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-ec-border text-ec-em" />
              <span className="text-[10px] text-ec-t3">Include pharmacy details on printout</span>
            </label>
          </div>
        </div>
      )}
      {!selectedCat && <p className="text-center text-xs text-ec-t3 mt-4">Select a category above to view signposting resources</p>}
    </div>
  )
}

// ────────────────────────────────────────────
// TRAINING TAB
// ────────────────────────────────────────────
function TrainingTab({ trainingLogs, staffMembers, loading }) {
  const sgTopics = ['Safeguarding Adults — Level 1', 'Safeguarding Children — Level 1']
  const staffNames = useMemo(() => (staffMembers || []).map((s) => s.name).filter(Boolean).sort(), [staffMembers])
  const matrix = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const soonDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
    return staffNames.map((name) => {
      const cells = sgTopics.map((topic) => {
        const records = trainingLogs.filter((l) => l.staffName === name && l.topic === topic)
        if (records.length === 0) return 'not_started'
        const latest = records.sort((a, b) => (b.dateCompleted || '').localeCompare(a.dateCompleted || ''))[0]
        if (!latest.certificateExpiry) return 'complete'
        if (latest.certificateExpiry < today) return 'overdue'
        if (latest.certificateExpiry <= soonDate) return 'due_soon'
        return 'complete'
      })
      return { name, cells }
    })
  }, [staffNames, trainingLogs])

  const cellColors = { complete: { bg: 'var(--ec-em-bg)', text: 'var(--ec-em-dark)' }, overdue: { bg: 'var(--ec-crit-border)', text: 'var(--ec-crit-dark)' }, due_soon: { bg: 'var(--ec-warn-bg)', text: 'var(--ec-warn-dark)' }, not_started: { bg: 'var(--ec-card-hover)', text: 'var(--ec-t2)' } }
  const cellLabels = { complete: 'Complete', overdue: 'Overdue', due_soon: 'Due Soon', not_started: '—' }

  if (loading) return <SkeletonLoader />

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-ec-t1">Safeguarding Training Overview</h3>
        <a href="#/training" className="text-xs text-ec-em hover:underline">To update records, go to Training Logs →</a>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="text-left py-2 px-3 border-b border-ec-div text-ec-t3 font-semibold">Staff</th>
              {sgTopics.map((t) => <th key={t} className="text-center py-2 px-3 border-b border-ec-div text-ec-t3 font-semibold whitespace-nowrap">{t}</th>)}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row) => (
              <tr key={row.name} className="hover:bg-ec-card-hover transition-colors">
                <td className="py-2 px-3 border-b border-ec-div text-ec-t1 font-medium">{row.name}</td>
                {row.cells.map((cell, i) => (
                  <td key={i} className="py-2 px-3 border-b border-ec-div text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ backgroundColor: cellColors[cell].bg, color: cellColors[cell].text }}>{cellLabels[cell]}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-3 mt-4">
        {Object.entries(cellLabels).filter(([k]) => k !== 'not_started').map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5 text-[10px] text-ec-t3">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: cellColors[k].bg }} />{v}
          </span>
        ))}
      </div>
    </div>
  )
}
