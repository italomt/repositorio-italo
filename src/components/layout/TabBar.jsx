import { NavLink } from 'react-router-dom'
import { Home, CalendarDays, MapPin, Wallet, ClipboardList } from 'lucide-react'

function IconHoje({ active }) {
  return <Home className={active ? 'text-blue' : 'text-muted'} />
}
function IconRoteiro({ active }) {
  return <CalendarDays className={active ? 'text-blue' : 'text-muted'} />
}
function IconAtracoes({ active }) {
  return <MapPin className={active ? 'text-blue' : 'text-muted'} />
}
function IconFinancas({ active }) {
  return <Wallet className={active ? 'text-blue' : 'text-muted'} />
}
function IconPendencias({ active }) {
  return <ClipboardList className={active ? 'text-blue' : 'text-muted'} />
}

const ABAS = [
  { to: '/', label: 'Hoje', Icon: IconHoje },
  { to: '/roteiro', label: 'Roteiro', Icon: IconRoteiro },
  { to: '/atracoes', label: 'Atrações', Icon: IconAtracoes },
  { to: '/financas', label: 'Finanças', Icon: IconFinancas },
  { to: '/pendencias', label: 'Pendências', Icon: IconPendencias },
]

export default function TabBar({ totalPendentes = 0 }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 backdrop-blur-xl bg-card/80 border-t border-separator flex justify-between px-1 pb-[max(4px,env(safe-area-inset-bottom))] z-40">
      {ABAS.map((aba) => (
        <NavLink
          key={aba.to}
          to={aba.to}
          end={aba.to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-0.5 py-1.5 pt-2.5 relative text-[11px] font-medium tap-scale ${
              isActive ? 'text-blue' : 'text-muted'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <aba.Icon active={isActive} />
              <span>{aba.label}</span>
              {aba.label === 'Pendências' && totalPendentes > 0 && (
                <span className="absolute top-0.5 right-[18%] bg-red text-white text-[10px] font-semibold rounded-full min-w-[17px] h-[17px] px-1 flex items-center justify-center">
                  {totalPendentes}
                </span>
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
