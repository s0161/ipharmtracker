import { useMemo, useCallback, useEffect, useState } from 'react'
import { useSupabase } from './useSupabase'
import { supabase } from '../lib/supabase'
import { generateId } from '../utils/helpers'

export function useCareHomeData() {
  const [rawHomes, , homesLoading] = useSupabase('care_homes', [])
  const [rawPatients, , patientsLoading] = useSupabase('care_home_patients', [])
  const [rawCycles, , cyclesLoading] = useSupabase('medication_cycles', [])
  const [rawCycleItems] = useSupabase('cycle_patient_items', [])
  const [rawDeliveries] = useSupabase('care_home_deliveries', [])
  const [rawNotes] = useSupabase('care_home_handover_notes', [])
  const [rawMARIssues] = useSupabase('care_home_mar_issues', [])

  const loading = homesLoading || patientsLoading || cyclesLoading

  // Sort homes alphabetically
  const careHomes = useMemo(() =>
    [...rawHomes].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [rawHomes]
  )

  // Group patients by care_home_id
  const patientsByHome = useMemo(() => {
    const map = {}
    rawPatients.forEach(p => {
      const hid = p.careHomeId || p.care_home_id
      if (!hid) return
      if (!map[hid]) map[hid] = []
      map[hid].push(p)
    })
    return map
  }, [rawPatients])

  // Group cycles by care_home_id
  const cyclesByHome = useMemo(() => {
    const map = {}
    rawCycles.forEach(c => {
      const hid = c.careHomeId || c.care_home_id
      if (!hid) return
      if (!map[hid]) map[hid] = []
      map[hid].push(c)
    })
    // Sort each group by cycle_month desc
    Object.values(map).forEach(arr =>
      arr.sort((a, b) => (b.cycleMonth || b.cycle_month || '').localeCompare(a.cycleMonth || a.cycle_month || ''))
    )
    return map
  }, [rawCycles])

  // Group cycle items by cycle_id
  const itemsByCycle = useMemo(() => {
    const map = {}
    rawCycleItems.forEach(i => {
      const cid = i.cycleId || i.cycle_id
      if (!cid) return
      if (!map[cid]) map[cid] = []
      map[cid].push(i)
    })
    return map
  }, [rawCycleItems])

  // Group deliveries by care_home_id
  const deliveriesByHome = useMemo(() => {
    const map = {}
    rawDeliveries.forEach(d => {
      const hid = d.careHomeId || d.care_home_id
      if (!hid) return
      if (!map[hid]) map[hid] = []
      map[hid].push(d)
    })
    Object.values(map).forEach(arr =>
      arr.sort((a, b) => (b.deliveryDate || b.delivery_date || '').localeCompare(a.deliveryDate || a.delivery_date || ''))
    )
    return map
  }, [rawDeliveries])

  // Group notes by care_home_id
  const notesByHome = useMemo(() => {
    const map = {}
    rawNotes.forEach(n => {
      const hid = n.careHomeId || n.care_home_id
      if (!hid) return
      if (!map[hid]) map[hid] = []
      map[hid].push(n)
    })
    Object.values(map).forEach(arr =>
      arr.sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at))
    )
    return map
  }, [rawNotes])

  // Group MAR issues by care_home_id
  const marIssuesByHome = useMemo(() => {
    const map = {}
    rawMARIssues.forEach(i => {
      const hid = i.careHomeId || i.care_home_id
      if (!hid) return
      if (!map[hid]) map[hid] = []
      map[hid].push(i)
    })
    Object.values(map).forEach(arr =>
      arr.sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at))
    )
    return map
  }, [rawMARIssues])

  // ─── Computed Stats ───
  const overallStats = useMemo(() => {
    const activeHomes = careHomes.filter(h => (h.status || 'Active') === 'Active').length
    const activeCycles = rawCycles.filter(c => {
      const s = c.status || ''
      return s !== 'Delivered' && s !== 'Pending'
    }).length
    const pendingDeliveries = rawDeliveries.filter(d => {
      const s = d.status || ''
      return s === 'Scheduled' || s === 'In Transit'
    }).length
    const openMARIssues = rawMARIssues.filter(i => (i.status || '') !== 'Resolved').length
    return { activeHomes, activeCycles, pendingDeliveries, openMARIssues }
  }, [careHomes, rawCycles, rawDeliveries, rawMARIssues])

  // ─── Care Home CRUD ───
  const addCareHome = useCallback(async (data) => {
    const id = generateId()
    const { error } = await supabase.from('care_homes').insert({
      id,
      name: data.name,
      address: data.address || null,
      phone: data.phone || null,
      email: data.email || null,
      contact_person: data.contactPerson || null,
      patient_count: data.patientCount || 0,
      cycle_day: data.cycleDay || null,
      delivery_method: data.deliveryMethod || 'Delivery',
      notes: data.notes || null,
      status: data.status || 'Active',
    })
    if (error) { console.error('[useCareHomeData] Add home failed:', error.message); return null }
    return id
  }, [])

  const updateCareHome = useCallback(async (id, updates) => {
    const dbUpdates = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.address !== undefined) dbUpdates.address = updates.address
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone
    if (updates.email !== undefined) dbUpdates.email = updates.email
    if (updates.contactPerson !== undefined) dbUpdates.contact_person = updates.contactPerson
    if (updates.patientCount !== undefined) dbUpdates.patient_count = updates.patientCount
    if (updates.cycleDay !== undefined) dbUpdates.cycle_day = updates.cycleDay
    if (updates.deliveryMethod !== undefined) dbUpdates.delivery_method = updates.deliveryMethod
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes
    if (updates.status !== undefined) dbUpdates.status = updates.status
    dbUpdates.updated_at = new Date().toISOString()
    const { error } = await supabase.from('care_homes').update(dbUpdates).eq('id', id)
    if (error) console.error('[useCareHomeData] Update home failed:', error.message)
    return !error
  }, [])

  // ─── Patient CRUD ───
  const addPatient = useCallback(async (data) => {
    const id = generateId()
    const { error } = await supabase.from('care_home_patients').insert({
      id,
      care_home_id: data.careHomeId,
      patient_name: data.patientName,
      room_number: data.roomNumber || null,
      medication_count: data.medicationCount || 0,
      pack_type: data.packType || 'Blister',
      allergies: data.allergies || null,
      notes: data.notes || null,
      is_active: data.isActive !== false,
    })
    if (error) { console.error('[useCareHomeData] Add patient failed:', error.message); return null }
    return id
  }, [])

  const updatePatient = useCallback(async (id, updates) => {
    const dbUpdates = {}
    if (updates.patientName !== undefined) dbUpdates.patient_name = updates.patientName
    if (updates.roomNumber !== undefined) dbUpdates.room_number = updates.roomNumber
    if (updates.medicationCount !== undefined) dbUpdates.medication_count = updates.medicationCount
    if (updates.packType !== undefined) dbUpdates.pack_type = updates.packType
    if (updates.allergies !== undefined) dbUpdates.allergies = updates.allergies
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive
    dbUpdates.updated_at = new Date().toISOString()
    const { error } = await supabase.from('care_home_patients').update(dbUpdates).eq('id', id)
    if (error) console.error('[useCareHomeData] Update patient failed:', error.message)
    return !error
  }, [])

  // ─── Cycle CRUD ───
  const addCycle = useCallback(async (data) => {
    const id = generateId()
    const { error } = await supabase.from('medication_cycles').insert({
      id,
      care_home_id: data.careHomeId,
      cycle_month: data.cycleMonth,
      status: 'Pending',
      patient_count: data.patientCount || 0,
      items_count: data.itemsCount || 0,
      notes: data.notes || null,
    })
    if (error) { console.error('[useCareHomeData] Add cycle failed:', error.message); return null }
    return id
  }, [])

  const updateCycleStatus = useCallback(async (id, status, extraFields = {}) => {
    const dbUpdates = { status, updated_at: new Date().toISOString() }
    if (status === 'In Progress') dbUpdates.started_at = new Date().toISOString()
    if (status === 'Delivered') dbUpdates.delivered_at = new Date().toISOString()
    if (status === 'Dispatched') dbUpdates.dispatched_at = new Date().toISOString()
    if (status === 'Checking' || status === 'Ready') {
      if (extraFields.checkedBy) dbUpdates.checked_by = extraFields.checkedBy
    }
    if (extraFields.completedAt) dbUpdates.completed_at = extraFields.completedAt
    if (extraFields.notes !== undefined) dbUpdates.notes = extraFields.notes
    const { error } = await supabase.from('medication_cycles').update(dbUpdates).eq('id', id)
    if (error) console.error('[useCareHomeData] Update cycle failed:', error.message)
    return !error
  }, [])

  // ─── Cycle Patient Items ───
  const addCycleItems = useCallback(async (cycleId, patients) => {
    const rows = patients.map(p => ({
      id: generateId(),
      cycle_id: cycleId,
      patient_id: p.id,
      status: 'Pending',
      item_count: p.medicationCount || p.medication_count || 0,
    }))
    const { error } = await supabase.from('cycle_patient_items').insert(rows)
    if (error) console.error('[useCareHomeData] Add cycle items failed:', error.message)
    return !error
  }, [])

  const updateCycleItem = useCallback(async (id, updates) => {
    const dbUpdates = {}
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.problemNote !== undefined) dbUpdates.problem_note = updates.problemNote
    if (updates.checkedBy !== undefined) dbUpdates.checked_by = updates.checkedBy
    if (updates.dispensedBy !== undefined) dbUpdates.dispensed_by = updates.dispensedBy
    const { error } = await supabase.from('cycle_patient_items').update(dbUpdates).eq('id', id)
    if (error) console.error('[useCareHomeData] Update cycle item failed:', error.message)
    return !error
  }, [])

  // ─── Delivery CRUD ───
  const addDelivery = useCallback(async (data) => {
    const id = generateId()
    const { error } = await supabase.from('care_home_deliveries').insert({
      id,
      care_home_id: data.careHomeId,
      cycle_id: data.cycleId || null,
      delivery_date: data.deliveryDate,
      delivery_time: data.deliveryTime || null,
      delivered_by: data.deliveredBy || null,
      received_by: data.receivedBy || null,
      signature_confirmed: data.signatureConfirmed || false,
      items_count: data.itemsCount || 0,
      notes: data.notes || null,
      delivery_type: data.deliveryType || 'Scheduled',
      status: data.status || 'Scheduled',
    })
    if (error) { console.error('[useCareHomeData] Add delivery failed:', error.message); return null }
    return id
  }, [])

  const updateDelivery = useCallback(async (id, updates) => {
    const dbUpdates = {}
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.deliveredBy !== undefined) dbUpdates.delivered_by = updates.deliveredBy
    if (updates.receivedBy !== undefined) dbUpdates.received_by = updates.receivedBy
    if (updates.signatureConfirmed !== undefined) dbUpdates.signature_confirmed = updates.signatureConfirmed
    if (updates.deliveryTime !== undefined) dbUpdates.delivery_time = updates.deliveryTime
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes
    const { error } = await supabase.from('care_home_deliveries').update(dbUpdates).eq('id', id)
    if (error) console.error('[useCareHomeData] Update delivery failed:', error.message)
    return !error
  }, [])

  // ─── Handover Notes ───
  const addHandoverNote = useCallback(async (data) => {
    const id = generateId()
    const { error } = await supabase.from('care_home_handover_notes').insert({
      id,
      care_home_id: data.careHomeId,
      note_date: data.noteDate || new Date().toISOString().slice(0, 10),
      note_type: data.noteType || 'General',
      priority: data.priority || 'Normal',
      content: data.content,
      created_by: data.createdBy,
    })
    if (error) { console.error('[useCareHomeData] Add note failed:', error.message); return null }
    return id
  }, [])

  const acknowledgeNote = useCallback(async (id, acknowledgedBy) => {
    const { error } = await supabase.from('care_home_handover_notes').update({
      acknowledged_by: acknowledgedBy,
      acknowledged_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) console.error('[useCareHomeData] Acknowledge note failed:', error.message)
    return !error
  }, [])

  // ─── MAR Issues ───
  const addMARIssue = useCallback(async (data) => {
    const id = generateId()
    const { error } = await supabase.from('care_home_mar_issues').insert({
      id,
      care_home_id: data.careHomeId,
      patient_id: data.patientId || null,
      issue_date: data.issueDate || new Date().toISOString().slice(0, 10),
      issue_type: data.issueType || 'Other',
      description: data.description,
      severity: data.severity || 'Medium',
      status: 'Open',
      reported_by: data.reportedBy,
    })
    if (error) { console.error('[useCareHomeData] Add MAR issue failed:', error.message); return null }
    return id
  }, [])

  const resolveMARIssue = useCallback(async (id, resolvedBy, resolutionNote) => {
    const { error } = await supabase.from('care_home_mar_issues').update({
      status: 'Resolved',
      resolved_by: resolvedBy,
      resolved_at: new Date().toISOString(),
      resolution_note: resolutionNote,
    }).eq('id', id)
    if (error) console.error('[useCareHomeData] Resolve MAR issue failed:', error.message)
    return !error
  }, [])

  const updateMARIssueStatus = useCallback(async (id, status) => {
    const { error } = await supabase.from('care_home_mar_issues').update({ status }).eq('id', id)
    if (error) console.error('[useCareHomeData] Update MAR status failed:', error.message)
    return !error
  }, [])

  return {
    careHomes,
    patientsByHome,
    cyclesByHome,
    itemsByCycle,
    deliveriesByHome,
    notesByHome,
    marIssuesByHome,
    patients: rawPatients,
    cycles: rawCycles,
    deliveries: rawDeliveries,
    notes: rawNotes,
    marIssues: rawMARIssues,
    overallStats,
    loading,
    addCareHome, updateCareHome,
    addPatient, updatePatient,
    addCycle, updateCycleStatus,
    addCycleItems, updateCycleItem,
    addDelivery, updateDelivery,
    addHandoverNote, acknowledgeNote,
    addMARIssue, resolveMARIssue, updateMARIssueStatus,
  }
}
