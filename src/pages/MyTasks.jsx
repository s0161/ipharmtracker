import { useState, useMemo, useCallback } from 'react'
import { useUser } from '../contexts/UserContext'
import { useTaskData } from '../hooks/useTaskData'
import { getTasksByCategory, isTaskOverdue, CATEGORY_ORDER, isElevatedRole } from '../utils/taskEngine'
import TaskSection from '../components/mytasks/TaskSection'
import TaskSidebar from '../components/mytasks/TaskSidebar'
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
  const {
    tasks, myTasks, allTasks, templates, staff,
    loading, savingId, today, isElevated, role,
    stats, todayStats,
    completeTask, updateStatus, createTask,
  } = useTaskData()

  // UI state
  const [filter, setFilter] = useState('all')
  const [personFilter, setPersonFilter] = useState(null)
  const [openSections, setOpenSections] = useState({})
  const [modalOpen, setModalOpen] = useState(false)
  const [completingTask, setCompletingTask] = useState(null)

  const firstName = user?.name?.split(' ')[0] || 'there'
  const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  // Apply filters
  const filteredTasks = useMemo(() => {
    let list = isElevated ? tasks : myTasks

    if (filter === 'mine') list = list.filter(t => t.assignedTo === user?.name)
    else if (filter === 'overdue') list = list.filter(t => isTaskOverdue(t))
    else if (filter === 'today') list = list.filter(t => t.dueDate === today)

    if (personFilter) list = list.filter(t => t.assignedTo === personFilter)

    return list
  }, [tasks, myTasks, isElevated, filter, personFilter, user?.name, today])

  // Group by category
  const groupedTasks = useMemo(() => {
    const groups = getTasksByCategory(filteredTasks)
    return CATEGORY_ORDER
      .filter(cat => groups[cat]?.length > 0)
      .map(cat => ({ category: cat, tasks: groups[cat] }))
  }, [filteredTasks])

  const toggleSection = useCallback((cat) => {
    setOpenSections(prev => ({ ...prev, [cat]: !prev[cat] }))
  }, [])

  function canModifyTask(task) {
    if (isElevated) return true
    return task.assignedTo === user?.name
  }

  function handleAssign(data) {
    createTask(data)
  }

  if (loading) {
    return (
      <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#f0faf4', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#94a3b8', fontSize: 13 }}>Loading tasks...</p>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#f0faf4', minHeight: '100vh' }}>
      <div style={{ padding: '20px 24px', maxWidth: 1100, margin: '0 auto' }}>

        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#1e293b' }}>{getGreeting()}, {firstName}</div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{dateStr}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {[
              { label: 'Remaining', val: stats.total - stats.completed, bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
              { label: 'Overdue', val: stats.overdue, bg: stats.overdue > 0 ? '#fef2f2' : '#f8fafc', color: stats.overdue > 0 ? '#dc2626' : '#94a3b8', border: stats.overdue > 0 ? '#fecaca' : '#e2e8f0' },
              { label: 'Due Today', val: todayStats.total - todayStats.completed, bg: todayStats.total > todayStats.completed ? '#fffbeb' : '#f8fafc', color: todayStats.total > todayStats.completed ? '#d97706' : '#94a3b8', border: todayStats.total > todayStats.completed ? '#fde68a' : '#e2e8f0' },
            ].map(k => (
              <div key={k.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 14px', borderRadius: 10, background: k.bg, border: `1px solid ${k.border}` }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: k.color, lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>{k.val}</span>
                <span style={{ fontSize: 9, color: k.color, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.8 }}>{k.label}</span>
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
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
            padding: '6px 14px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #d1fae5',
          }}>
            <span style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>
              Filtered: {personFilter}
            </span>
            <button onClick={() => setPersonFilter(null)} style={{
              fontSize: 11, color: '#059669', background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
            }}>Clear</button>
          </div>
        )}

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14, alignItems: 'start' }}>
          {/* LEFT: Task sections */}
          <div>
            {groupedTasks.length === 0 ? (
              <div style={{
                background: 'white', borderRadius: 12, padding: '40px 20px', textAlign: 'center',
                border: '1px solid #d1fae5', boxShadow: '0 1px 4px rgba(5,150,105,0.06)',
              }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>
                </div>
                {filter !== 'all' ? (
                  <>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>No matches</div>
                    <div style={{ fontSize: 13, color: '#94a3b8' }}>
                      No tasks match this filter.{' '}
                      <button onClick={() => { setFilter('all'); setPersonFilter(null) }} style={{ color: '#059669', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>Show all</button>
                    </div>
                  </>
                ) : isElevated ? (
                  <>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>No tasks yet</div>
                    <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>
                      Use the assign button to create the first task.
                    </div>
                    <button onClick={() => setModalOpen(true)} style={{
                      padding: '8px 18px', borderRadius: 99, fontSize: 13, fontWeight: 600,
                      border: 'none', background: '#059669', color: 'white',
                      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      boxShadow: '0 4px 14px rgba(5,150,105,0.4)',
                    }}>
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
                      Assign First Task
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>All caught up!</div>
                    <div style={{ fontSize: 13, color: '#94a3b8' }}>No tasks assigned to you.</div>
                  </>
                )}
              </div>
            ) : (
              groupedTasks.map(({ category, tasks: catTasks }) => (
                <TaskSection
                  key={category}
                  category={category}
                  tasks={catTasks}
                  open={openSections[category] !== false}
                  onToggle={() => toggleSection(category)}
                  today={today}
                  canModify={canModifyTask}
                  onStatusChange={updateStatus}
                  savingId={savingId}
                  onComplete={(task) => setCompletingTask(task)}
                />
              ))
            )}
          </div>

          {/* RIGHT: Sidebar */}
          <TaskSidebar
            tasks={isElevated ? tasks : myTasks}
            todayStats={todayStats}
            filter={filter}
            onFilterChange={(f) => { setFilter(f); setPersonFilter(null) }}
            today={today}
          />
        </div>
      </div>

      {/* FAB (elevated only) */}
      {isElevated && (
        <button onClick={() => setModalOpen(true)} style={{
          position: 'fixed', bottom: 24, right: 24, background: '#059669', color: 'white',
          borderRadius: 99, padding: '10px 20px', fontSize: 13, fontWeight: 600,
          border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(5,150,105,0.4)',
          fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 6,
          zIndex: 50,
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
          Assign Task
        </button>
      )}

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
        onConfirm={completeTask}
      />
    </div>
  )
}
