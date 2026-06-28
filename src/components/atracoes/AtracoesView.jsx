import { useMemo, useState, useEffect } from 'react'
import { useDestinos } from '../../hooks/useDestinos'
import { useAtracoes } from '../../hooks/useAtracoes'
import { usePendencias } from '../../hooks/usePendencias'
import { useAcomodacoes } from '../../hooks/useAcomodacoes'
import { useAuthContext } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { otimizarRota, gerarHorarios, formatarDistancia, estimarTempoCaminhada, distanciaKm } from '../../lib/geo'
import AtracaoCard from './AtracaoCard'
import AtracaoEditor from './AtracaoEditor'
import MapaDoDia from './MapaDoDia'
import PreencherDia from './PreencherDia'
import QuickAdd from './QuickAdd'
import Card from '../ui/Card'
import PullToRefresh from '../ui/PullToRefresh'
import { StaggerContainer, StaggerItem } from '../ui/Stagger'
import { Map, Route, Sparkles, Footprints, Plus } from 'lucide-react'
import { Skeleton, SkeletonPill, SkeletonCard } from '../ui/Skeleton'

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function encontrarPendencia(atracao, pendencias) {
  return (
    pendencias.find((p) => p.atracao_id === atracao.id) ??
    pendencias.find(
      (p) => !p.concluida && p.categoria === 'atracoes' && p.titulo.toLowerCase().includes(atracao.nome.toLowerCase()),
    )
  )
}

function ConexaoAtracoes({ origem, destino }) {
  if (!origem.latitude || !origem.longitude || !destino.latitude || !destino.longitude) return null

  const km = distanciaKm(origem.latitude, origem.longitude, destino.latitude, destino.longitude)
  const tempo = estimarTempoCaminhada(km)
  const distStr = formatarDistancia(km)

  function handleDirecoes(e) {
    e.stopPropagation()
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origem.latitude},${origem.longitude}&destination=${destino.latitude},${destino.longitude}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="flex items-center gap-3 px-4 py-1.5">
      <div className="flex flex-col items-center w-8 flex-shrink-0">
        <div className="w-px h-3 bg-border border-l border-dashed border-border/50" />
        <div className="w-5 h-5 rounded-full bg-fill border border-border flex items-center justify-center">
          <Footprints className="w-2.5 h-2.5 text-muted" />
        </div>
        <div className="w-px h-3 bg-border border-l border-dashed border-border/50" />
      </div>
      <div className="flex items-center gap-1.5 text-[12px] text-muted">
        <span className="tabular-nums">{tempo} · {distStr}</span>
        <span onClick={handleDirecoes} className="tap-scale text-blue font-semibold">
          Direções
        </span>
      </div>
    </div>
  )
}

