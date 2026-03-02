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

export default function KanbanBoard({
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
    <div className="kanban-board no-print" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {columns.map(col => {
        const prog = colProgress(col.allCards)
        const allDone = prog.total > 0 && prog.done === prog.total
        const { active, completed } = splitCards(col.cards)
        const accordionOpen = !!completedAccordion[col.key]
        const isCollapsed = !!collapsedCols[col.key]
        return (
          <div key={col.key} className={`kanban-column ${mobileTab === col.key ? 'kanban-column--mobile-active' : ''} ${isCollapsed ? 'kanban-column--collapsed' : ''}`}>
            <div className="kanban-column-header kanban-column-header--sticky" onClick={() => setCollapsedCols(prev => ({ ...prev, [col.key]: !prev[col.key] }))} style={{ cursor: 'pointer' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" className={`kanban-collapse-chevron ${isCollapsed ? 'kanban-collapse-chevron--closed' : ''}`}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
              <span className="kanban-column-title">{col.title}</span>
              <span className="kanban-column-count">{prog.done}/{prog.total}</span>
              {!allDone && prog.total > 0 && !isCollapsed && (
                <button className="kanban-markall-btn" onClick={(e) => { e.stopPropagation(); onMarkAllDone(col.allCards) }} title="Mark all done">
                  &#10003; All
                </button>
              )}
            </div>
            {/* Column progress bar */}
            <div className="kanban-col-progress">
              <div className="kanban-col-progress-fill" style={{
                width: prog.total > 0 ? `${(prog.done / prog.total) * 100}%` : '0%',
                background: allDone ? 'var(--success)' : prog.done > 0 ? 'var(--warning)' : 'var(--border)',
              }} />
            </div>
            {!isCollapsed && <div className="kanban-cards">
              {allDone ? (
                <div className="kanban-all-done">
                  <svg className="kanban-all-done-icon" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" width="32" height="32">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span className="kanban-all-done-text">All done!</span>
                </div>
              ) : active.length === 0 && completed.length === 0 ? (
                <p className="kanban-empty">{searchTerm ? 'No matches' : 'No tasks'}</p>
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
              {/* Completed accordion */}
              {completed.length > 0 && !allDone && (
                <div className="kanban-completed-accordion">
                  <button
                    className="kanban-completed-toggle"
                    onClick={() => setCompletedAccordion(prev => ({ ...prev, [col.key]: !prev[col.key] }))}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" width="14" height="14">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Completed ({completed.length})
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" className={`kanban-accordion-chevron ${accordionOpen ? 'kanban-accordion-chevron--open' : ''}`}>
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
            </div>}
          </div>
        )
      })}
    </div>
  )
}
