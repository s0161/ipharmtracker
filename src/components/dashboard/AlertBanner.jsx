import { useNavigate } from 'react-router-dom'

export default function AlertBanner({ alerts }) {
  const navigate = useNavigate()
  if (!alerts || alerts.length === 0) return null

  return (
    <div className="alert-banner">
      {alerts.map((alert, i) => (
        <div key={i} className="alert-banner-item">
          <div className="alert-banner-left">
            <span className="alert-banner-dot" />
            <span className="alert-banner-msg">
              <strong>{alert.label}</strong> is at <strong>{alert.score}%</strong> — {alert.subtitle}
            </span>
          </div>
          <button className="alert-banner-action" onClick={() => navigate(alert.nav)}>
            Review {alert.label} &rarr;
          </button>
        </div>
      ))}
    </div>
  )
}
