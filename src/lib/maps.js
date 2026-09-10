// Abre Google Maps nativo com destino único
export function abrirNoMaps(latitude, longitude, nome) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_name=${encodeURIComponent(nome ?? '')}`
  window.open(url, '_blank')
}

// Abre rota com múltiplos pontos (roteiro do dia) no Maps nativo
// A acomodação, quando existe, é o ponto de partida: o dia começa saindo dela.
export function abrirRoteiroDoDia(atracoes, acomodacao) {
  if (!atracoes || atracoes.length === 0) return

  const partida = acomodacao?.latitude && acomodacao?.longitude ? acomodacao : null
  const pontos = partida ? [partida, ...atracoes] : atracoes

  if (pontos.length === 1) {
    abrirNoMaps(pontos[0].latitude, pontos[0].longitude, pontos[0].nome)
    return
  }

  const origem = pontos[0]
  const destino = pontos[pontos.length - 1]
  const waypoints = pontos
    .slice(1, -1)
    .map((a) => `${a.latitude},${a.longitude}`)
    .join('|')

  const url =
    `https://www.google.com/maps/dir/?api=1` +
    `&origin=${origem.latitude},${origem.longitude}` +
    `&destination=${destino.latitude},${destino.longitude}` +
    (waypoints ? `&waypoints=${waypoints}` : '') +
    `&travelmode=walking`

  window.open(url, '_blank')
}

let googleMapsPromise = null

// Carrega o script do Google Maps JS API uma única vez
export function carregarGoogleMaps() {
  if (googleMapsPromise) return googleMapsPromise

  googleMapsPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve(window.google.maps)
      return
    }
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.onload = () => resolve(window.google.maps)
    script.onerror = () => reject(new Error('Falha ao carregar Google Maps'))
    document.head.appendChild(script)
  })

  return googleMapsPromise
}

// Converte um endereço/nome de local em coordenadas.
// Tenta Google Maps Geocoder primeiro; se falhar, usa Nominatim (OSM) como fallback.
export async function geocodificar(endereco) {
  try {
    const google = { maps: await carregarGoogleMaps() }
    const geocoder = new google.maps.Geocoder()

    const resultado = await new Promise((resolve) => {
      geocoder.geocode({ address: endereco }, (resultados, status) => {
        if (status !== 'OK' || !resultados?.[0]) {
          resolve(null)
          return
        }
        const local = resultados[0].geometry.location
        resolve({ latitude: local.lat(), longitude: local.lng(), enderecoFormatado: resultados[0].formatted_address })
      })
    })

    if (resultado) return resultado
  } catch {
    // fallback abaixo
  }

  return geocodificarNominatim(endereco)
}

// Fallback de geocodificação via OpenStreetMap Nominatim (gratuito, sem chave)
// Usa fila sequencial para respeitar 1 req/s sem tomar rate limit
let nominatimFila = Promise.resolve()
let ultimaNominatim = 0

async function geocodificarNominatim(endereco) {
  const minhaVez = nominatimFila.then(async () => {
    const agora = Date.now()
    const desde = agora - ultimaNominatim
    if (desde < 1200) {
      await new Promise((r) => setTimeout(r, 1200 - desde))
    }
    ultimaNominatim = Date.now()

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(endereco)}&format=json&limit=1`,
        { headers: { 'User-Agent': 'EuropaTripApp/1.0' } },
      )
      if (!res.ok) return null
      const dados = await res.json()
      if (!dados?.[0]) return null
      return {
        latitude: Number(dados[0].lat),
        longitude: Number(dados[0].lon),
        enderecoFormatado: dados[0].display_name,
      }
    } catch {
      return null
    }
  })

  nominatimFila = minhaVez.catch(() => {})
  return minhaVez
}

// Busca foto de um local — tenta Google Places, depois Wikipedia API (gratuito)
export async function buscarFotoLocal(nome, cidade) {
  try {
    const google = { maps: await carregarGoogleMaps() }
    const div = document.createElement('div')
    const service = new google.maps.places.PlacesService(div)

    const foto = await new Promise((resolve) => {
      service.textSearch({ query: `${nome}, ${cidade}` }, (results, status) => {
        div.remove()
        if (status === 'OK' && results?.[0]?.photos?.length > 0) {
          resolve(results[0].photos[0].getUrl({ maxWidth: 400 }))
        } else {
          resolve(null)
        }
      })
    })
    if (foto) return foto
  } catch {
    // fallback abaixo
  }

  return buscarFotoWikipedia(nome, cidade)
}

// Fallback gratuito via Wikipedia API (sem chave)
async function buscarFotoWikipedia(nome, cidade) {
  const queries = [`${nome} ${cidade}`, nome]
  for (const q of queries) {
    try {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`,
      )
      if (res.ok) {
        const data = await res.json()
        if (data?.thumbnail?.source) return data.thumbnail.source
      }
    } catch {
      // tenta próxima query
    }
  }
  return null
}

