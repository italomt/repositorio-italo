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

// Converte um valor em qualquer moeda suportada para EUR
export async function converterParaEUR(valor, moedaOrigem) {
  if (moedaOrigem === 'EUR') return valor
  const taxas = await buscarCotacaoEur()
  return Number((valor / taxas[moedaOrigem]).toFixed(2))
}

export const PAIS_TO_MOEDA = {
  Portugal: 'EUR', Espanha: 'EUR', Itália: 'EUR', França: 'EUR',
  Holanda: 'EUR', Alemanha: 'EUR', Bélgica: 'EUR', Áustria: 'EUR',
  Irlanda: 'EUR', Grécia: 'EUR', Finlândia: 'EUR',
  Brasil: 'BRL', Inglaterra: 'GBP', 'Reino Unido': 'GBP',
  'Estados Unidos': 'USD', Canadá: 'CAD', Austrália: 'AUD',
  Suíça: 'CHF', Japão: 'JPY', México: 'MXN', Argentina: 'ARS',
}

export function formatarBRL(valor) {
  return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const SIMBOLOS = { BRL: 'R$', EUR: '€', USD: '$', GBP: '£', CHF: 'CHF' }

export function simboloMoeda(moeda) {
  return SIMBOLOS[moeda] || moeda || '€'
}
