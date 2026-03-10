// ─── Reusable alert count badge ───
// Shows red pill with white text for CRITICAL + HIGH count

export default function AlertBadge({ count }) {
  if (!count || count <= 0) return null
  return (
    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-px rounded-lg min-w-[18px] text-center leading-tight">
      {count > 99 ? '99+' : count}
    </span>
  )
}
