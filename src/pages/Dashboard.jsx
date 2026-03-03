import { useState, useEffect, useRef, useMemo } from 'react'
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
import { getTaskAssignee, getRPAssignee, getStaffInitials, getTasksForStaff } from '../utils/rotationManager'
import { useUser } from '../contexts/UserContext'
import { useToast } from '../components/Toast'
import {
  AlertBanner,
  ActionCounter,
  ComplianceCards,
  TaskAccordion,
  CompletionModal,
  ProgressRing,
} from '../components/dashboard'

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

export default function Dashboard() {
  const navigate = useNavigate()
  const showToast = useToast()
  const { user } = useUser()
  const [showOutstanding, setShowOutstanding] = useState(false)
  const [expandedRpCard, setExpandedRpCard] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [clock, setClock] = useState(new Date())
  const [completionModal, setCompletionModal] = useState(null)
  const [mobileTab, setMobileTab] = useState('daily')
  const [dismissedPriorities, setDismissedPriorities] = useState([])
  const [completedAccordion, setCompletedAccordion] = useState({})
  const [collapsedCols, setCollapsedCols] = useState({ weekly: true, fortnightly: true, monthly: true })
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
  const [actionItems, setActionItems] = useSupabase('action_items', [
    { id: 'default-1', title: 'Chase up patient feedback', dueDate: '2026-03-06', completed: false, createdAt: '2026-02-27T09:00:00.000Z' },
    { id: 'default-2', title: 'Chase up website', dueDate: '2026-03-06', completed: false, createdAt: '2026-02-27T09:00:00.000Z' },
    { id: 'default-3', title: 'Parking bay council request', dueDate: '2026-03-06', completed: false, createdAt: '2026-02-27T09:00:00.000Z' },
    { id: 'default-4', title: 'Chase up medicinal waste documents', dueDate: '2026-03-06', completed: false, createdAt: '2026-02-27T09:00:00.000Z' },
  ])
  const [assignedTasks, setAssignedTasks] = useSupabase('assigned_tasks', [])

  // Clock (updates every minute for "Updated HH:MM")
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 60000)
    return () => clearInterval(id)
  }, [])

  // Today's rotation
  const rpAssignee = getRPAssignee()
  const todayISO = new Date().toISOString().slice(0, 10)

  // --- My Tasks on Dashboard ---
  const myRotationTasks = useMemo(
    () => (user ? getTasksForStaff(user.name, cleaningTasks) : []),
    [user, cleaningTasks]
  )
  const myAssigned = useMemo(
    () => assignedTasks.filter((t) => t.staffName === user?.name && t.date === todayISO),
    [assignedTasks, user, todayISO]
  )

  function isDashRotationDone(taskName) {
    return cleaningEntries.some(
      (e) => e.taskName === taskName && e.dateTime?.startsWith(todayISO)
    )
  }

  function dashCompleteRotation(taskName) {
    const entry = {
      id: generateId(),
      taskName,
      dateTime: new Date().toISOString().slice(0, 16),
      staffMember: user.name,
      result: 'Pass',
      notes: '',
      createdAt: new Date().toISOString(),
    }
    setCleaningEntries((prev) => [...prev, entry])
    showToast(`${taskName} marked done`)
  }

  function dashToggleAssigned(task) {
    const updated = assignedTasks.map((t) =>
      t.id === task.id
        ? { ...t, completed: !t.completed, completedBy: !t.completed ? user.name : null, completedAt: !t.completed ? new Date().toISOString() : null }
        : t
    )
    setAssignedTasks(updated)
    showToast(task.completed ? 'Task reopened' : 'Task done')
  }

  const myDoneCount = myRotationTasks.filter((t) => isDashRotationDone(t.name)).length + myAssigned.filter((t) => t.completed).length
  const myTotalCount = myRotationTasks.length + myAssigned.length

  // --- Team strip (managers) ---
  const teamProgress = useMemo(() => {
    if (!user?.isManager) return []
    return staffMembers.map((name) => {
      const tasks = getTasksForStaff(name, cleaningTasks)
      const assigned = assignedTasks.filter((t) => t.staffName === name && t.date === todayISO)
      const rotDone = tasks.filter((t) => cleaningEntries.some((e) => e.taskName === t.name && e.dateTime?.startsWith(todayISO))).length
      const asgDone = assigned.filter((t) => t.completed).length
      const total = tasks.length + assigned.length
      const done = rotDone + asgDone
      return { name, total, done, allDone: total > 0 && done === total }
    })
  }, [user, staffMembers, cleaningTasks, assignedTasks, cleaningEntries, todayISO])

  if (docsLoading) {
    return (
      <div className="dashboard">
        <div className="skeleton-topbar" />
        <div className="skeleton-tiles"><div className="skeleton-tile" /><div className="skeleton-tile" /><div className="skeleton-tile" /><div className="skeleton-tile" /></div>
        <div className="skeleton-focus-row"><div className="skeleton-focus" /><div className="skeleton-focus" /></div>
        <div className="skeleton-accordion"><div className="skeleton-accordion-row" /><div className="skeleton-accordion-row" /><div className="skeleton-accordion-row" /></div>
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

  // Score history (up to 6 weekly snapshots for sparkline)
  const scoreHistory = JSON.parse(localStorage.getItem('ipd_score_history') || '[]')
  const weekKey = `${new Date().getFullYear()}-W${Math.ceil((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}`
  const lastEntry = scoreHistory[scoreHistory.length - 1]
  if (!lastEntry || lastEntry.week !== weekKey) {
    const scores = {}
    complianceAreas.forEach(a => { scores[a.label] = a.score })
    const updated = [...scoreHistory, { week: weekKey, scores }].slice(-6)
    localStorage.setItem('ipd_score_history', JSON.stringify(updated))
    // Clean up old keys
    localStorage.removeItem('ipd_weekly_scores')
    localStorage.removeItem('ipd_score_week')
  }

  // Trend arrows (compare to previous week)
  const prevScores = scoreHistory.length > 0 ? scoreHistory[scoreHistory.length - 1].scores : {}
  const trends = {}
  complianceAreas.forEach(a => {
    const prev = prevScores[a.label]
    if (prev !== undefined && prev !== a.score) {
      trends[a.label] = a.score > prev ? 'up' : 'down'
    }
  })

  // Sparkline data helper: historical scores + current live score
  const getSparklineData = (label) => {
    const historical = scoreHistory.map(e => e.scores[label]).filter(v => v !== undefined)
    const current = complianceAreas.find(a => a.label === label)?.score
    if (current !== undefined) historical.push(current)
    return historical
  }

  // Tile/card counts
  const dailyDueCount = taskStatuses.filter(t => t.frequency === 'daily' && (t.status === 'due' || t.status === 'overdue')).length
  const docsExpiring = documents.filter(d => { const tl = getTrafficLight(d.expiryDate); return tl === 'red' || tl === 'amber' }).length
  const trainingOverdue = overdueTraining.length

  // Critical alerts (score < 25%)
  const criticalAlerts = complianceAreas
    .filter(a => a.score < 25)
    .map(a => {
      let subtitle = ''
      if (a.label === 'Training') subtitle = `${overdueTraining.length} items overdue across all staff`
      else if (a.label === 'Cleaning') subtitle = `${overdueCleaningTasks.length} tasks overdue`
      else if (a.label === 'Documents') subtitle = `${expiredDocs.length} documents expired`
      else subtitle = `${sgDueSoon.length} records need attention`
      return { label: a.label, score: a.score, subtitle, nav: a.nav }
    })

  // Segmented action counts
  const overdueCount = expiredDocs.length + overdueTraining.length + overdueCleaningTasks.length
    + sgDueSoon.filter(r => getSafeguardingStatus(r.trainingDate) === 'overdue').length
  const dueTodayCount = tempMissing + rpMissing + dailyDueCount
  const upcomingCount = dueSoon.length
    + sgDueSoon.filter(r => getSafeguardingStatus(r.trainingDate) === 'due-soon').length

  // Compliance card data
  const complianceCardData = [
    { label: 'Documents', score: docScore, subtitle: docsExpiring > 0 ? `${docsExpiring} expiring` : 'All current', trend: trends['Documents'] ? { direction: trends['Documents'], value: Math.abs(docScore - (prevScores['Documents'] || docScore)) } : null, sparklineData: getSparklineData('Documents'), nav: '/documents' },
    { label: 'Training', score: staffScore, subtitle: trainingOverdue > 0 ? `${trainingOverdue} overdue` : 'All complete', trend: trends['Training'] ? { direction: trends['Training'], value: Math.abs(staffScore - (prevScores['Training'] || staffScore)) } : null, sparklineData: getSparklineData('Training'), nav: '/staff-training' },
    { label: 'Cleaning', score: cleaningScore, subtitle: overdueCleaningTasks.length > 0 ? `${overdueCleaningTasks.length} overdue` : 'All clear', trend: trends['Cleaning'] ? { direction: trends['Cleaning'], value: Math.abs(cleaningScore - (prevScores['Cleaning'] || cleaningScore)) } : null, sparklineData: getSparklineData('Cleaning'), nav: '/cleaning' },
    { label: 'Safeguarding', score: sgScore, subtitle: sgDueSoon.length > 0 ? `${sgDueSoon.length} due soon` : 'All current', trend: trends['Safeguarding'] ? { direction: trends['Safeguarding'], value: Math.abs(sgScore - (prevScores['Safeguarding'] || sgScore)) } : null, sparklineData: getSparklineData('Safeguarding'), nav: '/safeguarding' },
  ]

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


  // Confetti trigger
  const triggerConfetti = (colKey) => {
    if (prevAllDoneRef.current[colKey]) return
    prevAllDoneRef.current[colKey] = true
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#22c55e', '#3b82f6', '#f59e0b', '#a78bfa'],
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
    const done = col.allCards.filter(c => c.status === 'done').length
    if (col.allCards.length > 0 && done === col.allCards.length) {
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

  return (
    <div className="dashboard">
      <AlertBanner alerts={criticalAlerts} />

      {/* === TOP BAR === */}
      <div className="dash-topbar no-print">
        <div className="dash-topbar-left">
          <h1 className="dash-topbar-greeting">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Team'}
            <span className="dash-topbar-date-inline">
              {' \u2014 '}
              {clock.toLocaleDateString('en-GB', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </span>
          </h1>
        </div>

        <div className="dash-topbar-center">
          <ActionCounter
            overdue={overdueCount}
            dueToday={dueTodayCount}
            upcoming={upcomingCount}
            onToggleOutstanding={() => setShowOutstanding(!showOutstanding)}
          />
        </div>

        <div className="dash-topbar-right">
          <span className="dash-topbar-synced">Updated {lastUpdated}</span>
          <ProgressRing pct={overallScore} size={40} strokeWidth={3} />
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

      {/* === COMPLIANCE CARDS === */}
      <ComplianceCards areas={complianceCardData} />

      {/* === TODAY'S FOCUS + RP DAILY LOG === */}
      <div className="dash-focus-row no-print">
        <div className="dash-focus-card">
          <div className="dash-focus-header">
            <h2 className="dash-focus-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              Today&apos;s Focus
            </h2>
            <span className="dash-focus-count">
              {todayCards.filter(c => c.status === 'done').length}/{todayCards.length}
            </span>
          </div>
          {todayCards.length === 0 ? (
            <p className="dash-empty-state">No daily tasks configured</p>
          ) : (
            <ul className="dash-focus-list">
              {todayCards.map(card => (
                <li key={card.id} className={`dash-focus-item ${card.status === 'done' ? 'dash-focus-item--done' : ''}`}>
                  <button
                    className={`dash-focus-check ${card.status === 'done' ? 'dash-focus-check--done' : ''}`}
                    onClick={() => card.status !== 'done' && handleOpenCompletion(card)}
                    disabled={card.status === 'done'}
                  >
                    {card.status === 'done' ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="14" height="14"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><circle cx="12" cy="12" r="10" /></svg>
                    )}
                  </button>
                  <span className="dash-focus-name">{card.name}</span>
                  <span className={`dash-focus-pill dash-focus-pill--${card.category === 'RP Check' ? 'rp' : 'cleaning'}`}>
                    {card.category === 'RP Check' ? 'RP' : 'Cleaning'}
                  </span>
                  {card.dueTime && <span className={`dash-focus-time ${card.dueTimeOverdue ? 'dash-focus-time--overdue' : ''}`}>{card.dueTime}</span>}
                  {card.assignedTo && <span className="dash-focus-avatar" title={card.assignedTo}>{card.assignedTo.split(' ').map(w => w[0]).join('')}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="dash-focus-card dash-focus-card--rp">
          <div className="dash-focus-header">
            <h2 className="dash-focus-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" /><path d="M9 14l2 2 4-4" />
              </svg>
              RP Daily Log
            </h2>
            <span className="dash-focus-count">
              {RP_DAILY.filter(item => !!rpChecklist[item]).length}/{RP_DAILY.length}
            </span>
          </div>
          {RP_DAILY.filter(item => !!rpChecklist[item]).length === RP_DAILY.length ? (
            <p className="dash-empty-state dash-empty-state--success">All RP checks complete!</p>
          ) : (
            <ul className="dash-focus-list">
              {RP_DAILY.map(item => (
                <li key={item} className={`dash-focus-item ${rpChecklist[item] ? 'dash-focus-item--done' : ''}`}>
                  <button
                    className={`dash-focus-check ${rpChecklist[item] ? 'dash-focus-check--done' : ''}`}
                    onClick={() => handleToggleRpItem(item)}
                  >
                    {rpChecklist[item] ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="14" height="14"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><circle cx="12" cy="12" r="10" /></svg>
                    )}
                  </button>
                  <span className="dash-focus-name">{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
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

      {/* === TASK SCHEDULE === */}
      <TaskAccordion
        columns={columns}
        mobileTab={mobileTab}
        setMobileTab={setMobileTab}
        expandedRpCard={expandedRpCard}
        setExpandedRpCard={setExpandedRpCard}
        rpChecklist={rpChecklist}
        onToggleRpItem={handleToggleRpItem}
        onOpenCompletion={handleOpenCompletion}
        onMarkAllDone={handleMarkAllDone}
        completedAccordion={completedAccordion}
        setCompletedAccordion={setCompletedAccordion}
        collapsedCols={collapsedCols}
        setCollapsedCols={setCollapsedCols}
        searchTerm={searchTerm}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />

      {/* === TO DO === */}
      <div className="dash-todo-card no-print">
        <div className="dash-todo-header">
          <h2 className="dash-todo-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            To Do
            {pendingActions.length > 0 && <span className="dash-todo-badge">{pendingActions.length}</span>}
          </h2>
          {doneActions.length > 0 && (
            <span className="dash-todo-done-count">{doneActions.length} done</span>
          )}
        </div>
        <div className="dash-todo-list">
          {pendingActions.map(a => (
            <div key={a.id} className="dash-todo-item">
              <button className="dash-focus-check" onClick={() => toggleAction(a.id)} aria-label="Mark done">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><circle cx="12" cy="12" r="10" /></svg>
              </button>
              <span className="dash-todo-item-title">{a.title}</span>
              {a.dueDate && (
                <span className={`dash-todo-due ${a.dueDate < todayStr ? 'dash-todo-due--overdue' : ''}`}>
                  {formatDate(a.dueDate)}
                </span>
              )}
              <button className="dash-todo-delete" onClick={() => deleteAction(a.id)} aria-label="Delete">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          ))}
          {doneActions.map(a => (
            <div key={a.id} className="dash-todo-item dash-todo-item--done">
              <button className="dash-focus-check dash-focus-check--done" onClick={() => toggleAction(a.id)} aria-label="Undo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="14" height="14"><polyline points="20 6 9 17 4 12" /></svg>
              </button>
              <span className="dash-todo-item-title">{a.title}</span>
              <button className="dash-todo-delete" onClick={() => deleteAction(a.id)} aria-label="Delete">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          ))}
          {pendingActions.length === 0 && doneActions.length === 0 && (
            <p className="dash-empty-state">No action items — add one below</p>
          )}
        </div>
        <form className="dash-todo-add" onSubmit={addAction}>
          <span className="dash-todo-add-icon">+</span>
          <input type="text" className="input" placeholder="Add new action..." value={actionInput} onChange={(e) => setActionInput(e.target.value)} />
          <input type="date" className="input dash-todo-date" value={actionDueDate} onChange={(e) => setActionDueDate(e.target.value)} />
          <button type="submit" className="btn btn--primary btn--sm">Add</button>
        </form>
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

      {/* Footer */}
      <footer className="dash-footer no-print">
        <span>iPharmacy Direct &middot; Compliance Tracker v3.1</span>
      </footer>

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
