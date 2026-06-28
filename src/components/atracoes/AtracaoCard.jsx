import { abrirNoMaps } from '../../lib/maps'
import { AlertTriangle, CheckCircle2, Landmark, UtensilsCrossed, Music, ShoppingBag, TreePine, Palmtree, Sparkles, MapPin, Clock } from 'lucide-react'
import { formatarDistancia, estimarTempoCaminhada, distanciaKm } from '../../lib/geo'

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

const LABEL_CATEGORIA = {
  museu: 'Museu',
  gastronomia: 'Gastronomia',
  balada: 'Balada',
  compras: 'Compras',
  natureza: 'Natureza',
  cultura: 'Cultura',
  lazer: 'Lazer',
  outro: 'Outro',
}

function Icone({ categoria, className = 'w-5 h-5' }) {
  const Icon = ICONES[categoria] ?? MapPin
  return <Icon className={className} />
}

export default function AtracaoCard({ atracao, numero, pendenciaRelacionada, onAbrirEditor, onAlternarPendencia }) {
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
      className={`tap-scale w-full flex flex-col gap-1.5 py-3 px-4 text-left ${reservaPendente ? 'bg-red/[0.04]' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-blue flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-white text-[13px] font-bold tabular-nums">{numero}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[16px] leading-tight truncate">{atracao.nome}</p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-[11px] font-medium text-muted2 bg-fill px-2 py-0.5 rounded-full border border-border capitalize">
              {LABEL_CATEGORIA[atracao.categoria] ?? atracao.categoria}
            </span>
            {atracao.horario_previsto && (
              <span className="text-[12px] text-muted tabular-nums flex items-center gap-0.5">
                <Clock className="w-3 h-3" /> {atracao.horario_previsto.slice(0, 5)}
              </span>
            )}
            {atracao.custo_estimado_eur > 0 ? (
              <span className="text-[12px] text-muted tabular-nums">~€{atracao.custo_estimado_eur}</span>
            ) : atracao.custo_estimado_eur === 0 ? (
              <span className="text-[12px] text-muted">gratuito</span>
            ) : null}
          </div>
        </div>

        {atracao.foto_url ? (
          <div className="w-[62px] h-[62px] rounded-xl overflow-hidden flex-shrink-0 bg-fill border border-border">
            <img src={atracao.foto_url} alt="" className="w-full h-full object-cover" loading="lazy" />
          </div>
        ) : (
          atracao.latitude && (
            <span
              onClick={(e) => {
                e.stopPropagation()
                abrirNoMaps(atracao.latitude, atracao.longitude, atracao.nome)
              }}
              className="tap-scale text-blue text-[12px] font-semibold px-2.5 py-1.5 rounded-full bg-blue/10 flex-shrink-0 self-start mt-1"
            >
              <MapPin className="w-3.5 h-3.5 inline mr-0.5" />Maps
            </span>
          )
        )}
      </div>

      <div className="flex items-center gap-1.5 pl-11 flex-wrap">
        {atracao.ocupa_dia_inteiro && (
          <span className="text-[11px] font-semibold text-orange bg-orange/15 border border-orange/30 px-2 py-0.5 rounded-full">
            dia inteiro
          </span>
        )}
        {criadorNome && (
          <span className="text-[11px] font-semibold text-indigo bg-indigo/15 border border-indigo/30 px-2 py-0.5 rounded-full">
            {criadorNome}
          </span>
        )}
        {reservaPendente && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red bg-red/15 border border-red/30 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3" /> Reserva pendente
          </span>
        )}
        {atracao.precisa_reserva && atracao.status_reserva !== 'pendente' && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green bg-green/15 border border-green/30 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" /> Reservado
          </span>
        )}
      </div>

      {atracao.notas && (
        <p className="text-[12px] text-muted pl-11 italic leading-tight truncate">"{atracao.notas}"</p>
      )}

      {reservaPendente && pendenciaRelacionada && (
        <div className="pl-11">
          <span onClick={handleResolverPendencia} className="tap-scale inline-flex items-center gap-1 text-[12px] font-semibold text-white bg-red px-2.5 py-1 rounded-full">
            Resolver ›
          </span>
        </div>
      )}
    </button>
  )
}
