export default function TravelPrioritySelector({ value, onChange, options, label = 'Urgência', className = '' }) {
  return (
    <div className={className}>
      <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">{label}</label>
      <div className="flex gap-2 mt-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`tap-scale flex-1 py-2.5 rounded-ios text-[14px] font-semibold capitalize ${
              value === o.value ? 'bg-blue text-white' : 'bg-fill text-text'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
