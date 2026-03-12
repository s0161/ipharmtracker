import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate, NavLink } from 'react-router-dom'
import Sidebar from './Sidebar'
import GlobalSearch from './GlobalSearch'
import Onboarding from './Onboarding'
import IncidentQuickAdd from './IncidentQuickAdd'
import CriticalBanner from './alerts/CriticalBanner'
import { useAlertsData } from '../hooks/useAlertsData'
import { useTheme } from '../hooks/useTheme'

// Per-page heading gradient accents: [accent, accentDark]
const headingAccents = {
  '/rp-log':            ['#10b981', '#059669'],
  '/temperature':       ['#0073e6', '#0284c7'],
  '/training':          ['#635bff', '#818cf8'],
  '/staff-training':    ['#635bff', '#818cf8'],
  '/my-tasks':          ['#10b981', '#059669'],
  '/incidents':         ['#ef4444', '#f97316'],
  '/near-misses':       ['#ef4444', '#f97316'],
  '/cleaning':          ['#0d9488', '#10b981'],
  '/documents':         ['#f59e0b', '#d97706'],
  '/alerts':            ['#ef4444', '#dc2626'],
  '/cd-register':       ['#635bff', '#4f46e5'],
  '/care-homes':        ['#0073e6', '#0284c7'],
  '/staff-directory':   ['#0d9488', '#10b981'],
  '/safeguarding':      ['#ef4444', '#dc2626'],
  '/analytics':         ['#0073e6', '#0284c7'],
  '/compliance-report': ['#10b981', '#059669'],
  '/settings':          ['#64748b', '#475569'],
  '/audit-log':         ['#64748b', '#475569'],
  '/sop-library':       ['#635bff', '#4f46e5'],
  '/induction':         ['#635bff', '#818cf8'],
  '/appraisals':        ['#f59e0b', '#d97706'],
  '/mhra-recalls':      ['#ef4444', '#dc2626'],
}
const defaultAccent = ['#10b981', '#059669']

const titles = {
  '/': 'Dashboard',
  '/my-tasks': 'My Tasks',
  '/rp-log': 'RP Log',
  '/training': 'Training Logs',
  '/cleaning': 'Cleaning Rota',
  '/documents': 'Renewals',
  '/staff-training': 'Staff Training Tracker',

  '/temperature': 'Temperature Log',
  '/incidents': 'Incidents',
  '/near-misses': 'Near Miss Log',
  '/safeguarding': 'Safeguarding',
  '/settings': 'Settings',
  '/compliance-report': 'Compliance Report',
  '/audit-log': 'Audit Log',
  '/analytics': 'Analytics',
  '/sop-library': 'SOP Library',
  '/alerts': 'Alert Centre',
  '/care-homes': 'Care Homes',
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
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
    label: 'Home',
  },
  {
    to: '/rp-log',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" aria-hidden="true"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M9 14l2 2 4-4" /></svg>,
    label: 'RP',
  },
  {
    to: '/cleaning',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" aria-hidden="true"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M9 14l2 2 4-4" /><path d="M9 10h6" /></svg>,
    label: 'Clean',
  },
  {
    to: '/temperature',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" aria-hidden="true"><path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z" /></svg>,
    label: 'Temp',
  },
]

