import { useMemo } from 'react'
import Avatar from '../Avatar'
import { ROLE_LABELS } from '../../utils/taskEngine'

export default function TeamOverview({ allTasks, staff, today, onFilterByPerson, activeFilter }) {
  const teamProgress = useMemo(() => {
    return staff
      .map(s => {
        const dayTasks = allTasks.filter(t => t.assignedTo === s.name && t.dueDate === today)
        const doneCount = dayTasks.filter(t => t.status === 'done').length
        return { ...s, total: dayTasks.length, done: doneCount }
      })
      .filter(s => s.total > 0)
      .sort((a, b) => (a.done / a.total) - (b.done / b.total))
  }, [allTasks, staff, today])

  if (teamProgress.length === 0) return null

  return (
    <div style={{
      background: 'white', borderRadius: 12, padding: 0,
      border: '1px solid #d1fae5', boxShadow: '0 1px 4px rgba(5,150,105,0.06)',
      overflow: 'hidden', marginBottom: 14,
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(90deg, #064e3b, #059669)',
        padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>Team Progress Today</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, fontFamily: "'DM Mono', monospace", color: 'rgba(255,255,255,0.7)' }}>
          {teamProgress.length} active
        </span>
      </div>

      <div style={{ padding: '10px 14px' }}>
        {teamProgress.map((member, i) => {
          const pct = Math.round((member.done / member.total) * 100)
          const isFiltered = activeFilter === member.name
          return (
            <div
              key={member.id || member.name}
              onClick={() => onFilterByPerson?.(isFiltered ? null : member.name)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px',
                borderBottom: i < teamProgress.length - 1 ? '1px solid #f0fdf4' : 'none',
                cursor: onFilterByPerson ? 'pointer' : 'default',
                background: isFiltered ? '#f0fdf4' : 'transparent',
                borderRadius: 6, transition: 'background 0.15s',
              }}
            >
              <Avatar name={member.name} size={28} />
              <div style={{ width: 110, flexShrink: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>{member.name}</div>
                <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'capitalize' }}>
                  {ROLE_LABELS[member.role] || member.role || 'Staff'}
                </div>
              </div>
              <div style={{ flex: 1, height: 6, background: '#f0fdf4', borderRadius: 3 }}>
                <div style={{
                  width: `${pct}%`, height: '100%', borderRadius: 3, transition: 'width 0.3s',
                  background: pct === 100 ? '#16a34a' : pct > 0 ? '#f59e0b' : '#ef4444',
                }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', fontFamily: "'DM Mono', monospace", width: 32, textAlign: 'right' }}>{pct}%</span>
              {member.done === member.total ? (
                <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 7px', borderRadius: 20, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', whiteSpace: 'nowrap' }}>Done</span>
              ) : (
                <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 7px', borderRadius: 20, background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', whiteSpace: 'nowrap' }}>
                  {member.done}/{member.total}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
