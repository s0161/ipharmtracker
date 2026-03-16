import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { PILL_STYLES } from './EventPill'

const CATEGORY_LABELS = {
  document: 'Document',
  training: 'Training',
  appraisal: 'Appraisal',
  temperature: 'Temperature',
  cleaning: 'Cleaning',
  patient_query: 'Patient Query',
  mhra: 'MHRA',
  cd_check: 'CD Check',
  near_miss: 'Near Miss',
  other: 'Other',
}

export default function EventPopover({ event, onClose, anchorPos }) {
  const navigate = useNavigate()
  const ref = useRef(null)

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.addEventListener('mousedown', handleClick)
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [onClose])

  if (!event) return null

  const catStyle = PILL_STYLES[event.colour] || PILL_STYLES.grey
  const catLabel = CATEGORY_LABELS[event.category] || event.category

  // Position: try to place near anchor, fallback to center
  const style = {}
  if (anchorPos) {
    const top = anchorPos.top + anchorPos.height + 8
    const left = Math.min(anchorPos.left, window.innerWidth - 320)
    style.position = 'fixed'
    style.top = `${Math.min(top, window.innerHeight - 240)}px`
    style.left = `${Math.max(8, left)}px`
  } else {
    style.position = 'fixed'
    style.top = '50%'
    style.left = '50%'
    style.transform = 'translate(-50%, -50%)'
  }

  function handleGoTo() {
    if (event.linkTo) {
      const path = event.linkTo.replace('#', '')
      navigate(path)
    }
    onClose()
  }

  return (
    <div
      ref={ref}
      className="z-[200] rounded-xl shadow-lg border border-ec-div"
      style={{
        ...style,
        width: '300px',
        background: 'var(--ec-card, #fff)',
        padding: '16px',
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-bold text-ec-t1 m-0 leading-tight flex-1">
          {event.title}
        </h3>
        <button
          onClick={onClose}
          className="bg-transparent border-none cursor-pointer text-ec-t3 text-base p-0 leading-none hover:text-ec-t1"
        >
          &times;
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: catStyle.bg, color: catStyle.text }}
        >
          {catLabel}
        </span>
        <span className="text-xs text-ec-t3">
          {event.date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>

      {event.detail && (
        <p className="text-xs text-ec-t2 m-0 mb-3 leading-relaxed">
          {event.detail}
        </p>
      )}

      {event.linkTo && (
        <button
          onClick={handleGoTo}
          className="w-full py-2 px-3 rounded-lg border-none cursor-pointer text-xs font-semibold text-white transition-colors"
          style={{ background: 'var(--ec-em, #059669)' }}
          onMouseEnter={e => e.target.style.opacity = '0.9'}
          onMouseLeave={e => e.target.style.opacity = '1'}
        >
          Go to {catLabel} &rarr;
        </button>
      )}
    </div>
  )
}
