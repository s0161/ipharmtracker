import TaskRow from './TaskRow'

const Chev = ({ open }) => (
  <svg
    width={12} height={12} viewBox="0 0 12 12" fill="none"
    className="shrink-0 transition-transform duration-250"
    style={{ transform: open ? 'rotate(90deg)' : 'rotate(0)', transitionTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)' }}
  >
    <path d="M4.5 2.5L8 6L4.5 9.5" stroke="var(--ec-t3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const MiniBar = ({ done, total }) => (
  <div className="w-[50px] h-[3px] rounded-sm bg-ec-border overflow-hidden">
    <div
      className="h-full rounded-sm transition-all duration-400"
      style={{
        width: `${total ? (done / total) * 100 : 0}%`,
        backgroundColor: done === total && total > 0 ? 'var(--ec-em)' : 'color-mix(in srgb, var(--ec-em) 60%, transparent)',
        transitionTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)',
      }}
    />
  </div>
)

const TaskGroup = ({ tasks, checked, onToggleCheck, justChecked, rpSubChecks, onToggleRpSub, expandedNote, onToggleNote, expandedSubchecks, onToggleSubchecks }) => (
  <>
    {tasks.map(t => (
      <TaskRow
        key={t.id}
        task={{ ...t, tag: t.tag || 'Cleaning' }}
        isChecked={checked.has(t.id)}
        onToggle={() => onToggleCheck(t.id)}
        justChecked={justChecked}
        rpSubChecks={rpSubChecks}
        onToggleRpSub={onToggleRpSub}
        expandedNote={expandedNote}
        onToggleNote={onToggleNote}
        expandedSubchecks={expandedSubchecks}
        onToggleSubchecks={onToggleSubchecks}
        showTag={!!t.tag}
      />
    ))}
  </>
)

export default function AccPanel({
  id, title, tasks, isToday, open, onToggle,
  checked, onToggleCheck, justChecked,
  rpSubChecks, onToggleRpSub,
  expandedNote, onToggleNote,
  expandedSubchecks, onToggleSubchecks,
  streakDays,
}) {
  const total = tasks.length
  const done = tasks.filter(t => checked.has(t.id)).length

  // Split for Today variant
  const timeSensitive = isToday ? tasks.filter(t => t.time) : []
  const anytime = isToday ? tasks.filter(t => !t.time) : []

  const sharedProps = { checked, onToggleCheck, justChecked, rpSubChecks, onToggleRpSub, expandedNote, onToggleNote, expandedSubchecks, onToggleSubchecks }

  return (
    <div
      className="ec-fadeup rounded-xl overflow-hidden"
      style={{
        backgroundColor: 'var(--ec-card)',
        border: '1px solid var(--ec-div)',
        ...(isToday ? {
          borderLeft: '3px solid var(--ec-em)',
          boxShadow: 'inset 3px 0 12px -4px rgba(16,185,129,0.08)',
        } : {}),
        animationDelay: isToday ? '0.4s' : '0.5s',
      }}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex items-center gap-2 px-4 py-3 w-full cursor-pointer transition-colors duration-150 hover:bg-ec-card bg-transparent border-none text-left font-sans"
      >
        <Chev open={open} />
        <span className="text-[13px] font-semibold text-ec-t1">{title}</span>
        <div className="flex-1" />
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-[10px] transition-all duration-300"
          style={{
            color: done === total && total > 0 ? 'var(--ec-em)' : 'var(--ec-t3)',
            backgroundColor: done === total && total > 0 ? 'var(--ec-em-faint)' : 'var(--ec-card-hover)',
            border: done === total && total > 0 ? '1px solid rgba(16,185,129,0.15)' : '1px solid transparent',
          }}
        >
          {done}/{total}
        </span>
        <MiniBar done={done} total={total} />
      </button>

      {/* Collapsible body */}
      <div
        role="region"
        aria-hidden={!open}
        className="overflow-hidden transition-all duration-350"
        style={{
          maxHeight: open ? 3000 : 0,
          opacity: open ? 1 : 0,
          transitionTimingFunction: 'cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <div className="border-t border-ec-div px-3 pt-1.5 pb-3">
          {isToday ? (
            <>
              {/* TIME-SENSITIVE group */}
              {timeSensitive.length > 0 && (
                <>
                  <div className="flex items-center gap-1.5 mb-1.5 mt-1 text-[9px] font-bold text-ec-crit tracking-[1.2px] uppercase">
                    <div className="w-1 h-1 rounded-full bg-ec-crit" />
                    TIME-SENSITIVE
                  </div>
                  <TaskGroup tasks={timeSensitive} {...sharedProps} />
                  <div className="h-px bg-ec-div my-2" />
                </>
              )}

              {/* ANYTIME group */}
              {anytime.length > 0 && (
                <>
                  <div className="flex items-center gap-1.5 mb-1.5 text-[9px] font-bold text-ec-t3 tracking-[1.2px] uppercase">
                    <div className="w-1 h-1 rounded-full bg-ec-t3" />
                    ANYTIME
                  </div>
                  <TaskGroup tasks={anytime} {...sharedProps} />
                </>
              )}

              {/* Streak footer */}
              {streakDays !== undefined && (
                <div className="mt-3 pt-2.5 border-t border-ec-div text-[11px] text-ec-t4 flex items-center gap-1">
                  <span className="text-sm">🔥</span> {streakDays || 0} days fully completed
                </div>
              )}
            </>
          ) : (
            /* Non-today: flat list (unchanged) */
            <TaskGroup tasks={tasks} {...sharedProps} />
          )}
        </div>
      </div>
    </div>
  )
}
