export default function ClassificationBanner({ alerts, onFilterClass1 }) {
  const class1Count = alerts.filter(a => a.classification === 'Class 1').length
  if (class1Count === 0) return null

  return (
    <button
      onClick={onFilterClass1}
      className="w-full flex items-center gap-3 p-3 rounded-xl border border-ec-crit/30 bg-ec-crit/10 mb-4 cursor-pointer transition hover:bg-ec-crit/15 text-left"
      style={{ border: 'none' }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-ec-crit shrink-0">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <span className="text-sm font-semibold text-ec-crit">
        {class1Count} Class 1 alert{class1Count !== 1 ? 's' : ''} require immediate action — click to review
      </span>
    </button>
  )
}
