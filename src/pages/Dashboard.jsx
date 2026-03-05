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

// ─── STATIC FALLBACK CONSTANTS (used when live data isn't available yet) ───
const STAFF_INITIALS = {
  SS: { bg: "#6366f1", label: "Salma Shakoor" },
  AS: { bg: "#059669", label: "Amjid Shakoor" },
  JA: { bg: "#0ea5e9", label: "Jamila Adwan" },
  MH: { bg: "#f59e0b", label: "Marian Hadaway" },
  UK: { bg: "#8b5cf6", label: "Unknown" },
};

const SHIFT_TASKS_DEFAULT = [
  { id: 1, label: "Temperature Log", priority: "HIGH", category: "Cleaning", byTime: "09:00", assignee: "SS", section: "time", done: false },
  { id: 2, label: "Daily RP Checks", priority: "HIGH", category: "RP Check", byTime: "10:00", assignee: "AS", section: "time", done: false },
  { id: 3, label: "Dispensary Clean", priority: "MED", category: "Cleaning", assignee: "UK", section: "anytime", done: false },
  { id: 4, label: "Counter & Surfaces Wipe", priority: "MED", category: "Cleaning", assignee: "SS", section: "anytime", done: false },
];

const WEEKLY_TASKS_DEFAULT = [
  { id: 5, label: "CD Register Balance Check", priority: "HIGH", category: "CD Check", assignee: "AS", done: false },
  { id: 6, label: "Fridge Temperature Review", priority: "HIGH", category: "Cleaning", assignee: "JA", done: false },
  { id: 7, label: "Near Miss Log Review", priority: "MED", category: "Compliance", assignee: "AS", done: false },
  { id: 8, label: "Robot Dispenser Wipe-Down", priority: "MED", category: "Cleaning", assignee: "MH", done: false },
  { id: 9, label: "Waste Disposal Check", priority: "LOW", category: "Waste", assignee: "MH", done: false },
  { id: 10, label: "PPE Stock Check", priority: "MED", category: "H&S", assignee: "MH", done: false },
];

const FORTNIGHTLY_TASKS_DEFAULT = [
  { id: 11, label: "SOP Review Sign-off", priority: "HIGH", category: "Compliance", assignee: "AS", done: false },
  { id: 12, label: "Sharps Bin Check", priority: "MED", category: "H&S", assignee: "MH", done: false },
];

const MONTHLY_TASKS_DEFAULT = [
  { id: 13, label: "Controlled Drug Audit", priority: "HIGH", category: "CD Check", assignee: "AS", done: false },
  { id: 14, label: "Staff Training Records Review", priority: "MED", category: "Compliance", assignee: "AS", done: false },
  { id: 15, label: "Complaint & Incident Summary", priority: "MED", category: "Compliance", assignee: "AS", done: false },
];

const CD_ENTRIES_DEFAULT = [
  { drug: "Morphine Sulfate 10mg/5ml", form: "Oral Solution", balance: 1240, unit: "ml", lastCheck: "04/03/2026", checker: "AS", status: "ok" },
  { drug: "Oxycodone 5mg", form: "Capsules", balance: 84, unit: "caps", lastCheck: "04/03/2026", checker: "AS", status: "ok" },
  { drug: "Methadone 1mg/ml", form: "Oral Solution", balance: 2800, unit: "ml", lastCheck: "03/03/2026", checker: "AS", status: "due" },
  { drug: "Diazepam 5mg", form: "Tablets", balance: 210, unit: "tabs", lastCheck: "04/03/2026", checker: "AS", status: "ok" },
  { drug: "Buprenorphine 8mg", form: "Sublingual", balance: 16, unit: "tabs", lastCheck: "01/03/2026", checker: "AS", status: "overdue" },
];

const EXPIRING_DOCS_DEFAULT = [
  { name: "Fire Risk Assessment", days: -5, owner: "AS" },
  { name: "Safeguarding Policy", days: 6, owner: "JA" },
  { name: "CD SOP", days: 12, owner: "AS" },
  { name: "GPhC Registration", days: 45, owner: "AS" },
  { name: "Waste Contract (Shred-it)", days: 60, owner: "MH" },
];

const COMPLIANCE_HEALTH_DEFAULT = [
  { key: "documents", label: "Documents", pct: 87, trend: "Stable", sub: "32 expiring", subColor: "#d97706", icon: "📄", detail: "4 expired · 28 due within 90 days", color: "#059669" },
  { key: "training", label: "Training", pct: 68, trend: "Needs attention", sub: "483 modules outstanding", subColor: "#ef4444", icon: "📚", detail: "14 staff tracked — bulk import incomplete", color: "#047857" },
  { key: "cleaning", label: "Cleaning", pct: 42, trend: "Needs attention", sub: "19 overdue tasks", subColor: "#ef4444", icon: "🧹", detail: "Daily & weekly rotas not being marked complete", color: "#f59e0b" },
  { key: "safeguarding", label: "Safeguarding", pct: 100, trend: "All current", sub: "All current", subColor: "#059669", icon: "🛡️", detail: "All staff certificates valid", color: "#16a34a" },
];

