import { randomUUID, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { dispatchEmail } from "@/lib/notifications/email-dispatcher";
import { addNotification, normalizeNotificationUserKey } from "@/lib/notifications/store";

type ModerationPayload = {
  recipientEmail?: unknown;
  recipientName?: unknown;
  listingId?: unknown;
  listingTitle?: unknown;
  listingType?: unknown;
  listingLabel?: unknown;
  message?: unknown;
  moderatorName?: unknown;
  href?: unknown;
};

function isAuthorized(request: NextRequest) {
  const expected = process.env.PLATFORM_SUBMISSIONS_SECRET?.trim();
  const received = request.headers.get("x-2424-internal-secret")?.trim();
  if (!expected || !received) return false;

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

function text(value: unknown, maxLength: number) {
  return String(value || "").trim().slice(0, maxLength);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as ModerationPayload | null;
  const recipientEmail = text(payload?.recipientEmail, 254).toLowerCase();
  const recipientName = text(payload?.recipientName, 120);
  const listingId = Number.parseInt(text(payload?.listingId, 20), 10);
  const listingTitle = text(payload?.listingTitle, 300);
  const listingLabel = text(payload?.listingLabel, 100) || "votre publication";
  const message = text(payload?.message, 3000);
  const moderatorName = text(payload?.moderatorName, 120) || "L'équipe Tanyora";
  const href = text(payload?.href, 500);

  if (!recipientEmail || !recipientEmail.includes("@") || !Number.isFinite(listingId) || listingId <= 0 || !listingTitle || !message || !href.startsWith("/")) {
    return NextResponse.json({ ok: false, error: "Invalid moderation payload" }, { status: 400 });
  }

  const createdAt = new Date().toISOString();
  const notificationId = `moderation:${listingId}:${randomUUID()}`;
  const title = `Action requise pour "${listingTitle}"`;
  const body = `Un administrateur a signale ${listingLabel}. ${message}`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_BASE_URL || "https://tanyora.mijary.tech";
  const destinationUrl = new URL(href, siteUrl).toString();

  await addNotification(normalizeNotificationUserKey(recipientEmail), {
    id: notificationId,
    kind: "system",
    title,
    body,
    href,
    createdAt,
    metadata: {
      channel: "moderation",
      listingId: String(listingId),
      listingType: text(payload?.listingType, 40),
    },
  });

  const emailResult = await dispatchEmail({
    eventName: "notification.activity.v1",
    recipient: { email: recipientEmail, name: recipientName || undefined },
    templateData: {
      title: "Votre publication nécessite une action",
      subject: title,
      preheader: `Un administrateur a laisse un commentaire au sujet de ${listingTitle}.`,
      introLine: `Un administrateur a signale ${listingLabel}.`,
      actorName: moderatorName,
      activityLabel: "a laisse un commentaire de moderation",
      entityTitle: listingTitle,
      moderationMessage: message,
      activityTimeLabel: "A l'instant",
      ctaLabel: "Voir ma publication",
      ctaUrl: destinationUrl,
      siteUrl,
    },
    metadata: {
      channel: "moderation",
      listingId: String(listingId),
      listingType: text(payload?.listingType, 40),
    },
  });

  return NextResponse.json({ ok: true, notificationId, emailSent: emailResult.ok });
}
