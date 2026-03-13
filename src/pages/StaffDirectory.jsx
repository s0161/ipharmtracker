export default function StaffDirectory() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 ec-fadeup">
      <div className="page-header-panel flex items-center gap-3 mb-1" style={{ background: 'linear-gradient(135deg, #f8fffd 0%, #f0fdfa 100%)', border: '1.5px solid rgba(13,148,136,0.2)', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 3px rgba(10,37,64,0.08), 0 4px 12px rgba(10,37,64,0.04)' }}>
        <div style={{ width: 4, height: 40, borderRadius: 4, background: 'linear-gradient(180deg, #0d9488 0%, #0f766e 100%)', flexShrink: 0 }} />
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>Staff Directory</h1>
        <span className="bg-ec-warn/10 text-ec-warn text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
          Coming Soon
        </span>
      </div>
      <p className="text-sm text-ec-t3 mt-1 mb-0">Team profiles, roles &amp; contact details</p>
    </div>
  )
}
