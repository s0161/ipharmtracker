// ─── SOP DATA — UK Community Pharmacy SOPs ───
// Enhanced with scope, references, related SOPs, and document control

const DUMMY_SOPS = [
  {
    id:  1,
    code:  "SOP-001",
    title:  "Dispensing Workflow",
    category:  "Dispensing",
    version:  "3.2",
    reviewDate:  "2026-09-15",
    status:  "Current",
    acked:  11,
    roles:  [
      "pharmacist",
      "technician",
      "dispenser"
    ],
    description:  "Defines the end-to-end process for dispensing prescriptions safely and accurately, from receipt through to handout. Applies to all NHS and private prescriptions handled by the pharmacy. Based on GPhC Standards for Pharmacy Professionals and NICE guidelines. All dispensary staff must be trained and signed off before dispensing independently.",
    keyPoints:  [
      "Verify prescription validity, legality, and patient identity before processing",
      "Perform clinical check against patient medication record for interactions and allergies",
      "Label, assemble, and accuracy-check all items before placing in the collection area",
      "Counsel patient on usage, side effects, and storage requirements at handout",
      "Record any clinical interventions or near misses in the reporting system",
      "Ensure endorsement is completed accurately for NHS reimbursement",
      "Escalate any unresolvable queries to the Responsible Pharmacist on duty",
      "File or archive the prescription in accordance with retention policy"
    ],
    scope:  "This SOP applies to all pharmacists, pharmacy technicians, dispensers at iPharmacy Direct. It covers all activities relating to dispensing workflow and must be read, understood, and acknowledged before undertaking any related duties. Defines the end-to-end process for dispensing prescriptions safely and accurately, from receipt through to handout.",
    references:  [
      "Human Medicines Regulations 2012",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "NICE NG5: Medicines Optimisation (2015)",
      "Human Medicines Regulations 2012, Part 12",
      "NHSBSA Private Prescription Guidance"
    ],
    relatedSOPs:  [
      "SOP-006",
      "SOP-007",
      "SOP-027"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-03-15"
  },
  {
    id:  2,
    code:  "SOP-002",
    title:  "Prescription Collection Service",
    category:  "Dispensing",
    version:  "2.0",
    reviewDate:  "2026-10-01",
    status:  "Current",
    acked:  9,
    roles:  [
      "pharmacist",
      "technician",
      "dispenser",
      "aca"
    ],
    description:  "Covers the nomination, collection, and return process for patients using the repeat prescription collection service. Ensures prescriptions are collected from surgeries in a timely manner and patients are notified when ready. Complies with NHS contractual requirements and data protection obligations. Applies to all staff involved in the collection and processing cycle.",
    keyPoints:  [
      "Confirm patient consent and EPS nomination before enrolling in service",
      "Collect prescriptions from surgery within the agreed timeframe (usually 48 hours)",
      "Log all collections with date, surgery name, and number of prescriptions",
      "Flag any missing or incomplete prescriptions for immediate follow-up",
      "Notify patient by preferred method (call/text) when prescription is ready",
      "Process uncollected prescriptions according to the return policy after 14 days",
      "Maintain accurate records of all enrolled patients and their collection preferences",
      "Review service uptake and patient satisfaction quarterly"
    ],
    scope:  "This SOP applies to all pharmacists, pharmacy technicians, dispensers, Accuracy Checking Assistants at iPharmacy Direct. It covers all activities relating to prescription collection service and must be read, understood, and acknowledged before undertaking any related duties. Covers the nomination, collection, and return process for patients using the repeat prescription collection service.",
    references:  [
      "Human Medicines Regulations 2012",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "NICE NG5: Medicines Optimisation (2015)",
      "UK GDPR (Regulation (EU) 2016/679 as retained)",
      "ICO Guide to the UK GDPR"
    ],
    relatedSOPs:  [
      "SOP-003",
      "SOP-004",
      "SOP-005"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-05-31"
  },
  {
    id:  3,
    code:  "SOP-003",
    title:  "Repeat Dispensing Protocol",
    category:  "Dispensing",
    version:  "1.5",
    reviewDate:  "2026-07-20",
    status:  "Current",
    acked:  10,
    roles:  [
      "pharmacist",
      "technician",
      "dispenser"
    ],
    description:  "Outlines the procedure for managing repeat dispensing batches, including eligibility checks and interval monitoring. Ensures patients receive their medications at appropriate intervals without unnecessary GP appointments. Compliant with NHS Electronic Repeat Dispensing (eRD) guidance. The pharmacist retains clinical responsibility for each issue within the batch.",
    keyPoints:  [
      "Check batch validity, number of remaining issues, and expiry date",
      "Verify patient has not been flagged for clinical review by the prescriber",
      "Dispense only at appropriate intervals — do not issue early without clinical reason",
      "Perform full clinical check on each issue as if it were a new prescription",
      "Contact prescriber if any clinical concerns arise or patient condition changes",
      "Record any interventions or refusals in the patient medication record",
      "Advise patient to request a new batch prescription before the current one expires",
      "Monitor and report eRD utilisation rates to support NHS targets"
    ],
    scope:  "This SOP applies to all pharmacists, pharmacy technicians, dispensers at iPharmacy Direct. It covers all activities relating to repeat dispensing protocol and must be read, understood, and acknowledged before undertaking any related duties. Outlines the procedure for managing repeat dispensing batches, including eligibility checks and interval monitoring.",
    references:  [
      "Human Medicines Regulations 2012",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "NICE NG5: Medicines Optimisation (2015)",
      "NHS England Electronic Repeat Dispensing (eRD) Guidance",
      "PSNC eRD Toolkit"
    ],
    relatedSOPs:  [
      "SOP-002",
      "SOP-004",
      "SOP-010"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-04-19"
  },
  {
    id:  4,
    code:  "SOP-004",
    title:  "EPS Management",
    category:  "Dispensing",
    version:  "2.3",
    reviewDate:  "2026-08-12",
    status:  "Current",
    acked:  12,
    roles:  [
      "pharmacist",
      "technician",
      "dispenser"
    ],
    description:  "Governs the download, processing, and reconciliation of Electronic Prescription Service (EPS) prescriptions. Covers Release 2 and Release 4 workflows, token handling, and troubleshooting. Ensures prescriptions are downloaded promptly and dispensed within NHS timescales. All dispensary staff must understand EPS workflows relevant to their role.",
    keyPoints:  [
      "Download and match EPS tokens at regular intervals throughout the day",
      "Resolve any rejected, expired, or unmatched tokens promptly using the Spine portal",
      "Ensure endorsement data is accurate and complete before claiming submission",
      "Handle EPS downtime using contingency procedures (paper FP10 backup)",
      "Process nominated and non-nominated prescriptions according to NHS rules",
      "Manage patient EPS nominations and transfers between pharmacies correctly",
      "Reconcile EPS claims monthly against pharmacy system reports",
      "Report persistent EPS issues to the NHS Digital helpdesk"
    ],
    scope:  "This SOP applies to all pharmacists, pharmacy technicians, dispensers at iPharmacy Direct. It covers all activities relating to eps management and must be read, understood, and acknowledged before undertaking any related duties. Governs the download, processing, and reconciliation of Electronic Prescription Service (EPS) prescriptions.",
    references:  [
      "Human Medicines Regulations 2012",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "NICE NG5: Medicines Optimisation (2015)",
      "NHS Digital EPS Guidance",
      "NHS England EPS Contingency Procedures"
    ],
    relatedSOPs:  [
      "SOP-001",
      "SOP-003",
      "SOP-102"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-04-11"
  },
  {
    id:  5,
    code:  "SOP-005",
    title:  "Owing & Owing Register",
    category:  "Dispensing",
    version:  "1.8",
    reviewDate:  "2026-04-10",
    status:  "Due Review",
    acked:  8,
    roles:  [
      "pharmacist",
      "technician",
      "dispenser"
    ],
    description:  "Sets out how to manage owing items when stock is unavailable, including recording, follow-up, and patient communication. Ensures patients receive all prescribed items within a reasonable timeframe. The owing register provides an auditable record of all outstanding items. Applies whenever a prescription cannot be fully dispensed at the time of presentation.",
    keyPoints:  [
      "Record owing in the register with date, patient name, drug, quantity, and expected delivery",
      "Inform the patient of the reason for the owing and expected availability",
      "Order stock immediately and confirm expected delivery date with supplier",
      "Contact patient promptly when the item arrives and is ready for collection",
      "Close out owing entry upon collection or delivery with date and staff initials",
      "Review the owing register weekly to chase any overdue items",
      "Escalate items owing for more than 7 days to the pharmacist for alternative sourcing",
      "Retain owing register records for a minimum of 2 years for audit purposes"
    ],
    scope:  "This SOP applies to all pharmacists, pharmacy technicians, dispensers at iPharmacy Direct. It covers all activities relating to owing & owing register and must be read, understood, and acknowledged before undertaking any related duties. Sets out how to manage owing items when stock is unavailable, including recording, follow-up, and patient communication.",
    references:  [
      "Human Medicines Regulations 2012",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "NICE NG5: Medicines Optimisation (2015)",
      "GPhC Standards for Registered Pharmacies, Principle 4",
      "NHS Terms of Service, Schedule 4"
    ],
    relatedSOPs:  [
      "SOP-001",
      "SOP-051",
      "SOP-006"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-01-10"
  },
  {
    id:  6,
    code:  "SOP-006",
    title:  "Label Printing & Accuracy Checks",
    category:  "Dispensing",
    version:  "2.1",
    reviewDate:  "2026-11-30",
    status:  "Current",
    acked:  13,
    roles:  [
      "pharmacist",
      "technician",
      "dispenser"
    ],
    description:  "Ensures labels are printed correctly and all dispensed items undergo a final accuracy check before handout. The accuracy check is a critical patient safety step that must be performed by a person other than the original dispenser. Covers label content requirements under the Human Medicines Regulations 2012. Non-compliance may result in dispensing errors and regulatory action.",
    keyPoints:  [
      "Verify label matches prescription directions exactly including dose, frequency, and route",
      "Check patient name, drug name, strength, form, quantity, and warnings are correct",
      "Ensure cautionary and advisory labels (BNF) are applied where appropriate",
      "Perform independent accuracy check by a second competent person",
      "Report and correct any labelling errors immediately using the near miss system",
      "Use patient-friendly language on labels where the PMR system allows",
      "Ensure labels for CDs include the required additional wording",
      "Retain a copy of the label or audit trail in the dispensing record"
    ],
    scope:  "This SOP applies to all pharmacists, pharmacy technicians, dispensers at iPharmacy Direct. It covers all activities relating to label printing & accuracy checks and must be read, understood, and acknowledged before undertaking any related duties. Ensures labels are printed correctly and all dispensed items undergo a final accuracy check before handout.",
    references:  [
      "Human Medicines Regulations 2012",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "NICE NG5: Medicines Optimisation (2015)",
      "Human Medicines Regulations 2012, Regulation 260",
      "GPhC Standards for Registered Pharmacies, Principle 1"
    ],
    relatedSOPs:  [
      "SOP-001",
      "SOP-007",
      "SOP-027"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-07-29"
  },
  {
    id:  7,
    code:  "SOP-007",
    title:  "Patient Counselling",
    category:  "Dispensing",
    version:  "1.4",
    reviewDate:  "2026-06-15",
    status:  "Current",
    acked:  7,
    roles:  [
      "pharmacist"
    ],
    description:  "Describes the pharmacist's responsibility to counsel patients on new medications, high-risk drugs, and changed therapies. Effective counselling improves adherence and reduces adverse drug events. Based on GPhC Standards and NICE medicines optimisation guidelines. Must be offered for all new medicines and when significant changes occur.",
    keyPoints:  [
      "Identify patients requiring counselling at point of handout using PMR flags",
      "Explain dosage, administration route, timing, and duration of treatment",
      "Discuss common side effects and what action to take if they occur",
      "Address any patient concerns, beliefs, or barriers to adherence",
      "Provide written information leaflets where available and appropriate",
      "Document counselling provided in the patient medication record",
      "Use private consultation room for sensitive or complex discussions",
      "Follow up with patients on high-risk medicines within an agreed timeframe"
    ],
    scope:  "This SOP applies to all pharmacists at iPharmacy Direct. It covers all activities relating to patient counselling and must be read, understood, and acknowledged before undertaking any related duties. Describes the pharmacist's responsibility to counsel patients on new medications, high-risk drugs, and changed therapies.",
    references:  [
      "Human Medicines Regulations 2012",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "NICE NG5: Medicines Optimisation (2015)",
      "GPhC Standards for Pharmacy Professionals, Standard 3",
      "NICE CG76: Medicines Adherence"
    ],
    relatedSOPs:  [
      "SOP-001",
      "SOP-008",
      "SOP-068"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-04-14"
  },
  {
    id:  8,
    code:  "SOP-008",
    title:  "Pregnancy & Nursing Mothers",
    category:  "Dispensing",
    version:  "1.2",
    reviewDate:  "2026-12-01",
    status:  "Current",
    acked:  6,
    roles:  [
      "pharmacist"
    ],
    description:  "Guides the pharmacist on safe dispensing and counselling for pregnant or breastfeeding patients. Certain medicines carry teratogenic or neonatal risks that require specialist assessment. References BUMPS (Best Use of Medicines in Pregnancy), UK Teratology Information Service, and SPCs. Applies to all prescription and OTC requests from pregnant or lactating women.",
    keyPoints:  [
      "Check all prescribed items against pregnancy/breastfeeding safety data",
      "Refer to specialist sources (BUMPS, UKTIS, SPC) if safety data is uncertain",
      "Liaise with prescriber immediately if a contraindicated drug is identified",
      "Counsel patient on any risks, benefits, and alternative options available",
      "Record pregnancy/breastfeeding status in the patient medication record",
      "Apply caution with OTC requests — assess before sale using WWHAM framework",
      "Ensure folic acid and vitamin D supplementation advice is offered routinely",
      "Flag patients on valproate for the Pregnancy Prevention Programme requirements"
    ],
    scope:  "This SOP applies to all pharmacists at iPharmacy Direct. It covers all activities relating to pregnancy & nursing mothers and must be read, understood, and acknowledged before undertaking any related duties. Guides the pharmacist on safe dispensing and counselling for pregnant or breastfeeding patients.",
    references:  [
      "Human Medicines Regulations 2012",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "NICE NG5: Medicines Optimisation (2015)",
      "UK Teratology Information Service (UKTIS)",
      "BUMPS (Best Use of Medicines in Pregnancy)"
    ],
    relatedSOPs:  [
      "SOP-007",
      "SOP-018",
      "SOP-025"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-09-30"
  },
  {
    id:  9,
    code:  "SOP-009",
    title:  "Methadone Supervised Consumption",
    category:  "Dispensing",
    version:  "2.6",
    reviewDate:  "2026-05-20",
    status:  "Current",
    acked:  5,
    roles:  [
      "pharmacist",
      "technician"
    ],
    description:  "Details the supervised consumption process for methadone and buprenorphine, including ID verification and record-keeping. This is a high-risk service requiring strict adherence to prevent diversion, overdose, and misuse. Operates under contract with the local Drug and Alcohol Team. Only trained and competent staff may participate in the supervised consumption process.",
    keyPoints:  [
      "Verify patient identity using photo ID or known-patient protocol before each dose",
      "Prepare and measure the dose accurately in the presence of the patient",
      "Administer dose and observe full consumption including mouth check where required",
      "Record administration in the supervised consumption log with date, time, and initials",
      "Handle missed doses per prescriber instructions — do not supply after 3 consecutive missed days without contact",
      "Store methadone and buprenorphine securely in the CD cupboard at all times",
      "Maintain patient confidentiality and dignity throughout the process",
      "Report any concerns about patient behaviour or intoxication to the prescriber immediately"
    ],
    scope:  "This SOP applies to all pharmacists, pharmacy technicians at iPharmacy Direct. It covers all activities relating to methadone supervised consumption and must be read, understood, and acknowledged before undertaking any related duties. Details the supervised consumption process for methadone and buprenorphine, including ID verification and record-keeping.",
    references:  [
      "Human Medicines Regulations 2012",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "NICE NG5: Medicines Optimisation (2015)",
      "Drug Misuse and Dependence: UK Guidelines on Clinical Management (2017)",
      "PHE Guidance on Pharmacy-Based Supervised Consumption"
    ],
    relatedSOPs:  [
      "SOP-017",
      "SOP-075",
      "SOP-059"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2024-12-20"
  },
  {
    id:  10,
    code:  "SOP-010",
    title:  "Blister Pack / MDS Dispensing",
    category:  "Dispensing",
    version:  "1.9",
    reviewDate:  "2026-03-28",
    status:  "Due Review",
    acked:  10,
    roles:  [
      "pharmacist",
      "technician",
      "dispenser"
    ],
    description:  "Covers preparation, checking, and delivery of multi-compartment compliance aids (blister packs / MDS trays) for patients. Ensures medicines are assembled accurately according to the current MAR chart and prescription. Applicable to domiciliary patients, care home residents, and community patients with adherence difficulties. Follows NICE guidance on compliance aids and RPS best practice.",
    keyPoints:  [
      "Confirm patient MAR chart is up to date and matches current prescriptions",
      "Check for any prescription changes, new items, or discontinued medicines before filling",
      "Fill trays accurately, labelling each compartment with drug name, dose, and time",
      "Pharmacist performs final accuracy check before sealing all trays",
      "Deliver or arrange collection within the agreed weekly or fortnightly schedule",
      "Include a current MAR chart with each delivery for care home patients",
      "Record any changes or interventions in the patient medication record",
      "Review patient suitability for MDS at least annually with the prescriber"
    ],
    scope:  "This SOP applies to all pharmacists, pharmacy technicians, dispensers at iPharmacy Direct. It covers all activities relating to blister pack / mds dispensing and must be read, understood, and acknowledged before undertaking any related duties. Covers preparation, checking, and delivery of multi-compartment compliance aids (blister packs / MDS trays) for patients.",
    references:  [
      "Human Medicines Regulations 2012",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "NICE NG5: Medicines Optimisation (2015)",
      "RPS Multi-Compartment Compliance Aids Guidance",
      "NICE Medicines Adherence CG76"
    ],
    relatedSOPs:  [
      "SOP-001",
      "SOP-006",
      "SOP-098"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2024-12-28"
  },
  {
    id:  56,
    code:  "SOP-056",
    title:  "Specials & Unlicensed Medicines",
    category:  "Dispensing",
    version:  "1.1",
    reviewDate:  "2026-06-30",
    status:  "Current",
    acked:  5,
    roles:  [
      "pharmacist",
      "technician"
    ],
    description:  "Governs the procurement, dispensing, and record-keeping for special-order and unlicensed medicinal products. These products carry additional risk as they have not undergone standard UK licensing. The prescriber must accept clinical responsibility, and the pharmacist must ensure the product meets the prescription requirements. Complies with MHRA guidance on the supply of unlicensed medicinal products.",
    keyPoints:  [
      "Verify the prescription clearly states the unlicensed product and that no licensed alternative exists",
      "Source specials only from MHRA-licensed specials manufacturers",
      "Record all specials orders in the dedicated specials log with supplier and batch details",
      "Ensure the prescriber has been informed that the product is unlicensed",
      "Label the product clearly including \"unlicensed medicine\" where required",
      "Store specials according to manufacturer instructions on receipt",
      "Retain certificates of analysis and conformity for each batch ordered",
      "Report any suspected adverse reactions to the MHRA Yellow Card scheme"
    ],
    scope:  "This SOP applies to all pharmacists, pharmacy technicians at iPharmacy Direct. It covers all activities relating to specials & unlicensed medicines and must be read, understood, and acknowledged before undertaking any related duties. Governs the procurement, dispensing, and record-keeping for special-order and unlicensed medicinal products.",
    references:  [
      "Human Medicines Regulations 2012",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "NICE NG5: Medicines Optimisation (2015)",
      "MHRA Guidance on the Supply of Unlicensed Medicinal Products (Specials)",
      "Human Medicines Regulations 2012, Regulation 167"
    ],
    relatedSOPs:  [
      "SOP-061",
      "SOP-001",
      "SOP-018"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-04-29"
  },
  {
    id:  57,
    code:  "SOP-057",
    title:  "Hospital Discharge Prescription Handling",
    category:  "Dispensing",
    version:  "1.3",
    reviewDate:  "2026-09-10",
    status:  "Current",
    acked:  7,
    roles:  [
      "pharmacist",
      "technician",
      "dispenser"
    ],
    description:  "Outlines how to process prescriptions issued on hospital discharge, including reconciliation with the patient's existing medication record. Discharge prescriptions frequently contain changes that must be carefully reviewed to prevent errors. Close liaison with the GP surgery may be required to ensure continuity of care. Applies to all discharge summaries and FP10HNC prescriptions received.",
    keyPoints:  [
      "Compare discharge prescription with the patient's existing medication record on the PMR",
      "Identify any new medicines, dose changes, or discontinued items",
      "Contact the GP surgery to confirm changes have been actioned on the patient's repeat template",
      "Counsel the patient on any changes to their medication regimen",
      "Flag high-risk changes (e.g. anticoagulants, insulin) for pharmacist review",
      "Record all reconciliation actions in the patient medication record",
      "Dispense discharge items promptly to avoid gaps in treatment",
      "File or scan the discharge summary for future reference"
    ],
    scope:  "This SOP applies to all pharmacists, pharmacy technicians, dispensers at iPharmacy Direct. It covers all activities relating to hospital discharge prescription handling and must be read, understood, and acknowledged before undertaking any related duties. Outlines how to process prescriptions issued on hospital discharge, including reconciliation with the patient's existing medication record.",
    references:  [
      "Human Medicines Regulations 2012",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "NICE NG5: Medicines Optimisation (2015)",
      "NHSBSA Security of Prescription Forms Guidance",
      "NHS Counter Fraud Authority Prescription Form Security Standards"
    ],
    relatedSOPs:  [
      "SOP-001",
      "SOP-117",
      "SOP-018"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-07-09"
  },
  {
    id:  58,
    code:  "SOP-058",
    title:  "Returned Medicines Procedure",
    category:  "Dispensing",
    version:  "1.0",
    reviewDate:  "2026-07-15",
    status:  "Current",
    acked:  9,
    roles:  [
      "pharmacist",
      "technician",
      "dispenser",
      "aca"
    ],
    description:  "Defines the process for accepting, sorting, and disposing of medicines returned by patients or their representatives. Returned medicines cannot be re-dispensed and must be disposed of safely via approved pharmaceutical waste routes. Controlled Drugs returned by patients must follow the separate CD returns procedure. Complies with Environmental Protection Act requirements for pharmaceutical waste.",
    keyPoints:  [
      "Accept returned medicines from patients without requiring a reason",
      "Never re-dispense any returned medicine regardless of apparent condition",
      "Segregate returned CDs and handle under the CD destruction protocol (SOP-012)",
      "Place non-CD returns in the designated pharmaceutical waste bin",
      "Remove any patient-identifiable information from packaging before disposal",
      "Record returned medicines in the returns log with date and item description",
      "Dispose of sharps, inhalers, and liquids according to their specific waste streams",
      "Arrange collection by the approved pharmaceutical waste contractor at regular intervals"
    ],
    scope:  "This SOP applies to all pharmacists, pharmacy technicians, dispensers, Accuracy Checking Assistants at iPharmacy Direct. It covers all activities relating to returned medicines procedure and must be read, understood, and acknowledged before undertaking any related duties. Defines the process for accepting, sorting, and disposing of medicines returned by patients or their representatives.",
    references:  [
      "Human Medicines Regulations 2012",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "NICE NG5: Medicines Optimisation (2015)",
      "Environmental Protection Act 1990",
      "Hazardous Waste Regulations 2005"
    ],
    relatedSOPs:  [
      "SOP-047",
      "SOP-091",
      "SOP-064"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-05-14"
  },
  {
    id:  59,
    code:  "SOP-059",
    title:  "Instalment Dispensing",
    category:  "Dispensing",
    version:  "1.4",
    reviewDate:  "2026-08-25",
    status:  "Current",
    acked:  6,
    roles:  [
      "pharmacist",
      "technician"
    ],
    description:  "Covers the dispensing of medicines prescribed on instalment prescriptions, including daily and weekly pick-up schedules. Commonly used for substance misuse treatment but also applicable to other clinical situations. Ensures each instalment is dispensed at the correct interval and that missed doses are handled safely. Follows Home Office and NHS England guidance on instalment prescribing.",
    keyPoints:  [
      "Verify the instalment prescription is valid and within date before each supply",
      "Dispense only the quantity specified for each instalment interval",
      "Record each instalment supply with date, quantity, and staff initials",
      "Do not supply missed instalments without contacting the prescriber first",
      "Handle bank holiday and weekend adjustments per prescriber instructions on the Rx",
      "Ensure the patient understands their collection schedule and consequences of missed doses",
      "Store partially dispensed instalment prescriptions securely between supplies",
      "Notify the prescriber if a patient misses 3 or more consecutive collections"
    ],
    scope:  "This SOP applies to all pharmacists, pharmacy technicians at iPharmacy Direct. It covers all activities relating to instalment dispensing and must be read, understood, and acknowledged before undertaking any related duties. Covers the dispensing of medicines prescribed on instalment prescriptions, including daily and weekly pick-up schedules.",
    references:  [
      "Human Medicines Regulations 2012",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "NICE NG5: Medicines Optimisation (2015)",
      "Drug Misuse and Dependence: UK Guidelines on Clinical Management (2017)",
      "PHE Guidance on Pharmacy-Based Supervised Consumption"
    ],
    relatedSOPs:  [
      "SOP-009",
      "SOP-017",
      "SOP-003"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-06-24"
  },
  {
    id:  60,
    code:  "SOP-060",
    title:  "Private Prescriptions",
    category:  "Dispensing",
    version:  "2.0",
    reviewDate:  "2026-10-05",
    status:  "Current",
    acked:  8,
    roles:  [
      "pharmacist",
      "technician",
      "dispenser"
    ],
    description:  "Governs the receipt, validation, dispensing, and record-keeping for private prescriptions. Private prescriptions have specific legal requirements that differ from NHS prescriptions, including mandatory recording in the POM register. Schedule 2 and 3 CD private prescriptions must additionally comply with the Misuse of Drugs Regulations. Applies to prescriptions from private GPs, dentists, and independent prescribers.",
    keyPoints:  [
      "Verify the prescriber is registered and entitled to prescribe the items stated",
      "Check all mandatory legal requirements are met (date, signature, address, age if under 12)",
      "Record the prescription in the private prescription register (POM register) before dispensing",
      "Apply appropriate pricing and collect payment or process through private insurance",
      "Retain the original private prescription for 2 years as required by law",
      "For CD Schedule 2/3 items, verify FP10PCD form requirements and prescriber ID",
      "Ensure the patient receives the same standard of clinical check as for NHS prescriptions",
      "Submit NHSBSA private CD data returns as required"
    ],
    scope:  "This SOP applies to all pharmacists, pharmacy technicians, dispensers at iPharmacy Direct. It covers all activities relating to private prescriptions and must be read, understood, and acknowledged before undertaking any related duties. Governs the receipt, validation, dispensing, and record-keeping for private prescriptions.",
    references:  [
      "Human Medicines Regulations 2012",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "NICE NG5: Medicines Optimisation (2015)",
      "Human Medicines Regulations 2012, Part 12",
      "NHSBSA Private Prescription Guidance"
    ],
    relatedSOPs:  [
      "SOP-001",
      "SOP-006",
      "SOP-118"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-06-04"
  },
  {
    id:  61,
    code:  "SOP-061",
    title:  "Extemporaneous Preparation",
    category:  "Dispensing",
    version:  "1.2",
    reviewDate:  "2026-11-20",
    status:  "Current",
    acked:  4,
    roles:  [
      "pharmacist",
      "technician"
    ],
    description:  "Details the process for compounding medicines extemporaneously when no suitable licensed product is available. Extemporaneous preparation carries inherent risks and should only be undertaken when clinically necessary. The pharmacist must ensure the formulation is appropriate, stable, and accurately prepared. Follows RPS professional standards for extemporaneous preparation.",
    keyPoints:  [
      "Confirm no suitable licensed product exists before preparing extemporaneously",
      "Use validated formulations from recognised sources (e.g. Pharmaceutical Codex, hospital formularies)",
      "Calculate quantities accurately and have calculations independently checked",
      "Prepare in a clean, dedicated area using calibrated equipment",
      "Label with drug name, strength, directions, expiry date (max 4 weeks unless validated), and storage",
      "Record preparation details in the extemporaneous preparation log including batch and expiry",
      "Pharmacist must check the final product before release",
      "Retain preparation records for a minimum of 2 years"
    ],
    scope:  "This SOP applies to all pharmacists, pharmacy technicians at iPharmacy Direct. It covers all activities relating to extemporaneous preparation and must be read, understood, and acknowledged before undertaking any related duties. Details the process for compounding medicines extemporaneously when no suitable licensed product is available.",
    references:  [
      "Human Medicines Regulations 2012",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "NICE NG5: Medicines Optimisation (2015)",
      "RPS Professional Standards for Extemporaneous Preparation",
      "MHRA Guidance on Manufacture of Unlicensed Medicines"
    ],
    relatedSOPs:  [
      "SOP-056",
      "SOP-001",
      "SOP-006"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-09-19"
  },
  {
    id:  11,
    code:  "SOP-011",
    title:  "CD Receipt & Storage",
    category:  "CD",
    version:  "2.1",
    reviewDate:  "2026-04-01",
    status:  "Due Review",
    acked:  8,
    roles:  [
      "pharmacist",
      "technician"
    ],
    description:  "Covers the safe receipt, verification, and secure storage of Controlled Drug deliveries in the pharmacy. All Schedule 2 CDs must be stored in a locked CD cupboard meeting Home Office specifications. Receipt must be recorded in the CD register before any other action. Complies with the Misuse of Drugs (Safe Custody) Regulations 1973.",
    keyPoints:  [
      "Check delivery against order and invoice immediately on arrival",
      "Verify quantities, strengths, and batch numbers match the delivery note",
      "Enter into CD register immediately upon receipt with date, supplier, and quantity",
      "Store in locked CD cupboard with access restricted to authorised personnel only",
      "Report any discrepancies to supplier and superintendent within 24 hours",
      "Retain delivery notes and invoices for a minimum of 2 years",
      "Ensure CD cupboard key is held by the RP or designated key holder at all times",
      "Conduct a physical stock check after receipt to confirm running balance"
    ],
    scope:  "This SOP applies to all pharmacists, pharmacy technicians at iPharmacy Direct. It covers all activities relating to cd receipt & storage and must be read, understood, and acknowledged before undertaking any related duties. Covers the safe receipt, verification, and secure storage of Controlled Drug deliveries in the pharmacy.",
    references:  [
      "Misuse of Drugs Act 1971",
      "Misuse of Drugs Regulations 2001 (as amended)",
      "Misuse of Drugs (Safe Custody) Regulations 1973",
      "GPhC Guidance on Controlled Drugs (2019)"
    ],
    relatedSOPs:  [
      "SOP-013",
      "SOP-014",
      "SOP-065"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2024-12-01"
  },
  {
    id:  12,
    code:  "SOP-012",
    title:  "CD Destruction Protocol",
    category:  "CD",
    version:  "1.3",
    reviewDate:  "2026-06-30",
    status:  "Current",
    acked:  9,
    roles:  [
      "pharmacist"
    ],
    description:  "Describes the witnessed destruction process for expired, damaged, or patient-returned Controlled Drugs. Destruction must be witnessed by an authorised person as defined by the Misuse of Drugs Regulations. Denaturing must render the drug irretrievable. Records must be maintained in the CD register and kept for a minimum of 2 years.",
    keyPoints:  [
      "Only destroy CDs with an authorised witness present (e.g. CD accountable officer, police)",
      "Denature drugs using an approved destruction kit that renders them irretrievable",
      "Record destruction details in CD register: date, drug, quantity, witness name and signature",
      "Both pharmacist and witness must sign the destruction entry",
      "Retain destruction records and witness details for a minimum of 2 years",
      "For patient-returned CDs, record the patient name and quantity returned before destruction",
      "Arrange destruction with the NHS England CD accountable officer team where required",
      "Never dispose of CDs via standard pharmaceutical waste routes"
    ],
    scope:  "This SOP applies to all pharmacists at iPharmacy Direct. It covers all activities relating to cd destruction protocol and must be read, understood, and acknowledged before undertaking any related duties. Describes the witnessed destruction process for expired, damaged, or patient-returned Controlled Drugs.",
    references:  [
      "Misuse of Drugs Act 1971",
      "Misuse of Drugs Regulations 2001 (as amended)",
      "Misuse of Drugs (Safe Custody) Regulations 1973",
      "GPhC Guidance on Controlled Drugs (2019)"
    ],
    relatedSOPs:  [
      "SOP-064",
      "SOP-013",
      "SOP-066"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-04-29"
  },
  {
    id:  13,
    code:  "SOP-013",
    title:  "CD Running Balance & Reconciliation",
    category:  "CD",
    version:  "2.4",
    reviewDate:  "2026-08-15",
    status:  "Current",
    acked:  7,
    roles:  [
      "pharmacist",
      "technician"
    ],
    description:  "Ensures the CD register running balance is maintained accurately and reconciled regularly against physical stock. Running balances are a legal requirement for Schedule 2 CDs and best practice for Schedule 3-5. Discrepancies must be investigated immediately and may require reporting to the CD accountable officer. Complies with the Misuse of Drugs Regulations 2001.",
    keyPoints:  [
      "Update running balance after every transaction (receipt, supply, destruction, return)",
      "Perform physical stock check against register balance at least weekly for Schedule 2 CDs",
      "Investigate and document any discrepancies immediately — do not adjust without explanation",
      "Report unresolved discrepancies to the superintendent and CD accountable officer",
      "Use a separate page in the register for each CD preparation and strength",
      "Do not use correction fluid — cross out errors with a single line and initial",
      "Ensure all entries include date, transaction type, quantity, and running balance",
      "Superintendent must review and sign off reconciliation records monthly"
    ],
    scope:  "This SOP applies to all pharmacists, pharmacy technicians at iPharmacy Direct. It covers all activities relating to cd running balance & reconciliation and must be read, understood, and acknowledged before undertaking any related duties. Ensures the CD register running balance is maintained accurately and reconciled regularly against physical stock.",
    references:  [
      "Misuse of Drugs Act 1971",
      "Misuse of Drugs Regulations 2001 (as amended)",
      "Misuse of Drugs (Safe Custody) Regulations 1973",
      "GPhC Guidance on Controlled Drugs (2019)"
    ],
    relatedSOPs:  [
      "SOP-011",
      "SOP-014",
      "SOP-017"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-04-14"
  },
  {
    id:  14,
    code:  "SOP-014",
    title:  "CD Audit Procedures",
    category:  "CD",
    version:  "1.7",
    reviewDate:  "2026-02-15",
    status:  "Overdue",
    acked:  6,
    roles:  [
      "pharmacist",
      "manager"
    ],
    description:  "Sets out the schedule and methodology for internal CD audits to ensure compliance with Misuse of Drugs Regulations. Covers Schedule 2 through 5 substances with varying audit frequencies based on risk. Audit findings must be documented and any corrective actions tracked to completion. The superintendent pharmacist retains overall responsibility for CD compliance.",
    keyPoints:  [
      "Conduct full CD audit at least quarterly for all Schedule 2 controlled drugs",
      "Compare register balances with physical stock for every Schedule 2 preparation",
      "Audit Schedule 3, 4, and 5 CDs at least annually or more frequently if concerns arise",
      "Document audit findings including date, auditor, results, and any discrepancies found",
      "Create corrective action plans for any issues identified and assign responsibility",
      "Superintendent to review and sign off all audit results within 14 days",
      "Retain audit records for a minimum of 5 years for regulatory inspection",
      "Report significant findings to the NHS England CD accountable officer as required"
    ],
    scope:  "This SOP applies to all pharmacists, the Pharmacy Manager at iPharmacy Direct. It covers all activities relating to cd audit procedures and must be read, understood, and acknowledged before undertaking any related duties. Sets out the schedule and methodology for internal CD audits to ensure compliance with Misuse of Drugs Regulations.",
    references:  [
      "Misuse of Drugs Act 1971",
      "Misuse of Drugs Regulations 2001 (as amended)",
      "Misuse of Drugs (Safe Custody) Regulations 1973",
      "GPhC Guidance on Controlled Drugs (2019)",
      "GPhC Standards for Registered Pharmacies, Principle 5",
      "NHS England Clinical Governance Framework"
    ],
    relatedSOPs:  [
      "SOP-013",
      "SOP-077",
      "SOP-066"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2024-11-15"
  },
  {
    id:  15,
    code:  "SOP-015",
    title:  "CD Returns to Supplier",
    category:  "CD",
    version:  "1.1",
    reviewDate:  "2026-09-01",
    status:  "Current",
    acked:  5,
    roles:  [
      "pharmacist",
      "technician"
    ],
    description:  "Covers the process for returning Controlled Drugs to authorised suppliers, including documentation requirements. Only licensed wholesale dealers or manufacturers may receive CD returns. Strict record-keeping in the CD register is mandatory. The pharmacist must ensure the return is lawful and properly documented before releasing any stock.",
    keyPoints:  [
      "Verify the supplier holds a Home Office licence to possess the relevant CD schedules",
      "Complete the requisition form (FP10CDF or equivalent) with full drug details and quantities",
      "Update CD register with return details: date, supplier name, quantity, and running balance",
      "Obtain the driver or courier signature on the requisition form upon collection",
      "Retain copies of all return documentation including requisition and proof of collection",
      "Do not hand over CDs without a valid signed requisition from the receiving party",
      "Record any discrepancies between the requisition and the actual stock returned",
      "File return records chronologically for easy retrieval during inspections"
    ],
    scope:  "This SOP applies to all pharmacists, pharmacy technicians at iPharmacy Direct. It covers all activities relating to cd returns to supplier and must be read, understood, and acknowledged before undertaking any related duties. Covers the process for returning Controlled Drugs to authorised suppliers, including documentation requirements.",
    references:  [
      "Misuse of Drugs Act 1971",
      "Misuse of Drugs Regulations 2001 (as amended)",
      "Misuse of Drugs (Safe Custody) Regulations 1973",
      "GPhC Guidance on Controlled Drugs (2019)"
    ],
    relatedSOPs:  [
      "SOP-011",
      "SOP-013",
      "SOP-062"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-06-30"
  },
  {
    id:  16,
    code:  "SOP-016",
    title:  "CD Emergency Supply",
    category:  "CD",
    version:  "1.0",
    reviewDate:  "2026-11-10",
    status:  "Current",
    acked:  4,
    roles:  [
      "pharmacist"
    ],
    description:  "Outlines the limited circumstances in which a pharmacist may make an emergency supply of a Controlled Drug. Emergency supply provisions are highly restricted for CDs — only Schedule 4 and 5 CDs may be supplied under the emergency provisions of the Human Medicines Regulations. Schedule 2 and 3 CDs cannot be emergency-supplied under any circumstances. The pharmacist must exercise professional judgement and document the supply fully.",
    keyPoints:  [
      "Confirm genuine clinical need and that the patient cannot obtain a prescription in time",
      "Only Schedule 4 and 5 CDs may be supplied under emergency supply provisions",
      "Schedule 2 and 3 CDs are excluded from emergency supply — advise patient to contact prescriber or OOH service",
      "Provide the smallest quantity necessary to cover treatment until a prescription can be obtained",
      "Record the emergency supply in the POM register with full details and clinical justification",
      "Label the medicine clearly as an emergency supply with date and quantity",
      "Inform the prescriber of the emergency supply at the earliest opportunity",
      "Retain records for a minimum of 2 years for audit and inspection purposes"
    ],
    scope:  "This SOP applies to all pharmacists at iPharmacy Direct. It covers all activities relating to cd emergency supply and must be read, understood, and acknowledged before undertaking any related duties. Outlines the limited circumstances in which a pharmacist may make an emergency supply of a Controlled Drug.",
    references:  [
      "Misuse of Drugs Act 1971",
      "Misuse of Drugs Regulations 2001 (as amended)",
      "Misuse of Drugs (Safe Custody) Regulations 1973",
      "GPhC Guidance on Controlled Drugs (2019)",
      "Human Medicines Regulations 2012, Part 10",
      "RPS Emergency Supply Guidance"
    ],
    relatedSOPs:  [
      "SOP-024",
      "SOP-017",
      "SOP-063"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-09-09"
  },
  {
    id:  17,
    code:  "SOP-017",
    title:  "Methadone CD Register",
    category:  "CD",
    version:  "2.2",
    reviewDate:  "2026-07-05",
    status:  "Current",
    acked:  6,
    roles:  [
      "pharmacist",
      "technician"
    ],
    description:  "Specific procedures for maintaining methadone entries in the CD register, including instalment prescriptions. Methadone is one of the most frequently dispensed Schedule 2 CDs and requires meticulous record-keeping. Each instalment must be recorded separately, and the register must cross-reference with the supervised consumption log. Errors in methadone record-keeping can have serious patient safety and regulatory consequences.",
    keyPoints:  [
      "Record each instalment dose separately in the register with date, quantity supplied, and patient name",
      "Cross-reference register entries with the supervised consumption log daily",
      "Flag any missed collections for prescriber follow-up within 24 hours",
      "Maintain a separate page in the register for each methadone preparation and strength",
      "Record the total quantity received and the running balance after each transaction",
      "Note bank holiday and weekend supply adjustments as annotated on the prescription",
      "Conduct weekly physical stock reconciliation of all methadone preparations",
      "Alert the superintendent if the running balance does not match physical stock"
    ],
    scope:  "This SOP applies to all pharmacists, pharmacy technicians at iPharmacy Direct. It covers all activities relating to methadone cd register and must be read, understood, and acknowledged before undertaking any related duties. Specific procedures for maintaining methadone entries in the CD register, including instalment prescriptions.",
    references:  [
      "Misuse of Drugs Act 1971",
      "Misuse of Drugs Regulations 2001 (as amended)",
      "Misuse of Drugs (Safe Custody) Regulations 1973",
      "GPhC Guidance on Controlled Drugs (2019)",
      "Drug Misuse and Dependence: UK Guidelines on Clinical Management (2017)",
      "PHE Guidance on Pharmacy-Based Supervised Consumption"
    ],
    relatedSOPs:  [
      "SOP-009",
      "SOP-013",
      "SOP-059"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-03-05"
  },
  {
    id:  62,
    code:  "SOP-062",
    title:  "Schedule 3 & 4 CD Management",
    category:  "CD",
    version:  "1.0",
    reviewDate:  "2026-10-20",
    status:  "Current",
    acked:  7,
    roles:  [
      "pharmacist",
      "technician",
      "dispenser"
    ],
    description:  "Covers the specific handling requirements for Schedule 3 and Schedule 4 Controlled Drugs, which differ from Schedule 2. While safe custody requirements apply to most Schedule 3 CDs, many Schedule 4 CDs are exempt from safe custody. Record-keeping requirements also vary by schedule. Staff must understand these distinctions to ensure compliance.",
    keyPoints:  [
      "Store Schedule 3 CDs in the CD cupboard unless specifically exempt (e.g. midazolam)",
      "Schedule 4 CDs do not require CD cupboard storage but must be stored securely",
      "Record Schedule 3 CDs in the CD register — this is a legal requirement",
      "Schedule 4 CDs do not legally require CD register entries but recording is best practice",
      "Retain Schedule 3 prescriptions for 2 years; Schedule 4 follow standard POM retention",
      "Ensure prescription validity periods are observed (28 days for Schedule 3 CDs)",
      "Apply appropriate endorsement for NHS reimbursement of each schedule",
      "Include Schedule 3 and 4 CDs in the quarterly audit programme"
    ],
    scope:  "This SOP applies to all pharmacists, pharmacy technicians, dispensers at iPharmacy Direct. It covers all activities relating to schedule 3 & 4 cd management and must be read, understood, and acknowledged before undertaking any related duties. Covers the specific handling requirements for Schedule 3 and Schedule 4 Controlled Drugs, which differ from Schedule 2.",
    references:  [
      "Misuse of Drugs Act 1971",
      "Misuse of Drugs Regulations 2001 (as amended)",
      "Misuse of Drugs (Safe Custody) Regulations 1973",
      "GPhC Guidance on Controlled Drugs (2019)"
    ],
    relatedSOPs:  [
      "SOP-063",
      "SOP-011",
      "SOP-014"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-08-19"
  },
  {
    id:  63,
    code:  "SOP-063",
    title:  "Schedule 5 CD Handling",
    category:  "CD",
    version:  "1.0",
    reviewDate:  "2026-12-05",
    status:  "Current",
    acked:  8,
    roles:  [
      "pharmacist",
      "technician",
      "dispenser"
    ],
    description:  "Defines the reduced regulatory requirements for Schedule 5 Controlled Drugs, which have the lowest misuse potential. Schedule 5 preparations include low-strength codeine, pholcodine, and morphine mixtures. While regulatory requirements are lighter, professional standards still apply. Staff should understand which products fall under Schedule 5 to avoid over- or under-applying controls.",
    keyPoints:  [
      "Schedule 5 CDs are exempt from safe custody requirements — standard secure storage applies",
      "No CD register entry is required for Schedule 5 preparations",
      "Invoices must be retained for 2 years as the primary record of receipt",
      "No prescription is required for most Schedule 5 products (OTC sale permitted)",
      "Apply responsible OTC sale practices including WWHAM assessment and refusal if misuse suspected",
      "Record any OTC refusals in the responsible pharmacist log",
      "Include Schedule 5 products in annual stock takes for financial and governance purposes",
      "Ensure all staff can identify which products are Schedule 5 CDs"
    ],
    scope:  "This SOP applies to all pharmacists, pharmacy technicians, dispensers at iPharmacy Direct. It covers all activities relating to schedule 5 cd handling and must be read, understood, and acknowledged before undertaking any related duties. Defines the reduced regulatory requirements for Schedule 5 Controlled Drugs, which have the lowest misuse potential.",
    references:  [
      "Misuse of Drugs Act 1971",
      "Misuse of Drugs Regulations 2001 (as amended)",
      "Misuse of Drugs (Safe Custody) Regulations 1973",
      "GPhC Guidance on Controlled Drugs (2019)",
      "HSE Slips and Trips Guidance (INDG225)",
      "Workplace (Health, Safety and Welfare) Regulations 1992"
    ],
    relatedSOPs:  [
      "SOP-062",
      "SOP-011",
      "SOP-016"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-10-04"
  },
  {
    id:  64,
    code:  "SOP-064",
    title:  "Patient-Returned CDs",
    category:  "CD",
    version:  "1.2",
    reviewDate:  "2026-05-15",
    status:  "Current",
    acked:  5,
    roles:  [
      "pharmacist"
    ],
    description:  "Covers the acceptance, recording, and destruction of Controlled Drugs returned by patients or their representatives. Patient-returned CDs must not be placed back into stock and must be destroyed in accordance with regulations. A clear audit trail from receipt to destruction is essential. Only pharmacists may accept returned Schedule 2 CDs.",
    keyPoints:  [
      "Accept returned CDs from patients courteously and without requiring a reason for return",
      "Record the patient name, drug name, quantity, and date received in the patient returns log",
      "Store returned CDs separately in the CD cupboard, clearly marked as patient returns",
      "Do not add patient-returned CDs to the running stock balance in the CD register",
      "Arrange witnessed destruction in accordance with SOP-012",
      "Record destruction with cross-reference to the original patient return entry",
      "Inform the prescriber if large quantities are returned, which may indicate non-adherence",
      "Ensure patient-returned CDs are destroyed within 3 months of receipt"
    ],
    scope:  "This SOP applies to all pharmacists at iPharmacy Direct. It covers all activities relating to patient-returned cds and must be read, understood, and acknowledged before undertaking any related duties. Covers the acceptance, recording, and destruction of Controlled Drugs returned by patients or their representatives.",
    references:  [
      "Misuse of Drugs Act 1971",
      "Misuse of Drugs Regulations 2001 (as amended)",
      "Misuse of Drugs (Safe Custody) Regulations 1973",
      "GPhC Guidance on Controlled Drugs (2019)",
      "GPhC Standards for Registered Pharmacies, Principle 5",
      "NHS England Clinical Governance Framework"
    ],
    relatedSOPs:  [
      "SOP-012",
      "SOP-058",
      "SOP-066"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-03-15"
  },
  {
    id:  65,
    code:  "SOP-065",
    title:  "CD Cabinet Key Management",
    category:  "CD",
    version:  "1.1",
    reviewDate:  "2026-04-20",
    status:  "Due Review",
    acked:  6,
    roles:  [
      "pharmacist",
      "manager"
    ],
    description:  "Establishes strict protocols for the management, custody, and security of CD cabinet keys. The CD cupboard key must be held by the Responsible Pharmacist or a designated key holder at all times. Loss of the key must be reported immediately as it represents a security breach. Duplicate keys must be stored securely and their location restricted to senior staff.",
    keyPoints:  [
      "The RP on duty holds primary responsibility for the CD cupboard key",
      "Handover the key formally between RPs during shift changes — record in the RP log",
      "Store the duplicate key in a sealed, signed envelope in the pharmacy safe",
      "Report any loss of a CD key immediately to the superintendent and consider lock replacement",
      "Do not attach CD keys to a communal key ring or leave them unattended",
      "Key access must be restricted to pharmacists and authorised technicians only",
      "Log all instances of duplicate key use with reason, date, and staff member",
      "Review key security procedures during each quarterly CD audit"
    ],
    scope:  "This SOP applies to all pharmacists, the Pharmacy Manager at iPharmacy Direct. It covers all activities relating to cd cabinet key management and must be read, understood, and acknowledged before undertaking any related duties. Establishes strict protocols for the management, custody, and security of CD cabinet keys.",
    references:  [
      "Misuse of Drugs Act 1971",
      "Misuse of Drugs Regulations 2001 (as amended)",
      "Misuse of Drugs (Safe Custody) Regulations 1973",
      "GPhC Guidance on Controlled Drugs (2019)",
      "Medicines Act 1968 (as amended)",
      "Responsible Pharmacist Regulations 2008"
    ],
    relatedSOPs:  [
      "SOP-011",
      "SOP-094",
      "SOP-050"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-02-20"
  },
  {
    id:  66,
    code:  "SOP-066",
    title:  "CD Incident Reporting",
    category:  "CD",
    version:  "1.0",
    reviewDate:  "2026-08-01",
    status:  "Current",
    acked:  5,
    roles:  [
      "pharmacist",
      "manager",
      "superintendent"
    ],
    description:  "Defines the process for reporting Controlled Drug incidents including discrepancies, losses, thefts, and handling errors. CD incidents may have regulatory, criminal, and patient safety implications. Reporting must be prompt and thorough, following both internal and external reporting pathways. The superintendent pharmacist must be informed of all CD incidents regardless of severity.",
    keyPoints:  [
      "Report any CD discrepancy, loss, or suspected theft immediately to the superintendent",
      "Complete the internal incident report form with full details within 24 hours",
      "Notify the NHS England CD accountable officer for significant discrepancies or losses",
      "Contact the police if theft is suspected — preserve any evidence",
      "Record the incident in the CD register with a cross-reference to the incident report",
      "Conduct a root cause analysis for all CD incidents to identify systemic issues",
      "Implement corrective actions and monitor for recurrence",
      "Submit annual CD incident summary to the superintendent for governance review"
    ],
    scope:  "This SOP applies to all pharmacists, the Pharmacy Manager, the Superintendent Pharmacist at iPharmacy Direct. It covers all activities relating to cd incident reporting and must be read, understood, and acknowledged before undertaking any related duties. Defines the process for reporting Controlled Drug incidents including discrepancies, losses, thefts, and handling errors.",
    references:  [
      "Misuse of Drugs Act 1971",
      "Misuse of Drugs Regulations 2001 (as amended)",
      "Misuse of Drugs (Safe Custody) Regulations 1973",
      "GPhC Guidance on Controlled Drugs (2019)",
      "GPhC Standards for Registered Pharmacies, Principle 4",
      "NHS Terms of Service, Schedule 4"
    ],
    relatedSOPs:  [
      "SOP-027",
      "SOP-014",
      "SOP-064"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-05-31"
  },
  {
    id:  18,
    code:  "SOP-018",
    title:  "Clinical Checks & Interventions",
    category:  "Clinical",
    version:  "2.5",
    reviewDate:  "2026-10-20",
    status:  "Current",
    acked:  11,
    roles:  [
      "pharmacist"
    ],
    description:  "Describes the clinical screening process for all prescriptions, including when and how to intervene. Every prescription must be clinically checked before dispensing for appropriateness, safety, and efficacy. Interventions must be documented and communicated to the prescriber where a change is required. Complies with GPhC Standards for Pharmacy Professionals and NICE guidance on medicines optimisation.",
    keyPoints:  [
      "Screen every prescription for therapeutic appropriateness, dose, interactions, and duplications",
      "Check patient allergy status and medical history on the PMR before dispensing",
      "Assess renal and hepatic function implications where relevant information is available",
      "Document all clinical interventions with the issue identified, action taken, and outcome",
      "Contact the prescriber by phone for urgent interventions; use secure NHS mail for non-urgent",
      "Escalate unresolved clinical issues to a senior pharmacist or the superintendent",
      "Record intervention outcomes in the patient medication record for continuity",
      "Review intervention data monthly to identify trends and learning opportunities"
    ],
    scope:  "This SOP applies to all pharmacists at iPharmacy Direct. It covers all activities relating to clinical checks & interventions and must be read, understood, and acknowledged before undertaking any related duties. Describes the clinical screening process for all prescriptions, including when and how to intervene.",
    references:  [
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NICE Medicines Optimisation Guidelines",
      "British National Formulary (BNF)",
      "GPhC Standards for Registered Pharmacies (2018)",
      "NICE NG5: Medicines Optimisation (2015)",
      "GPhC Standards for Pharmacy Professionals, Standard 6"
    ],
    relatedSOPs:  [
      "SOP-019",
      "SOP-001",
      "SOP-027"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-05-19"
  },
  {
    id:  19,
    code:  "SOP-019",
    title:  "Drug Interaction Management",
    category:  "Clinical",
    version:  "1.8",
    reviewDate:  "2026-09-05",
    status:  "Current",
    acked:  8,
    roles:  [
      "pharmacist",
      "technician"
    ],
    description:  "Provides guidance on identifying, assessing, and managing clinically significant drug interactions. The PMR system generates interaction alerts which must be assessed for clinical significance. Not all flagged interactions require action, but the pharmacist must make a professional judgement for each. Applies to both prescription and OTC medicines and supplements.",
    keyPoints:  [
      "Use PMR system alerts, BNF Appendix 1, and Stockley's to identify potential interactions",
      "Assess clinical significance considering the patient's specific risk factors and conditions",
      "Differentiate between interactions requiring action and those that can be monitored",
      "Contact the prescriber with a clear recommendation if action is needed",
      "Document the interaction assessment and outcome in the patient medication record",
      "Consider OTC purchases and herbal supplements when assessing interactions",
      "Provide patient counselling on interactions where monitoring is the agreed action",
      "Review interaction alert settings on the PMR system periodically for accuracy"
    ],
    scope:  "This SOP applies to all pharmacists, pharmacy technicians at iPharmacy Direct. It covers all activities relating to drug interaction management and must be read, understood, and acknowledged before undertaking any related duties. Provides guidance on identifying, assessing, and managing clinically significant drug interactions.",
    references:  [
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NICE Medicines Optimisation Guidelines",
      "British National Formulary (BNF)",
      "GPhC Standards for Registered Pharmacies (2018)",
      "BNF Appendix 1: Interactions",
      "Stockley's Drug Interactions (online)"
    ],
    relatedSOPs:  [
      "SOP-018",
      "SOP-007",
      "SOP-024"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-06-04"
  },
  {
    id:  20,
    code:  "SOP-020",
    title:  "Fridge Temperature Monitoring",
    category:  "Clinical",
    version:  "3.1",
    reviewDate:  "2026-06-01",
    status:  "Current",
    acked:  13,
    roles:  [
      "all"
    ],
    description:  "Ensures fridge-stored medicines and vaccines are maintained within the required 2-8°C range through systematic daily monitoring. Temperature excursions can render medicines ineffective or dangerous. This SOP applies to all pharmaceutical fridges including the main dispensary fridge and any vaccine-specific fridges. Compliant with MHRA and Public Health England cold chain requirements.",
    keyPoints:  [
      "Record min, max, and current temperatures daily at the start of business",
      "Reset the min/max thermometer after each reading to track the next 24-hour period",
      "Investigate and report any out-of-range readings immediately to the pharmacist",
      "Quarantine affected stock and contact the manufacturer for stability guidance",
      "Do not store food, drink, or non-pharmaceutical items in medicine fridges",
      "Ensure the fridge is not overloaded and air can circulate around stock",
      "Calibrate or replace thermometers annually and keep calibration certificates",
      "Maintain temperature records for a minimum of 5 years for audit and inspection"
    ],
    scope:  "This SOP applies to all pharmacy staff at iPharmacy Direct. It covers all activities relating to fridge temperature monitoring and must be read, understood, and acknowledged before undertaking any related duties. Ensures fridge-stored medicines and vaccines are maintained within the required 2-8°C range through systematic daily monitoring.",
    references:  [
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NICE Medicines Optimisation Guidelines",
      "British National Formulary (BNF)",
      "GPhC Standards for Registered Pharmacies (2018)",
      "PHE Green Book: Immunisation Against Infectious Diseases",
      "NHS England Vaccination Standards"
    ],
    relatedSOPs:  [
      "SOP-021",
      "SOP-050",
      "SOP-127"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2024-12-01"
  },
  {
    id:  21,
    code:  "SOP-021",
    title:  "Vaccines & Cold Chain",
    category:  "Clinical",
    version:  "2.0",
    reviewDate:  "2026-05-15",
    status:  "Current",
    acked:  9,
    roles:  [
      "pharmacist",
      "technician"
    ],
    description:  "Covers vaccine storage, cold chain integrity, and preparation protocols for pharmacy vaccination services. Vaccines are biological products that are highly sensitive to temperature excursions. Maintaining an unbroken cold chain from delivery to administration is essential for efficacy. Follows PHE Green Book guidance and NHS England vaccination standards.",
    keyPoints:  [
      "Store vaccines in a dedicated pharmaceutical fridge at 2-8°C, away from the back wall and coils",
      "Check and record fridge temperatures twice daily during vaccination campaign periods",
      "Use a validated cool box with conditioned ice packs for any transport or temporary storage",
      "Dispose of any cold-chain-breached vaccines immediately and report to supplier for replacement",
      "Rotate vaccine stock using FEFO and check expiry dates before each administration session",
      "Maintain batch number and expiry records for every vaccine dose administered",
      "Report any cold chain failures to the superintendent and Public Health England if required",
      "Ensure all staff handling vaccines have completed cold chain management training"
    ],
    scope:  "This SOP applies to all pharmacists, pharmacy technicians at iPharmacy Direct. It covers all activities relating to vaccines & cold chain and must be read, understood, and acknowledged before undertaking any related duties. Covers vaccine storage, cold chain integrity, and preparation protocols for pharmacy vaccination services.",
    references:  [
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NICE Medicines Optimisation Guidelines",
      "British National Formulary (BNF)",
      "GPhC Standards for Registered Pharmacies (2018)",
      "PHE Green Book: Immunisation Against Infectious Diseases",
      "NHS England Vaccination Standards"
    ],
    relatedSOPs:  [
      "SOP-020",
      "SOP-070",
      "SOP-071"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-01-15"
  },
  {
    id:  22,
    code:  "SOP-022",
    title:  "Patient Group Directions (PGDs)",
    category:  "Clinical",
    version:  "1.4",
    reviewDate:  "2026-11-20",
    status:  "Current",
    acked:  7,
    roles:  [
      "pharmacist"
    ],
    description:  "Governs the use of Patient Group Directions for supplying specified medicines to patients meeting defined clinical criteria without an individual prescription. PGDs must be authorised, in-date, and signed by the pharmacist before use. Each supply must be clinically justified and fully documented. Follows NICE guidance on PGDs and NHS England commissioning specifications.",
    keyPoints:  [
      "Verify the PGD is in date, authorised by the commissioning body, and signed by the supplying pharmacist",
      "Confirm the patient meets all inclusion criteria listed in the PGD",
      "Check exclusion criteria and cautions — refer to a prescriber if the patient does not fit",
      "Record the supply in the PGD log with patient details, drug, dose, batch number, and expiry",
      "Provide appropriate patient counselling on the supplied medicine",
      "Report any adverse reactions via the MHRA Yellow Card scheme",
      "Store PGD documentation securely and review for updates annually",
      "Maintain a record of all pharmacists authorised to supply under each PGD"
    ],
    scope:  "This SOP applies to all pharmacists at iPharmacy Direct. It covers all activities relating to patient group directions (pgds) and must be read, understood, and acknowledged before undertaking any related duties. Governs the use of Patient Group Directions for supplying specified medicines to patients meeting defined clinical criteria without an individual prescription.",
    references:  [
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NICE Medicines Optimisation Guidelines",
      "British National Formulary (BNF)",
      "GPhC Standards for Registered Pharmacies (2018)",
      "NICE MPG2: Patient Group Directions (2017)",
      "MHRA PGD Guidance"
    ],
    relatedSOPs:  [
      "SOP-069",
      "SOP-023",
      "SOP-070"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-09-19"
  },
  {
    id:  23,
    code:  "SOP-023",
    title:  "Minor Ailments Service",
    category:  "Clinical",
    version:  "1.6",
    reviewDate:  "2026-08-25",
    status:  "Current",
    acked:  6,
    roles:  [
      "pharmacist"
    ],
    description:  "Sets out the consultation and supply process for treating minor ailments under NHS community pharmacy services. Enables patients to receive advice and treatment for common conditions without needing a GP appointment. The pharmacist must conduct a structured consultation, identify red flags, and make appropriate supply or referral decisions. Recorded on PharmOutcomes or equivalent NHS reporting platform.",
    keyPoints:  [
      "Conduct a structured consultation using the WWHAM or similar assessment framework",
      "Identify red-flag symptoms that require urgent referral to GP or A&E",
      "Check patient eligibility for the NHS minor ailments scheme and verify exemption status",
      "Supply appropriate OTC treatment at NHS expense where criteria are met",
      "Provide self-care advice and safety-netting information to the patient",
      "Record the consultation, assessment findings, and outcome on PharmOutcomes",
      "Refer to GP with a summary note if the condition is beyond the scope of the service",
      "Review service activity data quarterly to ensure appropriate use and identify trends"
    ],
    scope:  "This SOP applies to all pharmacists at iPharmacy Direct. It covers all activities relating to minor ailments service and must be read, understood, and acknowledged before undertaking any related duties. Sets out the consultation and supply process for treating minor ailments under NHS community pharmacy services.",
    references:  [
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NICE Medicines Optimisation Guidelines",
      "British National Formulary (BNF)",
      "GPhC Standards for Registered Pharmacies (2018)",
      "NHS England Minor Ailments Service Specification",
      "PSNC Minor Ailments Service Toolkit"
    ],
    relatedSOPs:  [
      "SOP-069",
      "SOP-024",
      "SOP-022"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-05-24"
  },
  {
    id:  24,
    code:  "SOP-024",
    title:  "Emergency Supply Procedure",
    category:  "Clinical",
    version:  "2.2",
    reviewDate:  "2026-03-10",
    status:  "Due Review",
    acked:  10,
    roles:  [
      "pharmacist"
    ],
    description:  "Defines when and how a pharmacist may make an emergency supply of a prescription-only medicine at the request of a patient. Emergency supplies are permitted under the Human Medicines Regulations 2012 when a patient has an immediate need and cannot obtain a prescription. The pharmacist must exercise professional judgement on the clinical necessity. Specific exclusions apply for Controlled Drugs (see SOP-016).",
    keyPoints:  [
      "Confirm the patient has previously been prescribed the medicine and has a genuine immediate need",
      "Verify that it is impracticable for the patient to obtain a prescription without undue delay",
      "Supply the smallest practicable quantity — maximum 30 days for most items, 5 days for antibiotics",
      "Controlled Drugs Schedule 2 and 3 are excluded from emergency supply at patient request",
      "Record the emergency supply in the POM register with patient details, drug, quantity, and reason",
      "Label the medicine clearly as \"Emergency Supply\" with standard dispensing label details",
      "Inform the patient they must see their prescriber to obtain a prescription as soon as possible",
      "Notify the prescriber of the emergency supply at the earliest opportunity"
    ],
    scope:  "This SOP applies to all pharmacists at iPharmacy Direct. It covers all activities relating to emergency supply procedure and must be read, understood, and acknowledged before undertaking any related duties. Defines when and how a pharmacist may make an emergency supply of a prescription-only medicine at the request of a patient.",
    references:  [
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NICE Medicines Optimisation Guidelines",
      "British National Formulary (BNF)",
      "GPhC Standards for Registered Pharmacies (2018)",
      "Human Medicines Regulations 2012, Part 10",
      "RPS Emergency Supply Guidance"
    ],
    relatedSOPs:  [
      "SOP-016",
      "SOP-001",
      "SOP-060"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2024-11-10"
  },
  {
    id:  25,
    code:  "SOP-025",
    title:  "Safeguarding Vulnerable Adults & Children",
    category:  "Clinical",
    version:  "1.9",
    reviewDate:  "2026-02-20",
    status:  "Overdue",
    acked:  5,
    roles:  [
      "all"
    ],
    description:  "Outlines staff responsibilities for recognising and reporting safeguarding concerns for children and vulnerable adults. Pharmacy teams are in a unique position to identify signs of abuse, neglect, and exploitation through regular patient contact. All staff have a legal and professional duty to act on safeguarding concerns. Follows the Care Act 2014, Children Act 2004, and local safeguarding board procedures.",
    keyPoints:  [
      "Know the signs and indicators of abuse, neglect, exploitation, and modern slavery",
      "Follow local safeguarding referral pathways — contact details are displayed in the dispensary",
      "Record concerns factually and confidentially, avoiding speculation or judgement",
      "Never confront the suspected perpetrator or investigate independently",
      "Report concerns to the pharmacy safeguarding lead (superintendent) immediately",
      "Complete mandatory safeguarding training (Level 2) annually — all staff",
      "Maintain awareness of vulnerable patients including those with repeat high-risk prescriptions",
      "Cooperate fully with any multi-agency safeguarding investigation"
    ],
    scope:  "This SOP applies to all pharmacy staff at iPharmacy Direct. It covers all activities relating to safeguarding vulnerable adults & children and must be read, understood, and acknowledged before undertaking any related duties. Outlines staff responsibilities for recognising and reporting safeguarding concerns for children and vulnerable adults.",
    references:  [
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NICE Medicines Optimisation Guidelines",
      "British National Formulary (BNF)",
      "GPhC Standards for Registered Pharmacies (2018)",
      "Care Act 2014",
      "Children Act 2004"
    ],
    relatedSOPs:  [
      "SOP-089",
      "SOP-131",
      "SOP-028"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2024-11-20"
  },
  {
    id:  67,
    code:  "SOP-067",
    title:  "Anticoagulant Monitoring Service",
    category:  "Clinical",
    version:  "1.0",
    reviewDate:  "2026-07-10",
    status:  "Current",
    acked:  4,
    roles:  [
      "pharmacist"
    ],
    description:  "Governs the pharmacy-based anticoagulant monitoring service, including INR testing and warfarin dose adjustment. Patients on warfarin require regular monitoring to maintain their INR within the target therapeutic range. Pharmacists providing this service must have completed accredited training and work under a PGD or patient-specific direction. Follows NICE CG180 and local anticoagulation service specifications.",
    keyPoints:  [
      "Only pharmacists with accredited anticoagulant management training may provide this service",
      "Test INR using the approved point-of-care device following the manufacturer protocol",
      "Adjust warfarin dose according to the agreed dosing algorithm and target INR range",
      "Record the INR result, dose adjustment, and next test date in the patient anticoagulant booklet",
      "Refer to the anticoagulation clinic or GP for INR values outside the safe adjustment range",
      "Report any adverse events including bleeding or thrombotic episodes immediately",
      "Maintain and calibrate the point-of-care testing device per manufacturer schedule",
      "Submit service activity data to the commissioner as required by the service specification"
    ],
    scope:  "This SOP applies to all pharmacists at iPharmacy Direct. It covers all activities relating to anticoagulant monitoring service and must be read, understood, and acknowledged before undertaking any related duties. Governs the pharmacy-based anticoagulant monitoring service, including INR testing and warfarin dose adjustment.",
    references:  [
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NICE Medicines Optimisation Guidelines",
      "British National Formulary (BNF)",
      "GPhC Standards for Registered Pharmacies (2018)",
      "NICE CG180: Atrial Fibrillation Management",
      "NPSA Anticoagulant Safety Alert"
    ],
    relatedSOPs:  [
      "SOP-018",
      "SOP-022",
      "SOP-072"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-05-09"
  },
  {
    id:  68,
    code:  "SOP-068",
    title:  "New Medicine Service (NMS) Clinical Protocol",
    category:  "Clinical",
    version:  "2.1",
    reviewDate:  "2026-09-15",
    status:  "Current",
    acked:  9,
    roles:  [
      "pharmacist"
    ],
    description:  "Defines the clinical protocol for delivering the New Medicine Service, an NHS Advanced Service. NMS supports patients newly prescribed medicines for specific long-term conditions through structured follow-up consultations. The service aims to improve adherence, reduce waste, and identify problems early. Follows NHS England NMS service specification and PSNC guidance.",
    keyPoints:  [
      "Identify eligible patients at the point of dispensing a new medicine in the target condition groups",
      "Conduct the intervention consultation 7-14 days after dispensing to assess adherence and issues",
      "Complete the follow-up consultation 14-21 days after the intervention to review progress",
      "Assess and address any problems with side effects, understanding, or adherence barriers",
      "Record all consultations on the PMR and submit claims via the NHS BSA portal",
      "Refer to the prescriber if medicine changes are needed following assessment",
      "Provide the patient with written information about their new medicine",
      "Review NMS completion rates monthly and target eligible patients proactively"
    ],
    scope:  "This SOP applies to all pharmacists at iPharmacy Direct. It covers all activities relating to new medicine service (nms) clinical protocol and must be read, understood, and acknowledged before undertaking any related duties. Defines the clinical protocol for delivering the New Medicine Service, an NHS Advanced Service.",
    references:  [
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NICE Medicines Optimisation Guidelines",
      "British National Formulary (BNF)",
      "GPhC Standards for Registered Pharmacies (2018)",
      "NHS England NMS Service Specification",
      "PSNC NMS Toolkit"
    ],
    relatedSOPs:  [
      "SOP-108",
      "SOP-007",
      "SOP-018"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-05-14"
  },
  {
    id:  69,
    code:  "SOP-069",
    title:  "Pharmacy First Clinical Pathways",
    category:  "Clinical",
    version:  "1.5",
    reviewDate:  "2026-06-20",
    status:  "Current",
    acked:  7,
    roles:  [
      "pharmacist"
    ],
    description:  "Covers the clinical assessment and prescribing pathways under the Pharmacy First service for seven common conditions. Pharmacists can now supply prescription-only medicines for specified conditions including UTI, shingles, impetigo, infected insect bites, sinusitis, sore throat, and acute otitis media. Each pathway has specific inclusion/exclusion criteria and treatment protocols. Follows NHS England Pharmacy First service specification.",
    keyPoints:  [
      "Conduct a thorough clinical assessment for each presenting condition using the approved pathway",
      "Verify the patient meets all inclusion criteria and has no exclusion criteria for the pathway",
      "Supply the specified POM treatment where clinically indicated using the clinical pathway PGD",
      "Provide safety-netting advice and specify when the patient should seek further medical help",
      "Record the full consultation on the NHS-approved clinical system (e.g. PharmOutcomes)",
      "Refer patients who do not meet pathway criteria to their GP with a referral note",
      "Submit service claims through the NHS BSA portal within the specified timeframe",
      "Maintain clinical competency through annual Pharmacy First training updates"
    ],
    scope:  "This SOP applies to all pharmacists at iPharmacy Direct. It covers all activities relating to pharmacy first clinical pathways and must be read, understood, and acknowledged before undertaking any related duties. Covers the clinical assessment and prescribing pathways under the Pharmacy First service for seven common conditions.",
    references:  [
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NICE Medicines Optimisation Guidelines",
      "British National Formulary (BNF)",
      "GPhC Standards for Registered Pharmacies (2018)",
      "Equality Act 2010",
      "EHRC Code of Practice on Employment"
    ],
    relatedSOPs:  [
      "SOP-112",
      "SOP-023",
      "SOP-022"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-03-20"
  },
  {
    id:  70,
    code:  "SOP-070",
    title:  "Seasonal Flu Vaccination",
    category:  "Clinical",
    version:  "2.3",
    reviewDate:  "2026-04-01",
    status:  "Due Review",
    acked:  11,
    roles:  [
      "pharmacist"
    ],
    description:  "Details the clinical and operational protocol for delivering the NHS seasonal flu vaccination service. This is an NHS Advanced Service commissioned annually for eligible patient groups. The pharmacist must be trained in vaccination technique, anaphylaxis management, and cold chain handling. Follows PHE Green Book Chapter 19 and NHS England flu vaccination service specification.",
    keyPoints:  [
      "Verify patient eligibility against the current season's NHS eligible groups list",
      "Screen for contraindications including egg allergy, previous anaphylaxis, and immunosuppression",
      "Obtain informed consent and record in the patient's vaccination record",
      "Administer the vaccine using correct technique (IM injection, deltoid muscle)",
      "Observe the patient for at least 15 minutes post-vaccination for adverse reactions",
      "Record batch number, expiry, injection site, and administering pharmacist on the PMR and PharmOutcomes",
      "Submit vaccination data to the GP via secure electronic notification within 24 hours",
      "Maintain anaphylaxis kit within expiry and accessible in the consultation room at all times"
    ],
    scope:  "This SOP applies to all pharmacists at iPharmacy Direct. It covers all activities relating to seasonal flu vaccination and must be read, understood, and acknowledged before undertaking any related duties. Details the clinical and operational protocol for delivering the NHS seasonal flu vaccination service.",
    references:  [
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NICE Medicines Optimisation Guidelines",
      "British National Formulary (BNF)",
      "GPhC Standards for Registered Pharmacies (2018)",
      "PHE Green Book: Immunisation Against Infectious Diseases",
      "NHS England Vaccination Standards"
    ],
    relatedSOPs:  [
      "SOP-021",
      "SOP-113",
      "SOP-022"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2024-12-01"
  },
  {
    id:  71,
    code:  "SOP-071",
    title:  "COVID-19 Vaccination",
    category:  "Clinical",
    version:  "3.0",
    reviewDate:  "2026-03-25",
    status:  "Due Review",
    acked:  10,
    roles:  [
      "pharmacist"
    ],
    description:  "Covers the clinical and operational procedures for administering COVID-19 vaccinations under NHS England commissioning. Includes patient eligibility checking, consent, administration, adverse reaction monitoring, and reporting. The pharmacy must meet all site requirements specified by NHS England. Follows JCVI guidance, PHE Green Book Chapter 14a, and NHS England COVID-19 vaccination SOP.",
    keyPoints:  [
      "Check patient eligibility against current JCVI cohort recommendations and booking system",
      "Screen for contraindications and previous adverse reactions to COVID-19 vaccines",
      "Obtain informed consent after providing the approved patient information leaflet",
      "Prepare and administer the vaccine following the exact manufacturer dilution and administration instructions",
      "Observe patients for 15 minutes (30 minutes if history of anaphylaxis to any vaccine)",
      "Record vaccination on the National Immunisation Management System (NIMS) within 24 hours",
      "Report any adverse reactions via the Yellow Card scheme immediately",
      "Maintain cold chain documentation and vaccine wastage records for each session"
    ],
    scope:  "This SOP applies to all pharmacists at iPharmacy Direct. It covers all activities relating to covid-19 vaccination and must be read, understood, and acknowledged before undertaking any related duties. Covers the clinical and operational procedures for administering COVID-19 vaccinations under NHS England commissioning.",
    references:  [
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NICE Medicines Optimisation Guidelines",
      "British National Formulary (BNF)",
      "GPhC Standards for Registered Pharmacies (2018)",
      "PHE Green Book: Immunisation Against Infectious Diseases",
      "NHS England Vaccination Standards"
    ],
    relatedSOPs:  [
      "SOP-021",
      "SOP-070",
      "SOP-022"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2024-09-24"
  },
  {
    id:  72,
    code:  "SOP-072",
    title:  "Blood Pressure Monitoring & Hypertension Case-Finding",
    category:  "Clinical",
    version:  "1.2",
    reviewDate:  "2026-11-01",
    status:  "Current",
    acked:  6,
    roles:  [
      "pharmacist",
      "technician"
    ],
    description:  "Defines the protocol for the NHS Hypertension Case-Finding Advanced Service, including clinic and ambulatory blood pressure monitoring. Community pharmacies identify patients with undiagnosed hypertension through opportunistic and targeted screening. Positive findings are referred to the GP for diagnosis and treatment initiation. Follows NICE NG136 guidance on hypertension and NHS England service specification.",
    keyPoints:  [
      "Offer blood pressure checks to eligible adults as per the NHS service specification",
      "Use a validated, calibrated blood pressure monitor with an appropriate cuff size",
      "Take readings according to NICE guidelines: seated, rested for 5 minutes, two readings per arm",
      "Record readings and classify as normal, raised, or high according to NICE thresholds",
      "Offer ABPM (24-hour monitoring) to patients with clinic readings of 140/90 mmHg or above",
      "Refer patients with confirmed raised readings to their GP with a clinical summary",
      "Submit service activity data and claims through NHS BSA within the specified timeframe",
      "Maintain and calibrate blood pressure equipment annually per manufacturer instructions"
    ],
    scope:  "This SOP applies to all pharmacists, pharmacy technicians at iPharmacy Direct. It covers all activities relating to blood pressure monitoring & hypertension case-finding and must be read, understood, and acknowledged before undertaking any related duties. Defines the protocol for the NHS Hypertension Case-Finding Advanced Service, including clinic and ambulatory blood pressure monitoring.",
    references:  [
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NICE Medicines Optimisation Guidelines",
      "British National Formulary (BNF)",
      "GPhC Standards for Registered Pharmacies (2018)",
      "NICE NG136: Hypertension in Adults (2019)",
      "NHS England Hypertension Case-Finding Service Specification"
    ],
    relatedSOPs:  [
      "SOP-110",
      "SOP-067",
      "SOP-018"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-08-31"
  },
  {
    id:  73,
    code:  "SOP-073",
    title:  "Smoking Cessation Clinical Support",
    category:  "Clinical",
    version:  "1.4",
    reviewDate:  "2026-05-30",
    status:  "Current",
    acked:  5,
    roles:  [
      "pharmacist"
    ],
    description:  "Outlines the pharmacy's clinical approach to supporting patients who wish to stop smoking. Includes behavioural support, NRT supply, and referral pathways for prescription-only cessation aids. Pharmacists play a key role in motivating quit attempts and providing ongoing support. Follows NICE PH10 guidance and local stop smoking service commissioning arrangements.",
    keyPoints:  [
      "Assess the patient's readiness to quit and previous quit attempt history",
      "Discuss and agree the most appropriate cessation method (NRT, varenicline referral, behavioural support)",
      "Supply NRT products under PGD or OTC sale with appropriate counselling on use",
      "Provide structured behavioural support including setting a quit date and coping strategies",
      "Schedule follow-up appointments at 1, 2, 4, and 12 weeks post-quit date",
      "Record carbon monoxide readings at each follow-up to validate quit status",
      "Refer to the local stop smoking service or GP for patients requiring prescription-only treatments",
      "Submit service activity and quit outcome data to the commissioner as required"
    ],
    scope:  "This SOP applies to all pharmacists at iPharmacy Direct. It covers all activities relating to smoking cessation clinical support and must be read, understood, and acknowledged before undertaking any related duties. Outlines the pharmacy's clinical approach to supporting patients who wish to stop smoking.",
    references:  [
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NICE Medicines Optimisation Guidelines",
      "British National Formulary (BNF)",
      "GPhC Standards for Registered Pharmacies (2018)",
      "NICE PH10: Stop Smoking Services",
      "NHS England Smoking Cessation Service Specification"
    ],
    relatedSOPs:  [
      "SOP-115",
      "SOP-007",
      "SOP-022"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-03-30"
  },
  {
    id:  74,
    code:  "SOP-074",
    title:  "Palliative Care Dispensing",
    category:  "Clinical",
    version:  "1.1",
    reviewDate:  "2026-10-10",
    status:  "Current",
    acked:  4,
    roles:  [
      "pharmacist"
    ],
    description:  "Covers the specific dispensing and stock management considerations for palliative care medicines. Pharmacies designated as palliative care stock-holding sites must maintain agreed minimum stock levels of essential end-of-life medicines. Prompt dispensing is critical as patients may be in acute distress. Follows local palliative care formulary and NHS England end-of-life care guidance.",
    keyPoints:  [
      "Maintain agreed minimum stock levels of palliative care medicines as per the local formulary",
      "Prioritise dispensing of palliative care prescriptions to minimise patient and carer waiting time",
      "Provide out-of-hours contact information if the pharmacy participates in the palliative care network",
      "Counsel carers on the correct administration of syringe driver medicines and breakthrough doses",
      "Ensure CD elements of palliative care prescriptions are handled under the standard CD SOPs",
      "Liaise with the palliative care team or district nurses for any clinical queries",
      "Record all palliative care dispensing activity for service reporting purposes",
      "Review and reorder palliative care stock weekly to maintain formulary minimum levels"
    ],
    scope:  "This SOP applies to all pharmacists at iPharmacy Direct. It covers all activities relating to palliative care dispensing and must be read, understood, and acknowledged before undertaking any related duties. Covers the specific dispensing and stock management considerations for palliative care medicines.",
    references:  [
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NICE Medicines Optimisation Guidelines",
      "British National Formulary (BNF)",
      "GPhC Standards for Registered Pharmacies (2018)",
      "NICE NG31: Care of Dying Adults in the Last Days of Life",
      "NHS England Palliative Care Guidance for Community Pharmacy"
    ],
    relatedSOPs:  [
      "SOP-018",
      "SOP-011",
      "SOP-096"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-08-09"
  },
  {
    id:  75,
    code:  "SOP-075",
    title:  "Substance Misuse Service",
    category:  "Clinical",
    version:  "1.8",
    reviewDate:  "2026-08-20",
    status:  "Current",
    acked:  5,
    roles:  [
      "pharmacist",
      "technician"
    ],
    description:  "Covers the pharmacy's role in supporting patients with substance misuse disorders, including needle exchange and supervised consumption. The pharmacy provides a frontline harm-reduction service in partnership with local drug and alcohol services. Confidentiality and non-judgemental care are essential. Follows PHE guidance on pharmacy-based needle exchange and supervised consumption.",
    keyPoints:  [
      "Provide needle exchange supplies in a discreet, non-judgemental manner",
      "Supply clean injecting equipment packs and sharps disposal bins per the service agreement",
      "Collect returned sharps bins safely using appropriate PPE and dispose via clinical waste",
      "Deliver supervised consumption per SOP-009 for all methadone and buprenorphine patients",
      "Record all needle exchange transactions in the service log (packs out, returns in)",
      "Signpost patients to local drug and alcohol treatment services and harm reduction information",
      "Maintain sharps injury protocol awareness for all staff handling returned equipment",
      "Submit service activity data to the commissioner monthly"
    ],
    scope:  "This SOP applies to all pharmacists, pharmacy technicians at iPharmacy Direct. It covers all activities relating to substance misuse service and must be read, understood, and acknowledged before undertaking any related duties. Covers the pharmacy's role in supporting patients with substance misuse disorders, including needle exchange and supervised consumption.",
    references:  [
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NICE Medicines Optimisation Guidelines",
      "British National Formulary (BNF)",
      "GPhC Standards for Registered Pharmacies (2018)",
      "Drug Misuse and Dependence: UK Guidelines on Clinical Management (2017)",
      "PHE Guidance on Pharmacy-Based Supervised Consumption"
    ],
    relatedSOPs:  [
      "SOP-009",
      "SOP-059",
      "SOP-025"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-05-19"
  },
  {
    id:  26,
    code:  "SOP-026",
    title:  "Responsible Pharmacist (RP) Register",
    category:  "Governance",
    version:  "2.0",
    reviewDate:  "2026-12-15",
    status:  "Current",
    acked:  12,
    roles:  [
      "pharmacist",
      "manager"
    ],
    description:  "Covers the legal requirement to maintain the Responsible Pharmacist register, including sign-on/off times and absence protocols. The RP register is a legal document required under the Medicines Act 1968 and the Responsible Pharmacist Regulations 2008. The RP has personal responsibility for the safe and effective running of the pharmacy. Failure to maintain the register is a criminal offence.",
    keyPoints:  [
      "RP must sign in to the register before the pharmacy opens to the public",
      "Record the exact time of sign-on, sign-off, and any RP changes during the day",
      "Display the RP notice clearly visible to the public at all times",
      "The pharmacy must not operate without a signed-in RP during opening hours",
      "RP may be absent for up to 2 hours in exceptional circumstances with appropriate safeguards",
      "Record absence periods in the register with reason and safeguards in place",
      "Retain RP register records for a minimum of 5 years",
      "The superintendent must audit RP register compliance at least annually"
    ],
    scope:  "This SOP applies to all pharmacists, the Pharmacy Manager at iPharmacy Direct. It covers all activities relating to responsible pharmacist (rp) register and must be read, understood, and acknowledged before undertaking any related duties. Covers the legal requirement to maintain the Responsible Pharmacist register, including sign-on/off times and absence protocols.",
    references:  [
      "GPhC Standards for Registered Pharmacies (2018)",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "Care Quality Commission (Registration) Regulations 2009",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "Employment Rights Act 1996",
      "ACAS Managing Attendance and Employee Turnover"
    ],
    relatedSOPs:  [
      "SOP-050",
      "SOP-030",
      "SOP-077"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-08-14"
  },
  {
    id:  27,
    code:  "SOP-027",
    title:  "Near Miss & Error Reporting",
    category:  "Governance",
    version:  "2.3",
    reviewDate:  "2026-07-30",
    status:  "Current",
    acked:  11,
    roles:  [
      "all"
    ],
    description:  "Establishes a blame-free reporting culture for near misses and dispensing errors to improve patient safety. Reporting enables the identification of systemic issues and contributes to continuous improvement. All staff are encouraged and expected to report without fear of punitive action. Follows GPhC guidance on patient safety and the NHS Patient Safety Strategy.",
    keyPoints:  [
      "Report all near misses and dispensing errors promptly using the pharmacy reporting system",
      "Classify each report by type, contributing factors, severity, and stage at which it was caught",
      "Near misses caught before reaching the patient are learning opportunities — not disciplinary matters",
      "Errors that reach the patient must be reported to the patient, prescriber, and superintendent",
      "Review reports monthly to identify trends, root causes, and systemic issues",
      "Share learning with the whole team in regular safety briefings or team meetings",
      "Implement corrective actions for recurring issues and monitor effectiveness",
      "Submit reportable incidents to the NRLS (National Reporting and Learning System) as required"
    ],
    scope:  "This SOP applies to all pharmacy staff at iPharmacy Direct. It covers all activities relating to near miss & error reporting and must be read, understood, and acknowledged before undertaking any related duties. Establishes a blame-free reporting culture for near misses and dispensing errors to improve patient safety.",
    references:  [
      "GPhC Standards for Registered Pharmacies (2018)",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "Care Quality Commission (Registration) Regulations 2009",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "NHS England Patient Safety Strategy (2019)",
      "National Reporting and Learning System (NRLS) Guidance"
    ],
    relatedSOPs:  [
      "SOP-066",
      "SOP-006",
      "SOP-077"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-03-30"
  },
  {
    id:  28,
    code:  "SOP-028",
    title:  "GDPR & Data Protection",
    category:  "Governance",
    version:  "3.0",
    reviewDate:  "2026-12-01",
    status:  "Current",
    acked:  12,
    roles:  [
      "all"
    ],
    description:  "Ensures all staff handle patient and business data in compliance with UK GDPR and the Data Protection Act 2018. The pharmacy is a data controller for patient information and must meet all obligations under data protection law. Breaches can result in significant fines, reputational damage, and regulatory action. All staff receive data protection training at induction and annually.",
    keyPoints:  [
      "Only access patient data when you have a legitimate need to know for your role",
      "Store paper records securely in locked cabinets and dispose via confidential waste",
      "Never share patient data verbally, electronically, or in writing without lawful basis",
      "Report any actual or suspected data breach to the Data Protection Officer within 24 hours",
      "Use secure NHS mail for electronic patient communications — never personal email",
      "Ensure computer screens displaying patient data are not visible to the public",
      "Respond to Subject Access Requests within 30 days in accordance with the process",
      "Complete mandatory GDPR training annually and retain completion certificates"
    ],
    scope:  "This SOP applies to all pharmacy staff at iPharmacy Direct. It covers all activities relating to gdpr & data protection and must be read, understood, and acknowledged before undertaking any related duties. Ensures all staff handle patient and business data in compliance with UK GDPR and the Data Protection Act 2018.",
    references:  [
      "GPhC Standards for Registered Pharmacies (2018)",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "Care Quality Commission (Registration) Regulations 2009",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "UK GDPR (Regulation (EU) 2016/679 as retained)",
      "ICO Guide to the UK GDPR"
    ],
    relatedSOPs:  [
      "SOP-130",
      "SOP-047",
      "SOP-104"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-05-31"
  },
  {
    id:  29,
    code:  "SOP-029",
    title:  "Complaints Handling",
    category:  "Governance",
    version:  "1.5",
    reviewDate:  "2026-04-20",
    status:  "Due Review",
    acked:  8,
    roles:  [
      "pharmacist",
      "manager",
      "superintendent"
    ],
    description:  "Sets out the process for receiving, investigating, and resolving patient complaints in a timely and professional manner. Complaints are opportunities to improve service quality and patient experience. The pharmacy must have a documented complaints procedure accessible to all patients. Complies with GPhC Standards, NHS complaints regulations, and CQC expectations.",
    keyPoints:  [
      "Acknowledge all complaints within 3 working days, verbally or in writing",
      "Record complaint details including date, complainant, nature, and desired outcome",
      "Investigate thoroughly, gathering statements from relevant staff and reviewing records",
      "Respond with a resolution or detailed explanation within 20 working days",
      "Escalate to the superintendent if the complaint involves clinical harm or serious concerns",
      "Offer the patient the right to escalate to the GPhC or Parliamentary and Health Service Ombudsman",
      "Maintain a complaints log and review trends quarterly at governance meetings",
      "Use complaint outcomes to drive service improvements and update SOPs where appropriate"
    ],
    scope:  "This SOP applies to all pharmacists, the Pharmacy Manager, the Superintendent Pharmacist at iPharmacy Direct. It covers all activities relating to complaints handling and must be read, understood, and acknowledged before undertaking any related duties. Sets out the process for receiving, investigating, and resolving patient complaints in a timely and professional manner.",
    references:  [
      "GPhC Standards for Registered Pharmacies (2018)",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "Care Quality Commission (Registration) Regulations 2009",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "CQC Registration Regulations 2009",
      "CQC Key Lines of Enquiry Framework"
    ],
    relatedSOPs:  [
      "SOP-027",
      "SOP-030",
      "SOP-078"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-01-20"
  },
  {
    id:  30,
    code:  "SOP-030",
    title:  "Fitness to Practise & Professional Standards",
    category:  "Governance",
    version:  "1.2",
    reviewDate:  "2026-10-10",
    status:  "Current",
    acked:  4,
    roles:  [
      "pharmacist",
      "superintendent"
    ],
    description:  "Outlines the standards of professional conduct expected of all registered pharmacy professionals and the process for addressing fitness-to-practise concerns. All GPhC registrants must meet the Standards for Pharmacy Professionals at all times. Concerns about impairment, misconduct, or poor performance must be addressed promptly. The superintendent has a duty to act on any fitness-to-practise concerns.",
    keyPoints:  [
      "All GPhC registrants must meet the nine Standards for Pharmacy Professionals at all times",
      "Report concerns about impairment, misconduct, or poor performance to the superintendent",
      "Maintain professional indemnity insurance cover appropriate to your role and activities",
      "Cooperate fully with any GPhC fitness-to-practise investigation or inspection",
      "Self-declare any health conditions, cautions, or convictions that may affect fitness to practise",
      "Support colleagues who raise concerns — retaliation is unacceptable and may constitute misconduct",
      "The superintendent must report serious fitness-to-practise concerns to the GPhC",
      "Review professional standards compliance during annual appraisals for all registered staff"
    ],
    scope:  "This SOP applies to all pharmacists, the Superintendent Pharmacist at iPharmacy Direct. It covers all activities relating to fitness to practise & professional standards and must be read, understood, and acknowledged before undertaking any related duties. Outlines the standards of professional conduct expected of all registered pharmacy professionals and the process for addressing fitness-to-practise concerns.",
    references:  [
      "GPhC Standards for Registered Pharmacies (2018)",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "Care Quality Commission (Registration) Regulations 2009",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "Pharmacy Order 2010",
      "GPhC Fitness to Practise Annual Reports"
    ],
    relatedSOPs:  [
      "SOP-081",
      "SOP-042",
      "SOP-031"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-08-09"
  },
  {
    id:  31,
    code:  "SOP-031",
    title:  "Whistleblowing Policy",
    category:  "Governance",
    version:  "1.0",
    reviewDate:  "2026-11-05",
    status:  "Current",
    acked:  9,
    roles:  [
      "all"
    ],
    description:  "Provides a safe, confidential mechanism for staff to raise concerns about unsafe, unethical, or illegal practices within the pharmacy. Whistleblowers are legally protected under the Public Interest Disclosure Act 1998. The pharmacy encourages open reporting and will not tolerate retaliation against anyone raising genuine concerns. Applies to all staff regardless of role or employment status.",
    keyPoints:  [
      "Raise concerns with your line manager or the superintendent as the first step",
      "If the concern involves your manager, escalate directly to the superintendent or owner",
      "If internal routes are exhausted or inappropriate, escalate to the GPhC, CQC, or NHS England",
      "All concerns will be investigated promptly and confidentially",
      "Whistleblowers are legally protected from dismissal or detriment under PIDA 1998",
      "Anonymous reporting is accepted but may limit the ability to investigate fully",
      "The outcome of the investigation will be communicated to the reporter where possible",
      "Maintain a confidential log of all whistleblowing reports and their outcomes"
    ],
    scope:  "This SOP applies to all pharmacy staff at iPharmacy Direct. It covers all activities relating to whistleblowing policy and must be read, understood, and acknowledged before undertaking any related duties. Provides a safe, confidential mechanism for staff to raise concerns about unsafe, unethical, or illegal practices within the pharmacy.",
    references:  [
      "GPhC Standards for Registered Pharmacies (2018)",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "Care Quality Commission (Registration) Regulations 2009",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "Safeguarding Vulnerable Groups Act 2006",
      "DBS Filtering Rules Guidance"
    ],
    relatedSOPs:  [
      "SOP-029",
      "SOP-030",
      "SOP-088"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-09-04"
  },
  {
    id:  32,
    code:  "SOP-032",
    title:  "Annual Self-Assessment (GPhC)",
    category:  "Governance",
    version:  "2.1",
    reviewDate:  "2026-01-31",
    status:  "Overdue",
    acked:  3,
    roles:  [
      "superintendent",
      "manager"
    ],
    description:  "Describes the annual process for completing the GPhC pharmacy premises self-assessment and developing action plans for identified gaps. The GPhC requires every registered pharmacy to complete a self-assessment against their five principles annually. Honest and thorough assessment is essential for maintaining registration. Evidence must be retained to support the assessment findings.",
    keyPoints:  [
      "Complete the self-assessment against all five GPhC principles before the annual deadline",
      "Involve the whole pharmacy team in the assessment process for a comprehensive view",
      "Identify gaps between current practice and the required standards",
      "Create a prioritised improvement action plan with responsible owners and target dates",
      "Superintendent to review, approve, and submit the self-assessment by the deadline",
      "Retain supporting evidence (SOPs, training records, audit results) for at least 3 years",
      "Track action plan progress at monthly governance meetings",
      "Use self-assessment findings to inform the annual training plan and SOP review schedule"
    ],
    scope:  "This SOP applies to the Superintendent Pharmacist, the Pharmacy Manager at iPharmacy Direct. It covers all activities relating to annual self-assessment (gphc) and must be read, understood, and acknowledged before undertaking any related duties. Describes the annual process for completing the GPhC pharmacy premises self-assessment and developing action plans for identified gaps.",
    references:  [
      "GPhC Standards for Registered Pharmacies (2018)",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "Care Quality Commission (Registration) Regulations 2009",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "GPhC Standards for Registered Pharmacies, Principle 4",
      "Workplace (Health, Safety and Welfare) Regulations 1992"
    ],
    relatedSOPs:  [
      "SOP-078",
      "SOP-077",
      "SOP-076"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2024-09-30"
  },
  {
    id:  33,
    code:  "SOP-033",
    title:  "Distance Selling Compliance",
    category:  "Governance",
    version:  "1.3",
    reviewDate:  "2026-09-20",
    status:  "Current",
    acked:  7,
    roles:  [
      "pharmacist",
      "manager",
      "dispenser"
    ],
    description:  "Ensures the pharmacy meets all regulatory requirements for any distance selling or internet pharmacy services. Distance selling pharmacies must comply with additional GPhC requirements including displaying the EU common logo. Patient safety must be maintained to the same standard as face-to-face services. Applies if the pharmacy accepts orders by phone, post, or online.",
    keyPoints:  [
      "Display the EU common distance selling logo on all online pharmacy pages",
      "Verify patient identity before dispensing any distance-selling orders",
      "Maintain a full audit trail for all online or telephone consultations",
      "Ensure the delivery service maintains medicine integrity and patient confidentiality",
      "Provide a pharmacist consultation for all POM supplies, including via video or telephone",
      "Comply with all standard dispensing SOPs for distance-selling prescriptions",
      "Display the GPhC registration number and superintendent details prominently online",
      "Review distance selling compliance against GPhC internet pharmacy standards annually"
    ],
    scope:  "This SOP applies to all pharmacists, the Pharmacy Manager, dispensers at iPharmacy Direct. It covers all activities relating to distance selling compliance and must be read, understood, and acknowledged before undertaking any related duties. Ensures the pharmacy meets all regulatory requirements for any distance selling or internet pharmacy services.",
    references:  [
      "GPhC Standards for Registered Pharmacies (2018)",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "Care Quality Commission (Registration) Regulations 2009",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "GPhC Guidance for Internet Pharmacies (2019)",
      "EU Falsified Medicines Directive 2011/62/EU (as retained)"
    ],
    relatedSOPs:  [
      "SOP-122",
      "SOP-126",
      "SOP-028"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-07-19"
  },
  {
    id:  76,
    code:  "SOP-076",
    title:  "SOP Management & Review",
    category:  "Governance",
    version:  "1.0",
    reviewDate:  "2026-06-15",
    status:  "Current",
    acked:  10,
    roles:  [
      "superintendent",
      "manager"
    ],
    description:  "Defines the lifecycle management process for all Standard Operating Procedures, including creation, approval, distribution, review, and retirement. SOPs are living documents that must reflect current practice and regulatory requirements. The superintendent pharmacist is responsible for ensuring all SOPs are current and effective. Follows GPhC premises standards and NHS England governance requirements.",
    keyPoints:  [
      "New SOPs must be drafted, reviewed, and approved by the superintendent before issue",
      "Assign a unique SOP code, version number, and review date to every procedure",
      "Distribute new or updated SOPs to all affected staff with acknowledgement tracking",
      "Review all SOPs at least annually or when regulations, practice, or incidents require changes",
      "Retire obsolete SOPs formally — remove from active circulation and archive",
      "Maintain a master SOP register listing all current SOPs with their review dates",
      "Staff must read and acknowledge understanding of all SOPs relevant to their role",
      "Audit SOP compliance at least annually as part of the governance programme"
    ],
    scope:  "This SOP applies to the Superintendent Pharmacist, the Pharmacy Manager at iPharmacy Direct. It covers all activities relating to sop management & review and must be read, understood, and acknowledged before undertaking any related duties. Defines the lifecycle management process for all Standard Operating Procedures, including creation, approval, distribution, review, and retirement.",
    references:  [
      "GPhC Standards for Registered Pharmacies (2018)",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "Care Quality Commission (Registration) Regulations 2009",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "GPhC Standards for Registered Pharmacies, Principle 4",
      "Workplace (Health, Safety and Welfare) Regulations 1992"
    ],
    relatedSOPs:  [
      "SOP-032",
      "SOP-077",
      "SOP-078"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-04-14"
  },
  {
    id:  77,
    code:  "SOP-077",
    title:  "Internal Audit Schedule",
    category:  "Governance",
    version:  "1.2",
    reviewDate:  "2026-08-10",
    status:  "Current",
    acked:  6,
    roles:  [
      "superintendent",
      "manager",
      "pharmacist"
    ],
    description:  "Establishes the annual internal audit programme covering all key pharmacy activities including dispensing, CDs, clinical governance, and regulatory compliance. Regular auditing identifies gaps and drives continuous improvement. Audit findings must be documented and corrective actions tracked. Supports compliance with GPhC standards, CQC requirements, and NHS contractual obligations.",
    keyPoints:  [
      "Publish the annual audit schedule at the start of each financial year",
      "Include CD audits (quarterly), dispensing accuracy (biannual), and SOPs (annual) as minimum",
      "Assign audit leads for each topic area with appropriate expertise",
      "Conduct audits using standardised templates and scoring criteria",
      "Document findings, corrective actions, responsible persons, and target completion dates",
      "Present audit results to the team and use findings to update training plans",
      "Track corrective action completion at monthly governance meetings",
      "Retain audit records for a minimum of 5 years for inspection purposes"
    ],
    scope:  "This SOP applies to the Superintendent Pharmacist, the Pharmacy Manager, all pharmacists at iPharmacy Direct. It covers all activities relating to internal audit schedule and must be read, understood, and acknowledged before undertaking any related duties. Establishes the annual internal audit programme covering all key pharmacy activities including dispensing, CDs, clinical governance, and regulatory compliance.",
    references:  [
      "GPhC Standards for Registered Pharmacies (2018)",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "Care Quality Commission (Registration) Regulations 2009",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "CQC Registration Regulations 2009",
      "CQC Key Lines of Enquiry Framework"
    ],
    relatedSOPs:  [
      "SOP-014",
      "SOP-076",
      "SOP-078"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-06-09"
  },
  {
    id:  78,
    code:  "SOP-078",
    title:  "CQC Inspection Preparation",
    category:  "Governance",
    version:  "1.1",
    reviewDate:  "2026-02-28",
    status:  "Overdue",
    acked:  5,
    roles:  [
      "superintendent",
      "manager"
    ],
    description:  "Outlines the continuous readiness approach for Care Quality Commission inspections, rather than reactive preparation. CQC inspects pharmacies against five key questions: Safe, Effective, Caring, Responsive, and Well-led. The pharmacy must be able to demonstrate compliance at all times, not only during inspections. Applies to all pharmacy activities and all members of staff.",
    keyPoints:  [
      "Maintain an up-to-date CQC evidence folder covering all five key questions",
      "Ensure all staff know their responsibilities under each CQC domain",
      "Conduct quarterly mock inspections using the CQC inspection framework",
      "Keep governance documentation (SOPs, audits, training records, risk registers) current and accessible",
      "Display the CQC registration certificate and current rating prominently",
      "Brief all staff on inspection logistics: who to contact, what inspectors may request",
      "Address any previous inspection recommendations or conditions fully before the next inspection",
      "The superintendent leads inspection preparedness with support from the manager"
    ],
    scope:  "This SOP applies to the Superintendent Pharmacist, the Pharmacy Manager at iPharmacy Direct. It covers all activities relating to cqc inspection preparation and must be read, understood, and acknowledged before undertaking any related duties. Outlines the continuous readiness approach for Care Quality Commission inspections, rather than reactive preparation.",
    references:  [
      "GPhC Standards for Registered Pharmacies (2018)",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "Care Quality Commission (Registration) Regulations 2009",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "CQC Registration Regulations 2009",
      "CQC Key Lines of Enquiry Framework"
    ],
    relatedSOPs:  [
      "SOP-032",
      "SOP-077",
      "SOP-076"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2024-12-28"
  },
  {
    id:  79,
    code:  "SOP-079",
    title:  "Business Continuity Planning",
    category:  "Governance",
    version:  "1.0",
    reviewDate:  "2026-10-25",
    status:  "Current",
    acked:  7,
    roles:  [
      "superintendent",
      "manager"
    ],
    description:  "Sets out the pharmacy's plan for maintaining essential services during disruptive events such as flooding, power failure, pandemic, or supply chain disruption. A business continuity plan ensures patients continue to receive critical medicines and services even during adverse conditions. The plan must be reviewed and tested regularly. Follows NHS England resilience guidance for community pharmacy.",
    keyPoints:  [
      "Maintain a written business continuity plan covering key disruption scenarios",
      "Identify critical pharmacy functions that must continue during a disruption",
      "Establish communication plans for contacting staff, patients, and the NHS during an incident",
      "Maintain a list of alternative premises or buddy pharmacies for mutual support",
      "Ensure IT backup procedures protect patient data and dispensing records",
      "Store a copy of the plan off-site and ensure key personnel can access it remotely",
      "Test the plan at least annually through a tabletop exercise or simulation",
      "Review and update the plan after any significant incident or annual review"
    ],
    scope:  "This SOP applies to the Superintendent Pharmacist, the Pharmacy Manager at iPharmacy Direct. It covers all activities relating to business continuity planning and must be read, understood, and acknowledged before undertaking any related duties. Sets out the pharmacy's plan for maintaining essential services during disruptive events such as flooding, power failure, pandemic, or supply chain disruption.",
    references:  [
      "GPhC Standards for Registered Pharmacies (2018)",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "Care Quality Commission (Registration) Regulations 2009",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "NHS England Community Pharmacy Resilience Guidance",
      "BSI ISO 22301: Business Continuity Management"
    ],
    relatedSOPs:  [
      "SOP-080",
      "SOP-101",
      "SOP-050"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-08-24"
  },
  {
    id:  80,
    code:  "SOP-080",
    title:  "Risk Register Management",
    category:  "Governance",
    version:  "1.0",
    reviewDate:  "2026-07-20",
    status:  "Current",
    acked:  5,
    roles:  [
      "superintendent",
      "manager"
    ],
    description:  "Defines the process for identifying, assessing, recording, and managing risks across all pharmacy operations. A well-maintained risk register is a key governance tool that enables proactive risk management. Risks are assessed by likelihood and impact, with mitigation actions assigned and tracked. Supports compliance with GPhC standards and CQC well-led domain requirements.",
    keyPoints:  [
      "Maintain a live risk register documenting all identified operational and clinical risks",
      "Assess each risk using a standardised likelihood x impact matrix (1-5 scale)",
      "Assign a risk owner and develop proportionate mitigation actions for each risk",
      "Review the risk register at least quarterly at governance meetings",
      "Add new risks promptly when identified through incidents, audits, or changes",
      "Escalate high-scoring risks to the superintendent for immediate action",
      "Close risks that have been fully mitigated and archive them for reference",
      "Use the risk register to inform the annual audit programme and training priorities"
    ],
    scope:  "This SOP applies to the Superintendent Pharmacist, the Pharmacy Manager at iPharmacy Direct. It covers all activities relating to risk register management and must be read, understood, and acknowledged before undertaking any related duties. Defines the process for identifying, assessing, recording, and managing risks across all pharmacy operations.",
    references:  [
      "GPhC Standards for Registered Pharmacies (2018)",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "Care Quality Commission (Registration) Regulations 2009",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "CQC Registration Regulations 2009",
      "CQC Key Lines of Enquiry Framework"
    ],
    relatedSOPs:  [
      "SOP-077",
      "SOP-079",
      "SOP-078"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-05-19"
  },
  {
    id:  81,
    code:  "SOP-081",
    title:  "Professional Indemnity Insurance",
    category:  "Governance",
    version:  "1.0",
    reviewDate:  "2026-12-20",
    status:  "Current",
    acked:  4,
    roles:  [
      "pharmacist",
      "superintendent"
    ],
    description:  "Ensures all registered pharmacy professionals maintain appropriate professional indemnity insurance cover. Professional indemnity insurance is a legal requirement for GPhC registrants and a condition of registration. Cover must be adequate for the scope of practice and services provided. The superintendent must verify cover for all pharmacists working at the premises.",
    keyPoints:  [
      "All GPhC-registered pharmacists and technicians must hold valid professional indemnity insurance",
      "Verify that the insurance covers all activities undertaken, including advanced services",
      "Check insurance certificates for all locum pharmacists before they commence work",
      "Retain copies of insurance certificates for all staff on file for the current year plus one",
      "Renew insurance before the expiry date — practising without cover is a criminal offence",
      "Notify the insurer of any claims or incidents that may give rise to a claim promptly",
      "Review insurance adequacy annually, particularly if new services are introduced",
      "The superintendent must maintain a record of insurance verification for all registered staff"
    ],
    scope:  "This SOP applies to all pharmacists, the Superintendent Pharmacist at iPharmacy Direct. It covers all activities relating to professional indemnity insurance and must be read, understood, and acknowledged before undertaking any related duties. Ensures all registered pharmacy professionals maintain appropriate professional indemnity insurance cover.",
    references:  [
      "GPhC Standards for Registered Pharmacies (2018)",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "Care Quality Commission (Registration) Regulations 2009",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "GPhC Professional Indemnity Insurance Requirements",
      "Health Care and Associated Professions (Indemnity Arrangements) Order 2014"
    ],
    relatedSOPs:  [
      "SOP-030",
      "SOP-042",
      "SOP-089"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-10-19"
  },
  {
    id:  34,
    code:  "SOP-034",
    title:  "Fire Safety & Evacuation",
    category:  "H&S",
    version:  "1.8",
    reviewDate:  "2026-08-10",
    status:  "Current",
    acked:  10,
    roles:  [
      "all"
    ],
    description:  "Covers fire prevention, alarm response, evacuation routes, and assembly point procedures for all staff and visitors. The pharmacy must comply with the Regulatory Reform (Fire Safety) Order 2005. A fire risk assessment must be in place and reviewed annually. All staff must receive fire safety training at induction and annual refreshers.",
    keyPoints:  [
      "Know the location of all fire exits, fire extinguishers, and break-glass alarm points",
      "Evacuate immediately on hearing the fire alarm — do not stop to collect belongings",
      "Assist any customers or vulnerable persons to evacuate safely",
      "Assemble at the designated assembly point and report to the fire marshal for roll call",
      "The fire marshal checks all areas are clear and liaises with the fire service on arrival",
      "Conduct fire drills at least every 6 months and record the results",
      "Test fire alarms weekly and maintain fire extinguishers with annual service records",
      "Review the fire risk assessment annually or after any premises modifications"
    ],
    scope:  "This SOP applies to all pharmacy staff at iPharmacy Direct. It covers all activities relating to fire safety & evacuation and must be read, understood, and acknowledged before undertaking any related duties. Covers fire prevention, alarm response, evacuation routes, and assembly point procedures for all staff and visitors.",
    references:  [
      "Health and Safety at Work etc. Act 1974",
      "Management of Health and Safety at Work Regulations 1999",
      "Workplace (Health, Safety and Welfare) Regulations 1992",
      "GPhC Standards for Registered Pharmacies (2018)",
      "Regulatory Reform (Fire Safety) Order 2005",
      "HM Government Fire Safety Guidance"
    ],
    relatedSOPs:  [
      "SOP-050",
      "SOP-095",
      "SOP-037"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-05-09"
  },
  {
    id:  35,
    code:  "SOP-035",
    title:  "COSHH & Hazardous Substances",
    category:  "H&S",
    version:  "2.5",
    reviewDate:  "2026-03-15",
    status:  "Due Review",
    acked:  7,
    roles:  [
      "all"
    ],
    description:  "Ensures all hazardous substances used in the pharmacy are properly assessed, stored, and handled under COSHH Regulations 2002. Includes cleaning chemicals, pharmaceutical substances, and cytotoxic preparations. COSHH assessments must be in place for every hazardous substance on the premises. All staff must be trained on safe handling before using any hazardous product.",
    keyPoints:  [
      "Maintain up-to-date COSHH assessments for all hazardous substances held on the premises",
      "Store chemicals in original labelled containers in a designated, ventilated area",
      "Use appropriate PPE (gloves, goggles, apron) as specified in the safety data sheet",
      "Ensure safety data sheets are accessible for all hazardous substances in use",
      "Train all staff on safe handling procedures before they use any hazardous product",
      "Report and manage any spillage using the appropriate spill kit and procedure",
      "Dispose of hazardous waste through approved specialist waste contractors",
      "Review COSHH assessments annually or when new substances are introduced"
    ],
    scope:  "This SOP applies to all pharmacy staff at iPharmacy Direct. It covers all activities relating to coshh & hazardous substances and must be read, understood, and acknowledged before undertaking any related duties. Ensures all hazardous substances used in the pharmacy are properly assessed, stored, and handled under COSHH Regulations 2002.",
    references:  [
      "Health and Safety at Work etc. Act 1974",
      "Management of Health and Safety at Work Regulations 1999",
      "Workplace (Health, Safety and Welfare) Regulations 1992",
      "GPhC Standards for Registered Pharmacies (2018)",
      "Control of Substances Hazardous to Health Regulations 2002 (COSHH)",
      "HSE COSHH Essentials Guidance"
    ],
    relatedSOPs:  [
      "SOP-085",
      "SOP-040",
      "SOP-091"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2024-10-14"
  },
  {
    id:  36,
    code:  "SOP-036",
    title:  "Manual Handling",
    category:  "H&S",
    version:  "1.4",
    reviewDate:  "2026-06-20",
    status:  "Current",
    acked:  11,
    roles:  [
      "all"
    ],
    description:  "Provides guidance on safe lifting, carrying, and moving techniques to prevent musculoskeletal injuries. Manual handling injuries are one of the most common workplace injuries in pharmacy settings. Risk assessments must be conducted for regular manual handling tasks. Complies with the Manual Handling Operations Regulations 1992.",
    keyPoints:  [
      "Assess the load before lifting — seek help or use equipment if too heavy or awkward",
      "Use correct lifting technique: bend knees, keep back straight, hold load close to body",
      "Use trolleys, step stools, or mechanical aids for heavy deliveries and high shelf items",
      "Do not twist your body while carrying — move your feet to turn",
      "Break large deliveries into smaller, manageable loads rather than attempting one heavy lift",
      "Report any manual handling injuries immediately to your line manager",
      "Complete manual handling training at induction and annual refreshers",
      "Conduct risk assessments for regular manual handling tasks such as tote box handling"
    ],
    scope:  "This SOP applies to all pharmacy staff at iPharmacy Direct. It covers all activities relating to manual handling and must be read, understood, and acknowledged before undertaking any related duties. Provides guidance on safe lifting, carrying, and moving techniques to prevent musculoskeletal injuries.",
    references:  [
      "Health and Safety at Work etc. Act 1974",
      "Management of Health and Safety at Work Regulations 1999",
      "Workplace (Health, Safety and Welfare) Regulations 1992",
      "GPhC Standards for Registered Pharmacies (2018)",
      "Manual Handling Operations Regulations 1992",
      "HSE Manual Handling at Work Guidance (L23)"
    ],
    relatedSOPs:  [
      "SOP-084",
      "SOP-034",
      "SOP-037"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-04-19"
  },
  {
    id:  37,
    code:  "SOP-037",
    title:  "First Aid Procedures",
    category:  "H&S",
    version:  "2.0",
    reviewDate:  "2026-10-30",
    status:  "Current",
    acked:  9,
    roles:  [
      "all"
    ],
    description:  "Defines first aid arrangements, trained aider responsibilities, and emergency response protocols for the pharmacy. The Health and Safety (First Aid) Regulations 1981 require adequate first aid provision. At least one trained first aider must be available during all opening hours. First aid supplies must be checked and restocked regularly.",
    keyPoints:  [
      "Know the identity of designated first aiders — names are posted in the staff area",
      "First aid kit locations: dispensary, staff room, and delivery vehicle",
      "Call 999 immediately for any life-threatening emergency — do not delay",
      "Provide first aid only within your training level — do not exceed your competence",
      "Record all first aid incidents in the accident book with full details",
      "Check and restock first aid kits monthly — replace used or expired items",
      "Ensure at least one trained first aider is on-site during all opening hours",
      "Review first aid arrangements annually and retrain first aiders every 3 years"
    ],
    scope:  "This SOP applies to all pharmacy staff at iPharmacy Direct. It covers all activities relating to first aid procedures and must be read, understood, and acknowledged before undertaking any related duties. Defines first aid arrangements, trained aider responsibilities, and emergency response protocols for the pharmacy.",
    references:  [
      "Health and Safety at Work etc. Act 1974",
      "Management of Health and Safety at Work Regulations 1999",
      "Workplace (Health, Safety and Welfare) Regulations 1992",
      "GPhC Standards for Registered Pharmacies (2018)",
      "Health and Safety (First-Aid) Regulations 1981",
      "HSE First Aid at Work Guidance (L74)"
    ],
    relatedSOPs:  [
      "SOP-038",
      "SOP-034",
      "SOP-040"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-06-29"
  },
  {
    id:  38,
    code:  "SOP-038",
    title:  "Needle Stick & Sharps Injury",
    category:  "H&S",
    version:  "1.6",
    reviewDate:  "2026-05-05",
    status:  "Current",
    acked:  8,
    roles:  [
      "pharmacist",
      "technician",
      "dispenser"
    ],
    description:  "Sets out immediate actions and follow-up procedures following a needlestick or sharps injury. Sharps injuries carry a risk of bloodborne virus transmission including HIV, Hepatitis B, and Hepatitis C. Prompt first aid and medical assessment are essential to minimise risk. Complies with the Health and Safety (Sharp Instruments in Healthcare) Regulations 2013.",
    keyPoints:  [
      "Encourage the wound to bleed freely — do not squeeze or suck the wound",
      "Wash the area thoroughly with soap and running water immediately",
      "Cover the wound with a waterproof dressing",
      "Report to your line manager and attend A&E or occupational health urgently for risk assessment",
      "Complete the accident report form with full details of the incident and source material",
      "Submit a RIDDOR report if the injury involves a known or suspected infected source",
      "Follow up with occupational health for any required blood tests or post-exposure prophylaxis",
      "Review sharps handling procedures and equipment after any incident to prevent recurrence"
    ],
    scope:  "This SOP applies to all pharmacists, pharmacy technicians, dispensers at iPharmacy Direct. It covers all activities relating to needle stick & sharps injury and must be read, understood, and acknowledged before undertaking any related duties. Sets out immediate actions and follow-up procedures following a needlestick or sharps injury.",
    references:  [
      "Health and Safety at Work etc. Act 1974",
      "Management of Health and Safety at Work Regulations 1999",
      "Workplace (Health, Safety and Welfare) Regulations 1992",
      "GPhC Standards for Registered Pharmacies (2018)",
      "Health and Safety (First-Aid) Regulations 1981",
      "HSE First Aid at Work Guidance (L74)"
    ],
    relatedSOPs:  [
      "SOP-037",
      "SOP-085",
      "SOP-040"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-02-05"
  },
  {
    id:  39,
    code:  "SOP-039",
    title:  "Workplace Violence & Aggression",
    category:  "H&S",
    version:  "1.1",
    reviewDate:  "2026-02-01",
    status:  "Overdue",
    acked:  6,
    roles:  [
      "all"
    ],
    description:  "Provides guidance on preventing, de-escalating, and reporting incidents of violence or aggression from the public. Pharmacy staff have a right to work without fear of physical or verbal abuse. Violent incidents must be reported and may constitute criminal offences. Follows NHS England guidance on protecting staff from violence and the HSE management standards.",
    keyPoints:  [
      "Stay calm, maintain a safe distance, and use de-escalation techniques",
      "Do not confront, restrain, or physically engage with aggressive individuals",
      "Activate the panic alarm discreetly if you feel threatened or unsafe",
      "Remove yourself and other staff to a place of safety if the situation escalates",
      "Call 999 if there is an immediate risk of physical harm",
      "Report all incidents (verbal and physical) to your manager and complete an incident form",
      "Offer support and debriefing to affected staff after any violent incident",
      "Review security measures and risk assessments after each incident"
    ],
    scope:  "This SOP applies to all pharmacy staff at iPharmacy Direct. It covers all activities relating to workplace violence & aggression and must be read, understood, and acknowledged before undertaking any related duties. Provides guidance on preventing, de-escalating, and reporting incidents of violence or aggression from the public.",
    references:  [
      "Health and Safety at Work etc. Act 1974",
      "Management of Health and Safety at Work Regulations 1999",
      "Workplace (Health, Safety and Welfare) Regulations 1992",
      "GPhC Standards for Registered Pharmacies (2018)",
      "HSE Work-Related Violence Guidance",
      "NHS Employers Violence Prevention and Reduction Standard"
    ],
    relatedSOPs:  [
      "SOP-044",
      "SOP-037",
      "SOP-094"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2024-12-01"
  },
  {
    id:  40,
    code:  "SOP-040",
    title:  "Infection Control & Hygiene",
    category:  "H&S",
    version:  "2.3",
    reviewDate:  "2026-07-15",
    status:  "Current",
    acked:  12,
    roles:  [
      "all"
    ],
    description:  "Establishes infection control measures including hand hygiene, PPE use, surface cleaning, and clinical waste handling. Good infection control protects staff, patients, and visitors from healthcare-associated infections. Standards align with PHE and NHS England infection prevention and control guidelines. All staff must comply regardless of their role.",
    keyPoints:  [
      "Wash hands with soap and water for at least 20 seconds before and after patient contact",
      "Use alcohol hand gel between handwashes when hands are not visibly soiled",
      "Wear disposable gloves when handling clinical waste, sharps, or body fluids",
      "Clean dispensary surfaces and consultation room equipment with approved disinfectant daily",
      "Dispose of clinical waste (sharps, contaminated materials) in yellow clinical waste bags or sharps bins",
      "Change and launder uniform or work clothing regularly — do not wear outside the pharmacy",
      "Cover any cuts or abrasions with waterproof dressings before starting work",
      "Complete infection control training at induction and annual refreshers"
    ],
    scope:  "This SOP applies to all pharmacy staff at iPharmacy Direct. It covers all activities relating to infection control & hygiene and must be read, understood, and acknowledged before undertaking any related duties. Establishes infection control measures including hand hygiene, PPE use, surface cleaning, and clinical waste handling.",
    references:  [
      "Health and Safety at Work etc. Act 1974",
      "Management of Health and Safety at Work Regulations 1999",
      "Workplace (Health, Safety and Welfare) Regulations 1992",
      "GPhC Standards for Registered Pharmacies (2018)",
      "PHE Infection Prevention and Control Guidelines",
      "NHS England IPC Guidance for Community Pharmacy"
    ],
    relatedSOPs:  [
      "SOP-085",
      "SOP-035",
      "SOP-037"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-03-15"
  },
  {
    id:  82,
    code:  "SOP-082",
    title:  "DSE Assessment (Display Screen Equipment)",
    category:  "H&S",
    version:  "1.0",
    reviewDate:  "2026-09-15",
    status:  "Current",
    acked:  8,
    roles:  [
      "all"
    ],
    description:  "Covers the risk assessment and management of display screen equipment (DSE) use in the pharmacy. Staff who use computers regularly are classified as DSE users under the Health and Safety (Display Screen Equipment) Regulations 1992. Prolonged DSE use can cause eye strain, musculoskeletal problems, and fatigue. Risk assessments and appropriate workstation adjustments reduce these risks.",
    keyPoints:  [
      "Conduct a DSE workstation assessment for all staff who regularly use computers",
      "Adjust monitor height, keyboard position, and chair settings to achieve ergonomic posture",
      "Take regular breaks from screen work — at least 5 minutes every hour",
      "Provide anti-glare screens or adjust lighting to reduce screen glare where needed",
      "Offer eye tests to DSE users on request and provide contribution towards corrective spectacles",
      "Report any symptoms of discomfort, eye strain, or repetitive strain to your manager",
      "Review DSE assessments annually or when workstations or roles change",
      "Ensure laptop users have access to separate keyboards and monitors for prolonged use"
    ],
    scope:  "This SOP applies to all pharmacy staff at iPharmacy Direct. It covers all activities relating to dse assessment (display screen equipment) and must be read, understood, and acknowledged before undertaking any related duties. Covers the risk assessment and management of display screen equipment (DSE) use in the pharmacy.",
    references:  [
      "Health and Safety at Work etc. Act 1974",
      "Management of Health and Safety at Work Regulations 1999",
      "Workplace (Health, Safety and Welfare) Regulations 1992",
      "GPhC Standards for Registered Pharmacies (2018)",
      "Health and Safety (Display Screen Equipment) Regulations 1992",
      "HSE Working with Display Screen Equipment (L26)"
    ],
    relatedSOPs:  [
      "SOP-100",
      "SOP-084",
      "SOP-037"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-07-14"
  },
  {
    id:  83,
    code:  "SOP-083",
    title:  "Electrical Safety",
    category:  "H&S",
    version:  "1.1",
    reviewDate:  "2026-11-10",
    status:  "Current",
    acked:  7,
    roles:  [
      "manager",
      "stock_assistant"
    ],
    description:  "Ensures all electrical equipment and installations in the pharmacy are safe and properly maintained. Electrical faults are a significant fire and injury risk. Portable appliance testing (PAT) and fixed wiring inspections must be conducted at the required intervals. Complies with the Electricity at Work Regulations 1989.",
    keyPoints:  [
      "Arrange PAT testing for all portable electrical equipment at least annually",
      "Maintain fixed electrical installation certificates (EICR) valid for 5 years",
      "Do not use any electrical equipment that is visibly damaged, frayed, or has exposed wires",
      "Report any faulty equipment immediately — label it as defective and remove from use",
      "Do not overload power sockets or use multi-plug adapters without surge protection",
      "Ensure all electrical work is carried out by a qualified, registered electrician",
      "Keep a register of all portable electrical equipment with PAT test dates",
      "Include electrical safety checks in the monthly premises inspection"
    ],
    scope:  "This SOP applies to the Pharmacy Manager, stock assistants at iPharmacy Direct. It covers all activities relating to electrical safety and must be read, understood, and acknowledged before undertaking any related duties. Ensures all electrical equipment and installations in the pharmacy are safe and properly maintained.",
    references:  [
      "Health and Safety at Work etc. Act 1974",
      "Management of Health and Safety at Work Regulations 1999",
      "Workplace (Health, Safety and Welfare) Regulations 1992",
      "GPhC Standards for Registered Pharmacies (2018)",
      "Regulatory Reform (Fire Safety) Order 2005",
      "HM Government Fire Safety Guidance"
    ],
    relatedSOPs:  [
      "SOP-095",
      "SOP-048",
      "SOP-034"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-09-09"
  },
  {
    id:  84,
    code:  "SOP-084",
    title:  "Slips, Trips & Falls Prevention",
    category:  "H&S",
    version:  "1.0",
    reviewDate:  "2026-05-20",
    status:  "Current",
    acked:  10,
    roles:  [
      "all"
    ],
    description:  "Addresses the prevention and management of slips, trips, and falls in the pharmacy, which are the most common cause of workplace injury. Risk factors include wet floors, trailing cables, cluttered walkways, and uneven surfaces. All staff share responsibility for maintaining a safe environment. Complies with the Workplace (Health, Safety and Welfare) Regulations 1992.",
    keyPoints:  [
      "Keep all walkways, corridors, and the dispensary floor clear of obstructions at all times",
      "Clean up any spills immediately and place wet floor signs until the area is dry",
      "Secure trailing cables with cable covers or route them away from walkways",
      "Ensure adequate lighting in all work areas, stairways, and storage rooms",
      "Use appropriate non-slip footwear — open-toed shoes are not permitted in the dispensary",
      "Report any damaged flooring, loose carpet, or uneven surfaces for immediate repair",
      "Store heavy items at waist height to reduce the need for bending or reaching",
      "Record all slip, trip, and fall incidents in the accident book and investigate root causes"
    ],
    scope:  "This SOP applies to all pharmacy staff at iPharmacy Direct. It covers all activities relating to slips, trips & falls prevention and must be read, understood, and acknowledged before undertaking any related duties. Addresses the prevention and management of slips, trips, and falls in the pharmacy, which are the most common cause of workplace injury.",
    references:  [
      "Health and Safety at Work etc. Act 1974",
      "Management of Health and Safety at Work Regulations 1999",
      "Workplace (Health, Safety and Welfare) Regulations 1992",
      "GPhC Standards for Registered Pharmacies (2018)",
      "HSE Slips and Trips Guidance (INDG225)"
    ],
    relatedSOPs:  [
      "SOP-036",
      "SOP-082",
      "SOP-086"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-03-20"
  },
  {
    id:  85,
    code:  "SOP-085",
    title:  "Personal Protective Equipment (PPE)",
    category:  "H&S",
    version:  "1.2",
    reviewDate:  "2026-04-15",
    status:  "Due Review",
    acked:  9,
    roles:  [
      "all"
    ],
    description:  "Defines the requirements for personal protective equipment use across pharmacy activities. PPE is the last line of defence after engineering and administrative controls. The pharmacy must provide appropriate PPE free of charge for all tasks that require it. Complies with the Personal Protective Equipment at Work Regulations 2022.",
    keyPoints:  [
      "Use the PPE specified in the relevant risk assessment or COSHH assessment for each task",
      "PPE is provided free of charge — report any missing or damaged items to your manager",
      "Wear disposable gloves when handling cytotoxic drugs, clinical waste, or chemical substances",
      "Use safety goggles or a face shield when decanting chemicals or handling liquid hazardous substances",
      "Dispose of single-use PPE after each use in the appropriate waste stream",
      "Store reusable PPE in a clean, designated area and inspect before each use",
      "Report any allergies to PPE materials (e.g. latex) so alternatives can be provided",
      "Complete PPE training at induction including correct donning and doffing procedures"
    ],
    scope:  "This SOP applies to all pharmacy staff at iPharmacy Direct. It covers all activities relating to personal protective equipment (ppe) and must be read, understood, and acknowledged before undertaking any related duties. Defines the requirements for personal protective equipment use across pharmacy activities.",
    references:  [
      "Health and Safety at Work etc. Act 1974",
      "Management of Health and Safety at Work Regulations 1999",
      "Workplace (Health, Safety and Welfare) Regulations 1992",
      "GPhC Standards for Registered Pharmacies (2018)",
      "Personal Protective Equipment at Work Regulations 2022",
      "HSE PPE at Work Guidance (L25)"
    ],
    relatedSOPs:  [
      "SOP-035",
      "SOP-040",
      "SOP-038"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-02-15"
  },
  {
    id:  86,
    code:  "SOP-086",
    title:  "Working at Height",
    category:  "H&S",
    version:  "1.0",
    reviewDate:  "2026-09-30",
    status:  "Current",
    acked:  7,
    roles:  [
      "all"
    ],
    description:  "Covers the safe use of step stools, ladders, and kick steps for accessing high shelving in the pharmacy. Working at height, even from a small step, is a significant risk factor for falls. The Work at Height Regulations 2005 apply to any work where a person could fall and be injured. Alternatives to working at height should be considered first.",
    keyPoints:  [
      "Use the pharmacy-provided kick steps or step stools — never stand on chairs or shelving",
      "Check step stools and kick steps for damage before each use — do not use if defective",
      "Maintain three points of contact when using steps and do not overreach",
      "Store frequently used items at accessible heights to minimise the need for steps",
      "Never use step stools on wet or uneven surfaces",
      "Do not carry heavy items while using steps — pass them to a colleague or use a shelf",
      "Report any damaged step equipment immediately and remove from use",
      "Include working at height checks in the monthly premises safety inspection"
    ],
    scope:  "This SOP applies to all pharmacy staff at iPharmacy Direct. It covers all activities relating to working at height and must be read, understood, and acknowledged before undertaking any related duties. Covers the safe use of step stools, ladders, and kick steps for accessing high shelving in the pharmacy.",
    references:  [
      "Health and Safety at Work etc. Act 1974",
      "Management of Health and Safety at Work Regulations 1999",
      "Workplace (Health, Safety and Welfare) Regulations 1992",
      "GPhC Standards for Registered Pharmacies (2018)",
      "HSE Slips and Trips Guidance (INDG225)",
      "Work at Height Regulations 2005"
    ],
    relatedSOPs:  [
      "SOP-036",
      "SOP-084",
      "SOP-051"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-07-29"
  },
  {
    id:  41,
    code:  "SOP-041",
    title:  "Staff Induction Programme",
    category:  "HR & Training",
    version:  "2.0",
    reviewDate:  "2026-09-25",
    status:  "Current",
    acked:  10,
    roles:  [
      "manager",
      "superintendent"
    ],
    description:  "Structures the induction process for new staff members covering all essential areas within their first four weeks. A thorough induction ensures new starters understand their role, the pharmacy's SOPs, and health and safety requirements. The induction must be documented and signed off by both the new starter and their mentor. Complies with GPhC workforce standards and employment law requirements.",
    keyPoints:  [
      "Complete the structured induction checklist with every new starter within 4 weeks",
      "Cover health and safety essentials (fire, COSHH, manual handling) on day one",
      "Introduce all relevant SOPs and ensure the new starter reads and acknowledges them",
      "Assign a buddy or mentor for the first month to support integration and learning",
      "Provide role-specific training including dispensary operations, customer service, and IT systems",
      "Review progress at week 1, week 2, and week 4 with documented feedback",
      "Sign off induction completion with both the new starter and manager signatures",
      "Retain induction records in the staff file for the duration of employment plus 6 years"
    ],
    scope:  "This SOP applies to the Pharmacy Manager, the Superintendent Pharmacist at iPharmacy Direct. It covers all activities relating to staff induction programme and must be read, understood, and acknowledged before undertaking any related duties. Structures the induction process for new staff members covering all essential areas within their first four weeks.",
    references:  [
      "GPhC Standards for Pharmacy Professionals (2017)",
      "Employment Rights Act 1996",
      "ACAS Code of Practice on Disciplinary and Grievance Procedures",
      "Equality Act 2010",
      "GPhC Standards for Pharmacy Professionals, Standard 9",
      "ACAS Induction Best Practice Guidance"
    ],
    relatedSOPs:  [
      "SOP-043",
      "SOP-089",
      "SOP-046"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-05-24"
  },
  {
    id:  42,
    code:  "SOP-042",
    title:  "CPD Requirements & Recording",
    category:  "HR & Training",
    version:  "1.5",
    reviewDate:  "2026-11-15",
    status:  "Current",
    acked:  7,
    roles:  [
      "pharmacist",
      "technician"
    ],
    description:  "Outlines the GPhC CPD requirements for registered pharmacy professionals and the process for recording and submitting entries. CPD is a legal requirement for maintaining GPhC registration. Pharmacists must complete at least 4 CPD entries per year, including at least 1 peer discussion. Pharmacy technicians have equivalent requirements proportionate to their role.",
    keyPoints:  [
      "Complete the minimum CPD entries required by the GPhC each registration year",
      "Include at least one peer discussion and one planned learning activity in your CPD portfolio",
      "Use the reflective practice model: identify need, plan, action, evaluate, and apply",
      "Record entries promptly on the GPhC myGPhC portal — do not leave until the deadline",
      "Link CPD activities to the GPhC Standards for Pharmacy Professionals where possible",
      "Retain supporting evidence for potential peer review or revalidation selection",
      "Discuss CPD progress with your manager during annual appraisals",
      "The pharmacy will provide reasonable time and support for CPD activities"
    ],
    scope:  "This SOP applies to all pharmacists, pharmacy technicians at iPharmacy Direct. It covers all activities relating to cpd requirements & recording and must be read, understood, and acknowledged before undertaking any related duties. Outlines the GPhC CPD requirements for registered pharmacy professionals and the process for recording and submitting entries.",
    references:  [
      "GPhC Standards for Pharmacy Professionals (2017)",
      "Employment Rights Act 1996",
      "ACAS Code of Practice on Disciplinary and Grievance Procedures",
      "Equality Act 2010",
      "GPhC CPD and Revalidation Framework (2018)",
      "GPhC Standards for Pharmacy Professionals, Standard 9"
    ],
    relatedSOPs:  [
      "SOP-043",
      "SOP-030",
      "SOP-090"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-08-14"
  },
  {
    id:  43,
    code:  "SOP-043",
    title:  "Competency Assessment & Sign-Off",
    category:  "HR & Training",
    version:  "1.3",
    reviewDate:  "2026-04-30",
    status:  "Due Review",
    acked:  5,
    roles:  [
      "manager",
      "superintendent"
    ],
    description:  "Defines the competency framework and sign-off process for staff performing key pharmacy tasks such as dispensing, CD handling, and clinical services. Competency assessment ensures staff are safe and effective before they work independently. Assessments use a combination of observation, questioning, and practical demonstration. Competency must be maintained through regular reassessment.",
    keyPoints:  [
      "Assess competency against role-specific standards before allowing independent practice",
      "Use structured observation and knowledge-based assessment methods",
      "Document sign-off with assessor name, date, competency area, and outcome",
      "Reassess competency annually or whenever procedures, roles, or regulations change",
      "Provide additional training and support for staff who do not meet competency standards",
      "Maintain a competency matrix showing all staff and their signed-off competencies",
      "Include competency status in annual appraisal discussions",
      "Retain competency records in the staff file for the duration of employment plus 6 years"
    ],
    scope:  "This SOP applies to the Pharmacy Manager, the Superintendent Pharmacist at iPharmacy Direct. It covers all activities relating to competency assessment & sign-off and must be read, understood, and acknowledged before undertaking any related duties. Defines the competency framework and sign-off process for staff performing key pharmacy tasks such as dispensing, CD handling, and clinical services.",
    references:  [
      "GPhC Standards for Pharmacy Professionals (2017)",
      "Employment Rights Act 1996",
      "ACAS Code of Practice on Disciplinary and Grievance Procedures",
      "Equality Act 2010",
      "GPhC Standards for Pharmacy Professionals, Standard 9",
      "Skills for Health National Occupational Standards"
    ],
    relatedSOPs:  [
      "SOP-041",
      "SOP-042",
      "SOP-045"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-03-02"
  },
  {
    id:  44,
    code:  "SOP-044",
    title:  "Lone Working Policy",
    category:  "HR & Training",
    version:  "1.8",
    reviewDate:  "2026-08-05",
    status:  "Current",
    acked:  9,
    roles:  [
      "all"
    ],
    description:  "Provides safety measures and risk mitigation for staff who may work alone in the pharmacy. Lone working situations include early morning or late evening shifts, weekend working, and delivery runs. A specific risk assessment must be in place for all identified lone working scenarios. Complies with HSE guidance on lone workers and the Management of Health and Safety at Work Regulations 1999.",
    keyPoints:  [
      "Risk-assess all lone working situations and implement appropriate control measures",
      "Maintain regular check-in contact with a buddy, manager, or the pharmacy during lone working",
      "Ensure panic alarm systems and telephones are accessible and functioning at all times",
      "Do not handle large cash amounts, open deliveries alone, or undertake high-risk tasks when lone working",
      "Drivers must carry a charged mobile phone and follow the planned delivery route",
      "Report any incidents or near misses during lone working periods immediately",
      "Review lone working risk assessments annually or after any incident",
      "Ensure lone workers have received appropriate training including conflict resolution"
    ],
    scope:  "This SOP applies to all pharmacy staff at iPharmacy Direct. It covers all activities relating to lone working policy and must be read, understood, and acknowledged before undertaking any related duties. Provides safety measures and risk mitigation for staff who may work alone in the pharmacy.",
    references:  [
      "GPhC Standards for Pharmacy Professionals (2017)",
      "Employment Rights Act 1996",
      "ACAS Code of Practice on Disciplinary and Grievance Procedures",
      "Equality Act 2010",
      "HSE Working Alone: Protecting Lone Workers Guidance (INDG73)",
      "ACAS Lone Working Guidance"
    ],
    relatedSOPs:  [
      "SOP-039",
      "SOP-094",
      "SOP-052"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-05-04"
  },
  {
    id:  45,
    code:  "SOP-045",
    title:  "Annual Appraisal Process",
    category:  "HR & Training",
    version:  "1.2",
    reviewDate:  "2026-01-20",
    status:  "Overdue",
    acked:  4,
    roles:  [
      "manager",
      "superintendent"
    ],
    description:  "Describes the annual performance review process including self-assessment, goal setting, and development planning. Appraisals provide a structured opportunity to review performance, recognise achievements, and plan development. All staff should receive an annual appraisal conducted by their line manager. Documentation must be retained confidentially in the staff file.",
    keyPoints:  [
      "Schedule appraisals within the anniversary month for each staff member",
      "Staff complete a self-assessment form at least one week before the meeting",
      "Review progress against the previous year's objectives and competency requirements",
      "Set 3-5 SMART objectives for the coming year aligned with pharmacy and personal goals",
      "Agree a training and development plan covering mandatory and role-specific training",
      "Discuss career aspirations, concerns, and wellbeing as part of the conversation",
      "Both parties sign the appraisal record and retain copies",
      "Track objective progress at an interim review (6 months) to ensure the plan is on track"
    ],
    scope:  "This SOP applies to the Pharmacy Manager, the Superintendent Pharmacist at iPharmacy Direct. It covers all activities relating to annual appraisal process and must be read, understood, and acknowledged before undertaking any related duties. Describes the annual performance review process including self-assessment, goal setting, and development planning.",
    references:  [
      "GPhC Standards for Pharmacy Professionals (2017)",
      "Employment Rights Act 1996",
      "ACAS Code of Practice on Disciplinary and Grievance Procedures",
      "Equality Act 2010",
      "ACAS Guide on Managing Performance",
      "GPhC Revalidation Framework"
    ],
    relatedSOPs:  [
      "SOP-043",
      "SOP-042",
      "SOP-087"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2024-11-20"
  },
  {
    id:  46,
    code:  "SOP-046",
    title:  "Equality, Diversity & Inclusion",
    category:  "HR & Training",
    version:  "1.0",
    reviewDate:  "2026-12-10",
    status:  "Current",
    acked:  11,
    roles:  [
      "all"
    ],
    description:  "Sets out the pharmacy's commitment to equality, diversity, and inclusion for all staff, patients, and visitors. The pharmacy operates in compliance with the Equality Act 2010 and does not tolerate discrimination of any kind. All staff are responsible for creating an inclusive environment. This SOP applies to recruitment, employment, service delivery, and all daily interactions.",
    keyPoints:  [
      "Treat all individuals with dignity, respect, and courtesy regardless of background",
      "Do not discriminate against anyone on the basis of any protected characteristic under the Equality Act",
      "Make reasonable adjustments for disabled staff and patients to enable equal access",
      "Report any discrimination, harassment, or bullying immediately using the complaints or whistleblowing process",
      "Use inclusive language and communication methods appropriate to the individual",
      "Ensure recruitment and promotion decisions are based solely on merit and suitability",
      "Complete equality and diversity training at induction and annual refreshers",
      "Monitor and review EDI practices as part of the annual governance programme"
    ],
    scope:  "This SOP applies to all pharmacy staff at iPharmacy Direct. It covers all activities relating to equality, diversity & inclusion and must be read, understood, and acknowledged before undertaking any related duties. Sets out the pharmacy's commitment to equality, diversity, and inclusion for all staff, patients, and visitors.",
    references:  [
      "GPhC Standards for Pharmacy Professionals (2017)",
      "Employment Rights Act 1996",
      "ACAS Code of Practice on Disciplinary and Grievance Procedures",
      "Equality Act 2010",
      "EHRC Code of Practice on Employment"
    ],
    relatedSOPs:  [
      "SOP-041",
      "SOP-088",
      "SOP-031"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-10-09"
  },
  {
    id:  87,
    code:  "SOP-087",
    title:  "Absence Management",
    category:  "HR & Training",
    version:  "1.1",
    reviewDate:  "2026-06-25",
    status:  "Current",
    acked:  8,
    roles:  [
      "manager",
      "superintendent"
    ],
    description:  "Defines the procedures for reporting, recording, and managing staff sickness absence. Consistent absence management supports both the individual's wellbeing and the pharmacy's operational resilience. Covers short-term absence, long-term absence, return-to-work processes, and triggers for occupational health referral. Complies with employment law and ACAS guidance.",
    keyPoints:  [
      "Staff must notify their line manager of absence before the shift start time, or as early as possible",
      "Record all absences in the staff absence register with dates, reason, and expected return",
      "Conduct a return-to-work interview after every period of absence, however short",
      "Self-certification covers the first 7 days; a GP fit note is required from day 8",
      "Refer to occupational health after 4 or more short-term absences in a rolling 12-month period",
      "Support phased returns and reasonable adjustments for staff returning from long-term absence",
      "Manage persistent short-term absence through the formal absence management procedure",
      "Maintain confidential absence records and share only on a need-to-know basis"
    ],
    scope:  "This SOP applies to the Pharmacy Manager, the Superintendent Pharmacist at iPharmacy Direct. It covers all activities relating to absence management and must be read, understood, and acknowledged before undertaking any related duties. Defines the procedures for reporting, recording, and managing staff sickness absence.",
    references:  [
      "GPhC Standards for Pharmacy Professionals (2017)",
      "Employment Rights Act 1996",
      "ACAS Code of Practice on Disciplinary and Grievance Procedures",
      "Equality Act 2010",
      "ACAS Managing Attendance and Employee Turnover"
    ],
    relatedSOPs:  [
      "SOP-045",
      "SOP-088",
      "SOP-044"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-04-24"
  },
  {
    id:  88,
    code:  "SOP-088",
    title:  "Disciplinary & Grievance Procedure",
    category:  "HR & Training",
    version:  "1.0",
    reviewDate:  "2026-10-15",
    status:  "Current",
    acked:  6,
    roles:  [
      "manager",
      "superintendent"
    ],
    description:  "Outlines the formal disciplinary and grievance procedures for addressing conduct, capability, and workplace disputes. Fair and consistent procedures protect both the employer and the employee. The process follows ACAS Code of Practice on Disciplinary and Grievance Procedures. All matters are handled confidentially and with due process.",
    keyPoints:  [
      "Address minor conduct issues informally through management conversation before invoking formal procedures",
      "Follow the ACAS Code: investigation, hearing, decision, and right of appeal at each stage",
      "The employee has the right to be accompanied by a colleague or trade union representative at hearings",
      "Investigate allegations thoroughly and impartially before any disciplinary action is taken",
      "Document all stages of the process with dates, evidence, and decisions made",
      "Grievances raised during a disciplinary process must be handled concurrently where possible",
      "Sanctions range from verbal warning to summary dismissal depending on the severity of the matter",
      "Retain disciplinary and grievance records confidentially for 6 years or as required by law"
    ],
    scope:  "This SOP applies to the Pharmacy Manager, the Superintendent Pharmacist at iPharmacy Direct. It covers all activities relating to disciplinary & grievance procedure and must be read, understood, and acknowledged before undertaking any related duties. Outlines the formal disciplinary and grievance procedures for addressing conduct, capability, and workplace disputes.",
    references:  [
      "GPhC Standards for Pharmacy Professionals (2017)",
      "Employment Rights Act 1996",
      "ACAS Code of Practice on Disciplinary and Grievance Procedures",
      "Equality Act 2010",
      "ACAS Code of Practice on Disciplinary and Grievance Procedures (2015)"
    ],
    relatedSOPs:  [
      "SOP-087",
      "SOP-031",
      "SOP-046"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-08-14"
  },
  {
    id:  89,
    code:  "SOP-089",
    title:  "DBS Checks & Safeguarding Clearance",
    category:  "HR & Training",
    version:  "1.0",
    reviewDate:  "2026-03-30",
    status:  "Due Review",
    acked:  5,
    roles:  [
      "manager",
      "superintendent"
    ],
    description:  "Ensures all staff who have contact with vulnerable adults or children have the appropriate Disclosure and Barring Service (DBS) clearance. Enhanced DBS checks are required for staff delivering clinical services or supervising vulnerable individuals. The pharmacy must not allow uncleared staff to work unsupervised in roles requiring DBS. Follows DBS guidance and the Safeguarding Vulnerable Groups Act 2006.",
    keyPoints:  [
      "Require enhanced DBS checks for all staff in patient-facing or clinical service roles",
      "Process DBS applications before the new starter begins patient-facing duties",
      "Do not allow uncleared staff to work unsupervised with vulnerable patients",
      "Renew DBS checks every 3 years or subscribe to the DBS Update Service for continuous checking",
      "Record DBS certificate numbers and dates in the staff record — do not retain copies of certificates",
      "Risk-assess any positive disclosures with HR and the superintendent before making employment decisions",
      "Ensure DBS clearance is verified for all locum pharmacists through their agency or directly",
      "Include DBS status in the pre-employment checklist and induction process"
    ],
    scope:  "This SOP applies to the Pharmacy Manager, the Superintendent Pharmacist at iPharmacy Direct. It covers all activities relating to dbs checks & safeguarding clearance and must be read, understood, and acknowledged before undertaking any related duties. Ensures all staff who have contact with vulnerable adults or children have the appropriate Disclosure and Barring Service (DBS) clearance.",
    references:  [
      "GPhC Standards for Pharmacy Professionals (2017)",
      "Employment Rights Act 1996",
      "ACAS Code of Practice on Disciplinary and Grievance Procedures",
      "Equality Act 2010",
      "Safeguarding Vulnerable Groups Act 2006",
      "DBS Filtering Rules Guidance"
    ],
    relatedSOPs:  [
      "SOP-025",
      "SOP-041",
      "SOP-043"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-01-30"
  },
  {
    id:  90,
    code:  "SOP-090",
    title:  "Student & Pre-Registration Supervision",
    category:  "HR & Training",
    version:  "1.3",
    reviewDate:  "2026-07-05",
    status:  "Current",
    acked:  4,
    roles:  [
      "pharmacist",
      "superintendent"
    ],
    description:  "Defines the supervision and training framework for pharmacy students and pre-registration trainees on placement. Effective supervision is essential for trainee development, patient safety, and meeting GPhC accreditation standards. The designated educational supervisor must be a registered pharmacist with appropriate training. Follows GPhC Initial Education and Training Standards.",
    keyPoints:  [
      "Assign a designated educational supervisor (registered pharmacist) for each trainee",
      "Develop a structured training plan aligned with the GPhC foundation training framework",
      "Conduct regular progress reviews (at least monthly) with documented feedback",
      "Ensure trainees are directly supervised when performing clinical tasks until signed off",
      "Gradually increase autonomy as competency is demonstrated and documented",
      "Provide access to learning resources, study time, and CPD opportunities",
      "Complete the GPhC workbook or e-portfolio evidence requirements within the placement period",
      "Escalate any concerns about trainee performance or conduct to the superintendent promptly"
    ],
    scope:  "This SOP applies to all pharmacists, the Superintendent Pharmacist at iPharmacy Direct. It covers all activities relating to student & pre-registration supervision and must be read, understood, and acknowledged before undertaking any related duties. Defines the supervision and training framework for pharmacy students and pre-registration trainees on placement.",
    references:  [
      "GPhC Standards for Pharmacy Professionals (2017)",
      "Employment Rights Act 1996",
      "ACAS Code of Practice on Disciplinary and Grievance Procedures",
      "Equality Act 2010",
      "GPhC Initial Education and Training Standards (2021)",
      "GPhC Foundation Training Framework"
    ],
    relatedSOPs:  [
      "SOP-042",
      "SOP-043",
      "SOP-041"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-05-04"
  },
  {
    id:  47,
    code:  "SOP-047",
    title:  "Confidential Waste Disposal",
    category:  "Facilities",
    version:  "1.7",
    reviewDate:  "2026-06-10",
    status:  "Current",
    acked:  10,
    roles:  [
      "all"
    ],
    description:  "Ensures all confidential patient and business documents are disposed of securely via approved waste contractors. Patient information must never be placed in general waste where it could be accessed by unauthorised persons. Confidential waste disposal supports GDPR compliance and patient trust. The pharmacy contracts with a licensed waste company that provides certificates of destruction.",
    keyPoints:  [
      "Place all confidential waste (patient labels, prescriptions, printouts) in designated locked bins",
      "Never put confidential material in general waste, recycling, or open waste bags",
      "Cross-cut shred small volumes on-site using the pharmacy shredder if immediate disposal is needed",
      "Ensure confidential waste bins are locked and only emptied by the approved contractor",
      "Verify the waste contractor provides a certificate of destruction after each collection",
      "Retain destruction certificates for a minimum of 2 years for audit purposes",
      "Report any suspected breach of confidential waste procedures immediately",
      "Review confidential waste arrangements annually as part of the GDPR compliance audit"
    ],
    scope:  "This SOP applies to all pharmacy staff at iPharmacy Direct. It covers all activities relating to confidential waste disposal and must be read, understood, and acknowledged before undertaking any related duties. Ensures all confidential patient and business documents are disposed of securely via approved waste contractors.",
    references:  [
      "GPhC Standards for Registered Pharmacies (2018)",
      "Environmental Protection Act 1990",
      "Workplace (Health, Safety and Welfare) Regulations 1992",
      "Health and Safety at Work etc. Act 1974",
      "UK GDPR (Regulation (EU) 2016/679 as retained)",
      "ICO Guide to the UK GDPR"
    ],
    relatedSOPs:  [
      "SOP-028",
      "SOP-091",
      "SOP-048"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-03-10"
  },
  {
    id:  48,
    code:  "SOP-048",
    title:  "Premises Maintenance & Cleaning",
    category:  "Facilities",
    version:  "2.1",
    reviewDate:  "2026-03-20",
    status:  "Due Review",
    acked:  8,
    roles:  [
      "manager",
      "stock_assistant"
    ],
    description:  "Covers the cleaning schedule, maintenance reporting, and standards required to keep the pharmacy premises GPhC-compliant. Clean and well-maintained premises are essential for patient safety, professional standards, and regulatory compliance. The dispensary must be cleaned daily and the whole premises inspected weekly. Maintenance issues must be reported and resolved promptly.",
    keyPoints:  [
      "Follow the daily cleaning checklist: dispensary surfaces, consultation room, customer area, and toilets",
      "Complete the weekly cleaning tasks: floors, shelving, fridge exterior, and windows",
      "Report maintenance issues (leaks, damage, equipment faults) to the manager using the maintenance log",
      "Ensure the dispensary is clean, uncluttered, and organised at all times",
      "Schedule a deep clean of the entire premises quarterly using professional cleaners",
      "Maintain cleaning product COSHH assessments and safety data sheets",
      "Record all cleaning activities on the signed cleaning schedule displayed in the staff area",
      "Include premises condition in the monthly manager walkthrough inspection"
    ],
    scope:  "This SOP applies to the Pharmacy Manager, stock assistants at iPharmacy Direct. It covers all activities relating to premises maintenance & cleaning and must be read, understood, and acknowledged before undertaking any related duties. Covers the cleaning schedule, maintenance reporting, and standards required to keep the pharmacy premises GPhC-compliant.",
    references:  [
      "GPhC Standards for Registered Pharmacies (2018)",
      "Environmental Protection Act 1990",
      "Workplace (Health, Safety and Welfare) Regulations 1992",
      "Health and Safety at Work etc. Act 1974",
      "GPhC Standards for Registered Pharmacies, Principle 4"
    ],
    relatedSOPs:  [
      "SOP-050",
      "SOP-035",
      "SOP-093"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2024-11-20"
  },
  {
    id:  49,
    code:  "SOP-049",
    title:  "Pest Control Protocol",
    category:  "Facilities",
    version:  "1.0",
    reviewDate:  "2026-10-15",
    status:  "Current",
    acked:  6,
    roles:  [
      "manager",
      "stock_assistant"
    ],
    description:  "Defines the prevention, monitoring, and response procedures for pest control within the pharmacy premises. Pest contamination of medicines could cause serious patient harm and regulatory consequences. The pharmacy maintains a contract with a licensed pest control provider for preventive visits. Any signs of pest activity must be reported and investigated immediately.",
    keyPoints:  [
      "Maintain an active pest control contract with an approved provider for regular inspections",
      "Store all food waste securely in sealed bins and remove from the premises daily",
      "Keep doors and windows closed or fitted with fly screens during warmer months",
      "Report any signs of pest activity (droppings, gnaw marks, live insects) to the manager immediately",
      "Quarantine any stock that may have been contaminated by pests and arrange disposal",
      "Document all pest control visits, findings, and treatments in the pest control log",
      "Seal any gaps in walls, floors, or around pipes that could provide pest entry points",
      "Review pest control arrangements annually and after any infestation incident"
    ],
    scope:  "This SOP applies to the Pharmacy Manager, stock assistants at iPharmacy Direct. It covers all activities relating to pest control protocol and must be read, understood, and acknowledged before undertaking any related duties. Defines the prevention, monitoring, and response procedures for pest control within the pharmacy premises.",
    references:  [
      "GPhC Standards for Registered Pharmacies (2018)",
      "Environmental Protection Act 1990",
      "Workplace (Health, Safety and Welfare) Regulations 1992",
      "Health and Safety at Work etc. Act 1974",
      "Prevention of Damage by Pests Act 1949",
      "Food Safety Act 1990 (as applicable)"
    ],
    relatedSOPs:  [
      "SOP-048",
      "SOP-050",
      "SOP-091"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-08-14"
  },
  {
    id:  50,
    code:  "SOP-050",
    title:  "Opening & Closing Procedures",
    category:  "Facilities",
    version:  "2.4",
    reviewDate:  "2026-05-25",
    status:  "Current",
    acked:  12,
    roles:  [
      "all"
    ],
    description:  "Details the daily procedures for safely opening and closing the pharmacy, including security, regulatory, and operational checks. Consistent opening and closing routines ensure the pharmacy is ready for business and secure when unattended. The RP must be present and signed in before the pharmacy opens to the public. All checklist items must be completed and signed off.",
    keyPoints:  [
      "RP must be present and signed into the RP register before the pharmacy opens",
      "Check the intruder alarm, CCTV, and premises security on arrival",
      "Record fridge temperatures and reset min/max thermometers at opening",
      "Display the RP notice and verify it shows the correct pharmacist name",
      "At closing: secure the CD cupboard, safe, and all controlled access areas",
      "Set the intruder alarm, lock all doors and windows, and verify CCTV is recording",
      "Complete and sign the opening/closing checklist — file in the daily records folder",
      "Report any security concerns or premises issues to the manager immediately"
    ],
    scope:  "This SOP applies to all pharmacy staff at iPharmacy Direct. It covers all activities relating to opening & closing procedures and must be read, understood, and acknowledged before undertaking any related duties. Details the daily procedures for safely opening and closing the pharmacy, including security, regulatory, and operational checks.",
    references:  [
      "GPhC Standards for Registered Pharmacies (2018)",
      "Environmental Protection Act 1990",
      "Workplace (Health, Safety and Welfare) Regulations 1992",
      "Health and Safety at Work etc. Act 1974",
      "ICO CCTV Code of Practice",
      "NSI/SSAIB Alarm Standards"
    ],
    relatedSOPs:  [
      "SOP-026",
      "SOP-020",
      "SOP-094"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-01-25"
  },
  {
    id:  51,
    code:  "SOP-051",
    title:  "Stock Rotation & Expiry Checks",
    category:  "Facilities",
    version:  "1.9",
    reviewDate:  "2026-07-01",
    status:  "Current",
    acked:  11,
    roles:  [
      "technician",
      "dispenser",
      "stock_assistant"
    ],
    description:  "Ensures stock is rotated correctly and short-dated or expired items are identified and removed promptly. Dispensing an expired medicine is a serious patient safety incident and a professional offence. FEFO (First Expiry, First Out) is the fundamental principle for all stock management. Monthly expiry checks are mandatory with documented records.",
    keyPoints:  [
      "Apply FEFO (First Expiry, First Out) principle when shelving all deliveries",
      "Conduct monthly expiry date checks across all stock areas including the fridge",
      "Remove expired stock immediately, quarantine, and arrange return or destruction",
      "Mark short-dated items (within 3 months of expiry) with expiry date stickers",
      "Record all expired and short-dated stock removed in the expiry check log",
      "Attempt to return short-dated stock to suppliers for credit before expiry",
      "Focus expiry checks on high-risk areas: fridge, CD cupboard, and slow-moving lines",
      "Review expiry check data quarterly to identify patterns and adjust ordering accordingly"
    ],
    scope:  "This SOP applies to pharmacy technicians, dispensers, stock assistants at iPharmacy Direct. It covers all activities relating to stock rotation & expiry checks and must be read, understood, and acknowledged before undertaking any related duties. Ensures stock is rotated correctly and short-dated or expired items are identified and removed promptly.",
    references:  [
      "GPhC Standards for Registered Pharmacies (2018)",
      "Environmental Protection Act 1990",
      "Workplace (Health, Safety and Welfare) Regulations 1992",
      "Health and Safety at Work etc. Act 1974",
      "GPhC Standards for Registered Pharmacies, Principle 4",
      "MHRA Defective Medicines Reporting Guidance"
    ],
    relatedSOPs:  [
      "SOP-048",
      "SOP-091",
      "SOP-010"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-03-31"
  },
  {
    id:  91,
    code:  "SOP-091",
    title:  "Pharmaceutical Waste Management",
    category:  "Facilities",
    version:  "1.4",
    reviewDate:  "2026-08-15",
    status:  "Current",
    acked:  9,
    roles:  [
      "all"
    ],
    description:  "Covers the segregation, storage, and disposal of all pharmaceutical waste streams including general, hazardous, cytotoxic, and clinical waste. Incorrect waste disposal can harm the environment and breach environmental regulations. The pharmacy must use licensed waste carriers and maintain a full audit trail. Complies with the Environmental Protection Act 1990 and Hazardous Waste Regulations.",
    keyPoints:  [
      "Segregate pharmaceutical waste into the correct waste stream: general (blue lid), hazardous (yellow lid), cytotoxic (purple lid)",
      "Dispose of sharps in approved sharps containers — seal when three-quarters full",
      "Never place pharmaceutical waste in domestic waste bins or drains",
      "Store waste securely in the designated area away from public access and medicines stock",
      "Use only licensed waste carriers — verify their waste carrier licence annually",
      "Complete waste transfer notes for each collection and retain for 3 years (6 years for hazardous waste)",
      "Ensure all staff can identify which waste stream applies to common items",
      "Review waste management procedures annually and update staff training accordingly"
    ],
    scope:  "This SOP applies to all pharmacy staff at iPharmacy Direct. It covers all activities relating to pharmaceutical waste management and must be read, understood, and acknowledged before undertaking any related duties. Covers the segregation, storage, and disposal of all pharmaceutical waste streams including general, hazardous, cytotoxic, and clinical waste.",
    references:  [
      "GPhC Standards for Registered Pharmacies (2018)",
      "Environmental Protection Act 1990",
      "Workplace (Health, Safety and Welfare) Regulations 1992",
      "Health and Safety at Work etc. Act 1974",
      "Hazardous Waste Regulations 2005",
      "MHRA Guidance on Disposal of Pharmaceutical Waste"
    ],
    relatedSOPs:  [
      "SOP-047",
      "SOP-058",
      "SOP-035"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-06-14"
  },
  {
    id:  92,
    code:  "SOP-092",
    title:  "Utilities Management",
    category:  "Facilities",
    version:  "1.0",
    reviewDate:  "2026-11-25",
    status:  "Current",
    acked:  5,
    roles:  [
      "manager"
    ],
    description:  "Covers the management of essential utilities including electricity, gas, water, and heating/cooling systems. Utility failures can impact medicine storage conditions, patient safety, and pharmacy operations. Emergency contact numbers and isolation point locations must be known by key staff. Regular maintenance prevents unplanned failures.",
    keyPoints:  [
      "Maintain a record of all utility supplier contacts and account numbers",
      "Ensure all staff know the location of emergency isolation points (water, gas, electricity)",
      "Report utility faults immediately to the manager and contact the relevant supplier",
      "Monitor fridge and premises temperatures during heating or cooling system failures",
      "Arrange annual servicing of heating, ventilation, and air conditioning systems",
      "Maintain adequate lighting levels in all areas — replace failed bulbs promptly",
      "Implement energy-saving practices where they do not compromise medicine storage or safety",
      "Include utility and environmental checks in the monthly premises inspection"
    ],
    scope:  "This SOP applies to the Pharmacy Manager at iPharmacy Direct. It covers all activities relating to utilities management and must be read, understood, and acknowledged before undertaking any related duties. Covers the management of essential utilities including electricity, gas, water, and heating/cooling systems.",
    references:  [
      "GPhC Standards for Registered Pharmacies (2018)",
      "Environmental Protection Act 1990",
      "Workplace (Health, Safety and Welfare) Regulations 1992",
      "Health and Safety at Work etc. Act 1974",
      "Electricity at Work Regulations 1989",
      "IET Wiring Regulations (BS 7671)"
    ],
    relatedSOPs:  [
      "SOP-048",
      "SOP-050",
      "SOP-083"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-09-24"
  },
  {
    id:  93,
    code:  "SOP-093",
    title:  "Signage & Public Information",
    category:  "Facilities",
    version:  "1.0",
    reviewDate:  "2026-04-05",
    status:  "Due Review",
    acked:  7,
    roles:  [
      "manager"
    ],
    description:  "Ensures all required pharmacy signage is current, compliant, and appropriately displayed. Mandatory signage includes the GPhC registration certificate, RP notice, CQC rating, opening hours, and emergency contact information. Clear signage supports patient safety and regulatory compliance. All signage must be reviewed regularly for accuracy.",
    keyPoints:  [
      "Display the GPhC premises registration certificate in a prominent position",
      "Ensure the Responsible Pharmacist notice is visible to the public and shows the current RP",
      "Display the CQC registration certificate and most recent inspection rating",
      "Post accurate opening hours visible from outside the pharmacy",
      "Display the NHS complaints procedure notice and NHS 111 information",
      "Include health promotion materials and service information in the public area",
      "Review all signage monthly for accuracy and update immediately when details change",
      "Ensure fire exit signs, safety notices, and COSHH hazard signs are displayed as required"
    ],
    scope:  "This SOP applies to the Pharmacy Manager at iPharmacy Direct. It covers all activities relating to signage & public information and must be read, understood, and acknowledged before undertaking any related duties. Ensures all required pharmacy signage is current, compliant, and appropriately displayed.",
    references:  [
      "GPhC Standards for Registered Pharmacies (2018)",
      "Environmental Protection Act 1990",
      "Workplace (Health, Safety and Welfare) Regulations 1992",
      "Health and Safety at Work etc. Act 1974",
      "CQC Registration Regulations 2009",
      "CQC Key Lines of Enquiry Framework"
    ],
    relatedSOPs:  [
      "SOP-050",
      "SOP-048",
      "SOP-095"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-02-05"
  },
  {
    id:  94,
    code:  "SOP-094",
    title:  "Premises Security",
    category:  "Facilities",
    version:  "1.3",
    reviewDate:  "2026-09-05",
    status:  "Current",
    acked:  8,
    roles:  [
      "manager",
      "superintendent"
    ],
    description:  "Defines the physical security measures for the pharmacy premises, including access control, key management, and intruder detection. Pharmacy premises contain Controlled Drugs, cash, and sensitive patient data requiring robust security. Security measures must be proportionate to risk and regularly reviewed. Complies with Home Office CD security requirements and insurer conditions.",
    keyPoints:  [
      "Maintain a current keyholder list and issue keys only to authorised personnel",
      "Set and test the intruder alarm system daily at closing — record any faults",
      "Ensure the pharmacy safe is bolted down and the combination known only to authorised staff",
      "Lock the dispensary hatch or shutter when the pharmacist is absent from the dispensary",
      "Install and maintain adequate security lighting for entrances and the car park",
      "Review CCTV coverage and ensure cameras cover all key areas including the CD cupboard",
      "Report any security breaches, break-ins, or attempted thefts to police and the superintendent immediately",
      "Conduct an annual security review and implement insurer recommendations"
    ],
    scope:  "This SOP applies to the Pharmacy Manager, the Superintendent Pharmacist at iPharmacy Direct. It covers all activities relating to premises security and must be read, understood, and acknowledged before undertaking any related duties. Defines the physical security measures for the pharmacy premises, including access control, key management, and intruder detection.",
    references:  [
      "GPhC Standards for Registered Pharmacies (2018)",
      "Environmental Protection Act 1990",
      "Workplace (Health, Safety and Welfare) Regulations 1992",
      "Health and Safety at Work etc. Act 1974",
      "ICO CCTV Code of Practice",
      "NSI/SSAIB Alarm Standards"
    ],
    relatedSOPs:  [
      "SOP-050",
      "SOP-065",
      "SOP-104"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-07-04"
  },
  {
    id:  95,
    code:  "SOP-095",
    title:  "Alarm Systems & Monitoring",
    category:  "Facilities",
    version:  "1.1",
    reviewDate:  "2026-12-15",
    status:  "Current",
    acked:  6,
    roles:  [
      "manager"
    ],
    description:  "Covers the operation, testing, and maintenance of intruder alarm, fire alarm, and panic alarm systems. Alarm systems are critical for protecting staff, patients, medicines, and premises. Regular testing ensures systems function correctly when needed. Monitoring contracts must be maintained with approved alarm receiving centres.",
    keyPoints:  [
      "Test the intruder alarm system weekly and maintain annual service contracts",
      "Test the fire alarm weekly using a different call point each week — record results",
      "Test panic alarms monthly and ensure all staff know their locations and how to activate them",
      "Maintain monitoring contracts with NSI or SSAIB-approved alarm receiving centres",
      "Keep the keyholder contact list with the alarm company up to date at all times",
      "Respond to alarm activations according to the agreed response procedure",
      "Record all alarm activations, tests, faults, and engineer visits in the alarm log",
      "Review alarm system adequacy annually and upgrade as recommended by the insurer or engineer"
    ],
    scope:  "This SOP applies to the Pharmacy Manager at iPharmacy Direct. It covers all activities relating to alarm systems & monitoring and must be read, understood, and acknowledged before undertaking any related duties. Covers the operation, testing, and maintenance of intruder alarm, fire alarm, and panic alarm systems.",
    references:  [
      "GPhC Standards for Registered Pharmacies (2018)",
      "Environmental Protection Act 1990",
      "Workplace (Health, Safety and Welfare) Regulations 1992",
      "Health and Safety at Work etc. Act 1974",
      "Regulatory Reform (Fire Safety) Order 2005",
      "HM Government Fire Safety Guidance"
    ],
    relatedSOPs:  [
      "SOP-094",
      "SOP-034",
      "SOP-083"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-10-14"
  },
  {
    id:  52,
    code:  "SOP-052",
    title:  "Delivery Run Management",
    category:  "Delivery",
    version:  "1.6",
    reviewDate:  "2026-08-20",
    status:  "Current",
    acked:  8,
    roles:  [
      "driver",
      "manager"
    ],
    description:  "Manages the planning, execution, and documentation of prescription delivery runs to patients. The delivery service extends pharmacy care to patients who cannot collect in person. All deliveries must be documented with proof of receipt or attempted delivery. Delivery staff must be trained in patient confidentiality and medicine handling.",
    keyPoints:  [
      "Plan an efficient delivery route before departure — prioritise fridge items and urgent medicines",
      "Verify all bags are sealed, labelled with correct patient name and address, and contain all items",
      "Obtain the patient's signature on the delivery log as proof of receipt",
      "For safe place deliveries, record the location and take a photograph where agreed",
      "Return all undelivered items to the pharmacy and record the reason for failed delivery",
      "Maintain the delivery vehicle in a clean condition suitable for transporting medicines",
      "Do not leave medicines unattended in the vehicle — lock the vehicle at every stop",
      "Submit the completed delivery log to the dispensary on return for filing"
    ],
    scope:  "This SOP applies to delivery drivers, the Pharmacy Manager at iPharmacy Direct. It covers all activities relating to delivery run management and must be read, understood, and acknowledged before undertaking any related duties. Manages the planning, execution, and documentation of prescription delivery runs to patients.",
    references:  [
      "Human Medicines Regulations 2012",
      "GPhC Standards for Registered Pharmacies (2018)",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "Health and Safety at Work etc. Act 1974"
    ],
    relatedSOPs:  [
      "SOP-054",
      "SOP-053",
      "SOP-055"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-05-19"
  },
  {
    id:  53,
    code:  "SOP-053",
    title:  "Cold Chain Delivery",
    category:  "Delivery",
    version:  "1.3",
    reviewDate:  "2026-04-15",
    status:  "Due Review",
    acked:  5,
    roles:  [
      "driver",
      "pharmacist"
    ],
    description:  "Ensures fridge items maintain the required 2-8°C range throughout the delivery process. Cold chain failures can render vaccines, insulin, and biologics ineffective. Validated cool boxes with conditioned ice packs are required for all fridge item deliveries. Temperature monitoring during transit provides evidence of cold chain integrity.",
    keyPoints:  [
      "Pack fridge items in a validated cool box with pre-conditioned ice packs",
      "Record the cool box temperature before departure using a validated thermometer",
      "Deliver fridge items first on the delivery route to minimise time out of the fridge",
      "Do not leave the cool box in direct sunlight or in a hot vehicle for extended periods",
      "Monitor and record the cool box temperature on return to the pharmacy",
      "Return any undelivered fridge items to the pharmacy fridge immediately upon return",
      "Report any suspected cold chain breaches to the pharmacist for assessment",
      "Validate cool box performance annually and replace equipment that fails to maintain 2-8°C"
    ],
    scope:  "This SOP applies to delivery drivers, all pharmacists at iPharmacy Direct. It covers all activities relating to cold chain delivery and must be read, understood, and acknowledged before undertaking any related duties. Ensures fridge items maintain the required 2-8°C range throughout the delivery process.",
    references:  [
      "Human Medicines Regulations 2012",
      "GPhC Standards for Registered Pharmacies (2018)",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "Health and Safety at Work etc. Act 1974",
      "PHE Green Book: Immunisation Against Infectious Diseases",
      "NHS England Vaccination Standards"
    ],
    relatedSOPs:  [
      "SOP-020",
      "SOP-127",
      "SOP-052"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-02-15"
  },
  {
    id:  54,
    code:  "SOP-054",
    title:  "Patient ID Verification on Delivery",
    category:  "Delivery",
    version:  "1.1",
    reviewDate:  "2026-11-01",
    status:  "Current",
    acked:  7,
    roles:  [
      "driver"
    ],
    description:  "Defines how drivers verify patient identity when handing over prescription deliveries at the door. Correct identification prevents medicines being given to the wrong person. Enhanced verification is required for Controlled Drugs and high-risk medicines. The delivery driver is responsible for the handover until medicines are accepted by the correct recipient.",
    keyPoints:  [
      "Confirm the patient's name and full address before handing over any medicines",
      "Ask the patient to state their date of birth as a second identity check",
      "Request photo ID for Controlled Drug deliveries or when the patient is unknown",
      "Do not leave medicines with children under 16 or with unverified third parties",
      "Record the method of ID verification and the recipient's name on the delivery log",
      "If the patient cannot provide adequate identification, return the medicines to the pharmacy",
      "Handle patient information confidentially — do not discuss medicines on the doorstep with others present",
      "Report any concerns about patient safety or welfare observed during delivery"
    ],
    scope:  "This SOP applies to delivery drivers at iPharmacy Direct. It covers all activities relating to patient id verification on delivery and must be read, understood, and acknowledged before undertaking any related duties. Defines how drivers verify patient identity when handing over prescription deliveries at the door.",
    references:  [
      "Human Medicines Regulations 2012",
      "GPhC Standards for Registered Pharmacies (2018)",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "Health and Safety at Work etc. Act 1974"
    ],
    relatedSOPs:  [
      "SOP-052",
      "SOP-096",
      "SOP-124"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-08-31"
  },
  {
    id:  55,
    code:  "SOP-055",
    title:  "Failed Delivery Protocol",
    category:  "Delivery",
    version:  "1.0",
    reviewDate:  "2026-02-10",
    status:  "Overdue",
    acked:  4,
    roles:  [
      "driver",
      "manager"
    ],
    description:  "Covers the procedure when a delivery cannot be completed, including reattempt scheduling and patient notification. Failed deliveries delay patient access to their medicines and must be resolved promptly. Common reasons include patient not home, address not found, or access issues. A systematic approach ensures no failed deliveries are forgotten or lost.",
    keyPoints:  [
      "Leave a calling card with the pharmacy contact details and a message to call",
      "Attempt to call the patient by phone before leaving the area",
      "Record the failed delivery reason on the delivery log with date, time, and address",
      "Return all undelivered items to the pharmacy and hand to the dispensary team",
      "The dispensary team contacts the patient to arrange redelivery or collection",
      "Reattempt delivery the next working day unless the patient arranges alternative collection",
      "For fridge items, return to the pharmacy fridge immediately and note the out-of-fridge time",
      "Escalate persistent failed deliveries (3+ attempts) to the manager for patient contact review"
    ],
    scope:  "This SOP applies to delivery drivers, the Pharmacy Manager at iPharmacy Direct. It covers all activities relating to failed delivery protocol and must be read, understood, and acknowledged before undertaking any related duties. Covers the procedure when a delivery cannot be completed, including reattempt scheduling and patient notification.",
    references:  [
      "Human Medicines Regulations 2012",
      "GPhC Standards for Registered Pharmacies (2018)",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "Health and Safety at Work etc. Act 1974",
      "NCSC Cyber Essentials Requirements",
      "NHS Digital Data Security Standards"
    ],
    relatedSOPs:  [
      "SOP-052",
      "SOP-054",
      "SOP-097"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2024-12-10"
  },
  {
    id:  96,
    code:  "SOP-096",
    title:  "Controlled Drug Delivery",
    category:  "Delivery",
    version:  "1.0",
    reviewDate:  "2026-06-05",
    status:  "Current",
    acked:  5,
    roles:  [
      "driver",
      "pharmacist"
    ],
    description:  "Covers the specific requirements for delivering Controlled Drugs to patients, which carry additional security and documentation obligations. CD deliveries require enhanced ID verification, secure transport, and a documented chain of custody. Only trained delivery staff may transport CDs. The pharmacist must authorise each CD delivery and verify the security arrangements.",
    keyPoints:  [
      "The pharmacist must authorise each CD delivery and verify the security packaging before dispatch",
      "Seal CD items in a tamper-evident bag separate from other medicines",
      "The driver must keep CDs on their person or in a locked section of the vehicle at all times",
      "Deliver CD items directly to the named patient only — no safe place delivery for CDs",
      "Verify patient identity using photo ID before handing over CD items",
      "Obtain the patient signature on the CD delivery log with date and time",
      "Return any undelivered CDs to the pharmacist immediately on return to the pharmacy",
      "Record all CD deliveries in the pharmacy delivery log with cross-reference to the CD register"
    ],
    scope:  "This SOP applies to delivery drivers, all pharmacists at iPharmacy Direct. It covers all activities relating to controlled drug delivery and must be read, understood, and acknowledged before undertaking any related duties. Covers the specific requirements for delivering Controlled Drugs to patients, which carry additional security and documentation obligations.",
    references:  [
      "Human Medicines Regulations 2012",
      "GPhC Standards for Registered Pharmacies (2018)",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "Health and Safety at Work etc. Act 1974",
      "ICO CCTV Code of Practice",
      "NSI/SSAIB Alarm Standards"
    ],
    relatedSOPs:  [
      "SOP-011",
      "SOP-054",
      "SOP-128"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-04-04"
  },
  {
    id:  97,
    code:  "SOP-097",
    title:  "Weekend & Bank Holiday Delivery",
    category:  "Delivery",
    version:  "1.0",
    reviewDate:  "2026-10-01",
    status:  "Current",
    acked:  6,
    roles:  [
      "driver",
      "manager"
    ],
    description:  "Defines the modified delivery arrangements for weekends and bank holidays when staffing and operating hours differ. Patients requiring urgent medicines must still receive a delivery service during reduced hours. Weekend delivery runs are typically shorter and prioritise urgent and fridge items. Additional lone working precautions apply to weekend delivery drivers.",
    keyPoints:  [
      "Publish the weekend and bank holiday delivery schedule in advance for patient planning",
      "Prioritise urgent medicines, fridge items, and CD supervised consumption patients",
      "Ensure lone working risk assessments are completed for weekend delivery drivers",
      "Drivers must carry a charged mobile phone and check in with the pharmacy at start and end of the run",
      "Reduce the delivery area if necessary to maintain safe working hours",
      "Record all weekend deliveries on the standard delivery log for Monday reconciliation",
      "Ensure the pharmacist is available by phone for any clinical queries during the delivery run",
      "Review weekend delivery demand quarterly and adjust resources as needed"
    ],
    scope:  "This SOP applies to delivery drivers, the Pharmacy Manager at iPharmacy Direct. It covers all activities relating to weekend & bank holiday delivery and must be read, understood, and acknowledged before undertaking any related duties. Defines the modified delivery arrangements for weekends and bank holidays when staffing and operating hours differ.",
    references:  [
      "Human Medicines Regulations 2012",
      "GPhC Standards for Registered Pharmacies (2018)",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "Health and Safety at Work etc. Act 1974",
      "PHE Cold Chain Guidance for Immunisation Programmes",
      "MHRA Guidance on Pharmaceutical Cold Chain"
    ],
    relatedSOPs:  [
      "SOP-052",
      "SOP-055",
      "SOP-044"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-07-31"
  },
  {
    id:  98,
    code:  "SOP-098",
    title:  "Care Home Delivery",
    category:  "Delivery",
    version:  "1.5",
    reviewDate:  "2026-07-20",
    status:  "Current",
    acked:  7,
    roles:  [
      "driver",
      "pharmacist",
      "technician"
    ],
    description:  "Covers the specific requirements for delivering medicines to care homes, including documentation, handover protocols, and MAR chart management. Care home deliveries involve bulk quantities for multiple residents and require meticulous checking and documentation. The pharmacy has contractual obligations to the care home for timely and accurate supply. Follows NICE SC1 managing medicines in care homes guidance.",
    keyPoints:  [
      "Check all care home bags against the delivery manifest before dispatch",
      "Separate each resident's medicines clearly with their name and room number",
      "Include updated MAR charts with any new or changed medicines for each delivery cycle",
      "Hand delivery to a designated care home staff member — obtain their signature and printed name",
      "The care home staff member must check the delivery against the manifest at handover",
      "Report any discrepancies at the care home immediately to the pharmacy for resolution",
      "Return any discontinued or returned medicines from the care home to the pharmacy for disposal",
      "Conduct quarterly medication reviews for care home residents in collaboration with the GP"
    ],
    scope:  "This SOP applies to delivery drivers, all pharmacists, pharmacy technicians at iPharmacy Direct. It covers all activities relating to care home delivery and must be read, understood, and acknowledged before undertaking any related duties. Covers the specific requirements for delivering medicines to care homes, including documentation, handover protocols, and MAR chart management.",
    references:  [
      "Human Medicines Regulations 2012",
      "GPhC Standards for Registered Pharmacies (2018)",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "Health and Safety at Work etc. Act 1974",
      "NICE SC1: Managing Medicines in Care Homes (2014)",
      "NHS England Care Home Pharmacy Service Guidance"
    ],
    relatedSOPs:  [
      "SOP-052",
      "SOP-010",
      "SOP-054"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-04-19"
  },
  {
    id:  99,
    code:  "SOP-099",
    title:  "Delivery Returns Handling",
    category:  "Delivery",
    version:  "1.0",
    reviewDate:  "2026-05-10",
    status:  "Current",
    acked:  5,
    roles:  [
      "driver",
      "dispenser"
    ],
    description:  "Defines how medicines returned during delivery runs are handled, documented, and processed back at the pharmacy. Delivery drivers may receive returned medicines from patients during their rounds. These must be handled correctly to maintain audit trails and prevent re-entry into stock. Includes handling of returned CDs which require separate processing.",
    keyPoints:  [
      "Accept returned medicines from patients during delivery runs without requiring a reason",
      "Place returned medicines in a separate, clearly labelled bag — do not mix with outgoing deliveries",
      "Record returned items on the delivery log with patient name, items, and reason if given",
      "Hand all returns to the dispensary team on return to the pharmacy",
      "Process non-CD returns through the returned medicines procedure (SOP-058)",
      "Process CD returns through the patient-returned CDs procedure (SOP-064)",
      "Never re-issue or re-dispense any returned medicines regardless of condition",
      "Inform the pharmacist if returns suggest non-adherence or patient safety concerns"
    ],
    scope:  "This SOP applies to delivery drivers, dispensers at iPharmacy Direct. It covers all activities relating to delivery returns handling and must be read, understood, and acknowledged before undertaking any related duties. Defines how medicines returned during delivery runs are handled, documented, and processed back at the pharmacy.",
    references:  [
      "Human Medicines Regulations 2012",
      "GPhC Standards for Registered Pharmacies (2018)",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "Health and Safety at Work etc. Act 1974",
      "Environmental Protection Act 1990",
      "MHRA Guidance on Disposal of Returned Medicines"
    ],
    relatedSOPs:  [
      "SOP-058",
      "SOP-052",
      "SOP-064"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-03-10"
  },
  {
    id:  100,
    code:  "SOP-100",
    title:  "PMR System Management",
    category:  "IT & Systems",
    version:  "2.0",
    reviewDate:  "2026-09-20",
    status:  "Current",
    acked:  10,
    roles:  [
      "pharmacist",
      "technician",
      "dispenser",
      "manager"
    ],
    description:  "Governs the use, maintenance, and administration of the Patient Medication Record (PMR) system, the pharmacy's core clinical and dispensing system. The PMR holds sensitive patient data and supports safe dispensing, clinical decision-making, and NHS reimbursement. System integrity and data accuracy are critical. All users must be trained and have role-appropriate access levels.",
    keyPoints:  [
      "Assign user accounts with role-appropriate access levels — no shared logins",
      "Lock or log out of the PMR when leaving the terminal unattended",
      "Enter patient data accurately and keep records updated with current information",
      "Report system errors, downtime, or data anomalies to the system administrator immediately",
      "Maintain the PMR supplier support contract and know the helpdesk contact details",
      "Install system updates and patches as directed by the supplier in a timely manner",
      "Back up the PMR data daily in accordance with the data backup SOP (SOP-101)",
      "Review user access rights quarterly and remove accounts for leavers promptly"
    ],
    scope:  "This SOP applies to all pharmacists, pharmacy technicians, dispensers, the Pharmacy Manager at iPharmacy Direct. It covers all activities relating to pmr system management and must be read, understood, and acknowledged before undertaking any related duties. Governs the use, maintenance, and administration of the Patient Medication Record (PMR) system, the pharmacy's core clinical and dispensing system.",
    references:  [
      "UK General Data Protection Regulation (UK GDPR)",
      "Data Protection Act 2018",
      "NHS Digital Data Security and Protection Toolkit",
      "Cyber Essentials (NCSC)",
      "NCSC Cyber Essentials Requirements",
      "NHS Digital Data Security Standards"
    ],
    relatedSOPs:  [
      "SOP-101",
      "SOP-107",
      "SOP-102"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-05-19"
  },
  {
    id:  101,
    code:  "SOP-101",
    title:  "Data Backup & Recovery",
    category:  "IT & Systems",
    version:  "1.3",
    reviewDate:  "2026-06-15",
    status:  "Current",
    acked:  8,
    roles:  [
      "manager",
      "superintendent"
    ],
    description:  "Ensures all critical pharmacy data is backed up regularly and can be recovered in the event of system failure, data loss, or cyber attack. Patient records, dispensing history, and financial data must be protected against loss. The backup strategy must include both on-site and off-site copies. Complies with UK GDPR requirements for data availability and integrity.",
    keyPoints:  [
      "Perform automated daily backups of the PMR system and all critical data",
      "Maintain at least one off-site or cloud backup copy in addition to the local backup",
      "Verify backup integrity by performing a test restore at least quarterly",
      "Encrypt all backup media and transfers to protect patient data in transit and at rest",
      "Retain backups for a minimum period aligned with the data retention policy",
      "Document the recovery procedure and ensure at least two staff members can perform it",
      "In the event of data loss, notify the superintendent and DPO immediately",
      "Review backup and recovery procedures annually and after any data loss incident"
    ],
    scope:  "This SOP applies to the Pharmacy Manager, the Superintendent Pharmacist at iPharmacy Direct. It covers all activities relating to data backup & recovery and must be read, understood, and acknowledged before undertaking any related duties. Ensures all critical pharmacy data is backed up regularly and can be recovered in the event of system failure, data loss, or cyber attack.",
    references:  [
      "UK General Data Protection Regulation (UK GDPR)",
      "Data Protection Act 2018",
      "NHS Digital Data Security and Protection Toolkit",
      "Cyber Essentials (NCSC)",
      "UK GDPR (Regulation (EU) 2016/679 as retained)",
      "ICO Guide to the UK GDPR"
    ],
    relatedSOPs:  [
      "SOP-100",
      "SOP-079",
      "SOP-103"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-04-14"
  },
  {
    id:  102,
    code:  "SOP-102",
    title:  "EPS Troubleshooting & Downtime",
    category:  "IT & Systems",
    version:  "1.5",
    reviewDate:  "2026-04-25",
    status:  "Due Review",
    acked:  9,
    roles:  [
      "pharmacist",
      "technician",
      "dispenser"
    ],
    description:  "Provides troubleshooting guidance and contingency procedures for Electronic Prescription Service failures and downtime. EPS connectivity issues prevent the pharmacy from downloading electronic prescriptions. Contingency arrangements must be in place to ensure patients still receive their medicines. Covers common error codes, escalation paths, and manual workarounds.",
    keyPoints:  [
      "Check the N3/HSCN network connection and Spine connectivity as the first troubleshooting step",
      "Restart the EPS module and PMR system if the initial checks do not resolve the issue",
      "Contact the PMR supplier helpdesk if the issue persists after basic troubleshooting",
      "Switch to contingency arrangements: accept paper prescriptions (FP10) during EPS downtime",
      "Inform patients of the issue and offer to process their prescription manually",
      "Record all EPS downtime incidents with start time, duration, and resolution in the IT log",
      "Process any queued electronic prescriptions as soon as service is restored",
      "Escalate prolonged outages (over 2 hours) to NHS Digital and the superintendent"
    ],
    scope:  "This SOP applies to all pharmacists, pharmacy technicians, dispensers at iPharmacy Direct. It covers all activities relating to eps troubleshooting & downtime and must be read, understood, and acknowledged before undertaking any related duties. Provides troubleshooting guidance and contingency procedures for Electronic Prescription Service failures and downtime.",
    references:  [
      "UK General Data Protection Regulation (UK GDPR)",
      "Data Protection Act 2018",
      "NHS Digital Data Security and Protection Toolkit",
      "Cyber Essentials (NCSC)",
      "NHS Digital EPS Guidance",
      "NHS England EPS Contingency Procedures"
    ],
    relatedSOPs:  [
      "SOP-004",
      "SOP-100",
      "SOP-105"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-01-25"
  },
  {
    id:  103,
    code:  "SOP-103",
    title:  "Cyber Security",
    category:  "IT & Systems",
    version:  "1.2",
    reviewDate:  "2026-11-30",
    status:  "Current",
    acked:  7,
    roles:  [
      "all"
    ],
    description:  "Establishes the pharmacy's cyber security practices to protect patient data, dispensing systems, and business operations from cyber threats. Pharmacies are increasingly targeted by ransomware, phishing, and data theft attacks. All staff have a role in maintaining cyber security through safe digital practices. Follows NHS Digital Cyber Essentials requirements and ICO guidance.",
    keyPoints:  [
      "Use strong, unique passwords for all systems — change them every 90 days",
      "Never share login credentials or write passwords where others can see them",
      "Do not open email attachments or click links from unknown or suspicious senders",
      "Report any suspected phishing emails, unusual system behaviour, or pop-ups immediately",
      "Install operating system and software updates promptly when notified",
      "Do not connect personal USB drives or devices to pharmacy computers",
      "Ensure antivirus software is installed, active, and updated on all pharmacy computers",
      "Complete annual cyber security awareness training as required by NHS Digital"
    ],
    scope:  "This SOP applies to all pharmacy staff at iPharmacy Direct. It covers all activities relating to cyber security and must be read, understood, and acknowledged before undertaking any related duties. Establishes the pharmacy's cyber security practices to protect patient data, dispensing systems, and business operations from cyber threats.",
    references:  [
      "UK General Data Protection Regulation (UK GDPR)",
      "Data Protection Act 2018",
      "NHS Digital Data Security and Protection Toolkit",
      "Cyber Essentials (NCSC)",
      "ICO CCTV Code of Practice",
      "NSI/SSAIB Alarm Standards"
    ],
    relatedSOPs:  [
      "SOP-107",
      "SOP-101",
      "SOP-130"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-09-29"
  },
  {
    id:  104,
    code:  "SOP-104",
    title:  "CCTV Management",
    category:  "IT & Systems",
    version:  "1.1",
    reviewDate:  "2026-08-05",
    status:  "Current",
    acked:  6,
    roles:  [
      "manager",
      "superintendent"
    ],
    description:  "Covers the operation, data management, and compliance requirements for the pharmacy's CCTV system. CCTV supports security, CD cupboard monitoring, and incident investigation. As CCTV captures personal data, it must comply with UK GDPR and the ICO CCTV Code of Practice. Access to CCTV footage is restricted and must be logged.",
    keyPoints:  [
      "Display clear signage informing the public that CCTV is in operation",
      "Ensure CCTV cameras cover the dispensary, CD cupboard, entrance, and cash handling areas",
      "Retain CCTV footage for a maximum of 30 days unless required for an ongoing investigation",
      "Restrict access to CCTV footage to the manager, superintendent, and police upon request",
      "Log all access to CCTV footage with the date, time, person, and reason for access",
      "Respond to Subject Access Requests for CCTV footage within 30 days",
      "Maintain the CCTV system with annual servicing and ensure recording quality is adequate",
      "Review CCTV coverage and data retention practices annually as part of the GDPR audit"
    ],
    scope:  "This SOP applies to the Pharmacy Manager, the Superintendent Pharmacist at iPharmacy Direct. It covers all activities relating to cctv management and must be read, understood, and acknowledged before undertaking any related duties. Covers the operation, data management, and compliance requirements for the pharmacy's CCTV system.",
    references:  [
      "UK General Data Protection Regulation (UK GDPR)",
      "Data Protection Act 2018",
      "NHS Digital Data Security and Protection Toolkit",
      "Cyber Essentials (NCSC)",
      "UK GDPR (Regulation (EU) 2016/679 as retained)",
      "ICO Guide to the UK GDPR"
    ],
    relatedSOPs:  [
      "SOP-028",
      "SOP-094",
      "SOP-103"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-06-04"
  },
  {
    id:  105,
    code:  "SOP-105",
    title:  "N3/HSCN Network & Connectivity",
    category:  "IT & Systems",
    version:  "1.0",
    reviewDate:  "2026-10-10",
    status:  "Current",
    acked:  5,
    roles:  [
      "manager"
    ],
    description:  "Manages the pharmacy's connection to the NHS Health and Social Care Network (HSCN), which provides secure access to NHS systems including the Spine, EPS, and Summary Care Records. Network connectivity is essential for day-to-day dispensing operations. Outages must be managed through contingency arrangements. The network must be secured against unauthorised access.",
    keyPoints:  [
      "Maintain the HSCN connection contract and know the provider support contact details",
      "Monitor network connectivity and report any outages to the HSCN provider immediately",
      "Do not connect non-pharmacy devices to the HSCN network without IT approval",
      "Maintain network security with firewall, antivirus, and access controls as required",
      "Implement contingency arrangements for dispensing during network outages (see SOP-102)",
      "Ensure the router and network equipment are located in a secure, ventilated area",
      "Document the network topology and IP configuration for troubleshooting purposes",
      "Review network performance and security annually with the HSCN provider"
    ],
    scope:  "This SOP applies to the Pharmacy Manager at iPharmacy Direct. It covers all activities relating to n3/hscn network & connectivity and must be read, understood, and acknowledged before undertaking any related duties. Manages the pharmacy's connection to the NHS Health and Social Care Network (HSCN), which provides secure access to NHS systems including the Spine, EPS, and Summary Care Records.",
    references:  [
      "UK General Data Protection Regulation (UK GDPR)",
      "Data Protection Act 2018",
      "NHS Digital Data Security and Protection Toolkit",
      "Cyber Essentials (NCSC)",
      "NHS Digital EPS Guidance",
      "NHS England EPS Contingency Procedures"
    ],
    relatedSOPs:  [
      "SOP-100",
      "SOP-102",
      "SOP-106"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-08-09"
  },
  {
    id:  106,
    code:  "SOP-106",
    title:  "Hardware Failure Response",
    category:  "IT & Systems",
    version:  "1.0",
    reviewDate:  "2026-07-25",
    status:  "Current",
    acked:  6,
    roles:  [
      "manager"
    ],
    description:  "Defines the response procedures when pharmacy hardware (computers, printers, label printers, scanners) fails. Hardware failures can directly impact dispensing operations and patient waiting times. Contingency arrangements must be in place for all critical equipment. Replacement or repair must be arranged promptly to minimise operational disruption.",
    keyPoints:  [
      "Identify the failed hardware and assess the impact on pharmacy operations",
      "Switch to backup equipment where available (e.g. secondary label printer, backup PC)",
      "Contact the hardware supplier or IT support provider for urgent repair or replacement",
      "Implement manual workarounds for critical failures (e.g. handwritten labels as last resort)",
      "Record the failure in the IT incident log with date, equipment, fault, and resolution",
      "Ensure critical equipment (label printer, PMR terminal) has identified backup or replacement plan",
      "Maintain support contracts for all critical hardware with agreed response times",
      "Review hardware age and replacement schedule annually to prevent failures"
    ],
    scope:  "This SOP applies to the Pharmacy Manager at iPharmacy Direct. It covers all activities relating to hardware failure response and must be read, understood, and acknowledged before undertaking any related duties. Defines the response procedures when pharmacy hardware (computers, printers, label printers, scanners) fails.",
    references:  [
      "UK General Data Protection Regulation (UK GDPR)",
      "Data Protection Act 2018",
      "NHS Digital Data Security and Protection Toolkit",
      "Cyber Essentials (NCSC)",
      "Human Medicines Regulations 2012, Regulation 260",
      "GPhC Standards for Registered Pharmacies, Principle 1"
    ],
    relatedSOPs:  [
      "SOP-100",
      "SOP-102",
      "SOP-105"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-05-24"
  },
  {
    id:  107,
    code:  "SOP-107",
    title:  "IT Access & Password Management",
    category:  "IT & Systems",
    version:  "1.1",
    reviewDate:  "2026-05-15",
    status:  "Current",
    acked:  9,
    roles:  [
      "all"
    ],
    description:  "Governs user account creation, access rights, and password policies for all pharmacy IT systems. Proper access management protects patient data and ensures users can only access functions appropriate to their role. Compliant with UK GDPR principles of data minimisation and access control. Applies to the PMR, NHS systems, email, and any other business IT systems.",
    keyPoints:  [
      "Request new user accounts through the manager with role-appropriate access levels defined",
      "Use strong passwords: minimum 12 characters with a mix of upper, lower, numbers, and symbols",
      "Change passwords every 90 days and do not reuse previous passwords",
      "Never share login credentials — each user must use their own unique account",
      "Lock your screen (Ctrl+L or Windows+L) whenever you step away from the computer",
      "Report suspected unauthorised access or compromised accounts immediately to the manager",
      "Disable or delete user accounts within 24 hours of a staff member leaving",
      "Review all user access rights quarterly to ensure they remain appropriate to current roles"
    ],
    scope:  "This SOP applies to all pharmacy staff at iPharmacy Direct. It covers all activities relating to it access & password management and must be read, understood, and acknowledged before undertaking any related duties. Governs user account creation, access rights, and password policies for all pharmacy IT systems.",
    references:  [
      "UK General Data Protection Regulation (UK GDPR)",
      "Data Protection Act 2018",
      "NHS Digital Data Security and Protection Toolkit",
      "Cyber Essentials (NCSC)",
      "UK GDPR (Regulation (EU) 2016/679 as retained)",
      "ICO Guide to the UK GDPR"
    ],
    relatedSOPs:  [
      "SOP-100",
      "SOP-103",
      "SOP-028"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-03-15"
  },
  {
    id:  108,
    code:  "SOP-108",
    title:  "New Medicine Service (NMS) Delivery",
    category:  "NHS Services",
    version:  "2.0",
    reviewDate:  "2026-09-01",
    status:  "Current",
    acked:  9,
    roles:  [
      "pharmacist"
    ],
    description:  "Covers the operational and service delivery aspects of the NHS New Medicine Service, including patient identification, consultation scheduling, and NHS claiming. NMS is an NHS Advanced Service that generates income and improves patient outcomes. Efficient delivery requires systematic identification of eligible patients and timely follow-up. Follows the NHS England NMS service specification and PSNC operational guidance.",
    keyPoints:  [
      "Flag eligible patients at the point of dispensing using PMR alerts or manual identification",
      "Obtain patient consent to participate in the NMS before the first consultation",
      "Schedule the intervention consultation (7-14 days) and follow-up (14-21 days) at the point of engagement",
      "Conduct consultations in the private consultation room or by telephone as preferred by the patient",
      "Record all consultation details on the PMR and NHS-approved recording system",
      "Submit NMS claims via the NHS BSA MYS portal within the required timeframe",
      "Monitor NMS engagement rates and completion rates monthly against targets",
      "Identify barriers to NMS uptake and implement strategies to improve patient engagement"
    ],
    scope:  "This SOP applies to all pharmacists at iPharmacy Direct. It covers all activities relating to new medicine service (nms) delivery and must be read, understood, and acknowledged before undertaking any related duties. Covers the operational and service delivery aspects of the NHS New Medicine Service, including patient identification, consultation scheduling, and NHS claiming.",
    references:  [
      "NHS England Community Pharmacy Contractual Framework",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "PSNC Service Specifications",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NHS England NMS Service Specification",
      "PSNC NMS Toolkit"
    ],
    relatedSOPs:  [
      "SOP-068",
      "SOP-007",
      "SOP-109"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-04-30"
  },
  {
    id:  109,
    code:  "SOP-109",
    title:  "Community Pharmacist Consultation Service (CPCS)",
    category:  "NHS Services",
    version:  "1.8",
    reviewDate:  "2026-07-15",
    status:  "Current",
    acked:  8,
    roles:  [
      "pharmacist"
    ],
    description:  "Governs the delivery of the NHS Community Pharmacist Consultation Service, which receives referrals from NHS 111 and GP practices. CPCS diverts appropriate patients from urgent care settings to community pharmacy for clinical assessment. The pharmacist conducts a consultation and provides treatment, advice, or onward referral. An essential component of NHS England's community pharmacy strategy.",
    keyPoints:  [
      "Accept referrals from NHS 111 and GP practices via the PharmOutcomes or CPCS referral system",
      "Contact the patient within 2 hours of receiving the referral to arrange a consultation",
      "Conduct a thorough clinical assessment using appropriate clinical pathways",
      "Provide treatment, self-care advice, or refer to an appropriate healthcare provider",
      "Record the consultation and outcome on the PharmOutcomes platform",
      "Submit service claims through the NHS BSA portal within the specified timeframe",
      "Ensure the consultation room is available and equipped for CPCS consultations",
      "Review CPCS activity and referral patterns monthly to optimise service delivery"
    ],
    scope:  "This SOP applies to all pharmacists at iPharmacy Direct. It covers all activities relating to community pharmacist consultation service (cpcs) and must be read, understood, and acknowledged before undertaking any related duties. Governs the delivery of the NHS Community Pharmacist Consultation Service, which receives referrals from NHS 111 and GP practices.",
    references:  [
      "NHS England Community Pharmacy Contractual Framework",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "PSNC Service Specifications",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NHS England CPCS Service Specification",
      "PSNC CPCS Toolkit"
    ],
    relatedSOPs:  [
      "SOP-023",
      "SOP-069",
      "SOP-108"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-04-14"
  },
  {
    id:  110,
    code:  "SOP-110",
    title:  "Hypertension Case-Finding Service",
    category:  "NHS Services",
    version:  "1.2",
    reviewDate:  "2026-10-20",
    status:  "Current",
    acked:  6,
    roles:  [
      "pharmacist",
      "technician"
    ],
    description:  "Defines the operational delivery of the NHS Hypertension Case-Finding Advanced Service in the community pharmacy setting. This service enables pharmacies to offer blood pressure checks to adults and provide ambulatory blood pressure monitoring (ABPM) for those with elevated readings. Early detection and referral for hypertension reduces cardiovascular risk. Follows NHS England service specification and NICE NG136.",
    keyPoints:  [
      "Offer blood pressure checks to eligible adults opportunistically and through targeted promotion",
      "Use validated, calibrated automatic blood pressure monitors with appropriate cuff sizes",
      "For clinic readings at or above 140/90 mmHg, offer 24-hour ABPM using the pharmacy ABPM device",
      "Provide the patient with clear instructions on wearing and returning the ABPM device",
      "Analyse ABPM results and refer patients with confirmed hypertension to their GP with a report",
      "Record all checks, ABPM results, and referrals on PharmOutcomes for service claims",
      "Submit claims via the NHS BSA MYS portal within the required timeframe",
      "Maintain and calibrate blood pressure monitoring equipment as per manufacturer recommendations"
    ],
    scope:  "This SOP applies to all pharmacists, pharmacy technicians at iPharmacy Direct. It covers all activities relating to hypertension case-finding service and must be read, understood, and acknowledged before undertaking any related duties. Defines the operational delivery of the NHS Hypertension Case-Finding Advanced Service in the community pharmacy setting.",
    references:  [
      "NHS England Community Pharmacy Contractual Framework",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "PSNC Service Specifications",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NICE NG136: Hypertension in Adults (2019)",
      "NHS England Hypertension Case-Finding Service Specification"
    ],
    relatedSOPs:  [
      "SOP-072",
      "SOP-109",
      "SOP-108"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-08-19"
  },
  {
    id:  111,
    code:  "SOP-111",
    title:  "Contraception Service",
    category:  "NHS Services",
    version:  "1.0",
    reviewDate:  "2026-08-10",
    status:  "Current",
    acked:  4,
    roles:  [
      "pharmacist"
    ],
    description:  "Covers the provision of contraception services from the community pharmacy, including emergency hormonal contraception (EHC) and ongoing oral contraception. Pharmacy-based contraception services improve access and reduce unintended pregnancies. The service operates under PGDs or local commissioning arrangements. Confidentiality and sensitivity are paramount, especially for younger patients.",
    keyPoints:  [
      "Conduct a private, confidential consultation in the consultation room for all contraception requests",
      "Assess eligibility using the relevant PGD criteria including drug interactions and contraindications",
      "For patients under 16, apply Fraser competence guidelines and safeguarding procedures",
      "Supply EHC promptly — time sensitivity is critical for efficacy",
      "Provide ongoing oral contraception supply where commissioned and the patient meets PGD criteria",
      "Counsel the patient on correct use, side effects, and when to seek further medical advice",
      "Record the consultation and supply on PharmOutcomes or the commissioned service platform",
      "Refer to the GP or sexual health clinic for patients who do not meet PGD criteria"
    ],
    scope:  "This SOP applies to all pharmacists at iPharmacy Direct. It covers all activities relating to contraception service and must be read, understood, and acknowledged before undertaking any related duties. Covers the provision of contraception services from the community pharmacy, including emergency hormonal contraception (EHC) and ongoing oral contraception.",
    references:  [
      "NHS England Community Pharmacy Contractual Framework",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "PSNC Service Specifications",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NICE CG30: Long-Acting Reversible Contraception",
      "FSRH Emergency Contraception Guidelines"
    ],
    relatedSOPs:  [
      "SOP-069",
      "SOP-025",
      "SOP-022"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-06-09"
  },
  {
    id:  112,
    code:  "SOP-112",
    title:  "Pharmacy First Service Framework",
    category:  "NHS Services",
    version:  "1.5",
    reviewDate:  "2026-06-01",
    status:  "Current",
    acked:  8,
    roles:  [
      "pharmacist",
      "technician",
      "dispenser"
    ],
    description:  "Outlines the service framework and operational processes for the Pharmacy First NHS service, encompassing all seven clinical pathways. Pharmacy First enables pharmacists to assess and treat common conditions including UTI, shingles, impetigo, and sore throat using PGDs. The service is a cornerstone of NHS England's strategy to shift care closer to the patient. Efficient workflow design maximises patient throughput while maintaining clinical quality.",
    keyPoints:  [
      "Triage Pharmacy First patients promptly — aim to start the consultation within 15 minutes",
      "The dispenser or technician collects initial information and directs the patient to the pharmacist",
      "The pharmacist conducts the clinical assessment in the consultation room using the relevant pathway",
      "Supply POM treatments under PGD where criteria are met, or refer to GP with a clinical summary",
      "Record all consultations on the NHS-approved system and submit claims within the timeframe",
      "Maintain stock of Pharmacy First POM items and order replacements proactively",
      "Display Pharmacy First promotional materials to raise patient awareness",
      "Review service metrics monthly including consultation numbers, supply rates, and referral rates"
    ],
    scope:  "This SOP applies to all pharmacists, pharmacy technicians, dispensers at iPharmacy Direct. It covers all activities relating to pharmacy first service framework and must be read, understood, and acknowledged before undertaking any related duties. Outlines the service framework and operational processes for the Pharmacy First NHS service, encompassing all seven clinical pathways.",
    references:  [
      "NHS England Community Pharmacy Contractual Framework",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "PSNC Service Specifications",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NHS England Pharmacy First Service Specification (2024)",
      "PSNC Pharmacy First Clinical Pathways"
    ],
    relatedSOPs:  [
      "SOP-069",
      "SOP-109",
      "SOP-023"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-03-01"
  },
  {
    id:  113,
    code:  "SOP-113",
    title:  "Seasonal Flu Service Management",
    category:  "NHS Services",
    version:  "2.1",
    reviewDate:  "2026-04-10",
    status:  "Due Review",
    acked:  10,
    roles:  [
      "pharmacist",
      "manager"
    ],
    description:  "Covers the service management and operational planning for the annual NHS seasonal flu vaccination campaign. The flu service is a major NHS Advanced Service that requires significant operational planning. Successful delivery depends on vaccine ordering, cold chain management, appointment scheduling, and efficient patient flow. Follows NHS England seasonal flu service specification.",
    keyPoints:  [
      "Order vaccines early based on previous year's activity plus planned growth — confirm quantities with the supplier",
      "Prepare the consultation room with all necessary equipment and emergency supplies before the campaign starts",
      "Schedule appointments and walk-in slots to manage patient flow during peak periods",
      "Maintain strict cold chain compliance for all vaccine stock (see SOP-021)",
      "Submit vaccination records to the patient's GP within 24 hours via electronic notification",
      "Claim for each vaccination through the NHS BSA MYS portal within the specified timeframe",
      "Monitor uptake and compare against NHS targets — promote the service to eligible patients",
      "Conduct a post-season review of operational performance and financial outcomes"
    ],
    scope:  "This SOP applies to all pharmacists, the Pharmacy Manager at iPharmacy Direct. It covers all activities relating to seasonal flu service management and must be read, understood, and acknowledged before undertaking any related duties. Covers the service management and operational planning for the annual NHS seasonal flu vaccination campaign.",
    references:  [
      "NHS England Community Pharmacy Contractual Framework",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "PSNC Service Specifications",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "PHE Green Book: Immunisation Against Infectious Diseases",
      "NHS England Vaccination Standards"
    ],
    relatedSOPs:  [
      "SOP-070",
      "SOP-021",
      "SOP-108"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2024-12-10"
  },
  {
    id:  114,
    code:  "SOP-114",
    title:  "Weight Management Service",
    category:  "NHS Services",
    version:  "1.0",
    reviewDate:  "2026-12-01",
    status:  "Current",
    acked:  3,
    roles:  [
      "pharmacist"
    ],
    description:  "Defines the delivery of the NHS pharmacy weight management service, providing structured support to patients referred for weight management. Pharmacies deliver evidence-based behavioural interventions and signposting to specialist services where needed. The service aims to support patients in making sustainable lifestyle changes. Follows NHS England community pharmacy weight management service specification.",
    keyPoints:  [
      "Accept referrals from NHS sources and self-referring patients who meet the eligibility criteria",
      "Conduct an initial assessment including BMI calculation, waist measurement, and health risk assessment",
      "Develop an individualised weight management plan with the patient focusing on diet and activity",
      "Schedule follow-up consultations at agreed intervals to monitor progress and provide support",
      "Record all consultations, measurements, and outcomes on the commissioned service platform",
      "Refer to specialist weight management services where BMI indicates a need for tier 3 intervention",
      "Provide evidence-based information on nutrition, physical activity, and behaviour change",
      "Submit service claims and activity data as required by the commissioning specification"
    ],
    scope:  "This SOP applies to all pharmacists at iPharmacy Direct. It covers all activities relating to weight management service and must be read, understood, and acknowledged before undertaking any related duties. Defines the delivery of the NHS pharmacy weight management service, providing structured support to patients referred for weight management.",
    references:  [
      "NHS England Community Pharmacy Contractual Framework",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "PSNC Service Specifications",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NICE CG189: Obesity: Identification and Management",
      "NHS England Weight Management Service Specification"
    ],
    relatedSOPs:  [
      "SOP-073",
      "SOP-109",
      "SOP-115"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-09-30"
  },
  {
    id:  115,
    code:  "SOP-115",
    title:  "Smoking Cessation Service Delivery",
    category:  "NHS Services",
    version:  "1.6",
    reviewDate:  "2026-05-20",
    status:  "Current",
    acked:  6,
    roles:  [
      "pharmacist"
    ],
    description:  "Covers the operational delivery of the NHS-commissioned stop smoking service, including patient enrolment, NRT supply, behavioural support, and outcome reporting. Pharmacy-based smoking cessation services are commissioned locally and provide accessible support. Carbon monoxide (CO) monitoring validates quit status and motivates patients. Follows NICE PH10 and the local stop smoking service specification.",
    keyPoints:  [
      "Enrol patients into the service and set a quit date within 2 weeks of initial contact",
      "Supply NRT products under PGD or on prescription with appropriate counselling",
      "Conduct weekly behavioural support sessions for the first 4 weeks, then at 12 weeks",
      "Perform CO monitoring at each consultation to validate self-reported quit status",
      "Record the 4-week quit outcome (CO-validated) as the primary service outcome measure",
      "Submit service claims and 4-week quit data to the commissioner within the reporting period",
      "Refer patients requesting varenicline or bupropion to their GP for prescribing",
      "Review service outcomes quarterly and implement strategies to improve quit rates"
    ],
    scope:  "This SOP applies to all pharmacists at iPharmacy Direct. It covers all activities relating to smoking cessation service delivery and must be read, understood, and acknowledged before undertaking any related duties. Covers the operational delivery of the NHS-commissioned stop smoking service, including patient enrolment, NRT supply, behavioural support, and outcome reporting.",
    references:  [
      "NHS England Community Pharmacy Contractual Framework",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "PSNC Service Specifications",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NICE PH10: Stop Smoking Services",
      "NHS England Smoking Cessation Service Specification"
    ],
    relatedSOPs:  [
      "SOP-073",
      "SOP-114",
      "SOP-109"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-02-20"
  },
  {
    id:  116,
    code:  "SOP-116",
    title:  "Travel Health Service",
    category:  "NHS Services",
    version:  "1.0",
    reviewDate:  "2026-11-15",
    status:  "Current",
    acked:  4,
    roles:  [
      "pharmacist"
    ],
    description:  "Outlines the pharmacy's travel health consultation and vaccination service for patients travelling abroad. Travel health services include risk assessment, travel vaccination, malaria prophylaxis advice, and supply of travel health products. This is typically a private service although some vaccinations may be NHS-funded. Follows NaTHNaC (National Travel Health Network and Centre) guidance.",
    keyPoints:  [
      "Conduct a comprehensive travel health risk assessment covering destination, duration, activities, and medical history",
      "Advise on required and recommended vaccinations based on NaTHNaC country-specific guidance",
      "Administer travel vaccines under appropriate PGDs where available and the patient is eligible",
      "Provide malaria risk assessment and prophylaxis advice including antimalarial options and bite prevention",
      "Supply travel health essentials: insect repellent, water purification, first aid, and sun protection",
      "Record all consultations, vaccinations administered, and advice given in the patient record",
      "Refer to a specialist travel clinic for complex itineraries or unusual risk profiles",
      "Ensure all travel vaccines are stored and handled per cold chain requirements (SOP-021)"
    ],
    scope:  "This SOP applies to all pharmacists at iPharmacy Direct. It covers all activities relating to travel health service and must be read, understood, and acknowledged before undertaking any related duties. Outlines the pharmacy's travel health consultation and vaccination service for patients travelling abroad.",
    references:  [
      "NHS England Community Pharmacy Contractual Framework",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "PSNC Service Specifications",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "PHE Green Book: Immunisation Against Infectious Diseases",
      "NHS England Vaccination Standards"
    ],
    relatedSOPs:  [
      "SOP-021",
      "SOP-022",
      "SOP-070"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-09-14"
  },
  {
    id:  117,
    code:  "SOP-117",
    title:  "Discharge Medicines Service (DMS)",
    category:  "NHS Services",
    version:  "1.3",
    reviewDate:  "2026-03-15",
    status:  "Due Review",
    acked:  7,
    roles:  [
      "pharmacist"
    ],
    description:  "Defines the delivery of the NHS Discharge Medicines Service, an Essential Service supporting patients after hospital discharge. DMS ensures continuity of care by reconciling hospital discharge information with the patient's community medication record. Referrals are received electronically from hospital pharmacy teams. Timely intervention reduces readmissions and medication errors at the care transition point.",
    keyPoints:  [
      "Accept DMS referrals from hospital pharmacy teams via the NHS referral system",
      "Contact the patient within 72 hours of referral to arrange a medicines reconciliation consultation",
      "Compare the discharge medication list with the patient's existing community prescription",
      "Identify any discrepancies, new medicines, dose changes, or discontinued items",
      "Liaise with the GP to ensure the repeat prescription template is updated to match discharge changes",
      "Counsel the patient on any changes to their medication regimen",
      "Record the reconciliation and any interventions on the PMR and submit the NHS claim",
      "Flag high-risk patients (e.g. polypharmacy, anticoagulants) for enhanced follow-up"
    ],
    scope:  "This SOP applies to all pharmacists at iPharmacy Direct. It covers all activities relating to discharge medicines service (dms) and must be read, understood, and acknowledged before undertaking any related duties. Defines the delivery of the NHS Discharge Medicines Service, an Essential Service supporting patients after hospital discharge.",
    references:  [
      "NHS England Community Pharmacy Contractual Framework",
      "NHS Terms of Service for Community Pharmacy Contractors",
      "PSNC Service Specifications",
      "GPhC Standards for Pharmacy Professionals (2017)",
      "NHS England DMS Service Specification",
      "NICE NG5: Medicines Optimisation — Discharge Planning"
    ],
    relatedSOPs:  [
      "SOP-057",
      "SOP-108",
      "SOP-001"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-01-15"
  },
  {
    id:  118,
    code:  "SOP-118",
    title:  "FP10 Prescription Form Security",
    category:  "Controlled Stationery",
    version:  "1.4",
    reviewDate:  "2026-06-20",
    status:  "Current",
    acked:  7,
    roles:  [
      "pharmacist",
      "manager"
    ],
    description:  "Governs the secure storage, handling, and tracking of FP10 prescription forms held by the pharmacy for emergency supply and other purposes. FP10 forms are controlled stationery that can be used to obtain prescription-only medicines and Controlled Drugs. Loss or theft must be reported immediately as they represent a significant security and patient safety risk. Follows NHSBSA and NHS England guidance on prescription form security.",
    keyPoints:  [
      "Store all blank FP10 forms in the pharmacy safe when not in immediate use",
      "Maintain a register of FP10 forms recording serial numbers, receipt date, usage, and remaining stock",
      "Only pharmacists may access and use blank FP10 forms — no delegation to other staff",
      "Record every FP10 used with date, serial number, patient name, and pharmacist name",
      "Report any lost, stolen, or unaccounted FP10 forms immediately to NHSBSA and the superintendent",
      "Conduct a monthly count of FP10 stock against the register to identify discrepancies early",
      "Destroy spoiled FP10 forms securely and record the destruction in the register",
      "Review FP10 security procedures during each quarterly CD and governance audit"
    ],
    scope:  "This SOP applies to all pharmacists, the Pharmacy Manager at iPharmacy Direct. It covers all activities relating to fp10 prescription form security and must be read, understood, and acknowledged before undertaking any related duties. Governs the secure storage, handling, and tracking of FP10 prescription forms held by the pharmacy for emergency supply and other purposes.",
    references:  [
      "NHS Business Services Authority Prescription Form Guidance",
      "Misuse of Drugs Regulations 2001 (as amended)",
      "GPhC Standards for Registered Pharmacies (2018)",
      "NHS Counter Fraud Authority Guidance",
      "ICO CCTV Code of Practice",
      "NSI/SSAIB Alarm Standards"
    ],
    relatedSOPs:  [
      "SOP-060",
      "SOP-120",
      "SOP-121"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-04-19"
  },
  {
    id:  119,
    code:  "SOP-119",
    title:  "Blank Prescription Handling",
    category:  "Controlled Stationery",
    version:  "1.0",
    reviewDate:  "2026-09-10",
    status:  "Current",
    acked:  5,
    roles:  [
      "pharmacist",
      "manager"
    ],
    description:  "Covers the handling of blank prescription forms received from GP surgeries, hospitals, and other prescribers that may be delivered to the pharmacy in error or for collection purposes. Blank prescriptions from any source are security-sensitive documents. Incorrect handling could facilitate fraud or inappropriate supply of medicines. The pharmacy must have clear procedures to prevent misuse.",
    keyPoints:  [
      "Any blank prescription forms received at the pharmacy must be reported to the pharmacist immediately",
      "Do not retain blank prescriptions from external sources — return to the issuing organisation promptly",
      "Record details of any blank prescriptions received including source, serial numbers, and action taken",
      "Store any temporarily held blank prescriptions in the pharmacy safe until returned",
      "Report receipt of unexpected blank prescriptions to the superintendent as a potential security concern",
      "Never use blank prescriptions from external sources to write pharmacy prescriptions",
      "Maintain a chain of custody record for any blank prescriptions in the pharmacy's possession",
      "Include blank prescription handling in staff induction and annual security training"
    ],
    scope:  "This SOP applies to all pharmacists, the Pharmacy Manager at iPharmacy Direct. It covers all activities relating to blank prescription handling and must be read, understood, and acknowledged before undertaking any related duties. Covers the handling of blank prescription forms received from GP surgeries, hospitals, and other prescribers that may be delivered to the pharmacy in error or for collection purposes.",
    references:  [
      "NHS Business Services Authority Prescription Form Guidance",
      "Misuse of Drugs Regulations 2001 (as amended)",
      "GPhC Standards for Registered Pharmacies (2018)",
      "NHS Counter Fraud Authority Guidance",
      "ICO CCTV Code of Practice",
      "NSI/SSAIB Alarm Standards"
    ],
    relatedSOPs:  [
      "SOP-118",
      "SOP-120",
      "SOP-121"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-07-09"
  },
  {
    id:  120,
    code:  "SOP-120",
    title:  "Controlled Stationery Audit",
    category:  "Controlled Stationery",
    version:  "1.1",
    reviewDate:  "2026-04-30",
    status:  "Due Review",
    acked:  4,
    roles:  [
      "pharmacist",
      "superintendent"
    ],
    description:  "Establishes the audit programme for all controlled stationery held by the pharmacy including FP10 forms, CD requisition forms (FP10CDF), and any other security-sensitive documents. Regular auditing ensures all controlled stationery is accounted for and that security procedures are being followed. Audit findings must be documented and any discrepancies investigated immediately. Supports compliance with NHSBSA requirements and fraud prevention.",
    keyPoints:  [
      "Conduct a controlled stationery audit at least quarterly, aligned with the CD audit cycle",
      "Count all blank FP10 forms and reconcile against the stationery register",
      "Count all blank CD requisition forms (FP10CDF) and reconcile against the register",
      "Verify serial number sequences are intact with no unaccounted gaps",
      "Document audit findings including date, auditor, counts, and any discrepancies",
      "Investigate any discrepancies immediately — report unresolved issues to the superintendent and NHSBSA",
      "Review stationery security measures (storage, access controls, usage records) during the audit",
      "Retain audit records for a minimum of 5 years for inspection purposes"
    ],
    scope:  "This SOP applies to all pharmacists, the Superintendent Pharmacist at iPharmacy Direct. It covers all activities relating to controlled stationery audit and must be read, understood, and acknowledged before undertaking any related duties. Establishes the audit programme for all controlled stationery held by the pharmacy including FP10 forms, CD requisition forms (FP10CDF), and any other security-sensitive documents.",
    references:  [
      "NHS Business Services Authority Prescription Form Guidance",
      "Misuse of Drugs Regulations 2001 (as amended)",
      "GPhC Standards for Registered Pharmacies (2018)",
      "NHS Counter Fraud Authority Guidance",
      "ICO CCTV Code of Practice",
      "NSI/SSAIB Alarm Standards"
    ],
    relatedSOPs:  [
      "SOP-118",
      "SOP-119",
      "SOP-014"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-03-02"
  },
  {
    id:  121,
    code:  "SOP-121",
    title:  "Controlled Stationery Loss Reporting",
    category:  "Controlled Stationery",
    version:  "1.0",
    reviewDate:  "2026-08-25",
    status:  "Current",
    acked:  3,
    roles:  [
      "pharmacist",
      "superintendent"
    ],
    description:  "Defines the immediate response and reporting procedures when controlled stationery is lost, stolen, or unaccounted for. Lost prescription forms can be used fraudulently to obtain medicines including Controlled Drugs. Prompt reporting enables NHSBSA to flag the serial numbers, preventing fraudulent use. The superintendent must be notified immediately of any loss.",
    keyPoints:  [
      "Report any loss, theft, or discrepancy of controlled stationery to the superintendent immediately",
      "Notify NHSBSA Prescription Fraud team by phone and in writing within 24 hours of discovery",
      "Provide NHSBSA with the serial numbers of all missing forms if known",
      "Report suspected theft to the police and obtain a crime reference number",
      "Conduct a thorough investigation to determine the circumstances of the loss",
      "Document the incident including timeline, investigation findings, and actions taken",
      "Review and strengthen security measures to prevent recurrence",
      "Submit a written incident report to the superintendent within 7 days of the incident"
    ],
    scope:  "This SOP applies to all pharmacists, the Superintendent Pharmacist at iPharmacy Direct. It covers all activities relating to controlled stationery loss reporting and must be read, understood, and acknowledged before undertaking any related duties. Defines the immediate response and reporting procedures when controlled stationery is lost, stolen, or unaccounted for.",
    references:  [
      "NHS Business Services Authority Prescription Form Guidance",
      "Misuse of Drugs Regulations 2001 (as amended)",
      "GPhC Standards for Registered Pharmacies (2018)",
      "NHS Counter Fraud Authority Guidance",
      "NHSBSA Security of Prescription Forms Guidance",
      "NHS Counter Fraud Authority Prescription Form Security Standards"
    ],
    relatedSOPs:  [
      "SOP-118",
      "SOP-120",
      "SOP-066"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-06-24"
  },
  {
    id:  122,
    code:  "SOP-122",
    title:  "Online Pharmacy Registration & GPhC Compliance",
    category:  "Internet Pharmacy",
    version:  "2.0",
    reviewDate:  "2026-07-15",
    status:  "Current",
    acked:  8,
    roles:  [
      "superintendent",
      "manager",
      "pharmacist"
    ],
    description:  "Ensures the internet pharmacy service operates in full compliance with GPhC standards for registered pharmacy premises providing online services. The GPhC requires all pharmacies selling or supplying medicines online to be registered and display the EU common logo linked to the GPhC register. The website must meet all information disclosure requirements including superintendent details, registration number, and complaints procedures. Non-compliance can result in enforcement action, fines, or removal from the register.",
    keyPoints:  [
      "Maintain current GPhC internet pharmacy registration and renew before expiry",
      "Display the EU common distance selling logo on every page of the website, linked to the GPhC register entry",
      "Publish the pharmacy name, GPhC registration number, superintendent name, and registered address prominently",
      "Include a clear complaints procedure, privacy policy, and terms and conditions accessible from every page",
      "Ensure the website accurately describes all services offered and any limitations",
      "Submit the annual GPhC internet pharmacy self-assessment by the required deadline",
      "Review website content quarterly to ensure all information is current and accurate",
      "Report any changes to the internet pharmacy service to the GPhC within 30 days"
    ],
    scope:  "This SOP applies to the Superintendent Pharmacist, the Pharmacy Manager, all pharmacists at iPharmacy Direct. It covers all activities relating to online pharmacy registration & gphc compliance and must be read, understood, and acknowledged before undertaking any related duties. Ensures the internet pharmacy service operates in full compliance with GPhC standards for registered pharmacy premises providing online services.",
    references:  [
      "GPhC Standards for Registered Pharmacies (2018)",
      "GPhC Guidance for Internet Pharmacies",
      "Human Medicines Regulations 2012",
      "UK General Data Protection Regulation (UK GDPR)",
      "Safeguarding Vulnerable Groups Act 2006",
      "DBS Filtering Rules Guidance"
    ],
    relatedSOPs:  [
      "SOP-033",
      "SOP-129",
      "SOP-130"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-03-15"
  },
  {
    id:  123,
    code:  "SOP-123",
    title:  "Online Consultation & Questionnaire Process",
    category:  "Internet Pharmacy",
    version:  "1.8",
    reviewDate:  "2026-05-20",
    status:  "Current",
    acked:  7,
    roles:  [
      "pharmacist"
    ],
    description:  "Defines the clinical governance framework for online patient consultations used to assess suitability before supplying prescription-only medicines. Online consultations must be clinically robust, capturing sufficient medical history to make a safe prescribing or supply decision. Questionnaires must be designed by pharmacists and reviewed regularly against current clinical guidelines. The pharmacist retains full clinical responsibility for every supply decision made on the basis of an online consultation.",
    keyPoints:  [
      "Design online questionnaires with input from the superintendent and clinical pharmacist team",
      "Include mandatory fields for medical history, current medications, allergies, and contraindications",
      "Build clinical decision logic that flags high-risk responses for manual pharmacist review",
      "Reject or escalate any consultation where clinical safety cannot be assured from the information provided",
      "The pharmacist must personally review every completed consultation before authorising supply",
      "Maintain an audit trail of every consultation including questions asked, responses given, and the clinical decision",
      "Review and update questionnaire content at least annually against current BNF, NICE, and MHRA guidance",
      "Conduct quarterly clinical audits of consultation outcomes to identify patterns and improve safety"
    ],
    scope:  "This SOP applies to all pharmacists at iPharmacy Direct. It covers all activities relating to online consultation & questionnaire process and must be read, understood, and acknowledged before undertaking any related duties. Defines the clinical governance framework for online patient consultations used to assess suitability before supplying prescription-only medicines.",
    references:  [
      "GPhC Standards for Registered Pharmacies (2018)",
      "GPhC Guidance for Internet Pharmacies",
      "Human Medicines Regulations 2012",
      "UK General Data Protection Regulation (UK GDPR)"
    ],
    relatedSOPs:  [
      "SOP-124",
      "SOP-125",
      "SOP-131"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-02-20"
  },
  {
    id:  124,
    code:  "SOP-124",
    title:  "Patient Identity Verification (Online)",
    category:  "Internet Pharmacy",
    version:  "1.5",
    reviewDate:  "2026-09-10",
    status:  "Current",
    acked:  6,
    roles:  [
      "pharmacist",
      "dispenser",
      "manager"
    ],
    description:  "Establishes robust identity verification procedures for patients ordering medicines through the online pharmacy. Verifying that the person ordering is who they claim to be is critical for patient safety, fraud prevention, and regulatory compliance. The GPhC expects the same standard of patient verification online as in-person. Enhanced verification is required for Controlled Drugs, high-risk medicines, and first-time patients.",
    keyPoints:  [
      "Verify the patient's identity at registration using a combination of name, date of birth, address, and contact details",
      "Require photographic ID upload (passport, driving licence) for first orders of POM items",
      "Cross-reference patient details against the NHS Spine or Summary Care Record where consent is given",
      "Implement automated address verification checks and flag mismatches for manual review",
      "Apply enhanced identity verification for all Controlled Drug orders and high-risk medicines",
      "Reject orders where identity cannot be satisfactorily verified — notify the patient of the reason",
      "Retain identity verification records securely in compliance with UK GDPR for the data retention period",
      "Review ID verification procedures annually and update in line with GPhC and MHRA guidance"
    ],
    scope:  "This SOP applies to all pharmacists, dispensers, the Pharmacy Manager at iPharmacy Direct. It covers all activities relating to patient identity verification (online) and must be read, understood, and acknowledged before undertaking any related duties. Establishes robust identity verification procedures for patients ordering medicines through the online pharmacy.",
    references:  [
      "GPhC Standards for Registered Pharmacies (2018)",
      "GPhC Guidance for Internet Pharmacies",
      "Human Medicines Regulations 2012",
      "UK General Data Protection Regulation (UK GDPR)",
      "GPhC Guidance for Internet Pharmacies (2019)",
      "EU Falsified Medicines Directive 2011/62/EU (as retained)"
    ],
    relatedSOPs:  [
      "SOP-123",
      "SOP-054",
      "SOP-128"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-06-09"
  },
  {
    id:  125,
    code:  "SOP-125",
    title:  "Online Dispensing Workflow",
    category:  "Internet Pharmacy",
    version:  "2.2",
    reviewDate:  "2026-06-30",
    status:  "Current",
    acked:  9,
    roles:  [
      "pharmacist",
      "technician",
      "dispenser"
    ],
    description:  "Governs the end-to-end dispensing process for orders received through the online pharmacy platform, from order receipt through to dispatch. The online dispensing workflow must achieve the same clinical and accuracy standards as walk-in dispensing. Additional considerations include packaging for transit, dispatch timelines, and managing patient expectations. All standard clinical checks, accuracy processes, and near-miss reporting apply.",
    keyPoints:  [
      "Process online orders in receipt order unless clinical urgency dictates priority changes",
      "Perform a full clinical check against the patient's online consultation and medication history before dispensing",
      "Apply standard labelling and accuracy checking procedures — two-person check before packing",
      "Package medicines securely and discreetly in tamper-evident, plain outer packaging for transit",
      "Include the patient information leaflet, dispensing label, and any required counselling materials",
      "Record dispatch details including courier tracking number, date, and items sent",
      "Target same-day dispatch for orders received before the published cut-off time",
      "Apply the standard near-miss and error reporting SOP (SOP-027) to all online dispensing activity"
    ],
    scope:  "This SOP applies to all pharmacists, pharmacy technicians, dispensers at iPharmacy Direct. It covers all activities relating to online dispensing workflow and must be read, understood, and acknowledged before undertaking any related duties. Governs the end-to-end dispensing process for orders received through the online pharmacy platform, from order receipt through to dispatch.",
    references:  [
      "GPhC Standards for Registered Pharmacies (2018)",
      "GPhC Guidance for Internet Pharmacies",
      "Human Medicines Regulations 2012",
      "UK General Data Protection Regulation (UK GDPR)",
      "GPhC Guidance for Internet Pharmacies (2019)",
      "EU Falsified Medicines Directive 2011/62/EU (as retained)"
    ],
    relatedSOPs:  [
      "SOP-001",
      "SOP-006",
      "SOP-126"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-03-02"
  },
  {
    id:  126,
    code:  "SOP-126",
    title:  "Postal & Courier Dispatch",
    category:  "Internet Pharmacy",
    version:  "1.4",
    reviewDate:  "2026-08-25",
    status:  "Current",
    acked:  8,
    roles:  [
      "dispenser",
      "stock_assistant",
      "manager"
    ],
    description:  "Covers the packaging, labelling, and dispatch of medicines via postal and courier services to online pharmacy patients. Medicines must arrive in a condition fit for use, with packaging that protects against damage, temperature extremes, and tampering. The dispatch process must comply with Royal Mail and courier dangerous goods regulations for medicines. The pharmacy is responsible for medicine integrity until delivery.",
    keyPoints:  [
      "Use approved pharmaceutical-grade packaging that protects against breakage, leakage, and extreme temperatures",
      "Include temperature-controlled packaging (insulated pouches, gel packs) for fridge-line items",
      "Apply tamper-evident seals to all packages so the patient can verify the package has not been opened",
      "Label outer packaging with the pharmacy return address but no indication of pharmaceutical contents for patient privacy",
      "Comply with Royal Mail and courier restrictions on sending dangerous goods, flammable liquids, and aerosols",
      "Ensure Controlled Drugs are dispatched only via approved tracked and signed-for courier services",
      "Record all dispatched packages with patient name, tracking number, courier, and date for audit trail",
      "Monitor delivery success rates and investigate any packages reported as lost, damaged, or delayed"
    ],
    scope:  "This SOP applies to dispensers, stock assistants, the Pharmacy Manager at iPharmacy Direct. It covers all activities relating to postal & courier dispatch and must be read, understood, and acknowledged before undertaking any related duties. Covers the packaging, labelling, and dispatch of medicines via postal and courier services to online pharmacy patients.",
    references:  [
      "GPhC Standards for Registered Pharmacies (2018)",
      "GPhC Guidance for Internet Pharmacies",
      "Human Medicines Regulations 2012",
      "UK General Data Protection Regulation (UK GDPR)",
      "PHE Cold Chain Guidance for Immunisation Programmes",
      "MHRA Guidance on Pharmaceutical Cold Chain"
    ],
    relatedSOPs:  [
      "SOP-125",
      "SOP-127",
      "SOP-052"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-06-24"
  },
  {
    id:  127,
    code:  "SOP-127",
    title:  "Cold Chain Postal Delivery",
    category:  "Internet Pharmacy",
    version:  "1.2",
    reviewDate:  "2026-04-05",
    status:  "Due Review",
    acked:  5,
    roles:  [
      "pharmacist",
      "dispenser"
    ],
    description:  "Defines the specific cold chain requirements for dispatching temperature-sensitive medicines (2-8°C) via postal or courier services. Maintaining the cold chain during postal transit is significantly more challenging than local delivery and requires validated packaging solutions. The pharmacy must demonstrate that the packaging maintains the required temperature range for the expected transit duration. Failure to maintain the cold chain renders medicines unsafe for patient use.",
    keyPoints:  [
      "Use validated insulated packaging with phase-change coolant packs rated for the expected transit time",
      "Validate packaging performance seasonally — summer and winter conditions require different pack-out configurations",
      "Include a temperature indicator (chemical or electronic) inside each cold chain parcel",
      "Dispatch cold chain parcels early in the week to avoid weekend delays in the postal system",
      "Use next-day or express courier services only for cold chain items — standard post is not acceptable",
      "Instruct the patient to refrigerate items immediately upon receipt and check the temperature indicator",
      "Record cold chain dispatch details including packaging configuration and coolant pack lot numbers",
      "Investigate any patient reports of warm or compromised deliveries and revise packaging if necessary"
    ],
    scope:  "This SOP applies to all pharmacists, dispensers at iPharmacy Direct. It covers all activities relating to cold chain postal delivery and must be read, understood, and acknowledged before undertaking any related duties. Defines the specific cold chain requirements for dispatching temperature-sensitive medicines (2-8°C) via postal or courier services.",
    references:  [
      "GPhC Standards for Registered Pharmacies (2018)",
      "GPhC Guidance for Internet Pharmacies",
      "Human Medicines Regulations 2012",
      "UK General Data Protection Regulation (UK GDPR)",
      "PHE Cold Chain Guidance for Immunisation Programmes",
      "MHRA Guidance on Pharmaceutical Cold Chain"
    ],
    relatedSOPs:  [
      "SOP-053",
      "SOP-126",
      "SOP-020"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-02-05"
  },
  {
    id:  128,
    code:  "SOP-128",
    title:  "Online CD Supply & Compliance",
    category:  "Internet Pharmacy",
    version:  "1.1",
    reviewDate:  "2026-10-15",
    status:  "Current",
    acked:  4,
    roles:  [
      "pharmacist",
      "superintendent"
    ],
    description:  "Covers the additional regulatory and clinical requirements for supplying Controlled Drugs through the online pharmacy service. Online supply of CDs carries heightened risk of misuse, diversion, and fraud, requiring enhanced safeguards beyond standard dispensing. Schedule 2 and 3 CDs supplied online must meet all Misuse of Drugs Regulations requirements plus additional GPhC expectations for distance selling. The superintendent must approve the range of CDs available for online supply.",
    keyPoints:  [
      "The superintendent must approve which CD schedules and specific preparations may be supplied online",
      "Apply enhanced patient identity verification for all online CD orders (see SOP-124)",
      "Limit quantities of CDs supplied online to the minimum clinically necessary — apply professional judgement",
      "The pharmacist must personally review every online CD consultation and make the supply decision",
      "Dispatch CDs only via tracked, signed-for courier with tamper-evident packaging",
      "Record all online CD supplies in the CD register with a cross-reference to the online order number",
      "Monitor ordering patterns for individual patients and flag potential misuse or stockpiling",
      "Conduct quarterly audits of online CD supply activity and report findings to the superintendent"
    ],
    scope:  "This SOP applies to all pharmacists, the Superintendent Pharmacist at iPharmacy Direct. It covers all activities relating to online cd supply & compliance and must be read, understood, and acknowledged before undertaking any related duties. Covers the additional regulatory and clinical requirements for supplying Controlled Drugs through the online pharmacy service.",
    references:  [
      "GPhC Standards for Registered Pharmacies (2018)",
      "GPhC Guidance for Internet Pharmacies",
      "Human Medicines Regulations 2012",
      "UK General Data Protection Regulation (UK GDPR)",
      "Care Act 2014",
      "Children Act 2004"
    ],
    relatedSOPs:  [
      "SOP-011",
      "SOP-124",
      "SOP-096"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-08-14"
  },
  {
    id:  129,
    code:  "SOP-129",
    title:  "Website Content & Advertising Compliance",
    category:  "Internet Pharmacy",
    version:  "1.3",
    reviewDate:  "2026-11-20",
    status:  "Current",
    acked:  6,
    roles:  [
      "manager",
      "superintendent"
    ],
    description:  "Ensures all website content, product descriptions, and advertising materials comply with the Advertising Standards Authority (ASA) Code, MHRA advertising regulations, and GPhC standards. Misleading health claims, unlicensed medicine promotion, and non-compliant advertising can result in regulatory sanctions and patient harm. All public-facing content must be reviewed by the superintendent before publication. Applies to the website, social media, email marketing, and any third-party platforms.",
    keyPoints:  [
      "All medicine descriptions must be factually accurate and consistent with the approved Summary of Product Characteristics",
      "Do not make therapeutic claims that are not supported by the product licence or marketing authorisation",
      "Never advertise prescription-only medicines to the public — this is prohibited under UK law",
      "Ensure OTC medicine advertising complies with the MHRA Blue Guide and ASA CAP Code",
      "Include required warnings, contraindications, and \"always read the label\" statements on relevant product pages",
      "The superintendent must review and approve all new website content and advertising materials before publication",
      "Remove or update any content flagged by the MHRA, ASA, or GPhC within the specified timeframe",
      "Conduct a quarterly review of all website content for accuracy, compliance, and currency"
    ],
    scope:  "This SOP applies to the Pharmacy Manager, the Superintendent Pharmacist at iPharmacy Direct. It covers all activities relating to website content & advertising compliance and must be read, understood, and acknowledged before undertaking any related duties. Ensures all website content, product descriptions, and advertising materials comply with the Advertising Standards Authority (ASA) Code, MHRA advertising regulations, and GPhC standards.",
    references:  [
      "GPhC Standards for Registered Pharmacies (2018)",
      "GPhC Guidance for Internet Pharmacies",
      "Human Medicines Regulations 2012",
      "UK General Data Protection Regulation (UK GDPR)",
      "MHRA Guidance on the Supply of Unlicensed Medicinal Products (Specials)",
      "Human Medicines Regulations 2012, Regulation 167"
    ],
    relatedSOPs:  [
      "SOP-122",
      "SOP-033",
      "SOP-130"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-09-19"
  },
  {
    id:  130,
    code:  "SOP-130",
    title:  "Online Patient Data & Privacy",
    category:  "Internet Pharmacy",
    version:  "2.0",
    reviewDate:  "2026-05-10",
    status:  "Current",
    acked:  9,
    roles:  [
      "all"
    ],
    description:  "Establishes the data protection and privacy requirements specific to the online pharmacy operation, supplementing the general GDPR SOP (SOP-028). Online pharmacies collect and process additional categories of sensitive personal data through digital channels including health questionnaires, identity documents, and payment information. The website must implement technical and organisational measures to protect this data. Compliant with UK GDPR, the Data Protection Act 2018, and the Privacy and Electronic Communications Regulations (PECR).",
    keyPoints:  [
      "Publish a comprehensive privacy policy on the website explaining what data is collected, why, and how it is used",
      "Obtain explicit informed consent before collecting and processing health data through online consultations",
      "Implement SSL/TLS encryption across the entire website — all pages, not just checkout and login",
      "Store patient data on servers located within the UK or EEA with appropriate data processing agreements in place",
      "Implement role-based access controls so staff can only access patient data relevant to their role",
      "Process online payments through PCI DSS-compliant payment providers — never store card details on pharmacy systems",
      "Respond to Subject Access Requests, erasure requests, and data portability requests within 30 days",
      "Conduct an annual Data Protection Impact Assessment (DPIA) for the online pharmacy service"
    ],
    scope:  "This SOP applies to all pharmacy staff at iPharmacy Direct. It covers all activities relating to online patient data & privacy and must be read, understood, and acknowledged before undertaking any related duties. Establishes the data protection and privacy requirements specific to the online pharmacy operation, supplementing the general GDPR SOP (SOP-028).",
    references:  [
      "GPhC Standards for Registered Pharmacies (2018)",
      "GPhC Guidance for Internet Pharmacies",
      "Human Medicines Regulations 2012",
      "UK General Data Protection Regulation (UK GDPR)",
      "UK GDPR (Regulation (EU) 2016/679 as retained)",
      "ICO Guide to the UK GDPR"
    ],
    relatedSOPs:  [
      "SOP-028",
      "SOP-122",
      "SOP-107"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-01-10"
  },
  {
    id:  131,
    code:  "SOP-131",
    title:  "Inappropriate Online Requests & Safeguarding",
    category:  "Internet Pharmacy",
    version:  "1.0",
    reviewDate:  "2026-08-05",
    status:  "Current",
    acked:  5,
    roles:  [
      "pharmacist",
      "superintendent"
    ],
    description:  "Defines how the pharmacy identifies and manages inappropriate or suspicious medicine requests received through the online platform. Online pharmacies are targeted by individuals seeking to obtain medicines for misuse, self-harm, or supply to others. The pharmacist must apply the same professional safeguarding judgement online as they would face-to-face. Patterns of inappropriate requesting must be monitored and acted upon.",
    keyPoints:  [
      "Screen all online orders for red flags: excessive quantities, frequent re-ordering, multiple accounts, high-risk combinations",
      "Refuse supply where the pharmacist has reasonable grounds to believe the order is inappropriate or unsafe",
      "Document the reason for refusal in the patient record and notify the patient via secure message or email",
      "Flag patient accounts that trigger repeated red flags for enhanced pharmacist review on future orders",
      "Apply safeguarding procedures (SOP-025) if online consultations suggest self-harm, abuse, or exploitation",
      "Monitor for signs of doctor-shopping or pharmacy-shopping across multiple online pharmacies where information is available",
      "Report suspected criminal activity (forged prescriptions, identity fraud) to the police and superintendent",
      "Review patterns of refused or flagged orders quarterly to identify emerging trends and update screening criteria"
    ],
    scope:  "This SOP applies to all pharmacists, the Superintendent Pharmacist at iPharmacy Direct. It covers all activities relating to inappropriate online requests & safeguarding and must be read, understood, and acknowledged before undertaking any related duties. Defines how the pharmacy identifies and manages inappropriate or suspicious medicine requests received through the online platform.",
    references:  [
      "GPhC Standards for Registered Pharmacies (2018)",
      "GPhC Guidance for Internet Pharmacies",
      "Human Medicines Regulations 2012",
      "UK General Data Protection Regulation (UK GDPR)",
      "Care Act 2014",
      "Children Act 2004"
    ],
    relatedSOPs:  [
      "SOP-025",
      "SOP-123",
      "SOP-128"
    ],
    author:  "Moniba Jamil",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-06-04"
  },
  {
    id:  132,
    code:  "SOP-132",
    title:  "Returns, Refunds & Customer Complaints (Online)",
    category:  "Internet Pharmacy",
    version:  "1.5",
    reviewDate:  "2026-06-20",
    status:  "Current",
    acked:  7,
    roles:  [
      "pharmacist",
      "manager",
      "dispenser"
    ],
    description:  "Governs the handling of returns, refund requests, and complaints from online pharmacy customers, including the interaction between consumer protection law and medicines regulations. Medicines cannot be re-used or re-dispensed once dispatched, creating unique challenges for returns processing. The Consumer Rights Act 2015 grants certain rights that must be balanced against pharmaceutical safety obligations. Clear policies must be published on the website to manage patient expectations.",
    keyPoints:  [
      "Publish a clear returns and refunds policy on the website that explains which items can and cannot be returned",
      "Accept returns of unopened, non-medicine items within 14 days under the Consumer Contracts Regulations distance selling rights",
      "Dispensed medicines cannot be returned to stock or re-dispensed — dispose via pharmaceutical waste on receipt",
      "Process refunds for pharmacy errors (wrong item, damaged in transit) within 5 working days",
      "Investigate delivery complaints (late, missing, damaged) with the courier and resolve within 10 working days",
      "Log all complaints in the central complaints register (SOP-029) regardless of the channel received",
      "Provide patients with information on how to escalate complaints to the GPhC or Ombudsman",
      "Review online complaints data quarterly to identify service improvement opportunities"
    ],
    scope:  "This SOP applies to all pharmacists, the Pharmacy Manager, dispensers at iPharmacy Direct. It covers all activities relating to returns, refunds & customer complaints (online) and must be read, understood, and acknowledged before undertaking any related duties. Governs the handling of returns, refund requests, and complaints from online pharmacy customers, including the interaction between consumer protection law and medicines regulations.",
    references:  [
      "GPhC Standards for Registered Pharmacies (2018)",
      "GPhC Guidance for Internet Pharmacies",
      "Human Medicines Regulations 2012",
      "UK General Data Protection Regulation (UK GDPR)",
      "NHS Complaints Regulations 2009",
      "Parliamentary and Health Service Ombudsman Guidance"
    ],
    relatedSOPs:  [
      "SOP-029",
      "SOP-058",
      "SOP-126"
    ],
    author:  "Amjid Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-03-20"
  },
  {
    id:  133,
    code:  "SOP-133",
    title:  "Platform Uptime, Monitoring & Incident Response",
    category:  "Internet Pharmacy",
    version:  "1.2",
    reviewDate:  "2026-09-30",
    status:  "Current",
    acked:  5,
    roles:  [
      "manager",
      "superintendent"
    ],
    description:  "Covers the operational management of the online pharmacy platform including uptime monitoring, performance standards, and incident response procedures. Patients depend on the website being available to order medicines and access health information. Extended outages can delay access to essential medicines and erode patient trust. The pharmacy must have monitoring in place and a clear incident response plan for platform failures.",
    keyPoints:  [
      "Monitor website availability and performance using automated uptime monitoring tools",
      "Target a minimum platform availability of 99.5% measured monthly, excluding planned maintenance windows",
      "Schedule planned maintenance outside peak ordering hours and notify patients in advance via the website",
      "Implement an incident response procedure: detect, assess, communicate, resolve, and review",
      "Display a clear \"service unavailable\" message during outages with the pharmacy phone number for urgent orders",
      "Maintain a relationship with the website hosting provider and development team for emergency support",
      "Log all platform incidents including start time, duration, root cause, and resolution in the IT incident log",
      "Conduct a post-incident review for any outage exceeding 4 hours and implement preventive measures"
    ],
    scope:  "This SOP applies to the Pharmacy Manager, the Superintendent Pharmacist at iPharmacy Direct. It covers all activities relating to platform uptime, monitoring & incident response and must be read, understood, and acknowledged before undertaking any related duties. Covers the operational management of the online pharmacy platform including uptime monitoring, performance standards, and incident response procedures.",
    references:  [
      "GPhC Standards for Registered Pharmacies (2018)",
      "GPhC Guidance for Internet Pharmacies",
      "Human Medicines Regulations 2012",
      "UK General Data Protection Regulation (UK GDPR)",
      "NCSC Cyber Essentials Requirements",
      "NHS Digital Data Security Standards"
    ],
    relatedSOPs:  [
      "SOP-079",
      "SOP-101",
      "SOP-122"
    ],
    author:  "Salma Shakoor",
    approvedBy:  "Amjid Shakoor",
    effectiveDate:  "2025-07-29"
  }
]

export default DUMMY_SOPS
