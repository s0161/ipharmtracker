import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import {
  getTrafficLight,
  getTaskStatus,
  getSafeguardingStatus,
  DEFAULT_CLEANING_TASKS,
  generateId,
} from '../utils/helpers'
import { logAudit } from '../utils/auditLog'
import { getTaskAssignee, getRPAssignee, getStaffInitials, getStaffColor } from '../utils/rotationManager'
import { useUser } from '../contexts/UserContext'
import { usePharmacyConfig } from '../hooks/usePharmacyConfig'
import { useDocumentReminders } from '../hooks/useDocumentReminders'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/ConfirmDialog'
import {
  AlertBanner,
  ProgressRing,
  Confetti,
  NotificationBell,
  RPPresenceBar,
  ComplianceHealth,
  AccPanel,
  TodoSection,
  FloatingActionButton,
  DailyProgressBar,
  ComplianceHeatmap,
  RPTimeline,
} from '../components/dashboard'

// RP checklist items
const RP_DAILY = [
  'RP notice displayed',
  'Controlled drugs checked',
  'Pharmacy opened correctly',
  'Pharmacy closed correctly',
  'Fridge temperature recorded',
]

const TASK_DUE_TIMES = { 'Temperature Log': '09:00' }
const RP_DAILY_DUE_TIME = '10:00'

