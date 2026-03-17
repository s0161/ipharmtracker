import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const COMMANDS = [
  // Navigate
  { id: 'nav-dashboard', label: 'Dashboard', description: 'Main overview & KPIs', category: 'Navigate', emoji: '🏠', keywords: ['home', 'main', 'kpi'], path: '/' },
  { id: 'nav-mytasks', label: 'My Tasks', description: 'Personal task list', category: 'Navigate', emoji: '✅', keywords: ['todo', 'tasks', 'assign'], path: '/my-tasks' },
  { id: 'nav-rplog', label: 'RP Log', description: 'Responsible Pharmacist log', category: 'Navigate', emoji: '💊', keywords: ['pharmacist', 'rp', 'responsible'], path: '/rp-log' },
  { id: 'nav-training', label: 'Training Logs', description: 'Staff training records', category: 'Navigate', emoji: '📋', keywords: ['training', 'log', 'record'], path: '/training' },
  { id: 'nav-cleaning', label: 'Cleaning Rota', description: 'Daily cleaning schedule', category: 'Navigate', emoji: '🧹', keywords: ['clean', 'rota', 'schedule'], path: '/cleaning' },
  { id: 'nav-renewals', label: 'Renewals', description: 'Document renewals & expiry tracking', category: 'Navigate', emoji: '📄', keywords: ['documents', 'expiry', 'renewal', 'certificate'], path: '/documents' },
  { id: 'nav-stafftraining', label: 'Staff Training Tracker', description: 'Track staff training progress', category: 'Navigate', emoji: '🎓', keywords: ['staff', 'training', 'progress', 'tracker'], path: '/staff-training' },
  { id: 'nav-temperature', label: 'Temperature Log', description: 'Fridge & room temperature records', category: 'Navigate', emoji: '🌡️', keywords: ['temp', 'fridge', 'room', 'thermometer'], path: '/temperature' },
  { id: 'nav-handover', label: 'Shift Handover', description: 'Shift handover notes', category: 'Navigate', emoji: '🔄', keywords: ['shift', 'handover', 'notes'], path: '/handover' },
  { id: 'nav-rota', label: 'Staff Rota', description: 'Weekly staff rota', category: 'Navigate', emoji: '📅', keywords: ['rota', 'schedule', 'weekly', 'staff'], path: '/rota' },
  { id: 'nav-gphc', label: 'GPhC Report', description: 'GPhC inspection report', category: 'Navigate', emoji: '📊', keywords: ['gphc', 'inspection', 'report'], path: '/gphc-report' },
  { id: 'nav-incidents', label: 'Incidents', description: 'Incident reports & tracking', category: 'Navigate', emoji: '⚠️', keywords: ['incident', 'report', 'accident'], path: '/incidents' },
  { id: 'nav-nearmisses', label: 'Near Miss Log', description: 'Near miss reports', category: 'Navigate', emoji: '🎯', keywords: ['near', 'miss', 'error'], path: '/near-misses' },
  { id: 'nav-safeguarding', label: 'Safeguarding', description: 'Safeguarding records', category: 'Navigate', emoji: '🛡️', keywords: ['safeguard', 'protect', 'vulnerable'], path: '/safeguarding' },
  { id: 'nav-settings', label: 'Settings', description: 'App settings & staff management', category: 'Navigate', emoji: '⚙️', keywords: ['settings', 'config', 'staff', 'manage'], path: '/settings' },
  { id: 'nav-compliance', label: 'Compliance Report', description: 'Compliance overview & scores', category: 'Navigate', emoji: '📈', keywords: ['compliance', 'report', 'score'], path: '/compliance-report' },
  { id: 'nav-analytics', label: 'Analytics', description: 'Data analytics & charts', category: 'Navigate', emoji: '📉', keywords: ['analytics', 'charts', 'data', 'stats'], path: '/analytics' },
  { id: 'nav-auditlog', label: 'Audit Log', description: 'System audit trail', category: 'Navigate', emoji: '📝', keywords: ['audit', 'log', 'trail', 'history'], path: '/audit-log' },
  { id: 'nav-cd', label: 'CD Register', description: 'Controlled drugs register', category: 'Navigate', emoji: '💉', keywords: ['controlled', 'drugs', 'cd', 'register'], path: '/cd-register' },
  { id: 'nav-sop', label: 'SOP Library', description: 'Standard operating procedures', category: 'Navigate', emoji: '📚', keywords: ['sop', 'procedures', 'standard'], path: '/sop-library' },
  { id: 'nav-directory', label: 'Staff Directory', description: 'Staff contact directory', category: 'Navigate', emoji: '👥', keywords: ['staff', 'directory', 'contact', 'people'], path: '/staff-directory' },
  { id: 'nav-induction', label: 'Induction', description: 'New starter induction checklist', category: 'Navigate', emoji: '🆕', keywords: ['induction', 'new', 'starter', 'onboarding'], path: '/induction' },
  { id: 'nav-appraisals', label: 'Appraisals', description: 'Staff appraisals & reviews', category: 'Navigate', emoji: '⭐', keywords: ['appraisal', 'review', 'performance'], path: '/appraisals' },
  { id: 'nav-mhra', label: 'MHRA Recalls', description: 'Drug recalls & safety alerts', category: 'Navigate', emoji: '🔔', keywords: ['mhra', 'recall', 'safety', 'alert', 'drug'], path: '/mhra-recalls' },
  { id: 'nav-alerts', label: 'Alert Centre', description: 'Notifications & alerts', category: 'Navigate', emoji: '🚨', keywords: ['alert', 'notification', 'centre'], path: '/alerts' },
  { id: 'nav-carehomes', label: 'Care Homes', description: 'Care home management', category: 'Navigate', emoji: '🏥', keywords: ['care', 'home', 'nursing'], path: '/care-homes' },
  { id: 'nav-patients', label: 'Patient Queries', description: 'Patient query tracking', category: 'Navigate', emoji: '🗣️', keywords: ['patient', 'query', 'question'], path: '/patient-queries' },
  { id: 'nav-calendar', label: 'Calendar', description: 'Calendar & scheduled events', category: 'Navigate', emoji: '📆', keywords: ['calendar', 'events', 'schedule', 'date'], path: '/calendar' },

  // Actions
  { id: 'act-logtemp', label: 'Log Temperature', description: 'Quick-add a temperature reading', category: 'Actions', emoji: '🌡️', keywords: ['log', 'temp', 'reading', 'fridge'], path: '/temperature' },
  { id: 'act-incident', label: 'Report Incident', description: 'File a new incident report', category: 'Actions', emoji: '⚠️', keywords: ['report', 'incident', 'new'], path: '/incidents' },
  { id: 'act-nearmiss', label: 'Report Near Miss', description: 'File a near miss report', category: 'Actions', emoji: '🎯', keywords: ['report', 'near', 'miss', 'new'], path: '/near-misses' },
  { id: 'act-handover', label: 'Start Handover', description: 'Begin shift handover', category: 'Actions', emoji: '🔄', keywords: ['start', 'handover', 'shift'], path: '/handover' },
  { id: 'act-rp', label: 'Log RP Entry', description: 'Add RP log entry', category: 'Actions', emoji: '💊', keywords: ['log', 'rp', 'entry', 'pharmacist'], path: '/rp-log' },
  { id: 'act-addstaff', label: 'Add Staff Member', description: 'Add new staff to directory', category: 'Actions', emoji: '👤', keywords: ['add', 'staff', 'new', 'member'], path: '/settings' },

  // Compliance
  { id: 'comp-gphc', label: 'GPhC Inspection Prep', description: 'Prepare for GPhC inspection', category: 'Compliance', emoji: '📋', keywords: ['gphc', 'inspection', 'prep', 'prepare'], path: '/gphc-report' },
  { id: 'comp-report', label: 'Generate Compliance Report', description: 'View full compliance report', category: 'Compliance', emoji: '📊', keywords: ['generate', 'compliance', 'report'], path: '/compliance-report' },
  { id: 'comp-audit', label: 'View Audit Trail', description: 'Review audit log entries', category: 'Compliance', emoji: '🔍', keywords: ['view', 'audit', 'trail', 'review'], path: '/audit-log' },
]

