const PILL_STYLES = {
  green:  { bg: '#dcfce7', text: '#166534' },
  red:    { bg: '#fee2e2', text: '#991b1b' },
  amber:  { bg: '#fef3c7', text: '#92400e' },
  purple: { bg: '#ede9fe', text: '#5b21b6' },
  blue:   { bg: '#dbeafe', text: '#1e40af' },
  teal:   { bg: '#ccfbf1', text: '#134e4a' },
  orange: { bg: '#ffedd5', text: '#9a3412' },
  grey:   { bg: '#f1f5f9', text: '#475569' },
}

export default function EventPill({ event, onClick, size = 'sm' }) {
  const style = PILL_STYLES[event.colour] || PILL_STYLES.grey
  const isLarge = size === 'lg'

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick?.(event, e) }}
      className="border-none cursor-pointer text-left w-full"
      style={{
        background: style.bg,
        color: style.text,
        padding: isLarge ? '6px 8px' : '1px 6px',
        borderRadius: isLarge ? '6px' : '4px',
        fontSize: isLarge ? '12px' : '10px',
        fontWeight: 600,
        lineHeight: isLarge ? '1.4' : '1.5',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        display: 'block',
      }}
      title={event.title}
    >
      {event.title}
    </button>
  )
}

export { PILL_STYLES }
