import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'

import { useViagem } from '../../hooks/useViagem'
import { useDestinos } from '../../hooks/useDestinos'
import { useAtracoes } from '../../hooks/useAtracoes'
import { useAcomodacoes } from '../../hooks/useAcomodacoes'
import { useGastos } from '../../hooks/useGastos'
import { usePendencias } from '../../hooks/usePendencias'
import { useDocumentos } from '../../hooks/useDocumentos'
import { formatarBRL, converterParaBRL, simboloMoeda } from '../../lib/cambio'
import { formatarDistancia, distanciaKm } from '../../lib/geo'
import { otimizarRota, gerarHorarios } from '../../lib/geo'
import { inicializarMapaGeral } from '../../lib/maps'
import DayDetailView from './DayDetailView'
import PreencherCidade from '../atracoes/PreencherCidade'
import AcomodacaoEditor from '../roteiro/AcomodacaoEditor'
import PendenciaItem from '../pendencias/PendenciaItem'
import PendenciaEditor from '../pendencias/PendenciaEditor'
import PendenciaAdder from '../pendencias/PendenciaAdder'
import Card from '../ui/Card'
import ErrorBoundary from '../ui/ErrorBoundary'
import PullToRefresh from '../ui/PullToRefresh'
import DocumentUploadModal from '../documentos/DocumentUploadModal'
import DocumentLinkModal from '../documentos/DocumentLinkModal'
import {
  ArrowLeft, Sparkles, Bed,
  ChevronRight, Map, CheckCircle2, Clock, Plus,
  FileText, Link as LinkIcon, ExternalLink,
  ArrowRight, MapPin,
} from 'lucide-react'
import { Skeleton, SkeletonCard } from '../ui/Skeleton'

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const CATEGORIA_CORES = {
  alimentacao: '#22c55e', transporte: '#3b82f6', hospedagem: '#f59e0b',
  entrada: '#8b5cf6', compras: '#ec4899', outros: '#6b7280',
}

const CORES_CIDADE = [
  { from: '#1B3A6B', to: '#2A5F8F' }, { from: '#6B3A2A', to: '#8F5F3A' },
  { from: '#2A6B3A', to: '#3A8F5F' }, { from: '#6B2A5F', to: '#8F3A7A' },
  { from: '#5F6B2A', to: '#7A8F3A' }, { from: '#2A5F6B', to: '#3A7A8F' },
  { from: '#6B3A3A', to: '#8F5A5A' }, { from: '#3A3A6B', to: '#5A5A8F' },
]

function corDaCidade(nome) {
  let hash = 0
  for (let i = 0; i < nome.length; i++) hash = nome.charCodeAt(i) + ((hash << 5) - hash)
  return CORES_CIDADE[Math.abs(hash) % CORES_CIDADE.length]
}

function categoriasGastos(gastos) {
  const mapa = {}
  for (const g of gastos) { const cat = g.categoria || 'outros'; if (!mapa[cat]) mapa[cat] = 0; mapa[cat] += g.valor_brl ?? 0 }
  return Object.entries(mapa).sort((a, b) => b[1] - a[1])
}

const FOTOS_CIDADE = {
  lisboa: 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800&h=400&fit=crop&auto=format',
  madrid: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800&h=400&fit=crop&auto=format',
  barcelona: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&h=400&fit=crop&auto=format',
  milao: 'https://images.unsplash.com/photo-1610016302534-6f67f1c968d8?w=800&h=400&fit=crop&auto=format',
  florenca: 'https://images.unsplash.com/photo-1476362174823-3a23f4aa6d76?w=800&h=400&fit=crop&auto=format',
  roma: 'https://plus.unsplash.com/premium_photo-1661963952208-2db3512ef3de?w=800&h=400&fit=crop&auto=format',
  paris: 'https://plus.unsplash.com/premium_photo-1661919210043-fd847a58522d?w=800&h=400&fit=crop&auto=format',
  amsterda: 'https://images.unsplash.com/photo-1584003564911-a7a321c84e1c?w=800&h=400&fit=crop&auto=format',
  porto: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&h=400&fit=crop&auto=format',
}

function fotoCidade(nome) {
  if (!nome) return null
  const key = nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return FOTOS_CIDADE[key] || null
}

