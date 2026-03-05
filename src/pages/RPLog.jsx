import { useState, useEffect, useMemo, useRef } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import { usePharmacyConfig } from '../hooks/usePharmacyConfig'
import { generateId, formatDate } from '../utils/helpers'
import { downloadCsv } from '../utils/exportCsv'
import { logAudit } from '../utils/auditLog'
import { useUser } from '../contexts/UserContext'
import SkeletonLoader from '../components/SkeletonLoader'
import DashCardHeader from '../components/DashCardHeader'

// ── Font injection ──
if (!document.getElementById('rp-fonts')) {
  const fl = document.createElement('link')
  fl.id = 'rp-fonts'
  fl.rel = 'stylesheet'
  fl.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap'
  document.head.appendChild(fl)
}

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
const sans = { fontFamily: "'DM Sans', sans-serif" }
const mono = { fontFamily: "'DM Mono', monospace" }
const card = {
  background: 'var(--bg-card)',
  borderRadius: 12,
  padding: '14px 16px',
  border: '1px solid var(--border-card)',
  boxShadow: 'var(--shadow-card)',
  marginBottom: 12,
}
const inputStyle = {
  ...sans,
  width: '100%',
  background: 'var(--input-bg)',
  border: '1px solid var(--input-border)',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 12,
  color: 'var(--text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
}

const SvgCheck = ({ size = 10, color = 'white' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8.5l3.5 3.5 6.5-7"/></svg>
)

const SvgCsv = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)

