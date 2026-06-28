import Modal from './Modal'
import { useAuthContext } from '../../contexts/AuthContext'
import { Settings, Sun, Moon, Check } from 'lucide-react'

const OPCOES = [
  { id: 'system', label: 'Automático (sistema)', icon: Settings },
  { id: 'light', label: 'Claro', icon: Sun },
  { id: 'dark', label: 'Escuro', icon: Moon },
]

export default function ThemeSheet({ aberto, onClose, tema, onSelecionar }) {
  const { profile, sair } = useAuthContext()

  return (
    <Modal aberto={aberto} onClose={onClose} titulo="Configurações">
      <div className="space-y-1">
        {profile && (
          <div className="flex items-center gap-3 px-3 pb-3 border-b border-separator mb-2">
            <div className="w-10 h-10 rounded-full bg-blue text-white flex items-center justify-center font-semibold text-[16px]">
              {profile.nome?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="font-semibold text-[15px]">{profile.nome}</p>
              <p className="text-muted text-[13px]">Logado</p>
            </div>
          </div>
        )}

        <p className="text-[12px] text-muted font-semibold uppercase tracking-wide px-3 mb-1">Aparência</p>
        {OPCOES.map((opcao) => (
          <button
            key={opcao.id}
            onClick={() => {
              onSelecionar(opcao.id)
              onClose()
            }}
            className="tap-scale w-full flex items-center gap-3 py-3 px-3 rounded-ios"
          >
            {opcao.icon ? <opcao.icon className="w-5 h-5" /> : null}
            <span className="flex-1 text-left text-[16px] font-medium">{opcao.label}</span>
            {tema === opcao.id && <Check className="w-5 h-5 text-blue" />}
          </button>
        ))}

        <button
          onClick={() => {
            sair()
            onClose()
          }}
          className="tap-scale w-full text-red text-[15px] font-semibold py-3 mt-2"
        >
          Sair da conta
        </button>
      </div>
    </Modal>
  )
}
