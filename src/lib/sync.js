import { useEffect } from 'react'

// Sincroniza instâncias do mesmo hook entre componentes:
// quem muta emite, todas as instâncias montadas recarregam.
export function emitirSync(tabela) {
  window.dispatchEvent(new CustomEvent(`sync:${tabela}`))
}

export function useSyncListener(tabela, recarregar) {
  useEffect(() => {
    const handler = () => recarregar()
    window.addEventListener(`sync:${tabela}`, handler)
    return () => window.removeEventListener(`sync:${tabela}`, handler)
  }, [tabela, recarregar])
}
