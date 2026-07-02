import { Plus, X, CalendarPlus, Trash2 } from 'lucide-react'
import { CORES_DIA, CORES_BTN, CORES_ATIVO } from './coresCidade'

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.']

export default function AtribuirDiasGrid({
  destinos,
  cidadesViagem,
  cidadeAtivaId,
  mode,
  onSelecionarCidade,
  onAtribuirDia,
  onRemoverDia,
  onRemoverCidade,
  onAdicionarCidade,
  onAdicionarDia,
  corDeCidade,
  childrenCount,
  diasExistentesSet,
}) {
  const destinosOrdenados = [...destinos].sort((a, b) => a.data.localeCompare(b.data))

  return (
    <div className="space-y-4">
      {/* Pills de cidade */}
      <div className="flex gap-1.5 flex-wrap items-center">
        {cidadesViagem.map((c) => {
          const idxCor = corDeCidade[c.id] ?? 0
          const ativa = cidadeAtivaId === c.id
          const diasDaCidade = destinos.filter((d) => d.cidade_id === c.id).length
          return (
            <div key={c.id} className="flex items-center gap-0.5">
              <button
                onClick={() => onSelecionarCidade(c.id)}
                className={`tap-scale px-3 py-1.5 rounded-full text-[13px] font-semibold border-2 flex items-center gap-1.5 ${
                  ativa ? CORES_ATIVO[idxCor] : CORES_BTN[idxCor]
                } ${c.staged ? 'border-dashed' : ''}`}
              >
                {c.flag && <span className="text-[14px]">{c.flag}</span>}
                <span>{c.nome}</span>
                {!c.staged && (
                  <span className={`text-[11px] ${ativa ? 'opacity-70' : 'opacity-50'}`}>{diasDaCidade}d</span>
                )}
                {c.staged && (
                  <span className={`text-[10px] ${ativa ? 'opacity-70' : 'opacity-50'}`}>nova</span>
                )}
              </button>
              <button
                onClick={() => onRemoverCidade(c.id)}
                className="tap-scale w-6 h-6 rounded-full bg-red/10 flex items-center justify-center flex-shrink-0"
                aria-label={`Remover ${c.nome}`}
              >
                <span className="text-red text-[10px] leading-none">✕</span>
              </button>
            </div>
          )
        })}

        <button
          onClick={onAdicionarCidade}
          className="tap-scale px-3 py-1.5 rounded-full text-[13px] font-semibold border-2 border-dashed border-muted2 text-muted flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Cidade
        </button>
      </div>

      {/* Modo: Atribuir / Remover */}
      <div className="flex gap-1.5 bg-fill rounded-ios p-1">
        <button
          onClick={() => onSelecionarCidade(cidadeAtivaId)}
          className={`tap-scale flex-1 py-2 rounded-ios text-[13px] font-semibold flex items-center justify-center gap-1.5 ${
            mode === 'atribuir' ? 'bg-card text-text shadow-sm' : 'text-muted'
          }`}
        >
          Atribuir dia
        </button>
        <button
          onClick={() => onSelecionarCidade('__remover__')}
          className={`tap-scale flex-1 py-2 rounded-ios text-[13px] font-semibold flex items-center justify-center gap-1.5 ${
            mode === 'remover' ? 'bg-card text-red shadow-sm' : 'text-muted'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" /> Remover dia
        </button>
      </div>

      {/* Grade de datas */}
      <div className="flex flex-wrap gap-1.5 bg-fill rounded-ios p-3">
        {destinosOrdenados.length === 0 && (
          <p className="text-[14px] text-muted text-center w-full py-4">
            Nenhum dia ainda. Toque em "Adicionar dia" abaixo.
          </p>
        )}
        {destinosOrdenados.map((dia) => {
          const idx = corDeCidade[dia.cidade_id] ?? 0
          const cor = dia.cidade_id ? CORES_DIA[idx % CORES_DIA.length] : 'bg-card text-muted2'
          const d = new Date(dia.data + 'T00:00:00')
          const diaSemana = DIAS_SEMANA[d.getDay()]
          const mes = MESES[d.getMonth()]
          const counts = childrenCount[dia.id] || { atracoes: 0, gastos: 0 }
          const temChildren = counts.atracoes > 0 || counts.gastos > 0

          return (
            <button
              key={dia.id}
              onClick={() => (mode === 'remover' ? onRemoverDia(dia) : onAtribuirDia(dia))}
              className={`tap-scale flex-shrink-0 flex flex-col items-center px-3 py-1.5 rounded-xl transition-all relative ${cor}`}
            >
              <span className="text-[9px] font-semibold uppercase opacity-70">{diaSemana}</span>
              <span className="text-[17px] font-bold font-display leading-tight">{d.getDate()}</span>
              <span className="text-[8px] uppercase opacity-70">{mes}</span>
              {temChildren && mode === 'atribuir' && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-white text-text text-[8px] font-bold flex items-center justify-center shadow-sm">
                  {counts.atracoes + counts.gastos}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Total + adicionar dia */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-[14px] font-semibold text-text">
          {destinos.length} dia{destinos.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={onAdicionarDia}
          disabled={mode === 'remover' || !cidadeAtivaId}
          className="tap-scale px-4 py-2 rounded-ios bg-blue/10 text-blue text-[13px] font-semibold flex items-center gap-1.5 disabled:opacity-40"
        >
          <CalendarPlus className="w-4 h-4" /> Adicionar dia
        </button>
      </div>

      {mode === 'atribuir' && !cidadeAtivaId && (
        <p className="text-[12px] text-muted2 text-center">
          Selecione uma cidade acima e toque nos dias para atribuir
        </p>
      )}
      {mode === 'atribuir' && cidadeAtivaId && cidadeAtivaId !== '__remover__' && (
        <p className="text-[12px] text-muted2 text-center">
          Toque num dia para atribuí-lo a{' '}
          <strong className="text-text">
            {cidadesViagem.find((c) => c.id === cidadeAtivaId)?.nome}
          </strong>
        </p>
      )}
      {mode === 'remover' && (
        <p className="text-[12px] text-red/70 text-center">
          Toque num dia para removê-lo da viagem
        </p>
      )}
    </div>
  )
}
