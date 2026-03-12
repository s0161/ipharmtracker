/*
  Supabase table needed:

  CREATE TABLE fridge_temperature_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fridge_id TEXT DEFAULT 'main',
    date DATE NOT NULL,
    temp_min NUMERIC,
    temp_max NUMERIC,
    temp_current NUMERIC,
    logged_by TEXT,
    excursion BOOLEAN DEFAULT false,
    excursion_reason TEXT,
    not_checked BOOLEAN DEFAULT false,
    not_checked_reason TEXT,
    stock_quarantined BOOLEAN DEFAULT false,
    stock_destroyed BOOLEAN DEFAULT false,
    reported_to TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ALTER TABLE fridge_temperature_logs ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "anon full access" ON fridge_temperature_logs FOR ALL USING (true) WITH CHECK (true);
*/

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import { logAudit } from '../utils/auditLog'
import { useUser } from '../contexts/UserContext'
import { generateId, formatDate } from '../utils/helpers'
import { getStaffInitials } from '../utils/rotationManager'
import { isElevatedRole } from '../utils/taskEngine'
import { useToast } from '../components/Toast'
import { downloadCsv } from '../utils/exportCsv'
import SkeletonLoader from '../components/SkeletonLoader'
import Avatar from '../components/Avatar'

// Inter font loaded via index.html

// ── Constants ──
const RANGE_MIN = 2
const RANGE_MAX = 8
const inRange = (v) => { const n = parseFloat(v); return !isNaN(n) && n >= RANGE_MIN && n <= RANGE_MAX }

const sans = { fontFamily: "'Inter', sans-serif" }
const mono = { fontFamily: "'DM Mono', monospace" }

const FRIDGES = [
  { id: 'main', name: 'Main Fridge', location: 'Dispensary', model: 'Pharmacy Fridge MK-200', tempRange: '2°C – 8°C' },
  { id: 'backup', name: 'Backup Fridge', location: 'Stockroom', model: 'Labcold RPFR18043', tempRange: '2°C – 8°C' },
]

const NOT_CHECKED_REASONS = [
  'Bank Holiday',
  'No Fridge Stock',
  'Engineer Visit',
  'Power Outage',
  'Other',
]

// ── Section Header (left-border accent, same pattern as RPLog) ──
function SectionHeader({ accent, icon, title, right }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 12px', marginBottom: 12,
      borderLeft: `3px solid ${accent}`, borderRadius: 4,
      background: `${accent}08`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ ...sans, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</span>
      </div>
      {right && <div>{right}</div>}
    </div>
  )
}

// ── SVG Check icon ──
const SvgCheck = ({ size = 10, color = 'white' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8.5l3.5 3.5 6.5-7" /></svg>
)

// ── Mini SVG chart ──
function TempChart({ data }) {
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

  const safeTop = toY(RANGE_MAX)
  const safeBot = toY(RANGE_MIN)

  const step = Math.max(1, Math.floor(data.length / 5))
  const dateLabels = data.filter((_, i) => i % step === 0 || i === data.length - 1)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 200, display: 'block' }}>
      <rect x={PAD.l} y={safeTop} width={pW} height={safeBot - safeTop} fill="var(--ec-em-bg)" opacity="0.4" />
      <line x1={PAD.l} y1={toY(RANGE_MIN)} x2={W - PAD.r} y2={toY(RANGE_MIN)} stroke="var(--ec-em-border)" strokeDasharray="3 3" strokeWidth="1" />
      <line x1={PAD.l} y1={toY(RANGE_MAX)} x2={W - PAD.r} y2={toY(RANGE_MAX)} stroke="var(--ec-em-border)" strokeDasharray="3 3" strokeWidth="1" />
      <text x={PAD.l - 4} y={toY(RANGE_MIN) + 3} textAnchor="end" fill="var(--ec-t3)" fontSize="9" style={mono}>2°C</text>
      <text x={PAD.l - 4} y={toY(RANGE_MAX) + 3} textAnchor="end" fill="var(--ec-t3)" fontSize="9" style={mono}>8°C</text>

      {[0, 2, 4, 6, 8, 10, 12].map(v => (
        <g key={v}>
          {v !== RANGE_MIN && v !== RANGE_MAX && (
            <line x1={PAD.l} y1={toY(v)} x2={W - PAD.r} y2={toY(v)} stroke="var(--ec-t5)" strokeWidth="0.5" />
          )}
          <text x={PAD.l - 4} y={toY(v) + 3} textAnchor="end" fill="var(--ec-t3)" fontSize="8" style={mono}>{v}</text>
        </g>
      ))}

      <polyline points={makeLine('min')} fill="none" stroke="var(--ec-info)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={makeLine('max')} fill="none" stroke="var(--ec-crit)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={makeLine('current')} fill="none" stroke="var(--ec-em)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 2" />

      {data.map((d, i) => (
        <g key={i}>
          <circle cx={toX(i)} cy={toY(d.min)} r="2.5" fill="var(--ec-info)" />
          <circle cx={toX(i)} cy={toY(d.max)} r="2.5" fill="var(--ec-crit)" />
          <circle cx={toX(i)} cy={toY(d.current)} r="2.5" fill="var(--ec-em)" />
        </g>
      ))}

      {dateLabels.map((d) => {
        const idx = data.indexOf(d)
        return (
          <text key={d.date} x={toX(idx)} y={H - 6} textAnchor="middle" fill="var(--ec-t3)" fontSize="9" style={mono}>
            {d.date.slice(5)}
          </text>
        )
      })}
    </svg>
  )
}

