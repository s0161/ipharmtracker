import { generateId } from './helpers'

const SEED_KEY = 'ipd_seeded_v10'

export function seedIfNeeded() {
  if (localStorage.getItem(SEED_KEY)) return
  // Clear old data to re-seed
  localStorage.removeItem('ipd_staff')
  localStorage.removeItem('ipd_tasks')
  localStorage.removeItem('ipd_cleaning')
  localStorage.removeItem('ipd_documents')
  localStorage.removeItem('ipd_staff_training')
  localStorage.removeItem('ipd_seeded')
  localStorage.removeItem('ipd_seeded_v2')
  localStorage.removeItem('ipd_seeded_v3')
  localStorage.removeItem('ipd_seeded_v4')
  localStorage.removeItem('ipd_seeded_v5')
  localStorage.removeItem('ipd_seeded_v6')
  localStorage.removeItem('ipd_seeded_v7')
  localStorage.removeItem('ipd_seeded_v8')
  localStorage.removeItem('ipd_seeded_v9')
  localStorage.removeItem('ipd_safeguarding')

  // Staff members
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

  // Cleaning tasks with frequencies
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

  // Cleaning log entries
  const cleaning = [
    {
      id: generateId(),
      taskName: 'Fridge Cleaning',
      dateTime: '2026-02-23T10:00',
      staffMember: 'Salma Shakoor',
      result: 'Pass',
      notes: 'Due again in one month (late March 2026)',
      createdAt: '2026-02-23T10:00:00.000Z',
    },
    {
      id: generateId(),
      taskName: 'Date Check',
      dateTime: '2026-01-15T09:00',
      staffMember: 'Salma Shakoor',
      result: 'Pass',
      notes: 'Due again March 2026',
      createdAt: '2026-01-15T09:00:00.000Z',
    },
    {
      id: generateId(),
      taskName: 'Robot Maintenance',
      dateTime: '2026-02-23T09:00',
      staffMember: 'Salma Shakoor',
      result: 'Pass',
      notes: 'Weekly — next due Monday 2 Mar 2026',
      createdAt: '2026-02-23T09:00:00.000Z',
    },
  ]

  // Documents
  const documents = [
    {
      id: generateId(),
      documentName: 'Fire Risk Assessment — Actions Outstanding',
      category: 'SOP',
      owner: 'Salma Shakoor',
      issueDate: '2026-01-01',
      expiryDate: '2026-04-01',
      notes: 'Actions outstanding — due April 2026. Completed by Salma Shakoor, approved by Amjid Shakoor (RP & Superintendent)',
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      documentName: 'Health & Safety Assessment',
      category: 'SOP',
      owner: 'Salma Shakoor',
      issueDate: '2026-01-01',
      expiryDate: '2027-01-01',
      notes: 'Annual review. Completed by Salma Shakoor, approved by Amjid Shakoor (RP & Superintendent)',
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      documentName: 'Risk Assessment',
      category: 'SOP',
      owner: 'Salma Shakoor',
      issueDate: '2026-01-01',
      expiryDate: '2027-01-01',
      notes: 'Annual review. Completed by Salma Shakoor, approved by Amjid Shakoor (RP & Superintendent)',
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      documentName: 'Fire Extinguisher Servicing',
      category: 'Contract',
      owner: 'Amjid Shakoor',
      issueDate: '2025-09-05',
      expiryDate: '2026-09-05',
      notes: 'Contractor: Heytor Fire Protection, 109 Hyde Road, Denton, Manchester, M34 3BB. Contact: Chris Holt (Owner) — 07745717420. Certificate #2025-296. Standard: BS 5306/3. Both extinguishers commissioned — working codes confirmed.',
      createdAt: new Date().toISOString(),
    },
  ]

  // Staff Training Tracker
  function t(staffName, role, items) {
    return items.map(([trainingItem, targetDate]) => ({
      id: generateId(),
      staffName,
      role,
      trainingItem,
      targetDate,
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

    ...t('Sadaf Subhani', 'Dispenser (In Training)', [
      ['Dispensing Training', '2026-03-31'],
    ]),

    ...t('Seema Khatoon', 'Dispenser', commonDispenser),

    ...t('Umama Khan', 'Dispenser', [
      ['Dispensing Course', '2026-03-01'],
      ...commonDispenser,
    ]),

    ...t('Urooj Khan', 'Dispenser', commonDispenser),

    ...t('Salma Shakoor', 'Admin/Dispenser', [
      ['ACA Course', '2026-03-01'],
      ...commonDispenser,
    ]),

    ...t('Shain Nawaz', 'Dispenser', [
      ['ACA Course', '2026-03-01'],
      ...commonDispenser,
    ]),

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

  localStorage.setItem('ipd_staff', JSON.stringify(staff))
  localStorage.setItem('ipd_tasks', JSON.stringify(tasks))
  localStorage.setItem('ipd_cleaning', JSON.stringify(cleaning))
  localStorage.setItem('ipd_documents', JSON.stringify(documents))
  // Safeguarding Training Records
  const sgDefaults = {
    deliveredBy: 'Amjid Shakoor — Superintendent Pharmacist',
    trainingMethod: 'Internal — Level 1 Awareness',
    handbookVersion: 'v1.0 January 2026',
    signedOff: true,
  }

  const safeguarding = [
    { id: generateId(), staffName: 'Salma Shakoor', jobTitle: 'Admin/Dispenser', trainingDate: '2026-01-10', ...sgDefaults },
    { id: generateId(), staffName: 'Umama Khan', jobTitle: 'Dispenser', trainingDate: '2026-01-10', ...sgDefaults },
    { id: generateId(), staffName: 'Urooj Khan', jobTitle: 'Dispenser', trainingDate: '2026-01-10', ...sgDefaults },
    { id: generateId(), staffName: 'Shain Nawaz', jobTitle: 'Dispenser', trainingDate: '2026-01-10', ...sgDefaults },
    { id: generateId(), staffName: 'Moniba Jamil', jobTitle: 'Dispenser', trainingDate: '2026-01-10', ...sgDefaults },
    { id: generateId(), staffName: 'Seema Khatoon', jobTitle: 'Dispenser', trainingDate: '2026-01-10', ...sgDefaults },
    { id: generateId(), staffName: 'Jamila Adwan', jobTitle: 'Pharmacy Technician', trainingDate: '2026-01-10', ...sgDefaults },
  ]

  localStorage.setItem('ipd_staff_training', JSON.stringify(staffTraining))
  localStorage.setItem('ipd_safeguarding', JSON.stringify(safeguarding))
  localStorage.setItem(SEED_KEY, 'true')
}
