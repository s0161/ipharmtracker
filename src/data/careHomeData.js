// ─── Care Homes Management — Static Data ───

export const CYCLE_STATUSES = ['Pending', 'In Progress', 'Checking', 'Ready', 'Dispatched', 'Delivered']

export const CYCLE_STATUS_STYLES = {
  Pending: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  'In Progress': { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  Checking: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  Ready: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  Dispatched: { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  Delivered: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
}

export const PACK_TYPES = ['Blister', 'MDS', 'Dosette']

export const DELIVERY_TYPES = ['Scheduled', 'Emergency', 'Ad-hoc']

export const DELIVERY_STATUSES = ['Scheduled', 'In Transit', 'Delivered', 'Failed']

export const DELIVERY_STATUS_STYLES = {
  Scheduled: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  'In Transit': { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  Delivered: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  Failed: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
}

export const NOTE_TYPES = ['General', 'Medication Change', 'Clinical', 'Urgent']

export const NOTE_PRIORITIES = ['Normal', 'High', 'Urgent']

export const NOTE_PRIORITY_STYLES = {
  Normal: { bg: 'bg-slate-100', text: 'text-slate-600' },
  High: { bg: 'bg-amber-100', text: 'text-amber-700' },
  Urgent: { bg: 'bg-red-100', text: 'text-red-700' },
}

export const NOTE_TYPE_STYLES = {
  General: { bg: 'bg-slate-100', text: 'text-slate-600' },
  'Medication Change': { bg: 'bg-blue-100', text: 'text-blue-700' },
  Clinical: { bg: 'bg-purple-100', text: 'text-purple-700' },
  Urgent: { bg: 'bg-red-100', text: 'text-red-700' },
}

export const MAR_ISSUE_TYPES = ['Missing Signature', 'Wrong Dose', 'Omission', 'Other']

export const MAR_SEVERITIES = ['Low', 'Medium', 'High', 'Critical']

export const MAR_SEVERITY_STYLES = {
  Low: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  Medium: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  High: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  Critical: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
}

export const MAR_STATUS_STYLES = {
  Open: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  Investigating: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  Resolved: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
}

export const PATIENT_ITEM_STATUSES = ['Pending', 'Dispensed', 'Checked', 'Problem']

export const PATIENT_ITEM_STATUS_STYLES = {
  Pending: { bg: 'bg-slate-100', text: 'text-slate-600' },
  Dispensed: { bg: 'bg-blue-100', text: 'text-blue-700' },
  Checked: { bg: 'bg-green-100', text: 'text-green-700' },
  Problem: { bg: 'bg-red-100', text: 'text-red-700' },
}

export const HOME_STATUS_STYLES = {
  Active: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  Inactive: { bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400' },
}
