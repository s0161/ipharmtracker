import { useMemo } from 'react'

const START_H = 9, END_H = 18
const TOTAL_MIN = (END_H - START_H) * 60

function timeToMin(timeStr) {
  if (!timeStr || timeStr === '—') return null
  const [h, m] = timeStr.split(':').map(Number)
  return (h - START_H) * 60 + m
}

function minToTime(m) {
  const h = Math.floor(m / 60) + START_H
  const min = m % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

function formatDuration(mins) {
  const h = Math.floor(mins / 60)
  const m = Math.round(mins % 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function RPTimeline({ sessions, rpName }) {
  const now = new Date()
  const nowMin = (now.getHours() - START_H) * 60 + now.getMinutes()
  const inRange = nowMin >= 0 && nowMin <= TOTAL_MIN

  // Parse sessions into min ranges
  const ranges = useMemo(() => {
    if (!sessions?.length) return []
    return sessions
      .map(s => {
        const startMin = timeToMin(s.start)
        const endMin = s.end === 'ongoing' ? Math.max(0, Math.min(nowMin, TOTAL_MIN)) : timeToMin(s.end)
        if (startMin === null || endMin === null) return null
        return { start: Math.max(0, startMin), end: Math.min(TOTAL_MIN, endMin), name: s.name }
      })
      .filter(Boolean)
      .sort((a, b) => a.start - b.start)
  }, [sessions, nowMin])

  // Coverage stats
  const { covered, gapMin } = useMemo(() => {
    let cov = 0
    ranges.forEach(r => { cov += r.end - r.start })
    return { covered: cov, gapMin: Math.max(0, (inRange ? Math.min(nowMin, TOTAL_MIN) : TOTAL_MIN) - cov) }
  }, [ranges, nowMin, inRange])

  // Hour labels
  const hours = []
  for (let h = START_H; h <= END_H; h += 1) {
    hours.push(h)
  }

  return (
    <div
      className="ec-fadeup rounded-xl p-4 mt-4"
      style={{ backgroundColor: 'var(--ec-card)', border: '1px solid var(--ec-div)', animationDelay: '0.35s' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] font-bold text-ec-t3 uppercase tracking-[1px]">RP Timeline</div>
        <div className="text-[11px] text-ec-t3">
          <span className="text-ec-em font-semibold">{formatDuration(covered)}</span> covered
          {gapMin > 0 && <> · <span className="text-ec-warn font-semibold">{formatDuration(gapMin)}</span> gap</>}
        </div>
      </div>

      {/* Timeline track */}
      <div className="relative h-3 rounded-full bg-ec-div overflow-visible" role="img" aria-label={`RP presence timeline: ${formatDuration(covered)} covered today`}>
        {/* Session blocks */}
        {ranges.map((r, i) => (
          <div
            key={i}
            className="absolute top-0 h-full rounded-full"
            style={{
              left: `${(r.start / TOTAL_MIN) * 100}%`,
              width: `${((r.end - r.start) / TOTAL_MIN) * 100}%`,
              backgroundColor: 'rgba(16,185,129,0.6)',
              boxShadow: '0 0 6px rgba(16,185,129,0.2)',
            }}
          />
        ))}

        {/* Current time needle */}
        {inRange && (
          <div
            className="absolute top-[-2px] w-[2px] rounded-full"
            style={{
              left: `${(nowMin / TOTAL_MIN) * 100}%`,
              height: 'calc(100% + 4px)',
              backgroundColor: '#fff',
              boxShadow: '0 0 4px rgba(255,255,255,0.5)',
            }}
          />
        )}
      </div>

      {/* Hour labels */}
      <div className="relative mt-1.5 h-3">
        {hours.filter((_, i) => i % 3 === 0 || _ === END_H).map(h => (
          <span
            key={h}
            className="absolute text-[9px] text-ec-t4 tabular-nums -translate-x-1/2"
            style={{ left: `${((h - START_H) / (END_H - START_H)) * 100}%` }}
          >
            {h > 12 ? `${h - 12}pm` : h === 12 ? '12pm' : `${h}am`}
          </span>
        ))}
      </div>

      {/* RP name */}
      {rpName && (
        <div className="mt-2 text-[10px] text-ec-t4">
          RP: <span className="text-ec-t2 font-medium">{rpName}</span>
        </div>
      )}
    </div>
  )
}
