// Abre Google Maps nativo com destino único
export function abrirNoMaps(latitude, longitude, nome) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_name=${encodeURIComponent(nome ?? '')}`
  window.open(url, '_blank')
}

// Abre rota com múltiplos pontos (roteiro do dia) no Maps nativo
export function abrirRoteiroDoDia(atracoes) {
  if (!atracoes || atracoes.length === 0) return
  if (atracoes.length === 1) {
    abrirNoMaps(atracoes[0].latitude, atracoes[0].longitude, atracoes[0].nome)
    return
  }

  const origem = atracoes[0]
  const destino = atracoes[atracoes.length - 1]
  const waypoints = atracoes
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
let ultimaNominatim = 0

async function geocodificarNominatim(endereco) {
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
export async function inicializarMapaDoDia(atracoes, elementoMapa) {
  const google = { maps: await carregarGoogleMaps() }
  const validas = atracoes.filter((a) => a.latitude && a.longitude)
  if (validas.length === 0) return null

  const map = new google.maps.Map(elementoMapa, {
    zoom: 14,
    center: { lat: validas[0].latitude, lng: validas[0].longitude },
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  })

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
          ${atracao.custo_estimado_eur ? `~€${atracao.custo_estimado_eur}` : 'Gratuito'}<br/>
          <button onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${atracao.latitude},${atracao.longitude}', '_blank')"
            style="margin-top: 6px; padding: 4px 10px; background: #1B3A6B; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Navegar
          </button>
        </div>
      `,
    })

    marker.addListener('click', () => infoWindow.open(map, marker))
  })

  if (validas.length > 1) {
    const directionsService = new google.maps.DirectionsService()
    const directionsRenderer = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: { strokeColor: '#E8A838', strokeWeight: 3 },
    })

    const waypoints = validas.slice(1, -1).map((a) => ({
      location: { lat: a.latitude, lng: a.longitude },
      stopover: true,
    }))

    directionsService.route(
      {
        origin: { lat: validas[0].latitude, lng: validas[0].longitude },
        destination: {
          lat: validas[validas.length - 1].latitude,
          lng: validas[validas.length - 1].longitude,
        },
        waypoints,
        travelMode: google.maps.TravelMode.WALKING,
      },
      (result, status) => {
        if (status === 'OK') directionsRenderer.setDirections(result)
      },
    )
  }

  return map
}
