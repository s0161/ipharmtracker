// ─── Cycles Tab ───
// Medication cycle pipeline: list view with status advancement

import { useState, useMemo } from 'react'
import { CYCLE_STATUSES, CYCLE_STATUS_STYLES, PATIENT_ITEM_STATUS_STYLES } from '../../data/careHomeData'

export default function CyclesTab({ home, cycles, itemsByCycle, patients, isElevated, user, onAddCycle, onUpdateCycleStatus, onAddCycleItems, onUpdateCycleItem }) {
  const [expandedCycle, setExpandedCycle] = useState(null)
  const [adding, setAdding] = useState(false)

  const currentMonth = new Date().toISOString().slice(0, 7)

  const handleStartCycle = async () => {
    const activePatients = (patients || []).filter(p => p.isActive !== false && p.is_active !== false)
    const id = await onAddCycle({
      careHomeId: home.id,
      cycleMonth: currentMonth,
      patientCount: activePatients.length,
      itemsCount: activePatients.reduce((s, p) => s + (p.medicationCount || p.medication_count || 0), 0),
    })
    if (id) {
      await onAddCycleItems(id, activePatients)
    }
    setAdding(false)
  }

  const getNextStatus = (current) => {
    const idx = CYCLE_STATUSES.indexOf(current)
    return idx >= 0 && idx < CYCLE_STATUSES.length - 1 ? CYCLE_STATUSES[idx + 1] : null
  }

  const handleAdvance = async (cycle) => {
    const next = getNextStatus(cycle.status)
    if (!next) return
    const extra = {}
    if (next === 'Checking' || next === 'Ready') extra.checkedBy = user?.name
    await onUpdateCycleStatus(cycle.id, next, extra)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ec-t1">Medication Cycles</h3>
        {isElevated && (
          <button onClick={handleStartCycle}
            className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg border-none cursor-pointer hover:bg-emerald-700 shadow-sm">
            Start New Cycle
          </button>
        )}
      </div>

      {(!cycles || cycles.length === 0) ? (
        <p className="text-sm text-ec-t3 p-4 bg-ec-card border border-ec-div rounded-xl">No cycles yet</p>
      ) : (
        <div className="space-y-3">
          {cycles.map(cycle => {
            const style = CYCLE_STATUS_STYLES[cycle.status] || CYCLE_STATUS_STYLES.Pending
            const items = itemsByCycle[cycle.id] || []
            const isExpanded = expandedCycle === cycle.id
            const next = getNextStatus(cycle.status)
            const dispensedCount = items.filter(i => i.status !== 'Pending').length
            const totalItems = items.length
            const progress = totalItems > 0 ? Math.round((dispensedCount / totalItems) * 100) : 0

            return (
              <div key={cycle.id} className="bg-ec-card border border-ec-div rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedCycle(isExpanded ? null : cycle.id)}
                  className="w-full text-left p-4 cursor-pointer bg-transparent border-none flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-ec-t1">{cycle.cycleMonth || cycle.cycle_month}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                      {cycle.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-ec-t3">
                    <span>{cycle.patientCount || cycle.patient_count || 0} patients</span>
                    <span className="text-ec-t3">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </button>

                {/* Progress bar */}
                {totalItems > 0 && (
                  <div className="px-4 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-ec-div rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-[10px] text-ec-t3 tabular-nums">{progress}%</span>
                    </div>
                  </div>
                )}

                {isExpanded && (
                  <div className="border-t border-ec-div p-4">
                    {/* Advance button */}
                    {isElevated && next && (
                      <div className="mb-3">
                        <button onClick={() => handleAdvance(cycle)}
                          className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg border-none cursor-pointer hover:bg-emerald-700 shadow-sm">
                          Advance to {next}
                        </button>
                      </div>
                    )}

                    {/* Patient items */}
                    {items.length === 0 ? (
                      <p className="text-xs text-ec-t3">No patient items</p>
                    ) : (
                      <div className="space-y-2">
                        {items.map(item => {
                          const patient = (patients || []).find(p => p.id === (item.patientId || item.patient_id))
                          const itemStyle = PATIENT_ITEM_STATUS_STYLES[item.status] || PATIENT_ITEM_STATUS_STYLES.Pending
                          return (
                            <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-ec-bg">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-ec-t1">{patient?.patientName || patient?.patient_name || 'Unknown'}</span>
                                <span className="text-xs text-ec-t3">{item.itemCount || item.item_count || 0} items</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${itemStyle.bg} ${itemStyle.text}`}>
                                  {item.status}
                                </span>
                                {isElevated && item.status === 'Pending' && (
                                  <button onClick={() => onUpdateCycleItem(item.id, { status: 'Dispensed', dispensedBy: user?.name })}
                                    className="text-xs text-emerald-600 hover:text-emerald-700 cursor-pointer bg-transparent border-none font-medium">
                                    Dispense
                                  </button>
                                )}
                                {isElevated && item.status === 'Dispensed' && (
                                  <button onClick={() => onUpdateCycleItem(item.id, { status: 'Checked', checkedBy: user?.name })}
                                    className="text-xs text-emerald-600 hover:text-emerald-700 cursor-pointer bg-transparent border-none font-medium">
                                    Check
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {cycle.notes && (
                      <p className="text-xs text-ec-t3 mt-3 pt-2 border-t border-ec-div">{cycle.notes}</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
