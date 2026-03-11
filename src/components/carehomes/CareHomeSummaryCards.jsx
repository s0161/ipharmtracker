// ─── Care Home Summary Cards ───
// Four stat cards in a row: Active Homes, Active Cycles, Pending Deliveries, Open MAR Issues

const CARDS = [
  { key: 'activeHomes', label: 'Active Homes', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-600' },
  { key: 'activeCycles', label: 'Active Cycles', bg: 'bg-blue-500/5', border: 'border-blue-500/20', text: 'text-blue-600' },
  { key: 'pendingDeliveries', label: 'Pending Deliveries', bg: 'bg-amber-500/5', border: 'border-amber-500/20', text: 'text-amber-600' },
  { key: 'openMARIssues', label: 'Open MAR Issues', bg: 'bg-red-500/5', border: 'border-red-500/20', text: 'text-red-500' },
]

export default function CareHomeSummaryCards({ stats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      {CARDS.map(c => (
        <div
          key={c.key}
          className={`p-4 rounded-xl border ${c.bg} ${c.border}`}
        >
          <div className={`text-2xl font-bold ${c.text} tabular-nums`}>{stats[c.key] || 0}</div>
          <div className="text-[11px] font-semibold text-ec-t3 uppercase tracking-wider mt-1">{c.label}</div>
        </div>
      ))}
    </div>
  )
}
