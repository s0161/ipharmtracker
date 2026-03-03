import { useMemo, useCallback } from 'react'

const THRESHOLDS = [7, 14, 30]
const STORAGE_PREFIX = 'ipd_reminder_'

function getDaysUntilExpiry(expiryDate) {
  if (!expiryDate) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate + 'T00:00:00')
  return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))
}

function getActiveThreshold(daysLeft) {
  if (daysLeft === null) return null
  if (daysLeft <= 0) return 'overdue'
  if (daysLeft <= 7) return 7
  if (daysLeft <= 14) return 14
  if (daysLeft <= 30) return 30
  return null
}

function isDismissed(docId, threshold) {
  if (threshold === 'overdue' || threshold === 7) return false
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${docId}_${threshold}`) === 'true'
  } catch { return false }
}

export function useDocumentReminders(documents) {
  const prefsEnabled = useMemo(() => {
    try {
      const prefs = JSON.parse(localStorage.getItem('ipd_notification_prefs') || '{}')
      return prefs.documentExpiry !== false
    } catch { return true }
  }, [])

  const reminders = useMemo(() => {
    if (!prefsEnabled || !documents?.length) return []

    return documents
      .map(doc => {
        const daysLeft = getDaysUntilExpiry(doc.expiryDate)
        const threshold = getActiveThreshold(daysLeft)
        if (!threshold) return null
        if (isDismissed(doc.id, threshold)) return null

        const isOverdue = threshold === 'overdue'
        const isCritical = isOverdue || threshold === 7
        const dismissible = threshold === 14 || threshold === 30

        return {
          id: `doc-reminder-${doc.id}`,
          docId: doc.id,
          docName: doc.documentName,
          daysLeft,
          threshold,
          dismissible,
          type: isCritical ? 'critical' : 'warning',
          title: isOverdue
            ? `${doc.documentName} EXPIRED`
            : `${doc.documentName} expires ${daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`}`,
          desc: isOverdue
            ? `Expired ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''} ago — renew immediately`
            : threshold === 7
              ? 'Expires this week — action required'
              : threshold === 14
                ? 'Expires within 2 weeks'
                : 'Expires within 30 days',
          time: isOverdue ? 'Now' : `${daysLeft}d`,
        }
      })
      .filter(Boolean)
      .sort((a, b) => (a.daysLeft ?? -9999) - (b.daysLeft ?? -9999))
  }, [documents, prefsEnabled])

  const dismiss = useCallback((docId, threshold) => {
    if (threshold === 'overdue' || threshold === 7) return
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${docId}_${threshold}`, 'true')
    } catch { /* ignore */ }
    window.dispatchEvent(new Event('storage'))
  }, [])

  const unreadCount = reminders.length

  return { reminders, dismiss, unreadCount }
}
