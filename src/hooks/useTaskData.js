import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useSupabase } from './useSupabase'
import { supabase } from '../lib/supabase'
import { useUser } from '../contexts/UserContext'
import { generateId } from '../utils/helpers'
import { generateDailyTasks, getTasksForRole, getTaskStats, isElevatedRole } from '../utils/taskEngine'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Combined hook for the MyTasks page.
 * Fetches templates, tasks, and staff — exposes filtered data + actions.
 */
export function useTaskData() {
  const { user } = useUser()
  const role = user?.role || 'staff'
  const isElevated = isElevatedRole(role)

  const [templates, , templatesLoading] = useSupabase('task_templates', [])
  const [allTasks, setAllTasks, tasksLoading] = useSupabase('staff_tasks', [])
  const [staff] = useSupabase('staff_members', [])

  const seededRef = useRef(false)
  const [savingId, setSavingId] = useState(null)

  const today = todayStr()
  const loading = templatesLoading || tasksLoading

  // Auto-generate today's tasks from templates (once per session)
  useEffect(() => {
    if (loading || seededRef.current || templates.length === 0) return
    seededRef.current = true

    const newTasks = generateDailyTasks(templates, allTasks, today)
    if (newTasks.length > 0) {
      setAllTasks(prev => [...prev, ...newTasks])
    }
  }, [loading, templates.length])

  // Active templates only
  const activeTemplates = useMemo(
    () => templates.filter(t => t.isActive),
    [templates]
  )

  // Tasks filtered by role
  const roleTasks = useMemo(
    () => getTasksForRole(allTasks, templates, role),
    [allTasks, templates, role]
  )

  // My tasks only (assigned to current user by name)
  const myTasks = useMemo(
    () => allTasks.filter(t => t.assignedTo === user?.name),
    [allTasks, user?.name]
  )

  // Stats
  const stats = useMemo(
    () => getTaskStats(isElevated ? roleTasks : myTasks),
    [roleTasks, myTasks, isElevated]
  )

  const todayStats = useMemo(() => {
    const todayTasks = (isElevated ? roleTasks : myTasks).filter(t => t.dueDate === today)
    return getTaskStats(todayTasks)
  }, [roleTasks, myTasks, isElevated, today])

  // Complete a task with optimistic update
  const completeTask = useCallback(async (taskId, notes) => {
    setSavingId(taskId)
    const snapshot = allTasks.map(t => ({ ...t }))

    setAllTasks(prev => prev.map(t =>
      t.id === taskId
        ? { ...t, status: 'done', completedAt: new Date().toISOString(), completedBy: user?.name }
        : t
    ))

    try {
      const { error } = await supabase
        .from('staff_tasks')
        .update({
          status: 'done',
          completed_at: new Date().toISOString(),
          completed_by: user?.name,
          ...(notes ? { notes } : {}),
        })
        .eq('id', taskId)
      if (error) throw error
    } catch (e) {
      console.error('Complete task failed:', e)
      setAllTasks(snapshot)
    } finally {
      setSavingId(null)
    }
  }, [allTasks, setAllTasks, user?.name])

  // Change task status with optimistic update
  const updateStatus = useCallback(async (taskId, newStatus) => {
    setSavingId(taskId)
    const snapshot = allTasks.map(t => ({ ...t }))

    const updates = { status: newStatus }
    if (newStatus === 'done') {
      updates.completedAt = new Date().toISOString()
      updates.completedBy = user?.name
    }

    setAllTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t))

    try {
      const dbUpdates = { status: newStatus }
      if (newStatus === 'done') {
        dbUpdates.completed_at = new Date().toISOString()
        dbUpdates.completed_by = user?.name
      }
      const { error } = await supabase.from('staff_tasks').update(dbUpdates).eq('id', taskId)
      if (error) throw error
    } catch (e) {
      console.error('Status update failed:', e)
      setAllTasks(snapshot)
    } finally {
      setSavingId(null)
    }
  }, [allTasks, setAllTasks, user?.name])

  // Assign a task to a staff member
  const assignTask = useCallback(async (taskId, staffName) => {
    setAllTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, assignedTo: staffName, assignedBy: user?.name } : t
    ))
  }, [setAllTasks, user?.name])

  // Create ad-hoc task (from template or freeform)
  const createTask = useCallback(({ taskName, templateId, assignTo, dueDate, notes, priority, category }) => {
    const newTask = {
      id: generateId(),
      taskName,
      templateId: templateId || null,
      assignedTo: assignTo || null,
      assignedBy: user?.name || null,
      status: 'pending',
      priority: priority || 'normal',
      category: category || null,
      dueDate: dueDate || today,
      notes: notes || null,
      linkedLog: null,
      completedAt: null,
      completedBy: null,
      createdAt: new Date().toISOString(),
    }
    setAllTasks(prev => [newTask, ...prev])
    return newTask
  }, [setAllTasks, user?.name, today])

  return {
    // Data
    tasks: roleTasks,
    myTasks,
    allTasks,
    templates: activeTemplates,
    allTemplates: templates,
    staff,
    // State
    loading,
    savingId,
    today,
    isElevated,
    role,
    // Stats
    stats,
    todayStats,
    // Actions
    completeTask,
    updateStatus,
    assignTask,
    createTask,
    setAllTasks,
  }
}
