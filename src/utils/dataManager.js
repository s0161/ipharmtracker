const KEY_PREFIX = 'ipd_'

function getAllKeys() {
  return Object.keys(localStorage).filter((k) => k.startsWith(KEY_PREFIX))
}

export function exportData() {
  const data = {}
  getAllKeys().forEach((key) => {
    try {
      data[key] = JSON.parse(localStorage.getItem(key))
    } catch {
      data[key] = localStorage.getItem(key)
    }
  })

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

export function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result)
        if (typeof parsed !== 'object' || parsed === null) {
          return reject(new Error('Invalid backup file format.'))
        }

        const keys = Object.keys(parsed).filter((k) => k.startsWith(KEY_PREFIX))
        if (keys.length === 0) {
          return reject(new Error('No valid data found in backup file.'))
        }

        keys.forEach((key) => {
          localStorage.setItem(key, JSON.stringify(parsed[key]))
        })
        resolve(keys.length)
      } catch {
        reject(new Error('Could not parse backup file. Ensure it is valid JSON.'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file.'))
    reader.readAsText(file)
  })
}

export function clearAllData() {
  const keys = getAllKeys()
  keys.forEach((key) => localStorage.removeItem(key))
  return keys.length
}
