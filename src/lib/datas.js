// Data de hoje no fuso local em YYYY-MM-DD.
// new Date().toISOString() é UTC e vira o dia às 21h no Brasil — não usar para "hoje".
export function hojeLocalISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dia}`
}

// Converte um timestamptz (ISO, vindo do Supabase) pro formato que
// <input type="datetime-local"> aceita: "YYYY-MM-DDTHH:mm" no fuso local do navegador.
export function paraDatetimeLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${dia}T${h}:${min}`
}

// Converte o valor de <input type="datetime-local"> de volta pra ISO (timestamptz).
export function deDatetimeLocal(valorLocal) {
  if (!valorLocal) return null
  return new Date(valorLocal).toISOString()
}

// Como paraDatetimeLocal, mas exibe o horário de parede na cidade (fuso IANA,
// ex: "Europe/Madrid") em vez do fuso do navegador. Sem fuso, cai pro fuso do navegador.
export function paraDatetimeLocalFuso(iso, fuso) {
  if (!iso) return ''
  if (!fuso) return paraDatetimeLocal(iso)
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: fuso,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date(iso))
  const mapa = Object.fromEntries(partes.map((p) => [p.type, p.value]))
  const hora = mapa.hour === '24' ? '00' : mapa.hour
  return `${mapa.year}-${mapa.month}-${mapa.day}T${hora}:${mapa.minute}`
}

// Como deDatetimeLocal, mas interpreta o valor como horário de parede na cidade
// (fuso IANA) e converte pro instante UTC correto. Sem fuso, cai pro fuso do navegador.
export function deDatetimeLocalFuso(valorLocal, fuso) {
  if (!valorLocal) return null
  if (!fuso) return deDatetimeLocal(valorLocal)

  const [dataParte, horaParte] = valorLocal.split('T')
  const [ano, mes, dia] = dataParte.split('-').map(Number)
  const [hora, minuto] = horaParte.split(':').map(Number)
  const palpiteUtc = Date.UTC(ano, mes - 1, dia, hora, minuto)

  // Trick padrão: formata o palpite no fuso alvo, compara com o horário pretendido
  // e corrige a diferença — não dá pra construir "horário de parede em fuso X" direto em JS.
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: fuso,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(new Date(palpiteUtc))
  const mapa = Object.fromEntries(partes.map((p) => [p.type, p.value]))
  const comoUtc = Date.UTC(
    +mapa.year, +mapa.month - 1, +mapa.day,
    mapa.hour === '24' ? 0 : +mapa.hour, +mapa.minute, +mapa.second,
  )
  const diferenca = comoUtc - palpiteUtc
  return new Date(palpiteUtc - diferenca).toISOString()
}
