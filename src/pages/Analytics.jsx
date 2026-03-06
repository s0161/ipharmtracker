import { useState, useEffect, useMemo } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import {
  getTrafficLight,
  getTaskStatus,
  getSafeguardingStatus,
  DEFAULT_CLEANING_TASKS,
} from '../utils/helpers'
import { calculateComplianceScores } from '../utils/complianceScore'
import { downloadCsv } from '../utils/exportCsv'
import SkeletonLoader from '../components/SkeletonLoader'

// ─── HELPERS ───

function getLast30Days() {
  const days = []
  const d = new Date()
  for (let i = 29; i >= 0; i--) {
    const dt = new Date(d)
    dt.setDate(dt.getDate() - i)
    days.push(dt.toISOString().slice(0, 10))
  }
  return days
}

function getScoreHistory() {
  try {
    return JSON.parse(localStorage.getItem('ipd_score_history') || '{}')
  } catch {
    return {}
  }
}

function formatDayLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// ─── SVG LINE CHART ───

const CHART_W = 900
const CHART_H = 300
const PAD = { top: 20, right: 20, bottom: 40, left: 45 }
const INNER_W = CHART_W - PAD.left - PAD.right
const INNER_H = CHART_H - PAD.top - PAD.bottom

const CATEGORIES = [
  { key: 'documents', label: 'Documents', color: '#10b981' },
  { key: 'training', label: 'Training', color: '#6366f1' },
  { key: 'cleaning', label: 'Cleaning', color: '#f59e0b' },
  { key: 'safeguarding', label: 'Safeguarding', color: '#14b8a6' },
]

