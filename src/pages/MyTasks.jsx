import { useState, useMemo } from 'react'
import { useUser } from '../contexts/UserContext'
import { useSupabase } from '../hooks/useSupabase'
import { supabase } from '../lib/supabase'
import { getTasksForStaff, getTaskAssignee, getStaffInitials, getRotationList } from '../utils/rotationManager'
import { generateId } from '../utils/helpers'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function MyTasks() {
  const { user } = useUser()
  const [cleaningTasks] = useSupabase('cleaning_tasks', [])
  const [cleaningEntries, setCleaningEntries] = useSupabase('cleaning_entries', [])
  const [assignedTasks, setAssignedTasks] = useSupabase('assigned_tasks', [])
  const [staffMembers] = useSupabase('staff_members', [])
  const showToast = useToast()
  const [assignModal, setAssignModal] = useState(false)
  const [assignName, setAssignName] = useState('')
  const [assignTitle, setAssignTitle] = useState('')
  const [teamOpen, setTeamOpen] = useState(true)

  const today = todayStr()
  const firstName = user?.name?.split(' ')[0] || 'Team'

  // My auto-assigned tasks from rotation
  const myRotationTasks = useMemo(
    () => (user ? getTasksForStaff(user.name, cleaningTasks) : []),
    [user, cleaningTasks]
  )

  // My manually assigned tasks for today
  const myAssigned = useMemo(
    () => assignedTasks.filter((t) => t.staffName === user?.name && t.date === today),
    [assignedTasks, user, today]
  )

  // Check if a rotation task is completed today
  function isRotationDone(taskName) {
    return cleaningEntries.some(
      (e) => e.taskName === taskName && e.dateTime?.startsWith(today)
    )
  }

  // Complete a rotation task
  async function completeRotation(taskName) {
    const entry = {
      id: generateId(),
      taskName,
      dateTime: new Date().toISOString().slice(0, 16),
      staffMember: user.name,
      result: 'Pass',
      notes: '',
      createdAt: new Date().toISOString(),
    }
    setCleaningEntries((prev) => [...prev, entry])
    showToast(`${taskName} marked done`)
  }

  // Toggle a manually assigned task
  async function toggleAssigned(task) {
    const updated = assignedTasks.map((t) =>
      t.id === task.id
        ? {
            ...t,
            completed: !t.completed,
            completedBy: !t.completed ? user.name : null,
            completedAt: !t.completed ? new Date().toISOString() : null,
          }
        : t
    )
    setAssignedTasks(updated)
    showToast(task.completed ? 'Task reopened' : 'Task done')
  }

  // Assign a new task (manager)
  function handleAssign(e) {
    e.preventDefault()
    if (!assignName || !assignTitle.trim()) return
    const newTask = {
      id: generateId(),
      staffName: assignName,
      title: assignTitle.trim(),
      date: today,
      completed: false,
      completedBy: null,
      completedAt: null,
      notes: '',
      createdBy: user.name,
      createdAt: new Date().toISOString(),
    }
    setAssignedTasks((prev) => [...prev, newTask])
    showToast(`Task assigned to ${assignName.split(' ')[0]}`)
    setAssignModal(false)
    setAssignName('')
    setAssignTitle('')
  }

  // --- Manager: team progress ---
  const allStaff = useMemo(() => staffMembers.map((s) => s.name || s), [staffMembers])
  const rotation = getRotationList()

  const teamProgress = useMemo(() => {
    if (!user?.isManager) return []
    return allStaff.map((name) => {
      const tasks = getTasksForStaff(name, cleaningTasks)
      const assigned = assignedTasks.filter((t) => t.staffName === name && t.date === today)
      const rotDone = tasks.filter((t) => isRotationDone(t.name)).length
      const asgDone = assigned.filter((t) => t.completed).length
      const total = tasks.length + assigned.length
      const done = rotDone + asgDone
      return { name, total, done, allDone: total > 0 && done === total }
    })
  }, [user, allStaff, cleaningTasks, assignedTasks, cleaningEntries, today])

  return (
    <div className="my-tasks">
      <div className="my-tasks-header">
        <h1 className="my-tasks-greeting">
          {getGreeting()}, {firstName}
        </h1>
        <p className="my-tasks-date">
          {new Date().toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </p>
      </div>

      {/* My task list */}
      <div className="my-tasks-section">
        <h2 className="my-tasks-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
          My tasks today
          <span className="my-tasks-count">
            {myRotationTasks.filter((t) => isRotationDone(t.name)).length +
              myAssigned.filter((t) => t.completed).length}
            /{myRotationTasks.length + myAssigned.length}
          </span>
        </h2>

        {myRotationTasks.length === 0 && myAssigned.length === 0 ? (
          <div className="my-tasks-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
            <p>No tasks assigned to you today</p>
          </div>
        ) : (
          <ul className="my-tasks-list">
            {myRotationTasks.map((task) => {
              const done = isRotationDone(task.name)
              return (
                <li key={task.name} className={`my-task-item ${done ? 'my-task-item--done' : ''}`}>
                  <button
                    className={`my-task-check ${done ? 'my-task-check--done' : ''}`}
                    onClick={() => !done && completeRotation(task.name)}
                    disabled={done}
                    aria-label={done ? 'Completed' : 'Mark done'}
                  >
                    {done && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="14" height="14">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                  <div className="my-task-info">
                    <span className="my-task-name">{task.name}</span>
                    <span className={`my-task-freq my-task-freq--${task.frequency}`}>
                      {task.isRP ? 'RP' : task.frequency}
                    </span>
                  </div>
                </li>
              )
            })}
            {myAssigned.map((task) => (
              <li
                key={task.id}
                className={`my-task-item ${task.completed ? 'my-task-item--done' : ''}`}
              >
                <button
                  className={`my-task-check ${task.completed ? 'my-task-check--done' : ''}`}
                  onClick={() => toggleAssigned(task)}
                  aria-label={task.completed ? 'Completed' : 'Mark done'}
                >
                  {task.completed && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="14" height="14">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    )}
                </button>
                <div className="my-task-info">
                  <span className="my-task-name">{task.title}</span>
                  <span className="my-task-freq my-task-freq--assigned">
                    Assigned by {task.createdBy?.split(' ')[0] || '?'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Manager: Team Progress */}
      {user?.isManager && (
        <div className="my-tasks-section my-tasks-manager">
          <button
            className="my-tasks-section-title my-tasks-section-title--toggle"
            onClick={() => setTeamOpen(!teamOpen)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
            Team Progress Today
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              width="16"
              height="16"
              className={`my-tasks-chevron ${teamOpen ? 'my-tasks-chevron--open' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {teamOpen && (
            <>
              <div className="team-grid">
                {teamProgress.map((row) => (
                  <div
                    key={row.name}
                    className={`team-row ${row.allDone ? 'team-row--done' : ''} ${row.total === 0 ? 'team-row--none' : ''}`}
                  >
                    <span className="team-avatar">{getStaffInitials(row.name)}</span>
                    <span className="team-name">{row.name}</span>
                    <span className="team-progress">
                      {row.total === 0 ? (
                        <span className="team-na">--</span>
                      ) : row.allDone ? (
                        <span className="team-tick">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="16" height="16">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                      ) : (
                        <span className="team-pending">
                          {row.done}/{row.total}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>

              <button
                className="btn btn--primary my-tasks-assign-btn"
                onClick={() => setAssignModal(true)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Assign Task
              </button>
            </>
          )}

          {/* Assign modal */}
          {assignModal && (
            <Modal onClose={() => setAssignModal(false)} title="Assign Task">
              <form className="assign-form" onSubmit={handleAssign}>
                <label className="assign-label">
                  Staff member
                  <select
                    className="input"
                    value={assignName}
                    onChange={(e) => setAssignName(e.target.value)}
                  >
                    <option value="">Select staff...</option>
                    {allStaff.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="assign-label">
                  Task title
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Restock fridge"
                    value={assignTitle}
                    onChange={(e) => setAssignTitle(e.target.value)}
                  />
                </label>
                <div className="assign-actions">
                  <button type="button" className="btn btn--ghost" onClick={() => setAssignModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn--primary" disabled={!assignName || !assignTitle.trim()}>
                    Assign
                  </button>
                </div>
              </form>
            </Modal>
          )}
        </div>
      )}
    </div>
  )
}
