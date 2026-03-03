// Tiny SVG sparkline — no charting library needed
function sparkColor(value) {
  if (value >= 80) return 'var(--success)'
  if (value >= 50) return 'var(--warning)'
  return 'var(--danger)'
}

export default function Sparkline({ data, width = 60, height = 16 }) {
  if (!data || data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const padY = 2

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = padY + ((max - v) / range) * (height - padY * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  const lastX = width
  const lastY = padY + ((max - data[data.length - 1]) / range) * (height - padY * 2)
  const color = sparkColor(data[data.length - 1])

  return (
    <svg className="sparkline" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r="2" fill={color} />
    </svg>
  )
}
