import { useNavigate } from 'react-router-dom'
import { useHandover } from '../../hooks/useHandover'

const BLUE = '#0073e6'
const BLUE_DARK = '#005bb5'

const STATUS_KEYS = [
  { key: 'cdBalanceChecked', label: 'CD' },
  { key: 'tempLogged', label: 'Temp' },
  { key: 'rpSignedIn', label: 'RP' },
  { key: 'deliveriesComplete', label: 'Deliv' },
]

export default function HandoverWidget() {
  const navigate = useNavigate()
  const { todayHandover, loading } = useHandover()

  if (loading) return null

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
          <div style={{ width: 4, height: 18, borderRadius: 2, background: BLUE }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ec-t1)' }}>Today's Handover</span>
        </div>
        <button
          onClick={() => navigate('/handover')}
          style={{
            background: 'none', border: 'none', color: BLUE,
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          View All →
        </button>
      </div>

      <div style={{ padding: '14px 16px' }}>
        {!todayHandover ? (
          // No handover
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: 12, color: 'var(--ec-t3)', marginBottom: 10 }}>No handover started</div>
            <button
              onClick={() => navigate('/handover')}
              style={{
                padding: '7px 18px', borderRadius: 8,
                background: `linear-gradient(180deg, ${BLUE} 0%, ${BLUE_DARK} 100%)`,
                color: '#fff', border: 'none', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: "'Inter', sans-serif",
              }}
            >
              Start Handover →
            </button>
          </div>
        ) : todayHandover.signedOff ? (
          // Signed off
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
              {STATUS_KEYS.map(s => (
                <span key={s.key} style={{
                  fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 10,
                  background: todayHandover[s.key] ? '#ecfdf5' : 'var(--ec-border, #f1f5f9)',
                  color: todayHandover[s.key] ? '#059669' : 'var(--ec-t3)',
                  border: todayHandover[s.key] ? '1px solid #6ee7b7' : '1px solid var(--ec-div)',
                }}>
                  {todayHandover[s.key] ? '✓' : '○'} {s.label}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#059669' }}>
              ✓ Signed off by {todayHandover.signedOffName || 'Unknown'}
            </div>
            {todayHandover.signedOffAt && (
              <div style={{ fontSize: 10, color: 'var(--ec-t3)', marginTop: 2 }}>
                at {new Date(todayHandover.signedOffAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        ) : (
          // In progress
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
              {STATUS_KEYS.map(s => (
                <span key={s.key} style={{
                  fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 10,
                  background: todayHandover[s.key] ? '#ecfdf5' : 'var(--ec-border, #f1f5f9)',
                  color: todayHandover[s.key] ? '#059669' : 'var(--ec-t3)',
                  border: todayHandover[s.key] ? '1px solid #6ee7b7' : '1px solid var(--ec-div)',
                }}>
                  {todayHandover[s.key] ? '✓' : '○'} {s.label}
                </span>
              ))}
            </div>

            {/* Preview first non-empty note */}
            {(() => {
              const noteKeys = ['outstandingOwings', 'patientCallbacks', 'deliveriesNote', 'cdNotes', 'equipmentIssues', 'otherNotes']
              const firstNote = noteKeys.find(k => todayHandover[k])
              if (firstNote) {
                return (
                  <div style={{
                    fontSize: 11, color: 'var(--ec-t2)', lineHeight: 1.4,
                    marginBottom: 10, overflow: 'hidden',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  }}>
                    {todayHandover[firstNote]}
                  </div>
                )
              }
              return null
            })()}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 8,
                background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a',
              }}>
                Not yet signed off
              </span>
              <button
                onClick={() => navigate('/handover')}
                style={{
                  background: 'none', border: 'none', color: BLUE,
                  fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Complete →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
