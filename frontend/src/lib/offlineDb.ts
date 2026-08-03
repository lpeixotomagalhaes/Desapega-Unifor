import type { Category, Item } from "./api";

const DB_NAME = "desapega-offline";
const DB_VERSION = 1;

export type PendingItemStatus = "pending" | "syncing" | "error";

export type PendingItemForm = {
  title: string;
  description: string;
  categories: Category[];
  price: string;
  isDonation: boolean;
};

export type PendingItemImage = {
  name: string;
  type: string;
  blob: Blob;
};

export type PendingItem = {
  id: string;
  createdAt: number;
  token: string;
  form: PendingItemForm;
  images: PendingItemImage[];
  status: PendingItemStatus;
  error?: string;
};

export type ViewedItemRecord = {
  id: string;
  item: Item;
  viewedAt: number;
};

const MAX_VIEWED = 30;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("pendingItems")) {
        db.createObjectStore("pendingItems", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("viewedItems")) {
        const store = db.createObjectStore("viewedItems", { keyPath: "id" });
        store.createIndex("viewedAt", "viewedAt");
      }
    };
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed"));
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted"));
  });
}

function reqToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

export async function putPendingItem(item: PendingItem): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("pendingItems", "readwrite");
  tx.objectStore("pendingItems").put(item);
  await txDone(tx);
  db.close();
}

export async function getAllPendingItems(): Promise<PendingItem[]> {
  const db = await openDb();
  const tx = db.transaction("pendingItems", "readonly");
  const rows = await reqToPromise(tx.objectStore("pendingItems").getAll());
  await txDone(tx);
  db.close();
  return (rows as PendingItem[]).sort((a, b) => a.createdAt - b.createdAt);
}

export async function getPendingItem(id: string): Promise<PendingItem | undefined> {
  const db = await openDb();
  const tx = db.transaction("pendingItems", "readonly");
  const row = await reqToPromise(tx.objectStore("pendingItems").get(id));
  await txDone(tx);
  db.close();
  return row as PendingItem | undefined;
}

export async function deletePendingItem(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("pendingItems", "readwrite");
  tx.objectStore("pendingItems").delete(id);
  await txDone(tx);
  db.close();
}

export async function putViewedItem(record: ViewedItemRecord): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("viewedItems", "readwrite");
  const store = tx.objectStore("viewedItems");
  store.put(record);

  const all = await reqToPromise(store.getAll());
  const sorted = (all as ViewedItemRecord[]).sort((a, b) => b.viewedAt - a.viewedAt);
  if (sorted.length > MAX_VIEWED) {
    for (const stale of sorted.slice(MAX_VIEWED)) {
      store.delete(stale.id);
    }
  }

  await txDone(tx);
  db.close();
}

export async function getAllViewedItems(): Promise<ViewedItemRecord[]> {
  const db = await openDb();
  const tx = db.transaction("viewedItems", "readonly");
  const rows = await reqToPromise(tx.objectStore("viewedItems").getAll());
  await txDone(tx);
  db.close();
  return (rows as ViewedItemRecord[]).sort((a, b) => b.viewedAt - a.viewedAt);
}
