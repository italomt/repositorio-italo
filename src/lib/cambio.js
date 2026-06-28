let cacheCotacao = null
let cacheTimestamp = 0
const CACHE_MS = 1000 * 60 * 30 // 30 min

// Busca cotação EUR -> outras moedas (inclui BRL e CHF)
export async function buscarCotacaoEur() {
  const agora = Date.now()
  if (cacheCotacao && agora - cacheTimestamp < CACHE_MS) {
    return cacheCotacao
  }

  const res = await fetch('https://open.er-api.com/v6/latest/EUR')
  if (!res.ok) throw new Error('Falha ao buscar cotação')
  const data = await res.json()

  cacheCotacao = data.rates
  cacheTimestamp = agora
  return cacheCotacao
}

// Converte um valor em qualquer moeda suportada para BRL, passando por EUR
export async function converterParaBRL(valor, moedaOrigem) {
  const taxas = await buscarCotacaoEur()
  if (moedaOrigem === 'BRL') return { valorBRL: valor, cotacaoUsada: 1 }

  const valorEmEur = moedaOrigem === 'EUR' ? valor : valor / taxas[moedaOrigem]
  const cotacaoEurBrl = taxas['BRL']
  const valorBRL = valorEmEur * cotacaoEurBrl

  return { valorBRL: Number(valorBRL.toFixed(2)), cotacaoUsada: cotacaoEurBrl }
}

export function formatarBRL(valor) {
  return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
