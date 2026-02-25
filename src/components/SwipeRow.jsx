import { useState, useRef, useEffect } from 'react'

const THRESHOLD = 60
const RESET_MS = 3000

export default function SwipeRow({ children, onEdit, onDelete, className = '' }) {
  const [offset, setOffset] = useState(0)
  const [revealed, setRevealed] = useState(null) // 'left' or 'right'
  const startRef = useRef(null)
  const timerRef = useRef(null)
  const rowRef = useRef(null)

  // Only enable on mobile
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const resetPosition = () => {
    setOffset(0)
    setRevealed(null)
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  const handleTouchStart = (e) => {
    if (!isMobile) return
    startRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    }
  }

  const handleTouchMove = (e) => {
    if (!isMobile || !startRef.current) return
    const dx = e.touches[0].clientX - startRef.current.x
    const dy = e.touches[0].clientY - startRef.current.y

    // If vertical scroll is dominant, don't interfere
    if (Math.abs(dy) > Math.abs(dx)) {
      startRef.current = null
      return
    }

    setOffset(dx)
  }

  const handleTouchEnd = () => {
    if (!isMobile || !startRef.current) return

    if (offset < -THRESHOLD) {
      // Swiped left → reveal edit on right
      setOffset(-80)
      setRevealed('edit')
      timerRef.current = setTimeout(resetPosition, RESET_MS)
    } else if (offset > THRESHOLD) {
      // Swiped right → reveal delete on left
      setOffset(80)
      setRevealed('delete')
      timerRef.current = setTimeout(resetPosition, RESET_MS)
    } else {
      resetPosition()
    }
    startRef.current = null
  }

  if (!isMobile) {
    return <tr className={className}>{children}</tr>
  }

  return (
    <tr
      ref={rowRef}
      className={`swipe-row ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Delete action (left side, shown on swipe right) */}
      {revealed === 'delete' && (
        <td className="swipe-action swipe-action--left" colSpan={1}>
          <button
            className="swipe-btn swipe-btn--delete"
            onClick={() => { onDelete?.(); resetPosition() }}
          >
            Delete
          </button>
        </td>
      )}
      {children}
      {/* Edit action (right side, shown on swipe left) */}
      {revealed === 'edit' && (
        <td className="swipe-action swipe-action--right" colSpan={1}>
          <button
            className="swipe-btn swipe-btn--edit"
            onClick={() => { onEdit?.(); resetPosition() }}
          >
            Edit
          </button>
        </td>
      )}
    </tr>
  )
}
