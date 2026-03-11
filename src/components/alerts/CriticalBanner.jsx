import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── Critical Alert Banner ───
// Persistent but dismissible banner for CRITICAL alerts
// Shows across all pages, dismisses for session only

export default function CriticalBanner({ count }) {
  const [dismissed, setDismissed] = useState(false)
  const navigate = useNavigate()

  if (!count || count <= 0 || dismissed) return null

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-ec-crit text-white text-sm">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <span className="flex-1 font-medium">
        {count} critical alert{count !== 1 ? 's' : ''} require{count === 1 ? 's' : ''} immediate attention
      </span>
      <button
        onClick={() => navigate('/alerts')}
        className="px-3 py-1 rounded-lg text-xs font-semibold bg-white/20 text-white border-none cursor-pointer hover:bg-white/30 transition"
      >
        View Alerts
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="w-6 h-6 rounded-lg flex items-center justify-center bg-transparent text-white/70 border-none cursor-pointer hover:text-white hover:bg-white/10 transition"
        aria-label="Dismiss"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}
