import { useState } from 'react'

const AUTH_KEY = 'ipd_auth'
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000

export function isAuthenticated() {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return false
    const { ts } = JSON.parse(raw)
    return ts && Date.now() - ts < THIRTY_DAYS
  } catch {
    return false
  }
}

export function logout() {
  localStorage.removeItem(AUTH_KEY)
}

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (password === 'iPD2026') {
      localStorage.setItem(AUTH_KEY, JSON.stringify({ ts: Date.now() }))
      onLogin()
    } else {
      setError(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--ec-bg)' }}>
      <div
        className="w-full max-w-sm rounded-2xl p-8 ec-fadeup"
        style={{
          backgroundColor: 'var(--ec-card)',
          border: '1px solid var(--ec-t5)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div className="flex flex-col items-center mb-8">
          <svg viewBox="0 0 40 40" width="48" height="48" className="mb-4">
            <defs>
              <linearGradient id="login-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
            <rect rx="12" width="40" height="40" fill="url(#login-grad)" />
            <text x="20" y="26" textAnchor="middle" fill="white" fontWeight="700" fontSize="13" fontFamily="system-ui, sans-serif">iPD</text>
          </svg>
          <h1 className="text-lg font-bold text-ec-t1">iPharmacy Direct</h1>
          <p className="text-sm text-ec-t3 mt-1">Compliance Tracker</p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            className="w-full bg-ec-card border border-ec-border rounded-lg px-4 py-3 text-sm text-ec-t1 placeholder:text-ec-t3 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors font-sans"
            placeholder="Enter password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false) }}
            autoFocus
          />

          {error && (
            <p className="text-xs text-ec-crit-light mt-2 text-center">Incorrect password</p>
          )}

          <button
            type="submit"
            className="w-full mt-4 px-4 py-3 bg-ec-em text-white font-semibold rounded-lg text-sm border-none cursor-pointer hover:bg-ec-em-dark transition-colors font-sans"
          >
            Log In
          </button>
        </form>
      </div>
    </div>
  )
}
