const COLORS = ['#10b981', '#059669', '#34d399', '#6ee7b7', '#fcd34d', '#a78bfa']

export default function Confetti({ show }) {
  if (!show) return null
  const pieces = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    left: 10 + Math.random() * 80,
    delay: Math.random() * 0.4,
    color: COLORS[i % 6],
    size: 4 + Math.random() * 6,
    rotation: Math.random() * 360,
  }))

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {pieces.map(p => (
        <div
          key={p.id}
          className="ec-confetti absolute"
          style={{
            bottom: '40%',
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            borderRadius: p.id % 3 === 0 ? '50%' : 1,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
      <div
        className="ec-flash absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 60%, rgba(16,185,129,0.15), transparent 60%)',
        }}
      />
    </div>
  )
}
