import { useState } from 'react'
import { useDestinos } from '../../hooks/useDestinos'
import DayCard from './DayCard'
import DayAdder from './DayAdder'
import Card from '../ui/Card'

export default function RoteiroView() {
  const { destinos, loading, atualizarDestino, adicionarDestino } = useDestinos()
  const [adicionandoDia, setAdicionandoDia] = useState(false)

  if (loading) return <p className="text-muted text-center mt-10">Carregando roteiro...</p>

  const hojeISO = new Date().toISOString().slice(0, 10)
  const diasPassados = destinos.filter((d) => d.data < hojeISO).length

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-[34px] font-bold tracking-tight">Roteiro</h1>
        <p className="text-muted text-[15px] mt-0.5">
          {diasPassados} de {destinos.length} dias concluídos
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
        onClick={() => setAdicionandoDia(true)}
        className="tap-scale fixed bottom-24 right-4 rounded-full w-[58px] h-[58px] bg-blue text-white text-[28px] font-light shadow-ios-lg z-30 flex items-center justify-center"
      >
        +
      </button>

      <DayAdder aberto={adicionandoDia} onClose={() => setAdicionandoDia(false)} onSalvar={adicionarDestino} />
    </div>
  )
}
