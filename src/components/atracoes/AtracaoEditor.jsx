import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { ranquearDias } from '../../lib/geo'

const CATEGORIAS = ['museu', 'gastronomia', 'balada', 'compras', 'natureza', 'cultura', 'lazer', 'outro']

export default function AtracaoEditor({ aberto, onClose, atracao, destinosDaCidade, atracoes, pendenciaRelacionada, onSalvar, onExcluir, acomodacoes = [] }) {
  const navigate = useNavigate()
  const [nome, setNome] = useState(atracao?.nome ?? '')
  const [categoria, setCategoria] = useState(atracao?.categoria ?? 'outro')
  const [custo, setCusto] = useState(atracao?.custo_estimado_eur ?? '')
  const [precisaReserva, setPrecisaReserva] = useState(atracao?.precisa_reserva ?? false)
  const [statusReserva, setStatusReserva] = useState(atracao?.status_reserva ?? 'pendente')
  const [ocupaDiaInteiro, setOcupaDiaInteiro] = useState(atracao?.ocupa_dia_inteiro ?? false)
  const [destinoId, setDestinoId] = useState(atracao?.destino_id ?? '')
  const [notas, setNotas] = useState(atracao?.notas ?? '')
  const [salvando, setSalvando] = useState(false)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)

  const diasRanqueados = useMemo(() => {
    if (!atracao) return []
    const outrasAtracoes = (atracoes ?? []).filter((a) => a.id !== atracao.id)
    return ranquearDias(destinosDaCidade ?? [], outrasAtracoes, atracao.latitude, atracao.longitude, acomodacoes)
  }, [atracao, atracoes, destinosDaCidade])

  if (!atracao) return null

  const diaAtualCheio = diasRanqueados.find((d) => d.destino.id === destinoId)?.diaCheio

  async function handleSalvar() {
    setSalvando(true)
    await onSalvar(atracao.id, {
      nome,
      categoria,
      destino_id: destinoId,
      custo_estimado_eur: custo ? Number(custo) : null,
      precisa_reserva: precisaReserva,
      status_reserva: precisaReserva ? statusReserva : 'nao_precisa',
      ocupa_dia_inteiro: ocupaDiaInteiro,
      notas,
    })
    setSalvando(false)
    onClose()
  }

  async function handleExcluir() {
    await onExcluir(atracao.id)
    onClose()
  }

  function handleIrParaPendencia() {
    onClose()
    navigate('/pendencias', { state: { abrirPendenciaId: pendenciaRelacionada.id } })
  }

  return (
    <Modal aberto={aberto} onClose={onClose} titulo="Editar atração">
      <div className="space-y-3">
        {pendenciaRelacionada && !pendenciaRelacionada.concluida && (
          <button
            onClick={handleIrParaPendencia}
            className="tap-scale w-full flex items-center justify-between bg-red/10 rounded-ios px-4 py-3"
          >
            <span className="text-[14px] font-semibold text-red"><AlertTriangle className="w-4 h-4 inline-block mr-1" /> Resolver pendência de reserva</span>
            <span className="text-red text-lg">›</span>
          </button>
        )}

        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Nome da atração</label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] mt-1"
          />
        </div>

        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Dia do roteiro</label>
          <div className="space-y-1.5 mt-1">
            {diasRanqueados.map(({ destino, atracoesDoDia, diaCheio, distanciaMedia }) => (
              <button
                key={destino.id}
                onClick={() => setDestinoId(destino.id)}
                className={`tap-scale w-full flex items-center justify-between px-3 py-2.5 rounded-ios text-left ${
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
                      : `${atracoesDoDia.length} atração(ões)`}
                </span>
              </button>
            ))}
          </div>
          {diaAtualCheio && (
            <p className="text-[12px] text-red mt-1"><AlertTriangle className="w-3.5 h-3.5 inline-block mr-0.5" /> Esse dia já tem uma atração de dia inteiro marcada.</p>
          )}
        </div>

        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Categoria</label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] mt-1 capitalize"
          >
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Custo estimado em euros (€)</label>
          <input
            type="number"
            placeholder="0"
            value={custo ?? ''}
            onChange={(e) => setCusto(e.target.value)}
            className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] tabular-nums mt-1"
          />
        </div>

        <label className="flex items-center gap-2 text-[15px] py-1">
          <input type="checkbox" checked={precisaReserva} onChange={(e) => setPrecisaReserva(e.target.checked)} />
          Precisa de reserva antecipada
        </label>

        {precisaReserva && (
          <div>
            <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Status da reserva</label>
            <div className="flex gap-2 mt-1">
              {['pendente', 'reservado'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusReserva(s)}
                  className={`tap-scale flex-1 py-2.5 rounded-ios text-[14px] font-semibold capitalize ${
                    statusReserva === s ? 'bg-blue text-white' : 'bg-fill text-text'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="flex items-center gap-2 text-[15px] py-1">
          <input type="checkbox" checked={ocupaDiaInteiro} onChange={(e) => setOcupaDiaInteiro(e.target.checked)} />
          Ocupa o dia inteiro (ex: Disney) — bloqueia outras atrações nesse dia
        </label>

        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Notas</label>
          <textarea
            placeholder="Ex: comprar com antecedência, ponto de encontro..."
            value={notas ?? ''}
            onChange={(e) => setNotas(e.target.value)}
            rows={3}
            className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] placeholder:text-muted mt-1"
          />
        </div>

        <Button className="w-full" onClick={handleSalvar} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar alterações'}
        </Button>

        {!confirmandoExclusao ? (
          <button
            onClick={() => setConfirmandoExclusao(true)}
            className="tap-scale w-full text-red text-[15px] font-semibold py-2"
          >
            Excluir atração
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
