import { useState } from 'react'
import Modal from '../ui/Modal'
import FormFooter from '../ui/FormFooter'
import TravelPrioritySelector from '../ui/TravelPrioritySelector'
import TravelDatePicker from '../ui/TravelDatePicker'
import ContextSelector from '../ui/ContextSelector'
import { AlertTriangle } from 'lucide-react'

const URGENCIAS = [
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Média' },
  { value: 'baixa', label: 'Baixa' },
]
const CATEGORIAS = [
  { id: 'transporte', label: 'Transporte' },
  { id: 'atracoes', label: 'Atrações' },
  { id: 'documentacao', label: 'Documentação' },
]
const CONTEXTOS = [
  { id: 'viagem', label: 'Viagem', desc: 'Vale para toda a trip' },
  { id: 'cidade', label: 'Cidade', desc: 'Específico de uma cidade' },
  { id: 'dia', label: 'Dia', desc: 'Vinculado a um dia específico' },
  { id: 'atracao', label: 'Atração', desc: 'Vinculado a uma atração' },
  { id: 'hospedagem', label: 'Hospedagem', desc: 'Vinculado a uma acomodação' },
  { id: 'transporte', label: 'Transporte', desc: 'Vinculado a um transporte' },
]

export default function PendenciaAdder({ aberto, onClose, onSalvar, contextoPadrao, valoresPadrao }) {
  const [titulo, setTitulo] = useState(valoresPadrao?.titulo || '')
  const [categoria, setCategoria] = useState(valoresPadrao?.categoria || 'documentacao')
  const [prazo, setPrazo] = useState('')
  const [link, setLink] = useState(valoresPadrao?.link || '')
  const [urgencia, setUrgencia] = useState('media')
  const [contexto, setContexto] = useState(contextoPadrao?.tipo || 'viagem')
  const [contextoId, setContextoId] = useState(contextoPadrao?.id || '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)

  const cidades = contextoPadrao?.cidades || []
  const dias = contextoPadrao?.dias || []
  const atracoes = contextoPadrao?.atracoes || []
  const acomodacoes = contextoPadrao?.acomodacoes || []
  const transportes = contextoPadrao?.transportes || []

  function fecharTudo() {
    setTitulo('')
    setCategoria('documentacao')
    setPrazo('')
    setLink('')
    setUrgencia('media')
    setContexto(contextoPadrao?.tipo || 'viagem')
    setContextoId(contextoPadrao?.id || '')
    setErro(null)
    onClose()
  }

  async function handleSalvar() {
    if (!titulo.trim()) { setErro('Digite um título para a pendência.'); return }
    if ((contexto === 'cidade' || contexto === 'atracao' || contexto === 'hospedagem' || contexto === 'transporte') && !contextoId) { setErro('Selecione um item para vincular.'); return }
    if (contexto === 'dia' && !contextoId) { setErro('Selecione um dia.'); return }
    setSalvando(true)
    setErro(null)
    try {
      const resultado = await onSalvar({
        titulo: titulo.trim(),
        categoria,
        prazo_sugerido: prazo || null,
        link: link || null,
        urgencia,
        estado: 'aberta',
        contexto_tipo: contexto,
        contexto_id: contexto === 'viagem' ? 'viagem' : contextoId,
      })
      if (!resultado) { setErro('Erro inesperado ao salvar.'); setSalvando(false); return }
      const { error } = resultado
      setSalvando(false)
      if (error) { setErro(error.message); return }
      fecharTudo()
    } catch (e) {
      setErro(e?.message || 'Erro inesperado.')
      setSalvando(false)
    }
  }

  return (
    <Modal aberto={aberto} onClose={fecharTudo} titulo="Nova pendência">
      <div className="space-y-3">
        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Título</label>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex: Comprar passagem de trem Paris→Lyon"
            className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans placeholder:text-muted mt-1"
          />
        </div>
        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Categoria</label>
          <div className="flex gap-2 mt-1">
            {CATEGORIAS.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategoria(c.id)}
                className={`tap-scale flex-1 py-2.5 rounded-ios text-[13px] font-semibold ${categoria === c.id ? 'bg-blue text-white' : 'bg-fill text-text'}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Vincular a</label>
          <div className="mt-1">
            <ContextSelector
              value={contexto}
              onChange={(tipo) => { setContexto(tipo); setContextoId(tipo === 'viagem' ? 'viagem' : '') }}
              contextoId={contextoId}
              onContextoIdChange={setContextoId}
              cidades={cidades}
              dias={dias}
              atracoes={atracoes}
              acomodacoes={acomodacoes}
              transportes={transportes}
              showAll
            />
          </div>
        </div>
        <TravelDatePicker value={prazo} onChange={setPrazo} label="Data limite" />
        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Link</label>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
            className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans placeholder:text-muted mt-1"
          />
        </div>
        <TravelPrioritySelector value={urgencia} onChange={setUrgencia} options={URGENCIAS} />

        {erro && <p className="text-[13px] text-red bg-red/10 rounded-ios px-3 py-2"><AlertTriangle className="w-4 h-4 inline-block mr-1" /> {erro}</p>}

        <FormFooter onSave={handleSalvar} saveLabel="Adicionar pendência" saving={salvando} />
      </div>
    </Modal>
  )
}
