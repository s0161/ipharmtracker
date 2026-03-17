# PDF Compliance Report Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add one-click PDF generation of the compliance report for GPhC inspectors, with pharmacy header, scores, document status table, training matrix, cleaning summary, RP coverage, and incident summary.

**Architecture:** Use `jspdf` + `jspdf-autotable` to build a structured, multi-section PDF. A new utility `src/utils/generateReport.js` handles all PDF construction. ComplianceReport.jsx gets a "Download PDF" button that collects all data from existing hooks and passes it to the generator. No tests — this is a visual PDF output on a project without a test runner.

**Tech Stack:** React 18, jspdf, jspdf-autotable, existing useSupabase/usePharmacyConfig hooks, helpers.js formatting functions

---

### Task 1: Install jspdf + jspdf-autotable

**Step 1: Install dependencies**

Run: `npm install jspdf jspdf-autotable`
Expected: Both packages added to `dependencies` in package.json

**Step 2: Verify build**

Run: `npx vite build 2>&1 | tail -5`
Expected: `✓ built in`

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add jspdf and jspdf-autotable for PDF report generation"
```

---

### Task 2: Create generateReport.js utility

**Files:**
- Create: `src/utils/generateReport.js`

**Step 1: Create the PDF generator**

This function receives pre-calculated data and builds a multi-page PDF. It does NOT call any hooks — the caller collects all data and passes it in.

```js
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const EMERALD = [16, 185, 129]
const RED = [239, 68, 68]
const AMBER = [245, 158, 11]
const DARK = [30, 30, 30]
const MID = [100, 100, 100]
const LIGHT_BG = [248, 250, 252]

function statusColor(status) {
  if (status === 'green' || status === 'current' || status === 'Complete' || status === 'done') return EMERALD
  if (status === 'amber' || status === 'due-soon' || status === 'In Progress' || status === 'due') return AMBER
  return RED
}

function statusLabel(status) {
  if (status === 'green') return 'Valid'
  if (status === 'amber') return 'Expiring Soon'
  if (status === 'red') return 'Expired'
  if (status === 'current') return 'Current'
  if (status === 'due-soon') return 'Due Soon'
  if (status === 'overdue') return 'Overdue'
  if (status === 'done') return 'Up to Date'
  if (status === 'due' || status === 'upcoming') return 'Pending'
  return status || '—'
}

function scoreColor(score) {
  if (score >= 80) return EMERALD
  if (score >= 50) return AMBER
  return RED
}

function addSectionHeader(doc, text, y) {
  doc.setFontSize(13)
  doc.setTextColor(...DARK)
  doc.setFont('helvetica', 'bold')
  doc.text(text, 14, y)
  doc.setDrawColor(...EMERALD)
  doc.setLineWidth(0.8)
  doc.line(14, y + 2, 196, y + 2)
  return y + 10
}

