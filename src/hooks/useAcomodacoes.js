import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useAcomodacoes() {
  const [acomodacoes, setAcomodacoes] = useState([])
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('acomodacoes').select('*').order('cidade')
    if (data) setAcomodacoes(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const salvar = useCallback(async (campos) => {
    const { data, error } = await supabase.from('acomodacoes').upsert(campos, { onConflict: 'cidade' }).select().single()
    if (!error) await carregar()
    return { data, error }
  }, [carregar])

  const remover = useCallback(async (id) => {
    const { error } = await supabase.from('acomodacoes').delete().eq('id', id)
    if (!error) await carregar()
    return { error }
  }, [carregar])

  return { acomodacoes, loading, salvar, remover, recarregar: carregar }
}
