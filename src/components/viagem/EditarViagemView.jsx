import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useViagem } from '../../contexts/ViagemContext'
import { useDestinos } from '../../hooks/useDestinos'
import { useAcomodacoes } from '../../hooks/useAcomodacoes'
import { useAtracoes } from '../../hooks/useAtracoes'
import { useGastos } from '../../hooks/useGastos'
import { useToast } from '../../contexts/ToastContext'
import { supabase } from '../../lib/supabase'
import Modal from '../ui/Modal'
import CidadeAutocomplete from '../ui/CidadeAutocomplete'
import EnderecoAutocomplete from '../ui/EnderecoAutocomplete'
import AtribuirDiasGrid from './AtribuirDiasGrid'
import ReatribuirDiaSheet from './ReatribuirDiaSheet'
import { CORES_DIA } from './coresCidade'
import { ArrowLeft, Trash, Copy, Users, Crown, ChevronDown, AlertTriangle, Loader2, Bed, Share2, SlidersHorizontal, MapPinned } from 'lucide-react'

const TIPOS_VIAGEM = [
  { id: 'lazer', label: 'Lazer', icon: '🌴' },
  { id: 'trabalho', label: 'Trabalho', icon: '💼' },
  { id: 'mochilao', label: 'Mochilão', icon: '🎒' },
  { id: 'familia', label: 'Família', icon: '👨‍👩‍👧‍👦' },
]

const MOEDAS = ['EUR', 'USD', 'CHF', 'BRL', 'GBP']

