import type { Collection } from "mongodb";
import { cacheStore } from "@/lib/cache";
import { isMongoConfigured, getMongoClient, getMongoDbName } from "@/lib/mongodb";
import { buildNotificationChannelName, normalizeNotificationUserKey } from "@/lib/notifications/channel";
import { getPusherServer, isPusherConfigured } from "@/lib/realtime/pusher-server";
import { dispatchPushNotifications } from "@/lib/notifications/push";

export type AppNotificationKind = "message" | "billing" | "system";

export type AppNotification = {
  id: string;
  kind: AppNotificationKind;
  title: string;
  body: string;
  href?: string;
  createdAt: string;
  readAt?: string | null;
  metadata?: Record<string, string>;
};

type NotificationDocument = AppNotification & {
  userKey: string;
  updatedAt: string;
};

const NOTIFICATIONS_TTL_SECONDS = 180 * 24 * 60 * 60;
const NOTIFICATIONS_LIMIT = 100;
let collectionPromise: Promise<Collection<NotificationDocument> | null> | null = null;

function notificationsKey(userKey: string): string {
  return `notifications:${normalizeNotificationUserKey(userKey)}`;
}

async function getNotificationsCollection() {
  if (!isMongoConfigured()) {
    return null;
  }

  if (!collectionPromise) {
    collectionPromise = (async () => {
      const client = await getMongoClient();
      const collection = client.db(getMongoDbName()).collection<NotificationDocument>("notifications");
      await collection.createIndexes([
        { key: { userKey: 1, createdAt: -1 }, name: "userKey_createdAt_desc" },
        { key: { userKey: 1, readAt: 1 }, name: "userKey_readAt" },
        { key: { updatedAt: 1 }, name: "updatedAt" },
      ]);
      return collection;
    })().catch((error) => {
      collectionPromise = null;
      console.error("[notifications] Mongo collection initialization failed", error);
      return null;
    });
  }

  return collectionPromise;
}

async function getNotificationsFromCache(userKey: string): Promise<AppNotification[]> {
  const stored = await cacheStore.get<AppNotification[]>(notificationsKey(userKey));
  return Array.isArray(stored) ? stored : [];
}

async function setNotificationsCache(userKey: string, notifications: AppNotification[]) {
  await cacheStore.set(notificationsKey(userKey), notifications.slice(0, NOTIFICATIONS_LIMIT), NOTIFICATIONS_TTL_SECONDS);
}

async function publishNotificationRealtime(userKey: string, notification: AppNotification) {
  if (!isPusherConfigured()) {
    return;
  }

  try {
    await getPusherServer().trigger(buildNotificationChannelName(userKey), "notification.created", {
      item: {
        ...notification,
        timeLabel: "A l'instant",
        isUnread: !notification.readAt,
      },
      unreadCountDelta: notification.readAt ? 0 : 1,
    });
  } catch (error) {
    console.error("[notifications] Failed to publish realtime event", error);
  }
}

export { normalizeNotificationUserKey };

export async function getNotifications(userKey: string): Promise<AppNotification[]> {
  const normalized = normalizeNotificationUserKey(userKey);
  if (!normalized) {
    return [];
  }

  const collection = await getNotificationsCollection();
  if (!collection) {
    return getNotificationsFromCache(normalized);
  }

  try {
    const documents = await collection.find({ userKey: normalized }).sort({ createdAt: -1 }).limit(NOTIFICATIONS_LIMIT).toArray();
    return documents.map(({ userKey: _userKey, updatedAt: _updatedAt, ...notification }) => notification);
  } catch (error) {
    console.error("[notifications] Failed to read Mongo notifications", error);
    return getNotificationsFromCache(normalized);
  }
}

export async function addNotification(userKey: string, notification: AppNotification): Promise<AppNotification[]> {
  const normalized = normalizeNotificationUserKey(userKey);
  if (!normalized) {
    return [];
  }

  const nextNotification: AppNotification = {
    ...notification,
    id: String(notification.id || "").trim(),
    createdAt: notification.createdAt || new Date().toISOString(),
    readAt: notification.readAt || null,
  };

  const collection = await getNotificationsCollection();
  if (!collection) {
    const existing = await getNotificationsFromCache(normalized);
    const next = [nextNotification, ...existing.filter((entry) => entry.id !== nextNotification.id)].slice(0, NOTIFICATIONS_LIMIT);
    await setNotificationsCache(normalized, next);
    await publishNotificationRealtime(normalized, nextNotification);
    return next;
  }

  try {
    const writeResult = await collection.updateOne(
      { userKey: normalized, id: nextNotification.id },
      {
        $set: {
          ...nextNotification,
          userKey: normalized,
          updatedAt: new Date().toISOString(),
        },
      },
      { upsert: true },
    );

    const items = await getNotifications(normalized);
    await setNotificationsCache(normalized, items);
    await publishNotificationRealtime(normalized, nextNotification);
    if (writeResult.upsertedCount > 0) {
      void dispatchPushNotifications(normalized, nextNotification).catch((error) => {
        console.error("[push] notification dispatch failed", error);
      });
    }
    return items;
  } catch (error) {
    console.error("[notifications] Failed to persist Mongo notification", error);
    const existing = await getNotificationsFromCache(normalized);
    const next = [nextNotification, ...existing.filter((entry) => entry.id !== nextNotification.id)].slice(0, NOTIFICATIONS_LIMIT);
    await setNotificationsCache(normalized, next);
    await publishNotificationRealtime(normalized, nextNotification);
    return next;
  }
}

