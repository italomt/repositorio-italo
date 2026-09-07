import { useMemo } from 'react'
import Card from '../ui/Card'
import GastoCard from './GastoCard'
import { formatarBRL } from '../../lib/cambio'
import { LABELS_CATEGORIA_GASTO as LABELS_CATEGORIA } from '../../lib/gastoCategorias'
import { Search, X, ArrowDownWideNarrow, CalendarDays } from 'lucide-react'

function rotuloDia(data) {
  const d = new Date(data + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
}

export default function HistoricoGastos({
  gastos, mapaDestino, filtro, onFiltrar, busca, onBuscar, ordem, onOrdenar, onAbrirEditor,
}) {
  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return gastos.filter((g) => {
      if (filtro.categoria && g.categoria !== filtro.categoria) return false
      if (filtro.cidade) {
        const cidade = mapaDestino[g.destino_id] ?? 'Pré-viagem'
        if (cidade !== filtro.cidade) return false
      }
      if (termo && !g.descricao?.toLowerCase().includes(termo)) return false
      return true
    })
  }, [gastos, filtro, busca, mapaDestino])

  const ordenados = useMemo(() => {
    const lista = [...filtrados]
    if (ordem === 'valor') return lista.sort((a, b) => (b.valor_brl ?? 0) - (a.valor_brl ?? 0))
    return lista.sort((a, b) => (b.data_gasto || '').localeCompare(a.data_gasto || ''))
  }, [filtrados, ordem])

  const porDia = useMemo(() => {
    const mapa = new Map()
    ordenados.forEach((g) => {
      const chave = g.data_gasto || 'sem data'
      if (!mapa.has(chave)) mapa.set(chave, [])
      mapa.get(chave).push(g)
    })
    return [...mapa.entries()]
  }, [ordenados])

  const totalFiltrado = filtrados.reduce((s, g) => s + (g.valor_brl ?? 0), 0)
  const temFiltro = !!(filtro.categoria || filtro.cidade || busca.trim())

  return (
    <div>
      <div className="flex items-center gap-2 bg-fill rounded-full px-3.5 py-2 mb-2.5">
        <Search className="w-4 h-4 text-muted2 flex-shrink-0" />
        <input
          value={busca}
          onChange={(e) => onBuscar(e.target.value)}
          placeholder="Buscar por descrição…"
          className="flex-1 bg-transparent text-[13px] text-text placeholder:text-muted2 outline-none min-w-0"
        />
        {busca && (
          <button onClick={() => onBuscar('')} className="tap-scale text-muted2" aria-label="Limpar busca">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {(filtro.categoria || filtro.cidade) && (
        <div className="flex gap-1.5 flex-wrap mb-2.5">
          {filtro.categoria && (
            <button
              onClick={() => onFiltrar({ categoria: null })}
              className="tap-scale flex items-center gap-1.5 bg-blue text-white rounded-full px-3 py-1.5 text-[12px] font-medium"
            >
              {LABELS_CATEGORIA[filtro.categoria] ?? filtro.categoria}
              <X className="w-3.5 h-3.5 opacity-75" />
            </button>
          )}
          {filtro.cidade && (
            <button
              onClick={() => onFiltrar({ cidade: null })}
              className="tap-scale flex items-center gap-1.5 bg-blue text-white rounded-full px-3 py-1.5 text-[12px] font-medium"
            >
              {filtro.cidade}
              <X className="w-3.5 h-3.5 opacity-75" />
            </button>
          )}
        </div>
      )}

      <div className="flex justify-between items-center mb-2.5 px-1">
        <p className="text-[12px] text-muted">
          {filtrados.length} {filtrados.length === 1 ? 'gasto' : 'gastos'} ·{' '}
          <span className="text-text font-semibold tabular-nums">R$ {formatarBRL(totalFiltrado)}</span>
        </p>
        <button
          onClick={() => onOrdenar(ordem === 'valor' ? 'data' : 'valor')}
          className="tap-scale flex items-center gap-1 text-[12px] text-blue font-semibold"
        >
          {ordem === 'valor' ? <ArrowDownWideNarrow className="w-3.5 h-3.5" /> : <CalendarDays className="w-3.5 h-3.5" />}
          {ordem === 'valor' ? 'Maior valor' : 'Recentes'}
        </button>
      </div>

      {filtrados.length === 0 ? (
        <Card>
          <p className="text-muted text-[15px] py-6 text-center">
            {temFiltro ? 'Nenhum gasto com esse filtro.' : 'Nenhum gasto ainda. Toque em + para registrar.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {porDia.map(([dia, doDia]) => (
            <div key={dia}>
              <div className="flex justify-between items-baseline px-1 pb-1">
                <span className="text-[11px] text-muted font-semibold uppercase tracking-wide">
                  {dia === 'sem data' ? 'Sem data' : rotuloDia(dia)}
                </span>
                <span className="text-[11px] text-muted2 tabular-nums">
                  R$ {formatarBRL(doDia.reduce((s, g) => s + (g.valor_brl ?? 0), 0))}
                </span>
              </div>
              <Card>
                {doDia.map((g) => (
                  <GastoCard key={g.id} gasto={g} cidade={mapaDestino[g.destino_id]} onAbrirEditor={onAbrirEditor} />
                ))}
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
