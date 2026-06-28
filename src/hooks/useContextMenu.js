import { useCallback, useEffect, useState } from 'react'

export function useContextMenu() {
  const [menu, setMenu] = useState(null)

  const abrir = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setMenu({ x: e.clientX, y: e.clientY })
  }, [])

  const fechar = useCallback(() => setMenu(null), [])

  useEffect(() => {
    if (!menu) return
    const handler = () => fechar()
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [menu, fechar])

  return { menu, abrir, fechar }
}
