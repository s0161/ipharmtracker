import { useState, useEffect } from 'react'

function scoreColor(pct) {
  if (pct > 80) return 'var(--success)'
  if (pct >= 50) return 'var(--warning)'
  return 'var(--danger)'
}

// SVG Progress Ring
export default function ProgressRing({ pct, size = 56, strokeWidth = 5 }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const [offset, setOffset] = useState(circumference)

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (pct / 100) * circumference)
    }, 100)
    return () => clearTimeout(timer)
  }, [pct, circumference])

  return (
    <svg className="progress-ring" width={size} height={size}>
      <circle className="progress-ring-bg" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} fill="none" stroke="var(--border)" />
      <circle className="progress-ring-fill" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} fill="none" stroke={scoreColor(pct)} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" className="progress-ring-text" fill={scoreColor(pct)}>{pct}%</text>
    </svg>
  )
}
