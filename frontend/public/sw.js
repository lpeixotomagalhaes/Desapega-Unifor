/*
 * Service Worker do Desapega UNIFOR
 *
 * Estratégias de cache:
 * - Pré-cache no install: páginas principais, manifest e ícones.
 * - Navegações (HTML) e API: network-first — tenta a rede e, se estiver
 *   offline, responde com a última versão salva no cache.
 * - Demais assets (JS, CSS, imagens): stale-while-revalidate — responde
 *   rápido com o cache e atualiza em segundo plano.
 *
 * Background Sync (Chrome/Android): o tag "sync-pending-items" avisa as
 * abas abertas para publicar anúncios enfileirados. No iOS Safari o sync
 * não existe — o flush principal continua sendo o evento "online" na app.
 */

const CACHE_VERSION = "v3";
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

/** Mantém o cache dinâmico com no máximo DYNAMIC_CACHE_LIMIT entradas. */
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
  const cache = await caches.open(DYNAMIC_CACHE);
  await cache.put(request, response);
  await trimCache(DYNAMIC_CACHE, DYNAMIC_CACHE_LIMIT);
}

/** Busca na rede e guarda uma cópia no cache dinâmico. */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      await putInDynamicCache(request, response.clone());
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
  const cached = await caches.match(request);

  const networkFetch = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        await putInDynamicCache(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached ?? networkFetch;
}

/**
 * Só rede, sem cache algum — usado para a API (outra origem). A Cache API
 * ignora o header Authorization na chave, então cachear respostas da API
 * arriscaria devolver dados de outra conta para quem usa o mesmo aparelho.
 * As telas que precisam de dados offline já guardam seu próprio snapshot
 * (localStorage/IndexedDB) com escopo por usuário — ver lib/offlineQueue.tsx,
 * lib/myItemsCache.ts etc.
 */
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch {
    return new Response(
      JSON.stringify({ offline: true, message: "Você está offline." }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Só interceptamos GET (POST/DELETE sempre vão direto para a rede)
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isNavigation = request.mode === "navigate";

  if (isNavigation) {
    // Páginas do próprio app: dados sempre frescos, com fallback pro
    // cache/app-shell quando offline.
    event.respondWith(networkFirst(request));
  } else if (!isSameOrigin) {
    // Chamadas à API (outra origem): nunca cacheamos.
    event.respondWith(networkOnly(request));
  } else {
    // Assets estáticos do próprio app
    event.respondWith(staleWhileRevalidate(request));
  }
});

/**
 * Background Sync: quando a conexão volta (mesmo com a aba em background),
 * pede às abas abertas para executar o flush da fila IndexedDB.
 * Sem abas abertas, o flush ocorre no próximo carregamento / evento online.
 */
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
