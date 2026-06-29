import { useState } from 'react'
import Modal from '../ui/Modal'
import FormFooter from '../ui/FormFooter'
import DeleteSection from '../ui/DeleteSection'

const URGENCIAS = ['alta', 'media', 'baixa']
const CATEGORIAS = [
  { id: 'transporte', label: 'Transporte' },
  { id: 'atracoes', label: 'Atrações' },
  { id: 'documentacao', label: 'Documentação' },
]
const CONTEXTOS = [
  { id: 'viagem', label: 'Viagem' },
  { id: 'cidade', label: 'Cidade' },
  { id: 'dia', label: 'Dia' },
  { id: 'atracao', label: 'Atração' },
  { id: 'hospedagem', label: 'Hospedagem' },
  { id: 'transporte', label: 'Transporte' },
]

export default function PendenciaEditor({ aberto, onClose, pendencia, onSalvar, onExcluir, cidades = [], dias = [] }) {
  const [titulo, setTitulo] = useState(pendencia?.titulo ?? '')
  const [categoria, setCategoria] = useState(pendencia?.categoria ?? 'documentacao')
  const [contexto, setContexto] = useState(pendencia?.contexto_tipo ?? 'viagem')
  const [contextoId, setContextoId] = useState(pendencia?.contexto_id ?? 'viagem')
  const [prazo, setPrazo] = useState(pendencia?.prazo_sugerido ?? '')
  const [link, setLink] = useState(pendencia?.link ?? '')
  const [urgencia, setUrgencia] = useState(pendencia?.urgencia ?? 'media')
  const [salvando, setSalvando] = useState(false)

  if (!pendencia) return null

  async function handleSalvar() {
    setSalvando(true)
    await onSalvar(pendencia.id, {
      titulo,
      categoria,
      contexto_tipo: contexto,
      contexto_id: contexto === 'viagem' ? 'viagem' : contextoId,
      prazo_sugerido: prazo || null,
      link: link || null,
      urgencia,
    })
    setSalvando(false)
    onClose()
  }

  async function handleExcluir() {
    await onExcluir(pendencia.id)
    onClose()
  }

  return (
    <Modal aberto={aberto} onClose={onClose} titulo="Editar pendência">
      <div className="space-y-3">
        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Título</label>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans mt-1"
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
          <div className="grid grid-cols-3 gap-1.5 mt-1">
            {CONTEXTOS.map((c) => (
              <button
                key={c.id}
                onClick={() => { setContexto(c.id); if (c.id === 'viagem') setContextoId('viagem'); else setContextoId('') }}
                className={`tap-scale py-2.5 rounded-ios text-[11px] font-semibold ${contexto === c.id ? 'bg-blue text-white' : 'bg-fill text-text'}`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {contexto === 'cidade' && cidades.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
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
            <div className="space-y-1 max-h-44 overflow-y-auto mt-2">
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

          {contexto !== 'viagem' && (contexto === 'cidade' && cidades.length === 0 || contexto === 'dia' && dias.length === 0 || (contexto !== 'cidade' && contexto !== 'dia')) && (
            <input
              value={contextoId}
              onChange={(e) => setContextoId(e.target.value)}
              placeholder={contexto === 'cidade' ? 'Nome da cidade...' : contexto === 'dia' ? 'ID do dia...' : 'ID...'}
              className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans placeholder:text-muted mt-2"
            />
          )}
        </div>

        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Data limite</label>
          <input
            type="date"
            value={prazo ?? ''}
            onChange={(e) => setPrazo(e.target.value)}
            className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans leading-tight tabular-nums mt-1"
          />
        </div>
        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Link</label>
          <input
            value={link ?? ''}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
            className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] font-sans mt-1"
          />
        </div>
        <div>
          <label className="text-[12px] text-muted font-semibold uppercase tracking-wide">Urgência</label>
          <div className="flex gap-2 mt-1">
            {URGENCIAS.map((u) => (
              <button
                key={u}
                onClick={() => setUrgencia(u)}
                className={`tap-scale flex-1 py-2.5 rounded-ios text-[14px] font-semibold capitalize ${
                  urgencia === u ? 'bg-blue text-white' : 'bg-fill text-text'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        <FormFooter onSave={handleSalvar} saveLabel="Salvar alterações" saving={salvando} />

        <DeleteSection onDelete={handleExcluir} itemName="pendência" />
      </div>
    </Modal>
  )
}
