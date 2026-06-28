export async function geocodificarCidade(cidade) {
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cidade)}&count=1&language=pt&format=json`)
  if (!res.ok) return null
  const data = await res.json()
  if (!data.results?.length) return null
  return { latitude: data.results[0].latitude, longitude: data.results[0].longitude }
}

export async function buscarClima(lat, lng) {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,apparent_temperature,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`,
  )
  if (!res.ok) return null
  return await res.json()
}

export async function buscarTemperaturaTipica(lat, lng, mes) {
  const ano = mes >= 9 ? '2024' : '2025'
  const inicio = `${ano}-${String(mes).padStart(2, '0')}-01`
  const fim = mes === 12 ? `${ano}-12-31` : `${ano}-${String(mes + 1).padStart(2, '0')}-01`
  const res = await fetch(
    `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${inicio}&end_date=${fim}&daily=temperature_2m_max,temperature_2m_min&timezone=auto`,
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
