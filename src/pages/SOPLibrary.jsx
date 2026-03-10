import { useState, useMemo } from 'react'
import { useToast } from '../components/Toast'
import SOPViewer from '../components/SOPViewer'

// ─── CONSTANTS ───
const CATEGORY_TABS = ['All', 'Dispensing', 'CD', 'Clinical', 'Governance', 'H&S', 'HR & Training', 'Facilities', 'Delivery']

const CATEGORY_STYLES = {
  Dispensing: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  CD: 'bg-red-500/10 text-red-600 dark:text-red-400',
  Clinical: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
  Governance: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  'H&S': 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  'HR & Training': 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  Facilities: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  Delivery: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
}

const STATUS_STYLES = {
  Current: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  'Due Review': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  Overdue: 'bg-red-500/10 text-red-600 dark:text-red-400',
}

const ROLE_TABS = ['All Roles', 'Pharmacist', 'Technician', 'Dispenser', 'ACA', 'Driver', 'Stock', 'All Staff']

const ROLE_TAB_MAP = {
  'All Roles': null,
  'Pharmacist': 'pharmacist',
  'Technician': 'technician',
  'Dispenser': 'dispenser',
  'ACA': 'aca',
  'Driver': 'driver',
  'Stock': 'stock_assistant',
  'All Staff': 'all',
}

const ROLE_DISPLAY = {
  all: 'All Staff',
  superintendent: 'Superintendent',
  manager: 'Manager',
  pharmacist: 'Pharmacist',
  technician: 'Technician',
  dispenser: 'Dispenser',
  aca: 'ACA',
  stock_assistant: 'Stock',
  driver: 'Driver',
}

