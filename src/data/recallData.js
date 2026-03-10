// ─── MHRA RECALLS — Constants & Helpers ───

export const ALERT_TYPES = [
  'Drug Alert',
  'Device Alert',
  'Safety Update',
  'Recall',
  'Other',
]

export const CLASSIFICATIONS = ['Class 1', 'Class 2', 'Class 3', 'N/A']

export const ACTION_TYPES = [
  'Not Stocked',
  'Stock Checked',
  'Stock Quarantined',
  'Stock Returned',
  'Patients Notified',
  'No Action Required',
]

export const CLASS_STYLES = {
  'Class 1': 'bg-red-500/10 text-red-600',
  'Class 2': 'bg-amber-500/10 text-amber-600',
  'Class 3': 'bg-slate-500/10 text-slate-600',
  'N/A':     'bg-gray-500/10 text-gray-500',
}

export const TYPE_STYLES = {
  'Drug Alert':    'bg-rose-500/10 text-rose-600',
  'Device Alert':  'bg-violet-500/10 text-violet-600',
  'Safety Update': 'bg-blue-500/10 text-blue-600',
  'Recall':        'bg-red-500/10 text-red-600',
  'Other':         'bg-gray-500/10 text-gray-500',
}

export const DATE_RANGES = [
  { label: 'Last 7 days',   days: 7 },
  { label: 'Last 30 days',  days: 30 },
  { label: 'Last 90 days',  days: 90 },
  { label: 'Last 6 months', days: 180 },
  { label: 'All time',      days: null },
]

// Keywords for automated relevance tagging
const RELEVANT_KEYWORDS = [
  'oral', 'tablet', 'capsule', 'dispensing', 'recall', 'pharmacy',
  'medicine', 'medication', 'prescription', 'inhaler', 'cream',
  'ointment', 'solution', 'syrup', 'drops', 'injection', 'patch',
  'lozenge', 'suppository', 'nasal spray', 'eye drop', 'ear drop',
  'community pharmacy', 'retail pharmacy', 'drug alert',
]

const LOW_RELEVANCE_KEYWORDS = [
  'infusion pump', 'surgical', 'implant', 'catheter', 'ventilator',
  'dialysis', 'mri', 'ct scanner', 'x-ray', 'defibrillator',
  'hospital only', 'theatre', 'endoscope', 'prosthesis', 'stent',
]

/**
 * Returns 'relevant' | 'low' | null based on keyword heuristic
 */
export function getRelevanceTag(title, summary) {
  const text = `${title || ''} ${summary || ''}`.toLowerCase()

  if (LOW_RELEVANCE_KEYWORDS.some(kw => text.includes(kw))) return 'low'
  if (RELEVANT_KEYWORDS.some(kw => text.includes(kw))) return 'relevant'
  return null
}
