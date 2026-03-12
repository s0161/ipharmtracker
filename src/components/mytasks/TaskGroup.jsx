import { useState } from 'react'
import { TaskTile } from './TaskRow'

const GROUP_CONFIG = {
  overdue:   { label: 'OVERDUE',   accent: 'var(--ec-crit)', dotBg: 'var(--ec-crit-bg)' },
  dueToday:  { label: 'DUE TODAY', accent: 'var(--ec-warn)', dotBg: 'var(--ec-warn-bg)' },
  upcoming:  { label: 'UPCOMING',  accent: 'var(--ec-info)', dotBg: 'var(--ec-info-bg)' },
  completed: { label: 'COMPLETED', accent: 'var(--ec-em)', dotBg: 'var(--ec-em-bg)' },
}

export default function TaskGroup({
  groupKey, tasks, today,
  onStatusChange, onComplete, savingId, canModify,
  defaultOpen = true,
}) {
  const [open, setOpen] = useState(defaultOpen)
  const config = GROUP_CONFIG[groupKey] || GROUP_CONFIG.upcoming

  if (tasks.length === 0) return null

  return (
    <div className="mb-3">
      {/* Group header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 py-2 px-1 bg-transparent border-none cursor-pointer text-left select-none"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: config.accent }} />
        <svg
          width={8} height={8} viewBox="0 0 8 8" fill="var(--ec-t3)"
          className="shrink-0 transition-transform duration-200"
          style={{ transform: open ? 'rotate(90deg)' : 'rotate(0)' }}
        >
          <path d="M2 1l4 3-4 3z" />
        </svg>
        <span className="text-[11px] font-bold tracking-[0.06em] text-ec-t2 uppercase">
          {config.label}
        </span>
        <span
          className="text-[10px] font-bold px-2 py-px rounded-full"
          style={{
            backgroundColor: config.dotBg,
            color: config.accent,
            border: `1px solid ${config.accent}20`,
          }}
        >
          {tasks.length}
        </span>
        <div className="flex-1 h-px ml-2" style={{ backgroundColor: `${config.accent}20` }} />
      </button>

      {/* Tile grid */}
      {open && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-start px-1 mt-1">
          {tasks.map(task => (
            <TaskTile
              key={task.id}
              task={task}
              today={today}
              onStatusChange={onStatusChange}
              onComplete={onComplete}
              savingId={savingId}
              canModify={canModify}
              urgency={groupKey}
            />
          ))}
        </div>
      )}
    </div>
  )
}
