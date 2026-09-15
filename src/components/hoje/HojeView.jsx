import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useViagem } from '../../contexts/ViagemContext'
import { useHoje } from '../../hooks/useHoje'
import { useAtracoes } from '../../hooks/useAtracoes'
import { useGastos } from '../../hooks/useGastos'
import { usePendencias } from '../../hooks/usePendencias'
import { useDestinos } from '../../hooks/useDestinos'
import { useAcomodacoes } from '../../hooks/useAcomodacoes'
import { useTransportes } from '../../hooks/useTransportes'
import { useAuthContext } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { supabase } from '../../lib/supabase'
import { converterParaBRL, formatarBRL } from '../../lib/cambio'
import { geocodificarCidade, buscarClima, buscarTemperaturaTipica, iconeClima } from '../../lib/clima'
import AgendaItem from './AgendaItem'
import WizardView from './WizardView'
import Card from '../ui/Card'
import MapaDoDia from '../atracoes/MapaDoDia'
import TransporteIcon from '../ui/TransporteIcon'
import { Plane, PartyPopper, MapPin, Bed } from 'lucide-react'
import { Skeleton, SkeletonCard } from '../ui/Skeleton'
import { abrirNoMaps } from '../../lib/maps'

const PAISES = {
  Portugal: 'PT', 'Espanha': 'ES', 'Itália': 'IT', 'França': 'FR', 'Holanda': 'NL', 'Brasil': 'BR',
}

// Fuso de casa, pra saber que horas são no Brasil enquanto se está fora.
const FUSO_CASA = 'America/Fortaleza'

function horaNoFuso(data, fuso) {
  try {
    return data.toLocaleTimeString('pt-BR', { timeZone: fuso || undefined, hour: '2-digit', minute: '2-digit', hour12: false })
  } catch {
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false })
  }
}

function minutosDoDia(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  // Entre 00:00 e 00:59 o pt-BR devolve "24:04" em vez de "00:04", e sem o
  // resto a conta jogava a meia-noite pro fim do dia seguinte.
  return (h % 24) * 60 + m
}

// Linha discreta embaixo da cidade: temperatura agora, hora do pôr do sol e que
// horas são no Brasil. O pôr do sol já vinha no mesmo request do clima e era
// jogado fora; a hora de casa só aparece quando o fuso do destino é outro.
function LinhaDoDia({ cidade, pais, lat, lng, fuso }) {
  const [clima, setClima] = useState(null)
  const [horaEmCasa, setHoraEmCasa] = useState(null)

  useEffect(() => {
    let ativo = true
    const buscar = lat != null && lng != null
      ? Promise.resolve({ latitude: lat, longitude: lng })
      : geocodificarCidade(cidade, PAISES[pais])
    buscar.then((coords) => {
      if (!coords || !ativo) return
      buscarClima(coords.latitude, coords.longitude).then((d) => {
        if (d && ativo) setClima(d)
      })
    })
    return () => { ativo = false }
  }, [cidade, pais, lat, lng])

  useEffect(() => {
    function atualizar() {
      const agora = new Date()
      const casa = horaNoFuso(agora, FUSO_CASA)
      const daqui = horaNoFuso(agora, fuso)
      setHoraEmCasa(casa === daqui ? null : casa)
    }
    atualizar()
    const id = setInterval(atualizar, 30000)
    return () => clearInterval(id)
  }, [fuso])

  const porDoSol = clima?.daily?.sunset?.[0]?.slice(11, 16)
  const partes = [
    clima?.current && `${iconeClima(clima.current.weather_code)} ${Math.round(clima.current.temperature_2m)}°C`,
    porDoSol && `🌇 ${porDoSol}`,
    horaEmCasa && `🇧🇷 ${horaEmCasa}`,
  ].filter(Boolean)

  if (partes.length === 0) return null
  return <p className="text-[13px] text-muted tabular-nums">{partes.join(' · ')}</p>
}

