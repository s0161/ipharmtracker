// ─── Handover Notes Tab ───
// Notes list with add and acknowledge capability

import { useState } from 'react'
import { NOTE_TYPES, NOTE_PRIORITIES, NOTE_TYPE_STYLES, NOTE_PRIORITY_STYLES } from '../../data/careHomeData'

export default function HandoverNotesTab({ home, notes, isElevated, user, onAddNote, onAcknowledgeNote }) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ noteType: 'General', priority: 'Normal', content: '' })

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.content.trim()) return
    await onAddNote({
      careHomeId: home.id,
      noteType: form.noteType,
      priority: form.priority,
      content: form.content,
      createdBy: user?.name,
    })
    setForm({ noteType: 'General', priority: 'Normal', content: '' })
    setAdding(false)
  }

  const handleAck = async (note) => {
    await onAcknowledgeNote(note.id, user?.name)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ec-t1">Handover Notes</h3>
        <button onClick={() => setAdding(!adding)}
          className="px-3 py-1.5 bg-ec-em-dark text-white text-xs font-semibold rounded-lg border-none cursor-pointer hover:bg-ec-em-dark shadow-sm">
          Add Note
        </button>
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="p-4 bg-ec-card border border-ec-div rounded-xl space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ec-t2 mb-1">Type</label>
              <select value={form.noteType} onChange={e => setForm(f => ({ ...f, noteType: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1 focus:outline-none focus:ring-2 focus:ring-ec-em/30">
                {NOTE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ec-t2 mb-1">Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1 focus:outline-none focus:ring-2 focus:ring-ec-em/30">
                {NOTE_PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ec-t2 mb-1">Content *</label>
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={3} required
              className="w-full px-3 py-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1 focus:outline-none focus:ring-2 focus:ring-ec-em/30 resize-none" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-ec-em-dark text-white text-sm font-semibold rounded-lg border-none cursor-pointer hover:bg-ec-em-dark shadow-sm">Save</button>
            <button type="button" onClick={() => setAdding(false)} className="px-4 py-2 text-sm text-ec-t2 border border-ec-div rounded-lg bg-ec-card cursor-pointer hover:bg-ec-bg">Cancel</button>
          </div>
        </form>
      )}

      {(!notes || notes.length === 0) ? (
        <p className="text-sm text-ec-t3 p-4 bg-ec-card border border-ec-div rounded-xl">No handover notes</p>
      ) : (
        <div className="space-y-2">
          {notes.map(n => {
            const typeStyle = NOTE_TYPE_STYLES[n.noteType || n.note_type] || NOTE_TYPE_STYLES.General
            const prioStyle = NOTE_PRIORITY_STYLES[n.priority] || NOTE_PRIORITY_STYLES.Normal
            const isAcked = !!(n.acknowledgedBy || n.acknowledged_by)
            return (
              <div key={n.id} className="p-3 bg-ec-card border border-ec-div rounded-xl">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeStyle.bg} ${typeStyle.text}`}>
                      {n.noteType || n.note_type}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${prioStyle.bg} ${prioStyle.text}`}>
                      {n.priority}
                    </span>
                  </div>
                  <span className="text-xs text-ec-t3">{n.noteDate || n.note_date}</span>
                </div>
                <p className="text-sm text-ec-t1 mb-2">{n.content}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-ec-t3">by {n.createdBy || n.created_by || 'Unknown'}</span>
                  {isAcked ? (
                    <span className="text-xs text-ec-em">Acknowledged by {n.acknowledgedBy || n.acknowledged_by}</span>
                  ) : (
                    <button onClick={() => handleAck(n)}
                      className="text-xs text-ec-em hover:text-ec-em cursor-pointer bg-transparent border-none font-medium">
                      Acknowledge
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
