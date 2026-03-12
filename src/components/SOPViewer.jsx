import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { STAFF_ROLES } from '../utils/taskEngine'

const CATEGORY_STYLES = {
  Dispensing: 'bg-ec-info/10 text-ec-info dark:text-blue-400',
  CD: 'bg-ec-crit/10 text-ec-crit',
  Clinical: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
  Governance: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  'H&S': 'bg-ec-warn/10 text-ec-warn',
  'HR & Training': 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  Facilities: 'bg-ec-bg text-ec-t2',
  Delivery: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  'IT & Systems': 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  'NHS Services': 'bg-green-500/10 text-ec-em dark:text-green-400',
  'Controlled Stationery': 'bg-ec-warn/10 text-yellow-700 dark:text-yellow-400',
  'Internet Pharmacy': 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
}

const STATUS_STYLES = {
  Current: 'bg-ec-em/10 text-ec-em dark:text-emerald-400',
  'Due Review': 'bg-ec-warn/10 text-ec-warn dark:text-amber-400',
  Overdue: 'bg-ec-crit/10 text-ec-crit',
}

const RISK_STYLES = {
  Critical: 'bg-ec-crit/10 text-ec-crit border-ec-crit/20',
  High: 'bg-ec-warn/10 text-ec-warn dark:text-amber-400 border-ec-warn/20',
  Medium: 'bg-ec-warn/10 text-yellow-700 dark:text-yellow-400 border-ec-warn/20',
  Low: 'bg-ec-bg text-ec-t3 border-slate-500/20',
}

const FREQ_STYLES = {
  Daily: 'bg-ec-em/10 text-ec-em dark:text-emerald-400',
  Weekly: 'bg-ec-info/10 text-ec-info dark:text-blue-400',
  Monthly: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  'As Required': 'bg-ec-bg text-ec-t3',
}

