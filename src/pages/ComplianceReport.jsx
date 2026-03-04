import { useMemo } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import { usePharmacyConfig } from '../hooks/usePharmacyConfig'
import { getTrafficLight, getSafeguardingStatus, getTaskStatus, DEFAULT_CLEANING_TASKS } from '../utils/helpers'
import generateComplianceReport from '../utils/generateReport'

function ScoreCard({ label, score, items }) {
  const color = score >= 80 ? 'var(--ec-em)' : score >= 50 ? 'var(--ec-warn)' : 'var(--ec-crit)'
  return (
    <div className="rounded-xl p-4 flex-1 min-w-[200px] bg-ec-card border border-ec-border">
      <div className="text-xs font-bold text-ec-t3 uppercase tracking-wider mb-2">{label}</div>
      <div className="text-3xl font-extrabold mb-1" style={{ color }}>{score}%</div>
      <div className="text-xs text-ec-t3">{items}</div>
    </div>
  )
}

export default function ComplianceReport() {
  const [pharmacyConfig] = usePharmacyConfig()
  const [documents] = useSupabase('documents', [])
  const [staffTraining] = useSupabase('staff_training', [])
  const [safeguarding] = useSupabase('safeguarding_records', [])
  const [cleaningTasks] = useSupabase('cleaning_tasks', DEFAULT_CLEANING_TASKS)
  const [cleaningEntries] = useSupabase('cleaning_entries', [])
  const [rpLogs] = useSupabase('rp_log', [])
  const [incidents] = useSupabase('incidents', [])

  // Document score
  const docStatuses = documents.map(d => getTrafficLight(d.expiryDate))
  const greenDocs = docStatuses.filter(s => s === 'green').length
  const docScore = documents.length > 0 ? Math.round((greenDocs / documents.length) * 100) : 100

  // Training score
  const staffScore = staffTraining.length > 0
    ? Math.round((staffTraining.filter(e => e.status === 'Complete').length / staffTraining.length) * 100) : 100

  // Cleaning score
  const seen = new Set()
  const taskStatuses = cleaningTasks.filter(t => {
    if (seen.has(t.name)) return false; seen.add(t.name); return true
  }).map(t => ({ ...t, status: getTaskStatus(t.name, t.frequency, cleaningEntries) }))
  const cleaningUpToDate = taskStatuses.filter(t => t.status === 'done' || t.status === 'upcoming').length
  const cleaningScore = cleaningTasks.length > 0 ? Math.round((cleaningUpToDate / taskStatuses.length) * 100) : 100

  // Safeguarding score
  const sgCurrent = safeguarding.filter(r => getSafeguardingStatus(r.trainingDate) === 'current').length
  const sgScore = safeguarding.length > 0 ? Math.round((sgCurrent / safeguarding.length) * 100) : 100

  const overallScore = Math.round((docScore + staffScore + cleaningScore + sgScore) / 4)
  const overallColor = overallScore >= 80 ? 'var(--ec-em)' : overallScore >= 50 ? 'var(--ec-warn)' : 'var(--ec-crit)'

  // RP coverage (last 30 days)
  const rpCoverage = useMemo(() => {
    const days = []
    const d = new Date()
    for (let i = 0; i < 30; i++) {
      days.push(d.toISOString().slice(0, 10))
      d.setDate(d.getDate() - 1)
    }
    const loggedDates = new Set(rpLogs.map(l => l.date))
    const covered = days.filter(day => loggedDates.has(day)).length
    const gaps = days.filter(day => !loggedDates.has(day))
    return { covered, total: 30, gaps }
  }, [rpLogs])

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const handleDownloadPdf = () => {
    // Map documents
    const docData = documents.map(d => ({
      name: d.documentName,
      category: d.category || '',
      expiryDate: d.expiryDate || '',
      status: getTrafficLight(d.expiryDate),
    }))

    // Map training
    const trainingData = staffTraining.map(t => ({
      staffName: t.staffName || '',
      trainingItem: t.trainingItem || t.topicName || '',
      targetDate: t.targetDate || '',
      status: t.status || '',
    }))

    // Map cleaning (deduplicated, reuse taskStatuses already computed)
    const cleaningData = taskStatuses.map(t => ({
      name: t.name,
      frequency: t.frequency || '',
      status: t.status,
    }))

    // Map safeguarding
    const safeguardingData = safeguarding.map(r => ({
      staffName: r.staffName || '',
      trainingDate: r.trainingDate || '',
      deliveredBy: r.deliveredBy || '',
      status: getSafeguardingStatus(r.trainingDate),
    }))

    // RP coverage with the property names generateReport expects
    const rpData = {
      daysCovered: rpCoverage.covered,
      totalDays: rpCoverage.total,
      gapDays: rpCoverage.gaps,
    }

    // Filter incidents to last 90 days
    const now90 = new Date()
    now90.setDate(now90.getDate() - 90)
    const recentIncidents = incidents
      .filter(inc => inc.date && new Date(inc.date) >= now90)
      .map(inc => ({
        date: inc.date || '',
        type: inc.type || '',
        severity: inc.severity || '',
        description: inc.description || '',
        actionTaken: inc.actionTaken || '',
      }))

    generateComplianceReport({
      config: {
        pharmacyName: pharmacyConfig.pharmacyName || '',
        address: pharmacyConfig.address || '',
        gphcNumber: pharmacyConfig.gphcNumber || '',
        superintendent: pharmacyConfig.superintendent || '',
      },
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
      safeguarding: safeguardingData,
      rpCoverage: rpData,
      incidents: recentIncidents,
    })
  }

  return (
    <div className="space-y-6 compliance-report">
      {/* Action buttons */}
      <div className="flex justify-end gap-3 no-print">
        <button
          onClick={handleDownloadPdf}
          className="px-4 py-2 rounded-lg bg-transparent font-semibold text-sm cursor-pointer transition-colors flex items-center gap-2"
          style={{ border: '1.5px solid var(--ec-em)', color: 'var(--ec-em)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--ec-em)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ec-em)' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 1v9m0 0L5 7m3 3l3-3M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Download PDF
        </button>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-lg bg-ec-em text-white font-semibold text-sm border-none cursor-pointer hover:bg-ec-em-dark transition-colors"
        >
          Print Report
        </button>
      </div>

      {/* Header */}
      <div className="rounded-xl p-6 text-center bg-ec-card border border-ec-border">
        <div className="text-lg font-extrabold text-ec-t1">{pharmacyConfig.pharmacyName || 'iPharmacy Direct'}</div>
        {pharmacyConfig.address && <div className="text-sm text-ec-t3 mt-1">{pharmacyConfig.address}</div>}
        <div className="text-xs text-ec-t3 mt-2">
          GPhC: {pharmacyConfig.gphcNumber || '\u2014'} · Superintendent: {pharmacyConfig.superintendent || '\u2014'}
        </div>
        <div className="text-xs text-ec-t2 mt-3 font-semibold">Compliance Report — {today}</div>
      </div>

      {/* Overall score */}
      <div className="text-center py-4">
        <div className="text-6xl font-extrabold" style={{ color: overallColor }}>{overallScore}%</div>
        <div className="text-sm text-ec-t3 mt-1">Overall Compliance Score</div>
      </div>

      {/* 4 score cards */}
      <div className="flex gap-4 flex-wrap">
        <ScoreCard label="Documents" score={docScore} items={`${greenDocs}/${documents.length} current`} />
        <ScoreCard label="Training" score={staffScore} items={`${staffTraining.filter(e => e.status === 'Complete').length}/${staffTraining.length} complete`} />
        <ScoreCard label="Cleaning" score={cleaningScore} items={`${cleaningUpToDate}/${taskStatuses.length} up to date`} />
        <ScoreCard label="Safeguarding" score={sgScore} items={`${sgCurrent}/${safeguarding.length} current`} />
      </div>

      {/* RP Coverage */}
      <div className="rounded-xl p-5 bg-ec-card border border-ec-border">
        <h3 className="text-sm font-bold text-ec-t1 mb-3">RP Log Coverage (Last 30 Days)</h3>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl font-extrabold text-ec-t1">{rpCoverage.covered}/{rpCoverage.total}</span>
          <span className="text-xs text-ec-t3">days covered</span>
        </div>
        {rpCoverage.gaps.length > 0 && rpCoverage.gaps.length <= 10 && (
          <div className="text-xs text-ec-warn mt-2">
            Gap days: {rpCoverage.gaps.slice(0, 10).join(', ')}
          </div>
        )}
      </div>

      {/* Document status table */}
      <div>
        <h3 className="text-sm font-bold text-ec-t1 mb-3">Document Status</h3>
        {documents.length === 0 ? (
          <div className="text-sm text-ec-t3">No documents tracked.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-ec-border">
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
              <thead className="text-left">
                <tr>
                  <th className="text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">Document</th>
                  <th className="text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">Category</th>
                  <th className="text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">Expiry Date</th>
                  <th className="text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">Status</th>
                </tr>
              </thead>
              <tbody>
                {documents.map(doc => {
                  const status = getTrafficLight(doc.expiryDate)
                  const statusLabel = status === 'green' ? 'Current' : status === 'amber' ? 'Expiring Soon' : 'Expired'
                  const statusColor = status === 'green' ? 'text-ec-em' : status === 'amber' ? 'text-ec-warn' : 'text-ec-crit'
                  return (
                    <tr key={doc.id}>
                      <td className="px-4 py-2.5 text-ec-t1 border-b border-ec-div font-medium">{doc.documentName}</td>
                      <td className="px-4 py-2.5 text-ec-t3 border-b border-ec-div">{doc.category || '\u2014'}</td>
                      <td className="px-4 py-2.5 text-ec-t2 border-b border-ec-div tabular-nums">{doc.expiryDate || '\u2014'}</td>
                      <td className={`px-4 py-2.5 border-b border-ec-div font-semibold text-xs ${statusColor}`}>{statusLabel}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-4 border-t border-ec-div text-xs text-ec-t5">
        Generated by iPharmacy Direct Compliance Tracker
      </div>
    </div>
  )
}
