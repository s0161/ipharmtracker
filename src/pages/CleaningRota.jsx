/*
  Cleaning Rota — Card grid architecture with 3 view modes:
    Today (default) — card grid grouped Outstanding / Completed
    Week  — scrollable grid: rows=tasks, cols=Mon–Sun
    Staff — per-person cards with task list + progress bar

  Uses hardcoded DEFAULT_CLEANING_TASKS as source of truth.
  Records stored in cleaning_entries table via useSupabase hook.
*/

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSupabase } from '../hooks/useSupabase'
import { logAudit } from '../utils/auditLog'
import { useUser } from '../contexts/UserContext'
import { generateId, DEFAULT_CLEANING_TASKS, AREA_CONFIG } from '../utils/helpers'
import { getTaskAssignee, getStaffInitials, getStaffColor } from '../utils/rotationManager'
import { downloadCsv } from '../utils/exportCsv'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/ConfirmDialog'
import Avatar from '../components/Avatar'
import SkeletonLoader from '../components/SkeletonLoader'

// Inter font loaded via index.html

const sans = { fontFamily: "'Inter', sans-serif" }
const mono = { fontFamily: "'DM Mono', monospace" }

const FREQ_MAP = { daily: 1, weekly: 7, fortnightly: 14, monthly: 30 }
const FREQ_LABELS = { daily: 'Daily', weekly: 'Weekly', fortnightly: 'Fortnightly', monthly: 'Monthly' }
const FREQ_COLORS = { daily: { bg: '#dbeafe', text: '#1e40af' }, weekly: { bg: '#dcfce7', text: '#166534' }, fortnightly: { bg: '#ede9fe', text: '#5b21b6' }, monthly: { bg: '#ffedd5', text: '#9a3412' } }

// ═══════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════
function getToday() { return new Date().toISOString().slice(0, 10) }
function daysBetween(a, b) { return (b - a) / 864e5 }

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDateNav(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const today = getToday()
  const label = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' })
  return dateStr === today ? `Today, ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}` : label
}

function formatShortDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function formatTime(dateTimeStr) {
  if (!dateTimeStr) return ''
  return new Date(dateTimeStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function getWeekDates(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const mon = new Date(d)
  mon.setDate(d.getDate() - ((day + 6) % 7)) // Monday
  const dates = []
  for (let i = 0; i < 7; i++) {
    const dd = new Date(mon)
    dd.setDate(mon.getDate() + i)
    dates.push(toDateStr(dd))
  }
  return dates
}

function isTaskDueOnDate(freq, dateStr) {
  if (freq === 'daily') return true
  const d = new Date(dateStr + 'T00:00:00')
  const dow = d.getDay()
  if (freq === 'weekly') return dow === 1
  if (freq === 'fortnightly') {
    const weekNum = Math.ceil((d - new Date(d.getFullYear(), 0, 1)) / (7 * 864e5))
    return dow === 1 && weekNum % 2 === 0
  }
  if (freq === 'monthly') return d.getDate() === 1
  return false
}

function getRotaStatus(task, entries) {
  const passes = entries.filter(e => e.taskName === task.name && e.result === 'Pass')
  if (passes.length === 0) return 'overdue'
  const latest = passes.reduce((a, b) => new Date(a.dateTime) > new Date(b.dateTime) ? a : b)
  const diff = daysBetween(new Date(latest.dateTime), new Date())
  const limit = FREQ_MAP[task.frequency] || 7
  if (diff <= 1 && task.frequency === 'daily') return 'done'
  if (diff >= limit) return 'overdue'
  if (diff >= limit * 0.8) return 'due-soon'
  return 'done'
}

function getStatusForDate(taskName, dateStr, entries) {
  const dayEntries = entries.filter(e => e.taskName === taskName && e.dateTime && e.dateTime.slice(0, 10) === dateStr)
  if (dayEntries.length === 0) return null
  const pass = dayEntries.find(e => e.result === 'Pass')
  if (pass) return { status: 'done', entry: pass }
  const fail = dayEntries.find(e => e.result === 'Fail')
  if (fail) return { status: 'missed', entry: fail }
  return { status: 'pending', entry: dayEntries[0] }
}

function lastPassDate(taskName, entries) {
  const passes = entries.filter(e => e.taskName === taskName && e.result === 'Pass')
  if (passes.length === 0) return null
  return passes.reduce((a, b) => new Date(a.dateTime) > new Date(b.dateTime) ? a : b).dateTime
}

// ═══════════════════════════════════════════════════════════
//  SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════

// ── Stat Pill ──
function StatPill({ icon, count, label, variant }) {
  const colors = {
    green: { border: '#c6e8da', count: '#10b981' },
    amber: { border: '#fde68a', count: '#d97706' },
    red:   { border: '#fecaca', count: '#dc2626' },
    blue:  { border: '#bfdbfe', count: '#2563eb' },
  }
  const c = colors[variant] || colors.blue
  return (
    <div style={{
      background: '#ffffff', border: `1px solid ${c.border}`, borderRadius: 20,
      padding: '6px 14px', ...sans, fontSize: 13, fontWeight: 500,
      display: 'inline-flex', alignItems: 'center', gap: 6,
    }}>
      <span>{icon}</span>
      <span style={{ ...mono, fontWeight: 700, color: c.count }}>{count}</span>
      <span style={{ color: '#6b7280' }}>{label}</span>
    </div>
  )
}

// ── Avatar Bubble (filter) ──
function AvatarBubble({ name, active, onClick }) {
  const initials = getStaffInitials(name)
  const bg = getStaffColor(name)
  return (
    <button
      onClick={onClick}
      title={name}
      style={{
        width: 36, height: 36, borderRadius: '50%', fontSize: 12, fontWeight: 600,
        cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: bg, color: '#fff', flexShrink: 0,
        border: active ? '2px solid #10b981' : '2px solid transparent',
        boxShadow: active ? '0 0 0 3px rgba(16,185,129,0.2)' : 'none',
        transform: active ? 'scale(1.1)' : 'scale(1)',
      }}
    >{initials}</button>
  )
}

// ── Frequency Badge ──
function FreqBadge({ freq }) {
  const c = FREQ_COLORS[freq] || { bg: '#f3f4f6', text: '#6b7280' }
  return (
    <span style={{
      ...sans, borderRadius: 20, fontSize: 10, fontWeight: 700, padding: '3px 8px',
      textTransform: 'uppercase', letterSpacing: '0.06em', background: c.bg, color: c.text,
    }}>
      {FREQ_LABELS[freq] || freq}
    </span>
  )
}

// ── Area Badge ──
function AreaBadge({ area }) {
  const cfg = AREA_CONFIG[area]
  if (!cfg) return null
  return (
    <span style={{
      ...sans, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
      background: '#f3f4f6', color: '#6b7280',
    }}>
      {cfg.label}
    </span>
  )
}

// ── GPhC Badge ──
function GPhCBadge({ small }) {
  return (
    <span style={{
      ...sans, fontSize: small ? 9 : 10, fontWeight: 700, padding: small ? '1px 5px' : '3px 8px',
      borderRadius: small ? 4 : 20, background: '#dbeafe', color: '#1e40af',
      display: 'inline-flex', alignItems: 'center', gap: 3,
    }}>
      <span style={{ fontSize: small ? 10 : 12 }}>🛡️</span>GPhC
    </span>
  )
}

// ── View Switcher ──
function ViewSwitcher({ view, onViewChange, selectedDate, onDateChange }) {
  const tabs = [
    { key: 'today', icon: '📋', label: 'Today' },
    { key: 'week', icon: '📅', label: 'Week' },
    { key: 'staff', icon: '👥', label: 'Staff' },
  ]

  const shiftDate = (days) => {
    const d = new Date(selectedDate + 'T00:00:00')
    d.setDate(d.getDate() + (view === 'week' ? days * 7 : days))
    onDateChange(toDateStr(d))
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', borderBottom: '1px solid #e8f5f0',
      marginBottom: 16, gap: 0, flexWrap: 'wrap',
    }}>
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onViewChange(t.key)}
          style={{
            ...sans, fontSize: 13, fontWeight: view === t.key ? 600 : 400,
            color: view === t.key ? '#10b981' : '#6b7280',
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '10px 16px', whiteSpace: 'nowrap',
            borderBottom: view === t.key ? '2px solid #10b981' : '2px solid transparent',
            transition: 'all 150ms', display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          <span style={{ fontSize: 14 }}>{t.icon}</span>{t.label}
        </button>
      ))}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0' }}>
        <button onClick={() => shiftDate(-1)} style={{ ...sans, fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', color: '#10b981', padding: '2px 6px' }}>&lsaquo;</button>
        <span style={{ ...sans, fontSize: 14, fontWeight: 500, color: '#374151', whiteSpace: 'nowrap' }}>{formatDateNav(selectedDate)}</span>
        <button onClick={() => shiftDate(1)} style={{ ...sans, fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', color: '#10b981', padding: '2px 6px' }}>&rsaquo;</button>
        {selectedDate !== getToday() && (
          <button
            onClick={() => onDateChange(getToday())}
            style={{ ...sans, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: '#f0faf6', color: '#10b981', border: '1px solid #c6e8da', cursor: 'pointer' }}
          >Today</button>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  TASK CARD (Today View)
// ═══════════════════════════════════════════════════════════
function TaskCard({ task, status, assignee, lastDoneTime, entries, staffMembers, onMarkDone, onLogMissed, expanded, onToggleExpand }) {
  const [confirming, setConfirming] = useState(false)
  const [missedMode, setMissedMode] = useState(false)
  const [notes, setNotes] = useState('')
  const [missedReason, setMissedReason] = useState('')
  const [staffSelect, setStaffSelect] = useState('')
  const [flashDone, setFlashDone] = useState(false)

  const isDone = status === 'done'
  const isOverdue = status === 'overdue'

  // Recent completions for expanded view
  const recentEntries = entries
    .filter(e => e.taskName === task.name && e.result === 'Pass')
    .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime))
    .slice(0, 3)

  const todayEntry = entries.find(e => e.taskName === task.name && e.dateTime?.slice(0, 10) === getToday() && e.result === 'Pass')

  const handleConfirm = () => {
    if (!staffSelect) return
    setFlashDone(true)
    onMarkDone(task, { result: 'Pass', notes, staffMember: staffSelect })
    setConfirming(false)
    setNotes('')
    setStaffSelect('')
    setTimeout(() => setFlashDone(false), 800)
  }

  const handleMissed = () => {
    onLogMissed(task, missedReason)
    setMissedMode(false)
    setMissedReason('')
  }

  const cardBorder = isDone ? '#c6e8da' : isOverdue ? '#fecaca' : '#f59e0b'
  const cardBg = flashDone ? '#d1fae5' : isDone ? '#f9fffe' : isOverdue ? '#fffafa' : '#ffffff'

  return (
    <div style={{
      background: cardBg, border: `1px solid ${isDone ? '#c6e8da' : isOverdue ? '#fecaca' : '#f0f0f0'}`,
      borderLeft: `4px solid ${cardBorder}`, borderRadius: 12, padding: 16,
      display: 'flex', flexDirection: 'column', gap: 10,
      cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative',
      opacity: isDone ? 0.85 : 1,
      animation: flashDone ? 'confirmFlash 800ms ease' : 'none',
    }}>
      {/* Top row: badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <FreqBadge freq={task.frequency} />
        <AreaBadge area={task.area} />
        {task.gphcRelevant && (
          <div style={{ marginLeft: 'auto' }}><GPhCBadge small /></div>
        )}
      </div>

      {/* Task name */}
      <div
        onClick={onToggleExpand}
        style={{ ...sans, fontSize: 15, fontWeight: 600, color: '#111827', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
      >
        {task.name}
      </div>

      {/* Staff + due info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Avatar name={assignee} size={22} />
          <span style={{ ...sans, fontSize: 13, color: '#6b7280' }}>{assignee}</span>
        </div>
        <span style={{ ...mono, fontSize: 12, color: isDone ? '#059669' : isOverdue ? '#dc2626' : '#d97706' }}>
          {isDone && todayEntry ? formatTime(todayEntry.dateTime) : isDone ? 'Done' : isOverdue ? 'Overdue' : 'Due today'}
        </span>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{
          borderTop: '1px solid #f3f4f6', paddingTop: 10, marginTop: 2,
          transition: 'max-height 300ms ease', overflow: 'hidden',
        }}>
          <p style={{ ...sans, fontSize: 13, color: '#4b5563', lineHeight: 1.5, margin: '0 0 8px' }}>{task.description}</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
            {task.estimatedMinutes && <span style={{ ...sans, fontSize: 12, color: '#6b7280' }}>⏱ ~{task.estimatedMinutes} min</span>}
            {task.gphcRelevant && <span style={{ ...sans, fontSize: 12, color: '#1e40af' }}>🛡️ GPhC relevant</span>}
            {task.requiresSignOff && <span style={{ ...sans, fontSize: 12, color: '#d97706' }}>Requires sign-off</span>}
          </div>
          {recentEntries.length > 0 && (
            <div>
              <div style={{ ...sans, fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 4 }}>Last completed</div>
              {recentEntries.map((e, i) => (
                <div key={e.id || i} style={{ ...sans, fontSize: 12, color: '#4b5563', padding: '2px 0' }}>
                  {formatShortDate(e.dateTime)} — {getStaffInitials(e.staffMember)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action area */}
      {!isDone && !confirming && !missedMode && (
        <div>
          <button
            onClick={e => { e.stopPropagation(); setConfirming(true) }}
            style={{
              width: '100%', background: '#10b981', color: '#fff', border: 'none', borderRadius: 8,
              padding: 10, ...sans, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
            }}
          >Mark Done</button>
          <button
            onClick={e => { e.stopPropagation(); setMissedMode(true) }}
            style={{ ...sans, fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', width: '100%', textAlign: 'center' }}
          >Log as Missed</button>
        </div>
      )}

      {/* Confirm Mark Done inline */}
      {confirming && (
        <div style={{ background: '#f0fdf4', borderRadius: 8, padding: 10, border: '1px solid #d1fae5' }} onClick={e => e.stopPropagation()}>
          <div style={{ marginBottom: 8 }}>
            <label style={{ ...sans, fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 2 }}>Staff</label>
            <select value={staffSelect} onChange={e => setStaffSelect(e.target.value)}
              style={{ ...sans, fontSize: 12, padding: '5px 8px', borderRadius: 6, border: '1px solid #d1fae5', width: '100%', background: '#fff' }}>
              <option value="">Select staff...</option>
              {staffMembers.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ ...sans, fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 2 }}>Note (optional)</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add a note..."
              style={{ ...sans, fontSize: 12, padding: '5px 8px', borderRadius: 6, border: '1px solid #d1fae5', width: '100%' }} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={handleConfirm} disabled={!staffSelect}
              style={{ ...sans, fontSize: 12, fontWeight: 600, padding: '7px 16px', borderRadius: 6, background: staffSelect ? '#10b981' : '#d1d5db', color: '#fff', border: 'none', cursor: staffSelect ? 'pointer' : 'not-allowed', flex: 1 }}>✓ Confirm</button>
            <button onClick={() => setConfirming(false)}
              style={{ ...sans, fontSize: 12, padding: '7px 12px', borderRadius: 6, background: '#f3f4f6', color: '#6b7280', border: 'none', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Log Missed inline */}
      {missedMode && (
        <div style={{ background: '#fef2f2', borderRadius: 8, padding: 10, border: '1px solid #fecaca' }} onClick={e => e.stopPropagation()}>
          <label style={{ ...sans, fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 2 }}>Reason</label>
          <input type="text" value={missedReason} onChange={e => setMissedReason(e.target.value)} placeholder="Why was this missed?"
            style={{ ...sans, fontSize: 12, padding: '5px 8px', borderRadius: 6, border: '1px solid #fecaca', width: '100%', marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={handleMissed}
              style={{ ...sans, fontSize: 12, fontWeight: 600, padding: '7px 16px', borderRadius: 6, background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', flex: 1 }}>Log Missed</button>
            <button onClick={() => setMissedMode(false)}
              style={{ ...sans, fontSize: 12, padding: '7px 12px', borderRadius: 6, background: '#f3f4f6', color: '#6b7280', border: 'none', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Done confirmation */}
      {isDone && todayEntry && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
          background: '#f0faf6', borderRadius: 8, ...sans, fontSize: 13, color: '#065f46',
        }}>
          <span style={{ fontWeight: 700 }}>✓</span>
          <Avatar name={todayEntry.staffMember} size={18} />
          <span style={{ fontWeight: 500 }}>{getStaffInitials(todayEntry.staffMember)}</span>
          <span style={{ ...mono, fontSize: 12, color: '#6b7280', marginLeft: 'auto' }}>{formatTime(todayEntry.dateTime)}</span>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  WEEK VIEW — Grid rows=tasks, cols=Mon–Sun
// ═══════════════════════════════════════════════════════════
function WeekView({ tasks, entries, weekDates, staffMembers, onMarkDone, onLogMissed }) {
  const [popover, setPopover] = useState(null) // { task, dateStr, x, y }
  const popRef = useRef(null)
  const today = getToday()

  // Close popover on click outside
  useEffect(() => {
    if (!popover) return
    const handler = (e) => { if (popRef.current && !popRef.current.contains(e.target)) setPopover(null) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [popover])

  // Group tasks by frequency for section dividers
  const freqGroups = ['daily', 'weekly', 'fortnightly', 'monthly']
  const grouped = {}
  freqGroups.forEach(f => { grouped[f] = tasks.filter(t => t.frequency === f) })

  const dayLabels = weekDates.map(d => {
    const dd = new Date(d + 'T00:00:00')
    return { date: d, dayName: dd.toLocaleDateString('en-GB', { weekday: 'short' }), dayNum: dd.getDate() }
  })

  return (
    <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #e8f5f0', background: '#ffffff' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '200px repeat(7, 1fr)', minWidth: 700, position: 'relative' }}>
        {/* Header row */}
        <div style={{ background: '#f0faf6', padding: '10px 12px', borderBottom: '1px solid #c6e8da', ...sans, fontSize: 12, fontWeight: 600, color: '#374151' }}>Task</div>
        {dayLabels.map(dl => (
          <div key={dl.date} style={{
            background: dl.date === today ? '#10b981' : '#f0faf6',
            color: dl.date === today ? '#fff' : '#374151',
            padding: '10px 8px', borderBottom: '1px solid #c6e8da', textAlign: 'center',
            ...sans, fontSize: 12, fontWeight: 600,
          }}>
            {dl.dayName} {dl.dayNum}
          </div>
        ))}

        {/* Task rows grouped by frequency */}
        {freqGroups.map(freq => {
          const freqTasks = grouped[freq]
          if (!freqTasks || freqTasks.length === 0) return null
          return [
            // Section header
            <div key={`hdr-${freq}`} style={{
              gridColumn: '1 / -1', background: '#f9fafb', padding: '6px 16px',
              ...sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: '#9ca3af', borderBottom: '1px solid #f3f4f6',
            }}>
              {FREQ_LABELS[freq]}
            </div>,
            // Task rows
            ...freqTasks.map(task => (
              <WeekRow
                key={task.name}
                task={task}
                weekDates={weekDates}
                entries={entries}
                today={today}
                onCellClick={(dateStr, rect) => setPopover({ task, dateStr, rect })}
              />
            )),
          ]
        })}
      </div>

      {/* Cell Popover */}
      {popover && (
        <div ref={popRef} style={{
          position: 'fixed', zIndex: 1000,
          top: popover.rect ? popover.rect.bottom + 4 : 200,
          left: popover.rect ? Math.min(popover.rect.left, window.innerWidth - 260) : 200,
          background: '#ffffff', border: '1px solid #c6e8da', borderRadius: 10,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)', padding: 16, minWidth: 220,
        }}>
          <CellPopover
            task={popover.task}
            dateStr={popover.dateStr}
            entries={entries}
            staffMembers={staffMembers}
            onMarkDone={(data) => { onMarkDone(popover.task, data); setPopover(null) }}
            onLogMissed={(reason) => { onLogMissed(popover.task, reason); setPopover(null) }}
            onClose={() => setPopover(null)}
          />
        </div>
      )}
    </div>
  )
}

function WeekRow({ task, weekDates, entries, today, onCellClick }) {
  return <>
    {/* Task name column */}
    <div style={{
      padding: '10px 12px', ...sans, fontSize: 13, fontWeight: 500, color: '#111827',
      borderRight: '1px solid #e8f5f0', borderBottom: '1px solid #f3f4f6',
      display: 'flex', alignItems: 'center', gap: 6, background: '#ffffff',
    }}>
      <FreqBadge freq={task.frequency} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.name}</span>
    </div>
    {/* Day cells */}
    {weekDates.map(dateStr => {
      const isDue = isTaskDueOnDate(task.frequency, dateStr)
      const info = isDue ? getStatusForDate(task.name, dateStr, entries) : null
      const isToday = dateStr === today
      const isFuture = dateStr > today

      return (
        <div
          key={dateStr}
          onClick={e => { if (isDue) onCellClick(dateStr, e.currentTarget.getBoundingClientRect()) }}
          style={{
            padding: 8, borderRight: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6',
            display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 44,
            cursor: isDue ? 'pointer' : 'default', transition: 'background 0.1s',
            background: isToday ? 'rgba(16,185,129,0.04)' : 'transparent',
          }}
        >
          {!isDue ? (
            <span style={{ color: '#e5e7eb', fontSize: 16 }}>—</span>
          ) : info?.status === 'done' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#10b981', ...sans, fontSize: 13, fontWeight: 600 }}>
              <span>✓</span>
              <Avatar name={info.entry.staffMember} size={16} />
            </div>
          ) : info?.status === 'missed' ? (
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'block' }} />
          ) : isFuture ? (
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#d1d5db', display: 'block' }} />
          ) : (
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: dateStr < today ? '#ef4444' : '#f59e0b', display: 'block' }} />
          )}
        </div>
      )
    })}
  </>
}

function CellPopover({ task, dateStr, entries, staffMembers, onMarkDone, onLogMissed, onClose }) {
  const [staffSelect, setStaffSelect] = useState('')
  const [notes, setNotes] = useState('')
  const [missedMode, setMissedMode] = useState(false)
  const [missedReason, setMissedReason] = useState('')

  const info = getStatusForDate(task.name, dateStr, entries)
  const isDone = info?.status === 'done'
  const assignee = getTaskAssignee(task.name, task.frequency, 0)

  return (
    <div>
      <div style={{ ...sans, fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 4 }}>{task.name}</div>
      <div style={{ ...sans, fontSize: 12, color: '#6b7280', marginBottom: 10 }}>
        {formatShortDate(dateStr)} · Assigned: {assignee}
      </div>
      {isDone ? (
        <div style={{ ...sans, fontSize: 13, color: '#059669', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 700 }}>✓</span> Completed by {info.entry.staffMember} at {formatTime(info.entry.dateTime)}
        </div>
      ) : !missedMode ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <select value={staffSelect} onChange={e => setStaffSelect(e.target.value)}
            style={{ ...sans, fontSize: 12, padding: '5px 8px', borderRadius: 6, border: '1px solid #d1fae5', background: '#fff' }}>
            <option value="">Select staff...</option>
            {staffMembers.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
          </select>
          <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Note (optional)"
            style={{ ...sans, fontSize: 12, padding: '5px 8px', borderRadius: 6, border: '1px solid #e8f5f0' }} />
          <button onClick={() => { if (staffSelect) onMarkDone({ result: 'Pass', notes, staffMember: staffSelect }) }} disabled={!staffSelect}
            style={{ ...sans, fontSize: 13, fontWeight: 600, padding: '8px', borderRadius: 6, background: staffSelect ? '#10b981' : '#d1d5db', color: '#fff', border: 'none', cursor: staffSelect ? 'pointer' : 'not-allowed' }}>✓ Mark Done</button>
          <button onClick={() => setMissedMode(true)}
            style={{ ...sans, fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center', padding: '4px 0' }}>Log as Missed</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input type="text" value={missedReason} onChange={e => setMissedReason(e.target.value)} placeholder="Reason..."
            style={{ ...sans, fontSize: 12, padding: '5px 8px', borderRadius: 6, border: '1px solid #fecaca' }} />
          <button onClick={() => onLogMissed(missedReason)}
            style={{ ...sans, fontSize: 13, fontWeight: 600, padding: '8px', borderRadius: 6, background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer' }}>Log Missed</button>
          <button onClick={() => setMissedMode(false)}
            style={{ ...sans, fontSize: 12, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}>Cancel</button>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  STAFF VIEW — Per-person cards
// ═══════════════════════════════════════════════════════════
function StaffView({ enrichedTasks, entries, staffMembers, onMarkDone, onLogMissed }) {
  // Group by staff using rotation assignments
  const staffData = useMemo(() => {
    const map = {}
    enrichedTasks.forEach(t => {
      const name = t.assignee
      if (!map[name]) map[name] = { name, tasks: [], doneCount: 0 }
      map[name].tasks.push(t)
      if (t.status === 'done') map[name].doneCount++
    })
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name))
  }, [enrichedTasks])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
      {staffData.map(sd => (
        <StaffCard
          key={sd.name}
          staffName={sd.name}
          tasks={sd.tasks}
          doneCount={sd.doneCount}
          entries={entries}
          staffMembers={staffMembers}
          onMarkDone={onMarkDone}
          onLogMissed={onLogMissed}
        />
      ))}
    </div>
  )
}

function StaffCard({ staffName, tasks, doneCount, entries, staffMembers, onMarkDone, onLogMissed }) {
  const total = tasks.length
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0
  const allDone = doneCount === total
  const barColor = pct >= 60 ? '#10b981' : pct >= 30 ? '#f59e0b' : '#ef4444'

  const staffMember = staffMembers.find(s => s.name === staffName)
  const role = staffMember?.role || ''

  return (
    <div style={{
      background: '#ffffff', border: `1px solid ${allDone ? '#10b981' : '#e8f5f0'}`,
      borderRadius: 12, padding: 20,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <Avatar name={staffName} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...sans, fontSize: 15, fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}>
            {staffName}
            {allDone && <span style={{ ...sans, fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10, background: '#f0fdf4', color: '#10b981' }}>All done!</span>}
          </div>
          {role && <div style={{ ...sans, fontSize: 13, color: '#6b7280', textTransform: 'capitalize' }}>{role.replace('_', ' ')}</div>}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, borderRadius: 3, background: '#f3f4f6', marginBottom: 4 }}>
        <div style={{ height: '100%', borderRadius: 3, background: barColor, width: `${pct}%`, transition: 'width 0.5s ease' }} />
      </div>
      <div style={{ ...sans, fontSize: 12, color: '#6b7280', marginBottom: 12 }}>{doneCount}/{total} done · {pct}%</div>

      {/* Task list */}
      {tasks.map(task => {
        const isDone = task.status === 'done'
        const isOverdue = task.status === 'overdue'
        const todayEntry = isDone ? entries.find(e => e.taskName === task.name && e.dateTime?.slice(0, 10) === getToday() && e.result === 'Pass') : null
        return (
          <StaffTaskItem
            key={task.name}
            task={task}
            isDone={isDone}
            isOverdue={isOverdue}
            todayEntry={todayEntry}
            staffMembers={staffMembers}
            onMarkDone={onMarkDone}
            onLogMissed={onLogMissed}
          />
        )
      })}
    </div>
  )
}

function StaffTaskItem({ task, isDone, isOverdue, todayEntry, staffMembers, onMarkDone, onLogMissed }) {
  const [hovered, setHovered] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [staffSelect, setStaffSelect] = useState('')

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 0', borderBottom: '1px solid #f3f4f6', ...sans, fontSize: 13,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: 14 }}>{isDone ? '✅' : isOverdue ? '🔴' : '⏳'}</span>
        <span style={{ color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.name}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {isDone && todayEntry ? (
          <span style={{ ...mono, fontSize: 12, color: '#10b981' }}>{formatTime(todayEntry.dateTime)}</span>
        ) : isOverdue ? (
          <span style={{ ...sans, fontSize: 11, color: '#dc2626' }}>Overdue</span>
        ) : (
          <span style={{ ...sans, fontSize: 11, color: '#d97706' }}>Due today</span>
        )}
        {!isDone && hovered && !confirming && (
          <button
            onClick={() => setConfirming(true)}
            style={{ ...sans, fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', marginLeft: 4 }}
          >✓</button>
        )}
      </div>
      {confirming && (
        <div style={{ position: 'absolute', right: 20, background: '#fff', border: '1px solid #c6e8da', borderRadius: 8, padding: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', zIndex: 10, minWidth: 180 }}
          onClick={e => e.stopPropagation()}>
          <select value={staffSelect} onChange={e => setStaffSelect(e.target.value)}
            style={{ ...sans, fontSize: 11, padding: '4px 6px', borderRadius: 6, border: '1px solid #d1fae5', width: '100%', marginBottom: 6, background: '#fff' }}>
            <option value="">Staff...</option>
            {staffMembers.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => { if (staffSelect) { onMarkDone(task, { result: 'Pass', notes: '', staffMember: staffSelect }); setConfirming(false) } }}
              style={{ ...sans, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', flex: 1 }}>Done</button>
            <button onClick={() => setConfirming(false)}
              style={{ ...sans, fontSize: 11, padding: '4px 8px', borderRadius: 6, background: '#f3f4f6', color: '#6b7280', border: 'none', cursor: 'pointer' }}>X</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  CALENDAR SIDEBAR
// ═══════════════════════════════════════════════════════════
function CalendarSidebar({ entries, selectedDate, onSelectDate, tasks }) {
  const [viewDate, setViewDate] = useState(() => {
    const d = selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = getToday()

  // Compute dot status per day
  const dayStatus = useMemo(() => {
    const map = {}
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const dayEntries = entries.filter(e => e.dateTime && e.dateTime.slice(0, 10) === dateStr)
      if (dayEntries.length === 0) continue
      const hasPass = dayEntries.some(e => e.result === 'Pass')
      const hasFail = dayEntries.some(e => e.result === 'Fail')
      if (hasFail) map[dateStr] = '#ef4444'
      else if (hasPass) map[dateStr] = '#10b981'
      else map[dateStr] = '#f59e0b'
    }
    return map
  }, [entries, year, month, daysInMonth])

  const days = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)

  const monthLabel = viewDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  // Week summary
  const weekDates = getWeekDates(selectedDate)
  const weekSummary = weekDates.map(dateStr => {
    const dd = new Date(dateStr + 'T00:00:00')
    const dueTasks = tasks.filter(t => isTaskDueOnDate(t.frequency, dateStr))
    const dayEntries = entries.filter(e => e.dateTime && e.dateTime.slice(0, 10) === dateStr && e.result === 'Pass')
    return {
      dateStr,
      label: dd.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
      done: dayEntries.length,
      total: dueTasks.length,
      isToday: dateStr === today,
    }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Calendar */}
      <div style={{ background: '#ffffff', borderRadius: 12, padding: 14, border: '1px solid #e8f5f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <button onClick={() => setViewDate(new Date(year, month - 1, 1))} style={{ ...sans, fontSize: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#10b981' }}>&lsaquo;</button>
          <span style={{ ...sans, fontSize: 12, fontWeight: 600, color: '#374151' }}>{monthLabel}</span>
          <button onClick={() => setViewDate(new Date(year, month + 1, 1))} style={{ ...sans, fontSize: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#10b981' }}>&rsaquo;</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, textAlign: 'center' }}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} style={{ ...sans, fontSize: 9, color: '#9ca3af', fontWeight: 600, padding: 3 }}>{d}</div>
          ))}
          {days.map((d, i) => {
            if (!d) return <div key={`e${i}`} />
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
            const dotColor = dayStatus[dateStr]
            const isToday = dateStr === today
            const isSelected = dateStr === selectedDate
            return (
              <div
                key={i}
                onClick={() => onSelectDate(dateStr)}
                style={{
                  ...sans, fontSize: 11, padding: 3, borderRadius: 6, cursor: 'pointer',
                  background: isSelected ? '#10b981' : isToday ? '#f0faf6' : 'transparent',
                  color: isSelected ? '#fff' : isToday ? '#10b981' : '#374151',
                  fontWeight: isToday || isSelected ? 700 : 400, position: 'relative',
                }}
              >
                {d}
                {dotColor && !isSelected && (
                  <span style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: dotColor }} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Week summary */}
      <div style={{ background: '#ffffff', borderRadius: 12, padding: 14, border: '1px solid #e8f5f0' }}>
        <div style={{ ...sans, fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.08em' }}>This Week</div>
        {weekSummary.map(ws => (
          <div
            key={ws.dateStr}
            onClick={() => onSelectDate(ws.dateStr)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, cursor: 'pointer',
              background: ws.isToday ? '#f0faf6' : 'transparent',
              ...sans, fontSize: 12,
            }}
          >
            <span style={{ fontWeight: ws.isToday ? 700 : 400, color: '#374151', minWidth: 80 }}>{ws.label}</span>
            {/* Progress dots */}
            <div style={{ flex: 1, display: 'flex', gap: 2, alignItems: 'center' }}>
              {ws.total > 0 && Array.from({ length: Math.min(ws.total, 10) }).map((_, i) => (
                <span key={i} style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: i < ws.done ? '#10b981' : '#e5e7eb',
                }} />
              ))}
            </div>
            <span style={{ ...mono, fontSize: 11, color: ws.done === ws.total && ws.total > 0 ? '#10b981' : '#6b7280', fontWeight: 600, minWidth: 24, textAlign: 'right' }}>
              {ws.total > 0 ? `${ws.done}/${ws.total}` : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function CleaningRota() {
  const [entries, setEntries, loading] = useSupabase('cleaning_entries', [])
  const [staffMembers] = useSupabase('staff_members', [])
  const { user } = useUser()
  const toast = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  const [searchParams, setSearchParams] = useSearchParams()

  // URL-driven state
  const view = searchParams.get('view') || 'today'
  const staffFilter = searchParams.get('filter') || 'all'
  const selectedDate = searchParams.get('date') || getToday()

  const setView = (v) => setSearchParams(prev => { prev.set('view', v); return prev }, { replace: true })
  const setStaffFilter = (f) => setSearchParams(prev => { prev.set('filter', f); return prev }, { replace: true })
  const setSelectedDate = (d) => setSearchParams(prev => { prev.set('date', d); return prev }, { replace: true })

  // Expanded card state (Today view)
  const [expandedId, setExpandedId] = useState(null)

  // Add task modal
  const [showAddTask, setShowAddTask] = useState(false)
  const [addForm, setAddForm] = useState({ taskName: '', staffMember: '', result: 'Pass', notes: '' })

  // Task definitions with computed assignee + status
  const enrichedTasks = useMemo(() => {
    const byFreq = {}
    DEFAULT_CLEANING_TASKS.forEach(t => {
      const f = t.frequency || 'daily'
      if (!byFreq[f]) byFreq[f] = []
      byFreq[f].push(t)
    })
    return DEFAULT_CLEANING_TASKS.map(t => {
      const f = t.frequency || 'daily'
      const idx = byFreq[f].indexOf(t)
      const assignee = getTaskAssignee(t.name, f, idx)
      const status = getRotaStatus(t, entries)
      return { ...t, assignee, status }
    })
  }, [entries])

  // Apply staff filter
  const filteredTasks = useMemo(() => {
    if (staffFilter === 'all') return enrichedTasks
    return enrichedTasks.filter(t => t.assignee === staffFilter)
  }, [enrichedTasks, staffFilter])

  // Stats (always from full set, not filtered)
  const stats = useMemo(() => {
    const todayEntries = entries.filter(e => e.dateTime && e.dateTime.slice(0, 10) === selectedDate)
    const doneToday = enrichedTasks.filter(t => {
      const hasTodayPass = entries.some(e => e.taskName === t.name && e.dateTime?.slice(0, 10) === selectedDate && e.result === 'Pass')
      return hasTodayPass
    }).length
    const pendingToday = enrichedTasks.filter(t => isTaskDueOnDate(t.frequency, selectedDate) && !entries.some(e => e.taskName === t.name && e.dateTime?.slice(0, 10) === selectedDate && e.result === 'Pass')).length
    const overdue = enrichedTasks.filter(t => t.status === 'overdue').length

    // Due this week
    const weekDates = getWeekDates(selectedDate)
    let dueThisWeek = 0
    weekDates.forEach(d => {
      enrichedTasks.forEach(t => { if (isTaskDueOnDate(t.frequency, d)) dueThisWeek++ })
    })

    return { doneToday, pendingToday, overdue, dueThisWeek }
  }, [enrichedTasks, entries, selectedDate])

  // Today view: split into outstanding + completed
  const todayTasks = useMemo(() => {
    const dueTasks = filteredTasks.filter(t => isTaskDueOnDate(t.frequency, selectedDate))
    const outstanding = dueTasks.filter(t => !entries.some(e => e.taskName === t.name && e.dateTime?.slice(0, 10) === selectedDate && e.result === 'Pass'))
    const completed = dueTasks.filter(t => entries.some(e => e.taskName === t.name && e.dateTime?.slice(0, 10) === selectedDate && e.result === 'Pass'))
    return { outstanding, completed, all: dueTasks }
  }, [filteredTasks, entries, selectedDate])

  // Week dates
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate])

  // Unique staff for avatar filter
  const rotationStaff = useMemo(() => {
    const names = new Set()
    enrichedTasks.forEach(t => names.add(t.assignee))
    return [...names].sort()
  }, [enrichedTasks])

  // ── Actions ──
  const handleMarkDone = useCallback(async (task, { result, notes, staffMember }) => {
    const entry = {
      id: generateId(),
      taskName: task.name,
      dateTime: new Date().toISOString(),
      staffMember,
      result,
      notes,
    }
    setEntries(prev => [...prev, entry])
    await logAudit(user?.name || 'System', 'cleaning_entry_add', `Marked "${task.name}" as ${result}`)
    toast.success(`${task.name} marked as ${result}`)
  }, [setEntries, user, toast])

  const handleLogMissed = useCallback(async (task, reason) => {
    const entry = {
      id: generateId(),
      taskName: task.name,
      dateTime: new Date().toISOString(),
      staffMember: user?.name || 'Unknown',
      result: 'Fail',
      notes: `Missed: ${reason}`,
    }
    setEntries(prev => [...prev, entry])
    await logAudit(user?.name || 'System', 'cleaning_entry_missed', `Logged "${task.name}" as missed: ${reason}`)
    toast.warning(`${task.name} logged as missed`)
  }, [setEntries, user, toast])

  const handleAddEntry = useCallback(async () => {
    if (!addForm.taskName || !addForm.staffMember) return
    const entry = {
      id: generateId(),
      taskName: addForm.taskName,
      dateTime: new Date().toISOString(),
      staffMember: addForm.staffMember,
      result: addForm.result,
      notes: addForm.notes,
    }
    setEntries(prev => [...prev, entry])
    await logAudit(user?.name || 'System', 'cleaning_entry_add', `Added entry for "${addForm.taskName}"`)
    toast.success('Entry added')
    setShowAddTask(false)
    setAddForm({ taskName: '', staffMember: '', result: 'Pass', notes: '' })
  }, [addForm, setEntries, user, toast])

  const handleExportCsv = useCallback(() => {
    const taskAreaMap = {}
    DEFAULT_CLEANING_TASKS.forEach(t => { taskAreaMap[t.name] = AREA_CONFIG[t.area]?.label || '' })
    downloadCsv('cleaning-rota',
      ['Date', 'Task', 'Area', 'Staff', 'Result', 'Notes'],
      entries.map(e => [
        e.dateTime ? new Date(e.dateTime).toLocaleDateString('en-GB') : '',
        e.taskName, taskAreaMap[e.taskName] || '', e.staffMember, e.result, e.notes || '',
      ])
    )
    toast.success('CSV exported')
  }, [entries, toast])

  if (loading) return <div style={{ padding: 24, ...sans }}><SkeletonLoader variant="cards" /></div>

  return (
    <div style={{ ...sans, maxWidth: 1200, margin: '0 auto', padding: '16px 16px 80px', background: '#fafafa', minHeight: '100vh' }}>
      {ConfirmDialog}

      {/* ── Page Header ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h1 style={{ ...sans, fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Cleaning Rota</h1>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={handleExportCsv} style={{ ...sans, fontSize: 12, fontWeight: 500, padding: '6px 12px', borderRadius: 8, background: '#f3f4f6', color: '#374151', border: 'none', cursor: 'pointer' }}>↓ CSV</button>
            <button onClick={() => setShowAddTask(true)} style={{ ...sans, fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 8, background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer' }}>+ Add Task</button>
          </div>
        </div>
        <p style={{ ...sans, fontSize: 13, color: '#6b7280', margin: '0 0 12px' }}>Log cleaning activities — GPhC compliance requirement.</p>

        {/* Stats Strip */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <StatPill icon="✅" count={stats.doneToday} label="done today" variant="green" />
          <StatPill icon="⏳" count={stats.pendingToday} label="pending" variant="amber" />
          <StatPill icon="🔴" count={stats.overdue} label="overdue" variant="red" />
          <StatPill icon="📅" count={stats.dueThisWeek} label="due this week" variant="blue" />
        </div>

        {/* Avatar Filter */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', overflowX: 'auto', paddingBottom: 4 }}>
          <button
            onClick={() => setStaffFilter('all')}
            style={{
              ...sans, fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
              background: staffFilter === 'all' ? '#111827' : '#f3f4f6',
              color: staffFilter === 'all' ? '#fff' : '#374151',
              border: 'none', transition: 'all 0.15s', flexShrink: 0,
            }}
          >All</button>
          {rotationStaff.map(name => (
            <AvatarBubble key={name} name={name} active={staffFilter === name} onClick={() => setStaffFilter(staffFilter === name ? 'all' : name)} />
          ))}
        </div>
      </div>

      {/* ── Main Layout: content + sidebar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 16 }}>
        {/* Left: views */}
        <div style={{ minWidth: 0 }}>
          <ViewSwitcher view={view} onViewChange={setView} selectedDate={selectedDate} onDateChange={setSelectedDate} />

          {/* ════════ TODAY VIEW ════════ */}
          {view === 'today' && (
            <div>
              {todayTasks.all.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                  <div style={{ fontSize: 48, marginBottom: 8 }}>📋</div>
                  <h3 style={{ ...sans, fontSize: 16, fontWeight: 600, color: '#374151', margin: '0 0 4px' }}>No tasks scheduled</h3>
                  <p style={{ ...sans, fontSize: 13, color: '#9ca3af' }}>No cleaning tasks are due for this date.</p>
                </div>
              ) : todayTasks.outstanding.length === 0 ? (
                <>
                  {/* All done state */}
                  <div style={{ textAlign: 'center', padding: '32px 16px', marginBottom: 16 }}>
                    <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
                    <h3 style={{ ...sans, fontSize: 16, fontWeight: 600, color: '#065f46', margin: '0 0 4px' }}>All tasks complete</h3>
                    <p style={{ ...sans, fontSize: 13, color: '#6b7280' }}>Great work — all cleaning tasks for today are done.</p>
                  </div>
                  {/* Completed section */}
                  <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #e5e7eb', padding: '12px 0 4px', ...sans, fontSize: 12, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                    ✅ Completed today ({todayTasks.completed.length})
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                    {todayTasks.completed.map(t => (
                      <TaskCard key={t.name} task={t} status="done" assignee={t.assignee} entries={entries} staffMembers={staffMembers}
                        onMarkDone={handleMarkDone} onLogMissed={handleLogMissed}
                        expanded={expandedId === t.name} onToggleExpand={() => setExpandedId(expandedId === t.name ? null : t.name)} />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {/* Outstanding cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                    {todayTasks.outstanding.map(t => (
                      <TaskCard key={t.name} task={t} status={t.status} assignee={t.assignee} entries={entries} staffMembers={staffMembers}
                        onMarkDone={handleMarkDone} onLogMissed={handleLogMissed}
                        expanded={expandedId === t.name} onToggleExpand={() => setExpandedId(expandedId === t.name ? null : t.name)} />
                    ))}
                  </div>

                  {/* Completed divider + cards */}
                  {todayTasks.completed.length > 0 && (
                    <>
                      <div style={{ borderTop: '1px solid #e5e7eb', padding: '12px 0 4px', ...sans, fontSize: 12, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 16, marginBottom: 12 }}>
                        ✅ Completed today ({todayTasks.completed.length})
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                        {todayTasks.completed.map(t => (
                          <TaskCard key={t.name} task={t} status="done" assignee={t.assignee} entries={entries} staffMembers={staffMembers}
                            onMarkDone={handleMarkDone} onLogMissed={handleLogMissed}
                            expanded={expandedId === t.name} onToggleExpand={() => setExpandedId(expandedId === t.name ? null : t.name)} />
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* ════════ WEEK VIEW ════════ */}
          {view === 'week' && (
            <WeekView
              tasks={filteredTasks}
              entries={entries}
              weekDates={weekDates}
              staffMembers={staffMembers}
              onMarkDone={handleMarkDone}
              onLogMissed={handleLogMissed}
            />
          )}

          {/* ════════ STAFF VIEW ════════ */}
          {view === 'staff' && (
            <StaffView
              enrichedTasks={filteredTasks}
              entries={entries}
              staffMembers={staffMembers}
              onMarkDone={handleMarkDone}
              onLogMissed={handleLogMissed}
            />
          )}
        </div>

        {/* Right: calendar sidebar */}
        <div className="cr-sidebar">
          <CalendarSidebar entries={entries} selectedDate={selectedDate} onSelectDate={setSelectedDate} tasks={DEFAULT_CLEANING_TASKS} />
        </div>
      </div>

      {/* ── Add Task Modal ── */}
      {showAddTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowAddTask(false)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 400, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ ...sans, fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Add Task Entry</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ ...sans, fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 2 }}>Task</label>
                <select value={addForm.taskName} onChange={e => setAddForm(f => ({ ...f, taskName: e.target.value }))}
                  style={{ ...sans, fontSize: 12, padding: '6px 10px', borderRadius: 6, border: '1px solid #e8f5f0', width: '100%' }}>
                  <option value="">Select task...</option>
                  {DEFAULT_CLEANING_TASKS.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ ...sans, fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 2 }}>Staff</label>
                <select value={addForm.staffMember} onChange={e => setAddForm(f => ({ ...f, staffMember: e.target.value }))}
                  style={{ ...sans, fontSize: 12, padding: '6px 10px', borderRadius: 6, border: '1px solid #e8f5f0', width: '100%' }}>
                  <option value="">Select staff...</option>
                  {staffMembers.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ ...sans, fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 2 }}>Result</label>
                <select value={addForm.result} onChange={e => setAddForm(f => ({ ...f, result: e.target.value }))}
                  style={{ ...sans, fontSize: 12, padding: '6px 10px', borderRadius: 6, border: '1px solid #e8f5f0', width: '100%' }}>
                  <option>Pass</option>
                  <option>Fail</option>
                </select>
              </div>
              <div>
                <label style={{ ...sans, fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 2 }}>Notes</label>
                <input type="text" value={addForm.notes} onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional..."
                  style={{ ...sans, fontSize: 12, padding: '6px 10px', borderRadius: 6, border: '1px solid #e8f5f0', width: '100%' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <button onClick={() => setShowAddTask(false)}
                  style={{ ...sans, fontSize: 12, padding: '8px 14px', borderRadius: 6, background: '#f3f4f6', color: '#6b7280', border: 'none', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleAddEntry} disabled={!addForm.taskName || !addForm.staffMember}
                  style={{ ...sans, fontSize: 12, fontWeight: 600, padding: '8px 18px', borderRadius: 6, background: addForm.taskName && addForm.staffMember ? '#10b981' : '#d1d5db', color: '#fff', border: 'none', cursor: addForm.taskName && addForm.staffMember ? 'pointer' : 'not-allowed' }}>Add Entry</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Animations + responsive ── */}
      <style>{`
        @keyframes confirmFlash {
          0% { background: #ffffff; }
          30% { background: #d1fae5; }
          100% { background: #f9fffe; }
        }
        @media (max-width: 768px) {
          .cr-sidebar { display: none; }
        }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 220px"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