const CATEGORY_ORDER = ['Navigate', 'Actions', 'Compliance']

function fuzzyMatch(text, query) {
  const lower = text.toLowerCase()
  const q = query.toLowerCase()
  // Check if all characters of query appear in order
  let qi = 0
  for (let i = 0; i < lower.length && qi < q.length; i++) {
    if (lower[i] === q[qi]) qi++
  }
  if (qi === q.length) return true
  // Also check simple includes on words
  return q.split(/\s+/).every(word => lower.includes(word))
}

function filterCommands(commands, query) {
  if (!query.trim()) return commands
  return commands.filter(cmd => {
    const searchable = `${cmd.label} ${cmd.description} ${cmd.keywords.join(' ')}`
    return fuzzyMatch(searchable, query)
  })
}

function groupByCategory(commands) {
  const groups = {}
  for (const cmd of commands) {
    if (!groups[cmd.category]) groups[cmd.category] = []
    groups[cmd.category].push(cmd)
  }
  return CATEGORY_ORDER
    .filter(cat => groups[cat])
    .map(cat => ({ category: cat, items: groups[cat] }))
}

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentIds, setRecentIds] = useState([])
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const itemRefs = useRef({})
  const navigate = useNavigate()

  // Load recent commands from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('ipd_recent_commands') || '[]')
      setRecentIds(stored)
    } catch { /* ignore */ }
  }, [open])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const filtered = filterCommands(COMMANDS, query)
  const recentCommands = recentIds
    .map(id => COMMANDS.find(c => c.id === id))
    .filter(Boolean)
    .filter(cmd => !query.trim() || filtered.includes(cmd))

  const groups = groupByCategory(filtered)

  // Build flat list for keyboard navigation
  const flatList = []
  if (!query.trim() && recentCommands.length > 0) {
    recentCommands.forEach(cmd => flatList.push(cmd))
  }
  groups.forEach(g => g.items.forEach(cmd => {
    if (!flatList.some(f => f.id === cmd.id)) flatList.push(cmd)
  }))

  // Reset selection on query change
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Scroll selected into view
  useEffect(() => {
    const el = itemRefs.current[flatList[selectedIndex]?.id]
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex, flatList])

  const executeCommand = useCallback((cmd) => {
    // Update recents
    const newRecent = [cmd.id, ...recentIds.filter(id => id !== cmd.id)].slice(0, 5)
    setRecentIds(newRecent)
    localStorage.setItem('ipd_recent_commands', JSON.stringify(newRecent))

    setQuery('')
    onClose()
    navigate(cmd.path)
  }, [recentIds, onClose, navigate])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, flatList.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (flatList[selectedIndex]) executeCommand(flatList[selectedIndex])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }, [flatList, selectedIndex, executeCommand, onClose])

  if (!open) return null

  const showRecent = !query.trim() && recentCommands.length > 0

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '15vh',
        backgroundColor: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          margin: '0 16px',
          borderRadius: 14,
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--ec-border)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '70vh',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 16px',
            borderBottom: '1px solid var(--ec-border)',
          }}
        >
          <span style={{ fontSize: 18, flexShrink: 0 }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              fontSize: 15,
              color: 'var(--ec-t1)',
              fontFamily: 'inherit',
            }}
          />
          <kbd
            style={{
              fontSize: 11,
              padding: '2px 6px',
              borderRadius: 5,
              backgroundColor: 'var(--ec-card-hover, var(--ec-bg))',
              border: '1px solid var(--ec-border)',
              color: 'var(--ec-t3)',
              fontFamily: 'inherit',
              flexShrink: 0,
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 0',
          }}
        >
          {flatList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--ec-t3)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
              <div style={{ fontSize: 14 }}>No results for "{query}"</div>
            </div>
          ) : (
            <>
              {showRecent && (
                <div style={{ padding: '4px 16px 6px' }}>
                  <div style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--ec-t3)',
                  }}>
                    Recent
                  </div>
                  {recentCommands.map(cmd => {
                    const idx = flatList.findIndex(f => f.id === cmd.id)
                    const isSelected = idx === selectedIndex
                    return (
                      <div
                        key={'recent-' + cmd.id}
                        ref={el => itemRefs.current[cmd.id] = el}
                        onClick={() => executeCommand(cmd)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 12px',
                          margin: '2px 0',
                          borderRadius: 8,
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'var(--ec-card-hover, rgba(5,150,105,0.08))' : 'transparent',
                          borderLeft: isSelected ? '3px solid #059669' : '3px solid transparent',
                          transition: 'background-color 0.1s',
                        }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <span style={{ fontSize: 16, width: 24, textAlign: 'center', flexShrink: 0 }}>{cmd.emoji}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ec-t1)' }}>{cmd.label}</div>
                          <div style={{ fontSize: 11, color: 'var(--ec-t3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cmd.description}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {groups.map(group => {
                // Skip items already shown in recents (only when showing recents)
                const items = showRecent
                  ? group.items.filter(cmd => !recentIds.includes(cmd.id))
                  : group.items
                if (items.length === 0) return null

                return (
                  <div key={group.category} style={{ padding: '4px 16px 6px' }}>
                    <div style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--ec-t3)',
                      marginTop: 4,
                    }}>
                      {group.category}
                    </div>
                    {items.map(cmd => {
                      const idx = flatList.findIndex(f => f.id === cmd.id)
                      const isSelected = idx === selectedIndex
                      return (
                        <div
                          key={cmd.id}
                          ref={el => itemRefs.current[cmd.id] = el}
                          onClick={() => executeCommand(cmd)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '8px 12px',
                            margin: '2px 0',
                            borderRadius: 8,
                            cursor: 'pointer',
                            backgroundColor: isSelected ? 'var(--ec-card-hover, rgba(5,150,105,0.08))' : 'transparent',
                            borderLeft: isSelected ? '3px solid #059669' : '3px solid transparent',
                            transition: 'background-color 0.1s',
                          }}
                          onMouseEnter={() => setSelectedIndex(idx)}
                        >
                          <span style={{ fontSize: 16, width: 24, textAlign: 'center', flexShrink: 0 }}>{cmd.emoji}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ec-t1)' }}>{cmd.label}</div>
                            <div style={{ fontSize: 11, color: 'var(--ec-t3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cmd.description}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            borderTop: '1px solid var(--ec-border)',
            fontSize: 11,
            color: 'var(--ec-t3)',
          }}
        >
          <div style={{ display: 'flex', gap: 12 }}>
            <span><kbd style={kbdStyle}>↑↓</kbd> Navigate</span>
            <span><kbd style={kbdStyle}>↵</kbd> Select</span>
            <span><kbd style={kbdStyle}>esc</kbd> Close</span>
          </div>
          <span>iPharmacy Direct</span>
        </div>
      </div>
    </div>
  )
}

const kbdStyle = {
  display: 'inline-block',
  padding: '1px 5px',
  borderRadius: 4,
  backgroundColor: 'var(--ec-card-hover, var(--ec-bg))',
  border: '1px solid var(--ec-border)',
  fontSize: 10,
  fontFamily: 'inherit',
  marginRight: 3,
}
