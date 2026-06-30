import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useHospedagens(viagemId) {
  const [hospedagens, setHospedagens] = useState([])
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('hospedagens')
        .select('*')
        .eq('viagem_id', viagemId)
        .order('cidade')
      if (!error && data) setHospedagens(data)
    } catch {
      // tabela pode não existir ainda
    }
    setLoading(false)
  }, [viagemId])

  useEffect(() => {
    carregar()
  }, [carregar])

  const salvar = useCallback(async (campos) => {
    try {
      const { data, error } = await supabase
        .from('hospedagens')
        .upsert({ ...campos, viagem_id: viagemId }, { onConflict: 'cidade' })
        .select()
        .single()
      if (!error) await carregar()
      return { data, error }
    } catch (e) {
      return { data: null, error: e }
    }
  }, [carregar, viagemId])

  const remover = useCallback(async (id) => {
    try {
      const { error } = await supabase.from('hospedagens').delete().eq('id', id)
      if (!error) await carregar()
      return { error }
    } catch (e) {
      return { error: e }
    }
  }, [carregar])

  return { hospedagens, loading, salvar, remover, recarregar: carregar }
}
