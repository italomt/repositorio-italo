import { memo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Calendar, Check, Circle, CircleDot, Clock } from 'lucide-react'

const ESTADO_BADGE = {
  aberta: { label: 'Pendente', color: 'bg-orange/10 text-orange border-orange/30', icon: Circle },
  em_andamento: { label: 'Em andamento', color: 'bg-blue/10 text-blue border-blue/30', icon: CircleDot },
  concluida: { label: 'Concluída', color: 'bg-green/10 text-green border-green/30', icon: Check },
  cancelada: { label: 'Cancelada', color: 'bg-muted/10 text-muted border-border', icon: null },
}

const PendenciaItem = memo(function PendenciaItem({ pendencia, onToggle, onAbrirEditor }) {
  const [pop, setPop] = useState(false)
  const hojeISO = new Date().toISOString().slice(0, 10)
  const vencida = pendencia.prazo_sugerido && pendencia.prazo_sugerido < hojeISO && pendencia.estado !== 'concluida' && pendencia.estado !== 'cancelada'

  function handleToggle(e) {
    e.stopPropagation()
    setPop(true)
    onToggle(pendencia.id, pendencia.estado !== 'concluida' && pendencia.estado !== 'cancelada')
    setTimeout(() => setPop(false), 300)
  }

  const terminal = pendencia.estado === 'concluida' || pendencia.estado === 'cancelada'
  const badge = ESTADO_BADGE[pendencia.estado] || ESTADO_BADGE.aberta
  const BadgeIcon = badge.icon

  return (
    <button
      onClick={() => onAbrirEditor(pendencia)}
      className={`tap-scale w-full flex items-center gap-3 py-3.5 px-4 border-b border-separator last:border-b-0 text-left transition-opacity duration-300 ${terminal ? 'opacity-50' : ''}`}
    >
      <span onClick={handleToggle} className="tap-scale w-11 h-11 flex items-center justify-center shrink-0">
        <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[14px] font-bold transition-transform duration-200 ${pop ? 'scale-125' : 'scale-100'} ${terminal ? 'bg-green border-green text-white' : pendencia.estado === 'em_andamento' ? 'border-blue text-blue' : 'border-muted2'}`}>
          <AnimatePresence mode="wait">
            {terminal && (
              <motion.span key="check" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 90 }} transition={{ duration: 0.15, ease: [0.25, 1, 0.5, 1] }}>
                <Check className="w-4 h-4" />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </span>

      <div className="flex-1 min-w-0">
        <p className={`text-[15px] font-medium leading-snug ${terminal ? 'line-through text-muted' : ''}`}>{pendencia.titulo}</p>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badge.color}`}>
            {BadgeIcon && <BadgeIcon className="w-3 h-3" />}
            {badge.label}
          </span>
          {pendencia.prazo_sugerido && !terminal && (
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border tabular-nums ${vencida ? 'bg-red/10 text-red border-red/30' : 'bg-fill text-muted border-border'}`}>
              <Calendar className="w-3 h-3" />
              {new Date(pendencia.prazo_sugerido + 'T00:00:00').toLocaleDateString('pt-BR')}
              {vencida ? ' · vencida' : ''}
            </span>
          )}
          {!terminal && !vencida && pendencia.urgencia === 'alta' && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-red/10 text-red border-red/30">Alta</span>
          )}
          {pendencia.link && (
            <a href={pendencia.link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="tap-scale inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-blue px-2.5 py-0.5 rounded-full">
              Link ↗
            </a>
          )}
        </div>
      </div>

      <span className="text-muted2 text-lg shrink-0">›</span>
    </button>
  )
})

export default PendenciaItem
