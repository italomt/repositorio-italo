import { Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import LoginScreen from './components/auth/LoginScreen'
import Hoje from './pages/Hoje'
import Roteiro from './pages/Roteiro'
import Atracoes from './pages/Atracoes'
import Financas from './pages/Financas'
import Pendencias from './pages/Pendencias'
import Documentos from './pages/Documentos'
import { AuthProvider, useAuthContext } from './contexts/AuthContext'

function AppRoutes() {
  const { session, loading, entrar, cadastrar } = useAuthContext()

  if (loading) return null

  if (!session) {
    return <LoginScreen onEntrar={entrar} onCadastrar={cadastrar} />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Hoje />} />
        <Route path="/roteiro" element={<Roteiro />} />
        <Route path="/atracoes" element={<Atracoes />} />
        <Route path="/financas" element={<Financas />} />
        <Route path="/pendencias" element={<Pendencias />} />
        <Route path="/documentos" element={<Documentos />} />
      </Routes>
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
