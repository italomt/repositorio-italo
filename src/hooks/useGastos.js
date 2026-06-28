import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useGastos(usuarioId) {
  const [gastos, setGastos] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('gastos').select('*').order('data_gasto', { ascending: false })
    if (usuarioId) query = query.eq('created_by', usuarioId)

    const { data, error } = await query
    if (error) setErro(error)
    else setGastos(data)
    setLoading(false)
  }, [usuarioId])

  useEffect(() => {
    carregar()
  }, [carregar])

  const adicionarGasto = useCallback(
    async (gasto) => {
      const { data, error } = await supabase.from('gastos').insert({ ...gasto, created_by: usuarioId }).select().single()
      if (!error) await carregar()
      return { data, error }
    },
    [carregar, usuarioId],
  )

  const atualizarGasto = useCallback(
    async (id, campos) => {
      const { error } = await supabase.from('gastos').update(campos).eq('id', id)
      if (!error) await carregar()
      return { error }
    },
    [carregar],
  )

  const removerGasto = useCallback(
    async (id) => {
      const { error } = await supabase.from('gastos').delete().eq('id', id)
      if (!error) await carregar()
      return { error }
    },
    [carregar],
  )

  return { gastos, loading, erro, recarregar: carregar, adicionarGasto, atualizarGasto, removerGasto }
}