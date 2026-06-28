import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { geocodificar } from '../../lib/maps'

const TIPOS = [
  { id: 'hotel', label: 'Hotel' },
  { id: 'airbnb', label: 'Airbnb' },
  { id: 'hostel', label: 'Hostel' },
  { id: 'outro', label: 'Outro' },
]

export default function AcomodacaoEditor({ aberto, onClose, acomodacao, cidade, pais, onSalvar }) {
  const [nome, setNome] = useState(acomodacao?.nome ?? '')
  const [tipo, setTipo] = useState(acomodacao?.tipo ?? 'hotel')
  const [endereco, setEndereco] = useState(acomodacao?.endereco ?? '')
  const [link, setLink] = useState(acomodacao?.link_reserva ?? '')
  const [preco, setPreco] = useState(acomodacao?.preco_noite ?? '')
  const [notas, setNotas] = useState(acomodacao?.notas ?? '')
  const [salvando, setSalvando] = useState(false)

  async function handleSalvar() {
    if (!nome) return
    setSalvando(true)

    let latitude = acomodacao?.latitude
    let longitude = acomodacao?.longitude

    if (endereco && endereco !== acomodacao?.endereco) {
      const coords = await geocodificar(endereco)
      if (coords) {
        latitude = coords.latitude
        longitude = coords.longitude
      }
    }

    await onSalvar({
      cidade,
      pais,
      nome,
      tipo,
      endereco: endereco || null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      link_reserva: link || null,
      preco_noite: preco ? Number(preco) : null,
      notas: notas || null,
    })

    setSalvando(false)
    onClose()
  }

  return (
    <Modal aberto={aberto} onClose={onClose} titulo={acomodacao ? 'Editar acomodação' : 'Nova acomodação'}>
      <div className="space-y-3">
        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Nome</label>
          <input
            placeholder="Ex: Hotel Mundial Lisbon"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] placeholder:text-muted mt-1"
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
          <input
            placeholder="Ex: Av. da Liberdade, 123, Lisboa"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] placeholder:text-muted mt-1"
          />
          {endereco && (
            <p className="text-[11px] text-muted mt-1">O endereço será geocodificado para usar no mapa e nas sugestões de proximidade.</p>
          )}
        </div>

        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Link da reserva</label>
          <input
            placeholder="https://..."
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] placeholder:text-muted mt-1"
          />
        </div>

        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Preço por noite</label>
          <div className="relative mt-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-[15px] font-mono">€</span>
            <input
              type="number"
              placeholder="0,00"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              className="w-full bg-fill rounded-ios pl-9 pr-4 py-3 text-[15px] placeholder:text-muted font-mono"
            />
          </div>
        </div>

        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Notas</label>
          <input
            placeholder="Ex: check-in às 15h, café incluso"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] placeholder:text-muted mt-1"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1" onClick={handleSalvar} disabled={salvando || !nome}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
