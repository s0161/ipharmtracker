#!/usr/bin/env node
/**
 * Enhances all SOPs with standard UK pharmacy SOP fields:
 * - scope, references, relatedSOPs, author, approvedBy, effectiveDate
 * Outputs the complete sopData.js file to stdout
 */
const data = require('../src/data/sopData.js').default

// ─── Staff who author/approve SOPs ───
const AUTHORS = ['Amjid Shakoor', 'Salma Shakoor', 'Moniba Jamil']
const APPROVER = 'Amjid Shakoor' // superintendent approves all

const ROLE_NAMES = {
  all: 'all pharmacy staff',
  superintendent: 'the Superintendent Pharmacist',
  manager: 'the Pharmacy Manager',
  pharmacist: 'all pharmacists',
  technician: 'pharmacy technicians',
  dispenser: 'dispensers',
  aca: 'Accuracy Checking Assistants',
  stock_assistant: 'stock assistants',
  driver: 'delivery drivers',
}

// ─── Category-level base references ───
const CATEGORY_REFS = {
  'Dispensing': [
    'Human Medicines Regulations 2012',
    'GPhC Standards for Pharmacy Professionals (2017)',
    'NHS Terms of Service for Community Pharmacy Contractors',
    'NICE NG5: Medicines Optimisation (2015)',
  ],
  'CD': [
    'Misuse of Drugs Act 1971',
    'Misuse of Drugs Regulations 2001 (as amended)',
    'Misuse of Drugs (Safe Custody) Regulations 1973',
    'GPhC Guidance on Controlled Drugs (2019)',
  ],
  'Clinical': [
    'GPhC Standards for Pharmacy Professionals (2017)',
    'NICE Medicines Optimisation Guidelines',
    'British National Formulary (BNF)',
    'GPhC Standards for Registered Pharmacies (2018)',
  ],
  'Governance': [
    'GPhC Standards for Registered Pharmacies (2018)',
    'GPhC Standards for Pharmacy Professionals (2017)',
    'Care Quality Commission (Registration) Regulations 2009',
    'NHS Terms of Service for Community Pharmacy Contractors',
  ],
  'H&S': [
    'Health and Safety at Work etc. Act 1974',
    'Management of Health and Safety at Work Regulations 1999',
    'Workplace (Health, Safety and Welfare) Regulations 1992',
    'GPhC Standards for Registered Pharmacies (2018)',
  ],
  'HR & Training': [
    'GPhC Standards for Pharmacy Professionals (2017)',
    'Employment Rights Act 1996',
    'ACAS Code of Practice on Disciplinary and Grievance Procedures',
    'Equality Act 2010',
  ],
  'Facilities': [
    'GPhC Standards for Registered Pharmacies (2018)',
    'Environmental Protection Act 1990',
    'Workplace (Health, Safety and Welfare) Regulations 1992',
    'Health and Safety at Work etc. Act 1974',
  ],
  'Delivery': [
    'Human Medicines Regulations 2012',
    'GPhC Standards for Registered Pharmacies (2018)',
    'NHS Terms of Service for Community Pharmacy Contractors',
    'Health and Safety at Work etc. Act 1974',
  ],
  'IT & Systems': [
    'UK General Data Protection Regulation (UK GDPR)',
    'Data Protection Act 2018',
    'NHS Digital Data Security and Protection Toolkit',
    'Cyber Essentials (NCSC)',
  ],
  'NHS Services': [
    'NHS England Community Pharmacy Contractual Framework',
    'NHS Terms of Service for Community Pharmacy Contractors',
    'PSNC Service Specifications',
    'GPhC Standards for Pharmacy Professionals (2017)',
  ],
  'Controlled Stationery': [
    'NHS Business Services Authority Prescription Form Guidance',
    'Misuse of Drugs Regulations 2001 (as amended)',
    'GPhC Standards for Registered Pharmacies (2018)',
    'NHS Counter Fraud Authority Guidance',
  ],
  'Internet Pharmacy': [
    'GPhC Standards for Registered Pharmacies (2018)',
    'GPhC Guidance for Internet Pharmacies',
    'Human Medicines Regulations 2012',
    'UK General Data Protection Regulation (UK GDPR)',
  ],
}

