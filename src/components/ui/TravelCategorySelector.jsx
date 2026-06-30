export default function TravelCategorySelector({ value, onChange, options, label = 'Categoria', className = '' }) {
  return (
    <div className={className}>
      <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans capitalize mt-1"
      >
        {options.map((o) => (
          <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
            {typeof o === 'string' ? o : o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
