import { supabase } from '../lib/supabase'
import { generateId } from './helpers'
import DUMMY_SOPS from '../data/sopData'
import INDUCTION_MODULES from '../data/inductionModules'

const SEED_KEY = 'ipd_seeded_v39'

const ORPHANED_KEYS = [
  'ipd_staff', 'ipd_tasks', 'ipd_cleaning',
  'ipd_documents', 'ipd_staff_training', 'ipd_safeguarding',
  'ipd_seeded', 'ipd_seeded_v2', 'ipd_seeded_v3',
  'ipd_seeded_v4', 'ipd_seeded_v5', 'ipd_seeded_v6',
  'ipd_seeded_v7', 'ipd_seeded_v8', 'ipd_seeded_v9',
  'ipd_seeded_v10', 'ipd_seeded_v11', 'ipd_seeded_v12', 'ipd_seeded_v13', 'ipd_seeded_v14', 'ipd_seeded_v15', 'ipd_seeded_v16',
  'ipd_seeded_v17', 'ipd_seeded_v18', 'ipd_seeded_v19', 'ipd_seeded_v20', 'ipd_seeded_v21', 'ipd_seeded_v22',
  'ipd_seeded_v23', 'ipd_seeded_v24', 'ipd_seeded_v25', 'ipd_seeded_v26', 'ipd_seeded_v27', 'ipd_seeded_v28', 'ipd_seeded_v29', 'ipd_seeded_v30', 'ipd_seeded_v31', 'ipd_seeded_v32', 'ipd_seeded_v33', 'ipd_seeded_v34', 'ipd_seeded_v35', 'ipd_seeded_v36', 'ipd_seeded_v37', 'ipd_seeded_v38',
]

// ─── SOP conversion helpers ───
function getRiskLevel(sop) {
  const title = sop.title.toLowerCase()
  if (/vaccine|methadone|controlled drug/.test(title)) return 'Critical'
  if (/fire|safeguarding/.test(title)) return 'High'
  const cat = sop.category
  if (cat === 'CD' || cat === 'Clinical') return 'High'
  if (cat === 'Dispensing' || cat === 'Governance' || cat === 'NHS Services') return 'Medium'
  if (cat === 'H&S') return 'High'
  return 'Low'
}

function inferFrequency(step) {
  const s = step.toLowerCase()
  if (/daily|each day|every shift|every morning|each morning/.test(s)) return 'Daily'
  if (/weekly|each week|every week/.test(s)) return 'Weekly'
  if (/monthly|quarterly|each month|every month/.test(s)) return 'Monthly'
  return null
}

function convertKeyPoints(keyPoints) {
  return (keyPoints || []).map(kp => {
    if (typeof kp === 'object' && kp.step) return kp
    const freq = inferFrequency(kp)
    return { step: kp, frequency: freq }
  })
}

function convertSopForDb(sop) {
  return {
    id: generateId(),
    code: sop.code,
    title: sop.title,
    category: sop.category,
    version: sop.version,
    effective_date: sop.effectiveDate || null,
    review_date: sop.reviewDate,
    status: sop.status,
    acked: sop.acked || 0,
    description: sop.description || '',
    scope: sop.scope || null,
    roles: sop.roles || [],
    key_points: convertKeyPoints(sop.keyPoints),
    ref_documents: sop.references || [],
    related_sops: sop.relatedSOPs || [],
    author: sop.author || null,
    approved_by: sop.approvedBy || null,
    responsibilities: sop.responsibilities || {},
    revision_history: sop.revisionHistory || [],
    training_requirements: sop.trainingRequirements || [],
    monitoring: sop.monitoring || null,
    risk_assessment: sop.riskAssessment || [],
    escalation: sop.escalation || null,
    review_triggers: sop.reviewTriggers || [],
    appendices: sop.appendices || [],
    risk_level: getRiskLevel(sop),
    flagged_for_review: false,
    flag_reason: null,
  }
}

export function cleanupOldLocalStorage() {
  ORPHANED_KEYS.forEach((k) => localStorage.removeItem(k))
}

// Remove renamed/stale tasks that may linger from broken earlier seeds
export async function cleanupStaleData() {
  await supabase.from('cleaning_tasks').delete().eq('name', 'Straighten Up Stock')
}

