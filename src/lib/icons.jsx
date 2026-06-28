import {
  Landmark, UtensilsCrossed, Music, ShoppingBag, TreePine,
  Palmtree, Sparkles, MapPin, AlertTriangle, CheckCircle2,
  Compass, Lightbulb, Luggage, Camera, Plane, PartyPopper,
  Calendar, Settings, Sun, Moon, Check,
} from 'lucide-react'

export const ICONES_ATRACAO = {
  museu: Landmark,
  gastronomia: UtensilsCrossed,
  balada: Music,
  compras: ShoppingBag,
  natureza: TreePine,
  cultura: Landmark,
  lazer: Palmtree,
  outro: Sparkles,
}

export function IconeCategoria({ categoria, className = 'w-5 h-5' }) {
  const Icone = ICONES_ATRACAO[categoria] ?? MapPin
  return <Icone className={className} />
}
