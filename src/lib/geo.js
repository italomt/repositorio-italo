// Distância em km entre duas coordenadas (fórmula de Haversine)
export function distanciaKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Para cada dia candidato, calcula quão perto a nova atração fica das que já estão
// planejadas nesse dia, e se o dia já está "cheio" (tem atração de dia inteiro).
// Retorna a lista ordenada da melhor pra pior sugestão.
export function ranquearDias(diasCandidatos, atracoesExistentes, novaLat, novaLng) {
  const comInfo = diasCandidatos.map((destino) => {
    const atracoesDoDia = atracoesExistentes.filter((a) => a.destino_id === destino.id)
    const diaCheio = atracoesDoDia.some((a) => a.ocupa_dia_inteiro)

    let distanciaMedia = null
    if (novaLat != null && novaLng != null) {
      const comCoordenadas = atracoesDoDia.filter((a) => a.latitude && a.longitude)
      if (comCoordenadas.length > 0) {
        const total = comCoordenadas.reduce((soma, a) => soma + distanciaKm(novaLat, novaLng, a.latitude, a.longitude), 0)
        distanciaMedia = total / comCoordenadas.length
      }
    }

    return { destino, atracoesDoDia, diaCheio, distanciaMedia }
  })

  return comInfo.sort((a, b) => {
    if (a.diaCheio !== b.diaCheio) return a.diaCheio ? 1 : -1
    if (a.distanciaMedia == null && b.distanciaMedia == null) return a.atracoesDoDia.length - b.atracoesDoDia.length
    if (a.distanciaMedia == null) return 1
    if (b.distanciaMedia == null) return -1
    return a.distanciaMedia - b.distanciaMedia
  })
}
