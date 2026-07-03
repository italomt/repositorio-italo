import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useDocumentos(viagemId) {
  const [documentos, setDocumentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    if (!viagemId) { setDocumentos([]); setLoading(false); return }
    setLoading(true)
    const { data, error } = await supabase
      .from('documentos')
      .select('*')
      .eq('viagem_id', viagemId)
      .order('created_at', { ascending: false })

    if (error) {
      setErro(error)
    } else {
      setDocumentos(data)
    }
    setLoading(false)
  }, [viagemId])

  useEffect(() => {
    carregar()
  }, [carregar])

  const uploadArquivo = useCallback(async (file, nome, categoria, contexto) => {
    const ext = file.name.split('.').pop().toLowerCase()
    const filePath = `${Date.now()}_${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('documentos')
      .upload(filePath, file)

    if (uploadError) return { data: null, error: uploadError }

    const { data, error } = await supabase
      .from('documentos')
      .insert({
        nome,
        categoria,
        tipo: ['pdf', 'jpg', 'jpeg', 'png'].includes(ext) ? ext : 'outro',
        arquivo_url: filePath,
        viagem_id: viagemId,
        ...(contexto?.tipo ? { contexto_tipo: contexto.tipo, contexto_id: contexto.id } : {}),
      })
      .select()
      .single()

    if (error) {
      await supabase.storage.from('documentos').remove([filePath])
      return { data: null, error }
    }

    await carregar()
    return { data, error }
  }, [carregar, viagemId])

  const adicionarLink = useCallback(async (nome, categoria, url, contexto) => {
    const { data, error } = await supabase
      .from('documentos')
      .insert({
        nome,
        categoria,
        tipo: 'link',
        arquivo_url: url,
        viagem_id: viagemId,
        ...(contexto?.tipo ? { contexto_tipo: contexto.tipo, contexto_id: contexto.id } : {}),
      })
      .select()
      .single()

    if (!error) await carregar()
    return { data, error }
  }, [carregar, viagemId])

  const removerDocumento = useCallback(async (id, doc) => {
    const { error } = await supabase.from('documentos').delete().eq('id', id)
    if (error) return { error }

    if (doc?.tipo !== 'link' && doc?.arquivo_url) {
      const marcador = '/object/public/documentos/'
      const indice = doc.arquivo_url.indexOf(marcador)
      const path = indice === -1 ? doc.arquivo_url : doc.arquivo_url.slice(indice + marcador.length)
      await supabase.storage.from('documentos').remove([path])
    }

    await carregar()
    return { error }
  }, [carregar])

  return {
    documentos,
    loading,
    erro,
    recarregar: carregar,
    uploadArquivo,
    adicionarLink,
    removerDocumento,
  }
}
