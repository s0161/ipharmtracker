import { useState, useMemo } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import { logAudit } from '../utils/auditLog'
import { useUser } from '../contexts/UserContext'
import {
  generateId,
  formatDate,
  getTrafficLight,
  getTrafficLightLabel,
  CATEGORIES,
} from '../utils/helpers'
import { downloadCsv } from '../utils/exportCsv'
import { useDocumentReminders } from '../hooks/useDocumentReminders'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'
import { useConfirm } from '../components/ConfirmDialog'
import Avatar from '../components/Avatar'

// Inter font loaded via index.html

const DM = "'Inter', sans-serif"
const MONO = "'DM Mono', monospace"
const CARD = { background: 'var(--bg-card)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-card)' }

// ─── Category groupings ───
const CATEGORY_GROUPS = [
  { key: 'sops', label: 'SOPs', types: ['SOP', 'Policy'] },
  { key: 'registrations', label: 'Registrations', types: ['Registration', 'DBS Check'] },
  { key: 'contracts', label: 'Contracts', types: ['Contract', 'Insurance'] },
  { key: 'certificates', label: 'Certificates', types: ['Certificate', 'Training', 'Risk Assessment', 'MHRA Alert'] },
  { key: 'other', label: 'Other', types: ['Staff', 'Other'] },
]

// ─── RAG status helper ───
function getDocStatus(expiryDate) {
  if (!expiryDate) return { key: 'expired', label: 'No date', bg: '#fef2f2', border: '#fecaca', color: '#dc2626', barColor: '#dc2626' }
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const exp = new Date(expiryDate); exp.setHours(0, 0, 0, 0)
  const days = Math.ceil((exp - now) / 864e5)
  if (days < 0) return { key: 'expired', label: `${Math.abs(days)}d overdue`, bg: '#fef2f2', border: '#fecaca', color: '#dc2626', barColor: '#dc2626', days }
  if (days <= 14) return { key: 'critical', label: `${days}d left`, bg: '#fef2f2', border: '#fecaca', color: '#dc2626', barColor: '#dc2626', days }
  if (days <= 30) return { key: 'due-soon', label: `${days}d left`, bg: '#fffbeb', border: '#fde68a', color: '#d97706', barColor: '#d97706', days }
  if (days <= 90) return { key: 'upcoming', label: `in ${days}d`, bg: '#eff6ff', border: '#bfdbfe', color: '#2563eb', barColor: '#2563eb', days }
  return { key: 'valid', label: `${days}d left`, bg: '#f0fdf4', border: '#d1fae5', color: '#059669', barColor: '#059669', days }
}

function getLifetimePercent(issueDate, expiryDate) {
  if (!issueDate || !expiryDate) return 0
  const start = new Date(issueDate).getTime()
  const end = new Date(expiryDate).getTime()
  const now = Date.now()
  const total = end - start
  if (total <= 0) return 100
  const elapsed = now - start
  return Math.max(0, Math.min(100, (elapsed / total) * 100))
}

const emptyForm = {
  documentName: '',
  category: '',
  owner: '',
  issueDate: '',
  expiryDate: '',
  notes: '',
}

