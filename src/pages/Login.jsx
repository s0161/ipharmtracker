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
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-logo">iPD</div>
        <h1 className="login-title">iPharmacy Direct</h1>
        <p className="login-subtitle">Compliance Tracker</p>

        <input
          type="password"
          className="input login-input"
          placeholder="Enter password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(false) }}
          autoFocus
        />

        {error && <p className="login-error">Incorrect password</p>}

        <button type="submit" className="btn btn--primary login-btn">
          Log In
        </button>
      </form>
    </div>
  )
}
