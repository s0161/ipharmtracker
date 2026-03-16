import EventPill from './EventPill'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function dateKey(d) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function getWeekDays(weekStart) {
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    days.push(d)
  }
  return days
}

export default function WeekView({ events, weekStart, onEventClick }) {
  const days = getWeekDays(weekStart)
  const today = new Date()
  const todayKey = dateKey(today)

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
    <div className="grid grid-cols-7 gap-2">
      {days.map((day, i) => {
        const key = dateKey(day)
        const isToday = key === todayKey
        const dayEvents = eventsByDate[key] || []

        return (
          <div
            key={i}
            className={`rounded-lg border border-ec-div min-h-[200px] p-2
              ${isToday ? 'ring-2 ring-emerald-400/50' : ''}`}
            style={{ background: isToday ? 'rgba(16,185,129,0.04)' : 'var(--ec-card, #fff)' }}
          >
            <div className="text-center mb-2">
              <div className="text-[10px] text-ec-t3 uppercase font-semibold">{DAY_NAMES[i]}</div>
              <div className={`text-lg font-bold ${isToday ? 'text-emerald-600' : 'text-ec-t1'}`}>
                {day.getDate()}
              </div>
              <div className="text-[10px] text-ec-t3">
                {day.toLocaleDateString('en-GB', { month: 'short' })}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              {dayEvents.map(ev => (
                <EventPill key={ev.id} event={ev} onClick={(ev, e) => handlePillClick(ev, e)} size="lg" />
              ))}
              {dayEvents.length === 0 && (
                <div className="text-[10px] text-ec-t3 text-center py-4 italic">No events</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