export default function DocumentTracker() {
  const { user } = useUser()
  const [documents, setDocuments, loading] = useSupabase('documents', [])
  const { reminders: docReminders } = useDocumentReminders(documents)
  const [staffMembers] = useSupabase('staff_members', [], { valueField: 'name' })
  const showToast = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [errors, setErrors] = useState({})
  const [tab, setTab] = useState('category')
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [categorySearch, setCategorySearch] = useState('')

  // Deduplicate by document name (keep most recent by createdAt)
  const uniqueDocs = useMemo(() => {
    const map = new Map()
    documents.forEach(d => {
      const existing = map.get(d.documentName)
      if (!existing || new Date(d.createdAt) > new Date(existing.createdAt)) {
        map.set(d.documentName, d)
      }
    })
    return [...map.values()]
  }, [documents])

  // ─── Stats ───
  const stats = useMemo(() => {
    const now = new Date(); now.setHours(0, 0, 0, 0)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    let expired = 0, expiringMonth = 0, valid = 0
    uniqueDocs.forEach(d => {
      if (!d.expiryDate) { expired++; return }
      const exp = new Date(d.expiryDate); exp.setHours(0, 0, 0, 0)
      if (exp < now) expired++
      else if (exp <= monthEnd) expiringMonth++
      else valid++
    })
    return { total: uniqueDocs.length, expired, expiringMonth, valid }
  }, [uniqueDocs])

  // ─── CRUD handlers (preserved) ───
  const openAdd = () => {
    setForm(emptyForm)
    setEditingId(null)
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (doc) => {
    setForm({
      documentName: doc.documentName,
      category: doc.category,
      owner: doc.owner,
      issueDate: doc.issueDate,
      expiryDate: doc.expiryDate,
      notes: doc.notes,
    })
    setEditingId(doc.id)
    setErrors({})
    setModalOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const newErrors = {}
    if (!form.documentName.trim()) newErrors.documentName = 'Document name is required'
    if (!form.category) newErrors.category = 'Category is required'
    if (!form.expiryDate) newErrors.expiryDate = 'Expiry date is required'
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setErrors({})

    if (editingId) {
      setDocuments(
        documents.map((d) => (d.id === editingId ? { ...d, ...form } : d))
      )
      logAudit('Updated', `Document: ${form.documentName}`, 'Documents', user?.name)
      showToast('Document updated')
    } else {
      setDocuments([
        ...documents,
        { id: generateId(), ...form, createdAt: new Date().toISOString() },
      ])
      logAudit('Created', `Document: ${form.documentName}`, 'Documents', user?.name)
      showToast('Document added')
    }
    setModalOpen(false)
  }

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Delete document?',
      message: 'Are you sure you want to delete this document? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    })
    if (!ok) return
    const doc = documents.find((d) => d.id === id)
    setDocuments(documents.filter((d) => d.id !== id))
    logAudit('Deleted', `Document: ${doc?.documentName || id}`, 'Documents', user?.name)
    showToast('Document deleted', 'info')
  }

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleCsvDownload = () => {
    const headers = ['Status', 'Document Name', 'Category', 'Owner', 'Issue Date', 'Expiry / Review', 'Notes']
    const rows = uniqueDocs.map((d) => [
      getTrafficLightLabel(getTrafficLight(d.expiryDate)),
      d.documentName,
      d.category,
      d.owner || '',
      d.issueDate || '',
      d.expiryDate || '',
      d.notes || '',
    ])
    downloadCsv('documents', headers, rows)
  }

  // ─── Pill button helper ───
  const Pill = ({ active, label, onClick }) => (
    <button onClick={onClick} style={{
      padding: '4px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600, fontFamily: DM,
      border: active ? '1.5px solid #059669' : '1px solid var(--border-card)',
      background: active ? '#059669' : 'transparent',
      color: active ? '#fff' : 'var(--text-secondary)',
      cursor: 'pointer', transition: 'all 0.15s',
    }}>{label}</button>
  )

  // ─── Grouped docs for category tab ───
  const groupedDocs = useMemo(() => {
    const q = categorySearch.toLowerCase()
    return CATEGORY_GROUPS.map(group => {
      let docs = uniqueDocs.filter(d => group.types.includes(d.category))
      if (q) {
        docs = docs.filter(d =>
          (d.documentName || '').toLowerCase().includes(q) ||
          (d.owner || '').toLowerCase().includes(q) ||
          (d.category || '').toLowerCase().includes(q)
        )
      }
      const sorted = [...docs].sort((a, b) => {
        const sa = getDocStatus(a.expiryDate)
        const sb = getDocStatus(b.expiryDate)
        if (sa.key === 'expired' && sb.key !== 'expired') return -1
        if (sb.key === 'expired' && sa.key !== 'expired') return 1
        return (sa.days ?? -9999) - (sb.days ?? -9999)
      })
      return { ...group, docs: sorted }
    }).filter(g => g.docs.length > 0)
  }, [uniqueDocs, categorySearch])

  // ─── Timeline data ───
  const timelineData = useMemo(() => {
    const now = new Date()
    const months = []
    for (let i = 0; i < 12; i++) {
      const m = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const mEnd = new Date(m.getFullYear(), m.getMonth() + 1, 0)
      const docs = uniqueDocs.filter(d => {
        if (!d.expiryDate) return false
        const exp = new Date(d.expiryDate)
        return exp.getFullYear() === m.getFullYear() && exp.getMonth() === m.getMonth()
      })
      months.push({
        label: m.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
        fullLabel: m.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
        docs,
        isPast: mEnd < now,
      })
    }
    return months
  }, [uniqueDocs])

  // ─── Calendar data ───
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1)
    const lastDay = new Date(calYear, calMonth + 1, 0)
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const days = []
    const startPad = (firstDay.getDay() + 6) % 7
    for (let i = 0; i < startPad; i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(calYear, calMonth, d); date.setHours(0, 0, 0, 0)
      const docs = uniqueDocs.filter(doc => {
        if (!doc.expiryDate) return false
        const exp = new Date(doc.expiryDate); exp.setHours(0, 0, 0, 0)
        return exp.getTime() === date.getTime()
      })
      days.push({ day: d, date, isToday: date.getTime() === today.getTime(), docs })
    }
    return days
  }, [calMonth, calYear, uniqueDocs])

  const calMonthLabel = new Date(calYear, calMonth).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  // ─── Input style ───
  const inputStyle = {
    width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13, fontFamily: DM,
    background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)',
    outline: 'none',
  }
  const errorInputStyle = { ...inputStyle, borderColor: '#dc2626' }
  const labelStyle = { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }

  if (loading) return <div style={{ padding: 24 }}><div style={{ ...CARD, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontFamily: DM, fontSize: 13 }}>Loading renewals…</div></div>

  return (
    <div style={{ fontFamily: DM }}>
      {/* ─── PAGE HEADER ─── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>Renewals</h1>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>Track documents, registrations and renewals. Status updates automatically.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={handleCsvDownload} style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, fontFamily: DM,
              background: 'var(--bg-card)', border: '1px solid var(--border-card)', color: 'var(--text-secondary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              CSV
            </button>
            <button onClick={openAdd} style={{
              padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: DM,
              background: '#059669', color: '#fff', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>＋ Add Document</button>
          </div>
        </div>
      </div>

      {/* ─── STATS BAR ─── */}
      <div style={{ ...CARD, padding: '8px 16px', display: 'flex', gap: 0, marginBottom: 14 }}>
        {[
          { label: 'Total', value: stats.total, accent: '#3b82f6' },
          { label: 'Expired', value: stats.expired, color: stats.expired > 0 ? '#ef4444' : undefined, accent: '#ef4444' },
          { label: 'Expiring this month', value: stats.expiringMonth, color: stats.expiringMonth > 0 ? '#d97706' : undefined, accent: '#d97706' },
          { label: 'Valid', value: stats.valid, color: stats.valid > 0 ? '#059669' : undefined, accent: '#059669' },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', padding: '2px 12px', borderLeft: `3px solid ${s.accent}` }}>
            <div style={{ fontFamily: MONO, fontSize: 16, fontWeight: 800, color: s.color || 'var(--text-primary)' }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ─── ALERT BANNER ─── */}
      {docReminders.length > 0 && !bannerDismissed && (() => {
        const hasCritical = docReminders.some(r => r.type === 'critical')
        return (
          <div style={{
            ...CARD,
            marginBottom: 14,
            background: hasCritical ? '#fef2f2' : '#fffbeb',
            border: `1px solid ${hasCritical ? '#fecaca' : '#fde68a'}`,
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 2 }}>🔴</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: hasCritical ? '#dc2626' : '#d97706', marginBottom: 6 }}>
                {docReminders.length} document{docReminders.length !== 1 ? 's' : ''} require attention
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {docReminders.slice(0, 6).map(r => (
                  <span key={r.id} style={{
                    fontSize: 10, fontWeight: 600, fontFamily: MONO,
                    padding: '2px 8px', borderRadius: 10,
                    background: r.type === 'critical' ? 'rgba(220,38,38,0.1)' : 'rgba(217,119,6,0.1)',
                    color: r.type === 'critical' ? '#dc2626' : '#d97706',
                  }}>
                    {r.docName} ({r.daysLeft <= 0 ? 'expired' : `${r.daysLeft}d`})
                  </span>
                ))}
                {docReminders.length > 6 && (
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>+{docReminders.length - 6} more</span>
                )}
              </div>
            </div>
            <button onClick={() => setBannerDismissed(true)} style={{
              background: 'none', border: 'none', cursor: 'pointer', fontSize: 16,
              color: hasCritical ? '#dc2626' : '#d97706', padding: 0, lineHeight: 1, flexShrink: 0,
            }}>×</button>
          </div>
        )
      })()}

      {/* ─── TABS ─── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {[['category', 'By Category'], ['timeline', 'Timeline'], ['calendar', 'Calendar']].map(([key, label]) => (
          <Pill key={key} label={label} active={tab === key} onClick={() => setTab(key)} />
        ))}
      </div>

      {/* ═══ TAB 1 — BY CATEGORY ═══ */}
      {tab === 'category' && (
        <div>
          <div style={{ marginBottom: 12 }}>
            <input
              type="text"
              placeholder="Search documents by name, owner, or category..."
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              style={{
                fontFamily: DM, width: '100%', maxWidth: 400,
                background: 'var(--input-bg, var(--bg-card))', border: '1px solid var(--border-card)',
                borderRadius: 8, padding: '8px 12px', fontSize: 12,
                color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          {groupedDocs.length === 0 ? (
            <div style={{ ...CARD, textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>
              No documents tracked yet. Click "＋ Add Document" to get started.
            </div>
          ) : groupedDocs.map(group => (
            <div key={group.key} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>{group.label}</span>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 8px', borderRadius: 10, background: 'var(--border-card)', color: 'var(--text-secondary)' }}>{group.docs.length}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                {group.docs.map(doc => {
                  const status = getDocStatus(doc.expiryDate)
                  const lifetime = getLifetimePercent(doc.issueDate, doc.expiryDate)
                  const isExpired = status.key === 'expired' || status.key === 'critical'
                  return (
                    <div key={doc.id} style={{
                      ...CARD,
                      position: 'relative',
                      paddingLeft: 20,
                      opacity: status.key === 'expired' ? 0.85 : 1,
                      transition: 'box-shadow 0.2s',
                      cursor: 'default',
                    }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(5,150,105,0.12)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-card)'}
                    >
                      {/* Left accent bar */}
                      <div style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
                        borderRadius: '12px 0 0 12px', background: status.barColor,
                      }} />

                      {/* Row 1: Name + status pill */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, flex: 1, marginRight: 8 }}>{doc.documentName}</div>
                        <span style={{
                          fontSize: 9, fontWeight: 700, fontFamily: MONO,
                          padding: '2px 8px', borderRadius: 10, flexShrink: 0,
                          background: status.bg, color: status.color, border: `1px solid ${status.border}`,
                        }}>{status.label}</span>
                      </div>

                      {/* Row 2: Category + owner */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <span style={{
                          fontSize: 9, fontWeight: 600, padding: '1px 7px', borderRadius: 8,
                          background: 'var(--border-card)', color: 'var(--text-secondary)',
                        }}>{doc.category}</span>
                        {doc.owner && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Avatar name={doc.owner} size={20} />
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{doc.owner}</span>
                          </div>
                        )}
                      </div>

                      {/* Row 3: Dates */}
                      <div style={{ fontSize: 10, fontFamily: MONO, color: 'var(--text-muted)', marginBottom: 8 }}>
                        {doc.issueDate ? formatDate(doc.issueDate) : '—'} → {doc.expiryDate ? formatDate(doc.expiryDate) : '—'}
                      </div>

                      {/* Progress bar */}
                      <div style={{ height: 4, background: 'var(--border-card)', borderRadius: 2, marginBottom: 4, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 2, width: `${Math.min(lifetime, 100)}%`,
                          background: status.barColor, transition: 'width 0.3s',
                        }} />
                      </div>
                      <div style={{ fontSize: 9, fontFamily: MONO, color: status.color, marginBottom: 6 }}>
                        {status.key === 'expired' ? `${Math.abs(status.days || 0)}d overdue` : `${status.days || 0} days remaining`}
                      </div>

                      {/* Notes */}
                      {doc.notes && (
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 6 }}>{doc.notes}</div>
                      )}

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(doc)} style={{
                          fontSize: 11, fontWeight: 500, fontFamily: DM, padding: '3px 10px', borderRadius: 6,
                          background: 'transparent', border: '1px solid var(--border-card)', color: 'var(--text-secondary)',
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}>Edit</button>
                        <button onClick={() => handleDelete(doc.id)} style={{
                          fontSize: 11, fontWeight: 500, fontFamily: DM, padding: '3px 10px', borderRadius: 6,
                          background: 'transparent', border: '1px solid #fecaca', color: '#dc2626',
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}>Delete</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ TAB 2 — TIMELINE ═══ */}
      {tab === 'timeline' && (
        <div style={{ ...CARD, overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: 0, minWidth: 12 * 140 }}>
            {timelineData.map((month, i) => (
              <div key={i} style={{
                flex: '0 0 140px', borderRight: '1px solid var(--border-card)', padding: '8px 10px',
                opacity: month.isPast ? 0.5 : 1,
              }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                  color: 'var(--text-muted)', marginBottom: 8, textAlign: 'center',
                }}>{month.label}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {month.docs.length === 0 && (
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>—</div>
                  )}
                  {month.docs.map(doc => {
                    const status = getDocStatus(doc.expiryDate)
                    return (
                      <div key={doc.id} style={{
                        fontSize: 10, fontWeight: 600, fontFamily: DM,
                        padding: '4px 8px', borderRadius: 6,
                        background: status.bg, color: status.color, border: `1px solid ${status.border}`,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        cursor: 'pointer',
                      }} title={`${doc.documentName} — expires ${formatDate(doc.expiryDate)}`}
                      onClick={() => openEdit(doc)}
                      >
                        {doc.documentName}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ TAB 3 — CALENDAR ═══ */}
      {tab === 'calendar' && (
        <div style={CARD}>
          {/* Month navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1) } else setCalMonth(calMonth - 1) }} style={{
              background: 'none', border: '1px solid var(--border-card)', borderRadius: 6, padding: '4px 10px',
              fontSize: 12, cursor: 'pointer', color: 'var(--text-secondary)',
            }}>←</button>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{calMonthLabel}</span>
            <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1) } else setCalMonth(calMonth + 1) }} style={{
              background: 'none', border: '1px solid var(--border-card)', borderRadius: 6, padding: '4px 10px',
              fontSize: 12, cursor: 'pointer', color: 'var(--text-secondary)',
            }}>→</button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {calendarDays.map((day, i) => {
              if (!day) return <div key={`pad-${i}`} />
              const hasDocs = day.docs.length > 0
              const worstStatus = hasDocs ? day.docs.reduce((worst, doc) => {
                const s = getDocStatus(doc.expiryDate)
                const priority = { expired: 0, critical: 1, 'due-soon': 2, upcoming: 3, valid: 4 }
                return (priority[s.key] ?? 4) < (priority[worst.key] ?? 4) ? s : worst
              }, getDocStatus(day.docs[0].expiryDate)) : null
              return (
                <div key={day.day} style={{
                  position: 'relative', textAlign: 'center', padding: '6px 2px', borderRadius: 6,
                  background: day.isToday ? '#f0fdf4' : 'transparent',
                  border: day.isToday ? '1px solid #d1fae5' : '1px solid transparent',
                  cursor: hasDocs ? 'pointer' : 'default',
                  minHeight: 36,
                }}
                title={hasDocs ? day.docs.map(d => d.documentName).join(', ') : ''}
                >
                  <div style={{ fontSize: 11, fontWeight: day.isToday ? 700 : 400, color: day.isToday ? '#059669' : 'var(--text-primary)' }}>{day.day}</div>
                  {hasDocs && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginTop: 2 }}>
                      {day.docs.slice(0, 3).map((doc, j) => {
                        const s = getDocStatus(doc.expiryDate)
                        return <div key={j} style={{ width: 5, height: 5, borderRadius: '50%', background: s.barColor }} />
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 12, marginTop: 12, justifyContent: 'center' }}>
            {[
              { color: '#dc2626', label: 'Expired/Critical' },
              { color: '#d97706', label: 'Due Soon' },
              { color: '#2563eb', label: 'Upcoming' },
              { color: '#059669', label: 'Valid' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: l.color }} />
                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── MODAL FORM ─── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Document' : 'Add Document'}
      >
        <form onSubmit={handleSubmit} style={{ fontFamily: DM }}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Document Name *</label>
            <input
              type="text"
              style={errors.documentName ? errorInputStyle : inputStyle}
              placeholder="e.g. GPhC Registration"
              value={form.documentName}
              onChange={(e) => { update('documentName')(e); setErrors(prev => ({ ...prev, documentName: undefined })) }}
            />
            {errors.documentName && <p style={{ fontSize: 11, color: '#dc2626', margin: '4px 0 0' }}>{errors.documentName}</p>}
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Category *</label>
            <select
              style={errors.category ? errorInputStyle : inputStyle}
              value={form.category}
              onChange={(e) => { update('category')(e); setErrors(prev => ({ ...prev, category: undefined })) }}
            >
              <option value="">Select category...</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <p style={{ fontSize: 11, color: '#dc2626', margin: '4px 0 0' }}>{errors.category}</p>}
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Owner / Responsible Person</label>
            {staffMembers.length === 0 ? (
              <input
                type="text"
                style={inputStyle}
                placeholder="Enter name or add staff in Settings"
                value={form.owner}
                onChange={update('owner')}
              />
            ) : (
              <select style={inputStyle} value={form.owner} onChange={update('owner')}>
                <option value="">Select person...</option>
                {staffMembers.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Issue Date</label>
              <input type="date" style={inputStyle} value={form.issueDate} onChange={update('issueDate')} />
            </div>
            <div>
              <label style={labelStyle}>Expiry / Review Date *</label>
              <input
                type="date"
                style={errors.expiryDate ? errorInputStyle : inputStyle}
                value={form.expiryDate}
                onChange={(e) => { update('expiryDate')(e); setErrors(prev => ({ ...prev, expiryDate: undefined })) }}
              />
              {errors.expiryDate && <p style={{ fontSize: 11, color: '#dc2626', margin: '4px 0 0' }}>{errors.expiryDate}</p>}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Notes</label>
            <textarea
              style={{ ...inputStyle, resize: 'none', minHeight: 60 }}
              placeholder="Optional notes..."
              value={form.notes}
              onChange={update('notes')}
              rows={3}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 14, borderTop: '1px solid var(--border-card)' }}>
            <button type="button" onClick={() => setModalOpen(false)} style={{
              padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 500, fontFamily: DM,
              background: 'var(--bg-card)', border: '1px solid var(--border-card)', color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}>Cancel</button>
            <button type="submit" style={{
              padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: DM,
              background: '#059669', color: '#fff', border: 'none', cursor: 'pointer',
            }}>{editingId ? 'Save Changes' : 'Add Document'}</button>
          </div>
        </form>
      </Modal>
      {ConfirmDialog}
    </div>
  )
}
