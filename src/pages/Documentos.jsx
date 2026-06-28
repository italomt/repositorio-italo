import { useState, useCallback } from 'react'
import { useDocumentos } from '../hooks/useDocumentos'
import { useAuthContext } from '../contexts/AuthContext'
import Card from '../components/ui/Card'
import PullToRefresh from '../components/ui/PullToRefresh'
import { FileText, Image, Link, Plus, Trash2, Upload, ExternalLink, Mail, Copy, Check } from 'lucide-react'

const CATEGORIAS = [
  { value: 'passagem', label: 'Passagem', color: 'bg-blue/10 text-blue' },
  { value: 'seguro', label: 'Seguro', color: 'bg-green/10 text-green' },
  { value: 'hospedagem', label: 'Hospedagem', color: 'bg-purple/10 text-purple' },
  { value: 'ingresso', label: 'Ingresso', color: 'bg-orange/10 text-orange' },
  { value: 'outro', label: 'Outro', color: 'bg-muted/10 text-muted' },
]

let copiadoTimeout = null

function TipoIcon({ tipo }) {
  if (tipo === 'link') return <Link className="w-5 h-5" />
  if (['jpg', 'jpeg', 'png'].includes(tipo)) return <Image className="w-5 h-5" />
  return <FileText className="w-5 h-5" />
}

function EmailAliasCard({ alias }) {
  const [copiado, setCopiado] = useState(false)

  const copiar = useCallback(() => {
    navigator.clipboard.writeText(`${alias}@mail.seudominio.com`)
    setCopiado(true)
    clearTimeout(copiadoTimeout)
    copiadoTimeout = setTimeout(() => setCopiado(false), 2000)
  }, [alias])

  if (!alias) return null

  return (
    <Card>
      <div className="flex items-center gap-3 py-2.5 px-4">
        <div className="w-10 h-10 rounded-full bg-purple/10 flex items-center justify-center flex-shrink-0">
          <Mail className="w-5 h-5 text-purple" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-muted font-medium">Seu alias para receber docs por email</p>
          <p className="font-semibold text-[15px] truncate">{alias}@mail.seudominio.com</p>
        </div>
        <button
          onClick={copiar}
          className="tap-scale w-9 h-9 rounded-full bg-fill flex items-center justify-center flex-shrink-0"
        >
          {copiado ? <Check className="w-4 h-4 text-green" /> : <Copy className="w-4 h-4 text-muted" />}
        </button>
      </div>
    </Card>
  )
}

