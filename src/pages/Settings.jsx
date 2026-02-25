import { useState, useRef, useEffect } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import { supabase } from '../lib/supabase'
import { DEFAULT_CLEANING_TASKS, FREQUENCIES } from '../utils/helpers'
import { exportData, importData, clearAllData } from '../utils/dataManager'
import { useToast } from '../components/Toast'
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

export default function Settings() {
  const [staffMembers, setStaffMembers] = useSupabase('staff_members', [], { valueField: 'name' })
  const [trainingTopics, setTrainingTopics] = useSupabase('training_topics', [], { valueField: 'name' })
  const [cleaningTasks, setCleaningTasks] = useSupabase(
    'cleaning_tasks',
    DEFAULT_CLEANING_TASKS
  )
  const showToast = useToast()
  const [importMsg, setImportMsg] = useState(null)
  const fileRef = useRef(null)
  const [backendStatus, setBackendStatus] = useState({ checking: true })

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
      <ListManager
        title="Staff Members"
        description="Manage the list of staff members available in dropdown menus across the app."
        items={staffMembers}
        onUpdate={setStaffMembers}
      />
      <ListManager
        title="Training Topics"
        description="Manage the list of training topics available when logging training entries."
        items={trainingTopics}
        onUpdate={setTrainingTopics}
      />
      <TaskManager tasks={cleaningTasks} onUpdate={setCleaningTasks} />

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
          <button className="btn btn--ghost" onClick={() => { logout(); window.location.reload() }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Log Out
          </button>
        </div>
      </div>
    </div>
  )
}
