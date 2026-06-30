import { useState, useMemo } from 'react'
import { useViagem } from '../../hooks/useViagem'
import { useDestinos } from '../../hooks/useDestinos'
import { useToast } from '../../contexts/ToastContext'
import { supabase } from '../../lib/supabase'
import { converterParaBRL } from '../../lib/cambio'
import AdicionarModal from '../ui/AdicionarModal'
import { Plus } from 'lucide-react'

export default function FABAdicionar() {
  const { viagemId } = useViagem()
  const { destinos } = useDestinos(viagemId)
  const addToast = useToast()
  const [modalAberto, setModalAberto] = useState(false)

  const cidades = useMemo(() => {
    const mapa = {}
    for (const d of destinos) {
      if (d.cidade && !mapa[d.cidade]) {
        mapa[d.cidade] = { nome: d.cidade, pais: d.pais, flag: d.flag_emoji || '' }
      }
    }
    return Object.values(mapa)
  }, [destinos])

  async function handleSalvarGasto(gasto) {
    const { valorBRL, cotacaoUsada } = await converterParaBRL(gasto.valor, gasto.moeda)
    const { error } = await supabase.from('gastos').insert({ ...gasto, viagem_id: viagemId, valor_brl: valorBRL, cotacao_usada: cotacaoUsada })
    if (!error) addToast('Gasto adicionado')
  }

  async function handleSalvarAtracao(dados) {
    const { error } = await supabase.from('atracoes').insert({ ...dados, viagem_id: viagemId })
    if (!error) addToast('Atração adicionada')
  }

  async function handleSalvarPendencia(dados) {
    const { error } = await supabase.from('pendencias').insert({ ...dados, viagem_id: viagemId })
    if (!error) addToast('Pendência adicionada')
  }

  async function handleSalvarHospedagem(dados) {
    const { error } = await supabase.from('hospedagens').upsert(dados, { onConflict: 'cidade_id' })
    if (!error) addToast('Hospedagem adicionada')
  }

  async function handleSalvarTransporte(dados) {
    const { error } = await supabase.from('transportes').insert({ ...dados, viagem_id: viagemId })
    if (!error) addToast('Transporte adicionado')
  }

  async function handleSalvarDia(dados) {
    const { error } = await supabase.from('dias').insert({ ...dados, viagem_id: viagemId })
    if (!error) addToast('Dia adicionado')
  }

  return (
    <>
      <button
        onClick={() => setModalAberto(true)}
        className="fixed right-4 bottom-20 z-30 w-14 h-14 rounded-full bg-blue text-white shadow-lg flex items-center justify-center tap-scale"
        aria-label="Adicionar"
      >
        <Plus className="w-7 h-7" />
      </button>

      <AdicionarModal
        aberto={modalAberto}
        onClose={() => setModalAberto(false)}
        destinos={destinos}
        cidades={cidades}
        onSalvarGasto={handleSalvarGasto}
        onSalvarAtracao={handleSalvarAtracao}
        onSalvarPendencia={handleSalvarPendencia}
        onSalvarHospedagem={handleSalvarHospedagem}
        onSalvarTransporte={handleSalvarTransporte}
        onSalvarDia={handleSalvarDia}
      />
    </>
  )
}