const SvgPrint = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
    <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
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
  }

  const handleSignOut = () => {
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

  const pctColor = pctComplete < 50 ? '#ef4444' : pctComplete < 80 ? '#f59e0b' : '#059669'

  // Status pill
  const statusPill = totalChecked === ALL_ITEMS.length
    ? { label: '\u2713 Completed', bg: '#f0fdf4', color: '#059669', border: '#6ee7b7' }
    : totalChecked > 0
    ? { label: 'In Progress', bg: '#fffbeb', color: '#d97706', border: '#fde68a' }
    : { label: 'Not Started', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' }

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

  const actionBtn = {
    ...sans,
    display: 'inline-flex', alignItems: 'center', gap: 5,
    border: '1px solid var(--border-card)',
    background: 'var(--bg-card)',
    color: 'var(--text-secondary)',
    borderRadius: 8, padding: '6px 14px', fontSize: 12,
    cursor: 'pointer', fontWeight: 500,
  }

  // ── Checklist section renderer ──
  const renderChecklistCard = (title, items, gradient, icon) => {
    const done = checkedCount(items)
    return (
      <div style={card}>
        <DashCardHeader
          gradient={gradient}
          icon={icon}
          title={title}
          right={<span style={{ ...mono, fontSize: 12, fontWeight: 600 }}>{done}/{items.length}</span>}
        />
        <div>
          {items.map(item => {
            const checked = !!checklist[item]
            return (
              <div
                key={item}
                onClick={() => toggleItem(item)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 8, marginBottom: 4,
                  cursor: 'pointer', transition: 'background 0.12s',
                  background: checked ? 'var(--task-done-bg)' : 'var(--bg-card)',
                  border: `1px solid ${checked ? 'var(--task-done-border)' : 'var(--border-card)'}`,
                }}
              >
                <div style={{
                  width: 17, height: 17, borderRadius: 5, flexShrink: 0,
                  border: checked ? 'none' : '2px solid #d1d5db',
                  background: checked ? '#059669' : 'var(--bg-card)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {checked && <span style={{ fontSize: 10, fontWeight: 700, color: 'white', lineHeight: 1 }}>{'\u2713'}</span>}
                </div>
                <span style={{
                  ...sans, fontSize: 12, fontWeight: 500,
                  color: checked ? '#6ee7b7' : 'var(--text-primary)',
                  textDecoration: checked ? 'line-through' : 'none',
                }}>{item}</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div style={{ ...sans }}>
      {/* ── Page Header ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Dashboard / RP Log</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>RP Log</h1>
          <span style={{ ...mono, fontSize: 13, color: 'var(--text-muted)' }}>{todayFormatted}</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 10px' }}>
          Daily Responsible Pharmacist checklist — GPhC compliance requirement.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            ...sans, display: 'inline-block', fontSize: 11, fontWeight: 600,
            padding: '3px 10px', borderRadius: 20,
            background: statusPill.bg, color: statusPill.color,
            border: `1px solid ${statusPill.border}`,
          }}>{statusPill.label}</span>
          <div style={{ flex: 1 }} />
          <button style={actionBtn} onClick={handleCsvDownload}><SvgCsv /> CSV</button>
          <button style={actionBtn} onClick={() => window.print()}><SvgPrint /> Print</button>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

        {/* ── Left column ── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* RP Details Card */}
          <div style={card}>
            <DashCardHeader gradient="linear-gradient(90deg, #064e3b, #059669)" icon={'\u2695'} title="Today's RP" />
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ ...sans, display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => loadEntry(e.target.value)}
                  style={{ ...inputStyle, ...mono }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ ...sans, display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Responsible Pharmacist</label>
                <input
                  type="text"
                  value={rpName}
                  readOnly
                  style={{ ...inputStyle, cursor: 'default' }}
                />
              </div>
            </div>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic', margin: '0 0 14px' }}>
              RP is auto-assigned based on rotation schedule
            </p>

            {/* Completion bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ ...sans, fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Completion: {totalChecked}/{ALL_ITEMS.length}
                </span>
                <span style={{ ...mono, fontSize: 12, fontWeight: 700, color: pctColor }}>
                  {pctComplete}%
                </span>
              </div>
              <div style={{ height: 8, borderRadius: 99, background: 'var(--border-card)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 99,
                  background: pctColor,
                  width: `${pctComplete}%`,
                  transition: 'width 0.4s',
                }} />
              </div>
            </div>
          </div>

          {/* Checklist sections */}
          {renderChecklistCard('Daily Checks', DAILY_ITEMS, 'linear-gradient(90deg, #064e3b, #059669)', '\uD83D\uDCCB')}
          {renderChecklistCard('Weekly Checks', WEEKLY_ITEMS, 'linear-gradient(90deg, #0f766e, #14b8a6)', '\uD83D\uDCC5')}
          {renderChecklistCard('Fortnightly Checks', FORTNIGHTLY_ITEMS, 'linear-gradient(90deg, #1e40af, #3b82f6)', '\uD83D\uDDD3')}

          {/* Notes Card */}
          <div style={card}>
            <DashCardHeader gradient="linear-gradient(90deg, #475569, #64748b)" icon={'\uD83D\uDCDD'} title="Notes" />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any issues, observations, or actions taken\u2026"
              style={{
                ...inputStyle,
                minHeight: 80,
                resize: 'vertical',
              }}
            />
          </div>
        </div>

        {/* ── Right column ── */}
        <div style={{ width: 280, flexShrink: 0 }}>

          {/* RP Presence Card */}
          <div style={card}>
            <DashCardHeader gradient="linear-gradient(90deg, #064e3b, #059669)" icon={'\uD83D\uDD50'} title="RP Presence" />

            {rpSign?.signedIn ? (
              <div>
                {/* Signed in state */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#059669', boxShadow: '0 0 0 3px #a7f3d0',
                    animation: 'ecPulse 2s ease-in-out infinite',
                  }} />
                  <span style={{ ...sans, fontSize: 13, fontWeight: 500, color: '#166534' }}>
                    Signed in — {rpSign.rpName || rpName}
                  </span>
                </div>
                <div style={{ ...mono, fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Signed in at {rpSign.time}
                </div>
                <div style={{ ...sans, fontSize: 12, fontWeight: 600, color: '#059669', marginBottom: 10 }}>
                  On duty: {elapsed}
                </div>

                {/* 90-minute warning */}
                {elapsedMin > 90 && (
                  <div style={{
                    background: '#fffbeb', border: '1px solid #fde68a',
                    borderRadius: 8, padding: '8px 10px', marginBottom: 10,
                    fontSize: 11, color: '#92400e', lineHeight: 1.4,
                  }}>
                    {'\u26A0'} RP has been on duty for over 90 minutes — log any absence periods
                  </div>
                )}

                <button
                  onClick={handleSignOut}
                  style={{
                    ...sans, width: '100%', padding: 8,
                    background: '#dc2626', color: 'white',
                    borderRadius: 8, border: 'none', fontSize: 13,
                    fontWeight: 700, cursor: 'pointer',
                  }}
                >Sign Out</button>
              </div>
            ) : (
              <div>
                {/* Signed out state */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#ef4444', boxShadow: '0 0 0 3px #fee2e2',
                    animation: 'ecPulse 2s ease-in-out infinite',
                  }} />
                  <span style={{ ...sans, fontSize: 13, fontWeight: 500, color: '#991b1b' }}>
                    No RP signed in
                  </span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 10 }}>
                  Last: {rpName || defaultRp}
                </div>
                <button
                  onClick={handleSignIn}
                  style={{
                    ...sans, width: '100%', padding: 8,
                    background: '#059669', color: 'white',
                    borderRadius: 8, border: 'none', fontSize: 13,
                    fontWeight: 700, cursor: 'pointer',
                  }}
                >Sign In as RP {'\u2192'}</button>
              </div>
            )}
          </div>

          {/* Recent Checklists Card */}
          <div style={card}>
            <DashCardHeader gradient="linear-gradient(90deg, #475569, #64748b)" icon={'\uD83D\uDDC2'} title="Recent Checklists" />
            {recentLogs.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>
                No previous checklists found.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Date', 'RP', 'Done', 'Notes'].map(h => (
                        <th key={h} style={{
                          ...sans, fontSize: 9, fontWeight: 600, color: 'var(--text-muted)',
                          textAlign: 'left', padding: '4px 6px',
                          borderBottom: '1px solid var(--border-card)',
                          textTransform: 'uppercase', letterSpacing: 0.5,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentLogs.map(log => {
                      const c = log.checklist || {}
                      const completed = ALL_ITEMS.filter(i => c[i]).length
                      const pct = Math.round((completed / ALL_ITEMS.length) * 100)
                      const isToday = log.date === today
                      const pillColor = pct === 100 ? { bg: '#f0fdf4', color: '#059669', border: '#6ee7b7' }
                        : pct > 0 ? { bg: '#fffbeb', color: '#d97706', border: '#fde68a' }
                        : { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' }

                      return (
                        <tr
                          key={log.id}
                          onClick={() => loadEntry(log.date)}
                          style={{
                            cursor: 'pointer',
                            background: isToday ? 'var(--task-done-bg)' : 'transparent',
                            fontWeight: isToday ? 600 : 400,
                          }}
                        >
                          <td style={{ ...mono, fontSize: 11, padding: '6px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-card)' }}>
                            {formatDate(log.date)}
                          </td>
                          <td style={{ ...sans, fontSize: 11, padding: '6px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-card)', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {(log.rpName || '').split(' ')[0]}
                          </td>
                          <td style={{ padding: '6px', borderBottom: '1px solid var(--border-card)' }}>
                            <span style={{
                              ...mono, display: 'inline-block', fontSize: 10, fontWeight: 600,
                              padding: '1px 6px', borderRadius: 20,
                              background: pillColor.bg, color: pillColor.color,
                              border: `1px solid ${pillColor.border}`,
                            }}>{completed}/{ALL_ITEMS.length}</span>
                          </td>
                          <td style={{
                            ...sans, fontSize: 10, padding: '6px',
                            color: 'var(--text-muted)',
                            borderBottom: '1px solid var(--border-card)',
                            maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
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

      {/* ── Responsive: stack columns on mobile ── */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="width: 280px"] {
            width: 100% !important;
          }
          div[style*="display: flex"][style*="gap: 16px"][style*="align-items: flex-start"] {
            flex-direction: column !important;
          }
        }
      `}</style>
    </div>
  )
}
