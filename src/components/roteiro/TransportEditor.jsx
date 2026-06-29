import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { supabase } from '../../lib/supabase'

const TIPOS_TRANSPORTE = [
  { id: 'aviao', label: 'Avião', icon: '✈️' },
  { id: 'trem', label: 'Trem', icon: '🚄' },
  { id: 'onibus', label: 'Ônibus', icon: '🚌' },
  { id: 'carro', label: 'Carro', icon: '🚗' },
]

export const MAPA_TIPO_TRANSPORTE = Object.fromEntries(TIPOS_TRANSPORTE.map((t) => [t.id, t.label]))

export default function TransportEditor({ aberto, onClose, onSalvar, cidadeOrigem, cidadeDestino, destinoOrigemId, destinoDestinoId }) {
  const [tipo, setTipo] = useState('aviao')
  const [operadora, setOperadora] = useState('')
  const [link, setLink] = useState('')
  const [custo, setCusto] = useState('')
  const [notas, setNotas] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)

  async function handleSalvar() {
    if (!tipo) return
    setSalvando(true)
    setErro(null)

    const result = await onSalvar({
      destino_origem_id: destinoOrigemId,
      destino_destino_id: destinoDestinoId,
      tipo,
      operadora: operadora || null,
      link_reserva: link || null,
      custo_estimado_brl: custo ? parseFloat(custo) : null,
      notas: notas || null,
      status: 'pendente',
    })

    setSalvando(false)
    if (result?.error) {
      setErro(result.error.message || 'Erro ao salvar transporte')
      return
    }
    onClose()
  }

  return (
    <Modal aberto={aberto} onClose={onClose} titulo={`Transporte ${cidadeOrigem} → ${cidadeDestino}`}>
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-1">
          <span className="text-lg">{cidadeOrigem}</span>
          <span className="text-muted">→</span>
          <span className="text-lg">{cidadeDestino}</span>
        </div>

        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Tipo</label>
          <div className="flex gap-2 mt-1">
            {TIPOS_TRANSPORTE.map((t) => (
              <button
                key={t.id}
                onClick={() => setTipo(t.id)}
                className={`tap-scale flex-1 py-3 rounded-xl text-[14px] font-semibold flex flex-col items-center gap-0.5 ${
                  tipo === t.id ? 'bg-blue text-white' : 'bg-fill text-text'
                }`}
              >
                <span className="text-lg">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Operadora</label>
          <input
            placeholder="Ex: Ryanair, Renfe, FlixBus..."
            value={operadora}
            onChange={(e) => setOperadora(e.target.value)}
            className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] placeholder:text-muted mt-1"
          />
        </div>

        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Link da reserva</label>
          <input
            placeholder="https://..."
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] placeholder:text-muted mt-1"
          />
        </div>

        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Custo estimado (R$)</label>
          <input
            type="number"
            placeholder="Ex: 299,00"
            value={custo}
            onChange={(e) => setCusto(e.target.value)}
            className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] placeholder:text-muted tabular-nums mt-1"
          />
        </div>

        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Notas</label>
          <input
            placeholder="Ex: saída 07h00, bagagem despachada"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] placeholder:text-muted mt-1"
          />
        </div>

        {erro && <p className="text-[13px] text-red bg-red/10 rounded-ios px-3 py-2">{erro}</p>}

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1" onClick={handleSalvar} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Adicionar transporte'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
