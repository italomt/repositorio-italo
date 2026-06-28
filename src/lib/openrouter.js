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

async function chamarModelo(model, messages) {
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
      max_tokens: 300,
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

async function chamarComFallback(messages, modelos) {
  let ultimoErro = null
  for (const model of modelos) {
    try {
      return await chamarModelo(model, messages)
    } catch (erro) {
      ultimoErro = erro
    }
  }
  throw ultimoErro
}

async function chamarIA(systemPrompt, userPrompt) {
  return chamarComFallback(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    MODELOS_TEXTO,
  )
}

export async function interpretarAtracao(inputDoUsuario, roteiro) {
  const systemPrompt = `Você é um assistente de viagem. Analise o texto do usuário e extraia informações sobre uma atração turística.

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
  const systemPrompt = `Extraia informações financeiras do texto. Retorne APENAS JSON válido:
{
  "descricao": string,
  "valor": number,
  "moeda": "EUR" | "USD" | "CHF" | "BRL" | "GBP",
  "categoria": "alimentacao" | "transporte" | "hospedagem" | "atracoes" | "compras" | "lazer" | "outro"
}
Identifique a moeda pelo texto: "dólar"/"dólares"/"$" fora de contexto de real = USD, "euro(s)"/"€" = EUR, "franco(s)" = CHF, "real"/"reais"/"R$" = BRL, "libra(s)"/"£" = GBP.`

  return chamarIA(systemPrompt, `Texto: "${inputDoUsuario}". Cidade atual: "${cidadeAtual ?? ''}"`)
}

export async function interpretarGastoPorFoto(imagemBase64, cidadeAtual) {
  const systemPrompt = `Você é um assistente que lê recibos e notas fiscais de viagem. Analise a imagem e extraia os dados do gasto. Retorne APENAS JSON válido, sem texto adicional:
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
