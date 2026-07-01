import { useMemo } from 'react'
import { useDestinos } from './useDestinos'

function formatarDataISO(date) {
  // Data no fuso local — toISOString() é UTC e virava o dia às 21h no Brasil
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function useHoje(viagemId) {
  const { destinos, loading, erro, recarregar } = useDestinos(viagemId)

  const hojeISO = formatarDataISO(new Date())

  const { destinoHoje, indexHoje, proximoDestino, viagemComecou, viagemTerminou } = useMemo(() => {
    if (destinos.length === 0) {
      return { destinoHoje: null, indexHoje: -1, proximoDestino: null, viagemComecou: false, viagemTerminou: false }
    }

    const idx = destinos.findIndex((d) => d.data === hojeISO)
    const primeiraData = destinos[0].data
    const ultimaData = destinos[destinos.length - 1].data

    return {
      destinoHoje: idx >= 0 ? destinos[idx] : null,
      indexHoje: idx,
      proximoDestino: idx >= 0 && idx + 1 < destinos.length ? destinos[idx + 1] : null,
      viagemComecou: hojeISO >= primeiraData,
      viagemTerminou: hojeISO > ultimaData,
    }
  }, [destinos, hojeISO])

  const diasParaViagem = useMemo(() => {
    if (destinos.length === 0) return null
    const primeira = new Date(destinos[0].data + 'T00:00:00')
    const hoje = new Date(hojeISO + 'T00:00:00')
    return Math.ceil((primeira - hoje) / (1000 * 60 * 60 * 24))
  }, [destinos, hojeISO])

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
    totalDias: destinos.length,
  }
}
