// ─── Care Home Card ───
// List card for each home: name, address, stats, status badge

import { HOME_STATUS_STYLES, CYCLE_STATUS_STYLES } from '../../data/careHomeData'

export default function CareHomeCard({ home, patients, latestCycle, issueCount, onClick }) {
  const statusStyle = HOME_STATUS_STYLES[home.status] || HOME_STATUS_STYLES.Active
  const patientCount = (patients || []).length
  const cycleStatus = latestCycle ? (latestCycle.status || latestCycle.cycleStatus) : null
  const cycleStyle = cycleStatus ? CYCLE_STATUS_STYLES[cycleStatus] : null

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 bg-ec-card border border-ec-div rounded-xl hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-ec-t1 truncate">{home.name}</h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${statusStyle.bg} ${statusStyle.text}`}>
          {home.status || 'Active'}
        </span>
      </div>

      {home.address && (
        <p className="text-xs text-ec-t3 mb-2 truncate">{home.address}</p>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ec-t2 mb-2">
        <span>{patientCount} patient{patientCount !== 1 ? 's' : ''}</span>
        <span>Cycle day {home.cycleDay || home.cycle_day || '—'}</span>
        <span>{home.deliveryMethod || home.delivery_method || 'Delivery'}</span>
      </div>

      <div className="flex items-center gap-2">
        {cycleStyle && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cycleStyle.bg} ${cycleStyle.text}`}>
            {cycleStatus}
          </span>
        )}
        {issueCount > 0 && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-ec-crit-faint text-ec-crit">
            {issueCount} issue{issueCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </button>
  )
}
