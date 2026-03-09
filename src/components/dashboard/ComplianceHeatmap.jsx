import { useState, useMemo } from 'react'

function getCellColor(score) {
  if (score === null || score === undefined) return 'var(--ec-div)'
  if (score >= 90) return 'rgba(16,185,129,0.7)'
  if (score >= 80) return 'rgba(16,185,129,0.45)'
  if (score >= 60) return 'rgba(245,158,11,0.45)'
  if (score >= 40) return 'rgba(245,158,11,0.25)'
  return 'rgba(239,68,68,0.45)'
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function ComplianceHeatmap({ scoreHistory, todayScore }) {
  const [tooltip, setTooltip] = useState(null)

  // Build 30-day grid: oldest → newest (left-to-right, top-to-bottom)
  const cells = useMemo(() => {
    const today = new Date()
    const days = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const entry = scoreHistory.find(([k]) => k === key)
      let score = null
      if (i === 0 && todayScore !== undefined) {
        score = todayScore
      } else if (entry) {
        const v = entry[1]
        score = Math.round(((v.documents || 0) + (v.training || 0) + (v.cleaning || 0) + (v.safeguarding || 0)) / 4)
      }
      days.push({ date: key, score })
    }
    return days
  }, [scoreHistory, todayScore])

  return (
    <div className="ec-fadeup" style={{ animationDelay: '0.3s' }} aria-label="30-day compliance heatmap">
      <div className="text-[11px] font-bold text-ec-t3 uppercase tracking-[1px] mb-3">30-Day Compliance</div>
      <div className="overflow-x-auto">
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: 'repeat(6, 14px)', gridTemplateRows: 'repeat(5, 14px)' }}>
        {cells.map((cell, i) => (
          <div
            key={cell.date}
            className="rounded-[3px] cursor-default transition-all duration-150 hover:scale-110 hover:z-10"
            style={{
              width: 14,
              height: 14,
              backgroundColor: getCellColor(cell.score),
              border: i === cells.length - 1 ? '1px solid var(--ec-em)' : '1px solid transparent',
            }}
            onMouseEnter={(e) => setTooltip({ x: e.clientX, y: e.clientY, date: cell.date, score: cell.score })}
            onMouseMove={(e) => setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
      </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-2.5">
        <span className="text-[9px] text-ec-t4">Less</span>
        {['var(--ec-div)', 'rgba(239,68,68,0.45)', 'rgba(245,158,11,0.25)', 'rgba(245,158,11,0.45)', 'rgba(16,185,129,0.45)', 'rgba(16,185,129,0.7)'].map((c, i) => (
          <div key={i} className="w-[10px] h-[10px] rounded-[2px]" style={{ backgroundColor: c }} />
        ))}
        <span className="text-[9px] text-ec-t4">More</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 px-2.5 py-1.5 rounded-lg border border-ec-border text-[11px] pointer-events-none backdrop-blur-lg"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 30,
            backgroundColor: 'var(--ec-card-solid)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <span className="text-ec-t2 font-medium">{formatDate(tooltip.date)}</span>
          {tooltip.score !== null ? (
            <span className="text-ec-t3"> · <span className="font-semibold" style={{ color: getCellColor(tooltip.score) }}>{tooltip.score}%</span></span>
          ) : (
            <span className="text-ec-t4"> · No data</span>
          )}
        </div>
      )}
    </div>
  )
}