const morePages = [
  { to: '/alerts', label: 'Alert Centre', icon: 'alert' },
  { to: '/my-tasks', label: 'My Tasks', icon: 'check-square' },
  { to: '/documents', label: 'Renewals', icon: 'file' },
  { to: '/staff-training', label: 'Staff Training', icon: 'book' },
  { to: '/safeguarding', label: 'Safeguarding', icon: 'shield' },
  { to: '/training', label: 'Training Logs', icon: 'clipboard' },
  { to: '/incidents', label: 'Incidents', icon: 'alert' },
  { to: '/near-misses', label: 'Near Misses', icon: 'alert-triangle' },
  { to: '/analytics', label: 'Analytics', icon: 'bar-chart' },
  { to: '/compliance-report', label: 'Compliance Report', icon: 'printer' },
  { to: '/sop-library', label: 'SOP Library', icon: 'book' },
  { to: '/audit-log', label: 'Audit Log', icon: 'list' },
  { to: '/care-homes', label: 'Care Homes', icon: 'shield' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
]

const MoreIcon = ({ icon }) => {
  const icons = {
    'check-square': <><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></>,
    'file': <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></>,
    'book': <><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></>,
    'shield': <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    'clipboard': <><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /></>,
    'alert': <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>,
    'alert-triangle': <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
    'bar-chart': <><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></>,
    'printer': <><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></>,
    'list': <><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></>,
    'settings': <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></>,
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" strokeLinecap="round" strokeLinejoin="round">
      {icons[icon] || null}
    </svg>
  )
}

const SHORTCUT_LIST = [
  { key: 'D', label: 'Dashboard' },
  { key: 'M', label: 'My Tasks' },
  { key: 'R', label: 'RP Log' },
  { key: 'T', label: 'Training Logs' },
  { key: 'C', label: 'Cleaning Rota' },
  { key: 'S', label: 'Staff Training' },
  { key: '/', label: 'Search' },
  { key: '?', label: 'Show shortcuts' },
]

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const moreRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const title = titles[location.pathname] || 'iPharmacy Direct'
  const isDashboard = location.pathname === '/'
  const { stats: alertStats } = useAlertsData()
  const { theme } = useTheme()

  // Heading gradient per page
  const [accent, accentDark] = headingAccents[location.pathname] || defaultAccent
  const headingStart = theme === 'dark' ? '#e8f5f0' : '#0a2540'
  const headingGradient = `linear-gradient(135deg, ${headingStart} 0%, ${accent} 60%, ${accentDark} 100%)`

  // Close More menu on route change
  useEffect(() => { setMoreOpen(false) }, [location.pathname])

  // Close More menu on outside click
  useEffect(() => {
    if (!moreOpen) return
    const handler = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false)
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [moreOpen])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === '?') { e.preventDefault(); setShowShortcuts(v => !v); return }
      if (e.key === 'Escape' && showShortcuts) { setShowShortcuts(false); return }
      const route = SHORTCUTS[e.key.toLowerCase()]
      if (route) { e.preventDefault(); navigate(route) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate, showShortcuts])

  return (
    <div
      className="min-h-screen font-sans"
    >
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:ml-[220px]">
        <CriticalBanner count={alertStats?.critical || 0} />
        {/* Header — consistent across all pages */}
        {!isDashboard && (
          <header className="sticky top-0 z-30 flex items-center gap-3 px-4 lg:px-9 py-3 border-b border-ec-div bg-[var(--surface)]/80 backdrop-blur-md">
            <button
              className="lg:hidden bg-transparent border-none text-ec-t3 cursor-pointer p-1 flex flex-col gap-[3.5px]"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <div className="w-[18px] h-[1.5px] bg-current rounded-sm" aria-hidden="true" />
              <div className="w-[18px] h-[1.5px] bg-current rounded-sm" aria-hidden="true" />
              <div className="w-[13px] h-[1.5px] bg-current rounded-sm" aria-hidden="true" />
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

        <div
          className={isDashboard ? '' : 'px-4 lg:px-9 py-6 pb-20 lg:pb-6'}
          style={!isDashboard ? {
            '--heading-start': headingStart,
            '--heading-accent': accent,
            '--heading-accent-dark': accentDark,
          } : undefined}
        >
          {!isDashboard && (
            <div
              className="rounded-xl mb-6 px-6 py-5 bg-page-header border border-[rgba(16,185,129,0.15)]"
            >
              <h1 className="text-lg font-bold leading-tight page-heading">{title}</h1>
              <p className="text-xs text-ec-t3 mt-0.5">Manage and track your {title.toLowerCase()}</p>
            </div>
          )}
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

        {/* More button */}
        <div ref={moreRef} className="flex-1 relative">
          <button
            className={`w-full h-full flex flex-col items-center justify-center gap-0.5 bg-transparent border-none cursor-pointer transition-colors ${moreOpen ? 'text-ec-t1' : 'text-ec-z6'}`}
            onClick={() => setMoreOpen(v => !v)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
            </svg>
            <span className="text-[9px] font-medium">More</span>
          </button>

          {/* More slide-up sheet */}
          {moreOpen && (
            <div
              className="absolute bottom-full right-0 mb-2 w-56 rounded-xl overflow-hidden ec-fadeup"
              style={{
                backgroundColor: 'var(--ec-card-solid, var(--ec-bg))',
                border: '1px solid var(--ec-border)',
                boxShadow: '0 -8px 30px rgba(5,150,105,0.12)',
              }}
            >
              <div className="py-2 max-h-[60vh] overflow-y-auto">
                {morePages.map(page => {
                  const isActive = location.pathname === page.to
                  return (
                    <NavLink
                      key={page.to}
                      to={page.to}
                      className="flex items-center gap-3 px-4 py-2.5 no-underline transition-colors"
                      style={{
                        color: isActive ? 'var(--ec-t1)' : 'var(--ec-t2)',
                        backgroundColor: isActive ? 'var(--ec-t5)' : 'transparent',
                      }}
                      onClick={() => setMoreOpen(false)}
                    >
                      <MoreIcon icon={page.icon} />
                      <span className="text-sm">{page.label}</span>
                    </NavLink>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </nav>

      <IncidentQuickAdd />
      <Onboarding />

      {/* Keyboard shortcut overlay */}
      {showShortcuts && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="ec-fadeup rounded-2xl p-6 w-[340px] max-w-[90vw]"
            style={{
              backgroundColor: 'var(--ec-card-solid, var(--ec-bg))',
              border: '1px solid var(--ec-border)',
              boxShadow: '0 16px 48px rgba(5,150,105,0.12)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-ec-t1">Keyboard Shortcuts</h2>
              <button
                onClick={() => setShowShortcuts(false)}
                className="bg-transparent border-none text-ec-t3 cursor-pointer p-1 hover:text-ec-t1 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="space-y-1.5">
              {SHORTCUT_LIST.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-ec-card-hover transition-colors">
                  <span className="text-[13px] text-ec-t2">{label}</span>
                  <kbd
                    className="inline-flex items-center justify-center min-w-[28px] h-[26px] px-1.5 rounded-md text-[11px] font-bold text-ec-t1"
                    style={{
                      backgroundColor: 'var(--ec-card-hover)',
                      border: '1px solid var(--ec-border)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                    }}
                  >
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-ec-t4 mt-4 text-center">
              Press <kbd className="inline px-1 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: 'var(--ec-card-hover)', border: '1px solid var(--ec-border)' }}>Esc</kbd> or <kbd className="inline px-1 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: 'var(--ec-card-hover)', border: '1px solid var(--ec-border)' }}>?</kbd> to close
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
