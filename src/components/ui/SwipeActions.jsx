import { useEffect, useRef, useState } from 'react'

const LARGURA = 80
const LIMIAR = 40

export default function SwipeActions({ children, onEdit, onDelete }) {
  const inicio = useRef(null)
  const arrastou = useRef(false)
  const [deltaX, setDeltaX] = useState(0)
  const [aberto, setAberto] = useState(null)

  useEffect(() => {
    if (!aberto) return
    function fechar() { setAberto(null); setDeltaX(0) }
    document.addEventListener('click', fechar)
    document.addEventListener('scroll', fechar, true)
    return () => {
      document.removeEventListener('click', fechar)
      document.removeEventListener('scroll', fechar, true)
    }
  }, [aberto])

  function aoIniciar(e) {
    arrastou.current = false
    inicio.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }

  function aoMover(e) {
    if (!inicio.current) return
    const dx = e.touches[0].clientX - inicio.current.x
    const dy = e.touches[0].clientY - inicio.current.y
    if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return
    if (Math.abs(dx) < Math.abs(dy)) { inicio.current = null; return }
    e.preventDefault()
    arrastou.current = true
    let novo = aberto === 'editar' ? LARGURA + dx : aberto === 'excluir' ? -LARGURA + dx : dx
    if (novo > LARGURA) novo = LARGURA
    if (novo < -LARGURA) novo = -LARGURA
    setDeltaX(novo)
  }

  function aoFinalizar() {
    inicio.current = null
    if (!arrastou.current) return
    if (deltaX > LIMIAR) { setAberto('editar'); setDeltaX(LARGURA) }
    else if (deltaX < -LIMIAR) { setAberto('excluir'); setDeltaX(-LARGURA) }
    else { setAberto(null); setDeltaX(0) }
    setTimeout(() => { arrastou.current = false }, 0)
  }

  function aoClicarAcao(tipo) {
    ;(tipo === 'editar' ? onEdit : onDelete)?.()
    setAberto(null); setDeltaX(0)
  }

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 flex">
        <button
          onClick={(e) => { e.stopPropagation(); aoClicarAcao('editar') }}
          className="flex items-center justify-center text-white font-semibold text-[14px] gap-1"
          style={{ width: LARGURA, background: '#007AFF', flexShrink: 0 }}
        >
          ✏️ Editar
        </button>
        <div className="flex-1" />
        <button
          onClick={(e) => { e.stopPropagation(); aoClicarAcao('excluir') }}
          className="flex items-center justify-center text-white font-semibold text-[14px] gap-1"
          style={{ width: LARGURA, background: '#FF3B30', flexShrink: 0 }}
        >
          🗑️ Excluir
        </button>
      </div>
      <div
        style={{
          transform: `translateX(${deltaX}px)`,
          transition: deltaX === 0 || Math.abs(deltaX) === LARGURA
            ? 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
            : 'none',
          touchAction: 'pan-y',
          position: 'relative',
          zIndex: 1,
        }}
        onTouchStart={aoIniciar}
        onTouchMove={aoMover}
        onTouchEnd={aoFinalizar}
      >
        {children}
      </div>
    </div>
  )
}
