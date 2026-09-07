import { useMemo, useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import Card from '../ui/Card'
import { formatarBRL, buscarCotacaoEur, simboloMoeda } from '../../lib/cambio'
import { LABELS_CATEGORIA_GASTO as LABELS_CATEGORIA, CORES_CATEGORIA_GASTO as CORES_CATEGORIA } from '../../lib/gastoCategorias'

function diasEntre(de, ate) {
  return Math.round((new Date(ate + 'T00:00:00') - new Date(de + 'T00:00:00')) / 86400000)
}

export default function Dashboard({ gastos, destinos, viagem, filtro, onFiltrar }) {
  const [cotacoes, setCotacoes] = useState(null)

  useEffect(() => {
    buscarCotacaoEur().then(setCotacoes).catch(() => setCotacoes(null))
  }, [])

  const hoje = new Date().toISOString().slice(0, 10)
  const inicio = viagem?.data_inicio
  const fim = viagem?.data_fim
  const totalDias = inicio && fim ? diasEntre(inicio, fim) + 1 : destinos.length || 1

  // Compra antecipada não é ritmo de consumo: entra como custo fixo, fora da
  // média diária. Vale tanto pra compra feita antes da viagem quanto pra item
  // já pago mas datado num dia futuro (ingresso da Disney, por exemplo) — só
  // conta como gasto em viagem o que já aconteceu.
  const { antes, durante } = useMemo(() => {
    const antes = []
    const durante = []
    gastos.forEach((g) => {
      const d = g.data_gasto
      const emViagem = d && inicio && d >= inicio && d <= hoje
      if (emViagem) durante.push(g)
      else antes.push(g)
    })
    return { antes, durante }
  }, [gastos, inicio, hoje])

  const somaBRL = (lista) => lista.reduce((s, g) => s + (g.valor_brl ?? 0), 0)
  const totalAntes = somaBRL(antes)
  const totalDurante = somaBRL(durante)

  const orcamentoDiario = viagem?.orcamento_diario ? Number(viagem.orcamento_diario) : null
  const moeda = viagem?.moeda_principal || 'EUR'

  // Orçamento é definido na moeda da viagem; os gastos vivem em BRL.
  const orcamentoDiarioBRL = useMemo(() => {
    if (!orcamentoDiario) return null
    if (moeda === 'BRL') return orcamentoDiario
    if (!cotacoes?.BRL) return null
    const emEur = moeda === 'EUR' ? orcamentoDiario : orcamentoDiario / cotacoes[moeda]
    return emEur * cotacoes.BRL
  }, [orcamentoDiario, moeda, cotacoes])

  const naoComecou = inicio && hoje < inicio
  const acabou = fim && hoje > fim
  const diasDecorridos = naoComecou ? 0 : Math.min(diasEntre(inicio, hoje) + 1, totalDias)
  const diasRestantes = Math.max(totalDias - diasDecorridos, 0)

  const liberadoAteHoje = orcamentoDiarioBRL ? orcamentoDiarioBRL * diasDecorridos : null
  const saldo = liberadoAteHoje === null ? null : liberadoAteHoje - totalDurante
  const sobraPorDia = saldo !== null && diasRestantes > 0
    ? (orcamentoDiarioBRL * diasRestantes + saldo) / diasRestantes
    : null

  const porMoeda = useMemo(() => {
    const mapa = {}
    durante.forEach((g) => {
      const m = g.moeda || 'EUR'
      mapa[m] = (mapa[m] ?? 0) + Number(g.valor || 0)
    })
    return Object.entries(mapa).sort((a, b) => b[1] - a[1])
  }, [durante])

  const porCategoria = useMemo(() => {
    const mapa = {}
    gastos.forEach((g) => { mapa[g.categoria] = (mapa[g.categoria] ?? 0) + (g.valor_brl ?? 0) })
    return Object.entries(mapa)
      .map(([categoria, valor]) => ({ categoria, valor }))
      .sort((a, b) => b.valor - a.valor)
  }, [gastos])

  const porCidade = useMemo(() => {
    const mapaDestino = Object.fromEntries(destinos.map((d) => [d.id, d.cidade]))
    const mapa = {}
    gastos.forEach((g) => {
      const cidade = mapaDestino[g.destino_id] ?? 'Pré-viagem'
      mapa[cidade] = (mapa[cidade] ?? 0) + (g.valor_brl ?? 0)
    })
    return Object.entries(mapa).sort((a, b) => b[1] - a[1])
  }, [gastos, destinos])

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex gap-2.5">
          <div className="flex-1 bg-fill rounded-ios p-3">
            <p className="text-muted text-[11px] font-semibold uppercase tracking-wide">Já pago</p>
            <p className="font-display text-[17px] font-bold tabular-nums mt-0.5">R$ {formatarBRL(totalAntes)}</p>
            <p className="text-[11px] text-muted mt-0.5 leading-snug">antes de viajar</p>
          </div>
          <div className="flex-1 rounded-ios p-3" style={{ background: 'rgba(91,127,255,0.09)' }}>
            <p className="text-muted text-[11px] font-semibold uppercase tracking-wide">Na viagem</p>
            <p className="font-display text-[17px] font-bold tabular-nums mt-0.5">R$ {formatarBRL(totalDurante)}</p>
            <p className="text-[11px] text-muted mt-0.5 leading-snug">
              {naoComecou ? 'ainda não começou' : `${diasDecorridos} de ${totalDias} dias`}
            </p>
          </div>
        </div>

        {porMoeda.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2.5 pt-2.5 border-t border-separator">
            {porMoeda.map(([m, v]) => (
              <span key={m} className="text-[12px] text-muted tabular-nums">
                {simboloMoeda(m)} {formatarBRL(v)}
              </span>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <p className="text-muted text-[11px] font-semibold uppercase tracking-wide mb-2">
          {naoComecou ? 'Orçamento do dia a dia' : 'Quanto posso gastar por dia'}
        </p>

        {!orcamentoDiario ? (
          <div className="rounded-ios p-3" style={{ background: 'rgba(232,137,74,0.08)' }}>
            <p className="text-[12px] leading-relaxed">
              <strong>Você ainda não definiu um orçamento diário.</strong> Sem ele não dá pra dizer quanto sobra por dia,
              e prefiro não inventar um número.
            </p>
          </div>
        ) : naoComecou ? (
          <>
            <p className="font-display text-[24px] font-bold tabular-nums">
              {simboloMoeda(moeda)} {formatarBRL(orcamentoDiario)}<span className="text-[15px] text-muted font-medium"> /dia</span>
            </p>
            <p className="text-[13px] text-muted mt-1">
              {simboloMoeda(moeda)} {formatarBRL(orcamentoDiario * totalDias)} para os {totalDias} dias.
              A conta começa a rodar em {new Date(inicio + 'T00:00:00').toLocaleDateString('pt-BR')}.
            </p>
          </>
        ) : (
          <>
            <p className="font-display text-[24px] font-bold tabular-nums">
              R$ {formatarBRL(Math.max(sobraPorDia ?? 0, 0))}<span className="text-[15px] text-muted font-medium"> /dia</span>
            </p>
            <p className={`text-[13px] mt-1 ${saldo >= 0 ? 'text-muted' : 'text-red font-medium'}`}>
              {acabou
                ? 'Viagem encerrada.'
                : saldo >= 0
                  ? `Você está R$ ${formatarBRL(saldo)} abaixo do previsto, com ${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'} pela frente.`
                  : `Você passou R$ ${formatarBRL(Math.abs(saldo))} do previsto até aqui. Sobram ${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'}.`}
            </p>
          </>
        )}
      </Card>

      {porCategoria.length > 0 && (
        <Card className="p-4">
          <h2 className="text-muted text-[11px] font-semibold uppercase tracking-wide mb-3">Por categoria</h2>
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie data={porCategoria} dataKey="valor" nameKey="categoria" outerRadius={70} innerRadius={44} paddingAngle={2}>
                {porCategoria.map((entry) => (
                  <Cell
                    key={entry.categoria}
                    fill={CORES_CATEGORIA[entry.categoria] ?? '#8E8E93'}
                    stroke="none"
                    opacity={filtro.categoria && filtro.categoria !== entry.categoria ? 0.3 : 1}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {porCategoria.map(({ categoria, valor }) => {
              const ativo = filtro.categoria === categoria
              return (
                <button
                  key={categoria}
                  onClick={() => onFiltrar({ categoria: ativo ? null : categoria })}
                  className={`tap-scale flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-colors ${ativo ? 'bg-fill' : ''}`}
                >
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CORES_CATEGORIA[categoria] ?? '#8E8E93' }} />
                  <span className="text-[12px] text-muted">{LABELS_CATEGORIA[categoria] ?? categoria}</span>
                  <span className="text-[12px] font-semibold tabular-nums">R$ {formatarBRL(valor)}</span>
                </button>
              )
            })}
          </div>
          <p className="text-[11px] text-muted2 text-center mt-2">toque numa categoria para filtrar o histórico</p>
        </Card>
      )}

      {porCidade.length > 0 && (
        <Card className="p-1">
          <h2 className="text-muted text-[11px] font-semibold uppercase tracking-wide px-3 pt-3 pb-1">Por cidade</h2>
          {porCidade.map(([cidade, valor], i) => {
            const ativo = filtro.cidade === cidade
            return (
              <button
                key={cidade}
                onClick={() => onFiltrar({ cidade: ativo ? null : cidade })}
                className={`tap-scale w-full flex justify-between items-center text-[15px] py-2.5 px-3 text-left ${
                  i !== porCidade.length - 1 ? 'border-b border-separator' : ''
                } ${ativo ? 'bg-fill' : ''}`}
              >
                <span>{cidade}</span>
                <span className="flex items-center gap-2">
                  <span className="tabular-nums font-medium">R$ {formatarBRL(valor)}</span>
                  <span className="text-muted2">›</span>
                </span>
              </button>
            )
          })}
        </Card>
      )}
    </div>
  )
}
