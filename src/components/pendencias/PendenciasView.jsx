import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { usePendencias } from '../../hooks/usePendencias'
import PendenciaItem from './PendenciaItem'
import PendenciaEditor from './PendenciaEditor'
import PendenciaAdder from './PendenciaAdder'
import Card from '../ui/Card'

const CATEGORIAS = [
  { id: 'transporte', label: 'Transporte' },
  { id: 'atracoes', label: 'Atrações' },
  { id: 'documentacao', label: 'Documentação' },
]

export default function PendenciasView() {
  const { pendencias, loading, totalPendentes, criarPendencia, alternarConcluida, atualizarPendencia, removerPendencia } =
    usePendencias()
  const [pendenciaEditando, setPendenciaEditando] = useState(null)
  const [adicionando, setAdicionando] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const abrirId = location.state?.abrirPendenciaId
    if (abrirId && pendencias.length > 0) {
      const encontrada = pendencias.find((p) => p.id === abrirId)
      if (encontrada) setPendenciaEditando(encontrada)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location, pendencias, navigate])

  if (loading) return <p className="text-muted text-center mt-10">Carregando pendências...</p>

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-[34px] font-bold tracking-tight">Pendências</h1>
        <p className="text-muted text-[15px] mt-0.5">{totalPendentes} ainda não resolvidas</p>
      </div>

      {CATEGORIAS.map((cat) => {
        const itens = pendencias.filter((p) => p.categoria === cat.id)
        if (itens.length === 0) return null
        return (
          <div key={cat.id}>
            <h2 className="text-muted text-[13px] font-semibold uppercase tracking-wide mb-2 px-1">{cat.label}</h2>
            <Card>
              {itens.map((p) => (
                <PendenciaItem
                  key={p.id}
                  pendencia={p}
                  onToggle={alternarConcluida}
                  onAbrirEditor={setPendenciaEditando}
                />
              ))}
            </Card>
          </div>
        )
      })}

      <PendenciaEditor
        key={pendenciaEditando?.id}
        aberto={!!pendenciaEditando}
        onClose={() => setPendenciaEditando(null)}
        pendencia={pendenciaEditando}
        onSalvar={atualizarPendencia}
        onExcluir={removerPendencia}
      />

      <button
        onClick={() => setAdicionando(true)}
        className="tap-scale fixed bottom-24 right-4 rounded-full w-[58px] h-[58px] bg-blue text-white text-[28px] font-light shadow-ios-lg z-30 flex items-center justify-center"
      >
        +
      </button>

      <PendenciaAdder aberto={adicionando} onClose={() => setAdicionando(false)} onSalvar={criarPendencia} />
    </div>
  )
}
