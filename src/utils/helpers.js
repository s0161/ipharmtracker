export function generateId() {
  return crypto.randomUUID()
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return '—'
  return new Date(dateTimeStr).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getTrafficLight(expiryDate) {
  if (!expiryDate) return 'red'
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate + 'T00:00:00')
  const diffMs = expiry - now
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  if (diffDays < 0) return 'red'
  if (diffDays <= 30) return 'amber'
  return 'green'
}

export function getTrafficLightLabel(status) {
  switch (status) {
    case 'red':
      return 'Expired / No Date'
    case 'amber':
      return 'Due Within 30 Days'
    case 'green':
      return 'Valid'
    default:
      return ''
  }
}

export function isToday(dateTimeStr) {
  if (!dateTimeStr) return false
  const d = new Date(dateTimeStr)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

export const CATEGORIES = [
  'Registration',
  'Insurance',
  'Staff',
  'SOP',
  'Contract',
  'Training',
  'Policy',
  'Certificate',
  'Risk Assessment',
  'DBS Check',
  'MHRA Alert',
  'Other',
]

export const AREA_CONFIG = {
  dispensary: { label: 'Dispensary', accent: '#059669', icon: '💊' },
  storage:    { label: 'Storage',    accent: '#3b82f6', icon: '📦' },
  customer:   { label: 'Customer',   accent: '#8b5cf6', icon: '🏪' },
  kitchen:    { label: 'Kitchen',    accent: '#f59e0b', icon: '🍽️' },
  bathroom:   { label: 'Bathroom',   accent: '#06b6d4', icon: '🚿' },
  clinical:   { label: 'Clinical',   accent: '#ef4444', icon: '🌡️' },
  admin:      { label: 'Admin',      accent: '#64748b', icon: '📋' },
}

export const DEFAULT_CLEANING_TASKS = [
  // ─── Dispensary (7) ───
  { name: 'Dispensary Clean', frequency: 'daily', area: 'dispensary', description: 'Full wipe-down of dispensary counters, equipment, and work surfaces', gphcRelevant: true, estimatedMinutes: 15, requiresSignOff: false, defaultAssignedRole: 'dispenser', sortOrder: 1 },
  { name: 'Counter & Surfaces Wipe', frequency: 'daily', area: 'dispensary', description: 'Wipe all dispensary counters and surfaces with antibacterial solution', gphcRelevant: true, estimatedMinutes: 10, requiresSignOff: false, defaultAssignedRole: 'dispenser', sortOrder: 2 },
  { name: 'Robot Maintenance', frequency: 'weekly', area: 'dispensary', description: 'Check robot functionality, clean intake/output trays, clear jams', gphcRelevant: false, estimatedMinutes: 20, requiresSignOff: false, defaultAssignedRole: 'dispenser', sortOrder: 3 },
  { name: 'Dispensary Deep Clean', frequency: 'monthly', area: 'dispensary', description: 'Full deep clean of dispensary area including behind equipment and shelving', gphcRelevant: true, estimatedMinutes: 45, requiresSignOff: true, defaultAssignedRole: 'dispenser', sortOrder: 4 },
  { name: 'Label Printer Clean', frequency: 'weekly', area: 'dispensary', description: 'Clean print head, check label stock, remove dust and adhesive residue', gphcRelevant: false, estimatedMinutes: 5, requiresSignOff: false, defaultAssignedRole: 'dispenser', sortOrder: 5 },
  { name: 'Scanner Clean', frequency: 'weekly', area: 'dispensary', description: 'Clean barcode scanner lens and check scanning accuracy', gphcRelevant: false, estimatedMinutes: 5, requiresSignOff: false, defaultAssignedRole: 'dispenser', sortOrder: 6 },
  { name: 'Dispensary Floor Mop', frequency: 'daily', area: 'dispensary', description: 'Mop dispensary floor with approved cleaning solution', gphcRelevant: true, estimatedMinutes: 10, requiresSignOff: false, defaultAssignedRole: 'dispenser', sortOrder: 7 },

  // ─── Storage (5) ───
  { name: 'Tidy Cream Shelves', frequency: 'weekly', area: 'storage', description: 'Reorganise cream shelves — check expiry dates, rotate stock', gphcRelevant: false, estimatedMinutes: 15, requiresSignOff: false, defaultAssignedRole: 'dispenser', sortOrder: 1 },
  { name: 'Tidy Liquid Shelf', frequency: 'weekly', area: 'storage', description: 'Reorganise liquid shelf — check expiry dates, rotate stock', gphcRelevant: false, estimatedMinutes: 15, requiresSignOff: false, defaultAssignedRole: 'dispenser', sortOrder: 2 },
  { name: 'Put Splits Away', frequency: 'weekly', area: 'storage', description: 'Put split-pack items back to correct storage locations', gphcRelevant: false, estimatedMinutes: 10, requiresSignOff: false, defaultAssignedRole: 'dispenser', sortOrder: 3 },
  { name: 'Extra Stock Away in Robot', frequency: 'weekly', area: 'storage', description: 'Load extra stock into robot storage — check barcodes scan correctly', gphcRelevant: false, estimatedMinutes: 15, requiresSignOff: false, defaultAssignedRole: 'dispenser', sortOrder: 4 },
  { name: 'Stock Room Tidy', frequency: 'weekly', area: 'storage', description: 'General tidy of stock room — clear delivery packaging, organise shelves', gphcRelevant: false, estimatedMinutes: 20, requiresSignOff: false, defaultAssignedRole: 'stock_assistant', sortOrder: 5 },

  // ─── Customer (3) ───
  { name: 'Shop Floor Clean', frequency: 'daily', area: 'customer', description: 'Sweep and mop shop floor, wipe display shelves and counter', gphcRelevant: false, estimatedMinutes: 15, requiresSignOff: false, defaultAssignedRole: 'dispenser', sortOrder: 1 },
  { name: 'Consultation Room Clean', frequency: 'weekly', area: 'customer', description: 'Clean consultation room — wipe surfaces, check equipment, restock supplies', gphcRelevant: true, estimatedMinutes: 15, requiresSignOff: false, defaultAssignedRole: 'dispenser', sortOrder: 2 },
  { name: 'Waiting Area Tidy', frequency: 'daily', area: 'customer', description: 'Tidy waiting area — arrange chairs, clear leaflet rack, wipe surfaces', gphcRelevant: false, estimatedMinutes: 10, requiresSignOff: false, defaultAssignedRole: 'dispenser', sortOrder: 3 },

  // ─── Kitchen (2) ───
  { name: 'Kitchen Clean', frequency: 'weekly', area: 'kitchen', description: 'Clean kitchen surfaces, wash dishes, empty bins, wipe appliances', gphcRelevant: false, estimatedMinutes: 15, requiresSignOff: false, defaultAssignedRole: 'dispenser', sortOrder: 1 },
  { name: 'Kitchen Deep Clean', frequency: 'monthly', area: 'kitchen', description: 'Deep clean kitchen — inside fridge, oven, microwave, floor and behind appliances', gphcRelevant: false, estimatedMinutes: 30, requiresSignOff: false, defaultAssignedRole: 'dispenser', sortOrder: 2 },

  // ─── Bathroom (2) ───
  { name: 'Bathroom Clean', frequency: 'weekly', area: 'bathroom', description: 'Clean toilet, sink, mirror, mop floor, restock consumables', gphcRelevant: false, estimatedMinutes: 15, requiresSignOff: false, defaultAssignedRole: 'dispenser', sortOrder: 1 },
  { name: 'Bathroom Deep Clean', frequency: 'monthly', area: 'bathroom', description: 'Full deep clean including tiles, grouting, descaling, behind fixtures', gphcRelevant: false, estimatedMinutes: 30, requiresSignOff: false, defaultAssignedRole: 'dispenser', sortOrder: 2 },

  // ─── Clinical (5) ───
  { name: 'Fridge Quick Clean', frequency: 'fortnightly', area: 'clinical', description: 'Quick wipe of fridge shelves, check for spills, remove expired items', gphcRelevant: true, estimatedMinutes: 10, requiresSignOff: false, defaultAssignedRole: 'dispenser', sortOrder: 1 },
  { name: 'Straighten Up Fridge Stock', frequency: 'fortnightly', area: 'clinical', description: 'Reorganise fridge stock — rotate by expiry, check storage temperatures', gphcRelevant: true, estimatedMinutes: 15, requiresSignOff: false, defaultAssignedRole: 'dispenser', sortOrder: 2 },
  { name: 'Deep Fridge Clean', frequency: 'monthly', area: 'clinical', description: 'Full fridge clean — remove all stock, sanitise shelves, check seals and thermostat', gphcRelevant: true, estimatedMinutes: 30, requiresSignOff: true, defaultAssignedRole: 'dispenser', sortOrder: 3 },
  { name: 'CD Balance Check', frequency: 'weekly', area: 'clinical', description: 'Count all Schedule 2 & 3 controlled drugs against CD register', gphcRelevant: true, estimatedMinutes: 20, requiresSignOff: true, defaultAssignedRole: 'pharmacist', sortOrder: 4 },
  { name: 'Temperature Log', frequency: 'daily', area: 'clinical', description: 'Record fridge min/max/current temperatures in daily log', gphcRelevant: true, estimatedMinutes: 5, requiresSignOff: false, defaultAssignedRole: 'dispenser', sortOrder: 5 },

  // ─── Admin (4) ───
  { name: 'Empty Waste', frequency: 'weekly', area: 'admin', description: 'Empty all general waste bins and replace liners', gphcRelevant: false, estimatedMinutes: 10, requiresSignOff: false, defaultAssignedRole: 'dispenser', sortOrder: 1 },
  { name: 'Empty Confidential Waste', frequency: 'weekly', area: 'admin', description: 'Empty confidential waste bins — ensure shredded/sealed before disposal', gphcRelevant: true, estimatedMinutes: 10, requiresSignOff: false, defaultAssignedRole: 'dispenser', sortOrder: 2 },
  { name: 'Monthly To Do List', frequency: 'monthly', area: 'admin', description: 'Review and update monthly task checklist, carry forward incomplete items', gphcRelevant: false, estimatedMinutes: 15, requiresSignOff: false, defaultAssignedRole: 'manager', sortOrder: 3 },
  { name: 'Replace Near Miss Record', frequency: 'monthly', area: 'admin', description: 'File completed near miss log, start new recording sheet for the month', gphcRelevant: true, estimatedMinutes: 10, requiresSignOff: false, defaultAssignedRole: 'manager', sortOrder: 4 },
]

export const FREQUENCIES = ['daily', 'weekly', 'fortnightly', 'monthly', 'annually']

export function getTaskStatus(taskName, frequency, cleaningEntries) {
  const entries = cleaningEntries.filter((e) => e.taskName === taskName)
  if (entries.length === 0) return 'overdue'

  const latest = entries.reduce((a, b) =>
    new Date(a.dateTime) > new Date(b.dateTime) ? a : b
  )
  const lastDate = new Date(latest.dateTime)
  const now = new Date()
  const diffDays = (now - lastDate) / (1000 * 60 * 60 * 24)

  if (isToday(latest.dateTime)) return 'done'

  switch (frequency) {
    case 'daily':
      return 'due'
    case 'weekly':
      return diffDays >= 7 ? 'overdue' : diffDays >= 6 ? 'due' : 'upcoming'
    case 'fortnightly':
      return diffDays >= 14 ? 'overdue' : diffDays >= 12 ? 'due' : 'upcoming'
    case 'monthly':
      return diffDays >= 30 ? 'overdue' : diffDays >= 25 ? 'due' : 'upcoming'
    case 'annually':
      return diffDays >= 365 ? 'overdue' : diffDays >= 335 ? 'due' : 'upcoming'
    default:
      return 'due'
  }
}

export function getRefresherDate(trainingDate) {
  if (!trainingDate) return ''
  const d = new Date(trainingDate + 'T00:00:00')
  d.setFullYear(d.getFullYear() + 2)
  return d.toISOString().slice(0, 10)
}

export function getSafeguardingStatus(trainingDate) {
  if (!trainingDate) return 'overdue'
  const refresher = new Date(getRefresherDate(trainingDate) + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diffDays = (refresher - now) / (1000 * 60 * 60 * 24)
  if (diffDays < 0) return 'overdue'
  if (diffDays <= 90) return 'due-soon'
  return 'current'
}

export function getTaskStatusLabel(status) {
  switch (status) {
    case 'done': return 'Done'
    case 'due': return 'Due Today'
    case 'overdue': return 'Overdue'
    case 'upcoming': return 'Up to Date'
    default: return ''
  }
}
