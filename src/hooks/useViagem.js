import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useViagem() {
  const [viagem, setViagem] = useState(null)
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('viagens')
      .select('*')
      .limit(1)
      .maybeSingle()
    setViagem(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const viagemId = viagem?.id ?? null

  return { viagem, viagemId, loading, recarregar: carregar }
}
