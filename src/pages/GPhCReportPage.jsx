import { useState, useMemo } from 'react'
import { useGPhCReport } from '../hooks/useGPhCReport'
import { useGPhCScores, getScoreColor } from '../hooks/useGPhCScores'
import { usePharmacyConfig } from '../hooks/usePharmacyConfig'
import { useUser } from '../contexts/UserContext'
import generateGPhCReport from '../utils/generateGPhCReport'

/* ── date helpers ──────────────────────────────────────── */
function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}
function today() { return new Date().toISOString().slice(0, 10) }

const RANGE_OPTIONS = [
  { label: 'Last 7 days', from: () => daysAgo(7), to: today },
  { label: 'Last 30 days', from: () => daysAgo(30), to: today },
  { label: 'Last 3 months', from: () => daysAgo(90), to: today },
  { label: 'Last 12 months', from: () => daysAgo(365), to: today },
  { label: 'Custom', from: null, to: null },
]

const GPHC_DESCRIPTIONS = {
  1: 'The governance arrangements safeguard the health, safety and wellbeing of patients and the public.',
  2: 'Staff are empowered and competent to safeguard the health, safety and wellbeing of patients and the public.',
  3: 'The premises used are safe, clean, properly maintained and suitable for the services provided.',
  4: 'The pharmacy services are provided safely and effectively.',
  5: 'Equipment and facilities used are safe, suitable and properly maintained.',
}

const STD_COLORS = ['#0073e6', '#635bff', '#10b981', '#f59e0b', '#0d9488']

const DEFAULT_SECTIONS = {
  executiveSummary: true,
  standard1: true, standard2: true, standard3: true, standard4: true, standard5: true,
  incidentLog: true, temperatureRecords: true, trainingMatrix: true,
}

/* ══════════════════════════════════════════════════════════
   REPORT SETTINGS — right column
   ══════════════════════════════════════════════════════════ */