function TrendChart({ history, days }) {
  // Build data points per category + overall
  const seriesData = useMemo(() => {
    const daysWithData = days.filter((d) => history[d])
    if (daysWithData.length < 2) return null

    const series = {}
    for (const cat of CATEGORIES) {
      series[cat.key] = daysWithData.map((d, i) => ({
        x: PAD.left + (i / (daysWithData.length - 1)) * INNER_W,
        y: PAD.top + INNER_H - ((history[d]?.[cat.key] ?? 0) / 100) * INNER_H,
        val: history[d]?.[cat.key] ?? 0,
      }))
    }
    series.overall = daysWithData.map((d, i) => {
      const h = history[d] || {}
      const avg = Math.round(
        ((h.documents || 0) + (h.training || 0) + (h.cleaning || 0) + (h.safeguarding || 0)) / 4
      )
      return {
        x: PAD.left + (i / (daysWithData.length - 1)) * INNER_W,
        y: PAD.top + INNER_H - (avg / 100) * INNER_H,
        val: avg,
      }
    })
    return { series, daysWithData }
  }, [history, days])

  if (!seriesData) {
    return (
      <div className="rounded-xl bg-ec-card border border-ec-border p-8 text-center ec-fadeup">
        <div className="text-ec-t3 text-sm">
          Not enough data yet — scores are recorded daily.
        </div>
        <div className="text-ec-t3 text-xs mt-2">
          Come back once at least 2 days of compliance data have been logged.
        </div>
      </div>
    )
  }

  const { series, daysWithData } = seriesData

  // X-axis labels (every 5th day)
  const xLabels = daysWithData
    .map((d, i) => ({ label: formatDayLabel(d), x: PAD.left + (i / (daysWithData.length - 1)) * INNER_W }))
    .filter((_, i) => i % 5 === 0 || i === daysWithData.length - 1)

  // Y-axis labels
  const yLabels = [0, 25, 50, 75, 100]

  const toPoints = (pts) => pts.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <div className="rounded-xl bg-ec-card border border-ec-border p-4 ec-fadeup">
      <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="w-full h-[300px]"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {yLabels.map((v) => {
          const y = PAD.top + INNER_H - (v / 100) * INNER_H
          return (
            <g key={v}>
              <line
                x1={PAD.left}
                y1={y}
                x2={PAD.left + INNER_W}
                y2={y}
                stroke="var(--ec-div)"
                strokeWidth="1"
                strokeDasharray={v === 0 ? 'none' : '4,4'}
              />
              <text
                x={PAD.left - 8}
                y={y + 4}
                textAnchor="end"
                fill="var(--ec-t3)"
                fontSize="11"
                fontFamily="sans-serif"
              >
                {v}%
              </text>
            </g>
          )
        })}

        {/* X-axis labels */}
        {xLabels.map((l, i) => (
          <text
            key={i}
            x={l.x}
            y={CHART_H - 8}
            textAnchor="middle"
            fill="var(--ec-t3)"
            fontSize="10"
            fontFamily="sans-serif"
          >
            {l.label}
          </text>
        ))}

        {/* Category lines */}
        {CATEGORIES.map((cat) => (
          <polyline
            key={cat.key}
            points={toPoints(series[cat.key])}
            fill="none"
            stroke={cat.color}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {/* Overall average line */}
        <polyline
          points={toPoints(series.overall)}
          fill="none"
          stroke="var(--ec-t1)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray="6,3"
        />
      </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-3 px-2">
        {CATEGORIES.map((cat) => (
          <div key={cat.key} className="flex items-center gap-1.5 text-xs text-ec-t2">
            <span
              className="inline-block w-3 h-[3px] rounded-full"
              style={{ backgroundColor: cat.color }}
            />
            {cat.label}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs text-ec-t2">
          <span
            className="inline-block w-3 h-[3px] rounded-full"
            style={{ backgroundColor: 'var(--ec-t1)', opacity: 0.6 }}
          />
          Overall (dashed)
        </div>
      </div>
    </div>
  )
}

// ─── SNAPSHOT CARD ───

function SnapshotCard({ label, current, avg30, trend }) {
  const color = current >= 80 ? 'var(--ec-em)' : current >= 50 ? 'var(--ec-warn)' : 'var(--ec-crit)'
  const trendArrow =
    trend === 'up' ? '\u2191' : trend === 'down' ? '\u2193' : '\u2192'
  const trendColor =
    trend === 'up' ? 'text-ec-em' : trend === 'down' ? 'text-ec-crit' : 'text-ec-warn'

  return (
    <div className="rounded-xl bg-ec-card border border-ec-border p-4 ec-fadeup">
      <div className="text-xs font-bold text-ec-t3 uppercase tracking-wider mb-2">{label}</div>
      <div className="flex items-end gap-2 mb-1">
        <span className="text-3xl font-extrabold" style={{ color }}>
          {current}%
        </span>
        <span className={`text-lg font-bold ${trendColor}`}>{trendArrow}</span>
      </div>
      <div className="text-xs text-ec-t3">
        30-day avg: <span className="font-semibold text-ec-t2">{avg30}%</span>
      </div>
    </div>
  )
}

// ─── RISK CARD ───

function RiskCard({ icon, title, description, severity }) {
  const sevClass =
    severity === 'red'
      ? 'bg-ec-crit/10 text-ec-crit-light'
      : severity === 'amber'
        ? 'bg-ec-warn/10 text-ec-warn-light'
        : 'bg-ec-em/10 text-ec-em'
  const sevLabel =
    severity === 'red' ? 'High' : severity === 'amber' ? 'Medium' : 'Low'

  return (
    <div className="rounded-xl bg-ec-card border border-ec-border p-4 flex items-start gap-3 ec-fadeup">
      <div className="text-lg mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-ec-t1">{title}</div>
        <div className="text-xs text-ec-t3 mt-0.5">{description}</div>
      </div>
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${sevClass}`}>
        {sevLabel}
      </span>
    </div>
  )
}

// ─── MAIN COMPONENT ───

export default function Analytics() {
  const [documents, , docsLoading] = useSupabase('documents', [])
  const [staffTraining, , trainingLoading] = useSupabase('staff_training', [])
  const [cleaningEntries, , cleaningLoading] = useSupabase('cleaning_entries', [])
  const [safeguarding] = useSupabase('safeguarding_records', [])
  const [rpLogs] = useSupabase('rp_log', [])
  const [staff] = useSupabase('staff_members', [])
  const [cleaningTasks] = useSupabase('cleaning_tasks', DEFAULT_CLEANING_TASKS)
  const [incidents] = useSupabase('incidents', [])
  const [nearMisses] = useSupabase('near_misses', [])

  const isLoading = docsLoading || trainingLoading || cleaningLoading

  const days = useMemo(() => getLast30Days(), [])
  const [history, setHistory] = useState(() => getScoreHistory())

  // ─── CURRENT SCORES (shared utility) ───
  const scores = useMemo(() => {
    return calculateComplianceScores({
      documents, staffTraining, cleaningEntries, safeguardingRecords: safeguarding, cleaningTasks,
    })
  }, [documents, staffTraining, cleaningEntries, safeguarding, cleaningTasks])

  // ─── Backfill score history on cold-start ───
  useEffect(() => {
    if (isLoading) return
    const today = new Date().toISOString().slice(0, 10)
    const existing = getScoreHistory()
    // If today's score is missing or history is empty, seed it with current scores
    if (!existing[today]) {
      const updated = { ...existing, [today]: scores }
      localStorage.setItem('ipd_score_history', JSON.stringify(updated))
      setHistory(updated)
    }
  }, [isLoading, scores])

  // ─── 30-DAY AVERAGES & TRENDS ───
  const { averages, trends } = useMemo(() => {
    const avgs = {}
    const trnds = {}

    for (const cat of CATEGORIES) {
      const vals = days.map((d) => history[d]?.[cat.key]).filter((v) => v !== undefined)
      avgs[cat.key] = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : scores[cat.key]

      // Trend: compare last 7 days avg vs prior 7 days avg
      if (vals.length >= 7) {
        const recent = vals.slice(-7)
        const prior = vals.slice(-14, -7)
        if (prior.length >= 3) {
          const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
          const priorAvg = prior.reduce((a, b) => a + b, 0) / prior.length
          const diff = recentAvg - priorAvg
          trnds[cat.key] = diff > 3 ? 'up' : diff < -3 ? 'down' : 'flat'
        } else {
          trnds[cat.key] = 'flat'
        }
      } else {
        trnds[cat.key] = 'flat'
      }
    }
    return { averages: avgs, trends: trnds }
  }, [days, history, scores])

  // ─── STAFF ACTIVITY ───
  const staffActivity = useMemo(() => {
    const thirtyAgo = new Date()
    thirtyAgo.setDate(thirtyAgo.getDate() - 30)
    const thirtyAgoStr = thirtyAgo.toISOString()
    const thirtyAgoDate = thirtyAgo.toISOString().slice(0, 10)

    const ensure = (byStaff, name) => {
      if (!byStaff[name]) byStaff[name] = { name, cleaning: 0, rp: 0, incidents: 0, nearMisses: 0, training: 0, total: 0, lastActive: '' }
    }
    const track = (byStaff, name, field, dateVal) => {
      ensure(byStaff, name)
      byStaff[name][field]++
      byStaff[name].total++
      if (dateVal && dateVal > byStaff[name].lastActive) byStaff[name].lastActive = dateVal
    }

    const byStaff = {}

    // Cleaning entries (last 30 days)
    for (const e of cleaningEntries) {
      if (e.dateTime && e.dateTime >= thirtyAgoStr && e.completedBy) {
        track(byStaff, e.completedBy, 'cleaning', e.dateTime)
      }
    }

    // RP log entries (last 30 days)
    for (const r of rpLogs) {
      if (r.date && r.date >= thirtyAgoDate && r.rpName) {
        track(byStaff, r.rpName, 'rp', r.date)
      }
    }

    // Incident reports (last 30 days)
    for (const inc of incidents) {
      if (inc.date && inc.date >= thirtyAgoDate && inc.reportedBy) {
        track(byStaff, inc.reportedBy, 'incidents', inc.date)
      }
    }

    // Near misses (last 30 days)
    for (const nm of nearMisses) {
      if (nm.date && nm.date >= thirtyAgoDate && nm.actionTakenBy) {
        track(byStaff, nm.actionTakenBy, 'nearMisses', nm.date)
      }
    }

    // Training completions (last 30 days)
    for (const t of staffTraining) {
      if (t.status === 'Complete' && t.staffName) {
        // Use targetDate or completedDate as the activity date
        const d = t.completedDate || t.targetDate || ''
        if (d >= thirtyAgoDate) {
          track(byStaff, t.staffName, 'training', d)
        }
      }
    }

    const result = Object.values(byStaff).sort((a, b) => b.total - a.total)
    const maxCount = result.length > 0 ? result[0].total : 1
    return result.map((s) => ({
      ...s,
      rate: Math.round((s.total / maxCount) * 100),
      lastActiveFormatted: s.lastActive
        ? new Date(s.lastActive + (s.lastActive.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
          })
        : '\u2014',
    }))
  }, [cleaningEntries, rpLogs, incidents, nearMisses, staffTraining])

  // ─── RISK INDICATORS ───
  const risks = useMemo(() => {
    const items = []

    // Documents expiring within 30 days
    const expiringDocs = documents.filter((d) => {
      const status = getTrafficLight(d.expiryDate)
      return status === 'amber' || status === 'red'
    })
    const expiredDocs = expiringDocs.filter((d) => getTrafficLight(d.expiryDate) === 'red')
    const soonDocs = expiringDocs.filter((d) => getTrafficLight(d.expiryDate) === 'amber')

    if (expiredDocs.length > 0) {
      items.push({
        icon: '\u26a0\ufe0f',
        title: `${expiredDocs.length} Expired Document${expiredDocs.length !== 1 ? 's' : ''}`,
        description: expiredDocs
          .slice(0, 3)
          .map((d) => d.documentName)
          .join(', ') + (expiredDocs.length > 3 ? ` +${expiredDocs.length - 3} more` : ''),
        severity: 'red',
      })
    }
    if (soonDocs.length > 0) {
      items.push({
        icon: '\ud83d\udcc4',
        title: `${soonDocs.length} Document${soonDocs.length !== 1 ? 's' : ''} Expiring Soon`,
        description: soonDocs
          .slice(0, 3)
          .map((d) => d.documentName)
          .join(', ') + (soonDocs.length > 3 ? ` +${soonDocs.length - 3} more` : ''),
        severity: 'amber',
      })
    }

    // Overdue training
    const overdueTraining = staffTraining.filter((t) => t.status !== 'Complete')
    if (overdueTraining.length > 0) {
      items.push({
        icon: '\ud83d\udcd6',
        title: `${overdueTraining.length} Incomplete Training Record${overdueTraining.length !== 1 ? 's' : ''}`,
        description: overdueTraining
          .slice(0, 3)
          .map((t) => `${t.staffName || 'Staff'}: ${t.topic || 'Unknown topic'}`)
          .join(', ') + (overdueTraining.length > 3 ? ` +${overdueTraining.length - 3} more` : ''),
        severity: overdueTraining.length > 5 ? 'red' : 'amber',
      })
    }

    // RP coverage gaps
    const loggedDates = new Set(rpLogs.map((l) => l.date))
    const gapDays = days.filter((d) => {
      const dayOfWeek = new Date(d + 'T00:00:00').getDay()
      // Exclude Sundays (day 0) since pharmacy may be closed
      return dayOfWeek !== 0 && !loggedDates.has(d)
    })
    // Only count past days (not today or future)
    const today = new Date().toISOString().slice(0, 10)
    const pastGaps = gapDays.filter((d) => d < today)
    if (pastGaps.length > 0) {
      items.push({
        icon: '\ud83d\udd12',
        title: `${pastGaps.length} RP Coverage Gap${pastGaps.length !== 1 ? 's' : ''} (30d)`,
        description: `Missing RP log entries on: ${pastGaps.slice(0, 5).map(formatDayLabel).join(', ')}${pastGaps.length > 5 ? ` +${pastGaps.length - 5} more` : ''}`,
        severity: pastGaps.length > 5 ? 'red' : 'amber',
      })
    }

    // Safeguarding due
    const sgDueSoon = safeguarding.filter(
      (r) => getSafeguardingStatus(r.trainingDate) === 'due-soon'
    )
    const sgOverdue = safeguarding.filter(
      (r) => getSafeguardingStatus(r.trainingDate) === 'overdue'
    )
    if (sgOverdue.length > 0) {
      items.push({
        icon: '\ud83d\udee1\ufe0f',
        title: `${sgOverdue.length} Overdue Safeguarding Record${sgOverdue.length !== 1 ? 's' : ''}`,
        description: sgOverdue
          .slice(0, 3)
          .map((r) => r.staffName || 'Staff')
          .join(', ') + (sgOverdue.length > 3 ? ` +${sgOverdue.length - 3} more` : ''),
        severity: 'red',
      })
    }
    if (sgDueSoon.length > 0) {
      items.push({
        icon: '\ud83d\udee1\ufe0f',
        title: `${sgDueSoon.length} Safeguarding Refresher${sgDueSoon.length !== 1 ? 's' : ''} Due Soon`,
        description: sgDueSoon
          .slice(0, 3)
          .map((r) => r.staffName || 'Staff')
          .join(', ') + (sgDueSoon.length > 3 ? ` +${sgDueSoon.length - 3} more` : ''),
        severity: 'amber',
      })
    }

    return items
  }, [documents, staffTraining, rpLogs, safeguarding, days])

  // ─── CSV EXPORT ───
  const handleExportCsv = () => {
    const headers = ['Date', 'Documents', 'Training', 'Cleaning', 'Safeguarding', 'Overall']
    const rows = days
      .filter((d) => history[d])
      .map((d) => {
        const h = history[d]
        const overall = Math.round(
          ((h.documents || 0) + (h.training || 0) + (h.cleaning || 0) + (h.safeguarding || 0)) / 4
        )
        return [d, h.documents ?? '', h.training ?? '', h.cleaning ?? '', h.safeguarding ?? '', overall]
      })
    downloadCsv('compliance-analytics', headers, rows)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-ec-t1">Analytics</h1>
            <p className="text-sm text-ec-t3 mt-0.5">Loading compliance data...</p>
          </div>
        </div>
        <SkeletonLoader variant="cards" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ──── 1. HEADER ──── */}
      <div className="flex items-start justify-between gap-4 ec-fadeup">
        <div>
          <h1 className="text-xl font-extrabold text-ec-t1">Analytics</h1>
          <p className="text-sm text-ec-t3 mt-0.5">30-Day Compliance Overview</p>
        </div>
        <button
          onClick={handleExportCsv}
          className="px-4 py-2 rounded-lg bg-ec-em text-white font-semibold text-sm border-none cursor-pointer hover:bg-ec-em-dark transition-colors shrink-0"
        >
          Export CSV
        </button>
      </div>

      {/* ──── 2. TREND CHART ──── */}
      <div>
        <h2 className="text-sm font-bold text-ec-t1 mb-3">Compliance Trend</h2>
        <TrendChart history={history} days={days} />
      </div>

      {/* ──── 3. SNAPSHOT CARDS ──── */}
      <div>
        <h2 className="text-sm font-bold text-ec-t1 mb-3">Current Scores</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CATEGORIES.map((cat) => (
            <SnapshotCard
              key={cat.key}
              label={cat.label}
              current={scores[cat.key]}
              avg30={averages[cat.key]}
              trend={trends[cat.key]}
            />
          ))}
        </div>
      </div>

      {/* ──── 4. STAFF ACTIVITY SUMMARY ──── */}
      <div>
        <h2 className="text-sm font-bold text-ec-t1 mb-3">Staff Activity Summary (30 Days)</h2>
        {staffActivity.length === 0 ? (
          <div className="rounded-xl bg-ec-card border border-ec-border p-6 text-center text-sm text-ec-t3 ec-fadeup">
            No staff activity recorded in the last 30 days.
          </div>
        ) : (
          <div
            className="overflow-x-auto rounded-xl ec-fadeup"
            style={{ border: '1px solid var(--ec-border)' }}
          >
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">
                    Staff Name
                  </th>
                  <th className="text-center text-xs font-semibold text-ec-t3 px-3 py-2.5 border-b border-ec-border">
                    Cleaning
                  </th>
                  <th className="text-center text-xs font-semibold text-ec-t3 px-3 py-2.5 border-b border-ec-border">
                    RP Logs
                  </th>
                  <th className="text-center text-xs font-semibold text-ec-t3 px-3 py-2.5 border-b border-ec-border">
                    Incidents
                  </th>
                  <th className="text-center text-xs font-semibold text-ec-t3 px-3 py-2.5 border-b border-ec-border">
                    Near Misses
                  </th>
                  <th className="text-center text-xs font-semibold text-ec-t3 px-3 py-2.5 border-b border-ec-border">
                    Training
                  </th>
                  <th className="text-left text-xs font-semibold text-ec-t3 px-3 py-2.5 border-b border-ec-border">
                    Total
                  </th>
                  <th className="text-left text-xs font-semibold text-ec-t3 px-3 py-2.5 border-b border-ec-border">
                    Last Active
                  </th>
                </tr>
              </thead>
              <tbody>
                {staffActivity.map((s) => (
                  <tr key={s.name} className="hover:bg-ec-card-hover transition-colors">
                    <td className="px-4 py-2.5 text-ec-t1 border-b border-ec-div font-medium">
                      {s.name}
                    </td>
                    <td className="px-3 py-2.5 text-ec-t2 border-b border-ec-div tabular-nums text-center">
                      {s.cleaning || '\u2014'}
                    </td>
                    <td className="px-3 py-2.5 text-ec-t2 border-b border-ec-div tabular-nums text-center">
                      {s.rp || '\u2014'}
                    </td>
                    <td className="px-3 py-2.5 text-ec-t2 border-b border-ec-div tabular-nums text-center">
                      {s.incidents || '\u2014'}
                    </td>
                    <td className="px-3 py-2.5 text-ec-t2 border-b border-ec-div tabular-nums text-center">
                      {s.nearMisses || '\u2014'}
                    </td>
                    <td className="px-3 py-2.5 text-ec-t2 border-b border-ec-div tabular-nums text-center">
                      {s.training || '\u2014'}
                    </td>
                    <td className="px-3 py-2.5 border-b border-ec-div">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ec-t1 tabular-nums">{s.total}</span>
                        <div className="flex-1 max-w-[80px] h-1.5 rounded-full bg-ec-border overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${s.rate}%`,
                              backgroundColor:
                                s.rate >= 80
                                  ? 'var(--ec-em)'
                                  : s.rate >= 50
                                    ? 'var(--ec-warn)'
                                    : 'var(--ec-crit)',
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-ec-t3 border-b border-ec-div text-xs">
                      {s.lastActiveFormatted}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ──── 5. RISK INDICATORS ──── */}
      <div>
        <h2 className="text-sm font-bold text-ec-t1 mb-3">Risk Indicators</h2>
        {risks.length === 0 ? (
          <div className="rounded-xl bg-ec-card border border-ec-border p-6 text-center ec-fadeup">
            <div className="text-ec-em text-lg font-bold mb-1">All Clear</div>
            <div className="text-xs text-ec-t3">
              No compliance risks detected. All documents, training, and RP coverage are up to date.
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {risks.map((r, i) => (
              <RiskCard key={i} {...r} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
