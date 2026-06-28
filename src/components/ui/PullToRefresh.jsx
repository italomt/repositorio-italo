import { useState, useRef, useEffect, useCallback } from 'react'
import { Loader2, ArrowDown } from 'lucide-react'

export default function PullToRefresh({ onRefresh, children }) {
  const [state, setState] = useState('idle')
  const [pullDistance, setPullDistance] = useState(0)
  const startY = useRef(0)
  const movendo = useRef(false)

  const THRESHOLD = 70

  const handleRefresh = useCallback(async () => {
    setState('refreshing')
    try {
      await onRefresh()
    } catch {
      //
    }
    setState('idle')
    setPullDistance(0)
  }, [onRefresh])

  useEffect(() => {
    const scrollable = document.getElementById('main-scroll')
    if (!scrollable) return

    function handleTouchStart(e) {
      if (scrollable.scrollTop > 0 || state === 'refreshing') return
      startY.current = e.touches[0].clientY
      movendo.current = false
    }

    function handleTouchMove(e) {
      if (state === 'refreshing') return
      const diff = e.touches[0].clientY - startY.current
      if (diff <= 0 || scrollable.scrollTop > 0) {
        setPullDistance(0)
        return
      }
      movendo.current = true
      const distancia = Math.min(diff * 0.45, 130)
      setPullDistance(distancia)
      setState(distancia >= THRESHOLD ? 'pronto' : 'puxando')
    }

    function handleTouchEnd() {
      if (!movendo.current) return
      movendo.current = false
      if (state === 'pronto') {
        handleRefresh()
      } else {
        setState('idle')
        setPullDistance(0)
      }
    }

    scrollable.addEventListener('touchstart', handleTouchStart, { passive: true })
    scrollable.addEventListener('touchmove', handleTouchMove, { passive: true })
    scrollable.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      scrollable.removeEventListener('touchstart', handleTouchStart)
      scrollable.removeEventListener('touchmove', handleTouchMove)
      scrollable.removeEventListener('touchend', handleTouchEnd)
    }
  }, [state, handleRefresh])

  return (
    <div className="relative min-h-[60dvh]">
      <div
        className="absolute left-0 right-0 flex flex-col items-center justify-center pointer-events-none z-10 transition-opacity duration-150"
        style={{
          top: 0,
          height: `${pullDistance}px`,
          opacity: pullDistance > 0 ? 1 : 0,
        }}
      >
        {state === 'refreshing' ? (
          <Loader2 className="w-6 h-6 text-blue animate-spin" />
        ) : state === 'pronto' ? (
          <div className="flex flex-col items-center gap-1">
            <ArrowDown className="w-5 h-5 text-blue rotate-180" />
            <span className="text-[12px] font-semibold text-blue">Solte para atualizar</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <ArrowDown className="w-5 h-5 text-muted2" style={{ opacity: Math.min(pullDistance / THRESHOLD, 1) }} />
            <span className="text-[12px] font-medium text-muted2">Puxe para atualizar</span>
          </div>
        )}
      </div>

      <div
        className="transition-transform duration-150 ease-out"
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        {children}
      </div>
    </div>
  )
}
