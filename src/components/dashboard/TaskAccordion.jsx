import KanbanCard from './KanbanCard'

function colProgress(cards) {
  const done = cards.filter(c => c.status === 'done').length
  return { done, total: cards.length }
}

function splitCards(cards) {
  const active = cards.filter(c => c.status !== 'done')
  const completed = cards.filter(c => c.status === 'done')
  return { active, completed }
}

export default function TaskAccordion({
  columns,
  mobileTab,
  setMobileTab,
  expandedRpCard,
  setExpandedRpCard,
  rpChecklist,
  onToggleRpItem,
  onOpenCompletion,
  onMarkAllDone,
  completedAccordion,
  setCompletedAccordion,
  collapsedCols,
  setCollapsedCols,
  searchTerm,
  onTouchStart,
  onTouchEnd,
}) {
  return (
    <div className="task-accordion no-print" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {columns.map(col => {
        const prog = colProgress(col.allCards)
        const allDone = prog.total > 0 && prog.done === prog.total
        const { active, completed } = splitCards(col.cards)
        const accordionOpen = !!completedAccordion[col.key]
        const isCollapsed = !!collapsedCols[col.key]
        const pct = prog.total > 0 ? Math.round((prog.done / prog.total) * 100) : 0

        return (
          <div key={col.key} className={`task-accordion-section ${allDone ? 'task-accordion-section--done' : ''}`}>
            <button
              className="task-accordion-header"
              onClick={() => setCollapsedCols(prev => ({ ...prev, [col.key]: !prev[col.key] }))}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="14"
                height="14"
                className={`task-accordion-chevron ${!isCollapsed ? 'task-accordion-chevron--open' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
              <span className="task-accordion-title">{col.title}</span>
              <span className="task-accordion-count">{prog.done}/{prog.total}</span>
              <div className="task-accordion-bar">
                <div
                  className="task-accordion-bar-fill"
                  style={{
                    width: `${pct}%`,
                    background: allDone ? 'var(--ec-em)' : prog.done > 0 ? 'var(--ec-warn)' : 'var(--border)',
                  }}
                />
              </div>
              {!allDone && prog.total > 0 && (
                <span
                  className="task-accordion-markall"
                  onClick={(e) => { e.stopPropagation(); onMarkAllDone(col.allCards) }}
                  role="button"
                  tabIndex={0}
                >
                  &#10003; All
                </span>
              )}
            </button>

            {!isCollapsed && (
              <div className="task-accordion-body">
                {allDone ? (
                  <div className="task-accordion-alldone">
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--ec-em)" strokeWidth="2.5" width="28" height="28">
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span>All done!</span>
                  </div>
                ) : active.length === 0 && completed.length === 0 ? (
                  <p className="dash-empty-state">{searchTerm ? 'No matches' : 'No tasks in this period'}</p>
                ) : (
                  <>
                    {active.map(card => (
                      <KanbanCard
                        key={card.id}
                        card={card}
                        onOpenCompletion={onOpenCompletion}
                        expandedRpCard={expandedRpCard}
                        setExpandedRpCard={setExpandedRpCard}
                        rpChecklist={rpChecklist}
                        onToggleRpItem={onToggleRpItem}
                      />
                    ))}
                  </>
                )}

                {completed.length > 0 && !allDone && (
                  <div className="task-accordion-completed">
                    <button
                      className="task-accordion-completed-toggle"
                      onClick={() => setCompletedAccordion(prev => ({ ...prev, [col.key]: !prev[col.key] }))}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="var(--ec-em)" strokeWidth="2.5" width="14" height="14">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      Completed ({completed.length})
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        width="14"
                        height="14"
                        className={`task-accordion-chevron ${accordionOpen ? 'task-accordion-chevron--open' : ''}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {accordionOpen && completed.map(card => (
                      <KanbanCard
                        key={card.id}
                        card={card}
                        onOpenCompletion={onOpenCompletion}
                        expandedRpCard={expandedRpCard}
                        setExpandedRpCard={setExpandedRpCard}
                        rpChecklist={rpChecklist}
                        onToggleRpItem={onToggleRpItem}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
