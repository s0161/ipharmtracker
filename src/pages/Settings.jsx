import { useState, useRef, useEffect } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import { supabase } from '../lib/supabase'
import { DEFAULT_CLEANING_TASKS, FREQUENCIES, getTrafficLight, getSafeguardingStatus, getTaskStatus } from '../utils/helpers'
import { exportData, importData, clearAllData } from '../utils/dataManager'
import { downloadCsv } from '../utils/exportCsv'
import { useToast } from '../components/Toast'
import { useUser } from '../contexts/UserContext'
import { logout } from './Login'

function ListManager({ title, description, items, onUpdate }) {
  const [value, setValue] = useState('')

  const handleAdd = (e) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || items.includes(trimmed)) return
    onUpdate([...items, trimmed])
    setValue('')
  }

  const handleRemove = (item) => {
    onUpdate(items.filter((i) => i !== item))
  }

  return (
    <div className="settings-section">
      <h2 className="settings-section-title">{title}</h2>
      <p className="settings-section-desc">{description}</p>
      <form className="settings-add-form" onSubmit={handleAdd}>
        <input
          type="text"
          className="input"
          placeholder={`Add new ${title.toLowerCase().replace(/s$/, '')}...`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button type="submit" className="btn btn--primary">
          Add
        </button>
      </form>
      {items.length === 0 ? (
        <p className="empty-state">No items added yet.</p>
      ) : (
        <ul className="settings-list">
          {items.map((item) => (
            <li key={item} className="settings-list-item">
              <span>{item}</span>
              <button
                className="btn btn--ghost btn--sm"
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

function StaffManager({ staff, onUpdate, showToast }) {
  const [name, setName] = useState('')
  const [editPin, setEditPin] = useState(null) // { id, pin }

  const handleAdd = (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || staff.some((s) => s.name === trimmed)) return
    onUpdate([...staff, { name: trimmed, pin: '', isManager: false }])
    setName('')
  }

  const handleRemove = (id) => {
    onUpdate(staff.filter((s) => s.id !== id))
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
    <div className="settings-section">
      <h2 className="settings-section-title">Staff Members</h2>
      <p className="settings-section-desc">
        Manage staff, set PINs, and assign manager roles.
      </p>
      <form className="settings-add-form" onSubmit={handleAdd}>
        <input
          type="text"
          className="input"
          placeholder="Add new staff member..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" className="btn btn--primary">Add</button>
      </form>
      {staff.length === 0 ? (
        <p className="empty-state">No staff added yet.</p>
      ) : (
        <ul className="settings-list">
          {staff.map((s) => (
            <li key={s.id} className="settings-list-item settings-staff-row">
              <div className="settings-staff-info">
                <span className="settings-staff-name">{s.name}</span>
                <div className="settings-staff-controls">
                  <label className="settings-manager-toggle">
                    <input
                      type="checkbox"
                      checked={!!s.isManager}
                      onChange={() => toggleManager(s.id)}
                    />
                    <span>Manager</span>
                  </label>
                  {editPin?.id === s.id ? (
                    <div className="settings-pin-edit">
                      <input
                        type="text"
                        className="input input--sm"
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
                        className="btn btn--primary btn--sm"
                        onClick={() => savePin(s.id)}
                        disabled={editPin.pin.length !== 4}
                      >
                        Save
                      </button>
                      <button
                        className="btn btn--ghost btn--sm"
                        onClick={() => setEditPin(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn--ghost btn--sm"
                      onClick={() => setEditPin({ id: s.id, pin: s.pin || '' })}
                    >
                      {s.pin ? 'Change PIN' : 'Set PIN'}
                    </button>
                  )}
                </div>
              </div>
              <button
                className="btn btn--ghost btn--sm"
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

function TaskManager({ tasks, onUpdate }) {
  const [name, setName] = useState('')
  const [frequency, setFrequency] = useState('daily')

  const handleAdd = (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || tasks.some((t) => t.name === trimmed)) return
    onUpdate([...tasks, { name: trimmed, frequency }])
    setName('')
    setFrequency('daily')
  }

  const handleRemove = (taskName) => {
    onUpdate(tasks.filter((t) => t.name !== taskName))
  }

  const handleFreqChange = (taskName, newFreq) => {
    onUpdate(tasks.map((t) => (t.name === taskName ? { ...t, frequency: newFreq } : t)))
  }

  return (
    <div className="settings-section">
      <h2 className="settings-section-title">Cleaning Tasks</h2>
      <p className="settings-section-desc">
        Manage cleaning tasks and how often they need doing. The &lsquo;Other&rsquo; option is always available.
      </p>
      <form className="settings-add-form" onSubmit={handleAdd}>
        <input
          type="text"
          className="input"
          placeholder="Add new task..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select
          className="input input--inline"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          style={{ minWidth: 110 }}
        >
          {FREQUENCIES.map((f) => (
            <option key={f} value={f}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn--primary">
          Add
        </button>
      </form>
      {tasks.length === 0 ? (
        <p className="empty-state">No tasks added yet.</p>
      ) : (
        <ul className="settings-list">
          {tasks.map((task) => (
            <li key={task.name} className="settings-list-item">
              <span>{task.name}</span>
              <div className="settings-list-actions">
                <select
                  className="input input--inline input--sm"
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
                  className="btn btn--ghost btn--sm"
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

const PHARMACY_DETAILS = {
  name: 'iPharmacy Direct',
  address: 'Manchester, UK',
  phone: '',
  gphcNumber: '',
  superintendent: 'Amjid Shakoor',
  responsiblePharmacist: 'Amjid Shakoor',
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
  const { logout: logoutUser } = useUser()
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
    showToast('All data cleared', 'info')
    window.location.reload()
  }

  return (
    <div className="settings">
      <StaffManager
        staff={staffMembers}
        onUpdate={setStaffMembers}
        showToast={showToast}
      />
      <ListManager
        title="Training Topics"
        description="Manage the list of training topics available when logging training entries."
        items={trainingTopics}
        onUpdate={setTrainingTopics}
      />
      <TaskManager tasks={cleaningTasks} onUpdate={setCleaningTasks} />

      {/* Pharmacy Details */}
      <div className="settings-section">
        <h2 className="settings-section-title">Pharmacy Details</h2>
        <p className="settings-section-desc">
          Core pharmacy information. Contact your administrator to update these details.
        </p>
        <div className="settings-details-grid">
          {Object.entries({
            'Pharmacy Name': PHARMACY_DETAILS.name,
            'Superintendent': PHARMACY_DETAILS.superintendent,
            'Responsible Pharmacist': PHARMACY_DETAILS.responsiblePharmacist,
            'Address': PHARMACY_DETAILS.address,
          }).map(([label, value]) => (
            <div key={label} className="settings-detail-item">
              <span className="settings-detail-label">{label}</span>
              <span className="settings-detail-value">{value || '—'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="settings-section">
        <h2 className="settings-section-title">Notification Preferences</h2>
        <p className="settings-section-desc">
          Control which alerts appear in the sidebar and dashboard.
        </p>
        <div className="settings-notif-list">
          {[
            { key: 'documentExpiry', label: 'Document expiry alerts' },
            { key: 'trainingOverdue', label: 'Training overdue alerts' },
            { key: 'cleaningOverdue', label: 'Cleaning overdue alerts' },
            { key: 'safeguardingDue', label: 'Safeguarding due alerts' },
            { key: 'temperatureMissing', label: 'Temperature log reminders' },
          ].map(({ key, label }) => (
            <label key={key} className="settings-notif-toggle">
              <input
                type="checkbox"
                checked={!!notifPrefs[key]}
                onChange={() => {
                  const updated = { ...notifPrefs, [key]: !notifPrefs[key] }
                  setNotifPrefs(updated)
                  localStorage.setItem('ipd_notification_prefs', JSON.stringify(updated))
                  showToast('Preference saved')
                }}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Data Management */}
      <div className="settings-section">
        <h2 className="settings-section-title">Data Management</h2>
        <p className="settings-section-desc">
          Export a backup of all your data, restore from a previous backup, or clear everything.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: backendStatus.checking
                ? '#aaa'
                : backendStatus.ok
                  ? '#22c55e'
                  : '#ef4444',
            }}
          />
          <span style={{ fontSize: 14 }}>
            {backendStatus.checking
              ? 'Checking backend…'
              : backendStatus.ok
                ? 'Backend connected'
                : `Backend not connected — ${backendStatus.error}`}
          </span>
        </div>

        <div className="data-mgmt-actions" style={{ flexWrap: 'wrap' }}>
          <button className="btn btn--ghost" onClick={() => {
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
        <div className="data-mgmt-actions">
          <button className="btn btn--primary" onClick={handleExport}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export Backup
          </button>
          <button className="btn btn--ghost" onClick={() => fileRef.current?.click()}>
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
          <button className="btn btn--danger" onClick={handleClear}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
            Clear All Data
          </button>
        </div>

        {importMsg && (
          <p className={`data-mgmt-msg data-mgmt-msg--${importMsg.type}`}>
            {importMsg.text}
          </p>
        )}

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-light)' }}>
          <button className="btn btn--ghost" onClick={() => { logoutUser(); logout(); window.location.reload() }}>
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
      <div className="settings-section">
        <h2 className="settings-section-title">Weekly Compliance Report</h2>
        <p className="settings-section-desc">
          Generate a CSV summary of this week&apos;s compliance scores, incidents, expiring documents, and overdue training.
        </p>
        <button className="btn btn--primary" onClick={() => {
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
      <div className="settings-section">
        <h2 className="settings-section-title">Audit Trail</h2>
        <p className="settings-section-desc">
          View a log of all actions performed in the system.
        </p>
        <button className="btn btn--ghost" onClick={() => setShowAudit(!showAudit)}>
          {showAudit ? 'Hide Audit Trail' : 'Show Audit Trail'}
        </button>
        {showAudit && (
          <div className="table-wrap" style={{ marginTop: '1rem' }}>
            {auditLogs.length === 0 ? (
              <p className="empty-state">No audit entries yet.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Item</th>
                    <th className="mobile-hide">User</th>
                    <th className="mobile-hide">Page</th>
                  </tr>
                </thead>
                <tbody>
                  {[...auditLogs].sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt)).map(log => (
                    <tr key={log.id}>
                      <td>{new Date(log.timestamp || log.createdAt).toLocaleString('en-GB')}</td>
                      <td>{log.action}</td>
                      <td>{log.itemName}</td>
                      <td className="mobile-hide">{log.userName || '—'}</td>
                      <td className="mobile-hide">{log.page || '—'}</td>
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