const ALERTS_DEFAULT = [
  { level: "red", msg: "Training completion rate critically low — 483 modules outstanding" },
  { level: "red", msg: "Cleaning at 42% — 19 tasks overdue across Daily & Weekly rota" },
  { level: "amber", msg: "32 documents expiring within 90 days" },
  { level: "amber", msg: "No RP signed in — Daily RP Checks not started (0/5)" },
  { level: "yellow", msg: "Last GPhC inspection was 14 months ago — consider mock inspection" },
];

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

function Avatar({ initials, size = 24 }) {
  const cfg = STAFF_INITIALS[initials] || { bg: "#94a3b8", label: initials };
  return (
    <div title={cfg.label} style={{ width: size, height: size, borderRadius: "50%", background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{initials}</div>
  );
}

function PriorityBadge({ level }) {
  const cfg = { HIGH: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" }, MED: { bg: "#fffbeb", color: "#d97706", border: "#fde68a" }, LOW: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" } }[level] || { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0" };
  return <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, letterSpacing: "0.05em", fontFamily: "'DM Mono', monospace" }}>{level}</span>;
}

function CategoryTag({ label }) {
  const cfg = { "Cleaning": { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" }, "RP Check": { bg: "#fdf4ff", color: "#9333ea", border: "#e9d5ff" }, "CD Check": { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" }, "Compliance": { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" }, "H&S": { bg: "#fef9c3", color: "#a16207", border: "#fde68a" }, "Waste": { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" } }[label] || { bg: "#f1f5f9", color: "#475569", border: "#e2e8f0" };
  return <span style={{ fontSize: 9, fontWeight: 600, padding: "1px 7px", borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>{label}</span>;
}

function CircleProgress({ pct, color, size = 52 }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (pct / 100) * circ;
  const pctColor = pct >= 80 ? "#059669" : pct >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e8f5e9" strokeWidth={6} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6} strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: pctColor, fontFamily: "'DM Mono', monospace" }}>{pct}%</div>
    </div>
  );
}

function DashCardHeader({ gradient, icon, title, right }) {
  return (
    <div style={{ margin: "-14px -16px 12px", padding: "9px 16px", background: gradient, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, color: "white", fontSize: 13, fontWeight: 700 }}><span>{icon}</span>{title}</div>
      {right && <div style={{ color: "rgba(255,255,255,0.9)" }}>{right}</div>}
    </div>
  );
}

function TaskRow({ task, onToggle }) {
  return (
    <div onClick={() => onToggle && onToggle(task.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8, cursor: "pointer", background: task.done ? "#f0fdf4" : "white", border: `1px solid ${task.done ? "#6ee7b7" : "#e2e8f0"}`, marginBottom: 4, transition: "background 0.12s" }}>
      <div style={{ width: 17, height: 17, borderRadius: 5, flexShrink: 0, border: task.done ? "none" : "2px solid #d1d5db", background: task.done ? "#059669" : "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {task.done && <span style={{ color: "white", fontSize: 10, fontWeight: 700 }}>✓</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: task.done ? "#6ee7b7" : "#1e293b", textDecoration: task.done ? "line-through" : "none" }}>{task.label}</div>
        {task.sub && !task.done && <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>› {task.sub}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
        <PriorityBadge level={task.priority} />
        <CategoryTag label={task.category} />
        {task.byTime && <span style={{ fontSize: 9, color: "#94a3b8", fontFamily: "'DM Mono', monospace" }}>⏱{task.byTime}</span>}
        <Avatar initials={task.assignee} size={22} />
      </div>
    </div>
  );
}

function ComplianceCardItem({ item, expanded, onToggle }) {
  return (
    <div onClick={onToggle} style={{ background: "white", borderRadius: 10, padding: "10px 12px", border: "1px solid #d1fae5", cursor: "pointer", boxShadow: expanded ? "0 2px 10px rgba(0,0,0,0.06)" : "none", transition: "all 0.2s", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: item.color, borderRadius: "10px 0 0 10px" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 6 }}>
        <CircleProgress pct={item.pct} color={item.color} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#064e3b", marginBottom: 2 }}>{item.icon} {item.label}</div>
          <div style={{ fontSize: 10, color: item.subColor, fontWeight: 600 }}>{item.sub}</div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, marginTop: 3, fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 20, background: item.trend === "Needs attention" ? "#fef2f2" : "#f0fdf4", color: item.trend === "Needs attention" ? "#dc2626" : "#059669", border: `1px solid ${item.trend === "Needs attention" ? "#fecaca" : "#6ee7b7"}` }}>
            {item.trend === "Needs attention" ? "⚠" : "✓"} {item.trend}
          </span>
        </div>
      </div>
      {expanded && <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #f0fdf4", fontSize: 11, color: "#64748b", paddingLeft: 6, lineHeight: 1.6 }}>{item.detail}</div>}
    </div>
  );
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
