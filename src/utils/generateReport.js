import jsPDF from 'jspdf'
import 'jspdf-autotable'

/* ── colour constants ──────────────────────────────────── */
const EMERALD = [16, 185, 129]
const RED = [239, 68, 68]
const AMBER = [245, 158, 11]
const DARK = [30, 30, 30]
const MID = [100, 100, 100]
const LIGHT_BG = [248, 250, 252]
const WHITE = [255, 255, 255]

/* ── helper: map status string to colour ───────────────── */
function statusColor(status) {
  switch (status) {
    case 'green':
    case 'current':
    case 'done':
    case 'valid':
      return EMERALD
    case 'amber':
    case 'due-soon':
    case 'due':
    case 'upcoming':
      return AMBER
    case 'red':
    case 'overdue':
    case 'expired':
      return RED
    default:
      return MID
  }
}

/* ── helper: map status string to human label ──────────── */
function statusLabel(status) {
  switch (status) {
    case 'green':
    case 'valid':
      return 'Valid'
    case 'amber':
      return 'Expiring Soon'
    case 'red':
    case 'expired':
      return 'Expired'
    case 'current':
      return 'Current'
    case 'due-soon':
      return 'Due Soon'
    case 'done':
      return 'Done'
    case 'due':
      return 'Due Today'
    case 'overdue':
      return 'Overdue'
    case 'upcoming':
      return 'Up to Date'
    default:
      return status || '—'
  }
}

/* ── helper: score number to colour ────────────────────── */
function scoreColor(score) {
  if (score >= 80) return EMERALD
  if (score >= 50) return AMBER
  return RED
}

/* ── helper: render section header with emerald underline ─ */
function addSectionHeader(doc, text, y) {
  if (y > 240) {
    doc.addPage()
    y = 20
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...DARK)
  doc.text(text, 14, y)
  doc.setDrawColor(...EMERALD)
  doc.setLineWidth(0.7)
  doc.line(14, y + 2, 196, y + 2)
  return y + 10
}

/* ── helper: add footer to every page ──────────────────── */
function addFooter(doc, config) {
  const pageCount = doc.internal.getNumberOfPages()
  const timestamp = new Date().toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(...MID)

    // Left: generated timestamp
    doc.text(`Generated: ${timestamp}`, 14, 287)

    // Centre: pharmacy name + confidential
    const centre = `${config.pharmacyName || 'Pharmacy'} — Confidential`
    const centreWidth = doc.getTextWidth(centre)
    doc.text(centre, (210 - centreWidth) / 2, 287)

    // Right: page x of y
    const pageText = `Page ${i} of ${pageCount}`
    const pageWidth = doc.getTextWidth(pageText)
    doc.text(pageText, 210 - 14 - pageWidth, 287)
  }
}

/* ── helper: format date for display ───────────────────── */
function fmtDate(dateStr) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00')).toLocaleDateString(
      'en-GB',
      { day: 'numeric', month: 'short', year: 'numeric' }
    )
  } catch {
    return dateStr
  }
}

/* ── helper: truncate text to max length ───────────────── */
function truncate(text, max = 80) {
  if (!text) return '—'
  return text.length > max ? text.slice(0, max - 1) + '\u2026' : text
}

/* ── helper: safe percentage ───────────────────────────── */
function pct(n) {
  if (n == null || isNaN(n)) return 0
  return Math.round(Number(n))
}

/* ── helper: severity colour ───────────────────────────── */
function severityColor(severity) {
  switch ((severity || '').toLowerCase()) {
    case 'high':
    case 'critical':
      return RED
    case 'medium':
      return AMBER
    case 'low':
      return EMERALD
    default:
      return MID
  }
}

/* ══════════════════════════════════════════════════════════
   MAIN EXPORT — generateComplianceReport
   ══════════════════════════════════════════════════════════ */
