import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useDestinos() {
  const [destinos, setDestinos] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('destinos')
      .select('*, transportes:transportes!transportes_destino_origem_id_fkey(*)')
      .order('data', { ascending: true })

    if (error) setErro(error)
    else setDestinos(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const atualizarDestino = useCallback(
    async (id, campos) => {
      const { error } = await supabase.from('destinos').update(campos).eq('id', id)
      if (!error) await carregar()
      return { error }
    },
    [carregar],
  )

  const adicionarDestino = useCallback(
    async (destino) => {
      const { data, error } = await supabase.from('destinos').insert(destino).select().single()
      if (!error) await carregar()
      return { data, error }
    },
    [carregar],
  )

  const removerDestino = useCallback(
    async (id) => {
      const { error } = await supabase.from('destinos').delete().eq('id', id)
      if (!error) await carregar()
      return { error }
    },
    [carregar],
  )

  return { destinos, loading, erro, recarregar: carregar, atualizarDestino, adicionarDestino, removerDestino }
}
