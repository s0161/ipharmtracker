import { useState, useMemo, useCallback } from 'react'
import { useUser } from '../contexts/UserContext'
import { useTaskData } from '../hooks/useTaskData'
import { useToast } from '../components/Toast'
import { getTasksByUrgency, isTaskOverdue, isElevatedRole } from '../utils/taskEngine'
import ProgressRing from '../components/dashboard/ProgressRing'
import FilterBar from '../components/mytasks/FilterBar'
import TaskGroup from '../components/mytasks/TaskGroup'
import BoardView from '../components/mytasks/BoardView'
import CompletionFlow from '../components/mytasks/CompletionFlow'
import AssignModal from '../components/mytasks/AssignModal'
import TeamOverview from '../components/mytasks/TeamOverview'
import RoleSpecificPanel from '../components/mytasks/RoleSpecificPanel'

// Spinner keyframe (injected once)
if (typeof document !== 'undefined' && !document.getElementById('task-spinner-css')) {
  const s = document.createElement('style')
  s.id = 'task-spinner-css'
  s.textContent = '@keyframes taskSpin { to { transform: rotate(360deg) } }'
  document.head.appendChild(s)
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function MyTasks() {
  const { user } = useUser()
  const toast = useToast()
  const {
    tasks, myTasks, allTasks, templates, staff,
    loading, savingId, today, isElevated, role,
    stats, todayStats,
    completeTask, updateStatus, createTask,
  } = useTaskData()

  // UI state
  const [filter, setFilter] = useState('all')
  const [personFilter, setPersonFilter] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState(() => new Set())
  const [view, setView] = useState(() => {
    const saved = localStorage.getItem('ipd_tasks_view')
    return saved === 'board' ? 'board' : 'tiles'
  })
  const [modalOpen, setModalOpen] = useState(false)
  const [completingTask, setCompletingTask] = useState(null)

  const firstName = user?.name?.split(' ')[0] || 'there'
  const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  // Persist view preference
  const handleViewChange = useCallback((v) => {
    setView(v)
    localStorage.setItem('ipd_tasks_view', v)
  }, [])

  // Toggle category filter
  const handleCategoryToggle = useCallback((cat) => {
    setCategoryFilter(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }, [])

  // Apply filters
  const filteredTasks = useMemo(() => {
    let list = isElevated ? tasks : myTasks

    if (filter === 'mine') list = list.filter(t => t.assignedTo === user?.name)
    else if (filter === 'overdue') list = list.filter(t => isTaskOverdue(t))
    else if (filter === 'today') list = list.filter(t => t.dueDate === today)

    if (personFilter) list = list.filter(t => t.assignedTo === personFilter)
    if (categoryFilter.size > 0) list = list.filter(t => categoryFilter.has(t.category))

    return list
  }, [tasks, myTasks, isElevated, filter, personFilter, categoryFilter, user?.name, today])

  // Group by urgency for list view
  const urgencyGroups = useMemo(() => getTasksByUrgency(filteredTasks), [filteredTasks])

  const overdueCount = useMemo(() => (isElevated ? tasks : myTasks).filter(t => isTaskOverdue(t)).length, [tasks, myTasks, isElevated])

  function canModifyTask(task) {
    if (isElevated) return true
    return task.assignedTo === user?.name
  }

  function handleAssign(data) {
    createTask(data)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: "'Inter', sans-serif", background: 'var(--ec-bg)' }}>
        <p className="text-ec-t3 text-[13px]">Loading tasks...</p>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: 'var(--ec-bg)', minHeight: '100vh' }}>
      <div className="px-4 sm:px-6 py-5 max-w-[960px] mx-auto">

        {/* Header strip */}
        <div className="page-header-panel flex flex-col sm:flex-row sm:items-center gap-3 mb-4" style={{ background: 'linear-gradient(135deg, #f8fffe 0%, #ecfdf5 100%)', border: '1.5px solid rgba(16,185,129,0.25)', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 3px rgba(10,37,64,0.08), 0 4px 12px rgba(10,37,64,0.04)' }}>
          <div className="flex-1">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 4, height: 40, borderRadius: 4, background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)', flexShrink: 0 }} />
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{getGreeting()}, {firstName}</h1>
            </div>
            <p className="text-[13px] text-ec-t3 m-0 mt-0.5">{dateStr}</p>
          </div>

          {/* Inline stats */}
          <div className="flex items-center gap-2">
            <ProgressRing pct={todayStats.completionRate} size={48} sw={4} />
            {[
              { label: 'Remaining', val: stats.total - stats.completed, bg: 'var(--ec-info-bg)', color: 'var(--ec-info)', border: 'var(--ec-info-border)' },
              { label: 'Overdue', val: stats.overdue, bg: stats.overdue > 0 ? 'var(--ec-crit-bg)' : 'var(--ec-card-hover)', color: stats.overdue > 0 ? 'var(--ec-crit)' : 'var(--ec-t3)', border: stats.overdue > 0 ? 'var(--ec-crit-border)' : 'var(--ec-t5)' },
              { label: 'Due Today', val: todayStats.total - todayStats.completed, bg: todayStats.total > todayStats.completed ? 'var(--ec-warn-bg)' : 'var(--ec-card-hover)', color: todayStats.total > todayStats.completed ? 'var(--ec-warn)' : 'var(--ec-t3)', border: todayStats.total > todayStats.completed ? 'var(--ec-warn-border)' : 'var(--ec-t5)' },
            ].map(k => (
              <div key={k.label} className="flex flex-col items-center px-3 py-1.5 rounded-lg" style={{ background: k.bg, border: `1px solid ${k.border}` }}>
                <span className="text-lg font-extrabold leading-none" style={{ color: k.color, fontFamily: "'DM Mono', monospace" }}>{k.val}</span>
                <span className="text-[8px] font-semibold tracking-wide uppercase mt-0.5" style={{ color: k.color, opacity: 0.8 }}>{k.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Role-specific panel */}
        <RoleSpecificPanel role={role} tasks={filteredTasks} todayStats={todayStats} staff={staff} />

        {/* Team overview (elevated only) */}
        {isElevated && (
          <TeamOverview
            allTasks={allTasks}
            staff={staff}
            today={today}
            onFilterByPerson={(name) => setPersonFilter(name)}
            activeFilter={personFilter}
          />
        )}

        {/* Person filter indicator */}
        {personFilter && (
          <div className="flex items-center gap-2 mb-3 px-3 py-1.5 rounded-lg" style={{ background: 'var(--ec-em-bg)', border: '1px solid var(--ec-em-border)' }}>
            <span className="text-[12px] font-semibold" style={{ color: 'var(--ec-em)' }}>Filtered: {personFilter}</span>
            <button onClick={() => setPersonFilter(null)} className="text-[11px] font-semibold bg-transparent border-none cursor-pointer" style={{ color: 'var(--ec-em)', fontFamily: "'Inter', sans-serif" }}>Clear</button>
          </div>
        )}

        {/* Filter bar */}
        <FilterBar
          filter={filter}
          onFilterChange={(f) => { setFilter(f); setPersonFilter(null) }}
          categoryFilter={categoryFilter}
          onCategoryToggle={handleCategoryToggle}
          view={view}
          onViewChange={handleViewChange}
          tasks={isElevated ? tasks : myTasks}
          isElevated={isElevated}
          onAssignClick={() => setModalOpen(true)}
          overdueCount={overdueCount}
        />

        {/* Content: tiles or board */}
        {filteredTasks.length === 0 ? (
          <EmptyState filter={filter} isElevated={isElevated} onShowAll={() => { setFilter('all'); setPersonFilter(null); setCategoryFilter(new Set()) }} onAssign={() => setModalOpen(true)} />
        ) : view === 'board' ? (
          <BoardView
            tasks={filteredTasks}
            today={today}
            onStatusChange={updateStatus}
            onComplete={(task) => setCompletingTask(task)}
            savingId={savingId}
            canModify={canModifyTask}
          />
        ) : (
          <>
            <TaskGroup groupKey="overdue" tasks={urgencyGroups.overdue} today={today} onStatusChange={updateStatus} onComplete={(task) => setCompletingTask(task)} savingId={savingId} canModify={canModifyTask} />
            <TaskGroup groupKey="dueToday" tasks={urgencyGroups.dueToday} today={today} onStatusChange={updateStatus} onComplete={(task) => setCompletingTask(task)} savingId={savingId} canModify={canModifyTask} />
            <TaskGroup groupKey="upcoming" tasks={urgencyGroups.upcoming} today={today} onStatusChange={updateStatus} onComplete={(task) => setCompletingTask(task)} savingId={savingId} canModify={canModifyTask} />
            <TaskGroup groupKey="completed" tasks={urgencyGroups.completed} today={today} onStatusChange={updateStatus} onComplete={(task) => setCompletingTask(task)} savingId={savingId} canModify={canModifyTask} defaultOpen={false} />
          </>
        )}
      </div>

      {/* Assign Modal */}
      <AssignModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        staff={staff}
        templates={templates}
        onAssign={handleAssign}
      />

      {/* Completion Flow */}
      <CompletionFlow
        task={completingTask}
        open={!!completingTask}
        onClose={() => setCompletingTask(null)}
        onConfirm={(...args) => {
          try {
            completeTask(...args)
            toast('Task marked complete', 'success')
          } catch {
            toast('Failed to complete task', 'error')
          }
        }}
      />
    </div>
  )
}

function EmptyState({ filter, isElevated, onShowAll, onAssign }) {
  return (
    <div className="bg-ec-card rounded-xl border border-ec-div py-10 px-5 text-center" style={{ boxShadow: '0 1px 4px rgba(5,150,105,0.06)' }}>
      <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: 'var(--ec-em-bg)' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--ec-em)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>
      </div>
      {filter !== 'all' ? (
        <>
          <div className="text-base font-semibold text-ec-t1 mb-1">No matches</div>
          <div className="text-[13px] text-ec-t3">
            No tasks match this filter.{' '}
            <button onClick={onShowAll} className="font-semibold bg-transparent border-none cursor-pointer text-[13px]" style={{ color: 'var(--ec-em)', fontFamily: "'Inter', sans-serif" }}>Show all</button>
          </div>
        </>
      ) : isElevated ? (
        <>
          <div className="text-base font-semibold text-ec-t1 mb-1">No tasks yet</div>
          <div className="text-[13px] text-ec-t3 mb-3">Use the assign button to create the first task.</div>
          <button
            onClick={onAssign}
            className="px-5 py-2 rounded-full text-[13px] font-semibold border-none cursor-pointer inline-flex items-center gap-1.5"
            style={{ fontFamily: "'Inter', sans-serif", background: 'var(--ec-em)', color: 'white', boxShadow: '0 4px 14px rgba(16,185,129,0.4)' }}
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
            Assign First Task
          </button>
        </>
      ) : (
        <>
          <div className="text-base font-semibold text-ec-t1 mb-1">All caught up!</div>
          <div className="text-[13px] text-ec-t3">No tasks assigned to you.</div>
        </>
      )}
    </div>
  )
}
