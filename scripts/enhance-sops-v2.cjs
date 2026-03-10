#!/usr/bin/env node
/**
 * Enhances all 133 SOPs with 8 additional GPhC-standard fields:
 * responsibilities, revisionHistory, trainingRequirements, monitoring,
 * riskAssessment, escalation, reviewTriggers, appendices
 *
 * Uses category-based templates + keyword matching for per-SOP refinement.
 * Outputs the complete sopData.js file to stdout.
 */
const data = require('../src/data/sopData.js').default

// ─── CATEGORY-BASED RESPONSIBILITIES ───
const CATEGORY_RESPONSIBILITIES = {
  Dispensing: {
    pharmacist: 'Perform final clinical check on all dispensed items and authorise handout',
    technician: 'Accurately label and assemble prescriptions according to SOP steps',
    dispenser: 'Receive prescriptions, generate labels, and assist with assembly',
    aca: 'Perform accuracy checking on assembled items before pharmacist sign-off',
    manager: 'Monitor dispensing accuracy rates and ensure adequate staffing',
    superintendent: 'Ensure dispensing processes meet GPhC regulatory standards',
    all: 'Follow standard dispensing workflow for all prescription types',
  },
  CD: {
    pharmacist: 'Verify CD prescriptions meet legal requirements and authorise supply',
    technician: 'Assist with CD receipt, storage, and register entries under pharmacist supervision',
    dispenser: 'Prepare CD prescriptions for pharmacist verification',
    manager: 'Conduct monthly CD register audits and manage access controls',
    superintendent: 'Ensure full compliance with Misuse of Drugs legislation',
    all: 'Handle controlled drugs only in accordance with this SOP',
  },
  Clinical: {
    pharmacist: 'Deliver clinical services, perform patient assessments, and document outcomes',
    technician: 'Support clinical service delivery and patient record maintenance',
    dispenser: 'Assist with patient booking and follow-up communications',
    aca: 'Support clinical documentation and record accuracy',
    manager: 'Monitor clinical service KPIs and patient outcomes',
    superintendent: 'Ensure clinical services meet GPhC and NICE standards',
    all: 'Support clinical service delivery within scope of competence',
  },
  Governance: {
    pharmacist: 'Act as Responsible Pharmacist and ensure governance compliance on shift',
    manager: 'Maintain governance documentation and conduct internal audits',
    superintendent: 'Oversee all governance frameworks and regulatory compliance',
    technician: 'Follow governance procedures and report deviations',
    dispenser: 'Adhere to governance policies and escalate concerns',
    all: 'Follow governance procedures and report any compliance concerns',
  },
  'H&S': {
    manager: 'Conduct risk assessments and ensure H&S policies are implemented',
    superintendent: 'Ensure statutory H&S obligations are met across the pharmacy',
    pharmacist: 'Report hazards and ensure patient safety during service delivery',
    technician: 'Follow H&S procedures and maintain safe working practices',
    dispenser: 'Report hazards and follow safe working procedures',
    stock_assistant: 'Follow manual handling procedures and maintain safe storage',
    driver: 'Follow road safety procedures and report vehicle issues',
    all: 'Follow health and safety policies and report hazards immediately',
  },
  'HR & Training': {
    manager: 'Manage staff training records, appraisals, and development plans',
    superintendent: 'Ensure GPhC CPD and training requirements are met across the team',
    pharmacist: 'Mentor junior staff and maintain personal CPD portfolio',
    technician: 'Complete required training modules and maintain competency records',
    dispenser: 'Complete mandatory training and attend team briefings',
    all: 'Engage with training programmes and maintain personal development',
  },
  Facilities: {
    manager: 'Schedule and oversee facility maintenance and cleaning programmes',
    superintendent: 'Ensure premises meet GPhC registered pharmacy standards',
    stock_assistant: 'Maintain clean and organised storage areas',
    technician: 'Report facility issues and maintain dispensary cleanliness',
    dispenser: 'Maintain clean workstation and report maintenance needs',
    all: 'Maintain a clean, safe working environment',
  },
  Delivery: {
    driver: 'Deliver medicines safely, obtain signatures, and maintain chain of custody',
    pharmacist: 'Authorise deliveries and ensure clinical appropriateness of delivery items',
    manager: 'Schedule delivery routes and monitor service performance',
    technician: 'Prepare delivery bags with correct labelling and documentation',
    dispenser: 'Assist with delivery preparation and patient notification',
    all: 'Support the safe and timely delivery of medicines to patients',
  },
  'IT & Systems': {
    manager: 'Manage IT systems, user access, and data security compliance',
    superintendent: 'Ensure IT systems meet NHS DSPT and regulatory requirements',
    pharmacist: 'Use clinical systems accurately and report IT issues promptly',
    technician: 'Follow IT procedures and maintain system data integrity',
    dispenser: 'Use pharmacy systems correctly and report faults immediately',
    all: 'Follow IT security policies and protect patient data',
  },
  'NHS Services': {
    pharmacist: 'Deliver NHS services within scope and document all consultations',
    technician: 'Support NHS service delivery and patient record maintenance',
    dispenser: 'Assist with NHS service administration and patient booking',
    aca: 'Support NHS service documentation and accuracy',
    manager: 'Monitor NHS service targets, claims, and quality metrics',
    superintendent: 'Ensure NHS contractual obligations are fulfilled',
    all: 'Support NHS service delivery within scope of competence',
  },
  'Controlled Stationery': {
    pharmacist: 'Authorise controlled stationery usage and verify stock levels',
    technician: 'Maintain controlled stationery registers and flag discrepancies',
    manager: 'Audit controlled stationery usage and manage procurement',
    superintendent: 'Ensure controlled stationery governance meets regulatory standards',
    dispenser: 'Use controlled stationery items according to procedures',
    all: 'Handle controlled stationery items in accordance with this SOP',
  },
  'Internet Pharmacy': {
    pharmacist: 'Verify online prescriptions and authorise distance-sale supply',
    technician: 'Process online orders accurately following distance-selling regulations',
    dispenser: 'Prepare online orders for pharmacist verification',
    manager: 'Monitor online service compliance and patient verification processes',
    superintendent: 'Ensure internet pharmacy operations meet GPhC distance-selling standards',
    all: 'Follow internet pharmacy procedures for all online transactions',
  },
}

