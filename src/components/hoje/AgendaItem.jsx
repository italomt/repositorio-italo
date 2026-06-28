import { memo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Badge from '../ui/Badge'
import { abrirNoMaps } from '../../lib/maps'
import { Check } from 'lucide-react'

const AgendaItem = memo(function AgendaItem({ atracao, onToggleConcluida }) {
  return (
    <div className="flex items-center gap-3 py-3 px-4 border-b border-separator last:border-b-0">
      <button
        onClick={() => onToggleConcluida(atracao.id, !atracao.concluida)}
        className="tap-scale w-11 h-11 flex items-center justify-center flex-shrink-0"
      >
        <span className={`w-[26px] h-[26px] rounded-full border-2 flex items-center justify-center text-[13px] font-bold ${
          atracao.concluida ? 'bg-green border-green text-white' : 'border-muted2'
        }`}>
          <AnimatePresence mode="wait">
            {atracao.concluida && (
              <motion.span
                key="check"
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 90 }}
                transition={{ duration: 0.15, ease: [0.25, 1, 0.5, 1] }}
              >
                <Check className="w-4 h-4" />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
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
})

export default AgendaItem
