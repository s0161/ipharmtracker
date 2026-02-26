/*
  Supabase table needed:

  CREATE TABLE temperature_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time TEXT,
    temperature NUMERIC(4,1) NOT NULL,
    logged_by TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ALTER TABLE temperature_logs ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "anon full access" ON temperature_logs FOR ALL USING (true) WITH CHECK (true);
*/

import { useState } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import { generateId, formatDate } from '../utils/helpers'
import { useToast } from '../components/Toast'
import PageActions from '../components/PageActions'
import { downloadCsv } from '../utils/exportCsv'

const emptyForm = {
  date: new Date().toISOString().slice(0, 10),
  time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
  temperature: '',
  loggedBy: '',
  notes: '',
}

const IN_RANGE_MIN = 2
const IN_RANGE_MAX = 8

export default function TemperatureLog() {
  const [logs, setLogs, loading] = useSupabase('temperature_logs', [])
  const [staffMembers] = useSupabase('staff_members', [], { valueField: 'name' })
  const showToast = useToast()
  const [form, setForm] = useState(emptyForm)

  if (loading) {
    return <div className="loading-container"><div className="spinner" />Loading…</div>
  }

  const sorted = [...logs].sort((a, b) => {
    const d = (b.date || '').localeCompare(a.date || '')
    if (d !== 0) return d
    return (b.time || '').localeCompare(a.time || '')
  })

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.temperature) return

    const temp = parseFloat(form.temperature)
    if (isNaN(temp)) return

    setLogs([...logs, {
      id: generateId(),
      date: form.date,
      time: form.time,
      temperature: temp,
      loggedBy: form.loggedBy,
      notes: form.notes,
      createdAt: new Date().toISOString(),
    }])

    const inRange = temp >= IN_RANGE_MIN && temp <= IN_RANGE_MAX
    showToast(
      inRange ? 'Temperature logged' : `Warning: ${temp}°C is outside safe range (${IN_RANGE_MIN}–${IN_RANGE_MAX}°C)`,
      inRange ? 'success' : 'error'
    )
    setForm({ ...emptyForm, loggedBy: form.loggedBy })
  }

  const handleDelete = (id) => {
    if (window.confirm('Delete this reading?')) {
      setLogs(logs.filter(l => l.id !== id))
      showToast('Reading deleted', 'info')
    }
  }

  const handleCsvDownload = () => {
    const headers = ['Date', 'Time', 'Temperature (°C)', 'Logged By', 'In Range', 'Notes']
    const rows = sorted.map(l => [
      l.date, l.time, l.temperature,
      l.loggedBy || '', (l.temperature >= IN_RANGE_MIN && l.temperature <= IN_RANGE_MAX) ? 'Yes' : 'NO',
      l.notes || '',
    ])
    downloadCsv('temperature-log', headers, rows)
  }

  const todayStr = new Date().toISOString().slice(0, 10)
  const todayCount = logs.filter(l => l.date === todayStr).length

  return (
    <div>
      <div className="page-header">
        <p className="page-desc">
          Record daily fridge temperature readings. Safe range: {IN_RANGE_MIN}–{IN_RANGE_MAX}°C.
          Readings outside this range are flagged in red.
        </p>
        <div className="page-header-actions">
          <PageActions onDownloadCsv={handleCsvDownload} />
        </div>
      </div>

      {todayCount === 0 && (
        <div className="alert-banner alert-banner--warning">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>No temperature reading has been logged today. Please record a reading.</span>
        </div>
      )}

      <form className="temp-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="label">Date</label>
            <input type="date" className="input" value={form.date} onChange={update('date')} required />
          </div>
          <div className="form-group">
            <label className="label">Time</label>
            <input type="time" className="input" value={form.time} onChange={update('time')} />
          </div>
          <div className="form-group">
            <label className="label">Temperature (°C) *</label>
            <input
              type="number"
              step="0.1"
              className="input"
              placeholder="e.g. 4.5"
              value={form.temperature}
              onChange={update('temperature')}
              required
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label className="label">Logged By</label>
            {staffMembers.length > 0 ? (
              <select className="input" value={form.loggedBy} onChange={update('loggedBy')}>
                <option value="">Select staff...</option>
                {staffMembers.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <input type="text" className="input" placeholder="Name" value={form.loggedBy} onChange={update('loggedBy')} />
            )}
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="label">Notes</label>
            <input type="text" className="input" placeholder="Optional notes..." value={form.notes} onChange={update('notes')} />
          </div>
        </div>
        <button type="submit" className="btn btn--primary" style={{ marginTop: '0.5rem' }}>
          Log Temperature
        </button>
      </form>

      {sorted.length === 0 ? (
        <div className="empty-state-box">
          <p className="empty-state">No temperature readings yet.</p>
        </div>
      ) : (
        <div className="table-wrap" style={{ marginTop: '1.5rem' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Temperature</th>
                <th>Logged By</th>
                <th className="mobile-hide">Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(log => {
                const temp = parseFloat(log.temperature)
                const inRange = temp >= IN_RANGE_MIN && temp <= IN_RANGE_MAX
                return (
                  <tr key={log.id} className={!inRange ? 'temp-row--danger' : ''}>
                    <td className="cell-bold">{formatDate(log.date)}</td>
                    <td>{log.time || '—'}</td>
                    <td>
                      <span className={`temp-reading ${!inRange ? 'temp-reading--danger' : 'temp-reading--ok'}`}>
                        {!inRange && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" style={{ marginRight: 4 }}>
                            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                        )}
                        {temp.toFixed(1)}°C
                      </span>
                    </td>
                    <td>{log.loggedBy || '—'}</td>
                    <td className="cell-notes mobile-hide">{log.notes || '—'}</td>
                    <td>
                      <button className="btn btn--ghost btn--sm btn--danger" onClick={() => handleDelete(log.id)}>Delete</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
