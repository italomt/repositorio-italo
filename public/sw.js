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
