import { cacheStore } from "@/lib/cache";

export type SavedItemKind = "article" | "job" | "tender" | "classified" | "directory" | "radio";

export type SavedItem = {
  key: string;
  kind: SavedItemKind;
  itemId: string;
  slug?: string;
  title: string;
  description?: string;
  image?: string;
  location?: string;
  price?: string;
  sourceLabel?: string;
  createdAt: string;
};

const SAVED_ITEMS_TTL_SECONDS = 365 * 24 * 60 * 60;

function savedItemsKey(userKey: string): string {
  return `profile:saved:${userKey}`;
}

export async function getSavedItems(userKey: string): Promise<SavedItem[]> {
  if (!userKey.trim()) return [];
  const items = (await cacheStore.get<SavedItem[]>(savedItemsKey(userKey))) ?? [];
  return Array.isArray(items) ? items : [];
}

async function setSavedItems(userKey: string, items: SavedItem[]): Promise<void> {
  await cacheStore.set(savedItemsKey(userKey), items, SAVED_ITEMS_TTL_SECONDS);
}

export async function isSavedItem(userKey: string, kind: SavedItemKind, itemId: string): Promise<boolean> {
  const items = await getSavedItems(userKey);
  return items.some((item) => item.kind === kind && item.itemId === itemId);
}

export async function addSavedItem(userKey: string, item: Omit<SavedItem, "key" | "createdAt">): Promise<SavedItem[]> {
  const current = await getSavedItems(userKey);
  const next: SavedItem[] = [
    {
      ...item,
      key: `${item.kind}:${item.itemId}`,
      createdAt: new Date().toISOString(),
    },
    ...current.filter((entry) => !(entry.kind === item.kind && entry.itemId === item.itemId)),
  ].slice(0, 500);

  await setSavedItems(userKey, next);
  return next;
}

export async function removeSavedItem(userKey: string, kind: SavedItemKind, itemId: string): Promise<SavedItem[]> {
  const current = await getSavedItems(userKey);
  const next = current.filter((entry) => !(entry.kind === kind && entry.itemId === itemId));
  await setSavedItems(userKey, next);
  return next;
}

export async function toggleSavedItem(userKey: string, item: Omit<SavedItem, "key" | "createdAt">): Promise<{ saved: boolean; items: SavedItem[] }> {
  const alreadySaved = await isSavedItem(userKey, item.kind, item.itemId);
  if (alreadySaved) {
    const items = await removeSavedItem(userKey, item.kind, item.itemId);
    return { saved: false, items };
  }

  const items = await addSavedItem(userKey, item);
  return { saved: true, items };
}
