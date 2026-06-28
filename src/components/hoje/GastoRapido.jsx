import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

const CATEGORIAS = ['alimentacao', 'transporte', 'hospedagem', 'atracoes', 'compras', 'lazer', 'outro']

export default function GastoRapido({ aberto, onClose, onSalvar, destinoId, dataGasto }) {
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [moeda, setMoeda] = useState('EUR')
  const [categoria, setCategoria] = useState('alimentacao')
  const [salvando, setSalvando] = useState(false)

  async function handleSalvar() {
    if (!descricao || !valor) return
    setSalvando(true)
    await onSalvar({
      destino_id: destinoId,
      descricao,
      valor_original: Number(valor),
      moeda_original: moeda,
      categoria,
      data_gasto: dataGasto,
    })
    setSalvando(false)
    setDescricao('')
    setValor('')
    onClose()
  }

  return (
    <Modal aberto={aberto} onClose={onClose} titulo="Novo gasto">
      <div className="space-y-3">
        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Descrição</label>
          <input
            autoFocus
            placeholder="Ex: jantar"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans leading-tight placeholder:text-muted mt-1"
          />
        </div>
        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Valor</label>
          <div className="flex gap-2 mt-1">
            <input
              type="number"
              placeholder="0,00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="flex-1 bg-fill rounded-ios px-4 py-3 text-[15px] font-sans leading-tight tabular-nums placeholder:text-muted"
            />
            <select
              value={moeda}
              onChange={(e) => setMoeda(e.target.value)}
              className="bg-fill rounded-ios px-4 py-3 text-[15px] font-sans"
            >
              <option value="EUR">EUR</option>
              <option value="CHF">CHF</option>
              <option value="BRL">BRL</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Categoria</label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans mt-1"
          >
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <Button className="w-full" onClick={handleSalvar} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar gasto'}
        </Button>
      </div>
    </Modal>
  )
}
