import { useState, useMemo, useEffect } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import { downloadCsv } from '../utils/exportCsv'
import PageActions from '../components/PageActions'
import SkeletonLoader from '../components/SkeletonLoader'

const selectClass =
  'bg-ec-card border border-ec-border rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors font-sans'

const inputClass =
  'bg-ec-card border border-ec-border rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors font-sans'

function actionBadge(action) {
  const a = (action || '').toLowerCase()
  let cls = 'bg-ec-border text-ec-t2'
  if (a.startsWith('created') || a.startsWith('added') || a.startsWith('recorded') || a.startsWith('logged')) {
    cls = 'bg-ec-em/10 text-ec-em'
  } else if (a.startsWith('updated') || a.startsWith('edited') || a.startsWith('changed') || a.startsWith('saved')) {
    cls = 'bg-ec-warn/10 text-ec-warn'
  } else if (a.startsWith('deleted') || a.startsWith('removed') || a.startsWith('cleared')) {
    cls = 'bg-ec-crit/10 text-ec-crit-light'
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${cls}`}>
      {action || '\u2014'}
    </span>
  )
}

function categoryBadge(page) {
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-ec-info/10 text-ec-info-light whitespace-nowrap">
      {page || '\u2014'}
    </span>
  )
}

const PER_PAGE = 50

export default function AuditLog() {
  const [logs, , loading] = useSupabase('audit_log', [])
  const [search, setSearch] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [filterUser, setFilterUser] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortField, setSortField] = useState('timestamp')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)

  // Derive unique actions and users for dropdowns
  const { actions, users } = useMemo(() => {
    const actionSet = new Set()
    const userSet = new Set()
    for (const l of logs) {
      if (l.action) actionSet.add(l.action)
      if (l.user) userSet.add(l.user)
    }
    return {
      actions: [...actionSet].sort(),
      users: [...userSet].sort(),
    }
  }, [logs])

  // Filter
  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (filterAction && l.action !== filterAction) return false
      if (filterUser && l.user !== filterUser) return false
      if (dateFrom && l.timestamp && l.timestamp < dateFrom) return false
      if (dateTo) {
        const toEnd = dateTo + 'T23:59:59'
        if (l.timestamp && l.timestamp > toEnd) return false
      }
      if (search) {
        const q = search.toLowerCase()
        const matchAction = (l.action || '').toLowerCase().includes(q)
        const matchItem = (l.item || '').toLowerCase().includes(q)
        const matchUser = (l.user || '').toLowerCase().includes(q)
        const matchPage = (l.page || '').toLowerCase().includes(q)
        if (!matchAction && !matchItem && !matchUser && !matchPage) return false
      }
      return true
    })
  }, [logs, search, filterAction, filterUser, dateFrom, dateTo])

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = a[sortField] || ''
      const bVal = b[sortField] || ''
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortField, sortDir])

  // Reset to page 1 when any filter changes
  useEffect(() => {
    setPage(1)
  }, [search, filterAction, filterUser, dateFrom, dateTo])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const displayed = sorted.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const sortIcon = (field) => {
    if (sortField !== field) return ''
    return sortDir === 'asc' ? ' \u2191' : ' \u2193'
  }

  const handleCsvDownload = () => {
    const headers = ['Timestamp', 'Action', 'Description', 'Category', 'User']
    const rows = filtered.map((l) => [
      l.timestamp ? new Date(l.timestamp).toLocaleString('en-GB') : '',
      l.action || '',
      l.item || '',
      l.page || '',
      l.user || '',
    ])
    downloadCsv('audit-log', headers, rows)
  }

  const clearFilters = () => {
    setSearch('')
    setFilterAction('')
    setFilterUser('')
    setDateFrom('')
    setDateTo('')
  }

  const hasFilters = search || filterAction || filterUser || dateFrom || dateTo

  if (loading) {
    return <SkeletonLoader variant="table" />
  }

  return (
    <div>
      <p className="text-sm text-ec-t3 mb-2">
        View all system activity. Filter by action, user, category or date range.
      </p>

      {/* Filter row */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <PageActions onDownloadCsv={handleCsvDownload} />

        <input
          type="text"
          className={inputClass}
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className={selectClass}
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
        >
          <option value="">All Actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <select
          className={selectClass}
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
        >
          <option value="">All Users</option>
          {users.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>

        <input
          type="date"
          className={inputClass}
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          title="From date"
        />

        <input
          type="date"
          className={inputClass}
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          title="To date"
        />

        {hasFilters && (
          <button
            className="px-3 py-2 bg-ec-card-hover text-ec-t3 rounded-lg text-xs border border-ec-border cursor-pointer hover:text-ec-t1 transition-colors font-sans"
            onClick={clearFilters}
          >
            Clear
          </button>
        )}
      </div>

      {/* Results count */}
      <div className="text-xs text-ec-t3 mb-3">
        {filtered.length === logs.length
          ? `${logs.length} entries`
          : `${filtered.length} of ${logs.length} entries`}
      </div>

      {/* Table */}
      {displayed.length === 0 ? (
        <div className="text-center py-10 text-ec-t3 text-sm">
          <p>No audit log entries found.</p>
        </div>
      ) : (
        <div
          className="overflow-x-auto rounded-xl"
          style={{ border: '1px solid var(--ec-border)' }}
        >
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th
                  className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border cursor-pointer hover:text-ec-t1 transition-colors select-none"
                  onClick={() => handleSort('timestamp')}
                >
                  Timestamp{sortIcon('timestamp')}
                </th>
                <th
                  className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border cursor-pointer hover:text-ec-t1 transition-colors select-none"
                  onClick={() => handleSort('action')}
                >
                  Action{sortIcon('action')}
                </th>
                <th
                  className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border cursor-pointer hover:text-ec-t1 transition-colors select-none"
                  onClick={() => handleSort('item')}
                >
                  Description{sortIcon('item')}
                </th>
                <th
                  className="hidden md:table-cell text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border cursor-pointer hover:text-ec-t1 transition-colors select-none"
                  onClick={() => handleSort('page')}
                >
                  Category{sortIcon('page')}
                </th>
                <th
                  className="hidden md:table-cell text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border cursor-pointer hover:text-ec-t1 transition-colors select-none"
                  onClick={() => handleSort('user')}
                >
                  User{sortIcon('user')}
                </th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((l, i) => (
                <tr
                  key={l.id || i}
                  className="hover:bg-ec-card-hover transition-colors"
                >
                  <td className="px-4 py-2.5 text-ec-t2 border-b border-ec-div whitespace-nowrap text-xs">
                    {l.timestamp
                      ? new Date(l.timestamp).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '\u2014'}
                  </td>
                  <td className="px-4 py-2.5 border-b border-ec-div">
                    {actionBadge(l.action)}
                  </td>
                  <td className="px-4 py-2.5 text-ec-t1 border-b border-ec-div max-w-[300px] truncate">
                    {l.item || '\u2014'}
                  </td>
                  <td className="hidden md:table-cell px-4 py-2.5 border-b border-ec-div">
                    {categoryBadge(l.page)}
                  </td>
                  <td className="hidden md:table-cell px-4 py-2.5 text-ec-t1 border-b border-ec-div">
                    {l.user || '\u2014'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {sorted.length > PER_PAGE && (
        <div className="flex justify-between items-center mt-4">
          <button
            className={`px-4 py-2 rounded-lg bg-ec-card border border-ec-border text-ec-t1 text-sm font-sans transition-colors ${
              safePage <= 1
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-ec-card-hover hover:border-ec-em/30 cursor-pointer'
            }`}
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>

          <span className="text-sm text-ec-t2">
            Page {safePage} of {totalPages}
          </span>

          <button
            className={`px-4 py-2 rounded-lg bg-ec-card border border-ec-border text-ec-t1 text-sm font-sans transition-colors ${
              safePage >= totalPages
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-ec-card-hover hover:border-ec-em/30 cursor-pointer'
            }`}
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
