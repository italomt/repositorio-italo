import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import LoginScreen from './components/auth/LoginScreen'
import { AuthProvider, useAuthContext } from './contexts/AuthContext'
import { SkeletonCard } from './components/ui/Skeleton'

const Hoje = lazy(() => import('./pages/Hoje'))
const Viagem = lazy(() => import('./pages/Viagem'))
const CidadeDetail = lazy(() => import('./pages/CidadeDetail'))
const DayDetail = lazy(() => import('./pages/DayDetail'))
const Financas = lazy(() => import('./pages/Financas'))
const Pendencias = lazy(() => import('./pages/Pendencias'))
const Mais = lazy(() => import('./pages/Mais'))

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
          <Route path="/viagem" element={<Viagem />} />
          <Route path="/viagem/cidade/:cidadeNome" element={<CidadeDetail />} />
          <Route path="/viagem/dia/:destinoId" element={<DayDetail />} />
          <Route path="/financas" element={<Financas />} />
          <Route path="/pendencias" element={<Pendencias />} />
          <Route path="/mais" element={<Mais />} />
          <Route path="/roteiro" element={<Navigate to="/viagem" replace />} />
          <Route path="/documentos" element={<Navigate to="/mais" replace />} />
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
