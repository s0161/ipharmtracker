import { useState, useEffect, useMemo, useRef } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import { usePharmacyConfig } from '../hooks/usePharmacyConfig'
import { generateId, formatDate } from '../utils/helpers'
import { downloadCsv } from '../utils/exportCsv'
import { logAudit } from '../utils/auditLog'
import { useUser } from '../contexts/UserContext'
import SkeletonLoader from '../components/SkeletonLoader'

// Inter font loaded via index.html

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

// ── Shared styles ──
const sans = { fontFamily: "'Inter', sans-serif" }
const mono = { fontFamily: "'DM Mono', monospace" }

const SvgCheck = ({ size = 10, color = 'white' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8.5l3.5 3.5 6.5-7" /></svg>
)

const SvgCsv = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const SvgPrint = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
    <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
  </svg>
)

// ── RP Sign-in localStorage helpers ──
const RP_SIGN_KEY = 'ipd_rp_sign'

function getRpSign() {
  try {
    const raw = localStorage.getItem(RP_SIGN_KEY)
    if (!raw) return null
    const d = JSON.parse(raw)
    if (d.date !== new Date().toISOString().slice(0, 10)) return null
    return d
  } catch { return null }
}

function setRpSign(data) {
  localStorage.setItem(RP_SIGN_KEY, JSON.stringify({ ...data, date: new Date().toISOString().slice(0, 10) }))
}

function clearRpSign() {
  localStorage.removeItem(RP_SIGN_KEY)
}

