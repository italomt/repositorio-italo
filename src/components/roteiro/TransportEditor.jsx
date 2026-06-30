import { useState } from 'react'
import Modal from '../ui/Modal'
import FormFooter from '../ui/FormFooter'
import DeleteSection from '../ui/DeleteSection'
import TravelCurrencyInput from '../ui/TravelCurrencyInput'

const TIPOS_TRANSPORTE = [
  { id: 'aviao', label: 'Avião', icon: '✈️' },
  { id: 'trem', label: 'Trem', icon: '🚄' },
  { id: 'onibus', label: 'Ônibus', icon: '🚌' },
  { id: 'carro', label: 'Carro', icon: '🚗' },
]

export const MAPA_TIPO_TRANSPORTE = Object.fromEntries(TIPOS_TRANSPORTE.map((t) => [t.id, t.label]))

export default function TransportEditor({ aberto, onClose, onSalvar, onExcluir, transporteExistente, cidadeOrigem, cidadeDestino, destinoOrigemId, destinoDestinoId }) {
  const [tipo, setTipo] = useState(transporteExistente?.tipo ?? 'aviao')
  const [operadora, setOperadora] = useState(transporteExistente?.operadora ?? '')
  const [link, setLink] = useState(transporteExistente?.link ?? '')
  const [custo, setCusto] = useState(transporteExistente?.custo_estimado_brl ?? '')
  const [notas, setNotas] = useState(transporteExistente?.notas ?? '')
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
      link: link || null,
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
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Link</label>
          <input
            placeholder="https://..."
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] placeholder:text-muted mt-1"
          />
        </div>

        <TravelCurrencyInput valor={custo} moeda="BRL" onValorChange={setCusto} onMoedaChange={() => {}} moedas={['BRL']} />

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

        <FormFooter onCancel={onClose} onSave={handleSalvar} saveLabel={transporteExistente ? 'Salvar alterações' : 'Adicionar transporte'} saving={salvando} />

        {transporteExistente && onExcluir && (
          <DeleteSection onDelete={() => onExcluir(transporteExistente.id)} itemName="transporte" />
        )}
      </div>
    </Modal>
  )
}
