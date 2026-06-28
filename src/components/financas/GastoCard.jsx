import { formatarBRL } from '../../lib/cambio'
import { useContextMenu } from '../../hooks/useContextMenu'
import ContextMenu from '../ui/ContextMenu'
import SwipeActions from '../ui/SwipeActions'

export default function GastoCard({ gasto, cidade, onAbrirEditor, onExcluir }) {
  const { menu, abrir, fechar } = useContextMenu()

  return (
    <SwipeActions onEdit={() => onAbrirEditor(gasto)} onDelete={() => onExcluir?.(gasto.id)}>
      <button
        onClick={() => onAbrirEditor(gasto)}
        onContextMenu={abrir}
        className="tap-scale w-full flex items-center justify-between py-3 px-4 border-b border-separator last:border-b-0 text-left"
      >
        <div className="min-w-0">
          <p className="text-[15px] font-medium truncate">{gasto.descricao}</p>
          <p className="text-[13px] text-muted">
            {new Date(gasto.data_gasto + 'T00:00:00').toLocaleDateString('pt-BR')} · {cidade ?? 'Pré-viagem'} · {gasto.categoria}
          </p>
        </div>
        <div className="text-right flex items-center gap-2 flex-shrink-0">
          <div>
            <p className="tabular-nums text-[15px] font-semibold">R$ {formatarBRL(gasto.valor_brl ?? 0)}</p>
            <p className="text-[12px] text-muted tabular-nums">
              {gasto.valor_original} {gasto.moeda_original}
            </p>
          </div>
          <span className="text-muted2 text-lg flex-shrink-0">›</span>
        </div>
      </button>
      <ContextMenu
        menu={menu}
        onFechar={fechar}
        itens={[
          { label: 'Editar', icone: '✏️', onClick: () => onAbrirEditor(gasto) },
          { label: 'Excluir', icone: '🗑️', perigoso: true, onClick: () => onExcluir?.(gasto.id) },
        ]}
      />
    </SwipeActions>
  )
}
