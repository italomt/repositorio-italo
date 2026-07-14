export default function TravelDateTimePicker({ value, onChange, label, min, max, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">{label}</label>
      )}
      <input
        type="datetime-local"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans leading-tight tabular-nums mt-1"
      />
    </div>
  )
}
