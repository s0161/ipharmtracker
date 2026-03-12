// ─── New Care Home Form ───
// Slide panel form for adding/editing a care home

import { useState } from 'react'

const EMPTY = {
  name: '', address: '', phone: '', email: '',
  contactPerson: '', cycleDay: '', deliveryMethod: 'Delivery', notes: '',
}

export default function NewCareHomeForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial ? {
    name: initial.name || '',
    address: initial.address || '',
    phone: initial.phone || '',
    email: initial.email || '',
    contactPerson: initial.contactPerson || initial.contact_person || '',
    cycleDay: initial.cycleDay || initial.cycle_day || '',
    deliveryMethod: initial.deliveryMethod || initial.delivery_method || 'Delivery',
    notes: initial.notes || '',
  } : { ...EMPTY })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    await onSave({
      ...form,
      cycleDay: form.cycleDay ? parseInt(form.cycleDay, 10) : null,
    })
    setSaving(false)
  }

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }))

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-ec-card shadow-xl overflow-y-auto animate-slide-in-right">
        <div className="sticky top-0 bg-ec-card border-b border-ec-div p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-ec-t1">
            {initial ? 'Edit Care Home' : 'Add Care Home'}
          </h2>
          <button onClick={onClose} className="text-ec-t3 hover:text-ec-t1 text-xl leading-none cursor-pointer bg-transparent border-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-ec-t2 mb-1">Name *</label>
            <input value={form.name} onChange={set('name')} required
              className="w-full px-3 py-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1 focus:outline-none focus:ring-2 focus:ring-ec-em/30" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ec-t2 mb-1">Address</label>
            <input value={form.address} onChange={set('address')}
              className="w-full px-3 py-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1 focus:outline-none focus:ring-2 focus:ring-ec-em/30" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ec-t2 mb-1">Phone</label>
              <input value={form.phone} onChange={set('phone')}
                className="w-full px-3 py-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1 focus:outline-none focus:ring-2 focus:ring-ec-em/30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ec-t2 mb-1">Email</label>
              <input value={form.email} onChange={set('email')} type="email"
                className="w-full px-3 py-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1 focus:outline-none focus:ring-2 focus:ring-ec-em/30" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ec-t2 mb-1">Contact Person</label>
            <input value={form.contactPerson} onChange={set('contactPerson')}
              className="w-full px-3 py-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1 focus:outline-none focus:ring-2 focus:ring-ec-em/30" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ec-t2 mb-1">Cycle Day (1-28)</label>
              <select value={form.cycleDay} onChange={set('cycleDay')}
                className="w-full px-3 py-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1 focus:outline-none focus:ring-2 focus:ring-ec-em/30">
                <option value="">—</option>
                {Array.from({ length: 28 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ec-t2 mb-1">Delivery Method</label>
              <select value={form.deliveryMethod} onChange={set('deliveryMethod')}
                className="w-full px-3 py-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1 focus:outline-none focus:ring-2 focus:ring-ec-em/30">
                <option>Delivery</option>
                <option>Collection</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ec-t2 mb-1">Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={3}
              className="w-full px-3 py-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1 focus:outline-none focus:ring-2 focus:ring-ec-em/30 resize-none" />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving || !form.name.trim()}
              className="flex-1 px-4 py-2 bg-ec-em-dark text-white text-sm font-semibold rounded-lg border-none cursor-pointer hover:bg-ec-em-dark shadow-sm disabled:opacity-50">
              {saving ? 'Saving...' : (initial ? 'Update' : 'Add Care Home')}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-ec-t2 border border-ec-div rounded-lg bg-ec-card cursor-pointer hover:bg-ec-bg">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
