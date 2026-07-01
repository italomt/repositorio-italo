import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { planejarCidade } from '../../lib/openrouter'
import { geocodificar, buscarFotoLocal } from '../../lib/maps'
import { gerarHorarios } from '../../lib/geo'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { Sparkles, Loader2, AlertTriangle, Check, MapPin, Calendar, Clock } from 'lucide-react'
import { simboloMoeda } from '../../lib/cambio'

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const LABEL_CATEGORIA = {
  museu: 'Museu', gastronomia: 'Gastronomia', balada: 'Balada',
  compras: 'Compras', natureza: 'Natureza', cultura: 'Cultura',
  lazer: 'Lazer', outro: 'Outro',
}

export default function PreencherCidade({ aberto, onClose, cidade, pais, dias, atracoes, tipo, moeda, hospedagem, clima, onAdicionar, onCriarPendencia }) {
  const [etapa, setEtapa] = useState('inicio') // inicio | carregando | revisar | salvando | erro
  const [sugestoes, setSugestoes] = useState(null)
  const [selecionadas, setSelecionadas] = useState({})
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [fraseIdx, setFraseIdx] = useState(0)
  const [dotCount, setDotCount] = useState(0)

  const frases = useMemo(() => [
    `Analisando as melhores atrações de ${cidade}...`,
    `Consultando horários de funcionamento e clima...`,
    `Distribuindo experiências pelos ${dias.length} dias da sua estadia...`,
    `Otimizando a rota para minimizar deslocamentos...`,
    `Selecionando opções gastronômicas imperdíveis...`,
    `Montando o roteiro perfeito para seu perfil: ${tipo}...`,
    `Priorizando atrações bem avaliadas no Google e Tripadvisor...`,
    `Buscando lugares fora do roteiro turístico tradicional...`,
  ], [cidade, dias.length, tipo])

  useEffect(() => {
    if (etapa !== 'carregando') return
    const fraseTimer = setInterval(() => setFraseIdx((p) => (p + 1) % frases.length), 3000)
    const dotTimer = setInterval(() => setDotCount((p) => (p + 1) % 7), 600)
    return () => { clearInterval(fraseTimer); clearInterval(dotTimer) }
  }, [etapa, frases.length])

  const diasOrdenados = useMemo(() =>
    [...dias].sort((a, b) => a.data.localeCompare(b.data)),
    [dias],
  )

  const atracoesPorDia = useMemo(() => {
    const map = {}
    diasOrdenados.forEach((d) => {
      map[d.data] = atracoes.filter((a) => a.destino_id === d.id)
    })
    return map
  }, [diasOrdenados, atracoes])

  // Reseta ao abrir
  useEffect(() => {
    if (!aberto) return
    setEtapa('inicio')
    setSugestoes(null)
    setSelecionadas({})
    setErro(null)
  }, [aberto])

  // Chama IA quando etapa = carregando
  useEffect(() => {
    if (etapa !== 'carregando') return
    let cancelado = false

    async function buscar() {
      try {
        const datas = diasOrdenados.map((d) => d.data)
        const todasAtracoes = diasOrdenados.flatMap((d) => {
          const atrs = atracoesPorDia[d.data] || []
          return atrs.map((a) => ({ ...a, data: d.data }))
        })

        const resultado = await planejarCidade({
          cidade, pais, datas, tipo, moeda,
          hospedagem: hospedagem || null,
          clima,
          atracoesExistentes: todasAtracoes,
        })

        if (cancelado) return

        // Geocodifica e busca fotos com timeout de 8s
        const diasCompletos = {}
        for (const [data, atrs] of Object.entries(resultado.dias || {})) {
          const comGeo = await Promise.all(
            atrs.map(async (s) => {
              let lat = null, lng = null, foto = null
              // Geocodifica (Google Maps com fallback Nominatim)
              try {
                const geo = await geocodificar(`${s.local_busca || s.nome}, ${cidade}, ${pais}`)
                if (geo) { lat = geo.latitude; lng = geo.longitude }
              } catch {}
              // Busca foto (Wikipedia + Google Places)
              try {
                foto = await buscarFotoLocal(s.nome, cidade)
              } catch {}
              return { ...s, latitude: lat, longitude: lng, foto_url: foto }
            })
          )
          diasCompletos[data] = comGeo
        }

        if (cancelado) return
        setSugestoes(diasCompletos)
        // Pré-seleciona todas as sugestões
        const sel = {}
        Object.entries(diasCompletos).forEach(([data, atrs]) => {
          sel[data] = new Set(atrs.map((_, i) => i))
        })
        setSelecionadas(sel)
        setEtapa('revisar')
      } catch (e) {
        if (!cancelado) {
          setErro(e.message || 'Erro ao planejar')
          setEtapa('erro')
        }
      }
    }

    buscar()
    return () => { cancelado = true }
  }, [etapa])

  function toggleAtracao(data, index) {
    setSelecionadas((prev) => {
      const novo = { ...prev }
      const setAtual = new Set(novo[data] || [])
      if (setAtual.has(index)) setAtual.delete(index)
      else setAtual.add(index)
      novo[data] = setAtual
      return novo
    })
  }

  async function handleAdicionar() {
    setSalvando(true)
    let total = 0

    for (const dia of diasOrdenados) {
      const data = dia.data
      const sugs = sugestoes?.[data] || []
      const sel = selecionadas[data] || new Set()

      const escolhidas = [...sel].map((i) => sugs[i]).filter(Boolean)
      if (escolhidas.length === 0) continue

      const horarios = gerarHorarios(escolhidas, '08:00', 90)

      for (let i = 0; i < escolhidas.length; i++) {
        const s = escolhidas[i]
        const { data: atracaoCriada } = await onAdicionar({
          nome: s.nome,
          categoria: s.categoria || 'outro',
          destino_id: dia.id,
          custo_estimado_eur: s.custo_estimado_eur ?? null,
          moeda: moeda || 'EUR',
          precisa_reserva: s.precisa_reserva ?? false,
          status_reserva: s.precisa_reserva ? 'pendente' : 'nao_precisa',
          ocupa_dia_inteiro: s.ocupa_dia_inteiro ?? false,
          latitude: s.latitude ?? null,
          longitude: s.longitude ?? null,
          horario_previsto: s.horario_sugerido || horarios[i],
          ordem_no_dia: i,
          foto_url: s.foto_url ?? null,
          notas: s.descricao ?? null,
          origem_ideia: 'ia',
        })

        // Cria pendência se precisa de reserva
        if (s.precisa_reserva && atracaoCriada && onCriarPendencia) {
          const diasAntes = s.dias_antecedencia || 14
          const prazo = new Date(data + 'T00:00:00')
          prazo.setDate(prazo.getDate() - diasAntes)
          await onCriarPendencia({
            titulo: `Reservar ${s.nome}`,
            categoria: 'atracoes',
            prazo_sugerido: prazo.toISOString().slice(0, 10),
            link: s.link_reserva_oficial || null,
            urgencia: prazo < new Date() ? 'alta' : 'media',
            atracao_id: atracaoCriada.id,
          })
        }
        total++
      }
    }

    setSalvando(false)
    if (total > 0) onClose()
  }

  const totalSelecionadas = Object.values(selecionadas).reduce((s, set) => s + set.size, 0)

  return (
    <Modal aberto={aberto} onClose={onClose} titulo={`✨ Planejar ${cidade}`}>

      {etapa === 'inicio' && (
        <div className="flex flex-col items-center py-8 space-y-6">
          <Sparkles className="w-16 h-16 text-amber-400" />
          <div className="text-center space-y-2">
            <h3 className="font-display text-[18px] font-bold">Planejar {cidade}</h3>
            <p className="text-muted text-[15px]">
              A IA vai analisar os <strong>{dias.length} dia{dias.length !== 1 ? 's' : ''}</strong> da sua estadia em {cidade} e sugerir o melhor roteiro, considerando:
            </p>
            <ul className="text-[14px] text-muted2 text-left space-y-1 pt-2">
              <li>· Perfil da viagem: <strong>{tipo}</strong></li>
              <li>· Atrações já planejadas em cada dia</li>
              <li>· Proximidade entre atrações e logística</li>
              <li>· Dias bloqueados (ocupam o dia inteiro)</li>
              <li>· Horários reais e pausas para refeições</li>
            </ul>
          </div>
          <button
            onClick={() => setEtapa('carregando')}
            className="tap-scale w-full py-4 rounded-2xl bg-amber-400 text-black font-bold text-[16px] flex items-center justify-center gap-2 shadow-sm"
          >
            <Sparkles className="w-5 h-5" /> Começar planejamento
          </button>
        </div>
      )}

      {etapa === 'carregando' && (
        <div className="flex flex-col items-center py-8 space-y-6">
          {/* Ícone animado */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          >
            <Sparkles className="w-14 h-14 text-amber-400" />
          </motion.div>

          {/* Texto rotativo */}
          <div className="h-12 flex items-center justify-center text-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={fraseIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="text-muted text-[15px]"
              >
                {frases[fraseIdx]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Dots de progresso */}
          <div className="flex gap-1.5">
            {Array.from({ length: 6 }, (_, i) => (
              <motion.div
                key={i}
                animate={{
                  opacity: i <= dotCount % 6 ? [0.3, 1, 0.3] : 0.2,
                  scale: i === dotCount % 6 ? [1, 1.3, 1] : 1,
                }}
                transition={{ duration: 0.6 }}
                className="w-2 h-2 rounded-full bg-blue"
              />
            ))}
          </div>

          <p className="text-[12px] text-muted2">Isso leva em média 15 segundos...</p>
        </div>
      )}

      {etapa === 'erro' && (
        <div className="space-y-4">
          <p className="text-[14px] text-red bg-red/5 rounded-ios p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{erro || 'Não foi possível planejar. Tente novamente.'}</span>
          </p>
          <Button className="w-full" onClick={onClose}>Fechar</Button>
        </div>
      )}

      {etapa === 'revisar' && sugestoes && (
        <div className="space-y-5">
          <p className="text-[13px] text-muted">
            Revise as sugestões da IA para cada dia. Desmarque o que não quiser incluir.
          </p>

          {diasOrdenados.map((dia) => {
            const data = dia.data
            const date = new Date(data + 'T00:00:00')
            const diaSemana = DIAS_SEMANA[date.getDay()]
            const atrsExistentes = atracoesPorDia[data] || []
            const temDiaInteiro = atrsExistentes.some((a) => a.ocupa_dia_inteiro)
            const sugs = sugestoes[data] || []
            const sel = selecionadas[data] || new Set()

            return (
              <div key={data} className="bg-fill rounded-ios overflow-hidden">
                {/* Cabeçalho do dia */}
                <div className="px-4 py-3 flex items-center gap-3 border-b border-separator">
                  <div className="w-10 h-10 rounded-full bg-blue/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-blue" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[15px]">
                      {diaSemana}, {date.getDate()}/{date.getMonth() + 1}
                    </p>
                    <p className="text-[12px] text-muted">
                      {atrsExistentes.length} {atrsExistentes.length !== 1 ? 'atrações existentes' : 'atração existente'}
                      {temDiaInteiro && ' · dia bloqueado'}
                      {clima?.[data] && (
                        <span className="ml-2">
                          {clima[data].icone || ''} {clima[data].temp}°C
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="text-[13px] font-semibold text-muted">{sugs.length} sugestões</span>
                </div>

                {/* Conteúdo */}
                {temDiaInteiro ? (
                  <div className="px-4 py-3 text-[13px] text-orange flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Dia bloqueado — {atrsExistentes.find((a) => a.ocupa_dia_inteiro)?.nome || 'atração de dia inteiro'}
                  </div>
                ) : sugs.length === 0 ? (
                  <div className="px-4 py-3 text-[13px] text-muted">Nenhuma sugestão para este dia.</div>
                ) : (
                  <div className="divide-y divide-separator">
                    {sugs.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => toggleAtracao(data, i)}
                        className="tap-scale w-full flex items-center gap-3 px-4 py-3 text-left"
                      >
                        {/* Checkbox */}
                        <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          sel.has(i) ? 'bg-blue border-blue text-white' : 'border-muted2'
                        }`}>
                          {sel.has(i) && <Check className="w-4 h-4" />}
                        </span>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-[14px] truncate">{s.nome}</p>
                            {s.precisa_reserva && (
                              <span className="text-[10px] font-semibold text-orange bg-orange/10 px-1.5 py-0.5 rounded-full flex-shrink-0">reserva</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[11px] text-muted2 bg-card px-1.5 py-0.5 rounded-full">
                              {LABEL_CATEGORIA[s.categoria] || s.categoria}
                            </span>
                            {s.horario_sugerido && (
                              <span className="text-[11px] text-muted2 flex items-center gap-0.5">
                                <Clock className="w-3 h-3" /> {s.horario_sugerido}
                              </span>
                            )}
                            {s.custo_estimado_eur > 0 && (
                              <span className="text-[11px] text-muted2">{simboloMoeda(moeda || 'EUR')}{s.custo_estimado_eur}</span>
                            )}
                            {s.custo_estimado_eur === 0 && (
                              <span className="text-[11px] text-green">grátis</span>
                            )}
                            {s.latitude && (
                              <span className="text-[11px] text-blue flex items-center gap-0.5">
                                <MapPin className="w-3 h-3" /> localizado
                              </span>
                            )}
                          </div>
                          {s.descricao && (
                            <p className="text-[12px] text-muted mt-1 leading-snug">{s.descricao}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="tap-scale flex-1 py-3 rounded-ios font-semibold text-[15px] bg-fill text-text">
              Cancelar
            </button>
            <button
              onClick={handleAdicionar}
              disabled={totalSelecionadas === 0 || salvando}
              className="tap-scale flex-1 py-3 rounded-ios font-semibold text-[15px] bg-blue text-white disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {salvando ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Adicionando...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Adicionar {totalSelecionadas} {totalSelecionadas !== 1 ? 'atrações' : 'atração'}</>
              )}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