function ClimaTipico({ cidade, pais, datas, lat, lng }) {
  const [temp, setTemp] = useState(null)

  useEffect(() => {
    let ativo = true
    if (!datas?.length) return
    const inicio = datas[0].replace('2026', '2024')
    const fim = datas[datas.length - 1].replace('2026', '2024')
    const buscar = lat != null && lng != null
      ? Promise.resolve({ latitude: lat, longitude: lng })
      : geocodificarCidade(cidade, PAISES[pais])
    buscar.then((coords) => {
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
  }, [cidade, pais, datas, lat, lng])

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
  const { acomodacoes } = useAcomodacoes(viagemId)
  const { transportes } = useTransportes(viagemId)
  const addToast = useToast()
  const [mostrarWizard, setMostrarWizard] = useState(false)
  // Relógio da tela: move o "em 26 min" da próxima parada sem esperar por um
  // toque na tela.
  const [agora, setAgora] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 30000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('wizard-visivel', { detail: mostrarWizard }))
  }, [mostrarWizard])

  useEffect(() => {
    const handler = () => setMostrarWizard(true)
    window.addEventListener('nova-viagem', handler)
    return () => window.removeEventListener('nova-viagem', handler)
  }, [])

  // O gasto do dia mistura duas coisas: o que já estava pago antes de viajar
  // (hospedagem, entrada reservada) e o que saiu do bolso hoje. Sem separar, o
  // primeiro dia abre com a barra estourada sem ter gastado nada ainda.
  const { gastoDoDia, gastoPrePago, gastoNaRua } = useMemo(() => {
    if (!destinoHoje) return { gastoDoDia: 0, gastoPrePago: 0, gastoNaRua: 0 }
    let prePago = 0
    let naRua = 0
    gastos
      .filter((g) => g.destino_id === destinoHoje.id)
      .forEach((g) => {
        const valor = g.valor_brl ?? 0
        if (g.data_gasto && g.data_gasto < destinoHoje.data) prePago += valor
        else naRua += valor
      })
    return { gastoDoDia: prePago + naRua, gastoPrePago: prePago, gastoNaRua: naRua }
  }, [gastos, destinoHoje])

  // Onde se dorme hoje: a hospedagem que cobre a data. Registro antigo pode não
  // ter check-in/check-out, então o match por cidade fica como reserva.
  const hospedagemHoje = useMemo(() => {
    if (!destinoHoje) return null
    const cobremAData = acomodacoes.filter(
      (h) => h.check_in?.slice(0, 10) <= destinoHoje.data && (!h.check_out || h.check_out.slice(0, 10) > destinoHoje.data),
    )
    return (
      cobremAData.find((h) => h.cidade === destinoHoje.cidade)
      ?? cobremAData[0]
      ?? acomodacoes.find((h) => h.cidade === destinoHoje.cidade)
      ?? null
    )
  }, [acomodacoes, destinoHoje])

  // Transporte de hoje. O voo de ida e o de volta não estão pendurados em
  // nenhum dia (destino_origem_id nulo), então a data do horário é que manda.
  const transportesHoje = useMemo(() => {
    if (!destinoHoje) return []
    return transportes.filter(
      (t) =>
        t.horario_saida?.slice(0, 10) === destinoHoje.data
        || t.horario_chegada?.slice(0, 10) === destinoHoje.data
        || t.destino_origem_id === destinoHoje.id,
    )
  }, [transportes, destinoHoje])

  // Próxima parada da agenda pelo relógio do lugar onde se está, não pelo do
  // celular: o celular pode estar em outro fuso e o horário da atração é local.
  const proximaAtracao = useMemo(() => {
    const agoraEmMinutos = minutosDoDia(horaNoFuso(agora, viagem?.fuso_principal))
    const candidatas = atracoes
      .filter((a) => !a.concluida && a.horario_previsto)
      .sort((a, b) => a.horario_previsto.localeCompare(b.horario_previsto))
    const proxima = candidatas.find((a) => minutosDoDia(a.horario_previsto.slice(0, 5)) >= agoraEmMinutos)
    if (!proxima) return null
    return { id: proxima.id, emMinutos: minutosDoDia(proxima.horario_previsto.slice(0, 5)) - agoraEmMinutos }
  }, [atracoes, agora, viagem])

  const atracoesComCoordenadas = useMemo(
    () => atracoes.filter((a) => a.latitude && a.longitude),
    [atracoes],
  )

  const orcamentoDiario = viagem?.orcamento_total && destinos.length > 0
    ? viagem.orcamento_total / destinos.length
    : 500

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
          <p className="text-muted text-[15px] mt-1">
            até o início da viagem{destinos[0]?.data ? ` · ${new Date(destinos[0].data + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}` : ''}
          </p>
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
                <ClimaTipico cidade={d.cidade} pais={d.pais} datas={datasPorCidade[d.cidade]} lat={d.latitude} lng={d.longitude} />
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
          <LinhaDoDia
            cidade={destinoHoje.cidade}
            pais={destinoHoje.pais}
            lat={destinoHoje.latitude}
            lng={destinoHoje.longitude}
            fuso={viagem?.fuso_principal}
          />
        </div>

      </div>

      {(transportesHoje.length > 0 || hospedagemHoje) && (
        <Card>
          {transportesHoje.map((t) => (
            <div key={t.id} className="flex items-center gap-3 py-3 px-4 border-b border-separator last:border-b-0">
              <TransporteIcon tipo={t.tipo} className="w-5 h-5 text-blue flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium truncate">{t.operadora || t.tipo}</p>
                <p className="text-[13px] text-muted truncate">
                  {[
                    t.horario_saida?.slice(0, 10) === destinoHoje.data && `sai ${t.horario_saida.slice(11, 16)}`,
                    t.horario_chegada?.slice(0, 10) === destinoHoje.data && `chega ${t.horario_chegada.slice(11, 16)}`,
                    t.codigo_reserva && `localizador ${t.codigo_reserva}`,
                  ].filter(Boolean).join(' · ') || t.tipo}
                </p>
              </div>
            </div>
          ))}

          {hospedagemHoje && (
            <div className="flex items-center gap-3 py-3 px-4 border-b border-separator last:border-b-0">
              <Bed className="w-5 h-5 text-green flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium truncate">{hospedagemHoje.nome}</p>
                <p className="text-[13px] text-muted truncate">
                  {[
                    hospedagemHoje.check_in?.slice(0, 10) === destinoHoje.data
                      ? `check-in ${hospedagemHoje.check_in.slice(11, 16)}`
                      : hospedagemHoje.check_out?.slice(0, 10) === destinoHoje.data
                        ? `check-out ${hospedagemHoje.check_out.slice(11, 16)}`
                        : hospedagemHoje.tipo,
                    hospedagemHoje.endereco,
                  ].filter(Boolean).join(' · ')}
                </p>
              </div>
              {hospedagemHoje.latitude && (
                <button
                  onClick={() => abrirNoMaps(hospedagemHoje.latitude, hospedagemHoje.longitude, hospedagemHoje.nome, hospedagemHoje.place_id, hospedagemHoje.place_nome)}
                  className="tap-scale text-blue text-[13px] font-semibold px-3 py-1.5 rounded-full bg-blue/10 flex-shrink-0"
                >
                  Maps
                </button>
              )}
            </div>
          )}
        </Card>
      )}

      <Card className="p-4">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-muted text-[13px] font-medium uppercase tracking-wide">Gasto hoje</span>
          <span className="font-display text-[22px] font-bold tabular-nums">R$ {formatarBRL(gastoDoDia)}</span>
        </div>
        <div className="h-[6px] bg-fill rounded-full overflow-hidden">
          <div
            className="h-full bg-blue rounded-full transition-all duration-500 ease-ios"
            style={{ width: `${Math.min((gastoDoDia / orcamentoDiario) * 100, 100)}%` }}
          />
        </div>
        {gastoPrePago > 0 && (
          <p className="text-[13px] text-muted mt-2">
            R$ {formatarBRL(gastoPrePago)} já pago antes · R$ {formatarBRL(gastoNaRua)} na rua hoje
          </p>
        )}
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
                proxima={proximaAtracao?.id === a.id}
                emMinutos={proximaAtracao?.id === a.id ? proximaAtracao.emMinutos : null}
                onToggleConcluida={(id, concluida) => atualizarAtracao(id, { concluida }).then(recarregar)}
              />
            ))
          )}
        </Card>
      </div>

      {atracoesComCoordenadas.length > 0 && (
        <MapaDoDia atracoes={atracoesComCoordenadas} acomodacao={hospedagemHoje} />
      )}

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
