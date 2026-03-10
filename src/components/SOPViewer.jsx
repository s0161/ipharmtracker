import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const CATEGORY_STYLES = {
  Dispensing: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  CD: 'bg-red-500/10 text-red-600 dark:text-red-400',
  Clinical: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
  Governance: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  'H&S': 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  'HR & Training': 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  Facilities: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  Delivery: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  'IT & Systems': 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  'NHS Services': 'bg-green-500/10 text-green-600 dark:text-green-400',
  'Controlled Stationery': 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  'Internet Pharmacy': 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
}

const STATUS_STYLES = {
  Current: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  'Due Review': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  Overdue: 'bg-red-500/10 text-red-600 dark:text-red-400',
}

const ROLE_DISPLAY = {
  all: 'All Staff', superintendent: 'Superintendent', manager: 'Manager',
  pharmacist: 'Pharmacist', technician: 'Technician', dispenser: 'Dispenser',
  aca: 'ACA', stock_assistant: 'Stock', driver: 'Driver',
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function SOPViewer({ sop, onClose, onAcknowledge }) {
  const backdropRef = useRef()

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

  const ackPercent = Math.round((sop.acked / 13) * 100)

  return createPortal(
    <div
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose() }}
      className="fixed inset-0 z-50 flex justify-end"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
    >
      {/* Slide-over panel */}
      <div
        className="w-full max-w-2xl h-full flex flex-col"
        style={{
          backgroundColor: 'var(--ec-card-solid, #fff)',
          borderLeft: '1px solid var(--ec-border, #d1fae5)',
          boxShadow: '-8px 0 30px rgba(0,0,0,0.15)',
          animation: 'slideInRight 0.25s ease-out',
        }}
      >
        {/* ── Sticky header ── */}
        <div
          className="flex items-center gap-3 px-6 py-4 border-b shrink-0"
          style={{ borderColor: 'var(--ec-border)' }}
        >
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ec-t3 hover:text-ec-t1 hover:bg-ec-card-hover transition-colors border-none cursor-pointer bg-transparent"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-mono font-bold text-ec-t3">{sop.code}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_STYLES[sop.category]}`}>
                {sop.category}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[sop.status]}`}>
                {sop.status}
              </span>
            </div>
            <h2 className="text-base font-bold text-ec-t1 m-0 truncate">{sop.title}</h2>
          </div>
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Applies-to row */}
          <section>
            <h3 className="text-[11px] font-bold text-ec-t3 uppercase tracking-widest mb-2 flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Applies To
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {sop.roles.includes('all') ? (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  All Staff
                </span>
              ) : (
                sop.roles.map(r => (
                  <span key={r} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-400">
                    {ROLE_DISPLAY[r] || r}
                  </span>
                ))
              )}
            </div>
          </section>

          {/* Divider */}
          <hr className="border-ec-border m-0" />

          {/* Purpose */}
          <section>
            <h3 className="text-[11px] font-bold text-ec-t3 uppercase tracking-widest mb-2 flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              Purpose
            </h3>
            <p className="text-sm text-ec-t1 leading-relaxed m-0">{sop.description}</p>
          </section>

          {/* Key Procedural Steps */}
          <section>
            <h3 className="text-[11px] font-bold text-ec-t3 uppercase tracking-widest mb-3 flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              Key Procedural Steps
            </h3>
            <div className="space-y-2.5">
              {sop.keyPoints.map((point, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-xl border border-ec-border bg-emerald-500/[0.03]"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[11px] font-bold text-emerald-600">{i + 1}</span>
                  </div>
                  <span className="text-sm text-ec-t1 leading-relaxed">{point}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Divider */}
          <hr className="border-ec-border m-0" />

          {/* Metadata grid */}
          <section>
            <h3 className="text-[11px] font-bold text-ec-t3 uppercase tracking-widest mb-3 flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
              </svg>
              Document Info
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetaCard label="Version" value={`v${sop.version}`} />
              <MetaCard label="Status" value={sop.status} />
              <MetaCard label="Next Review" value={formatDate(sop.reviewDate)} />
              <MetaCard label="Acknowledged" value={`${sop.acked} / 13`} />
            </div>

            {/* Ack progress bar */}
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-ec-border overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${ackPercent}%`,
                    backgroundColor: ackPercent === 100 ? '#059669' : ackPercent >= 70 ? '#10b981' : '#f59e0b',
                  }}
                />
              </div>
              <span className="text-xs font-bold text-ec-t2 tabular-nums">{ackPercent}%</span>
            </div>
          </section>

          {/* References placeholder */}
          <section className="opacity-50">
            <h3 className="text-[11px] font-bold text-ec-t3 uppercase tracking-widest mb-2 flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              References &amp; Related Documents
            </h3>
            <p className="text-xs text-ec-t3 italic m-0">Cross-references will be available in a future update.</p>
          </section>
        </div>

        {/* ── Sticky footer ── */}
        <div
          className="flex items-center gap-3 px-6 py-4 border-t shrink-0"
          style={{ borderColor: 'var(--ec-border)' }}
        >
          <button
            onClick={onAcknowledge}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white border-none cursor-pointer hover:bg-emerald-700 transition shadow-sm"
          >
            Acknowledge SOP
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium bg-transparent text-ec-t2 border border-ec-border cursor-pointer hover:bg-ec-card-hover transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Keyframe for slide-in */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0.8; }
          to   { transform: translateX(0);    opacity: 1; }
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
