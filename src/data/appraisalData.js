// ─── Staff Appraisal System — Static Data ───

export const COMPETENCIES = [
  { key: 'clinical_knowledge', label: 'Clinical Knowledge', description: 'Understanding of medicines, interactions, and clinical guidance' },
  { key: 'dispensing_accuracy', label: 'Dispensing Accuracy', description: 'Precision in dispensing processes and label checking' },
  { key: 'communication', label: 'Communication', description: 'Effective verbal and written communication with patients and colleagues' },
  { key: 'teamwork', label: 'Teamwork', description: 'Collaboration, support, and contribution to team goals' },
  { key: 'sop_adherence', label: 'Adherence to SOPs', description: 'Consistent following of standard operating procedures' },
  { key: 'time_management', label: 'Time Management', description: 'Effective prioritisation and meeting deadlines' },
  { key: 'professionalism', label: 'Professionalism', description: 'Conduct, appearance, punctuality, and work ethic' },
  { key: 'patient_safety', label: 'Patient Safety Awareness', description: 'Vigilance in identifying and preventing safety risks' },
]

export const APPRAISAL_TYPES = ['Annual', '6-Month', 'Probation Review', 'Performance Improvement', 'Ad Hoc']

export const APPRAISAL_STATUSES = ['Draft', 'Completed', 'Acknowledged', 'Archived']

export const GOAL_STATUSES = ['Not Started', 'In Progress', 'Completed', 'Carried Over']

export const RATING_LABELS = {
  1: 'Needs Improvement',
  2: 'Below Expectations',
  3: 'Meets Expectations',
  4: 'Exceeds Expectations',
  5: 'Outstanding',
}

export const PEER_FEEDBACK_QUESTIONS = [
  'What are this person\'s key strengths in their role?',
  'In what areas could they improve or develop further?',
  'How effectively do they work as part of the team?',
]

// Maps competency keys to induction module codes for training gap detection
export const COMPETENCY_MODULE_MAP = {
  clinical_knowledge: ['IND-009'], // Controlled Drugs Awareness
  dispensing_accuracy: ['IND-007', 'IND-005'], // Dispensing Process, Robot Handling
  communication: ['IND-001'], // Confidentiality & Patient Data
  teamwork: ['IND-011'], // Equality, Diversity & Inclusion
  sop_adherence: ['IND-008'], // Near Miss & Incident Reporting
  time_management: [],
  professionalism: ['IND-010'], // Lone Working Policy
  patient_safety: ['IND-003', 'IND-006'], // Safeguarding, Fire Safety
}

export const DEFAULT_TEMPLATES = [
  {
    name: 'Annual Appraisal',
    appraisalType: 'Annual',
    competencies: COMPETENCIES.map(c => c.key),
    suggestedGoals: [
      'Complete all mandatory training modules by next review',
      'Identify one area for professional development',
      'Contribute to at least one pharmacy improvement initiative',
    ],
  },
  {
    name: 'Probation Review',
    appraisalType: 'Probation Review',
    competencies: COMPETENCIES.map(c => c.key),
    suggestedGoals: [
      'Complete all induction modules within probation period',
      'Demonstrate competency in core dispensing tasks',
      'Build effective working relationships with all team members',
    ],
  },
  {
    name: 'Performance Improvement Plan',
    appraisalType: 'Performance Improvement',
    competencies: COMPETENCIES.map(c => c.key),
    suggestedGoals: [
      'Address identified areas of concern within 4 weeks',
      'Attend relevant training sessions as agreed',
      'Achieve satisfactory rating in follow-up review',
    ],
  },
]

export const STATUS_STYLES = {
  Draft: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  Completed: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  Acknowledged: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  Archived: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
}
