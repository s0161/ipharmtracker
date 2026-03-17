import { useState, useMemo, useEffect } from 'react'
import { useRota, getMonday, getWeekEntries, getRPForDate, formatDate, getWeekDays } from '../hooks/useRota'
import { useUser } from '../contexts/UserContext'
import { useToast } from '../components/Toast'
import { getStaffInitials } from '../utils/rotationManager'
import Modal from '../components/Modal'

const TEAL = '#0d9488'
const TEAL_DARK = '#0f766e'
const TEAL_LIGHT = '#ccfbf1'
const TEAL_BG = '#f0fdfa'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const RP_ROLES = ['pharmacist', 'superintendent']

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(t) {
  if (!t) return ''
  return t.slice(0, 5)
}

function isWeekend(date) {
  const d = new Date(date)
  return d.getDay() === 0 || d.getDay() === 6
}

// ── RP Cover Indicator Row ──────────────────────────────────────────────────

function RPIndicatorRow({ days, weekEntries }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '160px repeat(7, 1fr)',
      gap: 2,
      marginBottom: 2,
    }}>
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        color: TEAL,
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 12,
        letterSpacing: 0.5,
      }}>
        RP COVER
      </div>
      {days.map(day => {
        const dateStr = formatDate(day)
        const weekend = isWeekend(day)
        const rp = getRPForDate(weekEntries, dateStr)

        if (weekend) {
          return (
            <div key={dateStr} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '6px 4px',
            }}>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 10,
                background: 'var(--ec-border, #f1f5f9)', color: 'var(--ec-t3)',
              }}>
                Closed
              </span>
            </div>
          )
        }

        return (
          <div key={dateStr} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '6px 4px',
          }}>
            {rp ? (
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 10,
                background: 'var(--ec-em-bg)', color: '#059669',
                border: '1px solid #6ee7b7',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                maxWidth: '100%',
              }}>
                ✓ {rp.staffName?.split(' ')[0]}
              </span>
            ) : (
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 10,
                background: 'var(--ec-crit-bg)', color: '#dc2626',
                border: '1px solid #fca5a5',
              }}>
                ⚠ No RP
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Rota Cell ───────────────────────────────────────────────────────────────

