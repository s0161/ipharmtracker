import { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSupabase } from '../hooks/useSupabase'
import { logAudit } from '../utils/auditLog'
import { useUser } from '../contexts/UserContext'
import { generateId, formatDateTime, DEFAULT_CLEANING_TASKS } from '../utils/helpers'
import { downloadCsv } from '../utils/exportCsv'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'
import { useConfirm } from '../components/ConfirmDialog'
import DashCardHeader from '../components/DashCardHeader'
import Avatar from '../components/Avatar'

// ─── Google Font injection ───
if (!document.getElementById('dm-fonts-link')) {
  const l = document.createElement('link')
  l.id = 'dm-fonts-link'
  l.rel = 'stylesheet'
  l.href = 'https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&display=swap'
  document.head.appendChild(l)
}

const DM = "'DM Sans', sans-serif"
const MONO = "'DM Mono', monospace"
const CARD = { background: 'var(--bg-card)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-card)' }

// ─── Rota schedule template ───
const ROTA = [
  { name: 'Dispensary Clean', frequency: 'daily', assignee: 'Umama Khan' },
  { name: 'Counter & Surfaces Wipe', frequency: 'daily', assignee: 'Salma Shakoor' },
  { name: 'Fridge Temperature Recorded', frequency: 'daily', assignee: 'Salma Shakoor' },
  { name: 'Deep Fridge Clean', frequency: 'weekly', assignee: 'Jamila Adwan' },
  { name: 'Robot Dispenser Wipe-Down', frequency: 'weekly', assignee: 'Marian Hadaway' },
  { name: 'Waste Disposal Check', frequency: 'weekly', assignee: 'Marian Hadaway' },
  { name: 'Fridge Quick Clean', frequency: 'fortnightly', assignee: 'Jamila Adwan' },
  { name: 'PPE Stock Check', frequency: 'fortnightly', assignee: 'Marian Hadaway' },
  { name: 'Deep Equipment Clean', frequency: 'monthly', assignee: 'Amjid Shakoor' },
  { name: 'Dispensary Floor Clean', frequency: 'monthly', assignee: 'Umama Khan' },
]
const FREQ_MAP = { daily: 1, weekly: 7, fortnightly: 14, monthly: 30 }
const FREQ_LABELS = { daily: 'Daily', weekly: 'Weekly', fortnightly: 'Fortnightly', monthly: 'Monthly' }

const emptyForm = { taskName: '', customTask: '', dateTime: '', staffMember: '', result: '', notes: '' }
const inputClass = "w-full bg-ec-card border border-ec-border rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors"
const PER_PAGE = 20

// ─── Helpers ───
function startOfWeek(d = new Date()) { const dt = new Date(d); dt.setHours(0,0,0,0); dt.setDate(dt.getDate() - dt.getDay()); return dt }
function startOfMonth(d = new Date()) { const dt = new Date(d); dt.setHours(0,0,0,0); dt.setDate(1); return dt }
function daysBetween(a, b) { return (b - a) / 864e5 }

function getRotaStatus(task, entries) {
  const passes = entries.filter(e => e.taskName === task.name && e.result === 'Pass')
  if (passes.length === 0) return 'overdue'
  const latest = passes.reduce((a, b) => new Date(a.dateTime) > new Date(b.dateTime) ? a : b)
  const diff = daysBetween(new Date(latest.dateTime), new Date())
  const limit = FREQ_MAP[task.frequency] || 7
  if (diff < 0.5 && task.frequency === 'daily') return 'done'
  if (diff <= 1 && task.frequency === 'daily') return 'done'
  if (diff >= limit) return 'overdue'
  if (diff >= limit * 0.8) return 'due-soon'
  return 'done'
}

function lastPassDate(taskName, entries) {
  const passes = entries.filter(e => e.taskName === taskName && e.result === 'Pass')
  if (passes.length === 0) return null
  return passes.reduce((a, b) => new Date(a.dateTime) > new Date(b.dateTime) ? a : b).dateTime
}

