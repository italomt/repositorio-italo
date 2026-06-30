import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useDocumentos(viagemId) {
  const [documentos, setDocumentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
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

    const { data: { publicUrl } } = supabase.storage
      .from('documentos')
      .getPublicUrl(filePath)

    const { data, error } = await supabase
      .from('documentos')
      .insert({
        nome,
        categoria,
        tipo: ['pdf', 'jpg', 'jpeg', 'png'].includes(ext) ? ext : 'outro',
        arquivo_url: publicUrl,
        viagem_id: viagemId,
        ...(contexto?.tipo ? { contexto_tipo: contexto.tipo, contexto_id: contexto.id } : {}),
      })
      .select()
      .single()

    if (!error) await carregar()
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

  const removerDocumento = useCallback(async (id) => {
    const { error } = await supabase.from('documentos').delete().eq('id', id)
    if (!error) await carregar()
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
