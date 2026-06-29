import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import EnderecoAutocomplete from '../ui/EnderecoAutocomplete'

const TIPOS = [
  { id: 'hotel', label: 'Hotel' },
  { id: 'airbnb', label: 'Airbnb' },
  { id: 'hostel', label: 'Hostel' },
  { id: 'outro', label: 'Outro' },
]

export default function AcomodacaoEditor({ aberto, onClose, acomodacao, cidade, pais, onSalvar, cidades }) {
  const [cidadeAtual, setCidadeAtual] = useState(cidade || '')
  const [paisAtual, setPaisAtual] = useState(pais || '')
  const [nome, setNome] = useState(acomodacao?.nome ?? '')
  const [tipo, setTipo] = useState(acomodacao?.tipo ?? 'hotel')
  const [endereco, setEndereco] = useState(acomodacao?.endereco ?? '')
  const [latitude, setLatitude] = useState(acomodacao?.latitude ?? null)
  const [longitude, setLongitude] = useState(acomodacao?.longitude ?? null)
  const [link, setLink] = useState(acomodacao?.link_reserva ?? '')
  const [notas, setNotas] = useState(acomodacao?.notas ?? '')
  const [salvando, setSalvando] = useState(false)

  function fecharTudo() {
    setCidadeAtual(cidade || '')
    setPaisAtual(pais || '')
    setNome('')
    setTipo('hotel')
    setEndereco('')
    setLatitude(null)
    setLongitude(null)
    setLink('')
    setNotas('')
    onClose()
  }

  async function handleSalvar() {
    if (!nome || !cidadeAtual) return
    setSalvando(true)

    await onSalvar({
      cidade: cidadeAtual,
      pais: paisAtual,
      nome,
      tipo,
      endereco: endereco || null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      link_reserva: link || null,
      notas: notas || null,
    })

    setSalvando(false)
    onClose()
  }

  return (
    <Modal aberto={aberto} onClose={fecharTudo} titulo={acomodacao ? 'Editar acomodação' : 'Nova acomodação'}>
      <div className="space-y-3">
        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Vincular a</label>
          {cidades && cidades.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {cidades.map((cid) => (
                <button
                  key={cid.nome}
                  onClick={() => { setCidadeAtual(cid.nome); setPaisAtual(cid.pais) }}
                  className={`tap-scale px-3 py-1.5 rounded-full text-[13px] font-semibold ${
                    cidadeAtual === cid.nome ? 'bg-blue text-white shadow-sm' : 'bg-fill text-text'
                  }`}
                >
                  {cid.flag} {cid.nome}
                </button>
              ))}
            </div>
          ) : (
            <div className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] mt-1 flex items-center gap-2">
              {cidade && pais ? `${cidade}, ${pais}` : cidade || pais || '—'}
            </div>
          )}
        </div>

        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Nome</label>
          <input
            placeholder="Ex: Hotel Mundial Lisbon"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] placeholder:text-muted mt-1 font-sans"
          />
        </div>

        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Tipo</label>
          <div className="flex gap-2 mt-1">
            {TIPOS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTipo(t.id)}
                className={`tap-scale px-3.5 py-2 rounded-full text-[14px] font-semibold ${
                  tipo === t.id ? 'bg-blue text-white' : 'bg-fill text-text'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Endereço</label>
          <EnderecoAutocomplete
            value={endereco}
            onChange={setEndereco}
            onSelecionar={({ latitude: lat, longitude: lng }) => {
              setLatitude(lat)
              setLongitude(lng)
            }}
            placeholder="Busque o endereço no Google Maps..."
            cidade={cidadeAtual}
          />
        </div>

        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Link da reserva</label>
          <input
            placeholder="https://..."
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] placeholder:text-muted mt-1 font-sans"
          />
        </div>

        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Notas</label>
          <input
            placeholder="Ex: check-in às 15h, café incluso"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] placeholder:text-muted mt-1 font-sans"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={fecharTudo}>Cancelar</Button>
          <Button className="flex-1" onClick={handleSalvar} disabled={salvando || !nome || !cidadeAtual}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