// ─── Keyword-specific extra references (appended if title/desc matches) ───
const KEYWORD_REFS = [
  { kw: /methad|buprenorphin|supervised consumption|substance misuse/i, refs: ['Drug Misuse and Dependence: UK Guidelines on Clinical Management (2017)', 'PHE Guidance on Pharmacy-Based Supervised Consumption'] },
  { kw: /vaccine|vaccin|immunis|flu |covid/i, refs: ['PHE Green Book: Immunisation Against Infectious Diseases', 'NHS England Vaccination Standards'] },
  { kw: /cold chain|fridge|temperature/i, refs: ['PHE Cold Chain Guidance for Immunisation Programmes', 'MHRA Guidance on Pharmaceutical Cold Chain'] },
  { kw: /gdpr|data protect|privacy|confidential waste/i, refs: ['UK GDPR (Regulation (EU) 2016/679 as retained)', 'ICO Guide to the UK GDPR', 'Data Protection Act 2018'] },
  { kw: /fire |evacuat/i, refs: ['Regulatory Reform (Fire Safety) Order 2005', 'HM Government Fire Safety Guidance'] },
  { kw: /coshh|hazardous sub/i, refs: ['Control of Substances Hazardous to Health Regulations 2002 (COSHH)', 'HSE COSHH Essentials Guidance'] },
  { kw: /manual handling/i, refs: ['Manual Handling Operations Regulations 1992', 'HSE Manual Handling at Work Guidance (L23)'] },
  { kw: /first aid/i, refs: ['Health and Safety (First-Aid) Regulations 1981', 'HSE First Aid at Work Guidance (L74)'] },
  { kw: /needle|sharps/i, refs: ['Health and Safety (Sharp Instruments in Healthcare) Regulations 2013', 'HSE Sharps Injuries Guidance'] },
  { kw: /violence|aggression/i, refs: ['HSE Work-Related Violence Guidance', 'NHS Employers Violence Prevention and Reduction Standard'] },
  { kw: /infection control|hygiene/i, refs: ['PHE Infection Prevention and Control Guidelines', 'NHS England IPC Guidance for Community Pharmacy'] },
  { kw: /dse|display screen/i, refs: ['Health and Safety (Display Screen Equipment) Regulations 1992', 'HSE Working with Display Screen Equipment (L26)'] },
  { kw: /electri/i, refs: ['Electricity at Work Regulations 1989', 'IET Wiring Regulations (BS 7671)'] },
  { kw: /slip|trip|fall/i, refs: ['HSE Slips and Trips Guidance (INDG225)', 'Workplace (Health, Safety and Welfare) Regulations 1992'] },
  { kw: /ppe|protective equipment/i, refs: ['Personal Protective Equipment at Work Regulations 2022', 'HSE PPE at Work Guidance (L25)'] },
  { kw: /working at height/i, refs: ['Work at Height Regulations 2005', 'HSE Working at Height Guidance (INDG401)'] },
  { kw: /lone work/i, refs: ['HSE Working Alone: Protecting Lone Workers Guidance (INDG73)', 'ACAS Lone Working Guidance'] },
  { kw: /appraisal|performance review/i, refs: ['ACAS Guide on Managing Performance', 'GPhC Revalidation Framework'] },
  { kw: /equality|diversity|inclusion/i, refs: ['Equality Act 2010', 'EHRC Code of Practice on Employment'] },
  { kw: /absence/i, refs: ['Employment Rights Act 1996', 'ACAS Managing Attendance and Employee Turnover'] },
  { kw: /disciplin|grievance/i, refs: ['ACAS Code of Practice on Disciplinary and Grievance Procedures (2015)', 'Employment Rights Act 1996'] },
  { kw: /dbs|disclosure|barring/i, refs: ['Safeguarding Vulnerable Groups Act 2006', 'DBS Filtering Rules Guidance'] },
  { kw: /student|pre-reg|trainee/i, refs: ['GPhC Initial Education and Training Standards (2021)', 'GPhC Foundation Training Framework'] },
  { kw: /safeguard/i, refs: ['Care Act 2014', 'Children Act 2004', 'Working Together to Safeguard Children (2018)'] },
  { kw: /anticoagulant|warfarin|inr/i, refs: ['NICE CG180: Atrial Fibrillation Management', 'NPSA Anticoagulant Safety Alert'] },
  { kw: /nms|new medicine service/i, refs: ['NHS England NMS Service Specification', 'PSNC NMS Toolkit'] },
  { kw: /pharmacy first/i, refs: ['NHS England Pharmacy First Service Specification (2024)', 'PSNC Pharmacy First Clinical Pathways'] },
  { kw: /blood pressure|hypertension/i, refs: ['NICE NG136: Hypertension in Adults (2019)', 'NHS England Hypertension Case-Finding Service Specification'] },
  { kw: /smoking cessation|stop smoking/i, refs: ['NICE PH10: Stop Smoking Services', 'NHS England Smoking Cessation Service Specification'] },
  { kw: /palliative/i, refs: ['NICE NG31: Care of Dying Adults in the Last Days of Life', 'NHS England Palliative Care Guidance for Community Pharmacy'] },
  { kw: /cpcs|consultation service/i, refs: ['NHS England CPCS Service Specification', 'PSNC CPCS Toolkit'] },
  { kw: /contraception|emergency hormonal/i, refs: ['NICE CG30: Long-Acting Reversible Contraception', 'FSRH Emergency Contraception Guidelines'] },
  { kw: /weight management/i, refs: ['NICE CG189: Obesity: Identification and Management', 'NHS England Weight Management Service Specification'] },
  { kw: /travel health/i, refs: ['NaTHNaC Travel Health Guidelines', 'PHE Green Book Travel Vaccination Chapters'] },
  { kw: /discharge medicine|dms/i, refs: ['NHS England DMS Service Specification', 'NICE NG5: Medicines Optimisation — Discharge Planning'] },
  { kw: /cqc|inspection/i, refs: ['CQC Registration Regulations 2009', 'CQC Key Lines of Enquiry Framework'] },
  { kw: /business continuity/i, refs: ['NHS England Community Pharmacy Resilience Guidance', 'BSI ISO 22301: Business Continuity Management'] },
  { kw: /risk register/i, refs: ['NHS England Risk Management Framework', 'HSE Managing Risk (INDG163)'] },
  { kw: /indemnity insurance/i, refs: ['GPhC Professional Indemnity Insurance Requirements', 'Health Care and Associated Professions (Indemnity Arrangements) Order 2014'] },
  { kw: /whistleblow/i, refs: ['Public Interest Disclosure Act 1998', 'NHS England Freedom to Speak Up Guidance'] },
  { kw: /complaint/i, refs: ['NHS Complaints Regulations 2009', 'Parliamentary and Health Service Ombudsman Guidance'] },
  { kw: /responsible pharmacist|rp register/i, refs: ['Medicines Act 1968 (as amended)', 'Responsible Pharmacist Regulations 2008'] },
  { kw: /near miss|error report/i, refs: ['NHS England Patient Safety Strategy (2019)', 'National Reporting and Learning System (NRLS) Guidance'] },
  { kw: /pest control/i, refs: ['Prevention of Damage by Pests Act 1949', 'Food Safety Act 1990 (as applicable)'] },
  { kw: /waste management|pharmaceutical waste/i, refs: ['Environmental Protection Act 1990', 'Hazardous Waste Regulations 2005', 'MHRA Guidance on Disposal of Pharmaceutical Waste'] },
  { kw: /alarm|cctv|security/i, refs: ['ICO CCTV Code of Practice', 'NSI/SSAIB Alarm Standards'] },
  { kw: /eps|electronic prescription/i, refs: ['NHS Digital EPS Guidance', 'NHS England EPS Contingency Procedures'] },
  { kw: /cyber|password|access/i, refs: ['NCSC Cyber Essentials Requirements', 'NHS Digital Data Security Standards'] },
  { kw: /pgd|patient group direction/i, refs: ['NICE MPG2: Patient Group Directions (2017)', 'MHRA PGD Guidance'] },
  { kw: /emergency supply/i, refs: ['Human Medicines Regulations 2012, Part 10', 'RPS Emergency Supply Guidance'] },
  { kw: /private prescription/i, refs: ['Human Medicines Regulations 2012, Part 12', 'NHSBSA Private Prescription Guidance'] },
  { kw: /extemporaneous|compounding/i, refs: ['RPS Professional Standards for Extemporaneous Preparation', 'MHRA Guidance on Manufacture of Unlicensed Medicines'] },
  { kw: /specials|unlicensed/i, refs: ['MHRA Guidance on the Supply of Unlicensed Medicinal Products (Specials)', 'Human Medicines Regulations 2012, Regulation 167'] },
  { kw: /blister|mds|compliance aid/i, refs: ['RPS Multi-Compartment Compliance Aids Guidance', 'NICE Medicines Adherence CG76'] },
  { kw: /repeat dispens/i, refs: ['NHS England Electronic Repeat Dispensing (eRD) Guidance', 'PSNC eRD Toolkit'] },
  { kw: /pregnancy|nursing|breastfeed/i, refs: ['UK Teratology Information Service (UKTIS)', 'BUMPS (Best Use of Medicines in Pregnancy)'] },
  { kw: /care home/i, refs: ['NICE SC1: Managing Medicines in Care Homes (2014)', 'NHS England Care Home Pharmacy Service Guidance'] },
  { kw: /counsel/i, refs: ['GPhC Standards for Pharmacy Professionals, Standard 3', 'NICE CG76: Medicines Adherence'] },
  { kw: /owing/i, refs: ['GPhC Standards for Registered Pharmacies, Principle 4', 'NHS Terms of Service, Schedule 4'] },
  { kw: /label|accuracy check/i, refs: ['Human Medicines Regulations 2012, Regulation 260', 'GPhC Standards for Registered Pharmacies, Principle 1'] },
  { kw: /distance sell|internet pharm|online pharm/i, refs: ['GPhC Guidance for Internet Pharmacies (2019)', 'EU Falsified Medicines Directive 2011/62/EU (as retained)', 'Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013'] },
  { kw: /advertising|website content/i, refs: ['MHRA Blue Guide: Advertising and Promotion of Medicines', 'ASA CAP Code (Non-Broadcast)', 'Human Medicines Regulations 2012, Part 14'] },
  { kw: /postal|courier|dispatch/i, refs: ['Royal Mail Prohibited and Restricted Items List', 'IATA Dangerous Goods Regulations (air freight)', 'GPhC Guidance on Delivery of Medicines'] },
  { kw: /fp10|prescription form|stationery/i, refs: ['NHSBSA Security of Prescription Forms Guidance', 'NHS Counter Fraud Authority Prescription Form Security Standards'] },
  { kw: /stock rotation|expiry/i, refs: ['GPhC Standards for Registered Pharmacies, Principle 4', 'MHRA Defective Medicines Reporting Guidance'] },
  { kw: /cleaning|maintenance|premises/i, refs: ['GPhC Standards for Registered Pharmacies, Principle 4', 'Workplace (Health, Safety and Welfare) Regulations 1992'] },
  { kw: /self.assessment|gphc annual/i, refs: ['GPhC Pharmacy Premises Self-Assessment Framework', 'GPhC Inspection Process Guidance'] },
  { kw: /clinical check|intervention/i, refs: ['NICE NG5: Medicines Optimisation (2015)', 'GPhC Standards for Pharmacy Professionals, Standard 6'] },
  { kw: /drug interaction/i, refs: ['BNF Appendix 1: Interactions', 'Stockley\'s Drug Interactions (online)', 'NICE CKS Drug Interactions Guidance'] },
  { kw: /minor ailment/i, refs: ['NHS England Minor Ailments Service Specification', 'PSNC Minor Ailments Service Toolkit'] },
  { kw: /induction/i, refs: ['GPhC Standards for Pharmacy Professionals, Standard 9', 'ACAS Induction Best Practice Guidance'] },
  { kw: /cpd|continuing professional/i, refs: ['GPhC CPD and Revalidation Framework (2018)', 'GPhC Standards for Pharmacy Professionals, Standard 9'] },
  { kw: /competenc/i, refs: ['GPhC Standards for Pharmacy Professionals, Standard 9', 'Skills for Health National Occupational Standards'] },
  { kw: /collection service/i, refs: ['NHS Terms of Service, Schedule 4', 'GPhC Standards for Registered Pharmacies, Principle 4'] },
  { kw: /instalment/i, refs: ['Misuse of Drugs Regulations 2001, Regulation 16', 'Home Office Instalment Prescribing Guidance'] },
  { kw: /hospital discharge/i, refs: ['NICE NG5: Medicines Optimisation — Transfer of Care', 'RPS Transfer of Care Guidance'] },
  { kw: /return.*medicine/i, refs: ['Environmental Protection Act 1990', 'MHRA Guidance on Disposal of Returned Medicines'] },
  { kw: /audit/i, refs: ['GPhC Standards for Registered Pharmacies, Principle 5', 'NHS England Clinical Governance Framework'] },
  { kw: /fitness to practise/i, refs: ['Pharmacy Order 2010', 'GPhC Fitness to Practise Annual Reports'] },
  { kw: /sop management|sop review/i, refs: ['GPhC Standards for Registered Pharmacies, Principle 5', 'ISO 9001:2015 Quality Management Systems'] },
]

