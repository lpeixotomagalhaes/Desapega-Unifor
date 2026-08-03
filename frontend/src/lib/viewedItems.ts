import type { Item } from "./api";
import { getAllViewedItems, putViewedItem } from "./offlineDb";

export async function recordViewedItem(item: Item): Promise<void> {
  try {
    await putViewedItem({
      id: item.id,
      item,
      viewedAt: Date.now(),
    });
  } catch {
    // IndexedDB may be unavailable
  }
}

export async function getViewedItems(): Promise<Item[]> {
  try {
    const rows = await getAllViewedItems();
    return rows.map((row) => row.item);
  } catch {
    return [];
  }
}
