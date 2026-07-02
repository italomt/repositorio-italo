import { useState, useEffect, useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import TabBar from './TabBar'
import FABAdicionar from './FABAdicionar'
import { useViagem } from '../../hooks/useViagem'
import { ChevronDown, Plus, Check } from 'lucide-react'

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

function TripSelector({ viagens, viagem, onSelect, onNewTrip }) {
  const [aberto, setAberto] = useState(false)

  if (viagens.length === 0) return null

  return (
    <div className="relative">
      <button
        onClick={() => setAberto(!aberto)}
        className="tap-scale flex items-center gap-1.5 px-3 py-2 rounded-full bg-fill text-text max-w-[180px]"
        aria-label="Selecionar viagem"
      >
        <span className="text-[16px] flex-shrink-0">
          {viagens[0]?.tipo === 'trabalho' ? '💼' : viagens[0]?.tipo === 'mochilao' ? '🎒' : viagens[0]?.tipo === 'familia' ? '👨‍👩‍👧‍👦' : '✈️'}
        </span>
        <span className="text-[14px] font-semibold truncate">{viagem?.nome || 'Viagem'}</span>
        <ChevronDown className={`w-4 h-4 text-muted flex-shrink-0 transition-transform ${aberto ? 'rotate-180' : ''}`} />
      </button>

      {aberto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAberto(false)} />
          <div className="absolute top-full left-0 mt-1.5 w-64 bg-card border border-separator rounded-2xl shadow-ios z-50 overflow-hidden">
            <div className="max-h-64 overflow-y-auto py-1">
              {viagens.map((v) => (
                <button
                  key={v.id}
                  onClick={() => { onSelect(v.id); setAberto(false) }}
                  className={`tap-scale w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-fill transition-colors ${
                    viagem?.id === v.id ? 'bg-blue/[0.04]' : ''
                  }`}
                >
                  <span className="text-lg flex-shrink-0">
                    {v.tipo === 'trabalho' ? '💼' : v.tipo === 'mochilao' ? '🎒' : v.tipo === 'familia' ? '👨‍👩‍👧‍👦' : '✈️'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold truncate">{v.nome}</p>
                    <p className="text-[12px] text-muted">
                      {new Date(v.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR')} → {new Date(v.data_fim + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  {viagem?.id === v.id && <Check className="w-4 h-4 text-blue flex-shrink-0" />}
                </button>
              ))}
            </div>
            <div className="border-t border-separator py-1">
              <button
                onClick={() => { setAberto(false); onNewTrip() }}
                className="tap-scale w-full flex items-center gap-3 px-4 py-3 text-left text-blue font-semibold text-[14px]"
              >
                <Plus className="w-4 h-4" />
                Nova viagem
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function Layout({ children }) {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isDetailPage = location.pathname.startsWith('/viagem/cidade') || location.pathname.startsWith('/viagem/dia')
  const prefersReduced = usePrefersReducedMotion()
  const { viagens, viagem, selecionarViagem, recarregar } = useViagem()

  useEffect(() => {
    const handler = () => recarregar()
    window.addEventListener('viagem-criada', handler)
    return () => window.removeEventListener('viagem-criada', handler)
  }, [recarregar])

  useEffect(() => {
    if (typeof history !== 'undefined' && 'scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
  }, [])

  useLayoutEffect(() => {
    const el = document.getElementById('main-scroll')
    if (el) el.scrollTop = 0
  }, [location.pathname])

  function handleEnterComplete() {
    const el = document.getElementById('main-scroll')
    if (el) el.scrollTop = 0
  }

  function handleNewTrip() {
    window.dispatchEvent(new CustomEvent('nova-viagem'))
  }

  return (
    <div className="min-h-dvh flex flex-col max-w-md mx-auto bg-bg relative">
      <a href="#main-scroll" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-card focus:text-text focus:rounded-ios focus:shadow-ios focus:outline-none">
        Pular para o conteúdo
      </a>
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% 0%, var(--blue) 0%, transparent 70%)',
        opacity: 0.03,
      }} />

      {/* Header: trip selector (left) + account (right) */}
      {viagens.length > 0 && !isDetailPage && (
        <div className="fixed top-[max(14px,env(safe-area-inset-top))] left-4 right-4 z-30 flex items-center justify-between">
          <TripSelector
            viagens={viagens}
            viagem={viagem}
            onSelect={selecionarViagem}
            onNewTrip={handleNewTrip}
          />
        </div>
      )}

      <main id="main-scroll" className={`flex-1 pb-20 px-4 overflow-y-auto ${viagens.length > 0 && !isDetailPage ? 'pt-[max(70px,env(safe-area-inset-top))]' : 'pt-[max(16px,env(safe-area-inset-top))]'}`}>
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
              onAnimationComplete={handleEnterComplete}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      {viagens.length > 0 && <TabBar />}
      {viagens.length > 0 && <FABAdicionar />}
    </div>
  )
}