export default function AtracoesView() {
  const { usuario } = useAuthContext()
  const { destinos, loading: loadingDestinos } = useDestinos()
  const { atracoes, loading: loadingAtracoes, adicionarAtracao, atualizarAtracao, removerAtracao, recarregar } = useAtracoes()
  const { pendencias, criarPendencia, alternarConcluida } = usePendencias()
  const { acomodacoes } = useAcomodacoes()
  const addToast = useToast()
  const [cidadeAtiva, setCidadeAtiva] = useState(null)
  const [diaAtivo, setDiaAtivo] = useState(null)
  const [quickAddAberto, setQuickAddAberto] = useState(false)
  const [verMapa, setVerMapa] = useState(false)
  const [atracaoEditando, setAtracaoEditando] = useState(null)
  const [preencherDiaDestino, setPreencherDiaDestino] = useState(null)

  const cidades = useMemo(() => [...new Set(destinos.map((d) => d.cidade))], [destinos])
  const cidadeSelecionada = cidadeAtiva ?? cidades[0]

  const destinosDaCidade = useMemo(() =>
    destinos.filter((d) => d.cidade === cidadeSelecionada).sort((a, b) => a.data.localeCompare(b.data)),
    [destinos, cidadeSelecionada],
  )

  useEffect(() => {
    setDiaAtivo(null)
  }, [cidadeAtiva])

  const diaSelecionado = diaAtivo ?? destinosDaCidade[0]?.id
  const destinoAtivo = destinosDaCidade.find((d) => d.id === diaSelecionado)

  const destinosDaCidadeDaAtracaoEditando = useMemo(() => {
    if (!atracaoEditando) return []
    const cidadeDaAtracao = destinos.find((d) => d.id === atracaoEditando.destino_id)?.cidade
    return destinos.filter((d) => d.cidade === cidadeDaAtracao)
  }, [atracaoEditando, destinos])
  const atracoesDoDia = useMemo(() =>
    atracoes
      .filter((a) => a.destino_id === diaSelecionado)
      .sort((a, b) => (a.horario_previsto ?? '99:99').localeCompare(b.horario_previsto ?? '99:99')),
    [atracoes, diaSelecionado],
  )

  const temCoordenadas = atracoesDoDia.some((a) => a.latitude && a.longitude)

  async function handleAdicionar(dados) {
    const resultado = await adicionarAtracao({ ...dados, created_by: usuario.id })
    await recarregar()
    addToast('Atração adicionada')
    return resultado
  }

  const acomodacaoAtiva = acomodacoes.find((a) => a.cidade === cidadeSelecionada && a.latitude && a.longitude)

  async function handleOtimizarDia(destinoId, atracoesDoDia) {
    if (!acomodacaoAtiva) {
      addToast('Adicione uma acomodação com endereço no Roteiro', 'info')
      return
    }
    const comCoords = atracoesDoDia.filter((a) => a.latitude)
    if (comCoords.length < 2) {
      addToast('São necessárias pelo menos 2 atrações com coordenadas', 'info')
      return
    }
    const pontoPartida = { lat: acomodacaoAtiva.latitude, lng: acomodacaoAtiva.longitude }
    const ordenadas = otimizarRota(atracoesDoDia, pontoPartida)
    const horarios = gerarHorarios(ordenadas.length)
    await Promise.all(
      ordenadas.map((a, i) =>
        atualizarAtracao(a.id, { ordem_no_dia: i, horario_previsto: horarios[i] }),
      ),
    )
    await recarregar()
    addToast('Rota otimizada! Atrações reordenadas por proximidade')
  }

  if (loadingDestinos || loadingAtracoes) return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-4 w-24 mt-1.5" />
        </div>
        <Skeleton className="w-11 h-11 rounded-full" />
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        {[1, 2, 3].map((i) => <SkeletonPill key={i} className="w-20" />)}
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        {[1, 2, 3, 4].map((i) => <SkeletonPill key={i} className="w-24" />)}
      </div>
      {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
    </div>
  )

  return (
    <PullToRefresh onRefresh={recarregar}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-[34px] font-bold tracking-tight">Atrações</h1>
            <p className="text-muted text-[15px] mt-0.5">{atracoes.filter(a => a.destino_id === diaSelecionado).length} atrações neste dia</p>
          </div>
          <button
            onClick={() => setQuickAddAberto(true)}
            className="tap-scale w-11 h-11 rounded-full bg-blue text-white flex items-center justify-center"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
          {cidades.map((cidade) => (
            <button
              key={cidade}
              onClick={() => setCidadeAtiva(cidade)}
              className={`tap-scale flex-shrink-0 px-3.5 py-1.5 rounded-full text-[14px] font-semibold ${
                cidadeSelecionada === cidade ? 'bg-blue text-white' : 'bg-fill text-text'
              }`}
            >
              {cidade}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
          {destinosDaCidade.map((destino) => {
            const d = new Date(destino.data + 'T00:00:00')
            const label = `${DIAS_SEMANA[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`
            return (
              <button
                key={destino.id}
                onClick={() => setDiaAtivo(destino.id)}
                className={`tap-scale flex-shrink-0 px-3.5 py-1.5 rounded-full text-[14px] font-semibold ${
                  diaSelecionado === destino.id ? 'bg-blue text-white' : 'bg-fill text-text'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => setVerMapa((v) => !v)}
          className="tap-scale w-full bg-fill text-blue font-semibold text-[15px] py-3 rounded-ios"
        >
          {verMapa ? 'Esconder mapa' : <><Map className="w-4 h-4 inline-block mr-1" /> Ver no mapa</>}
        </button>

        {verMapa && (
          <Card className="p-3">
            <MapaDoDia atracoes={atracoesDoDia} />
          </Card>
        )}

        <div>
          {!destinoAtivo ? (
            <p className="text-muted text-[15px] py-6 text-center">Nenhuma atração cadastrada para {cidadeSelecionada}.</p>
          ) : (
            <div key={destinoAtivo.id}>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-muted text-[13px] font-semibold uppercase tracking-wide">
                  {new Date(destinoAtivo.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', weekday: 'short' }).replace('.', '')}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPreencherDiaDestino(destinoAtivo)}
                    className="tap-scale flex items-center gap-1 text-[12px] font-semibold text-orange bg-orange/10 px-2.5 py-1 rounded-full"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Preencher dia
                  </button>
                  {acomodacaoAtiva && temCoordenadas && atracoesDoDia.length >= 2 && (
                    <button
                      onClick={() => handleOtimizarDia(destinoAtivo.id, atracoesDoDia)}
                      className="tap-scale flex items-center gap-1 text-[12px] font-semibold text-blue bg-blue/10 px-2.5 py-1 rounded-full"
                    >
                      <Route className="w-3.5 h-3.5" /> Otimizar rota
                    </button>
                  )}
                </div>
              </div>
              {atracoesDoDia.length === 0 ? (
                <Card>
                  <p className="text-muted text-[14px] py-6 text-center">Nenhuma atração neste dia.</p>
                </Card>
              ) : (
                <Card>
                  <StaggerContainer>
                    {atracoesDoDia.map((a, i) => (
                      <StaggerItem key={a.id}>
                        {i > 0 && <ConexaoAtracoes origem={atracoesDoDia[i - 1]} destino={a} />}
                        <AtracaoCard
                          atracao={a}
                          numero={i + 1}
                          pendenciaRelacionada={encontrarPendencia(a, pendencias)}
                          onAbrirEditor={setAtracaoEditando}
                          onAlternarPendencia={alternarConcluida}
                        />
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                </Card>
              )}
            </div>
          )}
        </div>

        <AtracaoEditor
          key={atracaoEditando?.id}
          aberto={!!atracaoEditando}
          onClose={() => setAtracaoEditando(null)}
          atracao={atracaoEditando}
          destinosDaCidade={destinosDaCidadeDaAtracaoEditando}
          atracoes={atracoes}
          pendenciaRelacionada={atracaoEditando ? encontrarPendencia(atracaoEditando, pendencias) : null}
          onSalvar={atualizarAtracao}
          onExcluir={removerAtracao}
          acomodacoes={acomodacoes}
        />

        {preencherDiaDestino && (
          <PreencherDia
            aberto={!!preencherDiaDestino}
            onClose={() => { setPreencherDiaDestino(null); recarregar() }}
            destino={preencherDiaDestino}
            acomodacao={acomodacoes.find((a) => a.cidade === preencherDiaDestino.cidade)}
            onAdicionar={handleAdicionar}
            atracoes={atracoes}
          />
        )}

        <QuickAdd
          aberto={quickAddAberto}
          onClose={() => setQuickAddAberto(false)}
          destinos={destinos}
          atracoes={atracoes}
          onAdicionarAtracao={handleAdicionar}
          onCriarPendencia={criarPendencia}
        />
      </div>
    </PullToRefresh>
  )
}
