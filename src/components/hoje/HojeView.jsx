import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useViagem } from '../../hooks/useViagem'
import { useHoje } from '../../hooks/useHoje'
import { useAtracoes } from '../../hooks/useAtracoes'
import { useGastos } from '../../hooks/useGastos'
import { usePendencias } from '../../hooks/usePendencias'
import { useDestinos } from '../../hooks/useDestinos'
import { useAuthContext } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { supabase } from '../../lib/supabase'
import { converterParaBRL, formatarBRL } from '../../lib/cambio'
import { geocodificarCidade, buscarClima, buscarTemperaturaTipica, iconeClima } from '../../lib/clima'
import AgendaItem from './AgendaItem'
import WizardView from './WizardView'
import Card from '../ui/Card'
import { Plane, PartyPopper, MapPin } from 'lucide-react'
import { Skeleton, SkeletonCard } from '../ui/Skeleton'

const PAISES = {
  Portugal: 'PT', 'Espanha': 'ES', 'Itália': 'IT', 'França': 'FR', 'Holanda': 'NL',
}

function ClimaPrevisao({ cidade, pais }) {
  const [clima, setClima] = useState(null)

  useEffect(() => {
    let ativo = true
    geocodificarCidade(cidade, PAISES[pais]).then((coords) => {
      if (!coords || !ativo) return
      buscarClima(coords.latitude, coords.longitude).then((d) => {
        if (d && ativo) setClima(d)
      })
    })
    return () => { ativo = false }
  }, [cidade, pais])

  if (!clima?.current) return null
  return (
    <span className="text-[13px] text-muted tabular-nums">
      {iconeClima(clima.current.weather_code)} {Math.round(clima.current.temperature_2m)}°C
    </span>
  )
}

function ClimaTipico({ cidade, pais, datas }) {
  const [temp, setTemp] = useState(null)

  useEffect(() => {
    let ativo = true
    if (!datas?.length) return
    const inicio = datas[0].replace('2026', '2024')
    const fim = datas[datas.length - 1].replace('2026', '2024')
    geocodificarCidade(cidade, PAISES[pais]).then((coords) => {
      if (!coords || !ativo) return
      buscarTemperaturaTipica(coords.latitude, coords.longitude, inicio, fim).then((d) => {
        if (!d?.daily?.temperature_2m_max || !d?.daily?.temperature_2m_min || !ativo) return
        const maxs = d.daily.temperature_2m_max.filter((v) => v != null)
        const mins = d.daily.temperature_2m_min.filter((v) => v != null)
        if (maxs.length > 0) {
          const mediaMax = Math.round(maxs.reduce((a, b) => a + b, 0) / maxs.length)
          const mediaMin = Math.round(mins.reduce((a, b) => a + b, 0) / mins.length)
          setTemp({ min: mediaMin, max: mediaMax })
        }
      })
    })
    return () => { ativo = false }
  }, [cidade, pais, datas])

  if (!temp) return null
  return <span className="text-[10px] text-muted tabular-nums">{temp.min}°–{temp.max}°C</span>
}

