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

// Ordena as atrações pelo vizinho mais próximo, começando do ponto de partida.
// Usa o algoritmo Nearest Neighbor: a partir da localização inicial, encontra a
// atração mais próxima, depois a mais próxima dessa, e assim por diante.
// Atrações sem coordenadas vão para o final da lista.
export function otimizarRota(atracoes, pontoPartida) {
  const comCoordenadas = atracoes.filter((a) => a.latitude != null && a.longitude != null)
  const semCoordenadas = atracoes.filter((a) => a.latitude == null || a.longitude == null)

  if (comCoordenadas.length === 0) return atracoes

  const restantes = [...comCoordenadas]
  const ordenadas = []
  let atual = pontoPartida

  while (restantes.length > 0) {
    let menorDist = Infinity
    let menorIdx = -1

    for (let i = 0; i < restantes.length; i++) {
      const d = distanciaKm(atual.lat, atual.lng, restantes[i].latitude, restantes[i].longitude)
      if (d < menorDist) {
        menorDist = d
        menorIdx = i
      }
    }

    const escolhida = restantes.splice(menorIdx, 1)[0]
    ordenadas.push(escolhida)
    atual = { lat: escolhida.latitude, lng: escolhida.longitude }
  }

  return [...ordenadas, ...semCoordenadas]
}

// Gera horários espaçados (1h30 de intervalo) começando às 09:00
export function gerarHorarios(qtd) {
  const horarios = []
  let hora = 9
  let minuto = 0
  for (let i = 0; i < qtd; i++) {
    horarios.push(`${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`)
    minuto += 90
    hora += Math.floor(minuto / 60)
    minuto = minuto % 60
  }
  return horarios
}

// Formata distância para exibição amigável (ex: "1,2 km", "350 m")
export function formatarDistancia(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1).replace('.', ',')} km`
}

// Estima tempo de caminhada (5 km/h ≈ 12 min/km)
export function estimarTempoCaminhada(km) {
  const minutos = Math.round(km * 12)
  if (minutos < 1) return 'menos de 1 min'
  if (minutos < 60) return `${minutos} min`
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return m > 0 ? `${h}h${m}` : `${h}h`
}

// Para cada dia candidato, calcula quão perto a nova atração fica das que já estão
// planejadas nesse dia, e se o dia já está "cheio" (tem atração de dia inteiro).
// Se houver acomodação na cidade, também considera a proximidade dela.
// Retorna a lista ordenada da melhor pra pior sugestão.
export function ranquearDias(diasCandidatos, atracoesExistentes, novaLat, novaLng, acomodacoes = []) {
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

      // Se a cidade tem acomodação, pondera a distância até ela
      const acomodacao = acomodacoes.find((a) => a.cidade === destino.cidade && a.latitude && a.longitude)
      if (acomodacao) {
        const distAcomodacao = distanciaKm(novaLat, novaLng, acomodacao.latitude, acomodacao.longitude)
        if (distanciaMedia != null) {
          distanciaMedia = (distanciaMedia + distAcomodacao) / 2
        } else {
          distanciaMedia = distAcomodacao
        }
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
