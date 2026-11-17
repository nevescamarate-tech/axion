// Axion — service worker: funciona sem rede e mostra os avisos.
const CACHE = 'axion-v5';
const SHELL = ['./', './index.html', './config.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/badge-96.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Páginas e ficheiros da app: rede primeiro, cópia guardada se não houver rede.
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => {
    const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); return res;
  }).catch(() => caches.match(r).then(m => m || caches.match('./index.html'))));
});

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { title: 'Axion', body: e.data && e.data.text() }; }
  const agora = d.off === 0;
  e.waitUntil(self.registration.showNotification(d.title || 'Axion', {
    body: d.body || '',
    tag: (d.id || 'axion') + '-' + (d.off ?? ''),
    renotify: true,
    requireInteraction: agora,
    vibrate: agora ? [300, 150, 300, 150, 300] : [250, 150, 250],
    icon: './icons/icon-192.png',
    badge: './icons/badge-96.png',
    data: { id: d.id },
    actions: [{ action: 'feito', title: 'Feito' }, { action: 'adiar', title: '+10 min' }]
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const id = e.notification.data && e.notification.data.id;
  const acao = e.action || '';
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const c = all.find(x => x.url.startsWith(self.registration.scope));
    if (c) { await c.focus(); if (acao && id) c.postMessage({ acao, id }); return; }
    const url = new URL('./', self.registration.scope);
    if (acao && id) { url.searchParams.set('acao', acao); url.searchParams.set('id', id); }
    await self.clients.openWindow(url.href);
  })());
});
