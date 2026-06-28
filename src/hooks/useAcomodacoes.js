import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useAcomodacoes() {
  const [acomodacoes, setAcomodacoes] = useState([])
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('acomodacoes').select('*').order('cidade')
      if (!error && data) setAcomodacoes(data)
    } catch {
      // tabela pode não existir ainda
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const salvar = useCallback(async (campos) => {
    try {
      const { data, error } = await supabase.from('acomodacoes').upsert(campos, { onConflict: 'cidade' }).select().single()
      if (!error) await carregar()
      return { data, error }
    } catch (e) {
      return { data: null, error: e }
    }
  }, [carregar])

  const remover = useCallback(async (id) => {
    try {
      const { error } = await supabase.from('acomodacoes').delete().eq('id', id)
      if (!error) await carregar()
      return { error }
    } catch (e) {
      return { error: e }
    }
  }, [carregar])

  return { acomodacoes, loading, salvar, remover, recarregar: carregar }
}
