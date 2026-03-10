export default function SOPAlertBanner({ sops }) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const flagged = sops.filter(sop => {
    if (!sop.reviewDate) return false
    const review = new Date(sop.reviewDate + 'T00:00:00')
    const days = Math.ceil((review - now) / (1000 * 60 * 60 * 24))
    return days <= 90
  })

  if (flagged.length === 0) return null

  const hasOverdue = flagged.some(sop => {
    const review = new Date(sop.reviewDate + 'T00:00:00')
    return review < now
  })

  const bgColor = hasOverdue ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
  const textColor = hasOverdue ? 'text-red-700' : 'text-amber-700'
  const iconColor = hasOverdue ? 'text-red-500' : 'text-amber-500'

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border mb-4 ${bgColor}`}>
      <svg className={`shrink-0 w-5 h-5 mt-0.5 ${iconColor}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <div>
        <p className={`text-xs font-semibold ${textColor} mb-1`}>
          {hasOverdue ? 'SOPs overdue for review' : 'SOPs due for review soon'}
        </p>
        <div className="flex flex-wrap gap-1">
          {flagged.map(sop => (
            <span
              key={sop.id}
              className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                new Date(sop.reviewDate + 'T00:00:00') < now
                  ? 'bg-red-100 text-red-600'
                  : 'bg-amber-100 text-amber-600'
              }`}
            >
              {sop.code}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
