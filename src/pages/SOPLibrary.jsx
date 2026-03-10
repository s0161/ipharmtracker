import { useState, useMemo } from 'react'
import { useToast } from '../components/Toast'
import SOPViewer from '../components/SOPViewer'
import DUMMY_SOPS from '../data/sopData'

// ─── CONSTANTS ───
const CATEGORY_TABS = ['All', 'Dispensing', 'CD', 'Clinical', 'Governance', 'H&S', 'HR & Training', 'Facilities', 'Delivery', 'IT & Systems', 'NHS Services', 'Controlled Stationery', 'Internet Pharmacy']

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

const ROLE_TABS = ['All Roles', 'Pharmacist', 'Technician', 'Dispenser', 'ACA', 'Driver', 'Stock', 'All Staff']

const ROLE_TAB_MAP = {
  'All Roles': null,
  'Pharmacist': 'pharmacist',
  'Technician': 'technician',
  'Dispenser': 'dispenser',
  'ACA': 'aca',
  'Driver': 'driver',
  'Stock': 'stock_assistant',
  'All Staff': 'all',
}

const ROLE_DISPLAY = {
  all: 'All Staff',
  superintendent: 'Superintendent',
  manager: 'Manager',
  pharmacist: 'Pharmacist',
  technician: 'Technician',
  dispenser: 'Dispenser',
  aca: 'ACA',
  stock_assistant: 'Stock',
  driver: 'Driver',
}


