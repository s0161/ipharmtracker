import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useSidebarCounts } from '../hooks/useSidebarCounts'
import { useTheme } from '../hooks/useTheme'
import { useUser } from '../contexts/UserContext'
import { getStaffInitials } from '../utils/rotationManager'

// ─── NAV ICONS (16x16 viewBox) ───
function NI({ name, color }) {
  const p = { stroke: color, strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' }
  const m = {
    grid: <><rect x="2" y="2" width="5" height="5" rx="1" {...p} /><rect x="9" y="2" width="5" height="5" rx="1" {...p} /><rect x="2" y="9" width="5" height="5" rx="1" {...p} /><rect x="9" y="9" width="5" height="5" rx="1" {...p} /></>,
    check: <path d="M4 8l2.5 2.5L12 4" {...p} />,
    clip: <><rect x="4" y="2" width="8" height="12" rx="1" {...p} /><path d="M6 2V1h4v1M7 7h2M7 10h4" {...p} /></>,
    therm: <path d="M8 2v7.5a2.5 2.5 0 1 1-2 0V2a1 1 0 0 1 2 0z" {...p} />,
    book: <><path d="M2 3h4a2 2 0 0 1 2 2v9a1.5 1.5 0 0 0-1.5-1.5H2V3z" {...p} /><path d="M14 3h-4a2 2 0 0 0-2 2v9a1.5 1.5 0 0 1 1.5-1.5H14V3z" {...p} /></>,
    spark: <path d="M8 2l1.5 4.5L14 8l-4.5 1.5L8 14l-1.5-4.5L2 8l4.5-1.5z" {...p} />,
    file: <><path d="M4 2h6l4 4v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" {...p} /><path d="M10 2v4h4" {...p} /></>,
    shield: <path d="M8 1L2 4v4c0 4.5 3 7.5 6 9 3-1.5 6-4.5 6-9V4L8 1z" {...p} />,
    alertTri: <><path d="M8 1.5L1.5 13h13L8 1.5z" {...p} /><line x1="8" y1="6" x2="8" y2="9" {...p} /><line x1="8" y1="11" x2="8.01" y2="11" {...p} /></>,
    shieldAlert: <><path d="M8 1L2 4v4c0 4.5 3 7.5 6 9 3-1.5 6-4.5 6-9V4L8 1z" {...p} /><line x1="8" y1="5.5" x2="8" y2="8.5" {...p} /><line x1="8" y1="10.5" x2="8.01" y2="10.5" {...p} /></>,
    users: <><circle cx="6" cy="5" r="2.5" {...p} /><path d="M1 14c0-3 2.5-5 5-5s5 2 5 5" {...p} /></>,
    gear: <><circle cx="8" cy="8" r="2.5" {...p} /><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" {...p} /></>,
    sun: <><circle cx="8" cy="8" r="3" {...p} /><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M3.2 12.8l1.4-1.4M11.4 4.6l1.4-1.4" {...p} /></>,
    moon: <path d="M12 3a6 6 0 1 0 0 10A5 5 0 0 1 12 3z" {...p} />,
  }
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none">{m[name]}</svg>
}

const sections = [
  {
    label: 'DAILY',
    items: [
      { to: '/', label: 'Dashboard', icon: 'grid', shortcut: 'D' },
      { to: '/my-tasks', label: 'My Tasks', icon: 'check', shortcut: 'M' },
      { to: '/rp-log', label: 'RP Log', icon: 'clip', shortcut: 'R' },
      { to: '/temperature', label: 'Temp Log', icon: 'therm' },
    ],
  },
  {
    label: 'RECORDS',
    items: [
      { to: '/training', label: 'Training Logs', icon: 'book', shortcut: 'T' },
      { to: '/cleaning', label: 'Cleaning Rota', icon: 'spark', shortcut: 'C' },
      { to: '/documents', label: 'Documents', icon: 'file' },
      { to: '/incidents', label: 'Incidents', icon: 'alertTri' },
    ],
  },
  {
    label: 'COMPLIANCE',
    items: [
      { to: '/safeguarding', label: 'Safeguarding', icon: 'shield' },
      { to: '/staff-training', label: 'Staff Training', icon: 'users', shortcut: 'S' },
      { to: '/near-misses', label: 'Near Misses', icon: 'shieldAlert' },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { to: '/settings', label: 'Settings', icon: 'gear' },
    ],
  },
]

export default function Sidebar({ open, onClose }) {
  const counts = useSidebarCounts()
  const { theme, toggle: toggleTheme } = useTheme()
  const { user, logout: logoutUser } = useUser()

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[49] lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-[220px] bg-ec-sidebar z-50 flex flex-col
          border-r border-ec-div font-sans
          transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          lg:translate-x-0 ${open ? 'translate-x-0 shadow-[8px_0_32px_rgba(0,0,0,0.5)]' : '-translate-x-full'}`}
      >
        {/* Emerald gradient edge */}
        <div
          className="absolute left-0 top-0 w-px h-1/2 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, #10b981 0%, rgba(16,185,129,0.2) 40%, transparent 100%)' }}
        />
        {/* Emerald radial glow */}
        <div
          className="absolute left-0 top-0 w-full h-[120px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 0% 0%, rgba(16,185,129,0.04), transparent 70%)' }}
        />

        {/* Brand */}
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-ec-div">
          <div
            className="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-[9px] font-extrabold text-white tracking-tighter"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
            }}
          >
            IPD
          </div>
          <div>
            <div className="text-[13px] font-bold text-ec-t1 leading-tight">iPharmacy</div>
            <div className="text-[9px] font-semibold text-ec-t3 tracking-[1.5px] uppercase">Direct</div>
          </div>
          {/* Mobile close */}
          <button
            onClick={onClose}
            className="ml-auto bg-transparent border-none text-ec-t3 cursor-pointer text-lg p-1 lg:hidden"
          >
            ✕
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-1">
          {sections.map((section) => (
            <div key={section.label}>
              <div className="text-[9px] font-bold text-ec-t4 tracking-[1.5px] uppercase px-4 pt-[22px] pb-1.5">
                {section.label}
              </div>
              {section.items.map((item) => {
                const badge = counts[item.to]
                const total = badge ? (badge.red || 0) + (badge.amber || 0) : 0
                const badgeType = badge?.red > 0 ? 'red' : badge?.amber > 0 ? 'amber' : null

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-2 w-[calc(100%-16px)] mx-2 my-px px-3 py-2 rounded-[7px]
                       border-none cursor-pointer text-[13px] text-left no-underline
                       transition-all duration-150 ease-in-out
                       ${isActive
                        ? 'bg-white/[0.06] text-ec-t1 font-semibold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]'
                        : 'bg-transparent text-ec-z6 font-normal hover:bg-white/[0.03] hover:text-[#a1a1aa]'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <NI name={item.icon} color={isActive ? '#e4e4e7' : '#52525b'} />
                        <span className="flex-1">{item.label}</span>
                        {total > 0 && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-px rounded-lg min-w-[18px] text-center
                              ${badgeType === 'red'
                                ? 'bg-[rgba(239,68,68,0.12)] text-ec-crit-light'
                                : 'bg-[rgba(245,158,11,0.12)] text-ec-warn-light'
                              }`}
                          >
                            {total}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                )
              })}
            </div>
          ))}

          {/* Theme toggle in SYSTEM section */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 w-[calc(100%-16px)] mx-2 my-px px-3 py-2 rounded-[7px]
              border-none cursor-pointer text-[13px] text-left font-normal
              bg-transparent text-ec-z6 hover:bg-white/[0.03] hover:text-[#a1a1aa]
              transition-all duration-150 ease-in-out font-sans"
          >
            <NI name={theme === 'dark' ? 'sun' : 'moon'} color="#52525b" />
            <span className="flex-1">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </nav>

        {/* User pill */}
        {user && (
          <div className="flex items-center gap-2.5 px-4 py-3.5 border-t border-ec-div">
            <div
              className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                boxShadow: '0 2px 8px rgba(16,185,129,0.2)',
              }}
            >
              {getStaffInitials(user.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-ec-t1 truncate">{user.name}</div>
              <div className="text-[10px] text-ec-t3">
                {user.is_manager ? 'Manager' : 'Staff'}
              </div>
            </div>
            <button
              onClick={logoutUser}
              title="Switch user"
              className="bg-transparent border-none text-ec-t3 cursor-pointer p-1 hover:text-ec-t1 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
