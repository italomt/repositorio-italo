import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const ORDEM_URGENCIA = { alta: 0, media: 1, normal: 2, baixa: 3 }

export function usePendencias(viagemId) {
  const [pendencias, setPendencias] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    if (!viagemId) { setPendencias([]); setLoading(false); return }
    setLoading(true)
    const { data, error } = await supabase
      .from('pendencias')
      .select('*')
      .eq('viagem_id', viagemId)
      .order('prazo_sugerido', { ascending: true, nullsFirst: false })

    if (error) {
      setErro(error)
    } else {
      const ordenado = [...data].sort((a, b) => {
        const aAtiva = a.estado !== 'concluida' && a.estado !== 'cancelada'
        const bAtiva = b.estado !== 'concluida' && b.estado !== 'cancelada'
        if (aAtiva !== bAtiva) return aAtiva ? -1 : 1
        return (ORDEM_URGENCIA[a.urgencia] ?? 2) - (ORDEM_URGENCIA[b.urgencia] ?? 2)
      })
      setPendencias(ordenado)
    }
    setLoading(false)
  }, [viagemId])

  useEffect(() => {
    carregar()
  }, [carregar])

  const criarPendencia = useCallback(
    async (pendencia) => {
      const { data, error } = await supabase.from('pendencias').insert({ ...pendencia, viagem_id: viagemId }).select().single()
      if (!error) await carregar()
      return { data, error }
    },
    [carregar, viagemId],
  )

  const alterarEstado = useCallback(
    async (id, concluir) => {
      const estado = concluir ? 'concluida' : 'aberta'
      const { error } = await supabase.from('pendencias').update({ estado }).eq('id', id)
      if (!error) await carregar()
      return { error }
    },
    [carregar],
  )

  const atualizarPendencia = useCallback(
    async (id, campos) => {
      const { error } = await supabase.from('pendencias').update(campos).eq('id', id)
      if (!error) await carregar()
      return { error }
    },
    [carregar],
  )

  const removerPendencia = useCallback(
    async (id) => {
      const { error } = await supabase.from('pendencias').delete().eq('id', id)
      if (!error) await carregar()
      return { error }
    },
    [carregar],
  )

  const totalPendentes = pendencias.filter((p) => p.estado !== 'concluida' && p.estado !== 'cancelada').length

  return {
    pendencias,
    loading,
    erro,
    totalPendentes,
    recarregar: carregar,
    criarPendencia,
    alterarEstado,
    atualizarPendencia,
    removerPendencia,
  }
}
