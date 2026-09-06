import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { conversar, executarAcao, desfazerAcao } from '../lib/assistente'

export function useAssistente({ viagemId, contexto }) {
  const [mensagens, setMensagens] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [pensando, setPensando] = useState(false)
  const [buscando, setBuscando] = useState(null)

  const carregar = useCallback(async () => {
    if (!viagemId) return
    const { data } = await supabase
      .from('assistente_mensagens')
      .select('*')
      .eq('viagem_id', viagemId)
      .order('criado_em', { ascending: true })
    setMensagens(data || [])
    setCarregando(false)
  }, [viagemId])

  useEffect(() => { carregar() }, [carregar])

  const enviar = useCallback(async (texto, anexo) => {
    if (!viagemId || (!texto?.trim() && !anexo)) return

    const rascunhoUsuario = {
      id: `tmp-${Date.now()}`,
      papel: 'user',
      conteudo: texto || (anexo?.tipo === 'pdf' ? `📎 ${anexo.nome}` : '📎 Imagem'),
      anexo_tipo: anexo?.tipo || null,
      criado_em: new Date().toISOString(),
    }
    setMensagens((atual) => [...atual, rascunhoUsuario])
    setPensando(true)

    try {
      const historico = mensagens.slice(-12).map((m) => ({
        papel: m.papel,
        conteudo: m.conteudo,
        acao: m.acao,
      }))

      const { resposta, acao, buscas } = await conversar({
        contexto,
        historico,
        mensagem: texto,
        anexo,
      })
      if (buscas.length) setBuscando(null)

      let acaoSalva = null
      if (acao) {
        const resultado = await executarAcao(acao, { viagemId, destinos: contexto.destinos })
        acaoSalva = resultado.erro ? { erro: resultado.erro, tipo: acao.tipo } : { ...resultado, tipo: acao.tipo }
      }

      const textoFinal = acaoSalva?.erro
        ? `${resposta}\n\n(Não consegui salvar: ${acaoSalva.erro})`
        : resposta

      await supabase.from('assistente_mensagens').insert([
        { viagem_id: viagemId, papel: 'user', conteudo: rascunhoUsuario.conteudo, anexo_tipo: anexo?.tipo || null },
        { viagem_id: viagemId, papel: 'assistente', conteudo: textoFinal, acao: acaoSalva },
      ])

      await carregar()
    } catch (erro) {
      setMensagens((atual) => [
        ...atual,
        {
          id: `err-${Date.now()}`,
          papel: 'assistente',
          conteudo: erro.message || 'Deu erro aqui. Tenta de novo?',
          criado_em: new Date().toISOString(),
        },
      ])
    } finally {
      setPensando(false)
      setBuscando(null)
    }
  }, [viagemId, contexto, mensagens, carregar])

  const desfazer = useCallback(async (mensagem) => {
    const acao = mensagem.acao
    if (!acao?.tabela || !acao?.id) return
    await desfazerAcao(acao)
    await supabase
      .from('assistente_mensagens')
      .update({ acao: { ...acao, desfeita: true } })
      .eq('id', mensagem.id)
    await carregar()
  }, [carregar])

  const limpar = useCallback(async () => {
    if (!viagemId) return
    await supabase.from('assistente_mensagens').delete().eq('viagem_id', viagemId)
    await carregar()
  }, [viagemId, carregar])

  return { mensagens, carregando, pensando, buscando, enviar, desfazer, limpar }
}
