import { useState, useMemo } from 'react'
import { useDestinos } from '../../hooks/useDestinos'
import { useAcomodacoes } from '../../hooks/useAcomodacoes'
import DayCard from './DayCard'
import DayAdder from './DayAdder'
import AcomodacaoEditor from './AcomodacaoEditor'
import Card from '../ui/Card'
import { Bed, Plus } from 'lucide-react'

export default function RoteiroView() {
  const { destinos, loading, atualizarDestino, adicionarDestino } = useDestinos()
  const { acomodacoes, loading: loadingAcom, salvar: salvarAcomodacao } = useAcomodacoes()
  const [adicionandoDia, setAdicionandoDia] = useState(false)
  const [acomodacaoEditando, setAcomodacaoEditando] = useState(null)

  const cidadesUnicas = useMemo(() => {
    const vistas = new Set()
    return destinos.filter((d) => {
      if (vistas.has(d.cidade)) return false
      vistas.add(d.cidade)
      return true
    })
  }, [destinos])

  if (loading) return <p className="text-muted text-center mt-10">Carregando roteiro...</p>

  const hojeISO = new Date().toISOString().slice(0, 10)
  const diasPassados = destinos.filter((d) => d.data < hojeISO).length

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-[34px] font-bold tracking-tight">Roteiro</h1>
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

      <button
        onClick={() => setAdicionandoDia(true)}
        className="tap-scale fixed bottom-24 right-4 rounded-full w-[58px] h-[58px] bg-blue text-white text-[28px] font-light shadow-ios-lg z-30 flex items-center justify-center"
      >
        +
      </button>

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
  )
}
