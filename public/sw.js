/* Service worker: permite instalar la web como app y abrirla sin conexión.
   Siempre pide primero a la red (precios al día); si no hay conexión, usa la última copia guardada.
   Los archivos de Next.js (/_next/static/…) se guardan solos la primera vez que se piden.
   Si cambias mucho la web, sube el número de VERSION para limpiar copias viejas. */
const VERSION = "radar-v5";
const BASE = ["./", "manifest.webmanifest", "icon.svg", "icon-192.png"];

const SIN_CACHE = ["code", "error", "error_description", "recuperar", "popup", "token_hash"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return; // Supabase y tiendas: sin caché
  // Vuelta del inicio de sesión o del email (?code=…): nunca se guarda, para que el código no quede en el dispositivo
  const deAcceso = SIN_CACHE.some((k) => url.searchParams.has(k));
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok && !deAcceso) { const copia = res.clone(); caches.open(VERSION).then((c) => c.put(req, copia)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match("./")))
  );
});
