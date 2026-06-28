import { useMemo, useState } from 'react'
import { useHoje } from '../../hooks/useHoje'
import { useAtracoes } from '../../hooks/useAtracoes'
import { useGastos } from '../../hooks/useGastos'
import { converterParaBRL, formatarBRL } from '../../lib/cambio'
import AgendaItem from './AgendaItem'
import GastoRapido from './GastoRapido'
import Card from '../ui/Card'

export default function HojeView() {
  const { destinoHoje, proximoDestino, viagemComecou, viagemTerminou, diasParaViagem, loading: loadingHoje } = useHoje()
  const { atracoes, atualizarAtracao, recarregar } = useAtracoes(destinoHoje?.id)
  const { gastos, adicionarGasto } = useGastos()
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

  if (loadingHoje) return <p className="text-muted text-center mt-10">Carregando...</p>

  if (!viagemComecou) {
    return (
      <div className="flex flex-col items-center justify-center pt-24 text-center">
        <div className="w-20 h-20 rounded-full bg-blue/10 flex items-center justify-center text-4xl mb-5">✈️</div>
        <h2 className="font-display text-[28px] font-bold tracking-tight tabular-nums">
          {diasParaViagem} dia{diasParaViagem === 1 ? '' : 's'}
        </h2>
        <p className="text-muted text-[15px] mt-1">até o início da viagem · 14 de setembro</p>
      </div>
    )
  }

  if (viagemTerminou) {
    return (
      <div className="flex flex-col items-center justify-center pt-24 text-center">
        <div className="w-20 h-20 rounded-full bg-green/10 flex items-center justify-center text-4xl mb-5">🎉</div>
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
