import { createContext, useContext } from 'react'
import { useViagem } from '../hooks/useViagem'

const ViagemContext = createContext(null)

export function ViagemProvider({ children }) {
  const value = useViagem()
  return <ViagemContext.Provider value={value}>{children}</ViagemContext.Provider>
}

export function useViagemContext() {
  const ctx = useContext(ViagemContext)
  if (!ctx) throw new Error('useViagemContext deve ser usado dentro de ViagemProvider')
  return ctx
}
