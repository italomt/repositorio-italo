import { useEffect, useRef } from 'react'
import { inicializarMapaDoDia, abrirRoteiroDoDia } from '../../lib/maps'
import Button from '../ui/Button'

export default function MapaDoDia({ atracoes }) {
  const ref = useRef(null)
  const comCoordenadas = atracoes.filter((a) => a.latitude && a.longitude)

  useEffect(() => {
    if (ref.current && comCoordenadas.length > 0) {
      inicializarMapaDoDia(comCoordenadas, ref.current).catch(() => {})
    }
  }, [comCoordenadas])

  if (comCoordenadas.length === 0) {
    return <p className="text-muted text-sm text-center py-6">Nenhuma atração com coordenadas neste dia.</p>
  }

  return (
    <div className="space-y-2">
      <div ref={ref} className="w-full h-64 rounded-xl bg-border" />
      <Button variant="outline" className="w-full" onClick={() => abrirRoteiroDoDia(comCoordenadas)}>
        Abrir roteiro completo no Maps
      </Button>
    </div>
  )
}
