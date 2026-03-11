import { useState, useEffect } from 'react'
import StickyKeys from './StickyKeys'

const Dot = ({ color, size = 8 }) => (
  <div
    className="rounded-full shrink-0 animate-ec-pulse"
    style={{
      width: size, height: size,
      backgroundColor: color,
      boxShadow: `0 0 6px ${color}40`,
    }}
  />
)

const Chev = ({ open, color = 'currentColor', size = 10 }) => (
  <svg
    width={size} height={size} viewBox="0 0 12 12" fill="none"
    className="shrink-0 transition-transform duration-250"
    style={{ transform: open ? 'rotate(90deg)' : 'rotate(0)', transitionTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)' }}
  >
    <path d="M4.5 2.5L8 6L4.5 9.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function RPPresenceBar({
  rpName, rpSignedIn, rpSignInTime, rpLastSignOut, sessions,
  keys, onKeyPress, showFridge, fridgeVal, onFridgeChange, onFridgeSubmit,
  onToggleRP, mob,
}) {
  const [elapsed, setElapsed] = useState('')
  const [sessOpen, setSessOpen] = useState(false)

  useEffect(() => {
    if (!rpSignedIn || !rpSignInTime) { setElapsed(rpSignedIn ? '\u2014' : ''); return }
    const calc = () => {
      const now = new Date()
      const [h, m] = rpSignInTime.split(':').map(Number)
      const start = new Date()
      start.setHours(h, m, 0, 0)
      const d = Math.max(0, now - start)
      setElapsed(`${Math.floor(d / 3600000)}h ${Math.floor((d % 3600000) / 60000)}m`)
    }
    calc()
    const id = setInterval(calc, 60000)
    return () => clearInterval(id)
  }, [rpSignedIn, rpSignInTime])

  return (
    <div
      className="ec-fadeup rounded-xl px-5 py-4 transition-all duration-500"
      style={{
        backgroundColor: rpSignedIn ? 'var(--ec-em-faint)' : 'rgba(239,68,68,0.05)',
        border: `1px solid ${rpSignedIn ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.12)'}`,
        boxShadow: rpSignedIn
          ? '0 0 40px rgba(16,185,129,0.04), inset 0 1px 0 rgba(16,185,129,0.08)'
          : 'inset 0 1px 0 rgba(239,68,68,0.08)',
        animationDelay: '0.1s',
      }}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
          <Dot color={rpSignedIn ? 'var(--ec-em)' : 'var(--ec-crit)'} />
          {rpSignedIn ? (
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-sm font-semibold text-ec-t1">{rpName}</span>
              <span className="text-[11px] text-ec-t3">RP since {rpSignInTime || '\u2014'}</span>
              <span className="text-sm font-bold text-ec-em tabular-nums tracking-tight">{elapsed}</span>
            </div>
          ) : (
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-sm font-semibold text-ec-crit-light">No RP signed in</span>
              <span className="text-[11px] text-ec-t3">Last: {rpName} out at {rpLastSignOut || '\u2014'}</span>
            </div>
          )}
        </div>
        <button
          onClick={onToggleRP}
          className="rounded-lg border-none cursor-pointer text-[13px] font-semibold font-sans transition-all duration-200"
          style={rpSignedIn
            ? { padding: '7px 16px', backgroundColor: 'var(--ec-card-hover)', color: 'var(--ec-t2)' }
            : { padding: '8px 22px', backgroundColor: 'var(--ec-crit)', color: 'white', boxShadow: '0 2px 12px var(--ec-crit-faint)' }
          }
        >
          {rpSignedIn ? 'Sign Out' : 'Sign In as RP →'}
        </button>
      </div>

      {rpSignedIn && (
        <StickyKeys
          keys={keys}
          onKeyPress={onKeyPress}
          showFridge={showFridge}
          fridgeVal={fridgeVal}
          onFridgeChange={onFridgeChange}
          onFridgeSubmit={onFridgeSubmit}
          mob={mob}
        />
      )}

      {rpSignedIn && (
        <div className="mt-3">
          <button
            onClick={() => setSessOpen(!sessOpen)}
            className="bg-transparent border-none cursor-pointer font-sans text-[11px] text-ec-t3 py-0.5 flex items-center gap-1 transition-colors hover:text-ec-t1"
          >
            <Chev open={sessOpen} size={10} />
            Today's sessions
          </button>
          <div
            className="overflow-hidden transition-all duration-300"
            style={{ maxHeight: sessOpen ? 200 : 0, opacity: sessOpen ? 1 : 0 }}
          >
            <div className="mt-1.5 px-3 py-2 rounded-lg bg-ec-card border border-ec-div">
              {sessions?.map((s, i) => (
                <div
                  key={i}
                  className="flex gap-3 text-[11px] text-ec-t3 py-[5px]"
                  style={{ borderBottom: i < sessions.length - 1 ? '1px solid var(--ec-div)' : 'none' }}
                >
                  <span className="text-ec-t2 font-medium min-w-[100px] tabular-nums">
                    {s.start} – {s.end}
                  </span>
                  <span className="flex-1">{s.name}</span>
                  <span className={`font-semibold tabular-nums ${s.end === 'ongoing' ? 'text-ec-em' : 'text-ec-t3'}`}>
                    {s.dur || elapsed}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
