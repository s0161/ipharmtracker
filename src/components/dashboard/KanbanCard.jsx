import { getStaffInitials, getStaffColor } from '../../utils/rotationManager'

function getUrgencyClass(card) {
  if (card.status === 'done') return ''
  if (!card.dueTime) return ''
  const [h, m] = card.dueTime.split(':').map(Number)
  const now = new Date()
  const dueMinutes = h * 60 + m
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  if (nowMinutes >= dueMinutes) return 'kanban-card--urgent-overdue'
  if (dueMinutes - nowMinutes <= 60) return 'kanban-card--urgent-soon'
  return ''
}

export default function KanbanCard({ card, onOpenCompletion, expandedRpCard, setExpandedRpCard, rpChecklist, onToggleRpItem }) {
  const isCleaning = card.category === 'Cleaning'
  const isRp = card.category === 'RP Check'
  const isTemp = card.category === 'Temperature'
  const isExpanded = expandedRpCard === card.id
  const isDone = card.status === 'done'

  const borderClass = isDone
    ? 'kanban-card--done'
    : card.status === 'overdue'
      ? 'kanban-card--overdue'
      : isRp
        ? 'kanban-card--rp'
        : 'kanban-card--due'

  const urgencyClass = getUrgencyClass(card)

  const categoryClass = isRp ? 'kanban-card-pill--rp' : isTemp ? 'kanban-card-pill--temp' : 'kanban-card-pill--clean'

  return (
    <div className={`kanban-card ${borderClass} ${urgencyClass} ${isDone ? 'kanban-card--completed' : ''}`}>
      <div className="kanban-card-row">
        {/* Tick button or done icon */}
        {(isCleaning || isTemp) && !isDone && (
          <button className="kanban-tick-btn" onClick={() => onOpenCompletion(card)} aria-label={`Mark ${card.name} as done`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><circle cx="12" cy="12" r="10" /></svg>
          </button>
        )}
        {(isCleaning || isTemp) && isDone && (
          <span className="kanban-tick-done">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" width="18" height="18">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </span>
        )}
        {isRp && (
          <button className="kanban-tick-btn" onClick={() => setExpandedRpCard(isExpanded ? null : card.id)}>
            <svg viewBox="0 0 24 24" fill="none" stroke={isDone ? 'var(--success)' : 'currentColor'} strokeWidth="2" width="18" height="18">
              {isDone ? (
                <><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>
              ) : (
                <circle cx="12" cy="12" r="10" />
              )}
            </svg>
          </button>
        )}

        {/* Staff avatar */}
        {card.assignedTo && (
          <span
            className="kanban-avatar"
            title={card.assignedTo}
            style={{ background: `${getStaffColor(card.assignedTo)}22`, color: getStaffColor(card.assignedTo) }}
          >
            {getStaffInitials(card.assignedTo)}
          </span>
        )}

        <div className="kanban-card-body">
          <span className="kanban-card-name">{card.name}</span>
          <div className="kanban-card-meta">
            <span className={`kanban-card-pill kanban-card-pill--cat ${categoryClass}`}>{card.category}</span>
            {card.dueTime && !isDone && (
              <span className={`kanban-card-due-time ${card.dueTimeOverdue ? 'kanban-card-due-time--overdue' : ''}`}>
                {card.dueTimeOverdue && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                )}
                by {card.dueTime}
              </span>
            )}
            {card.isSummary
              ? <span className="kanban-card-time">{card.doneCount}/{card.total} done</span>
              : card.timestamp && <span className="kanban-card-time">Completed {card.timestamp}</span>}
          </div>
        </div>
      </div>

      {/* RP expanded checklist */}
      {isRp && isExpanded && card.rpItems && (
        <div className="kanban-rp-checklist">
          {card.rpItems.map(item => (
            <label key={item} className="kanban-rp-item">
              <input type="checkbox" checked={!!rpChecklist[item]} onChange={() => onToggleRpItem(item)} />
              <span>{item}</span>
            </label>
          ))}
        </div>
      )}

      {/* Progress bar for RP summary */}
      {card.isSummary && (
        <div className="kanban-card-progress">
          <div className="kanban-card-progress-fill" style={{
            width: `${(card.doneCount / card.total) * 100}%`,
            background: isDone ? 'var(--success)' : card.doneCount === 0 ? 'var(--border)' : 'var(--warning)',
          }} />
        </div>
      )}
    </div>
  )
}
