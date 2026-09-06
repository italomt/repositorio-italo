// Busca na web para o assistente de viagem (Tavily) — a chave fica só no servidor.
// Deploy: npx supabase functions deploy buscar-web --project-ref ncdgfegnkhfytxkiqdek
// Secret: npx supabase secrets set TAVILY_API_KEY=... --project-ref ncdgfegnkhfytxkiqdek

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

function json(corpo: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  const corsHeaders = corsHeadersPara(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Não autenticado' }, 401, corsHeaders)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return json({ error: 'Token inválido' }, 401, corsHeaders)

  // Mesma cota da IA: busca só acontece dentro de uma conversa com o assistente.
  const { data: dentroDoLimite, error: rateLimitError } = await supabase.rpc('registrar_uso_ia', {
    limite: 40,
    janela_minutos: 60,
  })
  if (rateLimitError || !dentroDoLimite) {
    return json({ error: 'Limite de uso da IA atingido. Tente novamente mais tarde.' }, 429, corsHeaders)
  }

  const { query } = await req.json().catch(() => ({}))
  if (typeof query !== 'string' || query.trim().length < 2 || query.length > 400) {
    return json({ error: 'Busca inválida' }, 400, corsHeaders)
  }

  const chave = Deno.env.get('TAVILY_API_KEY')
  if (!chave) {
    // Sem chave configurada o assistente segue funcionando, só sem dado da web.
    return json({ indisponivel: true, resultados: [] }, 200, corsHeaders)
  }

  const resposta = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${chave}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      search_depth: 'basic',
      max_results: 5,
      include_answer: true,
    }),
  })

  if (!resposta.ok) {
    const detalhe = await resposta.text()
    return json({ error: 'Busca falhou', detalhe: detalhe.slice(0, 300) }, 502, corsHeaders)
  }

  const dados = await resposta.json()

  return json({
    resumo: dados.answer ?? null,
    resultados: (dados.results ?? []).map((r: Record<string, unknown>) => ({
      titulo: r.title,
      url: r.url,
      trecho: typeof r.content === 'string' ? r.content.slice(0, 600) : '',
    })),
  }, 200, corsHeaders)
})
