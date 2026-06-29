import { useState } from 'react'
import { useDocumentos } from '../../hooks/useDocumentos'
import { useToast } from '../../contexts/ToastContext'
import Card from '../ui/Card'
import PullToRefresh from '../ui/PullToRefresh'
import { APP_VERSION } from '../../lib/version'
import {
  FileText, Image, Link, Plus, Trash2, Upload, ExternalLink,
  Settings,
} from 'lucide-react'
import { Skeleton, SkeletonCard, SkeletonListItem } from '../ui/Skeleton'

const CATEGORIAS_DOC = [
  { value: 'passagem', label: 'Passagem', color: 'bg-blue/10 text-blue' },
  { value: 'seguro', label: 'Seguro', color: 'bg-green/10 text-green' },
  { value: 'hospedagem', label: 'Hospedagem', color: 'bg-purple/10 text-purple' },
  { value: 'ingresso', label: 'Ingresso', color: 'bg-orange/10 text-orange' },
  { value: 'outro', label: 'Outro', color: 'bg-muted/10 text-muted' },
]



function TipoIcon({ tipo }) {
  if (tipo === 'link') return <Link className="w-5 h-5" />
  if (['jpg', 'jpeg', 'png'].includes(tipo)) return <Image className="w-5 h-5" />
  return <FileText className="w-5 h-5" />
}

const CONTEXTOS_DOC = [
  { id: 'viagem', label: 'Viagem inteira' },
  { id: 'cidade', label: 'Cidade' },
]