// ─── SOP DATA (55 realistic pharmacy SOPs) ───
const DUMMY_SOPS = [
  // ── Dispensing (10) ──
  { id: 1,  code: 'SOP-001', title: 'Dispensing Workflow',               category: 'Dispensing', version: '3.2', reviewDate: '2026-09-15', status: 'Current',    acked: 11, roles: ['pharmacist', 'technician', 'dispenser'],
    description: 'Defines the end-to-end process for dispensing prescriptions safely and accurately, from receipt through to handout.',
    keyPoints: ['Verify prescription validity and patient identity', 'Perform clinical check against patient record', 'Label, assemble, and accuracy-check before handout', 'Counsel patient on usage, side effects, and storage', 'Record any interventions or near misses'] },
  { id: 2,  code: 'SOP-002', title: 'Prescription Collection Service',   category: 'Dispensing', version: '2.0', reviewDate: '2026-10-01', status: 'Current',    acked: 9,  roles: ['pharmacist', 'technician', 'dispenser', 'aca'],
    description: 'Covers the nomination, collection, and return process for patients using the repeat prescription collection service.',
    keyPoints: ['Confirm patient consent and nomination', 'Collect prescriptions from surgery within agreed timeframe', 'Log collections and flag any missing items', 'Notify patient when prescription is ready'] },
  { id: 3,  code: 'SOP-003', title: 'Repeat Dispensing Protocol',        category: 'Dispensing', version: '1.5', reviewDate: '2026-07-20', status: 'Current',    acked: 10, roles: ['pharmacist', 'technician', 'dispenser'],
    description: 'Outlines the procedure for managing repeat dispensing batches, including eligibility checks and interval monitoring.',
    keyPoints: ['Check batch validity and remaining issues', 'Verify patient has not been flagged for review', 'Dispense only at appropriate intervals', 'Contact prescriber if clinical concerns arise'] },
  { id: 4,  code: 'SOP-004', title: 'EPS Management',                    category: 'Dispensing', version: '2.3', reviewDate: '2026-08-12', status: 'Current',    acked: 12, roles: ['pharmacist', 'technician', 'dispenser'],
    description: 'Governs the download, processing, and reconciliation of Electronic Prescription Service (EPS) prescriptions.',
    keyPoints: ['Download and match EPS tokens regularly', 'Resolve any rejected or expired tokens promptly', 'Ensure endorsement data is accurate before submission', 'Handle EPS downtime using contingency procedures'] },
  { id: 5,  code: 'SOP-005', title: 'Owing & Owing Register',            category: 'Dispensing', version: '1.8', reviewDate: '2026-04-10', status: 'Due Review', acked: 8,  roles: ['pharmacist', 'technician', 'dispenser'],
    description: 'Sets out how to manage owing items when stock is unavailable, including recording, follow-up, and patient communication.',
    keyPoints: ['Record owing in the register with date and patient details', 'Order stock and set expected delivery date', 'Contact patient when item arrives', 'Close out owing entry upon collection or delivery'] },
  { id: 6,  code: 'SOP-006', title: 'Label Printing & Accuracy Checks',  category: 'Dispensing', version: '2.1', reviewDate: '2026-11-30', status: 'Current',    acked: 13, roles: ['pharmacist', 'technician', 'dispenser'],
    description: 'Ensures labels are printed correctly and all dispensed items undergo a final accuracy check before handout.',
    keyPoints: ['Verify label matches prescription directions exactly', 'Check patient name, drug, dose, and quantity', 'Perform independent accuracy check by second person', 'Report and correct any labelling errors immediately'] },
  { id: 7,  code: 'SOP-007', title: 'Patient Counselling',               category: 'Dispensing', version: '1.4', reviewDate: '2026-06-15', status: 'Current',    acked: 7,  roles: ['pharmacist'],
    description: 'Describes the pharmacist\'s responsibility to counsel patients on new medications, high-risk drugs, and changed therapies.',
    keyPoints: ['Identify patients requiring counselling at point of handout', 'Explain dosage, administration route, and timing', 'Discuss common side effects and what to do if they occur', 'Document counselling provided in patient record'] },
  { id: 8,  code: 'SOP-008', title: 'Pregnancy & Nursing Mothers',       category: 'Dispensing', version: '1.2', reviewDate: '2026-12-01', status: 'Current',    acked: 6,  roles: ['pharmacist'],
    description: 'Guides the pharmacist on safe dispensing and counselling for pregnant or breastfeeding patients.',
    keyPoints: ['Check all prescribed items against pregnancy/BF safety data', 'Refer to specialist sources (BUMPS, SPC) if uncertain', 'Liaise with prescriber if contraindicated drug identified', 'Counsel patient on any risks and alternatives'] },
  { id: 9,  code: 'SOP-009', title: 'Methadone Supervised Consumption',  category: 'Dispensing', version: '2.6', reviewDate: '2026-05-20', status: 'Current',    acked: 5,  roles: ['pharmacist', 'technician'],
    description: 'Details the supervised consumption process for methadone and buprenorphine, including ID verification and record-keeping.',
    keyPoints: ['Verify patient identity before each supervised dose', 'Administer dose and observe full consumption', 'Record administration in supervised consumption log', 'Handle missed doses per prescriber instructions', 'Store methadone securely in CD cupboard'] },
  { id: 10, code: 'SOP-010', title: 'Blister Pack / MDS Dispensing',     category: 'Dispensing', version: '1.9', reviewDate: '2026-03-28', status: 'Due Review', acked: 10, roles: ['pharmacist', 'technician', 'dispenser'],
    description: 'Covers preparation, checking, and delivery of multi-compartment compliance aids (blister packs) for patients.',
    keyPoints: ['Confirm patient MAR chart is up to date', 'Fill trays accurately and label each compartment', 'Pharmacist final check before sealing', 'Deliver or arrange collection within agreed schedule'] },

  // ── CD (7) ──
  { id: 11, code: 'SOP-011', title: 'CD Receipt & Storage',              category: 'CD', version: '2.1', reviewDate: '2026-04-01', status: 'Due Review', acked: 8,  roles: ['pharmacist', 'technician'],
    description: 'Covers the safe receipt, verification, and secure storage of Controlled Drug deliveries in the pharmacy.',
    keyPoints: ['Check delivery against order and invoice on arrival', 'Enter into CD register immediately upon receipt', 'Store in locked CD cupboard with restricted access', 'Report any discrepancies to supplier and record in log'] },
  { id: 12, code: 'SOP-012', title: 'CD Destruction Protocol',           category: 'CD', version: '1.3', reviewDate: '2026-06-30', status: 'Current',    acked: 9,  roles: ['pharmacist'],
    description: 'Describes the witnessed destruction process for expired or patient-returned Controlled Drugs.',
    keyPoints: ['Only destroy CDs with an authorised witness present', 'Denature drugs using approved destruction kit', 'Record destruction details in CD register with witness signature', 'Retain records for minimum 2 years'] },
  { id: 13, code: 'SOP-013', title: 'CD Running Balance & Reconciliation', category: 'CD', version: '2.4', reviewDate: '2026-08-15', status: 'Current', acked: 7,  roles: ['pharmacist', 'technician'],
    description: 'Ensures the CD register running balance is maintained accurately and reconciled regularly against physical stock.',
    keyPoints: ['Update running balance after every transaction', 'Perform physical stock check at least weekly', 'Investigate and document any discrepancies immediately', 'Report unresolved discrepancies to superintendent'] },
  { id: 14, code: 'SOP-014', title: 'CD Audit Procedures',               category: 'CD', version: '1.7', reviewDate: '2026-02-15', status: 'Overdue',   acked: 6,  roles: ['pharmacist', 'manager'],
    description: 'Sets out the schedule and methodology for internal CD audits to ensure compliance with Misuse of Drugs Regulations.',
    keyPoints: ['Conduct full CD audit at least quarterly', 'Compare register balances with physical stock for all Schedule 2 CDs', 'Document audit findings and corrective actions', 'Superintendent to review and sign off audit results'] },
  { id: 15, code: 'SOP-015', title: 'CD Returns to Supplier',            category: 'CD', version: '1.1', reviewDate: '2026-09-01', status: 'Current',    acked: 5,  roles: ['pharmacist', 'technician'],
    description: 'Covers the process for returning Controlled Drugs to authorised suppliers, including documentation requirements.',
    keyPoints: ['Verify supplier is authorised to receive CDs', 'Complete requisition form with full drug details', 'Update CD register with return details and supplier signature', 'Retain copies of all return documentation'] },
  { id: 16, code: 'SOP-016', title: 'CD Emergency Supply',               category: 'CD', version: '1.0', reviewDate: '2026-11-10', status: 'Current',    acked: 4,  roles: ['pharmacist'],
    description: 'Outlines the limited circumstances in which a pharmacist may make an emergency supply of a Schedule 2-5 Controlled Drug.',
    keyPoints: ['Confirm genuine clinical need and inability to obtain prescription', 'Supply only Schedule 4 and 5 CDs under emergency provisions', 'Provide smallest quantity to cover treatment until prescription obtained', 'Record emergency supply in CD register and POM register'] },
  { id: 17, code: 'SOP-017', title: 'Methadone CD Register',             category: 'CD', version: '2.2', reviewDate: '2026-07-05', status: 'Current',    acked: 6,  roles: ['pharmacist', 'technician'],
    description: 'Specific procedures for maintaining methadone entries in the CD register, including instalment prescriptions.',
    keyPoints: ['Record each instalment dose separately in the register', 'Cross-reference with supervised consumption log daily', 'Flag any missed collections for prescriber follow-up', 'Maintain separate page for each methadone preparation'] },

  // ── Clinical (8) ──
  { id: 18, code: 'SOP-018', title: 'Clinical Checks & Interventions',   category: 'Clinical', version: '2.5', reviewDate: '2026-10-20', status: 'Current',    acked: 11, roles: ['pharmacist'],
    description: 'Describes the clinical screening process for all prescriptions, including when and how to intervene.',
    keyPoints: ['Screen every prescription for appropriateness, dose, and interactions', 'Check patient allergy and medical history', 'Document all interventions with outcome', 'Escalate unresolved clinical issues to prescriber'] },
  { id: 19, code: 'SOP-019', title: 'Drug Interaction Management',       category: 'Clinical', version: '1.8', reviewDate: '2026-09-05', status: 'Current',    acked: 8,  roles: ['pharmacist', 'technician'],
    description: 'Provides guidance on identifying, assessing, and managing clinically significant drug interactions.',
    keyPoints: ['Use PMR alerts and BNF to identify interactions', 'Assess clinical significance and patient risk factors', 'Contact prescriber with recommendation if action needed', 'Document interaction assessment and outcome in patient record'] },
  { id: 20, code: 'SOP-020', title: 'Fridge Temperature Monitoring',     category: 'Clinical', version: '3.1', reviewDate: '2026-06-01', status: 'Current',    acked: 13, roles: ['all'],
    description: 'Ensures fridge-stored medicines and vaccines are maintained within the required 2-8°C range through daily monitoring.',
    keyPoints: ['Record min, max, and current temperatures daily', 'Reset thermometer after each reading', 'Investigate and report any out-of-range readings immediately', 'Quarantine affected stock pending manufacturer guidance'] },
  { id: 21, code: 'SOP-021', title: 'Vaccines & Cold Chain',             category: 'Clinical', version: '2.0', reviewDate: '2026-05-15', status: 'Current',    acked: 9,  roles: ['pharmacist', 'technician'],
    description: 'Covers vaccine storage, cold chain integrity, and administration protocols for pharmacy vaccination services.',
    keyPoints: ['Store vaccines in dedicated pharmaceutical fridge at 2-8°C', 'Check and record fridge temperatures twice daily during flu season', 'Use cool box with validated pack-out for transport', 'Dispose of cold-chain-breached vaccines and report to supplier'] },
  { id: 22, code: 'SOP-022', title: 'Patient Group Directions (PGDs)',   category: 'Clinical', version: '1.4', reviewDate: '2026-11-20', status: 'Current',    acked: 7,  roles: ['pharmacist'],
    description: 'Governs the use of PGDs for supplying specified medicines to patients meeting defined clinical criteria.',
    keyPoints: ['Verify PGD is in date and authorised for this pharmacy', 'Confirm patient meets all inclusion criteria', 'Check exclusions and cautions before supply', 'Record supply in PGD log with batch number and expiry'] },
  { id: 23, code: 'SOP-023', title: 'Minor Ailments Service',            category: 'Clinical', version: '1.6', reviewDate: '2026-08-25', status: 'Current',    acked: 6,  roles: ['pharmacist'],
    description: 'Sets out the consultation and supply process for treating minor ailments under the NHS community pharmacy service.',
    keyPoints: ['Conduct structured consultation using WWHAM framework', 'Identify red flags requiring referral to GP', 'Supply appropriate OTC treatment and provide self-care advice', 'Record consultation and outcome on PharmOutcomes'] },
  { id: 24, code: 'SOP-024', title: 'Emergency Supply Procedure',        category: 'Clinical', version: '2.2', reviewDate: '2026-03-10', status: 'Due Review', acked: 10, roles: ['pharmacist'],
    description: 'Defines when and how a pharmacist may make an emergency supply of a prescription-only medicine at patient request.',
    keyPoints: ['Confirm patient has previously been prescribed the medicine', 'Ensure genuine immediate need and inability to obtain prescription', 'Supply smallest practicable quantity (max 30 days for most items)', 'Record in POM register and label "Emergency Supply"'] },
  { id: 25, code: 'SOP-025', title: 'Safeguarding Vulnerable Adults & Children', category: 'Clinical', version: '1.9', reviewDate: '2026-02-20', status: 'Overdue', acked: 5, roles: ['all'],
    description: 'Outlines staff responsibilities for recognising and reporting safeguarding concerns for vulnerable patients.',
    keyPoints: ['Know the signs of abuse, neglect, and exploitation', 'Follow local safeguarding referral pathways', 'Record concerns confidentially and factually', 'Complete mandatory safeguarding training annually'] },

  // ── Governance (8) ──
  { id: 26, code: 'SOP-026', title: 'Responsible Pharmacist (RP) Register', category: 'Governance', version: '2.0', reviewDate: '2026-12-15', status: 'Current', acked: 12, roles: ['pharmacist', 'manager'],
    description: 'Covers the legal requirement to maintain the RP register, including sign-on/off times and absence protocols.',
    keyPoints: ['RP must sign in before pharmacy opens and sign out at close', 'Record all RP changes during the day with exact times', 'Display RP notice clearly visible to the public', 'Pharmacy must not operate without a signed-in RP'] },
  { id: 27, code: 'SOP-027', title: 'Near Miss & Error Reporting',       category: 'Governance', version: '2.3', reviewDate: '2026-07-30', status: 'Current',    acked: 11, roles: ['all'],
    description: 'Establishes a blame-free reporting culture for near misses and dispensing errors to improve patient safety.',
    keyPoints: ['Report all near misses and errors promptly using the log', 'Classify by type, contributing factors, and severity', 'Review reports monthly to identify trends and systemic issues', 'Share learning with team in regular safety briefings'] },
  { id: 28, code: 'SOP-028', title: 'GDPR & Data Protection',            category: 'Governance', version: '3.0', reviewDate: '2026-12-01', status: 'Current',    acked: 12, roles: ['all'],
    description: 'Ensures all staff handle patient and business data in compliance with UK GDPR and Data Protection Act 2018.',
    keyPoints: ['Only access patient data on a need-to-know basis', 'Store paper records securely and dispose via confidential waste', 'Never share patient data without lawful basis', 'Report any data breach to the DPO within 24 hours'] },
  { id: 29, code: 'SOP-029', title: 'Complaints Handling',               category: 'Governance', version: '1.5', reviewDate: '2026-04-20', status: 'Due Review', acked: 8,  roles: ['pharmacist', 'manager', 'superintendent'],
    description: 'Sets out the process for receiving, investigating, and resolving patient complaints in a timely and professional manner.',
    keyPoints: ['Acknowledge complaint within 3 working days', 'Investigate thoroughly and document findings', 'Respond with resolution or explanation within 20 working days', 'Escalate to superintendent if complaint involves clinical harm'] },
  { id: 30, code: 'SOP-030', title: 'Fitness to Practise & Professional Standards', category: 'Governance', version: '1.2', reviewDate: '2026-10-10', status: 'Current', acked: 4, roles: ['pharmacist', 'superintendent'],
    description: 'Outlines the standards of professional conduct expected and the process for addressing fitness-to-practise concerns.',
    keyPoints: ['All registrants must meet GPhC Standards for Pharmacy Professionals', 'Report concerns about impairment or misconduct to superintendent', 'Maintain professional indemnity insurance', 'Cooperate fully with any GPhC investigation'] },
  { id: 31, code: 'SOP-031', title: 'Whistleblowing Policy',             category: 'Governance', version: '1.0', reviewDate: '2026-11-05', status: 'Current',    acked: 9,  roles: ['all'],
    description: 'Provides a safe, confidential mechanism for staff to raise concerns about unsafe or unethical practices.',
    keyPoints: ['Raise concerns with line manager or superintendent first', 'If unresolved, escalate to GPhC or CQC as appropriate', 'Whistleblowers are protected from retaliation by law', 'All concerns will be investigated confidentially'] },
  { id: 32, code: 'SOP-032', title: 'Annual Self-Assessment (GPhC)',     category: 'Governance', version: '2.1', reviewDate: '2026-01-31', status: 'Overdue',   acked: 3,  roles: ['superintendent', 'manager'],
    description: 'Describes the annual process for completing the GPhC pharmacy premises self-assessment and action planning.',
    keyPoints: ['Complete self-assessment against all GPhC standards annually', 'Identify gaps and create improvement action plan', 'Superintendent to review and submit by deadline', 'Retain evidence of compliance for inspection'] },
  { id: 33, code: 'SOP-033', title: 'Distance Selling Compliance',       category: 'Governance', version: '1.3', reviewDate: '2026-09-20', status: 'Current',    acked: 7,  roles: ['pharmacist', 'manager', 'dispenser'],
    description: 'Ensures the pharmacy meets all regulatory requirements for distance selling and internet pharmacy services.',
    keyPoints: ['Display EU common logo on website', 'Verify patient identity before dispensing distance orders', 'Maintain audit trail for all online consultations', 'Ensure delivery service maintains medicine integrity'] },

  // ── H&S (7) ──
  { id: 34, code: 'SOP-034', title: 'Fire Safety & Evacuation',          category: 'H&S', version: '1.8', reviewDate: '2026-08-10', status: 'Current',    acked: 10, roles: ['all'],
    description: 'Covers fire prevention, alarm response, evacuation routes, and assembly point procedures for all staff.',
    keyPoints: ['Know the location of fire exits and extinguishers', 'Evacuate immediately on hearing the alarm — do not collect belongings', 'Assemble at designated point and report to fire marshal', 'Conduct fire drills at least every 6 months'] },
  { id: 35, code: 'SOP-035', title: 'COSHH & Hazardous Substances',      category: 'H&S', version: '2.5', reviewDate: '2026-03-15', status: 'Due Review', acked: 7,  roles: ['all'],
    description: 'Ensures all hazardous substances used in the pharmacy are properly assessed, stored, and handled under COSHH regulations.',
    keyPoints: ['Maintain up-to-date COSHH assessments for all substances', 'Store chemicals in labelled containers in designated area', 'Use appropriate PPE as specified in safety data sheets', 'Train all staff on safe handling procedures'] },
  { id: 36, code: 'SOP-036', title: 'Manual Handling',                   category: 'H&S', version: '1.4', reviewDate: '2026-06-20', status: 'Current',    acked: 11, roles: ['all'],
    description: 'Provides guidance on safe lifting and carrying techniques to prevent musculoskeletal injuries in the workplace.',
    keyPoints: ['Assess the load before lifting — seek help if too heavy', 'Use correct lifting technique: bend knees, straight back', 'Use trolleys or mechanical aids for heavy deliveries', 'Report any manual handling injuries immediately'] },
  { id: 37, code: 'SOP-037', title: 'First Aid Procedures',             category: 'H&S', version: '2.0', reviewDate: '2026-10-30', status: 'Current',    acked: 9,  roles: ['all'],
    description: 'Defines first aid arrangements, trained aider responsibilities, and emergency response protocols.',
    keyPoints: ['Know who the designated first aiders are', 'First aid kit location: dispensary and staff room', 'Call 999 for any life-threatening emergency', 'Record all first aid incidents in the accident book'] },
  { id: 38, code: 'SOP-038', title: 'Needle Stick & Sharps Injury',     category: 'H&S', version: '1.6', reviewDate: '2026-05-05', status: 'Current',    acked: 8,  roles: ['pharmacist', 'technician', 'dispenser'],
    description: 'Sets out immediate actions and follow-up procedures following a needlestick or sharps injury.',
    keyPoints: ['Encourage bleeding, wash with soap and water immediately', 'Do not suck the wound', 'Report to line manager and attend A&E or occupational health', 'Complete accident report form and RIDDOR notification if required'] },
  { id: 39, code: 'SOP-039', title: 'Workplace Violence & Aggression',  category: 'H&S', version: '1.1', reviewDate: '2026-02-01', status: 'Overdue',   acked: 6,  roles: ['all'],
    description: 'Provides guidance on preventing, de-escalating, and reporting incidents of violence or aggression from the public.',
    keyPoints: ['Stay calm and use de-escalation techniques', 'Do not confront or restrain aggressive individuals', 'Activate panic alarm if you feel threatened', 'Report all incidents to manager and complete incident form'] },
  { id: 40, code: 'SOP-040', title: 'Infection Control & Hygiene',      category: 'H&S', version: '2.3', reviewDate: '2026-07-15', status: 'Current',    acked: 12, roles: ['all'],
    description: 'Establishes infection control measures including hand hygiene, PPE use, and cleaning protocols.',
    keyPoints: ['Wash hands before and after patient contact', 'Use alcohol gel between handwashes', 'Wear gloves when handling clinical waste or body fluids', 'Clean dispensary surfaces with approved disinfectant daily'] },

  // ── HR & Training (6) ──
  { id: 41, code: 'SOP-041', title: 'Staff Induction Programme',         category: 'HR & Training', version: '2.0', reviewDate: '2026-09-25', status: 'Current', acked: 10, roles: ['manager', 'superintendent'],
    description: 'Structures the induction process for new staff members covering all essential areas within their first four weeks.',
    keyPoints: ['Complete induction checklist with new starter', 'Cover health & safety, SOPs, and role-specific training', 'Assign a buddy or mentor for the first month', 'Review progress and sign off induction at four-week mark'] },
  { id: 42, code: 'SOP-042', title: 'CPD Requirements & Recording',     category: 'HR & Training', version: '1.5', reviewDate: '2026-11-15', status: 'Current', acked: 7,  roles: ['pharmacist', 'technician'],
    description: 'Outlines the GPhC CPD requirements for registered professionals and how to record and submit CPD entries.',
    keyPoints: ['Complete minimum CPD entries as required by GPhC', 'Use reflective practice model for learning activities', 'Record entries on GPhC myGPhC portal promptly', 'Retain supporting evidence for peer review if selected'] },
  { id: 43, code: 'SOP-043', title: 'Competency Assessment & Sign-Off', category: 'HR & Training', version: '1.3', reviewDate: '2026-04-30', status: 'Due Review', acked: 5, roles: ['manager', 'superintendent'],
    description: 'Defines the competency framework and sign-off process for staff performing key pharmacy tasks.',
    keyPoints: ['Assess competency against role-specific standards', 'Use structured observation and knowledge assessment', 'Document sign-off with assessor name and date', 'Reassess annually or when procedures change'] },
  { id: 44, code: 'SOP-044', title: 'Lone Working Policy',              category: 'HR & Training', version: '1.8', reviewDate: '2026-08-05', status: 'Current', acked: 9,  roles: ['all'],
    description: 'Provides safety measures and risk mitigation for staff who may work alone in the pharmacy.',
    keyPoints: ['Risk-assess all lone working situations', 'Maintain regular check-in contact with buddy or manager', 'Ensure panic alarm and phone are accessible at all times', 'Do not handle large cash amounts or open deliveries alone'] },
  { id: 45, code: 'SOP-045', title: 'Annual Appraisal Process',         category: 'HR & Training', version: '1.2', reviewDate: '2026-01-20', status: 'Overdue', acked: 4,  roles: ['manager', 'superintendent'],
    description: 'Describes the annual performance review process including self-assessment, goal setting, and development planning.',
    keyPoints: ['Schedule appraisals within anniversary month for each staff member', 'Staff complete self-assessment form before meeting', 'Set SMART objectives for the coming year', 'Agree training and development plan and sign off'] },
  { id: 46, code: 'SOP-046', title: 'Equality, Diversity & Inclusion',  category: 'HR & Training', version: '1.0', reviewDate: '2026-12-10', status: 'Current', acked: 11, roles: ['all'],
    description: 'Sets out the pharmacy\'s commitment to equality, diversity, and inclusion for staff and patients.',
    keyPoints: ['Treat all individuals with dignity and respect', 'Do not discriminate on any protected characteristic', 'Make reasonable adjustments for disabled staff and patients', 'Report any discrimination or harassment immediately'] },

  // ── Facilities (5) ──
  { id: 47, code: 'SOP-047', title: 'Confidential Waste Disposal',      category: 'Facilities', version: '1.7', reviewDate: '2026-06-10', status: 'Current',    acked: 10, roles: ['all'],
    description: 'Ensures all confidential patient and business documents are disposed of securely via approved waste contractors.',
    keyPoints: ['Place confidential waste in designated locked bins', 'Never put confidential material in general waste', 'Cross-cut shred small volumes on-site if needed', 'Verify waste contractor provides certificate of destruction'] },
  { id: 48, code: 'SOP-048', title: 'Premises Maintenance & Cleaning',  category: 'Facilities', version: '2.1', reviewDate: '2026-03-20', status: 'Due Review', acked: 8,  roles: ['manager', 'stock_assistant'],
    description: 'Covers the cleaning schedule, maintenance reporting, and standards required to keep the premises GPhC-compliant.',
    keyPoints: ['Follow daily and weekly cleaning checklists', 'Report maintenance issues to manager promptly', 'Ensure dispensary is clean and uncluttered at all times', 'Schedule deep clean quarterly'] },
  { id: 49, code: 'SOP-049', title: 'Pest Control Protocol',            category: 'Facilities', version: '1.0', reviewDate: '2026-10-15', status: 'Current',    acked: 6,  roles: ['manager', 'stock_assistant'],
    description: 'Defines the prevention, monitoring, and response procedures for pest control within the pharmacy premises.',
    keyPoints: ['Maintain pest control contract with approved provider', 'Store food waste securely and remove daily', 'Report any signs of pest activity immediately', 'Document all pest control visits and findings'] },
  { id: 50, code: 'SOP-050', title: 'Opening & Closing Procedures',     category: 'Facilities', version: '2.4', reviewDate: '2026-05-25', status: 'Current',    acked: 12, roles: ['all'],
    description: 'Details the daily procedures for opening and closing the pharmacy, including security and regulatory checks.',
    keyPoints: ['RP must be present before pharmacy opens to public', 'Check alarm, fridge temperatures, and RP notice at opening', 'Secure CD cupboard, lock premises, and set alarm at close', 'Complete opening/closing checklist and sign off'] },
  { id: 51, code: 'SOP-051', title: 'Stock Rotation & Expiry Checks',   category: 'Facilities', version: '1.9', reviewDate: '2026-07-01', status: 'Current',    acked: 11, roles: ['technician', 'dispenser', 'stock_assistant'],
    description: 'Ensures stock is rotated correctly and short-dated or expired items are identified and removed promptly.',
    keyPoints: ['Apply FEFO (First Expiry, First Out) principle at all times', 'Conduct monthly expiry date checks across all stock', 'Remove expired stock immediately and quarantine for return/destruction', 'Record short-dated items for reduced-price sale or return'] },

  // ── Delivery (4) ──
  { id: 52, code: 'SOP-052', title: 'Delivery Run Management',          category: 'Delivery', version: '1.6', reviewDate: '2026-08-20', status: 'Current',    acked: 8,  roles: ['driver', 'manager'],
    description: 'Manages the planning, execution, and documentation of prescription delivery runs to patients.',
    keyPoints: ['Plan efficient delivery route before departure', 'Verify all bags are sealed and labelled with correct patient details', 'Obtain patient signature or note safe place delivery', 'Return undelivered items to pharmacy and record reason'] },
  { id: 53, code: 'SOP-053', title: 'Cold Chain Delivery',              category: 'Delivery', version: '1.3', reviewDate: '2026-04-15', status: 'Due Review', acked: 5,  roles: ['driver', 'pharmacist'],
    description: 'Ensures fridge items maintain the required 2-8°C range throughout the delivery process.',
    keyPoints: ['Pack fridge items in validated cool box with ice packs', 'Deliver fridge items first on the delivery route', 'Monitor and record cool box temperature on departure and return', 'Return any undelivered fridge items to pharmacy fridge immediately'] },
  { id: 54, code: 'SOP-054', title: 'Patient ID Verification on Delivery', category: 'Delivery', version: '1.1', reviewDate: '2026-11-01', status: 'Current', acked: 7, roles: ['driver'],
    description: 'Defines how drivers verify patient identity when handing over prescription deliveries at the door.',
    keyPoints: ['Confirm patient name and address before handing over', 'Request photo ID for high-risk or CD deliveries', 'Do not leave medicines with children or unverified individuals', 'Record method of ID verification on delivery log'] },
  { id: 55, code: 'SOP-055', title: 'Failed Delivery Protocol',         category: 'Delivery', version: '1.0', reviewDate: '2026-02-10', status: 'Overdue',   acked: 4,  roles: ['driver', 'manager'],
    description: 'Covers the procedure when a delivery cannot be completed, including reattempt and patient notification steps.',
    keyPoints: ['Leave a card with pharmacy contact details', 'Attempt to call patient before leaving the area', 'Return undelivered items to pharmacy and log reason', 'Reattempt delivery next working day or arrange collection'] },
]

