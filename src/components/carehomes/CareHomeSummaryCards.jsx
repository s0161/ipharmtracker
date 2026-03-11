// ─── Care Home Summary Cards ───
// Four stat cards in a row: Active Homes, Active Cycles, Pending Deliveries, Open MAR Issues

const CARDS = [
  { key: 'activeHomes', label: 'Active Homes', bg: 'bg-ec-em/5', border: 'border-ec-em/20', text: 'text-ec-em' },
  { key: 'activeCycles', label: 'Active Cycles', bg: 'bg-ec-info/5', border: 'border-ec-info/20', text: 'text-ec-info' },
  { key: 'pendingDeliveries', label: 'Pending Deliveries', bg: 'bg-ec-warn/5', border: 'border-ec-warn/20', text: 'text-ec-warn' },
  { key: 'openMARIssues', label: 'Open MAR Issues', bg: 'bg-ec-crit/5', border: 'border-ec-crit/20', text: 'text-ec-crit' },
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
