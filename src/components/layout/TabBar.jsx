import { NavLink } from 'react-router-dom'

function IconHoje({ active }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2L4 9v11a1 1 0 001 1h5v-7h4v7h5a1 1 0 001-1V9l-8-7z"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}
function IconRoteiro({ active }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="17" rx="3" stroke="currentColor" strokeWidth="1.8" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0} />
      <path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
function IconAtracoes({ active }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 8a2 2 0 100-4 2 2 0 000 4zM5 8v12M19 8a2 2 0 100-4 2 2 0 000 4zM19 8v12M5 20h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.8" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0} />
    </svg>
  )
}
function IconFinancas({ active }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="6" width="20" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.8" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0} />
      <circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}
function IconPendencias({ active }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 12l2 2 4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0} />
    </svg>
  )
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
