import { useState } from 'react'
import Modal from '../ui/Modal'
import FormFooter from '../ui/FormFooter'
import FormField from '../ui/FormField'
import { Upload, FileText } from 'lucide-react'

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

export default function DocumentUploadModal({ aberto, onClose, onUpload, uploading }) {
  const [step, setStep] = useState('file')
  const [file, setFile] = useState(null)
  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState('outro')
  const [contexto, setContexto] = useState('viagem')
  const [contextoId, setContextoId] = useState('viagem')

  function fecharTudo() {
    setStep('file')
    setFile(null)
    setNome('')
    setCategoria('outro')
    setContexto('viagem')
    setContextoId('viagem')
    onClose()
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!file || !nome.trim()) return
    const ctx = contexto === 'viagem' ? null : { tipo: 'cidade', id: contextoId.trim() }
    onUpload(file, nome.trim(), categoria, ctx)
  }

  function handleSelectFile(e) {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      if (!nome) setNome(f.name.replace(/\.[^.]+$/, ''))
      setStep('details')
    }
  }

  return (
    <Modal aberto={aberto} onClose={fecharTudo} titulo="Adicionar documento">
      <div className="space-y-3">
        {step === 'file' ? (
          <label className="tap-scale block w-full py-14 rounded-ios border-2 border-dashed border-separator text-center cursor-pointer">
            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleSelectFile} />
            <Upload className="w-9 h-9 mx-auto mb-3 text-muted" />
            <p className="text-muted text-[15px] font-medium">Toque para selecionar arquivo</p>
            <p className="text-muted text-[13px] mt-1.5">PDF, JPG ou PNG</p>
          </label>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-3 p-3 rounded-ios bg-fill mb-3">
              <FileText className="w-6 h-6 text-muted shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium truncate">{file.name}</p>
                <p className="text-[12px] text-muted">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
              <button type="button" onClick={() => { setFile(null); setStep('file') }} className="text-muted text-sm">Trocar</button>
            </div>

            <FormField label="Nome">
              <input type="text" placeholder="Nome do documento" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans placeholder:text-muted" />
            </FormField>

            <FormField label="Categoria" className="mt-3">
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans">
                {CATEGORIAS_DOC.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
              </select>
            </FormField>

            <FormField label="Vincular a" className="mt-3">
              <div className="flex gap-2">
                {CONTEXTOS_DOC.map((c) => (
                  <button key={c.id} type="button" onClick={() => { setContexto(c.id); if (c.id === 'viagem') setContextoId('viagem') }} className={`tap-scale flex-1 py-2.5 rounded-ios text-[12px] font-semibold ${contexto === c.id ? 'bg-blue text-white' : 'bg-fill text-text'}`}>{c.label}</button>
                ))}
              </div>
              {contexto === 'cidade' && (
                <input value={contextoId} onChange={(e) => setContextoId(e.target.value)} placeholder="Ex: Lisboa, Paris..." className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans placeholder:text-muted mt-2" />
              )}
            </FormField>

            <div className="mt-3">
              <FormFooter onSave={handleSubmit} saveLabel="Enviar" saving={uploading} disabled={!nome.trim()} />
            </div>
          </form>
        )}
      </div>
    </Modal>
  )
}