// ─── SVG chart helpers (no recharts) ───
function BarChartSVG({ data, height = 160 }) {
  if (data.length === 0) return null
  const maxVal = Math.max(...data.map(d => d.value), 100)
  const barW = Math.min(40, (300 - data.length * 4) / data.length)
  const totalW = data.length * (barW + 8) + 40
  const chartH = height - 30
  return (
    <svg width="100%" viewBox={`0 0 ${totalW} ${height}`} style={{ fontFamily: MONO, overflow: 'visible' }}>
      {/* Y axis labels */}
      {[0, 25, 50, 75, 100].map(v => {
        const y = chartH - (v / maxVal) * chartH
        return <g key={v}><text x="22" y={y + 3} textAnchor="end" fontSize="8" fill="var(--text-muted)">{v}%</text><line x1="28" x2={totalW} y1={y} y2={y} stroke="var(--border-card)" strokeWidth="0.5" /></g>
      })}
      {/* 80% reference line */}
      <line x1="28" x2={totalW} y1={chartH - (80 / maxVal) * chartH} y2={chartH - (80 / maxVal) * chartH} stroke="#d1fae5" strokeWidth="1" strokeDasharray="3 3" />
      <text x={totalW - 2} y={chartH - (80 / maxVal) * chartH - 4} textAnchor="end" fontSize="7" fill="#6ee7b7">Target 80%</text>
      {/* Bars */}
      {data.map((d, i) => {
        const bh = (d.value / maxVal) * chartH
        const x = 32 + i * (barW + 8)
        const color = d.value >= 80 ? '#059669' : d.value >= 50 ? '#f59e0b' : '#ef4444'
        return (
          <g key={i}>
            <rect x={x} y={chartH - bh} width={barW} height={bh} rx={3} fill={color} opacity={0.85} />
            <text x={x + barW / 2} y={chartH - bh - 4} textAnchor="middle" fontSize="8" fontWeight="600" fill={color}>{Math.round(d.value)}%</text>
            <text x={x + barW / 2} y={chartH + 12} textAnchor="middle" fontSize="8" fill="var(--text-muted)">{d.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

function HBarChartSVG({ data, height = 200 }) {
  if (data.length === 0) return null
  const maxVal = Math.max(...data.map(d => d.pass + d.fail), 1)
  const barH = Math.min(20, (height - 20) / data.length - 4)
  const chartW = 280
  const labelW = 120
  return (
    <svg width="100%" viewBox={`0 0 ${labelW + chartW + 20} ${data.length * (barH + 6) + 20}`} style={{ fontFamily: MONO, overflow: 'visible' }}>
      {data.map((d, i) => {
        const y = i * (barH + 6) + 4
        const pw = (d.pass / maxVal) * chartW
        const fw = (d.fail / maxVal) * chartW
        return (
          <g key={i}>
            <text x={labelW - 4} y={y + barH / 2 + 3} textAnchor="end" fontSize="8" fill="var(--text-primary)" style={{ fontFamily: DM }}>{d.name.length > 18 ? d.name.slice(0, 18) + '…' : d.name}</text>
            <rect x={labelW} y={y} width={pw} height={barH} rx={2} fill="#059669" opacity={0.8} />
            <rect x={labelW + pw} y={y} width={fw} height={barH} rx={2} fill="#ef4444" opacity={0.7} />
            {pw > 12 && <text x={labelW + pw / 2} y={y + barH / 2 + 3} textAnchor="middle" fontSize="7" fill="white" fontWeight="600">{d.pass}</text>}
            {fw > 12 && <text x={labelW + pw + fw / 2} y={y + barH / 2 + 3} textAnchor="middle" fontSize="7" fill="white" fontWeight="600">{d.fail}</text>}
          </g>
        )
      })}
      {/* Legend */}
      <g transform={`translate(${labelW}, ${data.length * (barH + 6) + 8})`}>
        <rect width="8" height="8" rx="2" fill="#059669" /><text x="12" y="7" fontSize="8" fill="var(--text-muted)">Pass</text>
        <rect x="44" width="8" height="8" rx="2" fill="#ef4444" /><text x="56" y="7" fontSize="8" fill="var(--text-muted)">Fail</text>
      </g>
    </svg>
  )
}

// ─── Component ───
export default function CleaningRota() {
  const { user } = useUser()
  const [entries, setEntries, loading] = useSupabase('cleaning_entries', [])
  const [staffMembers] = useSupabase('staff_members', [], { valueField: 'name' })
  const [cleaningTasks] = useSupabase('cleaning_tasks', DEFAULT_CLEANING_TASKS)
  const showToast = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  const [searchParams, setSearchParams] = useSearchParams()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [errors, setErrors] = useState({})
  const [tab, setTab] = useState('schedule')
  const [filterStaff, setFilterStaff] = useState('')
  const [filterResult, setFilterResult] = useState('')
  const [filterFreq, setFilterFreq] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(0)
  const [markingTask, setMarkingTask] = useState(null)
  const [markForm, setMarkForm] = useState({ result: 'Pass', notes: '' })
  const [todayFilter, setTodayFilter] = useState(false)
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [selectedDay, setSelectedDay] = useState(null)
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false)
  const filterRef = useRef(null)

  useEffect(() => {
    if (searchParams.get('add') === 'true' && !loading) {
      setForm({ ...emptyForm, dateTime: new Date().toISOString().slice(0, 16) })
      setEditingId(null)
      setModalOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [loading, searchParams, setSearchParams])

  // Close filter popover on outside click
  useEffect(() => {
    if (!filterPopoverOpen) return
    const handler = (e) => { if (filterRef.current && !filterRef.current.contains(e.target)) setFilterPopoverOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [filterPopoverOpen])

  const taskNames = cleaningTasks.map(t => t.name)

  // Deduplicate entries
  const deduped = useMemo(() => {
    const map = new Map()
    entries.forEach(e => {
      const key = `${e.taskName}|${e.dateTime}`
      const existing = map.get(key)
      if (!existing || new Date(e.createdAt) > new Date(existing.createdAt)) map.set(key, e)
    })
    return [...map.values()]
  }, [entries])

  const sorted = useMemo(() => [...deduped].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [deduped])

  // ─── Stats ───
  const stats = useMemo(() => {
    const now = new Date()
    const weekStart = startOfWeek(now)
    const monthStart = startOfMonth(now)
    const weekEntries = deduped.filter(e => new Date(e.dateTime) >= weekStart)
    const monthEntries = deduped.filter(e => new Date(e.dateTime) >= monthStart)
    const weekPass = weekEntries.filter(e => e.result === 'Pass').length
    const monthPass = monthEntries.filter(e => e.result === 'Pass').length
    // Scheduled per period
    const dailyCount = ROTA.filter(r => r.frequency === 'daily').length
    const weeklyCount = ROTA.filter(r => r.frequency === 'weekly').length
    const fnCount = ROTA.filter(r => r.frequency === 'fortnightly').length
    const monthlyCount = ROTA.filter(r => r.frequency === 'monthly').length
    const daysSinceWeekStart = Math.max(1, Math.ceil(daysBetween(weekStart, now)))
    const weekScheduled = dailyCount * daysSinceWeekStart + weeklyCount + (daysSinceWeekStart >= 14 ? fnCount : 0)
    const daysInMonth = Math.max(1, Math.ceil(daysBetween(monthStart, now)))
    const monthScheduled = dailyCount * daysInMonth + weeklyCount * Math.ceil(daysInMonth / 7) + fnCount * Math.ceil(daysInMonth / 14) + monthlyCount
    const overdue = ROTA.filter(r => getRotaStatus(r, deduped) === 'overdue').length
    const complianceRate = monthScheduled > 0 ? Math.round((monthPass / monthScheduled) * 100) : 0
    return { weekPass, weekScheduled, monthPass, monthScheduled, overdue, complianceRate }
  }, [deduped])

  // ─── Rota statuses ───
  const rotaStatuses = useMemo(() => ROTA.map(r => ({ ...r, status: getRotaStatus(r, deduped), lastPass: lastPassDate(r.name, deduped) })), [deduped])

  // ─── Today filter count ───
  const todayDueCount = useMemo(() => rotaStatuses.filter(r => r.status === 'overdue' || r.status === 'due-soon' || (r.frequency === 'daily' && r.status !== 'done')).length, [rotaStatuses])

  // ─── Calendar day statuses ───
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1)
    const lastDay = new Date(calYear, calMonth + 1, 0)
    const today = new Date(); today.setHours(0,0,0,0)
    const days = []
    // Pad start to Monday
    let startPad = (firstDay.getDay() + 6) % 7 // 0=Mon
    for (let i = 0; i < startPad; i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(calYear, calMonth, d)
      date.setHours(0,0,0,0)
      const nextDate = new Date(date); nextDate.setDate(nextDate.getDate() + 1)
      if (date > today) { days.push({ day: d, date, status: 'future' }); continue }
      const dayEntries = deduped.filter(e => { const ed = new Date(e.dateTime); return ed >= date && ed < nextDate })
      const passes = dayEntries.filter(e => e.result === 'Pass').length
      const total = dayEntries.length
      const dailyTasks = ROTA.filter(r => r.frequency === 'daily').length
      let status = 'missed'
      if (total === 0) status = 'missed'
      else if (passes >= dailyTasks) status = 'complete'
      else if (passes > 0) status = 'partial'
      days.push({ day: d, date, status, passes, total })
    }
    return days
  }, [calMonth, calYear, deduped])

  const calMonthLabel = new Date(calYear, calMonth).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  // ─── Filtered history ───
  const filteredHistory = useMemo(() => {
    return sorted.filter(e => {
      if (filterStaff && e.staffMember !== filterStaff) return false
      if (filterResult === 'Pass' && e.result !== 'Pass') return false
      if (filterResult === 'Fail' && e.result === 'Pass') return false
      if (filterResult === 'Overdue') {
        const task = cleaningTasks.find(t => t.name === e.taskName)
        if (!task) return false
      }
      if (filterFreq) {
        const task = cleaningTasks.find(t => t.name === e.taskName)
        if (!task || task.frequency !== filterFreq) return false
      }
      if (dateFrom && (e.dateTime || '') < dateFrom) return false
      if (dateTo && (e.dateTime || '') > dateTo + 'T23:59') return false
      // Calendar day filter
      if (selectedDay) {
        const ed = new Date(e.dateTime)
        if (ed.getFullYear() !== selectedDay.getFullYear() || ed.getMonth() !== selectedDay.getMonth() || ed.getDate() !== selectedDay.getDate()) return false
      }
      return true
    })
  }, [sorted, filterStaff, filterResult, filterFreq, dateFrom, dateTo, cleaningTasks, selectedDay])

  // ─── Filtered schedule ───
  const filteredSchedule = useMemo(() => {
    return rotaStatuses.filter(r => {
      if (filterStaff && r.assignee !== filterStaff) return false
      if (filterFreq && r.frequency !== filterFreq) return false
      if (filterResult === 'Overdue' && r.status !== 'overdue') return false
      if (filterResult === 'Pass' && r.status !== 'done') return false
      if (todayFilter && r.status === 'done') return false
      return true
    })
  }, [rotaStatuses, filterStaff, filterFreq, filterResult, todayFilter])

  // ─── Chart data ───
  const weeklyChartData = useMemo(() => {
    const weeks = []
    const now = new Date()
    for (let w = 7; w >= 0; w--) {
      const wStart = new Date(now)
      wStart.setDate(wStart.getDate() - w * 7)
      const ws = startOfWeek(wStart)
      const we = new Date(ws); we.setDate(we.getDate() + 7)
      const weekEntries = deduped.filter(e => { const d = new Date(e.dateTime); return d >= ws && d < we })
      const passes = weekEntries.filter(e => e.result === 'Pass').length
      const total = weekEntries.length || 1
      weeks.push({ label: `W${8 - w}`, value: Math.round((passes / total) * 100) })
    }
    return weeks
  }, [deduped])

  const taskBreakdownData = useMemo(() => {
    const now = new Date()
    const thirtyAgo = new Date(now); thirtyAgo.setDate(thirtyAgo.getDate() - 30)
    const recent = deduped.filter(e => new Date(e.dateTime) >= thirtyAgo)
    const map = {}
    recent.forEach(e => {
      if (!map[e.taskName]) map[e.taskName] = { name: e.taskName, pass: 0, fail: 0 }
      if (e.result === 'Pass') map[e.taskName].pass++
      else map[e.taskName].fail++
    })
    return Object.values(map).sort((a, b) => (b.pass + b.fail) - (a.pass + a.fail))
  }, [deduped])

  // ─── Unique staff from entries ───
  const uniqueStaff = useMemo(() => [...new Set([...deduped.map(e => e.staffMember), ...ROTA.map(r => r.assignee)].filter(Boolean))].sort(), [deduped])

  // ─── CRUD handlers (preserved) ───
  const openAdd = () => {
    setForm({ ...emptyForm, dateTime: new Date().toISOString().slice(0, 16) })
    setEditingId(null)
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (entry) => {
    const isCustom = !taskNames.includes(entry.taskName) && entry.taskName !== ''
    setForm({
      taskName: isCustom ? '__other__' : entry.taskName,
      customTask: isCustom ? entry.taskName : '',
      dateTime: entry.dateTime,
      staffMember: entry.staffMember,
      result: entry.result,
      notes: entry.notes,
    })
    setEditingId(entry.id)
    setErrors({})
    setModalOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const taskName = form.taskName === '__other__' ? form.customTask.trim() : form.taskName
    const newErrors = {}
    if (!taskName) newErrors.taskName = 'Task is required'
    if (!form.staffMember) newErrors.staffMember = 'Staff member is required'
    if (!form.result) newErrors.result = 'Result is required'
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    setErrors({})
    const data = { taskName, dateTime: form.dateTime, staffMember: form.staffMember, result: form.result, notes: form.notes }
    if (editingId) {
      setEntries(entries.map(e => e.id === editingId ? { ...e, ...data } : e))
      logAudit('Updated', `Cleaning: ${taskName}`, 'Cleaning Rota', user?.name)
      showToast('Cleaning entry updated')
    } else {
      setEntries([...entries, { id: generateId(), ...data, createdAt: new Date().toISOString() }])
      logAudit('Created', `Cleaning: ${taskName}`, 'Cleaning Rota', user?.name)
      showToast('Cleaning entry added')
    }
    setModalOpen(false)
  }

  const handleDelete = async (id) => {
    const ok = await confirm({ title: 'Delete entry?', message: 'Are you sure you want to delete this cleaning entry? This action cannot be undone.', confirmLabel: 'Delete', variant: 'danger' })
    if (!ok) return
    const entry = entries.find(e => e.id === id)
    setEntries(entries.filter(e => e.id !== id))
    logAudit('Deleted', `Cleaning: ${entry?.taskName}`, 'Cleaning Rota', user?.name)
    showToast('Entry deleted', 'info')
  }

  const handleMarkDone = (task) => {
    const data = {
      taskName: task.name,
      dateTime: new Date().toISOString().slice(0, 16),
      staffMember: user?.name || task.assignee,
      result: markForm.result,
      notes: markForm.notes,
    }
    setEntries([...entries, { id: generateId(), ...data, createdAt: new Date().toISOString() }])
    logAudit('Created', `Cleaning: ${task.name}`, 'Cleaning Rota', user?.name)
    showToast(`${task.name} marked as ${markForm.result}`)
    setMarkingTask(null)
    setMarkForm({ result: 'Pass', notes: '' })
  }

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleCsvDownload = () => {
    const headers = ['Task', 'Date / Time', 'Staff Member', 'Result', 'Notes']
    const rows = sorted.map(e => [e.taskName, e.dateTime || '', e.staffMember, e.result, e.notes || ''])
    downloadCsv('cleaning-rota', headers, rows)
  }

  const hasFilters = filterStaff || filterResult || filterFreq || dateFrom || dateTo || todayFilter || selectedDay
  const activeFilterCount = [filterStaff, filterResult, filterFreq, dateFrom || dateTo].filter(Boolean).length
  const clearFilters = () => { setFilterStaff(''); setFilterResult(''); setFilterFreq(''); setDateFrom(''); setDateTo(''); setTodayFilter(false); setSelectedDay(null); setPage(0) }
  const pagedHistory = filteredHistory.slice(page * PER_PAGE, (page + 1) * PER_PAGE)
  const totalPages = Math.ceil(filteredHistory.length / PER_PAGE)

  if (loading) return <div style={{ padding: 24 }}><div style={{ ...CARD, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontFamily: DM, fontSize: 13 }}>Loading cleaning data…</div></div>

  // ─── Pill button helper ───
  const Pill = ({ active, label, onClick }) => (
    <button onClick={onClick} style={{
      padding: '4px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600, fontFamily: DM,
      border: active ? '1.5px solid #059669' : '1px solid var(--border-card)',
      background: active ? '#059669' : 'transparent',
      color: active ? '#fff' : 'var(--text-secondary)',
      cursor: 'pointer', transition: 'all 0.15s',
    }}>{label}</button>
  )

  // ─── Status dot ───
  const StatusDot = ({ status }) => {
    const colors = { done: '#059669', 'due-soon': '#f59e0b', overdue: '#ef4444' }
    return <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors[status] || '#d4d4d8', flexShrink: 0 }} />
  }

  const groupedSchedule = ['daily', 'weekly', 'fortnightly', 'monthly'].map(freq => ({
    freq,
    label: FREQ_LABELS[freq],
    tasks: filteredSchedule.filter(r => r.frequency === freq),
    overdueCount: filteredSchedule.filter(r => r.frequency === freq && r.status === 'overdue').length,
  })).filter(g => g.tasks.length > 0)

  return (
    <div style={{ fontFamily: DM }}>
      {/* ─── PAGE HEADER ─── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>Cleaning Rota</h1>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>Log cleaning activities and track compliance for GPhC auditing.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={handleCsvDownload} style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, fontFamily: DM,
              background: 'var(--bg-card)', border: '1px solid var(--border-card)', color: 'var(--text-secondary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              CSV
            </button>
            <button onClick={openAdd} style={{
              padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: DM,
              background: '#059669', color: '#fff', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>＋ Add Entry</button>
          </div>
        </div>
      </div>

      {/* ─── STATS BAR ─── */}
      <div style={{ ...CARD, padding: '8px 16px', display: 'flex', gap: 0, marginBottom: 14 }}>
        {[
          { label: 'Done this week', value: `${stats.weekPass}/${stats.weekScheduled}`, color: 'var(--text-primary)', accent: '#059669' },
          { label: 'Done this month', value: `${stats.monthPass}/${stats.monthScheduled}`, color: 'var(--text-primary)', accent: '#3b82f6' },
          { label: 'Overdue', value: stats.overdue, color: stats.overdue > 0 ? '#ef4444' : 'var(--text-primary)', accent: '#ef4444' },
          { label: 'Compliance rate', value: `${stats.complianceRate}%`, color: stats.complianceRate >= 80 ? '#059669' : stats.complianceRate >= 50 ? '#f59e0b' : '#ef4444', accent: stats.complianceRate >= 80 ? '#059669' : stats.complianceRate >= 50 ? '#f59e0b' : '#ef4444' },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', padding: '2px 12px', borderLeft: `3px solid ${s.accent}` }}>
            <div style={{ fontFamily: MONO, fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ─── FILTERS BAR ─── */}
      <div style={{ ...CARD, padding: '8px 16px', display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
        {/* Today's Tasks quick filter */}
        <button onClick={() => { setTodayFilter(!todayFilter); setTab('schedule'); setPage(0) }} style={{
          padding: '5px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600, fontFamily: DM,
          border: todayFilter ? '1.5px solid #059669' : '1.5px solid #d1fae5',
          background: todayFilter ? '#059669' : '#f0fdf4',
          color: todayFilter ? '#fff' : '#059669',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s',
        }}>
          <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="12" height="11" rx="1.5" /><path d="M2 6h12M5 1v3M11 1v3" /></svg>
          Today's Tasks
          {todayDueCount > 0 && (
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 10, marginLeft: 2,
              background: todayFilter ? 'rgba(255,255,255,0.25)' : '#059669', color: '#fff',
            }}>{todayDueCount}</span>
          )}
        </button>

        {/* Filter popover trigger */}
        <div ref={filterRef} style={{ position: 'relative' }}>
          <button onClick={() => setFilterPopoverOpen(!filterPopoverOpen)} style={{
            padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, fontFamily: DM,
            background: 'var(--bg-card)', border: '1px solid var(--border-card)', color: 'var(--text-secondary)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s',
          }}>
            <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="2.5" /><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" /></svg>
            Filters
            {activeFilterCount > 0 && (
              <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 10, background: '#059669', color: '#fff' }}>{activeFilterCount}</span>
            )}
          </button>

          {filterPopoverOpen && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, marginTop: 6, width: 280, zIndex: 50,
              background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 12,
              padding: 14, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', fontFamily: DM,
            }}>
              {/* Result */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Result</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {['', 'Pass', 'Fail', 'Overdue'].map(r => (
                    <Pill key={r || 'all'} label={r || 'All'} active={filterResult === r} onClick={() => { setFilterResult(r); setPage(0) }} />
                  ))}
                </div>
              </div>
              {/* Frequency */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Frequency</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {['', 'daily', 'weekly', 'fortnightly', 'monthly'].map(f => (
                    <Pill key={f || 'all'} label={f ? FREQ_LABELS[f] : 'All'} active={filterFreq === f} onClick={() => { setFilterFreq(f); setPage(0) }} />
                  ))}
                </div>
              </div>
              {/* Staff */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Staff</div>
                <select value={filterStaff} onChange={e => { setFilterStaff(e.target.value); setPage(0) }} style={{
                  width: '100%', padding: '5px 10px', borderRadius: 8, fontSize: 11, fontFamily: DM,
                  background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)', cursor: 'pointer',
                }}>
                  <option value="">All Staff</option>
                  {uniqueStaff.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {/* Date range */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date Range</div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(0) }} style={{
                    flex: 1, padding: '4px 6px', borderRadius: 6, fontSize: 11, fontFamily: MONO,
                    background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)',
                  }} />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>to</span>
                  <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(0) }} style={{
                    flex: 1, padding: '4px 6px', borderRadius: 6, fontSize: 11, fontFamily: MONO,
                    background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)',
                  }} />
                </div>
              </div>
              {/* Clear all */}
              {hasFilters && (
                <button onClick={() => { clearFilters(); setFilterPopoverOpen(false) }} style={{ fontSize: 11, color: '#059669', background: 'none', border: 'none', cursor: 'pointer', fontFamily: DM, fontWeight: 600, padding: 0 }}>Clear all filters</button>
              )}
            </div>
          )}
        </div>

        {/* Active filter summary */}
        {selectedDay && (
          <>
            <div style={{ width: 1, height: 20, background: 'var(--border-card)' }} />
            <button onClick={() => setSelectedDay(null)} style={{ fontSize: 10, color: '#059669', background: 'none', border: 'none', cursor: 'pointer', fontFamily: DM, fontWeight: 600 }}>
              {selectedDay.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} ✕
            </button>
          </>
        )}
        {hasFilters && !selectedDay && (
          <>
            <div style={{ width: 1, height: 20, background: 'var(--border-card)' }} />
            <button onClick={clearFilters} style={{ fontSize: 10, color: '#059669', background: 'none', border: 'none', cursor: 'pointer', fontFamily: DM, fontWeight: 600 }}>Clear all ✕</button>
          </>
        )}
      </div>

      {/* ─── TABS ─── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {[['schedule', 'Schedule'], ['history', 'History'], ['chart', 'Compliance Chart']].map(([key, label]) => (
          <Pill key={key} label={label} active={tab === key} onClick={() => { setTab(key); setPage(0) }} />
        ))}
      </div>

      {/* ═══ TAB 1 — SCHEDULE ═══ */}
      {tab === 'schedule' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 12, alignItems: 'start' }}>
          {/* Left — Task list */}
          <div style={CARD}>
            <DashCardHeader gradient="linear-gradient(90deg, #064e3b, #047857)" icon="📋" title="Cleaning Schedule" right={<span style={{ fontSize: 11, fontFamily: MONO }}>{ROTA.length} tasks</span>} />

            {groupedSchedule.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)', fontSize: 13 }}>No tasks match current filters.</div>
            ) : groupedSchedule.map(group => (
              <div key={group.freq} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>{group.label}</span>
                  {group.overdueCount > 0 && (
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 8px', borderRadius: 10, background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }}>{group.overdueCount} overdue</span>
                  )}
                </div>
                {group.tasks.map(task => {
                  const isOverdue = task.status === 'overdue'
                  const isMarking = markingTask === task.name
                  return (
                    <div key={task.name}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, marginBottom: 4,
                        background: 'transparent',
                        borderLeft: isOverdue ? '3px solid #ef4444' : '3px solid transparent',
                        border: isOverdue ? '1px solid #fecaca' : '1px solid transparent',
                        borderLeftWidth: isOverdue ? 3 : 0,
                        transition: 'all 0.15s',
                      }}>
                        {!isOverdue && <StatusDot status={task.status} />}
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', flex: 1, minWidth: 0 }}>{task.name}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, fontFamily: DM,
                          background: task.frequency === 'daily' ? 'rgba(5,150,105,0.08)' : task.frequency === 'weekly' ? 'rgba(59,130,246,0.08)' : task.frequency === 'fortnightly' ? 'rgba(139,92,246,0.08)' : 'rgba(245,158,11,0.08)',
                          color: task.frequency === 'daily' ? '#059669' : task.frequency === 'weekly' ? '#3b82f6' : task.frequency === 'fortnightly' ? '#8b5cf6' : '#f59e0b',
                        }}>{FREQ_LABELS[task.frequency]}</span>
                        <span style={{ fontSize: 10, fontFamily: MONO, color: 'var(--text-muted)', minWidth: 70 }}>
                          {task.lastPass ? new Date(task.lastPass).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : <em style={{ fontSize: 10, fontStyle: 'italic', color: 'var(--text-faint, var(--text-muted))' }}>Not yet logged</em>}
                        </span>
                        <Avatar name={task.assignee} size={22} />
                        {isOverdue && (
                          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#ef4444', color: '#fff' }}>OVERDUE</span>
                        )}
                        {task.status !== 'done' ? (
                          <button onClick={() => { setMarkingTask(isMarking ? null : task.name); setMarkForm({ result: 'Pass', notes: '' }) }} style={{
                            padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, fontFamily: DM,
                            background: '#f0fdf4', color: '#059669', border: '1px solid #d1fae5', cursor: 'pointer',
                          }}>✓ Mark Done</button>
                        ) : (
                          <span style={{ fontSize: 10, fontWeight: 600, color: '#059669', padding: '4px 8px' }}>✓ Done</span>
                        )}
                      </div>
                      {/* Inline mark-done form */}
                      {isMarking && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 12px 10px 30px' }}>
                          <select value={markForm.result} onChange={e => setMarkForm({ ...markForm, result: e.target.value })} style={{
                            padding: '4px 8px', borderRadius: 6, fontSize: 11, fontFamily: DM,
                            background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)',
                          }}>
                            <option value="Pass">Pass</option>
                            <option value="Action Taken">Fail / Action Taken</option>
                          </select>
                          <input type="text" placeholder="Notes (optional)" value={markForm.notes} onChange={e => setMarkForm({ ...markForm, notes: e.target.value })} style={{
                            flex: 1, padding: '4px 8px', borderRadius: 6, fontSize: 11, fontFamily: DM,
                            background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)',
                          }} />
                          <button onClick={() => handleMarkDone(task)} style={{
                            padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, fontFamily: DM,
                            background: '#059669', color: '#fff', border: 'none', cursor: 'pointer',
                          }}>Save</button>
                          <button onClick={() => setMarkingTask(null)} style={{
                            padding: '4px 8px', borderRadius: 6, fontSize: 11, fontFamily: DM,
                            background: 'transparent', border: '1px solid var(--border-card)', color: 'var(--text-muted)', cursor: 'pointer',
                          }}>Cancel</button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Right — Compact Calendar */}
          <div style={{ ...CARD, padding: 0, overflow: 'hidden', position: 'sticky', top: 80 }}>
            <DashCardHeader gradient="linear-gradient(90deg, #064e3b, #047857)" icon="📅" title="Calendar" right={
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) } else setCalMonth(m => m - 1) }} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, padding: '0 3px', opacity: 0.8 }}>‹</button>
                <span style={{ fontSize: 10, fontFamily: MONO, color: '#fff', minWidth: 90, textAlign: 'center' }}>{calMonthLabel}</span>
                <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) } else setCalMonth(m => m + 1) }} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, padding: '0 3px', opacity: 0.8 }}>›</button>
              </div>
            } />
            <div style={{ padding: '6px 10px 8px' }}>
              {/* Day headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, marginBottom: 2 }}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                  <div key={i} style={{ textAlign: 'center', fontSize: 8, fontWeight: 600, color: 'var(--text-muted)', padding: '1px 0', fontFamily: MONO }}>{d}</div>
                ))}
              </div>
              {/* Day cells */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
                {calendarDays.map((cell, i) => {
                  if (!cell) return <div key={`pad-${i}`} />
                  const dotColors = { complete: '#059669', partial: '#f59e0b', missed: '#ef4444', future: '#d4d4d8' }
                  const isToday = cell.date.getTime() === new Date(new Date().setHours(0,0,0,0)).getTime()
                  const isSelected = selectedDay && cell.date.getTime() === selectedDay.getTime()
                  return (
                    <button key={cell.day} onClick={() => {
                      if (cell.status === 'future') return
                      setSelectedDay(prev => prev && prev.getTime() === cell.date.getTime() ? null : cell.date)
                      setPage(0)
                    }} style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
                      minHeight: 36, padding: '2px 4px', borderRadius: 5,
                      border: isSelected ? '1.5px solid #059669' : isToday ? '1px solid var(--border-card)' : '1px solid transparent',
                      background: isSelected ? 'rgba(5,150,105,0.08)' : isToday ? 'var(--bg-card)' : 'transparent',
                      cursor: cell.status === 'future' ? 'default' : 'pointer', transition: 'all 0.12s',
                    }}>
                      <span style={{ fontSize: 10, fontWeight: isToday ? 700 : 400, color: isToday ? 'var(--text-primary)' : 'var(--text-secondary)', fontFamily: MONO }}>{cell.day}</span>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: dotColors[cell.status] }} />
                    </button>
                  )
                })}
              </div>
              {/* Legend — single line below grid */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 4 }}>
                {[['#059669', 'Done'], ['#f59e0b', 'Partial'], ['#ef4444', 'Missed'], ['#d4d4d8', 'Future']].map(([c, l]) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: c }} />
                    <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: DM }}>{l}</span>
                  </div>
                ))}
              </div>
              {selectedDay && (
                <div style={{ textAlign: 'center', marginTop: 4 }}>
                  <button onClick={() => setSelectedDay(null)} style={{ fontSize: 9, color: '#059669', background: 'none', border: 'none', cursor: 'pointer', fontFamily: DM, fontWeight: 600 }}>
                    Clear ({selectedDay.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })})
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB 2 — HISTORY ═══ */}
      {tab === 'history' && (
        <div style={CARD}>
          <DashCardHeader gradient="linear-gradient(90deg, #064e3b, #047857)" icon="📋" title="Cleaning History" right={<span style={{ fontSize: 11, fontFamily: MONO }}>{filteredHistory.length} entries</span>} />

          {filteredHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>
              {entries.length === 0 ? 'No cleaning entries yet. Start logging cleaning activities.' : 'No entries match your filters.'}
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: DM }}>
                  <thead>
                    <tr>
                      {['Task', 'Date / Time', 'Staff', 'Result', 'Notes', 'Actions'].map(h => (
                        <th key={h} style={{ textAlign: 'left', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', padding: '8px 10px', borderBottom: '1px solid var(--border-card)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedHistory.map((entry, idx) => {
                      const isPass = entry.result === 'Pass'
                      return (
                        <tr key={entry.id} style={{ background: idx % 2 === 1 ? 'var(--bg-card)' : 'var(--bg-page, transparent)' }}>
                          <td style={{ padding: '9px 10px', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-card)' }}>{entry.taskName}</td>
                          <td style={{ padding: '9px 10px', fontFamily: MONO, fontSize: 11, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-card)', whiteSpace: 'nowrap' }}>{formatDateTime(entry.dateTime)}</td>
                          <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--border-card)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Avatar name={entry.staffMember} size={22} />
                              <span style={{ fontSize: 11, color: 'var(--text-primary)' }}>{entry.staffMember}</span>
                            </div>
                          </td>
                          <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--border-card)' }}>
                            <span style={{
                              display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, fontFamily: DM,
                              background: isPass ? '#f0fdf4' : '#fef2f2',
                              color: isPass ? '#059669' : '#dc2626',
                              border: `1px solid ${isPass ? '#6ee7b7' : '#fecaca'}`,
                            }}>{isPass ? '✓ Pass' : '✗ Fail'}</span>
                          </td>
                          <td style={{ padding: '9px 10px', fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', borderBottom: '1px solid var(--border-card)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={entry.notes || ''}>{entry.notes || '—'}</td>
                          <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--border-card)' }}>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button onClick={() => openEdit(entry)} style={{
                                fontSize: 11, padding: '3px 10px', borderRadius: 6, fontFamily: DM, fontWeight: 500,
                                background: 'transparent', border: '1px solid var(--border-card)', color: 'var(--text-secondary)', cursor: 'pointer',
                              }}>Edit</button>
                              <button onClick={() => handleDelete(entry.id)} style={{
                                fontSize: 11, padding: '3px 10px', borderRadius: 6, fontFamily: DM, fontWeight: 500,
                                background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', cursor: 'pointer',
                              }}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 14, alignItems: 'center' }}>
                  <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{
                    padding: '4px 14px', borderRadius: 6, fontSize: 11, fontFamily: DM, fontWeight: 600,
                    background: page === 0 ? 'var(--bg-card)' : '#059669', color: page === 0 ? 'var(--text-muted)' : '#fff',
                    border: '1px solid var(--border-card)', cursor: page === 0 ? 'default' : 'pointer',
                  }}>← Prev</button>
                  <span style={{ fontSize: 11, fontFamily: MONO, color: 'var(--text-muted)' }}>{page + 1} / {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} style={{
                    padding: '4px 14px', borderRadius: 6, fontSize: 11, fontFamily: DM, fontWeight: 600,
                    background: page >= totalPages - 1 ? 'var(--bg-card)' : '#059669', color: page >= totalPages - 1 ? 'var(--text-muted)' : '#fff',
                    border: '1px solid var(--border-card)', cursor: page >= totalPages - 1 ? 'default' : 'pointer',
                  }}>Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══ TAB 3 — COMPLIANCE CHART ═══ */}
      {tab === 'chart' && (
        <div style={CARD}>
          <DashCardHeader gradient="linear-gradient(90deg, #1e40af, #3b82f6)" icon="📊" title="Compliance Chart" />

          {deduped.length < 3 ? (
            <div style={{ textAlign: 'center', padding: 40, fontStyle: 'italic', color: 'var(--text-muted)', fontSize: 13 }}>
              Not enough data yet — log more cleaning entries to see trends.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {/* Chart 1 — Weekly compliance */}
              <div>
                <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 10px', fontFamily: DM }}>Weekly Compliance Rate</h3>
                <BarChartSVG data={weeklyChartData} height={160} />
              </div>
              {/* Chart 2 — Pass/Fail by task */}
              <div>
                <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 10px', fontFamily: DM }}>Pass/Fail by Task (Last 30 Days)</h3>
                {taskBreakdownData.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: 20 }}>No data in the last 30 days.</div>
                ) : (
                  <HBarChartSVG data={taskBreakdownData} height={Math.max(120, taskBreakdownData.length * 26 + 30)} />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── ADD/EDIT MODAL (preserved) ─── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Cleaning Entry' : 'Add Cleaning Entry'}>
        <form style={{ display: 'flex', flexDirection: 'column', gap: 14, fontFamily: DM }} onSubmit={handleSubmit}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Task *</label>
            <select className={`${inputClass} ${errors.taskName ? 'border-ec-crit focus:border-ec-crit focus:ring-ec-crit/20' : ''}`} value={form.taskName} onChange={e => { update('taskName')(e); setErrors(prev => ({ ...prev, taskName: undefined })) }} required style={{ fontFamily: DM }}>
              <option value="">Select task...</option>
              {cleaningTasks.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
              <option value="__other__">Other (specify)</option>
            </select>
            {errors.taskName && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.taskName}</p>}
          </div>

          {form.taskName === '__other__' && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Custom Task Name *</label>
              <input type="text" className={inputClass} placeholder="Enter task name..." value={form.customTask} onChange={update('customTask')} required style={{ fontFamily: DM }} />
            </div>
          )}

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Date / Time *</label>
            <input type="datetime-local" className={inputClass} value={form.dateTime} onChange={update('dateTime')} required style={{ fontFamily: MONO }} />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Staff Member *</label>
            {staffMembers.length === 0 ? (
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>No staff members configured. <a href="/settings" style={{ color: '#059669' }}>Add them in Settings</a>.</p>
            ) : (
              <select className={`${inputClass} ${errors.staffMember ? 'border-ec-crit focus:border-ec-crit focus:ring-ec-crit/20' : ''}`} value={form.staffMember} onChange={e => { update('staffMember')(e); setErrors(prev => ({ ...prev, staffMember: undefined })) }} required style={{ fontFamily: DM }}>
                <option value="">Select staff member...</option>
                {staffMembers.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
            {errors.staffMember && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.staffMember}</p>}
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Result *</label>
            <select className={`${inputClass} ${errors.result ? 'border-ec-crit focus:border-ec-crit focus:ring-ec-crit/20' : ''}`} value={form.result} onChange={e => { update('result')(e); setErrors(prev => ({ ...prev, result: undefined })) }} required style={{ fontFamily: DM }}>
              <option value="">Select result...</option>
              <option value="Pass">Pass</option>
              <option value="Action Taken">Action Taken</option>
            </select>
            {errors.result && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.result}</p>}
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Notes</label>
            <textarea className={`${inputClass} resize-none`} placeholder="Optional notes..." value={form.notes} onChange={update('notes')} rows={3} style={{ fontFamily: DM }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8, paddingTop: 14, borderTop: '1px solid var(--border-card)' }}>
            <button type="button" onClick={() => setModalOpen(false)} style={{
              padding: '8px 18px', borderRadius: 8, fontSize: 12, fontWeight: 500, fontFamily: DM,
              background: 'transparent', border: '1px solid var(--border-card)', color: 'var(--text-secondary)', cursor: 'pointer',
            }}>Cancel</button>
            <button type="submit" style={{
              padding: '8px 18px', borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: DM,
              background: '#059669', color: '#fff', border: 'none', cursor: 'pointer',
            }}>{editingId ? 'Save Changes' : 'Add Entry'}</button>
          </div>
        </form>
      </Modal>
      {ConfirmDialog}
    </div>
  )
}
