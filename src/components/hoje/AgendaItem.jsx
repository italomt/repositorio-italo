import Badge from '../ui/Badge'
import { abrirNoMaps } from '../../lib/maps'
import { Check } from 'lucide-react'

export default function AgendaItem({ atracao, onToggleConcluida }) {
  return (
    <div className="flex items-center gap-3 py-3 px-4 border-b border-separator last:border-b-0">
      <button
        onClick={() => onToggleConcluida(atracao.id, !atracao.concluida)}
        className={`tap-scale w-[26px] h-[26px] rounded-full border-2 flex-shrink-0 flex items-center justify-center text-[13px] font-bold ${
          atracao.concluida ? 'bg-green border-green text-white' : 'border-muted2'
        }`}
      >
        {atracao.concluida ? <Check className="w-4 h-4" /> : ''}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-[16px] font-medium truncate ${atracao.concluida ? 'line-through text-muted' : ''}`}>
          {atracao.nome}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {atracao.horario_previsto && (
            <span className="text-[13px] text-muted tabular-nums">{atracao.horario_previsto.slice(0, 5)}</span>
          )}
          {atracao.precisa_reserva && atracao.status_reserva === 'pendente' && (
            <Badge tom="alta">reserva pendente</Badge>
          )}
          {atracao.custo_estimado_eur > 0 && (
            <span className="text-[13px] text-muted tabular-nums">~€{atracao.custo_estimado_eur}</span>
          )}
        </div>
      </div>

      {atracao.latitude && (
        <button
          onClick={() => abrirNoMaps(atracao.latitude, atracao.longitude, atracao.nome)}
          className="tap-scale text-blue text-[13px] font-semibold px-3 py-1.5 rounded-full bg-blue/10 flex-shrink-0"
        >
          Maps
        </button>
      )}
    </div>
  )
}