// ─── CATEGORY TRAINING REQUIREMENTS ───
const CATEGORY_TRAINING = {
  Dispensing: ['GPhC-accredited dispensing competency assessment', 'Annual dispensing accuracy refresher', 'Medicines labelling and patient counselling training'],
  CD: ['Controlled Drugs handling and legislation training', 'CD register maintenance certification', 'Annual CD governance refresher'],
  Clinical: ['Clinical assessment and consultation skills training', 'Safeguarding awareness (Level 2 minimum)', 'Relevant clinical service accreditation'],
  Governance: ['GPhC regulatory framework awareness training', 'Incident reporting and root cause analysis', 'Responsible Pharmacist awareness module'],
  'H&S': ['Health & Safety induction and annual refresher', 'Fire safety and emergency evacuation training', 'Manual handling assessment'],
  'HR & Training': ['Staff management and appraisal skills', 'Equality and diversity awareness', 'GDPR data handling for HR records'],
  Facilities: ['Premises maintenance and hygiene standards', 'COSHH awareness and chemical handling', 'Waste segregation and disposal procedures'],
  Delivery: ['Delivery chain of custody procedures', 'Vehicle safety and maintenance checks', 'Patient identity verification at delivery'],
  'IT & Systems': ['NHS Data Security and Protection Toolkit modules', 'Pharmacy system (PMR) operational training', 'Cyber security awareness and phishing prevention'],
  'NHS Services': ['NHS service specification and pathway training', 'PharmOutcomes or equivalent recording system', 'Clinical governance for NHS services'],
  'Controlled Stationery': ['Controlled stationery handling and security', 'Audit and reconciliation procedures', 'FP10 security and destruction protocols'],
  'Internet Pharmacy': ['GPhC distance-selling standards training', 'Online patient verification and safeguarding', 'E-commerce and data security for pharmacy'],
}

// ─── CATEGORY MONITORING ───
const CATEGORY_MONITORING = {
  Dispensing: 'Monthly dispensing accuracy audit conducted by the Responsible Pharmacist, with results reported at team meetings',
  CD: 'Weekly CD register reconciliation and quarterly audit by superintendent, with records retained for 2 years',
  Clinical: 'Quarterly clinical outcomes audit against NICE benchmarks, with peer review of consultation records',
  Governance: 'Annual governance framework review and bi-monthly compliance spot-checks by the superintendent',
  'H&S': 'Monthly H&S walkthrough inspection and quarterly incident trend analysis',
  'HR & Training': 'Quarterly training compliance review and annual appraisal completion audit',
  Facilities: 'Weekly premises inspection and monthly deep-clean verification against checklist',
  Delivery: 'Weekly delivery log review and monthly patient feedback analysis',
  'IT & Systems': 'Monthly access log review and annual DSPT self-assessment submission',
  'NHS Services': 'Monthly service activity review against NHS targets with quarterly quality audit',
  'Controlled Stationery': 'Weekly stationery stock check and monthly audit trail reconciliation',
  'Internet Pharmacy': 'Monthly online transaction audit and quarterly patient verification review',
}

