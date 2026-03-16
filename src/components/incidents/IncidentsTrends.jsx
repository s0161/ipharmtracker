import { useState, useMemo, useRef, useEffect } from 'react'

// ─── Colour maps ─────────────────────────────────────────────────
const CATEGORY_COLORS = {
  'Wrong medication dispensed': '#ef4444',
  'Wrong dose': '#f59e0b',
  'Wrong patient': '#635bff',
  'Labelling error': '#0073e6',
  'Near miss — controlled drug': '#f97316',
  'Packaging/product issue': '#8898aa',
  Other: '#94a3b8',
}

const CHART_FONT = { family: "'Inter', 'DM Sans', sans-serif", size: 10 }
const GRID_COLOR = '#e3e8ef'

// ─── Shared Chart defaults ───────────────────────────────────────
function chartDefaults() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {},
  }
}

// ─── useChart hook — create / destroy lifecycle ──────────────────
function useChart(canvasRef, config, deps) {
  const chartRef = useRef(null)
  useEffect(() => {
    const Chart = window.Chart
    if (!Chart || !canvasRef.current) return
    if (chartRef.current) chartRef.current.destroy()
    chartRef.current = new Chart(canvasRef.current, config)
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null } }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

// ─── Bar chart colours based on count ────────────────────────────
function barColor(count) {
  if (count === 0) return '#10b981'
  if (count <= 2) return '#f59e0b'
  return '#ef4444'
}

// ─── Component ───────────────────────────────────────────────────
export default function IncidentsTrends({ entries }) {
  const [expanded, setExpanded] = useState(false)

  // ── Last 30 days count (for subtitle) ──
  const last30 = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    cutoff.setHours(0, 0, 0, 0)
    return entries.filter((e) => {
      if (!e.date) return false
      return new Date(e.date + 'T00:00:00') >= cutoff
    }).length
  }, [entries])

  // ── Weekly counts (last 8 weeks) ──
  const weeklyData = useMemo(() => {
    const now = new Date()
    const weeks = []
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - (now.getDay() || 7) + 1 - i * 7)
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 7)
      const count = entries.filter((e) => {
        if (!e.date) return false
        const d = new Date(e.date + 'T00:00:00')
        return d >= weekStart && d < weekEnd
      }).length
      weeks.push({
        label: weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        count,
      })
    }
    return weeks
  }, [entries])

  // ── Category counts ──
  const categoryData = useMemo(() => {
    const counts = {}
    entries.forEach((e) => {
      counts[e.category] = (counts[e.category] || 0) + 1
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
  }, [entries])

  // ── Resolution counts ──
  const resolutionData = useMemo(
    () => ({
      resolved: entries.filter((e) => e.status === 'Resolved').length,
      open: entries.filter((e) => e.status === 'Open').length,
      actionTaken: entries.filter((e) => e.status === 'Action Taken').length,
    }),
    [entries],
  )

  // ── Canvas refs ──
  const barRef = useRef(null)
  const catRef = useRef(null)
  const donutRef = useRef(null)

  // ── Bar chart — incidents over time ──
  const barConfig = useMemo(() => {
    const maxCount = Math.max(...weeklyData.map((w) => w.count), 1)
    return {
      type: 'bar',
      data: {
        labels: weeklyData.map((w) => w.label),
        datasets: [
          {
            data: weeklyData.map((w) => w.count),
            backgroundColor: weeklyData.map((w) => barColor(w.count)),
            borderRadius: 4,
            barPercentage: 0.7,
          },
        ],
      },
      options: {
        ...chartDefaults(),
        scales: {
          x: { grid: { display: false }, ticks: { font: CHART_FONT, color: '#94a3b8' } },
          y: {
            beginAtZero: true,
            max: maxCount + 1,
            ticks: { stepSize: 1, font: CHART_FONT, color: '#94a3b8' },
            grid: { color: GRID_COLOR },
          },
        },
      },
    }
  }, [weeklyData])

  useChart(barRef, barConfig, [expanded, barConfig])

  // ── Horizontal bar — by category ──
  const catConfig = useMemo(() => {
    return {
      type: 'bar',
      data: {
        labels: categoryData.map((c) => c[0].length > 22 ? c[0].slice(0, 20) + '…' : c[0]),
        datasets: [
          {
            data: categoryData.map((c) => c[1]),
            backgroundColor: categoryData.map((c) => CATEGORY_COLORS[c[0]] || '#94a3b8'),
            borderRadius: 4,
            barPercentage: 0.7,
          },
        ],
      },
      options: {
        ...chartDefaults(),
        indexAxis: 'y',
        scales: {
          x: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: CHART_FONT, color: '#94a3b8' },
            grid: { color: GRID_COLOR },
          },
          y: { grid: { display: false }, ticks: { font: CHART_FONT, color: '#94a3b8' } },
        },
      },
    }
  }, [categoryData])

  useChart(catRef, catConfig, [expanded, catConfig])

  // ── Donut — resolution rate ──
  const total = resolutionData.resolved + resolutionData.open + resolutionData.actionTaken
  const resolvedPct = total > 0 ? Math.round((resolutionData.resolved / total) * 100) : 0

  const donutConfig = useMemo(() => {
    const hasData = total > 0
    return {
      type: 'doughnut',
      data: {
        labels: ['Resolved', 'Open', 'Action Taken'],
        datasets: [
          {
            data: hasData
              ? [resolutionData.resolved, resolutionData.open, resolutionData.actionTaken]
              : [1],
            backgroundColor: hasData ? ['#10b981', '#ef4444', '#f59e0b'] : ['#e3e8ef'],
            borderWidth: 0,
          },
        ],
      },
      options: {
        ...chartDefaults(),
        cutout: '70%',
        plugins: {
          legend: { display: true, position: 'bottom', labels: { font: CHART_FONT, padding: 8, usePointStyle: true, pointStyleWidth: 8 } },
        },
      },
      plugins: [
        {
          id: 'centreText',
          afterDraw(chart) {
            const { ctx, chartArea: { width, height, top, left } } = chart
            ctx.save()
            ctx.font = "bold 18px 'Inter', sans-serif"
            ctx.fillStyle = '#1e293b'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(
              hasData ? `${resolvedPct}%` : '—',
              left + width / 2,
              top + height / 2 - 6,
            )
            ctx.font = "10px 'Inter', sans-serif"
            ctx.fillStyle = '#94a3b8'
            ctx.fillText('resolved', left + width / 2, top + height / 2 + 12)
            ctx.restore()
          },
        },
      ],
    }
  }, [resolutionData, total, resolvedPct])

  useChart(donutRef, donutConfig, [expanded, donutConfig])

  // ── Summary stats ──
  const thisMonth = useMemo(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth()
    return entries.filter((e) => {
      if (!e.date) return false
      const d = new Date(e.date + 'T00:00:00')
      return d.getFullYear() === y && d.getMonth() === m
    }).length
  }, [entries])

  const isEmpty = entries.length === 0

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="bg-ec-card border border-ec-border rounded-2xl overflow-hidden transition-all">
      {/* Collapsed header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-transparent border-none cursor-pointer text-left font-sans"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-base">📊</span>
          <span className="text-sm font-semibold text-ec-t1">Trends &amp; Analysis</span>
          <span className="text-xs text-ec-t3 ml-1">
            Last 30 days · {last30} incident{last30 !== 1 ? 's' : ''}
          </span>
        </div>
        <svg
          className="w-4 h-4 text-ec-t3 transition-transform"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 pt-1">
          {isEmpty ? (
            <div className="flex items-center justify-center py-12 text-ec-t3 text-sm">
              No data yet — incidents will appear here as they are logged
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Section 1 — Bar chart */}
              <div className="bg-ec-bg rounded-xl p-4 border border-ec-border">
                <h4 className="text-xs font-semibold text-ec-t2 mb-3 uppercase tracking-wide">
                  Incidents over time
                </h4>
                <div style={{ height: 180 }}>
                  <canvas ref={barRef} />
                </div>
              </div>

              {/* Section 2 — Category chart */}
              <div className="bg-ec-bg rounded-xl p-4 border border-ec-border">
                <h4 className="text-xs font-semibold text-ec-t2 mb-3 uppercase tracking-wide">
                  By category
                </h4>
                <div style={{ height: 180 }}>
                  <canvas ref={catRef} />
                </div>
              </div>

              {/* Section 3 — Donut */}
              <div className="bg-ec-bg rounded-xl p-4 border border-ec-border">
                <h4 className="text-xs font-semibold text-ec-t2 mb-3 uppercase tracking-wide">
                  Resolution rate
                </h4>
                <div style={{ height: 180 }}>
                  <canvas ref={donutRef} />
                </div>
              </div>

              {/* Section 4 — Summary stats */}
              <div className="bg-ec-bg rounded-xl p-4 border border-ec-border">
                <h4 className="text-xs font-semibold text-ec-t2 mb-3 uppercase tracking-wide">
                  Summary
                </h4>
                <div className="grid grid-cols-2 gap-2.5 mb-3">
                  <MiniStat value={entries.length} label="Total Logged" />
                  <MiniStat value={resolutionData.resolved} label="Resolved" />
                  <MiniStat value={resolutionData.open} label="Open" />
                  <MiniStat value={thisMonth} label="This Month" />
                </div>
                {/* GPhC Learning Note */}
                <div
                  className="rounded-lg p-3 text-xs text-ec-t2 leading-relaxed"
                  style={{ borderLeft: '3px solid #0073e6', background: 'rgba(0, 115, 230, 0.06)' }}
                >
                  <span className="font-semibold text-ec-t1">GPhC Learning Note</span>
                  <br />
                  Inspectors look for evidence that near misses are analysed for trends and that
                  learning actions are implemented to reduce recurrence. Regularly reviewing this
                  data supports your pharmacy&apos;s learning culture.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Mini stat tile ──────────────────────────────────────────────
function MiniStat({ value, label }) {
  return (
    <div className="bg-ec-card rounded-lg border border-ec-border p-2.5 text-center">
      <div className="text-lg font-bold text-ec-t1">{value}</div>
      <div className="text-[10px] text-ec-t3 uppercase tracking-wide">{label}</div>
    </div>
  )
}
