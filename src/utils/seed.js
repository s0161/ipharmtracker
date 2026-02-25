import { supabase } from '../lib/supabase'
import { generateId } from './helpers'

const SEED_KEY = 'ipd_seeded_v10'

export async function seedIfNeeded() {
  if (localStorage.getItem(SEED_KEY)) return

  // Staff members (valueField table — each row is { name })
  const staff = [
    'Umama Khan',
    'Urooj Khan',
    'Sadaf Subhani',
    'Salma Shakoor',
    'Marian Hadaway',
    'Jamila Adwan',
    'Shain Nawaz',
    'Amjid Shakoor',
    'M Imran',
    'Shahzadul Hassan',
    'Manzoor Ahmed',
    'Moniba Jamil',
    'Seema Khatoon',
    'Sarmad Khalid',
  ]

  // Cleaning tasks
  const tasks = [
    { name: 'Fridge Cleaning', frequency: 'monthly' },
    { name: 'Date Check', frequency: 'monthly' },
    { name: 'Temperature Log', frequency: 'daily' },
    { name: 'Dispensary Clean', frequency: 'daily' },
    { name: 'Robot Maintenance', frequency: 'weekly' },
    { name: 'Bathroom Clean', frequency: 'weekly' },
    { name: 'Floor Clean', frequency: 'weekly' },
    { name: 'Kitchen Clean', frequency: 'weekly' },
  ]

  // Cleaning log entries (snake_case for DB)
  const cleaning = [
    {
      id: generateId(),
      task_name: 'Fridge Cleaning',
      date_time: '2026-02-23T10:00',
      staff_member: 'Salma Shakoor',
      result: 'Pass',
      notes: 'Due again in one month (late March 2026)',
      created_at: '2026-02-23T10:00:00.000Z',
    },
    {
      id: generateId(),
      task_name: 'Date Check',
      date_time: '2026-01-15T09:00',
      staff_member: 'Salma Shakoor',
      result: 'Pass',
      notes: 'Due again March 2026',
      created_at: '2026-01-15T09:00:00.000Z',
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
    ...t('Seema Khatoon', 'Dispenser', commonDispenser),
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
    { id: generateId(), staff_name: 'Seema Khatoon', job_title: 'Dispenser', training_date: '2026-01-10', ...sgDefaults },
    { id: generateId(), staff_name: 'Jamila Adwan', job_title: 'Pharmacy Technician', training_date: '2026-01-10', ...sgDefaults },
  ]

  // Insert into Supabase tables
  const inserts = [
    supabase.from('staff_members').insert(staff.map((name) => ({ name }))),
    supabase.from('cleaning_tasks').insert(tasks),
    supabase.from('cleaning_entries').insert(cleaning),
    supabase.from('documents').insert(documents),
    supabase.from('staff_training').insert(staffTraining),
    supabase.from('safeguarding_records').insert(safeguarding),
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
