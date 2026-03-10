// ─── INDUCTION MODULES — iPharmacy Direct (Ashton-under-Lyne) ───
// 12 modules with real pharmacy-specific content, quizzes where specified

const INDUCTION_MODULES = [
  {
    code: 'IND-001',
    title: 'Confidentiality & Patient Data',
    category: 'Compliance',
    description: 'Understanding your legal and professional obligations around patient data, confidentiality, and data protection in a pharmacy environment.',
    estimated_minutes: 15,
    is_mandatory: true,
    order_index: 1,
    content: {
      sections: [
        {
          heading: 'Why Confidentiality Matters in Pharmacy',
          body: 'As a member of the iPharmacy Direct team, you will have access to sensitive patient information every day. This includes names, addresses, medical conditions, prescribed medications, and contact details. Patients trust us to handle this information with the utmost care and discretion. A breach of confidentiality can cause serious harm — from embarrassment and distress to discrimination and even physical danger in cases involving domestic abuse or mental health conditions.',
          bullets: [
            'Never discuss patient information in public areas, the shop floor, or within earshot of other patients',
            'Do not access patient records unless it is directly necessary for your role',
            'Never share patient information with family members or carers without the patient\'s explicit consent',
            'Be aware that even confirming someone is a patient of ours is a breach of confidentiality'
          ]
        },
        {
          heading: 'What Counts as Patient Data',
          body: 'Patient data includes any information that can identify a living individual, whether directly or indirectly. In a pharmacy context, this is broader than most people expect.',
          bullets: [
            'Name, date of birth, address, NHS number, telephone number',
            'Prescription details including medication names, dosages, and quantities',
            'Patient medication records (PMR) and consultation notes',
            'Delivery addresses and contact preferences',
            'Any notes about patient conditions, allergies, or clinical interventions',
            'CCTV footage, photographs, and recorded phone calls'
          ]
        },
        {
          heading: 'Your Legal Obligations Under GDPR and the Data Protection Act 2018',
          body: 'The General Data Protection Regulation (GDPR) and the UK Data Protection Act 2018 set out strict rules for handling personal data. Health data is classified as "special category data" and has additional protections. As an employee of iPharmacy Direct, you are personally responsible for complying with these laws — ignorance is not a defence.',
          bullets: [
            'Data must be processed lawfully, fairly, and transparently',
            'Data must be collected for a specific, legitimate purpose and not used beyond that',
            'Only the minimum necessary data should be collected and retained',
            'Data must be kept accurate and up to date',
            'Data must not be kept longer than necessary (our retention policy is 8 years for prescription records)',
            'Data must be kept secure using appropriate technical and organisational measures'
          ]
        },
        {
          heading: 'Practical Do\'s and Don\'ts',
          body: 'These practical guidelines apply to your daily work at iPharmacy Direct. Following them consistently is the simplest way to stay compliant.',
          bullets: [
            'DO lock your computer screen (Windows + L) whenever you step away, even briefly',
            'DO use the shredder for any paper containing patient information — never use the general waste bin',
            'DO keep prescription bags face-down on the counter so medication names are not visible',
            'DON\'T take photographs of prescriptions, labels, or patient records on your personal phone',
            'DON\'T send patient information via personal email, WhatsApp, or text message',
            'DON\'T leave PMR screens open when patients or visitors can see them',
            'DO report any concerns about data handling to the Data Protection Lead (Salma Shakoor)'
          ]
        },
        {
          heading: 'What To Do If a Breach Occurs',
          body: 'A data breach is any incident where patient data is lost, stolen, accessed without authorisation, or disclosed inappropriately. If you become aware of a breach — or even suspect one — you must act immediately. Do not try to cover it up or assume someone else will deal with it.',
          bullets: [
            'Report the breach immediately to the Superintendent Pharmacist (Amjid Shakoor) or the Data Protection Lead',
            'Do not attempt to investigate or fix the breach yourself — this may make it worse',
            'Write down exactly what happened, when, and what data was involved while it is fresh in your memory',
            'The pharmacy has 72 hours to report serious breaches to the Information Commissioner\'s Office (ICO)',
            'You will not be disciplined for reporting a breach in good faith — our policy encourages open reporting'
          ]
        }
      ],
      quiz: [
        {
          question: 'Under GDPR, how long does the pharmacy have to report a serious data breach to the ICO?',
          options: ['24 hours', '72 hours', '7 days', '30 days'],
          correctIndex: 1
        },
        {
          question: 'Which of the following is considered patient data?',
          options: ['The pharmacy\'s opening hours', 'A patient\'s delivery address', 'The price of a medication', 'The name of a drug manufacturer'],
          correctIndex: 1
        },
        {
          question: 'What should you do if you suspect a data breach has occurred?',
          options: ['Try to fix it yourself before telling anyone', 'Wait to see if anyone notices', 'Report it immediately to the Superintendent Pharmacist', 'Delete any evidence of the breach'],
          correctIndex: 2
        }
      ]
    }
  },
  {
    code: 'IND-002',
    title: 'Information Governance & Data Security',
    category: 'Compliance',
    description: 'How to use pharmacy systems securely and protect sensitive information in daily operations.',
    estimated_minutes: 10,
    is_mandatory: true,
    order_index: 2,
    content: {
      sections: [
        {
          heading: 'What Is Information Governance',
          body: 'Information governance is the framework of rules, policies, and processes that ensure information is handled correctly, securely, and legally. At iPharmacy Direct, this covers everything from how we store patient medication records to how we dispose of old prescriptions. Good information governance protects our patients, our staff, and our pharmacy\'s GPhC registration.',
          bullets: [
            'Information governance is not optional — it is a condition of our GPhC registration',
            'Every member of staff has a personal responsibility to follow IG procedures',
            'The Caldicott Principles guide how we handle patient information in the NHS'
          ]
        },
        {
          heading: 'Password and System Security at iPharmacy Direct',
          body: 'All pharmacy systems require individual login credentials. You must never share your password with anyone, including colleagues, managers, or IT support. Every action taken under your login is attributed to you personally — if someone else uses your credentials to make an error, you will be held accountable.',
          bullets: [
            'Use a strong password: minimum 8 characters, mix of upper/lower case, numbers, and symbols',
            'Change your password every 90 days when prompted — do not reuse old passwords',
            'Never write passwords on sticky notes, under keyboards, or in shared documents',
            'Lock your workstation every time you leave it — press Windows + L',
            'If you suspect your password has been compromised, change it immediately and notify Salma Shakoor'
          ]
        },
        {
          heading: 'Using RxWeb and PharmSmart Securely',
          body: 'RxWeb and PharmSmart are the primary dispensing and patient record systems at iPharmacy Direct. They contain highly sensitive patient data and must be used with care at all times.',
          bullets: [
            'Only access patient records when you have a legitimate dispensing or clinical reason to do so',
            'Never search for your own records, family members, or celebrities out of curiosity',
            'Always log out when you finish using a terminal — do not leave sessions open',
            'Report any unusual system behaviour, unexpected data, or error messages to the IT lead'
          ]
        },
        {
          heading: 'Email and Communication Rules',
          body: 'Email communication containing patient data must only be sent through the pharmacy\'s NHS.net email account or approved secure channels. Personal email accounts (Gmail, Outlook, Yahoo) must never be used for patient information under any circumstances.',
          bullets: [
            'Use NHS.net email for any correspondence containing patient-identifiable information',
            'Double-check the recipient before sending — auto-complete errors are a leading cause of data breaches',
            'Never forward pharmacy emails to personal accounts for convenience',
            'Do not discuss patients in staff WhatsApp groups or social media'
          ]
        },
        {
          heading: 'Reporting a Data Security Incident',
          body: 'A data security incident includes lost USB drives, misdirected emails, unauthorised access to systems, or any situation where data may have been exposed. Report incidents immediately — early reporting limits damage and demonstrates our commitment to compliance.',
          bullets: [
            'Contact the Superintendent Pharmacist or Data Protection Lead without delay',
            'Complete a data security incident form (available in the dispensary)',
            'Preserve any evidence — do not delete emails or clear browser history',
            'Cooperate fully with any investigation'
          ]
        }
      ],
      quiz: [
        {
          question: 'How often should you change your system password at iPharmacy Direct?',
          options: ['Every 30 days', 'Every 90 days', 'Every 6 months', 'Only when asked'],
          correctIndex: 1
        },
        {
          question: 'Which email service should be used for sending patient-identifiable information?',
          options: ['Gmail', 'Outlook personal', 'NHS.net', 'Any email with a password'],
          correctIndex: 2
        }
      ]
    }
  },
  {
    code: 'IND-003',
    title: 'Safeguarding Vulnerable Adults & Children',
    category: 'Compliance',
    description: 'Recognising signs of abuse, understanding your duty of care, and knowing how to escalate safeguarding concerns.',
    estimated_minutes: 20,
    is_mandatory: true,
    order_index: 3,
    content: {
      sections: [
        {
          heading: 'What Is Safeguarding',
          body: 'Safeguarding means protecting people\'s health, wellbeing, and human rights — enabling them to live free from harm, abuse, and neglect. In a pharmacy, we interact with vulnerable people every day: elderly patients collecting multiple medications, children accompanying parents, people with learning disabilities, and those experiencing domestic abuse. Pharmacy staff are uniquely placed to notice signs of concern because of the regular, trusted contact we have with patients.',
          bullets: [
            'Safeguarding is everyone\'s responsibility — not just the pharmacist\'s',
            'You do not need to be certain that abuse is occurring to raise a concern',
            'The welfare of the child or vulnerable adult must always be the priority',
            'Safeguarding training must be refreshed annually'
          ]
        },
        {
          heading: 'Recognising Signs of Abuse or Neglect',
          body: 'Abuse can take many forms: physical, emotional, sexual, financial, and neglect. As pharmacy staff, you may notice signs during routine interactions that others might miss.',
          bullets: [
            'Physical: unexplained bruises, burns, fractures, or injuries in various stages of healing',
            'Emotional: withdrawal, fearfulness, anxiety around a particular person, sudden changes in behaviour',
            'Neglect: unkempt appearance, poor hygiene, untreated medical conditions, missed medications',
            'Financial: someone else controlling a patient\'s money, unexpected changes to prescriptions, reluctance to collect medication due to cost',
            'Sexual: inappropriate sexual behaviour, physical symptoms, reluctance to be examined',
            'Domestic abuse: partner always present during consultations, patient appears controlled or anxious'
          ]
        },
        {
          heading: 'Your Duty to Act',
          body: 'If you notice something that concerns you, you have a professional and legal duty to act. You are not expected to investigate or confirm your suspicions — that is the role of social services and the police. Your role is to notice, record, and report.',
          bullets: [
            'Do not ignore concerns because "it\'s probably nothing" — report and let trained professionals assess',
            'Do not confront the suspected abuser or alert them to your concerns',
            'Do not promise confidentiality to a patient who discloses abuse — you must explain that you have a duty to share the information',
            'Record your observations factually, using the patient\'s own words where possible'
          ]
        },
        {
          heading: 'How to Raise a Safeguarding Concern at iPharmacy Direct',
          body: 'iPharmacy Direct has a clear internal process for raising safeguarding concerns. Follow these steps in order.',
          bullets: [
            'Step 1: Speak to the Responsible Pharmacist on duty immediately',
            'Step 2: If the RP is unavailable, contact the Superintendent Pharmacist (Amjid Shakoor) directly',
            'Step 3: Complete a Safeguarding Concern Form — available in the dispensary and on PharmSmart',
            'Step 4: The RP or Superintendent will decide whether to refer to Tameside Safeguarding or contact the police',
            'Step 5: Keep a confidential record of your concern and any actions taken'
          ]
        },
        {
          heading: 'Escalation Pathway and Contacts',
          body: 'In an emergency where you believe someone is in immediate danger, call 999 without delay. For non-emergency safeguarding referrals, the following contacts apply.',
          bullets: [
            'Tameside Adult Safeguarding: 0161 342 2400',
            'Tameside Children\'s Safeguarding (MASH): 0161 342 4101',
            'Out of hours emergency duty team: 0161 342 2222',
            'Police (non-emergency): 101',
            'NSPCC helpline: 0808 800 5000',
            'Superintendent Pharmacist (Amjid Shakoor): available via pharmacy mobile'
          ]
        }
      ],
      quiz: [
        {
          question: 'What should you do if a patient discloses abuse to you?',
          options: ['Promise to keep it confidential', 'Confront the suspected abuser', 'Report to the Responsible Pharmacist and record your observations', 'Wait to see if it happens again'],
          correctIndex: 2
        },
        {
          question: 'Which of the following is a sign of potential financial abuse?',
          options: ['A patient requesting a different brand of medication', 'Someone else always collecting a patient\'s prescriptions and controlling their finances', 'A patient asking about generic alternatives', 'A patient paying by card instead of cash'],
          correctIndex: 1
        },
        {
          question: 'If you believe someone is in immediate danger, what should you do first?',
          options: ['Complete a safeguarding form', 'Call the Superintendent Pharmacist', 'Call 999', 'Speak to the patient\'s GP'],
          correctIndex: 2
        }
      ]
    }
  },
  {
    code: 'IND-004',
    title: 'Manual Handling',
    category: 'Health & Safety',
    description: 'Safe lifting techniques, risk assessment, and injury prevention when handling pharmacy stock and deliveries.',
    estimated_minutes: 15,
    is_mandatory: true,
    order_index: 4,
    content: {
      sections: [
        {
          heading: 'Why Manual Handling Matters in a Pharmacy',
          body: 'Manual handling injuries are among the most common workplace injuries in the UK. At iPharmacy Direct, you will regularly lift, carry, and move boxes of stock, pharmaceutical deliveries, and bulky items. Incorrect manual handling can cause back injuries, sprains, hernias, and long-term musculoskeletal conditions that may affect your ability to work. Most manual handling injuries are entirely preventable with proper technique and awareness.',
          bullets: [
            'Over a third of all workplace injuries reported to the HSE involve manual handling',
            'Back injuries caused by poor lifting technique can take months or years to heal',
            'The Manual Handling Operations Regulations 1992 require employers to reduce the risk of injury',
            'You have a duty to follow safe lifting procedures and report any concerns about manual handling tasks'
          ]
        },
        {
          heading: 'Common Manual Handling Risks',
          body: 'The following tasks at iPharmacy Direct carry manual handling risk and require particular care.',
          bullets: [
            'Unloading pharmaceutical deliveries from the Alliance Healthcare and AAH vans',
            'Moving heavy boxes of liquid medications (e.g. methadone, lactulose — often 10kg+)',
            'Stacking and retrieving stock from high shelves in the stockroom',
            'Lifting tote boxes onto the dispensing robot conveyor',
            'Moving the CD cabinet or heavy equipment during deep cleaning',
            'Carrying bags of prescriptions for delivery rounds'
          ]
        },
        {
          heading: 'The TILE Assessment Framework',
          body: 'Before any manual handling task, you should quickly assess the risks using the TILE framework. This takes only a few seconds and should become second nature.',
          bullets: [
            'T — Task: What does the task involve? Is there twisting, bending, reaching, or repetitive lifting?',
            'I — Individual: Are you fit and able to perform this task? Do you have any injuries or conditions that increase risk?',
            'L — Load: How heavy is it? Is it awkward, bulky, unstable, or does it contain liquids that may shift?',
            'E — Environment: Is the floor wet or uneven? Is there enough space? Are there stairs or obstacles?'
          ]
        },
        {
          heading: 'Safe Lifting Technique Step by Step',
          body: 'Follow this sequence every time you lift any load. It applies whether you are lifting a small box or a heavy delivery crate.',
          bullets: [
            'Plan your route: know where you are going before you lift',
            'Stand close to the load with feet shoulder-width apart, one foot slightly ahead',
            'Bend your knees, not your back — lower yourself by bending at the hips and knees',
            'Get a firm grip on the load — use handles where available',
            'Lift smoothly by straightening your legs — keep the load close to your body',
            'Avoid twisting: turn with your feet, not your waist',
            'Set the load down gently, bending your knees again',
            'If the load is too heavy or awkward, ask a colleague for help — never attempt a risky lift alone'
          ]
        },
        {
          heading: 'Reporting a Manual Handling Injury or Near Miss',
          body: 'If you injure yourself during a manual handling task — or have a near miss — report it immediately. Early reporting ensures you get the right treatment and allows us to prevent the same thing happening to someone else.',
          bullets: [
            'Report the injury or near miss to the Responsible Pharmacist on duty',
            'Complete an incident report form (available in the dispensary)',
            'Seek first aid or medical attention as needed — do not "work through" pain',
            'The incident will be reviewed to identify whether controls can be improved'
          ]
        }
      ],
      quiz: [
        {
          question: 'What does the "L" stand for in the TILE assessment framework?',
          options: ['Lifting', 'Load', 'Location', 'Legislation'],
          correctIndex: 1
        },
        {
          question: 'When lifting a heavy box, you should bend primarily at your:',
          options: ['Waist', 'Shoulders', 'Knees and hips', 'Elbows'],
          correctIndex: 2
        }
      ]
    }
  },
  {
    code: 'IND-005',
    title: 'Robot & Automated Dispensing System Handling',
    category: 'Practical',
    description: 'Operating the dispensing robot safely, handling errors, and understanding maintenance responsibilities.',
    estimated_minutes: 20,
    is_mandatory: true,
    order_index: 5,
    content: {
      sections: [
        {
          heading: 'Overview of the Dispensing Robot at iPharmacy Direct',
          body: 'iPharmacy Direct uses an automated dispensing robot to improve speed, accuracy, and efficiency in the dispensing workflow. The robot stores, retrieves, and dispenses medications based on electronic prescriptions received through RxWeb. While the robot significantly reduces human error, it is a complex piece of equipment that requires proper handling and respect for safety procedures. All staff who interact with the robot must complete this module before doing so unsupervised.',
          bullets: [
            'The robot handles approximately 70% of our dispensing volume',
            'It stores over 2,000 individual packs across multiple medication lines',
            'The robot is integrated with RxWeb for automatic stock management and expiry tracking',
            'Only trained staff may load, unload, or clear errors on the robot'
          ]
        },
        {
          heading: 'Loading and Unloading Procedures',
          body: 'Correct loading is essential for the robot to function properly. Incorrectly loaded stock can cause jams, incorrect dispensing, and stock discrepancies that affect patient safety.',
          bullets: [
            'Always check the barcode is scannable and undamaged before loading a pack',
            'Ensure the pack matches the slot configuration — do not force packs into incorrect slots',
            'Load expiry dates facing outward so the robot\'s camera can read them during dispensing',
            'When unloading returns or recalled stock, follow the on-screen instructions exactly',
            'Never load partial packs, damaged packs, or packs without a barcode into the robot',
            'Record any stock discrepancies immediately in the stock adjustment log'
          ]
        },
        {
          heading: 'What To Do When the Robot Flags an Error or Jam',
          body: 'The robot will display an error code and audible alert when it encounters a problem. Common issues include pack jams, barcode read failures, and motor errors. Do not ignore these alerts — they must be resolved before the robot can continue dispensing.',
          bullets: [
            'Read the error message on the robot\'s touchscreen carefully before taking any action',
            'For pack jams: follow the on-screen clearance procedure — never reach into the mechanism while it is powered on',
            'For barcode errors: remove the affected pack, check the barcode, and reload or replace as needed',
            'For motor or mechanical errors: do not attempt to fix these yourself — notify the Superintendent Pharmacist',
            'Log every error in the robot maintenance log, including the error code and your name'
          ]
        },
        {
          heading: 'Hygiene and Maintenance Responsibilities',
          body: 'The robot dispensing area must be kept clean and free from obstructions. Regular cleaning prevents dust buildup that can affect sensors and barcode readers.',
          bullets: [
            'Wipe down the robot\'s loading area and touchscreen daily using approved anti-static wipes',
            'Do not use wet cloths, sprays, or chemical cleaners on the robot without authorisation',
            'Report any unusual noises, vibrations, or movement irregularities to the maintenance lead',
            'The robot receives a full service from the manufacturer quarterly — note this in the maintenance schedule'
          ]
        },
        {
          heading: 'When To Escalate to the Superintendent Pharmacist',
          body: 'Some situations require immediate escalation. If in doubt, always escalate rather than attempting to resolve the issue yourself.',
          bullets: [
            'The robot dispenses the wrong medication or wrong quantity',
            'A mechanical fault that you cannot clear using standard on-screen procedures',
            'Stock discrepancies that cannot be explained by normal wastage',
            'Any situation where patient safety may have been compromised'
          ]
        },
        {
          heading: 'Safety Rules — Never Override Without Authorisation',
          body: 'The robot has built-in safety interlocks designed to prevent unsafe dispensing. These must never be overridden or bypassed without explicit authorisation from the Superintendent Pharmacist.',
          bullets: [
            'Never disable safety sensors or interlocks for any reason',
            'Never reach into the robot mechanism while it is powered on or in operation',
            'If a manual override is required, only the Superintendent Pharmacist may authorise and supervise it',
            'Document any override in the robot maintenance log with a full explanation'
          ]
        }
      ],
      quiz: [
        {
          question: 'What should you do if the robot dispenses the wrong medication?',
          options: ['Put it back and try again', 'Continue dispensing and log it later', 'Escalate immediately to the Superintendent Pharmacist', 'Turn the robot off and on again'],
          correctIndex: 2
        },
        {
          question: 'Who may authorise a manual safety override on the robot?',
          options: ['Any pharmacy technician', 'The delivery driver', 'The Superintendent Pharmacist only', 'Any trained staff member'],
          correctIndex: 2
        },
        {
          question: 'How often should the robot\'s loading area and touchscreen be cleaned?',
          options: ['Weekly', 'Monthly', 'Daily', 'Only when visibly dirty'],
          correctIndex: 2
        }
      ]
    }
  },
  {
    code: 'IND-006',
    title: 'Fire Safety & Emergency Evacuation',
    category: 'Health & Safety',
    description: 'Fire prevention, raising the alarm, evacuation procedures, and fire warden responsibilities at iPharmacy Direct.',
    estimated_minutes: 10,
    is_mandatory: true,
    order_index: 6,
    content: {
      sections: [
        {
          heading: 'Fire Prevention in a Pharmacy Environment',
          body: 'Pharmacies contain a range of fire risks including flammable chemicals, electrical equipment, cardboard packaging, and paper prescriptions. Prevention is always better than response. Simple daily habits significantly reduce the risk of fire.',
          bullets: [
            'Keep fire exits and escape routes clear at all times — never block them with stock or boxes',
            'Do not overload electrical sockets or use damaged extension leads',
            'Store flammable substances (surgical spirit, acetone, isopropyl alcohol) in designated COSHH cabinets away from heat sources',
            'Dispose of cardboard and packaging regularly — do not allow it to accumulate in the dispensary',
            'Ensure the kitchen area is clean and appliances (kettle, toaster, microwave) are switched off after use',
            'Report any faulty wiring, damaged plugs, or overheating equipment immediately'
          ]
        },
        {
          heading: 'How to Raise the Alarm',
          body: 'If you discover a fire or smell smoke, raise the alarm immediately. Do not attempt to investigate or extinguish the fire unless it is very small and you have been trained to use a fire extinguisher.',
          bullets: [
            'Activate the nearest fire alarm call point (red break-glass unit)',
            'Shout "FIRE" clearly to alert others in the immediate area',
            'Call 999 and request the fire service — give the address: iPharmacy Direct, Ashton-under-Lyne',
            'Do not use lifts — use the stairs only',
            'Do not stop to collect personal belongings'
          ]
        },
        {
          heading: 'Evacuation Routes and Assembly Point',
          body: 'iPharmacy Direct has two fire exits: the main entrance and the rear fire exit through the stockroom. Familiarise yourself with both routes on your first day. Fire evacuation route maps are displayed in the dispensary and the staff room.',
          bullets: [
            'Primary route: through the main shop entrance onto the street',
            'Secondary route: through the rear stockroom door into the back yard',
            'Assembly point: the car park opposite the pharmacy (across the road)',
            'The fire warden will conduct a roll call at the assembly point',
            'Do not re-enter the building until the fire service gives the all-clear'
          ]
        },
        {
          heading: 'Fire Warden Responsibilities',
          body: 'Designated fire wardens have additional responsibilities during an evacuation. If you are a fire warden, you will receive additional training.',
          bullets: [
            'Check all areas (dispensary, stockroom, staff room, toilets) are clear before evacuating yourself',
            'Assist anyone with mobility issues or disabilities to evacuate',
            'Report to the assembly point and conduct a headcount against the staff signing-in sheet',
            'Report the all-clear or any missing persons to the fire service on arrival'
          ]
        },
        {
          heading: 'What To Do If Someone Cannot Evacuate',
          body: 'If a colleague, patient, or visitor cannot evacuate due to mobility issues, injury, or disability, do not leave them. Move them to the nearest safe refuge point (away from the fire) and inform the fire warden or fire service of their location immediately.',
          bullets: [
            'Do not attempt to carry someone downstairs unless you have been trained to do so',
            'Stay calm and reassure the person while you wait for the fire service',
            'Use the designated refuge point near the rear fire exit',
            'The fire service has specialist equipment for evacuating people with disabilities'
          ]
        }
      ],
      quiz: [
        {
          question: 'Where is the assembly point for iPharmacy Direct?',
          options: ['The staff room', 'The car park opposite the pharmacy', 'The stockroom', 'The nearest bus stop'],
          correctIndex: 1
        },
        {
          question: 'What should you do first if you discover a fire?',
          options: ['Try to extinguish it', 'Collect your personal belongings', 'Activate the nearest fire alarm call point', 'Open all windows'],
          correctIndex: 2
        }
      ]
    }
  },
  {
    code: 'IND-007',
    title: 'Dispensing Process Overview',
    category: 'Practical',
    description: 'Understanding the end-to-end dispensing workflow, accuracy checking, and your role in the dispensing chain.',
    estimated_minutes: 20,
    is_mandatory: true,
    order_index: 7,
    content: {
      sections: [
        {
          heading: 'The End-to-End Dispensing Workflow at iPharmacy Direct',
          body: 'The dispensing process at iPharmacy Direct follows a structured workflow designed to maximise accuracy and minimise risk. Every prescription passes through multiple stages, each with its own checks and responsibilities. Understanding this workflow is essential before you participate in any dispensing activity.',
          bullets: [
            'Step 1: Prescription receipt — scanned from EPS or received as paper and entered into RxWeb',
            'Step 2: Clinical screening — the pharmacist checks for interactions, allergies, and clinical appropriateness',
            'Step 3: Label generation — RxWeb generates labels with dosage, directions, and patient details',
            'Step 4: Assembly — stock is picked from shelves or the dispensing robot and matched to labels',
            'Step 5: Accuracy check — a second person verifies every item against the prescription and label',
            'Step 6: Final check by pharmacist — the pharmacist performs a clinical and legal final check',
            'Step 7: Bagging and handout — items are bagged with patient information leaflets and handed out or dispatched'
          ]
        },
        {
          heading: 'Your Role in the Dispensing Chain',
          body: 'Your specific responsibilities depend on your role. Pharmacists perform clinical checks and authorise dispensing. Pharmacy technicians and dispensers label, assemble, and accuracy-check. ACAs support with stock management and non-clinical tasks. Regardless of your role, every person in the chain contributes to patient safety.',
          bullets: [
            'Never skip a step, even when busy — the workflow exists to protect patients',
            'If you are unsure about anything, stop and ask — never guess',
            'Sign or initial every stage you complete so there is a clear audit trail',
            'You are personally accountable for the steps you perform'
          ]
        },
        {
          heading: 'Accuracy Checking Requirements',
          body: 'Accuracy checking is one of the most critical stages in the dispensing process. The accuracy checker verifies that the correct drug, in the correct form and strength, has been assembled in the correct quantity, with the correct label, for the correct patient. This check must be performed by a different person from the one who assembled the prescription.',
          bullets: [
            'Check the drug name, form, and strength against the prescription and PMR',
            'Check the quantity matches the prescribed amount',
            'Check the label directions match the prescription',
            'Check the patient name and address on the label',
            'Check expiry dates — do not dispense anything expiring within the dispensing period',
            'Sign the accuracy check box on the dispensing label'
          ]
        },
        {
          heading: 'Labelling Standards',
          body: 'Labels must be clear, accurate, and legible. They are generated by RxWeb but you must verify them before applying to the medication. The label is the patient\'s primary source of information about how to take their medication.',
          bullets: [
            'Labels must include: patient name, medication name, strength, form, dose directions, quantity, and date',
            'Auxiliary warning labels must be applied where required (e.g. "Do not drink alcohol")',
            'If a label is damaged, smudged, or incorrect, print a new one — do not hand-correct labels',
            'Ensure the label is applied straight, readable, and does not obscure the manufacturer\'s information'
          ]
        },
        {
          heading: 'What To Do If You Identify an Error',
          body: 'If at any point you identify an error — wrong drug, wrong dose, wrong patient, incorrect label — stop immediately. Do not dispense the item. Do not try to "fix it quietly."',
          bullets: [
            'Quarantine the item immediately — set it aside in the designated "query" area',
            'Inform the Responsible Pharmacist on duty',
            'Log the error as a near miss if it was caught before reaching the patient',
            'If the error reached the patient, follow the dispensing error escalation procedure immediately',
            'Never feel embarrassed about finding an error — you may have just prevented patient harm'
          ]
        }
      ]
    }
  },
  {
    code: 'IND-008',
    title: 'Near Miss & Incident Reporting',
    category: 'Compliance',
    description: 'Understanding the difference between near misses and errors, and how to report them effectively.',
    estimated_minutes: 10,
    is_mandatory: true,
    order_index: 8,
    content: {
      sections: [
        {
          heading: 'The Difference Between a Near Miss and a Dispensing Error',
          body: 'A near miss is an error that was detected and corrected before the medication reached the patient. A dispensing error is an error that was not caught and the patient received the wrong medication, dose, or instructions. Both must be reported, but the response and escalation differ significantly.',
          bullets: [
            'Near miss: wrong drug picked but caught at accuracy check — logged internally',
            'Dispensing error: wrong drug reaches the patient — must be escalated to the Superintendent Pharmacist and may require patient contact',
            'Both contribute to our learning and improvement — reporting is always encouraged'
          ]
        },
        {
          heading: 'Why Reporting Protects Patients and Staff',
          body: 'Incident reporting is not about blame — it is about learning. Every near miss or error that is reported helps us identify patterns, fix system weaknesses, and prevent future incidents. Pharmacies that report more near misses are statistically safer because they are catching problems before they cause harm.',
          bullets: [
            'Reported incidents are reviewed monthly to identify trends and root causes',
            'Reporting leads to system improvements — changes to workflows, training, or stock layout',
            'Failure to report is a disciplinary matter — hiding errors is far more serious than making them',
            'The GPhC expects pharmacies to have a robust incident reporting culture'
          ]
        },
        {
          heading: 'How to Log an Incident in PharmSmart',
          body: 'All near misses and dispensing errors should be logged in PharmSmart as soon as possible after the event. The system guides you through the required fields.',
          bullets: [
            'Navigate to Incidents → New Incident in PharmSmart',
            'Select the incident type: Near Miss or Dispensing Error',
            'Record what happened, what should have happened, and what the contributing factors were',
            'Include the drug name, patient (if applicable), and who was involved',
            'Submit — the incident will be reviewed by the Superintendent Pharmacist'
          ]
        },
        {
          heading: 'What Happens After You Report',
          body: 'Once an incident is reported, the Superintendent Pharmacist reviews it within 24 hours. Serious incidents trigger immediate investigation. All incidents are discussed at monthly team meetings (anonymised) to share learning across the team.',
          bullets: [
            'You will receive feedback on your report — this is not disciplinary, it is educational',
            'Root cause analysis is performed for significant incidents',
            'Actions from incident reviews are tracked until completion',
            'Quarterly trend reports are shared with all staff'
          ]
        },
        {
          heading: 'The No-Blame Reporting Culture at iPharmacy Direct',
          body: 'iPharmacy Direct operates a no-blame reporting culture. This means that staff who report incidents honestly and promptly will not be disciplined for making a genuine error. The only exceptions are gross negligence, deliberate actions, or failure to follow known procedures after training.',
          bullets: [
            'Honest mistakes are learning opportunities, not disciplinary offences',
            'You will be supported, not punished, for reporting',
            'The focus is always on "what went wrong with the system" not "who made the mistake"',
            'If you witness an error by a colleague, you also have a duty to report it'
          ]
        }
      ],
      quiz: [
        {
          question: 'What is the key difference between a near miss and a dispensing error?',
          options: ['Near misses are less important', 'A near miss was caught before reaching the patient; an error was not', 'Only dispensing errors need to be reported', 'Near misses only apply to controlled drugs'],
          correctIndex: 1
        },
        {
          question: 'Under iPharmacy Direct\'s reporting culture, what happens if you report a genuine mistake?',
          options: ['You receive a written warning', 'You are supported and the focus is on system improvement', 'It goes on your permanent record', 'You must complete extra training as punishment'],
          correctIndex: 1
        }
      ]
    }
  },
  {
    code: 'IND-009',
    title: 'Controlled Drugs Awareness',
    category: 'Compliance',
    description: 'Understanding controlled drug schedules, register requirements, and your responsibilities when handling CDs.',
    estimated_minutes: 15,
    is_mandatory: true,
    order_index: 9,
    content: {
      sections: [
        {
          heading: 'What Are Controlled Drugs and Why Are They Regulated',
          body: 'Controlled drugs (CDs) are medications with a high potential for misuse, addiction, or diversion. They are regulated under the Misuse of Drugs Act 1971 and the Misuse of Drugs Regulations 2001. Examples include morphine, oxycodone, fentanyl, diazepam, and methylphenidate. The regulations impose strict requirements on how these drugs are stored, recorded, supplied, and destroyed.',
          bullets: [
            'CDs are classified into Schedules 1–5, with Schedule 1 being the most restricted and Schedule 5 the least',
            'Community pharmacies primarily handle Schedule 2, 3, 4, and 5 drugs',
            'Failure to comply with CD regulations can result in criminal prosecution and loss of GPhC registration',
            'The Accountable Officer for iPharmacy Direct is Amjid Shakoor (Superintendent Pharmacist)'
          ]
        },
        {
          heading: 'Schedule 2, 3, and 4 — Key Differences',
          body: 'Understanding which schedule a drug belongs to determines what legal requirements apply to its storage, recording, and supply.',
          bullets: [
            'Schedule 2 (e.g. morphine, oxycodone, fentanyl, methylphenidate): must be stored in a CD cabinet, require a CD register entry, must be witnessed for destruction',
            'Schedule 3 (e.g. tramadol, midazolam, buprenorphine): must be stored in a CD cabinet (except tramadol), no CD register required but safe custody required',
            'Schedule 4 (e.g. diazepam, zopiclone, zolpidem): no special storage requirements, no CD register, but must still be recorded in the PMR',
            'Schedule 5 (e.g. codeine linctus, co-codamol): minimal restrictions, can be sold over the counter in some cases'
          ]
        },
        {
          heading: 'Your Responsibilities When Handling CDs at iPharmacy Direct',
          body: 'Every member of staff who handles controlled drugs has specific responsibilities. These apply regardless of your role — if you touch a CD, you are part of the chain of accountability.',
          bullets: [
            'Only handle CDs when instructed to do so by the pharmacist',
            'Never leave CDs unattended on the dispensary bench — return them to the CD cabinet immediately',
            'Never remove CDs from the pharmacy premises unless for a witnessed destruction',
            'Report any concerns about CD handling, stock levels, or unusual patterns to the pharmacist immediately',
            'Do not accept CD deliveries unless you have been trained on the checking procedure'
          ]
        },
        {
          heading: 'The CD Register and How to Use It',
          body: 'The CD register is a legal document that records every transaction involving Schedule 2 controlled drugs. Entries must be made in ink, must not be altered, and must be made at the time of the transaction.',
          bullets: [
            'Record: date, patient name, drug name, form, strength, quantity, and running balance',
            'Entries must be made by the pharmacist or under their direct supervision',
            'Errors must not be crossed out — draw a single line through the error and initial it',
            'The register must be kept for 2 years after the last entry',
            'Balance checks must be performed regularly — any discrepancy must be reported immediately'
          ]
        },
        {
          heading: 'What To Do If a Discrepancy Is Found',
          body: 'A CD discrepancy means the physical stock count does not match the running balance in the register. This is a serious matter that must be reported and investigated promptly.',
          bullets: [
            'Recount the stock carefully — ensure no packs are hidden behind others in the cabinet',
            'Check the register for arithmetic errors or missed entries',
            'If the discrepancy remains, notify the Superintendent Pharmacist (Amjid Shakoor) immediately',
            'Document the discrepancy in the CD incident log with date, drug, expected vs actual balance',
            'Significant or unexplained discrepancies may need to be reported to NHS England and the police'
          ]
        }
      ],
      quiz: [
        {
          question: 'Which schedule of controlled drugs requires entries in the CD register?',
          options: ['Schedule 3', 'Schedule 4', 'Schedule 2', 'All schedules'],
          correctIndex: 2
        },
        {
          question: 'What should you do if you find a CD stock discrepancy?',
          options: ['Adjust the register to match the stock', 'Ignore it if the difference is small', 'Recount, check for errors, and report to the Superintendent Pharmacist', 'Wait until the next quarterly audit'],
          correctIndex: 2
        },
        {
          question: 'How long must the CD register be retained after the last entry?',
          options: ['1 year', '2 years', '5 years', '7 years'],
          correctIndex: 1
        }
      ]
    }
  },
  {
    code: 'IND-010',
    title: 'Lone Working Policy',
    category: 'Policies',
    description: 'Safety procedures, check-in requirements, and emergency protocols for staff working alone.',
    estimated_minutes: 10,
    is_mandatory: true,
    order_index: 10,
    content: {
      sections: [
        {
          heading: 'When Lone Working Applies at iPharmacy Direct',
          body: 'Lone working occurs when you are the only person in the pharmacy or working area. At iPharmacy Direct, this may happen during early opening preparation, late closing procedures, stockroom tasks when others are in the front of house, or during delivery rounds. The Health and Safety at Work Act 1974 requires employers to assess and control the risks of lone working.',
          bullets: [
            'Opening or closing the pharmacy when you are the only person on site',
            'Working in the stockroom or dispensary while others are in a different part of the building',
            'Conducting delivery rounds alone',
            'Any time you cannot be seen or heard by a colleague'
          ]
        },
        {
          heading: 'Your Responsibilities Before Starting a Lone Working Shift',
          body: 'Before beginning any period of lone working, you must take the following precautions to ensure your safety.',
          bullets: [
            'Ensure your mobile phone is charged and you have the emergency contact numbers saved',
            'Confirm that the pharmacy alarm system is functioning',
            'Let a colleague or manager know you will be working alone, including expected start and finish times',
            'Check that all fire exits are accessible and not blocked',
            'If you feel unsafe for any reason, do not commence lone working — contact your manager'
          ]
        },
        {
          heading: 'Check-In Procedures',
          body: 'iPharmacy Direct requires all lone workers to check in at regular intervals. This ensures that someone is aware of your status and can raise the alarm if you do not check in.',
          bullets: [
            'Check in with the designated contact person every 2 hours during lone working',
            'Check-in can be via phone call, text message, or the pharmacy WhatsApp group',
            'If you fail to check in, the designated contact will attempt to reach you. If they cannot, they will attend the pharmacy or call emergency services',
            'Log your check-in times in the lone working register (kept in the staff room)'
          ]
        },
        {
          heading: 'What To Do in an Emergency When Alone',
          body: 'If you experience an emergency while working alone — whether it is a medical emergency, a security threat, or a fire — your safety is the priority.',
          bullets: [
            'For medical emergencies: call 999, unlock the front door if possible so paramedics can enter, then stay on the line',
            'For security threats (robbery, aggressive individual): do not confront them. Comply with demands, let them leave, then call 999',
            'For fire: follow the evacuation procedure — do not attempt to fight the fire alone. Evacuate and call 999',
            'After any emergency, contact the Superintendent Pharmacist as soon as it is safe to do so'
          ]
        },
        {
          heading: 'Reporting Concerns About Lone Working',
          body: 'If you have any concerns about lone working — whether it is about personal safety, the adequacy of existing precautions, or a specific incident — raise them immediately. Your concerns will be taken seriously and acted upon.',
          bullets: [
            'Speak to Amjid Shakoor (Superintendent Pharmacist) or Salma Shakoor (Manager)',
            'You may also raise concerns anonymously via the staff suggestion box',
            'Lone working risk assessments are reviewed annually or after any incident',
            'You have the right to refuse lone working if you believe conditions are unsafe'
          ]
        }
      ]
    }
  },
  {
    code: 'IND-011',
    title: 'Equality, Diversity & Inclusion',
    category: 'Policies',
    description: 'Understanding EDI in the workplace, recognising discrimination, and fostering an inclusive pharmacy environment.',
    estimated_minutes: 10,
    is_mandatory: true,
    order_index: 11,
    content: {
      sections: [
        {
          heading: 'EDI in the Workplace',
          body: 'Equality, diversity, and inclusion (EDI) are fundamental to how we operate at iPharmacy Direct. We serve a diverse community in Ashton-under-Lyne and our team reflects that diversity. Every member of staff, patient, and visitor must be treated with dignity and respect, regardless of their background. The Equality Act 2010 protects individuals from discrimination based on nine protected characteristics.',
          bullets: [
            'The nine protected characteristics are: age, disability, gender reassignment, marriage and civil partnership, pregnancy and maternity, race, religion or belief, sex, and sexual orientation',
            'Discrimination can be direct (treating someone less favourably) or indirect (applying rules that disadvantage a particular group)',
            'Harassment and victimisation are also unlawful under the Equality Act',
            'iPharmacy Direct has zero tolerance for any form of discrimination'
          ]
        },
        {
          heading: 'Your Rights and Responsibilities',
          body: 'As a member of the iPharmacy Direct team, you have both rights and responsibilities under our EDI policy.',
          bullets: [
            'You have the right to work in an environment free from discrimination, harassment, and bullying',
            'You have the responsibility to treat all colleagues, patients, and visitors with respect',
            'You must not make assumptions about patients based on their appearance, accent, religion, or background',
            'Provide equal quality of care and service to every patient',
            'Use patients\' preferred names and pronouns'
          ]
        },
        {
          heading: 'Recognising and Challenging Discrimination',
          body: 'Discrimination is not always overt. It can be subtle — "microaggressions," exclusion from conversations, assumptions about capability, or jokes that target a particular group. As a pharmacy professional, you have a responsibility to recognise and challenge discrimination when you see it.',
          bullets: [
            'Speak up if you hear discriminatory comments or jokes — silence can be interpreted as agreement',
            'Challenge politely but firmly: "That\'s not appropriate in our workplace"',
            'Report persistent or serious discrimination through the formal complaints process',
            'Support colleagues who may be experiencing discrimination — being an ally matters'
          ]
        },
        {
          heading: 'Raising an EDI Concern at iPharmacy Direct',
          body: 'If you experience or witness discrimination, harassment, or any behaviour that conflicts with our EDI policy, you should raise a concern without delay.',
          bullets: [
            'Speak to your line manager in the first instance',
            'If the concern involves your line manager, speak to the Superintendent Pharmacist (Amjid Shakoor) directly',
            'You may raise concerns formally or informally — both are taken seriously',
            'Written complaints can be submitted via the staff suggestion box or email',
            'All complaints are investigated confidentially, and you will be protected from victimisation for raising a concern'
          ]
        }
      ],
      quiz: [
        {
          question: 'How many protected characteristics are defined under the Equality Act 2010?',
          options: ['5', '7', '9', '12'],
          correctIndex: 2
        },
        {
          question: 'What should you do if you hear a colleague make a discriminatory comment?',
          options: ['Ignore it — it\'s not your problem', 'Join in to avoid conflict', 'Challenge it politely but firmly', 'Report it only if the target complains'],
          correctIndex: 2
        }
      ]
    }
  },
  {
    code: 'IND-012',
    title: 'Internet Pharmacy & Distance Selling Compliance',
    category: 'Compliance',
    description: 'GPhC requirements for internet pharmacies, patient verification, and distance selling obligations.',
    estimated_minutes: 15,
    is_mandatory: true,
    order_index: 12,
    content: {
      sections: [
        {
          heading: 'What Makes iPharmacy Direct a Registered Distance Selling Pharmacy',
          body: 'iPharmacy Direct is registered with the GPhC as a distance selling pharmacy (also known as an internet pharmacy). This means we dispense and supply medications to patients without face-to-face interaction. Our patients order prescriptions online or via NHS electronic prescriptions, and we dispatch medications by post or courier. This model of pharmacy practice is subject to additional regulatory requirements beyond those of a standard community pharmacy.',
          bullets: [
            'We are registered on the GPhC internet pharmacy register and display the EU common logo on our website',
            'We must comply with all standard GPhC standards PLUS the additional distance selling pharmacy standards',
            'The Superintendent Pharmacist (Amjid Shakoor) is personally responsible for ensuring compliance',
            'Failure to comply can result in enforcement action, including removal from the register'
          ]
        },
        {
          heading: 'GPhC Requirements for Internet Pharmacies',
          body: 'The GPhC sets specific standards that internet pharmacies must meet. These are in addition to the standard pharmacy requirements and reflect the unique risks of supplying medicines without seeing the patient.',
          bullets: [
            'The website must display: GPhC registration number, Superintendent Pharmacist name, pharmacy address, and the EU common logo',
            'A pharmacist must be available for real-time consultation during operating hours (phone, chat, or video)',
            'Patients must be able to access a registered pharmacist for advice before and after receiving medication',
            'All marketing and promotional materials must be accurate, not misleading, and comply with MHRA regulations',
            'The pharmacy must have a clear complaints procedure displayed on the website'
          ]
        },
        {
          heading: 'The EU Common Logo and What It Means',
          body: 'The EU common logo is a mandatory clickable symbol displayed on the website of every legally operating online pharmacy in the UK. When clicked, it links to the GPhC register entry for iPharmacy Direct, allowing patients to verify that we are a genuine, registered pharmacy.',
          bullets: [
            'The logo is a green and white cross with a flag symbol',
            'It must be displayed on every page of the website where medicines are sold',
            'Clicking the logo must link directly to our GPhC register entry',
            'Pharmacies operating without the logo are likely to be illegal and may be selling counterfeit or dangerous medicines'
          ]
        },
        {
          heading: 'Patient Verification and Prescription Checking Remotely',
          body: 'Because we do not see patients face to face, we must have robust processes for verifying patient identity and ensuring prescriptions are genuine. This is a critical safety requirement.',
          bullets: [
            'Verify patient identity using name, date of birth, address, and NHS number',
            'Cross-reference new patients against existing PMR records',
            'Check all prescriptions for clinical appropriateness, interactions, and duplicates — just as a high street pharmacy would',
            'Flag any unusual patterns: excessive quantities, frequent early requests, or multiple prescribers for the same drug class',
            'If in doubt about a prescription\'s authenticity, contact the prescriber directly before dispensing'
          ]
        },
        {
          heading: 'What You Must Never Do as a Distance Selling Pharmacy Employee',
          body: 'Working in an internet pharmacy comes with specific prohibitions that all staff must understand and follow without exception.',
          bullets: [
            'Never dispense a prescription-only medicine without a valid prescription — this is a criminal offence',
            'Never supply medicines to patients outside the UK unless we hold the appropriate licences',
            'Never make medical claims about products on social media or in customer communications',
            'Never bypass the clinical check process, even under time pressure from patients demanding urgency',
            'Never share patient data with third-party marketing companies or use it for promotional purposes',
            'Never process an order if you suspect the patient is not who they claim to be'
          ]
        }
      ],
      quiz: [
        {
          question: 'What is the purpose of the EU common logo on an internet pharmacy\'s website?',
          options: ['It is a marketing badge', 'It shows the pharmacy accepts EU orders', 'It allows patients to verify the pharmacy is legally registered', 'It is required for SEO purposes'],
          correctIndex: 2
        },
        {
          question: 'What should you do if you suspect a prescription is not genuine?',
          options: ['Dispense it anyway to avoid delaying the patient', 'Contact the prescriber directly to verify before dispensing', 'Ask the patient to confirm it is genuine', 'Ignore it — that\'s the pharmacist\'s job'],
          correctIndex: 1
        },
        {
          question: 'Which of the following is a criminal offence?',
          options: ['Dispensing a prescription from a different pharmacy', 'Supplying a POM without a valid prescription', 'Sending medication by Royal Mail', 'Using a generic instead of a branded product'],
          correctIndex: 1
        }
      ]
    }
  }
]

export default INDUCTION_MODULES
