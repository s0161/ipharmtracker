import { useMemo, useCallback } from 'react'
import { useSupabase } from './useSupabase'
import { supabase } from '../lib/supabase'
import { generateId } from '../utils/helpers'

/**
 * Maps a DB SOP row (snake_case) back to component camelCase.
 * useSupabase already does basic snake→camel, but we need to handle
 * the special column renames (ref_documents → references, etc.)
 */
function mapSopFromDb(sop) {
  return {
    ...sop,
    // Special renames
    references: sop.refDocuments || sop.ref_documents || [],
    relatedSOPs: sop.relatedSops || sop.related_sops || [],
    reviewDate: sop.reviewDate || sop.review_date,
    effectiveDate: sop.effectiveDate || sop.effective_date,
    approvedBy: sop.approvedBy || sop.approved_by,
    keyPoints: sop.keyPoints || sop.key_points || [],
    riskAssessment: sop.riskAssessment || sop.risk_assessment || [],
    riskLevel: sop.riskLevel || sop.risk_level || 'Low',
    revisionHistory: sop.revisionHistory || sop.revision_history || [],
    reviewTriggers: sop.reviewTriggers || sop.review_triggers || [],
    trainingRequirements: sop.trainingRequirements || sop.training_requirements || [],
    flaggedForReview: sop.flaggedForReview ?? sop.flagged_for_review ?? false,
    flagReason: sop.flagReason || sop.flag_reason || null,
  }
}

export function useSOPData() {
  const [rawSops, , sopsLoading] = useSupabase('sops', [])
  const [rawAcks, , acksLoading] = useSupabase('sop_acknowledgements', [])

  const sops = useMemo(() => rawSops.map(mapSopFromDb), [rawSops])

  const acksBySop = useMemo(() => {
    const map = {}
    rawAcks.forEach(ack => {
      const sopId = ack.sopId || ack.sop_id
      if (!sopId) return
      if (!map[sopId]) map[sopId] = []
      map[sopId].push({
        name: ack.acknowledgedBy || ack.acknowledged_by,
        date: ack.acknowledgedAt || ack.acknowledged_at,
      })
    })
    return map
  }, [rawAcks])

  const loading = sopsLoading || acksLoading

  const acknowledge = useCallback(async (sopId, staffName) => {
    const { error } = await supabase.from('sop_acknowledgements').insert({
      id: generateId(),
      sop_id: sopId,
      acknowledged_by: staffName,
      acknowledged_at: new Date().toISOString(),
    })
    if (error) {
      console.error('[useSOPData] Acknowledge failed:', error.message)
      return false
    }
    return true
  }, [])

  const flagForReview = useCallback(async (sopId, reason) => {
    const { error } = await supabase.from('sops').update({
      flagged_for_review: true,
      flag_reason: reason,
    }).eq('id', sopId)
    if (error) {
      console.error('[useSOPData] Flag failed:', error.message)
      return false
    }
    return true
  }, [])

  return { sops, acksBySop, loading, acknowledge, flagForReview }
}