export async function markNotificationRead(userKey: string, notificationId: string): Promise<AppNotification[]> {
  const normalized = normalizeNotificationUserKey(userKey);
  if (!normalized || !notificationId) {
    return [];
  }

  const collection = await getNotificationsCollection();
  if (!collection) {
    const existing = await getNotificationsFromCache(normalized);
    const next = existing.map((entry) =>
      entry.id === notificationId && !entry.readAt
        ? {
            ...entry,
            readAt: new Date().toISOString(),
          }
        : entry,
    );
    await setNotificationsCache(normalized, next);
    return next;
  }

  try {
    await collection.updateOne(
      { userKey: normalized, id: notificationId, readAt: null },
      { $set: { readAt: new Date().toISOString(), updatedAt: new Date().toISOString() } },
    );
    const items = await getNotifications(normalized);
    await setNotificationsCache(normalized, items);
    return items;
  } catch (error) {
    console.error("[notifications] Failed to mark notification read in Mongo", error);
    const existing = await getNotificationsFromCache(normalized);
    const next = existing.map((entry) =>
      entry.id === notificationId && !entry.readAt
        ? {
            ...entry,
            readAt: new Date().toISOString(),
          }
        : entry,
    );
    await setNotificationsCache(normalized, next);
    return next;
  }
}

export async function markAllNotificationsRead(userKey: string): Promise<AppNotification[]> {
  const normalized = normalizeNotificationUserKey(userKey);
  if (!normalized) {
    return [];
  }

  const now = new Date().toISOString();
  const collection = await getNotificationsCollection();
  if (!collection) {
    const existing = await getNotificationsFromCache(normalized);
    const next = existing.map((entry) => ({
      ...entry,
      readAt: entry.readAt || now,
    }));
    await setNotificationsCache(normalized, next);
    return next;
  }

  try {
    await collection.updateMany(
      { userKey: normalized, readAt: null },
      { $set: { readAt: now, updatedAt: now } },
    );
    const items = await getNotifications(normalized);
    await setNotificationsCache(normalized, items);
    return items;
  } catch (error) {
    console.error("[notifications] Failed to mark all notifications read in Mongo", error);
    const existing = await getNotificationsFromCache(normalized);
    const next = existing.map((entry) => ({
      ...entry,
      readAt: entry.readAt || now,
    }));
    await setNotificationsCache(normalized, next);
    return next;
  }
}

export async function deleteNotification(userKey: string, notificationId: string): Promise<AppNotification[]> {
  const normalized = normalizeNotificationUserKey(userKey);
  if (!normalized || !notificationId) {
    return [];
  }

  const collection = await getNotificationsCollection();
  if (!collection) {
    const next = (await getNotificationsFromCache(normalized)).filter((entry) => entry.id !== notificationId);
    await setNotificationsCache(normalized, next);
    return next;
  }

  try {
    await collection.deleteOne({ userKey: normalized, id: notificationId });
    const items = await getNotifications(normalized);
    await setNotificationsCache(normalized, items);
    return items;
  } catch (error) {
    console.error("[notifications] Failed to delete Mongo notification", error);
    const next = (await getNotificationsFromCache(normalized)).filter((entry) => entry.id !== notificationId);
    await setNotificationsCache(normalized, next);
    return next;
  }
}



export async function markMessageNotificationsRead(
  userKey: string,
  filters: {
    listingId?: string | number | null;
    channel?: string | null;
    href?: string | null;
  },
): Promise<AppNotification[]> {
  const normalized = normalizeNotificationUserKey(userKey);
  if (!normalized) {
    return [];
  }

  const listingId = String(filters.listingId || "").trim();
  const channel = String(filters.channel || "").trim();
  const href = String(filters.href || "").trim();
  const now = new Date().toISOString();

  const matchesTarget = (entry: AppNotification) => {
    if (entry.kind !== "message" || entry.readAt) {
      return false;
    }

    if (listingId && String(entry.metadata?.listingId || "").trim() !== listingId) {
      return false;
    }

    if (channel && String(entry.metadata?.channel || "").trim() !== channel) {
      return false;
    }

    if (href && String(entry.href || "").trim() !== href) {
      return false;
    }

    return true;
  };

  const collection = await getNotificationsCollection();
  if (!collection) {
    const existing = await getNotificationsFromCache(normalized);
    const next = existing.map((entry) =>
      matchesTarget(entry)
        ? {
            ...entry,
            readAt: now,
          }
        : entry,
    );
    await setNotificationsCache(normalized, next);
    return next;
  }

  try {
    const mongoFilter: Record<string, unknown> = {
      userKey: normalized,
      kind: "message",
      readAt: null,
    };

    if (listingId) {
      mongoFilter["metadata.listingId"] = listingId;
    }

    if (channel) {
      mongoFilter["metadata.channel"] = channel;
    }

    if (href) {
      mongoFilter.href = href;
    }

    await collection.updateMany(
      mongoFilter,
      { $set: { readAt: now, updatedAt: now } },
    );
    const items = await getNotifications(normalized);
    await setNotificationsCache(normalized, items);
    return items;
  } catch (error) {
    console.error("[notifications] Failed to mark message notifications read in Mongo", error);
    const existing = await getNotificationsFromCache(normalized);
    const next = existing.map((entry) =>
      matchesTarget(entry)
        ? {
            ...entry,
            readAt: now,
          }
        : entry,
    );
    await setNotificationsCache(normalized, next);
    return next;
  }
}
