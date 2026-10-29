// Service Worker for TermoBot PWA & Android Lock-Screen Call Notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through for standard fetches
});

// Listen for messages from foreground app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_INCOMING_CALL_NOTIFICATION') {
    const { title, body, tag, icon } = event.data;
    event.waitUntil(
      self.registration.showNotification(title || '📞 TermoBot Asistan Arıyor...', {
        body: body || 'Oda sıcaklığı düştü, kombi ateşlendi! Dokun ve konuş.',
        icon: icon || '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: tag || 'termo-call',
        renotify: true,
        requireInteraction: true, // Keep on screen / lock screen until user acts
        vibrate: [600, 300, 600, 300, 800],
        actions: [
          { action: 'answer', title: '📞 Cevapla' },
          { action: 'decline', title: '✕ Reddet' }
        ],
        data: {
          url: '/?open_call=true',
          action: 'answer'
        }
      })
    );
  } else if (event.data && event.data.type === 'SHOW_MISSED_CALL_NOTIFICATION') {
    const { title, body } = event.data;
    event.waitUntil(
      self.registration.showNotification(title || '📞 Cevapsız Asistan Araması (Aytaç)', {
        body: body || 'Kombi ateşlendi ancak aramaya yanıt verilmedi. Termostat aktif çalışıyor.',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'termo-missed-call',
        vibrate: [300, 150, 300],
        data: {
          url: '/'
        }
      })
    );
  }
});

// Handle clicking on lock screen or status bar notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  if (action === 'decline') {
    // Call dismissed
    return;
  }

  // Focus existing open window or open new one
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.postMessage({ type: 'TRIGGER_CALL_ANSWER' });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/?open_call=true');
      }
    })
  );
});
