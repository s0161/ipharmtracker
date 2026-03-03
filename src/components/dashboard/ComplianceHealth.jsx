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
  const isHov = hovCard === 'comp'

  return (
    <div
      className="ec-fadeup rounded-2xl p-5 transition-all duration-250"
      style={{
        flex: '0 0 calc(42% - 16px)',
        backgroundColor: isHov ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.025)',
        border: `1px solid ${isHov ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 16,
        boxShadow: isHov
          ? '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)'
          : '0 1px 3px rgba(0,0,0,0.4)',
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
      <div className="grid grid-cols-2 gap-2.5 mt-[18px]">
        {areas.map((c, i) => {
          const isH = hovTile === i
          return (
            <div
              key={i}
              className={`p-3.5 rounded-xl flex flex-col items-center transition-all duration-200 ${c.alert ? 'ec-breath' : ''}`}
              style={{
                backgroundColor: c.alert ? 'rgba(239,68,68,0.035)' : 'rgba(255,255,255,0.015)',
                border: `1px solid ${c.alert
                  ? (isH ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.08)')
                  : (isH ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)')
                }`,
                transform: isH ? 'translateY(-2px)' : 'translateY(0)',
              }}
              onMouseEnter={() => setHovTile(i)}
              onMouseLeave={() => setHovTile(null)}
            >
              <div className="flex justify-between items-center w-full">
                <span className="text-[9px] font-bold text-ec-t3 tracking-[1px] uppercase">{c.label}</span>
                <Trend trend={c.trend} val={c.trendVal} />
              </div>
              <div className="my-2.5">
                <ProgressRing pct={c.pct} size={48} sw={3.5} delay={500 + i * 120} />
              </div>
              <span className={`text-[11px] ${c.alert ? 'text-ec-crit-light font-medium' : 'text-ec-t3'}`}>
                {c.detail}
              </span>
              <Sparkline data={c.data} color={c.color} w={76} h={20} delay={700 + i * 150} />
            </div>
          )
        })}
      </div>

      <div className="h-px bg-ec-div mt-4" />

      {/* GPhC note */}
      <div className="flex items-center gap-2 mt-3">
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: '#f59e0b', boxShadow: '0 0 4px rgba(245,158,11,0.3)' }}
        />
        <span className="text-[11px] text-ec-t3">
          Last GPhC inspection: <span className="text-ec-warn-light font-medium">14 months ago</span>
        </span>
      </div>
    </div>
  )
}
