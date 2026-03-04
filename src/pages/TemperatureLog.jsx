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

import { useState, useMemo } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import { logAudit } from '../utils/auditLog'
import { useUser } from '../contexts/UserContext'
import { generateId, formatDate } from '../utils/helpers'
import { useToast } from '../components/Toast'
import PageActions from '../components/PageActions'
import { downloadCsv } from '../utils/exportCsv'
import TemperatureChart from '../components/TemperatureChart'
import { useConfirm } from '../components/ConfirmDialog'

const emptyForm = {
  date: new Date().toISOString().slice(0, 10),
  time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
  temperature: '',
  loggedBy: '',
  notes: '',
}

const IN_RANGE_MIN = 2
const IN_RANGE_MAX = 8

const inputClass = "w-full bg-ec-card border border-ec-border rounded-lg px-3 py-2 text-sm text-ec-t1 focus:outline-none focus:border-ec-em/40 focus:ring-1 focus:ring-ec-em/20 transition-colors font-sans"

export default function TemperatureLog() {
  const { user } = useUser()
  const [logs, setLogs, loading] = useSupabase('temperature_logs', [])
  const [staffMembers] = useSupabase('staff_members', [], { valueField: 'name' })
  const showToast = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  const [form, setForm] = useState(emptyForm)

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-sm text-ec-t3">Loading…</div>
  }

  const sorted = [...logs].sort((a, b) => {
    const d = (b.date || '').localeCompare(a.date || '')
    if (d !== 0) return d
    return (b.time || '').localeCompare(a.time || '')
  })

  const chartData = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 14)
    const cutoffStr = cutoff.toISOString().slice(0, 10)

    // Get readings from last 14 days, average if multiple per day
    const byDate = {}
    logs.forEach(l => {
      if (l.date >= cutoffStr) {
        if (!byDate[l.date]) byDate[l.date] = []
        byDate[l.date].push(parseFloat(l.temperature))
      }
    })

    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, temps]) => ({
        date,
        temperature: temps.reduce((a, b) => a + b, 0) / temps.length,
      }))
  }, [logs])

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
    logAudit('Created', `Temperature reading: ${temp}°C`, 'Temperature Log', user?.name)

    const inRange = temp >= IN_RANGE_MIN && temp <= IN_RANGE_MAX
    showToast(
      inRange ? 'Temperature logged' : `Warning: ${temp}°C is outside safe range (${IN_RANGE_MIN}–${IN_RANGE_MAX}°C)`,
      inRange ? 'success' : 'error'
    )
    setForm({ ...emptyForm, loggedBy: form.loggedBy })
  }

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Delete reading?',
      message: 'Are you sure you want to delete this temperature reading? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    })
    if (!ok) return
    const log = logs.find(l => l.id === id)
    setLogs(logs.filter(l => l.id !== id))
    logAudit('Deleted', `Temperature reading: ${log?.temperature}°C`, 'Temperature Log', user?.name)
    showToast('Reading deleted', 'info')
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
      <div>
        <p className="text-sm text-ec-t3 mb-2">
          Record daily fridge temperature readings. Safe range: {IN_RANGE_MIN}–{IN_RANGE_MAX}°C.
          Readings outside this range are flagged in red.
        </p>
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <PageActions onDownloadCsv={handleCsvDownload} />
        </div>
      </div>

      {todayCount === 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4"
          style={{ backgroundColor: 'rgba(245,158,11,0.06)', borderLeft: '3px solid #f59e0b' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" className="text-ec-warn shrink-0">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span className="text-sm text-ec-t1">No temperature reading has been logged today. Please record a reading.</span>
        </div>
      )}

      <form className="rounded-2xl p-5 space-y-4"
        style={{ backgroundColor: 'var(--ec-card)', border: '1px solid var(--ec-border)' }}
        onSubmit={handleSubmit}>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-ec-t2 mb-1 block">Date</label>
            <input type="date" className={inputClass} value={form.date} onChange={update('date')} required />
          </div>
          <div>
            <label className="text-xs font-semibold text-ec-t2 mb-1 block">Time</label>
            <input type="time" className={inputClass} value={form.time} onChange={update('time')} />
          </div>
          <div>
            <label className="text-xs font-semibold text-ec-t2 mb-1 block">Temperature (°C) *</label>
            <input
              type="number"
              step="0.1"
              className={inputClass}
              placeholder="e.g. 4.5"
              value={form.temperature}
              onChange={update('temperature')}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-ec-t2 mb-1 block">Logged By</label>
            {staffMembers.length > 0 ? (
              <select className={inputClass} value={form.loggedBy} onChange={update('loggedBy')}>
                <option value="">Select staff...</option>
                {staffMembers.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <input type="text" className={inputClass} placeholder="Name" value={form.loggedBy} onChange={update('loggedBy')} />
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-ec-t2 mb-1 block">Notes</label>
            <input type="text" className={inputClass} placeholder="Optional notes..." value={form.notes} onChange={update('notes')} />
          </div>
        </div>
        <button type="submit" className="px-4 py-2 bg-ec-em text-white font-semibold rounded-lg text-sm border-none cursor-pointer hover:bg-ec-em-dark transition-colors flex items-center gap-1.5 font-sans mt-2">
          Log Temperature
        </button>
      </form>

      <TemperatureChart readings={chartData} minRange={IN_RANGE_MIN} maxRange={IN_RANGE_MAX} />

      {sorted.length === 0 ? (
        <div className="text-center py-10 text-ec-t3 text-sm">
          No temperature readings yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl mt-6" style={{ border: '1px solid var(--ec-border)' }}>
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">Date</th>
                <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">Time</th>
                <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">Temperature</th>
                <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">Logged By</th>
                <th className="hidden md:table-cell text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">Notes</th>
                <th className="text-left text-xs font-semibold text-ec-t3 px-4 py-2.5 border-b border-ec-border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(log => {
                const temp = parseFloat(log.temperature)
                const inRange = temp >= IN_RANGE_MIN && temp <= IN_RANGE_MAX
                return (
                  <tr key={log.id} style={!inRange ? { backgroundColor: 'rgba(239,68,68,0.04)' } : undefined}>
                    <td className="px-4 py-2.5 text-ec-t1 font-medium border-b border-ec-div">{formatDate(log.date)}</td>
                    <td className="px-4 py-2.5 text-ec-t1 border-b border-ec-div">{log.time || '—'}</td>
                    <td className="px-4 py-2.5 text-ec-t1 border-b border-ec-div">
                      <span className={inRange ? "inline-flex items-center text-ec-em font-semibold" : "inline-flex items-center text-ec-crit-light font-semibold"}>
                        {!inRange && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" className="mr-1">
                            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                        )}
                        {temp.toFixed(1)}°C
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-ec-t1 border-b border-ec-div">{log.loggedBy || '—'}</td>
                    <td className="hidden md:table-cell px-4 py-2.5 text-ec-t3 border-b border-ec-div">{log.notes || '—'}</td>
                    <td className="px-4 py-2.5 text-ec-t1 border-b border-ec-div">
                      <button className="px-2.5 py-1 bg-ec-crit/10 text-ec-crit-light rounded-lg text-xs border border-ec-crit/20 cursor-pointer hover:bg-ec-crit/20 transition-colors font-sans" onClick={() => handleDelete(log.id)}>Delete</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {ConfirmDialog}
    </div>
  )
}
