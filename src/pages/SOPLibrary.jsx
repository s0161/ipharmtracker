import { useState } from 'react'
import { useUser } from '../contexts/UserContext'
import { useSOPData } from '../hooks/useSOPData'
import { useToast } from '../components/Toast'
import { logAudit } from '../utils/auditLog'
import SkeletonLoader from '../components/SkeletonLoader'
import EmptyState from '../components/EmptyState'
import SOPGrid from '../components/sop-library/SOPGrid'
import SOPModal from '../components/sop-library/SOPModal'
import SOPAlertBanner from '../components/sop-library/SOPAlertBanner'
import InspectionView from '../components/sop-library/InspectionView'

export default function SOPLibrary() {
  const { user } = useUser()
  const showToast = useToast()
  const { sops, acksBySopId, myAckedIds, staffNames, loading, acknowledge } = useSOPData(user)

  const [viewMode, setViewMode] = useState('grid')
  const [selectedSop, setSelectedSop] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const handleAcknowledge = async (sopId) => {
    try {
      await acknowledge(sopId)
      const sop = sops.find(s => s.id === sopId)
      logAudit('Acknowledged', `SOP: ${sop?.code} — ${sop?.title}`, 'SOP Library', user?.name)
      showToast('SOP acknowledged')
    } catch {
      showToast('Failed to acknowledge SOP', 'error')
    }
  }

  if (loading) return <SkeletonLoader variant="cards" />

  if (sops.length === 0) {
    return (
      <EmptyState
        title="No SOPs found"
        description="Standard Operating Procedures will appear here once added"
      />
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="text-lg font-bold text-ec-t1">SOP Library</h1>
        <div className="flex items-center gap-1 bg-ec-card border border-ec-border rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('grid')}
            className={`text-[11px] font-medium px-3 py-1.5 rounded-md transition-colors border-none cursor-pointer
              ${viewMode === 'grid' ? 'text-white' : 'text-ec-t2 bg-transparent hover:bg-ec-card-hover'}`}
            style={viewMode === 'grid' ? { backgroundColor: 'var(--ec-em)' } : undefined}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('inspection')}
            className={`text-[11px] font-medium px-3 py-1.5 rounded-md transition-colors border-none cursor-pointer
              ${viewMode === 'inspection' ? 'text-white' : 'text-ec-t2 bg-transparent hover:bg-ec-card-hover'}`}
            style={viewMode === 'inspection' ? { backgroundColor: 'var(--ec-em)' } : undefined}
          >
            Inspection
          </button>
        </div>
      </div>

      <SOPAlertBanner sops={sops} />

      {viewMode === 'grid' ? (
        <SOPGrid
          sops={sops}
          myAckedIds={myAckedIds}
          onView={setSelectedSop}
          onAcknowledge={handleAcknowledge}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />
      ) : (
        <InspectionView
          sops={sops}
          acksBySopId={acksBySopId}
          staffNames={staffNames}
        />
      )}

      {selectedSop && (
        <SOPModal
          sop={selectedSop}
          acksBySopId={acksBySopId}
          staffNames={staffNames}
          myAcked={myAckedIds.has(selectedSop.id)}
          onAcknowledge={handleAcknowledge}
          onClose={() => setSelectedSop(null)}
        />
      )}
    </div>
  )
}
