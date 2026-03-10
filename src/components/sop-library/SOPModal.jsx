import { useState } from 'react'
import ExpiryBadge from './ExpiryBadge'

export default function SOPModal({ sop, acksBySopId, staffNames, myAcked, onAcknowledge, onClose }) {
  const [saving, setSaving] = useState(false)
  const acks = acksBySopId[sop.id] || []
  const ackMap = Object.fromEntries(acks.map(a => [a.acknowledgedBy, a.acknowledgedAt]))

  const handleAck = async () => {
    setSaving(true)
    try {
      await onAcknowledge(sop.id)
    } catch {
      // error handled in hook
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-ec-card border border-ec-border shadow-2xl ec-fadeup"
        onClick={e => e.stopPropagation()}
      >
        {/* Emerald gradient stripe */}
        <div className="h-1 rounded-t-2xl" style={{ background: 'linear-gradient(90deg, var(--ec-em), var(--ec-em-dark, #047857))' }} />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
          <div>
            <span
              className="text-xs font-mono font-bold px-2 py-0.5 rounded"
              style={{ backgroundColor: 'rgba(5,150,105,0.08)', color: 'var(--ec-em)' }}
            >
              {sop.code}
            </span>
            <h2 className="text-lg font-bold text-ec-t1 mt-2 leading-snug">{sop.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1 bg-transparent border-none text-ec-t3 cursor-pointer hover:text-ec-t1 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 px-6 pb-4 text-xs">
          <div><span className="text-ec-t3">Category:</span> <span className="text-ec-t1 font-medium">{sop.category}</span></div>
          <div><span className="text-ec-t3">Version:</span> <span className="text-ec-t1 font-medium">v{sop.version}</span></div>
          <div><span className="text-ec-t3">Effective Date:</span> <span className="text-ec-t1 font-medium">{sop.effectiveDate}</span></div>
          <div className="flex items-center gap-2">
            <span className="text-ec-t3">Review Date:</span>
            <span className="text-ec-t1 font-medium">{sop.reviewDate}</span>
            <ExpiryBadge reviewDate={sop.reviewDate} />
          </div>
          <div><span className="text-ec-t3">Owner:</span> <span className="text-ec-t1 font-medium">{sop.owner}</span></div>
          <div><span className="text-ec-t3">Status:</span> <span className="text-ec-t1 font-medium">{sop.status}</span></div>
        </div>

        {/* Summary */}
        <div className="px-6 pb-4">
          <h3 className="text-xs font-bold text-ec-t3 uppercase tracking-wider mb-1.5">Summary</h3>
          <p className="text-sm text-ec-t2 leading-relaxed">{sop.summary}</p>
        </div>

        {/* Staff acknowledgement table */}
        <div className="px-6 pb-4">
          <h3 className="text-xs font-bold text-ec-t3 uppercase tracking-wider mb-2">Staff Acknowledgements</h3>
          <div className="overflow-x-auto rounded-xl border border-ec-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-ec-border bg-ec-card-hover">
                  <th className="text-left py-2 px-3 font-semibold text-ec-t2">Staff Member</th>
                  <th className="text-left py-2 px-3 font-semibold text-ec-t2">Status</th>
                  <th className="text-left py-2 px-3 font-semibold text-ec-t2">Date</th>
                </tr>
              </thead>
              <tbody>
                {staffNames.map(name => {
                  const ackDate = ackMap[name]
                  return (
                    <tr key={name} className="border-b border-ec-border last:border-0">
                      <td className="py-2 px-3 text-ec-t1">{name}</td>
                      <td className="py-2 px-3">
                        {ackDate ? (
                          <span className="text-emerald-600 font-medium">✓ Acknowledged</span>
                        ) : (
                          <span className="text-ec-t3">Not yet</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-ec-t3">
                        {ackDate ? new Date(ackDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Acknowledge button */}
        {!myAcked && (
          <div className="px-6 pb-6">
            <button
              onClick={handleAck}
              disabled={saving}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
              style={{ backgroundColor: 'var(--ec-em)' }}
            >
              {saving ? 'Saving...' : 'I have read and understood this SOP'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
