import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useViagem } from '../../hooks/useViagem'
import { useDias } from '../../hooks/useDias'
import { useAtracoes } from '../../hooks/useAtracoes'
import { useHospedagens } from '../../hooks/useHospedagens'
import { useGastos } from '../../hooks/useGastos'
import { usePendencias } from '../../hooks/usePendencias'
import { useDocumentos } from '../../hooks/useDocumentos'
import { useAuthContext } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { otimizarRota, gerarHorarios, formatarDistancia, estimarTempoCaminhada, distanciaKm } from '../../lib/geo'
import { converterParaBRL, formatarBRL } from '../../lib/cambio'
import AtracaoCard from '../atracoes/AtracaoCard'
import AtracaoEditor from '../atracoes/AtracaoEditor'
import PreencherDia from '../atracoes/PreencherDia'
import QuickAdd from '../atracoes/QuickAdd'
import MapaDoDia from '../atracoes/MapaDoDia'
import PendenciaItem from '../pendencias/PendenciaItem'
import PendenciaEditor from '../pendencias/PendenciaEditor'
import GastoForm from '../financas/GastoForm'
import Card from '../ui/Card'
import PullToRefresh from '../ui/PullToRefresh'
import { StaggerContainer, StaggerItem } from '../ui/Stagger'
import AcomodacaoEditor from '../roteiro/AcomodacaoEditor'
import {
  Plus, Map, Route, Sparkles, Footprints,
  Bed, FileText, ChevronRight, ChevronDown, BarChart3, ArrowLeft,
} from 'lucide-react'
import TransporteIcon from '../ui/TransporteIcon'
import { Skeleton, SkeletonCard } from '../ui/Skeleton'
import { MAPA_TIPO_TRANSPORTE } from '../roteiro/TransportEditor'

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function ConexaoAtracoes({ origem, destino }) {
  if (!origem.latitude || !origem.longitude || !destino.latitude || !destino.longitude) return null
  const km = distanciaKm(origem.latitude, origem.longitude, destino.latitude, destino.longitude)
  const tempo = estimarTempoCaminhada(km)
  const distStr = formatarDistancia(km)
  return (
    <div className="flex items-center gap-3 px-4 py-1">
      <div className="flex flex-col items-center w-8 flex-shrink-0">
        <div className="w-px h-2 bg-border border-l border-dashed border-border/50" />
        <div className="w-4 h-4 rounded-full bg-fill border border-border flex items-center justify-center">
          <Footprints className="w-2 h-2 text-muted" />
        </div>
        <div className="w-px h-2 bg-border border-l border-dashed border-border/50" />
      </div>
      <span className="text-[11px] text-muted2 tabular-nums">{tempo} · {distStr}</span>
    </div>
  )
}

function categoriasGastos(gastos) {
  const mapa = {}
  for (const g of gastos) {
    const cat = g.categoria || 'outros'
    if (!mapa[cat]) mapa[cat] = 0
    mapa[cat] += g.valor_brl ?? 0
  }
  return Object.entries(mapa).sort((a, b) => b[1] - a[1])
}

const CATEGORIA_CORES = {
  alimentacao: '#22c55e', transporte: '#3b82f6', hospedagem: '#f59e0b',
  entrada: '#8b5cf6', compras: '#ec4899', outros: '#6b7280',
}

