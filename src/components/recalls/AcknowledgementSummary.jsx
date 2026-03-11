export default function AcknowledgementSummary({ stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
      <StatCard label="Total Alerts" value={stats.total} icon="list" color="emerald" />
      <StatCard label="Reviewed" value={stats.reviewed} icon="check" color="blue" />
      <StatCard label="Unreviewed" value={stats.unreviewed} icon="clock" color="amber" />
      <StatCard label="Flagged" value={stats.flagged} icon="flag" color="red" />
    </div>
  )
}

function StatCard({ label, value, icon, color }) {
  const colors = {
    emerald: { bg: 'bg-ec-em/10', text: 'text-ec-em' },
    blue:    { bg: 'bg-ec-info/10',    text: 'text-ec-info' },
    amber:   { bg: 'bg-ec-warn/10',   text: 'text-ec-warn' },
    red:     { bg: 'bg-ec-crit/10',     text: 'text-ec-crit' },
  }
  const c = colors[color] || colors.emerald

  const icons = {
    list: <><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></>,
    check: <><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>,
    clock: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
    flag: <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></>,
  }

  return (
    <div className="bg-ec-card border border-ec-border rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 ${c.text}`}>
            {icons[icon]}
          </svg>
        </div>
        <div>
          <div className="text-xs text-ec-t3 font-medium">{label}</div>
          <div className="text-xl font-bold text-ec-t1 mt-0.5">{value}</div>
        </div>
      </div>
    </div>
  )
}
