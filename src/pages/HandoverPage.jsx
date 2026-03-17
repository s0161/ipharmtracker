import { useState, useRef, useCallback } from 'react'
import { useHandover } from '../hooks/useHandover'
import { useUser } from '../contexts/UserContext'
import { useSupabase } from '../hooks/useSupabase'
import { useToast } from '../components/Toast'
import { getStaffInitials } from '../utils/rotationManager'

// ── Blue accent palette ──
const BLUE = '#0073e6'
const BLUE_DARK = '#005bb5'
const BLUE_LIGHT = '#eff6ff'
const BLUE_BORDER = 'rgba(0,115,230,0.2)'

// ── Textarea section configs ──
const NOTE_SECTIONS = [
  { key: 'outstandingOwings', label: 'Outstanding Owings', color: '#f59e0b', placeholder: 'Any outstanding owings or payments pending...' },
  { key: 'patientCallbacks', label: 'Patient Callbacks', color: BLUE, placeholder: 'Patients expecting callbacks or follow-ups...' },
  { key: 'deliveriesNote', label: 'Delivery Notes', color: '#10b981', placeholder: 'Pending deliveries, driver notes...' },
  { key: 'cdNotes', label: 'CD Notes', color: '#ef4444', placeholder: 'Controlled drug notes, balance queries...' },
  { key: 'equipmentIssues', label: 'Equipment / Premises', color: '#635bff', placeholder: 'Equipment faults, premises issues...' },
  { key: 'otherNotes', label: 'Other Notes', color: '#8898aa', placeholder: 'Anything else the next shift needs to know...' },
]

// ── Status toggle configs ──
const STATUS_TOGGLES = [
  { key: 'cdBalanceChecked', label: 'CD Balance' },
  { key: 'tempLogged', label: 'Temp Logged' },
  { key: 'rpSignedIn', label: 'RP Signed In' },
  { key: 'deliveriesComplete', label: 'Deliveries Done' },
]

// ── Saved indicator ──
function SavedIndicator({ visible }) {
  return (
    <span
      style={{
        fontSize: 11, color: '#10b981', fontWeight: 600,
        opacity: visible ? 1 : 0, transition: 'opacity 0.3s',
        marginLeft: 8,
      }}
    >
      Saved ✓
    </span>
  )
}

// ── Status Pill ──
function StatusPill({ label, active, onClick, readOnly }) {
  const on = active
  return (
    <button
      onClick={readOnly ? undefined : onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 14px', borderRadius: 20,
        border: on ? '1.5px solid #6ee7b7' : '1.5px solid var(--ec-div, #e2e8f0)',
        background: on ? '#ecfdf5' : 'var(--ec-border, #f1f5f9)',
        color: on ? '#059669' : 'var(--ec-t3, #94a3b8)',
        fontSize: 12, fontWeight: 600, cursor: readOnly ? 'default' : 'pointer',
        transition: 'all 0.2s', fontFamily: "'Inter', sans-serif",
        opacity: readOnly ? 0.85 : 1,
      }}
    >
      <span style={{ fontSize: 13 }}>{on ? '✓' : '○'}</span>
      {label}
    </button>
  )
}

// ── Note Section with auto-save ──
function NoteSection({ section, value, onChange }) {
  const [saved, setSaved] = useState(false)
  const timerRef = useRef(null)

  const handleBlur = useCallback(() => {
    setSaved(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setSaved(false), 2000)
  }, [])

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{ width: 4, height: 18, borderRadius: 2, background: section.color }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ec-t1, #1e293b)', fontFamily: "'Inter', sans-serif" }}>
          {section.label}
        </span>
        <SavedIndicator visible={saved} />
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={handleBlur}
        placeholder={section.placeholder}
        rows={3}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 8,
          border: '1.5px solid var(--ec-div, #e2e8f0)',
          background: 'var(--ec-card, #fff)', color: 'var(--ec-t1, #1e293b)',
          fontSize: 13, fontFamily: "'Inter', sans-serif", resize: 'vertical',
          outline: 'none', transition: 'border-color 0.2s',
          boxSizing: 'border-box',
        }}
        onFocus={e => { e.target.style.borderColor = BLUE }}
        onBlurCapture={e => { e.target.style.borderColor = 'var(--ec-div, #e2e8f0)' }}
      />
    </div>
  )
}

