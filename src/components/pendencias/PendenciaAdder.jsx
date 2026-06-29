import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { AlertTriangle } from 'lucide-react'

const URGENCIAS = ['alta', 'media', 'baixa']
const CATEGORIAS = [
  { id: 'transporte', label: 'Transporte' },
  { id: 'atracoes', label: 'Atrações' },
  { id: 'documentacao', label: 'Documentação' },
]
const CONTEXTOS = [
  { id: 'viagem', label: 'Viagem', desc: 'Vale para toda a trip' },
  { id: 'cidade', label: 'Cidade', desc: 'Específico de uma cidade' },
  { id: 'dia', label: 'Dia', desc: 'Vinculado a um dia específico' },
]

export default function PendenciaAdder({ aberto, onClose, onSalvar, contextoPadrao, valoresPadrao }) {
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
    if (contexto === 'cidade' && !contextoId) { setErro('Selecione uma cidade.'); return }
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
        concluida: false,
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

  return (
    <Modal aberto={aberto} onClose={fecharTudo} titulo="Nova pendência">
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
          <div className="flex gap-2 mt-1 mb-2">
            {CONTEXTOS.map((c) => (
              <button
                key={c.id}
                onClick={() => { setContexto(c.id); setContextoId(c.id === 'viagem' ? 'viagem' : '') }}
                className={`tap-scale flex-1 py-2.5 rounded-ios text-[12px] font-semibold ${contexto === c.id ? 'bg-blue text-white' : 'bg-fill text-text'}`}
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
        </div>
        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Data limite</label>
          <input
            type="date"
            value={prazo}
            onChange={(e) => setPrazo(e.target.value)}
            className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans leading-tight tabular-nums mt-1"
          />
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
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Urgência</label>
          <div className="flex gap-2 mt-1">
            {URGENCIAS.map((u) => (
              <button
                key={u}
                onClick={() => setUrgencia(u)}
                className={`tap-scale flex-1 py-2.5 rounded-ios text-[14px] font-semibold capitalize ${urgencia === u ? 'bg-blue text-white' : 'bg-fill text-text'}`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        {erro && <p className="text-[13px] text-red bg-red/10 rounded-ios px-3 py-2"><AlertTriangle className="w-4 h-4 inline-block mr-1" /> {erro}</p>}

        <Button className="w-full" onClick={handleSalvar} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Adicionar pendência'}
        </Button>
      </div>
    </Modal>
  )
}
