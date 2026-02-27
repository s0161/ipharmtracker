import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { useSupabase } from '../hooks/useSupabase'
import {
  getTrafficLight,
  formatDate,
  getTrafficLightLabel,
  getTaskStatus,
  getTaskStatusLabel,
  getSafeguardingStatus,
  DEFAULT_CLEANING_TASKS,
  generateId,
} from '../utils/helpers'
import { getTaskAssignee, getRPAssignee, getStaffInitials } from '../utils/rotationManager'
import Modal from '../components/Modal'
import { useToast } from '../components/Toast'

function scoreColor(pct) {
  if (pct > 80) return 'var(--success)'
  if (pct >= 50) return 'var(--warning)'
  return 'var(--danger)'
}

function scoreClass(pct) {
  if (pct > 80) return 'green'
  if (pct >= 50) return 'amber'
  return 'red'
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
  'Fridge temperature recorded',
]
const RP_WEEKLY = [
  'Pharmacy record up to date',
  'RP absent period recorded (if applicable)',
  'Near-miss log reviewed',
  'Dispensing area clean and tidy',
  'CD balance checked',
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

// Due times for critical daily tasks
const TASK_DUE_TIMES = {
  'Temperature Log': '09:00',
}
const RP_DAILY_DUE_TIME = '10:00'

function isTimePast(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  const now = new Date()
  return now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m)
}

// SVG tile icons (replacing emojis)
const TILE_ICONS = {
  cleaning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
      <path d="M12 2L12 6" /><path d="M8 4L8 6" /><path d="M16 4L16 6" />
      <path d="M6 6h12v3a8 8 0 01-5.5 7.6L12 22l-.5-5.4A8 8 0 016 9V6z" />
    </svg>
  ),
  documents: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  training: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  safeguarding: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  temperature: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
      <path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z" />
    </svg>
  ),
  rplog: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" /><path d="M9 14l2 2 4-4" />
    </svg>
  ),
}

// SVG Progress Ring
function ProgressRing({ pct, size = 56, strokeWidth = 5 }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const [offset, setOffset] = useState(circumference)

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (pct / 100) * circumference)
    }, 100)
    return () => clearTimeout(timer)
  }, [pct, circumference])

  return (
    <svg className="progress-ring" width={size} height={size}>
      <circle className="progress-ring-bg" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} fill="none" stroke="var(--border)" />
      <circle className="progress-ring-fill" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} fill="none" stroke={scoreColor(pct)} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" className="progress-ring-text" fill={scoreColor(pct)}>{pct}%</text>
    </svg>
  )
}

// Animated bar for compliance footer with counting number
function AnimatedBar({ pct, label, onClick }) {
  const [width, setWidth] = useState(0)
  const [displayPct, setDisplayPct] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setWidth(pct), 200)
    return () => clearTimeout(timer)
  }, [pct])

  useEffect(() => {
    if (pct === 0) { setDisplayPct(0); return }
    let start = 0
    const duration = 800
    const step = Math.ceil(pct / (duration / 16))
    const id = setInterval(() => {
      start += step
      if (start >= pct) { setDisplayPct(pct); clearInterval(id) }
      else setDisplayPct(start)
    }, 16)
    return () => clearInterval(id)
  }, [pct])

  const cls = scoreClass(pct)
  return (
    <button className="compliance-strip-item" onClick={onClick}>
      <div className="compliance-strip-top">
        <span className="compliance-strip-label">{label}</span>
        <span className={`compliance-strip-score compliance-strip-score--${cls} compliance-strip-score--lg`}>{displayPct}%</span>
      </div>
      <div className="compliance-strip-bar">
        <div className={`compliance-strip-bar-fill compliance-strip-bar-fill--${cls}`} style={{ width: `${width}%` }} />
      </div>
    </button>
  )
}

const ALL_STAFF = [
  'Moniba Jamil', 'Umama Khan', 'Sadaf Subhani', 'Salma Shakoor',
  'Urooj Khan', 'Shain Nawaz', 'Marian Hadaway', 'Jamila Adwan', 'Amjid Shakoor',
]

