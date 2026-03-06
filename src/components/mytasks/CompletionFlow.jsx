import { useState } from 'react'
import Modal from '../Modal'

export default function CompletionFlow({ task, open, onClose, onConfirm }) {
  const [notes, setNotes] = useState('')

  if (!task) return null

  function handleConfirm() {
    onConfirm(task.id, notes.trim() || undefined)
    setNotes('')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Complete Task">
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>
          {task.taskName || task.title}
        </div>
        {task.notes && (
          <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>{task.notes}</div>
        )}
      </div>

      {task.linkedLog && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, marginBottom: 14,
          background: '#f0fdf4', border: '1px solid #d1fae5',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#059669' }}>Log entry recommended</div>
            <div style={{ fontSize: 10, color: '#64748b' }}>This task links to a log page.</div>
          </div>
          <a href={`#${task.linkedLog}`} style={{
            fontSize: 11, fontWeight: 600, color: '#059669', textDecoration: 'none',
            padding: '4px 12px', borderRadius: 20, border: '1px solid #d1fae5',
          }}>Open Log</a>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4, display: 'block' }}>
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Add a note about completion..."
          rows={2}
          style={{
            width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13,
            border: '1px solid #d1fae5', outline: 'none', fontFamily: "'DM Sans', sans-serif",
            background: 'white', boxSizing: 'border-box', resize: 'vertical',
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button onClick={onClose} style={{
          padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          border: '1px solid #d1fae5', background: 'white', color: '#64748b',
          cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
        }}>Cancel</button>
        <button onClick={handleConfirm} style={{
          padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none',
          background: '#059669', color: 'white',
          cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
        }}>Mark Complete</button>
      </div>
    </Modal>
  )
}
