import { randomUUID, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { cacheStore } from "@/lib/cache";
import { getMongoClient, getMongoDbName, isMongoConfigured } from "@/lib/mongodb";
import { normalizeNotificationUserKey } from "@/lib/notifications/channel";

type StressUser = { id: number; email: string; name: string };
type StressListing = { id: number; kind: "classified" | "job" | "tender"; title: string };
type StressPayload = {
  action?: "seed" | "cleanup" | "seed-batch" | "cleanup-batch" | "cleanup-finalize";
  campaignId?: string;
  users?: StressUser[];
  listings?: StressListing[];
  offset?: number;
  favorites?: number;
  notifications?: number;
};

const MESSAGE_TTL_SECONDS = 90 * 24 * 60 * 60;
const NOTIFICATION_TTL_SECONDS = 180 * 24 * 60 * 60;
const SAVED_ITEMS_TTL_SECONDS = 365 * 24 * 60 * 60;

function isAuthorized(request: NextRequest) {
  const expected = process.env.PLATFORM_SUBMISSIONS_SECRET?.trim();
  const received = request.headers.get("x-2424-internal-secret")?.trim();
  if (!expected || !received) return false;
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

function isStagingRequest(request: NextRequest) {
  const host = request.nextUrl.hostname.toLowerCase();
  return ["staging.2424.mg", "2424.winfordcap.com", "localhost", "127.0.0.1"].includes(host);
}

function normalizeUsers(value: unknown): StressUser[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => ({
      id: Number(entry?.id),
      email: String(entry?.email || "").trim().toLowerCase(),
      name: String(entry?.name || "Utilisateur recette").trim().slice(0, 120),
    }))
    .filter((entry) => Number.isInteger(entry.id) && entry.id > 0 && entry.email.includes("@"));
}

function normalizeListings(value: unknown): StressListing[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => ({
      id: Number(entry?.id),
      kind: entry?.kind === "job" || entry?.kind === "tender" ? entry.kind : "classified",
      title: String(entry?.title || "Publication de recette").trim().slice(0, 220),
    }))
    .filter((entry) => Number.isInteger(entry.id) && entry.id > 0);
}

function messageKey(kind: StressListing["kind"], listingId: number) {
  return `listing:messages:${kind}:${listingId}`;
}

function userIndexKey(kind: StressListing["kind"], email: string) {
  return `listing:messages:index:${kind}:${normalizeNotificationUserKey(email)}`;
}

function notificationKey(email: string) {
  return `notifications:${normalizeNotificationUserKey(email)}`;
}

function savedItemsKey(email: string) {
  return `profile:saved:${normalizeNotificationUserKey(email)}`;
}

