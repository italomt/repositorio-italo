import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { usePendencias } from '../../hooks/usePendencias'
import { useDestinos } from '../../hooks/useDestinos'
import { useAcomodacoes } from '../../hooks/useAcomodacoes'
import PendenciaItem from './PendenciaItem'
import PendenciaEditor from './PendenciaEditor'
import PendenciaAdder from './PendenciaAdder'
import Card from '../ui/Card'
import { StaggerContainer, StaggerItem } from '../ui/Stagger'
import { Bed, Plus, ArrowRight } from 'lucide-react'

const CATEGORIAS = [
  { id: 'transporte', label: 'Transporte' },
  { id: 'atracoes', label: 'Atrações' },
  { id: 'documentacao', label: 'Documentação' },
]

const FILTROS = [
  { id: null, label: 'Todas' },
  ...CATEGORIAS,
  { id: 'acomodacao', label: 'Acomodações' },
]

export default function PendenciasView() {
  const { pendencias, loading, totalPendentes, criarPendencia, alternarConcluida, atualizarPendencia, removerPendencia } =
    usePendencias()
  const { destinos } = useDestinos()
  const { acomodacoes } = useAcomodacoes()
  const [pendenciaEditando, setPendenciaEditando] = useState(null)
  const [adicionando, setAdicionando] = useState(false)
  const [filtroAtivo, setFiltroAtivo] = useState(null)
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

  const cidadesSemAcomodacao = useMemo(() => {
    const vistas = new Set()
    return destinos.filter((d) => {
      if (vistas.has(d.cidade)) return false
      vistas.add(d.cidade)
      return !acomodacoes.some((a) => a.cidade === d.cidade)
    })
  }, [destinos, acomodacoes])

  if (loading) return <p className="text-muted text-center mt-10">Carregando pendências...</p>

  const temAcomodacao = cidadesSemAcomodacao.length > 0

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-[34px] font-bold tracking-tight">Pendências</h1>
        <p className="text-muted text-[15px] mt-0.5">{totalPendentes + cidadesSemAcomodacao.length} ainda não resolvidas</p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        {FILTROS.map((f) => (
          <button
            key={f.id ?? 'todas'}
            onClick={() => setFiltroAtivo(f.id)}
            className={`tap-scale flex-shrink-0 px-3.5 py-1.5 rounded-full text-[14px] font-semibold ${
              filtroAtivo === f.id ? 'bg-blue text-white' : 'bg-fill text-text'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {CATEGORIAS.map((cat) => {
        if (filtroAtivo && filtroAtivo !== cat.id) return null
        const itens = pendencias.filter((p) => p.categoria === cat.id)
        if (itens.length === 0) return null
        return (
          <div key={cat.id}>
            <h2 className="text-muted text-[13px] font-semibold uppercase tracking-wide mb-2 px-1">{cat.label}</h2>
            <Card>
              <StaggerContainer>
                {itens.map((p) => (
                  <StaggerItem key={p.id}>
                    <PendenciaItem
                      key={p.id}
                      pendencia={p}
                      onToggle={alternarConcluida}
                      onAbrirEditor={setPendenciaEditando}
                    />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </Card>
          </div>
        )
      })}

      {(!filtroAtivo || filtroAtivo === 'acomodacao') && temAcomodacao && (
        <div>
          <h2 className="text-muted text-[13px] font-semibold uppercase tracking-wide mb-2 px-1">Acomodações</h2>
          <Card>
            <StaggerContainer>
              {cidadesSemAcomodacao.map((cidade) => (
                <StaggerItem key={cidade.cidade}>
                  <button
                    onClick={() => navigate('/roteiro')}
                    className="tap-scale w-full flex items-center gap-3 py-3 px-4 border-b border-separator last:border-b-0 text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-orange/15 flex items-center justify-center flex-shrink-0">
                      <Bed className="w-5 h-5 text-orange" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[16px]">
                        {cidade.flag_emoji} {cidade.cidade}
                      </p>
                      <p className="text-[13px] text-muted">Reservar acomodação</p>
                    </div>
                    <span className="text-muted text-sm font-semibold flex items-center gap-1">
                      Adicionar <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </Card>
        </div>
      )}

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
