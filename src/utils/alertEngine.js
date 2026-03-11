import { supabase } from '../lib/supabase'
import { generateId } from './helpers'

// ═══════════════════════════════════════════════════
// Alert Generation Engine
// Scans all source tables and creates/resolves alerts
// ═══════════════════════════════════════════════════

const MS_PER_DAY = 86400000
const today = () => new Date().toISOString().slice(0, 10)
const daysBetween = (a, b) => Math.floor((new Date(b) - new Date(a)) / MS_PER_DAY)
const daysAgo = (dateStr) => daysBetween(dateStr, today())
const daysUntil = (dateStr) => daysBetween(today(), dateStr)

// ── SOP alerts ──
function generateSOPAlerts(sops, acks) {
  const alerts = []
  const now = today()
  const ackBySop = {}
  for (const a of acks) {
    if (!ackBySop[a.sop_id]) ackBySop[a.sop_id] = []
    ackBySop[a.sop_id].push(a)
  }

  for (const sop of sops) {
    if (!sop.review_date) continue
    const days = daysUntil(sop.review_date)

    if (days < 0) {
      alerts.push({
        alert_type: 'SOP_REVIEW',
        severity: 'HIGH',
        title: `SOP overdue for review: ${sop.code} ${sop.title}`,
        description: `Review was due ${Math.abs(days)} days ago on ${sop.review_date}`,
        source_table: 'sops',
        source_id: sop.id,
        due_date: sop.review_date,
      })
    } else if (days <= 30) {
      alerts.push({
        alert_type: 'SOP_REVIEW',
        severity: 'MEDIUM',
        title: `SOP review upcoming: ${sop.code} ${sop.title}`,
        description: `Review due in ${days} days on ${sop.review_date}`,
        source_table: 'sops',
        source_id: sop.id,
        due_date: sop.review_date,
      })
    }
  }
  return alerts
}

// ── Induction alerts ──
function generateInductionAlerts(modules, completions, staff) {
  const alerts = []
  const mandatoryModules = modules.filter(m => m.is_mandatory)
  const completionSet = new Set(completions.map(c => `${c.module_id}::${c.staff_name}`))

  for (const s of staff) {
    for (const mod of mandatoryModules) {
      const key = `${mod.id}::${s.name}`
      if (!completionSet.has(key)) {
        alerts.push({
          alert_type: 'INDUCTION',
          severity: 'HIGH',
          title: `Induction module incomplete: ${mod.title}`,
          description: `${s.name} has not completed mandatory module "${mod.title}"`,
          source_table: 'induction_modules',
          source_id: mod.id,
          assigned_to: s.name,
        })
      }
    }
  }
  return alerts
}

// ── Appraisal alerts ──
function generateAppraisalAlerts(appraisals, goals, staff) {
  const alerts = []
  const now = Date.now()
  const MONTH_MS = 30.44 * MS_PER_DAY

  // Group by staff
  const byStaff = {}
  for (const a of appraisals) {
    if (a.status === 'Archived') continue
    if (!byStaff[a.staff_name]) byStaff[a.staff_name] = []
    byStaff[a.staff_name].push(a)
  }

  for (const s of staff) {
    const staffApprs = (byStaff[s.name] || [])
      .sort((a, b) => new Date(b.appraisal_date) - new Date(a.appraisal_date))

    if (staffApprs.length === 0) {
      alerts.push({
        alert_type: 'APPRAISAL_DUE',
        severity: 'HIGH',
        title: `No appraisal on record: ${s.name}`,
        description: `${s.name} has never had an appraisal recorded in the system`,
        source_table: 'staff_members',
        source_id: s.id,
        assigned_to: s.name,
      })
      continue
    }

    const latest = staffApprs[0]
    const monthsSince = Math.floor((now - new Date(latest.appraisal_date)) / MONTH_MS)

    if (monthsSince >= 13) {
      alerts.push({
        alert_type: 'APPRAISAL_DUE',
        severity: 'HIGH',
        title: `Appraisal overdue: ${s.name}`,
        description: `Last appraisal was ${monthsSince} months ago (${latest.appraisal_date?.slice(0, 10)})`,
        source_table: 'appraisals',
        source_id: latest.id,
        assigned_to: s.name,
      })
    } else if (monthsSince >= 11) {
      alerts.push({
        alert_type: 'APPRAISAL_DUE',
        severity: 'MEDIUM',
        title: `Appraisal due soon: ${s.name}`,
        description: `Last appraisal was ${monthsSince} months ago — due within 2 months`,
        source_table: 'appraisals',
        source_id: latest.id,
        assigned_to: s.name,
      })
    }

    // Unacknowledged completed appraisal (> 7 days)
    if (latest.status === 'Completed' && !latest.staff_acknowledged) {
      const daysSinceAppraisal = daysAgo(latest.appraisal_date)
      if (daysSinceAppraisal > 7) {
        alerts.push({
          alert_type: 'APPRAISAL_ACK',
          severity: 'MEDIUM',
          title: `Appraisal unacknowledged: ${s.name}`,
          description: `Completed appraisal from ${latest.appraisal_date?.slice(0, 10)} not acknowledged after ${daysSinceAppraisal} days`,
          source_table: 'appraisals',
          source_id: latest.id,
          assigned_to: s.name,
        })
      }
    }

    // Probation review check
    if (latest.appraisal_type === 'Probation Review' && latest.status !== 'Completed') {
      const daysPast = daysAgo(latest.appraisal_date)
      if (daysPast > 0) {
        alerts.push({
          alert_type: 'PROBATION',
          severity: 'HIGH',
          title: `Probation review overdue: ${s.name}`,
          description: `Probation review scheduled for ${latest.appraisal_date?.slice(0, 10)} is still in ${latest.status} status`,
          source_table: 'appraisals',
          source_id: latest.id,
          assigned_to: s.name,
        })
      }
    }
  }

  // Overdue goals
  const todayStr = today()
  for (const g of goals) {
    if (g.status === 'Completed' || g.status === 'CarriedOver') continue
    if (g.target_date && g.target_date < todayStr) {
      alerts.push({
        alert_type: 'APPRAISAL_GOAL',
        severity: 'LOW',
        title: `Appraisal goal overdue: ${g.goal_text?.slice(0, 60)}`,
        description: `Target date ${g.target_date} has passed — status: ${g.status}`,
        source_table: 'appraisal_goals',
        source_id: g.id,
      })
    }
  }

  return alerts
}

