export default function StaffDirectory() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 ec-fadeup">
      <div className="page-header-panel flex items-center gap-3 mb-1" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 3px rgba(10,37,64,0.06)' }}>
        <div style={{ width: 4, height: 32, borderRadius: 4, background: 'linear-gradient(180deg, #0d9488 0%, #0f766e 100%)', flexShrink: 0 }} />
        <h1 className="text-2xl font-bold m-0" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>Staff Directory</h1>
        <span className="bg-ec-warn/10 text-ec-warn text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
          Coming Soon
        </span>
      </div>
      <p className="text-sm text-ec-t3 mt-1 mb-0">Team profiles, roles &amp; contact details</p>
    </div>
  )
}
