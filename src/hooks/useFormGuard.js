import { useState, useCallback, useRef } from 'react'

export function useFormGuard(submitFn, { validate } = {}) {
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const lastSubmitRef = useRef(0)

  const guarded = useCallback(async (...args) => {
    const now = Date.now()
    if (now - lastSubmitRef.current < 500) return
    lastSubmitRef.current = now

    if (validate) {
      const errs = validate()
      if (errs && Object.keys(errs).length > 0) {
        setErrors(errs)
        return
      }
    }
    setErrors({})

    if (submitting) return
    setSubmitting(true)
    try {
      await submitFn(...args)
    } finally {
      setSubmitting(false)
    }
  }, [submitFn, validate, submitting])

  const clearError = useCallback((field) => {
    setErrors(prev => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  return { guarded, submitting, errors, clearError }
}