const ROLE_DISPLAY = {
  all: 'All Staff', superintendent: 'Superintendent', manager: 'Manager',
  pharmacist: 'Pharmacist', technician: 'Technician', dispenser: 'Dispenser',
  aca: 'ACA', stock_assistant: 'Stock', driver: 'Driver',
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getRelevantStaff(sopRoles) {
  if (!sopRoles || sopRoles.length === 0 || sopRoles.includes('all')) {
    return Object.entries(STAFF_ROLES).map(([name, role]) => ({ name, role }))
  }
  return Object.entries(STAFF_ROLES)
    .filter(([, role]) => sopRoles.includes(role))
    .map(([name, role]) => ({ name, role }))
}

// ─── SECTION HEADER COMPONENT ───
function SectionHeader({ icon, children }) {
  return (
    <h3 className="text-[11px] font-bold text-ec-t3 uppercase tracking-widest mb-2 flex items-center gap-2 sop-section-header">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
        {icon}
      </svg>
      {children}
    </h3>
  )
}

// ─── ICONS ───
const ICONS = {
  people: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  info: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>,
  scope: <><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></>,
  check: <><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>,
  grid: <><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></>,
  link: <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>,
  book: <><path d="M2 3h8a2 2 0 0 1 2 2v14a1.5 1.5 0 0 0-1.5-1.5H2V3z" /><path d="M22 3h-8a2 2 0 0 0-2 2v14a1.5 1.5 0 0 1 1.5-1.5H22V3z" /></>,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>,
  clipboard: <><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></>,
  alert: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  arrowUp: <><circle cx="12" cy="12" r="10" /><polyline points="16 12 12 8 8 12" /><line x1="12" y1="16" x2="12" y2="8" /></>,
  graduation: <><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" /></>,
  eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>,
  clock: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
  refresh: <><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></>,
  paperclip: <><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></>,
  userCheck: <><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" /></>,
}

export default function SOPViewer({ sop, acks = [], onClose, onAcknowledge, onFlag }) {
  const backdropRef = useRef()
  const [showFlagInput, setShowFlagInput] = useState(false)
  const [flagText, setFlagText] = useState('')

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  if (!sop) return null

  const relevantStaff = getRelevantStaff(sop.roles)
  const ackedNames = new Set(acks.map(a => a.name))
  const acknowledged = relevantStaff.filter(s => ackedNames.has(s.name))
  const pending = relevantStaff.filter(s => !ackedNames.has(s.name))
  const ackPct = relevantStaff.length > 0 ? Math.round((acknowledged.length / relevantStaff.length) * 100) : 0

  const handleSubmitFlag = () => {
    if (flagText.trim() && onFlag) {
      onFlag(flagText.trim())
      setShowFlagInput(false)
      setFlagText('')
    }
  }

  return createPortal(
    <div
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose() }}
      className="fixed inset-0 z-50 flex justify-end sop-backdrop"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
    >
      {/* Slide-over panel */}
      <div
        className="w-full max-w-2xl h-full flex flex-col sop-panel"
        style={{
          backgroundColor: 'var(--ec-card-solid, #fff)',
          borderLeft: '1px solid var(--ec-border, #d1fae5)',
          boxShadow: '-8px 0 30px rgba(0,0,0,0.15)',
          animation: 'slideInRight 0.25s ease-out',
        }}
      >
        {/* ── Sticky header ── */}
        <div
          className="px-6 py-4 border-b shrink-0 sop-header"
          style={{ borderColor: 'var(--ec-border)' }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-ec-t3 hover:text-ec-t1 hover:bg-ec-card-hover transition-colors border-none cursor-pointer bg-transparent sop-close-btn"
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="text-xs font-mono font-bold text-ec-t3">{sop.code}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_STYLES[sop.category]}`}>
                  {sop.category}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[sop.status]}`}>
                  {sop.status}
                </span>
                {/* 5a. Risk Rating badge */}
                {sop.riskLevel && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${RISK_STYLES[sop.riskLevel] || ''}`}>
                    {sop.riskLevel} Risk
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-ec-t1 m-0 truncate sop-title">{sop.title}</h2>
            </div>
            {/* 5e. Print button */}
            <button
              onClick={() => window.print()}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-ec-t3 hover:text-ec-t1 hover:bg-ec-card-hover transition-colors border-none cursor-pointer bg-transparent sop-print-btn"
              aria-label="Export to PDF"
              title="Print / Export to PDF"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
            </button>
          </div>

          {/* 5b. Ack progress bar in header */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-ec-border overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${ackPct}%`,
                  backgroundColor: ackPct === 100 ? 'var(--ec-em-dark)' : ackPct >= 70 ? 'var(--ec-em)' : 'var(--ec-warn)',
                }}
              />
            </div>
            <span className="text-[10px] font-bold text-ec-t2 tabular-nums whitespace-nowrap">
              {acknowledged.length}/{relevantStaff.length} acknowledged
            </span>
          </div>
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 sop-content">

          {/* Flagged banner */}
          {sop.flaggedForReview && (
            <div className="flex items-start gap-3 p-3 rounded-xl border border-amber-400/30 bg-ec-warn/10 dark:bg-ec-warn/5">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-ec-warn shrink-0 mt-0.5">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-ec-warn m-0">Flagged for Review</p>
                {sop.flagReason && <p className="text-sm text-ec-warn dark:text-amber-300 m-0 mt-1">{sop.flagReason}</p>}
              </div>
            </div>
          )}

          {/* 1. Applies-to row */}
          <section>
            <SectionHeader icon={ICONS.people}>Applies To</SectionHeader>
            <div className="flex flex-wrap gap-1.5">
              {(sop.roles || []).includes('all') ? (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-ec-em/10 text-ec-em dark:text-emerald-400">
                  All Staff
                </span>
              ) : (
                (sop.roles || []).map(r => (
                  <span key={r} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-ec-bg text-ec-t2">
                    {ROLE_DISPLAY[r] || r}
                  </span>
                ))
              )}
            </div>
          </section>

          {/* 2. Responsibilities */}
          {sop.responsibilities && Object.keys(sop.responsibilities).length > 0 && (
            <section>
              <SectionHeader icon={ICONS.clipboard}>Responsibilities</SectionHeader>
              <div className="space-y-2">
                {Object.entries(sop.responsibilities).map(([role, duty]) => (
                  <div key={role} className="flex items-start gap-3 p-3 rounded-xl border border-ec-border bg-ec-bg">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ec-em bg-ec-em/10 px-2 py-0.5 rounded-md shrink-0 mt-0.5">
                      {ROLE_DISPLAY[role] || role}
                    </span>
                    <span className="text-sm text-ec-t1 leading-relaxed">{duty}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <hr className="border-ec-border m-0" />

          {/* 3. Purpose */}
          <section>
            <SectionHeader icon={ICONS.info}>Purpose</SectionHeader>
            <p className="text-sm text-ec-t1 leading-relaxed m-0">{sop.description}</p>
          </section>

          {/* 4. Scope */}
          {sop.scope && (
            <section>
              <SectionHeader icon={ICONS.scope}>Scope</SectionHeader>
              <p className="text-sm text-ec-t1 leading-relaxed m-0">{sop.scope}</p>
            </section>
          )}

          {/* 5. Key Procedural Steps — with 5d frequency tags */}
          <section>
            <SectionHeader icon={ICONS.check}>Key Procedural Steps</SectionHeader>
            <div className="space-y-2">
              {(sop.keyPoints || []).map((point, i) => {
                const isObj = typeof point === 'object' && point !== null && point.step
                const stepText = isObj ? point.step : point
                const freq = isObj ? point.frequency : null

                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-xl border border-ec-border bg-ec-em/[0.03]"
                  >
                    <div className="w-6 h-6 rounded-full bg-ec-em/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[11px] font-bold text-ec-em">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-ec-t1 leading-relaxed">{stepText}</span>
                      {freq && (
                        <span className={`ml-2 inline-flex text-[9px] font-bold px-1.5 py-0.5 rounded-full ${FREQ_STYLES[freq] || FREQ_STYLES['As Required']}`}>
                          {freq}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* 6. Risk Assessment */}
          {sop.riskAssessment && sop.riskAssessment.length > 0 && (
            <section>
              <SectionHeader icon={ICONS.alert}>Risk Assessment</SectionHeader>
              <div className="space-y-2">
                {sop.riskAssessment.map((item, i) => (
                  <div key={i} className="p-3 rounded-xl border border-ec-border bg-ec-crit-faint">
                    <div className="flex items-start gap-2 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ec-crit bg-ec-crit/10 px-2 py-0.5 rounded-md shrink-0">Risk</span>
                      <span className="text-sm font-medium text-ec-t1">{item.risk}</span>
                    </div>
                    <div className="flex items-start gap-2 ml-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ec-em dark:text-emerald-400 bg-ec-em/10 px-2 py-0.5 rounded-md shrink-0">Mitigation</span>
                      <span className="text-sm text-ec-t2 leading-relaxed">{item.mitigation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 7. Escalation Pathway */}
          {sop.escalation && (
            <section>
              <SectionHeader icon={ICONS.arrowUp}>Escalation Pathway</SectionHeader>
              <div className="p-3 rounded-xl border border-ec-border bg-ec-warn/[0.03]">
                <p className="text-sm text-ec-t1 leading-relaxed m-0">{sop.escalation}</p>
              </div>
            </section>
          )}

          <hr className="border-ec-border m-0" />

          {/* 8. Training Requirements */}
          {sop.trainingRequirements && sop.trainingRequirements.length > 0 && (
            <section>
              <SectionHeader icon={ICONS.graduation}>Training Requirements</SectionHeader>
              <div className="space-y-1.5">
                {sop.trainingRequirements.map((req, i) => (
                  <div key={i} className="flex items-start gap-2.5 py-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-ec-em/40 shrink-0 mt-1.5" />
                    <span className="text-sm text-ec-t1 leading-relaxed">{req}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 9. Monitoring & Audit */}
          {sop.monitoring && (
            <section>
              <SectionHeader icon={ICONS.eye}>Monitoring &amp; Audit</SectionHeader>
              <div className="p-3 rounded-xl border border-ec-border bg-ec-info-light">
                <p className="text-sm text-ec-t1 leading-relaxed m-0">{sop.monitoring}</p>
              </div>
            </section>
          )}

          <hr className="border-ec-border m-0" />

          {/* 10. Document Control */}
          <section>
            <SectionHeader icon={ICONS.grid}>Document Control</SectionHeader>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <MetaCard label="Version" value={`v${sop.version}`} />
              <MetaCard label="Status" value={sop.status} />
              <MetaCard label="Next Review" value={formatDate(sop.reviewDate)} />
              {sop.effectiveDate && <MetaCard label="Effective Date" value={formatDate(sop.effectiveDate)} />}
              {sop.author && <MetaCard label="Author" value={sop.author} />}
              {sop.approvedBy && <MetaCard label="Approved By" value={sop.approvedBy} />}
            </div>
          </section>

          {/* 5c. Staff Acknowledgements — named lists */}
          <section>
            <SectionHeader icon={ICONS.userCheck}>Staff Acknowledgements</SectionHeader>

            {acknowledged.length > 0 && (
              <div className="mb-3">
                <div className="text-[10px] font-bold text-ec-em dark:text-emerald-400 uppercase tracking-wider mb-1.5">
                  Acknowledged ({acknowledged.length})
                </div>
                <div className="space-y-1">
                  {acknowledged.map(s => {
                    const ack = acks.find(a => a.name === s.name)
                    return (
                      <div key={s.name} className="flex items-center gap-2.5 py-1.5 px-3 rounded-lg bg-ec-em/[0.04]">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-emerald-500 shrink-0">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span className="text-sm text-ec-t1 font-medium">{s.name}</span>
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-ec-bg text-ec-t3">
                          {ROLE_DISPLAY[s.role] || s.role}
                        </span>
                        {ack?.date && (
                          <span className="text-[10px] text-ec-t3 ml-auto">{formatDate(ack.date)}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {pending.length > 0 && (
              <div>
                <div className="text-[10px] font-bold text-ec-warn dark:text-amber-400 uppercase tracking-wider mb-1.5">
                  Pending ({pending.length})
                </div>
                <div className="space-y-1">
                  {pending.map(s => (
                    <div key={s.name} className="flex items-center gap-2.5 py-1.5 px-3 rounded-lg bg-ec-warn/[0.04]">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-ec-warn shrink-0">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span className="text-sm text-ec-t1 font-medium">{s.name}</span>
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-ec-bg text-ec-t3">
                        {ROLE_DISPLAY[s.role] || s.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* 11. Revision History */}
          {sop.revisionHistory && sop.revisionHistory.length > 0 && (
            <section>
              <SectionHeader icon={ICONS.clock}>Revision History</SectionHeader>
              <div className="overflow-hidden rounded-xl border border-ec-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-ec-card-hover">
                      <th className="text-left text-[10px] font-bold text-ec-t3 uppercase tracking-wider px-3 py-2">Version</th>
                      <th className="text-left text-[10px] font-bold text-ec-t3 uppercase tracking-wider px-3 py-2">Date</th>
                      <th className="text-left text-[10px] font-bold text-ec-t3 uppercase tracking-wider px-3 py-2">Changes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sop.revisionHistory.map((rev, i) => (
                      <tr key={i} className="border-t border-ec-border">
                        <td className="px-3 py-2 font-mono font-semibold text-ec-em text-xs">v{rev.version}</td>
                        <td className="px-3 py-2 text-ec-t2 text-xs whitespace-nowrap">{formatDate(rev.date)}</td>
                        <td className="px-3 py-2 text-ec-t1">{rev.changes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* 12. Review Triggers */}
          {sop.reviewTriggers && sop.reviewTriggers.length > 0 && (
            <section>
              <SectionHeader icon={ICONS.refresh}>Review Triggers</SectionHeader>
              <div className="space-y-1.5">
                {sop.reviewTriggers.map((trigger, i) => (
                  <div key={i} className="flex items-start gap-2.5 py-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-ec-warn/60 shrink-0 mt-1.5" />
                    <span className="text-sm text-ec-t1 leading-relaxed">{trigger}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <hr className="border-ec-border m-0" />

          {/* 13. References & Legislation */}
          {sop.references && sop.references.length > 0 && (
            <section>
              <SectionHeader icon={ICONS.book}>References &amp; Legislation</SectionHeader>
              <div className="space-y-1.5">
                {sop.references.map((ref, i) => (
                  <div key={i} className="flex items-start gap-2.5 py-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-ec-t3/40 shrink-0 mt-1.5" />
                    <span className="text-sm text-ec-t1 leading-relaxed">{ref}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 14. Related SOPs */}
          {sop.relatedSOPs && sop.relatedSOPs.length > 0 && (
            <section>
              <SectionHeader icon={ICONS.link}>Related SOPs</SectionHeader>
              <div className="flex flex-wrap gap-2">
                {sop.relatedSOPs.map(code => (
                  <span
                    key={code}
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold px-3 py-1.5 rounded-lg bg-ec-card-hover text-ec-em border border-ec-border hover:border-ec-em/30 transition-colors cursor-default"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 opacity-50">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                    </svg>
                    {code}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* 15. Appendices */}
          {sop.appendices && sop.appendices.length > 0 && (
            <section>
              <SectionHeader icon={ICONS.paperclip}>Appendices</SectionHeader>
              <div className="flex flex-wrap gap-2">
                {sop.appendices.map((doc, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-ec-card-hover text-ec-t1 border border-ec-border"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-ec-t3">
                      {ICONS.file}
                    </svg>
                    {doc}
                  </span>
                ))}
              </div>
            </section>
          )}

        </div>

        {/* ── Sticky footer ── */}
        <div
          className="flex items-center gap-3 px-6 py-4 border-t shrink-0 sop-footer"
          style={{ borderColor: 'var(--ec-border)' }}
        >
          <button
            onClick={onAcknowledge}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white border-none cursor-pointer hover:bg-emerald-700 transition shadow-sm"
          >
            Acknowledge SOP
          </button>

          {/* 5f. Flag for Review */}
          {showFlagInput ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={flagText}
                onChange={e => setFlagText(e.target.value)}
                placeholder="Reason for flagging..."
                className="flex-1 px-3 py-2 rounded-lg border border-amber-400/50 bg-ec-card text-sm text-ec-t1 placeholder:text-ec-t3 outline-none focus:ring-2 focus:ring-amber-400/30"
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleSubmitFlag() }}
              />
              <button onClick={handleSubmitFlag}
                className="px-3 py-2 rounded-lg text-sm font-medium bg-ec-warn text-white border-none cursor-pointer hover:bg-amber-600 transition">
                Submit
              </button>
              <button onClick={() => { setShowFlagInput(false); setFlagText('') }}
                className="px-3 py-2 rounded-lg text-sm font-medium bg-transparent text-ec-t3 border border-ec-border cursor-pointer hover:bg-ec-card-hover transition">
                Cancel
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setShowFlagInput(true)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-transparent text-ec-warn dark:text-amber-400 border border-amber-400/30 cursor-pointer hover:bg-ec-warn/10 transition"
              >
                Flag for Review
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-transparent text-ec-t2 border border-ec-border cursor-pointer hover:bg-ec-card-hover transition"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>

      {/* Keyframe + Print styles */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0.8; }
          to   { transform: translateX(0);    opacity: 1; }
        }

        @media print {
          body * { visibility: hidden; }
          .sop-panel, .sop-panel * { visibility: visible; }
          .sop-panel {
            position: fixed;
            left: 0; top: 0;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            box-shadow: none !important;
            border: none !important;
            animation: none !important;
          }
          .sop-backdrop {
            background: transparent !important;
            backdrop-filter: none !important;
            position: static !important;
          }
          .sop-footer, .sop-close-btn, .sop-print-btn { display: none !important; }
          .sop-content { overflow: visible !important; }
          .sop-header::before {
            content: 'iPharmacy Direct — ' attr(data-code) ' — Exported ' attr(data-date);
            display: block;
            font-size: 10px;
            color: #666;
            margin-bottom: 4px;
          }
        }
      `}</style>
    </div>,
    document.body
  )
}

function MetaCard({ label, value }) {
  return (
    <div className="bg-ec-card-hover rounded-xl p-3 text-center">
      <div className="text-[10px] font-bold text-ec-t3 uppercase tracking-wider">{label}</div>
      <div className="text-sm font-bold text-ec-t1 mt-1">{value}</div>
    </div>
  )
}
