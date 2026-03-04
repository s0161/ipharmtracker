import { useState, useMemo } from 'react'
import { useUser } from '../contexts/UserContext'
import { useSupabase } from '../hooks/useSupabase'
import { logAudit } from '../utils/auditLog'
import { supabase } from '../lib/supabase'
import { getTasksForStaff, getTaskAssignee, getStaffInitials, getRotationList } from '../utils/rotationManager'
import { generateId } from '../utils/helpers'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
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
    logAudit('Created', `Task completed: ${taskName}`, 'My Tasks', user?.name)
    showToast(`${taskName} marked done`)
  }

  // Toggle a manually assigned task
  async function toggleAssigned(task) {
    const newCompleted = !task.completed
    const updated = assignedTasks.map((t) =>
      t.id === task.id
        ? {
            ...t,
            completed: newCompleted,
            completedBy: newCompleted ? user.name : null,
            completedAt: newCompleted ? new Date().toISOString() : null,
          }
        : t
    )
    setAssignedTasks(updated)
    logAudit('Updated', `Assigned task ${newCompleted ? 'completed' : 'reopened'}: ${task.title}`, 'My Tasks', user?.name)
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
    logAudit('Created', `Assigned task: ${assignTitle.trim()} to ${assignName}`, 'My Tasks', user?.name)
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

  const doneCount =
    myRotationTasks.filter((t) => isRotationDone(t.name)).length +
    myAssigned.filter((t) => t.completed).length
  const totalCount = myRotationTasks.length + myAssigned.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ec-t1">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-sm text-ec-t3 mt-1">
          {new Date().toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </p>
      </div>

      {/* My task list */}
      <div
        className="rounded-2xl p-5"
        style={{ backgroundColor: 'var(--ec-card)', border: '1px solid var(--ec-border)' }}
      >
        <h2 className="text-sm font-bold text-ec-t1 flex items-center gap-2 mb-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
          My tasks today
          <span className="text-xs font-semibold text-ec-t3 ml-auto tabular-nums">
            {doneCount}/{totalCount}
          </span>
        </h2>

        {myRotationTasks.length === 0 && myAssigned.length === 0 ? (
          <div className="text-center py-10 text-ec-t3 text-sm">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              width="40"
              height="40"
              className="mx-auto mb-3 opacity-40"
            >
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
            <p>No tasks assigned to you today</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {myRotationTasks.map((task) => {
              const done = isRotationDone(task.name)
              return (
                <li
                  key={task.name}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-ec-card ${done ? 'opacity-50' : ''}`}
                >
                  <button
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                      done
                        ? 'border-ec-em bg-ec-em'
                        : 'border-ec-border bg-transparent'
                    }`}
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
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className={`text-sm text-ec-t1 ${done ? 'line-through' : ''}`}>{task.name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        task.frequency === 'daily'
                          ? 'bg-ec-em/10 text-ec-em'
                          : 'bg-ec-info/10 text-ec-info-light'
                      }`}
                    >
                      {task.isRP ? 'RP' : task.frequency}
                    </span>
                  </div>
                </li>
              )
            })}
            {myAssigned.map((task) => (
              <li
                key={task.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-ec-card ${task.completed ? 'opacity-50' : ''}`}
              >
                <button
                  className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                    task.completed
                      ? 'border-ec-em bg-ec-em'
                      : 'border-ec-border bg-transparent'
                  }`}
                  onClick={() => toggleAssigned(task)}
                  aria-label={task.completed ? 'Completed' : 'Mark done'}
                >
                  {task.completed && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="14" height="14">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    )}
                </button>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className={`text-sm text-ec-t1 ${task.completed ? 'line-through' : ''}`}>{task.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-ec-warn/10 text-ec-warn">
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
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: 'var(--ec-card)', border: '1px solid var(--ec-border)' }}
        >
          <button
            className="w-full flex items-center gap-2 text-sm font-bold text-ec-t1 bg-transparent border-none cursor-pointer p-0 font-sans"
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
              className={`transition-transform duration-200 ml-auto ${teamOpen ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {teamOpen && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-3">
                {teamProgress.map((row) => (
                  <div
                    key={row.name}
                    className="flex items-center gap-2.5 p-3 rounded-xl"
                    style={{ backgroundColor: 'var(--ec-card)', border: '1px solid var(--ec-border)' }}
                  >
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: 'linear-gradient(135deg, var(--ec-em), var(--ec-em-dark))' }}
                    >
                      {getStaffInitials(row.name)}
                    </span>
                    <span className="text-sm text-ec-t1 flex-1 truncate">{row.name}</span>
                    <span>
                      {row.total === 0 ? (
                        <span className="text-xs text-ec-t3">--</span>
                      ) : row.allDone ? (
                        <span className="text-ec-em">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="16" height="16">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                      ) : (
                        <span className="text-xs text-ec-t3 tabular-nums">
                          {row.done}/{row.total}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>

              <button
                className="px-4 py-2.5 bg-ec-em text-white font-semibold rounded-lg text-sm border-none cursor-pointer hover:bg-ec-em-dark transition-colors flex items-center gap-2 mt-4 font-sans"
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
              <form className="space-y-4" onSubmit={handleAssign}>
                <div>
                  <label className="text-xs font-semibold text-ec-t2 mb-1 block">
                    Staff member
                  </label>
                  <select
                    className="w-full bg-ec-card border border-ec-border rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors font-sans"
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
                </div>
                <div>
                  <label className="text-xs font-semibold text-ec-t2 mb-1 block">
                    Task title
                  </label>
                  <input
                    type="text"
                    className="w-full bg-ec-card border border-ec-border rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors font-sans"
                    placeholder="e.g. Restock fridge"
                    value={assignTitle}
                    onChange={(e) => setAssignTitle(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-ec-div">
                  <button
                    type="button"
                    className="px-4 py-2 bg-ec-card-hover text-ec-t2 rounded-lg text-sm border border-ec-border cursor-pointer hover:bg-ec-t5 transition-colors font-sans"
                    onClick={() => setAssignModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-ec-em text-white font-semibold rounded-lg text-sm border-none cursor-pointer hover:bg-ec-em-dark transition-colors font-sans disabled:opacity-40"
                    disabled={!assignName || !assignTitle.trim()}
                  >
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
