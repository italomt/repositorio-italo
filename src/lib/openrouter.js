const MODELOS_TEXTO = ['deepseek/deepseek-chat', 'openai/gpt-4o-mini']
const MODELOS_VISAO = ['google/gemini-2.0-flash-001', 'openai/gpt-4o-mini']

function extrairJSON(text) {
  try {
    return JSON.parse(text)
  } catch {
    // Tenta extrair objeto
    let match = text.match(/\{[\s\S]*\}/)
    if (match) {
      try { return JSON.parse(match[0]) } catch {}
    }
    // Tenta extrair array
    match = text.match(/\[[\s\S]*\]/)
    if (match) {
      try { return JSON.parse(match[0]) } catch {}
    }
    throw new Error('IA não retornou JSON válido: ' + text.slice(0, 300))
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

export async function sugerirAtracoes(cidade, pais, roteiro, atracoesExistentes = [], tipo = 'lazer') {
  const datasCidade = roteiro
    .filter((d) => d.cidade === cidade)
    .map((d) => d.data)

  let blocklist = ''
  if (atracoesExistentes.length > 0) {
    blocklist = `\n\nJÁ PLANEJADO (NÃO SUGERIR NENHUM DESTES):\n${atracoesExistentes.map((a) => `- ${a.nome}`).join('\n')}`
  }

  const guiaPorTipo = {
    lazer: 'O usuário quer lazer. Priorize museus, restaurantes badalados, vida noturna, pontos turísticos clássicos e compras.',
    trabalho: 'O usuário está a trabalho. Priorize passeios curtos, restaurantes casuais, cafés e coworkings, happy hours.',
    mochilao: 'O usuário é mochileiro. Priorize atrações gratuitas, natureza, hostels, comida de rua e experiências econômicas.',
    familia: 'O usuário está em família. Priorize parques, passeios educativos, restaurantes familiares e atrações para crianças.',
  }

  const systemPrompt = `Você é um guia de viagem especializado em turismo pela Europa. Responda em português do Brasil.

O usuário está em ${cidade}, ${pais} nestas datas: ${datasCidade.join(', ')}.

${guiaPorTipo[tipo] || guiaPorTipo.lazer}

Sugira 6 a 8 atrações turísticas imperdíveis nessa cidade. Priorize atrações reais e bem avaliadas.

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

// ============================================================
// NOVO: Motor de planejamento de cidade (5 blocos)
// ============================================================
export async function planejarCidade({
  cidade, pais, datas, tipo, moeda,
  hospedagem, clima,
  atracoesExistentes,
}) {
  const guiaPorTipo = {
    lazer: 'Lazer — priorize museus, restaurantes, vida noturna, pontos turísticos clássicos e compras.',
    trabalho: 'Trabalho — priorize passeios curtos, restaurantes casuais, cafés, coworkings e happy hours.',
    mochilao: 'Mochilão — priorize atrações gratuitas, natureza, hostels, comida de rua e economia.',
    familia: 'Família — priorize parques, passeios educativos, restaurantes familiares, atrações kids-friendly.',
  }

  const hoje = new Date().toISOString().slice(0, 10)
  const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

  // Bloco 2: Contexto da viagem
  const ctxViagem = `VIAGEM
  Tipo: ${guiaPorTipo[tipo] || guiaPorTipo.lazer}
  Moeda: ${moeda || 'EUR'}
  ${hospedagem ? `Hospedagem: ${hospedagem.nome} — ${hospedagem.endereco || 'endereço não informado'}
  Coordenadas: ${hospedagem.latitude}, ${hospedagem.longitude}` : 'Hospedagem: não informada'}`

  // Bloco 3: Contexto da cidade
  const datasFormatadas = datas.map((d) => {
    const date = new Date(d + 'T00:00:00')
    return `${d} (${DIAS_SEMANA[date.getDay()]})`
  }).join(', ')
  
  const climaStr = clima
    ? datas.map((d) => {
        const info = clima[d]
        return info ? `${d}: ${info.icone || ''} ${info.temp}°C` : `${d}: sem previsão`
      }).join(' | ')
    : 'Clima não disponível'

  const ctxCidade = `CIDADE: ${cidade}, ${pais}
  Período: ${datasFormatadas} (${datas.length} dia${datas.length !== 1 ? 's' : ''})
  ${hospedagem ? `Centro de operações: ${hospedagem.endereco || hospedagem.nome}` : 'Sem ponto de referência fixo'}
  Clima: ${climaStr}`

  // Bloco 4: Estado atual do banco
  const atracoesPorDia = {}
  datas.forEach((d) => { atracoesPorDia[d] = [] })
  atracoesExistentes.forEach((a) => {
    if (a.data && atracoesPorDia[a.data]) {
      atracoesPorDia[a.data].push(a)
    }
  })

  const estadoAtual = datas.map((d) => {
    const date = new Date(d + 'T00:00:00')
    const diaSemana = DIAS_SEMANA[date.getDay()]
    const atracoes = atracoesPorDia[d] || []
    const temDiaInteiro = atracoes.some((a) => a.ocupa_dia_inteiro)

    if (temDiaInteiro) {
      const atracao = atracoes.find((a) => a.ocupa_dia_inteiro)
      return `DIA ${d} (${diaSemana}) — BLOQUEADO\n  ${atracao.nome} | ${atracao.categoria} | DIA INTEIRO`
    }

    if (atracoes.length === 0) {
      return `DIA ${d} (${diaSemana}) — DISPONÍVEL\n  Nenhuma atração planejada.`
    }

    const ordenadas = [...atracoes].sort((a, b) =>
      (a.horario_previsto || '99:99').localeCompare(b.horario_previsto || '99:99')
    )
    const linhas = ordenadas.map((a) =>
      `  ${a.horario_previsto?.slice(0, 5) || '--:--'} | ${a.nome} | ${a.categoria} | ${a.custo_estimado_eur > 0 ? '€' + a.custo_estimado_eur : 'grátis'}${a.precisa_reserva ? ' | precisa reserva' : ''}`
    ).join('\n')
    return `DIA ${d} (${diaSemana}) — PARCIAL\n${linhas}`
  }).join('\n\n')

  // Bloco 5: Regras (compacto)
  const regras = `REGRAS DE PLANEJAMENTO:
- Ordem lógica (manhã→tarde→noite), começar perto da hospedagem.
- Agrupar por bairro/região, nunca atravessar a cidade sem necessidade.
- Almoço 11:30-14:00, jantar 18:00-22:00. Incluir 1 pausa café/lanche/dia.
- Não colocar 2 museus consecutivos. Alternar cultura com ar livre.
- Segunda-feira: evitar museus (fechados).
- Espaçamento de 1h30 entre atrações. Máximo 25min caminhada entre elas.
- Se ocupa_dia_inteiro=true no dia, array vazio [].
- Se previsão de chuva: priorizar locais cobertos.
- Se temperatura >30°C: evitar caminhada longa 12:00-15:00.
- Não repetir mesma categoria mais de 2x no dia. Variar entre os dias.
- Priorizar atrações icônicas antes das secundárias.
- Pense no plano, gere o JSON. Não explique o raciocínio.`

  const systemPrompt = `Planejador profissional de roteiros. Monte o MELHOR roteiro para esta cidade considerando logística real, horários, perfil do viajante e coerência geográfica.

${ctxViagem}

${ctxCidade}

ESTADO ATUAL:
${estadoAtual}

${regras}

RETORNE APENAS JSON (sem texto):
{
  "dias": {
    "${datas[0] || '2026-01-01'}": [
      {
        "nome": "Nome da atração",
        "categoria": "museu" | "gastronomia" | "balada" | "compras" | "natureza" | "cultura" | "lazer" | "outro",
        "descricao": "1 frase sobre o que é e por que vale a visita",
        "custo_estimado_eur": number | null,
        "precisa_reserva": boolean,
        "link_reserva_oficial": string | null,
        "dias_antecedencia": number,
        "ocupa_dia_inteiro": boolean,
        "local_busca": "Nome oficial para Google Maps",
        "horario_sugerido": "HH:MM"
      }
    ]
  }
}

LEMBRE:
- custo_estimado_eur: preencher na moeda ${moeda || 'EUR'} (se BRL, usar reais; se EUR, usar euros). null se gratuito.
- precisa_reserva: true = precisa comprar ingresso antecipado.
- link_reserva_oficial: URL do site oficial de reserva (se precisa_reserva=true, caso contrário null).
- dias_antecedencia: quantos dias antes da visita precisa reservar (0 a 60). 0 se não precisa.
- ocupa_dia_inteiro: true só para parques/passeios dia cheio.
- local_busca: nome exato pesquisável no Google Maps (ex: "Museu do Louvre, Paris").
- horario_sugerido: string "HH:MM".
- Dias bloqueados (com atração de dia inteiro) = array vazio [].`

  return chamarComFallback(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Planeje o roteiro completo para ${cidade}, ${pais}.` },
    ],
    MODELOS_TEXTO,
    3500,
  )
}
