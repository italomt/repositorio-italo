import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useViagem } from '../../contexts/ViagemContext'
import { useDocumentos } from '../../hooks/useDocumentos'
import { abrirDocumento } from '../../lib/documentos'
import { useAuthContext } from '../../contexts/AuthContext'
import { suportaNotificacoes, permissaoAtual, ativarNotificacoes } from '../../lib/pushNotifications'
import { useToast } from '../../contexts/ToastContext'
import { supabase } from '../../lib/supabase'
import Card from '../ui/Card'
import PullToRefresh from '../ui/PullToRefresh'
import { APP_VERSION } from '../../lib/version'
import {
  FileText, Image, Link, Plus, Trash2, ExternalLink,
  Share2, Copy, Check, LogIn, Loader2, AlertTriangle, Users, Crown, Pencil,
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

const TIPOS_VIAGEM = [
  { id: 'lazer', label: 'Lazer', icon: '🌴' },
  { id: 'trabalho', label: 'Trabalho', icon: '💼' },
  { id: 'mochilao', label: 'Mochilão', icon: '🎒' },
  { id: 'familia', label: 'Família', icon: '👨‍👩‍👧‍👦' },
]

function TipoIcon({ tipo }) {
  if (tipo === 'link') return <Link className="w-5 h-5" />
  if (['jpg', 'jpeg', 'png'].includes(tipo)) return <Image className="w-5 h-5" />
  return <FileText className="w-5 h-5" />
}

function ViagemCard({ viagem, isActive, onSelecionar, onEditar, participantes }) {
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
      <button onClick={() => onSelecionar(viagem.id)} className="tap-scale w-full flex items-center gap-3 p-4 text-left">
        <span className="text-2xl flex-shrink-0">{TIPOS_VIAGEM.find(t => t.id === viagem.tipo)?.icon || '✈️'}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[15px] truncate">{viagem.nome}</p>
          <p className="text-[12px] text-muted mt-0.5">
            {new Date(viagem.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} → {new Date(viagem.data_fim + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            {isActive && <span className="ml-2 text-[11px] font-semibold text-blue bg-blue/10 px-2 py-0.5 rounded-full">ativa</span>}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="font-mono text-[11px] font-semibold text-muted tracking-[1px]">{codigo}</span>
          <button onClick={(e) => { e.stopPropagation(); onEditar(viagem) }} className="tap-scale w-9 h-9 rounded-full bg-card flex items-center justify-center" aria-label="Editar viagem">
            <Pencil className="w-3.5 h-3.5 text-muted" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setShowShare(!showShare) }} className="tap-scale w-9 h-9 rounded-full bg-card flex items-center justify-center" aria-label="Compartilhar">
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
              {copiado ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}{copiado ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          <div className="bg-card rounded-ios px-3 py-2.5">
            <p className="text-[12px] text-muted mb-1.5">Link:</p>
            <p className="text-[12px] text-muted2 break-all font-mono leading-relaxed">{linkConvite}</p>
            <button onClick={() => copiar(linkConvite)} className="tap-scale w-full mt-2 py-2 rounded-ios bg-blue text-white text-[13px] font-semibold">Copiar link</button>
          </div>
          {participantes.length > 0 && (
            <div className="bg-card rounded-ios px-3 py-2.5">
              <p className="text-[12px] text-muted font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Participantes ({participantes.length})</p>
              <div className="space-y-1.5">
                {participantes.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-[14px]">
                    <span className="w-7 h-7 rounded-full bg-blue/10 text-blue flex items-center justify-center text-[12px] font-bold flex-shrink-0">{p.profiles?.nome?.[0]?.toUpperCase() ?? '?'}</span>
                    <span className="flex-1 font-medium truncate">{p.profiles?.nome ?? 'Usuário'}</span>
                    {p.papel === 'owner' && <span className="text-[11px] font-semibold text-orange bg-orange/10 px-2 py-0.5 rounded-full flex items-center gap-1"><Crown className="w-3 h-3" /> Owner</span>}
                    {p.papel === 'editor' && <span className="text-[11px] font-semibold text-blue/70 bg-blue/5 px-2 py-0.5 rounded-full">Editor</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function MaisView() {
  const navigate = useNavigate()
  const { viagens, viagem, viagemId, selecionarViagem, recarregar: recarregarViagens } = useViagem()
  const { documentos, loading: loadingDocs, recarregar: recarregarDocs, uploadArquivo, adicionarLink, removerDocumento } = useDocumentos(viagemId)
  const { usuario, profile, sair } = useAuthContext()
  const addToast = useToast()

  const [aba, setAba] = useState('documentos')
  const [ativandoNotificacoes, setAtivandoNotificacoes] = useState(false)
  const [permissaoNotificacoes, setPermissaoNotificacoes] = useState(permissaoAtual())
  const [showUpload, setShowUpload] = useState(false)
  const [showAddLink, setShowAddLink] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [docParaExcluir, setDocParaExcluir] = useState(null)
  const [codigoConvite, setCodigoConvite] = useState('')
  const [entrando, setEntrando] = useState(false)
  const [erroConvite, setErroConvite] = useState('')
  const [participantes, setParticipantes] = useState({})

  useEffect(() => {
    if (aba !== 'viagens' || viagens.length === 0) return
    Promise.all(
      viagens.map((v) =>
        supabase.from('usuarios_viagem').select('papel, status, profiles(nome)').eq('viagem_id', v.id)
          .then(({ data }) => ({ id: v.id, data: data || [] }))
      )
    ).then((results) => {
      const map = {}
      results.forEach((r) => { map[r.id] = r.data })
      setParticipantes(map)
    })
  }, [aba, viagens])

  async function handleRefresh() {
    await Promise.all([recarregarDocs(), recarregarViagens()])
  }

  async function handleEntrarEmViagem() {
    const codigo = codigoConvite.trim().toUpperCase()
    if (!codigo) return
    setEntrando(true)
    setErroConvite('')

    // RPC valida o código e cuida do vínculo (security definer) — não dá pra
    // entrar numa viagem sem um código válido.
    const { data, error } = await supabase.rpc('entrar_em_viagem_por_codigo', { p_codigo: codigo })
    const viagemAlvo = data?.[0]
    if (error || !viagemAlvo) { setErroConvite('Código inválido.'); setEntrando(false); return }

    await selecionarViagem(viagemAlvo.id)
    await recarregarViagens()
    setCodigoConvite('')
    setEntrando(false)
    addToast(viagemAlvo.ja_membro ? `Você já está em "${viagemAlvo.nome}"` : `Entrou em "${viagemAlvo.nome}"`)
  }

  async function handleAtivarNotificacoes() {
    setAtivandoNotificacoes(true)
    const { error } = await ativarNotificacoes(usuario?.id)
    setAtivandoNotificacoes(false)
    setPermissaoNotificacoes(permissaoAtual())
    if (error) { addToast(error.message, 'error'); return }
    addToast('Notificações ativadas!')
  }

  async function handleEditarViagem(v) {
    if (v.id !== viagem?.id) await selecionarViagem(v.id)
    navigate('/viagem/editar')
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
        <>
            <h1 className="font-display text-[34px] font-bold tracking-tight">Mais</h1>

            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
              {[
                { id: 'documentos', label: 'Documentos' },
                { id: 'viagens', label: 'Viagens' },
                { id: 'sobre', label: 'Sobre' },
              ].map((t) => (
                <button key={t.id} onClick={() => setAba(t.id)}
                  className={`tap-scale flex-shrink-0 px-3.5 py-1.5 rounded-full text-[14px] font-semibold ${aba === t.id ? 'bg-blue text-white' : 'bg-fill text-text'}`}>
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
                          {doc.arquivo_url && (<button onClick={() => abrirDocumento(doc)} aria-label="Abrir documento" className="tap-scale w-8 h-8 rounded-full bg-fill flex items-center justify-center text-muted"><ExternalLink className="w-4 h-4" /></button>)}
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
                    <input value={codigoConvite} onChange={(e) => { setCodigoConvite(e.target.value.toUpperCase()); setErroConvite('') }} placeholder="ABC123" maxLength={6}
                      className="flex-1 min-w-0 bg-card rounded-ios px-3 py-3 text-[16px] font-mono font-bold tracking-[2px] text-center placeholder:text-muted2 uppercase" />
                    <button onClick={handleEntrarEmViagem} disabled={codigoConvite.length < 6 || entrando}
                      className="tap-scale w-12 h-12 rounded-ios bg-blue text-white disabled:opacity-40 flex items-center justify-center flex-shrink-0" aria-label="Entrar na viagem">
                      {entrando ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                    </button>
                  </div>
                  {erroConvite && <p className="text-[13px] text-red flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {erroConvite}</p>}
                </div>

                {viagens.length === 0 ? (
                  <div className="py-12 text-center text-muted rounded-ios bg-fill">
                    <Share2 className="w-10 h-10 mx-auto mb-3 opacity-40" /><p className="text-[15px]">Nenhuma viagem</p><p className="text-[13px] mt-1">Crie uma na aba Hoje</p>
                  </div>
                ) : (
                  viagens.map((v) => (
                    <ViagemCard key={v.id} viagem={v} isActive={viagem?.id === v.id} participantes={participantes[v.id] || []}
                      onSelecionar={(id) => { selecionarViagem(id); addToast('Viagem ativa alterada') }}
                      onEditar={handleEditarViagem} />
                  ))
                )}
              </div>
            )}

            {aba === 'sobre' && (
              <div className="space-y-4">
                <Card>
                  <div className="p-4 text-center text-muted">
                    <img src="/icon-192.png" alt="viaja.ai" className="w-12 h-12 rounded-[14px] mx-auto mb-2" />
                    <p className="text-[15px] font-semibold text-text">viaja.ai</p>
                    <p className="text-[13px] mt-1">Versão {APP_VERSION || '1.0.0'}</p>
                  </div>
                </Card>
                {suportaNotificacoes() && (
                  <div className="bg-fill rounded-ios p-4">
                    <p className="text-[12px] text-muted font-semibold uppercase tracking-wide mb-1">Notificações</p>
                    {permissaoNotificacoes === 'granted' ? (
                      <p className="text-[14px] text-green font-medium">Ativadas — você vai receber avisos de clima e prazos.</p>
                    ) : permissaoNotificacoes === 'denied' ? (
                      <p className="text-[14px] text-muted">Bloqueadas no navegador. Ative pelas configurações do Safari.</p>
                    ) : (
                      <>
                        <p className="text-[14px] text-muted mb-3">Receba avisos de clima, prazos e pendências da viagem.</p>
                        <button
                          onClick={handleAtivarNotificacoes}
                          disabled={ativandoNotificacoes}
                          className="tap-scale w-full py-3 rounded-ios bg-blue text-white font-semibold text-[15px] disabled:opacity-50"
                        >
                          {ativandoNotificacoes ? 'Ativando...' : 'Ativar notificações'}
                        </button>
                      </>
                    )}
                  </div>
                )}
                <div className="bg-fill rounded-ios p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-blue text-white flex items-center justify-center font-semibold text-[16px]">{profile?.nome?.[0]?.toUpperCase() ?? '?'}</div>
                    <div><p className="font-semibold text-[15px]">{profile?.nome}</p><p className="text-muted text-[13px]">Logado</p></div>
                  </div>
                  <button onClick={sair} className="tap-scale w-full py-3 rounded-ios bg-red/10 text-red font-semibold text-[15px]">Sair da conta</button>
                </div>
              </div>
            )}
        </>

        {showUpload && <DocumentUploadModal aberto onClose={() => setShowUpload(false)} onUpload={async (file, nome, categoria, contexto) => { setUploading(true); await uploadArquivo(file, nome, categoria, contexto); setUploading(false); setShowUpload(false) }} uploading={uploading} />}
        {showAddLink && <DocumentLinkModal aberto onClose={() => setShowAddLink(false)} onAdd={async (nome, categoria, url, contexto) => { await adicionarLink(nome, categoria, url, contexto); setShowAddLink(false) }} />}
        {docParaExcluir && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => setDocParaExcluir(null)}>
            <div className="bg-card rounded-ios-lg p-6 mx-4 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-display text-[18px] font-bold mb-2">Excluir documento?</h3>
              <p className="text-[15px] text-muted mb-5">"{docParaExcluir.nome}" será removido permanentemente.</p>
              <div className="flex gap-3">
                <button onClick={() => setDocParaExcluir(null)} className="tap-scale flex-1 py-3 rounded-ios font-semibold text-[15px] bg-fill text-text">Cancelar</button>
                <button onClick={async () => { await removerDocumento(docParaExcluir.id, docParaExcluir); setDocParaExcluir(null); addToast('Documento excluído') }} className="tap-scale flex-1 py-3 rounded-ios font-semibold text-[15px] bg-red text-white">Excluir</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PullToRefresh>
  )
}
