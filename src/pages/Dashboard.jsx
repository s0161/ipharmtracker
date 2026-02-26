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
} from '../utils/helpers'

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

// SVG Progress Ring component
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
      <circle
        className="progress-ring-bg"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        fill="none"
        stroke="var(--border)"
      />
      <circle
        className="progress-ring-fill"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        fill="none"
        stroke={scoreColor(pct)}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="progress-ring-text"
        fill={scoreColor(pct)}
      >
        {pct}%
      </text>
    </svg>
  )
}

// Animated bar component for compliance footer
function AnimatedBar({ pct, label, onClick }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const timer = setTimeout(() => setWidth(pct), 200)
    return () => clearTimeout(timer)
  }, [pct])

  const cls = scoreClass(pct)

  return (
    <button className="compliance-strip-item" onClick={onClick}>
      <div className="compliance-strip-top">
        <span className="compliance-strip-label">{label}</span>
        <span className={`compliance-strip-score compliance-strip-score--${cls}`}>{pct}%</span>
      </div>
      <div className="compliance-strip-bar">
        <div
          className={`compliance-strip-bar-fill compliance-strip-bar-fill--${cls}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </button>
  )
}

function KanbanCard({ card, tickingCardId, setTickingCardId, expandedRpCard, setExpandedRpCard, staffMembers, onTickCleaning, rpChecklist, onToggleRpItem }) {
  const isCleaning = card.category === 'Cleaning'
  const isRp = card.category === 'RP Check'
  const isTickOpen = tickingCardId === card.id
  const isExpanded = expandedRpCard === card.id
  const isDone = card.status === 'done'

  const borderClass = isDone
    ? 'kanban-card--done'
    : card.status === 'overdue'
      ? 'kanban-card--overdue'
      : isRp
        ? 'kanban-card--rp'
        : 'kanban-card--due'

  return (
    <div className={`kanban-card ${borderClass} ${isDone ? 'kanban-card--completed' : ''}`}>
      <div className="kanban-card-row">
        {/* Tick button */}
        {isCleaning && !isDone && (
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
        {isCleaning && isDone && (
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
            <svg viewBox="0 0 24 24" fill="none" stroke={isDone ? 'var(--success)' : 'currentColor'} strokeWidth="2" width="18" height="18">
              {isDone ? (
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
            <span className={`kanban-card-pill kanban-card-pill--cat ${isRp ? 'kanban-card-pill--rp' : ''}`}>{card.category}</span>
            {card.isSummary
              ? <span className="kanban-card-time">{card.doneCount}/{card.total} done</span>
              : card.timestamp && <span className="kanban-card-time">Completed {card.timestamp}</span>}
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
              background: isDone ? 'var(--success)' : card.doneCount === 0 ? 'var(--border)' : 'var(--warning)',
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
  const [searchTerm, setSearchTerm] = useState('')
  const [clock, setClock] = useState(new Date())
  const prevAllDoneRef = useRef({})

  const [documents, , docsLoading] = useSupabase('documents', [])
  const [cleaningEntries, setCleaningEntries] = useSupabase('cleaning_entries', [])
  const [cleaningTasks] = useSupabase('cleaning_tasks', DEFAULT_CLEANING_TASKS)
  const [staffTraining] = useSupabase('staff_training', [])
  const [safeguarding] = useSupabase('safeguarding_records', [])
  const [rpLogs, setRpLogs] = useSupabase('rp_log', [])
  const [staffMembers] = useSupabase('staff_members', [], { valueField: 'name' })
  const [tempLogs] = useSupabase('temperature_logs', [])

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  if (docsLoading) {
    return (
      <div className="dashboard">
        <div className="skeleton-topbar" />
        <div className="skeleton-board">
          <div className="skeleton-col" /><div className="skeleton-col" /><div className="skeleton-col" />
        </div>
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

  // Trend arrows — compare with last week's stored score
  const storedScores = JSON.parse(localStorage.getItem('ipd_weekly_scores') || '{}')
  const trends = {}
  complianceAreas.forEach(a => {
    const prev = storedScores[a.label]
    if (prev !== undefined && prev !== a.score) {
      trends[a.label] = a.score > prev ? 'up' : 'down'
    }
  })

  // Store current scores weekly (once per week)
  const weekKey = `${new Date().getFullYear()}-W${Math.ceil((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}`
  if (localStorage.getItem('ipd_score_week') !== weekKey) {
    const scores = {}
    complianceAreas.forEach(a => { scores[a.label] = a.score })
    localStorage.setItem('ipd_weekly_scores', JSON.stringify(scores))
    localStorage.setItem('ipd_score_week', weekKey)
  }

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

  // Filter by search
  const filterCards = (cards) => {
    if (!searchTerm.trim()) return cards
    const term = searchTerm.toLowerCase()
    return cards.filter(c => c.name.toLowerCase().includes(term) || c.category.toLowerCase().includes(term))
  }

  const filteredToday = filterCards(todayCards)
  const filteredWeekly = filterCards(weeklyCards)
  const filteredFortnightly = filterCards(fortnightlyCards)

  // Column progress
  const colProgress = (cards) => {
    const done = cards.filter(c => c.status === 'done').length
    return { done, total: cards.length }
  }

  // Confetti trigger
  const triggerConfetti = (colKey) => {
    if (prevAllDoneRef.current[colKey]) return // already celebrated
    prevAllDoneRef.current[colKey] = true
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#166534', '#22C55E', '#4ADE80', '#86EFAC'],
    })
  }

  // Check if all done in each column
  const columns = [
    { key: 'daily', title: 'Today', cards: filteredToday, allCards: todayCards },
    { key: 'weekly', title: 'Weekly', cards: filteredWeekly, allCards: weeklyCards },
    { key: 'fortnightly', title: 'Fortnightly', cards: filteredFortnightly, allCards: fortnightlyCards },
  ]

  columns.forEach(col => {
    const prog = colProgress(col.allCards)
    if (prog.total > 0 && prog.done === prog.total) {
      triggerConfetti(col.key)
    }
  })

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

  // Mark all done in a column
  const handleMarkAllDone = (cards) => {
    const nowDt = new Date()
    const newEntries = []
    cards.forEach(card => {
      if (card.category === 'Cleaning' && card.status !== 'done') {
        newEntries.push({
          id: crypto.randomUUID(),
          taskName: card.name,
          dateTime: nowDt.toISOString().slice(0, 16),
          staffMember: staffMembers[0] || 'Staff',
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
    // Update RP checklist
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
          id: crypto.randomUUID(),
          date: todayStr,
          rpName: 'Dashboard',
          checklist: updatedChecklist,
          notes: '',
          createdAt: new Date().toISOString(),
        }])
      }
    }
  }

  return (
    <div className="dashboard">
      {/* === TOP BAR === */}
      <div className="dash-topbar no-print">
        <div className="dash-topbar-left">
          <h1 className="dash-topbar-greeting">{getGreeting()}</h1>
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

      {/* === QUICK-NAV TILE GRID === */}
      {(() => {
        const dailyDueCount = taskStatuses.filter(t => t.frequency === 'daily' && (t.status === 'due' || t.status === 'overdue')).length
        const docsExpiring = documents.filter(d => { const tl = getTrafficLight(d.expiryDate); return tl === 'red' || tl === 'amber' }).length
        const trainingOverdue = overdueTraining.length
        const tempLoggedToday = tempLogs.some(l => l.date === todayStr)
        const allRpItems = [...RP_DAILY, ...RP_WEEKLY, ...RP_FORTNIGHTLY]
        const rpDoneCount = allRpItems.filter(item => !!rpChecklist[item]).length
        const rpComplete = rpDoneCount === allRpItems.length

        const tiles = [
          { icon: '🧹', title: 'Cleaning Rota', stat: `${dailyDueCount} due today`, nav: '/cleaning', cls: 'tile--green' },
          { icon: '📄', title: 'Documents', stat: `${docsExpiring} expiring`, nav: '/documents', cls: 'tile--blue' },
          { icon: '👥', title: 'Staff Training', stat: `${trainingOverdue} overdue`, nav: '/staff-training', cls: 'tile--purple' },
          { icon: '🛡️', title: 'Safeguarding', stat: `${sgScore}% compliant`, nav: '/safeguarding', cls: 'tile--teal' },
          { icon: '🌡️', title: 'Temp Log', stat: tempLoggedToday ? 'YES' : 'NOT YET', statOk: tempLoggedToday, nav: '/temperature', cls: 'tile--orange' },
          { icon: '📋', title: 'RP Log', stat: rpComplete ? 'YES' : 'NOT YET', statOk: rpComplete, nav: '/rp-log', cls: 'tile--rose' },
        ]

        return (
          <div className="dash-tiles no-print">
            {tiles.map(t => (
              <button key={t.title} className={`dash-tile ${t.cls}`} onClick={() => navigate(t.nav)}>
                <span className="dash-tile-icon">{t.icon}</span>
                <div className="dash-tile-content">
                  <span className="dash-tile-title">{t.title}</span>
                  <span className={`dash-tile-stat ${t.statOk === true ? 'dash-tile-stat--ok' : ''} ${t.statOk === false ? 'dash-tile-stat--warn' : ''}`}>
                    {t.stat}
                  </span>
                </div>
                <span className="dash-tile-arrow">&rarr;</span>
              </button>
            ))}
          </div>
        )
      })()}

      {/* === SEARCH BAR === */}
      <div className="dash-search no-print">
        <svg className="dash-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
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

      {/* === KANBAN BOARD === */}
      <div className="kanban-board no-print">
        {columns.map(col => {
          const prog = colProgress(col.allCards)
          const allDone = prog.total > 0 && prog.done === prog.total
          return (
            <div key={col.key} className="kanban-column">
              <div className="kanban-column-header">
                <span className="kanban-column-title">{col.title}</span>
                <span className="kanban-column-count">{col.cards.length}</span>
                {!allDone && prog.total > 0 && (
                  <button
                    className="kanban-markall-btn"
                    onClick={() => handleMarkAllDone(col.allCards)}
                    title="Mark all done"
                  >
                    ✓ All
                  </button>
                )}
              </div>
              {/* Column progress bar */}
              <div className="kanban-col-progress">
                <div
                  className="kanban-col-progress-fill"
                  style={{
                    width: prog.total > 0 ? `${(prog.done / prog.total) * 100}%` : '0%',
                    background: allDone ? 'var(--success)' : prog.done > 0 ? 'var(--warning)' : 'var(--border)',
                  }}
                />
              </div>
              <div className="kanban-cards">
                {col.cards.length === 0 ? (
                  <p className="kanban-empty">{searchTerm ? 'No matches' : 'No tasks'}</p>
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
                    {trends[item.label] === 'up' ? '↑' : '↓'}
                  </span>
                )}
              </>
            }
            onClick={() => navigate(item.nav)}
          />
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
          <h2>Today&apos;s Tasks Checklist</h2>
          <table className="print-table">
            <thead><tr><th></th><th>Task</th><th>Frequency</th><th>Status</th></tr></thead>
            <tbody>
              {[...todayCards, ...weeklyCards, ...fortnightlyCards].map(c => (
                <tr key={c.id}>
                  <td>{c.status === 'done' ? '☑' : '☐'}</td>
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
    </div>
  )
}
