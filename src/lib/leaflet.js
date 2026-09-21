// Leaflet carregado sob demanda pelo CDN, só quando a aba Dirigir abre o mapa.
// Não entra no bundle: o app inteiro usa Google Maps, e este é o único lugar
// que precisa desenhar polígono de ZTL vindo de GeoJSON.
let promessa = null

export function carregarLeaflet() {
  if (promessa) return promessa

  promessa = new Promise((resolve, reject) => {
    if (window.L) {
      resolve(window.L)
      return
    }

    const css = document.createElement('link')
    css.rel = 'stylesheet'
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
    document.head.appendChild(css)

    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js'
    script.async = true
    script.onload = () => resolve(window.L)
    script.onerror = () => reject(new Error('Falha ao carregar Leaflet'))
    document.head.appendChild(script)
  })

  return promessa
}
