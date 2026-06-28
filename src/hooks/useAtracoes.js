import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useAtracoes(destinoId) {
  const [atracoes, setAtracoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('atracoes').select('*').order('ordem_no_dia', { ascending: true })
    if (destinoId) query = query.eq('destino_id', destinoId)

    const { data, error } = await query
    if (error) setErro(error)
    else setAtracoes(data)
    setLoading(false)
  }, [destinoId])

  useEffect(() => {
    carregar()
  }, [carregar])

  const adicionarAtracao = useCallback(
    async (atracao) => {
      const { data, error } = await supabase.from('atracoes').insert(atracao).select().single()
      if (!error) await carregar()
      return { data, error }
    },
    [carregar],
  )

  const atualizarAtracao = useCallback(
    async (id, campos) => {
      const { error } = await supabase.from('atracoes').update(campos).eq('id', id)
      if (!error) await carregar()
      return { error }
    },
    [carregar],
  )

  const removerAtracao = useCallback(
    async (id) => {
      const { error } = await supabase.from('atracoes').delete().eq('id', id)
      if (!error) await carregar()
      return { error }
    },
    [carregar],
  )

  return { atracoes, loading, erro, recarregar: carregar, adicionarAtracao, atualizarAtracao, removerAtracao }
}
