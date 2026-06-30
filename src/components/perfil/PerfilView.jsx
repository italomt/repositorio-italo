import { useState } from 'react'
import { useViagem } from '../../hooks/useViagem'
import { useDocumentos } from '../../hooks/useDocumentos'
import { useAuthContext } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { APP_VERSION } from '../../lib/version'
import Card from '../ui/Card'
import DocumentUploadModal from '../documentos/DocumentUploadModal'
import DocumentLinkModal from '../documentos/DocumentLinkModal'
import {
  FileText, ExternalLink, Trash2, Settings, LogOut,
  Image, Link as LinkIcon,
} from 'lucide-react'

const CATEGORIAS_DOC = [
  { value: 'passagem', label: 'Passagem', color: 'bg-blue/10 text-blue' },
  { value: 'seguro', label: 'Seguro', color: 'bg-green/10 text-green' },
  { value: 'hospedagem', label: 'Hospedagem', color: 'bg-purple/10 text-purple' },
  { value: 'ingresso', label: 'Ingresso', color: 'bg-orange/10 text-orange' },
  { value: 'outro', label: 'Outro', color: 'bg-muted/10 text-muted' },
]

function TipoIcon({ tipo }) {
  if (tipo === 'link') return <LinkIcon className="w-5 h-5" />
  if (['jpg', 'jpeg', 'png'].includes(tipo)) return <Image className="w-5 h-5" />
  return <FileText className="w-5 h-5" />
}

export default function PerfilView() {
  const { usuario, profile, sair } = useAuthContext()
  const { viagemId } = useViagem()
  const { documentos, uploadArquivo, adicionarLink, removerDocumento } = useDocumentos(viagemId)
  const addToast = useToast()

  const [showUpload, setShowUpload] = useState(false)
  const [showLink, setShowLink] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [docParaExcluir, setDocParaExcluir] = useState(null)

  return (
    <div className="space-y-5">
      <h1 className="font-display text-[34px] font-bold tracking-tight">Perfil</h1>

      <Card>
        <div className="p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue text-white flex items-center justify-center font-display text-[20px] font-bold">
            {(profile?.nome || usuario?.email || '?')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[17px]">{profile?.nome || usuario?.email}</p>
            <p className="text-[13px] text-muted truncate">{usuario?.email}</p>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-muted text-[13px] font-semibold uppercase tracking-wide">Documentos</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowLink(true)} className="tap-scale w-9 h-9 rounded-full bg-fill flex items-center justify-center text-muted"><LinkIcon className="w-4 h-4" /></button>
          <button onClick={() => setShowUpload(true)} className="tap-scale w-9 h-9 rounded-full bg-fill flex items-center justify-center text-muted"><FileText className="w-4 h-4" /></button>
        </div>
      </div>

      {documentos.length === 0 ? (
        <Card><div className="py-10 text-center text-muted"><FileText className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-[14px]">Nenhum documento</p></div></Card>
      ) : (
        <Card>
          {documentos.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 py-3 px-4 border-b border-separator last:border-b-0">
              <div className="w-10 h-10 rounded-xl bg-fill flex items-center justify-center shrink-0"><TipoIcon tipo={doc.tipo} /></div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[15px] truncate">{doc.nome}</p>
                <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-md ${CATEGORIAS_DOC.find((c) => c.value === doc.categoria)?.color || ''}`}>
                  {CATEGORIAS_DOC.find((c) => c.value === doc.categoria)?.label || doc.categoria}
                </span>
              </div>
              {doc.arquivo_url && (
                <a href={doc.arquivo_url} target="_blank" rel="noopener noreferrer" className="tap-scale w-8 h-8 rounded-full bg-fill flex items-center justify-center"><ExternalLink className="w-4 h-4 text-muted" /></a>
              )}
              <button onClick={() => setDocParaExcluir(doc)} className="tap-scale w-8 h-8 rounded-full bg-fill flex items-center justify-center"><Trash2 className="w-4 h-4 text-red" /></button>
            </div>
          ))}
        </Card>
      )}

      <Card>
        <div className="p-4 text-center text-muted">
          <Settings className="w-6 h-6 mx-auto mb-2 opacity-40" />
          <p className="text-[14px]">Europa Trip App</p>
          <p className="text-[12px] mt-0.5">Versão {APP_VERSION || '1.15.5'}</p>
        </div>
      </Card>

      <button
        onClick={sair}
        className="tap-scale w-full py-3 text-red text-[15px] font-semibold"
      >
        <LogOut className="w-4 h-4 inline-block mr-2" />
        Sair
      </button>

      {showUpload && <DocumentUploadModal aberto onClose={() => setShowUpload(false)} onUpload={async (f, n, c, ctx) => { setUploading(true); await uploadArquivo(f, n, c, ctx); setUploading(false); setShowUpload(false) }} uploading={uploading} />}
      {showLink && <DocumentLinkModal aberto onClose={() => setShowLink(false)} onAdd={async (n, c, u, ctx) => { await adicionarLink(n, c, u, ctx); setShowLink(false) }} />}

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
  )
}
