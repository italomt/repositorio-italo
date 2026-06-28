import { useCallback, useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import CidadeAutocomplete from '../ui/CidadeAutocomplete'
import { AlertTriangle } from 'lucide-react'

export default function DayAdder({ aberto, onClose, onSalvar }) {
  const [data, setData] = useState('')
  const [cidade, setCidade] = useState('')
  const [pais, setPais] = useState('')
  const [flagEmoji, setFlagEmoji] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)

  const handleSelecionarLugar = useCallback(({ cidade: c, pais: p, flagEmoji: f }) => {
    setCidade(c)
    setPais(p)
    setFlagEmoji(f)
  }, [])

  function fecharTudo() {
    setData('')
    setCidade('')
    setPais('')
    setFlagEmoji('')
    setErro(null)
    onClose()
  }

  async function handleSalvar() {
    if (!data || !cidade || !pais) {
      setErro('Preencha a data e escolha uma cidade da lista.')
      return
    }
    setSalvando(true)
    setErro(null)
    const { error } = await onSalvar({ data, cidade, pais, flag_emoji: flagEmoji, status: 'planejando' })
    setSalvando(false)
    if (error) {
      setErro(error.message?.includes('duplicate') ? 'Já existe um dia com essa data.' : error.message)
      return
    }
    fecharTudo()
  }

  return (
    <Modal aberto={aberto} onClose={fecharTudo} titulo="Adicionar dia ao roteiro">
      <div className="space-y-3">
        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Data</label>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] mt-1 tabular-nums"
          />
        </div>
        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Cidade</label>
          <div className="mt-1">
            <CidadeAutocomplete value={cidade} onChange={setCidade} onSelecionarLugar={handleSelecionarLugar} />
          </div>
        </div>
        {pais && (
          <p className="text-[14px] text-muted">
            {flagEmoji} {pais}
          </p>
        )}

        {erro && <p className="text-[13px] text-red bg-red/10 rounded-ios px-3 py-2"><AlertTriangle className="w-4 h-4 inline-block mr-1" /> {erro}</p>}

        <p className="text-[12px] text-muted">
          O dia aparece automaticamente na ordem certa do roteiro e já fica disponível em Atrações.
        </p>

        <Button className="w-full" onClick={handleSalvar} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Adicionar dia'}
        </Button>
      </div>
    </Modal>
  )
}
