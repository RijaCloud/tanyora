import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/lib/auth/session";
import { isEmailVerificationRequired } from "@/lib/auth/email-verification";
import { getWordPressPublicListings } from "@/lib/api/wordpress-internal";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { addSavedItem, getSavedItems, isSavedItem, removeSavedItem, type SavedItemKind, toggleSavedItem } from "@/lib/saved-items/store";

const savedItemPayloadSchema = z.object({
  kind: z.enum(["article", "job", "tender", "classified", "directory", "radio"]),
  itemId: z.string().trim().min(1).max(100),
  slug: z.string().trim().max(240).optional(),
  title: z.string().trim().min(1).max(220),
  description: z.string().trim().max(5000).optional(),
  image: z.string().trim().max(1500).optional(),
  location: z.string().trim().max(240).optional(),
  price: z.string().trim().max(120).optional(),
  sourceLabel: z.string().trim().max(160).optional(),
});

const savedItemActionSchema = z.object({
  action: z.enum(["toggle", "add", "remove"]).default("toggle"),
  item: savedItemPayloadSchema,
});

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;
const MAX_LOOKUP_KEYS = 50;
const savedItemKinds = new Set<SavedItemKind>(["article", "job", "tender", "classified", "directory", "radio"]);

function buildUserKey(session: NonNullable<ReturnType<typeof getServerSession>>): string {
  return String(session.wpUserId || session.email || "").trim();
}

export async function GET(request: NextRequest) {
  const session = getServerSession();
  if (!session?.email) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  const readLimit = await consumeRateLimit({
    scope: "saved-items-read",
    subject: `${buildUserKey(session)}:${getClientIp(request)}`,
    limit: 180,
    windowSeconds: 60,
  });
  if (!readLimit.allowed) {
    return NextResponse.json({ error: "Trop de requetes." }, { status: 429 });
  }

  const kind = request.nextUrl.searchParams.get("kind");
  const itemId = request.nextUrl.searchParams.get("itemId");
  const lookupKeys = request.nextUrl.searchParams
    .get("keys")
    ?.split(",")
    .map((key) => key.trim())
    .filter(Boolean)
    .slice(0, MAX_LOOKUP_KEYS);
  const userKey = buildUserKey(session);
  if (!userKey) {
    return NextResponse.json({ error: "Session invalide." }, { status: 401 });
  }

  if (kind && itemId) {
    const saved = await isSavedItem(userKey, kind as SavedItemKind, itemId);
    return NextResponse.json({ saved });
  }

  if (lookupKeys?.length) {
    const requestedKeys = lookupKeys.filter((key) => {
      const separator = key.indexOf(":");
      const requestedKind = key.slice(0, separator) as SavedItemKind;
      const requestedItemId = key.slice(separator + 1);
      return separator > 0 && savedItemKinds.has(requestedKind) && requestedItemId.length > 0 && requestedItemId.length <= 100;
    });
    const savedKeys = new Set((await getSavedItems(userKey)).map((item) => `${item.kind}:${item.itemId}`));

    return NextResponse.json({ savedKeys: requestedKeys.filter((key) => savedKeys.has(key)) });
  }

  const requestedPage = Number.parseInt(request.nextUrl.searchParams.get("page") || "1", 10);
  const requestedPerPage = Number.parseInt(request.nextUrl.searchParams.get("perPage") || String(DEFAULT_PAGE_SIZE), 10);
  const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
  const perPage = Number.isFinite(requestedPerPage)
    ? Math.min(MAX_PAGE_SIZE, Math.max(1, requestedPerPage))
    : DEFAULT_PAGE_SIZE;
  const items = (await getSavedItems(userKey)).filter((item) => !kind || item.kind === kind);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const resolvedPage = Math.min(page, totalPages);
  const start = (resolvedPage - 1) * perPage;
  return NextResponse.json({
    items: items.slice(start, start + perPage),
    total,
    page: resolvedPage,
    perPage,
    totalPages,
  });
}

export async function POST(request: NextRequest) {
  const session = getServerSession();
  if (!session?.email) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  if (isEmailVerificationRequired(session)) {
    return NextResponse.json({ error: "Verifiez votre email avant d'enregistrer des elements." }, { status: 403 });
  }

  const writeLimit = await consumeRateLimit({
    scope: "saved-items-write",
    subject: `${buildUserKey(session)}:${getClientIp(request)}`,
    limit: 60,
    windowSeconds: 60,
  });
  if (!writeLimit.allowed) {
    return NextResponse.json({ error: "Trop de requetes." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = savedItemActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
  }

  const userKey = buildUserKey(session);
  if (!userKey) {
    return NextResponse.json({ error: "Session invalide." }, { status: 401 });
  }

  const { action, item } = parsed.data;

  const addingIntent = action === "add" || (action === "toggle" && !(await isSavedItem(userKey, item.kind, item.itemId)));
  if (addingIntent && item.kind === "classified") {
    const listingId = Number.parseInt(item.itemId, 10);
    if (!Number.isFinite(listingId) || listingId <= 0) {
      return NextResponse.json({ error: "Identifiant annonce invalide." }, { status: 400 });
    }

    const listingResult = await getWordPressPublicListings("classified", { id: listingId, perPage: 1 }).catch(() => null);
    const listing = listingResult?.items?.[0];
    if (!listing) {
      return NextResponse.json({ error: "Annonce introuvable." }, { status: 404 });
    }

    const ownerEmail = String(listing.contactEmail || "").trim().toLowerCase();
    const viewerEmail = String(session.email || "").trim().toLowerCase();
    if (ownerEmail && viewerEmail && ownerEmail === viewerEmail) {
      return NextResponse.json({ error: "Vous ne pouvez pas enregistrer votre propre annonce." }, { status: 403 });
    }
  }

  if (action === "add") {
    const items = await addSavedItem(userKey, item);
    return NextResponse.json({ saved: true, items });
  }
  if (action === "remove") {
    const items = await removeSavedItem(userKey, item.kind, item.itemId);
    return NextResponse.json({ saved: false, items });
  }

  const result = await toggleSavedItem(userKey, item);
  return NextResponse.json(result);
}
