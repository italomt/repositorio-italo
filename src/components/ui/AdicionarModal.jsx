import { useState } from 'react'
import Modal from './Modal'
import AtracaoForm from '../atracoes/AtracaoForm'
import GastoForm from '../financas/GastoForm'
import PendenciaAdder from '../pendencias/PendenciaAdder'
import AcomodacaoEditor from '../roteiro/AcomodacaoEditor'
import TransportEditor from '../roteiro/TransportEditor'
import DayAdder from '../roteiro/DayAdder'
import { MapPin, Wallet, ClipboardList, Bed, Plane, Calendar } from 'lucide-react'

const TIPOS = [
  { id: 'atracao', label: 'Atração', icon: MapPin, desc: 'Museu, restaurante, passeio...' },
  { id: 'gasto', label: 'Gasto', icon: Wallet, desc: 'Registrar uma despesa' },
  { id: 'pendencia', label: 'Pendência', icon: ClipboardList, desc: 'Tarefa ou lembrete' },
  { id: 'hospedagem', label: 'Hospedagem', icon: Bed, desc: 'Hotel, Airbnb, hostel' },
  { id: 'transporte', label: 'Transporte', icon: Plane, desc: 'Voo, trem, ônibus...' },
  { id: 'dia', label: 'Dia', icon: Calendar, desc: 'Adicionar dia ao roteiro' },
]

export default function AdicionarModal({ aberto, onClose, tipoInicial, ...props }) {
  const [tipo, setTipo] = useState(null)

  function handleClose() {
    setTipo(null)
    onClose()
  }

  if (!aberto) return null

  if (!tipo && !tipoInicial) {
    return (
      <Modal aberto={aberto} onClose={handleClose} titulo="Novo item">
        <div className="space-y-2">
          {TIPOS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTipo(t.id)}
              className="tap-scale w-full flex items-center gap-4 p-4 rounded-ios text-left bg-fill"
            >
              <div className="w-12 h-12 rounded-full bg-card text-blue flex items-center justify-center shrink-0">
                <t.icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[16px]">{t.label}</p>
                <p className="text-[13px] text-muted">{t.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </Modal>
    )
  }

  const tipoAtual = tipoInicial || tipo
  const titulo = TIPOS.find((t) => t.id === tipoAtual)?.label || 'Novo'

  return (
    <Modal aberto={aberto} onClose={handleClose} titulo={`Novo ${titulo.toLowerCase()}`}>
      {tipoAtual === 'atracao' && (
        <AtracaoForm
          diasRanqueados={props.diasRanqueados || []}
          valoresIniciais={{}}
          onSalvar={async (d) => { await props.onSalvarAtracao?.(d); handleClose() }}
          onCancelar={handleClose}
          showEndereco
        />
      )}

      {tipoAtual === 'gasto' && (
        <GastoForm
          destinos={props.destinos || []}
          cidadeAtual={props.cidadeAtual || ''}
          onSalvar={async (g) => { await props.onSalvarGasto?.(g); handleClose() }}
          onCancelar={handleClose}
        />
      )}

      {tipoAtual === 'pendencia' && (
        <PendenciaAdder
          aberto
          onClose={handleClose}
          onSalvar={async (d) => { const r = await props.onSalvarPendencia?.(d); handleClose(); return r }}
          contextoPadrao={props.contextoPadrao}
        />
      )}

      {tipoAtual === 'hospedagem' && (
        <AcomodacaoEditor
          aberto
          onClose={handleClose}
          acomodacao={null}
          cidade={props.cidadePadrao || ''}
          pais=""
          cidades={props.cidades || []}
          onSalvar={async (d) => { await props.onSalvarHospedagem?.(d); handleClose() }}
        />
      )}

      {tipoAtual === 'transporte' && (
        <TransportEditor
          aberto
          onClose={handleClose}
          cidadeOrigem={props.cidadeOrigem || ''}
          cidadeDestino={props.cidadeDestino || ''}
          destinoOrigemId={props.destinoOrigemId}
          destinoDestinoId={props.destinoDestinoId}
          onSalvar={async (d) => { const r = await props.onSalvarTransporte?.(d); handleClose(); return r }}
        />
      )}

      {tipoAtual === 'dia' && (
        <DayAdder
          aberto
          onClose={handleClose}
          onSalvar={async (d) => { await props.onSalvarDia?.(d); handleClose() }}
        />
      )}
    </Modal>
  )
}
