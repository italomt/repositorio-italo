import { supabase } from './supabase'
import { converterParaBRL } from './cambio'
import { emitirSync } from './sync'
import { hojeLocalISO } from './datas'

// Flash primeiro por ser ~3x mais barato e também ler imagem/PDF; Haiku entra
// quando ele falha ou devolve algo que não dá pra usar.
const MODELOS = ['google/gemini-2.5-flash', 'anthropic/claude-haiku-4.5']
const MAX_RODADAS_BUSCA = 2

function extrairJSON(texto) {
  try {
    return JSON.parse(texto)
  } catch {
    const match = texto.match(/\{[\s\S]*\}/)
    if (match) {
      try { return JSON.parse(match[0]) } catch { /* cai no throw abaixo */ }
    }
    // Modelo respondeu em texto puro: trata como resposta sem ação, em vez de quebrar o chat.
    return { resposta: texto.trim(), acao: null }
  }
}

async function chamarUmModelo(model, messages, maxTokens) {
  const { data, error } = await supabase.functions.invoke('openrouter-proxy', {
    body: { model, messages, max_tokens: maxTokens, temperature: 0.4 },
  })

  if (error) throw new Error(`(${model}) ${error.message}`)
  if (data?.error) throw new Error(`(${model}) ${JSON.stringify(data.error).slice(0, 200)}`)

  const texto = data.choices?.[0]?.message?.content
  if (!texto) throw new Error(`(${model}) resposta vazia`)

  return extrairJSON(texto)
}

async function chamarModelo(messages, maxTokens = 1500) {
  let ultimoErro = null
  for (const model of MODELOS) {
    try {
      return await chamarUmModelo(model, messages, maxTokens)
    } catch (erro) {
      ultimoErro = erro
    }
  }
  throw new Error(`Assistente indisponível: ${ultimoErro?.message || 'erro desconhecido'}`)
}

async function buscarNaWeb(query) {
  const { data, error } = await supabase.functions.invoke('buscar-web', { body: { query } })
  if (error || data?.error) return { indisponivel: true, resultados: [] }
  return data
}

const DIAS_SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

function formatarMomento(iso) {
  if (!iso) return '?'
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)} ${iso.slice(11, 16)}`
}

function montarContexto({
  viagem,
  destinos,
  atracoes,
  acomodacoes,
  gastos,
  transportes = [],
  pendencias = [],
  documentos = [],
}) {
  const hoje = hojeLocalISO()

  const roteiro = [...destinos]
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((d) => {
      const data = new Date(d.data + 'T00:00:00')
      const doDia = atracoes
        .filter((a) => a.destino_id === d.id)
        .sort((a, b) => (a.horario_previsto || '99').localeCompare(b.horario_previsto || '99'))
        .map((a) => {
          const detalhes = [
            a.categoria,
            a.custo_estimado_eur ? `€${a.custo_estimado_eur}` : 'grátis',
            a.precisa_reserva ? `reserva ${a.status_reserva || 'pendente'}` : null,
            a.ocupa_dia_inteiro ? 'dia inteiro' : null,
            a.notas,
            a.link,
          ].filter(Boolean).join(', ')
          return `    - ${a.horario_previsto?.slice(0, 5) || '--:--'} ${a.nome} (${detalhes})`
        })
      return `${d.data} (${DIAS_SEMANA[data.getDay()]}) · ${d.cidade}, ${d.pais}${d.notas ? ` · nota: ${d.notas}` : ''}\n${doDia.length ? doDia.join('\n') : '    (sem atração planejada)'}`
    })
    .join('\n')

  const hospedagens = acomodacoes.length
    ? acomodacoes
        .map((h) => {
          const detalhes = [
            h.endereco,
            h.check_in ? `check-in ${formatarMomento(h.check_in)}` : null,
            h.check_out ? `check-out ${formatarMomento(h.check_out)}` : null,
            h.valor_noite ? `${h.moeda || 'EUR'} ${h.valor_noite}/noite` : null,
            h.notas,
          ].filter(Boolean).join(' · ')
          return `${h.cidade || '?'}: ${h.nome}${detalhes ? ` — ${detalhes}` : ''}`
        })
        .join('\n')
    : 'nenhuma cadastrada'

  const abertas = pendencias.filter((p) => p.estado === 'aberta')
  const listaPendencias = abertas.length
    ? abertas
        .map((p) => `[${p.urgencia || 'media'}] ${p.titulo}${p.prazo_sugerido ? ` (prazo ${p.prazo_sugerido})` : ''}${p.link ? ` — ${p.link}` : ''}`)
        .join('\n')
    : 'nenhuma em aberto'

  const listaDocumentos = documentos.length
    ? documentos.map((d) => `${d.nome}${d.categoria ? ` (${d.categoria})` : ''}`).join('\n')
    : 'nenhum cadastrado'

  const listaTransportes = transportes.length
    ? transportes
        .map((t) => {
          const trecho = `${t.cidade_origem || '?'} → ${t.cidade_destino || '?'}`
          const quando = `${formatarMomento(t.horario_saida)}${t.horario_chegada ? ` até ${formatarMomento(t.horario_chegada)}` : ''}`
          const extras = [t.operadora, t.codigo_reserva ? `reserva ${t.codigo_reserva}` : null, t.notas]
            .filter(Boolean)
            .join(' · ')
          return `${t.tipo}: ${trecho} — ${quando}${extras ? ` (${extras})` : ''}`
        })
        .join('\n')
    : 'nenhum cadastrado'

  const totalGasto = gastos.reduce((soma, g) => soma + (Number(g.valor_brl) || 0), 0)
  const listaGastos = gastos.length
    ? [...gastos]
        .sort((a, b) => (b.data_gasto || '').localeCompare(a.data_gasto || ''))
        .map((g) => `${g.data_gasto || '?'}: ${g.descricao} — ${g.moeda || 'EUR'} ${g.valor} (${g.categoria || 'outro'})`)
        .join('\n')
    : 'nenhum lançado'

  return `VIAGEM: ${viagem?.nome} (${viagem?.data_inicio} a ${viagem?.data_fim})${viagem?.tipo ? ` · perfil: ${viagem.tipo}` : ''}${viagem?.orcamento_total ? ` · orçamento: ${viagem.moeda_principal || 'BRL'} ${viagem.orcamento_total}` : ''}
