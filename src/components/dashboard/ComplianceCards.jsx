import { useNavigate } from 'react-router-dom'
import ProgressRing from './ProgressRing'
import Sparkline from './Sparkline'

function cardTier(score) {
  if (score < 25) return 'critical'
  if (score <= 70) return 'warning'
  return 'healthy'
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
            data-score={area.score}
            onClick={() => navigate(area.nav)}
          >
            <div className="compliance-card-body">
              <ProgressRing pct={area.score} size={48} strokeWidth={4} />
              <div className="compliance-card-info">
                <div className="compliance-card-top">
                  <span className="compliance-card-label">{area.label}</span>
                  {area.trend && (
                    <span className={`compliance-card-trend compliance-card-trend--${area.trend.direction}`}>
                      {area.trend.direction === 'up' ? '\u2191' : '\u2193'} {Math.abs(area.trend.value)}%
                    </span>
                  )}
                </div>
                <span className="compliance-card-subtitle">{area.subtitle}</span>
                <Sparkline data={area.sparklineData} />
              </div>
            </div>
            <div className="compliance-card-bar">
              <div className="compliance-card-bar-fill" style={{ width: `${area.score}%` }} />
            </div>
          </button>
        )
      })}
    </div>
  )
}
