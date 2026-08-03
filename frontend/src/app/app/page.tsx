"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { CreateItemFlow } from "@/components/CreateItemFlow";
import { ItemCard, ItemCardSkeleton } from "@/components/ItemCard";
import { ItemStatusTabs } from "@/components/ItemStatusTabs";
import { OnboardingTour } from "@/components/OnboardingTour";
import { Reveal } from "@/components/Reveal";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import {
  api,
  CATEGORIES,
  type Category,
  type Item,
  type ItemInterest,
} from "@/lib/api";
import { useAuthRedirect } from "@/lib/auth";
import {
  consumeOfflineItemJustSaved,
  loadMyItemsCache,
  saveMyItemsCache,
} from "@/lib/offlineCache";
import type { PendingItem } from "@/lib/offlineDb";
import { useOfflineQueue } from "@/lib/offlineQueue";
import { getViewedItems } from "@/lib/viewedItems";

function parseCategory(value: string | null): Category | null {
  if (!value) return null;
  const raw = value.trim();
  if (raw in CATEGORIES) return raw as Category;
  const byLabel = (Object.entries(CATEGORIES) as [Category, string][]).find(
    ([, label]) => label.toLowerCase() === raw.toLowerCase(),
  );
  return byLabel?.[0] ?? null;
}

type Tab = "explorar" | "anunciar" | "meus" | "salvos";

const DESKTOP_TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "explorar", label: "Explorar", icon: "🔍" },
  { id: "anunciar", label: "Anunciar", icon: "➕" },
  { id: "meus", label: "Meus anúncios", icon: "📦" },
  { id: "salvos", label: "Salvos", icon: "🔖" },
];

const CARD_VARIANTS = [
  "slide-up",
  "slide-left",
  "zoom-in",
  "slide-right",
  "fade-up",
  "scale",
  "slide-up",
  "slide-left",
] as const;

function parseTab(value: string | null): Tab {
  if (value === "anunciar" || value === "meus" || value === "salvos") {
    return value;
  }
  return "explorar";
}

function AppShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));
  const search = searchParams.get("q") ?? "";
  const category = parseCategory(searchParams.get("category"));

  const selectTab = useCallback(
    (next: Tab) => {
      const params = new URLSearchParams();
      if (next !== "explorar") {
        // Meus anúncios / Anunciar / Salvos: limpa busca e categoria
        params.set("tab", next);
      } else {
        const cat = searchParams.get("category");
        if (cat) params.set("category", cat);
        const q = searchParams.get("q")?.trim();
        if (q) params.set("q", q);
      }
      const qs = params.toString();
      router.replace(qs ? `/app?${qs}` : "/app", { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <div className="mx-auto flex min-h-0 w-full flex-1 flex-col bg-mist md:max-w-7xl">
      <OnboardingTour />

      <nav className="hidden gap-1 border-b border-fog px-4 pt-2 md:flex">
        {DESKTOP_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => selectTab(t.id)}
            className={`rounded-t-lg px-4 py-2.5 text-sm font-semibold transition-soft ${
              tab === t.id
                ? "border-b-2 border-navy text-navy"
                : "border-b-2 border-transparent text-muted hover:text-navy"
            }`}
          >
            <span className="mr-1.5" aria-hidden>
              {t.icon}
            </span>
            {t.label}
          </button>
        ))}
      </nav>

      <main className="flex-1 animate-fade-up px-4 pb-6 pt-4 md:pb-10">
        {tab === "explorar" && (
          <ExploreTab search={search} category={category} />
        )}
        {tab === "anunciar" && (
          <CreateItemFlow onCreated={() => selectTab("meus")} />
        )}
        {tab === "meus" && (
          <MyItemsTab view={searchParams.get("view")} />
        )}
        {tab === "salvos" && <SavedItemsTab />}
      </main>
    </div>
  );
}