export default function generateComplianceReport({
  config = {},
  scores = {},
  documents = [],
  training = [],
  cleaning = [],
  safeguarding = [],
  rpCoverage = {},
  incidents = [],
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = 210
  let y = 0

  /* ── 1. Header banner ──────────────────────────────────── */
  doc.setFillColor(...EMERALD)
  doc.rect(0, 0, pageWidth, 44, 'F')

  // Pharmacy name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...WHITE)
  doc.text(config.pharmacyName || 'Pharmacy', 14, 16)

  // Sub-details
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  if (config.address) doc.text(config.address, 14, 23)
  const details = []
  if (config.gphcNumber) details.push(`GPhC: ${config.gphcNumber}`)
  if (config.superintendent) details.push(`Superintendent: ${config.superintendent}`)
  if (details.length) doc.text(details.join('   |   '), 14, 29)

  const reportDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  doc.setFontSize(9)
  doc.text(`Report Date: ${reportDate}`, 14, 36)

  // Overall score on the right
  const overall = pct(scores.overall)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(36)
  doc.text(`${overall}%`, pageWidth - 14, 26, { align: 'right' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Overall Compliance', pageWidth - 14, 34, { align: 'right' })

  y = 54

  /* ── 2. Compliance Summary — 4 score cards ─────────────── */
  y = addSectionHeader(doc, 'Compliance Summary', y)

  const cards = [
    { label: 'Documents', score: pct(scores.documents) },
    { label: 'Training', score: pct(scores.training) },
    { label: 'Cleaning', score: pct(scores.cleaning) },
    { label: 'Safeguarding', score: pct(scores.safeguarding) },
  ]

  const cardW = 42
  const cardH = 22
  const cardGap = 4
  const cardsStartX = 14

  cards.forEach((card, i) => {
    const cx = cardsStartX + i * (cardW + cardGap)
    const color = scoreColor(card.score)

    // Card background
    doc.setFillColor(...LIGHT_BG)
    doc.roundedRect(cx, y, cardW, cardH, 2, 2, 'F')

    // Score
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(...color)
    doc.text(`${card.score}%`, cx + cardW / 2, y + 11, { align: 'center' })

    // Label
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...DARK)
    doc.text(card.label, cx + cardW / 2, y + 18, { align: 'center' })
  })

  y += cardH + 10

  /* ── 3. Document Status Table ──────────────────────────── */
  if (documents.length > 0) {
    y = addSectionHeader(doc, 'Document Status', y)

    doc.autoTable({
      startY: y,
      margin: { left: 14, right: 14 },
      head: [['Document', 'Category', 'Expiry Date', 'Status']],
      body: documents.map((d) => [
        d.name || '—',
        d.category || '—',
        fmtDate(d.expiryDate),
        statusLabel(d.status),
      ]),
      styles: {
        fontSize: 8,
        cellPadding: 2,
        textColor: DARK,
        lineColor: [220, 220, 220],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: EMERALD,
        textColor: WHITE,
        fontStyle: 'bold',
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: LIGHT_BG },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 35 },
        2: { cellWidth: 35 },
        3: { cellWidth: 30 },
      },
      didParseCell(data) {
        if (data.section === 'body' && data.column.index === 3) {
          const row = documents[data.row.index]
          if (row) data.cell.styles.textColor = statusColor(row.status)
        }
      },
    })

    y = doc.lastAutoTable.finalY + 10
  }

  /* ── 4. Staff Training Status Table ────────────────────── */
  if (training.length > 0) {
    if (y > 240) {
      doc.addPage()
      y = 20
    }
    y = addSectionHeader(doc, 'Staff Training Status', y)

    doc.autoTable({
      startY: y,
      margin: { left: 14, right: 14 },
      head: [['Staff Member', 'Training Item', 'Target Date', 'Status']],
      body: training.map((t) => [
        t.staffName || '—',
        t.trainingItem || t.topicName || '—',
        fmtDate(t.targetDate),
        statusLabel(t.status),
      ]),
      styles: {
        fontSize: 8,
        cellPadding: 2,
        textColor: DARK,
        lineColor: [220, 220, 220],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: EMERALD,
        textColor: WHITE,
        fontStyle: 'bold',
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: LIGHT_BG },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 50 },
        2: { cellWidth: 35 },
        3: { cellWidth: 30 },
      },
      didParseCell(data) {
        if (data.section === 'body' && data.column.index === 3) {
          const row = training[data.row.index]
          if (row) data.cell.styles.textColor = statusColor(row.status)
        }
      },
    })

    y = doc.lastAutoTable.finalY + 10
  }

  /* ── 5. Cleaning Task Status Table ─────────────────────── */
  if (cleaning.length > 0) {
    if (y > 240) {
      doc.addPage()
      y = 20
    }
    y = addSectionHeader(doc, 'Cleaning Task Status', y)

    doc.autoTable({
      startY: y,
      margin: { left: 14, right: 14 },
      head: [['Task', 'Frequency', 'Status']],
      body: cleaning.map((c) => [
        c.name || c.taskName || '—',
        (c.frequency || '—').charAt(0).toUpperCase() + (c.frequency || '—').slice(1),
        statusLabel(c.status),
      ]),
      styles: {
        fontSize: 8,
        cellPadding: 2,
        textColor: DARK,
        lineColor: [220, 220, 220],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: EMERALD,
        textColor: WHITE,
        fontStyle: 'bold',
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: LIGHT_BG },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 40 },
        2: { cellWidth: 40 },
      },
      didParseCell(data) {
        if (data.section === 'body' && data.column.index === 2) {
          const row = cleaning[data.row.index]
          if (row) data.cell.styles.textColor = statusColor(row.status)
        }
      },
    })

    y = doc.lastAutoTable.finalY + 10
  }

  /* ── 6. Safeguarding Training Table ────────────────────── */
  if (safeguarding.length > 0) {
    if (y > 240) {
      doc.addPage()
      y = 20
    }
    y = addSectionHeader(doc, 'Safeguarding Training', y)

    doc.autoTable({
      startY: y,
      margin: { left: 14, right: 14 },
      head: [['Staff Member', 'Training Date', 'Delivered By', 'Status']],
      body: safeguarding.map((s) => [
        s.staffName || '—',
        fmtDate(s.trainingDate),
        s.deliveredBy || '—',
        statusLabel(s.status),
      ]),
      styles: {
        fontSize: 8,
        cellPadding: 2,
        textColor: DARK,
        lineColor: [220, 220, 220],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: EMERALD,
        textColor: WHITE,
        fontStyle: 'bold',
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: LIGHT_BG },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 35 },
        2: { cellWidth: 45 },
        3: { cellWidth: 30 },
      },
      didParseCell(data) {
        if (data.section === 'body' && data.column.index === 3) {
          const row = safeguarding[data.row.index]
          if (row) data.cell.styles.textColor = statusColor(row.status)
        }
      },
    })

    y = doc.lastAutoTable.finalY + 10
  }

  /* ── 7. RP Coverage ────────────────────────────────────── */
  if (y > 240) {
    doc.addPage()
    y = 20
  }
  y = addSectionHeader(doc, 'RP Coverage', y)

  const rpDaysCovered = rpCoverage.daysCovered ?? 0
  const rpTotalDays = rpCoverage.totalDays ?? 0
  const rpPct = rpTotalDays > 0 ? Math.round((rpDaysCovered / rpTotalDays) * 100) : 0
  const rpColor = scoreColor(rpPct)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...DARK)
  doc.text(`Days Covered: ${rpDaysCovered} / ${rpTotalDays}`, 14, y)
  y += 6

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...rpColor)
  doc.text(`Coverage: ${rpPct}%`, 14, y)
  y += 6

  if (rpCoverage.gapDays && rpCoverage.gapDays.length > 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...RED)
    const gapList = rpCoverage.gapDays
      .slice(0, 20)
      .map((d) => fmtDate(d))
      .join(', ')
    const gapText = `Gap Days (${rpCoverage.gapDays.length}): ${gapList}${rpCoverage.gapDays.length > 20 ? '...' : ''}`
    const splitGap = doc.splitTextToSize(gapText, pageWidth - 28)
    doc.text(splitGap, 14, y)
    y += splitGap.length * 4.5
  }

  y += 6

  /* ── 8. Incident Summary Table ─────────────────────────── */
  if (incidents.length > 0) {
    if (y > 240) {
      doc.addPage()
      y = 20
    }
    y = addSectionHeader(doc, 'Incident Summary', y)

    doc.autoTable({
      startY: y,
      margin: { left: 14, right: 14 },
      head: [['Date', 'Type', 'Severity', 'Description', 'Action Taken']],
      body: incidents.map((inc) => [
        fmtDate(inc.date),
        inc.type || '—',
        inc.severity || '—',
        truncate(inc.description),
        truncate(inc.actionTaken),
      ]),
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: DARK,
        lineColor: [220, 220, 220],
        lineWidth: 0.2,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: EMERALD,
        textColor: WHITE,
        fontStyle: 'bold',
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: LIGHT_BG },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 25 },
        2: { cellWidth: 20 },
        3: { cellWidth: 50 },
        4: { cellWidth: 42 },
      },
      didParseCell(data) {
        if (data.section === 'body' && data.column.index === 2) {
          const row = incidents[data.row.index]
          if (row) data.cell.styles.textColor = severityColor(row.severity)
        }
      },
    })

    y = doc.lastAutoTable.finalY + 10
  }

  /* ── 9. Footer on every page ───────────────────────────── */
  addFooter(doc, config)

  /* ── 10. Save ──────────────────────────────────────────── */
  const dateStamp = new Date().toISOString().slice(0, 10)
  doc.save(`compliance-report-${dateStamp}.pdf`)
}