export default function CidadeDetailView({ cidadeNome }) {
  const navigate = useNavigate()
  const { viagem, viagemId } = useViagem()
  const { destinos, loading: loadingDestinos, atualizarDestino } = useDestinos(viagemId)
  const { atracoes, loading: loadingAtracoes, adicionarAtracao, atualizarAtracao, recarregar: recarregarAtracoes } = useAtracoes(viagemId)
  const { acomodacoes, loading: loadingAcom, salvar: salvarAcomodacao, remover: removerAcomodacao, recarregar: recarregarAcomodacoes } = useAcomodacoes(viagemId)
  const { gastos } = useGastos(viagemId)
  const { pendencias, alterarEstado, criarPendencia, atualizarPendencia, removerPendencia } = usePendencias(viagemId)
  const { documentos, uploadArquivo, adicionarLink, recarregar: recarregarDocs } = useDocumentos(viagemId)
  const [aba, setAba] = useState('resumo')
  const [acomodacaoEditando, setAcomodacaoEditando] = useState(null)
  const [pendenciaEditando, setPendenciaEditando] = useState(null)
  const [adicionandoPendencia, setAdicionandoPendencia] = useState(false)
  const [mapaAberto, setMapaAberto] = useState(false)
  const [totalEstimadoBRL, setTotalEstimadoBRL] = useState(null)
  const [showDocUpload, setShowDocUpload] = useState(false)
  const [showDocLink, setShowDocLink] = useState(false)
  const [docUploading, setDocUploading] = useState(false)
  const [planejarCidadeAberto, setPlanejarCidadeAberto] = useState(false)
  const mapaInstance = useRef(null)
  const mapaModalRef = useRef(null)
  const mapaModalInit = useRef(false)

  const dias = useMemo(() =>
    destinos.filter((d) => d.cidade === cidadeNome).sort((a, b) => a.data.localeCompare(b.data)),
    [destinos, cidadeNome],
  )
  const cidade = dias[0]
  const idsDias = new Set(dias.map((d) => d.id))
  const atracoesDaCidade = useMemo(() =>
    atracoes.filter((a) => idsDias.has(a.destino_id)),
    [atracoes, idsDias],
  )
  const acomodacao = acomodacoes.find((a) => a.cidade === cidadeNome)

  const gastosDaCidade = useMemo(() =>
    gastos.filter((g) => dias.some((d) => d.id === g.destino_id)),
    [gastos, dias],
  )
  const totalGasto = gastosDaCidade.reduce((s, g) => s + (g.valor_brl ?? 0), 0)
  const gastosPorCat = categoriasGastos(gastosDaCidade)

  const totalEstimadoEUR = useMemo(() =>
    atracoesDaCidade.reduce((s, a) => s + (a.custo_estimado_eur || 0), 0),
    [atracoesDaCidade],
  )
  useEffect(() => {
    let active = true
    const id = setInterval(() => {
      if (!active) return
      const el = document.getElementById('main-scroll')
      if (el) el.scrollTop = 0
    }, 50)
    setTimeout(() => { active = false; clearInterval(id) }, 600)
    return () => { active = false; clearInterval(id) }
  }, [cidadeNome])

  useEffect(() => {
    if (totalEstimadoEUR > 0) {
      const moeda = viagem?.moeda_principal || 'EUR'
      converterParaBRL(totalEstimadoEUR, moeda).then((r) => setTotalEstimadoBRL(r.valorBRL)).catch(() => setTotalEstimadoBRL(null))
    } else {
      setTotalEstimadoBRL(null)
    }
  }, [totalEstimadoEUR, viagem?.moeda_principal])

  const proximoDestino = useMemo(() => {
    if (!destinos.length) return null
    const cidadesUnicas = []
    for (const d of destinos) {
      if (!cidadesUnicas.find((c) => c.cidade === d.cidade)) {
        cidadesUnicas.push({ cidade: d.cidade, pais: d.pais, flag_emoji: d.flag_emoji, data: d.data })
      }
    }
    const idxAtual = cidadesUnicas.findIndex((c) => c.cidade === cidadeNome)
    if (idxAtual === -1 || idxAtual >= cidadesUnicas.length - 1) return null
    return cidadesUnicas[idxAtual + 1]
  }, [destinos, cidadeNome])

  useEffect(() => {
    if (mapaAberto && mapaModalRef.current && !mapaModalInit.current) {
      mapaModalInit.current = true
      const timer = setTimeout(async () => {
        if (mapaModalRef.current) {
          mapaInstance.current = await inicializarMapaGeral(dias, atracoesDaCidade, mapaModalRef.current)
        }
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [mapaAberto, dias, atracoesDaCidade])

  const pendenciasDaCidade = useMemo(() => {
    return pendencias.filter((p) => {
      if (p.contexto_tipo === 'viagem') return true
      if (p.contexto_tipo === 'cidade' && p.contexto_id === cidadeNome) return true
      if (p.contexto_tipo === 'dia') return idsDias.has(p.contexto_id)
      if (p.contexto_tipo === 'atracao') {
        const atr = atracoes.find((a) => a.id === p.contexto_id)
        return atr && idsDias.has(atr.destino_id)
      }
      if (p.contexto_tipo === 'hospedagem') {
        const acom = acomodacoes.find((a) => a.id === p.contexto_id)
        return acom && acom.cidade === cidadeNome
      }
      if (!p.contexto_tipo && p.atracao_id) {
        const atr = atracoes.find((a) => a.id === p.atracao_id)
        return atr && idsDias.has(atr.destino_id)
      }
      if (!p.contexto_tipo && p.categoria === 'acomodacao' && p.titulo && p.titulo.toLowerCase().includes(cidadeNome.toLowerCase())) return true
      return false
    })
  }, [pendencias, atracoes, acomodacoes, cidadeNome, idsDias])

  const pendenciasAbertas = pendenciasDaCidade.filter((p) => !p.concluida)

  const docsDaCidade = useMemo(() => {
    return documentos.filter((d) => {
      if (d.contexto_tipo === 'viagem') return true
      if (d.contexto_tipo === 'cidade' && d.contexto_id === cidadeNome) return true
      if (d.contexto_tipo === 'dia') return idsDias.has(d.contexto_id)
      if (d.contexto_tipo === 'atracao') {
        const atr = atracoes.find((a) => a.id === d.contexto_id)
        return atr && idsDias.has(atr.destino_id)
      }
      return false
    })
  }, [documentos, atracoes, cidadeNome, idsDias]) // FIX: should be cidadeNome

  const temCoordenadas = atracoesDaCidade.some((a) => a.latitude && a.longitude)

  const hoje = new Date().toISOString().slice(0, 10)
  const proximoDia = dias.find((d) => d.data >= hoje)
  const atracoesProximoDia = proximoDia
    ? atracoes.filter((a) => a.destino_id === proximoDia.id).sort((a, b) => (a.horario_previsto ?? '99:99').localeCompare(b.horario_previsto ?? '99:99'))
    : []

  const rotaTotalKm = useMemo(() => {
    const comCoord = atracoesDaCidade.filter((a) => a.latitude && a.longitude)
    if (comCoord.length < 2) return 0
    let total = 0
    for (let i = 1; i < comCoord.length; i++) {
      total += distanciaKm(comCoord[i - 1].latitude, comCoord[i - 1].longitude, comCoord[i].latitude, comCoord[i].longitude)
    }
    return total
  }, [atracoesDaCidade])

  const recarregar = useCallback(async () => {
    await Promise.all([recarregarAtracoes(), recarregarAcomodacoes()])
  }, [recarregarAtracoes, recarregarAcomodacoes])

  const primeiraData = dias[0] ? new Date(dias[0].data + 'T00:00:00') : null
  const ultimaData = dias[dias.length - 1] ? new Date(dias[dias.length - 1].data + 'T00:00:00') : null

  const periodoLabel = primeiraData && ultimaData
    ? `${primeiraData.getDate()} ${primeiraData.toLocaleDateString('pt-BR', { month: 'short' })} – ${ultimaData.getDate()} ${ultimaData.toLocaleDateString('pt-BR', { month: 'short' })}`
    : ''

  const loading = loadingDestinos || loadingAtracoes

  if (loading) return (
    <div className="space-y-5">
      <Skeleton className="h-44 w-full rounded-2xl" />
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-4 w-32" />
      <SkeletonCard><Skeleton className="h-24" /></SkeletonCard>
    </div>
  )

  if (!cidade) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 space-y-4">
      <button onClick={() => navigate('/viagem')} aria-label="Voltar" className="tap-scale w-11 h-11 rounded-full bg-fill flex items-center justify-center"><ArrowLeft className="w-5 h-5" /></button>
      <MapPin className="w-12 h-12 text-muted" />
      <h2 className="font-display text-[22px] font-bold">Cidade não encontrada</h2>
      <p className="text-muted text-[15px]">{cidadeNome} não está no roteiro desta viagem.</p>
      <button onClick={() => navigate('/viagem')} className="tap-scale px-6 py-3 rounded-ios bg-blue text-white font-semibold text-[15px]">
        Voltar para o roteiro
      </button>
    </div>
  )

  const cores = corDaCidade(cidadeNome)
  const fotoUrl = fotoCidade(cidadeNome)

  return (
    <PullToRefresh onRefresh={recarregar}>
      <div className="space-y-0">
        <div className="relative -mx-4 -mt-[max(16px,env(safe-area-inset-top))] px-4 pt-[max(16px,env(safe-area-inset-top))] overflow-hidden">
          {fotoUrl && (
            <img src={fotoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0" style={{ background: fotoUrl ? 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)' : `linear-gradient(135deg, ${cores.from}, ${cores.to})` }} />
          <div className="relative z-10">
            <button onClick={() => navigate('/viagem')} aria-label="Voltar" className="tap-scale w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur-sm mt-2">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="mt-5 pb-4">
              <span className="text-4xl block mb-1">{cidade.flag_emoji}</span>
            <h1 className="text-white font-display text-[28px] font-bold tracking-tight leading-tight">{cidadeNome}</h1>
            <p className="text-white/80 text-[14px] mt-0.5">{cidade.pais}</p>
            <p className="text-white/60 text-[12px] mt-0.5">{periodoLabel} · {dias.length} dia{dias.length !== 1 ? 's' : ''} · {atracoesDaCidade.length} {atracoesDaCidade.length === 1 ? 'atração' : 'atrações'}</p>
          </div>
        </div>
        </div>

        <div className="flex gap-2 -mx-4 px-4 py-3 overflow-x-auto scrollbar-none bg-card border-b border-separator sticky top-0 z-20">
          {['resumo', 'dias', 'pendencias', 'hospedagem', 'documentos'].map((tabId) => {
            const labels = { resumo: 'Resumo', dias: 'Dias', pendencias: 'Pendências', hospedagem: 'Hospedagem', documentos: 'Documentos' }
            const counts = { pendencias: pendenciasAbertas.length }
            const showCount = (counts[tabId] || 0) > 0
            return (
              <button
                key={tabId}
                onClick={() => setAba(tabId)}
                className={`tap-scale flex-shrink-0 px-4 py-2 rounded-full text-[14px] font-semibold transition-all ${
                  aba === tabId ? 'bg-blue text-white shadow-sm' : 'bg-fill text-text'
                }`}
              >
                {labels[tabId]}
                {showCount && <span className="ml-1.5 bg-red text-white text-[11px] font-bold rounded-full min-w-[18px] h-[18px] inline-flex items-center justify-center px-1">{counts[tabId]}</span>}
              </button>
            )
          })}
        </div>

        <div>
          {aba === 'resumo' && (
            <div className="space-y-4 pt-6 pb-6">
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-4 text-center">
                  <p className="text-[22px] font-bold tabular-nums">{atracoesDaCidade.length}</p>
                  <p className="text-[11px] text-muted">atrações</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="text-[22px] font-bold tabular-nums">{dias.length}</p>
                  <p className="text-[11px] text-muted">dias</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="text-[22px] font-bold tabular-nums">{acomodacao ? '✓' : '—'}</p>
                  <p className="text-[11px] text-muted">hospedagem</p>
                </Card>
                <Card className="p-4 text-center">
                  {pendenciasAbertas.length > 0 ? (
                    <p className="text-[22px] font-bold tabular-nums text-orange">{pendenciasAbertas.length}</p>
                  ) : (
                    <p className="text-[22px] font-bold tabular-nums text-green">✓</p>
                  )}
                  <p className="text-[11px] text-muted">pendências</p>
                </Card>
              </div>

              <div className="bg-fill rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[12px] text-muted font-semibold uppercase tracking-wide">Orçamento</span>
                  <span className="text-[12px] text-muted">previsto vs realizado</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] text-muted font-semibold uppercase tracking-wide mb-0.5">Previsto</p>
                    <p className="text-[20px] font-bold tabular-nums">
                      {totalEstimadoBRL != null ? `R$ ${formatarBRL(totalEstimadoBRL)}` : totalEstimadoEUR > 0 ? `${simboloMoeda(viagem?.moeda_principal)} ${formatarBRL(totalEstimadoEUR)}` : '—'}
                    </p>
                    {totalEstimadoEUR > 0 && (
                      <p className="text-[10px] text-muted mt-0.5">{simboloMoeda(viagem?.moeda_principal)} {formatarBRL(totalEstimadoEUR)}</p>
                    )}
                    {totalEstimadoEUR > 0 && (
                      <p className="text-[10px] text-muted mt-0.5">baseado nas atrações</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] text-muted font-semibold uppercase tracking-wide mb-0.5">Realizado</p>
                    <p className={`text-[20px] font-bold tabular-nums ${totalGasto > 0 ? 'text-green' : ''}`}>
                      R$ {formatarBRL(totalGasto)}
                    </p>
                  </div>
                </div>
                {gastosPorCat.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {gastosPorCat.slice(0, 4).map(([cat, valor]) => (
                      <span key={cat} className="text-[11px] bg-fill border border-separator px-2 py-0.5 rounded-full capitalize">
                        <span className="inline-block w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: CATEGORIA_CORES[cat] || '#6b7280' }} />
                        {cat} R$ {formatarBRL(valor)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {proximoDia && atracoesProximoDia.length > 0 && (
                <div>
                  <h2 className="text-muted text-[13px] font-semibold uppercase tracking-wide mb-3 px-1">Próximos compromissos</h2>
                  <Card>
                    {atracoesProximoDia.slice(0, 3).map((a) => (
                      <div key={a.id} className="flex items-center gap-3 py-2.5 px-4 border-b border-separator last:border-b-0">
                        <Clock className="w-4 h-4 text-muted" />
                        <span className="text-[12px] font-semibold tabular-nums text-muted w-12">{a.horario_previsto?.slice(0, 5) || '—'}</span>
                        <span className="text-[14px] font-medium truncate flex-1">{a.nome}</span>
                        {a.custo_estimado_eur > 0 && <span className="text-[12px] text-muted tabular-nums">{simboloMoeda(a.moeda)} {formatarBRL(a.custo_estimado_eur)}</span>}
                      </div>
                    ))}
                    <button
                      onClick={() => navigate(`/viagem/dia/${proximoDia.id}`)}
                      className="tap-scale w-full py-2.5 text-[13px] font-semibold text-blue flex items-center justify-center gap-1"
                    >
                      Ver dia completo <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </Card>
                </div>
              )}

              <div>
                <h2 className="text-muted text-[13px] font-semibold uppercase tracking-wide mb-3 px-1">Tempo e fuso</h2>
                <WeatherForecast cidadeNome={cidadeNome} lat={cidade.latitude} lng={cidade.longitude} dataInicio={dias[0]?.data} dataFim={dias[dias.length - 1]?.data} />
              </div>

              {temCoordenadas && (
                <div>
                  <h2 className="text-muted text-[13px] font-semibold uppercase tracking-wide mb-3 px-1">Mapa</h2>
                  <Card>
                    <button
                      onClick={() => { setMapaAberto(true); mapaModalInit.current = false }}
                      className="tap-scale w-full flex items-center gap-3 py-4 px-4"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue/10 flex items-center justify-center"><Map className="w-5 h-5 text-blue" /></div>
                      <div className="flex-1 text-left">
                        <p className="text-[15px] font-semibold">Ver atrações no mapa</p>
                        <p className="text-[13px] text-muted">{atracoesDaCidade.length} {atracoesDaCidade.length === 1 ? 'atração' : 'atrações'}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted" />
                    </button>
                  </Card>
                </div>
              )}

              {pendenciasAbertas.length > 0 && (
                <Card>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] font-semibold uppercase tracking-wide text-muted">Pendências abertas</span>
                      <button onClick={() => setAba('pendencias')} className="tap-scale text-[12px] text-blue font-semibold">Ver todas</button>
                    </div>
                    <div className="space-y-1">
                      {pendenciasAbertas.slice(0, 4).map((p) => (
                        <div key={p.id} className="flex items-center gap-2 py-1">
                          <span className="w-2 h-2 rounded-full bg-orange flex-shrink-0" />
                          <span className="text-[13px] truncate">{p.titulo}</span>
                        </div>
                      ))}
                      {pendenciasAbertas.length > 4 && (
                        <p className="text-[12px] text-muted mt-1">+{pendenciasAbertas.length - 4} outras</p>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {proximoDestino && (
                <div className="bg-fill rounded-xl p-4">
                  <Link
                    to={`/viagem/cidade/${encodeURIComponent(proximoDestino.cidade)}`}
                    className="tap-scale w-full flex items-center gap-3"
                    onClick={(e) => {
                      const el = document.getElementById('main-scroll')
                      if (el) el.scrollTop = 0
                    }}
                  >
                    <span className="text-2xl">{proximoDestino.flag_emoji}</span>
                    <div className="flex-1 text-left">
                      <p className="text-[11px] text-muted font-semibold uppercase tracking-wide">Próximo destino</p>
                      <p className="text-[16px] font-bold">{proximoDestino.cidade}, {proximoDestino.pais}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {aba === 'dias' && (
            <div className="pt-4 pb-6 space-y-4">
              <button
                onClick={() => setPlanejarCidadeAberto(true)}
                className="tap-scale w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-[16px] flex items-center justify-center gap-2.5 shadow-lg shadow-purple-500/30 active:scale-[0.98] transition-transform"
              >
                <Sparkles className="w-5 h-5" /> Planejar {cidadeNome} com IA
              </button>
              <DayDetailView destinoId={dias[0]?.id} key={dias[0]?.id} semPullToRefresh stickyTop="top-[62px]" />
            </div>
          )}

          {aba === 'pendencias' && (
            <div className="space-y-4 pt-6 pb-6">
              <div className="flex items-center justify-between px-1">
                <p className="text-muted text-[15px]">{pendenciasAbertas.length} {pendenciasAbertas.length === 1 ? 'pendência' : 'pendências'} abertas</p>
                <button onClick={() => setAdicionandoPendencia(true)} className="tap-scale w-10 h-10 rounded-full bg-fill flex items-center justify-center"><Plus className="w-4 h-4" /></button>
              </div>
              {pendenciasDaCidade.length > 0 ? (
                <Card>
                  {pendenciasDaCidade.map((p) => (
                    <PendenciaItem key={p.id} pendencia={p} onToggle={alterarEstado} onAbrirEditor={setPendenciaEditando} />
                  ))}
                </Card>
              ) : (
                <Card><div className="py-8 text-center text-muted"><CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-40" /><p className="text-[14px]">Nenhuma pendência</p></div></Card>
              )}
            </div>
          )}

          {aba === 'hospedagem' && (
            <div className="pt-6 pb-6">
              <button
                onClick={() => setAcomodacaoEditando({ cidade: cidadeNome, pais: cidade.pais, ...acomodacao })}
                className="tap-scale w-full text-left"
              >
                <Card>
                  <div className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-green/10 flex items-center justify-center shrink-0"><Bed className="w-7 h-7 text-green" /></div>
                      <div className="flex-1 min-w-0">
                        {acomodacao ? (
                          <>
                            <p className="text-[17px] font-semibold truncate">{acomodacao.nome}</p>
                            <p className="text-[14px] text-muted mt-0.5 capitalize">{acomodacao.tipo}{acomodacao.endereco ? ` · ${acomodacao.endereco}` : ''}</p>
                            {acomodacao.link && (
                              <a href={acomodacao.link} target="_blank" rel="noopener noreferrer" className="tap-scale text-[13px] text-blue font-semibold mt-2 inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>Ver reserva <ExternalLink className="w-3.5 h-3.5" /></a>
                            )}
                            {acomodacao.notas && (
                              <p className="text-[13px] text-muted mt-2 italic leading-snug">"{acomodacao.notas}"</p>
                            )}
                          </>
                        ) : (
                          <div className="py-1">
                            <p className="text-[17px] font-semibold text-text">Adicionar hospedagem</p>
                            <p className="text-[14px] text-muted mt-1">Toque para cadastrar hotel, Airbnb ou hostel</p>
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted shrink-0" />
                    </div>
                  </div>
                </Card>
              </button>
            </div>
          )}

          {aba === 'documentos' && (
            <div className="pt-6 pb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-muted text-[13px]">{docsDaCidade.length} documento{docsDaCidade.length !== 1 ? 's' : ''}</p>
                <div className="flex gap-2">
                  <button onClick={() => setShowDocLink(true)} aria-label="Adicionar link" className="tap-scale w-11 h-11 rounded-full bg-fill flex items-center justify-center text-muted"><LinkIcon className="w-5 h-5" /></button>
                  <button onClick={() => setShowDocUpload(true)} aria-label="Adicionar documento" className="tap-scale w-11 h-11 rounded-full bg-blue text-white flex items-center justify-center"><Plus className="w-5 h-5" /></button>
                </div>
              </div>
              {docsDaCidade.length > 0 ? (
                <Card>
                  {docsDaCidade.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-4 py-4 px-5 border-b border-separator last:border-b-0">
                      <div className="w-10 h-10 rounded-xl bg-fill flex items-center justify-center shrink-0">
                        {doc.tipo === 'link' ? <LinkIcon className="w-5 h-5 text-muted" /> : <FileText className="w-5 h-5 text-muted" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold truncate">{doc.nome}</p>
                        <span className="text-[12px] font-medium text-muted capitalize mt-0.5 block">{doc.categoria}</span>
                      </div>
                      {doc.arquivo_url && (
                        <a href={doc.arquivo_url} target="_blank" rel="noopener noreferrer" className="tap-scale w-9 h-9 rounded-full bg-fill flex items-center justify-center shrink-0"><ExternalLink className="w-4.5 h-4.5 text-muted" /></a>
                      )}
                    </div>
                  ))}
                </Card>
              ) : (
                <Card><div className="py-14 text-center text-muted space-y-3"><FileText className="w-10 h-10 mx-auto opacity-30" /><p className="text-[15px] font-medium">Nenhum documento vinculado</p><p className="text-[13px] text-muted">Documentos de {cidadeNome} aparecerão aqui</p></div></Card>
              )}
            </div>
          )}
        </div>

        {mapaAberto && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" onClick={() => { setMapaAberto(false); mapaInstance.current = null; mapaModalInit.current = false }}>
            <div className="bg-card w-full sm:max-w-2xl h-[60vh] sm:h-[70vh] rounded-t-2xl sm:rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <h2 className="font-display text-lg font-bold">{cidadeNome}</h2>
                <button onClick={() => { setMapaAberto(false); mapaInstance.current = null; mapaModalInit.current = false }} className="tap-scale w-11 h-11 rounded-full bg-fill flex items-center justify-center text-muted text-xl">✕</button>
              </div>
              <div ref={mapaModalRef} className="w-full h-[calc(100%-52px)]" />
            </div>
          </div>
        )}

        {acomodacaoEditando && (
          <AcomodacaoEditor
            aberto={!!acomodacaoEditando}
            onClose={() => setAcomodacaoEditando(null)}
            acomodacao={acomodacaoEditando.id ? acomodacaoEditando : null}
            cidade={acomodacaoEditando.cidade}
            pais={acomodacaoEditando.pais}
            onSalvar={salvarAcomodacao}
            onExcluir={async (id) => {
              await removerAcomodacao(id)
              setAcomodacaoEditando(null)
              addToast('Acomodação excluída', 'info')
            }}
          />
        )}

        {pendenciaEditando && (
          <ErrorBoundary fallback={<p className="text-red text-[14px] p-4">Erro ao abrir editor de pendência</p>}>
            <PendenciaEditor
              aberto={!!pendenciaEditando}
              onClose={() => setPendenciaEditando(null)}
              pendencia={pendenciaEditando}
              onSalvar={atualizarPendencia}
              onExcluir={removerPendencia}
            />
          </ErrorBoundary>
        )}

        {adicionandoPendencia && (
          <ErrorBoundary>
            <PendenciaAdder
              aberto={adicionandoPendencia}
              onClose={() => setAdicionandoPendencia(false)}
              onSalvar={async (dados) => {
                const result = await criarPendencia(dados)
                setAdicionandoPendencia(false)
                return result
              }}
              contextoPadrao={{
                tipo: 'cidade',
                id: cidadeNome,
                cidades: (() => {
                  const mapa = {}
                  for (const d of destinos) {
                    if (d.cidade && !mapa[d.cidade]) mapa[d.cidade] = { nome: d.cidade, flag: d.flag_emoji || '' }
                  }
                  return Object.values(mapa)
                })(),
                dias: (() => {
                  const ordenados = [...(destinos || [])].sort((a, b) => a.data.localeCompare(b.data))
                  return ordenados.map((d) => {
                    const data = new Date(d.data + 'T00:00:00')
                    return { id: d.id, label: `${data.getDate()}/${data.getMonth() + 1}`, cidade: d.cidade, flag: d.flag_emoji || '' }
                  })
                })(),
              }}
            />
          </ErrorBoundary>
        )}

        {showDocUpload && <DocumentUploadModal aberto onClose={() => setShowDocUpload(false)} onUpload={async (file, nome, categoria, contexto) => { setDocUploading(true); await uploadArquivo(file, nome, categoria, { tipo: 'cidade', id: cidadeNome }); setDocUploading(false); setShowDocUpload(false); recarregarDocs() }} uploading={docUploading} />}
        {showDocLink && <DocumentLinkModal aberto onClose={() => setShowDocLink(false)} onAdd={async (nome, categoria, url, contexto) => { await adicionarLink(nome, categoria, url, { tipo: 'cidade', id: cidadeNome }); setShowDocLink(false); recarregarDocs() }} />}

        {planejarCidadeAberto && (
          <PreencherCidade
            aberto={planejarCidadeAberto}
            onClose={() => setPlanejarCidadeAberto(false)}
            cidade={cidadeNome}
            pais={cidade?.pais || ''}
            dias={dias}
            atracoes={atracoesDaCidade}
            tipo={viagem?.tipo || 'lazer'}
            moeda={viagem?.moeda_principal || 'EUR'}
            hospedagem={acomodacao}
            clima={null}
            onAdicionar={adicionarAtracao}
            onCriarPendencia={criarPendencia}
          />
        )}
      </div>
    </PullToRefresh>
  )
}

function WeatherForecast({ cidadeNome, lat, lng, dataInicio, dataFim }) {
  const [previsao, setPrevisao] = useState(null)
  const [fuso, setFuso] = useState(null)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    if (!dataInicio || !dataFim || lat == null || lng == null) return
    let ativo = true
    setPrevisao(null)
    setFuso(null)
    setErro(false)

    async function carregar() {

      // Busca timezone via Open-Meteo nas coordenadas
      try {
        const tzRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m&timezone=auto&forecast_days=1`)
        const tzData = await tzRes.json()
        if (tzData?.timezone && ativo) setFuso(tzData.timezone)
      } catch {}

      const inicio = new Date(dataInicio + 'T00:00:00')
      const fim = new Date(dataFim + 'T00:00:00')
      const hoje = new Date()
      const diasAteInicio = Math.ceil((inicio - hoje) / (1000 * 60 * 60 * 24))
      const diasDesdeFim = Math.ceil((hoje - fim) / (1000 * 60 * 60 * 24))

      const dailyParams = 'temperature_2m_max,temperature_2m_min,sunrise,sunset'

      if (diasAteInicio > 16 || diasDesdeFim > 30) {
        const deslocarAnos = 2
        const inicioShift = new Date(inicio)
        const fimShift = new Date(fim)
        inicioShift.setFullYear(inicioShift.getFullYear() - deslocarAnos)
        fimShift.setFullYear(fimShift.getFullYear() - deslocarAnos)
        const inicioStr = inicioShift.toISOString().slice(0, 10)
        const fimStr = fimShift.toISOString().slice(0, 10)

        const resArchive = await fetch(`https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${inicioStr}&end_date=${fimStr}&daily=${dailyParams}&timezone=auto`)
        const d = await resArchive.json()
        if (!d?.daily || !ativo) { if (ativo) setErro(true); return }
        setPrevisao(d.daily)
        return
      }

      const params = new URLSearchParams({
        latitude: lat, longitude: lng,
        daily: dailyParams,
        timezone: 'auto', start_date: dataInicio, end_date: dataFim,
      })
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
        const data = await res.json()
        if (!ativo) return
        if (data.daily) setPrevisao(data.daily)
        else setErro(true)
      } catch { if (ativo) setErro(true) }
    }

    carregar()
    return () => { ativo = false }
  }, [lat, lng, dataInicio, dataFim])

  if (erro) return null
  if (!previsao || !fuso) return <Skeleton className="h-14 w-full rounded-xl" />

  const maxs = previsao.temperature_2m_max.filter((v) => v != null)
  const mins = previsao.temperature_2m_min.filter((v) => v != null)
  const tempMediaMax = maxs.length > 0 ? Math.round(maxs.reduce((a, b) => a + b, 0) / maxs.length) : null
  const tempMediaMin = mins.length > 0 ? Math.round(mins.reduce((a, b) => a + b, 0) / mins.length) : null

  const agora = new Date()
  const horaLocal = agora.toLocaleTimeString('pt-BR', { timeZone: fuso, hour: '2-digit', minute: '2-digit' })

  const cidadeDate = new Date(agora.toLocaleString('en-US', { timeZone: fuso }))
  const utcDate = new Date(agora.toLocaleString('en-US', { timeZone: 'UTC' }))
  const offsetCidade = (cidadeDate - utcDate) / (1000 * 60 * 60)
  const brDate = new Date(agora.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const offsetBR = (brDate - utcDate) / (1000 * 60 * 60)
  const diffBR = Math.round(offsetCidade - offsetBR)
  const offsetLabel = `UTC${offsetCidade >= 0 ? '+' : ''}${offsetCidade}`
  const brLabel = diffBR >= 0 ? `${diffBR}h a mais que Brasília` : `${Math.abs(diffBR)}h a menos que Brasília`

  const porDoSol = previsao.sunset?.[0]?.slice(11, 16) || null

  return (
    <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
      <div className="flex">
        <div className="flex-1 py-5 flex flex-col items-center gap-1">
          <span className="text-[20px] leading-none">☀️</span>
          <span className="text-[9px] font-semibold text-muted uppercase tracking-[0.08em]">Temperatura</span>
          <p className="text-[24px] font-bold tabular-nums leading-none tracking-tight">
            {tempMediaMin != null && tempMediaMax != null ? `${tempMediaMin}°–${tempMediaMax}°C` : '—'}
          </p>
          <span className="text-[8px] text-muted/60 font-medium uppercase tracking-widest">Média</span>
        </div>
        <div className="w-px bg-separator self-stretch my-4" />
        <div className="flex-1 py-5 flex flex-col items-center gap-1">
          <span className="text-[20px] leading-none">🕐</span>
          <span className="text-[9px] font-semibold text-muted uppercase tracking-[0.08em]">Fuso horário</span>
          <p className="text-[17px] font-bold tabular-nums leading-none tracking-tight">{offsetLabel}</p>
          <span className="text-[11px] text-muted font-medium">{horaLocal}</span>
          <span className="text-[9px] text-muted/70">{brLabel}</span>
        </div>
        <div className="w-px bg-separator self-stretch my-4" />
        <div className="flex-1 py-5 flex flex-col items-center gap-1">
          <span className="text-[20px] leading-none">🌅</span>
          <span className="text-[9px] font-semibold text-muted uppercase tracking-[0.08em]">Pôr do sol</span>
          <p className="text-[24px] font-bold tabular-nums leading-none tracking-tight">{porDoSol || '—'}</p>
          <span className="text-[8px] text-muted/60 font-medium uppercase tracking-widest">Primeiro dia</span>
        </div>
      </div>
    </div>
  )
}
