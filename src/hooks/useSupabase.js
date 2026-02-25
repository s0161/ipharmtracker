import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'

function toSnakeKey(str) {
  return str.replace(/[A-Z]/g, (ch) => '_' + ch.toLowerCase())
}

function toCamelKey(str) {
  return str.replace(/_([a-z])/g, (_, ch) => ch.toUpperCase())
}

function convertKeys(obj, converter) {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    out[converter(k)] = v
  }
  return out
}

const toSnake = (obj) => convertKeys(obj, toSnakeKey)
const toCamel = (obj) => convertKeys(obj, toCamelKey)

/**
 * Drop-in replacement for useLocalStorage that syncs with Supabase.
 *
 * @param {string} table - Supabase table name
 * @param {any} initialValue - default value when table is empty
 * @param {object} options
 * @param {string} options.valueField - if set, return/accept array of scalars (e.g. 'name')
 */
export function useSupabase(table, initialValue = [], options = {}) {
  const { valueField } = options
  const [data, setLocalData] = useState(initialValue)
  const [loading, setLoading] = useState(true)

  // What we know is in the DB (full objects, camelCase)
  const dbRef = useRef([])
  // For valueField tables: name → id mapping
  const idMapRef = useRef({})

  // Fetch on mount
  useEffect(() => {
    let cancelled = false

    supabase
      .from(table)
      .select('*')
      .then(({ data: rows, error }) => {
        if (cancelled || error) {
          setLoading(false)
          return
        }

        const camelRows = (rows || []).map(toCamel)

        if (camelRows.length > 0) {
          dbRef.current = camelRows
          if (valueField) {
            idMapRef.current = Object.fromEntries(
              camelRows.map((r) => [r[valueField], r.id])
            )
            setLocalData(camelRows.map((r) => r[valueField]))
          } else {
            setLocalData(camelRows)
          }
        } else {
          // Table empty — use initialValue but don't persist yet
          dbRef.current = []
          setLocalData(initialValue)
        }
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [table])

  const setData = useCallback(
    (newValue) => {
      setLocalData(newValue)

      if (valueField) {
        syncValueField(table, valueField, newValue, dbRef, idMapRef)
      } else {
        syncObjects(table, newValue, dbRef)
      }
    },
    [table, valueField]
  )

  return [data, setData, loading]
}

// Sync for tables where the component uses scalar arrays (e.g. ['John', 'Jane'])
async function syncValueField(table, field, newNames, dbRef, idMapRef) {
  const prevNames = new Set(dbRef.current.map((r) => r[field]))
  const nextNames = new Set(newNames)

  const added = newNames.filter((n) => !prevNames.has(n))
  const removed = dbRef.current.filter((r) => !nextNames.has(r[field]))

  if (added.length > 0) {
    const { data: inserted } = await supabase
      .from(table)
      .insert(added.map((n) => ({ [field]: n })))
      .select()

    if (inserted) {
      inserted.forEach((r) => {
        const camel = toCamel(r)
        idMapRef.current[camel[field]] = camel.id
        dbRef.current.push(camel)
      })
    }
  }

  if (removed.length > 0) {
    const ids = removed.map((r) => r.id)
    await supabase.from(table).delete().in('id', ids)
    const removedIds = new Set(ids)
    dbRef.current = dbRef.current.filter((r) => !removedIds.has(r.id))
    removed.forEach((r) => delete idMapRef.current[r[field]])
  }
}

// Sync for tables where the component uses object arrays
async function syncObjects(table, newData, dbRef) {
  const prev = dbRef.current
  const prevMap = new Map(prev.map((r) => [r.id, r]))
  const nextMap = new Map()

  const toInsert = []
  const toUpsert = []

  for (const item of newData) {
    if (!item.id) {
      // New item without id — generate one
      item.id = crypto.randomUUID()
    }
    nextMap.set(item.id, item)

    if (!prevMap.has(item.id)) {
      toInsert.push(item)
    } else {
      // Check if changed
      const old = prevMap.get(item.id)
      if (JSON.stringify(old) !== JSON.stringify(item)) {
        toUpsert.push(item)
      }
    }
  }

  // Deleted items
  const toDelete = prev.filter((r) => !nextMap.has(r.id))

  if (toInsert.length > 0) {
    await supabase.from(table).insert(toInsert.map(toSnake))
  }

  if (toUpsert.length > 0) {
    await supabase.from(table).upsert(toUpsert.map(toSnake))
  }

  if (toDelete.length > 0) {
    await supabase
      .from(table)
      .delete()
      .in('id', toDelete.map((r) => r.id))
  }

  dbRef.current = [...newData]
}
