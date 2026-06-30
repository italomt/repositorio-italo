import { NavLink } from 'react-router-dom'
import { Home, Wallet, MoreHorizontal, Luggage, ClipboardList } from 'lucide-react'
import { useViagem } from '../../hooks/useViagem'
import { usePendencias } from '../../hooks/usePendencias'

function IconHoje({ active }) {
  return <Home className={`transition-colors duration-200 ${active ? 'text-blue' : 'text-muted'}`} />
}
function IconViagem({ active }) {
  return <Luggage className={`transition-colors duration-200 ${active ? 'text-blue' : 'text-muted'}`} />
}
function IconFinancas({ active }) {
  return <Wallet className={`transition-colors duration-200 ${active ? 'text-blue' : 'text-muted'}`} />
}
function IconPendencias({ active }) {
  return <ClipboardList className={`transition-colors duration-200 ${active ? 'text-blue' : 'text-muted'}`} />
}
function IconMais({ active }) {
  return <MoreHorizontal className={`transition-colors duration-200 ${active ? 'text-blue' : 'text-muted'}`} />
}

const ABAS = [
  { to: '/', label: 'Hoje', Icon: IconHoje },
  { to: '/viagem', label: 'Viagem', Icon: IconViagem },
  { to: '/financas', label: 'Finanças', Icon: IconFinancas },
  { to: '/pendencias', label: 'Pendências', Icon: IconPendencias },
  { to: '/mais', label: 'Mais', Icon: IconMais },
]

export default function TabBar() {
  const { viagemId } = useViagem()
  const { totalPendentes } = usePendencias(viagemId)

  return (
    <nav className="fixed bottom-0 left-0 right-0 backdrop-blur-xl bg-card/80 border-t border-separator flex justify-between px-1 pb-[max(4px,env(safe-area-inset-bottom))] z-40">
      {ABAS.map((aba) => (
        <NavLink
          key={aba.to}
          to={aba.to}
          end={aba.to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-0.5 py-1.5 pt-2.5 relative text-[11px] font-medium tap-scale transition-colors duration-200 ${
              isActive ? 'text-blue' : 'text-muted'
            }`
          }
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          {({ isActive }) => (
            <>
              <aba.Icon active={isActive} />
              <span className="transition-colors duration-200">{aba.label}</span>
              <span className={`absolute bottom-0 left-[20%] right-[20%] h-[3px] rounded-full bg-blue transition-all duration-200 ${isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'}`} />
              {aba.label === 'Pendências' && totalPendentes > 0 && (
                <span role="status" aria-label={`${totalPendentes} pendências`} className="absolute -top-0.5 -right-1 bg-red text-white text-[10px] font-semibold rounded-full min-w-[17px] h-[17px] px-1 flex items-center justify-center">
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
