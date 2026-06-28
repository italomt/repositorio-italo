import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import LoginScreen from './components/auth/LoginScreen'
import { AuthProvider, useAuthContext } from './contexts/AuthContext'
import { SkeletonCard } from './components/ui/Skeleton'

const Hoje = lazy(() => import('./pages/Hoje'))
const Roteiro = lazy(() => import('./pages/Roteiro'))
const Atracoes = lazy(() => import('./pages/Atracoes'))
const Financas = lazy(() => import('./pages/Financas'))
const Pendencias = lazy(() => import('./pages/Pendencias'))
const Documentos = lazy(() => import('./pages/Documentos'))

function AppRoutes() {
  const { session, loading, entrar, cadastrar } = useAuthContext()

  if (loading) return null

  if (!session) {
    return <LoginScreen onEntrar={entrar} onCadastrar={cadastrar} />
  }

  return (
    <Layout>
      <Suspense fallback={<div className="p-4 space-y-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>}>
        <Routes>
          <Route path="/" element={<Hoje />} />
          <Route path="/roteiro" element={<Roteiro />} />
          <Route path="/atracoes" element={<Atracoes />} />
          <Route path="/financas" element={<Financas />} />
          <Route path="/pendencias" element={<Pendencias />} />
          <Route path="/documentos" element={<Documentos />} />
        </Routes>
      </Suspense>
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
