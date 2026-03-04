export default function EmptyState({ icon, title, description, actionLabel, onAction }) {
  const defaultIcon = (
    <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  )

  return (
    <div className="ec-fadeup flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-ec-t4 mb-4">{icon || defaultIcon}</div>
      <h3 className="text-sm font-semibold text-ec-t2 mb-1">{title}</h3>
      {description && <p className="text-xs text-ec-t3 max-w-[280px]">{description}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 bg-ec-em text-white rounded-lg text-xs font-semibold border-none cursor-pointer hover:bg-ec-em-dark transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
