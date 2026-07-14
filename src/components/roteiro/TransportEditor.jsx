import { useEffect, useState } from 'react'
import Modal from '../ui/Modal'
import FormFooter from '../ui/FormFooter'
import DeleteSection from '../ui/DeleteSection'
import TravelCurrencyInput from '../ui/TravelCurrencyInput'
import TravelDateTimePicker from '../ui/TravelDateTimePicker'
import { paraDatetimeLocalFuso, deDatetimeLocalFuso } from '../../lib/datas'
import { supabase } from '../../lib/supabase'

function useFusoDaCidade(nomeCidade) {
  const [fuso, setFuso] = useState(null)
  useEffect(() => {
    let cancelado = false
    async function carregar() {
      if (!nomeCidade) { if (!cancelado) setFuso(null); return }
      const { data } = await supabase.from('cidades').select('fuso_horario').eq('nome', nomeCidade).limit(1).maybeSingle()
      if (!cancelado) setFuso(data?.fuso_horario ?? null)
    }
    carregar()
    return () => { cancelado = true }
  }, [nomeCidade])
  return fuso
}

const TIPOS_TRANSPORTE = [
  { id: 'aviao', label: 'Avião', icon: '✈️' },
  { id: 'trem', label: 'Trem', icon: '🚄' },
  { id: 'onibus', label: 'Ônibus', icon: '🚌' },
  { id: 'carro', label: 'Carro', icon: '🚗' },
]

export const MAPA_TIPO_TRANSPORTE = Object.fromEntries(TIPOS_TRANSPORTE.map((t) => [t.id, t.label]))

export default function TransportEditor({ aberto, onClose, onSalvar, onExcluir, transporteExistente, cidadeOrigem, cidadeDestino, destinoOrigemId, destinoDestinoId, bare }) {
  const [tipo, setTipo] = useState(transporteExistente?.tipo ?? 'aviao')
  const [operadora, setOperadora] = useState(transporteExistente?.operadora ?? '')
  const [link, setLink] = useState(transporteExistente?.link ?? '')
  const [horarioSaida, setHorarioSaida] = useState('')
  const [horarioChegada, setHorarioChegada] = useState('')
  const [custo, setCusto] = useState(transporteExistente?.custo_estimado_brl ?? '')
  const [notas, setNotas] = useState(transporteExistente?.notas ?? '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)

  const fusoOrigem = useFusoDaCidade(cidadeOrigem)
  const fusoDestino = useFusoDaCidade(cidadeDestino)

  useEffect(() => {
    setHorarioSaida(paraDatetimeLocalFuso(transporteExistente?.horario_saida, fusoOrigem))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fusoOrigem])

  useEffect(() => {
    setHorarioChegada(paraDatetimeLocalFuso(transporteExistente?.horario_chegada, fusoDestino))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fusoDestino])

  async function handleSalvar() {
    if (!tipo) return
    setSalvando(true)
    setErro(null)

    const result = await onSalvar({
      destino_origem_id: destinoOrigemId,
      destino_destino_id: destinoDestinoId,
      tipo,
      operadora: operadora || null,
      link: link || null,
      horario_saida: deDatetimeLocalFuso(horarioSaida, fusoOrigem),
      horario_chegada: deDatetimeLocalFuso(horarioChegada, fusoDestino),
      custo_estimado_brl: custo ? parseFloat(custo) : null,
      notas: notas || null,
      status: 'pendente',
    })

    setSalvando(false)
    if (result?.error) {
      setErro(result.error.message || 'Erro ao salvar transporte')
      return
    }
    onClose()
  }

  const conteudo = (
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-1">
          <span className="text-lg">{cidadeOrigem}</span>
          <span className="text-muted">→</span>
          <span className="text-lg">{cidadeDestino}</span>
        </div>

        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Tipo</label>
          <div className="flex gap-2 mt-1">
            {TIPOS_TRANSPORTE.map((t) => (
              <button
                key={t.id}
                onClick={() => setTipo(t.id)}
                className={`tap-scale flex-1 py-3 rounded-xl text-[14px] font-semibold flex flex-col items-center gap-0.5 ${
                  tipo === t.id ? 'bg-blue text-white' : 'bg-fill text-text'
                }`}
              >
                <span className="text-lg">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Operadora</label>
          <input
            placeholder="Ex: Ryanair, Renfe, FlixBus..."
            value={operadora}
            onChange={(e) => setOperadora(e.target.value)}
            className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] placeholder:text-muted mt-1"
          />
        </div>

        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Link</label>
          <input
            placeholder="https://..."
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] placeholder:text-muted mt-1"
          />
        </div>

        <div>
          <div className="flex gap-3">
            <TravelDateTimePicker label="Saída" value={horarioSaida} onChange={setHorarioSaida} className="flex-1" />
            <TravelDateTimePicker label="Chegada" value={horarioChegada} onChange={setHorarioChegada} className="flex-1" />
          </div>
          <p className="text-[12px] text-muted mt-1">
            Saída em horário de {cidadeOrigem}{fusoOrigem ? '' : ' (sem fuso cadastrado — usa o do seu aparelho)'} · Chegada em horário de {cidadeDestino}{fusoDestino ? '' : ' (sem fuso cadastrado — usa o do seu aparelho)'}
          </p>
        </div>

        <TravelCurrencyInput valor={custo} moeda="BRL" onValorChange={setCusto} onMoedaChange={() => {}} moedas={['BRL']} />

        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Notas</label>
          <input
            placeholder="Ex: bagagem despachada, assento 14A"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] placeholder:text-muted mt-1"
          />
        </div>

        {erro && <p className="text-[13px] text-red bg-red/10 rounded-ios px-3 py-2">{erro}</p>}

        <FormFooter onCancel={onClose} onSave={handleSalvar} saveLabel={transporteExistente ? 'Salvar alterações' : 'Adicionar transporte'} saving={salvando} />

        {transporteExistente && onExcluir && (
          <DeleteSection onDelete={() => onExcluir(transporteExistente.id)} itemName="transporte" />
        )}
      </div>
  )

  if (bare) return conteudo

  return (
    <Modal aberto={aberto} onClose={onClose} titulo={`Transporte ${cidadeOrigem} → ${cidadeDestino}`}>
      {conteudo}
    </Modal>
  )
}
