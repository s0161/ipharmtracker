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

const RING_RADIUS = 54
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

const MINI_RADIUS = 36
const MINI_CIRCUMFERENCE = 2 * Math.PI * MINI_RADIUS

function ComplianceRing({ score, label, color, size = 'large' }) {
  const r = size === 'large' ? RING_RADIUS : MINI_RADIUS
  const c = size === 'large' ? RING_CIRCUMFERENCE : MINI_CIRCUMFERENCE
  const vb = size === 'large' ? 128 : 88
  const cx = vb / 2
  const offset = c * (1 - score / 100)
  const sw = size === 'large' ? 10 : 6

  return (
    <svg className={`compliance-ring-svg compliance-ring-svg--${size}`} viewBox={`0 0 ${vb} ${vb}`}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--border)" strokeWidth={sw} />
      <circle
        cx={cx} cy={cx} r={r}
        fill="none" stroke={color} strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 800ms cubic-bezier(0.4,0,0.2,1)' }}
      />
      <text x={cx} y={size === 'large' ? cx - 6 : cx - 3} textAnchor="middle" className={`compliance-ring-pct compliance-ring-pct--${size}`}>
        {score}%
      </text>
      <text x={cx} y={size === 'large' ? cx + 12 : cx + 9} textAnchor="middle" className={`compliance-ring-label compliance-ring-label--${size}`}>
        {label}
      </text>
    </svg>
  )
}

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
const RP_MONTHLY = []

