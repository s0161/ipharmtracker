import { supabase } from '../lib/supabase'

export async function logAudit(action, item, page, userName) {
  try {
    await supabase.from('audit_log').insert({
      timestamp: new Date().toISOString(),
      action,
      detail: item,
      user: userName || 'System',
      module: page,
    })
  } catch (e) {
    console.warn('Audit log failed:', e)
  }
}
