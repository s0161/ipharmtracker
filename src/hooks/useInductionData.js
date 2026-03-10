import { useMemo, useCallback } from 'react'
import { useSupabase } from './useSupabase'
import { supabase } from '../lib/supabase'
import { generateId } from '../utils/helpers'

export function useInductionData() {
  const [rawModules, , modulesLoading] = useSupabase('induction_modules', [])
  const [rawCompletions, , completionsLoading] = useSupabase('induction_completions', [])

  // Sort modules by order_index
  const modules = useMemo(() =>
    [...rawModules].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)),
    [rawModules]
  )

  // Build completions lookup: { moduleId: [{ staffName, completedAt, score }] }
  const completionsByModule = useMemo(() => {
    const map = {}
    rawCompletions.forEach(c => {
      const modId = c.moduleId || c.module_id
      if (!modId) return
      if (!map[modId]) map[modId] = []
      map[modId].push({
        staffName: c.staffName || c.staff_name,
        completedAt: c.completedAt || c.completed_at,
        score: c.score,
      })
    })
    return map
  }, [rawCompletions])

  const loading = modulesLoading || completionsLoading

  // Record a module completion
  const completeModule = useCallback(async (moduleId, staffName, score = null) => {
    const { error } = await supabase.from('induction_completions').upsert({
      id: generateId(),
      module_id: moduleId,
      staff_name: staffName,
      completed_at: new Date().toISOString(),
      score,
    }, { onConflict: 'module_id,staff_name' })
    if (error) {
      console.error('[useInductionData] Complete failed:', error.message)
      return false
    }
    return true
  }, [])

  // Save quiz answers
  const saveQuizAnswers = useCallback(async (moduleId, staffName, answers) => {
    const rows = answers.map((a, i) => ({
      id: generateId(),
      module_id: moduleId,
      staff_name: staffName,
      question_index: i,
      selected_answer: a.selected,
      is_correct: a.isCorrect,
      answered_at: new Date().toISOString(),
    }))
    const { error } = await supabase.from('induction_quiz_answers').insert(rows)
    if (error) {
      console.error('[useInductionData] Quiz save failed:', error.message)
      return false
    }
    return true
  }, [])

  // Get completion status for a specific staff member
  const getStaffProgress = useCallback((staffName) => {
    const completed = rawCompletions.filter(c =>
      (c.staffName || c.staff_name) === staffName
    )
    const completedModuleIds = new Set(completed.map(c => c.moduleId || c.module_id))
    return {
      completed: completed.length,
      total: modules.length,
      percent: modules.length > 0 ? Math.round((completed.length / modules.length) * 100) : 0,
      completedModuleIds,
    }
  }, [rawCompletions, modules])

  return {
    modules,
    completionsByModule,
    loading,
    completeModule,
    saveQuizAnswers,
    getStaffProgress,
  }
}
