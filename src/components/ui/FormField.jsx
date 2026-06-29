import { AlertTriangle } from 'lucide-react'

export default function FormField({ label, hint, error, required, className = '', children }) {
  return (
    <div className={className}>
      {label && (
        <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">
          {label}
          {required && <span className="text-red ml-0.5">*</span>}
        </label>
      )}
      <div className={label ? 'mt-1' : ''}>
        {children}
      </div>
      {hint && !error && (
        <p className="text-[12px] text-muted mt-1">{hint}</p>
      )}
      {error && (
        <p className="text-[13px] text-red bg-red/10 rounded-ios px-3 py-2 mt-1 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}
