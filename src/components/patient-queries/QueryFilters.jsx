const QUERY_TYPES = [
  { label: 'All Types', value: 'all' },
  { label: 'Owing', value: 'owing' },
  { label: 'Callback', value: 'callback' },
  { label: 'GP Query', value: 'gp_query' },
  { label: 'Hospital Query', value: 'hospital_query' },
  { label: 'Patient Query', value: 'patient_query' },
  { label: 'Other', value: 'other' },
]

const PRIORITIES = [
  { label: 'All Priorities', value: 'all' },
  { label: 'Urgent', value: 'urgent' },
  { label: 'High', value: 'high' },
  { label: 'Normal', value: 'normal' },
  { label: 'Low', value: 'low' },
]

const STATUSES = [
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Awaiting Response', value: 'awaiting_response' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'All', value: 'all' },
]

const selectClass = 'px-2.5 py-1.5 rounded-lg border border-ec-border bg-ec-card text-xs text-ec-t1 outline-none focus:ring-2 focus:ring-[#0073e6]/30 cursor-pointer'

export default function QueryFilters({ filters, onChange, resultCount }) {
  const set = (key, val) => onChange({ ...filters, [key]: val })

  return (
    <div className="flex gap-2 flex-wrap mb-4 items-center">
      <div className="relative">
        <input
          type="text"
          placeholder="Search patient, medication..."
          value={filters.search}
          onChange={e => set('search', e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-ec-border bg-ec-card text-xs text-ec-t1 outline-none focus:ring-2 focus:ring-[#0073e6]/30 w-52"
        />
      </div>

      <select value={filters.type} onChange={e => set('type', e.target.value)} className={selectClass}>
        {QUERY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>

      <select value={filters.priority} onChange={e => set('priority', e.target.value)} className={selectClass}>
        {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
      </select>

      <select value={filters.status} onChange={e => set('status', e.target.value)} className={selectClass}>
        {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>

      <button
        onClick={() => set('showResolved', !filters.showResolved)}
        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition ${
          filters.showResolved
            ? 'bg-[#0073e6]/10 text-[#0073e6] border-[#0073e6]/30'
            : 'bg-transparent text-ec-t3 border-ec-border hover:bg-ec-card-hover'
        }`}
      >
        {filters.showResolved ? 'Hide Resolved' : 'Show Resolved'}
      </button>

      <span className="ml-auto text-xs text-ec-t3">
        {resultCount} quer{resultCount !== 1 ? 'ies' : 'y'}
      </span>
    </div>
  )
}
