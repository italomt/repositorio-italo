import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Sparkles, Send, Paperclip, Check, Search, Trash2, X } from 'lucide-react'
import { useViagem } from '../contexts/ViagemContext'
import { useDestinos } from '../hooks/useDestinos'
import { useAtracoes } from '../hooks/useAtracoes'
import { useAcomodacoes } from '../hooks/useAcomodacoes'
import { useGastos } from '../hooks/useGastos'
import { useTransportes } from '../hooks/useTransportes'
import { usePendencias } from '../hooks/usePendencias'
import { useDocumentos } from '../hooks/useDocumentos'
import { useAssistente } from '../hooks/useAssistente'

const SUGESTOES = [
  'O que fazer amanhã?',
  'Quanto já gastei?',
  'Algo que preciso reservar antes?',
  'Onde jantar perto da hospedagem?',
]

const LIMITE_ANEXO_MB = 8

function lerArquivo(file) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader()
    leitor.onload = () => resolve(leitor.result)
    leitor.onerror = reject
    leitor.readAsDataURL(file)
  })
}

function CardAcao({ acao, onDesfazer }) {
  if (acao.erro) {
    return (
      <div className="self-start max-w-[88%] bg-card border border-red/40 rounded-ios p-3 flex gap-2.5">
        <div className="w-5 h-5 rounded-full bg-red text-white flex items-center justify-center flex-shrink-0 mt-0.5">
          <X className="w-3 h-3" />
        </div>
        <p className="text-[13px] text-text">Não consegui salvar: {acao.erro}</p>
      </div>
    )
  }

  return (
    <div className={`self-start max-w-[88%] bg-card rounded-ios p-3 flex gap-2.5 shadow-ios ${acao.desfeita ? 'opacity-50' : ''}`}>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${acao.desfeita ? 'bg-muted2' : 'bg-green'} text-white`}>
        <Check className="w-3 h-3" strokeWidth={3} />
      </div>
      <div className="min-w-0">
        <p className={`text-[13px] font-semibold text-text ${acao.desfeita ? 'line-through' : ''}`}>{acao.titulo}</p>
        {acao.detalhe && <p className="text-[11px] text-muted mt-0.5">{acao.detalhe}</p>}
        {acao.desfeita ? (
          <span className="text-[11px] text-muted2 font-medium mt-1 inline-block">Desfeito</span>
        ) : (
          <button onClick={onDesfazer} className="tap-scale text-[11px] text-blue font-semibold mt-1">
            Desfazer
          </button>
        )}
      </div>
    </div>
  )
}

export default function Assistente() {
  const navigate = useNavigate()
  const { viagem, viagemId } = useViagem()
  const { destinos } = useDestinos(viagemId)
  const { atracoes } = useAtracoes(viagemId)
  const { acomodacoes } = useAcomodacoes(viagemId)
  const { gastos } = useGastos(viagemId)
  const { transportes } = useTransportes(viagemId)
  const { pendencias } = usePendencias(viagemId)
  const { documentos } = useDocumentos(viagemId)

  const contexto = useMemo(
    () => ({ viagem, destinos, atracoes, acomodacoes, gastos, transportes, pendencias, documentos }),
    [viagem, destinos, atracoes, acomodacoes, gastos, transportes, pendencias, documentos],
  )

  const { mensagens, pensando, enviar, desfazer, limpar } = useAssistente({ viagemId, contexto })
  const [texto, setTexto] = useState('')
  const [anexo, setAnexo] = useState(null)
  const fimRef = useRef(null)
  const inputArquivoRef = useRef(null)

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [mensagens.length, pensando])

  async function escolherArquivo(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (file.size > LIMITE_ANEXO_MB * 1024 * 1024) {
      alert(`Arquivo muito grande. O limite é ${LIMITE_ANEXO_MB}MB.`)
      return
    }

    const ehPdf = file.type === 'application/pdf'
    const ehImagem = file.type.startsWith('image/')
    if (!ehPdf && !ehImagem) {
      alert('Só aceito imagem ou PDF por enquanto.')
      return
    }

    setAnexo({
      tipo: ehPdf ? 'pdf' : 'imagem',
      nome: file.name,
      dataUrl: await lerArquivo(file),
    })
  }

  function submeter(e) {
    e?.preventDefault()
    if (pensando || (!texto.trim() && !anexo)) return
    enviar(texto.trim(), anexo)
    setTexto('')
    setAnexo(null)
  }

  const vazio = mensagens.length === 0

  return (
    <div className="flex flex-col min-h-[calc(100dvh-env(safe-area-inset-top))]">
      <div className="flex items-center gap-2.5 pb-3 border-b border-separator sticky top-0 bg-bg z-10">
        <button onClick={() => navigate(-1)} className="tap-scale -ml-2 p-1.5 text-muted" aria-label="Voltar">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0"
          style={{ background: 'linear-gradient(140deg, var(--purple), var(--blue))' }}
        >
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-bold text-[15px] text-text leading-tight">Assistente</h1>
          <p className="text-[11px] text-green font-medium">Sabe o seu roteiro inteiro</p>
        </div>
        {!vazio && (
          <button onClick={limpar} className="tap-scale p-1.5 text-muted2" aria-label="Limpar conversa">
            <Trash2 className="w-[18px] h-[18px]" />
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-2.5 py-4">
        {vazio && (
          <div className="text-center px-4 py-10">
            <div
              className="w-14 h-14 rounded-full mx-auto flex items-center justify-center text-white mb-3"
              style={{ background: 'linear-gradient(140deg, var(--purple), var(--blue))' }}
            >
              <Sparkles className="w-7 h-7" />
            </div>
            <p className="text-[15px] font-semibold text-text">Pergunta o que quiser da viagem</p>
            <p className="text-[13px] text-muted mt-1.5 leading-relaxed">
              Eu conheço seu roteiro, hospedagens e gastos. Também leio o PDF ou print da reserva e cadastro pra você.
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {mensagens.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col gap-2.5"
            >
              {m.papel === 'user' ? (
                <div className="self-end max-w-[82%] bg-blue text-white rounded-[17px] rounded-br-[5px] px-3.5 py-2.5 text-[13px] leading-relaxed">
                  {m.conteudo}
                </div>
              ) : (
                <>
                  {m.conteudo && (
                    <div className="self-start max-w-[82%] bg-card text-text rounded-[17px] rounded-bl-[5px] px-3.5 py-2.5 text-[13px] leading-relaxed shadow-ios whitespace-pre-wrap">
                      {m.conteudo}
                    </div>
                  )}
                  {m.acao && <CardAcao acao={m.acao} onDesfazer={() => desfazer(m)} />}
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {pensando && (
          <div className="self-start inline-flex items-center gap-1.5 bg-fill rounded-full px-3 py-1.5 text-[11px] text-muted font-medium">
            <Search className="w-3 h-3" />
            Pensando…
          </div>
        )}

        <div ref={fimRef} />
      </div>

      <div className="sticky bottom-0 bg-bg pt-2 pb-[max(8px,env(safe-area-inset-bottom))]">
        {vazio && (
          <div className="flex gap-1.5 flex-wrap pb-2">
            {SUGESTOES.map((s) => (
              <button
                key={s}
                onClick={() => enviar(s)}
                className="tap-scale bg-card border border-separator rounded-full px-3 py-1.5 text-[11px] text-text font-medium"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {anexo && (
          <div className="flex items-center gap-2 bg-fill rounded-ios px-3 py-2 mb-2">
            <Paperclip className="w-3.5 h-3.5 text-muted flex-shrink-0" />
            <span className="text-[12px] text-text truncate flex-1">{anexo.nome}</span>
            <button onClick={() => setAnexo(null)} className="tap-scale text-muted2" aria-label="Remover anexo">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={submeter} className="flex items-center gap-2">
          <input
            ref={inputArquivoRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={escolherArquivo}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputArquivoRef.current?.click()}
            className="tap-scale w-9 h-9 rounded-full bg-fill text-muted flex items-center justify-center flex-shrink-0"
            aria-label="Anexar imagem ou PDF"
          >
            <Paperclip className="w-[18px] h-[18px]" />
          </button>
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Pergunta qualquer coisa da viagem…"
            className="flex-1 bg-fill rounded-full px-4 py-2.5 text-[13px] text-text placeholder:text-muted2 outline-none focus:ring-2 focus:ring-blue/30"
          />
          <button
            type="submit"
            disabled={pensando || (!texto.trim() && !anexo)}
            className="tap-scale w-9 h-9 rounded-full bg-blue text-white flex items-center justify-center flex-shrink-0 disabled:opacity-40"
            aria-label="Enviar"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
