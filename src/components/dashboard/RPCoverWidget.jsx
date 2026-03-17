import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRota, getMonday, getWeekEntries, getRPForDate, formatDate, getWeekDays } from '../../hooks/useRota'

const TEAL = '#0d9488'
const TEAL_DARK = '#0f766e'
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function RPCoverWidget() {
  const navigate = useNavigate()
  const { entries, loading } = useRota()

  const weekStart = useMemo(() => getMonday(new Date()), [])
  const days = useMemo(() => getWeekDays(weekStart).slice(0, 5), [weekStart]) // Mon-Fri only
  const weekEntries = useMemo(() => getWeekEntries(entries, weekStart), [entries, weekStart])

  if (loading) return null

  const coveredDays = days.filter(d => getRPForDate(weekEntries, formatDate(d)))
  const gapCount = days.length - coveredDays.length

  const card = {
    background: 'var(--ec-card, #fff)',
    borderRadius: 14,
    border: '1px solid var(--ec-div, #e2e8f0)',
    overflow: 'hidden',
    fontFamily: "'Inter', sans-serif",
  }

  return (
    <div style={card}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--ec-div, #e2e8f0)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 4, height: 18, borderRadius: 2, background: TEAL }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ec-t1)' }}>RP Cover This Week</span>
        </div>
        <button
          onClick={() => navigate('/rota')}
          style={{
            background: 'none', border: 'none', color: TEAL,
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          View Rota →
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '10px 16px' }}>
        {days.map((day, i) => {
          const dateStr = formatDate(day)
          const rp = getRPForDate(weekEntries, dateStr)
          return (
            <div key={dateStr} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 0',
              borderBottom: i < days.length - 1 ? '1px solid var(--ec-div, #f1f5f9)' : 'none',
            }}>
              <span style={{
                fontSize: 11, fontWeight: 600, color: 'var(--ec-t3)', width: 32,
              }}>
                {DAY_NAMES[i]}
              </span>
              <span style={{
                fontSize: 10, color: 'var(--ec-t3)',
                fontFamily: "'DM Mono', 'SF Mono', monospace",
                width: 18,
              }}>
                {day.getDate()}
              </span>
              {rp ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1 }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#059669', flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ec-t1)' }}>
                    {rp.staffName}
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1 }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#dc2626', flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#dc2626' }}>
                    Unassigned
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 16px',
        borderTop: '1px solid var(--ec-div, #e2e8f0)',
        textAlign: 'center',
      }}>
        {gapCount === 0 ? (
          <span style={{
            fontSize: 11, fontWeight: 600, color: '#059669',
            background: 'var(--ec-em-bg)', padding: '4px 12px', borderRadius: 8,
            border: '1px solid #6ee7b7',
          }}>
            ✓ Full week covered
          </span>
        ) : (
          <span style={{
            fontSize: 11, fontWeight: 600, color: '#d97706',
            background: '#fffbeb', padding: '4px 12px', borderRadius: 8,
            border: '1px solid #fde68a',
          }}>
            ⚠ {gapCount} day{gapCount > 1 ? 's' : ''} without RP cover
          </span>
        )}
      </div>
    </div>
  )
}
