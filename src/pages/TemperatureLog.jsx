/*
  Supabase table needed:

  CREATE TABLE fridge_temperature_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    temp_min NUMERIC,
    temp_max NUMERIC,
    temp_current NUMERIC,
    logged_by TEXT,
    excursion BOOLEAN DEFAULT false,
    excursion_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ALTER TABLE fridge_temperature_logs ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "anon full access" ON fridge_temperature_logs FOR ALL USING (true) WITH CHECK (true);
*/

import { useState, useEffect, useMemo } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import { logAudit } from '../utils/auditLog'
import { useUser } from '../contexts/UserContext'
import { generateId, formatDate } from '../utils/helpers'
import { getStaffInitials } from '../utils/rotationManager'
import { useToast } from '../components/Toast'
import { downloadCsv } from '../utils/exportCsv'
import SkeletonLoader from '../components/SkeletonLoader'
import DashCardHeader from '../components/DashCardHeader'
import Avatar from '../components/Avatar'

// ── Font injection ──
if (!document.getElementById('temp-fonts')) {
  const fl = document.createElement('link')
  fl.id = 'temp-fonts'
  fl.rel = 'stylesheet'
  fl.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap'
  document.head.appendChild(fl)
}

const RANGE_MIN = 2
const RANGE_MAX = 8
const inRange = (v) => { const n = parseFloat(v); return !isNaN(n) && n >= RANGE_MIN && n <= RANGE_MAX }

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

// ── Mini SVG chart (no recharts dependency) ──
function TempChart({ data, days }) {
  if (!data || data.length < 2) {
    return <p style={{ ...sans, fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>Not enough data to display chart yet.</p>
  }

  const W = 520, H = 200, PAD = { t: 16, r: 16, b: 32, l: 36 }
  const pW = W - PAD.l - PAD.r
  const pH = H - PAD.t - PAD.b
  const yMin = 0, yMax = 12
  const toX = (i) => PAD.l + (i / (data.length - 1)) * pW
  const toY = (v) => PAD.t + pH - ((v - yMin) / (yMax - yMin)) * pH

  const makeLine = (key) => data.map((d, i) => `${toX(i)},${toY(d[key] ?? 0)}`).join(' ')

  // Safe zone band
  const safeTop = toY(RANGE_MAX)
  const safeBot = toY(RANGE_MIN)

  // Date labels — show ~5 evenly spaced
  const step = Math.max(1, Math.floor(data.length / 5))
  const dateLabels = data.filter((_, i) => i % step === 0 || i === data.length - 1)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 200, display: 'block' }}>
      {/* Safe zone */}
      <rect x={PAD.l} y={safeTop} width={pW} height={safeBot - safeTop} fill="#f0fdf4" opacity="0.4" />
      {/* Reference lines */}
      <line x1={PAD.l} y1={toY(RANGE_MIN)} x2={W - PAD.r} y2={toY(RANGE_MIN)} stroke="#d1fae5" strokeDasharray="3 3" strokeWidth="1" />
      <line x1={PAD.l} y1={toY(RANGE_MAX)} x2={W - PAD.r} y2={toY(RANGE_MAX)} stroke="#d1fae5" strokeDasharray="3 3" strokeWidth="1" />
      <text x={PAD.l - 4} y={toY(RANGE_MIN) + 3} textAnchor="end" fill="#94a3b8" fontSize="9" style={mono}>2°C</text>
      <text x={PAD.l - 4} y={toY(RANGE_MAX) + 3} textAnchor="end" fill="#94a3b8" fontSize="9" style={mono}>8°C</text>

      {/* Y axis grid */}
      {[0, 2, 4, 6, 8, 10, 12].map(v => (
        <g key={v}>
          {v !== RANGE_MIN && v !== RANGE_MAX && (
            <line x1={PAD.l} y1={toY(v)} x2={W - PAD.r} y2={toY(v)} stroke="#e2e8f0" strokeWidth="0.5" />
          )}
          <text x={PAD.l - 4} y={toY(v) + 3} textAnchor="end" fill="#cbd5e1" fontSize="8" style={mono}>{v}</text>
        </g>
      ))}

      {/* Lines */}
      <polyline points={makeLine('min')} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={makeLine('max')} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={makeLine('current')} fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 2" />

      {/* Dots */}
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={toX(i)} cy={toY(d.min)} r="2.5" fill="#3b82f6" />
          <circle cx={toX(i)} cy={toY(d.max)} r="2.5" fill="#ef4444" />
          <circle cx={toX(i)} cy={toY(d.current)} r="2.5" fill="#059669" />
        </g>
      ))}

      {/* Date labels */}
      {dateLabels.map((d) => {
        const idx = data.indexOf(d)
        return (
          <text key={d.date} x={toX(idx)} y={H - 6} textAnchor="middle" fill="#94a3b8" fontSize="9" style={mono}>
            {d.date.slice(5)}
          </text>
        )
      })}
    </svg>
  )
}

