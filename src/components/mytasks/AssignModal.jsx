import { useState } from 'react'
import Modal from '../Modal'
import Avatar from '../Avatar'
import { PRIORITY_ORDER, CATEGORY_LABELS, CATEGORY_ORDER } from '../../utils/taskEngine'

const inputStyle = {
  width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13,
  border: '1px solid var(--ec-em-border)', outline: 'none', fontFamily: "'Inter', sans-serif",
  background: 'white', boxSizing: 'border-box',
}

export default function AssignModal({ open, onClose, staff, templates, onAssign }) {
  const [mode, setMode] = useState('freeform') // 'freeform' | 'template'
  const [title, setTitle] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [assignTo, setAssignTo] = useState('')
  const [priority, setPriority] = useState('normal')
  const [category, setCategory] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')

  function reset() {
    setTitle(''); setTemplateId(''); setAssignTo(''); setPriority('normal')
    setCategory(''); setDueDate(''); setNotes(''); setMode('freeform')
  }

  function handleSubmit() {
    const tpl = templates.find(t => t.id === templateId)
    const taskName = mode === 'template' ? tpl?.name : title.trim()
    if (!taskName) return

    onAssign({
      taskName,
      templateId: mode === 'template' ? templateId : null,
      assignTo: assignTo || null,
      priority: mode === 'template' ? (tpl?.priority || priority) : priority,
      category: mode === 'template' ? (tpl?.category || category) : (category || null),
      dueDate: dueDate || null,
      notes: notes.trim() || null,
    })
    reset()
    onClose()
  }

  const canSubmit = mode === 'template' ? !!templateId : !!title.trim()

  return (
    <Modal open={open} onClose={() => { reset(); onClose() }} title="Assign Task">
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--ec-em-border)', marginBottom: 16 }}>
        {[['freeform', 'Custom Task'], ['template', 'From Template']].map(([key, label]) => (
          <button key={key} onClick={() => setMode(key)} style={{
            flex: 1, padding: '7px 0', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
            background: mode === key ? 'var(--ec-em)' : 'var(--ec-card)',
            color: mode === key ? 'white' : 'var(--ec-t2)',
            fontFamily: "'Inter', sans-serif",
          }}>{label}</button>
        ))}
      </div>

      {mode === 'template' ? (
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ec-t2)', marginBottom: 4, display: 'block' }}>Template *</label>
          <select value={templateId} onChange={e => setTemplateId(e.target.value)} style={inputStyle}>
            <option value="">Select a template...</option>
            {CATEGORY_ORDER.map(cat => {
              const catTemplates = templates.filter(t => t.category === cat)
              if (catTemplates.length === 0) return null
              return (
                <optgroup key={cat} label={CATEGORY_LABELS[cat] || cat}>
                  {catTemplates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </optgroup>
              )
            })}
          </select>
        </div>
      ) : (
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ec-t2)', marginBottom: 4, display: 'block' }}>Task title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter task title..." style={inputStyle} />
        </div>
      )}

      {/* Assign to — staff picker */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ec-t2)', marginBottom: 4, display: 'block' }}>Assign to</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {staff.map(s => (
            <button key={s.id || s.name} onClick={() => setAssignTo(assignTo === s.name ? '' : s.name)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                border: assignTo === s.name ? '2px solid var(--ec-em)' : '1px solid var(--ec-em-border)',
                background: assignTo === s.name ? 'var(--ec-em-bg)' : 'var(--ec-card)',
                color: assignTo === s.name ? 'var(--ec-em)' : 'var(--ec-t2)',
                cursor: 'pointer', fontFamily: "'Inter', sans-serif",
              }}
            >
              <Avatar name={s.name} size={18} />
              {s.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Priority */}
      {mode === 'freeform' && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ec-t2)', marginBottom: 4, display: 'block' }}>Priority</label>
          <div style={{ display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--ec-em-border)' }}>
            {PRIORITY_ORDER.map(p => (
              <button key={p} onClick={() => setPriority(p)} style={{
                flex: 1, padding: '7px 0', fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: priority === p ? 'var(--ec-em)' : 'var(--ec-card)',
                color: priority === p ? 'white' : 'var(--ec-t2)',
                fontFamily: "'Inter', sans-serif", textTransform: 'capitalize',
              }}>{p}</button>
            ))}
          </div>
        </div>
      )}

      {/* Category */}
      {mode === 'freeform' && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ec-t2)', marginBottom: 4, display: 'block' }}>Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
            <option value="">None</option>
            {CATEGORY_ORDER.filter(c => c !== 'other').map(c => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </div>
      )}

      {/* Due date */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ec-t2)', marginBottom: 4, display: 'block' }}>Due date</label>
        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inputStyle} />
      </div>

      {/* Notes */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ec-t2)', marginBottom: 4, display: 'block' }}>Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes..." rows={2}
          style={{ ...inputStyle, resize: 'vertical' }} />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button onClick={() => { reset(); onClose() }} style={{
          padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          border: '1px solid var(--ec-em-border)', background: 'white', color: 'var(--ec-t2)',
          cursor: 'pointer', fontFamily: "'Inter', sans-serif",
        }}>Cancel</button>
        <button onClick={handleSubmit} disabled={!canSubmit} style={{
          padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none',
          background: canSubmit ? 'var(--ec-em)' : 'var(--ec-t4)', color: 'white',
          cursor: canSubmit ? 'pointer' : 'default', fontFamily: "'Inter', sans-serif",
        }}>Assign</button>
      </div>
    </Modal>
  )
}