export default function DayDetailView({ destinoId, semPullToRefresh = false, stickyTop = 'top-0', showHeader = false }) {
  const { usuario } = useAuthContext()
  const addToast = useToast()
  const navigate = useNavigate()
  const { viagemId } = useViagem()
  const { dias, loading: loadingDias } = useDias(viagemId)
  const { atracoes, loading: loadingAtracoes, adicionarAtracao, atualizarAtracao, removerAtracao, recarregar: recarregarAtracoes } = useAtracoes(viagemId)
  const { hospedagens, salvar, remover } = useHospedagens(viagemId)
  const { gastos, adicionarGasto } = useGastos(viagemId)
  const { pendencias, criarPendencia, alterarEstado, atualizarPendencia, removerPendencia } = usePendencias(viagemId)
  const { documentos } = useDocumentos(viagemId)

  const [quickAddAberto, setQuickAddAberto] = useState(false)
  const [preencherDiaAberto, setPreencherDiaAberto] = useState(false)
  const [atracaoEditando, setAtracaoEditando] = useState(null)
  const [gastoEditando, setGastoEditando] = useState(null)
  const [pendenciaEditando, setPendenciaEditando] = useState(null)
  const [acomodacaoEditando, setAcomodacaoEditando] = useState(false)
  const [mapExpandido, setMapExpandido] = useState(false)
  const [financasExpandido, setFinancasExpandido] = useState(true)
  const [totalEstimadoBRL, setTotalEstimadoBRL] = useState(null)

  const destino = dias.find((d) => d.id === destinoId)
  const cidade = destino?.cidade ?? ''

  const diasDaCidade = useMemo(() =>
    dias.filter((d) => d.cidade === cidade).sort((a, b) => a.data.localeCompare(b.data)),
    [dias, cidade],
  )
  const [diaIndex, setDiaIndex] = useState(() =>
    Math.max(0, diasDaCidade.findIndex((d) => d.id === destinoId)),
  )

  useEffect(() => {
    const novoIndex = Math.max(0, diasDaCidade.findIndex((d) => d.id === destinoId))
    setDiaIndex(novoIndex)
  }, [destinoId, diasDaCidade])

  const currentDestino = diasDaCidade[diaIndex]
  const dataObj = currentDestino ? new Date(currentDestino.data + 'T00:00:00') : null
  const diaSemana = dataObj?.toLocaleDateString('pt-BR', { weekday: 'long' }) ?? ''
  const dataFormatada = dataObj ? `${dataObj.getDate()}/${dataObj.getMonth() + 1}` : ''

  const atracoesDoDia = useMemo(() =>
    atracoes
      .filter((a) => a.destino_id === currentDestino?.id)
      .sort((a, b) => (a.horario_previsto ?? '99:99').localeCompare(b.horario_previsto ?? '99:99')),
    [atracoes, currentDestino],
  )
  const temCoordenadas = atracoesDoDia.some((a) => a.latitude && a.longitude)
  const acomodacao = hospedagens.find((a) => a.cidade === cidade && a.latitude && a.longitude)

  const cidadesLista = useMemo(() => {
    const vistas = new Set()
    return dias.filter((d) => {
      if (vistas.has(d.cidade)) return false
      vistas.add(d.cidade)
      return true
    }).map((d) => ({ nome: d.cidade, pais: d.pais, flag: d.flag_emoji }))
  }, [dias])

  const gastosDoDia = gastos.filter((g) => g.destino_id === currentDestino?.id)
  const totalGasto = gastosDoDia.reduce((s, g) => s + (g.valor_brl ?? 0), 0)
  const gastosPorCat = categoriasGastos(gastosDoDia)

  const totalEstimadoEUR = useMemo(() =>
    atracoesDoDia.reduce((s, a) => s + (a.valor || 0), 0),
    [atracoesDoDia],
  )

  useEffect(() => {
    if (totalEstimadoEUR > 0) {
      converterParaBRL(totalEstimadoEUR, 'EUR').then((r) => setTotalEstimadoBRL(r.valorBRL)).catch(() => setTotalEstimadoBRL(null))
    } else {
      setTotalEstimadoBRL(null)
    }
  }, [totalEstimadoEUR])

  const pendenciasDoDia = useMemo(() => {
    return pendencias.filter((p) => {
      if (p.contexto_tipo === 'viagem') return true
      if (p.contexto_tipo === 'cidade' && p.contexto_id === cidade) return true
      if (p.contexto_tipo === 'dia' && p.contexto_id === currentDestino?.id) return true
      if (p.contexto_tipo === 'atracao') {
        const atr = atracoes.find((a) => a.id === p.contexto_id)
        return atr && atr.destino_id === currentDestino?.id
      }
      if (p.contexto_tipo === 'hospedagem') {
        const acom = hospedagens.find((a) => a.id === p.contexto_id)
        return acom && acom.cidade === cidade
      }
      if (!p.contexto_tipo && p.atracao_id) {
        const atr = atracoes.find((a) => a.id === p.atracao_id)
        return atr && atr.destino_id === currentDestino?.id
      }
      return false
    })
  }, [pendencias, atracoes, hospedagens, cidade, currentDestino])

  const docsDoDia = useMemo(() => {
    return documentos.filter((d) => {
      if (d.contexto_tipo === 'viagem') return true
      if (d.contexto_tipo === 'cidade' && d.contexto_id === cidade) return true
      if (d.contexto_tipo === 'dia' && d.contexto_id === currentDestino?.id) return true
      if (d.contexto_tipo === 'atracao') {
        const atr = atracoes.find((a) => a.id === d.contexto_id)
        return atr && atr.destino_id === currentDestino?.id
      }
      if (d.contexto_tipo === 'hospedagem') {
        const acom = hospedagens.find((a) => a.id === d.contexto_id)
        return acom && acom.cidade === cidade
      }
      if (!d.contexto_tipo && (d.destino_id === currentDestino?.id || d.cidade === cidade)) return true
      return false
    })
  }, [documentos, atracoes, hospedagens, cidade, currentDestino])

  const transportes = currentDestino?.transportes ?? []
  const haTransporte = transportes.length > 0

  const rotaTotalKm = useMemo(() => {
    if (atracoesDoDia.length < 2) return 0
    const comCoord = atracoesDoDia.filter((a) => a.latitude && a.longitude)
    if (comCoord.length < 2) return 0
    let total = 0
    for (let i = 1; i < comCoord.length; i++) {
      total += distanciaKm(comCoord[i - 1].latitude, comCoord[i - 1].longitude, comCoord[i].latitude, comCoord[i].longitude)
    }
    return total
  }, [atracoesDoDia])

  function goToDia(i) {
    if (i < 0 || i >= diasDaCidade.length) return
    setDiaIndex(i)
  }

  const recarregar = useCallback(async () => {
    await recarregarAtracoes()
  }, [recarregarAtracoes])

  async function handleAdicionarAtracao(dados) {
    const resultado = await adicionarAtracao({ ...dados, created_by: usuario.id })
    await recarregarAtracoes()
    addToast('Atração adicionada')
    return resultado
  }

  async function handleOtimizarDia() {
    if (!acomodacao) {
      addToast('Adicione uma acomodação com endereço para otimizar a rota', 'info')
      return
    }
    const comCoords = atracoesDoDia.filter((a) => a.latitude)
    if (comCoords.length < 2) {
      addToast('São necessárias pelo menos 2 atrações com coordenadas', 'info')
      return
    }
    const pontoPartida = { lat: acomodacao.latitude, lng: acomodacao.longitude }
    const ordenadas = otimizarRota(atracoesDoDia, pontoPartida)
    const horarios = gerarHorarios(ordenadas.length)
    await Promise.all(
      ordenadas.map((a, i) => atualizarAtracao(a.id, { ordem_no_dia: i, horario_previsto: horarios[i] })),
    )
    await recarregarAtracoes()
    addToast('Rota otimizada!')
  }

  async function handleAdicionarGasto(gasto) {
    const { valorBRL, cotacaoUsada } = await converterParaBRL(gasto.valor, gasto.moeda)
    await adicionarGasto({ ...gasto, valor_brl: valorBRL, cotacao_usada: cotacaoUsada, created_by: usuario?.id })
    setGastoEditando(null)
    addToast('Gasto adicionado')
  }

  const loading = loadingDias || loadingAtracoes

  const conteudo = (
    <>
      {loading && (
        <div className="space-y-2 mt-3">{[1, 2, 3].map((i) => <SkeletonCard key={i} />)}</div>
      )}

      {!loading && !currentDestino && (
        <p className="text-muted text-center py-10">Dia não encontrado.</p>
      )}

      {!loading && currentDestino && (
        <div className="pb-6">
          {showHeader && (
            <div className="flex items-center gap-3 mb-4 px-1 pt-2">
              <button onClick={() => navigate(-1)} aria-label="Voltar" className="tap-scale w-11 h-11 rounded-full bg-fill flex items-center justify-center flex-shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-display text-[24px] font-bold tracking-tight truncate">{destino?.flag_emoji} {cidade}</p>
              </div>
            </div>
          )}
          <div className={`flex gap-1.5 -mx-4 px-4 py-3 overflow-x-auto scrollbar-none bg-card border-y border-separator sticky ${stickyTop} z-10`}>
              {diasDaCidade.map((d, i) => {
                const dObj = new Date(d.data + 'T00:00:00')
                const ativo = i === diaIndex
                const passado = d.data < new Date().toISOString().slice(0, 10)
                return (
                  <button
                    key={d.id}
                    onClick={() => goToDia(i)}
                    className={`tap-scale flex-shrink-0 flex flex-col items-center px-4 py-1.5 rounded-xl transition-all ${
                      ativo ? 'bg-blue text-white shadow-sm' : passado ? 'opacity-50' : 'text-text hover:bg-fill'
                    }`}
                  >
                    <span className="text-[10px] font-semibold uppercase">{DIAS_SEMANA[dObj.getDay()]}</span>
                    <span className="text-[18px] font-bold font-display leading-tight">{dObj.getDate()}</span>
                    <span className="text-[9px] uppercase">{dObj.toLocaleDateString('pt-BR', { month: 'short' })}</span>
                  </button>
                )
              })}
            </div>

            <div key={currentDestino.id} className="space-y-5 mt-4 animate-fade-in">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    onClick={() => setQuickAddAberto(true)}
                    className="tap-scale flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue text-white text-[14px] font-semibold flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Atração
                  </button>
                  <button
                    onClick={() => setPreencherDiaAberto(true)}
                    className="tap-scale flex items-center gap-1.5 px-4 py-2 rounded-full bg-orange/10 text-orange text-[14px] font-semibold flex-shrink-0"
                  >
                    <Sparkles className="w-4 h-4" /> IA
                  </button>
                  {temCoordenadas && atracoesDoDia.length >= 2 && (
                    <button
                      onClick={handleOtimizarDia}
                      className="tap-scale flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue/10 text-blue text-[14px] font-semibold flex-shrink-0"
                    >
                      <Route className="w-4 h-4" /> Otimizar rota
                    </button>
                  )}
                </div>

                <Card>
                  {atracoesDoDia.length === 0 ? (
                    <div className="py-8 text-center text-muted">
                      <p className="text-[15px]">Nenhuma atração planejada</p>
                      <p className="text-[13px] mt-1">Use + ou IA para começar</p>
                    </div>
                  ) : (
                    <div>
                      <StaggerContainer>
                        {atracoesDoDia.map((a, i) => (
                          <StaggerItem key={a.id}>
                            {i > 0 && <ConexaoAtracoes origem={atracoesDoDia[i - 1]} destino={a} />}
                            <AtracaoCard
                              atracao={a}
                              numero={i + 1}
                              pendenciaRelacionada={null}
                              onAbrirEditor={setAtracaoEditando}
                              onAlternarPendencia={alterarEstado}
                            />
                          </StaggerItem>
                        ))}
                      </StaggerContainer>
                      {rotaTotalKm > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2.5 border-t border-separator text-[12px] text-muted">
                          <Footprints className="w-3.5 h-3.5" />
                          Rota estimada: {formatarDistancia(rotaTotalKm)}
                        </div>
                      )}
                    </div>
                  )}
                </Card>

                {temCoordenadas && (
                  <div>
                    <button
                      onClick={() => setMapExpandido((v) => !v)}
                      className="tap-scale w-full flex items-center gap-3 py-2"
                    >
                      <Map className="w-5 h-5 text-blue" />
                      <span className="text-[15px] font-semibold flex-1 text-left">Mapa</span>
                      <ChevronDown className={`w-4 h-4 text-muted transition-transform ${mapExpandido ? 'rotate-180' : ''}`} />
                    </button>
                    {mapExpandido && (
                      <Card className="p-3 mt-1">
                        <MapaDoDia atracoes={atracoesDoDia} />
                      </Card>
                    )}
                  </div>
                )}

                <div>
                  <button
                    onClick={() => setFinancasExpandido((v) => !v)}
                    className="tap-scale w-full flex items-center gap-3 py-2"
                  >
                    <BarChart3 className="w-5 h-5 text-green" />
                    <span className="text-[15px] font-semibold flex-1 text-left">Resumo financeiro</span>
                    <ChevronDown className={`w-4 h-4 text-muted transition-transform ${financasExpandido ? 'rotate-180' : ''}`} />
                  </button>
                  {financasExpandido && (
                    <Card className="mt-1">
                      <div className="p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-fill rounded-xl p-3">
                            <p className="text-[11px] text-muted font-semibold uppercase tracking-wide mb-1">Previsto</p>
                            <p className="text-[18px] font-bold tabular-nums">
                              {totalEstimadoBRL != null ? `R$ ${formatarBRL(totalEstimadoBRL)}` : totalEstimadoEUR > 0 ? `€ ${formatarBRL(totalEstimadoEUR)}` : '—'}
                            </p>
                            {totalEstimadoBRL != null && (
                              <p className="text-[10px] text-muted mt-0.5">€ {formatarBRL(totalEstimadoEUR)}</p>
                            )}
                          </div>
                          <div className="bg-fill rounded-xl p-3">
                            <p className="text-[11px] text-muted font-semibold uppercase tracking-wide mb-1">Realizado</p>
                            <p className={`text-[18px] font-bold tabular-nums ${totalGasto > 0 ? 'text-green' : ''}`}>
                              {totalGasto > 0 ? `R$ ${formatarBRL(totalGasto)}` : 'R$ 0,00'}
                            </p>
                          </div>
                        </div>

                        {gastosPorCat.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[11px] text-muted font-semibold uppercase tracking-wide">Por categoria</p>
                            {gastosPorCat.map(([cat, valor]) => (
                              <div key={cat} className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORIA_CORES[cat] || '#6b7280' }} />
                                <span className="text-[13px] capitalize flex-1">{cat}</span>
                                <span className="text-[13px] font-semibold tabular-nums">R$ {formatarBRL(valor)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-separator">
                          <span className="text-[13px] text-muted font-semibold uppercase tracking-wide">Total</span>
                          <span className="text-[16px] font-bold tabular-nums text-green">R$ {formatarBRL(totalGasto)}</span>
                        </div>

                        <button
                          onClick={() => setGastoEditando({ destino_id: currentDestino.id, cidade })}
                          className="tap-scale w-full py-2.5 rounded-full bg-green/10 text-green text-[14px] font-semibold flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" /> Adicionar gasto
                        </button>
                      </div>
                    </Card>
                  )}
                </div>

                {haTransporte && (
                  <div>
                    <h2 className="text-muted text-[13px] font-semibold uppercase tracking-wide mb-3 px-1">Transporte</h2>
                    <Card>
                      {transportes.map((t) => (
                        <div key={t.id} className="flex items-center gap-3 py-3 px-4 border-b border-separator last:border-b-0">
                          <div className="w-9 h-9 rounded-full bg-blue/10 flex items-center justify-center flex-shrink-0">
                            <TransporteIcon tipo={t.tipo} className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-semibold">{MAPA_TIPO_TRANSPORTE[t.tipo] || t.tipo}</p>
                            {t.operadora && <p className="text-[12px] text-muted">{t.operadora}</p>}
                          </div>
                          {t.status === 'pendente' && (
                            <span className="text-[11px] font-semibold text-orange bg-orange/10 px-2 py-0.5 rounded-full">{t.status}</span>
                          )}
                        </div>
                      ))}
                    </Card>
                  </div>
                )}

                <div>
                  <h2 className="text-muted text-[13px] font-semibold uppercase tracking-wide mb-3 px-1">Acomodação</h2>
                  <Card>
                    <button
                      onClick={() => setAcomodacaoEditando(true)}
                      className="tap-scale w-full text-left py-3 px-4"
                    >
                      {acomodacao ? (
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-green/10 flex items-center justify-center flex-shrink-0">
                            <Bed className="w-4 h-4 text-green" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-semibold truncate">{acomodacao.nome}</p>
                            <p className="text-[12px] text-muted">{acomodacao.tipo}{acomodacao.endereco ? ` · ${acomodacao.endereco}` : ''}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted flex-shrink-0" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-green/10 flex items-center justify-center flex-shrink-0">
                            <Bed className="w-4 h-4 text-green" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-medium text-muted">Adicionar hospedagem</p>
                            <p className="text-[12px] text-muted">Toque para cadastrar hotel, Airbnb ou hostel</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted flex-shrink-0" />
                        </div>
                      )}
                    </button>
                  </Card>
                </div>

                {pendenciasDoDia.length > 0 && (
                  <div>
                    <h2 className="text-muted text-[13px] font-semibold uppercase tracking-wide mb-2 px-1">
                      Pendências ({pendenciasDoDia.length})
                    </h2>
                    <Card>
                      {pendenciasDoDia.map((p) => (
                        <PendenciaItem key={p.id} pendencia={p} onToggle={alterarEstado} onAbrirEditor={setPendenciaEditando} />
                      ))}
                    </Card>
                  </div>
                )}

                {docsDoDia.length > 0 && (
                  <div>
                    <h2 className="text-muted text-[13px] font-semibold uppercase tracking-wide mb-2 px-1">Documentos</h2>
                    <Card>
                      {docsDoDia.map((doc) => (
                        <div key={doc.id} className="flex items-center gap-3 py-2.5 px-4 border-b border-separator last:border-b-0">
                          <FileText className="w-4 h-4 text-muted" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-medium truncate">{doc.nome}</p>
                            <span className="text-[11px] font-medium text-muted capitalize">{doc.categoria}</span>
                          </div>
                        </div>
                      ))}
                    </Card>
                  </div>
                )}
            </div>

            <AtracaoEditor
              key={atracaoEditando?.id}
              aberto={!!atracaoEditando}
              onClose={() => setAtracaoEditando(null)}
              atracao={atracaoEditando}
              destinosDaCidade={dias.filter((d) => d.cidade === cidade)}
              atracoes={atracoes}
              pendenciaRelacionada={null}
              onSalvar={atualizarAtracao}
              onExcluir={removerAtracao}
              acomodacoes={hospedagens}
            />

            <AcomodacaoEditor
              aberto={acomodacaoEditando}
              onClose={() => setAcomodacaoEditando(false)}
              acomodacao={acomodacao}
              cidade={cidade}
              pais={destino?.pais ?? ''}
              cidades={cidadesLista}
              onSalvar={salvar}
              onExcluir={async (id) => {
                await remover(id)
                setAcomodacaoEditando(false)
                addToast('Acomodação excluída', 'info')
              }}
            />

            {preencherDiaAberto && (
              <PreencherDia
                aberto={preencherDiaAberto}
                onClose={() => { setPreencherDiaAberto(false); recarregarAtracoes() }}
                destino={currentDestino}
                acomodacao={acomodacao}
                onAdicionar={handleAdicionarAtracao}
                atracoes={atracoes}
              />
            )}

            <QuickAdd
              aberto={quickAddAberto}
              onClose={() => setQuickAddAberto(false)}
              destinos={destinos}
              atracoes={atracoes}
              onAdicionarAtracao={handleAdicionarAtracao}
              onCriarPendencia={criarPendencia}
            />

            {gastoEditando && (
              <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" onClick={() => setGastoEditando(null)}>
                <div className="bg-card w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 pb-10" onClick={(e) => e.stopPropagation()}>
                  <div className="w-10 h-1 rounded-full bg-separator mx-auto mb-5" />
                  <h2 className="font-display text-xl font-bold mb-4">Novo gasto</h2>
                  <GastoForm
                    destinos={dias}
                    cidadeAtual={cidade}
                    onSalvar={handleAdicionarGasto}
                    onCancelar={() => setGastoEditando(null)}
                  />
                </div>
              </div>
            )}

            {pendenciaEditando && (
              <PendenciaEditor
                key={pendenciaEditando.id}
                aberto={!!pendenciaEditando}
                onClose={() => setPendenciaEditando(null)}
                pendencia={pendenciaEditando}
                onSalvar={atualizarPendencia}
                onExcluir={removerPendencia}
              />
            )}
          </div>
        )}
    </>)

  const container = semPullToRefresh ? conteudo : <PullToRefresh onRefresh={recarregar}>{conteudo}</PullToRefresh>
  return container
}
