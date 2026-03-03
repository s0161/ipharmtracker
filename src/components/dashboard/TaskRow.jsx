import { useState } from 'react'
import { getStaffInitials, getStaffColor } from '../../utils/rotationManager'

const PRIO = {
  high: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.12)', label: 'High' },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.12)', label: 'Med' },
  low: { color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.12)', label: 'Low' },
}

const Check = ({ s = 12, c = 'white' }) => (
  <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
    <path d="M2.5 6L5 8.5L9.5 3.5" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const Clock = () => (
  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" className="shrink-0">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const NoteIcon = ({ size = 10, color = 'rgba(255,255,255,0.25)' }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <path d="M2 2h8v8H6l-4-4V2z" stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
    <path d="M4 5h4M4 7h2" stroke={color} strokeWidth="1" strokeLinecap="round" />
  </svg>
)

const Chev = ({ open, color = 'rgba(255,255,255,0.25)', size = 12 }) => (
  <svg
    width={size} height={size} viewBox="0 0 12 12" fill="none"
    className="shrink-0 transition-transform duration-200"
    style={{ transform: open ? 'rotate(90deg)' : 'rotate(0)', transitionTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)' }}
  >
    <path d="M4.5 2.5L8 6L4.5 9.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const RP_SUBCHECKS = [
  { id: 'rpsub1', label: 'RP notice displayed and visible' },
  { id: 'rpsub2', label: 'RP signed in on PMR system' },
  { id: 'rpsub3', label: 'CD register checked and balanced' },
  { id: 'rpsub4', label: 'Dispensary area secure and compliant' },
  { id: 'rpsub5', label: 'Fridge temperature within range' },
]

export default function TaskRow({
  task, isChecked, onToggle, justChecked,
  rpSubChecks, onToggleRpSub,
  expandedNote, onToggleNote,
  expandedSubchecks, onToggleSubchecks,
  showTag = true,
}) {
  const [hov, setHov] = useState(false)
  const p = PRIO[task.priority]
  const isNoteOpen = expandedNote === task.id
  const isSubOpen = expandedSubchecks === task.id
  const rpSubDone = task.hasSubchecks ? RP_SUBCHECKS.filter(s => rpSubChecks?.has(s.id)).length : 0
  const initials = getStaffInitials(task.assigneeName || '')
  const avatarColor = getStaffColor(task.assigneeName || '')

  const borderCol = hov
    ? (task.urgent === 'red' ? 'rgba(239,68,68,0.25)' : task.urgent === 'amber' ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.08)')
    : 'transparent'

  return (
    <div className="mb-0.5">
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        className="flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg transition-all duration-150"
        style={{
          borderLeft: `3px solid ${borderCol}`,
          backgroundColor: hov ? 'rgba(255,255,255,0.02)' : 'transparent',
        }}
      >
        {/* Checkbox */}
        <div
          onClick={onToggle}
          className="w-[18px] h-[18px] rounded-[5px] shrink-0 cursor-pointer relative flex items-center justify-center transition-all duration-200"
          style={{
            border: `2px solid ${isChecked ? '#10b981' : 'rgba(255,255,255,0.12)'}`,
            backgroundColor: isChecked ? '#10b981' : 'transparent',
            transitionTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          {isChecked && <div className="ec-checkpop"><Check s={10} /></div>}
          {justChecked === task.id && (
            <div
              className="absolute -inset-1 rounded-lg pointer-events-none"
              style={{
                border: '2px solid #10b981',
                opacity: 0,
                animation: 'ecFadeUp 0.35s ease forwards',
              }}
            />
          )}
        </div>

        {/* Title + sub count */}
        <div className="flex-1 flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[13px] font-medium text-ec-t1 transition-opacity duration-300 ${isChecked ? 'line-through opacity-30' : ''}`}
            >
              {task.title}
            </span>
            {task.hasSubchecks && (
              <span className="text-[10px] text-ec-info-light font-medium">{rpSubDone}/5</span>
            )}
          </div>
        </div>

        {/* Priority badge */}
        {p && (
          <span
            className="text-[9px] font-bold px-1.5 py-px rounded tracking-wide uppercase"
            style={{ backgroundColor: p.bg, color: p.color, border: `1px solid ${p.border}` }}
          >
            {p.label}
          </span>
        )}

        {/* Note toggle */}
        {task.note && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleNote?.(task.id) }}
            className={`bg-transparent border-none cursor-pointer p-0.5 flex transition-opacity duration-150
              ${isNoteOpen ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
          >
            <NoteIcon size={12} color={isNoteOpen ? '#10b981' : 'rgba(255,255,255,0.25)'} />
          </button>
        )}

        {/* Tag */}
        {showTag && task.tag && (
          <span
            className="text-[10px] px-2 py-0.5 rounded font-medium tracking-wide whitespace-nowrap"
            style={{
              backgroundColor: task.tag === 'RP Check' ? 'rgba(99,102,241,0.1)' : '#18181b',
              color: task.tag === 'RP Check' ? '#a5b4fc' : '#a1a1aa',
              border: `1px solid ${task.tag === 'RP Check' ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            {task.tag}
          </span>
        )}

        {/* Time badge */}
        {task.time && (
          <span
            className="text-[10px] px-2 py-0.5 rounded flex items-center gap-1 whitespace-nowrap font-medium"
            style={{
              backgroundColor: task.urgent === 'red' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
              color: task.urgent === 'red' ? '#fca5a5' : '#fcd34d',
              border: `1px solid ${task.urgent === 'red' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)'}`,
            }}
          >
            <Clock />{task.time}
          </span>
        )}

        {/* Avatar */}
        <div
          className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
          style={{
            backgroundColor: avatarColor,
            boxShadow: `0 0 0 2px #0a0a0a, 0 0 0 3px ${avatarColor}30`,
          }}
        >
          {initials}
        </div>
      </div>

      {/* Expandable note */}
      <div
        className="overflow-hidden transition-all duration-250"
        style={{ maxHeight: isNoteOpen ? 120 : 0, opacity: isNoteOpen ? 1 : 0 }}
      >
        <div className="ml-[41px] mb-1 px-3 py-2 rounded-md bg-white/[0.015] border border-ec-div text-xs text-ec-t2 leading-relaxed">
          {task.note}
        </div>
      </div>

      {/* RP Subchecks */}
      {task.hasSubchecks && (
        <div className="ml-[41px] mb-1">
          <button
            onClick={() => onToggleSubchecks?.(task.id)}
            className="bg-transparent border-none cursor-pointer text-[10px] text-ec-info-light py-0.5 flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity font-sans"
          >
            <Chev open={isSubOpen} color="#a5b4fc" size={9} />
            {rpSubDone}/5 RP checks complete
          </button>
          <div
            className="overflow-hidden transition-all duration-300"
            style={{ maxHeight: isSubOpen ? 300 : 0, opacity: isSubOpen ? 1 : 0 }}
          >
            <div className="py-1.5 flex flex-col gap-0.5">
              {RP_SUBCHECKS.map(sc => (
                <div
                  key={sc.id}
                  className="flex items-center gap-2 px-2 py-0.5 rounded-[5px] hover:bg-[rgba(99,102,241,0.03)] transition-colors"
                >
                  <div
                    onClick={() => onToggleRpSub?.(sc.id)}
                    className="w-3.5 h-3.5 rounded-sm shrink-0 cursor-pointer flex items-center justify-center transition-all duration-150"
                    style={{
                      border: `1.5px solid ${rpSubChecks?.has(sc.id) ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                      backgroundColor: rpSubChecks?.has(sc.id) ? '#6366f1' : 'transparent',
                    }}
                  >
                    {rpSubChecks?.has(sc.id) && <Check s={8} />}
                  </div>
                  <span
                    className={`text-[11px] transition-all duration-200
                      ${rpSubChecks?.has(sc.id) ? 'text-ec-t3 line-through opacity-50' : 'text-ec-t2'}`}
                  >
                    {sc.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
