import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import TabBar from './TabBar'
import ThemeSheet from '../ui/ThemeSheet'
import { usePendencias } from '../../hooks/usePendencias'
import { useTheme } from '../../hooks/useTheme'

export default function Layout({ children }) {
  const { totalPendentes } = usePendencias()
  const { tema, setTema } = useTheme()
  const [themeSheetAberto, setThemeSheetAberto] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-bg">
      {isHome && (
        <button
          onClick={() => setThemeSheetAberto(true)}
          className="tap-scale fixed top-[max(14px,env(safe-area-inset-top))] right-4 z-30 w-9 h-9 rounded-full bg-fill backdrop-blur-xl flex items-center justify-center text-[16px]"
          aria-label="Aparência"
        >
          ⚙️
        </button>
      )}

      <main className="flex-1 pb-24 px-4 pt-[max(16px,env(safe-area-inset-top))]">{children}</main>
      <TabBar totalPendentes={totalPendentes} />

      <ThemeSheet
        aberto={themeSheetAberto}
        onClose={() => setThemeSheetAberto(false)}
        tema={tema}
        onSelecionar={setTema}
      />
    </div>
  )
}
