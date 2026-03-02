import { supabase } from '../lib/supabase'
import { generateId } from './helpers'

const SEED_KEY = 'ipd_seeded_v23'

const ORPHANED_KEYS = [
  'ipd_staff', 'ipd_tasks', 'ipd_cleaning',
  'ipd_documents', 'ipd_staff_training', 'ipd_safeguarding',
  'ipd_seeded', 'ipd_seeded_v2', 'ipd_seeded_v3',
  'ipd_seeded_v4', 'ipd_seeded_v5', 'ipd_seeded_v6',
  'ipd_seeded_v7', 'ipd_seeded_v8', 'ipd_seeded_v9',
  'ipd_seeded_v10', 'ipd_seeded_v11', 'ipd_seeded_v12', 'ipd_seeded_v13', 'ipd_seeded_v14', 'ipd_seeded_v15', 'ipd_seeded_v16',
  'ipd_seeded_v17', 'ipd_seeded_v18', 'ipd_seeded_v19', 'ipd_seeded_v20', 'ipd_seeded_v21', 'ipd_seeded_v22',
]

export function cleanupOldLocalStorage() {
  ORPHANED_KEYS.forEach((k) => localStorage.removeItem(k))
}

// Remove renamed/stale tasks that may linger from broken earlier seeds
export async function cleanupStaleData() {
  await supabase.from('cleaning_tasks').delete().eq('name', 'Straighten Up Stock')
}

