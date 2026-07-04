import { useState, useMemo, useEffect } from 'react'
import { useViagem } from '../../contexts/ViagemContext'
import { useDestinos } from '../../hooks/useDestinos'
import { useAtracoes } from '../../hooks/useAtracoes'
import { useGastos } from '../../hooks/useGastos'
import { useAcomodacoes } from '../../hooks/useAcomodacoes'
import { useToast } from '../../contexts/ToastContext'
import { supabase } from '../../lib/supabase'
import { converterParaBRL } from '../../lib/cambio'
import { ranquearDias } from '../../lib/geo'
import AdicionarModal from '../ui/AdicionarModal'
import { Plus } from 'lucide-react'
import { emitirSync } from '../../lib/sync'

export default function FABAdicionar() {
  const { viagem, viagemId } = useViagem()
  const { destinos } = useDestinos(viagemId)
  const { atracoes } = useAtracoes(viagemId)
  const { adicionarGasto } = useGastos(viagemId)
  const { acomodacoes, salvar: salvarHospedagem } = useAcomodacoes(viagemId)
  const addToast = useToast()
  const [modalAberto, setModalAberto] = useState(false)
  const [wizardVisivel, setWizardVisivel] = useState(false)

  useEffect(() => {
    const handler = (e) => setWizardVisivel(e.detail)
    window.addEventListener('wizard-visivel', handler)
    return () => window.removeEventListener('wizard-visivel', handler)
  }, [])

  const diasRanqueados = useMemo(() => {
    if (destinos.length === 0) return []
    return ranquearDias(destinos, atracoes, null, null, [])
  }, [destinos, atracoes])

  const cidades = useMemo(() => {
    const mapa = {}
    for (const d of destinos) {
      if (d.cidade && !mapa[d.cidade]) {
        mapa[d.cidade] = { nome: d.cidade, pais: d.pais, flag: d.flag_emoji || '' }
      }
    }
    return Object.values(mapa)
  }, [destinos])

  const contextoPadrao = useMemo(() => {
    const cidadeNomePorDiaId = Object.fromEntries(destinos.map((d) => [d.id, d.cidade]))
    const diasOrdenados = [...destinos].sort((a, b) => a.data.localeCompare(b.data))

    return {
      tipo: 'viagem',
      id: 'viagem',
      cidades: cidades.map((c) => ({ nome: c.nome, flag: c.flag })),
      dias: diasOrdenados.map((d) => {
        const data = new Date(d.data + 'T00:00:00')
        return { id: d.id, label: `${data.getDate()}/${data.getMonth() + 1}`, cidade: d.cidade, flag: d.flag_emoji || '' }
      }),
      atracoes: atracoes.map((a) => ({ id: a.id, nome: a.nome })),
      acomodacoes: acomodacoes.map((h) => ({ id: h.id, nome: h.nome, cidade: h.cidade })),
      transportes: destinos.flatMap((d) => d.transportes || []).map((t) => ({
        id: t.id,
        tipo: t.tipo,
        operadora: t.operadora,
        origem: cidadeNomePorDiaId[t.destino_origem_id] || '—',
        destino: cidadeNomePorDiaId[t.destino_destino_id] || '—',
      })),
    }
  }, [destinos, cidades, atracoes, acomodacoes])

  async function handleSalvarGasto(gasto) {
    const { valorBRL, cotacaoUsada } = await converterParaBRL(gasto.valor, gasto.moeda)
    const { error } = await adicionarGasto({ ...gasto, valor_brl: valorBRL, cotacao_usada: cotacaoUsada })
    if (!error) addToast('Gasto adicionado')
    return { error }
  }

  async function handleSalvarAtracao(dados) {
    const { data: auth } = await supabase.auth.getUser()
    const { error } = await supabase.from('atracoes').insert({ ...dados, viagem_id: viagemId, created_by: auth?.user?.id })
    if (!error) { addToast('Atração adicionada'); emitirSync('atracoes') }
    return { error }
  }

  async function handleSalvarPendencia(dados) {
    const { error } = await supabase.from('pendencias').insert({ ...dados, viagem_id: viagemId })
    if (!error) { addToast('Pendência adicionada'); emitirSync('pendencias') }
    return { error }
  }

  async function handleSalvarHospedagem(dados) {
    const { error } = await salvarHospedagem(dados)
    if (!error) { addToast('Hospedagem adicionada'); emitirSync('hospedagens') }
    return { error }
  }

  return (
    <>
      {!wizardVisivel && (
        <button
          onClick={() => setModalAberto(true)}
          className="fixed right-4 z-30 w-14 h-14 rounded-full bg-blue text-white shadow-lg flex items-center justify-center tap-scale"
          style={{ bottom: 'calc(76px + env(safe-area-inset-bottom, 0px))' }}
          aria-label="Adicionar"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}

      <AdicionarModal
        aberto={modalAberto}
        onClose={() => setModalAberto(false)}
        destinos={destinos}
        diasRanqueados={diasRanqueados}
        cidades={cidades}
        moedaPadrao={viagem?.moeda_principal}
        contextoPadrao={contextoPadrao}
        onSalvarGasto={handleSalvarGasto}
        onSalvarAtracao={handleSalvarAtracao}
        onSalvarPendencia={handleSalvarPendencia}
        onSalvarHospedagem={handleSalvarHospedagem}
      />
    </>
  )
}
