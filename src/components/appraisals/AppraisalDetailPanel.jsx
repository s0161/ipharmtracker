import { useState } from 'react'
import { createPortal } from 'react-dom'
import RatingStars from './RatingStars'
import { COMPETENCIES, STATUS_STYLES, GOAL_STATUSES, RATING_LABELS, COMPETENCY_MODULE_MAP, PEER_FEEDBACK_QUESTIONS } from '../../data/appraisalData'

const GOAL_STATUS_COLORS = {
  'Not Started': 'bg-ec-bg text-ec-t2',
  'In Progress': 'bg-ec-info-light text-ec-info',
  'Completed': 'bg-ec-em-faint text-ec-em',
  'Carried Over': 'bg-ec-warn-faint text-ec-warn',
}

export default function AppraisalDetailPanel({
  appraisal,
  goals,
  ratings,
  actions,
  feedback,
  isElevated,
  isSuperintendent,
  isOwnAppraisal,
  onClose,
  onAcknowledge,
  onUpdateAppraisal,
  onUpdateGoal,
  onAddGoal,
  onAddAction,
  onUpdateAction,
  onArchive,
}) {
  const [tab, setTab] = useState('overview')
  const [staffComment, setStaffComment] = useState(appraisal.staffComments || appraisal.staff_comments || '')
  const [savingComment, setSavingComment] = useState(false)
  const [newGoal, setNewGoal] = useState({ goalText: '', targetDate: '' })
  const [newAction, setNewAction] = useState({ actionText: '', owner: '', dueDate: '' })

  const status = appraisal.status
  const isDraft = status === 'Draft'
  const isCompleted = status === 'Completed'
  const canAcknowledge = isOwnAppraisal && isCompleted && !(appraisal.staffAcknowledged || appraisal.staff_acknowledged)
  const staffName = appraisal.staffName || appraisal.staff_name
  const conductedBy = appraisal.conductedBy || appraisal.conducted_by
  const apprDate = appraisal.appraisalDate || appraisal.appraisal_date
  const apprType = appraisal.appraisalType || appraisal.appraisal_type
  const overallRating = appraisal.overallRating || appraisal.overall_rating
  const ss = STATUS_STYLES[status] || STATUS_STYLES.Draft

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'competencies', label: 'Competencies' },
    { key: 'goals', label: 'Goals' },
    { key: 'actions', label: 'Actions' },
    ...(isElevated ? [{ key: 'history', label: 'History' }] : []),
  ]

  const avgRating = ratings.length > 0
    ? (ratings.reduce((s, r) => s + (r.rating || 0), 0) / ratings.length).toFixed(1)
    : null

  const handleSaveComment = async () => {
    setSavingComment(true)
    await onUpdateAppraisal(appraisal.id, { staffComments: staffComment })
    setSavingComment(false)
  }

  const handleAddGoal = async () => {
    if (!newGoal.goalText.trim()) return
    await onAddGoal(appraisal.id, newGoal)
    setNewGoal({ goalText: '', targetDate: '' })
  }

  const handleAddAction = async () => {
    if (!newAction.actionText.trim()) return
    await onAddAction(appraisal.id, newAction)
    setNewAction({ actionText: '', owner: '', dueDate: '' })
  }

  const printPanel = () => window.print()

  const panel = (
    <div className="fixed inset-0 z-[60] flex justify-end print:static print:block">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm print:hidden" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-ec-bg h-full overflow-y-auto shadow-2xl print:max-w-none print:shadow-none print:h-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-ec-bg border-b border-ec-div px-6 py-4 print:border-b-2 print:border-black">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-ec-t1 m-0">{staffName}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ss.bg} ${ss.text}`}>
                  {status}
                </span>
                <span className="text-xs text-ec-t3">{apprType}</span>
                <span className="text-xs text-ec-t3">{new Date(apprDate).toLocaleDateString('en-GB')}</span>
              </div>
              {overallRating && (
                <div className="mt-2">
                  <RatingStars value={overallRating} size="md" />
                </div>
              )}
            </div>
            <button onClick={onClose} className="text-ec-t3 hover:text-ec-t1 bg-transparent border-none text-xl cursor-pointer print:hidden">
              &times;
            </button>
          </div>
        </div>

        {/* Acknowledge banner */}
        {canAcknowledge && (
          <div className="mx-6 mt-4 p-3 bg-ec-warn-faint border border-ec-warn rounded-lg print:hidden">
            <p className="text-sm text-ec-warn m-0 mb-2">This appraisal is awaiting your acknowledgement.</p>
            <button
              onClick={() => onAcknowledge(appraisal.id)}
              className="px-4 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg border-none cursor-pointer hover:bg-emerald-700"
            >
              Acknowledge Appraisal
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-ec-div px-6 gap-1 overflow-x-auto print:hidden">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-2.5 text-sm font-medium border-none cursor-pointer bg-transparent transition-colors whitespace-nowrap
                ${tab === t.key ? 'text-ec-em border-b-2 border-emerald-600' : 'text-ec-t3 hover:text-ec-t1'}`}
              style={tab === t.key ? { borderBottom: '2px solid var(--ec-em)' } : {}}
            >
              {t.label}
              {t.key === 'goals' && goals.length > 0 && (
                <span className="ml-1 text-xs bg-ec-card px-1 rounded">{goals.length}</span>
              )}
              {t.key === 'actions' && actions.length > 0 && (
                <span className="ml-1 text-xs bg-ec-card px-1 rounded">{actions.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="px-6 py-4">
          {/* ─── Overview Tab ─── */}
          {tab === 'overview' && (
            <div className="space-y-4 print:space-y-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-ec-t3">Conducted by:</span> <span className="font-medium text-ec-t1">{conductedBy}</span></div>
                <div><span className="text-ec-t3">Date:</span> <span className="font-medium text-ec-t1">{new Date(apprDate).toLocaleDateString('en-GB')}</span></div>
                <div><span className="text-ec-t3">Type:</span> <span className="font-medium text-ec-t1">{apprType}</span></div>
                {(appraisal.nextAppraisalDate || appraisal.next_appraisal_date) && (
                  <div><span className="text-ec-t3">Next due:</span> <span className="font-medium text-ec-t1">{new Date(appraisal.nextAppraisalDate || appraisal.next_appraisal_date).toLocaleDateString('en-GB')}</span></div>
                )}
              </div>

              {appraisal.summary && (
                <div>
                  <h4 className="text-sm font-semibold text-ec-t1 mb-1">Summary</h4>
                  <p className="text-sm text-ec-t2 m-0 leading-relaxed">{appraisal.summary}</p>
                </div>
              )}
              {appraisal.strengths && (
                <div>
                  <h4 className="text-sm font-semibold text-ec-em mb-1">Strengths</h4>
                  <p className="text-sm text-ec-t2 m-0 leading-relaxed">{appraisal.strengths}</p>
                </div>
              )}
              {(appraisal.areasForDevelopment || appraisal.areas_for_development) && (
                <div>
                  <h4 className="text-sm font-semibold text-ec-warn mb-1">Areas for Development</h4>
                  <p className="text-sm text-ec-t2 m-0 leading-relaxed">{appraisal.areasForDevelopment || appraisal.areas_for_development}</p>
                </div>
              )}

              {/* Staff comments */}
              <div>
                <h4 className="text-sm font-semibold text-ec-t1 mb-1">Staff Comments</h4>
                {isOwnAppraisal ? (
                  <div className="space-y-2 print:hidden">
                    <textarea
                      value={staffComment}
                      onChange={e => setStaffComment(e.target.value)}
                      rows={3}
                      placeholder="Add your comments..."
                      className="w-full p-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1 resize-y"
                    />
                    <button
                      onClick={handleSaveComment}
                      disabled={savingComment}
                      className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg border-none cursor-pointer hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {savingComment ? 'Saving...' : 'Save Comment'}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-ec-t2 m-0 italic">
                    {staffComment || 'No comments added yet.'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ─── Competencies Tab ─── */}
          {tab === 'competencies' && (
            <div className="space-y-3">
              {avgRating && (
                <div className="text-sm text-ec-t3 mb-2">
                  Average score: <span className="font-bold text-ec-t1">{avgRating}/5</span>
                </div>
              )}
              {COMPETENCIES.map(comp => {
                const r = ratings.find(r => (r.competency) === comp.key)
                const rating = r?.rating || 0
                const comment = r?.comment || ''
                const modules = COMPETENCY_MODULE_MAP[comp.key] || []
                const showGap = rating > 0 && rating <= 2 && modules.length > 0

                return (
                  <div key={comp.key} className="p-3 bg-ec-card border border-ec-div rounded-lg">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-ec-t1 m-0">{comp.label}</h4>
                        <p className="text-xs text-ec-t3 m-0 mt-0.5">{comp.description}</p>
                      </div>
                      <RatingStars value={rating} size="sm" />
                    </div>
                    {comment && <p className="text-xs text-ec-t2 mt-2 m-0 italic">{comment}</p>}
                    {showGap && (
                      <div className="mt-2 p-2 bg-ec-warn-faint border border-ec-warn rounded text-xs text-ec-warn">
                        Training gap detected — consider re-training: {modules.join(', ')}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ─── Goals Tab ─── */}
          {tab === 'goals' && (
            <div className="space-y-3">
              {goals.length === 0 && <p className="text-sm text-ec-t3 italic">No goals set yet.</p>}
              {goals.map(g => {
                const gStatus = g.status || 'Not Started'
                const isCarried = gStatus === 'Carried Over'
                return (
                  <div
                    key={g.id}
                    className={`p-3 bg-ec-card border rounded-lg ${isCarried ? 'border-l-4 border-l-amber-400 border-ec-div' : 'border-ec-div'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-ec-t1 m-0 flex-1">{g.goalText || g.goal_text}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${GOAL_STATUS_COLORS[gStatus] || ''}`}>
                        {gStatus}
                      </span>
                    </div>
                    {(g.targetDate || g.target_date) && (
                      <p className="text-xs text-ec-t3 mt-1 m-0">Target: {new Date(g.targetDate || g.target_date).toLocaleDateString('en-GB')}</p>
                    )}
                    {(g.progressNotes || g.progress_notes) && (
                      <p className="text-xs text-ec-t2 mt-1 m-0 italic">{g.progressNotes || g.progress_notes}</p>
                    )}
                    {/* Staff can add progress notes, managers can change status */}
                    {(isOwnAppraisal || isElevated) && gStatus !== 'Completed' && (
                      <div className="flex gap-2 mt-2 print:hidden">
                        {isElevated && (
                          <select
                            value={gStatus}
                            onChange={e => onUpdateGoal(g.id, { status: e.target.value })}
                            className="text-xs border border-ec-div rounded px-1.5 py-1 bg-ec-card text-ec-t1"
                          >
                            {GOAL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
              {/* Add goal form (manager only, non-archived) */}
              {isElevated && status !== 'Archived' && (
                <div className="p-3 border border-dashed border-ec-div rounded-lg print:hidden">
                  <h4 className="text-xs font-semibold text-ec-t3 uppercase mb-2">Add Goal</h4>
                  <input
                    value={newGoal.goalText}
                    onChange={e => setNewGoal(g => ({ ...g, goalText: e.target.value }))}
                    placeholder="Goal description..."
                    className="w-full p-2 text-sm border border-ec-div rounded bg-ec-card text-ec-t1 mb-2"
                  />
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={newGoal.targetDate}
                      onChange={e => setNewGoal(g => ({ ...g, targetDate: e.target.value }))}
                      className="flex-1 p-2 text-sm border border-ec-div rounded bg-ec-card text-ec-t1"
                    />
                    <button onClick={handleAddGoal} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded border-none cursor-pointer hover:bg-emerald-700">
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Actions Tab ─── */}
          {tab === 'actions' && (
            <div className="space-y-3">
              {actions.length === 0 && <p className="text-sm text-ec-t3 italic">No action items.</p>}
              {actions.map(a => {
                const isOverdue = !a.completed && a.dueDate && new Date(a.dueDate || a.due_date) < new Date()
                return (
                  <div key={a.id} className={`p-3 bg-ec-card border rounded-lg ${isOverdue ? 'border-red-300' : 'border-ec-div'}`}>
                    <div className="flex items-start gap-2">
                      {isElevated ? (
                        <input
                          type="checkbox"
                          checked={a.completed}
                          onChange={e => onUpdateAction(a.id, { completed: e.target.checked })}
                          className="mt-0.5 accent-emerald-600 print:hidden"
                        />
                      ) : (
                        <div className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center text-xs ${a.completed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-ec-div'}`}>
                          {a.completed && '✓'}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className={`text-sm m-0 ${a.completed ? 'line-through text-ec-t3' : 'text-ec-t1 font-medium'}`}>
                          {a.actionText || a.action_text}
                        </p>
                        <div className="flex gap-3 mt-1 text-xs text-ec-t3">
                          {(a.owner) && <span>Owner: {a.owner}</span>}
                          {(a.dueDate || a.due_date) && (
                            <span className={isOverdue ? 'text-ec-crit font-semibold' : ''}>
                              Due: {new Date(a.dueDate || a.due_date).toLocaleDateString('en-GB')}
                              {isOverdue && ' (overdue)'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              {/* Add action (manager only) */}
              {isElevated && status !== 'Archived' && (
                <div className="p-3 border border-dashed border-ec-div rounded-lg print:hidden">
                  <h4 className="text-xs font-semibold text-ec-t3 uppercase mb-2">Add Action</h4>
                  <input
                    value={newAction.actionText}
                    onChange={e => setNewAction(a => ({ ...a, actionText: e.target.value }))}
                    placeholder="Action description..."
                    className="w-full p-2 text-sm border border-ec-div rounded bg-ec-card text-ec-t1 mb-2"
                  />
                  <div className="flex gap-2">
                    <input
                      value={newAction.owner}
                      onChange={e => setNewAction(a => ({ ...a, owner: e.target.value }))}
                      placeholder="Owner..."
                      className="flex-1 p-2 text-sm border border-ec-div rounded bg-ec-card text-ec-t1"
                    />
                    <input
                      type="date"
                      value={newAction.dueDate}
                      onChange={e => setNewAction(a => ({ ...a, dueDate: e.target.value }))}
                      className="flex-1 p-2 text-sm border border-ec-div rounded bg-ec-card text-ec-t1"
                    />
                    <button onClick={handleAddAction} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded border-none cursor-pointer hover:bg-emerald-700">
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── History Tab (manager only) ─── */}
          {tab === 'history' && isElevated && (
            <div className="space-y-4">
              {/* Peer Feedback */}
              <div>
                <h4 className="text-sm font-semibold text-ec-t1 mb-2">Peer Feedback</h4>
                {(!feedback || feedback.length === 0) ? (
                  <p className="text-sm text-ec-t3 italic">No peer feedback collected.</p>
                ) : (
                  <div className="space-y-3">
                    {PEER_FEEDBACK_QUESTIONS.map((q, qi) => {
                      const responses = feedback
                        .filter(f => f.submitted)
                        .flatMap(f => f.responses.filter(r => (r.questionIndex || r.question_index) === qi))
                      return (
                        <div key={qi} className="p-3 bg-ec-card border border-ec-div rounded-lg">
                          <p className="text-sm font-medium text-ec-t1 m-0 mb-2">{q}</p>
                          {responses.length === 0 ? (
                            <p className="text-xs text-ec-t3 italic m-0">No responses yet.</p>
                          ) : (
                            responses.map((r, i) => (
                              <p key={i} className="text-xs text-ec-t2 m-0 mb-1 pl-3 border-l-2 border-emerald-200">
                                {r.response}
                              </p>
                            ))
                          )}
                        </div>
                      )
                    })}
                    <p className="text-xs text-ec-t3 italic">
                      {feedback.filter(f => f.submitted).length} of {feedback.length} responses received (shown anonymously)
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-ec-bg border-t border-ec-div px-6 py-3 flex gap-2 justify-end print:hidden">
          {isElevated && status !== 'Archived' && (
            <button
              onClick={() => onArchive(appraisal.id)}
              className="px-3 py-1.5 text-xs font-medium text-ec-t3 bg-transparent border border-ec-div rounded-lg cursor-pointer hover:bg-ec-card"
            >
              Archive
            </button>
          )}
          <button
            onClick={printPanel}
            className="px-3 py-1.5 text-xs font-medium text-ec-t2 bg-transparent border border-ec-div rounded-lg cursor-pointer hover:bg-ec-card"
          >
            Print
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg border-none cursor-pointer hover:bg-emerald-700"
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
        @media print {
          body > *:not(.print-target) { display: none !important; }
          .print\\:hidden { display: none !important; }
          .print\\:static { position: static !important; }
          .print\\:block { display: block !important; }
          .print\\:max-w-none { max-width: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:h-auto { height: auto !important; }
          .print\\:border-b-2 { border-bottom-width: 2px !important; }
          .print\\:border-black { border-color: black !important; }
          .print\\:space-y-2 > * + * { margin-top: 0.5rem !important; }
        }
      `}</style>
    </div>
  )

  return createPortal(panel, document.body)
}
