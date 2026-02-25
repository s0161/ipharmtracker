import { supabase } from '../lib/supabase'

const TABLES = [
  'documents',
  'training_logs',
  'cleaning_entries',
  'cleaning_tasks',
  'staff_members',
  'training_topics',
  'safeguarding_records',
  'staff_training',
  'rp_log',
]

export async function exportData() {
  const data = {}

  for (const table of TABLES) {
    const { data: rows } = await supabase.from(table).select('*')
    data[table] = rows || []
  }

  const blob = new Blob(
    [JSON.stringify({ _exportedAt: new Date().toISOString(), ...data })],
    { type: 'application/json' }
  )
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ipharmacy-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const parsed = JSON.parse(e.target.result)
        if (typeof parsed !== 'object' || parsed === null) {
          return reject(new Error('Invalid backup file format.'))
        }

        const keys = Object.keys(parsed).filter((k) => TABLES.includes(k))
        if (keys.length === 0) {
          return reject(new Error('No valid data found in backup file.'))
        }

        for (const table of keys) {
          const rows = parsed[table]
          if (!Array.isArray(rows) || rows.length === 0) continue
          // Clear existing data
          await supabase.from(table).delete().not('id', 'is', null)
          // Insert backup data
          await supabase.from(table).insert(rows)
        }

        resolve(keys.length)
      } catch {
        reject(new Error('Could not parse backup file. Ensure it is valid JSON.'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file.'))
    reader.readAsText(file)
  })
}

export async function clearAllData() {
  let count = 0
  for (const table of TABLES) {
    await supabase.from(table).delete().not('id', 'is', null)
    count++
  }
  return count
}