export async function seedIfNeeded() {
  if (localStorage.getItem(SEED_KEY)) return

  // Staff members — full objects with pin, manager flag, and role
  const staff = [
    { name: 'Amjid Shakoor', pin: '0001', is_manager: true },
    { name: 'Salma Shakoor', pin: '0002', is_manager: true },
    { name: 'Moniba Jamil', pin: '0003', is_manager: false },
    { name: 'Umama Khan', pin: '0004', is_manager: false },
    { name: 'Sadaf Subhani', pin: '0005', is_manager: false },
    { name: 'Urooj Khan', pin: '0006', is_manager: false },
    { name: 'Shain Nawaz', pin: '0007', is_manager: false },
    { name: 'Marian Hadaway', pin: '0008', is_manager: false },
    { name: 'Jamila Adwan', pin: '0009', is_manager: false },
    { name: 'M Imran', pin: '0010', is_manager: false },
    { name: 'Shahzadul Hassan', pin: '0011', is_manager: false },
    { name: 'Manzoor Ahmed', pin: '0012', is_manager: false },
    { name: 'Sarmad Khalid', pin: '0013', is_manager: false },
  ]

  // Cleaning tasks — 28 enriched tasks matching DEFAULT_CLEANING_TASKS in helpers.js
  const tasks = [
    // Dispensary (7)
    { name: 'Dispensary Clean', frequency: 'daily', area: 'dispensary' },
    { name: 'Counter & Surfaces Wipe', frequency: 'daily', area: 'dispensary' },
    { name: 'Robot Maintenance', frequency: 'weekly', area: 'dispensary' },
    { name: 'Dispensary Deep Clean', frequency: 'monthly', area: 'dispensary' },
    { name: 'Label Printer Clean', frequency: 'weekly', area: 'dispensary' },
    { name: 'Scanner Clean', frequency: 'weekly', area: 'dispensary' },
    { name: 'Dispensary Floor Mop', frequency: 'daily', area: 'dispensary' },
    // Storage (5)
    { name: 'Tidy Cream Shelves', frequency: 'weekly', area: 'storage' },
    { name: 'Tidy Liquid Shelf', frequency: 'weekly', area: 'storage' },
    { name: 'Put Splits Away', frequency: 'weekly', area: 'storage' },
    { name: 'Extra Stock Away in Robot', frequency: 'weekly', area: 'storage' },
    { name: 'Stock Room Tidy', frequency: 'weekly', area: 'storage' },
    // Customer (3)
    { name: 'Shop Floor Clean', frequency: 'daily', area: 'customer' },
    { name: 'Consultation Room Clean', frequency: 'weekly', area: 'customer' },
    { name: 'Waiting Area Tidy', frequency: 'daily', area: 'customer' },
    // Kitchen (2)
    { name: 'Kitchen Clean', frequency: 'weekly', area: 'kitchen' },
    { name: 'Kitchen Deep Clean', frequency: 'monthly', area: 'kitchen' },
    // Bathroom (2)
    { name: 'Bathroom Clean', frequency: 'weekly', area: 'bathroom' },
    { name: 'Bathroom Deep Clean', frequency: 'monthly', area: 'bathroom' },
    // Clinical (5)
    { name: 'Fridge Quick Clean', frequency: 'fortnightly', area: 'clinical' },
    { name: 'Straighten Up Fridge Stock', frequency: 'fortnightly', area: 'clinical' },
    { name: 'Deep Fridge Clean', frequency: 'monthly', area: 'clinical' },
    { name: 'CD Balance Check', frequency: 'weekly', area: 'clinical' },
    { name: 'Temperature Log', frequency: 'daily', area: 'clinical' },
    // Admin (4)
    { name: 'Empty Waste', frequency: 'weekly', area: 'admin' },
    { name: 'Empty Confidential Waste', frequency: 'weekly', area: 'admin' },
    { name: 'Monthly To Do List', frequency: 'monthly', area: 'admin' },
    { name: 'Replace Near Miss Record', frequency: 'monthly', area: 'admin' },
  ]

  // Cleaning log entries (snake_case for DB) — richer demo data
  const todayISO = new Date().toISOString().slice(0, 10)
  const cleaning = [
    // Historical entries
    { id: generateId(), task_name: 'Deep Fridge Clean', date_time: '2026-02-23T10:00', staff_member: 'Salma Shakoor', result: 'Pass', notes: 'Due again in one month (late March 2026)', created_at: '2026-02-23T10:00:00.000Z' },
    { id: generateId(), task_name: 'Fridge Quick Clean', date_time: '2026-02-15T09:00', staff_member: 'Salma Shakoor', result: 'Pass', notes: 'Fortnightly — next due early March 2026', created_at: '2026-02-15T09:00:00.000Z' },
    { id: generateId(), task_name: 'Robot Maintenance', date_time: '2026-02-23T09:00', staff_member: 'Salma Shakoor', result: 'Pass', notes: 'Weekly — next due Monday 2 Mar 2026', created_at: '2026-02-23T09:00:00.000Z' },
    { id: generateId(), task_name: 'CD Balance Check', date_time: '2026-03-02T11:00', staff_member: 'Amjid Shakoor', result: 'Pass', notes: 'All CDs balanced', created_at: '2026-03-02T11:00:00.000Z' },
    { id: generateId(), task_name: 'Kitchen Clean', date_time: '2026-03-02T14:00', staff_member: 'Urooj Khan', result: 'Pass', notes: '', created_at: '2026-03-02T14:00:00.000Z' },
    { id: generateId(), task_name: 'Bathroom Clean', date_time: '2026-03-02T15:00', staff_member: 'Moniba Jamil', result: 'Pass', notes: '', created_at: '2026-03-02T15:00:00.000Z' },
    { id: generateId(), task_name: 'Dispensary Clean', date_time: '2026-03-05T09:30', staff_member: 'Umama Khan', result: 'Pass', notes: '', created_at: '2026-03-05T09:30:00.000Z' },
    { id: generateId(), task_name: 'Counter & Surfaces Wipe', date_time: '2026-03-05T10:00', staff_member: 'Umama Khan', result: 'Pass', notes: '', created_at: '2026-03-05T10:00:00.000Z' },
    { id: generateId(), task_name: 'Temperature Log', date_time: '2026-03-05T09:00', staff_member: 'Sadaf Subhani', result: 'Pass', notes: 'Min 2.3, Max 5.8, Curr 3.6', created_at: '2026-03-05T09:00:00.000Z' },
    // Today's entries — mix of done, pending, and missed
    { id: generateId(), task_name: 'Dispensary Clean', date_time: `${todayISO}T09:15`, staff_member: 'Moniba Jamil', result: 'Pass', notes: 'Morning clean done', created_at: `${todayISO}T09:15:00.000Z` },
    { id: generateId(), task_name: 'Counter & Surfaces Wipe', date_time: `${todayISO}T09:30`, staff_member: 'Moniba Jamil', result: 'Pass', notes: '', created_at: `${todayISO}T09:30:00.000Z` },
    { id: generateId(), task_name: 'Temperature Log', date_time: `${todayISO}T09:00`, staff_member: 'Sadaf Subhani', result: 'Pass', notes: 'Min 2.1, Max 6.0, Curr 3.8', created_at: `${todayISO}T09:00:00.000Z` },
    { id: generateId(), task_name: 'Shop Floor Clean', date_time: `${todayISO}T08:45`, staff_member: 'Marian Hadaway', result: 'Pass', notes: '', created_at: `${todayISO}T08:45:00.000Z` },
    { id: generateId(), task_name: 'Dispensary Floor Mop', date_time: `${todayISO}T10:00`, staff_member: 'Umama Khan', result: 'Fail', notes: 'Mop head needs replacing — logged for replacement', created_at: `${todayISO}T10:00:00.000Z` },
  ]

  // Documents
  const documents = [
    {
      id: generateId(),
      document_name: 'Fire Risk Assessment — Actions Outstanding',
      category: 'SOP',
      owner: 'Salma Shakoor',
      issue_date: '2026-01-01',
      expiry_date: '2026-04-01',
      notes: 'Actions outstanding — due April 2026. Completed by Salma Shakoor, approved by Amjid Shakoor (RP & Superintendent)',
      created_at: new Date().toISOString(),
    },
    {
      id: generateId(),
      document_name: 'Health & Safety Assessment',
      category: 'SOP',
      owner: 'Salma Shakoor',
      issue_date: '2026-01-01',
      expiry_date: '2027-01-01',
      notes: 'Annual review. Completed by Salma Shakoor, approved by Amjid Shakoor (RP & Superintendent)',
      created_at: new Date().toISOString(),
    },
    {
      id: generateId(),
      document_name: 'Risk Assessment',
      category: 'SOP',
      owner: 'Salma Shakoor',
      issue_date: '2026-01-01',
      expiry_date: '2027-01-01',
      notes: 'Annual review. Completed by Salma Shakoor, approved by Amjid Shakoor (RP & Superintendent)',
      created_at: new Date().toISOString(),
    },
    {
      id: generateId(),
      document_name: 'Fire Extinguisher Servicing',
      category: 'Contract',
      owner: 'Amjid Shakoor',
      issue_date: '2025-09-05',
      expiry_date: '2026-09-05',
      notes: 'Contractor: Heytor Fire Protection, 109 Hyde Road, Denton, Manchester, M34 3BB. Contact: Chris Holt (Owner) — 07745717420. Certificate #2025-296. Standard: BS 5306/3. Both extinguishers commissioned — working codes confirmed.',
      created_at: new Date().toISOString(),
    },
    {
      id: generateId(),
      document_name: 'Pharmacist Registration Renewal',
      category: 'Registration',
      owner: 'Amjid Shakoor',
      issue_date: '2025-10-01',
      expiry_date: '2026-10-01',
      notes: 'Annual renewal — due October 2026. GPhC pharmacist registration for Amjid Shakoor.',
      created_at: new Date().toISOString(),
    },
    {
      id: generateId(),
      document_name: 'GPhC Membership Renewal',
      category: 'Registration',
      owner: 'Amjid Shakoor',
      issue_date: '2025-10-01',
      expiry_date: '2026-10-01',
      notes: 'Annual renewal — due October 2026. GPhC premises registration and membership fee.',
      created_at: new Date().toISOString(),
    },
    {
      id: generateId(),
      document_name: 'Full Pharmacy Audit',
      category: 'SOP',
      owner: 'Amjid Shakoor',
      issue_date: '2025-12-01',
      expiry_date: '2026-06-01',
      notes: 'Six-monthly full pharmacy audit — next due June 2026. Covers dispensing, CDs, fridge, premises, SOPs, staff training records.',
      created_at: new Date().toISOString(),
    },
    // Risk Assessments
    {
      id: generateId(),
      document_name: 'COSHH Assessment',
      category: 'Risk Assessment',
      owner: 'Amjid Shakoor',
      issue_date: '2025-06-01',
      expiry_date: '2027-06-01',
      notes: 'Biennial COSHH assessment — covers hazardous substances used in dispensing and cleaning.',
      created_at: new Date().toISOString(),
    },
    {
      id: generateId(),
      document_name: 'Lone Working Assessment',
      category: 'Risk Assessment',
      owner: 'Amjid Shakoor',
      issue_date: '2025-06-01',
      expiry_date: '2027-06-01',
      notes: 'Biennial lone working risk assessment — covers pharmacist and staff lone working procedures.',
      created_at: new Date().toISOString(),
    },
    {
      id: generateId(),
      document_name: 'Manual Handling Assessment',
      category: 'Risk Assessment',
      owner: 'Salma Shakoor',
      issue_date: '2025-06-01',
      expiry_date: '2027-06-01',
      notes: 'Biennial manual handling assessment — covers stock handling, deliveries, and dispensary operations.',
      created_at: new Date().toISOString(),
    },
    // DBS Checks — one per staff member, 3-year cycle, staggered Jan–Jun 2024
    ...[
      { name: 'Amjid Shakoor', issue: '2024-01-10' },
      { name: 'Salma Shakoor', issue: '2024-01-20' },
      { name: 'Moniba Jamil', issue: '2024-02-05' },
      { name: 'Umama Khan', issue: '2024-02-15' },
      { name: 'Sadaf Subhani', issue: '2024-02-25' },
      { name: 'Urooj Khan', issue: '2024-03-05' },
      { name: 'Shain Nawaz', issue: '2024-03-15' },
      { name: 'Marian Hadaway', issue: '2024-03-25' },
      { name: 'Jamila Adwan', issue: '2024-04-05' },
      { name: 'M Imran', issue: '2024-04-15' },
      { name: 'Shahzadul Hassan', issue: '2024-05-01' },
      { name: 'Manzoor Ahmed', issue: '2024-05-15' },
      { name: 'Sarmad Khalid', issue: '2024-06-01' },
    ].map(s => {
      const expiry = new Date(s.issue)
      expiry.setFullYear(expiry.getFullYear() + 3)
      return {
        id: generateId(),
        document_name: `DBS Check — ${s.name}`,
        category: 'DBS Check',
        owner: s.name,
        issue_date: s.issue,
        expiry_date: expiry.toISOString().slice(0, 10),
        notes: 'Enhanced DBS',
        created_at: new Date().toISOString(),
      }
    }),
  ]

  // Staff Training
  function t(staffName, role, items) {
    return items.map(([trainingItem, targetDate]) => ({
      id: generateId(),
      staff_name: staffName,
      role,
      training_item: trainingItem,
      target_date: targetDate,
      status: 'Pending',
    }))
  }

  const commonDispenser = [
    ['Safeguarding Awareness', '2026-01-31'],
    ['GDPR Training', '2026-02-28'],
    ['Health & Safety', '2026-04-30'],
    ['General Dispensing Refresher', '2026-06-30'],
  ]

  const commonDriver = [
    ['Internal Delivery Refresher', '2026-03-31'],
    ['Safeguarding Awareness', '2026-01-31'],
    ['GDPR Training', '2026-02-28'],
    ['Health & Safety', '2026-04-30'],
  ]

  const staffTraining = [
    ...t('Moniba Jamil', 'Dispenser', commonDispenser),
    ...t('Sadaf Subhani', 'Dispenser (In Training)', [['Dispensing Training', '2026-03-31']]),
    ...t('Umama Khan', 'Dispenser', [['Dispensing Course', '2026-03-01'], ...commonDispenser]),
    ...t('Urooj Khan', 'Dispenser', commonDispenser),
    ...t('Salma Shakoor', 'Admin/Dispenser', [['ACA Course', '2026-03-01'], ...commonDispenser]),
    ...t('Shain Nawaz', 'Dispenser', [['ACA Course', '2026-03-01'], ...commonDispenser]),
    ...t('Jamila Adwan', 'Pharmacy Technician', commonDispenser),
    ...t('Marian Hadaway', 'Stock Assistant', commonDispenser),
    ...t('M Imran', 'Delivery Driver', commonDriver),
    ...t('Shahzadul Hassan', 'Delivery Driver', commonDriver),
    ...t('Manzoor Ahmed', 'Delivery Driver', commonDriver),
    ...t('Sarmad Khalid', 'Delivery Driver', commonDriver),
    ...t('Amjid Shakoor', 'Superintendent/Responsible Pharmacist', [
      ['CPD GPhC Revalidation', ''],
      ['Distance Pharmacy Regulatory Update', '2026-06-30'],
      ['Safeguarding Level 3 Review', '2026-04-30'],
      ['Information Governance & GDPR Refresher', '2026-03-31'],
    ]),
  ]

  // Training topics — matches TRAINING_ITEMS names in TrainingLogs.jsx
  const trainingTopics = [
    'Safeguarding Adults — Level 1',
    'Safeguarding Children — Level 1',
    'Information Governance / GDPR',
    'Fire Safety Awareness',
    'Health & Safety Induction',
    'Lone Working Awareness',
    'Equality & Diversity',
    'Dispensing Accuracy Checks',
    'Controlled Drugs Handling',
    'Near Miss & Incident Reporting',
    'Prescription Validation',
    'MDS / Blister Pack Preparation',
    'Methadone / Supervised Consumption',
    'GDPR for Administrative Staff',
    'Complaints Handling Procedure',
    'Confidential Waste Procedure',
    'GPhC CPD Requirements',
    'Responsible Pharmacist Obligations',
    'Clinical Governance Updates',
  ]

  // Training Logs — realistic records matching TRAINING_ITEMS
  // Mix of complete, expired, expiring within 30 days, and not-started gaps
  const rec = (staff, topic, date, outcome, expiry, notes = '') => ({
    id: generateId(),
    staff_name: staff,
    date_completed: date,
    topic,
    trainer_name: staff === 'Amjid Shakoor' ? '' : 'Amjid Shakoor',
    delivery_method: outcome === 'Certificate Issued' ? 'Self-study' : 'Classroom',
    duration: '2 hours',
    outcome,
    certificate_expiry: expiry,
    renewal_date: '',
    notes,
    created_at: date + 'T10:00:00.000Z',
  })

  const trainingLogs = [
    // ─── Amjid Shakoor (superintendent) — mostly complete ───
    rec('Amjid Shakoor', 'Safeguarding Adults — Level 1',   '2025-02-15', 'Pass', '2027-02-15'),
    rec('Amjid Shakoor', 'Safeguarding Children — Level 1', '2025-02-15', 'Pass', '2027-02-15'),
    rec('Amjid Shakoor', 'Information Governance / GDPR',    '2025-06-01', 'Pass', '2026-03-20'), // EXPIRING ~14 days
    rec('Amjid Shakoor', 'Fire Safety Awareness',            '2025-09-10', 'Pass', '2026-09-10'),
    rec('Amjid Shakoor', 'Health & Safety Induction',         '2024-01-10', 'Pass', ''),
    rec('Amjid Shakoor', 'Dispensing Accuracy Checks',        '2025-08-20', 'Pass', '2026-08-20'),
    rec('Amjid Shakoor', 'Controlled Drugs Handling',         '2025-07-15', 'Pass', '2026-07-15'),
    rec('Amjid Shakoor', 'Near Miss & Incident Reporting',    '2025-10-01', 'Pass', '2026-10-01'),
    rec('Amjid Shakoor', 'GPhC CPD Requirements',            '2025-11-01', 'Certificate Issued', '2026-11-01', 'Annual CPD cycle — 9 entries submitted to GPhC'),
    rec('Amjid Shakoor', 'Responsible Pharmacist Obligations','2025-12-01', 'Pass', '2026-12-01'),
    rec('Amjid Shakoor', 'Clinical Governance Updates',      '2026-01-15', 'Pass', '2027-01-15'),
    rec('Amjid Shakoor', 'Complaints Handling Procedure',    '2025-11-20', 'Attended', '2026-11-20'),

    // ─── Salma Shakoor (manager) — some expired ───
    rec('Salma Shakoor', 'Safeguarding Adults — Level 1',   '2024-01-10', 'Pass', '2026-01-10'), // EXPIRED ~55 days
    rec('Salma Shakoor', 'Safeguarding Children — Level 1', '2024-01-10', 'Pass', '2026-01-10'), // EXPIRED
    rec('Salma Shakoor', 'Information Governance / GDPR',    '2025-03-20', 'Pass', '2026-03-25'), // EXPIRING ~19 days
    rec('Salma Shakoor', 'Fire Safety Awareness',            '2025-10-01', 'Pass', '2026-10-01'),
    rec('Salma Shakoor', 'Health & Safety Induction',         '2024-06-15', 'Pass', ''),
    rec('Salma Shakoor', 'GDPR for Administrative Staff',    '2025-04-01', 'Pass', '2026-04-01'), // EXPIRING ~26 days
    rec('Salma Shakoor', 'Complaints Handling Procedure',    '2025-09-10', 'Attended', '2026-09-10'),

    // ─── Moniba Jamil (dispenser) — partial coverage ───
    rec('Moniba Jamil', 'Safeguarding Adults — Level 1',   '2025-04-01', 'Pass', '2027-04-01'),
    rec('Moniba Jamil', 'Information Governance / GDPR',    '2025-06-10', 'Pass', '2026-06-10'),
    rec('Moniba Jamil', 'Fire Safety Awareness',            '2025-11-15', 'Attended', '2026-11-15'),
    rec('Moniba Jamil', 'Dispensing Accuracy Checks',       '2025-05-10', 'Pass', '2026-05-10'),
    rec('Moniba Jamil', 'Near Miss & Incident Reporting',   '2025-08-01', 'Pass', '2026-08-01'),

    // ─── Jamila Adwan (technician) — well trained ───
    rec('Jamila Adwan', 'Safeguarding Adults — Level 1',   '2025-03-01', 'Pass', '2027-03-01'),
    rec('Jamila Adwan', 'Safeguarding Children — Level 1', '2025-03-01', 'Pass', '2027-03-01'),
    rec('Jamila Adwan', 'Information Governance / GDPR',    '2025-08-15', 'Pass', '2026-08-15'),
    rec('Jamila Adwan', 'Fire Safety Awareness',            '2025-09-01', 'Pass', '2026-09-01'),
    rec('Jamila Adwan', 'Health & Safety Induction',         '2024-02-15', 'Pass', ''),
    rec('Jamila Adwan', 'Dispensing Accuracy Checks',       '2025-07-01', 'Pass', '2026-07-01'),
    rec('Jamila Adwan', 'Controlled Drugs Handling',        '2025-06-20', 'Pass', '2026-06-20'),
    rec('Jamila Adwan', 'Prescription Validation',          '2025-10-15', 'Pass', '2026-10-15'),
    rec('Jamila Adwan', 'Confidential Waste Procedure',     '2025-11-01', 'Attended', '2026-11-01'),

    // ─── Umama Khan (dispenser) — some gaps ───
    rec('Umama Khan', 'Safeguarding Adults — Level 1',   '2025-05-01', 'Pass', '2027-05-01'),
    rec('Umama Khan', 'Fire Safety Awareness',            '2025-12-01', 'Pass', '2026-12-01'),
    rec('Umama Khan', 'Controlled Drugs Handling',        '2025-02-01', 'Pass', '2026-02-01'), // EXPIRED ~33 days

    // ─── Shain Nawaz (aca) — basic mandatory only ───
    rec('Shain Nawaz', 'Safeguarding Adults — Level 1',   '2025-07-01', 'Pass', '2027-07-01'),
    rec('Shain Nawaz', 'Health & Safety Induction',         '2025-02-01', 'Pass', ''),
    rec('Shain Nawaz', 'Fire Safety Awareness',            '2025-10-15', 'Pass', '2026-10-15'),

    // ─── Marian Hadaway (stock_assistant) — minimal ───
    rec('Marian Hadaway', 'Fire Safety Awareness',            '2025-11-10', 'Attended', '2026-11-10'),
    rec('Marian Hadaway', 'Health & Safety Induction',         '2025-01-15', 'Pass', ''),

    // ─── Sadaf Subhani (dispenser) — in progress ───
    rec('Sadaf Subhani', 'Safeguarding Adults — Level 1',   '2025-06-01', 'Pass', '2027-06-01'),
    rec('Sadaf Subhani', 'Dispensing Accuracy Checks',       '2025-09-15', 'Pass', '2026-09-15'),

    // ─── Urooj Khan (dispenser) — some done ───
    rec('Urooj Khan', 'Safeguarding Adults — Level 1',   '2025-04-15', 'Pass', '2027-04-15'),
    rec('Urooj Khan', 'Information Governance / GDPR',    '2025-07-20', 'Pass', '2026-07-20'),
    rec('Urooj Khan', 'Dispensing Accuracy Checks',       '2025-08-01', 'Pass', '2026-08-01'),
  ]

  // Safeguarding Records
  const sgDefaults = {
    delivered_by: 'Amjid Shakoor — Superintendent Pharmacist',
    training_method: 'Internal — Level 1 Awareness',
    handbook_version: 'v1.0 January 2026',
    signed_off: true,
  }

  const safeguarding = [
    { id: generateId(), staff_name: 'Salma Shakoor', job_title: 'Admin/Dispenser', training_date: '2026-01-10', ...sgDefaults },
    { id: generateId(), staff_name: 'Umama Khan', job_title: 'Dispenser', training_date: '2026-01-10', ...sgDefaults },
    { id: generateId(), staff_name: 'Urooj Khan', job_title: 'Dispenser', training_date: '2026-01-10', ...sgDefaults },
    { id: generateId(), staff_name: 'Shain Nawaz', job_title: 'Dispenser', training_date: '2026-01-10', ...sgDefaults },
    { id: generateId(), staff_name: 'Moniba Jamil', job_title: 'Dispenser', training_date: '2026-01-10', ...sgDefaults },
    { id: generateId(), staff_name: 'Jamila Adwan', job_title: 'Pharmacy Technician', training_date: '2026-01-10', ...sgDefaults },
  ]

  // Action items (dashboard to-do list)
  const actionItems = [
    {
      id: generateId(),
      title: 'Chase up patient feedback',
      due_date: '2026-03-06',
      done: false,
      created_at: '2026-02-27T09:00:00.000Z',
    },
    {
      id: generateId(),
      title: 'Chase up website',
      due_date: '2026-03-06',
      done: false,
      created_at: '2026-02-27T09:00:00.000Z',
    },
    {
      id: generateId(),
      title: 'Parking bay council request',
      due_date: '2026-03-06',
      done: false,
      created_at: '2026-02-27T09:00:00.000Z',
    },
    {
      id: generateId(),
      title: 'Chase up medicinal waste documents',
      due_date: '2026-03-06',
      done: false,
      created_at: '2026-02-27T09:00:00.000Z',
    },
  ]

  // Staff Tasks — 18 sample tasks round-robin assigned across staff
  const today = new Date()
  const dayStr = (offset) => {
    const d = new Date(today)
    d.setDate(d.getDate() + offset)
    return d.toISOString().slice(0, 10)
  }

  const ASSIGNEE_POOL = [
    'Salma Shakoor', 'Amjid Shakoor', 'Jamila Adwan', 'Marian Hadaway',
    'Moniba Jamil', 'Umama Khan', 'Sadaf Subhani', 'Urooj Khan', 'Shain Nawaz',
  ]

  const staffTaskSamples = [
    // CD Check (4)
    { title: 'Weekly CD balance check', priority: 'HIGH', status: 'pending', due_date: dayStr(2), notes: 'Count all Schedule 2 & 3 CDs against register' },
    { title: 'CD register reconciliation', priority: 'HIGH', status: 'pending', due_date: dayStr(5), notes: 'Cross-check register entries with running balances' },
    { title: 'CD cabinet key audit', priority: 'MED', status: 'in_progress', due_date: dayStr(1), notes: 'Verify key holder log is up to date' },
    { title: 'Return expired CDs to supplier', priority: 'HIGH', status: 'pending', due_date: dayStr(-2), notes: 'T2 denaturing kit required — overdue' },

    // Compliance (5)
    { title: 'Update dispensary SOPs', priority: 'MED', status: 'pending', due_date: dayStr(7), notes: 'Annual SOP review — check GPhC updates' },
    { title: 'GPhC inspection checklist review', priority: 'HIGH', status: 'pending', due_date: dayStr(10), notes: 'Ensure all 5 standards evidenced' },
    { title: 'Audit prescription exemption records', priority: 'MED', status: 'pending', due_date: dayStr(4), notes: 'Random sample of 20 scripts from last month' },
    { title: 'Stock rotation — short-dated items', priority: 'LOW', status: 'done', due_date: dayStr(-1), notes: 'Completed — all short-dated moved to front' },
    { title: 'Fridge temperature logger download', priority: 'MED', status: 'done', due_date: dayStr(-3), notes: 'Data exported and filed' },

    // Cleaning (2)
    { title: 'Deep clean dispensary benches', priority: 'MED', status: 'pending', due_date: dayStr(3), notes: 'Use approved cleaning solution — log in cleaning record' },
    { title: 'Organise returns shelf', priority: 'LOW', status: 'pending', due_date: dayStr(6), notes: 'Sort by supplier, prepare returns notes' },

    // H&S (3)
    { title: 'Fire exits & signage check', priority: 'HIGH', status: 'pending', due_date: dayStr(8), notes: 'Monthly fire safety walk — check all exits unobstructed' },
    { title: 'First aid kit stock check', priority: 'MED', status: 'in_progress', due_date: dayStr(0), notes: 'Reorder any expired or missing items' },
    { title: 'PAT testing — portable appliances', priority: 'LOW', status: 'pending', due_date: dayStr(14), notes: 'Annual PAT test due — book contractor' },

    // Waste (2)
    { title: 'DOOP bin collection booked', priority: 'MED', status: 'pending', due_date: dayStr(9), notes: 'Contact waste contractor for next pickup' },
    { title: 'Sharps bin replacement', priority: 'HIGH', status: 'pending', due_date: dayStr(1), notes: 'Current bin ¾ full — swap and seal' },

    // RP Check (2)
    { title: 'RP notice board check', priority: 'LOW', status: 'done', due_date: dayStr(-4), notes: 'Notice displayed, RP name correct' },
    { title: 'RP absence cover plan', priority: 'MED', status: 'pending', due_date: dayStr(12), notes: 'Confirm locum availability for upcoming leave' },
  ].map((task, i) => ({
    id: generateId(),
    ...task,
    assigned_to: ASSIGNEE_POOL[i % ASSIGNEE_POOL.length],
    assigned_by: 'Amjid Shakoor',
    role_required: 'any',
    created_at: new Date().toISOString(),
  }))

  // Fridge temperature logs — sample data for past 7 days, both fridges (one daily reading each)
  const tempLogs = []
  for (let i = 7; i >= 1; i--) {
    const d = dayStr(-i)
    // Main fridge — daily reading
    tempLogs.push({
      id: generateId(),
      fridge_id: 'main',
      date: d,
      temp_min: 2.1 + Math.round(Math.random() * 10) / 10,
      temp_max: 6.5 + Math.round(Math.random() * 15) / 10,
      temp_current: 3.5 + Math.round(Math.random() * 20) / 10,
      logged_by: 'SS',
      excursion: false,
      not_checked: false,
      created_at: new Date(`${d}T09:00:00`).toISOString(),
    })
    // Backup fridge — daily reading
    tempLogs.push({
      id: generateId(),
      fridge_id: 'backup',
      date: d,
      temp_min: 2.0 + Math.round(Math.random() * 10) / 10,
      temp_max: 5.5 + Math.round(Math.random() * 20) / 10,
      temp_current: 3.0 + Math.round(Math.random() * 25) / 10,
      logged_by: 'MH',
      excursion: false,
      not_checked: false,
      created_at: new Date(`${d}T09:30:00`).toISOString(),
    })
  }
  // Add one excursion entry (3 days ago, main fridge)
  const excursionLog = tempLogs.find(l => l.date === dayStr(-3) && l.fridge_id === 'main')
  if (excursionLog) {
    excursionLog.temp_max = 9.2
    excursionLog.excursion = true
    excursionLog.excursion_reason = 'Fridge door left ajar overnight — temperature recovered after closing'
    excursionLog.stock_quarantined = true
    excursionLog.stock_destroyed = false
    excursionLog.reported_to = 'Amjid Shakoor'
  }

  // ─── Safeguarding Contacts ───
  const safeguardingContacts = [
    // Emergency / Urgent
    { name: 'Tameside MASH', organisation: 'Tameside MBC', phone: '0161 342 4101', phone_secondary: '', email: 'mashreferrals@tameside.gov.uk', website: '', category: 'emergency', concern_types: ['child', 'adult_at_risk', 'domestic_abuse'], description: 'Multi-Agency Safeguarding Hub — first point of contact for all safeguarding concerns about children and adults at risk in Tameside', opening_hours: 'Mon-Fri 8:30am-5pm', region: 'tameside', is_emergency: true, sort_order: 1 },
    { name: 'Adult Social Care', organisation: 'Tameside MBC', phone: '0161 342 2400', phone_secondary: '', email: '', website: '', category: 'emergency', concern_types: ['adult_at_risk'], description: 'Adult safeguarding referrals for Tameside residents — self-neglect, abuse, exploitation', opening_hours: 'Mon-Fri 8:30am-5pm', region: 'tameside', is_emergency: true, sort_order: 2 },
    { name: 'Emergency Duty Team', organisation: 'Tameside MBC', phone: '0161 342 2222', phone_secondary: '', email: '', website: '', category: 'emergency', concern_types: ['child', 'adult_at_risk', 'domestic_abuse'], description: 'Out-of-hours emergency social services — use when MASH is closed and there is immediate risk', opening_hours: '5pm-8:30am + weekends/bank holidays', region: 'tameside', is_emergency: true, sort_order: 3 },
    { name: 'Greater Manchester Police', organisation: 'GMP', phone: '101', phone_secondary: '999', email: '', website: '', category: 'emergency', concern_types: ['child', 'adult_at_risk', 'domestic_abuse'], description: 'Police non-emergency 101 / Emergency 999 — call 999 if someone is in immediate danger', opening_hours: '24/7', region: 'tameside', is_emergency: true, sort_order: 4 },
    // Domestic Abuse
    { name: 'MARAC (Tameside)', organisation: 'Tameside MBC', phone: '0161 342 4377', phone_secondary: '', email: '', website: '', category: 'domestic_abuse', concern_types: ['domestic_abuse'], description: 'Multi-Agency Risk Assessment Conference — for high-risk domestic abuse cases. Referral via MASH or police.', opening_hours: 'Mon-Fri 9am-5pm', region: 'tameside', is_emergency: false, sort_order: 5 },
    { name: 'TDAS (Tameside Domestic Abuse)', organisation: 'TDAS', phone: '0161 366 0109', phone_secondary: '', email: 'info@tdasltd.org.uk', website: 'https://tdasltd.org.uk', category: 'domestic_abuse', concern_types: ['domestic_abuse'], description: 'Tameside Domestic Abuse Services — support, advice, refuge for victims of domestic abuse in Tameside', opening_hours: 'Mon-Fri 9am-5pm', region: 'tameside', is_emergency: false, sort_order: 6 },
    { name: 'National DA Helpline', organisation: 'Refuge', phone: '0808 2000 247', phone_secondary: '', email: '', website: 'https://www.nationaldahelpline.org.uk', category: 'domestic_abuse', concern_types: ['domestic_abuse'], description: 'Freephone 24-hour National Domestic Abuse Helpline run by Refuge', opening_hours: '24/7', region: 'national', is_emergency: false, sort_order: 7 },
    { name: "Men's Advice Line", organisation: "Men's Advice Line", phone: '0808 801 0327', phone_secondary: '', email: '', website: 'https://mensadviceline.org.uk', category: 'domestic_abuse', concern_types: ['domestic_abuse'], description: 'Confidential helpline for male victims of domestic abuse', opening_hours: 'Mon-Fri 10am-8pm', region: 'national', is_emergency: false, sort_order: 8 },
    { name: 'HIDE (DA for disabled people)', organisation: 'HIDE', phone: '0161 636 7525', phone_secondary: '', email: '', website: '', category: 'domestic_abuse', concern_types: ['domestic_abuse', 'adult_at_risk'], description: 'Hidden, Invisible, Domestic abuse for disabled people — specialist support in Greater Manchester', opening_hours: 'Mon-Fri 9am-5pm', region: 'tameside', is_emergency: false, sort_order: 9 },
    { name: 'Galop (LGBT+ DA)', organisation: 'Galop', phone: '0800 999 5428', phone_secondary: '', email: '', website: 'https://galop.org.uk', category: 'domestic_abuse', concern_types: ['domestic_abuse'], description: 'National LGBT+ domestic abuse helpline', opening_hours: 'Mon-Fri 10am-5pm', region: 'national', is_emergency: false, sort_order: 10 },
    // Mental Health
    { name: 'Crisis Line (Tameside)', organisation: 'Pennine Care NHS', phone: '0800 014 9995', phone_secondary: '', email: '', website: '', category: 'mental_health', concern_types: ['mental_health'], description: 'Tameside & Glossop Mental Health Crisis Line — for urgent mental health support', opening_hours: '24/7', region: 'tameside', is_emergency: true, sort_order: 11 },
    { name: 'Tameside ICFT Mental Health', organisation: 'ICFT', phone: '0161 922 4300', phone_secondary: '', email: '', website: '', category: 'mental_health', concern_types: ['mental_health'], description: 'Tameside Integrated Care Foundation Trust mental health services', opening_hours: 'Mon-Fri 9am-5pm', region: 'tameside', is_emergency: false, sort_order: 12 },
    { name: 'Samaritans', organisation: 'Samaritans', phone: '116 123', phone_secondary: '', email: 'jo@samaritans.org', website: 'https://www.samaritans.org', category: 'mental_health', concern_types: ['mental_health'], description: 'Free confidential emotional support for anyone in distress — call or email 24/7', opening_hours: '24/7', region: 'national', is_emergency: false, sort_order: 13 },
    { name: 'MIND', organisation: 'MIND', phone: '0300 123 3393', phone_secondary: '', email: '', website: 'https://www.mind.org.uk', category: 'mental_health', concern_types: ['mental_health'], description: 'Mental health information and support', opening_hours: 'Mon-Fri 9am-6pm', region: 'national', is_emergency: false, sort_order: 14 },
    { name: 'NHS Urgent Mental Health', organisation: 'NHS', phone: '111', phone_secondary: '', email: '', website: 'https://111.nhs.uk', category: 'mental_health', concern_types: ['mental_health'], description: 'NHS 111 — press option 2 for urgent mental health crisis support', opening_hours: '24/7', region: 'national', is_emergency: false, sort_order: 15 },
    { name: 'Shout', organisation: 'Shout', phone: '', phone_secondary: '', email: '', website: 'https://giveusashout.org', category: 'mental_health', concern_types: ['mental_health'], description: 'Free text support — text SHOUT to 85258 for confidential crisis support', opening_hours: '24/7', region: 'national', is_emergency: false, sort_order: 16 },
    // Child Concern
    { name: 'NSPCC Helpline', organisation: 'NSPCC', phone: '0808 800 5000', phone_secondary: '', email: 'help@nspcc.org.uk', website: 'https://www.nspcc.org.uk', category: 'child_concern', concern_types: ['child'], description: 'National helpline for anyone concerned about a child — confidential advice for adults', opening_hours: '24/7', region: 'national', is_emergency: false, sort_order: 17 },
    { name: 'Childline', organisation: 'NSPCC', phone: '0800 1111', phone_secondary: '', email: '', website: 'https://www.childline.org.uk', category: 'child_concern', concern_types: ['child'], description: 'Free helpline for children and young people under 19 — advice and support', opening_hours: '24/7', region: 'national', is_emergency: false, sort_order: 18 },
    { name: 'Early Help (Tameside)', organisation: 'Tameside MBC', phone: '0161 342 4260', phone_secondary: '', email: '', website: '', category: 'child_concern', concern_types: ['child'], description: 'Tameside Early Help service — for families needing support before statutory intervention', opening_hours: 'Mon-Fri 8:30am-5pm', region: 'tameside', is_emergency: false, sort_order: 19 },
    { name: 'School Nursing (Tameside)', organisation: 'Tameside & Glossop', phone: '0161 342 5150', phone_secondary: '', email: '', website: '', category: 'child_concern', concern_types: ['child'], description: 'Tameside school nursing service — health and wellbeing support for school-age children', opening_hours: 'Mon-Fri 9am-5pm', region: 'tameside', is_emergency: false, sort_order: 20 },
    // Substance Misuse
    { name: 'Turning Point (Tameside)', organisation: 'Turning Point', phone: '0161 672 9420', phone_secondary: '', email: '', website: 'https://www.turning-point.co.uk', category: 'substance_misuse', concern_types: ['substance_misuse'], description: 'Drug and alcohol recovery service in Tameside — self-referral accepted', opening_hours: 'Mon-Fri 9am-5pm', region: 'tameside', is_emergency: false, sort_order: 21 },
    { name: 'CGL (Change Grow Live)', organisation: 'CGL', phone: '0161 672 0200', phone_secondary: '', email: '', website: 'https://www.changegrowlive.org', category: 'substance_misuse', concern_types: ['substance_misuse'], description: 'Substance misuse support services — harm reduction, treatment, recovery', opening_hours: 'Mon-Fri 9am-5pm', region: 'tameside', is_emergency: false, sort_order: 22 },
    { name: 'Frank', organisation: 'Frank', phone: '0300 123 6600', phone_secondary: '', email: '', website: 'https://www.talktofrank.com', category: 'substance_misuse', concern_types: ['substance_misuse'], description: 'Free national drug information and support helpline', opening_hours: '24/7', region: 'national', is_emergency: false, sort_order: 23 },
    { name: 'Alcohol Change UK', organisation: 'Alcohol Change', phone: '0300 123 1110', phone_secondary: '', email: '', website: 'https://alcoholchange.org.uk', category: 'substance_misuse', concern_types: ['substance_misuse'], description: 'National advice on alcohol use — self-help tools and support directory', opening_hours: 'Mon-Fri 9am-5pm', region: 'national', is_emergency: false, sort_order: 24 },
    // General / Vulnerability
    { name: 'NHS 111', organisation: 'NHS', phone: '111', phone_secondary: '', email: '', website: 'https://111.nhs.uk', category: 'general', concern_types: ['adult_at_risk', 'mental_health'], description: 'NHS 111 — urgent medical advice when it is not a 999 emergency', opening_hours: '24/7', region: 'national', is_emergency: false, sort_order: 25 },
    { name: 'Tameside A&E', organisation: 'Tameside Hospital', phone: '0161 922 6000', phone_secondary: '', email: '', website: '', category: 'general', concern_types: ['adult_at_risk'], description: 'Tameside General Hospital A&E — for medical emergencies', opening_hours: '24/7', region: 'tameside', is_emergency: true, sort_order: 26 },
    { name: 'Social Prescribing (Tameside)', organisation: 'Tameside MBC', phone: '0161 342 5000', phone_secondary: '', email: '', website: '', category: 'general', concern_types: ['adult_at_risk', 'mental_health'], description: 'Social prescribing link workers — connecting people to community support for loneliness, isolation, wellbeing', opening_hours: 'Mon-Fri 9am-5pm', region: 'tameside', is_emergency: false, sort_order: 27 },
    { name: 'Food Banks (Tameside)', organisation: 'Trussell Trust / Tameside', phone: '0161 330 9802', phone_secondary: '', email: '', website: '', category: 'general', concern_types: ['adult_at_risk'], description: 'Tameside food bank referral — emergency food parcels for individuals and families in crisis', opening_hours: 'Mon-Fri 10am-2pm', region: 'tameside', is_emergency: false, sort_order: 28 },
  ]

  // ─── Safeguarding Concerns (demo) ───
  const safeguardingConcerns = [
    {
      id: generateId(), concern_ref: 'SC-2026-001', concern_date: '2026-03-01', concern_time: '10:30',
      category: 'adult_at_risk', patient_identifier: 'JB', description: 'Elderly patient presenting with unexplained bruising on forearms. Patient appeared withdrawn and reluctant to discuss home circumstances. Accompanied by family member who answered all questions on patient\'s behalf.',
      action_taken: 'Spoke to patient privately during MDS consultation. Patient declined further support at this time. Advised patient of available services.', risk_level: 'medium', status: 'open',
      reported_by: 'Salma Shakoor', escalated_to_superintendent: false, follow_up_required: true, follow_up_date: '2026-03-15', follow_up_notes: 'Check on patient at next MDS collection', outcome: '', created_at: '2026-03-01T10:30:00.000Z',
    },
    {
      id: generateId(), concern_ref: 'SC-2026-002', concern_date: '2026-02-20', concern_time: '14:15',
      category: 'domestic_abuse', patient_identifier: 'RS', description: 'Regular patient requested to speak privately. Disclosed that partner has been controlling medication access and finances. Patient appeared distressed with visible weight loss since last visit.',
      action_taken: 'Provided safe space for patient to talk. Shared TDAS leaflet discreetly inside medication bag. Offered to make referral — patient consented.', risk_level: 'high', status: 'referred',
      reported_by: 'Amjid Shakoor', escalated_to_superintendent: true, escalated_at: '2026-02-20T14:30:00.000Z', follow_up_required: true, follow_up_date: '2026-03-06', follow_up_notes: 'Awaiting MASH feedback on referral', outcome: '', created_at: '2026-02-20T14:15:00.000Z',
    },
    {
      id: generateId(), concern_ref: 'SC-2026-003', concern_date: '2026-01-15', concern_time: '11:00',
      category: 'child', patient_identifier: 'Child of PT', description: 'Parent collecting prescription appeared intoxicated at 11am. Young child (approx 3-4 years) was unsupervised near shop entrance. Child appeared unkempt.',
      action_taken: 'Ensured child safety in pharmacy. Manager contacted MASH for advice. MASH confirmed existing case — information shared.', risk_level: 'high', status: 'resolved',
      reported_by: 'Moniba Jamil', escalated_to_superintendent: true, escalated_at: '2026-01-15T11:15:00.000Z', follow_up_required: false, outcome: 'MASH confirmed they are aware and case is being managed by social worker. No further action required from pharmacy.', closed_at: '2026-01-20', closed_by: 'Amjid Shakoor', created_at: '2026-01-15T11:00:00.000Z',
    },
  ]

  // ─── Safeguarding Referrals (demo) ───
  const safeguardingReferrals = [
    {
      id: generateId(), referral_ref: 'REF-2026-001', concern_id: safeguardingConcerns[1].id,
      referral_date: '2026-02-20', referred_to: 'Tameside MASH', concern_type: 'domestic_abuse',
      patient_identifier: 'RS', consent_type: 'patient_consent', consent_notes: 'Patient gave verbal consent to referral',
      reference_number: 'MASH-2026-4521', description: 'Referral made following disclosure of coercive control by partner including controlling medication access and finances. Patient consented to referral.',
      status: 'in_progress', outcome: '', outcome_notes: '', outcome_date: '',
      referred_by: 'Amjid Shakoor', created_at: '2026-02-20T15:00:00.000Z',
    },
  ]

  // ─── Signposting Resources ───
  const signpostingResources = [
    {
      category: 'domestic_abuse', title: 'Domestic Abuse Support',
      plain_language_intro: 'Domestic abuse can affect anyone regardless of age, gender, sexuality, or background. It includes physical violence, coercive control, financial abuse, emotional abuse, and stalking. If someone discloses abuse to you, believe them, listen without judgement, and help them access support.',
      what_to_say: '"I believe you. You are not alone, and this is not your fault. There are people who can help, and I can put you in touch with them if you would like. Everything you tell me is confidential unless I believe someone is in immediate danger."',
      referral_pathway: '1. IMMEDIATE DANGER: Call 999\n2. HIGH RISK: Refer to Tameside MASH (0161 342 4101) — same day\n3. URGENT: Contact TDAS (0161 366 0109) for specialist support\n4. NON-URGENT: Provide National DA Helpline number (0808 2000 247) and TDAS leaflet',
      region: 'tameside', is_active: true, sort_order: 1,
    },
    {
      category: 'mental_health', title: 'Mental Health Crisis Support',
      plain_language_intro: 'Mental health crises can present in many ways — suicidal thoughts, self-harm, extreme anxiety, psychosis, or severe depression. Pharmacy staff may notice changes in behaviour, medication patterns, or direct disclosure. Always take concerns seriously and respond with compassion.',
      what_to_say: '"I can see you are going through a really difficult time. You do not have to face this alone. Would you like me to help you speak to someone who can support you? There are services available right now that can help."',
      referral_pathway: '1. IMMEDIATE RISK TO LIFE: Call 999\n2. CRISIS: Call Tameside Crisis Line (0800 014 9995) — 24/7\n3. URGENT: NHS 111 option 2 for mental health crisis\n4. NON-URGENT: Suggest Samaritans (116 123), MIND (0300 123 3393), or text SHOUT to 85258',
      region: 'tameside', is_active: true, sort_order: 2,
    },
    {
      category: 'child_concern', title: 'Concerns About a Child',
      plain_language_intro: 'Signs of concern about a child may include unexplained injuries, changes in behaviour, poor hygiene, hunger, fear of going home, or disclosure of abuse. Pharmacy staff may observe these during interactions with families collecting prescriptions. You do not need proof to raise a concern — a reasonable suspicion is enough.',
      what_to_say: 'If speaking to the child: "You can talk to me. I am here to help and keep you safe." If speaking to a parent/carer: "I have noticed [specific observation]. Is everything okay? We have services that can help families."',
      referral_pathway: '1. IMMEDIATE DANGER: Call 999\n2. HIGH RISK: Call Tameside MASH (0161 342 4101) — same day\n3. CONCERNED: Contact NSPCC Helpline (0808 800 5000) for advice\n4. EARLY HELP: Refer to Tameside Early Help (0161 342 4260)',
      region: 'tameside', is_active: true, sort_order: 3,
    },
    {
      category: 'adult_at_risk', title: 'Adult at Risk / Safeguarding Adults',
      plain_language_intro: 'An adult at risk is someone aged 18+ who has care and support needs and may be unable to protect themselves from abuse or neglect. This includes elderly patients, those with disabilities, learning difficulties, or mental health conditions. Types of abuse include physical, financial, emotional, neglect, self-neglect, and organisational.',
      what_to_say: '"I have noticed something that concerns me and I want to make sure you are safe. Would you be happy for me to arrange some support? There are services that can help, and you do not have to deal with this alone."',
      referral_pathway: '1. IMMEDIATE DANGER: Call 999\n2. HIGH RISK: Call Tameside MASH (0161 342 4101) or Adult Social Care (0161 342 2400)\n3. OUT OF HOURS: Emergency Duty Team (0161 342 2222)\n4. NON-URGENT: Contact GP or Social Prescribing (0161 342 5000)',
      region: 'tameside', is_active: true, sort_order: 4,
    },
    {
      category: 'substance_misuse', title: 'Substance Misuse Concerns',
      plain_language_intro: 'Pharmacy staff are uniquely placed to identify substance misuse issues — through dispensing patterns, needle exchange services, supervised consumption, or direct observation. Approach with compassion, not judgement. Many people with substance misuse problems also have underlying mental health or social issues.',
      what_to_say: '"I am not here to judge you. I want to make sure you are getting the support you need. There are services that can help with what you are going through, and I can help you get in touch if you would like."',
      referral_pathway: '1. MEDICAL EMERGENCY: Call 999 (overdose, collapse)\n2. URGENT: Refer to Turning Point Tameside (0161 672 9420) — self-referral\n3. SUPPORT: CGL (0161 672 0200) for treatment and recovery\n4. INFORMATION: Frank helpline (0300 123 6600) or talktofrank.com',
      region: 'tameside', is_active: true, sort_order: 5,
    },
    {
      category: 'general_vulnerability', title: 'General Vulnerability & Wellbeing',
      plain_language_intro: 'Vulnerability can take many forms — isolation, poverty, homelessness, language barriers, or digital exclusion. Pharmacy staff often see people who would not otherwise engage with services. A compassionate conversation can be the first step to connecting someone with support.',
      what_to_say: '"How are you doing? Is there anything we can help you with today, beyond your medication? We know about local services that might be useful to you."',
      referral_pathway: '1. HEALTH CONCERN: NHS 111 or suggest GP appointment\n2. SOCIAL ISOLATION: Social Prescribing (0161 342 5000)\n3. FOOD POVERTY: Tameside Food Banks (0161 330 9802)\n4. GENERAL WELLBEING: Signpost to community groups and local support',
      region: 'tameside', is_active: true, sort_order: 6,
    },
  ]

  // ─── SOPs — convert all 133 from sopData.js ───
  const sops = DUMMY_SOPS.map(convertSopForDb)

  // ─── Sample acknowledgements — spread across ~20 SOPs ───
  const ackStaff = [
    'Amjid Shakoor', 'Salma Shakoor', 'Moniba Jamil', 'Umama Khan',
    'Sadaf Subhani', 'Urooj Khan', 'Shain Nawaz', 'Marian Hadaway', 'Jamila Adwan',
  ]
  const sopAcks = []
  const ackSopIndices = [0,1,2,3,4,5,9,10,14,15,19,20,24,29,34,39,49,59,79,99]
  ackSopIndices.forEach((si, idx) => {
    if (si >= sops.length) return
    const numAcks = Math.max(1, Math.min(ackStaff.length, 9 - Math.floor(idx / 3)))
    for (let a = 0; a < numAcks; a++) {
      const dayOffset = a * 2 + idx
      const d = new Date(2025, 0, 10 + dayOffset, 9 + a, a * 15)
      sopAcks.push({
        id: generateId(),
        sop_id: sops[si].id,
        acknowledged_by: ackStaff[a],
        acknowledged_at: d.toISOString(),
      })
    }
  })

  // Clear old seed data before re-inserting
  // Use .not('id','is',null) instead of .neq('id','') — the latter fails for UUID columns
  const delFilter = (q) => q.not('id', 'is', null)
  await Promise.allSettled([
    delFilter(supabase.from('cleaning_tasks').delete()),
    delFilter(supabase.from('cleaning_entries').delete()),
    delFilter(supabase.from('staff_members').delete()),
    delFilter(supabase.from('documents').delete()),
    delFilter(supabase.from('staff_training').delete()),
    delFilter(supabase.from('safeguarding_records').delete()),
    delFilter(supabase.from('rp_log').delete()),
    supabase.from('training_topics').delete().neq('name', ''),
    delFilter(supabase.from('training_logs').delete()),
    delFilter(supabase.from('action_items').delete()),
    delFilter(supabase.from('assigned_tasks').delete()),
    delFilter(supabase.from('staff_tasks').delete()),
    delFilter(supabase.from('near_misses').delete()),
    delFilter(supabase.from('pharmacy_config').delete()),
    delFilter(supabase.from('fridge_temperature_logs').delete()),
    delFilter(supabase.from('safeguarding_contacts').delete()),
    delFilter(supabase.from('safeguarding_concerns').delete()),
    delFilter(supabase.from('safeguarding_referrals').delete()),
    delFilter(supabase.from('signposting_resources').delete()),
    // SOPs deleted separately below — guarded by migration check
  ])

  // Insert into Supabase tables
  const inserts = [
    supabase.from('staff_members').insert(staff),
    supabase.from('cleaning_tasks').insert(tasks),
    supabase.from('cleaning_entries').insert(cleaning),
    supabase.from('documents').insert(documents),
    supabase.from('staff_training').insert(staffTraining),
    supabase.from('safeguarding_records').insert(safeguarding),
    supabase.from('training_topics').insert(trainingTopics.map((name) => ({ name }))),
    supabase.from('training_logs').insert(trainingLogs),
    supabase.from('action_items').insert(actionItems),
    supabase.from('staff_tasks').insert(staffTaskSamples),
    supabase.from('fridge_temperature_logs').insert(tempLogs),
    supabase.from('safeguarding_contacts').insert(safeguardingContacts),
    supabase.from('safeguarding_concerns').insert(safeguardingConcerns),
    supabase.from('safeguarding_referrals').insert(safeguardingReferrals),
    supabase.from('signposting_resources').insert(signpostingResources),
    // SOPs inserted below in chunks
    // sop_acknowledgements inserted below after SOPs
    supabase.from('pharmacy_config').insert({
      pharmacy_name: 'iPharmacy Direct',
      address: 'Manchester, UK',
      superintendent: 'Amjid Shakoor',
      rp_name: 'Amjid Shakoor',
      gphc_number: 'FED07',
      phone: '',
      email: '',
      region: 'tameside',
    }),
  ]

  const results = await Promise.allSettled(inserts)
  const failed = results.filter((r) => r.status === 'fulfilled' && r.value.error)

  if (failed.length > 0) {
    failed.forEach((r) => {
      console.error('[seed] Insert failed:', r.value.error.message)
    })
  } else {
    console.log('[seed] Sample data inserted into Supabase')
  }

  // Check if SOP migration has been run by testing for a new column
  const { error: colCheck } = await supabase.from('sops').select('risk_level').limit(1)
  const sopMigrationReady = !colCheck

  if (sopMigrationReady) {
    // Safe to delete + re-insert SOPs with new schema
    const delFilter2 = (q) => q.not('id', 'is', null)
    await Promise.allSettled([
      delFilter2(supabase.from('sop_acknowledgements').delete()),
      delFilter2(supabase.from('sops').delete()),
    ])

    // Insert SOPs in chunks of 50 (JSONB payloads can be large)
    const CHUNK_SIZE = 50
    for (let i = 0; i < sops.length; i += CHUNK_SIZE) {
      const chunk = sops.slice(i, i + CHUNK_SIZE)
      const { error } = await supabase.from('sops').insert(chunk)
      if (error) console.error(`[seed] SOP chunk ${i}–${i + chunk.length} failed:`, error.message)
    }

    // Insert acknowledgements
    if (sopAcks.length > 0) {
      const { error } = await supabase.from('sop_acknowledgements').insert(sopAcks)
      if (error) console.error('[seed] SOP acks insert failed:', error.message)
    }

    console.log(`[seed] Seeded ${sops.length} SOPs + ${sopAcks.length} acknowledgements`)
  } else {
    console.warn('[seed] SOP migration not yet applied — skipping SOP seed. Run alter-sops-table.sql in Supabase SQL Editor first.')
  }

  // ─── Induction Modules ───
  const { error: indCheck } = await supabase.from('induction_modules').select('id').limit(1)
  if (!indCheck) {
    // Table exists — seed induction modules
    await supabase.from('induction_completions').delete().not('id', 'is', null)
    await supabase.from('induction_modules').delete().not('id', 'is', null)

    const indModules = INDUCTION_MODULES.map((m, i) => ({
      id: generateId(),
      code: m.code,
      title: m.title,
      category: m.category,
      description: m.description,
      content: m.content,
      estimated_minutes: m.estimated_minutes,
      is_mandatory: m.is_mandatory,
      order_index: m.order_index || i + 1,
    }))

    // Insert modules
    const { error: modErr } = await supabase.from('induction_modules').insert(indModules)
    if (modErr) {
      console.error('[seed] Induction modules insert failed:', modErr.message)
    } else {
      // Sample completions — a few staff have completed some modules
      const sampleCompletions = [
        { staff: 'Salma Shakoor', modules: [0, 1, 2, 3, 4, 5], scores: [90, 80, 100, 70, 90, 80] },
        { staff: 'Moniba Jamil', modules: [0, 1, 2], scores: [80, 90, 70] },
        { staff: 'Umama Khan', modules: [0, 1], scores: [100, 80] },
        { staff: 'Jamila Adwan', modules: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], scores: [90, 100, 90, 80, 100, 90, null, 80, 90, null, 100, 90] },
        { staff: 'Shain Nawaz', modules: [0], scores: [70] },
      ]
      const completionRows = []
      sampleCompletions.forEach(sc => {
        sc.modules.forEach((mi, idx) => {
          if (mi < indModules.length) {
            const daysAgo = (sc.modules.length - idx) * 3 + Math.floor(Math.random() * 5)
            const d = new Date()
            d.setDate(d.getDate() - daysAgo)
            completionRows.push({
              id: generateId(),
              module_id: indModules[mi].id,
              staff_name: sc.staff,
              completed_at: d.toISOString(),
              score: sc.scores[idx] || null,
            })
          }
        })
      })
      if (completionRows.length > 0) {
        const { error: compErr } = await supabase.from('induction_completions').insert(completionRows)
        if (compErr) console.error('[seed] Induction completions insert failed:', compErr.message)
      }
      console.log(`[seed] Seeded ${indModules.length} induction modules + ${completionRows.length} completions`)
    }
  } else {
    console.warn('[seed] Induction tables not yet created — skipping. Run create-induction-tables.sql first.')
  }

  // ─── Staff Appraisals ───
  const { error: apprCheck } = await supabase.from('appraisals').select('id').limit(1)
  if (!apprCheck) {
    // Tables exist — seed appraisal data
    await supabase.from('peer_feedback_responses').delete().not('id', 'is', null)
    await supabase.from('peer_feedback_requests').delete().not('id', 'is', null)
    await supabase.from('appraisal_actions').delete().not('id', 'is', null)
    await supabase.from('appraisal_goals').delete().not('id', 'is', null)
    await supabase.from('appraisal_ratings').delete().not('id', 'is', null)
    await supabase.from('appraisals').delete().not('id', 'is', null)
    await supabase.from('appraisal_templates').delete().not('id', 'is', null)

    // Seed templates
    const templates = [
      { id: generateId(), name: 'Annual Appraisal', appraisal_type: 'Annual', competencies: JSON.stringify(['clinical_knowledge','dispensing_accuracy','communication','teamwork','sop_adherence','time_management','professionalism','patient_safety']), suggested_goals: JSON.stringify(['Complete all mandatory training modules by next review','Identify one area for professional development','Contribute to at least one pharmacy improvement initiative']) },
      { id: generateId(), name: 'Probation Review', appraisal_type: 'Probation Review', competencies: JSON.stringify(['clinical_knowledge','dispensing_accuracy','communication','teamwork','sop_adherence','time_management','professionalism','patient_safety']), suggested_goals: JSON.stringify(['Complete all induction modules within probation period','Demonstrate competency in core dispensing tasks','Build effective working relationships with all team members']) },
      { id: generateId(), name: 'Performance Improvement Plan', appraisal_type: 'Performance Improvement', competencies: JSON.stringify(['clinical_knowledge','dispensing_accuracy','communication','teamwork','sop_adherence','time_management','professionalism','patient_safety']), suggested_goals: JSON.stringify(['Address identified areas of concern within 4 weeks','Attend relevant training sessions as agreed','Achieve satisfactory rating in follow-up review']) },
    ]
    await supabase.from('appraisal_templates').insert(templates)

    // Appraisal 1: Jamila Adwan — Annual, Acknowledged
    const appr1Id = generateId()
    // Appraisal 2: Marian Hadaway — 6-Month, Completed
    const appr2Id = generateId()
    // Appraisal 3: Sadaf Subhani — Probation Review, Draft
    const appr3Id = generateId()

    await supabase.from('appraisals').insert([
      {
        id: appr1Id,
        staff_name: 'Jamila Adwan',
        conducted_by: 'Amjid Shakoor',
        appraisal_date: '2024-11-15',
        appraisal_type: 'Annual',
        status: 'Acknowledged',
        overall_rating: 4,
        summary: 'Jamila has had an excellent year. She consistently demonstrates strong clinical knowledge and dispensing accuracy. Her dedication to completing all induction modules is commendable.',
        strengths: 'Thorough and methodical in dispensing processes. Excellent attention to detail with labelling and checking. Always willing to help colleagues and share knowledge. Completed all 12 induction modules with high scores.',
        areas_for_development: 'Could be more confident in dealing with patient queries independently. Time management during peak hours could improve. Would benefit from taking on more responsibility for stock management.',
        staff_comments: 'Thank you for the thorough review. I agree with the development areas and will work on my confidence with patient-facing tasks.',
        staff_acknowledged: true,
        staff_acknowledged_at: '2024-11-20T10:30:00Z',
        next_appraisal_date: '2025-11-15',
        is_confidential: false,
      },
      {
        id: appr2Id,
        staff_name: 'Marian Hadaway',
        conducted_by: 'Amjid Shakoor',
        appraisal_date: '2024-09-01',
        appraisal_type: '6-Month',
        status: 'Completed',
        overall_rating: 3,
        summary: 'Marian is settling into her role well. She has made good progress in stock management but needs to improve her understanding of dispensing processes and SOP adherence.',
        strengths: 'Reliable and punctual. Good organisational skills for stock management. Positive attitude and willingness to learn.',
        areas_for_development: 'Needs to complete remaining induction modules. Should improve understanding of dispensing accuracy checks. SOPs need more consistent following.',
        staff_comments: null,
        staff_acknowledged: false,
        staff_acknowledged_at: null,
        next_appraisal_date: '2025-03-01',
        is_confidential: false,
      },
      {
        id: appr3Id,
        staff_name: 'Sadaf Subhani',
        conducted_by: 'Salma Shakoor',
        appraisal_date: '2025-01-10',
        appraisal_type: 'Probation Review',
        status: 'Draft',
        overall_rating: null,
        summary: null,
        strengths: null,
        areas_for_development: null,
        staff_comments: null,
        staff_acknowledged: false,
        staff_acknowledged_at: null,
        next_appraisal_date: null,
        is_confidential: false,
      },
    ])

    // Competency ratings for Jamila (appr1)
    const jamRatings = [
      { competency: 'clinical_knowledge', rating: 4, comment: 'Strong understanding of medicines and interactions' },
      { competency: 'dispensing_accuracy', rating: 5, comment: 'Consistently accurate, minimal errors recorded' },
      { competency: 'communication', rating: 3, comment: 'Good with colleagues, could be more confident with patients' },
      { competency: 'teamwork', rating: 4, comment: 'Always willing to support others' },
      { competency: 'sop_adherence', rating: 4, comment: 'Follows procedures consistently' },
      { competency: 'time_management', rating: 3, comment: 'Can struggle during peak dispensing hours' },
      { competency: 'professionalism', rating: 5, comment: 'Exemplary conduct and appearance' },
      { competency: 'patient_safety', rating: 4, comment: 'Good awareness and reporting of near misses' },
    ]
    await supabase.from('appraisal_ratings').insert(
      jamRatings.map(r => ({ id: generateId(), appraisal_id: appr1Id, ...r }))
    )

    // Goals for Jamila
    await supabase.from('appraisal_goals').insert([
      { id: generateId(), appraisal_id: appr1Id, goal_text: 'Complete MUR accreditation training', target_date: '2025-03-31', status: 'Completed', progress_notes: 'Completed online course in January 2025. Certificate filed.' },
      { id: generateId(), appraisal_id: appr1Id, goal_text: 'Shadow pharmacist on 10 patient consultations', target_date: '2025-06-30', status: 'Completed', progress_notes: 'Completed 12 shadowing sessions by April 2025.' },
      { id: generateId(), appraisal_id: appr1Id, goal_text: 'Lead stock take process independently', target_date: '2025-09-30', status: 'In Progress', progress_notes: 'Has assisted with 2 stock takes so far. On track.' },
    ])

    // Actions for Marian (appr2) — 2 outstanding
    await supabase.from('appraisal_actions').insert([
      { id: generateId(), appraisal_id: appr2Id, action_text: 'Complete induction modules IND-003 to IND-008', owner: 'Marian Hadaway', due_date: '2025-01-15', completed: false },
      { id: generateId(), appraisal_id: appr2Id, action_text: 'Attend dispensing accuracy workshop', owner: 'Marian Hadaway', due_date: '2025-02-01', completed: false },
    ])

    // Peer feedback for Jamila (from Moniba and Sadaf)
    const fb1Id = generateId()
    const fb2Id = generateId()
    await supabase.from('peer_feedback_requests').insert([
      { id: fb1Id, appraisal_id: appr1Id, requested_from: 'Moniba Jamil', submitted: true, submitted_at: '2024-11-18T14:00:00Z' },
      { id: fb2Id, appraisal_id: appr1Id, requested_from: 'Sadaf Subhani', submitted: true, submitted_at: '2024-11-19T09:30:00Z' },
    ])
    await supabase.from('peer_feedback_responses').insert([
      { id: generateId(), request_id: fb1Id, question_index: 0, response: 'Jamila is very thorough and always double-checks her work. She is a great team player.' },
      { id: generateId(), request_id: fb1Id, question_index: 1, response: 'She could speak up more in team meetings and share her ideas.' },
      { id: generateId(), request_id: fb1Id, question_index: 2, response: 'Very well — she is always ready to help and cover for colleagues.' },
      { id: generateId(), request_id: fb2Id, question_index: 0, response: 'Excellent accuracy and attention to detail in dispensing.' },
      { id: generateId(), request_id: fb2Id, question_index: 1, response: 'Could improve confidence when handling patient queries at the counter.' },
      { id: generateId(), request_id: fb2Id, question_index: 2, response: 'She fits in brilliantly with the team. Always positive and supportive.' },
    ])

    console.log('[seed] Seeded 3 appraisals, 3 templates, ratings, goals, actions, and peer feedback')
  } else {
    console.warn('[seed] Appraisal tables not yet created — skipping. Run create-appraisal-tables.sql first.')
  }

  localStorage.setItem(SEED_KEY, 'true')
}
