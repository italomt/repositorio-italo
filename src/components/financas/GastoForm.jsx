import { useEffect, useState } from 'react'
import FormFooter from '../ui/FormFooter'
import DeleteSection from '../ui/DeleteSection'
import TravelCurrencyInput from '../ui/TravelCurrencyInput'
import TravelCategorySelector from '../ui/TravelCategorySelector'
import TravelDatePicker from '../ui/TravelDatePicker'
import { converterParaBRL, formatarBRL } from '../../lib/cambio'
import { hojeLocalISO } from '../../lib/datas'

const CATEGORIAS = ['alimentacao', 'transporte', 'hospedagem', 'atracoes', 'compras', 'lazer', 'outro']
const MOEDAS = ['EUR', 'USD', 'CHF', 'BRL', 'GBP']

export default function GastoForm({ destinos, cidadeAtual, gastoExistente, onSalvar, onCancelar, onExcluir, compact = false, moedaPadrao }) {
  const [descricao, setDescricao] = useState(gastoExistente?.descricao ?? '')
  const [valor, setValor] = useState(gastoExistente ? String(gastoExistente.valor) : '')
  const [moeda, setMoeda] = useState(gastoExistente?.moeda ?? moedaPadrao ?? 'EUR')
  const [categoria, setCategoria] = useState(gastoExistente?.categoria ?? 'alimentacao')
  const [destinoId, setDestinoId] = useState(gastoExistente?.destino_id ?? '')
  const [data, setData] = useState(gastoExistente?.data_gasto ?? hojeLocalISO())
  const [previewBRL, setPreviewBRL] = useState(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!valor || Number.isNaN(Number(valor))) {
      setPreviewBRL(null)
      return
    }
    let ativo = true
    converterParaBRL(Number(valor), moeda)
      .then(({ valorBRL }) => {
        if (ativo) setPreviewBRL(valorBRL)
      })
      .catch(() => setPreviewBRL(null))
    return () => {
      ativo = false
    }
  }, [valor, moeda])

  async function handleSalvar() {
    if (!descricao || !valor) return
    setSalvando(true)
    await onSalvar({
      destino_id: destinoId || null,
      descricao,
      valor: Number(valor),
      moeda: moeda,
      categoria,
      data_gasto: data,
    })
    setSalvando(false)
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Descrição</label>
        <input
          placeholder="Ex: almoço em Paris"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans leading-tight placeholder:text-muted mt-1"
        />
      </div>
      <TravelCurrencyInput valor={valor} moeda={moeda} onValorChange={setValor} onMoedaChange={setMoeda} />

      {!compact && previewBRL !== null && (
        <p className="text-[13px] text-muted px-1">
          ≈ <span className="font-semibold text-text tabular-nums">R$ {formatarBRL(previewBRL)}</span>
        </p>
      )}

      <TravelCategorySelector value={categoria} onChange={setCategoria} options={CATEGORIAS} />
      {!compact && (
        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Dia do roteiro</label>
          <select value={destinoId} onChange={(e) => setDestinoId(e.target.value)} className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans mt-1">
            <option value="">Pré-viagem</option>
            {destinos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.data} — {d.cidade}
              </option>
            ))}
          </select>
        </div>
      )}
      {!compact && (
        <TravelDatePicker value={data} onChange={setData} label="Data do gasto" />
      )}

      <FormFooter onSave={handleSalvar} saveLabel={gastoExistente ? 'Salvar alterações' : 'Salvar gasto'} saving={salvando} />

      {gastoExistente && onExcluir && (
        <DeleteSection onDelete={() => onExcluir(gastoExistente.id)} itemName="gasto" />
      )}
    </div>
  )
}
