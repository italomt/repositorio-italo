import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const mailgunApiKey = Deno.env.get('MAILGUN_API_KEY')!
const openrouterKey = Deno.env.get('OPENROUTER_API_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

async function verificarAssinatura(
  timestamp: string,
  token: string,
  signature: string,
): Promise<boolean> {
  const keyBytes = new TextEncoder().encode(mailgunApiKey)
  const payload = new TextEncoder().encode(timestamp + token)
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const expected = await crypto.subtle.sign('HMAC', key, payload)
  const expectedHex = Array.from(new Uint8Array(expected)).map(b => b.toString(16).padStart(2, '0')).join('')
  return expectedHex === signature
}

async function interpretarEmail(texto: string): Promise<{ nome: string; categoria: string } | null> {
  const system = `Você analisa emails sobre documentos de viagem. Extraia o tipo de documento e sugira um nome curto.
Retorne APENAS JSON: { "nome": string, "categoria": "passagem" | "hospedagem" | "seguro" | "ingresso" | "outro" }`

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: `Email: "${texto.slice(0, 3000)}"` },
        ],
        temperature: 0.1,
        max_tokens: 200,
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) return null
    const match = content.match(/\{[\s\S]*\}/)
    if (!match) return null
    return JSON.parse(match[0])
  } catch {
    return null
  }
}

serve(async (req) => {
  try {
    const formData = await req.formData()

    const timestamp = formData.get('timestamp') as string
    const token = formData.get('token') as string
    const signature = formData.get('signature') as string

    if (timestamp && token && signature) {
      const valido = await verificarAssinatura(timestamp, token, signature)
      if (!valido) {
        return new Response('Assinatura invalida', { status: 403 })
      }
    }

    const recipient = (formData.get('recipient') as string) || ''
    const sender = (formData.get('sender') as string) || ''
    const subject = (formData.get('subject') as string) || ''
    const strippedText = (formData.get('stripped-text') as string) || (formData.get('body-plain') as string) || ''
    const bodyHtml = (formData.get('body-html') as string) || ''
    const attachmentCount = parseInt((formData.get('attachment-count') as string) || '0', 10)

    const alias = recipient.split('@')[0]?.toLowerCase()
    if (!alias) return new Response('OK', { status: 200 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email_alias')
      .eq('email_alias', alias)
      .maybeSingle()

    if (!profile) return new Response('OK', { status: 200 })

    const corpo = strippedText || bodyHtml?.replace(/<[^>]*>/g, '') || subject

    let nome = subject || 'Documento recebido por email'
    let categoria = 'outro'

    if (corpo) {
      const ia = await interpretarEmail(corpo)
      if (ia) {
        nome = ia.nome
        categoria = ia.categoria
      }
    }

    let arquivoUrl: string | null = null
    let tipo = 'outro'

    if (attachmentCount > 0) {
      const anexo = formData.get('attachment-1')
      if (anexo && anexo instanceof File) {
        const ext = anexo.name.split('.').pop()?.toLowerCase() || ''
        const filePath = `email_${Date.now()}_${anexo.name}`
        const buffer = await anexo.arrayBuffer()

        const { error: uploadError } = await supabase.storage
          .from('documentos')
          .upload(filePath, new Uint8Array(buffer), {
            contentType: anexo.type,
          })

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('documentos')
            .getPublicUrl(filePath)
          arquivoUrl = publicUrl
          tipo = ['pdf', 'jpg', 'jpeg', 'png'].includes(ext) ? ext : 'outro'
        }
      }
    }

    await supabase.from('documentos').insert({
      nome,
      categoria,
      tipo,
      arquivo_url: arquivoUrl,
      created_by: profile.id,
      origem: 'email',
    })

    return new Response('OK', { status: 200 })
  } catch {
    return new Response('OK', { status: 200 })
  }
})
