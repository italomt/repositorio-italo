import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

const URGENCIAS = ['alta', 'media', 'baixa']

export default function PendenciaEditor({ aberto, onClose, pendencia, onSalvar, onExcluir }) {
  const [titulo, setTitulo] = useState(pendencia?.titulo ?? '')
  const [prazo, setPrazo] = useState(pendencia?.prazo_sugerido ?? '')
  const [link, setLink] = useState(pendencia?.link ?? '')
  const [urgencia, setUrgencia] = useState(pendencia?.urgencia ?? 'media')
  const [salvando, setSalvando] = useState(false)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)

  if (!pendencia) return null

  async function handleSalvar() {
    setSalvando(true)
    await onSalvar(pendencia.id, { titulo, prazo_sugerido: prazo || null, link: link || null, urgencia })
    setSalvando(false)
    onClose()
  }

  async function handleExcluir() {
    await onExcluir(pendencia.id)
    onClose()
  }

  return (
    <Modal aberto={aberto} onClose={onClose} titulo="Editar pendência">
      <div className="space-y-3">
        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Título</label>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] mt-1"
          />
        </div>
        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Prazo</label>
          <input
            type="date"
            value={prazo ?? ''}
            onChange={(e) => setPrazo(e.target.value)}
            className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] mt-1 tabular-nums"
          />
        </div>
        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Link</label>
          <input
            value={link ?? ''}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
            className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] mt-1"
          />
        </div>
        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Urgência</label>
          <div className="flex gap-2 mt-1">
            {URGENCIAS.map((u) => (
              <button
                key={u}
                onClick={() => setUrgencia(u)}
                className={`tap-scale flex-1 py-2.5 rounded-ios text-[14px] font-semibold capitalize ${
                  urgencia === u ? 'bg-blue text-white' : 'bg-fill text-text'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        <Button className="w-full" onClick={handleSalvar} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar alterações'}
        </Button>

        {!confirmandoExclusao ? (
          <button
            onClick={() => setConfirmandoExclusao(true)}
            className="tap-scale w-full text-red text-[15px] font-semibold py-2"
          >
            Excluir pendência
          </button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmandoExclusao(false)}>
              Cancelar
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleExcluir}>
              Confirmar exclusão
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
