import { useState, useEffect, useMemo, useRef } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import { usePharmacyConfig } from '../hooks/usePharmacyConfig'
import { generateId, formatDate } from '../utils/helpers'
import { downloadCsv } from '../utils/exportCsv'
import { logAudit } from '../utils/auditLog'
import { useUser } from '../contexts/UserContext'
import PageActions from '../components/PageActions'

const DAILY_ITEMS = [
  'RP notice displayed',
  'Controlled drugs checked',
  'Pharmacy opened correctly',
  'Pharmacy closed correctly',
  'Fridge temperature recorded',
]

const WEEKLY_ITEMS = [
  'Pharmacy record up to date',
  'RP absent period recorded (if applicable)',
  'Near-miss log reviewed',
  'Dispensing area clean and tidy',
  'CD balance checked',
]

const FORTNIGHTLY_ITEMS = [
  'Date checking completed',
  'Returned medicines destroyed log reviewed',
  'Staff training records reviewed',
  'SOPs reviewed for currency',
]

const ALL_ITEMS = [...DAILY_ITEMS, ...WEEKLY_ITEMS, ...FORTNIGHTLY_ITEMS]

export default function RPLog() {
  const { user } = useUser()
  const [logs, setLogs, loading] = useSupabase('rp_log', [])
  const [pharmacyConfig] = usePharmacyConfig()
  const defaultRp = pharmacyConfig.rpName || 'Amjid Shakoor'

  const today = new Date().toISOString().slice(0, 10)
  const [selectedDate, setSelectedDate] = useState(today)
  const [rpName, setRpName] = useState(defaultRp)
  const [checklist, setChecklist] = useState({})
  const [notes, setNotes] = useState('')
  const [editingId, setEditingId] = useState(null)
  const saveTimerRef = useRef(null)

  const existingEntry = useMemo(() => {
    return logs.find(l => l.date === selectedDate)
  }, [logs, selectedDate])

  useEffect(() => {
    if (existingEntry) {
      setRpName(existingEntry.rpName || defaultRp)
      setChecklist(existingEntry.checklist || {})
      setNotes(existingEntry.notes || '')
      setEditingId(existingEntry.id)
    }
  }, [existingEntry])

  // Sync default RP name when config loads (only if no existing entry)
  useEffect(() => {
    if (!existingEntry && defaultRp) setRpName(defaultRp)
  }, [defaultRp])

  useEffect(() => {
    if (!rpName) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      const data = { date: selectedDate, rpName, checklist, notes }
      if (editingId) {
        setLogs(logs.map(l => (l.id === editingId ? { ...l, ...data } : l)))
      } else {
        const id = generateId()
        setLogs([...logs, { id, ...data, createdAt: new Date().toISOString() }])
        setEditingId(id)
        logAudit('Created', `RP Log: ${selectedDate}`, 'RP Log', user?.name)
      }
    }, 500)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [checklist, notes, rpName, selectedDate])

  const loadEntry = (date) => {
    setSelectedDate(date)
    const entry = logs.find(l => l.date === date)
    if (entry) {
      setRpName(entry.rpName || '')
      setChecklist(entry.checklist || {})
      setNotes(entry.notes || '')
      setEditingId(entry.id)
    } else {
      setRpName(defaultRp)
      setChecklist({})
      setNotes('')
      setEditingId(null)
    }
  }

  const toggleItem = (item) => {
    setChecklist(prev => ({ ...prev, [item]: !prev[item] }))
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-ec-t3 text-sm">Loading…</div>
  }

  const checkedCount = (items) => items.filter(i => checklist[i]).length
  const totalChecked = ALL_ITEMS.filter(i => checklist[i]).length
  const pctComplete = ALL_ITEMS.length > 0 ? (totalChecked / ALL_ITEMS.length) * 100 : 0

  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date))

  const handleCsvDownload = () => {
    const headers = ['Date', 'RP Name', 'Completed', 'Total Items', 'Notes']
    const rows = sorted.map(l => {
      const c = l.checklist || {}
      const completed = ALL_ITEMS.filter(i => c[i]).length
      return [l.date, l.rpName, completed, ALL_ITEMS.length, l.notes || '']
    })
    downloadCsv('rp-log', headers, rows)
  }

  function getProgressColor() {
    if (totalChecked === ALL_ITEMS.length) return 'bg-ec-em'
    if (totalChecked > 0) return 'bg-ec-warn'
    return 'bg-ec-t5'
  }

  const renderChecklist = (title, items) => (
    <div className="mb-5">
      <h3 className="text-xs font-bold text-ec-t2 tracking-wide uppercase flex items-center justify-between mb-2">
        {title}
        <span className="text-xs text-ec-t3 font-normal normal-case tracking-normal">
          {checkedCount(items)}/{items.length}
        </span>
      </h3>
      <div className="space-y-1">
        {items.map(item => (
          <label
            key={item}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-ec-card ${checklist[item] ? 'bg-ec-card' : ''}`}
          >
            <input
              type="checkbox"
              checked={!!checklist[item]}
              onChange={() => toggleItem(item)}
              className="hidden"
            />
            <span
              className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                checklist[item]
                  ? 'border-ec-em bg-ec-em'
                  : 'border-ec-border'
              }`}
            >
              {checklist[item] && (
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" width="12" height="12">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </span>
            <span className={`text-sm ${checklist[item] ? 'line-through text-ec-t3' : 'text-ec-t1'}`}>
              {item}
            </span>
          </label>
        ))}
      </div>
    </div>
  )

  const todayHasEntry = !!existingEntry && existingEntry.date === today
  const todayLabel = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="space-y-6">
      {/* Sticky date banner */}
      {todayHasEntry ? (
        <div
          className="rounded-xl px-4 py-3 flex items-center justify-between flex-wrap gap-2 mb-4"
          style={{ backgroundColor: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.1)' }}
        >
          <span className="text-sm font-medium text-ec-t1">{todayLabel}</span>
          <span className="text-xs text-ec-em flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Completed
          </span>
        </div>
      ) : (
        <div
          className="rounded-xl px-4 py-3 flex items-center justify-between flex-wrap gap-2 mb-4"
          style={{ backgroundColor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}
        >
          <span className="text-sm font-medium text-ec-t1">{todayLabel}</span>
          <span className="text-xs text-ec-warn flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Today&apos;s RP log not yet completed
          </span>
        </div>
      )}

      <div>
        <p className="text-sm text-ec-t3 mb-2">
          Daily Responsible Pharmacist checklist — GPhC compliance requirement.
          Record RP duties and checks for each day.
        </p>
        <div className="flex items-center gap-2 mb-4">
          <PageActions onDownloadCsv={handleCsvDownload} />
        </div>
      </div>

      {/* Form Section */}
      <div
        className="rounded-2xl p-5"
        style={{ backgroundColor: 'var(--ec-card)', border: '1px solid var(--ec-border)' }}
      >
        <div className="flex gap-4 flex-wrap mb-4">
          <div>
            <label className="text-xs font-semibold text-ec-t2 mb-1 block">Date</label>
            <input
              type="date"
              className="bg-ec-card border border-ec-border rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors font-sans"
              value={selectedDate}
              onChange={(e) => loadEntry(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-semibold text-ec-t2 mb-1 block">Responsible Pharmacist</label>
            <input
              type="text"
              className="w-full bg-ec-card border border-ec-border rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors font-sans cursor-default"
              value={rpName}
              readOnly
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-ec-t2">
            Completion: {totalChecked}/{ALL_ITEMS.length}
          </span>
          <div className="flex-1 h-1.5 rounded-full bg-ec-border overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${pctComplete}%` }}
            />
          </div>
        </div>

        {renderChecklist('Daily Checks', DAILY_ITEMS)}
        {renderChecklist('Weekly Checks', WEEKLY_ITEMS)}
        {renderChecklist('Fortnightly Checks', FORTNIGHTLY_ITEMS)}

        <div className="mt-4">
          <label className="text-xs font-semibold text-ec-t2 mb-1 block">Notes</label>
          <textarea
            className="w-full bg-ec-card border border-ec-border rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors font-sans resize-none"
            placeholder="Any issues, observations, or actions taken..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      {/* History Table */}
      <div>
        <h2 className="text-sm font-bold text-ec-t1 mb-3">Recent Checklists</h2>
        {sorted.length === 0 ? (
          <div className="text-center py-8 text-ec-t3 text-sm">
            No RP checklists recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--ec-border)' }}>
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
              <thead className="text-left">
                <tr>
                  <th className="text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">Date</th>
                  <th className="text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">RP Name</th>
                  <th className="text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">Completion</th>
                  <th className="text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border hidden md:table-cell">Notes</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(log => {
                  const c = log.checklist || {}
                  const completed = ALL_ITEMS.filter(i => c[i]).length
                  const pct = Math.round((completed / ALL_ITEMS.length) * 100)
                  return (
                    <tr
                      key={log.id}
                      className="cursor-pointer hover:bg-ec-card transition-colors"
                      onClick={() => loadEntry(log.date)}
                    >
                      <td className="px-4 py-2.5 text-ec-t1 border-b border-ec-div font-medium">{formatDate(log.date)}</td>
                      <td className="px-4 py-2.5 text-ec-t1 border-b border-ec-div">{log.rpName}</td>
                      <td className="px-4 py-2.5 text-ec-t1 border-b border-ec-div">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          pct === 100
                            ? 'bg-ec-em/10 text-ec-em'
                            : 'bg-ec-warn/10 text-ec-warn'
                        }`}>
                          {completed}/{ALL_ITEMS.length}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-ec-t1 border-b border-ec-div hidden md:table-cell">{log.notes || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