async function seedCampaign(campaignId: string, users: StressUser[], listings: StressListing[]) {
  const selectedListings = listings.slice(0, 600);
  const indexes = new Map<string, number[]>();
  let messages = 0;

  for (let index = 0; index < selectedListings.length; index++) {
    const listing = selectedListings[index];
    const sender = users[index % users.length];
    const recipient = users[(index + 1) % users.length];
    const thread = Array.from({ length: 3 }, (_, messageIndex) => ({
      id: `stress:${campaignId}:message:${index}:${messageIndex}`,
      kind: listing.kind,
      listingId: listing.id,
      senderWpUserId: messageIndex % 2 === 0 ? sender.id : recipient.id,
      senderName: messageIndex % 2 === 0 ? sender.name : recipient.name,
      senderEmail: messageIndex % 2 === 0 ? sender.email : recipient.email,
      recipientEmail: messageIndex % 2 === 0 ? recipient.email : sender.email,
      content: `Message de recette ${messageIndex + 1} au sujet de ${listing.title}.`,
      createdAt: new Date(Date.now() - (index * 3 + messageIndex) * 60000).toISOString(),
      status: "new" as const,
      stressCampaign: campaignId,
    }));
    await cacheStore.set(messageKey(listing.kind, listing.id), thread, MESSAGE_TTL_SECONDS);
    for (const email of [sender.email, recipient.email]) {
      const key = `${listing.kind}:${normalizeNotificationUserKey(email)}`;
      indexes.set(key, [...(indexes.get(key) || []), listing.id]);
    }
    messages += thread.length;
  }

  await Promise.all(Array.from(indexes.entries()).map(async ([key, listingIds]) => {
    const [kind, email] = key.split(":", 2) as [StressListing["kind"], string];
    const current = (await cacheStore.get<number[]>(userIndexKey(kind, email))) || [];
    await cacheStore.set(userIndexKey(kind, email), Array.from(new Set([...listingIds, ...current])).slice(0, 500), MESSAGE_TTL_SECONDS);
  }));

  let favorites = 0;
  for (let index = 0; index < 300; index++) {
    const user = users[index % users.length];
    const listing = listings[index % listings.length];
    const current = (await cacheStore.get<Array<Record<string, unknown>>>(savedItemsKey(user.email))) || [];
    current.unshift({
      key: `${listing.kind}:${listing.id}`,
      kind: listing.kind,
      itemId: String(listing.id),
      title: listing.title,
      description: "Favori de recette pour stress test.",
      createdAt: new Date().toISOString(),
      stressCampaign: campaignId,
    });
    await cacheStore.set(savedItemsKey(user.email), current.slice(0, 500), SAVED_ITEMS_TTL_SECONDS);
    favorites++;
  }

  const notifications = Array.from({ length: 400 }, (_, index) => {
    const user = users[index % users.length];
    const listing = listings[index % listings.length];
    return {
      userKey: normalizeNotificationUserKey(user.email),
      id: `stress:${campaignId}:notification:${index}`,
      kind: "system",
      title: "Notification de recette",
      body: `Activite de test pour ${listing.title}.`,
      href: "/profil/messages",
      createdAt: new Date(Date.now() - index * 60000).toISOString(),
      readAt: index % 3 === 0 ? new Date().toISOString() : null,
      metadata: { stressCampaign: campaignId, listingId: String(listing.id), channel: "stress-test" },
      updatedAt: new Date().toISOString(),
    };
  });

  if (isMongoConfigured()) {
    const collection = (await getMongoClient()).db(getMongoDbName()).collection("notifications");
    await collection.deleteMany({ "metadata.stressCampaign": campaignId });
    if (notifications.length) await collection.insertMany(notifications);
  }
  for (const user of users) {
    const own = notifications.filter((item) => item.userKey === normalizeNotificationUserKey(user.email));
    const current = (await cacheStore.get<Array<Record<string, unknown>>>(notificationKey(user.email))) || [];
    const retained = current.filter((item) => (item?.metadata as Record<string, unknown> | undefined)?.stressCampaign !== campaignId);
    await cacheStore.set(notificationKey(user.email), [...own, ...retained].slice(0, 100), NOTIFICATION_TTL_SECONDS);
  }

  return { messages, conversations: selectedListings.length, favorites, notifications: notifications.length };
}

async function cleanupCampaign(campaignId: string, users: StressUser[]) {
  let notifications = 0;
  if (isMongoConfigured()) {
    const collection = (await getMongoClient()).db(getMongoDbName()).collection("notifications");
    const result = await collection.deleteMany({ "metadata.stressCampaign": campaignId });
    notifications = result.deletedCount;
  }
  for (const user of users) {
    const saved = (await cacheStore.get<Array<Record<string, unknown>>>(savedItemsKey(user.email))) || [];
    await cacheStore.set(savedItemsKey(user.email), saved.filter((item) => item.stressCampaign !== campaignId), SAVED_ITEMS_TTL_SECONDS);
    const storedNotifications = (await cacheStore.get<Array<Record<string, unknown>>>(notificationKey(user.email))) || [];
    await cacheStore.set(notificationKey(user.email), storedNotifications.filter((item) => item?.metadata && (item.metadata as Record<string, unknown>).stressCampaign !== campaignId), NOTIFICATION_TTL_SECONDS);
    for (const kind of ["classified", "job", "tender"] as const) {
      const ids = (await cacheStore.get<number[]>(userIndexKey(kind, user.email))) || [];
      const retainedIds: number[] = [];
      for (const listingId of ids) {
        const key = messageKey(kind, listingId);
        const entries = (await cacheStore.get<Array<Record<string, unknown>>>(key)) || [];
        const next = entries.filter((item) => item.stressCampaign !== campaignId);
        if (next.length) {
          await cacheStore.set(key, next, MESSAGE_TTL_SECONDS);
          retainedIds.push(listingId);
        } else await cacheStore.delete(key);
      }
      if (retainedIds.length) await cacheStore.set(userIndexKey(kind, user.email), retainedIds, MESSAGE_TTL_SECONDS);
      else await cacheStore.delete(userIndexKey(kind, user.email));
    }
  }
  return { notifications, cleanedUsers: users.length };
}