export async function seedIfNeeded() {
  if (localStorage.getItem(SEED_KEY)) return

  // Staff members — full objects with pin and manager flag
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

  // Cleaning tasks
  const tasks = [
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
    { name: 'CD Balance Check', frequency: 'weekly' },
    // Fortnightly
    { name: 'Fridge Quick Clean', frequency: 'fortnightly' },
    { name: 'Straighten Up Fridge Stock', frequency: 'fortnightly' },
    // Monthly
    { name: 'Deep Fridge Clean', frequency: 'monthly' },
    { name: 'Monthly To Do List', frequency: 'monthly' },
    { name: 'Replace Near Miss Record', frequency: 'monthly' },
  ]

  // Cleaning log entries (snake_case for DB)
  const cleaning = [
    {
      id: generateId(),
      task_name: 'Deep Fridge Clean',
      date_time: '2026-02-23T10:00',
      staff_member: 'Salma Shakoor',
      result: 'Pass',
      notes: 'Due again in one month (late March 2026)',
      created_at: '2026-02-23T10:00:00.000Z',
    },
    {
      id: generateId(),
      task_name: 'Fridge Quick Clean',
      date_time: '2026-02-15T09:00',
      staff_member: 'Salma Shakoor',
      result: 'Pass',
      notes: 'Fortnightly — next due early March 2026',
      created_at: '2026-02-15T09:00:00.000Z',
    },
    {
      id: generateId(),
      task_name: 'Robot Maintenance',
      date_time: '2026-02-23T09:00',
      staff_member: 'Salma Shakoor',
      result: 'Pass',
      notes: 'Weekly — next due Monday 2 Mar 2026',
      created_at: '2026-02-23T09:00:00.000Z',
    },
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

  // Training topics (valueField table — each row is { name })
  const trainingTopics = [
    'Safeguarding Awareness',
    'GDPR Training',
    'Health & Safety',
    'General Dispensing Refresher',
    'Internal Delivery Refresher',
    'Dispensing Training',
    'Dispensing Course',
    'ACA Course',
    'CPD GPhC Revalidation',
    'Distance Pharmacy Regulatory Update',
    'Safeguarding Level 3 Review',
    'Information Governance & GDPR Refresher',
    'Fire Safety Awareness',
    'Manual Handling',
  ]

  // Training Logs (completed training records)
  const trainingLogs = [
    {
      id: generateId(),
      staff_name: 'Salma Shakoor',
      date_completed: '2026-01-10',
      topic: 'Safeguarding Awareness',
      trainer_name: 'Amjid Shakoor',
      delivery_method: 'Classroom',
      duration: '2 hours',
      outcome: 'Pass',
      certificate_expiry: '2028-01-10',
      renewal_date: '2027-12-10',
      notes: 'Level 1 awareness training completed',
      created_at: '2026-01-10T10:00:00.000Z',
    },
    {
      id: generateId(),
      staff_name: 'Umama Khan',
      date_completed: '2026-01-10',
      topic: 'Safeguarding Awareness',
      trainer_name: 'Amjid Shakoor',
      delivery_method: 'Classroom',
      duration: '2 hours',
      outcome: 'Pass',
      certificate_expiry: '2028-01-10',
      renewal_date: '2027-12-10',
      notes: '',
      created_at: '2026-01-10T10:00:00.000Z',
    },
    {
      id: generateId(),
      staff_name: 'Urooj Khan',
      date_completed: '2026-01-10',
      topic: 'Safeguarding Awareness',
      trainer_name: 'Amjid Shakoor',
      delivery_method: 'Classroom',
      duration: '2 hours',
      outcome: 'Pass',
      certificate_expiry: '2028-01-10',
      renewal_date: '2027-12-10',
      notes: '',
      created_at: '2026-01-10T10:00:00.000Z',
    },
    {
      id: generateId(),
      staff_name: 'Salma Shakoor',
      date_completed: '2026-01-15',
      topic: 'GDPR Training',
      trainer_name: 'Amjid Shakoor',
      delivery_method: 'Online',
      duration: '1 hour',
      outcome: 'Pass',
      certificate_expiry: '2027-01-15',
      renewal_date: '2026-12-15',
      notes: 'Annual GDPR refresher',
      created_at: '2026-01-15T09:00:00.000Z',
    },
    {
      id: generateId(),
      staff_name: 'Moniba Jamil',
      date_completed: '2026-01-15',
      topic: 'GDPR Training',
      trainer_name: 'Amjid Shakoor',
      delivery_method: 'Online',
      duration: '1 hour',
      outcome: 'Pass',
      certificate_expiry: '2027-01-15',
      renewal_date: '2026-12-15',
      notes: '',
      created_at: '2026-01-15T09:00:00.000Z',
    },
    {
      id: generateId(),
      staff_name: 'Shain Nawaz',
      date_completed: '2026-02-01',
      topic: 'Health & Safety',
      trainer_name: 'Amjid Shakoor',
      delivery_method: 'Classroom',
      duration: '3 hours',
      outcome: 'Pass',
      certificate_expiry: '2027-02-01',
      renewal_date: '2027-01-01',
      notes: 'Covers fire safety, manual handling, COSHH',
      created_at: '2026-02-01T10:00:00.000Z',
    },
    {
      id: generateId(),
      staff_name: 'Jamila Adwan',
      date_completed: '2026-02-01',
      topic: 'Health & Safety',
      trainer_name: 'Amjid Shakoor',
      delivery_method: 'Classroom',
      duration: '3 hours',
      outcome: 'Pass',
      certificate_expiry: '2027-02-01',
      renewal_date: '2027-01-01',
      notes: '',
      created_at: '2026-02-01T10:00:00.000Z',
    },
    {
      id: generateId(),
      staff_name: 'Marian Hadaway',
      date_completed: '2026-02-10',
      topic: 'Fire Safety Awareness',
      trainer_name: 'Amjid Shakoor',
      delivery_method: 'On-the-job',
      duration: '1 hour',
      outcome: 'Attended',
      certificate_expiry: '',
      renewal_date: '2027-02-10',
      notes: 'Practical fire extinguisher training',
      created_at: '2026-02-10T14:00:00.000Z',
    },
    {
      id: generateId(),
      staff_name: 'M Imran',
      date_completed: '2026-02-15',
      topic: 'Internal Delivery Refresher',
      trainer_name: 'Salma Shakoor',
      delivery_method: 'On-the-job',
      duration: '30 minutes',
      outcome: 'Pass',
      certificate_expiry: '',
      renewal_date: '2026-08-15',
      notes: 'Route safety and patient data handling',
      created_at: '2026-02-15T11:00:00.000Z',
    },
    {
      id: generateId(),
      staff_name: 'Sadaf Subhani',
      date_completed: '2026-02-20',
      topic: 'Dispensing Training',
      trainer_name: 'Jamila Adwan',
      delivery_method: 'On-the-job',
      duration: '4 hours',
      outcome: 'Attended',
      certificate_expiry: '',
      renewal_date: '',
      notes: 'Ongoing dispensing course — module 3 complete',
      created_at: '2026-02-20T09:00:00.000Z',
    },
    {
      id: generateId(),
      staff_name: 'Amjid Shakoor',
      date_completed: '2026-02-22',
      topic: 'CPD GPhC Revalidation',
      trainer_name: '',
      delivery_method: 'Self-study',
      duration: '6 hours',
      outcome: 'Certificate Issued',
      certificate_expiry: '2027-02-22',
      renewal_date: '2027-01-22',
      notes: 'Annual CPD cycle — 9 entries submitted to GPhC',
      created_at: '2026-02-22T16:00:00.000Z',
    },
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
      completed: false,
      created_at: '2026-02-27T09:00:00.000Z',
    },
    {
      id: generateId(),
      title: 'Chase up website',
      due_date: '2026-03-06',
      completed: false,
      created_at: '2026-02-27T09:00:00.000Z',
    },
    {
      id: generateId(),
      title: 'Parking bay council request',
      due_date: '2026-03-06',
      completed: false,
      created_at: '2026-02-27T09:00:00.000Z',
    },
    {
      id: generateId(),
      title: 'Chase up medicinal waste documents',
      due_date: '2026-03-06',
      completed: false,
      created_at: '2026-02-27T09:00:00.000Z',
    },
  ]

  // Clear old seed data before re-inserting
  await Promise.allSettled([
    supabase.from('cleaning_tasks').delete().neq('name', ''),
    supabase.from('cleaning_entries').delete().neq('id', ''),
    supabase.from('staff_members').delete().neq('name', ''),
    supabase.from('documents').delete().neq('id', ''),
    supabase.from('staff_training').delete().neq('id', ''),
    supabase.from('safeguarding_records').delete().neq('id', ''),
    supabase.from('rp_log').delete().neq('id', ''),
    supabase.from('training_topics').delete().neq('name', ''),
    supabase.from('training_logs').delete().neq('id', ''),
    supabase.from('action_items').delete().neq('id', ''),
    supabase.from('assigned_tasks').delete().neq('id', ''),
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

  localStorage.setItem(SEED_KEY, 'true')
}
