import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import AtracaoForm from './AtracaoForm'
import { interpretarAtracao } from '../../lib/openrouter'
import { supabase } from '../../lib/supabase'
import { ranquearDias } from '../../lib/geo'
import { geocodificar } from '../../lib/maps'

function calcularPrazoReserva(dataVisita, diasAntecedencia) {
  const prazo = new Date(dataVisita + 'T00:00:00')
  prazo.setDate(prazo.getDate() - diasAntecedencia)
  return prazo.toISOString().slice(0, 10)
}

export default function QuickAdd({ aberto, onClose, destinos, atracoes, onAdicionarAtracao, onCriarPendencia }) {
  const [texto, setTexto] = useState('')
  const [analisando, setAnalisando] = useState(false)
  const [sugestao, setSugestao] = useState(null)
  const [erroIA, setErroIA] = useState(null)
  const [diasRanqueados, setDiasRanqueados] = useState([])

  function fecharTudo() {
    setTexto('')
    setSugestao(null)
    setErroIA(null)
    setDiasRanqueados([])
    onClose()
  }

  async function handleAnalisar() {
    if (!texto.trim()) return
    setAnalisando(true)
    setErroIA(null)

    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('A IA demorou demais para responder (20s).')), 20000))

    try {
      const resultado = await Promise.race([interpretarAtracao(texto, destinos), timeoutPromise])

      const candidatosCidade = destinos.filter(
        (d) => d.cidade.toLowerCase() === (resultado.cidade_provavel ?? '').toLowerCase(),
      )

      const baseDias = candidatosCidade.length > 0 ? candidatosCidade : destinos

      const { data: base } = await supabase
        .from('base_atracoes')
        .select('*')
        .ilike('nome', `%${resultado.nome}%`)
        .maybeSingle()

      let sugestaoCompleta = { ...resultado, ...(base ?? {}) }

      if (!sugestaoCompleta.latitude) {
        const cidadeParaBusca = sugestaoCompleta.cidade_provavel ?? sugestaoCompleta.cidade ?? ''
        const localBusca = sugestaoCompleta.local_busca ?? sugestaoCompleta.nome
        const geocodificado = await geocodificar(`${localBusca}, ${cidadeParaBusca}`)
        if (geocodificado) {
          sugestaoCompleta = {
            ...sugestaoCompleta,
            latitude: geocodificado.latitude,
            longitude: geocodificado.longitude,
            enderecoFormatado: geocodificado.enderecoFormatado,
          }
        }
      }

      setSugestao(sugestaoCompleta)
      setDiasRanqueados(ranquearDias(baseDias, atracoes, sugestaoCompleta.latitude, sugestaoCompleta.longitude))
    } catch (erro) {
      setErroIA(erro.message ?? 'Erro desconhecido')
    } finally {
      setAnalisando(false)
    }
  }

  async function handleSalvarSugestao(dados) {
    const { data: atracaoCriada } = await onAdicionarAtracao(dados)

    if (dados.precisa_reserva && atracaoCriada) {
      const destino = destinos.find((d) => d.id === dados.destino_id)
      const diasAntecedencia = sugestao?.dias_antecedencia ?? 14
      const prazo = destino ? calcularPrazoReserva(destino.data, diasAntecedencia) : null

      await onCriarPendencia({
        titulo: `Reservar ${dados.nome}`,
        categoria: 'atracoes',
        prazo_sugerido: prazo,
        link: dados.link_reserva,
        urgencia: prazo && prazo < new Date().toISOString().slice(0, 10) ? 'alta' : 'media',
        atracao_id: atracaoCriada.id,
      })
    }

    fecharTudo()
  }

  return (
    <Modal aberto={aberto} onClose={fecharTudo} titulo="Adicionar com IA">
      {!sugestao && !erroIA && (
        <div className="space-y-3">
          <textarea
            autoFocus
            placeholder='Ex: "quero visitar o Coliseu" ou "pizza em Nápoles"'
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={2}
            className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] placeholder:text-muted"
          />
          <Button className="w-full" onClick={handleAnalisar} disabled={analisando}>
            {analisando ? 'Analisando...' : 'Analisar com IA'}
          </Button>
        </div>
      )}

      {erroIA && (
        <div className="space-y-3">
          <p className="text-[13px] text-red bg-red/10 rounded-ios px-3 py-2">⚠️ {erroIA}</p>
          <p className="text-sm text-muted">Preencha manualmente:</p>
          <AtracaoForm
            diasRanqueados={ranquearDias(destinos, atracoes, null, null)}
            valoresIniciais={{ nome: texto, origem_ideia: 'manual_fallback' }}
            onSalvar={handleSalvarSugestao}
            onCancelar={fecharTudo}
          />
        </div>
      )}

      {sugestao && (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            Identificado: <strong>{sugestao.nome}</strong> em {sugestao.cidade_provavel ?? sugestao.cidade}
            {sugestao.dica && <span className="block mt-1 text-xs">💡 {sugestao.dica}</span>}
            {sugestao.enderecoFormatado && (
              <span className="block mt-1 text-xs">📍 Local no mapa: {sugestao.enderecoFormatado}</span>
            )}
            {!sugestao.latitude && <span className="block mt-1 text-xs text-orange">⚠️ Não consegui localizar no mapa.</span>}
          </p>
          <AtracaoForm
            diasRanqueados={diasRanqueados.length > 0 ? diasRanqueados : ranquearDias(destinos, atracoes, null, null)}
            valoresIniciais={{
              nome: sugestao.nome,
              categoria: sugestao.categoria ?? 'outro',
              precisa_reserva: sugestao.precisa_reserva ?? false,
              ocupa_dia_inteiro: sugestao.ocupa_dia_inteiro ?? false,
              custo_estimado_eur: sugestao.custo_estimado_eur ?? sugestao.custo_estimado_eur,
              latitude: sugestao.latitude,
              longitude: sugestao.longitude,
              link_reserva_oficial: sugestao.link_reserva_oficial,
              dias_antecedencia: sugestao.dias_antecedencia,
              origem_ideia: 'ia',
            }}
            onSalvar={handleSalvarSugestao}
            onCancelar={fecharTudo}
          />
        </div>
      )}
    </Modal>
  )
}