function TaskIcon({ done }) {
  if (done) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('today')
  const [documents, , docsLoading] = useSupabase('documents', [])
  const [cleaningEntries] = useSupabase('cleaning_entries', [])
  const [cleaningTasks] = useSupabase('cleaning_tasks', DEFAULT_CLEANING_TASKS)
  const [staffTraining] = useSupabase('staff_training', [])
  const [safeguarding] = useSupabase('safeguarding_records', [])
  const [rpLogs] = useSupabase('rp_log', [])

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

  // Cleaning task statuses grouped by frequency
  const taskStatuses = cleaningTasks.map((task) => ({
    ...task,
    status: getTaskStatus(task.name, task.frequency, cleaningEntries),
  }))

  // RP items grouped by frequency for summary cards
  const RP_GROUPS = [
    { frequency: 'daily', label: 'Daily', items: RP_DAILY },
    { frequency: 'weekly', label: 'Weekly', items: RP_WEEKLY },
    { frequency: 'fortnightly', label: 'Fortnightly', items: RP_FORTNIGHTLY },
  ].filter(g => g.items.length > 0)

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
  const allClear = totalActionItems === 0

  // Upcoming expiries
  const upcoming = documents
    .filter((d) => {
      const status = getTrafficLight(d.expiryDate)
      return d.expiryDate && (status === 'amber' || status === 'green')
    })
    .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
    .slice(0, 5)

  const complianceAreas = [
    { label: 'Documents', score: docScore, nav: '/documents' },
    { label: 'Training', score: staffScore, nav: '/staff-training' },
    { label: 'Cleaning', score: cleaningScore, nav: '/cleaning' },
    { label: 'Safeguarding', score: sgScore, nav: '/safeguarding' },
  ]

  // Build kanban columns by frequency
  const buildColumn = (freq) => {
    const cards = []
    // Cleaning cards for this frequency
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
    // RP summary card for this frequency
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
      })
    }
    return cards
  }

  const todayCards = buildColumn('daily')
  const weeklyCards = buildColumn('weekly')
  const fortnightlyCards = buildColumn('fortnightly')

  return (
    <div className="dashboard">
      {/* Greeting */}
      <div className="dash-greeting">
        <div>
          <h1 className="dash-greeting-title">{getGreeting()}</h1>
          <p className="dash-greeting-sub">
            iPharmacy Direct —{' '}
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        </div>
        <button className="btn btn--ghost no-print" onClick={() => window.print()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Print Report
        </button>
      </div>

      {/* Action Required / All Clear */}
      {allClear ? (
        <div className="action-required-section action-required-section--clear">
          <div className="action-required-clear">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="28" height="28">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <div>
              <h2 className="action-required-title">All Clear</h2>
              <p className="action-required-sub">No items require attention.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="action-required-section">
          <h2 className="action-required-heading">Action Required</h2>
          <div className="action-required-items">
            {expiredDocs.length > 0 && (
              <button className="action-item action-item--red" onClick={() => navigate('/documents')}>
                <span className="action-item-count">{expiredDocs.length}</span>
                <span className="action-item-text">Expired document{expiredDocs.length !== 1 ? 's' : ''}</span>
              </button>
            )}
            {dueSoon.length > 0 && (
              <button className="action-item action-item--amber" onClick={() => navigate('/documents')}>
                <span className="action-item-count">{dueSoon.length}</span>
                <span className="action-item-text">Due within 7 days</span>
              </button>
            )}
            {overdueTraining.length > 0 && (
              <button className="action-item action-item--red" onClick={() => navigate('/staff-training')}>
                <span className="action-item-count">{overdueTraining.length}</span>
                <span className="action-item-text">Pending training{overdueTraining.length !== 1 ? 's' : ''}</span>
              </button>
            )}
            {overdueCleaningTasks.length > 0 && (
              <button className="action-item action-item--amber" onClick={() => navigate('/cleaning')}>
                <span className="action-item-count">{overdueCleaningTasks.length}</span>
                <span className="action-item-text">Overdue cleaning</span>
              </button>
            )}
            {sgDueSoon.length > 0 && (
              <button className="action-item action-item--amber" onClick={() => navigate('/safeguarding')}>
                <span className="action-item-count">{sgDueSoon.length}</span>
                <span className="action-item-text">Safeguarding due</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quick-Add Buttons */}
      <div className="quick-add-row no-print">
        <button className="btn btn--primary quick-add-btn" onClick={() => navigate('/cleaning?add=true')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Log Cleaning
        </button>
        <button className="btn btn--primary quick-add-btn" onClick={() => navigate('/training?add=true')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Log Training
        </button>
        <button className="btn btn--primary quick-add-btn" onClick={() => navigate('/rp-log')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M9 14l2 2 4-4" />
            <rect x="3" y="3" width="18" height="18" rx="3" />
          </svg>
          RP Checklist
        </button>
      </div>

      {/* Compliance Rings */}
      <div className="compliance-hero">
        <div className="compliance-hero-main">
          <ComplianceRing score={overallScore} label="Overall" color={scoreColor(overallScore)} size="large" />
        </div>
        <div className="compliance-hero-areas">
          {complianceAreas.map((item) => (
            <button key={item.label} className="compliance-area-card" onClick={() => navigate(item.nav)}>
              <ComplianceRing score={item.score} label={item.label} color={scoreColor(item.score)} size="mini" />
            </button>
          ))}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="dash-tabs no-print">
        <button
          className={`dash-tab ${activeTab === 'today' ? 'dash-tab--active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          Today's Tasks
        </button>
        <button
          className={`dash-tab ${activeTab === 'outstanding' ? 'dash-tab--active' : ''}`}
          onClick={() => setActiveTab('outstanding')}
        >
          Outstanding
          {totalActionItems > 0 && (
            <span className="dash-tab-badge">{totalActionItems}</span>
          )}
        </button>
      </div>

      {/* Today Tab — Kanban Board (columns by frequency) */}
      {activeTab === 'today' && (
        <div className="kanban-board">
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
                    <button
                      key={card.id}
                      className={`kanban-card kanban-card--${card.status}`}
                      onClick={() => navigate(card.category === 'RP Check' ? '/rp-log' : '/cleaning?add=true')}
                    >
                      <span className="kanban-card-name">{card.name}</span>
                      <div className="kanban-card-meta">
                        <span className="kanban-card-pill kanban-card-pill--cat">{card.category}</span>
                        {card.isSummary
                          ? <span className="kanban-card-time">{card.doneCount}/{card.total} done</span>
                          : card.timestamp && <span className="kanban-card-time">{card.timestamp}</span>}
                      </div>
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
                    </button>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Outstanding Tab */}
      {activeTab === 'outstanding' && (
        <div className="outstanding-section">
          {totalActionItems === 0 ? (
            <div className="outstanding-clear">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <p>Nothing outstanding. All tasks are up to date.</p>
            </div>
          ) : (
            <>
              {/* Overdue Cleaning */}
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

              {/* Expired Documents */}
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

              {/* Documents Due Soon */}
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

              {/* Pending Training */}
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

              {/* Safeguarding Due */}
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
            </>
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
