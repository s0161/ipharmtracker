import { useNavigate } from 'react-router-dom'

const WarningTri = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 1.5L1 14h14L8 1.5z" stroke="#ef4444" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M8 6v3.5M8 11.5v.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export default function AlertBanner({ alerts }) {
  const navigate = useNavigate()
  if (!alerts || alerts.length === 0) return null

  return (
    <>
      {alerts.map((alert, i) => (
        <div
          key={i}
          className="ec-fadeup rounded-xl px-5 py-3.5 mt-5 flex items-center justify-between flex-wrap gap-2"
          style={{
            backgroundColor: 'rgba(239,68,68,0.04)',
            border: '1px solid rgba(239,68,68,0.08)',
            boxShadow: 'inset 0 1px 0 rgba(239,68,68,0.06)',
            animationDelay: '0.35s',
          }}
        >
          <div className="flex items-center gap-2">
            <WarningTri />
            <span className="text-[13px] font-semibold text-ec-crit-light">Attention:</span>
            <span className="text-[13px] text-ec-t2">
              {alert.label} at {alert.score}% — {alert.subtitle}
            </span>
          </div>
          <button
            onClick={() => navigate(alert.nav)}
            className="text-xs font-semibold text-ec-crit cursor-pointer px-3 py-1 rounded-md
              bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.12)]
              hover:bg-[rgba(239,68,68,0.15)] transition-all duration-150"
          >
            Review {alert.label} →
          </button>
        </div>
      ))}
    </>
  )
}
