import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const DEFAULT_CONFIG = {
  pharmacyName: 'My Pharmacy',
  address: '',
  superintendent: '',
  rpName: '',
  gphcNumber: '',
  phone: '',
  email: '',
}

export function usePharmacyConfig() {
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('pharmacy_config').select('*').limit(1)
      if (data && data.length > 0) {
        const row = data[0]
        setConfig({
          id: row.id,
          pharmacyName: row.pharmacy_name || DEFAULT_CONFIG.pharmacyName,
          address: row.address || '',
          superintendent: row.superintendent || '',
          rpName: row.rp_name || '',
          gphcNumber: row.gphc_number || '',
          phone: row.phone || '',
          email: row.email || '',
          notificationPrefs: row.notification_prefs || null,
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  const updateConfig = async (updates) => {
    const merged = { ...config, ...updates }
    setConfig(merged)
    const snake = {
      pharmacy_name: merged.pharmacyName,
      address: merged.address,
      superintendent: merged.superintendent,
      rp_name: merged.rpName,
      gphc_number: merged.gphcNumber,
      phone: merged.phone,
      email: merged.email,
      notification_prefs: merged.notificationPrefs || null,
      updated_at: new Date().toISOString(),
    }
    if (config.id) {
      await supabase.from('pharmacy_config').update(snake).eq('id', config.id)
    } else {
      const { data } = await supabase.from('pharmacy_config').insert(snake).select()
      if (data?.[0]) setConfig(prev => ({ ...prev, id: data[0].id }))
    }
  }

  return [config, updateConfig, loading]
}
