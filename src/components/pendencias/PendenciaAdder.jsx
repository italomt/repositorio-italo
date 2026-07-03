import { useState } from 'react'
import Modal from '../ui/Modal'
import FormFooter from '../ui/FormFooter'
import TravelPrioritySelector from '../ui/TravelPrioritySelector'
import TravelDatePicker from '../ui/TravelDatePicker'
import { AlertTriangle } from 'lucide-react'

const URGENCIAS = [
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Média' },
  { value: 'baixa', label: 'Baixa' },
]
const CATEGORIAS = [
  { id: 'transporte', label: 'Transporte' },
  { id: 'atracoes', label: 'Atrações' },
  { id: 'documentacao', label: 'Documentação' },
]
const CONTEXTOS = [
  { id: 'viagem', label: 'Viagem', desc: 'Vale para toda a trip' },
  { id: 'cidade', label: 'Cidade', desc: 'Específico de uma cidade' },
  { id: 'dia', label: 'Dia', desc: 'Vinculado a um dia específico' },
  { id: 'atracao', label: 'Atração', desc: 'Vinculado a uma atração' },
  { id: 'hospedagem', label: 'Hospedagem', desc: 'Vinculado a uma acomodação' },
  { id: 'transporte', label: 'Transporte', desc: 'Vinculado a um transporte' },
]

