import { useSupabase } from './useSupabase'
import { supabase } from '../lib/supabase'

export function useRota() {
  const [entries, setEntries, loadingEntries] = useSupabase('rota_entries', [])
  const [staff, , loadingStaff] = useSupabase('staff_members', [])

  async function saveShift(shiftData) {
    const row = {
      pharmacy_id: 'FED07',
      shift_date: shiftData.shiftDate,
      staff_member_id: shiftData.staffMemberId,
      staff_name: shiftData.staffName,
      staff_role: shiftData.staffRole,
      shift_start: shiftData.shiftStart || null,
      shift_end: shiftData.shiftEnd || null,
      is_rp_cover: shiftData.isRpCover || false,
      is_off: shiftData.isOff || false,
      notes: shiftData.notes || null,
      created_by: shiftData.createdBy || null,
      updated_at: new Date().toISOString(),
    }

    if (shiftData.id) {
      row.id = shiftData.id
    }

    const { error } = await supabase
      .from('rota_entries')
      .upsert(row, { onConflict: 'pharmacy_id,shift_date,staff_member_id' })

    return { error }
  }

  async function deleteShift(id) {
    const { error } = await supabase
      .from('rota_entries')
      .delete()
      .eq('id', id)
    return { error }
  }

  // If reassigning RP, clear existing RP for that date
  async function clearRPForDate(dateStr, exceptStaffId) {
    if (!Array.isArray(entries)) return
    const existing = entries.filter(
      e => e.shiftDate === dateStr && e.isRpCover && e.staffMemberId !== exceptStaffId
    )
    for (const entry of existing) {
      await supabase
        .from('rota_entries')
        .update({ is_rp_cover: false, updated_at: new Date().toISOString() })
        .eq('id', entry.id)
    }
  }

  return {
    entries,
    staff,
    loading: loadingEntries || loadingStaff,
    saveShift,
    deleteShift,
    clearRPForDate,
  }
}

// Get Monday of the week containing the given date
export function getMonday(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// Filter entries for a Mon-Sun week
export function getWeekEntries(entries, weekStart) {
  if (!Array.isArray(entries)) return []
  const start = formatDate(weekStart)
  const end = new Date(weekStart)
  end.setDate(end.getDate() + 6)
  const endStr = formatDate(end)
  return entries.filter(e => e.shiftDate >= start && e.shiftDate <= endStr)
}

// Get the RP cover person for a specific date
export function getRPForDate(entries, dateStr) {
  if (!Array.isArray(entries)) return null
  return entries.find(e => e.shiftDate === dateStr && e.isRpCover)
}

// Format date as YYYY-MM-DD
export function formatDate(d) {
  const date = new Date(d)
  return date.getFullYear() + '-' +
    String(date.getMonth() + 1).padStart(2, '0') + '-' +
    String(date.getDate()).padStart(2, '0')
}

// Get array of 7 dates starting from weekStart (Monday)
export function getWeekDays(weekStart) {
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    days.push(d)
  }
  return days
}