// ─── Related SOPs mapping (id -> related SOP codes) ───
// Build cross-references based on topic clusters
const RELATED_MAP = {
  // Dispensing
  1: ['SOP-006','SOP-007','SOP-027'], 2: ['SOP-003','SOP-004','SOP-005'], 3: ['SOP-002','SOP-004','SOP-010'],
  4: ['SOP-001','SOP-003','SOP-102'], 5: ['SOP-001','SOP-051','SOP-006'], 6: ['SOP-001','SOP-007','SOP-027'],
  7: ['SOP-001','SOP-008','SOP-068'], 8: ['SOP-007','SOP-018','SOP-025'], 9: ['SOP-017','SOP-075','SOP-059'],
  10: ['SOP-001','SOP-006','SOP-098'], 56: ['SOP-061','SOP-001','SOP-018'], 57: ['SOP-001','SOP-117','SOP-018'],
  58: ['SOP-047','SOP-091','SOP-064'], 59: ['SOP-009','SOP-017','SOP-003'], 60: ['SOP-001','SOP-006','SOP-118'],
  61: ['SOP-056','SOP-001','SOP-006'],
  // CD
  11: ['SOP-013','SOP-014','SOP-065'], 12: ['SOP-064','SOP-013','SOP-066'], 13: ['SOP-011','SOP-014','SOP-017'],
  14: ['SOP-013','SOP-077','SOP-066'], 15: ['SOP-011','SOP-013','SOP-062'], 16: ['SOP-024','SOP-017','SOP-063'],
  17: ['SOP-009','SOP-013','SOP-059'], 62: ['SOP-063','SOP-011','SOP-014'], 63: ['SOP-062','SOP-011','SOP-016'],
  64: ['SOP-012','SOP-058','SOP-066'], 65: ['SOP-011','SOP-094','SOP-050'], 66: ['SOP-027','SOP-014','SOP-064'],
  // Clinical
  18: ['SOP-019','SOP-001','SOP-027'], 19: ['SOP-018','SOP-007','SOP-024'], 20: ['SOP-021','SOP-050','SOP-127'],
  21: ['SOP-020','SOP-070','SOP-071'], 22: ['SOP-069','SOP-023','SOP-070'], 23: ['SOP-069','SOP-024','SOP-022'],
  24: ['SOP-016','SOP-001','SOP-060'], 25: ['SOP-089','SOP-131','SOP-028'], 67: ['SOP-018','SOP-022','SOP-072'],
  68: ['SOP-108','SOP-007','SOP-018'], 69: ['SOP-112','SOP-023','SOP-022'], 70: ['SOP-021','SOP-113','SOP-022'],
  71: ['SOP-021','SOP-070','SOP-022'], 72: ['SOP-110','SOP-067','SOP-018'], 73: ['SOP-115','SOP-007','SOP-022'],
  74: ['SOP-018','SOP-011','SOP-096'], 75: ['SOP-009','SOP-059','SOP-025'],
  // Governance
  26: ['SOP-050','SOP-030','SOP-077'], 27: ['SOP-066','SOP-006','SOP-077'], 28: ['SOP-130','SOP-047','SOP-104'],
  29: ['SOP-027','SOP-030','SOP-078'], 30: ['SOP-081','SOP-042','SOP-031'], 31: ['SOP-029','SOP-030','SOP-088'],
  32: ['SOP-078','SOP-077','SOP-076'], 33: ['SOP-122','SOP-126','SOP-028'], 76: ['SOP-032','SOP-077','SOP-078'],
  77: ['SOP-014','SOP-076','SOP-078'], 78: ['SOP-032','SOP-077','SOP-076'], 79: ['SOP-080','SOP-101','SOP-050'],
  80: ['SOP-077','SOP-079','SOP-078'], 81: ['SOP-030','SOP-042','SOP-089'],
  // H&S
  34: ['SOP-050','SOP-095','SOP-037'], 35: ['SOP-085','SOP-040','SOP-091'], 36: ['SOP-084','SOP-034','SOP-037'],
  37: ['SOP-038','SOP-034','SOP-040'], 38: ['SOP-037','SOP-085','SOP-040'], 39: ['SOP-044','SOP-037','SOP-094'],
  40: ['SOP-085','SOP-035','SOP-037'], 82: ['SOP-100','SOP-084','SOP-037'], 83: ['SOP-095','SOP-048','SOP-034'],
  84: ['SOP-036','SOP-082','SOP-086'], 85: ['SOP-035','SOP-040','SOP-038'], 86: ['SOP-036','SOP-084','SOP-051'],
  // HR & Training
  41: ['SOP-043','SOP-089','SOP-046'], 42: ['SOP-043','SOP-030','SOP-090'], 43: ['SOP-041','SOP-042','SOP-045'],
  44: ['SOP-039','SOP-094','SOP-052'], 45: ['SOP-043','SOP-042','SOP-087'], 46: ['SOP-041','SOP-088','SOP-031'],
  87: ['SOP-045','SOP-088','SOP-044'], 88: ['SOP-087','SOP-031','SOP-046'], 89: ['SOP-025','SOP-041','SOP-043'],
  90: ['SOP-042','SOP-043','SOP-041'],
  // Facilities
  47: ['SOP-028','SOP-091','SOP-048'], 48: ['SOP-050','SOP-035','SOP-093'], 49: ['SOP-048','SOP-050','SOP-091'],
  50: ['SOP-026','SOP-020','SOP-094'], 51: ['SOP-048','SOP-091','SOP-010'], 91: ['SOP-047','SOP-058','SOP-035'],
  92: ['SOP-048','SOP-050','SOP-083'], 93: ['SOP-050','SOP-048','SOP-095'], 94: ['SOP-050','SOP-065','SOP-104'],
  95: ['SOP-094','SOP-034','SOP-083'],
  // Delivery
  52: ['SOP-054','SOP-053','SOP-055'], 53: ['SOP-020','SOP-127','SOP-052'], 54: ['SOP-052','SOP-096','SOP-124'],
  55: ['SOP-052','SOP-054','SOP-097'], 96: ['SOP-011','SOP-054','SOP-128'], 97: ['SOP-052','SOP-055','SOP-044'],
  98: ['SOP-052','SOP-010','SOP-054'], 99: ['SOP-058','SOP-052','SOP-064'],
  // IT & Systems
  100: ['SOP-101','SOP-107','SOP-102'], 101: ['SOP-100','SOP-079','SOP-103'], 102: ['SOP-004','SOP-100','SOP-105'],
  103: ['SOP-107','SOP-101','SOP-130'], 104: ['SOP-028','SOP-094','SOP-103'], 105: ['SOP-100','SOP-102','SOP-106'],
  106: ['SOP-100','SOP-102','SOP-105'], 107: ['SOP-100','SOP-103','SOP-028'],
  // NHS Services
  108: ['SOP-068','SOP-007','SOP-109'], 109: ['SOP-023','SOP-069','SOP-108'], 110: ['SOP-072','SOP-109','SOP-108'],
  111: ['SOP-069','SOP-025','SOP-022'], 112: ['SOP-069','SOP-109','SOP-023'], 113: ['SOP-070','SOP-021','SOP-108'],
  114: ['SOP-073','SOP-109','SOP-115'], 115: ['SOP-073','SOP-114','SOP-109'], 116: ['SOP-021','SOP-022','SOP-070'],
  117: ['SOP-057','SOP-108','SOP-001'],
  // Controlled Stationery
  118: ['SOP-060','SOP-120','SOP-121'], 119: ['SOP-118','SOP-120','SOP-121'], 120: ['SOP-118','SOP-119','SOP-014'],
  121: ['SOP-118','SOP-120','SOP-066'],
  // Internet Pharmacy
  122: ['SOP-033','SOP-129','SOP-130'], 123: ['SOP-124','SOP-125','SOP-131'], 124: ['SOP-123','SOP-054','SOP-128'],
  125: ['SOP-001','SOP-006','SOP-126'], 126: ['SOP-125','SOP-127','SOP-052'], 127: ['SOP-053','SOP-126','SOP-020'],
  128: ['SOP-011','SOP-124','SOP-096'], 129: ['SOP-122','SOP-033','SOP-130'], 130: ['SOP-028','SOP-122','SOP-107'],
  131: ['SOP-025','SOP-123','SOP-128'], 132: ['SOP-029','SOP-058','SOP-126'], 133: ['SOP-079','SOP-101','SOP-122'],
}

