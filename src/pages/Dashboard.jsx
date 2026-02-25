import { useNavigate } from 'react-router-dom'
import { useSupabase } from '../hooks/useSupabase'
import {
  getTrafficLight,
  formatDate,
  formatDateTime,
  isToday,
  getTrafficLightLabel,
  getTaskStatus,
  getTaskStatusLabel,
  getSafeguardingStatus,
  DEFAULT_CLEANING_TASKS,
} from '../utils/helpers'

const RING_RADIUS = 54
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

function ComplianceRing({ score, label, color }) {
  const offset = RING_CIRCUMFERENCE * (1 - score / 100)
  return (
    <svg className="compliance-ring-svg" viewBox="0 0 128 128">
      <circle cx="64" cy="64" r={RING_RADIUS} fill="none" stroke="var(--border)" strokeWidth="10" />
      <circle
        cx="64" cy="64" r={RING_RADIUS}
        fill="none" stroke={color} strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={RING_CIRCUMFERENCE}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 800ms cubic-bezier(0.4,0,0.2,1)' }}
      />
      <text x="64" y="58" textAnchor="middle" className="compliance-ring-pct">
        {score}%
      </text>
      <text x="64" y="76" textAnchor="middle" className="compliance-ring-label">
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

export default function Dashboard() {
  const navigate = useNavigate()
  const [documents, , docsLoading] = useSupabase('documents', [])
  const [trainingLogs] = useSupabase('training_logs', [])
  const [cleaningEntries] = useSupabase('cleaning_entries', [])
  const [cleaningTasks] = useSupabase('cleaning_tasks', DEFAULT_CLEANING_TASKS)
  const [staffTraining] = useSupabase('staff_training', [])
  const [safeguarding] = useSupabase('safeguarding_records', [])

  if (docsLoading) {
    return <div className="loading-container"><div className="spinner" />Loading…</div>
  }

  // Document alert counts
  const docStatuses = documents.map((d) => getTrafficLight(d.expiryDate))
  const redCount = docStatuses.filter((s) => s === 'red').length
  const amberCount = docStatuses.filter((s) => s === 'amber').length
  const greenCount = docStatuses.filter((s) => s === 'green').length

  // Documents due within 7 days
  const now = new Date()
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const dueSoon = documents.filter(d => {
    if (!d.expiryDate) return false
    const exp = new Date(d.expiryDate)
    return exp > now && exp <= sevenDays
  })

  // Compliance sub-scores
  const docScore = documents.length > 0
    ? Math.round((greenCount / documents.length) * 100)
    : 100

  const staffScore = staffTraining.length > 0
    ? Math.round((staffTraining.filter((e) => e.status === 'Complete').length / staffTraining.length) * 100)
    : 100

  const cleaningUpToDate = cleaningTasks.length > 0
    ? cleaningTasks.filter((t) => {
        const s = getTaskStatus(t.name, t.frequency, cleaningEntries)
        return s === 'done' || s === 'upcoming'
      }).length
    : 0
  const cleaningScore = cleaningTasks.length > 0
    ? Math.round((cleaningUpToDate / cleaningTasks.length) * 100)
    : 100

  const sgCurrent = safeguarding.length > 0
    ? safeguarding.filter((r) => getSafeguardingStatus(r.trainingDate) === 'current').length
    : 0
  const sgScore = safeguarding.length > 0
    ? Math.round((sgCurrent / safeguarding.length) * 100)
    : 100

  const overallScore = Math.round((docScore + staffScore + cleaningScore + sgScore) / 4)

  // Upcoming expiries — next 5 documents nearest to expiry
  const upcoming = documents
    .filter((d) => {
      const status = getTrafficLight(d.expiryDate)
      return d.expiryDate && (status === 'amber' || status === 'green')
    })
    .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
    .slice(0, 5)

  // Tasks completed today
  const tasksToday = cleaningEntries.filter((e) => isToday(e.dateTime)).length

  // Today's task statuses
  const taskStatuses = cleaningTasks.map((task) => ({
    ...task,
    status: getTaskStatus(task.name, task.frequency, cleaningEntries),
  }))

  const dueCount = taskStatuses.filter(
    (t) => t.status === 'due' || t.status === 'overdue'
  ).length
  const allDone = dueCount === 0 && taskStatuses.length > 0

  // Recent entries
  const recentTraining = [...trainingLogs]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)

  const recentCleaning = [...cleaningEntries]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)

  // === Action Required Items ===
  const expiredDocs = documents.filter(d => getTrafficLight(d.expiryDate) === 'red')
  const overdueTraining = staffTraining.filter(e => e.status === 'Pending')
  const overdueCleaningTasks = taskStatuses.filter(t => t.status === 'overdue')
  const sgDueSoon = safeguarding.filter(r => {
    const s = getSafeguardingStatus(r.trainingDate)
    return s === 'due-soon' || s === 'overdue'
  })

  const totalActionItems = expiredDocs.length + dueSoon.length + overdueTraining.length + overdueCleaningTasks.length + sgDueSoon.length
  const allClear = totalActionItems === 0

  return (
    <div className="dashboard">
      {/* Action Required / All Clear */}
      <div className={`action-required-section ${allClear ? 'action-required-section--clear' : ''}`}>
        {allClear ? (
          <div className="action-required-clear">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="28" height="28">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <div>
              <h2 className="action-required-title">All Clear</h2>
              <p className="action-required-sub">No items require attention. All compliance checks are up to date.</p>
            </div>
          </div>
        ) : (
          <>
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
                  <span className="action-item-text">Pending training item{overdueTraining.length !== 1 ? 's' : ''}</span>
                </button>
              )}
              {overdueCleaningTasks.length > 0 && (
                <button className="action-item action-item--amber" onClick={() => navigate('/cleaning')}>
                  <span className="action-item-count">{overdueCleaningTasks.length}</span>
                  <span className="action-item-text">Overdue cleaning task{overdueCleaningTasks.length !== 1 ? 's' : ''}</span>
                </button>
              )}
              {sgDueSoon.length > 0 && (
                <button className="action-item action-item--amber" onClick={() => navigate('/safeguarding')}>
                  <span className="action-item-count">{sgDueSoon.length}</span>
                  <span className="action-item-text">Safeguarding refresher{sgDueSoon.length !== 1 ? 's' : ''} due</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>

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

      {/* Compliance Score */}
      <div className="compliance-section">
        <div className="compliance-ring-wrap">
          <ComplianceRing score={overallScore} label="Overall" color={scoreColor(overallScore)} />
        </div>
        <div className="compliance-breakdown">
          <h2 className="compliance-title">Compliance Score</h2>
          {[
            { label: 'Documents', score: docScore },
            { label: 'Staff Training', score: staffScore },
            { label: 'Cleaning Tasks', score: cleaningScore },
            { label: 'Safeguarding', score: sgScore },
          ].map((item) => (
            <div key={item.label} className="compliance-row">
              <span className="compliance-row-label">{item.label}</span>
              <div className="compliance-row-bar">
                <div
                  className="compliance-row-fill"
                  style={{ width: `${item.score}%`, background: scoreColor(item.score) }}
                />
              </div>
              <span className="compliance-row-pct" style={{ color: scoreColor(item.score) }}>
                {item.score}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Tasks Panel */}
      <div className={`todays-panel ${allDone ? 'todays-panel--clear' : 'todays-panel--action'}`}>
        <div className="todays-panel-header">
          <h2 className="todays-panel-title">
            {allDone ? 'All Tasks Up to Date' : `${dueCount} Task${dueCount !== 1 ? 's' : ''} Need Attention`}
          </h2>
          <span className="todays-panel-date">
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </div>
        <div className="todays-tasks">
          {taskStatuses.map((task) => (
            <div
              key={task.name}
              className={`todays-task todays-task--${task.status}`}
            >
              <div className="todays-task-icon">
                {task.status === 'done' || task.status === 'upcoming' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                )}
              </div>
              <div className="todays-task-info">
                <span className="todays-task-name">{task.name}</span>
                <span className="todays-task-freq">{task.frequency}</span>
              </div>
              <span className={`todays-task-badge todays-task-badge--${task.status}`}>
                {getTaskStatusLabel(task.status)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Alert Cards */}
      <div className="dash-cards">
        <div className="dash-card dash-card--danger">
          <div className="dash-card-number">{redCount}</div>
          <div className="dash-card-label">Expired / No Date</div>
          <div className="dash-card-sub">Documents requiring attention</div>
        </div>
        <div className="dash-card dash-card--warning">
          <div className="dash-card-number">{amberCount}</div>
          <div className="dash-card-label">Due Within 30 Days</div>
          <div className="dash-card-sub">Documents approaching expiry</div>
        </div>
        <div className="dash-card dash-card--success">
          <div className="dash-card-number">{greenCount}</div>
          <div className="dash-card-label">Valid</div>
          <div className="dash-card-sub">Documents up to date</div>
        </div>
        <div className="dash-card dash-card--info">
          <div className="dash-card-number">{tasksToday}</div>
          <div className="dash-card-label">Tasks Today</div>
          <div className="dash-card-sub">Cleaning tasks completed</div>
        </div>
      </div>

      {/* Upcoming Expiries */}
      <div className="dash-section">
        <h2 className="dash-section-title">Upcoming Expiries</h2>
        {upcoming.length === 0 ? (
          <p className="empty-state">No upcoming expiries to show.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Document</th>
                  <th>Category</th>
                  <th>Expiry Date</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((doc) => {
                  const status = getTrafficLight(doc.expiryDate)
                  return (
                    <tr key={doc.id}>
                      <td>
                        <span className={`traffic-dot traffic-dot--${status}`} title={getTrafficLightLabel(status)} />
                      </td>
                      <td>{doc.documentName}</td>
                      <td>
                        <span className="badge">{doc.category}</span>
                      </td>
                      <td>{formatDate(doc.expiryDate)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Entries */}
      <div className="dash-grid">
        <div className="dash-section">
          <h2 className="dash-section-title">Recent Training Logs</h2>
          {recentTraining.length === 0 ? (
            <p className="empty-state">No training logs yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="table table--compact">
                <thead>
                  <tr>
                    <th>Staff</th>
                    <th>Topic</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTraining.map((log) => (
                    <tr key={log.id}>
                      <td>{log.staffName}</td>
                      <td>{log.topic}</td>
                      <td>{formatDate(log.dateCompleted)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="dash-section">
          <h2 className="dash-section-title">Recent Cleaning Entries</h2>
          {recentCleaning.length === 0 ? (
            <p className="empty-state">No cleaning entries yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="table table--compact">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Staff</th>
                    <th>Result</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCleaning.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.taskName}</td>
                      <td>{entry.staffMember}</td>
                      <td>
                        <span
                          className={`result-badge result-badge--${entry.result === 'Pass' ? 'pass' : 'action'}`}
                        >
                          {entry.result}
                        </span>
                      </td>
                      <td>{formatDateTime(entry.dateTime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Print Compliance Report Button */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'center', paddingTop: '0.5rem' }}>
        <button className="btn btn--ghost" onClick={() => window.print()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Print Compliance Report
        </button>
      </div>

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
            <thead>
              <tr><th>Area</th><th>Score</th></tr>
            </thead>
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
            <thead>
              <tr><th>Status</th><th>Document</th><th>Category</th><th>Expiry</th></tr>
            </thead>
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
            <thead>
              <tr><th>Task</th><th>Frequency</th><th>Status</th></tr>
            </thead>
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
            <thead>
              <tr><th>Staff</th><th>Training Item</th><th>Status</th></tr>
            </thead>
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
            <thead>
              <tr><th>Staff</th><th>Training Date</th><th>Status</th></tr>
            </thead>
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
