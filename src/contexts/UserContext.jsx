import { createContext, useContext, useState, useCallback } from 'react'
import { STAFF_ROLES } from '../utils/taskEngine'

const UserContext = createContext(null)
const STORAGE_KEY = 'ipd_current_user'

function loadUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const u = JSON.parse(raw)
    // Backfill role for users stored before role was added
    if (u && !u.role) {
      u.role = STAFF_ROLES[u.name] || 'staff'
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
    }
    return u
  } catch {
    return null
  }
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(loadUser)

  const login = useCallback((staffRow) => {
    const u = {
      id: staffRow.id,
      name: staffRow.name,
      isManager: !!staffRow.isManager,
      role: staffRow.role || STAFF_ROLES[staffRow.name] || 'staff',
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
    setUser(u)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

  const refreshUser = useCallback((staffRows) => {
    if (!user) return
    const match = staffRows.find((s) => s.name === user.name)
    if (!match) return
    const newManager = !!match.isManager
    const newRole = match.role || STAFF_ROLES[match.name] || 'staff'
    if (newManager !== user.isManager || newRole !== user.role) {
      const updated = { ...user, isManager: newManager, role: newRole }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      setUser(updated)
    }
  }, [user])

  return (
    <UserContext.Provider value={{ user, login, logout, refreshUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