function ExploreTab({
  search,
  category,
}: {
  search: string;
  category: Category | null;
}) {
  const router = useRouter();
  const isOnline = useOnlineStatus();
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState(false);
  const [viewed, setViewed] = useState<Item[]>([]);

  const setCategoryFilter = useCallback(
    (next: Category | null) => {
      const params = new URLSearchParams();
      if (next) params.set("category", next);
      const qs = params.toString();
      router.push(qs ? `/app?${qs}` : "/app", { scroll: false });
    },
    [router],
  );

  const chipRefs = useRef<Partial<Record<Category | "all", HTMLButtonElement | null>>>(
    {},
  );

  useEffect(() => {
    const el = chipRefs.current[category ?? "all"];
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [category]);

  useEffect(() => {
    void getViewedItems().then(setViewed);
  }, []);

  useEffect(() => {
    setItems(null);
    setError(false);
    const timeout = setTimeout(() => {
      api
        .getItems({
          category: category ?? undefined,
          search: search.trim() || undefined,
        })
        .then(setItems)
        .catch(() => setError(true));
    }, 300); // debounce da busca
    return () => clearTimeout(timeout);
  }, [category, search]);

  const showOfflineFallback = error && !isOnline;
  const railItems = viewed.slice(0, 12);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          ref={(node) => {
            chipRefs.current.all = node;
          }}
          onClick={() => setCategoryFilter(null)}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-soft ${
            category === null
              ? "bg-navy text-white"
              : "border border-fog bg-white text-muted"
          }`}
        >
          Todos
        </button>
        {(Object.keys(CATEGORIES) as Category[]).map((key) => (
          <button
            key={key}
            type="button"
            ref={(node) => {
              chipRefs.current[key] = node;
            }}
            onClick={() => setCategoryFilter(key)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-soft ${
              category === key
                ? "bg-navy text-white"
                : "border border-fog bg-white text-muted"
            }`}
          >
            {CATEGORIES[key]}
          </button>
        ))}
      </div>

      {!showOfflineFallback && railItems.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-navy">Vistos recentemente</h2>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {railItems.map((item) => (
              <div key={item.id} className="w-56 shrink-0">
                <ItemCard item={item} />
              </div>
            ))}
          </div>
        </section>
      )}

      {showOfflineFallback ? (
        <div className="flex flex-col gap-3">
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-800">
            Você está offline — mostrando itens vistos recentemente.
          </p>
          {viewed.length === 0 ? (
            <p className="rounded-xl border border-fog bg-white p-8 text-center text-sm text-muted">
              Nenhum item em cache ainda. Abra anúncios enquanto estiver online
              para vê-los depois offline.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {viewed.map((item, i) => (
                <Reveal
                  key={item.id}
                  delay={Math.min(i, 7) * 55}
                  variant={CARD_VARIANTS[i % CARD_VARIANTS.length]}
                >
                  <ItemCard item={item} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      ) : error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-800">
          Não foi possível carregar os anúncios. Você está offline ou a API não
          está rodando.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items === null
            ? Array.from({ length: 8 }).map((_, i) => (
                <ItemCardSkeleton key={i} />
              ))
            : items.map((item, i) => (
                <Reveal
                  key={item.id}
                  delay={Math.min(i, 7) * 55}
                  variant={CARD_VARIANTS[i % CARD_VARIANTS.length]}
                >
                  <ItemCard item={item} />
                </Reveal>
              ))}
        </div>
      )}

      {items?.length === 0 && !error && (
        <Reveal variant="fade-up">
          <p className="rounded-xl border border-fog bg-white p-8 text-center text-sm text-muted">
            Nenhum item encontrado. Tente outra busca ou categoria.
          </p>
        </Reveal>
      )}
    </div>
  );
}

function SavedItemsTab() {
  const { token, ready } = useAuthRedirect();
  const isOnline = useOnlineStatus();
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) return;
    setItems(null);
    setError(false);
    api
      .getSavedItems(token)
      .then((rows) => setItems(rows.map((r) => r.item)))
      .catch(() => {
        setItems([]);
        setError(true);
      });
  }, [token]);

  if (!ready || !token) return null;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-navy">Salvos</h1>
        <p className="text-sm text-muted">
          Anúncios que você marcou interesse para negociar depois.
        </p>
      </div>

      {error && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-800">
          {isOnline
            ? "Não foi possível carregar seus salvos."
            : "Você está offline. Os salvos voltam a aparecer quando houver conexão."}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items === null
          ? Array.from({ length: 4 }).map((_, i) => (
              <ItemCardSkeleton key={i} />
            ))
          : items.map((item, i) => (
              <Reveal
                key={item.id}
                delay={Math.min(i, 5) * 50}
                variant={CARD_VARIANTS[i % CARD_VARIANTS.length]}
              >
                <ItemCard item={item} />
              </Reveal>
            ))}
      </div>

      {items?.length === 0 && !error && (
        <p className="rounded-xl border border-dashed border-fog bg-white p-10 text-center text-sm text-muted">
          Nenhum anúncio salvo ainda. Toque no marcador nos cards para guardar
          o que te interessa.
        </p>
      )}
    </div>
  );
}

