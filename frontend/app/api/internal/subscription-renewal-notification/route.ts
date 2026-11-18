import { randomUUID, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { dispatchEmail } from "@/lib/notifications/email-dispatcher";
import { addNotification, normalizeNotificationUserKey } from "@/lib/notifications/store";

function authorized(request: NextRequest) {
  const expected = process.env.PLATFORM_SUBMISSIONS_SECRET?.trim();
  const received = request.headers.get("x-2424-internal-secret")?.trim();
  if (!expected || !received) return false;
  const a = Buffer.from(expected); const b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}
function text(value: unknown, max = 300) { return String(value || "").trim().slice(0, max); }

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const email = text(payload?.recipientEmail, 254).toLowerCase();
  const name = text(payload?.recipientName, 120);
  const plan = text(payload?.planLabel, 40) || "votre formule";
  const timing = text(payload?.timing, 20) === "expired" ? "expired" : "expiring";
  if (!email.includes("@")) return NextResponse.json({ ok: false, error: "Invalid recipient" }, { status: 400 });
  const title = timing === "expired" ? `Votre accès ${plan} a expiré` : `Votre accès ${plan} expire dans 7 jours`;
  const body = timing === "expired" ? "Renouvelez votre formule pour conserver vos avantages." : "Renouvelez votre formule dès maintenant pour conserver vos avantages sans interruption.";
  await addNotification(normalizeNotificationUserKey(email), { id: `subscription-renewal:${timing}:${randomUUID()}`, kind: "system", title, body, href: "/tarifs", createdAt: new Date().toISOString(), metadata: { channel: "subscription-renewal", timing } });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_BASE_URL || "https://tanyora.mijary.tech";
  const emailResult = await dispatchEmail({ eventName: "notification.activity.v1", recipient: { email, name: name || undefined }, templateData: { title, subject: title, preheader: body, introLine: body, activityLabel: "vous invite à renouveler votre accès", entityTitle: plan, activityTimeLabel: "Maintenant", ctaLabel: "Renouveler ma formule", ctaUrl: new URL("/tarifs", siteUrl).toString(), siteUrl }, metadata: { channel: "subscription-renewal", timing } });
  return NextResponse.json({ ok: true, emailSent: emailResult.ok });
}