async function seedBatch(campaignId: string, users: StressUser[], listings: StressListing[], offset: number, favoriteCount: number, notificationCount: number) {
  const indexes = new Map<string, number[]>();
  const messageWrites: Array<{ key: string; value: Array<Record<string, unknown>>; ttlSeconds: number }> = [];
  for (let index = 0; index < listings.length; index++) {
    const listing = listings[index];
    const sender = users[index % users.length];
    const recipient = users[(index + 1) % users.length];
    const thread = Array.from({ length: 3 }, (_, messageIndex) => ({
      id: `stress:${campaignId}:message:${offset + index}:${messageIndex}`,
      kind: listing.kind, listingId: listing.id,
      senderWpUserId: messageIndex % 2 === 0 ? sender.id : recipient.id,
      senderName: messageIndex % 2 === 0 ? sender.name : recipient.name,
      senderEmail: messageIndex % 2 === 0 ? sender.email : recipient.email,
      recipientEmail: messageIndex % 2 === 0 ? recipient.email : sender.email,
      content: `Message de recette ${messageIndex + 1} au sujet de ${listing.title}.`,
      createdAt: new Date(Date.now() - (offset + index) * 60000 - messageIndex * 1000).toISOString(),
      status: "new" as const, stressCampaign: campaignId,
    }));
    messageWrites.push({ key: messageKey(listing.kind, listing.id), value: thread, ttlSeconds: MESSAGE_TTL_SECONDS });
    for (const email of [sender.email, recipient.email]) {
      const key = `${listing.kind}:${normalizeNotificationUserKey(email)}`;
      indexes.set(key, [...(indexes.get(key) || []), listing.id]);
    }
  }
  // A 100-item stress batch previously incurred hundreds of remote cache round trips.
  await cacheStore.setMany(messageWrites);
  const indexInputs = Array.from(indexes.entries()).map(([compoundKey, listingIds]) => {
    const [kind, email] = compoundKey.split(":", 2) as [StressListing["kind"], string];
    return { kind, email, listingIds, key: userIndexKey(kind, email) };
  });
  const existingIndexes = await cacheStore.getMany<number[]>(indexInputs.map((entry) => entry.key));
  await cacheStore.setMany(indexInputs.map((entry, index) => ({
    key: entry.key,
    value: Array.from(new Set([...entry.listingIds, ...(existingIndexes[index] || [])])).slice(0, 500),
    ttlSeconds: MESSAGE_TTL_SECONDS,
  })));
  const favoritesByUser = new Map<string, Array<Record<string, unknown>>>();
  for (let index = 0; index < favoriteCount; index++) {
    const user = users[index % users.length]; const listing = listings[index % listings.length];
    const key = savedItemsKey(user.email);
    const items = favoritesByUser.get(key) || [];
    items.unshift({ key: `${listing.kind}:${listing.id}`, kind: listing.kind, itemId: String(listing.id), title: listing.title, description: "Favori de recette pour stress test.", createdAt: new Date().toISOString(), stressCampaign: campaignId });
    favoritesByUser.set(key, items);
  }
  const favoriteKeys = Array.from(favoritesByUser.keys());
  const currentFavorites = await cacheStore.getMany<Array<Record<string, unknown>>>(favoriteKeys);
  await cacheStore.setMany(favoriteKeys.map((key, index) => ({
    key,
    value: [...(favoritesByUser.get(key) || []), ...(currentFavorites[index] || [])].slice(0, 500),
    ttlSeconds: SAVED_ITEMS_TTL_SECONDS,
  })));
  const notifications = Array.from({ length: notificationCount }, (_, index) => {
    const user = users[index % users.length]; const listing = listings[index % listings.length];
    return { userKey: normalizeNotificationUserKey(user.email), id: `stress:${campaignId}:notification:${offset + index}`, kind: "system", title: "Notification de recette", body: `Activite de test pour ${listing.title}.`, href: "/profil/messages", createdAt: new Date().toISOString(), readAt: null, metadata: { stressCampaign: campaignId, listingId: String(listing.id), channel: "stress-test" }, updatedAt: new Date().toISOString() };
  });
  if (isMongoConfigured() && notifications.length) await (await getMongoClient()).db(getMongoDbName()).collection("notifications").insertMany(notifications, { ordered: false });
  const notificationsByUser = new Map<string, Array<Record<string, unknown>>>();
  notifications.forEach((notification) => {
    const key = notificationKey(notification.userKey);
    notificationsByUser.set(key, [...(notificationsByUser.get(key) || []), notification]);
  });
  const notificationKeys = Array.from(notificationsByUser.keys());
  const currentNotifications = await cacheStore.getMany<Array<Record<string, unknown>>>(notificationKeys);
  await cacheStore.setMany(notificationKeys.map((key, index) => ({
    key,
    value: [...(notificationsByUser.get(key) || []), ...(currentNotifications[index] || [])].slice(0, 100),
    ttlSeconds: NOTIFICATION_TTL_SECONDS,
  })));
  return { conversations: listings.length, messages: listings.length * 3, favorites: favoriteCount, notifications: notificationCount };
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request) || !isStagingRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = (await request.json().catch(() => null)) as StressPayload | null;
  const campaignId = String(payload?.campaignId || "").trim();
  const users = normalizeUsers(payload?.users);
  const listings = normalizeListings(payload?.listings);
  if (!/^[a-f0-9-]{36}$/i.test(campaignId) || (payload?.action !== "cleanup-finalize" && users.length === 0)) {
    return NextResponse.json({ error: "Invalid stress-test payload" }, { status: 400 });
  }
  if (payload?.action === "seed") {
    if (listings.length === 0) return NextResponse.json({ error: "No stress-test listings supplied" }, { status: 400 });
    return NextResponse.json({ ok: true, ...(await seedCampaign(campaignId, users, listings)), requestId: randomUUID() });
  }
  if (payload?.action === "cleanup") return NextResponse.json({ ok: true, ...(await cleanupCampaign(campaignId, users)) });
  if (payload?.action === "cleanup-batch") return NextResponse.json({ ok: true, ...(await cleanupCampaign(campaignId, users)) });
  if (payload?.action === "cleanup-finalize") {
    let notifications = 0;
    if (isMongoConfigured()) {
      const result = await (await getMongoClient()).db(getMongoDbName()).collection("notifications").deleteMany({ "metadata.stressCampaign": campaignId });
      notifications = result.deletedCount;
    }
    return NextResponse.json({ ok: true, notifications });
  }
  if (payload?.action === "seed-batch") {
    if (listings.length === 0 || listings.length > 100) return NextResponse.json({ error: "Invalid stress-test batch" }, { status: 400 });
    const offset = Math.max(0, Math.floor(Number(payload.offset) || 0));
    const favorites = Math.min(200, Math.max(0, Math.floor(Number(payload.favorites) || 0)));
    const notifications = Math.min(200, Math.max(0, Math.floor(Number(payload.notifications) || 0)));
    return NextResponse.json({ ok: true, ...(await seedBatch(campaignId, users, listings, offset, favorites, notifications)), requestId: randomUUID() });
  }
  return NextResponse.json({ error: "Invalid stress-test action" }, { status: 400 });
}
