import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { CLASS_STYLES, TYPE_STYLES, ACTION_TYPES } from '../../data/recallData'
import { isElevatedRole } from '../../utils/taskEngine'

export default function AlertDetailPanel({ alert, acks, flags, user, onClose, onAcknowledge, onFlag, onResolveFlag }) {
  const backdropRef = useRef()
  const [actionTaken, setActionTaken] = useState('Stock Checked')
  const [ackNotes, setAckNotes] = useState('')
  const [showFlagInput, setShowFlagInput] = useState(false)
  const [flagReason, setFlagReason] = useState('')

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  if (!alert) return null

  const canManage = isElevatedRole(user?.role)
  const activeFlags = flags.filter(f => !f.resolved)

  const handleAck = () => {
    onAcknowledge(alert.id, alert.title, actionTaken, ackNotes)
    setAckNotes('')
  }

  const handleFlag = () => {
    if (!flagReason.trim()) return
    onFlag(alert.id, alert.title, flagReason.trim())
    setShowFlagInput(false)
    setFlagReason('')
  }

  return createPortal(
    <div
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose() }}
      className="fixed inset-0 z-50 flex justify-end recall-backdrop"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-2xl h-full flex flex-col recall-panel"
        style={{
          backgroundColor: 'var(--ec-card-solid, #fff)',
          borderLeft: '1px solid var(--ec-border, #d1fae5)',
          boxShadow: '-8px 0 30px rgba(0,0,0,0.15)',
          animation: 'slideInRight 0.25s ease-out',
        }}
      >
        {/* ── Sticky header ── */}
        <div className="px-6 py-4 border-b shrink-0 recall-header" style={{ borderColor: 'var(--ec-border)' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-ec-t3 hover:text-ec-t1 hover:bg-ec-card-hover transition-colors border-none cursor-pointer bg-transparent recall-close-btn"
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CLASS_STYLES[alert.classification] || CLASS_STYLES['N/A']}`}>
                  {alert.classification}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_STYLES[alert.alertType] || TYPE_STYLES['News']}`}>
                  {alert.alertType}
                </span>
              </div>
              <h2 className="text-base font-bold text-ec-t1 m-0 leading-snug recall-title">{alert.title}</h2>
            </div>
            <button
              onClick={() => window.print()}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-ec-t3 hover:text-ec-t1 hover:bg-ec-card-hover transition-colors border-none cursor-pointer bg-transparent recall-print-btn"
              title="Print / Export to PDF"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 recall-content">

          {/* Section 1 — Alert Details */}
          <section>
            <SectionHeader icon={ICONS.info}>Alert Details</SectionHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <MetaCard label="Published" value={formatDate(alert.published)} />
                <MetaCard label="Updated" value={formatDate(alert.updated)} />
              </div>
              <div className="p-3 rounded-xl border border-ec-border bg-ec-bg">
                <p className="text-sm text-ec-t1 leading-relaxed m-0">{alert.summary || 'No summary available'}</p>
              </div>
              {alert.url && (
                <a
                  href={alert.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-ec-em hover:underline"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  View on GOV.UK
                </a>
              )}
            </div>
          </section>

          <hr className="border-ec-border m-0" />

          {/* Section 2 — Pharmacy Response */}
          <section>
            <SectionHeader icon={ICONS.check}>Pharmacy Response</SectionHeader>

            {/* Existing acknowledgements */}
            {acks.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-ec-border mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-ec-card-hover">
                      <th className="text-left text-[10px] font-bold text-ec-t3 uppercase tracking-wider px-3 py-2">Staff</th>
                      <th className="text-left text-[10px] font-bold text-ec-t3 uppercase tracking-wider px-3 py-2">Action</th>
                      <th className="text-left text-[10px] font-bold text-ec-t3 uppercase tracking-wider px-3 py-2">Date</th>
                      <th className="text-left text-[10px] font-bold text-ec-t3 uppercase tracking-wider px-3 py-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {acks.map((a) => (
                      <tr key={a.id} className="border-t border-ec-border">
                        <td className="px-3 py-2 text-ec-t1 font-medium text-xs">{a.acknowledgedBy}</td>
                        <td className="px-3 py-2 text-ec-t2 text-xs">{a.actionTaken || '—'}</td>
                        <td className="px-3 py-2 text-ec-t3 text-xs whitespace-nowrap">{formatDate(a.acknowledgedAt)}</td>
                        <td className="px-3 py-2 text-ec-t2 text-xs">{a.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-ec-t3 mb-4">No acknowledgements yet.</p>
            )}

            {/* Add acknowledgement form */}
            <div className="p-3 rounded-xl border border-ec-border bg-ec-em/[0.03] space-y-2">
              <div className="text-[10px] font-bold text-ec-t3 uppercase tracking-wider">Add Acknowledgement</div>
              <select
                value={actionTaken}
                onChange={e => setActionTaken(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-ec-border bg-ec-card text-xs text-ec-t1 outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                {ACTION_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <textarea
                value={ackNotes}
                onChange={e => setAckNotes(e.target.value)}
                placeholder="Optional notes..."
                rows={2}
                className="w-full px-2.5 py-1.5 rounded-lg border border-ec-border bg-ec-card text-xs text-ec-t1 placeholder:text-ec-t3 outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
              />
              <button onClick={handleAck}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white border-none cursor-pointer hover:bg-emerald-700 transition shadow-sm">
                Submit Acknowledgement
              </button>
            </div>
          </section>

          <hr className="border-ec-border m-0" />

          {/* Section 3 — Flags */}
          <section>
            <SectionHeader icon={ICONS.flag}>Flags</SectionHeader>

            {activeFlags.length > 0 ? (
              <div className="space-y-2 mb-4">
                {activeFlags.map(f => (
                  <div key={f.id} className="flex items-start gap-3 p-3 rounded-xl border border-amber-400/30 bg-ec-warn/[0.05]">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-ec-warn shrink-0 mt-0.5">
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ec-t1">{f.flaggedBy}</div>
                      <div className="text-xs text-ec-t2 mt-0.5">{f.reason || 'No reason given'}</div>
                      <div className="text-[10px] text-ec-t3 mt-1">{formatDate(f.flaggedAt)}</div>
                    </div>
                    {canManage && (
                      <button
                        onClick={() => onResolveFlag(f.id)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-emerald-600 text-white border-none cursor-pointer hover:bg-emerald-700 transition shrink-0"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-ec-t3 mb-4">No active flags.</p>
            )}

            {/* Resolved flags */}
            {flags.filter(f => f.resolved).length > 0 && (
              <div className="mb-4">
                <div className="text-[10px] font-bold text-ec-t3 uppercase tracking-wider mb-2">Resolved</div>
                {flags.filter(f => f.resolved).map(f => (
                  <div key={f.id} className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-ec-em/[0.04] mb-1">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-emerald-500 shrink-0">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-xs text-ec-t2">{f.flaggedBy} — {f.reason || 'No reason'}</span>
                    <span className="text-[10px] text-ec-t3 ml-auto">Resolved by {f.resolvedBy}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Flag button */}
            {showFlagInput ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={flagReason}
                  onChange={e => setFlagReason(e.target.value)}
                  placeholder="Reason for flagging..."
                  className="flex-1 px-3 py-2 rounded-lg border border-amber-400/50 bg-ec-card text-sm text-ec-t1 placeholder:text-ec-t3 outline-none focus:ring-2 focus:ring-amber-400/30"
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleFlag() }}
                />
                <button onClick={handleFlag}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-ec-warn text-white border-none cursor-pointer hover:bg-amber-600 transition">
                  Submit
                </button>
                <button onClick={() => { setShowFlagInput(false); setFlagReason('') }}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-transparent text-ec-t3 border border-ec-border cursor-pointer hover:bg-ec-card-hover transition">
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowFlagInput(true)}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-transparent text-ec-warn dark:text-amber-400 border border-amber-400/30 cursor-pointer hover:bg-ec-warn/10 transition"
              >
                Flag for Attention
              </button>
            )}
          </section>
        </div>

        {/* ── Sticky footer ── */}
        <div className="flex items-center gap-3 px-6 py-4 border-t shrink-0 recall-footer" style={{ borderColor: 'var(--ec-border)' }}>
          <button onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl text-sm font-medium bg-transparent text-ec-t2 border border-ec-border cursor-pointer hover:bg-ec-card-hover transition recall-print-footer">
            Print
          </button>
          <div className="flex-1" />
          <button onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium bg-transparent text-ec-t2 border border-ec-border cursor-pointer hover:bg-ec-card-hover transition">
            Close
          </button>
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
          .recall-panel, .recall-panel * { visibility: visible; }
          .recall-panel {
            position: fixed;
            left: 0; top: 0;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            box-shadow: none !important;
            border: none !important;
            animation: none !important;
          }
          .recall-backdrop {
            background: transparent !important;
            backdrop-filter: none !important;
            position: static !important;
          }
          .recall-footer, .recall-close-btn, .recall-print-btn, .recall-print-footer { display: none !important; }
          .recall-content { overflow: visible !important; }
        }
      `}</style>
    </div>,
    document.body
  )
}

// ─── Helpers ───
function SectionHeader({ icon, children }) {
  return (
    <h3 className="text-[11px] font-bold text-ec-t3 uppercase tracking-widest mb-2 flex items-center gap-2">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
        {icon}
      </svg>
      {children}
    </h3>
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

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const ICONS = {
  info: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>,
  check: <><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>,
  flag: <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></>,
}
