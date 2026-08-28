const RUNTIME_CACHE = 'viaja-ai-runtime'
const SHELL_CACHE_KEY = '/'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

function ehSupabase(url) {
  return url.hostname.endsWith('.supabase.co')
}

// Network-first: online sempre busca dado fresco (nada muda no uso normal);
// offline cai pro último dado salvo no cache, quando existir.
async function networkFirst(request, cacheKey) {
  const cache = await caches.open(RUNTIME_CACHE)
  try {
    const response = await fetch(request)
    if (response && response.ok) {
      cache.put(cacheKey || request, response.clone())
    }
    return response
  } catch (err) {
    const cached = await cache.match(cacheKey || request)
    if (cached) return cached
    throw err
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  // Só GET: escrita (POST/PATCH/DELETE) nunca é interceptada — falha como
  // sempre falhou quando offline, sem cache mascarando o resultado.
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Navegação (troca de rota do SPA): serve o shell salvo offline; o
  // client-side router cuida de mostrar a tela certa a partir da URL.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, SHELL_CACHE_KEY))
    return
  }

  const mesmaOrigem = url.origin === self.location.origin
  if (!mesmaOrigem && !ehSupabase(url)) return // fontes/mapas/analytics seguem sem cache

  event.respondWith(networkFirst(request))
})

self.addEventListener('push', (event) => {
  let payload = { titulo: 'viaja.ai', corpo: 'Você tem uma novidade na sua viagem.' }
  try {
    payload = event.data.json()
  } catch {
    // ignora payload malformado, usa o texto padrão
  }

  event.waitUntil(
    self.registration.showNotification(payload.titulo || 'viaja.ai', {
      body: payload.corpo || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow('/')
    }),
  )
})
