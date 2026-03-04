import { useState, useEffect } from 'react'

export default function DailyProgressBar({ done, total }) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300)
    return () => clearTimeout(t)
  }, [])

  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const allDone = done === total && total > 0
  const color = allDone ? '#10b981' : pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div
      className="flex items-center gap-3 min-w-[180px] max-w-[320px] flex-1"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Daily tasks: ${done} of ${total} complete`}
    >
      <div className="flex-1 relative">
        {/* Track */}
        <div className="h-[6px] rounded-full bg-ec-div overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: animated ? `${pct}%` : '0%',
              backgroundColor: color,
              transition: 'all 700ms cubic-bezier(0.34,1.56,0.64,1)',
              boxShadow: allDone ? `0 0 8px ${color}55` : 'none',
            }}
          />
        </div>
      </div>
      <span
        className="text-[11px] font-semibold tabular-nums whitespace-nowrap transition-colors duration-300"
        style={{ color: allDone ? '#10b981' : 'var(--ec-t3)' }}
      >
        {done}/{total}
      </span>
    </div>
  )
}