export default function HojeView() {
  const navigate = useNavigate()
  const { usuario, profile } = useAuthContext()
  const { viagens, viagem, viagemId, loading: loadingViagem, criarViagem } = useViagem()
  const { destinoHoje, proximoDestino, viagemComecou, viagemTerminou, diasParaViagem, loading: loadingHoje } = useHoje(viagemId)
  const { atracoes, atualizarAtracao, recarregar } = useAtracoes(viagemId, destinoHoje?.id)
  const { gastos, adicionarGasto } = useGastos(viagemId)
  const { pendencias, totalPendentes } = usePendencias(viagemId)
  const { destinos } = useDestinos(viagemId)
  const addToast = useToast()
  const [mostrarWizard, setMostrarWizard] = useState(false)

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('wizard-visivel', { detail: mostrarWizard }))
  }, [mostrarWizard])

  useEffect(() => {
    const handler = () => setMostrarWizard(true)
    window.addEventListener('nova-viagem', handler)
    return () => window.removeEventListener('nova-viagem', handler)
  }, [])

  const gastoDoDia = useMemo(() => {
    if (!destinoHoje) return 0
    return gastos
      .filter((g) => g.destino_id === destinoHoje.id)
      .reduce((soma, g) => soma + (g.valor_brl ?? 0), 0)
  }, [gastos, destinoHoje])

  const cidadesUnicas = useMemo(() => {
    const vistas = new Set()
    return destinos.filter((d) => {
      if (vistas.has(d.cidade)) return false
      vistas.add(d.cidade)
      return true
    })
  }, [destinos])

  const datasPorCidade = useMemo(() => {
    const mapa = {}
    destinos.forEach((d) => {
      if (!mapa[d.cidade]) mapa[d.cidade] = []
      mapa[d.cidade].push(d.data)
    })
    return mapa
  }, [destinos])

  const totalPendencias = pendencias.length
  const concluidas = totalPendencias - totalPendentes
  const totalPreViagem = useMemo(
    () => gastos.filter((g) => !g.destino_id).reduce((s, g) => s + (g.valor_brl ?? 0), 0),
    [gastos],
  )

  async function handleSalvarGasto(gasto) {
    const { valorBRL, cotacaoUsada } = await converterParaBRL(gasto.valor, gasto.moeda)
    await adicionarGasto({ ...gasto, valor_brl: valorBRL, cotacao_usada: cotacaoUsada, created_by: usuario?.id })
    addToast('Gasto adicionado')
  }

  if (loadingViagem) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-9 w-36" />
        <SkeletonCard><Skeleton className="h-16 w-full" /></SkeletonCard>
        <SkeletonCard><Skeleton className="h-16 w-full" /></SkeletonCard>
      </div>
    )
  }

  if (viagens.length === 0 || mostrarWizard) {
    return (
      <WizardView
        onCriarViagem={async (dados) => {
          const { error } = await criarViagem(dados)
          if (!error) {
            setMostrarWizard(false)
            addToast('Viagem criada!')
            window.dispatchEvent(new CustomEvent('viagem-criada'))
            navigate('/viagem')
          }
        }}
        onClose={viagens.length > 0 ? () => setMostrarWizard(false) : undefined}
      />
    )
  }

  if (!viagemId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 space-y-4">
        <MapPin className="w-12 h-12 text-muted" />
        <h2 className="font-display text-[22px] font-bold">Nenhuma viagem</h2>
        <p className="text-muted text-[15px]">Crie sua primeira viagem para começar a planejar.</p>
        <button onClick={() => setMostrarWizard(true)} className="tap-scale px-6 py-3 rounded-ios bg-blue text-white font-semibold text-[15px]">
          Criar viagem
        </button>
      </div>
    )
  }

  if (loadingHoje) return (
    <div className="space-y-5">
      <div className="flex flex-col items-center text-center pt-10">
        <Skeleton className="w-16 h-16 rounded-full mb-4" />
        <Skeleton className="h-5 w-40 mt-2" />
        <Skeleton className="h-5 w-16 mt-4" />
        <Skeleton className="h-11 w-32 mt-2" />
        <Skeleton className="h-4 w-56 mt-2" />
      </div>
      <SkeletonCard className="p-4">
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-4 w-36 mt-3" />
      </SkeletonCard>
      <SkeletonCard className="p-4">
        <Skeleton className="h-4 w-20 mb-3" />
        <div className="flex gap-4 mt-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2 w-16">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </SkeletonCard>
    </div>
  )

  if (!viagemComecou) {
    return (
    <div className="space-y-5">
        <div className="flex flex-col items-center text-center pt-10">
          <div className="w-16 h-16 rounded-full bg-blue/10 flex items-center justify-center mb-4"><Plane className="w-7 h-7 text-blue" /></div>
          <p className="text-[17px] text-text font-medium">Olá, {profile?.nome?.split(' ')[0] ?? usuario?.email?.split('@')[0] ?? 'viajante'}</p>
          <p className="text-[17px] text-text font-medium mt-2">faltam</p>
          <p className="font-display text-[42px] font-bold tracking-tight tabular-nums leading-none mt-1">
            {diasParaViagem} dia{diasParaViagem === 1 ? '' : 's'}
          </p>
          <p className="text-muted text-[15px] mt-1">até o início da viagem · 14 de setembro</p>
        </div>

        {totalPendencias > 0 && (
          <Card className="p-4">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-muted text-[13px] font-medium uppercase tracking-wide">Checklist</span>
              <span className="text-[13px] font-semibold tabular-nums text-text">{concluidas}/{totalPendencias}</span>
            </div>
            <div className="h-[6px] bg-fill rounded-full overflow-hidden">
              <div
                className="h-full bg-blue rounded-full transition-all duration-500 ease-ios"
                style={{ width: `${(concluidas / totalPendencias) * 100}%` }}
              />
            </div>
            {totalPendentes > 0 && (
              <p className="text-[13px] text-muted mt-2">{totalPendentes} pendência{totalPendentes > 1 ? 's' : ''} por resolver</p>
            )}
          </Card>
        )}

        <Card className="p-4">
          <span className="text-muted text-[13px] font-medium uppercase tracking-wide">Roteiro</span>
          <div className="flex gap-3 overflow-x-auto mt-3 pb-1 scrollbar-none">
            {cidadesUnicas.map((d) => (
              <div key={d.id} className="flex flex-col items-center gap-1 flex-shrink-0 w-20">
                <span className="text-2xl">{d.flag_emoji}</span>
                <span className="text-[11px] text-muted text-center leading-tight font-medium">{d.cidade}</span>
                <ClimaTipico cidade={d.cidade} pais={d.pais} datas={datasPorCidade[d.cidade]} />
              </div>
            ))}
          </div>
        </Card>

        {totalPreViagem > 0 && (
          <Card className="p-4 flex justify-between items-center">
            <span className="text-muted text-[13px] font-medium uppercase tracking-wide">Gastos pré-viagem</span>
            <span className="font-display text-[20px] font-bold tabular-nums">R$ {formatarBRL(totalPreViagem)}</span>
          </Card>
        )}
      </div>
    )
  }

  if (viagemTerminou) {
    return (
      <div className="flex flex-col items-center justify-center pt-24 text-center">
        <div className="w-20 h-20 rounded-full bg-green/10 flex items-center justify-center mb-5"><PartyPopper className="w-8 h-8 text-orange" /></div>
        <h2 className="font-display text-[26px] font-bold tracking-tight">Viagem concluída!</h2>
        <p className="text-muted text-[15px] mt-1">Confira suas memórias e gastos finais.</p>
      </div>
    )
  }

  if (!destinoHoje) {
    return <p className="text-muted text-center mt-10">Dia de trânsito sem destino fixo.</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-blue text-[15px] font-semibold capitalize">
            {new Date(destinoHoje.data + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
          </p>
          <h1 className="font-display text-[34px] font-bold tracking-tight leading-tight flex items-center gap-2">
            <span>{destinoHoje.flag_emoji}</span>
            <span>{destinoHoje.cidade}</span>
          </h1>
          <ClimaPrevisao cidade={destinoHoje.cidade} pais={destinoHoje.pais} />
        </div>

      </div>

      <Card className="p-4">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-muted text-[13px] font-medium uppercase tracking-wide">Gasto hoje</span>
          <span className="font-display text-[22px] font-bold tabular-nums">R$ {formatarBRL(gastoDoDia)}</span>
        </div>
        <div className="h-[6px] bg-fill rounded-full overflow-hidden">
          <div
            className="h-full bg-blue rounded-full transition-all duration-500 ease-ios"
            style={{ width: `${Math.min((gastoDoDia / 500) * 100, 100)}%` }}
          />
        </div>
      </Card>

      <div>
        <h2 className="text-muted text-[13px] font-semibold uppercase tracking-wide mb-3 px-1">Agenda do dia</h2>
        <Card>
          {atracoes.length === 0 ? (
            <p className="text-muted text-[15px] py-6 text-center">Nenhuma atração planejada. Toque em + para adicionar.</p>
          ) : (
            atracoes.map((a) => (
              <AgendaItem
                key={a.id}
                atracao={a}
                onToggleConcluida={(id, concluida) => atualizarAtracao(id, { concluida }).then(recarregar)}
              />
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
          <span className="text-muted text-xl">›</span>
        </Card>
      )}


    </div>
  )
}
