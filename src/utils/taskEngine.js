import { generateId } from './helpers'

// Roles that can see/manage all tasks
const ELEVATED_ROLES = ['superintendent', 'manager', 'pharmacist']

/**
 * Check if a template should generate a task for the given date.
 */
function isTemplateDue(template, date) {
  const d = new Date(date + 'T00:00:00')
  const dow = d.getDay() // 0=Sun..6=Sat
  const dom = d.getDate()
  const wk = Math.ceil(((d - new Date(d.getFullYear(), 0, 1)) / 86400000 + 1) / 7)

  switch (template.frequency) {
    case 'daily':
      return true
    case 'weekly':
      return dow === 1 // Monday
    case 'fortnightly':
      return dow === 1 && wk % 2 === 0
    case 'monthly':
      return dom === 1
    case 'quarterly':
      return dom === 1 && [0, 3, 6, 9].includes(d.getMonth())
    default:
      return false
  }
}

/**
 * Generate daily task instances from templates for a given date.
 * Only creates tasks that don't already exist for that date.
 *
 * @param {Array} templates - task_templates rows (camelCase)
 * @param {Array} existingTasks - staff_tasks rows for today
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @returns {Array} new task instances to insert
 */
export function generateDailyTasks(templates, existingTasks, date) {
  const existingNames = new Set(existingTasks.filter(t => t.dueDate === date).map(t => t.taskName))
  const ts = new Date().toISOString()

  return templates
    .filter(t => t.isActive && isTemplateDue(t, date) && !existingNames.has(t.name))
    .map((template, i) => ({
      id: generateId(),
      taskName: template.name,
      templateId: template.id,
      category: template.category,
      priority: template.priority,
      linkedLog: template.linkedLog || null,
      assignedTo: null, // assigned by role matching in the UI
      assignedBy: null,
      status: 'pending',
      dueDate: date,
      notes: template.description || null,
      completedAt: null,
      completedBy: null,
      createdAt: ts,
    }))
}

/**
 * Filter tasks visible to a specific role.
 * Elevated roles see all; others see tasks whose template targets their role.
 */
export function getTasksForRole(tasks, templates, role) {
  if (ELEVATED_ROLES.includes(role)) return tasks

  const templateMap = new Map(templates.map(t => [t.id, t]))

  return tasks.filter(task => {
    if (!task.templateId) return true // ad-hoc tasks visible to all
    const tpl = templateMap.get(task.templateId)
    if (!tpl) return true
    return tpl.applicableRoles?.includes(role)
  })
}

/**
 * Group tasks by category.
 * @returns {Object} { opening: [...], clinical: [...], ... }
 */
export function getTasksByCategory(tasks) {
  const groups = {}
  for (const task of tasks) {
    const cat = task.category || 'other'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(task)
  }
  return groups
}

/**
 * Compute stats for a set of tasks.
 */
export function getTaskStats(tasks) {
  const total = tasks.length
  const completed = tasks.filter(t => t.status === 'done').length
  const overdue = tasks.filter(t => isTaskOverdue(t)).length
  const inProgress = tasks.filter(t => t.status === 'in_progress').length
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
  return { total, completed, overdue, inProgress, completionRate }
}

/**
 * Check if a task is overdue.
 */
export function isTaskOverdue(task) {
  if (task.status === 'done') return false
  if (!task.dueDate) return false
  return task.dueDate < new Date().toISOString().slice(0, 10)
}

/**
 * Check if a user has an elevated role (can see all tasks, assign, etc.)
 */
export function isElevatedRole(role) {
  return ELEVATED_ROLES.includes(role)
}

/** Category display order and labels */
export const CATEGORY_ORDER = ['opening', 'clinical', 'dispensary', 'stock', 'compliance', 'closing', 'admin', 'other']

export const CATEGORY_LABELS = {
  opening: 'Opening Tasks',
  clinical: 'Clinical',
  dispensary: 'Dispensary',
  stock: 'Stock & Equipment',
  compliance: 'Compliance',
  closing: 'Closing Tasks',
  admin: 'Admin & H&S',
  other: 'Other',
}

export const PRIORITY_ORDER = ['urgent', 'high', 'normal', 'low']

export const ROLE_LABELS = {
  superintendent: 'Superintendent',
  manager: 'Manager',
  pharmacist: 'Pharmacist',
  technician: 'Technician',
  dispenser: 'Dispenser',
  stock_assistant: 'Stock Assistant',
  driver: 'Driver',
  aca: 'ACA',
  staff: 'Staff',
}

export const ALL_ROLES = Object.keys(ROLE_LABELS)
