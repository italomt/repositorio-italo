import { supabase } from './supabase'

function extrairPath(arquivoUrl) {
  const marcador = '/object/public/documentos/'
  const indice = arquivoUrl.indexOf(marcador)
  return indice === -1 ? arquivoUrl : arquivoUrl.slice(indice + marcador.length)
}

export async function abrirDocumento(doc) {
  if (doc.tipo === 'link') {
    window.open(doc.arquivo_url, '_blank', 'noopener,noreferrer')
    return
  }

  const path = extrairPath(doc.arquivo_url)
  const { data, error } = await supabase.storage.from('documentos').createSignedUrl(path, 3600)
  if (error || !data?.signedUrl) {
    window.alert('Não foi possível abrir o documento.')
    return
  }
  window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
}
