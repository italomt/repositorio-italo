import { useState } from 'react'
import Button from '../ui/Button'
import { AlertTriangle } from 'lucide-react'

const CATEGORIAS = ['museu', 'gastronomia', 'balada', 'compras', 'natureza', 'cultura', 'lazer', 'outro']

export default function AtracaoForm({ diasRanqueados, valoresIniciais, onSalvar, onCancelar }) {
  const [nome, setNome] = useState(valoresIniciais?.nome ?? '')
  const [categoria, setCategoria] = useState(valoresIniciais?.categoria ?? 'cultura')
  const primeiraOpcaoDisponivel = diasRanqueados.find((d) => !d.diaCheio) ?? diasRanqueados[0]
  const [destinoId, setDestinoId] = useState(valoresIniciais?.destino_id ?? primeiraOpcaoDisponivel?.destino.id ?? '')
  const [precisaReserva, setPrecisaReserva] = useState(valoresIniciais?.precisa_reserva ?? false)
  const [ocupaDiaInteiro, setOcupaDiaInteiro] = useState(valoresIniciais?.ocupa_dia_inteiro ?? false)
  const [custo, setCusto] = useState(valoresIniciais?.custo_estimado_eur ?? '')
  const [salvando, setSalvando] = useState(false)

  const diaSelecionado = diasRanqueados.find((d) => d.destino.id === destinoId)

  async function handleSalvar() {
    if (!nome || !destinoId) return
    setSalvando(true)
    await onSalvar({
      nome,
      categoria,
      destino_id: destinoId,
      precisa_reserva: precisaReserva,
      status_reserva: precisaReserva ? 'pendente' : 'nao_precisa',
      ocupa_dia_inteiro: ocupaDiaInteiro,
      custo_estimado_eur: custo ? Number(custo) : null,
      latitude: valoresIniciais?.latitude ?? null,
      longitude: valoresIniciais?.longitude ?? null,
      link_reserva: valoresIniciais?.link_reserva_oficial ?? null,
      origem_ideia: valoresIniciais?.origem_ideia ?? 'manual',
    })
    setSalvando(false)
  }

  return (
    <div className="space-y-3">
      <input
        placeholder="Nome da atração"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] placeholder:text-muted"
      />

      <div>
        <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">
          Melhor dia (por proximidade)
        </label>
        <div className="space-y-1.5 mt-1">
          {diasRanqueados.map(({ destino, atracoesDoDia, diaCheio, distanciaMedia }, i) => (
            <button
              key={destino.id}
              onClick={() => !diaCheio && setDestinoId(destino.id)}
              disabled={diaCheio}
              className={`tap-scale w-full flex items-center justify-between px-3 py-2.5 rounded-ios text-left disabled:opacity-40 ${
                destinoId === destino.id ? 'bg-blue text-white' : 'bg-fill text-text'
              }`}
            >
              <span className="text-[14px] font-medium">
                {new Date(destino.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} — {destino.cidade}
              </span>
              <span className="text-[12px] opacity-80">
                {diaCheio
                  ? 'dia cheio'
                  : distanciaMedia != null
                    ? `~${distanciaMedia.toFixed(1)}km das outras`
                    : i === 0 && atracoesDoDia.length === 0
                      ? 'sugerido'
                      : `${atracoesDoDia.length} atração(ões)`}
              </span>
            </button>
          ))}
        </div>
        {diaSelecionado?.diaCheio && (
          <p className="text-[12px] text-red mt-1"><span className="inline-flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-red" /> Esse dia já tem uma atração de dia inteiro marcada.</span></p>
        )}
      </div>

      <select
        value={categoria}
        onChange={(e) => setCategoria(e.target.value)}
        className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] placeholder:text-muted capitalize"
      >
        {CATEGORIAS.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <input
        type="number"
        placeholder="Custo estimado (€)"
        value={custo}
        onChange={(e) => setCusto(e.target.value)}
        className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] placeholder:text-muted font-mono"
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={precisaReserva} onChange={(e) => setPrecisaReserva(e.target.checked)} />
        Precisa de reserva antecipada
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={ocupaDiaInteiro} onChange={(e) => setOcupaDiaInteiro(e.target.checked)} />
        Ocupa o dia inteiro (ex: Disney) — bloqueia outras atrações nesse dia
      </label>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button className="flex-1" onClick={handleSalvar} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </div>
  )
}
