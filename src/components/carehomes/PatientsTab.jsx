// ─── Patients Tab ───
// Patient list with search, add patient capability

import { useState, useMemo } from 'react'
import { PACK_TYPES } from '../../data/careHomeData'

export default function PatientsTab({ home, patients, cyclesByHome, itemsByCycle, isElevated, onAddPatient, onUpdatePatient }) {
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [expandedPatient, setExpandedPatient] = useState(null)
  const [form, setForm] = useState({ patientName: '', roomNumber: '', medicationCount: '', packType: 'Blister', allergies: '', notes: '' })

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return (patients || []).filter(p => {
      const name = (p.patientName || p.patient_name || '').toLowerCase()
      const room = (p.roomNumber || p.room_number || '').toLowerCase()
      return name.includes(q) || room.includes(q)
    })
  }, [patients, search])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.patientName.trim()) return
    await onAddPatient({
      careHomeId: home.id,
      patientName: form.patientName,
      roomNumber: form.roomNumber,
      medicationCount: parseInt(form.medicationCount, 10) || 0,
      packType: form.packType,
      allergies: form.allergies,
      notes: form.notes,
    })
    setForm({ patientName: '', roomNumber: '', medicationCount: '', packType: 'Blister', allergies: '', notes: '' })
    setAdding(false)
  }

  const toggleActive = async (patient) => {
    const current = patient.isActive !== undefined ? patient.isActive : patient.is_active
    await onUpdatePatient(patient.id, { isActive: current === false ? true : false })
  }

  // Get cycle history for a patient
  const getPatientCycleHistory = (patientId) => {
    const history = []
    const cycles = cyclesByHome || []
    cycles.forEach(c => {
      const items = (itemsByCycle[c.id] || []).filter(i => (i.patientId || i.patient_id) === patientId)
      if (items.length > 0) {
        history.push({ cycle: c, items })
      }
    })
    return history
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search patients..."
          className="flex-1 px-3 py-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
        {isElevated && (
          <button onClick={() => setAdding(!adding)}
            className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg border-none cursor-pointer hover:bg-emerald-700 shadow-sm whitespace-nowrap">
            Add Patient
          </button>
        )}
      </div>

      {/* Add patient form */}
      {adding && (
        <form onSubmit={handleAdd} className="p-4 bg-ec-card border border-ec-div rounded-xl space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ec-t2 mb-1">Name *</label>
              <input value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} required
                className="w-full px-3 py-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ec-t2 mb-1">Room</label>
              <input value={form.roomNumber} onChange={e => setForm(f => ({ ...f, roomNumber: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ec-t2 mb-1">Medication Count</label>
              <input type="number" value={form.medicationCount} onChange={e => setForm(f => ({ ...f, medicationCount: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ec-t2 mb-1">Pack Type</label>
              <select value={form.packType} onChange={e => setForm(f => ({ ...f, packType: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30">
                {PACK_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ec-t2 mb-1">Allergies</label>
            <input value={form.allergies} onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg border-none cursor-pointer hover:bg-emerald-700 shadow-sm">Save</button>
            <button type="button" onClick={() => setAdding(false)} className="px-4 py-2 text-sm text-ec-t2 border border-ec-div rounded-lg bg-ec-card cursor-pointer hover:bg-ec-bg">Cancel</button>
          </div>
        </form>
      )}

      {/* Patient list */}
      {filtered.length === 0 ? (
        <p className="text-sm text-ec-t3 p-4 bg-ec-card border border-ec-div rounded-xl">No patients found</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => {
            const isActive = p.isActive !== false && p.is_active !== false
            const isExpanded = expandedPatient === p.id
            return (
              <div key={p.id} className="bg-ec-card border border-ec-div rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedPatient(isExpanded ? null : p.id)}
                  className="w-full text-left p-3 cursor-pointer bg-transparent border-none flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-ec-t1">{p.patientName || p.patient_name}</span>
                    {(p.roomNumber || p.room_number) && (
                      <span className="text-xs text-ec-t3">Room {p.roomNumber || p.room_number}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-ec-t3">{p.packType || p.pack_type}</span>
                    <span className="text-xs text-ec-t3">{p.medicationCount || p.medication_count || 0} meds</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t border-ec-div p-3 space-y-2">
                    {p.allergies && (
                      <p className="text-xs"><span className="text-red-600 font-medium">Allergies:</span> <span className="text-ec-t1">{p.allergies}</span></p>
                    )}
                    {p.notes && <p className="text-xs text-ec-t3">{p.notes}</p>}
                    {isElevated && (
                      <button onClick={() => toggleActive(p)}
                        className="text-xs text-ec-t3 hover:text-ec-t1 cursor-pointer bg-transparent border-none">
                        Mark as {isActive ? 'Inactive' : 'Active'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
