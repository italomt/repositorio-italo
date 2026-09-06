import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

export default function FABAssistente() {
  const navigate = useNavigate()
  const [wizardVisivel, setWizardVisivel] = useState(false)

  useEffect(() => {
    const handler = (e) => setWizardVisivel(e.detail)
    window.addEventListener('wizard-visivel', handler)
    return () => window.removeEventListener('wizard-visivel', handler)
  }, [])

  if (wizardVisivel) return null

  return (
    <button
      onClick={() => navigate('/assistente')}
      aria-label="Abrir assistente"
      className="fixed right-4 z-30 w-14 h-14 rounded-full text-white shadow-lg flex items-center justify-center tap-scale"
      // Empilhado sobre o FAB de adicionar (76px) + altura dele (56px) + respiro.
      style={{
        bottom: 'calc(144px + env(safe-area-inset-bottom, 0px))',
        background: 'linear-gradient(140deg, var(--purple), var(--blue))',
      }}
    >
      <Sparkles className="w-6 h-6" />
    </button>
  )
}