function addFooter(doc, config) {
  const pageCount = doc.internal.getNumberOfPages()
  const now = new Date()
  const timestamp = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    + ' ' + now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(...MID)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated: ${timestamp}`, 14, 287)
    doc.text(`${config.pharmacyName || 'iPharmacy Direct'} — Confidential`, 105, 287, { align: 'center' })
    doc.text(`Page ${i} of ${pageCount}`, 196, 287, { align: 'right' })
  }
}

export default function generateComplianceReport({
  config,
  scores,
  documents,
  training,
  cleaning,
  safeguarding,
  rpCoverage,
  incidents,
}) {
  const doc = new jsPDF()
  let y = 14

  // ── Header ──
  doc.setFillColor(...EMERALD)
  doc.rect(0, 0, 210, 38, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(config.pharmacyName || 'iPharmacy Direct', 14, 16)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const headerLines = []
  if (config.address) headerLines.push(config.address)
  if (config.gphcNumber) headerLines.push(`GPhC Registration: ${config.gphcNumber}`)
  if (config.superintendent) headerLines.push(`Superintendent: ${config.superintendent}`)
  headerLines.push(`Report Date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`)
  doc.text(headerLines.join('  |  '), 14, 24)

  doc.setFontSize(36)
  doc.setFont('helvetica', 'bold')
  doc.text(`${scores.overall}%`, 196, 22, { align: 'right' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Overall Compliance', 196, 28, { align: 'right' })

  y = 48

  // ── Score Summary ──
  y = addSectionHeader(doc, 'Compliance Summary', y)

  const scoreCards = [
    { label: 'Documents', score: scores.documents },
    { label: 'Training', score: scores.training },
    { label: 'Cleaning', score: scores.cleaning },
    { label: 'Safeguarding', score: scores.safeguarding },
  ]

  const cardW = 43
  const cardGap = 3
  scoreCards.forEach((card, i) => {
    const x = 14 + i * (cardW + cardGap)
    doc.setFillColor(...LIGHT_BG)
    doc.roundedRect(x, y, cardW, 22, 2, 2, 'F')
    doc.setFontSize(9)
    doc.setTextColor(...MID)
    doc.setFont('helvetica', 'normal')
    doc.text(card.label, x + cardW / 2, y + 8, { align: 'center' })
    doc.setFontSize(18)
    doc.setTextColor(...scoreColor(card.score))
    doc.setFont('helvetica', 'bold')
    doc.text(`${card.score}%`, x + cardW / 2, y + 18, { align: 'center' })
  })

  y += 30

  // ── Document Status Table ──
  if (documents.length > 0) {
    y = addSectionHeader(doc, 'Document Status', y)

    doc.autoTable({
      startY: y,
      head: [['Document', 'Category', 'Expiry Date', 'Status']],
      body: documents.map(d => [
        d.name,
        d.category || '—',
        d.expiryDate || '—',
        statusLabel(d.status),
      ]),
      styles: { fontSize: 9, cellPadding: 3, font: 'helvetica' },
      headStyles: { fillColor: DARK, textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        3: { fontStyle: 'bold' },
      },
      didParseCell(data) {
        if (data.section === 'body' && data.column.index === 3) {
          const status = documents[data.row.index]?.status
          data.cell.styles.textColor = statusColor(status)
        }
      },
      margin: { left: 14, right: 14 },
    })
    y = doc.lastAutoTable.finalY + 10
  }

  // ── Training Status ──
  if (training.length > 0) {
    if (y > 240) { doc.addPage(); y = 14 }
    y = addSectionHeader(doc, 'Staff Training Status', y)

    doc.autoTable({
      startY: y,
      head: [['Staff Member', 'Training Item', 'Target Date', 'Status']],
      body: training.map(t => [
        t.staffName,
        t.trainingItem || '—',
        t.targetDate || '—',
        t.status || '—',
      ]),
      styles: { fontSize: 9, cellPadding: 3, font: 'helvetica' },
      headStyles: { fillColor: DARK, textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: { 3: { fontStyle: 'bold' } },
      didParseCell(data) {
        if (data.section === 'body' && data.column.index === 3) {
          const s = training[data.row.index]?.status
          if (s === 'Complete') data.cell.styles.textColor = EMERALD
          else if (s === 'In Progress') data.cell.styles.textColor = AMBER
          else data.cell.styles.textColor = RED
        }
      },
      margin: { left: 14, right: 14 },
    })
    y = doc.lastAutoTable.finalY + 10
  }

  // ── Cleaning Summary ──
  if (cleaning.length > 0) {
    if (y > 240) { doc.addPage(); y = 14 }
    y = addSectionHeader(doc, 'Cleaning Task Status', y)

    doc.autoTable({
      startY: y,
      head: [['Task', 'Frequency', 'Status']],
      body: cleaning.map(c => [
        c.name,
        c.frequency,
        statusLabel(c.status),
      ]),
      styles: { fontSize: 9, cellPadding: 3, font: 'helvetica' },
      headStyles: { fillColor: DARK, textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: { 2: { fontStyle: 'bold' } },
      didParseCell(data) {
        if (data.section === 'body' && data.column.index === 2) {
          const s = cleaning[data.row.index]?.status
          data.cell.styles.textColor = statusColor(s)
        }
      },
      margin: { left: 14, right: 14 },
    })
    y = doc.lastAutoTable.finalY + 10
  }

  // ── Safeguarding Records ──
  if (safeguarding.length > 0) {
    if (y > 240) { doc.addPage(); y = 14 }
    y = addSectionHeader(doc, 'Safeguarding Training', y)

    doc.autoTable({
      startY: y,
      head: [['Staff Member', 'Training Date', 'Delivered By', 'Status']],
      body: safeguarding.map(s => [
        s.staffName,
        s.trainingDate || '—',
        s.deliveredBy || '—',
        statusLabel(s.status),
      ]),
      styles: { fontSize: 9, cellPadding: 3, font: 'helvetica' },
      headStyles: { fillColor: DARK, textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: { 3: { fontStyle: 'bold' } },
      didParseCell(data) {
        if (data.section === 'body' && data.column.index === 3) {
          const s = safeguarding[data.row.index]?.status
          data.cell.styles.textColor = statusColor(s)
        }
      },
      margin: { left: 14, right: 14 },
    })
    y = doc.lastAutoTable.finalY + 10
  }

  // ── RP Coverage ──
  if (rpCoverage) {
    if (y > 250) { doc.addPage(); y = 14 }
    y = addSectionHeader(doc, 'RP Coverage (Last 30 Days)', y)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...DARK)
    doc.text(`Days covered: ${rpCoverage.covered} / ${rpCoverage.total}`, 14, y)
    y += 5
    doc.text(`Coverage rate: ${rpCoverage.percentage}%`, 14, y)
    y += 5

    if (rpCoverage.gaps && rpCoverage.gaps.length > 0) {
      doc.setTextColor(...RED)
      doc.text(`Gap days: ${rpCoverage.gaps.join(', ')}`, 14, y)
      y += 5
    } else {
      doc.setTextColor(...EMERALD)
      doc.text('No coverage gaps detected.', 14, y)
      y += 5
    }
    doc.setTextColor(...DARK)
    y += 5
  }

  // ── Incident Summary ──
  if (incidents && incidents.length > 0) {
    if (y > 240) { doc.addPage(); y = 14 }
    y = addSectionHeader(doc, 'Incident Summary (Last 90 Days)', y)

    doc.autoTable({
      startY: y,
      head: [['Date', 'Type', 'Severity', 'Description', 'Action Taken']],
      body: incidents.map(inc => [
        inc.date || '—',
        inc.type || '—',
        inc.severity || '—',
        (inc.description || '').substring(0, 80) + ((inc.description || '').length > 80 ? '...' : ''),
        (inc.actionTaken || '').substring(0, 60) + ((inc.actionTaken || '').length > 60 ? '...' : ''),
      ]),
      styles: { fontSize: 8, cellPadding: 2.5, font: 'helvetica' },
      headStyles: { fillColor: DARK, textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 28 },
        2: { cellWidth: 20 },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 40 },
      },
      didParseCell(data) {
        if (data.section === 'body' && data.column.index === 2) {
          const sev = incidents[data.row.index]?.severity?.toLowerCase()
          if (sev === 'high') data.cell.styles.textColor = RED
          else if (sev === 'medium') data.cell.styles.textColor = AMBER
          else data.cell.styles.textColor = EMERALD
        }
      },
      margin: { left: 14, right: 14 },
    })
    y = doc.lastAutoTable.finalY + 10
  }

  // ── Footer ──
  addFooter(doc, config)

  // ── Save ──
  const dateStr = new Date().toISOString().slice(0, 10)
  doc.save(`compliance-report-${dateStr}.pdf`)
}
```

**Step 2: Verify build**

Run: `npx vite build 2>&1 | tail -5`
Expected: `✓ built in`

**Step 3: Commit**

```bash
git add src/utils/generateReport.js
git commit -m "feat: add PDF compliance report generator with jspdf"
```

---

### Task 3: Wire PDF button into ComplianceReport.jsx

**Files:**
- Modify: `src/pages/ComplianceReport.jsx`

**Step 1: Add import and data collection**

At the top of ComplianceReport.jsx, add the import:
```jsx
import generateComplianceReport from '../utils/generateReport'
```

Also import any missing data hooks. The page already loads `documents`, `staffTraining`, `cleaningTasks`, `cleaningEntries`, `safeguarding`, and `rpLogs`. It also calls `usePharmacyConfig()`. We additionally need incidents, so add:
```jsx
const [incidents] = useSupabase('incidents', [])
```

**Step 2: Add the PDF download handler**

Create a `handleDownloadPdf` function inside the component that collects all data, maps it to the shape `generateComplianceReport` expects, and calls it:

```jsx
const handleDownloadPdf = () => {
  // Documents with status
  const docData = documents.map(d => ({
    name: d.documentName || d.name,
    category: d.category,
    expiryDate: d.expiryDate ? formatDate(d.expiryDate) : '',
    status: getTrafficLight(d.expiryDate),
  }))

  // Training
  const trainingData = staffTraining.map(t => ({
    staffName: t.staffName,
    trainingItem: t.trainingItem,
    targetDate: t.targetDate ? formatDate(t.targetDate) : '',
    status: t.status,
  }))

  // Cleaning tasks with status
  const seen = new Set()
  const cleaningData = cleaningTasks
    .filter(t => { if (seen.has(t.name)) return false; seen.add(t.name); return true })
    .map(t => ({
      name: t.name,
      frequency: t.frequency,
      status: getTaskStatus(t.name, t.frequency, cleaningEntries),
    }))

  // Safeguarding with status
  const sgData = safeguarding.map(r => ({
    staffName: r.staffName,
    trainingDate: r.trainingDate ? formatDate(r.trainingDate) : '',
    deliveredBy: r.deliveredBy,
    status: getSafeguardingStatus(r.trainingDate),
  }))

  // RP coverage (last 30 days)
  const today = new Date()
  const rpDays = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (d.getDay() !== 0) rpDays.push(d.toISOString().slice(0, 10))
  }
  const coveredDays = rpDays.filter(d => rpLogs.some(l => l.date === d))
  const gapDays = rpDays.filter(d => !rpLogs.some(l => l.date === d))

  // Incidents (last 90 days)
  const ninetyAgo = new Date(today)
  ninetyAgo.setDate(ninetyAgo.getDate() - 90)
  const recentIncidents = incidents
    .filter(inc => new Date(inc.date) >= ninetyAgo)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(inc => ({
      date: inc.date ? formatDate(inc.date) : '',
      type: inc.type,
      severity: inc.severity,
      description: inc.description,
      actionTaken: inc.actionTaken,
    }))

  generateComplianceReport({
    config: pharmacyConfig,
    scores: {
      overall: overallScore,
      documents: docScore,
      training: staffScore,
      cleaning: cleaningScore,
      safeguarding: sgScore,
    },
    documents: docData,
    training: trainingData,
    cleaning: cleaningData,
    safeguarding: sgData,
    rpCoverage: {
      covered: coveredDays.length,
      total: rpDays.length,
      percentage: rpDays.length > 0 ? Math.round((coveredDays.length / rpDays.length) * 100) : 100,
      gaps: gapDays,
    },
    incidents: recentIncidents,
  })
}
```

Note: The score variables (`overallScore`, `docScore`, `staffScore`, `cleaningScore`, `sgScore`) should already be calculated in ComplianceReport.jsx. If they use different names, match the existing variable names.

**Step 3: Add the PDF button to the UI**

Find the existing "Print Report" or CSV export button area and add a PDF button next to it:

```jsx
<button
  onClick={handleDownloadPdf}
  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border-none cursor-pointer transition-colors"
  style={{ backgroundColor: 'var(--ec-em)', color: '#fff' }}
>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
  Download PDF
</button>
```

**Step 4: Verify build**

Run: `npx vite build 2>&1 | tail -5`
Expected: `✓ built in`

**Step 5: Commit**

```bash
git add src/pages/ComplianceReport.jsx
git commit -m "feat: add Download PDF button to compliance report page"
```

---

### Task 4: Final Verification

**Step 1: Build check**

Run: `npx vite build 2>&1 | tail -10`
Expected: `✓ built in` with no errors

**Step 2: Manual check**

Run: `npx vite dev`
- Navigate to `/#/compliance-report`
- Click "Download PDF"
- Expected: Browser downloads `compliance-report-YYYY-MM-DD.pdf`
- Open PDF and verify:
  - Emerald header with pharmacy name and overall score
  - 4 score cards (Documents, Training, Cleaning, Safeguarding)
  - Document status table with color-coded status
  - Training table
  - Cleaning task table
  - Safeguarding table
  - RP coverage summary
  - Incident summary (if any incidents exist)
  - Footer with timestamp and page numbers

**Step 3: Push**

```bash
git push
```
