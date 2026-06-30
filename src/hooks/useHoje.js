import { useMemo } from 'react'
import { useDias } from './useDias'

function formatarDataISO(date) {
  return date.toISOString().slice(0, 10)
}

export function useHoje(viagemId) {
  const { dias, loading, erro, recarregar } = useDias(viagemId)

  const hojeISO = formatarDataISO(new Date())

  const { destinoHoje, indexHoje, proximoDestino, viagemComecou, viagemTerminou } = useMemo(() => {
    if (dias.length === 0) {
      return { destinoHoje: null, indexHoje: -1, proximoDestino: null, viagemComecou: false, viagemTerminou: false }
    }

    const idx = dias.findIndex((d) => d.data === hojeISO)
    const primeiraData = dias[0].data
    const ultimaData = dias[dias.length - 1].data

    return {
      destinoHoje: idx >= 0 ? dias[idx] : null,
      indexHoje: idx,
      proximoDestino: idx >= 0 && idx + 1 < dias.length ? dias[idx + 1] : null,
      viagemComecou: hojeISO >= primeiraData,
      viagemTerminou: hojeISO > ultimaData,
    }
  }, [dias, hojeISO])

  const diasParaViagem = useMemo(() => {
    if (dias.length === 0) return null
    const primeira = new Date(dias[0].data + 'T00:00:00')
    const hoje = new Date(hojeISO + 'T00:00:00')
    return Math.ceil((primeira - hoje) / (1000 * 60 * 60 * 24))
  }, [dias, hojeISO])

  return {
    loading,
    erro,
    recarregar,
    destinoHoje,
    indexHoje,
    proximoDestino,
    viagemComecou,
    viagemTerminou,
    diasParaViagem,
    totalDias: dias.length,
  }
}