// ── Staff Directory / Document expiry alerts ──
function generateExpiryAlerts(documents) {
  const alerts = []
  const EXPIRY_CATEGORIES = {
    GPhC: { type: 'GPHC_EXPIRY', expiredSev: 'CRITICAL', upcomingSev: 'HIGH' },
    DBS: { type: 'DBS_EXPIRY', expiredSev: 'HIGH', upcomingSev: 'MEDIUM' },
    Training: { type: 'TRAINING_EXPIRY', expiredSev: 'MEDIUM', upcomingSev: 'MEDIUM' },
    Certificate: { type: 'TRAINING_EXPIRY', expiredSev: 'MEDIUM', upcomingSev: 'MEDIUM' },
  }

  for (const doc of documents) {
    if (!doc.expiry_date) continue
    const days = daysUntil(doc.expiry_date)
    const cat = doc.category || ''
    const cfg = EXPIRY_CATEGORIES[cat] || { type: 'TRAINING_EXPIRY', expiredSev: 'MEDIUM', upcomingSev: 'MEDIUM' }

    if (days < 0) {
      alerts.push({
        alert_type: cfg.type,
        severity: cfg.expiredSev,
        title: `${cat} expired: ${doc.document_name}`,
        description: `Expired ${Math.abs(days)} days ago on ${doc.expiry_date}. Owner: ${doc.owner || 'Unknown'}`,
        source_table: 'documents',
        source_id: doc.id,
        assigned_to: doc.owner || null,
        due_date: doc.expiry_date,
      })
    } else if (days <= 90) {
      alerts.push({
        alert_type: cfg.type,
        severity: cfg.upcomingSev,
        title: `${cat} expiring soon: ${doc.document_name}`,
        description: `Expires in ${days} days on ${doc.expiry_date}. Owner: ${doc.owner || 'Unknown'}`,
        source_table: 'documents',
        source_id: doc.id,
        assigned_to: doc.owner || null,
        due_date: doc.expiry_date,
      })
    }
  }
  return alerts
}

// ── MHRA Recall alerts ──
function generateMHRAAlerts(acks, flags) {
  // MHRA alerts are generated from live GOV.UK feed — we only check
  // acknowledgement/flag state from the DB here.
  const alerts = []
  const todayStr = today()

  // Unresolved flags older than 7 days
  for (const f of flags) {
    if (f.resolved) continue
    const age = daysAgo(f.flagged_at || f.created_at)
    if (age > 7) {
      alerts.push({
        alert_type: 'MHRA_FLAG',
        severity: 'MEDIUM',
        title: `Unresolved MHRA flag: ${(f.alert_title || '').slice(0, 80)}`,
        description: `Flag raised by ${f.flagged_by} ${age} days ago and still unresolved`,
        source_table: 'mhra_alert_flags',
        source_id: f.id,
      })
    }
  }

  return alerts
}

