import { useEffect, useMemo, useState } from 'react'
import { useHoje } from '../../hooks/useHoje'
import { useAtracoes } from '../../hooks/useAtracoes'
import { useGastos } from '../../hooks/useGastos'
import { usePendencias } from '../../hooks/usePendencias'
import { useDestinos } from '../../hooks/useDestinos'
import { useAuthContext } from '../../contexts/AuthContext'
import { converterParaBRL, formatarBRL } from '../../lib/cambio'
import { geocodificarCidade, buscarClima, buscarTemperaturaTipica, iconeClima } from '../../lib/clima'
import AgendaItem from './AgendaItem'
import GastoRapido from './GastoRapido'
import Card from '../ui/Card'
import { Plane, PartyPopper } from 'lucide-react'

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
        if (!d?.daily || !ativo) return
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
  const { usuario } = useAuthContext()
  const { destinoHoje, proximoDestino, viagemComecou, viagemTerminou, diasParaViagem, loading: loadingHoje } = useHoje()
  const { atracoes, atualizarAtracao, recarregar } = useAtracoes(destinoHoje?.id)
  const { gastos, adicionarGasto } = useGastos(usuario?.id)
  const { pendencias, totalPendentes } = usePendencias()
  const { destinos } = useDestinos()
  const [modalAberto, setModalAberto] = useState(false)

  const gastoDoDia = useMemo(() => {
    if (!destinoHoje) return 0
    return gastos
      .filter((g) => g.destino_id === destinoHoje.id)
      .reduce((soma, g) => soma + (g.valor_brl ?? 0), 0)
  }, [gastos, destinoHoje])

  async function handleSalvarGasto(gasto) {
    const { valorBRL, cotacaoUsada } = await converterParaBRL(gasto.valor_original, gasto.moeda_original)
    await adicionarGasto({ ...gasto, valor_brl: valorBRL, cotacao_usada: cotacaoUsada })
  }

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

  if (loadingHoje) return <p className="text-muted text-center mt-10">Carregando...</p>

  if (!viagemComecou) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center pt-12 text-center">
          <div className="w-20 h-20 rounded-full bg-blue/10 flex items-center justify-center mb-5"><Plane className="w-8 h-8 text-blue" /></div>
          <h2 className="font-display text-[28px] font-bold tracking-tight tabular-nums">
            {diasParaViagem} dia{diasParaViagem === 1 ? '' : 's'}
          </h2>
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
      <div>
        <p className="text-blue text-[15px] font-semibold capitalize">
          {new Date(destinoHoje.data + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
        </p>
        <h1 className="font-display text-[34px] font-bold tracking-tight leading-tight">
          {destinoHoje.flag_emoji} {destinoHoje.cidade}
        </h1>
        <ClimaPrevisao cidade={destinoHoje.cidade} pais={destinoHoje.pais} />
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
        <h2 className="text-muted text-[13px] font-semibold uppercase tracking-wide mb-2 px-1">Agenda do dia</h2>
        <Card>
          {atracoes.length === 0 ? (
            <p className="text-muted text-[15px] py-6 text-center">Nenhuma atração planejada ainda.</p>
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
            <p className="font-semibold text-[16px]">
              {proximoDestino.flag_emoji} {proximoDestino.cidade}
            </p>
          </div>
          <span className="text-muted text-xl">›</span>
        </Card>
      )}

      <button
        onClick={() => setModalAberto(true)}
        className="tap-scale fixed bottom-24 right-4 rounded-full w-[58px] h-[58px] bg-blue text-white text-[28px] font-light shadow-ios-lg z-30 flex items-center justify-center"
      >
        +
      </button>

      <GastoRapido
        aberto={modalAberto}
        onClose={() => setModalAberto(false)}
        onSalvar={handleSalvarGasto}
        destinoId={destinoHoje.id}
        dataGasto={destinoHoje.data}
      />
    </div>
  )
}