// ── Section config ──
const SECTIONS = [
  { key: 'daily', title: 'Daily Checks', items: DAILY_ITEMS, accent: 'var(--ec-em)', icon: '\uD83D\uDCCB' },
  { key: 'weekly', title: 'Weekly Checks', items: WEEKLY_ITEMS, accent: 'var(--ec-cat-teal)', icon: '\uD83D\uDCC5' },
  { key: 'fortnightly', title: 'Fortnightly Checks', items: FORTNIGHTLY_ITEMS, accent: 'var(--ec-info)', icon: '\uD83D\uDDD3' },
]

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

  // RP Presence state
  const [rpSign, setRpSignState] = useState(() => getRpSign())
  const [elapsed, setElapsed] = useState('')
  const [elapsedMin, setElapsedMin] = useState(0)

  const existingEntry = useMemo(() => {
    return logs.find(l => l.date === selectedDate)
  }, [logs, selectedDate])

  useEffect(() => {
    if (existingEntry) {
      setRpName(existingEntry.rpName || defaultRp)
      setChecklist(existingEntry.checklist || {})
      setNotes(existingEntry.notes || '')
      setEditingId(existingEntry.id)
      if (!rpSign && existingEntry.signInTime && !existingEntry.signOutTime && existingEntry.date === today) {
        const signDate = new Date(existingEntry.signInTime)
        const time = signDate.toTimeString().slice(0, 5)
        const data = { signedIn: true, time, rpName: existingEntry.rpName || defaultRp }
        setRpSign(data)
        setRpSignState(data)
      }
    }
  }, [existingEntry])

  useEffect(() => {
    if (!existingEntry && defaultRp) setRpName(defaultRp)
  }, [defaultRp])

  // Autosave
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

  // Elapsed timer
  useEffect(() => {
    if (!rpSign?.signedIn || !rpSign?.time) { setElapsed(''); setElapsedMin(0); return }
    const calc = () => {
      const [h, m] = rpSign.time.split(':').map(Number)
      const start = new Date()
      start.setHours(h, m, 0, 0)
      const d = Math.max(0, Date.now() - start.getTime())
      const mins = Math.floor(d / 60000)
      setElapsedMin(mins)
      setElapsed(`${Math.floor(mins / 60)}h ${mins % 60}m`)
    }
    calc()
    const id = setInterval(calc, 60000)
    return () => clearInterval(id)
  }, [rpSign?.signedIn, rpSign?.time])

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

  const handleSignIn = () => {
    const now = new Date()
    const time = now.toTimeString().slice(0, 5)
    const data = { signedIn: true, time, rpName: rpName || defaultRp }
    setRpSign(data)
    setRpSignState(data)
    const signInTime = now.toISOString()
    if (editingId) {
      setLogs(logs.map(l => (l.id === editingId ? { ...l, signInTime } : l)))
    } else {
      const id = generateId()
      setLogs([...logs, { id, date: today, rpName: rpName || defaultRp, checklist: {}, notes: '', signInTime, createdAt: now.toISOString() }])
      setEditingId(id)
    }
    logAudit('RP Sign In', `RP signed in at ${time}`, 'RP Log', user?.name)
  }

  const handleSignOut = () => {
    const now = new Date()
    const signOutTime = now.toISOString()
    if (editingId) {
      setLogs(logs.map(l => (l.id === editingId ? { ...l, signOutTime } : l)))
    }
    logAudit('RP Sign Out', `RP signed out at ${now.toTimeString().slice(0, 5)}`, 'RP Log', user?.name)
    clearRpSign()
    setRpSignState(null)
  }

  if (loading) {
    return <SkeletonLoader variant="list" />
  }

  const checkedCount = (items) => items.filter(i => checklist[i]).length
  const totalChecked = ALL_ITEMS.filter(i => checklist[i]).length
  const pctComplete = ALL_ITEMS.length > 0 ? Math.round((totalChecked / ALL_ITEMS.length) * 100) : 0

  const sorted = [...logs].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  const recentLogs = sorted.slice(0, 7)

  const pctColor = pctComplete < 50 ? 'var(--ec-crit)' : pctComplete < 80 ? 'var(--ec-warn)' : 'var(--ec-em)'

  const statusPill = totalChecked === ALL_ITEMS.length
    ? { label: '\u2713 Completed', bg: 'var(--ec-em-bg)', color: 'var(--ec-em)', border: 'var(--ec-em-border)' }
    : totalChecked > 0
    ? { label: 'In Progress', bg: 'var(--ec-warn-bg)', color: 'var(--ec-warn)', border: 'var(--ec-warn-border)' }
    : { label: 'Not Started', bg: 'var(--ec-crit-bg)', color: 'var(--ec-crit)', border: 'var(--ec-crit-border)' }

  const handleCsvDownload = () => {
    const headers = ['Date', 'RP Name', 'Completed', 'Total Items', 'Notes']
    const rows = sorted.map(l => {
      const c = l.checklist || {}
      const completed = ALL_ITEMS.filter(i => c[i]).length
      return [l.date, l.rpName, completed, ALL_ITEMS.length, l.notes || '']
    })
    downloadCsv('rp-log', headers, rows)
  }

  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div style={sans} className="rp-log-page">
      {/* ── Page Header ── */}
      <div className="page-header-panel mb-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 3px rgba(10,37,64,0.06)' }}>
        <div className="text-xs text-ec-t3 mb-2">Dashboard / RP Log</div>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 4, height: 32, borderRadius: 4, background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)', flexShrink: 0 }} />
            <h1 className="text-xl font-bold m-0" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>RP Log</h1>
          </div>
          <span style={mono} className="text-[13px] text-ec-t3">{todayFormatted}</span>
        </div>
        <p className="text-xs text-ec-t3 m-0 mb-3">
          Daily Responsible Pharmacist checklist — GPhC compliance requirement.
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{ background: statusPill.bg, color: statusPill.color, border: `1px solid ${statusPill.border}` }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusPill.color }} />
            {statusPill.label}
          </span>
          <div className="flex-1" />
          <button
            onClick={handleCsvDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer bg-ec-card text-ec-t2 border-ec-div hover:border-ec-em transition-colors"
            style={sans}
          >
            <SvgCsv /> CSV
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer bg-ec-card text-ec-t2 border-ec-div hover:border-ec-em transition-colors"
            style={sans}
          >
            <SvgPrint /> Print
          </button>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="flex gap-5 items-start rp-columns">

        {/* ── Left column ── */}
        <div className="flex-1 min-w-0">

          {/* RP Details Card */}
          <div className="rounded-xl p-4 mb-6" style={{ background: 'var(--ec-em-bg)', border: '1px solid var(--ec-em-border)' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">⚕</span>
              <span className="text-[13px] font-bold text-ec-t1 tracking-wide">Today's RP</span>
            </div>
            <div className="flex gap-3 mb-3">
              <div className="flex-1">
                <label className="block text-[10px] font-semibold text-ec-t2 mb-1 uppercase tracking-wider">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => loadEntry(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-xs outline-none transition-all"
                  style={{ ...mono, background: 'var(--ec-card)', border: '1px solid var(--ec-em-border)', color: 'var(--ec-t1)' }}
                />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-semibold text-ec-t2 mb-1 uppercase tracking-wider">Responsible Pharmacist</label>
                <div
                  className="w-full rounded-lg px-3 py-2 text-xs"
                  style={{ ...sans, background: 'var(--ec-card)', border: '1px solid var(--ec-em-border)', color: 'var(--ec-t1)', minHeight: 34, display: 'flex', alignItems: 'center' }}
                >
                  {rpName}
                </div>
              </div>
            </div>
            <p className="text-[10px] text-ec-t3 italic m-0 mb-3">
              RP is auto-assigned based on rotation schedule
            </p>

            {/* Completion bar */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-semibold text-ec-t1" style={sans}>
                  Completion: {totalChecked}/{ALL_ITEMS.length}
                </span>
                <span className="text-xs font-bold" style={{ ...mono, color: pctColor }}>
                  {pctComplete}%
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--ec-border)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{ background: pctColor, width: `${pctComplete}%` }}
                />
              </div>
            </div>
          </div>

          {/* Checklist sections */}
          {SECTIONS.map(section => {
            const done = checkedCount(section.items)
            const allDone = done === section.items.length
            return (
              <div key={section.key} className="mb-6">
                {/* Section header — soft left-border accent */}
                <div className="flex items-center gap-2.5 mb-3 pl-3" style={{ borderLeft: `3px solid ${section.accent}` }}>
                  <span className="text-sm">{section.icon}</span>
                  <span className="text-[13px] font-semibold text-ec-t1 tracking-[0.06em] uppercase flex-1" style={sans}>
                    {section.title}
                  </span>
                  <span
                    className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                    style={{
                      ...mono,
                      background: allDone ? 'var(--ec-em-bg)' : 'var(--ec-t5)',
                      color: allDone ? 'var(--ec-em)' : 'var(--ec-t2)',
                      border: `1px solid ${allDone ? 'var(--ec-em-border)' : 'var(--ec-border)'}`,
                    }}
                  >
                    {done}/{section.items.length}
                  </span>
                </div>

                {/* Checklist items */}
                <div className="flex flex-col gap-1.5">
                  {section.items.map(item => {
                    const checked = !!checklist[item]
                    return (
                      <div
                        key={item}
                        onClick={() => toggleItem(item)}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-lg cursor-pointer transition-all duration-150 rp-check-row"
                        style={{
                          background: checked ? 'var(--ec-em-bg)' : 'var(--ec-card)',
                          border: `1px solid ${checked ? 'var(--ec-em-border)' : 'var(--ec-div)'}`,
                        }}
                      >
                        {/* Circular checkbox */}
                        <div
                          className="w-[18px] h-[18px] rounded-full shrink-0 flex items-center justify-center transition-all duration-200"
                          style={{
                            border: checked ? 'none' : '2px solid var(--ec-t4)',
                            background: checked ? 'var(--ec-em)' : 'transparent',
                            transitionTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)',
                            transform: checked ? 'scale(1)' : 'scale(1)',
                          }}
                        >
                          {checked && <SvgCheck size={10} />}
                        </div>
                        <span
                          className="text-[14px] font-normal transition-all duration-200"
                          style={{
                            ...sans,
                            color: checked ? 'var(--ec-em-border)' : 'var(--ec-t1)',
                            textDecoration: checked ? 'line-through' : 'none',
                          }}
                        >
                          {item}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Notes Card */}
          <div className="mb-6">
            <div className="flex items-center gap-2.5 mb-3 pl-3" style={{ borderLeft: '3px solid var(--ec-t2)' }}>
              <span className="text-sm">{'\uD83D\uDCDD'}</span>
              <span className="text-[13px] font-semibold text-ec-t1 tracking-[0.06em] uppercase" style={sans}>Notes</span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any issues, observations, or actions taken\u2026"
              className="w-full rounded-lg px-4 py-3 text-sm outline-none resize-y transition-all duration-150"
              style={{
                ...sans,
                minHeight: 80,
                background: 'var(--ec-card)',
                border: '1px solid var(--ec-div)',
                color: 'var(--ec-t1)',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="w-[280px] shrink-0 rp-sidebar">

          {/* RP Presence Card */}
          <div className="rounded-xl border overflow-hidden mb-5" style={{ borderColor: 'var(--ec-div)', background: 'var(--ec-card)' }}>
            <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--ec-div)' }}>
              <span className="text-sm">{'\uD83D\uDD50'}</span>
              <span className="text-[13px] font-bold text-ec-t1">RP Presence</span>
            </div>
            <div className="px-4 py-4">
              {rpSign?.signedIn ? (
                <div>
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--ec-em)', boxShadow: '0 0 0 3px var(--ec-em-border)', animation: 'ecPulse 2s ease-in-out infinite' }} />
                    <span className="text-[13px] font-medium" style={{ ...sans, color: 'var(--ec-em-dark)' }}>
                      Signed in — {rpSign.rpName || rpName}
                    </span>
                  </div>
                  <div className="text-[10px] text-ec-t3 mb-1.5" style={mono}>
                    Signed in at {rpSign.time}
                  </div>
                  <div className="text-xs font-semibold mb-3" style={{ ...sans, color: 'var(--ec-em)' }}>
                    On duty: {elapsed}
                  </div>

                  {elapsedMin > 90 && (
                    <div className="rounded-lg px-3 py-2 mb-3 text-[11px] leading-relaxed" style={{ background: 'var(--ec-warn-bg)', border: '1px solid var(--ec-warn-border)', color: 'var(--ec-warn-dark)' }}>
                      {'\u26A0'} RP has been on duty for over 90 minutes — log any absence periods
                    </div>
                  )}

                  <button
                    onClick={handleSignOut}
                    className="w-full py-2.5 rounded-lg border-none text-[13px] font-bold cursor-pointer transition-colors"
                    style={{ ...sans, background: 'var(--ec-crit)', color: 'white' }}
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--ec-crit)', boxShadow: '0 0 0 3px var(--ec-crit-bg)', animation: 'ecPulse 2s ease-in-out infinite' }} />
                    <span className="text-[13px] font-medium" style={{ ...sans, color: 'var(--ec-crit-dark)' }}>
                      No RP signed in
                    </span>
                  </div>
                  <div className="text-[10px] text-ec-t3 mb-3">
                    Last: {rpName || defaultRp}
                  </div>
                  <button
                    onClick={handleSignIn}
                    className="w-full py-2.5 rounded-lg border-none text-[13px] font-bold cursor-pointer flex items-center justify-center gap-2 transition-colors hover:opacity-90"
                    style={{ ...sans, background: 'var(--ec-em)', color: 'white' }}
                  >
                    Sign In as RP <span className="text-base">{'\u2192'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recent Checklists Card */}
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--ec-div)', background: 'var(--ec-card)' }}>
            <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--ec-div)' }}>
              <span className="text-sm">{'\uD83D\uDDC2'}</span>
              <span className="text-[13px] font-bold text-ec-t1">Recent Checklists</span>
            </div>
            <div className="px-4 py-3">
              {recentLogs.length === 0 ? (
                <p className="text-xs text-ec-t3 italic text-center py-4">
                  No previous checklists found.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Date', 'RP', 'Done', 'Notes'].map(h => (
                          <th key={h} className="text-left text-[9px] font-semibold text-ec-t3 uppercase tracking-wider px-1.5 py-1.5" style={{ borderBottom: '1px solid var(--ec-div)' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentLogs.map((log, i) => {
                        const c = log.checklist || {}
                        const completed = ALL_ITEMS.filter(item => c[item]).length
                        const pct = Math.round((completed / ALL_ITEMS.length) * 100)
                        const isToday = log.date === today
                        const pillColor = pct === 100
                          ? { bg: 'var(--ec-em-bg)', color: 'var(--ec-em)', border: 'var(--ec-em-border)' }
                          : pct > 0
                          ? { bg: 'var(--ec-warn-bg)', color: 'var(--ec-warn)', border: 'var(--ec-warn-border)' }
                          : { bg: 'var(--ec-crit-bg)', color: 'var(--ec-crit)', border: 'var(--ec-crit-border)' }

                        return (
                          <tr
                            key={log.id}
                            onClick={() => loadEntry(log.date)}
                            className="cursor-pointer transition-colors hover:bg-ec-card"
                            style={{
                              background: i % 2 === 1 ? 'var(--ec-card-hover)' : 'transparent',
                              fontWeight: isToday ? 600 : 400,
                            }}
                          >
                            <td className="py-2 px-1.5 text-[11px] text-ec-t1" style={{ ...mono, borderBottom: '1px solid var(--ec-em-bg)' }}>
                              {formatDate(log.date)}
                            </td>
                            <td className="py-2 px-1.5 text-[11px] text-ec-t2 max-w-[60px] overflow-hidden text-ellipsis whitespace-nowrap" style={{ ...sans, borderBottom: '1px solid var(--ec-em-bg)' }}>
                              {(log.rpName || '').split(' ')[0]}
                            </td>
                            <td className="py-2 px-1.5" style={{ borderBottom: '1px solid var(--ec-em-bg)' }}>
                              <span
                                className="inline-block text-[10px] font-semibold px-1.5 py-px rounded-full"
                                style={{ ...mono, background: pillColor.bg, color: pillColor.color, border: `1px solid ${pillColor.border}` }}
                              >
                                {completed}/{ALL_ITEMS.length}
                              </span>
                            </td>
                            <td className="py-2 px-1.5 text-[10px] text-ec-t3 max-w-[80px] overflow-hidden text-ellipsis whitespace-nowrap" style={{ ...sans, borderBottom: '1px solid var(--ec-em-bg)' }}>
                              {(log.notes || '').slice(0, 30) || '\u2014'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Responsive ── */}
      <style>{`
        .rp-check-row:hover {
          border-color: var(--ec-em) !important;
          box-shadow: 0 1px 4px var(--ec-em-faint);
        }
        @media (max-width: 768px) {
          .rp-columns {
            flex-direction: column !important;
          }
          .rp-sidebar {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  )
}