// ─── CATEGORY RISKS ───
const CATEGORY_RISKS = {
  Dispensing: [
    { risk: 'Wrong medicine dispensed to patient', mitigation: 'Two-stage accuracy checking process with independent final check' },
    { risk: 'Incorrect labelling or dosage instructions', mitigation: 'Standardised label generation and mandatory label verification step' },
    { risk: 'Patient allergy or interaction missed', mitigation: 'PMR clinical screening and pharmacist clinical check before handout' },
    { risk: 'Prescription not meeting legal requirements', mitigation: 'Prescription validity checklist applied at intake stage' },
  ],
  CD: [
    { risk: 'CD stock discrepancy or loss', mitigation: 'Daily running balance checks and dual-witness stock counts' },
    { risk: 'Unauthorised access to CD cabinet', mitigation: 'Restricted key access, CCTV monitoring, and access log maintenance' },
    { risk: 'CD register recording error', mitigation: 'Real-time register entries with independent pharmacist verification' },
    { risk: 'CD prescription forgery', mitigation: 'Prescriber verification protocol and CD prescription checklist' },
  ],
  Clinical: [
    { risk: 'Incorrect clinical assessment or diagnosis', mitigation: 'Standardised assessment frameworks and referral pathways' },
    { risk: 'Adverse reaction during service delivery', mitigation: 'Emergency medicine kit availability and anaphylaxis training' },
    { risk: 'Inadequate patient records', mitigation: 'Mandatory documentation at point of care with audit trail' },
    { risk: 'Safeguarding concern not identified', mitigation: 'Safeguarding training and escalation protocol for all staff' },
  ],
  Governance: [
    { risk: 'Regulatory non-compliance identified during inspection', mitigation: 'Scheduled internal audits and pre-inspection readiness checks' },
    { risk: 'Failure to report notifiable incident', mitigation: 'Incident classification matrix and mandatory reporting flowchart' },
    { risk: 'Outdated SOPs in use', mitigation: 'Automated review date tracking and version control system' },
    { risk: 'Staff unaware of policy changes', mitigation: 'Mandatory SOP acknowledgement system with completion tracking' },
  ],
  'H&S': [
    { risk: 'Staff injury from manual handling', mitigation: 'Manual handling training and risk assessment for heavy items' },
    { risk: 'Fire or emergency evacuation failure', mitigation: 'Quarterly fire drills, maintained equipment, and visible exit routes' },
    { risk: 'Sharps injury or needlestick', mitigation: 'Sharps bins, PPE provision, and post-exposure protocol' },
    { risk: 'Slip, trip, or fall hazard', mitigation: 'Regular floor inspections, prompt spill cleanup, and hazard reporting' },
  ],
  'HR & Training': [
    { risk: 'Staff operating beyond competence', mitigation: 'Role-based training matrix and supervised practice periods' },
    { risk: 'Training records incomplete or lost', mitigation: 'Centralised digital training record system with backup' },
    { risk: 'Non-compliance with CPD requirements', mitigation: 'CPD tracker with automated reminders and manager oversight' },
    { risk: 'Discrimination or harassment in workplace', mitigation: 'Equality policy, reporting channels, and annual awareness training' },
  ],
  Facilities: [
    { risk: 'Temperature excursion in storage areas', mitigation: 'Continuous temperature monitoring with automated alerts' },
    { risk: 'Pest contamination of stock', mitigation: 'Pest control contract and monthly inspection schedule' },
    { risk: 'Equipment failure affecting operations', mitigation: 'Planned preventive maintenance schedule and backup procedures' },
    { risk: 'Inadequate waste segregation', mitigation: 'Colour-coded waste streams and staff waste training' },
  ],
  Delivery: [
    { risk: 'Medicine delivered to wrong patient', mitigation: 'Patient identity verification at point of delivery with photo ID check' },
    { risk: 'Temperature-sensitive item compromised during transit', mitigation: 'Cool bags with temperature indicators and maximum transit time limits' },
    { risk: 'Delivery driver road traffic incident', mitigation: 'Vehicle maintenance checks, driver training, and insurance verification' },
    { risk: 'Missed or failed delivery attempt', mitigation: 'Safe place protocol and patient contact procedures' },
  ],
  'IT & Systems': [
    { risk: 'Data breach or unauthorised access', mitigation: 'Role-based access control, encryption, and security audit logging' },
    { risk: 'System downtime affecting dispensing', mitigation: 'Business continuity plan with manual dispensing backup procedure' },
    { risk: 'Phishing or cyber attack', mitigation: 'Staff cyber awareness training and email filtering systems' },
    { risk: 'Loss of patient data', mitigation: 'Automated daily backups with tested restore procedures' },
  ],
  'NHS Services': [
    { risk: 'NHS claim rejection due to documentation error', mitigation: 'Standardised recording templates and pre-submission validation' },
    { risk: 'Patient pathway not followed correctly', mitigation: 'Decision support tools and clinical pathway checklists' },
    { risk: 'Target shortfall affecting contract', mitigation: 'Monthly activity tracking and proactive patient engagement' },
    { risk: 'Patient complaint about service quality', mitigation: 'Patient feedback mechanism and complaint handling procedure' },
  ],
  'Controlled Stationery': [
    { risk: 'FP10 forms lost or stolen', mitigation: 'Secure storage, sequential tracking, and immediate loss reporting' },
    { risk: 'Unauthorised use of controlled stationery', mitigation: 'Access restricted to authorised personnel with usage log' },
    { risk: 'Destruction records incomplete', mitigation: 'Witnessed destruction protocol with dual-signature records' },
    { risk: 'Stationery stock-out affecting operations', mitigation: 'Minimum stock levels and reorder point system' },
  ],
  'Internet Pharmacy': [
    { risk: 'Patient identity not verified for online order', mitigation: 'Mandatory ID verification process before first supply' },
    { risk: 'Medicine supplied inappropriately via distance sale', mitigation: 'Clinical screening checklist and pharmacist review of all orders' },
    { risk: 'Data protection breach from online transactions', mitigation: 'SSL encryption, PCI compliance, and regular security testing' },
    { risk: 'Website displaying incorrect medicine information', mitigation: 'Regular content review and version-controlled product data' },
  ],
}

