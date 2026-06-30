import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useViagem } from '../../hooks/useViagem'
import { usePendencias } from '../../hooks/usePendencias'
import { useDias } from '../../hooks/useDias'
import { useHospedagens } from '../../hooks/useHospedagens'
import { useToast } from '../../contexts/ToastContext'
import PendenciaItem from './PendenciaItem'
import PendenciaEditor from './PendenciaEditor'
import PendenciaAdder from './PendenciaAdder'
import Card from '../ui/Card'
import PullToRefresh from '../ui/PullToRefresh'
import { StaggerContainer, StaggerItem } from '../ui/Stagger'
import { Bed, Plane, Plus, ArrowRight } from 'lucide-react'
import { Skeleton, SkeletonPill, SkeletonCard, SkeletonListItem } from '../ui/Skeleton'
import AcomodacaoEditor from '../roteiro/AcomodacaoEditor'
import TransportEditor from '../roteiro/TransportEditor'
import { supabase } from '../../lib/supabase'

const CATEGORIAS = [
  { id: 'atracoes', label: 'Atrações' },
  { id: 'documentacao', label: 'Documentação' },
  { id: 'transporte', label: 'Transporte' },
]

const FILTROS = [
  { id: null, label: 'Todas' },
  { id: 'acomodacao', label: 'Acomodações' },
  ...CATEGORIAS,
]