export default function Documentos() {
  const { documentos, loading, recarregar, uploadArquivo, adicionarLink, removerDocumento } = useDocumentos()
  const { usuario, profile } = useAuthContext()
  const [showUpload, setShowUpload] = useState(false)
  const [showAddLink, setShowAddLink] = useState(false)
  const [uploading, setUploading] = useState(false)

  if (loading) return <p className="text-muted text-center mt-10">Carregando documentos...</p>

  return (
    <PullToRefresh onRefresh={recarregar}>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-[34px] font-bold tracking-tight">Documentos</h1>
            <p className="text-muted text-[15px] mt-0.5">{documentos.length} documentos</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddLink(true)}
              className="tap-scale w-11 h-11 rounded-full bg-fill flex items-center justify-center text-muted"
            >
              <Link className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowUpload(true)}
              className="tap-scale w-11 h-11 rounded-full bg-blue text-white flex items-center justify-center"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {profile?.email_alias && <EmailAliasCard alias={profile.email_alias} />}

        {documentos.length === 0 ? (
          <Card>
            <div className="py-10 text-center text-muted">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-[15px]">Nenhum documento ainda</p>
              <p className="text-[13px] mt-1">Adicione passagens, seguros e outros docs</p>
            </div>
          </Card>
        ) : (
          <Card>
            {documentos.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 py-3 px-4 border-b border-separator last:border-b-0"
              >
                <div className="w-10 h-10 rounded-xl bg-fill flex items-center justify-center flex-shrink-0">
                  <TipoIcon tipo={doc.tipo} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[16px] truncate">{doc.nome}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-md ${CATEGORIAS.find(c => c.value === doc.categoria)?.color || ''}`}>
                      {CATEGORIAS.find(c => c.value === doc.categoria)?.label || doc.categoria}
                    </span>
                    {doc.origem === 'email' && (
                      <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-purple/10 text-purple flex items-center gap-1">
                        <Mail className="w-3 h-3" /> via email
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {doc.arquivo_url && (
                    <a
                      href={doc.arquivo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tap-scale w-8 h-8 rounded-full bg-fill flex items-center justify-center text-muted"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => removerDocumento(doc.id)}
                    className="tap-scale w-8 h-8 rounded-full bg-fill flex items-center justify-center text-red"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </Card>
        )}

        {showUpload && (
          <UploadModal
            onClose={() => setShowUpload(false)}
            onUpload={async (file, nome, categoria) => {
              setUploading(true)
              await uploadArquivo(file, nome, categoria, usuario?.id)
              setUploading(false)
              setShowUpload(false)
            }}
            uploading={uploading}
          />
        )}

        {showAddLink && (
          <AddLinkModal
            onClose={() => setShowAddLink(false)}
            onAdd={async (nome, categoria, url) => {
              await adicionarLink(nome, categoria, url, usuario?.id)
              setShowAddLink(false)
            }}
          />
        )}
      </div>
    </PullToRefresh>
  )
}

function UploadModal({ onClose, onUpload, uploading }) {
  const [file, setFile] = useState(null)
  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState('outro')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!file || !nome.trim()) return
    onUpload(file, nome.trim(), categoria)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-card w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 pb-10" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-separator mx-auto mb-5" />
        <h2 className="font-display text-xl font-bold mb-4">Adicionar documento</h2>

        {!file ? (
          <label className="tap-scale block w-full py-12 rounded-2xl border-2 border-dashed border-separator text-center cursor-pointer">
            <input
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files[0])}
            />
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted" />
            <p className="text-muted text-[15px]">Toque para selecionar arquivo</p>
            <p className="text-muted2 text-[13px] mt-1">PDF, JPG ou PNG</p>
          </label>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-fill">
              <FileText className="w-6 h-6 text-muted" />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium truncate">{file.name}</p>
                <p className="text-[12px] text-muted">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
              <button type="button" onClick={() => setFile(null)} className="text-muted text-sm">
                Trocar
              </button>
            </div>

            <input
              type="text"
              placeholder="Nome do documento"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-fill text-foreground outline-none text-[15px] placeholder:text-muted2"
            />

            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-fill text-foreground outline-none text-[15px]"
            >
              {CATEGORIAS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            <button
              type="submit"
              disabled={uploading || !nome.trim()}
              className="tap-scale w-full py-3 rounded-xl bg-blue text-white font-semibold text-[15px] disabled:opacity-40"
            >
              {uploading ? 'Enviando...' : 'Enviar'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function AddLinkModal({ onClose, onAdd }) {
  const [nome, setNome] = useState('')
  const [url, setUrl] = useState('')
  const [categoria, setCategoria] = useState('outro')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!nome.trim() || !url.trim()) return
    onAdd(nome.trim(), categoria, url.trim())
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-card w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 pb-10" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-separator mx-auto mb-5" />
        <h2 className="font-display text-xl font-bold mb-4">Adicionar link</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Nome do documento"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-fill text-foreground outline-none text-[15px] placeholder:text-muted2"
          />
          <input
            type="url"
            placeholder="URL (Google Drive, iCloud, etc.)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-fill text-foreground outline-none text-[15px] placeholder:text-muted2"
          />
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-fill text-foreground outline-none text-[15px]"
          >
            {CATEGORIAS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          <button
            type="submit"
            disabled={!nome.trim() || !url.trim()}
            className="tap-scale w-full py-3 rounded-xl bg-blue text-white font-semibold text-[15px] disabled:opacity-40"
          >
            Adicionar
          </button>
        </form>
      </div>
    </div>
  )
}
