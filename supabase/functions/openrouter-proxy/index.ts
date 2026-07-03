// Proxy autenticado para a OpenRouter — a chave fica só no servidor.
// Deploy: npx supabase functions deploy openrouter-proxy --project-ref ncdgfegnkhfytxkiqdek
// Secret: npx supabase secrets set OPENROUTER_API_KEY=... --project-ref ncdgfegnkhfytxkiqdek

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MODELOS_PERMITIDOS = new Set([
  'deepseek/deepseek-chat',
  'openai/gpt-4o-mini',
  'google/gemini-2.0-flash-001',
])

const ORIGENS_PERMITIDAS = new Set([
  'https://repositorio-italo.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
])

function corsHeadersPara(req: Request) {
  const origem = req.headers.get('origin') || ''
  const permitida = ORIGENS_PERMITIDAS.has(origem)
  return {
    'Access-Control-Allow-Origin': permitida ? origem : 'https://repositorio-italo.vercel.app',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    Vary: 'Origin',
  }
}

Deno.serve(async (req: Request) => {
  const corsHeaders = corsHeadersPara(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Não autenticado' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Token inválido' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: dentroDoLimite, error: rateLimitError } = await supabase.rpc('registrar_uso_ia', {
    limite: 40,
    janela_minutos: 60,
  })
  if (rateLimitError || !dentroDoLimite) {
    return new Response(JSON.stringify({ error: 'Limite de uso da IA atingido. Tente novamente mais tarde.' }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { model, messages, max_tokens } = await req.json().catch(() => ({}))

  if (!MODELOS_PERMITIDOS.has(model) || !Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'Requisição inválida' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://repositorio-italo.vercel.app',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.1,
      max_tokens: Math.min(Number(max_tokens) || 300, 4000),
    }),
  })

  const corpo = await response.text()
  return new Response(corpo, {
    status: response.status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
