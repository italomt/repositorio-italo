import { useState, useMemo } from 'react'
import { Plane, MapPin, Bed, ArrowRight, ArrowLeft, Sparkles, Calendar, Building2, Plus } from 'lucide-react'
import CidadeAutocomplete from '../ui/CidadeAutocomplete'

const TIPOS = [
  { id: 'lazer', label: 'Lazer', icon: '🌴', desc: 'Museus, restaurantes, vida noturna' },
  { id: 'trabalho', label: 'Trabalho', icon: '💼', desc: 'Coworkings, cafés, happy hour' },
  { id: 'mochilao', label: 'Mochilão', icon: '🎒', desc: 'Hostels, natureza, atrações gratuitas' },
  { id: 'familia', label: 'Família', icon: '👨‍👩‍👧‍👦', desc: 'Parques, passeios, restaurantes casuais' },
]

export default function WizardView({ onCriarViagem, onClose }) {
  const [passo, setPasso] = useState(1)
  const [tipo, setTipo] = useState('lazer')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [cidade, setCidade] = useState('')
  const [pais, setPais] = useState('')
  const [flagEmoji, setFlagEmoji] = useState('')
  const [diasCidade, setDiasCidade] = useState(3)
  const [maisCidades, setMaisCidades] = useState(null)
  const [totalCidades, setTotalCidades] = useState(1)
  const [cidadesExtras, setCidadesExtras] = useState([]) // [{ nome, pais, flag, dias }]
  const [cidadeAtiva, setCidadeAtiva] = useState(0) // 0 = primeira cidade, 1+ = extras
  const [atribuicoes, setAtribuicoes] = useState({})

  const datasViagem = useMemo(() => {
    if (!dataInicio || !dataFim) return []
    const datas = []
    const ini = new Date(dataInicio + 'T00:00:00')
    const fim = new Date(dataFim + 'T00:00:00')
    for (let d = new Date(ini); d <= fim; d.setDate(d.getDate() + 1)) {
      datas.push(new Date(d).toISOString().slice(0, 10))
    }
    return datas
  }, [dataInicio, dataFim])
  const [hotelNome, setHotelNome] = useState('')
  const [transporte, setTransporte] = useState('')
  const [criando, setCriando] = useState(false)

  async function handleFinalizar() {
    setCriando(true)
    const nome = cidade
      ? `${cidade} · ${new Date(dataInicio + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`
      : 'Nova Viagem'

    // Computa dias por cidade a partir das atribuicoes
    const diasPorCidade = {}
    Object.values(atribuicoes).forEach((idx) => { diasPorCidade[idx] = (diasPorCidade[idx] || 0) + 1 })
    const diasPrimeira = diasPorCidade[0] || totalDias
    const extras = cidadesExtras.map((c, i) => ({
      ...c,
      dias: diasPorCidade[i + 1] || 0,
    })).filter((c) => c.dias > 0)

    await onCriarViagem({
      nome,
      tipo,
      data_inicio: dataInicio || new Date().toISOString().slice(0, 10),
      data_fim: dataFim || dataInicio || new Date().toISOString().slice(0, 10),
      cidade,
      pais,
      flag_emoji: flagEmoji,
      dias_na_cidade: diasPrimeira,
      cidades_extras: extras,
      hotel_nome: hotelNome || null,
      transporte: transporte || null,
    })
    setCriando(false)
  }

  function podeAvancar() {
    if (passo === 1) return !!tipo
    if (passo === 2) return dataInicio && dataFim && dataFim >= dataInicio
    if (passo === 3) return cidade.trim().length > 0 && pais.trim().length > 0
    if (passo === 4 && maisCidades === true) {
      if (cidadesExtras.length === 0) return false
      const todasNomeadas = cidadesExtras.every((c) => c.nome && c.pais)
      const todasAtribuidas = Object.keys(atribuicoes).length === totalDias
      return todasNomeadas && todasAtribuidas
    }
    if (passo === 4) return maisCidades !== null
    return true
  }

  const totalDias = dataInicio && dataFim
    ? Math.ceil((new Date(dataFim + 'T00:00:00') - new Date(dataInicio + 'T00:00:00')) / (1000 * 60 * 60 * 24)) + 1
    : 0

  const diasPorCidade = totalCidades > 0 ? Math.floor(totalDias / totalCidades) : totalDias

  function iniciarCidadesExtras(n) {
    const resto = totalDias - diasCidade
    const diasPorExtra = n > 1 ? Math.floor(resto / (n - 1)) : resto
    const arr = []
    for (let i = 1; i < n; i++) {
      arr.push({ nome: '', pais: '', flag: '', dias: i === n - 1 ? resto - diasPorExtra * (n - 2) : diasPorExtra })
    }
    setCidadesExtras(arr)
  }

  const totalPassos = 6

  return (
    <div className="flex flex-col min-h-[80vh]">
      {/* Header com fechar */}
      <div className="flex items-center justify-between px-4 pt-4">
        <span className="text-[13px] text-muted font-medium">{passo}/{totalPassos}</span>
        {onClose && (
          <button onClick={onClose} className="tap-scale w-11 h-11 rounded-full bg-fill flex items-center justify-center text-muted">✕</button>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
        {/* Passo 1: Boas-vindas + tipo */}
        {passo === 1 && (
          <>
            <span className="text-5xl mb-6">✈️</span>
            <h1 className="font-display text-[28px] font-bold tracking-tight mb-2">Vamos planejar?</h1>
            <p className="text-muted text-[16px] mb-2">Que tipo de viagem você quer fazer?</p>
            <p className="text-[13px] text-muted2 mb-6">A IA usa isso para montar o melhor roteiro pra você.</p>
            <div className="w-full grid grid-cols-2 gap-3 mb-2">
              {TIPOS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTipo(t.id)}
                  className={`tap-scale flex flex-col items-center gap-1.5 py-5 rounded-ios ${tipo === t.id ? 'bg-blue text-white' : 'bg-fill text-text'}`}
                >
                  <span className="text-3xl">{t.icon}</span>
                  <span className="text-[14px] font-semibold">{t.label}</span>
                  <span className={`text-[11px] ${tipo === t.id ? 'text-white/70' : 'text-muted'}`}>{t.desc}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Passo 2: Datas */}
        {passo === 2 && (
          <>
            <Calendar className="w-10 h-10 text-blue mb-4" />
            <h2 className="font-display text-[24px] font-bold tracking-tight mb-1">Quando vai?</h2>
            <p className="text-muted text-[14px] mb-8">Escolha as datas da viagem</p>
            <div className="w-full space-y-4">
              <div className="text-left">
                <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Ida</label>
                <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans mt-1" />
              </div>
              <div className="text-left">
                <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Volta</label>
                <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans mt-1" />
              </div>
              {dataInicio && dataFim && (() => {
                const diff = Math.ceil((new Date(dataFim + 'T00:00:00') - new Date(dataInicio + 'T00:00:00')) / (1000*60*60*24)) + 1
                if (diff <= 0) return <p className="text-[14px] text-red font-medium">A data de volta deve ser maior que a de ida</p>
                return <p className="text-[15px] text-blue font-medium">{diff} dia{diff !== 1 ? 's' : ''} de viagem</p>
              })()}
            </div>
          </>
        )}

        {/* Passo 3: Primeiro destino */}
        {passo === 3 && (
          <>
            <MapPin className="w-10 h-10 text-blue mb-4" />
            <h2 className="font-display text-[24px] font-bold tracking-tight mb-1">Primeiro destino</h2>
            <p className="text-muted text-[14px] mb-8">Onde você começa?</p>
            <div className="w-full text-left space-y-4">
              <div>
                <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Cidade</label>
                <div className="mt-1">
                  <CidadeAutocomplete
                    value={cidade}
                    onChange={setCidade}
                    onSelecionarLugar={({ cidade: c, pais: p, flagEmoji: f }) => {
                      setCidade(c)
                      setPais(p)
                      setFlagEmoji(f)
                    }}
                  />
                </div>
              </div>
              {pais && (
                <p className="text-[15px] text-muted flex items-center gap-2">
                  <span>{flagEmoji}</span> {cidade}, {pais}
                </p>
              )}
            </div>
          </>
        )}

        {/* Passo 4: Quantas cidades? */}
        {passo === 4 && (
          <>
            <MapPin className="w-10 h-10 text-blue mb-4" />
            <h2 className="font-display text-[24px] font-bold tracking-tight mb-1">
              {totalDias} dia{totalDias !== 1 ? 's' : ''} em {cidade}?
            </h2>
            <p className="text-muted text-[14px] mb-6">
              Sua viagem tem {totalDias} dia{totalDias !== 1 ? 's' : ''}. Vai visitar outras cidades?
            </p>

            {!maisCidades && (
              <div className="w-full space-y-3">
                <button
                  onClick={() => { setMaisCidades(false); setDiasCidade(totalDias); setTotalCidades(1) }}
                  className="tap-scale w-full py-5 rounded-ios bg-blue text-white flex flex-col items-center gap-1"
                >
                  <span className="text-2xl">{flagEmoji || '📍'}</span>
                  <span className="text-[15px] font-semibold">Só {cidade}</span>
                  <span className="text-[12px] opacity-70">
                    {new Date(dataInicio + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} → {new Date(dataFim + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} · {totalDias} dia{totalDias !== 1 ? 's' : ''}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setMaisCidades(true)
                    // Inicializa todas as datas na cidade 0
                    const atr = {}
                    datasViagem.forEach((d) => { atr[d] = 0 })
                    setAtribuicoes(atr)
                  }}
                  className="tap-scale w-full py-5 rounded-ios bg-fill text-text flex flex-col items-center gap-1"
                >
                  <Building2 className="w-6 h-6" />
                  <span className="text-[15px] font-semibold">Vou visitar mais cidades</span>
                  <span className="text-[12px] opacity-70">Planejar roteiro com várias cidades</span>
                </button>
              </div>
            )}

            {maisCidades === true && (
              <div className="w-full space-y-4">
                <div className="bg-fill rounded-ios p-3">
                  <div className="flex items-center gap-2 mb-3 pl-2 border-l-2 border-l-blue-500">
                    <span className="text-lg">{flagEmoji}</span>
                    <span className="font-semibold text-[15px]">{cidade}, {pais}</span>
                    <span className="text-[12px] text-muted ml-auto">
                      {Object.values(atribuicoes).filter((v) => v === 0).length} dia{Object.values(atribuicoes).filter((v) => v === 0).length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Cidades extras já adicionadas */}
                  {cidadesExtras.map((c, i) => {
                    const bordas = ['', 'border-l-orange-500', 'border-l-green-500', 'border-l-purple-500', 'border-l-pink-500', 'border-l-teal-500']
                    return (
                    <div key={i} className={`mb-2 pl-2 border-l-2 ${bordas[i + 1] || 'border-l-blue/30'}`}>
                      {c.nome && c.pais ? (
                        <div className="flex items-center gap-2">
                          <span>{c.flag}</span>
                          <span className="text-[14px] font-medium">{c.nome}</span>
                          <span className="text-[12px] text-muted ml-auto">
                            {Object.values(atribuicoes).filter((v) => v === i + 1).length} dia{Object.values(atribuicoes).filter((v) => v === i + 1).length !== 1 ? 's' : ''}
                          </span>
                          <button onClick={() => {
                            setCidadesExtras(cidadesExtras.filter((_, j) => j !== i))
                            const novo = { ...atribuicoes }
                            Object.keys(novo).forEach((d) => { if (novo[d] === i + 1) novo[d] = 0 })
                            Object.keys(novo).forEach((d) => { if (novo[d] > i + 1) novo[d]-- })
                            setAtribuicoes(novo)
                          }} className="tap-scale w-8 h-8 rounded-full bg-red/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-red text-sm">✕</span>
                          </button>
                        </div>
                      ) : (
                        <CidadeAutocomplete
                          value={c.nome}
                          onChange={(nome) => {
                            const novo = [...cidadesExtras]
                            novo[i] = { ...novo[i], nome }
                            setCidadesExtras(novo)
                          }}
                          onSelecionarLugar={({ cidade: nome, pais: p, flagEmoji: f }) => {
                            const novo = [...cidadesExtras]
                            novo[i] = { ...novo[i], nome, pais: p, flag: f }
                            setCidadesExtras(novo)
                          }}
                        />
                      )}
                    </div>
                    )
                  })}

                  {(() => {
                    const diasLivres = Object.values(atribuicoes).filter((v) => v === -1 || v === undefined).length + 
                      (totalDias - Object.values(atribuicoes).length)
                    const diasAtribuidos = Object.values(atribuicoes).length
                    return diasLivres > 0 && (
                      <button
                        onClick={() => {
                          setCidadesExtras([...cidadesExtras, { nome: '', pais: '', flag: '', dias: 0 }])
                        }}
                        className="tap-scale w-full py-2 rounded-ios bg-blue/5 text-blue text-[13px] font-semibold flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Adicionar cidade
                      </button>
                    )
                  })()}
                </div>

                {/* Seletor de cidade ativa */}
                <div>
                  <label className="text-[12px] text-muted font-semibold uppercase tracking-wide mb-2 block">
                    Atribuir datas para:
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      onClick={() => setCidadeAtiva(0)}
                      className={`tap-scale px-3 py-1.5 rounded-full text-[13px] font-semibold ${cidadeAtiva === 0 ? 'bg-blue text-white' : 'bg-blue/10 text-blue'}`}
                    >
                      {cidade.split(' ')[0]}
                    </button>
                    {cidadesExtras.map((c, i) => {
                      const coresBtn = ['', 'bg-orange/10 text-orange', 'bg-green/10 text-green', 'bg-purple/10 text-purple', 'bg-pink/10 text-pink', 'bg-teal/10 text-teal']
                      const coresBtnAtivo = ['', 'bg-orange text-white', 'bg-green text-white', 'bg-purple text-white', 'bg-pink text-white', 'bg-teal text-white']
                      return (
                      <div key={i} className="flex items-center gap-0.5">
                        <button
                          onClick={() => setCidadeAtiva(i + 1)}
                          className={`tap-scale px-3 py-1.5 rounded-full text-[13px] font-semibold ${cidadeAtiva === i + 1 ? coresBtnAtivo[i + 1] || 'bg-fill text-text' : coresBtn[i + 1] || 'bg-fill text-text'}`}
                        >
                          {c.nome ? c.nome.split(' ')[0] : `Cidade ${i + 2}`}
                        </button>
                        <button
                          onClick={() => {
                            setCidadesExtras(cidadesExtras.filter((_, j) => j !== i))
                            const novo = { ...atribuicoes }
                            Object.keys(novo).forEach((d) => { if (novo[d] === i + 1) novo[d] = 0 })
                            Object.keys(novo).forEach((d) => { if (novo[d] > i + 1) novo[d]-- })
                            setAtribuicoes(novo)
                            if (cidadeAtiva === i + 1) setCidadeAtiva(0)
                            else if (cidadeAtiva > i + 1) setCidadeAtiva(cidadeAtiva - 1)
                          }}
                          className="tap-scale w-6 h-6 rounded-full bg-red/10 flex items-center justify-center flex-shrink-0"
                        >
                          <span className="text-red text-[10px] leading-none">✕</span>
                        </button>
                      </div>
                      )
                    })}
                  </div>
                </div>

                {/* Grade de datas estilo ViagemView */}
                <div className="flex flex-wrap gap-1.5 bg-fill rounded-ios p-3">
                  {datasViagem.map((data) => {
                    const idx = atribuicoes[data]
                    const d = new Date(data + 'T00:00:00')
                    const diaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getDay()]
                    const mes = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'][d.getMonth()]
                    const cores = [
                      'bg-blue text-white',
                      'bg-orange text-white',
                      'bg-green text-white',
                      'bg-purple text-white',
                      'bg-pink text-white',
                      'bg-teal text-white',
                    ]
                    const cor = idx !== undefined && idx >= 0 && idx < cores.length ? cores[idx] : 'bg-card text-muted2'
                    return (
                      <button
                        key={data}
                        onClick={() => {
                          const novo = { ...atribuicoes }
                          if (novo[data] === cidadeAtiva) {
                            delete novo[data] // desmarca
                          } else {
                            novo[data] = cidadeAtiva // atribui
                          }
                          setAtribuicoes(novo)
                        }}
                        className={`tap-scale flex-shrink-0 flex flex-col items-center px-3 py-1.5 rounded-xl transition-all ${cor}`}
                      >
                        <span className="text-[9px] font-semibold uppercase opacity-70">{diaSemana}</span>
                        <span className="text-[17px] font-bold font-display leading-tight">{d.getDate()}</span>
                        <span className="text-[8px] uppercase opacity-70">{mes}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Total */}
                {(() => {
                  const atribuidas = Object.keys(atribuicoes).length
                  const faltam = totalDias - atribuidas
                  return (
                    <div className="text-center py-2">
                      <p className="text-[14px] font-semibold text-text">
                        {atribuidas} de {totalDias} dia{totalDias !== 1 ? 's' : ''}
                        {faltam > 0 && ` (toque nos ${faltam} círculos restantes)`}
                      </p>
                    </div>
                  )
                })()}

                <button onClick={() => { setMaisCidades(null); setCidadesExtras([]); setAtribuicoes({}) }} className="tap-scale w-full py-2 text-[13px] text-muted">
                  Voltar e refazer
                </button>
              </div>
            )}
          </>
        )}

        {/* Passo 5: Hospedagem */}
        {passo === 5 && (
          <>
            <Bed className="w-10 h-10 text-blue mb-4" />
            <h2 className="font-display text-[24px] font-bold tracking-tight mb-1">Onde ficar em {cidade}?</h2>
            <p className="text-muted text-[14px] mb-8">Depois você adiciona mais detalhes</p>
            <div className="w-full space-y-3">
              <input
                autoFocus
                value={hotelNome}
                onChange={(e) => setHotelNome(e.target.value)}
                placeholder="Nome do hotel ou Airbnb (opcional)"
                className="w-full bg-fill rounded-ios px-4 py-3 text-[16px] font-sans placeholder:text-muted text-left"
              />
              <button onClick={() => { setHotelNome(''); setPasso(6) }} className="tap-scale w-full py-3 text-[15px] text-muted">
                Ainda não sei — pular
              </button>
            </div>
          </>
        )}

        {/* Passo 6: Transporte + criar */}
        {passo === 6 && (
          <>
            <Plane className="w-10 h-10 text-blue mb-4" />
            <h2 className="font-display text-[24px] font-bold tracking-tight mb-1">Como chegar?</h2>
            <p className="text-muted text-[14px] mb-8">Principal meio de transporte</p>
            <div className="w-full grid grid-cols-2 gap-3 mb-4">
              {[
                { id: 'aviao', label: 'Avião', icon: '✈️' },
                { id: 'trem', label: 'Trem', icon: '🚄' },
                { id: 'carro', label: 'Carro', icon: '🚗' },
                { id: 'onibus', label: 'Ônibus', icon: '🚌' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTransporte(t.id)}
                  className={`tap-scale flex flex-col items-center gap-2 py-5 rounded-ios ${transporte === t.id ? 'bg-blue text-white' : 'bg-fill text-text'}`}
                >
                  <span className="text-2xl">{t.icon}</span>
                  <span className="text-[13px] font-semibold">{t.label}</span>
                </button>
              ))}
            </div>
            <button onClick={handleFinalizar} className="tap-scale w-full py-4 rounded-ios bg-blue text-white font-semibold text-[16px] flex items-center justify-center gap-2">
              {criando ? 'Criando...' : <><Sparkles className="w-5 h-5" /> Criar viagem</>}
            </button>
          </>
        )}
      </div>

      {/* Navegação inferior */}
      <div className="flex items-center justify-between px-4 py-4 border-t border-separator mt-auto">
        {passo > 1 ? (
          <button onClick={() => setPasso(passo - 1)} className="tap-scale flex items-center gap-1 text-muted font-medium text-[15px]">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
        ) : <div />}

        <div className="flex gap-1.5">
          {Array.from({ length: totalPassos }, (_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-colors duration-200 ${i + 1 === passo ? 'bg-blue' : i + 1 < passo ? 'bg-blue/30' : 'bg-fill'}`} />
          ))}
        </div>

        {passo < totalPassos ? (
          <button onClick={() => setPasso(passo + 1)} disabled={!podeAvancar()} className="tap-scale flex items-center gap-1 text-blue font-semibold text-[15px] disabled:opacity-30">
            {passo === 1 ? 'Começar' : 'Próximo'} <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-20" />
        )}
      </div>
    </div>
  )
}
