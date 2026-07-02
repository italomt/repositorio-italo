import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { emitirSync, useSyncListener } from '../lib/sync'

const PAIS_TO_ISO2 = {
  Portugal: 'PT', Espanha: 'ES', Itália: 'IT', França: 'FR',
  Holanda: 'NL', Brasil: 'BR', Alemanha: 'DE', 'Estados Unidos': 'US',
  Suíça: 'CH', Inglaterra: 'GB',
}

function bandeiraFallback(pais) {
  const iso2 = PAIS_TO_ISO2[pais]
  if (!iso2) return ''
  return String.fromCodePoint(...[...iso2].map((c) => 127397 + c.charCodeAt(0)))
}

export function useDestinos(viagemId) {
  const [destinos, setDestinos] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    if (!viagemId) { setDestinos([]); setLoading(false); return }
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
        flag_emoji: dia.cidades?.flag_emoji || bandeiraFallback(dia.cidades?.pais),
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

  useSyncListener('dias', carregar)
  useSyncListener('transportes', carregar)

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

  const reatribuirDia = useCallback(
    async (diaId, cidadeId) => {
      const { error } = await supabase.from('dias').update({ cidade_id: cidadeId }).eq('id', diaId)
      if (!error) { await carregar(); emitirSync('dias') }
      return { error }
    },
    [carregar],
  )

  const limparDia = useCallback(
    async (diaId) => {
      await supabase.from('pendencias').delete().eq('dia_id', diaId)
      await supabase.from('atracoes').delete().eq('destino_id', diaId)
      await supabase.from('gastos').delete().eq('destino_id', diaId)
      await supabase.from('transportes').delete().or(`destino_origem_id.eq.${diaId},destino_destino_id.eq.${diaId}`)
      emitirSync('atracoes')
      emitirSync('gastos')
      emitirSync('pendencias')
      emitirSync('transportes')
      return { error: null }
    },
    [],
  )

  const removerDia = useCallback(
    async (diaId) => {
      await limparDia(diaId)
      const { error } = await supabase.from('dias').delete().eq('id', diaId)
      if (!error) { await carregar(); emitirSync('dias') }
      return { error }
    },
    [carregar, limparDia],
  )

  const adicionarDia = useCallback(
    async (data, cidadeId) => {
      const { data: diaData, error } = await supabase
        .from('dias')
        .insert({
          viagem_id: viagemId,
          cidade_id: cidadeId,
          data,
          status: 'planejando',
        })
        .select()
        .single()
      if (!error) { await carregar(); emitirSync('dias') }
      return { data: diaData, error }
    },
    [carregar, viagemId],
  )

  const upsertCidade = useCallback(
    async ({ nome, pais, flag_emoji, latitude, longitude }) => {
      const payload = { nome, pais: pais || '', flag_emoji: flag_emoji || null }
      if (latitude != null && longitude != null) {
        payload.latitude = latitude
        payload.longitude = longitude
      }
      const { data, error } = await supabase
        .from('cidades')
        .upsert(payload, { onConflict: 'nome,pais' })
        .select()
        .single()
      return { data, error }
    },
    [],
  )

  const contarChildrenDia = useCallback(
    async (diaId) => {
      const [atrRes, gastRes] = await Promise.all([
        supabase.from('atracoes').select('id', { count: 'exact', head: true }).eq('destino_id', diaId),
        supabase.from('gastos').select('id', { count: 'exact', head: true }).eq('destino_id', diaId),
      ])
      return { atracoes: atrRes.count || 0, gastos: gastRes.count || 0 }
    },
    [],
  )

  return { destinos, loading, erro, recarregar: carregar, atualizarDestino, adicionarDestino, removerDestino, removerTransporte, reatribuirDia, limparDia, removerDia, adicionarDia, upsertCidade, contarChildrenDia }
}
