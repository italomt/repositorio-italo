import { Plane, Train, Car, Bus } from 'lucide-react'

// "voo" e "aviao" convivem no banco: o formulário grava um, o assistente grava
// o outro. Sem os dois aqui, metade dos voos aparecia com ícone de trem.
const icones = { aviao: Plane, avião: Plane, voo: Plane, trem: Train, carro: Car, onibus: Bus, ônibus: Bus }

export default function TransporteIcon({ tipo, className = 'w-5 h-5' }) {
  const Icone = icones[tipo] ?? Train
  return <Icone className={className} />
}
