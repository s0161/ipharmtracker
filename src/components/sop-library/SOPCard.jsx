import ExpiryBadge from './ExpiryBadge'
import AckBadge from './AckBadge'

export default function SOPCard({ sop, acknowledged, onView, onAcknowledge }) {
  return (
    <div className="bg-ec-card border border-ec-border rounded-xl p-4 hover:border-emerald-500/40 transition-all flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span
          className="text-[11px] font-mono font-bold px-2 py-0.5 rounded"
          style={{ backgroundColor: 'rgba(5,150,105,0.08)', color: 'var(--ec-em)' }}
        >
          {sop.code}
        </span>
        <span className="text-[10px] font-medium text-ec-t3 bg-ec-card-hover px-2 py-0.5 rounded-full whitespace-nowrap">
          {sop.category}
        </span>
      </div>

      {/* Title + version */}
      <h3 className="text-sm font-medium text-ec-t1 mb-1 leading-snug">{sop.title}</h3>
      <p className="text-[11px] text-ec-t3 mb-2">v{sop.version}</p>

      {/* Summary */}
      <p className="text-xs text-ec-t2 mb-3 line-clamp-2 flex-1">{sop.summary}</p>

      {/* Meta */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-ec-t3 mb-3">
        <span>Owner: <span className="text-ec-t2">{sop.owner}</span></span>
        <span>Effective: <span className="text-ec-t2">{sop.effectiveDate}</span></span>
        <span>Review: <span className="text-ec-t2">{sop.reviewDate}</span></span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-ec-border">
        <div className="flex items-center gap-2">
          <ExpiryBadge reviewDate={sop.reviewDate} />
          <AckBadge acknowledged={acknowledged} />
        </div>
        <div className="flex items-center gap-1.5">
          {!acknowledged && (
            <button
              onClick={(e) => { e.stopPropagation(); onAcknowledge(sop.id) }}
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg text-white transition-colors"
              style={{ backgroundColor: 'var(--ec-em)' }}
            >
              Acknowledge
            </button>
          )}
          <button
            onClick={() => onView(sop)}
            className="text-[11px] font-medium px-2.5 py-1 rounded-lg text-ec-t2 bg-ec-card-hover hover:bg-ec-border transition-colors"
          >
            View SOP
          </button>
        </div>
      </div>
    </div>
  )
}
