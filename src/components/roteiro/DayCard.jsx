import { useState } from 'react'
import Badge from '../ui/Badge'
import DayEditor from './DayEditor'

export default function DayCard({ destino, indexDia, totalDias, onAtualizar, isLast }) {
  const [editando, setEditando] = useState(false)
  const transportesPendentes = (destino.transportes ?? []).filter((t) => t.status === 'pendente').length

  const data = new Date(destino.data + 'T00:00:00')
  const diaSemana = data.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
  const hojeISO = new Date().toISOString().slice(0, 10)
  const passado = destino.data < hojeISO

  return (
    <>
      <button
        onClick={() => setEditando(true)}
        className="tap-scale w-full flex items-center gap-3 py-3 px-4 bg-card text-left border-b border-separator last:border-b-0"
      >
        <div className="flex flex-col items-center w-11 flex-shrink-0">
          <p className="text-[11px] text-muted uppercase font-semibold">{diaSemana}</p>
          <p className={`font-display text-[20px] font-bold leading-none tabular-nums ${passado ? 'text-muted' : ''}`}>
            {data.getDate()}
          </p>
        </div>

        <div className="w-px self-stretch bg-separator" />

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[16px] truncate flex items-center gap-1.5">
            <span>{destino.flag_emoji}</span>
            <span className="truncate">{destino.cidade}</span>
          </p>
          <p className="text-[13px] text-muted">{destino.pais}</p>
        </div>

        <div className="flex flex-col items-end gap-1">
          {transportesPendentes > 0 && <Badge tom="alta">{transportesPendentes} pendente</Badge>}
          {passado && !transportesPendentes && <Badge tom="sucesso">concluído</Badge>}
          <span className="text-muted text-lg leading-none">›</span>
        </div>
      </button>

      <DayEditor
        aberto={editando}
        onClose={() => setEditando(false)}
        destino={destino}
        onSalvar={onAtualizar}
      />
    </>
  )
}
