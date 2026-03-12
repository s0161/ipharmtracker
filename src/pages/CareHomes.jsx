import { useState, useMemo } from 'react'
import { useCareHomeData } from '../hooks/useCareHomeData'
import {
  CARE_HOMES_SEED, CARE_HOME_CONTACTS_SEED, CARE_HOME_FLAGS_SEED,
  FLAG_SEVERITY_STYLES,
} from '../data/careHomeData'

// ─── Coming Soon Panel ───
function ComingSoonTab({ title, description }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-ec-div bg-ec-card p-8">
      <div className="absolute top-4 right-4">
        <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full bg-ec-em-faint text-ec-em border border-ec-em/20">
          Coming Soon
        </span>
      </div>
      <h3 className="text-base font-semibold text-ec-t1 mb-2">{title}</h3>
      <p className="text-sm text-ec-t3 mb-6 max-w-lg">{description}</p>
      {/* Skeleton wireframe */}
      <div className="space-y-3 opacity-30">
        <div className="h-8 bg-ec-div rounded-lg w-full" />
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-6 bg-ec-div rounded" />)}
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="h-5 bg-ec-div rounded flex-1" />
            <div className="h-5 bg-ec-div rounded w-24" />
            <div className="h-5 bg-ec-div rounded w-20" />
            <div className="h-5 bg-ec-div rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Overview Tab ───
function OverviewPanel({ home, contacts, flags }) {
  const deliveryDays = home.deliveryDays || home.delivery_days || []
  const deliverySlot = home.deliverySlot || home.delivery_slot || '—'
  const pharmacistLead = home.pharmacistLead || home.pharmacist_lead || 'Amjid Shakoor'
  const cqc = home.cqcRegistration || home.cqc_registration || '—'
  const resCount = home.residentCount || home.resident_count || home.patientCount || home.patient_count || 0

  // Derive last delivery / last audit from flags
  const lastDeliveryFlag = (flags || []).find(f => (f.flagType || f.flag_type) === 'delivery')
  const lastAuditFlag = (flags || []).find(f => (f.flagType || f.flag_type) === 'audit')
  const outstandingFlags = (flags || []).filter(f => !f.resolved && ((f.severity || '') === 'warning' || (f.severity || '') === 'alert'))

  return (
    <div className="space-y-6">
      {/* Home info card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 bg-ec-card border border-ec-div rounded-xl">
          <h3 className="text-sm font-bold text-ec-t1 mb-4 uppercase tracking-wider">Details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-ec-t3">Address</span><span className="text-ec-t1 text-right max-w-[60%]">{home.address || '—'}</span></div>
            <div className="flex justify-between"><span className="text-ec-t3">CQC Registration</span><span className="text-ec-t1 font-mono text-xs">{cqc}</span></div>
            <div className="flex justify-between"><span className="text-ec-t3">Residents</span><span className="text-ec-t1 font-semibold">{resCount}</span></div>
            <div className="flex justify-between"><span className="text-ec-t3">Pharmacy Lead</span><span className="text-ec-t1">{pharmacistLead}</span></div>
          </div>
        </div>

        <div className="p-5 bg-ec-card border border-ec-div rounded-xl">
          <h3 className="text-sm font-bold text-ec-t1 mb-4 uppercase tracking-wider">Delivery Schedule</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ec-t3">Days</span>
              <div className="flex gap-1.5">
                {deliveryDays.length > 0 ? deliveryDays.map(d => (
                  <span key={d} className="px-2 py-0.5 text-xs font-medium rounded-full bg-ec-em-faint text-ec-em">{d}</span>
                )) : <span className="text-ec-t3">—</span>}
              </div>
            </div>
            <div className="flex justify-between"><span className="text-ec-t3">Slot</span><span className="text-ec-t1 capitalize">{deliverySlot}</span></div>
          </div>

          {/* Status badges */}
          <div className="mt-5 pt-4 border-t border-ec-div flex flex-wrap gap-2">
            {lastDeliveryFlag && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-ec-em-faint text-ec-em">{lastDeliveryFlag.flagLabel || lastDeliveryFlag.flag_label}</span>
            )}
            {lastAuditFlag && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-ec-info/10 text-ec-info">{lastAuditFlag.flagLabel || lastAuditFlag.flag_label}</span>
            )}
            {outstandingFlags.length > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-ec-warn/10 text-ec-warn">{outstandingFlags.length} outstanding</span>
            )}
          </div>
        </div>
      </div>

      {/* Key Contacts */}
      <div className="p-5 bg-ec-card border border-ec-div rounded-xl">
        <h3 className="text-sm font-bold text-ec-t1 mb-4 uppercase tracking-wider">Key Contacts</h3>
        {(!contacts || contacts.length === 0) ? (
          <p className="text-sm text-ec-t3">No contacts on file</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-ec-t3 border-b border-ec-div">
                  <th className="pb-2 font-semibold">Role</th>
                  <th className="pb-2 font-semibold">Name</th>
                  <th className="pb-2 font-semibold">Phone</th>
                  <th className="pb-2 font-semibold">Email</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c, i) => (
                  <tr key={c.id || i} className="border-b border-ec-div/50 last:border-0">
                    <td className="py-2.5 text-ec-t2">{c.role}</td>
                    <td className="py-2.5 text-ec-t1 font-medium">
                      {c.name}
                      {(c.isPrimary || c.is_primary) && (
                        <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-ec-em-faint text-ec-em">PRIMARY</span>
                      )}
                    </td>
                    <td className="py-2.5 text-ec-t2 font-mono text-xs">{c.phone || '—'}</td>
                    <td className="py-2.5 text-ec-t2 text-xs truncate max-w-[180px]">{c.email || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        {['Log Delivery', 'Request Collection', 'View MAR', 'Contact Home'].map(label => (
          <button key={label}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-ec-div bg-ec-card text-ec-t2 cursor-pointer hover:bg-ec-bg hover:text-ec-t1 hover:border-ec-em/30 transition-all">
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Detail Tabs ───
const DETAIL_TABS = ['Overview', 'Medication Records', 'Deliveries', 'Incidents & Flags', 'Audit Trail']

function DetailPanel({ home, contacts, flags }) {
  const [activeTab, setActiveTab] = useState('Overview')

  return (
    <div>
      {/* Detail tab strip */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1 border-b border-ec-div">
        {DETAIL_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-none cursor-pointer transition-all whitespace-nowrap
              ${activeTab === tab
                ? 'bg-ec-card text-ec-em border-b-2 border-ec-em shadow-sm'
                : 'bg-transparent text-ec-t3 hover:text-ec-t1'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' && (
        <OverviewPanel home={home} contacts={contacts} flags={flags} />
      )}
      {activeTab === 'Medication Records' && (
        <ComingSoonTab
          title="Medication Records"
          description="Medication administration records, DAA tray logs, PRN tracking and CD reconciliation will appear here."
        />
      )}
      {activeTab === 'Deliveries' && (
        <ComingSoonTab
          title="Deliveries"
          description="Delivery confirmation, bag label reprints, signature capture and route scheduling."
        />
      )}
      {activeTab === 'Incidents & Flags' && (
        <ComingSoonTab
          title="Incidents & Flags"
          description="Incident logging, near-miss reports, safeguarding flags and prescriber escalation log."
        />
      )}
      {activeTab === 'Audit Trail' && (
        <ComingSoonTab
          title="Audit Trail"
          description="Full dispensing account history, GPhC-ready export, consent records and monthly waste log."
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════
// Main Care Homes Page
// ═══════════════════════════════════════════════════
export default function CareHomes() {
  const {
    careHomes, contactsByHome, flagsByHome, loading,
  } = useCareHomeData()

  // Use DB data, fallback to seed data for display
  const homes = useMemo(() => {
    if (careHomes.length > 0) return careHomes
    // Fallback: use static seed data
    return CARE_HOMES_SEED.map((h, i) => ({ ...h, id: `seed-${i}`, _isSeed: true }))
  }, [careHomes])

  const [selectedIdx, setSelectedIdx] = useState(0)
  const selectedHome = homes[selectedIdx] || homes[0]

  // Get contacts & flags for selected home (from DB or seed)
  const contacts = useMemo(() => {
    if (!selectedHome) return []
    if (selectedHome._isSeed) {
      return (CARE_HOME_CONTACTS_SEED[selectedHome.name] || []).map((c, i) => ({ ...c, id: `sc-${i}` }))
    }
    return contactsByHome[selectedHome.id] || []
  }, [selectedHome, contactsByHome])

  const flags = useMemo(() => {
    if (!selectedHome) return []
    if (selectedHome._isSeed) {
      return (CARE_HOME_FLAGS_SEED[selectedHome.name] || []).map((f, i) => ({ ...f, id: `sf-${i}` }))
    }
    return flagsByHome[selectedHome.id] || []
  }, [selectedHome, flagsByHome])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-[3px] border-ec-em-border border-t-ec-em rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold page-heading">Care Homes</h1>
        <p className="text-sm text-ec-t3 mt-1">FED07 iPharmacy Direct — {homes.length} registered care homes</p>
      </div>

      {/* ─── Care Home Selector ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {homes.map((home, idx) => {
          const isActive = idx === selectedIdx
          const resCount = home.residentCount || home.resident_count || home.patientCount || home.patient_count || 0
          const homeFlags = home._isSeed
            ? (CARE_HOME_FLAGS_SEED[home.name] || [])
            : (flagsByHome[home.id] || [])
          const hasAlert = homeFlags.some(f => (f.severity || '') === 'alert' || (f.severity || '') === 'warning')

          return (
            <button
              key={home.id}
              onClick={() => setSelectedIdx(idx)}
              className={`relative text-left p-3 rounded-xl border cursor-pointer transition-all
                ${isActive
                  ? 'bg-ec-em-dark border-ec-em text-white shadow-lg shadow-ec-em/20 scale-[1.02]'
                  : 'bg-ec-card border-ec-div hover:shadow-md hover:border-ec-em/30'}`}
            >
              {/* Alert dot */}
              {hasAlert && !isActive && (
                <span className="absolute top-2 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-ec-warn" />
                </span>
              )}
              <div className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-ec-t1'}`}>
                {home.name}
              </div>
              <div className={`text-xs mt-1 ${isActive ? 'text-white/80' : 'text-ec-t3'}`}>
                {resCount} residents
              </div>
              <div className={`text-[10px] mt-1.5 truncate ${isActive ? 'text-white/60' : 'text-ec-t3'}`}>
                {home.tagline || (home._isSeed ? '' : (home.address || '').split(',')[0])}
              </div>
            </button>
          )
        })}
      </div>

      {/* ─── Flag Banner ─── */}
      {flags.filter(f => !f.resolved).map((f, i) => {
        const sev = f.severity || 'info'
        const style = FLAG_SEVERITY_STYLES[sev] || FLAG_SEVERITY_STYLES.info
        return (
          <div key={f.id || i} className={`flex items-center gap-3 px-4 py-2.5 mb-3 rounded-lg border ${style.bg} ${style.border}`}>
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sev === 'alert' ? 'bg-ec-crit' : sev === 'warning' ? 'bg-ec-warn' : 'bg-ec-info'}`} />
            <span className={`text-sm font-medium ${style.text}`}>{f.flagLabel || f.flag_label}</span>
          </div>
        )
      })}

      {/* ─── Detail Panel ─── */}
      {selectedHome && (
        <DetailPanel
          home={selectedHome}
          contacts={contacts}
          flags={flags}
        />
      )}
    </div>
  )
}
