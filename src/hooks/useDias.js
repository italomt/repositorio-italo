import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useDias(viagemId) {
  const [dias, setDias] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('dias')
      .select('*, cidades(nome, pais, flag_emoji), transportes(*)')
      .eq('viagem_id', viagemId)
      .order('data', { ascending: true })

    if (error) {
      setErro(error)
    } else {
      const mapeados = data.map((dia) => ({
        ...dia,
        cidade: dia.cidades?.nome,
        pais: dia.cidades?.pais,
        flag_emoji: dia.cidades?.flag_emoji,
      }))
      setDias(mapeados)
    }
    setLoading(false)
  }, [viagemId])

  useEffect(() => {
    carregar()
  }, [carregar])

  const adicionarDia = useCallback(
    async (dia) => {
      const { data, error } = await supabase.from('dias').insert({ ...dia, viagem_id: viagemId }).select().single()
      if (!error) await carregar()
      return { data, error }
    },
    [carregar, viagemId],
  )

  const atualizarDia = useCallback(
    async (id, campos) => {
      const { error } = await supabase.from('dias').update(campos).eq('id', id)
      if (!error) await carregar()
      return { error }
    },
    [carregar],
  )

  const removerDia = useCallback(
    async (id) => {
      const { error } = await supabase.from('dias').delete().eq('id', id)
      if (!error) await carregar()
      return { error }
    },
    [carregar],
  )

  const removerTransporte = useCallback(
    async (id) => {
      const { error } = await supabase.from('transportes').delete().eq('id', id)
      if (!error) await carregar()
      return { error }
    },
    [carregar],
  )

  return { dias, loading, erro, recarregar: carregar, adicionarDia, atualizarDia, removerDia, removerTransporte }
}