function PendingItemRow({
  pending,
  isOnline,
  busy,
  onRetry,
  onRemove,
}: {
  pending: PendingItem;
  isOnline: boolean;
  busy: boolean;
  onRetry: () => void;
  onRemove: () => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    const blob = pending.images[0]?.blob;
    if (!blob) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(blob);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [pending.images]);

  const statusLabel =
    pending.status === "syncing"
      ? "Publicando agora…"
      : pending.status === "error"
        ? "Falha ao publicar"
        : "Anúncio carregado · Aguardando conexão";
  const statusClass =
    pending.status === "error"
      ? "bg-red-100 text-red-800"
      : pending.status === "syncing"
        ? "bg-brand/15 text-brand"
        : "bg-amber-100 text-amber-900";
  const borderClass =
    pending.status === "error"
      ? "border-red-200 bg-red-50/40"
      : pending.status === "syncing"
        ? "border-brand/30 bg-brand/5"
        : "border-amber-200 bg-amber-50/50";

  const priceLabel = pending.form.isDonation
    ? "Doação"
    : pending.form.price
      ? `R$ ${Number(pending.form.price).toFixed(2).replace(".", ",")}`
      : "";

  return (
    <li
      className={`flex items-center gap-3 rounded-xl border p-3 shadow-sm ${borderClass}`}
    >
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt=""
          className="h-16 w-16 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-mist text-xs text-muted">
          Sem foto
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-navy">{pending.form.title}</p>
        {priceLabel && (
          <p className="text-xs font-medium text-muted">{priceLabel}</p>
        )}
        <span
          className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusClass}`}
        >
          {statusLabel}
        </span>
        {pending.status === "pending" && !isOnline && (
          <p className="mt-1.5 text-xs text-amber-900/80">
            Será publicado automaticamente quando você reconectar.
          </p>
        )}
        {pending.error && (
          <p className="mt-1 text-xs text-red-600">{pending.error}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
        {(pending.status === "error" ||
          (pending.status === "pending" && isOnline)) && (
          <button
            type="button"
            disabled={busy}
            onClick={onRetry}
            className="rounded-lg border border-brand/30 bg-white px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand/5 disabled:opacity-50"
          >
            Publicar agora
          </button>
        )}
        <button
          type="button"
          disabled={busy || pending.status === "syncing"}
          onClick={onRemove}
          className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          Remover
        </button>
      </div>
    </li>
  );
}

function MyItemsTab({ view }: { view: string | null }) {
  const { user, token, ready } = useAuthRedirect();
  const {
    pendingItems,
    retryPendingItem,
    removePendingItem,
    isOnline,
  } = useOfflineQueue();
  const [items, setItems] = useState<Item[] | null>(null);
  const [interests, setInterests] = useState<ItemInterest[] | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [offlineSnapshot, setOfflineSnapshot] = useState(false);
  const [busyPendingId, setBusyPendingId] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState<{ title: string } | null>(null);

  const initialTab =
    view === "concluidos" ||
    view === "negociando" ||
    view === "interessados" ||
    view === "publicados"
      ? view
      : undefined;

  useEffect(() => {
    setJustSaved(consumeOfflineItemJustSaved());
  }, []);

  const load = useCallback(() => {
    if (!token) return;
    setError(false);
    setOfflineSnapshot(false);
    api
      .getMyItems(token)
      .then((rows) => {
        setItems(rows);
        saveMyItemsCache(rows, user?.id);
        setOfflineSnapshot(false);
      })
      .catch(() => {
        const cached = loadMyItemsCache(user?.id);
        if (cached && cached.length > 0) {
          setItems(cached);
          setOfflineSnapshot(true);
          setError(false);
        } else {
          setItems([]);
          // Offline com fila pendente não é erro — só aviso suave
          setError(navigator.onLine);
          setOfflineSnapshot(!navigator.onLine);
        }
      });
    api
      .getMyInterests(token)
      .then(setInterests)
      .catch(() => setInterests([]));
  }, [token, user?.id]);

  useEffect(load, [load]);

  const prevPending = useRef(pendingItems.length);
  useEffect(() => {
    if (prevPending.current > 0 && pendingItems.length === 0 && isOnline) {
      load();
    }
    prevPending.current = pendingItems.length;
  }, [pendingItems.length, isOnline, load]);

  if (!ready || !token) return null;

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.deleteItem(token, id);
      setItems((prev) => {
        const next = prev?.filter((item) => item.id !== id) ?? null;
        if (next) saveMyItemsCache(next, user?.id);
        return next;
      });
    } catch {
      if (!navigator.onLine) {
        setError(false);
      } else {
        setError(true);
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleItemUpdated = (updated: Item) => {
    setItems((prev) => {
      const next =
        prev?.map((item) => (item.id === updated.id ? updated : item)) ?? null;
      if (next) saveMyItemsCache(next, user?.id);
      return next;
    });
  };

  const handleInterestUpdated = (updated: ItemInterest) => {
    setInterests(
      (prev) =>
        prev?.map((row) => (row.id === updated.id ? { ...row, ...updated } : row)) ??
        null,
    );
  };

  const handleRetry = async (id: string) => {
    setBusyPendingId(id);
    try {
      await retryPendingItem(id);
    } finally {
      setBusyPendingId(null);
    }
  };

  const handleRemovePending = async (id: string) => {
    setBusyPendingId(id);
    try {
      await removePendingItem(id);
    } finally {
      setBusyPendingId(null);
    }
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <h1 className="text-xl font-bold text-navy">
        {view === "concluidos" ? "Minhas vendas / doações" : "Meus anúncios"}
      </h1>

      {justSaved && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
        >
          <span
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white"
            aria-hidden
          >
            ✓
          </span>
          <div>
            <p className="font-semibold">Anúncio carregado</p>
            <p className="mt-0.5 text-emerald-900/90">
              <span className="font-medium">&ldquo;{justSaved.title}&rdquo;</span>{" "}
              está salvo neste aparelho. Aguardando conexão para publicar.
            </p>
          </div>
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setJustSaved(null)}
            className="ml-auto shrink-0 text-emerald-700/70 hover:text-emerald-900"
          >
            ×
          </button>
        </div>
      )}

      {pendingItems.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-navy">
              Fila offline ({pendingItems.length})
            </h2>
            <p className="text-xs text-muted">
              {isOnline
                ? "Sincronizando com o servidor…"
                : "Sem internet — publicação automática ao reconectar"}
            </p>
          </div>
          <ul className="flex flex-col gap-2">
            {pendingItems.map((pending) => (
              <PendingItemRow
                key={pending.id}
                pending={pending}
                isOnline={isOnline}
                busy={busyPendingId === pending.id}
                onRetry={() => void handleRetry(pending.id)}
                onRemove={() => void handleRemovePending(pending.id)}
              />
            ))}
          </ul>
        </section>
      )}

      {offlineSnapshot && !error && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-800">
          {items && items.length > 0
            ? "Você está offline — mostrando a última versão salva dos seus anúncios."
            : "Você está offline. Anúncios já publicados aparecerão aqui quando houver conexão."}
        </p>
      )}

      {error && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-800">
          Não foi possível atualizar a lista. Tente novamente quando estiver
          online.
        </p>
      )}

      <ItemStatusTabs
        items={items}
        interests={interests}
        token={token}
        deletingId={deletingId}
        initialTab={initialTab}
        onDeleteItem={handleDelete}
        onItemUpdated={handleItemUpdated}
        onInterestUpdated={handleInterestUpdated}
      />
    </div>
  );
}

export default function AppPage() {
  return (
    <Suspense>
      <AppShell />
    </Suspense>
  );
}
