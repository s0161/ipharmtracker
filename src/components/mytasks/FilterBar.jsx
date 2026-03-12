import { useMemo, useState } from 'react'
import { CATEGORY_ORDER, CATEGORY_LABELS, isElevatedRole } from '../../utils/taskEngine'
import { CATEGORY_COLORS } from './TaskRow'

const STATUS_FILTERS = [
  { key: 'all',     label: 'All' },
  { key: 'mine',    label: 'Mine' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'today',   label: 'Today' },
]

const TileIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="1" width="5" height="5" rx="1" /><rect x="8" y="1" width="5" height="5" rx="1" /><rect x="1" y="8" width="5" height="5" rx="1" /><rect x="8" y="8" width="5" height="5" rx="1" />
  </svg>
)


const BoardIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="1" width="3.5" height="12" rx="1" /><rect x="5.25" y="1" width="3.5" height="8" rx="1" /><rect x="9.5" y="1" width="3.5" height="10" rx="1" />
  </svg>
)

export default function FilterBar({
  filter, onFilterChange,
  categoryFilter, onCategoryToggle,
  view, onViewChange,
  tasks,
  isElevated,
  onAssignClick,
  overdueCount,
}) {
  const [catPopoverOpen, setCatPopoverOpen] = useState(false)

  // Only show categories that have tasks
  const activeCategories = useMemo(() => {
    const catSet = new Set(tasks.map(t => t.category).filter(Boolean))
    return CATEGORY_ORDER.filter(c => catSet.has(c))
  }, [tasks])

  return (
    <div className="bg-ec-card rounded-xl border border-ec-div px-3 py-2.5 mb-3 flex flex-col sm:flex-row sm:items-center gap-2">
      {/* Status filters */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => onFilterChange(f.key)}
            className="px-3 py-1 rounded-full text-[11px] font-semibold border-none cursor-pointer whitespace-nowrap transition-all duration-150"
            style={{
              fontFamily: "'Inter', sans-serif",
              backgroundColor: filter === f.key ? 'var(--ec-em)' : 'transparent',
              color: filter === f.key ? 'white' : 'var(--ec-t2)',
            }}
          >
            {f.label}
            {f.key === 'overdue' && overdueCount > 0 && (
              <span
                className="ml-1 text-[9px] font-bold px-1 rounded-full"
                style={{
                  backgroundColor: filter === f.key ? 'rgba(255,255,255,0.25)' : 'var(--ec-crit-bg)',
                  color: filter === f.key ? 'white' : 'var(--ec-crit)',
                }}
              >
                {overdueCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="hidden sm:block w-px h-5 bg-ec-div shrink-0" />

      {/* Category chips — desktop inline, mobile popover */}
      <div className="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {/* Mobile filter icon */}
        <button
          onClick={() => setCatPopoverOpen(!catPopoverOpen)}
          className="sm:hidden px-2 py-1 rounded-lg text-[11px] font-semibold border border-ec-div bg-transparent cursor-pointer text-ec-t2 shrink-0"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
          </svg>
        </button>
        {/* Desktop chips */}
        <div className="hidden sm:flex items-center gap-1 flex-wrap">
          {activeCategories.map(cat => {
            const cc = CATEGORY_COLORS[cat]
            const isActive = categoryFilter.has(cat)
            return (
              <button
                key={cat}
                onClick={() => onCategoryToggle(cat)}
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold border cursor-pointer whitespace-nowrap transition-all duration-150"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  backgroundColor: isActive ? cc.bg : 'transparent',
                  color: isActive ? cc.color : 'var(--ec-t3)',
                  borderColor: isActive ? cc.border : 'transparent',
                  opacity: isActive ? 1 : 0.7,
                }}
              >
                {CATEGORY_LABELS[cat] || cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* Mobile category popover */}
      {catPopoverOpen && (
        <div className="sm:hidden flex flex-wrap gap-1 py-1 border-t border-ec-div mt-1 pt-2">
          {activeCategories.map(cat => {
            const cc = CATEGORY_COLORS[cat]
            const isActive = categoryFilter.has(cat)
            return (
              <button
                key={cat}
                onClick={() => onCategoryToggle(cat)}
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold border cursor-pointer whitespace-nowrap"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  backgroundColor: isActive ? cc.bg : 'transparent',
                  color: isActive ? cc.color : 'var(--ec-t3)',
                  borderColor: isActive ? cc.border : 'transparent',
                }}
              >
                {CATEGORY_LABELS[cat] || cat}
              </button>
            )
          })}
        </div>
      )}

      {/* Right side: view toggle + assign */}
      <div className="flex items-center gap-1.5 shrink-0 ml-auto">
        <div className="flex rounded-lg border border-ec-div overflow-hidden">
          <button
            onClick={() => onViewChange('tiles')}
            className="px-2 py-1 border-none cursor-pointer flex items-center transition-colors duration-150"
            style={{
              backgroundColor: view === 'tiles' ? 'var(--ec-em)' : 'transparent',
              color: view === 'tiles' ? 'white' : 'var(--ec-t3)',
            }}
            title="Tile view"
          >
            <TileIcon />
          </button>
          <button
            onClick={() => onViewChange('board')}
            className="px-2 py-1 border-none cursor-pointer flex items-center transition-colors duration-150"
            style={{
              backgroundColor: view === 'board' ? 'var(--ec-em)' : 'transparent',
              color: view === 'board' ? 'white' : 'var(--ec-t3)',
            }}
            title="Board view"
          >
            <BoardIcon />
          </button>
        </div>

        {isElevated && (
          <button
            onClick={onAssignClick}
            className="px-3 py-1 rounded-full text-[11px] font-semibold border-none cursor-pointer flex items-center gap-1 transition-all duration-150"
            style={{
              fontFamily: "'Inter', sans-serif",
              backgroundColor: 'var(--ec-em)',
              color: 'white',
              boxShadow: '0 2px 8px rgba(5,150,105,0.3)',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
            Assign
          </button>
        )}
      </div>
    </div>
  )
}
