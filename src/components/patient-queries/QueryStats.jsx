const STAT_CARDS = [
  { key: 'urgent', label: 'Urgent', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  { key: 'open', label: 'Open', color: '#0073e6', bg: '#eff6ff', border: '#bfdbfe' },
  { key: 'awaiting', label: 'Awaiting Response', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  { key: 'resolvedToday', label: 'Resolved Today', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
]

export default function QueryStats({ stats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      {STAT_CARDS.map(card => (
        <div
          key={card.key}
          className="rounded-xl p-4 border transition-all"
          style={{
            background: 'var(--ec-card-solid, #fff)',
            borderColor: card.border,
            borderTop: `3px solid ${card.color}`,
            boxShadow: '0 1px 3px rgba(10,37,64,0.06)',
          }}
        >
          <div className="text-2xl font-extrabold" style={{ color: card.color }}>
            {stats[card.key] || 0}
          </div>
          <div className="text-[11px] font-medium text-ec-t3 mt-1">{card.label}</div>
        </div>
      ))}
    </div>
  )
}
