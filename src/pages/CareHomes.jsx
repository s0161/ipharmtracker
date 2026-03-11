import { useState, useMemo } from 'react'
import { useUser } from '../contexts/UserContext'
import { useCareHomeData } from '../hooks/useCareHomeData'
import { isElevatedRole, STAFF_ROLES } from '../utils/taskEngine'
import CareHomeSummaryCards from '../components/carehomes/CareHomeSummaryCards'
import CareHomeCard from '../components/carehomes/CareHomeCard'
import NewCareHomeForm from '../components/carehomes/NewCareHomeForm'
import CareHomeDetail from './CareHomeDetail'

export default function CareHomes() {
  const { user } = useUser()
  const role = user?.role || STAFF_ROLES[user?.name] || 'staff'
  const elevated = isElevatedRole(role)

  const data = useCareHomeData()
  const {
    careHomes, patientsByHome, cyclesByHome, itemsByCycle,
    deliveriesByHome, notesByHome, marIssuesByHome,
    overallStats, loading,
    addCareHome, updateCareHome,
    addPatient, updatePatient,
    addCycle, updateCycleStatus, addCycleItems, updateCycleItem,
    addDelivery, updateDelivery,
    addHandoverNote, acknowledgeNote,
    addMARIssue, resolveMARIssue, updateMARIssueStatus,
  } = data

  const [selectedHome, setSelectedHome] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return careHomes.filter(h => {
      if (statusFilter !== 'All' && h.status !== statusFilter) return false
      const name = (h.name || '').toLowerCase()
      const addr = (h.address || '').toLowerCase()
      return name.includes(q) || addr.includes(q)
    })
  }, [careHomes, search, statusFilter])

  const handleAdd = async (formData) => {
    await addCareHome(formData)
    setShowForm(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-[3px] border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    )
  }

  // Detail view
  if (selectedHome) {
    const home = careHomes.find(h => h.id === selectedHome)
    if (!home) { setSelectedHome(null); return null }
    return (
      <CareHomeDetail
        home={home}
        patients={patientsByHome[home.id] || []}
        cycles={cyclesByHome[home.id] || []}
        itemsByCycle={itemsByCycle}
        deliveries={deliveriesByHome[home.id] || []}
        notes={notesByHome[home.id] || []}
        marIssues={marIssuesByHome[home.id] || []}
        isElevated={elevated}
        user={user}
        onBack={() => setSelectedHome(null)}
        onUpdateHome={updateCareHome}
        onAddPatient={addPatient}
        onUpdatePatient={updatePatient}
        onAddCycle={addCycle}
        onUpdateCycleStatus={updateCycleStatus}
        onAddCycleItems={addCycleItems}
        onUpdateCycleItem={updateCycleItem}
        onAddDelivery={addDelivery}
        onUpdateDelivery={updateDelivery}
        onAddNote={addHandoverNote}
        onAcknowledgeNote={acknowledgeNote}
        onAddIssue={addMARIssue}
        onResolveIssue={resolveMARIssue}
        onUpdateIssueStatus={updateMARIssueStatus}
      />
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-ec-t1">Care Homes</h1>
        {elevated && (
          <button onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg border-none cursor-pointer hover:bg-emerald-700 shadow-sm">
            Add Care Home
          </button>
        )}
      </div>

      {/* Summary cards */}
      <CareHomeSummaryCards stats={overallStats} />

      {/* Search + filter */}
      <div className="flex items-center gap-3 mb-4">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search care homes..."
          className="flex-1 px-3 py-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
        <div className="flex gap-1">
          {['All', 'Active', 'Inactive'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border-none cursor-pointer transition-colors
                ${statusFilter === s ? 'bg-emerald-600 text-white' : 'bg-ec-bg text-ec-t2 hover:bg-ec-div'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Card grid */}
      {filtered.length === 0 ? (
        <div className="p-8 bg-ec-card border border-ec-div rounded-xl text-center">
          <p className="text-sm text-ec-t3">No care homes found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(home => {
            const homePatients = patientsByHome[home.id] || []
            const homeCycles = cyclesByHome[home.id] || []
            const latestCycle = homeCycles[0] || null
            const homeIssues = (marIssuesByHome[home.id] || []).filter(i => i.status !== 'Resolved')
            return (
              <CareHomeCard
                key={home.id}
                home={home}
                patients={homePatients}
                latestCycle={latestCycle}
                issueCount={homeIssues.length}
                onClick={() => setSelectedHome(home.id)}
              />
            )
          })}
        </div>
      )}

      {showForm && <NewCareHomeForm onSave={handleAdd} onClose={() => setShowForm(false)} />}
    </div>
  )
}
