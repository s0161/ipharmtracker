export default function Sparkline({ data, color, w = 80, h = 22, delay = 0 }) {
  if (!data || data.length < 2) return null
  const mn = Math.min(...data)
  const mx = Math.max(...data)
  const rng = mx - mn || 1
  const pts = data.map((v, i) =>
    `${(i / (data.length - 1)) * w},${h - ((v - mn) / rng) * (h - 4) + 2}`
  ).join(' ')

  return (
    <svg width={w} height={h} className="block mt-2" style={{ overflow: 'visible' }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="100"
        strokeDashoffset="100"
        className="ec-draw"
        style={{ animationDelay: `${delay}ms` }}
      />
    </svg>
  )
}
