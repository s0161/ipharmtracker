import { useState, useEffect } from 'react'
import { useToast } from '../components/Toast'

// ─── CONSTANTS ───
const DRUG_TABS = ['All', 'Schedule 2', 'Schedule 3', 'Schedule 4', 'Schedule 5']

const DUMMY_ENTRIES = [
  { id: 1, date: '2026-03-09', drugName: 'Morphine Sulfate', schedule: 2, formulation: 'Tablets', strength: '10mg', quantity: 30, direction: 'In', patient: '—', prescriber: 'Dr. Patel', witnessedBy: 'Salma Shakoor', balance: 30, staffMember: 'Amjid Shakoor' },
  { id: 2, date: '2026-03-09', drugName: 'Morphine Sulfate', schedule: 2, formulation: 'Tablets', strength: '10mg', quantity: 10, direction: 'Out', patient: 'J. Smith', prescriber: 'Dr. Patel', witnessedBy: 'Moniba Jamil', balance: 20, staffMember: 'Amjid Shakoor' },
  { id: 3, date: '2026-03-08', drugName: 'Oxycodone', schedule: 2, formulation: 'Capsules', strength: '5mg', quantity: 56, direction: 'In', patient: '—', prescriber: 'Dr. Hassan', witnessedBy: 'Umama Khan', balance: 56, staffMember: 'Salma Shakoor' },
  { id: 4, date: '2026-03-08', drugName: 'Fentanyl', schedule: 2, formulation: 'Patches', strength: '25mcg/hr', quantity: 5, direction: 'In', patient: '—', prescriber: 'Dr. Ali', witnessedBy: 'Sadaf Subhani', balance: 5, staffMember: 'Amjid Shakoor' },
  { id: 5, date: '2026-03-07', drugName: 'Diazepam', schedule: 4, formulation: 'Tablets', strength: '5mg', quantity: 28, direction: 'Out', patient: 'M. Ahmed', prescriber: 'Dr. Patel', witnessedBy: 'Urooj Khan', balance: 72, staffMember: 'Salma Shakoor' },
  { id: 6, date: '2026-03-07', drugName: 'Midazolam', schedule: 3, formulation: 'Solution', strength: '10mg/5ml', quantity: 10, direction: 'In', patient: '—', prescriber: 'Dr. Khan', witnessedBy: 'Shain Nawaz', balance: 10, staffMember: 'Amjid Shakoor' },
  { id: 7, date: '2026-03-06', drugName: 'Tramadol', schedule: 3, formulation: 'Capsules', strength: '50mg', quantity: 100, direction: 'In', patient: '—', prescriber: 'Dr. Hassan', witnessedBy: 'Salma Shakoor', balance: 100, staffMember: 'Moniba Jamil' },
  { id: 8, date: '2026-03-06', drugName: 'Codeine Phosphate', schedule: 5, formulation: 'Tablets', strength: '30mg', quantity: 20, direction: 'Out', patient: 'R. Jones', prescriber: 'Dr. Ali', witnessedBy: 'Marian Hadaway', balance: 80, staffMember: 'Salma Shakoor' },
  { id: 9, date: '2026-03-05', drugName: 'Methylphenidate', schedule: 2, formulation: 'Tablets', strength: '10mg', quantity: 30, direction: 'Out', patient: 'S. Williams', prescriber: 'Dr. Patel', witnessedBy: 'Umama Khan', balance: 70, staffMember: 'Amjid Shakoor' },
  { id: 10, date: '2026-03-05', drugName: 'Pregabalin', schedule: 3, formulation: 'Capsules', strength: '75mg', quantity: 56, direction: 'In', patient: '—', prescriber: 'Dr. Khan', witnessedBy: 'Moniba Jamil', balance: 56, staffMember: 'Salma Shakoor' },
]

const STAT_CARDS = [
  { label: 'Total Entries', value: '247', icon: 'clipboard', color: 'emerald' },
  { label: 'Active Drugs', value: '18', icon: 'pill', color: 'blue' },
  { label: 'Pending Checks', value: '3', icon: 'alert', color: 'amber' },
  { label: 'Last Audit', value: '12 Mar 2026', icon: 'calendar', color: 'emerald' },
]

const SCHEDULE_STYLES = {
  2: 'bg-ec-crit/10 text-ec-crit',
  3: 'bg-ec-warn/10 text-ec-warn',
  4: 'bg-ec-info/10 text-ec-info',
  5: 'bg-ec-bg text-ec-t2',
}

