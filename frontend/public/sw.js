/*
 * Service Worker do Desapega UNIFOR
 *
 * Estratégias de cache:
 * - Pré-cache no install: páginas principais, manifest e ícones.
 * - Navegações (HTML) e API: network-first — tenta a rede e, se estiver
 *   offline, responde com a última versão salva no cache.
 * - Demais assets (JS, CSS, imagens): stale-while-revalidate — responde
 *   rápido com o cache e atualiza em segundo plano.
 */

const CACHE_VERSION = "v1";
const STATIC_CACHE = `desapega-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `desapega-dynamic-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  "/",
  "/app",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/** Busca na rede e guarda uma cópia no cache dinâmico. */
async function networkFirst(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline: tenta o cache dinâmico e depois o estático
    const cached = await caches.match(request);
    if (cached) return cached;
    // Fallback para navegações: devolve a página inicial em cache
    if (request.mode === "navigate") {
      const fallback = await caches.match("/");
      if (fallback) return fallback;
    }
    return new Response(
      JSON.stringify({ offline: true, message: "Você está offline." }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }
}

/** Responde com o cache e atualiza em segundo plano. */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await caches.match(request);

  const networkFetch = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached ?? networkFetch;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Só interceptamos GET (POST/DELETE sempre vão direto para a rede)
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isNavigation = request.mode === "navigate";

  if (isNavigation || !isSameOrigin) {
    // Páginas e chamadas à API (outra origem): dados sempre frescos,
    // com fallback offline
    event.respondWith(networkFirst(request));
  } else {
    // Assets estáticos do próprio app
    event.respondWith(staleWhileRevalidate(request));
  }
});