// Completion modal for ticking off tasks
function CompletionModal({ open, taskName, assignedTo, onSubmit, onClose }) {
  const [completedBy, setCompletedBy] = useState(assignedTo || '')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open) {
      setCompletedBy(assignedTo || '')
      setNotes('')
    }
  }, [open, assignedTo])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!completedBy) return
    onSubmit(taskName, completedBy, notes)
  }

  return (
    <Modal open={open} onClose={onClose} title="Complete Task">
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="label">Task</label>
          <input type="text" className="input" value={taskName || ''} readOnly />
        </div>
        <div className="form-group">
          <label className="label">Completed by *</label>
          <select className="input" value={completedBy} onChange={(e) => setCompletedBy(e.target.value)} required>
            <option value="">Select staff...</option>
            {ALL_STAFF.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="label">Notes</label>
          <textarea className="input input--textarea" placeholder="Optional notes..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>
        <div className="form-group">
          <label className="label">Timestamp</label>
          <input type="text" className="input" value={new Date().toLocaleString('en-GB')} readOnly />
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn--primary btn--complete">Mark Complete</button>
        </div>
      </form>
    </Modal>
  )
}

function KanbanCard({ card, onOpenCompletion, expandedRpCard, setExpandedRpCard, rpChecklist, onToggleRpItem }) {
  const isCleaning = card.category === 'Cleaning'
  const isRp = card.category === 'RP Check'
  const isTemp = card.category === 'Temperature'
  const isExpanded = expandedRpCard === card.id
  const isDone = card.status === 'done'

  const borderClass = isDone
    ? 'kanban-card--done'
    : card.status === 'overdue'
      ? 'kanban-card--overdue'
      : isRp
        ? 'kanban-card--rp'
        : 'kanban-card--due'

  const categoryClass = isRp ? 'kanban-card-pill--rp' : isTemp ? 'kanban-card-pill--temp' : 'kanban-card-pill--clean'

  return (
    <div className={`kanban-card ${borderClass} ${isDone ? 'kanban-card--completed' : ''}`}>
      <div className="kanban-card-row">
        {/* Tick button or done icon */}
        {(isCleaning || isTemp) && !isDone && (
          <button className="kanban-tick-btn" onClick={() => onOpenCompletion(card)} aria-label={`Mark ${card.name} as done`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><circle cx="12" cy="12" r="10" /></svg>
          </button>
        )}
        {(isCleaning || isTemp) && isDone && (
          <span className="kanban-tick-done">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" width="18" height="18">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </span>
        )}
        {isRp && (
          <button className="kanban-tick-btn" onClick={() => setExpandedRpCard(isExpanded ? null : card.id)}>
            <svg viewBox="0 0 24 24" fill="none" stroke={isDone ? 'var(--success)' : 'currentColor'} strokeWidth="2" width="18" height="18">
              {isDone ? (
                <><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>
              ) : (
                <circle cx="12" cy="12" r="10" />
              )}
            </svg>
          </button>
        )}

        {/* Staff avatar */}
        {card.assignedTo && (
          <span className="kanban-avatar" title={card.assignedTo}>{getStaffInitials(card.assignedTo)}</span>
        )}

        <div className="kanban-card-body">
          <span className="kanban-card-name">{card.name}</span>
          <div className="kanban-card-meta">
            <span className={`kanban-card-pill kanban-card-pill--cat ${categoryClass}`}>{card.category}</span>
            {card.dueTime && !isDone && (
              <span className={`kanban-card-due-time ${card.dueTimeOverdue ? 'kanban-card-due-time--overdue' : ''}`}>
                {card.dueTimeOverdue && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                )}
                by {card.dueTime}
              </span>
            )}
            {card.isSummary
              ? <span className="kanban-card-time">{card.doneCount}/{card.total} done</span>
              : card.timestamp && <span className="kanban-card-time">Completed {card.timestamp}</span>}
          </div>
        </div>
      </div>

      {/* RP expanded checklist */}
      {isRp && isExpanded && card.rpItems && (
        <div className="kanban-rp-checklist">
          {card.rpItems.map(item => (
            <label key={item} className="kanban-rp-item">
              <input type="checkbox" checked={!!rpChecklist[item]} onChange={() => onToggleRpItem(item)} />
              <span>{item}</span>
            </label>
          ))}
        </div>
      )}

      {/* Progress bar for RP summary */}
      {card.isSummary && (
        <div className="kanban-card-progress">
          <div className="kanban-card-progress-fill" style={{
            width: `${(card.doneCount / card.total) * 100}%`,
            background: isDone ? 'var(--success)' : card.doneCount === 0 ? 'var(--border)' : 'var(--warning)',
          }} />
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const showToast = useToast()
  const [showOutstanding, setShowOutstanding] = useState(false)
  const [expandedRpCard, setExpandedRpCard] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [clock, setClock] = useState(new Date())
  const [completionModal, setCompletionModal] = useState(null)
  const [mobileTab, setMobileTab] = useState('daily')
  const [dismissedPriorities, setDismissedPriorities] = useState([])
  const [completedAccordion, setCompletedAccordion] = useState({})
  const [collapsedCols, setCollapsedCols] = useState({})
  const [actionInput, setActionInput] = useState('')
  const [actionDueDate, setActionDueDate] = useState('')
  const prevAllDoneRef = useRef({})
  const touchStartX = useRef(null)

  const [documents, , docsLoading] = useSupabase('documents', [])
  const [cleaningEntries, setCleaningEntries] = useSupabase('cleaning_entries', [])
  const [cleaningTasks] = useSupabase('cleaning_tasks', DEFAULT_CLEANING_TASKS)
  const [staffTraining] = useSupabase('staff_training', [])
  const [safeguarding] = useSupabase('safeguarding_records', [])
  const [rpLogs, setRpLogs] = useSupabase('rp_log', [])
  const [staffMembers] = useSupabase('staff_members', [], { valueField: 'name' })
  const [tempLogs] = useSupabase('temperature_logs', [])
  const [actionItems, setActionItems] = useSupabase('action_items', [])

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Today's rotation
  const rpAssignee = getRPAssignee()

  if (docsLoading) {
    return (
      <div className="dashboard">
        <div className="skeleton-topbar" />
        <div className="skeleton-tiles"><div className="skeleton-tile" /><div className="skeleton-tile" /><div className="skeleton-tile" /><div className="skeleton-tile" /><div className="skeleton-tile" /><div className="skeleton-tile" /></div>
        <div className="skeleton-board"><div className="skeleton-col" /><div className="skeleton-col" /><div className="skeleton-col" /></div>
        <div className="skeleton-strip" />
      </div>
    )
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

  // Temp & RP status (needed for both tiles and action count)
  const tempLoggedToday = tempLogs.some(l => l.date === todayStr)
  const allRpItems = [...RP_DAILY, ...RP_WEEKLY, ...RP_FORTNIGHTLY]
  const rpDoneCount = allRpItems.filter(item => !!rpChecklist[item]).length
  const rpComplete = rpDoneCount === allRpItems.length

  // Action required
  const expiredDocs = documents.filter(d => getTrafficLight(d.expiryDate) === 'red')
  const overdueTraining = staffTraining.filter(e => e.status === 'Pending' && e.targetDate && e.targetDate < todayStr)
  const overdueCleaningTasks = taskStatuses.filter(t => t.status === 'overdue')
  const sgDueSoon = safeguarding.filter(r => {
    const s = getSafeguardingStatus(r.trainingDate)
    return s === 'due-soon' || s === 'overdue'
  })
  const tempMissing = !tempLoggedToday ? 1 : 0
  const rpMissing = rpComplete ? 0 : 1
  const totalActionItems = expiredDocs.length + dueSoon.length + overdueTraining.length + overdueCleaningTasks.length + sgDueSoon.length + tempMissing + rpMissing

  // Action badge tooltip breakdown
  const actionBreakdown = []
  if (overdueCleaningTasks.length > 0) actionBreakdown.push(`Cleaning tasks overdue: ${overdueCleaningTasks.length}`)
  if (overdueTraining.length > 0) actionBreakdown.push(`Training records overdue: ${overdueTraining.length}`)
  if (expiredDocs.length > 0) actionBreakdown.push(`Documents expired: ${expiredDocs.length}`)
  if (dueSoon.length > 0) actionBreakdown.push(`Documents expiring soon: ${dueSoon.length}`)
  if (tempMissing > 0) actionBreakdown.push(`Temperature log missing: ${tempMissing}`)
  if (rpMissing > 0) actionBreakdown.push(`RP log missing: ${rpMissing}`)
  if (sgDueSoon.length > 0) actionBreakdown.push(`Safeguarding due: ${sgDueSoon.length}`)
  const tooltipText = actionBreakdown.join('\n')

  const complianceAreas = [
    { label: 'Documents', score: docScore, nav: '/documents' },
    { label: 'Training', score: staffScore, nav: '/staff-training' },
    { label: 'Cleaning', score: cleaningScore, nav: '/cleaning' },
    { label: 'Safeguarding', score: sgScore, nav: '/safeguarding' },
  ]

  // Trend arrows
  const storedScores = JSON.parse(localStorage.getItem('ipd_weekly_scores') || '{}')
  const trends = {}
  complianceAreas.forEach(a => {
    const prev = storedScores[a.label]
    if (prev !== undefined && prev !== a.score) {
      trends[a.label] = a.score > prev ? 'up' : 'down'
    }
  })

  const weekKey = `${new Date().getFullYear()}-W${Math.ceil((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}`
  if (localStorage.getItem('ipd_score_week') !== weekKey) {
    const scores = {}
    complianceAreas.forEach(a => { scores[a.label] = a.score })
    localStorage.setItem('ipd_weekly_scores', JSON.stringify(scores))
    localStorage.setItem('ipd_score_week', weekKey)
  }

  // Today's priorities — top 3 most urgent items
  const priorities = []
  overdueCleaningTasks.slice(0, 2).forEach(t => {
    priorities.push({ id: `clean-${t.name}`, label: t.name, type: 'overdue', nav: '/cleaning?add=true' })
  })
  expiredDocs.slice(0, 1).forEach(d => {
    priorities.push({ id: `doc-${d.id}`, label: d.documentName, type: 'expired', nav: '/documents' })
  })
  const activePriorities = priorities.filter(p => !dismissedPriorities.includes(p.id)).slice(0, 3)

  // Build kanban columns by frequency
  const buildColumn = (freq) => {
    const cards = []
    const freqTasks = taskStatuses.filter(t => t.frequency === freq)
    freqTasks.forEach((task, taskIndex) => {
      if (task.status === 'upcoming') return
      const latestEntry = task.status === 'done'
        ? cleaningEntries
            .filter(e => e.taskName === task.name)
            .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime))[0]
        : null
      const dueTime = TASK_DUE_TIMES[task.name] || null
      cards.push({
        id: `cleaning-${task.name}`,
        name: task.name,
        category: 'Cleaning',
        status: task.status,
        assignedTo: getTaskAssignee(task.name, freq, taskIndex),
        timestamp: latestEntry
          ? new Date(latestEntry.dateTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
          : null,
        dueTime: freq === 'daily' ? dueTime : null,
        dueTimeOverdue: dueTime && task.status !== 'done' && isTimePast(dueTime),
      })
    })
    const rpGroup = RP_GROUPS.find(g => g.frequency === freq)
    if (rpGroup) {
      const doneCount = rpGroup.items.filter(name => !!rpChecklist[name]).length
      const total = rpGroup.items.length
      const rpDueTime = freq === 'daily' ? RP_DAILY_DUE_TIME : null
      cards.push({
        id: `rp-summary-${freq}`,
        name: `${rpGroup.label} RP Checks`,
        category: 'RP Check',
        status: doneCount === total ? 'done' : 'due',
        isSummary: true,
        doneCount,
        total,
        rpItems: rpGroup.items,
        assignedTo: rpAssignee,
        dueTime: rpDueTime,
        dueTimeOverdue: rpDueTime && doneCount < total && isTimePast(rpDueTime),
      })
    }
    // Sort: done cards go to bottom
    cards.sort((a, b) => {
      if (a.status === 'done' && b.status !== 'done') return 1
      if (a.status !== 'done' && b.status === 'done') return -1
      return 0
    })
    return cards
  }

  const todayCards = buildColumn('daily')
  const weeklyCards = buildColumn('weekly')
  const fortnightlyCards = buildColumn('fortnightly')
  const monthlyCards = buildColumn('monthly')

  // Filter by search
  const filterCards = (cards) => {
    if (!searchTerm.trim()) return cards
    const term = searchTerm.toLowerCase()
    return cards.filter(c => c.name.toLowerCase().includes(term) || c.category.toLowerCase().includes(term))
  }

  const filteredToday = filterCards(todayCards)
  const filteredWeekly = filterCards(weeklyCards)
  const filteredFortnightly = filterCards(fortnightlyCards)
  const filteredMonthly = filterCards(monthlyCards)

  // Split cards into active and completed for accordion
  const splitCards = (cards) => {
    const active = cards.filter(c => c.status !== 'done')
    const completed = cards.filter(c => c.status === 'done')
    return { active, completed }
  }

  // Column progress
  const colProgress = (cards) => {
    const done = cards.filter(c => c.status === 'done').length
    return { done, total: cards.length }
  }

  // Confetti trigger
  const triggerConfetti = (colKey) => {
    if (prevAllDoneRef.current[colKey]) return
    prevAllDoneRef.current[colKey] = true
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#166534', '#22C55E', '#4ADE80', '#86EFAC'],
    })
  }

  const columns = [
    { key: 'daily', title: 'Today', cards: filteredToday, allCards: todayCards },
    { key: 'weekly', title: 'Weekly', cards: filteredWeekly, allCards: weeklyCards },
    { key: 'fortnightly', title: 'Fortnightly', cards: filteredFortnightly, allCards: fortnightlyCards },
    { key: 'monthly', title: 'Monthly', cards: filteredMonthly, allCards: monthlyCards },
  ]

  const tabOrder = columns.map(c => c.key)

  columns.forEach(col => {
    const prog = colProgress(col.allCards)
    if (prog.total > 0 && prog.done === prog.total) {
      triggerConfetti(col.key)
    }
  })

  // Mobile swipe between kanban tabs
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const diff = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(diff) < 50) return
    const currentIdx = tabOrder.indexOf(mobileTab)
    if (diff < 0 && currentIdx < tabOrder.length - 1) setMobileTab(tabOrder[currentIdx + 1])
    if (diff > 0 && currentIdx > 0) setMobileTab(tabOrder[currentIdx - 1])
  }

  // Tick-off via completion modal
  const handleOpenCompletion = (card) => {
    setCompletionModal({
      taskName: card.name,
      assignedTo: card.assignedTo || '',
    })
  }

  const handleCompleteTask = (taskName, staffMember, notes) => {
    const nowDt = new Date()
    const newEntry = {
      id: generateId(),
      taskName,
      dateTime: nowDt.toISOString().slice(0, 16),
      staffMember,
      result: 'Pass',
      notes: notes || 'Completed from dashboard',
      createdAt: nowDt.toISOString(),
    }
    setCleaningEntries([...cleaningEntries, newEntry])
    setCompletionModal(null)
    showToast(`${taskName} marked complete`)
  }

  const handleToggleRpItem = (itemName) => {
    const updatedChecklist = { ...rpChecklist, [itemName]: !rpChecklist[itemName] }
    if (todayRp) {
      setRpLogs(rpLogs.map(l =>
        l.id === todayRp.id ? { ...l, checklist: updatedChecklist } : l
      ))
    } else {
      setRpLogs([...rpLogs, {
        id: generateId(),
        date: todayStr,
        rpName: rpAssignee || 'Dashboard',
        checklist: updatedChecklist,
        notes: '',
        createdAt: new Date().toISOString(),
      }])
    }
  }

  // Mark all done in a column
  const handleMarkAllDone = (cards) => {
    const nowDt = new Date()
    const newEntries = []
    cards.forEach(card => {
      if (card.category === 'Cleaning' && card.status !== 'done') {
        newEntries.push({
          id: generateId(),
          taskName: card.name,
          dateTime: nowDt.toISOString().slice(0, 16),
          staffMember: card.assignedTo || staffMembers[0] || 'Staff',
          result: 'Pass',
          notes: 'Bulk completed from dashboard',
          createdAt: nowDt.toISOString(),
        })
      }
      if (card.category === 'RP Check' && card.rpItems) {
        card.rpItems.forEach(item => {
          if (!rpChecklist[item]) {
            rpChecklist[item] = true
          }
        })
      }
    })
    if (newEntries.length > 0) {
      setCleaningEntries([...cleaningEntries, ...newEntries])
    }
    const rpCards = cards.filter(c => c.category === 'RP Check' && c.rpItems)
    if (rpCards.length > 0) {
      const updatedChecklist = { ...rpChecklist }
      rpCards.forEach(c => c.rpItems.forEach(item => { updatedChecklist[item] = true }))
      if (todayRp) {
        setRpLogs(rpLogs.map(l =>
          l.id === todayRp.id ? { ...l, checklist: updatedChecklist } : l
        ))
      } else {
        setRpLogs([...rpLogs, {
          id: generateId(),
          date: todayStr,
          rpName: rpAssignee || 'Dashboard',
          checklist: updatedChecklist,
          notes: '',
          createdAt: new Date().toISOString(),
        }])
      }
    }
    showToast('All tasks marked complete')
  }

  // Action items helpers
  const addAction = (e) => {
    e.preventDefault()
    const title = actionInput.trim()
    if (!title) return
    setActionItems([...actionItems, {
      id: generateId(),
      title,
      dueDate: actionDueDate || '',
      completed: false,
      createdAt: new Date().toISOString(),
    }])
    setActionInput('')
    setActionDueDate('')
    showToast('Action added')
  }

  const toggleAction = (id) => {
    setActionItems(actionItems.map(a =>
      a.id === id ? { ...a, completed: !a.completed } : a
    ))
  }

  const deleteAction = (id) => {
    setActionItems(actionItems.filter(a => a.id !== id))
  }

  const pendingActions = actionItems.filter(a => !a.completed).sort((a, b) => {
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
    if (a.dueDate) return -1
    if (b.dueDate) return 1
    return 0
  })
  const doneActions = actionItems.filter(a => a.completed)

  // Last updated timestamp
  const lastUpdated = clock.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  // Tile data
  const dailyDueCount = taskStatuses.filter(t => t.frequency === 'daily' && (t.status === 'due' || t.status === 'overdue')).length
  const docsExpiring = documents.filter(d => { const tl = getTrafficLight(d.expiryDate); return tl === 'red' || tl === 'amber' }).length
  const trainingOverdue = overdueTraining.length

  const tiles = [
    { key: 'cleaning', icon: TILE_ICONS.cleaning, title: 'Cleaning Rota', stat: `${dailyDueCount} due today`, nav: '/cleaning', cls: 'tile--green', pct: cleaningScore, warn: dailyDueCount > 0 },
    { key: 'documents', icon: TILE_ICONS.documents, title: 'Documents', stat: `${docsExpiring} expiring`, nav: '/documents', cls: 'tile--blue', pct: docScore, warn: docsExpiring > 0 },
    { key: 'training', icon: TILE_ICONS.training, title: 'Staff Training', stat: `${trainingOverdue} overdue`, nav: '/staff-training', cls: 'tile--purple', pct: staffScore, warn: trainingOverdue > 0 },
    { key: 'safeguarding', icon: TILE_ICONS.safeguarding, title: 'Safeguarding', stat: `${sgScore}% compliant`, nav: '/safeguarding', cls: 'tile--teal', pct: sgScore, warn: sgScore < 100 },
    { key: 'temperature', icon: TILE_ICONS.temperature, title: 'Temp Log', stat: tempLoggedToday ? '\u2713 Logged' : 'NOT YET', statOk: tempLoggedToday, nav: '/temperature', cls: 'tile--orange', pct: tempLoggedToday ? 100 : 0, warn: !tempLoggedToday },
    { key: 'rplog', icon: TILE_ICONS.rplog, title: 'RP Log', stat: rpComplete ? '\u2713 Complete' : 'NOT YET', statOk: rpComplete, nav: '/rp-log', cls: 'tile--rose', pct: allRpItems.length > 0 ? Math.round((rpDoneCount / allRpItems.length) * 100) : 100, warn: !rpComplete },
  ]

  return (
    <div className="dashboard">
      {/* === TOP BAR === */}
      <div className="dash-topbar no-print">
        <div className="dash-topbar-left">
          <h1 className="dash-topbar-greeting">{getGreeting()}, Salma</h1>
          <p className="dash-topbar-date">
            {clock.toLocaleDateString('en-GB', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
            <span className="dash-topbar-clock">
              {clock.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </p>
        </div>

        <div className="dash-topbar-center">
          {totalActionItems > 0 ? (
            <button
              className="dash-topbar-badge dash-topbar-badge--action dash-pulse"
              onClick={() => setShowOutstanding(!showOutstanding)}
              title={tooltipText}
            >
              <span className="dash-topbar-badge-count">{totalActionItems}</span>
              <span className="dash-topbar-badge-label">Action{totalActionItems !== 1 ? 's' : ''} needed</span>
            </button>
          ) : (
            <span className="dash-topbar-badge dash-topbar-badge--clear">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              All Clear
            </span>
          )}
        </div>

        <div className="dash-topbar-right">
          <span className="dash-topbar-synced">Updated {lastUpdated}</span>
          <ProgressRing pct={overallScore} />
          <button className="btn btn--ghost btn--sm" onClick={() => window.print()} title="Print compliance report">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
          </button>
        </div>
      </div>

      {/* === TODAY'S PRIORITIES STRIP === */}
      {activePriorities.length > 0 && (
        <div className="dash-priorities no-print">
          <span className="dash-priorities-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Priorities
          </span>
          {activePriorities.map(p => (
            <button key={p.id} className={`dash-priority-chip dash-priority-chip--${p.type}`} onClick={() => navigate(p.nav)}>
              {p.label}
              <span className="dash-priority-dismiss" onClick={(e) => { e.stopPropagation(); setDismissedPriorities(prev => [...prev, p.id]) }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </span>
            </button>
          ))}
        </div>
      )}

      {/* === QUICK-NAV TILE GRID === */}
      <div className="dash-tiles no-print">
        {tiles.map((t, i) => (
          <button
            key={t.key}
            className={`dash-tile ${t.cls} ${t.warn && !t.statOk ? 'dash-tile--shimmer' : ''}`}
            onClick={() => navigate(t.nav)}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <span className="dash-tile-icon">{t.icon}</span>
            <div className="dash-tile-content">
              <span className="dash-tile-title">{t.title}</span>
              <span className={`dash-tile-stat ${t.statOk === true ? 'dash-tile-stat--ok' : ''} ${t.statOk === false ? 'dash-tile-stat--warn' : ''}`}>
                {t.stat}
              </span>
            </div>
            <span className="dash-tile-arrow">&rarr;</span>
            {/* Progress bar along bottom */}
            <div className="dash-tile-progress">
              <div className="dash-tile-progress-fill" style={{ width: `${t.pct}%` }} />
            </div>
          </button>
        ))}
      </div>

      {/* === SEARCH BAR === */}
      <div className="dash-search no-print">
        <svg className="dash-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          className="dash-search-input"
          placeholder="Filter tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button className="dash-search-clear" onClick={() => setSearchTerm('')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* === MOBILE TAB BAR === */}
      <div className="kanban-tabs no-print">
        {columns.map(col => (
          <button
            key={col.key}
            className={`kanban-tab ${mobileTab === col.key ? 'kanban-tab--active' : ''}`}
            onClick={() => setMobileTab(col.key)}
          >
            {col.title}
            <span className="kanban-tab-count">{col.cards.length}</span>
          </button>
        ))}
      </div>

      {/* === KANBAN BOARD === */}
      <div className="kanban-board no-print" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {columns.map(col => {
          const prog = colProgress(col.allCards)
          const allDone = prog.total > 0 && prog.done === prog.total
          const { active, completed } = splitCards(col.cards)
          const accordionOpen = !!completedAccordion[col.key]
          const isCollapsed = !!collapsedCols[col.key]
          return (
            <div key={col.key} className={`kanban-column ${mobileTab === col.key ? 'kanban-column--mobile-active' : ''} ${isCollapsed ? 'kanban-column--collapsed' : ''}`}>
              <div className="kanban-column-header kanban-column-header--sticky" onClick={() => setCollapsedCols(prev => ({ ...prev, [col.key]: !prev[col.key] }))} style={{ cursor: 'pointer' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" className={`kanban-collapse-chevron ${isCollapsed ? 'kanban-collapse-chevron--closed' : ''}`}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                <span className="kanban-column-title">{col.title}</span>
                <span className="kanban-column-count">{prog.done}/{prog.total}</span>
                {!allDone && prog.total > 0 && !isCollapsed && (
                  <button className="kanban-markall-btn" onClick={(e) => { e.stopPropagation(); handleMarkAllDone(col.allCards) }} title="Mark all done">
                    &#10003; All
                  </button>
                )}
              </div>
              {/* Column progress bar */}
              <div className="kanban-col-progress">
                <div className="kanban-col-progress-fill" style={{
                  width: prog.total > 0 ? `${(prog.done / prog.total) * 100}%` : '0%',
                  background: allDone ? 'var(--success)' : prog.done > 0 ? 'var(--warning)' : 'var(--border)',
                }} />
              </div>
              {!isCollapsed && <div className="kanban-cards">
                {allDone ? (
                  <div className="kanban-all-done">
                    <svg className="kanban-all-done-icon" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" width="32" height="32">
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span className="kanban-all-done-text">All done!</span>
                  </div>
                ) : active.length === 0 && completed.length === 0 ? (
                  <p className="kanban-empty">{searchTerm ? 'No matches' : 'No tasks'}</p>
                ) : (
                  <>
                    {active.map(card => (
                      <KanbanCard
                        key={card.id}
                        card={card}
                        onOpenCompletion={handleOpenCompletion}
                        expandedRpCard={expandedRpCard}
                        setExpandedRpCard={setExpandedRpCard}
                        rpChecklist={rpChecklist}
                        onToggleRpItem={handleToggleRpItem}
                      />
                    ))}
                  </>
                )}
                {/* Completed accordion */}
                {completed.length > 0 && !allDone && (
                  <div className="kanban-completed-accordion">
                    <button
                      className="kanban-completed-toggle"
                      onClick={() => setCompletedAccordion(prev => ({ ...prev, [col.key]: !prev[col.key] }))}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" width="14" height="14">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      Completed ({completed.length})
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" className={`kanban-accordion-chevron ${accordionOpen ? 'kanban-accordion-chevron--open' : ''}`}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {accordionOpen && completed.map(card => (
                      <KanbanCard
                        key={card.id}
                        card={card}
                        onOpenCompletion={handleOpenCompletion}
                        expandedRpCard={expandedRpCard}
                        setExpandedRpCard={setExpandedRpCard}
                        rpChecklist={rpChecklist}
                        onToggleRpItem={handleToggleRpItem}
                      />
                    ))}
                  </div>
                )}
              </div>}
            </div>
          )
        })}
      </div>

      {/* === COMPLIANCE FOOTER STRIP === */}
      <div className="compliance-strip no-print">
        {complianceAreas.map(item => (
          <AnimatedBar
            key={item.label}
            pct={item.score}
            label={
              <>
                {item.label}
                {trends[item.label] && (
                  <span className={`trend-arrow trend-arrow--${trends[item.label]}`}>
                    {trends[item.label] === 'up' ? '\u2191' : '\u2193'}
                  </span>
                )}
              </>
            }
            onClick={() => navigate(item.nav)}
          />
        ))}
      </div>

      {/* === IMPORTANT ACTIONS === */}
      <div className="dash-actions-section no-print">
        <h3 className="dash-actions-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          Important Actions
          {pendingActions.length > 0 && <span className="dash-actions-count">{pendingActions.length}</span>}
        </h3>
        <form className="dash-actions-add" onSubmit={addAction}>
          <input
            type="text"
            className="input"
            placeholder="Add an action item..."
            value={actionInput}
            onChange={(e) => setActionInput(e.target.value)}
          />
          <input
            type="date"
            className="input dash-actions-date"
            value={actionDueDate}
            onChange={(e) => setActionDueDate(e.target.value)}
          />
          <button type="submit" className="btn btn--primary btn--sm">Add</button>
        </form>
        {pendingActions.length === 0 && doneActions.length === 0 && (
          <p className="dash-actions-empty">No action items yet.</p>
        )}
        {pendingActions.map(a => (
          <div key={a.id} className="dash-action-item">
            <button className="dash-action-check" onClick={() => toggleAction(a.id)} aria-label="Mark done">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <circle cx="12" cy="12" r="10" />
              </svg>
            </button>
            <div className="dash-action-body">
              <span className="dash-action-title">{a.title}</span>
              {a.dueDate && (
                <span className={`dash-action-due ${a.dueDate < todayStr ? 'dash-action-due--overdue' : ''}`}>
                  {a.dueDate < todayStr ? 'Overdue' : 'Due'} {formatDate(a.dueDate)}
                </span>
              )}
            </div>
            <button className="dash-action-delete" onClick={() => deleteAction(a.id)} aria-label="Delete">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
        {doneActions.length > 0 && (
          <details className="dash-actions-done">
            <summary>Completed ({doneActions.length})</summary>
            {doneActions.map(a => (
              <div key={a.id} className="dash-action-item dash-action-item--done">
                <button className="dash-action-check dash-action-check--done" onClick={() => toggleAction(a.id)} aria-label="Undo">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" width="16" height="16">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </button>
                <span className="dash-action-title dash-action-title--done">{a.title}</span>
                <button className="dash-action-delete" onClick={() => deleteAction(a.id)} aria-label="Delete">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </details>
        )}
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
              {overdueTraining.slice(0, 10).map(e => (
                <button key={e.id} className="outstanding-item" onClick={() => navigate('/staff-training')}>
                  <span className="outstanding-item-name">{e.staffName}</span>
                  <span className="outstanding-item-freq">{e.trainingItem}</span>
                  <span className="outstanding-item-badge outstanding-item-badge--overdue">Pending</span>
                </button>
              ))}
              {overdueTraining.length > 10 && (
                <button className="outstanding-item" onClick={() => navigate('/staff-training')}>
                  <span className="outstanding-item-name">+ {overdueTraining.length - 10} more</span>
                </button>
              )}
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
          <h2>Today&apos;s Tasks Checklist</h2>
          <table className="print-table">
            <thead><tr><th></th><th>Task</th><th>Frequency</th><th>Status</th></tr></thead>
            <tbody>
              {[...todayCards, ...weeklyCards, ...fortnightlyCards, ...monthlyCards].map(c => (
                <tr key={c.id}>
                  <td>{c.status === 'done' ? '\u2611' : '\u2610'}</td>
                  <td>{c.name}</td>
                  <td>{c.category}</td>
                  <td>{c.status === 'done' ? 'Done' : c.status === 'overdue' ? 'Overdue' : 'Due'}</td>
                </tr>
              ))}
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

      {/* Completion Modal */}
      <CompletionModal
        open={!!completionModal}
        taskName={completionModal?.taskName || ''}
        assignedTo={completionModal?.assignedTo || ''}
        onSubmit={handleCompleteTask}
        onClose={() => setCompletionModal(null)}
      />
    </div>
  )
}
