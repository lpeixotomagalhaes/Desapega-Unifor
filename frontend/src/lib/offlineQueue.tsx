"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api, ApiError, type CreateItemInput } from "./api";
import { useAuth } from "./auth";
import {
  deletePendingItem,
  getAllPendingItems,
  putPendingItem,
  type PendingItem,
  type PendingItemForm,
  type PendingItemImage,
} from "./offlineDb";

const SYNC_TAG = "sync-pending-items";

type OfflineQueueContextValue = {
  isOnline: boolean;
  pendingItems: PendingItem[];
  pendingCount: number;
  addPendingItem: (
    form: PendingItemForm,
    images: File[],
    token: string,
  ) => Promise<string>;
  flush: () => Promise<void>;
  retryPendingItem: (id: string) => Promise<void>;
  removePendingItem: (id: string) => Promise<void>;
};

const OfflineQueueContext = createContext<OfflineQueueContextValue | null>(null);

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function registerBackgroundSync(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const syncManager = (
      registration as ServiceWorkerRegistration & {
        sync?: { register: (tag: string) => Promise<void> };
      }
    ).sync;
    if (syncManager) {
      await syncManager.register(SYNC_TAG);
    }
  } catch {
    // Background Sync is unsupported on iOS Safari; online-event flush is the fallback.
  }
}

async function publishPendingItem(item: PendingItem): Promise<void> {
  // Reaproveita fotos já enviadas numa tentativa anterior — evita duplicar
  // upload (e deixar imagens órfãs) quando só a criação do anúncio falhou.
  const urls: string[] = [...(item.uploadedUrls ?? [])];
  for (let i = urls.length; i < item.images.length; i++) {
    const image = item.images[i];
    const file = new File([image.blob], image.name, { type: image.type });
    const { url } = await api.uploadImage(item.token, file);
    urls.push(url);
    await putPendingItem({ ...item, uploadedUrls: [...urls] });
  }

  const payload: CreateItemInput = {
    title: item.form.title,
    description: item.form.description,
    categories: item.form.categories,
    isDonation: item.form.isDonation,
    imageUrl: urls[0],
    imageUrls: urls,
    ...(item.form.isDonation ? {} : { price: Number(item.form.price) }),
  };

  await api.createItem(item.token, payload);
}

export function OfflineQueueProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const flushingRef = useRef(false);
  const userId = user?.id ?? null;

  const refresh = useCallback(async () => {
    try {
      const rows = await getAllPendingItems();
      // Cada aparelho pode ter fila de mais de uma conta (sign-out não
      // apaga instantaneamente em todos os casos) — só mostra a do usuário logado.
      setPendingItems(userId ? rows.filter((row) => row.userId === userId) : []);
    } catch {
      // IndexedDB may be unavailable in private mode
    }
  }, [userId]);

  const flush = useCallback(async () => {
    if (flushingRef.current || !navigator.onLine || !userId) return;
    flushingRef.current = true;
    try {
      const rows = await getAllPendingItems();
      // Itens travados em "syncing" (aba fechada/recarregada no meio do
      // upload) voltam para "pending" para não ficarem esquecidos para sempre.
      const stuck = rows.filter(
        (row) => row.userId === userId && row.status === "syncing",
      );
      for (const row of stuck) {
        await putPendingItem({ ...row, status: "pending" });
      }

      const queue = stuck.length > 0 ? await getAllPendingItems() : rows;
      for (const item of queue) {
        if (item.userId !== userId) continue;
        if (item.status !== "pending") continue;
        const syncing: PendingItem = { ...item, status: "syncing", error: undefined };
        await putPendingItem(syncing);
        await refresh();
        try {
          await publishPendingItem(syncing);
          await deletePendingItem(item.id);
        } catch (err) {
          const message =
            err instanceof ApiError
              ? err.message
              : err instanceof Error
                ? err.message
                : "Falha ao publicar anúncio.";
          await putPendingItem({
            ...item,
            status: "error",
            error: message,
          });
        }
        await refresh();
      }
    } finally {
      flushingRef.current = false;
      await refresh();
    }
  }, [refresh, userId]);

  useEffect(() => {
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      void flush();
    };
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [flush]);

  useEffect(() => {
    if (isOnline && pendingItems.length > 0) {
      void flush();
    }
  }, [isOnline, pendingItems.length, flush]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "FLUSH_PENDING_ITEMS") {
        void flush();
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => {
      navigator.serviceWorker.removeEventListener("message", onMessage);
    };
  }, [flush]);

  const addPendingItem = useCallback(
    async (form: PendingItemForm, images: File[], token: string) => {
      if (!userId) {
        throw new Error("É preciso estar logado para salvar um anúncio offline.");
      }
      const id = newId();
      // Clona para Blob puro — IndexedDB estrutura File de forma inconsistente em alguns browsers
      const storedImages: PendingItemImage[] = await Promise.all(
        images.map(async (file) => {
          const buffer = await file.arrayBuffer();
          return {
            name: file.name || `foto-${Date.now()}.jpg`,
            type: file.type || "image/jpeg",
            blob: new Blob([buffer], { type: file.type || "image/jpeg" }),
          };
        }),
      );
      if (storedImages.length === 0) {
        throw new Error("Adicione pelo menos uma foto do item.");
      }
      const item: PendingItem = {
        id,
        createdAt: Date.now(),
        userId,
        token,
        form: {
          title: form.title.trim(),
          description: form.description.trim(),
          categories: form.categories,
          price: form.price,
          isDonation: form.isDonation,
        },
        images: storedImages,
        status: "pending",
      };
      await putPendingItem(item);
      await refresh();
      await registerBackgroundSync();
      return id;
    },
    [refresh, userId],
  );

  const removePendingItem = useCallback(
    async (id: string) => {
      await deletePendingItem(id);
      await refresh();
    },
    [refresh],
  );

  const retryPendingItem = useCallback(
    async (id: string) => {
      const rows = await getAllPendingItems();
      const target = rows.find((row) => row.id === id);
      if (!target) return;
      await putPendingItem({ ...target, status: "pending", error: undefined });
      await refresh();
      await registerBackgroundSync();
      if (navigator.onLine) {
        await flush();
      }
    },
    [flush, refresh],
  );

  const value = useMemo(
    () => ({
      isOnline,
      pendingItems,
      pendingCount: pendingItems.length,
      addPendingItem,
      flush,
      retryPendingItem,
      removePendingItem,
    }),
    [
      isOnline,
      pendingItems,
      addPendingItem,
      flush,
      retryPendingItem,
      removePendingItem,
    ],
  );

  return (
    <OfflineQueueContext.Provider value={value}>
      {children}
    </OfflineQueueContext.Provider>
  );
}

export function useOfflineQueue(): OfflineQueueContextValue {
  const ctx = useContext(OfflineQueueContext);
  if (!ctx) {
    throw new Error("useOfflineQueue deve ser usado dentro de OfflineQueueProvider");
  }
  return ctx;
}