// ── Read-only Modal ──
function HandoverModal({ handover, onClose }) {
  if (!handover) return null

  const dateStr = new Date(handover.shiftDate + 'T12:00:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--ec-card, #fff)', borderRadius: 16,
          width: '90%', maxWidth: 560, maxHeight: '85vh', overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {/* Modal header */}
        <div style={{
          background: `linear-gradient(135deg, ${BLUE_LIGHT} 0%, #dbeafe 100%)`,
          padding: '20px 24px', borderRadius: '16px 16px 0 0',
          borderBottom: `1.5px solid ${BLUE_BORDER}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: BLUE }}>{dateStr}</div>
              <div style={{ fontSize: 12, color: 'var(--ec-t3)', marginTop: 2 }}>
                {handover.shiftType === 'day' ? '☀️ Day Shift' : '🌙 Evening Shift'}
                {' · by '}{handover.createdByName || 'Unknown'}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', fontSize: 20, cursor: 'pointer',
                color: 'var(--ec-t3)', padding: 4,
              }}
            >✕</button>
          </div>
        </div>

        {/* Status pills */}
        <div style={{ padding: '16px 24px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {STATUS_TOGGLES.map(t => (
            <StatusPill key={t.key} label={t.label} active={handover[t.key]} readOnly />
          ))}
        </div>

        {/* Notes */}
        <div style={{ padding: '0 24px 20px' }}>
          {NOTE_SECTIONS.map(s => {
            const val = handover[s.key]
            if (!val) return null
            return (
              <div key={s.key} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 4, height: 16, borderRadius: 2, background: s.color }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ec-t2)' }}>{s.label}</span>
                </div>
                <div style={{
                  fontSize: 13, color: 'var(--ec-t1)', lineHeight: 1.5,
                  padding: '8px 12px', background: 'var(--ec-bg, #f8fafc)',
                  borderRadius: 8, whiteSpace: 'pre-wrap',
                }}>{val}</div>
              </div>
            )
          })}
          {NOTE_SECTIONS.every(s => !handover[s.key]) && (
            <div style={{ fontSize: 13, color: 'var(--ec-t3)', textAlign: 'center', padding: 20 }}>
              No notes were recorded for this shift.
            </div>
          )}
        </div>

        {/* Sign-off info */}
        {handover.signedOff && (
          <div style={{
            padding: '12px 24px 16px', borderTop: '1px solid var(--ec-div)',
            background: 'var(--ec-em-bg)', borderRadius: '0 0 16px 16px',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#059669' }}>
              ✓ Signed off by {handover.signedOffName || 'Unknown'}
              {handover.signedOffAt && (
                <span style={{ fontWeight: 400, color: 'var(--ec-t3)', marginLeft: 6 }}>
                  at {new Date(handover.signedOffAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Recent Handover Row ──
function RecentRow({ handover, onClick }) {
  const dateStr = new Date(handover.shiftDate + 'T12:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short'
  })
  const initials = handover.createdByName ? getStaffInitials(handover.createdByName) : '??'

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        padding: '10px 12px', borderRadius: 10,
        border: '1px solid var(--ec-div, #e2e8f0)',
        background: 'var(--ec-card, #fff)', cursor: 'pointer',
        transition: 'all 0.15s', textAlign: 'left',
        fontFamily: "'Inter', sans-serif",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = BLUE; e.currentTarget.style.background = BLUE_LIGHT }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--ec-div, #e2e8f0)'; e.currentTarget.style.background = 'var(--ec-card, #fff)' }}
    >
      <div style={{
        width: 30, height: 30, borderRadius: '50%', background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%)`,
        color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>{initials}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ec-t1)' }}>{dateStr}</div>
        <div style={{ fontSize: 10, color: 'var(--ec-t3)' }}>
          {handover.createdByName || 'Unknown'}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
          background: handover.shiftType === 'day' ? '#fef9c3' : '#ede9fe',
          color: handover.shiftType === 'day' ? '#a16207' : '#6d28d9',
          textTransform: 'uppercase',
        }}>
          {handover.shiftType === 'day' ? '☀️' : '🌙'} {handover.shiftType}
        </span>
        {handover.signedOff && (
          <span style={{ fontSize: 11, color: '#059669' }}>✓</span>
        )}
      </div>
    </button>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function HandoverPage() {
  const { user } = useUser()
  const toast = useToast()
  const { todayHandover, recentHandovers, loading, createHandover, updateHandover } = useHandover()
  const [modalHandover, setModalHandover] = useState(null)

  // Pre-population: check if temp/rp already logged today
  const today = new Date().toISOString().slice(0, 10)
  const [tempLogs] = useSupabase('temperature_logs', [])
  const [rpLogs] = useSupabase('rp_log', [])
  const tempToday = tempLogs.some(t => t.date === today)
  const rpToday = rpLogs.some(r => r.date === today)

  const handleStart = () => {
    if (!user) return
    createHandover(user.id, user.name, {
      tempLogged: tempToday,
      rpSignedIn: rpToday,
    })
    toast('Handover started', 'success')
  }

  const handleToggle = (key) => {
    if (!todayHandover) return
    updateHandover(todayHandover.id, { [key]: !todayHandover[key] })
  }

  const handleNoteChange = (key, value) => {
    if (!todayHandover) return
    updateHandover(todayHandover.id, { [key]: value })
  }

  const handleSignOff = () => {
    if (!todayHandover || !user) return
    updateHandover(todayHandover.id, {
      signedOff: true,
      signedOffBy: user.id,
      signedOffName: user.name,
      signedOffAt: new Date().toISOString(),
    })
    toast('Handover signed off', 'success', 4000)
  }

  const handleUndoSignOff = () => {
    if (!todayHandover) return
    updateHandover(todayHandover.id, {
      signedOff: false,
      signedOffBy: null,
      signedOffName: null,
      signedOffAt: null,
    })
    toast('Sign-off undone', 'info')
  }

  const formattedDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: 'center', color: 'var(--ec-t3)' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
          <div style={{ fontSize: 13 }}>Loading handover data...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '0 0 40px', fontFamily: "'Inter', sans-serif" }}>
      {/* ── Page Header ── */}
      <div style={{
        background: `linear-gradient(135deg, ${BLUE_LIGHT} 0%, #dbeafe 100%)`,
        border: `1.5px solid ${BLUE_BORDER}`,
        borderRadius: 16, padding: '24px 28px', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `linear-gradient(180deg, ${BLUE} 0%, ${BLUE_DARK} 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 18 }}>📋</span>
              </div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: BLUE }}>Shift Handover</h1>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--ec-t3)', maxWidth: 400 }}>
              End-of-shift notes and incoming briefing for the next team
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ec-t1)' }}>{formattedDate}</div>
            {!todayHandover && (
              <button
                onClick={handleStart}
                style={{
                  marginTop: 8, padding: '8px 20px', borderRadius: 10,
                  background: `linear-gradient(180deg, ${BLUE} 0%, ${BLUE_DARK} 100%)`,
                  color: '#fff', border: 'none', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', transition: 'opacity 0.2s',
                  fontFamily: "'Inter', sans-serif",
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.9' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
              >
                + New Handover
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Two Column Layout ── */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* LEFT — Form */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {!todayHandover ? (
            // ── Start Prompt ──
            <div style={{
              background: `linear-gradient(135deg, ${BLUE_LIGHT} 0%, #dbeafe 100%)`,
              border: `1.5px solid ${BLUE_BORDER}`,
              borderRadius: 16, padding: '48px 32px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
              <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: BLUE }}>
                No Handover Started
              </h2>
              <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--ec-t3)', maxWidth: 320, marginInline: 'auto' }}>
                Create a handover note so the next shift knows what&apos;s outstanding, what&apos;s been completed, and what needs attention.
              </p>
              <button
                onClick={handleStart}
                style={{
                  padding: '10px 28px', borderRadius: 10,
                  background: `linear-gradient(180deg, ${BLUE} 0%, ${BLUE_DARK} 100%)`,
                  color: '#fff', border: 'none', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', transition: 'opacity 0.2s',
                  fontFamily: "'Inter', sans-serif",
                  boxShadow: `0 4px 14px rgba(0,115,230,0.3)`,
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.9' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
              >
                Start Handover
              </button>
            </div>
          ) : (
            // ── Handover Form ──
            <div>
              {/* Status Toggles */}
              <div style={{
                background: 'var(--ec-card, #fff)', borderRadius: 14,
                border: '1px solid var(--ec-div, #e2e8f0)',
                padding: '16px 20px', marginBottom: 16,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ec-t2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Shift Status
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {STATUS_TOGGLES.map(t => (
                    <StatusPill
                      key={t.key}
                      label={t.label}
                      active={todayHandover[t.key]}
                      onClick={() => handleToggle(t.key)}
                    />
                  ))}
                </div>
              </div>

              {/* Note Sections */}
              <div style={{
                background: 'var(--ec-card, #fff)', borderRadius: 14,
                border: '1px solid var(--ec-div, #e2e8f0)',
                padding: '20px 20px 8px', marginBottom: 16,
              }}>
                {NOTE_SECTIONS.map(s => (
                  <NoteSection
                    key={s.key}
                    section={s}
                    value={todayHandover[s.key] || ''}
                    onChange={val => handleNoteChange(s.key, val)}
                  />
                ))}
              </div>

              {/* Sign-off Section */}
              <div style={{
                background: todayHandover.signedOff ? '#ecfdf5' : 'var(--ec-card, #fff)',
                borderRadius: 14,
                border: todayHandover.signedOff ? '1.5px solid #6ee7b7' : '1px solid var(--ec-div, #e2e8f0)',
                padding: '20px 20px',
                transition: 'all 0.3s',
              }}>
                {todayHandover.signedOff ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#059669' }}>
                        ✓ Signed Off
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ec-t3)', marginTop: 2 }}>
                        by {todayHandover.signedOffName || user?.name || 'Unknown'}
                        {todayHandover.signedOffAt && (
                          <> at {new Date(todayHandover.signedOffAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleUndoSignOff}
                      style={{
                        background: 'none', border: 'none', color: BLUE,
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        textDecoration: 'underline', fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Edit Handover
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ec-t1)' }}>Ready to sign off?</div>
                      <div style={{ fontSize: 11, color: 'var(--ec-t3)' }}>
                        Confirm this handover is complete and ready for the next shift
                      </div>
                    </div>
                    <button
                      onClick={handleSignOff}
                      style={{
                        padding: '8px 20px', borderRadius: 10,
                        background: `linear-gradient(180deg, ${BLUE} 0%, ${BLUE_DARK} 100%)`,
                        color: '#fff', border: 'none', fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', transition: 'opacity 0.2s',
                        fontFamily: "'Inter', sans-serif",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '0.9' }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                    >
                      Sign Off Handover
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Recent Handovers */}
        <div style={{ width: 280, flexShrink: 0 }}>
          <div style={{
            background: 'var(--ec-card, #fff)', borderRadius: 14,
            border: '1px solid var(--ec-div, #e2e8f0)',
            overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{
              padding: '14px 16px', borderBottom: '1px solid var(--ec-div, #e2e8f0)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{ width: 4, height: 18, borderRadius: 2, background: BLUE }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ec-t1)' }}>Recent Handovers</span>
            </div>

            {/* List */}
            <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {recentHandovers.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '24px 12px',
                  fontSize: 12, color: 'var(--ec-t3)',
                }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>📭</div>
                  No previous handovers
                </div>
              ) : (
                recentHandovers.map(h => (
                  <RecentRow key={h.id} handover={h} onClick={() => setModalHandover(h)} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Read-only Modal ── */}
      <HandoverModal handover={modalHandover} onClose={() => setModalHandover(null)} />
    </div>
  )
}
