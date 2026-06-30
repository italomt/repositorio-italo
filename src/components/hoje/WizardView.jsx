import { useState } from 'react'
import { Plane, MapPin, Bed, ArrowRight, ArrowLeft, Sparkles, Search } from 'lucide-react'

const TIPOS = [
  { id: 'lazer', label: 'Lazer', icon: '🌴' },
  { id: 'trabalho', label: 'Trabalho', icon: '💼' },
  { id: 'mochilao', label: 'Mochilão', icon: '🎒' },
  { id: 'familia', label: 'Família', icon: '👨‍👩‍👧‍👦' },
  { id: 'fds', label: 'Fim de semana', icon: '🗓️' },
]

export default function WizardView({ onCriarViagem }) {
  const [passo, setPasso] = useState(1)
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState('lazer')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [cidade, setCidade] = useState('')
  const [diasCidade, setDiasCidade] = useState(3)
  const [tipoHotel, setTipoHotel] = useState('')
  const [transporte, setTransporte] = useState('')
  const [criando, setCriando] = useState(false)

  function handleFinalizar() {
    setCriando(true)
    const data = {
      nome: nome || `${cidade} · ${new Date(dataInicio + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`,
      tipo,
      data_inicio: dataInicio,
      data_fim: dataFim,
      primeira_cidade: cidade,
      dias_na_cidade: diasCidade,
      hotel_nome: tipoHotel || null,
      transporte: transporte || null,
    }
    onCriarViagem(data).finally(() => setCriando(false))
  }

  function podeAvancar() {
    if (passo === 1) return true
    if (passo === 2) return dataInicio && dataFim
    if (passo === 3) return cidade.trim().length > 0
    if (passo === 4) return true
    return true
  }

  return (
    <div className="flex flex-col min-h-[80vh]">
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
        {passo === 1 && (
          <>
            <span className="text-5xl mb-6">✈️</span>
            <h1 className="font-display text-[28px] font-bold tracking-tight mb-2">Vamos planejar sua viagem?</h1>
            <p className="text-muted text-[16px] mb-8">Responda algumas perguntas e a IA monta o roteiro pra você.</p>
            <div className="w-full space-y-3">
              <button onClick={() => setPasso(2)} className="tap-scale w-full py-4 rounded-ios bg-blue text-white font-semibold text-[16px]">
                Começar <ArrowRight className="w-5 h-5 inline-block ml-1" />
              </button>
              <button onClick={() => setPasso(2)} className="tap-scale w-full py-3 text-[15px] text-muted">
                Pular — preencher depois
              </button>
            </div>
          </>
        )}

        {passo === 2 && (
          <>
            <span className="text-4xl mb-6">📅</span>
            <h2 className="font-display text-[24px] font-bold tracking-tight mb-1">Quando você vai?</h2>
            <p className="text-muted text-[14px] mb-8">Escolha as datas da sua viagem</p>
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
                const diff = Math.ceil((new Date(dataFim + 'T00:00:00') - new Date(dataInicio + 'T00:00:00')) / (1000*60*60*24))
                return diff > 0 && <p className="text-[15px] text-blue font-medium">{diff} dia{diff !== 1 ? 's' : ''} de viagem</p>
              })()}
            </div>
          </>
        )}

        {passo === 3 && (
          <>
            <span className="text-4xl mb-6">📍</span>
            <h2 className="font-display text-[24px] font-bold tracking-tight mb-1">Qual seu primeiro destino?</h2>
            <p className="text-muted text-[14px] mb-8">A cidade onde você vai começar a viagem</p>
            <div className="w-full text-left space-y-4">
              <div>
                <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Cidade</label>
                <div className="relative mt-1">
                  <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    autoFocus
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    placeholder="Ex: Lisboa, Paris, Tóquio..."
                    className="w-full bg-fill rounded-ios pl-11 pr-4 py-3 text-[16px] font-sans placeholder:text-muted"
                  />
                </div>
              </div>
              <div>
                <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Quantos dias?</label>
                <div className="flex gap-2 mt-1">
                  {[1,2,3,4,5,7,10].map((n) => (
                    <button key={n} onClick={() => setDiasCidade(n)} className={`tap-scale flex-1 py-2 rounded-full text-[14px] font-semibold ${diasCidade === n ? 'bg-blue text-white' : 'bg-fill text-text'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {passo === 4 && (
          <>
            <span className="text-4xl mb-6">🏨</span>
            <h2 className="font-display text-[24px] font-bold tracking-tight mb-1">Onde vai ficar em {cidade}?</h2>
            <p className="text-muted text-[14px] mb-8">Depois você pode adicionar mais detalhes</p>
            <div className="w-full space-y-3">
              <input
                value={tipoHotel}
                onChange={(e) => setTipoHotel(e.target.value)}
                placeholder="Nome do hotel ou Airbnb (opcional)"
                className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans placeholder:text-muted text-left"
              />
              <button onClick={() => setPasso(5)} className="tap-scale w-full py-3 text-[15px] text-muted">
                Ainda não sei — pular
              </button>
            </div>
          </>
        )}

        {passo === 5 && (
          <>
            <span className="text-4xl mb-6">🚆</span>
            <h2 className="font-display text-[24px] font-bold tracking-tight mb-1">Como vai chegar em {cidade}?</h2>
            <p className="text-muted text-[14px] mb-8">Escolha o meio de transporte principal</p>
            <div className="w-full grid grid-cols-2 gap-3">
              {[
                { id: 'aviao', label: 'Avião', icon: '✈️' },
                { id: 'trem', label: 'Trem', icon: '🚄' },
                { id: 'carro', label: 'Carro', icon: '🚗' },
                { id: 'onibus', label: 'Ônibus', icon: '🚌' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTransporte(t.id)}
                  className={`tap-scale flex flex-col items-center gap-2 py-4 rounded-ios ${transporte === t.id ? 'bg-blue text-white' : 'bg-fill text-text'}`}
                >
                  <span className="text-2xl">{t.icon}</span>
                  <span className="text-[13px] font-semibold">{t.label}</span>
                </button>
              ))}
            </div>
            <button onClick={handleFinalizar} className="tap-scale w-full py-3 text-[15px] text-muted mt-3">
              Ainda não sei — pular
            </button>
          </>
        )}
      </div>

      <div className="flex items-center justify-between px-4 py-4 border-t border-separator mt-auto">
        {passo > 1 ? (
          <button onClick={() => setPasso(passo - 1)} className="tap-scale flex items-center gap-1 text-muted font-medium text-[15px]">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
        ) : <div />}

        <div className="flex gap-1.5">
          {[1,2,3,4,5].map((s) => (
            <div key={s} className={`w-2 h-2 rounded-full transition-colors duration-200 ${s === passo ? 'bg-blue' : 'bg-fill'}`} />
          ))}
        </div>

        {passo < 5 ? (
          <button onClick={() => setPasso(passo + 1)} disabled={!podeAvancar()} className="tap-scale flex items-center gap-1 text-blue font-semibold text-[15px] disabled:opacity-30">
            {passo === 1 ? 'Começar' : 'Próximo'} <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={handleFinalizar} disabled={criando} className="tap-scale flex items-center gap-1 text-blue font-semibold text-[15px]">
            {criando ? 'Criando...' : <>Criar viagem <Sparkles className="w-4 h-4" /></>}
          </button>
        )}
      </div>
    </div>
  )
}
