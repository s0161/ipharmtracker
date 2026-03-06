import Avatar from '../Avatar'
import { isTaskOverdue, CATEGORY_LABELS } from '../../utils/taskEngine'

const PRIORITY_STYLES = {
  urgent: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'URGENT' },
  high:   { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa', label: 'HIGH' },
  normal: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', label: 'NORMAL' },
  low:    { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0', label: 'LOW' },
}

const CATEGORY_COLORS = {
  opening:    { bg: '#fef9c3', color: '#a16207', border: '#fde68a' },
  clinical:   { bg: '#fdf4ff', color: '#9333ea', border: '#e9d5ff' },
  dispensary: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  stock:      { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  compliance: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  closing:    { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
  admin:      { bg: '#fef9c3', color: '#a16207', border: '#fde68a' },
  other:      { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' },
}

const STATUSES = ['pending', 'in_progress', 'done']

function StatusLabel(s) {
  return s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)
}

export default function TaskCard({ task, today, canModify, onStatusChange, savingId, onComplete }) {
  const overdue = isTaskOverdue(task)
  const isDone = task.status === 'done'
  const isSaving = savingId === task.id
  const pri = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.normal
  const cat = CATEGORY_COLORS[task.category] || CATEGORY_COLORS.other

  function renderDueDate() {
    if (!task.dueDate) return null
    if (task.dueDate === today && !isDone) {
      return <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 20, background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>Due today</span>
    }
    if (task.dueDate < today && !isDone) {
      const days = Math.floor((new Date(today + 'T00:00:00') - new Date(task.dueDate + 'T00:00:00')) / 86400000)
      return <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 20, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>{days}d overdue</span>
    }
    return (
      <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: '#94a3b8' }}>
        {new Date(task.dueDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
      </span>
    )
  }

  return (
    <div style={{
      background: 'white', borderRadius: 10, padding: '12px 14px', marginBottom: 6,
      border: `1px solid ${overdue ? '#fecaca' : '#d1fae5'}`,
      boxShadow: '0 1px 4px rgba(5,150,105,0.06)',
      opacity: isDone ? 0.6 : 1,
      position: 'relative', overflow: 'hidden',
    }}>
      {overdue && (
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: '#ef4444', borderRadius: '10px 0 0 10px' }} />
      )}

      {/* Row 1: priority + category + title + linked log */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, paddingLeft: overdue ? 6 : 0 }}>
        <span style={{
          fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 20,
          background: pri.bg, color: pri.color, border: `1px solid ${pri.border}`,
          letterSpacing: '0.05em', fontFamily: "'DM Mono', monospace",
        }}>{pri.label}</span>
        {task.category && (
          <span style={{
            fontSize: 9, fontWeight: 600, padding: '1px 7px', borderRadius: 20,
            background: cat.bg, color: cat.color, border: `1px solid ${cat.border}`,
          }}>{CATEGORY_LABELS[task.category] || task.category}</span>
        )}
        <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', textDecoration: isDone ? 'line-through' : 'none', flex: 1 }}>
          {task.taskName || task.title}
        </span>
        {task.linkedLog && (
          <a href={`#${task.linkedLog}`} onClick={e => e.stopPropagation()} title="Open linked log"
            style={{ color: '#059669', fontSize: 12, textDecoration: 'none', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        )}
      </div>

      {/* Row 2: assigned to */}
      {task.assignedTo && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4, fontSize: 10, color: '#94a3b8', paddingLeft: overdue ? 6 : 0 }}>
          <Avatar name={task.assignedTo} size={18} />
          <span>{task.assignedTo}</span>
          {task.assignedBy && task.assignedBy !== task.assignedTo && (
            <>
              <span style={{ color: '#cbd5e1', margin: '0 2px' }}>assigned by</span>
              <span>{task.assignedBy}</span>
            </>
          )}
        </div>
      )}

      {/* Row 3: due date + notes */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, paddingLeft: overdue ? 6 : 0 }}>
        {renderDueDate()}
        {task.notes && (
          <span style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {task.notes}
          </span>
        )}
      </div>

      {/* Row 4: status buttons */}
      <div style={{ display: 'flex', gap: 4, paddingLeft: overdue ? 6 : 0 }}>
        {STATUSES.map(s => {
          const isActive = task.status === s
          return (
            <button key={s}
              onClick={() => {
                if (!canModify || isSaving) return
                if (s === 'done' && onComplete) {
                  onComplete(task)
                } else {
                  onStatusChange(task.id, s)
                }
              }}
              disabled={!canModify || isSaving}
              style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600,
                border: isActive ? 'none' : '1px solid #d1fae5',
                background: isActive ? '#059669' : 'white',
                color: isActive ? 'white' : '#64748b',
                cursor: canModify && !isSaving ? 'pointer' : 'default',
                fontFamily: "'DM Sans', sans-serif",
                opacity: canModify ? 1 : 0.5,
                display: 'inline-flex', alignItems: 'center', gap: 3,
              }}
            >
              {isSaving && isActive && <span style={{
                width: 8, height: 8, border: '1.5px solid currentColor', borderTopColor: 'transparent',
                borderRadius: '50%', animation: 'taskSpin 0.6s linear infinite', display: 'inline-block', flexShrink: 0,
              }} />}
              {StatusLabel(s)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