// ─── STAT ICONS ───
function StatIcon({ name, color }) {
  const cls = color === 'emerald' ? 'text-emerald-600' : color === 'blue' ? 'text-blue-600' : 'text-amber-600'
  const bg = color === 'emerald' ? 'bg-emerald-500/10' : color === 'blue' ? 'bg-blue-500/10' : 'bg-amber-500/10'
  const icons = {
    book: <><path d="M2 3h8a2 2 0 0 1 2 2v14a1.5 1.5 0 0 0-1.5-1.5H2V3z" /><path d="M22 3h-8a2 2 0 0 0-2 2v14a1.5 1.5 0 0 1 1.5-1.5H22V3z" /></>,
    check: <><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>,
    alert: <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
    chart: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>,
  }
  return (
    <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 ${cls}`}>
        {icons[name]}
      </svg>
    </div>
  )
}

// ─── MAIN COMPONENT ───
export default function SOPLibrary() {
  const showToast = useToast()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('All')
  const [activeRole, setActiveRole] = useState('All Roles')
  const [selectedSop, setSelectedSop] = useState(null)
  const [bannerVisible, setBannerVisible] = useState(() => {
    return localStorage.getItem('sop_banner_dismissed') !== 'true'
  })

  const dismissBanner = () => {
    setBannerVisible(false)
    localStorage.setItem('sop_banner_dismissed', 'true')
  }

  // Dynamic stats
  const stats = useMemo(() => {
    const total = DUMMY_SOPS.length
    const acknowledged = DUMMY_SOPS.filter(s => s.acked >= 10).length
    const overdue = DUMMY_SOPS.filter(s => s.status === 'Overdue').length
    const avgCoverage = DUMMY_SOPS.reduce((sum, s) => sum + (s.acked / 13), 0) / total
    return [
      { label: 'Total SOPs', value: String(total), icon: 'book', color: 'emerald' },
      { label: 'Acknowledged', value: String(acknowledged), icon: 'check', color: 'blue' },
      { label: 'Overdue Review', value: String(overdue), icon: 'alert', color: 'amber' },
      { label: 'Coverage', value: Math.round(avgCoverage * 100) + '%', icon: 'chart', color: 'emerald' },
    ]
  }, [])

  // Filter SOPs
  const filtered = useMemo(() => {
    const roleKey = ROLE_TAB_MAP[activeRole]
    return DUMMY_SOPS.filter(sop => {
      const matchesSearch = !search || sop.title.toLowerCase().includes(search.toLowerCase()) || sop.code.toLowerCase().includes(search.toLowerCase())
      const matchesTab = activeTab === 'All' || sop.category === activeTab
      const matchesRole = !roleKey
        ? true
        : roleKey === 'all'
          ? sop.roles.includes('all')
          : sop.roles.includes('all') || sop.roles.includes(roleKey)
      return matchesSearch && matchesTab && matchesRole
    })
  }, [search, activeTab, activeRole])

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 ec-fadeup">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-ec-t1 m-0">SOP Library</h1>
            <span className="bg-amber-500/10 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
              Preview
            </span>
          </div>
          <p className="text-sm text-ec-t3 mt-1 mb-0">Standard Operating Procedures — view, acknowledge &amp; track compliance</p>
        </div>
      </div>

      {/* Amber Banner */}
      {bannerVisible && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl mb-5 border"
          style={{ backgroundColor: '#fffbeb', borderColor: '#f59e0b', color: '#92400e' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div className="flex-1 text-sm">
            <span className="font-semibold">Coming Soon — </span>
            This is a preview of the SOP Library feature. The data shown is sample data for demonstration purposes only. Full functionality including acknowledgement tracking and inspection mode will be available in a future update.
          </div>
          <button onClick={dismissBanner}
            className="bg-transparent border-none cursor-pointer text-lg leading-none p-0 shrink-0"
            style={{ color: '#92400e' }} aria-label="Dismiss banner">
            ✕
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {stats.map(card => (
          <div key={card.label} className="bg-ec-card border border-ec-border rounded-xl p-4 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <StatIcon name={card.icon} color={card.color} />
              <div>
                <div className="text-xs text-ec-t3 font-medium">{card.label}</div>
                <div className="text-xl font-bold text-ec-t1 mt-0.5">{card.value}</div>
              </div>
            </div>
            {/* DUMMY watermark */}
            <span className="absolute top-2 right-2 text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-amber-400/30 text-amber-500/40 uppercase tracking-wider">
              Dummy
            </span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-3">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ec-t3">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search SOPs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-ec-border bg-ec-card text-sm text-ec-t1 placeholder:text-ec-t3 outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
          />
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 flex-wrap">
          {CATEGORY_TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border-none cursor-pointer transition-all
                ${activeTab === tab
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-ec-card text-ec-t2 hover:bg-ec-card-hover border border-ec-border'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="sm:ml-auto">
          <button onClick={() => showToast('SOP upload coming soon!', 'info')}
            className="px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white border-none cursor-pointer hover:bg-emerald-700 transition shadow-sm">
            + Add SOP
          </button>
        </div>
      </div>

      {/* Role filter pills */}
      <div className="flex gap-1 flex-wrap mb-4">
        {ROLE_TABS.map(role => (
          <button key={role} onClick={() => setActiveRole(role)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium border cursor-pointer transition-all
              ${activeRole === role
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-ec-card text-ec-t3 border-ec-border hover:text-ec-t2 hover:border-ec-t3/30'
              }`}
          >
            {role}
          </button>
        ))}
      </div>

      {/* SOP Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-ec-t3 text-sm">
            No SOPs match your filters
          </div>
        ) : (
          filtered.map(sop => (
            <div key={sop.id} className="bg-ec-card border border-ec-border rounded-xl p-4 relative overflow-hidden group hover:shadow-md transition-shadow">
              {/* Category + Status badges */}
              <div className="flex items-center gap-1.5 mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_STYLES[sop.category]}`}>
                  {sop.category}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[sop.status]}`}>
                  {sop.status}
                </span>
              </div>

              {/* Role badges */}
              <div className="flex flex-wrap gap-1 mb-2">
                {sop.roles.includes('all') ? (
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-500 dark:text-slate-400">
                    All Staff
                  </span>
                ) : (
                  sop.roles.map(r => (
                    <span key={r} className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-500 dark:text-slate-400">
                      {ROLE_DISPLAY[r] || r}
                    </span>
                  ))
                )}
              </div>

              {/* Code + Title */}
              <div className="text-[11px] font-mono text-ec-t3 mb-1">{sop.code}</div>
              <h3 className="text-sm font-semibold text-ec-t1 m-0 mb-3 leading-snug">{sop.title}</h3>

              {/* Meta */}
              <div className="flex items-center justify-between text-[11px] text-ec-t3 mb-3">
                <span>v{sop.version}</span>
                <span>Review: {formatDate(sop.reviewDate)}</span>
              </div>

              {/* Ack bar */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-1.5 rounded-full bg-ec-border overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.round((sop.acked / 13) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] font-medium text-ec-t3">{sop.acked}/13</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedSop(sop)}
                  className="flex-1 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-ec-card text-ec-t2 border border-ec-border cursor-pointer hover:bg-ec-card-hover transition"
                >
                  View
                </button>
                <button
                  onClick={() => showToast('SOP acknowledgement coming soon!', 'info')}
                  className="flex-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-600 text-white border-none cursor-pointer hover:bg-emerald-700 transition"
                >
                  Acknowledge
                </button>
              </div>

              {/* Subtle DUMMY watermark */}
              <span className="absolute top-2 right-2 text-[7px] font-bold text-amber-400/20 uppercase tracking-widest pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                Sample
              </span>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 px-1 text-xs text-ec-t3">
        <span>Showing {filtered.length} of {DUMMY_SOPS.length} sample SOPs</span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/30 text-amber-500/50 uppercase">
          Dummy Data
        </span>
      </div>

      {/* SOP Viewer slide-over */}
      {selectedSop && (
        <SOPViewer
          sop={selectedSop}
          onClose={() => setSelectedSop(null)}
          onAcknowledge={() => showToast('SOP acknowledgement coming soon!', 'info')}
        />
      )}
    </div>
  )
}

// ─── HELPERS ───
function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