HOJE: ${hoje}

ROTEIRO (dia a dia, com as atrações de cada dia):
${roteiro || 'sem dias cadastrados'}

VOOS, TRENS E DEMAIS TRANSPORTES:
${listaTransportes}

HOSPEDAGENS:
${hospedagens}

PENDÊNCIAS EM ABERTO:
${listaPendencias}

DOCUMENTOS GUARDADOS NO APP:
${listaDocumentos}

GASTOS (total R$ ${totalGasto.toFixed(2)} em ${gastos.length} lançamento(s)):
${listaGastos}`
}

const REGRAS = `Você é o assistente de viagem dentro do app do usuário. Fale português do Brasil, direto e sem enrolação, como um amigo que entende de viagem. Respostas curtas: 2 a 4 frases, a menos que peçam detalhe.

Você responde SEMPRE com um JSON válido, sem texto fora dele:
{"resposta": "o que você diz ao usuário", "acao": null}

Quando precisar de informação que você não tem certeza ou que muda com o tempo (preço atual, horário de funcionamento, se está aberto, avaliações, disponibilidade), NÃO invente. Peça uma busca:
{"resposta": "", "acao": {"tipo": "buscar_web", "query": "termo de busca"}}

Quando o usuário pedir para registrar algo no roteiro, use uma destas ações (todas as datas em AAAA-MM-DD, sempre dentro do período da viagem):

{"tipo":"adicionar_atracao","data":"AAAA-MM-DD","nome":"","categoria":"museu|gastronomia|balada|compras|natureza|cultura|lazer|outro","horario":"HH:MM ou null","custo_eur":number|null,"precisa_reserva":boolean,"link":"url ou null","notas":"ou null"}
{"tipo":"adicionar_gasto","descricao":"","valor":number,"moeda":"EUR|BRL|GBP|CHF|USD","categoria":"alimentacao|transporte|hospedagem|atracoes|compras|lazer|outro","data":"AAAA-MM-DD"}
{"tipo":"adicionar_pendencia","titulo":"","categoria":"documentacao|atracoes|transporte|hospedagem|outro","urgencia":"alta|media|baixa","prazo":"AAAA-MM-DD ou null","link":"url ou null"}
{"tipo":"adicionar_hospedagem","nome":"","cidade":"","endereco":"ou null","check_in":"AAAA-MM-DDTHH:MM ou null","check_out":"AAAA-MM-DDTHH:MM ou null","valor_noite":number|null,"moeda":"EUR|BRL|GBP","notas":"ou null"}
{"tipo":"adicionar_transporte","meio":"aviao|trem|onibus|carro|barco","operadora":"","cidade_origem":"","cidade_destino":"","saida":"AAAA-MM-DDTHH:MM","chegada":"AAAA-MM-DDTHH:MM ou null","codigo_reserva":"ou null","valor":number|null,"moeda":"EUR|BRL|GBP","notas":"ou null"}

