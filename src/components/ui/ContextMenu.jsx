import { useState } from 'react'

export default function ContextMenu({ menu, onFechar, itens }) {
  const [confirmando, setConfirmando] = useState(null)

  if (!menu) return null

  const x = Math.min(menu.x, window.innerWidth - 180)
  const y = Math.min(menu.y, window.innerHeight - 180)

  function handleClick(item) {
    if (item.perigoso && confirmando !== item.label) {
      setConfirmando(item.label)
      return
    }
    setConfirmando(null)
    item.onClick()
    onFechar()
  }

  return (
    <div
      className="fixed inset-0 z-50"
      onClick={onFechar}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className="absolute bg-card rounded-xl shadow-ios-lg py-1 min-w-[175px] overflow-hidden border border-separator"
        style={{ left: x, top: y }}
        onClick={(e) => e.stopPropagation()}
      >
        {itens.map((item, i) =>
          confirmando === item.label ? (
            <div key={i} className="flex items-center gap-2 px-4 py-2.5">
              <span className="text-[13px] text-muted flex-1">Tem certeza?</span>
              <button
                onClick={() => { item.onClick(); onFechar() }}
                className="text-[14px] font-semibold text-red px-2 py-1 tap-scale"
              >
                Sim
              </button>
              <button
                onClick={() => setConfirmando(null)}
                className="text-[14px] font-semibold text-blue px-2 py-1 tap-scale"
              >
                Não
              </button>
            </div>
          ) : (
            <button
              key={i}
              onClick={() => handleClick(item)}
              className={`w-full text-left px-4 py-2.5 text-[15px] font-medium flex items-center gap-3 ${
                item.perigoso ? 'text-red' : 'text-text'
              } active:bg-fill`}
            >
              {item.icone && <span className="text-[16px]">{item.icone}</span>}
              {item.label}
            </button>
          ),
        )}
      </div>
    </div>
  )
}
