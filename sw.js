/* SpaceCat — Service Worker: guarda el juego en el dispositivo para jugar SIN conexión.
 *
 * Estrategia: "caché primero". Al instalarse descarga todos los archivos del juego de una vez (si falla
 * alguno, no se instala: nunca queda una versión a medias). Después cada archivo sale de la caché,
 * sin consultar ningún servidor.
 *
 * ⚠ CADA VEZ QUE CAMBIES CUALQUIER ARCHIVO DEL JUEGO, SUBE EL NÚMERO DE VERSION.
 *   Así los dispositivos descargan la versión nueva; si no, seguirán con la guardada. */
const VERSION = '0.2.1';
const CACHE = 'spacecat-' + VERSION;

// Todo lo necesario para jugar (si agregas archivos .js, ponlos aquí también).
const CORE = [
  './', 'index.html', 'style.css', 'manifest.webmanifest',
  'config.js', 'view.js', 'perf.js', 'input.js', 'audio.js', 'assets.js', 'skins.js', 'scenery.js',
  'pixelart.js', 'levels.js', 'level.js', 'player.js', 'render.js', 'game.js', 'pwa.js', 'main.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png', 'icons/favicon-32.png'
];

// Imágenes opcionales (ver assets.js): si existen se guardan para el modo offline; si no existen no pasa nada.
const OPTIONAL = [
  'assets/images/cat.png', 'assets/images/star.png', 'assets/images/asteroid.png',
  'assets/images/goal.png', 'assets/images/background.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // 'reload' evita que la caché HTTP del navegador/servidor nos entregue archivos viejos
    await Promise.all(CORE.map((u) => cache.add(new Request(u, { cache: 'reload' }))));
    await Promise.allSettled(OPTIONAL.map((u) => cache.add(new Request(u, { cache: 'reload' }))));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n.startsWith('spacecat-') && n !== CACHE).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;            // el juego no usa recursos externos

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // ignoreSearch: "index.html?debug" o "?q=1" también salen de la caché
    let hit = await cache.match(req, { ignoreSearch: true });
    if (!hit && req.mode === 'navigate') hit = await cache.match('index.html');
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res && res.ok && res.type === 'basic') cache.put(req, res.clone());   // p. ej. imágenes agregadas después
      return res;
    } catch (e) {
      return Response.error();    // sin conexión y sin copia guardada (p. ej. una imagen opcional que no existe)
    }
  })());
});
