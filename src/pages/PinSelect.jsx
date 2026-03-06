import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useUser } from '../contexts/UserContext'
import { getStaffInitials } from '../utils/rotationManager'

export default function PinSelect() {
  const { login } = useUser()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [shaking, setShaking] = useState(false)

  useEffect(() => {
    supabase
      .from('staff_members')
      .select('*')
      .order('name')
      .then(({ data }) => {
        setStaff(
          (data || []).map((r) => ({
            id: r.id,
            name: r.name,
            pin: r.pin || '',
            isManager: !!r.is_manager,
            role: r.role || 'staff',
          }))
        )
        setLoading(false)
      })
  }, [])

  const handleDigit = useCallback(
    (digit) => {
      if (!selected) return
      const next = pin + digit
      setError('')
      if (next.length < 4) {
        setPin(next)
        return
      }
      setPin(next)
      if (!selected.pin || selected.pin === next) {
        login(selected)
      } else {
        setError('Wrong PIN')
        setShaking(true)
        setTimeout(() => {
          setPin('')
          setShaking(false)
        }, 500)
      }
    },
    [selected, pin, login]
  )

  const handleBackspace = useCallback(() => {
    setPin((p) => p.slice(0, -1))
    setError('')
  }, [])

  const handleBack = () => {
    setSelected(null)
    setPin('')
    setError('')
  }

  useEffect(() => {
    if (!selected) return
    const handler = (e) => {
      if (e.key >= '0' && e.key <= '9') handleDigit(e.key)
      else if (e.key === 'Backspace') handleBackspace()
      else if (e.key === 'Escape') handleBack()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selected, handleDigit, handleBackspace])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--ec-bg)' }}>
        <p className="text-sm text-ec-t3">Loading staff...</p>
      </div>
    )
  }

  if (selected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--ec-bg)' }}>
        <div className="w-full max-w-xs flex flex-col items-center ec-fadeup">
          <button
            onClick={handleBack}
            className="self-start mb-6 w-8 h-8 rounded-lg flex items-center justify-center bg-ec-card-hover text-ec-t3 hover:bg-ec-t5 hover:text-ec-t1 transition-colors border-none cursor-pointer"
            aria-label="Back"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg mb-3"
            style={{ background: 'linear-gradient(135deg, var(--ec-em), var(--ec-em-dark))' }}
          >
            {getStaffInitials(selected.name)}
          </div>
          <h2 className="text-lg font-bold text-ec-t1 mb-1">{selected.name}</h2>
          <p className="text-xs text-ec-t3 mb-6">
            {!selected.pin ? 'No PIN set — tap any 4 digits to continue' : 'Enter your 4-digit PIN'}
          </p>

          <div className={`flex gap-3 mb-2 ${shaking ? 'animate-[ecBellShake_0.5s_ease-in-out]' : ''}`}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full transition-all duration-200"
                style={{
                  backgroundColor: i < pin.length ? 'var(--ec-em)' : 'var(--ec-t5)',
                  boxShadow: i < pin.length ? '0 0 8px rgba(16,185,129,0.4)' : 'none',
                }}
              />
            ))}
          </div>
          {error && <p className="text-xs text-ec-crit-light mt-1 mb-2">{error}</p>}

          <div className="grid grid-cols-3 gap-2 mt-4 w-full max-w-[240px]">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((key, i) =>
              key === null ? (
                <div key={i} />
              ) : key === 'del' ? (
                <button
                  key={i}
                  onClick={handleBackspace}
                  className="h-14 rounded-xl flex items-center justify-center bg-ec-card text-ec-t3 hover:bg-ec-t5 transition-colors border-none cursor-pointer"
                  aria-label="Delete"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" />
                    <line x1="18" y1="9" x2="12" y2="15" />
                    <line x1="12" y1="9" x2="18" y2="15" />
                  </svg>
                </button>
              ) : (
                <button
                  key={i}
                  onClick={() => handleDigit(String(key))}
                  className="h-14 rounded-xl flex items-center justify-center bg-ec-card text-ec-t1 text-lg font-semibold hover:bg-ec-t5 active:scale-95 transition-all border-none cursor-pointer font-sans"
                >
                  {key}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--ec-bg)' }}>
      <div className="w-full max-w-2xl ec-fadeup">
        <div className="flex flex-col items-center mb-8">
          <svg viewBox="0 0 40 40" width="44" height="44" className="mb-3">
            <defs>
              <linearGradient id="pin-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
            <rect rx="12" width="40" height="40" fill="url(#pin-grad)" />
            <text x="20" y="26" textAnchor="middle" fill="white" fontWeight="700" fontSize="13" fontFamily="system-ui, sans-serif">iPD</text>
          </svg>
          <h1 className="text-lg font-bold text-ec-t1">Who are you?</h1>
          <p className="text-sm text-ec-t3 mt-1">Tap your name to sign in</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {staff.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-none cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] font-sans"
              style={{
                backgroundColor: 'var(--ec-card)',
                border: '1px solid var(--ec-border)',
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ background: 'linear-gradient(135deg, var(--ec-em), var(--ec-em-dark))' }}
              >
                {getStaffInitials(s.name)}
              </div>
              <span className="text-sm font-medium text-ec-t1">{s.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-ec-em/10 text-ec-em font-semibold capitalize">
                {(s.role || 'staff').replace('_', ' ')}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
