const VARIANTES = {
  primary: 'bg-blue text-white',
  accent: 'bg-orange text-white',
  outline: 'bg-fill text-blue',
  danger: 'bg-red text-white',
  ghost: 'bg-transparent text-blue',
}

export default function Button({ variant = 'primary', className = '', children, ...props }) {
  return (
    <button
      className={`tap-scale px-4 py-3 rounded-ios font-semibold text-[15px] leading-none disabled:opacity-40 ${VARIANTES[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
