import { useEffect, useRef, useState } from 'react'
import Button from '../ui/Button'
import { interpretarGasto, interpretarGastoPorFoto } from '../../lib/openrouter'
import { converterParaBRL, formatarBRL } from '../../lib/cambio'

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

export default function GastoForm({ destinos, cidadeAtual, gastoExistente, onSalvar, onCancelar, onExcluir }) {
  const [textoLivre, setTextoLivre] = useState('')
  const [analisando, setAnalisando] = useState(false)
  const [erroIA, setErroIA] = useState(null)
  const [descricao, setDescricao] = useState(gastoExistente?.descricao ?? '')
  const [valor, setValor] = useState(gastoExistente ? String(gastoExistente.valor_original) : '')
  const [moeda, setMoeda] = useState(gastoExistente?.moeda_original ?? 'EUR')
  const [categoria, setCategoria] = useState(gastoExistente?.categoria ?? 'alimentacao')
  const [destinoId, setDestinoId] = useState(gastoExistente?.destino_id ?? destinos[0]?.id ?? '')
  const [data, setData] = useState(gastoExistente?.data_gasto ?? new Date().toISOString().slice(0, 10))
  const [previewBRL, setPreviewBRL] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [modoManual, setModoManual] = useState(!!gastoExistente)
  const [analisandoFoto, setAnalisandoFoto] = useState(false)
  const [erroFoto, setErroFoto] = useState(false)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)
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
    if (!descricao || !valor || !destinoId) return
    setSalvando(true)
    await onSalvar({
      destino_id: destinoId,
      descricao,
      valor_original: Number(valor),
      moeda_original: moeda,
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
          <Button variant="outline" className="flex-1" onClick={onCancelar}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={handleAnalisar} disabled={analisando}>
            {analisando ? 'Analisando...' : 'Analisar com IA'}
          </Button>
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
          {analisandoFoto ? 'Lendo recibo...' : '📷 Tirar foto do recibo'}
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
      {erroIA && <p className="text-[13px] text-red bg-red/10 rounded-ios px-3 py-2">⚠️ {erroIA}</p>}
      <input
        placeholder="Descrição"
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
        <select value={moeda} onChange={(e) => setMoeda(e.target.value)} className="bg-fill rounded-ios px-4 py-3 text-[15px] placeholder:text-muted">
          {MOEDAS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {previewBRL !== null && (
        <p className="text-[13px] text-muted px-1">
          ≈ <span className="font-semibold text-text tabular-nums">R$ {formatarBRL(previewBRL)}</span>
        </p>
      )}

      <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] placeholder:text-muted">
        {CATEGORIAS.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <select value={destinoId} onChange={(e) => setDestinoId(e.target.value)} className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] placeholder:text-muted">
        {destinos.map((d) => (
          <option key={d.id} value={d.id}>
            {d.data} — {d.cidade}
          </option>
        ))}
      </select>
      <input
        type="date"
        value={data}
        onChange={(e) => setData(e.target.value)}
        className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] placeholder:text-muted font-mono"
      />

      <Button className="w-full" onClick={handleSalvar} disabled={salvando}>
        {salvando ? 'Salvando...' : gastoExistente ? 'Salvar alterações' : 'Salvar gasto'}
      </Button>

      {gastoExistente && onExcluir && (
        !confirmandoExclusao ? (
          <button
            onClick={() => setConfirmandoExclusao(true)}
            className="tap-scale w-full text-red text-[15px] font-semibold py-2"
          >
            Excluir gasto
          </button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmandoExclusao(false)}>
              Cancelar
            </Button>
            <Button variant="danger" className="flex-1" onClick={() => onExcluir(gastoExistente.id)}>
              Confirmar exclusão
            </Button>
          </div>
        )
      )}
    </div>
  )
}
