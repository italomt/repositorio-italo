import { useState, useRef, useEffect, useCallback } from 'react'
import { Loader2, ArrowDown } from 'lucide-react'

// Quanto o dedo precisa percorrer pra armar o refresh. Abaixo disso o gesto e
// so um overscroll comum e nao deve recarregar nada.
const LIMIAR_PX = 90

export default function PullToRefresh({ onRefresh, children }) {
  const [state, setState] = useState('idle')
  const startY = useRef(0)
  const startX = useRef(0)
  const refreshingPromise = useRef(null)
  const stateRef = useRef(state)

  useEffect(() => { stateRef.current = state }, [state])

  const handleRefresh = useCallback(async () => {
    // A trava precisa existir ANTES do await: sem isso refreshingPromise nunca
    // era preenchido, as guardas dos handlers de toque nao seguravam nada e dava
    // pra empilhar varios refreshes concorrentes no mesmo gesto.
    if (refreshingPromise.current) return
    refreshingPromise.current = true
    setState('refreshing')
    stateRef.current = 'refreshing'
    try {
      await onRefresh()
    } catch {
      //
    }
    refreshingPromise.current = null
    setState('idle')
    stateRef.current = 'idle'
  }, [onRefresh])

  useEffect(() => {
    const scrollable = document.getElementById('main-scroll')
    if (!scrollable) return

    function deveIgnorar(e) {
      // Pinça/zoom e gestos dentro de mapas ou overlays não são pull-to-refresh
      if (e.touches.length > 1) return true
      const alvo = e.target
      return !!(alvo.closest && (alvo.closest('.gm-style') || alvo.closest('[data-no-ptr]') || alvo.closest('.fixed')))
    }

    function handleTouchStart(e) {
      if (scrollable.scrollTop > 0 || refreshingPromise.current || deveIgnorar(e)) { startY.current = null; return }
      startY.current = e.touches[0].clientY
      startX.current = e.touches[0].clientX
    }

    function handleTouchMove(e) {
      if (scrollable.scrollTop > 0 || refreshingPromise.current || startY.current == null || deveIgnorar(e)) {
        if (stateRef.current !== 'idle' && stateRef.current !== 'refreshing') { setState('idle'); stateRef.current = 'idle' }
        return
      }
      const diff = e.touches[0].clientY - startY.current
      const desvioX = Math.abs(e.touches[0].clientX - (startX.current ?? 0))
      // Arrasto na diagonal (carrossel, swipe de item) nao e pull-to-refresh.
      if (desvioX > Math.abs(diff)) {
        if (stateRef.current !== 'idle' && stateRef.current !== 'refreshing') { setState('idle'); stateRef.current = 'idle' }
        return
      }
      if (diff > LIMIAR_PX) { setState('pronto'); stateRef.current = 'pronto' }
      else if (diff > 0) { setState('puxando'); stateRef.current = 'puxando' }
      else { setState('idle'); stateRef.current = 'idle' }
    }

    function handleTouchEnd() {
      if (refreshingPromise.current) return
      if (stateRef.current === 'pronto') handleRefresh()
      else { setState('idle'); stateRef.current = 'idle' }
      startY.current = null
    }

    scrollable.addEventListener('touchstart', handleTouchStart, { passive: true })
    scrollable.addEventListener('touchmove', handleTouchMove, { passive: true })
    scrollable.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      scrollable.removeEventListener('touchstart', handleTouchStart)
      scrollable.removeEventListener('touchmove', handleTouchMove)
      scrollable.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleRefresh])

  return (
    <div className="relative">
      {state !== 'idle' && (
        <div className="flex items-center justify-center py-2.5 transition-all duration-150">
          {state === 'puxando' && (
            <ArrowDown className="w-5 h-5 text-muted2" />
          )}
          {state === 'pronto' && (
            <span className="text-[12px] font-semibold text-blue">Solte para atualizar</span>
          )}
          {state === 'refreshing' && (
            <Loader2 className="w-5 h-5 text-blue animate-spin" />
          )}
        </div>
      )}
      {children}
    </div>
  )
}
