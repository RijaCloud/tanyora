import webpush from "web-push";
import type { Collection } from "mongodb";
import { getMongoClient, getMongoDbName, isMongoConfigured } from "@/lib/mongodb";
import { normalizeNotificationUserKey } from "@/lib/notifications/channel";
import type { AppNotification } from "@/lib/notifications/store";
import { getWordPressWebPushConfig } from "@/lib/api/wordpress-internal";

type StoredPushSubscription = {
  userKey: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  createdAt: string;
  updatedAt: string;
};

type BrowserPushSubscription = Pick<StoredPushSubscription, "endpoint" | "keys">;

let collectionPromise: Promise<Collection<StoredPushSubscription> | null> | null = null;
const VAPID_CONFIG_CACHE_TTL_MS = 60_000;
let vapidConfigCache: { expiresAt: number; config: VapidConfig | null } | null = null;

type VapidConfig = {
  publicKey: string;
  privateKey: string;
  subject: string;
};

async function getVapidConfig(): Promise<VapidConfig | null> {
  const now = Date.now();
  if (vapidConfigCache && vapidConfigCache.expiresAt > now) {
    return vapidConfigCache.config;
  }

  try {
    const config = await getWordPressWebPushConfig();
    const publicKey = config.publicKey?.trim() || "";
    const privateKey = config.privateKey?.trim() || "";
    const subject = config.subject?.trim() || "";
    const resolved = config.configured && publicKey && privateKey && subject
      ? { publicKey, privateKey, subject }
      : null;
    vapidConfigCache = { config: resolved, expiresAt: now + VAPID_CONFIG_CACHE_TTL_MS };
    return resolved;
  } catch (error) {
    // Push delivery is optional; callers treat an unavailable WordPress
    // configuration as disabled without exposing any secret in logs.
    console.warn("[push] VAPID configuration is unavailable", {
      errorName: error instanceof Error ? error.name : typeof error,
    });
    vapidConfigCache = { config: null, expiresAt: now + VAPID_CONFIG_CACHE_TTL_MS };
    return null;
  }
}

function isValidSubscription(subscription: unknown): subscription is BrowserPushSubscription {
  if (!subscription || typeof subscription !== "object") return false;
  const value = subscription as Partial<BrowserPushSubscription>;
  return (
    typeof value.endpoint === "string" &&
    value.endpoint.startsWith("https://") &&
    value.endpoint.length <= 2048 &&
    typeof value.keys?.p256dh === "string" &&
    typeof value.keys?.auth === "string"
  );
}

async function getPushCollection() {
  if (!isMongoConfigured()) return null;
  if (!collectionPromise) {
    collectionPromise = (async () => {
      const collection = (await getMongoClient()).db(getMongoDbName()).collection<StoredPushSubscription>("push_subscriptions");
      await collection.createIndexes([
        { key: { endpoint: 1 }, name: "endpoint_unique", unique: true },
        { key: { userKey: 1, updatedAt: -1 }, name: "userKey_updatedAt_desc" },
      ]);
      return collection;
    })().catch((error) => {
      collectionPromise = null;
      console.error("[push] Mongo collection initialization failed", error);
      return null;
    });
  }
  return collectionPromise;
}

export async function getPublicPushConfig() {
  const config = await getVapidConfig();
  return { configured: Boolean(config), publicKey: config?.publicKey || null };
}

export async function savePushSubscription(userKey: string, subscription: unknown) {
  const normalizedUserKey = normalizeNotificationUserKey(userKey);
  if (!normalizedUserKey || !isValidSubscription(subscription)) return false;
  const collection = await getPushCollection();
  if (!collection) return false;

  const now = new Date().toISOString();
  try {
    await collection.updateOne(
      { endpoint: subscription.endpoint },
      {
        $set: { userKey: normalizedUserKey, endpoint: subscription.endpoint, keys: subscription.keys, updatedAt: now },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );
    return true;
  } catch (error) {
    console.error("[push] subscription persistence failed", {
      errorName: error instanceof Error ? error.name : typeof error,
    });
    return false;
  }
}

export async function removePushSubscription(userKey: string, endpoint: string) {
  const normalizedUserKey = normalizeNotificationUserKey(userKey);
  const collection = await getPushCollection();
  if (!normalizedUserKey || !collection || !endpoint) return false;
  await collection.deleteOne({ userKey: normalizedUserKey, endpoint });
  return true;
}

export async function getPushSubscriptionStatus(userKey: string) {
  const normalizedUserKey = normalizeNotificationUserKey(userKey);
  const collection = await getPushCollection();
  const enabled = Boolean(normalizedUserKey && collection && (await collection.countDocuments({ userKey: normalizedUserKey }, { limit: 1 })) > 0);
  return { ...(await getPublicPushConfig()), enabled };
}

export async function dispatchPushNotifications(userKey: string, notification: AppNotification) {
  const normalizedUserKey = normalizeNotificationUserKey(userKey);
  const config = await getVapidConfig();
  const collection = await getPushCollection();
  if (!normalizedUserKey || !config || !collection) return;

  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  const subscriptions = await collection.find({ userKey: normalizedUserKey }).toArray();
  const payload = JSON.stringify({ title: notification.title, body: notification.body, href: notification.href || "/profil" });

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification({ endpoint: subscription.endpoint, keys: subscription.keys }, payload, { TTL: 60 * 60 });
      } catch (error) {
        const statusCode = typeof error === "object" && error && "statusCode" in error ? Number(error.statusCode) : 0;
        if (statusCode === 404 || statusCode === 410) {
          await collection.deleteOne({ endpoint: subscription.endpoint });
          return;
        }
        console.error("[push] notification delivery failed", { endpoint: subscription.endpoint, statusCode });
      }
    }),
  );
}
