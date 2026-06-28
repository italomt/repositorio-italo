import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import TabBar from './TabBar'
import ThemeSheet from '../ui/ThemeSheet'
import { usePendencias } from '../../hooks/usePendencias'
import { User } from 'lucide-react'

const pageTransition = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.18, ease: [0.25, 0.1, 0.25, 1] } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.12, ease: [0.25, 0.1, 0.25, 1] } },
}

function usePrefersReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(
    typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e) => setPrefersReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return prefersReduced
}

export default function Layout({ children }) {
  const { totalPendentes } = usePendencias()
  const [themeSheetAberto, setThemeSheetAberto] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/'
  const prefersReduced = usePrefersReducedMotion()

  useEffect(() => {
    const el = document.getElementById('main-scroll')
    if (el) el.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <div className="min-h-dvh flex flex-col max-w-md mx-auto bg-bg relative">
      <a href="#main-scroll" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-card focus:text-text focus:rounded-ios focus:shadow-ios focus:outline-none">
        Pular para o conteúdo
      </a>
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% 0%, var(--blue) 0%, transparent 70%)',
        opacity: 0.03,
      }} />
      {isHome && (
        <button
          onClick={() => setThemeSheetAberto(true)}
          className="tap-scale fixed top-[max(14px,env(safe-area-inset-top))] right-4 z-30 w-11 h-11 rounded-full bg-fill backdrop-blur-xl flex items-center justify-center"
          aria-label="Conta"
        >
          <User className="w-5 h-5" />
        </button>
      )}

      <main id="main-scroll" className="flex-1 pb-24 px-4 pt-[max(16px,env(safe-area-inset-top))] overflow-y-auto">
        <AnimatePresence mode="wait">
          {prefersReduced ? (
            <div key={location.pathname}>{children}</div>
          ) : (
            <motion.div
              key={location.pathname}
              variants={pageTransition}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {children}
            </motion.div>
          )}
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
