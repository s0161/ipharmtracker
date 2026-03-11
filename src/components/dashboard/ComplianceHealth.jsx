import { useState } from 'react'
import ProgressRing from './ProgressRing'
import Sparkline from './Sparkline'

const Trend = ({ trend, val }) => {
  if (trend === 'stable') return (
    <span className="text-[10px] text-ec-t3 flex items-center gap-0.5">
      <span className="w-2 h-[1.5px] bg-ec-t3 rounded-sm" />Stable
    </span>
  )
  const up = trend === 'up'
  return (
    <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${up ? 'text-ec-em' : 'text-ec-crit'}`}>
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
        <path
          d={up ? 'M4 7V1M1.5 3.5L4 1L6.5 3.5' : 'M4 1V7M1.5 4.5L4 7L6.5 4.5'}
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
      {val}
    </span>
  )
}

export default function ComplianceHealth({ areas, overallScore, hovCard, onHoverCard }) {
  const [hovTile, setHovTile] = useState(null)
  const [expandedTile, setExpandedTile] = useState(null)
  const isHov = hovCard === 'comp'

  const toggleExpand = (i) => {
    setExpandedTile(expandedTile === i ? null : i)
  }

  return (
    <div
      className="ec-fadeup rounded-2xl p-5 transition-all duration-250 flex-1 min-w-0"
      style={{
        backgroundColor: isHov ? 'var(--ec-card-hover)' : 'var(--ec-card)',
        border: `1px solid ${isHov ? 'var(--ec-t5)' : 'var(--ec-border)'}`,
        borderRadius: 16,
        boxShadow: isHov ? 'var(--shadow-md)' : 'var(--shadow)',
        transform: isHov ? 'translateY(-3px)' : 'translateY(0)',
        transitionTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)',
        animationDelay: '0.25s',
      }}
      onMouseEnter={() => onHoverCard?.('comp')}
      onMouseLeave={() => onHoverCard?.(null)}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <span className="text-[13px] font-bold text-ec-t1 tracking-wide">Compliance Health</span>
        <div className="flex-1" />
        <ProgressRing pct={overallScore} size={36} sw={3} delay={400} />
        <span className="text-[11px] text-ec-t3">Overall</span>
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-[18px]">
        {areas.map((c, i) => {
          const isH = hovTile === i
          const isExpanded = expandedTile === i
          const drillItems = c.drilldown || []
          const maxShow = 5
          const showItems = drillItems.slice(0, maxShow)
          const moreCount = drillItems.length - maxShow

          return (
            <div
              key={i}
              className={`p-3.5 rounded-xl flex flex-col items-center transition-all duration-200 cursor-pointer select-none ${c.alert ? 'ec-breath' : ''}`}
              style={{
                backgroundColor: c.alert ? 'var(--ec-crit-faint)' : 'var(--ec-card)',
                border: `1px solid ${c.alert
                  ? (isH || isExpanded ? 'var(--ec-crit-border)' : 'var(--ec-crit-faint)')
                  : (isH || isExpanded ? 'var(--ec-t4)' : 'var(--ec-div)')
                }`,
                transform: isH ? 'translateY(-2px)' : 'translateY(0)',
              }}
              onMouseEnter={() => setHovTile(i)}
              onMouseLeave={() => setHovTile(null)}
              onClick={() => toggleExpand(i)}
            >
              <div className="flex justify-between items-center w-full">
                <span className="text-[9px] font-bold text-ec-t3 tracking-[1px] uppercase">{c.label}</span>
                <Trend trend={c.trend} val={c.trendVal} />
              </div>
              <div className="my-2.5">
                <ProgressRing pct={c.pct} size={48} sw={3.5} delay={500 + i * 120} />
              </div>
              {/* Fraction display */}
              <span className="text-[12px] font-semibold tabular-nums" style={{ color: c.color }}>
                {c.current !== undefined ? `${c.current}/${c.total}` : ''} <span className="text-[10px] font-normal text-ec-t4">current</span>
              </span>
              <Sparkline data={c.data} color={c.color} w={76} h={20} delay={700 + i * 150} />

              {/* Drill-down detail */}
              <div
                className="w-full overflow-hidden transition-all duration-300"
                style={{
                  maxHeight: isExpanded && drillItems.length > 0 ? 200 : 0,
                  opacity: isExpanded ? 1 : 0,
                  transitionTimingFunction: 'cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                <div className="mt-2.5 pt-2 border-t border-ec-div space-y-1">
                  {showItems.map((item, j) => (
                    <div key={j} className="flex items-center gap-1.5 text-[10px]">
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.severity === 'red' ? 'var(--ec-crit)' : 'var(--ec-warn)' }}
                      />
                      <span className="text-ec-t2 truncate">{item.name}</span>
                      {item.detail && <span className="text-ec-t4 ml-auto flex-shrink-0">{item.detail}</span>}
                    </div>
                  ))}
                  {moreCount > 0 && (
                    <div className="text-[9px] text-ec-t4 pt-0.5">+{moreCount} more</div>
                  )}
                  {drillItems.length === 0 && isExpanded && (
                    <div className="text-[10px] text-ec-em">All clear</div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="h-px bg-ec-div mt-4" />

      {/* GPhC note */}
      <div className="flex items-center gap-2 mt-3">
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: 'var(--ec-warn)', boxShadow: '0 0 4px var(--ec-warn-faint)' }}
        />
        <span className="text-[11px] text-ec-t3">
          Last GPhC inspection: <span className="text-ec-warn-light font-medium">14 months ago</span>
        </span>
      </div>
    </div>
  )
}
