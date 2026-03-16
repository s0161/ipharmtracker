import jsPDF from 'jspdf'
import 'jspdf-autotable'

/* ── colour constants ──────────────────────────────────── */
const PURPLE = [99, 91, 255]
const EMERALD = [16, 185, 129]
const RED = [239, 68, 68]
const AMBER = [245, 158, 11]
const TEAL = [13, 148, 136]
const DARK = [30, 30, 30]
const MID = [100, 100, 100]
const LIGHT_BG = [248, 250, 252]
const WHITE = [255, 255, 255]

const STANDARD_COLORS = {
  1: [0, 115, 230],
  2: [99, 91, 255],
  3: [16, 185, 129],
  4: [245, 158, 11],
  5: [13, 148, 136],
}

/* ── helpers ───────────────────────────────────────────── */
function scoreColor(score) {
  if (score >= 80) return EMERALD
  if (score >= 60) return AMBER
  if (score >= 40) return [249, 115, 22]
  return RED
}

function fmtDate(dateStr) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'))
      .toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return dateStr }
}

function truncate(text, max = 70) {
  if (!text) return '—'
  return text.length > max ? text.slice(0, max - 1) + '\u2026' : text
}

function addSectionHeader(doc, text, y, color = PURPLE) {
  if (y > 240) { doc.addPage(); y = 20 }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...DARK)
  doc.text(text, 14, y)
  doc.setDrawColor(...color)
  doc.setLineWidth(0.7)
  doc.line(14, y + 2, 196, y + 2)
  return y + 10
}

function addFooter(doc, config) {
  const pageCount = doc.internal.getNumberOfPages()
  const timestamp = new Date().toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(...MID)
    doc.text(`Generated: ${timestamp}`, 14, 287)
    const centre = `${config.pharmacyName || 'Pharmacy'} · Confidential`
    doc.text(centre, (210 - doc.getTextWidth(centre)) / 2, 287)
    const pg = `Page ${i} of ${pageCount}`
    doc.text(pg, 210 - 14 - doc.getTextWidth(pg), 287)
  }
}

/* ══════════════════════════════════════════════════════════
   MAIN EXPORT — generateGPhCReport
   ══════════════════════════════════════════════════════════ */
