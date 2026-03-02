import { useState, useEffect } from 'react'
import { useLocation, useNavigate, NavLink } from 'react-router-dom'
import Sidebar from './Sidebar'
import GlobalSearch from './GlobalSearch'
import Onboarding from './Onboarding'
import IncidentQuickAdd from './IncidentQuickAdd'

const titles = {
  '/': 'Dashboard',
  '/my-tasks': 'My Tasks',
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
  m: '/my-tasks',
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
    to: '/my-tasks',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>,
    label: 'Tasks',
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
