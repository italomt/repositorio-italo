import { createContext, useContext } from 'react'
import { useViagemState } from '../hooks/useViagem'

const ViagemContext = createContext(null)

export function ViagemProvider({ children }) {
  const value = useViagemState()
  return <ViagemContext.Provider value={value}>{children}</ViagemContext.Provider>
}

export function useViagem() {
  const ctx = useContext(ViagemContext)
  if (!ctx) throw new Error('useViagem precisa estar dentro de <ViagemProvider>')
  return ctx
}
