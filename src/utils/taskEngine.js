import { generateId } from './helpers'

// Roles that can see/manage all tasks
const ELEVATED_ROLES = ['superintendent', 'manager', 'pharmacist']

/**
 * Staff name → role lookup (hardcoded fallback when DB lacks role column).
 */
export const STAFF_ROLES = {
  'Amjid Shakoor': 'superintendent',
  'Salma Shakoor': 'manager',
  'Moniba Jamil': 'dispenser',
  'Umama Khan': 'dispenser',
  'Sadaf Subhani': 'dispenser',
  'Urooj Khan': 'dispenser',
  'Shain Nawaz': 'aca',
  'Marian Hadaway': 'stock_assistant',
  'Jamila Adwan': 'technician',
  'M Imran': 'driver',
  'Shahzadul Hassan': 'driver',
  'Manzoor Ahmed': 'driver',
  'Sarmad Khalid': 'driver',
}

/**
 * Hardcoded task templates (fallback when task_templates table doesn't exist).
 */
export const TASK_TEMPLATES = [
  // ── Opening (3) ──
  { id: 'tpl-01', name: 'Temperature Log', category: 'opening', frequency: 'daily', priority: 'high', applicableRoles: ['dispenser','technician','aca','stock_assistant'], description: 'Record fridge min/max/current temp', linkedLog: '/temperature', isActive: true },
  { id: 'tpl-02', name: 'Daily RP Checks', category: 'opening', frequency: 'daily', priority: 'urgent', applicableRoles: ['superintendent','pharmacist'], description: 'Complete all 14 RP checklist items', linkedLog: '/rp-log', isActive: true },
  { id: 'tpl-03', name: 'CD Register Balance Check', category: 'opening', frequency: 'daily', priority: 'urgent', applicableRoles: ['superintendent','pharmacist'], description: 'Check all 5 CD entries in PharmSmart', linkedLog: null, isActive: true },
  // ── Clinical (4) ──
  { id: 'tpl-04', name: 'Check Drug Alerts & Recalls', category: 'clinical', frequency: 'daily', priority: 'urgent', applicableRoles: ['superintendent','pharmacist'], description: 'Check MHRA alerts and CAS notifications', linkedLog: null, isActive: true },
  { id: 'tpl-05', name: 'Near Miss Log Review', category: 'clinical', frequency: 'daily', priority: 'normal', applicableRoles: ['superintendent','pharmacist'], description: 'Review daily near miss entries', linkedLog: '/near-misses', isActive: true },
  { id: 'tpl-06', name: 'Check Owing Prescriptions', category: 'clinical', frequency: 'daily', priority: 'normal', applicableRoles: ['dispenser','technician','aca'], description: 'Follow up outstanding owings', linkedLog: null, isActive: true },
  { id: 'tpl-07', name: 'Prescription Collection Review', category: 'clinical', frequency: 'daily', priority: 'low', applicableRoles: ['dispenser','technician','aca','stock_assistant'], description: 'Return uncollected items after 28 days', linkedLog: null, isActive: true },
  // ── Dispensary (3) ──
  { id: 'tpl-08', name: 'Dispensary Clean', category: 'dispensary', frequency: 'daily', priority: 'normal', applicableRoles: ['dispenser','technician','aca','stock_assistant'], description: 'Clean dispensary surfaces and equipment', linkedLog: '/cleaning', isActive: true },
  { id: 'tpl-09', name: 'Counter & Surfaces Wipe', category: 'dispensary', frequency: 'daily', priority: 'normal', applicableRoles: ['dispenser','technician','aca','stock_assistant'], description: 'Wipe down all counter surfaces', linkedLog: '/cleaning', isActive: true },
  { id: 'tpl-10', name: 'Fridge Quick Clean', category: 'dispensary', frequency: 'weekly', priority: 'normal', applicableRoles: ['dispenser','technician','aca','stock_assistant'], description: 'Wipe shelves, check for spills', linkedLog: '/cleaning', isActive: true },
  // ── Stock (4) ──
  { id: 'tpl-11', name: 'Stock Rotation — Short Dated', category: 'stock', frequency: 'weekly', priority: 'normal', applicableRoles: ['dispenser','technician','aca','stock_assistant'], description: 'Move short-dated items to front, flag <3 months', linkedLog: null, isActive: true },
  { id: 'tpl-12', name: 'Returns Processing', category: 'stock', frequency: 'weekly', priority: 'low', applicableRoles: ['dispenser','technician','aca','stock_assistant'], description: 'Process supplier returns and credit notes', linkedLog: null, isActive: true },
  { id: 'tpl-13', name: 'Robot Maintenance Check', category: 'stock', frequency: 'weekly', priority: 'normal', applicableRoles: ['manager','superintendent'], description: 'Run diagnostics, clear jams, check cassettes', linkedLog: null, isActive: true },
  { id: 'tpl-14', name: 'Deep Fridge Clean', category: 'stock', frequency: 'monthly', priority: 'high', applicableRoles: ['dispenser','technician','aca','stock_assistant'], description: 'Full defrost and clean — document', linkedLog: '/cleaning', isActive: true },
  // ── Compliance (10) ──
  { id: 'tpl-15', name: 'Full CD Reconciliation', category: 'compliance', frequency: 'weekly', priority: 'urgent', applicableRoles: ['superintendent','pharmacist'], description: 'Count all Schedule 2 & 3 CDs against register', linkedLog: null, isActive: true },
  { id: 'tpl-16', name: 'SOP Spot Check', category: 'compliance', frequency: 'fortnightly', priority: 'normal', applicableRoles: ['superintendent','pharmacist'], description: 'Random check of 2 SOPs for currency', linkedLog: null, isActive: true },
  { id: 'tpl-17', name: 'Staff Training Record Review', category: 'compliance', frequency: 'fortnightly', priority: 'normal', applicableRoles: ['manager','superintendent'], description: 'Check training log completeness', linkedLog: '/staff-training', isActive: true },
  { id: 'tpl-18', name: 'Staff Rota Review', category: 'compliance', frequency: 'weekly', priority: 'low', applicableRoles: ['manager','superintendent'], description: 'Confirm next week\'s coverage', linkedLog: null, isActive: true },
  { id: 'tpl-19', name: 'GPhC Standards Self-Assessment', category: 'compliance', frequency: 'monthly', priority: 'high', applicableRoles: ['superintendent','pharmacist'], description: 'Review all 5 GPhC standards with evidence', linkedLog: '/compliance-report', isActive: true },
  { id: 'tpl-20', name: 'Near Miss Trend Analysis', category: 'compliance', frequency: 'monthly', priority: 'normal', applicableRoles: ['superintendent','pharmacist'], description: 'Identify patterns, update risk register', linkedLog: '/near-misses', isActive: true },
  { id: 'tpl-21', name: 'Monthly Audit Summary', category: 'compliance', frequency: 'monthly', priority: 'normal', applicableRoles: ['manager','superintendent'], description: 'Compile compliance metrics for month', linkedLog: '/analytics', isActive: true },
  { id: 'tpl-22', name: 'Insurance & Registration Review', category: 'compliance', frequency: 'monthly', priority: 'low', applicableRoles: ['manager','superintendent'], description: 'Check policy dates and renewal schedules', linkedLog: '/documents', isActive: true },
  { id: 'tpl-23', name: 'End of Day Till Reconciliation', category: 'compliance', frequency: 'daily', priority: 'normal', applicableRoles: ['manager','superintendent'], description: 'Cash & card totals match POS', linkedLog: null, isActive: true },
  { id: 'tpl-24', name: 'Equipment Calibration Check', category: 'compliance', frequency: 'monthly', priority: 'normal', applicableRoles: ['manager','superintendent'], description: 'Verify scales, thermometers, BP monitors', linkedLog: null, isActive: true },
  // ── Closing (2) ──
  { id: 'tpl-25', name: 'Sharps Bin Level Check', category: 'closing', frequency: 'weekly', priority: 'high', applicableRoles: ['dispenser','technician','aca','stock_assistant'], description: 'Replace if ¾ full — seal and label', linkedLog: null, isActive: true },
  { id: 'tpl-26', name: 'Waste Collection Scheduling', category: 'closing', frequency: 'weekly', priority: 'normal', applicableRoles: ['manager','superintendent'], description: 'Confirm DOOP & confidential waste pickup', linkedLog: null, isActive: true },
  // ── Admin (3) ──
  { id: 'tpl-27', name: 'Fire Exits & Signage Check', category: 'admin', frequency: 'weekly', priority: 'high', applicableRoles: ['manager','superintendent','dispenser','technician'], description: 'All exits unobstructed, signage visible', linkedLog: null, isActive: true },
  { id: 'tpl-28', name: 'First Aid Kit Check', category: 'admin', frequency: 'weekly', priority: 'normal', applicableRoles: ['dispenser','technician','aca','stock_assistant'], description: 'Reorder any expired or missing items', linkedLog: null, isActive: true },
  { id: 'tpl-29', name: 'Consultation Room Check', category: 'admin', frequency: 'fortnightly', priority: 'low', applicableRoles: ['dispenser','technician','aca','stock_assistant'], description: 'Clean surfaces, check equipment, restock', linkedLog: '/cleaning', isActive: true },
]

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
