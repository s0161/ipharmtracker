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
]

export const DEFAULT_CLEANING_TASKS = [
  // Daily
  { name: 'Dispensary Clean', frequency: 'daily' },
  { name: 'Temperature Log', frequency: 'daily' },
  { name: 'Counter & Surfaces Wipe', frequency: 'daily' },
  // Weekly
  { name: 'Kitchen Clean', frequency: 'weekly' },
  { name: 'Bathroom Clean', frequency: 'weekly' },
  { name: 'Floor Clean', frequency: 'weekly' },
  { name: 'Tidy Cream Shelves', frequency: 'weekly' },
  { name: 'Tidy Liquid Shelf', frequency: 'weekly' },
  { name: 'Empty Waste', frequency: 'weekly' },
  { name: 'Empty Confidential Waste', frequency: 'weekly' },
  { name: 'Put Splits Away', frequency: 'weekly' },
  { name: 'Extra Stock Away in Robot', frequency: 'weekly' },
  { name: 'Robot Maintenance', frequency: 'weekly' },
  { name: 'Consultation Room Clean', frequency: 'weekly' },
  // Fortnightly
  { name: 'Fridge Quick Clean', frequency: 'fortnightly' },
  { name: 'Straighten Up Fridge Stock', frequency: 'fortnightly' },
  // Monthly
  { name: 'Deep Fridge Clean', frequency: 'monthly' },
  { name: 'Monthly To Do List', frequency: 'monthly' },
  { name: 'Replace Near Miss Record', frequency: 'monthly' },
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
