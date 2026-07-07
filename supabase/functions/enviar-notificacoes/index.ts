// Roda 1x/dia via pg_cron (ver migration_notificacoes_push.sql). Verifica condições
// de todas as viagens ativas e manda push pros membros quando algo relevante bate.
// --no-verify-jwt é necessário: quem chama é o cron (sem JWT de usuário), a
// autenticação real é o header x-cron-secret checado no código abaixo.
// Deploy: npx supabase functions deploy enviar-notificacoes --no-verify-jwt --project-ref ncdgfegnkhfytxkiqdek
// Secrets: npx supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... CRON_SECRET=... --project-ref ncdgfegnkhfytxkiqdek

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'https://esm.sh/web-push@3.6.7?target=deno'

function amanhaISO() {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

// api.open-meteo.com às vezes demora muito (ou nem responde) a partir da rede
// da edge function — aborta em vez de travar a invocação inteira do cron.
async function verificarClima(lat: number, lng: number, data: string) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: 'auto',
    start_date: data,
    end_date: data,
  })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: controller.signal })
    if (!res.ok) return null
    const json = await res.json()
    const tempMax = json?.daily?.temperature_2m_max?.[0]
    const tempMin = json?.daily?.temperature_2m_min?.[0]
    const chuva = json?.daily?.precipitation_probability_max?.[0]

    if (chuva != null && chuva >= 50) {
      return `🌧️ Previsão de chuva (${chuva}% de chance) amanhã — leva um guarda-chuva.`
    }
    if (tempMax != null && tempMax >= 32) {
      return `☀️ Vai fazer ${Math.round(tempMax)}°C amanhã — dia bem quente, se hidrata.`
    }
    if (tempMin != null && tempMin <= 5) {
      return `🥶 Mínima de ${Math.round(tempMin)}°C amanhã — separa um casaco.`
    }
    return null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

Deno.serve(async (req: Request) => {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== Deno.env.get('CRON_SECRET')) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  webpush.setVapidDetails(
    'mailto:italomouraotimbo@hotmail.com',
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!,
  )

  // Modo de teste manual: dispara uma notificação genérica pra todas as
  // subscriptions cadastradas, sem depender de clima/data da viagem bater.
  const corpo = await req.json().catch(() => ({}))
  if (corpo?.teste) {
    const { data: subs } = await supabase.from('push_subscriptions').select('*')
    const payload = JSON.stringify({
      titulo: 'viaja.ai',
      corpo: 'Notificação de teste — se você recebeu isso, está tudo funcionando! 🎉',
    })
    let enviadasTeste = 0
    const erros: unknown[] = []
    for (const sub of subs || []) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        )
        enviadasTeste++
      } catch (erro) {
        erros.push({ statusCode: erro?.statusCode, body: erro?.body, message: erro?.message })
        if (erro?.statusCode === 404 || erro?.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        }
      }
    }
    return new Response(JSON.stringify({ ok: true, teste: true, notificacoesEnviadas: enviadasTeste, erros }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const data = amanhaISO()
  let enviadas = 0

  const { data: dias } = await supabase
    .from('dias')
    .select('viagem_id, cidades(nome, latitude, longitude)')
    .eq('data', data)

  for (const dia of dias || []) {
    const cidade = dia.cidades as { nome: string; latitude: number | null; longitude: number | null } | null
    if (!cidade?.latitude || !cidade?.longitude) continue

    const mensagemClima = await verificarClima(cidade.latitude, cidade.longitude, data)
    if (!mensagemClima) continue

    const { data: membros } = await supabase
      .from('usuarios_viagem')
      .select('usuario_id')
      .eq('viagem_id', dia.viagem_id)
      .eq('status', 'aceito')

    const usuarioIds = (membros || []).map((m) => m.usuario_id)
    if (usuarioIds.length === 0) continue

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('usuario_id', usuarioIds)

    const payload = JSON.stringify({
      titulo: `Clima em ${cidade.nome}`,
      corpo: mensagemClima,
    })

    for (const sub of subs || []) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        )
        enviadas++
      } catch (erro) {
        // Subscription expirada/inválida — remove pra não tentar de novo
        if (erro?.statusCode === 404 || erro?.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        }
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, notificacoesEnviadas: enviadas }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
