import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import RatingStars from './RatingStars'
import { COMPETENCIES, APPRAISAL_TYPES, GOAL_STATUSES } from '../../data/appraisalData'

const STEP_LABELS = ['Details', 'Competencies', 'Summary', 'Goals', 'Actions', 'Review']

export default function NewAppraisalForm({
  staffList,
  templates,
  previousAppraisals,
  goalsByAppraisal,
  currentUser,
  onSave,
  onClose,
}) {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  // Step 1 — Details
  const [staffName, setStaffName] = useState('')
  const [appraisalType, setAppraisalType] = useState('Annual')
  const [appraisalDate, setAppraisalDate] = useState(new Date().toISOString().slice(0, 10))
  const [templateId, setTemplateId] = useState('')
  const [isConfidential, setIsConfidential] = useState(false)

  // Step 2 — Competency ratings
  const [ratings, setRatings] = useState(
    COMPETENCIES.map(c => ({ competency: c.key, rating: 0, comment: '' }))
  )

  // Step 3 — Summary
  const [summary, setSummary] = useState('')
  const [strengths, setStrengths] = useState('')
  const [areasForDevelopment, setAreasForDevelopment] = useState('')
  const [overallRating, setOverallRating] = useState(0)

  // Step 4 — Goals
  const [goals, setGoals] = useState([])

  // Step 5 — Actions
  const [actions, setActions] = useState([])

  // Step 6 — Review
  const [peerFeedbackNames, setPeerFeedbackNames] = useState([])

  // Carry-over goals from previous appraisal
  const carryOverGoals = useMemo(() => {
    if (!staffName) return []
    const prev = previousAppraisals.find(a =>
      (a.staffName || a.staff_name) === staffName
    )
    if (!prev) return []
    const prevGoals = goalsByAppraisal[prev.id] || []
    return prevGoals.filter(g => g.status !== 'Completed')
  }, [staffName, previousAppraisals, goalsByAppraisal])

  // Auto-load carry-overs when staff selected
  const handleStaffChange = (name) => {
    setStaffName(name)
    // Reset goals, let step 4 populate them
  }

  // When entering step 4, populate with template + carry-over goals
  const populateGoals = () => {
    const tpl = templates.find(t => t.id === templateId)
    const suggested = tpl
      ? (JSON.parse(typeof tpl.suggestedGoals === 'string' ? tpl.suggestedGoals : JSON.stringify(tpl.suggestedGoals || tpl.suggested_goals || '[]')))
          .map(text => ({ goalText: text, targetDate: '', status: 'Not Started', isCarryOver: false }))
      : []
    const carried = carryOverGoals.map(g => ({
      goalText: g.goalText || g.goal_text,
      targetDate: g.targetDate || g.target_date || '',
      status: 'Carried Over',
      isCarryOver: true,
    }))
    if (goals.length === 0) {
      setGoals([...carried, ...suggested])
    }
  }

  const handleNext = () => {
    if (step === 3) populateGoals()
    setStep(s => Math.min(s + 1, 5))
  }

  const handleSave = async (saveStatus) => {
    setSaving(true)
    const nextDate = new Date(appraisalDate)
    nextDate.setFullYear(nextDate.getFullYear() + 1)

    await onSave({
      staffName,
      conductedBy: currentUser,
      appraisalDate,
      appraisalType,
      status: saveStatus,
      overallRating: overallRating || null,
      summary: summary || null,
      strengths: strengths || null,
      areasForDevelopment: areasForDevelopment || null,
      nextAppraisalDate: nextDate.toISOString().slice(0, 10),
      isConfidential,
      ratings: ratings.filter(r => r.rating > 0),
      goals,
      actions,
      peerFeedbackNames,
    })
    setSaving(false)
  }

  const canProceed = () => {
    if (step === 0) return staffName && appraisalDate
    return true
  }

  const panel = (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-ec-bg h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-ec-bg border-b border-ec-div px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-ec-t1 m-0">New Appraisal</h2>
            <button onClick={onClose} className="text-ec-t3 hover:text-ec-t1 bg-transparent border-none text-xl cursor-pointer">&times;</button>
          </div>
          {/* Progress */}
          <div className="flex gap-1 mt-3">
            {STEP_LABELS.map((label, i) => (
              <div key={i} className="flex-1">
                <div className={`h-1 rounded-full ${i <= step ? 'bg-ec-em' : 'bg-ec-div'}`} />
                <p className={`text-[10px] mt-1 m-0 ${i === step ? 'text-ec-em font-semibold' : 'text-ec-t3'}`}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 px-6 py-4 overflow-y-auto">
          {/* Step 0 — Details */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ec-t1 mb-1">Staff Member</label>
                <select value={staffName} onChange={e => handleStaffChange(e.target.value)} className="w-full p-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1">
                  <option value="">Select staff member...</option>
                  {staffList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ec-t1 mb-1">Appraisal Type</label>
                <select value={appraisalType} onChange={e => setAppraisalType(e.target.value)} className="w-full p-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1">
                  {APPRAISAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ec-t1 mb-1">Date</label>
                <input type="date" value={appraisalDate} onChange={e => setAppraisalDate(e.target.value)} className="w-full p-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ec-t1 mb-1">Template (optional)</label>
                <select value={templateId} onChange={e => setTemplateId(e.target.value)} className="w-full p-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1">
                  <option value="">No template</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-ec-t2 cursor-pointer">
                <input type="checkbox" checked={isConfidential} onChange={e => setIsConfidential(e.target.checked)} className="accent-emerald-600" />
                Mark as confidential (superintendent only)
              </label>
              {carryOverGoals.length > 0 && (
                <div className="p-3 bg-ec-warn-faint border border-ec-warn rounded-lg text-sm text-ec-warn">
                  {carryOverGoals.length} incomplete goal{carryOverGoals.length > 1 ? 's' : ''} will be carried over from previous appraisal.
                </div>
              )}
            </div>
          )}

          {/* Step 1 — Competency Ratings */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-ec-t3 mb-2">Rate each competency from 1-5. Click a star to set the rating.</p>
              {COMPETENCIES.map((comp, i) => (
                <div key={comp.key} className="p-3 bg-ec-card border border-ec-div rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-semibold text-ec-t1 m-0">{comp.label}</h4>
                      <p className="text-xs text-ec-t3 m-0">{comp.description}</p>
                    </div>
                    <RatingStars
                      value={ratings[i].rating}
                      onChange={val => {
                        const next = [...ratings]
                        next[i] = { ...next[i], rating: val }
                        setRatings(next)
                      }}
                      editable
                      size="md"
                    />
                  </div>
                  <input
                    value={ratings[i].comment}
                    onChange={e => {
                      const next = [...ratings]
                      next[i] = { ...next[i], comment: e.target.value }
                      setRatings(next)
                    }}
                    placeholder="Comment (optional)..."
                    className="w-full mt-2 p-1.5 text-xs border border-ec-div rounded bg-ec-bg text-ec-t1"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Step 2 — Summary */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ec-t1 mb-1">Overall Rating</label>
                <RatingStars value={overallRating} onChange={setOverallRating} editable size="lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ec-t1 mb-1">Summary</label>
                <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={3} placeholder="Overall appraisal summary..." className="w-full p-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1 resize-y" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ec-em mb-1">Strengths</label>
                <textarea value={strengths} onChange={e => setStrengths(e.target.value)} rows={3} placeholder="Key strengths demonstrated..." className="w-full p-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1 resize-y" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ec-warn mb-1">Areas for Development</label>
                <textarea value={areasForDevelopment} onChange={e => setAreasForDevelopment(e.target.value)} rows={3} placeholder="Areas needing improvement..." className="w-full p-2 text-sm border border-ec-div rounded-lg bg-ec-card text-ec-t1 resize-y" />
              </div>
            </div>
          )}

          {/* Step 3 — Goals */}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-ec-t3 mb-2">Set development goals. Carried-over goals are highlighted.</p>
              {goals.map((g, i) => (
                <div key={i} className={`p-3 bg-ec-card border rounded-lg ${g.isCarryOver ? 'border-l-4 border-l-amber-400 border-ec-div' : 'border-ec-div'}`}>
                  <div className="flex gap-2">
                    <input
                      value={g.goalText}
                      onChange={e => {
                        const next = [...goals]
                        next[i] = { ...next[i], goalText: e.target.value }
                        setGoals(next)
                      }}
                      placeholder="Goal description..."
                      className="flex-1 p-2 text-sm border border-ec-div rounded bg-ec-bg text-ec-t1"
                    />
                    <input
                      type="date"
                      value={g.targetDate}
                      onChange={e => {
                        const next = [...goals]
                        next[i] = { ...next[i], targetDate: e.target.value }
                        setGoals(next)
                      }}
                      className="w-36 p-2 text-sm border border-ec-div rounded bg-ec-bg text-ec-t1"
                    />
                    <button
                      onClick={() => setGoals(goals.filter((_, j) => j !== i))}
                      className="text-red-400 hover:text-ec-crit bg-transparent border-none cursor-pointer text-lg px-1"
                    >
                      &times;
                    </button>
                  </div>
                  {g.isCarryOver && <span className="text-[10px] text-ec-warn font-medium mt-1 block">Carried over</span>}
                </div>
              ))}
              <button
                onClick={() => setGoals([...goals, { goalText: '', targetDate: '', status: 'Not Started', isCarryOver: false }])}
                className="w-full p-2 text-sm text-ec-em bg-transparent border border-dashed border-emerald-300 rounded-lg cursor-pointer hover:bg-emerald-50"
              >
                + Add Goal
              </button>
            </div>
          )}

          {/* Step 4 — Actions */}
          {step === 4 && (
            <div className="space-y-3">
              <p className="text-sm text-ec-t3 mb-2">Add action items with owners and due dates.</p>
              {actions.map((a, i) => (
                <div key={i} className="p-3 bg-ec-card border border-ec-div rounded-lg">
                  <input
                    value={a.actionText}
                    onChange={e => {
                      const next = [...actions]
                      next[i] = { ...next[i], actionText: e.target.value }
                      setActions(next)
                    }}
                    placeholder="Action description..."
                    className="w-full p-2 text-sm border border-ec-div rounded bg-ec-bg text-ec-t1 mb-2"
                  />
                  <div className="flex gap-2">
                    <input
                      value={a.owner}
                      onChange={e => {
                        const next = [...actions]
                        next[i] = { ...next[i], owner: e.target.value }
                        setActions(next)
                      }}
                      placeholder="Owner..."
                      className="flex-1 p-2 text-sm border border-ec-div rounded bg-ec-bg text-ec-t1"
                    />
                    <input
                      type="date"
                      value={a.dueDate}
                      onChange={e => {
                        const next = [...actions]
                        next[i] = { ...next[i], dueDate: e.target.value }
                        setActions(next)
                      }}
                      className="w-36 p-2 text-sm border border-ec-div rounded bg-ec-bg text-ec-t1"
                    />
                    <button
                      onClick={() => setActions(actions.filter((_, j) => j !== i))}
                      className="text-red-400 hover:text-ec-crit bg-transparent border-none cursor-pointer text-lg px-1"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setActions([...actions, { actionText: '', owner: staffName, dueDate: '' }])}
                className="w-full p-2 text-sm text-ec-em bg-transparent border border-dashed border-emerald-300 rounded-lg cursor-pointer hover:bg-emerald-50"
              >
                + Add Action
              </button>
            </div>
          )}

          {/* Step 5 — Review */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="p-4 bg-ec-card border border-ec-div rounded-lg">
                <h4 className="text-sm font-semibold text-ec-t1 mb-2">Review Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-ec-t3">Staff:</span> <span className="font-medium text-ec-t1">{staffName}</span></div>
                  <div><span className="text-ec-t3">Type:</span> <span className="font-medium text-ec-t1">{appraisalType}</span></div>
                  <div><span className="text-ec-t3">Date:</span> <span className="font-medium text-ec-t1">{new Date(appraisalDate).toLocaleDateString('en-GB')}</span></div>
                  <div><span className="text-ec-t3">Rating:</span> {overallRating ? <RatingStars value={overallRating} size="sm" /> : <span className="text-ec-t3 italic">Not set</span>}</div>
                </div>
                <div className="mt-2 text-sm text-ec-t3">
                  {ratings.filter(r => r.rating > 0).length} competencies rated &middot; {goals.length} goals &middot; {actions.length} actions
                </div>
              </div>

              {/* Peer feedback request */}
              <div>
                <h4 className="text-sm font-semibold text-ec-t1 mb-1">Request Peer Feedback (optional)</h4>
                <p className="text-xs text-ec-t3 mb-2">Select colleagues to request anonymous feedback from.</p>
                <div className="flex flex-wrap gap-2">
                  {staffList.filter(s => s !== staffName).map(s => (
                    <label key={s} className="flex items-center gap-1.5 text-sm text-ec-t2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={peerFeedbackNames.includes(s)}
                        onChange={e => {
                          if (e.target.checked) setPeerFeedbackNames([...peerFeedbackNames, s])
                          else setPeerFeedbackNames(peerFeedbackNames.filter(n => n !== s))
                        }}
                        className="accent-emerald-600"
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-ec-bg border-t border-ec-div px-6 py-3 flex justify-between">
          <button
            onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}
            className="px-4 py-1.5 text-sm font-medium text-ec-t2 bg-transparent border border-ec-div rounded-lg cursor-pointer hover:bg-ec-card"
          >
            {step > 0 ? 'Back' : 'Cancel'}
          </button>
          <div className="flex gap-2">
            {step === 5 ? (
              <>
                <button
                  onClick={() => handleSave('Draft')}
                  disabled={saving}
                  className="px-4 py-1.5 text-sm font-medium text-ec-t2 bg-transparent border border-ec-div rounded-lg cursor-pointer hover:bg-ec-card disabled:opacity-50"
                >
                  Save as Draft
                </button>
                <button
                  onClick={() => handleSave('Completed')}
                  disabled={saving}
                  className="px-4 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg border-none cursor-pointer hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Complete'}
                </button>
              </>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-4 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg border-none cursor-pointer hover:bg-emerald-700 disabled:opacity-50"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(panel, document.body)
}
