import { useState, useMemo } from 'react'
import { useComplianceCalendar } from '../hooks/useComplianceCalendar'
import MonthView from '../components/calendar/MonthView'
import WeekView from '../components/calendar/WeekView'
import ListView from '../components/calendar/ListView'
import EventPopover from '../components/calendar/EventPopover'

const VIEWS = [
  { key: 'month', label: 'Month' },
  { key: 'week', label: 'Week' },
  { key: 'list', label: 'List' },
]

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function getMondayOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export default function CalendarPage() {
  const now = new Date()
  const { events, loading } = useComplianceCalendar()
  const [view, setView] = useState('month')
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [weekStart, setWeekStart] = useState(() => getMondayOfWeek(now))
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [popoverAnchor, setPopoverAnchor] = useState(null)

  // Filter events for current view range
  const viewEvents = useMemo(() => {
    if (view === 'list') return events

    if (view === 'month') {
      const start = new Date(year, month, 1)
      const end = new Date(year, month + 1, 0)
      // Include padding days
      start.setDate(start.getDate() - 7)
      end.setDate(end.getDate() + 7)
      return events.filter(ev => ev.date >= start && ev.date <= end)
    }

    if (view === 'week') {
      const end = new Date(weekStart)
      end.setDate(end.getDate() + 7)
      return events.filter(ev => ev.date >= weekStart && ev.date < end)
    }

    return events
  }, [events, view, year, month, weekStart])

  function navPrev() {
    if (view === 'month') {
      if (month === 0) { setMonth(11); setYear(y => y - 1) }
      else setMonth(m => m - 1)
    } else if (view === 'week') {
      setWeekStart(ws => {
        const d = new Date(ws)
        d.setDate(d.getDate() - 7)
        return d
      })
    }
  }

  function navNext() {
    if (view === 'month') {
      if (month === 11) { setMonth(0); setYear(y => y + 1) }
      else setMonth(m => m + 1)
    } else if (view === 'week') {
      setWeekStart(ws => {
        const d = new Date(ws)
        d.setDate(d.getDate() + 7)
        return d
      })
    }
  }

  function goToday() {
    const n = new Date()
    setYear(n.getFullYear())
    setMonth(n.getMonth())
    setWeekStart(getMondayOfWeek(n))
  }

  function handleEventClick(ev, anchorPos) {
    setSelectedEvent(ev)
    setPopoverAnchor(anchorPos || null)
  }

  function getNavLabel() {
    if (view === 'month') return `${MONTH_NAMES[month]} ${year}`
    if (view === 'week') {
      const end = new Date(weekStart)
      end.setDate(end.getDate() + 6)
      const fmt = { day: 'numeric', month: 'short' }
      return `${weekStart.toLocaleDateString('en-GB', fmt)} — ${end.toLocaleDateString('en-GB', { ...fmt, year: 'numeric' })}`
    }
    return 'Upcoming Events'
  }

  // Stats
  const overdueCount = events.filter(e => e.status === 'overdue').length
  const dueSoonCount = events.filter(e => e.status === 'due_soon' || e.status === 'due_today').length

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 ec-fadeup">
      {/* Header */}
      <div className="page-header-panel mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-bold text-ec-t1 m-0">Compliance Calendar</h1>
            <p className="text-xs text-ec-t3 m-0 mt-1">
              {loading ? 'Loading events...' : (
                <>
                  {events.length} events
                  {overdueCount > 0 && <span className="text-red-600 font-semibold ml-2">{overdueCount} overdue</span>}
                  {dueSoonCount > 0 && <span className="text-amber-600 font-semibold ml-2">{dueSoonCount} due soon</span>}
                </>
              )}
            </p>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-ec-card rounded-lg border border-ec-div p-0.5">
            {VIEWS.map(v => (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold border-none cursor-pointer transition-colors
                  ${view === v.key
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-transparent text-ec-t2 hover:bg-slate-50'}`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      {view !== 'list' && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={navPrev}
              className="w-8 h-8 rounded-lg border border-ec-div bg-ec-card text-ec-t1 cursor-pointer flex items-center justify-center hover:bg-slate-50 transition-colors text-sm font-bold"
            >
              &lsaquo;
            </button>
            <h2 className="text-base font-bold text-ec-t1 m-0 min-w-[200px] text-center">
              {getNavLabel()}
            </h2>
            <button
              onClick={navNext}
              className="w-8 h-8 rounded-lg border border-ec-div bg-ec-card text-ec-t1 cursor-pointer flex items-center justify-center hover:bg-slate-50 transition-colors text-sm font-bold"
            >
              &rsaquo;
            </button>
          </div>
          <button
            onClick={goToday}
            className="px-3 py-1.5 rounded-lg border border-ec-div bg-ec-card text-xs font-semibold text-ec-t2 cursor-pointer hover:bg-slate-50 transition-colors"
          >
            Today
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Calendar views */}
      {!loading && view === 'month' && (
        <MonthView events={viewEvents} year={year} month={month} onEventClick={handleEventClick} />
      )}
      {!loading && view === 'week' && (
        <WeekView events={viewEvents} weekStart={weekStart} onEventClick={handleEventClick} />
      )}
      {!loading && view === 'list' && (
        <ListView events={viewEvents} onEventClick={handleEventClick} />
      )}

      {/* Event popover */}
      {selectedEvent && (
        <EventPopover
          event={selectedEvent}
          onClose={() => { setSelectedEvent(null); setPopoverAnchor(null) }}
          anchorPos={popoverAnchor}
        />
      )}
    </div>
  )
}