// ─── Generate scope from roles + description ───
function generateScope(sop) {
  const roleList = sop.roles.includes('all')
    ? 'all pharmacy staff'
    : sop.roles.map(r => ROLE_NAMES[r] || r).join(', ')

  // Extract the first sentence of description for context
  const firstSentence = sop.description.split('. ')[0]

  return `This SOP applies to ${roleList} at iPharmacy Direct. It covers all activities relating to ${sop.title.toLowerCase()} and must be read, understood, and acknowledged before undertaking any related duties. ${firstSentence}.`
}

// ─── Generate references for a SOP ───
function generateReferences(sop) {
  const baseRefs = CATEGORY_REFS[sop.category] || []
  const extraRefs = new Set()
  const searchText = `${sop.title} ${sop.description}`

  for (const { kw, refs } of KEYWORD_REFS) {
    if (kw.test(searchText)) {
      refs.forEach(r => extraRefs.add(r))
    }
  }

  // Combine, deduplicate, limit to 6
  const combined = [...new Set([...baseRefs, ...extraRefs])]
  return combined.slice(0, 6)
}

// ─── Generate effective date (6-18 months before review date) ───
function generateEffectiveDate(reviewDate, version) {
  const review = new Date(reviewDate + 'T00:00:00')
  // Higher version = older SOP, more history
  const vMajor = parseFloat(version)
  const monthsBack = 12 + Math.floor(vMajor * 2) // 14-18 months before review
  const effective = new Date(review)
  effective.setMonth(effective.getMonth() - Math.min(monthsBack, 24))
  return effective.toISOString().split('T')[0]
}

// ─── Generate author (rotate through AUTHORS based on id) ───
function generateAuthor(sop) {
  return AUTHORS[sop.id % AUTHORS.length]
}

// ─── Process all SOPs ───
const enhanced = data.map(sop => ({
  ...sop,
  scope: generateScope(sop),
  references: generateReferences(sop),
  relatedSOPs: RELATED_MAP[sop.id] || [],
  author: generateAuthor(sop),
  approvedBy: APPROVER,
  effectiveDate: generateEffectiveDate(sop.reviewDate, sop.version),
}))

// ─── Output as JS module ───
const lines = [
  '// ─── SOP DATA — UK Community Pharmacy SOPs ───',
  '// Enhanced with scope, references, related SOPs, and document control',
  '',
  'const DUMMY_SOPS = ' + JSON.stringify(enhanced, null, 2),
  '',
  'export default DUMMY_SOPS',
  '',
]

// Fix JSON to JS (unquote keys where simple)
let output = lines.join('\n')
// Make the JSON output a bit more readable - convert key quotes to unquoted where valid
output = output.replace(/"(\w+)":/g, '$1: ')

process.stdout.write(output)
