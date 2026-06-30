import { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useViagem } from '../../hooks/useViagem'
import { useDestinos } from '../../hooks/useDestinos'
import { useAtracoes } from '../../hooks/useAtracoes'
import { useAcomodacoes } from '../../hooks/useAcomodacoes'
import { useGastos } from '../../hooks/useGastos'
import { usePendencias } from '../../hooks/usePendencias'
import { useToast } from '../../contexts/ToastContext'
import PendenciaAdder from '../pendencias/PendenciaAdder'
import PendenciaEditor from '../pendencias/PendenciaEditor'
import TransportEditor, { MAPA_TIPO_TRANSPORTE } from '../roteiro/TransportEditor'
import { formatarBRL } from '../../lib/cambio'
import { supabase } from '../../lib/supabase'
import { inicializarMapaGeral } from '../../lib/maps'
import AdicionarModal from '../ui/AdicionarModal'
import Card from '../ui/Card'
import PullToRefresh from '../ui/PullToRefresh'
import { Plus, Map, ChevronRight, Dot } from 'lucide-react'
import TransporteIcon from '../ui/TransporteIcon'
import { Skeleton, SkeletonCard } from '../ui/Skeleton'

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function ViagemView() {
  const navigate = useNavigate()
  const { viagemId } = useViagem()
  const { destinos, loading: loadingDestinos, adicionarDestino, recarregar: recarregarDestinos, removerTransporte } = useDestinos()
  const { atracoes, loading: loadingAtracoes, recarregar: recarregarAtracoes } = useAtracoes(viagemId)
  const { acomodacoes } = useAcomodacoes()
  const { gastos } = useGastos(viagemId)
  const { pendencias, criarPendencia, atualizarPendencia, removerPendencia } = usePendencias(viagemId)
  const addToast = useToast()

  const [modalAdicionarAberto, setModalAdicionarAberto] = useState(false)
  const [mapaGeralAberto, setMapaGeralAberto] = useState(false)
  const [transportePendenciaCidade, setTransportePendenciaCidade] = useState(null)
  const [transporteEditando, setTransporteEditando] = useState(null)
  const [pendenciaEditando, setPendenciaEditando] = useState(null)
  const mapaGeralRef = useRef(null)
  const mapaGeralInstance = useRef(null)

  const recarregar = useMemo(() => async () => {
    await Promise.all([recarregarDestinos(), recarregarAtracoes()])
  }, [recarregarDestinos, recarregarAtracoes])

  async function handleSalvarTransporte(dados) {
    const { error } = await supabase.from('transportes').insert(dados)
    if (!error) {
      await recarregarDestinos()
      setTransporteEditando(null)
      addToast('Transporte adicionado')
    }
    return { error }
  }

  async function handleExcluirTransporte(id) {
    const { error } = await removerTransporte(id)
    if (!error) {
      setTransporteEditando(null)
      addToast('Transporte excluído', 'info')
    }
    return { error }
  }

  const cidadesAgrupadas = useMemo(() => {
    const grupos = []
    let grupoAtual = null
    destinos.forEach((d, i) => {
      if (!grupoAtual || grupoAtual.cidade !== d.cidade) {
        const anterior = destinos[i - 1]
        let transportes = []
        if (anterior && anterior.cidade !== d.cidade) {
          transportes = anterior.transportes ?? []
        }
        grupoAtual = {
          cidade: d.cidade, pais: d.pais, flag_emoji: d.flag_emoji,
          destinos: [], transportesChegada: transportes,
        }
        grupos.push(grupoAtual)
      }
      grupoAtual.destinos.push(d)
    })
    return grupos
  }, [destinos])

  const totalAtracoes = atracoes.length
  const hojeISO = new Date().toISOString().slice(0, 10)
  const diasPassados = destinos.filter((d) => d.data < hojeISO).length

  function abrirMapaGeral() {
    setMapaGeralAberto(true)
    setTimeout(async () => {
      if (mapaGeralRef.current && !mapaGeralInstance.current) {
        mapaGeralInstance.current = await inicializarMapaGeral(destinos, atracoes, mapaGeralRef.current)
      }
    }, 300)
  }

  const loading = loadingDestinos || loadingAtracoes

  if (loading) return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-28" /><Skeleton className="w-11 h-11 rounded-full" />
      </div>
      <Skeleton className="h-4 w-56" />
      <div className="h-[6px] bg-fill rounded-full overflow-hidden"><Skeleton className="h-full w-1/3 rounded-full" /></div>
      {[1, 2, 3].map((i) => (
        <SkeletonCard key={i}>
          <div className="flex items-center gap-3 py-3.5 px-4">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-1.5"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-1/3" /></div>
          </div>
        </SkeletonCard>
      ))}
    </div>
  )

  return (
    <PullToRefresh onRefresh={recarregar}>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-[34px] font-bold tracking-tight">Viagem</h1>
            <p className="text-muted text-[15px] mt-0.5">
              {cidadesAgrupadas.length} cidades · {destinos.length} dias · {totalAtracoes} atrações
            </p>
          </div>
          <button onClick={() => setModalAdicionarAberto(true)} aria-label="Adicionar" className="tap-scale w-11 h-11 rounded-full bg-blue text-white flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </button>
        </div>

<div className="h-[6px] bg-border rounded-full overflow-hidden">
          <div className="h-full bg-blue rounded-full transition-all duration-500 ease-ios" style={{ width: `${(diasPassados / destinos.length) * 100}%` }} />
        </div>

        <div className="relative">
          <div className="absolute left-[23px] top-0 bottom-0 w-px bg-separator" />

          {cidadesAgrupadas.map((grupo, gi) => {
            const dias = grupo.destinos.sort((a, b) => a.data.localeCompare(b.data))
            const primeiraData = new Date(dias[0].data + 'T00:00:00')
            const ultimaData = new Date(dias[dias.length - 1].data + 'T00:00:00')
            const rangeLabel =
              primeiraData.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) +
              ' – ' + ultimaData.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

            const idsDias = new Set(dias.map((d) => d.id))
            const atracoesDaCidade = atracoes.filter((a) => idsDias.has(a.destino_id))
            const acomodacao = acomodacoes.find((a) => a.cidade === grupo.cidade)
            const gastosDaCidade = gastos.filter((g) => dias.some((d) => d.id === g.destino_id))
            const totalGasto = gastosDaCidade.reduce((s, g) => s + (g.valor_brl ?? 0), 0)
            const pendenciasDaCidade = pendencias.filter((p) => {
              if (p.atracao_id) {
                const atr = atracoes.find((a) => a.id === p.atracao_id)
                return atr && idsDias.has(atr.destino_id)
              }
              return false
            })

            return (
              <div key={grupo.cidade}>
                {gi > 0 && (
                  <div className="flex items-start gap-3 py-2 pl-3">
                    <div className="relative z-10 w-11 h-11 rounded-full bg-fill border-2 border-card flex items-center justify-center flex-shrink-0">
                      {grupo.transportesChegada.length > 0 ? (
                        <TransporteIcon tipo={grupo.transportesChegada[0].tipo} />
                      ) : (
                        <Dot className="w-5 h-5 text-muted" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pt-2">
                      {(() => {
                        const cidadeAnterior = cidadesAgrupadas[gi - 1]?.cidade || ''
                        const transpDados = grupo.transportesChegada[0]
                        const pendsTransporte = pendencias.filter((p) =>
                          p.categoria === 'transporte' && !p.concluida && (
                            p.contexto_tipo === 'viagem' ||
                            (p.contexto_tipo === 'cidade' && p.contexto_id === grupo.cidade) ||
                            idsDias.has(p.contexto_id)
                          )
                        )

                        return (
                          <div className="space-y-1.5">
                            {transpDados && (
                              <button
                                onClick={() => {
                                  const grupoAnt = cidadesAgrupadas[gi - 1]
                                  const ultimoDiaAnt = grupoAnt?.destinos?.[grupoAnt.destinos.length - 1]
                                  const primeiroDiaAtual = grupo.destinos?.[0]
                                  setTransporteEditando({
                                    ...transpDados,
                                    cidadeOrigem: cidadeAnterior,
                                    cidadeDestino: grupo.cidade,
                                    destinoOrigemId: ultimoDiaAnt?.id,
                                    destinoDestinoId: primeiroDiaAtual?.id,
                                  })
                                }}
                                className="tap-scale text-[13px] text-muted text-left w-full"
                              >
                                {transpDados.operadora ? `${transpDados.operadora} · ` : ''}
                                <span>{MAPA_TIPO_TRANSPORTE[transpDados.tipo] || transpDados.tipo}</span>
                                {transpDados.custo_estimado_brl ? ` · R$ ${formatarBRL(transpDados.custo_estimado_brl)}` : ''}
                              </button>
                            )}
                            {pendsTransporte.map((p) => (
                              <button
                                key={p.id}
                                onClick={() => setPendenciaEditando(p)}
                                className="tap-scale flex items-center gap-1.5 text-[13px] text-muted text-left w-full"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-orange shrink-0" />
                                <span className="truncate">{p.titulo}</span>
                              </button>
                            ))}
                            {!transpDados && (
                              <button
                                onClick={() => {
                                  const grupoAnt = cidadesAgrupadas[gi - 1]
                                  const ultimoDiaAnt = grupoAnt?.destinos?.[grupoAnt.destinos.length - 1]
                                  const primeiroDiaAtual = grupo.destinos?.[0]
                                  setTransporteEditando({
                                    cidadeOrigem: cidadeAnterior,
                                    cidadeDestino: grupo.cidade,
                                    destinoOrigemId: ultimoDiaAnt?.id,
                                    destinoDestinoId: primeiroDiaAtual?.id,
                                  })
                                }}
                                className="tap-scale flex items-center gap-1.5 text-[13px] text-blue font-semibold"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Definir transporte</span>
                              </button>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => navigate(`/viagem/cidade/${encodeURIComponent(grupo.cidade)}`)}
                  className="tap-scale w-full text-left"
                >
                  <Card>
                    <div className="flex items-center gap-3 py-3 px-4 border-b border-separator">
                      <div className="relative z-10 w-11 h-11 rounded-full bg-blue/10 flex items-center justify-center flex-shrink-0 text-xl">
                        {grupo.flag_emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[17px]">{grupo.cidade}</p>
                        <p className="text-[13px] text-muted">{grupo.pais} · {rangeLabel}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted flex-shrink-0" />
                    </div>
                    <div className="flex gap-3 px-4 py-3">
                      <div className="flex-1 text-center">
                        <p className="text-[16px] font-bold tabular-nums">{dias.length}</p>
                        <p className="text-[10px] text-muted">dias</p>
                      </div>
                      <div className="flex-1 text-center">
                        <p className="text-[16px] font-bold tabular-nums">{atracoesDaCidade.length}</p>
                        <p className="text-[10px] text-muted">atrações</p>
                      </div>
                      <div className="flex-1 text-center">
                        <p className="text-[16px] font-bold tabular-nums">{acomodacao ? '✓' : '—'}</p>
                        <p className="text-[10px] text-muted">hospedagem</p>
                      </div>
                      <div className="flex-1 text-center">
                        <p className="text-[16px] font-bold tabular-nums text-green">R$ {formatarBRL(totalGasto)}</p>
                        <p className="text-[10px] text-muted">gastos</p>
                      </div>
                      <div className="flex-1 text-center">
                        <p className="text-[16px] font-bold tabular-nums text-orange">{pendenciasDaCidade.length}</p>
                        <p className="text-[10px] text-muted">pendências</p>
                      </div>
                    </div>
                  </Card>
                </button>
              </div>
            )
          })}
        </div>

        <button onClick={abrirMapaGeral} className="tap-scale w-full flex items-center gap-3 py-3.5 px-4 rounded-2xl bg-fill text-left">
          <div className="w-10 h-10 rounded-full bg-green/10 flex items-center justify-center flex-shrink-0"><Map className="w-5 h-5 text-green" /></div>
          <div className="flex-1"><p className="font-semibold text-[16px]">Mapa geral</p><p className="text-[13px] text-muted">{cidadesAgrupadas.length} cidades · {destinos.length} dias</p></div>
          <ChevronRight className="w-5 h-5 text-muted flex-shrink-0" />
        </button>

        {mapaGeralAberto && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" onClick={() => { setMapaGeralAberto(false); mapaGeralInstance.current = null }}>
            <div className="bg-card w-full sm:max-w-2xl h-[70vh] sm:h-[80vh] rounded-t-2xl sm:rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <h2 className="font-display text-xl font-bold">Mapa geral</h2>
                <button onClick={() => { setMapaGeralAberto(false); mapaGeralInstance.current = null }} className="tap-scale w-11 h-11 rounded-full bg-fill flex items-center justify-center text-muted text-xl leading-none">✕</button>
              </div>
              <div ref={mapaGeralRef} className="w-full h-[calc(100%-52px)]" />
            </div>
          </div>
        )}

        <AdicionarModal
          aberto={modalAdicionarAberto}
          onClose={() => setModalAdicionarAberto(false)}
          destinos={destinos}
          cidades={(() => {
            const mapa = {}
            for (const d of destinos) {
              if (d.cidade && !mapa[d.cidade]) mapa[d.cidade] = { nome: d.cidade, pais: d.pais, flag: d.flag_emoji || '' }
            }
            return Object.values(mapa)
          })()}
          onSalvarDia={adicionarDestino}
          onSalvarTransporte={handleSalvarTransporte}
          onSalvarGasto={async (gasto) => {
            const { converterParaBRL } = await import('../../lib/cambio')
            const { valorBRL, cotacaoUsada } = await converterParaBRL(gasto.valor, gasto.moeda)
            const { error } = await supabase.from('gastos').insert({ ...gasto, valor_brl: valorBRL, cotacao_usada: cotacaoUsada })
            if (!error) addToast('Gasto adicionado')
          }}
          onSalvarPendencia={criarPendencia}
          onSalvarHospedagem={async (dados) => {
            const { error } = await supabase.from('acomodacoes').upsert(dados, { onConflict: 'cidade' })
            if (!error) addToast('Hospedagem adicionada')
          }}
        />

        {transportePendenciaCidade && (() => {
          const grupoDestino = cidadesAgrupadas.find((g) => g.cidade === transportePendenciaCidade)
          const transp = grupoDestino?.transportesChegada?.[0]
          const cidadeAnterior = cidadesAgrupadas[cidadesAgrupadas.findIndex((g) => g.cidade === transportePendenciaCidade) - 1]?.cidade || ''
          const tituloSugerido = transp
            ? `Comprar ${transp.operadora || transp.tipo} ${cidadeAnterior} → ${transportePendenciaCidade}`
            : `Definir transporte ${cidadeAnterior} → ${transportePendenciaCidade}`

          return (
            <PendenciaAdder
              aberto={!!transportePendenciaCidade}
              onClose={() => setTransportePendenciaCidade(null)}
              onSalvar={async (dados) => {
                return await criarPendencia({ ...dados, categoria: 'transporte' })
              }}
              contextoPadrao={{
                tipo: 'cidade',
                id: transportePendenciaCidade,
                cidades: (() => {
                  const mapa = {}
                  for (const d of destinos) {
                    if (d.cidade && !mapa[d.cidade]) mapa[d.cidade] = { nome: d.cidade, flag: d.flag_emoji || '' }
                  }
                  return Object.values(mapa)
                })(),
              }}
              valoresPadrao={{
                titulo: tituloSugerido,
                categoria: 'transporte',
                link: transp?.link || '',
              }}
            />
          )
        })()}

        {pendenciaEditando && (
          <PendenciaEditor
            aberto={!!pendenciaEditando}
            onClose={() => setPendenciaEditando(null)}
            pendencia={pendenciaEditando}
            onSalvar={atualizarPendencia}
            onExcluir={removerPendencia}
            cidades={(() => {
              const mapa = {}
              for (const d of destinos) {
                if (d.cidade && !mapa[d.cidade]) mapa[d.cidade] = { nome: d.cidade, flag: d.flag_emoji || '' }
              }
              return Object.values(mapa)
            })()}
            dias={destinos.sort((a, b) => a.data.localeCompare(b.data)).map((d) => {
              const data = new Date(d.data + 'T00:00:00')
              return { id: d.id, label: `${data.getDate()}/${data.getMonth() + 1}`, cidade: d.cidade, flag: d.flag_emoji }
            })}
          />
        )}

        {transporteEditando && (
          <TransportEditor
            aberto={!!transporteEditando}
            onClose={() => setTransporteEditando(null)}
            cidadeOrigem={transporteEditando.cidadeOrigem}
            cidadeDestino={transporteEditando.cidadeDestino}
            destinoOrigemId={transporteEditando.destinoOrigemId}
            destinoDestinoId={transporteEditando.destinoDestinoId}
            transporteExistente={transporteEditando.id ? transporteEditando : null}
            onSalvar={handleSalvarTransporte}
            onExcluir={handleExcluirTransporte}
          />
        )}
      </div>
    </PullToRefresh>
  )
}
