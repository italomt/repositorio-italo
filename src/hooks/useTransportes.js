import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useSyncListener } from '../lib/sync'

// Lista os transportes da viagem já com o nome das cidades de origem/destino.
// useDestinos só devolve os transportes pendurados em cada dia (por
// destino_origem_id), e os registros antigos têm essa coluna nula — por isso
// aqui a busca é pela viagem inteira.
export function useTransportes(viagemId) {
  const [transportes, setTransportes] = useState([])
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(async () => {
    if (!viagemId) {
      setTransportes([])
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('transportes')
      .select('*, origem:cidades!cidade_origem_id(nome), destino:cidades!cidade_destino_id(nome)')
      .eq('viagem_id', viagemId)
      .order('horario_saida', { ascending: true, nullsFirst: false })

    setTransportes(
      (data || []).map((t) => ({
        ...t,
        cidade_origem: t.origem?.nome || null,
        cidade_destino: t.destino?.nome || null,
      })),
    )
    setLoading(false)
  }, [viagemId])

  useEffect(() => { carregar() }, [carregar])
  useSyncListener('transportes', carregar)

  return { transportes, loading, recarregar: carregar }
}