function isTimePast(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  const now = new Date()
  return now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m)
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const showToast = useToast()
  const { user } = useUser()
  const [pharmacyConfig] = usePharmacyConfig()
  const { confirm, ConfirmDialog: TodoConfirmDialog } = useConfirm()

  // ─── SUPABASE DATA ───
  const [documents, , docsLoading] = useSupabase('documents', [])
  const [cleaningEntries, setCleaningEntries] = useSupabase('cleaning_entries', [])
  const [cleaningTasks] = useSupabase('cleaning_tasks', DEFAULT_CLEANING_TASKS)
  const [staffTraining] = useSupabase('staff_training', [])
  const [safeguarding] = useSupabase('safeguarding_records', [])
  const [rpLogs, setRpLogs] = useSupabase('rp_log', [])
  const [tempLogs] = useSupabase('temperature_logs', [])
  const [actionItems, setActionItems] = useSupabase('action_items', [])

  const { reminders: docReminders, dismiss: dismissReminder } = useDocumentReminders(documents)

  // ─── LOCAL STATE ───
  const [mob, setMob] = useState(false)
  const [rpSignedIn, setRpSignedIn] = useState(false)
  const [liveTime, setLiveTime] = useState('')
  const [liveDate, setLiveDate] = useState('')
  const [checked, setChecked] = useState(new Set())
  const [justChecked, setJustChecked] = useState(null)
  const [rpSubChecks, setRpSubChecks] = useState(new Set())
  // checkedTodo removed — completion now stored in actionItems via Supabase
  const [acc, setAcc] = useState({ today: true, weekly: false, fort: false, monthly: false })
  const [hovCard, setHovCard] = useState(null)
  const [hovStat, setHovStat] = useState(null)
  const [scrollFade, setScrollFade] = useState(true)
  const [expandedNote, setExpandedNote] = useState(null)
  const [expandedSubchecks, setExpandedSubchecks] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [prevAllDone, setPrevAllDone] = useState(false)

  // RP sticky keys state
  const [keys, setKeys] = useState({
    rpNotice: { d: false, t: null },
    cdCheck: { d: false, t: null },
    opening: { d: false, t: null },
    closing: { d: false, t: null },
    fridgeTemp: { d: false, t: null, v: null },
  })
  const [showFridge, setShowFridge] = useState(false)
  const [fridgeVal, setFridgeVal] = useState('')

  // ─── EFFECTS ───
  useEffect(() => {
    const c = () => setMob(window.innerWidth < 768)
    c(); window.addEventListener('resize', c)
    return () => window.removeEventListener('resize', c)
  }, [])

  // Live clock
  useEffect(() => {
    const update = () => {
      const n = new Date()
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      setLiveTime(`${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`)
      setLiveDate(`${days[n.getDay()]}, ${n.getDate()} ${months[n.getMonth()]} ${n.getFullYear()}`)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  // Scroll fade
  const onScroll = useCallback(() => {
    const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 40
    setScrollFade(!atBottom)
  }, [])
  useEffect(() => {
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [onScroll])

  // ─── DERIVED DATA ───
  const rpAssignee = getRPAssignee() || 'No RP assigned'
  const todayISO = new Date().toISOString().slice(0, 10)
  const todayRp = rpLogs.find(l => l.date === todayISO)
  const rpChecklist = todayRp?.checklist || {}

  // Derive RP signed-in state from rp_log sessions
  useEffect(() => {
    if (!todayRp) { setRpSignedIn(false); return }
    const sessions = todayRp.sessions || []
    if (sessions.length === 0) { setRpSignedIn(false); return }
    const lastSession = sessions[sessions.length - 1]
    setRpSignedIn(!!lastSession.signInAt && !lastSession.signOutAt)
  }, [todayRp])

  // Computed RP sign-in time (from last session)
  const rpSignInTime = useMemo(() => {
    if (!todayRp) return null
    const sessions = todayRp.sessions || []
    const lastSession = sessions[sessions.length - 1]
    if (!lastSession?.signInAt) return null
    return new Date(lastSession.signInAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }, [todayRp])

  // Computed last RP sign-out time
  const rpLastSignOut = useMemo(() => {
    if (!todayRp) return null
    const sessions = todayRp.sessions || []
    for (let i = sessions.length - 1; i >= 0; i--) {
      if (sessions[i].signOutAt) {
        return new Date(sessions[i].signOutAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      }
    }
    return null
  }, [todayRp])

  // Compliance sub-scores
  const docStatuses = documents.map(d => getTrafficLight(d.expiryDate))
  const greenCount = docStatuses.filter(s => s === 'green').length
  const docScore = documents.length > 0 ? Math.round((greenCount / documents.length) * 100) : 100

  const staffScore = staffTraining.length > 0
    ? Math.round((staffTraining.filter(e => e.status === 'Complete').length / staffTraining.length) * 100) : 100

  const seen = new Set()
  const taskStatuses = cleaningTasks.filter(t => {
    if (seen.has(t.name)) return false; seen.add(t.name); return true
  }).map(t => ({ ...t, status: getTaskStatus(t.name, t.frequency, cleaningEntries) }))

  const cleaningUpToDate = cleaningTasks.length > 0
    ? taskStatuses.filter(t => t.status === 'done' || t.status === 'upcoming').length : 0
  const cleaningScore = cleaningTasks.length > 0
    ? Math.round((cleaningUpToDate / taskStatuses.length) * 100) : 100

  const sgCurrent = safeguarding.length > 0
    ? safeguarding.filter(r => getSafeguardingStatus(r.trainingDate) === 'current').length : 0
  const sgScore = safeguarding.length > 0
    ? Math.round((sgCurrent / safeguarding.length) * 100) : 100

  const overallScore = Math.round((docScore + staffScore + cleaningScore + sgScore) / 4)

  // Score history for sparklines (stored as { "2026-03-03": { documents: 80, ... }, ... })
  const scoreHistoryObj = JSON.parse(localStorage.getItem('ipd_score_history') || '{}')
  const scoreHistoryEntries = Object.entries(scoreHistoryObj).sort(([a], [b]) => a.localeCompare(b))
  const getSparklineData = (label) => {
    const scores = { Documents: docScore, Training: staffScore, Cleaning: cleaningScore, Safeguarding: sgScore }
    const keyMap = { Documents: 'documents', Training: 'training', Cleaning: 'cleaning', Safeguarding: 'safeguarding' }
    const hist = scoreHistoryEntries.map(([, v]) => v?.[keyMap[label]]).filter(v => v !== undefined)
    hist.push(scores[label])
    return hist.length >= 2 ? hist : [scores[label], scores[label]]
  }

  // Trend calculation
  const prevScores = scoreHistoryEntries.length > 0 ? scoreHistoryEntries[scoreHistoryEntries.length - 1]?.[1] || {} : {}
  const trendKeyMap = { Documents: 'documents', Training: 'training', Cleaning: 'cleaning', Safeguarding: 'safeguarding' }
  const getTrend = (label, score) => {
    const prev = prevScores[trendKeyMap[label] || label]
    if (prev === undefined || prev === score) return 'stable'
    return score > prev ? 'up' : 'down'
  }
  const getTrendVal = (label, score) => {
    const prev = prevScores[trendKeyMap[label] || label]
    if (prev === undefined) return ''
    return `${Math.abs(score - prev)}%`
  }

  // Compliance health areas for the grid
  // ─── SCORE HISTORY PERSISTENCE ───
  useEffect(() => {
    if (docsLoading) return
    const key = 'ipd_score_history'
    const todayKey = new Date().toISOString().slice(0, 10)
    try {
      const history = JSON.parse(localStorage.getItem(key) || '{}')
      if (!history[todayKey]) {
        history[todayKey] = {
          documents: Math.round(docScore),
          training: Math.round(staffScore),
          cleaning: Math.round(cleaningScore),
          safeguarding: Math.round(sgScore),
        }
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - 30)
        const cutoffStr = cutoff.toISOString().slice(0, 10)
        Object.keys(history).forEach(k => { if (k < cutoffStr) delete history[k] })
        localStorage.setItem(key, JSON.stringify(history))
      }
    } catch (e) { console.warn('Score history write failed:', e) }
  }, [docsLoading, docScore, staffScore, cleaningScore, sgScore])

  // Drill-down data for compliance tiles
  const docDrilldown = documents
    .filter(d => getTrafficLight(d.expiryDate) !== 'green')
    .map(d => ({
      name: d.name || d.title || 'Document',
      detail: d.expiryDate ? new Date(d.expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '',
      severity: getTrafficLight(d.expiryDate) === 'red' ? 'red' : 'amber',
    }))

  const trainingDrilldown = staffTraining
    .filter(e => e.status !== 'Complete')
    .map(e => ({
      name: `${e.staffName || 'Staff'} — ${e.topic || 'Topic'}`,
      detail: e.status || 'Pending',
      severity: 'amber',
    }))

  const cleaningDrilldown = taskStatuses
    .filter(t => t.status === 'overdue')
    .map(t => ({
      name: t.name,
      detail: 'Overdue',
      severity: 'red',
    }))

  const sgDrilldown = safeguarding
    .filter(r => getSafeguardingStatus(r.trainingDate) !== 'current')
    .map(r => ({
      name: r.staffName || 'Staff member',
      detail: r.trainingDate ? new Date(r.trainingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No date',
      severity: getSafeguardingStatus(r.trainingDate) === 'expired' ? 'red' : 'amber',
    }))

  const complianceAreas = [
    { label: 'DOCUMENTS', pct: docScore, detail: docScore === 100 ? 'All current' : `${documents.length - greenCount} expiring`, trend: getTrend('Documents', docScore), trendVal: getTrendVal('Documents', docScore), data: getSparklineData('Documents'), color: docScore >= 80 ? '#10b981' : docScore >= 50 ? '#f59e0b' : '#ef4444', current: greenCount, total: documents.length, drilldown: docDrilldown },
    { label: 'TRAINING', pct: staffScore, detail: staffScore === 100 ? 'All complete' : `${staffTraining.filter(e => e.status !== 'Complete').length} incomplete`, trend: getTrend('Training', staffScore), trendVal: getTrendVal('Training', staffScore), data: getSparklineData('Training'), color: staffScore >= 80 ? '#10b981' : staffScore >= 50 ? '#f59e0b' : '#ef4444', current: staffTraining.filter(e => e.status === 'Complete').length, total: staffTraining.length, drilldown: trainingDrilldown },
    { label: 'CLEANING', pct: cleaningScore, detail: cleaningScore === 100 ? 'All clear' : `${taskStatuses.filter(t => t.status === 'overdue').length} overdue`, trend: getTrend('Cleaning', cleaningScore), trendVal: getTrendVal('Cleaning', cleaningScore), data: getSparklineData('Cleaning'), color: cleaningScore >= 80 ? '#10b981' : cleaningScore >= 50 ? '#f59e0b' : '#ef4444', alert: cleaningScore < 25, current: cleaningUpToDate, total: taskStatuses.length, drilldown: cleaningDrilldown },
    { label: 'SAFEGUARDING', pct: sgScore, detail: sgScore === 100 ? 'All current' : `${safeguarding.length - sgCurrent} due`, trend: getTrend('Safeguarding', sgScore), trendVal: getTrendVal('Safeguarding', sgScore), data: getSparklineData('Safeguarding'), color: sgScore >= 80 ? '#10b981' : sgScore >= 50 ? '#f59e0b' : '#ef4444', current: sgCurrent, total: safeguarding.length, drilldown: sgDrilldown },
  ]

  // Critical alerts
  const overdueCleaningTasks = taskStatuses.filter(t => t.status === 'overdue')
  const expiredDocs = documents.filter(d => getTrafficLight(d.expiryDate) === 'red')
  const criticalAlerts = [
    { label: 'Documents', score: docScore, nav: '/documents' },
    { label: 'Training', score: staffScore, nav: '/staff-training' },
    { label: 'Cleaning', score: cleaningScore, nav: '/cleaning' },
    { label: 'Safeguarding', score: sgScore, nav: '/safeguarding' },
  ].filter(a => a.score < 25).map(a => {
    let subtitle = ''
    if (a.label === 'Cleaning') subtitle = `${overdueCleaningTasks.length} tasks overdue`
    else if (a.label === 'Documents') subtitle = `${expiredDocs.length} documents expired`
    else subtitle = 'Needs attention'
    return { ...a, subtitle }
  })

  // Action counts
  const tempLoggedToday = tempLogs.some(l => l.date === todayISO)
  const overdueCount = overdueCleaningTasks.length + expiredDocs.length
  const dueTodayCount = (tempLoggedToday ? 0 : 1) + taskStatuses.filter(t => t.frequency === 'daily' && t.status === 'due').length

  // Notifications — respect user preferences from Settings
  const notifications = useMemo(() => {
    const prefs = JSON.parse(localStorage.getItem('ipd_notification_prefs') || '{}')
    const n = []
    if (prefs.cleaningOverdue !== false && cleaningScore === 0) n.push({ id: 'n1', type: 'critical', title: 'Cleaning at 0%', desc: `${overdueCleaningTasks.length} cleaning tasks are overdue`, time: '2h ago', read: false })
    if (prefs.temperatureMissing !== false && !tempLoggedToday) n.push({ id: 'n2', type: 'warning', title: 'Temperature log due', desc: 'Fridge temp not recorded today', time: '3h ago', read: false })
    // GPhC notification — dynamic from pharmacy config
    if (pharmacyConfig.lastInspectionDate) {
      const inspDate = new Date(pharmacyConfig.lastInspectionDate)
      const monthsAgo = Math.floor((Date.now() - inspDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000))
      if (monthsAgo >= 12) n.push({ id: 'n3', type: 'warning', title: 'GPhC inspection due', desc: `Last inspection was ${monthsAgo} months ago`, time: '1d ago', read: false })
    }
    if (prefs.trainingOverdue !== false && staffScore === 100) n.push({ id: 'n4', type: 'info', title: 'Training complete', desc: 'Safeguarding training 100% across all staff', time: '2d ago', read: true })
    if (prefs.documentExpiry !== false && docScore === 100) n.push({ id: 'n5', type: 'info', title: 'Documents updated', desc: 'All pharmacy documents are now current', time: '3d ago', read: true })
    // Document expiry reminders
    docReminders.forEach(r => {
      n.push({ ...r, read: false })
    })
    return n
  }, [cleaningScore, tempLoggedToday, staffScore, docScore, overdueCleaningTasks.length, docReminders])

  // RP sessions (from rpLogs)
  const sessions = useMemo(() => {
    if (!todayRp?.sessions?.length) {
      return []
    }
    return todayRp.sessions.map(s => ({
      start: s.signInAt ? new Date(s.signInAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—',
      end: s.signOutAt ? new Date(s.signOutAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'ongoing',
      name: rpAssignee,
      dur: s.signOutAt ? formatDur(new Date(s.signOutAt) - new Date(s.signInAt)) : null,
    }))
  }, [todayRp, rpAssignee])

  // ─── TASK BUILDING ───
  const buildTaskList = (freq) => {
    const freqTasks = taskStatuses.filter(t => t.frequency === freq)
    const cards = freqTasks.map((task, taskIndex) => {
      const assigneeName = getTaskAssignee(task.name, freq, taskIndex)
      const isDone = task.status === 'done'
      const dueTime = TASK_DUE_TIMES[task.name] || null
      const isRP = task.name.toLowerCase().includes('rp')
      return {
        id: `${freq}-${task.name}`,
        title: task.name,
        assigneeName,
        tag: isRP ? 'RP Check' : 'Cleaning',
        time: freq === 'daily' && dueTime ? `by ${dueTime}` : null,
        urgent: freq === 'daily' && dueTime && !isDone && isTimePast(dueTime) ? 'red' : (freq === 'daily' && dueTime ? 'amber' : null),
        priority: isRP || task.name === 'Temperature Log' ? 'high'
          : freq === 'daily' ? 'medium' : 'low',
        note: task.description || '',
        hasSubchecks: false,
        _taskName: task.name,
      }
    })

    // Add RP check summary for daily
    if (freq === 'daily') {
      const rpDone = RP_DAILY.filter(item => !!rpChecklist[item]).length
      cards.unshift({
        id: 'rp-daily-checks',
        title: 'Daily RP Checks',
        assigneeName: rpAssignee,
        tag: 'RP Check',
        time: `by ${RP_DAILY_DUE_TIME}`,
        urgent: rpDone < RP_DAILY.length && isTimePast(RP_DAILY_DUE_TIME) ? 'amber' : 'amber',
        priority: 'high',
        note: 'Complete all 5 RP obligation checks. Must be done by the Responsible Pharmacist on duty.',
        hasSubchecks: true,
      })
      // Ensure Temperature Log is first
      const tempIdx = cards.findIndex(c => c.title === 'Temperature Log')
      if (tempIdx > 0) {
        const [temp] = cards.splice(tempIdx, 1)
        cards.unshift(temp)
      }
    }

    return cards
  }

  const todayTasks = useMemo(() => buildTaskList('daily'), [taskStatuses, rpChecklist])
  const weeklyTasks = useMemo(() => buildTaskList('weekly'), [taskStatuses])
  const fortnightlyTasks = useMemo(() => buildTaskList('fortnightly'), [taskStatuses])
  const monthlyTasks = useMemo(() => buildTaskList('monthly'), [taskStatuses])

  // Streak calculation (consecutive days with cleaning entries)
  const streakDays = useMemo(() => {
    if (!cleaningEntries.length) return 0
    const entryDates = new Set(cleaningEntries.map(e => {
      const dt = e.dateTime || e.date || ''
      return dt.slice(0, 10)
    }))
    let streak = 0
    const d = new Date()
    if (!entryDates.has(d.toISOString().slice(0, 10))) {
      d.setDate(d.getDate() - 1)
    }
    while (entryDates.has(d.toISOString().slice(0, 10))) {
      streak++
      d.setDate(d.getDate() - 1)
    }
    return streak
  }, [cleaningEntries])

  // To-do items — show uncompleted + recently completed (< 24h)
  const todos = useMemo(() => {
    const now = Date.now()
    return actionItems
      .filter(a => {
        if (!a.completed) return true
        if (a.completedAt) {
          return (now - new Date(a.completedAt).getTime()) < 86400000
        }
        return false
      })
      .map(a => ({
        id: a.id,
        title: a.title,
        days: a.dueDate ? Math.ceil((new Date(a.dueDate) - new Date()) / 86400000) + 'd' : null,
        completed: !!a.completed,
      }))
  }, [actionItems])

  // ─── INTERACTIONS ───
  const now = () => {
    const n = new Date()
    return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`
  }

  const toggleCheck = (id) => {
    setChecked(p => {
      const n = new Set(p)
      if (n.has(id)) { n.delete(id) } else {
        n.add(id)
        setJustChecked(id)
        setTimeout(() => setJustChecked(null), 350)

        // Persist to Supabase for cleaning tasks
        const task = [...todayTasks, ...weeklyTasks, ...fortnightlyTasks, ...monthlyTasks].find(t => t.id === id)
        if (task?._taskName) {
          const entry = {
            id: generateId(),
            taskName: task._taskName,
            dateTime: new Date().toISOString().slice(0, 16),
            staffMember: user?.name || task.assigneeName,
            result: 'Pass',
            notes: 'Completed from dashboard',
            createdAt: new Date().toISOString(),
          }
          setCleaningEntries(prev => [...prev, entry])
        }
      }
      return n
    })
  }

  const handleToggleTodo = (id) => {
    const item = actionItems.find(a => a.id === id)
    if (!item) return
    setActionItems(actionItems.map(a =>
      a.id === id ? { ...a, completed: !a.completed, completedAt: !a.completed ? new Date().toISOString() : null } : a
    ))
    logAudit('Updated', `Action item: ${item.title} → ${item.completed ? 'reopened' : 'completed'}`, 'Dashboard', user?.name)
  }

  const handleAddTodo = (title, dueDate) => {
    if (!title || !title.trim()) return
    const newItem = {
      id: generateId(),
      title,
      dueDate: dueDate || null,
      completed: false,
      createdAt: new Date().toISOString(),
    }
    setActionItems([...actionItems, newItem])
    logAudit('Created', `Action item: ${title}`, 'Dashboard', user?.name)
  }

  const handleDeleteTodo = async (id) => {
    const item = actionItems.find(a => a.id === id)
    const ok = await confirm({
      title: 'Delete action item?',
      message: `Remove "${item?.title || 'this item'}" from your to-do list?`,
      confirmLabel: 'Delete',
      variant: 'danger',
    })
    if (!ok) return
    setActionItems(actionItems.filter(a => a.id !== id))
    if (item) logAudit('Deleted', `Action item: ${item.title}`, 'Dashboard', user?.name)
  }
  const toggleRpSub = (id) => setRpSubChecks(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleNote = (id) => setExpandedNote(expandedNote === id ? null : id)
  const toggleSubchecks = (id) => setExpandedSubchecks(expandedSubchecks === id ? null : id)

  const handleDismissNotification = useCallback((notification) => {
    if (notification.docId && notification.threshold) {
      dismissReminder(notification.docId, notification.threshold)
    }
  }, [dismissReminder])

  const handleKeyPress = (id) => {
    if (keys[id]?.d) return
    if (id === 'fridgeTemp') { setShowFridge(true); return }
    setKeys(p => ({ ...p, [id]: { d: true, t: now() } }))

    // Also toggle RP checklist in Supabase
    const rpMapping = { rpNotice: 'RP notice displayed', cdCheck: 'Controlled drugs checked', opening: 'Pharmacy opened correctly', closing: 'Pharmacy closed correctly' }
    if (rpMapping[id]) {
      handleToggleRpItem(rpMapping[id])
    }
  }

  const submitFridge = () => {
    if (!fridgeVal) return
    setKeys(p => ({ ...p, fridgeTemp: { d: true, t: now(), v: fridgeVal } }))
    setShowFridge(false); setFridgeVal('')
    handleToggleRpItem('Fridge temperature recorded')
  }

  const handleToggleRpItem = (itemName) => {
    const updatedChecklist = { ...rpChecklist, [itemName]: !rpChecklist[itemName] }
    if (todayRp) {
      setRpLogs(rpLogs.map(l => l.id === todayRp.id ? { ...l, checklist: updatedChecklist } : l))
    } else {
      setRpLogs([...rpLogs, {
        id: generateId(),
        date: todayISO,
        rpName: rpAssignee || 'Dashboard',
        checklist: updatedChecklist,
        notes: '',
        createdAt: new Date().toISOString(),
      }])
    }
  }

  const handleRpToggle = () => {
    setRpSignedIn(!rpSignedIn)
    const s = todayRp?.sessions || []
    const last = s[s.length - 1]
    const isIn = last && !last.signOutAt
    const updated = isIn
      ? s.map((sess, i) => i === s.length - 1 ? { ...sess, signOutAt: new Date().toISOString() } : sess)
      : [...s, { signInAt: new Date().toISOString() }]
    if (todayRp) {
      setRpLogs(rpLogs.map(l => l.id === todayRp.id ? { ...l, sessions: updated } : l))
    } else {
      setRpLogs([...rpLogs, {
        id: generateId(), date: todayISO, rpName: rpAssignee, checklist: {}, sessions: updated, notes: '', createdAt: new Date().toISOString(),
      }])
    }
    showToast(rpSignedIn ? 'RP signed out' : 'RP signed in')
  }

  // Confetti detection
  const todayChecked = todayTasks.filter(t => checked.has(t.id)).length
  const allTodayDone = todayChecked === todayTasks.length && todayTasks.length > 0
  useEffect(() => {
    if (allTodayDone && !prevAllDone) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 1800)
    }
    setPrevAllDone(allTodayDone)
  }, [allTodayDone, prevAllDone])

  // ─── LOADING ───
  if (docsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-ec-pulse text-ec-t3 text-sm">Loading dashboard...</div>
      </div>
    )
  }

  const firstName = user?.name?.split(' ')[0] || 'there'

  // ─── RENDER ───
  return (
    <div className="px-4 lg:px-9 pb-16 max-w-[1200px]">
      <Confetti show={showConfetti} />

      {/* ═══ HEADER ═══ */}
      <div
        className={`ec-fadeup flex ${mob ? 'flex-col' : 'items-center'} justify-between gap-4 pt-7 pb-5`}
      >
        <div>
          <div>
            <div className="text-[28px] font-extrabold text-ec-t1 leading-tight tracking-tight">
              {getGreeting()}, {firstName}
            </div>
            <div className="text-[11px] text-ec-t3 mt-1.5 tracking-wide flex items-center gap-1.5">
              {liveDate} · <span className="text-ec-t2 tabular-nums font-medium">{liveTime}</span>
            </div>
          </div>
        </div>

        <div className={`flex items-center gap-4 ${mob ? 'w-full justify-between' : ''}`}>
          <DailyProgressBar done={todayChecked} total={todayTasks.length} />
          <div className="w-px h-7 bg-ec-div" />

          {/* Overdue stat */}
          <div
            className="text-center relative cursor-default"
            onMouseEnter={() => setHovStat('over')}
            onMouseLeave={() => setHovStat(null)}
          >
            <div className="text-[26px] font-extrabold text-ec-crit leading-none tracking-tighter">{overdueCount}</div>
            <div className="text-[9px] font-bold text-ec-t3 uppercase tracking-[1px] mt-0.5">Overdue</div>
            {hovStat === 'over' && (
              <div className="ec-slidedown absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 rounded-lg border border-ec-border text-[11px] text-ec-t2 whitespace-nowrap z-10 backdrop-blur-lg" style={{ backgroundColor: 'var(--ec-sidebar)', boxShadow: 'var(--shadow-md)' }}>
                {overdueCleaningTasks.length} cleaning tasks overdue
              </div>
            )}
          </div>

          {/* Due today stat */}
          <div
            className="text-center relative cursor-default"
            onMouseEnter={() => setHovStat('due')}
            onMouseLeave={() => setHovStat(null)}
          >
            <div className="text-[26px] font-extrabold text-ec-warn leading-none tracking-tighter">{dueTodayCount}</div>
            <div className="text-[9px] font-bold text-ec-t3 uppercase tracking-[1px] mt-0.5">Due Today</div>
            {hovStat === 'due' && (
              <div className="ec-slidedown absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 rounded-lg border border-ec-border text-[11px] text-ec-t2 whitespace-nowrap z-10 backdrop-blur-lg" style={{ backgroundColor: 'var(--ec-sidebar)', boxShadow: 'var(--shadow-md)' }}>
                {dueTodayCount} tasks due today
              </div>
            )}
          </div>

          <div className="w-px h-7 bg-ec-div" />
          <NotificationBell notifications={notifications} onDismissNotification={handleDismissNotification} />

          <div className="text-[11px] text-ec-z6 px-3 py-1 rounded-[20px] bg-ec-card border border-ec-border font-medium tracking-wide">
            {pharmacyConfig.gphcNumber || 'FED07'}
          </div>
        </div>
      </div>

      {/* ═══ RP BAR ═══ */}
      <RPPresenceBar
        rpName={rpAssignee}
        rpSignedIn={rpSignedIn}
        rpSignInTime={rpSignInTime}
        rpLastSignOut={rpLastSignOut}
        sessions={sessions}
        keys={keys}
        onKeyPress={handleKeyPress}
        showFridge={showFridge}
        fridgeVal={fridgeVal}
        onFridgeChange={setFridgeVal}
        onFridgeSubmit={submitFridge}
        onToggleRP={handleRpToggle}
        mob={mob}
      />

      {/* ═══ ZONE 2: COMPLIANCE + HEATMAP ═══ */}
      <div className={`flex gap-4 mt-5 ${mob ? 'flex-col' : ''}`}>
        <ComplianceHealth
          areas={complianceAreas}
          overallScore={overallScore}
          hovCard={hovCard}
          onHoverCard={setHovCard}
        />
        <div
          className="ec-fadeup rounded-2xl p-5 w-full md:w-[40%] flex-shrink-0"
          style={{
            minWidth: 0,
            backgroundColor: 'var(--ec-card)',
            border: '1px solid var(--ec-border)',
            borderRadius: 16,
            boxShadow: 'var(--shadow)',
            animationDelay: '0.3s',
          }}
        >
          <ComplianceHeatmap
            scoreHistory={scoreHistoryEntries}
            todayScore={overallScore}
          />
        </div>
      </div>

      {/* ═══ RP TIMELINE ═══ */}
      <RPTimeline sessions={sessions} rpName={rpAssignee} />

      {/* ═══ ALERT BANNER ═══ */}
      <AlertBanner alerts={criticalAlerts} />

      {/* ═══ TASK SCHEDULE ═══ */}
      <div>
        <div
          className="ec-fadeup text-[13px] font-bold text-ec-t1 mt-7 mb-3.5 flex items-center gap-2"
          style={{ animationDelay: '0.4s' }}
        >
          Task Schedule
          <div className="flex-1 h-px bg-ec-div" />
        </div>
        <div className="flex flex-col gap-1.5">
          <AccPanel
            id="today" title="Today" tasks={todayTasks} isToday
            open={acc.today} onToggle={() => setAcc(p => ({ ...p, today: !p.today }))}
            checked={checked} onToggleCheck={toggleCheck} justChecked={justChecked}
            rpSubChecks={rpSubChecks} onToggleRpSub={toggleRpSub}
            expandedNote={expandedNote} onToggleNote={toggleNote}
            expandedSubchecks={expandedSubchecks} onToggleSubchecks={toggleSubchecks}
            streakDays={streakDays}
          />
          <AccPanel
            id="weekly" title="Weekly" tasks={weeklyTasks}
            open={acc.weekly} onToggle={() => setAcc(p => ({ ...p, weekly: !p.weekly }))}
            checked={checked} onToggleCheck={toggleCheck} justChecked={justChecked}
            rpSubChecks={rpSubChecks} onToggleRpSub={toggleRpSub}
            expandedNote={expandedNote} onToggleNote={toggleNote}
            expandedSubchecks={expandedSubchecks} onToggleSubchecks={toggleSubchecks}
          />
          <AccPanel
            id="fort" title="Fortnightly" tasks={fortnightlyTasks}
            open={acc.fort} onToggle={() => setAcc(p => ({ ...p, fort: !p.fort }))}
            checked={checked} onToggleCheck={toggleCheck} justChecked={justChecked}
            rpSubChecks={rpSubChecks} onToggleRpSub={toggleRpSub}
            expandedNote={expandedNote} onToggleNote={toggleNote}
            expandedSubchecks={expandedSubchecks} onToggleSubchecks={toggleSubchecks}
          />
          <AccPanel
            id="monthly" title="Monthly" tasks={monthlyTasks}
            open={acc.monthly} onToggle={() => setAcc(p => ({ ...p, monthly: !p.monthly }))}
            checked={checked} onToggleCheck={toggleCheck} justChecked={justChecked}
            rpSubChecks={rpSubChecks} onToggleRpSub={toggleRpSub}
            expandedNote={expandedNote} onToggleNote={toggleNote}
            expandedSubchecks={expandedSubchecks} onToggleSubchecks={toggleSubchecks}
          />
        </div>
      </div>

      {/* ═══ TO DO ═══ */}
      <TodoSection
        todos={todos}
        onToggle={handleToggleTodo}
        onAdd={handleAddTodo}
        onDelete={handleDeleteTodo}
        mob={mob}
      />

      {/* ═══ FOOTER ═══ */}
      <div
        className="ec-fadeup mt-12 py-5 border-t border-ec-div text-center"
        style={{ animationDelay: '0.55s' }}
      >
        <span className="text-[11px] text-ec-t5 tracking-wide">Compliance Tracker v4.0 · {pharmacyConfig.pharmacyName || 'iPharmacy Direct'}</span>
      </div>

      {/* ═══ FAB ═══ */}
      <FloatingActionButton
        keys={keys}
        rpSignedIn={rpSignedIn}
        onKeyPress={handleKeyPress}
        onRpToggle={handleRpToggle}
        showFridge={showFridge}
        fridgeVal={fridgeVal}
        onFridgeChange={setFridgeVal}
        onFridgeSubmit={submitFridge}
      />

      {TodoConfirmDialog}

      {/* SCROLL FADE */}
      <div
        className="fixed bottom-0 right-0 h-12 pointer-events-none transition-opacity duration-400"
        style={{
          left: mob ? 0 : 220,
          background: 'linear-gradient(to top, var(--ec-bg), transparent)',
          opacity: scrollFade ? 1 : 0,
        }}
      />
    </div>
  )
}

function formatDur(ms) {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return `${h}h ${m}m`
}
