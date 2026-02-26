import { useState, useEffect } from 'react'
import { useLocation, useNavigate, NavLink } from 'react-router-dom'
import Sidebar from './Sidebar'
import GlobalSearch from './GlobalSearch'
import Onboarding from './Onboarding'
import IncidentQuickAdd from './IncidentQuickAdd'

const titles = {
  '/': 'Dashboard',
  '/rp-log': 'RP Log',
  '/training': 'Training Logs',
  '/cleaning': 'Cleaning Rota',
  '/documents': 'Document & Renewal Tracker',
  '/staff-training': 'Staff Training Tracker',
  '/safeguarding': 'Safeguarding Training',
  '/temperature': 'Temperature Log',
  '/settings': 'Settings',
}

const SHORTCUTS = {
  d: '/',
  r: '/rp-log',
  t: '/training',
  c: '/cleaning',
  s: '/staff-training',
}

// Mobile bottom nav items (icons only on small screens)
const bottomNav = [
  {
    to: '/',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
    label: 'Home',
  },
  {
    to: '/rp-log',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M9 14l2 2 4-4" /></svg>,
    label: 'RP',
  },
  {
    to: '/cleaning',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M9 14l2 2 4-4" /><path d="M9 10h6" /></svg>,
    label: 'Clean',
  },
  {
    to: '/temperature',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z" /></svg>,
    label: 'Temp',
  },
  {
    to: '/settings',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>,
    label: 'More',
  },
]

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const title = titles[location.pathname] || 'iPharmacy Direct'
  const isHome = location.pathname === '/'

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      // Skip if typing in input, textarea, select, or contenteditable
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const route = SHORTCUTS[e.key.toLowerCase()]
      if (route) {
        e.preventDefault()
        navigate(route)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])

  return (
    <div className="layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main">
        <header className="main-header">
          <button
            className="hamburger"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="main-header-center">
            {/* Breadcrumbs */}
            {!isHome && (
              <nav className="breadcrumbs">
                <NavLink to="/" className="breadcrumb-link">Dashboard</NavLink>
                <span className="breadcrumb-sep">/</span>
                <span className="breadcrumb-current">{title}</span>
              </nav>
            )}
            <h1 className="main-title">{title}</h1>
          </div>
          <GlobalSearch />
        </header>
        <div className="main-content page-transition">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="mobile-bottom-nav">
        {bottomNav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `mobile-bottom-link ${isActive ? 'mobile-bottom-link--active' : ''}`}
          >
            {item.icon}
            <span className="mobile-bottom-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <IncidentQuickAdd />
      <Onboarding />
    </div>
  )
}
