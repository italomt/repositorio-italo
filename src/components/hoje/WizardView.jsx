import { useState } from 'react'
import { Plane, MapPin, Bed, ArrowRight, ArrowLeft, Sparkles, Calendar, Building2 } from 'lucide-react'
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
  const [maisCidades, setMaisCidades] = useState(null) // null = não respondido, true/false
  const [totalCidades, setTotalCidades] = useState(1)
  const [cidadesExtras, setCidadesExtras] = useState([]) // [{ nome, pais, flag, dias }]
  const [hotelNome, setHotelNome] = useState('')
  const [transporte, setTransporte] = useState('')
  const [criando, setCriando] = useState(false)

  async function handleFinalizar() {
    setCriando(true)
    const nome = cidade
      ? `${cidade} · ${new Date(dataInicio + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`
      : 'Nova Viagem'

    await onCriarViagem({
      nome,
      tipo,
      data_inicio: dataInicio || new Date().toISOString().slice(0, 10),
      data_fim: dataFim || dataInicio || new Date().toISOString().slice(0, 10),
      cidade,
      pais,
      flag_emoji: flagEmoji,
      dias_na_cidade: diasCidade,
      cidades_extras: cidadesExtras.filter((c) => c.nome && c.pais),
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
      const totalDiasCidades = cidadesExtras.reduce((s, c) => s + c.dias, 0)
      const todasPreenchidas = cidadesExtras.every((c) => c.nome && c.pais)
      return todasPreenchidas && totalDiasCidades === totalDias
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
                  onClick={() => setMaisCidades(true)}
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
                {/* Número de cidades */}
                {cidadesExtras.length === 0 ? (
                  <div>
                    <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Quantas cidades no total?</label>
                    <div className="grid grid-cols-4 gap-2 mt-1">
                      {Array.from({ length: Math.min(6, Math.floor(totalDias / 2)) }, (_, i) => i + 2).map((n) => (
                        <button
                          key={n}
                          onClick={() => {
                            setTotalCidades(n)
                            const diasPrimeira = Math.ceil(totalDias / n)
                            setDiasCidade(diasPrimeira)
                            iniciarCidadesExtras(n)
                          }}
                          className={`tap-scale py-3 rounded-ios text-[15px] font-semibold ${totalCidades === n ? 'bg-blue text-white' : 'bg-fill text-text'}`}
                        >
                          {n}
                          <span className="block text-[10px] opacity-70">~{Math.floor(totalDias / n)}d cada</span>
                        </button>
                      ))}
                    </div>
                    <button onClick={() => { setMaisCidades(null); setCidadesExtras([]) }} className="tap-scale w-full py-2 text-[13px] text-muted mt-2">
                      Voltar
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Cidade 1 (principal) */}
                    <div className="bg-fill rounded-ios p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{flagEmoji}</span>
                        <span className="font-semibold text-[15px]">{cidade}, {pais}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setDiasCidade(Math.max(1, diasCidade - 1))} className="tap-scale w-8 h-8 rounded-full bg-card flex items-center justify-center text-muted font-bold">−</button>
                        <span className="font-semibold tabular-nums w-8 text-center">{diasCidade}</span>
                        <button onClick={() => setDiasCidade(diasCidade + 1)} className="tap-scale w-8 h-8 rounded-full bg-card flex items-center justify-center text-muted font-bold">+</button>
                        <span className="text-[13px] text-muted ml-2">dia{diasCidade !== 1 ? 's' : ''}</span>
                        <span className="text-[12px] text-blue font-medium ml-auto tabular-nums">
                          {new Date(dataInicio + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} → {(() => {
                            const fim = new Date(dataInicio + 'T00:00:00')
                            fim.setDate(fim.getDate() + diasCidade - 1)
                            return fim.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                          })()}
                        </span>
                      </div>
                    </div>

                    {/* Cidades extras */}
                    {cidadesExtras.map((c, i) => {
                      const diasAntes = diasCidade + cidadesExtras.slice(0, i).reduce((s, cx) => s + cx.dias, 0)
                      const inicio = new Date(dataInicio + 'T00:00:00')
                      inicio.setDate(inicio.getDate() + diasAntes)
                      const fim = new Date(inicio)
                      fim.setDate(fim.getDate() + c.dias - 1)
                      return (
                      <div key={i} className="bg-fill rounded-ios p-3">
                        <div className="mb-2">
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
                          {c.nome && c.pais && (
                            <p className="text-[13px] text-muted mt-1">{c.flag} {c.nome}, {c.pais}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => {
                            const novo = [...cidadesExtras]
                            novo[i] = { ...novo[i], dias: Math.max(1, novo[i].dias - 1) }
                            setCidadesExtras(novo)
                          }} className="tap-scale w-8 h-8 rounded-full bg-card flex items-center justify-center text-muted font-bold">−</button>
                          <span className="font-semibold tabular-nums w-8 text-center">{c.dias}</span>
                          <button onClick={() => {
                            const novo = [...cidadesExtras]
                            novo[i] = { ...novo[i], dias: novo[i].dias + 1 }
                            setCidadesExtras(novo)
                          }} className="tap-scale w-8 h-8 rounded-full bg-card flex items-center justify-center text-muted font-bold">+</button>
                          <span className="text-[12px] text-blue font-medium ml-auto tabular-nums">
                            {inicio.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} → {fim.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          </span>
                          <button onClick={() => {
                            setCidadesExtras(cidadesExtras.filter((_, j) => j !== i))
                            setTotalCidades(totalCidades - 1)
                          }} className="tap-scale w-7 h-7 rounded-full bg-red/10 flex items-center justify-center ml-1">
                            <span className="text-red text-sm">✕</span>
                          </button>
                        </div>
                      </div>
                      )
                    })}

                    {/* Total */}
                    {(() => {
                      const soma = diasCidade + cidadesExtras.reduce((s, c) => s + c.dias, 0)
                      const diasRestantes = totalDias - soma
                      const ok = soma === totalDias
                      return (
                        <div className={`text-center py-2 rounded-ios ${ok ? 'bg-green/5' : 'bg-red/5'}`}>
                          <p className={`text-[14px] font-semibold ${ok ? 'text-green' : 'text-red'}`}>
                            Total: {soma} de {totalDias} dia{totalDias !== 1 ? 's' : ''}
                            {!ok && (diasRestantes > 0 ? ` (faltam ${diasRestantes})` : ` (${Math.abs(diasRestantes)} a mais)`)}
                          </p>
                          {diasRestantes > 0 && (
                            <button
                              onClick={() => {
                                setCidadesExtras([...cidadesExtras, { nome: '', pais: '', flag: '', dias: diasRestantes }])
                                setTotalCidades(totalCidades + 1)
                              }}
                              className="tap-scale mt-1 px-4 py-1.5 rounded-full bg-blue/10 text-blue text-[13px] font-semibold"
                            >
                              + Adicionar cidade ({diasRestantes} dia{diasRestantes !== 1 ? 's' : ''} restante{diasRestantes !== 1 ? 's' : ''})
                            </button>
                          )}
                        </div>
                      )
                    })()}

                    <button onClick={() => { setMaisCidades(null); setCidadesExtras([]); setTotalCidades(1) }} className="tap-scale w-full py-2 text-[13px] text-muted">
                      Voltar e refazer
                    </button>
                  </>
                )}
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
