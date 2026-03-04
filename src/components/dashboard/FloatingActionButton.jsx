import { useState, useRef, useEffect } from 'react'

const ACTIONS = [
  { id: 'rpToggle', label: 'RP Sign In', labelAlt: 'RP Sign Out', icon: 'shield', color: '#6366f1' },
  { id: 'fridgeTemp', label: 'Fridge Temp', icon: 'therm', color: '#10b981' },
  { id: 'cdCheck', label: 'CD Check', icon: 'pill', color: '#f59e0b' },
  { id: 'rpNotice', label: 'RP Notice', icon: 'clip', color: '#3b82f6' },
  { id: 'opening', label: 'Open/Close', icon: 'door', color: '#8b5cf6' },
]

const icons = {
  shield: (c) => <path d="M12 2L4 6v5c0 5.5 3.5 9 8 11 4.5-2 8-5.5 8-11V6l-8-4z" stroke={c} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  therm: (c) => <path d="M12 4v10a4 4 0 11-4 0V4a2 2 0 114 0z" stroke={c} strokeWidth="1.5" fill="none" />,
  pill: (c) => <><ellipse cx="12" cy="12" rx="5" ry="8" transform="rotate(45 12 12)" stroke={c} strokeWidth="1.5" fill="none" /><line x1="8.5" y1="8.5" x2="15.5" y2="15.5" stroke={c} strokeWidth="1.5" /></>,
  clip: (c) => <><rect x="6" y="3" width="12" height="18" rx="2" stroke={c} strokeWidth="1.5" fill="none" /><path d="M9 3V2h6v1M10 10h4M10 14h6" stroke={c} strokeWidth="1.5" fill="none" /></>,
  door: (c) => <><rect x="4" y="2" width="16" height="20" rx="2" stroke={c} strokeWidth="1.5" fill="none" /><circle cx="15" cy="12" r="1.5" fill={c} /></>,
  check: (c) => <path d="M5 12l4 4L19 7" stroke={c} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
}

export default function FloatingActionButton({
  keys, rpSignedIn, onKeyPress, onRpToggle,
  showFridge, fridgeVal, onFridgeChange, onFridgeSubmit,
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleAction = (id) => {
    if (id === 'rpToggle') {
      onRpToggle()
      setOpen(false)
      return
    }
    onKeyPress(id)
    if (id !== 'fridgeTemp') setOpen(false)
  }

  return (
    <div ref={ref} className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-3">
      {/* Main FAB button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full border-none cursor-pointer shadow-lg transition-all duration-300 flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, var(--ec-em), var(--ec-em-dark))',
          boxShadow: '0 4px 20px rgba(16,185,129,0.35)',
          transform: open ? 'rotate(45deg)' : 'rotate(0)',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <line x1="12" y1="5" x2="12" y2="19" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <line x1="5" y1="12" x2="19" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* Action buttons */}
      {open && ACTIONS.map((action, i) => {
        const isDone = action.id !== 'rpToggle' && keys[action.id]?.d
        const label = action.id === 'rpToggle'
          ? (rpSignedIn ? action.labelAlt : action.label)
          : action.label
        const isFridge = action.id === 'fridgeTemp' && showFridge

        return (
          <div
            key={action.id}
            className="flex items-center gap-2 ec-fadeup"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            {/* Label pill */}
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-lg whitespace-nowrap"
              style={{
                backgroundColor: 'var(--ec-card)',
                border: '1px solid var(--ec-border)',
                color: isDone ? 'var(--ec-em)' : 'var(--ec-t2)',
                boxShadow: 'var(--shadow)',
              }}
            >
              {isDone ? `${label} ✓` : label}
              {isDone && keys[action.id]?.t && (
                <span className="ml-1 opacity-60">{keys[action.id].t}</span>
              )}
            </span>

            {/* Fridge temp inline input */}
            {isFridge && (
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  value={fridgeVal}
                  onChange={e => onFridgeChange(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') onFridgeSubmit() }}
                  placeholder="°C"
                  className="w-12 px-1.5 py-1 rounded-lg border border-ec-border bg-ec-card text-ec-t1 text-xs text-center outline-none font-sans"
                  onClick={e => e.stopPropagation()}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); onFridgeSubmit() }}
                  className="bg-ec-em border-none rounded-lg text-white text-xs px-2 py-1 cursor-pointer font-semibold"
                >
                  ✓
                </button>
              </div>
            )}

            {/* Action circle button */}
            <button
              onClick={() => handleAction(action.id)}
              disabled={isDone}
              className="w-11 h-11 rounded-full border-none cursor-pointer transition-all duration-200 flex items-center justify-center shrink-0"
              style={{
                backgroundColor: isDone ? 'var(--ec-em-faint)' : 'var(--ec-card)',
                border: `1px solid ${isDone ? 'rgba(16,185,129,0.2)' : 'var(--ec-border)'}`,
                boxShadow: 'var(--shadow-md)',
                opacity: isDone ? 0.7 : 1,
                cursor: isDone ? 'default' : 'pointer',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                {isDone ? icons.check('#10b981') : icons[action.icon](action.color)}
              </svg>
            </button>
          </div>
        )
      })}

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 -z-10"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  )
}
