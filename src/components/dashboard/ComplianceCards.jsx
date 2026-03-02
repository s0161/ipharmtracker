import { useNavigate } from 'react-router-dom'

function cardTier(score) {
  if (score < 25) return 'critical'
  if (score <= 70) return 'warning'
  return 'healthy'
}

function scoreColor(score) {
  if (score < 25) return 'var(--danger)'
  if (score <= 70) return 'var(--warning)'
  return 'var(--success)'
}

export default function ComplianceCards({ areas }) {
  const navigate = useNavigate()

  return (
    <div className="compliance-cards">
      {areas.map(area => {
        const tier = cardTier(area.score)
        return (
          <button
            key={area.label}
            className={`compliance-card compliance-card--${tier}`}
            onClick={() => navigate(area.nav)}
          >
            <div className="compliance-card-top">
              <span className="compliance-card-label">{area.label}</span>
              {area.trend && (
                <span className={`compliance-card-trend compliance-card-trend--${area.trend.direction}`}>
                  {area.trend.direction === 'up' ? '\u2191' : '\u2193'} {Math.abs(area.trend.value)}%
                </span>
              )}
            </div>
            <span className="compliance-card-score" style={{ color: scoreColor(area.score) }}>
              {area.score}%
            </span>
            <span className="compliance-card-subtitle">{area.subtitle}</span>
            <div className="compliance-card-bar">
              <div
                className="compliance-card-bar-fill"
                style={{ width: `${area.score}%`, background: scoreColor(area.score) }}
              />
            </div>
          </button>
        )
      })}
    </div>
  )
}
