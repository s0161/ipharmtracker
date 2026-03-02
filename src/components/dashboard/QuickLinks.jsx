import { useNavigate } from 'react-router-dom'

export default function QuickLinks({ links }) {
  const navigate = useNavigate()

  return (
    <div className="quick-links">
      {links.map(link => (
        <button
          key={link.key}
          className="quick-link"
          onClick={() => navigate(link.nav)}
        >
          <span className="quick-link-icon">{link.icon}</span>
          <div className="quick-link-text">
            <span className="quick-link-title">{link.title}</span>
            <span className="quick-link-subtitle">{link.subtitle}</span>
          </div>
          <span className="quick-link-arrow">&rarr;</span>
        </button>
      ))}
    </div>
  )
}
