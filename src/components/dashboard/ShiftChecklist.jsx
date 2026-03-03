import TaskRow from './TaskRow'

const Check = ({ s = 10, c = '#10b981' }) => (
  <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
    <path d="M2.5 6L5 8.5L9.5 3.5" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const MiniBar = ({ done, total }) => (
  <div className="w-[50px] h-[3px] rounded-sm bg-white/[0.06] overflow-hidden">
    <div
      className="h-full rounded-sm transition-all duration-400"
      style={{
        width: `${total ? (done / total) * 100 : 0}%`,
        backgroundColor: done === total && total > 0 ? '#10b981' : 'rgba(16,185,129,0.6)',
        transitionTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)',
      }}
    />
  </div>
)

export default function ShiftChecklist({
  todayTasks, checked, onToggleCheck, justChecked,
  rpSubChecks, onToggleRpSub,
  expandedNote, onToggleNote,
  expandedSubchecks, onToggleSubchecks,
  hovCard, onHoverCard,
  streakDays,
}) {
  const todayChecked = todayTasks.filter(t => checked.has(t.id)).length
  const allDone = todayChecked === todayTasks.length && todayTasks.length > 0

  // Split into time-sensitive (has .time) and anytime
  const timeSensitive = todayTasks.filter(t => t.time)
  const anytime = todayTasks.filter(t => !t.time)

  const isHov = hovCard === 'shift'

  return (
    <div
      className="ec-fadeup rounded-2xl p-5 transition-all duration-250"
      style={{
        flex: '0 0 58%',
        backgroundColor: isHov ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.025)',
        border: `1px solid ${isHov ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 16,
        boxShadow: isHov
          ? '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)'
          : '0 1px 3px rgba(0,0,0,0.4)',
        transform: isHov ? 'translateY(-3px)' : 'translateY(0)',
        transitionTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)',
        animationDelay: '0.2s',
      }}
      onMouseEnter={() => onHoverCard?.('shift')}
      onMouseLeave={() => onHoverCard?.(null)}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-[13px] font-bold text-ec-t1 tracking-wide">Shift Checklist</span>
        <div className="flex-1" />
        {allDone && (
          <span className="text-[10px] text-ec-em font-semibold flex items-center gap-1">
            <Check />Complete
          </span>
        )}
        <span
          className="text-[11px] font-semibold tabular-nums transition-colors duration-300"
          style={{ color: allDone ? '#10b981' : 'rgba(255,255,255,0.25)' }}
        >
          {todayChecked}/{todayTasks.length}
        </span>
        <MiniBar done={todayChecked} total={todayTasks.length} />
      </div>

      <div className="h-px bg-ec-div my-3.5" />

      {/* Time-sensitive section */}
      {timeSensitive.length > 0 && (
        <>
          <div className="flex items-center gap-1.5 mb-2 text-[9px] font-bold text-ec-crit tracking-[1.2px] uppercase">
            <div className="w-1 h-1 rounded-full bg-ec-crit" />
            TIME-SENSITIVE
          </div>
          {timeSensitive.map(t => (
            <TaskRow
              key={t.id}
              task={t}
              isChecked={checked.has(t.id)}
              onToggle={() => onToggleCheck(t.id)}
              justChecked={justChecked}
              rpSubChecks={rpSubChecks}
              onToggleRpSub={onToggleRpSub}
              expandedNote={expandedNote}
              onToggleNote={onToggleNote}
              expandedSubchecks={expandedSubchecks}
              onToggleSubchecks={onToggleSubchecks}
            />
          ))}
          <div className="h-px bg-ec-div my-2.5" />
        </>
      )}

      {/* Anytime section */}
      {anytime.length > 0 && (
        <>
          <div className="flex items-center gap-1.5 mb-2 text-[9px] font-bold text-ec-t3 tracking-[1.2px] uppercase">
            <div className="w-1 h-1 rounded-full bg-ec-t3" />
            ANYTIME
          </div>
          {anytime.map(t => (
            <TaskRow
              key={t.id}
              task={t}
              isChecked={checked.has(t.id)}
              onToggle={() => onToggleCheck(t.id)}
              justChecked={justChecked}
              rpSubChecks={rpSubChecks}
              onToggleRpSub={onToggleRpSub}
              expandedNote={expandedNote}
              onToggleNote={onToggleNote}
              expandedSubchecks={expandedSubchecks}
              onToggleSubchecks={onToggleSubchecks}
            />
          ))}
        </>
      )}

      {/* Streak footer */}
      <div className="mt-[18px] pt-3 border-t border-ec-div text-[11px] text-white/[0.18] flex items-center gap-1">
        <span className="text-sm">🔥</span> {streakDays || 0} days fully completed
      </div>
    </div>
  )
}
