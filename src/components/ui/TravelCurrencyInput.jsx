export default function TravelCurrencyInput({ valor, moeda, onValorChange, onMoedaChange, moedas = ['EUR', 'USD', 'CHF', 'BRL', 'GBP'], label = 'Valor', placeholder = '0,00', className = '' }) {
  return (
    <div className={className}>
      <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">{label}</label>
      <div className="flex gap-2 mt-1">
        <input
          type="number"
          placeholder={placeholder}
          value={valor ?? ''}
          onChange={(e) => onValorChange(e.target.value)}
          className="flex-1 bg-fill rounded-ios px-4 py-3 text-[15px] font-sans leading-tight tabular-nums placeholder:text-muted"
        />
        <select
          value={moeda}
          onChange={(e) => onMoedaChange(e.target.value)}
          className="bg-fill rounded-ios px-4 py-3 text-[15px] font-sans"
        >
          {moedas.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
