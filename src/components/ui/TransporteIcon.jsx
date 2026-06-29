import { Plane, Train, Car, Bus } from 'lucide-react'

const icones = { aviao: Plane, avião: Plane, trem: Train, carro: Car, onibus: Bus, ônibus: Bus }

export default function TransporteIcon({ tipo, className = 'w-5 h-5' }) {
  const Icone = icones[tipo] ?? Train
  return <Icone className={className} />
}
