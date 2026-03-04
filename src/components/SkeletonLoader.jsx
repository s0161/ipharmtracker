const Bar = ({ w = '100%', h = '12px', className = '' }) => (
  <div
    className={`rounded animate-pulse ${className}`}
    style={{ width: w, height: h, backgroundColor: 'var(--ec-t5)' }}
  />
)

function TableSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--ec-border)' }}>
      <div className="flex gap-4 px-4 py-3 border-b" style={{ borderColor: 'var(--ec-border)' }}>
        <Bar w="80px" h="10px" /><Bar w="120px" h="10px" /><Bar w="100px" h="10px" /><Bar w="60px" h="10px" />
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b" style={{ borderColor: 'var(--ec-div)', opacity: 1 - i * 0.15 }}>
          <Bar w="70px" /><Bar w="140px" /><Bar w="90px" /><Bar w="50px" />
        </div>
      ))}
    </div>
  )
}

function CardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="rounded-xl p-4 space-y-3"
          style={{ border: '1px solid var(--ec-border)', backgroundColor: 'var(--ec-card)', opacity: 1 - i * 0.15 }}
        >
          <Bar w="60%" h="10px" />
          <Bar w="40%" h="24px" />
          <Bar w="80%" h="8px" />
        </div>
      ))}
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg px-4 py-3"
          style={{ border: '1px solid var(--ec-border)', backgroundColor: 'var(--ec-card)', opacity: 1 - i * 0.15 }}
        >
          <Bar w="20px" h="20px" className="rounded" />
          <div className="flex-1 space-y-1.5">
            <Bar w="60%" h="10px" />
            <Bar w="35%" h="8px" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function SkeletonLoader({ variant = 'table' }) {
  if (variant === 'cards') return <CardsSkeleton />
  if (variant === 'list') return <ListSkeleton />
  return <TableSkeleton />
}