export default function generateGPhCReport({
  config = {},
  standards = [],
  overall = {},
  dateFrom,
  dateTo,
  sections = {},
  evidence = {},
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = 210
  let y = 0

  /* ── 1. Cover banner ─────────────────────────────────── */
  // Dark gradient header
  doc.setFillColor(10, 37, 64)
  doc.rect(0, 0, pageWidth, 48, 'F')
  // Overlay stripe
  doc.setFillColor(15, 61, 43)
  doc.rect(0, 0, pageWidth * 0.6, 48, 'F')
  // Purple accent bar
  doc.setFillColor(...PURPLE)
  doc.rect(0, 44, pageWidth, 4, 'F')

  // Pharmacy info
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...WHITE)
  doc.text(config.pharmacyName || 'Pharmacy', 14, 15)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const details = []
  if (config.gphcNumber) details.push(`GPhC: ${config.gphcNumber}`)
  if (config.superintendent) details.push(`Superintendent: ${config.superintendent}`)
  if (details.length) doc.text(details.join('   |   '), 14, 22)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('GPhC Compliance Report', 14, 32)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const period = `Period: ${fmtDate(dateFrom)} — ${fmtDate(dateTo)}`
  doc.text(period, 14, 39)
  if (config.preparedBy) {
    doc.text(`Prepared by: ${config.preparedBy}`, pageWidth - 14, 39, { align: 'right' })
  }

  // Overall score on right
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(32)
  doc.text(`${overall.score || 0}%`, pageWidth - 14, 22, { align: 'right' })
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(overall.rating || '', pageWidth - 14, 29, { align: 'right' })

  y = 58

  /* ── 2. Executive Summary — 5 score cards ────────────── */
  if (sections.executiveSummary !== false) {
    y = addSectionHeader(doc, 'Executive Summary', y)

    const cardW = 34
    const cardH = 24
    const cardGap = 3
    const startX = 14

    standards.forEach((std, i) => {
      const cx = startX + i * (cardW + cardGap)
      const color = scoreColor(std.score)

      doc.setFillColor(...LIGHT_BG)
      doc.roundedRect(cx, y, cardW, cardH, 2, 2, 'F')

      // Colored top bar
      doc.setFillColor(...(STANDARD_COLORS[std.id] || PURPLE))
      doc.rect(cx, y, cardW, 3, 'F')

      // Score
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.setTextColor(...color)
      doc.text(`${std.score}%`, cx + cardW / 2, y + 13, { align: 'center' })

      // Label
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(...DARK)
      doc.text(`S${std.id}: ${std.name}`, cx + cardW / 2, y + 20, { align: 'center' })
    })

    y += cardH + 8

    // Overall readiness
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...scoreColor(overall.score || 0))
    doc.text(`Overall Readiness: ${overall.score || 0}% — ${overall.rating || ''}`, 14, y)
    y += 10
  }

  /* ── 3. Standard detail sections ─────────────────────── */
  const { nearMisses = [], actionItems = [], auditLog = [], mhraAcks = [],
    trainingLogs = [], trainingTopics = [], staffMembers = [], staffTraining = [],
    inductionCompletions = [], inductionModules = [], appraisals = [],
    fridgeLogs = [], cleaningEntries = [], cleaningTasks = [],
    patientQueries = [], mhraFlags = [], documents = [] } = evidence

  const gphcDescriptions = {
    1: 'The governance arrangements safeguard the health, safety and wellbeing of patients and the public.',
    2: 'Staff are empowered and competent to safeguard the health, safety and wellbeing of patients and the public.',
    3: 'The premises used are safe, clean, properly maintained and suitable for the services provided.',
    4: 'The pharmacy services are provided safely and effectively.',
    5: 'Equipment and facilities used are safe, suitable and properly maintained.',
  }

  // Standard 1 — Governance
  if (sections.standard1 !== false) {
    const std = standards.find(s => s.id === 1)
    y = addSectionHeader(doc, `Standard 1 — Governance`, y, STANDARD_COLORS[1])

    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(...MID)
    doc.text(gphcDescriptions[1], 14, y)
    y += 6

    if (std) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(...scoreColor(std.score))
      doc.text(`Score: ${std.score}%`, pageWidth - 14, y - 4, { align: 'right' })
    }

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...DARK)

    const sevBreakdown = ['high', 'medium', 'low'].map(s =>
      `${nearMisses.filter(n => (n.severity || '').toLowerCase() === s).length} ${s}`
    ).join(', ')

    const bullets = [
      `Near misses logged: ${nearMisses.length} (${sevBreakdown})`,
      `MHRA alerts acknowledged: ${mhraAcks.filter(a => a.acknowledged).length} / ${mhraAcks.length}`,
      `Action items completed: ${actionItems.filter(a => a.completed).length} / ${actionItems.length}`,
      `Audit log entries: ${auditLog.length}`,
    ]
    bullets.forEach(b => {
      if (y > 270) { doc.addPage(); y = 20 }
      doc.text(`•  ${b}`, 16, y)
      y += 5
    })
    y += 5
  }

  // Standard 2 — Staff
  if (sections.standard2 !== false) {
    const std = standards.find(s => s.id === 2)
    y = addSectionHeader(doc, `Standard 2 — Staff`, y, STANDARD_COLORS[2])

    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(...MID)
    doc.text(gphcDescriptions[2], 14, y)
    y += 6

    if (std) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(...scoreColor(std.score))
      doc.text(`Score: ${std.score}%`, pageWidth - 14, y - 4, { align: 'right' })
    }

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...DARK)

    const completedTraining = trainingLogs.filter(l => l.status === 'completed').length
    const now = new Date()
    const overdueStaff = staffMembers.filter(s => {
      const logs = trainingLogs.filter(l => l.staffId === s.id && l.status !== 'completed')
      return logs.length > 0
    })
    const upToDateAppraisals = appraisals.filter(a => a.nextDue && new Date(a.nextDue) > now).length

    const bullets = [
      `Training completion: ${completedTraining} / ${trainingTopics.length} topics completed`,
      `Staff with incomplete training: ${overdueStaff.length}`,
      `Induction completions: ${inductionCompletions.length} / ${staffMembers.length * Math.max(inductionModules.length, 1)} (staff × modules)`,
      `Appraisals up to date: ${upToDateAppraisals} / ${staffMembers.length}`,
    ]
    bullets.forEach(b => {
      if (y > 270) { doc.addPage(); y = 20 }
      doc.text(`•  ${b}`, 16, y)
      y += 5
    })
    y += 5
  }

  // Standard 3 — Premises
  if (sections.standard3 !== false) {
    const std = standards.find(s => s.id === 3)
    y = addSectionHeader(doc, `Standard 3 — Premises`, y, STANDARD_COLORS[3])

    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(...MID)
    doc.text(gphcDescriptions[3], 14, y)
    y += 6

    if (std) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(...scoreColor(std.score))
      doc.text(`Score: ${std.score}%`, pageWidth - 14, y - 4, { align: 'right' })
    }

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...DARK)

    const inRange = fridgeLogs.filter(f => {
      const t = Number(f.currentTemp)
      return !isNaN(t) && t >= 2 && t <= 8
    }).length
    const excursions = fridgeLogs.length - inRange
    const temps = fridgeLogs.map(f => Number(f.currentTemp)).filter(t => !isNaN(t))
    const minT = temps.length ? Math.min(...temps).toFixed(1) : '—'
    const maxT = temps.length ? Math.max(...temps).toFixed(1) : '—'
    const avgT = temps.length ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : '—'

    const totalCleanTasks = Math.max(cleaningTasks.length, 1)
    const cleanRate = totalCleanTasks > 0
      ? Math.round((cleaningEntries.length / totalCleanTasks) * 100) : 0

    const bullets = [
      `Temperature readings: ${fridgeLogs.length} logged (${inRange} in range, ${excursions} excursions)`,
      `Temp summary: Min ${minT}°C, Max ${maxT}°C, Avg ${avgT}°C`,
      `Cleaning completion: ${cleaningEntries.length} entries across ${cleaningTasks.length} tasks`,
    ]
    bullets.forEach(b => {
      if (y > 270) { doc.addPage(); y = 20 }
      doc.text(`•  ${b}`, 16, y)
      y += 5
    })
    y += 5
  }

  // Standard 4 — Services
  if (sections.standard4 !== false) {
    const std = standards.find(s => s.id === 4)
    y = addSectionHeader(doc, `Standard 4 — Services`, y, STANDARD_COLORS[4])

    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(...MID)
    doc.text(gphcDescriptions[4], 14, y)
    y += 6

    if (std) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(...scoreColor(std.score))
      doc.text(`Score: ${std.score}%`, pageWidth - 14, y - 4, { align: 'right' })
    }

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...DARK)

    const cdPattern = /\b(cd|controlled\s+drug)/i
    const cdChecks = actionItems.filter(a =>
      a.completed && (cdPattern.test(a.title || '') || cdPattern.test(a.description || ''))
    ).length
    const resolvedQ = patientQueries.filter(q => q.status === 'resolved').length
    const totalQ = patientQueries.length
    const actionedFlags = mhraFlags.filter(f => f.actioned).length

    const bullets = [
      `CD balance checks completed: ${cdChecks}`,
      `Patient queries resolved: ${resolvedQ} / ${totalQ}`,
      `MHRA recalls actioned: ${actionedFlags} / ${mhraFlags.length}`,
    ]
    bullets.forEach(b => {
      if (y > 270) { doc.addPage(); y = 20 }
      doc.text(`•  ${b}`, 16, y)
      y += 5
    })
    y += 5
  }

  // Standard 5 — Equipment
  if (sections.standard5 !== false) {
    const std = standards.find(s => s.id === 5)
    y = addSectionHeader(doc, `Standard 5 — Equipment & Facilities`, y, STANDARD_COLORS[5])

    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(...MID)
    doc.text(gphcDescriptions[5], 14, y)
    y += 6

    if (std) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(...scoreColor(std.score))
      doc.text(`Score: ${std.score}%`, pageWidth - 14, y - 4, { align: 'right' })
    }

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...DARK)

    const inRange = fridgeLogs.filter(f => {
      const t = Number(f.currentTemp)
      return !isNaN(t) && t >= 2 && t <= 8
    }).length
    const fridgePct = fridgeLogs.length > 0
      ? Math.round((inRange / fridgeLogs.length) * 100) : 0
    const now = new Date()
    const currentDocs = documents.filter(d => d.expiryDate && new Date(d.expiryDate) > now).length

    const bullets = [
      `Fridge in-range: ${fridgePct}% (${inRange} / ${fridgeLogs.length} readings within 2-8°C)`,
      `Documents current: ${currentDocs} / ${documents.length} valid`,
    ]
    bullets.forEach(b => {
      if (y > 270) { doc.addPage(); y = 20 }
      doc.text(`•  ${b}`, 16, y)
      y += 5
    })
    y += 5
  }

  /* ── 4. Incident Log table ───────────────────────────── */
  if (sections.incidentLog !== false && nearMisses.length > 0) {
    if (y > 220) { doc.addPage(); y = 20 }
    y = addSectionHeader(doc, 'Incident Log', y)

    const rows = nearMisses.slice(0, 20)
    doc.autoTable({
      startY: y,
      margin: { left: 14, right: 14 },
      head: [['Date', 'Category', 'Severity', 'Status', 'Resolution']],
      body: rows.map(n => [
        fmtDate(n.createdAt || n.date),
        n.category || '—',
        n.severity || '—',
        n.status || '—',
        truncate(n.resolution || n.actionTaken || ''),
      ]),
      styles: {
        fontSize: 7.5, cellPadding: 2, textColor: DARK,
        lineColor: [220, 220, 220], lineWidth: 0.2, overflow: 'linebreak',
      },
      headStyles: { fillColor: PURPLE, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: LIGHT_BG },
      columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 30 }, 2: { cellWidth: 22 }, 3: { cellWidth: 22 }, 4: { cellWidth: 63 } },
    })
    y = doc.lastAutoTable.finalY + 6
    if (nearMisses.length > 20) {
      doc.setFontSize(8)
      doc.setTextColor(...MID)
      doc.text(`Showing 20 of ${nearMisses.length} incidents`, 14, y)
      y += 8
    }
  }

  /* ── 5. Temperature Records table ────────────────────── */
  if (sections.temperatureRecords !== false && fridgeLogs.length > 0) {
    if (y > 220) { doc.addPage(); y = 20 }
    y = addSectionHeader(doc, 'Temperature Records', y)

    const rows = fridgeLogs.slice(0, 30)
    doc.autoTable({
      startY: y,
      margin: { left: 14, right: 14 },
      head: [['Date', 'Fridge', 'Min °C', 'Max °C', 'Current °C', 'Status']],
      body: rows.map(f => {
        const t = Number(f.currentTemp)
        const inRange = !isNaN(t) && t >= 2 && t <= 8
        return [
          fmtDate(f.createdAt || f.date),
          f.fridgeName || f.location || 'Main',
          f.minTemp != null ? Number(f.minTemp).toFixed(1) : '—',
          f.maxTemp != null ? Number(f.maxTemp).toFixed(1) : '—',
          f.currentTemp != null ? Number(f.currentTemp).toFixed(1) : '—',
          inRange ? 'In Range' : 'Excursion',
        ]
      }),
      styles: {
        fontSize: 7.5, cellPadding: 2, textColor: DARK,
        lineColor: [220, 220, 220], lineWidth: 0.2,
      },
      headStyles: { fillColor: PURPLE, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: LIGHT_BG },
      didParseCell(data) {
        if (data.section === 'body' && data.column.index === 5) {
          data.cell.styles.textColor = data.cell.raw === 'In Range' ? EMERALD : RED
        }
      },
    })
    y = doc.lastAutoTable.finalY + 6
    if (fridgeLogs.length > 30) {
      doc.setFontSize(8)
      doc.setTextColor(...MID)
      doc.text(`Showing 30 of ${fridgeLogs.length} records`, 14, y)
      y += 8
    }
  }

  /* ── 6. Training Matrix table ────────────────────────── */
  if (sections.trainingMatrix !== false && staffMembers.length > 0 && trainingTopics.length > 0) {
    if (y > 200) { doc.addPage(); y = 20 }
    y = addSectionHeader(doc, 'Training Matrix', y)

    const topicNames = trainingTopics.slice(0, 8).map(t => t.name || t.topicName || 'Topic')
    const head = [['Staff', ...topicNames]]
    const body = staffMembers.map(s => {
      const row = [s.name || '—']
      trainingTopics.slice(0, 8).forEach(topic => {
        const log = trainingLogs.find(l =>
          l.staffId === s.id && l.topicId === topic.id
        )
        row.push(log?.status === 'completed' ? '✓' : '✗')
      })
      return row
    })

    doc.autoTable({
      startY: y,
      margin: { left: 14, right: 14 },
      head,
      body,
      styles: {
        fontSize: 7, cellPadding: 1.5, textColor: DARK,
        lineColor: [220, 220, 220], lineWidth: 0.2, halign: 'center',
      },
      headStyles: { fillColor: PURPLE, textColor: WHITE, fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: LIGHT_BG },
      columnStyles: { 0: { halign: 'left', cellWidth: 30 } },
      didParseCell(data) {
        if (data.section === 'body' && data.column.index > 0) {
          data.cell.styles.textColor = data.cell.raw === '✓' ? EMERALD : RED
          data.cell.styles.fontStyle = 'bold'
        }
      },
    })
    y = doc.lastAutoTable.finalY + 8
  }

  /* ── 7. Footer on every page ─────────────────────────── */
  addFooter(doc, config)

  /* ── 8. Save ─────────────────────────────────────────── */
  const dateStamp = new Date().toISOString().slice(0, 10)
  doc.save(`GPhC-Report-${dateStamp}.pdf`)
}
