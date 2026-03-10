import { useMemo, useCallback } from 'react'
import { useSupabase } from './useSupabase'
import { supabase } from '../lib/supabase'
import { generateId } from '../utils/helpers'

export function useAppraisalData() {
  const [rawAppraisals, , appraisalsLoading] = useSupabase('appraisals', [])
  const [rawGoals, , goalsLoading] = useSupabase('appraisal_goals', [])
  const [rawRatings, , ratingsLoading] = useSupabase('appraisal_ratings', [])
  const [rawActions, , actionsLoading] = useSupabase('appraisal_actions', [])
  const [rawTemplates] = useSupabase('appraisal_templates', [])
  const [rawFeedbackReqs] = useSupabase('peer_feedback_requests', [])
  const [rawFeedbackResp] = useSupabase('peer_feedback_responses', [])

  const loading = appraisalsLoading || goalsLoading || ratingsLoading || actionsLoading

  // Sort appraisals newest first
  const appraisals = useMemo(() =>
    [...rawAppraisals].sort((a, b) =>
      new Date(b.appraisalDate || b.appraisal_date) - new Date(a.appraisalDate || a.appraisal_date)
    ), [rawAppraisals])

  // Group goals by appraisal_id
  const goalsByAppraisal = useMemo(() => {
    const map = {}
    rawGoals.forEach(g => {
      const aid = g.appraisalId || g.appraisal_id
      if (!aid) return
      if (!map[aid]) map[aid] = []
      map[aid].push(g)
    })
    return map
  }, [rawGoals])

  // Group ratings by appraisal_id
  const ratingsByAppraisal = useMemo(() => {
    const map = {}
    rawRatings.forEach(r => {
      const aid = r.appraisalId || r.appraisal_id
      if (!aid) return
      if (!map[aid]) map[aid] = []
      map[aid].push(r)
    })
    return map
  }, [rawRatings])

  // Group actions by appraisal_id
  const actionsByAppraisal = useMemo(() => {
    const map = {}
    rawActions.forEach(a => {
      const aid = a.appraisalId || a.appraisal_id
      if (!aid) return
      if (!map[aid]) map[aid] = []
      map[aid].push(a)
    })
    return map
  }, [rawActions])

  // Group feedback requests + responses by appraisal_id
  const feedbackByAppraisal = useMemo(() => {
    const respByReq = {}
    rawFeedbackResp.forEach(r => {
      const rid = r.requestId || r.request_id
      if (!rid) return
      if (!respByReq[rid]) respByReq[rid] = []
      respByReq[rid].push(r)
    })
    const map = {}
    rawFeedbackReqs.forEach(req => {
      const aid = req.appraisalId || req.appraisal_id
      if (!aid) return
      if (!map[aid]) map[aid] = []
      map[aid].push({
        ...req,
        responses: respByReq[req.id] || [],
      })
    })
    return map
  }, [rawFeedbackReqs, rawFeedbackResp])

  // ─── Mutations ───

  const createAppraisal = useCallback(async (data) => {
    const id = generateId()
    const { error } = await supabase.from('appraisals').insert({
      id,
      staff_name: data.staffName,
      conducted_by: data.conductedBy,
      appraisal_date: data.appraisalDate,
      appraisal_type: data.appraisalType,
      status: data.status || 'Draft',
      overall_rating: data.overallRating || null,
      summary: data.summary || null,
      strengths: data.strengths || null,
      areas_for_development: data.areasForDevelopment || null,
      next_appraisal_date: data.nextAppraisalDate || null,
      is_confidential: data.isConfidential || false,
    })
    if (error) {
      console.error('[useAppraisalData] Create failed:', error.message)
      return null
    }
    return id
  }, [])

  const updateAppraisal = useCallback(async (id, updates) => {
    const dbUpdates = {}
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.overallRating !== undefined) dbUpdates.overall_rating = updates.overallRating
    if (updates.summary !== undefined) dbUpdates.summary = updates.summary
    if (updates.strengths !== undefined) dbUpdates.strengths = updates.strengths
    if (updates.areasForDevelopment !== undefined) dbUpdates.areas_for_development = updates.areasForDevelopment
    if (updates.staffComments !== undefined) dbUpdates.staff_comments = updates.staffComments
    if (updates.staffAcknowledged !== undefined) dbUpdates.staff_acknowledged = updates.staffAcknowledged
    if (updates.staffAcknowledgedAt !== undefined) dbUpdates.staff_acknowledged_at = updates.staffAcknowledgedAt
    if (updates.nextAppraisalDate !== undefined) dbUpdates.next_appraisal_date = updates.nextAppraisalDate
    if (updates.isConfidential !== undefined) dbUpdates.is_confidential = updates.isConfidential
    const { error } = await supabase.from('appraisals').update(dbUpdates).eq('id', id)
    if (error) console.error('[useAppraisalData] Update failed:', error.message)
    return !error
  }, [])

  const addGoal = useCallback(async (appraisalId, goalData) => {
    const { error } = await supabase.from('appraisal_goals').insert({
      id: generateId(),
      appraisal_id: appraisalId,
      goal_text: goalData.goalText,
      target_date: goalData.targetDate || null,
      status: goalData.status || 'Not Started',
      progress_notes: goalData.progressNotes || null,
    })
    if (error) console.error('[useAppraisalData] Add goal failed:', error.message)
    return !error
  }, [])

  const updateGoal = useCallback(async (goalId, updates) => {
    const dbUpdates = {}
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.progressNotes !== undefined) dbUpdates.progress_notes = updates.progressNotes
    if (updates.goalText !== undefined) dbUpdates.goal_text = updates.goalText
    if (updates.targetDate !== undefined) dbUpdates.target_date = updates.targetDate
    const { error } = await supabase.from('appraisal_goals').update(dbUpdates).eq('id', goalId)
    if (error) console.error('[useAppraisalData] Update goal failed:', error.message)
    return !error
  }, [])

  const saveRatings = useCallback(async (appraisalId, ratings) => {
    // Delete existing ratings for this appraisal, then insert fresh
    await supabase.from('appraisal_ratings').delete().eq('appraisal_id', appraisalId)
    const rows = ratings.map(r => ({
      id: generateId(),
      appraisal_id: appraisalId,
      competency: r.competency,
      rating: r.rating,
      comment: r.comment || null,
    }))
    const { error } = await supabase.from('appraisal_ratings').insert(rows)
    if (error) console.error('[useAppraisalData] Save ratings failed:', error.message)
    return !error
  }, [])

  const addAction = useCallback(async (appraisalId, actionData) => {
    const { error } = await supabase.from('appraisal_actions').insert({
      id: generateId(),
      appraisal_id: appraisalId,
      action_text: actionData.actionText,
      owner: actionData.owner || null,
      due_date: actionData.dueDate || null,
      completed: false,
    })
    if (error) console.error('[useAppraisalData] Add action failed:', error.message)
    return !error
  }, [])

  const updateAction = useCallback(async (actionId, updates) => {
    const dbUpdates = {}
    if (updates.actionText !== undefined) dbUpdates.action_text = updates.actionText
    if (updates.owner !== undefined) dbUpdates.owner = updates.owner
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate
    if (updates.completed !== undefined) {
      dbUpdates.completed = updates.completed
      dbUpdates.completed_at = updates.completed ? new Date().toISOString() : null
    }
    const { error } = await supabase.from('appraisal_actions').update(dbUpdates).eq('id', actionId)
    if (error) console.error('[useAppraisalData] Update action failed:', error.message)
    return !error
  }, [])

  const acknowledgeAppraisal = useCallback(async (id) => {
    const { error } = await supabase.from('appraisals').update({
      status: 'Acknowledged',
      staff_acknowledged: true,
      staff_acknowledged_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) console.error('[useAppraisalData] Acknowledge failed:', error.message)
    return !error
  }, [])

  const requestPeerFeedback = useCallback(async (appraisalId, staffNames) => {
    const rows = staffNames.map(name => ({
      id: generateId(),
      appraisal_id: appraisalId,
      requested_from: name,
      submitted: false,
    }))
    const { error } = await supabase.from('peer_feedback_requests').insert(rows)
    if (error) console.error('[useAppraisalData] Request feedback failed:', error.message)
    return !error
  }, [])

  const submitPeerFeedback = useCallback(async (requestId, answers) => {
    const rows = answers.map((response, i) => ({
      id: generateId(),
      request_id: requestId,
      question_index: i,
      response,
    }))
    const { error: respErr } = await supabase.from('peer_feedback_responses').insert(rows)
    if (respErr) {
      console.error('[useAppraisalData] Submit feedback failed:', respErr.message)
      return false
    }
    await supabase.from('peer_feedback_requests').update({
      submitted: true,
      submitted_at: new Date().toISOString(),
    }).eq('id', requestId)
    return true
  }, [])

  const carryOverGoals = useCallback(async (fromAppraisalId, toAppraisalId) => {
    const goals = (goalsByAppraisal[fromAppraisalId] || [])
      .filter(g => (g.status || g.status) !== 'Completed')
    const rows = goals.map(g => ({
      id: generateId(),
      appraisal_id: toAppraisalId,
      goal_text: g.goalText || g.goal_text,
      target_date: g.targetDate || g.target_date || null,
      status: 'Carried Over',
      progress_notes: g.progressNotes || g.progress_notes || null,
    }))
    if (rows.length === 0) return true
    const { error } = await supabase.from('appraisal_goals').insert(rows)
    if (error) console.error('[useAppraisalData] Carry over failed:', error.message)
    return !error
  }, [goalsByAppraisal])

  // ─── Analytics ───

  const getStaffAppraisalHistory = useCallback((staffName) => {
    return appraisals.filter(a =>
      (a.staffName || a.staff_name) === staffName
    )
  }, [appraisals])

  const getAppraisalDueStatus = useCallback((staffName) => {
    const history = appraisals.filter(a =>
      (a.staffName || a.staff_name) === staffName &&
      (a.status || '') !== 'Archived'
    )
    if (history.length === 0) return { status: 'overdue', monthsSince: null }
    const latest = history[0] // already sorted newest first
    const lastDate = new Date(latest.appraisalDate || latest.appraisal_date)
    const months = Math.floor((Date.now() - lastDate) / (1000 * 60 * 60 * 24 * 30.44))
    if (months >= 13) return { status: 'overdue', monthsSince: months }
    if (months >= 11) return { status: 'due-soon', monthsSince: months }
    return { status: 'ok', monthsSince: months }
  }, [appraisals])

  const getTeamStats = useCallback(() => {
    const year = new Date().getFullYear()
    const thisYear = appraisals.filter(a => {
      const d = new Date(a.appraisalDate || a.appraisal_date)
      return d.getFullYear() === year && (a.status !== 'Draft')
    })
    const allRatings = thisYear
      .map(a => a.overallRating || a.overall_rating)
      .filter(Boolean)
    const avgRating = allRatings.length > 0
      ? (allRatings.reduce((s, r) => s + r, 0) / allRatings.length).toFixed(1)
      : null
    return {
      completedThisYear: thisYear.length,
      avgRating,
    }
  }, [appraisals])

  return {
    appraisals,
    goalsByAppraisal,
    ratingsByAppraisal,
    actionsByAppraisal,
    feedbackByAppraisal,
    templates: rawTemplates,
    loading,
    createAppraisal,
    updateAppraisal,
    addGoal,
    updateGoal,
    saveRatings,
    addAction,
    updateAction,
    acknowledgeAppraisal,
    requestPeerFeedback,
    submitPeerFeedback,
    carryOverGoals,
    getStaffAppraisalHistory,
    getAppraisalDueStatus,
    getTeamStats,
  }
}