// ─── CATEGORY ESCALATION ───
const CATEGORY_ESCALATION = {
  Dispensing: 'Report any dispensing error or near miss to the Responsible Pharmacist immediately. If RP unavailable, contact the Superintendent Pharmacist. Complete an incident form within 24 hours.',
  CD: 'Report any CD discrepancy to the Responsible Pharmacist immediately. Contact the Superintendent Pharmacist and consider reporting to the Home Office CD Liaison Officer within 24 hours.',
  Clinical: 'Escalate clinical concerns to the Responsible Pharmacist on duty. For medical emergencies, call 999. Report adverse reactions via the Yellow Card Scheme within 24 hours.',
  Governance: 'Report governance breaches to the Pharmacy Manager. For serious regulatory concerns, escalate to the Superintendent Pharmacist immediately. Consider GPhC notification if required.',
  'H&S': 'Report injuries or dangerous occurrences to the Pharmacy Manager immediately. For RIDDOR-reportable incidents, contact the Superintendent within 1 hour. Call emergency services if needed.',
  'HR & Training': 'Raise HR concerns with the Pharmacy Manager in the first instance. For grievances, follow the formal procedure. Escalate safeguarding concerns to the designated safeguarding lead.',
  Facilities: 'Report facility failures to the Pharmacy Manager. For urgent issues affecting patient safety (e.g., fridge failure), contact the Superintendent immediately and implement contingency plan.',
  Delivery: 'Report delivery incidents to the Pharmacy Manager. For missing controlled drugs, notify the Responsible Pharmacist immediately. Contact the patient if delivery is delayed beyond agreed timeframe.',
  'IT & Systems': 'Report IT failures to the Pharmacy Manager. For suspected data breaches, notify the Superintendent Pharmacist and Data Protection Officer within 1 hour. Activate business continuity plan if needed.',
  'NHS Services': 'Escalate NHS service concerns to the Pharmacy Manager. For serious patient safety issues, contact the Responsible Pharmacist immediately. Report to NHS England if contractual breach is identified.',
  'Controlled Stationery': 'Report missing or stolen stationery to the Pharmacy Manager and Superintendent immediately. For FP10 losses, notify NHS Counter Fraud Authority within 24 hours.',
  'Internet Pharmacy': 'Report online pharmacy concerns to the Pharmacy Manager. For suspected fraudulent orders, escalate to the Superintendent and consider reporting to GPhC and MHRA.',
}

