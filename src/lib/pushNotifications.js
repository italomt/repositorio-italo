import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = 'BBj3g2TyOImZ2HH-uADWrIXv_-MLc8a-urkkAqZ_A_3nSohP4uupTfwwNlZMnslMUkANc7v4dUW53QediBBJhfc'

function urlBase64ParaUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const base64Seguro = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64Seguro)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export function suportaNotificacoes() {
  return 'serviceWorker' in navigator && 'PushManager' in window
}

export function permissaoAtual() {
  return typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
}

export async function ativarNotificacoes(usuarioId) {
  if (!suportaNotificacoes()) return { error: new Error('Este navegador não suporta notificações.') }

  const permissao = await Notification.requestPermission()
  if (permissao !== 'granted') return { error: new Error('Permissão negada.') }

  const registration = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready

  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ParaUint8Array(VAPID_PUBLIC_KEY),
    })
  }

  const json = subscription.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert({
    usuario_id: usuarioId,
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
  }, { onConflict: 'endpoint' })

  return { error }
}
