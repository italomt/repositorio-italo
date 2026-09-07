import { useState } from 'react'
import { useViagem } from '../../contexts/ViagemContext'
import { useGastos } from '../../hooks/useGastos'
import { useDestinos } from '../../hooks/useDestinos'
import { useHoje } from '../../hooks/useHoje'
import { useAuthContext } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { converterParaBRL } from '../../lib/cambio'
import GastoForm from './GastoForm'
import Dashboard from './Dashboard'
import HistoricoGastos from './HistoricoGastos'
import Modal from '../ui/Modal'
import PullToRefresh from '../ui/PullToRefresh'

import { Skeleton, SkeletonCard, SkeletonListItem } from '../ui/Skeleton'

export default function FinancasView() {
  const { usuario } = useAuthContext()
  const { viagem, viagemId } = useViagem()
  const { gastos, loading, adicionarGasto, atualizarGasto, removerGasto, recarregar } = useGastos(viagemId)
  const { destinos } = useDestinos(viagemId)
  const { destinoHoje } = useHoje(viagemId)
  const addToast = useToast()
  const [gastoEditando, setGastoEditando] = useState(null)
  const [filtro, setFiltro] = useState({ categoria: null, cidade: null })
  const [busca, setBusca] = useState('')
  const [ordem, setOrdem] = useState('data')

  const mapaDestino = Object.fromEntries(destinos.map((d) => [d.id, d.cidade]))

  function aplicarFiltro(parcial) {
    setFiltro((atual) => ({ ...atual, ...parcial }))
  }

  async function handleAtualizar(gasto) {
    const { valorBRL, cotacaoUsada } = await converterParaBRL(gasto.valor, gasto.moeda)
    await atualizarGasto(gastoEditando.id, { ...gasto, valor_brl: valorBRL, cotacao_usada: cotacaoUsada })
    setGastoEditando(null)
    addToast('Gasto atualizado')
  }

  async function handleExcluir(id) {
    await removerGasto(id)
    setGastoEditando(null)
    addToast('Gasto excluído', 'info')
  }

  if (loading) return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-4 w-28 mt-1.5" />
        </div>
        <Skeleton className="w-11 h-11 rounded-full" />
      </div>
      <SkeletonCard>
        <div className="p-4 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-40" />
          <Skeleton className="h-3 w-full" />
        </div>
      </SkeletonCard>
      <div className="space-y-1">
        <Skeleton className="h-4 w-20 mb-3" />
        <SkeletonCard>
          {[1, 2, 3].map((i) => <SkeletonListItem key={i} />)}
        </SkeletonCard>
      </div>
    </div>
  )

  return (
    <PullToRefresh onRefresh={recarregar}>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-[34px] font-bold tracking-tight">Finanças</h1>
            <p className="text-muted text-[15px] mt-0.5">{gastos.length} {gastos.length === 1 ? 'gasto registrado' : 'gastos registrados'}</p>
          </div>

        </div>

        <Dashboard
          gastos={gastos}
          destinos={destinos}
          viagem={viagem}
          filtro={filtro}
          onFiltrar={aplicarFiltro}
        />

        <div>
          <h2 className="text-muted text-[13px] font-semibold uppercase tracking-wide mb-3 px-1">Histórico</h2>
          <HistoricoGastos
            gastos={gastos}
            mapaDestino={mapaDestino}
            filtro={filtro}
            onFiltrar={aplicarFiltro}
            busca={busca}
            onBuscar={setBusca}
            ordem={ordem}
            onOrdenar={setOrdem}
            onAbrirEditor={setGastoEditando}
          />
        </div>



        <Modal aberto={!!gastoEditando} onClose={() => setGastoEditando(null)} titulo="Editar gasto">
          <GastoForm
            key={gastoEditando?.id}
            destinos={destinos}
            cidadeAtual={destinoHoje?.cidade}
            gastoExistente={gastoEditando}
            moedaPadrao={viagem?.moeda_principal}
            onSalvar={handleAtualizar}
            onCancelar={() => setGastoEditando(null)}
            onExcluir={handleExcluir}
          />
        </Modal>
      </div>
    </PullToRefresh>
  )
}