export default function PendenciasView() {
  const { viagemId } = useViagem()
  const { pendencias, loading, totalPendentes, criarPendencia, alterarEstado, atualizarPendencia, removerPendencia, recarregar } =
    usePendencias(viagemId)
  const { dias, recarregar: recarregarDias, removerTransporte } = useDias(viagemId)
  const { hospedagens, salvar } = useHospedagens(viagemId)
  const addToast = useToast()
  const [pendenciaEditando, setPendenciaEditando] = useState(null)
  const [adicionando, setAdicionando] = useState(false)
  const [filtroAtivo, setFiltroAtivo] = useState(null)
  const [acomodacaoEditando, setAcomodacaoEditando] = useState(null)
  const [transporteEditando, setTransporteEditando] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const abrirId = location.state?.abrirPendenciaId
    if (abrirId && pendencias.length > 0) {
      const encontrada = pendencias.find((p) => p.id === abrirId)
      if (encontrada) setPendenciaEditando(encontrada)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location, pendencias, navigate])

  const cidadesLista = useMemo(() => {
    const vistas = new Set()
    return dias.filter((d) => {
      if (vistas.has(d.cidade)) return false
      vistas.add(d.cidade)
      return true
    }).map((d) => ({ nome: d.cidade, pais: d.pais, flag: d.flag_emoji }))
  }, [dias])

  const cidadesSemAcomodacao = useMemo(() => {
    const vistas = new Set()
    return dias.filter((d) => {
      if (vistas.has(d.cidade)) return false
      vistas.add(d.cidade)
      return !hospedagens.some((a) => a.cidade === d.cidade)
    })
  }, [dias, hospedagens])

  const todasTransicoes = useMemo(() => {
    const resultado = []
    const vistas = new Set()
    const ordenados = [...dias].sort((a, b) => a.data.localeCompare(b.data))
    for (let i = 1; i < ordenados.length; i++) {
      const ant = ordenados[i - 1]
      const atu = ordenados[i]
      if (ant.cidade !== atu.cidade) {
        const chave = `${ant.cidade}-${atu.cidade}`
        if (!vistas.has(chave)) {
          vistas.add(chave)
          const transportes = ant.transportes ?? []
          resultado.push({
            cidadeOrigem: ant.cidade,
            paisOrigem: ant.pais,
            flagOrigem: ant.flag_emoji,
            cidadeDestino: atu.cidade,
            paisDestino: atu.pais,
            flagDestino: atu.flag_emoji,
            destinoOrigemId: ant.id,
            destinoDestinoId: atu.id,
            concluida: transportes.length > 0,
            transporte: transportes[0] || null,
          })
        }
      }
    }
    return resultado
  }, [dias])

  async function handleSalvarTransporte(dados) {
    const { error } = await supabase.from('transportes').insert({ ...dados, viagem_id: viagemId })
    if (!error) {
      await recarregarDias()
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

  if (loading) return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-32 mt-1.5" />
        </div>
        <Skeleton className="w-11 h-11 rounded-full" />
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        {[1, 2, 3, 4].map((i) => <SkeletonPill key={i} className="w-24" />)}
      </div>
      {[1, 2].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <SkeletonCard>
            {[1, 2].map((j) => <SkeletonListItem key={j} />)}
          </SkeletonCard>
        </div>
      ))}
    </div>
  )

  const temAcomodacao = cidadesSemAcomodacao.length > 0
  const temTransicao = todasTransicoes.length > 0

  async function handleToggle(id, concluida) {
    await alterarEstado(id, concluida)
    addToast(concluida ? 'Pendência concluída' : 'Pendência reaberta')
  }

  async function handleCriarPendencia(dados) {
    const result = await criarPendencia(dados)
    if (!result.error) addToast('Pendência adicionada')
    return result
  }

  return (
    <PullToRefresh onRefresh={recarregar}>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-[34px] font-bold tracking-tight">Pendências</h1>
            <p className="text-muted text-[15px] mt-0.5">{totalPendentes} pendência{totalPendentes !== 1 ? 's' : ''} pendente{totalPendentes !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setAdicionando(true)}
            className="tap-scale w-11 h-11 rounded-full bg-blue text-white flex items-center justify-center"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
          {FILTROS.map((f) => (
            <button
              key={f.id ?? 'todas'}
              onClick={() => setFiltroAtivo(f.id)}
              className={`tap-scale flex-shrink-0 px-3.5 py-1.5 rounded-full text-[14px] font-semibold ${
                filtroAtivo === f.id ? 'bg-blue text-white' : 'bg-fill text-text'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {CATEGORIAS.map((cat) => {
          if (filtroAtivo && filtroAtivo !== cat.id) return null
          const itens = pendencias.filter((p) => p.categoria === cat.id)
          if (itens.length === 0) return null
          return (
            <div key={cat.id}>
              <h2 className="text-muted text-[13px] font-semibold uppercase tracking-wide mb-3 px-1">{cat.label}</h2>
              <Card>
                <StaggerContainer>
                  {itens.map((p) => (
                    <StaggerItem key={p.id}>
                      <PendenciaItem
                        key={p.id}
                        pendencia={p}
                        onToggle={handleToggle}
                        onAbrirEditor={setPendenciaEditando}
                      />
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </Card>
            </div>
          )
        })}

        {(!filtroAtivo || filtroAtivo === 'acomodacao') && temAcomodacao && (
          <div>
            <h2 className="text-muted text-[13px] font-semibold uppercase tracking-wide mb-3 px-1">Acomodações · {cidadesSemAcomodacao.length}</h2>
            <Card>
              <StaggerContainer>
                {cidadesSemAcomodacao.map((cidade) => (
                  <StaggerItem key={cidade.cidade}>
                    <button
                      onClick={() => setAcomodacaoEditando({ cidade: cidade.cidade, pais: cidade.pais })}
                      className="tap-scale w-full flex items-center gap-3 py-3 px-4 border-b border-separator last:border-b-0 text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-orange/15 flex items-center justify-center flex-shrink-0">
                        <Bed className="w-5 h-5 text-orange" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[16px]">
                          {cidade.flag_emoji} {cidade.cidade}
                        </p>
                        <p className="text-[13px] text-muted">Reservar acomodação</p>
                      </div>
                      <span className="text-muted text-sm font-semibold flex items-center gap-1">
                        Adicionar <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </Card>
          </div>
        )}

        {(!filtroAtivo || filtroAtivo === 'transporte') && temTransicao && (
          <div>
            <h2 className="text-muted text-[13px] font-semibold uppercase tracking-wide mb-3 px-1">Transporte entre cidades · {todasTransicoes.filter((t) => !t.concluida).length}</h2>
            <Card>
              <StaggerContainer>
                {todasTransicoes.map((t) => (
                  <StaggerItem key={`${t.cidadeOrigem}-${t.cidadeDestino}`}>
                    <button
                      onClick={() => setTransporteEditando(t)}
                      className="tap-scale w-full flex items-center gap-3 py-3 px-4 border-b border-separator last:border-b-0 text-left"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${t.concluida ? 'bg-green/15' : 'bg-blue/10'}`}>
                        {t.concluida ? (
                          <span className="text-green text-lg leading-none">✓</span>
                        ) : (
                          <Plane className="w-5 h-5 text-blue" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[16px]">
                          {t.flagOrigem} {t.cidadeOrigem} → {t.flagDestino} {t.cidadeDestino}
                        </p>
                        <p className={`text-[13px] ${t.concluida ? 'text-green' : 'text-muted'}`}>
                          {t.concluida ? 'Transporte definido' : 'Definir transporte'}
                        </p>
                      </div>
                      <span className={`text-sm font-semibold flex items-center gap-1 ${t.concluida ? 'text-green' : 'text-muted'}`}>
                        {t.concluida ? 'Editar' : 'Adicionar'} <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </Card>
          </div>
        )}

        <PendenciaEditor
          key={pendenciaEditando?.id}
          aberto={!!pendenciaEditando}
          onClose={() => setPendenciaEditando(null)}
          pendencia={pendenciaEditando}
          onSalvar={atualizarPendencia}
          onExcluir={removerPendencia}
          cidades={cidadesLista}
          dias={dias.sort((a, b) => a.data.localeCompare(b.data)).map((d) => {
            const data = new Date(d.data + 'T00:00:00')
            return { id: d.id, label: `${data.getDate()}/${data.getMonth() + 1}`, cidade: d.cidade, flag: d.flag_emoji }
          })}
        />

        <PendenciaAdder
          aberto={adicionando}
          onClose={() => setAdicionando(false)}
          onSalvar={handleCriarPendencia}
          contextoPadrao={{
            tipo: 'viagem',
            cidades: [...new Map(dias.map((d) => [d.cidade, { nome: d.cidade, flag: d.flag_emoji }])).values()],
            dias: dias.sort((a, b) => a.data.localeCompare(b.data)).map((d) => {
              const data = new Date(d.data + 'T00:00:00')
              return {
                id: d.id,
                label: `${data.getDate()}/${data.getMonth() + 1}`,
                cidade: d.cidade,
                flag: d.flag_emoji,
              }
            }),
          }}
        />

        {acomodacaoEditando && (
          <AcomodacaoEditor
            aberto={!!acomodacaoEditando}
            onClose={() => setAcomodacaoEditando(null)}
            acomodacao={null}
            cidade={acomodacaoEditando.cidade}
            pais={acomodacaoEditando.pais}
            cidades={cidadesLista}
            onSalvar={async (dados) => {
              const result = await salvar(dados)
              if (!result.error) {
                setAcomodacaoEditando(null)
                addToast('Acomodação adicionada')
              }
              return result
            }}
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
            transporteExistente={transporteEditando.transporte || null}
            onSalvar={handleSalvarTransporte}
            onExcluir={handleExcluirTransporte}
          />
        )}
      </div>
    </PullToRefresh>
  )
}
