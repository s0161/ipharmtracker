// ─── Overview Tab ───
// Care home details, edit capability, patient summary, recent activity timeline

import { useState, useMemo } from 'react'
import { PACK_TYPES } from '../../data/careHomeData'
import NewCareHomeForm from './NewCareHomeForm'

export default function OverviewTab({ home, patients, deliveries, notes, marIssues, isElevated, onUpdateHome }) {
  const [editing, setEditing] = useState(false)

  // Pack type distribution
  const packCounts = useMemo(() => {
    const counts = {}
    PACK_TYPES.forEach(t => { counts[t] = 0 })
    ;(patients || []).forEach(p => {
      const t = p.packType || p.pack_type || 'Blister'
      counts[t] = (counts[t] || 0) + 1
    })
    return counts
  }, [patients])

  const totalPatients = (patients || []).length
  const activePatients = (patients || []).filter(p => p.isActive !== false && p.is_active !== false).length

  // Recent activity: combine last 5 of deliveries + notes + issues
  const recentActivity = useMemo(() => {
    const items = []
    ;(deliveries || []).slice(0, 5).forEach(d => items.push({
      type: 'delivery',
      date: d.deliveryDate || d.delivery_date,
      label: `Delivery — ${d.status || 'Scheduled'}`,
      detail: d.deliveredBy || d.delivered_by ? `by ${d.deliveredBy || d.delivered_by}` : '',
    }))
    ;(notes || []).slice(0, 5).forEach(n => items.push({
      type: 'note',
      date: n.noteDate || n.note_date || (n.createdAt || n.created_at || '').slice(0, 10),
      label: `${n.noteType || n.note_type || 'Note'}: ${(n.content || '').slice(0, 60)}`,
      detail: n.createdBy || n.created_by || '',
    }))
    ;(marIssues || []).slice(0, 5).forEach(i => items.push({
      type: 'issue',
      date: i.issueDate || i.issue_date,
      label: `MAR Issue — ${i.issueType || i.issue_type}`,
      detail: i.reportedBy || i.reported_by || '',
    }))
    items.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    return items.slice(0, 8)
  }, [deliveries, notes, marIssues])

  const handleSave = async (data) => {
    await onUpdateHome(home.id, data)
    setEditing(false)
  }

  const TYPE_COLORS = { delivery: 'bg-blue-500', note: 'bg-amber-500', issue: 'bg-red-500' }

  return (
    <div className="space-y-6">
      {/* Details card */}
      <div className="p-4 bg-ec-card border border-ec-div rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-ec-t1">Details</h3>
          {isElevated && (
            <button onClick={() => setEditing(true)}
              className="text-xs text-emerald-600 hover:text-emerald-700 cursor-pointer bg-transparent border-none font-medium">
              Edit
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-ec-t3">Address</span><p className="text-ec-t1 mt-0.5">{home.address || '—'}</p></div>
          <div><span className="text-ec-t3">Contact</span><p className="text-ec-t1 mt-0.5">{home.contactPerson || home.contact_person || '—'}</p></div>
          <div><span className="text-ec-t3">Phone</span><p className="text-ec-t1 mt-0.5">{home.phone || '—'}</p></div>
          <div><span className="text-ec-t3">Email</span><p className="text-ec-t1 mt-0.5">{home.email || '—'}</p></div>
          <div><span className="text-ec-t3">Cycle Day</span><p className="text-ec-t1 mt-0.5">{home.cycleDay || home.cycle_day || '—'}</p></div>
          <div><span className="text-ec-t3">Delivery</span><p className="text-ec-t1 mt-0.5">{home.deliveryMethod || home.delivery_method || '—'}</p></div>
        </div>
        {home.notes && <p className="text-xs text-ec-t3 mt-3 border-t border-ec-div pt-2">{home.notes}</p>}
      </div>

      {/* Patient summary */}
      <div className="p-4 bg-ec-card border border-ec-div rounded-xl">
        <h3 className="text-sm font-semibold text-ec-t1 mb-3">Patient Summary</h3>
        <div className="flex gap-4 text-sm mb-3">
          <div><span className="text-ec-t3">Total</span><p className="text-lg font-bold text-ec-t1">{totalPatients}</p></div>
          <div><span className="text-ec-t3">Active</span><p className="text-lg font-bold text-emerald-600">{activePatients}</p></div>
        </div>
        <div className="flex gap-2">
          {PACK_TYPES.map(t => (
            <div key={t} className="flex-1 p-2 rounded-lg bg-ec-bg text-center">
              <div className="text-lg font-bold text-ec-t1">{packCounts[t]}</div>
              <div className="text-[10px] text-ec-t3 uppercase tracking-wider">{t}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity timeline */}
      <div className="p-4 bg-ec-card border border-ec-div rounded-xl">
        <h3 className="text-sm font-semibold text-ec-t1 mb-3">Recent Activity</h3>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-ec-t3">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${TYPE_COLORS[item.type]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ec-t1 truncate">{item.label}</p>
                  <p className="text-xs text-ec-t3">{item.date}{item.detail ? ` — ${item.detail}` : ''}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && <NewCareHomeForm initial={home} onSave={handleSave} onClose={() => setEditing(false)} />}
    </div>
  )
}
