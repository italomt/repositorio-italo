import { lazy, Suspense, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/layout/Layout'
import LoginScreen from './components/auth/LoginScreen'
import { AuthProvider, useAuthContext } from './contexts/AuthContext'
import { ViagemProvider, useViagem } from './contexts/ViagemContext'
import { SkeletonCard } from './components/ui/Skeleton'
import { supabase } from './lib/supabase'
import { capturePageview } from './lib/posthog'
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'

const Hoje = lazy(() => import('./pages/Hoje'))
const Viagem = lazy(() => import('./pages/Viagem'))
const EditarViagem = lazy(() => import('./pages/EditarViagem'))
const CidadeDetail = lazy(() => import('./pages/CidadeDetail'))
const DayDetail = lazy(() => import('./pages/DayDetail'))
const Financas = lazy(() => import('./pages/Financas'))
const Pendencias = lazy(() => import('./pages/Pendencias'))
const Mais = lazy(() => import('./pages/Mais'))

function ConviteHandler({ children }) {
  const { session } = useAuthContext()
  const { recarregar } = useViagem()
  const [status, setStatus] = useState('idle') // idle | processando | sucesso | erro
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const codigo = params.get('convite')
    if (!codigo || !session) return

    setStatus('processando')

    async function aceitarConvite() {
      // RPC valida o código e já cuida do vínculo (security definer) — não dá
      // pra entrar numa viagem sem um código válido.
      const { data, error } = await supabase.rpc('entrar_em_viagem_por_codigo', { p_codigo: codigo })
      const viagem = data?.[0]

      if (error || !viagem) {
        setStatus('erro')
        setMensagem('Código de convite inválido ou expirado.')
        return
      }

      localStorage.setItem('active_viagem_id', viagem.id)
      // O <ViagemProvider> já buscou as viagens do usuário ao montar, em paralelo
      // com esta RPC — antes do vínculo existir. Sem recarregar aqui, a viagem
      // recém-aceita fica de fora da lista e a tela não troca pra ela.
      await recarregar(viagem.id)
      setStatus('sucesso')
      setMensagem(viagem.ja_membro ? `Você já está em "${viagem.nome}"` : `Você entrou em "${viagem.nome}"!`)

      // Remove ?convite da URL
      const url = new URL(window.location)
      url.searchParams.delete('convite')
      window.history.replaceState({}, '', url)
    }

    aceitarConvite()
  }, [session])

  if (status === 'processando') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 space-y-4">
        <Loader2 className="w-10 h-10 text-blue animate-spin" />
        <p className="text-muted text-[15px]">Entrando na viagem...</p>
      </div>
    )
  }

  if (status === 'erro') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 space-y-4">
        <AlertTriangle className="w-10 h-10 text-red" />
        <p className="text-[15px] text-red font-medium">{mensagem}</p>
        <button onClick={() => setStatus('idle')} className="tap-scale px-6 py-2.5 rounded-ios bg-fill text-text font-semibold text-[14px]">
          Fechar
        </button>
      </div>
    )
  }

  if (status === 'sucesso') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 space-y-4">
        <CheckCircle className="w-10 h-10 text-green" />
        <p className="text-[15px] text-green font-medium">{mensagem}</p>
        <button onClick={() => setStatus('idle')} className="tap-scale px-6 py-2.5 rounded-ios bg-blue text-white font-semibold text-[14px]">
          Começar a usar
        </button>
      </div>
    )
  }

  return children
}

function AppRoutes() {
  const { session, loading, entrar, cadastrar } = useAuthContext()

  if (loading) return null

  if (!session) {
    return <LoginScreen onEntrar={entrar} onCadastrar={cadastrar} />
  }

  return (
    <ViagemProvider>
      <Layout>
        <ConviteHandler>
          <Suspense fallback={<div className="p-4 space-y-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>}>
            <Routes>
              <Route path="/" element={<Hoje />} />
              <Route path="/viagem" element={<Viagem />} />
              <Route path="/viagem/editar" element={<EditarViagem />} />
              <Route path="/viagem/cidade/:cidadeId" element={<CidadeDetail />} />
              <Route path="/viagem/dia/:destinoId" element={<DayDetail />} />
              <Route path="/financas" element={<Financas />} />
              <Route path="/pendencias" element={<Pendencias />} />
              <Route path="/mais" element={<Mais />} />
              <Route path="/documentos" element={<Navigate to="/mais" replace />} />
            </Routes>
          </Suspense>
        </ConviteHandler>
      </Layout>
    </ViagemProvider>
  )
}

function PostHogPageviewTracker() {
  const location = useLocation()
  useEffect(() => {
    capturePageview()
  }, [location.pathname, location.search, location.hash])
  return null
}

export default function App() {
  return (
    <AuthProvider>
      <PostHogPageviewTracker />
      <AppRoutes />
    </AuthProvider>
  )
}
