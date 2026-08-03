import type { Item } from "./api";

const MY_ITEMS_KEY = "desapega.myItemsCache";
const OFFLINE_SAVED_FLAG = "desapega.offlineItemJustSaved";

type MyItemsCache = {
  items: Item[];
  cachedAt: number;
  userId?: string;
};

export function saveMyItemsCache(items: Item[], userId?: string): void {
  try {
    const payload: MyItemsCache = {
      items,
      cachedAt: Date.now(),
      userId,
    };
    localStorage.setItem(MY_ITEMS_KEY, JSON.stringify(payload));
  } catch {
    // storage unavailable
  }
}

export function loadMyItemsCache(userId?: string): Item[] | null {
  try {
    const raw = localStorage.getItem(MY_ITEMS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MyItemsCache;
    if (userId && parsed.userId && parsed.userId !== userId) return null;
    return Array.isArray(parsed.items) ? parsed.items : null;
  } catch {
    return null;
  }
}

/** Marca que um anúncio acabou de ser salvo offline (para banner de sucesso). */
export function markOfflineItemJustSaved(title: string): void {
  try {
    sessionStorage.setItem(
      OFFLINE_SAVED_FLAG,
      JSON.stringify({ title, at: Date.now() }),
    );
  } catch {
    // ignore
  }
}

export function consumeOfflineItemJustSaved(): { title: string } | null {
  try {
    const raw = sessionStorage.getItem(OFFLINE_SAVED_FLAG);
    sessionStorage.removeItem(OFFLINE_SAVED_FLAG);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { title: string; at: number };
    // só mostra se foi há menos de 30s
    if (Date.now() - parsed.at > 30_000) return null;
    return { title: parsed.title };
  } catch {
    return null;
  }
}