// ─── CATEGORY APPENDICES ───
const CATEGORY_APPENDICES = {
  Dispensing: ['Near Miss Report Form', 'Dispensing Error Log', 'Prescription Validity Checklist', 'Patient Counselling Record'],
  CD: ['CD Register Template', 'CD Destruction Record', 'CD Discrepancy Report Form', 'CD Cabinet Key Log'],
  Clinical: ['Patient Assessment Form', 'Clinical Intervention Record', 'Referral Letter Template', 'Yellow Card Reporting Form'],
  Governance: ['Incident Report Form', 'SOP Acknowledgement Record', 'Audit Checklist Template', 'Complaints Log'],
  'H&S': ['Risk Assessment Template', 'Accident Report Form (BI 510)', 'COSHH Assessment Sheet', 'Fire Drill Record'],
  'HR & Training': ['Training Record Template', 'Appraisal Form', 'CPD Log Template', 'Induction Checklist'],
  Facilities: ['Cleaning Schedule Template', 'Temperature Monitoring Log', 'Maintenance Request Form', 'Waste Transfer Note'],
  Delivery: ['Delivery Log Template', 'Patient Signature Record', 'Vehicle Inspection Checklist', 'Failed Delivery Report'],
  'IT & Systems': ['User Access Request Form', 'Data Breach Incident Form', 'System Downtime Log', 'DSPT Evidence Checklist'],
  'NHS Services': ['Service Consultation Record', 'NHS Claim Submission Log', 'Patient Feedback Form', 'Service Activity Tracker'],
  'Controlled Stationery': ['Stationery Issue Log', 'FP10 Destruction Record', 'Stock Reconciliation Form', 'Loss Report Template'],
  'Internet Pharmacy': ['Online Order Verification Checklist', 'Patient ID Verification Record', 'Website Content Review Log', 'Distance Selling Compliance Checklist'],
}

// ─── CATEGORY REVIEW TRIGGERS (category-specific) ───
const CATEGORY_REVIEW_TRIGGERS = {
  Dispensing: ['Dispensing error resulting in patient harm', 'Change to NHS dispensing contractual requirements'],
  CD: ['CD-related incident or Home Office enquiry', 'Amendment to Misuse of Drugs Regulations'],
  Clinical: ['Adverse clinical outcome or patient complaint', 'Update to NICE clinical guidelines or pathways'],
  Governance: ['GPhC inspection finding or enforcement action', 'Organisational restructure or change of superintendent'],
  'H&S': ['Workplace accident or RIDDOR-reportable incident', 'Change to health and safety legislation'],
  'HR & Training': ['Employment tribunal or formal grievance outcome', 'Change to GPhC CPD or training requirements'],
  Facilities: ['Major equipment failure or premises damage', 'Change to pharmacy premises standards'],
  Delivery: ['Delivery-related patient safety incident', 'Change to delivery service contractual terms'],
  'IT & Systems': ['Data breach or significant IT security incident', 'Change to DSPT or data protection legislation'],
  'NHS Services': ['NHS contract breach notification or service decommission', 'Change to NHS service specification'],
  'Controlled Stationery': ['Loss, theft, or misuse of controlled stationery', 'Change to NHS stationery governance requirements'],
  'Internet Pharmacy': ['GPhC distance-selling inspection finding', 'Change to online pharmacy regulations'],
}

// ─── UNIVERSAL REVIEW TRIGGERS ───
const UNIVERSAL_TRIGGERS = [
  'Significant incident, near miss, or trend identified through monitoring',
  'Change in legislation, regulation, or professional guidance',
]

// ─── REVISION DESCRIPTION TEMPLATES ───
const REVISION_DESCRIPTIONS = {
  Dispensing: ['Updated dispensing workflow to align with latest GPhC guidance', 'Incorporated PMR system upgrade requirements', 'Added enhanced clinical screening steps'],
  CD: ['Revised to reflect latest Misuse of Drugs Regulations amendments', 'Updated CD destruction procedures', 'Enhanced CD register audit requirements'],
  Clinical: ['Updated clinical pathways per latest NICE guidance', 'Added Pharmacy First consultation framework', 'Enhanced documentation requirements for clinical services'],
  Governance: ['Revised governance framework following GPhC inspection feedback', 'Updated incident reporting classifications', 'Enhanced SOP review and version control process'],
  'H&S': ['Updated risk assessments following annual review', 'Revised fire safety procedures per local authority guidance', 'Added lone working provisions'],
  'HR & Training': ['Updated training matrix for new service requirements', 'Revised appraisal process per ACAS guidance', 'Enhanced CPD tracking and reporting'],
  Facilities: ['Revised cleaning schedules per infection control update', 'Updated temperature monitoring procedures', 'Added sustainability and waste reduction measures'],
  Delivery: ['Enhanced delivery tracking and chain of custody procedures', 'Updated vehicle safety requirements', 'Added cold chain management during transit'],
  'IT & Systems': ['Updated cyber security measures per DSPT requirements', 'Revised access control and password policies', 'Added remote working IT security guidance'],
  'NHS Services': ['Updated service pathways per NHS contract changes', 'Enhanced clinical documentation templates', 'Added new Pharmacy First service pathways'],
  'Controlled Stationery': ['Updated FP10 tracking requirements', 'Revised destruction and disposal procedures', 'Enhanced reconciliation frequency and reporting'],
  'Internet Pharmacy': ['Updated distance-selling compliance per GPhC guidance', 'Enhanced online patient verification process', 'Added e-commerce security requirements'],
}

