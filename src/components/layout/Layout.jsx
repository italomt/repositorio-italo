import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import TabBar from './TabBar'
import ThemeSheet from '../ui/ThemeSheet'
import { usePendencias } from '../../hooks/usePendencias'
import { User } from 'lucide-react'

export default function Layout({ children }) {
  const { totalPendentes } = usePendencias()
  const [themeSheetAberto, setThemeSheetAberto] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className="min-h-dvh flex flex-col max-w-md mx-auto bg-bg relative">
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% 0%, var(--blue) 0%, transparent 70%)',
        opacity: 0.03,
      }} />
      {isHome && (
        <button
          onClick={() => setThemeSheetAberto(true)}
          className="tap-scale fixed top-[max(14px,env(safe-area-inset-top))] right-4 z-30 w-9 h-9 rounded-full bg-fill backdrop-blur-xl flex items-center justify-center"
          aria-label="Conta"
        >
          <User className="w-5 h-5" />
        </button>
      )}

      <main id="main-scroll" className="flex-1 pb-24 px-4 pt-[max(16px,env(safe-area-inset-top))] overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      <TabBar totalPendentes={totalPendentes} />

      <ThemeSheet
        aberto={themeSheetAberto}
        onClose={() => setThemeSheetAberto(false)}
      />
    </div>
  )
}
