import { useState } from 'react'
import { PEER_FEEDBACK_QUESTIONS } from '../../data/appraisalData'

export default function PeerFeedbackForm({ request, onSubmit }) {
  const [answers, setAnswers] = useState(PEER_FEEDBACK_QUESTIONS.map(() => ''))
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (answers.some(a => !a.trim())) return
    setSubmitting(true)
    await onSubmit(request.id, answers)
    setSubmitting(false)
  }

  return (
    <div className="p-4 bg-ec-card border border-emerald-200 rounded-lg">
      <h4 className="text-sm font-semibold text-ec-t1 m-0 mb-3">Peer Feedback Request</h4>
      <p className="text-xs text-ec-t3 mb-3">Your responses will be shared anonymously with the appraiser.</p>
      <div className="space-y-3">
        {PEER_FEEDBACK_QUESTIONS.map((q, i) => (
          <div key={i}>
            <p className="text-sm text-ec-t1 font-medium m-0 mb-1">{q}</p>
            <textarea
              value={answers[i]}
              onChange={e => {
                const next = [...answers]
                next[i] = e.target.value
                setAnswers(next)
              }}
              rows={2}
              placeholder="Your response..."
              className="w-full p-2 text-sm border border-ec-div rounded bg-ec-bg text-ec-t1 resize-y"
            />
          </div>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        disabled={submitting || answers.some(a => !a.trim())}
        className="mt-3 px-4 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg border-none cursor-pointer hover:bg-emerald-700 disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </div>
  )
}
