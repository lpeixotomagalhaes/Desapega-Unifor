/*
 * Service Worker do Desapega UNIFOR
 *
 * Estratégias de cache:
 * - Pré-cache no install: páginas principais, manifest e ícones.
 * - Navegações (HTML): network-first com fallback do app-shell.
 * - Assets same-origin (JS, CSS, imagens): stale-while-revalidate.
 * - Cross-origin (API no Render): NÃO interceptamos — o browser fala
 *   direto com a API. Interceptar costuma gerar CORS quebrado e
 *   "Failed to convert value to 'Response'" no Chrome.
 *
 * Background Sync (Chrome/Android): o tag "sync-pending-items" avisa as
 * abas abertas para publicar anúncios enfileirados.
 */

const CACHE_VERSION = "v4";
const STATIC_CACHE = `desapega-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `desapega-dynamic-${CACHE_VERSION}`;
const DYNAMIC_CACHE_LIMIT = 100;
const SYNC_TAG = "sync-pending-items";

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

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    void self.skipWaiting();
  }
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

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  const excess = keys.length - maxEntries;
  for (let i = 0; i < excess; i++) {
    await cache.delete(keys[i]);
  }
}

async function putInDynamicCache(request, response) {
  // Só cacheia respostas same-origin bem-sucedidas e "basic"/"cors" ok.
  if (!response || !response.ok) return;
  if (response.type !== "basic" && response.type !== "default") return;
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    await cache.put(request, response);
    await trimCache(DYNAMIC_CACHE, DYNAMIC_CACHE_LIMIT);
  } catch {
    // Cache.put pode falhar com respostas opacas / no-store — ignora.
  }
}

function offlineJson() {
  return new Response(
    JSON.stringify({ offline: true, message: "Você está offline." }),
    { status: 503, headers: { "Content-Type": "application/json" } },
  );
}

/** Busca na rede e guarda uma cópia no cache dinâmico. */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      await putInDynamicCache(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") {
      const fallback = await caches.match("/");
      if (fallback) return fallback;
    }
    return offlineJson();
  }
}

/** Responde com o cache e atualiza em segundo plano — nunca devolve undefined. */
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);

  const networkFetch = fetch(request)
    .then(async (response) => {
      if (response && response.ok) {
        await putInDynamicCache(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    // Atualiza em background; a resposta imediata já é válida.
    void networkFetch;
    return cached;
  }

  const fresh = await networkFetch;
  if (fresh) return fresh;
  return offlineJson();
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // POST/PUT/PATCH/DELETE: nunca interceptar
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  // Cross-origin (API Render, Google, etc.): deixa o browser resolver.
  // Interceptar aqui quebra CORS e gera "Failed to convert value to Response".
  if (!isSameOrigin) return;

  const isNavigation = request.mode === "navigate";

  if (isNavigation) {
    event.respondWith(networkFirst(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});

self.addEventListener("sync", (event) => {
  if (event.tag !== SYNC_TAG) return;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(
      (clients) => {
        for (const client of clients) {
          client.postMessage({ type: "FLUSH_PENDING_ITEMS" });
        }
      },
    ),
  );
});
