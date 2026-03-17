import { useMemo } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import { getStaffInitials } from '../utils/rotationManager'

const ROLE_BADGE = {
  superintendent: { bg: '#ecfdf5', text: '#059669' },
  pharmacist:     { bg: '#ecfdf5', text: '#059669' },
  manager:        { bg: '#ecfdf5', text: '#059669' },
  technician:     { bg: '#eff6ff', text: '#1d4ed8' },
  dispenser:      { bg: '#f5f3ff', text: '#5b21b6' },
  driver:         { bg: '#fef3c7', text: '#92400e' },
  stock_assistant:{ bg: '#f0fdf4', text: '#166534' },
  aca:            { bg: '#fff7ed', text: '#9a3412' },
  staff:          { bg: '#f8fafc', text: '#475569' },
}

const AVATAR_GRADIENT = {
  superintendent: ['#f59e0b', '#d97706'],
  manager:        ['#10b981', '#059669'],
  pharmacist:     ['#10b981', '#059669'],
  technician:     ['#0073e6', '#0284c7'],
  dispenser:      ['#635bff', '#4f46e5'],
  driver:         ['#f59e0b', '#d97706'],
  stock_assistant:['#0d9488', '#0f766e'],
  aca:            ['#f97316', '#ea580c'],
  staff:          ['#94a3b8', '#64748b'],
}

function getRoleBadge(role) {
  return ROLE_BADGE[role] || ROLE_BADGE.staff
}

function getAvatarGradient(role) {
  const [from, to] = AVATAR_GRADIENT[role] || AVATAR_GRADIENT.staff
  return `linear-gradient(135deg, ${from} 0%, ${to} 100%)`
}

function formatRole(role) {
  if (role === 'superintendent') return 'Superintendent'
  if (role === 'stock_assistant') return 'Stock Assistant'
  if (role === 'aca') return 'ACA'
  return (role || 'staff').charAt(0).toUpperCase() + (role || 'staff').slice(1)
}

export default function StaffDirectory() {
  const [staff, , loading] = useSupabase('staff_members', [])

  const sortedStaff = useMemo(() => {
    const order = ['superintendent', 'manager', 'pharmacist', 'technician', 'dispenser', 'stock_assistant', 'aca', 'driver', 'staff']
    return [...(staff || [])].sort((a, b) => {
      const ai = order.indexOf(a.role || 'staff')
      const bi = order.indexOf(b.role || 'staff')
      if (ai !== bi) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
      return (a.name || '').localeCompare(b.name || '')
    })
  }, [staff])

  const stats = useMemo(() => {
    const s = staff || []
    const pharmacists = s.filter(m => m.role === 'superintendent' || m.role === 'pharmacist').length
    const dispensers = s.filter(m => m.role === 'dispenser').length
    return { total: s.length, pharmacists, dispensers, other: s.length - pharmacists - dispensers }
  }, [staff])

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--ec-t3)', fontSize: 14 }}>
        Loading staff directory...
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 0 32px' }}>
      {/* Header panel */}
      <div style={{
        background: 'linear-gradient(135deg, #f8fffd 0%, #f0fdfa 100%)',
        border: '1.5px solid rgba(13,148,136,0.2)',
        borderRadius: 16,
        padding: '20px 24px',
        marginBottom: 20,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 4,
          background: 'linear-gradient(90deg, #0d9488 0%, #0f766e 100%)',
        }} />
        <div>
          <h1 style={{
            fontSize: 20, fontWeight: 800, color: 'var(--ec-t1)',
            margin: 0, fontFamily: "'Inter', sans-serif",
          }}>
            Staff Directory
          </h1>
          <p style={{
            fontSize: 12, color: 'var(--ec-t3)', margin: '4px 0 0',
            fontFamily: "'Inter', sans-serif",
          }}>
            Team profiles, roles &amp; contact details
          </p>
        </div>
      </div>

      {/* Summary pills */}
      <div style={{
        display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap',
      }}>
        {[
          { label: 'Total Staff', value: stats.total, color: '#0d9488' },
          { label: 'Pharmacists', value: stats.pharmacists, color: '#059669' },
          { label: 'Dispensers', value: stats.dispensers, color: '#5b21b6' },
          { label: 'Other', value: stats.other, color: '#64748b' },
        ].map(pill => (
          <div key={pill.label} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--ec-card, #fff)',
            border: '1px solid var(--ec-div, #e2e8f0)',
            borderRadius: 10,
            padding: '8px 16px',
          }}>
            <span style={{
              fontSize: 18, fontWeight: 800, color: pill.color,
              fontFamily: "'DM Mono', 'SF Mono', monospace",
            }}>
              {pill.value}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ec-t3)' }}>
              {pill.label}
            </span>
          </div>
        ))}
      </div>

      {/* Staff grid */}
      {sortedStaff.length === 0 ? (
        <div style={{
          padding: 40, textAlign: 'center',
          background: 'var(--ec-card, #fff)',
          border: '1px solid var(--ec-div, #e2e8f0)',
          borderRadius: 14,
          color: 'var(--ec-t3)', fontSize: 13,
        }}>
          No staff records found — add staff in Settings
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 14,
        }}>
          {sortedStaff.map(member => {
            const role = member.role || 'staff'
            const isSuperintendent = role === 'superintendent'
            const badge = getRoleBadge(role)

            return (
              <div key={member.id} style={{
                background: 'var(--ec-card, #fff)',
                border: isSuperintendent
                  ? '1.5px solid rgba(16,185,129,0.3)'
                  : '1px solid var(--ec-div, #e2e8f0)',
                borderRadius: 14,
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                transition: 'box-shadow 0.15s, transform 0.15s',
                cursor: 'default',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.transform = 'none'
              }}
              >
                {/* Avatar */}
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: getAvatarGradient(role),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: '#fff',
                  flexShrink: 0,
                  boxShadow: isSuperintendent
                    ? '0 2px 10px rgba(245,158,11,0.35)'
                    : '0 2px 8px rgba(0,0,0,0.08)',
                }}>
                  {getStaffInitials(member.name)}
                </div>

                {/* Info */}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 700, color: 'var(--ec-t1)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    {member.name}
                  </div>
                  {isSuperintendent && (
                    <div style={{
                      fontSize: 10, color: '#d97706', fontWeight: 600,
                      marginTop: 1, fontFamily: "'Inter', sans-serif",
                    }}>
                      Superintendent Pharmacist
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    {/* Role badge */}
                    <span style={{
                      fontSize: 10, fontWeight: 600,
                      padding: '2px 8px', borderRadius: 8,
                      background: badge.bg, color: badge.text,
                    }}>
                      {formatRole(role)}
                    </span>
                    {/* Manager badge */}
                    {member.isManager && (
                      <span style={{
                        fontSize: 10, fontWeight: 600,
                        padding: '2px 8px', borderRadius: 8,
                        background: 'var(--ec-em-bg)', color: '#059669',
                      }}>
                        Manager
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
