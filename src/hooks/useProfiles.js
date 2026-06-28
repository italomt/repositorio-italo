import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useProfiles() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('profiles').select('*').order('nome')
    if (!error) setProfiles(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  return { profiles, loading, recarregar: carregar }
}
