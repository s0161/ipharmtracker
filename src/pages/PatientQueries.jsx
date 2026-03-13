import { useState, useMemo } from 'react'
import { useToast } from '../components/Toast'
import { useUser } from '../contexts/UserContext'
import { usePatientQueries } from '../hooks/usePatientQueries'
import { useSupabase } from '../hooks/useSupabase'
import QueryStats from '../components/patient-queries/QueryStats'
import QueryFilters from '../components/patient-queries/QueryFilters'
import QueryCard from '../components/patient-queries/QueryCard'
import QueryModal from '../components/patient-queries/QueryModal'
import QueryDetailModal from '../components/patient-queries/QueryDetailModal'

const DEFAULT_FILTERS = {
  search: '',
  type: 'all',
  priority: 'all',
  status: 'all',
  showResolved: false,
}

export default function PatientQueries() {
  const showToast = useToast()
  const { user } = useUser()
  const { queries, loading, stats, insert, update, logContactAttempt } = usePatientQueries()
  const [staff] = useSupabase('staff_members', [])

  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedQuery, setSelectedQuery] = useState(null)

  // Build staff id->name map
  const staffMap = useMemo(() => {
    const map = {}
    staff.forEach(s => { map[s.id] = s.name })
    return map
  }, [staff])

  // Filter + sort
  const filtered = useMemo(() => {
    return queries.filter(q => {
      // Status filter
      if (filters.status !== 'all' && q.status !== filters.status) return false
      // Hide resolved/cancelled by default
      if (!filters.showResolved && filters.status === 'all' && (q.status === 'resolved' || q.status === 'cancelled')) return false
      // Type
      if (filters.type !== 'all' && q.queryType !== filters.type) return false
      // Priority
      if (filters.priority !== 'all' && (q.priority || 'normal').toLowerCase() !== filters.priority) return false
      // Search
      if (filters.search) {
        const s = filters.search.toLowerCase()
        const haystack = `${q.patientName} ${q.subject} ${q.medication || ''}`.toLowerCase()
        if (!haystack.includes(s)) return false
      }
      return true
    })
  }, [queries, filters])

  const handleInsert = async (data) => {
    await insert(data)
    showToast('Query logged', 'success')
  }

  const handleUpdate = async (id, changes) => {
    await update(id, changes)
    showToast('Query updated', 'success')
    setSelectedQuery(null)
  }

  const handleLogContact = async (id, count) => {
    await logContactAttempt(id, count)
    showToast('Contact attempt logged', 'success')
    // Refresh selectedQuery with latest data
    const updated = queries.find(q => q.id === id)
    if (updated) setSelectedQuery({ ...updated, contactAttemptCount: (count || 0) + 1, contactAttemptedAt: new Date().toISOString() })
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 ec-fadeup">
      {/* Page header */}
      <div className="page-header-panel flex flex-wrap items-start justify-between gap-3 mb-5" style={{
        background: 'linear-gradient(135deg, #f8fbff 0%, #eff6ff 100%)',
        border: '1.5px solid rgba(0,115,230,0.2)',
        borderRadius: 12,
        padding: '20px 24px',
        boxShadow: '0 1px 3px rgba(10,37,64,0.08), 0 4px 12px rgba(10,37,64,0.04)',
      }}>
        <div>
          <div className="flex items-center gap-3">
            <div style={{ width: 4, height: 40, borderRadius: 4, background: 'linear-gradient(180deg, #0073e6 0%, #0284c7 100%)', flexShrink: 0 }} />
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>Patient Queries & Owings</h1>
          </div>
          <p className="text-sm text-ec-t3 mt-1 mb-0">
            Track prescription owings, patient callbacks, and outstanding queries
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 rounded-lg text-xs font-semibold text-white border-none cursor-pointer hover:opacity-90 transition shadow-sm"
          style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
        >
          + New Query
        </button>
      </div>

      {/* Stats */}
      <QueryStats stats={stats} />

      {/* Filters */}
      <QueryFilters filters={filters} onChange={setFilters} resultCount={filtered.length} />

      {/* Query list */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-ec-card border border-ec-border rounded-xl p-4 animate-pulse">
              <div className="flex gap-1.5 mb-2">
                <div className="h-4 w-14 bg-ec-border rounded-full" />
                <div className="h-4 w-16 bg-ec-border rounded-full" />
              </div>
              <div className="h-4 w-3/4 bg-ec-border rounded mb-2" />
              <div className="h-3 w-full bg-ec-border rounded mb-3" />
              <div className="flex gap-2">
                <div className="h-7 w-20 bg-ec-border rounded-lg" />
                <div className="h-7 w-16 bg-ec-border rounded-lg" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">📋</div>
            <div className="text-sm font-medium text-ec-t2 mb-1">No queries found</div>
            <div className="text-xs text-ec-t3 mb-4">All caught up — or try adjusting your filters</div>
            <button
              onClick={() => setShowAdd(true)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white border-none cursor-pointer transition shadow-sm"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
            >
              + Log a Query
            </button>
          </div>
        ) : (
          filtered.map(q => (
            <QueryCard
              key={q.id}
              query={q}
              onClick={() => setSelectedQuery(q)}
              staffMap={staffMap}
            />
          ))
        )}
      </div>

      {/* Add modal */}
      <QueryModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSubmit={handleInsert}
        staff={staff}
        userId={user?.id}
      />

      {/* Detail modal */}
      <QueryDetailModal
        query={selectedQuery}
        open={!!selectedQuery}
        onClose={() => setSelectedQuery(null)}
        onUpdate={handleUpdate}
        onLogContact={handleLogContact}
        staffMap={staffMap}
        userId={user?.id}
      />
    </div>
  )
}
