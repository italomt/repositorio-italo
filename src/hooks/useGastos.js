import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { emitirSync, useSyncListener } from '../lib/sync'

export function useGastos(viagemId) {
  const [gastos, setGastos] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(null)

  // Gastos são privados: cada usuário só vê e mexe nos próprios (created_by),
  // mesmo sendo uma viagem compartilhada. Reforçado também via RLS no banco.
  const carregar = useCallback(async () => {
    if (!viagemId) { setGastos([]); setLoading(false); return }
    setLoading(true)

    const { data: auth } = await supabase.auth.getUser()
    const usuarioId = auth?.user?.id
    if (!usuarioId) { setGastos([]); setLoading(false); return }

    const { data, error } = await supabase
      .from('gastos')
      .select('*')
      .eq('viagem_id', viagemId)
      .eq('created_by', usuarioId)
      .order('data_gasto', { ascending: false })

    if (error) setErro(error)
    else setGastos(data)
    setLoading(false)
  }, [viagemId])

  useEffect(() => {
    carregar()
  }, [carregar])

  useSyncListener('gastos', carregar)

  const adicionarGasto = useCallback(
    async (gasto) => {
      const { data: auth } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('gastos')
        .insert({ ...gasto, viagem_id: viagemId, created_by: auth?.user?.id })
        .select()
        .single()
      if (!error) { await carregar(); emitirSync('gastos') }
      return { data, error }
    },
    [carregar, viagemId],
  )

  const atualizarGasto = useCallback(
    async (id, campos) => {
      const { error } = await supabase.from('gastos').update(campos).eq('id', id)
      if (!error) { await carregar(); emitirSync('gastos') }
      return { error }
    },
    [carregar],
  )

  const removerGasto = useCallback(
    async (id) => {
      const { error } = await supabase.from('gastos').delete().eq('id', id)
      if (!error) { await carregar(); emitirSync('gastos') }
      return { error }
    },
    [carregar],
  )

  return { gastos, loading, erro, recarregar: carregar, adicionarGasto, atualizarGasto, removerGasto }
}
