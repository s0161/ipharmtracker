import SOPCard from './SOPCard'
import EmptyState from '../EmptyState'

const CATEGORIES = ['All', 'Dispensing', 'Clinical', 'Governance', 'HR & Training', 'Facilities', 'CD & Controlled Drugs']

export default function SOPGrid({ sops, myAckedIds, onView, onAcknowledge, searchQuery, setSearchQuery, activeCategory, setActiveCategory }) {
  const q = searchQuery.toLowerCase()
  const filtered = sops.filter(sop => {
    if (activeCategory !== 'All' && sop.category !== activeCategory) return false
    if (q && !sop.title.toLowerCase().includes(q) && !sop.code.toLowerCase().includes(q) && !sop.category.toLowerCase().includes(q)) return false
    return true
  })

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ec-t3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search SOPs..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-ec-border bg-ec-card text-sm text-ec-t1 placeholder:text-ec-t3 focus:outline-none focus:border-emerald-500/50 transition-colors"
        />
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`text-[11px] font-medium px-3 py-1.5 rounded-lg border transition-colors
              ${activeCategory === cat
                ? 'border-emerald-500/40 text-white'
                : 'border-ec-border text-ec-t2 bg-ec-card hover:bg-ec-card-hover'
              }`}
            style={activeCategory === cat ? { backgroundColor: 'var(--ec-em)' } : undefined}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No SOPs found"
          description={searchQuery ? 'Try a different search term or category' : 'No SOPs have been added yet'}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(sop => (
            <SOPCard
              key={sop.id}
              sop={sop}
              acknowledged={myAckedIds.has(sop.id)}
              onView={onView}
              onAcknowledge={onAcknowledge}
            />
          ))}
        </div>
      )}
    </div>
  )
}
