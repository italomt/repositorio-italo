import { lazy, Suspense, useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import LoginScreen from './components/auth/LoginScreen'
import { AuthProvider, useAuthContext } from './contexts/AuthContext'
import { SkeletonCard } from './components/ui/Skeleton'
import { supabase } from './lib/supabase'
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'

const Hoje = lazy(() => import('./pages/Hoje'))
const Viagem = lazy(() => import('./pages/Viagem'))
const CidadeDetail = lazy(() => import('./pages/CidadeDetail'))
const DayDetail = lazy(() => import('./pages/DayDetail'))
const Financas = lazy(() => import('./pages/Financas'))
const Pendencias = lazy(() => import('./pages/Pendencias'))
const Mais = lazy(() => import('./pages/Mais'))

function ConviteHandler({ children }) {
  const { session } = useAuthContext()
  const [status, setStatus] = useState('idle') // idle | processando | sucesso | erro
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const codigo = params.get('convite')
    if (!codigo || !session) return

    setStatus('processando')

    async function aceitarConvite() {
      // Busca viagem pelo código
      // RPC enxerga a viagem mesmo sem ser membro (RLS); fallback para query direta
      let viagem = null
      const { data: rpcData, error: rpcError } = await supabase.rpc('viagem_por_convite', { codigo })
      if (!rpcError && rpcData?.length) viagem = rpcData[0]
      if (!viagem) {
        const { data } = await supabase
          .from('viagens')
          .select('id, nome')
          .eq('codigo_convite', codigo.toUpperCase())
          .maybeSingle()
        viagem = data
      }

      if (!viagem) {
        setStatus('erro')
        setMensagem('Código de convite inválido ou expirado.')
        return
      }

      // Verifica se já está na viagem
      const { data: user } = await supabase.auth.getUser()
      const { data: existente } = await supabase
        .from('usuarios_viagem')
        .select('id')
        .eq('viagem_id', viagem.id)
        .eq('usuario_id', user?.user?.id)
        .maybeSingle()

      if (existente) {
        // Já está na viagem, só troca pra ela
        await supabase.from('profiles').update({ active_viagem_id: viagem.id }).eq('id', user.user.id)
        localStorage.setItem('active_viagem_id', viagem.id)
        setStatus('sucesso')
        setMensagem(`Você já está em "${viagem.nome}"`)
        return
      }

      // Adiciona à viagem como editor
      const { error } = await supabase.from('usuarios_viagem').insert({
        viagem_id: viagem.id,
        usuario_id: user?.user?.id,
        papel: 'editor',
        status: 'aceito',
      })

      if (error) {
        setStatus('erro')
        setMensagem('Erro ao entrar na viagem.')
        return
      }

      // Torna ativa
      await supabase.from('profiles').update({ active_viagem_id: viagem.id }).eq('id', user.user.id)
      localStorage.setItem('active_viagem_id', viagem.id)

      setStatus('sucesso')
      setMensagem(`Você entrou em "${viagem.nome}"!`)

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
    <Layout>
      <ConviteHandler>
        <Suspense fallback={<div className="p-4 space-y-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>}>
          <Routes>
            <Route path="/" element={<Hoje />} />
            <Route path="/viagem" element={<Viagem />} />
            <Route path="/viagem/cidade/:cidadeNome" element={<CidadeDetail />} />
            <Route path="/viagem/dia/:destinoId" element={<DayDetail />} />
            <Route path="/financas" element={<Financas />} />
            <Route path="/pendencias" element={<Pendencias />} />
            <Route path="/mais" element={<Mais />} />
            <Route path="/documentos" element={<Navigate to="/mais" replace />} />
          </Routes>
        </Suspense>
      </ConviteHandler>
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
