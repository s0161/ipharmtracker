export default function PageActions({ onDownloadCsv }) {
  const btn =
    'px-3 py-1.5 bg-ec-card-hover text-ec-t2 rounded-lg text-xs border border-ec-border cursor-pointer hover:bg-ec-t5 hover:text-ec-t1 transition-colors flex items-center gap-1.5 font-sans'

  return (
    <div className="flex gap-2 no-print">
      <button className={btn} onClick={onDownloadCsv}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        CSV
      </button>
      <button className={btn} onClick={() => window.print()}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
        Print
      </button>
    </div>
  )
}
