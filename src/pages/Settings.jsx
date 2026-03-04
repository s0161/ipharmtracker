import { useState, useRef, useEffect } from 'react'
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

const inputClass = "w-full bg-ec-card border border-ec-border rounded-lg px-3 py-2 text-sm text-ec-t1 placeholder:text-ec-t3 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors font-sans"

function ListManager({ title, description, items, onUpdate, userName }) {
  const [value, setValue] = useState('')

  const handleAdd = (e) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || items.includes(trimmed)) return
    onUpdate([...items, trimmed])
    logAudit('Created', `${title}: ${trimmed}`, 'Settings', userName)
    setValue('')
  }

  const handleRemove = (item) => {
    onUpdate(items.filter((i) => i !== item))
    logAudit('Deleted', `${title}: ${item}`, 'Settings', userName)
  }

  return (
    <div
      className="rounded-2xl p-5 mb-4"
      style={{ backgroundColor: 'var(--ec-card)', border: '1px solid var(--ec-border)' }}
    >
      <h2 className="text-base font-bold text-ec-t1 mb-1">{title}</h2>
      <p className="text-sm text-ec-t3 mb-4">{description}</p>
      <form className="flex gap-2 mb-4" onSubmit={handleAdd}>
        <input
          type="text"
          className={inputClass}
          placeholder={`Add new ${title.toLowerCase().replace(/s$/, '')}...`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button type="submit" className="px-4 py-2 bg-ec-em text-white font-semibold rounded-lg text-sm border-none cursor-pointer hover:bg-ec-em-dark transition-colors shrink-0 font-sans">
          Add
        </button>
      </form>
      {items.length === 0 ? (
        <p className="text-sm text-ec-t3 py-4">No items added yet.</p>
      ) : (
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-ec-card transition-colors">
              <span className="text-sm text-ec-t1">{item}</span>
              <button
                className="w-7 h-7 rounded-lg flex items-center justify-center bg-ec-card-hover text-ec-t3 hover:bg-ec-crit/10 hover:text-ec-crit-light transition-colors border-none cursor-pointer shrink-0"
                onClick={() => handleRemove(item)}
                aria-label={`Remove ${item}`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  width="16"
                  height="16"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function StaffManager({ staff, onUpdate, showToast, userName }) {
  const [name, setName] = useState('')
  const [editPin, setEditPin] = useState(null) // { id, pin }

  const handleAdd = (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || staff.some((s) => s.name === trimmed)) return
    onUpdate([...staff, { name: trimmed, pin: '', isManager: false }])
    logAudit('Created', `Staff: ${trimmed}`, 'Settings', userName)
    setName('')
  }

  const handleRemove = (id) => {
    const member = staff.find((s) => s.id === id)
    onUpdate(staff.filter((s) => s.id !== id))
    logAudit('Deleted', `Staff: ${member?.name || id}`, 'Settings', userName)
  }

  const toggleManager = (id) => {
    onUpdate(
      staff.map((s) => (s.id === id ? { ...s, isManager: !s.isManager } : s))
    )
  }

  const savePin = (id) => {
    if (!editPin) return
    onUpdate(
      staff.map((s) => (s.id === id ? { ...s, pin: editPin.pin } : s))
    )
    showToast('PIN updated')
    setEditPin(null)
  }

  return (
    <div
      className="rounded-2xl p-5 mb-4"
      style={{ backgroundColor: 'var(--ec-card)', border: '1px solid var(--ec-border)' }}
    >
      <h2 className="text-base font-bold text-ec-t1 mb-1">Staff Members</h2>
      <p className="text-sm text-ec-t3 mb-4">
        Manage staff, set PINs, and assign manager roles.
      </p>
      <form className="flex gap-2 mb-4" onSubmit={handleAdd}>
        <input
          type="text"
          className={inputClass}
          placeholder="Add new staff member..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" className="px-4 py-2 bg-ec-em text-white font-semibold rounded-lg text-sm border-none cursor-pointer hover:bg-ec-em-dark transition-colors shrink-0 font-sans">Add</button>
      </form>
      {staff.length === 0 ? (
        <p className="text-sm text-ec-t3 py-4">No staff added yet.</p>
      ) : (
        <ul className="space-y-1">
          {staff.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-ec-card transition-colors">
              <div className="flex-1 min-w-0">
                <span className="text-sm text-ec-t1 font-medium block">{s.name}</span>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <label className="flex items-center gap-1.5 text-xs text-ec-t2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-ec-em"
                      checked={!!s.isManager}
                      onChange={() => toggleManager(s.id)}
                    />
                    <span>Manager</span>
                  </label>
                  {editPin?.id === s.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        className="w-20 bg-ec-card border border-ec-border rounded-lg px-2 py-1 text-sm text-ec-t1 focus:outline-none focus:border-ec-em/40 transition-colors font-sans text-center"
                        maxLength={4}
                        pattern="[0-9]*"
                        inputMode="numeric"
                        placeholder="4 digits"
                        value={editPin.pin}
                        onChange={(e) =>
                          setEditPin({ ...editPin, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })
                        }
                        autoFocus
                      />
                      <button
                        className="px-2.5 py-1 bg-ec-em text-white rounded-lg text-xs border-none cursor-pointer hover:bg-ec-em-dark transition-colors font-sans disabled:opacity-40"
                        onClick={() => savePin(s.id)}
                        disabled={editPin.pin.length !== 4}
                      >
                        Save
                      </button>
                      <button
                        className="px-2.5 py-1 bg-ec-card-hover text-ec-t2 rounded-lg text-xs border border-ec-border cursor-pointer hover:bg-ec-t5 hover:text-ec-t1 transition-colors font-sans"
                        onClick={() => setEditPin(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className="px-2.5 py-1 bg-ec-card-hover text-ec-t2 rounded-lg text-xs border border-ec-border cursor-pointer hover:bg-ec-t5 hover:text-ec-t1 transition-colors font-sans"
                      onClick={() => setEditPin({ id: s.id, pin: s.pin || '' })}
                    >
                      {s.pin ? 'Change PIN' : 'Set PIN'}
                    </button>
                  )}
                </div>
              </div>
              <button
                className="w-7 h-7 rounded-lg flex items-center justify-center bg-ec-card-hover text-ec-t3 hover:bg-ec-crit/10 hover:text-ec-crit-light transition-colors border-none cursor-pointer shrink-0"
                onClick={() => handleRemove(s.id)}
                aria-label={`Remove ${s.name}`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function TaskManager({ tasks, onUpdate, userName }) {
  const [name, setName] = useState('')
  const [frequency, setFrequency] = useState('daily')

  const handleAdd = (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || tasks.some((t) => t.name === trimmed)) return
    onUpdate([...tasks, { name: trimmed, frequency }])
    logAudit('Created', `Cleaning Task: ${trimmed}`, 'Settings', userName)
    setName('')
    setFrequency('daily')
  }

  const handleRemove = (taskName) => {
    onUpdate(tasks.filter((t) => t.name !== taskName))
    logAudit('Deleted', `Cleaning Task: ${taskName}`, 'Settings', userName)
  }

  const handleFreqChange = (taskName, newFreq) => {
    onUpdate(tasks.map((t) => (t.name === taskName ? { ...t, frequency: newFreq } : t)))
  }

  return (
    <div
      className="rounded-2xl p-5 mb-4"
      style={{ backgroundColor: 'var(--ec-card)', border: '1px solid var(--ec-border)' }}
    >
      <h2 className="text-base font-bold text-ec-t1 mb-1">Cleaning Tasks</h2>
      <p className="text-sm text-ec-t3 mb-4">
        Manage cleaning tasks and how often they need doing. The &lsquo;Other&rsquo; option is always available.
      </p>
      <form className="flex gap-2 mb-4" onSubmit={handleAdd}>
        <input
          type="text"
          className={inputClass}
          placeholder="Add new task..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select
          className="bg-ec-card border border-ec-border rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none transition-colors font-sans"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
        >
          {FREQUENCIES.map((f) => (
            <option key={f} value={f}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </option>
          ))}
        </select>
        <button type="submit" className="px-4 py-2 bg-ec-em text-white font-semibold rounded-lg text-sm border-none cursor-pointer hover:bg-ec-em-dark transition-colors shrink-0 font-sans">
          Add
        </button>
      </form>
      {tasks.length === 0 ? (
        <p className="text-sm text-ec-t3 py-4">No tasks added yet.</p>
      ) : (
        <ul className="space-y-1">
          {tasks.map((task) => (
            <li key={task.name} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-ec-card transition-colors">
              <span className="text-sm text-ec-t1">{task.name}</span>
              <div className="flex items-center gap-2">
                <select
                  className="bg-ec-card border border-ec-border rounded-lg px-2 py-1 text-xs text-ec-t1 focus:outline-none transition-colors font-sans"
                  value={task.frequency}
                  onChange={(e) => handleFreqChange(task.name, e.target.value)}
                >
                  {FREQUENCIES.map((f) => (
                    <option key={f} value={f}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </option>
                  ))}
                </select>
                <button
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-ec-card-hover text-ec-t3 hover:bg-ec-crit/10 hover:text-ec-crit-light transition-colors border-none cursor-pointer shrink-0"
                  onClick={() => handleRemove(task.name)}
                  aria-label={`Remove ${task.name}`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    width="16"
                    height="16"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const DEFAULT_NOTIFICATION_PREFS = {
  documentExpiry: true,
  trainingOverdue: true,
  cleaningOverdue: true,
  safeguardingDue: true,
  temperatureMissing: true,
}

export default function Settings() {
  const [staffMembers, setStaffMembers] = useSupabase('staff_members', [])
  const { user, logout: logoutUser } = useUser()
  const [pharmacyConfig, updatePharmacyConfig] = usePharmacyConfig()
  const [pharmacyForm, setPharmacyForm] = useState(null)
  const [trainingTopics, setTrainingTopics] = useSupabase('training_topics', [], { valueField: 'name' })
  const [cleaningTasks, setCleaningTasks] = useSupabase(
    'cleaning_tasks',
    DEFAULT_CLEANING_TASKS
  )
  const [documents] = useSupabase('documents', [])
  const [staffTraining] = useSupabase('staff_training', [])
  const [safeguarding] = useSupabase('safeguarding_records', [])
  const [cleaningEntries] = useSupabase('cleaning_entries', [])
  const [auditLogs] = useSupabase('audit_log', [])
  const [incidents] = useSupabase('incidents', [])
  const showToast = useToast()
  const [importMsg, setImportMsg] = useState(null)
  const [showAudit, setShowAudit] = useState(false)
  const fileRef = useRef(null)
  const [backendStatus, setBackendStatus] = useState({ checking: true })
  const [notifPrefs, setNotifPrefs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ipd_notification_prefs')) || DEFAULT_NOTIFICATION_PREFS
    } catch { return DEFAULT_NOTIFICATION_PREFS }
  })

  useEffect(() => {
    supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .then(({ error }) => {
        if (error) {
          setBackendStatus({ ok: false, error: error.message })
        } else {
          setBackendStatus({ ok: true })
        }
      })
  }, [])

  useEffect(() => {
    if (pharmacyConfig?.id) setPharmacyForm({ ...pharmacyConfig })
  }, [pharmacyConfig.id])

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
    if (!window.confirm('Are you sure you want to delete ALL data? This cannot be undone.')) return
    if (!window.confirm('This is your final warning. All compliance data will be permanently deleted. Continue?')) return
    await clearAllData()
    logAudit('Deleted', 'All data cleared', 'Settings', user?.name)
    showToast('All data cleared', 'info')
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      <StaffManager
        staff={staffMembers}
        onUpdate={setStaffMembers}
        showToast={showToast}
        userName={user?.name}
      />
      <ListManager
        title="Training Topics"
        description="Manage the list of training topics available when logging training entries."
        items={trainingTopics}
        onUpdate={setTrainingTopics}
        userName={user?.name}
      />
      <TaskManager tasks={cleaningTasks} onUpdate={setCleaningTasks} userName={user?.name} />

      {/* Pharmacy Details */}
      <div
        className="rounded-2xl p-5 mb-4"
        style={{ backgroundColor: 'var(--ec-card)', border: '1px solid var(--ec-border)' }}
      >
        <h2 className="text-base font-bold text-ec-t1 mb-1">Pharmacy Details</h2>
        <p className="text-sm text-ec-t3 mb-4">
          Core pharmacy information stored in your database.
        </p>
        {pharmacyForm ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                  <label className="text-xs font-semibold text-ec-t3 block mb-1">{label}</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={pharmacyForm[key] || ''}
                    onChange={(e) => setPharmacyForm({ ...pharmacyForm, [key]: e.target.value })}
                    placeholder={label}
                  />
                </div>
              ))}
            </div>
            <button
              className="px-4 py-2 bg-ec-em text-white font-semibold rounded-lg text-sm border-none cursor-pointer hover:bg-ec-em-dark transition-colors font-sans"
              onClick={handleSavePharmacy}
            >
              Save Pharmacy Details
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
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
                <span className="text-xs font-semibold text-ec-t3 block mb-0.5">{label}</span>
                <span className="text-sm text-ec-t1">{value || '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notification Preferences */}
      <div
        className="rounded-2xl p-5 mb-4"
        style={{ backgroundColor: 'var(--ec-card)', border: '1px solid var(--ec-border)' }}
      >
        <h2 className="text-base font-bold text-ec-t1 mb-1">Notification Preferences</h2>
        <p className="text-sm text-ec-t3 mb-4">
          Control which alerts appear in the sidebar and dashboard.
        </p>
        <div className="space-y-2">
          {[
            { key: 'documentExpiry', label: 'Document expiry alerts' },
            { key: 'trainingOverdue', label: 'Training overdue alerts' },
            { key: 'cleaningOverdue', label: 'Cleaning overdue alerts' },
            { key: 'safeguardingDue', label: 'Safeguarding due alerts' },
            { key: 'temperatureMissing', label: 'Temperature log reminders' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-ec-card transition-colors cursor-pointer">
              <input
                type="checkbox"
                className="accent-ec-em"
                checked={!!notifPrefs[key]}
                onChange={() => {
                  const updated = { ...notifPrefs, [key]: !notifPrefs[key] }
                  setNotifPrefs(updated)
                  localStorage.setItem('ipd_notification_prefs', JSON.stringify(updated))
                  showToast('Preference saved')
                }}
              />
              <span className="text-sm text-ec-t1">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Data Management */}
      <div
        className="rounded-2xl p-5 mb-4"
        style={{ backgroundColor: 'var(--ec-card)', border: '1px solid var(--ec-border)' }}
      >
        <h2 className="text-base font-bold text-ec-t1 mb-1">Data Management</h2>
        <p className="text-sm text-ec-t3 mb-4">
          Export a backup of all your data, restore from a previous backup, or clear everything.
        </p>

        <div className="flex items-center gap-2 mb-4">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: backendStatus.checking ? '#71717a' : backendStatus.ok ? 'var(--ec-em)' : '#ef4444' }}
          />
          <span className="text-sm text-ec-t2">
            {backendStatus.checking
              ? 'Checking backend…'
              : backendStatus.ok
                ? 'Backend connected'
                : `Backend not connected — ${backendStatus.error}`}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <button className="px-4 py-2 bg-ec-card-hover text-ec-t2 rounded-lg text-sm border border-ec-border cursor-pointer hover:bg-ec-t5 hover:text-ec-t1 transition-colors flex items-center gap-1.5 font-sans" onClick={() => {
            // Deduplicate cleaning entries
            const cleanMap = new Map()
            cleaningEntries.forEach(e => {
              const key = `${e.taskName}|${e.dateTime}`
              const existing = cleanMap.get(key)
              if (!existing || new Date(e.createdAt) > new Date(existing.createdAt)) {
                cleanMap.set(key, e)
              }
            })
            const uniqueClean = [...cleanMap.values()]

            // Deduplicate staff training
            const trainMap = new Map()
            staffTraining.forEach(e => {
              const key = `${e.staffName}|${e.trainingItem}`
              const existing = trainMap.get(key)
              if (!existing || (e.id > existing.id)) {
                trainMap.set(key, e)
              }
            })
            const uniqueTrain = [...trainMap.values()]

            // Deduplicate documents
            const docMap = new Map()
            documents.forEach(d => {
              const existing = docMap.get(d.documentName)
              if (!existing || new Date(d.createdAt) > new Date(existing.createdAt)) {
                docMap.set(d.documentName, d)
              }
            })
            const uniqueDocs = [...docMap.values()]

            const cleanRemoved = cleaningEntries.length - uniqueClean.length
            const trainRemoved = staffTraining.length - uniqueTrain.length
            const docRemoved = documents.length - uniqueDocs.length
            const totalRemoved = cleanRemoved + trainRemoved + docRemoved

            if (totalRemoved === 0) {
              showToast('No duplicates found')
            } else {
              logAudit('Deleted', `${totalRemoved} duplicate${totalRemoved !== 1 ? 's' : ''} removed`, 'Settings', user?.name)
              showToast(`Removed ${totalRemoved} duplicate${totalRemoved !== 1 ? 's' : ''}`)
              window.location.reload()
            }
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" /><path d="M9 14l2 2 4-4" />
            </svg>
            Delete Duplicates
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          <button className="px-4 py-2 bg-ec-em text-white font-semibold rounded-lg text-sm border-none cursor-pointer hover:bg-ec-em-dark transition-colors flex items-center gap-1.5 font-sans" onClick={handleExport}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export Backup
          </button>
          <button className="px-4 py-2 bg-ec-card-hover text-ec-t2 rounded-lg text-sm border border-ec-border cursor-pointer hover:bg-ec-t5 hover:text-ec-t1 transition-colors flex items-center gap-1.5 font-sans" onClick={() => fileRef.current?.click()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Import Backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
          <button className="px-4 py-2 bg-ec-crit/10 text-ec-crit-light rounded-lg text-sm border border-ec-crit/20 cursor-pointer hover:bg-ec-crit/20 transition-colors flex items-center gap-1.5 font-sans" onClick={handleClear}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
            Clear All Data
          </button>
        </div>

        {importMsg && (
          <p className={importMsg.type === 'success' ? 'text-sm text-ec-em mt-2' : 'text-sm text-ec-crit-light mt-2'}>
            {importMsg.text}
          </p>
        )}

        <div className="mt-6 pt-4 border-t border-ec-div">
          <button className="px-4 py-2 bg-ec-card-hover text-ec-t2 rounded-lg text-sm border border-ec-border cursor-pointer hover:bg-ec-t5 hover:text-ec-t1 transition-colors flex items-center gap-1.5 font-sans" onClick={() => { logoutUser(); logout(); window.location.reload() }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Log Out
          </button>
        </div>
      </div>

      {/* Weekly Compliance Report */}
      <div
        className="rounded-2xl p-5 mb-4"
        style={{ backgroundColor: 'var(--ec-card)', border: '1px solid var(--ec-border)' }}
      >
        <h2 className="text-base font-bold text-ec-t1 mb-1">Weekly Compliance Report</h2>
        <p className="text-sm text-ec-t3 mb-4">
          Generate a CSV summary of this week&apos;s compliance scores, incidents, expiring documents, and overdue training.
        </p>
        <button className="px-4 py-2 bg-ec-em text-white font-semibold rounded-lg text-sm border-none cursor-pointer hover:bg-ec-em-dark transition-colors flex items-center gap-1.5 font-sans" onClick={() => {
          const docGreen = documents.filter(d => getTrafficLight(d.expiryDate) === 'green').length
          const docPct = documents.length > 0 ? Math.round((docGreen / documents.length) * 100) : 100
          const trainPct = staffTraining.length > 0 ? Math.round((staffTraining.filter(e => e.status === 'Complete').length / staffTraining.length) * 100) : 100

          const seen = new Set()
          const uniqueTasks = cleaningTasks.filter(t => { if (seen.has(t.name)) return false; seen.add(t.name); return true })
          const cleanUpToDate = uniqueTasks.filter(t => { const s = getTaskStatus(t.name, t.frequency, cleaningEntries); return s === 'done' || s === 'upcoming' }).length
          const cleanPct = uniqueTasks.length > 0 ? Math.round((cleanUpToDate / uniqueTasks.length) * 100) : 100

          const sgCurrent = safeguarding.filter(r => getSafeguardingStatus(r.trainingDate) === 'current').length
          const sgPct = safeguarding.length > 0 ? Math.round((sgCurrent / safeguarding.length) * 100) : 100

          const weekIncidents = incidents.filter(i => {
            const d = new Date(i.createdAt)
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            return d >= weekAgo
          }).length

          const expiringDocs = documents.filter(d => getTrafficLight(d.expiryDate) !== 'green')
          const overdueTraining = staffTraining.filter(e => e.status === 'Pending').length

          const headers = ['Metric', 'Value']
          const rows = [
            ['Documents Compliance %', docPct],
            ['Training Compliance %', trainPct],
            ['Cleaning Compliance %', cleanPct],
            ['Safeguarding Compliance %', sgPct],
            ['Overall Compliance %', Math.round((docPct + trainPct + cleanPct + sgPct) / 4)],
            ['Incidents This Week', weekIncidents],
            ['Documents Expiring/Expired', expiringDocs.length],
            ['Training Overdue Count', overdueTraining],
          ]
          downloadCsv('weekly-compliance-report', headers, rows)
          showToast('Weekly report downloaded')
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Generate Weekly Report
        </button>
      </div>

      {/* Audit Trail */}
      <div
        className="rounded-2xl p-5 mb-4"
        style={{ backgroundColor: 'var(--ec-card)', border: '1px solid var(--ec-border)' }}
      >
        <h2 className="text-base font-bold text-ec-t1 mb-1">Audit Trail</h2>
        <p className="text-sm text-ec-t3 mb-4">
          View a log of all actions performed in the system.
        </p>
        <button className="px-4 py-2 bg-ec-card-hover text-ec-t2 rounded-lg text-sm border border-ec-border cursor-pointer hover:bg-ec-t5 hover:text-ec-t1 transition-colors flex items-center gap-1.5 font-sans" onClick={() => setShowAudit(!showAudit)}>
          {showAudit ? 'Hide Audit Trail' : 'Show Audit Trail'}
        </button>
        {showAudit && (
          <div className="overflow-x-auto rounded-xl mt-4" style={{ border: '1px solid var(--ec-border)' }}>
            {auditLogs.length === 0 ? (
              <p className="text-sm text-ec-t3 py-4">No audit entries yet.</p>
            ) : (
              <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">Timestamp</th>
                    <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">Action</th>
                    <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">Item</th>
                    <th className="hidden md:table-cell text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">User</th>
                    <th className="hidden md:table-cell text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">Page</th>
                  </tr>
                </thead>
                <tbody>
                  {[...auditLogs].sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt)).map(log => (
                    <tr key={log.id}>
                      <td className="px-4 py-2.5 text-ec-t1 border-b border-ec-div">{new Date(log.timestamp || log.createdAt).toLocaleString('en-GB')}</td>
                      <td className="px-4 py-2.5 text-ec-t1 border-b border-ec-div">{log.action}</td>
                      <td className="px-4 py-2.5 text-ec-t1 border-b border-ec-div">{log.itemName}</td>
                      <td className="hidden md:table-cell px-4 py-2.5 text-ec-t1 border-b border-ec-div">{log.userName || '—'}</td>
                      <td className="hidden md:table-cell px-4 py-2.5 text-ec-t1 border-b border-ec-div">{log.page || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
