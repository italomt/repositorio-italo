import { memo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Calendar, Check } from 'lucide-react'

const PendenciaItem = memo(function PendenciaItem({ pendencia, onToggle, onAbrirEditor }) {
  const [pop, setPop] = useState(false)
  const hojeISO = new Date().toISOString().slice(0, 10)
  const vencida = pendencia.prazo_sugerido && pendencia.prazo_sugerido < hojeISO && !pendencia.concluida

  function handleToggle(e) {
    e.stopPropagation()
    setPop(true)
    onToggle(pendencia.id, !pendencia.concluida)
    setTimeout(() => setPop(false), 300)
  }

  const bgTint = pendencia.concluida ? '' : vencida ? 'bg-red/[0.03]' : pendencia.urgencia === 'alta' ? 'bg-orange/[0.03]' : ''

  return (
    <button
      onClick={() => onAbrirEditor(pendencia)}
      className={`tap-scale w-full flex items-center gap-3 py-3.5 px-4 border-b border-b-separator last:border-b-0 text-left transition-opacity duration-300 ${bgTint} ${pendencia.concluida ? 'opacity-50' : ''}`}
    >
      <span
        onClick={handleToggle}
        className="tap-scale w-11 h-11 flex items-center justify-center flex-shrink-0"
      >
        <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[14px] font-bold transition-transform duration-200 ${
          pop ? 'scale-125' : 'scale-100'
        } ${pendencia.concluida ? 'bg-green border-green text-white' : 'border-muted2'}`}
        >
          <AnimatePresence mode="wait">
            {pendencia.concluida && (
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
      </span>

      <div className="flex-1 min-w-0">
        <p className={`text-[15px] font-medium leading-snug ${pendencia.concluida ? 'line-through text-muted' : ''}`}>
          {pendencia.titulo}
        </p>

        {pendencia.concluida ? (
          <span className="inline-flex items-center gap-1 mt-1.5 text-[12px] font-semibold text-green bg-green/15 border border-green/30 px-2 py-0.5 rounded-full">
            <Check className="w-3.5 h-3.5" /> Concluído
          </span>
        ) : (
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {pendencia.prazo_sugerido && (
              <span
                className={`inline-flex items-center gap-1 text-[12px] font-semibold px-2 py-1 rounded-full border tabular-nums ${
                  vencida ? 'bg-red/15 text-red border-red/30' : 'bg-fill text-muted border-border'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 inline-block mr-1" /> {new Date(pendencia.prazo_sugerido + 'T00:00:00').toLocaleDateString('pt-BR')}
                {vencida ? ' · vencida' : ''}
              </span>
            )}
            {!vencida && (
              <span
                className={`text-[12px] font-semibold px-2 py-1 rounded-full border ${
                  pendencia.urgencia === 'alta'
                    ? 'bg-orange/15 text-orange border-orange/30'
                    : pendencia.urgencia === 'media'
                      ? 'bg-yellow/15 text-yellow border-yellow/30'
                      : 'bg-fill text-muted border-border'
                }`}
              >
                {pendencia.urgencia}
              </span>
            )}
            {pendencia.link && (
              <a
                href={pendencia.link}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="tap-scale inline-flex items-center gap-1 text-[12px] font-semibold text-white bg-blue px-2.5 py-1 rounded-full"
              >
                Abrir link ↗
              </a>
            )}
          </div>
        )}
      </div>

      <span className="text-muted2 text-lg flex-shrink-0">›</span>
    </button>
  )
})

export default PendenciaItem
