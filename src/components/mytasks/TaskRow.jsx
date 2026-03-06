import { useState } from 'react'
import Avatar from '../Avatar'
import { isTaskOverdue, CATEGORY_LABELS } from '../../utils/taskEngine'

export const PRIORITY_STYLES = {
  urgent: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'URGENT' },
  high:   { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa', label: 'HIGH' },
  normal: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', label: 'NORMAL' },
  low:    { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0', label: 'LOW' },
}

export const CATEGORY_COLORS = {
  opening:    { bg: '#fef9c3', color: '#a16207', border: '#fde68a' },
  clinical:   { bg: '#fdf4ff', color: '#9333ea', border: '#e9d5ff' },
  dispensary: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  stock:      { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  compliance: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  closing:    { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
  admin:      { bg: '#fef9c3', color: '#a16207', border: '#fde68a' },
  other:      { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' },
}

const Check = ({ s = 10 }) => (
  <svg width={s} height={s} viewBox="0 0 12 12" fill="none" className="task-check-draw">
    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const Chev = ({ open }) => (
  <svg
    width={12} height={12} viewBox="0 0 12 12" fill="none"
    className="shrink-0 transition-transform duration-200"
    style={{ transform: open ? 'rotate(90deg)' : 'rotate(0)', transitionTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)' }}
  >
    <path d="M4.5 2.5L8 6L4.5 9.5" stroke="var(--ec-t3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const LinkIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

function getDueLabel(task, today) {
  if (task.status === 'done') return null
  if (!task.dueDate) return null
  if (task.dueDate < today) {
    const days = Math.floor((new Date(today + 'T00:00:00') - new Date(task.dueDate + 'T00:00:00')) / 86400000)
    return { text: `${days}d late`, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' }
  }
  if (task.dueDate === today) {
    return { text: 'Today', color: '#d97706', bg: '#fffbeb', border: '#fde68a' }
  }
  const d = new Date(task.dueDate + 'T00:00:00')
  return {
    text: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    color: '#94a3b8', bg: 'transparent', border: 'transparent',
  }
}

function useTaskCommon({ task, today, onStatusChange, onComplete, savingId, canModify }) {
  const [justChecked, setJustChecked] = useState(false)
  const isDone = task.status === 'done'
  const pri = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.normal
  const cat = CATEGORY_COLORS[task.category] || CATEGORY_COLORS.other
  const due = getDueLabel(task, today)
  const isSaving = savingId === task.id
  const taskCanModify = typeof canModify === 'function' ? canModify(task) : canModify

  function handleCheck() {
    if (!taskCanModify || isSaving) return
    if (isDone) {
      onStatusChange?.(task.id, 'pending')
    } else if (task.linkedLog && onComplete) {
      onComplete(task)
    } else {
      setJustChecked(true)
      setTimeout(() => setJustChecked(false), 500)
      if (onComplete) {
        onComplete(task)
      } else {
        onStatusChange?.(task.id, 'done')
      }
    }
  }

  return { isDone, pri, cat, due, isSaving, taskCanModify, justChecked, handleCheck }
}

/** Tile (card) view — used by default */
export function TaskTile({ task, today, onStatusChange, onComplete, savingId, canModify, urgency }) {
  const { isDone, pri, cat, due, isSaving, justChecked, handleCheck } =
    useTaskCommon({ task, today, onStatusChange, onComplete, savingId, canModify })

  const topAccent = urgency === 'overdue' ? '#ef4444'
    : urgency === 'dueToday' ? '#f59e0b'
    : urgency === 'completed' ? '#10b981'
    : 'var(--ec-div)'

  return (
    <div
      className={`bg-ec-card rounded-xl border border-ec-div relative overflow-hidden transition-all duration-200 hover:shadow-md ${isDone ? 'opacity-55' : ''}`}
      style={{ boxShadow: '0 1px 4px rgba(5,150,105,0.06)' }}
    >
      {/* Top accent bar */}
      <div className="h-[3px] w-full" style={{ backgroundColor: topAccent }} />

      <div className="px-3.5 pt-3 pb-3">
        {/* Row 1: badges */}
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <span
            className="text-[9px] font-bold px-1.5 py-px rounded tracking-wide uppercase"
            style={{ backgroundColor: pri.bg, color: pri.color, border: `1px solid ${pri.border}` }}
          >
            {pri.label}
          </span>
          {task.category && (
            <span
              className="text-[9px] font-semibold px-1.5 py-px rounded"
              style={{ backgroundColor: cat.bg, color: cat.color, border: `1px solid ${cat.border}` }}
            >
              {CATEGORY_LABELS[task.category] || task.category}
            </span>
          )}
          {due && !isDone && (
            <span
              className="text-[9px] font-semibold px-1.5 py-px rounded ml-auto whitespace-nowrap"
              style={{ backgroundColor: due.bg, color: due.color, border: due.border !== 'transparent' ? `1px solid ${due.border}` : 'none' }}
            >
              {due.text}
            </span>
          )}
        </div>

        {/* Row 2: checkbox + title */}
        <div className="flex items-start gap-2 mb-2">
          <div
            onClick={handleCheck}
            className={`w-[18px] h-[18px] rounded-[5px] shrink-0 cursor-pointer relative flex items-center justify-center transition-all duration-200 mt-px ${justChecked ? 'task-check-fill' : ''}`}
            style={{
              border: `2px solid ${isDone ? 'var(--ec-em)' : 'var(--ec-t4)'}`,
              backgroundColor: isDone ? 'var(--ec-em)' : 'transparent',
              transitionTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)',
            }}
          >
            {isDone && <Check />}
            {justChecked && (
              <div className="absolute -inset-1 rounded-lg pointer-events-none task-ripple" style={{ border: '2px solid var(--ec-em)' }} />
            )}
          </div>
          <span
            className={`text-[13px] font-semibold leading-snug transition-all duration-300 ${isDone ? 'line-through text-ec-t3' : 'text-ec-t1'}`}
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {task.taskName || task.title}
          </span>
        </div>

        {/* Row 3: description snippet */}
        {task.notes && (
          <p className="text-[11px] text-ec-t3 leading-relaxed m-0 mb-2 line-clamp-2">{task.notes}</p>
        )}

        {/* Row 4: footer — assignee + linked log */}
        <div className="flex items-center gap-2 pt-1.5" style={{ borderTop: '1px solid var(--ec-div)' }}>
          {task.assignedTo ? (
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <Avatar name={task.assignedTo} size={20} />
              <span className="text-[10px] text-ec-t2 font-medium truncate">{task.assignedTo}</span>
            </div>
          ) : (
            <span className="text-[10px] text-ec-t3 italic flex-1">Unassigned</span>
          )}
          {isSaving && (
            <div className="w-3 h-3 border-[1.5px] border-ec-em border-t-transparent rounded-full shrink-0" style={{ animation: 'spin 0.6s linear infinite' }} />
          )}
          {task.linkedLog && (
            <a
              href={`#${task.linkedLog}`}
              onClick={e => e.stopPropagation()}
              className="shrink-0 flex items-center"
              style={{ color: '#059669' }}
              title="Open linked log"
            >
              <LinkIcon />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

/** Row (list) view — compact single-line */
export default function TaskRow({ task, today, onStatusChange, onComplete, savingId, canModify, urgency }) {
  const [expanded, setExpanded] = useState(false)
  const [hov, setHov] = useState(false)
  const { isDone, pri, cat, due, isSaving, justChecked, handleCheck } =
    useTaskCommon({ task, today, onStatusChange, onComplete, savingId, canModify })

  const leftBorder = urgency === 'overdue' ? '#ef4444'
    : urgency === 'dueToday' ? '#f59e0b'
    : 'transparent'

  const hasDetails = task.notes || task.assignedBy || task.linkedLog

  return (
    <div className={`task-row-enter ${isDone ? 'task-row-done' : ''}`}>
      {/* Main row */}
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        className="flex items-center gap-2.5 px-3 rounded-lg transition-all duration-150 cursor-pointer"
        style={{
          minHeight: 44,
          borderLeft: `3px solid ${leftBorder}`,
          backgroundColor: hov ? 'var(--ec-card)' : 'transparent',
        }}
        onClick={() => hasDetails && setExpanded(!expanded)}
      >
        {/* Animated checkbox */}
        <div
          onClick={(e) => { e.stopPropagation(); handleCheck() }}
          className={`w-[18px] h-[18px] rounded-[5px] shrink-0 cursor-pointer relative flex items-center justify-center transition-all duration-200 ${justChecked ? 'task-check-fill' : ''}`}
          style={{
            border: `2px solid ${isDone ? 'var(--ec-em)' : 'var(--ec-t4)'}`,
            backgroundColor: isDone ? 'var(--ec-em)' : 'transparent',
            transitionTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          {isDone && <Check />}
          {justChecked && (
            <div
              className="absolute -inset-1 rounded-lg pointer-events-none task-ripple"
              style={{ border: '2px solid var(--ec-em)' }}
            />
          )}
        </div>

        {/* Title */}
        <span
          className={`flex-1 text-[13px] font-medium transition-all duration-300 ${isDone ? 'line-through opacity-40 text-ec-t3' : 'text-ec-t1'}`}
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {task.taskName || task.title}
        </span>

        {/* Priority badge */}
        <span
          className="text-[9px] font-bold px-1.5 py-px rounded tracking-wide uppercase hidden sm:inline-block"
          style={{ backgroundColor: pri.bg, color: pri.color, border: `1px solid ${pri.border}` }}
        >
          {pri.label}
        </span>

        {/* Category chip */}
        {task.category && (
          <span
            className="text-[9px] font-semibold px-1.5 py-px rounded hidden md:inline-block"
            style={{ backgroundColor: cat.bg, color: cat.color, border: `1px solid ${cat.border}` }}
          >
            {CATEGORY_LABELS[task.category] || task.category}
          </span>
        )}

        {/* Assignee avatar */}
        {task.assignedTo && (
          <div className="hidden sm:block">
            <Avatar name={task.assignedTo} size={22} />
          </div>
        )}

        {/* Due indicator */}
        {due && !isDone && (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded whitespace-nowrap"
            style={{ backgroundColor: due.bg, color: due.color, border: due.border !== 'transparent' ? `1px solid ${due.border}` : 'none' }}
          >
            {due.text}
          </span>
        )}

        {/* Saving spinner */}
        {isSaving && (
          <div className="w-3.5 h-3.5 border-2 border-ec-em border-t-transparent rounded-full shrink-0" style={{ animation: 'spin 0.6s linear infinite' }} />
        )}

        {/* Expand chevron */}
        {hasDetails && (
          <Chev open={expanded} />
        )}
      </div>

      {/* Expandable details */}
      <div
        className="overflow-hidden transition-all duration-250"
        style={{ maxHeight: expanded ? 200 : 0, opacity: expanded ? 1 : 0 }}
      >
        <div className="ml-[33px] mb-1.5 px-3 py-2 rounded-md bg-ec-card border border-ec-div text-xs leading-relaxed flex flex-col gap-1.5">
          {task.notes && (
            <p className="text-ec-t2 m-0">{task.notes}</p>
          )}
          {task.assignedBy && task.assignedBy !== task.assignedTo && (
            <p className="text-ec-t3 m-0 text-[10px]">
              Assigned by <span className="font-semibold text-ec-t2">{task.assignedBy}</span>
            </p>
          )}
          {task.linkedLog && (
            <a
              href={`#${task.linkedLog}`}
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[11px] font-semibold no-underline hover:underline"
              style={{ color: '#059669' }}
            >
              <LinkIcon /> Open linked log
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
