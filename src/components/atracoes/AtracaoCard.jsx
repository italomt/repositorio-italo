import { abrirNoMaps } from '../../lib/maps'
import { AlertTriangle, CheckCircle2, Landmark, UtensilsCrossed, Music, ShoppingBag, TreePine, Palmtree, Sparkles, MapPin } from 'lucide-react'

const ICONES = {
  museu: Landmark,
  gastronomia: UtensilsCrossed,
  balada: Music,
  compras: ShoppingBag,
  natureza: TreePine,
  cultura: Landmark,
  lazer: Palmtree,
  outro: Sparkles,
}

const CORES = {
  museu: 'bg-purple/15',
  gastronomia: 'bg-orange/15',
  balada: 'bg-pink/15',
  compras: 'bg-teal/15',
  natureza: 'bg-green/15',
  cultura: 'bg-indigo/15',
  lazer: 'bg-yellow/15',
  outro: 'bg-fill',
}

function Icone({ categoria, className = 'w-5 h-5' }) {
  const Icon = ICONES[categoria] ?? MapPin
  return <Icon className={className} />
}

export default function AtracaoCard({ atracao, pendenciaRelacionada, onAbrirEditor, onAlternarPendencia }) {
  const navigate = useNavigate()
  const reservaPendente = atracao.precisa_reserva && atracao.status_reserva === 'pendente'
  const criadorNome = atracao.profiles?.nome

  function handleResolverPendencia(e) {
    e.stopPropagation()
    if (pendenciaRelacionada.link) {
      window.open(pendenciaRelacionada.link, '_blank', 'noopener,noreferrer')
    } else {
      onAlternarPendencia?.(pendenciaRelacionada.id, true)
    }
  }

  return (
    <button
      onClick={() => onAbrirEditor(atracao)}
      className={`tap-scale w-full flex flex-col gap-2 py-3 px-4 border-b border-separator last:border-b-0 text-left ${reservaPendente ? 'bg-red/[0.06] border-l-4 border-l-red' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[18px] flex-shrink-0 ${CORES[atracao.categoria] ?? CORES.outro}`}>
          <Icone categoria={atracao.categoria} className="w-[22px] h-[22px]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[16px] truncate">{atracao.nome}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {atracao.horario_previsto && (
              <span className="text-[13px] text-muted tabular-nums">{atracao.horario_previsto.slice(0, 5)}</span>
            )}
            {atracao.custo_estimado_eur > 0 ? (
              <span className="text-[13px] text-muted tabular-nums">~€{atracao.custo_estimado_eur}</span>
            ) : (
              <span className="text-[13px] text-muted">gratuito</span>
            )}
            {atracao.ocupa_dia_inteiro && (
              <span className="text-[12px] font-semibold text-orange bg-orange/15 border border-orange/30 px-2 py-0.5 rounded-full">
                dia inteiro
              </span>
            )}
            {criadorNome && (
              <span className="text-[12px] font-semibold text-indigo bg-indigo/15 border border-indigo/30 px-2 py-0.5 rounded-full">
                {criadorNome}
              </span>
            )}
          </div>
        </div>
        {atracao.latitude && (
          <span
            onClick={(e) => {
              e.stopPropagation()
              abrirNoMaps(atracao.latitude, atracao.longitude, atracao.nome)
            }}
            className="tap-scale text-blue text-[13px] font-semibold px-3 py-1.5 rounded-full bg-blue/10 flex-shrink-0"
          >
            Maps
          </span>
        )}
      </div>

      {reservaPendente && (
        <div className="flex items-center justify-between pl-[52px] -mt-1">
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-red bg-red/15 border border-red/30 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3.5 h-3.5" /> Reserva pendente
          </span>
          {pendenciaRelacionada && (
            <span onClick={handleResolverPendencia} className="tap-scale text-[12px] font-semibold text-white bg-red px-2.5 py-1 rounded-full">
              Resolver ›
            </span>
          )}
        </div>
      )}
      {atracao.precisa_reserva && atracao.status_reserva !== 'pendente' && (
        <div className="pl-[52px] -mt-1">
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-green bg-green/15 border border-green/30 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> Reservado
          </span>
        </div>
      )}
      {atracao.notas && (
        <p className="text-[13px] text-muted pl-[52px] -mt-1 italic truncate">"{atracao.notas}"</p>
      )}
    </button>
  )
}
