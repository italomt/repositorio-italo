import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { AlertTriangle } from 'lucide-react'

const URGENCIAS = ['alta', 'media', 'baixa']
const CATEGORIAS = [
  { id: 'transporte', label: 'Transporte' },
  { id: 'atracoes', label: 'Atrações' },
  { id: 'documentacao', label: 'Documentação' },
]

export default function PendenciaAdder({ aberto, onClose, onSalvar }) {
  const [titulo, setTitulo] = useState('')
  const [categoria, setCategoria] = useState('documentacao')
  const [prazo, setPrazo] = useState('')
  const [link, setLink] = useState('')
  const [urgencia, setUrgencia] = useState('media')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)

  function fecharTudo() {
    setTitulo('')
    setCategoria('documentacao')
    setPrazo('')
    setLink('')
    setUrgencia('media')
    setErro(null)
    onClose()
  }

  async function handleSalvar() {
    if (!titulo.trim()) {
      setErro('Digite um título para a pendência.')
      return
    }
    setSalvando(true)
    setErro(null)
    const { error } = await onSalvar({
      titulo: titulo.trim(),
      categoria,
      prazo_sugerido: prazo || null,
      link: link || null,
      urgencia,
      concluida: false,
    })
    setSalvando(false)
    if (error) {
      setErro(error.message)
      return
    }
    fecharTudo()
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
                className={`tap-scale flex-1 py-2.5 rounded-ios text-[13px] font-semibold ${
                  categoria === c.id ? 'bg-blue text-white' : 'bg-fill text-text'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Data limite</label>
          <input
            type="date"
            value={prazo}
            onChange={(e) => setPrazo(e.target.value)}
            className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans leading-tight tabular-nums mt-1"
          />
        </div>
        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Link</label>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
            className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans placeholder:text-muted mt-1"
          />
        </div>
        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Urgência</label>
          <div className="flex gap-2 mt-1">
            {URGENCIAS.map((u) => (
              <button
                key={u}
                onClick={() => setUrgencia(u)}
                className={`tap-scale flex-1 py-2.5 rounded-ios text-[14px] font-semibold capitalize ${
                  urgencia === u ? 'bg-blue text-white' : 'bg-fill text-text'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        {erro && <p className="text-[13px] text-red bg-red/10 rounded-ios px-3 py-2"><AlertTriangle className="w-4 h-4 inline-block mr-1" /> {erro}</p>}

        <Button className="w-full" onClick={handleSalvar} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Adicionar pendência'}
        </Button>
      </div>
    </Modal>
  )
}
