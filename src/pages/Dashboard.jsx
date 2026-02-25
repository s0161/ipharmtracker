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
  const [documents] = useSupabase('documents', [])
  const [trainingLogs] = useSupabase('training_logs', [])
  const [cleaningEntries] = useSupabase('cleaning_entries', [])
  const [cleaningTasks] = useSupabase('cleaning_tasks', DEFAULT_CLEANING_TASKS)
  const [staffTraining] = useSupabase('staff_training', [])
  const [safeguarding] = useSupabase('safeguarding_records', [])

  // Document alert counts
  const docStatuses = documents.map((d) => getTrafficLight(d.expiryDate))
  const redCount = docStatuses.filter((s) => s === 'red').length
  const amberCount = docStatuses.filter((s) => s === 'amber').length
  const greenCount = docStatuses.filter((s) => s === 'green').length

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

  // Upcoming expiries — next 5 documents nearest to expiry (that have a date and aren't expired)
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

  return (
    <div className="dashboard">
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
    </div>
  )
}
