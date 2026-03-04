export default function TemperatureChart({ readings, minRange = 2, maxRange = 8 }) {
  // readings: [{ date, temperature }] sorted by date ascending
  if (!readings || readings.length < 2) return null

  const W = 600, H = 180, PAD = { t: 20, r: 20, b: 30, l: 40 }
  const plotW = W - PAD.l - PAD.r
  const plotH = H - PAD.t - PAD.b

  const temps = readings.map(r => r.temperature)
  const yMin = Math.min(0, Math.min(...temps) - 1)
  const yMax = Math.max(maxRange + 2, Math.max(...temps) + 1)

  const toX = (i) => PAD.l + (i / (readings.length - 1)) * plotW
  const toY = (t) => PAD.t + plotH - ((t - yMin) / (yMax - yMin)) * plotH

  const points = readings.map((r, i) => `${toX(i)},${toY(r.temperature)}`)

  const bandTop = toY(maxRange)
  const bandBot = toY(minRange)

  return (
    <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: 'var(--ec-card)', border: '1px solid var(--ec-border)' }}>
      <h3 className="text-sm font-bold text-ec-t1 mb-3">14-Day Temperature Trend</h3>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 180 }}>
        {/* Safe range band */}
        <rect x={PAD.l} y={bandTop} width={plotW} height={bandBot - bandTop}
          fill="rgba(16,185,129,0.06)" />

        {/* Range limit lines (dashed) */}
        <line x1={PAD.l} y1={toY(minRange)} x2={W - PAD.r} y2={toY(minRange)}
          stroke="rgba(16,185,129,0.3)" strokeDasharray="4,4" strokeWidth="1" />
        <line x1={PAD.l} y1={toY(maxRange)} x2={W - PAD.r} y2={toY(maxRange)}
          stroke="rgba(16,185,129,0.3)" strokeDasharray="4,4" strokeWidth="1" />

        {/* Range labels */}
        <text x={PAD.l - 5} y={toY(minRange) + 4} textAnchor="end" fill="rgba(16,185,129,0.5)" fontSize="10">{minRange}°</text>
        <text x={PAD.l - 5} y={toY(maxRange) + 4} textAnchor="end" fill="rgba(16,185,129,0.5)" fontSize="10">{maxRange}°</text>

        {/* Temperature line */}
        <polyline points={points.join(' ')} fill="none" stroke="#10b981" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" />

        {/* Data point dots */}
        {readings.map((r, i) => {
          const inRange = r.temperature >= minRange && r.temperature <= maxRange
          return (
            <circle key={i} cx={toX(i)} cy={toY(r.temperature)} r="3.5"
              fill={inRange ? '#10b981' : '#ef4444'}
              stroke={inRange ? '#059669' : '#dc2626'} strokeWidth="1.5" />
          )
        })}

        {/* Date labels (first and last) */}
        <text x={PAD.l} y={H - 5} textAnchor="start" fill="var(--ec-t4)" fontSize="10">
          {readings[0].date}
        </text>
        <text x={W - PAD.r} y={H - 5} textAnchor="end" fill="var(--ec-t4)" fontSize="10">
          {readings[readings.length - 1].date}
        </text>
      </svg>
    </div>
  )
}
