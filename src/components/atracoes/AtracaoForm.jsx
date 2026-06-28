import { useState } from 'react'
import Button from '../ui/Button'
import EnderecoAutocomplete from '../ui/EnderecoAutocomplete'
import { AlertTriangle, MapPin } from 'lucide-react'

const CATEGORIAS = ['museu', 'gastronomia', 'balada', 'compras', 'natureza', 'cultura', 'lazer', 'outro']
const MOEDAS = ['EUR', 'USD', 'CHF', 'GBP']

export default function AtracaoForm({ diasRanqueados, valoresIniciais, onSalvar, onCancelar }) {
  const [nome, setNome] = useState(valoresIniciais?.nome ?? '')
  const [categoria, setCategoria] = useState(valoresIniciais?.categoria ?? 'cultura')
  const primeiraOpcaoDisponivel = diasRanqueados.find((d) => !d.diaCheio) ?? diasRanqueados[0]
  const [destinoId, setDestinoId] = useState(valoresIniciais?.destino_id ?? primeiraOpcaoDisponivel?.destino.id ?? '')
  const [precisaReserva, setPrecisaReserva] = useState(valoresIniciais?.precisa_reserva ?? false)
  const [ocupaDiaInteiro, setOcupaDiaInteiro] = useState(valoresIniciais?.ocupa_dia_inteiro ?? false)
  const [custo, setCusto] = useState(valoresIniciais?.custo_estimado_eur ?? '')
  const [moeda, setMoeda] = useState('EUR')
  const [horarioPrevisto, setHorarioPrevisto] = useState(valoresIniciais?.horario_previsto ?? '')
  const [localBusca, setLocalBusca] = useState('')
  const [latitude, setLatitude] = useState(valoresIniciais?.latitude ?? null)
  const [longitude, setLongitude] = useState(valoresIniciais?.longitude ?? null)
  const [salvando, setSalvando] = useState(false)

  const diaSelecionado = diasRanqueados.find((d) => d.destino.id === destinoId)
  const cidadeDoDia = diaSelecionado?.destino?.cidade ?? ''

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
      horario_previsto: horarioPrevisto || null,
      latitude,
      longitude,
      link_reserva: valoresIniciais?.link_reserva_oficial ?? null,
      foto_url: valoresIniciais?.foto_url ?? null,
      origem_ideia: valoresIniciais?.origem_ideia ?? 'manual',
    })
    setSalvando(false)
  }

  function handleSelecionarLocal({ endereco, latitude: lat, longitude: lng }) {
    setLocalBusca(endereco)
    setLatitude(lat)
    setLongitude(lng)
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Nome</label>
        <input
          placeholder="Ex: Torre Eiffel"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans placeholder:text-muted mt-1"
        />
      </div>

      <div>
        <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Localização (no mapa)</label>
        <EnderecoAutocomplete
          value={localBusca}
          onChange={setLocalBusca}
          onSelecionar={handleSelecionarLocal}
          placeholder="Buscar endereço no Google Maps..."
          cidade={cidadeDoDia}
        />
        {latitude && (
          <p className="text-[11px] text-green mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Localizado no mapa
          </p>
        )}
      </div>

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

      <div>
        <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Categoria</label>
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] placeholder:text-muted capitalize mt-1"
        >
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Custo estimado</label>
        <div className="flex gap-2 mt-1">
          <input
            type="number"
            placeholder="0,00"
            value={custo}
            onChange={(e) => setCusto(e.target.value)}
            className="flex-1 bg-fill rounded-ios px-4 py-3 text-[15px] font-sans leading-tight tabular-nums placeholder:text-muted"
          />
          <select value={moeda} onChange={(e) => setMoeda(e.target.value)} className="bg-fill rounded-ios px-4 py-3 text-[15px] font-sans">
            {MOEDAS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Horário previsto</label>
        <input
          type="time"
          value={horarioPrevisto}
          onChange={(e) => setHorarioPrevisto(e.target.value)}
          className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans mt-1"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={precisaReserva} onChange={(e) => setPrecisaReserva(e.target.checked)} />
        Precisa de reserva antecipada
      </label>
      <label className="flex items-center gap-2 text-[14px] py-1">
        <input type="checkbox" checked={ocupaDiaInteiro} onChange={(e) => setOcupaDiaInteiro(e.target.checked)} />
        <span>Dia inteiro <span className="text-muted text-[12px] font-normal">(bloqueia outras atrações)</span></span>
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