function RotaCell({ entry, onClick, isPast }) {
  if (!entry) {
    return (
      <div
        onClick={onClick}
        style={{
          minHeight: 52,
          border: '1.5px dashed var(--ec-div, #e3e8ef)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s',
          opacity: isPast ? 0.5 : 1,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = TEAL
          e.currentTarget.style.background = 'rgba(13,148,136,0.04)'
          e.currentTarget.querySelector('.add-hint').style.opacity = 1
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--ec-div, #e3e8ef)'
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.querySelector('.add-hint').style.opacity = 0
        }}
      >
        <span className="add-hint" style={{
          fontSize: 11, color: TEAL, fontWeight: 500, opacity: 0,
          transition: 'opacity 0.15s',
        }}>
          + Add
        </span>
      </div>
    )
  }

  if (entry.isOff) {
    return (
      <div
        onClick={onClick}
        style={{
          minHeight: 52,
          background: 'var(--ec-bg, #f8fafc)',
          border: '1.5px dashed var(--ec-div, #e3e8ef)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          opacity: isPast ? 0.5 : 1,
        }}
      >
        <span style={{ fontSize: 11, color: 'var(--ec-t3)', fontStyle: 'italic' }}>Day Off</span>
      </div>
    )
  }

  const isRP = entry.isRpCover

  return (
    <div
      onClick={onClick}
      style={{
        minHeight: 52,
        background: isRP
          ? `linear-gradient(135deg, ${TEAL_BG}, ${TEAL_LIGHT})`
          : 'var(--ec-card, #fff)',
        border: isRP
          ? `1.5px solid ${TEAL}`
          : '1px solid var(--ec-div, #e2e8f0)',
        borderRadius: 8,
        padding: '6px 8px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        opacity: isPast ? 0.6 : 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
    >
      {(entry.shiftStart || entry.shiftEnd) && (
        <div style={{
          fontSize: 11, fontWeight: 600,
          fontFamily: "'DM Mono', 'SF Mono', monospace",
          color: isRP ? TEAL_DARK : 'var(--ec-t1)',
        }}>
          {formatTime(entry.shiftStart)}–{formatTime(entry.shiftEnd)}
        </div>
      )}
      {isRP && (
        <span style={{
          fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 6,
          background: TEAL, color: '#fff',
          alignSelf: 'flex-start', letterSpacing: 0.3,
        }}>
          RP COVER
        </span>
      )}
      {entry.notes && (
        <div style={{
          fontSize: 10, color: 'var(--ec-t3)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {entry.notes}
        </div>
      )}
    </div>
  )
}

// ── Staff Row Header ────────────────────────────────────────────────────────

function StaffRowHeader({ name, role }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 12px',
      minHeight: 52,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: `linear-gradient(135deg, ${TEAL} 0%, ${TEAL_DARK} 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 700, color: '#fff',
        flexShrink: 0,
      }}>
        {getStaffInitials(name)}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 12, fontWeight: 600, color: 'var(--ec-t1)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {name}
        </div>
        <span style={{
          fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 6,
          background: TEAL_BG, color: TEAL, textTransform: 'capitalize',
        }}>
          {(role || 'staff').replace('_', ' ')}
        </span>
      </div>
    </div>
  )
}

// ── Column Headers ──────────────────────────────────────────────────────────

function ColumnHeaders({ days, today }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '160px repeat(7, 1fr)',
      gap: 2,
      marginBottom: 2,
    }}>
      <div />
      {days.map((day, i) => {
        const dateStr = formatDate(day)
        const isToday = dateStr === today
        const isPast = dateStr < today
        return (
          <div key={dateStr} style={{
            textAlign: 'center',
            padding: '10px 4px 8px',
            borderLeft: isToday ? `3px solid ${TEAL}` : '3px solid transparent',
            background: isToday ? 'rgba(13,148,136,0.05)' : 'transparent',
            borderRadius: isToday ? '8px 8px 0 0' : 0,
            opacity: isPast ? 0.6 : 1,
          }}>
            <div style={{
              fontSize: 11, fontWeight: 700,
              color: isToday ? TEAL : 'var(--ec-t2)',
            }}>
              {DAY_NAMES[i]}
            </div>
            <div style={{
              fontSize: 13, fontWeight: 800,
              color: isToday ? TEAL : 'var(--ec-t1)',
              fontFamily: "'DM Mono', 'SF Mono', monospace",
            }}>
              {day.getDate()}
            </div>
            <div style={{
              fontSize: 9, fontWeight: 500,
              color: isToday ? TEAL : 'var(--ec-t3)',
              textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              {MONTH_SHORT[day.getMonth()]}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── RP Cover Summary ────────────────────────────────────────────────────────

function RPCoverSummary({ days, weekEntries }) {
  const weekdays = days.filter(d => !isWeekend(d))
  const covered = weekdays.filter(d => getRPForDate(weekEntries, formatDate(d)))
  const count = covered.length
  const total = weekdays.length

  return (
    <div style={{
      marginTop: 16,
      background: 'var(--ec-card, #fff)',
      border: '1px solid var(--ec-div, #e2e8f0)',
      borderRadius: 14,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--ec-div, #e2e8f0)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ width: 4, height: 18, borderRadius: 2, background: TEAL }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ec-t1)' }}>
          This Week's RP Cover
        </span>
        <span style={{
          marginLeft: 'auto', fontSize: 12, fontWeight: 700,
          color: count === total ? '#059669' : '#d97706',
          fontFamily: "'DM Mono', 'SF Mono', monospace",
        }}>
          {count}/{total} days
        </span>
      </div>
      <div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {weekdays.map(day => {
            const dateStr = formatDate(day)
            const rp = getRPForDate(weekEntries, dateStr)
            return (
              <div key={dateStr} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                fontSize: 12,
              }}>
                <span style={{
                  fontWeight: 600, color: 'var(--ec-t2)', width: 90,
                  fontFamily: "'DM Mono', 'SF Mono', monospace",
                }}>
                  {DAY_NAMES[day.getDay() - 1]} {day.getDate()} {MONTH_SHORT[day.getMonth()]}
                </span>
                {rp ? (
                  <span style={{ color: '#059669', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
                    {rp.staffName}
                  </span>
                ) : (
                  <span style={{ color: '#dc2626', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
                    No RP assigned
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Progress bar */}
        <div style={{
          marginTop: 12, height: 6, borderRadius: 3,
          background: 'var(--ec-border, #e2e8f0)',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: 3,
            width: `${(count / total) * 100}%`,
            background: count === total
              ? 'linear-gradient(90deg, #059669, #10b981)'
              : 'linear-gradient(90deg, #d97706, #f59e0b)',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>
    </div>
  )
}

// ── Add/Edit Shift Modal ────────────────────────────────────────────────────

function ShiftModal({ open, onClose, entry, staffList, date, presetStaffId, onSave, onDelete }) {
  const [staffId, setStaffId] = useState('')
  const [shiftDate, setShiftDate] = useState('')
  const [shiftStart, setShiftStart] = useState('09:00')
  const [shiftEnd, setShiftEnd] = useState('17:30')
  const [isRpCover, setIsRpCover] = useState(false)
  const [isOff, setIsOff] = useState(false)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  function resetForm() {
    if (entry) {
      setStaffId(entry.staffMemberId || '')
      setShiftDate(entry.shiftDate || '')
      setShiftStart(formatTime(entry.shiftStart) || '09:00')
      setShiftEnd(formatTime(entry.shiftEnd) || '17:30')
      setIsRpCover(entry.isRpCover || false)
      setIsOff(entry.isOff || false)
      setNotes(entry.notes || '')
    } else {
      setStaffId(presetStaffId || '')
      setShiftDate(date || '')
      setShiftStart('09:00')
      setShiftEnd('17:30')
      setIsRpCover(false)
      setIsOff(false)
      setNotes('')
    }
  }

  // Reset when entry/date/open changes
  useEffect(() => {
    if (open) resetForm()
  }, [open, entry?.id, date])

  const selectedStaff = staffList.find(s => s.id === staffId)
  const canBeRP = selectedStaff && RP_ROLES.includes(selectedStaff.role)

  async function handleSave() {
    if (!staffId || !shiftDate) return
    setSaving(true)

    const staff = staffList.find(s => s.id === staffId)
    await onSave({
      id: entry?.id,
      staffMemberId: staffId,
      staffName: staff?.name || '',
      staffRole: staff?.role || 'staff',
      shiftDate,
      shiftStart: isOff ? null : shiftStart,
      shiftEnd: isOff ? null : shiftEnd,
      isRpCover: isOff ? false : isRpCover,
      isOff,
      notes,
    })
    setSaving(false)
    onClose()
  }

  async function handleDelete() {
    if (!entry?.id) return
    setSaving(true)
    await onDelete(entry.id)
    setSaving(false)
    onClose()
  }

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid var(--ec-div, #e2e8f0)',
    background: 'var(--ec-bg, #f8fafc)',
    color: 'var(--ec-t1)',
    fontSize: 13,
    fontFamily: "'Inter', sans-serif",
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle = {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--ec-t2)',
    marginBottom: 4,
    display: 'block',
  }

  return (
    <Modal open={open} onClose={onClose} title={entry ? 'Edit Shift' : 'Add Shift'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={labelStyle}>Staff Member</label>
          <select
            value={staffId}
            onChange={e => setStaffId(e.target.value)}
            style={inputStyle}
          >
            <option value="">Select staff...</option>
            {staffList.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} — {(s.role || 'staff').replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Date</label>
          <input
            type="date"
            value={shiftDate}
            onChange={e => setShiftDate(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            id="dayOff"
            checked={isOff}
            onChange={e => setIsOff(e.target.checked)}
            style={{ accentColor: TEAL }}
          />
          <label htmlFor="dayOff" style={{ fontSize: 13, color: 'var(--ec-t1)', cursor: 'pointer' }}>
            Day Off
          </label>
        </div>

        {!isOff && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>Start Time</label>
                <input
                  type="time"
                  value={shiftStart}
                  onChange={e => setShiftStart(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>End Time</label>
                <input
                  type="time"
                  value={shiftEnd}
                  onChange={e => setShiftEnd(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {canBeRP && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  id="rpCover"
                  checked={isRpCover}
                  onChange={e => setIsRpCover(e.target.checked)}
                  style={{ accentColor: TEAL }}
                />
                <label htmlFor="rpCover" style={{ fontSize: 13, color: 'var(--ec-t1)', cursor: 'pointer' }}>
                  RP Cover
                </label>
              </div>
            )}
          </>
        )}

        <div>
          <label style={labelStyle}>Notes (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. covering for annual leave"
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button
            onClick={handleSave}
            disabled={saving || !staffId || !shiftDate}
            style={{
              flex: 1,
              padding: '10px 0', borderRadius: 10,
              background: `linear-gradient(180deg, ${TEAL} 0%, ${TEAL_DARK} 100%)`,
              color: '#fff', border: 'none', fontSize: 13, fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: (saving || !staffId || !shiftDate) ? 0.6 : 1,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {saving ? 'Saving...' : 'Save Shift'}
          </button>

          {entry?.id && (
            <button
              onClick={handleDelete}
              disabled={saving}
              style={{
                padding: '10px 16px', borderRadius: 10,
                background: 'var(--ec-crit-bg)', color: '#dc2626',
                border: '1px solid #fca5a5', fontSize: 13, fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Delete
            </button>
          )}

          <button
            onClick={onClose}
            style={{
              padding: '10px 16px', borderRadius: 10,
              background: 'var(--ec-bg, #f1f5f9)', color: 'var(--ec-t2)',
              border: '1px solid var(--ec-div, #e2e8f0)', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', fontFamily: "'Inter', sans-serif",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Main RotaPage ───────────────────────────────────────────────────────────

export default function RotaPage() {
  const { entries, staff, loading, saveShift, deleteShift, clearRPForDate } = useRota()
  const { user } = useUser()
  const showToast = useToast()

  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
  const [modalOpen, setModalOpen] = useState(false)
  const [editEntry, setEditEntry] = useState(null)
  const [presetDate, setPresetDate] = useState(null)
  const [presetStaffId, setPresetStaffId] = useState(null)

  const today = formatDate(new Date())
  const days = useMemo(() => getWeekDays(weekStart), [weekStart])
  const weekEntries = useMemo(() => getWeekEntries(entries || [], weekStart), [entries, weekStart])

  // Sort staff: pharmacists/superintendents first, then alphabetical
  const sortedStaff = useMemo(() => {
    return [...(staff || [])].sort((a, b) => {
      const aElevated = RP_ROLES.includes(a.role) ? 0 : 1
      const bElevated = RP_ROLES.includes(b.role) ? 0 : 1
      if (aElevated !== bElevated) return aElevated - bElevated
      return (a.name || '').localeCompare(b.name || '')
    })
  }, [staff])

  function prevWeek() {
    const d = new Date(weekStart)
    d.setDate(d.getDate() - 7)
    setWeekStart(d)
  }

  function nextWeek() {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 7)
    setWeekStart(d)
  }

  function goToday() {
    setWeekStart(getMonday(new Date()))
  }

  function openModal(entry, dateStr, staffId) {
    setEditEntry(entry || null)
    setPresetDate(dateStr || null)
    setPresetStaffId(staffId || null)
    setModalOpen(true)
  }

  async function handleSave(data) {
    if (data.isRpCover) {
      await clearRPForDate(data.shiftDate, data.staffMemberId)
    }
    const { error } = await saveShift({ ...data, createdBy: user?.id })
    if (error) {
      showToast?.('Failed to save shift', 'error')
    } else {
      showToast?.('Shift saved', 'success')
    }
  }

  async function handleDelete(id) {
    const { error } = await deleteShift(id)
    if (error) {
      showToast?.('Failed to delete shift', 'error')
    } else {
      showToast?.('Shift deleted', 'success')
    }
  }

  // Week label
  const weekLabel = `W/C ${weekStart.getDate()} ${MONTH_SHORT[weekStart.getMonth()]} ${weekStart.getFullYear()}`

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--ec-t3)', fontSize: 14 }}>
        Loading rota...
      </div>
    )
  }

  return (
    <div style={{ padding: '0 0 32px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header panel */}
      <div style={{
        background: `linear-gradient(135deg, #f8fffd 0%, ${TEAL_BG} 100%)`,
        border: `1.5px solid rgba(13,148,136,0.2)`,
        borderRadius: 16,
        padding: '20px 24px',
        marginBottom: 20,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 4,
          background: `linear-gradient(90deg, ${TEAL} 0%, ${TEAL_DARK} 100%)`,
        }} />

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <h1 style={{
              fontSize: 20, fontWeight: 800, color: 'var(--ec-t1)',
              margin: 0, fontFamily: "'Inter', sans-serif",
            }}>
              Staff Rota
            </h1>
            <p style={{
              fontSize: 12, color: 'var(--ec-t3)', margin: '4px 0 0',
              fontFamily: "'Inter', sans-serif",
            }}>
              Weekly shift planner and RP cover schedule
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Week nav */}
            <button onClick={prevWeek} style={navBtnStyle}>‹</button>
            <span style={{
              fontSize: 13, fontWeight: 700, color: 'var(--ec-t1)',
              minWidth: 140, textAlign: 'center',
              fontFamily: "'DM Mono', 'SF Mono', monospace",
            }}>
              {weekLabel}
            </span>
            <button onClick={nextWeek} style={navBtnStyle}>›</button>

            <button
              onClick={goToday}
              style={{
                padding: '6px 14px', borderRadius: 8,
                background: 'var(--ec-card, #fff)',
                border: '1px solid var(--ec-div, #e2e8f0)',
                color: TEAL, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: "'Inter', sans-serif",
              }}
            >
              Today
            </button>

            <button
              onClick={() => openModal(null, today, null)}
              style={{
                padding: '8px 16px', borderRadius: 10,
                background: `linear-gradient(180deg, ${TEAL} 0%, ${TEAL_DARK} 100%)`,
                color: '#fff', border: 'none', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                boxShadow: '0 2px 8px rgba(13,148,136,0.3)',
              }}
            >
              + Add Shift
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{
        background: 'var(--ec-card, #fff)',
        border: '1px solid var(--ec-div, #e2e8f0)',
        borderRadius: 14,
        overflow: 'hidden',
        padding: '12px',
      }}>
        <ColumnHeaders days={days} today={today} />
        <RPIndicatorRow days={days} weekEntries={weekEntries} />

        {/* Staff rows */}
        {sortedStaff.map(member => (
          <div
            key={member.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '160px repeat(7, 1fr)',
              gap: 2,
              borderTop: '1px solid var(--ec-div, #f1f5f9)',
            }}
          >
            <StaffRowHeader name={member.name} role={member.role} />
            {days.map(day => {
              const dateStr = formatDate(day)
              const entry = weekEntries.find(
                e => e.shiftDate === dateStr && e.staffMemberId === member.id
              )
              const isPast = dateStr < today
              return (
                <div key={dateStr} style={{
                  padding: 2,
                  borderLeft: dateStr === today ? `3px solid ${TEAL}` : '3px solid transparent',
                  background: dateStr === today ? 'rgba(13,148,136,0.03)' : 'transparent',
                }}>
                  <RotaCell
                    entry={entry}
                    isPast={isPast}
                    onClick={() => openModal(entry || null, dateStr, member.id)}
                  />
                </div>
              )
            })}
          </div>
        ))}

        {sortedStaff.length === 0 && (
          <div style={{
            padding: 32, textAlign: 'center', color: 'var(--ec-t3)', fontSize: 13,
          }}>
            No staff members found. Add staff in Settings to get started.
          </div>
        )}
      </div>

      {/* RP Cover Summary */}
      <RPCoverSummary days={days} weekEntries={weekEntries} />

      {/* Shift Modal */}
      <ShiftModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        entry={editEntry}
        staffList={sortedStaff}
        date={presetDate}
        presetStaffId={presetStaffId}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  )
}

const navBtnStyle = {
  width: 32, height: 32, borderRadius: 8,
  background: 'var(--ec-card, #fff)',
  border: '1px solid var(--ec-div, #e2e8f0)',
  color: 'var(--ec-t1)',
  fontSize: 18, fontWeight: 600,
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: "'Inter', sans-serif",
}
