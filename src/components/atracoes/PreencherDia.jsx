import { useState, useEffect, useCallback } from 'react'
import { sugerirAtracoes } from '../../lib/openrouter'
import { geocodificar, buscarFotoLocal } from '../../lib/maps'
import { otimizarRota, gerarHorarios, formatarDistancia, estimarTempoCaminhada } from '../../lib/geo'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { Sparkles, Loader2, MapPin, AlertTriangle, Check } from 'lucide-react'

export default function PreencherDia({ aberto, onClose, destino, acomodacao, onAdicionar }) {
  const [sugestoes, setSugestoes] = useState([])
  const [selecionadas, setSelecionadas] = useState(new Set())
  const [etapa, setEtapa] = useState('carregando')
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)

  const resetar = useCallback(() => {
    setSugestoes([])
    setSelecionadas(new Set())
    setEtapa('carregando')
    setErro(null)
    setSalvando(false)
  }, [])

  useEffect(() => {
    if (!aberto) return
    resetar()

    let cancelado = false

    async function buscar() {
      try {
        const raw = await sugerirAtracoes(destino.cidade, destino.pais, [destino])
        if (cancelado) return
        if (!Array.isArray(raw)) throw new Error('IA não retornou uma lista válida')

        const comCoords = await Promise.allSettled(
          raw.map(async (s) => {
            const geo = await geocodificar(s.local_busca)
            if (cancelado) return null
            const foto = geo ? await buscarFotoLocal(s.nome, destino.cidade) : null
            if (cancelado) return null
            return { ...s, latitude: geo?.latitude ?? null, longitude: geo?.longitude ?? null, foto_url: foto ?? null }
          }),
        )
        if (cancelado) return

        const lista = comCoords.map((r) => (r.status === 'fulfilled' ? r.value : null)).filter(Boolean)
        if (lista.length === 0) throw new Error('Nenhuma atração pôde ser localizada no mapa')

        const acomodacaoAtiva = acomodacao?.latitude && acomodacao?.longitude
          ? { lat: acomodacao.latitude, lng: acomodacao.longitude }
          : null

        if (acomodacaoAtiva) {
          const ordenadas = otimizarRota(lista, acomodacaoAtiva)
          setSugestoes(ordenadas)
        } else {
          setSugestoes(lista)
        }

        setSelecionadas(new Set(lista.map((_, i) => i)))
        setEtapa('pronto')
      } catch (e) {
        if (!cancelado) {
          setErro(e.message ?? 'Erro ao buscar sugestões')
          setEtapa('erro')
        }
      }
    }

    buscar()
    return () => { cancelado = true }
  }, [aberto, destino, acomodacao, resetar])

  function toggleSelecao(idx) {
    setSelecionadas((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  async function handleAdicionar() {
    const escolhidas = sugestoes.filter((_, i) => selecionadas.has(i))
    if (escolhidas.length === 0) return

    setSalvando(true)
    const horarios = gerarHorarios(escolhidas.length)

    await Promise.all(
      escolhidas.map((s, i) =>
        onAdicionar({
          nome: s.nome,
          categoria: s.categoria ?? 'outro',
          destino_id: destino.id,
          custo_estimado_eur: s.custo_estimado_eur ?? null,
          precisa_reserva: s.precisa_reserva ?? false,
          status_reserva: s.precisa_reserva ? 'pendente' : 'nao_precisa',
          ocupa_dia_inteiro: s.ocupa_dia_inteiro ?? false,
          latitude: s.latitude ?? null,
          longitude: s.longitude ?? null,
          horario_previsto: horarios[i],
          ordem_no_dia: i,
          notas: s.descricao ?? null,
          foto_url: s.foto_url ?? null,
          origem_ideia: 'ia',
        }),
      ),
    )

    setSalvando(false)
    onClose()
  }

  const temAcomodacao = acomodacao?.latitude && acomodacao?.longitude

  return (
    <Modal aberto={aberto} onClose={onClose} titulo="Preencher dia com IA" className="flex flex-col overflow-y-hidden">
      <div className="flex flex-col flex-1 min-h-0">
        <p className="text-[13px] text-muted mb-3">
          Sugestões para <strong>{destino.cidade}</strong> em {' '}
          {new Date(destino.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
        </p>

        {etapa === 'carregando' && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 className="w-7 h-7 text-blue animate-spin" />
            <p className="text-[14px] text-muted">IA buscando as melhores atrações...</p>
          </div>
        )}

        {etapa === 'erro' && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <AlertTriangle className="w-8 h-8 text-red" />
            <p className="text-[14px] text-red text-center">{erro}</p>
            <Button variant="outline" onClick={resetar}>Tentar novamente</Button>
          </div>
        )}

        {etapa === 'pronto' && (
          <div className="flex flex-col flex-1 min-h-0">
            <p className="text-[12px] text-muted2 font-medium mb-2">
              {selecionadas.size} de {sugestoes.length} selecionadas
              {temAcomodacao ? ' · ordenadas da mais próxima do hotel' : ''}
            </p>

            <div className="flex-1 overflow-y-auto -mx-5 px-5 space-y-2 min-h-0">
              {sugestoes.map((s, i) => {
                // ...existing items...
                const distAnterior = i > 0 && s.latitude && sugestoes[i - 1]?.latitude
                  ? formatarDistancia(
                      Math.sqrt(
                        (s.latitude - sugestoes[i - 1].latitude) ** 2 * 111.32 ** 2 +
                        (s.longitude - sugestoes[i - 1].longitude) ** 2 * (111.32 * Math.cos(s.latitude * Math.PI / 180)) ** 2,
                      ),
                    )
                  : null
                const tempoAnterior = i > 0 && s.latitude && sugestoes[i - 1]?.latitude
                  ? estimarTempoCaminhada(
                      Math.sqrt(
                        (s.latitude - sugestoes[i - 1].latitude) ** 2 * 111.32 ** 2 +
                        (s.longitude - sugestoes[i - 1].longitude) ** 2 * (111.32 * Math.cos(s.latitude * Math.PI / 180)) ** 2,
                      ),
                    )
                  : null

                return (
                  <div key={i}>
                    {i > 0 && distAnterior && (
                      <div className="flex items-center gap-1.5 pl-12 py-1">
                        <div className="w-px h-4 bg-separator" />
                        <span className="text-[11px] text-muted2 font-mono">
                          {distAnterior} · ~{tempoAnterior} a pé
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => toggleSelecao(i)}
                      className={`tap-scale w-full flex items-start gap-3 p-3 rounded-ios text-left border transition-all ${
                        selecionadas.has(i) ? 'border-blue/30 bg-blue/5' : 'border-border bg-fill'
                      }`}
                    >
                      <span
                        className={`tap-scale mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          selecionadas.has(i) ? 'bg-blue border-blue text-white' : 'border-muted2'
                        }`}
                      >
                        {selecionadas.has(i) && <Check className="w-4 h-4" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold truncate">{s.nome}</p>
                        <p className="text-[12px] text-muted mt-0.5">{s.descricao}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-[11px] font-medium capitalize text-muted2 bg-card px-2 py-0.5 rounded-full border border-border">
                            {s.categoria}
                          </span>
                          {s.custo_estimado_eur != null && (
                            <span className="text-[11px] font-mono font-semibold text-blue">
                              ~€{s.custo_estimado_eur}
                            </span>
                          )}
                          {s.latitude && (
                            <span className="text-[11px] text-muted2 flex items-center gap-0.5">
                              <MapPin className="w-3 h-3" /> no mapa
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="flex gap-2 pt-3 mt-3 border-t border-separator">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleAdicionar}
                disabled={selecionadas.size === 0 || salvando}
              >
                {salvando ? (
                  <><Loader2 className="w-4 h-4 mr-1 inline animate-spin" /> Adicionando...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-1 inline" /> Adicionar {selecionadas.size}</>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
