import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { emitirSync, useSyncListener } from '../lib/sync'

export function useAtracoes(viagemId, destinoId) {
  const [atracoes, setAtracoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    if (!viagemId) {
      setAtracoes([])
      setLoading(false)
      return
    }
    setLoading(true)
    let query = supabase.from('atracoes').select('*, profiles!created_by(nome)').order('ordem_no_dia', { ascending: true })
    query = query.eq('viagem_id', viagemId)
    if (destinoId) query = query.eq('destino_id', destinoId)

    const { data, error } = await query
    if (error) setErro(error)
    else setAtracoes(data)
    setLoading(false)
  }, [viagemId, destinoId])

  useEffect(() => {
    carregar()
  }, [carregar])

  useSyncListener('atracoes', carregar)

  const adicionarAtracao = useCallback(
    async (atracao) => {
      const { data, error } = await supabase.from('atracoes').insert({ ...atracao, viagem_id: viagemId }).select().single()
      if (!error) { await carregar(); emitirSync('atracoes') }
      return { data, error }
    },
    [carregar, viagemId],
  )

  const atualizarAtracao = useCallback(
    async (id, campos) => {
      const { error } = await supabase.from('atracoes').update(campos).eq('id', id)
      if (!error) { await carregar(); emitirSync('atracoes') }
      return { error }
    },
    [carregar],
  )

  const removerAtracao = useCallback(
    async (id) => {
      const { error } = await supabase.from('atracoes').delete().eq('id', id)
      if (!error) { await carregar(); emitirSync('atracoes') }
      return { error }
    },
    [carregar],
  )

  return { atracoes, loading, erro, recarregar: carregar, adicionarAtracao, atualizarAtracao, removerAtracao }
}
