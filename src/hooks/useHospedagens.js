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
        .select('*, cidades(nome, pais, flag_emoji)')
        .eq('viagem_id', viagemId)
        .order('cidade_id')
      if (!error && data) {
        const mapeadas = data.map((h) => ({
          ...h,
          cidade: h.cidades?.nome,
          pais: h.cidades?.pais,
          flag_emoji: h.cidades?.flag_emoji,
        }))
        setHospedagens(mapeadas)
      }
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
      const payload = { ...campos, viagem_id: viagemId }

      if (payload.cidade && !payload.cidade_id) {
        const { data: cid } = await supabase
          .from('cidades')
          .select('id')
          .eq('nome', payload.cidade)
          .maybeSingle()
        if (cid) {
          payload.cidade_id = cid.id
          delete payload.cidade
          delete payload.pais
          delete payload.flag_emoji
        }
      }

      const { data, error } = await supabase
        .from('hospedagens')
        .upsert(payload)
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
