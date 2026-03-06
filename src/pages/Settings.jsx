import { useState, useRef, useEffect, useMemo } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import { supabase } from '../lib/supabase'
import { logAudit } from '../utils/auditLog'
import { DEFAULT_CLEANING_TASKS, FREQUENCIES, getTrafficLight, getSafeguardingStatus, getTaskStatus } from '../utils/helpers'
import { exportData, importData, clearAllData } from '../utils/dataManager'
import { downloadCsv } from '../utils/exportCsv'
import { useToast } from '../components/Toast'
import { useUser } from '../contexts/UserContext'
import { usePharmacyConfig } from '../hooks/usePharmacyConfig'
import { logout } from './Login'
import { useConfirm } from '../components/ConfirmDialog'
import { TASK_TEMPLATES as TASK_TEMPLATES_IMPORT, STAFF_ROLES, ROLE_LABELS } from '../utils/taskEngine'
import DashCardHeader from '../components/DashCardHeader'
import Avatar from '../components/Avatar'

// ─── Google Font injection ───
if (!document.getElementById('dm-fonts-link')) {
  const l = document.createElement('link')
  l.id = 'dm-fonts-link'
  l.rel = 'stylesheet'
  l.href = 'https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&display=swap'
  document.head.appendChild(l)
}

const DM = "'DM Sans', sans-serif"
const MONO = "'DM Mono', monospace"
const CARD = { background: 'var(--bg-card)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-card)' }

const TABS = [
  { id: 'staff', label: '👥 Staff' },
  { id: 'pharmacy', label: '🏥 Pharmacy' },
  { id: 'cleaning', label: '🧹 Cleaning' },
  { id: 'rp', label: '📋 RP & Tasks' },
  { id: 'templates', label: '📝 Task Templates' },
  { id: 'notifications', label: '🔔 Notifications' },
  { id: 'data', label: '📊 Data & Reports' },
]

const FREQ_LABELS = { daily: 'Daily', weekly: 'Weekly', fortnightly: 'Fortnightly', monthly: 'Monthly', annually: 'Annually' }

const DEFAULT_NOTIFICATION_PREFS = {
  documentExpiry: true,
  trainingOverdue: true,
  cleaningOverdue: true,
  safeguardingDue: true,
  temperatureMissing: true,
}

// ─── Shared input style ───
const inputStyle = {
  width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 12, fontFamily: DM,
  background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)',
  outline: 'none',
}
const labelStyle = { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }

// ─── Pill tab ───
function Pill({ active, label, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '4px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600, fontFamily: DM,
      border: active ? '1.5px solid #059669' : '1px solid var(--border-card)',
      background: active ? '#059669' : 'transparent',
      color: active ? '#fff' : 'var(--text-secondary)',
      cursor: 'pointer', transition: 'all 0.15s',
    }}>{label}</button>
  )
}

