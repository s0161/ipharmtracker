export default function InspectionView({ sops, acksBySopId, staffNames }) {
  const totalStaff = staffNames.length
  const totalAcks = Object.values(acksBySopId).reduce((sum, arr) => sum + arr.length, 0)

  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const overdueCount = sops.filter(sop => sop.reviewDate && new Date(sop.reviewDate + 'T00:00:00') < now).length

  const totalPossible = sops.length * totalStaff
  const coveragePct = totalPossible > 0 ? Math.round((totalAcks / totalPossible) * 100) : 0

  const stats = [
    { label: 'Total SOPs', value: sops.length },
    { label: 'Total Acks', value: totalAcks },
    { label: 'Overdue Reviews', value: overdueCount },
    { label: 'Coverage', value: `${coveragePct}%` },
  ]

  return (
    <div>
      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {stats.map(s => (
          <div key={s.label} className="bg-ec-card border border-ec-border rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-ec-t1">{s.value}</div>
            <div className="text-[11px] text-ec-t3 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-ec-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-ec-border bg-ec-card-hover">
              <th className="text-left py-2.5 px-3 font-semibold text-ec-t2">SOP ID</th>
              <th className="text-left py-2.5 px-3 font-semibold text-ec-t2">Title</th>
              <th className="text-left py-2.5 px-3 font-semibold text-ec-t2">Review Due</th>
              <th className="text-center py-2.5 px-3 font-semibold text-ec-t2">Acknowledged</th>
              <th className="text-center py-2.5 px-3 font-semibold text-ec-t2">Pending</th>
              <th className="text-center py-2.5 px-3 font-semibold text-ec-t2">Coverage</th>
            </tr>
          </thead>
          <tbody>
            {sops.map(sop => {
              const acks = acksBySopId[sop.id] || []
              const acked = acks.length
              const pending = totalStaff - acked
              const pct = totalStaff > 0 ? Math.round((acked / totalStaff) * 100) : 0
              const isOverdue = sop.reviewDate && new Date(sop.reviewDate + 'T00:00:00') < now

              return (
                <tr key={sop.id} className="border-b border-ec-border last:border-0 hover:bg-ec-card-hover transition-colors">
                  <td className="py-2.5 px-3 font-mono font-semibold" style={{ color: 'var(--ec-em)' }}>{sop.code}</td>
                  <td className="py-2.5 px-3 text-ec-t1 font-medium">{sop.title}</td>
                  <td className="py-2.5 px-3">
                    <span className={isOverdue ? 'text-red-600 font-semibold' : 'text-ec-t2'}>
                      {sop.reviewDate}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center text-emerald-600 font-semibold">{acked}</td>
                  <td className="py-2.5 px-3 text-center text-ec-t3">{pending}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`font-semibold ${pct === 100 ? 'text-emerald-600' : pct > 50 ? 'text-amber-600' : 'text-red-600'}`}>
                      {pct}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
