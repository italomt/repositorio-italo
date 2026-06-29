const TIPOS = [
  { id: 'viagem', label: 'Viagem', desc: 'Vale para toda a trip' },
  { id: 'cidade', label: 'Cidade', desc: 'Específico de uma cidade' },
  { id: 'dia', label: 'Dia', desc: 'Vinculado a um dia específico' },
  { id: 'atracao', label: 'Atração', desc: 'Vinculado a uma atração' },
  { id: 'hospedagem', label: 'Hospedagem', desc: 'Vinculado a uma acomodação' },
  { id: 'transporte', label: 'Transporte', desc: 'Vinculado a um transporte' },
]

export default function ContextSelector({
  value,
  onChange,
  contextoId,
  onContextoIdChange,
  cidades = [],
  dias = [],
  atracoes = [],
  acomodacoes = [],
  transportes = [],
  showAll = true,
}) {
  const tipos = showAll ? TIPOS : TIPOS.slice(0, 3)

  return (
    <div>
      <div className={`grid grid-cols-${tipos.length > 3 ? '3' : '3'} gap-1.5`}>
        {tipos.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { onChange(t.id); if (t.id === 'viagem') onContextoIdChange('viagem'); else onContextoIdChange('') }}
            className={`tap-scale py-2.5 rounded-ios text-[11px] font-semibold ${value === t.id ? 'bg-blue text-white' : 'bg-fill text-text'}`}
          >
            {t.label}
            <span className={`block text-[9px] font-normal mt-0.5 ${value === t.id ? 'text-white/70' : 'text-muted'}`}>{t.desc}</span>
          </button>
        ))}
      </div>

      {value === 'cidade' && cidades.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {cidades.map((c) => (
            <button
              key={c.nome}
              type="button"
              onClick={() => onContextoIdChange(c.nome)}
              className={`tap-scale px-3 py-1.5 rounded-full text-[13px] font-semibold ${contextoId === c.nome ? 'bg-blue text-white shadow-sm' : 'bg-fill text-text'}`}
            >
              {c.flag} {c.nome}
            </button>
          ))}
        </div>
      )}

      {value === 'dia' && dias.length > 0 && (
        <div className="space-y-1 max-h-44 overflow-y-auto mt-2">
          {dias.map((d) => {
            const ativo = contextoId === d.id
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onContextoIdChange(d.id)}
                className={`tap-scale w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left ${ativo ? 'bg-blue/10 text-blue' : 'text-text'}`}
              >
                <span className="text-lg">{d.flag}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold">{d.label}</p>
                  <p className="text-[12px] text-muted">{d.cidade}</p>
                </div>
                {ativo && <span className="w-3 h-3 rounded-full bg-blue shrink-0" />}
              </button>
            )
          })}
        </div>
      )}

      {value === 'atracao' && atracoes.length > 0 && (
        <div className="space-y-1 max-h-44 overflow-y-auto mt-2">
          {atracoes.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onContextoIdChange(a.id)}
              className={`tap-scale w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left ${contextoId === a.id ? 'bg-blue/10 text-blue' : 'text-text'}`}
            >
              <div className="w-8 h-8 rounded-lg bg-blue/10 flex items-center justify-center shrink-0 text-sm font-bold text-blue">A</div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold">{a.nome}</p>
              </div>
              {contextoId === a.id && <span className="w-3 h-3 rounded-full bg-blue shrink-0" />}
            </button>
          ))}
        </div>
      )}

      {value === 'hospedagem' && acomodacoes.length > 0 && (
        <div className="space-y-1 max-h-44 overflow-y-auto mt-2">
          {acomodacoes.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onContextoIdChange(a.id)}
              className={`tap-scale w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left ${contextoId === a.id ? 'bg-blue/10 text-blue' : 'text-text'}`}
            >
              <div className="w-8 h-8 rounded-lg bg-green/10 flex items-center justify-center shrink-0 text-sm font-bold text-green">H</div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold">{a.nome}</p>
                <p className="text-[12px] text-muted">{a.cidade}</p>
              </div>
              {contextoId === a.id && <span className="w-3 h-3 rounded-full bg-blue shrink-0" />}
            </button>
          ))}
        </div>
      )}

      {value === 'transporte' && transportes.length > 0 && (
        <div className="space-y-1 max-h-44 overflow-y-auto mt-2">
          {transportes.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onContextoIdChange(t.id)}
              className={`tap-scale w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left ${contextoId === t.id ? 'bg-blue/10 text-blue' : 'text-text'}`}
            >
              <div className="w-8 h-8 rounded-lg bg-orange/10 flex items-center justify-center shrink-0 text-sm font-bold text-orange">→</div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold">{t.operadora || t.tipo || 'Transporte'}</p>
              </div>
              {contextoId === t.id && <span className="w-3 h-3 rounded-full bg-blue shrink-0" />}
            </button>
          ))}
        </div>
      )}

      {(value === 'cidade' || value === 'dia' || value === 'atracao' || value === 'hospedagem' || value === 'transporte') &&
        (cidades.length === 0 && dias.length === 0 && atracoes.length === 0 && acomodacoes.length === 0 && transportes.length === 0) && (
        <input
          value={contextoId}
          onChange={(e) => onContextoIdChange(e.target.value)}
          placeholder={value === 'cidade' ? 'Nome da cidade...' : value === 'dia' ? 'ID do dia...' : 'ID...'}
          className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans placeholder:text-muted mt-2"
        />
      )}
    </div>
  )
}