export default function PendenciaAdder({ aberto, onClose, onSalvar, contextoPadrao, valoresPadrao, bare }) {
  const [titulo, setTitulo] = useState(valoresPadrao?.titulo || '')
  const [categoria, setCategoria] = useState(valoresPadrao?.categoria || 'documentacao')
  const [prazo, setPrazo] = useState('')
  const [link, setLink] = useState(valoresPadrao?.link || '')
  const [urgencia, setUrgencia] = useState('media')
  const [contexto, setContexto] = useState(contextoPadrao?.tipo || 'viagem')
  const [contextoId, setContextoId] = useState(contextoPadrao?.id || '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)

  const cidades = contextoPadrao?.cidades || []
  const dias = contextoPadrao?.dias || []
  const atracoes = contextoPadrao?.atracoes || []
  const acomodacoes = contextoPadrao?.acomodacoes || []
  const transportes = contextoPadrao?.transportes || []

  function fecharTudo() {
    setTitulo('')
    setCategoria('documentacao')
    setPrazo('')
    setLink('')
    setUrgencia('media')
    setContexto(contextoPadrao?.tipo || 'viagem')
    setContextoId(contextoPadrao?.id || '')
    setErro(null)
    onClose()
  }

  async function handleSalvar() {
    if (!titulo.trim()) { setErro('Digite um título para a pendência.'); return }
    if ((contexto === 'cidade' || contexto === 'atracao' || contexto === 'hospedagem' || contexto === 'transporte') && !contextoId) { setErro('Selecione um item para vincular.'); return }
    if (contexto === 'dia' && !contextoId) { setErro('Selecione um dia.'); return }
    setSalvando(true)
    setErro(null)
    try {
      const resultado = await onSalvar({
        titulo: titulo.trim(),
        categoria,
        prazo_sugerido: prazo || null,
        link: link || null,
        urgencia,
        estado: 'aberta',
        contexto_tipo: contexto,
        contexto_id: contexto === 'viagem' ? 'viagem' : contextoId,
      })
      if (!resultado) { setErro('Erro inesperado ao salvar.'); setSalvando(false); return }
      const { error } = resultado
      setSalvando(false)
      if (error) { setErro(error.message); return }
      fecharTudo()
    } catch (e) {
      setErro(e?.message || 'Erro inesperado.')
      setSalvando(false)
    }
  }

  const conteudo = (
      <div className="space-y-3">
        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Título</label>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex: Comprar passagem de trem Paris→Lyon"
            className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans placeholder:text-muted mt-1"
          />
        </div>
        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Categoria</label>
          <div className="flex gap-2 mt-1">
            {CATEGORIAS.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategoria(c.id)}
                className={`tap-scale flex-1 py-2.5 rounded-ios text-[13px] font-semibold ${categoria === c.id ? 'bg-blue text-white' : 'bg-fill text-text'}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Vincular a</label>
          <div className="grid grid-cols-3 gap-1.5 mt-1 mb-2">
            {CONTEXTOS.map((c) => (
              <button
                key={c.id}
                onClick={() => { setContexto(c.id); setContextoId(c.id === 'viagem' ? 'viagem' : '') }}
                className={`tap-scale py-2.5 rounded-ios text-[11px] font-semibold ${contexto === c.id ? 'bg-blue text-white' : 'bg-fill text-text'}`}
              >
                {c.label}
                <span className={`block text-[9px] font-normal mt-0.5 ${contexto === c.id ? 'text-white/70' : 'text-muted'}`}>{c.desc}</span>
              </button>
            ))}
          </div>

          {contexto === 'cidade' && cidades.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {cidades.map((cid) => (
                <button
                  key={cid.nome}
                  onClick={() => setContextoId(cid.nome)}
                  className={`tap-scale px-3 py-1.5 rounded-full text-[13px] font-semibold ${contextoId === cid.nome ? 'bg-blue text-white shadow-sm' : 'bg-fill text-text'}`}
                >
                  {cid.flag} {cid.nome}
                </button>
              ))}
            </div>
          )}

          {contexto === 'cidade' && cidades.length === 0 && (
            <input
              value={contextoId}
              onChange={(e) => setContextoId(e.target.value)}
              placeholder="Ex: Lisboa, Paris..."
              className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans placeholder:text-muted"
            />
          )}

          {contexto === 'dia' && dias.length > 0 && (
            <div className="space-y-1 max-h-44 overflow-y-auto">
              {dias.map((d) => {
                const ativo = contextoId === d.id
                return (
                  <button
                    key={d.id}
                    onClick={() => setContextoId(d.id)}
                    className={`tap-scale w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left ${ativo ? 'bg-blue/10 text-blue' : 'text-text'}`}
                  >
                    <span className="text-lg">{d.flag}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold">{d.label}</p>
                      <p className="text-[12px] text-muted">{d.cidade}</p>
                    </div>
                    {ativo && <span className="w-3 h-3 rounded-full bg-blue flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
          )}

          {contexto === 'atracao' && atracoes.length > 0 && (
            <div className="space-y-1 max-h-44 overflow-y-auto">
              {atracoes.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setContextoId(a.id)}
                  className={`tap-scale w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left ${contextoId === a.id ? 'bg-blue/10 text-blue' : 'text-text'}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-blue/10 flex items-center justify-center text-sm">&#9830;</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold">{a.nome}</p>
                  </div>
                  {contextoId === a.id && <span className="w-3 h-3 rounded-full bg-blue flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}

          {contexto === 'hospedagem' && acomodacoes.length > 0 && (
            <div className="space-y-1 max-h-44 overflow-y-auto">
              {acomodacoes.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setContextoId(a.id)}
                  className={`tap-scale w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left ${contextoId === a.id ? 'bg-blue/10 text-blue' : 'text-text'}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-green/10 flex items-center justify-center text-sm">&#9733;</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold">{a.nome}</p>
                    <p className="text-[12px] text-muted">{a.cidade}</p>
                  </div>
                  {contextoId === a.id && <span className="w-3 h-3 rounded-full bg-blue flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}

          {contexto === 'transporte' && transportes.length > 0 && (
            <div className="space-y-1 max-h-44 overflow-y-auto">
              {transportes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setContextoId(t.id)}
                  className={`tap-scale w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left ${contextoId === t.id ? 'bg-blue/10 text-blue' : 'text-text'}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-orange/10 flex items-center justify-center text-sm">&#8594;</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold">{t.operadora || t.tipo}</p>
                    <p className="text-[12px] text-muted">{t.origem} &#8594; {t.destino}</p>
                  </div>
                  {contextoId === t.id && <span className="w-3 h-3 rounded-full bg-blue flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}

          {(contexto === 'atracao' || contexto === 'hospedagem' || contexto === 'transporte') && (atracoes.length + acomodacoes.length + transportes.length) === 0 && (
            <input
              value={contextoId}
              onChange={(e) => setContextoId(e.target.value)}
              placeholder={contexto === 'atracao' ? 'ID da atração...' : contexto === 'hospedagem' ? 'ID da acomodação...' : 'ID do transporte...'}
              className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans placeholder:text-muted"
            />
          )}
        </div>
        <div>
          <TravelDatePicker value={prazo} onChange={setPrazo} label="Data limite" />
        </div>
        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Link</label>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
            className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans placeholder:text-muted mt-1"
          />
        </div>
        <div>
          <TravelPrioritySelector value={urgencia} onChange={setUrgencia} options={URGENCIAS} label="Urgência" />
        </div>

        {erro && <p className="text-[13px] text-red bg-red/10 rounded-ios px-3 py-2"><AlertTriangle className="w-4 h-4 inline-block mr-1" /> {erro}</p>}

        <FormFooter onCancel={bare ? fecharTudo : undefined} onSave={handleSalvar} saveLabel="Adicionar pendência" saving={salvando} />
      </div>
  )

  if (bare) return conteudo

  return (
    <Modal aberto={aberto} onClose={fecharTudo} titulo="Nova pendência">
      {conteudo}
    </Modal>
  )
}
