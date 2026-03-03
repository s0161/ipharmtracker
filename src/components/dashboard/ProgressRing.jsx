import { useState, useEffect } from 'react'

export default function ProgressRing({ pct, size = 52, sw = 4, delay = 0 }) {
  const r = (size - sw) / 2
  const ci = 2 * Math.PI * r
  const off = ci - (pct / 100) * ci
  const col = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'
  const [counting, setCounting] = useState(0)

  useEffect(() => {
    let frame = 0
    const total = Math.max(1, Math.round(pct))
    const step = 800 / total
    const t = setTimeout(() => {
      const id = setInterval(() => {
        frame++
        setCounting(frame)
        if (frame >= total) clearInterval(id)
      }, step)
    }, delay + 300)
    return () => clearTimeout(t)
  }, [pct, delay])

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={sw}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={col} strokeWidth={sw}
          strokeDasharray={ci} strokeDashoffset={ci}
          strokeLinecap="round"
          className="ec-ring-anim"
          style={{ '--ec-circ': ci, '--ec-off': off, animationDelay: `${delay}ms` }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-extrabold text-ec-t1"
        style={{ fontSize: size < 40 ? 9 : size < 48 ? 11 : 13, letterSpacing: -0.5 }}
      >
        {counting}%
      </span>
    </div>
  )
}
