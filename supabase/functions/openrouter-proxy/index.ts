// Proxy autenticado para a OpenRouter — a chave fica só no servidor.
// Deploy: npx supabase functions deploy openrouter-proxy --project-ref ncdgfegnkhfytxkiqdek
// Secret: npx supabase secrets set OPENROUTER_API_KEY=... --project-ref ncdgfegnkhfytxkiqdek

const MODELOS_PERMITIDOS = new Set([
  'deepseek/deepseek-chat',
  'openai/gpt-4o-mini',
  'google/gemini-2.0-flash-001',
])

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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
