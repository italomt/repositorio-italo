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
        <input
          autoFocus
          placeholder="Descrição (ex: jantar)"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] placeholder:text-muted"
        />
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Valor"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="flex-1 bg-fill rounded-ios px-4 py-3 text-[15px] placeholder:text-muted font-mono"
          />
          <select
            value={moeda}
            onChange={(e) => setMoeda(e.target.value)}
            className="bg-fill rounded-ios px-4 py-3 text-[15px] placeholder:text-muted"
          >
            <option value="EUR">EUR</option>
            <option value="CHF">CHF</option>
            <option value="BRL">BRL</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] placeholder:text-muted"
        >
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <Button className="w-full" onClick={handleSalvar} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar gasto'}
        </Button>
      </div>
    </Modal>
  )
}
