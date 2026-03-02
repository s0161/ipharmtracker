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
      // 4 digits entered — verify
      setPin(next)
      if (!selected.pin || selected.pin === next) {
        // Correct or no PIN set — log in
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

  // Keyboard support
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
      <div className="pin-screen">
        <div className="pin-loading">Loading staff...</div>
      </div>
    )
  }

  // PIN entry view
  if (selected) {
    return (
      <div className="pin-screen">
        <div className="pin-entry">
          <button className="pin-back" onClick={handleBack} aria-label="Back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="pin-avatar pin-avatar--lg">
            {getStaffInitials(selected.name)}
          </div>
          <h2 className="pin-name">{selected.name}</h2>
          {!selected.pin ? (
            <p className="pin-hint">No PIN set — tap any 4 digits to continue</p>
          ) : (
            <p className="pin-hint">Enter your 4-digit PIN</p>
          )}
          <div className={`pin-dots ${shaking ? 'pin-dots--shake' : ''}`}>
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`pin-dot ${i < pin.length ? 'pin-dot--filled' : ''}`}
              />
            ))}
          </div>
          {error && <p className="pin-error">{error}</p>}
          <div className="pin-pad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((key, i) =>
              key === null ? (
                <div key={i} className="pin-key pin-key--empty" />
              ) : key === 'del' ? (
                <button
                  key={i}
                  className="pin-key pin-key--del"
                  onClick={handleBackspace}
                  aria-label="Delete"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                    <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" />
                    <line x1="18" y1="9" x2="12" y2="15" />
                    <line x1="12" y1="9" x2="18" y2="15" />
                  </svg>
                </button>
              ) : (
                <button
                  key={i}
                  className="pin-key"
                  onClick={() => handleDigit(String(key))}
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

  // Staff selection grid
  return (
    <div className="pin-screen">
      <div className="pin-select">
        <div className="pin-header">
          <svg className="pin-logo" viewBox="0 0 40 40">
            <rect rx="10" width="40" height="40" fill="#166534" />
            <text x="20" y="26" textAnchor="middle" fill="white" fontWeight="700" fontSize="13" fontFamily="DM Sans, sans-serif">iPD</text>
          </svg>
          <h1 className="pin-title">Who are you?</h1>
          <p className="pin-subtitle">Tap your name to sign in</p>
        </div>
        <div className="pin-grid">
          {staff.map((s) => (
            <button
              key={s.id}
              className="pin-staff-btn"
              onClick={() => setSelected(s)}
            >
              <span className="pin-avatar">{getStaffInitials(s.name)}</span>
              <span className="pin-staff-name">{s.name}</span>
              {s.isManager && <span className="pin-manager-badge">Manager</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
