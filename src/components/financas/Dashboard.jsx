import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import Card from '../ui/Card'
import { formatarBRL } from '../../lib/cambio'

function ContadorAnimado({ valor, prefixo = '', sufixo = '' }) {
  const animado = motion.div
  return (
    <span className="tabular-nums">
      {prefixo}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {formatarBRL(valor)}
      </motion.span>
      {sufixo}
    </span>
  )
}

const LABELS_CATEGORIA = {
  alimentacao: 'Alimentação',
  transporte: 'Transporte',
  hospedagem: 'Hospedagem',
  atracoes: 'Atrações',
  compras: 'Compras',
  lazer: 'Lazer',
  outro: 'Outro',
}

const CORES_CATEGORIA = {
  alimentacao: '#FF9500',
  transporte: '#007AFF',
  hospedagem: '#34C759',
  atracoes: '#FF3B30',
  compras: '#30B0C7',
  lazer: '#AF52DE',
  outro: '#8E8E93',
}

const ORCAMENTO_TOTAL_BRL = 22 * 500

export default function Dashboard({ gastos, destinos }) {
  const totalGasto = useMemo(() => gastos.reduce((s, g) => s + (g.valor_brl ?? 0), 0), [gastos])

  const porCategoria = useMemo(() => {
    const mapa = {}
    gastos.forEach((g) => {
      mapa[g.categoria] = (mapa[g.categoria] ?? 0) + (g.valor_brl ?? 0)
    })
    return Object.entries(mapa).map(([categoria, valor]) => ({ categoria, valor }))
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

  const diasComGasto = new Set(gastos.map((g) => g.data_gasto)).size || 1
  const mediaDiaria = totalGasto / diasComGasto
  const projecaoTotal = mediaDiaria * 22

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-muted text-[13px] font-medium uppercase tracking-wide">Total gasto</span>
          <span className="font-display text-[24px] font-bold tabular-nums">R$ <ContadorAnimado valor={totalGasto} /></span>
        </div>
        <div className="h-[6px] bg-fill rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-blue rounded-full transition-all duration-500 ease-ios"
            style={{ width: `${Math.min((totalGasto / ORCAMENTO_TOTAL_BRL) * 100, 100)}%` }}
          />
        </div>
        <p className="text-[13px] text-muted">
          Orçamento estimado: <span className="tabular-nums">R$ {formatarBRL(ORCAMENTO_TOTAL_BRL)}</span>
        </p>
        <p className="text-[13px] text-muted mt-1.5">
          No ritmo atual, projeção até o fim da viagem:{' '}
          <strong className="text-text tabular-nums">R$ {formatarBRL(projecaoTotal)}</strong>
        </p>
      </Card>

      {porCategoria.length > 0 && (
        <Card className="p-4">
          <h2 className="text-muted text-[13px] font-semibold uppercase tracking-wide mb-2">Por categoria</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={porCategoria} dataKey="valor" nameKey="categoria" outerRadius={72} innerRadius={44} paddingAngle={2}>
                {porCategoria.map((entry) => (
                  <Cell key={entry.categoria} fill={CORES_CATEGORIA[entry.categoria] ?? '#8E8E93'} stroke="none" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-1">
            {porCategoria.map(({ categoria, valor }) => (
              <div key={categoria} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CORES_CATEGORIA[categoria] ?? '#8E8E93' }} />
                <span className="text-[12px] text-muted">{LABELS_CATEGORIA[categoria] ?? categoria}</span>
                <span className="text-[12px] font-semibold text-text tabular-nums">R$ {formatarBRL(valor)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {porCidade.length > 0 && (
        <Card className="p-1">
          <h2 className="text-muted text-[13px] font-semibold uppercase tracking-wide px-3 pt-3 pb-1">Por cidade</h2>
          {porCidade.map(([cidade, valor], i) => (
            <div
              key={cidade}
              className={`flex justify-between text-[15px] py-2.5 px-3 ${i !== porCidade.length - 1 ? 'border-b border-separator' : ''}`}
            >
              <span>{cidade}</span>
              <span className="tabular-nums font-medium">R$ {formatarBRL(valor)}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
