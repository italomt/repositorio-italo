import { useState } from 'react'
import Modal from '../ui/Modal'
import FormFooter from '../ui/FormFooter'
import FormField from '../ui/FormField'

const CATEGORIAS_DOC = [
  { value: 'passagem', label: 'Passagem' },
  { value: 'seguro', label: 'Seguro' },
  { value: 'hospedagem', label: 'Hospedagem' },
  { value: 'ingresso', label: 'Ingresso' },
  { value: 'outro', label: 'Outro' },
]

const CONTEXTOS_DOC = [
  { id: 'viagem', label: 'Viagem' },
  { id: 'cidade', label: 'Cidade' },
]

export default function DocumentLinkModal({ aberto, onClose, onAdd }) {
  const [nome, setNome] = useState('')
  const [url, setUrl] = useState('')
  const [categoria, setCategoria] = useState('outro')
  const [contexto, setContexto] = useState('viagem')
  const [contextoId, setContextoId] = useState('viagem')

  function fecharTudo() {
    setNome('')
    setUrl('')
    setCategoria('outro')
    setContexto('viagem')
    setContextoId('viagem')
    onClose()
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!nome.trim() || !url.trim()) return
    const ctx = contexto === 'viagem' ? null : { tipo: 'cidade', id: contextoId.trim() }
    onAdd(nome.trim(), categoria, url.trim(), ctx)
  }

  return (
    <Modal aberto={aberto} onClose={fecharTudo} titulo="Adicionar link">
      <form onSubmit={handleSubmit} className="space-y-3">
        <FormField label="Nome">
          <input type="text" placeholder="Nome do link" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans placeholder:text-muted" />
        </FormField>

        <FormField label="URL">
          <input type="url" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans placeholder:text-muted" />
        </FormField>

        <FormField label="Categoria">
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans">
            {CATEGORIAS_DOC.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
          </select>
        </FormField>

        <FormField label="Vincular a">
          <div className="flex gap-2">
            {CONTEXTOS_DOC.map((c) => (
              <button key={c.id} type="button" onClick={() => { setContexto(c.id); if (c.id === 'viagem') setContextoId('viagem') }} className={`tap-scale flex-1 py-2.5 rounded-ios text-[12px] font-semibold ${contexto === c.id ? 'bg-blue text-white' : 'bg-fill text-text'}`}>{c.label}</button>
            ))}
          </div>
          {contexto === 'cidade' && (
            <input value={contextoId} onChange={(e) => setContextoId(e.target.value)} placeholder="Ex: Lisboa, Paris..." className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans placeholder:text-muted mt-2" />
          )}
        </FormField>

        <FormFooter onSave={handleSubmit} saveLabel="Adicionar" saving={false} disabled={!nome.trim() || !url.trim()} />
      </form>
    </Modal>
  )
}
