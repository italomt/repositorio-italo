import { useState, useMemo } from 'react'
import { useViagem } from '../../hooks/useViagem'
import { useGastos } from '../../hooks/useGastos'
import { useToast } from '../../contexts/ToastContext'
import { formatarBRL } from '../../lib/cambio'
import GastoForm from './GastoForm'
import Card from '../ui/Card'
import Modal from '../ui/Modal'
import PullToRefresh from '../ui/PullToRefresh'
import { Plus } from 'lucide-react'
import { Skeleton, SkeletonCard } from '../ui/Skeleton'

const CATEGORIA_LABELS = {
  alimentacao: 'Alimentação', transporte: 'Transporte', hospedagem: 'Hospedagem',
  atracoes: 'Atrações', compras: 'Compras', lazer: 'Lazer', outro: 'Outros'
}
const CATEGORIA_CORES = {
  alimentacao: 'bg-green/10 text-green', transporte: 'bg-blue/10 text-blue',
  hospedagem: 'bg-purple/10 text-purple', atracoes: 'bg-orange/10 text-orange',
  compras: 'bg-pink/10 text-pink', lazer: 'bg-teal/10 text-teal', outro: 'bg-muted/10 text-muted',
}

export default function FinancasView() {
  const { viagem, viagemId } = useViagem()
  const { gastos, loading, adicionarGasto, recarregar } = useGastos(viagemId)
  const addToast = useToast()
  const [modalAberto, setModalAberto] = useState(false)

  const totalBRL = useMemo(() => gastos.reduce((s, g) => s + (g.valor_brl ?? 0), 0), [gastos])
  const orcamento = viagem?.orcamento_total || 0
  const pctOrcamento = orcamento > 0 ? Math.round((totalBRL / orcamento) * 100) : 0

  const porCategoria = useMemo(() => {
    const m = {}
    gastos.forEach((g) => {
      const cat = g.categoria || 'outro'
      m[cat] = (m[cat] || 0) + (g.valor_brl ?? 0)
    })
    return Object.entries(m).sort((a, b) => b[1] - a[1])
  }, [gastos])

  const ultimos = useMemo(() => gastos.slice(0, 5), [gastos])

  if (loading) return (
    <div className="space-y-5">
      <Skeleton className="h-9 w-28" />
      <SkeletonCard><Skeleton className="h-12 w-32 mb-2" /><Skeleton className="h-3 w-full" /></SkeletonCard>
    </div>
  )

  return (
    <PullToRefresh onRefresh={recarregar}>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-[34px] font-bold tracking-tight">Finanças</h1>
          <button onClick={() => setModalAberto(true)} className="tap-scale w-11 h-11 rounded-full bg-blue text-white flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <Card className="p-4">
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-muted text-[13px] font-medium uppercase tracking-wide">Total gasto</span>
            <span className="font-display text-[28px] font-bold tabular-nums text-text">R$ {formatarBRL(totalBRL)}</span>
          </div>
          {orcamento > 0 && (
            <>
              <div className="h-[6px] bg-fill rounded-full overflow-hidden mt-2">
                <div className="h-full bg-blue rounded-full transition-all duration-500 ease-ios" style={{ width: `${Math.min(pctOrcamento, 100)}%` }} />
              </div>
              <p className="text-[13px] text-muted mt-1.5">{pctOrcamento}% do orçamento · Restam R$ {formatarBRL(Math.max(orcamento - totalBRL, 0))}</p>
            </>
          )}
        </Card>

        {porCategoria.length > 0 && (
          <Card>
            <div className="p-4">
              <h2 className="text-muted text-[13px] font-semibold uppercase tracking-wide mb-3">Por categoria</h2>
              <div className="space-y-2">
                {porCategoria.map(([cat, val]) => (
                  <div key={cat} className="flex items-center justify-between">
                    <span className={`text-[13px] font-medium px-2 py-0.5 rounded-md ${CATEGORIA_CORES[cat] || ''}`}>
                      {CATEGORIA_LABELS[cat] || cat}
                    </span>
                    <span className="text-[15px] font-semibold tabular-nums">R$ {formatarBRL(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {ultimos.length > 0 && (
          <div>
            <h2 className="text-muted text-[13px] font-semibold uppercase tracking-wide mb-3 px-1">Últimos gastos</h2>
            <Card>
              {ultimos.map((g) => (
                <div key={g.id} className="flex items-center justify-between py-3 px-4 border-b border-separator last:border-b-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium truncate">{g.descricao}</p>
                    <p className="text-[12px] text-muted">{g.data_gasto} · {CATEGORIA_LABELS[g.categoria] || g.categoria}</p>
                  </div>
                  <span className="text-[15px] font-semibold tabular-nums ml-3">
                    {g.moeda !== 'BRL' ? `${g.moeda} ` : 'R$ '}
                    {g.moeda === 'BRL' ? formatarBRL(g.valor) : g.valor}
                  </span>
                </div>
              ))}
            </Card>
          </div>
        )}

        {gastos.length === 0 && (
          <Card><div className="py-12 text-center text-muted"><p className="text-[15px]">Nenhum gasto ainda</p><p className="text-[13px] mt-1">Toque em + para registrar o primeiro</p></div></Card>
        )}

        <Modal aberto={modalAberto} onClose={() => setModalAberto(false)} titulo="Novo gasto">
          <GastoForm
            destinos={[]}
            cidadeAtual=""
            onSalvar={async (g) => { await adicionarGasto(g); setModalAberto(false); addToast('Gasto adicionado') }}
            onCancelar={() => setModalAberto(false)}
            compact
          />
        </Modal>
      </div>
    </PullToRefresh>
  )
}
