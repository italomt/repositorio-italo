import { useState, useMemo } from 'react'
import { useViagem } from '../../hooks/useViagem'
import { useDias } from '../../hooks/useDias'
import { useAtracoes } from '../../hooks/useAtracoes'
import { useHospedagens } from '../../hooks/useHospedagens'
import { useGastos } from '../../hooks/useGastos'
import { usePendencias } from '../../hooks/usePendencias'
import { useToast } from '../../contexts/ToastContext'
import { formatarBRL } from '../../lib/cambio'
import { supabase } from '../../lib/supabase'
import AtracaoCard from '../atracoes/AtracaoCard'
import AtracaoEditor from '../atracoes/AtracaoEditor'
import QuickAdd from '../atracoes/QuickAdd'
import PreencherDia from '../atracoes/PreencherDia'
import PendenciaItem from '../pendencias/PendenciaItem'
import PendenciaEditor from '../pendencias/PendenciaEditor'
import GastoForm from '../financas/GastoForm'
import AcomodacaoEditor from '../roteiro/AcomodacaoEditor'
import TransportEditor, { MAPA_TIPO_TRANSPORTE } from '../roteiro/TransportEditor'
import DayAdder from '../roteiro/DayAdder'
import Card from '../ui/Card'
import Modal from '../ui/Modal'
import PullToRefresh from '../ui/PullToRefresh'
import { Skeleton, SkeletonCard } from '../ui/Skeleton'
import TransporteIcon from '../ui/TransporteIcon'
import {
  ChevronDown, ChevronRight, Plus, Bed, Map as MapIcon,
} from 'lucide-react'