// ── Fridge temperature alerts ──
function generateFridgeAlerts(tempLogs) {
  const alerts = []
  // Check for out-of-range temperatures with no resolution
  for (const log of tempLogs) {
    const temp = parseFloat(log.current_temp || log.temperature)
    if (isNaN(temp)) continue
    if ((temp < 2 || temp > 8) && !log.resolution && !log.corrective_action) {
      alerts.push({
        alert_type: 'FRIDGE_TEMP',
        severity: 'CRITICAL',
        title: `Out-of-range fridge temperature: ${temp}°C`,
        description: `Recorded on ${log.date || log.created_at?.slice(0, 10)} — no corrective action logged`,
        source_table: 'fridge_temperature_logs',
        source_id: log.id,
        due_date: log.date || null,
      })
    }
  }
  return alerts
}

// ── Care Home alerts ──
function generateCareHomeAlerts(careHomes, cycles, deliveries, marIssues, notes) {
  const alerts = []
  const todayStr = today()
  const currentMonth = todayStr.slice(0, 7)

  for (const home of careHomes) {
    if (home.status === 'Inactive') continue

    // CYCLE_OVERDUE: cycle_day has passed, no cycle started for current month
    if (home.cycle_day) {
      const dayOfMonth = new Date().getDate()
      if (dayOfMonth > home.cycle_day) {
        const homeCycles = cycles.filter(c => c.care_home_id === home.id && c.cycle_month === currentMonth)
        if (homeCycles.length === 0) {
          alerts.push({
            alert_type: 'CYCLE_OVERDUE',
            severity: 'HIGH',
            title: `Cycle overdue: ${home.name}`,
            description: `Cycle day ${home.cycle_day} has passed for ${currentMonth} with no cycle started`,
            source_table: 'care_homes',
            source_id: home.id,
          })
        }
      }
    }

    // CYCLE_STALLED: cycle in "In Progress" or "Checking" for >3 days
    const activeCycles = cycles.filter(c =>
      c.care_home_id === home.id && (c.status === 'In Progress' || c.status === 'Checking')
    )
    for (const cycle of activeCycles) {
      const startDate = cycle.started_at || cycle.created_at
      if (startDate && daysAgo(startDate.slice(0, 10)) > 3) {
        alerts.push({
          alert_type: 'CYCLE_STALLED',
          severity: 'MEDIUM',
          title: `Cycle stalled: ${home.name} (${cycle.cycle_month})`,
          description: `Cycle has been in "${cycle.status}" for over 3 days`,
          source_table: 'medication_cycles',
          source_id: cycle.id,
        })
      }
    }
  }

  // DELIVERY_MISSED: scheduled delivery date passed, not delivered
  for (const d of deliveries) {
    if (d.status === 'Delivered' || d.status === 'Failed') continue
    if (d.delivery_date && d.delivery_date < todayStr) {
      const home = careHomes.find(h => h.id === d.care_home_id)
      alerts.push({
        alert_type: 'DELIVERY_MISSED',
        severity: 'HIGH',
        title: `Delivery missed: ${home?.name || 'Unknown'}`,
        description: `Scheduled delivery on ${d.delivery_date} not completed`,
        source_table: 'care_home_deliveries',
        source_id: d.id,
        due_date: d.delivery_date,
      })
    }
  }

  // MAR_ISSUE_OPEN: open MAR issue older than 3 days
  for (const issue of marIssues) {
    if (issue.status === 'Resolved') continue
    const age = daysAgo(issue.issue_date || issue.created_at?.slice(0, 10))
    if (age > 3) {
      const home = careHomes.find(h => h.id === issue.care_home_id)
      alerts.push({
        alert_type: 'MAR_ISSUE_OPEN',
        severity: issue.severity === 'Critical' ? 'HIGH' : 'MEDIUM',
        title: `MAR issue unresolved: ${home?.name || 'Unknown'}`,
        description: `${issue.issue_type} issue open for ${age} days — severity: ${issue.severity}`,
        source_table: 'care_home_mar_issues',
        source_id: issue.id,
      })
    }
  }

  // HANDOVER_UNACKED: urgent note not acknowledged after 24h
  for (const note of notes) {
    if (note.acknowledged_by) continue
    if (note.priority !== 'Urgent') continue
    const age = daysAgo(note.note_date || note.created_at?.slice(0, 10))
    if (age >= 1) {
      const home = careHomes.find(h => h.id === note.care_home_id)
      alerts.push({
        alert_type: 'HANDOVER_UNACKED',
        severity: 'HIGH',
        title: `Urgent handover unacknowledged: ${home?.name || 'Unknown'}`,
        description: `Urgent note from ${note.created_by || 'Unknown'} not acknowledged after ${age} day(s)`,
        source_table: 'care_home_handover_notes',
        source_id: note.id,
      })
    }
  }

  return alerts
}

