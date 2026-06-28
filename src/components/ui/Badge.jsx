const CORES = {
  alta: 'bg-red/15 text-red',
  media: 'bg-orange/15 text-orange',
  normal: 'bg-fill text-muted',
  baixa: 'bg-fill text-muted',
  sucesso: 'bg-green/15 text-green',
  primario: 'bg-blue/15 text-blue',
}

export default function Badge({ tom = 'normal', className = '', children }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold ${CORES[tom] ?? CORES.normal} ${className}`}
    >
      {children}
    </span>
  )
}