export default function EditarViagemView() {
  const navigate = useNavigate()
  const { viagem, viagemId, atualizarViagem } = useViagem()
  const { destinos, reatribuirDia, limparDia, removerDia, adicionarDia, upsertCidade } = useDestinos(viagemId)
  const { acomodacoes, salvar: salvarHospedagem, remover: removerHospedagem } = useAcomodacoes(viagemId)
  const { atracoes } = useAtracoes(viagemId)
  const { gastos } = useGastos(viagemId)
  const addToast = useToast()

  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [tipo, setTipo] = useState('lazer')
  const [moeda, setMoeda] = useState('EUR')
  const [orcamento, setOrcamento] = useState('')
  const [salvando, setSalvando] = useState(false)

  const [cidadeAtivaId, setCidadeAtivaId] = useState(null)
  const [cidadesStaged, setCidadesStaged] = useState([])
  const [mode, setMode] = useState('atribuir')
  const [reatribuindo, setReatribuindo] = useState(null)
  const [confirmarRemoverDia, setConfirmarRemoverDia] = useState(null)
  const [adicionandoCidade, setAdicionandoCidade] = useState(false)
  const [novaCidadeNome, setNovaCidadeNome] = useState('')
  const [adicionandoDia, setAdicionandoDia] = useState(null)

  const [detalhesExpandido, setDetalhesExpandido] = useState(false)
  const [hospedagemExpandido, setHospedagemExpandido] = useState(true)
  const [compartilharExpandido, setCompartilharExpandido] = useState(false)

  const [excluindo, setExcluindo] = useState(false)
  const [confirmarExcluir, setConfirmarExcluir] = useState(false)

  const [participantes, setParticipantes] = useState([])
  const [hospDrafts, setHospDrafts] = useState({})
  const [gridModificada, setGridModificada] = useState(false)

  useEffect(() => {
    if (viagem?.id) {
      setNome(viagem.nome || '')
      setDescricao(viagem.descricao || '')
      setDataInicio(viagem.data_inicio || '')
      setDataFim(viagem.data_fim || '')
      setTipo(viagem.tipo || 'lazer')
      setMoeda(viagem.moeda_principal || 'EUR')
      setOrcamento(viagem.orcamento_total ? String(viagem.orcamento_total) : '')
    }
  }, [viagem?.id])

  useEffect(() => {
    if (!viagemId) return
    supabase
      .from('usuarios_viagem')
      .select('papel, status, profiles(nome)')
      .eq('viagem_id', viagemId)
      .then(({ data }) => { if (data) setParticipantes(data) })
  }, [viagemId])

  const cidadesViagem = useMemo(() => {
    const map = new Map()
    destinos.forEach((d) => {
      if (d.cidade_id && !map.has(d.cidade_id)) {
        map.set(d.cidade_id, { id: d.cidade_id, nome: d.cidade, pais: d.pais, flag: d.flag_emoji, staged: false })
      }
    })
    acomodacoes.forEach((h) => {
      if (h.cidade_id && !map.has(h.cidade_id)) {
        map.set(h.cidade_id, { id: h.cidade_id, nome: h.cidade, pais: h.pais, flag: h.flag_emoji, staged: false })
      }
    })
    cidadesStaged.forEach((c) => {
      if (!map.has(c.id)) map.set(c.id, { ...c, staged: true })
    })
    return Array.from(map.values())
  }, [destinos, acomodacoes, cidadesStaged])

  const corDeCidade = useMemo(() => {
    const map = {}
    cidadesViagem.forEach((c, i) => { map[c.id] = i % CORES_DIA.length })
    return map
  }, [cidadesViagem])

  const childrenCount = useMemo(() => {
    const map = {}
    destinos.forEach((d) => { map[d.id] = { atracoes: 0, gastos: 0 } })
    atracoes.forEach((a) => {
      if (map[a.destino_id]) map[a.destino_id].atracoes++
    })
    gastos.forEach((g) => {
      if (map[g.destino_id]) map[g.destino_id].gastos++
    })
    return map
  }, [destinos, atracoes, gastos])

  const dirty = useMemo(() => {
    if (!viagem) return false
    return nome !== (viagem.nome || '') ||
      descricao !== (viagem.descricao || '') ||
      dataInicio !== (viagem.data_inicio || '') ||
      dataFim !== (viagem.data_fim || '') ||
      tipo !== (viagem.tipo || 'lazer') ||
      moeda !== (viagem.moeda_principal || 'EUR') ||
      (orcamento || '') !== (viagem.orcamento_total ? String(viagem.orcamento_total) : '')
  }, [nome, descricao, dataInicio, dataFim, tipo, moeda, orcamento, viagem])

  useEffect(() => {
    if (!cidadeAtivaId && cidadesViagem.length > 0 && mode === 'atribuir') {
      setCidadeAtivaId(cidadesViagem[0].id)
    }
  }, [cidadesViagem, cidadeAtivaId, mode])

  function handleSelecionarCidade(id) {
    if (id === '__remover__') {
      setMode('remover')
    } else {
      setMode('atribuir')
      setCidadeAtivaId(id)
    }
  }

  async function handleAtribuirDia(dia) {
    if (!cidadeAtivaId || mode === 'remover') return
    if (dia.cidade_id === cidadeAtivaId) return

    const counts = childrenCount[dia.id] || { atracoes: 0, gastos: 0 }
    if (counts.atracoes === 0 && counts.gastos === 0) {
      const { error } = await reatribuirDia(dia.id, cidadeAtivaId)
      if (error) addToast('Erro ao mudar cidade', 'error')
      else setGridModificada(true)
    } else {
      const cidadeOrigem = cidadesViagem.find((c) => c.id === dia.cidade_id)
      const cidadeDestino = cidadesViagem.find((c) => c.id === cidadeAtivaId)
      setReatribuindo({
        dia,
        cidadeDestinoId: cidadeAtivaId,
        cidadeOrigemNome: cidadeOrigem?.nome || '—',
        cidadeDestinoNome: cidadeDestino?.nome || '—',
        counts,
      })
    }
  }

  async function handleMoverDia() {
    if (!reatribuindo) return
    const { error } = await reatribuirDia(reatribuindo.dia.id, reatribuindo.cidadeDestinoId)
    setReatribuindo(null)
    if (error) addToast('Erro ao mover dia', 'error')
    else { addToast('Dia movido com atrações e gastos'); setGridModificada(true) }
  }

  async function handleLimparEReatribuir() {
    if (!reatribuindo) return
    await limparDia(reatribuindo.dia.id)
    const { error } = await reatribuirDia(reatribuindo.dia.id, reatribuindo.cidadeDestinoId)
    setReatribuindo(null)
    if (error) addToast('Erro ao mudar cidade', 'error')
    else { addToast('Dia limpo e mudado de cidade'); setGridModificada(true) }
  }

  async function handleRemoverDia(dia) {
    const counts = childrenCount[dia.id] || { atracoes: 0, gastos: 0 }
    if (counts.atracoes > 0 || counts.gastos > 0) {
      setConfirmarRemoverDia({ dia, counts })
    } else {
      const { error } = await removerDia(dia.id)
      if (error) addToast('Erro ao remover dia', 'error')
      else { addToast('Dia removido'); setGridModificada(true) }
    }
  }

  async function handleConfirmarRemoverDia() {
    if (!confirmarRemoverDia) return
    const { error } = await removerDia(confirmarRemoverDia.dia.id)
    setConfirmarRemoverDia(null)
    if (error) addToast('Erro ao remover dia', 'error')
    else { addToast('Dia removido com suas atrações e gastos', 'info'); setGridModificada(true) }
  }

  async function handleAdicionarCidadeSelecionada({ cidade, pais, flagEmoji, latitude, longitude }) {
    const { data, error } = await upsertCidade({ nome: cidade, pais, flag_emoji: flagEmoji, latitude, longitude })
    if (error || !data) {
      addToast('Erro ao adicionar cidade', 'error')
      return
    }
    if (cidadesViagem.some((c) => c.id === data.id)) {
      addToast('Esta cidade já está na viagem', 'info')
      setCidadeAtivaId(data.id)
      setAdicionandoCidade(false)
      setNovaCidadeNome('')
      return
    }
    setCidadesStaged([...cidadesStaged, { id: data.id, nome: data.nome, pais: data.pais, flag: data.flag_emoji || flagEmoji }])
    setCidadeAtivaId(data.id)
    setMode('atribuir')
    setAdicionandoCidade(false)
    setNovaCidadeNome('')
    setGridModificada(true)
    addToast(`${data.nome} adicionada — atribua dias a ela`)
  }

  async function handleRemoverCidade(cidadeId) {
    const temDias = destinos.some((d) => d.cidade_id === cidadeId)
    const temHosp = acomodacoes.some((h) => h.cidade_id === cidadeId)
    if (temDias || temHosp) {
      addToast('Remova os dias e hospedagens desta cidade primeiro', 'error')
      return
    }
    setCidadesStaged((prev) => prev.filter((c) => c.id !== cidadeId))
    if (cidadeAtivaId === cidadeId) {
      const outra = cidadesViagem.find((c) => c.id !== cidadeId)
      setCidadeAtivaId(outra?.id || null)
    }
    setGridModificada(true)
    addToast('Cidade removida da viagem', 'info')
  }

  async function handleAdicionarDia(data) {
    if (!data || !cidadeAtivaId || mode === 'remover') return
    if (destinos.some((d) => d.data === data)) {
      addToast('Já existe um dia para esta data', 'error')
      return
    }
    const { error } = await adicionarDia(data, cidadeAtivaId)
    if (error) {
      addToast('Erro ao adicionar dia', 'error')
    } else {
      addToast('Dia adicionado')
      setGridModificada(true)
    }
    setAdicionandoDia(null)
  }

  async function handleSalvarMetadata() {
    if (!viagemId) return
    setSalvando(true)
    const { error } = await atualizarViagem(viagemId, {
      nome,
      descricao: descricao || null,
      data_inicio: dataInicio,
      data_fim: dataFim,
      tipo,
      moeda_principal: moeda,
      orcamento_total: orcamento ? Number(orcamento) : null,
    })
    setSalvando(false)
    if (error) addToast('Erro ao salvar', 'error')
    else { addToast('Alterações salvas'); setGridModificada(false) }
  }

  function handleVoltar() {
    if (dirty) {
      addToast('Alterações dos detalhes não salvas', 'error', 4000)
      return
    }
    if (gridModificada) {
      addToast('Alterações do roteiro salvas', 'success')
    }
    navigate(-1)
  }

  async function handleExcluir() {
    setExcluindo(true)
    await supabase.from('gastos').delete().eq('viagem_id', viagemId)
    await supabase.from('pendencias').delete().eq('viagem_id', viagemId)
    await supabase.from('atracoes').delete().eq('viagem_id', viagemId)
    await supabase.from('transportes').delete().eq('viagem_id', viagemId)
    await supabase.from('documentos').delete().eq('viagem_id', viagemId)
    await supabase.from('hospedagens').delete().eq('viagem_id', viagemId)
    await supabase.from('usuarios_viagem').delete().eq('viagem_id', viagemId)
    await supabase.from('viagens').delete().eq('id', viagemId)
    setExcluindo(false)
    setConfirmarExcluir(false)
    window.dispatchEvent(new CustomEvent('viagem-excluida'))
    addToast('Viagem excluída', 'info')
    navigate('/')
  }

  function copiar(texto) {
    navigator.clipboard?.writeText(texto)
    addToast('Copiado')
  }

  if (!viagem) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-muted animate-spin" />
      </div>
    )
  }

  const codigo = viagem.codigo_convite
  const linkConvite = codigo ? `${window.location.origin}?convite=${codigo}` : ''

  return (
    <div className="space-y-5">
      {createPortal(
        <div className="fixed top-0 left-0 right-0 z-30 mx-auto max-w-md px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3 bg-bg/95 backdrop-blur-lg flex items-center gap-3">
          <button onClick={handleVoltar} className="tap-scale w-11 h-11 rounded-full bg-fill flex items-center justify-center flex-shrink-0" aria-label="Voltar">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-[22px] font-bold tracking-tight truncate flex-1">Editar viagem</h1>
          <button
            onClick={handleSalvarMetadata}
            disabled={salvando || !dirty}
            className={`tap-scale px-4 py-2 rounded-ios font-semibold text-[14px] disabled:opacity-40 ${dirty ? 'bg-blue text-white' : 'bg-fill text-muted2'}`}
          >
            {salvando ? 'Salvando...' : dirty ? 'Salvar' : 'Salvo'}
          </button>
        </div>,
        document.body,
      )}
      <div className="h-[68px] flex-shrink-0" />

      {/* Roteiro - Grid hero */}
      <div>
        <p className="text-[12px] text-muted font-semibold uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <MapPinned className="w-3.5 h-3.5" /> Roteiro
          {gridModificada && (
            <span className="text-[10px] font-bold text-green bg-green/10 px-2 py-0.5 rounded-full normal-case tracking-normal">salvo</span>
          )}
        </p>
        <AtribuirDiasGrid
          destinos={destinos}
          cidadesViagem={cidadesViagem}
          cidadeAtivaId={cidadeAtivaId}
          mode={mode}
          onSelecionarCidade={handleSelecionarCidade}
          onAtribuirDia={handleAtribuirDia}
          onRemoverDia={handleRemoverDia}
          onRemoverCidade={handleRemoverCidade}
          onAdicionarCidade={() => setAdicionandoCidade(true)}
          onAdicionarDia={() => setAdicionandoDia('')}
          corDeCidade={corDeCidade}
          childrenCount={childrenCount}
        />
      </div>

      {/* Hospedagem */}
      <div>
        <button onClick={() => setHospedagemExpandido(!hospedagemExpandido)} className="tap-scale w-full flex items-center justify-between py-2">
          <p className="text-[12px] text-muted font-semibold uppercase tracking-wide flex items-center gap-1.5">
            <Bed className="w-3.5 h-3.5" /> Hospedagem
          </p>
          <ChevronDown className={`w-4 h-4 text-muted2 transition-transform ${hospedagemExpandido ? 'rotate-180' : ''}`} />
        </button>
        {hospedagemExpandido && (
          <div className="space-y-3 mt-2">
            {cidadesViagem.filter((c) => !c.staged).length === 0 ? (
              <p className="text-[14px] text-muted text-center py-4">Adicione cidades ao roteiro primeiro</p>
            ) : (
              cidadesViagem.filter((c) => !c.staged).map((cidade) => {
                const hosp = acomodacoes.find((h) => h.cidade_id === cidade.id)
                const draftValue = hospDrafts[cidade.id] !== undefined ? hospDrafts[cidade.id] : (hosp?.endereco || '')
                return (
                  <div key={cidade.id} className="bg-fill rounded-ios p-3">
                    <p className="text-[13px] font-semibold mb-2 flex items-center gap-1.5">
                      <span>{cidade.flag}</span> {cidade.nome}
                    </p>
                    <EnderecoAutocomplete
                      value={draftValue}
                      onChange={(endereco) => setHospDrafts({ ...hospDrafts, [cidade.id]: endereco })}
                      onSelecionar={async ({ endereco, nome, latitude, longitude }) => {
                        setHospDrafts({ ...hospDrafts, [cidade.id]: endereco })
                        await salvarHospedagem({
                          id: hosp?.id,
                          cidade_id: cidade.id,
                          nome: nome || endereco.split(',')[0] || '',
                          endereco,
                          latitude,
                          longitude,
                          tipo: 'hotel',
                          status: 'reservada',
                        })
                        addToast('Hospedagem salva')
                        setGridModificada(true)
                      }}
                      placeholder="Buscar endereço no Google Maps"
                      cidade={cidade.nome}
                    />
                    {hosp && (
                      <button
                        onClick={async () => {
                          await removerHospedagem(hosp.id)
                          setHospDrafts({ ...hospDrafts, [cidade.id]: '' })
                          setGridModificada(true)
                          addToast('Hospedagem removida', 'info')
                        }}
                        className="tap-scale mt-2 text-[12px] text-red font-medium"
                      >
                        Remover hospedagem
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Detalhes */}
      <div>
        <button onClick={() => setDetalhesExpandido(!detalhesExpandido)} className="tap-scale w-full flex items-center justify-between py-2">
          <p className="text-[12px] text-muted font-semibold uppercase tracking-wide flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Detalhes
            {dirty && (
              <span className="text-[10px] font-bold text-orange bg-orange/10 px-2 py-0.5 rounded-full normal-case tracking-normal">não salvo</span>
            )}
          </p>
          <ChevronDown className={`w-4 h-4 text-muted2 transition-transform ${detalhesExpandido ? 'rotate-180' : ''}`} />
        </button>
        {detalhesExpandido && (
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Nome</label>
              <input value={nome} onChange={(e) => setNome(e.target.value)} className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans mt-1" />
            </div>
            <div>
              <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Descrição</label>
              <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} placeholder="Descreva sua viagem..." className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans placeholder:text-muted mt-1" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Início</label>
                <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans mt-1" />
              </div>
              <div className="flex-1">
                <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Fim</label>
                <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans mt-1" />
              </div>
            </div>
            <div>
              <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Tipo</label>
              <div className="grid grid-cols-4 gap-2 mt-1">
                {TIPOS_VIAGEM.map((t) => (
                  <button key={t.id} onClick={() => setTipo(t.id)}
                    className={`tap-scale py-3 rounded-ios flex flex-col items-center gap-0.5 ${tipo === t.id ? 'bg-blue text-white' : 'bg-fill text-text'}`}>
                    <span className="text-[16px]">{t.icon}</span>
                    <span className="text-[10px] font-semibold">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Moeda</label>
                <select value={moeda} onChange={(e) => setMoeda(e.target.value)} className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans mt-1">
                  {MOEDAS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Orçamento</label>
                <input type="number" value={orcamento} onChange={(e) => setOrcamento(e.target.value)} placeholder="0,00" className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans tabular-nums placeholder:text-muted mt-1" />
              </div>
            </div>
            <button
              onClick={handleSalvarMetadata}
              disabled={salvando || !dirty}
              className={`tap-scale w-full py-3.5 rounded-ios font-semibold text-[16px] flex items-center justify-center gap-2 transition-colors ${
                dirty ? 'bg-blue text-white' : 'bg-fill text-muted2'
              }`}
            >
              {salvando ? 'Salvando...' : dirty ? 'Salvar alterações' : 'Tudo salvo'}
            </button>
          </div>
        )}
      </div>

      {/* Compartilhar */}
      <div>
        <button onClick={() => setCompartilharExpandido(!compartilharExpandido)} className="tap-scale w-full flex items-center justify-between py-2">
          <p className="text-[12px] text-muted font-semibold uppercase tracking-wide flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5" /> Compartilhar
          </p>
          <ChevronDown className={`w-4 h-4 text-muted2 transition-transform ${compartilharExpandido ? 'rotate-180' : ''}`} />
        </button>
        {compartilharExpandido && (
          <div className="space-y-3 mt-2">
            <div className="bg-fill rounded-ios p-4 space-y-3">
              {codigo && (
                <div className="flex items-center gap-2 bg-card rounded-ios px-3 py-2.5">
                  <span className="text-[12px] text-muted flex-shrink-0">Código:</span>
                  <span className="font-mono text-[18px] font-bold tracking-[3px] text-blue">{codigo}</span>
                  <button onClick={() => copiar(codigo)} className="tap-scale ml-auto px-3 py-1.5 rounded-full bg-blue text-white text-[12px] font-semibold flex items-center gap-1">
                    <Copy className="w-3 h-3" /> Copiar
                  </button>
                </div>
              )}
              {linkConvite && (
                <div className="bg-card rounded-ios px-3 py-2.5">
                  <p className="text-[12px] text-muted mb-1.5">Link de convite:</p>
                  <p className="text-[12px] text-muted2 break-all font-mono leading-relaxed">{linkConvite}</p>
                  <button onClick={() => copiar(linkConvite)} className="tap-scale w-full mt-2 py-2 rounded-ios bg-blue text-white text-[13px] font-semibold">Copiar link</button>
                </div>
              )}
            </div>
            <div className="bg-fill rounded-ios p-4">
              <p className="text-[12px] text-muted font-semibold uppercase tracking-wide mb-3 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Participantes ({participantes.length})</p>
              {participantes.length === 0 ? (
                <p className="text-[13px] text-muted">Nenhum participante ainda.</p>
              ) : (
                <div className="space-y-2">
                  {participantes.map((p, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-blue/10 text-blue flex items-center justify-center text-[13px] font-bold flex-shrink-0">{p.profiles?.nome?.[0]?.toUpperCase() ?? '?'}</span>
                      <span className="flex-1 font-medium text-[15px]">{p.profiles?.nome ?? 'Usuário'}</span>
                      {p.papel === 'owner' && <span className="text-[11px] font-semibold text-orange bg-orange/10 px-2 py-0.5 rounded-full flex items-center gap-1"><Crown className="w-3 h-3" /> Owner</span>}
                      {p.papel === 'editor' && <span className="text-[11px] font-semibold text-blue/70 bg-blue/5 px-2 py-0.5 rounded-full">Editor</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Excluir */}
      {!confirmarExcluir ? (
        <button onClick={() => setConfirmarExcluir(true)} className="tap-scale w-full py-3.5 rounded-ios bg-red/10 text-red font-semibold text-[16px] flex items-center justify-center gap-2">
          <Trash className="w-4 h-4" /> Excluir viagem
        </button>
      ) : (
        <div className="bg-red/5 border border-red/20 rounded-ios p-4 space-y-3">
          <div className="flex items-center gap-2 text-red">
            <AlertTriangle className="w-5 h-5" />
            <p className="font-semibold text-[15px]">Excluir "{viagem.nome}"?</p>
          </div>
          <p className="text-[14px] text-muted">Todas as atrações, gastos, pendências, hospedagens e documentos serão removidos permanentemente.</p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmarExcluir(false)} className="tap-scale flex-1 py-3 rounded-ios font-semibold text-[15px] bg-fill text-text">Cancelar</button>
            <button onClick={handleExcluir} disabled={excluindo} className="tap-scale flex-1 py-3 rounded-ios font-semibold text-[15px] bg-red text-white disabled:opacity-50">
              {excluindo ? 'Excluindo...' : 'Excluir definitivamente'}
            </button>
          </div>
        </div>
      )}

      <div className="h-4" />

      {adicionandoCidade && (
        <Modal aberto onClose={() => { setAdicionandoCidade(false); setNovaCidadeNome('') }} titulo="Adicionar cidade">
          <div className="space-y-4">
            <p className="text-[14px] text-muted">Busque uma cidade para adicionar ao roteiro. Atribua dias a ela em seguida.</p>
            <CidadeAutocomplete
              value={novaCidadeNome}
              onChange={setNovaCidadeNome}
              onSelecionarLugar={handleAdicionarCidadeSelecionada}
              placeholder="Ex: Roma, Itália"
            />
          </div>
        </Modal>
      )}

      {adicionandoDia !== null && (
        <Modal aberto onClose={() => setAdicionandoDia(null)} titulo="Adicionar dia">
          <div className="space-y-4">
            <p className="text-[14px] text-muted">
              Será atribuído a{' '}
              <strong className="text-text">
                {cidadesViagem.find((c) => c.id === cidadeAtivaId)?.nome || 'cidade ativa'}
              </strong>
            </p>
            <div>
              <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Data do novo dia</label>
              <input
                type="date"
                value={adicionandoDia}
                onChange={(e) => setAdicionandoDia(e.target.value)}
                className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans mt-1"
                autoFocus
              />
            </div>
            <button
              onClick={() => handleAdicionarDia(adicionandoDia)}
              disabled={!adicionandoDia}
              className="tap-scale w-full py-3.5 rounded-ios bg-blue text-white font-semibold text-[16px] disabled:opacity-40"
            >
              Adicionar dia
            </button>
          </div>
        </Modal>
      )}

      {reatribuindo && (
        <ReatribuirDiaSheet
          aberto
          onClose={() => setReatribuindo(null)}
          dia={reatribuindo.dia}
          cidadeOrigem={reatribuindo.cidadeOrigemNome}
          cidadeDestino={reatribuindo.cidadeDestinoNome}
          counts={reatribuindo.counts}
          onMover={handleMoverDia}
          onLimpar={handleLimparEReatribuir}
        />
      )}

      {confirmarRemoverDia && (
        <Modal aberto onClose={() => setConfirmarRemoverDia(null)} titulo="Remover dia">
          <div className="space-y-4">
            <p className="text-[15px] text-text text-center">
              {new Date(confirmarRemoverDia.dia.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
            </p>
            <div className="bg-fill rounded-ios p-4">
              <p className="text-[14px] text-text text-center">
                Este dia tem{' '}
                <strong>{confirmarRemoverDia.counts.atracoes} {confirmarRemoverDia.counts.atracoes === 1 ? 'atração' : 'atrações'}</strong>
                {' '}e{' '}
                <strong>{confirmarRemoverDia.counts.gastos} {confirmarRemoverDia.counts.gastos === 1 ? 'gasto' : 'gastos'}</strong>.
                {' '}Tudo será removido permanentemente.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmarRemoverDia(null)} className="tap-scale flex-1 py-3 rounded-ios font-semibold text-[15px] bg-fill text-text">Cancelar</button>
              <button onClick={handleConfirmarRemoverDia} className="tap-scale flex-1 py-3 rounded-ios font-semibold text-[15px] bg-red text-white">Remover</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