// ── Legend for chart ──
function ChartLegend() {
  const items = [
    { label: 'Min', color: '#3b82f6', dash: false },
    { label: 'Max', color: '#ef4444', dash: false },
    { label: 'Current', color: '#059669', dash: true },
  ]
  return (
    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
      {items.map(it => (
        <div key={it.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="20" height="4"><line x1="0" y1="2" x2="20" y2="2" stroke={it.color} strokeWidth="2" strokeDasharray={it.dash ? '4 2' : 'none'} /></svg>
          <span style={{ ...sans, fontSize: 10, color: 'var(--text-secondary)' }}>{it.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function TemperatureLog() {
  const { user } = useUser()
  const [logs, setLogs, loading] = useSupabase('fridge_temperature_logs', [])
  const showToast = useToast()

  const today = new Date().toISOString().slice(0, 10)
  const userInitials = getStaffInitials(user?.name)

  // ── Form state ──
  const [tempMin, setTempMin] = useState('')
  const [tempMax, setTempMax] = useState('')
  const [tempCurrent, setTempCurrent] = useState('')
  const [excursionReason, setExcursionReason] = useState('')
  const [editing, setEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // ── Chart range toggle ──
  const [chartDays, setChartDays] = useState(7)

  // ── Expanded excursion rows ──
  const [expandedRow, setExpandedRow] = useState(null)

  // ── Excursion log "view all" ──
  const [showAllExcursions, setShowAllExcursions] = useState(false)

  // ── Derived data ──
  const todayEntry = useMemo(() => logs.find(l => l.date === today), [logs, today])

  const sorted = useMemo(() =>
    [...logs].sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    [logs]
  )

  const last30 = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    const cutStr = cutoff.toISOString().slice(0, 10)
    return sorted.filter(l => l.date >= cutStr)
  }, [sorted])

  const chartData = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - chartDays)
    const cutStr = cutoff.toISOString().slice(0, 10)
    return [...logs]
      .filter(l => l.date >= cutStr)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .map(l => ({
        date: l.date,
        min: parseFloat(l.tempMin) || 0,
        max: parseFloat(l.tempMax) || 0,
        current: parseFloat(l.tempCurrent) || 0,
      }))
  }, [logs, chartDays])

  const excursions = useMemo(() =>
    sorted.filter(l => l.excursion),
    [sorted]
  )

  // ── Populate form when editing ──
  useEffect(() => {
    if (editing && todayEntry) {
      setTempMin(todayEntry.tempMin?.toString() || '')
      setTempMax(todayEntry.tempMax?.toString() || '')
      setTempCurrent(todayEntry.tempCurrent?.toString() || '')
      setExcursionReason(todayEntry.excursionReason || '')
    }
  }, [editing])

  // ── Validation ──
  const minOk = tempMin === '' || inRange(tempMin)
  const maxOk = tempMax === '' || inRange(tempMax)
  const curOk = tempCurrent === '' || inRange(tempCurrent)
  const hasExcursion = (tempMin !== '' && !inRange(tempMin)) || (tempMax !== '' && !inRange(tempMax)) || (tempCurrent !== '' && !inRange(tempCurrent))

  // ── Submit ──
  const handleSubmit = (e) => {
    e.preventDefault()
    if (tempMin === '' || tempMax === '' || tempCurrent === '') {
      showToast('Please fill in all temperature fields', 'error')
      return
    }
    if (hasExcursion && !excursionReason.trim()) {
      showToast('Please provide a reason for the out-of-range reading', 'error')
      return
    }

    setSubmitting(true)
    const entry = {
      date: today,
      tempMin: parseFloat(tempMin),
      tempMax: parseFloat(tempMax),
      tempCurrent: parseFloat(tempCurrent),
      loggedBy: userInitials,
      excursion: hasExcursion,
      excursionReason: hasExcursion ? excursionReason.trim() : null,
    }

    if (todayEntry) {
      setLogs(logs.map(l => l.date === today ? { ...l, ...entry } : l))
      logAudit('Updated', `Fridge temp: ${entry.tempMin}/${entry.tempMax}/${entry.tempCurrent}°C`, 'Temperature Log', user?.name)
      showToast('Reading updated')
    } else {
      setLogs([...logs, { id: generateId(), ...entry, createdAt: new Date().toISOString() }])
      logAudit('Created', `Fridge temp: ${entry.tempMin}/${entry.tempMax}/${entry.tempCurrent}°C`, 'Temperature Log', user?.name)
      showToast(hasExcursion ? 'Reading saved — excursion recorded' : 'Reading saved')
    }

    setEditing(false)
    setSubmitting(false)
  }

  // ── CSV export ──
  const handleCsvExport = () => {
    const now = new Date()
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const monthLogs = sorted.filter(l => l.date?.startsWith(monthStr))
    const headers = ['Date', 'Min Temp (°C)', 'Max Temp (°C)', 'Current Temp (°C)', 'In Range', 'Excursion', 'Reason', 'Logged By']
    const rows = monthLogs.map(l => [
      l.date,
      l.tempMin ?? '',
      l.tempMax ?? '',
      l.tempCurrent ?? '',
      (!l.excursion) ? 'Yes' : 'No',
      l.excursion ? 'Yes' : 'No',
      l.excursionReason || '',
      l.loggedBy || '',
    ])
    downloadCsv(`fridge-temp-log-${monthStr}`, headers, rows)
  }

  if (loading) return <SkeletonLoader variant="table" />

  // ── Status pill ──
  const statusPill = todayEntry
    ? todayEntry.excursion
      ? { label: '\u26A0 Excursion recorded', bg: '#fffbeb', color: '#d97706', border: '#fde68a' }
      : { label: '\u2713 Logged today', bg: '#f0fdf4', color: '#059669', border: '#6ee7b7' }
    : { label: 'Not logged today', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' }

  const showForm = !todayEntry || editing

  const tempInput = (label, value, setValue, placeholder) => {
    const ok = value === '' || inRange(value)
    return (
      <div>
        <label style={{ ...sans, display: 'block', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, fontWeight: 600 }}>{label}</label>
        <input
          type="number"
          step="0.1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          style={{
            ...mono,
            width: 80,
            padding: '8px 10px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 700,
            textAlign: 'center',
            border: `1px solid ${ok ? 'var(--input-border)' : '#fecaca'}`,
            background: ok ? 'var(--input-bg)' : '#fef2f2',
            color: ok ? 'var(--text-primary)' : '#dc2626',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border 0.15s, background 0.15s',
          }}
        />
      </div>
    )
  }

  const tempDisplay = (label, val) => {
    const v = parseFloat(val)
    const ok = inRange(v)
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ ...sans, fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, fontWeight: 600 }}>{label}</div>
        <div style={{ ...mono, fontSize: 18, fontWeight: 700, color: ok ? '#059669' : '#dc2626' }}>
          {v.toFixed(1)}°C
        </div>
      </div>
    )
  }

  return (
    <div style={{ ...sans }}>
      {/* ── Page Header ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Dashboard / Temperature Log</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Temperature Log</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={handleCsvExport} style={{
              ...sans, display: 'inline-flex', alignItems: 'center', gap: 5,
              border: '1px solid var(--border-card)', background: 'var(--bg-card)',
              color: 'var(--text-secondary)', borderRadius: 8, padding: '6px 14px',
              fontSize: 12, cursor: 'pointer', fontWeight: 500,
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export CSV
            </button>
            <span style={{
              ...sans, display: 'inline-block', fontSize: 11, fontWeight: 600,
              padding: '3px 10px', borderRadius: 20,
              background: statusPill.bg, color: statusPill.color,
              border: `1px solid ${statusPill.border}`,
            }}>{statusPill.label}</span>
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
          Daily fridge temperature monitoring — GPhC compliance requirement. Safe range: 2°C – 8°C
        </p>
      </div>

      {/* ── Two-column layout ── */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

        {/* ══ LEFT COLUMN ══ */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* ── Today's Reading Card ── */}
          <div style={card}>
            <DashCardHeader
              gradient="linear-gradient(90deg, #0f766e, #14b8a6)"
              icon={'\uD83C\uDF21'}
              title="Today's Reading"
              right={<span style={{ ...mono, fontSize: 11 }}>{today}</span>}
            />

            {showForm ? (
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
                  {tempInput('MIN °C', tempMin, setTempMin, '2.0')}
                  {tempInput('MAX °C', tempMax, setTempMax, '8.0')}
                  {tempInput('CURRENT °C', tempCurrent, setTempCurrent, '4.0')}
                </div>

                {/* Excursion warning */}
                {hasExcursion && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{
                      ...sans, fontSize: 11, color: '#92400e', background: '#fffbeb',
                      padding: '6px 10px', borderRadius: 6, marginBottom: 6, lineHeight: 1.4,
                    }}>
                      {'\u26A0'} Out-of-range reading detected — please record reason and action taken
                    </div>
                    <textarea
                      rows={3}
                      value={excursionReason}
                      onChange={(e) => setExcursionReason(e.target.value)}
                      placeholder="e.g. Fridge door left open, engineer called, stock moved to backup fridge\u2026"
                      style={{
                        ...sans, width: '100%', fontSize: 12,
                        background: 'var(--input-bg)', border: '1px solid var(--input-border)',
                        borderRadius: 8, padding: '10px 12px', color: 'var(--text-primary)',
                        resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                )}

                {/* Logged by */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Avatar name={user?.name} size={22} />
                  <span style={{ ...sans, fontSize: 12, color: 'var(--text-secondary)' }}>
                    Logging as {user?.name || 'Unknown'} ({userInitials})
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      ...sans, flex: 1, padding: 9, background: '#059669', color: 'white',
                      borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      opacity: submitting ? 0.6 : 1,
                    }}
                  >{submitting ? 'Saving\u2026' : 'Save Reading'}</button>
                  {editing && (
                    <button type="button" onClick={() => setEditing(false)} style={{
                      ...sans, padding: '9px 16px', background: 'var(--bg-card)',
                      border: '1px solid var(--border-card)', borderRadius: 8,
                      fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer',
                    }}>Cancel</button>
                  )}
                </div>
              </form>
            ) : (
              /* Read-only view for today's entry */
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 24 }}>
                    {tempDisplay('MIN', todayEntry.tempMin)}
                    {tempDisplay('MAX', todayEntry.tempMax)}
                    {tempDisplay('CURRENT', todayEntry.tempCurrent)}
                  </div>
                  <button onClick={() => setEditing(true)} style={{
                    ...sans, padding: '4px 12px', borderRadius: 6, fontSize: 11,
                    fontWeight: 600, background: 'var(--bg-card)',
                    border: '1px solid var(--border-card)', color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}>Edit</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Avatar name={user?.name} size={18} />
                  <span style={{ ...sans, fontSize: 11, color: 'var(--text-muted)' }}>
                    Logged by {todayEntry.loggedBy || userInitials}
                  </span>
                </div>
                {todayEntry.excursionReason && (
                  <div style={{
                    marginTop: 8, padding: '6px 10px', borderRadius: 6,
                    background: '#fffbeb', border: '1px solid #fde68a',
                    fontSize: 11, color: '#92400e', fontStyle: 'italic',
                  }}>
                    {'\u26A0'} {todayEntry.excursionReason}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── History Table ── */}
          <div style={card}>
            <DashCardHeader
              gradient="linear-gradient(90deg, #064e3b, #047857)"
              icon={'\uD83D\uDCCB'}
              title="History"
              right={<span style={{ ...sans, fontSize: 11 }}>Last 30 days</span>}
            />

            {last30.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#d1d5db" strokeWidth="1.5" style={{ margin: '0 auto 8px', display: 'block' }}>
                  <path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z" />
                </svg>
                <div style={{ ...sans, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>No temperature readings yet.</div>
                <div style={{ ...sans, fontSize: 11, color: 'var(--text-muted)' }}>Use the form above to log today's reading.</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Date', 'Min', 'Max', 'Current', 'By', 'Status'].map(h => (
                        <th key={h} style={{
                          ...sans, fontSize: 9, fontWeight: 600, color: 'var(--text-muted)',
                          textAlign: 'left', padding: '6px 8px',
                          borderBottom: '1px solid var(--border-card)',
                          textTransform: 'uppercase', letterSpacing: 0.5,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {last30.map(log => {
                      const isToday = log.date === today
                      const isExcursion = !!log.excursion
                      const isExpanded = expandedRow === log.id

                      const tempCell = (val) => {
                        const v = parseFloat(val)
                        const ok = inRange(v)
                        return (
                          <td style={{
                            ...mono, fontSize: 12, fontWeight: 600, padding: '6px 8px',
                            color: ok ? '#059669' : '#dc2626',
                            borderBottom: '1px solid var(--border-card)',
                          }}>{isNaN(v) ? '\u2014' : v.toFixed(1)}</td>
                        )
                      }

                      return (
                        <tr
                          key={log.id}
                          onClick={() => log.excursionReason ? setExpandedRow(isExpanded ? null : log.id) : null}
                          style={{
                            cursor: log.excursionReason ? 'pointer' : 'default',
                            background: isExcursion ? '#fffbeb' : isToday ? 'var(--task-done-bg)' : 'transparent',
                            fontWeight: isToday ? 600 : 400,
                            borderLeft: isExcursion ? '3px solid #f59e0b' : '3px solid transparent',
                          }}
                        >
                          <td style={{ ...mono, fontSize: 11, padding: '6px 8px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-card)', whiteSpace: 'nowrap' }}>
                            {formatDate(log.date)}
                            {isToday && <span style={{
                              ...sans, marginLeft: 4, fontSize: 9, fontWeight: 600,
                              padding: '1px 5px', borderRadius: 20,
                              background: '#f0fdf4', color: '#059669', border: '1px solid #6ee7b7',
                            }}>Today</span>}
                          </td>
                          {tempCell(log.tempMin)}
                          {tempCell(log.tempMax)}
                          {tempCell(log.tempCurrent)}
                          <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--border-card)' }}>
                            <Avatar name={log.loggedBy} size={20} />
                          </td>
                          <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--border-card)' }}>
                            {isExcursion ? (
                              <span style={{
                                ...sans, fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
                                background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a',
                              }}>{'\u26A0'} Excursion</span>
                            ) : (
                              <span style={{
                                ...sans, fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
                                background: '#f0fdf4', color: '#059669', border: '1px solid #6ee7b7',
                              }}>{'\u2713'} In range</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {/* Expanded excursion reason (rendered outside <table> to avoid DOM nesting issues) */}
                {expandedRow && (() => {
                  const log = last30.find(l => l.id === expandedRow)
                  if (!log?.excursionReason) return null
                  return (
                    <div style={{
                      ...sans, fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic',
                      padding: '6px 12px', background: 'var(--bg-card-hover)',
                      borderBottom: '1px solid var(--border-card)',
                    }}>
                      <strong style={{ fontWeight: 600, fontStyle: 'normal' }}>Reason:</strong> {log.excursionReason}
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        </div>

        {/* ══ RIGHT COLUMN ══ */}
        <div style={{ width: 300, flexShrink: 0 }}>

          {/* ── Chart Card ── */}
          <div style={card}>
            <DashCardHeader
              gradient="linear-gradient(90deg, #0f766e, #14b8a6)"
              icon={'\uD83D\uDCC8'}
              title={`${chartDays}-Day Trend`}
              right={
                <div style={{ display: 'flex', gap: 2 }}>
                  {[7, 30].map(d => (
                    <button
                      key={d}
                      onClick={(e) => { e.stopPropagation(); setChartDays(d) }}
                      style={{
                        ...sans, fontSize: 10, fontWeight: 600, padding: '2px 8px',
                        borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: chartDays === d ? 'white' : 'transparent',
                        color: chartDays === d ? '#059669' : 'rgba(255,255,255,0.7)',
                      }}
                    >{d} days</button>
                  ))}
                </div>
              }
            />
            <TempChart data={chartData} days={chartDays} />
            {chartData.length >= 2 && <ChartLegend />}
          </div>

          {/* ── Excursion Log Card ── */}
          <div style={card}>
            <DashCardHeader
              gradient="linear-gradient(90deg, #b45309, #d97706)"
              icon={'\u26A0'}
              title="Excursion Log"
            />

            {excursions.length === 0 ? (
              <p style={{ ...sans, fontSize: 11, color: '#059669', fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>
                {'\u2713'} No excursions recorded
              </p>
            ) : (
              <div>
                {(showAllExcursions ? excursions : excursions.slice(0, 5)).map(log => (
                  <div key={log.id} style={{
                    padding: '8px 12px', borderRadius: 8, marginBottom: 4,
                    background: '#fffbeb', border: '1px solid #fde68a',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ ...mono, fontSize: 11, fontWeight: 600, color: '#92400e' }}>{formatDate(log.date)}</span>
                      <Avatar name={log.loggedBy} size={18} />
                    </div>
                    <div style={{ ...mono, fontSize: 10, color: '#d97706', marginBottom: 2 }}>
                      Min: {parseFloat(log.tempMin || 0).toFixed(1)}°C &nbsp; Max: {parseFloat(log.tempMax || 0).toFixed(1)}°C &nbsp; Current: {parseFloat(log.tempCurrent || 0).toFixed(1)}°C
                    </div>
                    {log.excursionReason && (
                      <div style={{ ...sans, fontSize: 11, color: '#78350f', fontStyle: 'italic' }}>
                        {log.excursionReason}
                      </div>
                    )}
                  </div>
                ))}
                {excursions.length > 5 && (
                  <button
                    onClick={() => setShowAllExcursions(!showAllExcursions)}
                    style={{
                      ...sans, width: '100%', padding: '6px', fontSize: 11,
                      fontWeight: 600, color: '#d97706', background: 'none',
                      border: 'none', cursor: 'pointer', textAlign: 'center',
                    }}
                  >{showAllExcursions ? 'Show less' : `View all ${excursions.length}`}</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Responsive ── */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="width: 300px"] { width: 100% !important; }
          div[style*="display: flex"][style*="gap: 16px"][style*="align-items: flex-start"] { flex-direction: column !important; }
        }
      `}</style>
    </div>
  )
}
