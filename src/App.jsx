import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import LoginScreen from './components/auth/LoginScreen'
import { AuthProvider, useAuthContext } from './contexts/AuthContext'
import { SkeletonCard } from './components/ui/Skeleton'

const Hoje = lazy(() => import('./pages/Hoje'))
const Roteiro = lazy(() => import('./pages/Roteiro'))
const Explorar = lazy(() => import('./pages/Explorar'))
const Financas = lazy(() => import('./pages/Financas'))
const Perfil = lazy(() => import('./pages/Perfil'))

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
          <Route path="/explorar" element={<Explorar />} />
          <Route path="/financas" element={<Financas />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/viagem" element={<Navigate to="/roteiro" replace />} />
          <Route path="/viagem/*" element={<Navigate to="/roteiro" replace />} />
          <Route path="/pendencias" element={<Navigate to="/" replace />} />
          <Route path="/mais" element={<Navigate to="/perfil" replace />} />
          <Route path="/documentos" element={<Navigate to="/perfil" replace />} />
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