function UploadModal({ onClose, onUpload, uploading }) {
  const [file, setFile] = useState(null)
  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState('outro')
  const [contexto, setContexto] = useState('viagem')
  const [contextoId, setContextoId] = useState('viagem')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!file || !nome.trim()) return
    const ctx = contexto === 'viagem' ? null : { tipo: 'cidade', id: contextoId.trim() }
    onUpload(file, nome.trim(), categoria, ctx)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-card w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 pb-10" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-separator mx-auto mb-5" />
        <h2 className="font-display text-xl font-bold mb-4">Adicionar documento</h2>
        {!file ? (
          <label className="tap-scale block w-full py-12 rounded-2xl border-2 border-dashed border-separator text-center cursor-pointer">
            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files[0])} />
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
              <button type="button" onClick={() => setFile(null)} className="text-muted text-sm">Trocar</button>
            </div>
            <input type="text" placeholder="Nome do documento" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-fill text-foreground outline-none text-[15px] placeholder:text-muted2" />
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-fill text-foreground outline-none text-[15px]">
              {CATEGORIAS_DOC.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
            </select>
            <div>
              <label className="text-[12px] text-muted font-semibold uppercase tracking-wide mb-1 block">Vincular a</label>
              <div className="flex gap-2">
                {CONTEXTOS_DOC.map((c) => (
                  <button key={c.id} type="button" onClick={() => { setContexto(c.id); if (c.id === 'viagem') setContextoId('viagem') }} className={`tap-scale flex-1 py-2.5 rounded-ios text-[12px] font-semibold ${contexto === c.id ? 'bg-blue text-white' : 'bg-fill text-text'}`}>{c.label}</button>
                ))}
              </div>
              {contexto === 'cidade' && (
                <input value={contextoId} onChange={(e) => setContextoId(e.target.value)} placeholder="Ex: Lisboa, Paris..." className="w-full px-4 py-3 rounded-xl bg-fill text-foreground outline-none text-[15px] placeholder:text-muted2 mt-2" />
              )}
            </div>
            <button type="submit" disabled={uploading || !nome.trim()} className="tap-scale w-full py-3 rounded-xl bg-blue text-white font-semibold text-[15px] disabled:opacity-40">
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
  const [contexto, setContexto] = useState('viagem')
  const [contextoId, setContextoId] = useState('viagem')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!nome.trim() || !url.trim()) return
    const ctx = contexto === 'viagem' ? null : { tipo: 'cidade', id: contextoId.trim() }
    onAdd(nome.trim(), categoria, url.trim(), ctx)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-card w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 pb-10" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-separator mx-auto mb-5" />
        <h2 className="font-display text-xl font-bold mb-4">Adicionar link</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Nome do documento" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-fill text-foreground outline-none text-[15px] placeholder:text-muted2" />
          <input type="url" placeholder="URL (Google Drive, iCloud, etc.)" value={url} onChange={(e) => setUrl(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-fill text-foreground outline-none text-[15px] placeholder:text-muted2" />
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-fill text-foreground outline-none text-[15px]">
            {CATEGORIAS_DOC.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
          </select>
          <div>
            <label className="text-[12px] text-muted font-semibold uppercase tracking-wide mb-1 block">Vincular a</label>
            <div className="flex gap-2">
              {CONTEXTOS_DOC.map((c) => (
                <button key={c.id} type="button" onClick={() => { setContexto(c.id); if (c.id === 'viagem') setContextoId('viagem') }} className={`tap-scale flex-1 py-2.5 rounded-ios text-[12px] font-semibold ${contexto === c.id ? 'bg-blue text-white' : 'bg-fill text-text'}`}>{c.label}</button>
              ))}
            </div>
            {contexto === 'cidade' && (
              <input value={contextoId} onChange={(e) => setContextoId(e.target.value)} placeholder="Ex: Lisboa, Paris..." className="w-full px-4 py-3 rounded-xl bg-fill text-foreground outline-none text-[15px] placeholder:text-muted2 mt-2" />
            )}
          </div>
          <button type="submit" disabled={!nome.trim() || !url.trim()} className="tap-scale w-full py-3 rounded-xl bg-blue text-white font-semibold text-[15px] disabled:opacity-40">Adicionar</button>
        </form>
      </div>
    </div>
  )
}

export default function MaisView() {
  const { documentos, loading: loadingDocs, recarregar: recarregarDocs, uploadArquivo, adicionarLink, removerDocumento } = useDocumentos()
  const addToast = useToast()

  const [aba, setAba] = useState('documentos')
  const [showUpload, setShowUpload] = useState(false)
  const [showAddLink, setShowAddLink] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [docParaExcluir, setDocParaExcluir] = useState(null)

  async function handleRefresh() {
    await recarregarDocs()
  }

  if (loadingDocs) return (
    <div className="space-y-5">
      <Skeleton className="h-9 w-24" />
      <Skeleton className="h-4 w-48 mt-1.5" />
      <SkeletonCard>{[1, 2, 3].map((i) => <SkeletonListItem key={i} />)}</SkeletonCard>
    </div>
  )

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-5">
        <h1 className="font-display text-[34px] font-bold tracking-tight">Mais</h1>

        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
          {[
            { id: 'documentos', label: 'Documentos' },
            { id: 'config', label: 'Configurações' },
            { id: 'sobre', label: 'Sobre' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setAba(t.id)}
              className={`tap-scale flex-shrink-0 px-3.5 py-1.5 rounded-full text-[14px] font-semibold ${
                aba === t.id ? 'bg-blue text-white' : 'bg-fill text-text'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {aba === 'documentos' && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-muted text-[15px]">{documentos.length} documento{documentos.length !== 1 ? 's' : ''}</p>
              <div className="flex gap-2">
                <button onClick={() => setShowAddLink(true)} aria-label="Adicionar link" className="tap-scale w-11 h-11 rounded-full bg-fill flex items-center justify-center text-muted"><Link className="w-5 h-5" /></button>
                <button onClick={() => setShowUpload(true)} aria-label="Adicionar documento" className="tap-scale w-11 h-11 rounded-full bg-blue text-white flex items-center justify-center"><Plus className="w-5 h-5" /></button>
              </div>
            </div>

            {documentos.length === 0 ? (
              <Card><div className="py-12 text-center text-muted"><FileText className="w-10 h-10 mx-auto mb-3 opacity-40" /><p className="text-[15px]">Nenhum documento ainda</p><p className="text-[13px] mt-1">Adicione passagens, seguros e outros docs</p></div></Card>
            ) : (
              <Card>
                {documentos.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 py-3 px-4 border-b border-separator last:border-b-0">
                    <div className="w-10 h-10 rounded-xl bg-fill flex items-center justify-center flex-shrink-0"><TipoIcon tipo={doc.tipo} /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[16px] truncate">{doc.nome}</p>
                      <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-md ${CATEGORIAS_DOC.find(c => c.value === doc.categoria)?.color || ''}`}>{CATEGORIAS_DOC.find(c => c.value === doc.categoria)?.label || doc.categoria}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.arquivo_url && (<a href={doc.arquivo_url} target="_blank" rel="noopener noreferrer" aria-label="Abrir documento" className="tap-scale w-8 h-8 rounded-full bg-fill flex items-center justify-center text-muted"><ExternalLink className="w-4 h-4" /></a>)}
                      <button onClick={() => setDocParaExcluir(doc)} aria-label="Excluir documento" className="tap-scale w-8 h-8 rounded-full bg-fill flex items-center justify-center text-red"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </Card>
            )}
          </>
        )}

        {aba === 'config' && (
          <Card><div className="p-4 text-center text-muted"><Settings className="w-8 h-8 mx-auto mb-2 opacity-40" /><p className="text-[15px]">Configurações</p><p className="text-[13px] mt-1">Em breve</p></div></Card>
        )}

        {aba === 'sobre' && (
          <Card><div className="p-4 text-center text-muted"><p className="text-[15px]">Europa Trip App</p><p className="text-[13px] mt-1">Versão {APP_VERSION || '1.0.0'}</p></div></Card>
        )}

        {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUpload={async (file, nome, categoria, contexto) => { setUploading(true); await uploadArquivo(file, nome, categoria, contexto); setUploading(false); setShowUpload(false) }} uploading={uploading} />}
        {showAddLink && <AddLinkModal onClose={() => setShowAddLink(false)} onAdd={async (nome, categoria, url, contexto) => { await adicionarLink(nome, categoria, url, contexto); setShowAddLink(false) }} />}

        {docParaExcluir && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => setDocParaExcluir(null)}>
            <div className="bg-card rounded-ios-lg p-6 mx-4 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-display text-[18px] font-bold mb-2">Excluir documento?</h3>
              <p className="text-[15px] text-muted mb-5">"{docParaExcluir.nome}" será removido permanentemente.</p>
              <div className="flex gap-3">
                <button onClick={() => setDocParaExcluir(null)} className="tap-scale flex-1 py-3 rounded-ios font-semibold text-[15px] bg-fill text-text">Cancelar</button>
                <button onClick={async () => { await removerDocumento(docParaExcluir.id); setDocParaExcluir(null); addToast('Documento excluído') }} className="tap-scale flex-1 py-3 rounded-ios font-semibold text-[15px] bg-red text-white">Excluir</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PullToRefresh>
  )
}
