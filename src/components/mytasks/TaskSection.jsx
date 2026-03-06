import TaskCard from './TaskCard'
import { CATEGORY_LABELS } from '../../utils/taskEngine'

export default function TaskSection({ category, tasks, open, onToggle, today, canModify, onStatusChange, savingId, onComplete }) {
  if (tasks.length === 0) return null

  const doneCount = tasks.filter(t => t.status === 'done').length
  const label = CATEGORY_LABELS[category] || category

  return (
    <div style={{ marginBottom: 8 }}>
      <button
        onClick={onToggle}
        style={{
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 0', userSelect: 'none', width: '100%',
          background: 'none', border: 'none', textAlign: 'left', fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="#94a3b8"
          style={{ transition: 'transform 0.15s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>
          <path d="M2 1l4 3-4 3z" />
        </svg>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 20,
          background: doneCount === tasks.length ? '#f0fdf4' : '#f8fafc',
          color: doneCount === tasks.length ? '#059669' : '#64748b',
          border: `1px solid ${doneCount === tasks.length ? '#bbf7d0' : '#e2e8f0'}`,
        }}>
          {doneCount}/{tasks.length}
        </span>
        {/* Mini progress bar */}
        <div style={{ width: 50, height: 3, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            width: `${tasks.length ? (doneCount / tasks.length) * 100 : 0}%`,
            height: '100%', borderRadius: 2, transition: 'width 0.3s',
            background: doneCount === tasks.length && tasks.length > 0 ? '#16a34a' : '#f59e0b',
          }} />
        </div>
      </button>

      {open && (
        <div style={{ paddingLeft: 0 }}>
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              today={today}
              canModify={typeof canModify === 'function' ? canModify(task) : canModify}
              onStatusChange={onStatusChange}
              savingId={savingId}
              onComplete={onComplete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