function ChartLegend() {
  const items = [
    { label: 'Min', color: 'var(--ec-info)', dash: false },
    { label: 'Max', color: 'var(--ec-crit)', dash: false },
    { label: 'Current', color: 'var(--ec-em)', dash: true },
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

// ── Animated checkbox ──
function AnimatedCheck({ checked, onChange, disabled }) {
  return (
    <div
      onClick={disabled ? undefined : onChange}
      style={{
        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
        border: `2px solid ${checked ? 'var(--ec-em)' : 'var(--text-muted, var(--ec-t3))'}`,
        backgroundColor: checked ? 'var(--ec-em)' : 'transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {checked && <SvgCheck size={10} />}
    </div>
  )
}

// ── Safe Handling & Cold Chain Section ──
function SafeHandlingSection() {
  const [open, setOpen] = useState(false)

  const guidelines = [
    { title: 'Storage Requirements', items: [
      'Fridge temperature must be maintained between 2°C and 8°C at all times',
      'Temperature must be recorded at least once daily (morning preferred)',
      'Fridge thermometer must be calibrated annually',
      'Do not overload the fridge — allow air to circulate freely',
    ]},
    { title: 'Excursion Procedure', items: [
      'If temperature is outside 2–8°C range, an excursion must be recorded',
      'Check thermometer accuracy before assuming genuine excursion',
      'Quarantine affected stock until assessment is complete',
      'Contact manufacturer for stability data if needed',
      'Inform the Responsible Pharmacist immediately',
    ]},
    { title: 'Stock Management', items: [
      'Rotate stock — first expiry, first out (FEFO)',
      'Check expiry dates at least monthly',
      'Do not store food or personal items in the medicine fridge',
      'Ensure fridge door seal is intact and closes properly',
    ]},
    { title: 'Documentation', items: [
      'All readings, excursions, and actions must be recorded',
      'Records must be kept for a minimum of 5 years',
      'Monthly summaries should be reviewed by the Superintendent Pharmacist',
      'CSV exports should be filed as part of the pharmacy audit trail',
    ]},
  ]

  return (
    <div style={{
      background: 'var(--bg-card)', borderRadius: 12,
      border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-card)',
      marginBottom: 12, overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          ...sans, width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 14 }}>📋</span>
        <span style={{ ...sans, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', flex: 1 }}>
          Safe Handling & Cold Chain
        </span>
        <svg width={12} height={12} viewBox="0 0 12 12" fill="none"
          style={{ transform: open ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}
        >
          <path d="M4.5 2.5L8 6L4.5 9.5" stroke="var(--text-muted, var(--ec-t3))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--border-card)' }}>
          {guidelines.map(section => (
            <div key={section.title} style={{ marginTop: 12 }}>
              <div style={{ ...sans, fontSize: 11, fontWeight: 700, color: 'var(--ec-em)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                {section.title}
              </div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {section.items.map((item, i) => (
                  <li key={i} style={{ ...sans, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 2 }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Card wrapper ──
const card = {
  background: 'var(--bg-card)', borderRadius: 12,
  padding: '14px 16px', border: '1px solid var(--border-card)',
  boxShadow: 'var(--shadow-card)', marginBottom: 12,
}

// ═══════════════════════════════════════════════
// ══ MAIN COMPONENT
// ═══════════════════════════════════════════════
export default function TemperatureLog() {
  const { user } = useUser()
  const [logs, setLogs, loading] = useSupabase('fridge_temperature_logs', [])
  const showToast = useToast()

  const today = new Date().toISOString().slice(0, 10)
  const userInitials = getStaffInitials(user?.name)
  const isElevated = isElevatedRole(user?.role)

  // ── UI state ──
  const [selectedFridge, setSelectedFridge] = useState('main')
  const [notChecked, setNotChecked] = useState(false)
  const [notCheckedReason, setNotCheckedReason] = useState('')
  const [tempMin, setTempMin] = useState('')
  const [tempMax, setTempMax] = useState('')
  const [tempCurrent, setTempCurrent] = useState('')
  const [excursionReason, setExcursionReason] = useState('')
  const [stockQuarantined, setStockQuarantined] = useState(false)
  const [stockDestroyed, setStockDestroyed] = useState(false)
  const [reportedTo, setReportedTo] = useState('')
  const [editing, setEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [chartDays, setChartDays] = useState(7)
  const [expandedRow, setExpandedRow] = useState(null)
  const [showAllExcursions, setShowAllExcursions] = useState(false)
  const [historyFilter, setHistoryFilter] = useState({ fridge: 'all', status: 'all' })

  const currentFridge = FRIDGES.find(f => f.id === selectedFridge) || FRIDGES[0]

  // ── Derived data ──
  const fridgeLogs = useMemo(() =>
    logs.filter(l => (l.fridgeId || 'main') === selectedFridge),
    [logs, selectedFridge]
  )

  const todayEntry = useMemo(() =>
    fridgeLogs.find(l => l.date === today),
    [fridgeLogs, today]
  )

  const sorted = useMemo(() =>
    [...fridgeLogs].sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    [fridgeLogs]
  )

  const historyLogs = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    const cutStr = cutoff.toISOString().slice(0, 10)
    let list = sorted.filter(l => l.date >= cutStr)

    if (historyFilter.fridge !== 'all') {
      list = list.filter(l => (l.fridgeId || 'main') === historyFilter.fridge)
    }
    if (historyFilter.status === 'excursion') {
      list = list.filter(l => l.excursion)
    } else if (historyFilter.status === 'ok') {
      list = list.filter(l => !l.excursion && !l.notChecked)
    } else if (historyFilter.status === 'not-checked') {
      list = list.filter(l => l.notChecked)
    }

    return list
  }, [sorted, historyFilter])

  const chartData = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - chartDays)
    const cutStr = cutoff.toISOString().slice(0, 10)
    return [...fridgeLogs]
      .filter(l => l.date >= cutStr && !l.notChecked)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .map(l => ({
        date: l.date,
        min: parseFloat(l.tempMin) || 0,
        max: parseFloat(l.tempMax) || 0,
        current: parseFloat(l.tempCurrent) || 0,
      }))
  }, [fridgeLogs, chartDays])

  const excursions = useMemo(() =>
    sorted.filter(l => l.excursion),
    [sorted]
  )

  // Monthly summary stats
  const monthlyStats = useMemo(() => {
    const now = new Date()
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const monthLogs = fridgeLogs.filter(l => l.date?.startsWith(monthStr))
    const totalDays = now.getDate()
    const recordedDays = new Set(monthLogs.map(l => l.date)).size
    const excursionDays = monthLogs.filter(l => l.excursion).length
    const notCheckedDays = monthLogs.filter(l => l.notChecked).length
    return { totalDays, recordedDays, excursionDays, notCheckedDays, monthStr }
  }, [fridgeLogs])

  // Alert banners
  const alerts = useMemo(() => {
    const arr = []
    // Check all fridges for missing today's reading
    for (const fridge of FRIDGES) {
      const hasToday = logs.some(l => (l.fridgeId || 'main') === fridge.id && l.date === today)
      if (!hasToday) {
        arr.push({ type: 'warning', text: `${fridge.name}: Today's reading not yet recorded` })
      }
    }
    // Unresolved excursions (no reported_to)
    const unresolvedExcursions = logs.filter(l => l.excursion && !l.reportedTo)
    if (unresolvedExcursions.length > 0) {
      arr.push({ type: 'danger', text: `${unresolvedExcursions.length} unresolved excursion${unresolvedExcursions.length > 1 ? 's' : ''} — action required` })
    }
    return arr
  }, [logs, today])

  // ── Populate form when editing ──
  useEffect(() => {
    if (editing && todayEntry) {
      setTempMin(todayEntry.tempMin?.toString() || '')
      setTempMax(todayEntry.tempMax?.toString() || '')
      setTempCurrent(todayEntry.tempCurrent?.toString() || '')
      setExcursionReason(todayEntry.excursionReason || '')
      setNotChecked(!!todayEntry.notChecked)
      setNotCheckedReason(todayEntry.notCheckedReason || '')
      setStockQuarantined(!!todayEntry.stockQuarantined)
      setStockDestroyed(!!todayEntry.stockDestroyed)
      setReportedTo(todayEntry.reportedTo || '')
    }
  }, [editing, selectedFridge])

  // Reset form when switching fridge/slot
  const resetForm = useCallback(() => {
    setTempMin(''); setTempMax(''); setTempCurrent('')
    setExcursionReason(''); setNotChecked(false); setNotCheckedReason('')
    setStockQuarantined(false); setStockDestroyed(false); setReportedTo('')
    setEditing(false)
  }, [])

  useEffect(() => { resetForm() }, [selectedFridge, resetForm])

  // ── Validation ──
  const hasExcursion = !notChecked && (
    (tempMin !== '' && !inRange(tempMin)) ||
    (tempMax !== '' && !inRange(tempMax)) ||
    (tempCurrent !== '' && !inRange(tempCurrent))
  )

  // ── Submit ──
  const handleSubmit = (e) => {
    e.preventDefault()

    if (notChecked) {
      if (!notCheckedReason) {
        showToast('Please select a reason for not checking', 'error')
        return
      }
    } else {
      if (tempMin === '' || tempMax === '' || tempCurrent === '') {
        showToast('Please fill in all temperature fields', 'error')
        return
      }
      if (hasExcursion && !excursionReason.trim()) {
        showToast('Please provide a reason for the out-of-range reading', 'error')
        return
      }
    }

    setSubmitting(true)
    const entry = {
      fridgeId: selectedFridge,
      date: today,
      notChecked,
      notCheckedReason: notChecked ? notCheckedReason : null,
      tempMin: notChecked ? null : parseFloat(tempMin),
      tempMax: notChecked ? null : parseFloat(tempMax),
      tempCurrent: notChecked ? null : parseFloat(tempCurrent),
      loggedBy: userInitials,
      excursion: notChecked ? false : hasExcursion,
      excursionReason: hasExcursion ? excursionReason.trim() : null,
      stockQuarantined: hasExcursion ? stockQuarantined : false,
      stockDestroyed: hasExcursion ? stockDestroyed : false,
      reportedTo: hasExcursion ? (reportedTo.trim() || null) : null,
    }

    if (todayEntry) {
      setLogs(logs.map(l => l.id === todayEntry.id ? { ...l, ...entry } : l))
      logAudit('Updated', `Fridge temp (${selectedFridge}): ${notChecked ? 'Not checked' : `${entry.tempMin}/${entry.tempMax}/${entry.tempCurrent}°C`}`, 'Temperature Log', user?.name)
      showToast('Reading updated')
    } else {
      setLogs([...logs, { id: generateId(), ...entry, createdAt: new Date().toISOString() }])
      logAudit('Created', `Fridge temp (${selectedFridge}): ${notChecked ? 'Not checked' : `${entry.tempMin}/${entry.tempMax}/${entry.tempCurrent}°C`}`, 'Temperature Log', user?.name)
      showToast(notChecked ? 'Not-checked recorded' : hasExcursion ? 'Reading saved — excursion recorded' : 'Reading saved')
    }

    resetForm()
    setSubmitting(false)
  }

  // ── CSV export ──
  const handleCsvExport = () => {
    const now = new Date()
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const monthLogs = sorted.filter(l => l.date?.startsWith(monthStr))
    const headers = ['Date', 'Fridge', 'Min °C', 'Max °C', 'Current °C', 'In Range', 'Not Checked', 'Excursion', 'Reason', 'Actions', 'Logged By']
    const rows = monthLogs.map(l => [
      l.date,
      (FRIDGES.find(f => f.id === (l.fridgeId || 'main'))?.name) || l.fridgeId || 'Main',
      l.tempMin ?? '',
      l.tempMax ?? '',
      l.tempCurrent ?? '',
      l.notChecked ? 'N/A' : (!l.excursion ? 'Yes' : 'No'),
      l.notChecked ? 'Yes' : 'No',
      l.excursion ? 'Yes' : 'No',
      l.excursionReason || l.notCheckedReason || '',
      [l.stockQuarantined && 'Quarantined', l.stockDestroyed && 'Destroyed', l.reportedTo && `Reported to ${l.reportedTo}`].filter(Boolean).join('; ') || '',
      l.loggedBy || '',
    ])
    downloadCsv(`fridge-temp-log-${monthStr}`, headers, rows)
  }

  if (loading) return <SkeletonLoader variant="table" />

  // ── Status pill ──
  const statusPill = todayEntry
    ? todayEntry.notChecked
      ? { label: 'Not checked', bg: 'var(--ec-t5)', color: 'var(--ec-t2)', border: 'var(--ec-t5)' }
      : todayEntry.excursion
        ? { label: '⚠ Excursion', bg: 'var(--ec-warn-bg)', color: 'var(--ec-warn)', border: 'var(--ec-warn-border)' }
        : { label: '✓ Logged today', bg: 'var(--ec-em-bg)', color: 'var(--ec-em)', border: 'var(--ec-em-border)' }
    : { label: 'Not logged today', bg: 'var(--ec-crit-bg)', color: 'var(--ec-crit)', border: 'var(--ec-crit-border)' }

  const showForm = !todayEntry || editing

  const tempInput = (label, value, setValue, placeholder) => {
    const ok = value === '' || inRange(value)
    return (
      <div>
        <label style={{ ...sans, display: 'block', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, fontWeight: 600 }}>{label}</label>
        <input
          type="number" step="0.1" value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          style={{
            ...mono, width: 80, padding: '8px 10px', borderRadius: 8,
            fontSize: 14, fontWeight: 700, textAlign: 'center',
            border: `1px solid ${ok ? 'var(--input-border)' : 'var(--ec-crit-border)'}`,
            background: ok ? 'var(--input-bg)' : 'var(--ec-crit-bg)',
            color: ok ? 'var(--text-primary)' : 'var(--ec-crit)',
            outline: 'none', boxSizing: 'border-box', transition: 'border 0.15s, background 0.15s',
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
        <div style={{ ...mono, fontSize: 18, fontWeight: 700, color: ok ? 'var(--ec-em)' : 'var(--ec-crit)' }}>
          {isNaN(v) ? '—' : `${v.toFixed(1)}°C`}
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
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
          Daily fridge temperature monitoring — GPhC compliance requirement. Safe range: {RANGE_MIN}°C – {RANGE_MAX}°C
        </p>
      </div>

      {/* ── Alert Banners ── */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {alerts.map((a, i) => (
            <div key={i} style={{
              ...sans, display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: a.type === 'danger' ? 'var(--ec-crit-bg)' : 'var(--ec-warn-bg)',
              color: a.type === 'danger' ? 'var(--ec-crit)' : 'var(--ec-warn-dark)',
              border: `1px solid ${a.type === 'danger' ? 'var(--ec-crit-border)' : 'var(--ec-warn-border)'}`,
            }}>
              <span style={{ fontSize: 14 }}>{a.type === 'danger' ? '🔴' : '🟡'}</span>
              {a.text}
            </div>
          ))}
        </div>
      )}

      {/* ── Fridge Selector ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
        padding: '8px 12px', borderRadius: 10,
        background: 'var(--bg-card)', border: '1px solid var(--border-card)',
      }}>
        <span style={{ ...sans, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginRight: 4 }}>FRIDGE:</span>
        {FRIDGES.map(f => (
          <button
            key={f.id}
            onClick={() => setSelectedFridge(f.id)}
            style={{
              ...sans, padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              background: selectedFridge === f.id ? 'var(--ec-em)' : 'transparent',
              color: selectedFridge === f.id ? 'white' : 'var(--text-secondary)',
              boxShadow: selectedFridge === f.id ? '0 2px 8px rgba(5,150,105,0.3)' : 'none',
            }}
          >
            {f.name}
          </button>
        ))}
        <span style={{ ...sans, fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {currentFridge.location}
        </span>
      </div>

      {/* ── Two-column layout ── */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

        {/* ══ LEFT COLUMN ══ */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* ── Today's Reading Card ── */}
          <div style={card}>
            <SectionHeader accent="var(--ec-cat-teal)" icon="🌡️" title="Today's Reading" right={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  ...sans, fontSize: 10, fontWeight: 600, padding: '2px 10px', borderRadius: 20,
                  background: statusPill.bg, color: statusPill.color, border: `1px solid ${statusPill.border}`,
                }}>{statusPill.label}</span>
                <span style={{ ...mono, fontSize: 11, color: 'var(--text-muted)' }}>{today}</span>
              </div>
            } />

            {showForm ? (
              <form onSubmit={handleSubmit}>
                {/* Not Checked toggle */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
                  padding: '8px 12px', borderRadius: 8,
                  background: notChecked ? 'var(--ec-t5)' : 'transparent',
                  border: notChecked ? '1px solid var(--ec-t5)' : '1px solid transparent',
                }}>
                  <AnimatedCheck checked={notChecked} onChange={() => setNotChecked(!notChecked)} />
                  <span style={{ ...sans, fontSize: 12, fontWeight: 600, color: notChecked ? 'var(--ec-t2)' : 'var(--text-secondary)' }}>
                    Not checked today
                  </span>
                </div>

                {notChecked ? (
                  /* Not Checked reason */
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ ...sans, display: 'block', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, fontWeight: 600 }}>Reason</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {NOT_CHECKED_REASONS.map(reason => (
                        <button
                          key={reason}
                          type="button"
                          onClick={() => setNotCheckedReason(reason)}
                          style={{
                            ...sans, padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                            cursor: 'pointer', transition: 'all 0.15s',
                            border: notCheckedReason === reason ? '1px solid var(--ec-em)' : '1px solid var(--border-card)',
                            background: notCheckedReason === reason ? 'var(--ec-em-bg)' : 'transparent',
                            color: notCheckedReason === reason ? 'var(--ec-em)' : 'var(--text-secondary)',
                          }}
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Temperature inputs */}
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
                      {tempInput('MIN °C', tempMin, setTempMin, '2.0')}
                      {tempInput('MAX °C', tempMax, setTempMax, '8.0')}
                      {tempInput('CURRENT °C', tempCurrent, setTempCurrent, '4.0')}
                    </div>

                    {/* Excursion warning + actions */}
                    {hasExcursion && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{
                          ...sans, fontSize: 11, color: 'var(--ec-warn-dark)', background: 'var(--ec-warn-bg)',
                          padding: '8px 12px', borderRadius: 8, marginBottom: 8, lineHeight: 1.4,
                          border: '1px solid var(--ec-warn-border)',
                        }}>
                          ⚠️ Out-of-range reading detected — please record reason and action taken
                        </div>
                        <textarea
                          rows={2} value={excursionReason}
                          onChange={(e) => setExcursionReason(e.target.value)}
                          placeholder="e.g. Fridge door left open, engineer called..."
                          style={{
                            ...sans, width: '100%', fontSize: 12,
                            background: 'var(--input-bg)', border: '1px solid var(--input-border)',
                            borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)',
                            resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                          }}
                        />

                        {/* Action checkboxes */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                          <div style={{ ...sans, fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Actions Taken</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <AnimatedCheck checked={stockQuarantined} onChange={() => setStockQuarantined(!stockQuarantined)} />
                            <span style={{ ...sans, fontSize: 12, color: 'var(--text-primary)' }}>Stock quarantined</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <AnimatedCheck checked={stockDestroyed} onChange={() => setStockDestroyed(!stockDestroyed)} />
                            <span style={{ ...sans, fontSize: 12, color: 'var(--text-primary)' }}>Stock destroyed / disposed of</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ ...sans, fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Reported to:</span>
                            <input
                              type="text" value={reportedTo}
                              onChange={(e) => setReportedTo(e.target.value)}
                              placeholder="e.g. Amjid Shakoor (RP)"
                              style={{
                                ...sans, flex: 1, padding: '5px 10px', borderRadius: 6,
                                fontSize: 12, border: '1px solid var(--input-border)',
                                background: 'var(--input-bg)', color: 'var(--text-primary)',
                                outline: 'none', boxSizing: 'border-box',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Logged by */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Avatar name={user?.name} size={22} />
                  <span style={{ ...sans, fontSize: 12, color: 'var(--text-secondary)' }}>
                    Logging as {user?.name || 'Unknown'} ({userInitials})
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" disabled={submitting} style={{
                    ...sans, flex: 1, padding: 9, background: 'var(--ec-em)', color: 'white',
                    borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700,
                    cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1,
                  }}>{submitting ? 'Saving…' : notChecked ? 'Record Not Checked' : 'Save Reading'}</button>
                  {editing && (
                    <button type="button" onClick={resetForm} style={{
                      ...sans, padding: '9px 16px', background: 'var(--bg-card)',
                      border: '1px solid var(--border-card)', borderRadius: 8,
                      fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer',
                    }}>Cancel</button>
                  )}
                </div>
              </form>
            ) : (
              /* Read-only view */
              <div>
                {todayEntry.notChecked ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px',
                    borderRadius: 8, background: 'var(--ec-t5)', border: '1px solid var(--ec-t5)', marginBottom: 8,
                  }}>
                    <span style={{ fontSize: 14 }}>⏭️</span>
                    <div>
                      <div style={{ ...sans, fontSize: 13, fontWeight: 600, color: 'var(--ec-t2)' }}>Not checked</div>
                      <div style={{ ...sans, fontSize: 11, color: 'var(--ec-t3)' }}>{todayEntry.notCheckedReason || 'No reason given'}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 24 }}>
                      {tempDisplay('MIN', todayEntry.tempMin)}
                      {tempDisplay('MAX', todayEntry.tempMax)}
                      {tempDisplay('CURRENT', todayEntry.tempCurrent)}
                    </div>
                  </div>
                )}

                {todayEntry.excursion && (
                  <div style={{ marginBottom: 8 }}>
                    {todayEntry.excursionReason && (
                      <div style={{
                        padding: '6px 10px', borderRadius: 6,
                        background: 'var(--ec-warn-bg)', border: '1px solid var(--ec-warn-border)',
                        fontSize: 11, color: 'var(--ec-warn-dark)', fontStyle: 'italic', marginBottom: 6,
                      }}>
                        ⚠️ {todayEntry.excursionReason}
                      </div>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {todayEntry.stockQuarantined && (
                        <span style={{ ...sans, fontSize: 9, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: 'var(--ec-crit-bg)', color: 'var(--ec-crit)', border: '1px solid var(--ec-crit-border)' }}>Stock quarantined</span>
                      )}
                      {todayEntry.stockDestroyed && (
                        <span style={{ ...sans, fontSize: 9, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: 'var(--ec-crit-bg)', color: 'var(--ec-crit)', border: '1px solid var(--ec-crit-border)' }}>Stock destroyed</span>
                      )}
                      {todayEntry.reportedTo && (
                        <span style={{ ...sans, fontSize: 9, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: 'var(--ec-info-bg)', color: 'var(--ec-info)', border: '1px solid var(--ec-info-border)' }}>Reported to {todayEntry.reportedTo}</span>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Avatar name={todayEntry.loggedBy} size={18} />
                    <span style={{ ...sans, fontSize: 11, color: 'var(--text-muted)' }}>
                      Logged by {todayEntry.loggedBy || userInitials}
                    </span>
                  </div>
                  <button onClick={() => setEditing(true)} style={{
                    ...sans, padding: '4px 12px', borderRadius: 6, fontSize: 11,
                    fontWeight: 600, background: 'var(--bg-card)',
                    border: '1px solid var(--border-card)', color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}>Edit</button>
                </div>
              </div>
            )}
          </div>

          {/* ── Monthly Summary Stats ── */}
          <div style={{
            display: 'flex', gap: 8, marginBottom: 12,
            padding: '10px 14px', borderRadius: 10,
            background: 'var(--bg-card)', border: '1px solid var(--border-card)',
          }}>
            {[
              { label: 'Days This Month', val: monthlyStats.totalDays, color: 'var(--ec-t2)', bg: 'var(--ec-card-hover)', border: 'var(--ec-t5)' },
              { label: 'Recorded', val: monthlyStats.recordedDays, color: 'var(--ec-em)', bg: 'var(--ec-em-bg)', border: 'var(--ec-em-border)' },
              { label: 'Excursions', val: monthlyStats.excursionDays, color: monthlyStats.excursionDays > 0 ? 'var(--ec-crit)' : 'var(--ec-t3)', bg: monthlyStats.excursionDays > 0 ? 'var(--ec-crit-bg)' : 'var(--ec-card-hover)', border: monthlyStats.excursionDays > 0 ? 'var(--ec-crit-border)' : 'var(--ec-t5)' },
              { label: 'Not Checked', val: monthlyStats.notCheckedDays, color: monthlyStats.notCheckedDays > 0 ? 'var(--ec-warn)' : 'var(--ec-t3)', bg: monthlyStats.notCheckedDays > 0 ? 'var(--ec-warn-bg)' : 'var(--ec-card-hover)', border: monthlyStats.notCheckedDays > 0 ? 'var(--ec-warn-border)' : 'var(--ec-t5)' },
            ].map(s => (
              <div key={s.label} style={{
                flex: 1, textAlign: 'center', padding: '6px 4px', borderRadius: 8,
                background: s.bg, border: `1px solid ${s.border}`,
              }}>
                <div style={{ ...mono, fontSize: 18, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.val}</div>
                <div style={{ ...sans, fontSize: 8, fontWeight: 600, color: s.color, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── History Table ── */}
          <div style={card}>
            <SectionHeader accent="var(--ec-em-dark)" icon="📋" title="History" right={
              <span style={{ ...sans, fontSize: 11, color: 'var(--text-muted)' }}>Last 30 days</span>
            } />

            {/* History filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <select
                value={historyFilter.status}
                onChange={e => setHistoryFilter(p => ({ ...p, status: e.target.value }))}
                style={{
                  ...sans, fontSize: 11, padding: '4px 8px', borderRadius: 6,
                  border: '1px solid var(--border-card)', background: 'var(--bg-card)',
                  color: 'var(--text-secondary)', outline: 'none', cursor: 'pointer',
                }}
              >
                <option value="all">All Statuses</option>
                <option value="ok">In Range</option>
                <option value="excursion">Excursions Only</option>
                <option value="not-checked">Not Checked</option>
              </select>
              {FRIDGES.length > 1 && (
                <select
                  value={historyFilter.fridge}
                  onChange={e => setHistoryFilter(p => ({ ...p, fridge: e.target.value }))}
                  style={{
                    ...sans, fontSize: 11, padding: '4px 8px', borderRadius: 6,
                    border: '1px solid var(--border-card)', background: 'var(--bg-card)',
                    color: 'var(--text-secondary)', outline: 'none', cursor: 'pointer',
                  }}
                >
                  <option value="all">All Fridges</option>
                  {FRIDGES.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              )}
            </div>

            {historyLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="var(--ec-t4)" strokeWidth="1.5" style={{ margin: '0 auto 8px', display: 'block' }}>
                  <path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z" />
                </svg>
                <div style={{ ...sans, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>No readings match this filter.</div>
                <div style={{ ...sans, fontSize: 11, color: 'var(--text-muted)' }}>Try adjusting filters or log today's reading.</div>
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
                    {historyLogs.map((log, idx) => {
                      const isToday = log.date === today
                      const isExcursion = !!log.excursion
                      const isNC = !!log.notChecked
                      const isExpanded = expandedRow === log.id

                      const tempCell = (val) => {
                        if (isNC) return <td style={{ ...mono, fontSize: 12, padding: '6px 8px', color: 'var(--ec-t3)', borderBottom: '1px solid var(--border-card)' }}>—</td>
                        const v = parseFloat(val)
                        const ok = inRange(v)
                        return (
                          <td style={{
                            ...mono, fontSize: 12, fontWeight: 600, padding: '6px 8px',
                            color: ok ? 'var(--ec-em)' : 'var(--ec-crit)',
                            borderBottom: '1px solid var(--border-card)',
                          }}>{isNaN(v) ? '—' : v.toFixed(1)}</td>
                        )
                      }

                      return (
                        <tr
                          key={log.id}
                          onClick={() => (log.excursionReason || log.notCheckedReason) ? setExpandedRow(isExpanded ? null : log.id) : null}
                          style={{
                            cursor: (log.excursionReason || log.notCheckedReason) ? 'pointer' : 'default',
                            background: isExcursion ? 'var(--ec-warn-bg)' : isNC ? 'var(--ec-card-hover)' : idx % 2 === 0 ? 'transparent' : 'var(--ec-card-hover)',
                            fontWeight: isToday ? 600 : 400,
                            borderLeft: isExcursion ? '3px solid var(--ec-warn)' : isNC ? '3px solid var(--ec-t3)' : '3px solid transparent',
                          }}
                        >
                          <td style={{ ...mono, fontSize: 11, padding: '6px 8px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-card)', whiteSpace: 'nowrap' }}>
                            {formatDate(log.date)}
                            {isToday && <span style={{
                              ...sans, marginLeft: 4, fontSize: 9, fontWeight: 600,
                              padding: '1px 5px', borderRadius: 20,
                              background: 'var(--ec-em-bg)', color: 'var(--ec-em)', border: '1px solid var(--ec-em-border)',
                            }}>Today</span>}
                          </td>
                          {tempCell(log.tempMin)}
                          {tempCell(log.tempMax)}
                          {tempCell(log.tempCurrent)}
                          <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--border-card)' }}>
                            <Avatar name={log.loggedBy} size={20} />
                          </td>
                          <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--border-card)' }}>
                            {isNC ? (
                              <span style={{ ...sans, fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: 'var(--ec-t5)', color: 'var(--ec-t2)', border: '1px solid var(--ec-t5)' }}>
                                ⏭️ Not checked
                              </span>
                            ) : isExcursion ? (
                              <span style={{ ...sans, fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: 'var(--ec-warn-bg)', color: 'var(--ec-warn)', border: '1px solid var(--ec-warn-border)' }}>
                                ⚠ Excursion
                              </span>
                            ) : (
                              <span style={{ ...sans, fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: 'var(--ec-em-bg)', color: 'var(--ec-em)', border: '1px solid var(--ec-em-border)' }}>
                                ✓ In range
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {expandedRow && (() => {
                  const log = historyLogs.find(l => l.id === expandedRow)
                  if (!log) return null
                  const reason = log.excursionReason || log.notCheckedReason
                  if (!reason) return null
                  return (
                    <div style={{
                      ...sans, fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic',
                      padding: '8px 12px', background: 'var(--bg-card-hover, var(--ec-card-hover))',
                      borderBottom: '1px solid var(--border-card)', borderLeft: '3px solid var(--ec-warn)',
                    }}>
                      <strong style={{ fontWeight: 600, fontStyle: 'normal' }}>
                        {log.notChecked ? 'Reason:' : 'Excursion reason:'}
                      </strong> {reason}
                      {log.excursion && (log.stockQuarantined || log.stockDestroyed || log.reportedTo) && (
                        <div style={{ marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {log.stockQuarantined && <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 8, background: 'var(--ec-crit-bg)', color: 'var(--ec-crit)' }}>Stock quarantined</span>}
                          {log.stockDestroyed && <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 8, background: 'var(--ec-crit-bg)', color: 'var(--ec-crit)' }}>Stock destroyed</span>}
                          {log.reportedTo && <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 8, background: 'var(--ec-info-bg)', color: 'var(--ec-info)' }}>Reported to {log.reportedTo}</span>}
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}
          </div>

          {/* ── Safe Handling & Cold Chain ── */}
          <SafeHandlingSection />
        </div>

        {/* ══ RIGHT COLUMN ══ */}
        <div style={{ width: 300, flexShrink: 0 }}>

          {/* ── Chart Card ── */}
          <div style={card}>
            <SectionHeader accent="var(--ec-cat-teal)" icon="📈" title={`${chartDays}-Day Trend`} right={
              <div style={{ display: 'flex', gap: 4 }}>
                {[7, 30].map(d => (
                  <button
                    key={d} onClick={() => setChartDays(d)}
                    style={{
                      ...sans, fontSize: 10, fontWeight: 600, padding: '3px 10px',
                      borderRadius: 10, border: '1px solid var(--border-card)', cursor: 'pointer',
                      background: chartDays === d ? 'var(--ec-em)' : 'transparent',
                      color: chartDays === d ? 'white' : 'var(--text-secondary)',
                    }}
                  >{d}d</button>
                ))}
              </div>
            } />
            <TempChart data={chartData} />
            {chartData.length >= 2 && <ChartLegend />}
          </div>

          {/* ── Excursion Log Card ── */}
          <div style={card}>
            <SectionHeader accent="var(--ec-warn)" icon="⚠️" title="Excursion Log" />

            {excursions.length === 0 ? (
              <p style={{ ...sans, fontSize: 11, color: 'var(--ec-em)', fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>
                ✓ No excursions recorded for this fridge
              </p>
            ) : (
              <div>
                {(showAllExcursions ? excursions : excursions.slice(0, 5)).map(log => (
                  <div key={log.id} style={{
                    padding: '8px 12px', borderRadius: 8, marginBottom: 4,
                    background: 'var(--ec-warn-bg)', border: '1px solid var(--ec-warn-border)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ ...mono, fontSize: 11, fontWeight: 600, color: 'var(--ec-warn-dark)' }}>{formatDate(log.date)}</span>
                      <Avatar name={log.loggedBy} size={18} />
                    </div>
                    <div style={{ ...mono, fontSize: 10, color: 'var(--ec-warn)', marginBottom: 2 }}>
                      Min: {parseFloat(log.tempMin || 0).toFixed(1)}°C &nbsp; Max: {parseFloat(log.tempMax || 0).toFixed(1)}°C &nbsp; Current: {parseFloat(log.tempCurrent || 0).toFixed(1)}°C
                    </div>
                    {log.excursionReason && (
                      <div style={{ ...sans, fontSize: 11, color: 'var(--ec-warn-dark)', fontStyle: 'italic' }}>
                        {log.excursionReason}
                      </div>
                    )}
                    {(log.stockQuarantined || log.stockDestroyed || log.reportedTo) && (
                      <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                        {log.stockQuarantined && <span style={{ fontSize: 8, fontWeight: 600, padding: '1px 5px', borderRadius: 6, background: 'var(--ec-crit-bg)', color: 'var(--ec-crit)' }}>Quarantined</span>}
                        {log.stockDestroyed && <span style={{ fontSize: 8, fontWeight: 600, padding: '1px 5px', borderRadius: 6, background: 'var(--ec-crit-bg)', color: 'var(--ec-crit)' }}>Destroyed</span>}
                        {log.reportedTo && <span style={{ fontSize: 8, fontWeight: 600, padding: '1px 5px', borderRadius: 6, background: 'var(--ec-info-bg)', color: 'var(--ec-info)' }}>→ {log.reportedTo}</span>}
                      </div>
                    )}
                  </div>
                ))}
                {excursions.length > 5 && (
                  <button
                    onClick={() => setShowAllExcursions(!showAllExcursions)}
                    style={{
                      ...sans, width: '100%', padding: '6px', fontSize: 11,
                      fontWeight: 600, color: 'var(--ec-warn)', background: 'none',
                      border: 'none', cursor: 'pointer', textAlign: 'center',
                    }}
                  >{showAllExcursions ? 'Show less' : `View all ${excursions.length}`}</button>
                )}
              </div>
            )}
          </div>

          {/* ── Fridge Details Card ── */}
          <div style={card}>
            <SectionHeader accent="var(--ec-em)" icon="❄️" title="Fridge Details" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Name', val: currentFridge.name },
                { label: 'Location', val: currentFridge.location },
                { label: 'Model', val: currentFridge.model },
                { label: 'Temp Range', val: currentFridge.tempRange },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ ...sans, fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{row.label}</span>
                  <span style={{ ...sans, fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Assigned To Card ── */}
          <div style={card}>
            <SectionHeader accent="var(--ec-info)" icon="👤" title="Assigned To" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar name={user?.name} size={32} />
              <div>
                <div style={{ ...sans, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name || 'Unknown'}</div>
                <div style={{ ...sans, fontSize: 10, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role || 'Staff'}</div>
              </div>
            </div>
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
