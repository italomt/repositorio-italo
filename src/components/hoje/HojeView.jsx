import { useMemo, useState } from 'react'
import { useViagem } from '../../hooks/useViagem'
import { useHoje } from '../../hooks/useHoje'
import { useAtracoes } from '../../hooks/useAtracoes'
import { useGastos } from '../../hooks/useGastos'
import { usePendencias } from '../../hooks/usePendencias'
import { useDias } from '../../hooks/useDias'
import { useHospedagens } from '../../hooks/useHospedagens'
import { useAuthContext } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { converterParaBRL, formatarBRL } from '../../lib/cambio'
import { supabase } from '../../lib/supabase'
import WizardView from './WizardView'
import AgendaItem from './AgendaItem'
import GastoRapido from './GastoRapido'
import Card from '../ui/Card'
import { Plane, PartyPopper, Plus, ChevronRight, AlertTriangle } from 'lucide-react'
import { Skeleton, SkeletonCard } from '../ui/Skeleton'

export default function HojeView() {
  const { usuario, profile } = useAuthContext()
  const { viagem, viagemId, loading: loadingViagem, recarregar: recarregarViagem } = useViagem()
  const { destinoHoje, proximoDestino, viagemComecou, viagemTerminou, diasParaViagem, loading: loadingHoje } = useHoje(viagemId)
  const { atracoes, atualizarAtracao, recarregar: recAtracoes } = useAtracoes(viagemId, destinoHoje?.id)
  const { gastos, adicionarGasto } = useGastos(viagemId)
  const { pendencias, totalPendentes, alterarEstado } = usePendencias(viagemId)
  const { dias } = useDias(viagemId)
  const { hospedagens } = useHospedagens(viagemId)
  const addToast = useToast()

  const [modalAberto, setModalAberto] = useState(false)
  const [mostrarWizard, setMostrarWizard] = useState(false)

  const gastoDoDia = useMemo(() => {
    if (!destinoHoje) return 0
    return gastos.filter((g) => g.destino_id === destinoHoje.id).reduce((s, g) => s + (g.valor_brl ?? 0), 0)
  }, [gastos, destinoHoje])

  const cidadesSemHospedagem = useMemo(() => {
    const vistas = new Set()
    return dias.filter((d) => {
      if (vistas.has(d.cidade)) return false
      vistas.add(d.cidade)
      return !hospedagens.some((h) => h.cidade === d.cidade)
    })
  }, [dias, hospedagens])

  const pendenciasAbertas = useMemo(() => pendencias.filter((p) => p.estado !== 'concluida' && p.estado !== 'cancelada'), [pendencias])
  const concluidas = pendencias.length - pendenciasAbertas.length

  async function handleSalvarGasto(gasto) {
    const { valorBRL, cotacaoUsada } = await converterParaBRL(gasto.valor, gasto.moeda)
    await adicionarGasto({ ...gasto, valor_brl: valorBRL, cotacao_usada: cotacaoUsada, created_by: usuario?.id })
    addToast('Gasto adicionado')
  }

  async function handleCriarViagem(data) {
    const { data: cidadeData } = await supabase.from('cidades').select('id').ilike('nome', `%${data.primeira_cidade}%`).maybeSingle()

    const { data: novaViagem, error: errViagem } = await supabase.from('viagens').insert({
      nome: data.nome,
      tipo: data.tipo,
      data_inicio: data.data_inicio,
      data_fim: data.data_fim,
      status: 'planejando',
      created_by: usuario?.id,
    }).select().single()

    if (errViagem || !novaViagem) {
      addToast('Erro ao criar viagem', 'erro')
      return
    }
    const vid = novaViagem.id

    let cid
    if (cidadeData) {
      cid = cidadeData.id
    } else {
      const { data: novaCidade } = await supabase.from('cidades').insert({
        nome: data.primeira_cidade, pais: '',
      }).select().single()
      cid = novaCidade?.id
    }

    if (cid && data.data_inicio) {
      const inicio = new Date(data.data_inicio + 'T00:00:00')
      for (let i = 0; i < (data.dias_na_cidade || 1); i++) {
        const d = new Date(inicio)
        d.setDate(d.getDate() + i)
        await supabase.from('dias').insert({
          viagem_id: vid,
          cidade_id: cid,
          data: d.toISOString().slice(0, 10),
          status: 'planejando',
        })
      }
    }

    if (data.hotel_nome && cid) {
      await supabase.from('hospedagens').insert({
        viagem_id: vid,
        cidade_id: cid,
        nome: data.hotel_nome,
        tipo: 'hotel',
        status: 'reservada',
      })
    }

    if (data.transporte && cid) {
      await supabase.from('transportes').insert({
        viagem_id: vid,
        tipo: data.transporte,
        status: 'pendente',
      })
    }

    await recarregarViagem()
    setMostrarWizard(false)
    addToast('Viagem criada!')
  }

  if (loadingViagem || loadingHoje) return (
    <div className="space-y-5">
      <div className="flex flex-col items-center text-center pt-10">
        <Skeleton className="w-16 h-16 rounded-full mb-4" />
        <Skeleton className="h-5 w-40 mt-2" />
      </div>
      <SkeletonCard><Skeleton className="h-4 w-24 mb-3" /><Skeleton className="h-2 w-full rounded-full" /></SkeletonCard>
    </div>
  )

  // ESTADO 1: Sem viagem — mostrar wizard ou CTA
  if (!viagemId || mostrarWizard) {
    return <WizardView onCriarViagem={handleCriarViagem} />
  }

  // Preparação: nome do usuário
  const nomeCurto = profile?.nome?.split(' ')[0] || usuario?.email?.split('@')[0] || 'viajante'

  // ESTADO 2: Pré-viagem
  if (!viagemComecou) {
    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center text-center pt-6">
          <p className="text-[17px] text-text font-medium">Olá, {nomeCurto}</p>
          <p className="text-muted text-[15px] mt-1">{viagem?.nome}</p>
          <p className="font-display text-[42px] font-bold tracking-tight tabular-nums leading-none mt-3">
            {diasParaViagem} dia{diasParaViagem === 1 ? '' : 's'}
          </p>
          <p className="text-muted text-[15px] mt-1">até o início da viagem</p>
        </div>

        {pendenciasAbertas.length > 0 && (
          <Card className="p-4">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-muted text-[13px] font-medium uppercase tracking-wide">Progresso</span>
              <span className="text-[13px] font-semibold tabular-nums">{concluidas}/{pendencias.length}</span>
            </div>
            <div className="h-[6px] bg-fill rounded-full overflow-hidden">
              <div className="h-full bg-blue rounded-full transition-all duration-500 ease-ios" style={{ width: `${pendencias.length > 0 ? (concluidas / pendencias.length) * 100 : 0}%` }} />
            </div>
            {pendenciasAbertas.length > 0 && (
              <p className="text-[13px] text-muted mt-2">
                {pendenciasAbertas.length} pendência{pendenciasAbertas.length > 1 ? 's' : ''} por resolver
              </p>
            )}
          </Card>
        )}

        {cidadesSemHospedagem.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange" />
              <span className="text-[13px] font-semibold text-orange">Hospedagem faltando</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {cidadesSemHospedagem.map((c) => (
                <span key={c.cidade} className="px-3 py-1 rounded-full bg-orange/10 text-[13px] font-medium text-orange">
                  {c.flag_emoji} {c.cidade}
                </span>
              ))}
            </div>
          </Card>
        )}

        {dias.length > 0 && (
          <Card className="p-4">
            <span className="text-muted text-[13px] font-medium uppercase tracking-wide">Roteiro</span>
            <div className="flex gap-3 overflow-x-auto mt-3 pb-1 scrollbar-none">
              {[...new Map(dias.map((d) => [d.cidade, d.flag_emoji]))].map(([cidade, flag]) => (
                <div key={cidade} className="flex flex-col items-center gap-1 shrink-0 w-16">
                  <span className="text-xl">{flag}</span>
                  <span className="text-[10px] text-muted text-center leading-tight">{cidade}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    )
  }

  // ESTADO 3: Pós-viagem
  if (viagemTerminou) {
    const totalGasto = gastos.reduce((s, g) => s + (g.valor_brl ?? 0), 0)
    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center text-center pt-10">
          <div className="w-20 h-20 rounded-full bg-green/10 flex items-center justify-center mb-5"><PartyPopper className="w-8 h-8 text-orange" /></div>
          <h2 className="font-display text-[28px] font-bold tracking-tight">{viagem?.nome}</h2>
          <p className="text-muted text-[15px] mt-1">Viagem concluída</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center">
            <p className="text-[22px] font-bold tabular-nums">{dias.length}</p>
            <p className="text-[11px] text-muted">dias</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-[22px] font-bold tabular-nums">{atracoes.length}</p>
            <p className="text-[11px] text-muted">atrações</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-[22px] font-bold tabular-nums text-green">R$ {formatarBRL(totalGasto)}</p>
            <p className="text-[11px] text-muted">total</p>
          </Card>
        </div>

        <Card className="p-4 text-center">
          <p className="text-muted text-[14px]">Pronto para a próxima?</p>
          <button onClick={() => setMostrarWizard(true)} className="tap-scale mt-3 px-6 py-3 rounded-ios bg-blue text-white font-semibold text-[15px]">
            <Plane className="w-4 h-4 inline-block mr-2" />
            Nova viagem
          </button>
        </Card>
      </div>
    )
  }

  // ESTADO 4: Durante a viagem — dia atual
  if (!destinoHoje) {
    return <p className="text-muted text-center mt-10">Dia de trânsito sem destino fixo.</p>
  }

  const dataLabel = new Date(destinoHoje.data + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-blue text-[15px] font-semibold capitalize">{dataLabel}</p>
          <h1 className="font-display text-[34px] font-bold tracking-tight leading-tight flex items-center gap-2">
            <span>{destinoHoje.flag_emoji}</span>
            <span>{destinoHoje.cidade}</span>
          </h1>
        </div>
        <button onClick={() => setModalAberto(true)} aria-label="Adicionar gasto" className="tap-scale w-11 h-11 rounded-full bg-blue text-white flex items-center justify-center shrink-0 mt-1">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <Card className="p-4">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-muted text-[13px] font-medium uppercase tracking-wide">Gasto hoje</span>
          <span className="font-display text-[22px] font-bold tabular-nums">R$ {formatarBRL(gastoDoDia)}</span>
        </div>
        <div className="h-[6px] bg-fill rounded-full overflow-hidden">
          <div className="h-full bg-blue rounded-full transition-all duration-500 ease-ios" style={{ width: `${Math.min((gastoDoDia / 500) * 100, 100)}%` }} />
        </div>
      </Card>

      <div>
        <h2 className="text-muted text-[13px] font-semibold uppercase tracking-wide mb-3 px-1">Agenda do dia</h2>
        <Card>
          {atracoes.length === 0 ? (
            <p className="text-muted text-[15px] py-6 text-center">Nenhuma atração planejada. Toque em + no Roteiro para adicionar.</p>
          ) : (
            atracoes.map((a) => (
              <AgendaItem key={a.id} atracao={a} onToggleConcluida={(id, concluida) => atualizarAtracao(id, { concluida }).then(recAtracoes)} />
            ))
          )}
        </Card>
      </div>

      {proximoDestino && (
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[12px] text-muted uppercase tracking-wide font-semibold">Amanhã</p>
            <p className="font-semibold text-[16px] flex items-center gap-1.5">
              <span>{proximoDestino.flag_emoji}</span>
              <span>{proximoDestino.cidade}</span>
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted" />
        </Card>
      )}

      <GastoRapido aberto={modalAberto} onClose={() => setModalAberto(false)} onSalvar={handleSalvarGasto} destinoId={destinoHoje.id} dataGasto={destinoHoje.data} />
    </div>
  )
}
