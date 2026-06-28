import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useDocumentos() {
  const [documentos, setDocumentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('documentos')
      .select('*, profiles!created_by(nome, email_alias)')
      .order('created_at', { ascending: false })

    if (error) {
      setErro(error)
    } else {
      setDocumentos(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const uploadArquivo = useCallback(async (file, nome, categoria, usuarioId) => {
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
        created_by: usuarioId,
        origem: 'manual',
      })
      .select()
      .single()

    if (!error) await carregar()
    return { data, error }
  }, [carregar])

  const adicionarLink = useCallback(async (nome, categoria, url, usuarioId) => {
    const { data, error } = await supabase
      .from('documentos')
      .insert({
        nome,
        categoria,
        tipo: 'link',
        arquivo_url: url,
        created_by: usuarioId,
        origem: 'manual',
      })
      .select()
      .single()

    if (!error) await carregar()
    return { data, error }
  }, [carregar])

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
