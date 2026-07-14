// input type="datetime-local" renderiza bem mais alto que os outros campos no iOS —
// por isso aqui é um par de inputs nativos (date + time), do mesmo tamanho dos demais.
export default function TravelDateTimePicker({ value, onChange, label, className = '' }) {
  const [dataParte, horaParte] = (value || '').split('T')

  function atualizar(novaData, novaHora) {
    if (!novaData && !novaHora) { onChange(''); return }
    onChange(`${novaData || dataParte || ''}T${novaHora || horaParte || '00:00'}`)
  }

  const inputClass = 'min-w-0 bg-fill rounded-ios px-4 py-3 text-[15px] font-sans leading-tight tabular-nums'

  return (
    <div className={`min-w-0 ${className}`}>
      {label && (
        <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">{label}</label>
      )}
      <div className="flex gap-2 mt-1">
        <input
          type="date"
          value={dataParte || ''}
          onChange={(e) => atualizar(e.target.value, horaParte)}
          className={`${inputClass} flex-[3]`}
        />
        <input
          type="time"
          value={horaParte || ''}
          onChange={(e) => atualizar(dataParte, e.target.value)}
          className={`${inputClass} flex-[2]`}
        />
      </div>
    </div>
  )
}
