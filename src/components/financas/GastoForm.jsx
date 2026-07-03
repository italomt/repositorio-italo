import { useEffect, useRef, useState } from 'react'
import FormFooter from '../ui/FormFooter'
import DeleteSection from '../ui/DeleteSection'
import TravelCurrencyInput from '../ui/TravelCurrencyInput'
import TravelCategorySelector from '../ui/TravelCategorySelector'
import TravelDatePicker from '../ui/TravelDatePicker'
import { interpretarGasto, interpretarGastoPorFoto } from '../../lib/openrouter'
import { converterParaBRL, formatarBRL } from '../../lib/cambio'
import { Camera, AlertTriangle } from 'lucide-react'
import { hojeLocalISO } from '../../lib/datas'

function arquivoParaBase64(arquivo) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(arquivo)
  })
}

const CATEGORIAS = ['alimentacao', 'transporte', 'hospedagem', 'atracoes', 'compras', 'lazer', 'outro']
const MOEDAS = ['EUR', 'USD', 'CHF', 'BRL', 'GBP']

export default function GastoForm({ destinos, cidadeAtual, gastoExistente, onSalvar, onCancelar, onExcluir, compact = false, moedaPadrao }) {
  const [textoLivre, setTextoLivre] = useState('')
  const [analisando, setAnalisando] = useState(false)
  const [erroIA, setErroIA] = useState(null)
  const [descricao, setDescricao] = useState(gastoExistente?.descricao ?? '')
  const [valor, setValor] = useState(gastoExistente ? String(gastoExistente.valor) : '')
  const [moeda, setMoeda] = useState(gastoExistente?.moeda ?? moedaPadrao ?? 'EUR')
  const [categoria, setCategoria] = useState(gastoExistente?.categoria ?? 'alimentacao')
  const [destinoId, setDestinoId] = useState(gastoExistente?.destino_id ?? '')
  const [data, setData] = useState(gastoExistente?.data_gasto ?? hojeLocalISO())
  const [previewBRL, setPreviewBRL] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [modoManual, setModoManual] = useState(!!gastoExistente || compact)
  const [analisandoFoto, setAnalisandoFoto] = useState(false)
  const [erroFoto, setErroFoto] = useState(false)
  const inputFotoRef = useRef(null)

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

  async function handleFoto(e) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    setAnalisandoFoto(true)
    setErroFoto(false)
    try {
      const base64 = await arquivoParaBase64(arquivo)
      const resultado = await interpretarGastoPorFoto(base64, cidadeAtual)
      setDescricao(resultado.descricao)
      setValor(String(resultado.valor))
      setMoeda(resultado.moeda)
      setCategoria(resultado.categoria)
      setModoManual(true)
    } catch {
      setErroFoto(true)
    } finally {
      setAnalisandoFoto(false)
      e.target.value = ''
    }
  }

  async function handleAnalisar() {
    if (!textoLivre.trim()) return
    setAnalisando(true)
    setErroIA(null)
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('A IA demorou demais para responder (20s).')), 20000))

    try {
      const resultado = await Promise.race([interpretarGasto(textoLivre, cidadeAtual), timeoutPromise])
      setDescricao(resultado.descricao)
      setValor(String(resultado.valor))
      setMoeda(resultado.moeda)
      setCategoria(resultado.categoria)
      setModoManual(true)
    } catch (erro) {
      setErroIA(erro.message ?? 'Erro desconhecido')
      setDescricao(textoLivre)
      setModoManual(true)
    } finally {
      setAnalisando(false)
    }
  }

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

  if (!modoManual) {
    return (
      <div className="space-y-3">
        <textarea
          autoFocus
          placeholder='Ex: "almoço em Paris por 10 dólares"'
          value={textoLivre}
          onChange={(e) => setTextoLivre(e.target.value)}
          rows={2}
          className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] placeholder:text-muted"
        />
        <div className="flex gap-2">
          <button className="tap-scale flex-1 py-3 rounded-ios font-semibold text-[15px] leading-none bg-fill text-blue" onClick={onCancelar}>
            Cancelar
          </button>
          <button className="tap-scale flex-1 py-3 rounded-ios font-semibold text-[15px] leading-none bg-blue text-white disabled:opacity-40" onClick={handleAnalisar} disabled={analisando}>
            {analisando ? 'Analisando...' : 'Analisar com IA'}
          </button>
        </div>

        <div className="flex items-center gap-2 py-1">
          <div className="flex-1 h-px bg-separator" />
          <span className="text-[12px] text-muted font-medium">ou</span>
          <div className="flex-1 h-px bg-separator" />
        </div>

        <input
          ref={inputFotoRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFoto}
          className="hidden"
        />
        <button
          onClick={() => inputFotoRef.current?.click()}
          disabled={analisandoFoto}
          className="tap-scale w-full flex items-center justify-center gap-2 bg-fill text-text font-semibold text-[15px] py-3 rounded-ios disabled:opacity-50"
        >
          {analisandoFoto ? 'Lendo recibo...' : <><Camera className="w-5 h-5" /> Tirar foto do recibo</>}
        </button>
        {erroFoto && (
          <p className="text-[13px] text-red text-center">Não consegui ler a foto. Tente de novo ou preencha manualmente.</p>
        )}

        <button onClick={() => setModoManual(true)} className="text-[13px] text-blue font-medium w-full text-center">
          Preencher manualmente
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {erroIA && <p className="text-[13px] text-red bg-red/10 rounded-ios px-3 py-2"><AlertTriangle className="w-4 h-4 inline-block mr-1" /> {erroIA}</p>}
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