export default function RoteiroView() {
  const { viagem, viagemId } = useViagem()
  const { dias, adicionarDia, removerTransporte, recarregar: recarregarDias } = useDias(viagemId)
  const { atracoes, adicionarAtracao, atualizarAtracao, removerAtracao } = useAtracoes(viagemId)
  const { hospedagens, salvar: salvarHosp, remover: removerHosp } = useHospedagens(viagemId)
  const { gastos, adicionarGasto } = useGastos(viagemId)
  const { pendencias, alternarConcluida, atualizarPendencia, removerPendencia, criarPendencia } = usePendencias(viagemId)
  const addToast = useToast()

  const [expandedCidades, setExpandedCidades] = useState({})
  const [expandedDias, setExpandedDias] = useState({})
  const [adicionandoDia, setAdicionandoDia] = useState(false)
  const [quickAddCidade, setQuickAddCidade] = useState(null)
  const [preencherDiaCidade, setPreencherDiaCidade] = useState(null)
  const [atracaoEditando, setAtracaoEditando] = useState(null)
  const [gastoEditando, setGastoEditando] = useState(null)
  const [pendenciaEditando, setPendenciaEditando] = useState(null)
  const [acomodacaoEditando, setAcomodacaoEditando] = useState(null)
  const [transporteEditando, setTransporteEditando] = useState(null)

  const cidadesAgrupadas = useMemo(() => {
    const grupos = []
    let atual = null
    dias.forEach((d, i) => {
      if (!atual || atual.cidade !== d.cidade) {
        const anterior = dias[i - 1]
        let transportes = anterior?.transportes ?? []
        atual = {
          cidade: d.cidade,
          pais: d.pais,
          flagEmoji: d.flag_emoji,
          dias: [],
          transportesChegada: transportes,
        }
        grupos.push(atual)
      }
      atual.dias.push(d)
    })
    return grupos
  }, [dias])

  const idsTodas = new Set(dias.map((d) => d.id))
  const hojeISO = new Date().toISOString().slice(0, 10)
  const diasPassados = dias.filter((d) => d.data < hojeISO).length
  const progressoPct = dias.length > 0 ? Math.round((diasPassados / dias.length) * 100) : 0

  function toggleCidade(cidade) {
    setExpandedCidades((p) => ({ ...p, [cidade]: !p[cidade] }))
  }

  function toggleDia(diaId) {
    setExpandedDias((p) => ({ ...p, [diaId]: !p[diaId] }))
  }

  async function handleSalvarTransporte(dados) {
    const { error } = await supabase.from('transportes').insert({ ...dados, viagem_id: viagemId })
    if (!error) { await recarregarDias(); setTransporteEditando(null); addToast('Transporte adicionado') }
    return { error }
  }

  async function handleExcluirTransporte(id) {
    await removerTransporte(id)
    setTransporteEditando(null)
    addToast('Transporte excluído', 'info')
  }

  if (!viagemId) return (
    <div className="flex flex-col items-center justify-center pt-24 text-center">
      <div className="w-20 h-20 rounded-full bg-blue/10 flex items-center justify-center mb-5"><MapIcon className="w-10 h-10 text-blue" /></div>
      <h2 className="font-display text-[26px] font-bold tracking-tight">Nenhuma viagem</h2>
      <p className="text-muted text-[15px] mt-1">Crie sua primeira viagem para começar.</p>
    </div>
  )

  return (
    <PullToRefresh onRefresh={recarregarDias}>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-[34px] font-bold tracking-tight">{viagem?.nome || 'Roteiro'}</h1>
            <p className="text-muted text-[15px] mt-0.5">
              {cidadesAgrupadas.length} cidades · {dias.length} dias · {atracoes.length} atrações
            </p>
          </div>
          <button onClick={() => setAdicionandoDia(true)} aria-label="Adicionar dia" className="tap-scale w-11 h-11 rounded-full bg-blue text-white flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="h-[6px] bg-border rounded-full overflow-hidden">
          <div className="h-full bg-blue rounded-full transition-all duration-500 ease-ios" style={{ width: `${progressoPct}%` }} />
        </div>

        {dias.length === 0 && (
          <Card><div className="py-12 text-center text-muted"><MapIcon className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-[15px]">Nenhum dia no roteiro</p><p className="text-[13px] mt-1">Toque em + para adicionar o primeiro destino</p></div></Card>
        )}

        {cidadesAgrupadas.map((grupo, gi) => {
          const expanded = expandedCidades[grupo.cidade]
          const acomodacao = hospedagens.find((h) => h.cidade === grupo.cidade)
          const gastosCidade = gastos.filter((g) => grupo.dias.some((d) => d.id === g.destino_id))
          const totalGasto = gastosCidade.reduce((s, g) => s + (g.valor_brl ?? 0), 0)
          const cidadeAnterior = gi > 0 ? cidadesAgrupadas[gi - 1].cidade : null

          return (
            <div key={grupo.cidade}>
              {gi > 0 && (
                <div className="flex items-start gap-3 py-2 pl-3">
                  <div className="w-11 h-11 rounded-full bg-fill border-2 border-card flex items-center justify-center shrink-0">
                    {grupo.transportesChegada.length > 0 ? (
                      <TransporteIcon tipo={grupo.transportesChegada[0].tipo} />
                    ) : (
                      <button
                        onClick={() => {
                          const antGrupo = cidadesAgrupadas[gi - 1]
                          setTransporteEditando({
                            cidadeOrigem: cidadeAnterior,
                            cidadeDestino: grupo.cidade,
                            destinoOrigemId: antGrupo.dias[antGrupo.dias.length - 1]?.id,
                            destinoDestinoId: grupo.dias[0]?.id,
                          })
                        }}
                        className="tap-scale w-full h-full rounded-full flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4 text-blue" />
                      </button>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-2">
                    {grupo.transportesChegada.length > 0 && (
                      <button
                        onClick={() => setTransporteEditando({
                          ...grupo.transportesChegada[0],
                          cidadeOrigem: cidadeAnterior,
                          cidadeDestino: grupo.cidade,
                          destinoOrigemId: cidadesAgrupadas[gi - 1]?.dias?.[cidadesAgrupadas[gi - 1].dias.length - 1]?.id,
                          destinoDestinoId: grupo.dias[0]?.id,
                        })}
                        className="tap-scale text-[13px] text-muted text-left w-full"
                      >
                        {grupo.transportesChegada[0].operadora ? `${grupo.transportesChegada[0].operadora} · ` : ''}
                        {MAPA_TIPO_TRANSPORTE[grupo.transportesChegada[0].tipo] || grupo.transportesChegada[0].tipo}
                        {grupo.transportesChegada[0].valor ? ` · R$ ${formatarBRL(grupo.transportesChegada[0].valor)}` : ''}
                      </button>
                    )}
                    {grupo.transportesChegada.length === 0 && (
                      <p className="text-[13px] text-muted">Sem transporte definido</p>
                    )}
                  </div>
                </div>
              )}

              <Card>
                <button
                  onClick={() => toggleCidade(grupo.cidade)}
                  className="tap-scale w-full flex items-center gap-3 p-4 text-left"
                >
                  <span className="text-2xl">{grupo.flagEmoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[17px]">{grupo.cidade}</p>
                    <p className="text-[13px] text-muted">{grupo.pais} · {grupo.dias.length} dia{grupo.dias.length !== 1 ? 's' : ''}</p>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-muted transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
                </button>

                {expanded && (
                  <div className="border-t border-separator">
                    {!acomodacao && (
                      <button
                        onClick={() => setAcomodacaoEditando({ cidade: grupo.cidade, pais: grupo.pais })}
                        className="tap-scale w-full flex items-center gap-3 py-3 px-4 border-b border-separator text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-orange/10 flex items-center justify-center shrink-0"><Bed className="w-4 h-4 text-orange" /></div>
                        <span className="text-[14px] text-orange font-medium">Adicionar hospedagem</span>
                        <ChevronRight className="w-4 h-4 text-muted ml-auto" />
                      </button>
                    )}

                    {grupo.dias.map((dia) => {
                      const diaExpanded = expandedDias[dia.id]
                      const atracoesDoDia = atracoes.filter((a) => a.destino_id === dia.id)
                      const gastosDoDia = gastos.filter((g) => g.destino_id === dia.id)
                      const data = new Date(dia.data + 'T00:00:00')
                      const diaLabel = data.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })

                      return (
                        <div key={dia.id}>
                          <button
                            onClick={() => toggleDia(dia.id)}
                            className="tap-scale w-full flex items-center gap-3 py-3 px-4 border-b border-separator text-left"
                          >
                            <div className="w-10 h-10 rounded-full bg-blue/10 flex items-center justify-center shrink-0">
                              <span className="text-[15px] font-bold tabular-nums text-blue">{data.getDate()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[15px] capitalize">{diaLabel}</p>
                              <p className="text-[12px] text-muted">
                                {atracoesDoDia.length} atração{atracoesDoDia.length !== 1 ? 'ões' : ''}
                                {gastosDoDia.length > 0 ? ` · R$ ${formatarBRL(gastosDoDia.reduce((s, g) => s + (g.valor_brl ?? 0), 0))}` : ''}
                              </p>
                            </div>
                            <ChevronRight className={`w-4 h-4 text-muted transition-transform duration-200 ${diaExpanded ? 'rotate-90' : ''}`} />
                          </button>

                          {diaExpanded && (
                            <div className="border-b border-separator px-4 py-3 space-y-2">
                              {atracoesDoDia.map((a) => (
                                <AtracaoCard
                                  key={a.id}
                                  atracao={a}
                                  cidade={grupo.cidade}
                                  onAbrirEditor={setAtracaoEditando}
                                />
                              ))}
                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={() => setQuickAddCidade({ ...dia, cidade: grupo.cidade })}
                                  className="tap-scale flex-1 py-2 rounded-ios text-[13px] font-medium bg-fill text-text"
                                >
                                  + Atração
                                </button>
                                <button
                                  onClick={() => setPreencherDiaCidade({ ...dia, cidade: grupo.cidade })}
                                  className="tap-scale flex-1 py-2 rounded-ios text-[13px] font-medium bg-fill text-blue"
                                >
                                  ✨ IA
                                </button>
                                <button
                                  onClick={() => {
                                    setGastoEditando({ destino_id: dia.id, data_gasto: dia.data })
                                  }}
                                  className="tap-scale flex-1 py-2 rounded-ios text-[13px] font-medium bg-fill text-green"
                                >
                                  + Gasto
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            </div>
          )
        })}

        <DayAdder aberto={adicionandoDia} onClose={() => setAdicionandoDia(false)} onSalvar={adicionarDia} />

        {quickAddCidade && (
          <QuickAdd
            aberto={!!quickAddCidade}
            onClose={() => setQuickAddCidade(null)}
            destinos={dias}
            atracoes={atracoes}
            onAdicionarAtracao={adicionarAtracao}
            onCriarPendencia={criarPendencia}
          />
        )}

        {preencherDiaCidade && (
          <PreencherDia
            aberto={!!preencherDiaCidade}
            onClose={() => { setPreencherDiaCidade(null) }}
            destino={preencherDiaCidade}
            atracoes={atracoes}
            onAdicionarAtracoes={async (lista) => { for (const a of lista) { await adicionarAtracao(a) } }}
          />
        )}

        {atracaoEditando && (
          <AtracaoEditor
            aberto={!!atracaoEditando}
            onClose={() => setAtracaoEditando(null)}
            atracao={atracaoEditando}
            destinosDaCidade={dias.filter((d) => d.cidade === atracaoEditando.cidade || dias.find((x) => x.id === atracaoEditando.destino_id)?.cidade)}
            atracoes={atracoes}
            onSalvar={atualizarAtracao}
            onExcluir={removerAtracao}
            acomodacoes={hospedagens}
          />
        )}

        {gastoEditando && (
          <Modal aberto={!!gastoEditando} onClose={() => setGastoEditando(null)} titulo="Novo gasto">
            <GastoForm
              key={gastoEditando?.id || 'novo'}
              destinos={dias}
              cidadeAtual={dias.find((d) => d.id === gastoEditando.destino_id)?.cidade}
              gastoExistente={gastoEditando.id ? gastoEditando : null}
              onSalvar={async (g) => {
                await adicionarGasto(g)
                setGastoEditando(null)
                addToast('Gasto adicionado')
              }}
              onCancelar={() => setGastoEditando(null)}
              compact
            />
          </Modal>
        )}

        {pendenciaEditando && (
          <PendenciaEditor
            aberto={!!pendenciaEditando}
            onClose={() => setPendenciaEditando(null)}
            pendencia={pendenciaEditando}
            onSalvar={atualizarPendencia}
            onExcluir={removerPendencia}
            cidades={[...new Map(dias.map((d) => [d.cidade, { nome: d.cidade, flag: d.flag_emoji }])).values()]}
            dias={dias.map((d) => ({ id: d.id, label: `${new Date(d.data + 'T00:00:00').getDate()}/${new Date(d.data + 'T00:00:00').getMonth() + 1}`, cidade: d.cidade, flag: d.flag_emoji }))}
          />
        )}

        {acomodacaoEditando && (
          <AcomodacaoEditor
            aberto={!!acomodacaoEditando}
            onClose={() => setAcomodacaoEditando(null)}
            acomodacao={acomodacaoEditando.id ? acomodacaoEditando : null}
            cidade={acomodacaoEditando.cidade}
            pais={acomodacaoEditando.pais}
            cidades={cidadesAgrupadas.map((g) => ({ nome: g.cidade, pais: g.pais, flag: g.flagEmoji }))}
            onSalvar={salvarHosp}
            onExcluir={removerHosp}
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
