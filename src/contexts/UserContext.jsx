import { createContext, useContext, useState, useCallback } from 'react'

const UserContext = createContext(null)
const STORAGE_KEY = 'ipd_current_user'

function loadUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
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
    if (match && !!match.isManager !== user.isManager) {
      const updated = { ...user, isManager: !!match.isManager }
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