// ═══════════════════════════════════════════════════
// Main: Generate all alerts from source tables
// ═══════════════════════════════════════════════════
export async function generateAlerts() {
  const results = { created: 0, resolved: 0, errors: [] }

  try {
    // Fetch all source data in parallel
    const [
      sopsRes, sopAcksRes, modulesRes, completionsRes,
      staffRes, appraisalsRes, goalsRes, docsRes,
      mhraAcksRes, mhraFlagsRes, tempRes, existingRes,
      chHomesRes, chCyclesRes, chDeliveriesRes, chMARRes, chNotesRes,
    ] = await Promise.all([
      supabase.from('sops').select('*'),
      supabase.from('sop_acknowledgements').select('*'),
      supabase.from('induction_modules').select('*'),
      supabase.from('induction_completions').select('*'),
      supabase.from('staff_members').select('*'),
      supabase.from('appraisals').select('*'),
      supabase.from('appraisal_goals').select('*'),
      supabase.from('documents').select('*'),
      supabase.from('mhra_alert_acknowledgements').select('*'),
      supabase.from('mhra_alert_flags').select('*'),
      supabase.from('fridge_temperature_logs').select('*').catch(() => ({ data: [] })),
      supabase.from('alerts').select('*').in('status', ['ACTIVE', 'SNOOZED']),
      supabase.from('care_homes').select('*').catch(() => ({ data: [] })),
      supabase.from('medication_cycles').select('*').catch(() => ({ data: [] })),
      supabase.from('care_home_deliveries').select('*').catch(() => ({ data: [] })),
      supabase.from('care_home_mar_issues').select('*').catch(() => ({ data: [] })),
      supabase.from('care_home_handover_notes').select('*').catch(() => ({ data: [] })),
    ])

    const sops = sopsRes.data || []
    const sopAcks = sopAcksRes.data || []
    const modules = modulesRes.data || []
    const completions = completionsRes.data || []
    const staff = staffRes.data || []
    const appraisals = appraisalsRes.data || []
    const goals = goalsRes.data || []
    const docs = docsRes.data || []
    const mhraAcks = mhraAcksRes.data || []
    const mhraFlags = mhraFlagsRes.data || []
    const tempLogs = tempRes?.data || []
    const existing = existingRes.data || []
    const chHomes = chHomesRes?.data || []
    const chCycles = chCyclesRes?.data || []
    const chDeliveries = chDeliveriesRes?.data || []
    const chMAR = chMARRes?.data || []
    const chNotes = chNotesRes?.data || []

    // Build lookup of existing alerts by type+source_id
    const existingMap = new Map()
    for (const e of existing) {
      existingMap.set(`${e.alert_type}::${e.source_id}`, e)
    }

    // Generate all candidate alerts
    const candidates = [
      ...generateSOPAlerts(sops, sopAcks),
      ...generateInductionAlerts(modules, completions, staff),
      ...generateAppraisalAlerts(appraisals, goals, staff),
      ...generateExpiryAlerts(docs),
      ...generateMHRAAlerts(mhraAcks, mhraFlags),
      ...generateFridgeAlerts(tempLogs),
      ...generateCareHomeAlerts(chHomes, chCycles, chDeliveries, chMAR, chNotes),
    ]

    // Determine which candidates are new (don't already exist)
    const candidateKeys = new Set()
    const toInsert = []

    for (const c of candidates) {
      const key = `${c.alert_type}::${c.source_id}`
      candidateKeys.add(key)
      if (!existingMap.has(key)) {
        toInsert.push({
          id: generateId(),
          ...c,
          status: 'ACTIVE',
          auto_generated: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
    }

    // Auto-resolve alerts whose conditions are no longer met
    const toResolve = []
    for (const [key, alert] of existingMap) {
      if (!alert.auto_generated) continue
      if (!candidateKeys.has(key)) {
        toResolve.push(alert.id)
      }
    }

    // Batch insert new alerts
    if (toInsert.length > 0) {
      const { error } = await supabase.from('alerts').insert(toInsert)
      if (error) results.errors.push(error.message)
      else results.created = toInsert.length
    }

    // Batch resolve stale alerts
    if (toResolve.length > 0) {
      const { error } = await supabase
        .from('alerts')
        .update({
          status: 'RESOLVED',
          resolved_by: 'System',
          resolved_at: new Date().toISOString(),
          resolution_note: 'Auto-resolved — condition no longer met',
          updated_at: new Date().toISOString(),
        })
        .in('id', toResolve)
      if (error) results.errors.push(error.message)
      else results.resolved = toResolve.length
    }
  } catch (err) {
    results.errors.push(err.message || 'Unknown error')
  }

  return results
}
