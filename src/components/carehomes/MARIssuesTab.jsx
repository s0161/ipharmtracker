// ─── MAR Issues Tab ───
// MAR issue list with severity coding, add and resolve capability

import { useState } from 'react'
import { MAR_ISSUE_TYPES, MAR_SEVERITIES, MAR_SEVERITY_STYLES, MAR_STATUS_STYLES } from '../../data/careHomeData'

export default function MARIssuesTab({ home, issues, patients, isElevated, user, onAddIssue, onResolveIssue, onUpdateStatus }) {
  const [adding, setAdding] = useState(false)
  const [resolvingId, setResolvingId] = useState(null)
  const [resolutionNote, setResolutionNote] = useState('')
  const [form, setForm] = useState({
    patientId: '', issueType: 'Other', severity: 'Medium', description: '',
  })

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.description.trim()) return
    await onAddIssue({
      careHomeId: home.id,
      patientId: form.patientId || null,
      issueType: form.issueType,
      severity: form.severity,
      description: form.description,
      reportedBy: user?.name,
    })
    setForm({ patientId: '', issueType: 'Other', severity: 'Medium', description: '' })
    setAdding(false)
  }

  const handleResolve = async (issue) => {
    if (!resolutionNote.trim()) return
    await onResolveIssue(issue.id, user?.name, resolutionNote)
    setResolvingId(null)
    setResolutionNote('')
  }

  const getPatientName = (patientId) => {
    if (!patientId) return null
    const p = (patients || []).find(p => p.id === patientId)
    return p ? (p.patientName || p.patient_name) : null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ec-t1">MAR Issues</h3>
        {isElevated && (
          <button onClick={() => setAdding(!adding)}
            className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg border-none cursor-pointer hover:bg-emerald-700 shadow-sm">
            Report Issue
          </button>
        )}
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="p-4 bg-ec-card border border-ec-div rounded-xl space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-ec-t2 mb-1">Issue Type</label>
              <select value={form.issueType} onChange={e => setForm(f => ({ ...f, issueType: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30">
                {MAR_ISSUE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ec-t2 mb-1">Severity</label>
              <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30">
                {MAR_SEVERITIES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ec-t2 mb-1">Patient</label>
              <select value={form.patientId} onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30">
                <option value="">— None —</option>
                {(patients || []).map(p => (
                  <option key={p.id} value={p.id}>{p.patientName || p.patient_name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ec-t2 mb-1">Description *</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} required
              className="w-full px-3 py-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg border-none cursor-pointer hover:bg-emerald-700 shadow-sm">Report</button>
            <button type="button" onClick={() => setAdding(false)} className="px-4 py-2 text-sm text-ec-t2 border border-ec-div rounded-lg bg-ec-card cursor-pointer hover:bg-ec-bg">Cancel</button>
          </div>
        </form>
      )}

      {(!issues || issues.length === 0) ? (
        <p className="text-sm text-ec-t3 p-4 bg-ec-card border border-ec-div rounded-xl">No MAR issues</p>
      ) : (
        <div className="space-y-2">
          {issues.map(issue => {
            const sevStyle = MAR_SEVERITY_STYLES[issue.severity] || MAR_SEVERITY_STYLES.Medium
            const statusStyle = MAR_STATUS_STYLES[issue.status] || MAR_STATUS_STYLES.Open
            const patientName = getPatientName(issue.patientId || issue.patient_id)
            const isResolving = resolvingId === issue.id

            return (
              <div key={issue.id} className="p-3 bg-ec-card border border-ec-div rounded-xl">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sevStyle.bg} ${sevStyle.text}`}>
                      {issue.severity}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                      {issue.status}
                    </span>
                    <span className="text-xs text-ec-t3">{issue.issueType || issue.issue_type}</span>
                  </div>
                  <span className="text-xs text-ec-t3">{issue.issueDate || issue.issue_date}</span>
                </div>

                {patientName && <p className="text-xs text-ec-t2 mb-1">Patient: {patientName}</p>}
                <p className="text-sm text-ec-t1 mb-2">{issue.description}</p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-ec-t3">Reported by {issue.reportedBy || issue.reported_by || 'Unknown'}</span>

                  {issue.status === 'Resolved' ? (
                    <span className="text-xs text-emerald-600">
                      Resolved by {issue.resolvedBy || issue.resolved_by}
                      {(issue.resolutionNote || issue.resolution_note) && ` — ${issue.resolutionNote || issue.resolution_note}`}
                    </span>
                  ) : isElevated && (
                    <div className="flex items-center gap-2">
                      {issue.status === 'Open' && (
                        <button onClick={() => onUpdateStatus(issue.id, 'Investigating')}
                          className="text-xs text-amber-600 hover:text-amber-700 cursor-pointer bg-transparent border-none font-medium">
                          Investigate
                        </button>
                      )}
                      <button onClick={() => setResolvingId(isResolving ? null : issue.id)}
                        className="text-xs text-emerald-600 hover:text-emerald-700 cursor-pointer bg-transparent border-none font-medium">
                        Resolve
                      </button>
                    </div>
                  )}
                </div>

                {isResolving && (
                  <div className="mt-2 pt-2 border-t border-ec-div flex gap-2">
                    <input value={resolutionNote} onChange={e => setResolutionNote(e.target.value)}
                      placeholder="Resolution note..."
                      className="flex-1 px-3 py-1.5 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                    <button onClick={() => handleResolve(issue)}
                      className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg border-none cursor-pointer hover:bg-emerald-700">
                      Confirm
                    </button>
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
