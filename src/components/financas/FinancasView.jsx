import { useState } from 'react'
import { useGastos } from '../../hooks/useGastos'
import { useDestinos } from '../../hooks/useDestinos'
import { useHoje } from '../../hooks/useHoje'
import { useAuthContext } from '../../contexts/AuthContext'
import { converterParaBRL } from '../../lib/cambio'
import GastoCard from './GastoCard'
import GastoForm from './GastoForm'
import Dashboard from './Dashboard'
import Card from '../ui/Card'
import Modal from '../ui/Modal'

export default function FinancasView() {
  const { usuario } = useAuthContext()
  const { gastos, loading, adicionarGasto, atualizarGasto, removerGasto } = useGastos(usuario?.id)
  const { destinos } = useDestinos()
  const { destinoHoje } = useHoje()
  const [modalAberto, setModalAberto] = useState(false)
  const [gastoEditando, setGastoEditando] = useState(null)

  const mapaDestino = Object.fromEntries(destinos.map((d) => [d.id, d.cidade]))

  async function handleSalvar(gasto) {
    const { valorBRL, cotacaoUsada } = await converterParaBRL(gasto.valor_original, gasto.moeda_original)
    await adicionarGasto({ ...gasto, valor_brl: valorBRL, cotacao_usada: cotacaoUsada })
    setModalAberto(false)
  }

  async function handleAtualizar(gasto) {
    const { valorBRL, cotacaoUsada } = await converterParaBRL(gasto.valor_original, gasto.moeda_original)
    await atualizarGasto(gastoEditando.id, { ...gasto, valor_brl: valorBRL, cotacao_usada: cotacaoUsada })
    setGastoEditando(null)
  }

  async function handleExcluir(id) {
    await removerGasto(id)
    setGastoEditando(null)
  }

  if (loading) return <p className="text-muted text-center mt-10">Carregando...</p>

  return (
    <div className="space-y-4">
      <h1 className="font-display text-[34px] font-bold tracking-tight">Finanças</h1>

      <Dashboard gastos={gastos} destinos={destinos} />

      <div>
        <h2 className="text-muted text-[13px] font-semibold uppercase tracking-wide mb-2 px-1">Histórico</h2>
        <Card>
          {gastos.length === 0 ? (
            <p className="text-muted text-[15px] py-6 text-center">Nenhum gasto lançado ainda.</p>
          ) : (
            gastos.map((g) => (
              <GastoCard key={g.id} gasto={g} cidade={mapaDestino[g.destino_id]} onAbrirEditor={setGastoEditando} onExcluir={removerGasto} />
            ))
          )}
        </Card>
      </div>

      <button
        onClick={() => setModalAberto(true)}
        className="tap-scale fixed bottom-24 right-4 rounded-full w-[58px] h-[58px] bg-blue text-white text-[28px] font-light shadow-ios-lg z-30 flex items-center justify-center"
      >
        +
      </button>

      <Modal aberto={modalAberto} onClose={() => setModalAberto(false)} titulo="Novo gasto">
        <GastoForm
          destinos={destinos}
          cidadeAtual={destinoHoje?.cidade}
          onSalvar={handleSalvar}
          onCancelar={() => setModalAberto(false)}
        />
      </Modal>

      <Modal aberto={!!gastoEditando} onClose={() => setGastoEditando(null)} titulo="Editar gasto">
        <GastoForm
          key={gastoEditando?.id}
          destinos={destinos}
          cidadeAtual={destinoHoje?.cidade}
          gastoExistente={gastoEditando}
          onSalvar={handleAtualizar}
          onCancelar={() => setGastoEditando(null)}
          onExcluir={handleExcluir}
        />
      </Modal>
    </div>
  )
}
