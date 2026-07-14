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