// ─── STAT ICONS ───
function StatIcon({ name, color }) {
  const cls = color === 'emerald' ? 'text-emerald-600' : color === 'blue' ? 'text-blue-600' : 'text-amber-600'
  const bg = color === 'emerald' ? 'bg-emerald-500/10' : color === 'blue' ? 'bg-blue-500/10' : 'bg-amber-500/10'
  const icons = {
    book: <><path d="M2 3h8a2 2 0 0 1 2 2v14a1.5 1.5 0 0 0-1.5-1.5H2V3z" /><path d="M22 3h-8a2 2 0 0 0-2 2v14a1.5 1.5 0 0 1 1.5-1.5H22V3z" /></>,
    check: <><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>,
    alert: <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
    chart: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>,
  }
  return (
    <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 ${cls}`}>
        {icons[name]}
      </svg>
    </div>
  )
}

// ─── MAIN COMPONENT ───
export default function SOPLibrary() {
  const showToast = useToast()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('All')
  const [activeRole, setActiveRole] = useState('All Roles')
  const [selectedSop, setSelectedSop] = useState(null)
  const [bannerVisible, setBannerVisible] = useState(() => {
    return localStorage.getItem('sop_banner_dismissed') !== 'true'
  })

  const dismissBanner = () => {
    setBannerVisible(false)
    localStorage.setItem('sop_banner_dismissed', 'true')
  }

  // Dynamic stats
  const stats = useMemo(() => {
    const total = DUMMY_SOPS.length
    const acknowledged = DUMMY_SOPS.filter(s => s.acked >= 10).length
    const overdue = DUMMY_SOPS.filter(s => s.status === 'Overdue').length
    const avgCoverage = DUMMY_SOPS.reduce((sum, s) => sum + (s.acked / 13), 0) / total
    return [
      { label: 'Total SOPs', value: String(total), icon: 'book', color: 'emerald' },
      { label: 'Acknowledged', value: String(acknowledged), icon: 'check', color: 'blue' },
      { label: 'Overdue Review', value: String(overdue), icon: 'alert', color: 'amber' },
      { label: 'Coverage', value: Math.round(avgCoverage * 100) + '%', icon: 'chart', color: 'emerald' },
    ]
  }, [])

  // Filter SOPs
  const filtered = useMemo(() => {
    const roleKey = ROLE_TAB_MAP[activeRole]
    return DUMMY_SOPS.filter(sop => {
      const matchesSearch = !search || sop.title.toLowerCase().includes(search.toLowerCase()) || sop.code.toLowerCase().includes(search.toLowerCase())
      const matchesTab = activeTab === 'All' || sop.category === activeTab
      const matchesRole = !roleKey
        ? true
        : roleKey === 'all'
          ? sop.roles.includes('all')
          : sop.roles.includes('all') || sop.roles.includes(roleKey)
      return matchesSearch && matchesTab && matchesRole
    })
  }, [search, activeTab, activeRole])

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 ec-fadeup">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-ec-t1 m-0">SOP Library</h1>
            <span className="bg-amber-500/10 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
              Preview
            </span>
          </div>
          <p className="text-sm text-ec-t3 mt-1 mb-0">Standard Operating Procedures — view, acknowledge &amp; track compliance</p>
        </div>
      </div>

      {/* Amber Banner */}
      {bannerVisible && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl mb-5 border"
          style={{ backgroundColor: '#fffbeb', borderColor: '#f59e0b', color: '#92400e' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div className="flex-1 text-sm">
            <span className="font-semibold">Coming Soon — </span>
            This is a preview of the SOP Library feature. The data shown is sample data for demonstration purposes only. Full functionality including acknowledgement tracking and inspection mode will be available in a future update.
          </div>
          <button onClick={dismissBanner}
            className="bg-transparent border-none cursor-pointer text-lg leading-none p-0 shrink-0"
            style={{ color: '#92400e' }} aria-label="Dismiss banner">
            ✕
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {stats.map(card => (
          <div key={card.label} className="bg-ec-card border border-ec-border rounded-xl p-4 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <StatIcon name={card.icon} color={card.color} />
              <div>
                <div className="text-xs text-ec-t3 font-medium">{card.label}</div>
                <div className="text-xl font-bold text-ec-t1 mt-0.5">{card.value}</div>
              </div>
            </div>
            {/* DUMMY watermark */}
            <span className="absolute top-2 right-2 text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-amber-400/30 text-amber-500/40 uppercase tracking-wider">
              Dummy
            </span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-3">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ec-t3">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search SOPs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-ec-border bg-ec-card text-sm text-ec-t1 placeholder:text-ec-t3 outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
          />
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 flex-wrap">
          {CATEGORY_TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border-none cursor-pointer transition-all
                ${activeTab === tab
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-ec-card text-ec-t2 hover:bg-ec-card-hover border border-ec-border'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="sm:ml-auto">
          <button onClick={() => showToast('SOP upload coming soon!', 'info')}
            className="px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white border-none cursor-pointer hover:bg-emerald-700 transition shadow-sm">
            + Add SOP
          </button>
        </div>
      </div>

      {/* Role filter pills */}
      <div className="flex gap-1 flex-wrap mb-4">
        {ROLE_TABS.map(role => (
          <button key={role} onClick={() => setActiveRole(role)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium border cursor-pointer transition-all
              ${activeRole === role
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-ec-card text-ec-t3 border-ec-border hover:text-ec-t2 hover:border-ec-t3/30'
              }`}
          >
            {role}
          </button>
        ))}
      </div>

      {/* SOP Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-ec-t3 text-sm">
            No SOPs match your filters
          </div>
        ) : (
          filtered.map(sop => (
            <div key={sop.id} className="bg-ec-card border border-ec-border rounded-xl p-4 relative overflow-hidden group hover:shadow-md transition-shadow">
              {/* Category + Status badges */}
              <div className="flex items-center gap-1.5 mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_STYLES[sop.category]}`}>
                  {sop.category}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[sop.status]}`}>
                  {sop.status}
                </span>
              </div>

              {/* Role badges */}
              <div className="flex flex-wrap gap-1 mb-2">
                {sop.roles.includes('all') ? (
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-500 dark:text-slate-400">
                    All Staff
                  </span>
                ) : (
                  sop.roles.map(r => (
                    <span key={r} className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-500 dark:text-slate-400">
                      {ROLE_DISPLAY[r] || r}
                    </span>
                  ))
                )}
              </div>

              {/* Code + Title */}
              <div className="text-[11px] font-mono text-ec-t3 mb-1">{sop.code}</div>
              <h3 className="text-sm font-semibold text-ec-t1 m-0 mb-3 leading-snug">{sop.title}</h3>

              {/* Meta */}
              <div className="flex items-center justify-between text-[11px] text-ec-t3 mb-3">
                <span>v{sop.version}</span>
                <span>Review: {formatDate(sop.reviewDate)}</span>
              </div>

              {/* Ack bar */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-1.5 rounded-full bg-ec-border overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.round((sop.acked / 13) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] font-medium text-ec-t3">{sop.acked}/13</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedSop(sop)}
                  className="flex-1 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-ec-card text-ec-t2 border border-ec-border cursor-pointer hover:bg-ec-card-hover transition"
                >
                  View
                </button>
                <button
                  onClick={() => showToast('SOP acknowledgement coming soon!', 'info')}
                  className="flex-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-600 text-white border-none cursor-pointer hover:bg-emerald-700 transition"
                >
                  Acknowledge
                </button>
              </div>

              {/* Subtle DUMMY watermark */}
              <span className="absolute top-2 right-2 text-[7px] font-bold text-amber-400/20 uppercase tracking-widest pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                Sample
              </span>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 px-1 text-xs text-ec-t3">
        <span>Showing {filtered.length} of {DUMMY_SOPS.length} sample SOPs</span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/30 text-amber-500/50 uppercase">
          Dummy Data
        </span>
      </div>

      {/* SOP Viewer slide-over */}
      {selectedSop && (
        <SOPViewer
          sop={selectedSop}
          onClose={() => setSelectedSop(null)}
          onAcknowledge={() => showToast('SOP acknowledgement coming soon!', 'info')}
        />
      )}
    </div>
  )
}

// ─── HELPERS ───
function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