// ─── KEYWORD OVERRIDES ───
// { pattern: regex, field: { ... override data } }
const KEYWORD_OVERRIDES = [
  {
    pattern: /vaccin|immunis/i,
    training: 'Vaccination and immunisation administration accreditation',
    monitoring: 'Post-vaccination adverse reaction monitoring and Yellow Card reporting after each vaccination clinic',
    risks: [{ risk: 'Anaphylactic reaction post-vaccination', mitigation: 'Anaphylaxis kit available, staff trained in emergency response, 15-minute observation period' }],
    appendices: ['Vaccination Patient Group Direction (PGD)', 'Anaphylaxis Emergency Protocol'],
  },
  {
    pattern: /methad|opiat|substitut/i,
    training: 'Substance misuse service and supervised consumption training',
    risks: [{ risk: 'Patient diversion of supervised medication', mitigation: 'Direct observation protocol, patient identity verification, consumption recording' }],
    appendices: ['Supervised Consumption Record Form'],
  },
  {
    pattern: /fridge|cold.?chain|temperat/i,
    training: 'Cold chain management and temperature monitoring procedures',
    monitoring: 'Continuous fridge temperature monitoring with twice-daily manual verification and automated alert system',
    risks: [{ risk: 'Cold chain breach affecting vaccine or medicine viability', mitigation: 'Continuous monitoring, automated alerts, quarantine procedure, and manufacturer contact for stability data' }],
    appendices: ['Temperature Excursion Report Form', 'Cold Chain Failure Flowchart'],
  },
  {
    pattern: /safeguard/i,
    training: 'Safeguarding Level 2 certification (adults and children)',
    risks: [{ risk: 'Failure to identify safeguarding concern', mitigation: 'Safeguarding training, professional curiosity framework, and clear escalation pathway' }],
    appendices: ['Safeguarding Referral Form', 'Safeguarding Concern Log'],
  },
  {
    pattern: /fire|evacuat/i,
    training: 'Fire safety awareness and evacuation drill certification',
    risks: [{ risk: 'Delayed evacuation during fire emergency', mitigation: 'Quarterly fire drills, clear signage, maintained fire exits, and designated fire marshals' }],
    appendices: ['Fire Evacuation Plan', 'Fire Drill Record Sheet'],
  },
  {
    pattern: /waste|dispos|sharps/i,
    training: 'Pharmaceutical waste segregation and disposal procedures',
    risks: [{ risk: 'Incorrect waste segregation causing contamination', mitigation: 'Colour-coded bins, wall charts, and staff training on waste categories' }],
    appendices: ['Waste Segregation Guide', 'Waste Transfer Notes Log'],
  },
  {
    pattern: /audit|inspect/i,
    training: 'Internal audit methodology and GPhC inspection preparation',
    risks: [{ risk: 'Audit findings not addressed within timescale', mitigation: 'CAPA tracker with escalation for overdue actions' }],
    appendices: ['Audit Action Plan Template'],
  },
  {
    pattern: /data.?prot|gdpr|confiden/i,
    training: 'UK GDPR and data protection awareness training',
    risks: [{ risk: 'Unauthorised disclosure of patient data', mitigation: 'Access controls, encryption, and mandatory data protection training' }],
    appendices: ['Data Subject Access Request Form', 'Privacy Impact Assessment Template'],
  },
  {
    pattern: /delivery|driv/i,
    training: 'Medicine delivery chain of custody and patient verification training',
    risks: [{ risk: 'Medicine left unattended at delivery location', mitigation: 'Safe place agreement with patient consent, delivery confirmation process' }],
  },
  {
    pattern: /complaint|feedback/i,
    training: 'Complaint handling and patient communication skills',
    risks: [{ risk: 'Complaint not resolved within required timeframe', mitigation: 'Complaint tracking system with escalation at 48-hour and 20-day checkpoints' }],
    appendices: ['Complaint Record Form', 'Complaint Outcome Letter Template'],
  },
  {
    pattern: /emergency|first.?aid/i,
    training: 'Emergency first aid at work certification',
    risks: [{ risk: 'Delayed response to medical emergency in pharmacy', mitigation: 'First aid kit maintained, trained first aiders on every shift, emergency protocol displayed' }],
    appendices: ['Emergency Contact List', 'First Aid Incident Report'],
  },
  {
    pattern: /stock|order|procure/i,
    training: 'Stock management and medicines procurement procedures',
    risks: [{ risk: 'Expired or recalled medicines remaining on shelves', mitigation: 'Monthly date-checking programme and MHRA alerts monitoring' }],
    appendices: ['Stock Check Record', 'Medicines Recall Action Form'],
  },
  {
    pattern: /clean|hygien|infect/i,
    training: 'Infection prevention and control procedures',
    risks: [{ risk: 'Cross-contamination between preparation areas', mitigation: 'Cleaning schedules, surface disinfection protocol, and hand hygiene compliance' }],
    appendices: ['Cleaning Verification Record', 'Infection Control Audit Form'],
  },
  {
    pattern: /EPS|electron|eRD/i,
    training: 'Electronic Prescription Service (EPS) operational training',
    risks: [{ risk: 'EPS token not matched to correct patient', mitigation: 'Patient identity verification before downloading and processing EPS prescriptions' }],
  },
  {
    pattern: /blood.?press|hypert|BP/i,
    training: 'Blood pressure measurement and interpretation training',
    risks: [{ risk: 'Incorrect blood pressure reading due to technique error', mitigation: 'Standardised measurement protocol and calibrated equipment' }],
    appendices: ['Blood Pressure Screening Record Form'],
  },
  {
    pattern: /smok|cessation|NRT/i,
    training: 'Smoking cessation counselling and NRT product training',
    risks: [{ risk: 'Inappropriate NRT recommendation', mitigation: 'Patient assessment checklist and contraindication screening' }],
  },
  {
    pattern: /MUR|medicine.?use|medication.?review/i,
    training: 'Medicines Use Review service accreditation',
    risks: [{ risk: 'Inadequate review missing adherence issues', mitigation: 'Structured MUR consultation framework and documentation' }],
    appendices: ['MUR Consultation Record Template'],
  },
  {
    pattern: /FP10|prescript.?form/i,
    training: 'FP10 security, handling, and accountability training',
    risks: [{ risk: 'FP10 form theft or misuse', mitigation: 'Secure storage, sequential numbering, and immediate loss reporting to NHSBSA' }],
    appendices: ['FP10 Tracking Log'],
  },
  {
    pattern: /whistle|rais.?concern|speak.?up/i,
    training: 'Whistleblowing and raising concerns awareness',
    risks: [{ risk: 'Staff reluctant to report concerns due to fear of reprisal', mitigation: 'Anonymous reporting channel and whistleblower protection policy' }],
    appendices: ['Raising Concerns Report Form'],
  },
  {
    pattern: /robot|automat|hub/i,
    training: 'Automated dispensing system operation and troubleshooting',
    risks: [{ risk: 'Automated system selecting incorrect medicine', mitigation: 'Barcode verification, regular calibration, and manual override procedures' }],
  },
]

