export default function ActionCounter({ overdue, dueToday, upcoming, onToggleOutstanding }) {
  const total = overdue + dueToday + upcoming
  if (total === 0) {
    return (
      <div className="action-counter">
        <span className="action-counter-clear">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          All Clear
        </span>
      </div>
    )
  }

  return (
    <button className="action-counter" onClick={onToggleOutstanding}>
      {overdue > 0 && (
        <span className="action-counter-seg action-counter-seg--overdue">
          <span className="action-counter-num">{overdue}</span>
          <span className="action-counter-label">Overdue</span>
        </span>
      )}
      {dueToday > 0 && (
        <span className="action-counter-seg action-counter-seg--today">
          <span className="action-counter-num">{dueToday}</span>
          <span className="action-counter-label">Due Today</span>
        </span>
      )}
      {upcoming > 0 && (
        <span className="action-counter-seg action-counter-seg--upcoming">
          <span className="action-counter-num">{upcoming}</span>
          <span className="action-counter-label">Upcoming</span>
        </span>
      )}
    </button>
  )
}