// ─── STAT ICONS ───
function StatIcon({ name, color }) {
  const cls = color === 'emerald' ? 'text-ec-em' : color === 'blue' ? 'text-ec-info' : 'text-ec-warn'
  const bg = color === 'emerald' ? 'bg-ec-em/10' : color === 'blue' ? 'bg-ec-info/10' : 'bg-ec-warn/10'
  const icons = {
    clipboard: <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
    pill: <><path d="M10.5 1.5H8.25A4.75 4.75 0 003.5 6.25v0a4.75 4.75 0 004.75 4.75h3.5a4.75 4.75 0 004.75-4.75v0A4.75 4.75 0 0011.75 1.5H10.5z" transform="rotate(45 12 12)" /><line x1="12" y1="8" x2="12" y2="16" transform="rotate(45 12 12)" /></>,
    alert: <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
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
export default function CDRegister() {
  const showToast = useToast()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [bannerVisible, setBannerVisible] = useState(() => {
    return localStorage.getItem('cd_banner_dismissed') !== 'true'
  })

  const dismissBanner = () => {
    setBannerVisible(false)
    localStorage.setItem('cd_banner_dismissed', 'true')
  }

  // Filter entries
  const filtered = DUMMY_ENTRIES.filter(e => {
    const matchesSearch = !search || e.drugName.toLowerCase().includes(search.toLowerCase())
    const matchesTab = activeTab === 'All' || e.schedule === parseInt(activeTab.replace('Schedule ', ''))
    return matchesSearch && matchesTab
  })

  const handleModalSubmit = () => {
    showToast('CD Register coming soon!', 'info')
    setShowModal(false)
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 ec-fadeup">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-ec-t1 m-0">CD Register</h1>
            <span className="bg-ec-warn/10 text-ec-warn text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
              Preview
            </span>
          </div>
          <p className="text-sm text-ec-t3 mt-1 mb-0">Controlled Drugs register — track receipts, supplies &amp; balances</p>
        </div>
      </div>

      {/* Amber Banner */}
      {bannerVisible && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl mb-5 border"
          style={{ backgroundColor: 'var(--ec-warn-bg)', borderColor: 'var(--ec-warn)', color: 'var(--ec-warn-dark)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--ec-warn)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div className="flex-1 text-sm">
            <span className="font-semibold">Coming Soon — </span>
            This is a preview of the CD Register feature. The data shown is sample data for demonstration purposes only. Full functionality including Supabase integration will be available in a future update.
          </div>
          <button onClick={dismissBanner}
            className="bg-transparent border-none cursor-pointer text-lg leading-none p-0 shrink-0"
            style={{ color: 'var(--ec-warn-dark)' }} aria-label="Dismiss banner">
            ✕
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {STAT_CARDS.map(card => (
          <div key={card.label} className="bg-ec-card border border-ec-border rounded-xl p-4 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <StatIcon name={card.icon} color={card.color} />
              <div>
                <div className="text-xs text-ec-t3 font-medium">{card.label}</div>
                <div className="text-xl font-bold text-ec-t1 mt-0.5">{card.value}</div>
              </div>
            </div>
            {/* DUMMY watermark */}
            <span className="absolute top-2 right-2 text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-ec-warn/30 text-ec-warn/40 uppercase tracking-wider">
              Dummy
            </span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ec-t3">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search drugs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-ec-border bg-ec-card text-sm text-ec-t1 placeholder:text-ec-t3 outline-none focus:ring-2 focus:ring-ec-em/30 transition"
          />
        </div>

        {/* Drug tabs */}
        <div className="flex gap-1 flex-wrap">
          {DRUG_TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border-none cursor-pointer transition-all
                ${activeTab === tab
                  ? 'bg-ec-em-dark text-white shadow-sm'
                  : 'bg-ec-card text-ec-t2 hover:bg-ec-card-hover border border-ec-border'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex gap-2 sm:ml-auto">
          <button onClick={() => showToast('Print feature coming soon!', 'info')}
            className="px-3 py-2 rounded-lg text-xs font-medium bg-ec-card text-ec-t2 border border-ec-border cursor-pointer hover:bg-ec-card-hover transition">
            Print Register
          </button>
          <button onClick={() => setShowModal(true)}
            className="px-3 py-2 rounded-lg text-xs font-semibold bg-ec-em-dark text-white border-none cursor-pointer hover:bg-ec-em-dark transition shadow-sm">
            + Add Entry
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-ec-card border border-ec-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-ec-border">
                {['Date', 'Drug Name', 'Sch.', 'Qty', 'Dir.', 'Patient', 'Prescriber', 'Witness', 'Bal.', 'Staff'].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold text-ec-t3 uppercase tracking-wide px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-ec-t3 text-sm">
                    No entries match your search
                  </td>
                </tr>
              ) : (
                filtered.map(entry => (
                  <tr key={entry.id} className="border-b border-ec-border last:border-b-0 hover:bg-ec-card-hover transition-colors relative group">
                    <td className="px-4 py-3 text-ec-t2 whitespace-nowrap">{formatDate(entry.date)}</td>
                    <td className="px-4 py-3 font-medium text-ec-t1">
                      <div>{entry.drugName}</div>
                      <div className="text-[11px] text-ec-t3">{entry.formulation} · {entry.strength}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SCHEDULE_STYLES[entry.schedule]}`}>
                        S{entry.schedule}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ec-t1 font-medium">{entry.quantity}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        entry.direction === 'In'
                          ? 'bg-ec-em-faint text-ec-em'
                          : 'bg-ec-warn/10 text-ec-warn'
                      }`}>
                        {entry.direction}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ec-t2">{entry.patient}</td>
                    <td className="px-4 py-3 text-ec-t2">{entry.prescriber}</td>
                    <td className="px-4 py-3 text-ec-t2">{entry.witnessedBy}</td>
                    <td className="px-4 py-3 text-ec-t1 font-semibold">{entry.balance}</td>
                    <td className="px-4 py-3 text-ec-t2 whitespace-nowrap">{entry.staffMember}</td>
                    {/* Subtle DUMMY watermark */}
                    <td className="absolute right-2 top-1/2 -translate-y-1/2 text-[7px] font-bold text-amber-400/20 uppercase tracking-widest pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                      Sample
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Table footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-ec-border text-xs text-ec-t3">
          <span>Showing {filtered.length} of {DUMMY_ENTRIES.length} sample entries</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-ec-warn/30 text-ec-warn/50 uppercase">
            Dummy Data
          </span>
        </div>
      </div>

      {/* Add Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-ec-card border border-ec-border rounded-2xl shadow-2xl w-full max-w-lg ec-fadeup overflow-hidden">
            {/* Amber overlay stripe */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-500" />

            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-bold text-ec-t1 m-0">Add CD Entry</h2>
                <button onClick={() => setShowModal(false)}
                  className="bg-transparent border-none text-ec-t3 hover:text-ec-t1 cursor-pointer text-lg transition-colors">
                  ✕
                </button>
              </div>
              <div className="flex items-center gap-2 mb-5">
                <span className="bg-ec-warn/10 text-ec-warn text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Coming Soon
                </span>
                <span className="text-xs text-ec-t3">This form is a preview only</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Date', type: 'date', value: '2026-03-09' },
                  { label: 'Drug Name', type: 'text', value: 'e.g. Morphine Sulfate' },
                  { label: 'Schedule', type: 'select', value: '2', options: ['2', '3', '4', '5'] },
                  { label: 'Quantity', type: 'number', value: '0' },
                  { label: 'Direction', type: 'select', value: 'In', options: ['In', 'Out'] },
                  { label: 'Patient Name', type: 'text', value: '' },
                  { label: 'Prescriber', type: 'text', value: '' },
                  { label: 'Witnessed By', type: 'text', value: '' },
                ].map(field => (
                  <div key={field.label} className={field.label === 'Drug Name' ? 'col-span-2' : ''}>
                    <label className="block text-[11px] font-semibold text-ec-t3 uppercase tracking-wide mb-1">
                      {field.label}
                    </label>
                    {field.type === 'select' ? (
                      <select disabled
                        className="w-full px-3 py-2 rounded-lg border border-ec-border bg-ec-card text-sm text-ec-t3 opacity-60 cursor-not-allowed">
                        {field.options.map(o => <option key={o} value={o}>{field.label === 'Schedule' ? `Schedule ${o}` : o}</option>)}
                      </select>
                    ) : (
                      <input type={field.type} disabled placeholder={field.value}
                        className="w-full px-3 py-2 rounded-lg border border-ec-border bg-ec-card text-sm text-ec-t3 opacity-60 cursor-not-allowed placeholder:text-ec-t3/50" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-ec-border">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-ec-card text-ec-t2 border border-ec-border cursor-pointer hover:bg-ec-card-hover transition">
                Cancel
              </button>
              <button onClick={handleModalSubmit}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-ec-em-dark text-white border-none cursor-pointer hover:bg-ec-em-dark transition shadow-sm">
                Save Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── HELPERS ───
function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
