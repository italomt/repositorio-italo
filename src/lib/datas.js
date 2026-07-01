// Data de hoje no fuso local em YYYY-MM-DD.
// new Date().toISOString() é UTC e vira o dia às 21h no Brasil — não usar para "hoje".
export function hojeLocalISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dia}`
}
