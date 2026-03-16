import { useMemo } from 'react'
import { useSupabase } from './useSupabase'

export function useHandover() {
  const [handovers, setHandovers, loading] = useSupabase('shift_handovers', [])

  const today = new Date().toISOString().slice(0, 10)

  const todayHandover = useMemo(
    () => handovers.find(h => h.shiftDate === today) || null,
    [handovers, today]
  )

  const recentHandovers = useMemo(
    () => handovers
      .filter(h => h.shiftDate !== today)
      .sort((a, b) => b.shiftDate.localeCompare(a.shiftDate))
      .slice(0, 7),
    [handovers, today]
  )

  const createHandover = (staffId, staffName, prePopulate = {}) => {
    const newHandover = {
      id: crypto.randomUUID(),
      pharmacyId: 'FED07',
      shiftDate: today,
      shiftType: 'day',
      createdBy: staffId,
      createdByName: staffName,
      outstandingOwings: '',
      patientCallbacks: '',
      deliveriesNote: '',
      cdNotes: '',
      equipmentIssues: '',
      otherNotes: '',
      cdBalanceChecked: false,
      tempLogged: false,
      rpSignedIn: false,
      deliveriesComplete: false,
      signedOff: false,
      ...prePopulate,
    }
    setHandovers([...handovers, newHandover])
    return newHandover
  }

  const updateHandover = (id, updates) => {
    setHandovers(handovers.map(h =>
      h.id === id ? { ...h, ...updates, updatedAt: new Date().toISOString() } : h
    ))
  }

  return { handovers, todayHandover, recentHandovers, loading, createHandover, updateHandover }
}
