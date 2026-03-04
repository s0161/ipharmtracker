import { useState, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

function Dialog({ title, message, confirmLabel = 'Delete', cancelLabel = 'Cancel', variant = 'danger', onConfirm, onCancel }) {
  const confirmRef = useRef(null)

  useEffect(() => {
    confirmRef.current?.focus()
    const handler = (e) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCancel])

  const btnStyle = variant === 'danger'
    ? { backgroundColor: 'var(--ec-crit)', color: '#fff' }
    : { backgroundColor: 'var(--ec-em)', color: '#fff' }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl p-6 ec-fadeup"
        style={{
          backgroundColor: 'var(--ec-card-solid, var(--ec-bg))',
          border: '1px solid var(--ec-border)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning icon */}
        <div className="flex justify-center mb-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: variant === 'danger' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
            }}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke={variant === 'danger' ? 'var(--ec-crit)' : 'var(--ec-em)'} strokeWidth="2">
              {variant === 'danger' ? (
                <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>
              ) : (
                <><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>
              )}
            </svg>
          </div>
        </div>

        <h3 className="text-base font-semibold text-ec-t1 text-center mb-2">{title}</h3>
        <p className="text-sm text-ec-t3 text-center mb-6 leading-relaxed">{message}</p>

        <div className="flex gap-3">
          <button
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border cursor-pointer transition-colors"
            style={{
              backgroundColor: 'transparent',
              borderColor: 'var(--ec-border)',
              color: 'var(--ec-t2)',
            }}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border-none cursor-pointer transition-colors"
            style={btnStyle}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export function useConfirm() {
  const [state, setState] = useState(null)

  const confirm = useCallback(({ title, message, confirmLabel, cancelLabel, variant } = {}) => {
    return new Promise((resolve) => {
      setState({ title, message, confirmLabel, cancelLabel, variant, resolve })
    })
  }, [])

  const dialog = state ? (
    <Dialog
      title={state.title || 'Are you sure?'}
      message={state.message || 'This action cannot be undone.'}
      confirmLabel={state.confirmLabel}
      cancelLabel={state.cancelLabel}
      variant={state.variant}
      onConfirm={() => { state.resolve(true); setState(null) }}
      onCancel={() => { state.resolve(false); setState(null) }}
    />
  ) : null

  return { confirm, ConfirmDialog: dialog }
}

export default Dialog
