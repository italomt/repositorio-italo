import { useEffect, useMemo, useRef } from 'react'
import { inicializarMapaDoDia, abrirRoteiroDoDia } from '../../lib/maps'
import Button from '../ui/Button'

export default function MapaDoDia({ atracoes, acomodacao }) {
  const ref = useRef(null)

  // Sem o useMemo o filter devolve um array novo a cada render, o effect
  // dispara sempre e o mapa é recriado do zero em cada atualização da tela.
  const comCoordenadas = useMemo(
    () => atracoes.filter((a) => a.latitude && a.longitude),
    [atracoes],
  )

  const partida = acomodacao?.latitude && acomodacao?.longitude ? acomodacao : null

  useEffect(() => {
    if (ref.current && comCoordenadas.length > 0) {
      inicializarMapaDoDia(comCoordenadas, ref.current, partida).catch(() => {})
    }
  }, [comCoordenadas, partida])

  if (comCoordenadas.length === 0) {
    return <p className="text-muted text-sm text-center py-6">Nenhuma atração com coordenadas neste dia.</p>
  }

  return (
    <div className="space-y-2">
      <div ref={ref} className="w-full h-44 rounded-xl bg-border" />
      {partida && (
        <p className="text-[12px] text-muted text-center">
          A rota sai de <span className="font-medium text-text">{partida.nome}</span> e passa pelas {comCoordenadas.length} paradas do dia.
        </p>
      )}
      <Button variant="outline" className="w-full" onClick={() => abrirRoteiroDoDia(comCoordenadas, partida)}>
        Abrir roteiro completo no Maps
      </Button>
    </div>
  )
}
