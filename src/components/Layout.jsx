import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import GlobalSearch from './GlobalSearch'
import Onboarding from './Onboarding'

const titles = {
  '/': 'Dashboard',
  '/rp-log': 'RP Log',
  '/training': 'Training Logs',
  '/cleaning': 'Cleaning Rota',
  '/documents': 'Document & Renewal Tracker',
  '/staff-training': 'Staff Training Tracker',
  '/safeguarding': 'Safeguarding Training',
  '/settings': 'Settings',
}

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const title = titles[location.pathname] || 'iPharmacy Direct'

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
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <h1 className="main-title">{title}</h1>
          <GlobalSearch />
        </header>
        <div className="main-content">{children}</div>
      </main>
      <Onboarding />
    </div>
  )
}
