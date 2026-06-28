import { useState } from 'react'
import { useContextMenu } from '../../hooks/useContextMenu'
import ContextMenu from '../ui/ContextMenu'
import SwipeActions from '../ui/SwipeActions'

export default function PendenciaItem({ pendencia, onToggle, onAbrirEditor, onExcluir }) {
  const { menu, abrir, fechar } = useContextMenu()
  const [pop, setPop] = useState(false)
  const hojeISO = new Date().toISOString().slice(0, 10)
  const vencida = pendencia.prazo_sugerido && pendencia.prazo_sugerido < hojeISO && !pendencia.concluida

  function handleToggle(e) {
    e.stopPropagation()
    setPop(true)
    onToggle(pendencia.id, !pendencia.concluida)
    setTimeout(() => setPop(false), 300)
  }

  const corBarra = pendencia.concluida ? 'border-l-green' : vencida ? 'border-l-red' : pendencia.urgencia === 'alta' ? 'border-l-orange' : 'border-l-transparent'

  return (
    <SwipeActions onEdit={() => onAbrirEditor(pendencia)} onDelete={() => onExcluir?.(pendencia.id)}>
      <button
        onClick={() => onAbrirEditor(pendencia)}
        onContextMenu={abrir}
        className={`tap-scale w-full flex items-center gap-3 py-3.5 px-4 border-b border-b-separator border-l-4 last:border-b-0 text-left transition-opacity duration-300 ${corBarra} ${pendencia.concluida ? 'opacity-50' : ''}`}
    >
      <span
        onClick={handleToggle}
        className={`tap-scale w-7 h-7 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-[14px] font-bold transition-transform duration-200 ${
          pop ? 'scale-125' : 'scale-100'
        } ${pendencia.concluida ? 'bg-green border-green text-white' : 'border-muted2'}`}
      >
        {pendencia.concluida ? '✓' : ''}
      </span>

      <div className="flex-1 min-w-0">
        <p className={`text-[15px] font-medium leading-snug ${pendencia.concluida ? 'line-through text-muted' : ''}`}>
          {pendencia.titulo}
        </p>

        {pendencia.concluida ? (
          <span className="inline-flex items-center gap-1 mt-1.5 text-[12px] font-semibold text-green bg-green/15 border border-green/30 px-2 py-0.5 rounded-full">
            ✓ Concluído
          </span>
        ) : (
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {pendencia.prazo_sugerido && (
              <span
                className={`inline-flex items-center gap-1 text-[12px] font-semibold px-2 py-1 rounded-full border tabular-nums ${
                  vencida ? 'bg-red/15 text-red border-red/30' : 'bg-fill text-muted border-border'
                }`}
              >
                🗓 {new Date(pendencia.prazo_sugerido + 'T00:00:00').toLocaleDateString('pt-BR')}
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
      <ContextMenu
        menu={menu}
        onFechar={fechar}
        itens={[
          { label: 'Editar', icone: '✏️', onClick: () => onAbrirEditor(pendencia) },
          { label: 'Excluir', icone: '🗑️', perigoso: true, onClick: () => onExcluir?.(pendencia.id) },
        ]}
      />
    </SwipeActions>
  )
}
