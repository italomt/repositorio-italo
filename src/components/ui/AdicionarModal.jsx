import { useState } from 'react'
import Modal from '../ui/Modal'
import AtracaoForm from '../atracoes/AtracaoForm'
import GastoForm from '../financas/GastoForm'
import PendenciaAdder from '../pendencias/PendenciaAdder'
import AcomodacaoEditor from '../roteiro/AcomodacaoEditor'
import TransportEditor from '../roteiro/TransportEditor'
import DayAdder from '../roteiro/DayAdder'
import { MapPin, Wallet, ClipboardList, Bed, Plane, FileText, Calendar } from 'lucide-react'

const TIPOS = [
  { id: 'atracao', label: 'Atração', icon: MapPin, desc: 'Museu, restaurante, passeio...' },
  { id: 'gasto', label: 'Gasto', icon: Wallet, desc: 'Registrar uma despesa' },
  { id: 'pendencia', label: 'Pendência', icon: ClipboardList, desc: 'Tarefa ou lembrete' },
  { id: 'hospedagem', label: 'Hospedagem', icon: Bed, desc: 'Hotel, Airbnb, hostel' },
  { id: 'transporte', label: 'Transporte', icon: Plane, desc: 'Voo, trem, ônibus...' },
  { id: 'dia', label: 'Dia', icon: Calendar, desc: 'Adicionar dia ao roteiro' },
]

export default function AdicionarModal({ aberto, onClose, tipoInicial, ...props }) {
  const [tipo, setTipo] = useState(tipoInicial || null)

  function handleBack() {
    setTipo(null)
  }

  function handleClose() {
    setTipo(null)
    onClose()
  }

  if (!aberto) return null

  // Step 1: Choose type
  if (!tipo || tipoInicial) {
    const tipoAtual = tipoInicial
    return (
      <Modal aberto={aberto} onClose={handleClose} titulo="Novo item">
        <div className="space-y-2">
          {TIPOS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTipo(t.id)}
              className={`tap-scale w-full flex items-center gap-4 p-4 rounded-ios text-left ${tipo === t.id || tipoAtual === t.id ? 'bg-blue/10' : 'bg-fill'}`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${tipo === t.id || tipoAtual === t.id ? 'bg-blue text-white' : 'bg-card text-blue'}`}>
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

  // Step 2: Show specific form
  const titulo = TIPOS.find((t) => t.id === tipo)?.label || 'Novo'

  return (
    <Modal aberto={aberto} onClose={handleClose} titulo={`Novo ${titulo.toLowerCase()}`}>
      {tipo === 'atracao' && (
        <AtracaoForm
          diasRanqueados={props.diasRanqueados || []}
          valoresIniciais={{}}
          onSalvar={async (d) => { await props.onSalvarAtracao?.(d); handleClose() }}
          onCancelar={handleClose}
          showEndereco
        />
      )}

      {tipo === 'gasto' && (
        <GastoForm
          destinos={props.dias || []}
          cidadeAtual={props.cidadeAtual || ''}
          onSalvar={async (g) => { await props.onSalvarGasto?.(g); handleClose() }}
          onCancelar={handleClose}
        />
      )}

      {tipo === 'pendencia' && (
        <PendenciaAdder
          aberto
          onClose={handleClose}
          onSalvar={async (d) => { const r = await props.onSalvarPendencia?.(d); handleClose(); return r }}
          contextoPadrao={props.contextoPadrao}
        />
      )}

      {tipo === 'hospedagem' && (
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

      {tipo === 'transporte' && (
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

      {tipo === 'documento' && (
        <div className="space-y-3 text-center text-muted py-8">
          <FileText className="w-10 h-10 mx-auto opacity-30" />
          <p className="text-[15px]">Use a seção Documentos para upload</p>
        </div>
      )}

      {tipo === 'dia' && (
        <DayAdder
          aberto
          onClose={handleClose}
          onSalvar={async (d) => { await props.onSalvarDia?.(d); handleClose() }}
        />
      )}
    </Modal>
  )
}
