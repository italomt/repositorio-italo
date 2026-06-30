import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useDestinos(viagemId) {
  const [destinos, setDestinos] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    setLoading(true)

    const [diasRes, transpRes] = await Promise.all([
      supabase
        .from('dias')
        .select('*, cidades(nome, pais, flag_emoji, latitude, longitude)')
        .eq('viagem_id', viagemId)
        .order('data', { ascending: true }),
      supabase
        .from('transportes')
        .select('*')
        .eq('viagem_id', viagemId),
    ])

    if (diasRes.error) {
      setErro(diasRes.error)
    } else if (diasRes.data) {
      const transportes = transpRes.data || []
      const mapeados = diasRes.data.map((dia) => ({
        ...dia,
        cidade: dia.cidades?.nome,
        pais: dia.cidades?.pais,
        flag_emoji: dia.cidades?.flag_emoji,
        latitude: dia.cidades?.latitude,
        longitude: dia.cidades?.longitude,
        transportes: transportes.filter((t) => t.destino_origem_id === dia.id),
      }))
      setDestinos(mapeados)
    }
    setLoading(false)
  }, [viagemId])

  useEffect(() => {
    carregar()
  }, [carregar])

  const atualizarDestino = useCallback(
    async (id, campos) => {
      const { error } = await supabase.from('dias').update(campos).eq('id', id)
      if (!error) await carregar()
      return { error }
    },
    [carregar],
  )

  const adicionarDestino = useCallback(
    async (destino) => {
      const { data: cidadeData } = await supabase
        .from('cidades')
        .select('id')
        .eq('nome', destino.cidade)
        .eq('pais', destino.pais)
        .maybeSingle()

      const { data, error } = await supabase
        .from('dias')
        .insert({
          viagem_id: viagemId,
          cidade_id: cidadeData?.id ?? null,
          data: destino.data,
          notas: destino.notas,
          status: 'planejando',
        })
        .select()
        .single()

      if (!error) await carregar()
      return { data, error }
    },
    [carregar, viagemId],
  )

  const removerDestino = useCallback(
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

  return { destinos, loading, erro, recarregar: carregar, atualizarDestino, adicionarDestino, removerDestino, removerTransporte }
}
