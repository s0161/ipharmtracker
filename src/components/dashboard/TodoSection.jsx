const Check = ({ s = 12, c = 'white' }) => (
  <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
    <path d="M2.5 6L5 8.5L9.5 3.5" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function TodoSection({ todos, checkedTodo, onToggle, mob }) {
  if (!todos || todos.length === 0) return null

  return (
    <div
      className="ec-fadeup rounded-2xl bg-ec-card border border-ec-border p-5 mt-5"
      style={{ animationDelay: '0.5s' }}
    >
      <div className="flex items-center gap-2 mb-3.5">
        <span className="text-[13px] font-bold text-ec-t1">To Do</span>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-[10px]"
          style={{
            backgroundColor: 'rgba(245,158,11,0.08)',
            color: '#fcd34d',
            border: '1px solid rgba(245,158,11,0.12)',
          }}
        >
          {todos.filter(t => !checkedTodo.has(t.id)).length}
        </span>
        <div className="flex-1 h-px bg-ec-div ml-2" />
      </div>

      <div className={`grid gap-1 ${mob ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {todos.map(td => (
          <div
            key={td.id}
            className="flex items-center gap-2 px-1 py-[7px] rounded-md hover:bg-white/[0.02] transition-colors"
          >
            {/* Checkbox */}
            <div
              onClick={() => onToggle(td.id)}
              className="w-[18px] h-[18px] rounded-[5px] shrink-0 cursor-pointer flex items-center justify-center transition-all duration-200"
              style={{
                border: `2px solid ${checkedTodo.has(td.id) ? '#10b981' : 'rgba(255,255,255,0.12)'}`,
                backgroundColor: checkedTodo.has(td.id) ? '#10b981' : 'transparent',
                transitionTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)',
              }}
            >
              {checkedTodo.has(td.id) && <div className="ec-checkpop"><Check s={10} /></div>}
            </div>
            <span
              className={`text-[13px] text-ec-t2 flex-1 transition-opacity duration-300
                ${checkedTodo.has(td.id) ? 'line-through opacity-25' : ''}`}
            >
              {td.title}
            </span>
            {td.days && (
              <span className="text-[10px] text-ec-t4 tabular-nums">{td.days}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
