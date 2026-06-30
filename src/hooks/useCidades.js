import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useCidades() {
  const [cidades, setCidades] = useState([])
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('cidades')
      .select('*')
      .order('nome')
    if (data) setCidades(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const buscarPorNome = useCallback(
    (nome) => cidades.find((c) => c.nome === nome) ?? null,
    [cidades],
  )

  return { cidades, loading, recarregar: carregar, buscarPorNome }
}
