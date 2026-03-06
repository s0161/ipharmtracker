import ProgressRing from '../dashboard/ProgressRing'
import { isTaskOverdue } from '../../utils/taskEngine'

const FILTERS = [
  { key: 'all', label: 'All Tasks' },
  { key: 'mine', label: 'My Tasks' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'today', label: 'Due Today' },
]

export default function TaskSidebar({ tasks, todayStats, filter, onFilterChange, today }) {
  const overdueCount = tasks.filter(t => isTaskOverdue(t)).length
  const dueTodayCount = tasks.filter(t => t.dueDate === today && t.status !== 'done').length
  const remaining = tasks.filter(t => t.status !== 'done').length

  return (
    <div style={{
      background: 'white', borderRadius: 12, padding: '16px',
      border: '1px solid #d1fae5', boxShadow: '0 1px 4px rgba(5,150,105,0.06)',
    }}>
      {/* Completion ring */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #d1fae5' }}>
        <ProgressRing pct={todayStats.completionRate} size={64} sw={5} />
        <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginTop: 8 }}>Today's Progress</div>
        <div style={{ fontSize: 11, color: '#64748b' }}>
          {todayStats.completed}/{todayStats.total} tasks done
        </div>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #d1fae5' }}>
        <StatChip label="Remaining" value={remaining} bg="#eff6ff" color="#2563eb" border="#bfdbfe" />
        <StatChip label="Overdue" value={overdueCount} bg={overdueCount > 0 ? '#fef2f2' : '#f8fafc'} color={overdueCount > 0 ? '#dc2626' : '#94a3b8'} border={overdueCount > 0 ? '#fecaca' : '#e2e8f0'} />
        <StatChip label="Due Today" value={dueTodayCount} bg={dueTodayCount > 0 ? '#fffbeb' : '#f8fafc'} color={dueTodayCount > 0 ? '#d97706' : '#94a3b8'} border={dueTodayCount > 0 ? '#fde68a' : '#e2e8f0'} />
        <StatChip label="Done" value={todayStats.completed} bg="#f0fdf4" color="#16a34a" border="#bbf7d0" />
      </div>

      {/* Quick filters */}
      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
        Quick Filters
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => onFilterChange(f.key)}
            style={{
              padding: '6px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: 'none', textAlign: 'left', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              background: filter === f.key ? '#059669' : 'transparent',
              color: filter === f.key ? 'white' : '#64748b',
              transition: 'all 0.15s',
            }}
          >
            {f.label}
            {f.key === 'overdue' && overdueCount > 0 && (
              <span style={{
                marginLeft: 6, fontSize: 10, fontWeight: 700, padding: '0 5px', borderRadius: 10,
                background: filter === f.key ? 'rgba(255,255,255,0.2)' : '#fef2f2',
                color: filter === f.key ? 'white' : '#dc2626',
              }}>{overdueCount}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function StatChip({ label, value, bg, color, border }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '8px', borderRadius: 10, background: bg, border: `1px solid ${border}`,
    }}>
      <span style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>{value}</span>
      <span style={{ fontSize: 9, color, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.8 }}>{label}</span>
    </div>
  )
}
