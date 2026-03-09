import { useState, useEffect, useRef } from 'react'

const BellIcon = ({ size = 16, color = 'var(--ec-t2)' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M4 6a4 4 0 0 1 8 0c0 2.5 1 4 2 5H2c1-1 2-2.5 2-5z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6.5 13a1.5 1.5 0 0 0 3 0" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export default function NotificationBell({ notifications, onDismissNotification }) {
  const [bellOpen, setBellOpen] = useState(false)
  const [bellShake, setBellShake] = useState(false)
  const [notifRead, setNotifRead] = useState(() =>
    new Set(notifications.filter(n => n.read).map(n => n.id))
  )
  const bellRef = useRef(null)

  const unreadCount = notifications.filter(n => !notifRead.has(n.id)).length

  // Close on outside click
  useEffect(() => {
    if (!bellOpen) return
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [bellOpen])

  // Bell shake on mount
  useEffect(() => {
    const t = setTimeout(() => {
      setBellShake(true)
      setTimeout(() => setBellShake(false), 600)
    }, 1500)
    return () => clearTimeout(t)
  }, [])

  const markNotifRead = (id) => setNotifRead(p => new Set([...p, id]))
  const markAllRead = () => setNotifRead(new Set(notifications.map(n => n.id)))

  return (
    <div ref={bellRef} className="relative">
      <button
        onClick={() => setBellOpen(!bellOpen)}
        className={`bg-transparent border-none cursor-pointer p-1.5 rounded-lg flex relative
          transition-colors duration-150 ${bellOpen ? 'bg-ec-border' : ''}`}
      >
        <div className={bellShake ? 'ec-bellshake' : ''}>
          <BellIcon size={18} color={bellOpen ? 'var(--ec-t1)' : 'var(--ec-t2)'} />
        </div>
        {unreadCount > 0 && (
          <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-ec-crit flex items-center justify-center text-[8px] font-extrabold text-white border-2 border-ec-bg">
            {unreadCount}
          </div>
        )}
      </button>

      {bellOpen && (
        <div className="ec-slidedown absolute top-full right-0 mt-2 w-80 rounded-xl border border-ec-border backdrop-blur-xl z-60 overflow-hidden" style={{ backgroundColor: 'var(--ec-card-solid)', boxShadow: 'var(--shadow-md)' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-ec-div">
            <span className="text-[13px] font-bold text-ec-t1">Notifications</span>
            {unreadCount > 0 && (
              <span
                className="text-[10px] text-ec-em cursor-pointer font-medium"
                onClick={markAllRead}
              >
                Mark all read
              </span>
            )}
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {notifications.map(n => {
              const isRead = notifRead.has(n.id)
              const typeCol = n.type === 'critical' ? '#ef4444' : n.type === 'warning' ? '#f59e0b' : '#6366f1'
              return (
                <div
                  key={n.id}
                  onClick={() => markNotifRead(n.id)}
                  className={`px-4 py-2.5 border-b border-ec-div cursor-pointer transition-colors duration-150
                    hover:bg-ec-card ${isRead ? 'bg-transparent' : 'bg-ec-card'}`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-[5px] shrink-0"
                      style={{
                        backgroundColor: isRead ? 'transparent' : typeCol,
                        boxShadow: isRead ? 'none' : `0 0 4px ${typeCol}40`,
                      }}
                    />
                    <div className="flex-1">
                      <div className={`text-xs ${isRead ? 'font-normal text-ec-t3' : 'font-semibold text-ec-t1'}`}>
                        {n.title}
                      </div>
                      <div className="text-[11px] text-ec-t3 mt-0.5">{n.desc}</div>
                    </div>
                    <span className="text-[10px] text-ec-t4 whitespace-nowrap shrink-0">{n.time}</span>
                    {n.dismissible && onDismissNotification && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDismissNotification(n)
                        }}
                        className="ml-1 text-ec-t4 hover:text-ec-t2 transition-colors bg-transparent border-none cursor-pointer p-0.5 rounded"
                        title="Dismiss"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M2 2l8 8M10 2l-8 8" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
