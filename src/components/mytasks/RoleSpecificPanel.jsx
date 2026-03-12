import { isTaskOverdue } from '../../utils/taskEngine'

export default function RoleSpecificPanel({ role, tasks, todayStats, staff }) {
  if (role === 'superintendent' || role === 'pharmacist') {
    return <SuperintendentStrip tasks={tasks} todayStats={todayStats} />
  }
  if (role === 'manager') {
    return <ManagerStrip tasks={tasks} todayStats={todayStats} />
  }
  if (['technician', 'dispenser', 'aca'].includes(role)) {
    return <ClinicalStrip tasks={tasks} todayStats={todayStats} />
  }
  return null
}

function SuperintendentStrip({ tasks, todayStats }) {
  const overdueTasks = tasks.filter(t => isTaskOverdue(t))
  const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done')

  return (
    <div className="mb-3">
      {/* Stat strip */}
      <div className="flex items-center gap-3 bg-ec-card rounded-xl border border-ec-div px-4 py-2.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ec-em)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
        </svg>
        <span className="text-[11px] font-bold text-ec-t2 tracking-wide uppercase">Superintendent</span>
        <div className="flex-1" />
        <MiniPill label="Completion" value={`${todayStats.completionRate}%`} color={todayStats.completionRate >= 80 ? 'var(--ec-em)' : 'var(--ec-warn)'} />
        <MiniPill label="Overdue" value={overdueTasks.length} color={overdueTasks.length > 0 ? 'var(--ec-crit)' : 'var(--ec-em)'} />
        <MiniPill label="Urgent" value={urgentTasks.length} color={urgentTasks.length > 0 ? 'var(--ec-cat-orange)' : 'var(--ec-em)'} />
      </div>

      {/* Overdue escalations */}
      {overdueTasks.length > 0 && (
        <div className="mt-2 px-4 py-2 rounded-xl border" style={{ backgroundColor: 'var(--ec-crit-bg)', borderColor: 'var(--ec-crit-border)' }}>
          <div className="text-[10px] font-bold tracking-wide mb-1" style={{ color: 'var(--ec-crit)' }}>OVERDUE ESCALATIONS</div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5">
            {overdueTasks.slice(0, 4).map(t => (
              <span key={t.id} className="text-[11px]" style={{ color: 'var(--ec-crit)' }}>
                {t.taskName || t.title}
                {t.assignedTo && <span className="text-ec-t3 ml-1">— {t.assignedTo}</span>}
              </span>
            ))}
            {overdueTasks.length > 4 && (
              <span className="text-[10px] text-ec-t3">+{overdueTasks.length - 4} more</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ManagerStrip({ tasks, todayStats }) {
  const pendingCount = tasks.filter(t => t.status === 'pending').length
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length

  return (
    <div className="flex items-center gap-3 bg-ec-card rounded-xl border border-ec-div px-4 py-2.5 mb-3">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ec-em)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M3 9h18" />
      </svg>
      <span className="text-[11px] font-bold text-ec-t2 tracking-wide uppercase">Manager</span>
      <div className="flex-1" />
      <MiniPill label="Pending" value={pendingCount} color="var(--ec-info)" />
      <MiniPill label="Active" value={inProgressCount} color="var(--ec-warn)" />
      <MiniPill label="Done" value={todayStats.completed} color="var(--ec-em)" />
    </div>
  )
}

function ClinicalStrip({ tasks, todayStats }) {
  const clinicalTasks = tasks.filter(t => ['clinical', 'opening'].includes(t.category) && t.status !== 'done')
  if (clinicalTasks.length === 0) return null

  return (
    <div className="flex items-center gap-3 bg-ec-card rounded-xl border px-4 py-2.5 mb-3" style={{ borderColor: 'var(--ec-cat-purple-border)' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ec-cat-purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
      <span className="text-[11px] font-bold text-ec-t2 tracking-wide uppercase">Clinical Priority</span>
      <div className="flex-1" />
      <span
        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
        style={{ backgroundColor: 'var(--ec-cat-purple-bg)', color: 'var(--ec-cat-purple)', border: '1px solid var(--ec-cat-purple-border)' }}
      >
        {clinicalTasks.length} pending
      </span>
    </div>
  )
}

function MiniPill({ label, value, color }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ backgroundColor: `${color}08` }}>
      <span className="text-[15px] font-extrabold leading-none" style={{ color, fontFamily: "'DM Mono', monospace" }}>{value}</span>
      <span className="text-[8px] font-semibold tracking-wide uppercase" style={{ color: 'var(--ec-t3)' }}>{label}</span>
    </div>
  )
}
