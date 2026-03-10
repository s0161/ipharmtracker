export default function AckBadge({ acknowledged }) {
  if (acknowledged) {
    return (
      <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
        ✓ Acknowledged
      </span>
    )
  }

  return (
    <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-ec-card-hover text-ec-t3">
      Pending
    </span>
  )
}
