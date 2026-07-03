import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import Modal from '../ui/Modal'
import AtracaoForm from './AtracaoForm'
import { useToast } from '../../contexts/ToastContext'
import { ranquearDias } from '../../lib/geo'
import { buscarFotoLocal } from '../../lib/maps'

export default function AtracaoEditor({ aberto, onClose, atracao, destinosDaCidade, atracoes, pendenciaRelacionada, onSalvar, onExcluir, acomodacoes = [] }) {
  const navigate = useNavigate()
  const addToast = useToast()
  const [fotoUrl, setFotoUrl] = useState(atracao?.foto_url ?? '')
  const [notas, setNotas] = useState(atracao?.notas ?? '')
  const [statusReserva, setStatusReserva] = useState(atracao?.status_reserva ?? 'pendente')
  const [buscandoFoto, setBuscandoFoto] = useState(false)

  const diasRanqueados = useMemo(() => {
    if (!atracao) return []
    const outrasAtracoes = (atracoes ?? []).filter((a) => a.id !== atracao.id)
    return ranquearDias(destinosDaCidade ?? [], outrasAtracoes, atracao.latitude, atracao.longitude, acomodacoes)
  }, [atracao, atracoes, destinosDaCidade])

  if (!atracao) return null

  const cidadeAtracao = destinosDaCidade?.[0]?.cidade ?? ''

  async function handleSalvar(dados) {
    await onSalvar(atracao.id, dados)
    onClose()
    addToast('Atração atualizada')
  }

  async function handleExcluir() {
    await onExcluir(atracao.id)
    onClose()
    addToast('Atração excluída', 'info')
  }

  async function handleBuscarFoto() {
    if (!atracao.nome.trim()) return
    setBuscandoFoto(true)
    const url = await buscarFotoLocal(atracao.nome, cidadeAtracao)
    if (url) {
      setFotoUrl(url)
      addToast('Foto encontrada!')
    } else {
      addToast('Nenhuma foto encontrada para este local', 'info')
    }
    setBuscandoFoto(false)
  }

  function handleIrParaPendencia() {
    onClose()
    navigate('/pendencias', { state: { abrirPendenciaId: pendenciaRelacionada.id } })
  }

  return (
    <Modal aberto={aberto} onClose={onClose} titulo="Editar atração">
      <div className="space-y-3">
        {pendenciaRelacionada && pendenciaRelacionada.estado === 'aberta' && (
          <button
            onClick={handleIrParaPendencia}
            className="tap-scale w-full flex items-center justify-between bg-red/10 rounded-ios px-4 py-3"
          >
            <span className="text-[14px] font-semibold text-red"><AlertTriangle className="w-4 h-4 inline-block mr-1" /> Resolver pendência de reserva</span>
            <span className="text-red text-lg">›</span>
          </button>
        )}

        <AtracaoForm
          diasRanqueados={diasRanqueados}
          valoresIniciais={{
            id: atracao.id,
            nome: atracao.nome,
            categoria: atracao.categoria,
            destino_id: atracao.destino_id,
            precisa_reserva: atracao.precisa_reserva,
            ocupa_dia_inteiro: atracao.ocupa_dia_inteiro,
            custo_estimado_eur: atracao.custo_estimado_eur,
            horario_previsto: atracao.horario_previsto,
            latitude: atracao.latitude,
            longitude: atracao.longitude,
          }}
          onSalvar={handleSalvar}
          onDelete={handleExcluir}
          showFoto
          showNotas
          showStatusReserva
          fotoUrl={fotoUrl}
          onFotoUrlChange={setFotoUrl}
          onBuscarFoto={handleBuscarFoto}
          buscandoFoto={buscandoFoto}
          notas={notas}
          onNotasChange={setNotas}
          statusReserva={statusReserva}
          onStatusReservaChange={setStatusReserva}
        />
      </div>
    </Modal>
  )
}
