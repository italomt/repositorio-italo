import { useState } from 'react'
import Button from '../ui/Button'
import { Luggage } from 'lucide-react'

export default function LoginScreen({ onEntrar, onCadastrar }) {
  const [modoCadastro, setModoCadastro] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState(null)
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit() {
    setErro(null)
    if (!email || !senha || (modoCadastro && !nome)) {
      setErro('Preencha todos os campos.')
      return
    }
    setCarregando(true)
    const { error } = modoCadastro ? await onCadastrar(email, senha, nome) : await onEntrar(email, senha)
    setCarregando(false)
    if (error) setErro(error.message)
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Luggage className="w-12 h-12 mb-3 text-blue" />
          <h1 className="font-display text-[28px] font-bold tracking-tight">Europa Trip</h1>
          <p className="text-muted text-[15px] mt-1">
            {modoCadastro ? 'Crie sua conta para entrar na viagem' : 'Entre para ver o roteiro do grupo'}
          </p>
        </div>

        <div className="space-y-3">
          {modoCadastro && (
            <div>
              <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Nome</label>
              <input
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] placeholder:text-muted mt-1"
              />
            </div>
          )}
          <div>
            <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">E-mail</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] placeholder:text-muted mt-1"
              autoCapitalize="none"
            />
          </div>
          <div>
            <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Senha</label>
            <input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] placeholder:text-muted mt-1"
            />
          </div>

          {erro && <p className="text-red text-[13px] text-center">{erro}</p>}

          <Button className="w-full" onClick={handleSubmit} disabled={carregando}>
            {carregando ? 'Aguarde...' : modoCadastro ? 'Criar conta' : 'Entrar'}
          </Button>

          <button
            onClick={() => {
              setModoCadastro((v) => !v)
              setErro(null)
            }}
            className="tap-scale w-full text-blue text-[14px] font-medium text-center py-2"
          >
            {modoCadastro ? 'Já tenho conta — entrar' : 'Não tenho conta — criar'}
          </button>
        </div>
      </div>
    </div>
  )
}
