import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useGastos(viagemId) {
  const [gastos, setGastos] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('gastos')
      .select('*')
      .eq('viagem_id', viagemId)
      .order('data_gasto', { ascending: false })

    if (error) setErro(error)
    else setGastos(data)
    setLoading(false)
  }, [viagemId])

  useEffect(() => {
    carregar()
  }, [carregar])

  const adicionarGasto = useCallback(
    async (gasto) => {
      const { data, error } = await supabase.from('gastos').insert({ ...gasto, viagem_id: viagemId }).select().single()
      if (!error) await carregar()
      return { data, error }
    },
    [carregar, viagemId],
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
