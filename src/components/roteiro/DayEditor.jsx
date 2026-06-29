import { useCallback, useState } from 'react'
import Modal from '../ui/Modal'
import FormFooter from '../ui/FormFooter'
import CidadeAutocomplete from '../ui/CidadeAutocomplete'

export default function DayEditor({ aberto, onClose, destino, onSalvar }) {
  const [cidade, setCidade] = useState(destino.cidade)
  const [pais, setPais] = useState(destino.pais)
  const [flagEmoji, setFlagEmoji] = useState(destino.flag_emoji ?? '')
  const [notas, setNotas] = useState(destino.notas ?? '')
  const [salvando, setSalvando] = useState(false)

  const handleSelecionarLugar = useCallback(({ cidade: c, pais: p, flagEmoji: f }) => {
    setCidade(c)
    setPais(p)
    setFlagEmoji(f)
  }, [])

  async function handleSalvar() {
    setSalvando(true)
    await onSalvar(destino.id, { cidade, pais, flag_emoji: flagEmoji, notas })
    setSalvando(false)
    onClose()
  }

  return (
    <Modal aberto={aberto} onClose={onClose} titulo={`Editar dia ${destino.data}`}>
      <div className="space-y-3">
        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Cidade</label>
          <div className="mt-1">
            <CidadeAutocomplete value={cidade} onChange={setCidade} onSelecionarLugar={handleSelecionarLugar} />
          </div>
          <p className="text-[12px] text-muted mt-1">Escolha uma opção da lista pra preencher o país automaticamente.</p>
        </div>
        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">País</label>
          <input
            value={`${flagEmoji ? flagEmoji + ' ' : ''}${pais}`.trim()}
            readOnly
            className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] text-muted mt-1"
          />
        </div>
        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Notas</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={3}
            className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] placeholder:text-muted mt-1"
          />
        </div>
        <p className="text-[12px] text-muted">
          Atenção: alterar a cidade não move as atrações já cadastradas para este dia automaticamente.
        </p>
        <FormFooter onSave={handleSalvar} saveLabel="Salvar alterações" saving={salvando} />
      </div>
    </Modal>
  )
}
