import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSupabase } from '../hooks/useSupabase'
import {
  getTrafficLight,
  formatDate,
  getTrafficLightLabel,
  getTaskStatus,
  getTaskStatusLabel,
  getSafeguardingStatus,
  DEFAULT_CLEANING_TASKS,
} from '../utils/helpers'

function scoreColor(pct) {
  if (pct > 80) return 'var(--success)'
  if (pct >= 50) return 'var(--warning)'
  return 'var(--danger)'
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// RP checklist items by frequency
const RP_DAILY = [
  'RP notice displayed',
  'Controlled drugs checked',
  'Pharmacy opened correctly',
  'Pharmacy closed correctly',
]
const RP_WEEKLY = [
  'Pharmacy record up to date',
  'RP absent period recorded (if applicable)',
  'Near-miss log reviewed',
  'Dispensing area clean and tidy',
]
const RP_FORTNIGHTLY = [
  'Date checking completed',
  'Returned medicines destroyed log reviewed',
  'Staff training records reviewed',
  'SOPs reviewed for currency',
]

const RP_GROUPS = [
  { frequency: 'daily', label: 'Daily', items: RP_DAILY },
  { frequency: 'weekly', label: 'Weekly', items: RP_WEEKLY },
  { frequency: 'fortnightly', label: 'Fortnightly', items: RP_FORTNIGHTLY },
]

function KanbanCard({ card, tickingCardId, setTickingCardId, expandedRpCard, setExpandedRpCard, staffMembers, onTickCleaning, rpChecklist, onToggleRpItem }) {
  const isCleaning = card.category === 'Cleaning'
  const isRp = card.category === 'RP Check'
  const isTickOpen = tickingCardId === card.id
  const isExpanded = expandedRpCard === card.id

  return (
    <div className={`kanban-card kanban-card--${card.status}`}>
      <div className="kanban-card-row">
        {/* Tick button */}
        {isCleaning && card.status !== 'done' && (
          <button
            className="kanban-tick-btn"
            onClick={() => setTickingCardId(isTickOpen ? null : card.id)}
            aria-label={`Mark ${card.name} as done`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <circle cx="12" cy="12" r="10" />
            </svg>
          </button>
        )}
        {isCleaning && card.status === 'done' && (
          <span className="kanban-tick-done">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" width="18" height="18">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </span>
        )}
        {isRp && (
          <button
            className="kanban-tick-btn"
            onClick={() => setExpandedRpCard(isExpanded ? null : card.id)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke={card.status === 'done' ? 'var(--success)' : 'currentColor'} strokeWidth="2" width="18" height="18">
              {card.status === 'done' ? (
                <><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>
              ) : (
                <circle cx="12" cy="12" r="10" />
              )}
            </svg>
          </button>
        )}

        <div className="kanban-card-body">
          <span className="kanban-card-name">{card.name}</span>
          <div className="kanban-card-meta">
            <span className="kanban-card-pill kanban-card-pill--cat">{card.category}</span>
            {card.isSummary
              ? <span className="kanban-card-time">{card.doneCount}/{card.total} done</span>
              : card.timestamp && <span className="kanban-card-time">{card.timestamp}</span>}
          </div>
        </div>
      </div>

      {/* Staff picker for cleaning tick-off */}
      {isCleaning && isTickOpen && (
        <div className="kanban-staff-picker">
          <p className="kanban-staff-picker-label">Who completed this?</p>
          <div className="kanban-staff-picker-list">
            {staffMembers.map(name => (
              <button key={name} className="kanban-staff-picker-btn" onClick={() => onTickCleaning(card.name, name)}>
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* RP expanded checklist */}
      {isRp && isExpanded && card.rpItems && (
        <div className="kanban-rp-checklist">
          {card.rpItems.map(item => (
            <label key={item} className="kanban-rp-item">
              <input
                type="checkbox"
                checked={!!rpChecklist[item]}
                onChange={() => onToggleRpItem(item)}
              />
              <span>{item}</span>
            </label>
          ))}
        </div>
      )}

      {/* Progress bar for RP summary */}
      {card.isSummary && (
        <div className="kanban-card-progress">
          <div
            className="kanban-card-progress-fill"
            style={{
              width: `${(card.doneCount / card.total) * 100}%`,
              background: card.status === 'done' ? 'var(--success)' : card.doneCount === 0 ? 'var(--border)' : 'var(--warning)',
            }}
          />
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [showOutstanding, setShowOutstanding] = useState(false)
  const [tickingCardId, setTickingCardId] = useState(null)
  const [expandedRpCard, setExpandedRpCard] = useState(null)

  const [documents, , docsLoading] = useSupabase('documents', [])
  const [cleaningEntries, setCleaningEntries] = useSupabase('cleaning_entries', [])
  const [cleaningTasks] = useSupabase('cleaning_tasks', DEFAULT_CLEANING_TASKS)
  const [staffTraining] = useSupabase('staff_training', [])
  const [safeguarding] = useSupabase('safeguarding_records', [])
  const [rpLogs, setRpLogs] = useSupabase('rp_log', [])
  const [staffMembers] = useSupabase('staff_members', [], { valueField: 'name' })

  if (docsLoading) {
    return <div className="loading-container"><div className="spinner" />Loading…</div>
  }

  // Document counts
  const docStatuses = documents.map((d) => getTrafficLight(d.expiryDate))
  const greenCount = docStatuses.filter((s) => s === 'green').length

  const now = new Date()
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const dueSoon = documents.filter(d => {
    if (!d.expiryDate) return false
    const exp = new Date(d.expiryDate)
    return exp > now && exp <= sevenDays
  })

  // Compliance sub-scores
  const docScore = documents.length > 0
    ? Math.round((greenCount / documents.length) * 100) : 100

  const staffScore = staffTraining.length > 0
    ? Math.round((staffTraining.filter((e) => e.status === 'Complete').length / staffTraining.length) * 100) : 100

  const cleaningUpToDate = cleaningTasks.length > 0
    ? cleaningTasks.filter((t) => {
        const s = getTaskStatus(t.name, t.frequency, cleaningEntries)
        return s === 'done' || s === 'upcoming'
      }).length : 0
  const cleaningScore = cleaningTasks.length > 0
    ? Math.round((cleaningUpToDate / cleaningTasks.length) * 100) : 100

  const sgCurrent = safeguarding.length > 0
    ? safeguarding.filter((r) => getSafeguardingStatus(r.trainingDate) === 'current').length : 0
  const sgScore = safeguarding.length > 0
    ? Math.round((sgCurrent / safeguarding.length) * 100) : 100

  const overallScore = Math.round((docScore + staffScore + cleaningScore + sgScore) / 4)

  // Cleaning task statuses (deduplicate by name)
  const seen = new Set()
  const taskStatuses = cleaningTasks.filter(t => {
    if (seen.has(t.name)) return false
    seen.add(t.name)
    return true
  }).map((task) => ({
    ...task,
    status: getTaskStatus(task.name, task.frequency, cleaningEntries),
  }))

  // RP Log — today's checklist
  const todayStr = new Date().toISOString().slice(0, 10)
  const todayRp = rpLogs.find(l => l.date === todayStr)
  const rpChecklist = todayRp?.checklist || {}

  // Action required
  const expiredDocs = documents.filter(d => getTrafficLight(d.expiryDate) === 'red')
  const overdueTraining = staffTraining.filter(e => e.status === 'Pending')
  const overdueCleaningTasks = taskStatuses.filter(t => t.status === 'overdue')
  const sgDueSoon = safeguarding.filter(r => {
    const s = getSafeguardingStatus(r.trainingDate)
    return s === 'due-soon' || s === 'overdue'
  })
  const totalActionItems = expiredDocs.length + dueSoon.length + overdueTraining.length + overdueCleaningTasks.length + sgDueSoon.length

  const complianceAreas = [
    { label: 'Documents', score: docScore, nav: '/documents' },
    { label: 'Training', score: staffScore, nav: '/staff-training' },
    { label: 'Cleaning', score: cleaningScore, nav: '/cleaning' },
    { label: 'Safeguarding', score: sgScore, nav: '/safeguarding' },
  ]

  // Build kanban columns by frequency
  const buildColumn = (freq) => {
    const cards = []
    taskStatuses.filter(t => t.frequency === freq).forEach(task => {
      if (task.status === 'upcoming') return
      const latestEntry = task.status === 'done'
        ? cleaningEntries
            .filter(e => e.taskName === task.name)
            .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime))[0]
        : null
      cards.push({
        id: `cleaning-${task.name}`,
        name: task.name,
        category: 'Cleaning',
        status: task.status,
        timestamp: latestEntry
          ? new Date(latestEntry.dateTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
          : null,
      })
    })
    const rpGroup = RP_GROUPS.find(g => g.frequency === freq)
    if (rpGroup) {
      const doneCount = rpGroup.items.filter(name => !!rpChecklist[name]).length
      const total = rpGroup.items.length
      cards.push({
        id: `rp-summary-${freq}`,
        name: `${rpGroup.label} RP Checks`,
        category: 'RP Check',
        status: doneCount === total ? 'done' : 'due',
        isSummary: true,
        doneCount,
        total,
        rpItems: rpGroup.items,
      })
    }
    return cards
  }

  const todayCards = buildColumn('daily')
  const weeklyCards = buildColumn('weekly')
  const fortnightlyCards = buildColumn('fortnightly')

  // Tick-off handlers
  const handleTickCleaning = (taskName, staffMember) => {
    const nowDt = new Date()
    const newEntry = {
      id: crypto.randomUUID(),
      taskName,
      dateTime: nowDt.toISOString().slice(0, 16),
      staffMember,
      result: 'Pass',
      notes: 'Completed from dashboard',
      createdAt: nowDt.toISOString(),
    }
    setCleaningEntries([...cleaningEntries, newEntry])
    setTickingCardId(null)
  }

  const handleToggleRpItem = (itemName) => {
    const updatedChecklist = { ...rpChecklist, [itemName]: !rpChecklist[itemName] }
    if (todayRp) {
      setRpLogs(rpLogs.map(l =>
        l.id === todayRp.id ? { ...l, checklist: updatedChecklist } : l
      ))
    } else {
      setRpLogs([...rpLogs, {
        id: crypto.randomUUID(),
        date: todayStr,
        rpName: 'Dashboard',
        checklist: updatedChecklist,
        notes: '',
        createdAt: new Date().toISOString(),
      }])
    }
  }

  return (
    <div className="dashboard">
      {/* === TOP BAR === */}
      <div className="dash-topbar no-print">
        <div className="dash-topbar-left">
          <h1 className="dash-topbar-greeting">{getGreeting()}</h1>
          <p className="dash-topbar-date">
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        </div>

        <div className="dash-topbar-center">
          {totalActionItems > 0 ? (
            <button
              className="dash-topbar-badge dash-topbar-badge--action"
              onClick={() => setShowOutstanding(!showOutstanding)}
            >
              <span className="dash-topbar-badge-count">{totalActionItems}</span>
              <span className="dash-topbar-badge-label">Action{totalActionItems !== 1 ? 's' : ''} needed</span>
            </button>
          ) : (
            <span className="dash-topbar-badge dash-topbar-badge--clear">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              All Clear
            </span>
          )}
        </div>

        <div className="dash-topbar-right">
          <div className="dash-topbar-score">
            <span className="dash-topbar-score-pct" style={{ color: scoreColor(overallScore) }}>
              {overallScore}%
            </span>
            <span className="dash-topbar-score-label">Compliance</span>
          </div>
          <button className="btn btn--ghost btn--sm" onClick={() => window.print()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
          </button>
        </div>
      </div>

      {/* === KANBAN BOARD === */}
      <div className="kanban-board no-print">
        {[
          { key: 'daily', title: 'Today', cards: todayCards },
          { key: 'weekly', title: 'Weekly', cards: weeklyCards },
          { key: 'fortnightly', title: 'Fortnightly', cards: fortnightlyCards },
        ].map(col => (
          <div key={col.key} className="kanban-column">
            <div className="kanban-column-header">
              <span className="kanban-column-title">{col.title}</span>
              <span className="kanban-column-count">{col.cards.length}</span>
            </div>
            <div className="kanban-cards">
              {col.cards.length === 0 ? (
                <p className="kanban-empty">No tasks</p>
              ) : (
                col.cards.map(card => (
                  <KanbanCard
                    key={card.id}
                    card={card}
                    tickingCardId={tickingCardId}
                    setTickingCardId={setTickingCardId}
                    expandedRpCard={expandedRpCard}
                    setExpandedRpCard={setExpandedRpCard}
                    staffMembers={staffMembers}
                    onTickCleaning={handleTickCleaning}
                    rpChecklist={rpChecklist}
                    onToggleRpItem={handleToggleRpItem}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* === COMPLIANCE FOOTER STRIP === */}
      <div className="compliance-strip no-print">
        {complianceAreas.map(item => (
          <button
            key={item.label}
            className="compliance-strip-item"
            onClick={() => navigate(item.nav)}
          >
            <span className="compliance-strip-score" style={{ color: scoreColor(item.score) }}>
              {item.score}%
            </span>
            <span className="compliance-strip-label">{item.label}</span>
          </button>
        ))}
      </div>

      {/* === OUTSTANDING SECTION === */}
      {showOutstanding && totalActionItems > 0 && (
        <div className="outstanding-section">
          {overdueCleaningTasks.length > 0 && (
            <div className="outstanding-group">
              <h3 className="outstanding-group-title">
                <span className="outstanding-dot outstanding-dot--red" />
                Overdue Cleaning Tasks
              </h3>
              {overdueCleaningTasks.map(t => (
                <button key={t.name} className="outstanding-item" onClick={() => navigate('/cleaning?add=true')}>
                  <span className="outstanding-item-name">{t.name}</span>
                  <span className="outstanding-item-freq">{t.frequency}</span>
                  <span className="outstanding-item-badge outstanding-item-badge--overdue">Overdue</span>
                </button>
              ))}
            </div>
          )}
          {expiredDocs.length > 0 && (
            <div className="outstanding-group">
              <h3 className="outstanding-group-title">
                <span className="outstanding-dot outstanding-dot--red" />
                Expired Documents
              </h3>
              {expiredDocs.map(d => (
                <button key={d.id} className="outstanding-item" onClick={() => navigate('/documents')}>
                  <span className="outstanding-item-name">{d.documentName}</span>
                  <span className="outstanding-item-freq">{d.category}</span>
                  <span className="outstanding-item-badge outstanding-item-badge--overdue">
                    {d.expiryDate ? `Expired ${formatDate(d.expiryDate)}` : 'No date set'}
                  </span>
                </button>
              ))}
            </div>
          )}
          {dueSoon.length > 0 && (
            <div className="outstanding-group">
              <h3 className="outstanding-group-title">
                <span className="outstanding-dot outstanding-dot--amber" />
                Documents Due Within 7 Days
              </h3>
              {dueSoon.map(d => (
                <button key={d.id} className="outstanding-item" onClick={() => navigate('/documents')}>
                  <span className="outstanding-item-name">{d.documentName}</span>
                  <span className="outstanding-item-freq">{d.category}</span>
                  <span className="outstanding-item-badge outstanding-item-badge--due">
                    Expires {formatDate(d.expiryDate)}
                  </span>
                </button>
              ))}
            </div>
          )}
          {overdueTraining.length > 0 && (
            <div className="outstanding-group">
              <h3 className="outstanding-group-title">
                <span className="outstanding-dot outstanding-dot--red" />
                Pending Staff Training
              </h3>
              {overdueTraining.map(e => (
                <button key={e.id} className="outstanding-item" onClick={() => navigate('/staff-training')}>
                  <span className="outstanding-item-name">{e.staffName}</span>
                  <span className="outstanding-item-freq">{e.trainingItem}</span>
                  <span className="outstanding-item-badge outstanding-item-badge--overdue">Pending</span>
                </button>
              ))}
            </div>
          )}
          {sgDueSoon.length > 0 && (
            <div className="outstanding-group">
              <h3 className="outstanding-group-title">
                <span className="outstanding-dot outstanding-dot--amber" />
                Safeguarding Refreshers Due
              </h3>
              {sgDueSoon.map(r => (
                <button key={r.id} className="outstanding-item" onClick={() => navigate('/safeguarding')}>
                  <span className="outstanding-item-name">{r.staffName}</span>
                  <span className="outstanding-item-freq">{r.jobTitle}</span>
                  <span className={`outstanding-item-badge outstanding-item-badge--${getSafeguardingStatus(r.trainingDate) === 'overdue' ? 'overdue' : 'due'}`}>
                    {getSafeguardingStatus(r.trainingDate) === 'overdue' ? 'Overdue' : 'Due Soon'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Print-Only Section */}
      <div className="print-only">
        <div className="print-header">
          <h1 className="print-title">iPharmacy Direct — Compliance Report</h1>
          <p className="print-meta">
            Generated: {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {' at '}
            {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <div className="print-section">
          <h2>Compliance Scores</h2>
          <table className="print-table">
            <thead><tr><th>Area</th><th>Score</th></tr></thead>
            <tbody>
              <tr><td>Documents</td><td>{docScore}%</td></tr>
              <tr><td>Staff Training</td><td>{staffScore}%</td></tr>
              <tr><td>Cleaning Tasks</td><td>{cleaningScore}%</td></tr>
              <tr><td>Safeguarding</td><td>{sgScore}%</td></tr>
              <tr style={{ fontWeight: 700 }}><td>Overall</td><td>{overallScore}%</td></tr>
            </tbody>
          </table>
        </div>

        <div className="print-section">
          <h2>Document Status</h2>
          <table className="print-table">
            <thead><tr><th>Status</th><th>Document</th><th>Category</th><th>Expiry</th></tr></thead>
            <tbody>
              {documents.map(doc => (
                <tr key={doc.id}>
                  <td>{getTrafficLightLabel(getTrafficLight(doc.expiryDate))}</td>
                  <td>{doc.documentName}</td>
                  <td>{doc.category}</td>
                  <td>{formatDate(doc.expiryDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="print-section">
          <h2>Cleaning Task Summary</h2>
          <table className="print-table">
            <thead><tr><th>Task</th><th>Frequency</th><th>Status</th></tr></thead>
            <tbody>
              {taskStatuses.map(t => (
                <tr key={t.name}>
                  <td>{t.name}</td>
                  <td>{t.frequency}</td>
                  <td>{getTaskStatusLabel(t.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="print-section">
          <h2>Staff Training Completion</h2>
          <table className="print-table">
            <thead><tr><th>Staff</th><th>Training Item</th><th>Status</th></tr></thead>
            <tbody>
              {staffTraining.map(st => (
                <tr key={st.id}>
                  <td>{st.staffName}</td>
                  <td>{st.trainingItem}</td>
                  <td>{st.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="print-section">
          <h2>Safeguarding Status</h2>
          <table className="print-table">
            <thead><tr><th>Staff</th><th>Training Date</th><th>Status</th></tr></thead>
            <tbody>
              {safeguarding.map(r => (
                <tr key={r.id}>
                  <td>{r.staffName}</td>
                  <td>{formatDate(r.trainingDate)}</td>
                  <td>{getSafeguardingStatus(r.trainingDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
