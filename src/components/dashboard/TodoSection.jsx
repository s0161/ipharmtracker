import { useState } from 'react'

const Check = ({ s = 12, c = 'white' }) => (
  <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
    <path d="M2.5 6L5 8.5L9.5 3.5" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const XIcon = ({ s = 12 }) => (
  <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
    <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const PlusIcon = ({ s = 14 }) => (
  <svg width={s} height={s} viewBox="0 0 14 14" fill="none">
    <path d="M7 2.5V11.5M2.5 7H11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export default function TodoSection({ todos, onToggle, onAdd, onDelete, mob }) {
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDueDate, setNewDueDate] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = newTitle.trim()
    if (!trimmed) return
    onAdd(trimmed, newDueDate || null)
    setNewTitle('')
    setNewDueDate('')
    setShowForm(false)
  }

  const activeCount = todos ? todos.filter(t => !t.completed).length : 0

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
            backgroundColor: 'var(--ec-warn-faint)',
            color: 'var(--ec-warn)',
            border: '1px solid var(--ec-warn-border)',
          }}
        >
          {activeCount}
        </span>
        <div className="flex-1 h-px bg-ec-div ml-2" />
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 bg-ec-card-hover text-ec-t2 rounded-lg text-xs border border-ec-border cursor-pointer hover:bg-ec-t5 transition-colors font-sans flex items-center gap-1"
        >
          <PlusIcon s={12} />
          Add
        </button>
      </div>

      {/* Add task form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="flex gap-2 mb-3 items-end flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <input
              type="text"
              placeholder="Task title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-ec-card border border-ec-border rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors font-sans"
              autoFocus
            />
          </div>
          <div className="w-[140px]">
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="w-full bg-ec-card border border-ec-border rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors font-sans"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-ec-em text-white font-semibold rounded-lg text-sm border-none cursor-pointer hover:bg-ec-em-dark transition-colors font-sans"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => { setShowForm(false); setNewTitle(''); setNewDueDate('') }}
            className="px-3 py-2 bg-ec-card-hover text-ec-t2 rounded-lg text-sm border border-ec-border cursor-pointer hover:bg-ec-t5 transition-colors font-sans"
          >
            Cancel
          </button>
        </form>
      )}

      {(!todos || todos.length === 0) && !showForm && (
        <p className="text-sm text-ec-t3 py-3">No action items. Click Add to create one.</p>
      )}

      <div className={`grid gap-1 ${mob ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {todos && todos.map(td => (
          <div
            key={td.id}
            className="group flex items-center gap-2 px-1 py-[7px] rounded-md hover:bg-ec-card transition-colors"
          >
            {/* Checkbox */}
            <div
              onClick={() => onToggle(td.id)}
              className="w-[18px] h-[18px] rounded-[5px] shrink-0 cursor-pointer flex items-center justify-center transition-all duration-200"
              style={{
                border: `2px solid ${td.completed ? 'var(--ec-em)' : 'var(--ec-t4)'}`,
                backgroundColor: td.completed ? 'var(--ec-em)' : 'transparent',
                transitionTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)',
              }}
            >
              {td.completed && <div className="ec-checkpop"><Check s={10} /></div>}
            </div>
            <span
              className={`text-[13px] text-ec-t2 flex-1 transition-opacity duration-300
                ${td.completed ? 'line-through opacity-25' : ''}`}
            >
              {td.title}
            </span>
            {td.days && (
              <span className="text-[10px] text-ec-t4 tabular-nums">{td.days}</span>
            )}
            {/* Delete button */}
            <button
              onClick={() => onDelete(td.id)}
              className="opacity-0 group-hover:opacity-100 px-1 py-0.5 bg-transparent text-ec-t4 hover:text-ec-crit-light rounded cursor-pointer border-none transition-all duration-150"
              title="Delete"
            >
              <XIcon s={11} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
