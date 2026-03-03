import { supabase } from '../lib/supabase'

export async function logAudit(action, item, page, userName) {
  try {
    await supabase.from('audit_log').insert({
      timestamp: new Date().toISOString(),
      action,
      item,
      user: userName || 'System',
      page,
    })
  } catch (e) {
    console.warn('Audit log failed:', e)
  }
}
