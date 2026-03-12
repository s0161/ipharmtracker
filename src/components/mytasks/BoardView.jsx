import { useState, useMemo } from 'react'
import TaskRow from './TaskRow'

const COLUMNS = [
  { key: 'pending',     label: 'Pending',     accent: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  { key: 'in_progress', label: 'In Progress', accent: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  { key: 'done',        label: 'Done',        accent: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
]

export default function BoardView({ tasks, today, onStatusChange, onComplete, savingId, canModify }) {
  const [mobileTab, setMobileTab] = useState('pending')

  const columns = useMemo(() => ({
    pending: tasks.filter(t => t.status === 'pending'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    done: tasks.filter(t => t.status === 'done'),
  }), [tasks])

  return (
    <div>
      {/* Mobile tab pills */}
      <div className="flex sm:hidden gap-1 mb-3 overflow-x-auto no-scrollbar">
        {COLUMNS.map(col => (
          <button
            key={col.key}
            onClick={() => setMobileTab(col.key)}
            className="px-3 py-1.5 rounded-full text-[11px] font-semibold border-none cursor-pointer whitespace-nowrap flex items-center gap-1.5 transition-all duration-150"
            style={{
              fontFamily: "'Inter', sans-serif",
              backgroundColor: mobileTab === col.key ? col.accent : 'transparent',
              color: mobileTab === col.key ? 'white' : col.accent,
              border: `1px solid ${mobileTab === col.key ? col.accent : col.border}`,
            }}
          >
            {col.label}
            <span
              className="text-[9px] font-bold px-1.5 rounded-full"
              style={{
                backgroundColor: mobileTab === col.key ? 'rgba(255,255,255,0.25)' : col.bg,
                color: mobileTab === col.key ? 'white' : col.accent,
              }}
            >
              {columns[col.key].length}
            </span>
          </button>
        ))}
      </div>

      {/* Desktop 3-column grid */}
      <div className="hidden sm:grid sm:grid-cols-3 gap-3">
        {COLUMNS.map(col => (
          <BoardColumn
            key={col.key}
            config={col}
            tasks={columns[col.key]}
            today={today}
            onStatusChange={onStatusChange}
            onComplete={onComplete}
            savingId={savingId}
            canModify={canModify}
          />
        ))}
      </div>

      {/* Mobile single column */}
      <div className="sm:hidden">
        {COLUMNS.filter(col => col.key === mobileTab).map(col => (
          <BoardColumn
            key={col.key}
            config={col}
            tasks={columns[col.key]}
            today={today}
            onStatusChange={onStatusChange}
            onComplete={onComplete}
            savingId={savingId}
            canModify={canModify}
          />
        ))}
      </div>
    </div>
  )
}

function BoardColumn({ config, tasks, today, onStatusChange, onComplete, savingId, canModify }) {
  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: config.border, backgroundColor: `${config.bg}60` }}
    >
      {/* Column header */}
      <div
        className="px-3 py-2 flex items-center gap-2"
        style={{ borderBottom: `1px solid ${config.border}` }}
      >
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.accent }} />
        <span className="text-[12px] font-bold text-ec-t1">{config.label}</span>
        <span
          className="text-[10px] font-bold px-1.5 rounded-full ml-auto"
          style={{ backgroundColor: config.bg, color: config.accent }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Task list */}
      <div className="px-1 py-1 max-h-[60vh] overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="py-6 text-center text-[11px] text-ec-t3">No tasks</div>
        ) : (
          tasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              today={today}
              onStatusChange={onStatusChange}
              onComplete={onComplete}
              savingId={savingId}
              canModify={canModify}
              urgency="upcoming"
            />
          ))
        )}
      </div>
    </div>
  )
}