function ReportSettings({
  rangeIdx, setRangeIdx, customFrom, setCustomFrom, customTo, setCustomTo,
  sections, toggleSection, pharmacy, setPharmacy, onGenerate, loading,
}) {
  const sectionLabels = [
    ['executiveSummary', 'Executive Summary'],
    ['standard1', 'Standard 1 — Governance'],
    ['standard2', 'Standard 2 — Staff'],
    ['standard3', 'Standard 3 — Premises'],
    ['standard4', 'Standard 4 — Services'],
    ['standard5', 'Standard 5 — Equipment'],
    ['incidentLog', 'Incident Log'],
    ['temperatureRecords', 'Temperature Records'],
    ['trainingMatrix', 'Training Matrix'],
  ]

  return (
    <div className="bg-ec-card rounded-xl border border-ec-border p-4 space-y-5">
      <div className="text-sm font-bold text-ec-t1">Report Settings</div>

      {/* Date range */}
      <div>
        <label className="text-xs font-semibold text-ec-t3 uppercase tracking-wider block mb-1.5">Date Range</label>
        <select
          value={rangeIdx}
          onChange={e => setRangeIdx(Number(e.target.value))}
          className="w-full px-3 py-2 rounded-lg bg-ec-card border border-ec-border text-sm text-ec-t1
            focus:outline-none focus:ring-2 focus:ring-[#635bff]/30"
        >
          {RANGE_OPTIONS.map((o, i) => <option key={i} value={i}>{o.label}</option>)}
        </select>
        {rangeIdx === 4 && (
          <div className="flex gap-2 mt-2">
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
              className="flex-1 px-2 py-1.5 rounded-lg bg-ec-card border border-ec-border text-xs text-ec-t1" />
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
              className="flex-1 px-2 py-1.5 rounded-lg bg-ec-card border border-ec-border text-xs text-ec-t1" />
          </div>
        )}
      </div>

      {/* Section checkboxes */}
      <div>
        <label className="text-xs font-semibold text-ec-t3 uppercase tracking-wider block mb-1.5">Sections to Include</label>
        <div className="space-y-1.5">
          {sectionLabels.map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-xs text-ec-t2 cursor-pointer">
              <input type="checkbox" checked={sections[key]} onChange={() => toggleSection(key)}
                className="rounded border-ec-border text-[#635bff] focus:ring-[#635bff]/30" />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Pharmacy details */}
      <div>
        <label className="text-xs font-semibold text-ec-t3 uppercase tracking-wider block mb-1.5">Pharmacy Details</label>
        <div className="space-y-2">
          {[
            ['pharmacyName', 'Pharmacy Name'],
            ['gphcNumber', 'GPhC Number'],
            ['superintendent', 'Superintendent'],
            ['preparedBy', 'Prepared By'],
          ].map(([key, label]) => (
            <div key={key}>
              <div className="text-[10px] text-ec-t3 mb-0.5">{label}</div>
              <input
                value={pharmacy[key] || ''}
                onChange={e => setPharmacy(p => ({ ...p, [key]: e.target.value }))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-ec-card border border-ec-border text-xs text-ec-t1
                  focus:outline-none focus:ring-2 focus:ring-[#635bff]/30"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={onGenerate}
        disabled={loading}
        className="w-full py-2.5 rounded-xl text-sm font-bold text-white border-none cursor-pointer
          transition-all duration-200 hover:opacity-90 disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}
      >
        {loading ? 'Loading data…' : 'Generate & Download PDF'}
      </button>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   REPORT PREVIEW — left column
   ══════════════════════════════════════════════════════════ */
function ReportPreview({ standards, overall, sections, dateFrom, dateTo, pharmacy, evidence }) {
  const {
    nearMisses, actionItems, auditLog, mhraAcks,
    trainingLogs, trainingTopics, staffMembers, inductionCompletions, inductionModules, appraisals,
    fridgeLogs, cleaningEntries, cleaningTasks,
    patientQueries, mhraFlags, documents,
  } = evidence

  return (
    <div className="space-y-4">
      {/* Report header banner */}
      <div className="rounded-xl overflow-hidden">
        <div className="px-5 py-4" style={{ background: 'linear-gradient(135deg, #0a2540 0%, #0f3d2b 50%, #1a1a4e 100%)' }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-white/60 text-[10px] font-semibold tracking-wider uppercase">{pharmacy.pharmacyName} · GPhC {pharmacy.gphcNumber}</div>
              <div className="text-white text-lg font-bold mt-1">GPhC Compliance Report</div>
              <div className="text-white/50 text-xs mt-1">
                {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                {' · '}Period: {dateFrom} to {dateTo}
              </div>
              {pharmacy.superintendent && (
                <div className="text-white/40 text-[10px] mt-1">Superintendent: {pharmacy.superintendent}</div>
              )}
            </div>
            <div className="text-right">
              <div className="text-3xl font-extrabold" style={{ color: getScoreColor(overall.score) }}>{overall.score}%</div>
              <div className="text-white/50 text-xs">{overall.rating}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      {sections.executiveSummary && (
        <div className="bg-ec-card rounded-xl border border-ec-border p-4">
          <div className="text-sm font-bold text-ec-t1 mb-3">Executive Summary</div>
          <div className="grid grid-cols-5 gap-2">
            {standards.map((std, i) => (
              <div key={std.id} className="rounded-lg p-2.5 text-center bg-ec-card border border-ec-border"
                style={{ borderTop: `3px solid ${STD_COLORS[i]}` }}>
                <div className="text-xl font-extrabold" style={{ color: getScoreColor(std.score) }}>{std.score}%</div>
                <div className="text-[10px] font-semibold text-ec-t3 mt-0.5">S{std.id}: {std.name}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-center">
            <span className="text-sm font-bold" style={{ color: getScoreColor(overall.score) }}>
              Overall Readiness: {overall.score}% — {overall.rating}
            </span>
          </div>
        </div>
      )}

      {/* Standard 1 — Governance */}
      {sections.standard1 && (
        <StandardSection id={1} name="Governance" color={STD_COLORS[0]} std={standards.find(s => s.id === 1)}>
          <EvidenceBullets items={[
            `Near misses logged: ${nearMisses.length} (${['high', 'medium', 'low'].map(s =>
              `${nearMisses.filter(n => (n.severity || '').toLowerCase() === s).length} ${s}`).join(', ')})`,
            `MHRA alerts acknowledged: ${mhraAcks.filter(a => a.acknowledged).length} / ${mhraAcks.length}`,
            `Action items completed: ${actionItems.filter(a => a.completed).length} / ${actionItems.length}`,
            `Audit log entries: ${auditLog.length}`,
          ]} />
        </StandardSection>
      )}

      {/* Standard 2 — Staff */}
      {sections.standard2 && (
        <StandardSection id={2} name="Staff" color={STD_COLORS[1]} std={standards.find(s => s.id === 2)}>
          <EvidenceBullets items={(() => {
            const completedT = trainingLogs.filter(l => l.status === 'completed').length
            const now = new Date()
            const upAppr = appraisals.filter(a => a.nextDue && new Date(a.nextDue) > now).length
            return [
              `Training completion: ${completedT} / ${trainingTopics.length} topics`,
              `Induction completions: ${inductionCompletions.length} / ${staffMembers.length * Math.max(inductionModules.length, 1)}`,
              `Appraisals up to date: ${upAppr} / ${staffMembers.length}`,
            ]
          })()} />
        </StandardSection>
      )}

      {/* Standard 3 — Premises */}
      {sections.standard3 && (
        <StandardSection id={3} name="Premises" color={STD_COLORS[2]} std={standards.find(s => s.id === 3)}>
          <EvidenceBullets items={(() => {
            const inR = fridgeLogs.filter(f => { const t = Number(f.currentTemp); return !isNaN(t) && t >= 2 && t <= 8 }).length
            const temps = fridgeLogs.map(f => Number(f.currentTemp)).filter(t => !isNaN(t))
            return [
              `Temperature readings: ${fridgeLogs.length} (${inR} in range, ${fridgeLogs.length - inR} excursions)`,
              temps.length ? `Min ${Math.min(...temps).toFixed(1)}°C, Max ${Math.max(...temps).toFixed(1)}°C, Avg ${(temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1)}°C` : 'No temperature data',
              `Cleaning: ${cleaningEntries.length} entries across ${cleaningTasks.length} tasks`,
            ]
          })()} />
        </StandardSection>
      )}

      {/* Standard 4 — Services */}
      {sections.standard4 && (
        <StandardSection id={4} name="Services" color={STD_COLORS[3]} std={standards.find(s => s.id === 4)}>
          <EvidenceBullets items={(() => {
            const cdPat = /\b(cd|controlled\s+drug)/i
            const cdChecks = actionItems.filter(a => a.completed && (cdPat.test(a.title || '') || cdPat.test(a.description || ''))).length
            return [
              `CD balance checks: ${cdChecks}`,
              `Patient queries resolved: ${patientQueries.filter(q => q.status === 'resolved').length} / ${patientQueries.length}`,
              `MHRA recalls actioned: ${mhraFlags.filter(f => f.actioned).length} / ${mhraFlags.length}`,
            ]
          })()} />
        </StandardSection>
      )}

      {/* Standard 5 — Equipment */}
      {sections.standard5 && (
        <StandardSection id={5} name="Equipment & Facilities" color={STD_COLORS[4]} std={standards.find(s => s.id === 5)}>
          <EvidenceBullets items={(() => {
            const inR = fridgeLogs.filter(f => { const t = Number(f.currentTemp); return !isNaN(t) && t >= 2 && t <= 8 }).length
            const pct = fridgeLogs.length > 0 ? Math.round((inR / fridgeLogs.length) * 100) : 0
            const now = new Date()
            const curDocs = documents.filter(d => d.expiryDate && new Date(d.expiryDate) > now).length
            return [
              `Fridge in-range: ${pct}% (${inR} / ${fridgeLogs.length} readings)`,
              `Documents current: ${curDocs} / ${documents.length}`,
            ]
          })()} />
        </StandardSection>
      )}

      {/* Incident Log */}
      {sections.incidentLog && nearMisses.length > 0 && (
        <div className="bg-ec-card rounded-xl border border-ec-border p-4">
          <div className="text-sm font-bold text-ec-t1 mb-2">Incident Log</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-ec-t3 border-b border-ec-border">
                  <th className="py-1.5 pr-2">Date</th><th className="py-1.5 pr-2">Category</th>
                  <th className="py-1.5 pr-2">Severity</th><th className="py-1.5 pr-2">Status</th>
                  <th className="py-1.5">Resolution</th>
                </tr>
              </thead>
              <tbody>
                {nearMisses.slice(0, 20).map((n, i) => (
                  <tr key={i} className="border-b border-ec-border/50 text-ec-t2">
                    <td className="py-1.5 pr-2">{(n.createdAt || n.date || '').slice(0, 10)}</td>
                    <td className="py-1.5 pr-2">{n.category || '—'}</td>
                    <td className="py-1.5 pr-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        (n.severity || '').toLowerCase() === 'high' ? 'bg-red-50 text-red-600' :
                        (n.severity || '').toLowerCase() === 'medium' ? 'bg-amber-50 text-amber-600' :
                        'bg-emerald-50 text-emerald-600'}`}>
                        {n.severity || '—'}
                      </span>
                    </td>
                    <td className="py-1.5 pr-2">{n.status || '—'}</td>
                    <td className="py-1.5 truncate max-w-[180px]">{n.resolution || n.actionTaken || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {nearMisses.length > 20 && (
            <div className="text-[10px] text-ec-t3 mt-2">Showing 20 of {nearMisses.length} incidents</div>
          )}
        </div>
      )}

      {/* Temperature Records */}
      {sections.temperatureRecords && fridgeLogs.length > 0 && (
        <div className="bg-ec-card rounded-xl border border-ec-border p-4">
          <div className="text-sm font-bold text-ec-t1 mb-2">Temperature Records</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-ec-t3 border-b border-ec-border">
                  <th className="py-1.5 pr-2">Date</th><th className="py-1.5 pr-2">Fridge</th>
                  <th className="py-1.5 pr-2">Min°C</th><th className="py-1.5 pr-2">Max°C</th>
                  <th className="py-1.5 pr-2">Current°C</th><th className="py-1.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {fridgeLogs.slice(0, 30).map((f, i) => {
                  const t = Number(f.currentTemp)
                  const inRange = !isNaN(t) && t >= 2 && t <= 8
                  return (
                    <tr key={i} className="border-b border-ec-border/50 text-ec-t2">
                      <td className="py-1.5 pr-2">{(f.createdAt || f.date || '').slice(0, 10)}</td>
                      <td className="py-1.5 pr-2">{f.fridgeName || f.location || 'Main'}</td>
                      <td className="py-1.5 pr-2">{f.minTemp != null ? Number(f.minTemp).toFixed(1) : '—'}</td>
                      <td className="py-1.5 pr-2">{f.maxTemp != null ? Number(f.maxTemp).toFixed(1) : '—'}</td>
                      <td className="py-1.5 pr-2">{f.currentTemp != null ? Number(f.currentTemp).toFixed(1) : '—'}</td>
                      <td className="py-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          inRange ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                          {inRange ? 'In Range' : 'Excursion'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {fridgeLogs.length > 30 && (
            <div className="text-[10px] text-ec-t3 mt-2">Showing 30 of {fridgeLogs.length} records</div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Sub-components ────────────────────────────────────── */
function StandardSection({ id, name, color, std, children }) {
  return (
    <div className="bg-ec-card rounded-xl border border-ec-border p-4" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="text-sm font-bold text-ec-t1">Standard {id} — {name}</div>
          <div className="text-[10px] text-ec-t3 mt-0.5 italic">{GPHC_DESCRIPTIONS[id]}</div>
        </div>
        {std && (
          <div className="text-lg font-extrabold shrink-0 ml-3" style={{ color: getScoreColor(std.score) }}>
            {std.score}%
          </div>
        )}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  )
}

function EvidenceBullets({ items }) {
  return (
    <ul className="space-y-1 text-xs text-ec-t2 list-none p-0 m-0">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-1.5">
          <span className="text-[#635bff] font-bold mt-px">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════════ */
export default function GPhCReportPage() {
  const { data, loading: dataLoading } = useGPhCReport()
  const { standards, overall, loading: scoresLoading } = useGPhCScores()
  const [pharmacyConfig] = usePharmacyConfig()
  const { user } = useUser()
  const loading = dataLoading || scoresLoading

  // Date range state
  const [rangeIdx, setRangeIdx] = useState(1) // default: Last 30 days
  const [customFrom, setCustomFrom] = useState(daysAgo(30))
  const [customTo, setCustomTo] = useState(today())

  const dateFrom = rangeIdx < 4 ? RANGE_OPTIONS[rangeIdx].from() : customFrom
  const dateTo = rangeIdx < 4 ? RANGE_OPTIONS[rangeIdx].to() : customTo

  // Section toggles
  const [sections, setSections] = useState(DEFAULT_SECTIONS)
  const toggleSection = (key) => setSections(s => ({ ...s, [key]: !s[key] }))

  // Pharmacy details (editable, pre-filled)
  const [pharmacy, setPharmacy] = useState({
    pharmacyName: '', gphcNumber: '', superintendent: '', preparedBy: '',
  })
  // Sync from config on load
  useMemo(() => {
    if (pharmacyConfig.pharmacyName !== 'My Pharmacy' || pharmacyConfig.gphcNumber) {
      setPharmacy(p => ({
        pharmacyName: p.pharmacyName || pharmacyConfig.pharmacyName || '',
        gphcNumber: p.gphcNumber || pharmacyConfig.gphcNumber || '',
        superintendent: p.superintendent || pharmacyConfig.superintendent || '',
        preparedBy: p.preparedBy || user?.name || '',
      }))
    }
  }, [pharmacyConfig, user])

  // Filter evidence by date range
  const filterByDate = (arr, dateField = 'createdAt') =>
    arr.filter(item => {
      const d = (item[dateField] || '').slice(0, 10)
      return d && d >= dateFrom && d <= dateTo
    })

  const filteredEvidence = useMemo(() => ({
    nearMisses: filterByDate(data.nearMisses),
    actionItems: data.actionItems, // not date-filtered — show all for completion rate
    auditLog: filterByDate(data.auditLog),
    mhraAcks: data.mhraAcks,
    trainingLogs: data.trainingLogs,
    trainingTopics: data.trainingTopics,
    staffMembers: data.staffMembers,
    staffTraining: data.staffTraining,
    inductionCompletions: data.inductionCompletions,
    inductionModules: data.inductionModules,
    appraisals: data.appraisals,
    fridgeLogs: filterByDate(data.fridgeLogs),
    cleaningEntries: filterByDate(data.cleaningEntries),
    cleaningTasks: data.cleaningTasks,
    patientQueries: data.patientQueries,
    mhraFlags: data.mhraFlags,
    documents: data.documents,
  }), [data, dateFrom, dateTo])

  // Generate PDF
  const handleGenerate = () => {
    generateGPhCReport({
      config: pharmacy,
      standards,
      overall,
      dateFrom,
      dateTo,
      sections,
      evidence: filteredEvidence,
    })
  }

  return (
    <div className="max-w-[1200px] mx-auto pb-8">
      {/* Page header panel */}
      <div className="rounded-2xl mb-6 p-5 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #faf9ff 0%, #f5f3ff 100%)',
          border: '1.5px solid rgba(99,91,255,0.2)',
        }}>
        {/* Purple gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
          style={{ background: 'linear-gradient(180deg, #635bff 0%, #4f46e5 100%)' }} />
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xl font-bold text-ec-t1">GPhC Inspection Report</div>
            <div className="text-sm text-ec-t3 mt-0.5">Generate a compliance summary report for GPhC inspectors</div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white border-none cursor-pointer
              transition-all duration-200 hover:opacity-90 hover:shadow-lg disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}
          >
            {loading ? 'Loading…' : 'Generate PDF Report'}
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-5 items-start">
        {/* Left: Live preview */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="bg-ec-card rounded-xl border border-ec-border p-8 text-center text-ec-t3">
              Loading compliance data…
            </div>
          ) : (
            <ReportPreview
              standards={standards}
              overall={overall}
              sections={sections}
              dateFrom={dateFrom}
              dateTo={dateTo}
              pharmacy={pharmacy}
              evidence={filteredEvidence}
            />
          )}
        </div>

        {/* Right: Settings */}
        <div className="w-[280px] shrink-0 sticky top-4">
          <ReportSettings
            rangeIdx={rangeIdx} setRangeIdx={setRangeIdx}
            customFrom={customFrom} setCustomFrom={setCustomFrom}
            customTo={customTo} setCustomTo={setCustomTo}
            sections={sections} toggleSection={toggleSection}
            pharmacy={pharmacy} setPharmacy={setPharmacy}
            onGenerate={handleGenerate}
            loading={loading}
          />
        </div>
      </div>
    </div>
  )
}
