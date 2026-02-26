import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useSidebarCounts } from '../hooks/useSidebarCounts'
import { useTheme } from '../hooks/useTheme'

const sections = [
  {
    label: 'DAILY',
    items: [
      {
        to: '/',
        label: 'Dashboard',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        ),
        shortcut: 'D',
      },
      {
        to: '/rp-log',
        label: 'RP Log',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" /><path d="M9 14l2 2 4-4" /><path d="M9 10h6" />
          </svg>
        ),
        shortcut: 'R',
      },
      {
        to: '/temperature',
        label: 'Temp Log',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'RECORDS',
    items: [
      {
        to: '/training',
        label: 'Training Logs',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
          </svg>
        ),
        shortcut: 'T',
      },
      {
        to: '/cleaning',
        label: 'Cleaning Rota',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" /><path d="M9 14l2 2 4-4" />
          </svg>
        ),
        shortcut: 'C',
      },
      {
        to: '/documents',
        label: 'Documents',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'COMPLIANCE',
    items: [
      {
        to: '/safeguarding',
        label: 'Safeguarding',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        ),
      },
      {
        to: '/staff-training',
        label: 'Staff Training',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
        ),
        shortcut: 'S',
      },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      {
        to: '/settings',
        label: 'Settings',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        ),
      },
    ],
  },
]

// Flatten for notification bell
const allNavItems = sections.flatMap(s => s.items)

export default function Sidebar({ open, onClose }) {
  const counts = useSidebarCounts()
  const { theme, toggle: toggleTheme } = useTheme()
  const [bellOpen, setBellOpen] = useState(false)
  const [lastSynced, setLastSynced] = useState(new Date())

  // Update last synced timestamp periodically
  useEffect(() => {
    const id = setInterval(() => setLastSynced(new Date()), 30000)
    return () => clearInterval(id)
  }, [])

  function timeAgo(date) {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
    return `${Math.floor(diff / 3600)} hr ago`
  }

  // Gather all alerts for notification bell
  const alerts = []
  Object.entries(counts).forEach(([path, c]) => {
    const label = allNavItems.find(n => n.to === path)?.label || path
    if (c.red > 0) alerts.push({ label, count: c.red, type: 'red' })
    if (c.amber > 0) alerts.push({ label, count: c.amber, type: 'amber' })
  })
  const totalAlerts = alerts.reduce((s, a) => s + a.count, 0)

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        <div className="sidebar-brand">
          <svg className="sidebar-logo" viewBox="0 0 40 40">
            <rect rx="10" width="40" height="40" fill="#166534" />
            <path d="M20 8v24M10 20h20" stroke="rgba(255,255,255,0.15)" strokeWidth="6" strokeLinecap="round" />
            <text x="20" y="26" textAnchor="middle" fill="white" fontWeight="700" fontSize="13" fontFamily="DM Sans, sans-serif">iPD</text>
          </svg>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">iPharmacy</span>
            <span className="sidebar-brand-sub">Direct</span>
          </div>
          {/* Notification bell */}
          <button className="sidebar-bell" onClick={() => setBellOpen(!bellOpen)} aria-label="Notifications">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            {totalAlerts > 0 && <span className="sidebar-bell-dot" />}
          </button>
        </div>

        {/* Notification dropdown */}
        {bellOpen && (
          <div className="sidebar-notifications">
            <h4 className="sidebar-notifications-title">Alerts</h4>
            {alerts.length === 0 ? (
              <p className="sidebar-notifications-empty">No alerts</p>
            ) : (
              alerts.map((a, i) => (
                <div key={i} className={`sidebar-notification sidebar-notification--${a.type}`}>
                  <span className={`sidebar-notification-dot sidebar-notification-dot--${a.type}`} />
                  <span>{a.label}: {a.count} {a.type === 'red' ? 'overdue' : 'due soon'}</span>
                </div>
              ))
            )}
          </div>
        )}

        <nav className="sidebar-nav">
          {sections.map((section) => (
            <div key={section.label} className="sidebar-section">
              <span className="sidebar-section-label">{section.label}</span>
              {section.items.map((item) => {
                const badge = counts[item.to]
                const hasAction = badge && (badge.red > 0 || badge.amber > 0)
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`
                    }
                    onClick={onClose}
                  >
                    <span className="sidebar-link-icon">
                      {item.icon}
                      {hasAction && <span className="sidebar-red-dot" />}
                    </span>
                    <span className="sidebar-link-label">{item.label}</span>
                    {item.shortcut && <span className="sidebar-shortcut">{item.shortcut}</span>}
                    {badge && badge.red > 0 && (
                      <span className="sidebar-badge sidebar-badge--red">{badge.red}</span>
                    )}
                    {badge && badge.amber > 0 && (
                      <span className="sidebar-badge sidebar-badge--amber">{badge.amber}</span>
                    )}
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-theme-toggle">
          <button className="sidebar-link" onClick={toggleTheme} style={{ border: 'none', background: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
            <span className="sidebar-link-icon">
              {theme === 'dark' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              )}
            </span>
            <span className="sidebar-link-label">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>

        <div className="sidebar-footer">
          <small>Compliance Tracker v3.0</small>
          <small className="sidebar-synced">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10">
              <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
            </svg>
            Synced {timeAgo(lastSynced)}
          </small>
        </div>
      </aside>
    </>
  )
}
