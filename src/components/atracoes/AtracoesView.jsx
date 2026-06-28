import { useMemo, useState } from 'react'
import { useDestinos } from '../../hooks/useDestinos'
import { useAtracoes } from '../../hooks/useAtracoes'
import { usePendencias } from '../../hooks/usePendencias'
import { useAcomodacoes } from '../../hooks/useAcomodacoes'
import { useAuthContext } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { otimizarRota, gerarHorarios } from '../../lib/geo'
import AtracaoCard from './AtracaoCard'
import AtracaoEditor from './AtracaoEditor'
import MapaDoDia from './MapaDoDia'
import QuickAdd from './QuickAdd'
import Card from '../ui/Card'
import PullToRefresh from '../ui/PullToRefresh'
import { StaggerContainer, StaggerItem } from '../ui/Stagger'
import { Map, Route } from 'lucide-react'

function encontrarPendencia(atracao, pendencias) {
  return (
    pendencias.find((p) => p.atracao_id === atracao.id) ??
    pendencias.find(
      (p) => !p.concluida && p.categoria === 'atracoes' && p.titulo.toLowerCase().includes(atracao.nome.toLowerCase()),
    )
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
  const [quickAddAberto, setQuickAddAberto] = useState(false)
  const [verMapa, setVerMapa] = useState(false)
  const [atracaoEditando, setAtracaoEditando] = useState(null)

  const cidades = useMemo(() => [...new Set(destinos.map((d) => d.cidade))], [destinos])
  const cidadeSelecionada = cidadeAtiva ?? cidades[0]

  const destinosDaCidade = destinos.filter((d) => d.cidade === cidadeSelecionada)

  const destinosDaCidadeDaAtracaoEditando = useMemo(() => {
    if (!atracaoEditando) return []
    const cidadeDaAtracao = destinos.find((d) => d.id === atracaoEditando.destino_id)?.cidade
    return destinos.filter((d) => d.cidade === cidadeDaAtracao)
  }, [atracaoEditando, destinos])
  const atracoesDaCidade = atracoes
    .filter((a) => destinosDaCidade.some((d) => d.id === a.destino_id))
    .sort((a, b) => (a.horario_previsto ?? '99:99').localeCompare(b.horario_previsto ?? '99:99'))

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
    if (atracoesDoDia.length < 2) {
      addToast('São necessárias pelo menos 2 atrações com endereço', 'info')
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

  if (loadingDestinos || loadingAtracoes) return <p className="text-muted text-center mt-10">Carregando...</p>

  return (
    <PullToRefresh onRefresh={recarregar}>
      <div className="space-y-4">
        <h1 className="font-display text-[34px] font-bold tracking-tight">Atrações</h1>

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

        <button
          onClick={() => setVerMapa((v) => !v)}
          className="tap-scale w-full bg-fill text-blue font-semibold text-[15px] py-3 rounded-ios"
        >
          {verMapa ? 'Esconder mapa' : <><Map className="w-4 h-4 inline-block mr-1" /> Ver no mapa</>}
        </button>

        {verMapa && (
          <Card className="p-3">
            <MapaDoDia atracoes={atracoesDaCidade} />
          </Card>
        )}

        <div>
          {destinosDaCidade.length === 0 ? (
            <p className="text-muted text-[15px] py-6 text-center">Nenhuma atração cadastrada para {cidadeSelecionada}.</p>
          ) : (
            destinosDaCidade.map((destino) => {
              const atracoesDoDia = atracoesDaCidade.filter((a) => a.destino_id === destino.id)
              if (atracoesDoDia.length === 0) return null
              const temCoordenadas = atracoesDoDia.some((a) => a.latitude && a.longitude)
              return (
                <div key={destino.id} className="mb-5">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-muted text-[13px] font-semibold uppercase tracking-wide">
                      {new Date(destino.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', weekday: 'short' }).replace('.', '')}
                    </span>
                    {temCoordenadas && atracoesDoDia.length >= 2 && (
                      <button
                        onClick={() => handleOtimizarDia(destino.id, atracoesDoDia)}
                        className="tap-scale flex items-center gap-1 text-[12px] font-semibold text-blue bg-blue/10 px-2.5 py-1 rounded-full"
                      >
                        <Route className="w-3.5 h-3.5" /> Otimizar rota
                      </button>
                    )}
                  </div>
                  <Card>
                    <StaggerContainer>
                      {atracoesDoDia.map((a) => (
                        <StaggerItem key={a.id}>
                          <AtracaoCard
                            atracao={a}
                            pendenciaRelacionada={encontrarPendencia(a, pendencias)}
                            onAbrirEditor={setAtracaoEditando}
                            onAlternarPendencia={alternarConcluida}
                          />
                        </StaggerItem>
                      ))}
                    </StaggerContainer>
                  </Card>
                </div>
              )
            })
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

        <button
          onClick={() => setQuickAddAberto(true)}
          className="tap-scale fixed bottom-24 right-4 rounded-full w-[58px] h-[58px] bg-blue text-white text-[28px] font-light shadow-ios-lg z-30 flex items-center justify-center"
        >
          +
        </button>

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
