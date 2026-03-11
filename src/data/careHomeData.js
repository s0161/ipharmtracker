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

export const FLAG_SEVERITY_STYLES = {
  info: { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/20' },
  warning: { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/20' },
  alert: { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/20' },
}

// ─── 6 Care Homes — Real CQC-registered Tameside care homes ───
export const CARE_HOMES_SEED = [
  {
    name: "St George's",
    address: 'Northgate Lane, Moorside, Oldham, OL1 4RU',
    cqcRegistration: '1-1442899058',
    residentCount: 77,
    deliveryDays: ['Monday', 'Thursday'],
    deliverySlot: 'morning',
    pharmacistLead: 'Amjid Shakoor',
    status: 'active',
    tagline: '2 pharmacist contacts, last delivery: today',
  },
  {
    name: 'The Lakes',
    address: 'Off Boyds Walk, Lakes Road, Dukinfield, SK16 4TX',
    cqcRegistration: '1-113503615',
    residentCount: 77,
    deliveryDays: ['Tuesday', 'Friday'],
    deliverySlot: 'morning',
    pharmacistLead: 'Amjid Shakoor',
    status: 'active',
    tagline: 'Pending prescription review overdue',
  },
  {
    name: 'Downshaw Lodge',
    address: '24 Smallshaw Lane, Ashton-under-Lyne, OL6 8PN',
    cqcRegistration: '1-4019291170',
    residentCount: 45,
    deliveryDays: ['Wednesday'],
    deliverySlot: 'afternoon',
    pharmacistLead: 'Amjid Shakoor',
    status: 'active',
    tagline: 'CD balance check due today',
  },
  {
    name: 'Firbank House',
    address: '24 Smallshaw Lane, Ashton-under-Lyne, OL6 8PN',
    cqcRegistration: '1-132017782',
    residentCount: 42,
    deliveryDays: ['Monday', 'Wednesday', 'Friday'],
    deliverySlot: 'morning',
    pharmacistLead: 'Amjid Shakoor',
    status: 'active',
    tagline: 'All clear, last audit 3 days ago',
  },
  {
    name: 'Clarkson House',
    address: '56 Currier Lane, Ashton-under-Lyne, OL6 6TB',
    cqcRegistration: '1-12775183555',
    residentCount: 28,
    deliveryDays: ['Tuesday', 'Thursday'],
    deliverySlot: 'afternoon',
    pharmacistLead: 'Amjid Shakoor',
    status: 'active',
    tagline: '1 incident flagged this week',
  },
  {
    name: 'Moss Cottage',
    address: '34 Manchester Road, Ashton-under-Lyne, OL7 0BZ',
    cqcRegistration: '1-145286241',
    residentCount: 34,
    deliveryDays: ['Monday', 'Friday'],
    deliverySlot: 'morning',
    pharmacistLead: 'Amjid Shakoor',
    status: 'active',
    tagline: 'New key contact added recently',
  },
]

export const CARE_HOME_CONTACTS_SEED = {
  "St George's": [
    { role: 'Registered Manager', name: 'Cheryl Newsome', phone: '0161 626 4433', email: 'admin@stgeorgescarecentre.co.uk', isPrimary: true },
    { role: 'Deputy Manager', name: 'Martyn Davies', phone: '0161 626 4433', email: 'deputy@stgeorgescarecentre.co.uk', isPrimary: false },
  ],
  'The Lakes': [
    { role: 'Registered Manager', name: 'Gulzar Nazir', phone: '0161 330 2444', email: 'admin@lakescare.co.uk', isPrimary: true },
    { role: 'Nominated Individual', name: 'Colin Gallimore', phone: '0161 330 2444', email: 'info@lakescare.co.uk', isPrimary: false },
  ],
  'Downshaw Lodge': [
    { role: 'Registered Manager', name: 'Catalin Babici', phone: '0161 330 7059', email: 'info@downshawlodge.co.uk', isPrimary: true },
    { role: 'Nominated Individual', name: 'Alison Boote', phone: '0161 330 7059', email: 'admin@qualiacare.co.uk', isPrimary: false },
  ],
  'Firbank House': [
    { role: 'Registered Manager', name: 'Wendy Estlick', phone: '0161 330 4772', email: 'info@firbankhouse.co.uk', isPrimary: true },
  ],
  'Clarkson House': [
    { role: 'Registered Manager', name: 'Claire Allwood', phone: '0161 308 4618', email: 'info@clarksonhouse.org', isPrimary: true },
  ],
  'Moss Cottage': [
    { role: 'Registered Manager', name: 'Joanne Murray', phone: '0161 343 2557', email: 'info@mosscottagecare.com', isPrimary: true },
  ],
}

export const CARE_HOME_FLAGS_SEED = {
  "St George's": [
    { flagType: 'delivery', flagLabel: 'Delivery completed today', severity: 'info' },
  ],
  'The Lakes': [
    { flagType: 'prescription_review', flagLabel: 'Prescription review overdue — 3 days', severity: 'warning' },
  ],
  'Downshaw Lodge': [
    { flagType: 'cd_check', flagLabel: 'CD balance check due today', severity: 'warning' },
  ],
  'Firbank House': [
    { flagType: 'audit', flagLabel: 'Last audit completed 3 days ago', severity: 'info' },
  ],
  'Clarkson House': [
    { flagType: 'incident', flagLabel: '1 incident flagged this week', severity: 'alert' },
  ],
  'Moss Cottage': [
    { flagType: 'delivery', flagLabel: 'New key contact added: Yusuf Ali (Deputy)', severity: 'info' },
  ],
}
