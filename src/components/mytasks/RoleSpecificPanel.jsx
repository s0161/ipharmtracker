import { isTaskOverdue } from '../../utils/taskEngine'
import ProgressRing from '../dashboard/ProgressRing'

export default function RoleSpecificPanel({ role, tasks, todayStats, staff }) {
  if (role === 'superintendent' || role === 'pharmacist') {
    return <SuperintendentPanel tasks={tasks} todayStats={todayStats} staff={staff} />
  }
  if (role === 'manager') {
    return <ManagerPanel tasks={tasks} todayStats={todayStats} />
  }
  if (['technician', 'dispenser', 'aca'].includes(role)) {
    return <ClinicalPanel tasks={tasks} todayStats={todayStats} />
  }
  return null
}

function SuperintendentPanel({ tasks, todayStats, staff }) {
  const overdueTasks = tasks.filter(t => isTaskOverdue(t))
  const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done')

  return (
    <div style={{
      background: 'white', borderRadius: 12, padding: '14px 16px', marginBottom: 14,
      border: '1px solid #d1fae5', boxShadow: '0 1px 4px rgba(5,150,105,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
        </svg>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Superintendent Overview</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <MiniStat label="Completion" value={`${todayStats.completionRate}%`} color={todayStats.completionRate >= 80 ? '#16a34a' : '#d97706'} />
        <MiniStat label="Overdue" value={overdueTasks.length} color={overdueTasks.length > 0 ? '#dc2626' : '#16a34a'} />
        <MiniStat label="Urgent" value={urgentTasks.length} color={urgentTasks.length > 0 ? '#ea580c' : '#16a34a'} />
      </div>

      {overdueTasks.length > 0 && (
        <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>OVERDUE ESCALATIONS</div>
          {overdueTasks.slice(0, 3).map(t => (
            <div key={t.id} style={{ fontSize: 11, color: '#991b1b', padding: '2px 0' }}>
              {t.taskName || t.title} {t.assignedTo && <span style={{ color: '#94a3b8' }}>— {t.assignedTo}</span>}
            </div>
          ))}
          {overdueTasks.length > 3 && (
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>+{overdueTasks.length - 3} more</div>
          )}
        </div>
      )}
    </div>
  )
}

function ManagerPanel({ tasks, todayStats }) {
  const pendingCount = tasks.filter(t => t.status === 'pending').length
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length

  return (
    <div style={{
      background: 'white', borderRadius: 12, padding: '14px 16px', marginBottom: 14,
      border: '1px solid #d1fae5', boxShadow: '0 1px 4px rgba(5,150,105,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M3 9h18" />
        </svg>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Manager Dashboard</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <MiniStat label="Pending" value={pendingCount} color="#2563eb" />
        <MiniStat label="Active" value={inProgressCount} color="#d97706" />
        <MiniStat label="Done" value={todayStats.completed} color="#16a34a" />
      </div>
    </div>
  )
}

function ClinicalPanel({ tasks, todayStats }) {
  const clinicalTasks = tasks.filter(t => ['clinical', 'opening'].includes(t.category) && t.status !== 'done')

  if (clinicalTasks.length === 0) return null

  return (
    <div style={{
      background: 'white', borderRadius: 12, padding: '14px 16px', marginBottom: 14,
      border: '1px solid #e9d5ff', boxShadow: '0 1px 4px rgba(147,51,234,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Clinical Priority</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 20, background: '#fdf4ff', color: '#9333ea', border: '1px solid #e9d5ff' }}>
          {clinicalTasks.length} pending
        </span>
      </div>
      {clinicalTasks.slice(0, 3).map(t => (
        <div key={t.id} style={{ fontSize: 11, color: '#64748b', padding: '3px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: t.priority === 'urgent' ? '#dc2626' : '#9333ea', flexShrink: 0 }} />
          {t.taskName || t.title}
        </div>
      ))}
    </div>
  )
}

function MiniStat({ label, value, color }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '8px 4px', borderRadius: 8, background: `${color}08`,
    }}>
      <span style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>{value}</span>
      <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: 2 }}>{label}</span>
    </div>
  )
}
