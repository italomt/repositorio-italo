import { createContext, useContext, useCallback, useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

const ToastContext = createContext()

export function useToast() {
  return useContext(ToastContext)
}

const ICONES = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
}

const CORES = {
  success: { bg: 'bg-green/15 border-green/40', icon: 'text-green' },
  error: { bg: 'bg-red/15 border-red/40', icon: 'text-red' },
  info: { bg: 'bg-blue/15 border-blue/40', icon: 'text-blue' },
}

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timeoutsRef = useRef({})

  const addToast = useCallback((message, type = 'success', duration = 3200, action = null) => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, message, type, action }])
    timeoutsRef.current[id] = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
      delete timeoutsRef.current[id]
    }, action ? Math.max(duration, 6000) : duration)
    return id
  }, [])

  const removerToast = useCallback((id) => {
    clearTimeout(timeoutsRef.current[id])
    delete timeoutsRef.current[id]
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed top-[max(20px,env(safe-area-inset-top))] left-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = ICONES[toast.type]
            const cores = CORES[toast.type]
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-ios-lg border shadow-ios backdrop-blur-xl bg-card ${cores.bg}`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${cores.icon}`} />
                <span className="text-[14px] font-medium text-text flex-1">{toast.message}</span>
                {toast.action && (
                  <button
                    onClick={() => { toast.action(); removerToast(toast.id) }}
                    className="tap-scale text-[13px] font-bold text-blue flex-shrink-0 px-2 py-1 rounded-lg hover:bg-blue/10"
                  >
                    {toast.action.label}
                  </button>
                )}
                <button
                  onClick={() => removerToast(toast.id)}
                  className="tap-scale w-6 h-6 rounded-full bg-fill flex items-center justify-center text-muted flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
