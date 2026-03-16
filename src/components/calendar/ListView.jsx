import { useState, useMemo } from 'react'
import { PILL_STYLES } from './EventPill'

const CATEGORY_LABELS = {
  document: 'Document',
  training: 'Training',
  appraisal: 'Appraisal',
  temperature: 'Temperature',
  cleaning: 'Cleaning',
  patient_query: 'Patient Query',
  mhra: 'MHRA',
  cd_check: 'CD Check',
  near_miss: 'Near Miss',
  other: 'Other',
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
]

function dateKey(d) {
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export default function ListView({ events, onEventClick }) {
  const [filter, setFilter] = useState('all')

  const filtered = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfWeek = new Date(today)
    endOfWeek.setDate(endOfWeek.getDate() + (7 - today.getDay() || 7))
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const sixtyDaysOut = new Date(today)
    sixtyDaysOut.setDate(sixtyDaysOut.getDate() + 60)

    let list = events.filter(ev => ev.date <= sixtyDaysOut)

    if (filter === 'overdue') {
      list = list.filter(ev => ev.status === 'overdue')
    } else if (filter === 'week') {
      list = list.filter(ev => ev.date >= today && ev.date <= endOfWeek)
    } else if (filter === 'month') {
      list = list.filter(ev => ev.date >= today && ev.date <= endOfMonth)
    }

    return list
  }, [events, filter])

  // Group by date
  const groups = useMemo(() => {
    const map = new Map()
    for (const ev of filtered) {
      const key = dateKey(ev.date)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(ev)
    }
    return Array.from(map.entries())
  }, [filtered])

  function handleClick(ev, e) {
    const rect = e.currentTarget.getBoundingClientRect()
    onEventClick(ev, { top: rect.top, left: rect.left, height: rect.height })
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border-none cursor-pointer transition-colors
              ${filter === f.key
                ? 'bg-emerald-600 text-white'
                : 'bg-ec-card text-ec-t2 hover:bg-slate-100 border border-ec-div'}`}
          >
            {f.label}
            {f.key === 'overdue' && (() => {
              const count = events.filter(e => e.status === 'overdue').length
              return count > 0 ? ` (${count})` : ''
            })()}
          </button>
        ))}
      </div>

      {/* Event list */}
      {groups.length === 0 && (
        <div className="text-center py-12 text-ec-t3 text-sm">No events to show</div>
      )}

      {groups.map(([dateLabel, groupEvents]) => (
        <div key={dateLabel} className="mb-4">
          <div className="text-xs font-bold text-ec-t3 uppercase tracking-wide mb-2 px-1">
            {dateLabel}
          </div>
          <div className="flex flex-col gap-1.5">
            {groupEvents.map(ev => {
              const style = PILL_STYLES[ev.colour] || PILL_STYLES.grey
              return (
                <button
                  key={ev.id}
                  onClick={(e) => handleClick(ev, e)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-ec-div cursor-pointer text-left w-full transition-colors hover:shadow-sm"
                  style={{ background: 'var(--ec-card, #fff)' }}
                >
                  {/* Colour stripe */}
                  <div
                    className="w-1 self-stretch rounded-full shrink-0"
                    style={{ background: style.text }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-ec-t1 truncate">{ev.title}</div>
                    <div className="text-xs text-ec-t3 truncate mt-0.5">{ev.detail}</div>
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: style.bg, color: style.text }}
                  >
                    {CATEGORY_LABELS[ev.category] || ev.category}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