// Transforma um código de país (ex: "PT") no emoji da bandeira correspondente
export function bandeiraDoPais(codigoISO2) {
  if (!codigoISO2 || codigoISO2.length !== 2) return ''
  return codigoISO2
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
}

// Inicializa mapa com pins numerados e rota entre as atrações do dia
export async function inicializarMapaDoDia(atracoes, elementoMapa, acomodacao) {
  const google = { maps: await carregarGoogleMaps() }
  const validas = atracoes.filter((a) => a.latitude && a.longitude)
  if (validas.length === 0) return null

  // O dia começa saindo da acomodação, então ela entra como ponto de partida
  // do traçado e ganha um pino próprio, fora da numeração das atrações.
  const partida =
    acomodacao?.latitude && acomodacao?.longitude
      ? { lat: acomodacao.latitude, lng: acomodacao.longitude }
      : null

  const map = new google.maps.Map(elementoMapa, {
    zoom: 14,
    center: partida ?? { lat: validas[0].latitude, lng: validas[0].longitude },
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    gestureHandling: 'greedy',
  })

  if (validas.length > 1 || partida) {
    const bounds = new google.maps.LatLngBounds()
    validas.forEach((a) => bounds.extend({ lat: a.latitude, lng: a.longitude }))
    if (partida) bounds.extend(partida)
    map.fitBounds(bounds, 40)
  }

  if (partida) {
    const marcadorPartida = new google.maps.Marker({
      position: partida,
      map,
      title: acomodacao.nome,
      zIndex: 999,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#2E7D5B',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 3,
        scale: 13,
      },
    })
    const infoPartida = new google.maps.InfoWindow({
      content: `<div style="padding:8px;font-family:Inter,sans-serif;">
        <strong>${acomodacao.nome}</strong><br/>ponto de partida do dia
      </div>`,
    })
    marcadorPartida.addListener('click', () => infoPartida.open(map, marcadorPartida))
  }

  validas.forEach((atracao, index) => {
    const marker = new google.maps.Marker({
      position: { lat: atracao.latitude, lng: atracao.longitude },
      map,
      label: { text: String(index + 1), color: '#FFFFFF', fontWeight: 'bold' },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#1B3A6B',
        fillOpacity: 1,
        strokeColor: '#E8A838',
        strokeWeight: 2,
        scale: 16,
      },
    })

    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 8px; font-family: Inter, sans-serif;">
          <strong>${atracao.nome}</strong><br/>
          ${atracao.horario_previsto ?? ''}<br/>
          ${atracao.valor ? `~€${atracao.valor}` : 'Gratuito'}<br/>
          <button onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${atracao.latitude},${atracao.longitude}', '_blank')"
            style="margin-top: 6px; padding: 4px 10px; background: #1B3A6B; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Navegar
          </button>
        </div>
      `,
    })

    marker.addListener('click', () => infoWindow.open(map, marker))
  })

  const trajeto = partida
    ? [partida, ...validas.map((a) => ({ lat: a.latitude, lng: a.longitude }))]
    : validas.map((a) => ({ lat: a.latitude, lng: a.longitude }))

  if (trajeto.length > 1) {
    const directionsService = new google.maps.DirectionsService()
    const directionsRenderer = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: { strokeColor: '#E8A838', strokeWeight: 3 },
    })

    directionsService.route(
      {
        origin: trajeto[0],
        destination: trajeto[trajeto.length - 1],
        // O Directions aceita no máximo 25 paradas; acima disso ele recusa a
        // rota inteira e o dia fica sem traçado nenhum.
        waypoints: trajeto.slice(1, -1).slice(0, 25).map((p) => ({ location: p, stopover: true })),
        travelMode: google.maps.TravelMode.WALKING,
      },
      (result, status) => {
        if (status === 'OK') directionsRenderer.setDirections(result)
      },
    )
  }

  return map
}

// Inicializa mapa geral da viagem: pins por cidade + rota entre cidades
export async function inicializarMapaGeral(destinos, todasAtracoes, elementoMapa) {
  const google = { maps: await carregarGoogleMaps() }

  // Agrupa atrações por destino_id (city name via join)
  const atracoesPorDestino = {}
  todasAtracoes.forEach((a) => {
    if (!a.latitude || !a.longitude) return
    const chave = a.destino_id
    if (!chave) return
    if (!atracoesPorDestino[chave]) atracoesPorDestino[chave] = []
    atracoesPorDestino[chave].push(a)
  })

  // Calcula centro aproximado de cada cidade a partir das atrações
  const cidadesComCoords = destinos
    .map((d) => {
      const atracoes = atracoesPorDestino[d.id] || []
      if (atracoes.length > 0) {
        const lat = atracoes.reduce((s, a) => s + a.latitude, 0) / atracoes.length
        const lng = atracoes.reduce((s, a) => s + a.longitude, 0) / atracoes.length
        return { ...d, latitude: lat, longitude: lng }
      }
      // Fallback: coordenadas da cidade (join cidades no useDestinos)
      if (d.latitude != null && d.longitude != null) {
        return { ...d, latitude: d.latitude, longitude: d.longitude }
      }
      return null
    })
    .filter(Boolean)

  // Remove duplicatas de cidade
  const vistos = new Set()
  const cidadesUnicas = cidadesComCoords.filter((c) => {
    const chave = `${c.cidade}-${c.pais}`
    if (vistos.has(chave)) return false
    vistos.add(chave)
    return true
  })

  if (cidadesUnicas.length === 0) {
    // Fallback: mapa vazio centrado na Europa
    const map = new google.maps.Map(elementoMapa, {
      zoom: 4,
      center: { lat: 48.8566, lng: 2.3522 },
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }],
    })
    return map
  }

  const map = new google.maps.Map(elementoMapa, {
    zoom: 3,
    center: { lat: cidadesUnicas[0].latitude, lng: cidadesUnicas[0].longitude },
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    gestureHandling: 'greedy',
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }],
      },
    ],
  })

  // Enquadra tudo que tem coordenada: cidades e atrações
  const boundsGeral = new google.maps.LatLngBounds()
  let pontos = 0
  cidadesUnicas.forEach((c) => { boundsGeral.extend({ lat: c.latitude, lng: c.longitude }); pontos++ })
  Object.values(atracoesPorDestino).flat().forEach((a) => { boundsGeral.extend({ lat: a.latitude, lng: a.longitude }); pontos++ })
  if (pontos > 1) map.fitBounds(boundsGeral, 40)
  else map.setZoom(12)

  // Marcadores de cidade
  cidadesUnicas.forEach((cidade) => {
    const marker = new google.maps.Marker({
      position: { lat: cidade.latitude, lng: cidade.longitude },
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#1B3A6B',
        fillOpacity: 1,
        strokeColor: '#E8A838',
        strokeWeight: 2,
        scale: 12,
      },
    })

    const infoContent = `
      <div style="padding: 8px; font-family: Inter, sans-serif;">
        ${cidade.flag_emoji || ''} <strong>${cidade.cidade}</strong>, ${cidade.pais}<br/>
        <span style="color: #666; font-size: 13px;">${cidade.data}</span>
      </div>
    `
    const infoWindow = new google.maps.InfoWindow({ content: infoContent })
    marker.addListener('click', () => infoWindow.open(map, marker))
  })

  // Rota entre cidades consecutivas
  const pontosRota = cidadesUnicas.filter((c) => c.latitude && c.longitude)
  if (pontosRota.length > 1) {
    const poligono = new google.maps.Polyline({
      path: pontosRota.map((c) => ({ lat: c.latitude, lng: c.longitude })),
      geodesic: true,
      strokeColor: '#E8A838',
      strokeOpacity: 0.7,
      strokeWeight: 2,
      map,
    })
  }

  return map
}