// ─── Toggle Switch ───
function Toggle({ checked, onChange, size = 'normal' }) {
  const w = size === 'small' ? 28 : 34
  const h = size === 'small' ? 16 : 18
  const dot = size === 'small' ? 12 : 14
  return (
    <button onClick={onChange} style={{
      width: w, height: h, borderRadius: h, padding: 2,
      background: checked ? '#059669' : '#d4d4d8',
      border: 'none', cursor: 'pointer', position: 'relative',
      transition: 'background 0.2s', flexShrink: 0,
    }}>
      <div style={{
        width: dot, height: dot, borderRadius: '50%', background: '#fff',
        transition: 'transform 0.2s',
        transform: checked ? `translateX(${w - dot - 4}px)` : 'translateX(0)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  )
}

// ─── Role pill ───
const ROLE_PILL_COLORS = {
  superintendent: { bg: '#fdf4ff', color: '#9333ea', border: '#e9d5ff' },
  manager: { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  pharmacist: { bg: '#fdf4ff', color: '#9333ea', border: '#e9d5ff' },
  technician: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  dispenser: { bg: '#f0fdf4', color: '#059669', border: '#d1fae5' },
  stock_assistant: { bg: '#fef9c3', color: '#a16207', border: '#fde68a' },
  driver: { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
  aca: { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  staff: { bg: '#f0fdf4', color: '#059669', border: '#d1fae5' },
}
const SETTINGS_ROLE_OPTIONS = [
  'superintendent', 'manager', 'pharmacist', 'technician',
  'dispenser', 'stock_assistant', 'driver', 'aca', 'staff',
]
const SETTINGS_ROLE_LABELS = {
  superintendent: 'Superintendent', manager: 'Manager', pharmacist: 'Pharmacist',
  technician: 'Technician', dispenser: 'Dispenser', stock_assistant: 'Stock Assistant',
  driver: 'Driver', aca: 'ACA', staff: 'Staff',
}

function RolePill({ role }) {
  const cfg = ROLE_PILL_COLORS[role] || ROLE_PILL_COLORS.staff
  const label = SETTINGS_ROLE_LABELS[role] || role || 'Staff'
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      textTransform: 'capitalize',
    }}>{label}</span>
  )
}

export default function Settings() {
  const [staffMembers, setStaffMembers] = useSupabase('staff_members', [])
  const [taskTemplates, setTaskTemplates] = useState(() => {
    const saved = localStorage.getItem('ipd_template_active_state')
    const overrides = saved ? JSON.parse(saved) : {}
    return TASK_TEMPLATES_IMPORT.map(t => ({ ...t, isActive: overrides[t.id] !== undefined ? overrides[t.id] : t.isActive }))
  })
  const { user, logout: logoutUser } = useUser()
  const [pharmacyConfig, updatePharmacyConfig] = usePharmacyConfig()
  const [pharmacyForm, setPharmacyForm] = useState(null)
  const [trainingTopics, setTrainingTopics] = useSupabase('training_topics', [], { valueField: 'name' })
  const [cleaningTasks, setCleaningTasks] = useSupabase('cleaning_tasks', DEFAULT_CLEANING_TASKS)
  const [documents] = useSupabase('documents', [])
  const [staffTraining] = useSupabase('staff_training', [])
  const [safeguarding] = useSupabase('safeguarding_records', [])
  const [cleaningEntries] = useSupabase('cleaning_entries', [])
  const [auditLogs] = useSupabase('audit_log', [])
  const [incidents] = useSupabase('incidents', [])
  const showToast = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  const [importMsg, setImportMsg] = useState(null)
  const [showAudit, setShowAudit] = useState(false)
  const fileRef = useRef(null)
  const [activeTab, setActiveTab] = useState('staff')
  const [backendStatus, setBackendStatus] = useState({ checking: true })
  const [notifPrefs, setNotifPrefs] = useState(() => {
    // Prefer Supabase data if available, fall back to localStorage
    if (pharmacyConfig.notificationPrefs) return pharmacyConfig.notificationPrefs
    try {
      return JSON.parse(localStorage.getItem('ipd_notification_prefs')) || DEFAULT_NOTIFICATION_PREFS
    } catch { return DEFAULT_NOTIFICATION_PREFS }
  })

  // Sync from Supabase when config loads
  useEffect(() => {
    if (pharmacyConfig.notificationPrefs) {
      setNotifPrefs(pharmacyConfig.notificationPrefs)
    }
  }, [pharmacyConfig.notificationPrefs])

  // Staff tab state
  const [staffName, setStaffName] = useState('')
  const [editPin, setEditPin] = useState(null)
  const [revealPin, setRevealPin] = useState({})
  const [showAddStaff, setShowAddStaff] = useState(false)

  // Training topics state
  const [topicValue, setTopicValue] = useState('')

  // Cleaning tab state
  const [newTaskName, setNewTaskName] = useState('')
  const [newTaskFreq, setNewTaskFreq] = useState('daily')
  const [collapsedFreqs, setCollapsedFreqs] = useState({})

  useEffect(() => {
    supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .then(({ error }) => {
        if (error) setBackendStatus({ ok: false, error: error.message })
        else setBackendStatus({ ok: true })
      })
  }, [])

  useEffect(() => {
    if (pharmacyConfig?.id) setPharmacyForm({ ...pharmacyConfig })
  }, [pharmacyConfig.id])

  // ─── Handlers (all preserved) ───
  const handleSavePharmacy = async () => {
    if (!pharmacyForm) return
    await updatePharmacyConfig(pharmacyForm)
    showToast('Pharmacy details saved')
  }

  const handleExport = async () => {
    await exportData()
    showToast('Backup exported')
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const count = await importData(file)
      showToast(`Restored ${count} data set${count !== 1 ? 's' : ''}`)
      setImportMsg({ type: 'success', text: `Restored ${count} data set${count !== 1 ? 's' : ''}. Reloading...` })
      setTimeout(() => window.location.reload(), 1200)
    } catch (err) {
      showToast(err.message, 'error')
      setImportMsg({ type: 'error', text: err.message })
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleClear = async () => {
    const ok = await confirm({
      title: 'Delete all data?',
      message: 'This will permanently delete ALL compliance data including documents, training records, cleaning logs, incidents, and more. This cannot be undone.',
      confirmLabel: 'Delete Everything',
      variant: 'danger',
    })
    if (!ok) return
    await clearAllData()
    logAudit('Deleted', 'All data cleared', 'Settings', user?.name)
    showToast('All data cleared', 'info')
    window.location.reload()
  }

  // Staff handlers
  const handleAddStaff = (e) => {
    e.preventDefault()
    const trimmed = staffName.trim()
    if (!trimmed || staffMembers.some(s => s.name === trimmed)) return
    setStaffMembers([...staffMembers, { name: trimmed, pin: '', isManager: false }])
    logAudit('Created', `Staff: ${trimmed}`, 'Settings', user?.name)
    setStaffName('')
    setShowAddStaff(false)
  }

  const handleRemoveStaff = (id) => {
    const member = staffMembers.find(s => s.id === id)
    setStaffMembers(staffMembers.filter(s => s.id !== id))
    logAudit('Deleted', `Staff: ${member?.name || id}`, 'Settings', user?.name)
  }

  const toggleManager = (id) => {
    setStaffMembers(staffMembers.map(s => s.id === id ? { ...s, isManager: !s.isManager } : s))
  }

  const savePin = (id) => {
    if (!editPin) return
    setStaffMembers(staffMembers.map(s => s.id === id ? { ...s, pin: editPin.pin } : s))
    showToast('PIN updated')
    setEditPin(null)
  }

  // Training topic handlers
  const handleAddTopic = (e) => {
    e.preventDefault()
    const trimmed = topicValue.trim()
    if (!trimmed || trainingTopics.includes(trimmed)) return
    setTrainingTopics([...trainingTopics, trimmed])
    logAudit('Created', `Training Topics: ${trimmed}`, 'Settings', user?.name)
    setTopicValue('')
  }

  const handleRemoveTopic = (item) => {
    setTrainingTopics(trainingTopics.filter(i => i !== item))
    logAudit('Deleted', `Training Topics: ${item}`, 'Settings', user?.name)
  }

  // Cleaning task handlers
  const handleAddTask = (e, freq) => {
    e.preventDefault()
    const trimmed = newTaskName.trim()
    if (!trimmed || cleaningTasks.some(t => t.name === trimmed)) return
    setCleaningTasks([...cleaningTasks, { name: trimmed, frequency: freq || newTaskFreq }])
    logAudit('Created', `Cleaning Task: ${trimmed}`, 'Settings', user?.name)
    setNewTaskName('')
  }

  const handleRemoveTask = (taskName) => {
    setCleaningTasks(cleaningTasks.filter(t => t.name !== taskName))
    logAudit('Deleted', `Cleaning Task: ${taskName}`, 'Settings', user?.name)
  }

  const handleFreqChange = (taskName, newFreq) => {
    setCleaningTasks(cleaningTasks.map(t => t.name === taskName ? { ...t, frequency: newFreq } : t))
  }

  // Grouped cleaning tasks
  const groupedTasks = useMemo(() => {
    return ['daily', 'weekly', 'fortnightly', 'monthly', 'annually'].map(freq => ({
      freq,
      label: FREQ_LABELS[freq] || freq,
      tasks: cleaningTasks.filter(t => t.frequency === freq),
    })).filter(g => g.tasks.length > 0 || ['daily', 'weekly', 'fortnightly', 'monthly'].includes(g.freq))
  }, [cleaningTasks])

  const toggleFreqCollapse = (freq) => setCollapsedFreqs(prev => ({ ...prev, [freq]: !prev[freq] }))

  // Dedup handler for data tab
  const handleDedup = () => {
    const cleanMap = new Map()
    cleaningEntries.forEach(e => {
      const key = `${e.taskName}|${e.dateTime}`
      const existing = cleanMap.get(key)
      if (!existing || new Date(e.createdAt) > new Date(existing.createdAt)) cleanMap.set(key, e)
    })
    const uniqueClean = [...cleanMap.values()]
    const trainMap = new Map()
    staffTraining.forEach(e => {
      const key = `${e.staffName}|${e.trainingItem}`
      const existing = trainMap.get(key)
      if (!existing || (e.id > existing.id)) trainMap.set(key, e)
    })
    const uniqueTrain = [...trainMap.values()]
    const docMap = new Map()
    documents.forEach(d => {
      const existing = docMap.get(d.documentName)
      if (!existing || new Date(d.createdAt) > new Date(existing.createdAt)) docMap.set(d.documentName, d)
    })
    const uniqueDocs = [...docMap.values()]
    const totalRemoved = (cleaningEntries.length - uniqueClean.length) + (staffTraining.length - uniqueTrain.length) + (documents.length - uniqueDocs.length)
    if (totalRemoved === 0) {
      showToast('No duplicates found')
    } else {
      logAudit('Deleted', `${totalRemoved} duplicate${totalRemoved !== 1 ? 's' : ''} removed`, 'Settings', user?.name)
      showToast(`Removed ${totalRemoved} duplicate${totalRemoved !== 1 ? 's' : ''}`)
      window.location.reload()
    }
  }

  // Weekly report handler
  const handleWeeklyReport = () => {
    const docGreen = documents.filter(d => getTrafficLight(d.expiryDate) === 'green').length
    const docPct = documents.length > 0 ? Math.round((docGreen / documents.length) * 100) : 100
    const trainPct = staffTraining.length > 0 ? Math.round((staffTraining.filter(e => e.status === 'Complete').length / staffTraining.length) * 100) : 100
    const seen = new Set()
    const uniqueTasks = cleaningTasks.filter(t => { if (seen.has(t.name)) return false; seen.add(t.name); return true })
    const cleanUpToDate = uniqueTasks.filter(t => { const s = getTaskStatus(t.name, t.frequency, cleaningEntries); return s === 'done' || s === 'upcoming' }).length
    const cleanPct = uniqueTasks.length > 0 ? Math.round((cleanUpToDate / uniqueTasks.length) * 100) : 100
    const sgCurrent = safeguarding.filter(r => getSafeguardingStatus(r.trainingDate) === 'current').length
    const sgPct = safeguarding.length > 0 ? Math.round((sgCurrent / safeguarding.length) * 100) : 100
    const weekIncidents = incidents.filter(i => new Date(i.createdAt) >= new Date(Date.now() - 7 * 864e5)).length
    const expiringDocs = documents.filter(d => getTrafficLight(d.expiryDate) !== 'green')
    const overdueTraining = staffTraining.filter(e => e.status === 'Pending').length
    const headers = ['Metric', 'Value']
    const rows = [
      ['Documents Compliance %', docPct], ['Training Compliance %', trainPct],
      ['Cleaning Compliance %', cleanPct], ['Safeguarding Compliance %', sgPct],
      ['Overall Compliance %', Math.round((docPct + trainPct + cleanPct + sgPct) / 4)],
      ['Incidents This Week', weekIncidents], ['Documents Expiring/Expired', expiringDocs.length],
      ['Training Overdue Count', overdueTraining],
    ]
    downloadCsv('weekly-compliance-report', headers, rows)
    showToast('Weekly report downloaded')
  }

  // ─── Small button helper ───
  const SmBtn = ({ children, onClick, variant = 'default', style: extra }) => {
    const base = { fontSize: 11, fontWeight: 500, fontFamily: DM, padding: '3px 10px', borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s', ...extra }
    if (variant === 'danger') return <button onClick={onClick} style={{ ...base, background: 'transparent', border: '1px solid #fecaca', color: '#dc2626' }}>{children}</button>
    if (variant === 'primary') return <button onClick={onClick} style={{ ...base, background: '#059669', border: 'none', color: '#fff' }}>{children}</button>
    return <button onClick={onClick} style={{ ...base, background: 'transparent', border: '1px solid var(--border-card)', color: 'var(--text-secondary)' }}>{children}</button>
  }

  // ─── Action card for Data tab ───
  const ActionCard = ({ icon, title, description, children }) => (
    <div style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{description}</div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>{children}</div>
    </div>
  )

  return (
    <div style={{ fontFamily: DM }}>
      {/* ─── PAGE HEADER ─── */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>Settings</h1>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>Configure your pharmacy, staff, and compliance preferences.</p>
      </div>

      {/* ─── TABS ─── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map(tab => (
          <Pill key={tab.id} label={tab.label} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} />
        ))}
      </div>

      {/* ─── TAB CONTENT ─── */}
      <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 220px)' }}>

        {/* ═══ TAB 1 — STAFF ═══ */}
        {activeTab === 'staff' && (
          <div>
            {/* Staff Members Card */}
            <div style={{ ...CARD, marginBottom: 14, overflow: 'hidden' }}>
              <DashCardHeader gradient="linear-gradient(90deg, #064e3b, #059669)" icon="👥" title="Staff Members" right={<span style={{ fontSize: 11, fontFamily: MONO }}>{staffMembers.length} members</span>} />

              {staffMembers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)', fontSize: 13 }}>No staff added yet.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                  {staffMembers.map(s => {
                    const pinRevealed = revealPin[s.id]
                    return (
                      <div key={s.id} style={{
                        background: 'var(--bg-card)', borderRadius: 12, padding: 14,
                        border: '1px solid var(--border-card)', position: 'relative',
                      }}>
                        {/* Avatar + name centered */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 8 }}>
                          <Avatar name={s.name} size={40} />
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 6, textAlign: 'center' }}>{s.name}</div>
                          <div style={{ fontSize: 10, fontFamily: MONO, color: 'var(--text-muted)', marginTop: 1 }}>
                            {s.name ? s.name.split(' ').map(w => w[0]).join('').toUpperCase() : '?'}
                          </div>
                          <div style={{ marginTop: 4 }}><RolePill role={s.role || STAFF_ROLES[s.name] || 'staff'} /></div>
                        </div>

                        {/* Role dropdown */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
                          <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>Role:</label>
                          <select
                            value={s.role || STAFF_ROLES[s.name] || 'staff'}
                            onChange={e => {
                              const newRole = e.target.value
                              const isManager = ['superintendent', 'manager'].includes(newRole)
                              setStaffMembers(staffMembers.map(m => m.id === s.id ? { ...m, role: newRole, isManager } : m))
                            }}
                            style={{ ...inputStyle, width: 'auto', padding: '3px 8px', fontSize: 11 }}
                          >
                            {SETTINGS_ROLE_OPTIONS.map(r => (
                              <option key={r} value={r}>{SETTINGS_ROLE_LABELS[r]}</option>
                            ))}
                          </select>
                        </div>

                        {/* PIN row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
                          {editPin?.id === s.id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <input
                                type="text"
                                maxLength={4}
                                pattern="[0-9]*"
                                inputMode="numeric"
                                placeholder="4 digits"
                                value={editPin.pin}
                                onChange={e => setEditPin({ ...editPin, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                                autoFocus
                                style={{ ...inputStyle, width: 60, textAlign: 'center', fontFamily: MONO, fontSize: 12, padding: '4px 6px' }}
                              />
                              <SmBtn variant="primary" onClick={() => savePin(s.id)} style={{ opacity: editPin.pin.length !== 4 ? 0.4 : 1 }}>Save</SmBtn>
                              <SmBtn onClick={() => setEditPin(null)}>✕</SmBtn>
                            </div>
                          ) : (
                            <>
                              <span style={{ fontSize: 11, fontFamily: MONO, color: 'var(--text-muted)' }}>
                                PIN: {s.pin ? (pinRevealed ? s.pin : '••••') : 'Not set'}
                              </span>
                              {s.pin && (
                                <button onClick={() => setRevealPin(prev => ({ ...prev, [s.id]: !prev[s.id] }))} style={{
                                  background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, padding: 0, color: 'var(--text-muted)',
                                }}>👁</button>
                              )}
                              <SmBtn onClick={() => setEditPin({ id: s.id, pin: s.pin || '' })}>{s.pin ? 'Change' : 'Set PIN'}</SmBtn>
                            </>
                          )}
                        </div>

                        {/* Manager badge + actions */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Toggle checked={!!s.isManager} onChange={() => toggleManager(s.id)} size="small" />
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Manager</span>
                          </div>
                          <SmBtn variant="danger" onClick={() => handleRemoveStaff(s.id)}>Remove</SmBtn>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Add staff toggle */}
              <div style={{ marginTop: 12 }}>
                {showAddStaff ? (
                  <form onSubmit={handleAddStaff} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Full name..."
                      value={staffName}
                      onChange={e => setStaffName(e.target.value)}
                      autoFocus
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <SmBtn variant="primary" onClick={handleAddStaff}>Add</SmBtn>
                    <SmBtn onClick={() => { setShowAddStaff(false); setStaffName('') }}>Cancel</SmBtn>
                  </form>
                ) : (
                  <button onClick={() => setShowAddStaff(true)} style={{
                    padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: DM,
                    background: '#059669', color: '#fff', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>＋ Add Staff Member</button>
                )}
              </div>
            </div>

            {/* Training Topics Card */}
            <div style={{ ...CARD, overflow: 'hidden' }}>
              <DashCardHeader gradient="linear-gradient(90deg, #1e40af, #3b82f6)" icon="📚" title="Training Topics" right={<span style={{ fontSize: 11, fontFamily: MONO }}>{trainingTopics.length}</span>} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {trainingTopics.length === 0 && (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>No topics added yet.</span>
                )}
                {trainingTopics.map(topic => (
                  <span key={topic} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 11, padding: '3px 10px', borderRadius: 20,
                    background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
                    fontWeight: 500,
                  }}>
                    {topic}
                    <button onClick={() => handleRemoveTopic(topic)} style={{
                      background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb',
                      fontSize: 12, padding: 0, lineHeight: 1, opacity: 0.6,
                    }}>×</button>
                  </span>
                ))}
              </div>
              <form onSubmit={handleAddTopic} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Add new topic..."
                  value={topicValue}
                  onChange={e => setTopicValue(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <SmBtn variant="primary" onClick={handleAddTopic}>Add</SmBtn>
              </form>
            </div>
          </div>
        )}

        {/* ═══ TAB 2 — PHARMACY ═══ */}
        {activeTab === 'pharmacy' && (
          <div style={{ ...CARD, overflow: 'hidden' }}>
            <DashCardHeader gradient="linear-gradient(90deg, #064e3b, #059669)" icon="🏥" title="Pharmacy Details" />
            {pharmacyForm ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { key: 'pharmacyName', label: 'Pharmacy Name' },
                    { key: 'address', label: 'Address' },
                    { key: 'superintendent', label: 'Superintendent' },
                    { key: 'rpName', label: 'Responsible Pharmacist' },
                    { key: 'gphcNumber', label: 'GPhC Number' },
                    { key: 'phone', label: 'Phone' },
                    { key: 'email', label: 'Email' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label style={labelStyle}>{label}</label>
                      <input
                        type="text"
                        style={inputStyle}
                        value={pharmacyForm[key] || ''}
                        onChange={e => setPharmacyForm({ ...pharmacyForm, [key]: e.target.value })}
                        placeholder={label}
                      />
                    </div>
                  ))}
                </div>
                <button onClick={handleSavePharmacy} style={{
                  marginTop: 14, padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: DM,
                  background: '#059669', color: '#fff', border: 'none', cursor: 'pointer',
                }}>Save Pharmacy Details</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  ['Pharmacy Name', pharmacyConfig.pharmacyName],
                  ['Superintendent', pharmacyConfig.superintendent],
                  ['Responsible Pharmacist', pharmacyConfig.rpName],
                  ['Address', pharmacyConfig.address],
                  ['GPhC Number', pharmacyConfig.gphcNumber],
                  ['Phone', pharmacyConfig.phone],
                  ['Email', pharmacyConfig.email],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span style={labelStyle}>{label}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{value || '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ TAB 3 — CLEANING ═══ */}
        {activeTab === 'cleaning' && (
          <div style={{ ...CARD, overflow: 'hidden' }}>
            <DashCardHeader gradient="linear-gradient(90deg, #064e3b, #047857)" icon="🧹" title="Cleaning Task Templates" right={<span style={{ fontSize: 11, fontFamily: MONO }}>{cleaningTasks.length} tasks</span>} />

            {groupedTasks.map(group => {
              const isCollapsed = collapsedFreqs[group.freq]
              return (
                <div key={group.freq} style={{ marginBottom: 14 }}>
                  {/* Section header */}
                  <button onClick={() => toggleFreqCollapse(group.freq)} style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 0',
                    background: 'none', border: 'none', cursor: 'pointer', fontFamily: DM,
                  }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                      color: 'var(--text-muted)',
                    }}>{group.label}</span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '1px 8px', borderRadius: 10,
                      background: 'var(--border-card)', color: 'var(--text-secondary)',
                    }}>{group.tasks.length}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)', transition: 'transform 0.2s', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0)' }}>▼</span>
                  </button>

                  {!isCollapsed && (
                    <>
                      {group.tasks.map(task => (
                        <div key={task.name} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 12px', borderRadius: 8, marginBottom: 4,
                          background: 'var(--bg-card)', border: '1px solid var(--border-card)',
                        }}>
                          <span style={{ color: 'var(--text-muted)', cursor: 'grab', fontSize: 14, flexShrink: 0, userSelect: 'none' }}>⠿</span>
                          <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{task.name}</span>
                          <select
                            value={task.frequency}
                            onChange={e => handleFreqChange(task.name, e.target.value)}
                            style={{
                              fontSize: 11, padding: '3px 8px', borderRadius: 6, fontFamily: DM,
                              background: 'var(--input-bg)', border: '1px solid var(--border-card)',
                              color: 'var(--text-primary)', cursor: 'pointer',
                            }}
                          >
                            {FREQUENCIES.map(f => <option key={f} value={f}>{FREQ_LABELS[f] || f}</option>)}
                          </select>
                          <button onClick={() => handleRemoveTask(task.name)} style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--text-muted)', fontSize: 16, padding: 0, lineHeight: 1,
                          }}>×</button>
                        </div>
                      ))}

                      {/* Inline add for this frequency */}
                      <form onSubmit={e => handleAddTask(e, group.freq)} style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                        <input
                          type="text"
                          placeholder={`Add ${group.label.toLowerCase()} task...`}
                          value={newTaskName}
                          onChange={e => setNewTaskName(e.target.value)}
                          style={{ ...inputStyle, flex: 1, fontSize: 11, padding: '5px 10px' }}
                        />
                        <SmBtn variant="primary" onClick={e => handleAddTask(e, group.freq)}>Add</SmBtn>
                      </form>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ═══ TAB 4 — RP & TASKS ═══ */}
        {activeTab === 'rp' && (
          <div>
            {/* RP Rotation */}
            <div style={{ ...CARD, marginBottom: 14, overflow: 'hidden' }}>
              <DashCardHeader gradient="linear-gradient(90deg, #064e3b, #059669)" icon="⚕" title="RP Rotation" />
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                Configure which pharmacists are responsible for RP duties and their assigned days.
              </div>
              {staffMembers.filter(s => s.isManager || s.name === 'Amjid Shakoor').map(s => (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 8, marginBottom: 4,
                  background: 'var(--bg-card)', border: '1px solid var(--border-card)',
                }}>
                  <Avatar name={s.name} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Responsible Pharmacist</div>
                  </div>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <span key={day} style={{
                        fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 6,
                        background: '#f0fdf4', color: '#059669', border: '1px solid #d1fae5',
                        cursor: 'pointer',
                      }}>{day}</span>
                    ))}
                  </div>
                </div>
              ))}
              {staffMembers.filter(s => s.isManager || s.name === 'Amjid Shakoor').length === 0 && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', padding: 12 }}>
                  No managers configured. Mark staff as "Manager" in the Staff tab to set up RP rotation.
                </div>
              )}
            </div>

            {/* Default Shift Tasks */}
            <div style={{ ...CARD, overflow: 'hidden' }}>
              <DashCardHeader gradient="linear-gradient(90deg, #0f766e, #14b8a6)" icon="📋" title="Default Shift Tasks" />
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                These tasks appear on the Dashboard shift checklist. Configure the default task set for daily operations.
              </div>
              {[
                { section: 'Time-Sensitive', tasks: [
                  { name: 'Temperature Log', time: '09:00', priority: 'HIGH' },
                  { name: 'Daily RP Checks', time: '10:00', priority: 'HIGH' },
                ]},
                { section: 'Anytime', tasks: [
                  { name: 'Dispensary Clean', priority: 'MED' },
                  { name: 'Counter & Surfaces Wipe', priority: 'MED' },
                ]},
              ].map(group => (
                <div key={group.section} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6 }}>{group.section}</div>
                  {group.tasks.map(task => (
                    <div key={task.name} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 8, marginBottom: 4,
                      background: 'var(--bg-card)', border: '1px solid var(--border-card)',
                    }}>
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{task.name}</span>
                      {task.time && (
                        <span style={{ fontSize: 10, fontFamily: MONO, color: 'var(--text-muted)', padding: '2px 6px', borderRadius: 4, background: 'var(--border-card)' }}>⏱ {task.time}</span>
                      )}
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 10,
                        background: task.priority === 'HIGH' ? '#fef2f2' : '#fffbeb',
                        color: task.priority === 'HIGH' ? '#dc2626' : '#d97706',
                        border: `1px solid ${task.priority === 'HIGH' ? '#fecaca' : '#fde68a'}`,
                      }}>{task.priority}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ TAB — TASK TEMPLATES ═══ */}
        {activeTab === 'templates' && (
          <div style={{ ...CARD, overflow: 'hidden' }}>
            <DashCardHeader gradient="linear-gradient(90deg, #7c3aed, #a78bfa)" icon="📝" title="Task Templates" right={<span style={{ fontSize: 11, fontFamily: MONO }}>{taskTemplates.length} templates</span>} />

            {taskTemplates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)', fontSize: 13 }}>No task templates found. Re-seed to restore defaults.</div>
            ) : (
              <div>
                {['opening', 'clinical', 'dispensary', 'stock', 'compliance', 'closing', 'admin'].map(cat => {
                  const catTemplates = taskTemplates.filter(t => t.category === cat)
                  if (catTemplates.length === 0) return null
                  const catLabels = { opening: 'Opening', clinical: 'Clinical', dispensary: 'Dispensary', stock: 'Stock', compliance: 'Compliance', closing: 'Closing', admin: 'Admin & H&S' }
                  return (
                    <div key={cat} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 0 4px' }}>
                        {catLabels[cat] || cat} ({catTemplates.length})
                      </div>
                      {catTemplates.map(t => (
                        <div key={t.id} style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px',
                          borderBottom: '1px solid var(--border-card)',
                        }}>
                          <Toggle
                            checked={t.isActive !== false}
                            onChange={() => {
                              const updated = taskTemplates.map(x => x.id === t.id ? { ...x, isActive: !x.isActive } : x)
                              setTaskTemplates(updated)
                              const overrides = {}
                              updated.forEach(x => { overrides[x.id] = x.isActive })
                              localStorage.setItem('ipd_template_active_state', JSON.stringify(overrides))
                            }}
                            size="small"
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 12, fontWeight: 600, color: t.isActive !== false ? 'var(--text-primary)' : 'var(--text-muted)',
                              textDecoration: t.isActive === false ? 'line-through' : 'none',
                            }}>{t.name}</div>
                            {t.description && (
                              <div style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</div>
                            )}
                          </div>
                          <span style={{
                            fontSize: 9, fontWeight: 600, padding: '1px 7px', borderRadius: 20,
                            background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
                            textTransform: 'capitalize',
                          }}>{t.frequency}</span>
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 20,
                            fontFamily: MONO, letterSpacing: '0.05em', textTransform: 'uppercase',
                            ...(t.priority === 'urgent' ? { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' } :
                               t.priority === 'high' ? { background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa' } :
                               t.priority === 'normal' ? { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' } :
                               { background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }),
                          }}>{t.priority}</span>
                          {t.applicableRoles && (
                            <span style={{ fontSize: 9, color: 'var(--text-muted)' }} title={t.applicableRoles.join(', ')}>
                              {t.applicableRoles.length} roles
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ TAB 5 — NOTIFICATIONS ═══ */}
        {activeTab === 'notifications' && (
          <div style={{ ...CARD, overflow: 'hidden' }}>
            <DashCardHeader gradient="linear-gradient(90deg, #92400e, #d97706)" icon="🔔" title="Notification Preferences" />
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
              Control which alerts appear in the sidebar and dashboard.
            </div>
            {[
              { section: 'Document Expiry', items: [
                { key: 'documentExpiry', label: 'Document expiry alerts', desc: 'Show warnings when documents are about to expire or have expired' },
              ]},
              { section: 'Cleaning Reminders', items: [
                { key: 'cleaningOverdue', label: 'Cleaning overdue alerts', desc: 'Alert when cleaning tasks are past their scheduled date' },
              ]},
              { section: 'Training', items: [
                { key: 'trainingOverdue', label: 'Training overdue alerts', desc: 'Notify when staff training records are overdue for renewal' },
                { key: 'safeguardingDue', label: 'Safeguarding due alerts', desc: 'Alert when safeguarding certificates are approaching expiry' },
              ]},
              { section: 'Other', items: [
                { key: 'temperatureMissing', label: 'Temperature log reminders', desc: 'Remind when daily temperature readings have not been recorded' },
              ]},
            ].map(group => (
              <div key={group.section} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>{group.section}</div>
                {group.items.map(({ key, label, desc }) => (
                  <div key={key} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', borderRadius: 8, marginBottom: 4,
                    background: 'var(--bg-card)', border: '1px solid var(--border-card)',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{desc}</div>
                    </div>
                    <Toggle checked={!!notifPrefs[key]} onChange={() => {
                      const updated = { ...notifPrefs, [key]: !notifPrefs[key] }
                      setNotifPrefs(updated)
                      localStorage.setItem('ipd_notification_prefs', JSON.stringify(updated))
                      updatePharmacyConfig({ notificationPrefs: updated })
                      showToast('Preference saved')
                    }} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ═══ TAB 6 — DATA & REPORTS ═══ */}
        {activeTab === 'data' && (
          <div>
            <div style={{ ...CARD, marginBottom: 14, overflow: 'hidden' }}>
              <DashCardHeader gradient="linear-gradient(90deg, #475569, #64748b)" icon="📊" title="Data & Reports" />

              {/* Backend status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, padding: '6px 10px', borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: backendStatus.checking ? '#71717a' : backendStatus.ok ? '#059669' : '#ef4444',
                  boxShadow: backendStatus.ok ? '0 0 0 3px rgba(5,150,105,0.15)' : 'none',
                }} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {backendStatus.checking ? 'Checking backend…' : backendStatus.ok ? 'Backend connected' : `Backend not connected — ${backendStatus.error}`}
                </span>
              </div>

              <ActionCard icon="💾" title="Export Backup" description="Download a JSON backup of all compliance data">
                <SmBtn variant="primary" onClick={handleExport}>Export</SmBtn>
              </ActionCard>

              <ActionCard icon="📥" title="Import Backup" description="Restore data from a previous JSON backup">
                <SmBtn onClick={() => fileRef.current?.click()}>Import</SmBtn>
                <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
              </ActionCard>

              <ActionCard icon="🧹" title="Delete Duplicates" description="Scan and remove duplicate cleaning, training, and document entries">
                <SmBtn onClick={handleDedup}>Scan</SmBtn>
              </ActionCard>

              <ActionCard icon="🗑️" title="Clear All Data" description="Permanently delete ALL compliance data. This cannot be undone.">
                <SmBtn variant="danger" onClick={handleClear}>Clear All</SmBtn>
              </ActionCard>

              {importMsg && (
                <div style={{ fontSize: 12, color: importMsg.type === 'success' ? '#059669' : '#dc2626', marginTop: 8 }}>{importMsg.text}</div>
              )}

              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-card)' }}>
                <ActionCard icon="🚪" title="Log Out" description="Sign out and return to the login screen">
                  <SmBtn onClick={() => { logoutUser(); logout(); window.location.reload() }}>Log Out</SmBtn>
                </ActionCard>
              </div>
            </div>

            {/* Weekly Report Card */}
            <div style={{ ...CARD, marginBottom: 14, overflow: 'hidden' }}>
              <DashCardHeader gradient="linear-gradient(90deg, #1e40af, #3b82f6)" icon="📋" title="Weekly Compliance Report" />
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                Generate a CSV summary of this week's compliance scores, incidents, expiring documents, and overdue training.
              </div>
              <button onClick={handleWeeklyReport} style={{
                padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: DM,
                background: '#059669', color: '#fff', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                Generate Weekly Report
              </button>
            </div>

            {/* Audit Trail Card */}
            <div style={{ ...CARD, overflow: 'hidden' }}>
              <DashCardHeader gradient="linear-gradient(90deg, #475569, #64748b)" icon="📝" title="Audit Trail" />
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                View a log of all actions performed in the system.
              </div>
              <SmBtn onClick={() => setShowAudit(!showAudit)}>{showAudit ? 'Hide Audit Trail' : 'Show Audit Trail'}</SmBtn>
              {showAudit && (
                <div style={{ marginTop: 10, maxHeight: 300, overflowY: 'auto', borderRadius: 8, border: '1px solid var(--border-card)' }}>
                  {auditLogs.length === 0 ? (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: 16, textAlign: 'center' }}>No audit entries yet.</div>
                  ) : (
                    <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', fontFamily: DM }}>
                      <thead>
                        <tr>
                          {['Timestamp', 'Action', 'Item', 'User', 'Page'].map(h => (
                            <th key={h} style={{ textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', padding: '8px 10px', borderBottom: '1px solid var(--border-card)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[...auditLogs].sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt)).slice(0, 50).map(log => (
                          <tr key={log.id}>
                            <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border-card)', color: 'var(--text-secondary)', fontFamily: MONO, fontSize: 10 }}>{new Date(log.timestamp || log.createdAt).toLocaleString('en-GB')}</td>
                            <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border-card)', color: 'var(--text-primary)' }}>{log.action}</td>
                            <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border-card)', color: 'var(--text-primary)' }}>{log.itemName}</td>
                            <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border-card)', color: 'var(--text-secondary)' }}>{log.userName || '—'}</td>
                            <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--border-card)', color: 'var(--text-secondary)' }}>{log.page || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {ConfirmDialog}
    </div>
  )
}
