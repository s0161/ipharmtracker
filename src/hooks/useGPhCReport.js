import { useSupabase } from './useSupabase'

/**
 * Fetches all raw evidence data needed for the GPhC Inspection Report.
 * Date filtering is done client-side in the page component via useMemo.
 * Use alongside useGPhCScores() which provides computed standard scores.
 */
export function useGPhCReport() {
  const [nearMisses, , l1] = useSupabase('near_misses', [])
  const [actionItems, , l2] = useSupabase('action_items', [])
  const [auditLog, , l3] = useSupabase('audit_log', [])
  const [mhraAcks, , l4] = useSupabase('mhra_alert_acknowledgements', [])
  const [trainingLogs, , l5] = useSupabase('training_logs', [])
  const [trainingTopics, , l6] = useSupabase('training_topics', [])
  const [staffMembers, , l7] = useSupabase('staff_members', [])
  const [staffTraining, , l8] = useSupabase('staff_training', [])
  const [inductionCompletions, , l9] = useSupabase('induction_completions', [])
  const [inductionModules, , l10] = useSupabase('induction_modules', [])
  const [appraisals, , l11] = useSupabase('appraisals', [])
  const [fridgeLogs, , l12] = useSupabase('fridge_temperature_logs', [])
  const [cleaningEntries, , l13] = useSupabase('cleaning_entries', [])
  const [cleaningTasks, , l14] = useSupabase('cleaning_tasks', [])
  const [patientQueries, , l15] = useSupabase('patient_queries', [])
  const [mhraFlags, , l16] = useSupabase('mhra_alert_flags', [])
  const [documents, , l17] = useSupabase('documents', [])

  const loading = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9 ||
    l10 || l11 || l12 || l13 || l14 || l15 || l16 || l17

  return {
    data: {
      nearMisses,
      actionItems,
      auditLog,
      mhraAcks,
      trainingLogs,
      trainingTopics,
      staffMembers,
      staffTraining,
      inductionCompletions,
      inductionModules,
      appraisals,
      fridgeLogs,
      cleaningEntries,
      cleaningTasks,
      patientQueries,
      mhraFlags,
      documents,
    },
    loading,
  }
}
