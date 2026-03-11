// ─── Deliveries Tab ───
// Delivery log table with add/update capability

import { useState, useMemo } from 'react'
import { DELIVERY_TYPES, DELIVERY_STATUSES, DELIVERY_STATUS_STYLES } from '../../data/careHomeData'

export default function DeliveriesTab({ home, deliveries, isElevated, user, onAddDelivery, onUpdateDelivery }) {
  const [adding, setAdding] = useState(false)
  const [statusFilter, setStatusFilter] = useState('All')
  const [form, setForm] = useState({
    deliveryDate: new Date().toISOString().slice(0, 10),
    deliveryTime: '', deliveredBy: '', receivedBy: '',
    itemsCount: '', deliveryType: 'Scheduled', notes: '',
  })

  const filtered = useMemo(() => {
    if (statusFilter === 'All') return deliveries || []
    return (deliveries || []).filter(d => d.status === statusFilter)
  }, [deliveries, statusFilter])

  const handleAdd = async (e) => {
    e.preventDefault()
    await onAddDelivery({
      careHomeId: home.id,
      deliveryDate: form.deliveryDate,
      deliveryTime: form.deliveryTime,
      deliveredBy: form.deliveredBy || user?.name,
      receivedBy: form.receivedBy,
      itemsCount: parseInt(form.itemsCount, 10) || 0,
      deliveryType: form.deliveryType,
      notes: form.notes,
      status: 'Scheduled',
    })
    setForm({ deliveryDate: new Date().toISOString().slice(0, 10), deliveryTime: '', deliveredBy: '', receivedBy: '', itemsCount: '', deliveryType: 'Scheduled', notes: '' })
    setAdding(false)
  }

  const markDelivered = async (delivery) => {
    await onUpdateDelivery(delivery.id, {
      status: 'Delivered',
      signatureConfirmed: true,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          {['All', ...DELIVERY_STATUSES].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 text-xs font-medium rounded-full border-none cursor-pointer transition-colors
                ${statusFilter === s ? 'bg-emerald-600 text-white' : 'bg-ec-bg text-ec-t2 hover:bg-ec-div'}`}>
              {s}
            </button>
          ))}
        </div>
        {isElevated && (
          <button onClick={() => setAdding(!adding)}
            className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg border-none cursor-pointer hover:bg-emerald-700 shadow-sm whitespace-nowrap">
            Log Delivery
          </button>
        )}
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="p-4 bg-ec-card border border-ec-div rounded-xl space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-ec-t2 mb-1">Date</label>
              <input type="date" value={form.deliveryDate} onChange={e => setForm(f => ({ ...f, deliveryDate: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ec-t2 mb-1">Time</label>
              <input type="time" value={form.deliveryTime} onChange={e => setForm(f => ({ ...f, deliveryTime: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ec-t2 mb-1">Type</label>
              <select value={form.deliveryType} onChange={e => setForm(f => ({ ...f, deliveryType: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30">
                {DELIVERY_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-ec-t2 mb-1">Delivered By</label>
              <input value={form.deliveredBy} onChange={e => setForm(f => ({ ...f, deliveredBy: e.target.value }))}
                placeholder={user?.name || ''}
                className="w-full px-3 py-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ec-t2 mb-1">Received By</label>
              <input value={form.receivedBy} onChange={e => setForm(f => ({ ...f, receivedBy: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ec-t2 mb-1">Items</label>
              <input type="number" value={form.itemsCount} onChange={e => setForm(f => ({ ...f, itemsCount: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ec-t2 mb-1">Notes</label>
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg border-none cursor-pointer hover:bg-emerald-700 shadow-sm">Save</button>
            <button type="button" onClick={() => setAdding(false)} className="px-4 py-2 text-sm text-ec-t2 border border-ec-div rounded-lg bg-ec-card cursor-pointer hover:bg-ec-bg">Cancel</button>
          </div>
        </form>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-ec-t3 p-4 bg-ec-card border border-ec-div rounded-xl">No deliveries found</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(d => {
            const style = DELIVERY_STATUS_STYLES[d.status] || DELIVERY_STATUS_STYLES.Scheduled
            return (
              <div key={d.id} className="p-3 bg-ec-card border border-ec-div rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-sm font-medium text-ec-t1">{d.deliveryDate || d.delivery_date}</span>
                    {(d.deliveryTime || d.delivery_time) && (
                      <span className="text-xs text-ec-t3 ml-2">{d.deliveryTime || d.delivery_time}</span>
                    )}
                  </div>
                  <span className="text-xs text-ec-t3">{d.deliveryType || d.delivery_type}</span>
                  <span className="text-xs text-ec-t3">{d.itemsCount || d.items_count || 0} items</span>
                </div>
                <div className="flex items-center gap-2">
                  {(d.deliveredBy || d.delivered_by) && (
                    <span className="text-xs text-ec-t3">{d.deliveredBy || d.delivered_by}</span>
                  )}
                  {(d.signatureConfirmed || d.signature_confirmed) && (
                    <span className="text-xs text-emerald-600">✓ Signed</span>
                  )}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                    {d.status}
                  </span>
                  {isElevated && d.status !== 'Delivered' && d.status !== 'Failed' && (
                    <button onClick={() => markDelivered(d)}
                      className="text-xs text-emerald-600 hover:text-emerald-700 cursor-pointer bg-transparent border-none font-medium">
                      Mark Delivered
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
