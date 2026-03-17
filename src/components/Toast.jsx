import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastContext = createContext()

export function useToast() {
  return useContext(ToastContext)
}

const MAX_TOASTS = 4

const TOAST_STYLES = {
  success: {
    backgroundColor: 'var(--ec-card-solid)',
    borderLeft: '3px solid var(--ec-em)',
    color: 'var(--ec-t1)',
    boxShadow: 'var(--shadow-md)',
  },
  error: {
    backgroundColor: 'var(--ec-card-solid)',
    borderLeft: '3px solid var(--ec-crit)',
    color: 'var(--ec-crit-border)',
    boxShadow: 'var(--shadow-md)',
  },
  info: {
    backgroundColor: 'var(--ec-card-solid)',
    borderLeft: '3px solid var(--ec-info)',
    color: 'var(--ec-info-border)',
    boxShadow: 'var(--shadow-md)',
  },
  warning: {
    backgroundColor: 'var(--ec-card-solid)',
    borderLeft: '3px solid var(--ec-warn)',
    color: 'var(--ec-t1)',
    boxShadow: 'var(--shadow-md)',
  },
}

const ICON_COLORS = {
  success: 'var(--ec-em)',
  error: 'var(--ec-crit)',
  info: 'var(--ec-info)',
  warning: 'var(--ec-warn)',
}

let nextId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef({})

  const showToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = ++nextId
    setToasts(prev => {
      const next = [...prev, { id, message, type }]
      // Cap at MAX_TOASTS — remove oldest
      if (next.length > MAX_TOASTS) {
        const removed = next.shift()
        clearTimeout(timersRef.current[removed.id])
        delete timersRef.current[removed.id]
      }
      return next
    })
    timersRef.current[id] = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
      delete timersRef.current[id]
    }, duration)
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
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm cursor-pointer min-w-[250px]"
            style={{ ...TOAST_STYLES[t.type], animation: 'toastSlideIn 0.35s cubic-bezier(0.16,1,0.3,1) both' }}
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
              {t.type === 'warning' && (
                <svg viewBox="0 0 24 24" fill="none" stroke={ICON_COLORS.warning} strokeWidth="2.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
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
