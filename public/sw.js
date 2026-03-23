// Service Worker for push notifications
self.addEventListener('push', (event) => {
  let data = { title: '🏍️ Nova corrida!', body: 'Uma nova corrida está disponível' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/placeholder.svg',
      badge: '/placeholder.svg',
      vibrate: [200, 100, 200, 100, 200],
      tag: 'new-ride',
      renotify: true,
      requireInteraction: true,
      data: data.data || {},
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/driver') && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow('/driver');
    })
  );
});
