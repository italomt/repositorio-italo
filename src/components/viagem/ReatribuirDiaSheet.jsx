import { useState } from 'react'
import Modal from '../ui/Modal'
import { ArrowRight, Trash2, X, Loader2 } from 'lucide-react'

export default function ReatribuirDiaSheet({ aberto, onClose, dia, cidadeOrigem, cidadeDestino, counts, onMover, onLimpar }) {
  const [processando, setProcessando] = useState(null)

  if (!dia) return null

  const total = counts.atracoes + counts.gastos
  const dataFmt = new Date(dia.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })

  async function handleMover() {
    setProcessando('mover')
    await onMover()
    setProcessando(null)
  }

  async function handleLimpar() {
    setProcessando('limpar')
    await onLimpar()
    setProcessando(null)
  }

  return (
    <Modal aberto={aberto} onClose={processando ? undefined : onClose} titulo="Mudar cidade do dia">
      <div className="space-y-4">
        <div className="text-center">
          <p className="text-[15px] text-muted mb-1">{dataFmt}</p>
          <div className="flex items-center justify-center gap-2 text-[18px] font-bold font-display">
            <span>{cidadeOrigem}</span>
            <ArrowRight className="w-5 h-5 text-muted2" />
            <span className="text-blue">{cidadeDestino}</span>
          </div>
        </div>

        <div className="bg-fill rounded-ios p-4">
          <p className="text-[14px] text-text text-center">
            Este dia tem{' '}
            <strong className="text-text">{counts.atracoes} {counts.atracoes === 1 ? 'atração' : 'atrações'}</strong>
            {' '}e{' '}
            <strong className="text-text">{counts.gastos} {counts.gastos === 1 ? 'gasto' : 'gastos'}</strong>
            {' '}em {cidadeOrigem}.
          </p>
        </div>

        <div className="space-y-2.5">
          <button
            onClick={handleMover}
            disabled={processando !== null}
            className="tap-scale w-full py-3.5 rounded-ios bg-blue text-white font-semibold text-[15px] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {processando === 'mover' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            Mover com o dia para {cidadeDestino}
          </button>

          <button
            onClick={handleLimpar}
            disabled={processando !== null}
            className="tap-scale w-full py-3.5 rounded-ios bg-red/10 text-red font-semibold text-[15px] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {processando === 'limpar' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Limpar dia e mover vazio
          </button>

          <button
            onClick={onClose}
            disabled={processando !== null}
            className="tap-scale w-full py-3 rounded-ios bg-fill text-muted font-medium text-[15px] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
        </div>

        <p className="text-[12px] text-muted2 text-center leading-relaxed">
          {total > 0
            ? `"Mover" leva as atrações e gastos junto. "Limpar" remove tudo deste dia antes de mudar.`
            : `Este dia está vazio — na próxima vez a mudança será automática.`}
        </p>
      </div>
    </Modal>
  )
}
