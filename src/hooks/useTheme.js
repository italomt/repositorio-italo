import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'europa-trip-theme'

function aplicarTema(tema) {
  if (tema === 'system') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', tema)
  }
}

export function useTheme() {
  const [tema, setTemaState] = useState(() => localStorage.getItem(STORAGE_KEY) ?? 'system')

  useEffect(() => {
    aplicarTema(tema)
  }, [tema])

  const setTema = useCallback((novoTema) => {
    localStorage.setItem(STORAGE_KEY, novoTema)
    setTemaState(novoTema)
  }, [])

  return { tema, setTema }
}
