import { useState } from 'react'
import EventPill from './EventPill'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MAX_PILLS = 2

function getMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  // Monday = 0, Sunday = 6
  let startDow = firstDay.getDay() - 1
  if (startDow < 0) startDow = 6

  const days = []
  // Previous month padding
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month, -i)
    days.push({ date: d, outside: true })
  }
  // Current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({ date: new Date(year, month, i), outside: false })
  }
  // Next month padding (fill to complete row)
  while (days.length % 7 !== 0) {
    const next = days.length - startDow - lastDay.getDate() + 1
    days.push({ date: new Date(year, month + 1, next), outside: true })
  }
  return days
}

function dateKey(d) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

export default function MonthView({ events, year, month, onEventClick }) {
  const [expandedDay, setExpandedDay] = useState(null)
  const days = getMonthGrid(year, month)
  const today = new Date()
  const todayKey = dateKey(today)

  // Group events by date
  const eventsByDate = {}
  for (const ev of events) {
    const key = dateKey(ev.date)
    if (!eventsByDate[key]) eventsByDate[key] = []
    eventsByDate[key].push(ev)
  }

  function handlePillClick(ev, e) {
    const rect = e.currentTarget.getBoundingClientRect()
    onEventClick(ev, { top: rect.top, left: rect.left, height: rect.height })
  }

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-[11px] font-semibold text-ec-t3 py-2 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 border border-ec-div rounded-lg overflow-hidden">
        {days.map((day, i) => {
          const key = dateKey(day.date)
          const isToday = key === todayKey
          const dayEvents = eventsByDate[key] || []
          const isExpanded = expandedDay === key
          const showAll = isExpanded || dayEvents.length <= MAX_PILLS + 1
          const visibleEvents = showAll ? dayEvents : dayEvents.slice(0, MAX_PILLS)
          const moreCount = dayEvents.length - MAX_PILLS

          return (
            <div
              key={i}
              className={`min-h-[90px] p-1.5 border-b border-r border-ec-div relative
                ${day.outside ? 'opacity-40' : ''}
                ${isToday ? 'ring-2 ring-inset ring-emerald-400/50' : ''}`}
              style={{ background: isToday ? 'rgba(16,185,129,0.04)' : 'var(--ec-card, #fff)' }}
            >
              <div className={`text-[11px] mb-1 font-medium ${isToday ? 'text-emerald-600 font-bold' : 'text-ec-t2'}`}>
                {day.date.getDate()}
              </div>
              <div className="flex flex-col gap-0.5">
                {visibleEvents.map(ev => (
                  <EventPill key={ev.id} event={ev} onClick={(ev, e) => handlePillClick(ev, e)} />
                ))}
                {!showAll && moreCount > 0 && (
                  <button
                    onClick={() => setExpandedDay(key)}
                    className="border-none cursor-pointer text-[10px] font-semibold py-0.5 px-1 rounded text-ec-t3 bg-transparent hover:bg-slate-100 text-left"
                  >
                    +{moreCount} more
                  </button>
                )}
                {isExpanded && dayEvents.length > MAX_PILLS + 1 && (
                  <button
                    onClick={() => setExpandedDay(null)}
                    className="border-none cursor-pointer text-[10px] font-semibold py-0.5 px-1 rounded text-ec-t3 bg-transparent hover:bg-slate-100 text-left"
                  >
                    Show less
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
