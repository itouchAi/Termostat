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

let lastLiveState = {
  currentTemp: 21.8,
  targetTemp: 22.5,
  isKombiActive: false,
  humidity: 48,
};

function renderLiveNotification(state) {
  const current = Number(state.currentTemp ?? 21.8).toFixed(1);
  const target = Number(state.targetTemp ?? 22.5).toFixed(1);
  const isKombi = Boolean(state.isKombiActive);
  const hum = state.humidity ?? 48;

  const title = isKombi
    ? `🔥 Kombi Devrede: ${current}°C (Hedef: ${target}°C)`
    : `❄️ Kombi Beklemede: ${current}°C (Hedef: ${target}°C)`;

  const body = `Oda: ${current}°C • Hedef: ${target}°C • Nem: %${hum} • Hızlı Sıcaklık Kontrolü 👇`;

  return self.registration.showNotification(title, {
    body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'termo-live-widget',
    renotify: false, // Ekranı veya sesi rahatsız etmeden güncelle
    silent: true,
    requireInteraction: true,
    ongoing: true, // Android bildirim perdesinde kalıcı tutar
    actions: [
      { action: 'temp_down', title: '➖ 0.5°C' },
      { action: 'temp_up', title: '➕ 0.5°C' },
      { action: 'call_assistant', title: '📞 Asistan' },
    ],
    data: {
      url: '/',
      type: 'live_widget',
      currentTemp: state.currentTemp,
      targetTemp: state.targetTemp,
      isKombiActive: state.isKombiActive,
    },
  });
}

// Listen for messages from foreground app
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'UPDATE_LIVE_NOTIFICATION_WIDGET') {
    lastLiveState = { ...lastLiveState, ...event.data.payload };
    event.waitUntil(renderLiveNotification(lastLiveState));
  } else if (event.data.type === 'CLEAR_LIVE_NOTIFICATION_WIDGET') {
    event.waitUntil(
      self.registration.getNotifications({ tag: 'termo-live-widget' }).then((notifications) => {
        notifications.forEach((n) => n.close());
      })
    );
  } else if (event.data.type === 'SHOW_INCOMING_CALL_NOTIFICATION') {
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
  } else if (event.data.type === 'SHOW_MISSED_CALL_NOTIFICATION') {
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
  const action = event.action;

  // 1. Canlı Kumanda Hızlı Sıcaklık Butonları (Bildirim Perdesinden Uygulamayı Açmadan Ayarla)
  if (action === 'temp_down' || action === 'temp_up') {
    const delta = action === 'temp_up' ? 0.5 : -0.5;
    lastLiveState.targetTemp = Math.round((Number(lastLiveState.targetTemp || 22) + delta) * 10) / 10;

    // Bildirimi anında güncellenmiş yeni hedef sıcaklıkla tazele
    event.waitUntil(
      renderLiveNotification(lastLiveState).then(() => {
        // Açık olan tüm istemcilere yeni hedefi duyur
        return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
          clientList.forEach((client) => {
            client.postMessage({
              type: 'ADJUST_TARGET_TEMP',
              delta,
              newTargetTemp: lastLiveState.targetTemp,
            });
          });
        });
      })
    );
    return;
  }

  // 2. Canlı Kumandadaki "Asistanı Ara" Butonu
  if (action === 'call_assistant') {
    event.notification.close();
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
    return;
  }

  // 3. Normal Çağrı Reddet
  if (action === 'decline') {
    event.notification.close();
    return;
  }

  // 4. Normal Çağrı Cevapla veya Kartın Gövdesine Tıklama
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          if (action === 'answer') {
            client.postMessage({ type: 'TRIGGER_CALL_ANSWER' });
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        const targetUrl = action === 'answer' ? '/?open_call=true' : '/';
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

