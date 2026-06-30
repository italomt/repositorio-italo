import Modal from './Modal'
import { useAuthContext } from '../../contexts/AuthContext'
import { APP_VERSION } from '../../lib/version'

export default function ThemeSheet({ aberto, onClose }) {
  const { profile, sair } = useAuthContext()

  return (
    <Modal aberto={aberto} onClose={onClose} titulo="Conta">
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
            <span className="ml-auto text-[11px] text-muted2 font-mono">{APP_VERSION}</span>
          </div>
        )}

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