Regras das ações:
- Uma ação por resposta. Se o usuário pedir várias coisas, faça a primeira e diga na resposta que pode fazer as próximas.
- Só use uma ação quando o usuário pedir claramente para registrar/adicionar/salvar. Perguntas são respondidas sem ação.
- Se o usuário mandar um comprovante (PDF ou imagem de reserva), leia os dados e proponha a ação correspondente já preenchida, citando na resposta o que você extraiu.
- Se faltar um dado essencial (a data, por exemplo), pergunte antes em vez de chutar.
- Na "resposta" da ação, diga o que você registrou em uma frase curta. Não repita todos os campos, o app já mostra um card com eles.`

export async function conversar({ contexto, historico, mensagem, anexo }) {
  const system = { role: 'system', content: `${REGRAS}\n\n---\n${montarContexto(contexto)}` }

  const partes = []
  if (mensagem) partes.push({ type: 'text', text: mensagem })
  if (anexo?.tipo === 'imagem') {
    partes.push({ type: 'image_url', image_url: { url: anexo.dataUrl } })
  } else if (anexo?.tipo === 'pdf') {
    partes.push({ type: 'file', file: { filename: anexo.nome || 'documento.pdf', file_data: anexo.dataUrl } })
  }

  const messages = [
    system,
    ...historico.map((m) => ({
      role: m.papel === 'user' ? 'user' : 'assistant',
      content: m.papel === 'user' ? m.conteudo : JSON.stringify({ resposta: m.conteudo, acao: m.acao ?? null }),
    })),
    { role: 'user', content: partes.length > 1 ? partes : mensagem },
  ]

  const buscas = []
  let saida = await chamarModelo(messages)

  for (let i = 0; i < MAX_RODADAS_BUSCA && saida?.acao?.tipo === 'buscar_web'; i++) {
    const query = saida.acao.query
    buscas.push(query)
    const achado = await buscarNaWeb(query)

    const resumo = achado.indisponivel
      ? 'A busca na web não está configurada. Responda com o que você já sabe e avise que o dado pode estar desatualizado.'
      : `Resultados para "${query}":\n${achado.resumo ? `Resumo: ${achado.resumo}\n` : ''}${(achado.resultados || [])
          .map((r) => `- ${r.titulo} (${r.url}): ${r.trecho}`)
          .join('\n')}`

    messages.push({ role: 'assistant', content: JSON.stringify(saida) })
    messages.push({ role: 'user', content: resumo })
    saida = await chamarModelo(messages)
  }

  // Uma busca que não converge em resposta não deve aparecer como bolha vazia.
  if (saida?.acao?.tipo === 'buscar_web') {
    saida = { resposta: saida.resposta || 'Não consegui confirmar isso agora. Quer tentar de novo?', acao: null }
  }

  return { resposta: saida.resposta || '', acao: saida.acao ?? null, buscas }
}

// ---------------------------------------------------------------
// Execução das ações
// ---------------------------------------------------------------

function acharDiaPorData(destinos, data) {
  return destinos.find((d) => d.data === data) || null
}

function acharCidadeId(destinos, nome) {
  if (!nome) return null
  const alvo = nome.trim().toLowerCase()
  const achado = destinos.find((d) => d.cidade?.toLowerCase() === alvo)
  return achado?.cidade_id || null
}

export async function executarAcao(acao, { viagemId, destinos }) {
  const { data: auth } = await supabase.auth.getUser()
  const criadoPor = auth?.user?.id

  if (acao.tipo === 'adicionar_atracao') {
    const dia = acharDiaPorData(destinos, acao.data)
    if (!dia) return { erro: `Não achei o dia ${acao.data} no roteiro.` }

    const { data, error } = await supabase
      .from('atracoes')
      .insert({
        viagem_id: viagemId,
        destino_id: dia.id,
        contexto_tipo: 'dia',
        contexto_id: dia.id,
        nome: acao.nome,
        categoria: acao.categoria || 'outro',
        horario_previsto: acao.horario ? `${acao.horario}:00`.slice(0, 8) : null,
        custo_estimado_eur: acao.custo_eur ?? null,
        precisa_reserva: !!acao.precisa_reserva,
        status_reserva: acao.precisa_reserva ? 'pendente' : 'nao_precisa',
        link: acao.link || null,
        notas: acao.notas || null,
        origem_ideia: 'assistente',
        created_by: criadoPor,
      })
      .select()
      .single()

    if (error) return { erro: error.message }
    emitirSync('atracoes')
    return {
      tabela: 'atracoes',
      id: data.id,
      titulo: `${acao.nome} · ${formatarDia(acao.data)}${acao.horario ? `, ${acao.horario}` : ''}`,
      detalhe: [dia.cidade, acao.categoria, acao.custo_eur ? `€${acao.custo_eur}` : 'grátis', acao.precisa_reserva ? 'precisa reserva' : null]
        .filter(Boolean)
        .join(' · '),
    }
  }

  if (acao.tipo === 'adicionar_gasto') {
    const dia = acharDiaPorData(destinos, acao.data)
    const valorBRL = await converterParaBRL(acao.valor, acao.moeda)

    const { data, error } = await supabase
      .from('gastos')
      .insert({
        viagem_id: viagemId,
        destino_id: dia?.id ?? null,
        descricao: acao.descricao,
        valor: acao.valor,
        moeda: acao.moeda || 'EUR',
        valor_brl: valorBRL,
        categoria: acao.categoria || 'outro',
        data_gasto: acao.data,
        created_by: criadoPor,
      })
      .select()
      .single()

    if (error) return { erro: error.message }
    emitirSync('gastos')
    return {
      tabela: 'gastos',
      id: data.id,
      titulo: `${acao.descricao} · ${acao.moeda} ${acao.valor}`,
      detalhe: [formatarDia(acao.data), acao.categoria].filter(Boolean).join(' · '),
    }
  }

  if (acao.tipo === 'adicionar_pendencia') {
    const { data, error } = await supabase
      .from('pendencias')
      .insert({
        viagem_id: viagemId,
        titulo: acao.titulo,
        categoria: acao.categoria || 'outro',
        urgencia: acao.urgencia || 'media',
        prazo_sugerido: acao.prazo || null,
        link: acao.link || null,
        estado: 'aberta',
      })
      .select()
      .single()

    if (error) return { erro: error.message }
    emitirSync('pendencias')
    return {
      tabela: 'pendencias',
      id: data.id,
      titulo: acao.titulo,
      detalhe: [acao.urgencia, acao.prazo ? `até ${formatarDia(acao.prazo)}` : null].filter(Boolean).join(' · '),
    }
  }

  if (acao.tipo === 'adicionar_hospedagem') {
    const { data, error } = await supabase
      .from('hospedagens')
      .insert({
        viagem_id: viagemId,
        cidade_id: acharCidadeId(destinos, acao.cidade),
        nome: acao.nome,
        tipo: 'hotel',
        status: 'reservada',
        endereco: acao.endereco || null,
        check_in: acao.check_in ? `${acao.check_in}:00+00:00` : null,
        check_out: acao.check_out ? `${acao.check_out}:00+00:00` : null,
        valor_noite: acao.valor_noite ?? null,
        moeda: acao.moeda || 'EUR',
        notas: acao.notas || null,
      })
      .select()
      .single()

    if (error) return { erro: error.message }
    emitirSync('hospedagens')
    return {
      tabela: 'hospedagens',
      id: data.id,
      titulo: acao.nome,
      detalhe: [acao.cidade, acao.check_in ? `${formatarDia(acao.check_in.slice(0, 10))} → ${acao.check_out ? formatarDia(acao.check_out.slice(0, 10)) : '?'}` : null]
        .filter(Boolean)
        .join(' · '),
    }
  }

  if (acao.tipo === 'adicionar_transporte') {
    const diaOrigem = acao.saida ? acharDiaPorData(destinos, acao.saida.slice(0, 10)) : null
    const diaDestino = acao.chegada ? acharDiaPorData(destinos, acao.chegada.slice(0, 10)) : diaOrigem

    const { data, error } = await supabase
      .from('transportes')
      .insert({
        viagem_id: viagemId,
        tipo: acao.meio || 'aviao',
        operadora: acao.operadora || null,
        status: 'confirmado',
        dia_origem_id: diaOrigem?.id ?? null,
        dia_destino_id: diaDestino?.id ?? null,
        destino_origem_id: diaOrigem?.id ?? null,
        destino_destino_id: diaDestino?.id ?? null,
        cidade_origem_id: acharCidadeId(destinos, acao.cidade_origem),
        cidade_destino_id: acharCidadeId(destinos, acao.cidade_destino),
        horario_saida: acao.saida ? `${acao.saida}:00+00:00` : null,
        horario_chegada: acao.chegada ? `${acao.chegada}:00+00:00` : null,
        codigo_reserva: acao.codigo_reserva || null,
        valor: acao.valor ?? null,
        moeda: acao.moeda || 'EUR',
        notas: acao.notas || null,
      })
      .select()
      .single()

    if (error) return { erro: error.message }
    emitirSync('transportes')
    return {
      tabela: 'transportes',
      id: data.id,
      titulo: `${acao.cidade_origem} → ${acao.cidade_destino}`,
      detalhe: [acao.operadora, acao.saida ? `${formatarDia(acao.saida.slice(0, 10))} ${acao.saida.slice(11, 16)}` : null, acao.codigo_reserva]
        .filter(Boolean)
        .join(' · '),
    }
  }

  return { erro: `Ação desconhecida: ${acao.tipo}` }
}

export async function desfazerAcao({ tabela, id }) {
  const { error } = await supabase.from(tabela).delete().eq('id', id)
  if (!error) emitirSync(tabela)
  return { error }
}

function formatarDia(data) {
  if (!data) return ''
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}`
}
