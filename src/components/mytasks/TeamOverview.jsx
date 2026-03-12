import { useMemo } from 'react'
import Avatar from '../Avatar'
import ProgressRing from '../dashboard/ProgressRing'

export default function TeamOverview({ allTasks, staff, today, onFilterByPerson, activeFilter }) {
  const teamProgress = useMemo(() => {
    return staff
      .map(s => {
        const dayTasks = allTasks.filter(t => t.assignedTo === s.name && t.dueDate === today)
        const doneCount = dayTasks.filter(t => t.status === 'done').length
        const pct = dayTasks.length > 0 ? Math.round((doneCount / dayTasks.length) * 100) : 0
        return { ...s, total: dayTasks.length, done: doneCount, pct }
      })
      .filter(s => s.total > 0)
      .sort((a, b) => a.pct - b.pct)
  }, [allTasks, staff, today])

  if (teamProgress.length === 0) return null

  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 mb-2 px-1">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ec-t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
        <span className="text-[11px] font-bold text-ec-t2 tracking-wide uppercase">Team Today</span>
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {teamProgress.map(member => {
          const isFiltered = activeFilter === member.name
          return (
            <button
              key={member.id || member.name}
              onClick={() => onFilterByPerson?.(isFiltered ? null : member.name)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer shrink-0 transition-all duration-150 bg-ec-card"
              style={{
                fontFamily: "'Inter', sans-serif",
                borderColor: isFiltered ? 'var(--ec-em)' : 'var(--ec-div)',
                backgroundColor: isFiltered ? 'var(--ec-em-bg)' : 'var(--ec-card)',
                boxShadow: isFiltered ? '0 0 0 1px rgba(16,185,129,0.19)' : 'none',
              }}
            >
              <Avatar name={member.name} size={24} />
              <span className="text-[11px] font-semibold text-ec-t1 whitespace-nowrap">
                {member.name.split(' ')[0]}
              </span>
              <ProgressRing pct={member.pct} size={24} sw={2.5} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
