export async function geocodificarCidade(cidade, pais) {
  const params = new URLSearchParams({ name: cidade, count: 5, language: 'pt', format: 'json' })
  if (pais) params.set('country_code', pais)
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`)
  if (!res.ok) return null
  const data = await res.json()
  if (!data.results?.length) return null
  const resultado = pais ? data.results.find((r) => r.country_code === pais) ?? data.results[0] : data.results[0]
  return { latitude: resultado.latitude, longitude: resultado.longitude, timezone: resultado.timezone }
}

export async function buscarClima(lat, lng) {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,apparent_temperature,weather_code&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto&forecast_days=1`,
  )
  if (!res.ok) return null
  return await res.json()
}

export async function buscarTemperaturaTipica(lat, lng, dataInicio, dataFim) {
  const res = await fetch(
    `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${dataInicio}&end_date=${dataFim}&daily=temperature_2m_max,temperature_2m_min&timezone=auto`,
  )
  if (!res.ok) return null
  return await res.json()
}

const ICONES_CLIMA = {
  0: '☀️',
  1: '🌤️',
  2: '⛅',
  3: '☁️',
  45: '🌫️',
  48: '🌫️',
  51: '🌦️',
  53: '🌦️',
  55: '🌦️',
  61: '🌧️',
  63: '🌧️',
  65: '🌧️',
  71: '🌨️',
  73: '🌨️',
  75: '🌨️',
  80: '🌦️',
  81: '🌦️',
  82: '🌦️',
  95: '⛈️',
  96: '⛈️',
  99: '⛈️',
}

export function iconeClima(code) {
  return ICONES_CLIMA[code] ?? '🌡️'
}
