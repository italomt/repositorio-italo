import { useState } from 'react'
import { useViagem } from '../../hooks/useViagem'
import { useDocumentos } from '../../hooks/useDocumentos'
import { useToast } from '../../contexts/ToastContext'
import { supabase } from '../../lib/supabase'
import Card from '../ui/Card'
import PullToRefresh from '../ui/PullToRefresh'
import { APP_VERSION } from '../../lib/version'
import {
  FileText, Image, Link, Plus, Trash2, ExternalLink,
  Settings, Share2, Copy, Check, LogIn, Loader2, AlertTriangle,
} from 'lucide-react'
import { Skeleton, SkeletonCard, SkeletonListItem } from '../ui/Skeleton'
import DocumentUploadModal from '../documentos/DocumentUploadModal'
import DocumentLinkModal from '../documentos/DocumentLinkModal'

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

function ViagemCard({ viagem, isActive, onSelecionar }) {
  const [showShare, setShowShare] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const codigo = viagem.codigo_convite
  const linkConvite = codigo ? `${window.location.origin}?convite=${codigo}` : ''

  function copiar(texto) {
    navigator.clipboard?.writeText(texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className={`rounded-ios ${isActive ? 'bg-blue/[0.04] ring-1 ring-blue/20' : 'bg-fill'} mb-2 overflow-hidden`}>
      <button
        onClick={() => onSelecionar(viagem.id)}
        className="tap-scale w-full flex items-center gap-3 p-4 text-left"
      >
        <span className="text-2xl flex-shrink-0">
          {viagem.tipo === 'trabalho' ? '💼' : viagem.tipo === 'mochilao' ? '🎒' : viagem.tipo === 'familia' ? '👨‍👩‍👧‍👦' : '✈️'}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[15px] truncate">{viagem.nome}</p>
          <p className="text-[12px] text-muted mt-0.5">
            {new Date(viagem.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} → {new Date(viagem.data_fim + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            {isActive && <span className="ml-2 text-[11px] font-semibold text-blue bg-blue/10 px-2 py-0.5 rounded-full">ativa</span>}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="font-mono text-[12px] font-semibold text-muted tracking-[2px]">{codigo}</span>
          <button
            onClick={(e) => { e.stopPropagation(); setShowShare(!showShare) }}
            className="tap-scale w-9 h-9 rounded-full bg-card flex items-center justify-center"
            aria-label="Compartilhar viagem"
          >
            <Share2 className="w-4 h-4 text-blue" />
          </button>
        </div>
      </button>

      {showShare && (
        <div className="px-4 pb-4 space-y-2">
          <div className="flex items-center gap-2 bg-card rounded-ios px-3 py-2.5">
            <span className="text-[12px] text-muted flex-shrink-0">Código:</span>
            <span className="font-mono text-[16px] font-bold tracking-[3px] text-blue">{codigo}</span>
            <button onClick={() => copiar(codigo)} className="tap-scale ml-auto px-2.5 py-1 rounded-full bg-blue text-white text-[11px] font-semibold flex items-center gap-1">
              {copiado ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copiado ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          <div className="bg-card rounded-ios px-3 py-2.5">
            <p className="text-[12px] text-muted mb-1.5">Link de convite:</p>
            <p className="text-[12px] text-muted2 break-all font-mono leading-relaxed">{linkConvite}</p>
            <button onClick={() => copiar(linkConvite)} className="tap-scale w-full mt-2 py-2 rounded-ios bg-blue text-white text-[13px] font-semibold">
              Copiar link
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MaisView() {
  const { viagens, viagem, viagemId, selecionarViagem, recarregar: recarregarViagens } = useViagem()
  const { documentos, loading: loadingDocs, recarregar: recarregarDocs, uploadArquivo, adicionarLink, removerDocumento } = useDocumentos(viagemId)
  const addToast = useToast()

  const [aba, setAba] = useState('documentos')
  const [showUpload, setShowUpload] = useState(false)
  const [showAddLink, setShowAddLink] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [docParaExcluir, setDocParaExcluir] = useState(null)
  const [codigoConvite, setCodigoConvite] = useState('')
  const [entrando, setEntrando] = useState(false)
  const [erroConvite, setErroConvite] = useState('')

  async function handleRefresh() {
    await Promise.all([recarregarDocs(), recarregarViagens()])
  }

  async function handleEntrarEmViagem() {
    const codigo = codigoConvite.trim().toUpperCase()
    if (!codigo) return

    setEntrando(true)
    setErroConvite('')

    const { data: viagemAlvo } = await supabase
      .from('viagens')
      .select('id, nome')
      .eq('codigo_convite', codigo)
      .maybeSingle()

    if (!viagemAlvo) {
      setErroConvite('Código inválido.')
      setEntrando(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    const { data: existente } = await supabase
      .from('usuarios_viagem')
      .select('id')
      .eq('viagem_id', viagemAlvo.id)
      .eq('usuario_id', user?.id)
      .maybeSingle()

    if (!existente) {
      await supabase.from('usuarios_viagem').insert({
        viagem_id: viagemAlvo.id,
        usuario_id: user?.id,
        papel: 'editor',
        status: 'aceito',
      })
    }

    await selecionarViagem(viagemAlvo.id)
    await recarregarViagens()
    setCodigoConvite('')
    setEntrando(false)
    addToast(`Entrou em "${viagemAlvo.nome}"`)
  }

  if (loadingDocs && aba === 'documentos') return (
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
            { id: 'viagens', label: 'Viagens' },
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

        {aba === 'viagens' && (
          <div className="space-y-4">
            <div className="bg-fill rounded-ios p-4 space-y-2">
              <p className="text-[12px] text-muted font-semibold uppercase tracking-wide">Entrar com código</p>
              <div className="flex gap-2">
                <input
                  value={codigoConvite}
                  onChange={(e) => { setCodigoConvite(e.target.value.toUpperCase()); setErroConvite('') }}
                  placeholder="ABC123"
                  maxLength={6}
                  className="flex-1 bg-card rounded-ios px-4 py-3 text-[18px] font-mono font-bold tracking-[4px] text-center placeholder:text-muted2 uppercase"
                />
                <button
                  onClick={handleEntrarEmViagem}
                  disabled={codigoConvite.length < 6 || entrando}
                  className="tap-scale px-5 py-3 rounded-ios bg-blue text-white font-semibold text-[14px] disabled:opacity-40 flex items-center gap-1.5 flex-shrink-0"
                >
                  {entrando ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                  Entrar
                </button>
              </div>
              {erroConvite && (
                <p className="text-[13px] text-red flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {erroConvite}</p>
              )}
            </div>

            {viagens.length === 0 ? (
              <div className="py-12 text-center text-muted rounded-ios bg-fill">
                <Share2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-[15px]">Nenhuma viagem</p>
                <p className="text-[13px] mt-1">Crie uma na aba Hoje</p>
              </div>
            ) : (
              viagens.map((v) => (
                <ViagemCard
                  key={v.id}
                  viagem={v}
                  isActive={viagem?.id === v.id}
                  onSelecionar={(id) => {
                    selecionarViagem(id)
                    addToast('Viagem ativa alterada')
                  }}
                />
              ))
            )}
          </div>
        )}

        {aba === 'sobre' && (
          <Card><div className="p-4 text-center text-muted"><p className="text-[15px]">Europa Trip App</p><p className="text-[13px] mt-1">Versão {APP_VERSION || '1.0.0'}</p></div></Card>
        )}

        {showUpload && <DocumentUploadModal aberto onClose={() => setShowUpload(false)} onUpload={async (file, nome, categoria, contexto) => { setUploading(true); await uploadArquivo(file, nome, categoria, contexto); setUploading(false); setShowUpload(false) }} uploading={uploading} />}
        {showAddLink && <DocumentLinkModal aberto onClose={() => setShowAddLink(false)} onAdd={async (nome, categoria, url, contexto) => { await adicionarLink(nome, categoria, url, contexto); setShowAddLink(false) }} />}

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
