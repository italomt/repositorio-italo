import { useEffect, useRef, useState } from 'react'

export default function Modal({ aberto, onClose, titulo, children, className = '' }) {
  const overlayRef = useRef(null)
  const [overlayStyle, setOverlayStyle] = useState({})

  useEffect(() => {
    if (!aberto || !window.visualViewport) return

    const vv = window.visualViewport

    function atualizar() {
      setOverlayStyle({
        height: `${vv.height}px`,
        top: `${vv.offsetTop}px`,
      })
    }

    atualizar()
    vv.addEventListener('resize', atualizar)
    vv.addEventListener('scroll', atualizar)
    return () => {
      vv.removeEventListener('resize', atualizar)
      vv.removeEventListener('scroll', atualizar)
    }
  }, [aberto])

  if (!aberto) return null

  function handleFocusIn(e) {
    const tag = e.target.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
      setTimeout(() => {
        e.target.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }, 300)
    }
  }

  return (
    <div
      ref={overlayRef}
      style={overlayStyle}
      className="fixed left-0 right-0 z-50 flex items-end justify-center bg-black/40 animate-fade-in"
    >
      <div
        onFocus={handleFocusIn}
        className={`bg-card w-full sm:max-w-md sm:rounded-ios-xl rounded-t-ios-xl p-5 pb-[max(20px,env(safe-area-inset-bottom))] max-h-[90%] overflow-y-auto animate-sheet-in ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-9 h-1.5 bg-fill rounded-full mx-auto mb-4 sm:hidden" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-[20px] font-bold tracking-tight">{titulo}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-fill text-muted flex items-center justify-center text-base tap-scale"
          >
            ×
          </button>
        </div>
        {children}
      </div>
      <div className="fixed inset-0 -z-10" onClick={onClose} />
    </div>
  )
}
