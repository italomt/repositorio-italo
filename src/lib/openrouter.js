const MODELOS_TEXTO = ['deepseek/deepseek-chat', 'openai/gpt-4o-mini']
const MODELOS_VISAO = ['google/gemini-2.0-flash-001', 'openai/gpt-4o-mini']

function extrairJSON(text) {
  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    throw new Error('IA não retornou JSON válido: ' + text.slice(0, 200))
  }
}

async function chamarModelo(model, messages, maxTokens = 300) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://europa-trip-app.vercel.app',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.1,
      max_tokens: maxTokens,
    }),
  })

  if (!response.ok) {
    const corpo = await response.text().catch(() => '')
    throw new Error(`OpenRouter (${model}) falhou: HTTP ${response.status} ${corpo.slice(0, 200)}`)
  }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error(`OpenRouter (${model}) não retornou conteúdo: ${JSON.stringify(data).slice(0, 200)}`)

  return extrairJSON(text)
}

async function chamarComFallback(messages, modelos, maxTokens) {
  let ultimoErro = null
  for (const model of modelos) {
    try {
      return await chamarModelo(model, messages, maxTokens)
    } catch (erro) {
      ultimoErro = erro
    }
  }
  throw ultimoErro
}

async function chamarIA(systemPrompt, userPrompt, maxTokens) {
  return chamarComFallback(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    MODELOS_TEXTO,
    maxTokens,
  )
}

export async function interpretarAtracao(inputDoUsuario, roteiro) {
  const systemPrompt = `Você é um assistente de viagem. Responda em português do Brasil. Analise o texto do usuário e extraia informações sobre uma atração turística.

O usuário está viajando pela Europa com este roteiro:
${roteiro.map((d) => `${d.data}: ${d.cidade}, ${d.pais}`).join('\n')}

Retorne APENAS um JSON válido com esta estrutura exata, sem texto adicional:
{
  "tipo": "atracao",
  "nome": string,
  "cidade_provavel": string,
  "pais_provavel": string,
  "categoria": "museu" | "gastronomia" | "balada" | "compras" | "natureza" | "cultura" | "lazer" | "outro",
  "precisa_reserva": boolean,
  "custo_estimado_eur": number | null,
  "dica": string | null,
  "local_busca": string,
  "ocupa_dia_inteiro": boolean
}

"local_busca": se o usuário pediu algo específico (ex: "Coliseu"), repita o nome do local. Se o usuário pediu algo genérico (ex: "comer pastel de nata", "jantar romântico", "ver pôr do sol"), sugira um estabelecimento real e específico, bem avaliado, conhecido nessa cidade que satisfaça o pedido (ex: para "pastel de nata" em Lisboa, sugira "Pastéis de Belém"). Esse campo precisa ser um endereço pesquisável no Google Maps.
"ocupa_dia_inteiro": true para parques temáticos, bate-voltas de dia inteiro, cruzeiros de um dia ou passeios que tipicamente ocupam o dia todo (ex: Disneyland Paris). false para a maioria das atrações pontuais.`

  return chamarIA(systemPrompt, `Texto do usuário: "${inputDoUsuario}"`)
}

export async function interpretarGasto(inputDoUsuario, cidadeAtual) {
  const systemPrompt = `Responda em português do Brasil. Extraia informações financeiras do texto. Retorne APENAS JSON válido:
{
  "descricao": string,
  "valor": number,
  "moeda": "EUR" | "USD" | "CHF" | "BRL" | "GBP",
  "categoria": "alimentacao" | "transporte" | "hospedagem" | "atracoes" | "compras" | "lazer" | "outro"
}
Identifique a moeda pelo texto: "dólar"/"dólares"/"$" fora de contexto de real = USD, "euro(s)"/"€" = EUR, "franco(s)" = CHF, "real"/"reais"/"R$" = BRL, "libra(s)"/"£" = GBP.`

  return chamarIA(systemPrompt, `Texto: "${inputDoUsuario}". Cidade atual: "${cidadeAtual ?? ''}"`)
}

export async function sugerirAtracoes(cidade, pais, roteiro, atracoesExistentes = []) {
  const datasCidade = roteiro
    .filter((d) => d.cidade === cidade)
    .map((d) => d.data)

  let blocklist = ''
  if (atracoesExistentes.length > 0) {
    blocklist = `\n\nJÁ PLANEJADO (NÃO SUGERIR NENHUM DESTES):\n${atracoesExistentes.map((a) => `- ${a.nome}`).join('\n')}`
  }

  const systemPrompt = `Você é um guia de viagem especializado em turismo pela Europa. Responda em português do Brasil.

O usuário está em ${cidade}, ${pais} nestas datas: ${datasCidade.join(', ')}.

Sugira 6 a 8 atrações turísticas imperdíveis nessa cidade. Priorize atrações reais, bem avaliadas, variando entre museus, gastronomia, natureza, cultura, lazer e compras.

Retorne APENAS um array JSON válido, sem texto adicional, com esta estrutura exata:
[
  {
    "nome": "Nome da atração",
    "categoria": "museu" | "gastronomia" | "balada" | "compras" | "natureza" | "cultura" | "lazer" | "outro",
    "descricao": "Descrição curta do que é e por que visitar (máx 15 palavras)",
    "custo_estimado_eur": number | null,
    "precisa_reserva": boolean,
    "ocupa_dia_inteiro": boolean,
    "local_busca": "Nome do local exato para pesquisa no Google Maps"
  }
]

Regras:
- "custo_estimado_eur": null para gratuitos, número para pagos (ingresso típico).
- "ocupa_dia_inteiro": true só para parques temáticos ou passeios de dia completo.
- "local_busca": use o nome oficial do local (ex: "Museo del Prado, Madrid", "Torre Eiffel, Paris").
- Inclua pelo menos uma opção gastronômica (restaurante/mercado típico) e uma ao ar livre.
- Varie as categorias - não repita a mesma categoria mais de 2 vezes.${blocklist}`

  return chamarComFallback(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Sugira atrações para ${cidade}, ${pais}.` },
    ],
    MODELOS_TEXTO,
    1200,
  )
}

export async function interpretarGastoPorFoto(imagemBase64, cidadeAtual) {
  const systemPrompt = `Responda em português do Brasil. Você é um assistente que lê recibos e notas fiscais de viagem. Analise a imagem e extraia os dados do gasto. Retorne APENAS JSON válido, sem texto adicional:
{
  "descricao": string,
  "valor": number,
  "moeda": "EUR" | "USD" | "CHF" | "BRL" | "GBP",
  "categoria": "alimentacao" | "transporte" | "hospedagem" | "atracoes" | "compras" | "lazer" | "outro"
}
Use o valor TOTAL do recibo. Se não conseguir identificar a moeda, assuma EUR. Cidade atual da viagem: "${cidadeAtual ?? ''}".`

  return chamarComFallback(
    [
      {
        role: 'user',
        content: [
          { type: 'text', text: systemPrompt },
          { type: 'image_url', image_url: { url: imagemBase64 } },
        ],
      },
    ],
    MODELOS_VISAO,
  )
}
