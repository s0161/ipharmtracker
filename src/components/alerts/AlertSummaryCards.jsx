// ─── Alert Summary Cards ───
// Four severity cards in a row with counts and click-to-filter

const CARDS = [
  {
    key: 'CRITICAL',
    label: 'Critical',
    color: 'red',
    bg: 'bg-red-500/5',
    border: 'border-red-500/20',
    text: 'text-red-500',
    dot: true,
  },
  {
    key: 'HIGH',
    label: 'High',
    color: 'amber',
    bg: 'bg-amber-500/5',
    border: 'border-amber-500/20',
    text: 'text-amber-500',
  },
  {
    key: 'MEDIUM',
    label: 'Medium',
    color: 'yellow',
    bg: 'bg-yellow-400/5',
    border: 'border-yellow-400/20',
    text: 'text-yellow-500',
  },
  {
    key: 'LOW',
    label: 'Low',
    color: 'slate',
    bg: 'bg-slate-800/[0.03]',
    border: 'border-slate-500/20',
    text: 'text-slate-400',
  },
]

export default function AlertSummaryCards({ stats, activeSeverity, onSeverityClick }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      {CARDS.map(c => {
        const count = stats[c.key.toLowerCase()] || 0
        const isActive = activeSeverity === c.key
        return (
          <button
            key={c.key}
            onClick={() => onSeverityClick(isActive ? null : c.key)}
            className={`relative p-4 rounded-xl border cursor-pointer transition-all text-left bg-transparent
              ${c.bg} ${c.border}
              ${isActive ? 'ring-2 ring-emerald-500/30 shadow-md' : 'hover:shadow-sm'}`}
          >
            {/* Pulsing dot for CRITICAL */}
            {c.dot && count > 0 && (
              <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
            )}
            <div className={`text-2xl font-bold ${c.text} tabular-nums`}>{count}</div>
            <div className="text-[11px] font-semibold text-ec-t3 uppercase tracking-wider mt-1">{c.label}</div>
          </button>
        )
      })}
    </div>
  )
}