// ─── HELPER: pick items deterministically ───
function pick(arr, count, seed) {
  const result = []
  const pool = [...arr]
  let s = seed
  for (let i = 0; i < Math.min(count, pool.length); i++) {
    const idx = s % pool.length
    result.push(pool[idx])
    pool.splice(idx, 1)
    s = (s * 31 + 7) % 10007
  }
  return result
}

// ─── MAIN ENHANCEMENT ───
function enhanceSOP(sop) {
  const cat = sop.category

  // 1. Responsibilities — filtered to only roles this SOP applies to
  const catResp = CATEGORY_RESPONSIBILITIES[cat] || {}
  const responsibilities = {}
  for (const role of sop.roles) {
    if (catResp[role]) {
      responsibilities[role] = catResp[role]
    }
  }
  // Keyword overrides don't change responsibilities (they're role-based)

  // 2. Revision History — number of entries based on version
  const vMajor = parseInt(sop.version.split('.')[0], 10) || 1
  const entryCount = vMajor >= 3 ? 3 : vMajor >= 2 ? 2 : 1
  const descs = REVISION_DESCRIPTIONS[cat] || ['Initial release', 'Updated per annual review', 'Revised following audit findings']
  const revisionHistory = []
  for (let i = 0; i < entryCount; i++) {
    const v = entryCount === 1
      ? sop.version
      : i === entryCount - 1
        ? sop.version
        : `${vMajor - (entryCount - 1 - i)}.0`
    // Generate a plausible date working backwards from effective date
    const eff = sop.effectiveDate ? new Date(sop.effectiveDate + 'T00:00:00') : new Date('2025-01-15')
    const monthsBack = (entryCount - 1 - i) * 12
    const revDate = new Date(eff)
    revDate.setMonth(revDate.getMonth() - monthsBack)
    const dateStr = revDate.toISOString().split('T')[0]
    const descIdx = (sop.id + i) % descs.length
    revisionHistory.push({
      version: v,
      date: dateStr,
      changes: i === 0 && entryCount > 1 ? 'Initial release' : descs[descIdx],
    })
  }

  // 3. Training Requirements — 2-3 from category + keyword
  const catTraining = CATEGORY_TRAINING[cat] || []
  const trainingRequirements = pick(catTraining, 2 + (sop.id % 2), sop.id)
  // Add keyword-matched training
  const titleDesc = `${sop.title} ${sop.description}`
  for (const kw of KEYWORD_OVERRIDES) {
    if (kw.pattern.test(titleDesc) && kw.training && !trainingRequirements.includes(kw.training)) {
      trainingRequirements.push(kw.training)
      break // Only add one keyword training
    }
  }
  // Cap at 4
  if (trainingRequirements.length > 4) trainingRequirements.length = 4

  // 4. Monitoring — category default with keyword override
  let monitoring = CATEGORY_MONITORING[cat] || 'Quarterly compliance audit by the Pharmacy Manager'
  for (const kw of KEYWORD_OVERRIDES) {
    if (kw.pattern.test(titleDesc) && kw.monitoring) {
      monitoring = kw.monitoring
      break
    }
  }

  // 5. Risk Assessment — 2-3 from category + keyword
  const catRisks = CATEGORY_RISKS[cat] || []
  const riskAssessment = pick(catRisks, 2 + (sop.id % 2), sop.id * 3)
  for (const kw of KEYWORD_OVERRIDES) {
    if (kw.pattern.test(titleDesc) && kw.risks) {
      for (const r of kw.risks) {
        if (!riskAssessment.some(x => x.risk === r.risk)) {
          riskAssessment.push(r)
          break
        }
      }
      break
    }
  }

  // 6. Escalation
  const escalation = CATEGORY_ESCALATION[cat] || 'Report concerns to the Pharmacy Manager. For urgent issues, contact the Superintendent Pharmacist immediately.'

  // 7. Review Triggers — 2 universal + 2 category-specific
  const catTriggers = CATEGORY_REVIEW_TRIGGERS[cat] || ['Category-specific incident or audit finding', 'Change to relevant regulatory framework']
  const reviewTriggers = [...UNIVERSAL_TRIGGERS, ...catTriggers]

  // 8. Appendices — 2-3 from category + keyword
  const catAppendices = CATEGORY_APPENDICES[cat] || []
  const appendices = pick(catAppendices, 2 + (sop.id % 2), sop.id * 7)
  for (const kw of KEYWORD_OVERRIDES) {
    if (kw.pattern.test(titleDesc) && kw.appendices) {
      for (const a of kw.appendices) {
        if (!appendices.includes(a)) {
          appendices.push(a)
          break
        }
      }
      break
    }
  }

  return {
    ...sop,
    responsibilities,
    revisionHistory,
    trainingRequirements,
    monitoring,
    riskAssessment,
    escalation,
    reviewTriggers,
    appendices,
  }
}

// ─── OUTPUT ───
const enhanced = data.map(enhanceSOP)

// Format as JS module
let output = `// ─── SOP DATA — UK Community Pharmacy SOPs ───
// Enhanced with scope, references, related SOPs, document control,
// responsibilities, revision history, training, monitoring, risks,
// escalation, review triggers, and appendices

const DUMMY_SOPS = ${JSON.stringify(enhanced, null, 2)};

export default DUMMY_SOPS;
`

// Clean up JSON-style to JS-style (unquote keys)
output = output.replace(/"(\w+)":/g, '$1: ')

process.stdout.write(output)
