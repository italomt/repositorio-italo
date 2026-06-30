import { useState, useRef } from 'react'
import { useViagem } from '../../hooks/useViagem'
import { useDias } from '../../hooks/useDias'
import { useAtracoes } from '../../hooks/useAtracoes'
import { useToast } from '../../contexts/ToastContext'
import { inicializarMapaGeral } from '../../lib/maps'
import QuickAdd from '../atracoes/QuickAdd'
import Card from '../ui/Card'
import { Map as MapIcon, Search, Sparkles, Plus } from 'lucide-react'

export default function ExplorarView() {
  const { viagemId } = useViagem()
  const { dias } = useDias(viagemId)
  const { atracoes, adicionarAtracao } = useAtracoes(viagemId)
  const addToast = useToast()

  const [quickAddAberto, setQuickAddAberto] = useState(false)
  const [mapaAberto, setMapaAberto] = useState(false)
  const mapaRef = useRef(null)

  function abrirMapa() {
    setMapaAberto(true)
    setTimeout(async () => {
      if (mapaRef.current) {
        await inicializarMapaGeral(dias, atracoes, mapaRef.current)
      }
    }, 300)
  }

  return (
    <div className="space-y-5">
      <h1 className="font-display text-[34px] font-bold tracking-tight">Explorar</h1>

      <button
        onClick={() => setQuickAddAberto(true)}
        className="tap-scale w-full flex items-center gap-3 p-4 rounded-2xl bg-blue text-white text-left"
      >
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-[16px]">Adicionar com IA</p>
          <p className="text-[13px] text-white/70">Descreva o que quer fazer e a IA encontra</p>
        </div>
        <Plus className="w-5 h-5" />
      </button>

      <button
        onClick={abrirMapa}
        className="tap-scale w-full flex items-center gap-3 p-4 rounded-2xl bg-fill text-left"
      >
        <div className="w-12 h-12 rounded-full bg-green/10 flex items-center justify-center shrink-0">
          <MapIcon className="w-6 h-6 text-green" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-[16px]">Mapa geral</p>
          <p className="text-[13px] text-muted">{dias.length} dias · {atracoes.length} atrações</p>
        </div>
      </button>

      <Card>
        <div className="p-4">
          <h2 className="text-muted text-[13px] font-semibold uppercase tracking-wide mb-3">Cidades</h2>
          <div className="flex flex-wrap gap-2">
            {[...new Map(dias.map((d) => [d.cidade, d.flag_emoji]))].map(([cidade, flag]) => (
              <span key={cidade} className="tap-scale px-3 py-1.5 rounded-full bg-fill text-[14px] font-medium">
                {flag} {cidade}
              </span>
            ))}
          </div>
        </div>
      </Card>

      {quickAddAberto && (
        <QuickAdd
          aberto={quickAddAberto}
          onClose={() => setQuickAddAberto(false)}
          destinos={dias}
          atracoes={atracoes}
          onAdicionarAtracao={adicionarAtracao}
          onCriarPendencia={async (p) => {
            const { usePendencias } = await import('../../hooks/usePendencias')
            addToast('Use Roteiro para gerenciar pendências')
          }}
        />
      )}

      {mapaAberto && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" onClick={() => setMapaAberto(false)}>
          <div className="bg-card w-full sm:max-w-2xl h-[70vh] sm:h-[80vh] rounded-t-2xl sm:rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h2 className="font-display text-xl font-bold">Mapa geral</h2>
              <button onClick={() => setMapaAberto(false)} className="tap-scale w-11 h-11 rounded-full bg-fill flex items-center justify-center text-muted text-xl">✕</button>
            </div>
            <div ref={mapaRef} className="w-full h-[calc(100%-52px)]" />
          </div>
        </div>
      )}
    </div>
  )
}
