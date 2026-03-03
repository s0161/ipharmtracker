import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastContext = createContext()

export function useToast() {
  return useContext(ToastContext)
}

const TOAST_STYLES = {
  success: {
    backgroundColor: '#141414',
    borderLeft: '3px solid #10b981',
    color: '#e4e4e7',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  },
  error: {
    backgroundColor: '#141414',
    borderLeft: '3px solid #ef4444',
    color: '#fca5a5',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  },
  info: {
    backgroundColor: '#141414',
    borderLeft: '3px solid #6366f1',
    color: '#a5b4fc',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  },
}

const ICON_COLORS = {
  success: '#10b981',
  error: '#ef4444',
  info: '#6366f1',
}

let nextId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef({})

  const showToast = useCallback((message, type = 'success') => {
    const id = ++nextId
    setToasts(prev => [...prev, { id, message, type }])
    timersRef.current[id] = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
      delete timersRef.current[id]
    }, 3000)
    return id
  }, [])

  const dismiss = useCallback((id) => {
    clearTimeout(timersRef.current[id])
    delete timersRef.current[id]
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map(t => (
          <div
            key={t.id}
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm cursor-pointer ec-fadeup min-w-[250px]"
            style={TOAST_STYLES[t.type]}
            onClick={() => dismiss(t.id)}
          >
            <span className="w-5 h-5 shrink-0">
              {t.type === 'success' && (
                <svg viewBox="0 0 24 24" fill="none" stroke={ICON_COLORS.success} strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
              {t.type === 'error' && (
                <svg viewBox="0 0 24 24" fill="none" stroke={ICON_COLORS.error} strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              )}
              {t.type === 'info' && (
                <svg viewBox="0 0 24 24" fill="none" stroke={ICON_COLORS.info} strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              )}
            </span>
            <span className="text-sm">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
