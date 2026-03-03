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
  const isDashboard = location.pathname === '/'

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const route = SHORTCUTS[e.key.toLowerCase()]
      if (route) { e.preventDefault(); navigate(route) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])

  return (
    <div
      className="min-h-screen bg-ec-bg font-sans"
      style={{
        backgroundImage: 'radial-gradient(ellipse at 25% -5%, rgba(16,185,129,0.035), transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(99,102,241,0.02), transparent 50%)',
      }}
    >
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:ml-[220px]">
        {/* Header — hidden on Dashboard (it has its own) */}
        {!isDashboard && (
          <header className="sticky top-0 z-30 flex items-center gap-3 px-4 lg:px-9 py-3 border-b border-ec-div bg-ec-bg/80 backdrop-blur-md">
            <button
              className="lg:hidden bg-transparent border-none text-ec-t3 cursor-pointer p-1 flex flex-col gap-[3.5px]"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <div className="w-[18px] h-[1.5px] bg-current rounded-sm" />
              <div className="w-[18px] h-[1.5px] bg-current rounded-sm" />
              <div className="w-[13px] h-[1.5px] bg-current rounded-sm" />
            </button>
            <nav className="flex items-center gap-1.5 text-xs">
              <NavLink to="/" className="text-ec-t3 hover:text-ec-t1 no-underline transition-colors">Dashboard</NavLink>
              <span className="text-ec-t4">/</span>
              <span className="text-ec-t1 font-medium">{title}</span>
            </nav>
            <div className="flex-1" />
            <GlobalSearch />
          </header>
        )}

        <div className={isDashboard ? '' : 'px-4 lg:px-9 py-6 pb-20 lg:pb-6'}>
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden flex items-stretch bg-ec-bg/95 backdrop-blur-md border-t border-ec-div">
        {bottomNav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 no-underline transition-colors
               ${isActive ? 'text-ec-t1' : 'text-ec-z6'}`
            }
          >
            {item.icon}
            <span className="text-[9px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <IncidentQuickAdd />
      <Onboarding />
    </div>
  )
}
