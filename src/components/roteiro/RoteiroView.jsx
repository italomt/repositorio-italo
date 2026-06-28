import { useState, useMemo, useRef, useCallback } from 'react'
import { useDestinos } from '../../hooks/useDestinos'
import { useAcomodacoes } from '../../hooks/useAcomodacoes'
import { useAtracoes } from '../../hooks/useAtracoes'
import { inicializarMapaGeral } from '../../lib/maps'
import DayCard from './DayCard'
import DayAdder from './DayAdder'
import AcomodacaoEditor from './AcomodacaoEditor'
import Card from '../ui/Card'
import PullToRefresh from '../ui/PullToRefresh'
import { Bed, Plus, Map } from 'lucide-react'
import { Skeleton, SkeletonCard } from '../ui/Skeleton'

export default function RoteiroView() {
  const { destinos, loading, atualizarDestino, adicionarDestino, recarregar } = useDestinos()
  const { acomodacoes, loading: loadingAcom, salvar: salvarAcomodacao } = useAcomodacoes()
  const { atracoes } = useAtracoes()
  const [adicionandoDia, setAdicionandoDia] = useState(false)
  const [acomodacaoEditando, setAcomodacaoEditando] = useState(null)
  const [mapaAberto, setMapaAberto] = useState(false)
  const mapaRef = useRef(null)
  const mapaInstance = useRef(null)

  const abrirMapa = useCallback(async () => {
    setMapaAberto(true)
    setTimeout(async () => {
      if (mapaRef.current && !mapaInstance.current) {
        mapaInstance.current = await inicializarMapaGeral(destinos, atracoes, mapaRef.current)
      }
    }, 300)
  }, [destinos, atracoes])

  const fecharMapa = useCallback(() => {
    setMapaAberto(false)
    mapaInstance.current = null
  }, [])

  const cidadesUnicas = useMemo(() => {
    const vistas = new Set()
    return destinos.filter((d) => {
      if (vistas.has(d.cidade)) return false
      vistas.add(d.cidade)
      return true
    })
  }, [destinos])

  if (loading) return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="w-11 h-11 rounded-full" />
      </div>
      <Skeleton className="h-4 w-56" />
      <div className="h-[6px] bg-fill rounded-full overflow-hidden">
        <Skeleton className="h-full w-1/3 rounded-full" />
      </div>
      <SkeletonCard>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 py-3.5 px-4 border-b border-separator last:border-b-0">
            <div className="flex flex-col items-center gap-1 flex-shrink-0 w-10">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="h-3 w-6" />
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="w-5 h-5 rounded-full" />
          </div>
        ))}
      </SkeletonCard>
    </div>
  )

  const hojeISO = new Date().toISOString().slice(0, 10)
  const diasPassados = destinos.filter((d) => d.data < hojeISO).length

  return (
    <PullToRefresh onRefresh={recarregar}>
      <div className="space-y-5">
        <div>
          <div className="flex items-center justify-between">
            <h1 className="font-display text-[34px] font-bold tracking-tight">Roteiro</h1>
            <button
              onClick={() => setAdicionandoDia(true)}
              className="tap-scale w-11 h-11 rounded-full bg-blue text-white flex items-center justify-center flex-shrink-0"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <p className="text-muted text-[15px] mt-0.5 flex items-center gap-2">
            <span>{diasPassados} de {destinos.length} dias concluídos</span>
            <span className="text-muted2">·</span>
            <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" /> {cidadesUnicas.length - acomodacoes.length} acomodações pendentes</span>
          </p>
          <div className="h-[6px] bg-fill rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-blue rounded-full transition-all duration-500 ease-ios"
              style={{ width: `${(diasPassados / destinos.length) * 100}%` }}
            />
          </div>
        </div>

        <Card>
          {destinos.map((destino, i) => (
            <DayCard
              key={destino.id}
              destino={destino}
              indexDia={i}
              totalDias={destinos.length}
              onAtualizar={atualizarDestino}
              isLast={i === destinos.length - 1}
            />
          ))}
        </Card>

        <button
          onClick={abrirMapa}
          className="tap-scale w-full flex items-center gap-3 py-3.5 px-4 rounded-2xl bg-fill text-left"
        >
          <div className="w-10 h-10 rounded-full bg-green/10 flex items-center justify-center flex-shrink-0">
            <Map className="w-5 h-5 text-green" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[16px]">Mapa geral</p>
            <p className="text-[13px] text-muted">{cidadesUnicas.length} cidades · {destinos.length} dias</p>
          </div>
          <span className="text-muted text-lg leading-none">›</span>
        </button>

        {mapaAberto && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" onClick={fecharMapa}>
            <div
              className="bg-card w-full sm:max-w-2xl h-[70vh] sm:h-[80vh] rounded-t-2xl sm:rounded-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <h2 className="font-display text-xl font-bold">Mapa geral</h2>
                <button onClick={fecharMapa} className="tap-scale w-8 h-8 rounded-full bg-fill flex items-center justify-center text-muted text-lg leading-none">✕</button>
              </div>
              <div ref={mapaRef} className="w-full h-[calc(100%-52px)]" />
            </div>
          </div>
        )}

        {!loadingAcom && cidadesUnicas.length > 0 && (
          <div>
            <h2 className="text-muted text-[13px] font-semibold uppercase tracking-wide mb-2 px-1">
              Acomodações
            </h2>
            <Card>
              {cidadesUnicas.map((cidade) => {
                const acomodacao = acomodacoes.find((a) => a.cidade === cidade.cidade)
                return (
                  <button
                    key={cidade.cidade}
                    onClick={() => setAcomodacaoEditando({ cidade: cidade.cidade, pais: cidade.pais, ...acomodacao })}
                    className="tap-scale w-full flex items-center gap-3 py-3 px-4 border-b border-separator last:border-b-0 text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue/10 flex items-center justify-center flex-shrink-0">
                      <Bed className="w-5 h-5 text-blue" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {acomodacao ? (
                        <>
                          <p className="font-semibold text-[16px] truncate">{acomodacao.nome}</p>
                          <p className="text-[13px] text-muted">
                            {cidade.cidade}{acomodacao.preco_noite ? ` · €${acomodacao.preco_noite}/noite` : ''}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold text-[16px] text-muted">{cidade.cidade}</p>
                          <p className="text-[13px] text-muted">Adicionar acomodação</p>
                        </>
                      )}
                    </div>
                    <span className="text-muted text-lg leading-none">›</span>
                  </button>
                )
              })}
            </Card>
          </div>
        )}

        <DayAdder aberto={adicionandoDia} onClose={() => setAdicionandoDia(false)} onSalvar={adicionarDestino} />

        {acomodacaoEditando && (
          <AcomodacaoEditor
            aberto={!!acomodacaoEditando}
            onClose={() => setAcomodacaoEditando(null)}
            acomodacao={acomodacaoEditando.id ? acomodacaoEditando : null}
            cidade={acomodacaoEditando.cidade}
            pais={acomodacaoEditando.pais}
            onSalvar={salvarAcomodacao}
          />
        )}
      </div>
    </PullToRefresh>
  )
}
