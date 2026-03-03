import { useState } from 'react'

const Check = ({ s = 12, c = 'white' }) => (
  <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
    <path d="M2.5 6L5 8.5L9.5 3.5" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const KEYS = [
  { id: 'rpNotice', label: 'RP Notice', em: '📋' },
  { id: 'cdCheck', label: 'CD Check', em: '💊' },
  { id: 'opening', label: 'Opening', em: '🔓' },
  { id: 'closing', label: 'Closing', em: '🔒' },
  { id: 'fridgeTemp', label: 'Fridge Temp', em: '🌡️' },
]

export default function StickyKeys({ keys, onKeyPress, showFridge, fridgeVal, onFridgeChange, onFridgeSubmit, mob }) {
  const [pressed, setPressed] = useState(null)
  const [justCompleted, setJustCompleted] = useState(null)

  const handleKey = (id) => {
    if (keys[id]?.d) return
    if (id === 'fridgeTemp') {
      onKeyPress(id)
      return
    }
    setPressed(id)
    setTimeout(() => {
      setPressed(null)
      setJustCompleted(id)
      setTimeout(() => setJustCompleted(null), 400)
    }, 150)
    onKeyPress(id)
  }

  return (
    <div className="flex gap-2 mt-4 flex-wrap">
      {KEYS.map(k => {
        const st = keys[k.id]
        const pr = pressed === k.id
        const jc = justCompleted === k.id
        const isFr = k.id === 'fridgeTemp'

        return (
          <button
            key={k.id}
            onClick={() => handleKey(k.id)}
            className="flex-1 rounded-[10px] flex flex-col items-center justify-center gap-0.5 font-sans transition-all duration-150"
            style={{
              minWidth: mob ? 'calc(33% - 8px)' : 0,
              height: 58,
              cursor: st?.d ? 'default' : 'pointer',
              border: `1px solid ${st?.d ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)'}`,
              backgroundColor: st?.d ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.025)',
              boxShadow: st?.d
                ? '0 0 12px rgba(16,185,129,0.06)'
                : 'inset 0 2px 4px rgba(0,0,0,0.3), inset 0 -1px 0 rgba(255,255,255,0.03)',
              transform: pr ? 'scale(0.95)' : jc ? 'scale(1.02)' : 'scale(1)',
              transitionTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)',
            }}
          >
            {st?.d ? (
              <>
                <div className="ec-checkpop"><Check s={14} c="#10b981" /></div>
                <span className="text-[10px] text-ec-em font-semibold tabular-nums">
                  {st.t}{isFr && st.v ? ` · ${st.v}°C` : ''}
                </span>
              </>
            ) : isFr && showFridge ? (
              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <input
                  autoFocus
                  value={fridgeVal}
                  onChange={e => onFridgeChange(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') onFridgeSubmit() }}
                  placeholder="°C"
                  className="w-11 px-1 py-0.5 rounded-[5px] border border-white/10 bg-white/[0.06] text-ec-t1 text-xs text-center outline-none font-sans"
                />
                <button
                  onClick={onFridgeSubmit}
                  className="bg-ec-em border-none rounded-[5px] text-white text-[11px] px-2 py-0.5 cursor-pointer font-semibold"
                >
                  ✓
                </button>
              </div>
            ) : (
              <>
                <span className="text-[17px] leading-none">{k.em}</span>
                <span className="text-[10px] text-ec-t3 font-medium">{k.label}</span>
              </>
            )}
          </button>
        )
      })}
    </div>
  )
}
