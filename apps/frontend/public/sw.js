self.addEventListener('push', event => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Grafolão', {
      body:  data.body  ?? '',
      icon:  '/favicon.ico',
      badge: '/favicon.ico',
      data:  { url: data.url ?? '/' },
      vibrate: [200, 100, 200],
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      const url = event.notification.data?.url ?? '/'
      const match = windowClients.find(c => c.url.includes(self.location.origin))
      if (match) {
        match.focus()
        match.navigate(url)
      } else {
        clients.openWindow(url)
      }
    })
  )
})
