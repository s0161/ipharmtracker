export default function ExpiryBadge({ reviewDate }) {
  if (!reviewDate) return null

  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const review = new Date(reviewDate + 'T00:00:00')
  const diffMs = review - now
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  let color, label, pulse
  if (days < 0) {
    color = 'bg-red-100 text-red-700'
    label = 'Overdue'
    pulse = true
  } else if (days <= 30) {
    color = 'bg-red-100 text-red-700'
    label = `${days}d left`
    pulse = true
  } else if (days <= 90) {
    color = 'bg-amber-100 text-amber-700'
    label = `${days}d left`
    pulse = false
  } else {
    color = 'bg-green-100 text-green-700'
    label = `${days}d`
    pulse = false
  }

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${color}`}>
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
        </span>
      )}
      {label}
    </span>
  )
}
