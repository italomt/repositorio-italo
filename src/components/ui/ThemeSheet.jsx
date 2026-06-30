import { useState } from 'react'
import Modal from './Modal'
import { useAuthContext } from '../../contexts/AuthContext'
import { useViagem } from '../../hooks/useViagem'
import { APP_VERSION } from '../../lib/version'
import { Share2, Copy, Check, Users } from 'lucide-react'

function gerarCodigo() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export default function ThemeSheet({ aberto, onClose }) {
  const { profile, sair } = useAuthContext()
  const { viagem } = useViagem()
  const [mostrarShare, setMostrarShare] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const codigo = viagem?.codigo_convite
  const linkConvite = codigo ? `${window.location.origin}?convite=${codigo}` : ''

  function handleCopiarLink() {
    navigator.clipboard?.writeText(linkConvite)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  function handleCopiarCodigo() {
    navigator.clipboard?.writeText(codigo)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  function handleCompartilharNativo() {
    if (navigator.share) {
      navigator.share({
        title: `Viagem: ${viagem?.nome}`,
        text: `Entre na minha viagem "${viagem?.nome}" no Europa Trip! Código: ${codigo}`,
        url: linkConvite,
      }).catch(() => {})
    }
  }

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

        {/* Compartilhar viagem */}
        {viagem && (
          <div className="border-b border-separator pb-2 mb-2">
            <button
              onClick={() => setMostrarShare(!mostrarShare)}
              className="tap-scale w-full flex items-center gap-3 px-3 py-3 text-left"
            >
              <div className="w-10 h-10 rounded-full bg-blue/10 flex items-center justify-center">
                <Share2 className="w-5 h-5 text-blue" />
              </div>
              <div>
                <p className="font-semibold text-[15px]">Compartilhar viagem</p>
                <p className="text-muted text-[13px]">{viagem.nome}</p>
              </div>
            </button>

            {mostrarShare && (
              <div className="px-3 pt-2 pb-3 space-y-3">
                <div className="bg-fill rounded-ios p-3">
                  <p className="text-[12px] text-muted font-semibold uppercase tracking-wide mb-2">Código da viagem</p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[24px] font-bold tracking-[4px] text-blue">{codigo}</span>
                    <button onClick={handleCopiarCodigo} className="tap-scale ml-auto px-3 py-2 rounded-ios bg-blue text-white text-[13px] font-semibold flex items-center gap-1">
                      {copiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiado ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                </div>

                <div className="bg-fill rounded-ios p-3">
                  <p className="text-[12px] text-muted font-semibold uppercase tracking-wide mb-2">Link de convite</p>
                  <p className="text-[13px] text-muted break-all mb-2 font-mono">{linkConvite}</p>
                  <button onClick={handleCopiarLink} className="tap-scale w-full py-2.5 rounded-ios bg-blue text-white text-[14px] font-semibold">
                    Copiar link
                  </button>
                </div>

                {navigator.share && (
                  <button onClick={handleCompartilharNativo} className="tap-scale w-full flex items-center justify-center gap-2 py-3 rounded-ios bg-fill text-text text-[14px] font-semibold">
                    <Share2 className="w-4 h-4" /> Compartilhar via...
                  </button>
                )}

                <p className="text-[12px] text-muted text-center">
                  Envie o código ou link. A pessoa entra na mesma viagem que você.
                </p>
              </div>
            )}
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
